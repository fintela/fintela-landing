---
title: Studies
section: API Reference
sectionOrder: 10
order: 4
published: true
updated: 2026-09-01
summary: Pull a study's configuration, progress, health, run status, error details, and optimization results into your own tools or dashboards.
keywords: studies, optimization progress, study health, run status, error breakdown, optimization curve, parameter importance, developer API, personal access key
---

Studies are created, launched, stopped and deleted from inside the Fintela app: see
[study lifecycle](/docs/study-lifecycle). This page covers the read only side: pulling a study's
configuration, watching its progress and health while it runs, digging into why particular trials
failed, and exporting its optimization results and top trials into your own tools or dashboards.
Every lookup here is a simple, safe read: none of them can change, launch, or delete anything, so
they're safe to call as often as the limits below allow.

## What you can pull for a study

A personal access key gives you read access to the following, for any study your organization owns:

| Category | What it gives you |
|---|---|
| Configuration | The full setup of a study: strategy, fitness function, trial budget, search space, date windows, asset group, and more. |
| Progress | How much of the trial budget has been used so far. |
| Health | The trial success rate: how many trials finished cleanly versus failed. |
| Status | The study's current run state, and a plain language explanation if it failed. |
| Errors | A breakdown of why trials failed, plus the individual failed trials and their parameters. |
| Optimization curve | Every trial's score, in order: the raw shape of the search. |
| Blended curve | The same, but scored on a weighted mix of training and validation performance. |
| Parameter importance | Which parameters actually drove the results, and which ones look like they overfit. |
| Lookup by name | Browse your studies by name instead of id, and see a study's top ranked trials. |

## Before you start

### Getting access

Every request needs a personal access key. Generate one from your account settings and pass it
with each request: your own script or dashboard tool handles this on every call, not you by hand.
A key isn't scoped to particular studies or features: it can read anything your organization owns,
so treat it with the same care as a password. See
[authentication and limits](/docs/api-authentication) for how to create and manage keys.

> [!WARNING] Use the key the right way
> Some tools default to putting an API key into the web address itself. Fintela's API doesn't
> accept that: it will just come back with an authorization error and no explanation why. Pass
> your key the way described in [authentication and limits](/docs/api-authentication).

### Rate limits

These particular read only lookups aren't capped as tightly as some other parts of the API today:
but treat that as incidental, not a guarantee it stays that way. Keep your own polling sensible: a
few seconds between progress or health checks is plenty, about every 30 seconds for status, and
pull the error details on demand (for example right after you notice a run has failed) rather
than on a fixed timer. See [authentication and limits](/docs/api-authentication) for the limits
that do apply platform wide.

### No live updates

There's no push notification or live event feed yet: Fintela won't tell your systems the moment a
run finishes or fails. If you're building your own dashboard, check in periodically instead of
waiting for a signal.

## Identifying a study

A study has two names you'll run into: the display name you gave it in the app, which you can
rename at any time, and a stable internal key that's set when the study is created and never
changes. Most lookups on this page also accept a numeric id.

If you're building something that stores a reference to a study long term: a saved dashboard, a
scheduled export: store the internal key or the numeric id rather than the display name, since the
display name can change out from under you later. Looking a study up by name accepts either its
current display name or its internal key, checking the display name first.

The same distinction matters wherever else the API lets you filter by study name, such as in
[trials and portfolios](/docs/api-trials-portfolios).

## Requesting multiple studies at once

Most of the lookups above let you ask about several studies in one request, by listing their ids
together: handy for a dashboard tracking a batch of runs instead of calling in one study at a
time.

| Situation | What happens |
|---|---|
| You leave the id list out entirely | For the study configuration lookup, this means "every study in your organization." Every other lookup on this page requires you to name at least one study. |
| One of the ids isn't a valid id | You'll get a clear error pointing at the value that didn't parse. |
| An id belongs to a study you can't access, or one that's been deleted | It's quietly left out of the result: not an error, just a smaller response than you asked for. |

Because inaccessible ids are simply dropped rather than flagged, always check whether a study you
asked about actually came back, rather than assuming it did.

## Configuration and monitoring

### Study configuration

The full setup of a study, as it was configured. This is the best starting point if you're pulling
data programmatically and don't yet know a study's id: it's the one lookup here where naming
specific studies is optional, so you can ask for every study in your organization at once and go
from there.

