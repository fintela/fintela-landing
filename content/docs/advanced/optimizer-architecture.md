---
title: Optimizer architecture
section: Configuration & Advanced
sectionOrder: 8
order: 6
published: true
updated: 2026-08-18
summary: How the optimization engine, simulation engine and storage actually fit together.
keywords: architecture, optimizer, simulation engine, dispatcher, workers, ecs, parallelism, persistence, optuna, internals
---

Launching a study does not hand your work to a single machine. It writes one row, and a chain of
independent services picks it up from there: a singleton dispatcher claims the queued study and
launches on-demand Fargate tasks for it, each task runs an Optuna ask/tell loop over a batched
Rust simulation engine, and a second singleton reconciles what the container actually did back
onto the study. None of these services calls another over HTTP — Postgres carries every piece of
shared state between them, which is why a crashed component loses work but never loses state.

## The moving parts

| Component | Where it runs | Role |
|---|---|---|
| `backend` | Long-running ECS service behind the ALB | Owns `/studies/*`, flips the study to `QUEUED`, charges tokens, serves every read the SPA makes |
| `optimization-dispatcher` | Long-running ECS worker, `desired_count: 1`, 256 CPU units / 512 MiB | Claims `QUEUED` studies, decides the task layout and size, calls ECS `RunTask` |
| Optimizer task | On-demand Fargate task, task-definition family `fintela-train`, 16384 CPU units / 49152 MiB by default | `train.py` + `optimizer_runner.py` — the actual optimization loop |
| `fintela_simulation_engine` | Rust extension module **inside** the optimizer task | Batched backtest over the whole trial batch |
| `status-updater` | Long-running ECS worker, `desired_count: 1`, 256 CPU units / 512 MiB | Polls ECS per task, aggregates task rows into the study, autostops, escalates OOMs, refunds tokens |
| `portfolio-dispatcher` / `portfolio-updater` | Worker + on-demand task | Extend the study's portfolios daily, after it finishes and only if `daily_updates_enabled` |
| Aurora Postgres | — | The only shared state, and Optuna's own storage backend |

> [!NOTE] The `simulation-engine` HTTP service is not on this path
> There is a separate Rust HTTP service called `simulation-engine` (container port 7777,
> `POST /simulate`, `POST /simulate/periods`, `POST /curve/*`). Inside the platform its only
> caller is `strategy-sandbox`, which runs the one-off backtest behind strategy validation. The
> optimizer never calls it: it links the same engine crate in-process as the Rust extension
> module `fintela_simulation_engine`.

## Runtime topology

```text
  Browser (SPA)
      │  POST /studies/:id/launch                GET /events  (SSE, org-scoped)
      ▼                                                ▲
  ┌────────────────────────────────────────────────────┴─────────┐
  │ backend                                                      │
  │  · CAS study_runtime_status: SAVED → QUEUED                  │
  │  · opens the `queued` stage in the same transaction          │
  │  · NOTIFY optimization_dispatch                              │
  └───────────────┬──────────────────────────────────────────────┘
                  │        Aurora Postgres — the only inter-service channel
                  ▼
  ┌────────────────────────────────┐      ┌───────────────────────────────┐
  │ optimization-dispatcher        │      │ status-updater                │
  │ singleton (advisory lock)      │      │ singleton loop                │
  │  · LISTEN optimization_dispatch│      │  · DescribeTasks per task     │
  │  · timed poll as the safety net│      │  · task rows → study row      │
  │  · vCPU-quota admission        │      │  · autostop · OOM escalation  │
  │  · compute_layout → N tasks    │      │  · refunds · notifications    │
  └───────────────┬────────────────┘      └───────────────┬───────────────┘
                  │ ECS RunTask (fintela-train)           │ ecs:StopTask
                  ▼                                       │
  ┌───────────────────────────────────────────────┐       │
  │ optimizer task — one per slice of n_trials    │◄──────┘
  │  train.py           load data, build panel    │
  │  optimizer_runner   Optuna ask/tell batches   │
  │   ├ ProcessPool(batch_size)  signals  ────────┼──► your endpoint POST /simulate
  │   ├ fintela_simulation_engine (Rust, rayon)   │       (EXTERNAL strategy only)
  │   ├ ProcessPool(batch_size)  fitness  ────────┼──► your endpoint POST /evaluate
  │   └ writer thread  register_batch             │       (EXTERNAL fitness only)
  └───────────────┬───────────────────────────────┘
                  │ trials · portfolios · equity · metrics
                  ▼
        developers.*  +  public.entity_metrics
```

