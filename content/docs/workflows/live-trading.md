---
title: Live trading
section: Workflows
sectionOrder: 5
order: 3
published: true
updated: 2026-09-01
summary: Connect a brokerage account, deploy a portfolio group to trade it, and monitor and manage the operation that results.
keywords: live trading, paper trading, broker, alpaca, connect broker, deploy, operation, orders, reconciliation, monitoring, end of day
---

Live trading is the last stretch of the workflow: you link a brokerage account to Fintela, point a [portfolio group](/docs/portfolio-groups) at it with a capital figure, and let the platform turn that group's daily target weights into real orders. The unit you deploy is called an **operation** — one portfolio group running against one broker connection, with its own capital, its own status, and its own rebalance clock. Everything on this page moves money, or decides whether money moves, so read the prerequisites before you connect anything.

> [!CAUTION] This places real orders
> An operation submits orders to your brokerage account through your own credentials. Fintela does not guarantee any trading outcome, and a backtest is not a forecast. Validate on a paper connection first — the workflow is identical to live.

## Before you connect anything

Four things have to be true before an operation can launch. Each one is checked automatically, so skipping a step gets you a clear refusal rather than a bad trade.

| Prerequisite | Where to get it |
|---|---|
| At least one **promoted portfolio** | Promote a trial from the [Portfolios dashboard](/docs/portfolios-dashboard) — see [promoted portfolios](/docs/promoted-portfolios) |
| A **portfolio group** holding those portfolios | Build one in the [Portfolio Groups](/docs/portfolio-groups) registry |
| **Daily update** switched on for the group, with every member actually scheduled and current | Set this on the group's structure page. A group with stale or unscheduled members can't launch |
| **Live trading included on your plan**, plus broker permissions | See [tokens and billing](/docs/tokens-and-billing). If it isn't part of your plan, you'll see a message naming the locked feature |

Different actions in this flow require different permission grants, which is why one teammate might be able to edit a portfolio group freely but not connect a broker or launch it, while another can launch and manage live operations without being able to touch the underlying strategies. Your organization's admin controls who can do what.

> [!NOTE] Members must be built directly in Fintela
> Every member of a group you want to trade live has to support Fintela's daily automatic updates — and for live trading, that means it has to be built with Fintela's own strategy editor. A portfolio built on an [external strategy](/docs/external-strategies) is rejected everywhere in this flow. External **risk managers** are different: they're consulted as part of the daily update inside a live operation, even though the editor doesn't currently let you save one — see [execution modes](/docs/execution-modes).

## Connect a brokerage account

Broker connections live on the Account page, in a card titled **Broker connections**. Its own description explains the deal plainly: *"Connect your brokerage account so live operations can place orders on your behalf. Your credentials are encrypted and never stored in readable form."*

**Alpaca** is the only supported broker today. Trying to connect anything else is rejected outright.

### The connect dialog

Click **Connect broker** to open the **Connect your brokerage** dialog. It has one shared header and two mutually exclusive ways to link your account.

| Field | Label | Notes |
|---|---|---|
| Name | **Connection name** | Required. Helper text: *"Used to identify this connection across operations."* Both connect buttons stay disabled until it's filled in, and leaving it empty is refused with a message asking for a name |
| Environment | **Environment** | Two options: **Paper (recommended)** and **Live (pending approval)**. The live option is currently disabled |

Then pick a path:

| Path | Control | What happens |
|---|---|---|
| Connect with Alpaca (recommended) | *"Link your existing brokerage account securely — no API keys to copy or store."* | You're redirected to Alpaca's own login page, authorize Fintela to trade on your behalf there, and are brought straight back once you approve it. Your Alpaca username and password are never seen by Fintela |
| Connect with API key (advanced) | Reveals **API Key ID** and **API Secret** fields, then **Connect with API key** | You paste in an API key pair generated from your own Alpaca account settings |

Either way, your credentials are checked directly against Alpaca **before** anything is saved. If Alpaca rejects them, you'll see a message telling you the credentials weren't accepted — double-check what you copied, or that the key is still active on Alpaca's side. A successful API-key connection toasts **Brokerage connection added and verified**; a successful Alpaca login returns you to the Account page with **Brokerage account connected and verified.**

