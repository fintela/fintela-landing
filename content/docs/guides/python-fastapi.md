---
title: Python · FastAPI
section: Integration Guides
sectionOrder: 9
order: 1
published: true
updated: 2026-08-18
summary: Host external strategy and fitness endpoints with FastAPI.
keywords: fastapi, python, uvicorn, guide, external, simulate, evaluate, docker, deploy, production
---

One FastAPI app can serve both halves of Fintela's external contract: `POST /simulate`, which
turns a parameter sample and a date window into a signal, and `POST /evaluate`, which turns one
simulated period into one number. This page is the complete server — request models, both
handlers, the health route Fintela probes before a live extend, and the deployment settings that
keep it from being pruned mid-study. The contracts themselves are specified in
[External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness);
everything here implements them literally.

## What you are building

Fintela stores three things per external record — `endpoint`, `timeout`, `max_concurrency` — and
appends a fixed path to the endpoint on every call. Nothing else about your service is known to
the platform: no code, no schema, no credentials.

```text
study trial
  │
  ├─ POST {strategy_endpoint}/simulate?start_date=…&end_date=…
  │     body   {"<param>": <sampled value>, …, "tickers": ["AAPL", …]}
  │     reply  {"signal": {"2025-01-02": {"AAPL": {"position": "L", "allocation": 0.25}}}}
  │
  ├─ Fintela simulates the signal, builds the portfolio, computes period metrics
  │
  └─ POST {fitness_endpoint}/evaluate?<param>=<constant>&…      3x, or 4x with out-of-sample
        body   {"equity": …, "holdings": …, "orders": …, "trades": …, "metrics": …}
        reply  {"fitness": 1.42}
```

Serving both from one app is supported and is what the example below does. It has one
consequence worth knowing before you start: when the strategy and the fitness function carry the
same endpoint — compared after trimming, dropping a trailing slash and lowercasing — the
dispatcher halves the worker budget to `min(strategy, fitness) / 2`, floored, minimum 1.

## The two contracts

The two endpoints are mirror images of each other. Read the row for the query string twice.

| | `/simulate` | `/evaluate` |
|---|---|---|
| Method | `POST` | `POST` |
| URL | `{endpoint}` + `/simulate` | `{endpoint}` + `/evaluate` |
| Query string | `start_date`, `end_date`, both `YYYY-MM-DD` | one key per declared fitness parameter |
| JSON body | one key per declared strategy parameter, plus `tickers` | the five-key simulation period |
| Success body | `{"signal": {date: {ticker: {position, allocation}}}}` | `{"fitness": 1.42}` |
| Read from the reply | only the `signal` key | only the `fitness` key |
| Calls per trial | 1 | 3, or 4 when the study has an out-of-sample window |
| Also called by | validation (twice), the sandbox, the daily live extend | validation, the sandbox, the live extend, the metrics updater |

One more route exists, and only for strategies: before a [live portfolio](/docs/live-trading)
generates the day's signal, the updater sends `GET {endpoint}/health` with a **5-second** timeout
and requires a 2xx. A failure aborts that day's update with
`External strategy API health check failed: {reason}`. External fitness functions are never
health-probed.

> [!WARNING] The query-string/body split is inverted between them
> `/simulate` takes its dates in the query string and its parameters in the body. `/evaluate`
> takes its parameters in the query string and its payload in the body. If you serve both from
> one app, do not copy one handler into the other.

## Install

```bash
python -m venv .venv && . .venv/bin/activate
pip install "fastapi==0.115.8" "uvicorn[standard]==0.34.0" "pydantic==2.10.6" \
            "pandas==2.2.3" numpy gunicorn "uvicorn-worker==0.3.0"
```

These versions are a tested starting point, not a requirement — Fintela speaks plain HTTP/1.1
and JSON to your service and has no opinion about your dependencies. `gunicorn` and
`uvicorn-worker` are only needed for the production launch command further down.

## The server

A single `main.py`. Two blocks are yours to replace — `load_price_panel`, which is your data, and
`momentum_signal`, which is your alpha. Everything else is contract code and stays as written.

