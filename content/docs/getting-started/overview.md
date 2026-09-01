---
title: Overview
section: Getting Started
sectionOrder: 1
order: 1
published: true
updated: 2026-09-01
summary: What Fintela is, what you can do with it, and where to go next.
keywords: overview, introduction, what is fintela, trading, quant, backtesting, optimization, portfolios, documentation
---

Fintela is a web platform for building, backtesting, optimizing and trading quantitative
portfolios. You define a universe of instruments, write the rule that turns market data into a
signal, declare the objective that rule should be scored on — maximized or minimized — and Fintela
searches that rule's parameter space for you, leaving behind one backtested candidate portfolio for
every completed trial, ready to rank, compare, promote and deploy against a brokerage account. This
page is the map: what the platform does, and where in the documentation to read about each part.

## What Fintela is

Fintela is one app behind a single sign-in. Once you're in, everything — research, testing,
optimization, results and deployment — lives inside one workspace, with a navigation sidebar on the
left and a top bar showing your account and token status. See [Navigation](/docs/navigation) for
the full map of every screen.

Everything you build is a row in one of **seven registries** — asset groups, strategies, studies,
fitness functions, risk managers, portfolio groups and promoted portfolios. Registries are scoped
to your **organization**, not to you personally: every row you create, everyone else on your
organization's account can see and reuse too. [Registries](/docs/registries) covers the conventions
all seven share.

Compute is **prepaid**. There are no subscriptions and no per-seat pricing — you buy Fintela Tokens,
and every optimization, sandbox run, simulation and daily update draws down one organization-level
balance. A separate currency, Fintela AI Tokens, pays for [Fintelligent](/docs/fintelligent). Run
your token balance to zero and billed work pauses — backtests, optimizations and daily updates —
until you top up; daily updates pick back up automatically once you do. See
[Tokens & Billing](/docs/tokens-and-billing).

## Who it is for

Fintela is built for people who express a trading idea as code and want the search, the simulation,
the bookkeeping and the deployment handled for them. To use it, you need to be able to write your
signal rule in one of two ways:

| Mode | What you supply | What Fintela does with it |
|---|---|---|
| **Internal** | Python you write directly in Fintela's own editor, against a fixed, documented template | Runs it for you, safely, with the statistical and data libraries you need already available |
| **External** | Your own logic, hosted wherever you already run it, in whatever language you use | Calls out to it whenever it needs a decision, and reads back the result — none of your code has to live inside Fintela |

External mode exists so your code, your models and your private data never have to leave your own
systems. It's available for strategies, fitness functions and risk managers — asset groups,
studies, portfolio groups and promoted portfolios don't have a mode choice at all. Reach for
external mode when you want to keep proprietary logic off Fintela's editor, reuse code you already
maintain elsewhere, or work in a language other than Python. Read
[Execution modes](/docs/execution-modes) before you commit to either.

Everything else — screening the universe, searching the parameter space, choosing the search
strategy, running the simulation, computing the metrics, drawing the charts, keeping results current
day to day, talking to your broker — is Fintela's job, not yours.

## What you can build

One trading idea moves through the same sequence of stages, and each stage is saved as a reusable
object you can mix into other ideas later:

```text
   Asset Group          Strategy         Fitness Function       Risk Managers
   the universe      the signal rule      the objective          guard rails
        └──────────────────┴────────┬──────────┴────────────────────┘
                                    ▼
                                  Study
                  one optimization campaign — search method, parameter
                  space, train / validation / out-of-sample windows
                                    ▼
                                 Trials
                  one parameter combination each; a completed trial
                        leaves one candidate portfolio behind
                                    ▼
                          Promoted Portfolios
                    frozen, study-independent snapshots of the
                    trials you decided to keep
                                    ▼
                            Portfolio Group
                  a book of promoted portfolios plus one shared
                  allocation, rebalance and execution configuration
                                    ▼
                              Operation
                  one deployment of that group against one broker
                  connection, with its own capital and status
```

**Research.** An [asset group](/docs/asset-groups) freezes the instruments you trade — tickers you
pick in a full-market screener, or whole portfolio groups injected as pseudo-tickers so you can
build portfolios of your own portfolios. A [strategy](/docs/strategies) turns that data into a
signal: rebalancing date, ticker, position and allocation. A
[fitness function](/docs/fitness-functions) reduces one simulated period to the single number you're
optimizing for, and [risk managers](/docs/risk-managers) run on every simulated bar before the
strategy rebalances, closing positions, halting rebalances or trimming holdings that breach a limit
you set.

**Optimization.** A [study](/docs/studies) binds exactly one strategy, one fitness function and one
asset group, plus an optional ordered stack of risk managers, to a date window and a trial budget,
then searches the parameter space using the [sampler](/docs/sampler-selection) you choose. Creating
a study doesn't start it — launching it is a separate, billed action, and Fintela runs the search
trial by trial from there. [Optimizer architecture](/docs/optimizer-architecture) explains how the
search itself works, and [Study lifecycle](/docs/study-lifecycle) covers every state a study and a
trial can be in.

**Analysis.** Every completed trial leaves behind a candidate portfolio with an equity curve,
holdings, transactions and a full set of metrics; trials that get pruned or fail leave none. Rank
them on the [Portfolios Dashboard](/docs/portfolios-dashboard), read one study's whole output on the
[Optimization Dashboard](/docs/optimization-dashboard), and drill into a single candidate through
the six tabs of [Portfolio Detail](/docs/portfolio-detail) — including a robustness check that asks
whether the winner reflects real skill or is just the luckiest of the backtests you ran.
[Metrics Reference](/docs/metrics-reference) defines every number and
[Visualizations & Plots](/docs/visualizations) catalogues every chart.

