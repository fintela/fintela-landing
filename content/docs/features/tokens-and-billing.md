---
title: Tokens & Billing
section: Features
sectionOrder: 7
order: 2
published: true
updated: 2026-09-01
summary: How Fintela's token based billing works: what uses tokens, how your balance is tracked, and which features unlock once your organization is on a paid plan.
keywords: tokens, billing, ai tokens, usage, quota, plan limits, locked features, purchase tokens, usage dashboard, upgrade
---

Fintela runs on a prepaid token model. You buy tokens, and everything you run in Fintela draws
down from your organization's balance: there are no seats, no monthly subscription tiers, and no
invoices to reconcile. Tokens are the only way compute is billed. Separately from what you spend,
your organization's plan determines what you're *allowed to do*: a set of features and creation
limits stay locked until your organization has bought tokens and still holds a balance. This page
covers both sides: what costs tokens, where to watch your balance, and exactly what you'll see
when something is locked or your balance runs out.

## Two token currencies

Fintela tracks two separate balances, each with its own purchase flow, its own indicator in the
header, its own card on your Account page, and its own "insufficient balance" message. Neither can
be used to pay for the other.

| | Fintela Tokens | Fintela AI Tokens |
|---|---|---|
| Pays for | Compute: optimizations, sandbox test runs, portfolio simulations, scheduled daily updates, [Laboratory](/docs/laboratory) sessions | [Fintelligent](/docs/fintelligent) conversations and the extra context it pulls in (news, insider activity, analyst data, and more) |
| Billing timing | Prepaid (charged before the work starts) | Metered after the fact (charged once a conversation turn finishes) |
| Where to manage it | Account → Tokens | Account → AI Tokens |

Your transaction history for both currencies is a permanent record. Corrections never edit a past
entry: they show up as a new entry, such as an adjustment or a reconciliation fix, so your history
always tells the full story of how your balance got where it is.

Every new organization starts with **250 Fintela Tokens** and **200 Fintela AI Tokens** on the
house, so you can try Fintela before you buy.

