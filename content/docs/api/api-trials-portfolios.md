---
title: Trials & portfolios
section: API Reference
sectionOrder: 10
order: 5
published: true
updated: 2026-08-18
summary: Read individual trials and the managed portfolios promoted from them.
keywords: /v2/trials, /v2/portfolios, /v1/portfolios, GET, trial, managed portfolio, equity, include, deprecation
---

Three route families on this page read the output of your optimization runs: `/v2/trials` (one row
per trial a study evaluated), `/v2/portfolios` (the managed portfolios that promoted trials became)
and `/v1/portfolios` (the deprecated original name for trials). All seven routes are `GET`. Nothing
here launches, promotes or modifies anything — those actions spend compute and stay in the Fintela
app.

## Three resources, and the name collision between them

The word "portfolios" appears on two different paths and means two different things. Read this table
before writing any client code.

| Path | What it actually serves | Id field | Status |
|---|---|---|---|
| `/v2/trials` | Optimization trials — one frozen row per (study, trial number) | `trial_id` | Current |
| `/v1/portfolios` | The **same trials**, under the old name, with old field names | `portfolio_id` | **Deprecated** |
| `/v2/portfolios` | **Managed portfolios** — durable, daily-updated copies of promoted trials | `managed_portfolio_id` | Current |

`/v1/portfolios` and `/v2/trials` are the same rows out of the same table, served by the same
service code, with two fields renamed:

| `/v1/portfolios` field | `/v2/trials` field |
|---|---|
| `portfolio_id` | `trial_id` |
| `trial` | `trial_number` |

Every other field, the ordering, the filter and the `include` behaviour are identical. `/v1` is
frozen, not broken — existing integrations keep working — but it is the only route family in the
service that announces its own deprecation (see below).

`/v2/portfolios` is not the successor of anything. It is a separate table with its own sequence.

> [!CAUTION] `/v1/portfolios/42` and `/v2/portfolios/42` are unrelated objects
> The two paths differ by one version segment and address completely separate id spaces.
> `/v1/portfolios/42` is trial 42 — the same object as `/v2/trials/42`. `/v2/portfolios/42` is
> managed portfolio 42, which has no relationship to trial 42 whatsoever. Both requests can return
> `200` with plausible-looking data. Nothing in either response will tell you that you asked the
> wrong service. If you are migrating off `/v1`, the correct target is `/v2/trials`, never
> `/v2/portfolios`.

### How lineage connects the two

Promotion is the one link between the trial plane and the managed plane, and both sides carry a
pointer:

- A trial carries `managed_portfolio_id` once it has been promoted. It is **omitted from the JSON
  entirely** for trials that were never promoted — test for the key's presence, not for `null`.
- A managed portfolio carries `source_trial_portfolio_id`, which is a **trial id** despite the
  field name. It is `null` — present, with a null value — once the source study has been deleted.
  The managed copy keeps running on its own promotion-time snapshot rather than disappearing with
  its origin.

So `GET /v2/trials/42` returning `"managed_portfolio_id": 7` means you fetch its live copy at
`GET /v2/portfolios/7`, and `GET /v2/portfolios/7` returning `"source_trial_portfolio_id": 42`
takes you back to `GET /v2/trials/42`.

> [!NOTE] Promotion happens in the app
> Promoting a trial copies data and enrolls the result in daily updates, which is recurring
> billable compute. `POST /v2/trials/{id}/promote` and
> `POST /v2/studies/{study_name}/trials/{n}/promote` used to exist on this service and were removed;
> a test now pins them as permanently gone. The same applies to
> `PATCH /v2/portfolios/{id}/daily-updates`. See [promoted portfolios](/docs/promoted-portfolios).

## Deprecation signalling on the v1 routes

Both `/v1/portfolios` routes pass their responses through a middleware that stamps two headers on
**every** response, success or error:

```http
Deprecation: true
Link: </v2/trials>; rel="successor-version"
```

These are exact literals — the `Link` value is emitted as a static string, so it always names
`/v2/trials` regardless of which v1 route you called. This is the only route family in the Developer
API that emits any response header beyond the framework defaults, which makes it a reliable
machine-readable check: if you see `Deprecation: true`, you are on one of these two
`/v1/portfolios` routes.