```python
"""Fintela external endpoints — one FastAPI app serving both contracts.

POST {base}/simulate   dates in the query string, parameters in the JSON body
POST {base}/evaluate   parameters in the query string, simulation in the JSON body
GET  {base}/health     liveness, probed before a live portfolio's daily extend
"""

from __future__ import annotations

import json
import math
import os
from datetime import date
from typing import Any, Literal

import numpy as np
import pandas as pd
from fastapi import APIRouter, FastAPI, HTTPException, Query, Response
from pydantic import BaseModel, ConfigDict, Field

# An unguessable path segment is the only access control this contract allows:
# Fintela sends no credentials, so anything that answers 401 prunes every trial.
# Register https://api.example.com<PREFIX> as the endpoint on both records.
PREFIX = os.getenv("FINTELA_PREFIX", "")

# The interactive docs and the schema stay mounted at the ROOT even when the
# router carries a prefix, so /openapi.json would hand the secret segment to
# anyone who asks for it. Turn all three off.
app = FastAPI(
    title="Fintela external endpoints",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
router = APIRouter(prefix=PREFIX)


# ---------------------------------------------------------------------------
# Your data. This function and momentum_signal() below are the two blocks you
# replace; from the /simulate section down it is all contract code.
# ---------------------------------------------------------------------------

def load_price_panel() -> pd.DataFrame:
    """A wide panel: DatetimeIndex of trading days x ticker columns of prices.

    Swap this for your own feed. The synthetic fallback exists so the server
    starts before anything is wired up.
    """
    path = os.getenv("PRICE_PANEL_CSV")
    if path:
        panel = pd.read_csv(path, index_col=0, parse_dates=True)
    else:
        rng = np.random.default_rng(0)
        days = pd.bdate_range("2015-01-01", "2027-12-31")
        codes = ["AAPL", "AMZN", "GOOGL", "MSFT", "NVDA"]
        steps = rng.normal(0.0004, 0.012, size=(len(days), len(codes)))
        panel = pd.DataFrame(
            100.0 * np.exp(steps.cumsum(axis=0)), index=days, columns=codes
        )
    return panel.sort_index().ffill()


PANEL = load_price_panel()


# ---------------------------------------------------------------------------
# Signal helpers
# ---------------------------------------------------------------------------

def unit_budget(raw: dict[str, float]) -> dict[str, float]:
    """Coerce raw weights into what Fintela's signal validator accepts.

    Every allocation must be finite, greater than zero and at most 1, and the
    allocations on one date must sum to at most 1 + 1e-6. A zero weight is a
    rejection, not a no-op, so drop those assets instead of emitting them.
    """
    positive = {
        code: float(weight)
        for code, weight in raw.items()
        if math.isfinite(float(weight)) and float(weight) > 0
    }
    if not positive:
        return {}

    total = sum(positive.values())
    scaled = {code: round(weight / total, 6) for code, weight in positive.items()}
    scaled = {code: weight for code, weight in scaled.items() if weight > 0}
    if not scaled:
        return {}

    excess = sum(scaled.values()) - 1.0
    if excess > 0:
        heaviest = max(scaled, key=scaled.__getitem__)
        trimmed = round(scaled[heaviest] - excess, 6)
        if trimmed > 0:
            scaled[heaviest] = trimmed
        else:
            del scaled[heaviest]
    return scaled


def momentum_signal(
    panel: pd.DataFrame,
    start: date,
    end: date,
    lookback: int,
    n_top: int,
    rebalance_days: int,
    universe: list[str] | None,
) -> dict[str, dict[str, dict[str, Any]]]:
    """Long the n_top strongest trailing returns, rebalanced every N bars."""
    columns = [c for c in panel.columns if universe is None or c in universe]
    if not columns:
        return {}

    prices = panel.loc[panel.index <= pd.Timestamp(end), columns]
    # Trailing return only — the value on row d is a function of rows <= d, so
    # extending end_date cannot change a past date's output.
    trailing = prices / prices.shift(lookback) - 1.0
    window = trailing.loc[trailing.index >= pd.Timestamp(start)]

    signal: dict[str, dict[str, dict[str, Any]]] = {}
    for stamp in window.index[::rebalance_days]:
        scores = window.loc[stamp].dropna()
        winners = scores[scores > 0].nlargest(n_top)
        weights = unit_budget({code: 1.0 for code in winners.index})
        if weights:
            signal[stamp.strftime("%Y-%m-%d")] = {
                code: {"position": "L", "allocation": weight}
                for code, weight in weights.items()
            }
    return signal


# ---------------------------------------------------------------------------
# /simulate
# ---------------------------------------------------------------------------

class SimulateBody(BaseModel):
    """The JSON body of POST /simulate.

    One key per parameter declared on the strategy record, plus the additive
    `tickers` key Fintela sends when the call has a resolved universe — always
    in a study, only with a validation universe at validation time. Extras are
    allowed on purpose: the body is additive, and extra="forbid" would turn any
    key Fintela adds later into a 422 that prunes every trial.
    """

    model_config = ConfigDict(extra="allow")

    lookback: int = Field(ge=2, le=500)
    n_top: int = Field(ge=1, le=50)
    rebalance_days: int = Field(ge=1, le=250)
    tickers: list[str] | None = None


class Trade(BaseModel):
    position: Literal["L", "S"]
    allocation: float = Field(gt=0, le=1)


class SignalResponse(BaseModel):
    signal: dict[str, dict[str, Trade]]


@router.post("/simulate", response_model=SignalResponse)
def simulate(
    body: SimulateBody,
    start_date: date = Query(...),
    end_date: date = Query(...),
) -> SignalResponse:
    signal = momentum_signal(
        PANEL,
        start=start_date,
        end=end_date,
        lookback=body.lookback,
        n_top=body.n_top,
        rebalance_days=body.rebalance_days,
        universe=body.tickers,
    )
    if not signal:
        raise HTTPException(
            status_code=422,
            detail=(
                f"No rebalance date between {start_date} and {end_date} produced "
                "a position; Fintela rejects an empty signal."
            ),
        )
    return SignalResponse(signal=signal)


# ---------------------------------------------------------------------------
# /evaluate
# ---------------------------------------------------------------------------

class SimulationPeriod(BaseModel):
    """The JSON body of POST /evaluate — the five keys the period slicer emits."""

    model_config = ConfigDict(extra="allow")

    equity: dict[str, float] = Field(default_factory=dict)
    holdings: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)
    orders: list[dict[str, Any]] = Field(default_factory=list)
    trades: list[dict[str, Any]] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)


def metric(metrics: dict[str, Any], name: str) -> float | None:
    """Read one metric defensively: any value may be absent or null, and the
    validation fixture carries a different key set from a real study."""
    value = metrics.get(name)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    value = float(value)
    return value if math.isfinite(value) else None


def fitness_response(value: float) -> Response:
    """Serialise {"fitness": ...} by hand.

    Starlette's JSONResponse renders with allow_nan=False and raises on a NaN.
    Every Fintela caller parses the body with Python's json.loads, which does
    accept the bare NaN token, and NaN is the supported way to say "this period
    is not scoreable" — it prunes the trial as nan_fitness instead of feeding
    the search a fabricated number.
    """
    return Response(
        content=json.dumps({"fitness": value}, allow_nan=True),
        media_type="application/json",
    )


@router.post("/evaluate")
def evaluate(
    simulation: SimulationPeriod,
    risk_free: float = Query(0.0),
    drawdown_weight: float = Query(1.0),
) -> Response:
    sharpe = metric(simulation.metrics, "sharpe_ratio")
    drawdown = metric(simulation.metrics, "max_drawdown")
    if sharpe is None or drawdown is None or not simulation.trades:
        return fitness_response(math.nan)
    return fitness_response(sharpe - drawdown_weight * abs(drawdown) + risk_free)


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "panel_end": PANEL.index[-1].strftime("%Y-%m-%d")}


app.include_router(router)
```

