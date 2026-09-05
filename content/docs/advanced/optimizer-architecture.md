---
title: Optimizer architecture
section: Configuration & Advanced
sectionOrder: 8
order: 6
published: true
updated: 2026-09-01
summary: What actually happens when you launch a study, how Fintela runs your trials in parallel, tracks progress and health, recovers from failures automatically, and what you can and can't control.
keywords: architecture, optimizer, parallelism, workers, trials, progress, health, failure recovery, memory, samplers, limits
---

When you launch a study, Fintela doesn't run it on a single machine and hope for the best. Your
study is queued, then automatically assigned however many parallel workers it needs, split into
batches of trials, and simulated at speed with Fintela's own backtesting engine. Every trial,
portfolio and metric is saved to your study's permanent record continuously as it completes, never
held only in memory until the end, which is why a worker that stumbles loses at most its
current batch, never anything already finished. This page walks through what actually happens: how
a study gets picked up, how many trials run at once and why, how progress and health are tracked,
how Fintela recovers automatically when something goes wrong, and what you can and can't control
yourself.

## What happens when you launch a study

| Stage | What Fintela is doing | What you see |
|---|---|---|
| Queued | Your study is waiting for its share of compute; tokens for your trial budget are already set aside | Status: `Queued` |
| Starting up | Workers are being assigned and started for your study | Status flips to `Running` the moment the first one is live |
| Running trials | Each worker samples parameter combinations, simulates them with your strategy and risk managers, and scores them with your fitness function | Progress and Health update continuously |
| Wrapping up | Fintela confirms every worker has finished and finalizes your study's status | Status settles on `Completed`, `Failed`, or `Stopped` |
| Daily updates (optional) | If you turned on daily recompute, portfolios promoted from this study extend automatically once new market data arrives | See [study lifecycle](/docs/study-lifecycle) |

> [!NOTE] The same engine powers quick tests and full studies
> The simulation logic behind a single backtest in the strategy or fitness sandbox is the exact
> same engine that runs every trial inside a full optimization study. A strategy that behaves a
> certain way when you test it will behave the same way once it's part of a study: the only
> difference is how many combinations get tried.

## From launch to finish, at a glance

1. You launch a study (or create one with **launch now**). It's queued instantly and your tokens
   are set aside for the trial budget you asked for.
2. Fintela picks it up, normally within milliseconds, occasionally after a short wait if your
   organization already has studies using all their available compute.
3. Workers start and immediately begin drawing trials from your budget.
4. As each batch of trials finishes, its results (trades, portfolios, equity curves, metrics)
   are saved to your study right away, not held until the very end.
5. Once every worker has finished, Fintela finalizes your study's status and, if it ended early or
   ran into trouble, records why.
6. If you enabled daily updates, any portfolios you promote from this study begin extending
   automatically from that point on.

## Getting picked up: from Queued to Running

The moment you launch, your study's status changes to `Queued` and Fintela is signaled to start it
right away: in practice, a launch is normally picked up within milliseconds.

> [!WARNING] Resuming or an automatic memory retry don't get the same instant pickup
> Resuming a finished study, and the automatic retry that follows a worker running out of memory,
> both put your study back into `Queued`, but neither triggers the instant wake up a fresh launch
> gets. Those studies wait for Fintela's next regular check instead, which is still frequent, just
> not immediate.

### Why a study might wait

Fintela only has so much compute capacity available at any moment, shared across every
organization running studies at the same time. If that capacity is fully committed, your study
waits in line (oldest queued study first) until room frees up. You're not charged anything extra
for waiting: tokens for a study are set aside the moment you launch it, whether it starts running
immediately or a few minutes later.

> [!TIP] Resuming picks up where you left off, not from scratch
> If you resume or relaunch a study that already ran some trials, Fintela doesn't recompute your
> whole trial budget from zero: trials that already reached a result don't need to run again.
> Only what's actually left gets scheduled, which is part of why a resumed study can finish faster
> than its added trial count alone would suggest.

