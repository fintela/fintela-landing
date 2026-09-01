---
title: Risk Managers
section: Registries
sectionOrder: 3
order: 6
published: true
updated: 2026-09-01
summary: How Fintela's built-in and custom risk managers protect a portfolio during a backtest — automatic stops, exposure caps, and trading halts, plus the order in which they act.
keywords: risk manager, stop loss, trailing stop, take profit, max drawdown, exposure cap, position cap, cash floor, trading halt, re-entry block, risk manager activity log
---

A risk manager is Fintela's automatic protection layer for a backtest. On every simulated trading day, it looks at your portfolio as it stood after the previous day and — before your strategy is allowed to rebalance — it can close a position, trim it back, or block that day's rebalance entirely. A risk manager never rewrites your strategy's target allocations; it can only step in and close, trim, add to, or pause what your strategy has already decided. Fintela ships ten ready-made rules covering stops, exposure caps, cash floors, circuit breakers, and trading calendars. On top of those, you can build your own — either by composing the built-in rules into a custom policy with no code, by writing Python inside Fintela's own editor, or by connecting a risk-management service you host yourself.

## Overview and purpose

### What a risk manager does

Every risk manager you attach to a study is checked on each simulated day. It's given the date, a snapshot of your portfolio (cash, holdings, current drawdown from the peak), and read-only access to market data — it can look at prices, but it can't place a trade outside the three actions below.

A risk manager can only do three things:

| What it can do | What it looks like to you | Effect on your portfolio |
|---|---|---|
| Close or trim a position | Fully close a holding, sell part of it, or buy back into a name it previously closed | Changes your book immediately, before your strategy's own rebalance happens |
| Pause today's rebalance | Your strategy's planned trades are skipped for that one day only; every other risk manager still runs | Nothing changes that day beyond what the risk manager itself does |
| Halt trading entirely | Every risk manager and your strategy stop acting for the rest of the run | Used by permanent circuit breakers, such as a Max Drawdown rule set to "halt permanently" |

A risk manager can never rewrite your strategy's full set of target allocations — that lever is reserved for your strategy alone. It can only close, trim, add to, or pause; it can never redraw your whole book from scratch.

### The four kinds

| Kind | What it is | Where it runs |
|---|---|---|
| Built-in | One of Fintela's ten ready-made rules | Runs instantly inside Fintela — nothing to write or host |
| Rule-based | A policy you build by combining built-in rules with your own thresholds, no code required | Runs inside Fintela, using the settings you configured |
| Custom code | Python you write in Fintela's own code editor | Runs inside Fintela, checked once per simulated day |
| External | A risk-management service you host on your own infrastructure | Runs on your systems; Fintela calls it once per simulated day |

> [!IMPORTANT]
> Built-in rules never show up as rows in this registry. The Risk Managers list only shows the rule-based, custom-code, and external risk managers you've created. You choose a built-in rule when you **attach** a risk manager to a study — this registry page is only for authoring the other three kinds.

Custom-code risk managers go by a couple of different names around the product: the kind picker calls this option **Internal**, the registry table's Kind column and the reference guide call it **Custom code**, and the Execution Type column shows it as `internal`. All three refer to the same thing.

### The order risk managers act each day

On the very first day of a simulation, your starting portfolio is set up and every attached risk manager gets one initial pass — this is when a stop records its entry price, or a cap trims an opening position that's already over the limit.

On every day after that:

1. Prices update for everything you hold; a name with no price that day is skipped.
2. Any re-entry block from a previous exit counts down by one day.
3. If a risk manager has already halted trading permanently on an earlier day, nothing else happens for the rest of the run — no risk manager and no strategy rebalance.
4. Otherwise, every risk manager attached to the study checks the portfolio, in the order you set when you attached them, and proposes its actions for the day.
5. Those actions are applied — closes and trims happen first, buys happen next.
6. Fintela records which names were closed, so it knows which ones to keep out if you've set a re-entry block.
7. Finally, unless some risk manager is pausing today's rebalance, your strategy's own trade instructions run — with any blocked names left out and their weight held in cash.

A name a risk manager closed and blocked from re-entry doesn't just vanish for one day — it's actively excluded from your strategy's next rebalance too, and shows up in your trade log as a zero-quantity trade with the responsible risk manager named.

### The order in which actions are applied

When more than one action happens on the same day, Fintela applies them in a fixed order so the outcome is predictable:

1. Halts and closes
2. Sells (trims)
3. Buys (re-entries)
4. Your strategy's regular rebalance

