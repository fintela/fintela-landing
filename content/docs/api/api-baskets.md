---
title: Baskets
section: API Reference
sectionOrder: 6
order: 5
published: true
updated: 2026-08-04
summary: Read baskets, their freshness, operations, allocations, orders, and EOD reports.
keywords: /v2/baskets, GET, basket, operation, allocation, order, state log, eod report, freshness, pagination
---

A basket groups managed portfolios under one trading configuration, and an **operation** is one
actioning of that basket against a broker connection. These endpoints read the composition, the
freshness of the members, and the full operational audit trail — orders, allocations, state
changes and end-of-day reconciliation. Baskets are built and traded in the Fintela app; every
endpoint here is a `GET`.

## Endpoints

| Endpoint | What it returns |
|---|---|
| `GET /v2/baskets` | List the organization's baskets, most recently updated first. |
| `GET /v2/baskets/:id` | One basket — membership, allocation method and rebalance configuration. |
| `GET /v2/baskets/:id/freshness` | Whether each member portfolio is up to date with the latest market bar. |
| `GET /v2/baskets/:id/operations` | Every operation ever launched for this basket, oldest first. |
| `GET /v2/baskets/:id/operations/:op_id` | One operation and its current operational state. |
| `GET /v2/baskets/:id/operations/:op_id/allocations` | Weight snapshots written each time the operation rebalanced. |
| `GET /v2/baskets/:id/operations/:op_id/orders` | Broker orders the operation submitted, newest first. |
| `GET /v2/baskets/:id/operations/:op_id/state_log` | Audit log — launches, status transitions, drift, rebalance requests. |
| `GET /v2/baskets/:id/operations/:op_id/eod_reports` | End-of-day reconciliation rows, newest trading day first. |

Baskets and operations are identified by **UUID**, not by the integer ids used for studies, trials
and portfolios. Members inside a basket are still integer `managed_portfolio_id` values you can
pass straight to `/v2/portfolios/:id`.

## Reading operations, not driving them

This is the sharpest read-only boundary in the API, and it is worth stating plainly: **operation
control is not available over API keys**. Creating an operation, launching it, pausing it,
stopping it, acknowledging drift and requesting a rebalance are all app-only. So are basket CRUD
and the refresh and simulate actions, which spend compute.

> [!CAUTION] No trading actions over the API
> An API key can observe live trading in complete detail but cannot cause any of it. There is no
> endpoint that submits an order, changes a target capital, or moves an operation between states —
> attempting any write verb returns `405 Method Not Allowed` or `404 Not Found`. Build monitoring,
> reporting and reconciliation on these endpoints; drive the trading itself from the app.

The `desired_status` and `last_status` fields make that split visible. `desired_status` is the
state an operator asked for in the app; `last_status` is the state the orchestrator has actually
reached. While they differ, a transition is in flight — which is exactly the sort of thing a
monitor built on this API should surface.

## List baskets

The list returns full basket records, ordered by `updated_at` descending. Deleted baskets are
excluded, and so is any basket the key owner cannot read at full fidelity.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets
```

## Fetch a basket

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets/6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01
```

```json
{
  "data": {
    "id": "6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01",
    "name": "Momentum sleeve",
    "portfolio_ids": [61, 62, 74],
    "daily_update_enabled": true,
    "stage": "LIVE",
    "allocation_method": "equal_weight",
    "allocation_method_params": null,
    "rebalance_enabled": true,
    "rebalance_frequency_days": 21,
    "rebalance_anchor_date": "2026-01-05",
    "member_weights": null,
    "created_at": "2026-01-05T11:22:03Z",
    "updated_at": "2026-03-16T08:41:57Z"
  }
}
```

**Basket fields**

| Name | Type | Description |
|---|---|---|
| `id` | uuid | The basket id used on every nested path. |
| `name` | string | Display name given in the app. |
| `portfolio_ids` | number[] | Membership, as managed portfolio ids. Resolve each one through `/v2/portfolios/:id`. |
| `daily_update_enabled` | boolean | When true, all active members extend daily. When false, members go stale and the basket cannot invest. |
| `stage` | string | Lifecycle stage of the basket within the Portfolio Manager. |
| `allocation_method` | string | How capital is split across members — equal weight, manual weights, and so on. |
| `allocation_method_params` | object \| null | Extra configuration for the allocation method. `null` when the method takes none. |
| `rebalance_enabled` | boolean | Whether the basket rebalances periodically at all. |
| `rebalance_frequency_days` | integer \| null | Cadence in data-days. `null` means no periodic rebalance. |
| `rebalance_anchor_date` | date \| null | Frozen anchor of the rebalance grid. `null` reads as the basket's creation date at use time. |
| `member_weights` | object \| null | Manual per-member weights as `{ managed_portfolio_id: weight }`, containing only members that have a weight set. `null` when none do. |
| `created_at` | timestamp | Creation time, UTC. |
| `updated_at` | timestamp | Last configuration change, UTC. The list is ordered by this. |

## Freshness

