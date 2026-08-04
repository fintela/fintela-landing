---
title: Core concepts
section: Getting Started
sectionOrder: 1
order: 4
published: true
updated: 2026-08-04
summary: Strategies, fitness functions, risk managers, studies, trials, portfolios — the vocabulary you need.
keywords: strategy, fitness, study, trial, portfolio, asset group, data cluster, seed, risk manager, operation, concepts
---

A handful of building blocks carry you from market data to live capital. Each maps to
a section in the UI — learn the concepts here, then follow the workflow guides to see
them in action.

## The pipeline

Every trading idea on Fintela flows through the same sequence:

```text
Asset Group ──► Strategy ──► Fitness ──► Study ──► Portfolios ──► Operations
   market data    signals      score        search       results     Brokerage

               └────────── Risk Managers ──────────┘
                  governance layer · protect the portfolio
```

Each step persists, can be reused, and is versioned — you build a library once and
recombine pieces forever. For a visual map of the UI screens, see the
[Platform tour](/docs/platform-tour).

## Asset groups

`Data → Markets → + New Cluster`

An **asset group** is a named, reusable snapshot of market data — a set of tickers
(stocks, ETFs, crypto, indices, forex) and a date range. Every backtest references a
cluster by id, which makes results perfectly reproducible across studies.

You can keep a library of clusters representing different regimes (S&P 500 pre-2020,
post-2020), sectors, or asset classes — and run the same strategy against multiple
clusters in a single bulk study.

Beyond clusters you build, the platform exposes **pre-built groupings** — the Sector
ETFs, country ETFs, indices like the S&P 500, sectors, and industries — that you can
pick directly as a study's universe. Selecting one materializes a derived cluster
automatically (kept out of your cluster library, but referenced by id like any other).

A cluster's assets aren't limited to individual tickers — it can also feed on your own
**baskets** (graduated portfolios). Each basket contributes its equity curve as an
input series that the strategy scores exactly like a ticker price, so you can build
**meta-strategies** — portfolios of portfolios that allocate capital across your own
strategies.

## Data pipelines

`Registry → Data pipelines`

Beyond raw market prices, strategies, fitness functions and risk managers pull custom
data through **data pipelines** — reusable, versioned graphs that wire **data sources**
(built-in feeds like trading volume, fundamentals, news sentiment, market cap,
dividends & splits, sector / country / index groupings and basket holdings, or your own
external APIs) through **transforms** (returns, rolling, z-score, rank, lag, combine)
into named **outputs**.

Sources can be built-in feeds or your own **external data sources** — a public HTTPS
endpoint you host, in front of your own database or API, that returns JSON for the
tickers Fintela requests. Fintela pulls and caches it out of band and injects it as a
kwarg; it never connects to your database directly and never runs your code.

Each output node becomes a named input in your code's signature, and validation is
**graph-aware**: before you save, the platform walks the exact pipeline the runtime
will, so an input only resolves if a connected pipeline actually produces it. Pipelines
are built once and connected to any strategy, fitness function or risk manager — no
glue code, no per-component data plumbing. See [Data pipelines](/docs/data-pipelines)
for the full reference.

Not sure what a source actually looks like? The **Data Explorer → Ingredients**
catalog documents every injectable source's exact shape — a table, a dictionary, a
membership set of tickers, or a record — with a code-indexing example and a live
sample. Non-price objects like hierarchical groupings, default clusters and basket
holdings are configured and previewed right there, so you know each ingredient before
you wire it in.

## Strategies

`Registry → Strategies`

A **strategy** is the rule that decides what to buy, sell, and when. Fintela
strategies are Python functions that emit a signal:

```python
signal = {
  "2024-01-02": {
    "AAPL": {"position": "L", "allocation": 0.5},
    "MSFT": {"position": "L", "allocation": 0.5},
  },
  "2024-02-01": {
    "AAPL": {"position": "S", "allocation": 0.3}
  }
}
```

