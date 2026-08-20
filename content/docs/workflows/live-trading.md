---
title: Live trading
section: Workflows
sectionOrder: 5
order: 3
published: true
updated: 2026-08-20
summary: Connect a broker, deploy a portfolio group, and run and monitor an operation.
keywords: live trading, paper, broker, alpaca, connect, deploy, operation, orders, reconciliation, monitoring, eod
---

Live trading is the last stretch of the workflow: you link a brokerage account to Fintela, point a [portfolio group](/docs/portfolio-groups) at it with a capital figure, and let the platform turn that group's daily target weights into real orders. The unit of deployment is an **operation** — one group running against one broker connection, with its own capital, its own status and its own rebalance clock. Everything on this page moves money, or decides whether money moves, so read the prerequisites before you connect anything.

> [!CAUTION] This places real orders
> An operation submits orders to your brokerage account through your own credentials. Fintela does not guarantee any trading outcome, and a backtest is not a forecast. Validate on a paper connection first; the workflow is identical.

## Before you connect anything

Four things have to be true before an operation can launch. Every one of them is enforced server-side, so skipping a step produces a refusal rather than a bad trade.

| Prerequisite | Where it comes from |
|---|---|
| At least one **promoted portfolio** | Promote a trial from the [Portfolios dashboard](/docs/portfolios-dashboard). See [promoted portfolios](/docs/promoted-portfolios) |
| A **portfolio group** holding those portfolios | [Portfolio Groups](/docs/portfolio-groups) registry |
| **Daily update** switched on for the group, and every member actually scheduled and current | The group's structure page. A group whose members are stale or unscheduled cannot launch |
| The `broker_paper_trading` entitlement, plus the broker permissions | Locked features return HTTP `402` with `"feature": "broker_paper_trading"`. See [tokens and billing](/docs/tokens-and-billing) |

Permissions come in two families, which is why a user can be able to edit a group and still be unable to deploy it.

| Action | Realm permission |
|---|---|
| List, create, verify, rotate, disconnect or delete a broker connection; read positions, trading limits, risk limits and the kill switch | `broker_connection:manage` |
| Read operations, allocations, orders, activity and EOD reports | `broker_tracking:read` |
| Create an operation | `broker_tracking:create` |
| Launch, pause, stop, force stop, rebalance, acknowledge drift, set a per-operation execution override | `broker_tracking:update` |

> [!NOTE] Members must be Internal strategies
> A portfolio group member has to daily-extend, and managed mode supports `INTERNAL` only. A portfolio built on an [external strategy](/docs/external-strategies) is rejected at every entry point. External **risk managers** are a different surface: the daily extend does call them inside a live operation, though the editor cannot currently save one — see [execution modes](/docs/execution-modes).

## Connect a brokerage account

Broker connections live on the Account page at `/account`, in the card titled **Broker connections**. Its description states the storage contract plainly: *"Connect your brokerage account so live operations can place orders on your behalf. Credentials are envelope-encrypted with AWS KMS."*

**Alpaca** is the only supported provider. The backend rejects anything else with `provider must be 'alpaca', got '{value}'`.

### The connect dialog

Click **Connect broker** to open the dialog titled **Connect your brokerage**. It has one shared header and two mutually exclusive credential paths.

| Field | Label | Notes |
|---|---|---|
| Name | **Connection name** | Required. Helper text: *"Used to identify this connection across operations."* Both connect buttons stay disabled until it is filled, and the server refuses an empty name with `display_name is required` |
| Environment | **Environment** | Two options: **Paper (recommended)** and **Live (pending approval)**. The live option is rendered disabled |

Then pick a path:

| Path | Control | What happens |
|---|---|---|
| OAuth (primary) | **Connect with Alpaca** — *"Link your existing brokerage account securely — no API keys to copy or store."* | `GET /broker/connections/oauth/alpaca/start` mints a single-use `state` valid for 10 minutes and returns an authorize URL; the browser is redirected to Alpaca with scope `account:write trading`. Alpaca sends the browser back to a public callback, which exchanges the code for a bearer token server-side and creates the connection |
| API key (advanced) | **Connect with API key instead (advanced)** reveals **API Key ID** and **API Secret**, then **Connect with API key** | `POST /broker/connections` with `auth_type: "api_key"` |

Both paths verify the credentials against Alpaca (`GET /v2/account`) **before** anything is written. A rejection surfaces as HTTP `406` with `Broker credentials rejected by provider: broker rejected the credentials (401/403)`. On success the API-key path toasts **Brokerage connection added and verified**; the OAuth path returns to `/account` and toasts **Brokerage account connected and verified.**

