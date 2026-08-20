---
title: Strategies
section: API Reference
sectionOrder: 10
order: 3
published: true
updated: 2026-08-20
summary: Read strategy definitions, metadata, parameters and version history.
keywords: /strategies, /v1/strategies, GET, metadata, params, versions, execution type
---

Read the strategies that already exist in your organization — their names, code or external
endpoint, parameter declarations, the studies that reference them, and their append-only edit
history. Five routes cover the whole surface, all of them `GET`. Strategies are authored in the
Fintela app; this API only reads the result.

## Endpoints at a glance

```http
GET /strategies
GET /v1/strategies
GET /strategies/metadata
GET /strategies/params
GET /v2/strategies/:id/versions
```

| Endpoint | Returns | OpenAPI `operationId` |
|---|---|---|
| `GET /strategies` | `{ id: name }` map of every strategy in your organization | `list_strategies` |
| `GET /v1/strategies` | Legacy alias of `GET /strategies` — same handler, same body | `list_strategies_v1` |
| `GET /strategies/metadata` | `{ id: metadata }` map — code/endpoint, parameters, linked studies | `get_strategies_metadata` |
| `GET /strategies/params` | `{ id: [param, …] }` map — parameter declarations only | `get_strategies_params` |
| `GET /v2/strategies/:id/versions` | Edit history for one strategy, newest first | `get_strategy_versions` |

Base URL is `https://developer.fintela.io`. Every route needs
`Authorization: Bearer sk_live_…` — see [authentication](/docs/api-authentication). Auth is
header-only: an `?api_key=` query parameter is still deserialized but its value is discarded, so a
request that carries only the query parameter comes back as `401` with the generic
`Missing API key…` message and `"kind": "unauthorized"` — no indication that the credential was
present and ignored.
Every success body is wrapped in a `data` envelope; every error is `{"message": …, "kind": …}`.
There are no scopes — a key's reach is its organization, nothing narrower.

A strategy is readable when it belongs to your API key's organization and is not soft-deleted.
There is no privacy inside an organization: every member's strategies are visible to every key
issued for that organization.

> [!CAUTION] These five routes are not rate limited today
> The per-organization token bucket lives inside the service's `authenticate()` helper, and the
> strategies handlers call the lower-level `extract_api_key` + `validate_api_key` pair instead.
> All five routes on this page therefore bypass the limiter entirely — they never return `429`
> and never consume a token. The same is true of every `/studies/*` and `/fitness*` route.
> This is inconsistent behaviour across route families rather than a documented tier: the other 17
> routes (trials, portfolios, baskets, operations, asset groups) *are* limited, at 20 requests per
> second per organization with a burst of 40. Do not build a client that assumes either behaviour
> is permanent — throttle your own polling. See [errors and status codes](/docs/api-errors).

## What "version" means on these paths

Version prefixes in the Developer API do not mark contract generations, and two of the five routes
here carry one. What each actually means:

| Path | What the prefix means |
|---|---|
| `/strategies*` | The current, unversioned surface. Prefer these paths in new code. |
| `/v1/strategies` | A legacy alias kept for backward compatibility. Same handler, same body. Not deprecated, and it emits no `Deprecation` header. |
| `/v2/strategies/:id/versions` | **Resource edit history**, not "API v2". The feature landed under a `/v2` prefix; it says nothing about the API contract. |

The only genuinely deprecated routes in the Developer API are `/v1/portfolios` and
`/v1/portfolios/:portfolio_id`, and they are the only ones that emit `Deprecation: true`.
See [trials and portfolios](/docs/api-trials-portfolios).

## List strategies

The cheapest discovery call. It returns a map of strategy id to name, so you can resolve ids
before asking for detail.

```http
GET /strategies
```

No path parameters. No query parameters.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/strategies
```

```json
{
  "data": {
    "7": "roc_top_n",
    "12": "mean_reversion"
  }
}
```

The payload is a JSON object, so ids arrive as object **keys** — strings, not numbers. Cast them
back to integers before passing them to `?strategy_ids=`.

> [!NOTE] Key order is not stable
> The handler builds the response from a Rust `HashMap`, which has no defined iteration order.
> The underlying query orders by `id`, but that ordering is lost in serialization. Sort client-side
> if you need a deterministic list.

### The /v1/strategies alias

`GET /v1/strategies` is bound to a thin wrapper that calls the same handler as `GET /strategies`
and returns identical output. It exists only so the alias can carry its own `operationId` in the
OpenAPI document. Prefer the unversioned path in new code; there is no plan recorded in the
service to remove the alias.

## Strategy metadata

The complete record for each strategy, keyed by id: name, execution details, parameter
declarations, and the ids of the studies that use it.

```http
GET /strategies/metadata
```

### Metadata query parameters

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `strategy_ids` | string (comma-separated integers) | No | none — returns every readable strategy | Whitespace around each element is trimmed. Each id is access-checked before anything is returned. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/strategies/metadata?strategy_ids=7"
```

