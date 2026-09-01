---
title: Visualizations & Plots
section: Analysis & Portfolios
sectionOrder: 4
order: 5
published: true
updated: 2026-09-01
summary: A guide to every chart in Fintela — what each one shows, where to find it, and how to read it while you research, optimize, and manage your portfolios.
keywords: charts, plots, equity curve, drawdown, heatmap, distribution, correlation, sensitivity, parameter importance, export
---

Fintela draws charts throughout the platform — on the Portfolios dashboard, inside every portfolio
and study you open, in Portfolio Manager, Portfolio Groups, Markets, the Data Explorer, the Strategy
Sandbox, your Home page, and your usage dashboard. They all share the same visual language: the same
colors mean the same thing everywhere, and the same loading, error, and empty states appear
everywhere, so once you learn to read one chart you can read them all. This page walks through what
each chart shows, where to find it, and how to get the most out of it.

## How Fintela's charts work

Most of what you'll see across the platform falls into two groups.

**Full interactive charts** — line charts, bar charts, scatter plots, heatmaps, treemaps, and the 3D
parameter explorer — let you hover for exact values, zoom into a period, and, on many of them, toggle
individual series on and off from the legend.

**Quick-reference tables** — the Calendar Heatmap, Sector & Country Performance, Metrics Comparison,
Cross-Group Correlation, the Consensus Book, and a handful of similar grids — look like charts
(cells are shaded to show scale) but behave like tables: hover a cell for its value, but there's no
zooming, no legend, and no image export. Knowing which kind you're looking at sets your expectations
for what you can do with it.

> [!NOTE]
> Wherever this page describes zoom, legend, or export behavior, that guidance applies to the
> full interactive charts. The quick-reference tables mentioned above only ever offer a hover
> tooltip.

## Chart controls you'll find everywhere

Nearly every chart card follows the same layout, so the controls become familiar fast:

- An **info icon** next to the title explains exactly what the chart plots and, where it matters,
  which convention or formula it uses.
- A **gear icon** ("Chart settings") opens options specific to that chart — bin counts, rolling-window
  length, and similar.
- **Quick timeframe buttons** let you jump straight to a period: **All · Since creation · Train · Val
  · OOS · RLP · YTD · MTD · 1M · 1W**. Not every button appears on every chart — **Train** and **Val**
  only show up once a study has a defined training/validation split, **OOS** only once an
  out-of-sample window is configured, **RLP** (real-life performance) only appears once a portfolio
  has actual trading history, and **Since creation** only appears on group-level charts, and only
  while the group is at least that old.

Several pages also carry a page-level date filter above their charts — the Portfolios dashboard, a
portfolio's Performance page, the Transactions tab, and the Strategy Sandbox's result tabs. It groups
your options into a **Study periods** row (Train / Val / OOS / RLP, each shown only when it applies)
and a **Calendar ranges** row (YTD, QTD, MTD, or Custom). Custom lets you either type a number of
trailing days, weeks, months, or years, or pick exact From and To dates.

## Performance charts

| Chart | Where you'll find it | What it shows |
|---|---|---|
| Equity Curve — comparing trials | Portfolios dashboard | One line per trial you've checked in the ranking |
| Equity Curve — single portfolio | Performance tab | One portfolio against an optional benchmark, with your Train/Val/OOS/RLP periods shaded |
| Equity Curve — Risk Analytics | Risk Analytics tab | The same curve, shown large and filled |
| Equity — comparing groups | Portfolio Manager | Multiple groups compared side by side, on a Y-axis you choose |
| Equity Curve — Rank & Build | Portfolio Groups → Rank & Build | Every candidate portfolio, indexed to the same starting point |
| Metrics Radar | Performance tab; Strategy Sandbox → Metrics | How a portfolio scores across several metrics at once |
| Metrics Comparison | Performance tab; Strategy Sandbox → Metrics | A color-coded table version of the same comparison |
| Growth vs. benchmark | Profile tab | Portfolio and benchmark growth, both starting from the same dollar amount |

### Equity Curve — comparing trials

The Portfolios dashboard's main chart overlays the equity curve of every trial you've checked in the
ranking below it — check or uncheck a card and its curve appears or disappears here. See
[Portfolios dashboard](/docs/portfolios-dashboard) for how the ranking and selection work.

Each trial gets its own line, labeled by its trial number and study name rather than any internal ID,
so you can tell curves apart at a glance. Hover any point to see the exact value for every visible
curve at that date, and use the small legend below the chart to keep track of which color is which.
Scroll to zoom in on a period, and use the **View last** field above the chart to jump straight to a
number of trailing days, weeks, months, or years. If nothing is checked yet, the chart prompts you to
check a trial in the ranking to plot its curve.

