---
title: Execution modes
section: Configuration & Advanced
sectionOrder: 8
order: 1
published: true
updated: 2026-09-01
summary: How to choose between running your strategies, fitness functions and risk managers inside Fintela or on your own infrastructure, and what that choice means for validation, timing and live trading.
keywords: internal, external, self-hosted, endpoint, strategies, fitness functions, risk managers, live trading, validation
---

Strategies, fitness functions and risk managers are the three pieces of logic you write in Fintela,
and each one asks you the same question when you create it: should Fintela run this for you, or
should it call out to something you run yourself? **Internal** means you write Python directly in
Fintela's editor and Fintela runs it for you. **External** means your logic lives on your own
servers — in any language, on any stack — and Fintela reaches out to it over the internet whenever
it needs an answer.

This choice is made per strategy, per fitness function, and per risk manager — not per study. That
means a single study can freely mix an internal strategy with an external fitness function, or any
other combination, with nothing extra to configure.

## Which parts of Fintela support Internal and External

| Where you use it | Can it be External? | Notes |
|---|---|---|
| [Strategies](/docs/strategies) | Yes | Also shows a **Rule-based** option that's disabled today — see below |
| [Fitness functions](/docs/fitness-functions) | Yes | Also offers ready-made **Built-in** objectives, plus a disabled **Rule-based** option |
| [Risk managers](/docs/risk-managers) | Yes, with a current limitation — see the caution further down | Also offers **Built-in** risk managers and a fully working **Rule-based** option |
| [Asset groups](/docs/asset-groups) | No | An asset group defines which assets to trade — it's data, not logic, so there's nothing to run |
| [Studies](/docs/studies) | No | A study simply uses whichever strategy and fitness function you chose for it |
| [Portfolio groups](/docs/portfolio-groups) | No | — |
| [Promoted portfolios](/docs/promoted-portfolios) | No | — |

### Seeing the mode at a glance

Every registry list shows an **Execution Type** column so you can tell at a glance how each
strategy, fitness function or risk manager runs, without opening it. On risk managers, turn on the
**Kind** column from the column chooser for friendlier labels — **Built-in**, **Custom code**,
**Rule-based** and **External HTTP** — which is also the one that correctly shows built-in and
rule-based risk managers (the plain Execution Type column leaves those blank).

> [!NOTE] Rule-based isn't available for strategies or fitness functions yet
> Both editors show a third **Rule-based** option alongside Internal and External, but it's
> permanently disabled with a "coming soon" tooltip — you can't save one today. Rule-based logic
> (building trading rules without writing code) is fully available for **risk managers** only.

## Where you choose the mode

You pick the mode once, when you first create the record:

| Resource | Where to find it | Options |
|---|---|---|
| Strategy | The Internal / External toggle at the top of the strategy editor | **Internal**, **External**, **Rule-based** (disabled) |
| Fitness function | The Internal / External toggle at the top of the fitness editor | **Internal**, **External**, **Rule-based** (disabled) |
| Risk manager | The **Kind** control pinned above the risk-manager editor | **Internal**, **External**, **Rule-based** |

All three controls lock as soon as the record is saved for the first time. Editing an existing
strategy or fitness function later, the toggle simply shows as disabled; the risk-manager editor
spells it out with helper text — while you're creating one it says the kind can't be changed once
it's created, and once it exists it says you'd need to create a new one to change it.

The risk-manager editor doesn't offer a **Built-in** option directly — built-in risk managers are
things you pick when you attach a risk manager to a study in the study wizard, not records you
create yourself. Built-in fitness objectives, on the other hand, do live in the fitness registry as
ready-made rows you can select — but they're provided by Fintela and read-only, so you can't edit,
duplicate or backtest one as if it were your own.

> [!TIP] Launched studies keep the version you started with
> When you launch a study, Fintela locks in the exact version of the strategy and fitness function
> you had selected at that moment. If you go back and edit the registry record afterward, any study
> already running keeps using the version it launched with — your live results never shift under
> you because of a later edit.

## Combining internal and external

A strategy's mode and a fitness function's mode are chosen independently, so all four combinations
are valid inside the same study. A **Built-in** fitness objective behaves like Internal for
everything in this table — it runs inside Fintela and never involves a call to your own servers.

