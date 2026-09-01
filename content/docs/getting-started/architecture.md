---
title: How Fintela works
section: Getting Started
sectionOrder: 1
order: 2
published: true
updated: 2026-09-01
summary: What happens behind the scenes when you use Fintela — from instant actions to background jobs and daily data updates.
keywords: architecture, how it works, background jobs, studies, live trading, market data, sign in, developer api
---

Fintela is one connected workspace, but not everything you do happens at the same speed. Opening a
dashboard is instant. Validating a strategy takes a couple of seconds. Launching a full study can
take minutes. Your portfolios and market data update automatically overnight, whether or not you're
logged in. None of that is random — it follows a consistent pattern once you know what to look for.

This page is the orientation: what happens the moment you click something, what keeps running after
you look away, how your own code fits into the picture, and what to expect from the platform as you
rely on it day to day.

## How Fintela is organized

Everything you use lives in one place — there's nothing separate to install or manage. Behind that
single workspace, three things are working together on your behalf:

| Part | What it means for you |
|---|---|
| The app itself | Everything you see and click — dashboards, editors, charts, and results. Always available, always the same place you sign in |
| Your work | Validating, backtesting, and optimizing the strategies, fitness functions, and risk managers you build |
| Market data | Prices, fundamentals, and other data that stay current automatically, without you having to refresh or fetch anything yourself |

If you want to pull your own results into your own tools or dashboards instead of viewing them in
Fintela, that's also possible through the [Developer API](/docs/api-overview) — a separate,
read-only door into your own data, covered in more detail later on this page.

## Where the work happens

### Instant actions

Most of what you do is answered the moment you click it: browsing your registries, opening a
dashboard, viewing a portfolio's detail page, reading a chart. Two calculations that look like they
should take a while are actually instant too — simulating a [portfolio group](/docs/portfolio-groups)
and reversing a "what if" on a single trial both come back immediately, with no waiting screen.

### Running your strategies, fitness functions, and risk managers

Anything that actually executes your code — your strategy logic, your fitness function, your risk
manager — runs in its own protected space, set aside just for that job. That keeps your runs
independent from everyone else's and keeps the platform responsive no matter how many people are
using it at once.

| When you... | What happens |
|---|---|
| Click **Validate** in an editor | Your code is checked right away — syntax and logic problems are caught before you can run anything with it |
| Run a backtest in the sandbox | Fintela executes a single, one-off run of your strategy, fitness function, or risk manager and shows you the result |
| Launch a [study](/docs/studies) | Fintela runs many backtests in parallel, searching across parameters according to the trial budget you set |
| Open the [Laboratory](/docs/laboratory) | You get a live, personal Python environment to explore in, which shuts down cleanly once you're done with it |

### Keeping your data and portfolios current

A separate, continuous layer keeps everything you look at up to date without you asking it to.
Overnight, prices, fundamentals, corporate actions, indicators, and other market data refresh so
that Markets, the Screener, and your metric comparisons show fresh numbers the next time you open
them. [Promoted portfolios](/docs/promoted-portfolios) and portfolio groups are extended by a day
right after that data lands. If you're running a [live operation](/docs/live-trading), your
positions, fills, and orders are reconciled with your broker roughly every 30 seconds, so what you
see in the operation history stays close to real time.

## What to expect when you click something

Not every action feels the same, and knowing which category something falls into tells you whether
to wait, watch a progress indicator, or simply check back later.

### Instant

Most of the app works this way — you click, and the answer is already there. Every instant action is
built to finish quickly, within well under a minute. If you're pulling data through the
[Developer API](/docs/api-overview) at high volume, an occasional burst of many requests in a short
window may get a brief "please slow down" response rather than a failure — that's Fintela protecting
performance for everyone, not a sign anything is wrong. If something does go wrong, you'll see a
plain-language explanation of what happened rather than a cryptic code; teams integrating through the
Developer API can find the specific messages it returns on [errors](/docs/api-errors).

### Runs in the background while you keep working

Anything that runs your code — validating, sandbox backtests, checking a fitness function or risk
manager, previewing a data source — happens as a background job. You'll see a progress indicator
while Fintela checks in automatically every couple of seconds, and the job finishes as either
successful or failed.

