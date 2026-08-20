---
title: Tokens & Billing
section: Features
sectionOrder: 7
order: 2
published: true
updated: 2026-08-18
summary: What consumes tokens, how usage is metered, and how plans and entitlements gate features.
keywords: tokens, billing, ai tokens, usage, quota, entitlements, plan, locked features, stripe, usage dashboard, 402
---

Fintela is prepaid. You buy tokens, and every piece of compute you run debits them from an
organization-level balance. There are no subscriptions, no seats and no invoices — tokens are the
only billing method in the product. Separately from what you may *spend*, an entitlement policy
decides what your organization may *do*: nine feature keys and eight creation quotas that stay
closed until the organization has bought tokens and still holds a positive balance. This page
covers both axes: what costs tokens, where the meters live, and exactly what a lock looks like.

## Two token currencies

The two balances are separate ledgers with separate purchase flows, separate chips, separate
Account cards and separate refusal codes. Neither can pay for the other.

| | Fintela Tokens | Fintela AI Tokens |
|---|---|---|
| Pays for | Compute: optimizations, sandbox runs, simulations, scheduled updates, lab sessions | [Fintelligent](/docs/fintelligent) turns and AI context packs |
| Balance column | `organizations.token_balance` | `organizations.ai_token_balance` |
| Ledger | `developers.token_ledger` | `developers.ai_token_ledger` |
| Billing model | Prepaid — charged before the work starts | Post-paid — metered after the turn has streamed |
| Refusal code | `insufficient_tokens` | `insufficient_ai_tokens` |
| Account anchor | `/account?section=tokens` | `/account?section=ai-tokens` |

Both ledgers are append-only. A database trigger rejects `UPDATE` and `DELETE` on
`token_ledger`, so corrections are new rows with reason `manual_adjustment` or
`reconciliation_fix`, never edits.

Every new organization is provisioned once with **250 Fintela Tokens** (`TRIAL_TOKEN_GRANT`) and
**200 Fintela AI Tokens** (`AI_TRIAL_TOKEN_GRANT`), both written as `trial_grant` ledger rows.

> [!NOTE]
> The trial is one per person, not one per organization. `developers.trial_grants` records
> identity fingerprints derived from your account at the moment the organization is created; a
> second organization created by the same human claims nothing. And a `trial_grant` is not a
> purchase — holding granted tokens never activates the paid tier.

## What consumes Fintela Tokens

Prices live in `developers.token_cost_config`, one row per operation, and are recalibrated by SQL
with no deploy. The engine computes
`ceil(base_cost × Σ(weight × input) × n_trials)`, with a floor of 1 token; a row with no weights at
all bills a flat `base_cost`, and an operation whose `base_cost` is `0` is free and writes no ledger
row at all.

| Operation | Ledger reason | Charged when | Current price |
|---|---|---|---|
| `optimization` | `optimization` | A [study](/docs/studies) is launched, or created with launch-now | `ceil(0.3 × n_trials)` |
| `study_update` | `study_update` | The portfolio dispatcher re-runs a study subscribed to daily updates | `ceil(0.3 × n_trials)` |
| `basket_update` | `basket_update` | The portfolio dispatcher refreshes a [portfolio group](/docs/portfolio-groups) with daily updates on | `ceil(1 × n_portfolios)` — 1 token per portfolio refreshed |
| `sandbox_run` | `sandbox_run` | A strategy, fitness-function or risk-manager sandbox run is submitted | 1 flat |
| `basket_simulate` | `basket_simulate` | A portfolio-group simulation is submitted | 1 flat |
| `pipeline_preview` | `pipeline_preview` | `POST /data-sources/preview` — the data-source preview behind the strategy editor and the [Data Explorer](/docs/data-explorer) catalog | 1 flat |
| `alloc_[method]` | `advanced_allocation` | A portfolio group is saved with a paid allocation method — a one-time unlock per group and method | 50 / 50 / 75 / 100 / 150 (see below) |
| `lab_session` | `lab_session` | Every minute a [Laboratory](/docs/laboratory) kernel session is alive | Derived from the task's Fargate size |

Paid allocation methods and their one-time unlock price: `metric_proportional` 50,
`mean_reversion` 50, `metric_responsive` 75, `volatility_target` 100, `risk_parity` 150. The basic
methods (`equal_weight`, `manual`) have no price row and are free. The charge lands at
configuration-save time and commits in the same transaction as the group — never during a live
rebalance, so a balance can never block or alter one.

