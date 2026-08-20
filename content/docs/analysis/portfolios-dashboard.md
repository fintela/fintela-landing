---
title: Portfolios Dashboard
section: Analysis & Portfolios
sectionOrder: 4
order: 1
published: true
updated: 2026-08-18
summary: Monitor and manage every active portfolio — the ranked table, its filters, and what each column means.
keywords: portfolios, dashboard, monitoring, ranked table, filters, sharpe, drawdown, active portfolios, real-time
---

The Portfolios Dashboard at `/analysis/portfolios` is where you rank one study's trials — or every
study's trials at once — against a single metric over a single stage, compare the winners side by
side, and act on them: promote a trial into the Portfolio Groups, build a portfolio group from a
selection, or derive risk-manager-optimized variants. Everything on the screen is driven by the URL,
so any view you reach is a link you can share. The rankings and the card figures are read from
stored per-portfolio metric rows; only the custom-timeframe ranking and the comparison strip are
computed on request, from stored equity.

## Where the dashboard sits

`/analysis/portfolios` is the landing route of the **Portfolios** feature (`portfolios-analysis`),
which appears in the sidebar's Analysis section. The feature mounts a shared layout that renders the
section tabs above every page in the section.

| Section tab | Route | What it shows |
|---|---|---|
| `Portfolios Dashboard` | `/analysis/portfolios` | the ranking and comparison dashboard — this page |
| `Optimization Dashboard` | `/analysis/portfolios/study/:studyId` | one study's optimization analysis |
| `Portfolio Analysis` | `/analysis/portfolios/:portfolioId…` | one portfolio's six detail tabs |

`Portfolio Analysis` is hidden until you drill into a portfolio. It then stays revealed until you
dismiss it with its close control, labelled `Close Portfolio Analysis`. On the two dashboard routes
the open portfolio rides in `?analysis=` carrying the portfolio id; on a detail route the path names it, and the param is
deliberately absent. A `?analysis=` value that is not a positive integer resolves to "no tab" rather
than a tab pointing at nothing.

The six detail tabs behind `Portfolio Analysis` are documented separately in
[portfolio detail](/docs/portfolio-detail). The Optimization Dashboard's four sub-views are covered
in [optimization dashboard](/docs/optimization-dashboard); this page documents only the shell that
hosts them.

### Access

Every endpoint this surface reads — portfolios, trades, orders and the metric catalogue — requires
the single backend permission `portfolios:read`. Without it the API answers
`403 Missing permission 'portfolios:read'`; the SPA still mounts the route and renders the shell.

> [!NOTE]
> There is no entitlement lock on this feature. It is never blurred behind a "Buy tokens" overlay,
> and the `permission` field declared on the frontend feature definition is inert metadata — access
> control is enforced by the API, not by hiding the tab.

`DELETE /portfolios` requires `root:all`. Nothing in this feature calls it.

## The filter bar

The Metric / Study / Top N / Rank by bar is rendered *inside* each dashboard tab rather than once in
the layout, so the Portfolios Dashboard and the Optimization Dashboard keep independent filter state.
Switching between the two tabs restores each tab's last filter slice
(`metric`, `topN`, `order`, `stage`, `ct_frames`, `portfolio_ids`) from an in-session memory;
`studyId` and `analysis` are shared across tabs and re-attached explicitly. That memory is
module-level, so a full page reload drops it and the URL alone decides.

### Metric

A dropdown labelled `Metric` with an inline search box (placeholder `Search…`, accessible name
`Search metrics`). Fitness metrics are listed first, then a divider, then every other metric. Search
matches the metric's label and its catalogue description. No match renders a disabled `No matches`.

Each option shows the metric name on line one and, on line two, either an unavailability reason, a
stage hint, or the catalogue description.

| Second-line caption | When it appears | Option state |
|---|---|---|
| `No closed trades, or pending the daily metrics run` | catalogue category `trade`, no stored rows for this study | disabled |
| `Needs a benchmark — this study has none` | category `benchmark`, study has no benchmark ticker | disabled |
| `Not computed for this study yet` | category `benchmark`, benchmark exists but nothing stored | disabled |
| `No values for this study yet (computed daily)` | a promoted-fitness custom metric with no stored rows | disabled |
| `No data for this study` | any other metric with no stored rows | disabled |
| `No data in the selected stage` | the metric has rows, but not in the active stage | still selectable |