The dialog also carries Alpaca's required authorization disclosure and links to Fintela's Terms of Use and Privacy Policy. No market-data scope is requested — Fintela runs its own data pipeline.

> [!WARNING] One connection per environment
> The uniqueness key is `(user, organization, provider, environment)`. A second attempt on an occupied slot returns HTTP `409` — `Duplicate connection for this (user, organization, provider, environment)` — and the OAuth start rejects it before redirecting, with the message **You already have an active brokerage connection for that environment. Disconnect it first to connect a different account.** A `revoked` row is the exception: reconnecting reclaims it in place, keeping the same `connection_id` and all history.

### How your credentials are stored

Credentials are envelope-encrypted and never leave the server in readable form.

| Step | What happens |
|---|---|
| Key generation | AWS KMS issues a fresh 256-bit data key per encryption |
| Encryption | The credential JSON is AEAD-encrypted locally with ChaCha20-Poly1305; the plaintext data key is zeroized as it leaves scope |
| Storage | `developers.broker_connections` holds `encrypted_payload`, `nonce`, `encrypted_data_key` and `kms_key_id` as separate columns. The plaintext is never persisted |
| Read back | The connection response shape has no credential field at all — `connection_id`, `keycloak_user_id`, `organization`, `provider`, `environment`, `auth_type`, `status`, `display_name`, `last_verified_at`, `last_error_message`, `created_at`, `updated_at`. There is no endpoint that returns a key or a token |
| Logging | The credential type has a hand-written debug implementation that prints a redaction placeholder in place of the secret and the access token, so no request struct can spill one into a log line |

The trading orchestrator decrypts fresh on each cycle, which is why rotating a key takes effect without tearing anything down.

### The connections table

Each connection is one row.

| Column | Contents |
|---|---|
| **Name** | Your `display_name`. A classified error message appears underneath when the last attempt failed |
| **Provider** | `alpaca` |
| **Environment** | Chip reading `paper` or `live`; `live` is coloured orange |
| **Auth** | `api_key` or `oauth` |
| **Status** | Chip reading `active` (green), `revoked` (red) or `error` (amber) |
| **Last verified** | Timestamp of the last successful credential check, or `—` |

The empty state reads **No broker connections yet. Click Connect broker to add one.** A load failure reads **Failed to load connections. Try refreshing.**

When any connection is `revoked`, a banner appears above the table: **1 connection has been revoked.** (or **{{count}} connections have been revoked.**) with the detail **Operations using revoked connections are paused automatically until you reconnect. To remove an operation on a revoked connection, open the portfolio group and use Force stop (positions are not liquidated automatically).**

### Re-verify, rotate, disconnect, delete

Four row actions, in increasing order of consequence.

| Action | Endpoint | What it does |
|---|---|---|
| **Re-verify** | `POST /broker/connections/{id}/verify` | Re-runs the credential smoke test and updates `status`, `last_verified_at` and `last_error_message`. Success toasts **Connection re-verified** |
| **Rotate credentials** | `PUT /broker/connections/{id}` | Replaces the stored secret **in place**. The new credentials are verified against Alpaca before they replace the old ones, and a success clears any prior `revoked`/`error` state. `provider` and `environment` are immutable and the new credentials must match the existing `auth_type` |
| **Disconnect** | `POST /broker/connections/{id}/disconnect` | Marks the connection `revoked` and keeps every record, so you can connect a different account into the same slot |
| **Delete** | `DELETE /broker/connections/{id}` | Purges the connection and its terminally dead (`DRAFT`/`STOPPED`) operations |

Rotation is the supported path for a leaked or expired API key — it keeps the `connection_id`, so running operations carry on and pick up the new secret on the orchestrator's next cycle. It is deliberately **not** blocked while operations are live. OAuth connections cannot be rotated this way; the dialog says so: *"This connection uses “Connect with Alpaca” (OAuth). To refresh it, reconnect through your brokerage — API-key rotation does not apply."*

> [!CAUTION] Delete is destructive and irreversible
> The confirmation states exactly what goes: *Delete connection "{{name}}"? This permanently removes its stopped operation records, EOD reconciliation history, risk limits and kill-switch state. Your portfolio groups and their trade history are kept. Live portfolio groups (running or paused) must be stopped first. To just swap accounts, use Disconnect instead.*

