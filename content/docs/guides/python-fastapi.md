---
title: Python · FastAPI
section: Integration Guides
sectionOrder: 9
order: 1
published: true
updated: 2026-09-01
summary: Connect a strategy or fitness function you've built in Python to Fintela: while your code, models, and data stay on your own systems.
keywords: fastapi, python, external strategy, external fitness function, integration guide, self-hosted, signal generation, deployment
---

This guide walks through connecting your own Python based trading logic to Fintela using
FastAPI, a popular Python web framework. Once connected, a strategy or fitness function you host
yourself is sampled, simulated, and scored right alongside everything you build directly inside
Fintela's own editors: while your code, your models, and your data never leave your own systems.
The underlying capability is covered in [External strategies](/docs/external-strategies) and
[External fitness](/docs/external-fitness); this page is a practical walkthrough of setting that
connection up in Python. Prefer JavaScript? The same walkthrough exists for
[Node.js · Express](/docs/node-express).

## What you're connecting

Fintela only ever stores three things about an external strategy or fitness function: its
address, how long Fintela should wait for a reply, and how many requests Fintela may send it at
once. Nothing about your code, your data feeds, or your models is ever transmitted to or
retained by Fintela.

There are two kinds of logic you can host this way, and you can serve either or both from the
same Python service:

- **An external strategy**: logic that turns a date range and a set of parameters into a
  trading signal.
- **An external fitness function**: logic that turns the result of one simulated period into a
  single score.

Inside a study, the two work together in sequence:

1. When a trial runs, Fintela asks your service for a trading signal covering the study's date
   range.
2. Fintela takes that signal, simulates the trades, builds the resulting portfolio, and computes
   its performance.
3. Fintela asks your service to turn that performance into a single fitness score: once for the
   training period, once for validation, and again for the out of sample period if your study
   uses one.