Strategies can run **internal** (Python stored in Fintela and executed in-process by
the optimizer task) or **external** (an HTTPS endpoint you host — your code never
leaves your infrastructure). See [Managing strategies](/docs/managing-strategies) for a
full UI walkthrough.

Internal code runs against a curated, version-pinned scientific Python stack — NumPy,
pandas, SciPy, scikit-learn, statsmodels, ta, and CVXPY — that you can import with no
setup. See [Python libraries](/docs/managing-strategies#python-libraries).

Strategies declare typed **parameters** — the knobs a study optimizes. Three dtypes are
supported: `integer`, `float`, and `categorical`. A categorical parameter declares a set
of string `choices` (e.g. `["ema", "sma", "wma"]`); your code receives the chosen string
as the argument value. In a study, each parameter is given a numeric range, a subset of
its declared choices, or a single fixed value.

Strategies can also inject **basket holdings** — which tickers each of your baskets
holds over time, with side and allocation — as read-only feature data, so aggregate
exposure across your portfolios can drive the signal.

## Fitness functions

`Registry → Fitness`

A **fitness function** turns a simulated period — the trades, the equity curve, the
period metrics — into a single number to maximize. Sharpe, Sortino, Calmar, custom
composite scores. Like strategies, fitness functions can be internal or external.

> [!TIP] Reuse over rebuild
> A single fitness function can power dozens of strategies. Build a small library of
> canonical scorers (e.g., `sharpe_strict`, `cvar_penalized`) and your team will
> optimize for the same things.

## Risk managers

`Registry → Risk Managers`

A **risk manager** is a governance layer that runs on every step of a backtest, before
the strategy rebalances, and applies protective actions on the portfolio as it stood
after the previous step — closing positions, pausing rebalancing, or trimming holdings
that breach a limit. It runs alongside the strategy, not inside it: halts can suppress
the strategy's rebalance on the same step, and reactive protections (stop loss,
trailing stop, take profit) close existing positions before the strategy acts.
Allocation caps (position, sector, country, gross-exposure, cash floor) trim holdings
that already exceed the limit; they do not pre-screen new orders, so a fresh rebalance
that breaches a cap is corrected on the next step.

Risk managers come in four flavors so you can match the effort to the need:
**built-in** rules from the catalog (stop loss, trailing stop, take profit, max
drawdown, exposure and position caps, time-window halts), **rule-based** risk managers
you compose visually with no code, **custom** risk managers you write in Python, and
**external** risk managers you host behind your own endpoint. Each one is versioned,
can be shared, and can be tested in a sandbox. See
[Managing risk managers](/docs/managing-risk-managers) for the full walkthrough.

## Studies

`Registry → Studies → + New Study`

A **study** is one optimization run. It binds a strategy, a fitness function, an asset
group, and a parameter search space, then explores that space using a Bayesian sampler
(TPE, CMA-ES, NSGA-II, …). Created via a 5-step wizard — see
[Running optimizations](/docs/running-optimizations).

The **universe** a study runs on is either a saved asset group or a pre-built grouping
picked straight from the builder — the Sector ETFs, an index like the S&P 500, or a
single sector, industry, or country. Picking a grouping materializes a derived cluster
behind the scenes; the study still binds a `cluster_strategy_id` like any other.

