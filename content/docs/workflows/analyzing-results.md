---
title: Analyzing results
section: Workflows
sectionOrder: 2
order: 4
published: true
updated: 2026-08-04
summary: Browse trial rankings, compare portfolios, inspect equity curves and trades.
keywords: results, portfolios, trials, equity curve, sharpe, analytics, compare, pivot table, lineage, scalings, drawdown
---

After a study completes, every trial produces a portfolio — a full backtest with equity
curve, metrics, trades, and holdings. This page explains how to navigate the Analytics
section and make sense of what you see.

## Overview

The **Analytics → Portfolios** section is your primary tool for comparing optimization
results. It shows all portfolios from all studies you've run, with tools to filter, sort,
chart, and deep-dive into individual trials.

```text
Analytics → Portfolios
├── Portfolio ranking table (all trials, sortable)
├── Selected portfolio(s) equity charts
├── Drawdown & volatility charts
├── Trade history
├── Holdings snapshot
└── Pivot table (cross-study parameter comparison)
```

## Portfolio dashboard

`Analytics → Portfolios`

The dashboard loads with a study selector in the top bar. Select one or more completed
studies to populate the portfolio ranking table.

| Control | What it does |
|---|---|
| Study selector | Filter the table to one or more specific studies. Multiple studies can be compared side by side. |
| Portfolio table | One row per trial. Columns include all key metrics, parameter values, and study name. |
| View mode toggle | Switch between Charts view (equity curves), Pivot view (parameter vs. score table), and Table view (raw metrics). |
| Date filter | Restrict metric calculations to a custom date range within the portfolio's history. |

## Filtering and sorting

Click any column header in the portfolio table to sort by that metric. Available sort
columns:

| Metric | Meaning |
|---|---|
| `Sharpe ratio` | Risk-adjusted return — annualized return divided by annualized volatility. |
| `Sortino ratio` | Like Sharpe but only penalizes downside volatility. |
| `Calmar ratio` | CAGR divided by max drawdown. Higher = better return per unit of drawdown. |
| `Max drawdown` | Largest peak-to-trough decline in the equity curve. |
| `CAGR` | Compound Annual Growth Rate — annualized total return. |
| `Win rate` | Fraction of closed trades that ended in profit. |
| `Volatility` | Annualized standard deviation of daily returns. |

> [!TIP]
> Select multiple portfolios in the table (checkbox column on the left) to overlay their
> equity curves in the charts section below the table.

## Portfolio detail

Click any row in the portfolio table to open the detail panel. This shows the complete
result for that single trial:

| Tab | What it shows |
|---|---|
| Overview | Key metrics cards: total return, Sharpe, max drawdown, win rate, trade count. |
| Equity | Full equity curve from start to end date with zoom controls. |
| Drawdown | Rolling drawdown from peak, with max drawdown annotated. |
| Trades | Complete trade log — see [Trade history](#trade-history) for details. |
| Holdings | Date-picker to see the portfolio composition on any specific date. |
| Parameters | The exact parameter values used in this trial. |
| Risk Managers | The risk manager configuration this portfolio was produced with, plus an execution log of any notable events. |
| Lineage | The source portfolio this one was derived from, if any, and the portfolios derived from it. |

## Equity & drawdown charts

The chart section below the portfolio table shows time-series charts for all selected
portfolios overlaid on the same axes. Controls include:

| Control | What it does |
|---|---|
| Benchmark overlay | Select a benchmark ticker (e.g. SPY) to overlay its performance on the equity chart for comparison. |
| Scaling mode | Normalized (all portfolios start at 1.0) or absolute (raw portfolio value). Normalized is easier to compare multiple portfolios. |
| Zoom | Click-drag on the chart to zoom into a date range. The metrics bar updates to show metrics for the selected window. |
| Chart type | Switch between time series (equity curve) and histogram (return distribution). |

## Trade history

The Trades tab in the portfolio detail shows every simulated trade. Each row contains:

| Field | Meaning |
|---|---|
| Ticker | The traded asset. |
| Side | L (long) or S (short). |
| Entry / Exit | Dates when the position was opened and closed. |
| Entry / Exit price | Average fill price at entry and exit. |
| P&L | Realized profit or loss for the trade. |
| Total return % | Return percentage from entry to exit. |
| MAE / MFE | Max Adverse Excursion (worst intra-trade drawdown) and Max Favorable Excursion (best intra-trade gain). |
| Duration | Number of calendar days the position was held. |

## Scaling detail

Click any trade to open its detail panel, then click a scaling to expand it inline. A
scaling is a single scale-in or scale-out within the trade; the drill-down shows how that
segment performed on its own:

| Field | Meaning |
|---|---|
| MAE / MFE | Worst and best excursion within that scaling segment. |
| Efficiency | P&L generated per unit of capital injected at the scale-in. |
| Segment return | Price move over the scaling segment. |
| Duration | Length of the scaling segment, in trading days. |
| Injection | Capital added (scale-in) or removed (scale-out) at that point. |

The panel also surfaces two trade-level rollups derived from the scalings: the
partial-success ratio (the fraction of a trade's scalings that were individually
profitable) and the capital-weighted hold time (the average time scaled-in capital stayed
at risk).

## Portfolio lineage

A portfolio can be **derived** from another one — most commonly through a risk-manager
optimization study, where each trial reuses a source portfolio's strategy and signals while
varying the risk-manager configuration. When that happens, the new portfolio keeps a link
back to its source.

The **Lineage** tab in the portfolio detail shows this family tree: the source portfolio
above, and every portfolio derived from the current one below. It lets you trace where a
portfolio came from and compare a source against its derivatives side by side — for example,
to see exactly how much a given risk manager improved drawdown without changing the
underlying strategy.

> [!TIP]
> Select a source portfolio and one of its derived portfolios together to overlay their
> equity curves — the clearest way to read the impact of a risk manager.

## Pivot table

Switch to **Pivot view** in the view mode toggle to open the pivot table. This
cross-tabulates parameter values against fitness scores, making it easy to see which
parameter ranges produced the best results across all trials.

> [!NOTE]
> The pivot table is most useful after a large study (200+ trials) where you can see clear
> patterns — e.g. "n_top between 5 and 8 consistently outperforms". It helps inform the
> bounds for a follow-up refined study.

## Custom date windows

The date filter in the top bar lets you evaluate portfolios over a custom date range —
independent of the original study dates. All metrics in the table and charts update to
reflect the filtered window.

1. **Open the date filter.** Click the date range selector in the top controls bar of the
   Analytics page.
2. **Set the range.** Pick a start and end date using the date pickers, or choose a preset
   period (1Y, 3Y, 5Y, custom).
3. **Metrics update.** The portfolio table recomputes all metrics (Sharpe, drawdown, etc.)
   for the selected window. The equity curves are sliced to show only the filtered period.

> [!TIP]
> Use custom date windows to evaluate how a strategy would have performed during specific
> market regimes — e.g. the 2020 COVID crash, 2022 bear market, or a recent bull run.
