---
title: Studies
section: API Reference
sectionOrder: 10
order: 4
published: true
updated: 2026-08-18
summary: Read study metadata, progress, health, status, errors, and optimization history.
keywords: /studies, /v1/studies, GET, progress, health, status, errors, opt history, param importances, avg_opt
---

Studies are created, launched, stopped and deleted in the Fintela app. This API is the read side:
watch a run while it optimizes, pull its per-trial optimization history once it finishes, and
export the top trials into your own tooling. Twelve routes, every one a `GET` — the progress,
health and status reads are cheap enough to poll.

## The twelve study routes

| Route | Returns |
|---|---|
| `GET /studies/metadata` | Full configuration for one, several, or all studies. |
| `GET /studies/progress` | Fraction of the trial budget consumed, per study. |
| `GET /studies/health` | 1 minus the trial failure rate, per study. |
| `GET /studies/status` | Runtime status, timestamps, structured failure diagnostic. |
| `GET /studies/errors` | Failure reasons bucketed with counts, plus the failed trials. |
| `GET /studies/opt/history` | Per-trial metric value for one stage — the optimization curve. |
| `GET /studies/opt/params` | The same values with each trial's hyperparameters attached. |
| `GET /studies/avg_opt/history` | Optimization curve on a weighted train/validation blend. |
| `GET /studies/avg_opt/params` | The blend with each trial's hyperparameters attached. |
| `GET /studies/param-importances` | Which hyperparameters actually moved the objective. |
| `GET /v1/studies` | Every study the key can see, newest first. |
| `GET /v1/studies/{study_name}` | One study by name, with its top trials ranked by a metric. |

Base URL for all of them is `https://developer.fintela.io`.

> [!NOTE] The route is `param-importances`, with a hyphen
> `/studies/param-importances` sits at the top level, not under `/studies/opt/`. There is no
> `/studies/opt/param_importances`.

## Before you call

### Authentication

Header-only, on every route on this page:

```http
GET /studies/progress?study_ids=17
Authorization: Bearer YOUR_API_KEY
```

The `?api_key=` query parameter is still deserialized by the service and then discarded, so a
request that carries only `?api_key=` fails with a bare `401` and no hint that the auth method is
the problem. There are no scopes — a key's reach is its organization. See
[authentication](/docs/api-authentication).

### Response envelope

Success is always `200` with the payload under `data`. Errors carry two fields:

```json
{ "message": "study_ids required", "kind": "bad_request" }
```

Service-wide, `kind` is one of `bad_request`, `unauthorized`, `not_found`, `not_acceptable`,
`rate_limited`, `internal`. Only `bad_request`, `unauthorized`, `not_found` and `internal` are
reachable on the routes on this page. Full reference in [errors](/docs/api-errors).

Nothing in the studies models uses `skip_serializing_if`, so **every documented key is always
present** on these routes; an absent value comes back as `null`, never as a missing key. (This is
the opposite of the trials and portfolios payloads, where optional blocks are omitted entirely —
see [trials and portfolios](/docs/api-trials-portfolios).)

### These routes are not rate limited today

The organization token bucket (20 rps, burst 40) lives inside the service's `authenticate()`
helper. All twelve study handlers call the lower-level `extract_api_key` + `validate_api_key` pair
instead, so none of them touch the bucket.

> [!WARNING] Do not build on the gap
> Rate limiting is inconsistent across route families right now: trials, managed portfolios,
> `/v1/portfolios`, baskets, basket operations and asset groups are limited; studies, strategies
> and fitness are not. That is a code defect, not a guarantee. Write your client to handle
> `429 Too Many Requests` with `Retry-After: 1` on these routes anyway, and keep polling
> intervals sane. There are no `X-RateLimit-*` headers anywhere on the API.

### There is no push channel

Fintela has **no webhooks** — no outbound callbacks, no SSE, no long-poll, no callback
registration. Monitoring a run means polling `/studies/progress`, `/studies/health` and
`/studies/status`. Five seconds is reasonable for progress and health, thirty for status; pull
`/studies/errors` on demand rather than on a timer.

## Identifying a study

Three different identifiers appear on this surface, and mixing them up is the most common
integration mistake.

| Identifier | Where it is used | Field on the payload |
|---|---|---|
| Study id (integer) | `?study_ids=` on all ten `/studies/*` routes; the keys of every response map | `study_id` on `/studies/param-importances`; the map key everywhere else |
| Display name (string, mutable) | `{study_name}` in the `/v1/studies/{study_name}` path | `name` |
| Study key (string, immutable) | also accepted in `{study_name}` | `study_key` |

