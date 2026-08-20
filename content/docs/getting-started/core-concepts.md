---
title: Core concepts
section: Getting Started
sectionOrder: 1
order: 3
published: true
updated: 2026-08-20
summary: The vocabulary — asset groups, strategies, fitness, risk managers, studies, trials, portfolios.
keywords: concepts, vocabulary, glossary, strategy, fitness, study, trial, portfolio, asset group, risk manager, promotion, basket
---

Fintela is built on ten objects, and almost every screen and API path in the product is about one
of them. Four are inputs you author — an **asset group**, a **strategy**,
a **fitness function** and **risk managers**. One binds them into a search: a **study**. The search
emits **trials**, each completed trial leaves a **candidate portfolio**, promoting one produces a
**promoted portfolio**, a **portfolio group** holds those, and an **operation** deploys a group
against a broker. This page defines each object precisely — what it holds, what creates it, what
consumes it — and names the page that owns the detail.

## The object graph

Read it top to bottom: everything above a line is an input to what is below it.

```text
  ASSET GROUP        STRATEGY        FITNESS FUNCTION      RISK MANAGERS
  the universe    the signal rule      the objective        the guard rails
        │                │                    │                   │
        └────────────────┴─────────┬──────────┴───────────────────┘
                                   ▼
                                 STUDY                   developers.studies
             one optimization campaign — parameter search space,
             train / validation / out-of-sample windows, sampler,
             trial budget. Created as a draft; launched separately.
                                   │  launch (a separate, billed action)
                                   ▼
                                 TRIAL                    developers.trials
             one parameter combination the optimizer evaluated
             WAITING → RUNNING → COMPLETE, PRUNED or FAIL
                                   │  COMPLETE trials only
                                   ▼
                       CANDIDATE PORTFOLIO            developers.portfolios
             the backtest one trial left behind — equity, holdings,
             orders, trades, per-stage metrics, seed
                                   │  Promote
                                   ▼
                        PROMOTED PORTFOLIO     developers.managed_portfolios
             a frozen, study-independent copy, extended one bar per day
                                   │  add as a member
                                   ▼
                          PORTFOLIO GROUP
             a book of promoted portfolios plus one shared allocation,
             rebalance and execution configuration
                                   │  one deployment per broker connection
                                   ▼
                               OPERATION        developers.basket_operations
             capital, status and its own rebalance clock
```

The graph has one loop. A portfolio group can be a **member of an asset group**: its stitched equity
curve is unioned into the strategy price panel as a `BASKET:<uuid>` pseudo-ticker and scored exactly
like a ticker price series. That is how you build a portfolio of your own portfolios — the output of
the pipeline re-entering it as an input.

## Objects at a glance

| Object | The question it answers | Documented on |
|---|---|---|
| Asset group | Which instruments am I allowed to trade? | [Asset Groups](/docs/asset-groups) |
| Strategy | On this date, what do I hold, on which side, at what weight? | [Strategies](/docs/strategies) |
| Fitness function | Was that period good? — as one number | [Fitness Functions](/docs/fitness-functions) |
| Risk manager | What must never be allowed to happen? | [Risk Managers](/docs/risk-managers) |
| Study | Which parameter values are best, and how do I search for them? | [Studies](/docs/studies) |
| Trial | What happened at this one parameter combination? | [Study lifecycle](/docs/study-lifecycle) |
| Candidate portfolio | What did that trial actually produce? | [Portfolio Detail](/docs/portfolio-detail) |
| Promoted portfolio | Which results am I keeping, permanently? | [Promoted Portfolios](/docs/promoted-portfolios) |
| Portfolio group | How is my book weighted, rebalanced and executed? | [Portfolio Groups](/docs/portfolio-groups) |
| Operation | Where is real capital, on which broker, in what state? | [Live trading](/docs/live-trading) |

Seven of those ten — asset groups, strategies, studies, fitness functions, risk managers,
portfolio groups and promoted portfolios — are the seven **registries**. A registry is an
organization-scoped catalogue of one kind of object; [Registries](/docs/registries) documents every
convention they share. Trials, candidate portfolios and operations have no registry of their own:
they are produced by machinery, not authored.

## Asset group

A named, saved, **frozen** list of instruments — the universe half of an experiment. You build one
in a screener that filters the whole market, but only the resulting selection is saved. The filters
are never stored and never re-evaluated.