Both **Disconnect** and **Delete** are refused with HTTP `409` while any operation on the connection is `ACTIVE` or `PAUSED` in either status column: `This connection is still used by one or more live baskets (running or paused). Stop those baskets first, then delete the connection.` The order matters — stopping the operation while the credentials still work is what liquidates the positions cleanly.

## Paper and live

Paper versus live is a property of the **connection**, decided when you connect the account. There is no paper/live switch anywhere in the deploy flow, and none on the operation. Every operation on a paper connection is paper; to go live you connect the live account as a separate connection and create a new operation against it. The UI is identical either way.

Paper trading runs the entire pipeline — the same weights, the same order planning, the same reconciliation and the same reports — against Alpaca's paper account and its simulated capital.

> [!WARNING] Live connections are refused platform-wide today
> The environment selector shows **Live (pending approval)** as a disabled option, and the server enforces the same rule independently of the UI: creating an `environment: "live"` connection through either the manual or the OAuth path returns HTTP `403` with `Live (real-money) broker trading is not enabled on this platform yet. Use a paper connection.` The gate is the `ALLOW_LIVE_BROKER_TRADING` environment switch, which is off by default and stays off until Alpaca approves the Fintela OAuth app for trading on users' behalf. Paper is what ships today.

A connection is unique per environment, and an operation is unique per (group, connection) — so the same group is able to run paper and live side by side on two connections once live opens.

## Deploy a portfolio group

There are two entry points, and they create the same thing.

| Entry point | Where | Behaviour |
|---|---|---|
| **Deploy Portfolio Group** | Row action on the `/analysis/portfolio-groups` registry | Creates **and** launches in one go: `POST …/operations` followed by `PATCH …/operations/{opId}/launch`. Disabled when the group has no members |
| **Trade with your brokerage** | The group's **Operations** tab at `/analysis/portfolio-manager/{basketId}/operations` | Creates a `DRAFT` operation only. You launch it afterwards from the operation's row |

Either dialog collects only what the group does not already carry — the group owns the allocation method, the rebalance cadence, the execution policy and the protective exits. The fields below are the **Trade with your brokerage** dialog; the registry's bulk-deploy dialog collects the same connection, capital and name, has no execution override, and several of its labels currently render as raw i18n keys (documented on the [Portfolio Groups](/docs/portfolio-groups) page).

| Field | Label | Rule |
|---|---|---|
| Connection | **Brokerage account** | Active connections only; defaults to the first. Each option shows the display name and an environment chip |
| Capital | **Capital to trade ($)** | `min=1`, `step=100`. Must be greater than zero: `target_capital must be greater than 0` |
| Name | **Name (optional)** | Free label, placeholder **e.g. Paper $10k** |
| Execution override | **Override execution policy for this operation** | Off by default. When on: **Order type** (`market` or `limit`), **Time in force** (`day` or `gtc`), and **Limit offset (bps)** for a limit |

With no active connection the dialog shows a guided empty state titled **Connect your brokerage account**: *"You need to link your brokerage credentials before you can trade this portfolio group. Add a connection under Account settings → Broker connections, then come back here."*

Creating an operation does not trade. The dialog's own footer says so: *Next: review it, then **Launch** to place the first orders.* The confirm button reads **Create operation**.

> [!CAUTION] Launch is the irreversible step
> **Launch** flips the operation to `ACTIVE` and the orchestrator places the initial buy on its next cycle. The confirmation dialog is titled **Launch operation** with the body *"The orchestrator will place the initial buy on its next cycle."* Nothing before this point sends an order.

Field-by-field labels, dialog copy and the bulk-deploy outcome codes are documented on the [Portfolio Groups](/docs/portfolio-groups) page, which owns that surface.

### What the launch preflight checks

Creating an operation runs a light gate; **launch** runs the real one, and **resume** re-runs the shared money-safety block of it. A failing check refuses the request with HTTP `406 Not Acceptable` and a sentence naming the fix; nothing partial is written.

| Check | Refused when | Create | Launch | Resume |
|---|---|---|---|---|
| Connection | The connection is not `active`, or is not owned by you | yes | — | — |
| Capital | `target_capital` is not greater than zero | yes | — | — |
| Capital cap | `target_capital` exceeds this connection's effective per-tick notional cap | — | yes | — |
| Duplicate | The group already has an operation on this connection | yes | — | — |
| Membership | The group has no active members | yes | yes | — |
| Execution mode | A member uses an `EXTERNAL` strategy, which cannot daily-extend | yes | yes | — |
| Daily update | Daily update is off on the group | yes | yes | yes |
| Daily schedule | A member is not scheduled for daily updates | — | yes | yes |
| Freshness | A member's data is out of date | — | yes | yes |
| Meta-portfolios | A portfolio-of-baskets member has not been flattened yet | — | yes | yes |
| Shorts | A member holds short crypto, or short equity on an account not enabled for short selling | — | yes | yes |
| Endpoint security | A member's external risk manager is reached over plain `http` | — | yes | yes |
| Execution config | The order type or time in force is not supported for rebalancing | yes, for the per-operation override | yes, for the effective config | — |