## Dispatch: from QUEUED to a running task

`POST /studies/:id/launch` (and `POST /studies` with `launch_now: true`, which calls the same
code) does three things in one transaction — compare-and-swap `study_runtime_status` from `SAVED`
to `QUEUED`, clear the previous run's `finished_at` / `stop_requested_at` / `failure_message` /
`failure_diagnostic`, and open the `queued` lifecycle stage. After the commit it issues
`NOTIFY optimization_dispatch`.

The dispatcher holds a dedicated `LISTEN` connection for that channel — deliberately not drawn
from its work pool — and falls back to a timed poll (`POLL_INTERVAL_SECS`, a required setting)
whenever no notification arrives. So a launch is normally picked up in milliseconds, and a missed
`NOTIFY` costs at most one poll interval.

> [!WARNING] Resume and OOM-retry do not send a wake-up
> `POST /studies/resume` and the automatic OOM escalation both set the study back to `QUEUED`
> without a `NOTIFY`. Those studies wait for the dispatcher's next periodic tick, not for
> milliseconds.

Exactly one dispatcher may run. It takes `pg_try_advisory_lock(hashtext('optimization-dispatcher-singleton'))`
at startup and exits if it cannot get it; it re-checks that the lock session is still alive on
every tick and exits if it is not, so ECS restarts it rather than letting two instances
double-launch a study.

### Admission control

Each tick selects every study `WHERE last_status = 'QUEUED' AND desired_status = 'RUNNING' AND
deleted_at IS NULL`, oldest first by `study_runtime_status.created_at`, then gates on account vCPU
headroom:

| Quantity | How it is computed |
|---|---|
| `available_vcpus` | `quota.limit − quota.utilization` |
| Quota read | Fargate On-Demand vCPU when `USE_FARGATE_QUOTA` is truthy, otherwise the legacy EC2 Standard quota. Default is **off**. A quota error **fails open** |
| Reserve | `VCPU_HEADROOM_RESERVE`, default `100.0` |
| `launchable_studies` | `floor((available_vcpus − reserve) / (VCPUS_PER_TASK × TASKS_PER_STUDY))` |

If `launchable_studies` is zero or negative the tick dispatches nothing and logs the reserve it is
protecting. Studies are prepaid at launch, so no tokens are deducted here; a queued study on a
zero-balance org is logged as an estimate gap and still dispatched.

Before splitting trials the dispatcher subtracts work that already reached a result:
`already_dispatched` counts **distinct trials in `COMPLETE` or `PRUNED`**, and
`effective_n_trials = max(n_trials − already_dispatched, 0)`. `FAIL` trials are genuinely
unfinished and are re-run. When `effective_n_trials` is `0` the study is skipped — and, if it is
still `QUEUED` while at least one task row carries an `ecs_task_arn`, promoted to `RUNNING` on the
spot, which is the self-heal for a dispatcher that died between `RunTask` and the promotion write.

### Task layout

`compute_layout` decides how many ECS tasks a study gets and how wide each task's worker pool is.
A study counts as **external** when `strategies.execution_type = 'EXTERNAL'` **or**
`fitness.execution_type = 'EXTERNAL'` — mixing the two is allowed.

| Study composition | ECS tasks | `OPTIMIZER_POOL_SIZE` per task |
|---|---|---|
| Strategy and fitness both `INTERNAL` | `TASKS_PER_STUDY`, or `studies.max_tasks_override` when set | `0` sentinel — the task falls back to `os.cpu_count()` |
| Any `EXTERNAL` component | **exactly 1** | the concurrency budget below |

