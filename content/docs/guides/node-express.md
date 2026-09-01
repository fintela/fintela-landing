---
title: Node.js · Express
section: Integration Guides
sectionOrder: 9
order: 2
published: true
updated: 2026-09-01
summary: Build your external strategy or fitness service in Node.js and Express, and connect it to Fintela.
keywords: express, node, javascript, guide, external strategy, external fitness, own logic, going live checklist
---

If your team builds in JavaScript or TypeScript, Node.js and Express are a natural way to host
your own trading logic or your own scoring logic outside Fintela, while still connecting it into
the platform. This guide walks through what that connection actually involves: what your service
is asked to do, how to keep it responsive enough for a study to depend on, and what to check
before you connect it for real. It's a companion to
[External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness),
which cover the underlying capability — your logic, your data and your models staying on your own
systems — in full. This page focuses on the practical side of building that service in Node.js
and Express specifically. The same capability, described for a team working in Python instead, is
in [Python · FastAPI](/docs/python-fastapi) — pick whichever guide matches how your team already
works; Fintela treats the two exactly the same way.

## Two kinds of requests your service handles

A strategy and a fitness function do different jobs, and if you're hosting both from the same
Node.js service — which is entirely supported — it's worth being clear about the difference
before you write a line of code.

| | A strategy service | A fitness service |
|---|---|---|
| What it's asked | Given a stretch of time and a set of parameter values, decide what to hold and how much to allocate | Given the outcome of a simulation Fintela already ran, turn it into a single quality score |
| What it answers with | A full trading signal covering the whole period in one response, not one answer per day | One number representing how good that outcome was |
| How often it's asked, per trial | Once | Several times — once for each stretch of the trial Fintela wants scored (its training period, its validation check, and its out-of-sample window, if the study has one) |
| Checked before it goes live | Yes — Fintela replays a longer window and confirms none of your past decisions change | No — there's nothing to replay, since it's scoring a simulation that has already finished |

> [!WARNING] Don't point both jobs at the same handler
> A strategy service is asked to make a decision; a fitness service is asked to judge one that's
> already been made. The two expect different information and answer in different ways, so if
> you're serving both from one Node.js app, keep them as two clearly separate pieces of code
> rather than reusing one handler for both.

## Why build this on Node.js and Express

Node.js and Express are a solid choice whenever your quant or engineering team already works
comfortably in JavaScript or TypeScript. Building your strategy or fitness logic this way means
it keeps living on your own systems, in a language your team already knows how to maintain,
rather than being rewritten to fit Fintela's own in-app editor. This is the same trade-off
[External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness)
describe more generally: writing your logic directly inside Fintela is simpler to get started
with, since Fintela runs and monitors it for you; hosting it yourself in Node.js means Fintela
never sees your code, your data or your models — only the trading decisions or the score your
service produces — and in exchange, keeping that service running, fast and correct is on you.

Node.js in particular tends to make sense when you're already pulling data through a
JavaScript-based pipeline, want to reuse logic that already lives in your web or trading
infrastructure, or simply want your quant work living in the same language as the rest of your
engineering organization. There's no requirement to pick Node.js over any other stack — Fintela
only cares about the address it can reach and the shape of what comes back, never the language
behind it.

## What your service needs to do

Whichever of the two jobs your service performs, the shape of the conversation stays simple:

- **As a strategy**, your service is told the time window it needs to cover, the specific
  combination of parameter values being tested, and — if you've set up a validation universe —
  which tickers to consider. It replies with a signal: for each date in that window, which
  tickers to hold, whether each position is long or short, and what fraction of the portfolio to
  put into it. The full rules a valid signal has to follow are covered in
  [External strategies](/docs/external-strategies).
- **As a fitness function**, your service is told the parameter values being scored, plus the
  simulated outcome for one period — the account's value over time, the positions it held, the
  orders it placed and the trades that closed, along with performance metrics Fintela has already
  calculated for that window (return, risk, risk-adjusted measures like Sharpe ratio, and more).
  It replies with one number: how good that outcome was, by whatever definition of "good" your
  own scoring logic uses.

Fintela handles everything in between — loading price history, running the simulation, building
the portfolio, and applying any risk managers you've configured. Your service's job starts and
ends at turning inputs into a decision, or an outcome into a score; nothing about how Fintela
gets there is something your service needs to know or worry about.

