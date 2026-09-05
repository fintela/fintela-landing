---
title: Portfolio Groups
section: Registries
sectionOrder: 3
order: 7
published: true
updated: 2026-09-01
summary: Combine your promoted portfolios into one book you can allocate, rebalance, and deploy to a broker as paper or live trading.
keywords: portfolio group, allocation, rebalancing, weights, members, broker connection, paper trading, live trading, deploy, end-of-day report
---

A Portfolio Group lets you combine several [promoted portfolios](/docs/promoted-portfolios) into one book you manage as a single unit, with one shared allocation recipe, one rebalancing schedule, and one trading configuration. It answers three questions for a book of strategies: how is capital weighted across the members, how often are those weights recalculated, and how do the resulting orders reach a broker. This page, the Portfolio Groups registry, is where you build and configure that structure: which groups exist, what they hold, and how they're set up. Once a group exists, its performance and day to day monitoring live one click away, in the [Portfolio Manager](/docs/portfolio-manager) hub.

## Overview and purpose

### Portfolio Groups and the "basket" name

You may occasionally see the word "basket" used instead of "Portfolio Group": in an older bookmark, in the Developer API, or in a notification. It's simply an earlier name for the same object; nothing about how it behaves, or what you can do with it, changes.

### Groups, members, and operations

```text
  Promoted Portfolios
        │  you choose which ones to include
        ▼
  PORTFOLIO GROUP
    members               → the promoted portfolios you picked
    allocation recipe     → how capital is split across them
    rebalance schedule    → how often weights are recalculated
    order & exit policy   → how orders are placed and protected
    track record          → its backtested and live performance history
        │  deploy to a broker connection
        ▼
  OPERATION
     ├─ allocations   weight snapshots taken at each rebalance
     ├─ orders        what was actually sent to your broker
     ├─ activity log  who did what, and when
     └─ end-of-day reports   daily reconciliation against your broker
```