### Equity Curve — a single portfolio

On a portfolio's Performance tab, this is the most detailed chart in the product. See
[Portfolio Detail](/docs/portfolio-detail) for the rest of that page.

- Your portfolio's own curve is shown solid, with a shaded area underneath.
- An optional **benchmark** — pick any ticker from the autocomplete, filterable by exchange — overlays
  as a dashed line.
- Shaded bands mark your **Train**, **Val**, **OOS**, and **RLP** periods, so you can see at a glance
  which part of the curve was in-sample and which was live or held out.
- Dashed vertical lines mark each **rebalance date**, and a labeled line marks each stage boundary.
- A solid line marks whichever date you currently have open on the Holdings tab, and a dashed line
  marks the portfolio's creation date.
- A toggle switches between **Aligned to window start** (every view re-based to start together) and
  **Raw values**.

> [!WARNING]
> To pan this chart, hold **Shift** while dragging — a plain drag does nothing here. Scrolling zooms
> as usual. Zooming all the way back out clears the selection rather than leaving you on a range that
> happens to cover everything, which is why any metric strip tied to your selected window resets to
> the full period when you do this.

An **Invert (what-if)** button re-runs the same trial with every position flipped from long to short
(and back), and overlays the result in place of the benchmark — a quick way to sanity-check whether
your edge is directional. A small strip then shows Total Return, CAGR, Sharpe Ratio, and Max Drawdown
for the inverted version.

### Equity — comparing groups in Portfolio Manager

Portfolio Manager's comparison chart, titled **Equity**, is the one place where you choose what the
Y-axis plots. See [Portfolio Manager](/docs/portfolio-manager) for the toolbar around it.

- The **Y axis** picker lets you switch between **Equity** (each group's value over time, rebased so
  every curve starts together) and **Drawdown** (how far below its own peak each group currently
  sits), plus any performance, risk, risk-adjusted, recovery, or distribution metric — and
  benchmark-relative metrics once you've set a benchmark. A handful of trade-only metrics (win rate,
  profit factor, average trade duration, expectancy) aren't offered here, since they have no
  meaningful curve to draw.
- For metrics that use a rolling window, a window-size field sits beside the picker.
- Each group keeps a consistent color; a benchmark line is dashed, and any group beyond the standard
  eight-color set fades into a neutral gray and drops out of the legend rather than being given an
  invented color.
- Shape-coded markers show each portfolio's **lifecycle**: a triangle for when it entered training, a
  circle for validation, a square for out-of-sample, and a diamond for the date it was promoted, with
  a small legend explaining the shapes.
- A diamond and dashed line mark each group's creation date.
- A dotted reference line marks the metric's benchmark or target value, and stays visible even if you
  uncheck every group.
- You can zoom by scrolling, drag to pan, or use the slider at the bottom.

The chart's own notes tell you when a group has no value over your selected window, when data has
been thinned to keep things responsive, and — via the info icon — exactly which definition of the
metric you're looking at (useful for something like rolling Sharpe, which can reasonably be computed
more than one way). If you uncheck every group, the chart asks you to check at least one.

Your Home page's **Active Portfolio Group Performance** card is this same chart, locked to Equity,
with its own **Timeframe** control (4, 8, 12, or 26 weeks).

### Equity Curve — Rank & Build

On [Portfolio Groups](/docs/portfolio-groups)' Rank & Build screen, every candidate is indexed to 100
from its first common date, so you're comparing shape and relative growth rather than dollar values.
Drag to zoom in, and the subtitle updates to show the exact range you're looking at. Hovering a row
in the ranking table dims every other curve so the one you're interested in stands out.

### Metrics Radar

A spider chart normalizing every selected metric onto the same scale, so a larger shape generally
reads as better — risk metrics are the exception, so check each metric's info tooltip, or see the
[Metrics Reference](/docs/metrics-reference). The exact raw value for each metric still shows up in
the tooltip even though the shape itself is normalized. A **Select metrics** picker controls which
ones are plotted, and the chart needs at least two portfolios and three metrics selected before it
can draw anything meaningful — otherwise it tells you so.

The same chart appears, at a larger size, inside the [Strategy Sandbox](/docs/strategies)'s Metrics
view.

### Metrics Comparison

Right below the radar sits a color-coded table version of the same comparison: one row per metric,
one column per stage (Train/Val/OOS/RLP as applicable), plus **Best** and **Signal** columns. Each
cell is tinted green or red by how strong that value is relative to the metric's normal range, so you
can scan a whole portfolio's profile at a glance without reading every number. It appears on the
Performance tab and, again, inside the Strategy Sandbox.