Each requested id gets its own key in the map, so a two-id request returns two keys — or fails
whole, as the access rules further down explain.

```json
{
  "data": {
    "7": {
      "name": "roc_top_n",
      "description": "Pick the top N names by rate of change.",
      "execution_type": "internal",
      "execution_details": {
        "code": "def roc_top_n(data, start_date, end_date, n_top, roc_window_size, ma_kind):\n    ..."
      },
      "parameters": [
        {
          "parameter_name": "n_top",
          "description": null,
          "dtype": "integer",
          "is_window": false,
          "test_value": 10
        },
        {
          "parameter_name": "roc_window_size",
          "description": null,
          "dtype": "integer",
          "is_window": true,
          "test_value": 20
        },
        {
          "parameter_name": "ma_kind",
          "description": null,
          "dtype": "categorical",
          "is_window": false,
          "test_value": "ema",
          "choices": ["ema", "sma", "wma"]
        }
      ],
      "studies": [31, 44],
      "created_at": "2025-11-04 09:12:41.882374+00",
      "updated_at": "2026-02-18 17:03:55.104219+00"
    }
  }
}
```

### Metadata response fields

| Field | Type | Notes |
|---|---|---|
| `name` | string | Strategy name. |
| `description` | string \| null | Free-form description. |
| `execution_type` | `"internal"` \| `"external"` | Lowercase on this route. |
| `execution_details` | object | Shape depends on `execution_type` — see below. |
| `parameters` | array | Parameter declarations, in declaration order. |
| `studies` | number[] | Study ids referencing this strategy. Empty array when none. |
| `created_at` | string \| null | Raw Postgres timestamp text, e.g. `"2025-11-04 09:12:41.882374+00"` — **not** ISO-8601. |
| `updated_at` | string \| null | Same format. |

> [!WARNING] `created_at` and `updated_at` are not ISO-8601 here
> Both are selected with `::text`, so you get Postgres's own rendering: a space instead of `T`,
> microseconds, and a `+00` offset with no colon. Strict ISO-8601 parsers reject all three of
> those, so parse it explicitly rather than handing it to a generic date constructor.
> Timestamps elsewhere in this API use different formats again — baskets and
> operations are ISO-8601 with `Z`, trials are naive with no zone at all.

### Execution details by type

`execution_details` is an untagged union: there is no discriminator inside the object. Branch on
`execution_type`, or on the presence of `code` versus `endpoint`.

| `execution_type` | Fields | Notes |
|---|---|---|
| `"internal"` | `code` (string) | The Python source that runs inside Fintela. |
| `"external"` | `endpoint` (string), `timeout` (number), `max_concurrency` (integer) | `timeout` defaults to `30.0` and `max_concurrency` to `4` when absent from the stored record. |

See [execution modes](/docs/execution-modes) for what each mode means, and
[external strategies](/docs/external-strategies) for the contract an `external` endpoint must
satisfy.

### Parameter objects

Each entry of `parameters` is a declaration, not a value. Studies explore or pin these.

| Field | Type | Notes |
|---|---|---|
| `parameter_name` | string | The argument name your strategy function receives. |
| `description` | string \| null | Free-form. The app's strategy editor does not write this field, so expect `null`. |
| `dtype` | `"integer"` \| `"float"` \| `"categorical"` | Canonical values. The write path normalizes `int` to `integer` and `double` to `float` before storing. |
| `is_window` | boolean | True when the parameter is a lookback window. Always `false` for `categorical` — the write path rejects the combination. |
| `test_value` | number \| string | Editor metadata: the sample value used for validation. A number for numeric dtypes, one of `choices` for categorical. **Omitted, not null, when absent.** |
| `choices` | string[] | Present only for `dtype: "categorical"`. **Omitted, not null**, on numeric parameters. |

> [!WARNING] Explicit ids fail the whole request, one at a time
> With `?strategy_ids=`, every id is access-checked before any data is fetched, in the order you
> listed them. The first id your key cannot read aborts the request with `406 Not Acceptable` and
> `{"message": "Strategy 99 not found", "kind": "not_acceptable"}` — you get no partial map. A
> non-integer element fails earlier with `400 Bad Request` and
> `{"message": "Invalid id: 'x'", "kind": "bad_request"}`. Omitting `strategy_ids` never fails
> this way: it simply returns everything readable.