- **Members** are the promoted portfolios you add to a group. Each one keeps running independently (its value keeps advancing on the group's daily schedule) even if the study it came from is later deleted. Deleting a study never takes a live portfolio down with it.
- **Operations** are deployments. One operation is one group running against one broker connection, with its own capital, its own status, and its own rebalancing clock. A group can have at most one operation per connection, so the same group can trade paper and live at the same time, on two different connections.

> [!NOTE]
> A Portfolio Group never contains other Portfolio Groups. The only hierarchy is: group → members (portfolios) → operations (deployments).

### What a group carries

| Setting | What it controls | Where you set it |
|---|---|---|
| Membership | Which promoted portfolios belong to the group | Creation form, structure page, Rank & Build |
| Allocation recipe | How capital is split across members | Creation form, Trading Lab |
| Manual weights / risk budgets | Exact per member weights, when you choose Manual or Risk Parity | Trading Lab only |
| Rebalance schedule | How often weights are recalculated | Creation form, Trading Lab |
| Rebalance start date | The date the schedule counts from | Trading Lab only |
| Daily updates | Keeps every member's value current each trading day | Always on: see below |
| Order policy | Order type, time in force, and pricing cushion for every trade | Trading Lab, with a per operation override at deploy time |
| Protective exit | An optional resting stop that guards open positions | Trading Lab only |
| Stop re entry rule | Whether a stopped out position can be bought back | Trading Lab only |
| Benchmark | What the group's performance is measured against | Trading Lab only |
| Track record | The group's backtested and live performance history | Maintained automatically |
| Description | Free text notes, for your own reference | Naming dialog |

### Visibility and your plan's limits

A Portfolio Group is visible to your whole organization, not just the person who created it: the configuration (allocation recipe and member weights) is shared, so your team is always looking at the same setup. What isn't shared automatically is each member's underlying strategy code, which stays protected at its own layer. A group outside your organization simply won't appear for you at all.

Creating a group counts against your plan's Portfolio Group limit. The free tier includes one Portfolio Group; if you try to create a second while on that tier, Fintela stops you at the naming step, before anything is lost, and points you to the same upgrade prompt used for insufficient tokens.

### Screens you'll use

- **The registry** (this page): browse, filter, and manage every Portfolio Group you have access to.
- **Rank & Build**: rank your promoted portfolios and build a new group from your top picks, or add members to a group you already have. See [Promoted Portfolios](/docs/promoted-portfolios).
- **The structure page**: manage a group's members, check their freshness, and open the Trading Lab.
- **The creation form**: a single screen for naming a new group and choosing its members and starting configuration.

A link to any of these (including a filtered list or a saved ranking view) can be bookmarked or shared with a teammate, and it will reopen in the same state.

### A note on older bookmarks and links

This section used to live under a different name. If you have an old bookmark or a saved link from before the rename, it will still take you to the right place automatically.

> [!WARNING]
> One older link format (a bare saved ranking link from the previous section name) can't be resolved automatically. If you saved one of these, re save it from the current page; the old link may open the wrong screen.

### Where a Portfolio Group shows up elsewhere in Fintela

- **[Portfolio Manager](/docs/portfolio-manager)** is where you actually watch a group perform: its equity curve, metrics, holdings, trades, robustness checks, and related news all live there. This registry deliberately shows none of that: no returns, no P&L, no sparklines, so you're never tempted to make an allocation call from a half loaded summary.
- **[Asset Groups](/docs/asset-groups)** can hold a Portfolio Group as a member, treating its combined performance like a single ticker. That's how you build a portfolio of portfolios.
- **The [Developer API](/docs/api-baskets)** exposes a read only view of your groups: more on that later on this page.

## Browsing the Portfolio Groups registry

### Toolbar and controls

| Control | What it does |
|---|---|
| **Filter** | Opens the filter panel |
| **List view / Card view** | Switches layout; your choice is remembered |
| **Choose columns** | Picks which optional columns show (list view only) |
| **Refresh** | Reloads the list |
| **Create Portfolio Group** | Opens the creation form |

> [!NOTE]
> This page has no free text search box in the toolbar. To search by name or description, open the filter panel: both fields live there.

### Columns

| Column | What it shows | Visible by default |
|---|---|---|
| Group name | The group's name | Yes |
| Description | An autogenerated summary of the group's setup; your own notes show in the hover tooltip | Yes |
| Portfolios | How many members the group has | Yes |
| Total AUM | Capital committed across the group's active or paused deployments | Yes |
| Created | When the group was created | Yes |
| Allocation | The allocation method in use | Optional |
| Rebalance | The rebalance cadence | Optional |
| Daily update | Always reads "Daily update ON" | Optional |
| Stage | The ranking time window used when the group was built | Optional |
| Strategies involved | Distinct strategy names among the members | Optional |
| Authors involved | Distinct authors among the members | Optional |

**Total AUM** adds up capital across every operation of that group that's currently Active or Paused: real money or paper money actually at work, not a backtest figure. Hover it to see how many operations that total reflects; with nothing deployed yet, it reads as a dash rather than zero, so "nothing deployed" is never confused with "deployed with $0."

**Strategies involved** and **Authors involved** are read from your Promoted Portfolios list; if that list hasn't finished loading, these cells briefly show a dash rather than risk crediting the wrong strategy or author.

> [!CAUTION]
> **Stage is a label, not a status.** It records which ranking time window (year to date, since inception, and so on) was in effect when the group was built from Rank & Build: it does not mean draft, active, or deployed. There's no separate status column on this page; to see whether a group is actually trading, check its Total AUM, or open its Operations tab in Portfolio Manager.

### The Description column

The Description cell is generated from the group's own settings rather than the free text you typed, for example:

*"Portfolio group configured with allocation methodology Risk parity, 5 member portfolios, rebalancing frequency Every 30 data days."*

The member count is dropped from the sentence entirely for an empty group: an empty group is a normal state while you're still building it, and "0 member portfolios" would just be noise. Your own free text isn't lost: it moves into the hover tooltip, labeled **Author's note**, so you can leave yourself context without it crowding the summary.

There's no member limit setting anywhere on a Portfolio Group: add as many promoted portfolios as your book calls for. Rebalance cadence reads as **Every {{count}} data day(s)**, or **Static** when rebalancing is switched off. Allocation methods always read with the same label everywhere in the product:

| Method | Label |
|---|---|
| Equal weight | Equal weight |
| Manual | Manual |
| Metric proportional | Metric proportional |
| Metric responsive | Metric responsive (momentum / contrarian) |
| Risk parity | Risk parity |
| Volatility target | Volatility target |
| Mean reversion | Mean reversion |

### Filters

| Field | Kind |
|---|---|
| Group name | text |
| Description | text |
| Portfolios | number range |
| Total AUM | number range |
| Allocation | multi select |
| Rebalance | multi select |
| Stage | multi select |
| Created | date range |

Your filter selections are saved directly in the page's link, so a filtered view survives a refresh, and you can send a teammate the exact same list by sharing the URL.

You can't filter directly by strategy or author: a group can hold several of each, and matching on an exact combination is easy to get wrong in a way that quietly hides groups you meant to find. Use the **Strategies involved** and **Authors involved** columns to check membership instead.

### Card view

A card shows the group's name as its title, the Description as its subtitle, and the portfolio count, Total AUM, and creation date underneath. Interactive elements like the Daily update chip and the actions menu aren't shown on a card; open a card the same way you'd open a row, by clicking it.

### Row actions

Clicking a row (or a card) opens a menu titled with the group's name:

| Action | What it does |
|---|---|
| **Edit structure** | Opens the group's structure page |
| **Deploy Portfolio Group** | Opens the deploy dialog for this group. Disabled with the tooltip *"This group has no portfolios to allocate"* when it has zero members |
| **View** | Opens the group's Portfolio Manager profile (works with open in new tab) |
| **Duplicate** | Creates a copy: see below for exactly what carries over |
| **Delete** | Opens a confirmation dialog |

The delete confirmation reads: *Delete the portfolio group "{{name}}"?*

| Action | Confirmation toast |
|---|---|
| Delete | Portfolio Group deleted. |
| Duplicate | Duplicated as "{{name}}". |
| Create | Portfolio Group created |
| Update | Portfolio Group updated |

> [!NOTE]
> You can only act on one group at a time from this page: there's no multi select or bulk actions here.

### Duplicating a group: what is and isn't copied

| Copied | Not copied |
|---|---|
| Name, as "{{name}} (copy)" | Description |
| Members | Order policy |
| Daily update setting | Protective exit settings |
| Stage | Benchmark |
| Allocation method and its parameters | Re entry rule and cooldown |
| Rebalance schedule | Per member order and protective overrides |
| Manual weights, when set | Unlocked premium allocation methods |

> [!WARNING]
> Duplicating a group creates a brand new group, so any premium allocation method you'd already unlocked on the original is **not** carried over: you'll be asked to unlock (and pay for) it again the first time you save the duplicate.

### Deleting a group

Deleting removes the group from every list right away. Treat it as final: there's no undo in the interface.

Delete is refused outright while the group has any operation that's Active or Paused: trading real or paper money right now:

*"This group has live operations (active or paused). Stop them first: deleting it would orphan open broker positions."*

Operations that are Stopped or still in Draft don't block a delete. This guard exists so you never lose the record of positions still open at a broker.

On the structure page the same delete is offered through a dialog titled **Delete "{{name}}"?** with the body **This cannot be undone.** That dialog deliberately stays open if the delete is refused, because the refusal message tells you exactly what to fix first.

### Empty states

| Situation | What you'll see |
|---|---|
| No groups at all | **No portfolio groups yet. Create one from your promoted portfolios.**, plus a Create button |
| List empty because your workspace filter is set to "My" | **You haven't created any portfolio groups yet.** *Workspace filter is on: it is showing only yours. Your teammates' portfolio groups are still there.* Shown with a **Show all portfolio groups** button |

## Building and running a Portfolio Group

### One screen, not a step by step wizard

Creating a group is **a single screen**, not a sequence of steps: a center pane for picking members, a right hand rail of collapsible sections for everything else, and a pinned Cancel/Save row at the bottom. There's no Next, no Back, no progress bar, and no separate review step.

| Element | Text |
|---|---|
| Page title | **Create Portfolio Group** (or **Edit Portfolio Group**) |
| Subtitle | **Assemble promoted portfolios into a group for consistent management.** |
| Top right button | **Cancel**: returns to the registry |
| Action row | **Cancel** and **Save** (**Saving…** while it's in progress) |

One warning banner can appear above the picker, and either one disables Save until you address it:

| Condition | Message |
|---|---|
| Zero members selected | **Select at least one promoted portfolio to continue.** |
| A premium allocation method is chosen but not yet confirmed | **Confirm the allocation method unlock to continue.** |

### Choosing members

The center pane is the **Promoted Portfolios picker**: the same registry, the same columns, and the same filters as the [Promoted Portfolios](/docs/promoted-portfolios) page itself, so a metric never reads differently in one place than the other.

| Aspect | Detail |
|---|---|
| Columns shown | Name, Strategy, CAGR, Sharpe, Max drawdown, Status |
| Columns available in the chooser | Study, Author, Total return, Portfolio Groups, Daily updates, Data points, Date promoted |
| Quick filters | Name, strategy, study, status: everything else is under **More Filters** |
| Filter state | Saved in the page link, so a half built group survives a reload |

### Field reference

| Field | Where | What it is | Default | Rule |
|---|---|---|---|---|
| Members | Center pane | Tick the promoted portfolios to include | Empty, or prefilled if you arrived from Rank & Build | At least one required |
| Daily update | Advanced → Schedule | Always on for group members | On, not editable here | N/A |
| Periodic rebalance | Advanced → Schedule | Switch | Off | Turning it on seeds 30 data days; turning it off clears the field |
| Rebalance every (data days) | Advanced → Schedule | Number, shown only while the switch is on | 30 | Minimum of 1 data day |
| Allocation method | Advanced → Allocation | Select, grouped Free / Premium | Equal weight | Choosing a premium method opens the unlock dialog and blocks Save until confirmed |
| Per method parameters | Advanced → Allocation | Varies by method | Seeded per method: see below | Sensible minimums per control |
| Name | Naming dialog | Text, prefilled with a suggested name | A generated three word name | Required |
| Description | Naming dialog | Text | Empty | Optional |

The **Daily update** field explains why it's locked on: *"When on, each portfolio in the group extends daily. Required before the group can be deployed."* The **Periodic rebalance** switch explains itself either way:

| Switch | Helper text |
|---|---|
| On | **Weights are recomputed on this data day cadence once the group is deployed.** |
| Off | **Static: the group allocates once and holds until you change it.** |

> [!IMPORTANT]
> Rebalance cadence counts in **data days** (trading days on the market calendar) not calendar days, so weekends and holidays are skipped automatically. The date the schedule counts from defaults to the day you created the group, and can only be changed afterward, in the Trading Lab.

### Advanced options

The **Advanced options** section is collapsed by default, because both of its subsections (Schedule and Allocation) already carry a sensible working default. You only need to open it if you want to change how the group is weighted or how often it rebalances.

### Allocation methods

Seven methods are available, split into two groups:

| Group | Methods |
|---|---|
| Free | Equal weight, Manual |
| Premium (token cost) | Metric proportional, Metric responsive (momentum / contrarian), Risk parity, Volatility target, Mean reversion |

Each premium method carries a padlock icon until you unlock it for that specific group, at which point it shows an **Unlocked** chip instead.

### Per method parameters

| Method | What you configure | Starting values |
|---|---|---|
| Equal weight | Nothing: capital splits evenly | N/A |
| Manual | Nothing here: per member weights are set in the Trading Lab | N/A |
| Metric proportional | Metric, lookback (days), weights as of | Sharpe ratio, 90-day lookback, grid date |
| Metric responsive | Metric, lookback (days), direction, transform, softmax temperature (for the softmax transform), blend toward equal weight, weights as of | Total return, 21-day lookback, momentum direction, linear clip transform, 50% blend, grid date |
| Risk parity | Covariance window (days), weights as of | 90-day window, grid date |
| Volatility target | Target volatility (annualized), lookback (days), base method, max leverage, weights as of | 15% target, 63-day lookback, inverse volatility base, 1.0x max leverage, grid date |
| Mean reversion | Nothing (a fixed preset) | *"Overweights recent underperformers (contrarian, rank based), no parameters."* |

| Control | Options |
|---|---|
| Direction | Momentum (overweight winners) · Mean reversion (overweight losers) |
| Transform | Linear clip · Softmax · Rank |
| Base method | Inverse volatility · Equal weight |
| Weights as of | Grid date (matches the backtest) · Latest data |

**Blend toward equal weight** is a slider from 0 to 1, in steps of 0.05. **Target volatility** is annualized: the field helper reads *"e.g. 0.15 = 15%."*

The **Metric** picker offers Fintela's full metric catalog, grouped by category: Return, Risk, Risk Adjusted, Recovery, Distribution, Benchmark (vs SPY), and Trade. If the catalog is briefly unavailable, you'll still see a solid default list of common metrics rather than an empty picker.

### Unlocking a premium allocation method

Choosing a premium method that isn't already unlocked for this group opens a confirmation before Save can proceed:

| Element | Text |
|---|---|
| Title | **Unlock {{method}}** |
| Body | **Unlocking this advanced method for this portfolio group is a one time token charge. Once unlocked it stays free for this portfolio group. Tip: a very short lookback with daily rebalancing trades a lot: mind the costs.** |
| Figures shown | The token cost, and your current balance |
| Insufficient balance | **Not enough tokens: buy more from your account to unlock.** |
| Buttons | **Cancel** (reverts your method choice) · **Unlock on save** |

The charge only happens at the moment you actually save the group: a failed save never charges you. Re saving a method already unlocked for this group is always free, and changing other settings without changing the allocation method never triggers a new charge; only switching to a genuinely new premium method does. See [tokens and billing](/docs/tokens-and-billing).

### Selection preview

The rail's **Selection preview** section is expanded by default and reads **Selected: {{n}}**.

| Element | Detail |
|---|---|
| Config read back | Allocation, Rebalance, and Daily update, shown with their current values |
| Member list | Headed **Selected portfolios**, with a count and a **Clear all** option |
| Empty state | **Portfolios you tick in the table land here, with the settings above applied to them.** |
| Each row | Member name, its strategy, and a remove button |

The list caps at a fixed height and scrolls, newest selection at the bottom.

### Saving and naming your group

**Save** doesn't write immediately: it opens a naming dialog, which is the real commit step:

| Element | Text |
|---|---|
| Title | **Confirm Action** |
| Message | **Name this portfolio group before saving it.** |
| Name field | With a **Suggest another name** button |
| Description field | Optional |
| Blank name error | **Give the group a name to continue.** |
| Buttons | **Cancel** · **Confirm** |

Portfolio Groups are the only registry that offers name suggestions, because (unlike a strategy or a fitness function) a group doesn't have an obvious name to draw from. Suggestions are three word names; feel free to keep one, generate another, or type your own. Names don't have to be unique, so this is a courtesy, not a constraint.

Saving takes you straight to the new group's **structure page**: never to a deploy screen, so you always land somewhere you can double check your setup before any capital moves.

### Messages you might see while creating a group

| Situation | What you'll see |
|---|---|
| A member you picked uses an External strategy | A message explaining it can't stay current automatically and asking you to remove it (see [Execution modes](#execution-modes) below) |
| A member built from other portfolios also carries a sector cap or country cap risk manager | A message asking you to remove that specific risk manager attachment first: every other risk manager type works fine here |
| A manual weight you entered is zero, negative, or over 100% for one member | A message telling you the valid range |
| Your manual weights add up to more than 100% | A message showing the total and asking you to bring it back to 100% or less |
| A portfolio ID you entered isn't a promoted portfolio or a promotable trial in your organization | A message telling you it wasn't found |
| You chose a premium allocation method without enough tokens to unlock it | A message showing the cost and your available balance |

### Adding members by trial ID

You don't have to pick members only from the picker. You can type in the numeric ID of a study trial directly, and Fintela will automatically promote it to a managed portfolio the moment you save: exactly as if you'd promoted it yourself first. Already promoted portfolio IDs and raw trial IDs can be freely mixed in the same group.

### What creating a group does not do yet

> [!IMPORTANT]
> Capital, your broker account, paper vs. live, order policy, protective exits, benchmark, the rebalance start date, and per member weights are **not** part of creating a group. Saving only builds the group's structure: it never places an order or commits any capital.

| Setting | Where you actually set it |
|---|---|
| Capital, broker connection, paper vs. live | The deploy dialog, or the **Trade with your brokerage** dialog on the Operations tab |
| Per operation order override | The **Trade with your brokerage** dialog |
| Order policy, protective exit, benchmark, re entry rule, rebalance start date | The Trading Lab |
| Manual weights, risk budgets, per member overrides | The Trading Lab |
| Membership, after creation | The structure page, or Rank & Build in "add to group" mode |

### Editing a group's settings later

Opening a group's Edit option loads the same form, prefilled with its current setup, it just won't suggest a new name. Note that the registry's row menu doesn't link here directly; **Edit structure** takes you to the structure page instead, since that's where you'll do most day to day membership changes. This edit form is still useful for changing the basics: name, members, schedule, in one pass; reach it by bookmark or from the structure page.

### The structure page

This is where you manage membership and re weighting after a group exists. Its subtitle sums it up: **Members, data freshness and trading configuration. Performance lives in Portfolio Manager.**

| Header action | Notes |
|---|---|
| Back / Back to portfolio | Returns to wherever you came from |
| View performance | Opens Portfolio Manager; hidden if you arrived from there |
| Trading Lab | Disabled with zero members |
| Update portfolios | Refreshes stale members; disabled while already running or while the group is empty |
| More menu | Rename portfolio group, Seed, Daily update ON (disabled), Delete portfolio group |

> [!WARNING]
> You can't turn daily updates off from the interface, and once the group has any operation, Fintela won't allow it to be turned off at all: trading depends on members staying current. If you truly need it off, remove the group's operations first.

| Membership control | What it does |
|---|---|
| Portfolio ID field | Type in an ID and press Enter to queue it for adding |
| Add | Adds it to your working list (deduplicated) |
| Browse & filter | Opens Rank & Build in "add to this group" mode |
| Save changes | Appears only when your working list differs from what's saved; commits the change |

Member chips are color coded so you can see status at a glance:

| State | What the chip tells you |
|---|---|
| External strategy | Can't extend daily: remove it from the group |
| Daily updates off | Frozen: can't stay up to date |
| Behind the market | Stale: click **Update portfolios** |
| Healthy | Up to date |

With no members at all, the panel reads **No portfolios. Add some below.**

The page also offers **Optimize Risk Managers**: one row per member, each with an **Optimize RMs** button. It runs a risk manager optimization for that one member, creating a new study; the group itself is never touched until you decide to bring the winning result back in. It's disabled for a member that already has a risk manager. See [risk managers](/docs/risk-managers).

**Seed** opens a dialog showing the group's current rebalancing signal: either **Blended** (the combined target) or **By member** (each portfolio's own weights). This is available on plans that include raw signal export, since whoever holds it can trade on it directly outside Fintela; it doesn't cost tokens to view.

### Freshness: keeping members up to date

Every membership view shows how current each member is. A member can be **stale** (behind the latest market bar) and also **not scheduled** for daily updates at the same time: the two are checked independently.

| Chip | Copy |
|---|---|
| Fresh | **{{count}} up to date** |
| Stale | **{{count}} stale** |
| Not scheduled | **{{count}} not on daily updates** |

with hints: *"Stale portfolios haven't reached the latest market day. Click 'Update portfolios'."* and *"Some portfolios aren't scheduled for daily updates and can't be invested. Enable daily updates first."*

**Update portfolios** queues a background refresh for every stale member. It's safe to click more than once (a member already refreshing isn't queued twice) and an info banner lets you know it's fine to leave the page while it runs.

