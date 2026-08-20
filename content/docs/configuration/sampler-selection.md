---
title: Sampler selection
section: Configuration & Advanced
sectionOrder: 8
order: 2
published: true
updated: 2026-08-18
summary: Which optimization sampler to choose, and when each one is the right call.
keywords: sampler, tpe, cmaes, nsga, qmc, random, grid, bayesian, multi-objective, distributed, seed
---

The sampler is the search algorithm behind a [study](/docs/studies): it decides which parameter
combination each trial evaluates next. Fintela offers seven, served by a single endpoint and
rendered into one **Sampler** field in the study builder — five classical Optuna samplers and two
experimental, emulated quantum samplers that run on a simulator with no speed-up. The default is
`TPE`, the choice is stored on the study row, and it is frozen the moment the study launches.

## Where you choose a sampler

| Surface | Control | Default |
|---|---|---|
| Study builder — **Optimization** block, **Advanced options**, **Optimization engine** section | Select labelled **Sampler** | `TPE` |
| **Derive portfolios — optimize risk managers** wizard | Select labelled **Sampler** | `TPE` |
| `POST /studies` and `POST /studies/risk-manager-optimization` | `sampler` field on the body | `"TPE"` when omitted |
| Fintelligent study editor | writable field `sampler` | inherits the builder default |

The builder is one screen, not a stepper: **Registry → Studies → New Study** (or `/studies?mode=create`)
opens a four-block canvas — Asset Group, Strategy, Fitness, Optimization. **Sampler** sits inside the
Optimization block, under the **Advanced options** accordion, in the **Optimization engine**
subsection alongside **Grid precision (decimals)**, **Stop early if health drops below threshold**
and **Recalculate daily after market data arrives**.

Each menu entry renders the sampler's `label`, with its `description` in a tooltip placed to the
right. Until the catalog request lands, the menu holds a single disabled item: **Loading samplers…**

The field's help text reads: *How the next combination is chosen. TPE learns from the trials already
run and is the right default for most searches; the others are baselines, population methods, or
experiments. Each option carries its own recommended trial budget.*

> [!WARNING] The sampler is frozen at launch
> Only a study still in `SAVED` status can be edited. `update_saved_study` re-validates the sampler
> and rewrites the row; once the study is `QUEUED` or beyond, the sampler is immutable — duplicate
> the study to try a different one. See [study lifecycle](/docs/study-lifecycle).

## The catalog endpoint

```http
GET /samplers
```

Requires the `study:read` permission. The response is the standard envelope, `{"data": [ … ]}`,
carrying one object per sampler:

| Field | Type | Meaning |
|---|---|---|
| `key` | string | The value you post as `sampler` |
| `label` | string | Menu label |
| `supports_distributed` | boolean | `false` forces the study onto a single task |
| `recommended_budget_min` | integer or `null` | Lower trial budget the sampler is documented for |
| `recommended_budget_max` | integer or `null` | Upper trial budget the sampler is documented for |
| `description` | string | Tooltip copy in the sampler menu |

The list is a compile-time constant in the backend, mirrored by the optimizer's own Python registry;
nothing about it is per-organization or per-plan. The SPA fetches it with `staleTime: Infinity` and
`refetchOnWindowFocus: false`, so it is requested once per session.

> [!NOTE] Recommended budgets are advisory, and the sampler menu does not show them
> No validation, clamp or warning enforces `recommended_budget_min` / `recommended_budget_max` —
> you can run `RANDOM` for 20 trials or `QKERNEL` for 5,000. The sampler dropdown renders only
> `label` and `description`; the budget ranges you see on screen come from the comparison dialog's
> own hard-coded table. The backend does use the documented bands to pick the trial counts its
> search-space suggestion returns: 100 conservative, 400 balanced, 1,000 aggressive.
> That suggestion is reached through Fintelligent's `suggest_study_search_space` tool
> (`POST /studies/suggest-search-space`), not through a button in the builder.

## The seven samplers