Disabling only happens when a single study is selected *and* the availability map has loaded and is
non-empty. In `All studies` mode, while loading, and for a freshly launched study with no stored
metrics at all, every option stays enabled.

The dashboard opens on `fitness`. Metric ids in the URL are **1-based alphabetical positions** over
the deduplicated union of the `/metrics` catalogue and the benchmark metric names — not catalogue
ids. A `?metric=7` in a bookmark is not stable across additions to the catalogue.

### Study

A searchable dropdown labelled `Study`, listing your organisation's non-draft studies by display
name. Studies whose last status is `SAVED` (drafts) are filtered out entirely. With no studies at
all, the control is wrapped in the tooltip `No studies available`.

The first, pinned option is `All studies` — the cross-study mode, written as `?studyId=all`. It is
disabled while a fitness metric is selected, and carries the inline caption
`Not available with fitness metrics (fitness is study-specific)`. It is also disabled when there are
no studies.

With no `?studyId=` in the URL, the dashboard seeds the highest (most recent) non-draft study id.

> [!NOTE]
> In `All studies` mode there is no single study to attribute results to, so the provenance strip,
> the clustering-driven family features and the Strategies sub-tab all stand down, and the
> `Optimization Dashboard` section tab renders grey and non-interactive.

### Top N

A numeric field labelled `Top N`, minimum `1`, default `10`, seeded into `?topN` on first load. It is
the ranking depth requested from the server.

### Rank by

A caption reading `Rank by` (rendered uppercase) beside one grouped selector with three groups.

**`Study stages`** — the classic stages, each with its identity colour dot.

| Option | `?stage=` value | Offered when |
|---|---|---|
| `Overall` | `overall` | always |
| `Train` | `train` | the study's served periods include it |
| `Val` | `validation` | the study's served periods include it |
| `OOS` | `out_of_sample` | the study's served periods include it |
| `RLP` | `real_life_performance` | the study's served periods include it |

In `All studies` mode all five are offered; studies lacking a stage simply contribute no rows.

**`Rolling windows`** — offered only when the equity date axis on show spans the lookback.

| Option | `?stage=` value | Lookback |
|---|---|---|
| `MTD` | `mtd` | calendar month to date |
| `1M` | `trailing_1m` | 30 days |
| `QTD` | `qtd` | calendar quarter to date |
| `3M` | `trailing_3m` | 90 days |
| `6M` | `trailing_6m` | 180 days |
| `YTD` | `ytd` | calendar year to date |
| `1Y` | `trailing_1y` | 365 days |
| `3Y` | `trailing_3y` | 1095 days |
| `5Y` | `trailing_5y` | 1825 days |

The three calendar windows have no lookback and appear as soon as there is any date axis.

**`Custom trailing window`** — one option labelled `Custom` (or, once applied, the window's own
label). Selecting it opens a popover with a number field `Last` (minimum 1, step 1), a `Unit` select
offering `Days` / `Weeks` / `Months` / `Years`, and an `Apply` button. Applying writes
`?stage=custom_timeframe` and a `?ct_frames=` entry of the form `start~end~1~Last N Unit`, with the window anchored to
the **last date on the axis**, not to today.

> [!WARNING]
> The date axis that gates the rolling and custom windows is published by the view you are on, and it
> is scoped to that route. On the Portfolios Dashboard it is the union of equity dates for the
> **currently checked portfolios** (`GET /portfolios/dates`), so widening or clearing the selection
> can change which windows are on offer. The Optimization Dashboard route publishes no axis at all,
> so its `Rank by` bar offers the classic study stages only.

## What counts as an active portfolio

Three different notions of "active" live on this screen. They are independent, and conflating them is
the fastest way to misread the dashboard.

| Notion | Where it lives | What it drives |
|---|---|---|
| **The selection** — checked cards | `?portfolio_ids=` (CSV of ids) | the combined equity chart, the comparison strip, the risk charts, every comparison table, and every bulk action |
| **The active ranking** — rows on show | derived from `?studyId` + `?stage` + `?metric` + `?order` + `?topN` | which cards render, in which order |
| **The open portfolio** | `?analysis=` (a portfolio id), or the path on a detail route | which portfolio the revealed `Portfolio Analysis` tab points at |

### How the selection is seeded and pinned

A ranking you have not curated is auto-selected whole: the dashboard opens with every top-N card
checked and every curve overlaid. Auto-selection is written with a history *replace*, so Back does
not walk you through each re-seed.

