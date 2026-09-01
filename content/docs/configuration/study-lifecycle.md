---
title: Study lifecycle
section: Configuration & Advanced
sectionOrder: 8
order: 3
published: true
updated: 2026-09-01
summary: Every status a study and its trials can be in, what causes it to change, and what you can do at each stage.
keywords: lifecycle, study status, trial status, queued, running, completed, failed, stopped, pruned, resume, autostop, delete study, stalled run
---

Every study you run in Fintela is always in exactly one status, and every trial inside that study
has its own status too. This page walks through what each status means, what moves a study — or a
trial — from one status to the next, and what you can do (stop, resume, delete) at each stage.

## Study statuses

Every study you launch sits in exactly one of six statuses at a time. You'll see it as a badge in
the Studies registry and at the top of a study's results page:

| Status | What it means |
|---|---|
| Draft | Created but not launched. You can still edit every setting. |
| Queued | Launched (and paid for); waiting for compute to become available. |
| Running | At least part of your optimization is actively executing. |
| Completed | Every trial in the run finished, and the core optimization step succeeded. |
| Failed | A required step failed, or every trial failed with nothing to indicate the optimization succeeded. |
| Stopped | You requested a stop, and every trial has wound down. |

If you're reading study data through the developer API, you might occasionally come across the
older labels **Pending** or **Finished** — they mean exactly the same thing as Queued and
Completed.

> [!WARNING] There is no "Paused" status
> A study can't be paused — it only ever sits in one of the six statuses above. (A *basket* in
> Portfolio Manager can show a Paused status, but that's a completely different feature.) If you
> spot "Paused" mentioned in in-app help text somewhere, treat it as outdated — it isn't a status
> you'll actually run into for a study.

### Why status doesn't update the instant you click something

When you launch, stop, or resume a study, Fintela records what you asked for right away — but the
badge you see reflects what's actually happening, and that can take a few moments to catch up. For
example, clicking Stop tells the platform to wind the run down; the badge won't flip to Stopped
until every trial that was in flight has actually finished.

### Status badges and what they really mean

While a stop is in progress, you'll briefly see a **Stopping** badge instead of Running or Queued —
it disappears once the study has actually settled on Stopped.

A Completed badge always means your results are ready to use, but there's a bit more nuance to it.
After the core optimization finishes, Fintela runs a few additional analysis steps — robustness
checks, strategy families, parameter importance — that add extra insight but aren't required for
you to trust your results. If one of these extra steps doesn't finish, or fails outright, your
study still shows Completed; you might just notice it labeled **Completed with warnings**, letting
you know one of the extras is missing or didn't work out. Either way, your portfolios and trial
results are safe to use. Occasionally you'll see this right after a study finishes simply because
one of the extra steps is still being produced in the background — give it a few minutes and check
back.

## How a study's status changes over time

Here's the full picture of how a study moves between statuses:

```text
   Draft ──(Launch)──► Queued ──(compute becomes available)──► Running
                                                                    │
                            ┌───────────────────┬──────────────────┴──────────────────┐
                            │                   │                                     │
                     every trial done      a required step               you requested
                     successfully           fails                        a stop
                            │                   │                                     │
                            ▼                   ▼                                     ▼
                       Completed              Failed                              Stopped
                            │                                                        │
                            └───────────────────────(Resume)────────────────────────-┘
                                                      │
                                                      ▼
                                                   Queued (a new run)

   Delete removes a study permanently from any of the statuses above.
```