The budget for an external study is `min(k_strategy, k_fitness)` when both sides are external,
otherwise whichever side is external, where `k` is that row's declared `max_concurrency`. If both
endpoints normalize to the same URL (trimmed, trailing `/` stripped, lower-cased) the budget is
**halved**, floored, minimum 1 — strategy and fitness phases share one server. A `max_concurrency`
that is null or `<= 0` on an `EXTERNAL` row is treated as unbounded and ignored — if neither side
declares a usable one the layout falls back to the internal sentinel — and the dispatcher logs
`⚠ Study '{}': EXTERNAL strategy has missing/invalid max_concurrency ({:?}); treating as unbounded.`

Two further adjustments apply:

- **Non-distributed samplers.** `QAOA` and `QKERNEL` declare `supports_distributed: false`, so the
  backend stores `max_tasks_override = 1` at creation. They always run in a single task with their
  own in-process surrogate. See [sampler selection](/docs/sampler-selection).
- **Adaptive task count (internal studies only).** A fully-internal study never needs more tasks
  than `ceil(effective_n_trials / batch)`, where `batch` is `studies.task_worker_cap` clamped to
  `VCPUS_PER_TASK`, or `VCPUS_PER_TASK` itself. The cap only ever **shrinks** the count.

Trials are then split evenly: `base = effective_n_trials / effective_tasks`, and the first
`remainder` tasks get one extra.

### Task size

Every task gets a `study_task_status` row (`trials_count`, `cpu_units`, `memory_mib`, `run_seq`)
**before** `RunTask`, so a launch that fails still leaves a record. The container receives its
whole configuration as environment variables:

| Variable | Value |
|---|---|
| `STUDY_ID` | `developers.studies.study_id` — what the task actually resolves by |
| `STUDY_NAME` | The study **key** (`studies.study_name`), Optuna's own handle. Never the display name |
| `N_TRIALS` | This task's slice, not the study budget |
| `TASKS_PER_STUDY` | The study's task count for this run |
| `OPTIMIZER_POOL_SIZE` | This task's pool width, or the `0` sentinel |
| `OPTIMIZER_TOTAL_WORKERS` | Fleet-wide worker count, used to build the sampler |
| `VCPUS_PER_TASK` | The dispatcher's view of the task's vCPUs, cross-checked in the task |
| `DB_HOST`, `DB_PORT`, `SECRET_ARN` | Storage connection |

Fargate CPU/memory overrides depend on execution type:

| Path | Rule |
|---|---|
| Internal | Uses the shape the backend persisted in `studies.task_memory_mib` when it charged the study, but only when it is a ladder rung **above** the default `49152` MiB — that is, `73728`, `98304` or `122880`. CPU is pinned at `16384` units. Anything else is ignored and the task definition is inherited |
| External | Ladder on the pool budget — `≤ 8 → 4096` MiB, `≤ 32 → 8192` MiB, else `16384` MiB — then raised to the modelled peak and to any escalated size, with CPU floored at 1024 units. Setting **both** `EXTERNAL_OPTIMIZER_CPU` and `EXTERNAL_OPTIMIZER_MEMORY` pins a fixed size instead |

The first task that reaches ECS flips the study to `RUNNING`, closes the `queued` stage, and opens
one `provisioning` stage per task, keyed by that task's id. A `provisioning` stage closes
`SUCCEEDED` when ECS first reports the container `RUNNING` — the one moment anything observes that
it came up — or `FAILED` immediately if `RunTask` was rejected.

## Inside an optimizer task

`train.py` resolves the study by `STUDY_ID` and reads the Optuna key off that row — if the id does
not resolve it aborts rather than falling back to a name lookup, which has no org scoping and no
`deleted_at` filter. It then loads market data for the asset group, builds the engine panel, constructs the
signal generator and fitness evaluator, and then hands control to `BatchOptimizationRunner`.

Its pool width is decided once:

| Condition | `batch_size` |
|---|---|
| `OPTIMIZER_POOL_SIZE > 0`, external study | `min(pool, 32)` — the absolute external fan-out ceiling |
| `OPTIMIZER_POOL_SIZE > 0`, internal study | `min(pool, os.cpu_count())` |
| Sentinel `0` | `os.cpu_count()` |

For internal studies the task also guards against a cgroup/host-core leak: it aborts if
`os.cpu_count()` is more than twice `VCPUS_PER_TASK`, and warns on any smaller mismatch.

The fleet-wide worker count is `OPTIMIZER_TOTAL_WORKERS` when set, else `batch_size ×
TASKS_PER_STUDY`. It is what the sampler is built with — `TPE` turns on `constant_liar` when it is
greater than 1, and `NSGA-II` sizes its population to `max(50, n_workers)`.

Storage is Optuna's own RDB backend pointed at the same database:
`postgresql://…/fintela?options=-csearch_path=developers`. That is why `developers.studies` **is**
Optuna's `studies` table.

### The batch loop

The loop is pipelined. Compute and persistence of consecutive batches overlap, and Optuna itself
is only ever touched from the main thread.

```python
with ProcessPoolExecutor(max_workers=batch_size, initializer=init_worker) as pool, \
     ThreadPoolExecutor(max_workers=1, thread_name_prefix="persist") as writer:
    while asked < n_trials:
        current_batch = min(governor.next_batch(), n_trials - asked)

        # ask -> sample -> signal -> simulate -> fitness. No DB writes.
        ready = objective.prepare_batch(study, current_batch, pool)
        asked += current_batch

        # Settle the PREVIOUS batch, whose DB write overlapped this batch's compute.
        if pending is not None:
            _drain(objective, study, pending)
            pending = None

        # Hand this batch's persistence to the writer thread and go round again.
        if ready:
            pending = (ready, writer.submit(objective.register_batch, ready))
```

- `prepare_batch` calls `study.ask()` once per trial, stamps `owner_task_arn` on each, samples
  strategy and risk-manager parameters, generates signals in the process pool, runs the batched
  simulation, and evaluates fitness in the same pool. It performs **no** database writes.
- `register_batch` runs on the single `persist` thread and touches only the portfolio tables, so
  it needs no lock against the study object.
- `settle_batch` runs back on the main thread and issues every `study.tell` — `COMPLETE` with the
  train fitness on a successful registration, `PRUNED` for the whole batch otherwise.

`init_worker` runs once per pool worker: it scrubs data-plane credentials out of the worker's
environment before any user-supplied code can read them, then publishes the shared signal
generator so the price panel is never pickled per trial.

Finite search spaces get special handling. When the space is enumerable, the runner swaps the
chosen sampler for Optuna's `GridSampler` with a **fixed `seed=0`**, so sibling tasks build an
identical shuffle and partition the grid disjointly by globally unique trial number. Duplicate
configurations are settled as `PRUNED` with a `grid_duplicate` reason and excluded from both sides
of the health ratio. A task stops early once the study's distinct configuration count reaches the
grid size — which is why a study can finish `COMPLETED` with `completed_trials < n_trials`.
`QAOA` and `QKERNEL` opt out of all of it and run their full budget.

### Where the parallelism actually is

| Level | Mechanism | What controls it |
|---|---|---|
| Across studies | The dispatcher launches queued studies until vCPU headroom runs out | Account vCPU quota, `VCPU_HEADROOM_RESERVE` |
| Across tasks in one study | `n_trials` is split across tasks that share one Optuna storage | `TASKS_PER_STUDY`, `studies.max_tasks_override`, the adaptive cap. **Internal studies only** |
| Across trials in a batch | One `ProcessPoolExecutor` per task, reused across every batch | `batch_size` |
| Inside one simulation call | The Rust engine releases the GIL and runs `par_iter` across the batch's payloads | Task vCPUs |
| Persistence vs compute | One writer thread overlaps a batch's database write with the next batch's compute | Fixed at one in-flight registration |

### Memory guards

A study's memory is dominated by what the parent process holds per batch — seeds and simulation
results scaling with `batch × sim_days × positions_per_date` — not by the price panel. Two guards
cover that:

| Guard | When | Effect |
|---|---|---|
| Pre-fork clamp | After the Rust engine is built, before the pool forks | Lowers `batch_size` from a model of per-worker cost. Reserve fraction `OPTIMIZER_MEMGUARD_RESERVE`, default `0.12`. Writes `panel_cells`, `effective_workers`, `memguard_clamped_to` and `predicted_peak_mib` onto the task row |
| Memory governor | Every batch | Sizes the next batch from the last one's observed peak, never above the clamp. The first batch is deliberately narrow; `OPTIMIZER_RAMP_START=0` opts out. Under pressure it drains the pending registration before starting new compute |

`study_task_status.peak_memory_mib` is stamped every batch and on a sampler timer with a
`GREATEST(...)` update, so a task killed mid-batch still leaves a lower bound behind.

## The simulation engine

The engine is a Rust crate exposed to Python as `fintela_simulation_engine`. `get_batched_simulation`
hands it the whole batch at once and it:

1. Prepares the price panel **once** for the batch — tensor, zeros-to-NaN, forward fill,
   rate-of-change — instead of once per trial.
2. Releases the GIL and maps `simulate_one` across the payloads with rayon.
3. Converts one result at a time into Python, so the parent never holds a serde tree and a Python
   object graph for the whole batch simultaneously.

Failures are **per payload**, not per batch: a bad trial comes back as
`{"error": "…", "payload_index": N}` and only that trial is failed. Two exceptions to that
rule are handled explicitly in the optimizer:

- If the per-tick risk-manager watchdog preempts the whole call, the batch is retried once. If the
  retry is preempted too, every trial in it is `PRUNED` — an absence, not a failure, so it leaves
  both sides of the health ratio.
- A `NaN` metric cannot be serialized, so that result becomes an error envelope and the trial is
  recorded as failed.

Risk managers run inside the engine per tick, including `EXTERNAL` HTTP ones. See
[risk managers](/docs/risk-managers).

For external strategies and fitness functions the optimizer posts from the pool workers with a
tiny per-worker connection pool (2 connections, 30 s keep-alive), retrying `ConnectError`,
`ConnectTimeout`, `PoolTimeout`, `RemoteProtocolError` and HTTP `429 / 502 / 503 / 504` up to 4
attempts total with full-jitter backoff capped at 8 s. Endpoints are SSRF-screened before the
first connection. Details in [external strategies](/docs/external-strategies) and
[external fitness](/docs/external-fitness).

## Where state lives

Every service reads and writes the same database. Nothing is cached between them.

| Table | Written by | Holds |
|---|---|---|
| `developers.studies` | backend; status-updater on an OOM escalation | Optuna's own `studies` table plus Fintela columns — `n_trials`, `task_memory_mib`, `task_size_escalations`, `autostop_min_health`, `daily_updates_enabled` |
| `developers.trials` | Optimizer, via Optuna | One row per `ask()`. State is `WAITING`, `RUNNING`, `COMPLETE`, `PRUNED` or `FAIL` |
| `developers.trial_params` | Optimizer | One row per sampled parameter: name, value, distribution JSON |
| `developers.trial_values` | Optimizer | The train fitness the sampler learns from |
| `developers.trial_system_attributes` | Optimizer, status-updater | `owner_task_arn`, `failure_reason`, `failure_diagnostic` |
| `developers.portfolios` | `register_batch` | One row per surviving trial — `seed`, `risk_manager_configs`, `risk_manager_state`, `parent_portfolio_id` |
| `developers.equity` | `register_batch` | Per-date portfolio value |
| `developers.portfolio_snapshots` | `register_batch` | Holdings, orders and trades as one compact JSONB row per trial |
| `developers.portfolio_metrics`, `public.entity_metrics` | `register_batch` | Per-stage portfolio metrics and per-entity windowed metrics, benchmark-relative values already merged |
| `developers.risk_manager_execution_log` | `register_batch` | Per-risk-manager firing records |
| `developers.study_runtime_status` | backend, dispatcher, status-updater | `last_status`, `desired_status`, `run_seq`, timestamps, failure. **The single source of truth for study state** — there is no status mirror on `developers.studies` |
| `developers.study_task_status` | dispatcher, optimizer, status-updater | Per-task `ecs_task_arn`, `cpu_units`, `memory_mib`, `run_seq`, `last_heartbeat`, `peak_memory_mib`, `oom_observed_at`, failure |
| `developers.study_stages` | backend, dispatcher, optimizer, the three finalizers, status-updater | One row per (study, run, stage) with status, timings, attempts, origin and diagnostic |