### Growth vs. benchmark

On the Profile tab, this chart plots your portfolio and its benchmark as dollar growth, both starting
from the same notional $100,000 — a simple, investor-friendly way to show relative performance
without getting into percentages. Train/Val/OOS shading carries over from the main equity chart.

## Risk charts

Fintela's core risk views — Drawdown, Volatility, Rate of Change (momentum), and Sharpe — appear in
two places: as comparison charts on the Portfolios dashboard, built for comparing your checked trials
against each other, and as larger, single-portfolio views on a portfolio's Risk Analytics tab. The two
are the same underlying chart, just labeled slightly differently for their context — the dashboard's
copy leans on words like "rolling" to signal you're comparing several trials at once, while the tab
describes the one portfolio you have open.

### Drawdown, Volatility, Rate of Change, and Sharpe over time

Each of these four risk views can be switched between a **time series** (a line per selected
portfolio, showing the metric evolve day by day) and a **histogram** (its distribution over the same
period) using a toggle in the card header.

- The time-series line responds to the same zoom, pan, and stage shading as the equity charts, plus a
  slider for fine control.
- Colored bands and labels mark the boundary between Train and Val, Val and OOS, and so on, so you can
  see immediately whether a spike in volatility or a deep drawdown happened in-sample or
  out-of-sample.
- A **Window size** control sets how many days each rolling calculation looks back over — Drawdown
  doesn't have one, since drawdown isn't a rolling calculation.
- On the Holdings tab, this same chart doubles as a way to see when you held a position: selecting
  tickers in the holdings table paints a translucent band over the periods you actually held them.

On the dashboard, these four charts render without their own date filters and legends (they follow
the page-level filter instead), which makes them look a bit plainer than the same charts on Risk
Analytics — that's intentional, not a bug.

The [Strategy Sandbox](/docs/strategies)'s Equity & Risk tab reuses the same four charts, switchable
between line and histogram, under the headings Drawdown, Rolling Volatility, Rate of Change, and
Rolling Sharpe Ratio.

### Distribution and density view

Switch any of the four risk charts to histogram mode and its settings gear lets you adjust the number
of bins and toggle **Density**.

- With Density off, you get a standard histogram: bars over value ranges, with bin edges shared across
  every portfolio you're comparing so the bars line up and stay comparable.
- With Density on, the histogram becomes a smooth curve instead — useful when you want to compare the
  overall shape of two distributions rather than counting exact bins.

If every value in the selection is identical, the chart falls back to a single bar per portfolio
rather than showing an empty plot.

### Daily return waterfall

On Risk Analytics, a waterfall icon next to the equity chart switches it into **Cascade** mode: a bar
chart of each day's return, colored green for a gain and red for a loss, that reads left to right like
a running story of the portfolio's performance rather than a single smooth line. Hover any bar for
that day's return and the cumulative return up to that point.

> [!TIP]
> The cascade re-bases every time you zoom — whatever window you're looking at always starts from
> zero, so a zoomed-in view reads as a clean, self-contained period rather than an offset slice of the
> full history.

### Deflated Sharpe: skill vs. luck

A portfolio's Robustness tab opens with a **Deflated Sharpe Analysis** — Fintela's answer to "is this
result real skill, or did I just get lucky running a lot of trials?" — with a verdict of **Well
Trained**, **Borderline**, **Overfit Risk**, or **Insufficient Data**.

- A **gauge** shows the Deflated Sharpe itself, color-coded to those verdict thresholds, with an outer
  ring showing the study's overall probability of backtest overfitting.
- A **Skill vs. luck** bar chart compares your portfolio's actual out-of-sample Sharpe against the
  Sharpe the luckiest of your study's trials would be expected to reach by chance alone — clearing
  that bar is the real evidence of skill.

If there isn't enough data to compute a reliable answer, the chart says so explicitly rather than
showing a number you might mistake for a real verdict.

## Optimization charts

These charts live on a study's analysis page, across its **Overview**, **Robustness**, **Families**,
and **Parameters** tabs. See [Optimization Dashboard](/docs/optimization-dashboard) for the ranking
and comparison tools around them.

Above the Parameters charts, a **Color** control lets you switch every scatter and
parallel-coordinates chart between coloring by metric value and coloring by strategy family, so you
can see at a glance whether a cluster of good results also shares a behavioral fingerprint.

### Optimization Evolution