> [!TIP] A slow backtest never breaks your session
> Instant actions are capped at well under a minute, but a thorough backtest can reasonably need more
> time than that. That's exactly why these run as background jobs instead — you can safely wait on
> one, switch to another tab, or step away entirely. If a job is taking unusually long, Fintela tells
> you it's still working rather than timing out; nothing is lost by looking away.

### Takes minutes, tracked as a running task

The heaviest work runs as a longer task you can track rather than wait on. You kick it off, Fintela
takes it from there, and results appear as they're ready.

| Action | What happens |
|---|---|
| Launch a [study](/docs/studies) | It's queued and the tokens for it are charged, then Fintela starts on it right away; individual trial results appear in your dashboard as batches complete |
| **Update portfolios** on a [portfolio group](/docs/portfolio-groups) | Every portfolio in the group is queued for a fresh run and updates one by one |
| Open the [Laboratory](/docs/laboratory) | Your session is requested and becomes ready within moments as your personal environment starts up |

These are the actions measured in minutes rather than seconds — how long a study takes depends on its
trial budget, its universe, and its execution mode. Nothing in the app blocks while it runs, so you're
free to keep working elsewhere.

> [!WARNING] Timing and billing aren't identical across these three
> Launching a new study is charged and picked up almost immediately. Resuming a paused study can take
> a little longer to get going, since it waits for the next scheduling pass rather than starting
> instantly. A portfolio group refresh is charged when the update actually begins, and a Laboratory
> session is billed for as long as it stays open. See [tokens and billing](/docs/tokens-and-billing)
> for the specifics.

### Happens automatically, on its own schedule

This layer runs whether or not you're logged in — you never trigger it, you just see its results.

| What runs | When | What you see |
|---|---|---|
| End-of-day prices, fundamentals, indicators, and metrics | Overnight | Fresh numbers on Markets, the Screener, and your metric comparisons — see [Market](/docs/market) |
| Daily extension of promoted portfolios and portfolio groups | Right after that day's prices land, never before | New bars added to a [promoted portfolio](/docs/promoted-portfolios)'s curve |
| Broker reconciliation for a live operation | Continuously, roughly every 30 seconds | Orders, fills, and P&L in the operation history — see [live trading](/docs/live-trading) |

## Where your strategies and models actually run

Where your code executes depends only on what you're doing in the moment — the same actions behave
the same way whether the code is one you wrote inside Fintela or one you're running from your own
server ("external mode").

| When you... | Code written inside Fintela | An external strategy, fitness function, or risk manager |
|---|---|---|
| Click **Validate** | Checked immediately inside Fintela | Fintela calls your endpoint and waits up to about 30 seconds for a response |
| Run a sandbox backtest | Executed in an isolated space just for that run | Fintela calls your endpoint for the signal instead |
| Launch a study | Runs in parallel across many trials at once | Fintela calls your endpoint for each trial instead, with parallelism capped — studies with an external component run somewhat more slowly |
| Daily update on a promoted portfolio | Re-run automatically each day | Not supported — an external strategy can't be promoted or tracked day to day |
| Laboratory notebook cell | Runs live in your session | Not applicable |

Whichever path you use, code that passes validation keeps behaving the same way later — the same
package versions back it whether you're validating, backtesting, optimizing, or watching a daily
update run. [Strategies](/docs/strategies) lists what's available to build with.

> [!NOTE] Your code runs in an isolated space
> Whether you're validating, backtesting, optimizing, or running a daily update, your code executes
> with no access to Fintela's internal systems or credentials. It only ever sees the market data and
> inputs Fintela hands it for that run.

### Running your own logic outside Fintela

If you'd rather keep your models, data, or proprietary logic on your own systems, external mode lets
you do that: your code and data never leave your own infrastructure. You connect it to Fintela by
pointing a strategy, fitness function, or risk manager at an endpoint you run yourself, and Fintela
calls it whenever it needs a decision — during validation, a sandbox backtest, or a study — so it
gets scored and traded alongside strategies you write directly in the app, with the same reporting
and the same portfolios.

This is the right choice when you want to keep your intellectual property private, use a language or
stack Fintela doesn't support natively, or simply avoid being locked into writing everything inside
one editor. What Fintela stores on its side is just your endpoint's address plus the response-time
and concurrency limits you configure — it may also call your endpoint once ahead of a run to work out
how much historical data it needs. Fintela doesn't send your endpoint any credentials, so if you want
to confirm requests are genuinely coming from Fintela, that check needs to live on your side. Full
details are on [execution modes](/docs/execution-modes),
[external strategies](/docs/external-strategies), and [external fitness](/docs/external-fitness).

