---
title: Optimization Dashboard
section: Analysis & Portfolios
sectionOrder: 4
order: 3
published: true
updated: 2026-09-01
summary: See which parameter combinations your study produced the strongest results, compare candidates side by side, and promote the ones worth trading.
keywords: optimization, candidates, trials, ranking, parameter importance, pivot table, sensitivity, compare, promote, robustness
---

A [study](/docs/studies) tests a strategy across many different parameter combinations and keeps a candidate portfolio — a **trial** — for every combination it tried. The Optimization Dashboard is where you make sense of that output: rank the candidates by any metric over any time period, overlay their equity curves, compare their metrics and parameters side by side, see which parameters actually drove performance, check whether the best result is genuine skill or just the luckiest of many backtests, and promote the ones worth keeping into durable [managed portfolios](/docs/promoted-portfolios). This page covers the whole workflow, from your first ranked list of candidates to a promoted portfolio.

## Finding your way around

This workflow lives under **Portfolios** in the left-hand navigation, and is available on every Fintela plan. It's really two connected screens that share one filter bar:

| Screen | What it's for |
|---|---|
| **Portfolios Dashboard** | The candidate ranking, equity overlay and comparison tables — your starting point after a study finishes. |
| **Optimization Dashboard** | A deep dive into one study: how the search evolved, which parameters mattered, and how robust the winner really is. |
| **Portfolio Analysis** | The full profile of a single candidate — Performance, Holdings, Transactions, Risk Analytics, Robustness, and (where enabled) an investor-facing Profile view. |

Opening a candidate from either dashboard slides in Portfolio Analysis as a third tab, with its own close button, so you never lose your place in the ranking behind it. Portfolio Analysis is covered in full on [Portfolio Analysis](/docs/portfolio-detail).

> [!NOTE] Old links still work
> If you have a bookmark or a shared link to this dashboard from an earlier version of Fintela, it will still take you to the right screen — a handful of old page and tab names were renamed and now redirect automatically.

### Section tabs

A tab bar above the dashboard lets you jump between the three screens:

| Tab | Behavior |
|---|---|
| **Portfolios Dashboard** | Always available — takes you to the candidate ranking. |
| **Optimization Dashboard** | A dropdown with four views: Overview, Robustness, Families, Parameters. Available whenever a study can be identified — from the page you're on, or your most recently created study. It's greyed out while you're ranking **across all studies**, since this per-study analysis needs one study selected. |
| **Portfolio Analysis** | Hidden until you open a specific candidate, then appears with a **Close Portfolio Analysis** button so you can dismiss it and return to the ranking. |

## The filter bar

The same filter bar — **Metric · Study · Top N · Rank by** — appears at the top of both dashboards. Each dashboard remembers its own settings independently, so changing the metric on one doesn't affect the other.

### Metric picker

Label **Metric**. Search for any metric by name, or scroll the list — your study's fitness metric (the one it actually optimized for) is pinned at the top, with every other available metric below a divider. Each option shows a short description, or a note explaining why it's greyed out.

By default, candidates are ranked by **fitness** — the same metric the study was optimizing for.

A metric with no data for the selected study is shown, but disabled, with a caption explaining why:

| Situation | Caption |
|---|---|
| Trade-based metric | **No closed trades, or pending the daily metrics run** |
| Benchmark metric, study has no benchmark | **Needs a benchmark — this study has none** |
| Benchmark metric, benchmark set but not yet computed | **Not computed for this study yet** |
| Custom (fitness-based) metric | **No values for this study yet (computed daily)** |
| Anything else | **No data for this study** |
| Has data, but not for the selected time period | **No data in the selected stage** |

Switching the metric clears whatever candidates you had selected, since the ranking itself is about to change.

### Study picker

Label **Study**. **All studies** is pinned first and switches on cross-study ranking, letting you compare candidates from every study in your workspace at once. It's disabled — with a note explaining why — when:

- you've selected a **fitness** metric (fitness is specific to one study, so it can't rank across studies);
- your workspace has no studies yet.

Studies still in draft don't appear in this list. Switching studies clears your current selection.

On the Optimization Dashboard, picking a different study takes you to that study's own page. Picking **All studies** sends you back to the Portfolios Dashboard, since the per-study view has nothing to show once you're not looking at one study.

### Top N

Label **Top N**. How many candidates to rank and show — 10 by default. There's no upper limit, so you can widen it to see every trial a large study produced.

