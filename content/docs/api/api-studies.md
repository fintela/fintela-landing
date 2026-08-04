---
title: Studies
section: API Reference
sectionOrder: 6
order: 3
published: true
updated: 2026-08-04
summary: Read study metadata, progress, health, and optimization history.
keywords: /studies, GET, progress, health, status, errors, optimization history, param importances, avg_opt
---

Studies are launched, stopped and resumed in the Fintela app. This API is the read side: watch a
run while it optimizes, pull its per-trial optimization history once it finishes, and export the
top trials into your own tooling. Twelve endpoints, all `GET` — the lightweight progress, health
and status reads are built for polling.

## Endpoints

| Endpoint | What it returns |
|---|---|
| `GET /studies/metadata` | Full configuration for one, several, or all studies. |
| `GET /studies/progress` | Fraction of the trial budget consumed, per study. |
| `GET /studies/health` | 1 − failure rate. Surfaces flaky data or code quickly. |
| `GET /studies/status` | Runtime status, timestamps and failure message. |
| `GET /studies/errors` | Aggregated failure reasons plus per-trial diagnostics. |
| `GET /studies/opt/history` | Per-trial metric value for one stage — the optimization curve. |
| `GET /studies/opt/params` | Per-trial params paired with the metric. Scatter-plot input. |
| `GET /studies/avg_opt/history` | Optimization curve on a weighted train/validation blend. |
| `GET /studies/avg_opt/params` | Params against the weighted train/validation blend. |
| `GET /studies/param-importances` | Which hyperparameters actually moved the objective. |
| `GET /v1/studies` | List every study visible to the key. |
| `GET /v1/studies/:study_name` | One study by name, with its top trials ranked by a metric. |

> [!TIP] Batch with study_ids
> Every endpoint except `/v1/studies` and `/v1/studies/:study_name` takes a comma-separated
> `?study_ids=1,2,3` and answers for the whole set in one round trip. Since the rate limit is
> shared across your organization, one batched request beats _n_ single-id requests.

## Monitoring a run

Four endpoints answer "how is this study doing?". All four **require** `study_ids` — calling them
without it returns `400 Bad Request`, as does a non-integer id. Each returns an object keyed by
study id, so a study you cannot see is simply absent from the response rather than an error.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/studies/progress?study_ids=17,18,19"
```

| Endpoint | Returns | Suggested interval |
|---|---|---|
| `/studies/progress` | `{ "<id>": 0.0–1.0 \| null }` | 5 s |
| `/studies/health` | `{ "<id>": 0.0–1.0 \| null }` | 5 s |
| `/studies/status` | `{ "<id>": { last_status, … } }` | 30 s |
| `/studies/errors` | `{ "<id>": { error_summary, failed_trials } }` | on demand |

`progress` is _trials recorded ÷ n_trials_, clamped to `[0, 1]`. It counts every trial the
optimizer has written, failed ones included — it measures how much of the budget is spent, not
how much succeeded. That is what `health` is for: `1 − failed ÷ total`, where a trial counts as
failed when the optimizer tagged it with a failure reason. Both are `null` when the ratio is
undefined — `progress` when the study declares zero trials, `health` before the first trial
lands.

> [!NOTE] Progress can stop short of 1.0
> A study whose search space is finite stops once every combination has been evaluated, so it can
> reach a terminal status with `progress < 1.0`. Treat `status`, not `progress`, as the signal
> that a run is over.

`/studies/status` returns the runtime row written by the platform's status updater. Studies that
have never been dispatched have no row and are omitted:

```json
{
  "data": {
    "17": {
      "last_status":       "RUNNING",
      "desired_status":    "RUNNING",
      "failure_message":   null,
      "started_at":        "2026-07-14T09:12:04Z",
      "finished_at":       null,
      "stop_requested_at": null
    }
  }
}
```

**`status` fields**

| Name | Type | Description |
|---|---|---|
| `last_status` | string | Where the run actually is: `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED` or `STOPPED`. `COMPLETED` means every task finished cleanly; `STOPPED` means a stop was requested from the app. |
| `desired_status` | string | `RUNNING` or `STOPPED` — the state the platform is steering towards. Stopping is cooperative, so `desired_status=STOPPED` with `last_status=RUNNING` is the normal in-between state. |
| `failure_message` | string \| null | Set when the run itself failed, as opposed to individual trials failing. |
| `started_at` / `finished_at` | timestamp \| null | UTC. `finished_at` is stamped on the first transition out of `RUNNING`. |
| `stop_requested_at` | timestamp \| null | When a stop was requested in the app. |

When health drops, `/studies/errors` explains why. It returns the failure reasons aggregated with
counts, plus the individual failed trials with the parameters that produced them:

```json
{
  "data": {
    "17": {
      "error_summary": [
        { "failure_reason": "grid_duplicate", "count": 41 },
        { "failure_reason": "ShapeError",     "count": 3 }
      ],
      "failed_trials": [
        {
          "trial":          128,
          "failure_reason": "ShapeError",
          "failure_diagnostic": {
            "stage":   "simulation",
            "kind":    "ShapeError",
            "message": "…",
            "tickers": ["ZION"],
            "suggested_actions": ["…"]
          },
          "params": { "lookback": 34, "ma_kind": "ema" }
        }
      ]
    }
  }
}
```

`failure_diagnostic` is the optimizer's structured diagnostic — stage, kind, message, offending
tickers and suggested actions. Older runs predate it and return `null`, so fall back to
`failure_reason`. Note that not every failure reason is a defect: a study exhausting a finite
grid records duplicate-configuration prunes here, which are benign.

## Study metadata

`/studies/metadata` is the only endpoint where `study_ids` is **optional**. Omit it to get every
study in your organization that the key can see — a convenient first call for discovering ids:

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/studies/metadata

curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/studies/metadata?study_ids=17"
```