The dialog also shows Alpaca's required authorization disclosure and links to Fintela's Terms of Use and Privacy Policy. Fintela only ever asks for trading access on the connection — never for your market-data subscriptions, since the research and analysis you do in Fintela already runs on Fintela's own market data.

> [!WARNING] One connection per environment
> You can have only one active connection per broker per environment — one paper connection today, and (once it opens) one live connection. Trying to add a second while one is already active is stopped before you even reach Alpaca's side, with a message telling you to disconnect the existing one first. A connection you've previously disconnected is the one exception: reconnecting the same account restores it in place and keeps its full history, rather than starting over.

### How your credentials are protected

However you connect, your broker credentials are encrypted before they're stored, and Fintela never shows them back to you — or to anyone else — once you've entered them. Not in the connections list, not to Fintela support. What you see for a connection is limited to things like its name, provider, environment, status, and when it was last verified; there's no screen anywhere that reveals the underlying key or token again.

If a key needs to change — say, because you regenerated it on Alpaca's side — rotating your credentials swaps in the new ones right away, without pausing or interrupting anything the connection is actively trading.

### The connections table

Each connection you've added is one row.

| Column | What it shows |
|---|---|
| **Name** | The name you gave the connection. If the last check failed, the reason appears underneath |
| **Provider** | The broker — currently always Alpaca |
| **Environment** | A chip reading **paper** or **live** (live is shown in orange) |
| **Auth** | Whether you connected with an API key or through Alpaca's own login |
| **Status** | A chip reading **active** (green), **revoked** (red), or **error** (amber) |
| **Last verified** | When Fintela last successfully checked the credentials, or a dash if never |

The empty state reads **No broker connections yet. Click Connect broker to add one.** A load failure reads **Failed to load connections. Try refreshing.**

When any connection is **revoked**, a banner appears above the table: **1 connection has been revoked.** (or **{{count}} connections have been revoked.**) with the detail **Operations using revoked connections are paused automatically until you reconnect. To remove an operation on a revoked connection, open the portfolio group and use Force stop (positions are not liquidated automatically).**

### Re-verify, rotate, disconnect, delete

Four actions on each row, in increasing order of consequence.

| Action | What it does |
|---|---|
| **Re-verify** | Re-checks the credentials with Alpaca and updates status and last-verified time. Success toasts **Connection re-verified** |
| **Rotate credentials** | Replaces the stored key or secret with a new one, in place. The new credentials are checked with Alpaca first, and success clears any prior revoked or error status |
| **Disconnect** | Marks the connection revoked but keeps its full history, so you can connect a different account into the same slot later |
| **Delete** | Permanently removes the connection, along with any of its already-stopped operations |

Rotation is the right move for a key that's leaked or about to expire — running operations keep trading right through it and simply pick up the new credentials automatically. It's deliberately allowed even while operations are live. Connections made through Alpaca's own login can't be rotated this way; the dialog says so directly: *"This connection uses "Connect with Alpaca" (OAuth). To refresh it, reconnect through your brokerage — API-key rotation does not apply."*

> [!CAUTION] Delete is destructive and irreversible
> The confirmation states exactly what goes: *Delete connection "{{name}}"? This permanently removes its stopped operation records, EOD reconciliation history, risk limits and kill-switch state. Your portfolio groups and their trade history are kept. Live portfolio groups (running or paused) must be stopped first. To just swap accounts, use Disconnect instead.*

Both **Disconnect** and **Delete** are blocked while any operation on the connection is still running or paused — you'll see a message asking you to stop those operations first. That ordering matters: stopping the operation while the credentials still work is what lets Fintela sell out of the positions cleanly before you take the connection away.

## Paper and live

Paper versus live is a property of the **connection**, decided when you connect the account — there's no separate paper/live switch anywhere in the deploy flow, and none on the operation itself. Every operation on a paper connection is paper; to go live, you connect the live account as a separate connection and create a new operation against it. The workflow looks identical either way.

Paper trading runs the entire pipeline — the same weights, the same order planning, the same reconciliation, the same reports — against Alpaca's paper account and its simulated capital, so it's a faithful rehearsal of live trading, not a simplified preview of it.

> [!WARNING] Live connections aren't enabled yet
> The Environment selector shows **Live (pending approval)** as a disabled option today, and any attempt to force it through is refused the same way. Real-money live trading isn't enabled for any Fintela account yet — it's waiting on Alpaca's approval of Fintela's brokerage integration. Paper trading is fully available today and uses the exact workflow live trading will use once it opens.

