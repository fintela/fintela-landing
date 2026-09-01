---
title: Baskets
section: API Reference
sectionOrder: 10
order: 6
published: true
updated: 2026-09-01
summary: How to pull your Portfolio Groups (baskets), the broker connections they trade through, and their full trading history into your own tools through Fintela's read-only API.
keywords: baskets, portfolio groups, operations, allocations, orders, audit trail, end-of-day reports, data freshness, rebalancing, read-only API
---

Baskets — called **Portfolio Groups** in the app — are Fintela's way of trading several managed
portfolios together under one shared configuration. This page covers what you can pull about your
baskets through Fintela's read-only Developer API: their configuration, whether every member is
current enough to trade on, and the complete history of everything each broker connection they run
on has done — weight changes, broker orders, status changes, and daily reconciliation against your
broker.

You build and trade baskets in the Fintela app itself. The Developer API only lets you read what's
already there, so you can bring your basket and trading data into your own dashboards, spreadsheets,
or reporting tools.

## Baskets, members and operations

Three ideas matter throughout this page:

| Term | What it means |
|---|---|
| **Basket** (Portfolio Group in the app) | A set of managed portfolios traded together, plus the shared rules that decide how much weight each one gets and when the whole group rebalances. |
| **Member** | One managed portfolio inside the basket. Members are the same portfolios you'd find on the [Trials & portfolios](/docs/api-trials-portfolios) page. |
| **Operation** | One live actioning of a basket against a single broker connection — its own capital, its own status, and its own rebalance and drift history. |

A single basket can have **more than one operation running at the same time**. That's how you can
run the same Portfolio Group as a paper test and a live account side by side, or split it across
separate capital tranches at the same broker — the trading rules are shared on the basket, but
capital, status, and history are tracked separately per operation.

> [!NOTE] Member ids point to managed portfolios, not trials
> Wherever this page shows a member id, it's the same id you'd use to look that portfolio up on the
> [Trials & portfolios](/docs/api-trials-portfolios) page — it identifies the live, tradable
> portfolio, not the trial that originally produced it.

## What you can pull

| This view gives you | What's in it |
|---|---|
| All your baskets | Every Portfolio Group your organization has set up, most recently changed first |
| One basket | Full configuration for a single Portfolio Group |
| Basket freshness | Whether every member's data is current enough to trade on right now |
| A basket's operations | Every broker connection the basket is currently running on — paper, live, or split across tranches |
| One operation | Full detail for a single operation: broker, capital, status, and drift |
| Allocation history | Every weight snapshot recorded each time an operation rebalanced |
| Order history | Every broker order an operation has submitted |
| Audit trail | Every status change and system event recorded for an operation |
| End-of-day reports | Daily reconciliation between Fintela's records and your broker's own activity |

Each of these comes back as a full list in one response — there's no server-side sorting, filtering,
or search on this page, so do that in your own tool once you've pulled the data.

> [!NOTE] One list comes back oldest-first
> A basket's operations are listed oldest-first. Every other list on this page — orders, the audit
> trail, end-of-day reports — comes back newest-first. Don't assume the first row you see is the
> most recent one; check which list you're looking at.

## Getting access

You read basket data with a personal access key, generated from your account settings — see
[Authentication & limits](/docs/api-authentication) for how to create one. The Developer API is
strictly read-only: nothing you do with it can change a basket, launch a trade, or move money, so
it's safe to hand a key to a reporting tool or script without worrying it could act on your behalf.

Access is scoped to your whole organization, not to individual baskets — anyone on your team with an
access key can read every basket your organization owns. If a basket doesn't exist, has been
deleted, or belongs to another organization, you'll get the same "not found" response either way, so
the API can't be used to probe what other organizations have set up. If a request ever fails, see
[Errors & status codes](/docs/api-errors) for what the different responses mean.

## Basket configuration