**`metadata` fields**

| Name | Type | Description |
|---|---|---|
| `name` | string | Study name — the identifier the `/v1` endpoints address it by. |
| `strategy_id` / `strategy_name` | integer · string | The strategy being optimized. |
| `fitness_id` / `fitness_name` | integer · string | The fitness function used as the objective. |
| `n_trials` | integer | The trial budget the study was created with. |
| `completed_trials` | integer | Trials recorded without a failure reason. |
| `sampler` | string | Optuna sampler driving the search. |
| `train_start_date` / `train_end_date` | string · YYYY-MM-DD | In-sample search window. |
| `validation_start_date` / `validation_end_date` | string · YYYY-MM-DD | Held-out window used to pick the best trial. |
| `oos_start_date` / `oos_end_date` | string · YYYY-MM-DD \| null | Out-of-sample window, when the study defines one. |
| `strategy_data_cluster_id` | integer | Asset group the strategy ran against. |
| `fitness_data_cluster_id` | integer \| null | Separate cluster for the fitness function, when one is set. |
| `parameter_ranges` | object \| null | The search space, one entry per strategy parameter. `null` when the key cannot fully read the strategy — see below. |
| `fitness_parameters` | object \| null | Constants passed to the fitness function. `null` when the key cannot fully read the fitness function. |
| `daily_updates_enabled` | boolean | Whether the study's portfolios are recomputed daily after market data refreshes. |
| `grid_decimals` | integer \| null | Grid precision for float parameters (`step = 10⁻ᵈ`). `null` means continuous sampling. |
| `created_at` | timestamp \| null | UTC creation time. |

> [!WARNING] Two fields can come back null by design
> A study is visible organization-wide, but the code it references is not. When the key's owner
> cannot fully read the underlying strategy, `parameter_ranges` is redacted to `null`; the same
> applies to `fitness_parameters` and the fitness function. The study still appears, with its ids
> intact — so `null` here means "not yours to read", not "not configured".

## Optimization analytics

These four endpoints reconstruct the optimization run trial by trial. They read from the metrics
stored against each trial's portfolio, so they are only meaningful once trials have completed.

```http
GET /studies/opt/history
GET /studies/opt/params
```