### Why the handlers are written this way

| Choice | Reason |
|---|---|
| `def`, not `async def` | A sync path operation runs in the threadpool; blocking pandas work inside `async def` stalls every other request on that worker and shows up as a read timeout. |
| `start_date: date = Query(...)` | FastAPI parses `YYYY-MM-DD` into a `date` and answers 422 on anything else, so a malformed window fails loudly instead of silently. |
| `extra="allow"` on `SimulateBody` | The body is additive — `tickers` is already one such key. Forbidding extras turns any key Fintela adds later into a 422 that prunes every trial. |
| `tickers` filters the universe | Every ticker your signal names must exist in the study's [asset group](/docs/asset-groups). Scoping to the list Fintela sends makes that impossible to violate. |
| Trailing return only, panel truncated at `end_date` | Validation calls `/simulate` twice, the second time with `end_date` pushed **730 days** out, and rejects the save if any past date's tickers, `position` or `allocation` moved. |
| `unit_budget` before emitting | The validator rejects an allocation that is zero, negative, non-finite or above 1, and rejects a date whose allocations sum above `1 + 1e-6`. |
| `response_model=SignalResponse` | Turns an internal shape bug into a 500 in your own logs rather than a `EXTERNAL_BAD_RESPONSE` prune whose cause is invisible from your side. |
| Hand-serialised `fitness` | Starlette refuses to render NaN, and NaN is the only clean way to report an unscoreable period. |
| `metric()` for every metrics read | Any metric value may be `null`, and the validation fixture's `metrics` uses `cagr` where a real study uses `compound_annual_growth_rate`. |

