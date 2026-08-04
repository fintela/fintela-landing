---
title: Overview
section: Getting Started
sectionOrder: 1
order: 1
published: true
updated: 2026-08-04
summary: What Fintela is, how the platform fits together, and where to go next.
keywords: intro, what is fintela, home, documentation, getting started
---

Write a strategy, run a Bayesian parameter search, review the results, and connect
a broker agent — all from the Fintela UI. The API and the external execution modes
are there when you need them.

From strategy idea to live portfolio.

## Start here

| Page | What it covers | Time |
|---|---|---|
| [Platform tour](/docs/platform-tour) | A map of every screen — Registry, Analytics, Agents, and how they connect. | 5 min |
| [Quickstart](/docs/quickstart) | Create a strategy, run an optimization study, and review results — step by step. | 10 min |
| [Core concepts](/docs/core-concepts) | Strategies, fitness functions, risk managers, studies, portfolios — the building blocks explained. | — |
| [External strategies](/docs/external-strategies) | Host your signal generator behind your own HTTPS endpoint. | — |

> [!TIP]
> If you have never opened Fintela before, take the [platform tour](/docs/platform-tour)
> first and then run the [quickstart](/docs/quickstart). Together they take about
> fifteen minutes and cover the whole path from a blank account to a portfolio you
> can inspect.

## Workflows

Step-by-step guides for every major task in the UI.

- **[Managing strategies](/docs/managing-strategies)** — create, validate, and
  sandbox internal and external strategies.
- **[Managing risk managers](/docs/managing-risk-managers)** — create, version,
  share, and test the governance layer that protects a portfolio.
- **[Running optimizations](/docs/running-optimizations)** — configure the 5-step
  study creation wizard and monitor running trials.
- **[Analyzing results](/docs/analyzing-results)** — navigate the portfolio
  dashboard, equity charts, trades, and pivot table.
- **[Live trading](/docs/live-trading)** — connect your brokerage, promote a
  portfolio, and run an operation on a basket.

## Configuration

Internal vs. external execution, sampler selection, and study lifecycle.

| Page | What it covers |
|---|---|
| [Execution modes](/docs/execution-modes) | The 2×2 mode matrix |
| [External strategies](/docs/external-strategies) | `POST /simulate` contract |
| [External fitness](/docs/external-fitness) | `POST /evaluate` contract |
| [Sampler selection](/docs/sampler-selection) | TPE, CMA-ES, Random, QMC, NSGA-II |
| [Data pipelines](/docs/data-pipelines) | Groupings, collections, basket holdings |

## Integration guides

End-to-end recipes for the most common stacks.

| Page | What it covers |
|---|---|
| [Python · FastAPI](/docs/python-fastapi) | 50 lines, ready to deploy |
| [Node.js · Express](/docs/node-express) | JavaScript ecosystem |

## API reference

Read-only endpoints for retrieving results programmatically.

| Page | What it covers |
|---|---|
| [API overview](/docs/api-overview) | Auth, base URL, rate limits |
| [Strategies](/docs/api-strategies) | Definitions, params, versions |
| [Studies](/docs/api-studies) | Progress, health, history |
| [Trials & portfolios](/docs/api-trials-portfolios) | Trials and promoted portfolios |
| [Baskets](/docs/api-baskets) | Operations, allocations, orders |
| [Fitness & asset groups](/docs/api-fitness-and-asset-groups) | Fitness functions, asset groups |
| [Errors & status codes](/docs/api-errors) | HTTP codes, trial failures |

## Contributing to these docs

Every page you are reading is a Markdown file in the public
[fintela-landing](https://github.com/fintela/fintela-landing) repository, under
`content/docs/`. There is no CMS and no credential involved: a page is a file, and
merging it to `main` publishes it.

Spotted something wrong or out of date? Use the **Edit this page on GitHub** link at
the bottom of any page — it opens that file in GitHub's editor, and saving proposes a
pull request.
