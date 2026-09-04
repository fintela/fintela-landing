---
title: Portfolios Dashboard
section: Analysis & Portfolios
sectionOrder: 4
order: 1
published: true
updated: 2026-09-01
summary: Rank, compare, and act on your portfolios: the ranked list, its filters, and what each control does.
keywords: portfolios, dashboard, ranking, filters, sharpe ratio, drawdown, comparison, promote, portfolio groups, strategy families
---

The Portfolios Dashboard is where you rank the trials from one study (or every study at once)
against a single performance metric, compare your top candidates side by side, and act on them
directly: promote a trial into Portfolio Groups for live trading, build a new Portfolio Group from a
handful of favorites, or spin off risk manager optimized variants. Everything you set up here: the
study, the metric, your selection, even which advanced tab you're on: lives in the page's web
address, so any view you land on is a link you can bookmark or hand to a colleague.

## Where to find the dashboard

You'll find `Portfolios Dashboard` in the sidebar's Analysis section. It's the landing tab of a
three tab group that also includes the `Optimization Dashboard` (a deep dive into one study at a
time) and, once you drill into a specific portfolio, `Portfolio Analysis` (that portfolio's six tab
detail view).

| Tab | What it shows |
|---|---|
| `Portfolios Dashboard` | The ranking and comparison view: this page |
| `Optimization Dashboard` | One study's full optimization analysis |
| `Portfolio Analysis` | One portfolio's detail tabs |

`Portfolio Analysis` only appears once you've opened a specific portfolio from a ranking card or a
chart. It stays available until you close it with its own close control, and opening a different
portfolio just swaps what it's showing.

The six tabs behind `Portfolio Analysis` are covered in [portfolio detail](/docs/portfolio-detail);
the Optimization Dashboard's four views are covered in
[optimization dashboard](/docs/optimization-dashboard): this page focuses on the ranking and
comparison view itself.

### Access

Using this dashboard requires portfolio viewing access on your account: standard for any trading or
analysis role. If you land on the page and see no data, ask your organization's administrator to
confirm that access is turned on for you.

> [!NOTE]
> There's no paywall or token purchase prompt gating this feature: every account with portfolio
> access sees the full dashboard.

## The filter bar

The Metric / Study / Top N / Rank by controls sit at the top of both the Portfolios Dashboard and the
Optimization Dashboard, and each tab remembers its own settings independently: switch between them
and each restores the filters you last had there. A full page reload, though, resets filters to
whatever the link you loaded specifies (or the defaults, if none).

### Metric

A searchable dropdown lets you choose what you're ranking on: start typing to filter by name or
description. Fitness metrics (the objective your study was optimized for) are listed first, followed
by every other available metric: returns, risk, and benchmark relative measures. If nothing matches
your search, it tells you so rather than showing an empty list.

Some options are temporarily unavailable, with a note explaining why:

| What you'll see | What it means |
|---|---|
| No closed trades, or pending the daily metrics run | The study hasn't closed any trades yet, or today's metrics calculation hasn't run |
| Needs a benchmark: this study has none | This metric compares against a benchmark, and the study wasn't set up with one |
| Not computed for this study yet | A benchmark is configured, but the comparison hasn't been calculated yet |
| No values for this study yet (computed daily) | A custom metric based on your study's fitness function, still awaiting its first daily calculation |
| No data for this study | Nothing has been recorded for this metric on this study |
| No data in the selected stage | The metric has data, just not for the stage you're currently viewing: you can still pick it |

Grayed out options only appear once Fintela has finished checking what's available for the study
you've picked. While that check is running, or when you're comparing across every study at once,
every metric stays selectable.

The dashboard opens on the `Fitness` metric by default.

> [!TIP]
> If new metrics get added to the platform after you bookmark a specific one, a saved link could open
> on a different metric than you intended. If a shared link ever lands on an unexpected metric, just
> reselect the one you want.

### Study