Hosting both from one address is common, and it's exactly what this guide builds. Just keep in
mind that if your strategy and your fitness function share the same address, Fintela treats them
as sharing one pool of request capacity rather than two independent ones: more on that under
[Concurrency](#concurrency) below.

> [!NOTE] Where the line actually sits
> Fintela still does the heavy lifting for every study: loading market data, running the
> simulation, building the portfolio, applying risk managers, and computing performance metrics.
> Your service is responsible for exactly two things: turning a parameter sample into a signal,
> and turning a simulated result into a score.

## How Fintela talks to your service

| | Generating a signal | Scoring a result |
|---|---|---|
| What triggers it | Fintela needs a trading signal for a date range | A simulated period is complete and needs a score |
| What your service receives | The date range, plus the values of the parameters you declared | The equity curve, holdings, orders, trades, and performance metrics for one period |
| What your service returns | For each rebalance date: which tickers to hold, long or short, and how much of the portfolio to allocate to each | A single number: the fitness score for that period |
| How often, per trial | Once | Three times, or four when the study includes an out of sample window |
| Also triggered by | Saving the record (validation), running it in the lab, and (for strategies only) daily during [live trading](/docs/live-trading) | Saving the record (validation) and running it in the lab |

A live strategy also gets a quick health check before each day's live signal is requested: if
your service doesn't respond successfully within five seconds, that day's update is skipped and
reported as a health check failure rather than left to time out. Fitness functions are never
health checked this way.

> [!WARNING] The two conversations aren't interchangeable
> Signal generation and scoring organize their inputs differently from each other. If you build
> both from shared code, test each one independently rather than assuming what works for one
> automatically works for the other.

## What you need to get started

FastAPI is one of many ways to build this: Fintela doesn't care what language, framework, or
libraries you use, only that your service answers correctly and promptly. For the Python path,
you'll want a reasonably current Python installation, FastAPI itself, and somewhere to run the
service continuously: not just on your laptop while you're testing it.

## The logic your service provides

Two things live entirely on your side: your market data (whatever feed you already use) and your
alpha logic (whatever model or rule set decides what to hold, as sophisticated as you like). Your
service's job is to turn those into a signal Fintela can act on: for each rebalance date, one
entry per ticker you want to hold, marked Long or Short, with an allocation representing a share
of the portfolio.

### Rules your signal needs to follow

- **Allocations must be positive and no larger than 100% of the portfolio.** A zero weight
  position isn't valid: leave that ticker out of the date entirely instead of listing it at 0%.
- **The allocations for one date can't add up to more than 100%** of the portfolio, with a small
  rounding allowance.
- **Every ticker you name has to belong to the study's [asset group](/docs/asset-groups).**
  Fintela sends you the current ticker list on every request precisely so your logic can respect
  it.
- **Your signal for a date range can't come back empty.** If your logic genuinely finds no
  position for any date in the window, say so explicitly with a clear message rather than
  returning nothing: an error that explains itself is far easier to diagnose than a silent
  non answer.
- **Past results can't change when Fintela asks for a longer window later.** Fintela checks this
  automatically by requesting the same start date with a much later end date and comparing every
  previously returned date: so build your logic using only data up to and including each date,
  never data from later on.

> [!CAUTION] Never name one of your own parameters "tickers"
> Fintela always adds a ticker list under that same name when it asks your service for a signal.
> During validation, your own parameter takes priority and the ticker list isn't sent at all:
> you'll see a warning explaining the collision. Inside a running study, it's the other way
> around: the ticker list overwrites your parameter. Either way the result isn't what you
> intended, so pick a different name.

> [!NOTE] Two ways to say "nothing to trade here": and why the friendlier one helps while testing
> While you're validating a new connection, returning an explicit error with a clear message
> shows that exact message back to you, right where you're looking. Once a strategy is running
> inside a live study, that same situation is reported with more generic wording: while
> returning a technically valid but empty signal is instead reported as *"Your strategy produced
> no positions for any date in the study window."* Either is fine; pick whichever helps you debug
> faster. Both end the trial the same way.

## Deploying your service

- Run your service continuously, on infrastructure that stays up: not a laptop that sleeps or a
  process that stops when you close a terminal.
- Give it a public HTTPS address (plain HTTP is accepted too: see
  [Encryption and address requirements](#encryption-and-address-requirements): but isn't
  recommended).
- How you package and host it is entirely up to you. Fintela has no requirements about the
  deployment method, only about how the service behaves once it's reachable.
- Give it enough capacity to comfortably handle the number of simultaneous requests you configure
  as **Max Concurrency**, with enough headroom that one slow request doesn't stall the others.

## Testing your service before you connect it

Before registering the record in Fintela, work through the same sequence Fintela itself will
exercise, in order:

1. Ask for a signal over a realistic date range with realistic parameter values, and confirm the
   result looks right.
2. Ask for the same signal again with a much later end date, and confirm every date from the
   first answer comes back identical: this is the same causality check Fintela performs during
   validation.
3. Ask for a signal with a ticker list included, and confirm your logic actually respects it.
4. If you're also hosting a fitness function, score a realistic simulated period and confirm the
   number it returns makes sense.
5. Score an empty or degenerate period and confirm your service reports "no score" rather than
   erroring or inventing a number.
6. If you're hosting a strategy that will run live, confirm the health check responds quickly and
   successfully.

## Production checklist

| Setting | What to aim for | Why it matters |
|---|---|---|
| Response time | Comfortably within your configured **Timeout (seconds)** | If your service is still working when the timeout is reached, the request is dropped and the trial is pruned. |
| Capacity | At least your configured **Max Concurrency** in simultaneous requests | Fintela may send that many requests at once; less capacity than that shows up as refused or queued connections. |
| Open connections | Kept open for at least 30 seconds between requests | Fintela reuses open connections where it can; closing one too early causes a dropped connection error on the next request. |
| Address | Exact match, with no trailing slash redirects | A redirect is never followed, so a mismatched address fails outright. |
| Request size | Large payloads accepted, especially for scoring | A full period's trades, holdings, and equity curve can be sizeable; a very tight request size limit on your side will reject them. |
| Encryption | HTTPS | See [below](#encryption-and-address-requirements). |
| Credentials | None required, and none accepted | See [Access control](#access-control). |

### Concurrency

**Max Concurrency** isn't a hard connection cap: it's how many requests Fintela's own workers
are told to send your service at once for a given study. Set it to match what your service can
genuinely sustain; set it too high and a burst of trials will arrive faster than your service can
answer, showing up as refused connections on pruned trials.

| Situation | Requests sent at once |
|---|---|
| Only a strategy is external | Your strategy's Max Concurrency |
| Only a fitness function is external | Your fitness function's Max Concurrency |
| Both external, different addresses | The lower of the two settings |
| Both external, same address | Roughly half the lower setting: since they share one destination |
| Left blank or set to zero | Treated as unlimited; the study falls back to Fintela's own default plan |

Whatever you set, Fintela never sends more than 32 requests to an external address at once:
raising Max Concurrency past that buys nothing. And the traffic isn't even between the two calls:
expect roughly three or four scoring calls for every one signal generation call.

### Timeouts

While you're validating a new connection, Fintela uses a fixed, short waiting period (around 30
seconds) regardless of what you've set as **Timeout (seconds)**: so if a validation window is
too large to answer that quickly, narrow the validation date range rather than raising the
timeout, which won't help at that stage. Once a strategy or fitness function is running inside a
live study, the lab, or live trading, Fintela waits up to your configured Timeout and
automatically retries a handful of genuinely transient failures: a dropped connection, a brief
outage: with increasing delays between attempts. It deliberately does **not** retry a request
that was accepted and is simply running slowly, since retrying that would only add more load to
an already struggling service.

### Encryption and address requirements

HTTPS is strongly recommended: over plain HTTP, the parameters Fintela sends and the signal or
simulation results your service sends back travel unencrypted. Plain `http://` addresses are
still accepted: you'll see a warning while entering one, but it won't block you from saving.

What is always enforced is that your address is a genuine, publicly reachable location on the
internet. A local address, a private network address, or anything that only resolves inside your
own network is rejected: both when you save the record and again every time Fintela is about to
connect. This means a tunnel from your laptop won't work; the service needs to actually be
published somewhere reachable from the wider internet.

### Access control

Fintela never sends credentials, API keys, or tokens with its requests: there's no field for
one, so don't build your service to require one, or every request will be rejected and every
trial will fail. The access control the setup does allow is the address itself: choose a long,
hard to guess path as part of your endpoint rather than something predictable, and, if your
hosting provider supports it, add an IP allowlist at your own network edge as an extra layer.

## Registering your strategy or fitness function in Fintela

Create the record from the [Strategies registry](/docs/strategies) or the
[Fitness Functions registry](/docs/fitness-functions) and choose **External**. This choice can
only be made when you first create the record: it can't be converted later.

Both editors expose the same three settings:

| Field | What it controls | Default |
|---|---|---|
| **Endpoint** | The public address of your service |: (required) |
| **Max Concurrency** | How many requests Fintela may send at once | 4 |
| **Timeout (seconds)** | How long Fintela waits for a reply | 30 |

**Endpoint** is a base address: register it once, and Fintela reaches both the signal and
scoring sides of your service from that same base automatically.

Next, declare your parameters exactly as your service expects to receive them; each one you
declare becomes a value your service is handed on every call, so the names and types here need to
match your logic. Strategy parameters can be whole numbers, decimals, or categories (a category
arrives as text); fitness parameters can only be whole numbers or decimals and, unlike a
strategy's parameters, are fixed constants for the whole study rather than something the search
explores.

A strategy also needs one short piece of logic entered directly into Fintela, whether it's
Internal or External: how much trailing history it needs before it can compute its first signal.
This runs inside Fintela itself, never against your service: for example:

```python
def required_lookback(lookback):
    return lookback
```

Saving runs a live check against your service and only lets you finish naming the record once it
passes. Every parameter you've declared needs a test value first, since that's what the check
actually uses.

> [!TIP] Validate the strategy side first
> Strategy validation is the check that calls your service twice and compares the two signals.
> Getting it to pass confirms your address, your inputs, your outputs, and that your logic never
> looks into the future: all in one step, before a full study ever depends on it.

## Understanding connection errors

A trial is never retried once it fails: a failure prunes it and leaves a classified reason in
the study's errors panel. Here's what each one means and where to look:

| What you'll see | What it usually means |
|---|---|
| Address unreachable | Your address doesn't resolve, or resolves to a private address. Publish it somewhere genuinely public and try again. |
| Connection refused | Nothing was listening when Fintela tried to connect. Make sure your service runs continuously, with enough capacity to accept more than one connection at a time. |
| Took too long to respond | Your service accepted the request but didn't answer within your **Timeout (seconds)**. Raise the timeout, add capacity, or speed up your logic. |
| Couldn't get through | Fintela couldn't even establish a connection in time: your service's queue was likely already full. Add capacity, or lower **Max Concurrency** to match what it can handle. |
| Connection dropped mid request | Your service closed the connection before Fintela could reuse it. Keep connections open for at least 30 seconds. |
| Server error | Your service returned an error of its own. Check your own logs for the request that failed. |
| Request rejected | Your service returned a client side error: often because the parameters it received didn't pass its own checks. |
| Unexpected response | Your service answered successfully, but the reply didn't contain a valid signal (or, for scoring, a valid fitness value). |
| Tickers outside the asset group | Your signal named a ticker that isn't in the study's asset group. Respect the ticker list Fintela sends you. |
| Score not a number | Your scoring function reported "no score" for a period. This is expected when a period genuinely can't be scored. |

The same walkthrough in JavaScript is in [Node.js · Express](/docs/node-express). The complete
reference for both connections lives in [External strategies](/docs/external-strategies) and
[External fitness](/docs/external-fitness); if you'd rather write your logic directly inside
Fintela instead of hosting it yourself, see [Execution modes](/docs/execution-modes).
