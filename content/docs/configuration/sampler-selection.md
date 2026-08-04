---
title: Sampler selection
section: Configuration
sectionOrder: 3
order: 2
published: true
updated: 2026-08-04
summary: TPE, CMA-ES, Random, QMC, NSGA-II — which to choose and when.
keywords: sampler, tpe, cmaes, bayesian, nsga, qmc, random, distributed, grid enumeration
---

The sampler is the search algorithm — it decides which parameter combination to try next.
You choose it in Step 3 of the study creation wizard. This page explains each option and when
to pick it.

`Registry → Studies → + New Study → Step 3 — Sampler`

> [!TIP] Just use TPE
> If you're unsure, pick **TPE**. It's the right default for almost every study — it learns
> from past trials and focuses search on promising regions. Start with 50–200 trials and
> increase from there.

## Registry

| Key | Implementation | Distributed-safe | Recommended budget |
|---|---|---|---|
| `TPE` | Tree-structured Parzen Estimator · distributed-safe flag auto-enabled | ✅ | 100 – 1 000 trials |
| `CMAES` | Covariance Matrix Adaptation Evolution Strategy | ✅ | 1 000 – 10 000 trials |
| `RANDOM` | Uniform random sampling | ✅ | No upper bound |
| `QMC` | Quasi-Monte-Carlo low-discrepancy sequences | ✅ | No upper bound |
| `NSGA2` | Non-dominated sorting genetic algorithm · multi-objective | ✅ | 100 – 10 000 |

## Choosing a sampler

| Situation | Pick |
|---|---|
| Default / first study | `TPE` |
| Continuous parameter space, big budget | `CMAES` |
| Need uniform coverage (sensitivity studies) | `QMC` |
| Baseline / fuzz testing | `RANDOM` |
| Multi-objective fitness | `NSGA2` |

> [!NOTE] Finite grids enumerate instead of sampling
> Stochastic samplers draw _with replacement_ — even with more trials than combinations they
> can leave grid points unvisited. So when the search space is finite (only integer,
> categorical, or fixed parameters, plus floats with a grid precision) and the trial budget
> covers it, the optimizer automatically switches to grid enumeration: every combination is
> evaluated exactly once, in shuffled order, and the study completes as soon as the grid is
> exhausted. Your sampler choice applies whenever the space is continuous or larger than the
> budget.

## Distributed safety

All five samplers are distributed-safe — multiple parallel optimizer workers can run trials
against the same study simultaneously without corrupting search state. Coordination uses a
shared state backend visible to every worker.

TPE is the only sampler that requires special handling for distributed mode: when
`n_workers > 1`, Fintela automatically enables a distributed-safe flag so that pending trials
don't cause workers to repeatedly suggest similar parameter combinations.

## Sampler metadata

Every sampler carries the metadata below, and the study creation wizard renders it directly —
the label and description you see in Step 3, plus the recommended trial budget and whether
the sampler is distributed-safe. It is worth knowing the shape because it tells you, per
sampler, the trial budget Fintela considers reasonable before you commit compute to a study.

```json
[
  {
    "key": "TPE",
    "label": "Tree Parzen Estimator",
    "description": "Probabilistic model over good/bad trials. Excellent default.",
    "supports_distributed": true,
    "recommended_budget_min": 100,
    "recommended_budget_max": 1000
  },
  {
    "key": "CMAES",
    "label": "CMA-ES",
    "description": "Covariance-matrix evolution. Best for continuous spaces.",
    "supports_distributed": true,
    "recommended_budget_min": 1000,
    "recommended_budget_max": 10000
  }
]
```
