---
title: Optimization Dashboard
section: Analysis & Portfolios
sectionOrder: 4
order: 3
published: true
updated: 2026-08-20
summary: Explore the top-performing candidate portfolios a study produced, and promote the ones worth keeping.
keywords: optimization, candidates, trials, ranking, pareto, parameter importance, pivot table, sensitivity, compare, promote
---

A [study](/docs/studies) sweeps a strategy's parameter space and leaves behind one candidate portfolio — a **trial** — per parameter set it evaluated. The candidate-exploration surface is where you read that output: rank the trials by any metric over any stage, overlay their equity curves, compare their metrics and parameters side by side, ask which knobs actually mattered, check whether the winner is skill or the luckiest of N backtests, and promote the survivors into durable [promoted portfolios](/docs/promoted-portfolios). It spans two routes with one shared filter bar, and this page documents both — naming, for every control, which route it lives on.

## Routes and entry points

The whole surface is the **Portfolios** feature (`portfolios-analysis`), mounted at `/analysis/portfolios` with the sidebar label **Portfolios**. It carries no free-tier entitlement lock: every route below renders on every plan, gated only by the realm permission `portfolios:read`.

| Route | Screen |
|---|---|
| `/analysis/portfolios` | **Portfolios Dashboard** — the candidate ranking, overlay and comparison tables |
| `/analysis/portfolios/study/:studyId` | **Optimization Dashboard** — the per-study analysis (`?tab=` sub-views) |
| `/analysis/portfolios/:portfolioId` | Portfolio Analysis — Performance (the bare detail route) |
| `/analysis/portfolios/:portfolioId/holdings` | Portfolio Analysis — Holdings |
| `/analysis/portfolios/:portfolioId/transactions` | Portfolio Analysis — Transactions |
| `/analysis/portfolios/:portfolioId/risk` | Portfolio Analysis — Risk Analytics |
| `/analysis/portfolios/:portfolioId/overfitting` | Portfolio Analysis — Robustness |
| `/analysis/portfolios/:portfolioId/profile` | Portfolio Analysis — Profile (feature-flagged, `investorView`) |

The individual-candidate routes are covered on [Portfolio Analysis](/docs/portfolio-detail).

> [!NOTE] There is no standalone study-analysis route
> The Optimization Dashboard component also declares a `/analysis/studies/:studyId` route in its own feature file, but that feature is never registered in the app's feature manifest. `/analysis/portfolios/study/:studyId` is the only URL that renders it. As a consequence its built-in `Tabs` bar and breadcrumbs — which only render outside `/analysis/portfolios` — never appear; the sub-tabs are always reached through the section-tab dropdown described below.

### Section tabs

Every route in the feature renders one tab bar above the outlet (`aria-label` **"Portfolio sections"**):

| Tab | Behaviour |
|---|---|
| **Portfolios Dashboard** | A plain link to `/analysis/portfolios`. Always visible. |
| **Optimization Dashboard** | A dropdown of the four study sub-views. Visible whenever a study can be resolved — from the path, from `?studyId=`, or failing both from the workspace's highest-numbered study. **Disabled** (visible, greyed, non-interactive) while the Study filter is set to `?studyId=all`, because optimization data is per-study. |
| **Portfolio Analysis** | Hidden until you drill into one candidate, then slides in last with a dismiss button labelled **"Close Portfolio Analysis"**. |

Which candidate the third tab points at lives in the URL as `?analysis=<portfolioId>` (positive integers only — a mangled value resolves to "tab closed" rather than a tab pointing at nothing). On an individual route the path names it instead, and the param is deliberately absent.

### Legacy paths

These resolve to their current home rather than 404ing. Do not link to them.

| Legacy | Resolves to |
|---|---|
| `/analysis/portfolios/:id/metrics` | `/analysis/portfolios/:id` (Performance) |
| `/analysis/portfolios/:id/equity` | `/analysis/portfolios/:id/risk` |
| `/analysis/portfolios/:id/risk-managers` | `/analysis/portfolios/:id/risk` |
| `/analysis/portfolios/:id/trades` | `/analysis/portfolios/:id/transactions` |
| `/analysis/portfolios/:id/orders` | `/analysis/portfolios/:id/transactions` |
| `/analysis/portfolios/:id/investor` | `/analysis/portfolios/:id/profile` |
| `?tab=clusters` | `?tab=families` |
| `?tab=optimization` | `?tab=parameters` |
| `?tab=importances` | `?tab=overview` |
| `?tab=config` | `?tab=overview` |

An unrecognised `?tab=` value resolves to `overview`. Legacy `?tab=` values are rewritten in place, so bookmarks self-heal.

## The filter bar

The same bar — **Metric · Study · Top N · Rank by** — sits at the top of both dashboards. It is rendered *inside* each tab, not once in the layout, so each tab owns independent filter state.

### Metric picker

Label **"Metric"**. A searchable select (placeholder **"Search…"**, search-field `aria-label` **"Search metrics"**, no-result item **"No matches"**). Fitness metrics are pinned above a divider; everything else follows. Each option shows the metric's catalog description as a caption, or an availability hint.

The landing default is the metric literally named `fitness`, resolved **by name** — `?metric=` ids are 1-based positions in the alphabetically sorted, deduped union of the metrics catalog and the benchmark fallback list, so the id for a given metric is not stable across catalogs and must always be resolved through that same list.

A metric with zero persisted rows for the selected study is **disabled, never hidden** (hiding would shift every id after it). The caption states why:

| Situation | Caption |
|---|---|
| Trade-category metric | **No closed trades, or pending the daily metrics run** |
| Benchmark metric, study has no benchmark | **Needs a benchmark — this study has none** |
| Benchmark metric, benchmark set but not yet computed | **Not computed for this study yet** |
| Custom (fitness-backed) metric | **No values for this study yet (computed daily)** |
| Anything else | **No data for this study** |
| Has data, but not in the selected stage (soft hint — still selectable) | **No data in the selected stage** |

Changing the metric clears the current selection (`portfolio_ids`) and resets `order` to auto.

### Study picker

Label **"Study"**. **"All studies"** is pinned first and turns on cross-study ranking (`?studyId=all`). It is disabled — with an inline caption, because a disabled menu item swallows hover — when:

- a **fitness** metric is selected: **"Not available with fitness metrics (fitness is study-specific)"**;
- there are no studies at all: tooltip **"No studies available"**.

Draft studies (`last_status === 'SAVED'`) never appear in the list. Changing the study clears the selection.

On the Optimization Dashboard the study id is a path segment, so picking a different study navigates to `/analysis/portfolios/study/<newId>` (carrying only `?analysis=`), and picking **"All studies"** navigates back to `/analysis/portfolios` — the per-study screen has nothing to show in cross-study mode.

### Top N

Label **"Top N"**. A plain numeric field with `min=1`. The default is **10**, and it is seeded into `?topN=` on first load. There is no upper clamp on this screen.

### Rank by

Label **"Rank by"**. One grouped single-selection dropdown:

| Group | Options |
|---|---|
| **Study stages** | **Overall**, **Train**, **Val**, **OOS**, **RLP** — each with its stage colour as a leading dot |
| **Rolling windows** | **MTD**, **1M**, **QTD**, **3M**, **6M**, **YTD**, **1Y**, **3Y**, **5Y** |
| **Custom trailing window** | the active custom label, or **"Custom"** |

`Overall` is always offered — it is the whole panel, not a period. The other four named stages appear only when the study's served period list actually contains them, so a study with no out-of-sample window cannot be ranked by one. Rolling windows are filtered by the study's own equity span: `1M` needs 30 days, `3M` 90, `6M` 180, `1Y` 365, `3Y` 1095, `5Y` 1825; the calendar windows (`MTD`, `QTD`, `YTD`) have no lookback requirement. In **All studies** mode every named stage is offered — studies lacking one simply contribute no rows.

Picking **Custom** opens a popover titled **"Custom trailing window"** with **Last** (a number) and **Unit** (**Days** / **Weeks** / **Months** / **Years**) and an **Apply** button. It computes a trailing range ending at the study's last equity date and writes it as a single weighted frame into `?ct_frames=`, switching `?stage=` to `custom_timeframe`.

`?stage=` is seeded to **`overall`** when absent. `?order=` is deliberately *not* seeded: an absent value means "auto", which is ascending for a `lower_is_better` metric and descending otherwise.

### Automatic metric switching

Three rules can move the metric out from under you. Each announces itself in a snackbar.