| Aspect | Detail |
|---|---|
| Contains | `tickers_id` — a JSONB array of integer ticker ids — and `basket_members`, a JSONB array of `{"basket_id": <uuid>, "injection_mode": "curve"}`. A row is valid when at least one of the two arrays is non-empty, so a members-only group with no tickers at all is legal |
| Does not contain | No date range, no timeframe, no data provider. There are no date columns on the table — windows belong to the study |
| Created by | The Asset Groups registry at `/asset-groups`. The [study](/docs/studies) builder also materializes one automatically when you pick a platform grouping as a universe; those derived rows are hidden from the registry |
| Consumed by | A study, as `strategy_data_cluster_id` and optionally a second one as `fitness_data_cluster_id` |
| Persisted as | `developers.data_clusters` |
| Reference | [Asset Groups](/docs/asset-groups), [API: Asset groups](/docs/api-asset-groups) |

An asset group is data, not code — it has no execution mode, no code and no compile step.

## Strategy

The rule that turns market data into a **signal**: a mapping of rebalancing date → ticker →
`{"position": "L"|"S", "allocation": number}`. Everything downstream — the simulation engine, the
optimizer, the daily portfolio updater — consumes that one dictionary. The strategy decides *what to
hold*; it does not decide whether the result was good, and it does not sweep its own parameters.

| Aspect | Detail |
|---|---|
| Contains | `execution_type` (`INTERNAL` or `EXTERNAL`), `execution_details` (your Python, or the endpoint URL), and a `parameters` array declaring each knob's name and dtype |
| Parameter dtypes | `integer`, `float`, `categorical`. A categorical parameter declares a `choices` list of strings and your code receives the chosen string. A strategy declares the dtype only — no bounds, no step, no default; those fields do not exist on it |
| Created by | The Strategies registry editor at `/strategy` |
| Consumed by | A study binds exactly one; the sandbox runs one ad hoc; the daily updater runs the snapshot copy behind a promoted portfolio |
| Persisted as | `developers.strategies`, with an append-only `developers.strategy_versions` log |
| Reference | [Strategies](/docs/strategies), [Execution modes](/docs/execution-modes), [External strategies](/docs/external-strategies) |

## Fitness function

The objective a study optimizes. It reduces one simulated period — the equity curve, the metrics
already computed for that window, the holdings, orders and trades — to exactly one finite float, and
the sampler moves that number in one direction. Nothing else on the platform decides what "better"
means.

| Aspect | Detail |
|---|---|
| Contains | `execution_type` (`INTERNAL`, `EXTERNAL` or `BUILTIN`), `execution_details`, and a `parameters` array |
| Created by | The Fitness Functions registry at `/fitness`. Built-ins are platform-seeded and read-only — they cannot be created, edited, duplicated, deleted or sandboxed |
| Consumed by | A study binds exactly one. In a study its parameters take **one constant value each** (`fitness_parameters`) — they are never searched |
| Which score drives the search | Only the **train**-stage value. Validation, out-of-sample and overall scores are computed and stored, but never fed back to the sampler |
| Persisted as | `developers.fitness`, with an append-only `developers.fitness_versions` log |
| Reference | [Fitness Functions](/docs/fitness-functions), [External fitness](/docs/external-fitness) |

> [!WARNING] The optimizer does not always maximize
> A study carries one `optimization_direction`, set at creation and frozen at launch. Its default is
> `NOT_SET`, which means *inherit the objective's natural direction* — a custom objective maximizes,
> a `lower_is_better` built-in minimizes — and any study can be pinned to `MAXIMIZE` or `MINIMIZE`.
> See [Fitness Functions](/docs/fitness-functions).

## Risk manager

The governance layer of a backtest. On every simulated bar it inspects the portfolio as it stood
after the previous bar and, **before** the strategy is allowed to rebalance, it can close positions,
trim them, or suppress the rebalance entirely. It never replaces the strategy's book — it only
overrides it, and it can never issue targets of its own.

