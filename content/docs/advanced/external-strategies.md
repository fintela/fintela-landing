---
title: External strategies
section: Configuration & Advanced
sectionOrder: 8
order: 4
published: true
updated: 2026-08-18
summary: Host your signal generator on your own infrastructure, in any language, behind an HTTPS endpoint.
keywords: external strategy, simulate endpoint, http, signal, self-hosted, max_concurrency, timeout, ssrf, private data
---

An external strategy is an HTTP endpoint that you own. Fintela stores the URL and three
HTTP-client settings and nothing else — no code, no data, no credentials. When a study runs,
Fintela POSTs a parameter sample to `{your-endpoint}/simulate` and reads back a signal. Your
implementation language, your dependencies, your private feeds and your alpha stay on your
servers.

## What Fintela stores

For an external strategy the entire stored configuration is the `execution_details` object:

```json
{
  "endpoint": "https://api.example.com/strategy",
  "timeout": 30,
  "max_concurrency": 4
}
```

Everything else on the strategy record — its name, description, declared parameters and
`required_lookback` snippet — is metadata Fintela needs to build a search space and warm the
price panel. Nothing about your implementation is transmitted or retained.

This is the practical reason to choose External over Internal: with
[Internal execution](/docs/execution-modes) you paste Python into Fintela's editor and it runs
in Fintela's compiler sandbox. With External, Fintela never sees the code that produces the
signal. The trade is that you own uptime, latency and correctness of your own service.

> [!NOTE] Where the boundary actually is
> Fintela still loads a price panel for every study and runs the simulation, portfolio
> construction, risk managers and fitness evaluation on its side. Your endpoint is responsible
> for exactly one thing: mapping a parameter sample and a date window to a signal.

## Registering the endpoint

Create the strategy from the Strategies registry, then pick **External** on the segmented
control in the editor header (the third option, **Rule-based**, is permanently disabled —
"Rule-based strategies are coming soon.").

### Endpoint fields

The external centre zone of the editor has exactly three fields.

| Field | Label | Input | Default | Validation |
|---|---|---|---|---|
| `endpoint` | **Endpoint** | text, placeholder `https://api.example.com/strategy` | empty | required — "Endpoint is required" |
| `max_concurrency` | **Max Concurrency** | number, `min=1`, `step=1` | `4` | integer ≥ 1 — "Must be a positive integer" |
| `timeout` | **Timeout (seconds)** | number, `min=1`, `step=1` | `30` | integer ≥ 1 — "Must be a positive integer" |

`endpoint` is a **base URL**. Fintela appends `/simulate` to it after stripping a trailing
slash, so `https://api.example.com/strategy` is called at
`https://api.example.com/strategy/simulate`.

Typing a plain `http://` URL shows a warning-coloured helper text under the field:

