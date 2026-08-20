---
title: Asset groups
section: API Reference
sectionOrder: 10
order: 8
published: true
updated: 2026-08-20
summary: Read asset group definitions through the data-clusters endpoint.
keywords: /v1/data_clusters, GET, asset group, data cluster, universe, tickers
---

An asset group is a named universe of input series — tickers, portfolio groups, or both — that
studies and strategies run over. The Developer API exposes exactly one route for them —
`GET /v1/data_clusters` — which returns a lightweight index of every asset group in your
organization: id, name, description, ticker count and creation time. It
takes no parameters, has no detail sibling, and does not return the tickers themselves. Like every
other route on `https://developer.fintela.io`, it is read-only.

## Asset groups are `data_clusters` in the API

The product calls these objects **Asset Groups**. The API path calls them `data_clusters`. They are
the same object; the name changed in the product and the path did not.

| Surface | Term | Identifier |
|---|---|---|
| API path | `data_clusters` | `GET /v1/data_clusters` |
| API response schema | `DataClusterListItem` | `id` |
| Database table | `developers.data_clusters` | `id` |
| App UI | Asset Groups | `/asset-groups` (the old `/dataCluster/*` URLs redirect there) |
| Study metadata fields | `strategy_data_cluster_id`, `fitness_data_cluster_id` | `id` |

The `id` returned by this endpoint is the same integer that appears as `strategy_data_cluster_id`
and `fitness_data_cluster_id` on `GET /studies/metadata`, so those two fields are the join key back
into this list. See [asset groups](/docs/asset-groups) for the UI side and
[studies](/docs/api-studies) for the metadata endpoint.

## List asset groups

```http
GET /v1/data_clusters
```

The endpoint takes **no path parameters and no query parameters**. There is no pagination, no
filtering, no sorting control and no id-set filter — the entire organization's list comes back in
one response.

Authentication is the same header-only Bearer scheme used everywhere on this API. The handler reads
the `Authorization` header and nothing else — it declares no query extractor at all, so a
`?api_key=` value is not merely rejected, it is never looked at. A request that relies on it gets
the ordinary missing-header `401` — the `Missing API key…` message quoted below, with no
indication that a credential was present and ignored. See
[authentication](/docs/api-authentication).

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v1/data_clusters
```

### Response fields

The body is the standard success envelope, `{"data": [...]}`, wrapping an array of
`DataClusterListItem`.

| Field | Type | Description |
|---|---|---|
| `id` | integer | Asset group id. This is what studies reference as `strategy_data_cluster_id` / `fitness_data_cluster_id`. |
| `name` | string | Display name, as set in the app. Always present. |
| `description` | string \| null | Free-form description. Serialized as `null` when unset — the key is always present. |
| `ticker_count` | integer | Number of tickers in the group, computed as `jsonb_array_length(tickers_id)`. **Can legitimately be `0`** — see the note below. |
| `created_at` | string \| null | ISO-8601 UTC with a `Z` suffix, e.g. `"2023-10-15T12:00:00Z"`. Serialized as `null` when the column is null. |

> [!WARNING] `ticker_count: 0` does not mean an empty asset group
> An asset group's universe is tickers **and/or** portfolio-group members. A group can be made
> entirely of portfolio groups, whose equity curves are injected into the price panel as
> `BASKET:` pseudo-ticker columns. Such a group stores an empty ticker array and a non-empty
> `basket_members` array, so `ticker_count` comes back as `0` while the group is perfectly valid.
> The database constraint requires at least one ticker **or** at least one basket member — not at
> least one ticker. `basket_members` is not exposed by this endpoint, so `ticker_count` alone
> cannot tell you whether a group is empty. Do not treat `0` as a data error or filter those rows
> out.

> [!NOTE] These optionals are `null`, not absent
> Most resources on this API use `skip_serializing_if` for optional fields, so a missing value means
> an **absent key**. `DataClusterListItem` does not: `description` and `created_at` are always
> present in the JSON and carry `null` when empty. Do not write a presence check here that you
> copied from the trials or strategies pages.

### Example response

```json
{
  "data": [
    {
      "id": 1,
      "name": "S&P 500 Top 100",
      "description": "Top 100 companies by market cap in the S&P 500 index",
      "ticker_count": 100,
      "created_at": "2023-10-15T12:00:00Z"
    },
    {
      "id": 2,
      "name": "Tech Sector",
      "description": null,
      "ticker_count": 45,
      "created_at": "2023-12-01T09:00:00Z"
    }
  ]
}
```

## Ordering and scope

| Concern | Behaviour |
|---|---|
| Order | `created_at DESC` — newest first. Fixed server-side; there is no `order` or `sort` parameter. Because the column is nullable and Postgres sorts `DESC` as `NULLS FIRST`, any row with a null `created_at` leads the list. |
| Scope | Rows whose `organization_id` matches the organization the API key resolves to. Nothing else is filtered. |
| Soft deletes | None. `developers.data_clusters` has **no** soft-delete column — deletion is a hard delete, so a removed asset group simply stops appearing. |
| Platform-shared groups | Not returned. The access spec for `data_cluster` declares `allow_platform_shared: false`, and the handler's SQL matches it: a plain `organization_id = $1` with no null-org branch, so only groups owned by your organization are listed. |

There is no privacy within an organization. Every asset group any member of your organization
created is visible to every API key issued for that organization. The per-owner visibility model
that older documentation described — private resources, share grants, results-only access — was
removed from the database and no longer exists.

## What this endpoint does not return

Being explicit about the gaps, because there is no second route to fall back on:

| Not returned | Notes |
|---|---|
| The ticker list | `tickers_id` is stored but never serialized. The API gives you the count only. |
| `basket_members` | Portfolio-group membership is stored on the same row and is not exposed at all — not as a list, not even as a count. This is why `ticker_count` alone cannot describe a group's universe. |
| `updated_at` | The column exists on the table; the response schema does not include it. |
| A detail route | There is no `GET /v1/data_clusters/{id}`. `/v1/data_clusters` is the only asset-group path anywhere on the API. |
| A `/v2` equivalent | None exists. |
| Any write | The API is read-only. `POST`, `PUT`, `PATCH` and `DELETE` on this path are rejected with `405` or `404`, and a test pins that behaviour for `/v1/data_clusters` specifically. |

## Errors

| Status | `kind` | When |
|---|---|---|
| `200` | — | Success. An organization with no asset groups gets `{"data": []}`. |
| `401` | `unauthorized` | Missing or blank `Authorization` header; unknown or revoked key; a key whose row has no organization or no associated user. |
| `429` | `rate_limited` | The organization's token bucket is exhausted. Carries `Retry-After: 1`. |
| `500` | `internal` | Any database or serialization failure. The real message is redacted to `Something went wrong on Fintela's side. Please try again in a moment.` |

