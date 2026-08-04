---
title: Live trading
section: Workflows
sectionOrder: 2
order: 5
published: true
updated: 2026-08-04
summary: Connect your brokerage, promote a portfolio, and run an operation on a basket.
keywords: live trading, operation, broker, agent, live agent, alpaca, deploy, paper trading, reconciliation, slippage
---

Once you've found a strategy parameter set you're confident in, you can promote it to a
live portfolio, group it into a basket, and trade that basket through your connected
brokerage. This page walks through every step.

> [!CAUTION] Real capital
> An operation places real orders against your brokerage account with real money. Always
> validate thoroughly on a paper connection before trading live. Fintela does not guarantee
> any trading outcome.

## Overview

The live trading flow has three stages:

```text
1. Connect your brokerage  (Account settings → Broker connections)
2. Promote a portfolio     (Analytics → Portfolios → Promote)
3. Trade a basket          (Portfolio Manager → Operations)
```

## Connect your brokerage

`Account settings → Broker connections → Connect your brokerage`

Broker credentials are configured once at the organization level and shared across every
operation. One brokerage integration is supported today:

| Broker | Method | Notes |
|---|---|---|
| Alpaca | OAuth · API key | Link your existing brokerage account over OAuth — no API keys to copy or store. An API key + secret path is available as an advanced fallback. Paper and live accounts are separate connections. |

1. **Open Account settings → Broker connections.** Open the avatar menu in the top-right,
   click **Account settings**, and find the **Broker connections** card.
2. **Click Connect your brokerage.** Name the connection and pick its environment:
   **Paper (recommended)** or **Live**. The environment belongs to the connection, not to
   the operations you later run on it.
3. **Authorize with your brokerage.** Click **Connect with your brokerage** to link your
   existing account over OAuth. If you'd rather use keys, expand **Connect with API key
   instead (advanced)** and paste your **API Key ID** and **API Secret**. Either way
   Fintela verifies the credentials against your brokerage before storing them — if the
   brokerage rejects them, the dialog shows the broker's own error message rather than a
   generic one.

> [!NOTE]
> Credentials are encrypted at rest and never visible after initial entry. You can hold one
> connection per broker and environment (paper / live) in each organization. To replace an
> API key, use **Rotate credentials** — the new key is verified against the broker before it
> replaces the old one, and it swaps in place, so running operations stay on the same
> connection. OAuth connections are refreshed by reconnecting.

> [!WARNING] Revoked connections auto-pause
> Fintela re-checks each connection every 5 minutes. A single 401/403 never revokes
> anything — the check has to fail authentication **twice in a row** (roughly 10 minutes)
> before the connection is marked **revoked**, so a transient blip can't auto-pause live
> trading. A genuinely dead credential — key revoked, account suspended — fails every check
> and does get there. Once revoked, every operation running on the connection is paused
> automatically. Reconnect to resume.

## Promote a portfolio

`Analytics → Portfolios → Select portfolio → Promote`

Before you can trade, you need to **promote** a portfolio from a completed study. Promotion
marks a specific trial's parameter set as the one to use for live signal generation.
Operations don't run on a portfolio directly — they invest a **basket**, which is how you
group one or more promoted portfolios under a shared set of trading rules.

1. **Open Analytics → Portfolios.** Select the study you want to deploy from the study
   filter.
2. **Choose a trial.** Sort by your preferred metric and select the portfolio you want to
   deploy. Review the equity curve, drawdown, and trade history one more time before
   committing.
3. **Click Promote.** The Promote action is available in the portfolio detail view (action
   menu in the top-right of the portfolio card). You'll be asked to confirm, since promotion
   is a signal that you intend to use this result in production.

> [!TIP]
> You can have multiple promoted portfolios at the same time, and a basket can hold several
> of them. You can also run more than one operation against the same brokerage connection —
> each keeps its own ledger, so stopping one only liquidates what that operation bought.

## Start an operation

`Portfolio Manager → Open a basket → Operations → Trade with your brokerage`

1. **Open Portfolio Manager → your basket → Operations.** Click **Portfolio Manager** in
   the sidebar (under **Registry**), open the basket you want to trade, and select the
   **Operations** tab. Each trading session invests this basket through one broker account.
