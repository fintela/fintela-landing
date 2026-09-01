---
title: Promoted Portfolios
section: Registries
sectionOrder: 3
order: 8
published: true
updated: 2026-09-01
summary: The permanent portfolio a promoted trial becomes — the only kind of portfolio you can add to a portfolio group.
keywords: promoted portfolio, managed portfolio, promotion, trial, snapshot, immutable, lineage, registry
---

A promoted portfolio is the permanent, independent copy a trial becomes once you promote it out of a [study](/docs/studies). Promoting takes a complete snapshot — the strategy's code and parameters, the exact assets it's allowed to trade, its [fitness function](/docs/fitness-functions) and [risk manager](/docs/risk-managers) settings, its date ranges — and copies over its entire performance history: holdings, equity curve, and orders. From that moment the copy is frozen. Editing the [strategy](/docs/strategies), the risk managers, or the [asset group](/docs/asset-groups) it came from never touches it, and deleting the source study leaves it untouched. This registry is also the only place a [portfolio group](/docs/portfolio-groups) can draw its members from — so it's the definitive list of everything you can actually trade.

## Overview and purpose

### Trials are not portfolios

Fintela draws a firm line between two things that both get casually called "a portfolio."

| Term | What it is | Where you see it | Lifetime |
|---|---|---|---|
| **Trial** | One parameter combination the optimizer evaluated inside a study | The [Portfolios dashboard](/docs/portfolios-dashboard) | Belongs to its study — delete the study and every trial in it goes too |
| **Promoted portfolio** | A separate, independent copy of a trial you chose to keep | This registry | Survives deletion of its study, its trial, and even its original strategy |

> [!NOTE]
> You may occasionally see this called a "managed portfolio" in an older message or error — it's the same object. "Promoted portfolio" is the name used everywhere else in the product.

### What consumes a promoted portfolio

| Consumer | How it uses one |
|---|---|
| [Portfolio groups](/docs/portfolio-groups) | A group's members *are* promoted portfolios — the group wizard's member-picker is literally this registry, filtered down to what you select. |
| Daily updates | Extends each enrolled portfolio's performance one trading day at a time, based on its frozen snapshot rather than the live strategy. |
| [Live trading](/docs/live-trading) | Runs on portfolio groups — one level up from a single promoted portfolio, never on one directly. |
| [Developer API](/docs/api-trials-portfolios) | Lets you pull your promoted portfolios and their results into your own tools or dashboards, read-only. |

### Where the registry lives

Promoted Portfolios is deliberately kept **out of the main sidebar**. In the app drawer it sits inside the **More Options** flyout, third in the list, after Fitness and Risk Managers and before Data Explorer, Laboratory, and Fintelligent. The entry reads **Promoted Portfolios**.

Being tucked away doesn't make it hard to reach directly — a bookmarked link, or the URL typed straight into your browser, opens it normally. See [navigation](/docs/navigation) for how the flyout works.

> [!NOTE]
> This registry isn't in the command palette, and no onboarding tour points to it. Reach it through More Options, or by a direct link.

### Opening a specific promoted portfolio

There's no standalone detail page for a single promoted portfolio. Clicking into one — or opening a bookmarked link to one — takes you straight to that trial's [Portfolio Analysis](/docs/portfolio-detail) page instead, since that's where the charts and performance detail actually live. If the source trial no longer exists, the link falls back to this registry's list rather than showing a broken page.

### What this registry cannot do

There's no create, no edit, no duplicate, no rename, no un-promote, and no archive here. A promoted portfolio is a frozen snapshot, so there's nothing to edit — and promoting the same trial again simply hands you back the copy you already made, rather than creating a second one. The only two things you can do from this registry are **view a promoted portfolio's source trial** and **delete it**.

## Registry table view

### Loading, error, and empty states

| State | What you see |
|---|---|
| Loading | A placeholder title bar and card while your promoted portfolios load |
| Error | A message telling you the list couldn't load |
| Loaded | The registry itself |

The empty state, in both card and table mode:

> No portfolios have been promoted yet. Promote one from the Portfolios dashboard and it will appear here.

### Toolbar

A single row pinned to the top: the title on the left, everything else pushed to the right.

