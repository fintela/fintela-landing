---
title: Fitness
section: API Reference
sectionOrder: 10
order: 7
published: true
updated: 2026-08-20
summary: Read fitness functions, their metadata and version history.
keywords: /fitness, GET, fitness function, metadata, versions, direction
---

A fitness function is what scores a trial, so it is the piece of a study you most often need to
reproduce months later. Three `GET` routes on `https://developer.fintela.io` read them: a cheap
`{ id: name }` index, the full record including source code and parameter declarations, and the
append-only edit history behind one function. All three are read-only — fitness functions are
authored in the app (see [Fitness functions](/docs/fitness-functions)), and the API exists to
reproduce, audit and document what already exists.

## Endpoints

| Method | Path | Returns |
|---|---|---|
| `GET` | `/fitness` | Map of fitness id to name. |
| `GET` | `/fitness/metadata` | Map of fitness id to the full record. Filter with `?fitness_ids=`. |
| `GET` | `/v2/fitness/{id}/versions` | Append-only edit history for one function, newest first. |

`/v2/fitness/{id}/versions` is resource edit history, not "API v2". It shares a path prefix with
`/v2/trials` and `/v2/portfolios` and has nothing else in common with them — see
[API overview](/docs/api-overview) for how the three unrelated meanings of "version" are laid out.

## Authentication and response envelope

Authentication is header-only:

```http
GET /fitness HTTP/1.1
Host: developer.fintela.io
Authorization: Bearer YOUR_API_KEY
```

Every successful response is wrapped as `{"data": ...}`. Every error is
`{"message": "...", "kind": "..."}`. There are no scopes: a key reaches everything its
organization can read. Full details in [Authentication](/docs/api-authentication).

> [!WARNING] `?api_key=` is silently ignored, not rejected
> The query parameter is still deserialized by these handlers and its value is discarded. A
> request that carries only `?api_key=` gets a bare `401` with no hint that the auth method is the
> problem. Send the `Authorization` header.

## Rate limiting does not apply to these routes

The organization token bucket lives inside the service's `authenticate()` helper. All three
fitness routes call the lower-level extract-and-validate pair directly, so they never touch the
bucket and **cannot return `429` today**.

| Route family | Rate limited |
|---|---|
| trials, managed portfolios, v1 portfolios, baskets, basket operations, data clusters (17 routes) | Yes |
| studies (12 routes), strategies (5 routes), **fitness (3 routes)** | No |

> [!CAUTION] This is a code defect, not a guarantee
> The exemption reads as an incomplete migration to the shared helper rather than a decision. Do
> not build a client that depends on fitness routes being unlimited — treat the documented limit
> as the contract and rate-limit yourself. Where the limit does apply it is 20 requests/second
> with a burst of 40, keyed on the organization, and a rejection carries `Retry-After: 1`. There
> are no `X-RateLimit-*` headers anywhere on this API, so a client cannot see its remaining budget
> until it is refused. The bucket is also per process and the service autoscales to several tasks,
> so the effective ceiling is a multiple of the nominal one.

## List fitness functions

```http
GET /fitness
```

No path parameters, no query parameters. Returns every fitness function that belongs to your
organization and is not soft-deleted.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/fitness
```

```json
{
  "data": {
    "4": "sharpe_with_drawdown_penalty",
    "9": "calmar_capped"
  }
}
```

The payload is a JSON object, so ids arrive as **string keys**. Key order carries no meaning —
the service builds the response from a hash map, so sort client-side if you need a stable
ordering. This is the cheapest call on the fitness surface: use it to discover ids, then fetch
detail for the few you care about.

## Fitness metadata

```http
GET /fitness/metadata
GET /fitness/metadata?fitness_ids=4,9
```

Returns the complete record for each fitness function, keyed by id.

### Query parameters

| Name | Type | Required | Default | Notes |
|---|---|---|---|---|
| `fitness_ids` | string — comma-separated integers | No | absent means every fitness function in your organization | Whitespace around each id is trimmed, so `?fitness_ids=4, 9` is accepted. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/fitness/metadata?fitness_ids=4"
```

```json
{
  "data": {
    "4": {
      "name": "sharpe_with_drawdown_penalty",
      "description": "Sharpe, penalized for deep drawdowns.",
      "execution_type": "internal",
      "execution_details": {
        "code": "def fitness(equity, trades, penalty_weight):\n    ..."
      },
      "parameters": [
        {
          "parameter_name": "penalty_weight",
          "dtype": "float",
          "description": "How hard to punish drawdown."
        }
      ],
      "studies": [31, 44],
      "created_at": "2025-11-04 09:12:41.882374+00",
      "updated_at": "2026-02-18 17:03:55.104219+00"
    }
  }
}
```

### Metadata fields

