---
title: Baskets
section: API Reference
sectionOrder: 10
order: 6
published: true
updated: 2026-08-18
summary: Read baskets, their freshness, operations, allocations, orders and EOD reports.
keywords: /v2/baskets, GET, basket, portfolio group, operation, allocation, order, state log, eod report, freshness
---

A basket groups managed portfolios under one shared trading configuration, and an **operation** is
one actioning of that basket against a single broker connection. Nine `GET` routes read the whole
surface: composition, whether the members are up to date, and the complete operational audit trail
— weight snapshots, broker orders, state transitions and end-of-day reconciliation. Baskets are
built and traded in the Fintela app; this API only observes them.

## Portfolio Groups, baskets and operations

The object the app calls a **Portfolio Group** is called a **basket** everywhere in the API and in
the database (`developers.portfolio_manager_baskets`). They are the same thing — the API name is
the older one and was never renamed. If you are looking for the UI side, see
[Portfolio Groups](/docs/portfolio-groups).

Three nouns matter on this page:

| Noun | What it is | Identified by |
|---|---|---|
| Basket (Portfolio Group) | A set of managed portfolios plus the shared config that weights and rebalances them: allocation method, manual weights, rebalance cadence. | UUID |
| Member | A managed portfolio inside the basket. Same object as `GET /v2/portfolios/:id`. | integer `managed_portfolio_id` |
| Operation | One actioning of a basket against one broker connection — its own target capital, status, drift and rebalance state. | UUID |

A basket can carry **many** operations at once: the database enforces uniqueness on
`(basket_id, connection_id)`, so the same basket may run on a paper account and a live account
simultaneously, or across separate capital tranches. Trading config is shared on the basket;
operational state is per operation.

## Endpoints at a glance

```http
GET /v2/baskets
GET /v2/baskets/:id
GET /v2/baskets/:id/freshness
GET /v2/baskets/:id/operations
GET /v2/baskets/:id/operations/:op_id
GET /v2/baskets/:id/operations/:op_id/allocations
GET /v2/baskets/:id/operations/:op_id/orders
GET /v2/baskets/:id/operations/:op_id/state_log
GET /v2/baskets/:id/operations/:op_id/eod_reports
```

| Endpoint | Returns | Fixed order |
|---|---|---|
| `GET /v2/baskets` | Every basket in your organization | `updated_at DESC` |
| `GET /v2/baskets/:id` | One basket | — |
| `GET /v2/baskets/:id/freshness` | Per-member up-to-date status | — |
| `GET /v2/baskets/:id/operations` | The basket's operations | `created_at ASC` |
| `GET /v2/baskets/:id/operations/:op_id` | One operation | — |
| `…/allocations` | Weight snapshots written on rebalance | `portfolio_id ASC, recorded_at DESC` |
| `…/orders` | Broker orders the operation submitted | `created_at DESC` |
| `…/state_log` | Audit entries for the operation | `occurred_at DESC` |
| `…/eod_reports` | End-of-day reconciliation rows | `trading_day DESC, operation_id NULLS LAST` |

> [!NOTE] Operations are the one basket collection returned oldest-first
> `GET /v2/baskets/:id/operations` orders by `created_at ASC`, while every other collection on
> this page leads with the newest row. Ordering is not uniform across the wider API either —
> `/strategies` and `/fitness` come back by ascending `id`. Do not assume `data[0]` is the most
> recent operation.

Ordering is fixed server-side on all nine routes. There is no `?sort=`, no `?order=`, no `?include=`
and no filtering parameter anywhere on this page. The only query parameters that exist are `limit`
and `offset`, on the four history sub-resources.

Base URL is `https://developer.fintela.io`. Every route needs `Authorization: Bearer sk_live_…` —
see [authentication](/docs/api-authentication). Auth is header-only: an `?api_key=` query parameter
is still deserialized on these routes but its value is discarded, so a request that carries only
the query parameter comes back as `401` with the message *"Missing API key. Provide it via the
`Authorization: Bearer <key>` header."* — the query parameter is never acknowledged at all. There
are no scopes; a key's reach is its organization. Every success body is wrapped in `{"data": …}`;
every error is `{"message": …, "kind": …}`.