This is also what the attachment editor shows you as a simple legend: **Halts / closes → Sells → Buys → Strategy rebalance**. Closes always land before your strategy's rebalance because risk-manager actions and your strategy's rebalance are applied as two separate steps, with risk managers going first — not because of any hidden numeric priority.

If two of your risk managers would both act on the same day, whichever one comes first in your attachment list — the order you set when you attached them — takes precedence.

### The ten built-in rules

Fintela's rule catalogue is fixed and published in a consistent order. Every rule takes a specific, known set of settings — if you mistype a setting name or leave a required one out, Fintela flags it rather than silently ignoring it or falling back to a hidden default.

| Rule | What it watches | What it does | Can hold a name out after it closes it |
|---|---|---|---|
| Stop Loss | Loss on a position since entry | Closes that position | yes |
| Trailing Stop | Pullback from the position's best price since entry | Closes that position | yes |
| Take Profit | Gain on a position since entry | Closes that position | yes |
| Max Drawdown Circuit Breaker | Portfolio drawdown from its peak | Closes everything and halts the strategy | no |
| Sector Cap | Long exposure to any one sector | Trims that sector proportionally | no |
| Country Cap | Long exposure to any one country | Trims that country proportionally | no |
| Position Cap | Size of any single long holding | Trims that holding | no |
| Cash Floor | How much of the portfolio is invested | Trims every holding proportionally | no |
| Gross Exposure Cap | Combined long + short exposure | Trims every holding proportionally | no |
| Time-Window Halt | Today's date against a calendar you define | Pauses the rebalance only — nothing is closed | no |

> [!NOTE]
> Enter every threshold as a positive number. A 5% stop is `0.05`, never `-0.05` — Fintela applies the direction (loss vs. gain) for you based on which rule it is.

#### Stop Loss

Closes a position once it's lost more than your threshold since you entered it. Fintela remembers your entry price the moment a position opens, and resets that memory if the position is later closed and reopened.

| Setting | What it means | Typical range |
|---|---|---|
| Threshold | Loss from entry that triggers the close, as a fraction (`0.05` = 5%) | 1% – 30% |

It's checked every day for every position you hold, long or short, and closes just that one name — the rest of your portfolio is untouched.

#### Trailing Stop

Tracks the best price a position has reached since you entered it — the peak for a long, the trough for a short — and closes it once the market reverses by more than your trail percentage from that high-water mark.

| Setting | What it means | Typical range |
|---|---|---|
| Trail | Reversal from the best price that triggers the close, as a fraction (`0.10` = 10%) | 2% – 40% |

Unlike Stop Loss, which is measured from your entry price, Trailing Stop is measured from the position's best point — so it locks in gains as a position runs up, rather than only protecting against losses from entry.

#### Take Profit

Closes a position once its gain since entry reaches your target.

| Setting | What it means | Typical range |
|---|---|---|
| Target | Gain from entry that triggers the close, as a fraction (`0.15` = 15%) | 5% – 100% |

There's no upper limit on the target you can enter — a 250% target (`2.5`) is valid if that's genuinely your strategy. The typical range above is just a sensible search window if you let Fintela optimize this setting for you.

#### Max Drawdown Circuit Breaker

Fintela's portfolio-level safety switch. When the portfolio falls a set percentage below its own high-water mark, this rule closes every position and pauses the strategy — protecting you from riding a losing streak all the way down.

| Setting | What it means | Typical range |
|---|---|---|
| Drawdown limit | How far below the peak triggers the halt, as a fraction (`0.20` = 20%) | 5% – 50% |
| Resume behavior | What happens after the halt — see below | — |
| Recovery bounce | Required bounce off the lows before resuming (only for "resume on a recovery") | 1% – 30% |
| Recovery wait | Days to wait before resuming (only for "resume after a wait") | 5 – 63 days |

Choose one of three ways for trading to resume after a halt:

- **Resume on a recovery off the lows** (the default) — trading picks back up once the liquidated portfolio, if it had stayed in cash, would have bounced back by your recovery-bounce percentage from its lowest point. If that bounce can't be measured, Fintela falls back to the fixed wait instead.
- **Resume after a fixed wait** — trading resumes automatically after your chosen number of days, regardless of what the market has done.
- **Halt permanently** — the strategy stops for the rest of the run. Nothing brings it back.

Once trading resumes, the drawdown peak used to judge future halts is reset to the portfolio's value at that point, so the same rule doesn't immediately trigger again against the old, higher peak.