Laboratory sessions are the only time-metered operation. The rate is computed from the live
Fargate rates in `developers.compute_cost_rates` for the kernel's CPU and memory:

```text
fargate_$/min = ((cpu_units/1024) × $vcpu_hr + (memory_mib/1024) × $gb_hr) / 60
tokens/min    = (fargate_$/min ÷ (1 − margin_gross)) ÷ token_usd
```

`margin_gross` is seeded at `0.80` and `token_usd` at `0.05`, both on the `lab_session` config
row. The meter ceils the *cumulative* total and charges only the delta since the last billed
minute, so a sub-1-token/minute rate is not rounded up six times an hour. The rate is derived from
the task's actual cpu/memory, so it exists only once the task has been placed: the Laboratory
session chip shows it next to **Lab ready** as **`~{{n}} tok/h`**, with the tooltip *"Estimated
token cost per hour, derived from this kernel's Fargate size"*.

### Studies prepay, then get a refund

A study is charged for the `n_trials` it *might* run, in one ledger row keyed to its own study id.
Autostop, grid exhaustion and early stops routinely end it sooner, so the status updater sweeps
studies that finished in the last 7 days and credits back `charged − actual`, where `actual` is
re-priced through the same config row and the same formula off the trials that actually reached
`COMPLETE`. The refund row carries reason `refund` and idempotency key `[study_id]:refund`, so it
is written exactly once.

The confirmation dialog says as much: **"Charged up front; any over-estimate is refunded
automatically on completion."** See [study lifecycle](/docs/study-lifecycle) for what the trial
states mean.

### Operations that cost nothing

| Reason | Status |
|---|---|
| `agent_chat` | Priced at `base_cost 0`, and no code path charges it. A Fintelligent turn costs **zero** compute tokens — it debits AI tokens instead |
| `backtest` | A price row exists but nothing charges it today |
| `portfolio_update` | Superseded by `basket_update` and `study_update`. Kept in the ledger's reason list for historical rows only |
| `replication_kit` | The feature was removed; its price row was deleted, so it can never be billed |

The token analytics dashboard knows an **Agent Chat** category and builds its category list from the
reasons actually present in the data, so — because `agent_chat` is never charged — that category
never appears at all. Fintelligent spend lives in the AI-token ledger, which that dashboard does not
read.

## What consumes Fintela AI Tokens

AI tokens are metered post-paid. A chat turn's usage is only known once it has streamed, so the
debit can never block the turn you are in — it caps at the available balance, driving it to zero
but never negative, and the pre-turn gate blocks the *next* turn once the balance is depleted.

**1 AI Token = $0.01.** Rates live in `developers.ai_token_cost_config('ai_chat').multipliers`,
expressed as AI tokens per 1,000,000 model tokens:

| Input class | Current rate |
|---|---|
| Prompt, cache hit | 1.8125 |
| Prompt, cache miss | 217.5 |
| Output | 435 |

Cache-miss is derived as `input_tokens − cache_read_tokens`, with the hit count clamped into
`[0, input]`. There is no cache-write tier. The result is ceiled per turn, so any positive usage
costs at least 1 AI token and a zero-usage turn is free. The same rates apply whichever model
served the request.

Flat AI-token charges for assembling extra context, levied separately from the usage debit:

| Operation | Ledger reason | What it buys | Current price |
|---|---|---|---|
| `ctx_pack_news_sentiment` | `ai_context_pack` | News and sentiment context for AI Ideas | 20 |
| `ctx_pack_news` | `ai_context_pack` | Live news put into a prompt (`GET /news?projection=agent`) | 25 |
| `ctx_pack_insider` | `ai_context_pack` | Insider-activity context | 15 |
| `ctx_pack_analyst` | `ai_context_pack` | Analyst-estimate context | 15 |
| `ctx_pack_corporate_actions` | `ai_context_pack` | Corporate-actions context | 10 |
| `ctx_pack_macro_rates` | `ai_context_pack` | Macro and rates context | 10 |
| — | `ai_hypotheses` | The AI Ideas generation itself, metered from reported usage | usage-based |

