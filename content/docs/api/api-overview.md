---
title: API overview
section: API Reference
sectionOrder: 10
order: 1
published: true
updated: 2026-09-08
summary: What the Fintela Developer API lets you do, how to connect to it, and the ground rules for pulling your results into your own tools.
keywords: api, developer api, read-only, personal access key, integrations, dashboards, export results, rate limits, automation
---

The Fintela Developer API lets you securely pull your studies, strategies, fitness functions,
trials, portfolios, and Portfolio Group activity out of Fintela and into your own systems,
spreadsheets, or dashboards. You still build and run everything inside the Fintela app itself:
this channel exists purely so you, or a developer working on your behalf, can read back your
results and plug them into whatever reporting or monitoring you already rely on.

## Read only access

This channel is for looking things up, not for making things happen. You can use it to pull back
studies, strategies, fitness functions, trials, and portfolios that already exist: you cannot use
it to start a new optimization run, activate a strategy, or promote a trial to a live, daily updated
portfolio. Those actions all draw on your organization's tokens (see
[Tokens & Billing](/docs/tokens-and-billing)), and Fintela wants you to see and confirm that cost
inside the app before it happens, not have it triggered silently through an integration.

A handful of actions that used to be reachable this way: such as promoting a trial to a live
portfolio, turning on daily updates, or refreshing a Portfolio Group: have since been removed from
this channel entirely. Those workflows now live only in the app.

> [!WARNING] You can't change anything through this channel
> Any request that tries to create, update, or delete something is refused outright: it is never
> partially applied. If you're looking to launch a study, promote a trial, or manage a Portfolio
> Group, do it from inside the Fintela app.

## Getting connected

This channel has its own web address, separate from the app you sign into: you'll find it on the
API Documentation page in your account. You authenticate every request with a personal access key,
which is available in the same place as soon as you look for it: there's no separate setup step. See
[Authentication & limits](/docs/api-authentication) for where to find it, how to manage it, and
exactly what it can reach.

> [!CAUTION] Your key has one correct place to go
> Pasting your access key directly into a request's web address instead of supplying it the proper
> way won't authenticate you: and it fails silently, with a plain authorization error rather than
> a hint about what went wrong. If older examples you're following stop working, this is usually why.

You can also check at any time that the connection itself is live and responding, independent of
any real data you're asking for: handy when you're first wiring up a script or troubleshooting a
scheduled job that has stopped running.

## How your results come back to you

Every successful response has the same standard wrapper around it, whether you're asking for a
single trial or a whole batch of studies: what you actually asked for always sits one level inside
it, under the same name every time. The one exception is the service check described above, which
answers directly instead.

Inside that wrapper, results come back in one of three shapes, and which one you get depends on the
lookup rather than on how you called it:

- **A single item** comes back as one object: one trial, one managed portfolio, one basket.
- **A straightforward list** comes back as a list: your trials, your managed portfolios, your
  baskets, your asset groups, a version history, an operation's order log.
- **A batch lookup keyed by id** comes back as a lookup table rather than a list, with the id you
  asked about as the key. This is how every "tell me about these specific studies" call answers
  (configuration, progress, health, status, errors, parameter importance, and both optimization
  curves), and it's also how the strategy and fitness listings answer. Read the result by looking
  up each id you asked for, rather than by walking a list in order.

> [!NOTE] A lookup table has no guaranteed order
> Where a result is keyed by id, don't rely on the order the entries come back in: it can vary
> between calls. Sort on your end if your tool needs a stable order.

When something goes wrong, you get back a plain language explanation of what happened, plus a short
label your own tools can check automatically without having to parse a sentence. The full set of
labels, and what each one means, is on [Errors & status codes](/docs/api-errors). If Fintela's own
systems are having a problem on their end, you'll get a generic apology rather than a raw technical
error: there's nothing useful to extract from that case beyond "try again shortly."

Every response, successful or not, also carries a reference identifying that particular call. It's
worth logging: quoting it in a support ticket points Fintela at the exact request that went wrong,
even when the message you saw was deliberately generic.

> [!NOTE] You'll never be able to tell whether something exists in someone else's account
> If you request a resource you don't have access to, you get the same "not found" response you'd
> get if it simply didn't exist at all. Fintela never reveals whether another organization's data
> exists: this is deliberate, and it protects every customer's privacy equally.

## Finding and filtering what you need

A few conventions hold across most of the reference, and knowing them up front will save you some
trial and error:

- **Narrowing a list.** Several lookups let you hand over a short list of the specific studies,
  strategies, or fitness functions you care about, instead of pulling everything and filtering it
  yourself afterward. You can also narrow trials and portfolios down to a single study by name.
- **Extra detail, on request.** By default you get a concise summary. Heavier detail: a full
  equity curve, complete holdings, or order history: is available whenever you ask for it, so the
  common case stays fast and light, and you only pay the size cost when you actually want the
  detail. Asking **replaces** the default rather than adding to it, so if you want the default
  piece as well, name it alongside whatever else you're asking for.
- **Paging through large results.** A few lookups: mainly a Portfolio Group's full trade,
  allocation, and daily results history: can grow large over time, so they're delivered in
  batches rather than all at once. You page through them a batch at a time until you reach the end,
  so an active account never overwhelms whatever you're building.
- **Newest first, with known exceptions.** Most lists come back with the most recent item first,
  so checking the top of a list is usually the fastest way to see what's changed. Three places
  read differently, and it's worth knowing which: the list of the broker connections a Portfolio
  Group is trading through reads **oldest first**, so a new one appears at the bottom; a
  portfolio's own day by day data (equity curve, holdings, order log) reads in **date order**,
  oldest to newest, as you'd expect of anything measured over time; and the weight history for one
  of those connections is **grouped by member** rather than sorted purely by time. Your list of
  Portfolio Groups is also sorted by when each was last *changed*, not when it was created.
