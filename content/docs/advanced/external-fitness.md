---
title: External fitness
section: Advanced
sectionOrder: 4
order: 2
published: true
updated: 2026-08-04
summary: Score trials with a fitness function you own and host.
keywords: external fitness, evaluate endpoint, scoring, self-hosted, fitness_params, nan_fitness
---

Host the scoring logic on your own infrastructure. Fintela's optimizer sends every simulated
period to your endpoint and receives back a single number — the fitness — that drives the
search.

## When to use

- Regulator-aware or compliance-controlled scoring rules
- Custom risk-adjusted metrics that combine market data the user owns
- Composite scores that aggregate across portfolio universes
- Scoring logic in a language other than Python

## Endpoint contract

Your endpoint accepts a `POST` to `/evaluate`. The body is the _simulation period_ — a dict of
trades, equity, and per-period metrics. Fitness parameters travel in the query string. The
response is a single float wrapped in a JSON object.

```http
POST {your-endpoint}/evaluate
```

Score one simulated period for the current trial.

**Query parameters**

One entry per parameter declared on the fitness record. Values come from
`study.fitness_params`.

**Body**

| Name | Type | Description |
|---|---|---|
| `trades` | array | Each executed trade with entry/exit prices and timestamps. |
| `equity` | object | Cumulative equity curve as `{ date: value }`. |
| `period_metrics` | object | Precomputed period-level metrics — Sharpe, Sortino, drawdown, etc. |

### Response

```json
{
  "fitness": 0.85
}
```

> [!WARNING] Asymmetry with /simulate
> Strategy endpoints take params in the **body** and dates in the **query string**. Fitness
> endpoints flip the pattern — params in the **query string**, simulation period in the
> **body**. Read params from `request.query_params` (or FastAPI's `Query(...)`), not from the
> JSON body.

## The simulation period payload

The optimizer evaluates your endpoint up to four times per trial — once per stage. Each call
carries the slice of the backtest for that window.

| Stage | Window | Stored under |
|---|---|---|
| Train | `train_start_date` → `train_end_date` | `period_metrics["{train_start}/{train_end}"]` |
| Validation | `validation_start_date` → `validation_end_date` | `period_metrics["{val_start}/{val_end}"]` |
| Overall | Full span across stages | `period_metrics["overall"]` |
| OOS | `oos_start_date` → `oos_end_date` | `period_metrics["{oos_start}/{oos_end}"]` (when configured) |

Train fitness drives the optimization search; the other stages are stored for analysis and
display on the study results pages.

## Multi-parameter fitness

External fitness can accept any number of parameters. Declare them on the fitness record, set
values per study, and the optimizer forwards them as query-string params on every call.

```json
# Per-fitness declaration
[
  { "parameter_name": "alpha",           "dtype": "float", "is_window": false },
  { "parameter_name": "downside_weight", "dtype": "float", "is_window": false }
]

# Per-study fitness_params
{
  "alpha":            0.5,
  "downside_weight":  1.2
}

# Per-trial query string assembled by the optimizer
?alpha=0.5&downside_weight=1.2
```

## Registering the fitness

```json
POST /fitness

{
  "name": "regulator_aware_sharpe",
  "description": "Custom sharpe variant with regulator-defined penalties.",
  "execution_type": "external",
  "execution_details": {
    "endpoint":        "https://my-fitness.example.com",
    "timeout":         15.0,
    "max_concurrency": 4
  },
  "parameters": {
    "risk_free":       { "datatype": "float", "is_window": false },
    "drawdown_weight": { "datatype": "float", "is_window": false }
  }
}
```

## Failure handling

Identical to external strategies — every exception (network, status, malformed JSON, missing
`fitness` key) marks the trial as failed, with the message recorded for diagnosis. No retries.

> [!TIP] NaN is a guarantee, not a hint
> Return `NaN` when you want the trial pruned — the optimizer detects it and records
> `failure_reason: "nan_fitness"` automatically. Returning an extreme number to mean "bad" can
> fool the search.

## Reference example

**Python · FastAPI**

```python
from fastapi import FastAPI, Query

app = FastAPI()

@app.post("/evaluate")
def evaluate(
    simulation_period: dict,
    risk_free: float = Query(0.02),
):
    trades = simulation_period.get("trades", [])
    equity = simulation_period.get("equity", {})

    # Your scoring logic.
    score = compute_my_score(trades, equity, risk_free)

    return {"fitness": score}
```