> Unencrypted (http://) — the request and your endpoint's reply travel in cleartext. Fine for
> testing; use https:// in production.

That message is advisory only. It never sets a field error and never disables Save. What is
actually enforced is covered under "Endpoint address rules" below.

Below the three fields the editor shows a **Validation universe** picker, prefaced by:

> Optional: tickers sent to your endpoint's /simulate (as a `tickers` body key) at validation
> and in production — a universe-parametric endpoint can use them to scope its output.
> Endpoints that ignore it are unaffected.

### Execution type is fixed at creation

The Internal/External control is enabled only in create mode; on an existing strategy both
options are disabled. There is no conversion path — to move a strategy from Internal to
External, create a new one.

The parameters panel and the **required_lookback function** snippet editor work identically
for external strategies. Declare every parameter your endpoint expects: those declarations
become the study's search space, and the sampled values are what arrives in the request body.

## Endpoint address rules

Fintela screens the endpoint twice — once when you save it, and again before every connection.
Both screens are about *addresses*, not TLS.

### The save-time screen

`POST /strategies` and `PUT /strategies` reject the payload before it reaches the database.
The screen makes no network call, so an endpoint that is not up yet still saves.

| Rejected | Message |
|---|---|
| Leading, trailing or embedded whitespace or control characters | `EXTERNAL endpoint must not contain whitespace or control characters` |
| Unparseable URL | `EXTERNAL endpoint is not a valid URL ({error}): '{endpoint}'` |
| Any scheme other than `http` or `https` | `EXTERNAL endpoint must use http:// or https:// (got 'ftp').` |
| No host | `EXTERNAL endpoint must include a host` |
| Host `localhost` or `*.localhost` | `EXTERNAL endpoint host must not be loopback/localhost` |
| A literal IP that is not publicly routable | `EXTERNAL endpoint host {ip} must be a publicly routable address, not a private, loopback, link-local or reserved one` |

All six return **HTTP 406 Not Acceptable** with `kind: "not_acceptable"`.

Blocked literal ranges include RFC1918 (`10/8`, `172.16/12`, `192.168/16`), loopback,
link-local (`169.254/16`, which covers the cloud metadata address `169.254.169.254` and the
ECS credential address `169.254.170.2`), broadcast, documentation, unspecified, multicast,
`0.0.0.0/8`, `100.64/10` CGNAT and `240/4`; for IPv6 `::1`, `::`, `ff00::/8`, `fc00::/7`,
`fe80::/10`, plus the translation prefixes `2002::/16` (6to4) and `64:ff9b::/96` (NAT64).
Alternate IPv4 spellings are normalised first, so `http://2130706433/`, `http://0x7f.1/` and
`http://127.1/` are all rejected as loopback.

There is **no port allowlist**. A public host on any port is accepted, including `:7032`,
`:8080` and `:22`.

> [!TIP] http:// is accepted on purpose
> TLS was never the SSRF control — `https://10.0.0.5` is exactly as internal as
> `http://10.0.0.5` — and requiring it locks out every endpoint that is a bare public IP with
> no domain and therefore no publicly trusted certificate. What is enforced is a publicly
> routable host. Plain `http` costs you confidentiality, not access.

### The call-time screen

Before the first connection from any caller, the host is resolved and **every** address it
resolves to is classified. If any one of them is private, loopback, link-local, reserved,
multicast or unspecified — including IPv4-mapped IPv6 forms — the call is refused before a
socket exists. A host that answers with both a public and a private record is refused.

Every refusal message starts with the same sentence:

```text
Your endpoint address is not allowed: the host '10.0.0.5' is a private, loopback or
otherwise internal address. Fintela only calls publicly routable addresses.
```

An unresolvable host produces `Your endpoint address is not allowed: the host '{host}' does
not resolve to any IP address. Check the spelling and that its DNS record is published.`

Redirects are never followed — the compiler and sandbox clients set `follow_redirects=False`
explicitly — so a public URL cannot bounce Fintela's egress into an internal target.

### Where ssrf-guard applies

`crates/ssrf-guard` is the Rust screen that **requires `https`**, resolves the host, and pins
the connection to a screened address to defeat DNS rebinding. It guards *external data
sources*, not strategy endpoints. The strategy path reuses only its IP-classification
function (`ip_is_blocked`) inside the save-time screen above.

So: do not conclude from `ssrf-guard` that an external strategy endpoint must be HTTPS. It
must not be. The strategy screens accept `http`.

## The request Fintela sends

Every caller — validation, the sandbox, a study and the live portfolio updater — sends the
same request. Dates travel in the **query string**; parameters travel in the **JSON body**.

```http
POST /simulate?start_date=2024-01-01&end_date=2024-12-31
Content-Type: application/json

{
  "fast_period": 10,
  "slow_period": 30,
  "tickers": ["AAPL", "MSFT"]
}
```

| Location | Name | Type | Notes |
|---|---|---|---|
| query | `start_date` | string, `YYYY-MM-DD` | Start of the requested window. |
| query | `end_date` | string, `YYYY-MM-DD` | End of the requested window. |
| body | one key per declared parameter | number, or string for a categorical | The sampled value for this call. |
| body | `tickers` | array of strings | Additive; present only when a universe is configured. |

The body is a flat object — there is no envelope and no nesting. The keys are exactly the
parameter names you declared on the strategy.

The window is not a single trading day. At validation it is the window you configured
(defaulting to `2025-01-01` → `2025-06-30` when no validation universe dates are set); in a
study it is the study's train start through its out-of-sample end, or the validation end when
the study has no out-of-sample segment. Your endpoint returns the whole signal for that window
in one response.

> [!WARNING] External fitness is the inverse
> An [external fitness function](/docs/external-fitness) receives its parameters in the query
> string and its simulation payload in the body. If you maintain both, do not copy the
> handler.

### The tickers key

When the strategy has a validation universe (an asset group or an explicit ticker list), the
resolved ticker codes are added to the body as `tickers`. In a study the value is the
launch-frozen, runnable-narrowed universe of the study's [asset group](/docs/asset-groups) as
plain ticker codes. When no universe is configured the key is absent and the body is exactly
the parameter map.

The key is additive by design: an endpoint that ignores unknown JSON keys is unaffected. A
universe-parametric endpoint can use it to scope its output.

> [!CAUTION] Never declare a parameter named `tickers`
> The two paths disagree. At validation, a parameter named `tickers` wins and the universe is
> silently not forwarded, with the warning *"validation_universe tickers were not forwarded to
> the endpoint: a strategy parameter named 'tickers' already occupies that body key."* In a
> study, the universe overwrites your parameter. Pick another name.

## The response Fintela expects

Answer `200` with a JSON object carrying a top-level `signal` key. The value is
date → ticker → position.

```json
{
  "signal": {
    "2024-01-02": {
      "AAPL": { "position": "L", "allocation": 0.5 },
      "MSFT": { "position": "L", "allocation": 0.5 }
    },
    "2024-02-01": {
      "AAPL": { "position": "S", "allocation": 0.3 }
    }
  }
}
```

Any extra top-level keys are ignored. Only `signal` is read.

### Signal validation rules

The `signal` object goes through exactly the same validator as an internal strategy's return
value. Each rule below rejects the whole response.

| Rule | Message when violated |
|---|---|
| `signal` is a dict | `Output must be a dict, got {type}` |
| At least one date entry | `Output dict is empty — strategy must return at least one date entry` |
| Every date key parses as `YYYY-MM-DD` | `Date key '{key}' is not in YYYY-MM-DD format` |
| Each date maps to a dict | `Value for date '{date}' must be a dict, got {type}` |
| Ticker keys are non-null strings | `Ticker key must be a string, got {type}` |
| Each ticker maps to a dict | `Trade for ticker '{ticker}' on '{date}' must be a dict, got {type}` |
| `position` present | `Trade for '{ticker}' on '{date}' missing key 'position'` |
| `position` is `"L"` or `"S"` | `'position' for '{ticker}' on '{date}' must be 'L' or 'S', got '{value}'` |
| `allocation` present | `Trade for '{ticker}' on '{date}' missing key 'allocation'` |
| `allocation` is a number | `'allocation' for '{ticker}' on '{date}' must be a number, got {type}` |
| `allocation` is finite | `On date '{date}', an allocation resolved to {value} — allocations must be finite numbers.` |
| `allocation` greater than zero | `On date '{date}', an allocation resolved to {value} — allocations must be greater than zero.` |
| `allocation` at most 1 | `On date '{date}', an allocation resolved to {value} — allocations must be at most 1 (100%).` |
| Allocations on a date sum to at most 1 | `On date '{date}', allocations sum to {sum} (> 1.0, excess: {excess}). Strategies must emit weights that fit in the unit budget.` |

Two consequences worth reading twice: an allocation of exactly `0` is **rejected** — filter
out assets you do not intend to trade rather than emitting a zero weight — and the per-date
sum is checked against `1.0` with a tolerance of `1e-6`, so normalise before returning.

Every ticker you emit must exist in the study's asset group. Validation warns about this
ahead of time; a study fails the trials that violate it.

## Validating the endpoint

Pressing Save in the editor submits an async validation job to
`POST /validate/external/strategy`, which answers `202 Accepted` with
`{"job_id": ..., "status": "pending"}`; the editor polls the job and only opens the naming
and confirmation dialog once it passes. Before the request goes out, the editor requires a
**test value on every declared parameter** ("All parameters must have test values for
validation") and, for categorical parameters, at least one choice and a test value inside it.

The validation run calls your endpoint **twice**:

1. Once over the requested window.
2. Once with `end_date` extended by **730 days**, to prove the signal is causal.

If a date that appeared in the first response is missing from the second, or a ticker set,
`position` or `allocation` for a past date changed, the save is rejected with a
`data_leakage` failure — for example *"Data leakage detected on '{date}' for '{ticker}':
position changed from 'L' to 'S' when future data was added."*

Your endpoint must therefore tolerate an `end_date` far beyond your data. Returning the same
past signal in both runs is the whole point of the check.

### Validation failures

| `error_type` | Cause | Message |
|---|---|---|
| `endpoint_error` | Refused by the address screen | `Your endpoint address is not allowed: …` |
| `endpoint_error` | Non-2xx response | `Endpoint returned HTTP {status}: {first 500 bytes of body}` |
| `endpoint_error` | Transport failure | A diagnosis-specific message — TLS version mismatch, untrusted certificate, DNS, refused connection, or timeout |
| `invalid_response` | Body is not JSON | `Endpoint response is not valid JSON` |
| `invalid_response` | No top-level `signal` | `Endpoint response must be a JSON object with a 'signal' key` |
| `invalid_output` | Signal fails a rule above | The validator message from the table |
| `invalid_output` | The extended run fails a rule | `Invalid output from extended run (end_date={date}) during data-leakage check: {error}` |
| `data_leakage` | A past signal changed | `Data leakage detected …` |

A successful validation can still return warnings. The most common one names tickers outside
the configured universe:

> Your endpoint returned N ticker(s) not in the selected Data Cluster: […]. Those trials will
> fail with a missing-tickers error unless you add them to the cluster or stop emitting them —
> an external strategy's signal universe must be a subset of the cluster.

> [!NOTE] External saves carry no validation receipt
> Internal strategies cannot be saved without a fresh, matching server-side validation receipt.
> External strategies have no such gate: the only server-side check on the write path is the
> endpoint address screen. The editor still runs validation before saving, but a direct API
> write does not require it.

## Where your endpoint is called from

Four independent callers reach your `/simulate`, with different clients and different budgets.

| Caller | When | Calls |
|---|---|---|
| Compiler validation | Save / Validate in the editor | 2 per validation (short window + extended window) |
| Strategy sandbox | "Run a backtest" | 1 per run |
| Optimizer | While a study runs | 1 per trial |
| Portfolio updater | Daily extend of a live portfolio | 1 per extend, after a health probe |

### Timeouts, retries and connections

| Caller | Timeout | Retries | Retried on |
|---|---|---|---|
| Compiler validation | fixed **30 s** — the stored `timeout` is ignored | 1 attempt + **2** retries, linear backoff 1 s then 2 s | connect error, connect timeout, read timeout, pool timeout, protocol error |
| Strategy sandbox | the stored `timeout` (60 s if the record carries none) | 1 attempt + **3** retries, full-jitter exponential backoff, base 1 s, ceiling 8 s | connect error, connect timeout, pool timeout, protocol error, and HTTP 429/502/503/504 |
| Optimizer | the stored `timeout` | same as the sandbox | same as the sandbox |
| Portfolio updater | the stored `timeout` | same as the sandbox | same as the sandbox |

Raising **Timeout (seconds)** does not lengthen the validation timeout. If your endpoint needs
more than 30 seconds to answer a validation window, shrink the window with a validation
universe date range rather than raising the field.

A **read timeout is deliberately not retried** by the sandbox, optimizer or updater: the
request was accepted, so retrying only doubles the load on an already-slow service. Only the
validation client retries read timeouts.

Connection behaviour is fixed and small: each client holds at most **2 connections**, with a
keep-alive expiry of **30 seconds**. Set `timeout_keep_alive` to at least 30 s on your server
(uvicorn defaults to 5 s), or Fintela will periodically reuse a socket your server has already
closed.

## Max concurrency and study fan-out

**Max Concurrency is not a connection limit.** Every client pool is hard-coded to 2
connections regardless of what you set. It is the *worker budget* the dispatcher gives a study
that has an external component.

| Situation | Budget |
|---|---|
| Study has no external component | Not used — the study gets its default task layout |
| Only the strategy is external | the strategy's `max_concurrency` |
| Strategy and fitness both external, different endpoints | `min(strategy, fitness)` |
| Strategy and fitness both external, same endpoint | `min(strategy, fitness) / 2`, floored, minimum 1 |
| `max_concurrency` missing or not positive | Treated as unbounded; the study falls back to the internal layout |

Two endpoints count as the same when their URLs match after trimming, dropping a trailing
slash and lowercasing.

The budget becomes a **single** optimizer task whose worker pool is that size, and the
optimizer then caps the per-batch fan-out at **32** — a value above 32 buys nothing. The
budget also sets the memory floor for that task: 4 GiB at a budget of 8 or below, 8 GiB up to
32, 16 GiB above that. A study whose sizing model predicts more than the floor gets more.

> [!TIP] Size it to your server, not to your ambition
> A budget higher than your service can accept turns into a burst of simultaneous `/simulate`
> connections and shows up as refused connections on pruned trials. Serve the endpoint with at
> least two workers, then set Max Concurrency to what those workers can actually hold.

## Failure semantics in a study

A study never retries a trial. Once the bounded HTTP retries above are exhausted, whatever
went wrong **prunes that trial** — the study keeps going with the remaining trials, and each
pruned trial carries a classified failure you can read in the study's errors panel.

| Kind | Trigger | What the user is told |
|---|---|---|
| `ENDPOINT_BLOCKED` | Refused by the address screen | Fintela can only call endpoints on publicly routable addresses. This endpoint's host doesn't resolve, or it resolves to a private or internal address. Publish it on a public address and relaunch. |
| `ENDPOINT_REFUSED` | Connection refused | Your endpoint refused the connection — it wasn't accepting requests at that moment. Keep it running continuously and serve it with at least two workers. |
| `ENDPOINT_TOO_SLOW` | Read timeout | Your endpoint accepted the request but didn't answer in time. Make it faster, add workers, or raise its timeout. |
| `ENDPOINT_UNREACHABLE` | Connect or pool timeout | Fintela couldn't open a connection to your endpoint in time — it's overloaded or unreachable. Check that it's online, add workers, or raise its timeout. |
| `ENDPOINT_DROPPED_CONNECTION` | Keep-alive socket closed mid-reuse | Your endpoint closed the connection while Fintela was reusing it. Set its keep-alive timeout to at least 30 seconds. |
| `ENDPOINT_SERVER_ERROR` | HTTP 5xx | Your endpoint returned an error of its own. Check its logs for the failing request. |
| `ENDPOINT_REJECTED_REQUEST` | HTTP 4xx | Your endpoint rejected Fintela's request. Check its address, its authentication, and the request body it expects. |
| `EXTERNAL_BAD_RESPONSE` | 200 with the wrong shape | Your endpoint replied in the wrong format. It must return JSON with a top-level "signal" object: date → ticker → position and allocation. |
| `SIGNAL_TICKERS_NOT_IN_CLUSTER` | Signal names tickers outside the asset group | Your strategy traded tickers that aren't in this study's Asset Group. Add them to the group, or make your strategy return only tickers the group contains. |

`ENDPOINT_BLOCKED` is the one failure Fintela catches before the first trial: the optimizer
screens both external endpoints at preflight, so a bad address fails the study once with a
clear verdict instead of producing N identical prunes and an opaque "0 complete trials".

A trial pruned on a bad response shape carries the full contract in its message:

```text
Your external strategy endpoint returned a response that is not the expected shape: it must
be JSON with a top-level "signal" object mapping date -> ticker -> {"position": "L"|"S",
"allocation": number}.
```

## Authentication and secrets

**Fintela sends no credentials to your endpoint.** There is no API-key field, no header
configuration, no bearer token, no request signing and no shared secret in the external
strategy record — the stored configuration is the three keys shown at the top of this page and
nothing more. Requests arrive with a JSON content type and no `Authorization` header.

The one lever the contract leaves you is the URL itself: a hard-to-guess path segment survives
into every call, because Fintela appends `/simulate` to whatever base path you registered
(`https://api.example.com/s/7f3c…` is called at `https://api.example.com/s/7f3c…/simulate`).

An endpoint that answers unauthenticated calls with a 401 or 403 will prune every trial as
`ENDPOINT_REJECTED_REQUEST`, so a scheme Fintela cannot satisfy is not an option.

> [!WARNING] Cleartext over plain http
> On an `http://` endpoint the parameter values Fintela sends and the signal you return cross
> the network unencrypted. That is your call to make about your own infrastructure, but make
> it knowingly.

## Live portfolios and the health probe

When a portfolio backed by an external strategy is promoted to
[live trading](/docs/live-trading), the daily extend adds one requirement that no other caller
has: before generating the day's signal, the updater calls

```http
GET /health
```

on your base URL with a **5-second** timeout, and requires a 2xx. If it fails — unreachable,
timed out, or any non-success status — the update fails with `External strategy API health
check failed: {reason}` and no signal is generated that day.

A live portfolio also reads the **current** strategy record, not the version snapshot a study
was pinned to. Editing the endpoint of a strategy that backs a live portfolio takes effect on
the next extend; already-launched studies keep running against the endpoint stored in their
pinned version.

## Reference implementation

The whole contract in one handler. Parameters and the optional `tickers` list arrive in the
body; the dates arrive as query parameters.

```python
from fastapi import FastAPI, Query
from pydantic import BaseModel

app = FastAPI()

class SignalResponse(BaseModel):
    signal: dict

@app.post("/simulate", response_model=SignalResponse)
def simulate(params: dict, start_date: str = Query(...), end_date: str = Query(...)):
    # `params` is the JSON body: your sampled parameters, plus an optional
    # `tickers` list (the chosen validation universe) — safe to ignore.
    universe = params.get("tickers")  # optional; None when no universe is set
    return SignalResponse(signal={
        "2024-01-02": {
            "AAPL": {"position": "L", "allocation": 0.5},
        },
    })

@app.get("/health")
def health():
    return {"status": "ok"}
```

The same shape in Node:

```js
import express from "express";

const app = express();
app.use(express.json());

app.post("/simulate", (req, res) => {
  const { start_date, end_date } = req.query;
  const { tickers, ...params } = req.body;

  res.json({
    signal: {
      "2024-01-02": {
        AAPL: { position: "L", allocation: 0.5 },
        MSFT: { position: "L", allocation: 0.5 },
      },
    },
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(8000, () => {});
```

Test it before registering:

```bash
curl -X POST "https://api.example.com/strategy/simulate?start_date=2024-01-01&end_date=2024-12-31" \
     -H "Content-Type: application/json" \
     -d '{"fast_period": 10, "slow_period": 30}'
```

Full walkthroughs live in [Python · FastAPI](/docs/python-fastapi) and
[Node.js · Express](/docs/node-express).

## What external strategies do not get

Honest limits, all of them enforced rather than stylistic:

| Not available | Why |
|---|---|
| Data sources / injected kwargs | Your endpoint receives only parameters, dates and the optional `tickers` list. Fintela's injectable sources cannot reach it, so the editor hides the section entirely. |
| The Python code editor and live as-you-type validation | There is no code on Fintela's side. |
| Ticker sample size | There is no synthetic fixture to sample; the validation universe is the exact ticker list. |
| Restore from version history | Versions are recorded, but restoring a snapshot into the editor is offered only for internal strategies. |
| The breaking-change dialog on save | It fires only for internal strategies with launched studies. |
| Rule-based (declarative) strategies | Rejected server-side: "Rule-based (declarative) strategies are not supported yet." Declarative rule trees are a risk-manager feature. |

External execution is available for strategies and for
[fitness functions](/docs/external-fitness). For everything else — see
[Execution modes](/docs/execution-modes) for the full matrix, and
[Strategies](/docs/strategies) for the registry itself.
