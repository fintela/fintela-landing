---
title: Study lifecycle
section: Configuration & Advanced
sectionOrder: 8
order: 3
published: true
updated: 2026-08-18
summary: Every state a study and a trial can be in, and what moves them between states.
keywords: lifecycle, state machine, queued, running, completed, failed, paused, stopped, pruned, resume, heartbeat, soft delete
---

A study has exactly one execution status at any moment, and each of its trials has its own,
separate state. The study status lives in `developers.study_runtime_status.last_status` — the
`developers.studies` row itself has no status column at all — and takes exactly six values. Trial
state is the Postgres enum `developers.trialstate` and takes exactly five. This page is the
complete map: every value, every transition, what writes it, and how stalls, stops, resumes and
deletes behave.

## Study statuses

Six values, defined in `frontend/src/domains/studies/types.ts` and written by the backend, the
optimization-dispatcher and the status-updater.

| `last_status` | Meaning | Registry badge | Study results badge |
|---|---|---|---|
| `SAVED` | Created and never launched. Editable. | `Draft` | `Draft` |
| `QUEUED` | Launch accepted and paid for; waiting on the dispatcher. | `Queued` | `Queued` |
| `RUNNING` | At least one optimizer task is live in ECS. | `Running` | `Running` |
| `COMPLETED` | Every task of the current run finished, and the `optimize` stage succeeded. | `Completed` | `Completed` |
| `FAILED` | A core stage failed, or a task failed with no evidence that `optimize` succeeded. | `Failed` | `Failed` |
| `STOPPED` | Every task finished after a user-requested stop. | `Stopped` | `Stopped` |

The registry badge (`StudyStatusIconBadge`) also accepts three legacy aliases when it meets them
on the wire: `PENDING` renders as `Queued`, and `COMPLETE` / `FINISHED` render as `Completed`. An
unrecognised value renders verbatim; a `null` status renders as an em dash.

> [!WARNING] There is no `PAUSED` state
> No layer of the platform has one — no enum value, no column, no endpoint, no button. Any
> reference to pausing a study, including the in-app help drawer, is stale.

### Desired status

`study_runtime_status.desired_status` is the target the reconcilers steer toward. It takes three
values.

| `desired_status` | Set when |
|---|---|
| `SAVED` | On create and on duplicate, alongside `last_status = 'SAVED'`. |
| `RUNNING` | On launch and on resume. |
| `STOPPED` | On `POST /studies/stop`, on autostop, and by the status-updater once every task of the run is terminal. |

Stops and autostops work through this field: the study-level intent is written first, and the
status-updater sends the ECS stop signal on its next tick.

### Display status and the UI verdict

`GET /studies/lifecycle` adds `display_status`, which is `execution_status` except for one
display-only value: it is `STOPPING` while `stop_requested_at` is set and `execution_status` is
still `RUNNING` or `QUEUED`. `STOPPING` is never persisted.

The SPA renders a derived verdict (`studyVerdict`), never `execution_status` directly, because a
completed study whose post-run analysis failed must not paint red next to a 100% health badge.

| Verdict | Condition | Label shown |
|---|---|---|
| `draft` | `execution_status = SAVED` | `Draft` |
| `queued` | `execution_status = QUEUED` | `Queued` |
| `running` | `execution_status = RUNNING` | `Running` |
| `stopping` | `display_status = STOPPING` | `Stopping` |
| `completed` | `COMPLETED`, no secondary stage failed or pending | `Completed` |
| `completed_with_warnings` | `COMPLETED`, at least one secondary stage `FAILED` | `Completed` |
| `completed_pending` | `COMPLETED`, at least one secondary stage still unproduced | `Completed` |
| `failed` | `execution_status = FAILED` | `Failed` |
| `stopped` | `execution_status = STOPPED` | `Stopped` |

`results_usable` on the lifecycle payload is independent of any warning: it is true when the
`optimize` stage succeeded, so a `completed_with_warnings` study still has trustworthy portfolios.

## Study state machine