| What you'll see | What it means |
|---|---|
| Name | The basket's name, as set in the app. |
| Members | The managed portfolios in the basket, and each one's weight if you've set weights manually. |
| Daily Update | Whether the basket's active members extend their performance history every day. |
| Stage | The time window used when the basket runs its daily update (defaults to year-to-date). |
| Allocation method | How member weights are worked out — see below. |
| Rebalance cadence | Whether a periodic rebalance is turned on, and how often it runs, counted in trading days rather than calendar days. |
| Last changed | When the basket's configuration was last updated. |

> [!NOTE] This is a snapshot, not everything the app knows
> A few things you can set on a basket in the app — its description, and some advanced execution
> and protective settings — aren't surfaced through the read-only API yet. For the complete picture,
> check the basket directly in [Portfolio Groups](/docs/portfolio-groups).

## Allocation methods

A basket's allocation method decides how weight is split across members. You choose it from the
basket's settings in the app; the API simply reports back which one is set.

- **Equal weight** — every member gets the same weight. This is the default for a new basket.
- **Manual** — you set each member's weight yourself.
- **Metric proportional**
- **Metric responsive**
- **Risk parity**
- **Volatility target**
- **Mean reversion**

See [Portfolio Groups](/docs/portfolio-groups) for how each of these methods weights members.

> [!TIP] Some methods may need to be unlocked
> A few allocation methods are gated behind your organization's plan. If one isn't selectable on a
> basket, check [Tokens & billing](/docs/tokens-and-billing) or your basket's settings in the app.

## Basket freshness — whether it's ready to trade

Before anyone on your team can invest in a basket, Fintela checks whether every member's data is
current enough to trade on. This freshness check is available through the API too, and it runs the
exact same logic the app uses at invest time — so what you see here always matches what the app
would tell you.

### What makes a member "stale"

A member is stale when it has no daily performance data at all, or when its most recent data is
behind the latest complete trading day for the markets its holdings trade on by more than a short
grace period (currently one day, to give the daily update time to catch up after the market closes).
If a member's holdings have no market data at all, it can't be behind a day that doesn't exist — it's
reported as fresh by default.

### What you'll see

| Field | What it tells you |
|---|---|
| Fresh members | Members that are current enough to trade on. |
| Stale members | Members behind the latest complete trading day. |
| Not scheduled | Members with Daily Update turned off, so they won't catch up on their own. |
| Per-member detail | Each member's stale flag, whether Daily Update is on for it, and whether its strategy runs inside Fintela or is [externally supplied](/docs/external-strategies). |
| Basket-level Daily Update | Mirrors the basket's own toggle. Off means members will drift stale over time and the basket can't be invested in. |
| Rebalance cadence | Mirrors the basket's rebalance settings. |

> [!TIP] Check the per-member detail, not just the stale list
> A member can be both stale *and* not scheduled at the same time — those aren't mutually exclusive.
> The per-member detail tells them apart: a member with Daily Update switched off is the real
> problem to fix; a member that's merely behind the latest bar but still scheduled will typically
> catch up on its own.

Externally supplied strategies can't currently extend automatically through Daily Update — only
strategies that run inside Fintela can. See [external strategies](/docs/external-strategies) for
what that distinction means and when you'd choose it.

## Operations — how a basket actually trades

Every time a basket is set up to trade through a broker connection, that's an operation. An
operation tracks everything specific to that one connection: how much capital is allocated, whether
it's actively trading, and its own rebalance and drift history — even though the trading rules it
follows come from the shared basket.

| Field | What it tells you |
|---|---|
| Broker connection | Which of your broker connections this operation trades through. |
| Broker | The broker it trades at. Alpaca is the only broker Fintela connects to today. |
| Label | An optional name you can give the operation, e.g. "paper $10k" or "live tranche A" — useful when a basket has several operations at once. |
| Capital | The capital allocated to this operation. |
| Actual status / requested status | The state the platform has actually reached, and the state you (or a teammate) last asked for in the app. |
| Drift detected / acknowledged | When the platform last noticed the broker's real positions didn't match Fintela's records, and when someone on your team acknowledged it. |
| Last rebalanced | When this operation itself last rebalanced — this is tracked per operation, so one operation rebalancing never moves the timestamp on a sibling operation. |
| Rebalance requested | Set when a manual rebalance has been requested for this operation and is still pending. |