The split matters: a group can be edited between create and launch, so daily update being on at create is no guarantee it is still on at launch. Freshness and scheduling are only meaningful at the moment capital goes out, which is why they sit on the launch side. Resume shares the same block, so a member that drifted into an unexecutable or stale state while the operation was paused cannot be silently re-activated.

The exact refusal strings are listed under [Portfolio Groups](/docs/portfolio-groups). Three things deserve a note here:

- **Ownership.** Launch, pause, resume, stop, force stop, rebalance and drift acknowledgement all require that you are both in the operation's organization **and** the owner of its broker connection. A caller who fails that check gets HTTP `404`, not `403`, so another user's operation is never disclosed. Being able to see a group is not the same as being able to trade someone else's account.
- **Shorting.** The orchestrator writes each account's `shorting_enabled` flag from its periodic probe. An explicit `false` blocks a launch that holds short equity; an unprobed account is treated as unknown and is not blocked, because the orchestrator's order-time gate already fails closed.
- **Cleartext risk-manager endpoints.** The refusal itself is the prompt. The UI then shows a dialog titled **This endpoint is unencrypted** with the checkbox **I understand, and I accept the risk for this operation** and the action **Trade anyway**. Consent is per attempt and never remembered — the `acknowledge_insecure_endpoints` flag defaults to `false`, so the gate fails closed.

## What an operation is

An operation is one row in `developers.basket_operations`: one group deployed against one broker connection. `UNIQUE (basket_id, connection_id)` means a group can hold at most one operation per connection.

It carries `operation_id`, `basket_id`, `connection_id`, `provider`, `operational_name`, `target_capital`, `last_status`, `desired_status`, the drift timestamps, `last_rebalanced_at` / `rebalance_requested_at`, an optional `execution_config_override`, and a derived `next_due_date` on reads. Both status columns are constrained to the same four values, and those four are all the API accepts.

| Status | Meaning |
|---|---|
| `DRAFT` | Created, never launched. No capital at work |
| `ACTIVE` | Trading — rebalances and daily syncs run |
| `PAUSED` | Positions held, automatic rebalancing stopped |
| `STOPPED` | Liquidated and finished. History is kept |

### Lifecycle

Two columns drive it. You set `desired_status`; the orchestrator moves `last_status` to match on its next cycle. While they differ, the operation row shows an extra chip reading **→ {{status}}**.

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

An illegal move is refused with `Invalid status transition: {from} → {to}`. `DRAFT → ACTIVE` is only reachable through the dedicated launch endpoint.

| Action | Effect on positions |
|---|---|
| **Launch** | Places the initial buy |
| **Pause** | Keeps every position; stops automatic rebalancing |
| **Resume** | Rebalances back into the market |
| **Stop** | Liquidates the positions this operation opened, then seals it |
| **Force stop** | Marks the operation `STOPPED` locally. **Positions are not sold** |
| **Re-initiate** | Returns a stopped operation to `DRAFT` so it can be launched again; history is kept |
| **Rebalance** | Requests an immediate recompute; the orchestrator acts on its next cycle |

> [!CAUTION] Stop liquidates; Force stop does not
> **Stop** sells what this operation bought and is terminal. **Force stop** exists only for the case where the connection is `revoked` or `error` and liquidation is impossible — it unblocks teardown locally and leaves your broker positions open. Its warning is explicit: *"Your broker positions are **NOT** sold. Close any open positions manually in your brokerage."* Force-stopping a healthy connection is refused with HTTP `409`: `the broker connection is still active; use Stop to liquidate positions — force-stop is only for revoked/errored connections`.

> [!NOTE] The exit is never entitlement-locked
> Only the direction that adds exposure is gated. Connecting a brokerage account (both the API-key and the OAuth path), creating an operation, launching, and resuming to `ACTIVE` require the `broker_paper_trading` feature. Pausing, stopping, force-stopping and returning to `DRAFT` stay open on every tier.

Manual rebalance carries two throttles, both returning HTTP `429`:

| Guard | Rule | Message |
|---|---|---|
| Debounce | 60 seconds between requests | `Rebalance recently requested; wait {n}s before retrying` |
| Backpressure | At most 50 unsettled orders | `Operation has {in_flight} in-flight orders (max {max}); try again shortly` |

## How orders reach the broker

A separate service, the Alpaca orchestrator, does all order work. It runs as a strict singleton — it holds a Postgres advisory lock for its whole lifetime on a dedicated connection, probes that lock every 5 seconds, and exits the process rather than trade without it (two consecutive failed probes, so a momentarily slow database does not crash-loop it). A second instance refuses to start. That is the guarantee that one account is never traded by two loops at once.

### The orchestrator cycle

Two independent loops — reconcile and WebSocket refresh — plus two passes that ride the reconcile tick behind their own time gate, so they are cheap no-ops on most ticks. The values below are the code defaults; an operator can retune them per environment.

| Pass | Default cadence | What it does |
|---|---|---|
| Reconcile loop | every 30 s | Brings `last_status` in line with `desired_status`, services rebalance requests, runs daily syncs |
| WebSocket refresh loop | every 60 s | Maintains one live trade-update stream per active connection that has an `ACTIVE` operation; it carries orders from `submitted` to `filled` in near real time |
| Connection probe | at most once per 300 s per connection | Re-checks the credentials of every `active` connection and updates `last_verified_at` |
| End-of-day reconciliation | at most once per trading day per connection, after 23:00 UTC | Cross-checks the day against the broker's own activity record |

Every reconcile tick also sweeps stale orders and archives terminally failed rows. Held buys are released off the tick as well: a WebSocket fill wakes a release worker within seconds, and the reconcile tick is the fallback.

### One trading cycle, step by step

A cycle is triggered by a launch, a scheduled rebalance on the group's data-day grid, a manual rebalance request, or a **daily sync** — the pass that replicates each member's own day-to-day movement without re-weighting the group.

```text
  1  drift unacknowledged?        → blocked, nothing planned
  2  prior cycle still settling?  → skipped, retried next tick
  3  weights          rebalance re-materializes members and re-weights;
                      daily sync reuses the last snapshot's weights
  4  member freshness  stale or not-daily-scheduled → blocked
  5  positions         fetch live positions, compare against the ledger,
                      auto-reconcile what the broker corroborates
  6  plan orders       target dollars per ticker minus current exposure;
                      deltas under $1 are skipped
  7  protective stops  cancel any resting stop on a symbol being traded
  8  market hours      equity legs deferred while the US market is closed
                      (crypto is exempt)
  9  account gates     frozen account → skip; PDT cap → drop opening legs
 10  wash-trade guard  drop legs that would cross a sibling operation
 11  submit            SELLs and short-closing BUYs go out now;
                      long BUYs are recorded as `held`
 12  release           held BUYs are funded as this cycle's own SELLs fill
```

Two design points are worth internalizing, because they explain most of what you will see in the Orders tab.

**Sells first, buys held.** In a rebalance batch the SELL legs are submitted immediately, as are the BUYs that close a short (risk-reducing, bounded by the position). The long BUY legs are written to the order log with status `held` — reserved, not sent. They are released as that same cycle's sell proceeds settle, plus a per-cycle seed equal to the capital not yet deployed. This isolates buying power per operation on a shared brokerage account, so one operation can never spend another's cash. A buy that stays unfunded past the grace window (default 300 s) is cancelled rather than allowed to reach for the account's shared buying power.

**Order types are chosen by the leg, not only by your configuration.** Funding SELLs, short opens, notional orders and crypto are forced to market — a funding sell must fill, and Alpaca rejects a notional limit. A long, whole-share BUY is always sent as a bounded **marketable limit** priced at `reference × (1 + cushion)`, so the worst-case fill equals the dollars reserved for it. The cushion is the limit offset you configured in basis points, or the platform default of 1 % when you configured `market`.

Your configuration is therefore a ceiling, not a script. Only `market` and `limit` are accepted for rebalancing at all — `stop`, `stop_limit` and `trailing_stop` are refused with *"stop, stop-limit and trailing-stop are protective order types and are not yet configurable for rebalancing — use market or limit"*, because they belong to the group's protective exits. On the time-in-force side only `day` and `gtc` are honoured on the buy leg; the immediate-or-auction values (`ioc`, `fok`, `opg`, `cls`) are stored and valid but clamped to `day` at submission, and a crypto buy is always `gtc` because Alpaca has no `day` for crypto.