| What you'll see | What it tells you |
|---|---|
| Name & key | The display name (mutable) and the internal key (permanent): see [identifying a study](#identifying-a-study) above. |
| Strategy & fitness function | Which strategy was optimized, and which fitness function scored each trial. |
| Trial budget & completed trials | How many parameter combinations the study was set to try, and how many have finished. |
| Search method | The search algorithm used to explore the parameter space: see [sampler selection](/docs/sampler-selection). |
| Training & validation windows | The date ranges used to search for parameters, and to check them on held out data within the study. |
| Out of sample window | An additional holdout period, when the study defines one. |
| Asset group | Which asset group the strategy (and, if set separately, the fitness function) ran against. |
| Search space | The range or set of choices each parameter could take. |
| Daily updates | Whether the study's resulting portfolios are recomputed automatically as new data arrives. |
| Created | When the study was created. |

> [!NOTE] Nothing here is hidden
> The search space and fitness settings are always shown to you in full, exactly as you configured
> them.

> [!NOTE] Completed trial counts can differ slightly by view
> While a run is still going, the completed trial count shown here can differ slightly from the
> count on the studies list further down this page: one counts trials with no failure, the other
> additionally requires the trial to have fully wrapped up. They converge once the study finishes.

### Progress

How much of a study's trial budget has been used, as a share from 0 to 1 (for example, 0.97 means
97% of the planned trials have run). It counts every trial that's been recorded, including failed
ones, so it tells you how much of the run has executed: not how well it's going; see
[health](#health) for that. A study given no trial budget shows no progress value at all, since the
share is undefined.

> [!NOTE] Progress can stop short of 100%
> A study whose search space is small enough to fully explore can finish after covering every
> combination, even if that's less than the full trial budget you set. Treat the study's
> [status](#status-and-failure-details), not its progress percentage, as the real signal that a run
> is over.

### Health

The flip side of the trial failure rate: what share of a study's trials have finished cleanly, from
0 (everything failed) to 1 (nothing has). A study with no trials yet shows no health value, since
the share is undefined.

> [!WARNING] Health and the error breakdown can disagree on purpose
> Health counts every failed trial, including harmless ones: for example, a trial skipped because
> it duplicated a parameter combination already tried on a finite search space. The
> [error breakdown](#error-details) below filters those harmless cases out. So a study that fully
> explored a small search space can show a low health score while its error breakdown looks nearly
> empty. Neither is wrong: they're answering different questions.

### Status and failure details

The study's current position in its lifecycle, plus (if it failed) a plain language explanation
and what to do next.

| Status | What it means |
|---|---|
| Saved | Configured, not yet launched. |
| Queued | Launched and waiting for compute to become available. |
| Running | Actively searching parameter combinations. |
| Completed | Finished its trial budget, or fully explored a finite search space. |
| Failed | Stopped because of an error: see the failure details below. |
| Stopped | Stopped before finishing: either by you, or automatically by the platform (for example, if too many trials were failing in a row, to avoid burning through your compute budget for no benefit). |

When a study fails, you'll get back a short explanation in plain language: for example, a study
that ran out of memory might read: *"This study ran out of memory and stopped. Its scope is more
than one run can hold: try fewer tickers, a shorter date window, or fewer trials."* Alongside the
message, you'll get one or more suggested next steps, such as reducing the study's scope and
relaunching it, editing your strategy code, or contacting support.

The failure details also indicate roughly where things went wrong: for instance while loading
data, while running your strategy code, while scoring a trial, or during the search itself: and,
for the later analysis passes that run after a study's core results already exist (like the
robustness check or the parameter importance pass), a failure there only affects that particular
extra analysis, not the study's main results.

See [study lifecycle](/docs/study-lifecycle) for what each stage means for a study you're actively
managing.

### Error details

A closer look at what went wrong, trial by trial: failure reasons grouped into categories with
counts, plus the individual failed trials and the exact parameter combination each one used:
useful for spotting whether a specific setting is the culprit, or for finding a bug in your own
strategy code.

Harmless skips: like a trial dropped because it duplicated a combination already tried, or routine
internal bookkeeping: are filtered out here, unlike on the health score. If nothing meaningful has
gone wrong, both lists come back empty.

For example, you might see three trials grouped under "your strategy raised an error while
running" and one under an unclassified issue, with the specific trial numbers, the parameter values
that produced each failure, and (for the classified ones) extra detail such as which line of your
code was involved and which tickers were affected, so you can reproduce and fix the problem in the
editor.

## Optimization analysis

Once a study's trials have run and been scored, these lookups reconstruct the search itself:
useful if you want to chart it your own way, beyond what's already available in the app's own
[visualizations](/docs/visualizations). They return nothing for a study that hasn't produced scored
trials yet.

> [!WARNING] Use exact spelling for stages and metrics
> When you ask for a particular stage or metric, it has to match exactly. A couple of stages go by
> two different names in different places: out of sample data appears as either `out_of_sample`
> or `oos`, and real life performance as either `real_life_performance` or `rlp`: so pick one and
> use it consistently. Training and validation only have one spelling each. An unrecognized stage
> or metric name isn't treated as an error: it just comes back with nothing, so a silent typo can
> look like "no data" instead of a mistake. See [metrics reference](/docs/metrics-reference) for the
> full list of metric names.

### The optimization curve

For a chosen metric (like Sharpe ratio) and stage (like validation), this returns the score every
trial achieved, in the order the trials ran: the raw shape of the search. Use it to plot how the
metric evolved trial by trial, or to see roughly where the search stopped finding improvements.

This is the raw series, not a running best: if you want the classic upward stepping optimization
curve, compute the running maximum yourself from these values. The raw series actually tells you
more, since it also shows how much the search was still exploring versus how tightly it had
converged.

Each value also comes with a handle to that trial's portfolio, which you can follow into
[trials and portfolios](/docs/api-trials-portfolios) for its full equity curve and complete metric
set.

### The optimization curve with parameters

The same values, with each trial's parameter settings attached: what you need to build a
parameters versus score scatter plot, or a parallel coordinates chart of the whole search.
Categorical parameters (like a moving average type) come through by name rather than an internal
number, so a chart built from this is readable without a separate lookup table. A trial with
nothing recorded for its parameters just comes back with an empty set for that trial, rather than
being left out.

### The blended curve (train + validation)

Ranks trials on a weighted blend of their training and validation performance, instead of either
window alone: useful when you want a trial that neither overfit the search window nor simply got
lucky on the held out one. By default, training and validation count equally (50/50); you can
weight one more heavily than the other, as long as the two weights add up to 100%.

> [!CAUTION] A trial missing one side of the blend isn't excluded: it's under weighted
> If a trial only has a value for one of the two windows (say it hasn't been scored on validation
> yet), the blend still returns a number, computed from just the side that's available and weighted
> accordingly: not a missing value and not an exclusion. On a study that's still finishing up,
> cross check against the plain [optimization curve](#the-optimization-curve) for each stage before
> trusting a blended ranking.

### The blended curve with parameters

The same blended ranking, with each trial's parameter settings attached: the blended scoring
equivalent of [the optimization curve with parameters](#the-optimization-curve-with-parameters)
above.

### Which parameters actually mattered

Once a study has enough completed trials, Fintela automatically works out which parameters actually
drove the results: this pulls that analysis. It tells you:

| What you get | In plain terms |
|---|---|
| Most influential parameter | Which single setting moved the score the most, and roughly how large its share of the effect was. |
| Direction | Whether higher or lower values of that parameter tend to help: or, for a category style parameter, which category. |
| Overfitting risk | The parameter with the biggest gap between "mattered on the training window" and "mattered on validation," and how large that gap is. |
| Confidence | Whether there were enough scored trials to trust each parameter's ranking, so you can tell a strong signal from a shaky one. |

Because this is computed automatically once, rather than on the fly, checking it costs nothing
extra: but it does come back empty until a study has been scored.

> [!NOTE] "Nothing yet" and "not enough data" are different
> A study with no result at all here simply hasn't been analyzed yet: it may still be running, or
> waiting its turn. A study whose result is present but empty *was* analyzed after it finished, and
> was found too small to say anything meaningful about: for example, fewer than two completed
> trials, or a search space where nothing actually varied between trials. Treat the two differently
> rather than showing both as "no data."

## Looking up studies by name

Alongside the id based lookups above, you can also browse by name: handy if you're scripting
something and don't want to look up ids first.

### All the studies you can see

Every study your key can read, most recently created first. It returns each study's name, internal
key, current status, trial budget and completed trial count, its date windows, and whether it
updates daily: but not its numeric id, so if you plan to move on to the progress, error, or
optimization lookups above, pull [study configuration](#study-configuration) as well to get the id.

### One study, with its top trials

Fetch a single study by its display name or its internal key, and get its configuration back
together with a ranked list of its best trials. By default you get the top 10, ranked by Sharpe
ratio on the validation stage: you can ask for more or fewer (up to 100), a different metric, a
different stage, and, for a metric where lower is better (like drawdown), ascending order instead
of descending.

Each ranked trial comes with its portfolio handle: to pull full results via
[trials and portfolios](/docs/api-trials-portfolios): and every stage's metrics, not just the one
you ranked by. Trials with no value for your chosen metric are left out of the ranking entirely, so
you may get fewer results back than you asked for.

> [!CAUTION] Double check the sort direction
> Only the exact word for ascending sorts that way: anything else, including a typo or different
> capitalization, is silently treated as descending. If your results look backwards, that's the
> first thing to check.

If the name you gave doesn't match any study you can see, you'll get a clear "not found" response
rather than an empty result.

## What this read only access can't do

- **No writes.** Launching, stopping, resuming and deleting a study all consume compute (and
  tokens), so those actions stay in the app itself: see [study lifecycle](/docs/study-lifecycle).
- **No live push.** There's no webhook or live event feed: keep polling instead.
- **Limited sorting and filtering.** The list of all your studies returns everything, newest first,
  with no filtering. The id based lookups return exactly the studies you asked for, in a fixed
  order. The one sort you control on this page is the top trials ranking on the by name lookup
  above.
- **Scoped to your whole organization.** A personal access key can read anything your organization
  owns and hasn't deleted: there's no separate per user privacy within an organization, so guard
  your key like a password. See [authentication and limits](/docs/api-authentication).

For the bigger picture: what else this read only access covers, and how it fits alongside the rest
of the platform: see the [API overview](/docs/api-overview).