### Rank by

Label **Rank by**. Choose the time period the ranking — and every chart on the page — is based on:

| Group | Options |
|---|---|
| **Study stages** | **Overall**, **Train**, **Val**, **OOS**, **RLP** — each with a colored dot |
| **Rolling windows** | **MTD**, **1M**, **QTD**, **3M**, **6M**, **YTD**, **1Y**, **3Y**, **5Y** |
| **Custom trailing window** | your own custom range, once you've set one |

**Overall** is always available. The other named stages (Train, Val, OOS, RLP) only appear if your study actually has that period — a study run with no out-of-sample window, for instance, won't offer OOS. Rolling windows need enough history to make sense: 1M needs at least 30 days of results, 3M needs 90, 6M needs 180, 1Y needs 365, 3Y needs 1095, and 5Y needs 1825; the calendar-based windows (MTD, QTD, YTD) have no such requirement. In **All studies** mode, every stage is offered — a study that doesn't have a given stage simply contributes no candidates for it.

Choosing **Custom** opens a small panel where you set **Last** (a number) and a **Unit** (Days, Weeks, Months, Years), then click **Apply**. It builds a trailing window ending on the study's most recent data.

Without an explicit sort direction, the ranking defaults to best-first — ascending for a metric where lower is better, descending otherwise.

### Automatic metric switching

A few combinations don't make sense together, so the dashboard adjusts automatically and lets you know with a brief notification:

| Situation | What happens |
|---|---|
| The metric you had selected has no data for this study | Switches to Sharpe ratio, or the first metric that does have data |
| A fitness metric is active while you switch to a rolling window or a custom range | Switches to a non-fitness metric, since fitness is only meaningful over the study's own periods |
| A fitness metric is active while you switch to **All studies** | Turns off All studies and falls back to your most recent study, since fitness can't be compared across studies |

In each case your selected candidates are cleared, since the ranking underneath them has changed.

## The candidate ranking

Where you land first: the **Portfolios Dashboard**. Candidates are shown as a scrolling list of cards, one per ranked trial — not a plain table — so you can see a sparkline and headline stats for each one at a glance. It sits in a fixed-height panel on the left; the combined equity chart fills the space to the right (on smaller screens they stack instead of sitting side by side).

At the top: a checkbox to select every visible candidate at once, the title **Portfolio Ranking**, a count of how many you've selected, and a **Clear** button. Below that, a line shows what the ranking is currently sorted by, with an arrow you can click to flip the order.

For a single study, a line above the ranking names the **Source strategy**, **Source fitness**, and **Author** the study was built from. This disappears in All-studies mode, since there's no single strategy to name. If the underlying strategy has since been deleted, its name and author are still shown, so you can always trace where a candidate came from.

### Anatomy of a ranking card

| Element | What it shows |
|---|---|
| Rank number | The candidate's position in the current ranking |
| Trial label | **Trial `<n>` · `<study name>`** |
| Value | The ranked metric's value for this candidate |
| Sparkline | A compact preview of the candidate's equity curve |
| **Sharpe** / **Alpha** / **Beta** | Three quick stats for the selected time period (shown as `—` when not available) |
| ★ badge | Marks the top-ranked candidate |
| Colored dot | The candidate's behavioral family, when the study has been analyzed for strategy clustering |
| **Promoted** badge | This trial has already been promoted to a managed portfolio |
| `+{count}` chip | In grouped view, how many similar trials this card represents |
| Checkbox | Adds the candidate to your comparison selection |
| ⋮ menu | Opens actions for this candidate — promote, derive, or open its full dashboard |
| Card body | Click through to the candidate's own Portfolio Analysis page |

> [!IMPORTANT] Trial numbers reset for every study
> Trial 12 in one study has nothing to do with Trial 12 in another — that's why every trial is always labeled with its study name alongside its number. Treat the pairing, not the number alone, as the candidate's identity.

### When the ranking is empty

The message you see explains the specific reason, rather than a generic "no data":

| Situation | Message |
|---|---|
| Generic | **No portfolios to rank for this stage.** |
| Trade-based metric, nothing closed yet | **No closed trades to aggregate for this study, or its trade metrics are still pending the daily metrics run.** |
| Benchmark metric, no study benchmark | **{metric} is measured against a benchmark, and this study has none.** |
| Benchmark metric, not yet computed | **Benchmark metrics have not been computed for this study yet.** |
| Custom metric, not yet computed | **This custom metric has no values for this study yet. Custom metrics are computed daily.** |
| Metric not tracked for this study at all | **No data for {metric} in this study.** |
| Metric tracked, but not for this time period | **No data for this metric in the selected stage. Available in: {stages}.** |