```text
                    POST /studies                    POST /studies
                    (launch_now: false)              (launch_now: true)
                          │                                │
                          ▼                                │
                       SAVED ───── POST /studies/:id/launch ┤
                          │         (CAS on last_status)    │
                          │                                 ▼
   POST /studies/risk-manager-optimization ───────────►  QUEUED
                                                           │
                                    dispatcher launches    │
                                    the first ECS task     │
                                                           ▼
                                                        RUNNING
                                                           │
              ┌────────────────────────────┬───────────────┼───────────────┐
              │ all tasks terminal,        │ all tasks     │ all tasks     │
              │ optimize SUCCEEDED         │ terminal,     │ terminal,     │
              │                            │ core stage    │ stop_requested│
              ▼                            ▼ FAILED        ▼               │
          COMPLETED                     FAILED          STOPPED            │
              │                            │                │              │
              │  POST /studies/resume      │ OOM: memory-   │  POST        │
              └────────────┬───────────────┤ tier escalation└──/studies/   │
                           │               │ (automatic,     resume        │
                           │               │  ≤ 3 times)      │            │
                           ▼               ▼                  ▼            │
                        QUEUED  ◄──────────┴──────────────────┘            │
                                                                           │
   DELETE /studies  ──►  deleted_at set (from ANY state) ──► purged ◄───────┘
```

`FAILED` is **not** resumable by hand. The only automatic `FAILED → QUEUED` edge is the
out-of-memory escalation described below.

## Transition triggers

| From | Event | To | Written by |
|---|---|---|---|
| — | `POST /studies` with `launch_now: false` | `SAVED` / desired `SAVED` | Backend, in the create transaction |
| — | `POST /studies` with `launch_now: true` | `SAVED`, then immediately launched | Backend; create commits first, then calls the same `launch` path |
| — | `POST /studies/:study_id/duplicate` | `SAVED` / desired `SAVED` | Backend; runtime status is not copied from the source |
| — | `POST /studies/risk-manager-optimization` | `QUEUED` / desired `RUNNING` | Backend; these studies skip `SAVED` entirely |
| `SAVED` | `POST /studies/:study_id/launch` | `QUEUED` / desired `RUNNING` | Backend, compare-and-set on `last_status = 'SAVED'` |
| `QUEUED` | Dispatcher launches the run's first ECS task | `RUNNING`, `started_at` set | optimization-dispatcher |
| `QUEUED` | Dispatcher self-heal: tasks already dispatched but the promotion was missed | `RUNNING` | optimization-dispatcher |
| `QUEUED` | Every launch failed — task rows exist, all carry a `failure_message` | `FAILED` | status-updater |
| `RUNNING` | Every task of the run is terminal, `optimize` reached `SUCCEEDED` | `COMPLETED` | status-updater |
| `RUNNING` | Every task terminal, a core stage is `FAILED` (or no stage evidence and a task failed) | `FAILED` | status-updater |
| `RUNNING` | Every task terminal and `stop_requested_at` is set | `STOPPED` | status-updater |
| `FAILED` | An out-of-memory kill with a larger memory tier still available | `QUEUED`, `run_seq + 1` | status-updater |
| `COMPLETED` \| `STOPPED` | `POST /studies/resume` | `QUEUED`, `run_seq + 1` | Backend |
| any | `DELETE /studies` | `deleted_at` set; row leaves every read | Backend |

The launch path clears `finished_at`, `stop_requested_at`, `stop_requested_by`, `failure_message`
and `failure_diagnostic` in the same transaction as the status flip, opens the `queued` stage, and
issues `NOTIFY optimization_dispatch` so the dispatcher wakes within milliseconds instead of
waiting for its poll interval.

A stop beats a failure in the aggregation rule: because a stop is delivered as `SIGTERM`, the
tasks it kills record failures, and reporting the user's own stop back as "failed" would blame
them for their own action. The test is `stop_requested_at`, which only `POST /studies/stop` writes
— not `desired_status`, which autostop also sets.

## Stages inside a run

While a study is `RUNNING`, the finer-grained state lives in `developers.study_stages`, one row per
`(study_id, run_seq, stage)`. `GET /studies/lifecycle` always returns the full ordered pipeline,
synthesizing `PENDING` for stages not yet reached.