A basket is readable when it belongs to your API key's organization and its `deleted_at` is null.
There is no privacy inside an organization — every member's baskets are visible to every key issued
for that organization. A basket outside your organization returns `404`, never `403`, so the API
cannot be used to probe for existence.

## Identifiers

Baskets and operations are keyed by **UUID**, unlike studies, trials and portfolios, which use
integers. Members and every `portfolio_id` in the history rows are integer **managed portfolio
ids** you can pass straight to `GET /v2/portfolios/:id`.

> [!WARNING] `portfolio_id` here never means a trial
> `/v2/portfolios` and `/v1/portfolios` are unrelated resources with separate id spaces:
> `/v1/portfolios/42` and `/v2/portfolios/42` are different objects. Everything a basket touches is
> a **managed** portfolio, so resolve these ids against `/v2/portfolios` only. See
> [trials and portfolios](/docs/api-trials-portfolios).

On the wire the UUIDs are plain strings either way, but the OpenAPI document types them
differently: `Basket.id` and `BasketFreshness.basket_id` are declared as `uuid`, while
`BasketOperation.operation_id`, `.basket_id` and `.connection_id` — and every id on the history
rows — are declared as `string`, because the SQL casts them with `::text`. Generated clients will
reflect that split.

The router declares its path parameters as `:id` and `:op_id`; the OpenAPI document normalizes them
to `{id}` and `{op_id}`. Both are extracted as `Uuid`, so a value that is not a UUID is rejected
before the handler runs.

## List baskets

```http
GET /v2/baskets
```

No path parameters, no query parameters. Returns every non-deleted basket in your organization,
most recently updated first.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets
```

```json
{
  "data": [
    {
      "id": "8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34",
      "name": "Core US Momentum",
      "portfolio_ids": [7, 9],
      "daily_update_enabled": true,
      "stage": "ytd",
      "allocation_method": "manual",
      "allocation_method_params": null,
      "rebalance_enabled": true,
      "rebalance_frequency_days": 30,
      "rebalance_anchor_date": "2026-01-02",
      "member_weights": { "7": 0.6, "9": 0.4 },
      "created_at": "2026-01-02T14:31:07.412Z",
      "updated_at": "2026-08-14T09:05:22.881Z"
    }
  ]
}
```

### Basket fields

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | Basket id. |
| `name` | string | |
| `portfolio_ids` | array of integers | Managed portfolio ids. Stored as JSON; the API passes the column through verbatim. |
| `daily_update_enabled` | boolean | Daily Update toggle. When true, all active members extend daily. |
| `stage` | string | Time-window stage used for daily-update mode. Database default `"ytd"`; the column carries no `CHECK` constraint, so treat it as an opaque string. |
| `allocation_method` | string | How member weights are derived. See the table below. |
| `allocation_method_params` | object or null | Per-method configuration. The database forbids a non-null value when `allocation_method` is `"manual"`. |
| `rebalance_enabled` | boolean | Whether a periodic rebalance cadence is configured. |
| `rebalance_frequency_days` | integer or null | Cadence in **data days**, not calendar days. Constrained `> 0`, and required to be non-null whenever `rebalance_enabled` is true. |
| `rebalance_anchor_date` | string (`YYYY-MM-DD`) or null | Frozen anchor of the data-day rebalance grid. Null reads as the basket's creation date at use time. |
| `member_weights` | object or null | `{managed_portfolio_id: weight}`, string keys, and only for members that have a weight set. Null when no member has one. |
| `created_at` | string | ISO-8601 with a `Z` suffix. |
| `updated_at` | string | ISO-8601 with a `Z` suffix. |

`allocation_method` is one of seven values, enforced by a database `CHECK`:

| Value | |
|---|---|
| `equal_weight` | The default for a new basket. |
| `manual` | Per-member weights, exposed as `member_weights`. |
| `metric_proportional` | |
| `metric_responsive` | |
| `risk_parity` | |
| `volatility_target` | |
| `mean_reversion` | |

> [!NOTE] Nullable fields arrive as `null`, not as absent keys
> Unlike trials and managed portfolios, no field on `Basket` is marked
> `skip_serializing_if`. All thirteen keys are present on every basket object. Check for `null`,
> not for absence — the opposite of the rule on
> [trials and portfolios](/docs/api-trials-portfolios).

The API projection is deliberately narrower than what the platform stores. `description`,
`execution_config`, `protective_config`, `membership_rule` and the legacy `frequency` column all sit
on `developers.portfolio_manager_baskets` but are **not** exposed here — and neither are the
per-member execution and protective overrides on `developers.basket_members`, nor the paid
allocation-method unlocks in `developers.basket_allocation_unlocks`. `member_weights` is the only
derived field: it is aggregated from `developers.basket_members` at query time.

## Get one basket

```http
GET /v2/baskets/:id
```

| Path parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (uuid) | yes | Basket id. |

No query parameters. Returns a single `Basket` object with exactly the fields above.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets/8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34
```