### The Trading Lab

The Trading Lab is where you configure (and re simulate) a group's trading strategy after it's created, opened from the structure page. Its left column configures; its right column previews the effect.

**Allocation and schedule**

| Control | Notes |
|---|---|
| Allocation method + parameters | The same picker as the creation form, but reflecting this group's own unlocked methods: an already unlocked premium method shows the **Unlocked** chip and skips the charge |
| Rebalance switch and cadence | Seeds to 30 data days |
| Rebalance anchor (start date) | Defaults to the group's creation date; editable only here |

**Order policy** (the shared rules every order inherits)

| Control | Values |
|---|---|
| Order type | Market, Limit, Stop, Stop limit, Trailing stop (the stop family is marked "protective, coming soon") |
| Time in force | Day, Good till canceled, At the open, At the close, Immediate or cancel, Fill or kill (some marked "not yet on the buy leg") |
| Limit offset (bps) | A marketable cushion above the reference price: higher fills more reliably, lower ties up less of your reserved cash |
| Order intent preview | Shows the buy leg and sell leg your settings will actually produce |

Sells that fund a rebalance are always sent as market orders, good for the day, so they fill and free up buying power reliably; buys carry whatever order type and time in force you configured, as a bounded marketable limit. Today, only market and limit orders (with day or good till canceled) are actually used for rebalancing; the rest are saved but not yet wired into live execution, and choosing one of the stop family types for the buy leg is refused with a message explaining they're reserved for protective exits.

