---
title: Analyzing results
section: Workflows
sectionOrder: 5
order: 2
published: true
updated: 2026-09-01
summary: How to read a completed study — rank candidates, compare portfolios, and judge whether a result is real.
keywords: results, analysis, trials, ranking, compare, equity curve, overfitting, robustness, promote, pivot table
---

A finished study leaves you with one candidate portfolio — a **trial** — for every parameter combination it tested, and none of it interprets itself. The top of any ranking is, by construction, the luckiest row for whatever metric you happened to sort by, and the metric the search optimized for was measured on the same data every trial was fitted to. This page is the reading order: where your results show up when a study finishes, how to rank and shortlist candidates, which numbers are safe to compare and which quietly aren't, how to use the robustness checks to decide whether a result is real, and what to do with the survivors. The exact controls on each screen are covered on the pages linked from here — this page is about the sequence and the judgment calls.

## When a study is actually finished

A study shows as **Completed** once every trial in its run has finished successfully. Right after that, three more analyses run automatically, always in the same order, and each one powers a different part of this workflow: robustness scoring first, then family clustering, then hyperparameter importance. Normally all three finish within moments of the study completing — but for roughly a quarter of studies, one of them lands a little later, after the study already shows as Completed.

| Analysis | What it gives you | Before it's ready |
|---|---|---|
| Trial results & rankings | every trial's metrics, ready to sort and compare | there's nothing yet to rank |
| Robustness scoring | the study's overfitting score (PBO) and a verdict for every candidate | the **Robustness** tab and every verdict badge sit empty |
| Family clustering | groups of candidates that behave the same way | no family colors, no **Families** tile, no concentration warning, no representative mode |
| Hyperparameter importance | which settings actually drove performance, plus an overfitting check | no **Hyperparameter Importances** panel |

The last three are secondary: if one of them fails, the study still shows as completed (just with a note), and your trial results stay fully usable. The study page tells you which case you're in — **Finishing secondary analysis** while one is still running, and **Secondary analysis incomplete** if one failed outright but everything else is ready to use. See [study lifecycle](/docs/study-lifecycle) for the full picture of a study's stages.

> [!NOTE] Results exist before the study ends
> Trials save as the optimizer runs, so the ranking fills in progressively. You can rank, compare, and even promote candidates from a study that's still running — you're just reading a search that isn't finished yet.

> [!WARNING] A completed study can sit below 100% progress
> Progress is counted against the number of trials you asked for. If your search space was small enough to exhaust early, the study legitimately completes short of that number. Trust the **Completed** status, not the progress bar.

## Where to find your results

There are three ways in, and each drops you at a slightly different starting point.

| How you got there | Where you land |
|---|---|
| **View** on a study's row in the [studies](/docs/studies) list | that study's ranked candidates |
| Clicking a "study completed" notification | that study's own results, opened directly |
| The **Portfolios Dashboard** or **Optimization Dashboard** tabs | wherever you left off last |

Notifications only take you into the analysis screens when there's actually something to look at:

| Notification | Takes you to |
|---|---|
| Study completed, study 80% done, or study stopped | that study's results, directly |
| Study started, or study failed | your [studies](/docs/studies) list — there's nothing to analyze yet |

If you're the one who stopped a study yourself, you won't get a "stopped" notification for it — you already know.

Three screens then divide the work:

| Screen | Question it answers | Page |
|---|---|---|
| **Portfolios Dashboard** | which candidates are best, and how do the best ones differ | [portfolios dashboard](/docs/portfolios-dashboard) |
| **Optimization Dashboard** | what did the search actually find, and can I believe it | [optimization dashboard](/docs/optimization-dashboard) |
| **Portfolio detail** | what did this one candidate do, day by day and trade by trade | [portfolio detail](/docs/portfolio-detail) |

## Rank the candidates

### The default ranking is not a recommendation

The dashboard opens ranked by `fitness`, over the **Overall** period, showing your **Top 10**, best-first. That's a starting position, not a verdict — fitness is the study's own objective, and Overall spans the whole curve, training window included.

The search itself was steered by something narrower still: the optimizer judged every trial on its **training-period** performance alone. Validation, out-of-sample, and overall performance were all calculated too and saved alongside every trial — they just never fed back into which parameter combinations got tried next. Your first move on any new study should be to change the time period you're looking at, not the metric.

### Pick the period before the metric