Any change to the ranking identity re-arms auto-selection — that is `studyId` (including the
all-studies mode), `stage`, the metric name, the ranking order, `topN`, and the custom timeframes.
Family grouping is deliberately **excluded**: regrouping reshapes rows that are already ranked, so
toggling it never wipes a hand-picked selection.

A deliberate gesture — toggling a card, using the select-all checkbox, or `Clear` — pins the
selection for as long as those filters stand, including an empty one. Changing the metric or the
study also clears `?portfolio_ids=` outright, and changing the metric additionally drops `?order=`
back to automatic.

## Ranking cards

The ranking is a single-column card carousel on the left of the hero row (fixed 660 px tall on
desktop; on mobile it stacks above the chart and flows with the page).

Its header carries a tri-state checkbox — checked when every row is selected, indeterminate when some
are — the title `Portfolio Ranking`, a `({{count}} selected)` caption, and a `Clear` button once a
selection exists. Below the header, a right-aligned button reads `Ranked by` followed by the active
metric and an up or down arrow; clicking it flips `?order=` between `asc` and `desc`.

With no explicit `?order=`, the ranking sorts best-first for the metric's own direction: ascending
for a lower-is-better metric such as `max_drawdown`, descending otherwise.

### Card anatomy

| Element | Content | Notes |
|---|---|---|
| Checkbox | adds or removes the trial from the selection | stops the click from opening the card's link |
| Rank | `#1`, `#2`, … | monospace, positional in the displayed list |
| Family dot | coloured dot, tooltip `Fam.` followed by the family id | only when the study has a clustering artifact |
| Trial label | `Trial N · ` followed by the study's display name | shows `Trial …` while the lookup loads |
| Leader star | ★ | on rank 1 of the displayed list |
| `Promoted` chip | tooltip `Already promoted to the Portfolio Groups` | when a managed portfolio already exists for this trial |
| `+{n}` chip | tooltip `+{{count}} more in this family` | representative mode only |
| ⋮ button | tooltip `More actions` | opens the row action menu |
| Ranked value | the metric label and its formatted value | falls back to the caption `Value` when no metric is resolved |
| Sparkline | 280 × 52 equity thumbnail | downsampled to about 48 points |
| `Sharpe` | `sharpe_ratio` | plain ratio |
| `Alpha` | `alpha` | rendered as a percentage |
| `Beta` | `beta` | plain ratio |

The whole card is a link to the portfolio's detail page, carrying `?studyId=` for the row's own study
(in `All studies` mode each row is attributed to the study the global ranking returned it from).

The three stat values come from the active classic stage, falling back to `overall`, then
`validation`, then `train` — so a rolling-window or custom-timeframe ranking still shows headline
risk figures rather than dashes. Percent metrics render with one decimal, ratios with three, and
day-valued metrics as whole days with a `d` suffix.

### Empty ranking messages

When the ranking comes back empty, the card list explains why rather than showing a bare panel.

| Message | Cause |
|---|---|
| `No portfolios to rank for this stage.` | generic fallback, no specific reason resolved |
| `No closed trades to aggregate for this study, or its trade metrics are still pending the daily metrics run.` | a `trade` category metric with no stored rows |
| `{{metric}} is measured against a benchmark, and this study has none.` | a benchmark metric on a study without a benchmark ticker |
| `Benchmark metrics have not been computed for this study yet.` | a benchmark metric, benchmark present, nothing stored |
| `This custom metric has no values for this study yet. Custom metrics are computed daily.` | a promoted-fitness metric with no stored rows |
| `No data for {{metric}} in this study.` | any other metric with no stored rows |
| `No data for this metric in the selected stage. Available in: {{stages}}.` | the metric has rows, but not in the active stage |

These explanations are suppressed for `custom_timeframe`, which is computed on the fly from equity
rather than read from stored rows.

### Row actions

The ⋮ button opens a menu headed by the trial label.

| Item | Secondary line | Disabled when |
|---|---|---|
| `Promote` | `Add this trial to the Portfolio Groups as a managed portfolio` | — |
| `Promoted` | `Already promoted to the Portfolio Groups` | always (the trial is already promoted) |
| `Derive / Optimize RMs` | `Derive risk-manager-optimized variants of this portfolio` | replaced by `This portfolio already contains a Risk Manager` and disabled when the portfolio already carries a risk-manager configuration |
| `Individual Dashboard` | `View detailed analytics for this portfolio` | — |