The five packs other than `ctx_pack_news` are billed once per AI-Ideas generation that selects
them, on top of that generation's `ai_hypotheses` usage debit. `ctx_pack_news` is different: it is
charged on the news route itself, only on the
agent projection, and its idempotency key is bucketed by the org, the sorted ticker set, the
resolved window and the UTC hour — so the same question asked twice inside an hour is served warm
and billed once. A digest that covered no tickers is free. Reading the news feed in Markets or the
Portfolio Manager is **not** billed: this is a charge for putting news into a prompt, not for
reading it.

Inside a Fintelligent conversation each assistant bubble can carry a token caption. It shows the
raw model total as **`{{formatted}} raw-tokens`** and, on the live stream only, the billed amount
as **`{{formatted}} AI tokens`**. The billed figure is not persisted, so it disappears when you
reload the conversation and only the raw total remains.

## Where your balance appears

| Surface | What it shows |
|---|---|
| Header chip (`Toll` icon) | Live Fintela Token balance. Tooltip **"Fintela Tokens — click to manage"**. Turns filled red at 0. Hidden below the `sm` breakpoint |
| Header chip (`AutoAwesome` icon) | Live AI-token balance. Tooltip **"Fintela AI Tokens — click to manage"**. Turns filled red at 0. Also hidden below `sm` |
| Depleted banner | Square-cornered red alert under the header: **"Tokens depleted — compute is paused (backtests, optimizations and daily updates). Daily updates resume automatically after a purchase."** with a **Buy tokens** action |
| Low-balance snackbar | Dismissible bottom-centre warning: **"Token balance is running low."**, same CTA |
| Account → Tokens | The **Fintela Tokens** and **Fintela AI Tokens** cards, side by side |
| Registry toolbars | A `used/limit` quota meter, free tier only |

The low-balance threshold is 20% of the most recent purchase amount, or a flat 50 tokens if the
organization has never purchased. A balance of exactly 0 is treated as *depleted*, not *low*, so
only the red banner shows.

Both chips deep-link to the Account page and scroll to the matching card. Balances poll every 30
seconds with a 15-second stale time and refetch on window focus. A confirmed purchase additionally
posts on the `fintela:tokens` / `fintela:aiTokens` broadcast channels, so every other tab in the
same browser drops its balance, its history and its entitlements at once. A failed balance read
fails soft —
the chip simply disappears rather than showing a wrong number; the backend meters atomically
regardless of what the client believes.

### Transaction history

Both Account cards render a **Transaction history** table with the columns **Date**, **Type**,
**Reference**, **Tokens** (or **AI tokens** on the AI card) and **Balance**. Credits are prefixed
with `+` and coloured green; a missing reference renders as `—`. Empty states are **"No token
activity yet."** and **"No AI usage yet."**; the failure state is **"Couldn't load transaction
history."** A **Load more** button pages through the ledger with a keyset cursor, 50 rows at a time.

`Type` labels for the Fintela Token ledger:

| Reason | Label |
|---|---|
| `purchase` | Purchase |
| `backtest` | Backtest |
| `optimization` | Optimization |
| `portfolio_update` | Daily update |
| `basket_simulate` | Basket backtest |
| `sandbox_run` | Sandbox run |
| `agent_chat` | Fintelligent chat |
| `replication_kit` | Replication kit |
| `refund` | Refund |
| `trial_grant` | Trial grant |
| `manual_adjustment` | Adjustment |
| `reconciliation_fix` | Reconciliation |

And for the AI-token ledger: `purchase` → Purchase, `ai_chat` → **Fintelligent AI usage**,
`refund` → Refund, `trial_grant` → Trial grant, `manual_adjustment` → Adjustment,
`reconciliation_fix` → Reconciliation.

> [!WARNING]
> The label maps have not kept up with the ledgers. Reasons the database allows but the tables do
> not translate — `basket_update`, `study_update`, `advanced_allocation`, `lab_session`,
> `pipeline_preview`, `chargeback`, `chargeback_reversed`, `migration_grant` on the compute side,
> and `ai_hypotheses`, `ai_context_pack`, `chargeback`, `chargeback_reversed` on the AI side —
> render as their raw reason string.

### Cost confirmation before you spend

Launching a study opens a confirmation dialog headed by the action name. It shows **"Estimated
cost"** (or **"Estimated cost (recurring, per day)"** for a recurring toggle), the number in
`N tokens`, **"Current balance: N"**, and, for one-off actions, the refund note. If the estimate
exceeds your balance it adds **"Insufficient balance for this action."** and disables **Confirm**.