## Handling large scoring requests

A single strategy response is small — a handful of decisions for a handful of dates. A fitness
request is a different story: it carries a whole simulated trading history for the period being
scored, which can add up to a meaningful amount of data for a longer window or a busier book. If
your Node.js service isn't set up to accept a reasonably large amount of incoming data, a scoring
request for a longer or more active window can be turned away before your own scoring logic ever
runs — and that shows up as a failed trial with no obvious cause, since the rejection happens
before your logic sees the request at all.

Give the fitness side of your service a generous allowance for incoming request size, and keep
the strategy side considerably tighter — a strategy request never needs to carry more than your
declared parameters and, optionally, a list of tickers, so there's no reason to leave it open to
something much larger.

## Staying responsive

Fintela won't wait forever for an answer. During a normal run — a backtest, a study trial, or a
live portfolio's daily update — it waits however long you've set in **Timeout**; while you're
saving or validating a new strategy or fitness function, it always waits up to 30 seconds
regardless of what Timeout is set to, so a slow validation window can't be fixed by raising that
setting — shrinking the window itself is the fix instead.

Fintela also reuses open connections to your service rather than opening a fresh one for every
call, since that's faster for everyone. If your service closes an idle connection too quickly,
Fintela can end up trying to reuse one that's already gone, and that call fails outright. Keep
connections open for at least 30 seconds before your Node.js service closes them on its own, so
Fintela's own connection reuse doesn't run into one closing underneath it.

## Handling bursts of traffic

**Max Concurrency** is the setting that tells Fintela how many requests your service is
comfortable handling at the same time — a running study sizes its own pace around that number,
sending it that many trials in parallel rather than one at a time. If a burst of requests briefly
outpaces what your service can keep up with, the healthiest response is to tell Fintela plainly
that you're at capacity right now, rather than letting requests queue silently behind each other
or fail with an unrelated error. Fintela treats that as worth a short retry, and comes back a
small number of times with brief pauses before it gives up and moves on to the next trial.

If scoring a period or building a signal involves any real computation, make sure it doesn't tie
your service up long enough for other incoming requests to back up behind it — from Fintela's
side, that pile-up looks the same as your service having simply stopped answering. Running more
than one instance of your service, each handling a modest share of the traffic, is generally a
better fit than one instance trying to do everything at once.

> [!WARNING] A slow handler defeats the whole guard
> Telling Fintela you're at capacity only helps if your service can still say so promptly. If
> your own logic is what's slow, requests pile up waiting for it instead of being turned away
> cleanly, and they all eventually time out together instead of being shed gracefully. Move heavy
> computation off the request path where you can, and add capacity rather than letting one slow
> instance absorb everything.

## Marking an outcome that can't be scored

Some combinations of parameters just don't produce anything worth scoring — a strategy that never
opens a single position over the window it's given is a common example. When that happens, tell
Fintela directly that this particular outcome can't be scored, rather than inventing a very low
number to stand in for "bad." A number, even a deliberately punishing one, still looks like a
genuine score to Fintela's search — it gets compared against real outcomes and can quietly steer
the search away from a region that might otherwise be worth exploring. Fintela has a dedicated,
supported way to say "not scoreable," and that trial is then set aside cleanly rather than treated
as a poor result.

Getting this right is worth double-checking in whatever web framework you use — it's an easy
detail to get wrong by accident, since a service can end up sending something that merely looks
like a stand-in placeholder instead of the deliberate "not scoreable" signal Fintela expects.

## Keeping your address private

Fintela never sends any credentials to your service — no API key, no login header, no signed
request, nothing. Every call arrives as a plain, unauthenticated request, which keeps the setup
simple, but also means your service has to be willing to answer anything that reaches it; if your
service demands its own authentication and turns away unauthenticated calls, every trial will
fail.

The one thing standing between the open internet and your service is the address itself, so give
it a long, hard-to-guess path rather than a short, memorable one. That same address is used for
every call Fintela makes, from the very first validation check through a live portfolio's daily
update, so making it hard to stumble onto is the real protection here — not a login screen. If
you want an extra layer on top, an IP allowlist at your own network's edge sits comfortably
alongside this approach.

## Connecting your service to Fintela

