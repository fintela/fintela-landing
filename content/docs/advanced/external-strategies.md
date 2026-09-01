---
title: External strategies
section: Configuration & Advanced
sectionOrder: 8
order: 4
published: true
updated: 2026-09-01
summary: Run your own trading logic on your own systems, in any language, and connect it to Fintela so it can be scored and traded alongside strategies you build in the app.
keywords: external strategy, self-hosted strategy, own infrastructure, trading signal, max concurrency, timeout, private data, own language
---

An external strategy lets you run your own trading logic on your own systems — in any
language, using any data or models you like — and plug it into Fintela so it can be scored,
tested and traded alongside the strategies you build directly in the app. Fintela only ever
holds three things about it: where your service lives, how long to wait for a response, and
how many calls it can handle at once. Your code, your data, your models and your edge never
leave your own infrastructure — Fintela just sends over the numbers to test and reads back the
trading signal you produce.

## What Fintela stores

Setting up an external strategy is deliberately minimal. Fintela remembers three things about
your endpoint: its address, how long to wait for a response, and how many requests it's
allowed to handle at once. Everything else about the strategy — its name, description, the
parameters you've declared and how far back it needs price history — is the same metadata
Fintela keeps for any strategy, used to build the study's search space and load the right
price history. None of your logic, your data or your credentials ever reach Fintela.

This is the core trade-off between the two ways of building a strategy. With
[Internal execution](/docs/execution-modes) you write your logic directly in Fintela's own
editor and it runs inside the product. With External, Fintela never sees your code — only the
trading signal it produces. In exchange, you're responsible for keeping your own service up,
fast and correct.

> [!NOTE] Where the line is drawn
> Fintela still handles everything else in a study: loading price history, running the
> simulation, building the portfolio, applying risk managers and scoring the result. Your
> service has exactly one job — turn a set of parameter values and a date range into a trading
> signal.

## Registering the endpoint

Create the strategy from the [Strategies](/docs/strategies) registry, then choose **External**
from the options at the top of the editor. A third option, **Rule-based**, appears but isn't
available yet — Fintela shows it as coming soon.

### The three settings

The External panel of the editor asks for exactly three things.

| Setting | What it is | Default | Rule |
|---|---|---|---|
| **Endpoint** | The web address of your service | — | Required |
| **Max Concurrency** | How many requests your service can handle at the same time | 4 | Whole number, 1 or more |
| **Timeout (seconds)** | How long Fintela waits for your service to answer before giving up | 30 | Whole number, 1 or more |

**Endpoint** is the base address of your service — Fintela always calls a fixed sub-path under
whatever base address you register, so you register the address up to (but not including)
that final piece. The exact path your service needs to answer on is covered in the
[Python · FastAPI](/docs/python-fastapi) and [Node.js · Express](/docs/node-express) build
guides.

Typing a plain `http://` address shows a friendly warning under the field:

> Unencrypted (http://) — data traveling between Fintela and your service won't be encrypted.
> Fine while you're testing; switch to https:// once you're running for real.

That's advisory only — using `http://` never blocks you from saving. What Fintela does
enforce is covered next, under "Endpoint address rules".

Below the three settings, the editor offers an optional **validation universe** picker:

> Optional: choose a validation universe and Fintela includes that list of tickers every time
> it calls your service, both during validation and once your strategy is live. If your
> service can narrow its output to a given ticker list, use this; if it ignores the list,
> nothing changes for you.

### Execution type is fixed at creation

You choose Internal or External only when you first create the strategy — on an existing
strategy, both options are locked. There's no way to convert one into the other; if you want
to switch, create a new strategy instead.

The parameter panel and the `required_lookback` snippet — where you tell Fintela how much
price history your logic needs — work exactly the same for external strategies as internal
ones. Every parameter you declare becomes part of the study's search space, and whatever
values get sampled are what your service receives on each call.

## Endpoint address rules

Fintela checks your endpoint's address twice: once when you save it, and again every single
time it's about to call it. Both checks are only about the address itself — not about
encryption.

### The save-time check

When you save the strategy, Fintela checks that the address you typed is well-formed and
points somewhere on the public internet:

- Must be a normal web address (`http://` or `https://`) — nothing else is accepted.
- Must include a host — a domain name or a public IP address.
- Can't be `localhost` or point back at your own machine.
- Can't be a private or internal-network address — the kind only reachable from inside a
  company or home network — since Fintela has to be able to reach it from the outside.
- Can't contain stray whitespace or unusual characters.

This check doesn't try to connect to your service, so it's fine to register an address before
your service is even running. Any port is accepted — Fintela doesn't restrict which one you
use. If the address fails any of these checks, saving is blocked and you'll see a clear
message telling you what's wrong.

### The call-time check

Before Fintela actually opens a connection to your service — for validation, a backtest, a
study trial, or a live extend — it re-checks that the address resolves to a public location.
If your address ever starts pointing at a private or internal address (for example, after a
change to how your domain is configured), calls are refused with a clear message until it's
fixed.

Fintela never follows redirects from your service, so your endpoint can't accidentally — or
intentionally — redirect a call somewhere else.

### https is optional

The address check for external strategies isn't about encryption — it exists purely to make
sure Fintela can reach your service on the public internet. You can register either an
`http://` or an `https://` address, and both are checked exactly the same way.

> [!TIP] Choose https:// for privacy, not because it's required
> Using `https://` keeps the parameter values and signals traveling between Fintela and your
> service encrypted, which is a sensible default for anything running for real. Plain
> `http://` is accepted, but the trade-off is confidentiality, not access — it works just as
> reliably, it just isn't private.

## What Fintela sends to your service

Every call — a validation check, a one-off backtest, a live study trial, or a daily live-
portfolio update — sends your service the same basic information:

- **A date range** — the window the signal needs to cover.
- **Parameter values** — one value for each parameter you declared on the strategy, the
  specific combination being tested on this call.
- **A ticker list**, only if you've configured a validation universe.

Your service is expected to look at that date range and those parameter values, and hand back
a signal for the entire window in a single response — not one call per trading day.

The window is never just a single day. During validation it's the window you've configured
for testing (a six-month range by default, if you haven't set one). Inside a study it's the
trial's training period through its out-of-sample period, or through validation's end if the
study has no out-of-sample segment.

> [!WARNING] External fitness functions work the other way around
> If you also use an [external fitness function](/docs/external-fitness), keep in mind its
> inputs are structured differently from a strategy's — the two aren't interchangeable. Don't
> reuse the same handler for both.

### The ticker list

When your strategy has a validation universe attached — either an asset group or an explicit
list of tickers — Fintela includes that list on every call. Inside a study, the list is the
study's own [asset group](/docs/asset-groups), narrowed to whatever was actually tradeable
when the study launched. If no universe is configured, no ticker list is sent — your service
just gets the parameter values.

This is meant to be optional to use: a service that ignores the ticker list behaves exactly
the same as one that never received it. A service built to pay attention to it can narrow its
own output to just those tickers.

> [!CAUTION] Don't name a parameter "tickers"
> Fintela reserves that name for the ticker list itself, and the two conflict. During
> validation, your parameter wins and the ticker list is silently dropped, with a warning that
> a strategy parameter named "tickers" is blocking it. Inside a study, it's the reverse — the
> ticker list overwrites your parameter's value. Either way the result isn't what you want, so
> pick a different parameter name.

## What your service needs to return

Your service should respond with a signal: for each date, which tickers to hold, and how much
of the portfolio to put into each one.

| Field | Meaning |
|---|---|
| Position | Long or Short |
| Allocation | The fraction of the portfolio to put into that ticker on that date, from just above 0 up to 1 (100%) |

Any other information your response includes is simply ignored — only the signal itself is
read.

### Rules your signal has to follow

At validation, your signal goes through the same checks as a strategy you build inside
Fintela. Each of these breaks the response if it isn't followed:

- The signal must include at least one date — an empty response is rejected.
- Every date must be a real calendar date.
- Every ticker must be given both a Position and an Allocation.
- Position must be exactly Long or Short.
- Allocation must be a real, finite number, greater than 0, and no more than 1 (100%).
- Allocations for tickers on the same date can't add up to more than 100% (Fintela allows for
  tiny rounding differences, but not more).

Two things worth remembering: an allocation of exactly zero is rejected outright — if you
don't want to hold a ticker on a given date, leave it out of your response rather than
including it at 0%. And every ticker you return has to belong to the study's asset group;
Fintela warns you about this during validation, and any trial that violates it in a live study
will fail.

## Validating the endpoint

When you press Save on a new external strategy, Fintela runs it through a validation check
before the strategy is finalized — the confirmation dialog only appears once it passes. Before
that check can run, every declared parameter needs a test value (and, for a categorical
parameter, at least one choice with a test value).

The check calls your service twice:

1. Once over the window you're testing.
2. Once more with the end date pushed roughly two years further out, to prove your signal
   doesn't use information it shouldn't have.

If the signal for any past date changes between those two calls — a different ticker set, a
different position, a different allocation — Fintela flags it as a data-leakage problem and
blocks the save. In other words: your signal for a given date has to stay the same no matter
how far into the future Fintela asks, because in reality your strategy will never have seen
that future data when it was actually deciding. Your service should be able to handle being
asked for a window that extends well past the data it's actually using, and simply return the
same historical signal either way.

### If validation fails

| What went wrong | What it usually means |
|---|---|
| Address rejected | Your endpoint's address didn't pass the address check above |
| Your service returned an error | Something went wrong on your end responding to the request |
| Connection problem | Your service was unreachable, refused the connection, or didn't respond in time |
| Response wasn't understood | The reply wasn't valid data, or didn't include a signal at all |
| Signal broke a rule | One of the signal rules above wasn't followed |
| Data leakage detected | The signal for a past date changed when Fintela asked further into the future |

A successful validation can still come back with warnings. The most common one flags tickers
your service returned that fall outside the study's asset group — those trials will later fail
with a missing-ticker error unless you either add the tickers to the group or stop returning
them; an external strategy's signal has to stay within the asset group it's paired with.

> [!NOTE] Validation is a safety net, not a guarantee
> Saving a strategy you build in Fintela's own editor always requires passing this check
> first. For an external strategy, the in-app editor runs the same check before it lets you
> save — but if you or your team manage strategies through [Fintela's API](/docs/api-strategies)
> instead of the editor, saves made that way aren't gated behind it. Either way, always run
> Validate yourself and read the result before trusting a new external strategy in a live
> study — it confirms Fintela can talk to your service and that your signal is shaped
> correctly, not that your trading logic itself is sound.

## When your endpoint gets called

| Situation | How often your service is called |
|---|---|
| Saving or validating the strategy | Twice — the two calls described above |
| Running a one-off backtest | Once |
| A study is running | Once per trial |
| A live portfolio extends for the day | Once, right after Fintela confirms your service is responding |

### Timeouts and retries

How long Fintela waits for a response depends on the situation:

- **Saving or validating** always waits up to 30 seconds, no matter what you've set in
  Timeout. If your service genuinely needs longer than that to answer a validation window,
  shrink the window itself (using a validation universe date range) rather than raising the
  Timeout field — raising it has no effect on validation.
- **A backtest, a study trial, or a live extend** waits however long you've set in Timeout.

If Fintela can't even open a connection — your service isn't accepting requests, or the
network is having a bad moment — it retries a handful of times with short pauses before giving
up. But once your service accepts the request and then simply takes too long to answer,
Fintela does not retry that call outside of Save/Validate — retrying an already-slow service
just adds more load to it, so a slow trial is skipped once rather than piled on.

## Max Concurrency and how studies use it

**Max Concurrency isn't a connection limit** — that's fixed on Fintela's side no matter what
you set. It's the worker budget a study gives itself when it includes an external strategy or
fitness function: essentially, how many trials the study is allowed to run against your
service at the same time.

| Situation | Budget given to the study |
|---|---|
| Neither the strategy nor its fitness function is external | Not used — the study runs with its normal default sizing |
| Only the strategy is external | Uses the strategy's Max Concurrency |
| Strategy and fitness are both external, on different endpoints | The lower of the two Max Concurrency settings |
| Strategy and fitness are both external, on the same endpoint | Half the lower setting (rounded down, at least 1) — since both calls share the same service |
| Max Concurrency left blank or set to zero | Treated as unlimited; the study falls back to its normal default sizing |

Two endpoints count as "the same" once you ignore a trailing slash and letter case in the
address.

Even a high Max Concurrency won't push a study past roughly 32 simultaneous calls to your
endpoint — beyond that point, giving your service more headroom doesn't make the study faster.

> [!TIP] Size it to your service, not your ambition
> Setting Max Concurrency higher than your service can actually accept just means a burst of
> connections gets refused, and those trials get pruned. Run your service with at least two
> workers so it can handle more than one request at a time, then set Max Concurrency to what
> those workers can really support.

## What happens when a trial fails

A study never retries a trial. Once the automatic retries above are used up, whatever went
wrong prunes that one trial — the study keeps going with the rest, and every pruned trial's
exact reason is available in the study's errors panel.

| Label in the errors panel | What happened | What to do |
|---|---|---|
| Endpoint blocked | Your endpoint's address failed Fintela's address check | Fintela can only call endpoints on public, routable addresses. Publish your service somewhere reachable from the internet and relaunch. |
| Endpoint refused | Your service refused the connection | It wasn't accepting requests at that moment — keep it running continuously, with at least two workers. |
| Endpoint too slow | Your service accepted the request but didn't answer in time | Make it faster, add capacity, or raise Timeout. |
| Endpoint unreachable | Fintela couldn't connect in time | Check that your service is online, add capacity, or raise Timeout. |
| Connection dropped | Your service closed the connection while Fintela was reusing it | Keep connections open for at least 30 seconds before closing them. |
| Endpoint error | Your service returned an error of its own | Check your service's own logs for the failing request. |
| Request rejected | Your service rejected Fintela's request | Check the address, and make sure your service doesn't require authentication Fintela can't provide. |
| Unexpected response | Your service replied in the wrong shape | It must return the signal shape described above: dates mapped to tickers, each with a Position and an Allocation. |
| Tickers outside asset group | Your signal named tickers that aren't in the study's asset group | Add them to the asset group, or stop returning tickers the group doesn't include. |

Fintela checks both your strategy's and your fitness function's endpoint addresses before a
study's very first trial runs, so a bad address fails the whole study once, with a clear
reason — instead of quietly pruning every single trial and leaving you looking at zero
completed trials with no explanation.

A trial pruned for a bad response carries the full expectation in its message, along the
lines of:

> Your external strategy endpoint returned a response that isn't the shape Fintela expects —
> it must be a signal mapping dates to tickers, each with a Position ("Long" or "Short") and an
> Allocation.

## Authentication and secrets

Fintela never sends any credentials to your endpoint. There's no field for an API key, no
custom headers, no signing and no shared secret anywhere in an external strategy's setup —
every call arrives with just the date range, parameter values and optional ticker list, no
authentication attached.

Because of that, your service has to accept unauthenticated requests from Fintela — if it
answers with an authentication error, every trial will fail. The one thing standing between
the open internet and your service is the address itself: making it hard to guess, for example
by including a long random segment in the path, is a reasonable way to keep out unwanted
traffic, since that hard-to-guess piece stays part of every call Fintela makes.

> [!WARNING] Plain http:// means plain text
> If you register an `http://` address, the parameter values Fintela sends and the signal you
> return travel over the network unencrypted. That's your call to make about your own service,
> but make it knowingly — use `https://` if that matters to you.

## Live portfolios and the daily health check

Once a portfolio backed by an external strategy goes to [live trading](/docs/live-trading),
the daily extend adds one extra step: before asking for the day's signal, Fintela first checks
that your service is up and responding, with a strict 5-second limit. If that check fails for
any reason — your service is down, slow to answer, or returns anything other than success —
that day's extend fails outright and no signal is generated, rather than Fintela guessing or
using stale data.

A live portfolio always uses your strategy's current, saved settings — not a frozen snapshot
the way a study does. If you update your endpoint's address, the change takes effect on the
very next daily extend. Studies that are already running are different: they keep using
whichever endpoint was registered when they launched, so editing the address afterward doesn't
affect them.

## Building your endpoint

Building the service itself is ordinary web-service work: it needs to accept the parameter
values and date range described above and return a signal in the shape Fintela expects, plus
answer a simple health check so it can back a live portfolio. You can build it in any language
or framework — Fintela only cares about the address it can call and the shape of what comes
back.

For a full, working walkthrough, see [Python · FastAPI](/docs/python-fastapi) or
[Node.js · Express](/docs/node-express) — pick whichever matches your team's stack. Test your
service on your own before registering it in Fintela, the same way you'd test any web service
you're about to depend on.

## What external strategies do not get

Honest limits, all of them real:

| Not available | Why |
|---|---|
| Fintela's built-in data feeds | Your service only receives parameter values, the date range and (if configured) a ticker list — it can't pull in any of Fintela's own data sources directly. If your signal needs other data, your own service has to supply it. |
| The in-app code editor and live validation-as-you-type | There's no code living on Fintela's side to check — your logic runs entirely on your own service. |
| Sample-ticker convenience for validation | There's no built-in sample list to draw from; validation always uses your actual, configured ticker list. |
| Restoring a past version into the editor | Past versions are still recorded, but restoring one directly into the editor is only available for strategies you build in Fintela. |
| The breaking-change warning on save | That warning only applies to strategies you build in Fintela's own editor with studies already launched against them. |
| Rule-based (declarative) strategies | Not available yet for any strategy type — this style of strategy is currently only offered for [risk managers](/docs/risk-managers). |

External execution isn't unique to strategies. See [Execution modes](/docs/execution-modes)
for the full picture across strategies and fitness functions,
[External fitness](/docs/external-fitness) for how the fitness-function version works — its
inputs are structured the other way around — and [Strategies](/docs/strategies) for the
registry where you create and manage them all.