A connection is unique per environment, and an operation is unique per group-and-connection pair — so once live trading opens, the same portfolio group will be able to run paper and live side by side, each on its own connection.

## Deploy a portfolio group

There are two ways to deploy, and they lead to the same place.

| Entry point | Where | What happens |
|---|---|---|
| **Deploy Portfolio Group** | A row action on the Portfolio Groups registry | Creates the operation **and** launches it in one step. Disabled if the group has no members |
| **Trade with your brokerage** | The group's own **Operations** tab | Creates the operation as a **draft** only — you launch it yourself afterward from the operation's row |

Either dialog only asks for what the group doesn't already carry — the group itself owns the allocation method, the rebalance cadence, the execution policy, and the protective exits. The fields below are from the **Trade with your brokerage** dialog; the registry's one-step deploy dialog asks for the same connection, capital and name, without the execution override.

| Field | Label | Rule |
|---|---|---|
| Connection | **Brokerage account** | Only active connections appear, defaulting to the first. Each option shows the connection's name and its environment |
| Capital | **Capital to trade ($)** | Minimum $1, in $100 increments. Must be greater than zero |
| Name | **Name (optional)** | A free-text label — placeholder example: **Paper $10k** |
| Execution override | **Override execution policy for this operation** | Off by default. When on: **Order type** (market or limit), **Time in force** (day or good-till-cancelled), and a **Limit offset (bps)** for limit orders |

With no active connection, the dialog shows a guided empty state titled **Connect your brokerage account**: *"You need to link your brokerage credentials before you can trade this portfolio group. Add a connection under Account settings → Broker connections, then come back here."*

Creating an operation does not trade. The dialog's own footer says so: *Next: review it, then **Launch** to place the first orders.* The confirm button reads **Create operation**.

> [!CAUTION] Launch is the irreversible step
> **Launch** flips the operation to Active, and the platform places the initial buy on its next check-in. The confirmation dialog is titled **Launch operation** with the body *"Fintela will place the initial buy on its next cycle."* Nothing before this point sends an order.

More detail on these fields, and on what each deploy outcome means, is covered on the [Portfolio Groups](/docs/portfolio-groups) page.

### What the launch preflight checks

Creating an operation runs a light check; **launching** runs the full one; and **resuming** re-runs the safety-critical part of it. If a check fails, you'll see a message naming exactly what to fix — nothing is created or started partially.

| Check | Fails when | Create | Launch | Resume |
|---|---|---|---|---|
| Connection | The connection isn't active, or isn't yours | yes | — | — |
| Capital | The capital amount isn't greater than zero | yes | — | — |
| Capital limit | The capital amount exceeds this connection's trading limit | — | yes | — |
| Duplicate | The group already has an operation on this connection | yes | — | — |
| Membership | The group has no active members | yes | yes | — |
| Execution mode | A member's strategy runs outside Fintela's daily automatic updates | yes | yes | — |
| Daily update | Daily update is switched off on the group | yes | yes | yes |
| Daily schedule | A member isn't scheduled for daily updates | — | yes | yes |
| Freshness | A member's data is out of date | — | yes | yes |
| Meta-portfolios | A portfolio built from other portfolios hasn't yet been flattened into individual holdings | — | yes | yes |
| Shorts | A member holds a short crypto position, or a short equity position on an account not enabled for short selling | — | yes | yes |
| Endpoint security | A member's external risk manager can only be reached over an unencrypted connection | — | yes | yes |
| Execution config | The order type or time-in-force you've chosen isn't supported for rebalancing | yes, for a per-operation override | yes, for the effective setting | — |

The split matters: a group can be edited between create and launch, so daily update being on when you created the operation is no guarantee it's still on by the time you launch. Freshness and scheduling only matter at the moment capital actually goes out, which is why they're checked at launch. Resume shares the same safety checks, so a member that drifted into an unusable or stale state while the operation was paused can't be silently reactivated.

Three things deserve a closer look:

- **Ownership.** Only you (within your organization) and the owner of the connected broker account can launch, pause, resume, stop, force stop, rebalance, or acknowledge drift on an operation. If you don't meet that bar, the operation simply won't be something you can act on — being able to see a portfolio group is not the same as being able to trade someone else's account.
- **Shorting.** Fintela periodically checks whether your brokerage account is approved for short selling. If that's confirmed disabled, launching a group that holds short equity is blocked. If it hasn't been checked yet, the launch isn't blocked on this basis alone — but an order that would open a disallowed short is still rejected the moment it's actually placed, so you're protected either way.
- **Unencrypted risk-manager endpoints.** If a member's external risk manager can only be reached over an unencrypted connection, the launch attempt itself surfaces a dialog titled **This endpoint is unencrypted**, with a checkbox reading **I understand, and I accept the risk for this operation** and an action labeled **Trade anyway**. You have to accept this every single time — it's never remembered — so an insecure setup can never quietly launch trades without your active consent.

## What an operation is

An operation is the pairing of one portfolio group with one broker connection — think of it as "this group, trading through this account." A group can have at most one operation per connection.

For each operation, Fintela tracks things like its name, the capital assigned to it, its current status and the status you've asked for, when it last rebalanced, when it's next due, and any execution settings you've overridden specifically for it.

| Status | Meaning |
|---|---|
| **Draft** | Created, never launched. No capital at work |
| **Active** | Trading — rebalances and daily syncs run |
| **Paused** | Positions held, automatic rebalancing stopped |
| **Stopped** | Liquidated and finished. History is kept |

### Lifecycle

Fintela tracks two things for every operation: what you've asked for, and what's currently true. Most of the time these match instantly, but right after you take an action there's a brief window — one trading cycle — before it takes effect. During that window the operation's row shows an extra chip reading **→ {{status}}**, so you can see a change is in progress.

```text
   ┌──────────────────── Re-initiate ─────────────────┐
   │                                                  │
   ▼           Launch                     Stop        │
 DRAFT ────────────────────► ACTIVE ────────────────► STOPPED
                              │  ▲                     ▲
                        Pause │  │ Resume       Stop   │
                              ▼  │                     │
                             PAUSED ───────────────────┘
```

Trying an action that doesn't make sense for an operation's current state is refused with a clear explanation of why. The only way from Draft to Active is through Launch itself — there's no shortcut.

| Action | Effect on positions |
|---|---|
| **Launch** | Places the initial buy |
| **Pause** | Keeps every position; stops automatic rebalancing |
| **Resume** | Rebalances back into the market |
| **Stop** | Liquidates the positions this operation opened, then seals it |
| **Force stop** | Marks the operation Stopped locally. **Positions are not sold** |
| **Re-initiate** | Returns a stopped operation to Draft so it can be launched again; history is kept |
| **Rebalance** | Requests an immediate recompute; carried out on the next check-in |

> [!CAUTION] Stop liquidates; Force stop does not
> **Stop** sells what this operation bought and is final. **Force stop** exists only for when the connection is revoked or erroring and Fintela genuinely can't place a sell order — it clears the operation locally and leaves your broker positions exactly as they are. Its own warning is explicit: *"Your broker positions are **NOT** sold. Close any open positions manually in your brokerage."* If the connection is healthy, Force stop is blocked — you'll be told to use Stop instead, since Stop is what actually gets you out of the positions.

> [!NOTE] The exit is never locked by your plan
> Only actions that add exposure require the live-trading feature on your plan: connecting a brokerage account, creating an operation, launching, and resuming to Active. Pausing, stopping, force-stopping, and returning to Draft stay available on every plan, so you can always get out.

Manual rebalance carries two limits, both designed to keep the platform stable when you're active:

| Limit | Rule | What you'll see |
|---|---|---|
| Cooldown | At most one manual rebalance request every 60 seconds | A message asking you to wait a bit before trying again |
| Order backlog | At most 50 unsettled orders on an operation at once | A message asking you to try again shortly, once earlier orders clear |

## How orders reach the broker

All order placement is handled automatically and centrally by Fintela, never by more than one process at a time. That's a deliberate safety guarantee: your account can never be traded by two conflicting processes at once, even during a routine update on Fintela's side.

### How often Fintela checks in

Fintela runs a few independent check-ins at different paces. The cadences below are defaults and can be tuned for the platform as a whole.

