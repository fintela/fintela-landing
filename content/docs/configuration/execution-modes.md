---
title: Execution modes
section: Configuration & Advanced
sectionOrder: 8
order: 1
published: true
updated: 2026-08-20
summary: Internal vs external execution for strategies, fitness functions and risk managers.
keywords: internal, external, execution_type, modes, matrix, simulate, evaluate, self-hosted, immutable
---

Three Fintela registry resources are *executed code*, and each one declares how it runs when you
create it. **Internal** means Fintela stores your Python and runs it in its own sandbox against a
fixed function signature. **External** means Fintela stores only a URL and calls your server over
HTTP — any language, your infrastructure, your private data. The mode lives on the individual
record, not on the study that references it, so one study can mix an internal strategy with an
external fitness function without any extra configuration.

## Which registries carry a mode

| Registry | Field | Values on the wire | External supported |
|---|---|---|---|
| [Strategies](/docs/strategies) | `execution_type` | `internal`, `external` (+ `declarative`, refused on save) | Yes |
| [Fitness functions](/docs/fitness-functions) | `execution_type` | `internal`, `external`, `builtin` (+ `declarative`, refused on save) | Yes |
| [Risk managers](/docs/risk-managers) | `kind` | `builtin`, `internal`, `external`, `declarative` | Yes — read the caveat below before you rely on it |
| [Asset groups](/docs/asset-groups) | — | — | No — an asset group is data, not code |
| [Studies](/docs/studies) | — | — | No — a study inherits the modes of the records it references |
| [Portfolio groups](/docs/portfolio-groups) | — | — | No |
| [Promoted portfolios](/docs/promoted-portfolios) | — | — | No |

Values are **lowercase on the API** and **UPPERCASE in the database** (`INTERNAL`, `EXTERNAL`,
`BUILTIN`, `DECLARATIVE`). Version snapshots keep the uppercase spelling — in
`snapshot_execution_type` for strategy and fitness versions, in `snapshot_kind` for risk-manager
versions.

All three registry tables show an **Execution Type** column by default, rendering the raw
lowercase value in an outlined chip. On risk managers that column is the legacy `execution_type`
field, so it reads `internal`, `external`, or an em dash — not the `kind`. The **Kind** column,
with translated labels **Built-in**, **Custom code**, **Rule-based** and **External HTTP**, is
hidden by default and has to be switched on from the column chooser.

> [!NOTE] Rule-based is not a live mode for strategies or fitness
> Both editors show a third **Rule-based** (`declarative`) segment, permanently disabled with the
> tooltip "Rule-based strategies are coming soon." / "Rule-based fitness functions are coming
> soon." The wire path is closed too — the backend answers **400** with
> `Rule-based (declarative) strategies are not supported yet.` or
> `Rule-based (declarative) fitness functions are not supported yet.` Declarative rule trees are a
> risk-manager feature only.

## Where the mode is set

The mode is chosen once, in the editor, at create time:

| Resource | Control | Options |
|---|---|---|
| Strategy | Segmented control in the editor header | **Internal**, **External**, **Rule-based** (disabled) |
| Fitness function | Segmented control in the editor header | **Internal**, **External**, **Rule-based** (disabled) |
| Risk manager | Segmented control labelled **Kind**, pinned above the working surface | **Internal**, **External**, **Rule-based** |

All three controls are `disabled` outside create mode. The risk-manager picker swaps its
helper text accordingly: in create mode it reads "Choose how this risk manager is implemented. This
cannot be changed after it is created."; afterwards it reads "The kind is fixed once the risk
manager exists — changing it means creating a new one."

The risk-manager editor offers no **Built-in** segment: as its create-mode notice puts it,
built-in risk managers "are invoked inline from the study wizard and do not need to be registered
here". You pick them when you attach a risk manager to a study. Built-in fitness objectives *are*
rows in the fitness registry (chip value `builtin`), but they are platform-seeded and read-only:
creating, updating, duplicating or sandboxing one is refused.

A study stores only `strategy_id` and `fitness_id`. At launch it additionally pins
`strategy_version_id` and `fitness_version_id` to the latest version row of each — which is what
decouples a launched study from any later edit to the registry record.

## The strategy and fitness matrix