A whole batch of portfolios is registered in **one** transaction, retried atomically on a
disconnect-class error, so a batch is either fully persisted or not at all.

The lifecycle stages, in execution order, are `queued`, `provisioning`, `data_loading`,
`strategy`, `fitness`, `preflight`, `optimize`, `robustness`, `families`, `importances`. The last
three are **secondary**: they run after the study's primary deliverable already exists, so a
failure there degrades the analysis without failing the study. See
[study lifecycle](/docs/study-lifecycle).

## Worker failure and recovery

| Failure | Detected by | Outcome |
|---|---|---|
| `RunTask` rejected | Dispatcher, inline | Task row set `STOPPED` with a launch diagnostic; its `provisioning` stage closes `FAILED`. If every task failed, the status-updater marks the study `FAILED` on its next tick |
| Task stops with a non-zero exit, or with no exit code at all | status-updater `DescribeTasks` | The stop is classified into a structured diagnostic and copied onto the task row, then aggregated onto the study |
| ECS no longer knows the task | status-updater, `TaskNotFound` | Task closed as `STOPPED` with a "run lost" diagnostic if it had started; closed silently if it never started |
| Fatal Python error in the task | The task's own handler | `failure_message` and `failure_diagnostic` are `COALESCE`d onto its task row (never overwriting an autostop message), the running stage closes `FAILED`, and it reaps **only its own** `RUNNING` trials to `FAIL`, scoped by `owner_task_arn` |
| Out-of-memory kill | status-updater classifies the stop and stamps `oom_observed_at` / `oom_task_arn` | If trials remain, the study climbs one memory rung (`49152 → 73728 → 98304 → 122880` MiB), the dead task's orphaned trials are reaped, the OOM tasks' `failure_message` is cleared, `run_seq` is bumped and the study returns to `QUEUED`. Bounded to **3** escalations by `chk_studies_task_size_escalations`. Escalations cost no tokens |
| One trial's simulation payload errors | `prepare_batch` | That trial alone becomes `FAIL`; its siblings continue |
| `register_batch` raises | `_drain` → `settle_batch` | The batch is `PRUNED` with one classified diagnostic and the run continues |
| Trial health falls below `studies.autostop_min_health` | status-updater, once at least 10 settled trials exist | Stamps `Autostop triggered: health X% dropped below threshold Y% (n/m trials failed)` on the task rows and sets `desired_status = 'STOPPED'`; the next phase issues ECS `StopTask` |
| Trials left `RUNNING` on a finished study | status-updater | Reaped to `FAIL` with an "abandoned" diagnostic once every task of the study is terminal |

Two consequences are worth stating plainly:

> [!CAUTION] A stopped or crashed run keeps everything it already wrote
> Trials that reached `COMPLETE` are durable, with their portfolios, equity curves and metrics
> already persisted. Only the in-flight batch is lost. That is also why the dispatcher's
> `already_dispatched` count is what a relaunch subtracts.

> [!WARNING] `FAILED` studies are not resumable
> `POST /studies/resume` accepts only `COMPLETED` and `STOPPED` studies. A failed study has to be
> duplicated and relaunched.

Heartbeats are coarse. `study_task_status.last_heartbeat` is written by the dispatcher at launch
and refreshed by the status-updater whenever ECS reports a **status change** — not by the
optimizer on a timer. The lifecycle payload marks a study stale when it is `RUNNING` and more than
300 s have passed since the newest `last_heartbeat` of its current run — or, when no task has one
yet, since `started_at`.

