---
title: Sampler selection
section: Configuration & Advanced
sectionOrder: 8
order: 2
published: true
updated: 2026-09-01
summary: Which optimization algorithm (sampler) to pick for a study, and when each one is the right call.
keywords: sampler, tpe, cma-es, nsga-ii, qmc, random search, grid search, bayesian optimization, multi-objective, parallel workers, seed, reproducibility
---

The sampler is the search algorithm behind a [study](/docs/studies): it decides which combination
of parameters each trial tries next. Fintela offers seven samplers in one **Sampler** field in the
study builder — five well-established optimization algorithms, plus two experimental algorithms
that run on a simulated quantum computer. The default, and the right choice for most searches, is
**TPE**. Once you launch a study, the sampler you picked is locked in for that study's entire run.

## Where you choose a sampler

| Where | What you do | Default |
|---|---|---|
| Study builder — **Optimization** block → **Advanced options** → **Optimization engine** | Pick a sampler from the **Sampler** dropdown | TPE |
| **Derive portfolios — optimize risk managers** wizard | Pick a sampler from the **Sampler** dropdown | TPE |
| Creating studies through the [Developer API](/docs/api-studies) | Set the sampler as part of the study you submit | TPE, if you don't set one |
| Asking Fintelligent to build or edit a study | Tell it which sampler you want, in plain language | Whatever the builder would default to |

The study builder is a single screen, not a multi-step wizard: go to **Registry → Studies → New
Study** and you'll see four blocks — Asset Group, Strategy, Fitness, and Optimization. The
**Sampler** control lives inside the Optimization block, under **Advanced options**, in the
**Optimization engine** section, alongside **Grid precision (decimals)**, **Stop early if health
drops below threshold**, and **Recalculate daily after market data arrives**.

Each entry in the dropdown shows the sampler's name, with a short explanation in a tooltip beside
it. While the sampler list is loading, you'll briefly see a single disabled entry that reads
**Loading samplers…**

The help text next to the field puts it simply: *How the next combination is chosen. TPE learns
from the trials already run and is the right default for most searches; the others are baselines,
population methods, or experiments. Each option carries its own recommended trial budget.*

> [!WARNING] The sampler locks in once your study starts
> You can only change the sampler while a study is still saved as a draft, before it's queued to
> run. Once it's queued or running, the sampler can no longer be changed — duplicate the study if
> you want to try a different one. See [study lifecycle](/docs/study-lifecycle).

## How the sampler list is presented

The list of available samplers is the same for every account — it isn't tied to your subscription
plan or organization, and every user sees the same seven options with the same descriptions. Fintela
loads this list once each time you open the app, so moving between screens doesn't reload it.

> [!NOTE] Recommended trial budgets are a guideline, not a limit
> Fintela doesn't stop you from running a sampler outside its recommended range — you could run
> Random for 20 trials or Q-Kernel for 5,000 if you wanted to. The dropdown itself only shows a
> sampler's name and a short description; the recommended budget ranges appear in the
> **Optimization Algorithms** comparison dialog described later on this page, under
> **Comparing samplers in the app**. Fintelligent does use these recommended ranges when it
> suggests a trial count for you — offering roughly 100 trials for a conservative search, 400 for
> a balanced one, or 1,000 for an aggressive one.

## The seven samplers

| Sampler | Runs in parallel across workers? | Recommended trial budget |
|---|---|---|
| TPE (Tree-structured Parzen Estimator) | Yes | 100 – 1,000 |
| CMA-ES (Covariance Matrix Adaptation) | Yes | 1,000 – 10,000 |
| Random | Yes | Unlimited |
| QMC (Quasi-Monte Carlo) | Yes | Unlimited |
| NSGA-II (Genetic Algorithm) | Yes | 100 – 10,000 |
| QAOA — Quantum Optimization (experimental) | No — runs on a single worker | 50 – 500 |
| Quantum-Kernel Bayesian Optimization (experimental) | No — runs on a single worker | 30 – 300 |

These same short names — TPE, CMA-ES, Random, QMC, NSGA-II, QAOA, Q-Kernel — are what you'll see
used elsewhere in the app too, for example in the **Studies per optimizer type** breakdown on the
[Home overview](/docs/home) page.

## What each sampler does

### TPE

A general-purpose sampler that learns from the trials it has already run and steers later trials
toward the regions that performed well. It's the platform's recommended default for most searches,
and it's especially effective when your trial budget is modest — it gets useful signal from
relatively few trials.