| `key` | Menu label | Short label | Distributed | Recommended budget |
|---|---|---|---|---|
| `TPE` | TPE (Tree-structured Parzen Estimator) | TPE | yes | 100 – 1,000 |
| `CMAES` | CMA-ES (Covariance Matrix Adaptation) | CMA-ES | yes | 1,000 – 10,000 |
| `RANDOM` | Random | Random | yes | unlimited |
| `QMC` | QMC (Quasi-Monte Carlo) | QMC | yes | unlimited |
| `NSGA2` | NSGA-II (Genetic Algorithm) | NSGA-II | yes | 100 – 10,000 |
| `QAOA` | QAOA — Quantum Optimization (emulated) | QAOA | **no** | 50 – 500 |
| `QKERNEL` | Quantum-Kernel Bayesian Optimization (emulated) | Q-Kernel | **no** | 30 – 300 |

The short labels are the display taxonomy the SPA uses for aggregates — the **Studies per optimizer
type** breakdown on the [Home overview](/docs/home) card, for example. An unrecognised stored value
is shown trimmed and upper-cased rather than folded into an "Other" bucket, so a sampler the
optimizer gains later still gets its own slice.

## What each sampler does

### TPE

*General-purpose Bayesian sampler. Works well across multiple machines as long as n_trials >>
n_workers. Enables constant_liar automatically in parallel environments to avoid duplicate
suggestions.*

Constructed as `TPESampler(constant_liar=(n_workers > 1))` — the only parameter Fintela sets, and it
flips on automatically whenever the study runs with more than one worker so that in-flight trials do
not cause several workers to propose near-identical points. No other TPE knob is exposed.

Prefer it as the default. It models which regions produced good fitness and steers later trials
there, and it is the one sampler the platform's copy calls the right default for most searches —
which matters most when the budget is modest.

### CMA-ES

*Excellent for high parallelism with many trials. Optimized for continuous (float) parameters. Works
with integers but with reduced efficiency.*

Constructed as `CmaEsSampler()` with no arguments.

Prefer it for continuous search spaces with a large budget and many parallel workers. The platform's
own search-space suggestion recommends `CMAES` only when the requested breadth is `aggressive`, at
least two parameters are optimized floats, and *every* optimized dimension is a float — anything
mixed or lower-dimensional falls back to `TPE`, because there is no covariance worth adapting.

### NSGA-II

*Population-based genetic algorithm. Naturally parallel — each generation evaluates multiple
individuals simultaneously. The population_size is auto-adjusted to always be >= n_workers,
preventing quality degradation.*

Constructed as `NSGAIISampler(population_size=max(50, n_workers))`, so the population never drops
below 50 and never below the worker count.

Prefer it for large budgets over spaces with many categorical or discrete dimensions. Despite the
algorithm's multi-objective heritage, Fintela runs it against a single objective — see the
multi-objective section below.

### QMC

*Generates low-discrepancy sequences (more uniform than Random). Fully parallel. A good alternative
to Random when systematic coverage of the search space is desired.*

Constructed as `QMCSampler()` with no arguments.

Prefer it when you want even coverage of the whole space rather than convergence onto a peak —
sensitivity sweeps, or a first pass to see where the space is even viable.

### Random

*Pure random sampling. Scales perfectly with any number of workers without degradation. Useful as a
baseline or when the search space is very large.*

Constructed as `RandomSampler()` with no arguments.

Prefer it as a control run: it is the honest baseline any guided sampler has to beat, and it has no
coordination cost at any worker count.

### QAOA

*EXPERIMENTAL / EMULATED — no speed-up. Encodes the search space as a QUBO, fits a quadratic
surrogate of the fitness, and solves it with the Quantum Approximate Optimization Algorithm on a
quantum simulator (PennyLane) to propose the next point. Runs in a single task and keeps its own
surrogate. The portfolio simulation and fitness stay classical.*

Behaviour worth knowing before you spend a budget on it:

- The first `startup_trials` completed trials are sampled **randomly**; the surrogate only engages
  after that.
- Each proposal binary-encodes every dimension, fits a quadratic QUBO to the completed trials, and
  reads out 512 shots from the QAOA circuit.
- If the encoding needs more qubits than the cap, the sampler prints a warning and falls back to
  random sampling **for the rest of the study**.
- A QUBO optimum is often a point already evaluated; the sampler flips one bit to escape, and if
  that is also a repeat it defers to random for that trial.
