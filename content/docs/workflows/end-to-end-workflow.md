---
title: End-to-end workflow
section: Workflows
sectionOrder: 5
order: 1
published: true
updated: 2026-08-20
summary: The full lifecycle in order — asset group, strategy, optimization, promotion, deployment.
keywords: workflow, lifecycle, end to end, asset group, strategy, study, optimize, promote, deploy, paper, live
---

Fintela is one pipeline, walked once: freeze a universe, write the code that trades it, choose the number that decides what "better" means, optionally bolt on guard rails, sweep the parameter space, read the candidates that fall out, keep the ones worth keeping, group them into a book, and point that book at a broker. This page walks that path in the order you actually do it. It names the screen, the button and the decisions at each step, then hands off to the page that documents that step in full — it is a map, not a substitute for the [registries](/docs/registries).

## The lifecycle at a glance

```text
  ┌── REGISTRY ───────────────────────────────────────────────────────────┐
  │                                                                       │
  │   1  Asset Group        /asset-groups        the universe             │
  │   2  Strategy           /strategy            the signal               │
  │   3  Fitness Function   /fitness             the objective            │
  │   4  Risk Managers      /risk-managers       guard rails (optional)   │
  │              │                                                        │
  │              └──────────────┐                                         │
  │                             ▼                                         │
  │   5  Study              /studies             one campaign → N trials  │
  │                             │                                         │
  └─────────────────────────────┼─────────────────────────────────────────┘
                                ▼
  ┌── ANALYSIS ───────────────────────────────────────────────────────────┐
  │   6  Candidates         /analysis/portfolios   rank · compare         │
  │   7  Promote            (same screen)          → a promoted portfolio │
  │                             │                                         │
  └─────────────────────────────┼─────────────────────────────────────────┘
                                ▼
  ┌── TRADING ────────────────────────────────────────────────────────────┐
  │   8  Portfolio Group    /analysis/portfolio-groups   members + policy │
  │   9  Operation          one per broker connection    paper or live    │
  └───────────────────────────────────────────────────────────────────────┘

     back-edge: 6 ──► duplicate the study with narrower ranges ──► 5
```

Every stage but one persists an object you can reuse — stage 6 is pure analysis and writes nothing. You build the library once and recombine it forever.

| # | Stage | Where | Object it creates | Full reference |
|---|---|---|---|---|
| 1 | Freeze the universe | Registry → **Asset Groups** | Asset group | [Asset groups](/docs/asset-groups) |
| 2 | Write the signal | Registry → **Strategies** | Strategy (+ versions) | [Strategies](/docs/strategies) |
| 3 | Choose the objective | More Options → **Fitness Functions** | Fitness function | [Fitness functions](/docs/fitness-functions) |
| 4 | Add guard rails | More Options → **Risk Managers** | Risk manager | [Risk managers](/docs/risk-managers) |
| 5 | Sweep the space | Registry → **Studies** | Study → trials | [Studies](/docs/studies) |
| 6 | Read the output | Analysis → **Portfolios** | nothing — it is a read surface | [Optimization dashboard](/docs/optimization-dashboard) |
| 7 | Keep a winner | Analysis → **Portfolios** | Promoted portfolio | [Promoted portfolios](/docs/promoted-portfolios) |
| 8 | Assemble a book | Registry → **Portfolio Groups** | Portfolio group | [Portfolio groups](/docs/portfolio-groups) |
| 9 | Send it to a broker | Portfolio Groups or Portfolio Manager | Operation | [Live trading](/docs/live-trading) |

> [!NOTE] Two sidebar sections, one flyout
> Asset Groups, Strategies, Studies and Portfolio Groups sit in the sidebar's **Registry** section. Fitness Functions, Risk Managers and Promoted Portfolios live behind the **More Options** flyout under it. Portfolios and Portfolio Manager sit in **Analysis**. Every route deep-links whether or not its entry is visible — see [navigation](/docs/navigation).

## Before you begin

Nothing has to be configured before stage 1. Three things become relevant later, and it is cheaper to know them now than to discover them at stage 9.

