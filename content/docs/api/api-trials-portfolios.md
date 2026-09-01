---
title: Trials & portfolios
section: API Reference
sectionOrder: 10
order: 5
published: true
updated: 2026-09-01
summary: Pull your optimization trial results and the managed portfolios promoted from them into your own tools with Fintela's read-only API.
keywords: developer API, trials, managed portfolios, promoted portfolios, equity curve, holdings, personal access key, read-only, deprecated
---

This page covers how to pull two kinds of results out of Fintela and into your own systems, reports,
or dashboards: **trials** (every result your optimization studies have produced) and **managed
portfolios** (the durable, daily-updating copies you get when you promote a trial). Everything here
is read-only — nothing you do with these calls can launch a study, promote a trial, or change
anything in your account. Actions that spend compute or change what's running stay inside the
Fintela app itself.

## Trials and managed portfolios: two different things with a shared history

It's easy to conflate these two, especially since an older part of the platform used the word
"portfolios" to mean something else entirely. Before pulling any data, it helps to be clear on which
one you actually want:

| Resource | What it gives you | How you'd describe it |
|---|---|---|
| Trials | One frozen result per trial a study evaluated | The raw output of your optimization runs — every parameter set your study tried, and how it performed |
| Managed portfolios | The durable, live copies created when you promote a trial | The portfolios you've decided are worth running for real, updated day by day |

A trial is a snapshot: it never changes once your study finished evaluating it. A managed portfolio
is the opposite — it's the thing you get when you decide a trial is good enough to run going forward,
and it keeps moving as new trading days go by (see [promoted portfolios](/docs/promoted-portfolios)
for what promotion actually does).

> [!CAUTION] Don't confuse a trial's id with a managed portfolio's id
> Trials and managed portfolios are numbered independently of each other, so the same id can point to
> two completely unrelated things depending on which one you ask for. Pulling a trial by id and
> pulling a managed portfolio by the same id will both happily return data — neither request will
> warn you that you may have meant the other one. If you're not sure which you want, remember: a
> trial is a fixed result from a study; a managed portfolio is something you promoted and is running
> live.

### How promotion links them together

Once you promote a trial in the app, the two records stay connected in both directions, so your
integration can move between them without guessing:

- A trial that's been promoted carries a reference to its managed portfolio. A trial that's never
  been promoted simply doesn't carry that reference at all — so check for its presence rather than
  assuming it will be empty or zero.
- A managed portfolio always carries a reference back to the trial it was promoted from — even if the
  study that produced that trial has since been deleted. The managed portfolio keeps running on its
  own promotion-time snapshot regardless; deleting the source study doesn't touch anything you've
  already promoted.

So if you're looking at a trial and it shows a link to a managed portfolio, you can follow that link
to see its live, day-by-day performance. And if you're looking at a managed portfolio, you can follow
its link back to the exact trial — parameters, backtest, all of it — that it came from.

> [!NOTE] Promotion itself happens in the app, not through this page
> Promoting a trial copies its data into a new managed portfolio and turns on daily updates, which is
> ongoing billable compute — so it's a deliberate action you take in the Fintela app, not something
> triggered through the read-only calls covered here. This page only lets you read the results
> afterward. See [promoted portfolios](/docs/promoted-portfolios) for how promotion works.

## The old "portfolios" naming (deprecated)

Before the current naming settled, trials were exposed under the name "portfolios" — which is
confusing, because it's easy to mistake for managed portfolios (the actual promoted, live-trading
kind). If you or your team built an integration a while back that pulls "portfolios" and gets back
things that look like trial results (parameters, a single fixed backtest, no day-by-day trading
since), that's this older naming. It still works today and returns the same underlying trial data —
it's simply the legacy name for the same information, and it's on its way out.