| Field | Type | Description |
|---|---|---|
| `name` | string | Unique within the organization — a unique index enforces it. |
| `description` | string \| null | Free-form description. Serialized as `null` when unset, never omitted. |
| `execution_type` | `"internal"` \| `"external"` | Lowercase on this route. Uppercase in version snapshots — compare case-insensitively. |
| `execution_details` | object | Shape depends on `execution_type`; see below. |
| `parameters` | array of objects | Parameter declarations. |
| `studies` | array of integers | Ids of studies in your organization that reference this function, excluding soft-deleted ones. `[]` if it has never been used. |
| `created_at` | string \| null | Postgres timestamp text, not ISO-8601 — see the timestamp table below. |
| `updated_at` | string \| null | Same format. Moves on every save from the fitness editor, including a rename. |

Each entry of `parameters`:

| Field | Type | Description |
|---|---|---|
| `parameter_name` | string | The name the function receives. |
| `dtype` | string | Declared type as stored, e.g. `"float"`. |
| `description` | string | **Key is absent** when unset, rather than `null`. |

Fitness parameters have no `is_window` flag, unlike strategy parameters — a fitness function
scores a finished simulation, so there is no rolling window to declare. See
[Strategies](/docs/api-strategies) for that contrast.

There is no `direction` field on this route. The eight fields above are the whole record, and
`developers.fitness` has no direction column — an optimization direction is not part of the
metadata response. The one place the word appears on this API is inside
`snapshot_execution_details` on a *built-in* version snapshot — see "Built-in objectives are not
returned" below.

> [!NOTE] A malformed `parameters` blob returns as `[]`
> If the stored declaration does not deserialize into the shape above, the service substitutes an
> empty array instead of failing the request. An empty `parameters` therefore means either "no
> parameters" or "unreadable declaration"; it is never an error you can see from the outside.

### Execution details

`execution_details` is an untagged union. Discriminate on `execution_type`, or on the presence of
`code` versus `endpoint`.

For `"internal"` — Python that runs inside Fintela:

| Field | Type | Description |
|---|---|---|
| `code` | string | The function source, verbatim. |

For `"external"` — an HTTPS endpoint you host (see [External fitness](/docs/external-fitness) and
[Execution modes](/docs/execution-modes)):

| Field | Type | Default | Description |
|---|---|---|---|
| `endpoint` | string | — | URL Fintela calls to score each trial. |
| `timeout` | number | `30.0` | Seconds. The default is applied at read time when the stored configuration omits the key. |
| `max_concurrency` | integer | `4` | Parallel in-flight calls. Same default behaviour. |

### Requesting specific ids

With `?fitness_ids=`, each id is checked for readability **before any data is returned**, one at a
time. The request is all-or-nothing: it never degrades to a partial map because one id failed.

| Condition | Status | Body |
|---|---|---|
| A token is not an integer | `400` | `{"message": "Invalid id: 'abc'", "kind": "bad_request"}` |
| An id exists but is not readable by your key, or does not exist | `406` | `{"message": "Fitness 4 not found", "kind": "not_acceptable"}` |

Omit the filter if you would rather receive whatever is readable and reconcile client-side.

> [!NOTE] The OpenAPI document is wrong on one status here
> `openapi.json` annotates this route with `404` for an unreadable id. The handler emits `406`.
> The handler is the truth. This is the only outright contradiction on the fitness surface;
> elsewhere the document merely under-lists — none of the three routes declares `500`, and the
> versions route declares only `200` and `401`.

## Version history

```http
GET /v2/fitness/{id}/versions
```

| Path parameter | Type | Description |
|---|---|---|
| `id` | integer | Fitness function id. |