> [!TIP] Watch for a mismatch between actual and requested status
> When the requested status and the actual status differ, a change you or a teammate made in the app
> hasn't been carried out by the platform yet. Together with an unacknowledged drift (drift
> detected, but not yet acknowledged), that's the first thing worth checking if an operation looks
> off.

### Operation status

| Status | Meaning |
|---|---|
| Draft | Configured but never launched. |
| Active | Trading. |
| Paused | Held — positions are retained, no new trading happens. |
| Stopped | Wound down. |

Rebalance cadence — whether periodic rebalancing is on, and how often — is basket-level, shared
config that every operation on that basket follows. What's tracked per operation is only when *that*
operation last rebalanced, and whether it has a manual rebalance pending.

## Operation history

Four kinds of history are available for each operation, and all four are always scoped to one
specific basket and one specific operation.

> [!WARNING] Double-check your ids
> If you ask for history using an operation id that doesn't exist, or that belongs to a different
> basket than the one you named, you'll get an empty result back rather than an error. If you want
> to confirm an operation actually exists first, pull that single operation directly — that request
> does tell you clearly when an id is wrong.

These history views come back in pages rather than all at once, so a basket with years of trading
history doesn't overwhelm a single pull — keep paging until a page comes back with fewer rows than
you asked for. Most of them are ordered newest-first (allocations are grouped by member instead); if
new activity happens while you're still paging through, rows can shift underneath you, so anchor on
a timestamp yourself if that matters for your use case.

### Allocation history

One row for every weight snapshot, recorded each time the operation rebalanced.

| Field | What it tells you |
|---|---|
| Member | The managed portfolio the weight applies to. |
| Weight | The member's weight at that snapshot, from 0 to 1. |
| Triggered by | Whether the rebalance happened on its normal schedule or was requested manually. |
| Recorded at | When the snapshot was taken. |

### Order history

Every broker order the operation has submitted.

| Field | What it tells you |
|---|---|
| Member / ticker | Which managed portfolio and symbol the order was for. |
| Broker order id | The broker's own reference for the order, once it's been accepted. |
| Buy or sell, long or short | The direction of the order. |
| Quantity, order type, limit price | The order's size and how it was placed. |
| Status | Where the order stands — see below. |
| Triggered by | Whether it came from the normal rebalance schedule or a manual action. |
| Submitted / filled at, fill price | Timing and execution detail once the broker has acted on it. |
| Error message | Why an order failed, when it did. |

| Status | Meaning |
|---|---|
| Pending | Created, not yet sent to the broker. |
| Held | A buy order whose cash has been reserved but not yet released for submission. |
| Submitting | In the process of being sent — this guards against the same order accidentally going out twice. |
| Submitted | Sent to the broker. |
| Working | Resting or open at the broker, possibly across more than one trading session — a limit or similar order that hasn't fully filled yet. This isn't treated as a mismatch with your target positions. |
| Partially filled | Some of the order has filled. |
| Filled | Fully executed. |
| Cancelled | Withdrawn before it filled. |
| Failed | Rejected — check the error message. |

### Audit trail

An entry for every status change and system event recorded against the operation, in the order they
happened.