| Combination | Trading signal comes from | Score comes from | Can be promoted to a live-tracked portfolio |
|---|---|---|---|
| Internal strategy + Internal fitness | Fintela | Fintela | Yes |
| Internal strategy + External fitness | Fintela | Your endpoint | Yes |
| External strategy + Internal fitness | Your endpoint | Fintela | **No** |
| External strategy + External fitness | Your endpoint | Your endpoint | **No** |

> [!WARNING] An external strategy can't become a live-tracked portfolio
> Daily-update, live-tracked management only works with a strategy Fintela runs internally — if
> the strategy behind a trial is External, promoting that trial to a tracked portfolio, or adding
> it to a tracked basket, is blocked. An external **fitness function** doesn't carry this
> restriction: it only scores trials while a study is optimizing, and it stops being involved the
> moment a portfolio is promoted, since live tracking doesn't need ongoing fitness scoring.

## What Internal requires

With Internal execution, everything happens inside Fintela's own editor and sandbox:

| Requirement | Strategy | Fitness function | Risk manager |
|---|---|---|---|
| Your code, written and saved in Fintela's editor | Yes | Yes | Yes |
| Inputs your function must accept | `data`, `start_date`, `end_date` | `simulation`, `data` | `today`, `portfolio_state`, `market_data` |
| A recent successful validation before you can save | Yes | Yes | Yes |
| Any data sources you've attached are fed in automatically | Yes | Yes | Yes |
| A `required_lookback(...)` warm-up function | Required | Not applicable | Optional |

The **validation requirement** is the part that catches most people the first time. Before you can
save an internal strategy, fitness function or risk manager, you need a successful **Validate** run
on file — one that's less than an hour old and matches exactly what you're about to save: the same
code, the same lookback logic, and the same data sources. If you save without one, or after
something has drifted, Fintela blocks the save and tells you why:

| What went wrong | What it means |
|---|---|
| No validation on file | You haven't clicked Validate for this code yet — do that first. |
| Validated at different parameter values | Some checks depend on the exact values you're saving with, so validate again using those values before saving. |
| Validated over a custom date window | Those checks only cover the window you tested, so validate again over the default window (a custom ticker list is fine) before saving. |
| Lookback logic changed since validating | Validate again so your warm-up window is proven for the current code. |

Only strategies check the exact parameter values, since only a strategy's timing and warm-up
behavior can change depending on the values it's run with.

## What External requires

Instead of code, an external record needs just three settings, all entered in the editor:

| Field | Strategy label | Fitness label | Risk manager label |
|---|---|---|---|
| Where to reach your service | **Endpoint** | **Endpoint** | **Endpoint** |
| How long to wait for a response | **Timeout (seconds)** | **Timeout (seconds)** | **Timeout (s)** |
| How many trials to send in parallel | **Max Concurrency** | **Max Concurrency** | **Max concurrency** |

All three default to a 30-second timeout and a concurrency of 4, and none of them can be saved with
an empty Endpoint. The numeric fields are checked a little differently across the three editors —
strategies and fitness functions validate as you type (strategies require a whole number, fitness
functions accept a decimal like 2.5), while the risk-manager editor is more lenient on screen but
the values are still checked when you save.

**External records skip the validation-receipt requirement above.** Since Fintela isn't running
your code, there's nothing for it to validate ahead of time — the only checks that apply are on
your endpoint's address itself (see [Endpoint address rules](#endpoint-address-rules) below).

Two things you don't get with External:

- **No automatic data-source feed for external strategies.** The Data sources section disappears
  from the editor entirely once a strategy is set to External — your endpoint only ever receives
  parameter values and the date window for each trial, not any data feeds you'd otherwise attach.
  Fintela still prices the universe on its own side either way, so your signals can be turned into
  trades.
- **No extra context for external fitness functions.** Only Fintela's own built-in scoring pulls in
  additional derived data; an external fitness endpoint receives the trial's simulation results and
  your parameter values, and nothing beyond that.