`Rank by` groups three kinds of window. Ranking by each one asks a different question.

| `Rank by` | What the window is | What ranking by it tells you |
|---|---|---|
| `Overall` | the whole curve, not date-anchored; always available | a summary that includes the data the trial was fitted to |
| `Train` | the study's training window | reproduces the search's own preference order |
| `Val` | the study's validation window | the first honestly held-out read — though picking a winner here means you're now selecting on it too |
| `OOS` | the study's out-of-sample window; offered only when the study covers one | the closest available proxy for how a candidate would behave live |
| `RLP` | real-life performance — the days after your study period through today, for candidates on daily updates | genuine forward performance, not a backtest at all |
| Rolling windows | `MTD`, `1M`, `QTD`, `3M`, `6M`, `YTD`, `1Y`, `3Y`, `5Y`, anchored to today | regime checks — how a candidate behaved in a specific recent stretch |
| `Custom` | a trailing window you choose, ending today | the same, over a window you pick |

Fitness gets calculated for the training, validation, out-of-sample and overall periods automatically for every trial. Once a candidate is enrolled in daily updates, a real-life-performance figure builds up too. That makes one combination especially useful: **rank by `fitness` at `OOS`**. It re-scores every trial with the study's own objective, on data the search never got to see.

> [!TIP] Read the same ranking twice
> Rank by `Train`, then by `OOS`, and watch what moves. A candidate that holds its rank across both is a different animal from one that only wins in training — and the **In-sample vs out-of-sample rank** chart on the study's Robustness tab plots that exact reversal for every trial at once.

### Top N is a cut, not a filter

`Top N` is simply how many rows you pull into the ranking. It has no upper cap on this screen, and it's the **only** row control the Portfolios Dashboard offers — there's no minimum-Sharpe box, no maximum-drawdown box, no "exclude candidates with fewer than N trades."

Real filters live on **Rank & Build**, the cross-study screener documented under [portfolio groups](/docs/portfolio-groups). On top of the same ranking, it adds:

| Control | What it constrains |
|---|---|
| `Metric threshold` | one metric with a condition — greater than, less than, or between — and the bounds you set |
| `Risk Manager` | trials using a specific kind of risk manager: `Built-in`, `Internal`, `External`, or `Declarative` |
| `Studies` | an explicit set of studies rather than all of them or just one |
| `Asset Group` | the asset groups the candidate studies were built on |
| `Universe` | tickers — narrows to studies whose tradable universe includes any of the ones you list |

A live counter shows how many candidates match your current filters, so you can see a threshold bite before you build anything.

### Ranking across studies

Setting `Study` to `All studies` ranks every non-draft study's trials together, with two consequences worth knowing:

- **Fitness metrics can't rank across studies.** The option is disabled, with a note that fitness is study-specific. Two studies with different objectives produce fitness numbers that aren't on the same scale, so ranking by fitness only makes sense within one study.
- **Everything tied to a single study steps aside.** Study-specific context — the parameter details, the family groupings, the Strategies tab, and the Optimization Dashboard tab — all go quiet, because there's no single study left to attribute results to.

### Collapse duplicates before you compare

A parameter sweep doesn't produce N distinct strategies — it produces N parameter combinations, many of which trade almost identically. Fintela groups trials by how similar their day-to-day returns actually are, and that grouping is what turns a top-10 list into a shortlist actually worth comparing.

| Symptom | Where it shows | What it means |
|---|---|---|
| Every card carries the same colored family dot | ranking cards | your top 10 is one strategy in ten costumes |
| A concentration-risk note under **Advanced options** | section header | your requested Top N collapsed into too few distinct behaviors |
| **Your top performers collapse into one family — concentration / overfitting risk.** | diversity banner | at least three ranked candidates all in one family |
| **Your best results are largely redundant — consider diversifying.** | diversity banner | four or more ranked, with too few distinct families among them |
| The **Families** tile shows fewer families than candidates you've checked | comparison strip | the same, for your current selection |

Turning on **Show 1 per family** rewrites the list as one card per family. `Medoid` (the default) picks the most typical trial from each family; the other options instead keep each family's best on fitness, Sharpe, OOS Sharpe, return, or lowest drawdown. Use `Best OOS Sharpe` when your goal is to keep one representative per distinct behavior.

