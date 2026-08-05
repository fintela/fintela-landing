---
title: Execution modes
section: Configuration
sectionOrder: 3
order: 1
published: true
updated: 2026-08-04
summary: Internal vs external strategies and fitness — the 2×2 mode matrix.
keywords: internal, external, modes, matrix, execution_type, simulate, evaluate
---

Strategies and fitness functions each run in one of two execution modes — **internal**
(Python hosted by Fintela) or **external** (HTTPS endpoint hosted by you). They can be
combined freely, giving four ways to wire up an optimization study.

## The 2×2 matrix

| Mode | What it is | Complexity | Use for |
|---|---|---|---|
| **Internal × Internal** | Both strategy and fitness are Python stored in Fintela. Fastest to ship, no infra to run. | Low | Quick prototyping, classic technical signals, standard scoring. |
| **Internal × External** | Strategy lives in Fintela; fitness scoring lives behind your endpoint. | Medium | Custom or regulator-aware scoring that must stay on your infra. |
| **External × Internal** | Proprietary signal logic stays on your servers; Fintela handles scoring. | Medium | When your alpha is the strategy and you don't want to share the code. |
| **External × External** | Fully self-hosted strategy + fitness. Fintela is pure orchestration. | High | Fully air-gapped research stacks. Maximum control. |

## What each mode requires

| Mode | Strategy execution | Fitness execution | Hosting required |
|---|---|---|---|
| `internal × internal` | In-process Python | In-process Python | None |
| `internal × external` | In-process Python | HTTPS `POST /evaluate` | Fitness endpoint |
| `external × internal` | HTTPS `POST /simulate` | In-process Python | Strategy endpoint |
| `external × external` | HTTPS `POST /simulate` | HTTPS `POST /evaluate` | Both endpoints |

> [!TIP] Start internal, graduate external
> The fastest learning loop is to start with internal × internal — there's no
> infrastructure to deploy. Once you've validated the workflow, externalize whichever piece
> you want to keep proprietary.

## Mixing modes

Mode is set per **strategy record** and per **fitness record**, not per study. A study just
references ids — the optimizer reads each record's `execution_type` at runtime and dispatches
accordingly.

That means you can:

- Build a library of internal strategies and one external fitness — combine freely
- Swap an internal fitness for an external one without touching the study config
- Run the same external strategy against different fitness functions to test scoring
  sensitivity

> [!WARNING] Mode is immutable
> Once a strategy or fitness is created with `execution_type: "internal"`, you cannot flip it
> to external (or vice versa) — create a new record instead. This is enforced both in the UI
> and at the API layer.

> [!NOTE] Risk managers follow the same pattern
> The internal / external split is not unique to strategies and fitness functions. Risk
> managers can also run inside Fintela — as built-in rules, no-code rule-based combinations,
> or custom Python — or externally behind your own endpoint. See
> [Managing risk managers](/docs/managing-risk-managers) for the details.