A line showing how your optimizer's results evolved trial by trial, with the best trial found so far
marked separately. Switch between **Raw** (every trial, in the order it was tried) and **Best** (the
running best-so-far) using the Mode control above it. A summary strip shows your total trial count
and the best value found, along with which iteration produced it. Click any point to jump straight
into that trial's own analysis. This chart also includes a small toolbar to reset your zoom and save
the chart as an image — one of the few charts on this page that can.

### Result Distribution

A histogram of how many trials landed in each range of your objective metric, so you can see the
overall shape of your search — a tight cluster near the best value tells a very different story than
a wide, flat spread. A **Bins** field lets you set the bin count manually, or leave it on automatic.
Below the chart, a stat strip gives you the trial count, mean, standard deviation, and min/max.

### Parameter Impact

One small scatter plot per hyperparameter your study searched over, laid out in a grid: each one
plots that parameter's value against your objective metric, colored from cool to warm as the metric
improves, so you can see at a glance which parameter values tend to produce your best results. Click
any point to open that trial directly.

### 3D Parameter Explorer

An interactive 3D plot for exploring how two parameters and your objective metric relate all at once.
Pick which parameter — or the metric itself — drives each of the X, Y, and Z axes; each axis's list
narrows automatically so you can't put the same thing on two axes at once. Categorical parameters
(ones without a numeric ordering) aren't offered here, since there's no meaningful 3D position for
them; the chart tells you which ones were left out.

Switch between **Scatter** (every trial as its own point, colored by metric value — click a point to
open that trial) and **Surface** (a terrain connecting the actual trial points, so you can see the
shape of the parameter landscape rather than just a cloud of dots; clicking does nothing in this
view). You can rotate, zoom, reset the camera, and save the view as an image.

### Hyperparameter Patterns

A parallel-coordinates chart: one vertical axis per hyperparameter your study searched, plus an axis
for the objective itself, with one line per trial connecting its values across every axis. Lines are
faint by default and highlight on hover, so patterns — like "every good trial used a short lookback
and a wide stop" — jump out visually in a way a table can't show. A **Top-N** control, defaulting to
your best 500 trials, keeps the chart from turning into an unreadable tangle on a large study.

### Parameter importance

On the Overview tab, under **Hyperparameter Importances**: a horizontal bar chart showing how much of
your objective's variance each parameter explains, with confidence whiskers on each bar so you can
tell a strong signal from a noisy one. A **Method** toggle lets you switch between two different
statistical approaches (fANOVA and MDI) for a second opinion. Headline tiles above it call out the
most influential parameter, how many effective parameters your search actually used, how many trials
were scored, which parameter looks like the biggest overfitting risk, and how much train/validation
agreement there is.

If a parameter's effect flips direction between train and validation, that's flagged explicitly — a
good sign the parameter was picking up noise rather than a real edge. A related **Overfitting
divergence** chart puts this side by side: parameters that mattered in training but not in validation
are exactly the ones most likely to have driven overfitting rather than genuine skill.

Because parameter importance can only be computed over periods your study actually evaluated, you may
need to pick a specific stage (Train, Val, OOS, or RLP) in the filter above before it appears.

### Robustness surfaces

The Robustness tab is the deepest look at whether your study's results hold up. It opens with a
scorecard — probability of backtest overfitting (PBO), the luck threshold, effective trial count,
Sharpe variance, and scored trials — carrying a verdict of **Well trained**, **Borderline**, **Overfit
risk**, or **Uncertain**, then seven supporting charts capped to your best 40 trials by Deflated
Sharpe, so the view stays readable:

| Chart | What it tells you |
|---|---|
| CSCV overfitting distribution | How your in-sample best trial ranked out-of-sample, across many resampled splits — a distribution centered below zero is a warning sign |
| Trial Sharpe distribution vs. luck | Where your trials' in-sample Sharpe ratios fall relative to the luck threshold |
| Deflated Sharpe across trials | The distribution of Deflated Sharpe across every scored trial |
| In-sample vs. out-of-sample rank | Whether your best in-sample trials stayed near the top out-of-sample, or scattered |
| Train → Validation → OOS degradation | How each trial's performance held up, or fell off, moving from training into validation and out-of-sample |
| Equity curves by window | Every capped trial's equity curve, so you can see performance directly rather than just a single statistic |
| Per-trial robustness matrix | A heat-tinted grid of robustness statistics per trial, so you can scan for red flags at once |

Every chart here carries its own plain-language explanation in its info icon, and a caption spelling
out how to read the specific numbers shown. If a study hasn't finished, or hasn't produced enough
scored trials yet, the tab tells you it isn't ready rather than showing a misleading partial picture.