`name` is what the app shows and the user can rename. `study_key` is the internal key and never
changes. `GET /v1/studies/{study_name}` resolves **either**, preferring an exact display-name
match, then falling back to the key. If you cache an identifier, cache `study_key` or the integer
id.

The same duality applies to the `?study_name=` filter on `/v2/trials` and `/v1/portfolios`.

## Batching with study_ids

Ten of the twelve routes take a comma-separated `?study_ids=1,2,3` and answer for the whole set in
one round trip.

| Rule | Behaviour |
|---|---|
| Parsing | Each element is trimmed, then parsed as a 32-bit integer. |
| Non-integer element | `400` with `Invalid id:` followed by the offending token, quoted verbatim. |
| Empty value (`?study_ids=`) | `400` with `Invalid id: ''`. An empty string is not an empty list. |
| Omitted on `/studies/metadata` | Legal, and means "every study in the organization". |
| Omitted on progress, health, status, errors | `400` with `study_ids required`. |
| Omitted on `/studies/param-importances` | `400` with `study_ids is required` — note the different wording. |
| Omitted on `opt/*` and `avg_opt/*` | Rejected by the framework's query deserializer before the handler runs: `400` with a plain-text body, **not** the `{"message","kind"}` envelope. |
| Id you cannot see | Silently dropped from the response map. Never a `403`. |

An id outside your organization, or belonging to a soft-deleted study, is simply absent from the
returned object. Every response is a map, so absence is the only signal — always check for the key
rather than assuming a study came back.

## Configuration and monitoring

### GET /studies/metadata

The full configuration of a study: what it optimizes, over which windows, with which search space.
This is the only route where `study_ids` is optional, which makes it the natural first call for
discovering ids.

```http
GET /studies/metadata
GET /studies/metadata?study_ids=17,18
```

| Query parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `study_ids` | string, CSV of integers | no | all studies in the organization | Comma-separated study ids. |

Response: an object keyed by study id.

| Field | Type | Description |
|---|---|---|
| `name` | string | Display name. Mutable. |
| `study_key` | string | Immutable internal key. Also accepted as `{study_name}`. |
| `strategy_id` / `strategy_name` | integer, string | The strategy being optimized. |
| `fitness_id` / `fitness_name` | integer, string | The fitness function used as the objective. |
| `n_trials` | integer | The trial budget the study was created with. |
| `completed_trials` | integer | Trials with no `failure_reason` attribute. |
| `sampler` | string | The Optuna sampler driving the search. |
| `train_start_date` / `train_end_date` | date, `YYYY-MM-DD` | In-sample search window. |
| `validation_start_date` / `validation_end_date` | date, `YYYY-MM-DD` | Held-out window. |
| `oos_start_date` / `oos_end_date` | date or null | Out-of-sample window, when the study defines one. |
| `strategy_data_cluster_id` | integer | Asset group the strategy ran against. |
| `fitness_data_cluster_id` | integer or null | Separate asset group for the fitness function. |
| `parameter_ranges` | object | The search space, one entry per strategy parameter. |
| `fitness_parameters` | object or null | Constants passed to the fitness function. |
| `daily_updates_enabled` | boolean | Whether the study's portfolios are recomputed daily. |
| `grid_decimals` | integer or null | Grid precision for float parameters. `null` means continuous sampling. |
| `created_at` | timestamp or null | ISO-8601 UTC, with the `Z` suffix. |

```json
{
  "data": {
    "17": {
      "name": "Momentum Strategy Q1",
      "study_key": "sp500_momentum_q1",
      "strategy_id": 3,
      "strategy_name": "MomentumCross",
      "fitness_id": 7,
      "fitness_name": "SharpeRatio",
      "n_trials": 500,
      "completed_trials": 487,
      "sampler": "TPE",
      "train_start_date": "2020-01-01",
      "train_end_date": "2022-12-31",
      "validation_start_date": "2023-01-01",
      "validation_end_date": "2023-12-31",
      "oos_start_date": null,
      "oos_end_date": null,
      "strategy_data_cluster_id": 1,
      "fitness_data_cluster_id": null,
      "parameter_ranges": { "lookback": { "low": 5, "high": 60 } },
      "fitness_parameters": null,
      "daily_updates_enabled": false,
      "grid_decimals": null,
      "created_at": "2026-01-15T10:30:00Z"
    }
  }
}
```

> [!NOTE] parameter_ranges and fitness_parameters are not redacted
> Both columns are selected and returned verbatim. They are `null` only when they are genuinely
> `null` in the database. Earlier revisions of this page described them as redacted for keys that
> could not "fully read" the underlying strategy — that gating no longer exists.