`Individual Dashboard` is a real link, so middle-click and "open in new tab" work. `Promote` calls
`POST /portfolio_manager/managed/promote` and is idempotent server-side — the "already promoted"
state exists so the UI never offers an action that would visibly do nothing. See
[portfolio manager](/docs/portfolio-manager) for what promotion produces.

The risk-manager check behind `Derive / Optimize RMs` reads the configurations already loaded for the
current selection, so it is only authoritative for a checked card. The wizard re-verifies every
source before it will submit — see the cleanliness rule under [risk managers](/docs/risk-managers).

## Comparison strip

Whenever at least one portfolio is checked, a card titled `Comparison` sits above the hero. Its
subtitle is the window as `YYYY-MM → YYYY-MM`, and its info tooltip reads
`How the selected portfolios performed over the current window (the live zoom, or the full range).`

| Tile | Value | Tooltip |
|---|---|---|
| `Selected` | count of checked portfolios | `Number of portfolios currently selected.` |
| `Leader` | best `total_return`, signed percent | `Best total return in the selection over this window.` |
| `Dispersion` | best minus worst `total_return`; `—` with fewer than two rows | `Spread between the best and worst total return — how differently the selected portfolios behaved.` |
| `Median Sharpe` | median `sharpe_ratio`, two decimals, plain number | `Median Sharpe ratio across the selection over this window.` |
| `Worst Drawdown` | minimum `max_drawdown`; painted red whenever non-zero | `Deepest maximum drawdown in the selection over this window.` |
| `Families` | distinct behavioural families in the selection | `Distinct behavioral strategy families among the selection. Open the Strategies tab to explore them.` |

`Families` appears only when the study has a clustering artifact. The window is the first to last
date across the selection's equity curves, and the figures are computed on the fly by
`GET /portfolios/metrics/window`.

## Combined equity chart

The right side of the hero overlays one equity curve per **checked** trial, in the same colour the
card uses. With nothing checked it reads
`Check one or more trials in the ranking to plot their equity curves here.`

The chart is titled `Equity Curve` with the subtitle
`{{count}} trial curves overlaid · Check or uncheck a card to add or remove one`. Its header control
is `View last` — a number field with the placeholder `All` and a unit select offering
`Days` / `Weeks` / `Months` / `Years`.

Curves are fetched for the whole displayed ranking, not just the selection, so checking and
unchecking cards costs no extra request. Only a selection reaching outside the ranking widens the
fetch.

## Bulk-promote bar

A sticky bar appears at the top of the dashboard when **two or more cards are checked and you made a
deliberate selection gesture**. It will not appear on a fresh load, even though the whole top-N is
auto-checked.

It shows a rocket icon and `Promote Selected ({{count}})`, an optional success chip
`{{count}} already promoted`, a text button `Clear`, and a contained `Promote Selected` button. The
button's tooltip is `Promote every checked trial into the Portfolio Groups in one go`, or
`Every checked trial is already promoted` when nothing remains to promote (in which case the button
is disabled). A progress bar runs while the batch is in flight.

Already-promoted ids are dropped from the request rather than re-sent. The call is
`POST /portfolio_manager/managed/promote/batch`, which is **partial-success**: it returns what
succeeded and what failed, and the UI reports both — a green `{{count}} portfolios promoted` plus a
warning `{{count}} trials could not be promoted` with the per-trial reasons. The selection is cleared
only on success, so a failed batch can be retried without re-checking every card.

## Advanced analysis

A permanently expanded section titled `Advanced analysis`, subtitled
`Risk charts, comparison tables and behavioral strategies`. Despite its header styling it has no
collapse control. Inside, a tab bar bound to `?ptab=`.

| Tab | `?ptab=` value |
|---|---|
| `Risk charts` | `risk` — the default, and the fallback for any unrecognised value |
| `Comparison tables` | `tables` |
| `Strategies` | `estrategias` |

> [!NOTE]
> The Strategies tab's parameter value is the Spanish `estrategias` while its caption is English.
> Shared URLs will show it.

### Risk charts

With nothing checked:
`Select one or more portfolios in the ranking to see their risk charts.` With a selection, a
two-column grid of four charts, each 420 px tall (240 px on mobile). Every chart toggles between a
time series and a histogram with a bar-chart icon whose tooltip reads `Switch to Histogram` or
`Switch to Time Series`.