| Stage key | Label | Kind |
|---|---|---|
| `queued` | `Queued` | core |
| `provisioning` | `Starting up` | core |
| `data_loading` | `Data loading` | core |
| `strategy` | `Strategy` | core |
| `fitness` | `Fitness` | core |
| `preflight` | `Pre-flight` | core |
| `optimize` | `Optimization` | core |
| `robustness` | `Robustness` | secondary |
| `families` | `Families` | secondary |
| `importances` | `Parameter importances` | secondary |

Three further stage names exist in the vocabulary but are non-positional — they say where a failure
came from rather than occupy wall clock: `validation` (`Before launch`), `runtime`
(`While running`) and `unknown`.

Each stage row carries a `status` of `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED` or `SKIPPED`, plus
`attempts`, a `diagnostic`, and an `origin` of `inline`, `out_of_band`, `recovered` or `backfill`.
Only `inline` rows have a trustworthy duration; the others were measured off-run and the UI renders
their duration as unknown rather than zero.

> [!NOTE] A secondary-stage failure is not a failed study
> `robustness`, `families` and `importances` run after the study's deliverable already exists. A
> failure there yields `COMPLETED` with `degraded: true` and `results_usable: true` — never a red
> "Failed" study. Roughly a quarter of studies get at least one secondary artifact out of band,
> after the study already reads `COMPLETED`, which is why the lifecycle query keeps polling at 60 s
> for up to 30 minutes past `finished_at`.

## Heartbeats and stall detection

`developers.study_task_status.last_heartbeat` is per ECS task. The lifecycle payload reports
`MAX(last_heartbeat)` across the study's tasks **for the current `run_seq`**.

| Field | Rule |
|---|---|
| `last_heartbeat` | Written by the dispatcher when it launches a task, and by the status-updater every time the task's ECS status changes. |
| `heartbeat_stale` | `true` when `execution_status = 'RUNNING'` and `now − max(last_heartbeat, started_at) > 300 s` (`HEARTBEAT_STALE_SECS = 5 * 60`). |

`heartbeat_stale` is computed by the backend and served on `GET /studies/lifecycle`. No surface in
the app renders a stalled badge today — treat it as an API signal, not a UI state.

Three separate mechanisms clean up after a dead run:

- **Stuck at `QUEUED`.** If a prior dispatcher tick launched the tasks but the promotion write was
  lost, a later tick promotes the study to `RUNNING`, guarded on at least one task row carrying an
  `ecs_task_arn`. A study whose launches all failed is deliberately left `QUEUED` for the
  status-updater to resolve to `FAILED`, which is also what makes its tokens refundable.
- **Task no longer known to ECS.** The status-updater marks the task `STOPPED`, nulls its
  `ecs_task_arn`, and classifies the stop into a diagnostic.
- **Orphaned trials.** Trials still in `RUNNING` on a study that finished more than 10 minutes ago
  are stamped with the `TRIAL_ABANDONED` diagnostic — *This trial was still running when the study
  stopped, so it never produced a result.* — and moved to `FAIL`. The 10-minute grace exists so a
  task that is mid-shutdown gets to write its own, more specific reason first.

## Autostop

Setting `autostop_min_health` on a study lets the platform end it early when too many trials are
failing.

| Condition | Value |
|---|---|
| Minimum terminal trials before the check fires | 10 |
| Health formula | `1 − failed_trials / total_trials`, over terminal trials only, health-neutral reasons excluded from both sides |
| Trigger | Health strictly below `autostop_min_health` |
| Effect | A failure message is stamped on every still-active task, then `desired_status = 'STOPPED'` |
| Terminal status | `FAILED`, with the diagnostic kind `AUTOSTOPPED_LOW_HEALTH` |

Autostop does **not** set `stop_requested_at`, which is exactly why the study lands on `FAILED`
rather than `STOPPED`, and why it never displays as `STOPPING`. The user-facing copy is *Stopped
automatically* / *Stopped early: low health*, and its suggested actions are **See trial errors**,
**Resume study** and **Edit strategy code**.

## Automatic retry after an out-of-memory kill

An OOM kill is the one failure the platform retries by itself. When every task of the run is
terminal, an OOM was observed, the study is not stopped, unfinished trials remain, and completed +
pruned trials are still below `n_trials`, the status-updater moves the study to the next memory
tier and re-queues it.