### How many workers your study gets

| Your study | Workers assigned |
|---|---|
| Strategy and fitness function are both Internal | However many Fintela's scheduler decides your trial budget needs, automatically, with no setting to adjust it |
| Either the strategy or the fitness function is External | Exactly one worker; the concurrency inside it follows the limits described in [execution modes](/docs/execution-modes) |

The two experimental quantum samplers, QAOA and Q-Kernel, always run on a single worker too, since
each keeps an internal model that can't be split across machines, see
[sampler selection](/docs/sampler-selection). And Fintela never overprovisions a small study: a
20 trial study won't be handed the same worker count as a 2,000 trial one, so you're not paying for
idle capacity on a modest search.

Once your worker count is decided, your trial budget is split evenly across them, so each one
carries roughly the same share of the work.

### How big each worker is

You don't choose how much compute power each worker gets: Fintela sizes it automatically based on
your study's execution type and, for internal studies, on what you selected when setting the study
up. If a worker runs low on memory partway through, Fintela can also step it up to a larger size
automatically and retry, rather than letting your study fail outright, see
[How Fintela recovers from failures](#how-fintela-recovers-from-failures) below.

Your study's status flips from `Queued` to `Running` the moment its first worker is confirmed
live (not merely requested) which is also the moment Progress and Health start showing real
numbers instead of a placeholder.

## How your trials actually run

Once a worker starts, it loads everything your study needs (market data for your Asset Group,
your strategy, your risk managers, your fitness function) and works through your trial budget one
batch at a time rather than one trial at a time.

Inside a single worker, several trials run at once. For internal studies, that concurrency scales
with the size of the machine assigned to your study. For external studies, it's capped by your
declared **Max Concurrency**, and never more than 32 trials at a time regardless of what you set,
the same ceiling described in [execution modes](/docs/execution-modes).

Your sampler adapts automatically to however many workers and simultaneous trials your study ends
up with: TPE and NSGA-II both adjust their internal behavior so parallel workers don't waste
trials proposing near duplicate combinations. You don't configure any of this yourself; see
[sampler selection](/docs/sampler-selection) for what each sampler does with parallelism.

### How a batch of trials moves from idea to result

Trials move through your study in batches rather than one at a time. To keep workers busy, Fintela
pipelines the work: while one batch is being saved, the next batch is already being sampled and
simulated. That overlap is why a study doesn't slow to a crawl as more results accumulate.

Each trial in a batch goes through the same steps:

1. Your sampler draws a new combination of parameters.
2. Your strategy turns it into a trading signal.
3. That signal is simulated against market data, along with any risk managers you've attached.
4. Your fitness function scores the result.
5. A successful trial is saved as a completed portfolio; anything that couldn't be evaluated is
   recorded as skipped or failed, with a reason.

> [!NOTE] Internal code runs in its own isolated space
> If your strategy, fitness function or risk manager runs inside Fintela (Internal mode), its code
> executes in an isolated environment that only has access to what it actually needs: your
> parameter values and the data your data sources feed in. It has no access to Fintela's own
> internal systems or credentials.

If your search space is small enough to enumerate completely, Fintela replaces your sampler with
an organized sweep instead: trying every combination exactly once and coordinating cleanly across
however many workers you have. See [sampler selection](/docs/sampler-selection) for exactly when
this kicks in. It's also why a study can finish `Completed` with fewer completed trials than the
budget you requested: once every combination has been tried, there's nothing left to run.

### Where the speed comes from

| Level | What controls it |
|---|---|
| Across studies running at once | Your organization's available compute capacity, shared with whatever else is running |
| Across workers within one study | Your execution type, sampler, and trial budget, decided automatically |
| Across trials within one worker | The size of the assigned machine (internal), or your Max Concurrency and the 32 trial ceiling (external) |
| Inside a single trial's simulation | Fintela's simulation engine, built to use the whole worker's compute for each trial |
| Saving results vs. running the next batch | Overlapped automatically, so saving results never blocks new trials from starting |

### How Fintela avoids running out of memory

Larger batches of trials use more memory, mainly driven by how many simulated days and positions
each trial holds, not by your underlying price data. To keep workers from crashing partway through,
Fintela does two things automatically:

- **Before a worker starts**, it estimates how much memory a batch will need and starts with a
  conservative batch size for the machine it's on.
- **While the worker runs**, it watches how much memory each completed batch actually used and
  adjusts the size of the next batch accordingly, starting deliberately small and adapting from
  there.

If memory does get tight, the worker finishes saving whatever batch is already in flight before
requesting more work, rather than piling on more compute while pressure is high. And even if a
worker is stopped abruptly, the memory it was using up to that point is recorded, so Fintela can
react appropriately if your study needs to retry on a bigger allocation.

## The simulation engine

Whether you're running a single backtest in the strategy sandbox or a full optimization study, the
same simulation engine does the work, so a strategy that behaves a certain way in a quick backtest
behaves the same way once it's part of a full study, with the only difference being how many
combinations get simulated.

For speed, a whole batch of trials is prepared together: price data is processed once per batch
rather than once per trial, and every trial in the batch is then simulated at once, using
whatever compute the worker has available. Results are converted back into your study one trial at
a time, which keeps memory use predictable even for large batches.

If something goes wrong in one trial's simulation, it's isolated to that trial: a bad
configuration doesn't take down the rest of the batch. Two situations are handled a little
differently:

- If a risk manager's own logic runs long enough to trip an internal safety timeout mid batch,
  Fintela retries the whole batch once. If it's interrupted again, every trial in that batch is
  recorded as skipped rather than failed, since none of them were actually evaluated.
- A trial whose result can't be turned into a valid number is recorded as a failure.

Risk managers (including external ones) are evaluated once for every simulated trading day
inside each trial, not once per trial. See [risk managers](/docs/risk-managers).

If your study uses an external strategy or fitness function, Fintela calls out to your endpoint the
same way it would for a backtest: automatically retrying on connection hiccups or server errors,
but never on an endpoint that's simply slow to respond. See [execution modes](/docs/execution-modes)
for the exact rules, and [external strategies](/docs/external-strategies) /
[external fitness](/docs/external-fitness) for how to build one.

## Where your results live

Every trial, portfolio and result your study produces is saved directly and permanently to your
account: there's no separate cache or staging area that could ever drift out of sync with what you
see in the app. A few things follow from that:

- **Results save in complete batches, never partially.** You'll never see a batch of trials
  half written to your study: a batch either finishes saving in full, or Fintela retries it, so
  what's visible is always internally consistent.
- **Your study's status comes from one single place.** `Queued`, `Running`, `Completed`, `Failed`
  and `Stopped` are always read from the same source, so the Studies registry and a study's own
  results page can never disagree about where it stands.
- **Your study moves through a fixed set of stages**: queued, starting up, data loading,
  strategy, fitness, optimization, and then two after the fact analyses (robustness and parameter
  importances) that don't block your results even if they fail. See
  [study lifecycle](/docs/study-lifecycle) for the full breakdown of what each stage means for your
  results.

## How Fintela recovers from failures

| What can go wrong | What happens to your study |
|---|---|
| A worker fails to start | It's marked failed with a reason on file; if every worker for the run failed to start, your study is marked `Failed` |
| A worker stops unexpectedly | The stop is diagnosed and recorded so you can see why on the failure dashboard |
| Fintela loses track of a worker | It's closed out and marked accordingly, without inventing a reason it can't support |
| A worker hits a fatal error in your strategy or fitness code | That worker's own in flight trials are marked failed; any other workers running your study are unaffected |
| A worker runs out of memory | Fintela automatically retries your study on a larger allocation (up to three step ups) instead of failing it outright, remaining trials pick up where the study left off, and you're not charged again for what already ran |
| One trial's simulation errors | Only that trial fails; the rest of the batch, and the rest of your study, continue |
| A batch fails to save | The batch is recorded as skipped and the study continues rather than stalling |
| Too many trials are failing | If health drops below the threshold you set, the study stops itself early rather than continuing to spend your token budget |
| Trials never come back after your study finished | They're recorded as abandoned once every worker for the study has stopped |

> [!CAUTION] A stopped or crashed study keeps everything it already produced
> Trials that finished before things went wrong are safe; their portfolios, equity curves and
> results are already saved and won't disappear. Only the batch that was in flight at the moment is
> lost. That's also why resuming or relaunching a partially finished study only computes what's
> left, not everything from scratch.

> [!WARNING] Failed studies can't be resumed
> Resume only works on studies that finished normally or that you stopped yourself. A study that
> failed has to be duplicated and relaunched instead.

If a running study goes quiet (no update from any of its workers for a few minutes), Fintela flags
it internally as stale, though there's no dedicated badge for this beyond the **Last heartbeat**
timestamp already shown on the study's Overview. See [study lifecycle](/docs/study-lifecycle) for
more on how stalls and orphaned trials are cleaned up.

Once a study finishes (however it ends), Fintela compares what you were charged at launch against
the actual cost of the trials that completed, and automatically refunds the difference. This
applies to any study that finished within the last 7 days. See
[tokens and billing](/docs/tokens-and-billing).

## How you see your study's progress

Nothing is pushed to your browser trial by trial as your study runs. Instead, results land in your
study record the moment they're ready, and the app keeps its view of your study current by checking
in: you don't need to refresh the page yourself.

| What you're viewing | How often it refreshes |
|---|---|
| Status, Progress and Health badges | About every 5 seconds while any study is active, tapering off once everything is finished |
| The full lifecycle / stage view | The same live cadence while running, then checks back periodically for up to 30 minutes after finishing in case a background analysis is still catching up |
| Study list and metadata | About once a minute |
| Sampler list | Loaded once per session |

A lightweight live update signal also tells the app "something changed on this study, go refetch":
it never carries your actual data, only a hint, so nothing sensitive travels over it. If that
signal is ever unavailable, the app simply falls back to checking in periodically, with no visible
difference to you.

**Progress** and **Health** are explained in full under [study lifecycle](/docs/study-lifecycle):
in short, Progress is the share of your trial budget that's been resolved one way or another, and
Health is the share of resolved trials that actually succeeded. The Progress you see in the Studies
registry always reflects live numbers, never a snapshot that could be a minute old, which matters
most for a study you're actively watching mid run.

The per study results surface itself lives on the portfolios analysis page, reached from the
study's **View** row action. See [analyzing results](/docs/analyzing-results) and
[optimization dashboard](/docs/optimization-dashboard).

## Limits

- **You can't choose how many workers a study gets.** Worker count comes from your execution type,
  your sampler, and your trial budget, decided automatically. There's no worker count setting
  anywhere in the study builder or the API.
- **An external strategy or fitness function collapses a study to one worker.** That single worker
  layout is what guarantees your endpoint sees exactly the concurrency you declared and keeps your
  sampler coordinated in one place. Distributed execution and external endpoints are mutually
  exclusive, see [execution modes](/docs/execution-modes).
- **The external fan out is capped at 32 trials at once**, regardless of what Max Concurrency you
  declare, so an oversized value can't flood your endpoint with connections.
- **There's no way to get push notifications or webhooks for trial level events.** The one
  real time signal is a lightweight "something changed" hint; everything you see is otherwise kept
  fresh by the app checking in on its own schedule.
- **A stage's recorded duration can be unreliable in specific cases.** When the underlying work
  happened out of the normal flow, for example, a background analysis catching up after your
  study already completed, Fintela shows that stage's duration as unknown rather than guessing.