**Protective exit**

| Control | What it sets |
|---|---|
| Arm a protective exit | Turns the feature on |
| Protective order type | Stop, stop limit, or trailing stop only |
| Time in force | Day or good till canceled |
| Stop offset (bps below) | How far below entry the stop sits |
| Limit offset (bps below) | For a stop limit |
| Trail (%) | For a trailing stop |

A protective exit is an optional resting order armed for each long position right after a buy fills. It sits at your broker and triggers if price falls to your stop; a trailing stop tracks the position's high water mark and ratchets up as the position gains.

**Re entry, benchmark, weights**

| Control | Default | Notes |
|---|---|---|
| Re enter after a stop out | Off | Off (default): a symbol that gets stopped out stays out until you change the config: a hard stop loss. On: the next rebalance can buy it back to target |
| Days out after a stop | 0 | Shown only while re entry is off. Trading days the symbol stays out; 0 keeps it out for the whole stage |
| Benchmark | Platform default | Alpha, beta, and information ratio are measured against this: and if the group is allocated by one of those metrics, it also decides the weights |
| Manual weights | Even split | Only when the method is Manual. A running total is shown; it's normalized to 100% before saving |
| Risk budget per portfolio | 1 per member | Only when the method is Risk parity. Relative shares, renormalized automatically: equal shares is classic risk parity |
| Per strategy overrides | Inherit from the group | One form per member; when two members hold the same symbol, the one contributing the most dollars to it wins |