| Aspect | Detail |
|---|---|
| Contains | `kind` (`BUILTIN`, `DECLARATIVE`, `INTERNAL` or `EXTERNAL`), either a `builtin_name` or `execution_details`, plus `params` and a `parameters` declaration |
| Created by | The Risk Managers registry at `/risk-managers`, for the three custom kinds. Built-ins are catalogue entries you *attach*; they never appear as registry rows |
| Consumed by | A study, as a **zero-or-more ordered stack**. Each attachment carries its own `execution_order` and its own `parameter_ranges`, so the optimizer can tune a risk manager's thresholds alongside the strategy's parameters |
| Persisted as | `developers.risk_managers` (attachments in `developers.study_risk_managers`), with an append-only `developers.risk_manager_versions` log |
| Reference | [Risk Managers](/docs/risk-managers) |

## Study

One optimization campaign. It binds exactly one strategy, one fitness function and one asset group —
plus optionally a second asset group for fitness and an ordered stack of risk managers — to a date
window, a sampler, a parameter search space and a trial budget. **Creating a study does not start
it.** A new study lands as a draft; launching is a separate action that spends tokens.

| Aspect | Detail |
|---|---|
| Binds | `strategy_id`, `fitness_id`, `strategy_data_cluster_id`, optional `fitness_data_cluster_id`, and zero or more risk managers |
| Contains | `n_trials`, `sampler`, `parameter_ranges`, `fitness_parameters`, `optimization_direction`, `grid_decimals`, `eligibility_policy`, `autostop_min_health`, and the windows `train_start_date`, `train_end_date`, `validation_start_date`, `validation_end_date`, `oos_start_date`, `oos_end_date` |
| Two names | `display_name` is what you typed; `study_name` is a machine key — a slug plus an 8-character hex discriminator, minted server-side, globally unique and immutable |
| Created by | The study builder at `/studies` — a single-screen pipeline canvas, not a stepper, ending in `Save Draft` or `Save & Launch` |
| Consumed by | The optimizer. Launch pins `strategy_version_id` and `fitness_version_id`, so editing a strategy afterwards cannot rewrite a result you already have |
| Persisted as | `developers.studies`; its execution status lives in `developers.study_runtime_status.last_status`, not on the studies row |
| Reference | [Studies](/docs/studies), [Study lifecycle](/docs/study-lifecycle), [Sampler selection](/docs/sampler-selection), [Optimizer architecture](/docs/optimizer-architecture) |

A study has no execution mode of its own — it inherits whatever the strategy and fitness function it
binds are, and pairing an internal one with an external one is normal.

## Trial

One parameter combination the optimizer sampled and evaluated. A trial is a bookkeeping row: it has
a number, a state and the concrete parameter values it was given.

| Aspect | Detail |
|---|---|
| Contains | The trial number, its state, start and completion timestamps, and its sampled parameter values (`developers.trial_params`) |
| States | The Postgres enum `developers.trialstate`, exactly five values: `WAITING`, `RUNNING`, `COMPLETE`, `PRUNED`, `FAIL`. The last three are terminal |
| Created by | The optimizer, one per sampled point, until the trial budget is exhausted, a finite grid runs out, the autostop health threshold fires, or the study is stopped |
| Consumed by | The study's progress and health meters, and — for `COMPLETE` trials only — the candidate portfolio writer |
| Persisted as | `developers.trials` |
| Reference | [Study lifecycle](/docs/study-lifecycle), [API: Trials & portfolios](/docs/api-trials-portfolios) |

## Candidate portfolio

The backtest one completed trial left behind. This is the object the dashboards call *a portfolio*,
and it is what you rank, overlay, compare and eventually promote.

| Aspect | Detail |
|---|---|
| Contains | The equity curve, holdings, orders, trades, per-stage metrics, and the **seed** — the exact date-by-date signal the engine consumed for that trial |
| Metric stages | `train`, `validation`, `out_of_sample`, `real_life_performance` and `overall`, plus nine rolling windows. Which ones exist depends on the study — see [Metrics Reference](/docs/metrics-reference) |
| Created by | The optimizer, **one row per `COMPLETE` trial**. Pruned and failed trials leave no portfolio row at all |
| Consumed by | The [Portfolios Dashboard](/docs/portfolios-dashboard), the [Optimization Dashboard](/docs/optimization-dashboard), the six tabs of [Portfolio Detail](/docs/portfolio-detail), and the promote action |
| Persisted as | `developers.portfolios`, unique on `(study_id, trial)` |
| Reference | [Portfolio Detail](/docs/portfolio-detail), [Visualizations](/docs/visualizations) |

