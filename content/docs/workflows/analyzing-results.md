---
title: Analyzing results
section: Workflows
sectionOrder: 5
order: 2
published: true
updated: 2026-08-20
summary: Read a completed study: rank candidates, compare portfolios, and judge whether a result is real.
keywords: results, analysis, trials, ranking, compare, equity curve, overfitting, robustness, promote, pivot table
---

A finished study leaves one candidate portfolio — a **trial** — for every parameter set it evaluated, and none of it interprets itself. The top of any ranking is by construction the luckiest row for whichever metric you happened to sort by, and the metric the search optimized was measured on data every trial was fitted to. This page is the reading order: where results surface when a run ends, how to rank and shortlist candidates, which numbers survive being compared and which quietly do not, how to use the robustness surfaces to decide whether a result is real, and what to do with the survivors. The mechanics of each screen live on the pages linked from here; this page is about the sequence and the judgement.

## When a study is actually finished

A study reads **Completed** once every task of its run is terminal and the `optimize` stage succeeded. Three follow-up analyses run after `optimize`, in this order, and each one powers a different part of this workflow. Normally all three finish inside the same task, before the study turns Completed — but roughly a quarter of studies get at least one of them out of band, *after* the study already reads Completed.

```text
queued → provisioning → data_loading → strategy → fitness → preflight → optimize
                                                                            │
        ┌───────────────────────────────────────────────────────────────────┘
        ▼
   robustness   ──►  Robustness tab · per-candidate verdicts · PBO, DSR, SR₀
        │
        ▼
    families    ──►  Families tab · family dots · concentration check
        │
        ▼
  importances   ──►  Hyperparameter Importances · overfitting-divergence panel
```

| Stage | What it produces | Until it lands |
|---|---|---|
| `optimize` | every trial, its metrics at every stage, the rankings | nothing to rank |
| `robustness` | study PBO and the per-candidate overfitting verdicts | the **Robustness** tab and every verdict chip are empty |
| `families` | the behavioural clustering artifact | no family dots, no **Families** tile, no concentration warning, no representative mode |
| `importances` | the fANOVA / MDI artifact | no **Hyperparameter Importances**, no overfitting-divergence panel |

The last three are **secondary**: a failure there produces a completed-with-warnings verdict, not a failed study, and the trial results stay usable. The study page says which case you are in — **Finishing secondary analysis** (*"The optimization is complete. {{stages}} are still being computed and will appear here automatically."*) while one is still running, and **Secondary analysis incomplete** (*"This study completed and its results are usable. {{count}} follow-up analyses could not be produced."*) when one failed. See [study lifecycle](/docs/study-lifecycle) for the full stage contract.

> [!NOTE] Results exist before the study ends
> Trials are persisted in batches while the optimizer runs, so the ranking fills in progressively. You can rank, compare and even promote from a study that is still `RUNNING` — you are simply reading an incomplete search.

> [!WARNING] A Completed study can sit below 100 % progress
> Progress counts trials in a terminal state against `n_trials`. A finite parameter grid that was exhausted early legitimately completes short. Completion is signalled by **status**, never by progress reaching 1.0.

## Where the results open

Three doors lead to the same data, and which one you take decides which question you land on.

| Entry point | Goes to | Lands on |
|---|---|---|
| **View** in the [studies](/docs/studies) registry row menu | `/analysis/portfolios?studyId=<id>` | the ranked candidates |
| The notification `Study "<name>" completed` | `/analysis/portfolios/study/<id>` | the study's own analysis |
| The **Portfolios Dashboard** / **Optimization Dashboard** section tabs | either route | wherever you were last |

The notification bell routes by kind, and the split is deliberate — an alert only deep-links to the analysis workspace when there are trials on disk to look at.

| Notification kind | Opens |
|---|---|
| `study_completed`, `study_80_percent`, `study_stopped` | `/analysis/portfolios/study/<id>` |
| `study_running`, `study_failed` | `/studies` |

A `study_stopped` notification is suppressed when the person who requested the stop is the study's own creator.

Three screens then divide the work:

| Screen | Question it answers | Page |
|---|---|---|
| **Portfolios Dashboard** | which candidates are best, and how do the best ones differ | [portfolios dashboard](/docs/portfolios-dashboard) |
| **Optimization Dashboard** | what did the search actually find, and can I believe it | [optimization dashboard](/docs/optimization-dashboard) |
| **Portfolio Analysis** | what did this one candidate do, day by day and trade by trade | [portfolio detail](/docs/portfolio-detail) |

