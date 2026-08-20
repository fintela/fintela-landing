---
title: External fitness
section: Configuration & Advanced
sectionOrder: 8
order: 5
published: true
updated: 2026-08-18
summary: Score trials with a fitness function you own and host.
keywords: external fitness, evaluate endpoint, scoring, self-hosted, fitness_params, nan_fitness, timeout, ssrf
---

An external fitness function is an HTTP endpoint you own that turns one simulated period into
one number. Fintela stores the URL and two HTTP-client settings and nothing else — no code, no
data, no credentials. Every time a trial needs scoring, Fintela POSTs the period-sliced
simulation result to `{your-endpoint}/evaluate` and reads a single `fitness` number back. Your
language, your dependencies, your private benchmarks and your scoring logic stay on your
servers.

## What Fintela stores

For an external fitness function the entire stored configuration is the `execution_details`
object:

```json
{
  "endpoint": "https://api.example.com/fitness",
  "timeout": 30,
  "max_concurrency": 4
}
```

Everything else on the record — its name, description and declared parameters — is metadata
Fintela needs to bind the function to a study. Nothing about your implementation is transmitted
or retained.

That is the practical reason to choose External over Internal: with
[Internal execution](/docs/execution-modes) you paste Python into Fintela's editor and it runs
in Fintela's sandbox against a fixed `(simulation, data, **params)` signature. With External,
Fintela never sees the scoring logic. The trade is that you own uptime, latency and correctness
of your own service.

> [!NOTE] Your endpoint receives the simulation and nothing else
> An internal fitness function also receives `data` — the price panel of the study's fitness
> asset group — plus any pipeline outputs it declares. An external one receives neither. The
> optimizer loads the fitness asset group only on the internal branch, and the external
> evaluator posts exactly two things: the simulation period in the body and your parameters in
> the query string. If your score needs prices or reference data, fetch them on your side.

## Registering the endpoint

Create the fitness function from the Fitness Functions registry, then pick **External** on the
segmented control in the editor header. The third option, **Rule-based**, is permanently
disabled — "Rule-based fitness functions are coming soon." — and a direct API write with that
execution type is rejected with "Rule-based (declarative) fitness functions are not supported
yet."

### Endpoint fields

The external centre zone of the editor has exactly three fields, and there is no code editor.

| Field | Label | Input | Default | Validation |
|---|---|---|---|---|
| `endpoint` | **Endpoint** | text, placeholder `https://api.example.com/fitness` | empty | required — "Endpoint is required" |
| `max_concurrency` | **Max Concurrency** | number, `min=1`, `step=1` | `4` | "Must be ≥ 1" |
| `timeout` | **Timeout (seconds)** | number, `min=1`, `step=1` | `30` | "Must be ≥ 1" |

`endpoint` is a **base URL**. Fintela appends `/evaluate` to it, so
`https://api.example.com/fitness` is called at `https://api.example.com/fitness/evaluate`.

On the wire `timeout` is a number of seconds (a float) and `max_concurrency` is an integer. The
editor only checks that each is at least 1; it does not require an integral timeout.

Typing a plain `http://` URL shows a warning-coloured helper text under the field:

> Unencrypted (http://) — the request and your endpoint's reply travel in cleartext. Fine for
> testing; use https:// in production.

That message is advisory only. It never sets a field error and never disables Save. What is
actually enforced is covered under "Endpoint address rules" below.

### Execution type is fixed at creation

The Internal/External control is enabled only in create mode; on an existing fitness function
both options are disabled, and the agent bridge refuses the field with "An existing resource's
execution type cannot be changed." There is no conversion path — to move a fitness function
from Internal to External, create a new one.

### Declaring parameters

The **Parameters** rail section works the same way for both modalities. Each declaration
becomes one key in the query string Fintela sends.

| Field | Label | Notes |
|---|---|---|
| Name | `Parameter name` | The query-string key. |
| Type | `Type` | `Integer` or `Float` only. |
| Test value | `Test value`, helper `Any value in your planned range.` | Used by validation, and prefilled into the promote-to-metric dialog. The optimizer never reads it, and the sandbox does not seed from it — its parameter fields start at `0`. |
| Description | `Description (optional)` | Free text. |

The panel's caption states the limit outright: `Supported types: integer & float — strings and
booleans are not allowed.` There is no categorical dtype for fitness, and a fitness parameter
carries **no bounds, range, step or choices** — the four fields above are the whole record.

In a study the values are pinned once, in the study's `fitness_params` map. The study builder
says so: *"Objective parameters are constants: the same value is used in every trial, and the
search never explores them."*

`POST /studies` and `PATCH /studies/{study_id}` check the map against the declarations and
answer **406 Not Acceptable** when they disagree:

| Condition | Message |
|---|---|
| Name sets differ | `This study's fitness parameters don't match the fitness function.` followed by ` Missing: a, b.` and/or ` Not expected: x.` |
| A value is not a number | `Value for fitness parameter {name} must be a number.` |
| An `integer` parameter has a fractional value | `Value {value} for integer fitness parameter {name} must be integral.` |

## Endpoint address rules

Fintela screens the endpoint twice — once when you save it, and again before it opens a
connection. Both screens are about *addresses*, not TLS. They are the same screens the
[external strategy](/docs/external-strategies) path uses.

### The save-time screen

`POST /fitness` and `PUT /fitness` reject the payload before it reaches the database. The screen
makes no network call, so an endpoint that is not up yet still saves.

| Rejected | Message |
|---|---|
| Leading, trailing or embedded whitespace or control characters | `EXTERNAL endpoint must not contain whitespace or control characters` |
| Unparseable URL | `EXTERNAL endpoint is not a valid URL ({error}): '{endpoint}'` |
| Any scheme other than `http` or `https` | `EXTERNAL endpoint must use http:// or https:// (got 'ftp').` |
| No host | `EXTERNAL endpoint must include a host` |
| Host `localhost` or `*.localhost` | `EXTERNAL endpoint host must not be loopback/localhost` |
| A literal IP that is not publicly routable | `EXTERNAL endpoint host {ip} must be a publicly routable address, not a private, loopback, link-local or reserved one` |

All six return **HTTP 406 Not Acceptable** with `kind: "not_acceptable"`.

Alternate IPv4 spellings are normalised before classification, so `http://2130706433/`,
`http://0x7f.1/` and `http://127.1/` are all rejected as loopback. There is **no port
allowlist** — a public host on any port is accepted.

### The call-time screen

Before the first connection from any caller, the host is resolved and **every** address it
resolves to is classified. If any one of them is private, loopback, link-local, reserved,
multicast or unspecified — including IPv4-mapped IPv6 forms — the call is refused before a
socket exists. A host that answers with both a public and a private record is refused.

Every refusal message opens with the same prefix, `Your endpoint address is not allowed:`, and
then names the reason:

```text
Your endpoint address is not allowed: the host '10.0.0.5' is a private, loopback or
otherwise internal address. Fintela only calls publicly routable addresses.
```

An unresolvable host produces `Your endpoint address is not allowed: the host '{host}' does not
resolve to any IP address. Check the spelling and that its DNS record is published.`

Redirects are never followed, so a public URL cannot bounce Fintela's egress into an internal
target.

### `https` is never required

Both screens accept `http` and `https` alike. TLS was never the SSRF control —
`https://10.0.0.5` is exactly as internal as `http://10.0.0.5` — and requiring it would lock out
every endpoint that is a bare public IP with no domain and therefore no publicly trusted
certificate. What is enforced is a publicly routable host. Plain `http` costs you
confidentiality, not access, and for fitness that cost is concrete: the whole simulation result
crosses the network in cleartext.

## The request Fintela sends

Every caller sends the same request. Parameters travel in the **query string**; the simulation
period travels in the **JSON body**.

```http
POST /evaluate?risk_free=0.02&drawdown_weight=1.5
Content-Type: application/json

{
  "equity": {
    "2024-01-02": 100420.5,
    "2024-01-03": 100612.1
  },
  "holdings": {
    "2024-01-02": [
      { "ticker": "AAPL", "side": "L", "allocation": 0.5 },
      { "ticker": "MSFT", "side": "L", "allocation": 0.5 }
    ]
  },
  "orders": [
    {
      "ticker_code": "AAPL",
      "order_date": "2024-01-02",
      "action": "Buy",
      "position_side": "L",
      "quantity": 10,
      "resulting_quantity": 10,
      "source": "strategy",
      "event_id": null
    }
  ],
  "trades": [
    {
      "ticker_code": "AAPL",
      "position_side": "L",
      "entry_date": "2024-01-02",
      "exit_date": "2024-01-30",
      "entry_quantity": 10,
      "avg_entry_price": 180.5,
      "avg_exit_price": 192.3,
      "avg_return_percentage": 0.065,
      "total_return_percentage": 0.065,
      "total_pnl": 118.0,
      "scalings": [],
      "total_duration_days": 28,
      "allocated_money": 1805.0,
      "invested": 1805.0,
      "metrics": { "mae": -0.03, "mfe": 0.09 }
    }
  ],
  "metrics": {
    "total_return": 0.12,
    "sharpe_ratio": 1.42,
    "max_drawdown": -0.08
  }
}
```

> [!WARNING] External strategies are the inverse
> An [external strategy](/docs/external-strategies) receives its dates in the query string and
> its parameters in the body. External fitness flips both halves. Read your parameters from
> `request.query_params` (or FastAPI's `Query(...)`), never from the JSON body, and if you
> maintain both endpoints do not copy the handler.

Query-string values are serialized by the HTTP client, so **every parameter reaches you as a
string** — parse it before you use it. Integer coercion happens only on the internal path, so a
parameter declared `integer` whose stored value is `15.0` arrives as `15.0`, not `15`.

### The simulation period

The body is a flat object with exactly five keys. There is no envelope.

| Key | Type | Contents |
|---|---|---|
| `equity` | object | `YYYY-MM-DD` → equity value, for dates inside the window. |
| `holdings` | object | `YYYY-MM-DD` → array of `ticker`, `side` (`L` or `S`) and `allocation`, for dates inside the window. |
| `orders` | array | Orders whose `order_date` falls inside the window. Fields: `ticker_code`, `order_date`, `action`, `position_side`, `quantity`, `resulting_quantity`, `source`, `event_id`. |
| `trades` | array | Trades scoped by entry — see the caution below. |
| `metrics` | object | The platform metrics already computed for exactly this window. |

Two windowing rules are worth reading twice.

> [!CAUTION] Trades are excluded at the boundary, not clipped
> A trade is in `trades` only when `start_date <= entry_date` **and** either it is still open
> (`exit_date` is `null`) or `exit_date <= end_date`. A position that straddles the edge of the
> window is dropped from the list entirely. If your score is trade-based, a short window can
> legitimately hand you an empty `trades` array — guard for it.

`metrics` is precomputed for you. Read `max_drawdown` from there rather than re-deriving it from
`equity`: the number you read is the number Fintela displays next to your score.

### What is inside metrics

At runtime `metrics` carries the platform metric catalogue for that window. Any individual value
may be `null`.

| Category | Keys |
|---|---|
| Return | `total_return`, `compound_annual_growth_rate` |
| Risk | `volatility`, `max_drawdown`, `average_drawdown`, `max_drawdown_duration`, `ulcer_index`, `var_95`, `cvar_95` |
| Risk-adjusted | `sharpe_ratio`, `sortino_ratio`, `calmar_ratio`, `martin_ratio`, `omega_ratio`, `profit_factor` |
| Recovery | `recovery_factor` |
| Distribution | `skewness`, `excess_kurtosis`, `tail_ratio`, `win_rate`, `payoff_ratio` |
| Trade aggregate | `trade_win_rate`, `trade_profit_factor`, `avg_trade_duration`, `expectancy` |

When the study has a baseline, nine benchmark-relative metrics are merged in **before** your
endpoint is called: `beta`, `alpha`, `information_ratio`, `treynor_ratio`, `up_capture`,
`down_capture`, `correlation`, `tracking_error`, `r_squared`. Without a baseline they are absent.

> [!WARNING] The validation fixture is not byte-identical to the runtime body
> Validation posts a synthetic simulation, and a few of its nested field names differ from what
> a real study sends. `metrics` carries `cagr` in the fixture and
> `compound_annual_growth_rate` at runtime. `orders[].action` is `"BUY"` / `"SELL"` in the
> fixture and `"Buy"` / `"Sell"` / `"Skipped"` at runtime. `trades[].metrics` is
> `max_favorable_excursion` / `max_adverse_excursion` / `volatility_during_trade` in the
> fixture and `mae` / `mfe` at runtime. The fixture's `orders[]` also omit `source` and
> `event_id` entirely. Read every nested key defensively, with a default, and do not branch on
> a value's casing.

The reverse trap exists too: the fixture's `metrics` contains only `cagr`, `sharpe_ratio`,
`max_drawdown`, `volatility`, `total_return` and the nine benchmark keys. A score that reads
`sortino_ratio` or `ulcer_index` will find nothing during validation and work in a real study.

## The response Fintela expects

Answer `200` with a JSON object carrying a top-level `fitness` key whose value is a number.

```json
{
  "fitness": 1.42
}
```

Any extra top-level keys are ignored. Only `fitness` is read.

> [!CAUTION] The key is `fitness`, not `score`
> `response.json()["fitness"]` is the only thing every caller reads. A body keyed `score`,
> `value` or `result` is a contract violation, and at validation it is rejected with `Endpoint
> response must be a JSON object with a 'fitness' key`.

Validation additionally requires the value to be a number — `'fitness' must be a number, got
{type}`. Make sure the test values you declare produce a real score there; the NaN path below is
for run time.

## Where your score goes

Per trial, the optimizer calls your endpoint **three times**, or **four** when the study defines
an out-of-sample window:

| Call | Window |
|---|---|
| Train | `train_start_date` → `train_end_date` |
| Validation | `validation_start_date` → `validation_end_date` |
| Overall | The whole equity curve |
| Out-of-sample | `oos_start_date` → `oos_end_date`, only when the study has one |

**Optuna's objective value is the train-period score.** Every stage's score is written back as
that stage's `fitness` metric and shown on the study and portfolio pages, but only the train
score steers the search.

Direction is a study setting, not a fitness setting. The study builder's **Optimization
objective** control offers `Maximize` and `Minimize`, and its hint reads: *"Whether the
optimizer maximizes or minimizes the fitness. Defaults to the metric's natural direction; set at
creation and frozen after launch."* For an external fitness function the inferred default is
**maximize**. There is one objective and one direction — Fintela has no multi-objective mode.

### NaN and non-finite scores

| Situation | Effect |
|---|---|
| Train, validation or overall score is NaN | The trial is **pruned** with the failure reason `nan_fitness`. |
| Out-of-sample score is NaN | Recorded as missing. The trial still completes. |
| An exception during the out-of-sample call only | Swallowed; the score is recorded as missing. |
| A trial's window has no results in `period_metrics` | Pruned with `period_metrics_out_of_bounds: [...]`. |

A trial pruned on `nan_fitness` is shown in the errors panel as **Fitness wasn't a number**:

> Your fitness function returned "not a number", so this trial couldn't be scored. Guard against
> dividing by zero and against empty periods.

> [!TIP] Return NaN deliberately, not a magic number
> NaN is the supported way to say "this configuration is not scoreable" — it prunes the trial
> cleanly and is reported as such. Returning a huge negative number instead makes the trial
> comparable when it should not be, and skews the search.

## Validating the endpoint

Pressing Save in the editor submits an async validation job to
`POST /validate/external/fitness`, which answers `202 Accepted` with
`{"job_id": ..., "status": "pending"}`; the editor polls the job and only opens the naming and
confirmation dialog once it passes. Before the request goes out, the editor requires a **test
value on every declared parameter** ("All parameters must have test values for validation").

The submitted payload is just `{ "endpoint": ..., "test_params": ... }`. The compiler then makes
**one** call to `{endpoint}/evaluate` with the synthetic simulation in the body and the test
values in the query string, with a fixed **30-second** timeout, one attempt plus two retries on
transient connection failures, and redirects disabled.

Unlike an external strategy, an external fitness function gets **no data-leakage probe and no
causality gate**: there is nothing causal about scoring a period that has already been
simulated, so the endpoint is called once, not twice.

### Validation failures

| `error_type` | Cause | Message |
|---|---|---|
| `endpoint_error` | Refused by the address screen | `Your endpoint address is not allowed: …` |
| `endpoint_error` | Non-2xx response | `Endpoint returned HTTP {status}: {first 500 characters of the body}` |
| `endpoint_error` | Transport failure | A diagnosis-specific message — TLS version mismatch, untrusted certificate, DNS, refused connection, or timeout |
| `invalid_response` | Body is not JSON | `Endpoint response is not valid JSON` |
| `invalid_response` | No top-level `fitness` key | `Endpoint response must be a JSON object with a 'fitness' key` |
| `invalid_output` | `fitness` is not a number | `'fitness' must be a number, got {type}` |

A successful validation carries back the score your endpoint returned, so a passing validation
is proof that the address, the shape and the arithmetic all hold.

> [!NOTE] External saves carry no validation receipt
> Internal fitness functions cannot be saved without a fresh, matching server-side validation
> receipt. External ones have no such gate: the only server-side check on the write path is the
> endpoint address screen. The editor still runs validation before saving, but a direct API
> write does not require it.

## Where your endpoint is called from

Five independent callers reach your `/evaluate`, with different clients and different budgets.

| Caller | When | Calls |
|---|---|---|
| Compiler validation | Save / Validate in the editor | 1 per validation |
| Fitness sandbox | "Run a backtest" from the registry | 1 per run, over the whole period |
| Optimizer | While a study runs | 3 per trial, 4 with an out-of-sample window |
| Portfolio updater | Daily extend of a live portfolio | 2 per extend — the real-life-performance window and overall |
| Metrics updater | Each metrics run, when the function is promoted to a portfolio metric | 1 per portfolio and stage cell |

The sandbox run is billed as a `sandbox_run` token charge before the job is spawned; see
[Tokens and billing](/docs/tokens-and-billing). Its result card is labelled **Fitness Score** and
shows the number to six decimals.

On the live-portfolio path a failed call is **not** fatal to the extend: the stage's `fitness`
value is recorded as NaN and the update continues. That path also reads the **current** fitness
record, not the version a study was pinned to, so editing the endpoint of a fitness function
behind a live portfolio takes effect on the next extend.

### Timeouts, retries and connections

| Caller | Timeout | Retries | Retried on |
|---|---|---|---|
| Compiler validation | fixed **30 s** — the stored `timeout` is ignored | 1 attempt + **2** retries, linear backoff 1 s then 2 s | connect error, connect timeout, read timeout, pool timeout, protocol error |
| Fitness sandbox | the stored `timeout` (60 s if the record carries none) | 1 attempt + **3** retries, full-jitter exponential backoff, base 1 s, ceiling 8 s | connect error, connect timeout, pool timeout, protocol error, and HTTP 429/502/503/504 |
| Optimizer | the stored `timeout` | same as the sandbox | same as the sandbox |
| Portfolio updater | the stored `timeout` | same as the sandbox | same as the sandbox |

Raising **Timeout (seconds)** does not lengthen the validation timeout. If your endpoint cannot
answer a synthetic six-month simulation within 30 seconds, it will not survive a study either.

A **read timeout is deliberately not retried** by the sandbox, optimizer or updater: the request
was accepted, so retrying only doubles the load on an already-slow service. Only the validation
client retries read timeouts.

Connection behaviour is fixed and small: the sandbox, optimizer and updater clients each hold at
most **2 connections**, with a keep-alive expiry of **30 seconds**. Set `timeout_keep_alive` to
at least 30 s on your server (uvicorn defaults to 5 s), or Fintela will periodically reuse a
socket your server has already closed.

## Max concurrency and study fan-out

**Max Concurrency is not a connection limit.** Every client pool is hard-coded to 2 connections
regardless of what you set. It is the *worker budget* the dispatcher gives a study that has an
external component.

| Situation | Budget |
|---|---|
| Study has no external component | Not used — the study gets its default task layout |
| Only the fitness is external | the fitness function's `max_concurrency` |
| Strategy and fitness both external, different endpoints | `min(strategy, fitness)` |
| Strategy and fitness both external, same endpoint | `min(strategy, fitness) / 2`, floored, minimum 1 |
| `max_concurrency` missing or not positive | That component stops constraining the budget; if no external component is left with a valid one, the study falls back to the internal layout |

Two endpoints count as the same when their URLs match after trimming, dropping a trailing slash
and lowercasing.

The budget becomes a **single** optimizer task whose worker pool is that size, and the optimizer
then caps the per-batch fan-out at **32** — a budget above 32 buys no extra fan-out. It does
still set the memory floor for that task: 4 GiB at a budget of 8 or below, 8 GiB up to 32,
16 GiB above that. A study whose sizing model predicts more than the floor gets more.

> [!TIP] Size it to your server, not to your ambition
> Each optimizer worker holds one in-flight `/evaluate` request. A budget higher than your
> service can accept turns into a burst of simultaneous connections and shows up as refused
> connections on pruned trials. Serve the endpoint with at least two workers, then set Max
> Concurrency to what those workers can actually hold.

## Failure semantics in a study

A study never retries a trial. Once the bounded HTTP retries above are exhausted, whatever went
wrong **prunes that trial** — the study keeps going with the remaining trials, and each pruned
trial carries a classified failure you can read in the study's errors panel.

| Kind | Trigger | What the user is told |
|---|---|---|
| `ENDPOINT_BLOCKED` | Refused by the address screen | Fintela can only call endpoints on publicly routable addresses. This endpoint's host doesn't resolve, or it resolves to a private or internal address. Publish it on a public address (or a hostname that resolves to one) and relaunch. |
| `ENDPOINT_REFUSED` | Connection refused | Your endpoint refused the connection — it wasn't accepting requests at that moment. Keep it running continuously and serve it with at least two workers. |
| `ENDPOINT_TOO_SLOW` | Read timeout | Your endpoint accepted the request but didn't answer in time. Make it faster, add workers, or raise its timeout. |
| `ENDPOINT_UNREACHABLE` | Connect or pool timeout | Fintela couldn't open a connection to your endpoint in time — it's overloaded or unreachable. Check that it's online, add workers, or raise its timeout. |
| `ENDPOINT_DROPPED_CONNECTION` | Keep-alive socket closed mid-reuse | Your endpoint closed the connection while Fintela was reusing it. Set its keep-alive timeout to at least 30 seconds. |
| `ENDPOINT_SERVER_ERROR` | HTTP 5xx after retries | Your endpoint returned an error of its own. Check its logs for the failing request. |
| `ENDPOINT_REJECTED_REQUEST` | HTTP 4xx | Your endpoint rejected Fintela's request. Check its address, its authentication, and the request body it expects. |
| `EXTERNAL_BAD_RESPONSE` | 200 with the wrong shape | Your endpoint replied in the wrong format. |
| `FITNESS_NOT_A_NUMBER` | `nan_fitness` | Your fitness function returned "not a number", so this trial couldn't be scored. Guard against dividing by zero and against empty periods. |

`ENDPOINT_BLOCKED` is the one failure Fintela catches before the first trial: the optimizer
screens the fitness endpoint while it is setting the study up, so a bad address fails the study
once with a clear verdict instead of producing N identical prunes and an opaque "0 complete
trials".

The prune reason recorded on a bad-response trial states the contract exactly:

```text
Your external fitness endpoint returned a response that is not the expected shape: it must be
JSON with a top-level "fitness" number. (KeyError: 'fitness')
```

> [!NOTE] The summary copy for a bad response is written for strategies
> `EXTERNAL_BAD_RESPONSE` is one classification shared with external strategies, and the panel's
> generic body sentence names a top-level `"signal"` object. For a fitness function the
> authoritative text is the trial's own reason string above, which names `"fitness"`.

## Authentication and secrets

**Fintela sends no credentials to your endpoint.** There is no API-key field, no header
configuration, no bearer token, no request signing and no shared secret in the external fitness
record — the stored configuration is the three keys at the top of this page and nothing more.
Requests arrive with a JSON content type and no `Authorization` header.

The one lever the contract leaves you is the URL itself: a hard-to-guess path segment survives
into every call, because Fintela appends `/evaluate` to whatever base path you registered
(`https://api.example.com/f/7f3c…` is called at `https://api.example.com/f/7f3c…/evaluate`).

An endpoint that answers unauthenticated calls with a 401 or 403 will prune every trial as
`ENDPOINT_REJECTED_REQUEST`, so a scheme Fintela cannot satisfy is not an option.

> [!WARNING] Cleartext over plain http
> On an `http://` endpoint the entire simulation result — every position, every trade, every
> metric — crosses the network unencrypted, and so does the score you return. That is your call
> to make about your own infrastructure, but make it knowingly.

## Reference implementation

The whole contract in one handler. Parameters arrive as query parameters; the simulation period
arrives as the body.

```python
from fastapi import FastAPI, Query, Response

app = FastAPI()

# Fintela parses the reply with Python's json module, which accepts a bare NaN
# literal — but most serializers will not emit one (Starlette's JSONResponse
# serializes with allow_nan=False), so write it by hand.
NOT_SCOREABLE = Response('{"fitness": NaN}', media_type="application/json")

@app.post("/evaluate")
def evaluate(
    simulation: dict,
    risk_free: float = Query(0.02),
    drawdown_weight: float = Query(1.5),
):
    metrics = simulation.get("metrics") or {}
    trades = simulation.get("trades") or []

    sharpe = metrics.get("sharpe_ratio")
    drawdown = metrics.get("max_drawdown")

    # Degenerate cases are real: an empty window, a portfolio with no trades,
    # a metric the engine could not compute. NaN prunes the trial cleanly.
    if sharpe is None or drawdown is None or not trades:
        return NOT_SCOREABLE

    return {"fitness": sharpe - drawdown_weight * abs(drawdown) + risk_free}
```

The same shape in Node:

```js
import express from "express";

const app = express();
app.use(express.json({ limit: "64mb" }));

app.post("/evaluate", (req, res) => {
  const riskFree = Number(req.query.risk_free ?? 0);
  const { metrics = {}, trades = [] } = req.body;

  const sharpe = metrics.sharpe_ratio;
  const drawdown = metrics.max_drawdown;

  if (sharpe == null || drawdown == null || trades.length === 0) {
    // Same reason as above: JSON.stringify turns NaN into null, and a null
    // `fitness` prunes the trial with an opaque error, not a clean nan_fitness.
    return res.type("application/json").send('{"fitness": NaN}');
  }

  res.json({ fitness: sharpe - Math.abs(drawdown) + riskFree });
});

app.listen(8000, () => {});
```

Register it over the API — note that `parameters` is an array of declarations, and that the
response is `201 Created` with the new id inside a `data` envelope:

```json
{
  "name": "drawdown_penalised_sharpe",
  "description": "Sharpe with a configurable drawdown penalty.",
  "execution_type": "external",
  "execution_details": {
    "endpoint": "https://api.example.com/fitness",
    "timeout": 30,
    "max_concurrency": 4
  },
  "parameters": [
    { "parameter_name": "risk_free", "dtype": "float", "test_value": 0.02 },
    { "parameter_name": "drawdown_weight", "dtype": "float", "test_value": 1.5 }
  ],
  "data_sources": []
}
```

Test the endpoint before registering it:

```bash
curl -X POST "https://api.example.com/fitness/evaluate?risk_free=0.02&drawdown_weight=1.5" \
     -H "Content-Type: application/json" \
     -d '{"equity":{"2024-01-02":100000},"holdings":{},"orders":[],"trades":[],"metrics":{"sharpe_ratio":1.2,"max_drawdown":-0.1}}'
```

Full walkthroughs live in [Python · FastAPI](/docs/python-fastapi) and
[Node.js · Express](/docs/node-express); the full endpoint tables are in
[Fitness API](/docs/api-fitness) and [Error reference](/docs/api-errors).

## What external fitness does not get

Honest limits, all of them enforced rather than stylistic.

| Not available | Why |
|---|---|
| The `data` price panel | The optimizer loads the study's fitness asset group only for internal fitness. Your endpoint receives the simulation period and your parameters, nothing else. |
| Pipeline outputs / injected kwargs | The **Data sources** rail section still renders in the editor for an external fitness function, but the external evaluator posts only the simulation period — nothing it resolves ever reaches your endpoint. |
| The Python code editor, the Reference dialog and live as-you-type validation | There is no code on Fintela's side. |
| The output-sample preview panel | Internal only. External validation returns just the score it received. |
| Restore from version history | Versions are recorded for both, but restoring a snapshot into the editor is offered only for internal fitness. |
| A `/health` probe | Only external *strategies* are health-checked before a live extend. A live portfolio calls your `/evaluate` directly. |
| Categorical parameters, bounds or ranges | A fitness parameter is a name, a dtype of `integer` or `float`, an optional description and a test value. In a study it is a constant. |
| Rule-based (declarative) fitness | Rejected server-side: "Rule-based (declarative) fitness functions are not supported yet." |

External execution is not unique to fitness. See [Execution modes](/docs/execution-modes) for the
full matrix, [External strategies](/docs/external-strategies) for the strategy contract — which
inverts the query-string/body split — and [Fitness functions](/docs/fitness-functions) for the
registry itself.
