---
title: Core concepts
section: Getting Started
sectionOrder: 1
order: 3
published: true
updated: 2026-09-01
summary: The core vocabulary of the platform, asset groups, strategies, fitness functions, risk managers, studies, trials, and portfolios, explained in plain language.
keywords: concepts, vocabulary, glossary, strategy, fitness, study, trial, portfolio, asset group, risk manager, promotion, portfolio group
---

Fintela's workflow revolves around ten kinds of objects, and almost every screen you'll use maps to
one of them. Four are things you create yourself: an **asset group**, a **strategy**, a **fitness
function**, and **risk managers**. You bind those into a search called a **study**. Running a study
produces **trials**, and each finished trial leaves behind a **candidate portfolio**. When you like a
result, you promote it into a **promoted portfolio**, group promoted portfolios together in a
**portfolio group**, and deploy a group as an **operation** against a broker.

This page defines each of these terms, what it is, how you create it, and what you do with it, and
points you to the page with the full detail.

## How the pieces fit together

Read it top to bottom: everything above a line feeds into what's below it.

```text
  ASSET GROUP        STRATEGY        FITNESS FUNCTION      RISK MANAGERS
  your universe     your signal        your scorecard         your guardrails
        │                │                    │                   │
        └────────────────┴─────────┬──────────┴───────────────────┘
                                    ▼
                                  STUDY
              one optimization run — the date ranges, the search
              space, and the number of trials to try. Saved as a
              draft first; you launch it separately.
                                    │  Launch (spends tokens)
                                    ▼
                                  TRIAL
              one parameter combination the optimizer tested
              Waiting → Running → Complete / Pruned / Failed
                                    │  completed trials only
                                    ▼
                        CANDIDATE PORTFOLIO
              the backtest that trial produced — equity curve,
              holdings, orders, trades, performance metrics
                                    │  you click Promote
                                    ▼
                         PROMOTED PORTFOLIO
              a permanent copy of that result, kept safe even if
              you later change or delete the study
                                    │  you add it to a group
                                    ▼
                           PORTFOLIO GROUP
              a book of promoted portfolios with shared weighting,
              rebalancing, and execution rules
                                    │  you deploy it to a broker
                                    ▼
                               OPERATION
              your capital, live in the market (or on paper), with
              its own status and rebalance schedule
```

There's one loop in this chain: a portfolio group's combined performance can itself be added into an
asset group, and scored right alongside individual tickers. That's how you build a portfolio made up
of your own portfolios, feeding the output of the pipeline back in as an input.

## Objects at a glance

| Object | The question it answers | Learn more |
|---|---|---|
| Asset group | Which instruments am I allowed to trade? | [Asset Groups](/docs/asset-groups) |
| Strategy | On this date, what do I hold, on which side, at what weight? | [Strategies](/docs/strategies) |
| Fitness function | Was that period good, expressed as one number? | [Fitness Functions](/docs/fitness-functions) |
| Risk manager | What must never be allowed to happen? | [Risk Managers](/docs/risk-managers) |
| Study | Which parameter values are best, and how do I search for them? | [Studies](/docs/studies) |
| Trial | What happened at this one parameter combination? | [Study lifecycle](/docs/study-lifecycle) |
| Candidate portfolio | What did that trial actually produce? | [Portfolio Detail](/docs/portfolio-detail) |
| Promoted portfolio | Which results am I keeping, permanently? | [Promoted Portfolios](/docs/promoted-portfolios) |
| Portfolio group | How is my book weighted, rebalanced and executed? | [Portfolio Groups](/docs/portfolio-groups) |
| Operation | Where is real capital, on which broker, in what state? | [Live trading](/docs/live-trading) |

Seven of the ten (asset groups, strategies, fitness functions, risk managers, studies, portfolio
groups, and promoted portfolios) live in what Fintela calls a **registry**: an organization wide
catalog for that one kind of object, with a consistent way to browse, search, and manage entries. See
[Registries](/docs/registries) for the conventions they all share. Trials, candidate portfolios, and
operations don't have registries of their own: the platform creates them for you as a study runs or
a group gets deployed, rather than you authoring them directly.

## Asset group

A saved, **frozen** list of the instruments you're allowed to trade: the universe half of any
experiment. You build one with a screener that filters the whole market, but only the resulting list
of tickers is saved; the filter criteria you used aren't stored and are never re-run. Want a different
universe next month? You build a new asset group; the old one doesn't change underneath you.