## Comparing selected candidates

Checking cards builds a selection you can compare side by side. Everything in this section lives on the **Portfolios Dashboard** and reacts to that selection.

One behavior is worth knowing up front: **a ranking you haven't touched is selected in full.** The dashboard opens with the whole Top N checked and every curve overlaid. Change the study, metric, time period, sort order, Top N, or custom range, and the selection resets to the new Top N — it doesn't try to carry your old picks into a different ranking. The moment you check or uncheck a card yourself, or use Select All or Clear, your choice is locked in and stays that way until you change one of those filters again. Switching family grouping on or off is the one exception — it just reshapes how the same ranked candidates are displayed, so it never clears a selection you made by hand.

### Combined equity overlay

The chart to the right of the ranking. Its subtitle reminds you to check or uncheck a card to add or remove its curve. Each selected candidate is drawn in the same color as its card, so you can compare performance without leaving the ranking. A **View last** field lets you crop the chart to a recent window (Days / Weeks / Months / Years) without changing your underlying selection.

With nothing checked, it prompts you to check a candidate. If some curves fail to load, a notice tells you how many were skipped, so you know the chart isn't showing everyone you selected.

### Comparison strip

Appears as soon as you check one candidate. Six quick tiles summarize the group, over whatever time window the chart is currently showing:

| Tile | What it tells you |
|---|---|
| **Selected** | How many portfolios you currently have selected |
| **Leader** | The best total return in the selection |
| **Dispersion** | The spread between the best and worst total return — how differently the selected candidates actually behaved |
| **Median Sharpe** | The median Sharpe ratio across the selection |
| **Worst Drawdown** | The deepest drawdown among the selected candidates |
| **Families** | How many distinct behavioral strategy families are represented — open the Strategies tab to explore them |

### Advanced analysis tabs

Below the chart and comparison strip sits an **Advanced analysis** panel with three tabs:

| Tab | Contents |
|---|---|
| **Risk charts** *(default)* | Four risk and volatility charts for your selection |
| **Comparison tables** | Side-by-side metrics, a full pivot table, and parameter tables |
| **Strategies** | The behavioral-family breakdown for the study you're viewing |

With nothing selected, the risk-charts tab prompts you to pick candidates from the ranking. In All-studies mode, the Strategies tab asks you to select a single study first.

### Risk charts

Each of the four charts can toggle between a time series and a histogram view:

| Time series | Histogram | You can adjust |
|---|---|---|
| **Drawdown** — peak-to-trough decline | **Drawdown distribution** | Histogram bin count and whether it shows density |
| **Volatility** — rolling volatility | **Volatility distribution** | A rolling-window size, plus bins and density in histogram view |
| **Rate of Change** — momentum | **Rate of Change distribution** | Same as above |
| **Sharpe** — rolling risk-adjusted return | **Sharpe distribution** | Same as above |

Window sizes default to 14 periods and are just chart settings — they don't change your underlying selection or the ranking.

### Comparison tables

A three-way toggle switches between:

| Mode | What it shows |
|---|---|
| **Metrics** | Every metric, across every time period, for your selected candidates — one column group per candidate |
| **Pivot** | The same data flipped — one row per candidate, one column per metric × time period |
| **Table** | The same pivot layout, but for **every** candidate in the study, not just your selection |

**Metrics** and **Pivot** also show the parameter comparison tables described below; **Table** doesn't, since a column-by-column parameter comparison across an entire study wouldn't be readable.

### The pivot table

Rows are candidates — click a candidate's name to open its own dashboard. Columns are every metric crossed with every time period that actually has data. Click a column heading to sort by it; click again to flip direction.

To help you scan a wide table at a glance, each column is color-coded relative to itself: the strongest roughly 15% of values in a column are tinted green, the weakest roughly 15% are tinted red, and everything in between is left plain. For the two metrics where a lower number is actually better — max drawdown and volatility — the coloring flips accordingly, so green always means "good" regardless of the metric.

### Parameters and risk managers

Two more tables sit beneath the comparison table, in **Metrics** and **Pivot** mode:

| Table | Rows | Columns |
|---|---|---|
| **Parameters** | Each strategy parameter | One column per selected candidate |
| **Risk Manager Configuration** | Each risk manager and its parameters | One column per selected candidate |

The Parameters table shows only the strategy's own parameters — risk-manager settings are broken out separately in the table below it, grouped by which risk manager they belong to, so you can compare parameter choices across candidates that use different risk managers without the two getting mixed up. Both tables show a dash wherever a candidate doesn't have a value for that row.

## Behavioral strategy families

When a study finishes, Fintela can group its trials by how similar their equity curves actually behaved — answering the question "how many genuinely *different* strategies did this search actually find, versus how many are just small variations on the same one?" This grouping powers the colored dot on every ranking card, the **Families** tile in the comparison strip, the Strategies tab, and a set of grouping controls described below.

### Family controls on the ranking

Found in an **Advanced options** panel on the Portfolios Dashboard. It shows a **Concentration risk** warning when your top candidates collapse into too few families, and a running count of how many portfolios you have selected.

| Control | What it does |
|---|---|
| Grouped-view toggle | Switches between showing every trial and showing just one representative per family |
| Representative method (grouped view only) | Choose how the one representative per family is picked: the most typical trial (**Medoid**), the highest fitness, the highest Sharpe, the highest out-of-sample Sharpe, the highest return, or the lowest drawdown |
| **Granularity** | How finely trials are split into families — each level shows a cohesion score so you can judge how cleanly the families actually separate at that setting |
| **Show per family** | Group trials by family and cap how many from each family are shown (1, 2, 3, 5, or all) |

These settings are view preferences for this session only — they reset if you reload the page.

### Concentration warning

Appears only when your top results genuinely cluster together. It tells you how many distinct strategies your top N candidates actually represent, with a warning that ranges from "your top performers collapse into one family" (a real overfitting risk worth investigating) to "your best results are largely redundant." From there you can switch to one-per-family view, jump to the Strategies tab, or open the full study analysis.

## Per-study Optimization Dashboard

This is the deep-dive view for one study, with four tabs: **Overview**, **Robustness**, **Families**, **Parameters**. It uses the same filter bar as the ranking — whatever time period you've picked under **Rank by** is what every chart on this screen is built from.

### Study header and lineage

Shown above every tab on this screen:

- The study's name, its current run status, and a health indicator.
- The study's unique ID, shown beneath its name — click to copy it, handy when referencing a specific study in a support request or with a colleague.
- The **Source strategy** and **Author** the study belongs to. The strategy name links through to it directly, when it still exists — every trial in a study shares the same source strategy.
- Four headline numbers: your active metric's best value, the number of trials run, overall progress, and an overfitting verdict.
- A pipeline panel showing which stage the run is currently in and where its time has gone — see [Study lifecycle](/docs/study-lifecycle).
- Status banners when something needs your attention: a clear failure notice if the study failed outright, a narrower warning if just a secondary analysis (like robustness or clustering) didn't complete, a "still finishing" notice while one is in progress, and a note when a study was stopped early, showing results collected up to that point.

> [!NOTE] Fitness and risk manager aren't linked from the header
> The header names the strategy and its author. The study's [fitness function](/docs/fitness-functions) and [risk manager](/docs/risk-managers) only appear as links inside a failure notice, if one of them is the reason the study didn't complete.

### Study actions and exports

| Action | What it does |
|---|---|
| **Stop** | Stops a running study immediately. You'll be asked to confirm, since trials in progress may be interrupted and this can't be undone. Only available while the study is actually running. |
| **Export snapshot** | Downloads a file with the study's full configuration, run status, health, and objective statistics — useful for record-keeping or sharing a study's setup. |
| **Export best trial** | Downloads the single best trial the study found, using the study's own optimization direction (maximize or minimize). |
| **Export hyperparameters** | Downloads every completed trial in the study — its trial number, the metric value at your currently selected time period, and its strategy and risk-manager parameters — sorted by trial number. Trials that failed or were pruned are excluded. |
| Help icon | Opens Fintela's in-app documentation for studies and the optimization workflow. |

> [!WARNING] Export hyperparameters only works for Train or Validation
> The button is always clickable, but nothing downloads unless **Rank by** is set to Train or Validation. If you're viewing Overall, OOS, RLP, a rolling window, or a custom range, switch to Train or Validation first.

### Overview

The tab you land on first.