> [!CAUTION] A candidate portfolio belongs to its study
> Delete the study and its trials and their candidate portfolios go with it. Promotion is what makes
> a result survive — see below.

## Promoted portfolio

The durable, study-independent copy a trial becomes when you promote it. Promotion takes a full
**isolation snapshot** and copies the trial's holdings, equity and orders into a parallel data
plane. From that moment the copy is frozen: editing the strategy, the risk managers or the asset
group it came from never changes it.

| Aspect | Detail |
|---|---|
| Contains | `strategy_snapshot`, `concrete_params`, `strategy_tickers_id`, optional `fitness_snapshot` and `fitness_parameters`, `risk_manager_configs`, the study's date windows, and a `seed` that is extended one bar per day |
| Created by | The **Promote** action on the [Portfolios Dashboard](/docs/portfolios-dashboard) or in the Portfolio Analysis header, and implicitly when a raw trial id is added to a portfolio group. Only trials whose strategy is `INTERNAL` can be promoted. One managed copy per source trial per organization — `UNIQUE (organization_id, source_trial_portfolio_id)` — so promoting the same trial twice is idempotent |
| Consumed by | Portfolio group membership — it is the **only** object a group can hold — the daily updater, and the read-only `GET /v2/portfolios` |
| Survives | Deletion of the study, the trial and the strategy. The lineage column `source_trial_portfolio_id` is `ON DELETE SET NULL`, so losing the source only loses the link |
| Persisted as | `developers.managed_portfolios` |
| Reference | [Promoted Portfolios](/docs/promoted-portfolios) |

## Portfolio group

A named container holding a set of promoted portfolios plus **one shared trading configuration**. It
answers three questions about a book of strategies: how is it weighted, how often is it re-weighted,
and how do its orders reach a broker.

| Aspect | Detail |
|---|---|
| Contains | Members (one row per promoted portfolio in `developers.basket_members`, each with a `weight` that only the manual allocation method reads), an allocation recipe, a rebalance cadence, an execution and protective policy, and a staged backtest track record |
| Created by | The Portfolio Groups wizard, which unlike every other registry has real routes: `/analysis/portfolio-groups/groups/create` and `/analysis/portfolio-groups/groups/:groupId/edit` |
| Consumed by | [Portfolio Manager](/docs/portfolio-manager) for analysis, operations for deployment, and an [asset group](/docs/asset-groups) that injects its equity curve as a `BASKET:<uuid>` pseudo-ticker |
| Persisted as | `developers.portfolio_manager_baskets`, with membership in `developers.basket_members` |
| Reference | [Portfolio Groups](/docs/portfolio-groups), [Portfolio Manager](/docs/portfolio-manager) |

The only hierarchy is **Portfolio Group → members → operations**. A portfolio group does not contain
other portfolio groups.

## Operation

One deployment of one portfolio group against one broker connection. The group holds the shared
trading rules; the operation holds the capital, the status and its own rebalance clock.

| Aspect | Detail |
|---|---|
| Contains | `connection_id`, `provider`, an optional `operational_name`, `target_capital`, `last_status` and `desired_status`, and its own `last_rebalanced_at` / `rebalance_requested_at` |
| Statuses | `DRAFT`, `ACTIVE`, `PAUSED`, `STOPPED` — the same four values for both the last and the desired status |
| Created by | **Deploy Portfolio Group** on a group row, which creates *and* launches in one pass, or **Trade with your brokerage** on the group's Operations tab, which leaves a `DRAFT` you launch yourself. Creating an operation never places an order; **Launch** is what does |
| Consumed by | The broker orchestrator, and the Operations tab at `/analysis/portfolio-manager/:basketId/operations` |
| Cardinality | `UNIQUE (basket_id, connection_id)` — at most one operation per group per connection, so one group can run several operations side by side on different connections, and paper alongside live once live opens |
| Persisted as | `developers.basket_operations` |
| Reference | [Live trading](/docs/live-trading), [Portfolio Groups](/docs/portfolio-groups), [API: Baskets](/docs/api-baskets) |

> [!NOTE] Paper is what ships
> Live-money broker connections are gated platform-wide behind the `ALLOW_LIVE_BROKER_TRADING`
> switch, which is off by default: creating one is refused server-side with a `403`, independently
> of the UI. The paper workflow is identical. See [Live trading](/docs/live-trading).

## Naming aliases