The generic estimate comes from `POST /tokens/estimate`, which is advisory only — enforcement
re-estimates and deducts atomically at the choke point. A study launch overrides it with the
study-aware quote, because the generic estimate cannot see the universe or the machine size the
study needs.

## Buying tokens

Purchasing is **owner-only**, and that is enforced on the server: every payment route rejects a
non-owner with `403 Only the organization owner can purchase tokens.` Owners and admins can see
the Tokens container on the Account page; only the Owner sees the purchase grid inside it.

The flow is a one-time Stripe Checkout session, never a subscription:

1. The card lists active prices from the token product, each showing `N tokens` and the formatted
   price, with a **Buy** button.
2. **Buy** creates a Checkout session stamped with `purpose: token_purchase`, the token amount,
   your Keycloak subject and your organization name, then redirects.
3. Checkout returns to `/account?tokens=success` (or `?ai_tokens=success`). The card strips the
   parameter from the URL and shows **"Confirming your purchase — the balance updates as soon as
   the payment is processed."** while it polls the balance up to 12 times, 1.5 s apart.
4. The `checkout.session.completed` webhook credits the ledger with reason `purchase`, keyed on
   the session id so retries credit exactly once.

Purchase-section failure copy: **"Couldn't load token packages. Check that the Stripe service is
reachable and that a token product is configured."**, **"No token packages are configured yet."**,
**"Couldn't start checkout. Please try again."** The AI card mirrors these against the AI token
product.

The Checkout session enables promotion codes. Partner and internal organizations are activated
through a 100%-off coupon that writes a real `purchase` ledger row — there is no bypass list and
no per-organization override anywhere in the system.

## The usage dashboard

`/account/usage-dashboard`, reached from the **Fintela Usage Dashboard** button on the Members
card (Owner only). Header: eyebrow **Organization**, title **Fintela Usage Dashboard**, subtitle
**"What every member has created and launched across the platform."**, and a **Back to Account**
action.

Two tabs. **Activity** is Owner-only; **Tokens** opens to owners and admins, and an admin who is
not the owner is forced onto it. Anyone else is redirected to `/account`, and both APIs
independently return 403.

The **Tokens** tab fetches once per (range, granularity) and re-pivots client-side, so the category
and member filters never trigger a refetch.

| Control | Values |
|---|---|
| Date range | Defaults to the last 12 months, in your browser's timezone |
| Granularity | **Daily**, **Weekly**, **Monthly** (default) |
| Breakdown | **By category**, **By member** |
| Categories | Multi-select over the reasons present in the data |
| Member | **All members**, or one member; system-attributed rows appear as **System** |

KPI cards: **Balance**, **Consumed**, **Purchased**, **Granted**, **Net change**, **Top category**,
plus a **Depleted** marker. Charts: **Consumption over time**, **Acquired vs consumed** (subtitle
*Budget utilization*), **Usage by category**, **Top consumers**, and a **Member × category**
heatmap. Empty charts read **"No data for selected filters."**

**Acquired vs consumed** is organization-wide and ignores the category and member filters; **Top
consumers** and the heatmap honour the category filter but not the member filter.

The **Activity** tab is a different dataset entirely — what members created, not what they spent —
with totals labelled Asset Groups, Strategies, Fitness, Studies and **Studies Launched**, a
**Summary** / **Trends** toggle, and the empty state **"No activity yet"** / **"Once members create
asset groups, strategies, fitness functions or studies, their contributions will show up here."**

## When you run out

Nothing you built is deleted. Compute stops, and it resumes by itself once the balance is positive
again. The one thing that is actively torn down is a **live Laboratory session**: it is metered per
minute, so a tick that cannot be paid for flags the session for teardown rather than letting it run
unpaid.

| Condition | HTTP | `error` | What happens |
|---|---|---|---|
| Balance below the cost | `402` | `insufficient_tokens` | The action is refused, with `required` and `available` in the body |
| AI balance at or below zero | `402` | `insufficient_ai_tokens` | The next Fintelligent turn is refused; `available` in the body |
| Open chargeback on the org | `402` | `payment_disputed` | Every compute deduct is refused, and so is the next Fintelligent turn |
| Rolling spend cap crossed | `429` | `spend_cap_exceeded` | The balance is fine — the org is spending too fast. Clears as the window slides |

Verbatim messages, as the API returns them:

| `error` | `message` |
|---|---|
| `insufficient_tokens` | Insufficient tokens: this action costs {required} tokens but only {available} are available. |
| `insufficient_ai_tokens` | Insufficient AI tokens: your Fintela AI Token balance is depleted. Purchase more to keep using Fintelligent. |
| `payment_disputed` | This organization is on hold while a payment dispute is resolved. Contact support — purchasing more tokens will not lift the hold. |
| `spend_cap_exceeded` | This organization has reached its spending limit of {cap} tokens per {window_hours}h ({spent} already used in that window). New compute will resume as the window rolls forward; contact support to raise the limit. |

`insufficient_tokens` opens a dialog titled **Not enough tokens**: *"This action costs N tokens but
your organization has M available."* followed by *"Buy a token package to continue — paused daily
updates resume automatically after the purchase."*, with **Close** and **Buy tokens**.
`insufficient_ai_tokens` opens **Not enough AI tokens**, which deep-links to
`/account?section=ai-tokens` instead.

Scheduled work degrades gracefully rather than failing: a portfolio group or study whose update
cannot be paid for is simply skipped on that tick and picked up on a later one — a stateless pause
that auto-resumes after a purchase.

> [!CAUTION]
> A dispute freeze is not a balance problem and buying more tokens will not lift it. It is set by
> the `charge.dispute.created` webhook and holds one flag that both currencies read: compute
> deducts are refused outright, and Fintelligent's pre-turn gate refuses before a new turn starts.
> The post-paid AI debit deliberately still records usage already incurred. When the dispute closes
> in your favour the clawed-back tokens are credited back and the freeze is released.

The spend-velocity cap is per organization, stored on `organizations.spend_cap_tokens` and
`spend_cap_window_hours`, and defaults to **100,000 tokens per rolling 24 hours**. It counts
deducts only — credits, refunds and clawbacks never widen the budget — and a value of 0 or less
disables it. The 429 body carries `retry_after_seconds`.

## Plans, tiers and activation

There are exactly two tiers, `free` and `activated`. There is no plan picker, no plan name and no
per-organization override anywhere in the system — the entire policy is a **single global row** in
`developers.entitlement_policy`, whose primary key is constrained so a second row is impossible.

| Column | Meaning | Shipped value |
|---|---|---|
| `mode` | Which predicate activates an organization | `active_balance` |
| `enforcement` | How hard the guards bite: `off`, `shadow`, `enforce` | `enforce` |
| `locked_features` | Which feature keys are closed on the free tier | all nine |
| `version` | Bumped by a trigger on every write, echoed in the API | 1 |

Under the shipped `active_balance` mode you are **activated** when the organization has at least
one `purchase` row on either ledger **and** still holds a positive balance in either currency. The
alternative `lifetime_purchase` mode drops the balance condition and is monotonic, but it is not
what ships.

> [!IMPORTANT]
> Buying tokens buys usage, not a permanent licence. Under the shipped default, an organization
> that pays and later spends down to zero **re-locks** — the free-tier limits and locks come back
> until it tops up. Holding AI tokens alone is enough to stay activated.

Nothing is deleted when that happens. Limits are read **at create only** — never on read, update,
delete or stop — so every strategy, study, portfolio group and promoted portfolio you built stays
readable and runnable. You simply cannot add more, and the locked surfaces close again. That rule
is also what guarantees a lock can never trap you inside a live position; see
[live trading](/docs/live-trading).

The policy row is cached in each backend replica for 60 seconds, so an `UPDATE` propagates
fleet-wide within a minute with no deploy. The `ENTITLEMENTS_ENFORCE` environment variable can only
ever *lower* the row's enforcement level, never raise it. With enforcement at `off` or `shadow`,
`GET /entitlements/me` reports no locks and no limits at all — because the backend is not applying
any, and drawing meters for restrictions nobody enforces would be worse than drawing nothing.

> [!NOTE]
> Every number on this page is a *current default*, not a constant. Quotas, ceilings and the locked
> list are one editable SQL row and are recalibrated without a release.

## Locked features

Nine keys, and the product ships with **all nine locked**. The vocabulary is deliberately open: an
unrecognised key is inert, so a typo fails open rather than closing a surface the API still serves.