`completed_trials` is counted differently here than on `/v1/studies`: this route counts trials
with no failure reason, while `/v1/studies` additionally requires the Optuna trial state to be
`COMPLETE`. The two numbers can differ while a run is in flight.

### GET /studies/progress

How much of the trial budget has been spent.

```http
GET /studies/progress?study_ids=17,18,19
```

| Query parameter | Type | Required | Notes |
|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | Omitting it returns `400 study_ids required`. |

Response: study id to a number in `[0, 1]`, or `null`.

```json
{ "data": { "17": 0.974, "18": 0.12, "19": null } }
```

The value is trials recorded divided by `n_trials`, clamped to `[0, 1]`. It counts **every** trial
the optimizer has written, failed ones included — it measures budget spent, not success. `null`
means the study declares `n_trials` of zero or fewer, so the ratio is undefined.

> [!NOTE] Progress can stop short of 1.0
> A study whose search space is finite stops once every combination has been evaluated, so it can
> reach a terminal status below 1.0. Treat `/studies/status`, not progress, as the signal that a
> run is over.

### GET /studies/health

The complement of the trial failure rate.

```http
GET /studies/health?study_ids=17,18
```

| Query parameter | Type | Required | Notes |
|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | Omitting it returns `400 study_ids required`. |

Response: study id to a number in `[0, 1]`, or `null`.

```json
{ "data": { "17": 0.9925, "18": null } }
```

Health is `1 - failed / total`, where a trial counts as failed when the optimizer wrote a
`failure_reason` attribute against it. `null` means the study has no trials yet, so the ratio is
undefined.

> [!WARNING] health and errors disagree on purpose
> This route counts **every** failure reason, including the benign ones. `/studies/errors`
> excludes reasons prefixed `grid_duplicate` and `engine_artifact`, which are duplicate-grid-point
> prunes and engine bookkeeping rather than defects. A study that exhausted a finite grid can
> therefore report low health while `/studies/errors` returns almost nothing.

### GET /studies/status

The runtime row the platform's status updater maintains, one per study.

```http
GET /studies/status?study_ids=17
```

| Query parameter | Type | Required | Notes |
|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | Omitting it returns `400 study_ids required`. |

A runtime row is created with the study, starting at `last_status: SAVED` / `desired_status:
SAVED`; launching moves it to `QUEUED` / `RUNNING`. Only legacy studies that predate the unified
runtime-status row have none, and those are absent from the response.

| Field | Type | Description |
|---|---|---|
| `last_status` | string | Where the run actually is: `SAVED`, `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED` or `STOPPED`. |
| `desired_status` | string | The state the platform is steering towards: `SAVED`, `RUNNING` or `STOPPED`. |
| `failure_diagnostic` | object or null | Structured, user-safe failure record. See below. |
| `failure_message` | null | **Always `null`.** The key is kept for wire compatibility. |
| `started_at` | timestamp or null | ISO-8601 UTC. |
| `finished_at` | timestamp or null | Stamped when the last task for the run leaves a live state. |
| `stop_requested_at` | timestamp or null | When a stop was requested in the app. |

```json
{
  "data": {
    "17": {
      "last_status": "FAILED",
      "desired_status": "STOPPED",
      "failure_diagnostic": {
        "stage": "optimize",
        "kind": "OUT_OF_MEMORY",
        "message": "This study ran out of memory and stopped. Its scope is more than one run can hold: try fewer tickers, a shorter date window, or fewer trials. If the same scope worked before, contact support — we'll resize the run.",
        "source_key": null,
        "tickers": null,
        "user_line": null,
        "suggested_actions": ["reduce_scope", "relaunch", "contact_support"],
        "raw": null,
        "params": {},
        "detail": null,
        "severity": "error"
      },
      "failure_message": null,
      "started_at": "2026-07-14T09:12:04Z",
      "finished_at": "2026-07-14T10:19:41Z",
      "stop_requested_at": null
    }
  }
}
```

> [!CAUTION] failure_message is never populated on this route
> The stored `failure_message` is a raw traceback, or several tasks' output concatenated. The
> service replaces it with `null` unconditionally and serves the structured diagnostic instead.
> A client reading `failure_message` will always see `null`, no matter how the study failed. Read
> `failure_diagnostic.kind` and branch on that.