| Thing | When it starts to matter | Notes |
|---|---|---|
| Token balance | Stage 5 — launching a study is a billed action | A study is charged up front for the `n_trials` it *might* run and refunded the difference on completion. See [tokens and billing](/docs/tokens-and-billing) |
| Free-tier creation caps | Stages 1–5, 7 and 8 | Every registry meters *creation only*; reads, edits, deletes and stops are never gated. The caps are a live database setting, not a constant. Strategies, Studies, Fitness Functions and Asset Groups show a `used/limit` meter in the command bar; Risk Managers shows a headroom bar in the footer strip; Portfolio Groups and Promoted Portfolios show neither, though their quotas are still enforced server-side. See [registries](/docs/registries) |
| A broker connection | Stage 9 only | Added under **Account settings → Broker connections**. Nothing before stage 9 needs it. See [account setup](/docs/account-setup) |

> [!WARNING] Pick Internal at stage 2 if you intend to trade this
> An **External** strategy — one you host yourself — can be studied and analysed normally, but it **cannot be promoted**, which means it can never become a portfolio-group member and never reaches a broker. The refusal is HTTP 400: `trial portfolio {id} uses an EXTERNAL strategy ({execution_type}); managed daily-update mode supports INTERNAL strategies only, so it cannot be promoted or tracked`. The path ends at stage 6 for external work. See [execution modes](/docs/execution-modes).

## 1. Freeze the universe — Asset Group

**`Registry → Asset Groups → New Asset Group`** (`/asset-groups`, or `/asset-groups?mode=create`)

An asset group is the frozen list of instruments a study is allowed to trade. You build it in a screener that filters the whole market by classification, size and value, and performance — but **only the resulting selection is saved**. The screen says so outright: *An Asset Group saves a fixed ticker list; filters are not re-evaluated later.* Name and description are collected by the confirm dialog at save time, not on the working surface.

| Decision | What turns on it |
|---|---|
| **Exchange** — `US`, `Crypto` or `Forex` | Scopes discovery, not the group. Switching exchanges never touches what you have already selected, so a multi-market group is built by switching and adding |
| **Include no-data** (off by default) | Off, instruments with no recent price data are hidden. On a historical index universe you usually want them — the survivorship banner offers **Include them** rather than flipping it for you |
| Tickers, portfolio groups, or both | A group can also hold whole [portfolio groups](/docs/portfolio-groups), injected as `BASKET:<uuid>` pseudo-tickers whose equity curve is scored like a price series. That is the portfolio-of-portfolios case |
| Whether to build one at all | The [study](/docs/studies) builder can pick a **Platform sets (indices, sectors, ETFs)** entry directly — a curated collection, an index, a sector, a sector ETF set, a country or an industry. That materializes a derived group behind the scenes, which never appears in this registry |

> [!WARNING] An asset group has no dates
> There is no start date, no end date, no timeframe and no data-provider field on an asset group. The date window belongs to the study. What the group *does* expose is its members' **date coverage**, which the study builder reads to clamp its own date pickers.

Full reference: [Asset groups](/docs/asset-groups).

## 2. Write the signal — Strategy

**`Registry → Strategies → New Strategy`** (`/strategy`, or `/strategy?mode=create`)

A strategy answers one question per rebalancing date: which instruments do I hold, on which side, at what weight. It returns a signal — date → ticker → `{position, allocation}` — and everything downstream consumes that one dictionary. The editor is a single screen: a Monaco Python editor in the centre, a rail of collapsible sections beside it, and a naming dialog at the end.

| Decision | What turns on it |
|---|---|
| **Internal** vs **External** | Chosen once and **frozen** — an existing strategy can never change execution type. Internal is Python Fintela runs; External is an endpoint you host, reachable over `http` or `https` alike. **Rule-based** is permanently disabled: *"Rule-based strategies are coming soon."* |
| Which **parameters** to declare | These, and only these, become the optimizer's search space at stage 5. Three dtypes: **Integer**, **Float**, **Categorical** (a declared set of string choices). Every parameter needs a **Test value** before the save will validate |
| The **lookback** declaration | Its *maximum* at stage 5 decides how much history the study needs before its start date, and therefore which tickers get excluded for insufficient warm-up |
| Whether to sandbox first | **Run a backtest** on the row menu runs one backtest at fixed values over a group and window. It costs **1 token** and is the cheapest way to find out the code works before paying for a sweep |