Note that `?strategy_ids=` with an empty value is not the same as omitting it. An empty string
parses as a single blank element and returns `400` with `{"message": "Invalid id: ''"}`.

## Parameter definitions

When you only need to know what a strategy takes — to build a form, validate a config, or mirror
the search space in your own tooling — this returns the declarations without the code.

```http
GET /strategies/params
```

### Params query parameters

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `strategy_ids` | string (comma-separated integers) | No | none — returns every readable strategy | Same parsing as metadata. **No per-id access check.** |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/strategies/params?strategy_ids=7"
```

```json
{
  "data": {
    "7": [
      { "name": "n_top",           "dtype": "integer",     "is_window": false },
      { "name": "roc_window_size", "dtype": "integer",     "is_window": true  },
      { "name": "ma_kind",         "dtype": "categorical", "is_window": false,
        "choices": ["ema", "sma", "wma"] }
    ]
  }
}
```

### Params response fields

| Field | Type | Notes |
|---|---|---|
| `name` | string | The parameter name. Note the rename: this is `parameter_name` on `/strategies/metadata`. |
| `dtype` | `"integer"` \| `"float"` \| `"categorical"` | Same canonical set as metadata. |
| `is_window` | boolean | Same meaning as metadata. |
| `choices` | string[] | Present only for `categorical`. Omitted otherwise. |

There is no `description` and no `test_value` on this route — the handler projects only these four
fields. Fetch `/strategies/metadata` if you need them.

> [!NOTE] This route silently drops unreadable ids
> Unlike `/strategies/metadata`, `/strategies/params` runs no per-id access check. Ids that do not
> exist, belong to another organization, or are soft-deleted are just absent from the result — the
> request still returns `200`. Ask for three ids and you may get two keys back. Compare the
> returned keys against the ids you sent rather than assuming a one-to-one mapping.

## Version history

Every material edit appends a row to an immutable log. A launched study pins the version it ran
with, so history is how you reproduce what a past run actually executed after the strategy kept
evolving.

```http
GET /v2/strategies/:id/versions
```

### Version path parameters

| Name | Type | Required | Notes |
|---|---|---|---|
| `id` | integer | Yes | The strategy id. A non-integer is rejected by the web framework before the handler runs — a plain-text `400`, outside the `{message, kind}` envelope. |

No query parameters. No pagination — the full history is returned in one array, ordered by
`version_number` descending, then `version_id` descending, so `data[0]` is the most recent
capture.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/strategies/7/versions
```

```json
{
  "data": [
    {
      "version_id": 918,
      "version_number": 3,
      "snapshot_name": "roc_top_n",
      "snapshot_execution_type": "INTERNAL",
      "snapshot_execution_details": {
        "code": "def roc_top_n(data, start_date, end_date, n_top, roc_window_size, ma_kind):\n    ..."
      },
      "snapshot_parameters": [
        { "parameter_name": "n_top", "dtype": "integer", "is_window": false, "test_value": 10 }
      ],
      "snapshot_extra_data_config": null,
      "snapshot_strategy_type": null,
      "note": "tightened the ROC window after the Q3 review",
      "created_at": "2026-02-18T17:03:55Z"
    }
  ]
}
```

### Version response fields

| Field | Type | Notes |
|---|---|---|
| `version_id` | integer | Global, monotonic row id. |
| `version_number` | integer | Per-strategy counter starting at `1`. |
| `snapshot_name` | string | The name at capture time. |
| `snapshot_execution_type` | `"INTERNAL"` \| `"EXTERNAL"` | **Uppercase here**, unlike the lowercase `execution_type` on `/strategies/metadata`. Compare case-insensitively. |
| `snapshot_execution_details` | object \| null | The `execution_details` JSON as it stood. |
| `snapshot_parameters` | array \| null | The `parameters` JSON as it stood. |
| `snapshot_extra_data_config` | object \| null | Frozen column — see below. |
| `snapshot_strategy_type` | string \| null | Frozen column — see below. |
| `note` | string \| null | The change note attached by the write path, or `null` when none was set. |
| `created_at` | string | ISO-8601 UTC, `YYYY-MM-DDTHH:MM:SSZ`, formatted in SQL. Second precision, no fractional part. |

### What appends a version

