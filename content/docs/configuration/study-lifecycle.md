---
title: Study lifecycle
section: Configuration
sectionOrder: 3
order: 4
published: true
updated: 2026-08-04
summary: Status badges and state transitions for studies and trials.
keywords: state machine, queued, running, completed, failed, paused, stopped, pruned, resume, soft delete, heartbeat
---

Every study you create moves through a sequence of states visible as color-coded badges in
the UI. This page explains what each state means, when it transitions, and what actions you
can take.

## Status badges in the UI

`Registry → Studies`

The study list and study detail page show a status badge on every study. Here's what each
badge means and what you can do:

| Badge | Meaning and available actions |
|---|---|
| `QUEUED` | Waiting for a worker. No action needed — the optimizer picks it up automatically. |
| `RUNNING` | Actively running trials. You can pause or stop from the action menu. |
| `COMPLETED` | All trials finished. Results are in Analytics → Portfolios. You can resume with more trials. |
| `PAUSED` | No new trials dispatched. In-flight trials finish. Resume from the action menu. |
| `STOPPED` | Permanently halted. Cannot be restarted as-is, but you can resume with additional trials. |
| `FAILED` | The optimizer hit an unrecoverable error (or autostop triggered). Check the error log. |

## Study state machine

```text
                          all trials done
                        ┌────────────────────► COMPLETED
                        │
  QUEUED ─────────────► RUNNING ─────────────► STOPPED
    ▲   a worker        │     stop request
    │   picks it up     │
    │                   └────────────────────► FAILED
    │                     autostop /
    │                     unrecoverable
    │
    └──── resume (from any terminal state) ────┘
```

Every study tracks two independent status values:

| Field | Meaning |
|---|---|
| Observed status | The current real state — updated by the optimization engine and cleanup jobs |
| Desired status | The target state — set when you stop or resume the study from the app |

Reconciliation between the two values is how stops and resumes propagate. The optimization
engine polls studies where the observed and desired states disagree and takes action
accordingly.

## Task state machine

Each optimizer worker task has its own lifecycle:

```text
PENDING ── started ──► RUNNING ── trials done ──► COMPLETED
                          │
                          └── unrecoverable error ──► FAILED
```

The task carries `last_heartbeat` for liveness detection — a missing heartbeat past a
threshold marks the task `FAILED` and the study transitions accordingly.

## Trial states

| State | When |
|---|---|
| WAITING | Allocated but not yet executed |
| RUNNING | Currently sampling and simulating |
| COMPLETE | Succeeded — fitness reported to the search algorithm |
| PRUNED | Caught exception, NaN fitness, empty signal, missing key |
| FAIL | Hard failure (rare — typically internal error in the optimizer) |

`PRUNED` is the most common terminal state for failed trials — external endpoint hiccups,
NaN fitness, and empty signals all map here. The reason is stored as `failure_reason` and
visible under `GET /studies/errors`.

## Resume a study

`Registry → Studies → Resume`

Any terminal study (COMPLETED, STOPPED, or FAILED) can be resumed from the action menu in the
study list — click **Resume** and enter how many additional trials to add:

```text
resume + 500 additional trials

→ study transitions: COMPLETED / STOPPED / FAILED  →  QUEUED
```

The optimization engine picks up the study on its next scheduling cycle and launches a fresh
worker. All prior trial data and portfolios are preserved — the new trials accumulate on top.

> [!NOTE] Sampler memory survives resume
> The sampler's learned state is persisted alongside the trials, so resuming doesn't reset
> learned distributions. New trials continue from where the old ones left off.

## Soft delete

Deleting a study from the app soft-deletes the record — it disappears from the study list and
from every API read, but all trial and portfolio data is retained. A background job
permanently purges the data after a configurable retention window. This protects against
accidental destruction.
