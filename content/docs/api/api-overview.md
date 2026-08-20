---
title: API overview
section: API Reference
sectionOrder: 10
order: 1
published: true
updated: 2026-08-20
summary: Base URL, the response envelope, conventions, and what the Developer API can and cannot do.
keywords: api, rest, developer.fintela.io, envelope, data, read-only, conventions, openapi, versioning, polling, no webhooks
---

The Fintela Developer API is a read-only JSON-over-HTTPS surface for pulling results out of the
platform. Every route is a `GET`. Studies, strategies, fitness functions, portfolios and portfolio
groups are created and controlled inside the Fintela app; this API answers questions about
resources that already exist. There is nothing to install — every endpoint is one `curl` away,
and the whole surface is described by a machine-readable OpenAPI document you can generate a
client from.

## Read-only by design

The service serves 39 `GET` paths and nothing else. There is no `POST`, `PUT`, `PATCH` or
`DELETE` anywhere on it, and the CORS layer advertises `GET` only.

The reason is billing, not caution. Every write this service used to expose was really a *compute*
trigger — launching a study, validating code against the compiler, refreshing or simulating a
basket, promoting a trial into a daily-updated portfolio. In the Fintela backend those same actions
pass through the token ledger, which debits your organization's balance before the work is
dispatched. This service authenticates with API keys and has no ledger integration, so every write
it accepted was compute billed to nobody. Reads are cheap and already paid for, so reads stayed.

> [!WARNING] Write verbs are rejected
> A `POST`, `PUT`, `PATCH` or `DELETE` to any path returns `405 Method Not Allowed` or
> `404 Not Found`, depending on whether the path matches a route at all. It never performs a
> partial write. Five previously-served write routes — trial promotion (two paths), daily-update
> toggling, basket refresh and basket simulate — are pinned as permanently removed by test.

## Base URL

```http
https://developer.fintela.io
```

Every path in this reference is relative to that base URL. Responses are always JSON. Requests
never carry a body, so there is no `Content-Type` to set — all filters and options travel in the
path or the query string.

Authenticate with a header on every route except `/health` and `/openapi.json`:

```http
Authorization: Bearer YOUR_API_KEY
```

Auth is header-only. See [API authentication](/docs/api-authentication) for how to obtain a key,
what a key can reach, and the rate limits.

> [!CAUTION] `?api_key=` is silently ignored
> The query parameter is still deserialized by the handlers but its value is discarded. A request
> that authenticates only through `?api_key=` gets a bare `401` with no hint that the auth method
> is the problem. Older Fintela examples that use it no longer work.

## Response envelope

### Successful responses

Every successful response on every authenticated route is wrapped in a single `data` key. The
status is always `200`; this API never returns `201`, `202` or `204`.

```json
{ "data": { "trial_id": 42, "study_name": "Momentum Strategy Q1" } }
```

For collection routes, `data` is an array or a map. For single-resource routes it is an object.
There is no `meta` block, no `errors` array and no pagination cursor beside it.

### Error responses

Every error body this service produces carries two fields:

```json
{ "message": "Invalid or revoked API key", "kind": "unauthorized" }
```

`message` is human-readable prose. `kind` is a coarse machine label — branch on it instead of
string-matching `message`, which is not a stable contract. These are the values this service can
return:

| `kind` | Status | Meaning |
|---|---|---|
| `bad_request` | 400 | Malformed or missing query parameter |
| `unauthorized` | 401 | Missing, unknown or revoked key |
| `not_found` | 404 | No such resource, or it is outside your organization |
| `not_acceptable` | 406 | An id in a metadata filter names a resource you cannot read |
| `rate_limited` | 429 | Your organization's token bucket is empty |
| `internal` | 500 | Server-side failure, redacted |

Every `500` has its real message replaced before it leaves the service. The body you receive is
always:

```json
{ "message": "Something went wrong on Fintela's side. Please try again in a moment.", "kind": "internal" }
```

The actual cause is written to Fintela's server logs and never returned to the client, so there is
nothing to parse out of a `500` beyond the status itself.

### Status codes actually emitted

| Status | When it happens |
|---|---|
| `200` | Every success |
| `400` | Malformed comma-separated id, missing required `study_ids`, `train + validation` weights that do not sum to `1.0`, negative `trial_number` |
| `401` | Missing or blank `Authorization` header, unknown or revoked key, key with no organization or no user |
| `404` | Resource not found, or outside your organization |
| `405` or `404` | Any write verb |
| `406` | `?strategy_ids=` on `/strategies/metadata`, or `?fitness_ids=` on `/fitness/metadata`, naming an id you cannot read |
| `429` | Rate limit exceeded — only on the subset of routes described under "Rate limits" below |
| `500` | Any database or serialization failure, redacted |