| Key | What it gates | Enforced at |
|---|---|---|
| `markets` | The [Markets](/docs/market) tab's precomputed data | Middleware in front of the market-data routes |
| `data_explorer` | The [Data Explorer](/docs/data-explorer) terminal | Middleware in front of the Data Explorer read handlers |
| `laboratory` | Starting a [Laboratory](/docs/laboratory) kernel session | `POST /lab-sessions` only |
| `developer_api` | Minting or rotating a developer API key | `GET /configuration` when no active key exists, and the rotate handler |
| `broker_paper_trading` | Connecting a broker and creating, launching or activating an operation | Connection create, Alpaca OAuth start, tracking create and launch, operation create, launch and status change |
| `seed_export` | Extracting a portfolio or portfolio-group seed | `get_portfolio_seed`, `get_basket_seed` |
| `ai_ideas` | AI context packs and basket idea generation | The AI-Ideas narration handler |
| `daily_updates` | Subscribing a study to recurring recompute | The study daily-updates patch handler |
| `bulk_studies` | Deriving a batch of studies in one request | `POST /studies/risk-manager-optimization`, the only batch-creating route today |

Two things worth knowing about the edges. Stopping, heartbeating and polling a Laboratory session
stay open on every tier — locking someone out of stopping a per-minute meter would make them burn
their own tokens. And *reading* an existing developer API key is always allowed; only minting a new
one is gated, so a packaging change can never cut you off from a credential you already hold. See
[API authentication](/docs/api-authentication).

There is deliberately **no `live_trading` key.** Live trading is covered twice over — every
connection-creating path is gated by `broker_paper_trading`, and live is off platform-wide behind
a separate switch.

Only four of the nine have a page of their own, and so a locked overlay: `markets`,
`data_explorer`, `laboratory` and `developer_api`. Of those, three carry a padlock in the sidebar —
Markets under Analysis, Data Explorer and Laboratory under **More Options** — because the API Docs
entry is hidden from the drawer even though its route stays mounted. The remaining five have no
navigation entry at all; they surface as a 402 at the moment you attempt the action.

## Creation quotas

Eight counted resources, checked at create time only. A batch request is checked for the whole
batch rather than per item, so a bulk create is rejected outright instead of half-fulfilled.

| Quota key | Resource | Current limit | Counted as |
|---|---|---|---|
| `strategies` | [strategies](/docs/strategies) | 2 | Not soft-deleted |
| `studies` | [studies](/docs/studies) | 2 | Not soft-deleted |
| `fitness` | [fitness functions](/docs/fitness-functions) | 2 | Not soft-deleted |
| `data_clusters` | [asset groups](/docs/asset-groups) | 2 | All rows — this table hard-deletes |
| `risk_managers` | [risk managers](/docs/risk-managers) | 2 | Not soft-deleted |
| `baskets` | [portfolio groups](/docs/portfolio-groups) | 1 | Not soft-deleted |
| `managed_portfolios` | [promoted portfolios](/docs/promoted-portfolios) | 5 | All rows — this table hard-deletes |
| `members` | members | 1 | Active users only |

Creating, duplicating and forking all count. So do the derived creations: promoting a portfolio
counts against `managed_portfolios`, forking from the Laboratory counts against whichever of
strategies, fitness or risk managers it produced, and deriving an asset group from a study or a
grouping counts against `data_clusters`.

`GET /entitlements/me` reports `used`, `limit` and a server-computed `can_create` for each. A
`limit` of `null` means unlimited — never `-1`, never `0`. An organization that was already over a
cap before the cap existed reports `used > limit` with `can_create: false`: nothing is taken away,
it just cannot add more, and deleting one makes room immediately.

The Studies, Strategies, Fitness and Asset Groups registries render a `used/limit` meter and bar in
their toolbar, tinted amber past 80% and red once reached, with the tooltip **"{{used}} of
{{limit}} {{resource}} used — buy tokens to create more"**. The meter renders nothing for an
activated organization. Pressing **Create** at the cap intercepts and opens the quota dialog rather
than disabling the button.

## Ceilings and the daily assistant cap

Ceilings bound a parameter rather than counting objects, and unlike quotas the trial ceiling
*clamps* instead of refusing — silently shrinking a run and saying so beats rejecting a form you
have already filled in.

| Ceiling | Current value | Behaviour |
|---|---|---|
| `max_trials_per_study` | 250 | A free-tier study requesting more is clamped down before pricing |
| `max_universe_tickers` | 100 | Reported by the API, but no handler currently enforces it |
| `max_agent_messages_per_day` | 10 | Counted from billed `ai_chat` ledger rows in the last 24 hours |

