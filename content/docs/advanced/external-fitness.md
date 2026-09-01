---
title: External fitness
section: Configuration & Advanced
sectionOrder: 8
order: 5
published: true
updated: 2026-09-01
summary: Score every trial using scoring logic you write and host on your own systems, instead of inside Fintela.
keywords: external fitness, self-hosted scoring, custom fitness function, fitness parameters, timeout, security
---

An external fitness function lets you score every trial using logic that lives entirely on your
own systems, instead of writing it inside Fintela's editor. You keep full control over the
scoring model, its dependencies, and any private benchmarks or proprietary logic you'd rather not
expose — Fintela only needs to know where to reach your service and how long to wait for an
answer. Every time a trial needs a score, Fintela sends it the simulated trading results for that
period and reads back a single number.

## What you configure

Setting up an external fitness function only asks for three things: the web address of your
service, how long Fintela should wait for a reply, and how many trials it's allowed to score for
you at the same time. That's it — Fintela never asks for your code, your data, or any
credentials, and nothing about how your service works internally is ever transmitted to or
stored by Fintela.

Everything else you fill in — the function's name, its description, and the parameters you
declare — is just information Fintela uses to make the function selectable and configurable
inside a study. None of it reveals anything about your actual scoring logic.

This is the practical trade-off against [internal execution](/docs/execution-modes): with an
internal fitness function, you write your scoring logic as Python directly inside Fintela's
editor, and it runs inside Fintela. With an external one, Fintela never sees your logic at all —
the cost is that you're responsible for keeping your own service running, fast, and correct.

> [!NOTE] Your service only sees the simulated results, not the underlying market data
> An internal fitness function can also read the price data behind a study, plus anything
> produced by data sources you've attached to it. An external fitness function doesn't get any of
> that — it only receives the simulated trading results for the period being scored and the
> parameter values you've configured. If your scoring logic needs price history or other
> reference data, you'll need to supply it from your own systems.

## Setting up an external fitness function

Create the fitness function from the [Fitness Functions](/docs/fitness-functions) registry, then
choose **External** from the toggle at the top of the editor. A third option, **Rule-based**, is
shown but not yet available.

### The three settings

Once you choose External, the editor shows just three fields — there's no code editor, because
your logic doesn't live in Fintela:

| Field | What it's for | Default |
|---|---|---|
| **Endpoint** | The web address of your service. Required. | — |
| **Max Concurrency** | How many trials your service can be asked to score at the same time. | 4 |
| **Timeout (seconds)** | How long Fintela waits for your service to answer before giving up on that call. | 30 |

The address you enter is a base address — Fintela adds a fixed path to it when calling your
service, so a plain domain or path prefix is all you need to register.