Three objects were renamed in the UI layer only. The old names survive in routes, API paths,
database tables, permission strings and quota keys — which is where the confusion starts. State both
names when you write a client.

### Asset Group is a data cluster underneath

| Layer | Name in use |
|---|---|
| UI label, nav entry, route | **Asset Groups**, `/asset-groups` |
| Legacy UI route | `/dataCluster/*` — redirects to `/asset-groups/*` |
| Backend HTTP paths | `/data_clusters`, `/data_clusters/from_grouping`, … |
| Developer API | `GET /v1/data_clusters` |
| Database table | `developers.data_clusters` |
| Study foreign keys | `strategy_data_cluster_id`, `fitness_data_cluster_id` |
| Backend permission strings | `data_cluster:read`, `data_cluster:create`, `data_cluster:update` |
| Entitlement quota key | `data_clusters` |

### Portfolio Group is a basket underneath

| Layer | Name in use |
|---|---|
| UI label, nav entry, registry route | **Portfolio Groups**, `/analysis/portfolio-groups` |
| SPA structure page | `/analysis/portfolio-groups/baskets/:basketId` |
| Portfolio Manager routes | `/analysis/portfolio-manager/:basketId/…` |
| Backend HTTP paths | `/portfolio_manager/baskets`, `/portfolio_manager/baskets/:id/operations`, … |
| Developer API | `GET /v2/baskets` |
| Database tables | `developers.portfolio_manager_baskets`, `developers.basket_members`, `developers.basket_operations` |
| Entitlement quota key | `baskets` |

The `baskets` segment inside the SPA path is deliberate and load-bearing — bookmarks, notification
deep links and the activity feed all point at it.

### Promoted portfolio is a managed portfolio underneath

| Layer | Name in use |
|---|---|
| UI label, nav entry, route | **Promoted Portfolios**, `/promoted-portfolios` |
| Backend HTTP paths | `/portfolio_manager/managed`, `/portfolio_manager/managed/promote`, … |
| Developer API | `GET /v2/portfolios` |
| Database table | `developers.managed_portfolios` |
| Entitlement quota key | `managed_portfolios` |

### "Portfolio" on the API means two different things

The word appears on two developer-API paths and means different objects on each. This is the single
most expensive naming trap in the product.

| Path | What it actually serves | Id field | Status |
|---|---|---|---|
| `/v2/trials` | Candidate portfolios — one row per (study, trial number) | `trial_id` | Current |
| `/v1/portfolios` | The **same rows**, under the old name, with two fields renamed | `portfolio_id` | Deprecated |
| `/v2/portfolios` | **Promoted portfolios** — durable copies of promoted trials | `managed_portfolio_id` | Current |

`/v1/portfolios/42` and `/v2/portfolios/42` are unrelated objects in separate id spaces. See
[API: Trials & portfolios](/docs/api-trials-portfolios).

## Terms that are not objects

| Term | What it actually is |
|---|---|
| **Seed** | Not an object of its own — a column. The exact date-by-date signal the engine consumed, stored on a candidate portfolio and on a promoted portfolio, downloadable from a trial. See [Portfolio Detail](/docs/portfolio-detail) |
| **Data pipeline** | **Retired.** `/data-pipelines/*` redirects to the [Data Explorer](/docs/data-explorer). A strategy now selects its data sources in its own editor |
| **Basket** | The persistence and API name for a portfolio group. It is not a nested container inside one |
| **Managed portfolio** | The persistence name for a promoted portfolio. Same row, same table |
| **Registry** | Not an object — the shared set of conventions the seven object catalogues follow. Five of them render through one workbench frame; all seven share the row-click gesture, the URL-backed filters and the delete-blocked-while-referenced rule. See [Registries](/docs/registries) |

## Where to go next

| Read | For |
|---|---|
| [Quickstart](/docs/quickstart) | The shortest real path — one strategy, one study, one set of results |
| [Registries](/docs/registries) | Every convention the seven object catalogues share |
| [End-to-end workflow](/docs/end-to-end-workflow) | The complete path from a blank account to a deployed portfolio group |
| [Execution modes](/docs/execution-modes) | Internal versus external, and exactly which objects carry a mode |
| [Study lifecycle](/docs/study-lifecycle) | Every state a study and a trial can be in |
| [Metrics Reference](/docs/metrics-reference) | Every number a candidate portfolio carries, and the stages it is measured over |
