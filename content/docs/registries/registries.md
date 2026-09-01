---
title: Registries
section: Registries
sectionOrder: 3
order: 1
published: true
updated: 2026-09-01
summary: The seven catalogues that hold every building block of a Fintela study — asset groups, strategies, fitness functions, risk managers, portfolio groups and promoted portfolios — and the conventions shared across all of them.
keywords: registry, registries, building blocks, asset groups, strategies, studies, fitness functions, risk managers, portfolio groups, promoted portfolios, version history, execution modes
---

A registry is where you keep one kind of building block, shared with everyone else in your organization. Every ingredient you assemble into a trading idea — the universe of instruments you trade, the logic that produces a signal, the objective you're optimizing for, the study that ties them together and runs the search, the guardrails that watch over it, and the portfolios and books you keep afterward — lives in one of seven registries. They aren't seven unrelated screens: five of them share the same layout and the same set of behaviors — how you click a row, how search and filters work, how confirmation dialogs look, and the rule that you can't edit or delete something that's still in use elsewhere. This page explains what each registry holds, where to find it in the sidebar, and the conventions that apply across all of them, so the individual registry pages don't have to repeat them.

## The seven registries

| Registry | What it holds | What it's used for |
|---|---|---|
| [Asset Groups](/docs/asset-groups) | A saved list of instruments you trade — tickers, plus optionally other portfolio groups added in so their combined performance counts as a single instrument | A study uses one asset group as the universe it trades, and optionally a second as the universe used to score performance |
| [Strategies](/docs/strategies) | The trading logic that turns a rebalance date into buy/sell decisions and position sizes — written in Python inside Fintela, or hosted on your own infrastructure | A study uses exactly one strategy; you can also test one on its own in the strategy sandbox |
| [Studies](/docs/studies) | One optimization run: a strategy, a fitness function, an asset group, the ranges of parameters to search, a date window, a search method and a budget of trials | Running a study produces trials, which become the portfolios you review in [Portfolios](/docs/portfolios-dashboard) |
| [Fitness Functions](/docs/fitness-functions) | The objective a study optimizes toward — a way of scoring one simulated run down to a single number that says how good it was | A study uses exactly one fitness function; you can also promote a fitness function into a metric shown on your portfolios |
| [Risk Managers](/docs/risk-managers) | Guardrails that check every simulated trading day before your strategy rebalances | Attached to a study, where the optimizer can also search for the best guardrail thresholds |
| [Portfolio Groups](/docs/portfolio-groups) | A collection of promoted portfolios traded together under one shared configuration — how capital is allocated across them, how often they rebalance, how orders are placed | [Portfolio Manager](/docs/portfolio-manager) is where you monitor them, this is where you deploy them for live trading, and an asset group can use a portfolio group's combined performance as an instrument |
| [Promoted Portfolios](/docs/promoted-portfolios) | A saved, permanent copy of one trial you decided to keep — independent of the study that produced it | Portfolio Groups are built entirely from portfolios in this registry |

## Where they sit in the sidebar

The sidebar groups these under two headings — **Analysis** and **Registry** — plus a **More Options** menu that expands from the rail. Four of the seven registries show directly under Registry; the other three sit inside More Options. Wherever an entry lives, a link you were given to it still opens it directly.

```text
Analysis
  Home
  Portfolios
  Portfolio Manager
  Markets                (locked on the free tier)

Registry
  Asset Groups
  Strategies
  Studies
  Portfolio Groups

More Options ▸
  Fitness Functions
  Risk Managers
  Promoted Portfolios
  Data Explorer          (locked on the free tier)
  Laboratory             (locked on the free tier)
  Fintelligent           (only shown if enabled for your account)
```

Fintelligent is the only entry that can be missing entirely — it only appears if your account has access to it. See [Navigation](/docs/navigation) for the rest of the sidebar.