### Order log statuses

Every order Fintela plans is one row, visible in the operation's **Orders** tab — including the ones a safety limit stopped before they reached the broker.

| Status | Meaning | Shown as |
|---|---|---|
| `pending` | Logged, not yet sent | `pending` |
| `held` | A BUY reserved against the cycle's cash, awaiting its own sell proceeds | **Awaiting funds** |
| `submitting` | Mid-release latch between held and sent | **Submitting** |
| `submitted` | Accepted by the broker | `submitted` |
| `working` | Resting open at the broker across ticks or sessions — a limit, a GTC, or a protective stop. The planner nets these against the next cycle's deltas and never reads them as drift | `working` |
| `partially_filled` | Partially executed | `partially_filled` |
| `filled` | Complete | `filled` |
| `cancelled` | Cancelled by Fintela or by the broker | `cancelled` |
| `failed` | Rejected, or refused by a safety limit before it was sent | `failed` |

Each row also carries the broker's own order id, asset class (`equity` or `crypto`), action (`BUY` or `SELL`), position side (`L` for long, `S` for short), quantity, order type, limit price, fill price, timestamps, whether it was `schedule`- or `manual`-triggered, and an `error_message` when the broker rejected it. Every order is sent with a deterministic client order id derived from its row, so a retry can never double-order.

### Safety limits

These are the platform-level safety knobs, shown read-only in the **Trading Limits** card under Broker connections. The card reads the backend's environment at request time; the orchestrator is a separate process that has to restart to honour a change.

| Limit | Default | Effect when exceeded |
|---|---|---|
| **Max per order** | $50,000 | The order is logged as `failed` and never reaches the broker. Siblings still submit. It gates **risk-increasing legs only** — a close is bounded by the position it closes and is never capped |
| **Max per batch** | $250,000 | Risk-increasing legs are trimmed to the remaining headroom and the rest are deferred to the next rebalance, converging over a few cycles. The headroom is per connection, so a sibling operation's committed cash reduces it. Risk-reducing legs are never capped |
| **Drift tolerance** | 1 % | Per-symbol share-count divergence above which rebalancing is blocked pending acknowledgement |
| **Buying-power check** | Off | A retired platform switch. The orchestrator no longer reads it; the buying-power budget now lives in the held-buy release path, which funds each BUY against the lesser of the operation's own attributable cash and the account's real buying power (times the safety margin, 100 % by default) less what sibling operations have already committed. SELLs are never affected |
| **Kill switch** | Off | No new orders are submitted by any rebalance. Stop liquidations are still allowed |

The card's own description is the rule: *"Platform-wide defaults applied to every order an account places. These defaults are set by your Fintela administrator and can't be changed from this page; a connection can override them under Per-account overrides below, and an override replaces the default shown here for that connection."*

**Per-account overrides** let you set **Max per order ($)** and **Max per batch ($)** for a single connection — tighter or looser than the platform default. Leave a field blank to inherit; a non-positive value is rejected with **Enter a positive amount, or leave blank to inherit the default**. Note the interaction with launch: an operation whose `target_capital` exceeds the connection's effective per-tick cap is refused at launch, and the refusal names both figures and tells you to lower the capital or raise this connection's limit.

> [!NOTE] Emergency exits are never capped
> A Stop liquidation bypasses the kill switch and the per-batch cap, and the per-order cap does not touch it either: every one of its legs is risk-reducing, bounded by the holdings it closes, and must be able to fully close — capping one would strand an open position, and a stranded short loses without bound.

## Monitoring an operation

The Operations tab lists every operation on the group. Each row shows its name or connection label, the connection and capital, **Last rebalanced:** with a date, and a **Next:** date once one is known. `next_due_date` stays null until the operation has actually rebalanced once, if the group is static, or if the next grid date is not yet a known data-day.

Expanding a row reveals five read-only tabs, each fetched only while it is the active tab.

| Tab | What it records |
|---|---|
| **Allocations** | One weight snapshot per member per rebalance, with what triggered it |
| **Orders** | Every order planned or sent, with the broker's own id, status, fills and rejection reason |
| **Activity** | The state log — actor, event type, payload and timestamp for every state change |
| **Reconciliation** | One row per trading day per scope, from the end-of-day cross-check |
| **Positions** | Live positions on the whole brokerage account behind the connection |

Two of these carry caveats worth repeating.

**Activity is written transactionally with the state it describes.** A launch writes `event_type = 'launched'` with the payload `{"note":"live trading enabled"}` in the same transaction as the status flip: if the platform cannot record who started an operation, it does not start it.