> [!NOTE] There is no `403`
> A resource you cannot reach returns `404`, never `403` — deliberately, so the API is not an
> existence oracle for other organizations' data. Do not write a `403` branch; the constructor is
> never called anywhere in this service.

`/health` is the only route that breaks the envelope — see "Health probe" below.

## Request conventions

### Filtering by id set

Several routes take a comma-separated list of integer ids, in a parameter named after the
resource. Whitespace around each element is trimmed; a non-integer token returns `400` with the message
`Invalid id: 'abc'`, naming the token that failed.

| Parameter | Routes |
|---|---|
| `study_ids` | The `/studies/*` analytics routes |
| `strategy_ids` | `/strategies/metadata`, `/strategies/params` |
| `fitness_ids` | `/fitness/metadata` |

`study_ids` is optional only on `/studies/metadata`, where omitting it means "every study". On
`/studies/progress`, `/studies/health`, `/studies/status`, `/studies/errors` and
`/studies/param-importances` it is required and its absence is a `400`; on the four
`/studies/opt/*` and `/studies/avg_opt/*` routes it is a required query parameter too.

Only two routes reject ids you cannot reach: `/strategies/metadata` and `/fitness/metadata` answer
`406` when `?strategy_ids=` / `?fitness_ids=` names one. Elsewhere an unreachable id is simply
absent from the result — `/strategies/params` and `/studies/metadata` apply no such gate.

### Filtering by parent

`?study_name=` narrows `/v1/portfolios` and `/v2/trials` to one study. It accepts either the
study's mutable display name or its immutable study key — both resolve. (The path route
`/v1/studies/:study_name` accepts both as well, and there prefers the display name.)

### Field expansion

Heavier blocks are opt-in through a comma-separated `?include=`. Only the single-resource routes
take it; the list routes ignore it.

| Route | Allowed values | Default when omitted |
|---|---|---|
| `/v2/trials/:trial_id`, `/v2/studies/:study_name/trials/:trial_number`, `/v1/portfolios/:portfolio_id` | `equity`, `holdings`, `metrics`, `params` | `metrics` |
| `/v2/portfolios/:id` | `equity`, `holdings`, `orders` | nothing — summary only |

Managed portfolios have no `metrics` block at all; they do not materialize metrics.

### Pagination

Pagination exists on exactly four routes — the operation-history sub-resources of a portfolio
group.

| Route | `limit` default | `offset` default |
|---|---|---|
| `/v2/baskets/:id/operations/:op_id/allocations` | `500` | `0` |
| `/v2/baskets/:id/operations/:op_id/orders` | `500` | `0` |
| `/v2/baskets/:id/operations/:op_id/state_log` | `500` | `0` |
| `/v2/baskets/:id/operations/:op_id/eod_reports` | `90` | `0` |

`limit` is clamped to `[1, 1000]` and `offset` is floored at `0`; out-of-range values are silently
corrected, not rejected. There are no cursors, no total count, and no `Link` pagination headers —
page until you get a short array.

Every other collection route returns its full result set in one response.

### Sorting

Sorting is not client-controllable anywhere except `/v1/studies/:study_name`, which takes
`?order=`. The value `asc` sorts ascending; **any** other string, including a typo, means
descending. Every other collection has a fixed server-side order:

| Route | Ordered by |
|---|---|
| `/v1/studies` | `created_at` descending |
| `/v1/portfolios`, `/v2/trials` | `created_at` descending |
| `/v2/portfolios` | `promoted_at` descending |
| `/v2/baskets` | `updated_at` descending |
| `/strategies`, `/fitness` | `id` ascending |
| `/v1/data_clusters` | `created_at` descending |
| `/v2/strategies/:id/versions`, `/v2/fitness/:id/versions` | `version_number` descending |
| `/v2/baskets/:id/operations` | `created_at` **ascending** — oldest first |
| `…/operations/:op_id/allocations` | `portfolio_id` ascending, then `recorded_at` descending |
| `…/operations/:op_id/orders` | `created_at` descending |
| `…/operations/:op_id/state_log` | `occurred_at` descending |
| `…/operations/:op_id/eod_reports` | `trading_day` descending |

Note the operations list is the one timestamp-ordered collection that comes back oldest-first;
`/strategies` and `/fitness` are ordered by `id` ascending, which has the same effect.

### Absent keys, not nulls

Optional blocks and lineage ids are **omitted** from the JSON when they have no value, rather than
serialized as `null`. Test for key presence, not for `null`. This applies to `managed_portfolio_id`,
and to every `?include=` block on trials, v1 portfolios and managed portfolios.