**Reading `failure_diagnostic`.** It is the platform-wide failure taxonomy, shared by the Rust
services and the Python optimizer. `raw` holds the traceback and is stripped to `null` before
serialization — it never reaches a client. For studies that failed before structured diagnostics
existed, the record is derived from the legacy message on read, so historic runs are populated
too.

| Key | Type | Notes |
|---|---|---|
| `stage` | string | Where it failed: `validation`, `queued`, `provisioning`, `runtime`, `preflight`, `data_loading`, `strategy`, `fitness`, `optimize`, `robustness`, `families`, `importances`, `unknown`. |
| `kind` | string | Stable machine code, e.g. `OUT_OF_MEMORY`, `RUN_INTERRUPTED`, `HOST_TERMINATED`, `CAPACITY_UNAVAILABLE`, `STARTUP_FAILED`, `LAUNCH_REJECTED`, `RUN_LOST`, `RUN_FAILED_UNKNOWN`, `AUTOSTOPPED_LOW_HEALTH`. Branch on this. |
| `message` | string | English default text. The app renders its own translated copy keyed by `kind`. |
| `suggested_actions` | array of string | Stable action codes, e.g. `relaunch`, `reduce_scope`, `change_cluster`, `edit_code`, `edit_window`, `view_trials`, `buy_tokens`, `contact_support`. |
| `severity` | string | `error` or `warning`. |
| `raw` | null | Always stripped. |
| `params`, `detail`, `tickers`, `source_key`, `user_line` | varies | Interpolation values, one sanitized line from the user's own code, offending tickers, and editor coordinates. Populated only for the kinds that have them. |

`robustness`, `families` and `importances` are post-processing stages that run **after** the
study's primary deliverable already exists. A failure in one of those degrades the analysis
without invalidating the run.

### GET /studies/errors

The per-trial failure dashboard: reasons bucketed with counts, plus the individual failed trials
and the parameters that produced them.

```http
GET /studies/errors?study_ids=17
```

| Query parameter | Type | Required | Notes |
|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | Omitting it returns `400 study_ids required`. |

Every requested id you can read appears in the response, even with nothing to report — the two
arrays are then empty. `error_summary` is ordered by `count` descending; `failed_trials` is
ordered by internal trial id ascending.

| Field | Type | Description |
|---|---|---|
| `error_summary[].failure_reason` | string or null | A representative raw reason for the bucket, for runs that predate structured diagnostics. |
| `error_summary[].failure_kind` | string or null | The bucket's diagnostic `kind` — **what the buckets are actually grouped by**. `null` for historic rows with no diagnostic. |
| `error_summary[].count` | integer | Trials in the bucket. |
| `failed_trials[].trial` | integer or null | The Optuna trial number. |
| `failed_trials[].failure_reason` | string or null | The raw reason string. |
| `failed_trials[].failure_diagnostic` | object or null | Same shape as on `/studies/status`, with `raw` stripped. `null` for older runs. |
| `failed_trials[].params` | object | The trial's hyperparameters. Categorical values arrive as the decoded **label**, not the integer choice index. |

```json
{
  "data": {
    "17": {
      "error_summary": [
        { "failure_reason": "ShapeError: ...", "failure_kind": "USER_CODE_ERROR", "count": 3 },
        { "failure_reason": "worker lost",     "failure_kind": null,               "count": 1 }
      ],
      "failed_trials": [
        {
          "trial": 128,
          "failure_reason": "ShapeError: ...",
          "failure_diagnostic": {
            "stage": "strategy",
            "kind": "USER_CODE_ERROR",
            "message": "Your strategy raised an error while running.",
            "source_key": null,
            "tickers": ["ZION"],
            "user_line": 41,
            "suggested_actions": ["edit_code"],
            "raw": null,
            "params": {},
            "detail": "ZeroDivisionError: float division by zero",
            "severity": "error"
          },
          "params": { "lookback": 34, "ma_kind": "ema" }
        }
      ]
    }
  }
}
```

Bucketing is by diagnostic `kind`, so identical failures collapse into one row instead of one row
per distinct raw string. Rows whose diagnostic is missing or classified `UNKNOWN_TRIAL_ERROR` fall
back to grouping on the raw reason, which keeps unclassified historic failures from collapsing
into a single meaningless bucket.

> [!NOTE] Benign prunes are filtered out here
> Failure reasons prefixed `grid_duplicate` or `engine_artifact` are excluded from both arrays.
> They are not defects — a study exhausting a finite grid records duplicate-configuration prunes
> that way. `/studies/health` does **not** apply this filter.

## Optimization analytics

Five routes reconstruct the search itself. The four `opt/*` and `avg_opt/*` routes read metrics
stored against each trial's portfolio, so they only return anything once trials have completed and
been scored. `param-importances` reads a precomputed row instead — see its section below.