| Property | Value |
|---|---|
| Memory tiers, in order (MiB) | `49152` → `73728` → `98304` → `122880` |
| Maximum escalations per study | 3 (`chk_studies_task_size_escalations` allows 0–3) |
| Status transition | `FAILED` → `QUEUED`, `run_seq + 1`, `failure_message` and `failure_diagnostic` cleared |
| Cost to you | None — the under-estimate was the platform's |

A study that OOMs at the largest available shape is left `FAILED`, with the diagnostic kind
`OUT_OF_MEMORY`. See [optimizer architecture](/docs/optimizer-architecture) for how task shape is
chosen in the first place.

## Stopping a study

```http
POST /studies/stop?study_ids=41,42
```

Ids go in the **query string**, not the body. The response is `200 {"data": [41, 42]}`.

| Check | Failure |
|---|---|
| Permission `study:create` | `403` — `Missing permission 'study:create'` |
| Every id belongs to your organization | `406` — `One or more study ids do not belong to your organization` |
| **Every** requested study has `desired_status = 'RUNNING'` | `406` — `This study isn't running, so there's nothing to stop.` |

The precondition is all-or-nothing: one non-running id rejects the whole call.

In the app, Stop lives only on the study results page (`Registry → Studies → View`, which opens
`/analysis/portfolios?studyId=<id>`). The button is labelled **Stop study**; it is disabled unless
the live runtime status is running, with the tooltip **Only running studies can be stopped.** The
confirmation dialog reads:

- Title: **Stop study?**
- Body: **This action will stop the study immediately. Running trials may be interrupted and this action cannot be undone.**
- Buttons: **Cancel** / **Stop study**

There is no Stop action in the Studies registry row menu — that menu has exactly five entries:
**Launch**, **View**, **Edit**, **Duplicate**, **Delete**. See [studies](/docs/studies) for the
registry surface.

Stopping is not instantaneous. The backend records the intent; the status-updater signals ECS on
its next tick; the study reads `Stopping` in the meantime and settles on `STOPPED` once every task
is terminal. Trials that were in flight are reaped to `FAIL`; trials already settled are kept.

## Resuming a study

```http
POST /studies/resume
Content-Type: application/json

{ "study_id": 42, "additional_trials": 500 }
```

| Check | Failure |
|---|---|
| Permission `study:create` | `403` — `Missing permission 'study:create'` |
| Study belongs to your organization | `406` — `Study does not belong to your organization` |
| `last_status` is `COMPLETED` or `STOPPED` | `406` — `Only studies that finished or were stopped can be resumed.` |
| The finite grid still has unexplored configurations | `406` — `Search space exhausted: this study's finite grid has {grid} configuration(s) and {executed} distinct configuration(s) already ran. There is nothing left to explore.` |

`FAILED` studies cannot be resumed — `check_for_resumable_studies` accepts only `COMPLETED` and
`STOPPED`. Duplicate and relaunch instead.

The grid gate counts **distinct parameter configurations**, not trials, because duplicate configs
are recorded as `grid_duplicate` prunes and would otherwise overstate coverage. When the grid is
finite but not exhausted, `additional_trials` is silently trimmed so the new total lands exactly on
the grid size.

A successful resume, in one transaction:

| Change | Detail |
|---|---|
| `studies.n_trials` | `+= additional_trials` (after any grid trim) |
| `last_status` / `desired_status` | `QUEUED` / `RUNNING` |
| `run_seq` | `+= 1` — this counts as a new run, so notifications and stage rows do not collide with the previous one |
| Cleared | `started_at`, `finished_at`, `stop_requested_at`, `stop_requested_by`, `failure_message`, `failure_diagnostic` |
| `portfolio_update_status` | The study's daily-recompute row is deleted |
| `study_stages` | The `queued` stage is reopened for the new `run_seq` |

Every trial and portfolio from earlier runs is kept; the new trials accumulate on top. Because
`n_trials` grows, reported progress drops back below 100% the moment the resume commits.