### Strategy families

The Families tab groups your study's trials by how similar their equity curves actually are — a fast
way to answer "did my search really find dozens of different strategies, or the same handful wearing
different parameters?"

- A headline banner states how many distinct strategy families your trials actually cluster into,
  with a **Granularity** control if you want a finer or coarser grouping.
- A **Behavioral map** scatter plot places every trial by return similarity and colors it by family,
  with bubble size showing out-of-sample Sharpe, so you can spot a family that clusters tightly and
  also performs well.
- A **Representative equity per family** panel shows the single most typical trial from each family.
- A card per family gives you a small trend line plus that family's mean return, mean Sharpe, mean OOS
  Sharpe, and return dispersion, with a shortcut to open its best trial.
- A full **Trials by family** table lists every trial with its family, return, Sharpe, OOS Sharpe, max
  drawdown, and fitness score, exportable to CSV.

If clustering hasn't finished computing yet for a study, the tab tells you so — it appears
automatically once processing catches up.

The Overview tab's **Failed trials** section, collapsed by default, shows a bar chart of why trials
failed, with a table underneath listing every failed trial, its reason, and the parameters that
produced it — useful for spotting a parameter combination that's simply invalid rather than just
underperforming.

## Allocation & holdings charts

| Chart | Where | What it shows |
|---|---|---|
| Allocation Snapshot | Holdings tab | Your holdings on a chosen date, sized by position |
| Historical Allocation | Holdings tab | How your allocation mix shifted over time |
| Composition over time / on a date | Portfolio Manager → Holdings | The same two views, across a group of portfolios |
| Consensus book | Portfolio Manager → Holdings | Which positions your groups agree or disagree on |
| Holdings Heatmap / Return Correlation | Rank & Build | Overlap and correlation across candidate portfolios |
| Cross-group correlation | Portfolio Manager → Metrics | How correlated your groups' returns are with each other |
| Holdings Snapshot | Strategy Sandbox → Holdings | A quick donut of a single test run's holdings |
| Sector allocation / Asset type | Profile tab | A simple breakdown for sharing |

### Allocation Snapshot

A treemap — tiles sized by position weight — showing exactly what a portfolio held on a given date.
Click any tile to select that holding, which highlights the periods you held it on the equity chart
above. A dropdown lets you regroup the tiles by ticker, type, sector, industry, country, or currency
instead of by individual position, and side labels show your long and short exposure alongside net
and gross totals.

### Historical Allocation

A stacked area chart showing how your allocation mix (by whichever grouping you've chosen) evolved
over time, as a percentage of the portfolio. Short positions render as negative area below the zero
line, so a portfolio running long and short at once reads clearly rather than canceling out.

### Composition over time and composition on a date

Portfolio Manager's Holdings tab offers a **View** picker with three lenses:

- **Concentration** — a table of how concentrated your holdings are: your top 5 positions' combined
  weight, the effective number of names, and both gross and net exposure.
- **Composition over time** — the same stacked-area view as above, across your selected groups, with
  any uninvested balance shown as cash.
- **Composition on a date** — the same treemap view as above, with short-heavy buckets visually
  flagged, plus a table listing every ticker's side, weight, and sector.

A **Group by** control lets you switch the grouping dimension (ticker, sector, industry, theme,
sub-theme, or sub-portfolio), and a **Weight** toggle switches between net and gross.

Below that, the **Consensus book** shows, bucket by bucket, which of your groups hold a position and
how much — a fast way to see where your groups agree (crowded into the same trade) and where they
diverge (hedged against each other). A date scrubber at the bottom lets you step through history; any
date you land on shows the most recent snapshot on or before it.

> [!NOTE]
> The composition area chart doesn't zoom — its window is controlled entirely by the toolbar above it
> and the date scrubber below, keeping the card compact.

### Holdings and correlation heatmaps

On Rank & Build, two heatmaps sit below the equity overlay, both collapsed by default — the
correlation calculation can take a moment on a large selection, so it only runs once you open it:

- **Return Correlation** — how closely each pair of candidate portfolios' daily returns move together.
  A value near +1 means low diversification benefit from holding both; near −1 means they tend to
  offset each other.
- **Holdings Heatmap** — each candidate's most recent allocation, ticker by ticker, so you can see
  overlap in what they actually hold, not just how their returns behave.

Portfolio Manager's **Cross-group correlation** table works the same way for your groups, though as a
simple table rather than a full heatmap. A blank cell there means two groups don't share enough
overlapping trading days for a reliable correlation — not that they're actually uncorrelated — and the
table tells you as much.

## Trade charts

| Chart | Where |
|---|---|
| Trades History | Transactions tab |
| Return vs. Duration, Outcome by Side, MFE/MAE Efficiency | Transactions tab; Strategy Sandbox → Trades |
| Calendar Heatmap | Transactions tab; Strategy Sandbox → Trades |
| Scaling trend | Transactions table, Scaling column |
| Trade views | Portfolio Manager → Trades |
| Monthly Activity, Top Tickers | Strategy Sandbox → Orders |

A single filter bar — ticker, status, date — drives every chart on the Transactions tab, so narrowing
to one ticker or date range updates the whole page at once.

### Trades History

A bar chart of every closed trade's return, sorted by exit date and colored green or red by whether it
won or lost. Your most extreme trades, best and worst, get their value labeled directly on the bar so
the standouts are easy to spot without hovering each one.

### Return vs. Duration, Outcome by Side, and MFE/MAE Efficiency

Three complementary views of your trade history:

- **Return vs. Duration** — each closed trade plotted by how long you held it against the return it
  produced, marked by win/loss and long/short, so you can see whether your edge tends to show up
  quickly or needs time to play out.
- **Outcome by Side** — wins and losses broken out separately for your long trades and your short
  trades, with an overall win-rate caption, so you can tell which side of the book is actually
  carrying your results.
- **MFE / MAE Efficiency** — each trade's maximum adverse move (the most heat you took before it
  worked out, or didn't) plotted against its maximum favorable move (the best unrealized gain you
  saw), colored by whether it ultimately won or lost — useful for judging whether your exits are
  capturing the moves your entries are finding.