**Positions is account-wide, not per group.** It reads the broker connection directly and is badged **Account-wide**, with the caption *"Live positions on the entire brokerage account behind this connection — the whole account, not segmented by portfolio group."* Anything held by a sibling operation or by your own manual trading appears here too. When the connection is unusable it renders **Couldn't load — the broker connection may be revoked or your brokerage is unreachable.**

Full column lists for each tab are on the [Portfolio Groups](/docs/portfolio-groups) page.

### Position drift

Drift is a divergence in **share count** between the broker's reported position and Fintela's ledger, beyond the drift tolerance. Price movement does not cause it; only share counts do. Drift is checked on every rebalance and again at end of day.

The orchestrator first tries to explain it with broker-side evidence — your own late fills, or a corroborated corporate action — and only the genuinely unexplained residual stops the line. When it does, the operation shows a warning banner: **Position drift detected — rebalancing is blocked until acknowledged.** with a per-symbol breakdown in columns **Symbol**, **Expected**, **Broker**, **Drift**, and a disposition chip reading **Unexplained — check broker account** or **Possible corporate action ({{types}}) — review**. Quantities are carried as full-precision strings, never rounded numbers.

> [!CAUTION] Acknowledging drift is a real-money action
> **Acknowledge** opens a confirmation titled **Acknowledge position drift**: *"This reconciles Fintela's ledger to the broker's reported positions and resumes trading. The next rebalance then re-establishes the portfolio group from the broker's actual holdings — a real-money, irreversible action."* Its warning adds: *"Only acknowledge after you have reviewed the drift above and trust the broker's current positions."* Check the broker account before you click it.

## End-of-day reconciliation

Once per closed trading day, per connection, the orchestrator pulls the broker's own account-activity stream and cross-checks it against Fintela's ledger. This is the authoritative daily audit, and it catches what per-tick machinery cannot: an execution Fintela never logged, and a steady `ACTIVE` operation with no scheduled rebalance that would otherwise never be drift-checked.

The pass is time-gated in SQL, so it is a cheap no-op on most reconcile ticks. It reconciles at most seven days of backlog per connection per tick, and a connection that has never been reconciled does only the target day — so a long outage catches up gradually instead of doing an unbounded backfill. A day that could not be fully verified is never sealed as clean; the catch-up stops there and retries on the next tick.

Results land in the **Reconciliation** tab, one row per day per scope.

| Column | Contents |
|---|---|
| **Day** | The trading day reconciled |
| **Scope** | `operation` for this operation's own report, `account` for the connection-level, account-wide summary of that day |
| **Outcome** | `clean` when nothing diverged, `discrepancies` otherwise |
| **Fills matched** | How many broker fills were attributed to this operation |
| **Discrepancies** | A summary count of fill, position and non-trade activity findings, with the raw detail on hover |
| **Ran at** | When the pass executed |

A fill is attributed to an operation only when its order id matches a Fintela order row, or a bounded lookup shows a Fintela client order id. Everything else — a sibling operation's fill, or a trade you placed yourself — is counted at the connection level as an external fill, never as a per-operation discrepancy. A position discrepancy that survives auto-reconciliation blocks the next rebalance, exactly like intraday drift.

The empty state reads **No reconciliation yet (runs end-of-day).**

### P&L digests

On the same daily cadence, and gated separately so a reconciliation failure never suppresses them, the orchestrator writes gain/loss notifications per live operation:

| Family | When it fires |
|---|---|
| Daily, weekly, monthly | On the day, and when a new ISO week or calendar month opens |
| Inception milestones | At one, two, three and four weeks old, then every month from month two onward. Only the highest milestone reached is emitted, so a group that is already months old on its first pass receives one notification, not the whole ladder |

Notifications go to the **connection owner** — the person whose capital is at risk — not to whoever created the group, because a group is visible to the whole organization.

> [!NOTE] The digest number is a modeled series
> The percentage is `NAV_end / NAV_start − 1`, where NAV sums member portfolio values over *complete* valuation days — dates on which every member has a value — so each member is weighted by whatever starting capital its source trial happened to have. The dollar figure is that percentage scaled by the operation's `target_capital`. That is not the same basis as the group's allocation- and rebalance-aware equity curve in [Portfolio Manager](/docs/portfolio-manager), and the two series can disagree. Neither one is your brokerage account statement; for realized figures read the **Orders** and **Reconciliation** tabs.

## Emergency controls

