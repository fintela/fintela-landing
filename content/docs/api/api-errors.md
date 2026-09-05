---
title: Errors & status codes
section: API Reference
sectionOrder: 10
order: 9
published: true
updated: 2026-09-01
summary: What each kind of error from Fintela's Developer API means, why it happens, and how to handle it in your own integration.
keywords: errors, troubleshooting, rate limits, authentication, not found, retry, developer api, read-only, personal access key
---

When something goes wrong while you're pulling data through Fintela's Developer API: the
read only channel you use to bring your studies, strategies, trials, portfolios, and baskets into
your own tools, spreadsheets, or dashboards with a personal API key: you get back a clear,
consistent answer instead of a mysterious failure. This page walks through the kinds of errors
you'll run into, why each one happens, and what to do about it, so the integration you build (a
script, a dashboard, a scheduled job) fails gracefully instead of guessing. If you haven't set up
access yet, start with [API overview](/docs/api-overview) and
[Authentication & limits](/docs/api-authentication).

## Understanding an error response

### Reading the error category

Every error Fintela sends back has two parts: a short, stable category your integration can check
automatically, and a plain language description meant for a person reading a log: someone on your
team troubleshooting why a nightly pull didn't run, say. The categories you'll see are things like
"unauthorized," "not found," and "rate limited." There's no extra structure beyond that: no error
codes to look up in a separate table, no nested list of sub problems.

> [!TIP] Branch on the category, not the wording
> The plain language description is written for a human and can be reworded over time: two
> nearly identical situations today might read as slightly different sentences (one says "required,"
> another says "is required"). The category is the stable part of the contract. Write your
> integration's logic against the category, and save the description for your own logs.

### Some failures arrive without the usual detail

A handful of very basic problems are caught before Fintela gets far enough to build the usual
category plus description response: an id that isn't shaped like an id at all, or a web address
that doesn't match anything on the platform. In those cases you'll get a plain error instead of the
normal pair. It's still obvious something went wrong; there's just less detail attached to it.

> [!WARNING] A malformed request can look like a credentials problem
> Fintela checks the shape of your request before it checks who's making it. If you get a "your
> request doesn't look right" style error, that doesn't necessarily mean your key was accepted:
> don't read it as proof your credentials worked. Always double check your key separately if
> something isn't behaving the way you expect.

## Common causes of errors

### Invalid or incomplete request

A few practical rules trip this up more than anything else:

- **Filtering by a list of ids.** When you narrow a lookup down to specific studies, strategies, or
  fitness functions, each id in the list needs to be a plain numeric id: a typo or a non numeric
  value gets the whole request rejected before Fintela looks anything up.
- **Some summaries require you to say which studies you mean.** A few of the study level rollups:
  progress, health, status, and error summaries: need an explicit list of studies; leaving it
  blank isn't treated as "give me everything," because those summaries are meant to be checked
  against a specific set of runs you care about.
- **Blended metrics need weights that add up to one.** If you're pulling a metric that blends
  training and validation performance, the weights you supply have to sum to exactly 1: not
  approximately, and not left for Fintela to normalize for you.
- **Trial numbers can't be negative.** A trial's position within a study is always zero or higher.
- **Paging never needs an exact number.** Page sizes and offsets are automatically kept within
  sane bounds: an overly large page size is simply capped rather than rejected, so you don't need
  to guess the exact ceiling. Only a value that isn't a number at all (rather than one that's just
  too big) causes a real error.

### Authentication problems

Every authentication failure comes back the same way, generally for one of these reasons:

- You didn't send a key with the request at all.
- The key is wrong, or it's been revoked: from the outside, a key that never existed looks
  identical to one that used to work but was revoked, so recheck the key itself before assuming
  it was deliberately cut off.
- The key exists but isn't currently linked to an active organization or user. If you keep seeing
  this after confirming the key is current, that's worth a support ticket.

See [Authentication & limits](/docs/api-authentication) for where to find and manage your key.