### Timestamp formats

Timestamp formatting is not uniform across the surface. A client that parses `created_at` the same
way everywhere will break.

| Fields | Format | Example |
|---|---|---|
| `created_at` on trials and v1 portfolios | UTC datetime with the zone suffix stripped | `2024-03-12T14:22:00` |
| Baskets, operations, managed portfolios, asset groups | ISO-8601 UTC with `Z` | `2024-04-02T10:00:00Z` |
| `created_at` / `updated_at` on strategies and fitness functions | Raw PostgreSQL timestamp text | `2025-11-04 09:12:41.882374+00` |

## Versioning

Three unrelated things share the word "version" on this API. Separating them matters, because two
of them look like a version migration and are not.

### `/v1/portfolios` is genuinely deprecated

`GET /v1/portfolios` and `GET /v1/portfolios/:portfolio_id` are the only deprecated routes in the
service, and the only ones that emit response headers beyond the defaults:

```http
Deprecation: true
Link: </v2/trials>; rel="successor-version"
```

The successor is `/v2/trials`. It serves identical rows from the same query with two fields
renamed — `portfolio_id` becomes `trial_id`, `trial` becomes `trial_number`. Nothing else changes.
v1 stays frozen, so existing integrations keep working, but new ones should target `/v2/trials`.
See [trials and portfolios](/docs/api-trials-portfolios).

### `/v1/portfolios` and `/v2/portfolios` are different resources

This is the most dangerous ambiguity on the API. They are not two versions of one thing:

| Path | Resource | Successor / relation |
|---|---|---|
| `/v1/portfolios/:portfolio_id` | A **trial** — one row from a study's optimization | Renamed to `/v2/trials/:trial_id` |
| `/v2/portfolios/:id` | A **managed portfolio** — a live, daily-updated copy promoted from a trial | Not a version of anything |

> [!CAUTION] The id spaces are unrelated
> `/v1/portfolios/42` and `/v2/portfolios/42` return different objects that have nothing to do with
> each other. Bumping a path from `v1` to `v2` on a portfolio id silently retrieves the wrong
> record. The link between them is the `managed_portfolio_id` field on a trial, which is present
> only when that trial was promoted.

### `/v2/…/versions` is edit history

`GET /v2/strategies/:id/versions` and `GET /v2/fitness/:id/versions` return the edit history of one
resource — successive saved revisions. The `/v2` prefix here is an accident of when the feature
shipped and carries no API-version meaning.

### Versioned aliases

| Path | Relationship |
|---|---|
| `/v1/strategies` | Byte-identical alias of `/strategies` |
| `/v1/studies`, `/v1/studies/:study_name` | No unversioned twin — these paths are the only way in |

Net: the unversioned paths (`/studies/*`, `/strategies*`, `/fitness*`) are the newest surface,
`/v1` mixes one frozen-deprecated family with one plain alias, and `/v2` mixes the new
trials/portfolios/baskets taxonomy with one unrelated feature. Only `/v1/portfolios*` is actually
deprecated, and it is the only family that says so in a header.

## The OpenAPI document

```http
GET /openapi.json
```

Public, unauthenticated, and the most reliable artifact Fintela publishes about this API. It is an
OpenAPI 3.x document generated from the handler annotations at build time, not hand-maintained.

```bash
curl https://developer.fintela.io/openapi.json
```

Why it can be trusted: a test parses the `.route(...)` literals straight out of the router source
and asserts **set equality in both directions** against the document's path keys, plus an exact
total. A route added without documentation fails the build; a documented path that no longer exists
fails the build too. The spec cannot silently drift from the service.

| Property | Value |
|---|---|
| `info.title` | `Fintela Developer API` |
| `info.version` | `1.0.0` — a *document* version, unrelated to the `/v1` and `/v2` path prefixes |
| Documented paths | 38 — the 37 authenticated routes plus `/health` |
| Security scheme | `api_key_bearer`, HTTP Bearer, `bearerFormat: API key`, applied globally with an empty scope list |

`/openapi.json` itself is the 39th served path and is deliberately absent from the document — it is
served by a closure rather than an annotated handler, so it has nothing to describe itself with.

> [!TIP] Generating a client
> Response bodies in the document are the **inner** payload, not the envelope. An operation
> documented as returning `TrialResponse` actually returns that object nested under a `data` key on
> the wire. Wrap the generated types, or unwrap `data` in your transport layer, before using
> generated models directly. The document's own `info.description` also still describes the error
> body as `{"message": …}`; the wire body carries `kind` alongside it, as shown above.

## Health probe

```http
GET /health
```

Public, unauthenticated, and the only route on the service that is **not** enveloped — it returns
the status object directly, with no `data` key.

