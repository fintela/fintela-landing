---
title: Trials & portfolios
section: API Reference
sectionOrder: 6
order: 4
published: true
updated: 2026-08-04
summary: Read individual trials and the managed portfolios promoted from them.
keywords: /v2/trials, /v2/portfolios, GET, trial, managed portfolio, equity, promotion, holdings, orders, include
---

Read the output of your optimization runs. Every endpoint here is a `GET` over results that
already exist: studies are launched and trials are promoted in the Fintela app, and this API
returns what those actions produced — equity curves, holdings, metrics, parameters and live
orders.

## Trials vs. managed portfolios

The two resources on this page look similar and are not interchangeable. A **trial** is one
parameter sample evaluated by an optimization study — there are as many trials as the study ran,
and they are frozen historical artifacts. A **managed portfolio** is a durable copy that a trial
was _promoted_ into: it has a name, it extends day by day, and it is what baskets trade.

- Trials live at `/v2/trials` and are keyed by `trial_id` (a positive integer)
- Managed portfolios live at `/v2/portfolios` and are keyed by `managed_portfolio_id`
- Lineage runs in both directions: a trial carries `managed_portfolio_id` once promoted, and a
  managed portfolio carries `source_trial_portfolio_id`

That lineage is nullable on purpose. `managed_portfolio_id` is absent from a trial that was never
promoted, and `source_trial_portfolio_id` is `null` when the source study was deleted — the
managed copy keeps running on its own snapshot rather than disappearing with its origin.

> [!NOTE] Promotion happens in the app
> Promoting a trial copies data and signs the result up for daily updates, which is recurring
> billable compute. Like every other action that spends compute, it stays in the Fintela app —
> this API reports the outcome.

## Trial endpoints

| Endpoint | What it returns |
|---|---|
| `GET /v2/trials` | List every trial the key owner can read, newest first. Filter with `?study_name=`. |
| `GET /v2/trials/:trial_id` | One trial by its numeric id, with optional equity, holdings, metrics and params blocks. |
| `GET /v2/studies/:study_name/trials/:trial_number` | The same trial addressed by the (study name, trial number) pair instead of the opaque id. |

## List trials

The list is a summary view — one small row per trial, ordered by creation time descending. Use it
to discover ids, then fetch the detail of the ones you care about.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/trials?study_name=roc_top_n_q1"
```

**Query parameters**

| Name | Type | Description |
|---|---|---|
| `study_name` | string | Return only trials belonging to this study. Omit it to list every trial in scope. An unknown name is not an error — it simply matches nothing. |

```json
{
  "data": [
    {
      "trial_id": 8412,
      "study_name": "roc_top_n_q1",
      "trial_number": 37,
      "created_at": "2026-03-14T09:21:05",
      "managed_portfolio_id": 61
    },
    {
      "trial_id": 8411,
      "study_name": "roc_top_n_q1",
      "trial_number": 36,
      "created_at": "2026-03-14T09:20:44"
    }
  ]
}
```

`managed_portfolio_id` is omitted entirely — not sent as `null` — for trials that were never
promoted, so test for the key's presence rather than its value.

## Fetch a trial

The detail endpoint returns the summary fields always, plus whichever heavy blocks you ask for
with `include`. Nothing else is fetched, so keep the list to what you actually consume — an equity
curve and a full holdings history are far larger than the metrics block.

**`?include=` — comma-separated, default `metrics`**

| Name | Type | Description |
|---|---|---|
| `equity` | date → number | Daily portfolio value over the simulated period, keyed by `YYYY-MM-DD`. |
| `holdings` | date → ticker → number | Allocation per ticker per day, as a fraction of the portfolio. |
| `metrics` | stage → metric → number | Performance metrics nested by stage — in-sample, out-of-sample and any other stage the study defined. **Included by default** when `include` is omitted. |
| `params` | name → value | The parameter sample this trial evaluated. Numeric parameters come back as numbers; categorical ones as the decoded label string, not the internal index. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/trials/8412?include=equity,holdings,metrics,params"
```

```json
{
  "data": {
    "trial_id": 8412,
    "study_name": "roc_top_n_q1",
    "trial_number": 37,
    "created_at": "2026-03-14T09:21:05",
    "managed_portfolio_id": 61,
    "equity": {
      "2025-01-02": 100000.0,
      "2025-01-03": 100482.31
    },
    "holdings": {
      "2025-01-02": { "AAPL": 0.25, "MSFT": 0.25, "NVDA": 0.5 }
    },
    "metrics": {
      "is":  { "sharpe": 1.83, "cagr": 0.241, "max_drawdown": -0.118 },
      "oos": { "sharpe": 1.12, "cagr": 0.147, "max_drawdown": -0.163 }
    },
    "params": {
      "n_top": 3,
      "roc_window_size": 20,
      "ma_kind": "ema"
    }
  }
}
```