Once your Node.js service is running, create the strategy from the
[Strategies](/docs/strategies) registry, or the fitness function from the
[Fitness Functions](/docs/fitness-functions) registry, and choose **External** at the top of the
editor — that choice is locked in once you save, so make it deliberately from the start. Both
editors ask for the same three things: the address of your service, how long Fintela should wait
for an answer (**Timeout**), and how many requests your service can comfortably handle at once
(**Max Concurrency**). Whatever address you register, Fintela always calls a fixed destination
beneath it, so register the base address of your service and nothing more.

One detail carries over no matter which language your service itself is written in: if you're
building a strategy, Fintela still asks you to declare how much price history it needs, by
writing a short lookback function directly inside Fintela's own editor — always in Python,
regardless of what your Node.js service is doing on its own. For a strategy with a single
parameter named `lookback`, that function is as simple as:

```python
def required_lookback(lookback):
    return lookback
```

Before you can save, every parameter you've declared needs a representative test value, and
Fintela runs your service through a validation check — covered next — before the strategy or
fitness function is finalized.

## Testing before you connect it

Try your own service against a handful of realistic scenarios before you register it — a failed
validation costs a round trip through Fintela's own check, so it's faster to catch problems on
your side first. For a strategy, run it over a normal window and confirm the signal that comes
back looks sensible; for a fitness function, run it against both a normal simulated outcome and a
degenerate one — a window with no trades at all — and confirm the degenerate case correctly comes
back marked as not scoreable rather than erroring or quietly returning a placeholder score.

It's also worth reproducing, on your own, the look-ahead check Fintela's own validation performs
on a strategy: ask your service for the same window twice — once as usual, and once with the end
date pushed much further into the future — and confirm every date from the first answer comes
back identical in the second. If it doesn't, your strategy is using information it wouldn't
actually have had at the time it made that decision. Fintela's own validation checks for exactly
this and blocks the save if it finds it, so confirming it yourself first saves a failed save
later.

## What you'll see if something goes wrong

A study never retries a failed trial on its own — once Fintela's short automatic retries are used
up, that one trial is set aside and the study moves on with the rest. Every set-aside trial's
reason shows up in the study's [errors panel](/docs/studies), so you always know which of your
services to look at, and roughly why.

| What you'll see | What it usually means for a Node.js service |
|---|---|
| Endpoint blocked | The address you registered doesn't resolve to somewhere Fintela can reach from the public internet |
| Endpoint refused | Your service wasn't accepting connections at that moment — make sure it's running continuously |
| Endpoint too slow | Your service took longer to answer than the Timeout you set |
| Endpoint unreachable | Fintela couldn't even open a connection in time — often a sign your service is overloaded |
| Connection dropped | Your service closed a connection Fintela was trying to reuse — see [Staying responsive](#staying-responsive) above |
| Endpoint error | Your service ran into a problem of its own while answering |
| Request rejected | Your service turned the request down outright — check for anything that might be asking for authentication Fintela can't provide |
| Unexpected response | Your service answered, but not in the shape Fintela expects for a signal or a score |
| Tickers outside asset group | Your strategy's signal named tickers that aren't part of the study's [asset group](/docs/asset-groups) |

Fintela checks that both your strategy's and your fitness function's addresses are reachable
before a study's very first trial runs, so a bad address fails the whole study once, clearly —
rather than quietly failing every trial one by one and leaving you looking at zero completed
trials with no explanation.

## Checklist before going live

- Your service answers quickly and consistently, comfortably within the Timeout you've registered
- Your service stays up continuously, with enough spare capacity to keep pace with the Max
  Concurrency you've set
- A fitness request carrying a full simulated trading history isn't rejected for being too large
- An outcome that genuinely can't be scored comes back correctly marked as such, never as a
  stand-in number
- Your strategy's signal follows the allocation rules in
  [External strategies](/docs/external-strategies) — valid positions, valid allocations, and only
  tickers from the study's asset group
- Your service accepts requests without requiring authentication of its own, since Fintela sends
  none
- The address you've registered is hard to guess and points somewhere reachable from the public
  internet
- If you're backing a [live portfolio](/docs/live-trading), your strategy answers its daily
  health check reliably, well within its short time limit — a live extend won't run without it

For the underlying capability in full — what Fintela stores, how addresses are checked, the exact
rules a signal or a score has to follow, and how a live portfolio uses your service day to day —
see [External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness).
For the trade-offs against writing your logic directly inside Fintela's own editor instead, see
[Execution modes](/docs/execution-modes).