You still need to provide a `required_lookback(...)` warm-up function for an external strategy,
even though your actual signal logic runs entirely on your own servers — a save is refused without
one. This one small piece of code is entered directly in Fintela and used once, when you launch a
study, purely to work out how much historical data your asset group needs to warm up. It's never
sent to your endpoint, and it has no bearing on the signal your endpoint returns.

## What your endpoint needs to do

If you choose External for a strategy, fitness function or risk manager, your service takes on a
narrow, well-defined job. Your models, your data and your code never leave your own systems —
Fintela only ever sends it the inputs it needs and reads back a result, so you can bring your own
language, stack and private data sources without any of it touching Fintela's servers. The full
setup guides — [external strategies](/docs/external-strategies) and
[external fitness](/docs/external-fitness) — walk through building one; here's what each is
expected to do.

### Strategies

For every trial, Fintela sends your endpoint the date range being simulated and the parameter
values for that trial (plus, if you've set up an asset universe, the list of tickers in it) and
expects back a trading signal: for each date, which tickers to hold, in which direction (long or
short), and how much to allocate to each one.

If your endpoint returns a ticker that isn't in your Asset Group, Fintela skips just that trial with
a warning listing a sample of the offending tickers (up to 20), rather than failing your whole
study. The study builder reminds you of this rule up front: every ticker your endpoint returns has
to exist in the selected Asset Group, or the trials that reference it will fail.

When you validate an external strategy, Fintela calls your endpoint twice — once for the window
you're testing, and once with the end date pushed roughly two years further out. If the signal for
a past date comes back different between the two calls, that's a sign your endpoint's answer
depends on data it shouldn't have access to yet (a lookahead bias), and validation is blocked so you
can catch it before it costs you in a live study.

### Fitness functions

For every trial, Fintela sends your endpoint the parameter values being tested along with that
trial's simulation results — equity curve, holdings, orders, trades and performance metrics — and
expects back a single number: the fitness score for that trial. The optimizer uses this score to
steer toward better parameter combinations over the course of a study, the same way it would with
an internal fitness function.

### Risk managers

Unlike strategies and fitness functions, which are called once per trial, an external risk manager
is called once for **every simulated trading day**. On each call Fintela sends your endpoint the
current date, the portfolio's state (its value, cash allocation, peak value and current holdings)
and your configured parameters — deliberately **no market data**, since a risk manager that needs
its own data is expected to source it itself. Your endpoint responds with a list of actions to
take, or an empty response to do nothing that day.

If your endpoint fails 10 times in a row, or 25 times in total during a single trial, Fintela stops
calling it for the rest of that trial so a flaky connection doesn't stall your whole study, and it
keeps a log of up to 50 such events per run for you to review afterward.

> [!CAUTION] External risk managers can't be saved from the editor yet
> Fintela's platform-wide limit requires an external risk manager to respond in well under a
> second, but the risk-manager editor currently only accepts whole seconds and defaults to 30 —
> every value it can produce today falls outside what's allowed, so the save is always rejected.
> Until this is fixed, use an **Internal** (custom code) or **Rule-based** risk manager instead.

## Endpoint address rules

Whichever of the three you're setting up, the address you enter has to clear the same checks
before it can be saved:

- It has to be a complete, well-formed URL.
- It must use `http://` or `https://` — no other schemes.
- It needs a host name or address.
- It can't point at `localhost` or a loopback address.
- If you use a raw IP address rather than a domain name, it has to be a real, publicly reachable
  address — not a private, internal or reserved one.
- No stray whitespace or control characters in the URL.

> [!NOTE] `http://` is allowed, and any port works
> Encryption isn't what's being enforced here — reachability is. All three editors show an
> advisory warning if you enter a plain `http://` address (your data would travel unencrypted) but
> it never blocks Save; use `https://` once you're past testing. There's no restriction on which
> port your service listens on.

Saving an endpoint doesn't test that it's actually live — you can register an address before your
service is even running. The real check happens every time Fintela is about to call your endpoint
(validating, running a backtest, or launching a study): it resolves the address again and refuses
to call it if it points at a private, internal, or otherwise non-public network location. Fintela
also never follows redirects your server sends back.

## Timeouts, retries and concurrency

How long Fintela waits for your endpoint, and how many times it tries again, depends on what
you're doing:

| When | How long Fintela waits | What gets retried |
|---|---|---|
| Validating your code | Always 30 seconds, no matter what Timeout you've set | Up to 2 retries on connection problems |
| Running a backtest in the sandbox | Your configured Timeout, or 60 seconds if none is set | Up to 3 retries, with increasing delay, on connection problems and on server errors or "temporarily overloaded" responses from your endpoint — a plain timeout is not retried, since that's treated as your endpoint genuinely being slow |
| Running a full study | Your configured Timeout | Same retry behavior as a backtest |

> [!TIP] Max Concurrency controls how many trials run at once, not connections
> This setting caps how many trials Fintela sends to your endpoint at the same time — think of it
> as a parallelism budget, not a technical connection setting. When both a strategy and a fitness
> function are external, the smaller of their two limits applies, and it's halved if they actually
> point at the same endpoint. Regardless of what you set, the optimizer never runs more than 32
> trials in parallel for a single study. Leaving Max Concurrency blank or at zero is treated as
> unlimited.

Fintela never sends any credentials, API keys or signing headers to your endpoint. If you need to
control who's allowed to call your service, that's on you to enforce — with your own API key
scheme, IP restrictions, or whatever authentication fits your setup.

## Changing a record's mode after creation

Once you save a strategy, fitness function or risk manager, its mode is locked — the Internal /
External / Rule-based control stays disabled for the life of that record.

> [!WARNING] Treat the mode as permanent
> The product gives you no way to change a saved record's mode, and you shouldn't try to work
> around it even if you find a way — flipping it would leave the record missing half of what it
> needs (code with no endpoint, or an endpoint with no code) and would show up as a confusing
> change in that record's version history. If you need different behavior, **create a new
> strategy, fitness function or risk manager** instead of trying to convert an existing one.

Studies you've already launched are unaffected by any of this. Because a study locks in the exact
version of its strategy and fitness function the moment you launch it, nothing you change
afterward — mode or otherwise — can reach back into a study that's already running or completed.

If two people try to save changes to the same record at the same time, Fintela protects the first
save: the second person is asked to refresh and reapply their edit rather than having it silently
overwrite what was just saved.

## How Fintela decides which code to run

Every time a study runs, Fintela already knows exactly how to execute each of its pieces — because
that decision was made the moment you chose Internal, External, or Built-in for the strategy and
fitness function behind it. Internal code runs inside Fintela; external code is called over your
endpoint; a Built-in fitness objective is read straight off the simulation results without any code
running at all. This is fixed to the exact version of each record that was current when you
launched the study, so nothing about how a running study executes can shift underneath it partway
through.

Validating your code follows the same split — an internal strategy is checked differently from an
external one, and the same goes for fitness functions and risk managers, with built-in risk
managers getting their own lightweight check. Validation runs in the background: once you click
Validate, you can move on and come back to it, but you do still need it to finish successfully
before Fintela will let you save (see [What Internal requires](#what-internal-requires) above).

See [optimizer architecture](/docs/optimizer-architecture) for more on how Fintela schedules and
runs studies once they're launched, and [study lifecycle](/docs/study-lifecycle) for exactly when a
study locks in its versions and what happens at each stage from launch to completion.

## Where External doesn't apply

A few places in the product don't offer an execution mode at all, and two of the options the UI
shows can't actually be used today:

- **Asset groups, portfolio groups and promoted portfolios have no execution mode.** They hold
  data — which assets to trade, or which portfolios to track — not logic, so there's nothing to
  choose.
- **Studies have no mode of their own.** A study counts as external only if the strategy or the
  fitness function it uses is external.
- **Rule-based strategies and fitness functions aren't available yet.** The option is visible in
  both editors but permanently disabled. Rule-based **risk managers** are fully supported today.
- **External risk managers can't currently be saved through the editor** — see the caution above.
- **External strategies can't be promoted to a tracked portfolio** or added to a tracked basket.
- **You can't create a record, or change its mode, through Fintela's read-only Developer API** —
  the API you can access with a personal access key from your account settings to pull your
  strategies, fitness functions and results into your own tools. That API only lets you read
  records; strategies and fitness functions are read-only there, and risk managers aren't exposed
  through it at all. Creating and editing any of the three always happens inside the application.