> [!CAUTION] Family grouping isn't part of a shared link
> Representative mode, the grouping method, and how finely candidates are split into families are just settings on your screen. A link you share restores the ranking and your selection, but not this grouping — whoever opens it will need to turn it back on. The Optimization Dashboard's **Families** tab does remember its grouping setting when shared.

### An empty ranking is a diagnosis

The empty state names the cause instead of leaving you guessing. The full message list is on the [portfolios dashboard](/docs/portfolios-dashboard) page; the short version:

| Cause | Fix |
|---|---|
| You picked a trade-level metric but the study has no closed trades | wait for the study to close trades, or for the next daily metrics run to catch up |
| You picked a metric that needs a benchmark, on a study with none set | pick a metric that doesn't need one, or set a benchmark and re-run |
| You picked a custom metric your organization publishes, but it has no values yet | custom metrics are scored once a day — check back after the next run |
| The metric exists, but not for this period | the message lists which periods it's actually available in |

## Compare a shortlist

Checking candidates builds the shortlist every comparison view reads from. One rule governs it: **a ranking you haven't touched is auto-selected in full.** The screen opens with your entire Top N checked, and changing anything about the ranking itself — the study, the metric, the period, the order, `Top N`, or a custom date range — resets the selection to match the new list. The moment you check or uncheck a card, select all, or press `Clear`, your selection stays put for as long as those settings don't change. Turning family grouping on or off doesn't count as a ranking change, so it won't reset your picks.

Once you've got a shortlist checked, pick the view that answers the question you actually have:

| Question | Where to look |
|---|---|
| Did these candidates behave differently at all? | the combined equity overlay, plus the `Dispersion` tile in the `Comparison` strip |
| Which is best on metric X in period Y? | `Comparison tables` → `Pivot` (every metric by every period, sortable by any column) |
| How does one candidate score across *all* periods? | `Comparison tables` → `Metrics` (the same table, flipped) |
| What separates them, parameter by parameter? | the `Parameters` table |
| Did a risk manager do the work rather than the strategy? | the `Risk Manager Configuration` table, and `Portfolio lineage` on a candidate's Performance tab |
| Are they really the same strategy in disguise? | family dots, the `Families` tile, and the `Strategies` tab |
| How rough was the ride? | `Risk charts` — drawdown, volatility, rate of change and Sharpe, as time series or histograms |

Two things worth knowing before you read a comparison table: the color-coding in the pivot table is scaled per column, from that column's lowest to highest value among your selection — and it's flipped for exactly two metrics, `max_drawdown` and `volatility`, so a lower number still shows green. Every other column shades as though higher were better, `tracking_error` included, so glance at the metric name before you trust the color. And a candidate's full context — the parameters that produced it, its trades, its holdings — is one click away on [portfolio detail](/docs/portfolio-detail); the comparison tables are for spotting differences, not for depth.

## Which numbers to trust

Every metric here comes from one shared catalog with a fixed unit and direction — see [metrics reference](/docs/metrics-reference) for what each one means. What follows is just the list of ways a correct number gets misread.

### Numbers that don't survive a change of period

Three metrics grow simply with the length of the window they're measured over, so comparing them across periods of different length is misleading:

| Metric | Why comparing periods misleads |
|---|---|
| `total_return` | a three-year training window will out-return a six-month out-of-sample window on almost any strategy, just by having more time to compound |
| `max_drawdown_duration` | counted in trading days spent below the previous peak — a longer window simply has more days to offer |
| `recovery_factor` | total return divided by max drawdown, so it inherits the same dependence on period length |

Compare these across candidates *within* one period, and use `compound_annual_growth_rate` (CAGR) when you need to compare across periods of unequal length. The signal badges on a candidate's Performance tab already adjust for this when comparing periods — the raw comparison tables do not.

`recovery_factor` has a second quirk worth knowing: it's calculated without taking an absolute value, so a losing candidate shows a *negative* recovery factor rather than a small positive one. That's deliberate — recovery factor is higher-is-better, and a −40% run should never tie with a +40% run that had the same drawdown — but it means you can't read the column as a plain magnitude. A candidate with zero drawdown shows no value at all, rather than an infinite one.

### Numbers that don't survive a change of study