The headers mark *these two routes*, not the `/v1` prefix in general: `/v1/studies`,
`/v1/strategies` and `/v1/data_clusters` are v1 paths that emit nothing and are not deprecated.
The `/v2/trials` and `/v2/portfolios` routes emit nothing either.

## The include parameter

`include` is a comma-separated list of optional blocks to hydrate on the detail endpoints. The
summary fields always come back; each named block costs an extra query, so ask only for what you
consume — a full holdings history is far larger than the metrics block.

Values allowed on the three **trial** detail routes (`/v2/trials/{trial_id}`,
`/v2/studies/{study_name}/trials/{trial_number}`, `/v1/portfolios/{portfolio_id}`):

| Value | Shape | Notes |
|---|---|---|
| `equity` | `date → number` | Daily portfolio value over the simulated window, keys `YYYY-MM-DD`, ascending. |
| `holdings` | `date → ticker code → number` | The allocation is **signed**: positive for a long leg, negative for a short. Do not assume non-negative. |
| `metrics` | `stage → metric name → number` | The default when `include` is omitted. |
| `params` | `param name → value` | The parameter sample this trial evaluated. |

Values allowed on `/v2/portfolios/{id}`:

| Value | Shape | Notes |
|---|---|---|
| `equity` | `date → number` | The full daily value series, ascending. Promotion **copies** the source trial's whole curve, so the series starts at the trial's backtest start, not at `promoted_at`, and is extended one day at a time after that. |
| `holdings` | `date → ticker code → object` | Each entry is `{"allocation", "position"}`. `allocation` is unsigned, in `[0, 1]`; `position` carries the side. |
| `orders` | array | The order log, oldest first. |

Parsing rules, identical on all four detail routes:

| Rule | Behaviour |
|---|---|
| Default when `include` is omitted | `metrics` on the trial routes; **nothing** on `/v2/portfolios/{id}` |
| Whitespace | Each comma-separated token is trimmed, so `?include=equity, metrics` works |
| Unknown token | Silently ignored — no error, no warning. A typo such as `?include=metrcis` returns the summary and nothing else |
| Empty value | `?include=` hydrates nothing at all, including on the trial routes |
| Order and duplicates | Irrelevant; the value is parsed into a set |

> [!WARNING] Passing include replaces the default, it does not add to it
> On the trial routes, omitting `include` gives you `metrics`. Passing `include` gives you exactly
> what you named — `?include=equity` returns the equity curve and **no** metrics. Name `metrics`
> explicitly whenever you also want it.

There is no `metrics` or `params` block on managed portfolios. The rows are not materialized, so
naming them has no effect. For performance figures on a managed portfolio, read the metrics of the
trial named by `source_trial_portfolio_id`, or compute your own from its `equity` series.

## Authentication, limits and polling

Everything in [API authentication](/docs/api-authentication) applies. The parts that bite hardest
here:

- Auth is **header-only**: `Authorization: Bearer sk_live_…`, 43 characters after the prefix. The
  `?api_key=` query parameter is still deserialized by these handlers and then discarded, so passing
  it produces a plain `401` with no hint that your auth method was the problem.
- There are **no scopes**. A key's reach is its organization.
- Success bodies are `{"data": …}`, where the payload is the schema documented for that route. Error
  bodies are `{"message": ..., "kind": ...}` — the `kind` field is a coarse machine label so you do
  not have to string-match the prose.
- All seven routes on this page **are** rate limited: 20 requests/second refill, burst 40, keyed on
  the organization and shared by every key in it. A rejection is `429` with
  `Retry-After: 1`. There are no `X-RateLimit-*` headers, so you cannot see your remaining budget
  before you are refused.

> [!NOTE] The rate limit is not applied uniformly across the API
> The limiter lives inside the shared authentication helper, and only 17 of the service's
> authenticated routes call it. Trials, managed portfolios, v1 portfolios, baskets, basket
> operations and asset groups go through it; every studies route (`/studies/*` **and**
> `/v1/studies*`), every strategies route (`/strategies*` **and** `/v1/strategies`) and every
> fitness route bypass it today. Treat the limit as real on this page and as absent on those. The bucket
> is also per process and the service autoscales to several tasks, so the effective ceiling under
> load is a multiple of 20 rps rather than exactly 20.