| Trigger | What happens | Message |
|---|---|---|
| The selected metric has no rows for this study | Switches to `sharpe_ratio` if it has data, else the first non-fitness metric that does; clears `?order=` | **"{from}" has no data for this study. Switched to "{to}".** |
| A fitness metric is active while the stage is a rolling window, or a custom timeframe containing one | Switches to the first non-fitness metric | *(silent on the Optimization Dashboard's reactive path; the custom-timeframe path shows a message — see below)* |
| A fitness metric is active together with **All studies** | Unselects all-studies, falls back to the most recent study, clears the selection | *(see below)* |

> [!WARNING] Two of those snackbars are hardcoded Spanish
> The custom-timeframe fitness fallback on the Portfolios Dashboard and the fitness-plus-All-studies fallback ship a literal Spanish string to every locale: *"Las métricas de fitness no están disponibles para timeframes personalizados. Se cambió automáticamente a "{metric}"."* and *"Las métricas de fitness son específicas de cada estudio, por lo que "Todos los estudios" no está disponible. Se seleccionó el estudio más reciente."* The Optimization Dashboard's equivalent uses the translated key **"Fitness metrics are not available for custom timeframes. Automatically switched to "{metric}"."**

## The candidate ranking

**Route: `/analysis/portfolios`.** The ranking is a **vertical scrolling card carousel**, not a table — one card per ranked candidate, in a 660px-tall pane on desktop (it drops its inner scroll and stacks on mobile). It occupies the left `md=5 / lg=4` of a split row; the equity overlay fills the right.

The header carries a select-all checkbox, the title **"Portfolio Ranking"**, a **"({count} selected)"** caption once anything is checked, and a **"Clear"** button. Below it, a right-aligned line reads **"Ranked by"** followed by the metric's label and an up or down arrow — clicking it flips `?order=`.

Above the ranking, for a single study only, a provenance strip names **Source strategy · Source fitness · Author**. It is absent in `?studyId=all`, where there is no single strategy to name. A deleted strategy still shows its name and author with the tooltip **"This strategy can't be opened — it was deleted. The name and author are still shown so the portfolio stays traceable."**

### Anatomy of a ranking card

| Element | What it shows |
|---|---|
| Rank number | Position in the current ranking |
| Trial label | **`Trial <n> · <study name>`** — never the raw `portfolio_id` |
| Value | The ranked metric's value for this candidate, labelled by the metric |
| Sparkline | A ~48-point downsample of the candidate's equity curve, tinted with the card's selection colour |
| **Sharpe** / **Alpha** / **Beta** | Three stat tiles for the active stage; `—` when the value is absent |
| ★ badge | Marks the leader (top-ranked card) |
| Colour dot | The candidate's behavioral family, when the study has a clustering artifact |
| **Promoted** badge | A check badge; this trial already has a managed portfolio |
| `+{count}` chip | Representative mode only — how many other trials this card stands in for; its tooltip reads **"+{count} more in this family"** |
| Checkbox | Adds the candidate to the comparison selection |
| ⋮ | Opens the row-action menu |
| Card body | A router link to the candidate's own page |

> [!IMPORTANT] The trial number is not a global id
> Trial numbers are scoped to a study and **collide across studies**, which is why every standalone label carries the study name. The internal `portfolio_id` remains the identity used by routes and API arguments; the one place it still surfaces is the Risk Manager Configuration table's `P<portfolio_id>` column headers. While the trial lookup is still resolving the label reads **`Trial …`** rather than falling back to the raw id.

### When the ranking is empty

The empty message is metric-aware, so it explains the specific reason rather than saying "no data".

| Condition | Message |
|---|---|
| Generic | **No portfolios to rank for this stage.** |
| Trade metric, nothing closed | **No closed trades to aggregate for this study, or its trade metrics are still pending the daily metrics run.** |
| Benchmark metric, no study benchmark | **{metric} is measured against a benchmark, and this study has none.** |
| Benchmark metric, not yet computed | **Benchmark metrics have not been computed for this study yet.** |
| Custom metric, not yet computed | **This custom metric has no values for this study yet. Custom metrics are computed daily.** |
| Metric absent from the whole study | **No data for {metric} in this study.** |
| Metric present, but not in this stage | **No data for this metric in the selected stage. Available in: {stages}.** |

### Ranking endpoints

The ranking is a server-side top-N, not a client sort of a full list.

```http
GET /portfolios/stage/n_top?study_id=42&stage=out_of_sample&metric_name=sharpe_ratio&n_top=10&asc=false
```

| Parameter | Type | Notes |
|---|---|---|
| `study_id` | `i32` | required |
| `stage` | string | one of `train`, `validation`, `out_of_sample`, `overall`, `real_life_performance`, `ytd`, `mtd`, `qtd`, `trailing_1m`, `trailing_3m`, `trailing_6m`, `trailing_1y`, `trailing_3y`, `trailing_5y` |
| `metric_name` | string | must exist in the caller's metric catalog |
| `n_top` | `i64` | the Top N control |
| `asc` | bool | `true` when the sort arrow points up |

Cross-study mode calls `GET /portfolios/global/n_top` instead, with the same `stage`, `metric_name`, `n_top`, `asc` plus an optional CSV `study_ids` (empty means the whole organization). Exactly one global query runs — for the active stage only — because a cross-study ranking scans every portfolio in the org.

> [!CAUTION] These validation failures are 406, not 400
> An unknown metric returns **HTTP 406** with `Unknown metric: '<name>'`, and an unrecognised stage returns **HTTP 406** with `Not valid stage found`. Both go through the `not_acceptable` error kind. A missing `portfolios:read` permission is **403** with `Missing permission 'portfolios:read'`. See [API errors](/docs/api-errors).

## Comparing selected candidates

Checking cards builds a selection (`?portfolio_ids=` as a CSV). Everything in this section is driven by that selection, and everything here lives on **`/analysis/portfolios`**.

The rule the selection follows is worth knowing before you use anything below: **a ranking you have not curated is auto-selected whole.** The dashboard opens with the entire Top N checked and every one of their curves overlaid, and any change to the ranking — study, metric, stage, order, Top N, custom frames — re-seeds the selection from the *new* rows rather than leaving the previous ranking's candidates checked. The moment you make an explicit gesture (toggle a card, select all, clear) the selection is pinned for as long as those filters stand, and "Clear" stays cleared. Family grouping deliberately does not count as a ranking change: it re-shapes rows that are already ranked, so toggling it never wipes a hand-picked set.

### Combined equity overlay

The right pane of the hero row. Card title **"Equity Curve"**, subtitle **"{count} trial curves overlaid · Check or uncheck a card to add or remove one"**. Each selected candidate's curve is drawn in that card's own colour, so the comparison happens without leaving the ranking. A **"View last"** number field (placeholder **"All"**) plus a unit select (**Days** / **Weeks** / **Months** / **Years**) crops the drawn range.

With nothing checked it reads **"Check one or more trials in the ranking to plot their equity curves here."** If some curves fail to load, a notice reports **"{missing} of {total} portfolios couldn't be loaded — showing the rest."**

### Comparison strip

Appears as soon as one candidate is checked. Card **"Comparison"**, info text **"How the selected portfolios performed over the current window (the live zoom, or the full range)."** Six tiles:

| Tile | Tooltip |
|---|---|
| **Selected** | Number of portfolios currently selected. |
| **Leader** | Best total return in the selection over this window. |
| **Dispersion** | Spread between the best and worst total return — how differently the selected portfolios behaved. |
| **Median Sharpe** | Median Sharpe ratio across the selection over this window. |
| **Worst Drawdown** | Deepest maximum drawdown in the selection over this window. |
| **Families** | Distinct behavioral strategy families among the selection. Open the Strategies tab to explore them. |

### Advanced analysis tabs

Below the hero sits a permanently expanded section titled **"Advanced analysis"** with the subtitle **"Risk charts, comparison tables and behavioral strategies"**. Its three tabs are URL-backed as `?ptab=`:

| `?ptab` | Tab label | Contents |
|---|---|---|
| `risk` *(default)* | **Risk charts** | Four chart pairs |
| `tables` | **Comparison tables** | The Metrics / Pivot / Table toggle and the tables below it |
| `estrategias` | **Strategies** | The behavioral-family section, scoped to the selected study |

With no selection the risk tab reads **"Select one or more portfolios in the ranking to see their risk charts."** In cross-study mode the Strategies tab reads **"Select a study to see its strategy families."**

### Risk charts

Each of the four is a time-series ↔ histogram toggle (tooltips **"Switch to Time Series"** / **"Switch to Histogram"**) with a settings menu titled **"Chart settings"**.

| Time-series title / subtitle | Histogram title / subtitle | Settings |
|---|---|---|
| **Drawdown** / *Peak-to-trough decline* | **Drawdown distribution** / *Histogram of rolling drawdown* | histogram only: **Bins**, **Density** |
| **Volatility** / *Rolling volatility* | **Volatility distribution** / *Histogram of rolling volatility* | **Window size** in both modes; plus **Bins** and **Density** in histogram |
| **Rate of Change** / *Momentum (ROC)* | **Rate of Change distribution** / *Histogram of momentum (ROC)* | **Window size** in both modes; plus **Bins** and **Density** in histogram |
| **Sharpe** / *Risk-adjusted return* | **Sharpe distribution** / *Histogram of risk-adjusted return* | **Window size** in both modes; plus **Bins** and **Density** in histogram |

The three window sizes default to 14 and are local state — they are not in the URL.

### Comparison tables

A three-way toggle chooses which table renders: **Metrics** · **Pivot** · **Table**.

| Mode | Table | Subject |
|---|---|---|
| **Metrics** | **Portfolio Metrics — All Stages** | the selected candidates |
| **Pivot** | **Portfolio Comparison — All Metrics × Stages** | the selected candidates |
| **Table** | the same pivot component | **every** portfolio in the selected study |

**Metrics** is the transpose of the pivot: rows are metrics (first column header **"Metric"**), the first header row is one group per selected candidate (its trial label, suffixed **★** for the leader) and the second is that candidate's stages. Clicking a stage sub-header sorts the metric rows by that candidate's value in that stage.

**Metrics** and **Pivot** also render the parameter tables described two sections down. **Table** does not — it is the whole-study view, where a per-column parameter comparison would be meaningless.

### Pivot table columns and heat

Title **"Portfolio Comparison — All Metrics × Stages"**, subtitle **"Rows = portfolios · Columns = metric × stage · Click column to sort"**. While its metrics query is in flight the card reads **"Loading metrics for all portfolios…"**.

- The first column is sticky, headed **"Portfolio"**, and renders each row's trial label with an open-in-new icon whose tooltip is **"Open individual dashboard"**.
- Columns are the full cartesian product `metric × stage`. The first header row is the metric, derived from its snake\_case name and rendered in uppercase; the second row is the stage, rendered in that stage's colour: **Train**, **Val**, **OOS**, **Overall**, **RLP**. Only stages that actually carry data for at least one row become columns.
- Clicking a stage sub-header sorts by that column, **descending first**; clicking again flips it. The active column is marked with **↓** or **↑**. Null values always sort last.
- Heat is computed **per column**, over that column's own min–max across the visible rows. A cell in the top 15% of its column's range is tinted green, the bottom 15% red, and everything in between is left plain. The scale is inverted for the two metrics where low is good: `max_drawdown` and `volatility`.
- Rows are virtualised at a 33px row height inside a 520px scroller, so a whole-study table stays responsive.

### Parameters and risk managers

Two more tables render beneath the comparison table in **Metrics** and **Pivot** mode.

| Card | First columns | Value columns |
|---|---|---|
| **Parameters** | **Parameter** | one per selected candidate, headed by its trial label |
| **Risk Manager Configuration** | **Risk Manager**, **Parameter** | one per selected candidate, headed **`P<portfolio_id>`** |

The Parameters table lists **strategy** parameters only — risk-manager parameter keys (`rm_<attachment_id>_<name>`) are filtered out and surfaced in their own panel instead. Risk-manager rows are namespaced by manager (the manager name renders once as a chip, then blank for its remaining rows) so two candidates from different studies stay legible side by side. Both tables render `—` where a candidate has no value for a row, and neither renders at all when there is nothing to show.

## Behavioral strategy families

A study's clustering artifact groups trials by the correlation of their full equity curves — the answer to "how many *distinct* strategies did this search actually find". It powers a colour dot on every ranking card, the **Families** count tile, the Strategies tab, and a set of grouping controls on the Portfolios Dashboard.

### Family controls on the ranking

They live in a second permanently expanded section titled **"Advanced options"**, subtitle **"Family grouping, concentration checks and bulk actions"**. Its header carries a warning chip **"Concentration risk"** when the top-N collapse into too few families, and a chip **"{count} portfolios selected"**.

| Control | Values |
|---|---|
| Representative toggle (icon button) | tooltip **"Show 1 per family"** when off, **"Show all trials"** when on |
| Representative method (visible in representative mode) | **Medoid** *(Most typical trial)*, **Best fitness** *(Highest fitness (→ Sharpe))*, **Best Sharpe** *(Highest Sharpe in the family)*, **Best OOS Sharpe** *(Highest out-of-sample Sharpe)*, **Best return** *(Highest return in the family)*, **Lowest drawdown** *(Smallest max drawdown)* |
| **Granularity** | The clustering level *k*; each option shows **"cohesion {value}"** (silhouette, −1…1), explained by the tooltip **"How cleanly trials separate into families at this granularity (silhouette, −1…1). Higher is sharper."** |
| **"Show per family:"** | a **Group by family** toggle button plus a select of **All** / **1 per family** / **2 per family** / **3 per family** / **5 per family** |

On this screen the granularity, the representative mode and the method are **local component state** — they are not written to the URL and do not survive a reload. (The Optimization Dashboard's Families tab uses `?clusters_k=` instead.)

### Concentration warning

The diversity banner appears only when the top-N genuinely collapse. It reads **"Your top {n} results span {distinct} distinct strategies"** over **"{strategies} distinct strategies among {trials} trials"**, with a chip reading either **"Your top performers collapse into one family — concentration / overfitting risk."** or **"Your best results are largely redundant — consider diversifying."** and actions **"Show 1 per family"**, **"View strategies"** and **"Study analysis"**.

## Per-study Optimization Dashboard

**Route: `/analysis/portfolios/study/:studyId`.** Four sub-views, selected with `?tab=` and reached from the **Optimization Dashboard** tab's dropdown: **Overview**, **Robustness**, **Families**, **Parameters**. The filter bar above them is the same one; its **Rank by** value is what every chart on this screen means by "stage".

Internally that stage is resolved to one token that appears verbatim in several chart titles: `train`, `validation`, `out_of_sample`, `overall`, `real_life_performance`, `window` (any rolling window), or `weighted_avg` (a custom train+validation blend that produced a weighted average; otherwise a custom timeframe falls back to `overall`).

### Study header and lineage

Persistent above every tab:

- The study name, its runtime status badge and its health badge.
- The **study key** in monospace beneath the name — click to copy, tooltip **"Copy the study key"**. It is an internal key, not a name.
- A provenance strip: **Source strategy** and **Author**. The strategy name links to the [strategy](/docs/strategies) when it still exists; the author is plain text. Provenance belongs to the study, not to individual rows — every trial of a study shares one strategy.
- Four KPI tiles: the **active metric's name** (value = the best objective seen, sub-label **"Best"**), **Trials**, **Progress**, and **Overfit** (the robustness verdict, with **"PBO {value}"** underneath).
- A pipeline panel showing which lifecycle stage the run is in and where the time went — see [Study lifecycle](/docs/study-lifecycle).
- Run-state banners: a red failure notice only for a genuinely **fatal** (core-stage) failure, a scoped warning for a failed secondary analysis (**"Secondary analysis incomplete"**), a **"Finishing secondary analysis"** notice while one is still computing, and **"This study was stopped before completion. Showing results collected up to that point."** for a stopped run.

> [!NOTE] Fitness and risk-manager links are not on the header
> The header's provenance strip names the strategy and its author only. The [fitness function](/docs/fitness-functions) and [risk manager](/docs/risk-managers) ids are passed to the failure notices and surface as recovery links there, not as standing header links.

### Study actions and exports

| Action | Behaviour |
|---|---|
| **Stop** | Opens the dialog **"Stop study?"** — *"This action will stop the study immediately. Running trials may be interrupted and this action cannot be undone."* with **Cancel** / **Stop study**. The button is disabled unless the runtime status is `running`, with the tooltip **"Only running studies can be stopped."** Success toasts **"Study stopped successfully."** |
| **Export snapshot** | Downloads `study_<id>_snapshot.json` — the run configuration, runtime, health and objective statistics. |
| **Export best trial** | Downloads `study_<id>_best_trial.json`, resolved with the study's own optimization direction. |
| **Export hyperparameters** | Downloads `study_<id>_hyperparameters_<stage>.json`: every completed trial with `trial_number`, `value`, `strategy_params` and `risk_managers`, sorted by trial number. Hint: **"Downloads every completed trial of the study, with its strategy and risk-manager parameters. The "value" field is the metric and stage you have selected in the chart at export time. Pruned/failed trials are excluded."** |
| Help icon | Tooltip **"View documentation"**; opens the in-app docs panel on the studies and optimizer-lifecycle blocks. |

> [!WARNING] Export hyperparameters only produces a file for Train or Validation
> The button is never disabled, but the handler returns immediately unless the resolved stage is `train` or `validation`. With **Rank by** on Overall, OOS, RLP, a rolling window or a custom blend, clicking it does nothing at all.

### Overview

The landing sub-view.

- **Study Overview** — the full run configuration (periods, components, trial count, algorithm, parameter ranges). Always expanded; not collapsible.
- **Failed trials** — a collapsible section, rendered only when the study actually has failed trials (a study with none renders no accordion shell at all). Inside sits an **Errors** panel: a summary reading **"{n} failed trials across {m} distinct reasons"**, a per-reason **Count** breakdown, and a **Show** / **Hide** toggle for **"Failed Trials ({count})"** — a table of **Trial**, **Failure Reason** and **Params**.
- **Best trial** — subtitle is the resolved stage token. Shows the objective value in 2rem monospace, then **"{metric} · Trial {n}"**, then up to six parameter chips formatted `key: value`. When a clustering artifact exists it adds a **Strategy diversity** block reading **"{strategies} distinct strategies among {trials} trials"**, plus the warning **"Your top performers collapse into one family — concentration / overfitting risk."** when the best trial's family holds more than half the trials. Buttons: **Open trial**, **View parameters →**, **View strategies**.
- **Robustness & Overfitting** — the verdict pill (**Well trained** / **Borderline** / **Overfit risk** / **Uncertain**) with the KPIs **PBO** and **Scored trials**, and a **View robustness →** button.
- **Hyperparameter Importances** — collapsible, expanded by default. Documented below.
- A risk-manager health notice, deliberately never collapsed: a risk manager that switched itself off mid-run leaves a study that reports COMPLETED with plausible-looking portfolios, and nobody would go looking for it.

The best trial is computed with the same builder the evolution chart uses, so the card and the chart's best-trial marker can never disagree — and it honours a MINIMIZE study instead of reporting its worst trial as the best.

### Parameter importance

Which knobs actually moved the objective, and which of those only moved it in training.

- **Method** — a segmented control offering the evaluators the artifact carries: **fANOVA** and **MDI**. This is a *method*, not a timeframe; switching is instant because everything is precomputed in the artifact.
- **Timeframe** — comes from the filter bar's **Rank by**. There is no timeframe control of its own.
- **Parameter importance** — ranked bars, subtitle **"Share of {metric} variance explained ({evaluator}, {stage}). Bar length = importance; color = effect direction."** Bar colour encodes direction: **Higher is better**, **Lower is better**, or a neutral tone for categorical parameters (**"Best: {value}"**). Each row can carry a **Spearman ρ**, an **MDI cross-check** and a **90% bootstrap CI**. When the stage has few trials it warns **"Low confidence: few trials in this stage — interpret with caution."**
- **Overfitting divergence** — **"Parameters important in train but not in validation drove selection overfitting; an effect whose direction flips out of sample is a spurious-signal flag."** Rows whose effect reverses are flagged **"Effect direction flips out of sample"**. Needs both train and validation importances; otherwise it is absent and the bar chart spans the full width.
- Headline tiles: **Most influential**, **Effective params** (*of {total} searched*), **Trials scored**, **Top overfit driver**, **Train↔Val agreement**, **Direction flips**.

Only stages that have a per-trial objective can be scored:

| Rank by | Importance stage |
|---|---|
| Overall | `overall` |
| Train | `train` |
| Val | `validation` |
| OOS | `oos` |
| RLP | `rlp` |
| Any rolling window, or a custom blend | **not supported** |

An unsupported timeframe gets an explanation, not an empty chart: **"Importances aren't defined for this timeframe"** — *"Parameter importances decompose the variance of the study's objective (fitness), and fitness is only evaluated over the study's own periods. Pick All, Train, Val, OOS or RLP in the filter above."*

Two more notices exist: **"Parameter importances not available"** (*"This study was finalized before importances were computed, is still processing, or has too few completed trials. It will appear after the next run or backfill."*), with **"Too sparse to score (all parameters fixed, or fewer than 2 completed trials)."** as its description when the artifact exists but scored nothing; and **"Importances for this timeframe aren't computed yet"** for a study scored before that stage was supported.

### Parameters — the parameter-vs-metric plots

The exploration tab. Five charts, whose titles are literal English template strings with the resolved stage token appended:

| Chart | Title | Controls |
|---|---|---|
| Optimization trajectory | **`Optimization Evolution · <stage>`** | **Mode**: **Raw** (each trial's own value) or **Best** (best-so-far) |
| Objective histogram | **`Result Distribution · <stage>`** | **Bins** (placeholder *auto*, helper *Auto by default*); reports **Mean**, **Std Dev**, **Min / Max** |
| Per-parameter scatter grid | **`Parameter Impact · <stage>`** | one scatter per hyperparameter: x = the parameter's value, y = the objective. Caption: *"Each chart shows how a parameter value relates to the metric. Color intensity maps metric quality — warmer tones mark better zones."* |
| 3D explorer | **`3D Parameter Explorer · <stage>`** | **X** / **Y** / **Z** selects over the numeric parameters plus the metric, and a **Scatter** ↔ **Surface** toggle. Surface caption: *"Surface connects the actual trial points via Delaunay triangulation. Color = metric value."* |
| Parallel coordinates | **`Hyperparameter Patterns · <stage>`** | **Top-N** (numeric, min 1) |

When a clustering artifact exists, a **Color** segmented control appears above the parameter charts with **Metric** and **Strategy family** — recolouring the scatter grid, the 3D explorer and the parallel chart by behavioral family, which reveals which hyperparameter regions map to which family.

Clicking any point navigates to that trial's own page, carrying `?studyId=`.

The first two charts need only trial values, so they render even when no hyperparameters were recorded. The other three do not: with no recorded parameters the whole lower half collapses to one card titled **`Parameter Impact · <stage>`** with the caption **"No hyperparameter data available."** Categorical parameters have no numeric geometry and are excluded from the 3D axes, which the card states: **"Categorical parameters ({params}) have no numeric geometry and are excluded from the 3D axes."**

### Robustness

Whether the winner is skill or the best of N coin flips. Card title **"Robustness & Overfitting"**.

KPI tiles: **PBO**, **Luck threshold (SR₀)**, **Effective trials** (*of {n} trials*), **Sharpe variance (V)**, **Scored trials** (*with a verdict*). Each carries a definition tooltip — for example PBO is *"Probability of Backtest Overfitting — the share of CSCV splits where the in-sample best ranks below the out-of-sample median. Above 50% is a strong overfitting signal."*

Charts: **CSCV overfitting distribution**, **Trial Sharpe distribution vs luck** (with the SR₀ marker), **Deflated Sharpe across trials**, **In-sample vs out-of-sample rank**, **Train → Validation → OOS degradation**, **Equity curves by window**, and **Per-trial robustness matrix** (columns **DSR**, **PSR**, **Train→OOS z**, **Val→OOS z**, **|ρ₁| OOS**; click a row to open the trial). The three per-trial charts cap how many trials they draw and say so: **"Showing the {shown} of {total} trials with the best Deflated Sharpe."**

Verdicts are **Well trained**, **Borderline**, **Overfit risk** and **Uncertain**. When no analysis exists: **"No robustness analysis yet. It is computed once the study finishes and has enough data."**

### Families and the trials table

The behavioral-clustering sub-view, in five stacked pieces:

1. **Headline banner** — **"{trials} trials — but only {strategies} distinct strategies"** over *"Trials grouped by the correlation of their full equity curves. Top performers are often the same strategy in disguise."* (or **"All trials behave as a single strategy"**), with the **Granularity** control. Granularity here writes `?clusters_k=`.
2. **Behavioral map** — *"Each point is a trial, placed by return similarity and colored by strategy family."* Bubble size is OOS Sharpe; ◆ marks the family representative and ★ the study best; the axes are **Behavioral dimension 1** and **Behavioral dimension 2**. Large studies are subsampled: **"Showing {shown} of {total} trials"**.
3. **Representative equity per family** — *"The most representative (medoid) trial of each family."*
4. **Strategy families** — one card per family with **Trials**, **Share**, **Representative**, **Best trial**, **Mean return**, **Mean Sharpe**, **Mean OOS Sharpe**, **Return dispersion**, and a **"Contains study best"** chip.
5. **Trials by family** — every trial tagged with its family.

The trials table is the one true column-per-metric table on this surface:

| Column | Sortable | Notes |
|---|---|---|
| **Family** | yes | a coloured chip, also **filterable** |
| **Trial** | yes | the per-study trial number |
| **Return** | yes | percentage, 1 decimal |
| **Sharpe** | yes | |
| **OOS Sharpe** | yes | the **default sort**, descending |
| **Max DD** | yes | percentage, 1 decimal |
| **Fitness** | yes | **hidden by default** — enable it from the column chooser |

Clicking a row opens that trial. **Export CSV** writes `study-strategies-k<k>.csv` entirely client-side (the artifact is already in hand — no round trip) with the header `trial_number,portfolio_id,family,return,sharpe,oos_sharpe,max_drawdown,fitness`.

When the study has no clustering artifact: **"Strategy clustering not available"** — *"This study was finalized before clustering was computed, or it's still processing. It will appear after the next run or backfill."*

## Promoting a candidate

A trial is a study artifact. Promotion turns it into a **managed portfolio** — a durable, study-independent copy that survives the study's deletion, can be updated daily, and is the only object a [portfolio group](/docs/portfolio-groups) can hold. It is the decision the whole ranking exists to support, which is why it is the first item in the row menu.

### Where promote lives

All three entry points are on **`/analysis/portfolios`**.

| Surface | Control |
|---|---|
| Row-action menu (⋮ on a card) | **Promote** — secondary line **"Add this trial to the Portfolio Groups as a managed portfolio"**. Once promoted the item reads **Promoted** / **"Already promoted to the Portfolio Groups"** and is disabled, as it is while a promotion is in flight. |
| Sticky bulk bar | Appears once **you** have touched the selection under the current filters *and* two or more cards are checked. One card is deliberately not enough — that case is the card's own menu, and the auto-seeded whole-ranking selection does not count, so a fresh visit never opens with a one-click promote-everything button. |
| Portfolio group creation | **"Create portfolio group ({n})"** auto-promotes the members it needs. |

The menu's header is the trial label, and its other two items are **Derive / Optimize RMs** (secondary **"Derive risk-manager-optimized variants of this portfolio"**, or **"This portfolio already contains a Risk Manager"** when disabled) and **Individual Dashboard** (secondary **"View detailed analytics for this portfolio"**) — a real anchor, so right-click → open in new tab works.

### Bulk promotion

The sticky bar carries a rocket icon, **"Promote Selected ({count})"**, an optional success chip **"{count} already promoted"**, a **"Clear"** button and the primary **"Promote Selected"** button. Its tooltip is **"Promote every checked trial into the Portfolio Groups in one go"**, or **"Every checked trial is already promoted"** when there is nothing left to do (the button is then disabled). A linear progress bar runs across the top while the request is in flight.

Outcomes are reported as toasts: **"{count} portfolios promoted"** on success and, when anything failed, a warning **"{count} trials could not be promoted"** with the joined server errors as detail. A single promote toasts **"Promoted to the Portfolio Groups"**.

### Promotion API

```http
POST /portfolio_manager/managed/promote
```

```json
{ "trial_portfolio_id": 1234 }
```

```json
{ "managed_portfolio_id": 77 }
```

```http
POST /portfolio_manager/managed/promote/batch
```

```json
{ "trial_portfolio_ids": [12, 34, 56] }
```

```json
{
  "promoted": [{ "trial_portfolio_id": 12, "managed_portfolio_id": 77 }],
  "failed": [{ "trial_portfolio_id": 34, "error": "Portfolio not found" }]
}
```

| Condition | Status | Body |
|---|---|---|
| Missing `portfolios:read` | **403** | `Missing permission 'portfolios:read'` |
| Managed-portfolio quota would be exceeded | **402** | `{"error": "quota_reached", "quota": "managed_portfolios", "used", "limit", "requested", "upgrade": "purchase_tokens"}` |
| Trial not in this organization, or its study was deleted (single) | **404** | `Portfolio not found` |
| Empty `trial_portfolio_ids` | **400** | `trial_portfolio_ids must not be empty` |
| More than 50 ids | **400** | `cannot promote more than 50 trials in one request (got N)` |
| EXTERNAL strategy, meta-portfolio with a capped risk manager, or an unresolvable trial | **400** | the service error message |

> [!TIP] Promotion is idempotent, the batch is partial-success
> Re-promoting an already-promoted trial returns the existing `managed_portfolio_id`, so the **Promoted** state is cosmetic — it exists only so the UI never offers an action that would visibly do nothing. The batch endpoint collapses duplicates, preserves the caller's order, and degrades a per-id failure into a `failed` entry instead of aborting: a mixed result is normal, and both halves must be read.

Quota is charged **for the whole batch up front** (`ids.len()`), so a 30-trial batch against a plan with 20 remaining slots returns 402 and promotes nothing. See [tokens and billing](/docs/tokens-and-billing).

### What promotion copies, and why it can fail

Promotion takes a full **isolation snapshot** inside one transaction: the strategy code and parameters, the concrete trial parameters, the runnable universe, the fitness configuration, the already self-contained risk-manager snapshot and the historical seed — plus a copy of the trial's holdings, equity and orders into a parallel managed data plane. A partially-promoted portfolio cannot exist. What that freezes and what stays live is documented on [Promoted Portfolios](/docs/promoted-portfolios).

Two hard rejections are worth knowing before you select 50 cards:

- **EXTERNAL strategies cannot be promoted.** Managed daily-update mode supports INTERNAL strategies only, so an EXTERNAL trial cannot daily-extend and cannot join a portfolio group. See [execution modes](/docs/execution-modes).
- **A meta-portfolio carrying a `sector_cap` or `country_cap` risk manager is refused.** Those act on per-ticker sector/country metadata that basket pseudo-tickers do not have, so they are degenerate on a portfolio-of-groups. Remove the attachment and promote again; every other risk manager is fully supported on meta-portfolios.

Both checks also run on the idempotent path, so a copy promoted before the guards existed is still rejected rather than silently reused.

## Limits and absences

### There is no multi-objective or pareto view

A Fintela study optimizes **one** objective, in one direction — `MAXIMIZE` or `MINIMIZE`, resolved from the study's metadata (falling back to the fitness function's own direction). Nothing in the product renders a pareto front or a multi-objective trade-off surface, and no endpoint returns one. **NSGA-II** appears only as a selectable sampler name; picking it changes the search algorithm, not the number of objectives or the screens you get. See [sampler selection](/docs/sampler-selection).

The nearest thing to a trade-off view is the pivot table (every metric × every stage, sorted by any column) and the 3D explorer (any two parameters against the objective) — both of which are still single-objective.

### Scalings are not an optimization concept

"Scaling" in Fintela means a **scale-in or scale-out event inside one trade**: an extra capital injection or withdrawal partway through a position, with its own duration, running return and P&L. It is a column and a drill-down on an individual candidate's Transactions tab, described on [Portfolio Analysis](/docs/portfolio-detail). There is no candidate-level or study-level scalings view.

### Other things this surface does not do

- Family granularity, representative mode, view mode, chart windows and histogram bins on the Portfolios Dashboard are **not** in the URL — a shared link restores the ranking and selection, not the visual state.
- The per-tab filter memory described below is **module-level and resets on a full page reload**.
- The Optimization Dashboard has no cross-study mode. Selecting **All studies** from it navigates away to the Portfolios Dashboard.
- Nothing on this surface edits a study. To change parameters, duplicate the study from [Studies](/docs/studies) and relaunch.

## URL state

Every filter that changes *which* candidates you see, or their order, is in the URL and therefore shareable.

| Parameter | Where | Values |
|---|---|---|
| `studyId` | both dashboards | a study id, or the literal `all` |
| `metric` | both dashboards | the metric's 1-based position in the sorted picker list |
| `stage` | both dashboards | `train`, `validation`, `out_of_sample`, `overall`, `real_life_performance`, `custom_timeframe`, `ytd`, `mtd`, `qtd`, `trailing_1m`, `trailing_3m`, `trailing_6m`, `trailing_1y`, `trailing_3y`, `trailing_5y` |
| `order` | Portfolios Dashboard | `asc` or `desc`; absent means auto (best-first for the metric's direction) |
| `topN` | both dashboards | a positive integer; absent means 10 |
| `portfolio_ids` | Portfolios Dashboard | CSV of selected candidate ids |
| `ct_frames` | both dashboards | encoded custom timeframes |
| `ptab` | Portfolios Dashboard | `risk`, `tables`, `estrategias` |
| `tab` | Optimization Dashboard | `overview`, `robustness`, `families`, `parameters` |
| `clusters_k` | Optimization Dashboard | the clustering granularity |
| `analysis` | both dashboards | the candidate id the revealed Portfolio Analysis tab points at |

Because the two dashboards are separate routes, their filters are naturally independent. The tab links rebuild the URL from scratch, so each tab's slice of `metric`, `topN`, `order`, `stage`, `ct_frames` and `portfolio_ids` is remembered and re-attached when you come back. `studyId` and `analysis` are deliberately **not** per-tab — they are shared and re-attached to every tab href, which matches the "same study, same open portfolio" mental model.

## Where to go next

- [Portfolios Dashboard](/docs/portfolios-dashboard) — the companion page for the candidate list surface.
- [Portfolio Analysis](/docs/portfolio-detail) — one candidate in full: performance, holdings, transactions, risk, robustness.
- [Analyzing results](/docs/analyzing-results) — how to read a study's output end to end.
- [Promoted Portfolios](/docs/promoted-portfolios) and [Portfolio Groups](/docs/portfolio-groups) — what happens after you promote.
- [Portfolio Manager](/docs/portfolio-manager) — book-level analysis, once you have groups.
- [Metrics reference](/docs/metrics-reference) — what each metric in the pickers and tables means.
- [Trials and portfolios API](/docs/api-trials-portfolios) — the same rankings, programmatically.
