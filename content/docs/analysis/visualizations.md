---
title: Visualizations & Plots
section: Analysis & Portfolios
sectionOrder: 4
order: 5
published: true
updated: 2026-08-18
summary: Every chart Fintela renders — what it plots, where it appears, and how to read it.
keywords: charts, plots, equity curve, drawdown, heatmap, distribution, correlation, pareto, sensitivity, parameter importance, export
---

Fintela draws charts on the Portfolios dashboard, every portfolio and study tab, the Portfolio
Manager, Portfolio Groups, Markets, Data Explorer, the Strategy Sandbox, Home and the usage
dashboard. Nearly all of them are Apache ECharts canvases sharing one registered theme per colour
mode, one eight-colour categorical palette and one set of loading, error and empty states — so a
curve, a bar or a heat cell means the same thing wherever you meet it. This page catalogues the
charts the product ships: each one's exact title, the route and panel it lives in, what its axes
carry, the controls in its header, and how to read it.

## Rendering stacks

Four rendering approaches are in use. Which one a visual uses decides what interactions it has, so
the distinction is not cosmetic.

| Stack | Used by | What you get |
|---|---|---|
| Apache ECharts (`echarts-for-react`) | The large majority of charts | Axis tooltips, wheel zoom, legend toggles, `markLine`/`markArea` annotations |
| Plotly (`react-plotly.js`), lazy-loaded | Exactly one component — the **3D Parameter Explorer** | Orbit camera, modebar with camera reset and image download |
| Hand-rolled inline SVG | One shared `Sparkline` (Markets' Volatility Watch and metrics-comparison dialog, the Portfolios ranking cards and table, the Portfolio Manager group table), the Home donut rings, the LinkedIn share card | A drawn shape and nothing else |
| Hand-rolled DOM (MUI boxes and table cells) | Calendar Heatmap, Sector & country performance, Metrics Comparison, Cross-group correlation, Metrics matrix, Consensus book, indicator range strip, market breadth bar, Home bar lists | Heat-tinted cells with a hover tooltip — **no zoom, no legend toggle, no brush, no export** |

There is no Recharts and no D3 anywhere in the app.

> [!NOTE]
> The DOM visuals in the last row are tables and bars, not charts. They are catalogued here because
> they read as charts, but the interaction guidance in this page's ECharts sections does not apply
> to them.

## Shared chart frame and controls

Most cards are built from the same small set of wrappers.

| Component | Role | Notable behaviour |
|---|---|---|
| `SectionCard` | The standard chart frame — title, subtitle, caption, an `info` tooltip on the title, and a right-aligned action slot | When empty it swaps the body for an empty state titled with the caption, defaulting to the literal `No data` |
| `ChartBox` | The measured ECharts canvas | Has **no height prop** on purpose: it measures its own box (floor 120px) and calls `resize()` when that changes. `notMerge` defaults to `true`, the opposite of ECharts' own default |
| `ChartStatePaper` | Loading / error / empty surface for the portfolio charts | Keeps the card's exact height in every state, so layout never jumps |
| `ChartSettingsMenu` | The gear popover, 260px wide | Callers title it **"Chart settings"** |
| `ChartFrame` | The only generic export-capable frame — Token Analytics only | Header menu **"Export"** with **"Download CSV"** and **"Download PNG"** |

Quick-timeframe presets, where a chart offers them, come from one shared helper so no chart hardcodes
its own list. The canonical button set, in order, is **All · Since creation · Train · Val · OOS ·
RLP · YTD · MTD · 1M · 1W**. Availability is conditional: **Train** and **Val** need a train-end
boundary, **OOS** needs a configured out-of-sample window, **RLP** appears only once real-life
performance data exists, and **"Since creation"** appears only on portfolio-group charts, and only
while the group's creation date still has a bar on or after it. The calendar presets are always
available.

Separately, a page-level date filter (the Portfolios layout and dashboard, the Study analysis page,
the Transactions tab and both Sandbox result tabs) offers **All** first, then a **Study periods**
group holding **Train / Val / OOS / RLP** — each with a stage-coloured dot, and each shown only when
that boundary exists — then a **Calendar ranges** group holding **YTD · QTD · MTD · Custom**. Custom
adds a **Last N** number field with a **Days / Weeks / Months / Years** unit, plus **From** and
**To** date inputs.

## Performance charts

| Chart | Where | Plots |
|---|---|---|
| **Equity Curve** | `/analysis/portfolios` — the dashboard's top card | One line per checked trial |
| **Equity Curve** | `/analysis/portfolios/:portfolioId` — Performance tab | One portfolio, optional benchmark, stage shading |
| **Equity Curve** | `/analysis/portfolios/:portfolioId/risk` — Risk Analytics, line mode | Same series, 600px tall, filled |
| **Equity** | `/analysis/portfolio-manager` and `/analysis/portfolio-manager/:basketId/equity` | Comparative multi-group curve with a selectable Y axis |
| **Equity Curve** | `/analysis/portfolio-groups/rank` — Rank & Build | Every candidate portfolio, rebased to 100 |
| **Metrics Radar** | Performance tab; Strategy Sandbox → Metrics | Normalised metrics per stage |
| **"Metrics Comparison"** | Performance tab; Strategy Sandbox → Metrics | A DOM heat table, not a chart |
| Growth vs benchmark | `/analysis/portfolios/:portfolioId/profile` | Both series in dollars from $100,000 |

### Equity Curve — trial comparison

The dashboard's combined equity chart overlays every trial you have checked in the ranking — see
[portfolios dashboard](/docs/portfolios-dashboard) for how the selection works.

- **Title** — **"Equity Curve"**. **Subtitle** — **"{{count}} trial curves overlaid · Check or
  uncheck a card to add or remove one"**.
- **X axis** — a category axis of dates with a year/month hierarchy. **Y axis** — a value axis with
  `scale: true` (it does not force zero), formatted to two decimals.
- **Series** — one line per selected trial, `sampling: 'lttb'`, smoothing 0.15, width 1.5. Series are
  named **"Trial N · study"**; the raw `portfolio_id` is never shown.
- **Tooltip** — axis-triggered with a crosshair axis pointer. Values print to 2 decimals raw, 4 when
  aligned (curves cluster around 1.0 once rebased, and two decimals hides the spread).
- **Legend** — the ECharts legend is switched off; a custom DOM legend of coloured dots renders below
  the plot instead.
- **Zoom** — wheel zoom only. **There is no zoom slider on this chart**, unlike the per-portfolio
  time-series charts.
- **Header controls** — a **"View last"** number field plus a unit select (**Days / Weeks / Months /
  Years**) with placeholder **"All"**.
- **Empty states** — nothing checked gives **"Check one or more trials in the ranking to plot their
  equity curves here."**

The chart deliberately reuses the ranking cards' own equity request, so plotting curves costs no
extra round trip.

### Equity Curve — single portfolio

The Performance tab's chart is the most annotated plot in the product. See
[portfolio detail](/docs/portfolio-detail) for the tab it lives on.

| Element | Detail |
|---|---|
| Portfolio series | Named **"Portfolio"**, solid 2px in the primary colour, smoothing 0.15, with an indigo gradient area fill |
| Benchmark series | Dashed 1.5px in the neutral semantic colour, named from the selected ticker (falling back to the literal `Benchmark`) |
| Period shading | `markArea` bands for **Train**, **Val**, **OOS** and **RLP**, each a fixed low-alpha tint |
| Rebalance grid | Dashed grey vertical lines at each rebalance date |
| Stage boundaries | Labelled vertical lines in the warning colour |
| Holdings marker | A solid vertical line at the date currently shown in Holdings |
| Creation marker | A dashed teal line labelled **"Created {{date}}"** |
| Animation | Disabled |

Controls sit in the card header: the quick-timeframe presets, a **benchmark ticker** autocomplete
(with a **"Filter by exchange"** popover) and an origin-alignment toggle whose tooltip reads
**"Aligned to window start"** or **"Raw values"**.

> [!WARNING]
> Panning this chart requires holding **Shift** while dragging. The wheel zooms; a bare drag does
> nothing unless the caller opted into drag-to-pan. Zooming back out to the full extent reports "no
> window" rather than a range that happens to cover everything, which is why window-scoped metric
> strips reset to the full period when you do it.

On the Performance tab an **"Invert (what-if)"** button re-simulates the trial with every position
flipped long↔short and overlays the result in the benchmark slot (the benchmark selector hides while
it is on). A badge reading **"Inverted (what-if)"** appears with a four-figure strip —
`Total Return`, `CAGR`, `Sharpe Ratio`, `Max Drawdown`. Those four labels are hardcoded English
literals and do not translate.

### Equity — Portfolio Manager

The Portfolio Manager's comparative chart is titled **"Equity"** and is the only chart whose Y axis
is a first-class control. See [portfolio manager](/docs/portfolio-manager) for the toolbar that feeds
it.

- **Y axis picker** — labelled **"Y axis"**. The group **"Curve"** holds **"Equity"** (*"The
  portfolio's value over time, rebased so every curve starts together."*) and **"Drawdown"** (*"How
  far below its own peak the portfolio is, day by day."*). Below that sit every metric the server's
  matrix catalog exposes, grouped as **Performance / Risk / Risk-adjusted / Recovery / Distribution /
  Benchmark**. Benchmark-relative axes appear only when a benchmark is set.
- **Excluded axes** — the trade aggregates `trade_win_rate`, `trade_profit_factor`,
  `avg_trade_duration` and `expectancy` are never offered: they have no curve to roll, so the axis
  would guarantee an empty chart.
- **Rolling window** — a number field beside the picker, default **10**, floored at the server's
  `min_window` for the chosen metric with helper text **"min {{min}} for this metric"**. It is hidden
  for the two window-free axes (Equity and Drawdown).
- **Line styles** — normal series 2px solid; the benchmark 1.5px dashed; muted series 1px at 0.28
  opacity. Past the eight-slot palette, extra lines fall into a neutral grey swarm and are **omitted
  from the legend** — hues are never cycled or invented.
- **Lifecycle markers** — shape-encoded `markPoint`s in each portfolio's own colour: `train` a
  triangle, `validation` a circle, `oos` a rectangle, `promoted` a diamond. A legend below reads
  **"Lifecycle:"** followed by **Train / Validation / Out-of-sample / Promoted**. Marks outside the
  drawn window are dropped, not clamped to its edge.
- **Creation marker** — a diamond plus a dashed vertical rule labelled **"Created {{date}}"**, drawn
  only on the top panel and never on the benchmark.
- **Reference rule** — a dotted line at the metric's reference value, drawn on its own invisible
  series so unchecking a portfolio cannot remove it.
- **Zoom** — wheel zoom and drag-pan inside the plot, plus an 18px slider at the bottom.
- **Axis formatting** — by the metric's declared display: percent to 0 decimals, ratios to 2, days
  and index values to 0. Tooltip values use 2 decimals for percent, 0 for days, 3 otherwise;
  a missing value renders as `—`.

Notes under the chart carry **"{{names}} has no value over this window"**, **"thinned to fit"** when
the server downsampled, and an information icon whose tooltip is the metric's own definition — the
section carries two different rolling-Sharpe definitions, so the chart says which one produced the
curve. Empty state: **"Every group is unchecked — check one to draw it."**

Home's **"Active Portfolio Group Performance"** card reuses this same chart at `metric: 'equity'`,
with a **"Timeframe"** control offering **4 / 8 / 12 / 26 weeks** (default **12**).

### Equity Curve — Rank & Build

On `/analysis/portfolio-groups/rank` ([portfolio groups](/docs/portfolio-groups)), every candidate is rebased to 100 at its first non-zero value.
Subtitle: **"Indexed to 100 at first common date. Drag to zoom."**, becoming **"Indexed to 100 at
first common date · showing {{range}}"** once zoomed. The Y axis is named **"Indexed (100)"**. Zoom
is wheel-only; the legend is a scrolling row at the bottom. Hovering a row in the ranking table dims
every other curve to 0.25 opacity and thickens the hovered one. Height is 360px. Empty:
**"No equity data available."**

### Metrics Radar

Card **"Metrics Radar"**, subtitle **"Values normalised per metric — higher area = better except for
risk metrics"**. Every metric it can plot is defined in the
[metrics reference](/docs/metrics-reference). Every indicator is declared `{min: 0, max: 1}` — the plotted values are normalised,
and the raw values appear in the tooltip. A **"Select metrics"** picker drives a counter reading
**"Metrics ({{active}} / {{total}})"**. The chart renders only with at least two series; otherwise
you get **"Not enough data for radar chart (need at least 2 series with ≥ 3 metrics)."**

The Strategy Sandbox's Metrics tab renders this same component, at 480px, through the shared metrics
dashboard — the copy is identical there.

### Metrics Comparison

Directly under the radar sits **"Metrics Comparison"** — a heat-tinted **DOM table**, not an ECharts
heatmap. Columns are **Metric**, one column per active stage, then **Best** and **Signal**. Each cell
is tinted from a five-step ramp over the metric's normalised value: two positive tints above 0.6,
transparent in the middle band, two negative tints below 0.4. It appears on the Performance tab and,
through the shared metrics dashboard, in the Strategy Sandbox.

### Growth vs benchmark

On the flag-gated **Profile** tab, `InvestorGrowthChart` plots two lines in dollars: the portfolio
with a gradient area and an endpoint label showing its final value, and the benchmark rebased into
dollars from inception. The Y axis is money-formatted. Stage `markArea` bands are labelled
**Train**, **Val** and **Out-of-sample**. The section hint reads **"Portfolio vs benchmark, both
starting at $100,000"**.

## Risk charts

| Chart | Time-series title / subtitle | Histogram title / subtitle |
|---|---|---|
| Drawdown (dashboard) | **"Drawdown"** / **"Peak-to-trough decline"** | **"Drawdown distribution"** / **"Histogram of rolling drawdown"** |
| Drawdown (Risk Analytics) | **"Drawdown"** / **"Peak-to-trough decline"** | **"Drawdown distribution"** / **"Histogram of drawdown"** |
| Volatility (dashboard) | **"Volatility"** / **"Rolling volatility"** | **"Volatility distribution"** / **"Histogram of rolling volatility"** |
| Volatility (Risk Analytics) | **"Volatility"** / **"Rolling {{count}}-day window"** | **"Volatility distribution"** / **"Histogram of rolling volatility"** |
| Rate of change (dashboard) | **"Rate of Change"** / **"Momentum (ROC)"** | **"Rate of Change distribution"** / **"Histogram of momentum (ROC)"** |
| Rate of change (Risk Analytics) | **"Rate of Change"** / **"Rolling {{count}}-day window"** | **"Rate of Change distribution"** / **"Histogram of momentum (ROC)"** |
| Sharpe (dashboard) | **"Sharpe"** / **"Risk-adjusted return"** | **"Sharpe distribution"** / **"Histogram of risk-adjusted return"** |
| Sharpe (Risk Analytics) | **"Sharpe Ratio"** / **"Rolling {{count}}-day window"** | **"Sharpe distribution"** / **"Histogram of risk-adjusted return"** |

> [!NOTE]
> The titles genuinely differ by page. The dashboard says **"Sharpe"**; Risk Analytics says
> **"Sharpe Ratio"**. The dashboard's drawdown histogram says *rolling* drawdown; Risk Analytics'
> does not. Both are deliberate — the dashboard compares selections, the tab describes one portfolio.

### The four rolling risk charts

All four slots are the same pair of components, swapped by a bar icon whose tooltip reads **"Switch
to Histogram"** or **"Switch to Time Series"**. In time-series mode you get a multi-series line
chart; in histogram mode you get a distribution of the same values.

| Property | Value |
|---|---|
| X axis | Category axis of dates with a year/month hierarchy |
| Y axis | Value axis, `scale: true`, optionally inverted |
| Y tick format | Percent series → 1-decimal percent; otherwise `…M` above 1e6, `…k` above 1e3, else 2 decimals |
| Tooltip | Axis-triggered, crosshair pointer; percent to 2 decimals, ratios to 3, other values to 4 |
| Series | Line, no symbols, `sampling: 'lttb'`, smoothing 0.25, width 1.5 (2.5 on hover, focus the series) |
| Zoom | Wheel zoom **and** a 24px slider whose labels show `YYYY-MM` |
| Stage separators | Labelled markers **"Train \| Val"**, **"Val \| OOS"**, **"OOS \| RLP"**, **"Val \| RLP"** with shaded bands |
| Height | 420px on the dashboard (240px on mobile); a flat 320px on Risk Analytics |
| Renderer | SVG at device pixel ratio 2 |

The same component carries the top chart on the **Holdings** tab. There, selecting holdings in the
table paints one translucent band per selected symbol over the periods it was actually held;
contiguity is detected with an adaptive gap threshold rather than a fixed one, so an intermittent
position does not become one long band.

Windows are set from the gear popover on the dashboard (**"Window size"**) and from an inline
**"Window"** field in the card header on Risk Analytics; both are bounded at min 2, max 252, step 1.
**Drawdown has no window control** — drawdown is window-free. The rolling windows default to **14**
on the dashboard and **20** on Risk Analytics.

On the dashboard these four charts render with their date filters and legends hidden, so the same
component looks noticeably plainer there than on the Risk Analytics tab.

The [Strategy Sandbox](/docs/strategies)'s **Equity & Risk** tab reuses the same pair through a **Line** / **Histogram**
segmented control plus a gear popover, over four sections titled **"Drawdown"**, **"Rolling
Volatility"** (sub-labelled **"annualised"**), **"Rate of Change"** and **"Rolling Sharpe Ratio"**.

### Histogram and density mode

The gear popover in histogram mode offers a **"Bins"** field (min 5, max 200, step 1) and a
**"Density"** switch. The default configuration is 30 bins with density off.

| Mode | What is drawn |
|---|---|
| Histogram (`density` off) | Bars over bins **shared across every selected portfolio** — the bin edges come from the global min/max, so bars are comparable between series. X is a category axis of bin centres rotated 45°; Y is named **"Frequency"**; the tooltip uses a shadow axis pointer |
| Density (`density` on) | A Gaussian KDE with Silverman bandwidth over 100 sample points, drawn as a line with a gradient area. X becomes a value axis clamped to the data range; Y is named **"Density"**. The KDE value formats to 4 decimals and is **never** percent-formatted |

When every value is identical the chart degenerates to a single category bar per portfolio. Empty
gives **"No data available."**; a failure gives **"Failed to load histogram."**

### Cascade waterfall

On Risk Analytics the equity card has a second mode reached by a waterfall icon — tooltips
**"Switch to Cascade"** and **"Switch to Line"**. The card's info tooltip reads **"Daily return % —
green gains, red losses"**.

It is a 600px-tall stacked bar chart: an invisible, silent base series carries the running total and
a visible bar carries the day's absolute return, tinted green or red by sign. X labels print only the
year, with a dashed split line at each year boundary. The tooltip shows the date, **"Day:"** with the
signed daily return to 3 decimals, and **"Cum:"** with the cumulative return to 2. Zoom is wheel plus
a 20px slider.

> [!TIP]
> The waterfall re-bases on every zoom. Whatever window you zoom to starts at zero, so the visible
> bars always read as a self-contained period rather than as an offset slice of the whole history.

### Deflated Sharpe gauge

`/analysis/portfolios/:portfolioId/overfitting` opens with **"Deflated Sharpe Analysis"** and a
verdict chip — **Well Trained**, **Borderline**, **Overfit Risk** or **Insufficient Data** — each
carrying its own explanatory copy.

- **Gauge** — titled **"Deflated Sharpe (confidence it is real skill)"**, 240px tall. Two stacked
  gauge series: an outer halo ring encoding the study-level PBO, and the inner DSR gauge whose colour
  zones map to the verdict cutoffs. Legend line: **"Red <90% · Amber 90–95% · Green ≥95%"**; halo
  caption **"Outer ring: study PBO {{pbo}}"**. Fallback: **"Not enough data to compute a Deflated
  Sharpe."**
- **Skill vs. luck** — card **"Skill vs. luck"**. Horizontal bars over the two categories
  **"Best-of-N luck (SR₀)"** and **"Your OOS Sharpe"**, X axis named **"Annualized Sharpe"**, with a
  dashed marker at SR₀. Caption: **"SR₀ is the Sharpe the best of {{n}} trials would reach with zero
  real skill. Clearing it is the bar for genuine edge."** Fallback: **"No out-of-sample Sharpe
  available."**

Empty and error copy are deliberately different here, so a broken deploy does not read as "not
computed yet".

## Optimization charts

Everything in this family lives on `/analysis/portfolios/study/:studyId`, whose tabs are
**Overview · Robustness · Families · Parameters**. See [optimization dashboard](/docs/optimization-dashboard)
for the surrounding workflow.

> [!WARNING]
> The five Parameters-tab chart titles are built as JavaScript template literals, not translated
> strings: `Optimization Evolution · STAGE`, `Result Distribution · STAGE`,
> `Parameter Impact · STAGE`, `3D Parameter Explorer · STAGE` and `Hyperparameter Patterns · STAGE`.
> They render in English in every locale, and the stage is the raw key — `train`, `validation`,
> `out_of_sample`, `overall`, `real_life_performance`, `window` or `weighted_avg`.

Above the parameter grid sits a colour-mode control labelled **"Color"** with options **"Metric"**
and **"Strategy family"**. Switching to family colouring removes the metric `visualMap` from the
scatter grid and the parallel-coordinates chart and colours each point or line by its behavioural
family instead.

### Optimization Evolution

The optimization history. X is a category axis of trial iteration numbers named **"Trial"**; Y is a
value axis named **"Metric value"** with `scale: true`, switching to 2-decimal percent ticks for a
percent objective.

- **Series** — a line named **"Metric"** with visible 6px symbols, plus a scatter named **"Best"**
  (symbol size 12) placed at the best trial. It is placed by *index*, not trial number: category axes
  read numbers as indices, and trial numbers go sparse once the optimizer prunes.
- **Toolbox** — `restore` and `saveAsImage`. This is the **only ECharts toolbox in the app**, and
  therefore the only ECharts chart with a built-in image download.
- **Zoom** — wheel, drag and wheel-pan inside the plot, plus a 25px slider.
- **Tooltip** — item-triggered: `Trial`, `Value` to 6 decimals, a rule, then **"Hyperparameters"**
  and every key/value pair.
- **Control** — **"Mode"** with **"Raw"** and **"Best"**; default `raw`.
- **Summary strip** — **"Trials"** count and **"Best value"** rendered as
  **"{{value}} (iteration {{iteration}})"**.
- Clicking a point opens that trial's Portfolio Analysis. Minimum height 380px, canvas renderer.
- Empty: **"No optimization data available."**

### Result Distribution

A histogram of trial counts per objective bin. X is a category axis of bin-edge labels reading
`"lo – hi"`, rotated 45° with every label forced visible; Y is a value axis named **"Trials"**.
Tooltip rows are **"Range"** and **"Count"**. Zoom is wheel plus a 20px slider. The header control is
a **"Bins"** number field (minimum 1) with placeholder **"auto"** and helper text **"Auto by
default"**.

Below the plot sits a stat strip: **Trials · Mean · Std Dev · Min / Max**.

### Parameter Impact

One scatter card per hyperparameter, laid out three-up on large screens at 260px each. Grid
description: **"Each chart shows how a parameter value relates to the metric. Color intensity maps
metric quality — warmer tones mark better zones."**

Each plot's header is the raw parameter name in the monospace face. X is named after the parameter —
a category axis when the parameter is categorical, otherwise a value axis with `scale: true`. Y is
named **"Metric"**. The continuous `visualMap` runs along the bottom over the metric dimension,
labelled **"Best"** and **"Worst"** at its ends, using the blue→gold ramp. Tooltips read the
parameter value, the metric to 6 decimals, and the trial number. Clicking a point opens that trial.

### 3D Parameter Explorer

The only Plotly surface in Fintela, lazy-loaded because it is the only thing that needs Plotly.

- **Axis pickers** — three monospace selects labelled **X**, **Y** and **Z**. The options are the
  numeric parameters plus the metric, and the three are **mutually exclusive**: an axis's list drops
  whatever the other two already hold. Categorical parameters are excluded and disclosed below the
  plot as **"Categorical parameters ({{params}}) have no numeric geometry and are excluded from the
  3D axes."**
- **View toggle** — **"Scatter"** / **"Surface"**.
  - *Scatter* draws a `scatter3d` on the blue→gold colorscale with a colorbar titled **"Metric"**.
    Hover shows **"Trial {{trialId}}"** and **"Metric: {{value}}"**. Clicking a point opens that
    trial.
  - *Surface* draws a `mesh3d` with Delaunay triangulation projected on the XY plane — a terrain over
    the actual trial points, not a convex hull. Caption: **"Surface connects the actual trial points
    via Delaunay triangulation. Color = metric value."** **Clicking does nothing in surface mode.**
- **Modebar** — appears on hover, without the Plotly logo. Scroll zoom is on and the noisy 3-D
  buttons are stripped, leaving camera reset and image export.
- **Layout** — transparent paper and plot, cube aspect ratio, hover labels matched to the Fintela
  tooltip tokens.

### Hyperparameter Patterns

Parallel coordinates: one axis per hyperparameter, preceded by an axis named **"Value"** carrying the
objective. Categorical parameters get category axes with their observed labels. Lines are 1px at 0.5
opacity, thickening to 2px at full opacity on hover. A continuous `visualMap` over the objective
dimension sits at the bottom, calculable, on the blue→gold ramp — dropped when family colouring is
on. The header control is **"Top-N"**, minimum 1, **default 500**: the chart sorts descending by
objective and slices. Tooltip rows are the trial number, the objective to 4 decimals, a rule, then
every parameter. Minimum height 520px. Empty: **"No hyperparameter data available."**

### Parameter importance

On the Overview tab, under **"Hyperparameter Importances"**.

- **Card** — **"Parameter importance"**, subtitle **"Share of {{metric}} variance explained
  ({{evaluator}}, {{stage}}). Bar length = importance; color = effect direction."**
- **Plot** — horizontal bars with percent-formatted X ticks and parameter names down Y, plus a
  **custom ECharts series** that draws 90% bootstrap confidence whiskers over each bar.
- **Tooltip** — **"Importance"**, a direction label (**"Higher is better"**, **"Lower is better"** or
  **"Best: {{value}}"**) with **"Spearman ρ"**, then **"MDI cross-check"** and **"90% bootstrap
  CI"**.
- **Control** — **"Method"** with **"fANOVA"** and **"MDI"**; default fANOVA.
- **Headline tiles** — **Most influential · Effective params · Trials scored · Top overfit driver ·
  Train↔Val agreement · Direction flips**.
- **Low confidence** — caption **"Low confidence: few trials in this stage — interpret with
  caution."** Empty: **"No importance available for this stage."**

Three distinct unavailable states exist rather than one: importances not computed at all,
importances undefined for the chosen timeframe (**"Parameter importances decompose the variance of
the study's objective (fitness), and fitness is only evaluated over the study's own periods. Pick
All, Train, Val, OOS or RLP in the filter above."**), and a stale artifact scored before the stage
was supported.

Beside it, **"Overfitting divergence"** draws grouped horizontal bars with a **Train** / **Validation**
legend, subtitled **"Parameters important in train but not in validation drove selection
overfitting; an effect whose direction flips out of sample is a spurious-signal flag."** A flipped
effect adds **"Effect direction flips out of sample"** to the tooltip. Empty: **"Needs both train and
validation importances."**

### Robustness surfaces

The Robustness tab renders a scorecard plus seven plots in a two-column grid, each 300px tall on the
canvas renderer. Trials are capped at **40** on the equity, slope and heatmap surfaces, ranked by
Deflated Sharpe.

| # | Card | Plot |
|---|---|---|
| 1 | Scorecard (no plot) | Tiles **PBO · Luck threshold (SR₀) · Effective trials · Sharpe variance (V) · Scored trials**, with a verdict chip: **Well trained / Borderline / Overfit risk / Uncertain** |
| 2 | **"CSCV overfitting distribution"** | Histogram over **"Logit λ (out-of-sample rank of the in-sample best)"**, dashed marker at λ=0, shading over λ≤0 |
| 3 | **"Trial Sharpe distribution vs luck"** | Histogram over **"In-sample Sharpe (annualized)"** with a dashed **"SR₀ = {{value}}"** marker and shading below it |
| 4 | **"Deflated Sharpe across trials"** | Histogram over **"Deflated Sharpe Ratio (OOS)"**, bars coloured by verdict band |
| 5 | **"In-sample vs out-of-sample rank"** | Scatter, X **"In-sample rank (1 = best)"**, Y **"Out-of-sample rank (1 = best)"** inverted, dashed diagonal. Click a point to open the trial |
| 6 | **"Train → Validation → OOS degradation"** | Slope chart: one line per trial across three category stages, Y named **"Sharpe (annualized)"**, plus a bold **"Mean"** line |
| 7 | **"Equity curves by window"** | The one chart in the app on a true **time** axis. Y named **"Equity (rebased to 100)"**, with `markArea` bands per stage |
| 8 | **"Per-trial robustness matrix"** | Heatmap: columns **DSR · PSR · Train→OOS z · Val→OOS z · \|ρ₁\| OOS** across the top, trials down the side. The `visualMap` is hidden; labels show raw values. Click a row to open that trial |

Each card carries a verbatim info tooltip explaining its statistic, and a caption explaining the
reading — for example **"Shaded area (λ ≤ 0) = PBO {{pbo}}. Mean λ = {{lambda}}. A distribution
centered left of 0 indicates overfitting."** Capped surfaces say **"Showing the {{shown}} of
{{total}} trials with the best Deflated Sharpe."**

States: a spinner while loading; **"Could not load the robustness analysis. Please try again."** on
failure; **"No robustness analysis yet. It is computed once the study finishes and has enough
data."** when never scored.

### Strategy families

The Families tab clusters trials by the correlation of their full equity curves.

1. **Headline banner** — **"{{trials}} trials — but only {{strategies}} distinct strategies"**,
   subtitled **"Trials grouped by the correlation of their full equity curves. Top performers are
   often the same strategy in disguise."** A **"Granularity"** control carries a **"cohesion
   {{value}}"** chip explaining the silhouette score.
2. **"Behavioral map"** — subtitle **"Each point is a trial, placed by return similarity and colored
   by strategy family."** It is a scatter with **one series per family**, so the scrolling legend
   toggles families. Axes are **"Behavioral dimension 1"** and **"Behavioral dimension 2"** with
   dashed split lines and a dashed origin cross. **Bubble size encodes OOS Sharpe** — caption
   **"Bubble size = OOS Sharpe"** — not weight and not return. Two extra marker series share each
   family's legend entry: a diamond for the **"Representative"** medoid and a five-point star for the
   **"Study best"**. Tooltip rows: **Return · Sharpe · OOS Sharpe · Max DD**.
3. **"Representative equity per family"** — **"The most representative (medoid) trial of each
   family."**
4. **"Strategy families"** — one card per family titled **"Family {{id}}"**, each with a pure-ECharts
   sparkline and tiles **Mean return · Mean Sharpe · Mean OOS Sharpe · Return dispersion**, a
   **"Contains study best"** chip and an **"Open trial #{{trial}}"** action.
5. **"Trials by family"** — a table with columns **Family · Trial · Return · Sharpe · OOS Sharpe ·
   Max DD · Fitness** and an **"Export CSV"** button.

Empty across all of them: **"Strategy clustering not available"** / **"This study was finalized
before clustering was computed, or it's still processing. It will appear after the next run or
backfill."**

The Overview tab also has an **"Errors"** card behind a collapsible **"Failed trials"** section: a
horizontal bar chart of failure reasons, series named **"Count"** in the error colour, with truncated
category labels. Below it a **"Show"** / **"Hide"** toggle reveals a **"Failed Trials ({{count}})"**
table with columns **Trial · Failure Reason · Params**.

## Allocation charts

| Chart | Where | Kind |
|---|---|---|
| **Allocation Snapshot** | Holdings tab | ECharts treemap |
| **Historical Allocation by {{feature}}** | Holdings tab | Diverging stacked area |
| **"Composition over time"** | Portfolio Manager → Holdings | Diverging stacked area |
| **"Composition on date"** | Portfolio Manager → Holdings | ECharts treemap |
| **"Consensus book"** | Portfolio Manager → Holdings | DOM grid |
| **"Holdings Heatmap"** | Rank & Build | ECharts heatmap |
| **"Return Correlation"** | Rank & Build | ECharts heatmap |
| **"Cross-group correlation"** | Portfolio Manager → Metrics | DOM lower-triangle table |
| **"Holdings Snapshot"** | Strategy Sandbox → Holdings | ECharts pie donut |
| Sector allocation / Asset type | Profile tab | DOM bar list |

### Allocation Snapshot

Card **"Allocation Snapshot"**, subtitled with the selected date. A treemap sized by **gross**
weight, with ECharts' own roaming, node-click drill-down, breadcrumbs and emphasis all switched off.
Each tile's label ink is chosen per tile to maximise measured contrast against its own fill.

**Clicking a tile toggles that holding's selection** — which is what paints the highlight bands on
the equity chart at the top of the same tab.

A select switches the grouping feature across the full `TickerFeature` set: `Code`, `Type`, `Isin`,
`Sector`, `Industry`, `Country`, `Currency`. Ticker logos are fetched only when the feature is
`Code`, and only while the `tickerLogosCdn` flag is on — with it off there are no logos and no
fallback. Side chips read **LONG** and **SHORT**; exposure captions read **"Net {{net}}%"** and
**"Gross {{gross}}%"**. The sub-panel header is **"Snapshot"**. Empty: **"No holdings data
available"**.

### Historical Allocation

Card **"Historical Allocation by {{feature}}"**, subtitle **"Weight over time (stacked %)"**. A
diverging stacked area: values are scaled to percent and **shorts render below zero**, because
ECharts stacks negatives under the axis. Y ticks are `{value}%`. Zoom is wheel plus a slider. Tooltip
rows append `(SHORT)` for negative values and format to one decimal.

### Composition over time and on date

Portfolio Manager's Holdings tab has a lens picker labelled **"View"** with three options.

| Lens | What it draws |
|---|---|
| **"Concentration"** | A table with **Top 5 · Eff. N · Names · Gross · Net**, each column carrying its own help tooltip |
| **"Composition over time"** | A diverging stacked area, shorts below zero, with **`CASH` derived as `1 − Σ gross`** and drawn in the neutral colour at 0.55 opacity against 0.85 for everything else |
| **"Composition on date"** | A treemap sized by gross weight; short-dominant buckets get a coloured border and selected buckets a ring. Tile labels read the bucket name (suffixed `(S)` when short-dominant) over its percentage. A table beside it lists **Ticker · Side · Weight · Sector** |

> [!NOTE]
> The composition area chart has **no zoom at all** — deliberately. Its window comes from the
> toolbar above and from the Holdings date scrubber below, and a slider would have cost 56px of a
> card that is often only ~200px tall. It also omits `lttb` sampling on purpose: thinning each
> stacked layer independently tears the bands apart.

Above the lenses, a **"Group by"** control switches the bucket dimension across **Ticker · Sector ·
Industry · Theme · Sub-theme · Sub-portfolios**, and a **"Weight"** toggle switches **Net** / **Gross**.
A strip caption summarises **"{{groups}} groups · {{buckets}} buckets · gross {{gross}} ·
L{{long}}/S{{short}} · crowding {{crowding}}"**.

The **"Consensus book"** grid below is a DOM table, not a chart. Columns run: **"Bucket"** (frozen
under horizontal scroll), then a **"Consensus"** band holding either **"Book net"** or **"Book
gross"** — whichever the Weight toggle selects, never both — and a **"Held by"** presence strip with
one mark per group; then one column per group in its palette colour; then a **"σ"** spread column
last. Bars are two-sided around a centre divider. Row chips read **"hedged"** and **"only-in"**.
Empty: **"No holdings on this day."**

At the bottom sits a date scrubber whose hint reads **"Any date resolves to the last snapshot on or
before it — composition is a step function."** Dragging commits on release, and a **"Latest"** button
resets it.

### Holdings and correlation heatmaps

On Rank & Build, two heatmaps sit below the equity overlay. **Both are collapsed by default** behind
an eye button whose tooltip toggles between **"Show chart"** and **"Hide chart"** — the correlation
computation is O(n²·dates) and is deferred until you open it.

| Chart | Axes | Scale | Labels |
|---|---|---|---|
| **"Return Correlation"** — *"Pairwise Pearson · daily returns. High = low diversification benefit."* | Portfolios on both axes, Y reversed | Diverging ramp, −1 to +1, calculable | Cell values shown only at **≤ 15** portfolios |
| **"Holdings Heatmap"** — *"Latest rebalance weight per portfolio. Darker = higher allocation."* | Portfolios across, tickers down (weight > 0.001) | Sequential blue ramp, 0 to 1 | Cell values shown only at **≤ 20** tickers and weight > 0.005 |

Heights grow with the data: `max(260, n×32+80)` for the correlation matrix and `max(320,
tickers×28+80)` for the holdings heatmap. The correlation matrix needs at least two portfolios.

Portfolio Manager's **"Cross-group correlation"** card is different — a DOM table drawing only the
lower triangle, since ρ is symmetric. The diagonal is blank. A pair with fewer shared days than
`min_obs` renders as **`·` on a transparent cell, never as `0`**; its tooltip reads **"only {{obs}}
shared days (needs {{min}})"**. The card's info copy says so explicitly: *"A blank cell means the
pair shares fewer than {{min}} days — not that they are uncorrelated."* Caption: **"average pairwise
ρ {{rho}}"**. With one group you get **"Two groups are needed for a correlation."**

## Trade charts

| Chart | Where |
|---|---|
| **"Trades History"** | Transactions tab |
| **"Return vs. Duration"**, **"Outcome by Side"**, **"MFE / MAE Efficiency"** | Transactions tab; Strategy Sandbox → Trades |
| **"Calendar Heatmap"** | Transactions tab; Strategy Sandbox → Trades |
| Scaling sparkline | Transactions table, **Scaling** column |
| Trade lenses | Portfolio Manager → Trades |
| **"Monthly Activity"**, **"Top Tickers"** | Strategy Sandbox → Orders |

One shared filter toolbar (ticker, status, date) drives every visual on the Transactions tab; the
date filter accepts `all`, `ytd`, `qtd`, `mtd` and `custom`.

### Trades History

Card **"Trades History"** / **"Return % per trade · sorted by exit date"**, 320px tall. Bars carry
each closed trade's return, tinted green or red by sign at 0.9 opacity; only the most extreme bars
(the top 5%, or at least five) carry a value label. X is a category axis of exit dates with a dashed
split line at each year boundary; Y ticks are signed percentages. Zoom is wheel plus a 20px slider.
The tooltip is monospaced and carries the exit date, the ticker code and the signed return. Empty:
**"No closed trades available"**.

### The three trade plots

All three render on the SVG renderer with `notMerge`.

| Plot | Encoding | Info tooltip |
|---|---|---|
| **"Return vs. Duration"** | Two scatter series named **"Win"** and **"Loss"**, symbol size 9; per-point symbol is a triangle for shorts and a circle for longs. X named **"Duration (days)"**, Y in signed percent, dashed zero line | *"Each point is a closed trade: holding period (x) vs. realized return (y). Green = winner, red = loser; circle = long, triangle = short."* |
| **"Outcome by Side"** | Stacked bars over categories **Long** and **Short**, legend **Win** / **Loss**, Y forced to whole-number intervals. Caption **"Overall win rate {{rate}}%"** | *"Wins vs. losses split by trade direction (long / short), so you can see which side carries the edge."* |
| **"MFE / MAE Efficiency"** | Scatter with X **"Max adverse excursion"** and Y **"Max favorable excursion"**, coloured by realized outcome | *"Max adverse excursion (heat taken) vs. max favorable excursion (opportunity seen), colored by realized outcome."* |

The efficiency plot has its own explicit unavailable state: **"MFE / MAE are not available for this
trade source."** The other two say **"No closed trades in the current filter."**

The trades table beside them has columns **Ticker · Side · Entry · Exit · Days · Avg In · Avg Out ·
Invested · Return · P&L · MFE · MAE · Scaling**. The **Scaling** cell holds a tiny 80×28 ECharts line
of P&L across a trade's scalings, rendered only when a trade has at least two.

### Calendar Heatmap

Card **"Calendar Heatmap"**. This is a hand-built DOM grid of cells wrapped in tooltips — not
ECharts — so it has no zoom, no legend toggle and no export.

- **Metric select** — **"Daily Return %"**, **"Trade P&L ($)"**, **"Capital Invested ($)"**; default
  is the return view.
- **Granularity** — **Daily** / **Weekly** / **Monthly**.
- **Colour rule**, verbatim: *"Each cell is one period. Color encodes the metric — a red→green
  diverging scale for return/P&L (sign + magnitude) and a blue ramp for invested capital. In the
  daily view rows are weekdays and columns are weeks."* Hint: **"hover a cell for the exact value"**.
- **Labels** — weekday rows use `Mon, Tue, Wed, Thu, Fri, Sat, Sun`; month columns use
  `Jan … Dec`.
- Cell tooltips read the date, a separator and the formatted value; missing cells say **"No data"**.
  A continuous gradient legend prints the min and max at its ends.

The same component also appears on the Strategy Sandbox's Trades tab.

### Portfolio Manager trade lenses

A **"View"** picker switches between five lenses.

| Lens | What it draws |
|---|---|
| **"Trade metrics"** | A banded table under **"Realized (window)"** and **"Open · mark-to-market"**, columns **N · P&L · Win% · Payoff · PF · Expect. · Hold · Size · α · Beat BM · Open · Unreal.** Footnote: *"P&L and returns are fractions of NAV, never money. \* marks a figure computed from too few closed trades."* |
| **"Timing"** | Monthly bars of realized P&L **plus a cumulative line per group sharing the same legend entry**, a dashed grey **"Cohort"** line, and a solid zero line. Y named **"% of NAV"**. Hint: *"Bars: realized P&L in each month. Line: the running total since the start of the window."* |
| **"Distribution"** | Bars over **server-supplied shared bins**, X labels reading `"lo…hi"`, rotated 45°, Y named **"trades"** |
| **"Ledger"** | A registry table of attributed trades, every column carrying a help tooltip |
| **"Contribution"** | Horizontal bars of the top 16 tickers by total P&L, ascending so the largest sits on top, green/red by sign, with a `×N` label when more than one group holds the ticker |

> [!NOTE]
> The Distribution lens's bins come from the server so every group is binned identically. The
> Portfolios risk histograms compute their shared bins client-side from the selection's global
> min/max. Same effect, different mechanism — do not assume one behaves like the other.

Empty states: **"Every group is unchecked."** and **"No closed trades in this window."**

The Strategy Sandbox's Orders tab adds two bar charts of its own: **"Monthly Activity"** (stacked,
with BUY drawn up and SELL negated so it draws down) and **"Top Tickers"** (horizontal stacked
BUY/SELL), over tiles **Total Orders · Unique Tickers · First Order · Last Order** and a table with
**Date · Ticker · Action · Side · Qty · Result Qty**.

## Market charts

Everything here sits behind the `markets` entitlement lock on `/analysis/markets`, whose tabs are
**Market Pulse · Ticker · Sectors & Countries · Screener**. Each tab is a separate lazy chunk. The
exchange is never "all" — it defaults to `US`. See [markets](/docs/market).

### Market Heatmap

Card **"Market Heatmap"**, an ECharts treemap on the Pulse tab.

- Roaming, node-click navigation and breadcrumbs are all off; clicks are handled by the app. Group
  header bands (`upperLabel`, 22px) appear whenever a grouping is active.
- Tile labels are rich text: the bold code over the signed return.
- **Fills come from a percentile-scaled domain**: the panel's own 95th percentile of absolute change,
  floored at 3 and capped at 10. A header gradient legend runs from `−domain` to `+domain`.
- Group tiles are transparent with a divider border, and their name carries a **size-weighted** group
  return.
- **Zoom in by clicking a group band.** Breadcrumb chips appear in the card header — **"All"** plus
  one chip per level, the deepest removable. Tooltips state the affordance: **"Click to zoom in and
  split by {{dimension}}"**, **"Click to zoom in and see every member"**, or **"This group cannot be
  zoomed into"**. The **"Unclassified"** bucket is deliberately not zoomable.
- Clicking a leaf opens that ticker on the Ticker tab.
- Captions: **"{{shown}} of {{universe}} {{exchange}} assets"**, **"as of {{date}}"**, **"{{count}}
  excluded (stale, illiquid or implausible move)"** and **"{{count}} hidden (no size metric)"**.
- **Toolbar** — **"Group by"** (No grouping / Sector / Industry / Theme / Sub-theme), **"Size by"**
  (Market cap / $ volume), a **"Filters"** popover (Sector, Industry, Theme, Sub-theme, Market cap
  tier **Any / Mega / Large / Mid / Small / Micro**, Min price, Min avg volume, **"Max |change| %"**
  with helper **"Guards against bad bars"**, and Tiles), plus **"Reset"**.
- Height is aspect-derived: 54% of the card width, clamped to 320–460px.

### Price chart

On the Ticker tab, the price card is titled with the ticker's own code (falling back to **"Price"**),
with **"Adjusted close · MA 50 · MA 200"** behind an info icon beside it. An icon-only control
toggles **"Line"** and **"Candlesticks"**; switching to candles
triggers the parent's lazy OHLC fetch.

| Mode | Layout |
|---|---|
| Line | One `lttb`-sampled line at width 1.6 with a blue gradient area, plus optional **MA 50** and **MA 200** overlays at width 1.2. Wheel zoom plus a slider |
| Candlesticks | **Two linked grids** — price at 60% height and volume at 14% — with a linked axis pointer and one shared zoom over both. The volume series is named **"Volume"** and tinted by candle direction; the moving averages stay on the price grid |

The chart is re-keyed on mode, so switching is a clean remount. A 404 is treated as *empty*, not as
an error: **"No price data available"** / **"This ticker has no bars in the selected window. Try a
longer range."**

Other Ticker panels with plots:

| Panel | Plot |
|---|---|
| **"News Sentiment"** / **"Daily average score · last {{days}} days"** | Dual axis — bars named **"Articles"**, line named **"Score"**, with a zero marker. Empty: **"No sentiment data for this ticker."** |
| **"Fund Profile"** | A pie donut of **"Sector weights"** with a scrolling legend, plus a **"Top 10 holdings"** table (**Code · Name · Weight**) |
| **"Corporate Actions"** / **"Dividends & splits"** | A bar chart of **"Recent dividends"** by ex-date, tooltip **"Amount"** |

`TickerAnalystCard`, `TickerInsiderCard`, `TickerFinancialsCard` and `TickerCryptoCard` are tables
and tiles with no chart at all.

The Pulse tab also carries **"Volatility Watch"** / **"90-day coefficient of variation, most volatile
first"** — a table whose **"Trend"** column holds a pure-SVG sparkline — and **"Treasury Yields"** /
**"as of {{date}}"**, an ECharts line of the current curve with a second dashed **"1w ago"** series,
tenor tiles reading **"{{value}} bp vs 1w"**, and a **"2s10s Spread"** tile that adds **"Curve
inverted"** when negative.

### Sector and country performance

Card **"Sector & country performance"** / **"Returns across horizons, US listings"**. A DOM heat
table, not a chart.

Columns: **Group**, then **Today · 1W · 1M · 6M · YTD · 1Y · 5Y · 10Y**, then **"Best horizon"** and
**"# Tickers"**.

> [!TIP]
> Every column has its **own** colour domain, scaled to that horizon's 95th percentile. A +3% day is
> remarkable; +3% over ten years is a catastrophe — a single fixed scale would saturate every
> long-horizon column solid green and carry no information.

Controls: **"View"** (**Sectors** / **Countries**), **"Weighting"** (**Equal** / **Market cap** /
**ETF**, each with a help tooltip) and **"Emphasis"** (**None** / **Row best/worst** / **Column
leader**). Legends read **"Momentum (all cols green)"**, **"Mean Reversion (short red, long green)"**
and **"▲ = column champion"**. A caption notes **"{{count}} groups hidden (unclassified, or no
representative ETF)"**.

### Top Performers

On the Screener tab, card **"Top Performers"** with a **"View"** control offering **"Chart"** and
**"Table"**.

The chart draws horizontal bars — X is the value, Y is a category axis of ticker codes. Only **9
bars** are visible at once at 24px each; past that a vertical `dataZoom` **scrolls inside the chart**
rather than truncating the list, and the subtitle becomes **"Scroll within the chart to see all
{{total}} results"**. Tooltip rows: **"Value"**, **"Price"**, **"Day %"**. The table view has columns
**Ticker · Sector · Value · Price · Day % · Market cap · Volume**. Empty: **"No tickers match these
filters"** / **"Loosen a filter, or pick an earlier date."**

The Screener's **"Evaluate & compare"** action opens a dialog holding the metrics comparison panel —
a **"Compare tickers"** picker capped at 8 tickers, above two DOM heat tables selected by a **"View"**
control: **"By Window"** and **"By Metric"**, the latter with a **"Trend"** column holding a pure-SVG
sparkline. Its legend reads **"Best in row"** / **"Middle"** / **"Worst in row"**, each metric carries
a **"higher is better"**, **"lower is better"** or **"— Informational"** hint, and a footnote states
**"Values as of last market close · updated daily"**.

## Data Explorer charts

All behind the `data_explorer` entitlement lock. See [data explorer](/docs/data-explorer).

| Panel | Chart | Notable strings |
|---|---|---|
| Feature time series | A line or bar of one feature column with a dashed zero marker; zoom is a slider plus wheel; tooltip shows the date and the value to 4 decimals | Empty **"No data"** |
| Time coverage | Dual axis — bars named **"Tickers"**, line named **"Records"** — with a legend of both and a slider | Header **"Data presence over time"**; granularity **Monthly** / **Yearly**; empty **"No data available"** |
| Groupings explorer | **"Constituents over time"** / **"Daily constituent count within the selected window"** — one line named **"Constituents"**, Y forced to whole numbers with `scale: true`, wheel zoom only | Timeframes **1Y / 3Y / 5Y / 10Y / Max**; tiles **Days covered · Min / mean / max · First date · Last date** |
| Macro | A line of one macro indicator; the card title is the indicator name and the subtitle the country | Selects **"Country"** and **"Indicator"**; empty **"No macro observations for this selection."** |
| Rates | **"Yield curve"** (a line over tenor categories, subtitled **"U.S. Treasury constant-maturity · as of {{date}}"**) and **"History"** / **"Daily observations for the selected tenor"** with a tenor select | Tiles **"{{tenor}} yield"** and **"2s10s spread"**; empty **"No rate observations yet."** |

The events calendar is a day-grouped list, not a chart.

## Home dashboard visuals

The Home page (`/analysis`) is a draggable grid of cards, each hideable and the whole layout
resettable. Its visuals are mostly hand-rolled.

| Card | Visual |
|---|---|
| **"Active Portfolio Group Performance"** | The Portfolio Manager equity chart, at `metric: 'equity'` |
| **"Monthly Revenue Breakdown ({{year}})"** | Percentage-driven DOM bars; bar tooltip **"{{strategy}} — {{share}} of month-to-date revenue"** |
| **"All Active Portfolio Groups — Financial Results"** / **"Top {{n}} performers highlighted"** | A heat-tinted table |
| **"Asset Exposure"** | A hand-rolled SVG donut ring with an **All / Live / Paper** book toggle, a centre readout ending in **"assets"**, a **"Cash"** arc and a **"{{count}} other assets"** roll-up |
| **"Most Traded Assets"** | DOM bars plus asset logos — the bar length is *trade count*, and the figure beside it is realized P&L as a fraction of NAV |
| **"Deployed Portfolios per Strategy"** | A minimal horizontal bar list |
| Catalog and summary donuts | The same SVG donut over Asset Groups / Strategies / Studies / Portfolios |

The donut is drawn into a fixed 100×100 viewBox scaled to whatever size the card asks for. Arcs are
separated by a small gap (only when there is more than one), and a minimum arc size keeps a tiny
slice from disappearing. The SVG element carries `role="img"` with the caller's label. Arcs are inert
unless the caller supplies a tooltip.

The minimal bar list always renders its category label — hiding it would leave colour as the only
identity channel.

## Usage and token charts

`/account/usage-dashboard` is owner-only; the organization is resolved server-side from the JWT.

- **Usage timeline** — stacked bars per entity type, shadow axis pointer, scrolling bottom legend,
  Y forced to whole numbers. Empty: **"No activity in the selected range."**
- **Token Analytics** — five charts, **all five wrapped in the export-capable frame**:

| Chart | Title / subtitle | Info |
|---|---|---|
| Timeline | **"Consumption over time"** | *"Tokens consumed per period, stacked by category or member. Use the granularity and breakdown controls to change the view."* |
| Flow | **"Acquired vs consumed"** / **"Budget utilization"** | *"Tokens acquired (purchases, grants and refunds) compared with tokens consumed each period. Org-wide — not affected by the category or member filters."* |
| Donut | **"Usage by category"** / **"Share of consumption"** | *"Share of tokens consumed by operation category over the selected range."* |
| Top consumers | **"Top consumers"** / **"By tokens consumed"** | *"Members ranked by tokens consumed over the selected range. Reflects the category filter, not the member filter."* |
| Heatmap | **"Member × category"** / **"Consumption intensity"** | *"Tokens consumed by each member across categories. Reflects the category filter."* |

Each carries an ARIA sentence. Filters: **Granularity** (**Daily / Weekly / Monthly**, default
monthly), **Categories**, **Member** and **Breakdown** (**By category** / **By member**). See
[tokens and billing](/docs/tokens-and-billing).

## Shared charting behaviour

### Theming and palettes

Two ECharts themes are registered, `fintela-dark` and `fintela-light`, and components pick one from
the active MUI palette mode. Both set a transparent background — the card behind the chart supplies
the surface.

| Token set | Contents |
|---|---|
| Categorical series | **8 slots per mode**, in fixed order: blue, gold, crimson, teal, indigo, green, plum, ochre |
| Semantic | `positive`, `positiveSoft`, `negative`, `negativeSoft`, `warning`, `neutral` |
| Sequential | 7 blue stops, low → high |
| Diverging | 9 stops, crimson ↔ neutral ↔ green, symmetric in lightness about the midpoint |
| Blue → gold | 8 stops, lightness rising monotonically across the hue change |

> [!CAUTION]
> **Order is fixed and hues are never cycled or generated.** A ninth series folds into "Other", small
> multiples, or a composite encoding — it does not get an invented colour. That is why Portfolio
> Manager draws lines past slot 8 as a neutral grey swarm and leaves them out of the legend.

Semantic colours are for signed quantities only — P&L bars, waterfalls, deltas. They are never used
in a chart that also renders a categorical legend, because the semantic green sits close to the
categorical teal and olive.

Labels drawn on top of a fill (treemap tiles, market heatmap tiles, robustness heatmap cells) pick
between exactly two inks by *measuring* which has higher contrast against that specific fill. Every
stop of every scale is asserted in CI to clear 4.5:1 with the ink this picks.

Theme-level defaults worth knowing:

- Axes are keyed by axis **type** — category, value, log, time. The category axis carries the
  baseline and no gridlines; the continuous axes carry subtle gridlines and no axis line.
- `tooltip.confine` is **true globally**, so a tooltip can never escape its chart box.
- Default animation is 280ms in and 220ms on update, though many individual charts disable animation
  outright.

### Zoom, pan and crosshair

| Behaviour | Where it applies |
|---|---|
| Wheel zoom + slider | Per-portfolio risk time series, trades history, cascade, allocation history, Portfolio Manager equity, price chart, optimization evolution, result distribution, feature time series, coverage chart |
| Wheel zoom only, no slider | Portfolios dashboard combined equity, Rank & Build equity overlay, groupings timeline, rates history |
| No zoom at all | Portfolio Manager composition area (deliberate), every treemap, every heatmap, every DOM visual |
| Scroll-within-chart | Top Performers, past 9 bars |
| Shift-drag to pan | The single-portfolio equity chart |

The Portfolios dashboard — and only the Portfolios dashboard — links the crosshair across its charts:
hovering one chart moves the tooltip on every other chart on that page, keyed by **date**, so charts
with different axes still line up. **Zoom is intentionally not linked**: the charts have
heterogeneous x-axes, and coupling the zoom used to let a sibling drag the equity chart into a
sub-range and lose the full timeframe. Charts elsewhere in the app get a no-op link.

Portfolio Manager's chart binds one zoom to every stacked panel's x axis, so its panels can never
show different periods.

### Loading, error and empty states

The portfolio charts share one state surface that keeps the card's exact height in every state:

| State | What renders |
|---|---|
| Loading | A centred 28px spinner |
| Error | Title **"Couldn't load this chart"**, a parsed message from the API error, and a **"Retry"** button when the caller supplies a retry handler |
| Empty | **"No data available."**, unless the caller overrides it |

Cards built on the generic frame fall back to the literal `No data` when no caption is given. Several
charts carry their own more specific copy — **"No equity data"**, **"No holdings data available"**,
**"No closed trades available"**, **"No optimization data available."**, **"No hyperparameter data
available."** — because "no data" and "you have not selected anything yet" are different problems.

### Responsiveness and mobile

Charts measure their own container rather than taking a pixel height from a parent, and resize
whenever that measurement changes. Several pages halve heights on mobile — the dashboard risk charts
and the detail equity chart drop from 420px to 240px. The market heatmap derives its height from its
own width. The study Parameters tab pairs charts two-up only above 1024px, because half a tablet
viewport leaves histogram bins and parallel axes unreadable.

### Image and data export

> [!WARNING]
> **Only three charts offer an image export.** Right-clicking an SVG-rendered chart is a browser
> behaviour, not a product feature.

| Surface | Export |
|---|---|
| Token Analytics (all five charts) | Header menu **"Export"** → **"Download CSV"** and **"Download PNG"**. PNG goes through the ECharts data URL at pixel ratio 2, on the card's own background so dark-mode text stays legible |
| **Optimization Evolution** | The ECharts toolbox: `restore` and `saveAsImage` |
| **3D Parameter Explorer** | The Plotly modebar: camera reset and image download |

Data exports that are not images:

| Surface | Export |
|---|---|
| Study header | **"Export hyperparameters"**, **"Export snapshot"**, **"Export best trial"**. The hyperparameters hint reads: *"Downloads every completed trial of the study, with its strategy and risk-manager parameters. The "value" field is the metric and stage you have selected in the chart at export time. Pruned/failed trials are excluded."* |
| **"Trials by family"** | **"Export CSV"** |
| Profile tab | A multi-page A4 PDF of the whole tearsheet, rasterised in the browser. Toasts: **"Preparing…"**, **"The report is not ready yet. Wait for it to finish loading."** |
| Profile tab, `linkedinShare` flag on | A 1200×627 share card rendered off-screen and rasterised to PNG, with a generated caption. With the flag off, a plain share button appears in the masthead instead |

### Limits

Read this before promising a chart behaviour to someone.

- **No chart offers a log scale.** Nothing in the app sets a logarithmic axis. Several charts use
  `scale: true`, which only means "do not force zero" — it is not the same thing.
- **The DOM visuals are not charts.** The Calendar Heatmap, Sector & country performance, Metrics
  comparison, Cross-group correlation, Consensus book, metrics matrix, indicator range strip, market
  breadth bar and the Home bar lists have hover tooltips and nothing else.
- **Benchmark overlays are not one feature.** Four independent implementations exist, with different
  controls: the single-portfolio equity chart, the shared risk time-series chart, the Portfolio
  Manager chart and the Profile tab's growth chart.
- **Percent versus fraction is a live hazard** the code guards in named places. Read the axis unit
  stated on each chart rather than assuming "percent" everywhere: Markets returns arrive already in
  percent, portfolio curves arrive as fractions.
- **Correlation blanks mean "too few shared days", never zero.**
- **Some charts are not light-mode-correct.** Around three dozen modules still import the mode-blind
  legacy colour constants, which resolve to the dark arrays in both themes — among them the market
  price chart, the parameter scatter plots and the parallel-coordinates chart. Do not assume
  universal light/dark parity.
- **A rolling window change is a cache miss.** The curves endpoint's validator folds in the
  normalized series specification, so changing a window refetches even though nothing in the
  database moved. That is deliberate: the rows are identical, the answer is not.

## Chart data sources

Almost every equity-derived risk chart is fed by one batched endpoint.

```http
GET /portfolios/curves?portfolio_ids=4213,4218&series=equity,drawdown,sharpe:60
```

The `series` grammar is strict — a typo is rejected rather than silently producing an empty chart:

| Token | Meaning |
|---|---|
| `equity` | Equity curve |
| `drawdown` | Drawdown |
| `roc:N` (alias `rate_of_change:N`) | Rolling rate of change over an n-day window |
| `sharpe:N` | Rolling Sharpe over an n-day window |
| `volatility:N` (alias `vol:N`) | Rolling volatility over an n-day window |

A rolling series must carry a window; the window must parse as an integer and be greater than zero;
an unknown series name is refused; and an empty `series` list is refused. Every one of those returns
**HTTP 400**, quoting the offending token back and — for an unknown name — listing the accepted set.
The rejection is deliberate: a typo that quietly produced no key would surface as an empty chart with
no error at all.

Response keys are `equity`, `drawdown`, `rate_of_change`, `sharpe` and `volatility`, each a map of
portfolio id → date → value. Equity serialises to 2 decimals and the other four to 6 — display
precision, applied **only** on this route, because the five single-series endpoints below are read by
Fintelligent's tools and stay bit-for-bit. `NaN` survives on purpose across a rolling series' warm-up
window, so the chart draws a gap instead of inventing a data point.

The Portfolios dashboard asks for `drawdown`, `roc:N`, `sharpe:N` and `volatility:N` and
deliberately omits `equity` — the ranking cards already hold it.

| Path | Feeds |
|---|---|
| `/portfolios/equity` | Combined equity chart, ranking sparklines, robustness equity overlay, calendar heatmap |
| `/portfolios/drawdown_vector` | Detail drawdown chart |
| `/portfolios/roc_vector?shape=N` | Detail rate-of-change chart |
| `/portfolios/sharpe_vector?shape=N` | Detail Sharpe chart |
| `/portfolios/volatility_vector?shape=N` | Detail volatility chart |
| `/portfolios/dates` | The date axis alone, for the period filter |
| `/portfolios/holdings` | Holdings heatmap, calendar heatmap |
| `/portfolios/holdings/feature?feature=…` | Allocation treemap and stacked area |
| `/portfolios/metrics` | Metrics Radar, the Metrics Comparison table, the scorecards |
| `/portfolios/overfitting` | Per-trial Deflated Sharpe gauge |
| `/portfolios/trials` | The **"Trial N · study"** series names |
| `/portfolios/:id/simulate` (POST) | The inverted what-if overlay |
| `/studies/opt/history` | Optimization evolution, result distribution, robustness rank and slope charts |
| `/studies/opt/params` | Parameter scatter grid, 3-D explorer, parallel coordinates |
| `/studies/overfitting` | The whole Robustness tab |
| `/studies/clustering` | The whole Families tab |
| `/studies/param-importances` | Importance bars and the divergence panel |
| `/studies/errors` | The failure bar chart |
| `/portfolio_manager/dashboard/compare/series` | Portfolio Manager equity chart and Home's group performance card |
| `/portfolio_manager/dashboard/compare/correlation` | Cross-group correlation triangle |
| `/portfolio_manager/dashboard/compare/lifecycle` | Lifecycle milestone markers — its own endpoint so four dates are not refetched on every window keystroke |
| `/portfolio_manager/baskets/:id/composition` | Composition area and treemap |
| `/portfolio_manager/managed/equity`, `/portfolio_manager/managed/holdings` | Rank & Build charts in managed mode |
| `/tickers/ts` | Benchmark equity for every benchmark overlay |

## Retired chart surfaces

None of the following are live. They exist only as redirects, and no chart lives at them.

| Old path | Redirects to |
|---|---|
| `/analysis/portfolios/:portfolioId/metrics` | Performance tab |
| `/analysis/portfolios/:portfolioId/equity` | Risk Analytics tab |
| `/analysis/portfolios/:portfolioId/risk-managers` | Risk Analytics tab |
| `/analysis/portfolios/:portfolioId/trades` | Transactions tab |
| `/analysis/portfolios/:portfolioId/orders` | Transactions tab |
| `/analysis/portfolios/:portfolioId/investor` | Profile tab |
| `/analysis/portfolio-manager/:basketId/performance` | The group's Equity tab |
| `/analysis/portfolio-manager/:basketId/risk` | The group's Equity tab |
| `/analysis/portfolio-manager/:basketId/transactions` | The group's Trades tab |
| `/analysis/deployed-portfolios/*` | `/analysis/portfolio-manager/*` |
| `/data-pipelines/*` | `/analysis/data-explorer` |
| `/dataCluster/*` | `/asset-groups` |
| `/analysis/markets?tab=rotation` | `?tab=groups` |
| `/analysis/markets?tab=indicators` | `?tab=screener` |
| `/analysis/markets?tab=metrics` | `?tab=screener&compare=1` |

Two consequences worth stating plainly:

- **There is no group-level Drawdown, Rolling Volatility, Rolling Sharpe or Rolling ROC chart page.**
  Those became Y-axis selections on the Portfolio Manager equity chart — the redirect's own note is
  *"→ Equity, where the risk question is an axis choice."*
- **Metrics comparison is no longer a Markets tab.** It is a dialog launched from the Screener's
  **"Evaluate & compare"** action, which is why the legacy `?tab=metrics` link lands on the Screener
  with `compare=1` set.