A searchable dropdown lets you pick which study to rank trials from, listing your organization's
studies by name (studies still in draft, and not yet run, aren't included). With no studies at all,
the control lets you know none are available yet.

At the top of the list sits `All studies`: ranks trials across every study at once, side by side.
This mode isn't available while you're ranking by a Fitness metric, since fitness is specific to one
study's objective; the option is grayed out with an explanation why. It's also unavailable when there
are no studies yet.

If you land on the dashboard without a study already chosen, it opens on your most recently created
one.

> [!NOTE]
> In `All studies` mode, a few things that only make sense for a single study switch off: the
> strategy family view, the Strategies tab, and the `Optimization Dashboard` tab: which analyzes one
> study's runs and can't operate across many studies at once.

### Top N

A number field labeled `Top N` controls how many trials come back in the ranking. It defaults to
`10` and accepts any depth of `1` or more.

### Rank by

Choose what time window the ranking is calculated over, grouped into three sets of options.

**Study stages**: the standard phases of a strategy's lifecycle:

| Stage | Shown when |
|---|---|
| `Overall` | always |
| `Train` | the study includes a training period |
| `Val` | the study includes a validation period |
| `OOS` (out of sample) | the study includes an out of sample period |
| `RLP` (real life performance) | the study includes live trading history |

In `All studies` mode, all five are always offered: a study that doesn't have a particular stage
simply contributes no rows for it.

**Rolling windows**: trailing performance windows, offered once there's enough price history behind
your currently checked portfolios to cover them:

| Window | Covers |
|---|---|
| `MTD` | Month to date |
| `1M` | Trailing 30 days |
| `QTD` | Quarter to date |
| `3M` | Trailing 90 days |
| `6M` | Trailing 180 days |
| `YTD` | Year to date |
| `1Y` | Trailing 1 year |
| `3Y` | Trailing 3 years |
| `5Y` | Trailing 5 years |

The three calendar windows (`MTD`, `QTD`, `YTD`) show up as soon as there's any price history at all;
the fixed length windows only appear once there's enough history behind your selection to fill them.

**Custom window**: pick your own trailing period: enter a number and a unit (`Days`, `Weeks`,
`Months`, or `Years`) and apply it. The window is anchored to the most recent date in the data you're
viewing, not to today's calendar date.

> [!WARNING]
> Which rolling and custom windows are on offer depends on which portfolios you currently have
> checked: widening or narrowing your selection can add or remove window options. On the
> `Optimization Dashboard` tab, only the standard study stages are offered; rolling and custom windows
> aren't available there.

## What counts as an active portfolio

Three different things on this screen can each be called "active," and it's worth keeping them
straight: confusing them is the fastest way to misread the dashboard.

| This... | Is controlled by | And determines |
|---|---|---|
| **Your selection**: the portfolios you've checked | clicking checkboxes on cards | the combined equity chart, the comparison strip, the risk charts, every comparison table, and any bulk action |
| **The ranking**: which cards are shown at all | your Study / Stage / Metric / Sort / Top N choices | which trials appear, and in what order |
| **The open portfolio** | drilling into a card, or arriving via a direct link | which portfolio's `Portfolio Analysis` panel is showing |

A portfolio can sit at the top of the ranking without being part of your comparison, and vice versa if
you've hand picked something further down.

### How your selection starts: and when it locks in

When you land on a fresh ranking, Fintela checks every card in it for you automatically, so the
equity chart and comparison strip are populated with something useful right away.

The moment you make a deliberate choice: checking or unchecking a card, using the select all box, or
hitting `Clear`: your selection locks in and stops auto updating, even if that leaves it empty. It
stays locked as long as you don't change the study, stage, metric, sort order, ranking depth, or time
window; change any of those and the dashboard re seeds your selection from the new top N
automatically. Switching how trials are grouped into families is the one exception: it never
disturbs a selection you've made by hand.

Changing the metric or the study clears your selection outright and starts fresh; changing the metric
also resets the sort direction back to automatic.

## Ranking cards

The ranking appears as a scrollable stack of cards on the left of the main view (it moves above the
chart on smaller screens).

The header shows how many portfolios are currently selected, a checkbox that selects or clears
everything at once, and (once you've selected something) a `Clear` button. A `Ranked by` control
shows the active metric with an arrow you can click to flip between best first and worst first.

By default, the ranking sorts best first for whatever you're ranking by: ascending for a metric where
lower is better, such as max drawdown, and descending for everything else.

### Card anatomy

Each card in the ranking shows:

| Element | What it tells you |
|---|---|
| Checkbox | add or remove this trial from your selection |
| Rank | its position in the current ranking (`#1`, `#2`, …) |
| Family badge | which strategy family it belongs to, when the study has been clustered |
| Trial label | the trial number and the study it belongs to |
| Star | marks the #1 ranked trial |
| `Promoted` badge | this trial is already a managed portfolio in Portfolio Groups |
| `+N` badge | in family view, how many more similar trials this card represents |
| ⋮ menu | more actions for this trial |
| Ranked value | the metric you're ranking by, and its value for this trial |
| Sparkline | a small equity curve preview |
| Sharpe, Alpha, Beta | quick risk/return stats, shown from the most relevant stage available |

Clicking anywhere on the card other than the checkbox or the menu opens that portfolio's detail page.

### Empty ranking messages

If the ranking comes back with nothing to show, the dashboard explains why instead of leaving a blank
panel:

| Message | What's going on |
|---|---|
| No portfolios to rank for this stage | generic: no more specific reason found |
| No closed trades to aggregate, or metrics still pending the daily run | the study hasn't closed trades yet, or today's metrics calculation hasn't run |
| This metric is measured against a benchmark, and this study has none | the metric needs a benchmark ticker the study doesn't have |
| Benchmark metrics haven't been computed for this study yet | a benchmark exists, but the comparison hasn't run yet |
| This custom metric has no values for this study yet | a fitness based custom metric, still awaiting its first daily calculation |
| No data for this metric in this study | nothing has been recorded for it |
| No data for this metric in the selected stage: but available in other stages | switch stages to see it |

These explanations don't apply to a custom time window, since that's calculated live from price
history rather than pulled from precomputed numbers.

### Row actions

Open a card's ⋮ menu for more:

| Action | What it does |
|---|---|
| `Promote` | Adds this trial to Portfolio Groups as a managed portfolio you can trade live |
| `Promoted` | Shown instead of `Promote` once it's already there: nothing left to do |
| `Derive / Optimize RMs` | Creates risk manager optimized variants of this portfolio |
| `Individual Dashboard` | Opens this portfolio's full detail page: a real link, so middle click and "open in new tab" both work |

Clicking `Promote` is always safe, even on something already promoted: the `Promoted` label just
means the dashboard already knows there's nothing left to do. See
[portfolio manager](/docs/portfolio-manager) for what promoting a trial actually sets up.

`Derive / Optimize RMs` is unavailable once a portfolio already has a risk manager configured: the
dashboard checks this against your current selection, and double checks again when you open the
wizard, so nothing risks going stale. See the rules under [risk managers](/docs/risk-managers).

## Comparison strip

Check one or more portfolios and a `Comparison` summary appears above the main view, covering the
date range shared by everything you've selected:

| Tile | Shows |
|---|---|
| `Selected` | how many portfolios you've checked |
| `Leader` | the best total return in your selection |
| `Dispersion` | the gap between your best and worst performer (needs at least two selected) |
| `Median Sharpe` | the median Sharpe ratio across your selection |
| `Worst Drawdown` | the deepest drawdown anyone in your selection hit |
| `Families` | how many distinct strategy families are represented (only shown when the study has been clustered) |

These figures are calculated fresh over whatever window you're currently viewing: the full history,
or a zoomed in range on the chart.

## Combined equity chart

The right side of the main view overlays an equity curve for every portfolio you've checked, each one
colored to match its card. With nothing checked yet, it prompts you to check a card to see a curve.

A `View last` control lets you zoom the chart to a recent window (days, weeks, months, or years)
without changing your underlying selection; it defaults to your full history.

The chart already has data loaded for the whole ranking behind the scenes, so checking and unchecking
cards is instant: only selecting something outside the currently ranked list triggers a fresh load.

## Promoting several portfolios at once

Deliberately check two or more portfolios yourself (not the ones auto selected on a fresh load) and
a bar appears at the top offering `Promote Selected (N)`: send every checked trial to Portfolio
Groups in one action instead of one at a time. It doesn't appear just because the dashboard
auto selected your top N for you; you have to make the choice yourself first.

If some of what you've checked is already promoted, the button tells you as much and only sends the
rest; if everything is already promoted, the button disables itself rather than doing nothing. A
progress indicator shows while the batch is underway.

Promoting a batch can partly succeed and partly fail: say, one trial hits a problem while the rest go
through fine: so the dashboard reports both outcomes clearly: how many succeeded, how many didn't and
why. Your selection only clears on full success, so a partial failure is easy to retry.

## Advanced analysis

Below the ranking and chart, an always open `Advanced analysis` section holds three tabs: `Risk
charts`, `Comparison tables`, and `Strategies`.

> [!NOTE]
> A couple of status messages in the Strategies tab may occasionally appear in Spanish even when the
> rest of your interface is in English: a known rough edge the team is tracking.

### Risk charts

Check one or more portfolios to see four charts: `Drawdown`, `Volatility`, `Rate of Change`, and
`Sharpe`. Each one toggles between a time series view and a distribution histogram.

For the rolling calculation charts (everything except Drawdown), a settings menu lets you change the
calculation window (14 periods by default). Histogram mode adds a bin count (30 by default) and a
density toggle (off by default). Time series charts mark where your study's train, validation,
out of sample, and live trading periods begin, so you can see performance in context.

> [!WARNING]
> Window size and histogram settings here reset when you leave the page or reload: they aren't
> captured in a shareable link. Also, the Risk Analytics tab on an individual portfolio's detail page
> uses a different default window (20 instead of 14), so figures between the two views won't always
> match unless you set them the same.

All four charts load together, so if one fails, retrying any of them refreshes the whole set.

### Comparison tables

A three way toggle switches between `Metrics`, `Pivot`, and `Table` layouts (defaults to `Metrics`):

- **Metrics**: one row per metric, one column group per selected portfolio, broken down by stage
  (`Train` / `Val` / `OOS` / `Overall` / `RLP`). Click any stage column to sort by it. Cells are
  color tinted against the best and worst values in the table (green near the top, red near the
  bottom), with drawdown and volatility tinted in reverse, since lower is better there.
- **Pivot**: the same comparison rotated so each portfolio is a row, with metrics × stages as
  columns; click a portfolio's name to open its detail page.
- **Table**: the same pivot layout, but for every portfolio in the study, not just your selection,
  useful for scanning the whole field at once rather than just what you've checked.

Below the `Metrics` and `Pivot` views, two more tables break out strategy parameters, and: when at
least one selected portfolio has one configured: risk manager settings, side by side for the
portfolios you've selected. Handy for spotting exactly what's different between two strategies that
performed differently.

> [!NOTE]
> The risk manager comparison table is the one place on this page that shows a raw portfolio ID rather
> than a trial number, because trial numbers can repeat across different studies while portfolio IDs
> are always unique.

### Strategies

With a single study selected, this tab shows a visual map of that study's strategy families,
highlighting whatever you currently have checked (or the whole ranking, if nothing's checked). Click
any point in the map to add or remove that trial from your selection. This view isn't available in
`All studies` mode, since strategy families are specific to one study's clustering.

## Advanced options

A second always open section, `Advanced options`, covers grouping trials into strategy families, a
concentration check, and bulk actions across your selection. Its header also shows how many
portfolios you currently have selected, and flags a `Concentration risk` warning when it applies.

### Concentration warning

When a study has been clustered into strategy families, and your top ranked results turn out to be
dominated by just one or two of them, a warning banner appears: a sign your "best" trials might be
overfitting rather than genuinely different strategies:

- If your top 3 or more ranked trials all belong to the *same* family, you'll see a strong warning
  about concentration and overfitting risk.
- If your top 4 or more trials are dominated by a small number of families relative to how many
  trials you're looking at, you'll see a softer "largely redundant, consider diversifying" warning.

From the banner you can switch to showing one representative per family, jump to the Strategies tab
to explore the families visually, or open the full study analysis to dig further.

### Family grouping

When a study has been clustered, a toolbar lets you switch the ranking from showing every trial to
showing one representative per strategy family: useful when your top results are dominated by
near duplicate variants of the same idea and you'd rather compare genuinely different strategies. A
granularity control, shared with the Strategies tab, lets you choose how many families the clustering
splits your trials into: fewer families for a broad view, more for finer distinctions.

While showing one representative per family, you can choose how many to show for each: anywhere from
one up to five, or every trial in the family: and how the representative itself is picked:

| Method | Picks the trial with... |
|---|---|
| `Medoid` (default) | the most typical behavior in its family |
| `Best fitness` | the highest fitness score |
| `Best Sharpe` | the highest Sharpe ratio |
| `Best OOS Sharpe` | the highest out of sample Sharpe ratio |
| `Best return` | the highest total return |
| `Lowest drawdown` | the smallest max drawdown |

> [!WARNING]
> In representative mode, the dashboard pulls in more candidates behind the scenes than your
> requested Top N, so every family has something to choose from: so a card's rank number reflects
> its position in what you're currently looking at, not necessarily its position in the full
> underlying ranking. If a family has no member within that expanded pool, it can still show up as a
> placeholder with no metric value, sorted to the bottom.

### Bulk actions

With one or more portfolios selected:

| Action | What it does |
|---|---|
| `View recent batches` | See the history of risk manager optimization runs you've started from this dashboard (always available) |
| `Create portfolio group (N)` | Build a new Portfolio Group from your selected portfolios: opens the new group once it's created |
| `Derive / Optimize RMs (N)` | Kick off a risk manager optimization study for each selected portfolio |

`Derive / Optimize RMs` is disabled only when every selected portfolio already has a risk manager
configured. If your selection is a mix (some already configured, some not) the wizard still opens,
and you can remove the already configured ones before submitting. See
[risk managers](/docs/risk-managers) for what the wizard produces.

## Shareable links & saved views

Every choice you make on this dashboard: which study, which metric, how deep the ranking goes, sort
direction, which stage or time window, which portfolios you've selected, and which advanced analysis
tab you're on: is captured in the page's web address. That means:

- Bookmarking the page saves your exact view.
- Copying the address bar and sending it to a colleague shows them precisely what you're looking at.
- Your browser's back button retraces your filter changes.

| What's captured | Falls back to, if not set |
|---|---|
| Study, or `All studies` | your most recently created study |
| Metric | `Fitness` |
| Stage or time window | `Overall` |
| Sort direction | automatic (best first) |
| Ranking depth (Top N) | `10` |
| Selected portfolios | re seeded from the ranking whenever key filters change |
| Custom time window | none |
| Advanced analysis tab | `Risk charts` |
| Open portfolio detail panel | none |

### Automatic corrections

The dashboard won't let your filters land in a broken combination: it corrects course automatically
and updates the link to match:

- If the stage you're viewing doesn't exist for the newly selected study, it falls back to `Overall`.
- Combining a Fitness metric with a rolling or custom window isn't possible, since fitness is measured
  per stage rather than per window, so the dashboard switches to the first non fitness metric
  available.
- If the metric you're viewing turns out to have no data for this study, it switches to Sharpe ratio
  (or the first available alternative) and tells you so.
- Combining a Fitness metric with `All studies` mode isn't possible either, so the dashboard drops out
  of `All studies` and picks your most recent study instead.

> [!CAUTION]
> A couple of these switch over notices currently display in Spanish regardless of your interface
> language: a known issue the team is tracking.

## Refresh and data freshness

> [!WARNING]
> This dashboard doesn't auto refresh, poll, or stream live updates: nothing changes on screen just
> because you're looking at it. Data updates when it's due for a refresh *and* you revisit the page or
> change a filter that requires a reload.

Roughly, here's how long data sticks around before your next visit triggers a refresh:

| Data | Refreshes after about |
|---|---|
| Most of what's on this dashboard: rankings, equity curves, metrics, parameters, trials, dates | a minute |
| Which metrics are available for a study | 5 minutes |
| The comparison strip's live calculated figures | 30 seconds |
| The full metric catalog in the picker | a day |
| Which portfolios show the `Promoted` badge | an hour |

If you're loading a very large selection, it's fetched in batches behind the scenes. If one batch hits
trouble, the dashboard keeps whatever loaded successfully and only shows an error if every batch
fails: so a temporary hiccup shows partial data rather than nothing at all.

> [!NOTE]
> The per portfolio numbers behind the ranking (returns, Sharpe, drawdown, and so on) are
> recalculated once a day. If a trial finished running after today's calculation, its ranking numbers
> reflect whatever was available as of the last run, not the very latest trade. This is also why
> trade based and custom fitness metrics sometimes show as "pending" right after a study finishes.

## The Optimization Dashboard tab

Selecting a specific study and switching to the `Optimization Dashboard` tab takes you to that
study's own analysis: the same filter bar you've been using, followed by a deep dive into that one
study's trials. See [optimization dashboard](/docs/optimization-dashboard) for what its four views
(`Overview`, `Robustness`, `Families`, `Parameters`) each show; this page covers only how you get
there and back.

Because this tab is tied to one specific study, changing the study while you're here takes you to
that study's own Optimization Dashboard; picking `All studies` instead takes you back to the main
Portfolios Dashboard in cross study mode.

> [!TIP]
> Old bookmarked links that reference a tab name from an earlier version of the product still work:
> they redirect automatically to the current equivalent.

From here, drilling into any chart point, table row, or heatmap cell opens that portfolio's detail
page with its study attached: which is also what reveals the `Portfolio Analysis` panel described
above.

The page header shows the study's identity, key stats, and run status, plus controls to stop the
study (grayed out with the note "Only running studies can be stopped" when it isn't actively running),
export a snapshot, export the best trial, export the study's parameters, and open contextual help. A
`Custom Timeframes` dialog lets you build your own weighted, multi window views of the study's
performance.

If something goes wrong loading the study, you'll see a plain error message rather than a blank
screen; an invalid or missing study shows "Study not found."

## Related pages

- [portfolio detail](/docs/portfolio-detail): the six tabs behind `Portfolio Analysis`.
- [optimization dashboard](/docs/optimization-dashboard): what each of the four study views shows.
- [metrics reference](/docs/metrics-reference): every metric in the picker, what it means, and which direction is "good."
- [studies](/docs/studies): creating and running the studies this dashboard ranks.
- [portfolio manager](/docs/portfolio-manager) and [portfolio groups](/docs/portfolio-groups): where promoted trials land, and how to manage them once they're there.
- [analyzing results](/docs/analyzing-results): how to read a ranking without fooling yourself.
- [api trials and portfolios](/docs/api-trials-portfolios): pull your studies, trials, and portfolio results into your own tools or dashboards, if you'd rather work outside Fintela.