The assistant cap is a frequency bound, not a spend bound — absolute spend is already bounded by
the AI-token balance. It is counted from *billed* turns, so a turn that failed before billing does
not count against you. In the chat composer it surfaces from three messages left: below that
threshold the panel shows **"{{remaining}} of {{limit}} messages left today"**, and once spent the
composer is disabled with placeholder **"You've used all of today's messages"**, tooltip **"Daily
limit reached. It resets tomorrow."**, and a **Buy tokens** button in place of the counter.

> [!WARNING]
> The daily assistant cap is enforced in the client only. No backend guard reads
> `max_agent_messages_per_day` — it is reported by `GET /entitlements/me` and honoured by the chat
> panel. Treat it as a UI convention, not a security boundary.

## What a locked page looks like

A locked feature is **not hidden**. Wherever it had a [navigation](/docs/navigation) entry, that
entry stays, it still navigates, and the page still renders — behind a blurred, inert, data-free
preview.

- The route wrapper renders **nothing** until the entitlement answer is known, so there is no flash
  of unlocked content and no burst of requests.
- The page's real structure renders behind an `inert aria-hidden` layer inside a frozen query
  client, so **no data is fetched**. You see headers, layout and empty chart frames — never your
  own numbers, and never someone else's.
- The overlay is `blur(8px) saturate(0.7)` (4 px below the `sm` breakpoint), falling back to an
  88%-opaque background where backdrop filters are unsupported.
- On top sits an outlined panel with a padlock, the lock copy, a **Buy tokens** button pointing at
  `/account?section=tokens`, and a footnote.
- The navigation entry gains a small padlock and a tooltip in both rail states.

Every string, from `common.json`:

| Key | English |
|---|---|
| `lock.title` | Feature locked |
| `lock.body` | Buy tokens to unlock this feature. |
| `lock.cta` | Buy tokens |
| `lock.previewNote` | This is a preview — your real data appears once unlocked. |
| `lock.navTooltip` | Locked — buy tokens to unlock |
| `lock.badge` | Locked |
| `lock.quota.title` | You've reached your plan limit |
| `lock.quota.body` | Your plan includes {{limit}} {{resource}} and you already have {{used}}. |
| `lock.quota.keepUsing` | Your existing {{resource}} keep working normally. |
| `lock.quota.delete` | You can also delete one to make room. |
| `lock.quota.meter` | {{used}} of {{limit}} |
| `lock.agent.capPlaceholder` | You've used all of today's messages |
| `lock.agent.capTooltip` | Daily limit reached. It resets tomorrow. |
| `lock.agent.remaining` | {{remaining}} of {{limit}} messages left today |

Quota resources are named in product language, not database language: `fitness` reads *fitness
functions*, `data_clusters` reads *asset groups*, `baskets` reads *portfolio groups*, and
`managed_portfolios` reads *promoted portfolios*.

## The 402 contract

Entitlement refusals share HTTP `402 Payment Required` with balance refusals and are told apart by
the machine-readable `error` field. Every billing and entitlement refusal body bypasses the standard
`data` envelope and is returned as top-level JSON — see [API errors](/docs/api-errors) for the
normal shape.

```json
{
  "error": "feature_locked",
  "feature": "markets",
  "message": "This feature is available on paid accounts. Buy tokens to unlock it.",
  "upgrade": "purchase_tokens"
}
```

```json
{
  "error": "quota_reached",
  "quota": "strategies",
  "used": 2,
  "limit": 2,
  "requested": 1,
  "message": "Your plan includes 2 strategies and you already have 2. Existing ones keep working — buy tokens to create more, or delete one to make room.",
  "upgrade": "purchase_tokens"
}
```

`quota_reached` is a separate code from `feature_locked` because it has a second remedy that costs
nothing — delete something — and it carries `used` and `limit` so the client can say so.

Client handling, in fork order: `payment_disputed` → `feature_locked` → `quota_reached` →
`insufficient_tokens` → `spend_cap_exceeded` → generic error. A dispute is checked first
specifically so it can never reach a buy-tokens affordance.