If you enter an address starting with `http://` instead of `https://`, the editor shows a warning
that the request and the reply will travel unencrypted. It's only a warning — it won't stop you
from saving — but see [Plain http works, but isn't private](#plain-http-works-but-isnt-private)
below for what that actually costs you.

### Internal or external is a one-time choice

You choose Internal or External when you first create a fitness function, and it can't be changed
afterward — both options are locked once the function exists. If you want to move a scoring
approach from one execution mode to the other, create a new fitness function rather than trying
to convert an existing one.

### Declaring parameters

Parameters work the same way whether a fitness function is internal or external. Each one you
declare becomes a value you can tune, and it's passed to your service every time a trial is
scored.

| Field | What it's for |
|---|---|
| **Parameter name** | The label your service will receive this value under. |
| **Type** | Integer or Float — that's the full list; there's no text or true/false parameter for a fitness function. |
| **Test value** | A representative value used when you test the endpoint, and pre-filled if you later promote this function into a portfolio metric. It isn't used to guide the search itself. |
| **Description** | Optional notes for yourself or your team. |

Unlike strategy parameters, a fitness parameter has no range, step, or set of choices — just a
name, a type, a test value, and an optional description. Within a study, the value for each
parameter is fixed: it's set once when the study is created and used unchanged for every trial.
As the study builder puts it, objective parameters are constants — the search explores your
strategy's parameters, never your fitness function's.

When you create or edit a study, Fintela checks the parameter values you've set against what the
fitness function declares, and stops you if they don't line up — for example, if a parameter is
missing, an extra one is supplied, or a value isn't the right kind of number for its declared
type.

## Which addresses Fintela will call

To protect the platform and everyone using it, Fintela only calls addresses that are genuinely
public on the internet — never a private network, an internal address, or anything on your own
local machine. This check happens twice: once when you save the fitness function, and again every
time your service is actually about to be called. It applies the same way to
[external strategies](/docs/external-strategies).

### Checked when you save

When you save an external fitness function, Fintela checks that the address is well-formed and
points somewhere public — without making a network call to it, so an address that isn't live yet
can still be saved. It's rejected if:

- it contains stray spaces or unusual characters
- it isn't a valid web address at all
- it uses a scheme other than `http://` or `https://`
- it has no host at all
- the host is `localhost` (or a variant of it)
- the host is a raw IP address that isn't publicly reachable

### Checked again every time it's used

Right before Fintela actually calls your service, it re-checks where that address currently
points — including every destination it could resolve to. If any of them turns out to be a
private, internal, or otherwise non-public address, the call is refused before it's made. An
address that points to more than one destination, some public and some not, is refused too.

An address that can't be resolved to anything at all is refused with a message asking you to
check the spelling and that its DNS is set up correctly.

Fintela never follows redirects, so a public address can't be used to bounce a call toward an
internal target.

### Plain http works, but isn't private

Both checks above accept `http://` and `https://` equally — encryption isn't part of the address
check, and requiring `https://` would lock out any service reachable only by a bare public IP
address. What's enforced is that the address is public, not that it's encrypted.

That said, the choice has a real cost with plain `http://`: the entire simulated trading result
you're being asked to score — positions, trades, performance metrics — travels across the network
unencrypted, and so does the score you send back. It's your service and your call to make, but
make it knowingly.

## What your service receives

Every time your service is called, it receives two things: the parameter values you configured
for the study, and the simulated trading results for the specific period being scored.

### The trading results for the period

| What's included | What it tells you |
|---|---|
| Equity | The account's value, day by day, across the window. |
| Holdings | What positions were open on each day — ticker, long or short, and how much of the portfolio each represents. |
| Orders | Every order placed inside the window. |
| Trades | Completed and still-open trades, with entry and exit details, size, return, and duration. |
| Metrics | Performance metrics already computed by Fintela for exactly this window — see below. |

There's one windowing rule worth knowing well:

> [!CAUTION] Trades that straddle the edge of a window are left out, not trimmed
> A trade only appears in the results if it started inside the window, and either is still open
> or also closed inside the window. A position that was open before the window started, or that
> closes after it ends, is left out of the list entirely — it isn't clipped to fit. If your
> scoring logic depends on trades, a short evaluation window can legitimately hand you no trades
> at all, so make sure your logic handles that gracefully.

Performance metrics like maximum drawdown are handed to you already calculated — read them
directly rather than recomputing them from the equity curve, since that's the same number Fintela
displays next to your score.

### The performance metrics included

The metrics you receive cover the same categories shown throughout the platform:

| Category | Examples |
|---|---|
| Return | Total return, annualized growth rate |
| Risk | Volatility, maximum drawdown, value-at-risk |
| Risk-adjusted | Sharpe ratio, Sortino ratio, Calmar ratio, profit factor |
| Distribution | Win rate, payoff ratio, skewness |
| Trade-level | Trade win rate, average trade duration, expectancy |

If the study has a benchmark attached, you also receive benchmark-relative metrics — beta, alpha,
correlation, and similar comparisons — before your service is even called. Without a benchmark,
those are simply left out rather than sent as empty values.

> [!TIP] Build in sensible defaults
> The sample data used to test your endpoint when you save it is a reasonable stand-in for a real
> trading period, but it won't cover every metric or edge case a live study will produce. Have
> your scoring logic fall back gracefully — with a sensible default — for any value that might
> occasionally be missing, rather than assuming every field will always be present.

## What your service needs to return

Your service should answer with a single number — your fitness score — under the label
`fitness`. Any other information you include in the reply is simply ignored; only that one value
is read.

> [!CAUTION] The score must be labeled `fitness`, exactly
> If your reply uses a different label — `score`, `value`, `result`, or anything else — Fintela
> won't recognize it, and testing the endpoint will fail with a message telling you the reply
> needs a `fitness` value.

When you test the endpoint before saving, Fintela also checks that the value you return is
actually a number, so make sure the test values you declare for your parameters produce a real
score rather than triggering an edge case — see
[When a period can't be scored](#when-a-period-cant-be-scored) for what to do instead when a
period genuinely has no valid score.

## How your score is used

For every trial, Fintela calls your service up to four times — once for the training window, once
for validation, once for the whole equity curve, and once more for an out-of-sample window if the
study has one.

| Call | Covers |
|---|---|
| Train | The portion of history used to search for good parameters. |
| Validation | A separate window used to sanity-check results. |
| Overall | The full simulated period. |
| Out-of-sample | A later window the search never sees, if the study defines one. |

Only the **train** score actually steers the search — it's the number the optimizer is trying to
maximize or minimize. The other three are still calculated, recorded, and shown on the study and
portfolio pages, but they don't influence which parameters get tried next.

Whether the optimizer is trying to maximize or minimize your score is a setting on the study
itself, not on the fitness function — you choose it once, in the study builder, when the study is
created, and it can't be changed afterward. If you don't set it explicitly, Fintela defaults to
maximizing for an external fitness function. A study optimizes for exactly one objective; there's
no way to balance several fitness functions against each other in the same search.

### When a period can't be scored

Sometimes a period genuinely can't be scored — an empty window, a portfolio with no trades, a
metric your logic can't compute. Fintela has a defined way to handle that:

| Situation | What happens |
|---|---|
| The train, validation, or overall score isn't a valid number | The trial is discarded as unscoreable, and the study continues with the rest. |
| Only the out-of-sample score isn't a valid number | Recorded as missing; the trial still completes normally. |
| Your service raises an error only during the out-of-sample call | The out-of-sample score is recorded as missing; the trial still completes. |

A discarded trial shows up in the study's errors panel labeled **Fitness wasn't a number**, with a
note to guard against dividing by zero and against empty periods.

> [!TIP] When a period genuinely can't be scored, say so — don't fake a number
> Returning "not a number" is the correct, supported way to tell Fintela a configuration isn't
> scoreable: the trial is discarded cleanly and shown as such. Returning an artificially huge or
> tiny number instead makes an unscoreable trial look comparable to real ones, which quietly
> distorts the search.

## Testing your endpoint before you save

Before saving, Fintela tests your service for you: it makes one call using sample simulated data
and the test values you declared for each parameter, and only opens the save dialog once that
call succeeds. You'll need a test value on every parameter you've declared before you can run it.

Unlike an external strategy, an external fitness function isn't checked for anything related to
timing or look-ahead — there's nothing to check, since it's scoring a period that's already
finished simulating, not making trading decisions inside it.

### Why validation might fail

| What went wrong | What you'll see |
|---|---|
| The address isn't allowed | The address-check message described above. |
| Your service returned an error | The status your service returned, plus the start of its response. |
| Your service couldn't be reached at all | A specific message — an expired certificate, a DNS problem, a refused connection, or a timeout. |
| The reply wasn't valid JSON | A message saying the response isn't valid JSON. |
| The reply had no `fitness` value | A message saying the response needs a `fitness` key. |
| The `fitness` value wasn't a number | A message saying `fitness` must be a number. |

A validation that passes hands back the actual score your service returned — so a successful test
is proof that the address, the format, and the number your logic produces all check out.

> [!NOTE] Saving doesn't require passing a fresh test
> Internal fitness functions can't be saved without a fresh, matching validation. External ones
> aren't held to that — the editor still runs the test before saving in the normal flow, but a
> save made another way, such as through your own tooling against Fintela's API, only has to pass
> the address check above.

## When Fintela calls your service

Your service can be called from a few different places in the product, each with its own rhythm:

| When | How often |
|---|---|
| You press Save or test the endpoint in the editor | Once per test. |
| You run **Run a backtest** from the Fitness Functions registry | Once, over the whole period you're testing against. |
| A study is running | Up to four times per trial, as described above. |
| A live portfolio updates | A couple of times per update — the recent-performance window and the overall one. |
| A metrics run, after you've promoted this function into a portfolio metric | Once per portfolio and stage being recalculated. |

Running a backtest from the registry uses a token, the same way other on-demand runs do — see
[Tokens and billing](/docs/tokens-and-billing). Its result is labeled **Fitness Score** on the
run's result card.

For a live portfolio, a failed call to your service isn't treated as fatal — that stage's score is
simply recorded as missing and the update continues. Live portfolios also always use the current
version of your fitness function, not whatever version the study was originally built with, so if
you update your service's address, the change takes effect on the portfolio's next update.

### Keeping it reliable

Fintela retries a failed call to your service a small number of times before giving up on that
particular scoring request, but a request that's slow to answer — rather than one that fails
outright — generally isn't retried, to avoid piling more load onto a service that's already
struggling. The **Timeout** you configure applies to studies, live portfolios, and backtest runs;
testing the endpoint when you save always uses a fixed 30-second limit regardless of what you've
set.

Keep your service running continuously with enough spare capacity to answer more than one request
at a time — an endpoint that's only up occasionally, or that can only handle one request before
the next has to queue, will show up as failed or slow trials during a study.

## Setting Max Concurrency

**Max Concurrency** isn't about how many network connections your service can technically hold
open — it's the number of trials Fintela is allowed to send your service at the same time during
a study.

| Situation | Concurrency used |
|---|---|
| A study has no external components at all | Not relevant — this setting isn't used. |
| Only the fitness function is external | Your fitness function's Max Concurrency. |
| Both the strategy and fitness function are external, on different services | Whichever of the two is lower. |
| Both are external and point at the same service | Whichever is lower, split in half (rounded down, minimum of 1) — since one service is now handling both jobs at once. |

There is also a practical ceiling on how much parallelism any single study can use, so setting Max
Concurrency far above what your service can actually handle buys nothing — it only risks a burst
of simultaneous requests your service can't keep up with.

> [!TIP] Size it to your service, not to your ambitions
> Every parallel worker running the study holds one request open against your service at a time.
> Setting Max Concurrency higher than your service can actually accept just turns into refused
> connections and failed trials. Make sure your service can handle more than one request at once,
> then set this to what it can comfortably sustain.

## How failures show up during a study

A study never retries a trial on its own — once Fintela's own retries against your service are
exhausted, whatever went wrong is recorded against that trial, and the study moves on to the
rest. Each failed trial carries a specific reason you can read in the study's errors panel:

| Situation | What you'll see |
|---|---|
| Your address isn't public and reachable | A message explaining Fintela can only call publicly reachable addresses, and asking you to publish your service on one and relaunch. |
| Your service refused the connection | A message telling you it wasn't accepting requests at that moment — keep it running continuously with enough capacity. |
| Your service accepted the request but didn't answer in time | A message suggesting you make it faster, add capacity, or raise the timeout. |
| Fintela couldn't reach your service at all in time | A message suggesting you check it's online, add capacity, or raise the timeout. |
| The connection dropped mid-request | A message asking you to keep connections open a bit longer on your side. |
| Your service returned an error of its own | A message pointing you to your own service's logs. |
| Your service rejected the request | A message asking you to check the address and whatever your service expects from the request. |
| Your service replied in the wrong shape | A message saying the reply wasn't in the expected format. |
| Your service returned "not a number" | The message described under [When a period can't be scored](#when-a-period-cant-be-scored). |

If your address isn't reachable at all, Fintela catches that once, up front, when the study is
being set up — so a bad address fails the study clearly and immediately, instead of quietly
failing every single trial one by one.

> [!NOTE] The generic wrong-shape message is shared with strategies
> If your service replies in the wrong shape, the general explanation shown may reference a
> "signal," which is the term used for external strategies. For a fitness function, the specific
> reason recorded on the trial — mentioning `fitness` — is the one that actually applies.

## Authentication and security

Fintela sends your service no credentials of any kind — no API key, no login header, no signed
request, no shared secret. There's no field for one in the setup, either; the only configuration
stored is the address, the timeout, and the concurrency limit described earlier.

The one protection you have is the address itself: if you register your service at a
hard-to-guess address rather than a predictable one, that address stays intact in every call
Fintela makes to it.

If your service requires its own authentication and rejects unauthenticated calls, every trial
will fail — Fintela has no way to satisfy a login requirement, so your service needs to accept
calls from Fintela without one.

> [!WARNING] Plain http sends everything in the clear
> On an `http://` address, the entire simulated result you're being asked to score — every
> position, every trade, every metric — crosses the network unencrypted, and so does the score
> you send back. That's a decision about your own service's security, but make it deliberately.

## Building your service

Turning your scoring logic into something Fintela can call is normally a short piece of
engineering work for whoever manages your infrastructure — it just needs to accept the trading
results described above and answer with a `fitness` number. If you or your team are building it
yourselves, the technical integration guides for [Python · FastAPI](/docs/python-fastapi) and
[Node.js · Express](/docs/node-express) walk through exactly what the service needs to do, and
the [Fitness API](/docs/api-fitness) and [Error reference](/docs/api-errors) pages cover the full
technical contract for registering and calling a fitness function directly.

## Limitations to know about

A few things are only available to fitness functions you write inside Fintela's own editor
(internal execution), not to external ones:

| Not available externally | Why |
|---|---|
| The underlying price data | An external service only receives the simulated trading results and your parameters — never the raw market data behind the study. |
| Extra data sources you've attached | The Data Sources section still appears in the editor, but nothing it produces is sent to an external service — only the simulated results are. |
| Fintela's in-editor code editor and live validation | There's no code on Fintela's side to edit or validate — your logic lives entirely on your own service. |
| The sample-output preview | Only available for internal fitness functions; external validation just shows you the score your service returned. |
| Restoring an older version into the editor | Versions are still recorded for external fitness functions, but restoring a saved version back into the editor is only offered for internal ones. |
| A dedicated health check before going live | Only external strategies get checked with a dedicated health probe before a live update. A live portfolio calls your fitness service directly. |
| Ranges, bounds, or multiple-choice parameters | A fitness parameter is just a name, a type, an optional description, and a test value — and its value stays fixed for the whole study. |
| Rule-based (declarative) fitness functions | Not available yet. |

External execution isn't unique to fitness functions — see
[Execution modes](/docs/execution-modes) for the full picture across the platform,
[External strategies](/docs/external-strategies) for how the same idea works for trading logic,
and [Fitness Functions](/docs/fitness-functions) for the registry itself.