| Route | Shape | Reach for it when you want to |
|---|---|---|
| `opt/history` | study id, then trial number, then one entry | Plot the optimization curve for a single stage, or find where the sampler stopped improving. |
| `opt/params` | study id, then a flat list of entries | Build a params-versus-metric scatter, or a parallel-coordinates plot of the search. |
| `avg_opt/history` | identical to `opt/history` | Rank trials on a train/validation blend so neither window alone decides. |
| `avg_opt/params` | identical to `opt/params` | The same blend, with hyperparameters attached. |
| `param-importances` | study id, then one precomputed record | Answer "which knobs mattered", and "which ones only mattered in-sample". |

> [!WARNING] The stage vocabulary has two spellings and they are different data
> `stage` is passed straight into an exact SQL equality — it is not normalized. Out-of-sample
> metrics exist under **both** `out_of_sample` and `oos`, written by two different producers (the
> optimizer during the trial simulation, and the metrics updater recomputing from persisted
> equity), and the two carry different values. Real-life performance is likewise both
> `real_life_performance` and `rlp`. `train` and `validation` have only one spelling. Pick a
> spelling deliberately and keep it consistent; an unrecognized `stage` is not an error, it just
> returns an empty object.

`metric_name` is likewise an exact match against the stored metric name — see
[metrics reference](/docs/metrics-reference) for the vocabulary. A metric that was never computed
for a stage yields an empty result, not an error.

### GET /studies/opt/history

Per-trial metric value for one stage, keyed by trial number: the raw optimization curve.

```http
GET /studies/opt/history?study_ids=17&metric_name=sharpe&stage=validation
```

| Query parameter | Type | Required | Notes |
|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | Missing it is rejected by the query deserializer, not the handler. |
| `metric_name` | string | **yes** | Exact metric name, e.g. `sharpe`. |
| `stage` | string | **yes** | Exact stage string. See the warning above. |

Response: study id, then trial number, then `{ portfolio_id, value }`. Both levels are JSON
objects, so the trial numbers arrive as **strings** and are emitted in ascending numeric order.

```json
{
  "data": {
    "17": {
      "0": { "portfolio_id": 1843, "value": 1.21 },
      "1": { "portfolio_id": 1844, "value": 0.87 },
      "2": { "portfolio_id": 1845, "value": 1.44 }
    }
  }
}
```

`value` is always a number on this route. `portfolio_id` is the handle to follow into
[trials and portfolios](/docs/api-trials-portfolios) for equity curves and full metric sets.

> [!NOTE] This is the raw series, not a running best
> The values are what each trial actually scored, in trial order. Compute the cumulative maximum
> yourself if you want the classic monotone curve — the raw series is strictly more informative,
> because it also shows the spread the sampler is exploring.

### GET /studies/opt/params

The same query with each trial's hyperparameters attached — the input for a
params-versus-objective scatter or a parallel-coordinates plot.

```http
GET /studies/opt/params?study_ids=17&metric_name=sharpe&stage=validation
```

Query parameters are identical to `opt/history`: `study_ids`, `metric_name` and `stage`, all
required.

Response: study id to a **list** of entries, in ascending trial order.

| Field | Type | Description |
|---|---|---|
| `trial` | integer or null | Optuna trial number. |
| `portfolio_id` | integer | The portfolio the trial produced. |
| `value` | number | The metric value for the requested stage. |
| `params` | object | The trial's hyperparameters. |

```json
{
  "data": {
    "17": [
      {
        "trial": 0,
        "portfolio_id": 1843,
        "value": 1.21,
        "params": { "lookback": 12, "n_top": 5, "ma_kind": "ema" }
      }
    ]
  }
}
```

Categorical parameters arrive as their **label** (`"ema"`), not as the integer choice index the
optimizer stores internally. Numeric parameters arrive as numbers. A trial with no recorded
parameters gets `params: {}` rather than being dropped.

### GET /studies/avg_opt/history

The optimization curve computed on a weighted blend of the `train` and `validation` values,
instead of a single stage. Use it to rank trials that neither overfit the search window nor got
lucky on the held-out one.

```http
GET /studies/avg_opt/history?study_ids=17&metric_name=sharpe&train=0.3&validation=0.7
```

| Query parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | — | Comma-separated study ids. |
| `metric_name` | string | **yes** | — | Exact metric name. |
| `train` | number | no | `0.5` | Weight applied to the `train` value. |
| `validation` | number | no | `0.5` | Weight applied to the `validation` value. |