> [!CAUTION] Never declare a strategy parameter named `tickers`
> It collides with the universe key. At validation your parameter wins and the universe is not
> forwarded, with the warning *"validation_universe tickers were not forwarded to the endpoint: a
> strategy parameter named 'tickers' already occupies that body key."* In a study the universe
> overwrites your parameter instead. Pick another name.

> [!NOTE] 422 versus an empty signal
> Returning 422 with a `detail` puts the reason straight into the validation error — the
> compiler reports `Endpoint returned HTTP 422: {first 500 characters of your body}`, which is
> exactly when you want it. Inside a running study the same 422 classifies as
> `ENDPOINT_REJECTED_REQUEST` with generic copy, whereas answering `200` with `{"signal": {}}`
> classifies as *"Your strategy produced no positions for any date in the study window"*. Pick
> whichever failure you would rather read; both prune the trial.

## Running it

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --timeout-keep-alive 65
```

For production, put a supervisor in front of the workers so a recycle queues connections instead
of refusing them. This is the launch line Fintela's own Python services use, adapted:

```bash
gunicorn main:app \
    --worker-class uvicorn_worker.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --keep-alive 65 \
    --timeout 120 \
    --graceful-timeout 30 \
    --max-requests 1000 \
    --max-requests-jitter 200 \
    --access-logfile - --error-logfile -
```

`--keep-alive` on the gunicorn side is uvicorn's `timeout_keep_alive`. `--timeout` is the
arbiter's worker-kill budget and must exceed the **Timeout (seconds)** you set on the Fintela
record, or gunicorn will kill a worker that is still legitimately working.

> [!NOTE] Each worker loads its own panel
> `PANEL` is built at import time, and gunicorn does not preload by default, so four workers
> hold four copies. Size the machine for that, or move the panel behind a shared store.

## Testing it before you register

Reproduce every call Fintela makes, in the order it makes them. Start with the strategy window:

```bash
curl -X POST "http://localhost:8000/simulate?start_date=2025-01-01&end_date=2025-06-30" \
     -H "Content-Type: application/json" \
     -d '{"lookback": 60, "n_top": 6, "rebalance_days": 21}'
```

Then the causality probe — the same call with `end_date` pushed 730 days out. Every date present
in the first response must come back byte-identical in the second:

```bash
curl -X POST "http://localhost:8000/simulate?start_date=2025-01-01&end_date=2027-06-30" \
     -H "Content-Type: application/json" \
     -d '{"lookback": 60, "n_top": 6, "rebalance_days": 21}'