**What if hypothesis** is preview only: exclude names or sectors, pick a date window, and optionally reallocate the freed weight to the remaining names. It reshapes the backtest preview on the right: nothing here is ever saved to the group or sent to live trading.

**Re simulate** runs a fresh backtest reflecting your new settings, and this uses tokens the same way any backtest does. The preview badge tells you what you're looking at (**Committed track record**, **Unsaved preview**, or **Inverted (what if)) backtest only**: with a delta grid showing the impact versus your committed track record.

**Save & apply** saves your allocation, schedule, order policy, protective exit, re entry rule, benchmark, and manual weights together. Per strategy overrides save as a separate step; if some of those fail, you'll see a message telling you how many didn't save, while the rest of your configuration is kept.

**The rewrite prompt** appears only for a group that has never traded and already has a committed backtest:

| Element | Text |
|---|---|
| Title | **Apply to the backtest?** |
| Body | **This portfolio group has not started trading, so its backtest can be recomputed with the configuration you just chose.** |
| Hint | **Rewrite recomputes the whole curve from inception. Apply forward only freezes the current curve and starts a new stage from today: use it if you want to keep the existing record.** |
| Buttons | **Rewrite backtest** · **Apply forward only** · **Cancel** |

> [!CAUTION]
> **A group that has ever traded can never have its backtest rewritten.** Once a group has placed a real trade through any operation (even one that's since been stopped) every configuration change that would affect the backtest (a new rebalance start date, allocation method, its parameters, or turning rebalancing on or off) is applied forward only: it freezes the existing record and opens a new stage from today. Changing membership or manual weights never triggers this: only changes that would reshape the historical grid do.

### Deploying a group: capital, account, paper vs. live

The **Deploy Portfolio Group** action opens a dialog that collects the three things a group doesn't carry on its own, then creates the operation and starts it:

| Input | Notes |
|---|---|
| Broker account | A select over your active broker connections: each option shows its name and an environment chip: orange for live, blue for paper |
| Capital | An amount per group; the dialog shows the run's total when more than one group is eligible |
| Operation name | Optional label, e.g. "Paper $10k" |

With no active broker connection at all, the dialog shows a guided empty state: **Connect your brokerage account**: *"You need to link your brokerage credentials before you can trade this portfolio group. Add a connection under Account settings → Broker connections, then come back here."*

Before the run, each group is checked against its own freshness. Only a completely empty group is a hard block; stale members or members not on daily updates are shown as warnings you can still proceed past, since a member can catch up between the check and the actual launch.

Every group in the run settles into one of four outcomes:

| Outcome | Meaning | What to do |
|---|---|---|
| Deployed | Created and launched: capital is at work | Nothing |
| Created, not launched | The operation exists, but launching it failed | Open the group's Operations tab and launch it manually: this isn't a failure, just an extra step |
| Skipped | The group already has an operation on that connection | Nothing: re running a deploy over the same selection is expected and harmless |
| Failed | The operation was never created | Read the message; it names the fix |

The summary reads **{{launched}} of {{total}} groups launched.**, and any created not launched groups get a reminder pointing you to their Operations tab.

> [!WARNING]
> A few labels in this dialog haven't been fully translated yet, so you may occasionally see a raw text key instead of finished copy in some languages. The dialog's behavior is exactly as described here regardless.

> [!IMPORTANT]
> There's no per group live/paper switch: the environment is a property of the broker connection you pick. Because a group can hold one operation per connection, the same group can run paper and live at the same time, on two different connections. Live trading is additionally gated at the platform level. See [live trading](/docs/live-trading).

The single group equivalent, reached from a group's Operations tab, is the **Trade with your brokerage** dialog. It collects the same information, plus an optional order policy override just for that operation:

| Field | Notes |
|---|---|
| Brokerage account | Active connections only; defaults to the first one |
| Capital to trade ($) | Must be greater than 0. *"The total amount available to this trading session."* |
| Name | Optional, e.g. "Paper $10k" |
| Override order policy for this operation | Off by default. When on: order type (market or limit), time in force (day or GTC), and limit offset in basis points |

Warnings appear here too if members are stale or unscheduled. The confirm button reads **Create operation**: creating the operation alone doesn't place any trade; the next step is **Launch**.

### What an operation is

An operation is one deployment of one group against one broker connection. The group holds the shared trading rules; the operation holds its own capital, status, and rebalance clock: as the panel itself puts it: *"Each trading session invests this portfolio group through one broker account. The portfolio group holds the shared trading rules; each session runs its own capital, status, and rebalances."*

You won't find the list of an operation's activity inside the Portfolio Groups screen itself: head to the group's entry in Portfolio Manager and open its **Operations** tab. This registry only *starts* an operation and *counts* it toward the Total AUM column.

An operation's row shows its name (or the connection's label), the connection and capital, when it last rebalanced, and when it's next due: which stays blank until the operation has rebalanced at least once, or if the group is static, or if the next scheduled date isn't yet known.