There is no `stage` parameter: only the literal stages `train` and `validation` take part, and
`oos` is never blended in. The response shape is byte-for-byte the same as `opt/history`, so the
same parsing code works for both.

```json
{
  "data": {
    "17": {
      "0": { "portfolio_id": 1843, "value": 1.05 },
      "1": { "portfolio_id": 1844, "value": 0.91 }
    }
  }
}
```

> [!WARNING] The weights must sum to 1.0
> `train + validation` is checked to within `1e-9` and anything else returns
> `400 train + validation weights must sum to 1.0`. The check runs after authentication, so an
> invalid key still returns `401` first. Omit both parameters to get the even 0.5/0.5 split.

> [!CAUTION] A missing stage is not excluded, it is under-counted
> The blend is a SQL sum over whichever of the two stage rows exist. A trial that has a `train`
> value but no `validation` value returns `train × train_weight` — a smaller number, not a null
> and not an omission. Cross-check against `/studies/opt/history` per stage before trusting a
> blended ranking on a partially scored study. Unlike `opt/history`, `value` here is nullable.

### GET /studies/avg_opt/params

The blend with each trial's hyperparameters attached. Query parameters and validation are
identical to `avg_opt/history`; the response shape is identical to `opt/params`, except that
`value` is nullable here for the same reason it is on `avg_opt/history`.

```http
GET /studies/avg_opt/params?study_ids=17&metric_name=sharpe
```

```json
{
  "data": {
    "17": [
      {
        "trial": 0,
        "portfolio_id": 1843,
        "value": 1.05,
        "params": { "lookback": 12, "n_top": 5, "ma_kind": "ema" }
      }
    ]
  }
}
```

### GET /studies/param-importances

A precomputed record of which hyperparameters explained the objective's variance, and which ones
only did so in-sample. It is written once per study by a post-processing pass, not computed on
request — so this route is cheap regardless of trial count, and returns nothing for studies that
have not been scored yet.

```http
GET /studies/param-importances?study_ids=17
```

| Query parameter | Type | Required | Notes |
|---|---|---|---|
| `study_ids` | string, CSV of integers | **yes** | Omitting it returns `400 study_ids is required`. |

Response: study id to one record. Keys are emitted in ascending id order.

| Field | Type | Description |
|---|---|---|
| `study_id` | integer | The study the record describes. Duplicated inside the value for convenience. |
| `n_effective_params` | integer or null | Parameters that actually varied across the scored trials. |
| `n_trials_used` | integer or null | Completed trials the scoring ran on. |
| `n_trials_total` | integer or null | The study's total trial count. |
| `objective_metric` | string or null | The value the importances were computed against — `fitness`. |
| `headline_evaluator` | string or null | Which estimator produced the headline numbers — `fanova`. |
| `most_influential_param` | string or null | Highest-importance parameter on the train stage. |
| `most_influential_importance` | number or null | Its share of explained variance. |
| `most_influential_direction` | string or null | Direction label for that parameter, or `categorical`. |
| `max_overfit_param` | string or null | Parameter with the widest train-minus-validation importance gap. |
| `max_overfit_gap` | number or null | The size of that gap. |
| `artifact` | object or null | The full computed artifact, passed through verbatim. |

```json
{
  "data": {
    "17": {
      "study_id": 17,
      "n_effective_params": 4,
      "n_trials_used": 487,
      "n_trials_total": 500,
      "objective_metric": "fitness",
      "headline_evaluator": "fanova",
      "most_influential_param": "lookback",
      "most_influential_importance": 0.41,
      "most_influential_direction": "higher_is_better",
      "max_overfit_param": "n_top",
      "max_overfit_gap": 0.18,
      "artifact": {
        "schema_version": 2,
        "objective_metric": "fitness",
        "objective_direction": "maximize",
        "sampler": "TPE",
        "seed": 0,
        "evaluators": ["fanova", "mdi"],
        "stages": ["train", "validation", "oos", "overall", "rlp"],
        "n_trials_total": 500,
        "n_trials_completed": 487,
        "n_effective_params": 4,
        "params": [
          {
            "name": "lookback", "display_name": "lookback", "group": "strategy",
            "rm_attachment_id": null, "kind": "range", "dtype": "int",
            "is_fixed": false, "fixed_in_practice": false, "distinct_value_count": 56,
            "low": 5, "high": 60, "step": 1, "log": false, "choices": null
          }
        ],
        "importances": {
          "fanova": {
            "train": { "confidence": "ok", "n_used": 487,
                       "values": { "lookback": 0.41, "n_top": 0.29, "ma_kind": 0.18, "threshold": 0.12 } }
          }
        },
        "overfit": {
          "max_overfit_param": "n_top",
          "max_overfit_gap": 0.18,
          "importance_rank_agreement": 0.62,
          "n_direction_flips": 1
        },
        "summary": {
          "headline_evaluator": "fanova",
          "headline_stage": "train",
          "most_influential_param": "lookback",
          "most_influential_importance": 0.41,
          "most_influential_direction": "higher_is_better"
        }
      }
    }
  }
}
```