A strategy's mode and a fitness function's mode are independent, so all four combinations are
valid and supported. A `builtin` fitness objective counts as non-external for every decision in
this table.

| Combination | Signal comes from | Score comes from | Optimizer task layout | Promotable to a tracked portfolio |
|---|---|---|---|---|
| internal + internal | In-process Python | In-process Python | The study's default task count; each worker pool falls back to `os.cpu_count()` | Yes |
| internal + external | In-process Python | `POST {endpoint}/evaluate` | Exactly **1** task, pool = the fitness `max_concurrency` | Yes |
| external + internal | `POST {endpoint}/simulate` | In-process Python | Exactly **1** task, pool = the strategy `max_concurrency` | **No** |
| external + external | `POST {endpoint}/simulate` | `POST {endpoint}/evaluate` | Exactly **1** task, pool = `min(strategy, fitness)`, halved if both normalise to the same URL | **No** |

> [!WARNING] An external strategy cannot become a live-tracked portfolio
> Promotion is gated on `strategies.execution_type` alone. Promoting a trial portfolio whose
> strategy is external is refused with **400** and the message
> `trial portfolio {id} uses an EXTERNAL strategy ({execution_type}); managed daily-update mode
> supports INTERNAL strategies only, so it cannot be promoted or tracked`. The same rule blocks it
> from a tracked basket. An external *fitness* function does not block promotion — it only scores
> trials during optimization, and no longer participates once a portfolio is promoted.

## What Internal requires

| Requirement | Strategy | Fitness | Risk manager |
|---|---|---|---|
| Code stored in `execution_details.code` | Yes | Yes | Yes |
| Required argument names | `data`, `start_date`, `end_date` | `simulation`, `data` | `today`, `portfolio_state`, `market_data` |
| Server-side validation receipt before save | Yes | Yes | Yes |
| Data sources injected as kwargs | Yes | Yes | Yes |
| `required_lookback(...)` function | Required | Not applicable | Optional warmup declaration |

The **validation receipt** is the gate that surprises most first-time authors. Saving any record
whose `execution_details` is the internal variant requires a completed validation job in your
organization, less than **1 hour** old, whose digest covers the same code, the same lookback
snippet and the same resolved data-source graph. Every failure is **HTTP 406**, and each one
refines the response body's `kind` field so you can branch on it instead of matching prose:

| `kind` | Message |
|---|---|
| `validation_receipt_missing` | `This code has not been validated as a strategy. Validate it (POST /validate/internal/…) before saving.` (the noun is `strategy`, `fitness function` or `risk manager`) |
| `validation_receipt_params_mismatch` | `This code was validated, but not at the parameter values being saved (…). Causality and warmup are proven at the values the validation ran with, so validate again with these ones before saving.` |
| `validation_receipt_window_override` | `This code was validated over a custom date window. The causality checks only cover the period they ran on, so a receipt minted that way cannot authorize a save. Validate over the default window (a custom ticker list is fine) and save again.` |
| `validation_receipt_lookback_mismatch` | `The code was validated, but not with this required_lookback snippet. Validate the strategy again before saving.` |

Only the strategy path compares the parameter point, because only a strategy has causality and
warmup proven at specific values.

## What External requires

External records carry three fields instead of code:

| Field | Strategy label | Fitness label | Risk manager label |
|---|---|---|---|
| `endpoint` | **Endpoint** | **Endpoint** | **Endpoint** |
| `timeout` | **Timeout (seconds)** | **Timeout (seconds)** | **Timeout (s)** |
| `max_concurrency` | **Max Concurrency** | **Max Concurrency** | **Max concurrency** |

Editor defaults are `timeout = 30` and `max_concurrency = 4` for all three, and all three refuse an
empty endpoint (`Endpoint is required` / `Endpoint is required.`). They disagree on the numbers:
the strategy editor demands whole numbers ≥ 1 (`Must be a positive integer`), the fitness editor
only checks for a number ≥ 1 (`Must be ≥ 1`), so `2.5` passes there, and the risk-manager editor
checks neither field client-side — it coerces both with `parseInt` and lets the server rule.

**External records need no validation receipt.** The gate fires only on the internal variant of
`execution_details`, so the endpoint URL screen below is the only external-specific save check.

Two things External does *not* get:

- **No data-source injection for external strategies.** The Data sources section is hidden
  entirely when the mode is external — your endpoint receives only parameters and dates, so
  injected kwargs would never reach it. Price is still attached server-side because the simulation
  prices the universe either way.
- **No injected extras for external fitness.** Only the internal evaluator merges graph-resolved
  pipeline outputs into the call. An external endpoint receives the simulation dict and your
  parameters, nothing more.

External strategies still **must** declare a `required_lookback(...)` function. The backend
resolves the lookback identically for both modes and refuses a save without it:
`A required_lookback(...) function is required (lookback_function_code must be non-empty).`
Nothing ever posts the snippet to your endpoint: the compiler executes it on its own, at
study-create time, to compute the worst-case warmup window the asset group has to cover.

## External wire contracts

Three resources, three different shapes. The strategy and fitness contracts are exact inverses of
each other — get them the wrong way round and your handler reads the wrong half of the request.

### Strategy endpoint, POST /simulate

`/simulate` is appended to the saved base URL. **Dates travel in the query string, parameters in
the JSON body.**

```http
POST https://api.example.com/strategy/simulate?start_date=2024-01-02&end_date=2024-12-31
Content-Type: application/json

{"lookback": 60, "top_n": 10, "tickers": ["AAPL", "MSFT"]}
```

`tickers` is additive — present only when a universe is configured, carrying the resolved ticker
codes. The two paths break a name collision differently: at validation, a strategy parameter
literally named `tickers` wins and the universe is not forwarded (a warning says so), while the
sandbox and the optimizer merge the universe key **last**, so there it overwrites the parameter.
Strategy parameters are numeric, so the collision is a corner case rather than a real design
choice.

The response must be a JSON object with a top-level `signal` key, whose value is validated by the
same output validator internal code goes through:

```json
{"signal": {"2024-01-02": {"AAPL": {"position": "L", "allocation": 0.5}}}}
```

| Failure | Message |
|---|---|
| Body is not JSON | `Endpoint response is not valid JSON` |
| No `signal` key | `Endpoint response must be a JSON object with a 'signal' key` |
| Non-2xx | `Endpoint returned HTTP {status}: {first 500 chars}` |
| Wrong shape during a study | `Your external strategy endpoint returned a response that is not the expected shape: it must be JSON with a top-level "signal" object mapping date -> ticker -> {"position": "L"\|"S", "allocation": number}.` — the trial is pruned, the study continues |

Validation calls `/simulate` twice — once over the requested window, once with the end date pushed
out by 730 days — and fails with `data_leakage` if a past signal changed, which stops the editor
short of the save dialog. Any ticker your endpoint returns
that is not in the forwarded universe produces a warning naming up to 20 codes. The study builder
repeats the point: "External strategy: every ticker your endpoint returns must also exist in the
selected Asset Group. Any signal ticker missing from the cluster will fail those trials."

See [external strategies](/docs/external-strategies) for a worked server.

### Fitness endpoint, POST /evaluate

`/evaluate` is appended to the saved base URL. **Parameters travel in the query string, the
period-sliced simulation in the JSON body** — the inverse of the strategy contract.

```http
POST https://api.example.com/fitness/evaluate?threshold=0.05
Content-Type: application/json

{"equity": {}, "holdings": {}, "orders": [], "trades": [], "metrics": {}}
```

The body always carries exactly those five keys. `equity` and `holdings` are objects keyed by
date, `orders` and `trades` are arrays, and `metrics` is the period's metric object.

The response must be a JSON object with a top-level `fitness` **number**:

```json
{"fitness": 1.87}
```

Anything else prunes the trial with `Your external fitness endpoint returned a response that is not
the expected shape: it must be JSON with a top-level "fitness" number.` Compiler validation
rejects the same three ways as the strategy path (`Endpoint response is not valid JSON`,
`Endpoint response must be a JSON object with a 'fitness' key`, `Endpoint returned HTTP …`), plus
an `invalid_output` failure naming the type it received instead of a number.

See [external fitness](/docs/external-fitness) for a worked server.

### Risk manager endpoint, one POST per tick

The risk-manager contract differs on every axis. **No path is appended** — the engine posts to the
saved URL exactly as stored — and it fires **once per simulated bar**, not once per trial.