- **Study Overview** — the full run configuration: time periods, universe, number of trials, search algorithm, and parameter ranges. Always visible, not collapsible.
- **Failed trials** — only appears if the study actually had failures. Shows how many trials failed and across how many distinct reasons, a count for each reason, and a table you can expand listing every failed trial with its failure reason and parameters.
- **Best trial** — the winning candidate for your selected time period: its objective value, its trial number, and up to six of its key parameters. If the study has been analyzed for strategy families, this also shows how many distinct strategies your top results represent, with a concentration warning if the best trial's family dominates the field. From here you can open the trial, view its full parameters, or jump to the Strategies tab.
- **Robustness & Overfitting** — a quick verdict (Well trained / Borderline / Overfit risk / Uncertain) plus the two key numbers behind it, with a link to the full Robustness tab.
- **Hyperparameter Importances** — expanded by default; explained in the next section.
- A risk-manager health notice, which stays visible whenever it applies: it's worth reading closely, since a risk manager that quietly turned itself off partway through a run can leave you with a study that reports as completed and portfolios that look fine, when in fact your risk controls weren't actually active the whole time.

### Parameter importance

Which parameters actually moved the result, and which of those only helped in training — a warning sign that they were overfit to it rather than genuinely predictive.

- **Method** — choose between two ways of measuring importance, **fANOVA** and **MDI**. Switching between them is instant.
- **Timeframe** — comes from the **Rank by** control in the filter bar above; there's no separate control here.
- **Parameter importance chart** — ranked bars showing each parameter's share of the outcome's variance. Bar color shows the direction of the effect: higher values are better, lower values are better, or (for non-numeric parameters) which specific value performed best. Some rows also show a correlation strength, a cross-check against the other method, and a confidence range. When a time period has few trials, a warning reminds you to interpret the ranking with caution.
- **Overfitting divergence** — flags any parameter whose effect reverses direction between training and validation: important during training but not in validation is a classic sign that the search overfit to that parameter rather than found something genuinely predictive. This needs both a training and a validation period to compare — otherwise it's hidden and the importance chart takes the full width.
- Headline numbers: the most influential parameter, how many parameters actually mattered (out of how many were searched), how many trials were scored, the parameter most responsible for overfitting (if any), how well training and validation agree, and how many parameters flipped direction.

Importances can only be computed for time periods tied to the study's own objective:

| Rank by | Available? |
|---|---|
| Overall, Train, Val, OOS, RLP | Yes |
| Any rolling window, or a custom range | Not supported |

If you pick an unsupported time period, the dashboard explains why rather than showing an empty chart: parameter importances are based on the study's own optimization objective, which is only ever evaluated over the study's own periods — switch to Overall, Train, Val, OOS, or RLP instead.

Two more messages you might see: one explaining that importances simply aren't available yet — the study may have finished before they were computed, still be processing, or have too few completed trials, in which case they'll appear after the next run or backfill; and one for a study that was scored, but had too few varying parameters or completed trials to produce a meaningful ranking.

### Parameters — the parameter-vs-metric plots

The tab for visually exploring how your search behaved:

| Chart | What it shows | You can adjust |
|---|---|---|
| Optimization trajectory | How the objective evolved trial by trial | View each trial's own value, or the best value seen so far |
| Result distribution | A histogram of outcomes across every trial, with mean, standard deviation, and min/max | Bin count (auto by default) |
| Parameter impact | One scatter chart per parameter — its value against the objective, with color showing how strong the result was | — |
| 3D parameter explorer | Any two parameters plus the objective, plotted in three dimensions | Which parameters/metric fill each axis; scatter or connected-surface view |
| Hyperparameter patterns | A parallel-coordinates view connecting each trial's parameter choices to its outcome, for your top N candidates | How many trials to include |

When the study has been analyzed for strategy families, a **Color** switch lets you recolor the parameter scatter, 3D explorer, and parallel chart by behavioral family instead of by metric value — a fast way to see which parameter ranges tend to produce which kind of strategy.

Click any point on these charts to open that trial directly.

The trajectory and distribution charts need only the objective value, so they always render. The other three need recorded parameters — a study run without any (a fixed-parameter run, for instance) shows a simple note instead. Non-numeric parameters can't be placed on the 3D chart's axes and are called out separately when that applies.

### Robustness

Whether your best result reflects real skill, or is simply the luckiest of many trials — the question every optimization search eventually has to answer honestly.