**Deployment.** Promoting a trial takes a complete snapshot and produces a
[promoted portfolio](/docs/promoted-portfolios) that survives even if you later delete the study it
came from. Promoted portfolios are the only thing a [portfolio group](/docs/portfolio-groups) can
hold, and a group is what you actually deploy: one operation per broker connection, with its own
capital, rebalance clock and status. [Portfolio Manager](/docs/portfolio-manager) is where you read
the whole book side by side.

**Alongside all of it.** [Fintelligent](/docs/fintelligent) is an AI assistant that reads your
workspace and can fill in an editor, draft a study or help you navigate the app. The
[Laboratory](/docs/laboratory) is a notebook workspace with a live Python environment where you
author and test registry code before promoting it into a strategy, fitness function or risk manager.
The [Data Explorer](/docs/data-explorer) shows what each dataset actually contains, and
[Market](/docs/market) is the read-only window onto the market data itself.

## Where to start

| Read | For |
|---|---|
| [Core concepts](/docs/core-concepts) | The vocabulary — the ten objects: asset group, strategy, fitness function, risk manager, study, trial, candidate portfolio, promoted portfolio, portfolio group, operation |
| [System architecture](/docs/architecture) | The big picture of how your research, your optimization runs and the market data behind them fit together, so you know what to expect at each step |
| [Account setup](/docs/account-setup) | Getting in: signing in, the one-time organization setup, the account page, and your token balances |
| [Quickstart](/docs/quickstart) | The shortest real path — one strategy, one study, one set of results |
| [End-to-end workflow](/docs/end-to-end-workflow) | The complete path from a blank account to a deployed portfolio group |

> [!TIP]
> If you have never opened Fintela, read [Core concepts](/docs/core-concepts) first and then run
> the [Quickstart](/docs/quickstart). Core concepts defines all ten objects and names the page that
> covers each one; Quickstart walks a strategy, a study and its results on screen.

## How this documentation is organized

Every page is reachable from the sidebar on the left. Sections, in order:

| Section | What lives there |
|---|---|
| **Getting Started** | This page, plus [core concepts](/docs/core-concepts), [system architecture](/docs/architecture), [account setup](/docs/account-setup) and the [quickstart](/docs/quickstart) |
| **Platform Overview** | The main workspace and its read-only surfaces: [navigation](/docs/navigation), [Home](/docs/home), [Market](/docs/market), [Data Explorer](/docs/data-explorer) |
| **Registries** | The [shared conventions](/docs/registries) plus one page per registry — all seven built the same way |
| **Analysis & Portfolios** | Reading results: the [portfolios dashboard](/docs/portfolios-dashboard), the [optimization dashboard](/docs/optimization-dashboard), [portfolio detail](/docs/portfolio-detail), [Portfolio Manager](/docs/portfolio-manager), [charts](/docs/visualizations) and the [metrics reference](/docs/metrics-reference) |
| **Workflows** | Task-shaped guides: [end-to-end workflow](/docs/end-to-end-workflow), [analyzing results](/docs/analyzing-results), [live trading](/docs/live-trading) |
| **Artificial Intelligence** | [Fintelligent](/docs/fintelligent), what it [can do](/docs/fintelligent-capabilities), and its [drafts and runs](/docs/fintelligent-drafts-and-runs) |
| **Features** | [Laboratory](/docs/laboratory) and [Tokens & Billing](/docs/tokens-and-billing) |
| **Configuration & Advanced** | [Execution modes](/docs/execution-modes), [sampler selection](/docs/sampler-selection), [study lifecycle](/docs/study-lifecycle), the [external strategy](/docs/external-strategies) and [external fitness](/docs/external-fitness) guides, and [optimizer architecture](/docs/optimizer-architecture) |
| **Integration Guides** | Step-by-step examples for hosting your own strategy or fitness logic outside Fintela, in [Python](/docs/python-fastapi) or [Node.js](/docs/node-express) |
| **API Reference** | The read-only Developer API for pulling your studies, portfolios and results into your own tools — [overview](/docs/api-overview), [authentication](/docs/api-authentication), one page per data type, and [errors](/docs/api-errors) |

## Limits worth knowing up front

Stated here so you don't build a strategy or a workflow around something the platform doesn't
actually do.

| Limit | Where it is documented |
|---|---|
| **Market data is end-of-day.** Every figure on Markets comes from a scheduled update, and Fintela does not display intraday prices | [Market](/docs/market) |
| **The Developer API is read-only.** It can only pull data out — it can never place a trade, launch a study, or spend a token on your behalf, and it doesn't push updates to you, so your own integrations need to check back periodically. Anything that costs tokens has to be triggered inside the app itself | [API overview](/docs/api-overview) |
| **Live broker connections are gated off by default.** Paper trading is what ships out of the box; real-money connections stay declined until Fintela enables live trading for your organization | [Live trading](/docs/live-trading) |
| **Nothing in a registry is shareable.** There is no per-row visibility setting and no cross-organization catalogue in any registry. The [Laboratory](/docs/laboratory)'s public catalog is a separate surface | [Registries](/docs/registries) |
| **Deletes are permanent.** No undelete and no archive anywhere in the registries | [Registries](/docs/registries) |
| **Data Pipelines has been retired.** It's now folded into the Data Explorer; strategies, fitness functions and risk managers pick their data sources inside their own editors | [Data Explorer](/docs/data-explorer) |