```http
POST https://my-service.example.com/risk-manager
Content-Type: application/json

{
  "today": "2024-01-15",
  "portfolio_state": {
    "value": 100000.0,
    "cash_allocation": 0.05,
    "portfolio_peak": 102000.0,
    "holdings": [{"ticker": "AAPL", "side": "L", "allocation": 0.35}]
  },
  "params": {"threshold": 0.05}
}
```

The engine sends **no market data** — an external risk manager owns its own data side. Respond
`2xx` with a JSON array of operation objects; `[]` means do nothing. Engine limits: the per-tick
timeout is clamped to **500 ms**, **10** consecutive failures or **25** total failures mark the
risk manager terminal for the rest of the trial, and at most **50** events are recorded per run.

> [!CAUTION] External risk managers are not reachable from the editor today
> The server accepts `timeout` only in the range **0.001 – 0.5 seconds** and `max_concurrency`
> only in **1 – 32**; on top of that the per-organization quota `max_per_tick_timeout_ms`
> (default **100**) is compared against `timeout × 1000`, so the practical ceiling is 0.1 s. The
> editor seeds the **Timeout (s)** field at `30` and parses it with `parseInt`, so the field can
> only ever hold whole seconds — every value it can produce is outside the accepted range. The
> save is refused with **406** and
> `EXTERNAL risk manager timeout must be between 0.001 and 0.5 seconds, got 30`. Use Internal
> (custom Python) or Rule-based risk managers until the field accepts fractional seconds.

## Endpoint URL rules

All three resources share one save-time screen. Every rejection is **HTTP 406** with the message
verbatim:

| Rule | Message |
|---|---|
| No whitespace or control characters | `EXTERNAL endpoint must not contain whitespace or control characters` |
| Must parse as a URL | `EXTERNAL endpoint is not a valid URL ({error}): '{endpoint}'` |
| Scheme is `http` or `https` | `EXTERNAL endpoint must use http:// or https:// (got 'ftp').` |
| Host present | `EXTERNAL endpoint must include a host` |
| Not `localhost` or `*.localhost` | `EXTERNAL endpoint host must not be loopback/localhost` |
| A literal IP must be publicly routable | `EXTERNAL endpoint host {ip} must be a publicly routable address, not a private, loopback, link-local or reserved one` |