| Chart | Time-series title / subtitle | Histogram title / subtitle | Units | Window control |
|---|---|---|---|---|
| Drawdown | `Drawdown` / `Peak-to-trough decline` | `Drawdown distribution` / `Histogram of rolling drawdown` | percent | none |
| Volatility | `Volatility` / `Rolling volatility` | `Volatility distribution` / `Histogram of rolling volatility` | percent | `Window size`, default `14` |
| Rate of change | `Rate of Change` / `Momentum (ROC)` | `Rate of Change distribution` / `Histogram of momentum (ROC)` | percent | `Window size`, default `14` |
| Sharpe | `Sharpe` / `Risk-adjusted return` | `Sharpe distribution` / `Histogram of risk-adjusted return` | ratio | `Window size`, default `14` |

Settings live behind a gear menu titled `Chart settings`. Histogram mode exposes `Bins` (default
`30`) and `Density` (default off). The time-series charts draw study-period separators from the
study's train-end, OOS-start and RLP-start dates, and render without their own date filter or legend.

> [!WARNING]
> Window sizes and histogram settings here are local component state — they are **not** written to
> the URL and do not survive a reload or a shared link. The Risk Analytics detail tab uses a
> different default window (20), so the two surfaces will not agree out of the box.

All four series arrive in one request (`GET /portfolios/curves`), so they fill in together; each
chart still carries its own `Retry` button, and pressing any of them refetches the whole bundle.

### Comparison tables

A three-way toggle — `Metrics`, `Pivot`, `Table` — chooses the layout. It is local state and defaults
to `Metrics`.

**`Metrics`** renders a table titled `Portfolio Metrics — All Stages`.

| Column | Content |
|---|---|
| `Metric` | one row per metric key present on the first selected portfolio, alphabetical |
| *(group header)* | one group per selected portfolio, captioned with its trial label plus ` ★` for the leader |
| stage sub-columns | one per stage that has data — `Train`, `Val`, `OOS`, `Overall`, `RLP` |

Every stage sub-column is clickable and sorts the metric rows by that portfolio-and-stage cell;
the active column shows ` ↓` or ` ↑`. Cells are heat-tinted against each metric's own min–max across
the whole table: green in the top 15%, red in the bottom 15%. Only `max_drawdown` and `volatility`
are inverted so that low reads as good — every other metric is tinted as if higher were better.

**`Pivot`** renders `Portfolio Comparison — All Metrics × Stages`, subtitled
`Rows = portfolios · Columns = metric × stage · Click column to sort`. Its first column is
`Portfolio`, holding each trial label (plus ` ★` for the leader) as a link into the detail page with
the tooltip `Open individual dashboard`. Header row one groups by metric, row two carries the same
clickable stage sub-columns. While metrics load it shows `Loading metrics for all portfolios…`.

**`Table`** is the same pivot table over **every portfolio in the selected study**, not just the
selection. Its metrics are fetched lazily and only while this mode is active.

In `Metrics` and `Pivot` modes two more tables render below.

| Table | Title | Columns |
|---|---|---|
| Strategy parameters | `Parameters` | `Parameter`, then one column per selected portfolio headed by its trial label |
| Risk-manager configuration | `Risk Manager Configuration` | `Risk Manager`, `Parameter`, then one column per selected portfolio headed by `P` plus the raw portfolio id |

The parameters table lists strategy parameters only — risk-manager parameters are namespaced away
into the second table, which renders nothing at all when no selected portfolio carries a risk
manager.

> [!NOTE]
> The risk-manager table's per-portfolio headers are the only place on this screen that shows a raw
> `portfolio_id`. Everywhere else the UI labels a trial as `Trial N · ` plus its study, because trial numbers collide
> across studies and the raw id is an internal identity.

### Strategies

With a concrete study selected, this tab embeds the study's behavioural clustering map, sharing the
dashboard's family granularity and highlighting the current selection (or, with nothing checked, the
displayed ranking). Clicking a trial in the map toggles its selection. In `All studies` mode it
reads `Select a study to see its strategy families.`

## Advanced options

A second permanently expanded section, titled `Advanced options` and subtitled
`Family grouping, concentration checks and bulk actions`. Its header carries a warning chip
`Concentration risk` when the concentration check fires, and an outlined
`{{count}} portfolios selected` chip whenever a selection exists.

### Concentration warning

