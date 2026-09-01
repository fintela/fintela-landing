---
title: Metrics Reference
section: Analysis & Portfolios
sectionOrder: 4
order: 6
published: true
updated: 2026-09-01
summary: Every performance metric Fintela calculates, explained in plain language — what each one measures, how to read it, and where it shows up in the app.
keywords: metrics, sharpe ratio, sortino ratio, calmar ratio, cagr, max drawdown, win rate, volatility, definitions, reference
---

Every number Fintela ranks by, charts, tabulates, or lets you optimize toward comes from one shared
list of **35 metrics** — 26 calculated from a portfolio's own equity curve and closed trades, and 9
calculated against a benchmark. Each metric has a name, a unit, a direction (whether higher or lower
is better), and a plain-language definition, and every screen in Fintela — the metric picker,
comparison tables, the objective list you choose from when setting up a search, the Market screener,
and anything you pull through the API — reads from this same list. This page is the definitive
source for what each metric means and how it's calculated.

## What a metric is here

Every metric in Fintela — whether it's one of the 35 built in, or a custom metric your organization
has promoted from a fitness function — carries the same properties. Knowing them makes every table,
tooltip, and picker in the product easier to read.

| Property | What it means | Where you'll notice it |
|---|---|---|
| Name | The short identifier for the metric (e.g. `sharpe_ratio`). It's what you select in the metric picker and filters, and — if you pull data into your own tools — the identifier you'd use there too. | Metric picker, comparison tables, API |
| Unit | How the value is expressed: a percentage, an annualized percentage, a ratio, a plain number, or a count of days. Determines how it's formatted — see [Display and formatting](#display-and-formatting). | Every table and card |
| Direction | Whether a higher or lower value is better — or whether the metric is purely informational with no "better" direction at all. Drives sort order, colour-coding, and whether the metric can be chosen as a search objective. | Sort order, heat colours, info tooltip |
| Category | A rough grouping — return, risk, risk-adjusted, recovery, distribution, trade, or benchmark — used to organize the metric picker. The UI labels a few of these slightly differently; see [Display and formatting](#display-and-formatting). | Metric picker, heatmap |
| Needs normalization | True for three metrics whose raw value naturally grows the longer the period you measure, which makes comparing them across stages of very different lengths misleading. | `total_return`, `max_drawdown_duration`, `recovery_factor` |
| Works on a plain ticker | Whether the metric makes sense for a raw price series with no trades attached to it, not just a portfolio. It's `false` for a handful of trade-based metrics — see below. | Market screener, Data Explorer |

> [!TIP] Pulling this same list into your own tools
> If you use the read-only [Developer API](/docs/api-trials-portfolios) to bring your results into
> your own dashboards, the same reference list — names, units, directions, definitions, and any
> custom metrics your organization has promoted — is available there too, so your own tooling never
> drifts out of sync with what you see in Fintela.

## Portfolio metrics

These are the 26 metrics calculated from a portfolio's own performance — its equity curve and its
closed trades. **Label** is what you'll actually see in the app: for a built-in metric it's generated
from the name (underscores become spaces, each word capitalized), so it's predictable but not always
polished — `var_95` becomes `Var 95`. **Definition** is the exact text shown when you hover the info
icon next to any metric label.

| Key | Label | Unit | Direction | Definition |
|---|---|---|---|---|
| `total_return` | `Total Return` | `%` | higher | Total gain or loss over the period as a percentage of starting capital. |
| `compound_annual_growth_rate` | `Compound Annual Growth Rate` | `annualized %` | higher | Annualized growth rate that would yield the same total return if compounded uniformly each year. |
| `volatility` | `Volatility` | `annualized %` | lower | Annualized standard deviation of returns. Measures how much returns fluctuate. |
| `max_drawdown` | `Max Drawdown` | `%` | lower | Largest peak-to-trough decline. Represents the worst-case loss scenario during the period. |
| `average_drawdown` | `Average Drawdown` | `%` | lower | Mean depth of all drawdowns recorded during the period. |
| `max_drawdown_duration` | `Max Drawdown Duration` | `days` | lower | Number of trading days spent below the previous peak during the deepest drawdown. Counted in trading days, so the calendar span is roughly a third longer. |
| `ulcer_index` | `Ulcer Index` | `%` | lower | Root mean square of daily drawdowns. Penalizes deep and prolonged drawdowns more than simple volatility. |
| `var_95` | `Var 95` | `annualized %` | lower | Value at Risk at 95% confidence, annualized: the loss the worst 5% of days imply over a year. |
| `cvar_95` | `Cvar 95` | `annualized %` | lower | Conditional Value at Risk, annualized: average loss on the worst 5% of days. More conservative than VaR. |
| `sharpe_ratio` | `Sharpe Ratio` | `ratio` | higher | Excess return per unit of total risk (volatility). Values above 1 are acceptable; above 2 are strong. |
| `sortino_ratio` | `Sortino Ratio` | `ratio` | higher | Like Sharpe but penalizes only downside volatility. More relevant for asymmetric strategies. |
| `calmar_ratio` | `Calmar Ratio` | `ratio` | higher | CAGR divided by max drawdown. Highly sensitive to extreme drawdowns. |
| `martin_ratio` | `Martin Ratio` | `ratio` | higher | CAGR divided by Ulcer Index. A more robust variant of Calmar for prolonged drawdowns. |
| `omega_ratio` | `Omega Ratio` | `ratio` | higher | Ratio of positive to negative returns relative to a threshold. Values above 1 mean gains outweigh losses. |
| `profit_factor` | `Profit Factor` | `ratio` | higher | Sum of positive returns divided by the absolute sum of negative returns. |
| `recovery_factor` | `Recovery Factor` | `ratio` | higher | Total return divided by max drawdown. Indicates how much return was generated per unit of peak drawdown risk. |
| `skewness` | `Skewness` | `dimensionless` | higher | Asymmetry of the return distribution. Positive values indicate more extreme positive outliers. |
| `excess_kurtosis` | `Excess Kurtosis` | `dimensionless` | **lower** | Tail heaviness relative to a normal distribution. High values indicate more frequent extreme events. |
| `tail_ratio` | `Tail Ratio` | `ratio` | higher | 95th percentile divided by the absolute 5th percentile of returns. Measures gain-to-loss asymmetry in the tails. |
| `win_rate` | `Win Rate` | `%` | higher | Percentage of days with a positive return. |
| `payoff_ratio` | `Payoff Ratio` | `ratio` | higher | Average winning day return divided by the average losing day return (absolute value). |
| `trade_win_rate` | `Trade Win Rate` | `%` | higher | Percentage of closed trades that ended in profit. |
| `trade_profit_factor` | `Trade Profit Factor` | `ratio` | higher | Profit factor across individual trades: total profit from winning trades divided by total loss from losing trades. |
| `avg_trade_duration` | `Avg Trade Duration` | `days` | **lower** | Average holding period of closed trades, in days. |
| `expectancy` | `Expectancy` | `return %` | higher | Average expected return per trade as a percentage of capital. |
| `fitness` | `Fitness` | `score` | higher | Your search objective's score for this trial. Higher means a better match to what you configured the search to optimize for. |

> [!WARNING] `Win Rate` and `Trade Win Rate` are different statistics
> `Win Rate` counts **days** with a positive return. `Trade Win Rate` counts **closed round-trips**
> that ended in profit. The same split applies to `Profit Factor` (daily returns) versus
> `Trade Profit Factor` (per trade). `Payoff Ratio` is per-day and has no per-trade counterpart in
> this list.

### How each metric is calculated

Everything except the four trade-based metrics and Fitness is calculated from the portfolio's daily
value (NAV) series. That series is cleaned up the same way everywhere in Fintela before any
calculation runs, so the same input always produces the same numbers — and a calculation that can't
produce a sane result reports "no value" rather than a misleading one.

Daily return is `(today's value − yesterday's value) ÷ yesterday's value`; a day with no prior value
to compare against has no return.

| Key | How it's calculated |
|---|---|
| `total_return` | `last value / first value − 1` over the period's NAV. |
| `compound_annual_growth_rate` | `(last / first)^(1 / years) − 1`, where `years` is the **calendar** span between the period's first and last date divided by 365.25 — the same formula for named stages, for the overall period, and for the nine rolling windows. |
| `volatility` | Standard deviation of daily returns, annualized by multiplying by √252 (the typical number of trading days in a year). Needs at least 3 data points. |
| `max_drawdown` | The largest drop from a running peak to a later low, as a **positive** percentage. |
| `average_drawdown` | The average depth below the running peak, across every day in the period. |
| `max_drawdown_duration` | The longest run of consecutive **trading** days spent below the running peak, during the single deepest drawdown. |
| `ulcer_index` | Root mean square of the drawdown depth across every day in the period. |
| `var_95` | The negated 5th-percentile daily return, annualized by multiplying by √252. Needs at least 20 days of return data, otherwise no value is shown. |
| `cvar_95` | The negated average of the daily returns at or below the 5th percentile, annualized. Same 20-day minimum as VaR. |
| `sharpe_ratio` | Average excess daily return divided by the standard deviation of daily returns, annualized. Always calculated with a **0% risk-free rate** — see [Risk-free-rate variants](#risk-free-rate-variants) for the version using the real rate. Needs at least 2 data points. |
| `sortino_ratio` | Like Sharpe, but the denominator only measures the volatility of down days, not all days — so two portfolios with identical Sharpe can have very different Sortino if one's volatility comes mostly from up days. |
| `calmar_ratio` | CAGR divided by Max Drawdown. No value when Max Drawdown is exactly 0. |
| `martin_ratio` | CAGR divided by the Ulcer Index. No value when the Ulcer Index is exactly 0. |
| `omega_ratio` | Sum of gains above a 0% threshold divided by the sum of losses below it. |
| `profit_factor` | Sum of positive daily returns divided by the absolute sum of negative daily returns. No value when there are no losing days. |
| `recovery_factor` | `Total Return / Max Drawdown`, **without** taking an absolute value — so a losing portfolio reports a negative recovery factor rather than a small positive number that looks better than it is. |
| `skewness` | A measure of how lopsided the distribution of daily returns is. Needs at least 3 returns. |
| `excess_kurtosis` | A measure of how much more extreme the tails of the return distribution are than a normal, bell-curve distribution. Needs at least 4 returns. |
| `tail_ratio` | 95th percentile divided by the absolute 5th percentile of daily returns. Needs at least 20 returns. |
| `win_rate` | Share of days with a return strictly greater than 0. |
| `payoff_ratio` | Average winning-day return divided by the absolute average losing-day return. Needs at least one of each. |
| `trade_win_rate` | Closed trades with a positive return, divided by all closed trades. |
| `trade_profit_factor` | Sum of winning trades' return percentages divided by the absolute sum of losing trades' return percentages. A trade with an exact 0% return counts as a **loser**. No value when there are no losers. |
| `avg_trade_duration` | Average **calendar** days from entry to exit across closed trades — contrast `max_drawdown_duration`, which counts trading days. |
| `expectancy` | `(win rate × average winning trade) + ((1 − win rate) × average losing trade)`, across closed trades. Needs at least one winner and one loser. |
| `fitness` | Not calculated from the equity curve at all — it's whatever value your search objective produced for that trial. See [Metrics as optimization objectives](#metrics-as-optimization-objectives). |

> [!CAUTION] Volatility, VaR and CVaR are already annualized
> Fintela always annualizes these three (multiplying the daily figure by √252) before showing them,
> the same way Sharpe is. Don't re-annualize a value you've pulled from Fintela — it's already there.

> [!NOTE] Trade-based metrics need actual trades, not just a price history
> An equity curve tells you what an account was worth each day — it says nothing about the
> individual buy/sell round-trips that produced it. `Trade Win Rate`, `Trade Profit Factor`,
> `Avg Trade Duration`, and `Expectancy` are calculated from your closed trades and merged in
> separately, so anywhere that only has a bare price series (a ticker in the Market screener, for
> instance) shows all four as empty. A trade counts toward whichever stage it was closed in, which
> is why the per-stage totals always add up to the full-history total with nothing counted twice.

## Benchmark-relative metrics

These nine metrics compare your portfolio against a benchmark you choose — a market index, another
portfolio, or any asset available in Fintela. They need at least **3** matching days of return data
for both series; below that, all nine show no value.

| Key | Label | Unit | Direction | Definition |
|---|---|---|---|---|
| `alpha` | `Alpha` | `annualized %` | higher | Annualized return attributable to the strategy beyond what the benchmark explains. |
| `beta` | `Beta` | `ratio` | **informational** | Sensitivity of strategy returns to benchmark movements. Beta above 1 amplifies market moves. |
| `correlation` | `Correlation` | `ratio` | **informational** | How closely the strategy's daily returns move with the benchmark's. |
| `information_ratio` | `Information Ratio` | `ratio` | higher | Excess return over the benchmark per unit of tracking error. Measures consistency of outperformance. |
| `treynor_ratio` | `Treynor Ratio` | `ratio` | higher | Excess return per unit of market exposure (beta). Rewards outperformance without market exposure. |
| `up_capture` | `Up Capture` | `%` | higher | Fraction of benchmark gains captured by the strategy during up markets. |
| `down_capture` | `Down Capture` | `%` | **lower** | Fraction of benchmark losses suffered by the strategy during down markets. Lower is better. |
| `tracking_error` | `Tracking Error` | `annualized %` | lower | Volatility of the return difference against the benchmark — how far the strategy wanders from it. |
| `r_squared` | `R Squared` | `ratio` | **informational** | Share of the strategy's variance the benchmark explains, from 0 to 1. High means it moves with the market; low means its risk comes from somewhere else. |

### How each benchmark metric is calculated

`r_p` is your portfolio's daily return, `r_b` the benchmark's, and `rf` the annual risk-free rate
divided by 252 (zero, unless you're looking at a risk-free-rate variant — see below).

| Key | How it's calculated |
|---|---|
| `beta` | Covariance of `r_p` and `r_b`, divided by the variance of `r_b`. No value when the benchmark's variance is 0. |
| `alpha` | Jensen's alpha, annualized: the portfolio's excess return minus beta times the benchmark's excess return. Requires a beta to already exist. |
| `information_ratio` | Average of `(r_p − r_b)`, annualized, divided by the standard deviation of `(r_p − r_b)`. No value when the difference never varies. |
| `treynor_ratio` | The portfolio's annualized excess return divided by beta. No value when beta is exactly 0. |
| `up_capture` | Average `r_p` on days the benchmark was up, divided by the average `r_b` on those same days. |
| `down_capture` | Average `r_p` on days the benchmark was down, divided by the average `r_b` on those same days. |
| `correlation` | Covariance of `r_p` and `r_b`, divided by the product of their standard deviations. |
| `tracking_error` | Standard deviation of `(r_p − r_b)`, annualized. A perfectly benchmark-tracking portfolio shows exactly 0 here — that's a real answer, not a missing one. |
| `r_squared` | Correlation, squared. |

> [!NOTE] `Beta`, `Correlation` and `R Squared` carry no direction
> Their direction is deliberately `informational`. A high R² is the goal for an index replicator and
> a red flag for a market-neutral book, so Fintela won't claim a direction on your behalf. One
> consequence: none of the three can be chosen as a search objective, since an objective needs to
> know whether higher or lower counts as better.

## Risk-free-rate variants

Four metrics depend on what "risk-free" return you compare against. Fintela shows both perspectives
side by side: the standard metric assuming a 0% risk-free rate, and a second version — named with an
`_rf` suffix — recalculated using the real risk-free rate as of that period's end date.

| Variant | Based on | Shown as |
|---|---|---|
| `sharpe_ratio_rf` | `Sharpe Ratio` | `Sharpe Ratio (RF)` |
| `sortino_ratio_rf` | `Sortino Ratio` | `Sortino Ratio (RF)` |
| `alpha_rf` | `Alpha` | `Alpha (RF)` |
| `treynor_ratio_rf` | `Treynor Ratio` | `Treynor Ratio (RF)` |

The real rate is drawn from 3-month U.S. Treasury yields as of the period's end date, so a stage that
closed years ago keeps the rate that was current back then. If that rate isn't available yet for a
given date, the `_rf` row is simply left out and only the 0%-rate figure shows. Wherever both appear,
the `_rf` row sits alongside its base metric and shares the same unit, direction, and tooltip.

> [!WARNING] `_rf` values aren't something you can select on their own
> The identifier you use to rank, filter, or query a metric only accepts the 35 built-in names plus
> your organization's custom metrics. `_rf` rows show up automatically alongside their base metric
> wherever results are displayed, but you can't target `sharpe_ratio_rf` directly as a stand-alone
> metric.

## Custom metrics from promoted fitness functions

Any fitness function you've written yourself can be promoted into a first-class metric for your
organization — after that, it behaves exactly like a built-in one: selectable, sortable, and
rankable everywhere. See [Fitness Functions](/docs/fitness-functions) for how promotion works; this
section covers how the result behaves once it's a metric.

| Property | Rule |
|---|---|
| Name | Always shown as `custom:<your-slug>` — the prefix keeps your custom metrics from ever colliding with a built-in one that happens to share a name. |
| Slug | Lowercase letters, digits, and underscores only, up to 110 characters. |
| Label | Whatever display name you gave it when you promoted it — shown exactly as you set it, not auto-generated. |
| Description | Auto-generated as "Custom metric from the fitness function '\<your label\>'." |
| Direction | Higher-is-better by default, since a fitness function is something you're trying to maximize, unless you set it otherwise. |
| Works on a plain ticker | Never — a fitness function scores a full simulation, which a bare price series doesn't have. |
| Parameters | Any hyperparameter your fitness function takes must be locked to one fixed value when you promote it, so the resulting number means the same thing every time it's compared. |
| Stages available | Training, validation, and out-of-sample only. Real-life performance is deliberately excluded, since its end date keeps moving as your portfolio trades — which would make the score mean something different every day. |
| Refresh | Recalculated once a day for every portfolio it applies to. If the calculation fails for one portfolio, only that portfolio's value is affected. |

Built-in objectives can't be promoted this way — they're already metrics.

Once promoted, your custom metric shows up in the same metric list as everything else, flagged as
custom, and can be used as a `metric_name` anywhere in your organization.

## Stages and windows

The same metric reads differently depending on what period it's measured over. Fintela measures
every metric at one of two kinds of period.

**Named stages** — your study's own date ranges:

| Stage | Covers | Present when |
|---|---|---|
| Train | Your study's configured training dates | Always |
| Validation | Your study's configured validation dates | Always |
| Out-of-sample | Your study's configured out-of-sample dates | Only when you've set both out-of-sample dates |
| Real-life performance | From the day after your last configured period through the most recent value | Only once the portfolio has actually traded past its configured periods |
| Overall | The whole equity curve, not anchored to any configured dates | Always |

Train and validation always reflect the dates you configured for the study, even if the data
actually available doesn't fully cover that range.

**Rolling windows** — nine more periods, anchored to the most recent date on the curve (or to today,
for a plain ticker):

| Window | Covers |
|---|---|
| `mtd` | Month to date |
| `qtd` | Quarter to date |
| `ytd` | Year to date |
| `trailing_1m` | Trailing 1 month |
| `trailing_3m` | Trailing 3 months |
| `trailing_6m` | Trailing 6 months |
| `trailing_1y` | Trailing 1 year |
| `trailing_3y` | Trailing 3 years |
| `trailing_5y` | Trailing 5 years |

> [!NOTE] You may see two different out-of-sample values for the same metric
> When a strategy is optimized, its out-of-sample metric is measured once, during that original
> search. Later, Fintela recalculates the same metric from the portfolio's actual saved performance
> history — and the two numbers can genuinely differ slightly. Which one you're looking at depends
> on where you are: a study's optimization-history view shows the original search-time value, while
> stage-ranking views keep whichever of the two is more favorable for each portfolio.

### Which stages a study actually has

Not every study has every stage, and not every metric has a value at every stage — a study without
out-of-sample dates configured simply has no out-of-sample numbers. The dashboard's metric picker
checks this automatically: a metric with no data at all for your study is disabled with the caption
**No data for this study**, while one that has data in some stages but not the one you've currently
selected shows the softer, still-selectable hint **No data in the selected stage**.

### When metric values are calculated

| When | What gets (re)calculated |
|---|---|
| When a search finishes evaluating a trial | That trial's stage values, its overall value, its Fitness score, and its rolling windows |
| Every time a live portfolio advances (a new trading day closes) | Its rolling windows, its real-life-performance Fitness score, its overall Fitness score, and — if it has one — its benchmark-relative values |
| Once a day, automatically | Named-stage values across all your studies, portfolio-level overall figures, and any custom metrics your organization has promoted |

The daily refresh never touches the rolling windows tied to a live portfolio — those stay tied to
whatever last updated that portfolio's actual trading history, so the two can never disagree.

> [!CAUTION] Metrics don't update live
> There's no automatic refresh on any portfolio screen. Metrics are read from what's stored and
> cached in your browser — a number recalculated by the daily refresh appears the next time you
> reload or navigate to that page, not while you're watching it.

## Where each metric appears

| Screen | Metrics shown |
|---|---|
| **Metric picker** on the [Portfolios Dashboard](/docs/portfolios-dashboard) and [Optimization Dashboard](/docs/optimization-dashboard) | Every metric available to your organization, built-in and custom. Anything with "Fitness" in the name is pinned above a divider; everything else follows. |
| **Ranking card stat strip** | Exactly three: Sharpe, Alpha, Beta. |
| **Comparison KPI strip** | Total Return (leader and dispersion), Sharpe Ratio (median), Max Drawdown (worst). |
| **Summary KPI cards** on the Performance tab | Seven headline numbers, each shown at its most relevant stage: Fitness (overall), Sharpe Ratio (out-of-sample), Max Drawdown (out-of-sample), CAGR (overall), Total Return (overall), Win Rate (out-of-sample), Profit Factor (overall). |
| **Metrics scorecard / detail table** on the Performance tab | Every metric your portfolio has a value for, plus benchmark and risk-free-rate rows, one column per stage. |
| **Metrics Comparison heatmap** | Everything your portfolio has, except the 14 advanced metrics listed next. |
| **Advanced Metrics accordion** | Exactly 14: Skewness, Excess Kurtosis, Tail Ratio, Up Capture, Down Capture, Information Ratio, Treynor Ratio, Beta, Alpha, Correlation, Payoff Ratio, Recovery Factor, Omega Ratio, Martin Ratio. |
| **Headline figures** on the Profile tab | Total Return and CAGR (overall); Max Drawdown and Sharpe Ratio (out-of-sample, falling back to overall if out-of-sample isn't available). |
| **Metric matrix** in the [Portfolio Manager](/docs/portfolio-manager) | The 21 value-bearing portfolio metrics (everything except the 4 trade-based ones), plus the 9 benchmark metrics whenever you've set a benchmark. Fitness isn't shown here. |
| **Indicators screener** in [Market](/docs/market) and the [Data Explorer](/docs/data-explorer) inspection drawer | Only metrics that work on a plain ticker — see [What a metric is here](#what-a-metric-is-here). |
| **Objective picker** when setting up a search | The 27 built-in objectives — see [Metrics as optimization objectives](#metrics-as-optimization-objectives). |

A metric's definition, unit, and direction never change from one screen to another — every screen
reads them off the same reference list. For what each screen actually does with these numbers, see
[Portfolio Detail](/docs/portfolio-detail) and [Analyzing Results](/docs/analyzing-results).

## Display and formatting

How a value is displayed follows directly from its unit, so it's consistent everywhere rather than a
different convention per screen.

| Unit | Shown as | Applies to |
|---|---|---|
| Days | A whole number with a "d" suffix | Max Drawdown Duration, Avg Trade Duration |
| Any percentage unit | A percentage with one decimal place | Total Return, CAGR, Alpha, and other `%` / `annualized %` metrics |
| Ratio, plain number, or score | A plain number with three decimal places, never shown as a percentage | Sharpe, Sortino, Calmar, Martin, Omega, Profit Factor, Payoff Ratio, Recovery Factor, Tail Ratio, Skewness, Excess Kurtosis, Beta, Correlation, R², Information Ratio, Treynor, and Fitness |

The metrics shown as percentages are: Total Return, CAGR, Alpha, Expectancy, Max Drawdown, Average
Drawdown, Ulcer Index, Volatility, Win Rate, Trade Win Rate, VaR 95, CVaR 95, Up Capture, Down
Capture, and Tracking Error. Beta, Correlation, and R² are deliberately shown as plain 0-to-1 numbers
rather than percentages.

The category groupings you see in the UI don't map one-for-one onto the categories described
earlier. The Metrics Comparison heatmap — the one screen that groups metrics by category — uses
Performance, Risk, Risk-Adjusted, Distribution, Trade, Benchmark, and an Other bucket for anything
that doesn't fit; it also groups Fitness and Win Rate under Performance, and Recovery Factor and
Payoff Ratio under Risk-Adjusted, a little differently from how they're categorized elsewhere. The
metric picker doesn't group by category at all — it just pins Fitness-related names above a divider
and lists everything else below.

Hovering the info icon next to any metric label shows its full definition, its unit, and one of
↑ Higher is better, ↓ Lower is better, or — Informational.

## Using a metric name in the API

Every metric name shown throughout this page — `sharpe_ratio`, `max_drawdown`, and so on — is also
the identifier you'd use if you bring your results into your own tools through Fintela's read-only
[Developer API](/docs/api-trials-portfolios). You get access to it with a personal access key from
your account settings; because it's read-only, pulling data through it can never accidentally change
anything in your portfolios or studies.

You can use a metric name to rank or filter your studies and portfolios by any stage or rolling
window, or to pull a stored value straight from a results table. A name that isn't one of the 35
built-ins or one of your organization's custom metrics is rejected, as is a stage that isn't one of
the 14 accepted values (the five named stages plus the nine rolling windows) — either way you'll get
a plain-language error rather than a value that shouldn't exist. Calls that let you weight several
timeframes together require those weights to add up to 1.0.

Full detail on limits and error messages lives in [API Errors](/docs/api-errors); the shape of a
results response is covered in [Trials and Portfolios](/docs/api-trials-portfolios).

> [!NOTE] The number in a dashboard URL isn't the metric's real identifier
> A `metric=` number you sometimes see in a dashboard's URL is just its position in an alphabetically
> sorted list — it shifts every time a metric is added to the catalog or your organization promotes a
> new custom one, so it's not something worth bookmarking or sharing. The metric's name
> (`sharpe_ratio`, `custom:my_score`, and so on) is the durable reference.

## Metrics as optimization objectives

When you set up a search, you can optimize directly toward any built-in metric — no code required —
by choosing one of the **27** built-in objectives. Each is named after, and scored the same way as,
the metric it corresponds to.

Available as an objective — every portfolio metric except the four trade-based ones and Fitness
itself, plus six of the benchmark metrics:

`Total Return`, `CAGR`, `Volatility`, `Max Drawdown`, `Average Drawdown`, `Max Drawdown Duration`,
`Ulcer Index`, `VaR 95`, `CVaR 95`, `Sharpe Ratio`, `Sortino Ratio`, `Calmar Ratio`, `Martin Ratio`,
`Omega Ratio`, `Profit Factor`, `Recovery Factor`, `Skewness`, `Excess Kurtosis`, `Tail Ratio`,
`Win Rate`, `Payoff Ratio`, `Alpha`, `Information Ratio`, `Treynor Ratio`, `Up Capture`,
`Down Capture`, `Tracking Error`.

| Not available as an objective | Why |
|---|---|
| Trade Win Rate, Trade Profit Factor, Avg Trade Duration, Expectancy | These can't be calculated purely from the equity curve a search evaluates while it runs. |
| Beta, Correlation, R² | They're informational only — there's no "higher is better" or "lower is better" for them, and an objective needs one. |
| Fitness | It's the objective's own output, not something you can also optimize toward. |

The six benchmark-relative objectives need a benchmark set on the study. If you try to launch a
search without one, Fintela blocks it with a message explaining that the chosen objective needs a
benchmark, and suggesting you either set one or choose an objective that doesn't need one. This check
only applies to built-in objectives — a fitness function you write yourself can reference a benchmark
however you like. See [Studies](/docs/studies) for where you set a study's benchmark.

> [!WARNING] Optimizing for Tracking Error alone converges on just holding the benchmark
> Minimizing Tracking Error by itself pushes a search toward a portfolio that simply mirrors the
> benchmark — the right outcome if you're building an index replicator, and the wrong one for
> anything meant to outperform. Pair it with a return objective unless replication is actually the
> goal.

## What is not a metric

Three other kinds of numbers in Fintela look like the metrics on this page and aren't — worth telling
apart.

| | One value per... | Where you'll see it |
|---|---|---|
| **Catalog metric** (this page) | Portfolio and period — e.g. Sharpe Ratio, out-of-sample | Metric picker, scorecards, rankings |
| **Rolling curve series** | Day, over a sliding window | Performance charts |
| **Robustness statistic** | Portfolio or study, computed once | Overfitting / robustness tables |

- **Rolling curve series.** The Drawdown, Volatility, Rate of Change, and Sharpe charts each plot a
  daily value over a sliding window, one point per day. The rolling Sharpe line in particular uses a
  deliberately different formula from the `Sharpe Ratio` metric on this page: it compares recent
  return to recent volatility over a short window, isn't annualized, and doesn't subtract a
  risk-free rate. A chart reading 0.4 next to a metric card reading 1.8 isn't a contradiction — they
  answer different questions. See [Visualizations & Plots](/docs/visualizations).
- **Robustness statistics.** Deflated Sharpe, Probabilistic Sharpe, the luck threshold, degradation
  scores, and probability-of-backtest-overfitting are calculated once, when a study finishes, as a
  separate check on whether its results look like real skill or luck. They're not on the metric
  list, don't appear in the metric picker, and can't be selected as a ranking or objective metric.
- **Trade columns.** The Return, P&L, MFE, and MAE columns you see on the Transactions tab describe
  one individual trade, not the portfolio as a whole — they aren't portfolio metrics.

## Requesting a new metric

There are two ways a new metric comes into being, and they work very differently.

| Path | Available to | How fast |
|---|---|---|
| Promote a fitness function you've written | Just your organization | Immediately — no release needed |
| Add a new built-in metric to the platform | Every Fintela organization | Requires a product release from the Fintela team |

If you have logic for evaluating a strategy that isn't already covered by a built-in metric, writing
it as a [fitness function](/docs/fitness-functions) and promoting it is the fastest path — anyone
with permission to manage fitness functions in your organization can do it, and it's usable
everywhere a built-in metric is, immediately. If instead you think a metric would be valuable for
every Fintela user, reach out to your account contact or support — adding it to the platform-wide
catalog is a larger change that ships in a future release.

## Known limitations

A few small inconsistencies exist today. None of them affect the underlying numbers — only how a
handful of screens present them.

- **Tracking Error's "best" highlight can be backwards.** Tracking Error is a lower-is-better metric,
  and the ↓ arrow next to its name is always correct — but on some screens, the automatic
  highlighting of the "best" stage or portfolio for Tracking Error doesn't respect that, and may
  highlight the higher value instead. If you're comparing Tracking Error across stages, trust the
  numbers and the ↓ indicator over any highlight colour.
- **The "Trade" category label doesn't translate.** On the Metrics Comparison heatmap, six of the
  seven category headers respect your language setting; "Trade" currently always shows in English
  regardless of which language you've selected.
- **Fitness has no rolling-window value.** The Window column has nothing to show for the Fitness
  metric, so that cell always displays a dash — even though Fitness does have values at your
  training, validation, and out-of-sample stages.
- **Very old studies may be missing rolling-window data.** The nine rolling windows (MTD, QTD, YTD,
  and the trailing periods) are only populated by processes introduced after a certain point; a study
  created well before that will still have all its named-stage values, but ranking by a rolling
  window may come up empty for it.