| Control | What it does |
|---|---|
| Title | Reads **Promoted Portfolios** |
| Filter | Opens the filter panel; shows a badge with how many filters are currently active |
| View mode | Switches between **List view** (table) and **Card view** (grid) |
| Choose columns | Lets you show or hide columns — only available in List view |
| Refresh | Reloads the list, along with any portfolio group names shown alongside it |
| **Promote portfolios** | Takes you to the [Portfolios dashboard](/docs/portfolios-dashboard), where promotion actually happens — it doesn't create anything on this page |

> [!WARNING]
> That button isn't "add new." Nothing on this page creates a promoted portfolio — you always promote starting from a trial on the Portfolios dashboard.

Two things you'll find on other registries but not here: a **View documentation** shortcut, and a page-specific **Actions** menu.

There's also no free-text search box on this page. Search by name using the **Name** filter in the filter panel instead.

### Columns

Every column below is defined once and shared by the table, the card grid, and the portfolio group wizard's picker, so all three always agree on a value. The order below also matches the **Choose columns** menu.

| # | Column | Shown by default | What it shows |
|---|---|---|---|
| 1 | **Name** | Yes | The frozen snapshot's name, truncated with the full name on hover |
| 2 | **Strategy** | Yes | The strategy's name, **frozen at the moment of promotion**. Links to the strategy in the table and the wizard picker; plain text on a card. |
| 3 | **Author** | Yes | The username of whoever authored the original strategy, frozen by value. Reads **Not recorded** when unknown. |
| 4 | **Study** | Yes | The source study's name, or **Not available** once that study is gone |
| 5 | **CAGR** | Yes | Percent, one decimal. Dash when there isn't enough history yet. |
| 6 | **Sharpe** | Yes | Three decimals. Dash when there isn't enough history yet. |
| 7 | **Max drawdown** | Yes | Percent, one decimal. Dash when there isn't enough history yet. |
| 8 | **Status** | Yes | The profitability chip — see below |
| 9 | **Total return** | No | Percent, one decimal |
| 10 | **Portfolio Groups** | No | Dash if the portfolio belongs to none; otherwise a chip with the count, with a tooltip listing the group names |
| 11 | **Daily updates** | No | **On** or **Off** |
| 12 | **Data points** | No | How many performance observations back the metrics. Dash when there are none yet. |
| 13 | **Date promoted** | Yes | For example, `Aug 18, 2026` |

Numbers sort by their real value rather than as text — so `-18.4%` correctly sorts below `-2.1%`. The table opens sorted by **Date promoted**, newest first.

> [!NOTE]
> Four columns — Total return, Portfolio Groups, Daily updates, and Data points — are hidden until you turn them on in **Choose columns**, which is only available in List view. Switch to List view first if you want them.

### Status chip

The chip reflects the portfolio's total return over its entire performance history since being promoted.

| Condition | Chip |
|---|---|
| No performance history yet | **No data** |
| Total return is zero or positive | **Profitable** |
| Total return is negative | **Unprofitable** |

The **No data** tooltip:

> This portfolio has no equity history yet, so its profitability cannot be determined. It will be filled in after the next daily update.

**No data** is a real third state, not a placeholder. Every one of CAGR, Sharpe, Max drawdown, and Total return needs at least two data points to compute at all — with fewer than that, they all show dashes and the chip reads **No data**. A freshly promoted portfolio that hasn't had a daily update yet won't show `0%`; it shows dashes until there's something to measure.

> [!CAUTION]
> The Sharpe ratio shown in this registry uses a **zero risk-free rate** — it isn't adjusted against any benchmark rate. See [metrics reference](/docs/metrics-reference) for how each metric is defined.

### Filters

Every filter you set updates the page's link, so a filtered view is easy to bookmark or hand to a teammate — and adjusting filters won't clutter up your browser's back button.

| Field | Kind | What it matches |
|---|---|---|
| Name | Text | Any part of the portfolio's name |
| Strategy | Multi-select | The frozen strategy name — includes **Unknown strategy** for the rare row without one |
| Author | Multi-select | The frozen author's username — includes **Not recorded** for rows without one |
| Study | Multi-select | The source study's name — includes **Not available** for rows whose study is gone |
| Status | Multi-select | **Profitable**, **Unprofitable**, **No data** |
| CAGR | Number range | — |
| Sharpe | Number range | — |
| Max drawdown | Number range | — |
| Portfolio Groups | Number range | How many groups the portfolio belongs to |
| Date promoted | Date range | — |