> [!WARNING] Your key belongs in the request's credentials, not the web address
> Fintela only recognizes your key when it's sent the standard way: as a bearer token in the
> request's authorization header, the same convention almost every HTTP client and scripting
> language already supports. Appending it to the web address instead (something like
> `?api_key=...`) doesn't work: Fintela quietly ignores it, and you'll see a plain "missing key"
> error with no hint that a key was present at all. If an older example you're following uses this
> pattern, that's almost always why it's failing.

### Not found, or not yours to see

If you reference a study, trial, portfolio, or basket that doesn't exist: or that belongs to a
different organization than yours: you get a clear "not found" response. Fintela deliberately
doesn't distinguish between "never existed" and "exists, but it isn't yours" (more on why below),
so a typo and someone else's data look identical from where you're sitting.

When you're looking up a specific trial by study name and trial number, Fintela can still tell you
which half was wrong: a bad study name reports the study itself as not found, while a valid study
name with a trial number that was never run tells you the trial wasn't found within that study.
That distinction is useful for telling a typo apart from a run that simply hasn't happened yet.

> [!NOTE] Older "portfolio" references and current ones are separate id spaces
> Fintela used to expose trials under a "portfolios" label that's now retired in favor of the
> current trials and managed portfolios naming. An id from the old naming and an id from the
> current one can both look valid but point to two completely different things, so a "not found"
> under one tells you nothing about the other. See
> [Trials & portfolios](/docs/api-trials-portfolios) for the full picture and how to move off the
> legacy naming.

### The Developer API can't create or change anything

This channel is read only, so any attempt to create, update, or delete something: through it,
whether from a script, a no code tool, or by hand: is turned away outright, with nothing
partially applied. You'll get a plain rejection rather than any indication of what you were trying
to do.

> [!CAUTION] Make changes in the app, not through this channel
> Actions that draw on your organization's trading credits or actually move something: launching
> a new study, promoting a trial to a live portfolio, refreshing a basket: happen inside the
> Fintela app itself, where you see and confirm the cost before it happens. A handful of actions
> that used to be reachable through the Developer API have been removed entirely for this reason.
> See [Laboratory](/docs/laboratory) and [Live trading](/docs/live-trading) for where these live
> now.

### Referencing an id you don't have access to

A couple of lookups: pulling full details for a specific list of strategies or fitness
functions: check every id in your list before doing any work. If even one of them isn't
something your organization can see, the whole request fails; you don't get back the ones that
were valid.

> [!WARNING] One bad id fails the whole batch, on some calls but not others
> This is stricter than it might look at first: naming ten ids where one is unreadable gets you
> nothing, not "the nine you can see." If you only need each strategy's or fitness function's
> tunable parameters rather than the full record, that narrower lookup quietly skips ids it can't
> reach instead of failing the whole call: worth knowing if you're pulling a large batch and want
> partial results rather than an all or nothing outcome. See
> [Strategies](/docs/api-strategies) and [Fitness](/docs/api-fitness) for exactly which calls
> behave which way.

### Too many requests, too fast

Each organization shares one request budget, and going over it gets a request turned away rather
than queued or slowed down. If you see this, wait roughly a second before trying again: retrying
immediately just lands on the same limit and gets rejected again. The exact pace allowed, which
parts of the API enforce it today, and the habits that keep you well clear of it are all covered
in [Authentication & limits](/docs/api-authentication).

### A temporary problem on Fintela's side

Occasionally a request fails for a reason that has nothing to do with what you sent: a short lived
problem on Fintela's end. The message you get back is intentionally generic, so there's nothing
diagnostic to extract from it beyond "something went wrong, try again shortly." Retrying once
after a short pause clears most of these.

If it keeps happening on the same kind of request, it's often because that request is asking for a
lot at once: a very long list of ids, a large page size, or several extra detail sections in the
same call. Narrowing what you're asking for, or splitting it into a couple of smaller pulls, is
usually the fix. If it persists even after narrowing the request, that's worth a support ticket:
see below for what to include.

### Why you'll never see a "forbidden" error

Fintela never confirms that something exists but you're simply not allowed to see it: from the
outside, "doesn't exist" and "exists, but belongs to someone else" always look identical. This is
deliberate: it protects every customer's privacy equally, including yours. In practice, every
situation that might otherwise be a "forbidden" response comes back as one of the categories above
instead: a resource in another organization or one you can't reach reports as not found, an id
you can't read in a filter reports as not visible, and a revoked key reports as an authentication
problem.