| Aspect | What it means for you |
|---|---|
| Holds | A list of tickers, and optionally other [portfolio groups](/docs/portfolio-groups) added as members, so their combined performance can be scored alongside individual instruments |
| Doesn't hold | A date range or a data source, you choose those later, when you use the asset group in a study |
| How you create one | In the [Asset Groups](/docs/asset-groups) registry, or automatically when you pick a ready made market grouping as your universe inside the study builder |
| How you use one | As the trading universe for a strategy, and optionally as a separate universe your fitness function is measured against |
| Learn more | [Asset Groups](/docs/asset-groups) |

An asset group is just a list of instruments; it carries no trading logic of its own.

## Strategy

The rule that turns market data into a decision: for every rebalancing date, which tickers to hold,
on which side, and at what weight. This is the one thing every result in Fintela traces back to: the
backtest, the optimizer, and the daily updater that keeps a live portfolio current all run the same
strategy logic. A strategy decides *what to hold*; it doesn't judge whether the result was good (that's
the fitness function's job), and it doesn't try different parameter values on its own (that's the
study's job).

| Aspect | What it means for you |
|---|---|
| How you build one | Write the logic yourself in Fintela's strategy editor (**internal**), or connect logic you run and host on your own systems (**external**); see [External strategies](/docs/external-strategies) |
| Parameters | You declare each tunable input's name and type, a whole number, a decimal, or a choice from a fixed list, so a study can search across a range of values for it |
| How you create one | In the [Strategies](/docs/strategies) registry |
| How you use one | A study tests exactly one strategy at a time; you can also run it once, ad hoc, to sanity check it before committing tokens to a full search |
| Learn more | [Strategies](/docs/strategies), [Execution modes](/docs/execution-modes), [External strategies](/docs/external-strategies) |

## Fitness function

The scorecard a study optimizes for. It takes everything that happened over a simulated period (the
equity curve, the metrics for that window, the holdings, orders, and trades) and reduces it to a
single number. The optimizer's whole job is to search for parameter values that push that number in
the right direction. Nothing else on the platform decides what counts as "a good result": the fitness
function is the definition.

| Aspect | What it means for you |
|---|---|
| How you build one | Write your own scoring logic (**internal** or **external**, same choice as a strategy), or pick one of Fintela's ready made **built in** scorers, such as Sharpe ratio or drawdown |
| Built in scorers | Ready to use as is, you can't edit, duplicate, or delete them, only pick one |
| How you create one | In the [Fitness Functions](/docs/fitness-functions) registry |
| How you use one | A study uses exactly one fitness function; any parameters it has are fixed to one value per study, they're never searched |
| Which score drives the search | Only the score from the **training** window. Validation, out of sample, and overall scores are calculated and shown to you, but the optimizer never chases them directly, they're there so you can judge whether a result overfit |
| Learn more | [Fitness Functions](/docs/fitness-functions), [External fitness](/docs/external-fitness) |

> [!WARNING] Higher isn't always better
> A study has a direction (maximize or minimize) and it's locked in once you launch. By default it
> inherits the natural direction of your fitness function (a custom scorer maximizes; a built in
> objective like drawdown, where lower is better, minimizes), but you can also pin a study to maximize or minimize
> explicitly. See [Fitness Functions](/docs/fitness-functions).

## Risk manager

Your guardrails on a backtest. On every simulated trading day, before your strategy is allowed to
rebalance, a risk manager looks at the portfolio as it stood the day before and can trim positions,
close them outright, or block the rebalance entirely. It never decides what to hold; it only vetoes
or scales back what the strategy proposed.

| Aspect | What it means for you |
|---|---|
| How you build one | Pick from Fintela's built in guardrails (like a maximum drawdown stop or a position size cap), set rule based conditions without writing code, or connect your own logic (in Fintela or hosted on your own systems) |
| How you create one | In the [Risk Managers](/docs/risk-managers) registry, for anything custom. Built in options don't need to be created; you attach them directly |
| How you use one | Attach zero, one, or several to a study, in the order you want them checked. Each attachment can have its own tunable thresholds, which the optimizer can search alongside your strategy's own parameters |
| Learn more | [Risk Managers](/docs/risk-managers) |

## Study

One optimization run. A study ties together exactly one strategy, one fitness function, and one asset
group (optionally a second asset group just for your fitness function to be measured against) plus
any risk managers you've attached, a date range, a search method, and a budget of trials to try.
**Creating a study doesn't start it.** It's saved as a draft, and launching is a separate step that
spends [tokens](/docs/tokens-and-billing).

| Aspect | What it means for you |
|---|---|
| What it ties together | Your strategy, your fitness function, one or two asset groups, and any risk managers, all bound to one search |
| What you configure | How many trials to run, which search method to use, the range each parameter can search within, and your train / validation / out of sample date windows |
| Its name | The name you type is just a label, rename it any time without affecting the study itself |
| How you create one | In the study builder, a single canvas where you set everything up in one place, ending in **Save Draft** or **Save & Launch** |
| How it's protected | Once launched, a study locks in the exact versions of the strategy and fitness function it used, so editing them afterward never silently changes a result you already have |
| Learn more | [Studies](/docs/studies), [Study lifecycle](/docs/study-lifecycle), [Sampler selection](/docs/sampler-selection), [Optimizer architecture](/docs/optimizer-architecture) |

A study doesn't have its own internal/external setting: it simply inherits whatever its strategy and
fitness function are, and pairing one of each kind is completely normal.

## Trial

One parameter combination the optimizer tried and evaluated. Think of a trial as one line in a lab
notebook: which values it tested, what state it's in, and when.

| Aspect | What it means for you |
|---|---|
| What it holds | A trial number, its current state, when it started and finished, and the exact parameter values the optimizer chose for it |
| States | Waiting, Running, and then one of three finished states: Complete, Pruned (stopped early because it wasn't promising), or Failed |
| How they're created | The optimizer generates trials automatically, one per parameter combination it wants to test, until your trial budget runs out, a finite search space is exhausted, results stop improving enough to continue, or you stop the study yourself |
| What you see from them | Your study's progress bar and health indicators track every trial; only **Complete** trials go on to produce a portfolio you can look at |
| Learn more | [Study lifecycle](/docs/study-lifecycle), [API: Trials & portfolios](/docs/api-trials-portfolios) |

## Candidate portfolio

The backtest result a completed trial leaves behind. This is what most dashboards in Fintela mean when
they say "a portfolio": it's the thing you rank, compare side by side, chart, and eventually decide
to keep.

| Aspect | What it means for you |
|---|---|
| What it holds | The equity curve, holdings, orders, trades, and performance metrics for every stage of the backtest, plus the exact trading signal the engine used, which you can download |
| Metric stages | Training, validation, out of sample, real life performance (once promoted and running), and an overall figure, along with several rolling window views, see [Metrics Reference](/docs/metrics-reference) for what each one measures |
| How it's created | One candidate portfolio per **Complete** trial. Trials that were pruned or failed don't produce one |
| Where you work with it | The [Portfolios Dashboard](/docs/portfolios-dashboard), the [Optimization Dashboard](/docs/optimization-dashboard), the tabs on [Portfolio Detail](/docs/portfolio-detail), and the Promote action |
| Learn more | [Portfolio Detail](/docs/portfolio-detail), [Visualizations](/docs/visualizations) |

> [!CAUTION] A candidate portfolio lives and dies with its study
> If you delete a study, every trial and candidate portfolio that came from it goes with it. Promoting
> a result is what makes it permanent, see below.

## Promoted portfolio

The permanent copy a result becomes once you promote it. Promoting takes a full snapshot of a trial's
holdings, equity, and orders and saves it independently of the study that produced it. From that
moment on, the copy is frozen; later changes to the strategy, risk managers, or asset group it came
from never touch it.

| Aspect | What it means for you |
|---|---|
| What it holds | A snapshot of the strategy and its exact parameter values, the tickers it traded, the fitness and risk manager settings that were in effect, the study's date windows, and a trading signal that keeps extending one day at a time going forward |
| How you create one | Click **Promote** on the [Portfolios Dashboard](/docs/portfolios-dashboard) or from a portfolio's own analysis page, or implicitly, by adding a trial straight into a portfolio group. Only results from strategies you wrote yourself in Fintela can currently be promoted. Promoting the same trial twice just gives you back the same promoted portfolio, so it's always safe to try |
| How you use one | It's the only kind of object a portfolio group can hold, it's what the daily updater keeps current, and it's what you can pull into your own tools through the read only [Developer API](/docs/api-trials-portfolios) |
| What survives | Even if you later delete the study, the trial, or the strategy it came from, the promoted portfolio itself is untouched; you just lose the "created from" link back to its origin |
| Learn more | [Promoted Portfolios](/docs/promoted-portfolios) |

## Portfolio group

A named container that holds a set of promoted portfolios plus **one shared trading configuration**.
It answers three questions about a book of strategies: how is it weighted, how often is it
rebalanced, and how do its orders reach a broker.

| Aspect | What it means for you |
|---|---|
| What it holds | Its member promoted portfolios (each with a weight, used if you choose manual allocation), an allocation method, a rebalance schedule, and execution and protective settings |
| How you create one | In the Portfolio Groups wizard |
| Where you use it | In [Portfolio Manager](/docs/portfolio-manager) for analysis, as the unit you deploy to a broker, and optionally as a member of an asset group, so its combined performance can be scored like any other instrument |
| Learn more | [Portfolio Groups](/docs/portfolio-groups), [Portfolio Manager](/docs/portfolio-manager) |

The hierarchy stops at one level: **portfolio group → members → operations**. A portfolio group can't
contain another portfolio group.

## Operation

One deployment of one portfolio group to one broker connection. The group holds the shared trading
rules; the operation holds the capital behind it, its status, and its own rebalance clock.

| Aspect | What it means for you |
|---|---|
| What it holds | Which broker connection it's using, an optional name you give it, how much capital it's trading with, its current and target status, and when it last rebalanced |
| Statuses | Draft, Active, Paused, or Stopped |
| How you create one | Click **Deploy Portfolio Group** on a group to create and launch an operation in one step, or **Trade with your brokerage** to create it as a draft you launch yourself later. Creating an operation never places an order on its own; launching it does |
| Where you manage it | The group's Operations tab |
| How many you can run | One operation per group, per broker connection, so the same group can run side by side on more than one connection, for example across two separate paper trading accounts you want to compare (and, once live trading arrives, a live connection running alongside them) |
| Learn more | [Live trading](/docs/live-trading), [Portfolio Groups](/docs/portfolio-groups), [API: Baskets](/docs/api-baskets) |

> [!NOTE] Paper trading today, live trading to come
> Connecting a real, live money brokerage account is currently switched off platform wide, every
> operation you create today trades on paper. The workflow is identical either way, so nothing changes
> for you once live trading becomes available. See [Live trading](/docs/live-trading).

## Also known as

A few objects go by more than one name across the product. If you're reading the
[Developer API](/docs/api-overview) reference, older support material, or an exported file, you may
see:

| You know it as | You may also see it called |
|---|---|
| Asset Group | Data cluster |
| Portfolio Group | Basket |
| Promoted Portfolio | Managed portfolio |

These are the same objects under different names, nothing to reconcile, just useful to recognize if
the wording in front of you doesn't match what you're used to in the app.

## Terms that are not objects

| Term | What it actually is |
|---|---|
| **Seed** | Not a separate object, a field. It's the exact day by day trading signal your strategy produced, saved on every candidate and promoted portfolio, and downloadable if you want to inspect or reuse it. See [Portfolio Detail](/docs/portfolio-detail) |
| **Data pipeline** | Retired as a separate step. You now choose your data sources directly inside the strategy editor, and market data browsing lives in the [Data Explorer](/docs/data-explorer) |
| **Basket** | Another name for a portfolio group, not a nested container inside one |
| **Managed portfolio** | Another name for a promoted portfolio |
| **Registry** | Not an object itself, the shared set of conventions the object catalogs (Asset Groups, Strategies, Fitness Functions, Risk Managers, Studies, Portfolio Groups, Promoted Portfolios) all follow: a consistent way to browse, filter, and keep anything still in use from being deleted by accident. See [Registries](/docs/registries) |

## Where to go next

| Read | For |
|---|---|
| [Quickstart](/docs/quickstart) | The shortest real path, one strategy, one study, one set of results |
| [Registries](/docs/registries) | Every convention the seven object catalogs share |
| [End to end workflow](/docs/end-to-end-workflow) | The complete path from a blank account to a deployed portfolio group |
| [Execution modes](/docs/execution-modes) | Internal versus external, and exactly which objects offer the choice |
| [Study lifecycle](/docs/study-lifecycle) | Every state a study and a trial can be in |
| [Metrics Reference](/docs/metrics-reference) | Every number a candidate portfolio carries, and the stages it's measured over |
