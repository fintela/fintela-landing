---
title: Portfolio Detail
section: Analysis & Portfolios
sectionOrder: 4
order: 2
published: true
updated: 2026-08-20
summary: The six tabs of a single portfolio — performance, holdings, transactions, risk, overfitting and profile.
keywords: portfolio detail, performance, holdings, transactions, trades, orders, risk analytics, overfitting, tearsheet, profile
---

Every trial a study produces is a portfolio, and every portfolio opens into the **Portfolio Analysis** tab — one screen with six sub-views behind a dropdown. Performance answers "did this work", Holdings "what did it hold", Transactions "what did it do", Risk Analytics "how did it hurt", Robustness "is the result real", and Profile "can I show this to someone". The tab is hidden until you drill into a portfolio from the [Portfolios Dashboard](/docs/portfolios-dashboard) or the [Optimization Dashboard](/docs/optimization-dashboard), then stays open until you dismiss it.

## The six tabs

Each tab is a real route, so the dropdown items are ordinary links and open-in-new-tab works. Performance is the bare `:portfolioId` route with no trailing segment.

| Tab caption | URL | Page component | Consolidates |
|---|---|---|---|
| `Profile` | `/analysis/portfolios/:portfolioId/profile` | `PortfolioInvestorPage` | the former Investor tearsheet |
| `Performance` | `/analysis/portfolios/:portfolioId` | `PortfolioPerformancePage` | former Overview + Metrics |
| `Holdings` | `/analysis/portfolios/:portfolioId/holdings` | `PortfolioHoldingsPage` | — |
| `Transactions` | `/analysis/portfolios/:portfolioId/transactions` | `PortfolioTransactionsPage` | former Trades + Orders |
| `Risk Analytics` | `/analysis/portfolios/:portfolioId/risk` | `PortfolioRiskAnalyticsPage` | former Equity & Risk + Risk Managers |
| `Robustness` | `/analysis/portfolios/:portfolioId/overfitting` | `PortfolioOverfittingPage` | — |