If you ever do see a classic "forbidden" response calling Fintela's API, it isn't coming from
Fintela: check whether something in your own network (a proxy, VPN, or corporate firewall) is
intercepting the call before it reaches Fintela at all.

## Quick reference: error categories at a glance

| Category | Typical cause | What to do |
|---|---|---|
| Invalid request | Something about the request itself is malformed or incomplete: a bad id, a required filter left off, weights that don't add to 1 | Fix the request; it will keep failing the same way until you do |
| Authentication | Missing, invalid, or revoked personal API key | Check your key in account settings |
| Not found | The item doesn't exist, or belongs to a different organization | Confirm the id; there's nothing to retry |
| Not visible | An id in your filter list isn't something your organization can read | Remove or correct that id |
| Read only | You (or a tool) tried to create, change, or delete something | Make the change in the Fintela app instead |
| Rate limited | Your organization's request budget is used up for the moment | Wait about a second, then retry |
| Temporary error | A short lived problem on Fintela's side | Retry once; narrow the request if it keeps happening |

## Retrying and getting extra help

### When it's safe to retry automatically

Rate limited and temporary errors are worth a retry after a short pause: the situation genuinely
changes on its own. Invalid request, authentication, not found, and not visible errors won't: they
describe something about the request itself, and retrying without changing anything just repeats
the same failure (and eats into your rate limit in the process).

### If you're still calling a retired endpoint

Fintela occasionally retires an older way of asking for the same data in favor of a clearer
current one: the older trial naming described in
[Trials & portfolios](/docs/api-trials-portfolios) is the current example. While an old call still
works, every response it returns (success or error alike) is clearly flagged as deprecated, so a
well built integration can notice on its own and warn you it's time to move to the current version,
rather than you discovering it only when the old call is eventually turned off.

### Getting support for a problem that won't go away

Every response Fintela sends carries a unique identifier behind the scenes, even a generic
temporary error message. If you open a support ticket about a persistent problem, the most useful
things to include are roughly when the failed call happened and exactly what you were asking for:
that's usually enough for Fintela's team to pull up what actually happened on their end, even when
the error message you saw was deliberately generic.

## Handling errors in your integration

A few habits that make error handling in your integration boring, in the best way:

- **Check the category first**, and treat the plain language description as something you log, not
  something you parse for logic: its wording can change without notice.
- **Parse defensively.** A small number of very basic mistakes come back as a plain error rather
  than the usual category plus description pair, so don't assume every non success response has
  the same shape.
- **Treat "not found" and "not visible" as the same practical problem.** Either way, something you
  asked for isn't there for you to see, and the fix is the same: check your id.
- **Batch instead of looping.** Where a lookup supports a list of ids, one request for the whole
  list is faster and easier on your rate limit than one request per item: just remember that for
  a couple of specific lookups, one bad id in the list fails the whole batch (see above).
- **Build for polling, not pushing.** Fintela doesn't send you a live notification when something
  changes: your integration has to check in on a schedule. That means occasional rate limit and
  temporary errors are a normal part of a healthy polling loop, not a rare edge case, so handle
  them as routine rather than exceptional.

## Trial and study failures aren't request errors

If a specific trial fails while a study is running: a parameter combination that breaks a
strategy, say, or produces no valid trades: that's not a failed request. The study still
completes normally, and Fintela reports the failure as part of your results: a summary of what
went wrong and why, grouped so you can spot a pattern (for instance, a leverage setting that
consistently breaks a particular risk manager), alongside every failed trial's own parameters. A
study or live run that stops partway through works the same way: you'll see why in the results
you pull back, not in an error from the request that asked for them.

This distinction matters because it keeps two very different things separate: "Fintela couldn't
give me an answer" versus "the strategy Fintela ran didn't perform well." The first is what this
page covers; the second is exactly the kind of thing the platform exists to help you find. Full
details on reading trial and study results are in [Studies](/docs/api-studies).