A basket that does not exist, is soft-deleted, or belongs to another organization returns `404`
with `"message": "Basket {id} not found"`. The three cases are indistinguishable by design.

## Basket freshness

```http
GET /v2/baskets/:id/freshness
```

| Path parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (uuid) | yes | Basket id. |

No query parameters. This route answers the question the app asks before it lets you invest: is
every member's data current enough to trade on? It runs the same shared helper as the platform's
invest-time launch gate, so its answer matches the app's exactly.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets/8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34/freshness
```

```json
{
  "data": {
    "basket_id": "8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34",
    "fresh": [7],
    "stale": [9],
    "not_scheduled": [9],
    "members": [
      { "managed_portfolio_id": 7, "stale": false, "daily_updates_enabled": true,  "execution_type": "INTERNAL" },
      { "managed_portfolio_id": 9, "stale": true,  "daily_updates_enabled": false, "execution_type": "INTERNAL" }
    ],
    "daily_update_enabled": true,
    "rebalance_frequency_days": 30
  }
}
```

### What "stale" means

A member is **stale** when it has no daily equity rows at all, or when its latest equity date is
more than `grace_days` behind the latest complete market day of its own ticker universe. The
reference is the per-exchange data watermark written by the single-day updater, taken as the
**minimum** across every exchange the universe spans — so a lagging exchange holds the whole
portfolio back. A portfolio whose universe has no market data at all cannot be behind a date that
does not exist, and is reported as fresh.

`grace_days` comes from the `FRESHNESS_GRACE_DAYS` environment variable and defaults to **1**. That
one day absorbs the gap between a new market bar landing and the daily portfolio updater running.

### Freshness response fields

| Field | Type | Notes |
|---|---|---|
| `basket_id` | string (uuid) | Echoes the path parameter. |
| `fresh` | array of integers | Members not in `stale`. Together, `fresh` and `stale` partition the basket's members. |
| `stale` | array of integers | Members behind the latest complete market day. |
| `not_scheduled` | array of integers | Members whose `daily_updates_enabled` is false, so the updater skips them. |
| `members` | array of objects | Per-member status. See below. |
| `daily_update_enabled` | boolean | Mirrors the basket's own toggle. `false` means members will go stale and the basket cannot invest. |
| `rebalance_frequency_days` | integer or null | Mirrors the basket's cadence. Null means no periodic rebalance. |

> [!TIP] Use `members`, not the three arrays, to diagnose
> A member can appear in **both** `stale` and `not_scheduled` — those two lists are not disjoint.
> The `members` array carries the two flags independently, which is what separates a *frozen*
> member (daily updates switched off, the root cause) from a merely *stale* one (behind the latest
> bar but still scheduled).

### Member status objects

| Field | Type | Notes |
|---|---|---|
| `managed_portfolio_id` | integer | Resolve at `GET /v2/portfolios/:id`. |
| `stale` | boolean | |
| `daily_updates_enabled` | boolean | The inverse of membership in `not_scheduled`. |
| `execution_type` | string | Snapshotted strategy execution type, **uppercase**. `"INTERNAL"` or `"EXTERNAL"` in practice; the underlying column also admits `"DECLARATIVE"`, which nothing persists yet. Defaults to `"INTERNAL"` when the portfolio's strategy snapshot carries no value. |

`EXTERNAL` members cannot daily-extend — managed mode supports `INTERNAL` strategies only. Note the
casing: the same concept serializes lowercase (`"internal"` / `"external"`) on the strategies and
fitness routes. Compare case-insensitively across the API.

## List operations

```http
GET /v2/baskets/:id/operations
```

| Path parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (uuid) | yes | Basket id. |

No query parameters, and no pagination — the full list comes back in one response, oldest first.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets/8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34/operations
```

