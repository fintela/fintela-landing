---
title: Asset Groups
section: Registries
sectionOrder: 3
order: 2
published: true
updated: 2026-09-01
summary: Build and manage the saved lists of tickers and portfolios your studies trade against.
keywords: asset group, universe, tickers, portfolio group, index membership, screener, market filters, registry
---

An asset group is a named, saved list of instruments that belongs to your organization. Think of it as your trading universe: a [study](/docs/studies) uses one asset group to define what its strategy is allowed to trade, and optionally a second one to define what its fitness function is scored against. You build an asset group with a screener that lets you filter the entire market by sector, valuation, performance, and more — but only the tickers you actually select get saved. The filters you used to find them are not stored, and the group never updates itself afterward.

## Overview and purpose

### What an asset group holds

A group can hold two kinds of members, and a single group can mix both:

| What you can add | What it means |
|---|---|
| Individual tickers | Real, tradeable instruments from Fintela's ticker data, across US equities, crypto, and forex |
| Portfolio group members | An entire graduated [portfolio group](/docs/portfolio-groups) — its combined equity curve is added to the group as if it were a single instrument, so it can be scored and traded just like a ticker |

A group needs at least one ticker or at least one portfolio group member to be valid. A group made up entirely of portfolio groups — a "portfolio of portfolios" — is perfectly fine.

> [!WARNING]
> An asset group does not carry a date range, a timeframe, or a choice of data source. Date windows are set on the study that uses the group, not on the group itself. Fintela's price history is daily bars only, and the market data your studies run on is the same for everyone on the platform — it isn't something you configure per group.

### Static membership, and the one exception

Whatever you have selected when you save is exactly what gets frozen into the group. The builder reminds you of this directly:

> An Asset Group saves a fixed ticker list; filters are not re-evaluated later.

That's the single most important thing to understand about asset groups. The screener you use to build one is a *selection tool*, not a live filter. None of your search settings — the exchange, the filter values, the sort order, or the "Include no-data" toggle — are saved. Only the resulting list of tickers (and portfolio group members) is kept, and it is never recalculated for you afterward.

The one exception is a group created automatically by the [study builder](/docs/studies) when you choose a platform grouping — a sector ETF collection, an index, or a sector — as your study's universe. Fintela creates and maintains that group for you, and re-picking the same grouping later refreshes its membership to match. These automatically-managed groups don't clutter your registry — you won't see them in the Asset Groups list, since you never need to manage them directly.

### You may still see the old name "Data Cluster"

Asset Groups used to be called **Data Clusters**. The screens were renamed, but a few leftover mentions of "cluster" still show up here and there — in a tooltip, a button caption, or some placeholder text. If you run into a message that says "cluster" instead of "asset group," it's the same feature; there's no separate object to worry about. If you have an old bookmark or link starting with `/dataCluster`, it still works — it takes you straight to the matching `/asset-groups` page.

### What uses an asset group

Once you've built an asset group, here's where it gets put to work:

- **Studies** are the main consumer. Every study needs an asset group as its strategy universe, and can optionally use a second one as its fitness universe. A study that references a group makes that group read-only and impossible to delete until you remove the reference — see the row actions below.
- **The strategy and fitness editors** let you pick an asset group as the universe your code explores when you test it in the sandbox.
- **The study builder** reads a group's date coverage to suggest sensible date ranges and to set the limits on its date pickers.
- **Markets** lets you create a group directly from a ranking result, through the **"Create Asset Group from Ranking"** action.
- **A launched study** can hand its exact runnable universe back to you as a new asset group, with the **"Save as asset group"** button.
- **The Developer API** exposes a read-only list of your groups, so you can pull them into your own tools — see [Asset Groups API](/docs/api-asset-groups).

### Date coverage and data quality

An asset group doesn't store its own dates, but Fintela can tell you exactly what calendar its members cover. This isn't shown directly on the group's own page — there's no coverage panel there — but it powers other parts of the product:

- The [study builder](/docs/studies) uses it to suggest date presets and to bound the date pickers when you set up a study against this group.
- The strategy and fitness sandboxes use it the same way.
- [Fintelligent](/docs/fintelligent) can look it up for you if you ask about a group's coverage or data quality.