Once a study reaches Failed, that's final — nothing resumes or retries it for you automatically.
The one exception: if a run only failed because it ran out of memory and a larger compute size is
still available, Fintela retries it for you before it ever shows as Failed — see
[Automatic retry after a memory error](#automatic-retry-after-a-memory-error) below.

## What moves a study between statuses

| From | What causes it | To |
|---|---|---|
| — | You save a new study without launching it | Draft |
| — | You launch a study immediately when creating it | Draft, then immediately Queued |
| — | You duplicate a study | Draft (the copy always starts fresh, no matter the original's status) |
| — | You launch directly into a risk-manager optimization | Queued (skips Draft entirely) |
| Draft | You click Launch | Queued |
| Queued | Compute becomes available and your run starts | Running |
| Queued | Every attempt to start the run failed | Failed |
| Running | Every trial finishes and the core optimization step succeeds | Completed |
| Running | A required step fails, or every trial fails with nothing to show the optimization succeeded | Failed |
| Running | You requested a stop and every trial has wound down | Stopped |
| Running | The run ran out of memory and a larger compute size is still available | Queued (retried automatically) |
| Completed or Stopped | You resume the study | Queued (a new run) |
| Any status | You delete the study | Removed |

Launching a study — whether it's a fresh launch or a resume — always clears out any leftover
failure details from a previous attempt, so you'll never see a stale error message sitting on a run
that hasn't actually failed.

If you stop a study yourself, it settles on **Stopped** rather than **Failed**, even though the
trials that were interrupted technically end in an error — because a stop you asked for shouldn't
be reported back to you as if something went wrong.

## Stages inside a run

While a study is Running, its results page shows a more detailed pipeline so you can see exactly
where things stand. Each stage carries its own status — pending, running, done, failed, or skipped
— so you can tell at a glance which step a run stalled on or which one caused a failure.

| Stage | Kind |
|---|---|
| Queued | Core |
| Starting up | Core |
| Data loading | Core |
| Strategy | Core |
| Fitness | Core |
| Pre-flight | Core |
| Optimization | Core |
| Robustness | Extra |
| Families | Extra |
| Parameter importances | Extra |

Core stages are the ones your study can't finish without — if one of them fails, the study fails.
Extra stages run after your results already exist; they add further analysis, but a study is still
Completed and fully usable even if one of them doesn't finish.

You might also see a failure attributed to "Before launch" or "While running" rather than one of
the named stages above — that just tells you roughly when in the process something went wrong, not
a step your study passes through.

> [!NOTE] An extra-stage hiccup doesn't fail your study
> Robustness, Families, and Parameter importances run after your study's actual deliverable — its
> trial results and portfolios — already exists. If one of them fails, your study still shows
> Completed (labeled as degraded), and your results remain fully usable. It's common for one of
> these extras to finish a little later, even after the study already reads Completed — Fintela
> keeps checking for up to 30 minutes after your study finishes in case one is still on its way.

## Detecting a stalled run

Fintela keeps track of whether your study's run is still actively making progress. A study's
Overview page shows a **Last heartbeat** timestamp — the last time the run confirmed it was still
alive. If a study has been Running for more than 5 minutes with no update at all, it's flagged
internally as stalled — you won't see a dedicated badge for this anywhere in the app, but it's what
triggers the recovery steps below.

Three things happen automatically if a run goes quiet:

- **Stuck at Queued.** If your run actually started but the status update was missed, Fintela
  catches this on its next check and corrects the study's status for you — no action needed on your
  part.
- **Part of a run disappears.** If a piece of your run is lost for some reason, Fintela marks that
  piece as stopped and records why, when it can.
- **Orphaned trials.** If a trial is still showing Running more than 10 minutes after its study has
  already finished, Fintela marks it as failed with the note *This trial was still running when the
  study stopped, so it never produced a result.* The 10-minute grace period gives a trial that's
  genuinely wrapping up a chance to report its own, more specific reason first.

## Autostop

Turning on a minimum health threshold (autostop) for a study lets Fintela end it early if too many
trials are failing, so you're not left waiting — or paying — for a run that clearly isn't going to
produce good results.

| Rule | Detail |
|---|---|
| Won't trigger until | At least 10 trials have finished |
| How health is measured | Share of finished trials that did not fail (duplicate configurations and trials the engine couldn't evaluate don't count against you) |
| What triggers it | Health drops below the threshold you set |
| What happens | Any trials still running are stopped, and the study ends |
| Status you'll see | Failed, labeled "Stopped automatically" |

Autostop always ends a study as Failed rather than Stopped, because it isn't something you asked
for in the moment — it's the platform protecting you from a run that isn't working out. You'll see
it labeled **Stopped automatically**, with the note *Stopped early: low health*, shown as a warning
rather than an error. From there you can jump straight to **See trial errors** or **Edit strategy
code** to see what went wrong and fix it (see [trial failure reasons](#trial-failure-reasons)).

## Automatic retry after a memory error

Sometimes a run needs more memory than Fintela initially allocated for it. This is the one kind of
failure the platform handles for you automatically — retrying your study before it ever shows up as
Failed — as long as:

- your run hasn't already used up its full trial budget (if it had, a retry couldn't change the
  outcome, so it doesn't happen)
- you haven't already asked to stop the study
- a larger compute size is still available to try

| | |
|---|---|
| Maximum automatic retries | 3, each at a larger compute size |
| Status you'll see | Queued again, as a new run |
| Trials | Any trial still running on the affected piece is marked failed; the rest of your trials are untouched |
| Cost to you | None — you are not charged for the retry |

Because this retry happens before Fintela finalizes the run's outcome, you'll typically never see a
Failed status flash by — the study just goes straight back to Queued. Only if a run runs out of
memory at the largest available size does it settle on **Failed**, labeled *Ran out of memory*. See
[optimizer architecture](/docs/optimizer-architecture) for more on how compute size is chosen for
your studies.

## Stopping a study

You can stop a running study from its results page. Look for the **Stop study** button — it's
active whenever the study is currently running, and disabled (with a tooltip reading *Only running
studies can be stopped.*) otherwise.

Clicking it opens a confirmation:

- **Stop study?**
- *This action will stop the study immediately. Running trials may be interrupted and this action cannot be undone.*
- **Cancel** / **Stop study**

You'll need permission to manage studies in your organization to stop one — if you don't have it,
Fintela lets you know rather than silently doing nothing. And if you try to stop a study that isn't
currently running, you'll see a message telling you there's nothing to stop.

There's no Stop option in the Studies registry's row menu — that menu only offers **Launch**,
**View**, **Edit**, **Duplicate**, and **Delete** (see [studies](/docs/studies) for more on the
registry). To stop a study, open it first.

> [!NOTE] Stopping isn't instant
> Clicking Stop records your request right away, but the study still needs a moment to wind down
> every trial that's in progress. You'll see a **Stopping** badge in the meantime; it settles on
> **Stopped** once everything has actually finished. Trials that were mid-run get marked as failed
> (they didn't produce a usable result); trials that had already finished keep whatever result they
> got.

## Resuming a study

Resuming lets you pick up a Completed or Stopped study and give it more trials to run, rather than
starting over from scratch.

> [!WARNING] Resume isn't available yet
> There's currently no Resume button anywhere in the app — not in the registry, not on a study's
> results page — and the read-only developer API doesn't expose it either. If you want to build on
> a study that already finished or was stopped, duplicate it (from the registry row menu) and
> relaunch with a larger trial count instead. What follows is how resume behaves once it becomes
> available.

- Only studies that are Completed or Stopped can be resumed — a Failed study can't be; duplicate
  and relaunch it instead.
- If your study searches a finite set of parameter combinations and every combination has already
  been tried, there's nothing left to explore, and resume is blocked with a message telling you so.
- You choose how many additional trials to add. If the remaining set of combinations is smaller
  than what you asked for, Fintela quietly caps the number so your new total lands exactly on what's
  actually left to try.
- Resuming counts as a new run: your trial budget goes up by however many additional trials you
  asked for, every trial and portfolio from before is kept, and the new trials build on top of them.
  Because the total budget just grew, don't be surprised if the Progress meter briefly drops back
  below 100% right after you resume — it recovers as the new trials complete.
- A resumed study may take a little longer to actually start than a freshly launched one.

## Deleting a study

Deleting removes a study — and everything produced by it — permanently.

Open the Studies registry, select the study (or studies) you want to remove, and choose **Delete**.
Deleting a single study asks you to confirm: *Are you sure you want to delete the selected study?
If any, associated data will also be deleted.* Deleting multiple studies at once does **not** ask
for confirmation, so double-check your selection before you click it.

Deleting a study requires a higher level of account permission than everyday actions like
launching, editing, or stopping — if your account can't delete studies, talk to whoever manages
permissions for your organization.

> [!CAUTION] There's no undo
> Once you delete a study, it's gone. There's no recycle bin, no restore option, and no grace
> period — the study disappears from your account immediately, and everything behind it (trials,
> portfolios, and their results) is permanently removed shortly afterward. Larger studies are
> cleaned up over a short window in the background rather than all at once, but that's just how the
> removal is processed — it is not a chance to change your mind.

## Trial states

Each trial inside a study has its own status:

| Status | What it means |
|---|---|
| Waiting | This trial's slot has been created but hasn't been picked up to run yet. |
| Running | This trial is currently being evaluated. |
| Complete | This trial finished successfully and produced a usable result. |
| Pruned | This trial ended early without a usable result — for example, it was a duplicate parameter combination, or its fitness value came back invalid. |
| Fail | This trial hit an error and did not complete. |

Complete, Pruned, and Fail are the three ways a trial can end. Both of the study-level meters below
only count trials that have reached one of these three.

| Meter | What it tells you |
|---|---|
| Progress | How much of your requested trial budget has been used: (Complete + Pruned + Fail trials) ÷ trials requested. |
| Health | Of the trials that reached an outcome, what share did **not** fail: 1 − (Failed trials ÷ finished trials). |

Progress can't go above 100% — occasionally a batch of trials that was already in flight finishes
just after your target is technically reached, and that extra work is simply capped rather than
shown as over 100%. On the other hand, a Completed study can legitimately show less than 100%
progress: if your study searches a finite set of parameter combinations and runs out of new ones to
try before reaching your requested trial count, it finishes early. **Completion is always signalled
by the study's status, never by the Progress meter reaching 100%** — don't wait for the bar to fill
before checking the badge.

In the Studies registry, the Health column tooltip reads *Share of trials that produced a usable
result.* and Progress reads *Completed trials over the total requested.*, followed by a running
count like `340/500`. Neither column can be sorted by clicking its header — both refresh
automatically every few seconds, and letting you sort them would make rows jump around while you're
looking at them.

## Trial failure reasons

When a trial doesn't complete, Fintela records a short reason so you can see what happened at a
glance, plus a more structured breakdown that powers the app's error views and suggested next
steps.

| What you might see | Result | Why |
|---|---|---|
| "grid_duplicate: configuration already evaluated" | Pruned | This exact combination of parameters was already tried elsewhere in your study. |
| "engine_artifact: the engine stopped this trial before it could be evaluated (watchdog timeout in a risk manager)" | Pruned | The simulation engine couldn't evaluate this trial in time and gave up on it — not a fault in your strategy. |
| "nan_fitness" | Pruned | The fitness calculation came back as an invalid number for this trial. |
| "period_metrics_out_of_bounds" | Pruned | No usable performance data came back for one of the periods being evaluated. |
| "pruned_during_fitness" | Pruned | Your fitness logic itself signaled that this trial should be skipped. If you're using an external fitness endpoint, a connection problem there is reported with its own, more specific reason. |
| "signal_generation_pruned" | Pruned | Your strategy logic itself signaled that this trial should be skipped. |
| "runtime_terminated_before_trial_completed" | Fail | The run hit an error partway through, and this trial didn't get to finish (the exact message includes more detail on what happened). |
| "This trial was still running when the study stopped, so it never produced a result." | Fail | The study ended, or was stopped, before this trial could complete. |

> [!TIP] Two of these don't count against your health score
> "grid_duplicate" and "engine_artifact" are excluded from your study's Health number entirely —
> they're not really failures, just the platform pruning duplicate work or an evaluation it
> genuinely couldn't complete. Every other Pruned or Fail result counts against Health.
>
> They still count toward Progress, though, and that's intentional: Health answers "of the trials
> that produced an outcome, how many failed?", while Progress answers "how much of my trial budget
> have I used?" — and both of these used up a trial slot either way.

Everything else gets classified into a broader category with a plain-language title you'll see on
the study's failure notice. These are the categories the platform itself can produce, separate from
failures that come from your own strategy or fitness code:

| Title you'll see | When it happens |
|---|---|
| Ran out of memory | The run needed more memory than was available, even at the largest size Fintela tried. |
| Run was interrupted | The run was cut off before it could finish, for reasons outside your study itself. |
| The machine was shut down | The underlying compute for your run was shut down mid-way. |
| No compute available | Fintela couldn't find capacity to run your study when it tried to start it. |
| The run never started | Your study failed before any trial could begin. |
| Couldn't start the run | Fintela rejected the run before it began. |
| Lost track of the run | Fintela lost contact with part of your run and couldn't recover it. |
| Stopped unexpectedly | The run ended without a specific reason being captured. |
| Stopped automatically | Autostop ended the study because health dropped below your threshold (see [Autostop](#autostop)). |
| Trial didn't finish | This trial was still in progress when its study ended. |

If you're pulling this information through the developer API, you'll see these same categories
represented as short codes rather than the full titles above.

Depending on what went wrong, a failure notice may offer one or more suggested next steps as
buttons. The full set of possible suggestions is: **Duplicate & relaunch**, **Duplicate & change
Asset Group**, **Duplicate & reduce scope**, **Duplicate & change dates**, **Edit strategy code**,
**Edit data pipelines**, **Edit risk manager**, **Edit fitness function**, **Edit endpoint
settings**, **See trial errors**, **Resume study**, **Run again**, **Contact support**, and **Buy
tokens**.

Not every suggestion above is currently clickable everywhere it's shown — in this version of
Fintela, a failed study's notice will realistically offer you the relevant edit link, **See trial
errors**, and at most one duplicate option (Fintela picks the single most relevant one rather than
showing all four). **Resume study**, **Contact support**, and **Buy tokens** aren't available as
buttons anywhere yet, and **Run again** only appears inside the strategy and fitness sandboxes, not
on a study's own failure notice.

If a trial fails because of code you've connected from outside Fintela, see
[external strategies](/docs/external-strategies) and
[external fitness](/docs/external-fitness) for how those failures are reported.

## Checking on your studies from outside the app

Everything covered on this page — status, progress, health, stage-by-stage detail, and trial errors
— is visible directly in the app: the Studies registry, a study's Overview, and its results page.
While a study is active, these views refresh automatically every few seconds so you don't have to
reload; once a study is finished, they stop polling.

If you'd rather pull this information into your own tools or dashboards, Fintela also offers a
read-only developer API. Generate a personal access key from your account settings, and you can
securely fetch your studies' status, progress, health, and trial-level errors into your own systems.
It's read-only by design — nothing in the developer API can launch, stop, resume, or delete a
study, or change anything else about your account. Every action that spends tokens or starts
compute has to go through the app itself, which keeps your billing and your running studies
consistent. See the [studies API](/docs/api-studies) guide for details on getting started, and
[API errors](/docs/api-errors) for how error responses are structured.

If you try to do something a study's current status doesn't allow — launching a study that's
already running, editing one that's already launched, or changing its risk managers after launch —
you'll see a clear message explaining why, for example:

- *This study has already been launched, so it can't be launched again. Duplicate it to run a new one.*
- *This study has already been launched, so it can't be edited. Duplicate it to change anything.*
- *This study has already been launched, so its risk managers can't be changed. Duplicate it to attach different ones.*