```json
{
  "data": [
    {
      "operation_id": "f01a3c88-2b19-4d70-a6c5-9e8417d0b2fa",
      "basket_id": "8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34",
      "connection_id": "77aa5d21-4e63-4a90-8f11-2c7b9e05d6a3",
      "provider": "alpaca",
      "operational_name": "paper $10k",
      "target_capital": 10000.0,
      "last_status": "ACTIVE",
      "desired_status": "ACTIVE",
      "drift_detected_at": null,
      "drift_ack_at": null,
      "last_rebalanced_at": "2026-05-14T20:00:00Z",
      "rebalance_requested_at": null,
      "created_at": "2026-02-03T11:42:18.006Z",
      "updated_at": "2026-05-14T20:00:01.334Z"
    }
  ]
}
```

## Get one operation

```http
GET /v2/baskets/:id/operations/:op_id
```

| Path parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (uuid) | yes | Basket id. |
| `op_id` | string (uuid) | yes | Operation id. |

No query parameters. The operation must live under the basket named in the path: an `op_id` that
belongs to a different basket returns `404` with `"message": "Operation {op_id} not found"`, even
when both baskets are yours.

### Operation fields

| Field | Type | Notes |
|---|---|---|
| `operation_id` | string (uuid as text) | |
| `basket_id` | string (uuid as text) | |
| `connection_id` | string (uuid as text) | The broker connection this operation trades through. |
| `provider` | string | The broker. `"alpaca"` is the only provider Fintela connects to today. |
| `operational_name` | string or null | Optional per-operation label, e.g. `"paper $10k"` or `"live tranche A"`. A basket has many operations, so each can carry its own. |
| `target_capital` | number | Constrained `> 0`; stored as `NUMERIC(18,2)`. |
| `last_status` | string | The state the orchestrator has actually reached. |
| `desired_status` | string | The state an operator asked for in the app. |
| `drift_detected_at` | string or null | ISO-8601 with `Z`. When the orchestrator last found the broker's positions out of line with Fintela's ledger. |
| `drift_ack_at` | string or null | When an operator acknowledged that drift. |
| `last_rebalanced_at` | string or null | When this operation last rebalanced. Per-operation, so it never moves because a sibling operation rebalanced. |
| `rebalance_requested_at` | string or null | When a manual rebalance was requested for this operation. Null when none is pending. |
| `created_at` | string | ISO-8601 with `Z`. |
| `updated_at` | string | ISO-8601 with `Z`. |

Both status fields take the same four values, enforced by a database `CHECK`:

| Status | Meaning |
|---|---|
| `DRAFT` | Configured but never launched. |
| `ACTIVE` | Trading. |
| `PAUSED` | Held; positions retained. |
| `STOPPED` | Wound down. |

> [!TIP] The status pair is the transition signal
> While `desired_status` and `last_status` differ, a transition requested in the app has not yet
> been carried out by the orchestrator. That divergence is the single most useful thing a monitor
> built on this API can watch — along with a non-null `drift_detected_at` whose `drift_ack_at` is
> still null.

Rebalance **cadence** (`rebalance_enabled`, `rebalance_frequency_days`, `rebalance_anchor_date`) is
shared config and lives on the basket. Only the mutable per-execution counter and request live here,
so one operation's rebalance never resets another's.

## Operation history sub-resources

Four routes read the operation's history. All four take the same pagination parameters, and all four
gate on the **basket**, not the operation.

> [!WARNING] A bad `op_id` returns an empty list, not a 404
> These four routes verify that the basket in the path is readable, then filter rows by
> `op_id`. An operation id that does not exist — or belongs to another basket — therefore
> yields `200` with `{"data": []}`. Only an unreadable basket produces `404` here. If you need
> the operation's existence confirmed, call `GET /v2/baskets/:id/operations/:op_id` first, which
> does return `404`.