Every behavioural edit appends a row to an append-only log, so you can answer "what did this
scoring function actually look like when that study ran?" long after the fact. Rows come back
newest first, ordered by `version_number` descending.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/fitness/4/versions
```

```json
{
  "data": [
    {
      "version_id": 512,
      "version_number": 3,
      "snapshot_name": "sharpe_with_drawdown_penalty",
      "snapshot_execution_type": "INTERNAL",
      "snapshot_execution_details": {
        "code": "def fitness(equity, trades, penalty_weight):\n    ..."
      },
      "snapshot_parameters": [
        { "parameter_name": "penalty_weight", "dtype": "float" }
      ],
      "snapshot_extra_data_config": null,
      "note": "raised the penalty after the Q3 review",
      "created_at": "2026-02-18T17:03:55Z"
    }
  ]
}
```

### Version fields

| Field | Type | Description |
|---|---|---|
| `version_id` | integer (64-bit) | Row id of the history entry. Ties on `version_number` break by this, descending. |
| `version_number` | integer | Per-function counter, unique per fitness id. Version `1` is created with the function. |
| `snapshot_name` | string | The name the function had when the version was captured. |
| `snapshot_execution_type` | string | Uppercase — `"INTERNAL"`, `"EXTERNAL"` or `"BUILTIN"` — where `/fitness/metadata` reports lowercase. |
| `snapshot_execution_details` | object \| null | The code or endpoint configuration as it stood. |
| `snapshot_parameters` | array \| null | Parameter declarations as they stood. |
| `snapshot_extra_data_config` | object \| null | Retired. Kept for historical rows; **never populated on new versions** since the column it mirrored was dropped from the live table. Expect `null` on anything recent. |
| `note` | string \| null | Optional note recorded with the edit. Rows back-filled when history was introduced carry the literal note `auto-seeded v1 from existing row`. |
| `created_at` | string | ISO-8601 UTC to the second, always `Z`-suffixed. |

The data-source wiring a version ran with is recorded in the database but is **not** returned by
this route. If you need it, read it in the app.

### When a version is appended

A version is captured when the function is created, and thereafter only when one of these changes:

| Change | Appends a version |
|---|---|
| `execution_type` | Yes |
| `execution_details` (the code or endpoint configuration) | Yes |
| `parameters` | Yes |
| Data-source wiring | Yes |
| Soft delete or restore | Yes |
| Rename | **No** |
| Description edit | **No** |

So a rename alone leaves no trace in the history, and the new name simply appears on the next
version that is captured for another reason. Multiple writes inside one save are coalesced into a
single version — one save is one version, whatever order the statements land in.

> [!NOTE] An empty array is the not-readable answer
> This route returns `200` with `{"data": []}` — never a `404` — for a fitness id your key cannot
> read, and the same empty array for one that genuinely has no history. Version snapshots carry
> historical source code, so they are withheld without confirming whether the id exists. Treat an
> empty array as "nothing available to you", not as proof the function was never edited.

## Built-in objectives are not returned

Fintela ships platform-owned fitness rows — `sharpe_ratio`, `sortino_ratio`, `calmar_ratio`,
`max_drawdown`, `volatility`, `total_return`, `compound_annual_growth_rate` and others — which let
a study optimize a built-in metric without any custom code. They carry the execution type
`BUILTIN` and belong to no organization.

`/fitness` and `/fitness/metadata` both filter strictly on your organization id, so **built-in
objectives never appear in either response**. That is why `execution_type` on this API is only
ever `"internal"` or `"external"`.

The readability gate on `?fitness_ids=` uses a different predicate that *does* admit
platform-owned rows. The consequence is a quiet inconsistency worth coding against:

| You send | What happens |
|---|---|
| `?fitness_ids=` naming a built-in id | Passes the gate — no `406` — then the id is simply **missing** from the returned map. |
| `GET /v2/fitness/{id}/versions` for a built-in id | Returns history, with `snapshot_execution_type: "BUILTIN"` and a `snapshot_execution_details` of `{"metric_name", "direction", "unit", "category"}` instead of `code` or `endpoint`. |

Always key off what the map returns rather than off what you asked for. A `200` with fewer entries
than ids requested is a normal outcome here, not an error.

## Timestamp formats

The two routes that return timestamps do not agree on format, and neither matches the ISO-8601
`Z` shape used by baskets and managed portfolios. Parse per field, not per API.

| Field | Route | Format | Example |
|---|---|---|---|
| `created_at`, `updated_at` | `/fitness/metadata` | Raw Postgres timestamp text: space separator, microseconds, `+00` offset | `2025-11-04 09:12:41.882374+00` |
| `created_at` | `/v2/fitness/{id}/versions` | ISO-8601 UTC, second precision | `2026-02-18T17:03:55Z` |

## Errors on these routes

| Status | `kind` | When |
|---|---|---|
| `200` | — | Success. |
| `400` | `bad_request` | `fitness_ids` contains a token that is not an integer. |
| `401` | `unauthorized` | Missing or blank `Authorization: Bearer`, unknown or revoked key, or a key with no organization or no user attached. |
| `406` | `not_acceptable` | `fitness_ids` names an id your key cannot read. |
| `500` | `internal` | Any database or serialization failure. The message is redacted to a generic sentence; the real cause stays in Fintela's logs. |

Three absences are deliberate:

- **No `403`.** The service never constructs one. A resource you cannot read is a `406` on the id
  gate or an omission from a collection, never a permission error — there is no existence oracle.
- **No `404`.** None of the three fitness routes emits one. An unreadable id is `406` on
  `/fitness/metadata` and an empty array on the versions route.
- **No `429`.** These routes bypass the rate limiter, as described above.

Write verbs are rejected outright — the whole API is `GET`-only and CORS advertises `GET` alone,
so `POST`, `PUT`, `PATCH` and `DELETE` against any fitness path fail at the router. The full
catalogue is in [Errors](/docs/api-errors).

## Polling for changes

There are **no webhooks** on `developer.fintela.io`, and no push channel of any kind — no SSE, no
long-poll, no callback registration. Integrations poll.

Two signals are available, and they answer different questions:

| Signal | Moves when | Use it for |
|---|---|---|
| `updated_at` on `/fitness/metadata` | Any save from the fitness editor, including a rename or description-only edit | "Has anything about this function changed?" |
| `version_number` on `/v2/fitness/{id}/versions` | Only behavioural edits (see the table above) | "Has the scoring behaviour changed?" |

A cheap loop is `GET /fitness` to detect additions and removals, then `GET /fitness/metadata` for
the ids you track and compare `updated_at`. Reach for the versions route only when `updated_at`
moved and you need to know exactly what changed.