| Status | Meaning |
|---|---|
| Draft | Created, never launched: no capital at work |
| Active | Trading |
| Paused | Positions held, rebalancing stopped |
| Stopped | Liquidated and finished; history is kept |

A small **→ {{status}}** chip appears while a change you requested (like a pause or stop) is still being carried out. **Rebalance pending** shows while a manual rebalance you asked for is queued, and **Connection revoked** / **Connection error** appears when the broker connection itself needs attention.

### Operation lifecycle

```text
  Draft ──Launch──► Active ⇄ Paused
                       │        │
                       └────────┴──Stop──► Stopped ──Re-initiate──► Draft
```

An action that isn't valid for an operation's current state is refused and explained rather than silently ignored.

| Button | Shown when | What it does |
|---|---|---|
| **Launch** | Draft, connection healthy | Places the initial buy and starts trading (Draft → Active) |
| **Pause** | Active, connection healthy | Stops rebalancing but keeps current positions (Active → Paused) |
| **Resume** | Paused, connection healthy | Resumes rebalancing and re buys into the market (Paused → Active) |
| **Stop** | Active or Paused, connection healthy | Liquidates all positions and stops the operation |
| **Force stop** | Active or Paused on a revoked/errored connection | Marks the operation Stopped locally so you can delete it: positions are **not** sold; close them directly at your broker |
| **Re initiate** | Stopped | Resets it back to Draft so it can be launched again; history is kept |
| **Rebalance** | Active or Paused, connection healthy | Recomputes member weights on the operation's next cycle |