The trades table beside these charts lists every trade's ticker, side, entry and exit details, days
held, return, and P&L, plus a tiny inline trend for any trade you scaled into more than once.

### Calendar Heatmap

A calendar grid — daily, weekly, or monthly — shaded by whichever metric you pick: daily return, trade
P&L, or capital invested. Hover any cell for its exact value; a gradient legend shows the scale's
minimum and maximum. This same calendar appears on both the Transactions tab and the Strategy
Sandbox's Trades tab.

### Portfolio Manager trade views

A **View** picker switches Portfolio Manager's Trades panel between five lenses:

| View | What it shows |
|---|---|
| Trade metrics | A full table of realized and open trade statistics per group — count, P&L, win rate, payoff ratio, profit factor, expectancy, average hold time, position size, alpha, and how often trades beat the benchmark |
| Timing | Monthly realized P&L as bars, with a running cumulative line per group, so you can see both the pace and the trend of trading activity |
| Distribution | A histogram of trade outcomes, binned identically across every group so they stay comparable |
| Ledger | A full table of every attributed trade |
| Contribution | Your top tickers by total P&L, so you can see which names are actually driving, or dragging, your groups' results |

The Strategy Sandbox's Orders tab adds two of its own charts — **Monthly Activity** (buy and sell
order volume by month) and **Top Tickers** (your most-traded names) — alongside simple tiles for total
orders, unique tickers, and your first and last order dates.

## Market charts

Everything in this section lives on the [Markets](/docs/market) page, across its Market Pulse,
Ticker, Sectors & Countries, and Screener tabs.

### Market Heatmap

A treemap of the market, tile-sized by market cap or dollar volume (your choice) and colored by
return — green for gains, red for losses, with intensity scaled to the day's actual spread rather than
a fixed scale, so a genuinely volatile day still reads clearly. Click a group tile, like a sector, to
zoom into it and see its members; click an individual ticker's tile to open it on the Ticker tab. A
**Group by** control lets you split by sector, industry, theme, or sub-theme, and a **Filters** panel
narrows the universe by market-cap tier, minimum price, minimum volume, and a safeguard against
implausible price jumps skewing the color scale.

### Price chart

A ticker's price chart, switchable between a simple **Line** view (with optional 50-day and 200-day
moving averages overlaid) and **Candlesticks** (full OHLC bars with volume shown underneath, linked so
zooming one zooms both). Zoom and pan work the same way as elsewhere in the product. If a ticker has
no price history in your selected window, the chart tells you plainly rather than showing an error.

### Other ticker charts

A ticker's page carries several smaller supporting charts:

- **News Sentiment** — daily article count and average sentiment score side by side, so you can see
  whether a sentiment shift came with a burst of coverage or a quiet drift.
- **Fund Profile** — a donut of sector weights plus a table of an ETF or fund's top 10 holdings.
- **Corporate Actions** — recent dividends and splits by date.
- **Volatility Watch**, on Market Pulse — the most volatile tickers ranked by recent price swings, each
  with a small inline trend.