The dropdown renders in exactly that order. Nine pre-consolidation sub-views collapsed into these six; the retired segments still resolve, as redirects — see [Retired sub-routes](#retired-sub-routes).

> [!WARNING] The Robustness tab's URL segment is `overfitting`
> Label, segment and component names diverge here: the caption is **Robustness**, the path segment is `overfitting`, and the component is `PortfolioOverfittingPage`. Likewise the **Profile** tab is served by `PortfolioInvestorPage`.

### Which tab a drill-down lands on

The landing sub-view is decided by the `investorView` feature flag, which defaults to **on**:

| `investorView` | Drill-downs land on | Profile in the dropdown |
|---|---|---|
| on (default) | `Profile` | shown |
| off | `Performance` (the bare route) | hidden — but `/…/profile` still resolves and renders |

Flags resolve as `?ff_investorView=1|0` in the URL → `localStorage['fintela.flags.investorView']` → the compile-time default.

Every drill-down goes through one URL builder, which re-attaches `?studyId=` unless the dashboard is in the cross-study `all` mode, and always strips `?analysis=` (the path already names the portfolio).

### What every tab shares

All six render the same slim header: a provenance strip on the left with **`Source strategy`** and **`Author`**, and a help button on the right whose tooltip and aria-label read **`View documentation`**, opening a contextual docs panel anchored right.

Two guards are also shared, but not by all six pages:

| Condition | Result | Message |
|---|---|---|
| Route param is not a positive finite number | error alert | `Invalid portfolio ID.` |
| Portfolio metadata or equity fails to load | warning alert | `This portfolio is no longer available. It may have been deleted, or you may not have access to it.` |

Both render a button **`Close Portfolio Analysis`**, which performs the same dismissal as the tab's "x".

> [!NOTE] The unavailable guard is not on every tab
> Only **Performance** and **Profile** branch on a load error — they are the two possible drill-down landing views. **Holdings**, **Transactions**, **Risk Analytics** and **Robustness** carry only the invalid-id guard, so a deleted portfolio renders empty panels there rather than the exit.

Portfolios are labelled `Trial N · <study display name>`, never by their raw id — trial numbers collide across studies, so they always travel with study context. The one place the raw id does surface is the Profile tab's `Reference` field, which renders `#<portfolioId> · Trial N`.

> [!NOTE] Nothing on these tabs polls
> Queries are cached with a 60-second stale time, `refetchOnWindowFocus` is off, and there is no refetch interval, websocket or auto-refresh anywhere in this surface. Data refreshes on navigation and remount.

## Performance

The bare `:portfolioId` route. It merges what used to be two pages — the equity overview and the metrics matrix — and renders each block exactly once.

### Header actions

Four right-aligned buttons sit above the equity card. On mobile each collapses to an icon button.

| Button | Tooltip | What it does |
|---|---|---|
| `Seed` | `View and download this trial's seed (the daily rebalancing signal the engine uses)` | Opens a dialog titled **`Trial seed`**. The seed is fetched only when the dialog opens. Download filename base is `trial_<trial>_<study_name>_seed`, with each run of characters outside `[\w.-]` collapsed to a single `_`. |
| `Test Risk Manager` | `Test a Risk Manager on this portfolio in the sandbox` | Links to `/strategy/sandbox?mode=risk_manager_exploration&originPortfolio=<id>&from=<encoded current path>`. |
| `Derive / Optimize RMs` | `Derive risk-manager-optimized variants of this portfolio` | Opens the Derive Risk Managers wizard, seeded with this portfolio as the single source. |
| `Invert (what-if)` | `Flip every position L↔S and re-simulate this trial. Preview only — nothing is saved or traded.` | Toggles a transient inverted simulation. |

`Test Risk Manager` and `Derive / Optimize RMs` are both disabled while the risk-manager query is loading and whenever the portfolio already carries a risk manager. In the second case their tooltip changes to **`This portfolio already contains a Risk Manager`**. The disabled `Test Risk Manager` control deliberately exposes no `href`.

### Equity curve

A card titled **`Equity Curve`** wrapping the chart, with quick-timeframe buttons. The canonical button set, in order, is `All`, `Since creation`, `Train`, `Val`, `OOS`, `RLP`, `YTD`, `MTD`, `1M`, `1W` — each rendered only when it applies. `Train` and `Val` need a train-end boundary, `OOS` needs the study to have been configured with an out-of-sample window, `RLP` needs real-life-performance data to exist, and `Since creation` is a basket-only window that never appears on a trial.

A benchmark ticker selector is embedded in the chart. The legend shows **`Portfolio`**, the benchmark label, and one swatch per available study period. When there is no curve the chart reads **`No equity data`**.

Zooming the chart or picking a preset publishes the visible window to the rest of the page: the windowed metrics query and the scorecard's `W · ` chips both follow it.

### Invert what-if

While the toggle is on, an inverted re-simulation overlays the stored curve and a panel appears below it: a warning chip **`Inverted (what-if)`**, and, when the portfolio has a risk manager, the caption **`What-if excludes risk managers.`** A failure renders **`Could not simulate the inverted what-if.`**

The panel's four figures are labelled with hardcoded English strings — `Total Return`, `CAGR`, `Sharpe Ratio`, `Max Drawdown` — not i18n entries, so they stay English in every locale. If any ticker had no market data, the caption **`Some tickers had no market data and were excluded: {{tickers}}`** lists them.

The what-if is transient. It is never persisted, and it resets when you navigate to another portfolio.

### Metrics comparison

The metrics half of the page opens with the bold heading **`Metrics Comparison`** and, when overfitting scores exist, a compact verdict chip whose tooltip carries `Deflated Sharpe (OOS):`, `Prob. Sharpe (OOS):`, `Study PBO:` and `Trials:`.

Seven summary KPI cards follow — a metric with no value in any stage is skipped rather than rendered empty. Each card shows a stage badge, the value, the metric name and a signal badge:

| Card label | Metric | Preferred stage |
|---|---|---|
| `Fitness` | `fitness` | `overall` |
| `Sharpe Ratio` | `sharpe_ratio` | `out_of_sample` |
| `Max Drawdown` | `max_drawdown` | `out_of_sample` |
| `CAGR` | `compound_annual_growth_rate` | `overall` |
| `Total Return` | `total_return` | `overall` |
| `Win Rate` | `win_rate` | `out_of_sample` |
| `Profit Factor` | `profit_factor` | `overall` |

Stage badges read `Train`, `Val`, `OOS`, `Overall`, `RLP`. When study metadata is available, the `Fitness` card also renders the study's fitness name, kind and description.

### Metric signals

Signal badges are per-metric diagnostics computed client-side by comparing stages. They are **not** the overfitting verdict — that lives on the [Robustness tab](#robustness-overfitting) and is statistically grounded.

| Badge | Rule |
|---|---|
| `High Risk` | OOS `max_drawdown`/`average_drawdown` magnitude > 0.20, or `volatility` > 0.30 |
| `Controlled Risk` | OOS `max_drawdown`/`average_drawdown` magnitude < 0.10, or `volatility` < 0.15 |
| `Train≫OOS` | train→OOS deterioration > 30% **and** (no validation stage, or train→val > 30%) |
| `Val Weak` | train→val > 25% **and** train→OOS < 20% |
| `OOS Strong` | OOS is at least as good as train |
| `Stable` | relative spread across the present stages < 15% |

A metric with no train value gets no badge at all. When a study has no out-of-sample stage, validation stands in as the out-of-sample reference. `total_return`, `max_drawdown_duration` and `recovery_factor` are time-normalised against each stage's calendar-day span before the comparison, so unequal stage lengths do not fake a signal.

> [!NOTE] Two signal values ship in the code but never render
> `Overall Best` and `Weak` exist as enum values and locale strings, but the only function that produces signals never returns them. Six badges are reachable.

### Windowed scorecard and Window Bucket

An accordion headed **`Metrics`**, collapsed by default. Its header carries chips for `compound_annual_growth_rate`, `sharpe_ratio` and `max_drawdown` at the primary stage — out-of-sample if present, else validation, else the first stage with data — and, while a chart window is active, the same three prefixed **`W · `**.

Inside sits the detail metrics table: one row per metric, one column per active stage, plus a **`Window`** column that appears only while a chart window is active (its header carries the window's `YYYY-MM → YYYY-MM` span). This is the only surface anywhere with the equity-zoom Window column. Benchmark rows are fed from a separate benchmark window query.

The scorecard header also hosts the **`Window Bucket`**, which collects several windows and averages them:

| Control | Copy |
|---|---|
| Add the current chart zoom | `Add zoomed window`, or `Zoom the chart first` when there is none |
| Add a hand-typed window | `Custom range`, with `Start`, `End`, `Label (optional)`, `Cancel`, `Add` |
| Weights | `Weights:`, `(must be 100%)`, `Equal weights` |
| Compute | `Calculate weighted avg` → `Computing…` → `Weighted average result`; on failure `Failed to compute. Try again.` |
| Empty | `No windows added yet.` |

The weighted result reports four figures: `Total Return`, `CAGR`, `Volatility`, `Max Drawdown`.

### Radar, heatmap and advanced metrics

- **`Metrics Radar`** renders only when at least two stages have data. Subtitle: `Values normalised per metric — higher area = better except for risk metrics`. It has a `Select metrics` control and a `Metrics ({{active}} / {{total}})` counter, and falls back to `Not enough data for radar chart (need at least 2 series with ≥ 3 metrics).`
- The per-stage heatmap is titled **`Metrics Comparison`**, with columns **`Metric`**, one per active stage, **`Best`** and **`Signal`**. It excludes the advanced set below.
- **`Advanced Metrics`** is an accordion, collapsed by default, whose header carries a count badge and which holds exactly the excluded metrics: `skewness`, `excess_kurtosis`, `tail_ratio`, `up_capture`, `down_capture`, `information_ratio`, `treynor_ratio`, `beta`, `alpha`, `correlation`, `payoff_ratio`, `recovery_factor`, `omega_ratio`, `martin_ratio`.

Definitions, units and direction for every metric live in the [metrics reference](/docs/metrics-reference).

### Strategy configuration

A collapsible section titled **`Strategy configuration`**, closed by default, whose open state persists for the browser session under `fintela.portfolios.section.performance-config`. It holds four blocks:

| Block | Title | Notes |
|---|---|---|
| Parameter chips | `Parameters` | Renders `None` when the trial has no parameters. |
| Study information | `Study Information` | Only when `?studyId=` is present. Fields, in order: `Strategy`, `Author`, `Fitness`, `Strategy Asset Group`, `Fitness Asset Group`, `Train Period`, `Validation Period`, `Trials`. `Author` is the strategy's author, not whoever launched the study. |
| Risk manager configuration | `Risk Manager Configuration` | The final risk-manager values that built this portfolio. Renders nothing at all when there are none; on a failed fetch it shows `Could not load the risk-manager configuration.` |
| Lineage | `Portfolio lineage` | Renders nothing when the portfolio has neither a parent nor derived children. Otherwise `Derived from`, `via study #{{id}}.` and `{{count}} derived portfolios (risk-manager variants of this one):`. |

## Holdings

What the portfolio actually held, and when. This tab reads the **shared timeframe filter** that the layout renders above it — one of only two tabs that do (the other is Risk Analytics).

Four panels, in order:

1. **`Equity Curve`** — a filled time-series chart. Its header carries a benchmark ticker selector (with an exchange filter) and an alignment toggle switching between **`Aligned to window start`** and **`Raw values`**. Clicking a point pins the holdings date; hovering previews it. Selected holdings paint coloured highlight bands on the curve.
2. **`Allocation Snapshot`** — a treemap plus legend for the pinned date, with a feature selector over the seven ticker features `Code`, `Type`, `Isin`, `Sector`, `Industry`, `Country`, `Currency`. Empty state: **`No holdings data available`**.
3. **`Current Holdings`** — a table with columns **`Symbol`**, **`Weight`**, **`Change`**, **`Allocation`**. Its subtitle is the date followed by `{{count}} positions`, with `CASH` excluded from the count.
4. **`Historical Allocation by {{feature}}`** — subtitle **`Weight over time (stacked %)`**, a stacked-percentage area over the same feature the snapshot is showing.

> [!NOTE] Every weight has a net and a gross component
> Holdings arrive per bucket as `{ net, gross }`: `gross` is the size of the position, `net` carries the sign (positive long, negative short). The snapshot sizes its treemap tiles by **gross** — a short must not shrink to nothing — and marks short entries by the sign of `net`, appending **` (S)`** on the tile and legend label and **`(SHORT)`** in the tooltip. The history stacks the **net** weights instead, so shorts sit below the zero line; its tooltip appends the same **`(SHORT)`**. The Current Holdings table lists signed net weights and shows the same **`SHORT`** marker as a chip. Undeployed capital — `1 − Σ gross`, matching the engine's own convention — is shown as `CASH`.

## Transactions

The former Trades and Orders pages, merged. The whole tab sits inside one filter provider, so a single ticker + status + date selection drives every trade visual on the page. The Orders section reads the same ticker and date window but not the open/closed status — that filter is about trades — and its summary tiles ignore the filter entirely (see below).

### Summary tiles

Five tiles, recomputed from the **filtered** trades on every filter change:

| Tile | Value | Sub-label |
|---|---|---|
| `Trades` | total count | `{{closed}} closed · {{open}} open` |
| `Win Rate` | wins ÷ closed, as a percentage | `{{wins}}W / {{losses}}L` |
| `Avg Return` | signed percentage over closed trades | `over {{count}} closed` |
| `Avg Duration` | mean closed-trade duration, rounded, with a `d` suffix | — |
| `Best Trade` | the ticker code of the closed trade with the highest return | its signed return |

A closed trade counts as a win when its `total_return_percentage` is greater than or equal to zero. A trade is closed when it has an exit date.

### Shared filter toolbar

| Control | Options |
|---|---|
| Asset select | `All assets` plus one option per traded ticker; search placeholder `Search asset…`, aria-label `Asset` |
| Status | `All` / `Open` / `Closed` |
| Date | `All`, `YTD`, `QTD`, `MTD`, `Custom`, grouped under `Calendar ranges` |

The date filter here is restricted to calendar ranges. The study-period chips (`Train`, `Val`, `OOS`, `RLP`, grouped under `Study periods`) that the layout's filter offers are **not** available on this tab.

### Trades chart and table

The chart is titled **`Trades History`**, subtitled **`Return % per trade · sorted by exit date`**, and falls back to **`No closed trades available`**.

The table's header caption reads `{{count}} trades`. Its header is sticky, and every column except the last sorts on click; the default sort is `entry_date` descending, and switching to a new column starts descending.

| Column | Sort key | Rendering |
|---|---|---|
| `Ticker` | `ticker_code` | — |
| `Side` | `position_side` | chip reading `L` (green) or `S` (red) |
| `Entry` | `entry_date` | — |
| `Exit` | `exit_date` | the exit date, or the primary-coloured **`● Open`** for an open trade |
| `Days` | `total_duration_days` | — |
| `Avg In` | `avg_entry_price` | — |
| `Avg Out` | `avg_exit_price` | — |
| `Invested` | `invested` | — |
| `Return` | `total_return_percentage` | mini bar plus a signed percentage |
| `P&L` | `total_pnl` | see the caution below |
| `MFE` | `mfe` | — |
| `MAE` | `mae` | — |
| `Scaling` | not sortable | inline sparkline of the trade's P&L progression, from a single batched request |

The empty state is **`No trades match the current filter.`** Clicking any row opens the trade drawer.

> [!CAUTION] The `P&L` column is formatted as a percentage
> The cell renders `total_pnl` — a money value — through the signed-percentage formatter. Read the column as the raw P&L figure, not as a percentage of anything.

### Trade detail drawer

Headed **`Trade #{{id}}`**, with a side chip reading **`LONG`** or **`SHORT`** and an **`Open`** badge where applicable. Fields: **`Total P&L`**, **`Avg Entry`**, **`Avg Exit`**, **`Quantity`**, **`Invested`**, **`Allocation`**, **`Duration`**, **`MFE`**, **`MAE`**, followed by a **`Scale-ins / P&L Progression`** section.

### Trade plots

Three charts in one responsive grid, all driven by the filtered trades.

| Title | Help text |
|---|---|
| `Return vs. Duration` | `Each point is a closed trade: holding period (x) vs. realized return (y). Green = winner, red = loser; circle = long, triangle = short.` |
| `Outcome by Side` | `Wins vs. losses split by trade direction (long / short), so you can see which side carries the edge.` |
| `MFE / MAE Efficiency` | `Max adverse excursion (heat taken) vs. max favorable excursion (opportunity seen), colored by realized outcome.` |

`Return vs. Duration` and `Outcome by Side` fall back to **`No closed trades in the current filter.`**; `Outcome by Side` otherwise captions itself **`Overall win rate {{rate}}%`**. The efficiency chart has one empty state of its own — **`MFE / MAE are not available for this trade source.`** — shown whenever no trade in the filter carries excursion data.

### Calendar heatmap

Titled **`Calendar Heatmap`**. A metric selector offers **`Daily Return %`**, **`Trade P&L ($)`** and **`Capital Invested ($)`**; a granularity control offers **`Daily`** / **`Weekly`** / **`Monthly`**; a year selector appears once the data spans more than one year. Empty states are **`No data available`** for the chart and **`No data`** per cell, and the reading hint is **`hover a cell for the exact value`**.

The explainer tooltip reads: *Each cell is one period. Color encodes the metric — a red→green diverging scale for return/P&L (sign + magnitude) and a blue ramp for invested capital. In the daily view rows are weekdays and columns are weeks.*

### Orders

A collapsible section titled **`Orders`**, **open by default**, persisted per browser session under `transactions-orders`, and unmounted entirely while collapsed.

Six summary tiles come straight from the server: **`Total Orders`**, **`Buy Orders`**, **`Sell Orders`** (the two latter with a `{{value}} of total` sub-label), **`Unique Tickers`**, **`First Order`**, **`Last Order`**.

> [!WARNING] The Orders tiles ignore the filters
> Every other visual on this tab moves with the shared selection — the trade visuals on all three of ticker, status and date, the orders charts and table on ticker and date. These six tiles are portfolio-wide, server-computed figures and do not move when you filter.

Two charts, both driven by the filtered orders: **`Order Activity`** / **`Monthly BUY / SELL counts`**, a stacked monthly bar with a zoom slider, and **`Orders by Ticker`** / **`Top 15 tickers · BUY vs SELL breakdown`**, a horizontal stacked bar.

The table header shows `{{count}} orders` and a segmented control with the raw literals **`ALL`** / **`BUY`** / **`SELL`** — this is a local filter, layered on top of the shared asset and date window. Default sort is `order_date` descending.

| Column | Sort key | Rendering |
|---|---|---|
| `Order ID` | `order_id` | — |
| `Ticker` | `ticker_code` | — |
| `Date` | `order_date` | — |
| `Action` | `action` | chip: `BUY` green, `SELL` red |
| `Side` | `position_side` | chip: `LONG` green, otherwise secondary |
| `Qty` | `quantity` | — |
| `Resulting Qty` | `resulting_quantity` | — |
| `Source` | not sortable | see below |

The `Source` chip has three shapes. `strategy` renders as-is in blue. `risk_manager:<name>` renders as just `<name>` in purple, with the full value in the element's `title` attribute. `manual` renders as-is. Rows persisted before the risk-manager migration carry a null source and are treated as `strategy`.

## Risk Analytics

Where the equity curve is read as a risk object. Like Holdings, this tab reads the layout's shared timeframe filter.

### Stat cards and equity curve

Four stat cards open the page: **`Start Value`**, **`End Value`**, **`Period Return`** and **`Data Points`**. `Period Return` is a signed percentage, coloured by sign.

Below them, a tall equity chart with a toggle between two modes:

- **Line** — the filled curve.
- **Cascade** — a waterfall of daily returns. Tooltip rows are labelled **`Day:`** and **`Cum:`**, and the info tooltip reads **`Daily return % — green gains, red losses`**. The cascade re-bases so the first *visible* bar starts at zero on every zoom.

The toggle's tooltip flips between **`Switch to Line`** and **`Switch to Cascade`**.

### Rolling risk charts

Four charts in two rows. Each has its own toggle between a time series and a histogram, with tooltips **`Switch to Histogram`** / **`Switch to Time Series`**.

| Chart | Line title / subtitle | Histogram title / subtitle | Rolling window |
|---|---|---|---|
| Drawdown | `Drawdown` / `Peak-to-trough decline` | `Drawdown distribution` / `Histogram of drawdown` | not windowed |
| Volatility | `Volatility` / `Rolling {{count}}-day window` | `Volatility distribution` / `Histogram of rolling volatility` | default **20** |
| Rate of Change | `Rate of Change` / `Rolling {{count}}-day window` | `Rate of Change distribution` / `Histogram of momentum (ROC)` | default **20** |
| Sharpe | `Sharpe Ratio` / `Rolling {{count}}-day window` | `Sharpe distribution` / `Histogram of risk-adjusted return` | default **20** |

In line mode, the three windowed charts expose an inline **`Window`** number field, minimum 2 and maximum 252. In histogram mode each chart gets a settings popover titled **`Chart settings`** with **`Bins`** (default 30, 5–200) and **`Density`** (off by default); on the three windowed charts the popover also carries a **`Window size`** field over the same 2–252 bounds. Changing a window re-requests that series from the server.

> [!NOTE] Window defaults differ between surfaces
> The rolling charts on this tab default to a 20-day window. The equivalent charts on the [Portfolios Dashboard](/docs/portfolios-dashboard) default to 14.

### Risk-manager execution log

A card titled **`Risk-manager execution log`**, subtitled *Exceptions, timeouts, invalid outputs, and terminal transitions emitted by the risk managers attached to this portfolio during its trial. Empty is the happy path.*

Each row shows an event-type chip, the risk manager's name and kind, the trial number, the tick date, the timestamp, and the event payload rendered as raw JSON — the payload shape varies by event type, so it is deliberately not given a structured renderer. Event types and their colouring:

| `event_type` | Tone |
|---|---|
| `exception` | error |
| `timeout` | warning |
| `invalid_output` | warning |
| `terminal` | error |
| `rejected` | warning |
| `halted` | info — a circuit-breaker trip is a protective action, not a fault |
| `reactivated` | success |

The empty state is **`No risk-manager events recorded for this portfolio.`**, and it is the expected one. Rows come back ordered by `occurred_at` descending, so the most recent failure is first, and the server caps the response at 200 rows. See [Risk Managers](/docs/risk-managers) for what emits these.

## Robustness (overfitting)

The statistically grounded answer to "is this result real, or is it the luckiest of many backtests". This is the authoritative overfitting verdict for a portfolio; the per-metric [signal badges](#metric-signals) on the Performance tab are only diagnostics.

### When scores exist

Overfitting scores are computed **once, at study finalization**, not on demand. Until a study finishes (or is re-finalized), the tab has nothing to show.

| State | Message |
|---|---|
| No stored scores | `No robustness analysis available for this portfolio yet. Scores are computed when a study finishes — re-run the study (or its finalization) to populate them.` |
| Query failed | `Couldn't load the robustness analysis. The scoring service may be unavailable — try again shortly, and if it persists check that the overfitting tables and endpoint are deployed.` |

The two are deliberately distinguished, so a broken deploy never masquerades as an unscored study. Study-level PBO additionally requires at least 2 dense trials and at least 40 days of common history; without those, the study-level figures stay empty while the per-portfolio ones may still resolve.

### Verdicts

The hero panel is titled **`Deflated Sharpe Analysis`** and carries the verdict chip plus its meaning.

| Stored verdict | Chip label | Meaning shown |
|---|---|---|
| `well_trained` | `Well Trained` | The out-of-sample edge survives the selection-bias correction. Strong evidence of genuine skill rather than the luckiest of many backtests. |
| `borderline` | `Borderline` | The edge only weakly survives the selection-bias correction. Treat with caution and prefer corroborating evidence before trusting it. |
| `overfit_risk` | `Overfit Risk` | The out-of-sample result is not clearly distinguishable from the best of many random trials, and/or it degrades materially out-of-sample. High risk of overfitting. |
| `uncertain` | `Insufficient Data` | There is not enough out-of-sample history or trial dispersion to compute a confident verdict. Interpret the raw metrics directly. |

> [!WARNING] The `uncertain` verdict displays as "Insufficient Data"
> The stored enum value and the rendered label differ. Filtering or scripting against the API uses `uncertain`.

The classifier runs in this order, and the first match wins:

1. **`uncertain`** when out-of-sample observations are below 30, or the deflated Sharpe is not finite, or the cross-trial Sharpe variance is not positive, or the effective trial count is 1 or less.
2. **`overfit_risk`** when the train→OOS degradation test is flagged, **or** study PBO is above 0.5, **or** the deflated Sharpe is below 0.90.
3. **`borderline`** when the deflated Sharpe is below 0.95.
4. **`well_trained`** otherwise.

### Deflated Sharpe gauge and skill vs. luck

Two charts sit side by side.

**`Deflated Sharpe (confidence it is real skill)`** is a 0–100% gauge whose colour zones break at exactly the verdict cutoffs: red below 90, amber 90–95, green at 95 and above. Its caption reads **`Red <90% · Amber 90–95% · Green ≥95%`**. An outer halo ring encodes the study-level PBO — red when PBO exceeds 0.5 — captioned **`Outer ring: study PBO {{pbo}}`**. With no deflated Sharpe it reads **`Not enough data to compute a Deflated Sharpe.`**

**`Skill vs. luck`** is a two-bar horizontal chart on an **`Annualized Sharpe`** axis, with the categories **`Best-of-N luck (SR₀)`** and **`Your OOS Sharpe`**, plus a dashed `SR₀ <value>` reference line. Its caption reads **`SR₀ is the Sharpe the best of {{n}} trials would reach with zero real skill. Clearing it is the bar for genuine edge.`** With no out-of-sample Sharpe it reads **`No out-of-sample Sharpe available.`**

The stored `sr0` is a per-period figure, so both the bar and the `Luck threshold SR₀` card annualize it by ×√252 before display. The observed OOS Sharpe is read straight off the metrics response, which the engine already serves annualized, and falls back to the **validation** Sharpe when the study has no out-of-sample stage.

Below the charts, a plain-language paragraph is assembled from the numbers — how many strategies were tried and their effective independent count, this portfolio's out-of-sample Sharpe, its deflated Sharpe with a verbal judgement (`strong evidence of genuine skill` / `borderline — the edge only weakly survives the correction` / `not distinguishable from best-of-N luck`), whether out-of-sample degrades versus training and by what z, and the study-level PBO with a `high` / `low` label.

### Component breakdown

Eight stat cards, each with a hover tooltip.

| Label | Sub-label | What it means |
|---|---|---|
| `Deflated Sharpe (OOS)` | `vs. best-of-N null` | Probability the true OOS Sharpe exceeds the level the best of N trials would reach by luck alone. Corrects for selection bias, sample length, skew and kurtosis. ≥95% = well trained. |
| `Probabilistic Sharpe (OOS)` | `vs. zero` | Probability the true OOS Sharpe is positive, ignoring how many strategies were tried. PSR > DSR always; the gap is the price of searching many strategies. |
| `Your OOS Sharpe` | `annualized` | The portfolio's realized out-of-sample Sharpe ratio (annualized, ×√252). |
| `Luck threshold SR₀` | `annualized` | Expected maximum Sharpe under a zero-skill null across the effective number of trials. Your Sharpe must clear this to indicate real edge. |
| `OOS observations` | `trading days` | Number of out-of-sample daily returns behind the verdict. Below ~30 the verdict is `uncertain`. |
| `Train → OOS degradation` | `flagged (z > 1.65)` or `not significant` | One-sided z-test that OOS Sharpe is materially below training Sharpe. Train is selection-inflated, so read it alongside the val→OOS test. |
| `Val → OOS degradation` | `unbiased decay test` | The same z-test on validation vs. OOS. Both are held out, so it isolates genuine decay from selection inflation. |
| `OOS autocorrelation` | `lag-1` | Serial correlation of OOS daily returns. Above ~0.2 in magnitude the annualized Sharpe — and these tests — can be biased. |

The `Deflated Sharpe (OOS)` value is tinted by the verdict. `Train → OOS degradation` turns red when the test is flagged. `OOS autocorrelation` turns amber when its magnitude exceeds 0.2.

### Study-level context

Two more cards under the heading **`Study-level context`**. These describe the whole search, not this one portfolio, so they are identical across every trial of the same study.

| Label | Sub-label | What it means |
|---|---|---|
| `Backtest Overfitting (PBO)` | `high` or `low` | Probability that the strategy ranked best in-sample underperforms the median out-of-sample, across combinatorial train/test splits (CSCV). Green at 0.5 or below, red above. |
| `Trials searched` | `≈{{value}} effective` | How many strategy configurations the optimizer evaluated (N), and the effective independent count after accounting for correlation between trials. More trials ⇒ a higher luck threshold SR₀. |

### The statistics behind the tab

Four statistics do the work. All are computed in Python at study finalization and persisted.

| Statistic | Definition |
|---|---|
| **PSR** — Probabilistic Sharpe Ratio | `PSR(SR*) = Φ( (SR − SR*)·√(n−1) / √(1 − g₃·SR + ((g₄−1)/4)·SR²) )`, using Lo's variance of the Sharpe estimator, where `g₃` is skewness and `g₄` is raw (non-excess) kurtosis. |
| **DSR** — Deflated Sharpe Ratio | `PSR` evaluated at `SR* = SR₀` over the out-of-sample returns. `SR₀ = √V · [ (1−γ)·Φ⁻¹(1 − 1/N_eff) + γ·Φ⁻¹(1 − 1/(N_eff·e)) ]`, with `γ = 0.5772156649015329` (Euler–Mascheroni), `V` the cross-trial Sharpe variance and `N_eff = ρ̂ + (1 − ρ̂)·M` the effective independent trial count. |
| **PBO** — Probability of Backtest Overfitting | Combinatorially Symmetric Cross-Validation. Split the common timeline into `S` equal contiguous blocks (`S` starts at 16, must be even, and shrinks by 2 until every block holds at least 20 observations), evaluate every symmetric `C(S, S/2)` in-sample/out-of-sample split, take the logit of the in-sample-best trial's out-of-sample rank, and report the fraction of splits where that logit is ≤ 0. Above 20 000 splits a deterministic Monte-Carlo subsample is used instead. Needs at least 2 trials. |
| **Degradation** | `z = (SR_a − SR_b) / √(Var(SR_a) + Var(SR_b))`, a one-sided test that window B's Sharpe is materially below window A's, assuming disjoint windows. |

The thresholds the verdict uses are fixed constants:

| Constant | Value |
|---|---|
| `DSR_WELL_TRAINED` | `0.95` |
| `DSR_BORDERLINE` | `0.90` |
| `PBO_HIGH` | `0.5` |
| `MIN_OBS_FOR_VERDICT` | `30` |
| `DEGRADATION_Z_CRIT` | `1.645` |

Note that the card's sub-label rounds the critical value to `z > 1.65` while the test itself uses `1.645`.

Per-portfolio results are stored one row per portfolio: `verdict`, `dsr_oos`, `psr_oos`, `sr0`, `n_oos`, `degradation_z`, `degradation_flagged`, `val_oos_degradation_z`, `oos_autocorr_lag1`, `computed_at`. Study-level results are stored one row per study: `pbo`, `pbo_lambda_mean`, `cscv_blocks`, `cscv_combos`, `cscv_subsampled`, `n_trials`, `n_eff`, `sharpe_var`, `sr0`, `computed_at`, plus two JSONB distributions — `cscv_lambdas` (the per-split logits PBO counts) and `train_sharpes` (the per-trial in-sample Sharpes behind `sharpe_var`). Both cascade on delete, so purging a study or portfolio removes its scores. Study finalization is covered in [study lifecycle](/docs/study-lifecycle).

## Profile

An investor-facing tearsheet for one trial, built to be exported. The whole page is wrapped in a single element so it can be rasterized to PDF, and the interactive controls are marked to stay out of the capture.

> [!NOTE] Profile is flag-gated
> The tab is hidden from the dropdown when `investorView` is off, though its route still resolves and renders. Almost all of its copy is defined as inline English defaults rather than locale entries, so it does not translate.

### Masthead and metadata

The title is `<strategy name> — Trial N`, or just `Trial N` when the strategy is unknown. Beside it sit an asset-class chip, a warning chip reading **`Simulated`**, the organization logo (or its initials), and the kicker **`Investment report`**.

Three actions live in the masthead, in this order:

| Action | States |
|---|---|
| `Share` | Only rendered when the `linkedinShare` flag is **off**. Copies a caption to the clipboard, opens LinkedIn, then downloads the PDF. |
| `Promote` | Becomes **`Promoted`** once done, and is disabled while promoting or already promoted. Tooltips: `Promote this trial into the Portfolio Groups` / `Already promoted to the Portfolio Groups`. |
| `Export PDF` | Becomes **`Preparing…`** while rasterizing, and is disabled in that window, so a second click is ignored. |

If the report element is not mounted yet, export reports **`The report is not ready yet. Wait for it to finish loading.`** If the caption copies but the capture fails, the share path reports **`The caption was copied, but the PDF could not be generated: {{reason}}`**.

> [!WARNING] The `linkedinShare` flag reads inverted
> With the flag **on**, the share-card preview block renders but the masthead's `Share` button is **not** wired. With it **off**, the reverse. Both defaults ship as on, so out of the box the preview appears and the `Share` button does not.

Below the masthead, a metadata strip carries **`Prepared by`**, **`As of`**, **`Data through`**, **`Period`** and **`Reference`** — the last as `#<portfolioId> · Trial N`.

### Report sections

In order down the page:

| Section | Contents |
|---|---|
| Disclaimer | *Performance is simulated. The out-of-sample period (marked on the chart) shows results on market data the strategy was never trained on — the closest proxy to live performance. Past performance is not indicative of future results.* |
| `Summary` | A deterministic, LLM-free report with a letter grade badge (tooltip: *Weighted score across return, risk, drawdown and robustness*), three paragraph headings **`Performance`**, **`Risk`**, **`Outlook`**, a **`Copy`** / **`Copied`** action, and the loading text **`Generating summary…`**. |
| `Performance` | Hint *Portfolio vs benchmark, both starting at $100,000*. A **`Growth of $100,000`** hero, then a growth chart rebasing portfolio and benchmark to 100 000, with shaded train / validation / out-of-sample bands and an inline benchmark selector. The out-of-sample band appears only when the study has one. |
| `Out-of-sample track record` | **`Since <Mon YYYY>`** and three figures — **`Return`**, **`Sharpe`**, **`Max drawdown`** — explained as *Performance on data the strategy was never trained on — the closest available proxy to live results.* |
| `Headline figures` | Four serif tiles: `Total return` (sub: the benchmark's return), `Annualized (CAGR)` (sub: the benchmark's CAGR), `Max drawdown` (sub `worst peak-to-trough decline`), `Sharpe ratio` (sub `return per unit of risk`). |
| `Versus the market` | Hint *Measured against `<benchmark>`*. Five figures: **`Alpha`**, **`Beta`**, **`Up capture`**, **`Down capture`**, **`Correlation`**. Up and down capture render as percentages, the rest as ratios. Unavailable → **`Benchmark comparison unavailable.`** |
| `Composition` | Hint *As of `<date>`*. The current-holdings table at the last date, beside two breakdown panels: **`Sector allocation`** and **`Asset type`**. |
| `Traded assets — full history` | One card per traded asset — logo, ticker, trade count, signed return contribution and a magnitude bar — with the hint `<n> assets · <m> trades`. Footer note: *Return contribution is each asset's summed realized P&L as a share of capital. Total realized from closed trades:* |
| `Year by year` | Hint *Strategy vs `<benchmark>`*. Columns **`Year`**, **`Strategy`**, the benchmark label, **`Excess`**. |
| Robustness note | **`Robustness screen:`** followed by the stored verdict. |
| Disclosure | The full hypothetical-performance disclaimer, beginning *Hypothetical / simulated performance.* |

The headline figures do not all read from the same stage. `Total return` and `Annualized (CAGR)` come from the **overall** stage. `Max drawdown` and `Sharpe ratio` come from **out-of-sample**, falling back to **overall** when the study has no out-of-sample window.

The benchmark defaults to the platform's curated default and is user-selectable from the chart's own selector. Promotion here is the same idempotent action offered on the dashboard's ranking cards — see [Portfolio Groups](/docs/portfolio-groups) and [Promoted Portfolios](/docs/promoted-portfolios).

## Retired sub-routes

Nine pre-consolidation sub-views became six tabs. The six retired segments below are still mounted, **but only as redirects** — none of them is a live tab. Each rewrites the URL with a replacing navigation and **preserves the query string**, notably `?studyId=`.

| Retired URL | Redirects to | Tab you land on |
|---|---|---|
| `/analysis/portfolios/:id/metrics` | `/analysis/portfolios/:id` | Performance |
| `/analysis/portfolios/:id/equity` | `/analysis/portfolios/:id/risk` | Risk Analytics |
| `/analysis/portfolios/:id/risk-managers` | `/analysis/portfolios/:id/risk` | Risk Analytics |
| `/analysis/portfolios/:id/trades` | `/analysis/portfolios/:id/transactions` | Transactions |
| `/analysis/portfolios/:id/orders` | `/analysis/portfolios/:id/transactions` | Transactions |
| `/analysis/portfolios/:id/investor` | `/analysis/portfolios/:id/profile` | Profile |

> [!CAUTION] `/analysis/portfolios/:id/overview` is not one of them
> `overview` exists in the segment alias table but has **no mounted route**, so that URL falls through to the app's catch-all and renders Not Found. Only the six segments in the table above redirect.

The retired captions `Overview`, `Equity & Risk`, `Trades`, `Metrics`, `Risk Managers` and `Investor` still exist as locale strings but no longer name any tab. `Orders` is the one exception — it survives as the header of the Transactions tab's collapsible orders section.

## Endpoints behind the tabs

Every endpoint below is a `GET` and every one of them requires the single backend permission `portfolios:read`. The frontend does not enforce it — routes mount unconditionally and the API returns the error. (These tabs also read study metadata from `GET /studies/metadata`, which is gated by `study:read` instead.)

```http
GET /portfolios/metadata?portfolio_ids=123
GET /portfolios/tmp?portfolio_ids=123
GET /portfolios/equity?portfolio_ids=123
GET /portfolios/metrics?portfolio_ids=123
GET /portfolios/metrics/window?portfolio_ids=123&start_date=…&end_date=…
GET /portfolios/metrics/window/benchmark?portfolio_ids=123&start_date=…&end_date=…&benchmark_ticker_id=…
GET /portfolios/overfitting?portfolio_ids=123
GET /portfolios/holdings?portfolio_ids=123
GET /portfolios/holdings/feature?portfolio_ids=123&feature=Sector
GET /portfolios/drawdown_vector?portfolio_ids=123
GET /portfolios/volatility_vector?portfolio_ids=123&shape=20
GET /portfolios/roc_vector?portfolio_ids=123&shape=20
GET /portfolios/sharpe_vector?portfolio_ids=123&shape=20
GET /portfolios/params?portfolio_ids=123
GET /portfolios/fitness?portfolio_ids=123
GET /portfolios/strategies?portfolio_ids=123
GET /portfolios/risk-managers?portfolio_ids=123
GET /portfolios/lineage?portfolio_ids=123
GET /portfolios/trials?portfolio_ids=123
GET /portfolios/seed?portfolio_ids=123
GET /portfolios/:portfolio_id/trades
GET /portfolios/:portfolio_id/trades/scalings
GET /portfolios/:portfolio_id/trades/:trade_id/scalings
GET /portfolios/:portfolio_id/trades/:trade_id/metrics
GET /portfolios/:portfolio_id/orders
GET /portfolios/:portfolio_id/orders/summary
GET /portfolios/:portfolio_id/risk-manager-events
```

The `feature` parameter accepts exactly `Code`, `Type`, `Isin`, `Sector`, `Industry`, `Country` or `Currency`. The `shape` parameter is the rolling window size.

Two writes exist on these tabs. The invert what-if posts to `/portfolios/:id/simulate` with a body of `{ "invert": true }` and nothing is persisted. Promotion posts to `/portfolio_manager/managed/promote` with `{ "trial_portfolio_id": … }` and is idempotent.

For what the numbers mean, see the [metrics reference](/docs/metrics-reference). For comparing many portfolios rather than reading one, see the [Portfolios Dashboard](/docs/portfolios-dashboard); for one study's search, the [Optimization Dashboard](/docs/optimization-dashboard).