The four `401` messages are distinct, and worth matching on when you debug. Verbatim, in the order
the service checks them:

```text
Missing API key. Provide it via the `Authorization: Bearer <key>` header.
Invalid or revoked API key
API key is not associated with an organization
API key has no associated user
```

The first fires when the header is absent, is not a `Bearer` value, or the value after `Bearer ` is
empty. The second is an unknown or revoked key. The last two are malformed key rows.

Error bodies carry two fields, not one:

```json
{ "message": "Invalid or revoked API key", "kind": "unauthorized" }
```

`400`, `404` and `406` are not reachable on this route — it accepts no input to reject and resolves
no id. `403` is never emitted anywhere on this API. Full envelope and status reference on the
[errors](/docs/api-errors) page.

> [!WARNING] The OpenAPI entry for this route under-declares its responses
> The `#[utoipa::path]` annotation lists only `200`, `401` and `500`. `429` is reachable at runtime
> because this route passes through the rate limiter. Handle `429` even though the generated spec
> does not mention it.

## Rate limiting

`GET /v1/data_clusters` **is** rate limited. It is one of 17 routes that authenticate through the
limiter path.

| Knob | Environment variable | Value |
|---|---|---|
| Refill rate | `DEV_API_RATE_LIMIT_RPS` | `20` requests/second |
| Burst capacity | `DEV_API_RATE_LIMIT_BURST` | `40` |

Neither variable is set in the deployment configuration, so production runs those built-in
defaults. Setting the refill rate to `0` or below disables the limiter entirely.

The bucket is keyed on the organization, so it is shared across every API key your organization
holds. There are no `X-RateLimit-Limit`, `X-RateLimit-Remaining` or `X-RateLimit-Reset` headers
anywhere on this API — you cannot see your remaining budget until a request is refused. A rejection
is a `429` with `Retry-After: 1`.

> [!CAUTION] Rate limiting is not applied consistently across the API today
> The bucket lives inside the shared `authenticate()` helper. Trials, managed portfolios, v1
> portfolios, baskets, basket operations and this endpoint call it and are limited. All 12 studies
> routes — the ten `/studies/*` paths plus `/v1/studies` and `/v1/studies/{study_name}` — all 5
> strategies routes and all 3 fitness routes call the lower-level
> extract-and-validate pair directly and never touch the bucket. Do not assume a uniform 20 rps
> across the surface, and do not assume the unlimited families will stay that way.
>
> The bucket is also held in process memory, and the service autoscales between 1 and 6 tasks with
> no sticky routing, so the effective organization ceiling under load can be a multiple of the
> nominal rate. Treat 20 rps as the number to design against, not as a guaranteed floor.

## Polling for changes

There are **no webhooks** on the Developer API — not outbound callbacks, not server-sent events,
not long-polling, not any other push channel. If you need to notice a new or renamed asset group,
poll `GET /v1/data_clusters` on a schedule of your choosing.

Because the response is small, unpaginated and ordered newest-first, a full re-fetch is the whole
polling strategy: compare `id` sets against your last snapshot to detect additions and hard
deletions, and compare `name` / `description` / `ticker_count` to detect edits. There is no
`updated_at`, no ETag and no conditional-request support to shortcut this.

## Machine-readable spec

The whole surface, this route included, is published as an OpenAPI 3.x document:

```http
GET /openapi.json
```

It is public and requires no authentication. A test asserts set equality in both directions between
the document's paths and the service's router — 38 documented paths, the 37 authenticated routes
plus `/health` — so the document cannot silently drift from the code. (`/openapi.json` itself is
deliberately excluded: it is served by a closure, not an annotated handler, so it does not appear
in its own document.) This route appears there under the `data_clusters` tag with the schema
`DataClusterListItem`. Use it to generate a client rather than hand-writing models.

## Related pages

- [Asset groups](/docs/asset-groups) — creating and editing asset groups in the app, and what the
  ticker universe actually contains.
- [API overview](/docs/api-overview) — base URL, envelopes and the read-only rationale.
- [Authentication](/docs/api-authentication) — key format, header-only Bearer auth, and why
  `?api_key=` fails silently.
- [Studies](/docs/api-studies) — `GET /studies/metadata` returns `strategy_data_cluster_id` and
  `fitness_data_cluster_id`, the join key back into this list.
- [Portfolio groups](/docs/portfolio-groups) — the objects that can form an asset group's universe
  instead of tickers; [portfolio groups in the API](/docs/api-baskets) covers reading them.
- [Errors](/docs/api-errors) — the `{"message", "kind"}` envelope and the complete status table.
