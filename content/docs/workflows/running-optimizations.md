---
title: Running optimizations
section: Workflows
sectionOrder: 2
order: 3
published: true
updated: 2026-08-04
summary: Configure and launch a parameter optimization study from the UI step by step.
keywords: create study, optimization, study wizard, sampler, n_trials, parameter bounds, autostop, grid precision, risk-manager optimization
---

A study is a parameter sweep — it runs your strategy hundreds of times with different
parameter combinations to find the best-performing configuration. This page walks through
the full study creation wizard and explains every option.

## Overview

Creating a study takes about 2 minutes in the UI. The wizard has 5 steps, and you can go
back and change any step before creating. Once created, the study is queued immediately and
starts running when a worker becomes available.

```text
Study creation wizard
├── Step 1: Strategy + Fitness function
├── Step 2: Asset groups + Date ranges
├── Step 3: Sampler + n_trials
├── Step 4: Parameter search space
└── Step 5: Review + Create
```

## Prerequisites

Before creating a study you need at least one of each:

| Item | Description |
|---|---|
| [Strategy](/docs/managing-strategies) | A strategy with at least one defined parameter. |
| [Fitness function](/docs/core-concepts#fitness-functions) | A fitness function that scores simulated portfolios. |
| [Asset group](/docs/core-concepts#asset-groups) | A market data snapshot with tickers and a date range. |

## Step 1 — Strategy & fitness

`Registry → Studies → + New Study → Step 1`

Select the strategy and fitness function for this optimization run. Both selectors show a
live preview of the selected item:

| Field | Description |
|---|---|
| Strategy preview | Shows execution type, the Python code (read-only), and the list of defined parameters. |
| Fitness preview | Shows execution type and any configurable fitness parameters (e.g. risk-free rate for a Sharpe scorer). |

> [!TIP]
> If you haven't set a fitness parameter value (e.g. risk-free rate), you can set it in
> this step. The value is fixed for the entire study — the optimizer does not sweep fitness
> parameters.

## Step 2 — Data & dates

Choose which market asset groups to use and set the date ranges for training, validation,
and out-of-sample evaluation. The universe picker also lists **pre-built groupings** — the
Sector ETFs, an index like the S&P 500, a sector, industry, or country — so you can run on a
ready-made universe without building a cluster first (it's materialized into a derived
cluster automatically).

| Field | Description |
|---|---|
| Strategy clusters | One or more asset groups the strategy runs on. Each cluster spawns a separate study (bulk creation). |
| Fitness cluster | The asset group used for fitness evaluation. Can be the same as or different from the strategy cluster. |
| Start / end dates | Set per-cluster. The date range is split into train, validation, and optional OOS windows based on the split percentage you set. |
| Train split % | What fraction of the date range is used for training. The remainder is split between validation and OOS. |

> [!WARNING]
> If your strategy uses a look-back window parameter (e.g. a 60-day ROC window), the start
> date must be far enough from the cluster's first available date to provide sufficient
> warm-up data. The UI shows a warning if the start date is too early relative to available
> data, or too late for the window size.

## Step 3 — Sampler & trial count

Choose the search algorithm and how many parameter combinations to evaluate.

| Field | Description |
|---|---|
| `n_trials` | Total number of parameter combinations to evaluate. Each trial runs a full backtest simulation. More trials = better coverage but longer runtime. |
| `Sampler` | The algorithm used to pick the next parameter values. TPE is the default — it learns from past trials to focus on promising regions. |
| `Grid precision` | Optional decimals for float parameters — the search samples on a step = 10⁻ᵈ grid instead of continuously. Also makes float ranges finite, so they count toward the search-space size. |
| `Autostop` | Optional minimum trial health threshold. If too many trials fail (e.g. due to data/timeout issues), the study stops early rather than wasting compute. |

> [!TIP]
> Start with `n_trials: 20–50` for a quick smoke test, then increase to 200+ for a thorough
> search. You can always resume a stopped study to add more trials. See
> [Sampler selection](/docs/sampler-selection) for a comparison of available algorithms.

> [!NOTE] Finite search spaces
> When every non-fixed parameter is finite — integer ranges, categorical choices, or float
> ranges with a grid precision — the wizard shows the exact number of combinations
> (_Search space: N combinations_). Asking for more trials than that only warns: `n_trials`
> is capped to the grid at launch, the optimizer enumerates every combination exactly once,
> and the study completes early as soon as the grid is exhausted.

## Step 4 — Parameter search space

For each parameter in your strategy, define what the optimizer is allowed to explore. What
you configure depends on the parameter's type:

| Parameter type | What you configure |
|---|---|
| Numeric (integer / float) | Set the minimum and maximum values. The sampler picks values within these bounds for each trial. |
| Categorical | Pick which of the strategy's declared choices to explore — the full set or any subset. Each trial receives one of the selected strings. |
| Fixed | Any parameter can be switched to Fixed instead: pin it to a single value (a number, or one choice for categoricals). Fixed parameters are passed to every trial unchanged and are excluded from the search. |

Fixing parameters shrinks the search space — often enough to make it finite, so the study
can enumerate it completely (see the finite-search-space note in Step 3). The parameter list
is pulled directly from the strategy definition. If your strategy has fitness parameters
(e.g. a risk-free rate), those appear in a separate section with fixed values (not ranges).

> [!NOTE]
> **Window-size parameters** automatically have their maximum clamped to the number of
> available business days before the training start date — the UI shows this constraint next
> to the slider.

## Step 5 — Review & create

A summary card shows all selections before you commit:

| Field | What it shows |
|---|---|
| Study name | Auto-generated from strategy name + timestamp, editable. |
| Strategy | Name, type, parameter count. |
| Fitness | Name, type. |
| Data | Cluster(s), date range(s), split percentages. |
| Sampler | Algorithm and `n_trials`. |
| Parameters | The search spec per parameter — min/max range, selected choices, or fixed value. |

Click **Create study**. If you selected multiple strategy clusters, one study is created per
cluster and all are queued simultaneously.

## Attaching risk managers

A study can include one or more **risk managers** — the governance layer that runs on every
step of a backtest, before the strategy rebalances, and acts on the portfolio from the
previous step (closing positions, halting rebalancing, or trimming holdings that breach a
limit). When you attach risk managers to a study, every trial runs them first on each step
and then the strategy's rebalance. See
[When they act](/docs/managing-risk-managers#when-they-act) for how this affects same-step
strategy signals.

| Field | Description |
|---|---|
| Selection | Pick risk managers from your Registry, or attach a built-in rule from the catalog directly. |
| Parameter mode | Set each risk manager parameter as fixed (a single value) or optimizable (a min/max range the optimizer searches alongside the strategy parameters). |
| Execution order | When several risk managers are attached, define the order in which they run on each step. Used as a tie-breaker when more than one manager wants to act on the same position. |

> [!NOTE]
> The study captures the configuration of every risk manager attached to it, so its results
> stay reproducible even if you edit the risk manager later. See
> [Managing risk managers](/docs/managing-risk-managers) for how to create and version them.

## Risk-manager optimization studies

Instead of optimizing a strategy, you can optimize the **risk managers** applied to an
existing portfolio. Starting from a source portfolio, you choose which risk managers to
attach and which of their parameters to optimize. Each trial reuses the source portfolio's
strategy and signals unchanged, varying only the risk-manager configuration — so you can
isolate the effect of risk management on the same underlying strategy.

Every trial produces a **derived portfolio** linked back to its source. The result is a
family of portfolios you can compare directly to see which risk-manager configuration best
protects the original strategy. See [Analyzing results](/docs/analyzing-results) for how to
navigate portfolio lineage.

## Monitoring a running study

`Registry → Studies → Study name`

Open a running study to see:

| Panel | What it shows |
|---|---|
| Progress bar | Shows completed / total trials as a fraction. Updates in real time. |
| Health | Fraction of non-failed trials (1 = all trials succeeded). Below a threshold, autostop kicks in. |
| Best score | The highest fitness score seen so far, updated as trials complete. |
| Trial history | A scatter plot of trial fitness scores over time — lets you see if the optimizer is converging. |
| Trial table | Every completed trial with its parameter values and fitness score. Click a row to open the portfolio details. |

## Pausing and stopping

Studies support two interruption modes — accessible via the action menu in the study list or
study detail page:

| Action | What it does |
|---|---|
| Pause | No new trials are dispatched. Trials already running complete normally. The study can be resumed later — the sampler picks up exactly where it left off. |
| Stop | Permanently halts the study. Trials in flight complete, but no new ones start. Cannot be resumed. |

## After completion

When a study reaches **COMPLETED** status:

1. **Go to Analytics → Portfolios.** All portfolios from the completed study appear in the
   portfolio dashboard, ranked by fitness score. Select the study from the filter dropdown
   to isolate its results.
2. **Compare and sort.** Sort portfolios by any metric — Sharpe, Calmar, max drawdown,
   CAGR, win rate. The default sort is by training fitness score.
3. **Inspect the best trial.** Click any portfolio row to open the full detail view: equity
   curve, trade log, holdings breakdown, and per-window metrics.
4. **Promote to live (optional).** When you've found the parameter set you want to deploy,
   promote it to a live portfolio and connect a broker agent. See
   [Live trading](/docs/live-trading).