> [!CAUTION]
> Only actions that **add** exposure require paper trading access on your plan: creating an operation, launching one, and resuming to Active. Pausing, stopping, and resetting back to Draft are always available, on every plan: you're never locked into a position you can't get out of because of your plan tier.

If you try Force stop on a connection that's still working normally, Fintela stops you: use **Stop** instead: force stop is reserved for connections that are revoked or erroring.

**Manual rebalance** opens a dialog explaining what it will do: *"Recomputes the member weights via the allocation method (the portfolio group's portfolios stay the same)"*, with a warning that it places live buy/sell orders at your broker on the next cycle. You choose whether the rebalance schedule's counter keeps going from where it was, or restarts from today. Two safety limits apply: you can't request a rebalance more than once every 60 seconds, and a rebalance is held back if the operation already has 50 or more orders still settling: both cases tell you to try again shortly.

**Position drift** blocks rebalancing outright. If your broker's reported positions diverge from Fintela's own records and that divergence hasn't been acknowledged, a warning explains it symbol by symbol (expected quantity, broker reported quantity, and the difference) flagged as either unexplained or a likely corporate action. Acknowledging it is treated as a real money, irreversible action, so you're asked to confirm explicitly before rebalancing can proceed.

### Messages you might see before a launch

Fintela checks a group thoroughly before it lets capital move, both when you create an operation and again right before launch, and every refusal names the fix:

| Situation | What it means |
|---|---|
| Empty group | Add at least one member before starting or launching it |
| Daily updates off | Turn daily updates on for the group first |
| Stale members | Refresh the group (**Update portfolios**) before investing |
| Members not on daily updates | Turn daily updates on for those specific portfolios first |
| A member uses an External strategy | Remove it: External members can't stay current automatically |
| A member built from other portfolios hasn't finished consolidating | Run **Update portfolios** and wait for it to finish before investing |
| A member holds short crypto | Remove it: your broker can't short crypto |
| A member holds shorts without margin enabled | Enable margin/short selling on the broker account, or remove the shorts |
| An external risk manager is reached over an unencrypted connection | Move that endpoint to a secure address, or explicitly confirm you accept the risk |
| Your order policy isn't supported for live rebalancing yet | Check the order type and time in force |
| Capital exceeds the connection's per rebalance limit | Lower the amount, or ask to have the connection's limit raised |
| Capital is zero or negative | Enter an amount greater than zero |
| The group already has an operation on that connection | Pick a different connection, or use the existing operation |
| The connection isn't active or isn't yours | Check Account settings → Broker connections |

Changing membership on a group with a **live** operation has its own guards, so you can't accidentally disrupt something already trading:

- A member built from other portfolios that hasn't finished consolidating its holdings: wait for the next update, or remove it.
- A member holding short crypto: your broker can't short crypto, so remove it first.
- A member holding short equity on an account not enabled for margin: enable that on the account, or remove the shorts.

By default, a single rebalance can move up to $250,000 through a given broker connection at once: enough headroom for most portfolios, and a safety limit against an oversized order going out by mistake. If your strategy genuinely needs more, this limit can be raised for your connection.

### Orders, allocations, activity, and end of day reports

Opening an operation reveals five read only tabs:

| Tab | Columns | Empty state |
|---|---|---|
| **Allocations** | Portfolio, Weight, Triggered by, When | No weight snapshots yet: they appear after the first rebalance |
| **Orders** | When, Portfolio, Ticker, Class, Broker id, Action, Side, Qty, Type, Fill, Status | No orders yet: they appear after Launch places the initial buy |
| **Activity** | When, Actor, Event, Detail | No activity yet |
| **Reconciliation** | Day, Scope, Outcome, Fills matched, Discrepancies, Ran at | No reconciliation yet (runs end of day) |
| **Positions** | Symbol, Side, Qty, Avg entry, Current, Market value, Unrealized P&L, Today, with Long / Short / Gross / Net / Unrealized P&L roll ups | No open positions on this brokerage account |