> [!WARNING]
> The percentage filters expect **fractions, not percentages**. A cell showing `5.2%` holds `0.052` underneath, so a CAGR minimum of `0.05` is what finds it — typing `5` matches nothing.

Every field can be cleared on its own, or all at once with **Clear all**; date fields use **From**/**To**, number fields use **Min**/**Max**, and a badge on the filter button always shows how many filters are active.

### Card view

Your choice between table and cards is remembered the next time you open this registry. **Cards are the default**, so a first visit shows the grid rather than the table.

A card shows the portfolio's name as its title, the strategy as a subtitle, and then Status, CAGR, Sharpe, Max drawdown, and Date promoted underneath.

Cards show exactly the same filtered results as the table — never a subset — but column visibility doesn't apply to them, and the strategy name on a card is plain text rather than a link. Click anywhere on a card to open its action menu.

### Row action menu

Clicking a row or a card opens a small menu of actions next to it — or, on a small screen, a sheet that slides up from the bottom. Its header shows the portfolio's name, with a **Close** button.

There are exactly two actions.

| Action | What it does | When it's disabled |
|---|---|---|
| **View in Portfolio Analysis** | Opens the source trial on the [Portfolio Analysis](/docs/portfolio-detail) page. It's a real link, so Cmd-click or middle-click opens it in a new tab. | The source trial no longer exists — the source study was deleted, so there's no page left to open |
| **Delete** | Opens the delete confirmation | The portfolio belongs to at least one portfolio group |

When Delete is disabled because of group membership, the tooltip names the specific group (or groups) to remove it from first.

### Delete confirmation and what it removes

The confirmation dialog asks you to confirm before anything happens:

> Delete the promoted portfolio "{{name}}"? Its stored history is removed permanently. The source trial and study are not affected.

> [!NOTE]
> This dialog's title and buttons always show in English, regardless of your language setting — everything else on this page is translated.

Confirming permanently deletes the portfolio's stored performance history — its equity curve, holdings, and orders. The trial and study it was promoted from are separate objects and are never touched.

If the portfolio still belongs to a portfolio group, deletion is blocked with an explanation of which group(s) to remove it from first — the registry disables the action for exactly this reason, so you see why up front instead of hitting an error. Trying to delete one that's already gone (for example, from a stale page) shows a clear "not found" message rather than pretending it worked.

> [!CAUTION]
> Deleting is permanent. There's no archive, no soft delete, and no undo. It does free up a slot in your promoted-portfolio limit immediately.

### Why a cell is blank

Two columns can go blank, and they mean different things.

| Cell | Why it's blank | What it means for you |
|---|---|---|
| **Strategy** shows a name but isn't a link | The strategy was deleted, including simply archived | Nothing to worry about — the name shown is the one frozen at promotion time, and it stays accurate |
| **Study** reads **Not available** | The source study was deleted or archived | **View in Portfolio Analysis** is disabled, since that page needs the original trial to exist |

The strategy's name and author are frozen values, so they survive even a full deletion of the study, trial, and strategy. The links to the strategy, study, and trial are live references, so they disappear along with whatever they point to. Renaming a strategy afterward never retitles a promoted portfolio or updates its Strategy column.

### The same table inside the portfolio group wizard

The [portfolio group](/docs/portfolio-groups) creation wizard and the create-group dialog both reuse this exact registry as a picker — same rows, same columns, same filters.

| Difference | In the picker |
|---|---|
| Visible columns | Name, Strategy, CAGR, Sharpe, Max drawdown, Status |
| Layout | Fixed-width columns with horizontal scrolling, in a more compact view |
| Filters | The wizard shows Name, Strategy, Study, and Status directly, with the rest tucked behind **More Filters**. The simpler create-group dialog just shows the filter button. |
| Selecting | A checkbox per row, plus a running **{{count}} selected** chip you can use to clear your whole selection at once |
| Empty state | **Loading promoted portfolios…** while loading, or **No promoted portfolios match the current search and filters.** |

Your selected count always reflects your actual selection, not just what's currently visible, so filtering a selected row out of view never silently deselects it. And because your filters live in the page's link, a half-built group survives an accidental page reload.

## Promoting a trial into this registry

### There is no creation wizard

Unlike other registries, there's no "create new" flow here. A promoted portfolio comes into being exactly one way — by promoting a trial — and everything a setup wizard would normally ask you is decided automatically: the name is generated, the snapshot is copied straight from the trial and its study, and it's enrolled in daily updates. There's nothing to name and nothing to configure.