| Event | When it's recorded |
|---|---|
| Launched | The operation moved out of Draft into live trading. |
| Activated | Set to Active. |
| Paused | Set to Paused. |
| Stopped | Set to Stopped. |
| Reinitiated | A fully stopped operation was reset back to Draft. |
| Status changed | Any other status change. |
| Force stopped | The operation was torn down locally **without** closing out broker positions — worth knowing, since positions stay open at the broker afterward. |
| Status synced | The platform's records caught up with a status you requested. |
| Drift detected / cleared | The platform found (or resolved) a mismatch between the broker's real positions and its own records. |
| Drift auto-reconciled | A mismatch was explained by a broker event and resolved automatically. |
| Drift operator-reconciled | A mismatch was resolved after someone on your team acted on it. |
| End-of-day reconciliation | A daily reconciliation run against the broker completed. |
| Protective stops left open | During an emergency liquidation, some protective stop orders couldn't be cancelled, so those positions were left open — worth checking manually if you see this. |
| Connection revoked, auto-paused | The broker connection was revoked, so the platform automatically paused its operations. |

> [!NOTE] Treat this as a very reliable record, not a guaranteed-complete one
> Entries tied to something you or a teammate did in the app — launching, pausing, stopping — are
> recorded together with the action itself. Entries the platform writes on its own — drift,
> reconciliation, status syncing — are best-effort, and in rare cases might be missing even though
> the underlying event genuinely happened.

### End-of-day reports

A daily reconciliation of Fintela's records against your broker's own activity for that operation,
one row per trading day.

| Field | What it tells you |
|---|---|
| Trading day | The date the report covers. |
| Outcome | Clean, discrepancies found, or an error running the reconciliation. |
| Fills matched | How many broker fills were successfully matched to Fintela's records. |
| Fill / position discrepancies | Details of any mismatches found, when there are any. |
| Other account activity | Dividends, fees, interest and similar activity that isn't tied to a single operation. |
| Ran at | When the reconciliation ran. |

> [!NOTE] Some rows cover the whole broker account, not one operation
> Alongside the reconciliation for this specific operation, you'll also see rows that summarize
> activity across the whole broker connection for that day — things like dividends or fees that
> can't be attributed to any one operation. If you run more than one operation through the same
> broker connection, you'll see those same account-wide rows repeated under each one. Filter them
> out if you only want this operation's own reconciliation.

## Staying within the limits

Reading basket and operation data is capped to keep the platform responsive for everyone — Fintela
allows a steady, generous rate of requests with some headroom for bursts, and asks that you throttle
your own polling rather than pull as fast as possible. If you go over the limit, you'll be asked to
slow down and try again shortly.

Right now, this limit is enforced consistently on baskets and operations, along with a few other
read-only areas. Other parts of the read-only API don't enforce a limit yet — but build your
integration as if they will, rather than relying on that staying true.

## Keeping your own systems in sync

There's no way for Fintela to push updates to you — no notifications, no live feed. If you're
building your own monitoring or reporting on top of this data, you poll for it on whatever schedule
makes sense for you.

A few signals worth checking on a loop:

| What you're watching for | Where to look | What tells you something changed |
|---|---|---|
| A status change still in progress | An operation's actual vs. requested status | They don't match yet |
| Drift that hasn't been dealt with | An operation's drift fields | Drift was detected but not yet acknowledged |
| New broker activity | Order history | Orders you haven't seen before |
| Reconciliation problems | End-of-day reports | An outcome other than clean |
| Members going stale | Basket freshness | A non-empty stale list, or Daily Update turned off |

A changed "last updated" timestamp on your list of baskets is the cheapest way to notice that
someone edited a basket's configuration, since that list is already sorted by it.

## What you can't do through the API

This is worth stating plainly: **you can't control trading through an API key.** Creating an
operation, launching it, pausing it, stopping it, acknowledging drift, and requesting a rebalance are
all things you do in the app. So is creating, editing, or deleting a basket, and refreshing or
simulating one.

> [!CAUTION] An API key can watch live trading, but it can't cause any of it
> Nothing you can pull through this page can submit an order, change how much capital an operation
> is trading with, or move an operation between states. Use it to build monitoring, reporting, and
> reconciliation on top of your baskets — drive the actual trading from
> [live trading](/docs/live-trading) in the app.

For everything else the read-only API exposes — strategies, studies, trials and portfolios, fitness
functions, and asset groups — start at the [API overview](/docs/api-overview).