When the study has a clustering artifact and the requested top-N collapses into too few behavioural
families, a banner appears. It headlines
`Your top {{n}} results span {{distinct}} distinct strategies` over the caption
`{{strategies}} distinct strategies among {{trials}} trials`, and carries one of two warning chips:

- `Your top performers collapse into one family — concentration / overfitting risk.` when at least
  three portfolios are ranked and they all sit in one family.
- `Your best results are largely redundant — consider diversifying.` when at least four are ranked
  and the distinct family count is at most `ceil(n / 4)`.

Its actions are `Show 1 per family` (when grouping is off), `View strategies` (switches to the
Strategies tab) and `Study analysis` (opens `/analysis/portfolios/study/:id?tab=families`).

The check always reasons about the **requested** `topN`, not the over-fetched pool that family
grouping pulls, so the signal stays stable when you toggle grouping.

### Family grouping

Available only when the study has a clustering artifact.

A toolbar toggles representative mode — tooltip `Show 1 per family` when off,
`Show all trials` when on — exposes the granularity (K) selector shared with the Strategies tab, and,
in representative mode, a method select.

| Method | Caption |
|---|---|
| `Medoid` | `Most typical trial` |
| `Best fitness` | `Highest fitness (→ Sharpe)` |
| `Best Sharpe` | `Highest Sharpe in the family` |
| `Best OOS Sharpe` | `Highest out-of-sample Sharpe` |
| `Best return` | `Highest return in the family` |
| `Lowest drawdown` | `Smallest max drawdown` |

`Medoid` is the default. Below the toolbar sits the caption `Show per family:`, a `Group by family`
toggle button, and a select offering `All`, `1 per family`, `2 per family`, `3 per family` and
`5 per family`.

> [!WARNING]
> Family grouping silently over-fetches so every family has candidates to draw from: at `1 per
> family` the dashboard requests `K × topN` rows, and above that `max(topN, K × perFamily)`. The rank
> numbers on the cards are positions in the *displayed* list, not in the raw ranking. Representative
> mode also back-fills any family whose members all fell outside the fetched pool; those rows carry
> no metric value and sort to the bottom.

### Bulk actions

| Control | Availability | Effect |
|---|---|---|
| `View recent batches` | always | opens the risk-manager optimization batch history (`GET /studies/rm-optimization-batches`) |
| `Create portfolio group (N)` | a selection exists | opens the create dialog; tooltip `Build a Portfolio Group from the selected portfolios`. On success it navigates to the new group at `/analysis/portfolio-groups/baskets/:id` |
| `Derive / Optimize RMs (N)` | a selection exists | opens the derivation wizard; tooltip `Create one risk-manager-optimization study per selected portfolio` |

`Derive / Optimize RMs` is disabled — with the tooltip
`This portfolio already contains a Risk Manager` — only when **every** selected portfolio already
carries a risk manager. A mixed clean-and-dirty selection still opens the wizard, where the dirty
ones can be removed inline. The wizard itself is documented under
[risk managers](/docs/risk-managers).

## URL state

| Parameter | Values | Default | Seeded into the URL? |
|---|---|---|---|
| `studyId` | a positive integer, or the literal `all` | most recent non-draft study | yes |
| `metric` | picker id (1-based alphabetical position) | the id whose name is `fitness` | yes, once the metric catalogue has loaded |
| `stage` | one of the 14 stage keys listed above, or `custom_timeframe` | `overall` | yes |
| `order` | `asc` \| `desc` | absent means automatic — best-first for the metric's direction | no, deliberately |
| `topN` | integer ≥ 1 | `10` | yes |
| `portfolio_ids` | CSV of portfolio ids | auto-seeded from the ranking | written, not seeded |
| `ct_frames` | `start~end~weight~label` entries joined by `\|` | — | no |
| `ptab` | `risk` \| `tables` \| `estrategias` | `risk` | no |
| `analysis` | a positive integer portfolio id | — | no |

### Automatic corrections

The dashboard rewrites the URL rather than letting the selector and the charts disagree.

- A `?stage=` the study does not have is clamped back to `overall` and written back.
- A fitness metric combined with a rolling window — or with a custom timeframe containing one —
  switches to the first non-fitness metric.
- A metric with zero stored rows for the study switches to `sharpe_ratio` when available, otherwise
  the first available non-fitness metric, with the notice
  `"{{from}}" has no data for this study. Switched to "{{to}}".`
- A fitness metric combined with `?studyId=all` leaves cross-study mode and selects the most recent
  study.