| Endpoint | What it returns |
|---|---|
| `GET /studies/opt/history` | Per-trial metric value, keyed by trial number. |
| `GET /studies/opt/params` | Per-trial params alongside the same metric value. |

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `study_ids` | string · CSV | yes | Comma-separated study ids. |
| `metric_name` | string | yes | The metric to read, e.g. `sharpe`. Metric names match the ones shown on the study in the app. |
| `stage` | string | yes | Which window the metric was measured on: `train`, `validation` or `oos`. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/studies/opt/history?study_ids=17&metric_name=sharpe&stage=validation"
```

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

> [!NOTE] These are raw per-trial values
> `opt/history` returns what each trial actually scored, keyed by trial number and ordered by
> it — not a running best. Compute the cumulative maximum yourself if you want the classic
> monotone optimization curve; the raw series is strictly more informative, since it also shows
> the spread the sampler is exploring.

`opt/params` answers the same query with the trial's hyperparameters attached, which is what you
want for a params-versus-metric scatter. Categorical parameters arrive as their **label**, not as
the integer index the optimizer stores internally:

```json
{
  "data": {
    "17": [
      {
        "trial":        0,
        "portfolio_id": 1843,
        "value":        1.21,
        "params": { "lookback": 12, "n_top": 5, "ma_kind": "ema" }
      }
    ]
  }
}
```

The `avg_opt` pair answers the same two questions against a **weighted blend of train and
validation** instead of a single stage — useful for ranking trials that neither overfit the
search window nor got lucky on the held-out one.

| Endpoint | What it returns |
|---|---|
| `GET /studies/avg_opt/history` | Weighted train/validation blend, keyed by trial number. |
| `GET /studies/avg_opt/params` | Weighted train/validation blend with per-trial params. |

**Query parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `study_ids` | string · CSV | — (required) | Comma-separated study ids. |
| `metric_name` | string | — (required) | The metric to blend. |
| `train` | number | `0.5` | Weight applied to the train-stage value. |
| `validation` | number | `0.5` | Weight applied to the validation-stage value. |

> [!WARNING] The weights must sum to 1.0
> `train + validation` is checked and anything else returns `400 Bad Request`. Omit both to get
> the even `0.5 / 0.5` split. Only the `train` and `validation` stages take part — there is no
> `stage` parameter here, and `oos` is never blended in. Response shapes are identical to their
> `opt/` counterparts, so the same parsing code works for both.

## Parameter importances

`/studies/param-importances` reports which hyperparameters actually drove the objective, and
which ones look like overfitting. `study_ids` is required. Studies too sparse to score, or not
yet scored, are absent from the response rather than returned empty.

**Response fields, per study**

| Name | Type | Description |
|---|---|---|
| `study_id` | integer | The study the row describes. |
| `n_effective_params` | integer \| null | Parameters that actually varied across the scored trials. |
| `n_trials_used` / `n_trials_total` | integer \| null | Trials the scoring ran on, against the study's total. |
| `objective_metric` | string \| null | Metric the importances were computed against. |
| `headline_evaluator` | string \| null | Which estimator produced the headline numbers. |
| `most_influential_param` | string \| null | Parameter with the highest importance. |
| `most_influential_importance` | number \| null | Its importance score. |
| `most_influential_direction` | string \| null | Direction of the relationship between that parameter and the objective. |
| `max_overfit_param` | string \| null | Parameter with the widest train-versus-validation gap. |
| `max_overfit_gap` | number \| null | The size of that gap. |
| `artifact` | object \| null | Full computed artifact, passed through verbatim — per-parameter scores and supporting detail behind the headline fields. |

## Studies and top trials

The `/v1` pair predates the id-based endpoints above and addresses studies by **name**. They
remain supported.

`GET /v1/studies` — every study visible to the key, newest first. No query parameters.

Each entry carries `name`, `last_status`, `n_trials`, `completed_trials`, the train and validation
windows, `daily_updates_enabled` and `created_at`. Unlike `/studies/metadata`, `completed_trials`
here counts only trials the optimizer finished and recorded as complete, so the two numbers can
differ while a run is in flight.

`GET /v1/studies/:study_name` — one study with its top trials ranked by a metric on a stage.

**Query parameters**

| Name | Type | Default | Description |
|---|---|---|---|
| `n_top` | integer | `10` | How many trials to return. Clamped to 1–100. |
| `stage` | string | `validation` | Stage the ranking metric is read from: `train`, `validation` or `oos`. |
| `metric` | string | `sharpe` | Metric the ranking is done on. |
| `order` | `"asc"` \| `"desc"` | `desc` | Ranking direction. Use `asc` for metrics where lower is better, such as drawdown. |

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v1/studies/sp500_momentum_q1?n_top=5&metric=sharpe&stage=validation"
```

```json
{
  "data": {
    "name":            "sp500_momentum_q1",
    "strategy":        "Cross-sectional momentum",
    "fitness":         "Sharpe minus drawdown",
    "sampler":         "TPE",
    "n_trials":        500,
    "completed_trials": 487,
    "train_start_date":      "2018-01-01",
    "train_end_date":        "2020-12-31",
    "validation_start_date": "2021-01-01",
    "validation_end_date":   "2022-12-31",
    "oos_start_date":        null,
    "oos_end_date":          null,
    "top_portfolios": [
      {
        "rank":         1,
        "portfolio_id": 1845,
        "trial":        2,
        "metrics": {
          "train":      { "sharpe": 1.71, "max_drawdown": -0.18 },
          "validation": { "sharpe": 1.44, "max_drawdown": -0.21 }
        }
      }
    ]
  }
}
```

Each entry in `top_portfolios` carries its `rank`, the `trial` number, the `portfolio_id` to
follow into the portfolios endpoints, and a `metrics` map nested `stage → metric → value` — every
stage on record, not only the one you ranked by, so you can check a trial's validation number
against its train number in the same payload. An unknown or invisible study name returns
`404 Not Found`.

## Why a study can be missing

Beyond the visibility rules that apply to every endpoint, studies draw one extra distinction. A
study has a **dashboard** facet — how far along it is, whether it failed, how its trials scored —
and a **code** facet: the search space it explored and the tuned parameters each trial used. The
code facet belongs to the strategy, and that strategy may be private to a colleague even when the
study is visible to the whole organization. So the two facets are gated separately:

- `/v1/studies`, `/v1/studies/:study_name`, `/studies/progress`, `/studies/health`,
  `/studies/status` and `/studies/errors` follow the study's own visibility
- `/studies/opt/*`, `/studies/avg_opt/*` and `/studies/param-importances` require full read
  access to the _underlying strategy_, and silently omit studies that fail that test
- `/studies/metadata` keeps the study and redacts only the two code-bearing fields, as described
  above

> [!NOTE] Missing, not forbidden
> A study you cannot read at full fidelity is left out of the response object; it never raises
> `403`. If a study shows up in `/studies/progress` but not in `/studies/opt/history`, that gap is
> this rule — ask the strategy's owner to share it with the organization in the app, and the
> analytics endpoints start answering.