| Pass | Roughly how often | What it does for you |
|---|---|---|
| Rebalance & status check | About every 30 seconds | Carries out any pending launch, pause, stop or rebalance, and runs daily syncs |
| Live order updates | About every minute | Keeps order statuses (submitted → filled) current in near real time for every active operation |
| Connection health check | At most every 5 minutes per connection | Re-checks your broker credentials and updates when they were last verified |
| End-of-day reconciliation | Once per trading day per connection, after markets close | Cross-checks the full day against your broker's own record of activity |

Every check-in also clears out stale orders and tidies up ones that failed for good. Buy orders that are waiting on funds are released quickly too — usually within seconds of the matching sell filling, with the regular check-in as a backup in case that doesn't happen on its own.

### One trading cycle, step by step

A cycle runs when you launch an operation, when a scheduled rebalance comes due, when you request a manual rebalance, or as a **daily sync** — a lighter pass that follows each member's own day-to-day moves without recomputing the group's target weights from scratch. Every cycle works through the same sequence:

1. If there's unresolved position drift on the operation, nothing is planned until you acknowledge it.
2. If the previous cycle is still settling, this one is skipped and retried on the next check-in.
3. Target weights are updated — a full rebalance re-derives every member's weight from scratch, while a daily sync reuses the last computed weights.
4. If any member's data is stale, or isn't scheduled for daily updates, the cycle is blocked.
5. Fintela fetches your live positions from the broker, compares them against its own records, and automatically reconciles anything the broker's own data explains.
6. Target dollar amounts are calculated per holding, net of what you already hold; changes smaller than $1 are skipped as not worth trading.
7. Any resting protective stop on a symbol about to be traded is cancelled first, so it can't conflict with the new order.
8. Equity orders wait for the market to be open — crypto trades continuously, so this doesn't apply to it.
9. Account-level restrictions are respected: a frozen account is skipped entirely, and pattern-day-trading limits cause new opening trades to be dropped rather than risk a violation.
10. Any order that would trade against another one of your own operations on the same account is dropped, so you're never on both sides of your own trade.
11. Sell orders — and buy orders that close a short position — are sent to the broker immediately. Buy orders that would add new exposure are logged as reserved, not yet sent.
12. Those reserved buys are released and actually submitted as that same cycle's sell proceeds come in.

Two things about this sequence are worth remembering, because they explain most of what you'll see in the Orders tab.

**Sells first, buys held.** When a rebalance sells some things and buys others, the sells (and any buy that closes a short position) go out right away. The new buys, though, are logged with a status of **Awaiting funds** — reserved, not yet sent. They're released and submitted as that same cycle's sell proceeds settle, plus whatever capital in the operation hasn't been put to work yet. This keeps every operation's spending strictly within its own assigned capital, even when several of your operations share the same brokerage account — one operation can never spend another's cash. A buy still waiting for funds after about 5 minutes is cancelled rather than left to draw on the account's shared buying power.

**Your order-type setting is a ceiling, not a script.** Orders that must fill — a sell to free up cash, closing a short position, or any crypto order — are always sent as market orders. A regular long buy, on the other hand, is always sent as a limit order priced with a small buffer above the current reference price, so it's very likely to fill immediately while capping the worst price you could actually pay. If you configured Market for the operation, that buffer defaults to 1%; if you set a specific limit offset instead, that's the buffer used.

Only **Market** and **Limit** are available for rebalancing — Stop, Stop-limit and Trailing-stop aren't accepted here, since those order types are reserved for the protective exits configured separately on the portfolio group. On time in force, only **Day** and **Good-till-cancelled** are honored on a buy order; any other choice is treated as Day at the moment the order is sent. Crypto buy orders are always Good-till-cancelled, since crypto markets trade continuously and have no single trading day to expire against.

### Order log statuses

Every order Fintela plans is one row, visible in the operation's **Orders** tab — including ones a safety limit stopped before they ever reached the broker.

| Status | What it means | Shown as |
|---|---|---|
| Pending | Logged, not yet sent to the broker | **Pending** |
| Held | A buy order reserved against this cycle's incoming cash, waiting to be funded | **Awaiting funds** |
| Submitting | Briefly shown while a held buy is being released and sent | **Submitting** |
| Submitted | Accepted by the broker | **Submitted** |
| Working | Resting open at the broker — a limit order, a good-till-cancelled order, or a protective stop. Fintela accounts for these automatically and never mistakes them for drift | **Working** |
| Partially filled | Part of the order has executed | **Partially filled** |
| Filled | Fully executed | **Filled** |
| Cancelled | Cancelled, by you, by Fintela, or by the broker | **Cancelled** |
| Failed | Rejected by the broker, or stopped by one of Fintela's safety limits before it was ever sent | **Failed** |