Version `1` is written by a database trigger the moment the strategy row is inserted, so a real
strategy always has at least one version. After that, a new version is appended only when one of
these columns actually changes:

| Column | Meaning |
|---|---|
| `execution_type` | Internal ⇄ external switch. |
| `execution_details` | Code, or endpoint/timeout/concurrency. |
| `parameters` | Any parameter declaration. |
| `lookback_mode` | How required lookback is declared. |
| `lookback_function_code` | The warm-up declaration snippet. |
| `data_source_graph` | Which data the strategy is wired to receive. |
| `deleted_at` | Soft delete and restore. |

Renaming a strategy or editing its description mints **no** version — the trigger deliberately
ignores those. And one save is one version even when the app writes the row and its data wiring as
two separate statements: the trigger coalesces captures that share a transaction.

Three of those columns — `lookback_mode`, `lookback_function_code` and `data_source_graph` — are
watched by the trigger but are **not** returned by this endpoint. A version whose only change was
one of them looks identical to its predecessor in this response.

### Frozen snapshot columns

`snapshot_extra_data_config` and `snapshot_strategy_type` are historical audit columns. The live
`extra_data_config` and `strategy_type` columns were dropped from `developers.strategies`, and the
capture trigger was rewritten to stop populating their snapshots at the same time. They are kept
only so old rows stay readable, and they are `null` on everything captured since. Treat a `null`
as "not recorded", never as a meaningful value.

> [!NOTE] An unreadable strategy returns an empty list, not a 404
> Asking for the versions of a strategy that does not exist, is soft-deleted, or belongs to another
> organization returns `200 OK` with `{"data": []}`. The service deliberately offers no existence
> oracle. Do not read an empty array as "this strategy has no history" — a real, readable strategy
> always has at least version `1`.

## Status codes on these routes

| Code | `kind` | When |
|---|---|---|
| `200` | — | Success, including an empty map or empty array. |
| `400` | `bad_request` | `strategy_ids` contains a non-integer element, on `/strategies/metadata` and `/strategies/params`. |
| `400` | — | Non-integer `:id` on `/v2/strategies/:id/versions`. Framework rejection, plain-text body, no envelope. |
| `401` | `unauthorized` | Missing or malformed `Authorization` header, or an unknown/revoked key. |
| `405` or `404` | — | Any write verb. Which of the two you get depends on whether the path exists as a `GET`. |
| `406` | `not_acceptable` | `?strategy_ids=` names a strategy this key cannot read. `/strategies/metadata` only. |
| `500` | `internal` | Redacted to `"Something went wrong on Fintela's side. Please try again in a moment."` The real cause stays in Fintela's logs. |

These routes never emit `403` — the whole Developer API never does. They never emit `429` either,
because they bypass the rate limiter. Full reference: [errors](/docs/api-errors).

## There is no push channel

Fintela has no webhooks, no server-sent events, no long-polling and no callback registration. If
you need to know when a strategy changes, poll `GET /v2/strategies/:id/versions` and compare
`data[0].version_id` against the last one you saw. That detects the material changes listed above
and nothing else — a rename or a description edit will not move it. To catch those, diff `name`
and `updated_at` from `GET /strategies/metadata` instead.

## Writes live in the app

There is no endpoint here to create, edit, delete or sandbox-run a strategy. Saving a strategy
compiles and validates code; sandbox-running one executes a simulation. Both consume metered
compute, which is debited from your organization's token ledger in the app. This API authenticates
with API keys and has no ledger integration, so a write accepted here would be compute billed to
nobody. The service's own policy is that any write exposed over API keys must go through the ledger
first. `POST`, `PUT`, `PATCH` and `DELETE` are rejected on every path, and CORS advertises `GET`
alone.

Author strategies in the [Strategies registry](/docs/strategies); read the results here.

## Machine-readable spec

`GET https://developer.fintela.io/openapi.json` returns the full OpenAPI 3.x document for all 38
documented routes, including the eight schemas behind this page: the `strategies`-scoped
`ExecutionType`, `ExecutionDetails`, `ExternalExecutionDetails` and `InternalExecutionDetails`
(namespaced because the fitness routes declare a same-named set), plus `StrategyParameter`,
`StrategyMetadata`, `ParamInfo` and `StrategyVersion`.
It needs no authentication, and a test asserts set equality between its paths
and the service's router in both directions, so it cannot silently drift from the running code.
Generate your client from it.

One caveat when reading it: each operation documents the **inner** payload, not the envelope. A
route documented as returning `StrategyMetadata` puts it inside `{"data": …}` on the wire.