> [!CAUTION]
> Two of those notices are shipped as hardcoded Spanish strings and will appear untranslated in an
> English interface: the custom-timeframe fitness fallback and the `All studies` fitness fallback.
> The third, the no-data metric switch, is localised.

## Refresh and data freshness

> [!WARNING]
> Nothing on this dashboard polls, streams or auto-refreshes. There is no `refetchInterval`, no
> websocket and no server-sent events anywhere in the portfolios data layer, and refetch-on-focus is
> switched off. Data refreshes when a query goes stale and something remounts or renavigates — not
> on a timer.

| Query | Stale after |
|---|---|
| most portfolio reads — rankings, equity, metrics, parameters, trials, dates | 60 seconds |
| metric availability per study | 5 minutes |
| on-the-fly window metrics (the comparison strip) | 30 seconds |
| the metric catalogue (`GET /metrics`) | 24 hours |
| the managed-portfolio list behind the `Promoted` chips | 1 hour |

The reads on the 60-second and 5-minute rows above never retry a client error — notably `429` from
the per-organisation rate limit, since these batch reads are the application's cold-load burst.
Transient network and 5xx failures still retry.

Large id lists are split into chunks of **200 ids per request**. A chunk that fails is tolerated: the
dashboard keeps every chunk that succeeded and only surfaces an error when all of them fail. A
partial failure therefore renders partial data.

Note also that the per-portfolio stage metrics behind the ranking are produced by a **once-daily**
batch job, so a study whose trials finished after the last run will rank on whatever was stored at
that point. Trade-category and promoted-fitness metrics in particular are computed by that run, which
is why their unavailability captions mention it.

## Optimization Dashboard shell

`/analysis/portfolios/study/:studyId` is the second dashboard tab. The page itself is minimal: it
renders the same filter bar, then the study analysis view for the study named in the path.

Because the study id lives in the path here rather than the query, the filter bar reconciles the two:
changing the study navigates to the new study's route (carrying a revealed `Portfolio Analysis` tab
along), and picking `All studies` navigates back to the Portfolios Dashboard with `?studyId=all`,
dropping `?tab=` and `?portfolio_ids=`.

The four sub-views are selected with `?tab=` and, inside the portfolios section, are reached from the
`Optimization Dashboard` tab's dropdown rather than a second tab bar.

| Sub-view | `?tab=` value |
|---|---|
| `Overview` | `overview` |
| `Robustness` | `robustness` |
| `Families` | `families` |
| `Parameters` | `parameters` |

Older `?tab=` values still resolve, and the canonical value is written back into the URL.

| Retired value | Resolves to |
|---|---|
| `clusters` | `families` |
| `optimization` | `parameters` |
| `importances` | `overview` |
| `config` | `overview` |

Anything unrecognised falls back to `overview`.

The page renders the study header — identity, KPIs, run-state banners — plus its controls: stop the
study, export a snapshot, export the best trial, export hyperparameters, and open contextual help.
Stop is disabled unless the study is running, with the reason
`Only running studies can be stopped.` A `Custom Timeframes` dialog is available for building
weighted multi-window views.

Every drill-down out of this view — a scatter point, a heatmap cell, a parallel-coordinates line, a
cluster table row — opens the portfolio detail page with the study attached, which is what reveals
the `Portfolio Analysis` tab.

Its states are a spinner while identity and metadata load, the error alert
`Failed to load study information.`, and the alert `Study not found.` for a missing or non-numeric
study id.

> [!NOTE]
> Breadcrumbs and the standalone sub-tab bar are suppressed inside `/analysis/portfolios` — the
> section tabs above already carry that navigation. They appear only on the standalone studies route.

## Related pages

- [portfolio detail](/docs/portfolio-detail) — the six tabs behind `Portfolio Analysis`.
- [optimization dashboard](/docs/optimization-dashboard) — what each of the four study sub-views shows.
- [metrics reference](/docs/metrics-reference) — every metric in the picker, its unit and direction.
- [studies](/docs/studies) — creating and running the studies this dashboard ranks.
- [portfolio manager](/docs/portfolio-manager) and [portfolio groups](/docs/portfolio-groups) — where promoted trials land.
- [analyzing results](/docs/analyzing-results) — how to read a ranking without fooling yourself.
- [api trials and portfolios](/docs/api-trials-portfolios) — the endpoints behind this screen.