Each order also shows the broker's own order id, its asset class (equity or crypto), whether it's a buy or sell, whether it opens a long or short position, the quantity, order type, limit price, fill price, and timestamps — along with whether it was triggered automatically or requested manually, and the broker's own rejection reason when it fails. Every order carries a unique identifier, so even if something is retried, you'll never end up with the same order placed twice.

### Safety limits

These are platform-level safety limits, shown for reference in the **Trading Limits** card under Broker connections. They're set by your Fintela administrator, and a change may take a short while to take effect across the platform.

| Limit | Default | What happens if you exceed it |
|---|---|---|
| **Max per order** | $50,000 | The order is logged as **Failed** and never reaches the broker; other orders in the same batch still go through. This only applies to orders that add exposure — an order that closes a position is sized by the position itself and is never capped |
| **Max per batch** | $250,000 | Orders that add exposure are trimmed to whatever headroom remains, and the rest carry over to the next rebalance, so a large move into new positions phases in over a few cycles rather than all at once. This limit is shared across every operation on the same connection. Orders that close a position are never capped |
| **Drift tolerance** | 1% | The share-count difference above which rebalancing pauses until you acknowledge the drift |
| **Buying-power check** | Off | Fintela automatically limits each operation to spending only what it's actually been allocated (and what your broker account can genuinely support), so operations sharing one brokerage account can never spend each other's cash. Sell orders are never affected |
| **Kill switch** | Off | When on, no new orders go out from any rebalance on this connection. Orders from a Stop (liquidation) still go through |

The card's own description is the rule: *"Platform-wide defaults applied to every order an account places. These defaults are set by your Fintela administrator and can't be changed from this page; a connection can override them under Per-account overrides below, and an override replaces the default shown here for that connection."*

**Per-account overrides** let you set **Max per order ($)** and **Max per batch ($)** for a single connection — tighter or looser than the platform default. Leave a field blank to use the default; entering zero or a negative amount isn't allowed. This interacts with launch: an operation whose capital exceeds the connection's effective limit is refused at launch, with a message naming both figures and telling you to lower the capital or raise the connection's limit.

> [!NOTE] Emergency exits are never capped
> A Stop liquidation ignores the kill switch and the per-batch cap, and the per-order cap doesn't touch it either. Every order in a Stop is closing an existing position, sized exactly to what it's closing — capping it could leave you stuck holding (or short) a position you were trying to exit, and an open short position that can't be closed carries unlimited risk.

## Monitoring an operation

The Operations tab lists every operation on the group. Each row shows its name or connection, the connection and capital, **Last rebalanced:** with a date, and a **Next:** date once one is known. The next-due date stays blank until the operation has actually rebalanced once, if the group doesn't rebalance on a schedule, or if the next scheduled date isn't a known trading day yet.

Expanding a row reveals five read-only tabs.

| Tab | What it shows you |
|---|---|
| **Allocations** | A snapshot of each member's target weight at every rebalance, and what triggered it |
| **Orders** | Every order Fintela has planned or sent, with the broker's own reference, its status, fills and any rejection reason |
| **Activity** | A timestamped log of every state change on the operation — what happened, and what triggered it |
| **Reconciliation** | One row per trading day, from the end-of-day audit against your broker's records |
| **Positions** | Live positions on the entire brokerage account behind the connection |

Two of these are worth a closer look.

**Activity is recorded at the same instant as the change it describes.** Launching an operation logs who started it in the very same step as flipping it live — if that record can't be written, the action doesn't happen either. That's what makes the Activity log a trustworthy account of everything that happened.

**Positions is account-wide, not per group.** It reads your broker connection directly and is badged **Account-wide**, with the caption *"Live positions on the entire brokerage account behind this connection — the whole account, not segmented by portfolio group."* Anything held by a sibling operation, or by your own manual trading on that account, appears here too. When the connection is unusable it renders **Couldn't load — the broker connection may be revoked or your brokerage is unreachable.**