- **Treasury Yields**, on Market Pulse — the current yield curve against where it stood a week ago,
  with a spread reading that flags an inverted curve when short rates sit above long rates.

### Sector and country performance

A color-coded table of returns by sector or country across several horizons — today, 1 week, 1 month,
6 months, YTD, 1 year, 5 years, and 10 years — plus each group's best-performing horizon and how many
tickers back it.

> [!TIP]
> Each horizon column is colored on its own scale. A +3% day is a big move; +3% over ten years is
> barely anything — using one shared scale for both would make every long-horizon column look
> uniformly strong and tell you nothing useful.

A **Weighting** control lets you switch between equal weighting, market-cap weighting, and ETF-based
weighting, and an **Emphasis** option highlights either each row's best/worst performer or the column
leaders.

### Top Performers

On the Screener tab, a ranked bar chart — or a plain table, your choice — of the tickers matching your
current filters, sorted by whatever value you're screening on. Only a handful of bars show at once;
scroll inside the chart to see further down the list rather than the chart shrinking every bar to fit.

The Screener's **Evaluate & compare** action opens a side-by-side comparison of up to 8 tickers at
once, viewable either by time window or by metric, with each metric labeled as higher-is-better,
lower-is-better, or purely informational.

## Data Explorer charts

The [Data Explorer](/docs/data-explorer) gives you a handful of focused charts for checking your data
before you build on it:

| Chart | What it shows |
|---|---|
| Feature time series | A single data column plotted over time, so you can eyeball it for gaps or outliers before using it |
| Time coverage | How many tickers and records you have data for, over time |
| Groupings explorer | How many constituents a custom grouping held on any given day |
| Macro | A single macro-economic indicator for a chosen country |
| Rates | The current yield curve, plus a history view for any one tenor you pick |

An events calendar sits alongside these as a simple day-by-day list rather than a chart.

## Home dashboard visuals

Your Home page is a customizable, drag-to-rearrange grid of cards — hide any you don't use, and reset
the layout at any time if you want it back to default. Its visuals include:

| Card | What it shows |
|---|---|
| Active Portfolio Group Performance | The same comparative equity chart as Portfolio Manager |
| Monthly Revenue Breakdown | Each strategy's share of the month's revenue |
| All Active Portfolio Groups — Financial Results | A color-coded results table, with top performers highlighted |
| Asset Exposure | A donut of what you're currently exposed to, with a toggle for all holdings, live only, or paper only |
| Most Traded Assets | Your most-traded names by trade count, alongside their realized P&L |
| Deployed Portfolios per Strategy | A simple bar list of how many live portfolios each strategy has running |
| Catalog summaries | Quick donuts summarizing your Asset Groups, Strategies, Studies, and Portfolios |

## Usage and token charts

If you're an account owner, your usage dashboard shows how your organization's Fintela usage breaks
down:

- A **usage timeline** — stacked bars showing activity by type over time.
- **Token Analytics** — five charts covering token consumption over time, tokens acquired versus
  consumed (your budget utilization), a breakdown by category, your top consumers, and a
  member-by-category intensity view.

Filters let you switch granularity (daily, weekly, monthly), narrow to specific categories or members,
and break the view down by category or by member. See
[Tokens and Billing](/docs/tokens-and-billing) for what drives consumption in the first place.

## Colors and what they mean

Fintela uses one consistent color system across every chart, in both light and dark mode:

- Each series — a portfolio, a group, a trial — gets one of eight fixed colors, always assigned in the
  same order, so a given portfolio's color stays recognizable as you move between charts.

> [!CAUTION]
> Colors are never invented for extra series. Once a comparison has more than eight items, the rest
> render in a neutral gray and drop out of the legend — which is why Portfolio Manager's comparison
> chart shows extra groups as a muted gray swarm rather than making up new hues.

- **Green and red** are reserved for signed values — gains and losses, P&L bars, daily-return
  waterfalls — and are never reused as ordinary series colors in a chart that also has a legend, so
  you never have to guess whether green means "portfolio 3" or "this was a winning trade."
- **Heat scales** follow the same two patterns everywhere: a single-direction blue ramp for "how
  much" (allocation weight, hyperparameter density), and a red-through-green diverging scale for
  "better or worse than a midpoint" (correlation, metrics comparison, robustness).
- Text drawn over a colored tile — on treemaps and heatmap cells — automatically switches between
  light and dark ink to stay readable against whatever shade it's sitting on.

## Zooming, panning, and comparing charts