> [!CAUTION]
> If a note in your study results suggests setting the recovery wait to 0 days to make the halt permanent, don't — the minimum wait Fintela accepts is 1 day, and a 0-day wait would just mean "resume the very next day." To make a halt permanent, choose **Halt permanently** as the resume behavior instead.

#### Sector Cap

Keeps your long exposure to any single sector under a limit. If one sector grows past your cap — say, tech runs up and now makes up too much of your book — Fintela sells just enough from each name in that sector, proportionally, to bring it back under the limit.

| Setting | What it means | Typical range |
|---|---|---|
| Sector cap | Maximum long exposure to any one sector, as a fraction of equity (`0.30` = 30%) | 10% – 80% |
| Default sector | Bucket used for tickers with no sector classification | — |

Sector classifications come from your universe's own data — you don't enter them yourself. If your universe doesn't carry sector data at all, every ticker falls into one shared bucket, so the cap still applies to your whole long book rather than silently doing nothing.

#### Country Cap

The same idea as Sector Cap, but grouped by country instead of sector — useful for keeping single-country concentration risk in check on a global book.

| Setting | What it means | Typical range |
|---|---|---|
| Country cap | Maximum long exposure to any one country, as a fraction of equity | 20% – 90% |
| Default country | Bucket used for tickers with no country classification | — |

As with Sector Cap, country classifications come from your universe's own data automatically.

#### Position Cap

Keeps any single long holding from growing past a set share of your portfolio — useful for preventing one winning position from dominating your book's risk.

| Setting | What it means | Typical range |
|---|---|---|
| Position cap | Maximum size of any one long holding, as a fraction of equity (`0.10` = 10%) | 2% – 50% |

Only long positions are checked; shorts are left alone.

#### Cash Floor

Makes sure your portfolio always holds at least a minimum share of cash. If your invested exposure creeps above that limit, Fintela trims every holding proportionally — long and short — until the cash floor is restored.

| Setting | What it means | Typical range |
|---|---|---|
| Minimum cash | Smallest cash share the portfolio must hold, as a fraction (`0.10` = 10%) | 0% – 30% |

Note the boundary: 0% is a valid minimum (no cash requirement at all), but 100% is not — a portfolio that's always fully in cash isn't really a portfolio.

#### Gross Exposure Cap

Caps your combined long-plus-short exposure — your total gross leverage — rather than just how much cash you're holding. Built for long/short books where you want to bound overall leverage directly.

| Setting | What it means | Typical range |
|---|---|---|
| Exposure cap | Maximum gross exposure, expressed as a multiple of equity | 0.5× – 2.0× |

> [!WARNING]
> This setting is a **leverage multiple**, not a percentage of equity like every other cap in the catalogue. `1.0` means fully invested with no leverage; `2.0` means 2× leverage. Double-check you're not entering a percentage by mistake.

When your combined long and short exposure goes over the cap, Fintela trims every holding proportionally until you're back under it.

#### Time-Window Halt

Pauses your strategy's rebalance on specific days you define — weekdays, individual dates, or date ranges — without closing anything. Every other risk manager still runs as normal; only your strategy's own trades are skipped on those days. Use it to bake a trading calendar (skip Fridays, skip a holiday week, sit out earnings season) into a strategy that doesn't otherwise account for one.

| Setting | What it means |
|---|---|
| Weekdays | Days of the week to pause on (e.g. Sat, Sun) |
| Specific dates | Individual calendar days to pause on |
| Date ranges | Inclusive start/end ranges to pause on |

You need to fill in at least one of the three — Fintela won't let you save an empty calendar. Since this rule never closes or trims anything, it has no adjustable numeric setting to optimize; every setting here is fixed by you.

### Combining rules into one policy

There are two independent ways to combine risk protection on a study, and they stack.