- **Optional details simply don't appear.** When an optional piece of information doesn't apply:
  for example, a trial that hasn't been promoted to a live portfolio yet has no live portfolio
  reference: it's left out of the response rather than shown as an empty placeholder. Check
  whether a field showed up at all, rather than assuming it's always there.
- **Dates aren't formatted identically everywhere, yet.** Timestamps across the reference are
  written in a couple of different (though always unambiguous) styles depending on which kind of
  result you're looking at. If you're parsing dates yourself, use a flexible date parser rather than
  assuming one exact pattern everywhere.

## A note on naming

As you move through the rest of this reference, you'll notice a couple of places where the same
kind of information can be reached two different ways: kept side by side so that anything you or
someone else built earlier keeps working, while newer parts of the reference use clearer naming
going forward.

The one worth knowing before you build anything: one older way of listing "portfolios" only ever
returns the results of your strategy trials: it does not include your live, daily updated
portfolios at all. If what you're actually after is the portfolios you've promoted to live trading,
use the newer [Trials & portfolios](/docs/api-trials-portfolios) reference instead, where trial
results and live portfolios are clearly separated from each other.

> [!CAUTION] The same looking id doesn't mean the same thing in both places
> An identifying number for a trial and an identifying number for a live managed portfolio are
> drawn from two completely separate sets: the same number in each place points to two unrelated
> things. The reliable way to tell whether a given trial has been promoted to a live portfolio is
> to check whether it carries a linked live portfolio reference at all, not to compare ids across
> the two.

Separately, both Strategies and Fitness functions keep a full edit history, so you can look back
through every saved revision of your logic over time: see [Strategies](/docs/api-strategies) and
[Fitness](/docs/api-fitness).

## A full technical reference

If you or a developer working with you wants to build custom tooling against this API, Fintela
publishes a complete, always current technical reference describing every result and every field
it can contain. It's generated directly from the live API itself, so it can never drift out of
date the way a hand written reference might, and standard developer tools can use it to generate
client code in whatever programming language you're working in.

> [!TIP] Generated client code wraps results one layer deeper than you'd expect
> If you generate client code from the technical reference, remember that the actual data always
> arrives nested one layer inside the standard response shape described above. Most code generators
> won't unwrap that extra layer for you automatically, so plan for it.

## No push notifications: check in on your schedule

Fintela won't reach out to your systems when something changes. There are no notifications, no live
event stream, and nothing that calls your infrastructure: if you want to know what's changed, you
check back on a schedule that makes sense for what you're tracking:

- To follow a running Study's progress, check back periodically using
  [Studies](/docs/api-studies): match your check in interval to how long your studies typically
  take to run.
- To notice when a trial has been promoted to a live portfolio, periodically re list your trials and
  watch for the live portfolio reference to appear on one.
- To follow live trading activity, check in on a Portfolio Group's freshness and activity history:
  see [Baskets](/docs/api-baskets).

Keep your check in frequency comfortably inside your usage limits, and avoid re fetching what
hasn't changed. Since most lists come back newest first, the top of the response is usually enough
to tell whether anything new has happened: activity history is the one exception, and reads
oldest first, so watch the bottom of that one instead.

## Usage limits

To keep the platform responsive for every customer, your organization's use of this channel is
capped to a generous request rate, shared across every access key your organization has issued:
comfortably more than a normal dashboard or scheduled job needs. If you do exceed it, a request is
briefly refused rather than queued or slowed down, and the response tells you how long to wait
before trying again; back off and retry, and build your integration to handle an occasional busy
response gracefully rather than treating it as a failure. Exact numbers, and the parts of the
reference where the cap is actually enforced today, are on
[Authentication & limits](/docs/api-authentication).

## Putting it together

As an example, say you want to pull one specific trial into your own dashboard, complete with its
full equity curve and performance metrics, in a single request. You'd get back everything you need
at once: which study it belongs to, when it was created, whether it's since been promoted to a
live portfolio, its day by day equity curve, and its validation performance figures such as Sharpe
ratio and CAGR: without having to make several separate calls to piece it together yourself.

If your access key were invalid or had been revoked, that same request would instead come back with
a clear, plain language message telling you the key wasn't accepted, rather than any trial data.

## Where each resource lives

| Page | What you'll find there |
|---|---|
| [Authentication & limits](/docs/api-authentication) | Where to find and manage your access key, and the usage limits that apply to it |
| [Strategies](/docs/api-strategies) | Strategy listings, their configuration, and edit history |
| [Studies](/docs/api-studies) | Study listings, progress, health, status, errors, and optimization history |
| [Trials & portfolios](/docs/api-trials-portfolios) | Every trial produced by your studies, plus the live portfolios promoted from them |
| [Baskets](/docs/api-baskets) | Portfolio Group details, freshness, its combined track record, and the full history of trades, allocations, and daily results |
| [Fitness](/docs/api-fitness) | Fitness function listings, their configuration, and edit history |
| [Asset groups](/docs/api-asset-groups) | Your saved Asset Group definitions |
| [Errors & status codes](/docs/api-errors) | A full plain language reference for every message you might receive |

One naming note worth remembering as you read those pages: what you manage as Portfolio Groups
inside the app is covered under the heading Baskets in this reference: the same feature, just an
older name that stuck around in this corner of the documentation.