Saving is gated on a server-side validation run against a real data slice — the compiler executes your code before it will accept the write. The name you type in the naming dialog is lowercased, spaces become `_`, and it **renames the Python entry point in your code**, because the compiler rejects a function whose name does not match the registry name.

> [!NOTE] Editing a strategy never rewrites a result you already have
> Every save appends a version. Launching a study pins `strategy_version_id` and `fitness_version_id`, so a launched study keeps running against the exact version it started with.

Full reference: [Strategies](/docs/strategies), plus [external strategies](/docs/external-strategies) for the `POST /simulate` contract.

## 3. Choose the objective — Fitness Function

**`More Options → Fitness Functions → New Fitness`** (`/fitness`, or `/fitness?mode=create`)

A fitness function reduces one simulated window — the equity curve, the metrics, the holdings, the orders, the trades — to exactly one finite number, and the sampler moves that number in one direction. Nothing else on the platform decides what "better" means, which makes this the most consequential choice on the study canvas. Two objectives over the same strategy will pick different parameters.

| Decision | What turns on it |
|---|---|
| **Built-in** vs **Internal** vs **External** | Built-ins are platform-seeded and read-only: they cannot be created, edited, duplicated, deleted or sandboxed, and a study using one accepts no fitness parameters and no fitness asset group. Internal and External behave like strategies, and the type is frozen after creation |
| Which window the score comes from | The optimizer calls the objective once per window. Only the **train** score is fed to the sampler; validation, overall and out-of-sample are computed and stored but never steer the search |
| Direction | Set on the study, not here — it defaults to the objective's own natural direction. A `lower_is_better` built-in therefore **minimizes** under the default setting |
| Whether you need one at all | If you only need a standard metric, skip creation entirely and pick a built-in at stage 5 |

> [!WARNING] There is no multi-objective or Pareto mode
> A study writes exactly one objective and one direction. **Rule-based (declarative)** fitness functions are refused by the server — `Rule-based (declarative) fitness functions are not supported yet.` — so do not plan around them.

Full reference: [Fitness functions](/docs/fitness-functions), plus [external fitness](/docs/external-fitness).

## 4. Add guard rails — Risk Managers

**`More Options → Risk Managers → New Risk Manager`** (`/risk-managers`) — **optional**

A risk manager runs on every simulated bar, inspects the portfolio as it stood after the previous bar, and acts *before* the strategy is allowed to rebalance. It can close positions, trim them, or suppress the rebalance entirely. It never replaces the strategy's book, only overrides it — a risk manager can never issue `set_targets`.

| Decision | What turns on it |
|---|---|
| Whether to attach any on the first pass | The study builder's Optimization *why* popover says it outright: *Risk managers are OPTIONAL, and leaving them off for a first pass is usually right: a study of the bare signal tells you whether the signal works, which a stop-loss mixed in from the start would hide.* |
| Which kind | **Built-in** (ten catalog rules), **Rule-based** (a composed rule tree, no code), **Custom code** (Python), **External HTTP**. You author the last three here; this is the only registry where rule-based is live, because both strategies and fitness functions refuse a declarative save |
| Where you pick a built-in | **Built-ins never appear in this registry.** `/risk-managers` lists only the kinds you authored. You choose a built-in when you *attach* one at stage 5 |
| Which parameters the optimizer tunes | Each attachment's parameters carry a **Fixed** / **Optimized** toggle. Optimized ones are sampled alongside the strategy's own, namespaced `rm_<attachment>_<param>` |

Attachment happens inside the study, in **Advanced options → Risk Managers**, where you also order the stack. The execution order legend reads **Halts / closes → Sells → Buys → Strategy rebalance**.

> [!CAUTION] Attachments are replace-all, and they are snapshots
> Saving the attachment set writes the whole list — anything you left out is detached. Each attachment stores a **snapshot** of the risk manager, so editing or deleting the registry row never changes a study that already has it attached. Attachments can only be changed while a study is in `SAVED` status.