`feature_locked` raises a dialog titled **Feature locked** whose body is the backend's `message`
**verbatim** — it is deliberately not re-worded locally, because Fintelligent quotes the same
sentence back to you mid-conversation. `quota_reached` raises **You've reached your plan limit**,
which leads with reassurance (`keepUsing`, `delete`) before the ask. Both offer **Close** and **Buy
tokens**. Only one dialog is held at a time; a later refusal replaces an earlier one.

> [!IMPORTANT]
> The dialog fires on **writes only**. The interceptor that raises it skips `GET` and `HEAD`,
> because a 402 on a background read — a poll or a prefetch behind a locked overlay — would
> interrupt someone who never asked for anything. A read that 402s fails silently.

> [!NOTE]
> A `feature_locked` or `quota_reached` refusal on a *write* also invalidates your entitlement
> snapshot: the global mutation error handler refetches `/entitlements/me` before it raises the
> dialog, so a client whose picture of the rules is provably stale corrects itself on the next
> render. Nothing else pushes it. Otherwise the snapshot refreshes on a 60-second stale time, on
> window focus, and on a purchase — in the buying tab and, via broadcast channel, in every other tab
> of the same browser. A purchase made in a *different* browser or on another device can therefore
> take up to a minute, or one window focus, to clear the lock here.

The client fails **open** in every other direction. If `/entitlements/me` errors, it falls back to
a fully permissive snapshot: an outage must never paywall a paying customer, because the 402 at the
API is the real boundary. The one exception is a `401`, which is rethrown and retried — treating
"ask again once you have a token" as "entitled to everything" is exactly how the entire lock system
would silently disable itself.

Server-side the posture matches. A failed policy read reuses the last good snapshot, or falls back
to enforcement `off`. A failed tier resolution or quota count allows the action. A database problem
degrades to an unlocked product, never to a paywalled one.

## Endpoints

All of these resolve your organization from the JWT. None of them accept an organization
parameter, so there is no cross-organization view.

```http
GET /entitlements/me
GET /tokens/balance
GET /tokens/transactions?limit=50&cursor=LAST_ID
POST /tokens/estimate
GET /tokens/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=IANA&granularity=day|week|month
GET /ai-tokens/balance
GET /ai-tokens/transactions?limit=50&cursor=LAST_ID
GET /organizations/me/usage-dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD&tz=IANA
```

| Endpoint | Access | Notes |
|---|---|---|
| `GET /entitlements/me` | Any authenticated user | No permission check — everyone may read what their own organization is entitled to |
| `GET /tokens/balance` | Any authenticated user | `{ balance, tokens_depleted_at }` |
| `GET /tokens/transactions` | Any authenticated user | Newest first, keyset paged. `limit` default 50, max 200 |
| `POST /tokens/estimate` | Any authenticated user | Body `{ operation, params }`. Advisory only. An unknown operation returns `406` |
| `GET /tokens/analytics` | Owner or admin | Otherwise `403 Only organization owners and admins can view token analytics` |
| `GET /ai-tokens/balance` | Any authenticated user | `{ balance, tokens_depleted_at }` |
| `GET /ai-tokens/transactions` | Any authenticated user | Same paging contract as the compute ledger |
| `GET /organizations/me/usage-dashboard` | Owner only | Otherwise `403 Only the organization owner can view the usage dashboard` |

For the analytics and dashboard endpoints, `to` defaults to today, `from` to twelve months before
`to`, and `tz` to `UTC`. A `from` later than `to` returns HTTP `400` with the message
"`from` must be on or before `to`". `GET /tokens/analytics` additionally validates its own two
parameters — an unrecognised `granularity` or an implausible `tz` returns `400`; the usage-dashboard
endpoint has no granularity parameter and does not validate `tz`.

`POST /tokens/estimate` takes a body, not a query string:

```json
{
  "operation": "optimization",
  "params": { "cpu": 1.0, "data": 1.0, "time": 1.0, "mem": 0.0, "n_trials": 1000 }
}
```

and answers, inside the standard `data` envelope,
`{ "operation": "optimization", "estimated_cost": 300, "balance": 1250 }` — because
`ceil(0.3 × 1000)` is 300.

There are no public write endpoints for either ledger. Credits and reversals travel over internal,
shared-key routes used by the Stripe service and the reconciler; consumption is only ever debited
in-process at a choke point. The purchase routes on the Stripe service —
`GET /payments/token-packages`, `POST /payments/create-token-checkout`,
`GET /payments/ai-token-packages`, `POST /payments/create-ai-token-checkout` — are all owner-gated.
