---
title: Optimizer architecture
section: Advanced
sectionOrder: 4
order: 3
published: true
updated: 2026-08-04
summary: How the optimization engine, simulation engine, and storage fit together.
keywords: architecture, engine, pipeline, parallelism, internals, workers, persistence, distributed
---

Fintela's optimization platform is a multi-layer system: a React frontend, a REST API layer, a
validation service, and a distributed optimization engine that runs parallel workers against a
shared persistent store.

## Component overview

```text
 ┌──────────────────┐      ┌──────────────────┐
 │  React Frontend  │─────►│    API Layer     │
 │ Dashboard + CRUD │      │ auth + validation│
 └──────────────────┘      └────────┬─────────┘
                                    │
                    ┌───────────────┼──────────────┐
                    ▼               ▼              │
        ┌──────────────────┐  ┌──────────────────┐ │   ┌────────────────┐
        │Validation Service│─►│ Persistent Store │◄┘   │  Your endpoint │
        │strategies+fitness│  │  all study state │◄───►│   HTTPS        │
        └──────────────────┘  └────────▲─────────┘     └────────────────┘
                                       │                        ▲
        ┌──────────────────┐  ┌────────┴─────────┐              │
        │Optimization Engin│─►│ Optimizer Workers│──────────────┘
        │ schedules workers│  │search + simulation│  /simulate · /evaluate
        └──────────────────┘  └──────────────────┘

  Synchronous flow · all state lives in the persistent store
```

| Layer | Role |
|---|---|
| React frontend | Strategy / fitness / study management + analytics dashboard |
| API layer | JSON over HTTPS, authentication, request validation |
| Validation service | Validates internal and external strategies before study launch |
| Execution service | One-off sandbox runs and strategy dry-runs |
| Optimization engine | Schedules and orchestrates distributed optimizer workers |
| Optimizer workers | Run the search algorithm + simulation engine in parallel |
| Persistent store | All study, trial, portfolio, and sampler state |

## The optimization pipeline

Once a study is `QUEUED`, the optimization engine takes over. Each cycle of the worker produces
a batch of trials sized to the available compute.

```python
while completed < n_trials:
    params     = propose_next_batch(batch_size)      # search algorithm picks candidates

    signals    = generate_signals(params)            # parallel
    portfolios = run_simulations(signals)            # high-performance batch
    fitnesses  = evaluate_fitness(portfolios.stages) # parallel

    validate(fitnesses)                              # prune on NaN
    persist(portfolios)                              # single transaction
    record_results(params, fitnesses.train)          # update the search model
```

The simulation engine is the performance core of the platform. It processes an entire batch of
trials concurrently, which is why larger batch sizes amortize the scheduling overhead well.

## Performance

The simulation and search engines at the heart of the platform are **compiled to native
machine code**. That gives the throughput of a systems-grade execution path — tight memory
layouts, no interpreter overhead, aggressive vectorization where the math permits — while the
parts of the platform you touch directly stay high-level and approachable.

Work runs in parallel at **four levels at once**:

| Level | What happens in parallel |
|---|---|
| Across studies | Many independent studies can run concurrently across the available compute pool. |
| Within a study | Each study can dispatch multiple parallel workers that share its search state. |
| Within a batch | A single worker evaluates a full batch of trials in lockstep, instead of one at a time. |
| Within a trial | Per-trial work — advancing the calendar, computing signals, evaluating risk managers — is vectorized across instruments. |

> [!TIP] Where the time actually goes
> Pure orchestration overhead per trial is negligible. Almost all wall-clock time is spent on
> the actual backtest math, which is what should be expensive — so throwing more compute at a
> study translates almost linearly into more trials per minute. When external endpoints are
> involved, their latency and concurrency limits become the practical bottleneck long before
> Fintela's internals do.

## Parallelism model

| Level | Mechanism | Tunable |
|---|---|---|
| Per study (workers) | Engine launches multiple parallel workers per study | Per-study setting |
| Per worker (batches) | Each worker runs a batch sized to available CPU cores | Implicit |
| Per batch (rows) | Simulation engine processes all parameter samples concurrently | Implicit |
| External HTTP | Connection pool per worker to your endpoint | `max_concurrency` |
| Search coordination | Shared state store visible across all workers | — |

> [!NOTE] Distributed-safe sampling
> When more than one worker runs against the same study, the TPE sampler automatically enables
> a distributed-safe mode. This prevents workers from suggesting identical parameter
> combinations while they wait for each other's results.

## Results persistence

Every surviving trial writes to five tables in a single transaction at the end of its batch:

| Record | What is stored |
|---|---|
| Trial | Study reference, trial number, state, start and completion timestamps |
| Trial parameters | One entry per parameter: name, sampled value, distribution |
| Trial objective | The train fitness value used to update the search model |
| Portfolio | Realized backtest data per trial — equity curve, trades, period metrics |
| Trial failure | Failure reason for PRUNED trials only |

Period metrics (Sharpe, Sortino, drawdown, etc.) for every stage are attached to each portfolio
so the analytics endpoints can answer arbitrary stage-filtered queries without recomputation.