The rest of this section walks through that promotion flow itself: where you trigger it, what has to be true first, what the result is named, and exactly what gets frozen into it.

### Where you trigger promotion

| Surface | Control | What it says |
|---|---|---|
| [Portfolios dashboard](/docs/portfolios-dashboard) card | Per-trial button | **Promote**, tooltip "Promote this trial into the Portfolio Groups." Once promoted it becomes **Promoted**, tooltip "Already promoted to the Portfolio Groups." |
| Portfolios dashboard card menu | Menu item | "Add this trial to the Portfolio Groups as a managed portfolio" |
| Portfolios dashboard bulk bar | Appears once two or more trials are checked | **Promote Selected**, with a count. A chip shows how many of your selection are already promoted; if every checked trial is already promoted, the button disables. |
| [Portfolio Analysis](/docs/portfolio-detail) header | A promote control for that one trial | — |
| [Portfolio group](/docs/portfolio-groups) membership | **Implicit** — adding a raw trial straight into a group promotes it automatically first | — |

Trials you've already promoted are simply skipped in a bulk request rather than resubmitted.

> [!WARNING]
> Adding a trial straight into a portfolio group promotes it silently, with no separate confirmation, and it counts against your promoted-portfolio limit just like an explicit promote does. That's why you can sometimes find a portfolio in this registry that you never promoted by hand.

Toasts you'll see:

| Outcome | Message |
|---|---|
| Single promotion | "Promoted to the Portfolio Groups" |
| Bulk, all succeeded | "{{count}} portfolio(s) promoted" |
| Bulk, partial | A warning that some trials couldn't be promoted, with the specific reason for each one |

### What has to be true before you can promote

Promotion checks everything up front, before it changes anything.

| # | What has to be true | If it isn't |
|---|---|---|
| 1 | You have permission to view portfolios in your organization | You'll see a permission error |
| 2 | You have room left in your promoted-portfolio limit for the whole batch | You'll be prompted to buy more room or free up a slot (see below) |
| 3 | The trial belongs to your organization and its study hasn't been deleted | You'll see a "not found" message for that trial |
| 4 | You haven't already promoted this exact trial | Nothing goes wrong — you're simply handed back the portfolio that already exists, so promoting twice never creates a duplicate |
| 5 | The strategy behind the trial is an **Internal** strategy, not an **External** one | You'll see a message explaining that only Internal strategies can be promoted — see [Execution modes](#execution-modes) below |
| 6 | If the study combines other portfolios (a "portfolio of portfolios"), none of its risk managers are Sector Cap or Country Cap | You'll be asked to remove those risk managers first — every other [risk manager](/docs/risk-managers) works fine on this kind of portfolio |

### Naming

Fintela names the result for you automatically, combining the study's name with the trial number — for example:

> Momentum v3 / trial 17

There's no name field to fill in when you promote, and no way to rename a promoted portfolio afterward — the name is part of the frozen snapshot, so renaming the original study later never retitles portfolios you already promoted from it.

### What gets captured and locked in

Promotion captures everything below in one step, so a half-promoted portfolio can never exist.

| What's captured | In plain terms |
|---|---|
| Strategy details | The strategy's name, its author, its code and parameters, and the exact parameter values used in this trial |
| Tradable universe | The precise list of assets the strategy was allowed to trade, as of the moment you promoted |
| Fitness and risk settings | The [fitness function](/docs/fitness-functions) and every attached [risk manager](/docs/risk-managers), exactly as configured for this trial |
| Date ranges | The training, validation, and out-of-sample windows used to produce this trial |
| Starting point | The trial's original historical starting signal, so its rebalancing pattern stays identical going forward |
| Benchmark | The benchmark this portfolio is measured against |
| Portfolio-of-portfolios structure | If the study combined other portfolios, which ones and how they're combined |

Its performance history — holdings, equity curve, and orders — is copied exactly as it stood in the trial, not recalculated.

> [!WARNING]
> Promotion never re-runs a backtest and never re-optimizes anything. If a trial's numbers looked wrong before you promoted it, they'll look exactly the same afterward — see [analyzing results](/docs/analyzing-results) if something seems off.

### What stays live

Three references are deliberately kept live rather than frozen, because they're links rather than inputs:

| Reference | What happens if the original is deleted |
|---|---|
| Link to the strategy | Disappears once the strategy is deleted — even just archived. The Strategy column keeps its frozen name either way. |
| Link to the source trial ("View in Portfolio Analysis") | Stops working once the trial is deleted |
| Link to the study | The Study column reads **Not available** once the study is deleted or archived |

### What can't be changed afterward

Because your promoted portfolio runs off its own frozen copy rather than the live strategy, nothing you do to the original objects afterward reaches it.

| You change… | Effect on the promoted portfolio |
|---|---|
| Edit or rename the strategy | None — the Strategy column keeps showing the frozen name; only its link may disappear |
| Edit the risk managers | None — the frozen settings keep running as they were |
| Edit the asset group | None — the frozen tradable universe keeps running as it was |
| Delete the study | The portfolio survives untouched. Study reads **Not available** and **View in Portfolio Analysis** is disabled. |
| Delete the strategy | The portfolio survives with its frozen name and author intact; only the link goes |
| Delete the promoted portfolio itself | Permanent, and only possible once it belongs to no portfolio group |

### Promoting multiple trials at once, and your portfolio limit

You can select several trials on the Portfolios dashboard and promote them all in one action. Selecting the same trial twice never creates two copies, and the order you picked them in is preserved.

- You can promote up to **50 trials** in a single batch.
- You can't submit an empty selection.

If some trials in a batch qualify and others don't — say, one uses an External strategy — the request is a partial success: everything valid goes through, and you get a clear reason for each one that didn't.

Promoting counts against your promoted-portfolio limit. The default plan includes **5**, counted as a simple total of how many you currently have, so deleting one frees a slot right away. **The whole batch is checked against your limit up front**, before anything is promoted. If you're over your limit, Fintela opens the token purchase dialog automatically rather than just showing an error, so you can buy more room or free up a slot by deleting an existing promoted portfolio. See [tokens and billing](/docs/tokens-and-billing).

> [!NOTE]
> Browsing this registry is never limited or locked — only the act of promoting a new trial is capped.

### After promotion: daily updates

A freshly promoted portfolio is automatically enrolled in daily updates — its **Daily updates** column reads **On**. This is what lets Fintela extend the portfolio's performance history one trading day at a time without any action from you.

There's no switch to turn daily updates off for an individual promoted portfolio, here or anywhere else. The only thing that changes this setting is whether the portfolio belongs to a [portfolio group](/docs/portfolio-groups) with daily updates enabled — and that can only ever turn updates on, never off.

## Execution modes

Whether a trial's strategy is Internal or External is a property of the [strategy](/docs/external-strategies) it came from, not something you choose here. For promoted portfolios, it's a hard requirement.

### Internal only

Only trials built from an **Internal** strategy — one written and run inside Fintela's own strategy editor — can be promoted into this registry. This check applies consistently, including to a portfolio you're re-promoting.

The reason is daily updates. Extending a portfolio one trading day at a time means Fintela re-running your strategy's logic on its own schedule, against its own market data — and that only works for strategies that live inside the platform.

### External strategies can't be promoted

An [External strategy](/docs/external-strategies) — one you run yourself, in whatever language or infrastructure you choose, against your own private data — **can never be promoted, and can never appear in this registry.**

If you try, you'll see a clear message explaining that only Internal strategies support daily updates — whether you're promoting a single trial, promoting a batch, or trying to add one directly into a portfolio group.

### What that rules out

| Capability | Available for an External strategy |
|---|---|
| Optimizing it in a study and inspecting the resulting trials | Yes — see [external strategies](/docs/external-strategies) |
| Promoting one of those trials | **No** |
| Adding one to a [portfolio group](/docs/portfolio-groups) | **No** — group membership requires a promoted portfolio, so the same rule applies |
| Daily updates on it | **No** |
| [Live trading](/docs/live-trading) it through group operations | **No**, since it can never become a group member |

### What the Internal-only rule doesn't affect

This rule only looks at the **strategy's** execution type — nothing else about the trial.

- A study that scored its trials with an [External fitness function](/docs/external-fitness) promotes just fine. The fitness function's settings are frozen into the snapshot, but its execution type is never checked.
- Risk managers aren't affected by Internal/External at all — the only risk-manager restriction is the Sector Cap / Country Cap rule for portfolio-of-portfolios studies, described above.

For the full picture of how Internal and External strategies differ across Fintela, see [execution modes](/docs/execution-modes).