Two controls sit above everything else and are always available.

**Stop all trading** is on the Broker connections card. It engages a halt on every one of your active accounts, and the confirmation states what it does and does not do: *"This halts NEW order placement on all your active broker accounts on the next orchestrator cycle. Liquidations and Stops still run. You can resume anytime."* While a halt is engaged a banner reads **Trading is halted on {{count}} accounts. New orders are blocked; liquidations still run.** with a **Resume trading** action.

**Pause** and **Stop** on the operation itself remain available at every tier and are never entitlement-locked.

> [!NOTE] The global halt is operator-only
> `PUT /broker/kill-switch` with no `connection_id` targets the platform-wide halt and is refused with HTTP `403` — *"The global trading halt is operator-only; it is not settable through this endpoint."* The Stop-all button fans a per-connection halt out across your own accounts instead.

## Failure modes

A broker error is never echoed verbatim — broker SDK messages embed request ids, account numbers and internal endpoints. Fintela classifies them into fixed copy.

| Situation | What you see |
|---|---|
| Credentials rejected | **Fintela can no longer authenticate with your broker. Reconnect the account to restore access.** |
| Insufficient buying power | **Your broker rejected this order for insufficient buying power. Add funds or reduce the order size.** |
| Market closed | **Your broker rejected this order because the market was closed at the time.** |
| Rate limited | **Your broker is rate-limiting Fintela right now. This clears on its own — no action needed.** |
| Account restricted or PDT | **Your broker account has a restriction that blocked this order. Check your account status with the broker.** |
| Asset not tradable or not shortable | **Your broker won't trade this asset on your account. Remove it, or check with the broker whether it can be enabled.** |
| Broker unreachable | **Fintela couldn't reach your broker. This is usually temporary — it retries automatically.** |
| Anything unrecognized | **Your broker reported a problem with this request. Check your account with the broker, and contact support if it persists.** |

Beyond individual order rejections, four conditions change how the whole operation behaves.

**A revoked connection auto-pauses its operations.** The three background health paths — the periodic probe, the order sweep and the WebSocket loop — share one per-connection failure streak and only revoke after **two consecutive** authentication failures, so a single transient `401`/`403` on a quiet connection does not auto-pause live trading. A genuinely dead credential fails every check and gets there; a network blip does not. An authentication failure hit during actual order work — a rebalance, the held-buy release, end-of-day reconciliation — revokes immediately, without the streak, because the request that needed the credentials is the request that failed. When a connection is revoked, every operation on it is forced to `desired_status = 'PAUSED'` in the same transaction, so no observer ever sees a revoked connection still driving an active operation.

**Reconnecting does not auto-resume.** Reclaiming a revoked connection preserves the `connection_id`, so the operations that were force-paused survive — but they stay `PAUSED` until you resume them deliberately. That is the safe default, not a bug.

**A cycle that cannot make progress defers rather than half-trades.** A prior cycle still settling, a closed equity market, a frozen account, an unresolvable protective configuration, an unconfirmed stop cancellation on a symbol being traded, or a leg that would cross a sibling operation's live order — all of these skip the tick and retry, leaving the operation's clock unsealed.

**Nothing here can be driven from the API.** Every route in the [Developer API](/docs/api-baskets) is a `GET`. There is no way to connect a broker, create, launch, pause, stop or rebalance an operation with an API key, and there are no webhooks — the read endpoints are for feeding results into your own tooling, and you poll them. Fintelligent's broker tool group is likewise empty by design: no connected-brokerage data reaches the model provider. See [Fintelligent capabilities](/docs/fintelligent-capabilities).

## What live trading does not guarantee

Every number you used to choose a strategy came from a backtest. Live execution differs from it in ways no simulation removes.

| Risk | Why it matters |
|---|---|
| Slippage | A marketable limit fills at a real spread, not a modeled close. Illiquid names can move meaningfully between plan and fill |
| Timing | Orders are planned against the latest data day and submitted on the next orchestrator cycle during regular hours, not at the instant a signal appears |
| Price basis | Backtests are built on adjusted closes; fills happen at live trade prices |
| Partial deployment | A batch that exceeds the per-tick headroom converges over several cycles rather than deploying at once |
| Account state | Frozen accounts, pattern-day-trader caps, missing margin permissions and non-shortable assets all bound what can actually be traded |

> [!CAUTION]
> Backtested performance does not guarantee future results. Size positions conservatively, run on paper until the behaviour is boring, and watch the Orders and Reconciliation tabs in the first days of any deployment.