2. **Click Trade with your brokerage.** A wizard opens asking which connection to trade
   through and how much capital to commit. The trading rules themselves live on the basket.
3. **Configure the operation.** Fill in:

   | Field | Description |
   |---|---|
   | Basket | The basket this operation invests. Its members and trading rules come with it. |
   | Connection | One of your brokerage connections. The operation inherits that connection's environment — there is no paper / live switch here. |
   | Capital ($) | The total dollars this operation may put to work — used to compute position sizes from allocation percentages. |

4. **Launch.** Click **Launch**. The operation moves from **DRAFT** to **ACTIVE**, places
   its initial buys, and rebalances from then on as new signals come due.

## Monitor the operation

`Operations → Select an operation → Details`

Select an operation and open **Details**. Five tabs cover everything it has done:

| Tab | What it shows |
|---|---|
| Allocations | The per-member and per-ticker dollar targets this operation last computed. |
| Orders | Audit trail of every order: side, quantity, price, and fill status — plus the broker's own error message when one is rejected. |
| Activity | Every state change with actor, event, and timestamp — launches, pauses, rebalance requests, detected drift. |
| Reconciliation | One row per trading day comparing Fintela's ledger against the broker's record of the account. |
| Positions | Live positions on the whole brokerage account behind the connection — account-wide, not segmented by basket, so anything held by another operation or by your own manual trading shows up here too. |

> [!NOTE] Risk managers stay active
> If the promoted portfolio was produced with risk managers attached, those same risk
> managers keep running as the portfolio advances day to day — on each new day the engine
> runs them first, on the portfolio from the previous day, and then the strategy's
> rebalance. Their state carries across days, so a protection like a trailing stop
> remembers the levels it has already seen. Any notable events are recorded in the
> portfolio's risk manager execution log. See
> [When they act](/docs/managing-risk-managers#when-they-act) for the per-step ordering.

## Pause, stop, re-initiate

An operation can be halted at any time, and what happens to your positions depends on which
verb you use. **Pause** keeps them; **Stop** liquidates them. Stop only sells what _this_
operation bought — anything you hold from another operation or from your own manual trading
is left alone.

| Action | What it does |
|---|---|
| Launch | Places the initial buy and starts trading (DRAFT → ACTIVE). |
| Pause | Stops rebalancing but keeps current positions (ACTIVE → PAUSED). |
| Resume | Resumes rebalancing and re-buys into the market (PAUSED → ACTIVE). |
| Stop | Liquidates the positions this operation opened and stops it. Terminal. |
| Force stop | Only when the connection is revoked and liquidation is impossible: marks the operation STOPPED locally so you can delete it. Your positions are NOT sold — close them with your brokerage. |
| Re-initiate | Resets a stopped operation back to DRAFT so it can be launched again. History is kept. |
| Rebalance | Recomputes the member weights now; the orchestrator acts on its next tick. |

## Paper trading

Paper trading runs the full workflow against your brokerage's paper account — every signal
is processed and every order is placed, but against simulated capital. This is strongly
recommended before you put real money behind a strategy.

Paper or live is decided **when you connect the account**, not when you launch: pick
**Paper (recommended)** in the **Connect your brokerage** dialog and every operation on that
connection is paper. To go live later, connect the live account as a separate connection and
point a new operation at it. The UI is identical either way — the connection is what differs.

> [!NOTE] Live is not open yet
> The **Live** environment is disabled in the Connect your brokerage dialog pending
> brokerage approval of the Fintela OAuth app. Paper is available today.

## Risk considerations

> [!CAUTION]
> **Backtested performance does not guarantee future results.** A strategy that performed
> well in backtesting may perform poorly or incur losses in live trading due to market
> regime changes, slippage, execution delays, and data differences. Always size positions
> conservatively and monitor operations actively.

| Risk | Why it matters |
|---|---|
| Slippage | Live fill prices differ from backtest prices. Illiquid tickers may see significant slippage on entry/exit. |
| Execution latency | Orders are placed at next-open after a signal date. Intraday moves between signal and fill are unaccounted for in backtests. |
| Data differences | The data used in backtesting may differ from the real-time data feed. Adjusted close prices vs. actual fill prices at market open. |
| Connection loss | If your brokerage revokes the connection, its operations are auto-paused and no further orders go out until you reconnect. Watch for the revoked banner. |