Headline numbers: **PBO** (Probability of Backtest Overfitting — the share of test splits where your best in-sample trial ranks below the out-of-sample median; above 50% is a strong overfitting signal), a **luck threshold** your results are compared against, how many trials were effectively independent, the variance across trial Sharpe ratios, and how many trials had enough data to be scored at all.

Charts: an overfitting-distribution chart, a trial Sharpe distribution against the luck threshold, deflated Sharpe ratios across trials (Sharpe adjusted for the number of trials you ran — the more trials, the more of an edge you need before a result is likely to be real), in-sample vs. out-of-sample rank, how results degrade from training through validation to out-of-sample, equity curves by time window, and a per-trial table of robustness statistics you can click into individual trials from. The busiest of these charts only draw your best trials by deflated Sharpe, and say how many out of the total they're showing.

The overall verdict is one of **Well trained**, **Borderline**, **Overfit risk**, or **Uncertain**. It only appears once the study has finished and has enough data to compute it.

### Families and the trials table

The behavioral-clustering view, in five parts:

1. A headline telling you how many distinct strategies your trials actually represent, with the same **Granularity** control described earlier.
2. A **behavioral map** — each point is a trial, placed by how similar its returns are to other trials and colored by family; point size reflects out-of-sample Sharpe, with the family's representative trial and the study's overall best trial marked separately. Very large studies show a representative sample rather than every trial.
3. **Representative equity per family** — the single most typical trial from each family, so you can see what each distinct strategy actually looks like.
4. **Strategy families** — one card per family, with how many trials it contains, its share of the total, its representative and best trial, and its average return, Sharpe, out-of-sample Sharpe, and return spread.
5. **Trials by family** — every trial, tagged with its family, in a sortable table:

| Column | Notes |
|---|---|
| **Family** | Also filterable |
| **Trial** | The trial number within this study |
| **Return** | |
| **Sharpe** | |
| **OOS Sharpe** | Sorted by this, best first, by default |
| **Max DD** | |
| **Fitness** | Hidden by default — turn it on from the column picker |

Click any row to open that trial. **Export CSV** downloads the full table instantly, since it's already loaded on the page.

If the study hasn't been analyzed for strategy families yet, this tab explains why: the study may have finished before clustering was computed, or it's still processing, and will appear after the next run or backfill.

## Promoting a candidate

A trial is just an output of a study. **Promoting** it turns it into a **managed portfolio** — an independent copy that survives even if you later delete the study, that Fintela keeps updating daily, and that's the only kind of portfolio you can add to a [portfolio group](/docs/portfolio-groups). It's the decision the whole ranking exists to help you make, which is why it's the first action in every candidate's menu.

### Where promote lives

All three ways to promote a candidate are on the **Portfolios Dashboard**:

| Where | How |
|---|---|
| A card's ⋮ menu | **Promote** adds that one trial to your Portfolio Groups. Once promoted, the option shows as **Promoted** and is disabled — there's nothing more to do. |
| The selection bar | Appears once you've deliberately selected two or more candidates. (A single candidate is handled from its own card menu instead, and the automatic whole-ranking selection doesn't trigger it — so you'll never open the dashboard to find a one-click "promote everything" button waiting for you.) |
| Creating a portfolio group | Building a group from unpromoted trials promotes the ones it needs automatically. |

A card's ⋮ menu also offers **Derive / Optimize RMs** — create risk-manager-optimized variants of that candidate — and **Individual Dashboard**, which opens its full Portfolio Analysis page (right-click to open in a new tab, since it's a real link).

### Bulk promotion

The selection bar shows how many candidates you have checked, how many (if any) are already promoted, and a **Promote Selected** button. A progress bar runs while the request is processing.

When it finishes, you'll see how many portfolios were promoted successfully; if any failed, a separate notice tells you how many and why. Promoting a single candidate shows a simple confirmation instead.

### What promotion copies, and why it can fail

Promoting a candidate takes a complete snapshot of everything that makes it what it is: the strategy's code and parameters, the specific parameter values this trial used, its investable universe, its fitness configuration, its risk-manager setup, and the historical data it was built on — plus its trading history (holdings, equity, and orders) up to that point. This happens as a single all-or-nothing step, so you'll never end up with a half-promoted portfolio. What's frozen at promotion time and what keeps updating afterward is covered on [Promoted Portfolios](/docs/promoted-portfolios).