**Attach several risk managers to one study.** Each one you attach gets its own position in your list — reordering the list changes which one takes precedence when more than one would act on the same day (see [the order in which actions are applied](#the-order-in-which-actions-are-applied) above). You can attach the same built-in rule twice — say, a tight stop and a looser backup stop — as long as they sit at different positions in the list; Fintela blocks two identical rules at the same position, since it wouldn't know which one should win.

**Combine several rules inside one rule-based risk manager.** When you build a rule-based risk manager, you choose how its rules relate to each other:

| Mode | Behaviour |
|---|---|
| Run every rule | Every rule you've added is checked every day, and their actions combine. This is the default. |
| Use the first match | Rules are checked in order, and only the first one that fires that day takes effect — the rest are skipped for that day. |

Use "first match" for a fallback pattern — for example, a tight stop-loss with a wider trailing stop behind it as a backup. Right now this grouping applies to your whole list of rules at once; you can't nest one first-match group inside another.

Either way, a rule-based risk manager still occupies just one position in your study's overall attachment order — its rules never leapfrog into another risk manager's turn.

### Attaching a risk manager to a study

Registering a risk manager and attaching it to a study are two different steps. The registry is where a rule-based, custom-code, or external risk manager is defined once; attaching is where you decide, per study, which risk managers apply, in what order, and with which settings.

| Where you attach from | When you'd use it |
|---|---|
| The study builder's Risk Managers section | While building or editing a study |
| The Attach action on a row in this registry | Straight from the registry, without opening the study first |
| Portfolios → Derive/optimize risk managers | Creates a new study specifically to search for the best risk-manager settings for an existing portfolio |

When you attach a risk manager, you can pick from any built-in rule, or from any rule-based, custom-code, or external risk manager your organization has registered. Each attachment shows:

- its position in the list, with controls to move it up or down, or remove it;
- a chip naming which kind it is;
- a **Parameters** section, where every adjustable setting can be fixed at a value or optimized within a range;
- an **After an exit** section, for rules that close one name at a time (see below);
- a **Fixed parameters** section for every other setting the rule takes, shown as the right kind of field — a number, a dropdown, free text, a list, or a checkbox.

When you first attach a built-in rule, its adjustable settings start pre-filled with sensible ranges for optimization (unless that particular setting isn't meant to be searched, in which case it starts fixed at its default — this applies to the Max Drawdown rule's recovery-bounce and recovery-wait settings). Every other setting starts at its catalogue default. When you attach one of your own registered risk managers, Fintela doesn't know sensible ranges for your custom settings, so each one starts as an empty optimize range for you to fill in.

**After an exit.** For the three rules that close one name at a time — Stop Loss, Take Profit, Trailing Stop — plus any custom risk manager you've registered, you can control whether a name that was just closed is allowed straight back in:

| Control | What it does |
|---|---|
| Hold the name out after this closes it | Off, and your strategy can buy the name straight back in on the same day, effectively undoing the exit |
| Trading days out | How many days to keep the name out, counting the day it exited. `0` keeps it out for the rest of the run |

By default, this protection is turned on for Stop Loss, Take Profit, and Trailing Stop, and off for everything else — the caps and the circuit breaker don't offer it at all, since they don't act on one name at a time; blocking every symbol a portfolio-wide halt touched would work against the halt's own recovery logic.

> [!WARNING]
> **Saving your attachment list replaces the whole list.** Whatever you leave out when you save is detached from the study. The editor always starts by loading the study's current full list, which is why you may see risk managers attached that you didn't personally add.

> [!CAUTION]
> Risk managers can only be changed while a study hasn't been launched yet. Once a study is launched, its risk-manager list is locked — duplicate the study if you want to try a different set.

Two more gates apply when you attach or launch:

- **Your universe needs the right data.** Attaching Sector Cap or Country Cap to a universe where none of its tickers carry that classification blocks the study from launching — pick a universe with sector or country data, or remove the rule.
- **There's a cap on how many you can attach.** A single study can only carry a limited number of risk-manager attachments — up to 20 by default.

**Preview stack** runs one representative backtest with your whole ordered list of risk managers applied, using the midpoint of each optimized range, without saving anything — a quick sanity check before you commit to a full study. It's available from the study builder and the derive-risk-managers flow, but not from the plain attach dialog, which has no strategy or universe to test against yet. The preview can't run Sector Cap, Country Cap, or any rule-based risk manager — it tells you which ones it skipped, but they still apply once you actually run the study. Each preview run spends tokens.

> [!IMPORTANT]
> Attaching a risk manager to a study saves a snapshot of it as it was at that moment. If you later edit or delete the registry entry, studies that already have it attached are unaffected — you'll need to build a new study to pick up the change.

### Optimizing risk-manager settings

Any setting you mark **Optimized** on an attachment is searched by Fintela's optimizer alongside your strategy's own parameters, as part of the same search. Only numeric settings (whole numbers or decimals) can be optimized — anything else, like a dropdown choice or a list, always stays fixed. A setting you mark **Fixed** is applied exactly as entered and is never explored by the optimizer.

When more than one source could supply the same setting, Fintela resolves it in this order: automatically-detected universe data (like sector or country classification) always wins first, then whatever the optimizer is currently searching, then your fixed values, then the catalogue default.

### The risk-manager activity log

Every notable event a risk manager produces during a trial — an error, a timeout, a halt, a resume — is recorded per portfolio and shown on that portfolio's **Risk Analytics** tab, under **Risk-manager execution log**. An empty log is the good outcome: it means every attached risk manager behaved as expected for the whole run.

| Event | What it means |
|---|---|
| Error | Your custom code raised an error, or your external service's call failed |
| Timeout | The risk manager took too long to respond that day and was skipped |
| Invalid output | The actions it returned didn't match what Fintela expects, so they were rejected |
| Switched off | The risk manager failed too many times and Fintela turned it off for the rest of the trial |
| Halted | A circuit breaker tripped — this is protection working as intended, not a fault |
| Resumed | Trading picked back up again after a halt |

Each row shows which trial and which date it happened on, along with a timestamp. Fintela keeps up to 50 events per risk manager per run, and the log shows the most recent 200 rows.

### Study-level warnings

A study's Overview tab stays quiet when every risk manager behaved across every trial. Otherwise, it surfaces up to two warnings, rolled up across all the study's trials:

| Warning | What it's telling you |
|---|---|
| A risk manager was switched off | It failed too many times in a row during at least one trial and Fintela turned it off partway through |
| A risk manager hit errors | It produced errors, but wasn't switched off |
| A circuit breaker stopped trading | Max Drawdown (or a similar rule) tripped at least once during the study, and how many times trading later resumed |

The first one matters most: it means a risk manager failed too many times in a row, so Fintela stopped running it partway through the trial — and the portfolio results from that point on were produced **without** that protection in place. If you see this warning, fix the underlying issue (in your Python code, or on your external service) and relaunch the study to get results that were actually protected the whole way through.

### Plan limits

Two separate limits apply to your risk managers, independent of each other.

**How many you can create.** Free-tier organizations can register up to 2 custom risk managers. This limit is only checked when you create, duplicate, or fork a risk manager — never when you're just viewing, editing, or deleting one. If your organization is already above the limit (say, after a plan change), nothing is taken away; you simply can't add more until you delete something or upgrade. See [tokens and billing](/docs/tokens-and-billing) for plan details.

**Organization-wide limits.** Beyond the creation cap, your plan sets a ceiling on the total scale of what you can build:

| Limit | What it covers |
|---|---|
| Total custom risk managers | Up to 50 combined rule-based, custom-code, and external risk managers per organization |
| Custom-code risk managers | Up to 20 of those can be Python-based |
| Rule-based risk managers | Up to 50 of those can be built from the no-code rule builder |
| External risk managers | Up to 10 of those can point to your own hosted service |
| Custom code size | Up to 64 KB of Python source per risk manager |
| External response time | Your service needs to reply in a small fraction of a second — practically about one-tenth of a second |
| Rules per policy | Up to 32 rules combined in one rule-based risk manager |
| Attachments per study | Up to 20 risk managers attached to a single study |

If you hit one of these, Fintela tells you which limit you've reached and what your current usage is. Contact support if you need any of these raised for your organization.

## Registry table view

The Risk Managers page lists every rule-based, custom-code, and external risk manager your organization has registered — built-in rules never appear here, since there's nothing for you to author about them. You'll find this page tucked under **More Options** in the sidebar rather than directly under the main Registry menu — see [navigation](/docs/navigation).

Opening a row from the list shows a read-only view of it; from there, Edit (when available) opens the full editor. Creating a new risk manager happens right on the list page — there's no separate screen for it.

### Columns

Five columns show by default; more are available through the column chooser.

| Column | What it shows |
|---|---|
| Name | The risk manager's name |
| Description | An auto-generated summary of what the rule enforces; your own notes appear in a tooltip when you hover |
| Execution Type | Whether it's custom code or external — blank for rule-based, since a rule-based policy compiles down to built-in rules rather than running your own code or service |
| Author | Who created it |
| Created At | When it was created |
| Kind (hidden by default) | Built-in, Custom code, Rule-based, or External HTTP |
| Params (hidden by default) | A quick preview of its first few settings |

The auto-generated description names up to four of the risk models a rule enforces in plain words — stop-loss, trailing stop, take-profit, drawdown circuit breaker, sector or country cap, position cap, cash floor, gross exposure cap, time-window halt — plus a count of any beyond that. Percentages render as percentages, and the Gross Exposure Cap's leverage setting renders with a `×` instead.

> [!NOTE]
> Custom-code and external risk managers don't get an auto-generated "enforcing" summary — Fintela can't see what your code or your service actually does, so their description only shows the kind and your own notes. Write a clear description for these yourself so you and your teammates can tell them apart later.

### Search, filters, and view modes

| Control | What it does |
|---|---|
| Search | Searches name, both descriptions, and author |
| Filter | Narrows by name or description text, and by Execution Type, Kind, Author, or Created date |
| View mode | Switch between a list and a card layout |
| Refresh | Reloads the list |
| Documentation | Opens contextual help |
| New Risk Manager | Opens the creation screen |

If you haven't created any custom risk managers yet, the list simply tells you so — rule-based risk managers show up here too, alongside custom-code and external ones, once you've made any.

A quota meter at the bottom of the page shows your organization's headroom across four buckets — Total, Internal (custom code), Declarative (rule-based), and External — each as a used-versus-limit bar that turns amber, then red, as you approach the cap.

### Row actions

| Action | What it does | When it's unavailable |
|---|---|---|
| View | Opens a read-only view | Always available |
| Edit | Opens the full editor | The risk manager is attached to a study, or it's a rule-based one (see below) |
| Duplicate | Makes a copy in your organization with a new name | Always available |
| Attach | Opens the attach-to-study dialog | Always available |
| Version history | Shows every saved version | Always available |
| Delete | Soft-deletes it | The risk manager is attached to a study |

> [!WARNING]
> **Rule-based risk managers can't be edited once created.** Edit only works for custom-code and external risk managers. If you need to change a rule-based policy, duplicate it and rebuild the copy — think of a rule-based risk manager as create-once.

Deleting asks you to confirm first; it's a soft delete, so the row disappears from your list and stops counting against your quota, but any study that already had it attached keeps working exactly as before. You can select multiple rows and delete them all at once. An insights strip above the table summarizes what's visible by name, kind, and how many studies use each one. Duplicating only ever copies within your own organization — there's no cross-organization sharing on this page.

## Creating a risk manager

> [!NOTE]
> There's no multi-step wizard. **New Risk Manager** opens a single screen: pick a kind at the top, fill in the working area below (which changes depending on the kind you picked), and confirm at the end — including naming it. You don't name it until you're ready to save.

| Mode | What you see |
|---|---|
| Create | "Create Risk Manager" — define a new rule-based, custom-code, or external risk manager |
| Edit | "Edit Risk Manager" — update an existing one |
| View | "View Risk Manager" — read-only |

### Choosing a kind

You choose the kind once, up front, and it can't be changed afterward — switching kinds effectively means creating a new risk manager. Fintela reminds you of this in create mode, and also points out that the ready-made built-in rules (like Stop Loss, Max Drawdown, and Sector Cap) don't need to be registered at all — you attach those directly from a study; this screen is only for building something of your own.

A **Reference** button opens a quick guide tailored to whichever kind you've picked.

> [!CAUTION]
> The reference guide's rule-based example shows an "IF … THEN …" style condition that doesn't actually exist in the builder — ignore it. The real rule-based builder works by adding rules from a fixed catalogue and filling in their settings, described below.

### Writing your own Python (Custom code)

Choosing Custom code opens a code editor right in the browser, pre-filled with a starting template. You write a Python function that takes today's date, a snapshot of your portfolio, and read-only market data, plus whatever parameters you declare, and returns the list of actions you want to take:

```python
def my_risk_manager(today, portfolio, market_data, threshold, **params):
    actions = []
    # your logic here — inspect the portfolio and market data,
    # then decide what, if anything, to close, trim, or buy back
    return actions
```

Fintela keeps your function's name in sync with the risk manager's name, and automatically detects a parameter row — with a type and a test value — for every extra argument you add to the signature. You need to give each parameter a test value before Fintela will validate your code.

If your logic needs to look back over a trailing window of prices (a moving average, for example), declare how many days of lookback it needs in the **Warmup declaration** box. Without that declaration, a lookback call returns nothing for the first several simulated days, and your check will silently fail to run during that window — declaring it tells Fintela to warm up that history before your logic sees its first real day.

Your code is checked as you type once every parameter has a test value, and again for real when you save.

### Connecting your own service (External)

External mode lets you run your risk logic anywhere — on your own infrastructure, in any language, against your own private data or models. Fintela calls your service once per simulated day and applies whatever actions it returns.

| Field | What it's for |
|---|---|
| Endpoint | The web address of your risk-management service |
| Timeout | How long Fintela waits for your service to respond before giving up on that day's check |
| Max concurrency | How many simulated days Fintela can send to your service at once |

Fintela checks your endpoint on save by sending it a real test request and confirming the reply looks right — it accepts both secure (`https://`) and plain (`http://`) addresses, though it warns you that a plain address sends data in the clear and recommends switching to a secure one before going live. Your service needs to be reachable on the public internet — a local or private address won't validate.

> [!CAUTION]
> The timeout field is pre-filled with a starting value of 30 seconds, but the actual allowed range is a small fraction of a second — well under one second — since your service is called on every simulated day of every trial and needs to keep the whole backtest fast. Replace the pre-filled value with a valid fractional-second number (for example, `0.1`) before saving.

Just like custom code, any parameters you declare are sent to your service on every call, and each one needs a test value so Fintela can validate the connection.

### Building a rule-based policy without code

Rule-based risk managers let you combine Fintela's built-in rules into your own policy without writing anything. You add rules one at a time from the full catalogue of nine building blocks — there's no filtering by strategy type, so every option is always available:

| Building block | What it does |
|---|---|
| Stop Loss | Closes a position when its drawdown from entry crosses a threshold |
| Trailing Stop | Closes a position when it pulls back from its peak by a set percent |
| Take Profit | Closes a position once it rallies past a target gain from entry |
| Max Drawdown | Closes everything and pauses trading when portfolio drawdown crosses a limit, with your choice of how it resumes |
| Exposure Cap | Caps gross long exposure along a dimension you choose — sector or country |
| Position Cap | Caps any single long position to a maximum allocation |
| Cash Floor | Keeps a minimum cash bucket by proportionally trimming positions |
| Gross Exposure Cap | Caps combined long + short exposure — useful for long/short books |
| Time-Window Halt | Pauses rebalancing on weekdays, dates, or date ranges you choose |

Exposure Cap asks you to choose a dimension — **sector** or **country** — and re-fills its settings to match whichever you pick, since the two don't take quite the same fields.

Each rule you add gets its own card, labelled with its type and a number, and you can reorder or remove them freely — their order becomes the order they're checked in. Every numeric setting can be fixed at one value or optimized within a range, starting fixed at a sensible midpoint of the catalogue's typical range; dropdown and list settings are always fixed. You need at least one rule before you can save.

By default, every rule you add runs every day and their actions combine (see [combining rules into one policy](#combining-rules-into-one-policy) above); flip the **First-match** toggle to have Fintela check them in order and stop at the first one that fires that day.

> [!NOTE]
> The First-match toggle currently applies to your whole list of rules at once, and only one level deep — you can't nest a first-match group inside another. If you need a more elaborate structure, reach out to support.

### Additional options while building

| Section | Shown for | What it's for |
|---|---|---|
| Parameters | Custom code, external | Every parameter you've declared, with its test value |
| Data sources | Custom code | Any extra data feeds your logic needs beyond prices |
| Advanced options | All kinds | Collapsed by default; opens automatically if there's a validation error |
| Variables | Custom code | A live look at exactly what your function receives at runtime |
| Validation | All kinds | Shows validation errors, and lets you preview a sample of the actions your logic would produce |
| Version History | Existing risk managers | Every saved version, newest first |

You never have to choose which price data your risk manager sees — it automatically gets the same price history your strategy already uses. The Data sources section is only for anything extra your custom code needs beyond that.

The Validation section's **Output sample** lets you preview the actions your logic emits on a representative run before you commit to saving — a quick way to sanity-check your code or rules without launching a full study.

**Version History** keeps every past version automatically — Fintela saves a new one whenever the definition, its settings, or its kind changes, so you never have to save a version by hand. For custom code, you can compare the code across versions and restore an older one, which loads it back into the editor as an unsaved change for you to review and save again. This isn't available in read-only view, and only custom-code versions carry the code itself for comparison.

### Saving and naming

Saving happens in a few steps:

1. Click **Create risk manager** (or **Save changes** when editing). **Cancel** warns you if you have unsaved changes.
2. Fintela validates what you've built: a rule-based policy is checked against the rule catalogue, custom code is actually run with your test values, and an external endpoint gets a real test call. Any failure shows up in the Validation section — for custom code, the offending line is highlighted right in the editor.
3. Once validation passes, exactly what you validated is what gets saved — if the confirmation step renames your custom-code function, that renamed version is what's checked and stored.
4. Finally, you're asked to name it and add a short description.

For custom code, the name you choose becomes your function's name too — Fintela lowercases it and swaps spaces for underscores automatically, and keeps your code's function name in sync as you type. If the name you pick is already taken in your organization, Fintela doesn't block you — it just tells you the name it's actually going to save as (appending a number, like ` (2)`), so names stay unique within your organization without getting in your way.

If someone else changes a risk manager while you're editing it, Fintela detects the conflict and asks you to reload rather than silently overwriting their change. For custom code specifically, any edit to your code, warmup declaration, or data sources means it has to pass validation again before it can be saved.

## How your custom logic runs

Custom-code and external risk managers work the same way conceptually — Fintela checks your logic once per simulated day and applies whatever it returns — but where that logic actually runs is different, and the choice between them is permanent once a risk manager is created.

### Custom code

Your Python runs inside Fintela, checked once per simulated day for every trial that uses it. Each call receives today's date, a snapshot of your portfolio — current value, cash held, the highest value the portfolio has reached so far, and every current holding with its side (long or short) and size — and read-only access to market data: closing prices, moving averages, and standard deviation, on demand, for any ticker and lookback window you ask for.

Your function returns a list of actions — close a position, trim it by a fraction, buy back into it, or do nothing that day. Fractions and allocations are always between 0 and 1 (never a percentage like `50`), and a fully-closed position is expressed as a close action, not a zero-size buy. Your function can't issue a full rebalance — that's reserved for your strategy — and a single malformed action in the list causes that whole day's actions to be rejected together.

To remember something between days (like a running count, or a state machine), you can attach it to your function; Fintela persists it for you across the trial. If you need randomness, use a seeded random-number generator so your results stay reproducible.

Each check has to complete quickly — a small, fixed budget per day that grows slightly with how many positions you hold, with a hard ceiling well under a couple of seconds. If your code fails several times in a row, or too many times across the whole run, Fintela automatically switches it off for the rest of that trial and logs it (see [the risk-manager activity log](#the-risk-manager-activity-log) above) — the trial keeps running, just without that protection from that point on.

### External

Your risk logic runs entirely on your own infrastructure, in whatever language or stack you prefer, against whatever private data or models you don't want to share with anyone. Fintela calls your service once per simulated day with today's date and a snapshot of your portfolio, and expects back a list of actions in the same shape as custom code — an empty list means do nothing that day.

> [!IMPORTANT]
> Fintela does not send any market data to an external risk manager — only the date and your portfolio snapshot. If your logic needs prices or other signals, you're responsible for fetching them from your own source. This is also why an external risk manager doesn't get portfolio history the way custom code does — treat each call as a fresh, standalone check.

Your service needs to respond quickly — well under a second, and Fintela gives up on a call entirely past a hard ceiling of half a second — since it's called on every simulated day of every trial. A non-successful response, an unreadable reply, or one malformed action causes that day's whole set of actions to be rejected. The same automatic-shutoff protection applies as with custom code: too many failures in a row, or too many across the run, and Fintela switches the risk manager off for the rest of that trial. If your service is geographically distant from where your studies run, the round-trip latency can start to matter — keep it close if you can.

The same internal-address screening applies here as anywhere else external services are connected to Fintela: at save time, and again on every call, Fintela refuses to talk to an address that isn't genuinely reachable on the public internet.

This same internal-vs-hosted split shows up elsewhere on the platform too — see [execution modes](/docs/execution-modes) for the general pattern, and [external strategies](/docs/external-strategies) for the equivalent choice on the strategy side.

### Where neither applies

| Kind | Runs your own code or service? | Why |
|---|---|---|
| Rule-based | No | Compiles down to built-in rules when the study is built — there's no code of yours involved at any point |
| Built-in | No | Runs natively inside Fintela; not something you register, only something you attach and configure |

Two things worth knowing:

- Custom code and rule-based risk managers validate as you type, once you've filled in test values. External risk managers only validate when you save — there's nothing useful to check without actually calling your service.
- The output preview doesn't cover every kind — rule-based risk managers, and the two rules that rely on universe classification data (Sector Cap and Country Cap), can't be previewed and are skipped with a note when you run one. They still apply fully once the real study runs; only the quick preview can't simulate them.

Related reading: [studies](/docs/studies) for where you attach risk managers, [study lifecycle](/docs/study-lifecycle) for when your risk-manager list can and can't be changed, [portfolio detail](/docs/portfolio-detail) for the Risk Analytics tab, and [registries](/docs/registries) for how this registry fits with the others.