```

Then the universe key, which a study always sends:

```bash
curl -X POST "http://localhost:8000/simulate?start_date=2025-01-01&end_date=2025-06-30" \
     -H "Content-Type: application/json" \
     -d '{"lookback": 60, "n_top": 6, "rebalance_days": 21, "tickers": ["AAPL", "MSFT"]}'
```

Then the fitness call, with the parameters in the query string:

```bash
curl -X POST "http://localhost:8000/evaluate?risk_free=0.02&drawdown_weight=1.5" \
     -H "Content-Type: application/json" \
     -d '{"equity": {"2025-01-02": 100000}, "holdings": {}, "orders": [],
          "trades": [{"ticker_code": "AAPL", "entry_date": "2025-01-02"}],
          "metrics": {"sharpe_ratio": 1.2, "max_drawdown": -0.1}}'
```

And the degenerate period, which must answer `{"fitness": NaN}` rather than an error:

```bash
curl -X POST "http://localhost:8000/evaluate" \
     -H "Content-Type: application/json" \
     -d '{"equity": {}, "holdings": {}, "orders": [], "trades": [], "metrics": {}}'
```

Finally the probe the live extend uses:

```bash
curl -i http://localhost:8000/health
```

## Production checklist

| Setting | Value | Why |
|---|---|---|
| Keep-alive timeout | **at least 30 s** | Fintela's clients hold pooled connections with a 30-second keep-alive expiry. Uvicorn defaults to 5 s and closes first. |
| Worker processes | at least the record's **Max Concurrency** | The optimizer runs one task whose process pool is that size, and each pool worker holds one in-flight request. |
| Handler style | sync `def` for CPU-bound work | Blocking inside `async def` serialises the whole worker. |
| Server timeout | greater than the record's **Timeout (seconds)** | A supervisor that kills the worker first turns a slow answer into a dropped connection. |
| `/health` | cheap, 2xx, under 5 s | Strategy records only, and only on the live-portfolio path. |
| Route paths | no trailing slash | Redirects are never followed; a 307 from a slash mismatch fails the call. |
| Proxy body limit | raise it | `/evaluate` bodies carry a whole period's equity, holdings, orders and trades. nginx's `client_max_body_size` defaults to 1 MB. |
| Scheme | `http` or `https` | Both are accepted. See below. |
| Credentials | none are sent | See below. |

### Workers and concurrency

**Max Concurrency is not a connection limit.** Each Fintela worker process holds its own HTTP
client whose pool is capped at 2 connections, whatever you set. It is the worker budget the
dispatcher gives a study that has an external component, and the dispatcher's own comment is the
specification: a single task whose process pool is sized to that budget, so *"the user's strategy
server sees exactly `max_concurrency` in-flight POSTs"*.

| Situation | Budget |
|---|---|
| No external component | Not used — the study gets its default task layout |
| Only the strategy is external | the strategy's `max_concurrency` |
| Only the fitness is external | the fitness function's `max_concurrency` |
| Both external, different endpoints | `min(strategy, fitness)` |
| Both external, same endpoint | `min(strategy, fitness) / 2`, floored, minimum 1 |
| Missing or not positive | Treated as unbounded; the study falls back to the internal layout |

Whatever the budget, the optimizer caps a batch at **32** for external studies, so a value above
32 buys nothing. Size Max Concurrency to the number of workers you actually run: a budget your
service cannot hold arrives as a burst and surfaces as refused connections on pruned trials.

Remember the traffic ratio when both endpoints live in the same app — one `/simulate` call per
trial against three or four `/evaluate` calls.

### Timeouts

| Caller | Timeout it uses | Retries |
|---|---|---|
| Compiler validation | fixed **30 s** — the record's `timeout` is ignored | 1 attempt + 2 retries, linear backoff 1 s then 2 s |
| Sandbox, optimizer, live updater | the record's `timeout` (the sandbox falls back to 60 s if a record carries none) | 1 attempt + 3 retries, full-jitter exponential backoff, base 1 s, ceiling 8 s |

The sandbox, the optimizer and the live updater retry connect errors, connect timeouts, pool
timeouts, protocol errors and HTTP **429, 502, 503, 504**. They deliberately do **not** retry a
read timeout: the request was accepted, so retrying only doubles the load on an already-slow
service. Compiler validation is the exception — it sends a single request, so its retry set
*does* include read timeouts.

Raising **Timeout (seconds)** does not lengthen the 30-second validation timeout. If a validation
window will not fit in 30 seconds, shrink the window with a validation universe date range
instead.

### TLS

`http://` is accepted. Typing one into the editor shows a warning-coloured helper text —
*"Unencrypted (http://) — the request and your endpoint's reply travel in cleartext. Fine for
testing; use https:// in production."* — but it never sets a field error and never blocks Save.
What is enforced is that the host is publicly routable, not that the scheme is TLS. There is no
port allowlist either.