## Signing in and how your data is shared

One sign-in gets you into everything. You land on a secure sign-in screen, and once you're in,
Fintela keeps you signed in and quietly renews your session in the background — you shouldn't need to
log back in mid-task.

Your data is scoped to your **organization**, not just to you: everything you can see, everyone on
your team can see too. Two things narrow that further — entitlement locks on specific features, and
role-based permissions your organization sets for its members. [Navigation](/docs/navigation)
documents what a locked feature looks like and why.

[Fintelligent](/docs/fintelligent) follows the same rules as you do — it sees exactly what you see in
your workspace, nothing more and nothing less.

The [Developer API](/docs/api-overview) is a separate front door for pulling your studies,
portfolios, and results into your own systems or dashboards. It uses its own personal access key,
issued from your account settings, rather than your regular sign-in, and it's strictly read-only —
nothing sent through it can change or launch anything, which means it can never rack up charges by
accident. It's also isolated by organization: reaching for something outside your organization simply
looks like it doesn't exist, so it can't be used to probe what other organizations have. See
[API authentication](/docs/api-authentication) for how to generate and use a key.

## Your work and data are safe

Everything is saved as it happens — your registries, every trial and its results, equity curves,
holdings and transactions, portfolio metrics, market data, and the token charges tied to your account
all land in one secure, shared store the moment they're produced. There's no separate save step and
nothing sits only in your browser.

> [!SUCCESS] Interrupted work is never lost
> If a study or update is interrupted partway through, you don't lose your progress — anything already
> completed stays saved. Restarting picks up from where things left off instead of starting the whole
> run over, and stopping a run in progress keeps every portfolio, curve, and metric it had already
> produced.

## How you'll see new results appear

You generally don't need to hit refresh — Fintela keeps what's on screen current on its own. Anything
you'd think of as "live" — a study's progress, a Laboratory session's status, a background job's
status — checks in automatically on an interval that speeds up while something is actively running
and eases off once it settles. Alongside that, a lightweight live-update signal lets the app notice
changes quickly, so results generally show up within moments of being ready without you doing
anything.

If you're integrating through the [Developer API](/docs/api-overview) to pull results into your own
tools, keep in mind that Fintela doesn't push updates out to external systems — there's nothing that
calls your infrastructure to announce a change. The recommended approach is to check back
periodically for what's new; that guide covers the patterns that work well for that.

## Things worth knowing

A few practical limits, stated plainly so you can plan around them instead of running into them by
surprise.

| What to know | What it means for you |
|---|---|
| Nothing calls out to your own systems automatically | If you're pulling data via the Developer API, plan to check back periodically — the only exception is your own external strategy, fitness, or risk-manager endpoint, which Fintela does call, but only because you configured it |
| The Developer API is read-only | You can pull your studies, portfolios, and results into your own tools, but you can't launch or change anything from outside the app — everything that spends tokens has to be started by you, inside Fintela |
| Instant actions have a short time budget | Anything that could take longer runs as a background job or a tracked task instead, so you're never stuck waiting on a single screen |
| You can't dial in an exact number of parallel workers for a study | How much a study parallelizes follows from your trial budget, execution mode, and sampler choice, not a setting you control directly |
| Using an external strategy limits how much a study can parallelize | An external endpoint and full distributed execution don't mix — see [execution modes](/docs/execution-modes) |
| External strategies can't be tracked day to day | Daily updates re-run your strategy on Fintela's own schedule against Fintela's own data, which only works for strategies written inside Fintela |
| Market data is end-of-day | Fintela doesn't display intraday prices — see [Market](/docs/market) |
| Data Pipelines has been folded into Data Explorer | Old links redirect automatically to the [Data Explorer](/docs/data-explorer); a strategy still picks its data sources from its own editor |

Where to go from here: [Core concepts](/docs/core-concepts) for the vocabulary,
[Quickstart](/docs/quickstart) to put three of these objects on screen yourself, and
[Study lifecycle](/docs/study-lifecycle) if you want to understand every stage a study moves through
in full detail.