Full column lists for each tab are on the [Portfolio Groups](/docs/portfolio-groups) page.

### Position drift

Drift is a mismatch in **share count** between your broker's reported position and Fintela's own records, beyond the drift tolerance. Price movement alone never causes it — only actual share-count differences do. Drift is checked on every rebalance, and again at the end of the day.

Fintela first tries to explain any mismatch using evidence from the broker itself — a late fill you placed outside Fintela, or a known corporate action like a split — and only flags what's genuinely unexplained. When it does, the operation shows a warning banner: **Position drift detected — rebalancing is blocked until acknowledged.**, with a per-symbol breakdown in columns **Symbol**, **Expected**, **Broker**, **Drift**, and a note reading **Unexplained — check broker account** or **Possible corporate action ({{types}}) — review**. Quantities are shown at full precision, never rounded.

> [!CAUTION] Acknowledging drift is a real-money action
> **Acknowledge** opens a confirmation titled **Acknowledge position drift**: *"This reconciles Fintela's ledger to the broker's reported positions and resumes trading. The next rebalance then re-establishes the portfolio group from the broker's actual holdings — a real-money, irreversible action."* Its warning adds: *"Only acknowledge after you have reviewed the drift above and trust the broker's current positions."* Check your broker account before you click it.

## End-of-day reconciliation

Once every closed trading day, for every connection, Fintela pulls your broker's own record of account activity and cross-checks it against its own records. This is the most thorough check of the day, and it catches things the constant real-time checks can miss — like a fill Fintela never logged, or an operation that's been sitting Active with no scheduled rebalance and so hasn't had its positions checked in a while.

This check runs efficiently in the background without slowing anything else down. If it's been missed for a stretch — say, during an outage — Fintela catches up gradually, checking roughly a week of backlog at a time per connection, rather than trying to reconcile everything at once. A day that can't be fully verified is never marked clean; Fintela simply retries it on the next pass.

Results land in the **Reconciliation** tab, one row per day per scope.

| Column | Contents |
|---|---|
| **Day** | The trading day reconciled |
| **Scope** | **Operation** for this operation's own report, **Account** for the connection-level, account-wide summary of that day |
| **Outcome** | **Clean** when nothing diverged, **Discrepancies** otherwise |
| **Fills matched** | How many broker fills were attributed to this operation |
| **Discrepancies** | A summary count of fill, position and non-trade activity findings, with the raw detail on hover |
| **Ran at** | When the check ran |

A fill only counts against a specific operation when Fintela can clearly match it to an order it placed. Anything else on the account — a sibling operation's fill, or a trade you placed yourself directly with your broker — is tallied separately at the account level as outside activity, and is never flagged as a problem with this operation. A position mismatch that survives this automatic matching blocks the next rebalance, the same way intraday drift does.

The empty state reads **No reconciliation yet (runs end-of-day).**

### P&L digests

On the same daily cadence, and checked separately so a reconciliation issue never suppresses them, Fintela sends gain/loss notifications per live operation:

| Family | When it fires |
|---|---|
| Daily, weekly, monthly | On the day, and when a new week or calendar month opens |
| Inception milestones | At one, two, three and four weeks old, then every month from month two onward. Only the highest milestone reached is sent, so an operation that's already months old on its first pass gets one notification, not the whole sequence |

Notifications go to the **connection owner** — the person whose capital is actually at risk — not to whoever created the group, since a group is visible to your whole organization.

> [!NOTE] The digest number is a modeled figure
> The percentage is calculated from your operation's total value at the start and end of each period, using only days where every member has a value, so each member is weighted by whatever starting capital its source trial happened to have. The dollar figure is that percentage applied to the operation's capital. That's not the same basis as the group's allocation- and rebalance-aware performance chart in [Portfolio Manager](/docs/portfolio-manager), and the two figures can disagree. Neither one is your brokerage account statement — for the actual realized figures, read the **Orders** and **Reconciliation** tabs.

## Emergency controls

Two controls sit above everything else and are always available.

**Stop all trading** is on the Broker connections card. It halts every one of your active accounts at once, and the confirmation states exactly what it does and doesn't do: *"This halts new order placement on all your active broker accounts on the next cycle. Liquidations and Stops still run. You can resume anytime."* While a halt is engaged, a banner reads **Trading is halted on {{count}} accounts. New orders are blocked; liquidations still run.** with a **Resume trading** action.

