---
title: Overview
section: Getting Started
sectionOrder: 1
order: 1
published: true
updated: 2026-08-20
summary: What Fintela is, what you can build with it, and where to go next.
keywords: overview, introduction, what is fintela, quant, backtesting, optimization, portfolios, documentation
---

Fintela is a web platform for building, backtesting, optimizing and trading quantitative
portfolios. You define a universe of instruments, write the rule that turns market data into a
signal, declare the objective that rule is scored on — maximized or minimized — and the platform
searches the rule's parameter space for you, leaving behind one backtested candidate portfolio per
completed trial, ready to rank, compare, promote and deploy against a brokerage account. This page
is the map: what the platform does, and which page owns each part of it.

## What Fintela is

Fintela is a single-page app behind one login. Only `/login`, `/signup`, `/terms` and `/privacy`
render unauthenticated; everything else lives inside one shell with a sidebar rail on the left and
a fixed top bar. Signing in hands over to Keycloak, and the root path `/` redirects straight to
Home at `/analysis`. See [Navigation](/docs/navigation) for the full route map.

Everything you assemble is a row in one of **seven registries** — asset groups, strategies,
studies, fitness functions, risk managers, portfolio groups and promoted portfolios. Registries are
scoped to your **organization**, not to you: every row you can see, everyone in your organization
can see. [Registries](/docs/registries) documents the conventions all seven share.

Compute is **prepaid**. There are no subscriptions and no seats — you buy Fintela Tokens and every
optimization, sandbox run, simulation and daily update debits them from an organization-level
balance. A separate currency, Fintela AI Tokens, pays for [Fintelligent](/docs/fintelligent). At a
zero balance the shell posts a banner reading `Tokens depleted — compute is paused (backtests,
optimizations and daily updates). Daily updates resume automatically after a purchase.` See
[Tokens & Billing](/docs/tokens-and-billing).

## Who it is for

Fintela is built for people who express a trading idea as code and want the search, the simulation,
the bookkeeping and the deployment handled for them. To use it you need to be able to write the
signal rule in one of two forms:

| Execution mode | What you supply | What Fintela runs |
|---|---|---|
| **Internal** | Python written against a fixed function signature, stored in Fintela | Your code, in a sandboxed runtime with a pinned scientific stack |
| **External** | An `http://` or `https://` endpoint you host, in any language | Nothing of yours — Fintela sends a request and reads the response |

External mode exists so that your code, your dependencies and your private data never leave your
infrastructure. It applies to strategies, fitness functions and risk managers; asset groups,
studies, portfolio groups and promoted portfolios have no execution mode at all. Read
[Execution modes](/docs/execution-modes) before you commit to either.

Everything else — the universe, the parameter search, the sampler, the simulation engine, the
metrics, the charts, the daily updates, the broker plumbing — is the platform's job.

## What you can build

One trading idea moves through the same sequence, and each stage persists as a reusable object:

```text
   Asset Group          Strategy         Fitness Function       Risk Managers
   the universe      the signal rule      the objective          guard rails
        └──────────────────┴────────┬──────────┴────────────────────┘
                                    ▼
                                  Study
                  one optimization campaign — sampler, parameter search
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
[fitness function](/docs/fitness-functions) reduces one simulated period to the single number the
optimizer chases, and [risk managers](/docs/risk-managers) run on every simulated bar before the
strategy rebalances, closing positions, halting rebalances or trimming holdings that breach a
limit.

**Optimization.** A [study](/docs/studies) binds exactly one strategy, one fitness function and one
asset group, plus an optional ordered stack of risk managers, to a date window and a trial budget,
then searches the parameter space with the [sampler](/docs/sampler-selection) you choose. Creating
a study does not start it — launch is a separate, billed action. Launching fans the work out across
on-demand tasks; [Optimizer architecture](/docs/optimizer-architecture) explains how, and
[Study lifecycle](/docs/study-lifecycle) covers every state a study and a trial can be in.

**Analysis.** Every completed trial leaves behind a candidate portfolio with an equity curve,
holdings, transactions and a full metric set; trials that prune or fail leave none. Rank them on
the [Portfolios Dashboard](/docs/portfolios-dashboard), read one study's output on the
[Optimization Dashboard](/docs/optimization-dashboard), and drill into a single candidate through
the six tabs of [Portfolio Detail](/docs/portfolio-detail) — including a robustness check that asks
whether the winner is skill or the luckiest of N backtests.
[Metrics Reference](/docs/metrics-reference) defines every number and
[Visualizations & Plots](/docs/visualizations) catalogues every chart.

**Deployment.** Promoting a trial takes a full isolation snapshot and produces a
[promoted portfolio](/docs/promoted-portfolios) that survives deletion of the study it came from.
Promoted portfolios are the only thing a [portfolio group](/docs/portfolio-groups) can hold, and a
group is what you actually deploy: one operation per broker connection, with its own capital,
rebalance clock and status. [Portfolio Manager](/docs/portfolio-manager) is where you read the
whole book side by side.

**Alongside all of it.** [Fintelligent](/docs/fintelligent) is an AI assistant that reads your
workspace and can fill an editor, draft a study or navigate the app. The
[Laboratory](/docs/laboratory) is a notebook workspace with a live Python kernel where you author
and test registry code before promoting it. The [Data Explorer](/docs/data-explorer) shows what
each dataset actually contains, and [Market](/docs/market) is the read-only window onto the market
data plane itself.

## Where to start

| Read | For |
|---|---|
| [Core concepts](/docs/core-concepts) | The vocabulary — the ten objects: asset group, strategy, fitness function, risk manager, study, trial, candidate portfolio, promoted portfolio, portfolio group, operation |
| [System architecture](/docs/architecture) | How the SPA, the API, the compute engines and the background data workers fit together |
| [Account setup](/docs/account-setup) | Getting in: signing in, the one-time organization setup, the account page, and your token balances |
| [Quickstart](/docs/quickstart) | The shortest real path — one strategy, one study, one set of results |
| [End-to-end workflow](/docs/end-to-end-workflow) | The complete path from a blank account to a deployed portfolio group |

> [!TIP]
> If you have never opened Fintela, read [Core concepts](/docs/core-concepts) first and then run
> the [Quickstart](/docs/quickstart). Concepts defines all ten objects and names the page that owns
> each one; Quickstart walks a strategy, a study and its results on screen.

## How this documentation is organized

Every page is reachable from the sidebar on the left. Sections, in order:

| Section | What lives there |
|---|---|
| **Getting Started** | This page, plus [core concepts](/docs/core-concepts), [system architecture](/docs/architecture), [account setup](/docs/account-setup) and the [quickstart](/docs/quickstart) |
| **Platform Overview** | The shell and the read-only surfaces: [navigation](/docs/navigation), [Home](/docs/home), [Market](/docs/market), [Data Explorer](/docs/data-explorer) |
| **Registries** | The [shared conventions](/docs/registries) plus one page per registry — all seven built on the same four-part structure |
| **Analysis & Portfolios** | Reading results: the [portfolios dashboard](/docs/portfolios-dashboard), the [optimization dashboard](/docs/optimization-dashboard), [portfolio detail](/docs/portfolio-detail), [Portfolio Manager](/docs/portfolio-manager), [charts](/docs/visualizations) and the [metrics reference](/docs/metrics-reference) |
| **Workflows** | Task-shaped guides: [end-to-end workflow](/docs/end-to-end-workflow), [analyzing results](/docs/analyzing-results), [live trading](/docs/live-trading) |
| **Artificial Intelligence** | [Fintelligent](/docs/fintelligent), what it [can do](/docs/fintelligent-capabilities), and its [drafts and runs](/docs/fintelligent-drafts-and-runs) |
| **Features** | [Laboratory](/docs/laboratory) and [Tokens & Billing](/docs/tokens-and-billing) |
| **Configuration & Advanced** | [Execution modes](/docs/execution-modes), [sampler selection](/docs/sampler-selection), [study lifecycle](/docs/study-lifecycle), the [external strategy](/docs/external-strategies) and [external fitness](/docs/external-fitness) contracts, and [optimizer architecture](/docs/optimizer-architecture) |
| **Integration Guides** | Working external endpoints in [Python · FastAPI](/docs/python-fastapi) and [Node.js · Express](/docs/node-express) |
| **API Reference** | The read-only Developer API — [overview](/docs/api-overview), [authentication](/docs/api-authentication), one page per resource, and [errors](/docs/api-errors) |

## Limits worth knowing up front

Stated here so you do not design around something that does not exist.

| Limit | Where it is documented |
|---|---|
| **Market data is end-of-day.** Every figure on Markets comes from a scheduled worker, and Fintela does not display intraday prices | [Market](/docs/market) |
| **The Developer API is read-only.** Every route is a `GET`; there are no writes and no webhooks, so integrations poll. Everything that costs compute is triggered inside the app, where the token ledger is | [API overview](/docs/api-overview) |
| **Live broker connections are gated off by default.** Paper trading is what ships; real-money connections are refused server-side until the platform-wide switch is lifted | [Live trading](/docs/live-trading) |
| **Nothing in a registry is shareable.** There is no per-row visibility setting and no cross-organization catalogue in any registry. The [Laboratory](/docs/laboratory)'s public catalog is a separate surface | [Registries](/docs/registries) |
| **Deletes are permanent.** No undelete and no archive anywhere in the registries | [Registries](/docs/registries) |
| **Data Pipelines is retired.** `/data-pipelines/*` redirects to the Data Explorer; strategies, fitness functions and risk managers now pick their data sources inside their own editors | [Data Explorer](/docs/data-explorer) |