| Number | What breaks |
|---|---|
| `fitness` | it's the study's own objective — two studies' fitness values simply aren't comparable, which is why ranking `All studies` together disables fitness metrics |
| A custom metric your organization publishes | scored only for training, validation and out-of-sample periods — never for real-life performance |
| A bookmarked or shared link to a specific metric | if new metrics get added to the catalog over time, an old link's metric can drift, since it references a position in an alphabetical list rather than a name. If a shared link ever looks like it's showing the wrong metric, just reselect it |
| Trial numbers | scoped to their own study — two different studies can both have a "Trial 12," which is why every label reads `Trial N · study name` rather than just the number |

### Numbers that don't mean what the chart beside them means

- **The rolling Sharpe chart is not the `sharpe_ratio` metric.** The chart plots windowed rate-of-change over intra-window volatility, unannualized and with no risk-free rate subtracted. A chart reading 0.4 next to a metric reading 1.8 isn't a contradiction — they're measuring different things. The same caveat applies to every rolling curve; see [visualizations](/docs/visualizations).
- **`volatility`, `var_95` and `cvar_95` are already annualized.** Never annualize them again yourself.
- **`win_rate` counts days; `trade_win_rate` counts closed round-trip trades.** The same split separates `profit_factor` from `trade_profit_factor`. They won't agree with each other, and they're not meant to.
- **The `P&L` column on the Transactions tab is a dollar figure, formatted with a plus or minus sign the way a percentage would be.** Read it as money, not as a percentage of anything.

### Direction traps

`beta`, `correlation` and `r_squared` are deliberately labeled "informational" rather than better-or-worse — a high R² is the goal for an index replicator and a red flag for a market-neutral book. None of the three can be an optimization target, and no screen will ever call one of them "better."

One direction trap is worth calling out on its own, because it can quietly change what a headline number tells you:

> [!WARNING] "Best trial" follows the *study's* direction, not the metric's
> The **Best trial** card and the evolution chart's best marker pick a winner using the study's own optimization goal (maximize or minimize), not whatever metric you have selected in the filter bar. Point the filter bar at a lower-is-better metric like `max_drawdown` on a study set to maximize, and the card will crown the candidate with the *deepest* drawdown. The ranking cards on the Portfolios Dashboard are unaffected — they always sort by the selected metric's own direction.

## Judging whether a result is real

Two verdicts exist, and they're built differently. The per-candidate verdict is fixed once, when the study finishes. The study-level verdict is recalculated fresh each time you view it, from the study's overfitting score and the spread of per-trial verdicts. Neither is available until robustness scoring has finished running.

| Verdict | Applies to | Where you see it |
|---|---|---|
| Study-level | the whole search | the study's **Robustness** tab, the **Overview** tab's summary card, and the header's Overfit indicator |
| Per-candidate | one trial | that candidate's **Robustness** tab, and the verdict chip beside `Metrics Comparison` on its Performance tab |

### The per-candidate verdict

Four possible outcomes, checked in order — the first match wins.

| Order | Verdict | When it applies |
|---|---|---|
| 1 | **Insufficient Data** | fewer than 30 out-of-sample daily returns to work with, or the underlying statistics come out undefined |
| 2 | **Overfit Risk** | performance degrades too sharply from training to out-of-sample, or the study's overall overfitting probability (PBO) is above 50%, or the deflated Sharpe ratio is below 0.90 |
| 3 | **Borderline** | the deflated Sharpe ratio is below 0.95 |
| 4 | **Well Trained** | none of the above triggered |

The exact wording can differ slightly by screen — a candidate's own Robustness tab and the study's Robustness tab phrase the same underlying verdict a little differently — but they always mean the same thing.

### The study-level verdict

Built fresh each time you look, from the study's overfitting probability (PBO) and the spread of its per-trial verdicts, in this order:

| Order | Result | When it applies |
|---|---|---|
| 1 | Uncertain | there's no robustness data for the study yet |
| 2 | Overfit Risk | the study's PBO is above 50% — this overrides everything else, no matter what the individual trials say |
| 3 | Uncertain | no trial carries a verdict yet |
| 4 | Well Trained | at least half the scored trials are Well Trained |
| 5 | Borderline | Well Trained and Borderline trials together reach half |
| 6 | Overfit Risk | more than half the trials are Overfit Risk |
| 7 | Uncertain | none of the above |

A high PBO overriding otherwise-healthy individual verdicts is the case worth remembering: it means your *selection process* — testing many parameter combinations and picking the best — overfits the data, even where any single candidate's own out-of-sample record looks fine on its own.