Every response you get from a call under the old naming is clearly marked as deprecated, so any
tooling you have can detect it automatically and flag it for you. See
[Moving off the legacy portfolio naming](#moving-off-the-legacy-portfolio-naming) below when you're
ready to update your integration.

## Choosing what to bring back: the include option

When you pull the full detail for a single trial or a single managed portfolio, you choose which
extra pieces of data to bring back. The basic identifying fields always come back; each additional
piece you ask for adds more to the response, so it's worth asking only for what you'll actually use —
a full holdings history is a lot bigger than a handful of performance numbers.

On a trial, you can choose from:

| Option | What you get |
|---|---|
| Metrics (the default) | Performance figures broken out by evaluation stage — see below |
| Equity curve | The trial's simulated portfolio value, day by day |
| Holdings | What the trial held each day, including which positions were long and which were short |
| Parameters | The exact parameter values this trial evaluated |

On a managed portfolio, you can choose from:

| Option | What you get |
|---|---|
| Equity curve | The full daily value series — reaching back to the original backtest, not just since it went live (more on this below) |
| Holdings | What's currently held, day by day, with position size and long/short direction shown separately |
| Orders | The trade log — every order placed, oldest first |

There's no metrics or parameters option for a managed portfolio, because a managed portfolio isn't a
separate optimization result — it doesn't have its own metrics to look up. If you want performance
figures for a managed portfolio, read the metrics of the trial it was promoted from, or work them out
yourself from its equity curve.

> [!WARNING] Asking for extra data replaces the default — it doesn't add to it
> On a trial, leaving this choice blank gives you performance metrics automatically. As soon as you
> explicitly ask for something — say, the equity curve — you get exactly what you asked for and
> nothing else, including no metrics. If you still want metrics alongside whatever else you're
> pulling, ask for it explicitly too.

## Getting access, limits, and staying up to date

Everything in [Authentication & limits](/docs/api-authentication) applies here. A few things worth
calling out specifically for trials and managed portfolios:

- You'll need a personal access key from your account settings to pull any of this data. Because the
  whole thing is read-only, a key can never accidentally launch a study, promote a trial, or change
  anything in your account — the worst it can do is let someone read data they shouldn't.
- A key isn't limited to a subset of your data — it can read everything your organization can see, so
  keep it as carefully as you would a password.
- Requests are capped to a modest rate, shared across every key your organization has issued, so that
  heavy pulls from one integration don't slow the platform down for everyone else. If you send a burst
  of requests and get turned away, that's the signal to slow down and try again shortly after — it's
  not an error in your setup.
- This cap currently applies to trials, managed portfolios, and a few other read-only resources; some
  other parts of the read-only API aren't capped as tightly today. Build your integration to behave
  well regardless, rather than relying on that difference.

> [!WARNING] There's no notification system — you check back yourself
> Fintela doesn't push anything to you when a study finishes or a managed portfolio advances another
> trading day. If your integration needs to stay current, it needs to check back periodically on its
> own schedule, comfortably within the request cap above, rather than waiting for a signal that will
> never come.

## Pulling your list of trials

This is your starting point: every trial your studies have produced, most recent first, optionally
narrowed down to a single study. Use it to browse what your studies have turned up, then pull the
full detail for the ones worth a closer look.

What comes back for each trial:

| Field | What it tells you |
|---|---|
| Trial reference | The id you'll use to pull this trial's full detail |
| Study | Which study produced this trial (you'll see its name, however you filtered) |
| Trial number | Its position within that study — unique per study |
| Created | When the trial was evaluated |
| Managed portfolio link | Present only if this trial has been promoted; absent otherwise |

You can narrow the list to one study by name — either the display name you gave it or its permanent
study key both work. Filtering by a name that doesn't match anything simply returns an empty list
rather than an error.

## Pulling one trial's full detail

Pull everything about a single trial by its reference, choosing which extra pieces to include (see
[Choosing what to bring back](#choosing-what-to-bring-back-the-include-option) above).

Performance metrics are broken out by evaluation stage: training, validation, out-of-sample, and
real-life performance, plus an overall figure that summarizes across all of them. Not every stage
will have data for every trial, and that's expected — a stage with nothing to show simply comes back
empty rather than missing. See [metrics reference](/docs/metrics-reference) for what each figure
means.

A trial's holdings show short positions as negative values and long positions as positive ones, so
you can read the direction directly off the number without a separate flag.

Parameter values come back exactly as the trial used them — a number stays a number, and anything
categorical (like a choice of indicator type) comes back as its readable label rather than an
internal code.

## Looking up a trial by study and trial number

If you already know which study and which trial number you want — from a report, from the app's
optimization history, or from a colleague — you can go straight to that trial without listing
everything first. This returns exactly the same detail as pulling a trial by its reference, and
supports the same choice of extra data described above.

This is convenient any time you're working from a reference you already have rather than browsing —
for example, turning a trial number mentioned in a study review into a full pull of its metrics and
equity curve.

If either half of what you gave doesn't match — an unknown study, or a trial number that doesn't
exist within an otherwise valid study — the message you get back tells you clearly which one was
wrong, so you don't have to guess which part of your reference to fix.

## Pulling your list of managed portfolios

Every managed portfolio in your organization, most recently promoted first. What comes back for each
one:

| Field | What it tells you |
|---|---|
| Managed portfolio reference | The id you'll use to pull this portfolio's full detail, and the same id [portfolio groups](/docs/portfolio-groups) use when listing their members |
| Name | The name it was given at promotion time |
| Source trial | The trial it was promoted from — present even if that trial's study has since been deleted |
| Daily updates | Whether it's currently advancing day by day |
| Promoted | When it was promoted |

## Pulling one managed portfolio's detail

Unlike a trial, pulling a managed portfolio's basic detail gives you just the summary fields above by
default — you have to explicitly ask for the equity curve, holdings, or order log to get any of them.

A few things worth knowing about what comes back:

- The **equity curve** doesn't start on the day it was promoted — promotion copies in the trial's
  whole backtest history first, so the series reaches back to when the original trial's simulation
  began, then continues day by day for real from the promotion date onward.
- **Holdings** are shown a little differently here than on a trial: instead of a single signed number,
  you get a position size (always a plain, unsigned weight) and a separate long/short indicator. The
  same short position that shows up as a negative number on a trial shows up as a positive weight plus
  a "short" flag on a managed portfolio — convert deliberately if you're comparing the two.
- The **order log** is oldest first, and reaches back before the promotion date too, for the same
  reason the equity curve does — it starts with the orders from the original backtest, then continues
  with the orders placed automatically by daily updates since. Each order tells you which of those two
  it came from, so you can tell backtested history apart from live trading activity.

Keep in mind that trial timestamps and managed-portfolio timestamps aren't always recorded in exactly
the same format — if you're stitching data from both together, compare dates rather than assuming the
raw values line up byte for byte.

## Listing legacy portfolios (deprecated)

The pre-rename view of your trials, under the old "portfolios" name described
[above](#the-old-portfolios-naming-deprecated). It returns the same rows, in the same order, with the
same study filter, as pulling your list of trials — just under older field names and clearly marked
as deprecated.

## Getting one legacy portfolio (deprecated)

The pre-rename view of a single trial's detail. The id you'd use here is the same id that works on the
current trial detail pull — the underlying object is identical, only the field names and the
deprecation marking differ. The same choice of extra data (metrics, equity curve, holdings,
parameters) is available, with identical results either way.

## Troubleshooting: what error messages mean

A few situations you'll run into in practice:

- **Not found** — the trial, study, or managed portfolio you asked for doesn't exist, or belongs to a
  different organization, or its study has been deleted. Fintela deliberately returns the same "not
  found" message whether a resource doesn't exist at all or simply isn't yours, rather than confirming
  that something you can't see exists.
- **Too many requests** — you've gone over the request cap described above. Wait a short moment and
  try again; this isn't a sign anything is broken.
- **Anything else** — a rare, generic failure on Fintela's side. If this persists, reach out to
  support with what you were pulling and when.

See [Errors & status codes](/docs/api-errors) for the full picture of how errors are reported across
the read-only API.

## Moving off the legacy portfolio naming

If your integration still uses the old "portfolios" naming for trials, moving to the current trials
calls is a drop-in change — same data, same study filter, same choice of extra fields, same behavior
in every situation. The only difference is a couple of renamed fields on the way in, which is a small
update to make wherever your integration parses the response. Once you've fully switched over, the
deprecation marking stops appearing anywhere in your pulls — a simple way to confirm no part of your
integration is still using the old calls.

One thing to watch for while migrating: if you were relying on the old "portfolios" naming to mean
managed portfolios in the trading sense, that's not what it ever was — it was always trial data under
a confusing name. What you actually want is the managed portfolios list and detail described above,
and you'll need to look up managed portfolio references there, since the ids from the old naming are
trial ids and won't match up.

Related: [Studies](/docs/api-studies) for the runs that produce trials,
[Baskets](/docs/api-baskets) for what trades the managed portfolios, and
[API overview](/docs/api-overview) for the conventions shared across the read-only API.