> [!WARNING] There is no push channel — poll
> Fintela has no webhooks, no server-sent events, no long-polling and no callback registration on
> `developer.fintela.io`. Nothing notifies you when a study finishes or a managed portfolio
> advances a day. Integrations poll, and should back off well inside the rate limit.

## List trials

One row per trial, newest first (`created_at` descending). This is the discovery call: use it to
learn `trial_id` values, then fetch the ones you care about.

```http
GET /v2/trials
Authorization: Bearer YOUR_API_KEY
```

**Query parameters**

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `study_name` | string | no | none (all trials) | Filter to one study. Accepts either the study's **display name** or its immutable **study key** — both resolve to the same study. An unknown value is not an error; it matches nothing. |

**Response fields**

| Field | Type | Notes |
|---|---|---|
| `trial_id` | integer | The id for `/v2/trials/{trial_id}` (and for `/v1/portfolios/{portfolio_id}`). |
| `study_name` | string | Always the study's **display name**, even when you filtered by study key. |
| `trial_number` | integer | The trial's number within its study. Unique per study, non-negative. |
| `created_at` | timestamp | Serialized **without** a timezone suffix, e.g. `2024-03-12T14:22:00`. |
| `managed_portfolio_id` | integer | Present only when this trial was promoted. **Key omitted otherwise.** |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/trials?study_name=Momentum+Strategy+Q1"
```

```json
{
  "data": [
    {
      "trial_id": 42,
      "study_name": "Momentum Strategy Q1",
      "trial_number": 18,
      "created_at": "2024-03-12T14:22:00",
      "managed_portfolio_id": 7
    },
    {
      "trial_id": 38,
      "study_name": "Momentum Strategy Q1",
      "trial_number": 5,
      "created_at": "2024-03-11T09:15:00"
    }
  ]
}
```

The second row was never promoted, which is why it has no `managed_portfolio_id` key at all.

## Get a trial by id

```http
GET /v2/trials/{trial_id}
Authorization: Bearer YOUR_API_KEY
```

**Path parameters**

| Name | Type | Notes |
|---|---|---|
| `trial_id` | integer | From `GET /v2/trials`. The same id space as `/v1/portfolios/{portfolio_id}`. |

**Query parameters**

| Name | Type | Required | Default | Allowed values |
|---|---|---|---|---|
| `include` | string (CSV) | no | `metrics` | `equity`, `holdings`, `metrics`, `params` |

**Response fields** — the five summary fields from the list, plus whichever blocks you requested.
Absent blocks are omitted keys, never `null`.

| Field | Type | Notes |
|---|---|---|
| `equity` | object | `date → portfolio value`, ascending by date. |
| `holdings` | object | `date → ticker code → signed allocation`. |
| `metrics` | object | `stage → metric name → value`. |
| `params` | object | `param name → value`. Numeric parameters come back as numbers; categorical ones as the **decoded label string**, not the internal Optuna choice index. |

The stages the optimizer persists are `train`, `validation`, `oos` and `rlp`. An `overall` stage is
merged in from a separate table and the key is **always present** in the `metrics` object — it can
legitimately be an empty object `{}` when no overall metrics exist for the trial.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/trials/42?include=equity,holdings,metrics,params"
```

```json
{
  "data": {
    "trial_id": 42,
    "study_name": "Momentum Strategy Q1",
    "trial_number": 18,
    "created_at": "2024-03-12T14:22:00",
    "managed_portfolio_id": 7,
    "equity": {
      "2024-01-02": 100000.0,
      "2024-01-03": 101450.0
    },
    "holdings": {
      "2024-01-02": { "AAPL": 0.6, "TSLA": -0.4 }
    },
    "metrics": {
      "train": { "sharpe": 1.48, "cagr": 0.21, "max_drawdown": -0.11 },
      "validation": { "sharpe": 1.12, "cagr": 0.16, "max_drawdown": -0.14 },
      "overall": {}
    },
    "params": {
      "n_top": 3,
      "roc_window_size": 20,
      "ma_kind": "ema"
    }
  }
}
```

