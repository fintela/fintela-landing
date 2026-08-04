---
title: Managing risk managers
section: Workflows
sectionOrder: 2
order: 2
published: true
updated: 2026-08-04
summary: Create, version, share, and test risk managers — the governance layer that protects a portfolio during a backtest.
keywords: risk manager, risk management, stop loss, trailing stop, drawdown, exposure cap, position cap, time-window halt, rule-based, versioning, public catalog, execution log
---

Risk managers are a governance layer that runs on every step of a backtest, before the
strategy rebalances, and applies protective actions on the portfolio from the previous
step — closing positions, halting rebalancing, or trimming holdings that breach a limit.
This page walks through creating, versioning, sharing, and testing them.

## Overview

A strategy decides what to buy and when. A **risk manager** decides how the resulting
portfolio is policed. It runs alongside the strategy, not inside it: each step the engine
first asks every attached risk manager what to do on the portfolio as it stood after the
previous step, applies those operations, and then runs the strategy's rebalance for the
current step.

Risk managers live in the **Registry** section of the app, next to strategies and fitness
functions. Each one is an independent, versioned object that can be attached to as many
studies as you like.

## When they act

Because risk managers always run _before_ the strategy's rebalance on a given step, and
they see the portfolio from the previous step (after mark-to-market), their effect on a
same-step strategy signal depends on the kind of rule:

| Kind of rule | Examples | When the effect lands |
|---|---|---|
| Halts | max drawdown circuit-breaker, time-window halt | Suppress the strategy's rebalance on the same step. Max drawdown is permanent once it trips; time-window halt is revocable step by step. |
| Reactive protections | stop loss, take profit, trailing stop | Close existing positions on the same step, before the strategy rebalances. They do not see the strategy's new signal for that step — they react to positions already held. |
| Allocation caps | position cap, sector cap, country cap, gross-exposure cap, cash floor | Trim holdings that already breach the limit. They do not pre-screen the strategy's new orders, so a fresh rebalance that opens a position above the cap is executed at the requested size on that step and trimmed back to the cap on the next step. |

> [!NOTE] First step of a backtest is different
> On the very first step — when the strategy seeds its initial positions — allocation caps
> _do_ trim those initial positions in the same step. Reactive protections also record
> their reference prices (entry, peak, trough) from that initial seed. The one-step lag for
> caps only applies to rebalances after that.

`Registry → Risk Managers`

## The four kinds

Risk managers come in four flavors so you can match the effort to the need:

| Kind | What it is | Best for |
|---|---|---|
| Built-in | Ready-made rules from the catalog — stop loss, trailing stop, take profit, max drawdown, sector / country / position / gross-exposure caps, cash floor, and time-window halts. | Standard protections with no code — fastest to set up. |
| Rule-based | A rule tree you compose visually from catalog rules, combined with simple "any of" / "all of" logic. No code required. | Custom combinations of standard protections. |
| Custom | Your own logic written in Python, with full access to the live portfolio state and market history. | Bespoke risk logic that the catalog cannot express. |
| External | A risk manager you host behind your own HTTPS endpoint. Fintela calls it with the portfolio state and applies the operations it returns. | Reusing an existing in-house risk system. |

> [!NOTE] External risk managers and market data
> Unlike external strategies, external risk managers do **not** receive market data from
> Fintela — they operate on the portfolio state you send them and are expected to own any
> market data they need. Built-in, rule-based, and custom risk managers all have managed
> access to price history.

## Create a risk manager

`Registry → Risk Managers → + New Risk Manager`

1. **Open the Risk Managers list.** Click **Registry** in the left sidebar, then
   **Risk Managers**. You'll see every risk manager in your organization with its name,
   kind, and version.
2. **Click '+ New Risk Manager' and pick a kind.** Choose **Built-in**, **Rule-based**,
   **Custom**, or **External**. The form adapts to the kind you picked.
3. **Configure it.** For a built-in, pick the rule and set its parameters. For a
   rule-based risk manager, use the visual rule builder to add rules and group them with
   **any of** / **all of** logic. For a custom risk manager, write the Python logic in the
   editor and declare its parameters with test values. For an external risk manager,
   provide the endpoint URL, a timeout, and a maximum number of concurrent calls.
4. **Validate and save.** Fintela validates the configuration — for custom and external
   risk managers it runs a smoke test with your declared parameters — and saves it as a
   new version.

## Fixed and optimizable parameters

Every parameter on a risk manager can be set in one of two modes when you attach it to a
study:

| Mode | What you provide | What happens |
|---|---|---|
| Fixed | A single value | The parameter stays locked to that value in every trial of the study. |
| Optimizable | A minimum and a maximum | The optimizer searches that range, trying to find the value that produces the best fitness. |

You can mix both modes on the same risk manager — pin the parameters you are confident
about and let the platform explore the rest. This is what makes a **risk-manager
optimization study** possible: see [Running optimizations](/docs/running-optimizations).

## Versioning and history

Every time you edit a risk manager, the previous state is preserved as a version. You can
review the full history and see exactly what changed and when. Because a study captures
the configuration of the risk managers attached to it, editing a risk manager later never
silently changes the results of a study that already ran — those results stay
reproducible.

## Sharing and the public catalog

A risk manager can be marked as **publicly shared**, which adds it to a public catalog
visible to other organizations. From that catalog, anyone can **derive** a copy into their
own Registry as a starting point and then customize it. Public risk managers show how many
times they have been derived, so popular, well-tested protections are easy to spot.

## Test in the sandbox

Before attaching a risk manager to a study, you can test it in the **sandbox** — run a
full backtest for a single set of parameters and see how the strategy and the risk manager
interact. The strategy sandbox accepts an optional risk manager, so you can compare the
same strategy with and without a given protection, or swap protections to see which one
fits a portfolio best.

## Attaching to a study

Risk managers take effect when they are attached to a study. In the study you choose which
risk managers to include, set each parameter as fixed or optimizable, and define the order
in which they run on each step (a tie-breaker when several managers want to act on the same
position). Every trial of the study then runs the attached risk managers first on each step
and then the strategy's rebalance, as described in [When they act](#when-they-act) above.
Full details are in [Running optimizations](/docs/running-optimizations).

## Execution log

When a risk manager runs, any notable events — a timeout, an error in custom code, an
invalid response, or a hard stop — are recorded in an **execution log**. You can review it
from the portfolio detail view to understand exactly how a risk manager behaved during a
backtest. Built-in and rule-based risk managers rarely log anything; the execution log is
mostly useful for diagnosing custom and external risk managers.

## Quotas

Each organization has limits on how many risk managers it can create, broken down by kind.
If you reach a limit, creating or attaching another risk manager of that kind is blocked
with a clear message. Contact support if you need a higher allowance.

> [!TIP]
> Start with a built-in risk manager from the catalog. Once you understand how it shapes
> your results, graduate to a rule-based combination, and reach for custom or external risk
> managers only when the catalog cannot express what you need.
