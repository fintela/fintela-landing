---
title: Portfolio Detail
section: Analysis & Portfolios
sectionOrder: 4
order: 2
published: true
updated: 2026-09-01
summary: The six views inside a single portfolio — performance, holdings, trades and orders, risk analytics, robustness, and a shareable investor profile.
keywords: portfolio detail, performance, holdings, transactions, trades, orders, risk analytics, robustness, tearsheet, profile
---

Every trial a study produces is a portfolio, and opening one takes you into **Portfolio Analysis** — a single screen with six views you switch between from a dropdown. **Performance** answers "did this work", **Holdings** "what did it hold", **Transactions** "what did it do", **Risk Analytics** "how did it lose money along the way", **Robustness** "is the result real, or just luck", and **Profile** "can I show this to someone". You reach this screen by drilling into a portfolio from the [Portfolios Dashboard](/docs/portfolios-dashboard) or the [Optimization Dashboard](/docs/optimization-dashboard); it stays open until you close it.

## The six tabs

Each of the six views is its own page, so you can open one in a new browser tab, bookmark it, or send the exact view to a colleague — the link takes them straight back to it.

| Tab | Shows you | Formerly |
|---|---|---|
| Profile | An investor-ready summary you can export or share | New |
| Performance | The equity curve and the full metrics comparison | Merged from the old Overview and Metrics pages |
| Holdings | What the portfolio held, and when | — |
| Transactions | Every trade and every order the portfolio placed | Merged from the old Trades and Orders pages |
| Risk Analytics | Drawdown, volatility and other risk views, plus any risk-manager activity | Merged from the old Equity & Risk and Risk Managers pages |
| Robustness | The statistical verdict on whether the result is genuine skill or overfitting | Formerly labeled Overfitting |