Once a study reaches `COMPLETED`, `STOPPED` or `FAILED`, the status-updater refunds the difference
between the launch-time estimate and the cost of the trials that actually reached `COMPLETE`,
priced through the same formula that produced the charge. The refund is written under an
idempotency key of the study id plus `:refund`, so it is replay-safe, and only studies that
finished within the last 7 days are considered. See [tokens and billing](/docs/tokens-and-billing).

## How results reach the UI

Nothing is pushed from an optimizer task to your browser. Trials become visible because they are
already in Postgres and the SPA refetches through the backend.

| Channel | What it carries |
|---|---|
| `GET /studies/status`, `/studies/progress`, `/studies/health` | The three live indicators, per study id |
| `GET /studies/lifecycle` | Execution status, `display_status`, the full stage timeline, heartbeat staleness, elapsed time, ETA, progress, health and completed trials in one payload |
| `GET /studies/errors`, `/studies/overfitting`, `/studies/clustering`, `/studies/param-importances` | Failure dashboard and the three post-run analyses |
| `GET /events` | Server-Sent Events, org-scoped, **data-free**. Envelopes only name a topic, so the client always refetches through its own authenticated endpoints |

The event stream is a hint, not a transport. The backend publishes a `studies` event on create,
launch, stop, delete and resume; the status-updater publishes one `studies` event with action
`progress` per organization that has a `QUEUED` or `RUNNING` study, on every reconcile tick. The stream sends a
`ping` keep-alive every 15 s and is fail-open — with no cache backplane configured nothing is
published and polling alone stays correct.

Polling cadence adapts to both:

| Query | `staleTime` | Refetch |
|---|---|---|
| status / progress / health | 5 s | Every 5 s while any study is `QUEUED`, `RUNNING` or `PENDING`; widened to 30 s while the realtime stream is connected; stopped once everything is terminal |
| lifecycle | 5 s | The same live cadence while any study is `QUEUED` or `RUNNING`, then 60 s while a secondary stage is still owed (bounded to 30 minutes past `finished_at`), then stopped |
| `/studies/metadata`, `/studies` | 60 s | No polling |
| `/samplers` | Infinite | Never |

Two definitions the UI depends on:

- **Progress** is `min(executed_trials / n_trials, 1)`, where `executed_trials` counts trials in a
  **terminal** state. The optimizer writes every row of a batch up front via `ask()`, so a row's
  existence means "requested", never "finished". It is clamped because a sibling task's in-flight
  batch can settle after the budget is already covered.
- **Health** is `1 − failed_trials / total_trials`. `grid_duplicate` and engine-artifact prunes are
  excluded from **both** numerator and denominator.

Both are `null` when their denominator is zero, and the registry's progress column takes its value
only from `/studies/progress` — it deliberately does not fall back to the metadata payload's
`completed_trials / n_trials`, because the two disagree exactly for the mid-batch studies people
are watching.

The per-study results surface itself lives on the portfolios analysis page, reached from the
study's **View** row action. See [analyzing results](/docs/analyzing-results) and
[optimization dashboard](/docs/optimization-dashboard).

## Limits

- **You cannot choose how many tasks a study gets.** Task count comes from the dispatcher's
  configuration, the execution type, the sampler and the trial budget. There is no per-study
  worker knob in the UI or the API.
- **An external component collapses a study to one task.** The single-task layout is what
  guarantees your server sees exactly `max_concurrency` in-flight requests and keeps the sampler
  coordinated in one process. Distributed execution and external endpoints are mutually exclusive
  — see [execution modes](/docs/execution-modes).
- **The external fan-out is capped at 32** inside the task regardless of what `max_concurrency`
  declares, so a mis-sized value cannot bury your endpoint in refused connections.
- **There are no webhooks and no push of trial data.** The only real-time channel is a data-free
  SSE topic; everything else is a polled read.
- **The stage timeline can lie about wall clock.** A stage with `origin = out_of_band` or
  `backfill` was recorded by a different machine on a different queue, so its duration is rendered
  as unknown rather than as a measured time.