You can promote up to 50 candidates in one batch. Your plan's available managed-portfolio slots are checked for the **whole batch** before anything is promoted — so if you select 30 trials but only have 20 slots left, nothing in that batch goes through, and you'll see why. See [tokens and billing](/docs/tokens-and-billing) for how those slots work.

Two situations are refused outright, and it's worth knowing about them before you select a large batch:

- **Strategies you run outside Fintela's own editor can't be promoted.** Daily automatic updates require a strategy Fintela can re-run itself, so a trial built on an [external strategy](/docs/external-strategies) can't join a portfolio group this way. See [execution modes](/docs/execution-modes).
- **A portfolio-of-portfolios carrying a sector-cap or country-cap risk manager is refused.** Those risk managers rely on per-security sector and country data that a basket of other portfolios doesn't have, so they can't meaningfully apply at that level. Remove the risk manager and try again — every other risk manager works fine on a portfolio-of-portfolios.

> [!TIP] Promoting an already-promoted trial is safe
> If you re-promote a trial that's already been promoted, Fintela simply confirms the existing managed portfolio rather than creating a duplicate. Feel free to include already-promoted trials in a bulk selection without worrying about it — the same two checks above still apply to the rest of the batch.

## Limits and absences

### There is no multi-objective or pareto view

A Fintela study optimizes toward **one** objective, in one direction — maximize or minimize. There's no pareto-front view or multi-objective trade-off chart anywhere in the product. **NSGA-II** appears in the sampler list as a search algorithm option, not as a way to add more objectives — picking it changes how the search explores parameter space, not what you can see afterward. See [sampler selection](/docs/sampler-selection).

The closest things to a trade-off view are the pivot table (every metric against every time period, sortable by any column) and the 3D explorer (any two parameters against the objective) — both are still single-objective views, just flexible ones.

### Scalings are not an optimization concept

"Scaling" in Fintela refers to a scale-in or scale-out event **inside a single trade** — adding to or trimming a position partway through, with its own duration and P&L. It's a detail you'll find on an individual candidate's Transactions tab (see [Portfolio Analysis](/docs/portfolio-detail)), not something this dashboard tracks at the candidate or study level.

### Other things this surface doesn't do

- Family grouping mode, representative method, chart zoom windows, and histogram bin counts on the Portfolios Dashboard are view preferences only — they aren't captured in a shared link and reset if you reload the page.
- Filter memory when switching between tabs resets on a full page reload.
- The Optimization Dashboard has no cross-study mode — choosing **All studies** from it takes you to the Portfolios Dashboard instead.
- Nothing here lets you edit a study directly. To try different parameters, duplicate the study from [Studies](/docs/studies) and run it again.

## Sharing a view with a link

Most of what defines a view here becomes part of the page's link, so you can copy it and send a colleague the exact same ranking:

- Which study (or **All studies**) you're looking at
- The selected metric and time period
- Sort order and Top N
- Which candidates you've selected for comparison
- Any custom time range you've set
- Which tab or sub-view you're on
- Which candidate's Portfolio Analysis panel is open, if any

A few things are visual preferences only, and reset when the page reloads rather than travelling with the link: family grouping mode, chart zoom windows, and histogram settings.

Because the Portfolios Dashboard and the Optimization Dashboard are separate screens, each keeps its own version of these settings — switching between the four Optimization Dashboard tabs (Overview, Robustness, Families, Parameters) remembers each tab's own metric, time period, and selection separately, while which study you're viewing and which candidate's Portfolio Analysis is open stay the same across all of them, matching how you'd expect "the same study, same open portfolio" to behave as you move around.

## Where to go next

- [Portfolios Dashboard](/docs/portfolios-dashboard) — the companion page for the candidate list surface.
- [Portfolio Analysis](/docs/portfolio-detail) — one candidate in full: performance, holdings, transactions, risk, robustness.
- [Analyzing results](/docs/analyzing-results) — how to read a study's output end to end.
- [Promoted Portfolios](/docs/promoted-portfolios) and [Portfolio Groups](/docs/portfolio-groups) — what happens after you promote.
- [Portfolio Manager](/docs/portfolio-manager) — book-level analysis, once you have groups.
- [Metrics reference](/docs/metrics-reference) — what each metric in the pickers and tables means.
- [Developer API](/docs/api-trials-portfolios) — pull these same studies, rankings, and results into your own tools or dashboards.
