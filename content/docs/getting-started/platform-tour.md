---
title: Platform tour
section: Getting Started
sectionOrder: 1
order: 2
published: true
updated: 2026-08-04
summary: A visual map of the Fintela UI — sections, navigation, and where every feature lives.
keywords: ui, navigation, tour, interface, registry, analytics, agents, status badges, execution type
---

A map of the Fintela UI — every section, what it contains, and how the pieces connect.
Read this before the quickstart so you know where to click.

## Navigation structure

The Fintela app is organized into three sections in the left sidebar — **Analysis**,
**Registry**, and **AI**, the last of which appears only if your role grants access to
the AI assistant. Team management isn't in the sidebar at all — it lives in Account
settings. The sidebar collapses to icons on desktop and opens as a full drawer on
mobile.

```text
Fintela App
├── Analysis              ← Inspect results & explore markets
│   ├── Home
│   ├── Portfolios
│   ├── Markets
│   └── Data Explorer
│
├── Registry              ← Build & deploy
│   ├── Data Pipelines
│   ├── Asset Groups
│   ├── Strategies
│   ├── Fitness Functions
│   ├── Studies
│   ├── Risk Managers
│   └── Portfolio Manager
│
└── AI                    ← Ask questions in plain language
    └── Fintelligent
```

> [!TIP]
> The natural workflow moves between Registry and Analysis: define your building blocks
> in **Registry** (asset groups → strategies → fitness functions → studies), then
> inspect results in **Analysis** (Portfolios), and deploy via
> **Registry → Portfolio Manager**.

## Analysis

The Analysis section is where you monitor results and explore live market data. Home
gives you an overview dashboard; Portfolios lets you deep-dive into optimization
results; Markets shows live price data for any instrument.

### Analysis → Portfolios

Compare trial results across completed studies. Sort, filter, and deep-dive into
individual portfolio performance.

| Area | What it does |
|---|---|
| Portfolio dashboard | Ranked table of all portfolios from selected studies. Sort by Sharpe, Calmar, max drawdown, CAGR, win rate. |
| Equity charts | Time-series equity curves with benchmark overlay, drawdown chart, and volatility chart. |
| Trade history | Full list of simulated trades: entry/exit dates, P&L, MAE, MFE. Click a trade, then a scaling, to drill into per-scale efficiency, MAE/MFE, and segment return. |
| Holdings | Position snapshot for any date — ticker allocations and portfolio weights. |
| Risk managers | The risk manager configuration the portfolio was produced with, plus an execution log for diagnosis. |
| Lineage | If the portfolio was derived from another, the link back to its source — trace and compare a family of related portfolios. |
| Pivot table | Cross-study parameter comparison — see how each parameter value affected the fitness score. |

Learn more: [Analyzing results](/docs/analyzing-results).

## Registry

The Registry is where you define and manage every building block of the optimization
system — data, strategies, fitness functions, studies, and live agents. Items appear in
the sidebar ordered from foundational (data) to deployment (agents).

### Registry → Asset Groups

Create and manage market data snapshots that provide the price history your strategies
run on.

| Area | What it does |
|---|---|
| Cluster list | All asset groups with ticker count, date range, and timeframe. |
| Create cluster | Select tickers, set start/end dates, and choose a candle resolution (1d, 1h, etc.). |
| Coverage report | See which tickers have full coverage vs. partial data for the selected date range. |
| Index members | Automatically include tickers from a market index (e.g., S&P 500 constituents) on each date. |
| Pre-built groupings | Skip cluster creation — pick the Sector ETFs, an index, a sector, an industry, or a country directly as a study universe. |
| Baskets as assets | Feed a cluster with your own graduated baskets — each portfolio's equity curve becomes an input series — to optimize meta-strategies (portfolios of portfolios). |