None of the seven registries are locked on the free tier — you can always open and browse each one. What the free tier limits is how many items you can create; see [Free-tier quotas](#free-tier-quotas).

## What every registry page shares

### Two layouts, one shared design

Asset Groups, Strategies, Studies, Fitness Functions and Risk Managers all use the same page layout, sized to fit your screen — the table itself scrolls if there are many rows, but the page around it never does, so a registry with three rows shows a compact three-row table rather than a mostly empty page.

Portfolio Groups and Promoted Portfolios use an older layout: a header that stays pinned at the top while the page below it scrolls normally. Both layouts share the same row-actions menu, filter panel, column chooser and list/card toggle, but Portfolio Groups and Promoted Portfolios don't have the search field, shareable sort order, selection checkboxes, Insights panel or relations map that the other five have. Every one of those differences is listed later, under [Where the registries differ](#where-the-registries-differ).

### The command bar

Left to right, every registry's single control row offers:

| Control | What it does |
|---|---|
| Title | The registry's name |
| Search field | Free-text search (placeholder text varies by registry) |
| Clear | Appears once you've typed something; clears the search |
| Filter | Opens the filter panel; shows a badge with how many filters are active |
| Choose columns | Pick which columns show in list view (disabled while card view is showing) |
| View toggle | Switch between list view and card view |
| View documentation | Opens a help panel for this registry, on the right |
| Refresh | Reloads the registry's rows |
| Usage meter | Free tier only; shows how much of your plan's limit you've used — hidden once your organization is upgraded |
| Create | Opens the create flow for this registry |

Search placeholders and create button labels, exactly as they appear:

| Registry | Search placeholder | Create button |
|---|---|---|
| Asset Groups | `Search groups or symbols…` | `New Asset Group` |
| Strategies | `Search strategies…` | `New Strategy` |
| Studies | `Search studies…` | `New Study` |
| Fitness Functions | `Search fitness functions…` | `New Fitness` |
| Risk Managers | `Search risk managers…` | `New Risk Manager` |
| Portfolio Groups | no search field | `Create Portfolio Group` |
| Promoted Portfolios | no search field | `Promote portfolios` |

`Promote portfolios` isn't a way to create something new — promotion happens from the Portfolios dashboard, so this button just takes you there. Promoted Portfolios has no create, no edit and no duplicate option at all — items only arrive here through promotion.

When you've hit your free-tier limit, the create button stays fully clickable and its usual color. Clicking it opens the upgrade dialog instead of the create form, so you find out you're at your limit before you've filled anything in, not after.

`View documentation` appears on Asset Groups, Strategies, Studies and Fitness Functions. Risk Managers doesn't have a help button on its registry page — its reference material lives inside the editor instead. Portfolio Groups and Promoted Portfolios don't offer a help button either.

### Search, filters and sort

The rule to keep in mind: **anything that changes which rows you see, or their order, is reflected in the page's link** — so you can copy that link and send someone the exact same filtered, sorted view. Anything that only changes how rows look stays local to your own browser.

| State | Shareable via link? | Notes |
|---|---|---|
| Free-text search | Yes | Matches against each row's name, description and author, ignoring case |
| Filters | Yes | Filter type depends on the column — text, single-select, multi-select, date range, yes/no, or number range |
| Sort order | Yes, on the five main registries | Not shareable on Portfolio Groups or Promoted Portfolios — their sort resets each visit |
| Column visibility | No, and not remembered | Resets to the defaults every time you visit, so a link you share always shows the recipient their own columns, not yours |
| List view vs. card view | No, remembered per registry | Saved in your browser separately for each registry, so switching one doesn't affect the others |

Filtering and searching both apply to the same already-loaded rows, so list view and card view can never show you conflicting results.

The filter panel is the only way to filter — there are no extra per-column filter shortcuts in the table header, so you'll never run into two different filter controls disagreeing with each other. Filter panel labels you'll see: `Filters`, `Clear all`, `Clear`, `Any`, `Yes`, `No`, `From`, `To`, `Min`, `Max`, `Contains…`, and a count of how many filters are currently active.

Every registry opens sorted with the newest items first. That column exists on all seven; you can't quick-filter it with a single click, but the filter panel does let you narrow it to a date range.

### Columns, list view and card view

List view is a table with sortable column headers; card view shows the same rows as a grid of cards built from the same information, so switching between the two never shows you different data — just a different layout.

Default visible columns, with everything else reachable through the column chooser:

| Registry | Columns shown on first load |
|---|---|
| Asset Groups | Name, Description, Author, Created At |
| Strategies | Name, Description, Execution Type, Author, Created At |
| Fitness Functions | Name, Description, Execution Type, Author, Created At |
| Risk Managers | Name, Description, Execution Type, Author, Created At |
| Studies | Name, Strategy, Health, Progress, Status, Author |
| Portfolio Groups | Group name, Description, Portfolios, Total AUM, Created |
| Promoted Portfolios | Name, Strategy, Author, Study, CAGR, Sharpe, Max drawdown, Status, Date promoted |

When your filters hide every row, the table shows `No rows match the active filters.` with a button to clear them. When a registry is genuinely empty, each one shows its own message — for example `No strategies yet` / `Create your first strategy to start building portfolios.`

By default, the Description column shows an automatically written summary of each row based on its own settings, and moves any description you typed yourself into a tooltip instead. This applies on Strategies, Fitness Functions, Asset Groups, Risk Managers and Portfolio Groups. Nothing you typed is lost — it's simply tucked under a tooltip rather than shown in the main column.

### Opening a row

**No cell in a registry table is a clickable link on its own.** Clicking anywhere on a row — or selecting it and pressing Enter or Space — opens a small menu of actions anchored to that row, and `View` is the item that takes you to its page. This keeps a single, predictable way to open something, rather than having some cells behave like links and others not.

The menu shows the row's name at the top, lets you move through the options with the arrow keys, and closes if you press Escape or click elsewhere. On a narrow screen it opens as a sheet from the bottom instead of a floating menu. If an action isn't available — for example, because the item is still in use — it stays visible but disabled, with a tooltip explaining why.

Right-clicking a row opens the same menu as a context menu, on the five main registries only.

| Registry | Row actions, in order |
|---|---|
| Asset Groups | `View` · `Edit` · `Duplicate` · `Copy ticker codes` · `Delete` |
| Strategies | `Run a backtest` · `View` · `Edit` · `Duplicate` · `Delete` |
| Studies | `Launch` · `View` · `Edit` · `Duplicate` · `Delete` |
| Fitness Functions | `Run a backtest` · `View` · `Edit` · `Duplicate` · `Promote to metric` · `Delete` |
| Risk Managers | `View` · `Edit` · `Duplicate` · `Attach` · `Version history` · `Delete` |
| Portfolio Groups | `Edit structure` · `Deploy Portfolio Group` · `View` · `Duplicate` · `Delete` |
| Promoted Portfolios | `View in Portfolio Analysis` · `Delete` |

Where `View` and `Edit` take you:

- Asset Groups, Strategies, Fitness Functions and Risk Managers: `View` opens a read-only page for the item; `Edit` opens it in the editor.
- Studies: `View` takes you straight to the study's ranked portfolios — the results anyone launching a study actually wants to see. `Edit` opens the study builder.
- Portfolio Groups: `View` opens the group inside Portfolio Manager; `Edit structure` opens its structure editor.
- Promoted Portfolios: `View in Portfolio Analysis` opens the underlying trial's results. If the study that produced it was later deleted, this option is disabled with the tooltip `The source study was deleted, so there is no portfolio page to open.`
- On Fitness Functions, once you've promoted one as a metric, `Promote to metric` becomes `Edit metric`, with a `Remove metric` option next to it.

**Edit and Delete are blocked while something is still in use.** On Strategies, Fitness Functions, Asset Groups and Risk Managers you'll see `This item is currently used in a study and cannot be edited.` On Promoted Portfolios, Delete is blocked while the portfolio still belongs to any portfolio group, and the tooltip names which groups. On Studies the rule is different: only a study that hasn't been launched yet can be edited or launched — once it's running, you'll see `Study has already been launched and is immutable.`

Deleting always asks you to confirm first — the same dialog style everywhere, with its own message naming exactly what you're about to lose:

| Registry | Confirmation message |
|---|---|
| Asset Groups | `Are you sure you want to delete the selected asset group? Associated studies may be affected.` |
| Strategies | `Are you sure you want to delete the selected strategy? If any, associated data will also be deleted.` |
| Studies | `Are you sure you want to delete the selected study? If any, associated data will also be deleted.` |
| Fitness Functions | `Are you sure you want to delete the selected fitness? If any, associated data will also be deleted.` |
| Risk Managers | `Are you sure you want to delete the selected risk manager(s)?` |
| Portfolio Groups | `Delete the portfolio group "{name}"?` |
| Promoted Portfolios | `Delete the promoted portfolio "{name}"? Its stored history is removed permanently. The source trial and study are not affected.` |

> [!CAUTION]
> There is no way to undo a delete, and no archive, anywhere in the registries — deleting is permanent. Delete is also the only action Promoted Portfolios supports beyond viewing; there's no way to "un-promote" a portfolio.

### Selecting rows and bulk actions

The five main registries carry a checkbox column and a footer strip. With nothing selected, the footer shows overall counts for the registry; as soon as you check a row, it turns into an action bar showing how many rows are selected, with a `Clear selection` button. **The only bulk action available anywhere is `Delete`**, which opens the same confirmation dialog as deleting a single row.

Your selection survives changing filters (it's based on the actual rows, not just what's currently visible) and automatically drops any row that's since been deleted, so the count you see stays accurate after a bulk delete.

Portfolio Groups and Promoted Portfolios don't support selecting rows or bulk actions at all.

### Insights and linked resources

The five main registries show a permanent **Insights** panel above the table, summarizing whatever rows are currently visible — breakdowns by type, how many studies depend on each item, quality signals, and so on — and it updates to focus on whichever row you last clicked. It's always there; there's no way to collapse or hide it.

Those same five registries also let you expand each row (using a small arrow next to its checkbox) to see a map of everything that item connects to elsewhere — which studies, strategies, fitness functions, asset groups or risk managers use it, and whether the connection is direct or through a study. This information loads only once you expand a row, so browsing the registry stays fast even if you never look at it. Controls read `Show details` / `Hide details`; if something goes wrong loading it you'll see `Couldn't load related resources.`, and an item with nothing connected reads `No linked resources yet.`

This expanded view is card view's one gap — it's only available in list view, since there's no single row to expand in the card layout. Unlike search, filters and sort, whether a row is expanded isn't something you can share via a link — it doesn't change which rows you're looking at, just how much detail you're seeing about one of them.

### Creating from a registry

Every registry's create flow starts right there on its own page. For most registries this is a screen that opens in place, not a separate page you navigate to — and for Strategies, Fitness Functions, Asset Groups and Studies, you can also jump straight into a blank editor via a direct link, handy for bookmarking a shortcut to "create a new strategy." Risk Managers doesn't support that shortcut.

Portfolio Groups works differently: creating and editing a Portfolio Group opens a dedicated multi-step wizard with its own pages, rather than an in-place editor.

Strategies, Fitness Functions, Risk Managers and Asset Groups all finish with the same confirmation step: you name the item and add a description at the very end, after you've built it — and if the name is already taken, Fintela offers to save it under a suggested alternative name (`Already in use — it will be saved as "{name}"`) rather than blocking you outright. The Portfolio Groups wizard uses this same final step. Studies is the exception: it ends with a `Confirm your study` summary that shows the full pipeline you've built and its token cost, and gives you two ways to save — `Save Draft` and `Save & Launch`.

> [!TIP]
> Calling all of these "wizards" is only really accurate for Portfolio Groups. Strategies, Fitness Functions, Risk Managers and Asset Groups use a single-screen editor with expandable sections, and Studies uses a single visual canvas for building the whole pipeline — none of them are step-by-step wizards.

### Workspace scope

The workspace switcher in the sidebar footer, when narrowed to your own work, filters five registries — Asset Groups, Strategies, Studies, Fitness Functions and Risk Managers — down to just the items you personally created. Portfolio Groups and Promoted Portfolios ignore this filter and always show everything in your organization.

### Fintelligent can drive them

The same five registries can be operated directly by [Fintelligent](/docs/fintelligent) — ask it to open a create form, an editor or a duplicate on Asset Groups, Strategies, Studies, Fitness Functions or Risk Managers, and it will. Portfolio Groups and Promoted Portfolios aren't available to Fintelligent this way. One thing Fintelligent deliberately cannot do, by design, is delete anything — there's no delete action available to it, or to the keyboard command palette, anywhere.

## Version history

Three registries keep a full history of every change: **Strategies, Fitness Functions and Risk Managers**. Every time you save, Fintela records a new version capturing everything about the item at that moment — its name, execution mode and settings, parameters, data-source configuration and, where relevant, its code. The most recent version always matches what's live.

You'll find this history in a collapsible **Version History** section inside the editor (only while editing something that already exists), listing every version newest-first with the current one marked `Current`. Selecting an earlier version that contains code shows you a side-by-side comparison against what's currently in the editor, along with a `Restore v<N>` option (unavailable for the version you're already on). On Risk Managers, you can also jump straight to version history from the row's `Version history` action.

> [!IMPORTANT]
> Restoring a version never saves anything by itself — it loads the old code back into the editor as an unsaved change, which you then review and save yourself, like any other edit, and that save becomes a new version on top of the history rather than replacing it. Any study you've already launched keeps running exactly as it started, because launching locks in the specific version of the strategy and fitness function it used. Editing a strategy later can never change the results of a study that already ran.

Restore is only offered for versions that include code — a built-in or external item still shows its version list, but there's nothing to restore, since there's no code to bring back. Asset Groups, Studies, Portfolio Groups and Promoted Portfolios don't keep version history at all. Before you save your first edit on a registry that does, the history panel simply reads: `No version history yet. Saving an edit records a new version.`

## Visibility and sharing

**There is no share action and no public catalogue in any registry today.** Everything you build is visible to everyone else in your organization, and there's no way to make a single item private to just you or shared with only specific teammates.

That used to be possible in an earlier version of Fintela — items could be marked private, organization-wide or shared with specific people — but per-item visibility controls were removed entirely, and your organization is now the only real boundary. You'll still see who created each item, and the workspace switcher can narrow the list down to just your own work, but authorship is no longer a way to restrict who can see something.

> [!NOTE]
> The one place you will find items shared publicly across organizations is the [Laboratory](/docs/laboratory), which is a separate catalogue from the seven registries described here.

## Execution modes

Execution mode is a setting on the registries that hold code. It answers one question: does Fintela run your logic, or does your own logic run somewhere you control, with Fintela simply calling it?

- **Internal** — you write Python directly inside Fintela's editor, following a fixed function signature. Fintela runs it for you, in a secure, isolated environment, and checks that it's valid before letting you save it.
- **External** — you host your own logic, in any language, on infrastructure you control. Fintela sends it what it needs to know for each trial or each simulated bar, and reads back the answer. Your code, your models and your data never have to leave your own systems; only the specific request and its answer cross over. Reach for this option when you want to keep proprietary logic or data in-house, use a language or stack Fintela's editor doesn't support, or simply avoid depending on Fintela's own runtime.

### Where External applies

| Registry | Execution modes available |
|---|---|
| [Strategies](/docs/strategies) | `Internal` and `External`. Both fully supported |
| [Fitness Functions](/docs/fitness-functions) | `Internal`, `External`, and `Built-in` — ready-made objectives provided by Fintela that you can use as-is but can't create, edit, duplicate, delete or test in the sandbox yourself |
| [Risk Managers](/docs/risk-managers) | `Built-in`, `Rule-based`, `Internal` and `External` — all four are supported |
| [Studies](/docs/studies) | No mode of its own — a study simply takes on whichever modes its strategy and fitness function use, and it's completely normal to pair an internal strategy with an external fitness function, or vice versa |
| [Asset Groups](/docs/asset-groups) | **None.** An asset group is just a saved list — there's no code or execution involved |
| [Portfolio Groups](/docs/portfolio-groups) | **None.** A portfolio group is configuration — allocation, cadence, execution policy — not something that runs your code |
| [Promoted Portfolios](/docs/promoted-portfolios) | **None.** A promoted portfolio is a frozen snapshot, not something that executes |

Two further points worth knowing:

- **Rule-based (declarative) mode is currently only available for Risk Managers.** Strategies and Fitness Functions let you select it in the editor so you can see what it would look like, but saving it isn't supported yet — you'll be told rule-based strategies and fitness functions aren't supported. Don't plan around this until it ships.
- **Built-in risk managers never show up in the Risk Managers registry itself** — that list only shows the custom ones you've authored. You choose a built-in risk manager at the point where you attach one to a study; that step offers the full built-in catalogue alongside anything you've registered yourself.

For a deeper look at how each mode works, see [Execution modes](/docs/execution-modes), [External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness).

### Rules every external endpoint must satisfy

If you're pointing a Strategy, Fitness Function or Risk Manager at your own external endpoint, Fintela checks it against the same rules before accepting it, to make sure it can actually reach and safely call your service:

- The address can't contain spaces or hidden control characters.
- It has to be a properly formed URL, with a scheme of `http://` or `https://` and a host name or IP address.
- It can't point at `localhost` or your own machine — it has to be an address Fintela can actually reach.
- If you give it a raw IP address, that address has to be publicly routable, not an internal or private one.

Plain `http://` addresses are accepted — there's no requirement to use `https://`, and no restriction on which port you use. Fintela never sends any credentials of its own to your endpoint, and never follows a redirect, so if your endpoint needs to authenticate the caller, you're responsible for building that into the URL you register — for example, an access token in the query string.

## Free-tier quotas

Registry limits only apply when you're creating something new. Nothing ever stops you from viewing, editing, deleting or stopping something you already have, so hitting a limit can never trap you inside a live position or take away something you already built.

| Registry | Label you'll see | Current limit on the free tier |
|---|---|---|
| Strategies | `strategies` | 2 |
| Studies | `studies` | 2 |
| Fitness Functions | `fitness functions` | 2 |
| Asset Groups | `asset groups` | 2 |
| Risk Managers | `risk managers` | 2 |
| Portfolio Groups | `portfolio groups` | 1 |
| Promoted Portfolios | `promoted portfolios` | 5 |

> [!WARNING] These numbers can change
> These limits are a plan setting Fintela can adjust, and a change takes effect for everyone within about a minute, with no update to the app itself required. Treat the usage meter in your own command bar as the source of truth rather than this table. If your organization has upgraded, none of these limits apply to you at all.

Only Strategies, Studies, Fitness Functions and Asset Groups show a `used/limit` meter directly in the command bar. Risk Managers instead shows your organization's overall headroom in the footer, broken down by `Total` / `Internal` / `Declarative` / `External`. Portfolio Groups and Promoted Portfolios don't display a meter at all, even though their limits are still enforced when you try to create one.

Hitting a limit always raises the same dialog: `You've reached your plan limit`, explaining how many of that item your plan includes and how many you already have, reassuring you that everything you already built keeps working normally, and suggesting you delete something to make room. See [Tokens and billing](/docs/tokens-and-billing) for how plans and limits work.

## Where the registries differ

Everything above is true of every registry unless this table says otherwise.

| Capability | Asset Groups · Strategies · Studies · Fitness · Risk Managers | Portfolio Groups | Promoted Portfolios |
|---|---|---|---|
| Free-text search field | yes | no | no |
| Filter panel | yes | yes | yes |
| Sort order is shareable via a link | yes | no — resets each visit | no — resets each visit |
| Row checkboxes and bulk delete | yes | no | no |
| Insights panel | yes | no | no |
| Expandable relations map | yes | no | no |
| Right-click context menu | yes | no | no |
| Page itself never scrolls | yes | no — pinned header, scrolling page | no — pinned header, scrolling page |
| Default view when you first open it | list | list | cards |
| Direct link straight into the create form | all but Risk Managers | no — the wizard has its own dedicated pages | not applicable, no create option |
| Narrowed by the workspace switcher | yes | no | no |
| Can be operated by Fintelligent | yes | no | no |
| Version history | Strategies, Fitness, Risk Managers only | no | no |
| Execution modes | Strategies, Fitness, Risk Managers only | none | none |

Three more single-registry facts worth knowing:

- **Studies become locked the moment you launch them.** `Edit` and `Launch` are only available while a study is still unlaunched, checked against its live status rather than a cached copy — so a study that started running a minute ago is already locked, even if the page hasn't been refreshed.
- **Risk Managers hides its own built-in catalogue.** The built-in rules exist and can be attached to a study, but the Risk Managers registry itself only lists the custom ones you've authored.
- **Promoted Portfolios has no page of its own for a single item.** Opening one takes you straight to its underlying results in Portfolio Analysis; if that trial's original study is gone, you're sent back to the list instead.

Start with [Asset Groups](/docs/asset-groups), since every study needs one first, or read [Core concepts](/docs/core-concepts) for how all seven pieces fit together.