`TSLA` at `-0.4` is a short leg. See [metrics reference](/docs/metrics-reference) for what the
metric names mean.

## Get a trial by study and trial number

`trial_id` is an internal id you can only learn from the list call. When you already hold the
`(study_name, trial_number)` pair — from a report, the app, or the study's optimization history —
address the trial directly. The response body is identical to `/v2/trials/{trial_id}`.

```http
GET /v2/studies/{study_name}/trials/{trial_number}
Authorization: Bearer YOUR_API_KEY
```

**Path parameters**

| Name | Type | Notes |
|---|---|---|
| `study_name` | string | The study's display name **or** its immutable study key. URL-encode it — display names contain spaces. |
| `trial_number` | integer | The `trial_number` from `GET /v2/trials`. Must be `>= 0`. |

**Query parameters** — identical to `/v2/trials/{trial_id}`: `include`, default `metrics`, allowed
values `equity`, `holdings`, `metrics`, `params`.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/studies/Momentum%20Strategy%20Q1/trials/18?include=equity,metrics"
```

```json
{
  "data": {
    "trial_id": 42,
    "study_name": "Momentum Strategy Q1",
    "trial_number": 18,
    "created_at": "2024-03-12T14:22:00",
    "managed_portfolio_id": 7,
    "equity": { "2024-01-02": 100000.0, "2024-01-03": 101450.0 },
    "metrics": { "validation": { "sharpe": 1.12, "cagr": 0.16 }, "overall": {} }
  }
}
```

`study_name` in the response is always the display name, even when you addressed the study by its
key — so the same trial has one canonical representation regardless of which identifier you used to
reach it.

**Failure modes specific to this route**

| Status | Message | Cause |
|---|---|---|
| `400` | `trial_number must be non-negative, got -1` | A negative `trial_number`. Rejected up front rather than reported as a missing trial. |
| `404` | `Study 'X' not found` | No live study with that name or key in your organization. |
| `404` | `Trial 18 not found in study 'X'` | The study resolved, but has no trial with that number. |

The two 404 messages are deliberately distinguishable, so you can tell which half of the pair was
wrong without a second request.

## List managed portfolios

Every managed portfolio in the organization, most recently promoted first (`promoted_at`
descending). No query parameters.

```http
GET /v2/portfolios
Authorization: Bearer YOUR_API_KEY
```

**Response fields**

| Field | Type | Notes |
|---|---|---|
| `managed_portfolio_id` | integer | The id for `/v2/portfolios/{id}`, and the id [portfolio groups](/docs/portfolio-groups) reference in their membership lists. |
| `name` | string | The name given at promotion time. |
| `source_trial_portfolio_id` | integer \| null | The **trial id** this was promoted from. Explicitly `null` — not omitted — once the source study was deleted. |
| `daily_updates_enabled` | boolean | Whether the portfolio advances day by day. |
| `promoted_at` | timestamp | ISO-8601 with a `Z` suffix, e.g. `2024-04-02T10:00:00Z`. The list is ordered by this, descending. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/portfolios
```

```json
{
  "data": [
    {
      "managed_portfolio_id": 7,
      "name": "Momentum Strategy Q1 / trial 18",
      "source_trial_portfolio_id": 42,
      "daily_updates_enabled": true,
      "promoted_at": "2024-04-02T10:00:00Z"
    }
  ]
}
```

> [!TIP] Two timestamp formats on one page
> Trial `created_at` is serialized without a timezone (`2024-03-12T14:22:00`); managed portfolio
> `promoted_at` and order `created_at` are ISO-8601 UTC with a `Z`. A client that parses
> `created_at` with one format across both resources will break on the other.

## Get a managed portfolio

Unlike the trial routes, this one defaults to the **summary only**. Omit `include` and you get the
five fields above and nothing else.

```http
GET /v2/portfolios/{id}
Authorization: Bearer YOUR_API_KEY
```

**Path parameters**

| Name | Type | Notes |
|---|---|---|
| `id` | integer | A managed portfolio id. **Not** a trial id — separate id space. |

**Query parameters**