In plain terms, Fintela can tell you:

- **How far back and how recent the group's data goes** — both the widest span across all members, and the narrower window where *every* member has data at once.
- **The latest date on which every instrument in the group has a complete, priced bar** — useful for knowing where it's safe to end a backtest.
- **How much classification data is missing** — how many of the group's tickers lack a sector, industry, country, or type, which matters if you plan to filter or group your results by that information later.

A couple of things worth knowing about these numbers:

- Coverage is calculated per member — a ticker or a portfolio group's curve alike — so a group made only of portfolio groups still gets a full, usable calendar, taken from those portfolios' own backtest history.
- The very latest day is only offered once every member in the group has a fully priced bar for it, so a still-updating "today" is never presented as something you can select as an end date.

## Registry table view

You'll find the Asset Groups registry in the sidebar's **Registry** section (see [navigation](/docs/navigation)). It looks and behaves like the other [registries](/docs/registries) on the platform, so if you're used to Strategies or Studies, this will feel familiar.

### Command bar

| Control | What you'll see | What it does |
|---|---|---|
| Page heading | **Asset groups** | — |
| Search box | **Search groups or symbols…** | Searches as you type; a **Clear** link resets it |
| Filter | **Filter** | Opens the filter panel |
| Column chooser | icon button | Lets you show or hide columns (not available in card view) |
| View toggle | **List view** / **Card view** | Switches how the registry is displayed |
| Help | **View documentation** | Opens this documentation in a side drawer |
| Refresh | **Refresh** | Reloads the list |
| Quota meter | — | Shows how many asset groups you've used against your plan's limit |
| Create | **New Asset Group** | Opens the create flow |

The Create button adapts to your situation. It's disabled if your role doesn't allow creating asset groups. If you've reached your plan's asset group limit, it stays enabled — clicking it opens the upgrade dialog instead of the create flow, so you're offered a way forward rather than a dead end. See [tokens and billing](/docs/tokens-and-billing).

### Columns

Five columns exist, though only four show by default — you can turn on the fifth from the column chooser.

| Column | Shown by default | What it shows |
|---|---|---|
| Name | yes | The group's name |
| Description | yes | A short description (see below) |
| Author | yes | Who created the group |
| Tickers | no | The number of tickers in the group |
| Created At | yes | When the group was created |

By default, rows are sorted by creation date, newest first; groups with no creation date sort to the end.

> [!TIP]
> The Description column doesn't necessarily show the text you typed. By default it shows a short **auto-generated summary** built from the group's own contents — how many tickers, how many portfolio group members, which symbols, and which exchanges. Your own hand-written description isn't lost — it moves into a tooltip labeled **Author's note** when you hover over the row.

The auto-generated summary reads something like:

> Asset group holding 42 tickers, 2 portfolio group members. First symbols: AAPL, MSFT, NVDA, AMZN, GOOGL +37 more. Exchanges: US.

Asset class isn't part of this summary and isn't a column — Fintela doesn't classify asset groups by type.

### Search, filters and sort

The search box looks across the group's name, its description, your own note, and the author's name. Because the auto-generated description includes symbols, counts, and exchanges, you can find a group by typing something like `AAPL`, `FOREX`, `42 tickers`, or a teammate's name.

The filter panel lets you narrow the list by:

| Filter | Type |
|---|---|
| Name | text |
| Description | text |
| Author | pick from a list |
| Tickers | number range |
| Created At | date range |

Your search, filters, and sort settings are saved in the page's link, so you can share a filtered view with a teammate just by sending them the URL. Your view mode (list or card) and which columns you show are remembered on your own device instead.

If you switch the workspace filter to "My" and see nothing, a banner tells you why rather than letting you think the organization has no asset groups at all — it explains that you're only seeing your own, and offers a **Show all asset groups** button to see your teammates' groups too.

### Insights band

Above the table, an insights band summarizes whatever rows are currently visible:

| Tile | What it tells you |
|---|---|
| Insights | How many groups are shown |
| Dependent studies | How many studies, in total, use these groups |
| Graduated portfolios | How many graduated [portfolio groups](/docs/portfolio-groups) trace back to these groups |
| Quality | Average "well-trained" percentage across the visible groups, color-coded green, amber, or red |

Below the tiles, you'll find short rank lists of the groups with the most graduated portfolios and the most dependent studies, plus details on whichever row you have selected. If there's nothing to show, it simply reads **"No insights for this view."**

### Row action menu

Rows aren't clickable links — clicking (or right-clicking) a row opens a small menu of actions instead, with **View** as the only way to open the group itself.

| Action | What it does | When it's unavailable |
|---|---|---|
| View | Opens the group's read-only detail page | Always available |
| Edit | Opens the group in the editor | The group is used by a study, or your role can't edit |
| Duplicate | Creates a copy of the group | Your role can't create groups |
| Copy ticker codes | Copies the group's ticker symbols to your clipboard | The group has no tickers |
| Delete | Opens the delete confirmation | The group is used by a study, or your role can't delete |

There's no Share action, because asset groups don't have a private mode — every asset group you create is automatically visible to your whole organization, and there's no way to restrict one to just yourself.

**Duplicate** finds a free name automatically: it tries `"<name> (copy)"` first, then `" (2)"`, `" (3)"`, and so on if that name is already taken. The description, tickers, and portfolio group members all carry over, and you become the new copy's author.

**Copy ticker codes** copies the tickers in the group's own order, formatted so you can paste the list straight into a Python or JavaScript script (for example, `['AAPL','TSLA']`). You'll see a confirmation message telling you how many codes were copied — and if some couldn't be resolved to a symbol, it tells you that too.

### Bulk selection and delete confirmation

Selecting one or more rows turns the toolbar into an action bar showing how many you've selected, a **Delete** button, and a **Clear selection** link.

Deleting one group or several opens the same confirmation dialog, warning that any studies that depend on the group(s) may be affected.

> [!CAUTION]
> Deletion is permanent — there's no way to restore a deleted asset group. If you select several groups and confirm, each one is deleted individually. Because it's a hard delete, it also frees up a slot against your plan's limit right away.

If a study still uses the group, deletion is refused with a message telling you to delete those studies first.

> [!WARNING]
> The dependent-studies count you see in the insights band only counts studies that are still active. If a study was deleted but still technically references the group, that group can show zero dependent studies, let you click Delete, and still fail. If that happens, check whether you or a teammate have any deleted studies that might still reference the group.

### Relations expander

Each row has an expandable arrow that shows how the group connects to the rest of your workspace — which studies, strategies, fitness functions, other asset groups, and risk managers it's linked to, either directly or through a study. If nothing is linked, it says so; if the data fails to load, it tells you that too. This information is fetched once, the first time you expand any row.

### Empty and error states

If you haven't created any asset groups yet, the registry invites you to create your first one to define a universe to trade. While the list loads, you'll see a skeleton table; if loading fails, you'll see a message telling you the list couldn't be loaded.

### Confirmation messages

You'll see a brief confirmation message whenever you create, duplicate, update, or delete an asset group, or when a study's frozen universe is saved as a new one — so you always know your action went through.

### Roles and quotas

What you can do with asset groups depends on your role in the organization:

| Role | What you can do |
|---|---|
| Owner | View, edit, create, delete |
| Admin | View, edit, create, delete |
| Manager | View, edit, create |
| Analyst | View, create |
| Unrecognized role | View, create |

> [!WARNING]
> Deleting an asset group requires a higher level of access than the table above might suggest. If you're an Admin and your account isn't fully provisioned for deletion, you may see an enabled Delete button but get a permission error when you use it. If that happens, ask your organization's owner to check your access.

How many asset groups your organization can have is capped by your plan — the free tier includes **2 asset groups per organization**, counted as however many you currently have. Creating a new one, duplicating one, or saving a study's frozen universe as a new group all count against this limit; deleting a group frees up a slot immediately. See [tokens and billing](/docs/tokens-and-billing).