- Any exception inside a proposal is caught and degrades to random rather than failing the study.

### Q-Kernel

*EXPERIMENTAL / EMULATED — no speed-up. Bayesian optimization whose Gaussian-Process surrogate uses
a quantum fidelity kernel computed on a quantum simulator (PennyLane). Runs in a single task and
keeps its own surrogate. The portfolio simulation and fitness stay classical.*

Only the kernel entries run on the emulator; the Gaussian-Process algebra and the acquisition step
are plain numpy, and the objective — signal generation, simulation, fitness — is untouched. Like
QAOA it warms up on random trials, uses one qubit per optimized dimension, degrades to random when
the dimension count exceeds the qubit cap or when anything throws, and caps the kernel matrix to a
recent window because it costs O(m²).

### Quantum sampler configuration

Neither quantum sampler has any per-study setting. Both read one config object from the optimizer
task's environment, resolved once when the sampler is constructed:

| Variable | Default | Applies to | Meaning |
|---|---|---|---|
| `QUANTUM_DEVICE` | `default.qubit` | both | PennyLane device string |
| `QUANTUM_MAX_QUBITS` | `24` | both | Hard cap; past it the sampler falls back to random |
| `QUANTUM_STARTUP_TRIALS` | `16` | both | Random warm-up trials before the surrogate engages |
| `QUANTUM_SEED` | `0` | both | Seeds numpy, the independent sampler and the device |
| `QUANTUM_QAOA_LAYERS` | `2` | QAOA | QAOA circuit depth |
| `QUANTUM_QUBO_BITS_PER_DIM` | `4` | QAOA | Bits per continuous numeric dimension |
| `QUANTUM_QAOA_OPT_STEPS` | `50` | QAOA | Classical angle-optimization iterations |
| `QUANTUM_KERNEL_REPS` | `2` | Q-Kernel | Feature-map layers |
| `QUANTUM_KERNEL_MAX_TRIALS` | `64` | Q-Kernel | Cap on the O(m²) kernel matrix |
| `QUANTUM_ACQ_CANDIDATES` | `256` | Q-Kernel | Candidate pool for the acquisition step |

> [!NOTE] The resolved config is pinned to the study
> On first use the sampler snapshots this object into the Optuna study's `user_attrs` under
> `fintela_quantum_config` and reads the snapshot thereafter, so a resumed or relaunched task
> reproduces the original settings even if the task environment changed in between. There is no
> per-study `sampler_config` column and no UI for these values.

## Picking one

| Situation | Sampler |
|---|---|
| First study, or anything you are unsure about | `TPE` |
| Every optimized dimension is a float, big budget, many workers | `CMAES` |
| Many categorical or discrete dimensions, large population | `NSGA2` |
| Even coverage of the whole space, sensitivity sweep | `QMC` |
| Control run / baseline to beat | `RANDOM` |
| Deliberate experiment with emulated quantum search | `QAOA` or `QKERNEL` |

The app states its own rule of thumb in the comparison dialog: *if you have <500 trials, prefer TPE.
If you have 1,000+ trials and many parallel workers, CMA-ES will outperform.*

## How the sampler interacts with the trial budget

**Number of trials** is the always-visible field in the Optimization block: default **1000**, minimum
1, stepper increment 10, and **no upper cap** — tokens are the only billing method, so there is no
plan-based trial ceiling in the field itself. Three things can still change the number that actually
runs:

| Mechanism | When | Effect |
|---|---|---|
| Free-tier capability clamp | On create, before pricing, only for non-activated organizations under enforced entitlements | `n_trials` is silently reduced to the tier ceiling — clamped, never rejected |
| Grid clamp | On launch | `n_trials` is capped at the study's finite search space (strategy dimensions times risk-manager attachment dimensions) before the token charge is computed |
| Autostop | While running, after the first ten trials have finished | The study ends early when the failure rate crosses the threshold |

Cost scales linearly with `n_trials` regardless of sampler — see
[tokens and billing](/docs/tokens-and-billing).

While you type, the builder shows derived feedback whenever the strategy-only grid is finite:

- **Search space: {{size}} combinations**
- when the budget exceeds it: **The search space has only {{combos}} combinations — fewer than the
  {{nTrials}} trials requested. The study stops early once every combination has been explored.**

## Finite grids replace your sampler

This is the single most important thing to know about sampler selection, and it is easy to miss.

A stochastic sampler draws *with replacement*, so over a finite space it re-proposes points it has
already evaluated. Fintela therefore checks the search space before binding a sampler: whenever the
grid is **enumerable** — finite and no larger than **1,000,000** combinations — the optimizer swaps
the sampler you chose for an exhaustive grid enumeration and your choice has no effect.

The builder says so up front, in an info alert under the trial-count field:

> Finite grid ({{size}} combinations): configurations are enumerated as a grid search — each tried
> at most once, no repeats — so the sampler below isn't applied.

The grid cardinality is computed identically in three places — the builder preview, the backend, and
the optimizer — pinned by shared test vectors:

```text
fixed value (numeric or categorical)   → 1
choices                                → number of selected choices
integer range                          → trunc(hi) − trunc(lo) + 1
float range, grid_decimals = d         → floor((hi − lo) / 10^-d + 1e-9) + 1
float range, no grid_decimals          → infinite
float range where lo == hi             → 1

total = product of every dimension  (strategy params × risk-manager attachment params)
```

Consequences:

- **`Grid precision (decimals)` turns a continuous space into a countable one.** Setting it makes
  float ranges finite, which is exactly what can push a study over the line into grid enumeration.
  Leave it empty to keep sampling continuously.
- **The switch is independent of your budget.** Even when the budget is far smaller than the grid,
  enumeration wins: it yields that many *distinct* points, where a stochastic sampler would spend
  part of the same budget re-proposing points it already tried.
- **Above 1,000,000 combinations the grid is not enumerable** and your sampler applies normally.
- **When every dimension is fixed there is nothing to enumerate** — the sampler is never consulted
  at all.
- Duplicate configurations that do slip through on a finite grid are settled as pruned trials with
  the reason `grid_duplicate: configuration already evaluated`. These are health-neutral: they are
  excluded from both sides of the health ratio and never trip autostop.
- The builder preview covers the strategy block only. The backend's grid — which also folds in
  risk-manager dimensions — is authoritative, so a study near the cap can tip over once risk
  managers are attached.

> [!TIP] The two quantum samplers opt out
> `QAOA` and `QKERNEL` set `bypass_grid_autoswitch`, so a finite grid is treated as infinite for
> them: no grid enumeration, no intra-task duplicate pruning, no coverage early-stop. They keep
> their own surrogate and anti-duplicate handling and run their full budget. Without this they would
> be discarded on every discretized space — which is precisely the kind of space a QUBO sampler
> wants.

## Distributed execution

Parallelism is decided server-side by the optimization dispatcher; there is no concurrency or
worker-count setting anywhere in the study payload or the UI. What the sampler controls is the
ceiling.

- **`supports_distributed: true`** (`TPE`, `CMAES`, `RANDOM`, `QMC`, `NSGA2`) — no override; the
  study gets the dispatcher's configured default task count.
- **`supports_distributed: false`** (`QAOA`, `QKERNEL`) — the create call stores
  `max_tasks_override = 1`, so the study always runs in **exactly one task**. Both keep an
  in-process surrogate that cannot be shared across tasks.

Two things narrow parallelism regardless of sampler:

- A study whose **external strategy or external fitness function declares a positive
  `max_concurrency`** runs in exactly one task, and that task's worker pool is that concurrency —
  the smaller of the two when both components are external, halved when both point at the same
  endpoint. A missing or non-positive `max_concurrency` is logged as unbounded and the study keeps
  the default task count. See [execution modes](/docs/execution-modes).
- The grid enumerator is itself distributed-safe: sibling tasks build the identical sorted search
  space with the same fixed seed and partition the grid disjointly by globally-unique trial number.

The worker count the samplers see — the number that drives TPE's `constant_liar` and NSGA-II's
population floor — is the fleet-wide figure the dispatcher hands the task, not one task's share.

## Multi-objective support

**There is none.** Every Fintela study is single-objective:

- The optimizer registers exactly one direction row for the study, at objective index `0`.
- The direction comes from **Optimization objective** — the **Maximize** / **Minimize** segmented
  control in Advanced options, stored as `NOT_SET`, `MAXIMIZE` or `MINIMIZE`. Left at `NOT_SET` it
  resolves to the fitness's natural direction: a built-in objective declared `lower_is_better`
  minimizes, everything else maximizes.
- The direction is set at creation and **frozen after launch**, just like the sampler.

`NSGA2` is offered purely as a population-based single-objective sampler. Nothing in the payload,
the UI or the optimizer accepts a list of objectives. If you need to trade two metrics against each
other, encode the trade-off inside a single custom [fitness function](/docs/fitness-functions).

## Determinism and seeding

There is **no seed setting** — not in the builder, not in the `POST /studies` payload, not in the
Fintelligent editor. What that means in practice:

| Sampler | Seeded | Rerunning the same study configuration |
|---|---|---|
| `TPE`, `CMAES`, `RANDOM`, `QMC`, `NSGA2` | no | Explores a different trial sequence each run |
| Grid enumeration (the finite-grid auto-switch) | yes, fixed at `0` | Same shuffled grid every time, on every task |
| `QAOA`, `QKERNEL` | yes, `QUANTUM_SEED` (default `0`), pinned to the study | Reproducible within a study, including across resume and relaunch |

The grid enumerator's fixed seed is deliberate and not a reproducibility feature for you — it is how
sibling tasks agree on the same shuffle so the fleet partitions the grid instead of colliding on it.

Note that even a fully seeded sampler does not make a study bit-reproducible: trial ordering across
parallel tasks, the batch boundaries and the health-driven autostop all depend on timing.

## Comparing samplers in the app

The [study results view](/docs/analyzing-results) carries an **Algorithm** row showing the study's
stored sampler as a chip,
with an info button beside it — tooltip **Compare optimization algorithms** — that opens the
**Optimization Algorithms** dialog, subtitled *Speed vs. quality comparison across available
samplers*.

It scores all seven across the columns **Algorithm**, **Parallelism**, **Budget (trials)**,
**Speed**, **Quality** and **Best for**, with legends **Parallelism (1–4)**, **Speed (1–3)**,
**Quality (1–3)** and the key **● = high   ◌ = low**. The **Best for** column reads:

| Sampler | Best for |
|---|---|
| TPE | General purpose, mixed param types |
| CMA-ES | High parallelism, continuous params |
| NSGA-II | Large population, categorical params |
| QMC | Systematic coverage, baseline+ |
| Random | Baseline, very large search spaces |
| QAOA | Experimental — emulated quantum search (QUBO/QAOA) |
| Q-Kernel | Experimental — emulated quantum-kernel Bayes-opt |

A banner states the trade-off: *Faster samplers (Random, QMC) scale perfectly across many machines
but explore the search space blindly. Slower samplers (TPE, CMA-ES) build probabilistic models that
guide the search more intelligently — but that model needs completed trials before it can help.*

> [!NOTE] The comparison table is hard-coded display data
> Its scores and budget strings live in the dialog component, not in the `GET /samplers` response.
> They are editorial guidance, not values the optimizer reads.

## Rejected sampler values

The backend validates `sampler` against the catalog on all three creation paths — create a study,
update a `SAVED` study, and create risk-manager optimization studies. An unrecognised value returns
**HTTP 400** with `kind: "bad_request"` and the message:

```text
"CMA-ES" isn't a sampler Fintela offers. Choose one of: TPE, CMAES, RANDOM, QMC, NSGA2, QAOA, QKERNEL.
```

The Fintelligent study editor rejects the write before it reaches the API, with the outcome
`rejected_value` and the message `sampler must be one of TPE, CMAES, NSGA2, QMC, RANDOM, QAOA,
QKERNEL.` — it upper-cases and trims your input first, so `tpe` is accepted and normalized.

Matching is exact and case-sensitive on the wire: post `CMAES`, not `CMA-ES`.

Related reading: [optimizer architecture](/docs/optimizer-architecture),
[execution modes](/docs/execution-modes), [study lifecycle](/docs/study-lifecycle), and the
[studies API](/docs/api-studies).