**Reading the artifact.** The eleven flat columns above are denormalized headline values lifted
out of `artifact` so you do not have to parse it for the common case. The artifact itself carries
the full grid:

| Block | What it holds |
|---|---|
| `params` | One metadata object per hyperparameter, sorted by `name`: `kind` (`range`, `choices` or `fixed`), `dtype` (`int`, `float` or `categorical`), `low`, `high`, `step`, `log`, `choices`, `distinct_value_count`, `is_fixed`, `fixed_in_practice`, and `group` (`strategy` or `risk_manager`, with `rm_attachment_id` set for the latter). |
| `importances` | Nested `evaluator` then `stage`, each a `{ confidence, n_used, values }` block. `values` is a per-parameter share, or `null` when the stage was unusable. `confidence` is `ok`, `low` or `insufficient`. |
| `direction` | Per stage, per parameter: the monotonic effect direction (rank correlation for numeric parameters, a per-category profile for categorical ones). |
| `overfit` | Per-parameter train-versus-validation importance gaps and out-of-sample sign flips, plus `importance_rank_agreement` and `n_direction_flips`. |
| `bootstrap` | Confidence intervals on the train-stage fANOVA importances, so a wide interval is visibly distinguishable from a tight one. |
| `summary` | The source of the flat headline columns. |
| `interactions` | Reserved. Currently always `null`. |

Two evaluators are computed — `fanova` (the headline) and `mdi` (a cheaper cross-check).
Agreement between them is itself a trust signal.

> [!NOTE] Absent and empty mean different things
> A study with no entry at all has never been scored — it is still running, or the pass has not
> reached it. A study whose entry is present with `artifact: null` **was** examined, after it
> reached a terminal status, and found too sparse to score: fewer than two completed trials, or a
> search space where nothing actually varied. Such a sentinel row carries `objective_metric:
> "fitness"` and `null` in every other headline column. Distinguish the two before showing
> "no data".

## Legacy name-addressed routes

The `/v1` pair predates the id-based routes above and addresses studies by name. Both are alive
and supported. Neither emits a `Deprecation` header — only `/v1/portfolios*` does, and that is a
different resource entirely.

### GET /v1/studies

Every study the key can see, ordered by creation time, newest first. No query parameters.

```http
GET /v1/studies
```

| Field | Type | Description |
|---|---|---|
| `name` | string | Display name. |
| `study_key` | string | Immutable internal key. |
| `last_status` | string or null | `null` only for legacy studies that predate the unified runtime-status row. |
| `n_trials` | integer | The configured trial budget. |
| `completed_trials` | integer | Trials in state `COMPLETE` with no failure reason. |
| `train_start_date` / `train_end_date` | date | In-sample window. |
| `validation_start_date` / `validation_end_date` | date | Held-out window. |
| `daily_updates_enabled` | boolean | Whether portfolios are recomputed daily. |
| `created_at` | timestamp or null | ISO-8601 UTC. |