### Pagination on the history routes

| Parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `limit` | integer | no | `500` on allocations, orders and state_log; **`90`** on eod_reports | Clamped to `[1, 1000]`. A value below 1 becomes 1; above 1000 becomes 1000. |
| `offset` | integer | no | `0` | Negative values are floored at 0. |

Pagination on these four routes is the only pagination in the entire Developer API. It is
offset-based, and deliberately minimal:

- There are **no cursors**.
- There is **no total count** in the response — the envelope is a bare array.
- There are **no `Link` pagination headers**.

Page until you receive fewer rows than you asked for. Orders, state log and EOD reports are sorted
newest-first, and allocations by `portfolio_id ASC` then `recorded_at DESC`, so rows written while
you page will shift the offsets underneath you; pin a timestamp client-side if that matters.

### Allocations

```http
GET /v2/baskets/:id/operations/:op_id/allocations
```

One row per weight snapshot, written each time the operation rebalanced. Default `limit` is `500`.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/baskets/8b6c1f4e-77a0-4c3b-9a21-0d5e6f2b1c34/operations/f01a3c88-2b19-4d70-a6c5-9e8417d0b2fa/allocations?limit=100"
```

```json
{
  "data": [
    {
      "id": "3d2e9c07-51b4-4a8e-b0f6-71c2a45d9e18",
      "operation_id": "f01a3c88-2b19-4d70-a6c5-9e8417d0b2fa",
      "portfolio_id": 7,
      "allocation": 0.6,
      "triggered_by": "periodic",
      "recorded_at": "2026-05-14T20:00:00.512Z"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid as text) | |
| `operation_id` | string (uuid as text) | |
| `portfolio_id` | integer | Managed portfolio id. |
| `allocation` | number | Constrained to `[0, 1]`. |
| `triggered_by` | string | `periodic` or `manual`, enforced by a database `CHECK`. |
| `recorded_at` | string | ISO-8601 with `Z`. |

### Orders

```http
GET /v2/baskets/:id/operations/:op_id/orders
```

Every broker order the operation submitted, newest first. Default `limit` is `500`.

```json
{
  "data": [
    {
      "log_id": "b41c6a90-0f77-4d2c-8a53-e6b901d47f22",
      "operation_id": "f01a3c88-2b19-4d70-a6c5-9e8417d0b2fa",
      "portfolio_id": 7,
      "ticker_id": 1184,
      "ticker_code": "AAPL",
      "provider": "alpaca",
      "provider_order_id": "6f2b0a1c-9d3e-4b57-8c10-2a7e4f6d8b90",
      "asset_class": "equity",
      "action": "BUY",
      "position_side": "L",
      "quantity": 24.0,
      "order_type": "market",
      "limit_price": null,
      "status": "filled",
      "triggered_by": "schedule",
      "submitted_at": "2026-05-14T13:31:02.119Z",
      "filled_at": "2026-05-14T13:31:03.744Z",
      "fill_price": 211.37,
      "error_message": null,
      "created_at": "2026-05-14T13:31:01.880Z"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `log_id` | string (uuid as text) | |
| `operation_id` | string (uuid as text) | |
| `portfolio_id` | integer or null | Managed portfolio id. |
| `ticker_id` | integer or null | |
| `ticker_code` | string or null | Joined from the ticker table; null when `ticker_id` is null or unresolved. |
| `provider` | string | |
| `provider_order_id` | string or null | The broker's own order id. Null until the order is accepted. |
| `asset_class` | string | `equity` or `crypto`. |
| `action` | string | `BUY` or `SELL`. Uppercase. |
| `position_side` | string | Single character: `L` (long) or `S` (short). |
| `quantity` | number | |
| `order_type` | string | `market`, `limit`, `stop`, `stop_limit` or `trailing_stop`. |
| `limit_price` | number or null | |
| `status` | string | See below. |
| `triggered_by` | string or null | `schedule` or `manual`. |
| `submitted_at` | string or null | ISO-8601 with `Z`. |
| `filled_at` | string or null | ISO-8601 with `Z`. |
| `fill_price` | number or null | |
| `error_message` | string or null | |
| `created_at` | string | ISO-8601 with `Z`. |

`status` takes nine values, enforced by a database `CHECK`:

| Status | Meaning |
|---|---|
| `pending` | Row created, not yet sent. |
| `held` | A BUY whose cash has been reserved but not yet released for submission. |
| `submitting` | Claimed for submission; the guard against double-submitting the same row. |
| `submitted` | Sent to the broker. |
| `working` | Resting or open at the broker across ticks or sessions — a non-market or non-day order. The reconciler nets these against target deltas and never treats them as position drift. |
| `partially_filled` | |
| `filled` | |
| `cancelled` | |
| `failed` | See `error_message`. |

The projection is narrower than the underlying table: the cash-ledger and execution-audit columns
(`held_notional`, `held_qty`, `cycle_id`, `time_in_force`, `order_role`) are not exposed.

### State log

```http
GET /v2/baskets/:id/operations/:op_id/state_log
```

The append-only audit trail for the operation, newest first. Default `limit` is `500`.

```json
{
  "data": [
    {
      "log_id": "0a9f37bc-6d81-4e05-9b2a-c3418f7e6d55",
      "operation_id": "f01a3c88-2b19-4d70-a6c5-9e8417d0b2fa",
      "actor_kind": "user",
      "actor_id": "2f5c9d18-77b3-4e21-9a06-b8d4e1c37f92",
      "event_type": "launched",
      "payload": { "note": "live trading enabled" },
      "occurred_at": "2026-02-03T11:45:09.221Z"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `log_id` | string (uuid as text) | |
| `operation_id` | string (uuid as text) | |
| `actor_kind` | string | `user`, `orchestrator` or `system`, enforced by a database `CHECK`. |
| `actor_id` | string or null | The Keycloak user id on `user` events. Null on `orchestrator` and `system` events. |
| `event_type` | string | See below. |
| `payload` | object | Per-event metadata. The shape depends on `event_type`. Always present; `{}` when the event carries none. |
| `occurred_at` | string | ISO-8601 with `Z`. |

> [!CAUTION] `event_type` is an open string, not an enum
> The column carries no `CHECK` constraint, so new event types can appear without any API change.
> Match on the values you care about and ignore the rest — never write an exhaustive switch that
> errors on an unknown value.

Values Fintela writes against an operation today:

| `event_type` | `actor_kind` | Written when |
|---|---|---|
| `launched` | `user` | The operation moved out of `DRAFT` into live trading. |
| `activated` | `user` | Desired status set to `ACTIVE`. |
| `paused` | `user` | Desired status set to `PAUSED`. |
| `stopped` | `user` | Desired status set to `STOPPED`. |
| `reinitiated` | `user` | A fully stopped operation was returned to `DRAFT`. |
| `status_changed` | `user` | A desired-status change outside the four above. |
| `force_stopped` | `user` | Local teardown; broker positions were **not** liquidated. |
| `status_synced` | `orchestrator` | `last_status` caught up with `desired_status`. |
| `drift_detected` | `orchestrator` | Broker positions diverged from Fintela's ledger. |
| `drift_cleared` | `orchestrator` | The divergence resolved. |
| `drift_auto_reconciled` | `orchestrator` | A drift was explained by a broker activity and absorbed automatically. |
| `drift_operator_reconciled` | `orchestrator` | A drift was reconciled after operator action. |
| `eod_reconciliation` | `orchestrator` | An end-of-day reconciliation run completed. |
| `liquidate_protective_survivors` | `orchestrator` | Protective stops could not be cancelled during an emergency liquidation, so those symbols were left open. |
| `connection_revoked_auto_pause` | `system` | The broker connection was revoked and its operations were auto-paused. |

How durable an entry is depends on who wrote it. The orchestrator's and the system's writes are
best-effort: a failed insert warns and the action it describes proceeds regardless. The
user-initiated ones are transactional — `launched` and the status changes are written in the same
transaction as the status flip, so a failed audit write **aborts the transition**; `force_stopped`
is written in a savepoint, so a failed audit loses the row but keeps the teardown. Treat the state
log as a very good record of orchestrator activity, not a guaranteed-complete one.

### End-of-day reports

```http
GET /v2/baskets/:id/operations/:op_id/eod_reports
```

Daily reconciliation of Fintela's ledger against the broker's authoritative activity stream, newest
trading day first. Default `limit` is **`90`**, not 500 — roughly a third of a trading year.

```json
{
  "data": [
    {
      "report_id": "c7d80e42-9a15-4b63-8f27-1e0b6d3a5c99",
      "connection_id": "77aa5d21-4e63-4a90-8f11-2c7b9e05d6a3",
      "operation_id": "f01a3c88-2b19-4d70-a6c5-9e8417d0b2fa",
      "trading_day": "2026-05-14",
      "outcome": "clean",
      "fills_matched": 12,
      "fill_discrepancies": null,
      "position_discrepancies": null,
      "non_trade_activities": null,
      "ran_at": "2026-05-15T01:12:44.903Z"
    }
  ]
}
```

| Field | Type | Notes |
|---|---|---|
| `report_id` | string (uuid as text) | |
| `connection_id` | string (uuid as text) | |
| `operation_id` | string (uuid as text) or null | **Null marks a connection-level row.** See below. |
| `trading_day` | string (`YYYY-MM-DD`) | Date only, no time component. |
| `outcome` | string | `clean`, `discrepancies` or `error`, enforced by a database `CHECK`. |
| `fills_matched` | integer | |
| `fill_discrepancies` | JSON array or null | Per-operation rows only. |
| `position_discrepancies` | JSON array or null | Per-operation rows only. |
| `non_trade_activities` | JSON array or null | Connection-level rows only: dividends, fees, interest and splits. |
| `ran_at` | string | ISO-8601 with `Z`. |

> [!NOTE] This route returns account-wide rows too
> The query selects rows for the operation's **broker connection** where `operation_id` matches
> *or* is null. A null `operation_id` is the connection-level, account-wide summary for that trading
> day — the activities that could not be attributed to any single operation. Two operations on the
> same connection will therefore both return the same connection-level rows. Filter on
> `operation_id !== null` if you only want this operation's own reconciliation, and note that the
> `limit` you set counts both kinds of row.

Within a trading day the ordering puts the per-operation row before the connection-level one
(`operation_id NULLS LAST`).

## Status codes on these routes

| Code | `kind` | When |
|---|---|---|
| `200` | — | Every success, including an empty collection. |
| `401` | `unauthorized` | Missing or blank `Authorization` header, an unknown or revoked key, or a key whose record has no organization or no user. |
| `404` | `not_found` | `"Basket {id} not found"` — the basket does not exist, is soft-deleted, or belongs to another organization. `"Operation {op_id} not found"` — only on `GET /v2/baskets/:id/operations/:op_id`. |
| `405` or `404` | — | Any write verb. Which of the two you get depends on how the router's fallback resolves. |
| `429` | `rate_limited` | The organization's token bucket is empty. Carries `Retry-After: 1`. |
| `500` | `internal` | Redacted to `"Something went wrong on Fintela's side. Please try again in a moment."` The real cause stays in Fintela's logs. |

The basket module constructs only two error kinds of its own — `not_found` and `internal`. It never
produces a `400` of its own: a malformed UUID or a non-numeric `limit` is rejected by the
framework's extractor before the handler runs, so that `400` never passes through this service's
error envelope. It never produces a `406` either; that code belongs to the strategy and fitness id
gates.

`403` is unreachable across the whole Developer API — the forbidden constructor has no call site. An
unreadable basket is always a `404`. Full reference: [errors and status codes](/docs/api-errors).

> [!NOTE] The `kind` field is real
> Every error body on this API carries `{"message": …, "kind": …}`. `kind` is a stable machine-readable
> discriminator and is safer to branch on than the message text, which is not a contract.

## Rate limiting

All nine routes on this page **are** rate limited. They authenticate through the service's
`authenticate()` helper, which owns the per-organization token bucket.

| Knob | Environment variable | Production value |
|---|---|---|
| Refill rate | `DEV_API_RATE_LIMIT_RPS` | 20 requests/second |
| Burst capacity | `DEV_API_RATE_LIMIT_BURST` | 40 |

The bucket is keyed on the organization resolved from your key, so it is shared across every key
your organization holds. Exhausting it returns `429` with `Retry-After: 1`. There are no
`X-RateLimit-Limit`, `-Remaining` or `-Reset` headers anywhere on this API — you cannot see your
budget until you are refused.

> [!WARNING] Rate limiting is not consistent across the API today
> Only 17 of the 37 authenticated routes pass through the limiter: baskets and operations (these
> nine), trials, managed portfolios, `/v1/portfolios` and asset groups. Every `/studies/*`,
> `/strategies*` and `/fitness*` route calls a lower-level auth pair and bypasses the bucket
> entirely — those routes never return `429`. That is inconsistent behaviour between route
> families, not a deliberate exemption, so do not build a client that depends on either half of it.
> Throttle your own polling regardless.

One more caveat: the bucket lives in process memory, and the service autoscales between one and six
tasks with no sticky routing. Under load the effective per-organization ceiling can be a multiple of
the documented 20 rps. Treat 20 rps as the number to design against, not as a number you can rely on
being enforced.

## There is no push channel

Fintela has no webhooks, no server-sent events, no long-polling and no callback registration —
not on baskets, not anywhere on `developer.fintela.io`. Live trading generates the most
time-sensitive data in the platform, and there is still no way to be notified of it. Integrations
must poll.

A workable monitoring loop:

| Signal | Poll | Look for |
|---|---|---|
| A transition is in flight | `…/operations` | `desired_status != last_status` |
| Unacknowledged drift | `…/operations` | `drift_detected_at` non-null, `drift_ack_at` null |
| New broker activity | `…/orders?limit=50` | `log_id` values you have not seen |
| Reconciliation problems | `…/eod_reports?limit=5` | `outcome` other than `clean` |
| Members going stale | `…/freshness` | a non-empty `stale`, or `daily_update_enabled` false |

`GET /v2/baskets` returning a changed `updated_at` is the cheapest way to detect a configuration
edit, since the list is already ordered by it.

## Trading actions live in the app

This is the sharpest read-only boundary in the Developer API, and it is worth stating plainly:
**operation control is not available over API keys.** Creating an operation, launching it, pausing
it, stopping it, acknowledging drift and requesting a rebalance are all app-only. So are basket CRUD
and the basket refresh and simulate actions.

Two basket writes existed and were removed deliberately:

```http
POST /v2/baskets/:id/refresh
POST /v2/baskets/:id/simulate
```

Both spend metered compute, which is debited from your organization's token ledger in the app. This
API authenticates with API keys and has no ledger integration, so a write accepted here would be
compute billed to nobody. A test names both paths and asserts they are never served again — the fix
if they are ever needed over an API key is ledger integration, not a route.

> [!CAUTION] An API key can watch live trading but cannot cause any of it
> There is no endpoint here that submits an order, changes a target capital, or moves an operation
> between states. Every write verb is rejected on every path, and CORS advertises `GET` alone.
> Build monitoring, reporting and reconciliation on these endpoints; drive the trading itself from
> [live trading](/docs/live-trading) in the app.

## Machine-readable spec

`GET https://developer.fintela.io/openapi.json` returns the full OpenAPI 3.x document — 38 paths,
the entire authenticated surface plus `/health` — including the eight schemas behind this page:
`Basket`, `BasketFreshness`, `BasketMemberStatus`, `BasketOperation`, `OperationAllocation`,
`OperationOrderLog`, `OperationStateLogEntry` and `OperationEodReport`. It needs no authentication,
and a test asserts set equality between its paths and the service's router in both directions, so it
cannot silently drift from the running code. The one served path it omits is `/openapi.json` itself,
which is a closure rather than a documented handler. Generate your client from it.

One caveat when reading it: each operation documents the **inner** payload, not the envelope. A
route documented as returning an array of `BasketOperation` puts that array inside `{"data": …}` on the
wire. The vestigial `api_key` query parameter is hidden from the document on purpose, and the
`404` documented on the four history sub-resources is reachable only for an unreadable basket, not
for an unknown `op_id`.

For the rest of the surface, start at the [API overview](/docs/api-overview).
