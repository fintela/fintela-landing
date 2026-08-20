---
title: Metrics Reference
section: Analysis & Portfolios
sectionOrder: 4
order: 6
published: true
updated: 2026-08-18
summary: Every portfolio metric Fintela computes, with its exact key, definition and where it appears.
keywords: metrics, sharpe, sortino, calmar, cagr, max drawdown, win rate, volatility, definitions, reference, keys
---

Every number Fintela ranks by, charts, tabulates or optimizes toward comes from one compiled catalog
of **35 metrics** — 26 computed from a portfolio's own equity curve and closed trades, and 9
computed against a benchmark. Each entry carries a stable `metric_name`, a unit, a direction and a
one-line description, and that entry is what every surface reads: the metric picker, the comparison
tables, the fitness objective list, the Markets screener and the API's `metric_name` parameter all
resolve against the same list. This page is the definitive source for what each one means and how it
is computed. Where the code does not pin a convention, that is said rather than guessed.

## What a metric is here

A metric is an entry in `Metrics::catalog()` or `Metrics::benchmark_catalog()`
(`crates/portfolio-model/src/portfolio_metrics.rs`) plus, per organization, any promoted fitness
function. Every entry carries six fields:

| Field | Values | What it controls |
|---|---|---|
| `name` | e.g. `sharpe_ratio` | The key used everywhere — the `metric_name` column, the `metric_name` query parameter, the frontend's metric maps. |
| `unit` | `%`, `annualized %`, `return %`, `ratio`, `dimensionless`, `days`, `score` | How the value is rendered (see [Display and formatting](#display-and-formatting)). |
| `direction` | `higher_is_better`, `lower_is_better`, `informational` | Default sort order, heat colouring, and whether the metric can be an optimization objective at all. |
| `category` | `return`, `risk`, `risk_adjusted`, `recovery`, `distribution`, `trade`, `optimizer`, `benchmark` | Grouping in pickers. Note the UI relabels some of these — see [Display and formatting](#display-and-formatting). |
| `requires_normalization` | boolean | True when the raw value grows with the length of the period, so comparing it across stages of unequal length is misleading. True for exactly three metrics: `total_return`, `max_drawdown_duration`, `recovery_factor`. |
| `applies_to_tickers` | boolean | Whether the metric is meaningful for a plain price series. False for `omega_ratio`, `profit_factor`, `win_rate`, `payoff_ratio`, `trade_win_rate`, `trade_profit_factor`, `avg_trade_duration` and `expectancy`. |

### The catalog endpoint

```http
GET /metrics
```

Returns a flat array — the 26 core entries, then the 9 benchmark entries, then the organization's
promoted fitness metrics in name order. Requires the `portfolios:read` permission, the same one that
guards the whole portfolios surface.

| Response field | Type | Notes |
|---|---|---|
| `name` | string | The canonical key. |
| `unit` | string | As above. |
| `direction` | string | `higher_is_better` / `lower_is_better` / `informational`. |
| `description` | string | The one-line definition quoted in the tables below. |
| `category` | string | As above. |
| `applies_to_tickers` | boolean | `false` for every promoted metric. |
| `is_custom` | boolean | `true` only for a promoted fitness function. |
| `fitness_id` | integer or null | `developers.fitness.id` behind a custom metric; `null` for built-ins. |
| `display_label` | string or null | `null` for built-ins, whose labels the client derives from the name. |

If the caller's organization cannot be resolved, the endpoint degrades to the built-ins rather than
failing — a picker missing its custom entries is still usable.

## Core catalog

The 26 entries of `Metrics::catalog()`. **Label** is what the UI renders: for a built-in it is
derived from the key by replacing underscores with spaces and title-casing each word, so it is
predictable but not always pretty (`var_95` reads `Var 95`). **Definition** is the catalog
`description`, verbatim — it is also the body of the tooltip behind the info icon next to any metric
label.

| Key | Label | Unit | Direction | Definition |
|---|---|---|---|---|
| `total_return` | `Total Return` | `%` | higher | Total gain or loss over the period as a percentage of starting capital. |
| `compound_annual_growth_rate` | `Compound Annual Growth Rate` | `annualized %` | higher | Annualized growth rate that would yield the same total return if compounded uniformly each year. |
| `volatility` | `Volatility` | `annualized %` | lower | Annualized standard deviation of returns. Measures how much returns fluctuate. |
| `max_drawdown` | `Max Drawdown` | `%` | lower | Largest peak-to-trough decline. Represents the worst-case loss scenario during the period. |
| `average_drawdown` | `Average Drawdown` | `%` | lower | Mean depth of all drawdowns recorded during the period. |
| `max_drawdown_duration` | `Max Drawdown Duration` | `days` | lower | Number of TRADING days spent below the previous peak during the deepest drawdown. Counted in bars, so a calendar span is roughly a third longer. |
| `ulcer_index` | `Ulcer Index` | `%` | lower | Root mean square of daily drawdowns. Penalizes deep and prolonged drawdowns more than simple volatility. |
| `var_95` | `Var 95` | `annualized %` | lower | Value at Risk at 95% confidence, annualized: the loss the worst 5% of days imply over a year. |
| `cvar_95` | `Cvar 95` | `annualized %` | lower | Conditional Value at Risk, annualized: average loss on the worst 5% of days. More conservative than VaR. |
| `sharpe_ratio` | `Sharpe Ratio` | `ratio` | higher | Excess return per unit of total risk (volatility). Values > 1 are acceptable; > 2 are strong. |
| `sortino_ratio` | `Sortino Ratio` | `ratio` | higher | Like Sharpe but penalizes only downside volatility. More relevant for asymmetric strategies. |
| `calmar_ratio` | `Calmar Ratio` | `ratio` | higher | CAGR divided by max drawdown. Highly sensitive to extreme drawdowns. |
| `martin_ratio` | `Martin Ratio` | `ratio` | higher | CAGR divided by Ulcer Index. More robust variant of Calmar for prolonged drawdowns. |
| `omega_ratio` | `Omega Ratio` | `ratio` | higher | Ratio of positive to negative returns relative to a threshold. Values > 1 mean gains outweigh losses. |
| `profit_factor` | `Profit Factor` | `ratio` | higher | Sum of positive returns divided by the absolute sum of negative returns. |
| `recovery_factor` | `Recovery Factor` | `ratio` | higher | Total return divided by max drawdown. Indicates how much return was generated per unit of peak drawdown risk. |
| `skewness` | `Skewness` | `dimensionless` | higher | Asymmetry of the return distribution. Positive values indicate more extreme positive outliers. |
| `excess_kurtosis` | `Excess Kurtosis` | `dimensionless` | **lower** | Tail heaviness relative to a normal distribution. High values indicate more frequent extreme events. |
| `tail_ratio` | `Tail Ratio` | `ratio` | higher | 95th percentile divided by the absolute 5th percentile of returns. Measures gain-to-loss asymmetry in the tails. |
| `win_rate` | `Win Rate` | `%` | higher | Percentage of days with a positive return. |
| `payoff_ratio` | `Payoff Ratio` | `ratio` | higher | Average winning day return divided by the average losing day return (absolute value). |
| `trade_win_rate` | `Trade Win Rate` | `%` | higher | Percentage of closed trades that ended in profit. |
| `trade_profit_factor` | `Trade Profit Factor` | `ratio` | higher | Profit factor across individual trades: total profit from winning trades divided by total loss from losing trades. |
| `avg_trade_duration` | `Avg Trade Duration` | `days` | **lower** | Average holding period of closed trades in days. |
| `expectancy` | `Expectancy` | `return %` | higher | Average expected return per trade as a percentage of capital. |
| `fitness` | `Fitness` | `score` | higher | Optimizer fitness score used during strategy search. Higher means better alignment with the configured objective. |

> [!WARNING] `win_rate` and `trade_win_rate` are different statistics
> `win_rate` counts **days** with a positive return. `trade_win_rate` counts **closed round-trips**
> that ended in profit. The same split applies to `profit_factor` (daily returns) versus
> `trade_profit_factor` (per-trade). `payoff_ratio` is per-day and has no per-trade twin in this
> catalog.

### How each core metric is computed

Everything except the four trade aggregates and `fitness` is reduced from the portfolio's daily
equity (NAV) series. Before any reducer runs, the series is preprocessed identically on every
surface: it is split on its missing-value pattern with each segment's boundaries trimmed, then
zeros become missing and values are forward-filled up to the last real observation. A non-finite
result is dropped, so the metric reports "no value" rather than a nonsense number.

Daily return is `r_t = (P_t − P_{t−1}) / P_{t−1}`; a zero denominator yields a missing return.

| Key | Convention |
|---|---|
| `total_return` | `last / first − 1` over the period's NAV. |
| `compound_annual_growth_rate` | `(last / first)^(1 / years) − 1`, where `years` is the **calendar** span between the period's first and last NAV date divided by 365.25 — the same derivation for named stages, for `overall` and for the nine rolling windows. |
| `volatility` | Sample standard deviation (denominator `n − 1`) of daily returns, multiplied by `√252`. Needs at least 3 NAV points. |
| `max_drawdown` | `max over t of (running_peak − P_t) / running_peak`. Reported as a **positive** fraction. |
| `average_drawdown` | Mean over every observation of `(peak_t − P_t) / peak_t`. |
| `max_drawdown_duration` | Longest run of consecutive observations strictly below the running peak, counted in **bars** — trading days on a daily series, never calendar days. |
| `ulcer_index` | `sqrt(mean of squared drawdown ratios)` over every observation. |
| `var_95` | Negated 5th percentile of daily returns (linear-interpolation quantile, numpy's default), multiplied by `√252`. Needs at least 20 finite daily returns, otherwise no value. |
| `cvar_95` | Negated mean of the daily returns at or below the 5th percentile, multiplied by `√252`. Needs at least 20 finite daily returns. |
| `sharpe_ratio` | `mean(excess daily return) / sample sd (n − 1) × √252`. The stored metric uses a **risk-free rate of zero**; see [Risk-free-rate variants](#risk-free-rate-variants). Needs at least 2 NAV points. |
| `sortino_ratio` | `mean(excess daily return) / downside deviation × √252`, where downside deviation is the root-mean-square of `min(excess return, 0)` over **all** observations — a population denominator `n`, not `n − 1`. |
| `calmar_ratio` | `compound_annual_growth_rate / max_drawdown`. No value when max drawdown is exactly 0. |
| `martin_ratio` | `compound_annual_growth_rate / ulcer_index`. No value when the Ulcer Index is exactly 0. |
| `omega_ratio` | `Σ max(r − τ, 0) / Σ max(τ − r, 0)` with the threshold `τ` fixed at **0**. |
| `profit_factor` | `Σ positive daily returns / abs(Σ negative daily returns)`. No value when there are no losing days. |
| `recovery_factor` | `total_return / max_drawdown`, **without** an absolute value — a losing portfolio therefore reports a negative recovery factor rather than ranking alongside a winning one. |
| `skewness` | Third central moment (population, `÷ n`) divided by the cube of the sample standard deviation (`n − 1`). Needs at least 3 returns. |
| `excess_kurtosis` | Fourth central moment (population, `÷ n`) divided by the square of the sample variance (`n − 1`), minus 3. Needs at least 4 returns. |
| `tail_ratio` | 95th percentile divided by the absolute 5th percentile of daily returns. Needs at least 20 finite returns. |
| `win_rate` | Share of daily returns strictly greater than 0. |
| `payoff_ratio` | Mean winning daily return divided by the absolute mean losing daily return. Needs at least one of each. |
| `trade_win_rate` | Closed trades whose return percentage is strictly greater than 0, divided by all closed trades. |
| `trade_profit_factor` | Sum of winning trade return percentages divided by the absolute sum of losing ones. A trade whose return is exactly 0 counts as a **loser**. No value when there are no losers. |
| `avg_trade_duration` | Mean **calendar** days from entry to exit across closed trades. Contrast `max_drawdown_duration`, which is in trading days. |
| `expectancy` | `trade_win_rate × mean winning trade return + (1 − trade_win_rate) × mean losing trade return`, over closed trades. Needs at least one winner and one loser. |
| `fitness` | Not reduced from equity. It is whatever the study's fitness objective returned for the trial, written by the optimizer at the `overall` stage. |

> [!CAUTION] Volatility, VaR and CVaR are annualized server-side
> The reducers emit daily numbers; the `√252` lift is applied once, where the metric set is
> assembled, because Sharpe sitting beside them in the same table already is annualized. Never
> re-annualize these three in your own analysis of a value the API returned.

> [!NOTE] Trade aggregates are grafted on, not derived from the curve
> An equity curve records what the account was worth each day and says nothing about the round-trips
> that produced it. `trade_win_rate`, `trade_profit_factor`, `avg_trade_duration` and `expectancy`
> are computed from closed trades and merged into the metric set afterwards, so any surface that
> only has a price series leaves all four empty. Trades are attributed to a stage by **exit date**,
> which is what makes the per-stage counts sum to the whole-life count with nothing double-counted.

## Benchmark-relative catalog

Nine metrics that require a benchmark series. They are computed from two pre-aligned daily-return
series and need at least **3** finite paired observations; below that every one of the nine is null.

| Key | Label | Unit | Direction | Definition |
|---|---|---|---|---|
| `alpha` | `Alpha` | `annualized %` | higher | Annualized return attributable to the strategy beyond what the benchmark explains. |
| `beta` | `Beta` | `ratio` | **informational** | Sensitivity of strategy returns to benchmark movements. Beta > 1 amplifies market moves. |
| `correlation` | `Correlation` | `ratio` | **informational** | Pearson correlation between strategy and benchmark daily returns. |
| `information_ratio` | `Information Ratio` | `ratio` | higher | Excess return over benchmark per unit of tracking error. Measures consistency of outperformance. |
| `treynor_ratio` | `Treynor Ratio` | `ratio` | higher | Excess return per unit of systematic risk (beta). Rewards outperformance without market exposure. |
| `up_capture` | `Up Capture` | `%` | higher | Fraction of benchmark gains captured by the strategy during up markets. |
| `down_capture` | `Down Capture` | `%` | **lower** | Fraction of benchmark losses suffered by the strategy during down markets. Lower is better. |
| `tracking_error` | `Tracking Error` | `annualized %` | lower | Volatility of the return difference against the benchmark — how far the strategy wanders from it. The denominator of the information ratio. |
| `r_squared` | `R Squared` | `ratio` | **informational** | Share of the strategy's variance the benchmark explains (correlation squared, 0 to 1). High means it moves with the market; low means its risk comes from somewhere else. |

### How each benchmark metric is computed

`r_p` is the portfolio's daily return, `r_b` the benchmark's, `rf_daily` the annual risk-free rate
divided by 252 (zero for the base perspective). Covariance and variance use the sample denominator
`n − 1`.

| Key | Convention |
|---|---|
| `beta` | `Cov(r_p, r_b) / Var(r_b)`. No value when the benchmark's variance is 0. |
| `alpha` | Jensen's alpha, annualized: `(mean_p − rf_daily) × 252 − beta × ((mean_b − rf_daily) × 252)`. Requires a beta. |
| `information_ratio` | `mean(r_p − r_b) × √252 / sd(r_p − r_b)`. No value when the active return never varies. |
| `treynor_ratio` | `(mean_p − rf_daily) × 252 / beta`. No value when beta is exactly 0. |
| `up_capture` | Mean `r_p` over days where `r_b > 0`, divided by the mean `r_b` on those same days. |
| `down_capture` | Mean `r_p` over days where `r_b < 0`, divided by the mean `r_b` on those same days. |
| `correlation` | `Cov(r_p, r_b) / (sd_p × sd_b)`. |
| `tracking_error` | `sd(r_p − r_b) × √252`. Zero is a **real** answer here, not a missing one — a portfolio whose active return never varies tracks the benchmark exactly. |
| `r_squared` | `correlation²`, derived from the correlation above rather than recomputed, so the two can never disagree about a degenerate sample. |

> [!NOTE] `beta`, `correlation` and `r_squared` carry no direction
> Their direction is `informational`, deliberately. A high R² is the goal for an index replicator and
> a red flag for a market-neutral book, so the platform will not claim a direction on your behalf.
> One consequence: none of the three can be an optimization objective — Optuna requires a direction.

## Risk-free-rate variants

Four metrics depend on the risk-free rate. Fintela persists both perspectives side by side: the
catalog metric at **rf = 0**, and a second value recomputed with the real annualized rate as of the
period's end date, under a `_rf`-suffixed name.

| Variant key | Base metric | Rendered label |
|---|---|---|
| `sharpe_ratio_rf` | `sharpe_ratio` | `Sharpe Ratio (RF)` |
| `sortino_ratio_rf` | `sortino_ratio` | `Sortino Ratio (RF)` |
| `alpha_rf` | `alpha` | `Alpha (RF)` |
| `treynor_ratio_rf` | `treynor_ratio` | `Treynor Ratio (RF)` |

The rate comes from the `UST_3M` series, read as-of the period's end date, so a stage that closed
years ago keeps the rate that was current then. Until that series is ingested the `_rf` rows are
simply absent and the rf = 0 figures stand alone. In the tables that show them, `_rf` rows appear as
their own rows and inherit the base metric's unit, direction and tooltip.

> [!WARNING] `_rf` names are not valid `metric_name` values
> The API's metric-name gate accepts only the 35 catalog names plus your organization's
> `custom:` metrics. A request carrying `metric_name=sharpe_ratio_rf` is rejected. The `_rf` values
> are readable as rows of a metrics response, not as a ranking key.

## Custom metrics from promoted fitness functions

Any non-built-in fitness function can be promoted to a first-class metric for one organization. See
[fitness functions](/docs/fitness-functions) for the promotion flow; what matters here is how the
result behaves as a metric.

| Property | Rule |
|---|---|
| Wire name | Always `custom:<slug>`. The prefix is load-bearing: built-in and custom names share one flat namespace, so without it a function named `sharpe_ratio` would shadow the built-in for the whole organization. |
| Slug rules | Lowercase letters, digits and underscores only; non-empty; at most 110 characters; must not already carry the `custom:` prefix. |
| Label | Server-supplied `display_label`. The UI must use it — the built-in derivation would turn `custom:my_score` into `Custom:My Score`. |
| Description | Auto-generated as `Custom metric from the fitness function "<display_label>".` |
| `direction` | One of the same three strings, defaulting to `higher_is_better` (a fitness function is maximized). |
| `applies_to_tickers` | Always `false` — a fitness function scores a simulation period, which a bare price series does not have. |
| Parameters | Every declared hyperparameter must be pinned to one concrete value at promotion time, or the number would not be comparable across portfolios. |
| Computed at | `train`, `validation` and `out_of_sample` only. `real_life_performance` is deliberately excluded because its end date moves every run, which would make the score change meaning day to day. |
| Cadence | Scored daily by the metrics worker, last in the run. A failure there degrades that column but does not fail the run. |

Built-in fitness objectives **cannot** be promoted — they already are metrics. Attempting it returns
`400` with `Built-in fitness objectives are already metrics and cannot be promoted`.

Once promoted, a custom metric is selectable, sortable and rankable exactly like a built-in: it
appears in the same `GET /metrics` list (flagged `is_custom: true`) and is a valid `metric_name`
for the whole organization.

## Stages and windows

The same metric has a different value for every period it is measured over. A metric is always read
at one of two kinds of period.

**Named stages** — the study's own date windows:

| Stage | Bounds | Present when | Stored in |
|---|---|---|---|
| `train` | The study's configured training dates | Always | `developers.portfolio_metrics` |
| `validation` | The study's configured validation dates | Always | `developers.portfolio_metrics` |
| `out_of_sample` | The study's configured out-of-sample dates | Only when both OOS dates are set | `developers.portfolio_metrics` |
| `real_life_performance` | The day after the last configured period through the last equity bar | Only when equity has genuinely advanced past the last configured period | `developers.portfolio_metrics` |
| `overall` | The whole curve, not date-anchored | Always | `public.entity_metrics` (`window_type = 'overall'`) — **except** `fitness`, which lives in `developers.portfolio_metrics` at stage `overall` |

Train and validation report the study's **configured** timeframe and are not clipped to the data
actually available.

**Rolling windows** — nine periods anchored to the curve's own last equity date for a portfolio (and
to today for a ticker), all stored in `public.entity_metrics` under `window_type`:

| `window_type` | Lookback |
|---|---|
| `mtd` | First day of the anchor's calendar month |
| `qtd` | First day of the anchor's calendar quarter |
| `ytd` | 1 January of the anchor's year |
| `trailing_1m` | anchor − 30 days |
| `trailing_3m` | anchor − 90 days |
| `trailing_6m` | anchor − 180 days |
| `trailing_1y` | anchor − 365 days |
| `trailing_3y` | anchor − 1095 days |
| `trailing_5y` | anchor − 1825 days |

Both tables are row-per-metric: `(portfolio_id, stage, metric_name, value)` and
`(entity_type, entity_id, window_type, metric_name, value)`. That is why adding a metric to the
catalog needs no database migration.

Two stage vocabularies are persisted, because the writers disagree on spelling: the optimizer (which
writes `out_of_sample` but never a real-life row) and the metrics worker's benchmark-relative pass
use the long names, while the metrics worker's regular stage pass writes `oos` and `rlp`. Both are
normalized to the long names before they reach the wire, so a client only ever sees `out_of_sample`
and `real_life_performance`.

> [!NOTE] Two out-of-sample rows can coexist, and they differ
> For the same portfolio and metric, the optimizer's row (measured during the trial simulation) and
> the metrics worker's row (recomputed from the persisted equity) both genuinely exist and carry
> different values. Which one a reader shows depends on the reader: the study optimization-history
> queries prefer the canonical spelling, so `out_of_sample` wins over `oos`, while the stage ranking
> endpoint deliberately keeps the best value per portfolio across both spellings.

### Which stages a study actually has

Not every stage exists for every study, and not every metric has been computed for every stage. Ask:

```http
GET /portfolios/metrics/availability?study_id=42
```

The response maps each `metric_name` to the list of stages that actually carry a value for that
study. The dashboard's metric picker uses exactly this to disable a metric with the caption
**`No data for this study`**, and to show the softer, still-selectable hint
**`No data in the selected stage`**.

### Who writes the values, and when

| Writer | Writes | Cadence |
|---|---|---|
| The optimizer, at trial registration | The named stages, the `overall` row, `fitness` at `overall`, and the nine rolling windows | Once, when the trial's equity is registered |
| The portfolio updater | The same rolling windows, refreshed, plus `fitness` at `real_life_performance` and at `overall` and the benchmark-relative rows for both | On every real-life-performance advance |
| `metrics-updater` | The named stages, the portfolio `overall` window, and the daily custom-metric pass | Once a day, `cron(0 13 * * ? *)` |

`metrics-updater` deliberately does **not** write the portfolio rolling windows: they belong to
whoever wrote the equity they summarize, so the two writers cannot disagree.

> [!CAUTION] Metrics do not update live
> There is no polling, websocket or auto-refresh on any portfolio surface. Values are read from
> storage and cached client-side; a metric recomputed by the daily worker appears on your next
> navigation or reload, not while you watch.

## Where each metric appears

| Surface | Metrics shown |
|---|---|
| **Metric picker** on the [Portfolios Dashboard](/docs/portfolios-dashboard) and [Optimization Dashboard](/docs/optimization-dashboard) | Every name from `GET /metrics`. Any name containing `fitness` is pinned above a divider; the rest follow. |
| **Ranking card stat strip** | Exactly three: `sharpe_ratio` (`Sharpe`), `alpha` (`Alpha`), `beta` (`Beta`). |
| **Comparison KPI strip** | `total_return` (Leader, Dispersion), `sharpe_ratio` (Median Sharpe), `max_drawdown` (Worst Drawdown). |
| **Summary KPI cards** on the Performance tab | Seven, each at a preferred stage: `fitness` (overall), `sharpe_ratio` (OOS), `max_drawdown` (OOS), `compound_annual_growth_rate` (overall), `total_return` (overall), `win_rate` (OOS), `profit_factor` (overall). |
| **Metrics scorecard / detail table** on the Performance tab | Every metric persisted for that portfolio, plus benchmark rows and `_rf` rows, one column per active stage plus a `Window` column. |
| **`Metrics Comparison` heatmap** | Everything the portfolio has, minus the 14 advanced metrics in the next row. |
| **`Advanced Metrics`** accordion | Exactly 14: `skewness`, `excess_kurtosis`, `tail_ratio`, `up_capture`, `down_capture`, `information_ratio`, `treynor_ratio`, `beta`, `alpha`, `correlation`, `payoff_ratio`, `recovery_factor`, `omega_ratio`, `martin_ratio`. |
| **Headline figures** on the Profile tab | `total_return` and `compound_annual_growth_rate` at `overall`; `max_drawdown` and `sharpe_ratio` at `out_of_sample`, falling back to `overall`. |
| **Metric matrix** in the [Portfolio Manager](/docs/portfolio-manager) | The 25 value-bearing core names minus the four trade aggregates — 21 columns — plus the 9 benchmark metrics when a benchmark is requested. `fitness` is absent: the equity path never computes it. |
| **Indicators screener** in [Market](/docs/market) and the Data Explorer inspection drawer | Only names with `applies_to_tickers: true`. |
| **Fitness objective picker** | The 27 built-in objectives listed below. |

Per-metric definitions do not vary by surface — the same tooltip, unit and direction follow the
metric everywhere, because every surface reads them off the one catalog. For what each screen does
with them, see [portfolio detail](/docs/portfolio-detail) and
[analyzing results](/docs/analyzing-results).

## Display and formatting

How a value is rendered is derived from its `unit`, so there is one answer rather than a per-screen
opinion:

| `unit` | Rendering | Applies to |
|---|---|---|
| `days` | Whole number with a `d` suffix | `max_drawdown_duration`, `avg_trade_duration` |
| Anything containing `%` | A 0–1 fraction shown ×100 with a `%` suffix, 1 decimal by default | `%`, `annualized %`, `return %` metrics |
| Everything else (`ratio`, `dimensionless`, `score`) | A plain number, 3 decimals by default, **never** ×100 | Sharpe, Sortino, Calmar, Martin, Omega, profit factor, payoff ratio, recovery factor, tail ratio, skewness, excess kurtosis, beta, correlation, R², information ratio, Treynor, and `fitness` |

The percent set is exactly: `total_return`, `compound_annual_growth_rate`, `alpha`, `expectancy`,
`max_drawdown`, `average_drawdown`, `ulcer_index`, `volatility`, `win_rate`, `trade_win_rate`,
`var_95`, `cvar_95`, `up_capture`, `down_capture`, `tracking_error`. `beta`, `correlation` and
`r_squared` are deliberately excluded — they are quoted as 0-to-1 figures, not percentages.

Category labels in the UI do not match the catalog's `category` field one for one. The
`Metrics Comparison` heatmap — the one surface that groups rows by category — uses `Performance`,
`Risk`, `Risk-Adjusted`, `Distribution`, `Trade`, `Benchmark` and an `Other` bucket for anything
unmapped, and files several metrics differently from the catalog: `fitness` and `win_rate` under
`Performance`, `recovery_factor` and `payoff_ratio` under `Risk-Adjusted`. The metric picker does
not group by category at all — it pins the fitness names above a divider and lists the rest below.

Hovering the info icon beside any metric label shows the label, the catalog description, `Unit:`
followed by the raw unit string, and one of `↑ Higher is better`, `↓ Lower is better` or
`— Informational`.

## Using a metric name in the API

Every endpoint that ranks or filters takes `metric_name` and validates it against the catalog plus
your organization's promoted metrics.

```http
GET /portfolios/stage/n_top?study_id=42&stage=out_of_sample&metric_name=sharpe_ratio&n_top=10&asc=false
```

| Failure | Status | Message |
|---|---|---|
| Name is not a catalog entry and not one of your organization's custom metrics | **406** | `Unknown metric: '<name>'` |
| `stage` is not one of the 14 accepted values | **406** | `Not valid stage found` |
| `study_id` is not visible to your organization | **406** | `Not valid study id found` |

The accepted `stage` values are the five named stages plus the nine rolling windows listed above.
Ranking endpoints that take weighted timeframes reject weights that do not sum to 1.0.

To read stored values rather than a ranking:

```http
GET /portfolios/metrics?portfolio_ids=1201,1202
```

The response is keyed `portfolio_id → stage → metric_name → value`, and carries whatever is stored —
including benchmark and `_rf` rows. The public developer API uses the same canonical names under
`include=metrics`. See [trials and portfolios](/docs/api-trials-portfolios) and
[API errors](/docs/api-errors).

> [!NOTE] The picker id in a URL is not the metric key
> `?metric=` on the dashboards is a 1-based position in the alphabetically sorted list of metric
> names, not a catalog id. It shifts whenever a metric is added to the catalog or your organization
> promotes one, so a `?metric=7` copied from a screenshot is not a durable reference. The API's
> `metric_name` is.

## Metrics as optimization objectives

A study can optimize a built-in metric directly, without writing any code, by selecting one of the
**27** platform-seeded `BUILTIN` fitness objectives. Each one is named after the metric it scores and
carries that metric's direction.

Available as objectives — every core metric except the exclusions below, plus six benchmark ones:

`total_return`, `compound_annual_growth_rate`, `volatility`, `max_drawdown`, `average_drawdown`,
`max_drawdown_duration`, `ulcer_index`, `var_95`, `cvar_95`, `sharpe_ratio`, `sortino_ratio`,
`calmar_ratio`, `martin_ratio`, `omega_ratio`, `profit_factor`, `recovery_factor`, `skewness`,
`excess_kurtosis`, `tail_ratio`, `win_rate`, `payoff_ratio`, `alpha`, `information_ratio`,
`treynor_ratio`, `up_capture`, `down_capture`, `tracking_error`.

| Not available as an objective | Why |
|---|---|
| `trade_win_rate`, `trade_profit_factor`, `avg_trade_duration`, `expectancy` | Not derivable from the equity series the objective is handed. |
| `beta`, `correlation`, `r_squared` | Direction is `informational`; the optimizer requires a direction. |
| `fitness` | It is the objective's own output, not an objective. |

The six benchmark-relative objectives require a benchmark on the study. Launching one without a
benchmark is blocked with the message *"This study optimizes `<metric>`, which is measured against a
benchmark, but no benchmark is set. Choose one, or optimize a metric that does not need a
baseline."* Only built-in objectives are gated this way — a user-written fitness function may
compute alpha however it likes. See [studies](/docs/studies) for where the benchmark is set.

> [!WARNING] Minimizing `tracking_error` alone converges on holding the benchmark
> That is the right answer for an index replicator and the wrong one for anything with a thesis.
> Pair it with a return objective unless replication is the goal.

## What is not a metric

Three families of numbers look like catalog metrics and are not. Keep them apart.

```text
  catalog metric            rolling curve series        robustness statistic
  ───────────────           ────────────────────        ────────────────────
  one value per             one value per DAY,          one value per portfolio
  (portfolio, period)       over a sliding window       or per study
  from Metrics::catalog()   from /portfolios/*_vector   from the overfitting tables
  e.g. sharpe_ratio         e.g. the Sharpe chart       e.g. DSR, PSR, PBO, SR₀
```

- **Rolling curve series.** The Drawdown, Volatility, Rate of Change and Sharpe charts plot
  `equity`, `drawdown`, `rate_of_change`, `sharpe` and `volatility` series fetched per portfolio.
  The rolling **Sharpe** in particular is a deliberately different formula from the `sharpe_ratio`
  metric: window rate-of-change over intra-window volatility, **unannualized**, with no risk-free
  term. A chart reading 0.4 and a metric reading 1.8 are not in conflict. See
  [visualizations](/docs/visualizations).
- **Robustness statistics.** Deflated Sharpe, Probabilistic Sharpe, the luck threshold SR₀, the
  degradation z-scores and the study-level PBO are computed once at study finalization into their
  own tables. They are not catalog metrics, are not selectable in the metric picker, and cannot be
  used as a `metric_name`.
- **Trade columns.** The per-trade `Return`, `P&L`, `MFE` and `MAE` columns on the Transactions tab
  are properties of one round-trip, not portfolio metrics.

## Adding a metric to the catalog

Two paths, with very different blast radii.

| Path | Scope | Who can do it | Deploy needed |
|---|---|---|---|
| Promote a fitness function | One organization | Anyone with `fitness:update` | None — one API call |
| Add to the compiled catalog | Every organization | Platform engineering | Yes |

The platform path touches one reducer in `algebra-core`, then six places in
`crates/portfolio-model/src/portfolio_metrics.rs` — the `Metrics` field, `catalog()`, `to_map()`,
`default()` and `zeros()`, the panel reduction, and the single-series `From` impl — then the
frontend's `WindowMetrics` type and the detail table's window-key map. **No database migration**:
both metric tables are row-per-metric. `metrics-updater`, the backend, the simulation engine and the
frontend must be redeployed, and the indicators updater, optimizer and portfolio updater rebuilt
because they bundle the same crate.

A metric missing from `to_map()` is never persisted and never sortable, even if it appears in
`catalog()` — that is the persistence gate, separate from the validation gate `catalog()` provides.
`fitness` is in the catalog but not in `to_map()`, which is exactly why the optimizer writes it by
hand.

> [!NOTE] The internal guide is partly stale
> `docs/adding-a-portfolio-metric.md` sections 5 and 6 point at a zoom-metrics bar that is dead code
> and a summary-cards file that no longer exists. Steps 1 through 4 and the redeploy table are
> current.

## Known drift and gaps

Stated rather than smoothed over, because each one is visible if you look for it.

- **`tracking_error` is missing from the client-side lower-is-better set.** The catalog marks it
  `lower_is_better`; the frontend mirror in `metricsHelpers.ts` lists ten names and does not include
  it. Surfaces that read the server's `direction` field are correct; the ones that consult the local
  set will pick a "best" stage and colour a delta as though higher tracking error were better.
- **The `Trade` group header is untranslated.** The heatmap groups rows by category and looks each
  header up in the locale file. Six of the seven categories have an entry; `Trade` has none, so it
  falls back to the literal English string in every language.
- **`fitness` has no `Window` value.** The equity-zoom Window column has no mapping for it, so that
  cell always renders an em dash even when the metric has values at every stage.
- **Rolling-window rows can be missing for old studies.** The nine portfolio windows are written
  only by the two writers of the equity curve. A study whose windows predate that arrangement has
  named-stage values but no window values, and ranking by a rolling window will find nothing for it.