A basket can only invest when its members are up to date. This endpoint answers that question with
the same definition the platform's own invest-time launch gate uses, so what it reports is what
the app will enforce.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/baskets/6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01/freshness
```

```json
{
  "data": {
    "basket_id": "6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01",
    "fresh": [61, 62],
    "stale": [74],
    "not_scheduled": [74],
    "members": [
      { "managed_portfolio_id": 61, "stale": false,
        "daily_updates_enabled": true,  "execution_type": "INTERNAL" },
      { "managed_portfolio_id": 62, "stale": false,
        "daily_updates_enabled": true,  "execution_type": "INTERNAL" },
      { "managed_portfolio_id": 74, "stale": true,
        "daily_updates_enabled": false, "execution_type": "EXTERNAL" }
    ],
    "daily_update_enabled": true,
    "rebalance_frequency_days": 21
  }
}
```

The top-level `fresh`, `stale` and `not_scheduled` arrays are convenience partitions; `members` is
the authoritative per-member view. The two flags on a member are independent, which is the whole
point of the array:

- `stale` — the member's latest equity has not reached the latest market bar of its own ticker
  universe
- `daily_updates_enabled` — whether the updater is scheduled to extend it at all
- `execution_type` — `INTERNAL` or `EXTERNAL`, snapshotted from the strategy

> [!TIP] Distinguish frozen from merely behind
> A member can appear in both `stale` and `not_scheduled`. That combination is the root cause, not
> a coincidence: daily updates are off, so it will never catch up on its own. A member that is
> stale but _is_ scheduled is simply waiting for the next update. Note also that `EXTERNAL`
> members cannot daily-extend at all — managed mode supports `INTERNAL` strategies only — so an
> `EXTERNAL` member going stale is expected behaviour rather than a fault.

## Operations

Trading configuration — allocation method, weights, rebalance cadence, membership — lives on the
basket and is shared. An operation carries the per-actioning operational state: which broker
connection it runs against, how much capital it targets, and where it is in its lifecycle.

```json
{
  "data": {
    "operation_id": "b2e7a4c8-13f5-4a6d-8e90-5c1d7f3a2b44",
    "basket_id": "6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01",
    "connection_id": "a17c3e5d-9b02-4f81-bb6a-2d4e8c1f5a33",
    "provider": "alpaca",
    "operational_name": "Momentum sleeve — paper",
    "target_capital": 250000.0,
    "last_status": "RUNNING",
    "desired_status": "RUNNING",
    "drift_detected_at": null,
    "drift_ack_at": null,
    "last_rebalanced_at": "2026-03-09T14:31:02Z",
    "rebalance_requested_at": null,
    "created_at": "2026-02-02T15:00:11Z",
    "updated_at": "2026-03-16T21:10:44Z"
  }
}
```

**Operation fields**

| Name | Type | Description |
|---|---|---|
| `operation_id` | uuid | Id used on the four history sub-resources. |
| `connection_id` | uuid | The broker connection this operation trades through. |
| `provider` | string | The broker behind that connection. |
| `operational_name` | string \| null | Optional label distinguishing operations of the same basket. |
| `target_capital` | number | Capital the operation is sized against. |
| `last_status` | string | State the orchestrator has actually reached. |
| `desired_status` | string | State requested from the app. A mismatch with `last_status` means a transition is in flight. |
| `drift_detected_at` | timestamp \| null | When live positions were last found to diverge from the target. |
| `drift_ack_at` | timestamp \| null | When an operator acknowledged that drift in the app. |
| `last_rebalanced_at` | timestamp \| null | Last completed rebalance. |
| `rebalance_requested_at` | timestamp \| null | Set while a rebalance has been asked for but not yet carried out. |

Operations are listed **oldest first** — the natural reading order for a history — which is the
opposite of every other collection on this page.

## Operation history

Four sub-resources hang off an operation. Each is paginated and each has its own natural ordering:

| Sub-resource | What it records | Ordering |
|---|---|---|
| `allocations` | One weight snapshot per member, written whenever the operation rebalanced. | Portfolio id, then newest snapshot first |
| `orders` | Broker orders submitted, with fills, prices, status and any error message. | Newest first |
| `state_log` | Audit entries — launch, status transitions, drift, rebalance — with actor and payload. | Newest first |
| `eod_reports` | End-of-day reconciliation: fills matched and any discrepancies found. | Newest trading day first |

```bash
BASKET=6f1c9d20-4b7a-4d0e-9a11-8c3e5f2b7a01
OP=b2e7a4c8-13f5-4a6d-8e90-5c1d7f3a2b44

curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/baskets/$BASKET/operations/$OP/orders?limit=100"
```

Order rows carry the identifiers you need to reconcile against your broker directly —
`provider_order_id`, `ticker_code`, `action`, `position_side`, `quantity`, `order_type`,
`limit_price`, `status`, `submitted_at`, `filled_at` and `fill_price` — plus `portfolio_id`
attributing the order to the member that motivated it.

> [!NOTE] Account-wide EOD rows
> In `eod_reports`, a row whose `operation_id` is `null` is the connection-level summary for that
> trading day — the whole brokerage account rather than this one operation. Filter it out when you
> are attributing results to a single operation, and read it when you are reconciling the account
> as a whole.

## Pagination

The four history endpoints take `limit` and `offset`. Limits are clamped server-side to
`[1, 1000]`, so no single call can pull an unbounded history — a larger value is silently reduced
rather than rejected. Defaults differ by endpoint:

| Name | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `500` | Rows to return, clamped to `[1, 1000]`. The default is `500` for `allocations`, `orders` and `state_log`, and `90` for `eod_reports` — roughly a quarter of trading days. |
| `offset` | integer | `0` | Rows to skip. Negative values are treated as `0`. |

Every operation read is gated on the parent basket. If the key owner cannot read the basket at full
fidelity, the operation endpoints return `404 Not Found` naming the basket — the API never confirms
that a basket you cannot see exists. An operation id is also pinned to the basket in its path, so a
valid operation requested under the wrong basket is likewise a `404`.