```json
{ "status": "ok", "db": "ok" }
```

When the database probe fails:

```json
{ "status": "ok", "db": "error", "db_error": "connection closed" }
```

> [!WARNING] `status` is always `"ok"`
> The `status` field does not reflect database reachability. A monitor that checks only `status`
> will report healthy while the service cannot answer a single data request. Assert on `db == "ok"`
> instead.

## No webhooks — poll instead

There are **no webhooks** on the Fintela Developer API. There is no callback registration, no
server-sent events, no long-poll, and no push channel of any kind. Nothing on
`developer.fintela.io` will ever call your infrastructure.

Integrations must poll. Practically:

- To follow a running study, poll `GET /studies/progress` and `GET /studies/status` on an interval
  matched to how long your studies run — see [studies](/docs/api-studies).
- To detect that a trial was promoted, poll `GET /v2/trials` and watch for `managed_portfolio_id`
  appearing on the row.
- To follow live trading, poll `GET /v2/baskets/:id/freshness` and the operation history routes —
  see [portfolio groups](/docs/api-baskets).

Keep your polling interval well inside the rate limit and cache what has not changed. The
timestamp-ordered collections are newest-first — trials, v1 portfolios, managed portfolios,
baskets, studies and asset groups — so the head of the response is usually enough to detect
change. Operations are the exception: they come back oldest-first, so a change lands at the end.

## Rate limits

Rate limiting is per organization, shared across every key the organization holds, and keyed on the
organization resolved from your key — so it cannot be forged. Defaults are **20 requests per second
sustained with a burst of 40**. Exceeding it returns `429` with `kind: "rate_limited"` and a
`Retry-After: 1` header.

There are **no `X-RateLimit-*` headers**. You cannot observe your remaining budget; you find out by
being refused.

The token bucket is in-process: one bucket per organization per running service task, held in
memory, not in a shared store. The service runs between one and six tasks, so the ceiling you
actually hit can be a multiple of 20 rps depending on how requests land. Treat 20 rps as the
number to design against, not as headroom to spend.

> [!CAUTION] The limit does not cover the whole API today
> The limiter lives in one authentication helper, and three route families call a lower-level pair
> of functions that skip it. As of this writing, 17 of the 37 authenticated routes are limited —
> trials, managed portfolios, v1 portfolios, portfolio groups and their operations, and asset
> groups. All 12 studies routes (the ten `/studies/*` analytics routes plus `/v1/studies` and
> `/v1/studies/:study_name`), all 5 strategies routes and all 3 fitness routes are **not**
> limited. This inconsistency is a known defect, not a guarantee: build your client to back off on
> `429` from any route.

Full details, including which routes are in which group, are on
[API authentication](/docs/api-authentication).

## A complete example

Fetch one trial with its equity curve and metrics:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://developer.fintela.io/v2/trials/42?include=equity,metrics"
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
    "metrics": { "validation": { "sharpe": 1.12, "cagr": 0.16 } }
  }
}
```

Everything on this page is visible in that one exchange: the `Authorization` header, the `data`
envelope, `?include=` expansion, a UTC timestamp with no zone suffix, and `managed_portfolio_id`
present only because this trial was promoted — on an unpromoted trial the key would be absent
rather than `null`.

If the key were wrong, the same request would return `401` and:

```json
{ "message": "Invalid or revoked API key", "kind": "unauthorized" }
```

## Where each resource lives

| Page | Routes | Covers |
|---|---|---|
| [API authentication](/docs/api-authentication) | — | Keys, the `Authorization` header, what a key can reach, rate limits |
| [Studies](/docs/api-studies) | 12 | Study listing, metadata, progress, health, status, errors, optimization history, parameter importances |
| [Strategies](/docs/api-strategies) | 5 | Strategy listing, metadata, parameters, version history |
| [Fitness functions](/docs/api-fitness) | 3 | Fitness listing, metadata, version history |
| [Trials and portfolios](/docs/api-trials-portfolios) | 7 | `/v2/trials`, the deprecated `/v1/portfolios`, and managed portfolios at `/v2/portfolios` |
| [Portfolio groups](/docs/api-baskets) | 9 | Baskets, freshness, operations and their allocation, order, state-log and end-of-day history |
| [Asset groups](/docs/api-asset-groups) | 1 | `/v1/data_clusters` — asset groups are called data clusters on the API |
| [Errors](/docs/api-errors) | — | Every status code, `kind` value and message shape in one place |

Two naming carry-overs are worth knowing before you read those pages: **Asset Groups** are
`data_clusters` on the API, and **Portfolio Groups** are `baskets`. The API keeps the older names
so existing integrations keep resolving.