| Name | Type | Required | Default | Allowed values |
|---|---|---|---|---|
| `include` | string (CSV) | no | none (summary only) | `equity`, `holdings`, `orders` |

**`holdings` entry fields**

| Field | Type | Values |
|---|---|---|
| `allocation` | number | Unsigned, constrained to `[0, 1]`. The side lives in `position`, not in the sign. |
| `position` | string | `"L"` or `"S"` |

**`orders` row fields**

| Field | Type | Values |
|---|---|---|
| `order_date` | date | `YYYY-MM-DD` |
| `code` | string | Ticker code |
| `action` | string | `"BUY"` or `"SELL"` |
| `position_side` | string | `"LONG"` or `"SHORT"` |
| `quantity` | number | Always `> 0` |
| `resulting_quantity` | number | Position size after the order |
| `source` | string | `"strategy"` for rows copied from the backtest at promotion, `"updater"` for rows written by the daily updater since |
| `created_at` | timestamp \| null | ISO-8601 UTC. This field **is** emitted as `null` when absent, unlike the omitted optional blocks |

Orders are returned oldest first, ordered by `order_date` then `order_id`. Like `equity` and
`holdings`, the log is seeded at promotion with the trial's own backtest orders (`source`
`"strategy"`), so it reaches back before `promoted_at`.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/portfolios/7?include=equity,holdings,orders"
```

```json
{
  "data": {
    "managed_portfolio_id": 7,
    "name": "Momentum Strategy Q1 / trial 18",
    "source_trial_portfolio_id": 42,
    "daily_updates_enabled": true,
    "promoted_at": "2024-04-02T10:00:00Z",
    "equity": {
      "2024-01-02": 100000.0,
      "2024-04-02": 101450.0,
      "2024-04-03": 101900.0
    },
    "holdings": {
      "2024-04-02": {
        "AAPL": { "allocation": 0.6, "position": "L" },
        "TSLA": { "allocation": 0.4, "position": "S" }
      }
    },
    "orders": [
      {
        "order_date": "2024-04-03",
        "code": "AAPL",
        "action": "BUY",
        "position_side": "LONG",
        "quantity": 12.0,
        "resulting_quantity": 12.0,
        "source": "updater",
        "created_at": "2024-04-03T21:05:11Z"
      }
    ]
  }
}
```

Note the `2024-01-02` equity point three months before `promoted_at`: that is the copied backtest
curve, not a live update.

The same short position appears as `-0.4` on a trial and as
`{"allocation": 0.4, "position": "S"}` on a managed portfolio. Convert deliberately if you compare
the two planes.

## List v1 portfolios (deprecated)

The pre-rename view of trials. Frozen, still served, and stamped `Deprecation: true` on every
response.

```http
GET /v1/portfolios
Authorization: Bearer YOUR_API_KEY
```

**Query parameters**

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `study_name` | string | no | none (all trials) | Same filter as `/v2/trials`: accepts the display name **or** the study key. The generated OpenAPI description calls this "exact study name", which understates it — the handler matches either identifier. |

**Response fields** — the same rows as `/v2/trials` with two renamed fields.

| Field | Type | Notes |
|---|---|---|
| `portfolio_id` | integer | `trial_id` on `/v2/trials`. |
| `study_name` | string | Study display name. |
| `trial` | integer | `trial_number` on `/v2/trials`. |
| `created_at` | timestamp | No timezone suffix. |
| `managed_portfolio_id` | integer | Present only for promoted trials; key omitted otherwise. |

```bash
curl -i -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v1/portfolios?study_name=Momentum+Strategy+Q1"
```

```json
{
  "data": [
    {
      "portfolio_id": 42,
      "study_name": "Momentum Strategy Q1",
      "trial": 18,
      "created_at": "2024-03-12T14:22:00",
      "managed_portfolio_id": 7
    },
    {
      "portfolio_id": 38,
      "study_name": "Momentum Strategy Q1",
      "trial": 5,
      "created_at": "2024-03-11T09:15:00"
    }
  ]
}
```

## Get a v1 portfolio (deprecated)

```http
GET /v1/portfolios/{portfolio_id}
Authorization: Bearer YOUR_API_KEY
```

**Path parameters**

| Name | Type | Notes |
|---|---|---|
| `portfolio_id` | integer | A **trial** id. The same value works unchanged at `/v2/trials/{trial_id}`. |

**Query parameters**

| Name | Type | Required | Default | Allowed values |
|---|---|---|---|---|
| `include` | string (CSV) | no | `metrics` | `equity`, `holdings`, `metrics`, `params` |

The optional blocks are byte-for-byte the ones documented under
the "Get a trial by id" section above: same shapes, same signed holdings, same always-present
`overall` stage.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v1/portfolios/42?include=equity,metrics"
```