> [!NOTE] Resume has no UI and does not wake the dispatcher
> Nothing in the app calls `POST /studies/resume` in this build — it is API-only. And unlike
> launch, resume does not issue `NOTIFY optimization_dispatch`, so a resumed study waits for the
> dispatcher's next poll rather than starting within milliseconds.

## Deleting a study

```http
DELETE /studies
Content-Type: application/json

[41, 42]
```

The body is a bare JSON array of study ids. The permission checked is **`root:all`**, not a
studies-specific one — stricter than every other study route.

Deletion sets `developers.studies.deleted_at` and returns in milliseconds. The row immediately
disappears from every read: the dispatcher's selection query, the registry list, and each
`study_ids` endpoint all filter on `deleted_at IS NULL`.

> [!CAUTION] Soft delete is not a recycle bin
> There is no retention window, no restore endpoint and no undelete UI. A background worker in the
> backend picks up the oldest soft-deleted study on its next tick (default `CLEANUP_INTERVAL_SECS`
> is 300) and permanently purges it in bounded chunks — portfolios and their cascade first, then
> trials, then the study row. The bounding exists so a ten-thousand-portfolio study does not blow
> the statement timeout; it is not a grace period.

In the registry, single-row **Delete** opens a confirmation reading *Are you sure you want to
delete the selected study? If any, associated data will also be deleted.* The bulk **Delete**
action fires with no confirmation dialog.

## Trial states

The Postgres enum `developers.trialstate`, unchanged from Optuna's own schema:

| State | Meaning |
|---|---|
| `WAITING` | Row allocated, not yet dispatched |
| `RUNNING` | In flight — the optimizer writes every row of a batch up front via `ask()`, so a row's existence means "requested", not "started work" |
| `COMPLETE` | Succeeded; the fitness value was reported back to the sampler |
| `PRUNED` | Settled without a value — the most common terminal state for a trial that did not produce a result |
| `FAIL` | Hard failure: a batched simulation error, a per-payload engine error, or a trial reaped after its task died |

`COMPLETE`, `PRUNED` and `FAIL` are the three terminal states. Both study meters count only those:

| Meter | Formula | Source |
|---|---|---|
| Progress | `min(terminal_trials / n_trials, 1)` — `null` when `n_trials = 0` | `GET /studies/progress` |
| Health | `1 − failed_trials / total_trials` — `null` when `total_trials = 0` | `GET /studies/health` |

Progress is clamped at 1 because a sibling task's in-flight batch can settle after the grid is
already covered. Conversely, a `COMPLETED` study can legitimately sit below 100%: when a finite
grid is exhausted before `n_trials` is reached, the run ends early. **Completion is signalled by
status, never by progress reaching 1.0.**

The registry's Health tooltip reads **Share of trials that produced a usable result.** and its
Progress tooltip **Completed trials over the total requested.** Neither column is sortable — both
refetch every 5 s and would reorder rows under the cursor.

## Trial failure reasons

A trial that does not complete carries two system attributes in
`developers.trial_system_attributes`:

| Key | Contents |
|---|---|
| `failure_reason` | A one-line string. For recognized classes it is a curated sentence; for unrecognized ones it is the raw text, because the public API and the frontend's legacy pattern table both match on it. |
| `failure_diagnostic` | The structured record: `{ stage, kind, message, source_key, tickers, user_line, suggested_actions[], raw, params?, detail?, severity? }`. `raw` is always `null` over the wire. |

The SPA keys its copy off `kind`, never off `message` — 72 kinds have translated copy in
`failures.json`. Buckets in the error summary collapse by `kind` as well, so identical failures
that interpolate different tickers or counts render as one bar.

These reason strings are a documented contract and are written verbatim:

| `failure_reason` | Trial state | Written when |
|---|---|---|
| `grid_duplicate: configuration already evaluated` | `PRUNED` | The sampler handed back a point this task already evaluated on a finite grid, pruned before any simulation |
| `engine_artifact: the engine stopped this trial before it could be evaluated (watchdog timeout in a risk manager)` | `PRUNED` | The engine preempted the batch twice and the trial was never evaluated |
| `nan_fitness` | `PRUNED` | Train, validation or overall fitness came back `NaN` |
| `period_metrics_out_of_bounds: [...]` | `PRUNED` | The engine returned no metrics for the train, validation or overall period |
| `pruned_during_fitness` | `PRUNED` | The fitness evaluator raised a prune with no message — an external fitness endpoint's transport failures surface here |
| `signal_generation_pruned` | `PRUNED` | Signal generation raised a prune with no message |
| `runtime_terminated_before_trial_completed: {error}` | `FAIL` | The task exited through its error path and reaped its own still-running trials |
| `This trial was still running when the study stopped, so it never produced a result.` | `FAIL` | The status-updater reaped an orphan 10 minutes after the study finished |

> [!TIP] Two reasons are health-neutral
> `grid_duplicate` and `engine_artifact` are excluded from **both** the numerator and the
> denominator of every health ratio, from the autostop check, and from every error surface. A grid
> study prunes duplicates by design, and a trial the engine could not evaluate is an absence rather
> than a failure. Every other prune counts as a failure.

Everything else is classified into a diagnostic kind. The run-level kinds the platform itself
produces — as opposed to the ones the optimizer derives from a strategy or fitness error — are:

| Kind | Title shown |
|---|---|
| `OUT_OF_MEMORY` | Ran out of memory |
| `RUN_INTERRUPTED` | Run was interrupted |
| `HOST_TERMINATED` | The machine was shut down |
| `CAPACITY_UNAVAILABLE` | No compute available |
| `STARTUP_FAILED` | The run never started |
| `LAUNCH_REJECTED` | Couldn't start the run |
| `RUN_LOST` | Lost track of the run |
| `RUN_FAILED_UNKNOWN` | Stopped unexpectedly |
| `AUTOSTOPPED_LOW_HEALTH` | Stopped automatically |
| `TRIAL_ABANDONED` | Trial didn't finish |

Each diagnostic carries suggested actions, rendered as buttons: **Duplicate & relaunch**,
**Duplicate & change Asset Group**, **Edit strategy code**, **Edit risk manager**, **Edit fitness
function**, **Duplicate & reduce scope**, **Contact support**, **See trial errors**, **Buy
tokens**, **Duplicate & change dates**, **Edit endpoint settings**, **Resume study**, **Run
again**.

For trials that fail inside a user-hosted endpoint, see
[external strategies](/docs/external-strategies) and
[external fitness](/docs/external-fitness).

## Reading lifecycle state over the API

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /studies/lifecycle?study_ids=<csv>` | The whole execution state per study | Single source of truth: `execution_status`, `desired_status`, `display_status`, `current_stage`, the full `stages` array, `heartbeat_stale`, `eta`, `progress`, `health`, `results_usable`, `degraded`, `failure_diagnostic` |
| `GET /studies/status?study_ids=<csv>` | `last_status`, `desired_status`, timestamps, `failure_diagnostic` | The registry status column reads only this, never the 60-second-stale metadata snapshot |
| `GET /studies/progress?study_ids=<csv>` | `{id: number\|null}` | The only progress source — the registry has no fallback |
| `GET /studies/health?study_ids=<csv>` | `{id: number\|null}` | |
| `GET /studies/errors?study_ids=<csv>` | `{ error_summary[], failed_trials[] }` | Per-trial reasons and diagnostics |

All five require `study:read`. Polling adapts to state: 5 s while any study is `QUEUED`, `RUNNING`
or `PENDING`, widened to 30 s while the realtime stream is connected, and stopped entirely once
everything is terminal. `GET /studies/metadata` and `GET /studies` cache for 60 s and never poll.

The public developer API exposes read-only copies of `/studies/metadata`, `/studies/progress`,
`/studies/health`, `/studies/status` and `/studies/errors`. It does **not** expose
`/studies/lifecycle`, and it exposes no mutation at all — launching, stopping, resuming and
deleting all move optimizer workload, so they stay on the authenticated app backend. See
[studies API](/docs/api-studies) and [API errors](/docs/api-errors).

Errors on the stop and resume routes use `406 Not Acceptable`, not `400`. Attempting to launch or
edit an already-launched study returns `409 Conflict` with the message `Invalid study status
transition: This study has already been launched, so it can't be launched again. Duplicate it to
run a new one. (study {id})`.