Over plain `http` the parameter samples, the signal, and — if you serve `/evaluate` too — the
entire simulation result cross the network unencrypted.

### Authentication

**Fintela sends no credentials.** There is no API-key field, no header configuration, no bearer
token and no request signing on an external record; requests arrive with a JSON content type and
no `Authorization` header. An endpoint that answers unauthenticated calls with 401 or 403 prunes
every trial as `ENDPOINT_REJECTED_REQUEST`, so a scheme Fintela cannot satisfy is not an option.

The one lever the contract leaves you is the URL. `FINTELA_PREFIX` in the server above mounts all
three routes under a path segment of your choosing, and that segment survives into every call
because Fintela appends `/simulate`, `/evaluate` and `/health` to whatever base path you
registered:

```bash
FINTELA_PREFIX=/7f3c9a1e2b4d uvicorn main:app --host 0.0.0.0 --port 8000 \
    --workers 4 --timeout-keep-alive 65
```

Register `https://api.example.com/7f3c9a1e2b4d` and Fintela calls
`https://api.example.com/7f3c9a1e2b4d/simulate`. Combine it with an IP allowlist at your edge if
your platform offers one.

## Container image

`requirements.txt`:

```text
fastapi==0.115.8
uvicorn[standard]==0.34.0
uvicorn-worker==0.3.0
gunicorn==26.0.0
pydantic==2.10.6
pandas==2.2.3
numpy
```

`Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

RUN useradd --uid 10001 --no-create-home app
USER 10001

EXPOSE 8000

CMD ["gunicorn", "main:app", \
     "--worker-class", "uvicorn_worker.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--keep-alive", "65", \
     "--timeout", "120", \
     "--graceful-timeout", "30", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "200", \
     "--access-logfile", "-", "--error-logfile", "-"]
```

Build, push and expose it anywhere that gives you a publicly routable host:

```bash
docker build -t my-fintela-endpoints:latest .
docker push registry.example.com/my-fintela-endpoints:latest
```

The address screen runs twice — once when you save the record, without any network call, and
again before the first connection from each caller, resolving the host and classifying **every**
address it returns. Private, loopback, link-local, reserved, multicast and unspecified addresses
are all refused, and a host that answers with both a public and a private record is refused too.
A tunnel to your laptop will not work; publish the service.

## Registering the two records

Create the strategy from the [Strategies registry](/docs/strategies) and the fitness function
from the [Fitness Functions registry](/docs/fitness-functions), picking **External** on the
segmented control in each editor header. The control is enabled only while creating — there is no
conversion path from Internal to External on an existing record.

Both editors expose the same three fields, with the same defaults and slightly different
validation copy:

| Field | Label | Default | Message on the strategy editor | Message on the fitness editor |
|---|---|---|---|---|
| `endpoint` | **Endpoint** | empty | `Endpoint is required` | `Endpoint is required` |
| `max_concurrency` | **Max Concurrency** | `4` | `Must be a positive integer` | `Must be ≥ 1` |
| `timeout` | **Timeout (seconds)** | `30` | `Must be a positive integer` | `Must be ≥ 1` |