### What has to be true before a verdict exists

| Figure | Requirement |
|---|---|
| Any confident per-candidate verdict | at least 30 out-of-sample daily returns |
| Study PBO | at least 2 meaningfully different trials, sharing at least 40 days of common history |
| Any robustness data at all | the study needs to have finished robustness scoring |

When scores simply aren't ready yet, the Robustness tab says so directly rather than showing a blank screen or an error — and it's careful to tell that apart from an actual loading problem, so a hiccup never gets mistaken for "this study just isn't scored."

### Reading the screens, in order

1. **Study Robustness tab.** Start with `PBO` and `Luck threshold (SR₀)`. A PBO above 50% is a stop sign for the whole search. Then **Trial Sharpe distribution vs luck**: trials at or below SR₀ have an in-sample Sharpe indistinguishable from chance. Then **In-sample vs out-of-sample rank** — points on the diagonal hold up, a downward spread means candidates are reshuffling out of sample.
2. **Per-candidate Robustness tab**, for each shortlisted candidate. The `Deflated Sharpe (OOS)` gauge breaks at exactly the verdict cutoffs (red below 90%, amber 90–95%, green at 95% and above), and `Skill vs. luck` puts that candidate's OOS Sharpe next to SR₀ on one scale. Read `Train → OOS degradation` alongside `Val → OOS degradation`: training performance is inflated by the search's own selection, so only the second one isolates genuine decay.
3. **Hyperparameter Importances**, on the study's Overview tab. The **Overfitting divergence** panel is the one to read here: it flags parameters that mattered in training but not in validation — a sign your search learned something that doesn't hold up. A parameter flagged as flipping direction out of sample is one your search learned *backwards*.
4. **Families**, last. If your whole shortlist sits in one family, everything above described one strategy several times over, and your effective sample size is smaller than the trial count suggests.

> [!NOTE] The per-metric signal badges are not the verdict
> `High Risk`, `Controlled Risk`, `Train≫OOS`, `Val Weak`, `OOS Strong`, `Overall Best`, `Weak` and `Stable` on a candidate's Performance tab are simple on-screen comparisons between periods. They're useful diagnostics, but the statistically grounded answer is always the Robustness tab's verdict.

### The shape of a result worth keeping

| Signal | What it tells you |
|---|---|
| Verdict `Well Trained`, study PBO at or below 50% | the out-of-sample edge survives the selection-bias correction |
| OOS Sharpe clears SR₀ | the result beats what the luckiest of this many trials would reach with zero real skill |
| `Val → OOS degradation` not significant | the decay isn't the kind selection bias would explain |
| `OOS autocorrelation` below 0.2 in magnitude | the annualized Sharpe — and these tests — aren't distorted by serial correlation |
| The candidate's family holds a minority of trials | you found a genuine behavior, not a lucky corner of the parameter grid |
| Its rank holds when you switch `Rank by` from `Train` to `OOS` | the ordering isn't an artifact of the fitting window |

Failing several of these doesn't make a candidate worthless — it makes it a hypothesis rather than a proven result. Failing them while carrying the best `fitness` in the study is the classic shape of an overfitted winner.

## Promote or discard

### What promotion actually is

Promotion turns a trial into a **managed portfolio**: a permanent, independent copy that survives on its own, separate from the study that produced it. It captures a full snapshot at that moment — the strategy and its parameters, the runnable universe, the fitness settings, the risk-manager configuration, and the historical starting point — along with the trial's holdings, equity history and trade record. It survives if you later delete the source study, and it's the only kind of object a [portfolio group](/docs/portfolio-groups) can hold. See [promoted portfolios](/docs/promoted-portfolios) for exactly what freezes at promotion and what keeps updating afterward.

Promoting the same trial twice doesn't create a duplicate — you'll just get back the copy you already made, which is why the **Promoted** badge simply stays on rather than toggling. When you promote several candidates at once, each one succeeds or fails on its own, so a mixed outcome is normal — check both halves of the result rather than assuming an all-or-nothing outcome. Your promotion allowance is reserved for the whole batch up front, so a batch bigger than what you have remaining promotes nothing at all — trim it and try again.

### Before you promote