**Pause** and **Stop** on the operation itself remain available on every plan and are never locked by an entitlement.

> [!NOTE] The full platform-wide halt is Fintela-operated
> The complete platform-wide trading halt can only be triggered by Fintela's own operations team, not from your account — an attempt to trigger it yourself is refused. The **Stop all trading** button gives you the equivalent control over every one of your own connected accounts, which covers everything you'd actually need in an emergency.

## Failure modes

Fintela never shows you a broker's raw error text — that can be cryptic and sometimes carries account-specific details that aren't meaningful to display. Instead, every broker rejection is translated into one of these plain messages.

| Situation | What you see |
|---|---|
| Credentials rejected | **Fintela can no longer authenticate with your broker. Reconnect the account to restore access.** |
| Insufficient buying power | **Your broker rejected this order for insufficient buying power. Add funds or reduce the order size.** |
| Market closed | **Your broker rejected this order because the market was closed at the time.** |
| Rate limited | **Your broker is rate-limiting Fintela right now. This clears on its own — no action needed.** |
| Account restricted or pattern-day-trader limit | **Your broker account has a restriction that blocked this order. Check your account status with the broker.** |
| Asset not tradable or not shortable | **Your broker won't trade this asset on your account. Remove it, or check with the broker whether it can be enabled.** |
| Broker unreachable | **Fintela couldn't reach your broker. This is usually temporary — it retries automatically.** |
| Anything unrecognized | **Your broker reported a problem with this request. Check your account with the broker, and contact support if it persists.** |

Beyond individual order rejections, four things change how a whole operation behaves.

**A revoked connection auto-pauses its operations.** If your broker credentials fail validation twice in a row, Fintela automatically revokes the connection and pauses every operation running on it — a single one-off failure, like a brief network hiccup, won't trigger this on its own, but a credential that's genuinely stopped working will. If an authentication failure happens during an actual trading action — a rebalance, releasing a held buy, or end-of-day reconciliation — the connection is revoked immediately rather than waiting for a second failure, since the request that needed your credentials is the one that just failed. The moment a connection is revoked, every operation on it is set to pause, so a revoked connection can never be seen still actively trading.

**Reconnecting does not auto-resume.** Reconnecting a revoked connection restores it in place, so any operations that were automatically paused survive — but they stay paused until you deliberately resume them. That's the safe default, not an oversight.

**A cycle that can't safely make progress skips itself rather than half-trading.** If the previous cycle is still settling, the equity market is closed, the account is frozen, a protective order can't be resolved, a stop cancellation hasn't been confirmed on a symbol about to trade, or an order would conflict with another one of your own live operations, Fintela simply skips that check-in and retries later — rather than executing a partial or risky trade.

**None of this can be triggered through the Developer API.** Every endpoint in the [Developer API](/docs/api-baskets) is read-only. There's no way to connect a broker, or create, launch, pause, stop or rebalance an operation with a personal access key, and there are no webhooks — the read endpoints exist so you can pull your results into your own tools and dashboards, and you poll them on your own schedule. Fintelligent, Fintela's AI assistant, is likewise given no access to your broker connections at all — see [Fintelligent capabilities](/docs/fintelligent-capabilities).

## What live trading does not guarantee

Every number you used to choose a strategy came from a backtest. Live execution differs from it in ways no simulation removes.

| Risk | Why it matters |
|---|---|
| Slippage | A limit order fills at a real spread, not a modeled close. Illiquid names can move meaningfully between when a trade is planned and when it fills |
| Timing | Orders are planned using the most recent complete trading day's data and placed on Fintela's next regular check-in during market hours — not the instant a signal appears |
| Price basis | Backtests are built on adjusted closes; live fills happen at real trade prices |
| Partial deployment | A batch that exceeds your per-order or per-batch limit phases in over several cycles rather than deploying all at once |
| Account state | A frozen account, pattern-day-trader limits, missing margin permissions, and non-shortable assets all bound what can actually be traded |

> [!CAUTION]
> Backtested performance does not guarantee future results. Size positions conservatively, run on paper until the behavior is boring, and watch the Orders and Reconciliation tabs closely in the first days of any deployment.