Unlike some premium features, Asset Groups is available on every plan — you won't find it locked behind an upgrade prompt.

## Building an asset group

> [!NOTE]
> Creating an asset group is a single screen, not a series of steps. The only pop-ups are the optional Portfolio Groups dialog and the naming dialog you see when you save.

### Entry points

You can start creating an asset group from several places:

| Where | How |
|---|---|
| Asset Groups registry | The **New Asset Group** button |
| Direct link | Opening the create view from the registry |
| Fintelligent | Ask [Fintelligent](/docs/fintelligent) to create, edit, or duplicate an asset group for you — see [Fintelligent capabilities](/docs/fintelligent-capabilities) |
| Markets | The **Create Asset Group** action on a ranking result |
| Studies | **Save as asset group** on a launched study's frozen universe panel |

### Page header and layout

| Mode | Title | Subtitle |
|---|---|---|
| Create | **Create Asset Group** | **Define a new asset group by selecting tickers and filters** |
| Edit | **Edit Asset Group** | **Update definition and ticker selection for this asset group** |
| View | The group's name | The group's description |

When you're just viewing a group, every field is read-only and a **Back** button takes you to the registry — the only thing you can still do is copy the ticker codes.

If you're editing an existing group, your current selection is pre-loaded. Note that the name and description aren't shown on the main screen while you work — you set those in the confirmation dialog when you save.

The screen itself is organized top to bottom: a command bar for choosing your market and searching, a filter panel below it, a summary bar showing your active filters and how many instruments currently match, and finally the results grid on the left with your running selection on the right.

### Command bar fields

| Field | Options | Notes |
|---|---|---|
| Exchange | **US**, **Crypto**, **Forex** | There's no "All markets" option — you always search one market at a time. Switching markets changes what you're searching, but never touches what you've already selected |
| Search | Ticker or name | Searches as you type |
| Match readout | e.g. "8,412 listed · 6,203 with data · 340 match" | Shows the full market size, how many have usable price data, and how many currently match your filters |
| Include no-data | on/off, default off | When off, instruments without recent price data are hidden from your results |
| Coverage warning | icon, shown only when relevant | Warns you that filter results might be temporarily inaccurate because the day's data hasn't fully updated yet |
| Portfolio Groups | button, shows a count when you've added any | Opens the dialog for adding whole portfolio groups as members (see below) |

### Contextual banners

Two banners can appear above the filter panel, depending on what you're doing:

**Survivorship notice** — appears when you're browsing a historical index membership, "Include no-data" is off, and some past members are being hidden because they no longer have recent price data. It tells you how many are hidden and offers an **Include them** button — useful because a historical universe usually *should* include instruments that were later delisted or dropped, to avoid survivorship bias. Fintela never turns this on for you automatically, since it would silently widen what you're about to save.

**Paused criteria** — appears when you switch markets and some of your filters don't apply to the new one. Rather than deleting those filters, Fintela pauses them: they're shown as removable chips with a **Dismiss** button, and they're excluded from your match count until you either delete them or switch back to a market where they apply.

### Filter categories and data coverage

Filters are grouped into three categories, always visible as you search:

- **Classification** — sector, index membership, industry, theme, and similar categorical filters
- **Size & Value** — market cap, valuation ratios, margins, and other fundamentals
- **Performance** — price, volume, technical indicators, and other trading metrics

Each category shows a handful of the most useful filters up front, with a "show more" option for the rest. When a category has nothing useful to offer on the current market, it says so plainly instead of showing empty controls — for example, "No sector or industry classification is collected for Crypto."

Not every filter is equally reliable on every market, and Fintela is upfront about it:

- Filters with strong data coverage behave normally.
- Filters with thin coverage — say, under 10% of instruments — still work, but are labeled to let you know how many instruments actually have that data.
- Filters that exist on other markets but have no data at all on your current one are shown disabled, with a tooltip explaining that this market has no data for it.
- Filters that are planned but not yet available anywhere are shown disabled and marked "Coming soon."

If a filter is already active, it's always shown to you — an active filter is never tucked away, even if it would otherwise be hidden behind "show more."

### Available filters