| Check | Why it matters |
|---|---|
| Robustness scoring has finished | promoting before a verdict exists means promoting blind, with no read on whether the result is real |
| You've looked at `OOS` or `RLP`, not just `Overall` | otherwise you're promoting the training window's winner, not a genuinely tested result |
| The candidate isn't one of several near-identical siblings | promote the family's representative, not five copies of the same behavior |
| Its parameters aren't sitting at the very edge of the range you searched | a best result exactly at a boundary usually means the boundary was the limiting factor, not that you found a true optimum — check the `Parameter Impact` chart |
| The risk-manager health notice on the study's Overview tab, and the risk-manager activity log on the candidate's Risk Analytics tab, are both clean | a risk manager that quietly stopped working mid-run leaves a completed study full of portfolios that look fine but weren't actually protected, and nothing else will flag it |

### What promotion refuses

| It won't let you promote... | Because... |
|---|---|
| a strategy running in External mode | managed daily updates only support strategies that run inside Fintela, since a copy of code running on your own systems can't be kept extending automatically — see [execution modes](/docs/execution-modes) |
| a meta-portfolio using a sector-cap or country-cap risk manager | those act on per-holding sector and country data that a portfolio group's combined view doesn't have |
| a trial outside your organization, or one whose study has been deleted | there's nothing left to copy |
| a batch of more than 50 candidates, or an empty selection | a hard limit on how many you can promote at once — duplicate picks are collapsed before that count is checked |

These checks apply even to a candidate you already promoted once, so if it would now be rejected under a rule that didn't exist when you first promoted it, re-promoting it is blocked rather than just handing you back the old copy.

### Discarding

There's no "discard this trial" button anywhere in the interface, and that's deliberate rather than missing.

| What you might want | What actually exists |
|---|---|
| Delete one bad trial | there's no such action available in this workflow |
| Get a trial out of your way | uncheck it, or lower `Top N` — both just change what you're looking at, not what exists |
| Throw away a whole failed search | delete the study. It disappears from your list right away, and everything under it — its portfolios, then its trials, then the study itself — is permanently cleaned up shortly after |
| Keep the good result and drop the study | promote it first. A promoted portfolio is an independent copy and survives the study being deleted |

The honest way to discard a candidate is simply not to promote it: an unpromoted trial costs you nothing, uses none of your quota, and disappears along with its study. Deleting a study is not a recycle bin, though — there's no waiting period, no restore option, and no undo.

## What this page won't tell you

- **There's no pareto front or multi-objective view.** A study optimizes exactly one objective, in one direction. You can choose `NSGA-II` as your sampler (see [sampler selection](/docs/sampler-selection)) — that changes the search algorithm exploring parameter combinations, not the number of objectives you're optimizing or the screens available to you.
- **Nothing on this page refreshes itself.** There's no auto-refresh and no live updates anywhere in this workflow. Numbers update when you navigate to the page or reload it.
- **Hyperparameter importance isn't available for rolling or custom windows.** It measures which parameters drove the study's own objective, and that objective is only defined over the study's own periods — `Overall`, `Train`, `Val`, `OOS`, or `RLP`.
- **Scaling isn't a study-level concept.** Scaling in or out of a position happens within a single trade, and you'll find it on a candidate's Transactions tab. There's no study-wide view of scaling activity.
- **`Export hyperparameters` only produces a file for `Train` or `Validation`.** The button stays clickable regardless — with any other period selected, clicking it simply does nothing.
- **Rolling-window figures can be missing on older studies.** The rolling windows were added at a point in time; a study run before that only has values for the named periods, and ranking by a rolling window on one of them will come up empty.

## Where to go next

- [portfolios dashboard](/docs/portfolios-dashboard) — every control on the ranking screen, in full.
- [optimization dashboard](/docs/optimization-dashboard) — the study-level views, and how to promote from them.
- [portfolio detail](/docs/portfolio-detail) — one candidate's tabs, including its robustness statistics.
- [metrics reference](/docs/metrics-reference) — every metric's definition, unit, direction and formula.
- [visualizations](/docs/visualizations) — what each chart plots and how to read it.
- [study lifecycle](/docs/study-lifecycle) — stages, statuses, stopping, resuming and deletion.
- [promoted portfolios](/docs/promoted-portfolios) and [portfolio groups](/docs/portfolio-groups) — where a promoted candidate goes next.
- [portfolio manager](/docs/portfolio-manager) — book-level analysis, once you have groups.
- [api trials and portfolios](/docs/api-trials-portfolios) — pull the same rankings, trials and results into your own systems or dashboards.