| Behavior | Where |
|---|---|
| Scroll to zoom, plus a slider | Most risk time series, Trades History, the daily-return waterfall, Historical Allocation, Portfolio Manager's Equity chart, the Price chart, Optimization Evolution, Result Distribution, the Data Explorer's feature and coverage charts |
| Scroll to zoom, no slider | The dashboard's combined equity chart, Rank & Build's equity overlay, the groupings timeline, the Treasury Yields history |
| No zoom | Portfolio Manager's composition chart, every treemap, every heatmap, and every quick-reference table |
| Scroll within the chart | Top Performers, once you're past the first handful of bars |
| Shift-drag to pan | The single-portfolio equity chart |

On the Portfolios dashboard — and only there — hovering any chart moves a synced crosshair across
every other chart on the page at the same date, so you can compare a spike in one chart against what
was happening in another at that exact moment. Zoom itself isn't linked between them, on purpose: the
charts don't share the same kind of x-axis, and linking zoom used to let zooming one chart accidentally
strand another on a narrow range you didn't mean to lock into.

Portfolio Manager's comparison chart, on the other hand, does link zoom across every stacked panel, so
they always stay on the same window as each other.

## When data is loading, missing, or something goes wrong

Every chart follows the same pattern, so you always know what state you're in:

- **Loading** — a simple spinner, holding the card's normal size so the page doesn't jump around while
  it fetches.
- **Error** — a clear "Couldn't load this chart" message with the underlying reason, and a **Retry**
  button wherever one makes sense.
- **Empty** — a plain "No data available" message, often refined to your specific situation — for
  example, "no equity data" versus "check a trial to plot its curve" — so it's clear whether something
  is actually wrong or you just haven't made a selection yet.

## Charts adapt to your device

Charts resize themselves to fit whatever space their card has, rather than assuming a fixed size, so
they stay readable whether you're on a full monitor or a narrower window. On phones and tablets,
several charts — including the dashboard's risk charts and the single-portfolio equity chart — shrink
further to keep everything visible without scrolling sideways, and a study's Parameters grid switches
to one plot per row below tablet width, since the scatter plots and parallel-coordinates chart need
the extra room to stay legible.

## Exporting charts and data

Most charts are built for reading in the moment rather than exporting, but a handful of surfaces let
you take the data or the image with you.

> [!WARNING]
> Only a few charts export directly as an image. Saving an image by right-clicking works on some
> charts as a general browser behavior, but it isn't something every chart supports intentionally.

| Where | What you can export |
|---|---|
| Token Analytics (usage dashboard) | Every chart there has an Export menu with Download CSV and Download PNG |
| Optimization Evolution | A small built-in toolbar to reset the zoom and save the chart as an image |
| 3D Parameter Explorer | A toolbar to reset the camera angle and download an image |

Beyond images, you can also pull data out as:

- **Export hyperparameters / Export snapshot / Export best trial**, from a study's header — downloads
  every completed trial with its strategy and risk-manager parameters and the metric value you
  currently have selected.
- **Export CSV** on the Families tab's trials table.
- A full **PDF tearsheet** from the Profile tab — a multi-page, investor-ready report generated right
  in your browser.
- A **shareable image card** from the Profile tab, sized for sharing on LinkedIn, where that feature
  is available on your plan.

## Things worth knowing

A few habits will save you some confusion:

- **No chart uses a logarithmic scale.** If you're comparing values that span very different
  magnitudes, keep that in mind when reading the axis.
- **Quick-reference tables aren't full charts.** The Calendar Heatmap, Sector & Country Performance,
  Metrics Comparison, Cross-Group Correlation, the Consensus Book, and a few similar grids give you
  hover tooltips only — no zoom, no legend, no image export.
- **Benchmark comparisons aren't identical everywhere.** The single-portfolio equity chart, the
  rolling risk charts, Portfolio Manager's comparison chart, and the Profile tab's growth chart each
  have their own benchmark controls, so don't expect the exact same behavior across all four.
- **Always check the axis unit before comparing charts.** Market charts typically show returns
  already as percentages; portfolio equity curves are more often shown as an index or a fraction.
  Read the axis label rather than assuming.
- **A blank correlation cell means "not enough shared history," never "zero correlation."** Two
  portfolios or groups need enough overlapping trading days before a correlation is considered
  reliable enough to show.
- **Changing a rolling window or a filter always gives you a fresh, current number** — never a stale
  cached one, even if the answer happens to look the same as before.
- **A small number of charts may not be fully polished for light mode yet**, including some market
  and optimization charts — if a chart's colors look unexpectedly dark while the rest of your screen
  is in light mode, that's a known rough edge rather than a data issue.