When your study runs across multiple parallel workers, TPE automatically adjusts its behavior to
avoid several workers proposing near-identical parameter combinations at the same time. You don't
need to configure anything for this — it happens on its own whenever more than one worker is
assigned to your study.

### CMA-ES

A sampler built for continuous (numeric) parameters — the values it explores aren't restricted to
round steps. It performs best with a large trial budget and many parallel workers, and it can also
handle integer parameters, just less efficiently than continuous ones.

If you ask Fintelligent to suggest a search space for you, it will only recommend CMA-ES for an
aggressive (large) trial budget, when you're optimizing at least two parameters, and when every
parameter you're optimizing is continuous — a mix of continuous and categorical or integer
parameters, or a single parameter, gets TPE instead, since CMA-ES needs several continuous
dimensions to offer any advantage over a simpler sampler.

### NSGA-II

A population-based, genetic-algorithm-style sampler: instead of proposing one combination at a
time, it evaluates a whole batch together, which makes it naturally suited to running many trials
in parallel. Fintela keeps that batch size sensible automatically, so it never drops low enough to
hurt quality, and it always keeps pace with however many workers are assigned to your study.

It's a good choice for large budgets over search spaces with many categorical or discrete choices,
as opposed to smooth numeric ranges. Note that although genetic algorithms like this one are often
associated with balancing several goals at once, Fintela always runs NSGA-II against a single
objective — see [Multi-objective support](#multi-objective-support) below.

### QMC

Generates evenly spread-out combinations across your search space — more uniform coverage than
pure random sampling — and runs fully in parallel. Reach for it when you want systematic coverage
of the whole space rather than convergence toward a single peak: sensitivity sweeps, or an early
pass to see which regions of the space are even viable before you commit a larger budget to a
smarter sampler.

### Random

Pure random sampling, with no memory of past trials. It scales cleanly to any number of parallel
workers with no coordination overhead, and it's useful as an honest baseline — any smarter sampler
ought to beat it — or when your search space is very large and you simply want broad exploration.

### QAOA

An experimental sampler that proposes each next combination using a simulated quantum computer
rather than classical statistics. It's emulated in software — there's no real quantum hardware
involved, and currently no speed advantage over the classical samplers above. It's offered for
teams who want to experiment with quantum-inspired optimization. Portfolio simulation and fitness
scoring stay entirely classical either way; only the proposal step is different.

A few things worth knowing before you spend a trial budget on it:

- The first several trials are chosen randomly while it warms up — the quantum-based proposal only
  kicks in afterward.
- If your search space is too large for the simulator to encode (many parameters, or very fine
  grid precision), QAOA automatically falls back to random sampling for the rest of the study, with
  a warning.
- It's designed to fail safe: if anything goes wrong while it's proposing a point, it quietly falls
  back to a random trial rather than stopping your study.

### Q-Kernel

Also experimental and simulator-based: a Bayesian-optimization sampler, similar in spirit to TPE,
whose internal similarity model is computed with a simulated quantum technique instead of a
classical one. As with QAOA, there's no real quantum hardware and no current speed advantage — this
is for teams who want to explore the approach.

It shares QAOA's safety behavior: a random warm-up period before its model engages, and an
automatic fallback to random sampling if your search space is too large or if anything goes wrong
internally.

### A note on the quantum samplers' settings

Neither quantum sampler has any per-study settings you can adjust — there's no dial for warm-up
length, model depth, or anything similar in the study builder. Their internal configuration is
fixed platform-wide, and the specific settings a study used are locked in the moment the sampler
starts, so re-running or resuming a study reproduces the same behavior even if the platform's
defaults change later.

## Picking one

| Your situation | Sampler to use |
|---|---|
| First study, or you're not sure | TPE |
| Every parameter you're optimizing is continuous, big budget, many parallel workers | CMA-ES |
| Many categorical or discrete parameters, large budget | NSGA-II |
| You want even coverage of the whole space, or a sensitivity sweep | QMC |
| You want a baseline / control run to beat | Random |
| You want to experiment with quantum-inspired search | QAOA or Q-Kernel |

The app's own rule of thumb, shown in the comparison dialog: if you have fewer than 500 trials,
prefer TPE; if you have 1,000 or more trials and many parallel workers, CMA-ES will tend to
outperform it.

## Trial budget and your sampler choice

**Number of trials** is always visible in the Optimization block — it defaults to 1,000, has a
minimum of 1, and has no fixed upper cap in the field itself, since your trial budget is governed
by tokens rather than a plan tier. That said, three things can still change the number of trials
that actually run, regardless of what you typed:

| What happens | When | Effect on your study |
|---|---|---|
| Trial count is reduced automatically | When you create a study, before you're charged, only on a free or introductory tier with limits enabled | Your requested trial count is quietly reduced to fit your tier's limit — adjusted down, never rejected |
| Trial count is capped to the search space | When you launch the study | If your search space is small and finite, the trial count is capped at the number of unique combinations available, before tokens are charged |
| The study can stop early | While it's running, after the first ten trials finish | If too many trials are failing, the study ends early rather than continuing to spend your budget |

Cost scales linearly with the number of trials you run, regardless of which sampler you choose —
see [tokens and billing](/docs/tokens-and-billing).

While you're setting up a study, the builder shows live feedback whenever your search space (based
on your strategy parameters alone) is finite:

- A running count of the total combinations in your search space, for example **Search space: 4,200
  combinations**.
- If your trial budget is larger than that count: a note telling you the search space is smaller
  than the number of trials you requested, and that the study will stop early once every
  combination has been tried.

## Finite grids replace your sampler

This is the single most important thing to know about sampler selection, and it's easy to miss.

A sampler like TPE, Random, or QMC can, in principle, propose the same combination more than once
— that's normal when the search space is effectively infinite. But when your search space is small
enough to enumerate completely, Fintela checks for that before your study starts: if the space is
finite and has **1,000,000 combinations or fewer**, the platform automatically switches to a grid
search — trying every combination exactly once, in an organized sweep — instead of using the
sampler you selected. Your sampler choice simply doesn't apply in that case.

The builder tells you this up front, right under the trial-count field:

> Finite grid (for example, 4,200 combinations): configurations are enumerated as a grid search —
> each tried at most once, no repeats — so the sampler below isn't applied.

What determines whether your space is finite:

- A parameter fixed to a single value contributes one option.
- A parameter you're choosing from a list of options contributes as many options as you selected.
- An integer range contributes one option per whole number in the range.
- A numeric (float) range becomes finite only if you set **Grid precision (decimals)** for it —
  that turns it into a fixed set of decimal steps. Leave grid precision empty and that range stays
  continuous (infinite), even if every other parameter is finite.

Your total search space size is the combination of every parameter you're optimizing — both in
your strategy and in any risk managers you've attached.

A few practical consequences:

- **Setting `Grid precision (decimals)` can flip a study from sampled search into grid search.**
  It's the one setting that turns a continuous parameter into a countable one, so applying it is
  exactly what can push a study over the line into full enumeration. Leave it blank to keep
  sampling continuously.
- **This switch doesn't care about your trial budget.** Even if you asked for far fewer trials than
  the grid contains, Fintela still enumerates the grid — because that guarantees you get that many
  distinct combinations, where a sampler would spend part of your budget re-trying points it
  already covered.
- **Above 1,000,000 combinations, the space is treated as effectively infinite** and your chosen
  sampler applies normally.
- **If every parameter is fixed to one value, there's nothing to search** — no sampler is involved
  at all.
- If a duplicate combination does slip through on a finite grid, it's recorded as a skipped trial
  rather than a failed one — these don't count against your study's health tracking and never
  trigger an early stop.
- The live estimate you see while building your study only accounts for your strategy's
  parameters. The full calculation, which also includes any risk managers you attach, is what
  actually determines whether grid search kicks in — so a study that looks just under the line in
  the builder can tip over once you attach a risk manager.

> [!TIP] The two quantum samplers are exempt
> QAOA and Q-Kernel always keep their normal sampling behavior, even on a finite search space —
> Fintela never silently swaps them for grid search. They manage their own duplicate-avoidance
> internally and run your full requested budget. This matters because a small, fully discretized
> search space is exactly the kind of space these samplers are designed for.

## Running in parallel

How many workers run your study at once is decided automatically by Fintela — there's no
concurrency or worker-count setting anywhere in the study builder or the API. What your sampler
choice controls is whether parallel execution is available to your study at all:

- **TPE, CMA-ES, Random, QMC, and NSGA-II** can all run across multiple parallel workers, using
  however many the platform assigns by default.
- **QAOA and Q-Kernel always run on a single worker**, because each keeps an internal model that
  can't be shared or split across workers.

Two other things can narrow how much parallelism your study actually gets, no matter which sampler
you picked:

- If your study uses an [external strategy or external fitness function](/docs/execution-modes)
  that declares a concurrency limit, your study runs on a single worker, and that worker's internal
  concurrency is capped at your declared limit — the smaller of the two limits if both your
  strategy and your fitness function are external, and halved if they both point at the same
  external endpoint. If you don't declare a limit, Fintela treats it as unbounded and your study
  keeps the normal parallel worker count.
- On a finite grid, the built-in grid search coordinates cleanly across however many workers are
  assigned, so every combination is still tried exactly once with no duplicates or gaps —
  parallelism doesn't change that guarantee.

## Multi-objective support

**There isn't any — every Fintela study optimizes a single objective.** The direction you're
optimizing for comes from the **Optimization objective** control in Advanced options, a
**Maximize** / **Minimize** toggle. If you leave it unset, Fintela infers the right direction from
your fitness function's natural sense — some built-in fitness functions are meant to be minimized
(drawdown-based ones, for example), and most are meant to be maximized. Like the sampler, this
direction is locked in once your study launches.

NSGA-II is included as a population-based sampler, not as a way to trade off multiple goals — even
though genetic algorithms like it are often used for multi-objective optimization elsewhere,
Fintela always runs it against your one objective. If you need to balance two things against each
other — say, return against drawdown — build that trade-off into a single custom
[fitness function](/docs/fitness-functions) rather than looking for a multi-objective mode.

## Reproducibility and randomness

There's no seed setting anywhere — not in the study builder, not through the API, not through
Fintelligent. In practice, that means:

| Sampler | Reproducible if you rerun the same study setup? |
|---|---|
| TPE, CMA-ES, Random, QMC, NSGA-II | No — each run explores a different sequence of trials |
| Grid search (on a finite space) | Yes — the same combinations are tried in the same order every time |
| QAOA, Q-Kernel | Yes, within a study — resuming or relaunching the same study reproduces its original behavior |

Grid search's consistency isn't primarily a reproducibility feature for you — it's how Fintela
keeps multiple parallel workers from duplicating each other's work on the same finite space. And
even a fully reproducible sampler doesn't guarantee an identical study end-to-end: the order trials
complete in across parallel workers, and exactly when the early-stop health check kicks in, still
depend on real-world timing.

## Comparing samplers in the app

The [study results view](/docs/analyzing-results) shows an **Algorithm** row with your study's
sampler as a chip, plus an info button — **Compare optimization algorithms** — that opens the
**Optimization Algorithms** dialog, subtitled *Speed vs. quality comparison across available
samplers*.

It scores all seven samplers across **Algorithm**, **Parallelism**, **Budget (trials)**, **Speed**,
and **Quality**, using simple 1–4 or 1–3 scales (● = high, ◌ = low), plus a **Best for** column:

| Sampler | Best for |
|---|---|
| TPE | General purpose, mixed parameter types |
| CMA-ES | High parallelism, continuous parameters |
| NSGA-II | Large population, categorical parameters |
| QMC | Systematic coverage, baseline-plus |
| Random | Baseline, very large search spaces |
| QAOA | Experimental — simulated quantum search |
| Q-Kernel | Experimental — simulated quantum-kernel Bayesian optimization |

A banner in the dialog sums up the trade-off: *Faster samplers (Random, QMC) scale perfectly across
many machines but explore the search space blindly. Slower samplers (TPE, CMA-ES) build
probabilistic models that guide the search more intelligently — but that model needs completed
trials before it can help.*

> [!NOTE] These are general guidelines, not a live measurement of your study
> The scores and budget ranges in this dialog reflect how each algorithm typically behaves — they're
> editorial guidance, not numbers computed from your specific run.

## Choosing an invalid sampler

You can't select an invalid sampler through the dropdown — it only ever shows the seven valid
options. This only comes up if you're setting the sampler through the
[Developer API](/docs/api-studies) or asking Fintelligent to configure one for you:

- Through the API, an unrecognized sampler value is rejected outright, with a clear message
  listing the valid options.
- Through Fintelligent, an invalid value is caught and rejected the same way before it ever reaches
  your study — though Fintelligent is forgiving about capitalization and stray spaces, so asking
  for "tpe" works just as well as "TPE".

Related reading: [optimizer architecture](/docs/optimizer-architecture),
[execution modes](/docs/execution-modes), [study lifecycle](/docs/study-lifecycle), and the
[Developer API](/docs/api-studies).