```json
{
  "data": {
    "portfolio_id": 42,
    "study_name": "Momentum Strategy Q1",
    "trial": 18,
    "created_at": "2024-03-12T14:22:00",
    "managed_portfolio_id": 7,
    "equity": {
      "2024-01-02": 100000.0,
      "2024-01-03": 101450.0
    },
    "metrics": {
      "train": { "sharpe": 1.48, "cagr": 0.21, "max_drawdown": -0.11 },
      "validation": { "sharpe": 1.12, "cagr": 0.16, "max_drawdown": -0.14 },
      "overall": {}
    }
  }
}
```

A `404` on this route carries the message `Portfolio 42 not found`. `GET /v2/portfolios/42` uses the
**same** message text for a missing managed portfolio, so the message string alone will not tell you
which resource you missed — check the path you sent.

## Status codes on these routes

| Status | `kind` | When |
|---|---|---|
| `200` | — | Success. Always `200`; there is no `201`/`204` on a read-only API. |
| `400` | `bad_request` | The only handler-raised `400` on this page: a negative `trial_number` on `/v2/studies/{study_name}/trials/{trial_number}`. |
| `400` | — | A path segment that is not an integer (`/v2/trials/abc`) is rejected by the framework before the handler runs, so the body is plain text rather than the JSON envelope. |
| `401` | `unauthorized` | Missing or blank `Authorization` header, unknown or revoked key, or a key whose row has no organization or no user. |
| `404` | `not_found` | The trial, study or managed portfolio does not exist, or belongs to another organization, or its study is soft-deleted. |
| `405` or `404` | — | Any write verb. `POST`, `PUT`, `PATCH` and `DELETE` are rejected; which of the two you get depends on the router fallback. |
| `429` | `rate_limited` | The organization's token bucket is empty. Carries `Retry-After: 1`. |
| `500` | `internal` | Any database or serialization failure, redacted to a single generic sentence. |

Two codes you will **not** see here:

- **`403`** is never emitted anywhere in the Developer API. A resource outside your organization
  returns `404`, deliberately, so the API is not an existence oracle.
- **`406`** is emitted by the strategies and fitness id filters, not by any route on this page.

Full envelope details are in [errors and status codes](/docs/api-errors).

## Migrating from v1 portfolios to v2 trials

The move is mechanical. There is no behavioural difference to absorb — same rows, same order, same
filter, same `include` semantics, same status codes.

| Step | Change |
|---|---|
| 1 | `GET /v1/portfolios` → `GET /v2/trials` |
| 2 | `GET /v1/portfolios/{id}` → `GET /v2/trials/{id}`, with the **same** id value |
| 3 | Rename `portfolio_id` → `trial_id` in your response parsing |
| 4 | Rename `trial` → `trial_number` |
| 5 | Optionally drop your id-lookup step and address trials by `(study_name, trial_number)` instead |

Nothing in your `?study_name=` filter or your `?include=` list needs to change. Once migrated, the
`Deprecation` and `Link` headers stop appearing, which is the signal that no v1 caller remains in
your codebase.

If you were relying on `/v1/portfolios` to mean "portfolios" in the trading sense, the resource you
actually want is `/v2/portfolios` — and you need to fetch the managed portfolio ids from
`GET /v2/portfolios`, because your existing v1 ids are trial ids and will address the wrong objects.

Related: [studies](/docs/api-studies) for the runs that produce trials,
[portfolio groups](/docs/api-baskets) for what trades the managed portfolios, and
[API overview](/docs/api-overview) for the conventions shared by every route.