The placeholders differ too — `https://api.example.com/strategy` and
`https://api.example.com/fitness` — and both are base URLs: Fintela strips a trailing slash and
appends the path itself.

Then declare the parameters, which is where your handler signature becomes the wire format:

| In the server | Declared as | Arrives as |
|---|---|---|
| `lookback` | strategy parameter, `integer` | JSON body key on `/simulate` |
| `n_top` | strategy parameter, `integer` | JSON body key on `/simulate` |
| `rebalance_days` | strategy parameter, `integer` | JSON body key on `/simulate` |
| `tickers` | nothing — Fintela adds it | JSON body key on `/simulate` |
| `risk_free` | fitness parameter, `Float` | query-string key on `/evaluate` |
| `drawdown_weight` | fitness parameter, `Float` | query-string key on `/evaluate` |

Strategy parameters may be `integer`, `float` or `categorical`; a categorical value arrives as a
JSON **string**, so type it as `str` in the model. Fitness parameters may only be `integer` or
`float`, carry no bounds or choices, and are **constants** in a study — pinned once in the
study's `fitness_params` map and never explored by the search.

A strategy record also requires a `required_lookback(...)` snippet, external or not. It is Python
that runs inside Fintela, never against your endpoint: a top-level function whose parameter names
are a subset of the ones you declared, returning an integer between **1** and **5000**. For the
server above:

```python
def required_lookback(lookback):
    return lookback
```

Saving runs an async validation job against your live endpoint — `POST /validate/external/strategy`
and `POST /validate/external/fitness`, each answering `202 Accepted` — and the naming dialog only
opens once it passes. Every declared parameter needs a test value first
(*"All parameters must have test values for validation"*).

> [!TIP] Validate the strategy first
> The strategy validation is the one that calls your endpoint twice and compares the two signals.
> Getting it green proves the address, the request shape, the response shape and the causality of
> your logic in a single step, before a study ever fans out.

## Mapping Fintela's failures back to your server

A study never retries a trial. Once the bounded HTTP retries are exhausted, the trial is pruned
and carries a classified failure into the study's errors panel. Each one points at a specific
line of the setup above.

| Kind | What it means here |
|---|---|
| `ENDPOINT_BLOCKED` | The host does not resolve, or resolves to a private address. Publish the service on a public address and relaunch. |
| `ENDPOINT_REFUSED` | Your process was not accepting connections. Run it continuously with at least two workers. |
| `ENDPOINT_TOO_SLOW` | A read timeout. Raise **Timeout (seconds)**, add workers, or make the handler faster — and check you are not blocking inside `async def`. |
| `ENDPOINT_UNREACHABLE` | A connect or pool timeout — the listen backlog is saturated. Add workers or lower **Max Concurrency**. |
| `ENDPOINT_DROPPED_CONNECTION` | Your keep-alive expired before Fintela reused the socket. Set `--timeout-keep-alive` / `--keep-alive` to at least 30. |
| `ENDPOINT_SERVER_ERROR` | A 5xx of your own — including a `response_model` mismatch. Read your logs for the failing request. |
| `ENDPOINT_REJECTED_REQUEST` | A 4xx. Usually a 422 from `SimulateBody` or an auth layer Fintela cannot satisfy. |
| `EXTERNAL_BAD_RESPONSE` | A 200 whose body has no top-level `signal` (or, for fitness, no `fitness`). |
| `SIGNAL_TICKERS_NOT_IN_CLUSTER` | Your signal named tickers outside the study's asset group. Honour the `tickers` body key. |
| `FITNESS_NOT_A_NUMBER` | Your `/evaluate` returned NaN on the train, validation or overall window. Expected when a period is unscoreable. |

The same pattern in JavaScript is in [Node.js · Express](/docs/node-express). The full contracts,
including every validator message and the complete `metrics` catalogue, are in
[External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness);
the Internal alternative is in [Execution modes](/docs/execution-modes).