> [!NOTE]
> The free trial allowance is one per person, not one per organization: creating a second
> organization under the same identity doesn't grant a second free allowance. And receiving the
> trial tokens doesn't put you on a paid plan by itself; see [Plans, tiers and
> activation](#plans-tiers-and-activation) below for what actually unlocks the full product.

## What consumes Fintela Tokens

Prices are set per operation and are occasionally recalibrated as the platform evolves. Most
charges scale with the size of the job you're running: the number of trials in a study, the
number of portfolios you're refreshing: with a minimum charge of 1 token; a few actions are
simply free.

| What you're doing | When you're charged | How the cost scales |
|---|---|---|
| Running a [study](/docs/studies) (optimization) | When you launch the study, or create it with launch now | Scales with the number of trials you run |
| Daily updates on a study | Each time a study you've subscribed to daily updates is automatically rerun | Scales with the number of trials in that update |
| Daily updates on a [portfolio group](/docs/portfolio-groups) | Each time a portfolio group with daily updates turned on is refreshed | 1 token per portfolio refreshed |
| Sandbox run | Each time you test a strategy, fitness function, or risk manager in the sandbox | Flat 1 token |
| Portfolio group simulation | Each time you simulate a portfolio group | Flat 1 token |
| Data source preview | Each time you preview a data source while building a strategy or browsing the [Data Explorer](/docs/data-explorer) | Flat 1 token |
| Advanced allocation method | A one time charge when you save a portfolio group using a paid allocation method | 50 to 150 tokens depending on the method (see below) |
| [Laboratory](/docs/laboratory) session | For every minute a session stays open | Scales with the compute size your session is using |

Two of the built in allocation methods (Equal Weight and Manual) are free to use. The more
advanced methods carry a one time unlock charge per portfolio group, applied the moment you save
the group with that method selected: Metric Proportional and Mean Reversion cost 50 tokens, Metric
Responsive costs 75, Volatility Target costs 100, and Risk Parity costs 150. That charge is locked
in at save time: it never touches a rebalance that's already running live, so your balance can
never interrupt one.

Laboratory is the only operation billed by time rather than by action: you pay for every minute a
session stays open. The rate depends on how much compute power your session is configured with, so
it's only known once your session has actually started; you'll see it next to **Lab ready** in the
session chip, shown as **~{{n}} tok/h**, so you always know roughly what an hour of that session
will cost. Billing is metered continuously in small increments, so a low per minute rate is never
rounded up in big jumps.

### Studies prepay, then get a refund

When you launch a study, Fintela charges you up front for the number of trials it *might* run. In
practice, a study often finishes sooner than that: autostop, exhausting the search grid, or an
early stop can all end it before every planned trial runs. When that happens, Fintela automatically
credits back the difference between what you were charged and what the study actually used,
typically within a few days of the study completing.

The confirmation dialog says as much when you launch: **"Charged up front; any over estimate is
refunded automatically on completion."** See [study lifecycle](/docs/study-lifecycle) for what the
different trial states mean.

### Operations that cost nothing

| This... | ...costs |
|---|---|
| A Fintelligent chat turn | Nothing in Fintela Tokens: it's billed from your AI token balance instead |
| Backtests | Currently free |
| Replication kit | This feature has been retired and is no longer offered or billed |

Because a Fintelligent turn never touches your compute token balance, you won't find an "Agent
Chat" category in your Fintela Token usage dashboard: that spend shows up on the AI token side
instead.

## What consumes Fintela AI Tokens

AI tokens are billed after the fact: the true cost of a Fintelligent turn is only known once it has
finished streaming back to you, so the charge is applied right after: it never withholds your
answer while it's being calculated. If your balance runs low mid turn, that turn still completes;
it simply can't take your balance below zero, and it's the *next* turn that gets blocked once
you've run out.

**1 AI Token = $0.01.** Usage is metered from how much the assistant actually reads and writes for
your conversation:

| What's being billed | Relative cost |
|---|---|
| Reusing context sent very recently in the same conversation | Cheapest |
| New context you send that wasn't recently reused | About 120× the reused rate |
| The assistant's response | Roughly double the new context rate: the priciest part of a turn |

Every turn with any usage at all costs at least 1 AI token; a turn that used nothing is free. The
same pricing applies no matter which underlying model answers you.

On top of the usage charge, pulling extra context into a conversation carries its own flat charge:

| Context added | What it gives the assistant | Typical cost |
|---|---|---|
| News & sentiment | Recent news and sentiment for AI Ideas | 20 AI tokens |
| Live news | Current news headlines pulled into your prompt | 25 AI tokens |
| Insider activity | Recent insider trading activity | 15 AI tokens |
| Analyst estimates | Analyst estimate context | 15 AI tokens |
| Corporate actions | Corporate actions context | 10 AI tokens |
| Macro & rates | Macro and interest rate context | 10 AI tokens |
| AI Ideas generation itself | The idea generation, on top of any packs it pulls in | Billed from actual usage |

Most of these packs are charged once per AI Ideas generation that uses them. Live news is a little
different: it's billed on the underlying lookup itself, and if the same question about the same
tickers comes up again within the hour (from you or a teammate) it's served from what was already
fetched and billed only once for that hour. A digest that turns up no relevant tickers is free.
Browsing news normally in Markets or the Portfolio Manager is never billed: this charge only
applies to pulling news into an AI prompt, not to reading it yourself.

Inside a Fintelligent conversation, each response can show a small token caption: the raw number of
model tokens used, and (while the response is actively streaming) the billed AI token amount.
The billed figure isn't saved with the conversation, so reloading the page still shows the raw
total but not the billed one.

## Where your balance appears

| Where | What you'll see |
|---|---|
| Header: Tokens icon | Your live Fintela Token balance. Click it to jump to Account → Tokens. Turns red at zero |
| Header: AI Tokens icon | Your live AI Token balance, same behavior |
| Depleted banner | A red banner under the header saying compute is paused (backtests, optimizations, and daily updates) with a **Buy tokens** button. Daily updates resume automatically once you top up |
| Low balance notice | A dismissible notice warning your balance is running low, with the same **Buy tokens** button |
| Account → Tokens | Your Fintela Tokens and Fintela AI Tokens cards, side by side |
| Registry pages (Studies, Strategies, etc.) | A used/limit meter, shown only while your organization is on the free tier |

You're warned once your balance drops below roughly 20% of your last purchase (or below 50 tokens
if you've never purchased). A balance of exactly zero is treated as fully depleted rather than just
low, so at that point you'll see the red banner instead of the warning.

Both header indicators link straight to the matching card on your Account page. Your balance
refreshes automatically on a regular interval and whenever you switch back to the tab, and a
completed purchase updates every open tab in your browser right away: no refresh needed. If your
balance can't be loaded for any reason, the indicator simply disappears rather than showing a wrong
number; what you're actually charged is always accurate regardless of what's displayed.

### Transaction history

Both your Fintela Tokens and Fintela AI Tokens cards include a **Transaction history** table with
the date, type, a short reference (such as which study or purchase it relates to), the amount, and
your running balance after each entry. Credits (purchases, refunds, your trial grant) are shown
in green with a plus sign. If you haven't used anything yet you'll see "No token activity yet" or
"No AI usage yet"; if history fails to load you'll see a message saying so. A **Load more** button
pages back through your full history.

Transaction types you may see on your Fintela Token history: Purchase, Backtest, Optimization,
Daily update, Basket backtest, Sandbox run, Fintelligent chat, Replication kit, Refund, Trial
grant, Adjustment, and Reconciliation.

On your AI Token history: Purchase, Fintelligent AI usage, Refund, Trial grant, Adjustment, and
Reconciliation.

> [!WARNING]
> A handful of transaction types: such as daily portfolio updates, advanced allocation unlocks,
> and Laboratory sessions: can appear in your history under a technical looking name rather than a
> friendly label. The amount and balance columns are always accurate even when the label looks
> unfamiliar.

### Cost confirmation before you spend

Launching a study opens a confirmation dialog before anything is charged. It shows the estimated
cost (or, for a recurring study, the estimated cost per day), your current balance, and: for a
one off study: a reminder that any over estimate is refunded automatically. If the estimated cost
is more than you have available, the dialog says so and disables **Confirm** until you top up.

This estimate is a preview to help you decide before you commit. The actual charge is calculated
and deducted at the moment the study runs, using the same pricing logic, so what you're billed
always matches what actually happened.

## Buying tokens

Only the organization **Owner** can buy tokens. Owners and Admins can both see the Tokens section
on the Account page, but the purchase options are visible only to the Owner.

Buying tokens is a one time purchase through Fintela's secure checkout: never a recurring
subscription:

1. You'll see a list of available token packages, each showing how many tokens you get and the
   price, with a **Buy** button next to each.
2. Clicking **Buy** takes you to a secure checkout page.
3. After checkout, you're brought back to your Account page, where a **"Confirming your
   purchase: the balance updates as soon as the payment is processed"** message appears while your
   new balance is applied: this normally takes just a few seconds.
4. Once confirmed, the tokens are added to your balance and show up in your transaction history as
   a Purchase.

If something goes wrong loading the available packages or starting checkout, you'll see a plain
error message asking you to try again: this is rare and usually resolves on retry.

Some partner and internal organizations receive their tokens through a discount code applied at
checkout rather than paying full price, but every purchase (discounted or not) is recorded the
same way in your transaction history.

## The usage dashboard

Owners can open the **Fintela Usage Dashboard** from the Members section of the Account page to see
what everyone in the organization has created and spent, in one place.

The dashboard has two tabs. **Activity** (what members have built) is visible to the Owner only.
**Tokens** (what's been spent) is open to both Owners and Admins.

The Tokens tab lets you filter and re slice the same data instantly:

| Control | Options |
|---|---|
| Date range | Defaults to the last 12 months |
| Granularity | Daily, Weekly, or Monthly (default) |
| Breakdown | By category, or by member |
| Categories | Choose one or more spending categories |
| Member | All members, one specific member, or **System** for automated activity like daily updates |

At the top you'll find summary figures: Balance, Consumed, Purchased, Granted, Net change, Top
category, and a Depleted marker where it applies. Below that: a chart of consumption over time,
acquired vs. consumed tokens (how your budget is being used), spending by category, your
top spending members, and a member by category breakdown. If there's nothing to show for your
current filters, the chart says so.

The acquired vs consumed chart and the top consumers/heatmap charts reflect the whole organization
or a subset of your filters, so don't be surprised if narrowing one filter doesn't change every
chart on the page.

The **Activity** tab shows a different picture entirely: what your team has built rather than what
it's spent: counts of asset groups, strategies, fitness functions, studies, and studies launched,
with a summary view and a trends view.

## When you run out

Nothing you've built is ever deleted because your balance hit zero. Compute simply pauses, and it
picks back up automatically the moment your balance is positive again. The one exception is a
**live Laboratory session**: because it's billed by the minute, a session that can no longer be
paid for is shut down rather than left running unpaid.

| Situation | What happens |
|---|---|
| Your Fintela Token balance is too low for an action | The action is blocked, and you're shown the cost versus what you have available |
| Your AI Token balance has run out | Your next Fintelligent message is blocked until you top up |
| A payment dispute is open on your account | All compute and Fintelligent are paused until the dispute is resolved: see below |
| Your organization is spending unusually fast | New compute briefly pauses to protect against runaway spend, and resumes on its own as the surge passes |

If a study or a portfolio group's daily update can't be paid for, it isn't cancelled: that update
is simply skipped for the day and resumes automatically on the next scheduled run once your balance
allows it.

Running out of tokens opens a **Not enough tokens** dialog showing the cost of the action versus
what your organization has available, with a prompt to buy a token package: paused daily updates
resume automatically once you do. Running out of AI tokens opens a similar **Not enough AI tokens**
dialog that takes you straight to the AI Tokens section of your Account page.

> [!CAUTION]
> A payment dispute freeze is different from simply running low, and buying more tokens will not
> lift it on its own. If a card payment you made is disputed, all compute and Fintelligent are
> paused until the dispute is resolved, regardless of your balance. Fintelligent usage already
> incurred before the freeze stays recorded as normal. If the dispute is resolved in your favor, any
> tokens held back are credited to your balance and the freeze is lifted. Contact support if you
> believe this has happened in error.

Every organization also has a safety limit on how fast it can spend: by default, up to 100,000
tokens in any rolling 24-hour period. This only counts money actually spent, never purchases,
refunds, or credits, so it can't be tripped by buying tokens or receiving a refund. If you hit it,
new compute briefly pauses and automatically resumes as the 24-hour window rolls forward; contact
support if your organization legitimately needs a higher limit.

## Plans, tiers and activation

Fintela has exactly two tiers: **Free** and **Activated**. There's no plan picker and no plan names
to choose between: your organization is automatically on whichever tier its purchase and balance
history puts it on.

Under the current rule, your organization is **Activated** once it has made at least one token
purchase, in either currency, **and** still holds a positive balance in at least one of the two.
Holding AI tokens alone is enough to keep you activated, and so is holding compute tokens alone.

> [!IMPORTANT]
> Buying tokens buys usage, not a permanent upgrade. If your organization spends its balance all
> the way down to zero after purchasing, it drops back to Free tier limits and locks until it tops
> up again.

Dropping back to Free doesn't delete anything. Feature access and creation limits are only checked
at the moment you try to *create* something new or use a locked feature: never on things you've
already built. Every strategy, study, portfolio group, and promoted portfolio you've created stays
fully readable and runnable; you simply can't add more until you top up, and the locked pages close
again. This is also what guarantees a lock can never strand you inside a live position: see
[live trading](/docs/live-trading).

Changes to plan limits and locked features take effect for everyone within about a minute and
without any downtime, so an adjustment to the rules shows up quickly across the whole platform.

> [!NOTE]
> Every limit, price, and locked feature on this page is the *current default*: Fintela's team
> recalibrates these over time as the platform grows, so treat specific numbers here as
> representative rather than permanently fixed.

## Locked features

Nine features are gated behind the paid tier, and by default all nine start out locked for a Free
organization:

| Feature | What it unlocks |
|---|---|
| Markets | The [Markets](/docs/market) tab's precomputed market data |
| Data Explorer | The [Data Explorer](/docs/data-explorer) terminal |
| Laboratory | Starting a [Laboratory](/docs/laboratory) session |
| Developer API | Creating or rotating a personal access key for the read only [Developer API](/docs/api-overview) |
| Broker & paper trading | Connecting a broker account and creating, launching, or activating a trading operation |
| Seed export | Extracting a portfolio or portfolio group seed |
| AI Ideas | AI generated context and portfolio idea generation |
| Daily updates | Subscribing a study to recurring, scheduled recompute |
| Bulk studies | Creating a batch of studies in one request |

A couple of things worth knowing at the edges: stopping, checking on, or waiting on a Laboratory
session you already started always stays available on every tier: you should never be locked out
of stopping a session that's billing you by the minute. And reading a developer API key you've
already generated is always allowed; only *creating a new one* is gated, so a plan change can never
cut you off from a credential you're already using. See [API
authentication](/docs/api-authentication) for more on developer access keys.

There's deliberately no separate lock on live trading itself: every path that lets you connect a
broker is already covered by the broker & paper trading lock above, and live trading also has its
own platform wide toggle on top of that.

Four of these (Markets, Data Explorer, Laboratory, and Developer API) have their own page in the
app, so visiting them shows a locked preview and a small padlock badge next to them in the sidebar.
The other five don't have a dedicated page; you'll only encounter their lock at the moment you try
to use them.

## Creation quotas

On the Free tier, eight kinds of resources are capped, and the limit is checked only at the moment
you try to create a new one: a bulk create request is checked against the whole batch, so a large
batch is rejected up front rather than half created:

| Resource | Free tier limit |
|---|---|
| [Strategies](/docs/strategies) | 2 |
| [Studies](/docs/studies) | 2 |
| [Fitness functions](/docs/fitness-functions) | 2 |
| [Asset groups](/docs/asset-groups) | 2 |
| [Risk managers](/docs/risk-managers) | 2 |
| [Portfolio groups](/docs/portfolio-groups) | 1 |
| [Promoted portfolios](/docs/promoted-portfolios) | 5 |
| Team members | 1 |

Creating, duplicating, and forking all count against these limits: including indirect creations,
like promoting a portfolio (counts against promoted portfolios) or forking from the Laboratory
(counts against strategies, fitness functions, or risk managers, depending on what you forked).

If you're already over a limit: for example, your plan changed after you'd already created several
items: nothing you built is removed. You just can't create more until you either delete something
to make room or top up your balance.

On affected registry pages (Studies, Strategies, Fitness, Asset Groups) you'll see a used/limit
meter in the toolbar that turns amber as you approach the cap and red once you hit it, with a
tooltip explaining that you can buy tokens to create more. This meter disappears entirely once your
organization is activated. Trying to create something at the cap opens an explanatory dialog
instead of simply doing nothing.

## Ceilings and the daily assistant cap

A few settings cap how big a single action can be, rather than how many things you can create: and
unlike the quotas above, hitting one of these doesn't reject your request outright. Instead,
Fintela quietly scales your request down to what's allowed and tells you so, rather than making you
redo a form you already filled in.

| Ceiling | Free tier limit | What happens |
|---|---|---|
| Trials per study | 250 | A study requesting more trials is automatically capped before you're charged |
| Universe size | 100 tickers | The limit is documented as a guideline for how large a universe you should use |
| Fintelligent messages per day | 10 | Counts only messages that were actually billed |

The daily Fintelligent cap limits how often you can chat per day: separate from your AI token
balance, which limits how much you can spend overall. It only counts messages that were
successfully billed, so a message that failed before it could be charged doesn't use up your daily
allowance.

In the chat window, once you're down to your last three messages for the day, you'll see a running
count of how many are left. Once you've used them all, the message box is disabled with a note that
your daily limit resets tomorrow, along with a **Buy tokens** button.

## What a locked page looks like

A locked feature isn't hidden from you. If it has an entry in the [navigation](/docs/navigation)
menu, that entry stays right where it is, you can still click into it, and the page still opens.
What you'll see instead of your real data is a preview:

- The page loads its normal layout (headers, panels, empty chart frames) so you can see what the
  feature looks like, but no real data is fetched or shown. You'll never see your own numbers, or
  anyone else's, behind a lock.
- The whole preview sits behind a soft blur, so it clearly reads as a preview rather than a broken
  page.
- On top, a panel with a padlock icon explains that the feature is locked, with a **Buy tokens**
  button that takes you straight to Account → Tokens.
- The navigation entry itself gets a small padlock badge with an explanatory tooltip.

The most common messages you'll see on a locked page:

| Message | What it means |
|---|---|
| Feature locked | Buy tokens to unlock this feature |
| This is a preview: your real data appears once unlocked | You're looking at an empty preview, not your actual data |
| You've reached your plan limit | Your plan includes a certain number of this resource, and you already have that many |
| Your existing items keep working normally | Nothing you built is affected: you just can't add more |
| You can also delete one to make room | An alternative to buying more tokens, if you'd rather free up a slot |

On these screens, resources are described in the same everyday language used throughout the
product: you'll see "asset groups" and "portfolio groups," for example, spoken about the way you
already know them.

## Lock and limit messages

When an action is blocked, Fintela shows you one clear, specific message rather than a generic
error: and if more than one thing is wrong at once, it prioritizes the most important one: a
payment dispute takes precedence over a locked feature, which takes precedence over a quota limit,
which takes precedence over a low balance, which takes precedence over the organization wide
spending speed limit. Only one such message is shown at a time, so a new issue replaces the
previous one rather than stacking on top of it.

A locked feature message always uses the same wording wherever you encounter it: including inside
a Fintelligent conversation, if that's what hits the lock: so the explanation stays consistent no
matter where you run into it. A quota message leads by reassuring you that what you've already
built keeps working, before asking you to buy more or delete something.

> [!IMPORTANT]
> These messages only interrupt you when you actively try to do something: launch a study, save a
> portfolio group, start a session. Fintela never pops up a lock message while it's quietly
> checking your status in the background, so simply browsing a locked preview page won't throw an
> error at you.

> [!NOTE]
> Whenever you hit a lock or a quota limit while trying to save or create something, Fintela
> immediately rechecks your plan status behind the scenes, so if your organization's status just
> changed, the app corrects itself right away rather than showing a stale message. Otherwise, your
> plan status refreshes automatically about once a minute, whenever you switch back to the tab, and
> instantly across every open tab the moment a purchase completes. A purchase made from a different
> browser or device may take up to a minute, or one tab switch, to be reflected here.

If Fintela can't confirm your plan status for any reason, it always fails on the side of letting you
continue rather than blocking you unfairly: the real check happens at the moment you actually try
to spend or create something, so this can never let you bypass what you're actually charged.