> [!WARNING] Passing include replaces the default
> Omitting `include` gives you `metrics`. Passing it gives you exactly what you named — so
> `?include=equity` returns the equity curve and **no** metrics. List `metrics` explicitly
> whenever you also want it.

## Address a trial by study and number

`trial_id` is an opaque internal id you can only learn from the list endpoint. When you already
know which study and which trial number you want — from a report, a dashboard, or the study's own
optimization history — address it directly instead:

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/studies/roc_top_n_q1/trials/37?include=metrics,params"
```

The response is byte-for-byte the same shape as `/v2/trials/:trial_id`, and `include` behaves
identically. Remember to URL-encode study names containing spaces or slashes.

**Failure modes**

| Status | Cause | Detail |
|---|---|---|
| `400 Bad Request` | negative `trial_number` | Trial numbers are non-negative. A negative value is rejected up front rather than reported as a missing trial. |
| `404 Not Found` | unknown study | No study by that name is visible to the key owner. The message names the study. |
| `404 Not Found` | unknown trial | The study exists but has no such trial number. The two 404s carry different messages, so you can tell which half of the pair was wrong. |

## Managed portfolio endpoints

| Endpoint | What it returns |
|---|---|
| `GET /v2/portfolios` | List the organization's managed portfolios, most recently promoted first. |
| `GET /v2/portfolios/:id` | One managed portfolio, with optional equity, holdings and orders blocks. |

## List managed portfolios

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/portfolios
```

```json
{
  "data": [
    {
      "managed_portfolio_id": 61,
      "name": "ROC Top 3 — live",
      "source_trial_portfolio_id": 8412,
      "daily_updates_enabled": true,
      "promoted_at": "2026-03-15T16:04:22Z"
    }
  ]
}
```

**Summary fields**

| Name | Type | Description |
|---|---|---|
| `managed_portfolio_id` | integer | The id to use on the detail endpoint and the id baskets reference in their membership lists. |
| `name` | string | The name given at promotion time in the app. |
| `source_trial_portfolio_id` | integer \| null | The trial this was promoted from — feed it straight to `/v2/trials/:trial_id`. `null` once the source study has been deleted. |
| `daily_updates_enabled` | boolean | Whether the portfolio extends day by day. A portfolio with this off stops advancing and will go stale — see the basket freshness endpoint. |
| `promoted_at` | timestamp | When the trial was promoted, UTC. The list is ordered by this, descending. |

## Fetch a managed portfolio

Unlike trials, the detail endpoint defaults to the **summary only** — omit `include` and you get
the five fields above and nothing else. Ask for the blocks you need:

**`?include=` — comma-separated, default none**

| Name | Type | Description |
|---|---|---|
| `equity` | date → number | Daily portfolio value since promotion. |
| `holdings` | date → ticker → object | Per-day, per-ticker `{ allocation, position }`. Richer than the trial equivalent: `position` is `"L"` or `"S"`, because managed portfolios trade live and shorts have to be distinguishable. |
| `orders` | array | The order log, oldest first — one row per order with `order_date`, `code`, `action`, `position_side`, `quantity`, `resulting_quantity`, `source` and `created_at`. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/portfolios/61?include=holdings,orders"
```

```json
{
  "data": {
    "managed_portfolio_id": 61,
    "name": "ROC Top 3 — live",
    "source_trial_portfolio_id": 8412,
    "daily_updates_enabled": true,
    "promoted_at": "2026-03-15T16:04:22Z",
    "holdings": {
      "2026-03-16": {
        "AAPL": { "allocation": 0.5, "position": "L" },
        "TSLA": { "allocation": 0.5, "position": "S" }
      }
    },
    "orders": [
      {
        "order_date": "2026-03-16",
        "code": "AAPL",
        "action": "BUY",
        "position_side": "L",
        "quantity": 12.0,
        "resulting_quantity": 12.0,
        "source": "daily_update",
        "created_at": "2026-03-16T21:05:11Z"
      }
    ]
  }
}
```

> [!NOTE] No metrics block here
> Managed portfolios deliberately do not materialize a `metrics` block — asking for one has no
> effect. For performance figures, read the metrics of the trial named by
> `source_trial_portfolio_id`, or compute your own from the `equity` series.

Both endpoints apply the key owner's visibility. A managed portfolio the owner cannot read at
full fidelity is absent from the list and returns `404 Not Found` by id, exactly as if it did not
exist.