Learn more: [Asset groups](/docs/core-concepts#asset-groups).

### Registry → Fitness Functions

Define how a completed backtest simulation is scored — the objective the optimizer
maximizes.

| Area | What it does |
|---|---|
| Fitness list | All fitness functions with name, execution type, and linked studies. |
| Create fitness | Write Python that receives the simulation result and returns a single float score. |
| Built-in scorers | Sharpe ratio, Sortino, Calmar, max drawdown are available as one-liners. |

Learn more: [Fitness functions](/docs/core-concepts#fitness-functions).

### Registry → Strategies

Write and manage the Python functions (or external endpoints) that generate trading
signals for each trial.

| Area | What it does |
|---|---|
| Strategy list | All strategies in your organization, with name, type (internal/external), and linked study count. |
| Create strategy | Choose internal (Python editor) or external (HTTPS endpoint). Define parameter names and types. |
| Edit / validate | Edit code inline with Monaco editor. Click Validate + Save to run a live test before saving. |
| Sandbox | Test your strategy on real data with a specific parameter set before running a full study. |

Learn more: [Managing strategies](/docs/managing-strategies).

### Registry → Risk Managers

Create and manage the governance layer that protects a portfolio during a backtest —
built-in rules, rule-based combinations, custom logic, or your own endpoint.

| Area | What it does |
|---|---|
| Risk manager list | All risk managers with name, kind, version, and whether they are publicly shared. |
| Create risk manager | Choose built-in, rule-based (no code), custom (Python), or external (your endpoint). |
| Versioning & history | Every edit is preserved as a version. Review what changed and when. |
| Public catalog | Share a risk manager with other organizations, or derive a copy from one shared with you. |
| Sandbox | Test a risk manager alongside a strategy on real data before attaching it to a study. |

Learn more: [Managing risk managers](/docs/managing-risk-managers).

### Registry → Studies

Bind a strategy + fitness + asset group + parameter bounds, then launch the optimization
run.

| Area | What it does |
|---|---|
| Study list | All studies with live status badges (QUEUED, RUNNING, COMPLETED, FAILED, PAUSED). |
| Create study | 5-step wizard: select strategy + fitness → pick the universe (an asset group OR a pre-built grouping like the Sector ETFs / an index) → set dates → configure sampler → set parameter bounds. |
| Study detail | Monitor progress, view trial health, inspect per-trial results. |
| Pause / resume | Studies can be paused and resumed without losing completed trial results. |

Learn more: [Running optimizations](/docs/running-optimizations).

### Registry → Portfolio Manager

Group promoted portfolios into baskets and invest them through a live brokerage account,
routing real orders in real time based on strategy signals.

| Area | What it does |
|---|---|
| Operations | Every trading session on a basket, with its status, connection, and committed capital. |
| Connect your brokerage | Link your account under Account settings → Broker connections. Operations inherit that connection's paper or live environment. |
| Launch / pause / stop | Pause keeps positions; Stop liquidates what the operation bought. A stopped operation can be re-initiated. |
| Orders | Audit trail of every order placed, filled, or rejected by the broker, under an operation's Details. |

Learn more: [Live trading](/docs/live-trading).

## Account settings

Account settings lives in the avatar menu in the top-right, not in the sidebar.
Alongside your broker connections it holds team management, which is editable only by
organization admins (users with the `users:manage` permission).

| Area | What it does |
|---|---|
| Organization | Manage team members, roles, and permissions across your organization. |

## UI conventions

A few recurring patterns appear throughout the Fintela UI that are worth knowing before
you start exploring.

### Status badges

| Badge | Meaning |
|---|---|
| `QUEUED` | Waiting for an available worker slot. The study was created but hasn't started executing yet. |
| `RUNNING` | Trials are actively being sampled and simulated. The progress bar updates in real time. |
| `COMPLETED` | All `n_trials` finished. Results are available in Analytics → Portfolios. |
| `PAUSED` | Manually paused. No new trials are dispatched, but completed results are preserved. Can be resumed. |
| `FAILED` | A fatal error stopped the run. Check the study detail page for the error message. |
| `STOPPED` | Manually stopped before completion. Results from completed trials are still available. |

### Execution type badges

| Badge | Meaning |
|---|---|
| `INTERNAL` | Python code stored in Fintela and executed in-process. Edit directly in the browser code editor. |
| `EXTERNAL` | Your own HTTPS endpoint. Fintela calls it once per trial. Code never leaves your infrastructure. |

> [!NOTE]
> The platform is designed so that everything you see in the UI can also be done
> programmatically via the REST API. The API documentation mirrors the UI workflows
> exactly — read the UI docs first if you're new, then refer to the
> [API reference](/docs/api-overview) for automation.