The tabs always appear in this order. If you used Fintela before this redesign, see [Renamed tabs](#renamed-tabs) below for where your old bookmarks now lead.

### Which tab a drill-down lands on

By default, opening a portfolio takes you to the **Profile** tab. Depending on how your workspace is configured, it may instead open on **Performance** — in that case Profile is left out of the dropdown, though you can still reach it directly if you have a saved link to it.

### What every tab shares

All six views share the same slim header: on the left, a strip naming the **strategy this portfolio came from** and its **author**; on the right, a help button that opens a short documentation panel for whatever you're looking at.

Two safeguards apply on some tabs, not all:

| Situation | What you see |
|---|---|
| The portfolio ID in the address is invalid | An error: "Invalid portfolio ID." |
| The portfolio's data can't be loaded | A warning: "This portfolio is no longer available. It may have been deleted, or you may not have access to it." |

Either message comes with a **Close Portfolio Analysis** button — the same action as clicking the tab's "x".

> [!NOTE] Not every tab shows the "unavailable" warning
> Only **Performance** and **Profile** show the full unavailable message — they're the two views a drill-down can land on directly. **Holdings**, **Transactions**, **Risk Analytics** and **Robustness** still catch an invalid ID, but if the portfolio itself can't be found, they simply render empty rather than showing the exit message.

Portfolios are always labeled `Trial N · <study name>` rather than by an internal ID — trial numbers repeat across different studies, so the study name travels with them everywhere except the Profile tab's `Reference` field, which does show the raw ID alongside the trial number.

> [!NOTE] Nothing here refreshes automatically
> These tabs don't poll for new data or auto-refresh in the background. If you want the latest numbers, revisit the tab or reload the page.

## Performance

The main landing view for a portfolio, combining what used to be two separate pages — the equity overview and the metrics matrix — into one screen.

### Header actions

Four buttons sit above the equity chart (collapsing to icons on mobile):

| Button | What it does |
|---|---|
| Seed | Opens a dialog showing this trial's seed — the daily rebalancing signal the strategy produced — which you can download. |
| Test Risk Manager | Opens the sandbox with this portfolio loaded, so you can try a risk manager against it before committing to one. |
| Derive / Optimize RMs | Opens the Derive Risk Managers wizard, pre-loaded with this portfolio as the starting point. |
| Invert (what-if) | Flips every position long-to-short and short-to-long and re-runs the simulation, purely as a preview — nothing is saved or traded. |

`Test Risk Manager` and `Derive / Optimize RMs` are both unavailable while risk-manager information for the portfolio is still loading, and again once the portfolio already has a risk manager attached — the tooltip in that case reads "This portfolio already contains a Risk Manager."

### Equity curve

A chart of the portfolio's equity, with quick-timeframe buttons above it: **All**, **Since creation**, **Train**, **Val**, **OOS**, **RLP**, **YTD**, **MTD**, **1M**, **1W**. Only the buttons that make sense for this portfolio appear — **Train** and **Val** need the study to have a defined training cutoff, **OOS** needs the study to have been set up with an out-of-sample window, **RLP** needs the portfolio to have real-life trading data, and **Since creation** only applies to a basket rather than a single trial.

A benchmark selector sits on the chart itself. The legend shows **Portfolio**, the benchmark, and a swatch for each study period covered. With no data to plot, the chart reads "No equity data."

Zooming into a date range, or picking one of the preset buttons, updates the rest of the page to match — the metrics table below and the scorecard's windowed figures both follow whatever range you've selected.

### Invert what-if

Turning the toggle on overlays an inverted re-simulation on top of the real curve, with a panel below showing a warning label ("Inverted (what-if)") and, if the portfolio has a risk manager, a note that the what-if doesn't account for it. If the simulation fails, you'll see "Could not simulate the inverted what-if."

The panel reports four figures: **Total Return**, **CAGR**, **Sharpe Ratio**, **Max Drawdown**. If any ticker had no market data available for the inverted run, it's called out by name.

This is a preview only — it's never saved, and it resets as soon as you move to another portfolio.

### Metrics comparison

This half of the page opens with **Metrics Comparison** and, once robustness scores exist, a compact verdict badge summarizing the deflated Sharpe confidence, probabilistic Sharpe confidence, the study's overall overfitting probability, and how many trials it ran.

Below that sit up to seven summary cards — any metric with no value anywhere is simply left out rather than shown empty:

| Card | Metric | Stage shown |
|---|---|---|
| Fitness | Fitness score | Overall |
| Sharpe Ratio | Sharpe ratio | Out-of-sample |
| Max Drawdown | Max drawdown | Out-of-sample |
| CAGR | Compound annual growth rate | Overall |
| Total Return | Total return | Overall |
| Win Rate | Win rate | Out-of-sample |
| Profit Factor | Profit factor | Overall |

Each card shows which stage (Train, Val, OOS, Overall or RLP) the value comes from, plus a signal badge (see below). When study details are available, the Fitness card also shows the fitness function's name and a short description.

### Metric signals

Signal badges are quick, per-metric diagnostics — a first read on whether a number looks healthy, not the final word. For the statistically grounded verdict, see the [Robustness tab](#robustness-overfitting).

| Badge | What triggers it |
|---|---|
| High Risk | Out-of-sample drawdown deeper than 20%, or volatility above 30% |
| Controlled Risk | Out-of-sample drawdown shallower than 10%, and volatility below 15% |
| Train ≫ OOS | Performance drops more than 30% from training to out-of-sample (or to validation, if there's no OOS stage) |
| Val Weak | Performance drops more than 25% from training to validation, but holds up reasonably well out-of-sample |
| OOS Strong | Out-of-sample performance matches or beats training |
| Stable | The metric stays within about 15% of itself across every stage it appears in |

A metric with no training-stage value gets no badge at all. When a study has no out-of-sample stage, validation is used as the reference instead. Total return, max drawdown duration, and recovery factor are adjusted for how long each stage actually ran before being compared, so a short stage doesn't look artificially better or worse than a long one.

### Windowed scorecard and Window Bucket

A collapsible **Metrics** panel, collapsed by default, that remembers whether you left it open. Its header always shows CAGR, Sharpe and Max Drawdown for the portfolio's primary stage — out-of-sample if there is one, otherwise validation, otherwise whichever stage has data — and, while you have a custom chart window selected, the same three figures for that window.

Opening it reveals the full metrics table: one row per metric, one column per stage, plus a **Window** column that only appears while you've zoomed the equity chart to a custom range (its header shows the exact months covered). This is the only place on the portfolio that shows figures for that custom window specifically.

The scorecard header also has a **Window Bucket**, for building a blended view out of several time ranges:

| What you can do | How |
|---|---|
| Add the range you've zoomed to | One click — disabled until you've zoomed the chart |
| Add a custom range | Type a start date, end date, and an optional label |
| Weight each window | Set weights that must add up to 100%, or use equal weights |
| Compute | Calculates a weighted-average result across all your added windows |

The result reports four blended figures: **Total Return**, **CAGR**, **Volatility**, **Max Drawdown**.

### Radar, heatmap and advanced metrics

- **Metrics Radar** appears once at least two stages have data, so you can see the portfolio's overall shape at a glance — a larger area is better, except for risk metrics. You choose which metrics to include; with fewer than two stages or three metrics, it explains that there isn't enough data yet.
- A per-stage **heatmap** lays every core metric out by stage, with a **Best** column and the signal badge for each row.
- **Advanced Metrics** is a collapsed section holding the less commonly used figures — skewness, excess kurtosis, tail ratio, up/down capture, information ratio, Treynor ratio, beta, alpha, correlation, payoff ratio, recovery factor, omega ratio and Martin ratio.

For what every metric actually measures, see the [metrics reference](/docs/metrics-reference).

### Strategy configuration

A collapsible **Strategy configuration** section, closed by default, that remembers your preference. It holds four parts:

| Section | Shows |
|---|---|
| Parameters | The parameter values this trial ran with, or "None" if the strategy takes none. |
| Study Information | Only shown when you arrived from a specific study — the strategy, its author, the fitness function, the asset groups used for strategy and fitness, the train and validation periods, and how many trials the study ran. |
| Risk Manager Configuration | The exact risk-manager settings that produced this portfolio, if any. Nothing is shown when there isn't one. |
| Portfolio lineage | If this portfolio was derived from another (for example, as a risk-manager variant), shows what it came from and, if others were derived from it in turn, how many. |

## Holdings

What the portfolio actually held, and when it changed. Like Risk Analytics, this tab responds to the date-range filter shown above it.

1. **Equity Curve** — the portfolio's value over time, with a benchmark selector and a toggle between **Aligned to window start** (both lines rebased to the same starting point) and **Raw values**. Click anywhere on the curve to pin that date for the panels below; hover to preview it. Any positions you've selected are highlighted on the curve as coloured bands.
2. **Allocation Snapshot** — a treemap of everything held on the pinned date, which you can break down by ticker code, type, ISIN, sector, industry, country or currency.
3. **Current Holdings** — a table of every position on that date, with its weight, the change from the prior date, and an allocation bar. The subtitle shows the position count, not counting cash.
4. **Historical Allocation** — the same breakdown as the snapshot, but as a stacked area over time so you can see how the mix evolved.

> [!NOTE] Long and short positions are sized differently
> A short position isn't drawn as a negative-sized tile — the snapshot sizes every tile by the position's actual exposure and marks shorts with an **(S)** tag so they're still visible. The historical view, on the other hand, plots signed weights, so shorts appear below the zero line. The Current Holdings table shows signed weights too, with a **SHORT** tag. Capital that isn't invested in anything shows up as **CASH**.

## Transactions

The former Trades and Orders pages, combined into one tab. A single set of filters — ticker, open/closed status, and date range — drives every trade view on the page. The Orders section below follows the same ticker and date filter, but ignores the open/closed status (that only applies to trades), and its six summary tiles ignore filtering entirely.

### Summary tiles

Five tiles, recalculated from whatever trades are currently in view:

| Tile | Value | Sub-label |
|---|---|---|
| Trades | Total count | Closed vs. open |
| Win Rate | Wins ÷ closed trades | Wins and losses |
| Avg Return | Average signed return over closed trades | Number of closed trades it's based on |
| Avg Duration | Average holding period for closed trades | — |
| Best Trade | The ticker with the single best closed trade | Its return |

A closed trade counts as a win when its return is zero or better. A trade counts as closed once it has an exit date.

### Shared filter toolbar

| Filter | Options |
|---|---|
| Asset | All assets, or search for a specific ticker |
| Status | All / Open / Closed |
| Date | All, YTD, QTD, MTD, or a custom range |

This date filter only offers calendar ranges. The study-period shortcuts (Train, Val, OOS, RLP) available in the shared filter elsewhere on the page aren't offered here.

### Trades chart and table

A chart of return per trade, sorted by exit date, reading "No closed trades available" when there's nothing to show.

Below it, a sortable table — click any column except the last to sort by it (default: most recent entry first):

| Column | What it shows |
|---|---|
| Ticker | The traded symbol |
| Side | Long (green) or short (red) |
| Entry / Exit | Entry date, and exit date — or a live "● Open" marker if the trade hasn't closed |
| Days | How long the trade has been (or was) open |
| Avg In / Avg Out | Average entry and exit price |
| Invested | Capital committed to the trade |
| Return | Signed percentage return, with a mini bar |
| P&L | Profit or loss on the trade |
| MFE / MAE | Maximum favorable and adverse excursion — the best and worst the trade looked before it closed |
| Scaling | A small sparkline showing how the position's P&L moved as it scaled in |

The empty state reads "No trades match the current filter." Click any row to open its full detail.

> [!CAUTION] Read the P&L column as a dollar figure
> Despite the percentage-style formatting, P&L is a money value, not a percentage of anything.

### Trade detail drawer

Opens as **Trade #{{id}}**, with a Long/Short chip and an Open badge if it hasn't closed yet. Shows Total P&L, Avg Entry, Avg Exit, Quantity, Invested, Allocation, Duration, MFE and MAE, plus the same scale-in / P&L progression chart.

### Trade plots

| Chart | What it tells you |
|---|---|
| Return vs. Duration | Each point is a closed trade — how long it was held vs. how much it returned. Green wins, red loses; circles are longs, triangles are shorts. |
| Outcome by Side | Wins vs. losses split by long and short, so you can see which side is carrying the edge. Captioned with the overall win rate. |
| MFE / MAE Efficiency | How much heat a trade took (MAE) against how much opportunity it saw (MFE), coloured by outcome. |

The first two read "No closed trades in the current filter" when empty; the efficiency chart reads "MFE / MAE are not available for this trade source" if no trade in view carries that data.

### Calendar heatmap

A calendar-style heatmap you can switch between **Daily Return %**, **Trade P&L ($)** and **Capital Invested ($)**, at a **Daily**, **Weekly** or **Monthly** granularity, with a year selector once the data spans more than one year. Colour runs red-to-green for return and P&L, and a blue ramp for invested capital; hover any cell for the exact value.

### Orders

A collapsible **Orders** section, open by default.

Six summary tiles: **Total Orders**, **Buy Orders**, **Sell Orders** (each shown as a share of the total), **Unique Tickers**, **First Order** and **Last Order**.

> [!WARNING] The order tiles don't move with your filters
> Everything else on this tab responds to the shared filters. These six tiles are portfolio-wide totals and stay fixed regardless of what you've filtered to.

Two charts follow the filters: monthly buy/sell activity, and the top 15 tickers by order volume, split by buy vs. sell.

The order table has its own quick filter — All / Buy / Sell — layered on top of the shared ticker and date filters, sorted by most recent by default:

| Column | Shows |
|---|---|
| Order ID | — |
| Ticker | — |
| Date | — |
| Action | Buy (green) or Sell (red) |
| Side | Long or short |
| Qty | Order quantity |
| Resulting Qty | Position size after the order |
| Source | Where the order came from — see below |

An order's source shows as **strategy** when your strategy logic placed it, the risk manager's name when a risk manager did, or **manual** when you placed it yourself. Older orders from before Fintela tracked risk-manager attribution show as **strategy**.

## Risk Analytics

Where the equity curve is read as a risk object, rather than a return one. Like Holdings, this tab follows the shared date-range filter above it.

### Stat cards and equity curve

Four stat cards open the page: **Start Value**, **End Value**, **Period Return** (signed and colour-coded), and **Data Points**.

Below them, a toggle switches the equity chart between two modes:

- **Line** — the familiar filled curve.
- **Cascade** — a waterfall of daily returns, showing each day's move and the running total. Zooming rebases the chart so the first visible bar always starts at zero.

### Rolling risk charts

| Chart | Shows | Distribution view | Default window |
|---|---|---|---|
| Drawdown | Peak-to-trough decline over time | Histogram of drawdowns | Not windowed |
| Volatility | Rolling volatility | Histogram of rolling volatility | 20 days |
| Rate of Change | Rolling momentum | Histogram of momentum | 20 days |
| Sharpe | Rolling risk-adjusted return | Histogram of rolling Sharpe | 20 days |

Each chart can be switched between its time-series and histogram view. On the windowed charts, you can adjust the rolling window (from 2 to 252 days) directly on the chart; the histogram view also lets you adjust the bin count and turn density scaling on or off.

> [!NOTE] Default windows differ by page
> These rolling charts default to a 20-day window. The equivalent charts on the [Portfolios Dashboard](/docs/portfolios-dashboard) default to 14 days.

### Risk-manager execution log

A log of everything a risk manager attached to this portfolio did during the trial — exceptions, timeouts, invalid outputs, and any point where it stopped or resumed trading. An empty log is the good outcome.

Each entry shows the event type, the risk manager's name and kind, the trial number, and when it happened:

| Event | What it means |
|---|---|
| Exception | The risk manager's logic raised an error |
| Timeout | It didn't respond in time |
| Invalid output | It returned something the engine couldn't use |
| Terminal | It ended the trial |
| Rejected | Its instruction was rejected |
| Halted | It tripped a circuit breaker — a protective pause, not a fault |
| Reactivated | It resumed after being halted |

If there's nothing to show, that's expected — it reads "No risk-manager events recorded for this portfolio." The most recent event is always listed first, and the log shows up to the 200 most recent entries. See [Risk Managers](/docs/risk-managers) for what generates them.

## Robustness (overfitting)

The statistically grounded answer to "is this result real, or just the luckiest of many backtests". This is the authoritative verdict for a portfolio — the per-metric [signal badges](#metric-signals) on the Performance tab are only a quick first read, not this.

### When scores exist

Robustness scores are calculated once, automatically, when a study finishes (or is re-finalized) — not on demand each time you open the tab. Until then, there's nothing to show yet.

| Situation | What you see |
|---|---|
| Scores not computed yet | "No robustness analysis available for this portfolio yet. Scores are computed when a study finishes — re-run the study (or its finalization) to populate them." |
| Couldn't load | "Couldn't load the robustness analysis. Try again shortly, and contact support if it persists." |

These two messages are kept distinct, so a genuine loading problem is never mistaken for "this study just hasn't finished yet." The study-wide overfitting probability additionally needs at least 2 fully-run trials and 40 days of shared history across them; without that, the study-level figures stay empty even when this portfolio's own numbers are ready.

### Verdicts

The headline panel shows a verdict and what it means for you:

| Verdict | What it means |
|---|---|
| Well Trained | The out-of-sample edge survives the correction for how many strategies were tried. Strong evidence of genuine skill rather than the luckiest of many backtests. |
| Borderline | The edge only weakly survives that correction. Treat it with caution, and look for corroborating evidence before trusting it. |
| Overfit Risk | The out-of-sample result isn't clearly distinguishable from the best of many random trials, and/or it degrades materially out-of-sample. High risk of overfitting. |
| Insufficient Data | There isn't enough out-of-sample history or trial variety to compute a confident verdict. Read the raw metrics directly instead. |

The verdict is decided in this order — the first condition that applies wins:

1. **Insufficient Data**, when there are fewer than 30 out-of-sample trading days, or too few distinct trials to draw a conclusion.
2. **Overfit Risk**, when performance degrades significantly from training to out-of-sample, or the study-wide overfitting probability is above 50%, or the deflated Sharpe confidence is below 90%.
3. **Borderline**, when the deflated Sharpe confidence is below 95%.
4. **Well Trained**, otherwise.

### Deflated Sharpe gauge and skill vs. luck

Two charts sit side by side.

**Deflated Sharpe** is a 0–100% gauge — your confidence that this is real skill, not luck — coloured red below 90%, amber from 90–95%, and green at 95% and above. An outer ring shows the study-wide overfitting probability, turning red once it passes 50%. With no deflated Sharpe available, it reads "Not enough data to compute a Deflated Sharpe."

**Skill vs. luck** compares this portfolio's out-of-sample Sharpe ratio against the Sharpe the best of every trial in the study would be expected to reach with zero real skill, purely from trying enough variations. Clearing that "luck threshold" is the bar for a genuine edge. With no out-of-sample Sharpe available, it reads "No out-of-sample Sharpe available."

Below the charts, a plain-language summary is generated from the numbers — how many strategies were compared, this portfolio's out-of-sample Sharpe, its deflated Sharpe with a verdict in words, whether performance degrades from training to out-of-sample, and the study's overall overfitting probability.

### Component breakdown

| Figure | What it means |
|---|---|
| Deflated Sharpe (OOS) | Probability the true out-of-sample Sharpe exceeds what the best of every trial tried would reach by luck alone. Corrects for how many strategies were searched. 95%+ is Well Trained. |
| Probabilistic Sharpe (OOS) | Probability the true out-of-sample Sharpe is positive at all, without correcting for how many strategies were tried. Always higher than the Deflated Sharpe — the gap is the cost of searching many strategies. |
| Your OOS Sharpe | This portfolio's realized out-of-sample Sharpe ratio. |
| Luck threshold (SR₀) | The Sharpe ratio the best of all the trials tried would be expected to reach with zero real skill. Your Sharpe needs to clear this to indicate a genuine edge. |
| OOS observations | Number of out-of-sample trading days behind the verdict. Below about 30, the verdict becomes Insufficient Data. |
| Train → OOS degradation | Whether performance drops significantly from training to out-of-sample. Training results are naturally inflated by selection, so read this alongside the validation comparison below. |
| Val → OOS degradation | The same comparison between validation and out-of-sample — both are genuinely held-out data, so this more reliably isolates real decay. |
| OOS autocorrelation | How much one day's return predicts the next. Above roughly 0.2, the Sharpe ratio (and these tests) can be somewhat less reliable. |

### Study-level context

Two more figures describe the whole search this portfolio came from, not this trial specifically — so they're identical for every trial in the same study.

| Figure | What it means |
|---|---|
| Backtest Overfitting Probability | The likelihood that the strategy which looked best during training actually underperforms the typical result out-of-sample, tested across many different ways of splitting the data. Considered low at 50% or below. |
| Trials searched | How many strategy variations the optimizer actually evaluated, and the effective number after accounting for how similar many of them were to each other. More trials searched raises the luck threshold. |

### The statistics behind the tab

Four statistical tests do the work behind this tab, run automatically once your study finishes:

- **Probabilistic Sharpe Ratio (PSR)** — the probability that the true Sharpe ratio exceeds a given threshold, adjusting for the shape of the return distribution (its skew and fat tails) rather than assuming returns are perfectly normal.
- **Deflated Sharpe Ratio (DSR)** — the same test, evaluated against the "luck threshold" described above, so it accounts for how many strategy variations were tried before this one was selected.
- **Backtest Overfitting Probability (PBO)** — repeatedly splits the study's shared history into blocks, checks whether the strategy that looked best on one half still looks best on the other, and reports how often it doesn't.
- **Degradation test** — a statistical test for whether performance in one period is materially worse than another, used to compare training against out-of-sample and validation against out-of-sample.

The exact degradation cutoff used is a z-score of 1.645; the card above rounds this to "z > 1.65."

These figures are saved with the portfolio and the study once computed, so Fintela doesn't need to recalculate them each time you open this tab — and they're automatically cleared if you delete the study or portfolio they belong to. See [study lifecycle](/docs/study-lifecycle) for when a study finalizes and its scores get computed.

## Profile

A shareable, investor-ready summary of one trial's results, built for export. It's designed to look right whether you're viewing it on screen or exporting it as a PDF — the interactive controls simply don't appear in the exported version.

> [!NOTE] Profile's tab visibility depends on your workspace
> Depending on how your workspace is configured, the Profile tab may not appear in the dropdown — but a direct link to it still opens and works. Its text currently displays in English only, regardless of your language setting.

### Masthead and metadata

The title reads `<strategy name> — Trial N`, or just `Trial N` if the strategy name isn't available. Alongside it: an asset-class label, a **Simulated** warning label (a reminder that these are backtested, not live, results), your organization's logo, and the **Investment report** kicker.

Three actions sit in the masthead:

| Action | What it does |
|---|---|
| Share | Copies a caption to your clipboard, opens LinkedIn so you can post it, and downloads the PDF version. |
| Promote | Adds this trial to your [Portfolio Groups](/docs/portfolio-groups). Once done, it's labeled **Promoted** and can't be promoted again — the action only ever runs once per portfolio. |
| Export PDF | Renders the report to a PDF you can download. Shows **Preparing…** while it works, and ignores extra clicks in the meantime. |

If the report hasn't finished loading yet, Export PDF tells you to wait. If Share manages to copy the caption but the PDF fails to generate, it tells you the caption copied but names the reason the PDF didn't.

Below the masthead, a metadata strip shows who prepared the report, when, the date the data runs through, the period covered, and a reference number combining the portfolio ID and trial number.

### Report sections

| Section | What it shows |
|---|---|
| Disclaimer | Performance is simulated; the out-of-sample period (marked on the chart) is the closest available proxy to live results. |
| Summary | A short, automatically generated write-up with a letter grade, covering Performance, Risk and Outlook — you can copy it with one click. |
| Performance | Portfolio vs. benchmark, both rebased to a starting value of $100,000, with training / validation / out-of-sample periods shaded on the chart. |
| Out-of-sample track record | Return, Sharpe and max drawdown since the out-of-sample period began — the closest available proxy to how the strategy would have performed live. |
| Headline figures | Total return, annualized return (CAGR), max drawdown, and Sharpe ratio, each shown against the benchmark. |
| Versus the market | Alpha, beta, up-capture, down-capture and correlation against your chosen benchmark. |
| Composition | Current holdings as of the report date, broken down by sector and asset type. |
| Traded assets — full history | Every asset traded, with trade count and its contribution to overall return. |
| Year by year | Strategy vs. benchmark return for every year, and the excess return each year. |
| Robustness note | The stored robustness verdict for this trial. |
| Disclosure | The full hypothetical-performance disclaimer. |

Total return and CAGR are measured over the whole backtest; max drawdown and Sharpe ratio are measured out-of-sample where the study has one, falling back to the whole backtest otherwise.

The benchmark defaults to Fintela's standard choice but you can change it from the chart's own selector. Promoting a trial from here is the same one-click action available from the dashboard's ranking cards — see [Portfolio Groups](/docs/portfolio-groups) and [Promoted Portfolios](/docs/promoted-portfolios).

## Renamed tabs

Nine separate pages were consolidated into today's six tabs. If you have an old bookmark or a saved link to one of the previous pages, it will still open — it just lands you on the tab that replaced it, with any study context you had selected preserved:

| Old page | Now part of |
|---|---|
| Metrics | Performance |
| Equity & Risk | Risk Analytics |
| Risk Managers | Risk Analytics |
| Trades | Transactions |
| Orders | Transactions |
| Investor | Profile |

> [!CAUTION] One old page doesn't redirect
> The very first version of the Overview page does not carry forward — if an old bookmark to it no longer works, just open the portfolio again from the [Portfolios Dashboard](/docs/portfolios-dashboard) or [Optimization Dashboard](/docs/optimization-dashboard).

The old page names Overview, Equity & Risk, Trades, Metrics, Risk Managers and Investor no longer label anything on their own. Orders is the one exception — it lives on as the heading of the Transactions tab's Orders section.

For what every metric means, see the [metrics reference](/docs/metrics-reference). For comparing many portfolios side by side rather than reading one in depth, see the [Portfolios Dashboard](/docs/portfolios-dashboard); for a single study's full search, see the [Optimization Dashboard](/docs/optimization-dashboard).