## Rank the candidates

### The landing ranking is not a recommendation

The dashboard opens on the metric named `fitness`, the stage `overall`, `Top N` of `10`, and automatic order (best-first for the metric's own direction). That is a starting position, not a verdict — `fitness` is the study's own objective and `overall` spans the whole curve, training window included.

The search itself was steered by something narrower still: the optimizer settles every trial with its **train** fitness, so every trial you are looking at was selected on training data alone. The validation, out-of-sample and overall fitness values were all computed and persisted alongside it, and none of them was ever fed back to the sampler. Your first move on any new study is therefore to change the period, not the metric.

### Pick the period before the metric

`Rank by` groups three kinds of window. Ranking by each one asks a different question.

| `Rank by` | What the window is | What ranking by it tells you |
|---|---|---|
| `Overall` | the whole curve, not date-anchored; always offered | a summary that includes the data the trial was fitted to |
| `Train` | the study's configured training window | reproduces the search's own preference order |
| `Val` | the configured validation window | the first held-out read — but choosing a winner here means you are now selecting on it |
| `OOS` | the configured out-of-sample window; offered only when the study's served periods include it | the closest available proxy for live behaviour |
| `RLP` | the day after the last configured period through the last equity bar; present only when equity genuinely advanced past the last configured period | real forward performance, for studies enrolled in daily updates |
| Rolling windows | `MTD`, `1M`, `QTD`, `3M`, `6M`, `YTD`, `1Y`, `3Y`, `5Y`, anchored to the curve's last equity date | regime checks — how a candidate behaved in a specific recent stretch |
| `Custom` | a trailing window ending at the study's last equity date | the same, over a window you choose |

The optimizer persists `fitness` at `train`, `validation`, `out_of_sample` and `overall` — a `real_life_performance` row is added later, by the portfolio updater, only for portfolios on daily updates. That makes one combination especially useful: **rank by `fitness` at `OOS`**. It re-scores every trial with the study's own objective, on data the search never saw.

> [!TIP] Read the same ranking twice
> Rank by `Train`, then by `OOS`, and watch what moves. A candidate that holds its rank across both is a different animal from one that only wins in training — and the **In-sample vs out-of-sample rank** chart on the study's Robustness tab plots exactly that reversal for every trial at once.

### Top N is a cut, not a filter

`Top N` is the ranking depth requested from the server. It has no upper clamp on this screen, and it is the **only** row control the Portfolios Dashboard offers — there is no minimum-Sharpe box, no maximum-drawdown box, no "exclude candidates with fewer than N trades".

Hard filters live on **Rank & Build** (`/analysis/portfolio-groups/rank`), the cross-study screener documented under [portfolio groups](/docs/portfolio-groups). It adds, above the same ranking:

| Control | What it constrains |
|---|---|
| `Metric threshold` | one metric with an operator — `>`, `<` or `Between` — and `Min` / `Max` bounds |
| `Risk Manager` | trials carrying a risk manager of a given kind: `Built-in`, `Internal (Python)`, `External (HTTP)` or `Declarative` |
| `Studies` | an explicit multi-study scope rather than all-or-one |
| `Asset Group` | the asset groups the candidate studies were built on |
| `Universe` | tickers — *"Narrows to studies whose runnable universe includes any of these tickers."* |

A live candidate counter reports **{{count}} candidates** matching the current filters, so you can see a threshold bite before you build anything.

### Ranking across studies

Setting `Study` to `All studies` ranks every non-draft study's trials together. Two consequences are structural rather than incidental:

- **Fitness metrics cannot rank across studies.** The option is disabled with the caption `Not available with fitness metrics (fitness is study-specific)`. Two studies with different objectives produce fitness numbers that are not on the same scale.
- **Everything study-scoped stands down.** The provenance strip, the family features, the Strategies tab and the `Optimization Dashboard` tab all go quiet, because there is no single study to attribute results to.

### Collapse duplicates before you compare

A parameter sweep does not produce N distinct strategies; it produces N parameter sets, many of which trade almost identically. The clustering artifact groups trials by the pairwise correlation of their full-curve daily returns, and that grouping is what turns a top-10 list into a shortlist worth comparing.

| Symptom | Where it shows | What it means |
|---|---|---|
| Every card carries the same coloured family dot | ranking cards | your top 10 is one strategy in ten costumes |
| `Concentration risk` chip on **Advanced options** | section header | the requested top-N collapsed into too few families |
| **Your top performers collapse into one family — concentration / overfitting risk.** | diversity banner | at least three ranked candidates, all in one family |
| **Your best results are largely redundant — consider diversifying.** | diversity banner | at least four ranked, and distinct families at most `ceil(n / 4)` |
| `Families` tile shows fewer families than checked candidates | comparison strip | the same, for your current selection |

Turning on representative mode (`Show 1 per family`) rewrites the list as one card per family. `Medoid` is the default and picks the most typical trial; the other five methods pick the family's best on fitness, Sharpe, OOS Sharpe, return, or lowest drawdown. Use `Best OOS Sharpe` when the point of the exercise is to keep one survivor per behaviour.

> [!CAUTION] Family grouping is not in the URL
> Representative mode, the method and the granularity *k* are local component state on the Portfolios Dashboard. A shared link restores the ranking and the selection, not the grouping. The Optimization Dashboard's **Families** tab does persist its granularity, as `?clusters_k=`.

### An empty ranking is a diagnosis

The empty state names the cause instead of shrugging. The full message list is on the [portfolios dashboard](/docs/portfolios-dashboard) page; the short version:

| Cause | Fix |
|---|---|
| A trade-category metric with nothing stored | the study has no closed trades, or the four trade aggregates are still pending the daily metrics run |
| A benchmark metric on a study with no benchmark | pick a metric that does not need a baseline, or set a benchmark and re-run |
| A promoted custom metric with no values | custom metrics are scored daily — wait for the next run |
| The metric exists, but not in this stage | the message lists the stages that do have it: `Available in: {{stages}}.` |

## Compare a shortlist

Checking cards builds the selection that every comparison surface reads. One rule governs it: **a ranking you have not curated is auto-selected whole.** The screen opens with the entire top-N checked, and any change to the ranking's identity — study, metric, stage, order, `Top N`, custom frames — re-seeds it from the new rows. The moment you toggle a card, use select-all, or press `Clear`, the selection is pinned for as long as those filters stand. Family grouping deliberately does not count as a ranking change.

Once a shortlist is checked, pick the surface that answers the question you actually have:

| Question | Surface |
|---|---|
| Did these candidates behave differently at all? | the combined equity overlay, plus the `Dispersion` tile in the `Comparison` strip |
| Which is best on metric X in period Y? | `Comparison tables` → `Pivot` (every metric × every stage, sortable by any column) |
| How does one candidate score across *all* stages? | `Comparison tables` → `Metrics` (the pivot transposed) |
| What separates them, parameter by parameter? | the `Parameters` table |
| Did a risk manager do the work rather than the strategy? | the `Risk Manager Configuration` table, and `Portfolio lineage` on a candidate's Performance tab |
| Are they the same strategy in disguise? | family dots, the `Families` tile, and the `Strategies` tab |
| How ugly did the ride get? | `Risk charts` — drawdown, volatility, rate of change and Sharpe, as time series or histograms |

Two details worth knowing before you read a comparison table: the pivot's heat is computed **per column** over that column's own min–max, and it is inverted for exactly two metrics — `max_drawdown` and `volatility`. Every other column is shaded as though higher were better, `tracking_error` included. And a candidate's whole-study context — the parameters that produced it, its trades, its holdings — is one click away on [portfolio detail](/docs/portfolio-detail); the comparison tables are for the diff, not the depth.

## Which numbers to trust

Every metric here comes from one catalog with a fixed unit and direction — see [metrics reference](/docs/metrics-reference) for the definitions. What follows is only the set of ways a correct number is read wrongly.

### Numbers that do not survive a change of period

Three metrics grow with the length of the window they are measured over, and the catalog flags them `requires_normalization`.

| Metric | Why comparing stages misleads |
|---|---|
| `total_return` | a three-year training window will out-return a six-month out-of-sample window on almost any strategy |
| `max_drawdown_duration` | counted in **trading days below the previous peak**; a longer window has more of them to offer |
| `recovery_factor` | `total_return / max_drawdown`, so it inherits the same period dependence |

Compare these across candidates *within* one stage, and use `compound_annual_growth_rate` when you need to compare across stages of unequal length. The signal badges on a candidate's Performance tab already time-normalise exactly these three before they compare stages — the comparison tables do not.

`recovery_factor` carries a second trap: it is computed **without** an absolute value, so a losing candidate reports a negative recovery factor rather than a small positive one. That is deliberate — the metric is higher-is-better, and a −40 % run must not tie with a +40 % run that had the same drawdown — but it means the column cannot be read as a magnitude. A zero drawdown yields no value at all rather than infinity.

### Numbers that do not survive a change of study

| Number | What breaks |
|---|---|
| `fitness` | it is the study's own objective. Two studies' fitness values are not comparable, which is why `All studies` disables while a fitness metric is selected |
| A promoted custom metric | scoped to one organization and computed only at `train`, `validation` and `out_of_sample` — never at `real_life_performance` |
| `?metric=` in a URL | a 1-based position in an alphabetically sorted list, not a stable key. A link copied from a screenshot can point at a different metric after the catalog changes. The API's `metric_name` is the durable reference |
| Trial numbers | scoped to a study and colliding across studies, which is why every label reads `Trial N · <study name>` |

### Numbers that do not mean what the chart beside them means

- **The rolling Sharpe chart is not the `sharpe_ratio` metric.** The chart plots window rate-of-change over intra-window volatility, unannualized and with no risk-free term. A chart reading 0.4 next to a metric reading 1.8 is not a contradiction. The same applies to every rolling curve — see [visualizations](/docs/visualizations).
- **Percent metrics are 0–1 fractions on the wire**, rendered ×100. Read an API response accordingly.
- **`volatility`, `var_95` and `cvar_95` are already annualized server-side.** Never re-annualize them.
- **`win_rate` counts days; `trade_win_rate` counts closed round-trips.** The same split separates `profit_factor` from `trade_profit_factor`. They will not agree and are not meant to.
- **The `P&L` column on the Transactions tab is a money value rendered through a signed-percentage formatter.** Read it as the raw P&L figure, not as a percentage of anything.

### Direction traps

`beta`, `correlation` and `r_squared` carry the direction `informational` — deliberately, because a high R² is the goal for an index replicator and a red flag for a market-neutral book. None of the three can be an optimization objective, and no surface will call one of them "better".

One direction trap is worth stating on its own, because it changes what a headline says:

> [!WARNING] "Best trial" uses the *study's* direction, not the metric's
> The **Best trial** card and the evolution chart's best marker resolve "best" from the study's own optimization direction (`MAXIMIZE` or `MINIMIZE`, falling back to the fitness function's direction). The filter bar's metric does not enter into it. Point the filter bar at a lower-is-better metric such as `max_drawdown` on a `MAXIMIZE` study and the card crowns the candidate with the *deepest* drawdown. The ranking cards on the Portfolios Dashboard are unaffected — they sort by the metric's own direction.

## Judging whether a result is real

Two verdicts exist and they are computed differently. The per-candidate verdict is **stored**, once, at study finalization. The study-level verdict is **derived on read**, from the stored study PBO and the distribution of the per-trial verdicts. Neither is available until the `robustness` stage lands.

| Verdict | Subject | Where |
|---|---|---|
| Study-level | the whole search | the study's **Robustness** tab, the **Overview** tab's summary card, and the header's `Overfit` KPI with `PBO {{value}}` beneath it |
| Per-candidate | one trial | that candidate's **Robustness** tab, and the verdict chip beside `Metrics Comparison` on its Performance tab |

### The per-candidate verdict

Four outcomes, classified in order — the first match wins.

| Order | Verdict | Condition |
|---|---|---|
| 1 | `uncertain` | fewer than **30** out-of-sample observations, or a non-finite deflated Sharpe, or a non-positive cross-trial Sharpe variance, or an effective trial count of 1 or less |
| 2 | `overfit_risk` | the train→OOS degradation test is flagged, **or** study PBO is above `0.5`, **or** the deflated Sharpe is below `0.90` |
| 3 | `borderline` | the deflated Sharpe is below `0.95` |
| 4 | `well_trained` | everything else |

Labels differ by surface for the same stored value: `uncertain` renders as **Insufficient Data** on a candidate's Robustness tab and as **Uncertain** on the study's. `overfit_risk` renders **Overfit Risk** and **Overfit risk** respectively. Scripting against the API uses the stored `uncertain` / `overfit_risk` values.

### The study-level verdict

Derived client-side, not stored — from the study's PBO and the distribution of its per-trial verdicts, in this order:

| Order | Result | Condition |
|---|---|---|
| 1 | `uncertain` | there is no robustness data for the study |
| 2 | `overfit_risk` | study **PBO above 0.5** — this dominates, whatever the individual trials say |
| 3 | `uncertain` | no trial carries a verdict |
| 4 | `well_trained` | at least half the scored trials are `well_trained` |
| 5 | `borderline` | `well_trained` plus `borderline` together reach half |
| 6 | `overfit_risk` | more than half are `overfit_risk` |
| 7 | `uncertain` | none of the above |

A high PBO overriding healthy individual verdicts is the case worth internalising: it means the *selection procedure* overfits even where a given trial's own out-of-sample record looks fine.

### What has to be true before a verdict exists

| Figure | Requirement |
|---|---|
| Any confident per-candidate verdict | at least 30 out-of-sample daily returns |
| Study PBO | at least 2 dense trials and at least 40 days of common history |
| Any of it at all | a study that reached the `robustness` stage |

When scores are simply absent, the Robustness tab says so — *"No robustness analysis available for this portfolio yet. Scores are computed when a study finishes — re-run the study (or its finalization) to populate them."* — and distinguishes that from a failed query, so a broken deploy never reads as an unscored study.

### Reading the surfaces, in order

1. **Study Robustness tab.** Start with `PBO` and `Luck threshold (SR₀)`. PBO above 0.5 is a stop sign for the whole search. Then **Trial Sharpe distribution vs luck**: trials at or below SR₀ have an in-sample Sharpe indistinguishable from chance. Then **In-sample vs out-of-sample rank** — points on the diagonal persist, a downward spread is rank reversal.
2. **Per-candidate Robustness tab**, for each shortlisted candidate. The `Deflated Sharpe (OOS)` gauge breaks at exactly the verdict cutoffs (red below 90 %, amber 90–95 %, green at 95 % and above), and `Skill vs. luck` puts that candidate's OOS Sharpe next to SR₀ on one annualized axis. Read `Train → OOS degradation` alongside `Val → OOS degradation`: training is selection-inflated, so only the second isolates genuine decay.
3. **Hyperparameter Importances**, on the study's Overview tab. The **Overfitting divergence** panel is the one to read here: *"Parameters important in train but not in validation drove selection overfitting; an effect whose direction flips out of sample is a spurious-signal flag."* A parameter flagged **Effect direction flips out of sample** is a parameter your search learned backwards.
4. **Families**, last. If the whole shortlist sits in one family, everything above described one strategy several times and your effective sample size is smaller than the trial count suggests.

> [!NOTE] The per-metric signal badges are not the verdict
> `High Risk`, `Controlled Risk`, `Train≫OOS`, `Val Weak`, `OOS Strong`, `Overall Best`, `Weak` and `Stable` on a candidate's Performance tab are client-side comparisons between stages. They are diagnostics. The statistically grounded answer is the Robustness tab's verdict, and only that.

### The shape of a result worth keeping

| Signal | Reading |
|---|---|
| Verdict `Well Trained`, study PBO at or below 0.5 | the out-of-sample edge survives the selection-bias correction |
| OOS Sharpe clears SR₀ | the result beats what the best of this many trials would reach with zero skill |
| `Val → OOS degradation` not significant | the decay is not the kind selection inflation explains |
| `OOS autocorrelation` below 0.2 in magnitude | the annualized Sharpe — and these tests — are not biased by serial correlation |
| The candidate's family holds a minority of trials | you found a behaviour, not a corner of the parameter grid |
| Its rank holds when you switch `Rank by` from `Train` to `OOS` | the ordering is not an artifact of the fitting window |

Failing several of these does not make a candidate worthless; it makes it a hypothesis rather than a result. Failing them while carrying the best `fitness` in the study is the classic shape of an overfitted winner.

## Promote or discard

### What promotion actually is

Promotion turns a trial — a study artifact — into a **managed portfolio**: a durable, study-independent copy taken as one isolation snapshot inside a single transaction. It copies the strategy code and parameters, the concrete trial parameters, the runnable universe, the fitness configuration, the risk-manager snapshot and the historical seed, plus the trial's holdings, equity and orders into a parallel data plane. It survives deletion of the source study, and it is the only object a [portfolio group](/docs/portfolio-groups) can hold. See [promoted portfolios](/docs/promoted-portfolios) for what freezes and what stays live.

Promotion is **idempotent** — re-promoting returns the existing `managed_portfolio_id`, which is why the `Promoted` badge is cosmetic. The batch endpoint is **partial-success**: it reports what succeeded and what failed, so a mixed outcome is normal and both halves must be read. Quota is charged for the whole batch up front, so a batch larger than the remaining managed-portfolio allowance promotes nothing.

### Before you promote

| Check | Why |
|---|---|
| The `robustness` stage has landed | promoting before a verdict exists means promoting without one |
| You have looked at `OOS` or `RLP`, not just `Overall` | otherwise you are promoting the fitting window's winner |
| The candidate is not one of five siblings from the same family | promote the family's representative, not five copies of it |
| Its parameters are not at the edge of the searched range | an optimum on a bound usually means the bound, not the optimum, was the constraint — check the `Parameter Impact` scatter |
| The risk-manager health notice on the study's Overview tab, and the `Risk-manager execution log` on the candidate's Risk Analytics tab, are clean | a manager that switched itself off mid-run leaves a `COMPLETED` study full of plausible-looking portfolios, and nothing else flags it |

### What promotion refuses

| Rejection | Reason |
|---|---|
| An `EXTERNAL`-execution strategy | managed daily updates support `INTERNAL` strategies only, so the copy could never extend — see [execution modes](/docs/execution-modes) |
| A meta-portfolio carrying a `sector_cap` or `country_cap` risk manager | those act on per-ticker sector and country metadata that a portfolio-group pseudo-ticker does not have |
| A trial that is not in your organization, or whose study was deleted | there is nothing left to snapshot |
| A batch of more than 50 distinct ids, or an empty one | hard limits on the batch endpoint — duplicates are collapsed before the count, and both refusals are `400` |

Both hard rejections also run on the idempotent path, so a copy promoted before the guards existed is refused rather than silently reused.

### Discarding

There is no "discard this trial" action anywhere in the interface, and that is deliberate rather than missing.

| What you might want | What actually exists |
|---|---|
| Delete one bad trial | `DELETE /portfolios` exists but requires the `root:all` permission, and no screen in this feature calls it |
| Get a trial out of your way | Uncheck it, or lower `Top N` — both are view state, not deletion |
| Throw away a whole failed search | Delete the study. It soft-deletes immediately and a background worker permanently purges its portfolios, then its trials, then the study row |
| Keep the good result and drop the study | Promote first. A promoted portfolio is a copy and survives the study's deletion intact |

The honest discard is simply not promoting: an unpromoted trial costs nothing, occupies no quota and disappears with its study. Deleting a study is not a recycle bin — there is no retention window, no restore endpoint and no undelete.

## What this surface will not tell you

- **There is no pareto front or multi-objective view.** A study optimizes one objective in one direction. `NSGA-II` is selectable as a *sampler* — it changes the search algorithm, not the number of objectives or the screens you get. See [sampler selection](/docs/sampler-selection).
- **Nothing refreshes on a timer.** No polling, no websocket, no auto-refresh anywhere in the portfolios data layer, and refetch-on-focus is off. Numbers update on navigation and remount.
- **Parameter importances are not defined for rolling or custom windows.** They decompose the variance of the study's own objective, which only exists over the study's own periods. Pick `Overall`, `Train`, `Val`, `OOS` or `RLP`.
- **Scalings are not an optimization concept.** A scaling is a scale-in or scale-out inside one trade, on a candidate's Transactions tab. There is no study-level scalings view.
- **`Export hyperparameters` only produces a file for `Train` or `Validation`.** The button is never disabled; with any other stage selected, clicking it does nothing.
- **Rolling-window rows can be missing for old studies.** The nine rolling windows are written by whoever wrote the equity curve; a study that predates that arrangement has named-stage values and no window values, and ranking by a rolling window will find nothing for it.

## Where to go next

- [portfolios dashboard](/docs/portfolios-dashboard) — every control on the ranking screen, in full.
- [optimization dashboard](/docs/optimization-dashboard) — the four per-study sub-views and the promotion API.
- [portfolio detail](/docs/portfolio-detail) — one candidate's six tabs, including its Robustness statistics.
- [metrics reference](/docs/metrics-reference) — every metric's definition, unit, direction and formula.
- [visualizations](/docs/visualizations) — what each chart plots and how to read it.
- [study lifecycle](/docs/study-lifecycle) — stages, statuses, stopping, resuming and deletion.
- [promoted portfolios](/docs/promoted-portfolios) and [portfolio groups](/docs/portfolio-groups) — where a promoted candidate goes.
- [portfolio manager](/docs/portfolio-manager) — book-level analysis, once you have groups.
- [api trials and portfolios](/docs/api-trials-portfolios) — the same rankings and metrics, programmatically.