- **Allocations** records one weight snapshot per member every time the group rebalances, along with what triggered it (the schedule, or a manual rebalance) and when.
- **Orders** records every order actually sent to your broker: ticker, buy or sell, quantity, order type, fill price, and status, plus the reason if your broker rejected it.
- **Activity** is a plain audit trail of what happened and when: for example, the exact moment an operation was launched. If Fintela can't record who started an operation, it doesn't start it, so this trail is always complete.
- **Reconciliation** is Fintela's end of day check against your broker's own numbers. The **Scope** column tells you whether a row is specific to this operation or a connection wide summary for that day.
- **Positions** is account wide, not per group (its own caption says so: *"Live positions on the entire brokerage account behind this connection) the whole account, not segmented by portfolio group."*

Allocations, Orders, Activity, and Reconciliation are also available read only through the [Developer API](/docs/api-baskets), so you can pull this history into your own systems or dashboards. Positions is the exception: it reflects your broker connection directly and isn't available through the API today; check this tab in the app instead.

### Who on your team can do what

Fintela splits Portfolio Group permissions into layers, so different people on your team can have different levels of access:

- **Building and configuring a group's structure** (its members, allocation, schedule, and even deleting it) sits behind one permission.
- **Viewing an operation's history** (its orders, allocations, activity, and reports) sits behind a separate permission.
- **Creating a new operation** is its own permission.
- **Launching, pausing, resuming, stopping, overriding an order policy, or acknowledging position drift** requires yet another.

In practice, a teammate can fully design a group's setup without being able to deploy a dollar of it, or view your live operations without being able to touch them. If an action here looks greyed out or gets refused for you, check with your organization's admin about your account's access.

## Execution modes

Internal and External are properties of a **[strategy](/docs/strategies)**, not of a Portfolio Group: a group has no execution mode choice of its own; it's a container plus a trading policy. What the two modes decide here is **which portfolios are allowed to be members**.

| Mode | What it means for you | Can it be a group member? |
|---|---|---|
| **Internal** | Strategy logic you write and run inside Fintela's own strategy editor | **Yes**: the only supported case |
| **External** | A strategy you run yourself, in any language, on your own infrastructure and against your own private data, connected to Fintela | **No**: rejected everywhere |

### Why external strategies can't be members

Being a group member requires being a *managed portfolio*, and a managed portfolio has to extend every trading day: Fintela advances its value to the latest market close so the group's weights and orders always reflect current prices. That only works for strategies you write and run inside Fintela. A strategy running on your own infrastructure can't be advanced this way, so it can never keep a group's book current, and a group with a stale member can't be launched.

This is checked at every point where it could matter:

| Where | What happens |
|---|---|
| Creating a group, or changing its membership | You're told the portfolio uses an External strategy and can't be added: remove it to continue |
| Creating or launching an operation | The same check runs again, listing every offending member, before anything reaches your broker |
| Promoting from Rank & Build | A banner flags any selected trial using an External strategy, with a one click action to remove just those and keep going |
| The structure page | The member's chip turns red, labeled "{{name}} · EXTERNAL," so you can spot and remove it before you try to deploy |

Freshness also reports each member's strategy type directly, so an External member that slipped in through an older workflow is visible before you try to launch.

> [!NOTE]
> If your strategy is External today, the only path into a Portfolio Group is to rebuild it as an Internal strategy inside Fintela. There's no bridge or opt in mode for this. See [external strategies](/docs/external-strategies) and [execution modes](/docs/execution-modes).

### External risk managers can still drive a live group

External risk managers work differently, and they're fully supported. A member can use a risk manager that calls out to your own endpoint on every tick, and that risk manager genuinely drives orders inside a live operation. This is a separate capability from running an External *strategy*: it isn't blocked.

There's one safeguard: before a launch or a resume, Fintela checks every active member's external risk manager endpoint. If any of them is reached over an unencrypted connection, the launch is refused, because that risk manager's response shapes real orders, and an unencrypted connection means it could be read or altered in transit. You'll see a dialog titled **"This endpoint is unencrypted,"** explaining that anyone on the network path could alter it, with a checkbox to confirm you understand and accept the risk, and a **Trade anyway** button to proceed regardless. This acceptance is per attempt and never remembered: close the dialog, or restart the operation later, and you'll be asked again. It fails safe by default.

### Pulling your Portfolio Group data into your own tools

You can pull your Portfolio Groups (their settings, freshness, deployments, and trading history) into your own systems or dashboards, using a personal access key from your account settings. See the [Developer API overview](/docs/api-overview) and [API authentication](/docs/api-authentication) to get started, and [the Portfolio Groups API reference](/docs/api-baskets) for the full set of what's available.

This access is **read only**, by design: it lets you build your own reporting or monitoring without any risk of an accidental change to a live group. Every action that actually changes a group (creating, editing, deleting, deploying, launching, pausing, stopping, rebalancing, or refreshing members) has to happen inside Fintela itself, since several of those actions consume tokens or place real trades, and a personal access key is meant for safely pulling data out, not triggering billable or capital moving actions from outside the app.

One thing isn't available through this API today: your current broker positions, which come straight from your brokerage connection rather than from Fintela's own records, check the **Positions** tab in the app for those. Large result sets are automatically split into pages so they stay fast to load, and, same as everywhere else, a group outside your own organization simply isn't visible to your key.