Full reference: [Risk managers](/docs/risk-managers).

## 5. Sweep the space — Study

**`Registry → Studies → New Study`** (`/studies`, or `/studies?mode=create`)

A study binds exactly one strategy, one fitness function and one asset group, plus an optional ordered stack of risk managers, to a date window, a parameter search space, a sampler and a trial budget. The builder is **one screen, not a stepper**: a canvas of four blocks, an action bar, and a confirmation dialog that owns both writes.

```text
  ┌─────────────┬─────────────┬─────────────┬──────────────┐
  │ Asset Group │  Strategy   │   Fitness   │ Optimization │
  │  universe   │   signal    │  objective  │  budget +    │
  │  + window   │  + params   │  + params   │  advanced    │
  └─────────────┴─────────────┴─────────────┴──────────────┘
             ↓ Study name  ·  Cancel  ·  Continue
                 ┌────────────────────────────┐
                 │    Confirm your study      │
                 │ recap · cost · warnings    │
                 │ Save Draft │ Save & Launch │
                 └────────────────────────────┘
```

Each block carries a *why* popover naming what it decides — **The universe and the period**, **What generates the positions**, **What the search is trying to improve**, **How the search runs, and what it costs**.

| Block | Decisions that matter |
|---|---|
| **Asset Group** | **Start date** / **End date** — clamped to the group's own coverage. **Train / validation split** (70 % train), **Include out-of-sample period** (on) and **OOS size** (10 %) under Advanced options. There is **no walk-forward or rolling re-optimization**: one contiguous window, partitioned once |
| **Strategy** | Per parameter, **Fixed** or **Optimized**, with min/max or a choices subset. Changing the strategy **wipes** the parameter configuration and every attached risk manager, so pick it before tuning anything |
| **Fitness** | The objective, plus a fitness asset group for a custom objective. Fitness parameters are constants, never search dimensions |
| **Optimization** | **Number of trials** (default **1000**), **Sampler** (default **TPE**), **Optimization objective** (Maximize / Minimize, defaulting to the metric's natural direction and frozen at launch), **Benchmark** (default **Auto — one per asset group**), autostop (**on**, failure threshold **30 %**), the eligibility rules, and the risk-manager stack |

Two derived facts the block shows you rather than making you compute:

- **Search space: {{size}} combinations** when every non-fixed parameter is finite. When the budget exceeds the grid, the study stops early once every combination has run.
- The **Cost** block in the confirm dialog, priced from the real trial budget, plus any memory surcharge, against your balance. *Charged when the study launches. Whatever it doesn't use is refunded automatically when it finishes.*

> [!NOTE] Creating a study does not start it
> **Save Draft** lands the study in `SAVED` and costs nothing. **Save & Launch** queues it and charges it. A draft can also be launched later from the registry row action **Launch**. Only `SAVED` studies can be edited or launched — after that both row actions are disabled, **Edit** with *Study has already been launched and is immutable.* and **Launch** with *Study has already been launched.*

Once queued, the run moves `QUEUED → RUNNING → COMPLETED`, with **Progress** and **Health** on the registry row refetching every 5 seconds while anything is active. There is no pause. Stop lives on the results page, not on the registry.

Full reference: [Studies](/docs/studies) for every field, [study lifecycle](/docs/study-lifecycle) for the stages and failure reasons, [sampler selection](/docs/sampler-selection) for which sampler to pick.

## 6. Read the output — candidate portfolios

**`Analysis → Portfolios`** (`/analysis/portfolios`; the study's row action **View** opens `/analysis/portfolios?studyId=<id>`)

Every trial that completed is a candidate portfolio — a full backtest for one parameter set, with its equity curve, trades, holdings and metrics across every stage. This surface is where you rank them, overlay them, and decide whether the winner is skill or the luckiest of N backtests. Everything is URL-driven, so any view you reach is a link you can share.

| Surface | Route | What it answers |
|---|---|---|
| **Portfolios Dashboard** | `/analysis/portfolios` | Which candidates rank best on a chosen metric over a chosen stage, and how they compare side by side |
| **Optimization Dashboard** | `/analysis/portfolios/study/:studyId` | Per-study analysis in four sub-views — **Overview**, **Robustness**, **Families**, **Parameters** |
| **Portfolio Analysis** | `/analysis/portfolios/:portfolioId…` | One candidate in detail — Performance, Holdings, Transactions, Risk Analytics, Robustness, Profile |

The decisions here are analytical, not configuration:

- **Rank by which metric, on which stage.** The filter bar's **Metric**, **Study**, **Top N** and **Rank by** controls set what every card, chart and table on the screen means. Ranking on train alone tells you nothing you did not already optimize for.
- **Is this a family or a fluke?** The Optimization Dashboard's **Robustness** view carries the PBO estimate and a verdict — **Well trained** / **Borderline** / **Overfit risk** / **Uncertain** — and **Families** shows whether your top performers collapse into one behavioural cluster.
- **Which parameters actually mattered.** **Parameter importance** and the parameter-vs-metric plots tell you where to narrow the ranges on the next pass.

> [!NOTE] A completed study can legitimately sit below 100 % progress
> Progress counts trials in a terminal state against `n_trials`. An exhausted finite grid completes early. Completion is signalled by **status**, never by progress reaching 1.0.

Full reference: [Portfolios dashboard](/docs/portfolios-dashboard), [optimization dashboard](/docs/optimization-dashboard), [portfolio detail](/docs/portfolio-detail), [analyzing results](/docs/analyzing-results), [metrics reference](/docs/metrics-reference).

## 7. Keep a winner — promote

**`Analysis → Portfolios`** → the card's **Promote** control, or the bulk bar's **Promote Selected**

Promotion turns a trial — a study artifact that dies with its study — into a **promoted portfolio**: a durable, study-independent copy with its own id. It takes a full isolation snapshot (the strategy code and parameters, the concrete trial parameters, the runnable universe, the fitness and risk-manager configuration, the date windows, the seed) and copies the trial's holdings, equity and orders into a parallel data plane.

| Entry point | Control |
|---|---|
| Card on the dashboard | The per-card **Promote** button, which flips to **Promoted** once done; the same action in the card's menu carries the secondary text *"Add this trial to the Portfolio Groups as a managed portfolio"* |
| Bulk bar (appears once two or more cards are checked, after a deliberate selection) | **Promote Selected ({{count}})** — *"Promote every checked trial into the Portfolio Groups in one go"* |
| Portfolio Analysis header | The per-portfolio promote control |
| Portfolio group creation | **Implicit** — putting a raw trial into a group promotes it first, silently |

| Decision | What turns on it |
|---|---|
| How many to keep | Promotion consumes the `managed_portfolios` quota, charged for the whole batch up front. At most **50** trials per request |
| Whether the trial is even promotable | The source strategy must be `INTERNAL`. A Mode-1 meta-strategy trial carrying a `sector_cap` or `country_cap` risk manager is also refused |
| Naming | There is none to make. The server mints `<study display name> / trial <n>`, and **there is no rename anywhere** |

> [!WARNING] Promotion freezes, it does not re-simulate
> The time series are copied as they stand — no backtest is re-run and nothing is re-optimized. From that moment, editing the strategy, the risk managers or the asset group never changes the promoted copy, and deleting the source study leaves it intact. Promotion is idempotent: a second promote of the same trial returns the existing id.

Full reference: [Promoted portfolios](/docs/promoted-portfolios).

## 8. Assemble a book — Portfolio Group

**`Registry → Portfolio Groups → Create Portfolio Group`** (`/analysis/portfolio-groups/groups/create`)

A portfolio group is a named container holding a set of promoted portfolios plus **one shared trading configuration**. It answers three questions about a book of strategies: how is it weighted, how often is it re-weighted, and how do its orders reach a broker. It is also the only object you can deploy — you never trade a single promoted portfolio directly.

Like the other creation surfaces this is **one screen with a right-hand rail**: a promoted-portfolios picker in the centre, **Advanced options** (collapsed) and **Selection preview** (expanded) beside it, and a naming dialog at the end.

| Decision | What turns on it |
|---|---|
| **Members** | Chosen from exactly the [Promoted Portfolios](/docs/promoted-portfolios) registry — same columns, same filters. At least one is required, or Save is blocked with **Select at least one promoted portfolio to continue.** |
| **Allocation method** | Seven, in two groups. **Free**: Equal weight, Manual. **Premium (tokens)**: Metric-proportional, Metric-responsive, Risk parity, Volatility target, Mean reversion. A premium method opens a one-time unlock dialog and blocks Save until confirmed; the charge commits in the same transaction as the group |
| **Periodic rebalance** | Off by default. Turning it on seeds **Rebalance every (data-days)** at `30`. Off means *Static: the group allocates once and holds until you change it.* The cadence is data-days on the valuation calendar, not calendar days |
| **Daily update** | Not a decision — a static chip reading **Daily update ON**, hardcoded. *"When on, each portfolio in the group extends daily. Required before the group can be deployed."* |

There is a second route to the same object: on the Portfolios dashboard, a selection plus the bulk action **Create portfolio group** — tooltip *Build a Portfolio Group from the selected portfolios* — auto-promotes whatever it needs and lands you on the new group.

> [!NOTE] Portfolio Groups and Portfolio Manager are different screens
> `/analysis/portfolio-groups` (Registry section) is the administrative half — membership, allocation, cadence, execution policy. `/analysis/portfolio-manager` (Analysis section) is the monitoring half — equity, metrics, holdings, trades, robustness, and the group's Operations tab.

Full reference: [Portfolio groups](/docs/portfolio-groups), [portfolio manager](/docs/portfolio-manager).

## 9. Send it to a broker — Operation

**`Registry → Portfolio Groups →` row action `Deploy Portfolio Group`**, or **`Analysis → Portfolio Manager → open a group → Operations → Trade with your brokerage`** (`/analysis/portfolio-manager/:basketId/operations`)

An operation is one deployment of one group against one broker connection. The group holds the shared trading rules; the operation holds the capital, the status and its own rebalance clock. `UNIQUE (basket_id, connection_id)` means a group can hold at most one operation per connection — and can therefore run paper and live at the same time, on two different connections.

| Decision | What turns on it |
|---|---|
| **Brokerage account** | A select over your **active** connections only, each with an environment chip — orange for `live`, blue for paper |
| Paper or live | **There is no per-group live/paper switch.** The environment is a property of the connection you pick, set when the connection is created. Creating a `live` connection is refused platform-wide unless `ALLOW_LIVE_BROKER_TRADING` is on, which is **off by default**; paper is always allowed |
| **Capital to trade ($)** | `min=1`, must be greater than 0. *"The total amount available to this trading session."* Above the connection's per-tick notional cap the launch is refused rather than silently truncated |
| Execution override | Optional, per operation: **Order type**, **Time in force**, **Limit offset (bps)**. Off by default, in which case the group's own execution policy applies |

Creating an operation and launching it are two separate calls, and creation alone does not trade — but the two entry points differ in how far they take you. **Deploy Portfolio Group** on the registry row does both in one go, creating the operation and then launching it. **Trade with your brokerage** on the Operations tab stops at `DRAFT`, and you launch it afterwards from the operation's own row. The lifecycle is:

```text
  DRAFT ──launch──► ACTIVE ⇄ PAUSED
                      │        │
                      └────────┴──stop──► STOPPED ──re-initiate──► DRAFT
```

| Status | Meaning |
|---|---|
| `DRAFT` | Created, never launched. No capital at work |
| `ACTIVE` | Trading |
| `PAUSED` | Positions held, rebalancing stopped |
| `STOPPED` | Liquidated and finished; history is kept |

The server runs a real preflight at both create and launch, and every refusal names its own fix. The ones that catch people out are all upstream decisions coming home: an empty group, members that are not up to date, members that are not on daily updates, `EXTERNAL` members that cannot daily-extend, meta-portfolios whose holdings have not been flattened, and short crypto or unmargined shorts the broker will not take.

> [!CAUTION] Live means real capital — but the exit is never locked
> Only the direction that *adds* exposure is entitlement-gated — creating an operation, launching one and resuming to `ACTIVE` require the `broker_paper_trading` feature, which also gates creating a broker connection of either environment. Pausing, stopping and returning to `DRAFT` stay open on every tier: the exit is never locked. Start on a paper connection.

Full reference: [Live trading](/docs/live-trading), and [portfolio groups](/docs/portfolio-groups) for the operation tabs, orders, allocations and end-of-day reconciliation.

## Iterating — the loop back to stage 5

The first study almost never produces the configuration you keep. The intended loop is short:

1. Read **Parameter importance** and the parameter-vs-metric plots on the Optimization Dashboard.
2. On the study's registry row, choose **Duplicate**. The builder opens pre-seeded from that study, in create mode, with a fresh name and no API call yet.
3. Narrow the ranges, or pin the parameters that turned out not to matter to a **Fixed** value — a smaller finite grid finishes sooner and explores more of what is left.
4. **Save & Launch**, and compare the two studies on the dashboard.

A study that is `COMPLETED` or `STOPPED` can also be resumed with a larger `n_trials`, but that path is API-only — **there is no resume button anywhere in this build**, and `FAILED` studies are never resumable.

A second loop starts at stage 6 rather than stage 2: **Derive / Optimize RMs** on a candidate creates one risk-manager-optimization study per selected portfolio, tuning guard rails against a signal you have already validated. Those studies go **straight to `QUEUED`** — they never sit as drafts.

## Gates that stop the path

Each of these is documented in full on the page that owns it. They are collected here because each one is decided at an early stage and only bites at a later one.

| Gate | Decided at | Bites at |
|---|---|---|
| An **External** strategy cannot be promoted | Stage 2, and frozen there | Stage 7 — HTTP 400, and the path ends |
| A launched study is immutable | Stage 5 | Any later edit — duplicate it instead |
| Risk-manager attachments can only change while `SAVED` | Stage 4 / 5 | Any post-launch change to the stack |
| A group must have **Daily update ON** and fresh members | Stage 8 | Stage 9 launch preflight |
| Creation quotas | Every registry | Only on create — never on read, edit, delete or stop |
| Token balance | Stage 5 (launch) and premium allocation methods (stage 8) | **Save Draft** is never gated by cost; **Save & Launch** is |

## Shortcuts through the path

The nine stages are the full route. Four surfaces let you skip parts of it.

| Shortcut | What it replaces |
|---|---|
| **Platform sets** in the study builder's asset-group picker | Stage 1 entirely — pick a curated collection, an index, a sector, a sector ETF set, a country or an industry, and a derived group is materialized for you |
| A **built-in** fitness function | Stage 3 — no authoring, no parameters, no fitness asset group |
| The [Laboratory](/docs/laboratory) | Stages 2–4 — a notebook, a live Python kernel and the registry editors on one page, promoting working code straight into a registry resource |
| [Fintelligent](/docs/fintelligent) | Stages 1–5 as *drafts* — its default path opens, fills and hands back the create forms for asset groups, strategies, studies, fitness functions and risk managers, and always ends with you clicking Confirm. It also holds a secondary, direct API path (`create_study`, `launch_study`, `stop_study`, `resume_study`, `duplicate_study`) that persists with no dialog, so a launch it makes for you spends tokens. There is no `delete_study` tool. See [Fintelligent capabilities](/docs/fintelligent-capabilities) |

## Where to go next

| Page | What it covers |
|---|---|
| [Quickstart](/docs/quickstart) | The same path, compressed to one worked example |
| [Core concepts](/docs/core-concepts) | The vocabulary each stage assumes |
| [Registries](/docs/registries) | The conventions all seven registry pages share, so the individual pages do not repeat them |
| [Analyzing results](/docs/analyzing-results) | Stage 6 as a workflow rather than a screen reference |
| [Live trading](/docs/live-trading) | Stage 9 in full, including monitoring, drift and stopping |
| [Study lifecycle](/docs/study-lifecycle) | What a study is doing between launch and completion |
| [Execution modes](/docs/execution-modes) | Internal vs External, and exactly where External does not apply |
| [Optimizer architecture](/docs/optimizer-architecture) | How a launched study becomes tasks, workers and trials |
| [Visualizations](/docs/visualizations) | Every chart the analysis stages render |