| Field | Description |
|---|---|
| `n_trials` | Total parameter combinations to evaluate |
| `sampler` | Search algorithm (TPE / CMAES / RANDOM / QMC / NSGA2) |
| `params` | Per-parameter search spec: a `{minimum, maximum}` range, a fixed `{value}`, or `{choices: […]}` for categorical parameters |
| `grid_decimals` | Optional decimals for the float search grid (step = 10⁻ᵈ) — makes float ranges finite |
| `train/val/oos dates` | The three evaluation windows |
| `optimization_direction` | Maximize or minimize the fitness (defaults to the metric's natural direction) |
| `autostop_min_health` | Halt early if failure rate climbs above this |

The search space is declared **per parameter**. A numeric parameter takes a
`{minimum, maximum}` range; a categorical parameter takes a `{choices: [...]}` subset of
the choices the strategy declares. Any parameter can instead be **fixed** — `{value: 20}`
or `{value: "ema"}` — pinning it for every trial and excluding it from the search.

When every non-fixed parameter is finite — integer ranges, categorical choices, or
float ranges with `grid_decimals` set — the search space has a countable number of
combinations. The wizard shows that count, `n_trials` is capped to it at launch, and the
optimizer enumerates the full grid without repeating configurations, so the study
**completes early** once every combination has been evaluated.

Every study chooses an **optimization direction** — whether the optimizer **maximizes**
or **minimizes** the fitness. It defaults to the metric's natural direction (Sharpe →
maximize, max-drawdown → minimize), so you rarely touch it; flip it when you
deliberately want the other side — e.g. minimize a return metric to surface the worst
configurations, or minimize volatility/drawdown with a custom fitness. It is set at
creation and frozen once the study launches.

## Trials

Each **trial** is one parameter sample. The optimizer picks a vector of parameter
values, runs the strategy, evaluates fitness on each stage (train / validation /
overall / OOS), and either succeeds or is pruned with a recorded failure reason.

Train fitness is the value the search algorithm maximizes — it drives which parameter
regions to explore next. Validation, overall, and OOS values are stored for analysis
but do not influence the search.

## Portfolios

`Analytics → Portfolios`

Every successful trial produces a **portfolio** — a complete backtest result for one
parameter combination, including the equity curve, every trade, holdings at any point
in time, and 20+ performance metrics across all stages.

The portfolio is the artifact you compare against, share with stakeholders, and
ultimately promote to live trading. It also records the configuration it was produced
with — including any risk managers that were attached — and its **lineage**: if a
portfolio was derived from another one, it keeps a link back to its source, so you can
trace and compare a family of related portfolios. See
[Analyzing results](/docs/analyzing-results) for a full walkthrough of the portfolio
dashboard.

From the dashboard you can also run an **invert what-if**: flip every position
Long↔Short and instantly re-simulate the portfolio to see its **contrarian** equity
curve and metrics overlaid on the original. It is a transient preview — nothing is
saved and live trading is untouched — so you can answer "what if this had gone the
other way?" without creating a new study.

## Seed

`Analysis → Trial / Basket → Seed`

A **seed** is the daily rebalancing signal the engine consumed to build a backtest —
the exact positions and weights a strategy produced on each date. It is the same shape
a strategy emits:

```python
seed = {
  "2024-01-02": {
    "AAPL": {"position": "L", "allocation": 0.5},
    "MSFT": {"position": "L", "allocation": 0.5}
  },
  "2024-02-01": {
    "AAPL": {"position": "S", "allocation": 0.3}
  }
}
```

Every optimization **trial** stores its seed (so does each managed portfolio, extended
daily). A **basket** has no seed of its own — it exposes each member's seed plus a
**blended** combined signal (members weighted by the basket's allocation on the
rebalance grid).

You can inspect and download the seed — as **JSON** (the exact engine input) or **CSV**
(one row per date/ticker) — from the trial detail, the basket detail, and a sandbox
run's results. It is the reproducible artifact for auditing a backtest or replaying it
downstream.

## Operations

`Portfolio Manager → Open a basket → Operations`

An **operation** invests a basket of validated portfolios through your brokerage
account and executes the strategy in real time. From this point on, Fintela watches
positions, logs orders, and surfaces P&L — and you can pause or stop the operation with
one click.

> [!NOTE]
> Before starting an operation, promote a portfolio into a basket and connect your
> brokerage under **Account settings → Broker connections**. See
> [Live trading](/docs/live-trading) for the full workflow.