**Classification filters:** Sector, Index, Industry, Theme, Sub-theme, Country, and Type. All of these let you pick one or more values, except Index, which works differently — see [Index membership](#index-membership-point-in-time-universes) below. Picking a Theme narrows the Sub-theme choices to that theme's children, so the two filters always stay consistent with each other.

**Size & Value filters** — all are range filters, each with a full set of preset ranges plus a custom option:

Market Cap, P/E, Dividend Yield, P/B, Net Margin, ROE, P/S, Forward P/E, PEG, EBITDA, Revenue, Revenue/Share, Operating Margin, Gross Margin, ROA, ROIC, EV/EBITDA, EV/Sales, P/C, P/FCF, Debt/Equity, LT Debt/Equity, Current Ratio, Quick Ratio, Payout Ratio, EPS Growth, Sales Growth, EPS Surprise, Insider Ownership, Institutional Ownership, Shares Outstanding, and Float.

On crypto markets, several of these are swapped automatically for the metrics that actually apply — Diluted Cap, Dominance, Circulating Supply, Total Supply, and Max Supply — since equity fundamentals like P/E don't exist for crypto assets.

**Performance filters** — also all range filters with presets and a custom option, built entirely from end-of-day data so they work reliably on every market:

Price, Avg Volume, Change, RSI 14, vs SMA50, 52-Week Range, Volume, Relative Volume, 90-Day Volatility, ATR 14, Beta, vs SMA20, vs SMA200, Gap, Short Float, Short Ratio, Analyst Recommendation, Target Price, All-Time High, and All-Time Low.

### Range presets

Instead of typing raw numbers, each range filter offers a dropdown of named presets — for example, market cap has **Mega ($200B+)**, **Large ($10-200B)**, **Mid ($2-10B)**, **Small ($300M-2B)**, **Micro ($50-300M)**, and **Nano (<$50M)**. The first option is always **Any**, which clears the filter, and the last is **Custom…**, which lets you type your own minimum and maximum.

Other filters offer presets suited to what they measure — **Profitable**, **Positive**, **Negative**, **Oversold**, **Overbought**, **Strong Buy**, and so on, depending on the filter.

> [!NOTE]
> Whatever units make sense for a filter, the control shows and accepts them directly — percentages as percentages, dollar amounts in millions, and so on. You don't need to convert anything by hand.

### Index membership: point-in-time universes

The Index filter is one of the more complex — and most easily misunderstood — controls in the screener. Unlike every other filter, it has a time dimension: it selects the instruments that were members of an index **according to a timing rule you choose**, and whatever it resolves to is what gets frozen into your group.

| Setting | Options | What it means |
|---|---|---|
| Index | pick one | Each option shows how many instruments currently qualify |
| Evaluated at | Current, Ever, Period, On a date | When membership is checked |
| Membership (Period only) | At any point / The whole period | Whether an instrument only needs to have been a member at some point during the period, or a member throughout it |
| Dates (Period only) | From / To | The date range to check |
| Date (On a date only) | a single date | The exact date to check membership as of |

**Period defaults to "At any point,"** which is the setting that avoids survivorship bias — it includes instruments that were later removed from the index.

If an index has no historical membership recorded, the modes that depend on history are disabled with a tooltip explaining why. When history is available, you'll see the date range it covers, and the date pickers are limited to that range.

> [!TIP]
> An index-based selection is still just a snapshot. Once you save, the group holds whatever instruments the rule resolved to at that moment — it does not keep tracking the index afterward. If you want delisted or removed members included, pair a historical mode with the **Include them** option on the survivorship banner.

Broader platform groupings — like sector ETF collections or "the S&P 500 as a universe" — aren't picked here. You choose those in the [study builder](/docs/studies) instead, which creates and maintains a matching asset group for you automatically; you won't see those groups in this registry, since you don't need to manage them yourself.

### Results grid

The results table shows the instruments that match your current filters, with columns that adjust to what data is actually available on the current market — for example, a column for a metric with zero coverage on Forex simply won't appear there.

You'll typically see: Ticker (or Pair, on Forex), Name, Price, Change %, Volume, Avg Volume, Market Cap, Sector, Industry, Theme, Sub-theme, Relative Volume, RSI, ATR, Volatility, vs SMA50, and 52-Week Range. Clicking a Theme or Sub-theme tag adds it as a filter. Every column except Theme and Sub-theme can be sorted; results default to sorting by market cap on US stocks and by average volume on crypto and forex.

Selecting every matching instrument is a single click — a header checkbox lets you select all matches, not just the ones currently loaded on screen.

The footer keeps three different numbers separate, on purpose, because they answer different questions:

- **How many match** your current filters, in total.
- **How many are shown** so far — the grid loads up to 5,000 rows at a time, and if more match, it tells you so and suggests narrowing your filters.
- **How many are selected** — the set that will actually be saved into your group, capped at **10,000 instruments**. If your selection would exceed that, Fintela keeps the top instruments up to the cap and tells you so.

Above the grid, a summary bar spells out your active filters in plain language — for example, "Sector is one of: Technology, Healthcare" — joined together, with a live count of how many instruments currently match all of them at once. The market you're searching is always part of that intersection but isn't shown as a removable chip, since you can't clear it — you can only change it.

### Your selection

On the right side of the screen, you'll always see the group you're actually building — this is what gets saved, independent of whatever filters are currently active.

- A header shows how many instruments are selected, and flags how many currently fall outside your active filters. **Your selection is never pruned just because you changed a filter** — the filters are only a discovery tool; they never remove something you've already chosen.
- A **Copy ticker codes** button copies your current selection to the clipboard in a format ready to paste into Python or JavaScript.
- A **Clear** button empties your entire selection.
- If nothing is selected yet, it reads: "Pick assets from the table to build the cluster."
- Above 2,000 selected instruments, Fintela stops showing individual names and just shows the count, to keep things responsive.
- A small breakdown at the bottom shows your top markets and sectors by count, and flags when your selection spans more than one exchange — a reminder that the market filter only scopes what you're searching, not what's actually in your saved group.

### Adding portfolio groups as instruments

The Portfolio Groups dialog is where you add whole portfolios to an asset group, rather than individual tickers. Open it from the command bar.

Each portfolio group you add contributes its combined equity curve, and Fintela scores and trades that curve exactly like it would a ticker's price series — which is what lets you build a strategy that allocates capital across portfolios you've already validated, instead of picking individual names.

A couple of things worth knowing:

- Adding a portfolio group only adds its curve. If you also want a strategy built on this asset group to be able to trade the actual tickers a portfolio group holds, you need to add those tickers to the group separately.
- If a portfolio group you add holds tickers that aren't already in your asset group, Fintela tells you which ones, in case you want to add them directly.
- If you try to save with a portfolio group that no longer exists or isn't yours, the save is rejected and you're told which one(s) couldn't be found.

### Naming and saving your asset group

The only place you name and describe an asset group is the confirmation dialog that appears when you click the primary save button.

| Mode | What you're asked |
|---|---|
| Create | Name your asset group to create it |
| Edit | Review the name and description before saving |

Both **Name** and **Description** are required — you can't confirm without filling in both, even though Description might look optional at a glance.

Before you get to this dialog, the save button itself stays disabled until your selection holds at least one ticker or portfolio group member, with a reminder message underneath the editor. A couple of other rules apply when you save:

- The same ticker symbol can't appear under two different exchanges within one group — if it does, you'll get a clear error naming the conflicting symbol and exchanges.
- If the group is already used by a study, you can't save changes to it until that reference is removed.

> [!WARNING]
> Names aren't guaranteed to be unique. When you're creating a new group, Fintela checks the name you type against the groups already loaded in your list and warns you if it looks like a duplicate — but that check only runs against what's currently loaded, and it doesn't apply when editing. If you specifically need a guaranteed-unique name, use **Duplicate** on an existing group instead, which always finds a free name for you.

The save button reads **Create asset group** or **Save changes**, depending on whether you're creating or editing, and it's disabled while saving or while your selection is empty. If you try to leave without saving, Fintela asks whether you want to keep editing, leave your draft in place, or discard it.

Speaking of drafts: if you leave the editor with unsaved changes, Fintela keeps them for you. The next time you come back — even if [Fintelligent](/docs/fintelligent) started the draft on your behalf — you'll see a banner letting you review it before deciding whether to keep it or start fresh from what's actually saved. You won't be allowed to save on top of an unreviewed draft without looking at it first.

### What gets saved

When you confirm, Fintela records the group's name, description, and your exact selection of tickers and portfolio group members. Nothing about how you found them — the market you searched, the filters you set, the sort order, the "Include no-data" toggle — is saved; only the resulting list is. Once your group is created or updated, you're taken back to the Asset Groups registry.

### Other ways an asset group gets created

Beyond the builder, an asset group can also be created for you automatically:

| Trigger | What happens |
|---|---|
| **Save as asset group**, on a launched study's frozen universe panel | Takes the exact universe your study actually ran on and saves it as a new group, named after the study by default. You can only do this once your study has been launched and has a frozen runnable universe — if it doesn't yet, you'll be told to launch it first. These groups show up normally in your registry |
| Picking a platform grouping (like a sector or an index) as a universe in the [study builder](/docs/studies) | Fintela resolves the grouping's current membership into a group behind the scenes. Picking the same grouping again later refreshes that group's membership, but never renames it. These groups are hidden from your registry — you never manage them directly |
| **Duplicate**, from the row action menu | Copies an existing group's description, tickers, and portfolio group members into a new, uniquely-named group |

Each of these counts against your plan's asset-group limit, the same as creating one by hand.

## Execution modes

### Asset groups don't have an execution mode

Across the other [registries](/docs/registries), an execution mode describes where your code actually runs:

- **Internal** — you write your logic directly inside Fintela, in Python, and the platform runs it for you.
- **External** — you host your own logic on your own systems, in any language, so it can use private data or models Fintela never sees, and connect it to Fintela to be scored and traded.

**Neither applies to asset groups**, because an asset group doesn't contain any code — there's nothing to run, so there's no Internal/External choice to make. You won't find an execution-mode filter or column on this registry, and there's no equivalent of "bring your own universe" by pointing Fintela at something you host: a group's membership is always built from Fintela's own instrument list plus your own portfolio groups, both of which already exist inside the platform.

For the same reason, asset groups don't have per-group visibility controls the way strategies or fitness functions might — every asset group you create is automatically visible to your whole organization.

### Where Internal and External do apply

If you're looking for the Internal/External choice, it lives on the code-carrying registries instead:

| Registry | Where to read about it |
|---|---|
| Strategies | [Strategies](/docs/strategies), [External strategies](/docs/external-strategies) |
| Fitness functions | [Fitness functions](/docs/fitness-functions), [External fitness](/docs/external-fitness) |
| Risk managers | [Risk managers](/docs/risk-managers) |
| The concept itself | [Execution modes](/docs/execution-modes) |

An externally-run strategy still needs an asset group to define its universe, the same as an internal one does. Choosing External changes where your strategy's *logic* runs — it never changes where the tradeable instrument list comes from.

### Two choices that can look like a mode, but aren't

Two settings in the builder are easy to mistake for an execution-mode-style choice. They aren't:

| Choice | Options | What it actually affects |
|---|---|---|
| Membership kind | Tickers, portfolio group curves, or both | What instruments end up in the group. A group made entirely of portfolio groups is perfectly valid |
| Discovery exchange | US, Crypto, Forex | Which market the screener is currently searching. It only scopes your search — switching it never touches what you've already selected, and a single group can hold instruments from more than one market |

### Using asset groups outside Fintela

If you want to pull your asset groups into your own tools, spreadsheets, or dashboards, the read-only Developer API lets you do that securely. You'll need a personal access key, which you can generate from your account settings — see [API authentication](/docs/api-authentication).

The API returns each group's name, description, ticker count, and creation date, scoped to your own organization, newest first. It's strictly read-only: there's no way to create, edit, or delete an asset group through it, so it can never change anything in your account by accident. See [Asset Groups API](/docs/api-asset-groups) for details.