```json
{
  "data": [
    {
      "name": "Momentum Strategy Q1",
      "study_key": "sp500_momentum_q1",
      "last_status": "COMPLETED",
      "n_trials": 500,
      "completed_trials": 487,
      "train_start_date": "2020-01-01",
      "train_end_date": "2022-12-31",
      "validation_start_date": "2023-01-01",
      "validation_end_date": "2023-12-31",
      "daily_updates_enabled": false,
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

This route does not return the study id, so pair it with `/studies/metadata` (whose response is
keyed by id) when you need to move on to the analytics routes.

### GET /v1/studies/{study_name}

One study with its top trials ranked by a metric on a stage.

```http
GET /v1/studies/sp500_momentum_q1?n_top=5&metric=sharpe&stage=validation&order=desc
```

| Path parameter | Type | Required | Notes |
|---|---|---|---|
| `study_name` | string | **yes** | Display name **or** `study_key`. URL-encode it — display names contain spaces. |

| Query parameter | Type | Required | Default | Allowed values |
|---|---|---|---|---|
| `n_top` | integer | no | `10` | Any integer; clamped to `1`–`100`. |
| `stage` | string | no | `validation` | Exact stage string, e.g. `train`, `validation`, `oos`, `out_of_sample`, `rlp`. |
| `metric` | string | no | `sharpe` | Exact metric name. |
| `order` | string | no | `desc` | Only the literal `asc` sorts ascending. |

> [!CAUTION] order is not validated
> `order` is compared against the literal string `asc`. Anything else — `ASC`, `ascending`, a
> typo, an empty value — silently means descending. Use `asc` for metrics where lower is better,
> such as drawdown, and check the spelling.

| Field | Type | Description |
|---|---|---|
| `name` | string | The study's display name. Note this route returns `name` only, never `study_key`. |
| `strategy` / `fitness` | string | Names of the strategy and fitness function. |
| `sampler` | string | The Optuna sampler. |
| `n_trials` / `completed_trials` | integer | Budget, and trials in state `COMPLETE` with no failure reason. |
| `train_start_date` / `train_end_date` | date | In-sample window. |
| `validation_start_date` / `validation_end_date` | date | Held-out window. |
| `oos_start_date` / `oos_end_date` | date or null | Out-of-sample window, when defined. |
| `top_portfolios[].rank` | integer | 1-based position in the ranking you requested. |
| `top_portfolios[].portfolio_id` | integer | Handle into the trials and portfolios routes. |
| `top_portfolios[].trial` | integer | Optuna trial number. |
| `top_portfolios[].metrics` | object | Nested `stage` then `metric` then value — **every** stage on record, not just the one you ranked by. |

```json
{
  "data": {
    "name": "Momentum Strategy Q1",
    "strategy": "MomentumCross",
    "fitness": "SharpeRatio",
    "sampler": "TPE",
    "n_trials": 500,
    "completed_trials": 487,
    "train_start_date": "2020-01-01",
    "train_end_date": "2022-12-31",
    "validation_start_date": "2023-01-01",
    "validation_end_date": "2023-12-31",
    "oos_start_date": null,
    "oos_end_date": null,
    "top_portfolios": [
      {
        "rank": 1,
        "portfolio_id": 1845,
        "trial": 2,
        "metrics": {
          "train": { "sharpe": 1.71, "max_drawdown": -0.18 },
          "validation": { "sharpe": 1.44, "max_drawdown": -0.21 }
        }
      }
    ]
  }
}
```

Trials whose metric value is `null` are excluded from the ranking entirely, so `top_portfolios`
can be shorter than `n_top`, or empty. A name that matches nothing you can read returns `404`
with the message `Study 'sp500_momentum_q1' not found`.

## Status codes on this page

| Code | Emitted when |
|---|---|
| `200` | Every success, including an empty result map. |
| `400` | Malformed CSV id; a required `study_ids` omitted; `train + validation` not 1.0. Also the framework's plain-text rejection when `study_ids` or `metric_name` is missing on `opt/*` or `avg_opt/*`. |
| `401` | Missing `Authorization` header, blank bearer value, unknown or revoked key, or a key whose row has no organization or no user. |
| `404` | `/v1/studies/{study_name}` only — no other study route returns it. |
| `405` or `404` | Any write verb. Every route here is `GET`. |
| `429` | Not emitted on these routes today. Handle it anyway. |
| `500` | Any database or serialization failure, with the message redacted to a generic string. |

`403` is never emitted anywhere on this API. A study you cannot read is dropped from the response
map, or returns `404` on the one route that addresses a single study — there is no existence
oracle. Full reference in [errors](/docs/api-errors).

## What this API cannot do

- **No writes.** Launching, stopping, resuming and deleting a study all consume compute and go
  through the token ledger, which this API-key service cannot meter. Do those in the app. See
  [study lifecycle](/docs/study-lifecycle).
- **No push.** No webhooks, no SSE, no long-poll. Poll.
- **No pagination, and almost no sorting.** `/v1/studies` returns everything, newest first, and
  takes no parameters. The `/studies/*` routes return exactly the ids you asked for, in a fixed
  order. The single client-controllable ordering on this page is `?order=` on
  `/v1/studies/{study_name}`, which sorts that study's `top_portfolios`.
- **No cross-organization reads.** A key resolves to one organization; everything that
  organization owns and has not deleted is readable. There is no per-user privacy inside an
  organization.

The complete, machine-readable surface is served unauthenticated at
`https://developer.fintela.io/openapi.json`, and a test asserts it matches the router exactly in
both directions. Generate your client from it. See [API overview](/docs/api-overview).