> [!NOTE] `http://` is allowed, and there is no port allowlist
> TLS was never the control here — a publicly routable host is. All three editors show an advisory
> warning when the URL is plain `http://` ("Unencrypted (http://) — the request and your
> endpoint's reply travel in cleartext. Fine for testing; use https:// in production.") but it
> never blocks Save. Any port is accepted.

The save-time screen is deliberately DNS-blind: it never makes a network call, so you can register
an endpoint before it is up. A second screen runs at fetch time — the compiler, the sandbox and
the optimizer each resolve the host and refuse if **any** resolved address is private, loopback,
link-local, reserved, multicast or unspecified, with the stable prefix
`Your endpoint address is not allowed: `. Redirects are never followed.

## Timeouts, retries and concurrency

The stored `timeout` is **not** used everywhere. For a strategy or fitness endpoint, three call
sites, three policies:

| Call site | Timeout used | Attempts | Retries on |
|---|---|---|---|
| Compiler validation (the Validate button) | **Fixed 30 s** — the stored `timeout` is ignored | 1 + 2, linear backoff 1 s then 2 s | connect / connect-timeout / read-timeout / pool-timeout / remote-protocol errors |
| Sandbox ("Run a backtest") | The stored `timeout`, falling back to 60 s if the record carries none | 1 + 3, full-jitter exponential backoff, base 1 s, ceiling 8 s | connect / connect-timeout / pool-timeout / remote-protocol errors, plus HTTP 429, 502, 503, 504 — a read-timeout is deliberately **not** retried |
| Optimizer training | The stored `timeout` | 1 + 3, full-jitter exponential backoff, base 1 s, ceiling 8 s | connect / connect-timeout / pool-timeout / remote-protocol errors, plus HTTP 429, 502, 503, 504 |

The sandbox and optimizer clients each hold a pool of **2 connections** with a 30-second keep-alive
expiry; compiler validation opens a one-shot request instead. Pair the keep-alive with
`timeout_keep_alive >= 30` on your server.

> [!TIP] `max_concurrency` is a worker budget, not a connection limit
> It does not size the HTTP pool. It is the fan-out budget the dispatcher hands the study: a study
> with any external component runs as exactly one task whose process pool is sized to
> `min(strategy, fitness)` across whichever components are external, halved (floor, minimum 1)
> when both endpoints normalise to the same URL. The optimizer then caps the batch at **32**
> regardless. A missing or non-positive `max_concurrency` on an external record is treated as
> unbounded and logged.

Fintela sends **no credential** to your endpoint. There is no signing header, no API key and no
mutual TLS on this path — authorize by whatever means your own server enforces.

## Changing a record's mode after creation

The editors freeze the mode: the segmented control is disabled outside create mode, and the
strategy and fitness agent paths refuse the field with "An existing resource's execution type
cannot be changed."

> [!WARNING] The freeze is a UI rule, not an API rule
> `PUT /strategies`, `PUT /fitness` and `PUT /risk-managers` all write `execution_type` / `kind`
> straight from the payload without comparing it to the stored value. Nothing at the API layer
> rejects a flip. Treat the mode as immutable anyway — the product gives you no way to change it,
> half of what the record needs (code, or an endpoint) would be missing after a flip, and version
> history would record the change as a new version. **Create a new record instead.**

Launched studies are insulated from a flip regardless. When a study has pinned versions, the
optimizer resolves the execution type from the frozen `snapshot_execution_type` rather than from
the live row, so a post-launch change cannot re-route a running study down the wrong code path.

Every registry **update** is also guarded by an optimistic-concurrency cursor: a stale
`expected_updated_at` returns **409** rather than silently overwriting a concurrent edit.

## How a run picks the code path

```text
Study (strategy_id, fitness_id)
  │
  ├─ at launch: pin strategy_version_id / fitness_version_id
  │
  ▼
Optimizer resolves, per component (strategy shown; fitness reads the twin tables):
  pinned?  → SELECT snapshot_execution_type FROM developers.strategy_versions
  not?     → SELECT execution_type          FROM developers.strategies
  │
  ├─ "INTERNAL" → compile the stored Python, call it in-process
  ├─ "EXTERNAL" → screen the endpoint once, then POST per trial
  ├─ "BUILTIN"  → (fitness only) read the named metric off the simulation
  └─ anything else → "Unrecognized strategy execution type: {value}" and the study fails
                     ("Unrecognized fitness execution type: …" on the fitness side)
```

Validation follows the same split. The editor picks the route from the record's mode — there is no
single endpoint that figures it out for you:

| Route | Used by |
|---|---|
| `POST /validate/internal/strategy` | Internal strategies |
| `POST /validate/external/strategy` | External strategies |
| `POST /validate/internal/fitness` | Internal fitness functions |
| `POST /validate/external/fitness` | External fitness functions |
| `POST /validate/internal/risk-manager` | Internal (custom code) risk managers |
| `POST /validate/external/risk-manager` | External risk managers |
| `POST /validate/builtin/risk-manager` | Built-in risk managers |

Each returns **202** with `{"job_id": …, "status": "pending"}`, which you poll on `GET /jobs/:id`.

For how the dispatcher turns this into ECS tasks, see
[optimizer architecture](/docs/optimizer-architecture). For when the pinning happens, see
[study lifecycle](/docs/study-lifecycle).

## Where External does not apply

Four of the seven registries have no execution mode at all, and two modes the UI advertises cannot
actually be used today — Rule-based on strategies and fitness, and External on risk managers:

- **Asset groups, portfolio groups and promoted portfolios have no execution mode.** They are
  data, not code. There is nothing to host.
- **Studies have no mode of their own.** A study is external if — and only if — its strategy or
  its fitness function is.
- **Rule-based (declarative) strategies and fitness functions are not available.** The editor
  segment is permanently disabled and the wire path returns 400. Rule-based *risk managers* are
  fully supported.
- **External risk managers cannot currently be saved through the editor** (see the caveat above).
- **External strategies cannot be promoted to a tracked portfolio** or added to a tracked basket.
- **You cannot create or flip a record through the developer API.** Every developer-api route is a
  `GET`; strategies and fitness functions are read-only there, and risk managers have no
  developer-api routes at all. Records are authored in the application.
