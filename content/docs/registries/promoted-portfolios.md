---
title: Promoted Portfolios
section: Registries
sectionOrder: 3
order: 8
published: true
updated: 2026-08-20
summary: The durable portfolio a promoted trial becomes — the only thing a portfolio group can be built from.
keywords: promoted portfolio, managed portfolio, promotion, trial, snapshot, immutable, lineage, registry
---

A promoted portfolio is the durable, study-independent copy an optimization trial becomes when you promote it. Promotion takes a full isolation snapshot — the strategy code and parameters, the concrete trial parameters, the runnable universe, the fitness and risk-manager configuration, the date windows — and copies the trial's holdings, equity and orders into a parallel data plane. From that moment the copy is frozen: editing the [strategy](/docs/strategies), the [risk managers](/docs/risk-managers) or the [asset group](/docs/asset-groups) it came from never changes it, and deleting the source [study](/docs/studies) leaves it intact. It is also the only object a [portfolio group](/docs/portfolio-groups) can hold, which makes this registry the single definition of what is investable.

## Overview and purpose

### Trials are not portfolios

The platform's taxonomy splits two things that both get called "a portfolio" in casual speech.

| Object | Stored in | What it is | Lifetime |
|---|---|---|---|
| **Trial** | `developers.portfolios` — one row per study and trial number | A single parameterisation the optimizer evaluated inside a study. Written by the optimizer, read by the [portfolios dashboard](/docs/portfolios-dashboard). | Belongs to its study. Deleting the study takes it with it. |
| **Promoted portfolio** | `developers.managed_portfolios` | An independent copy with its own id, carrying a by-value snapshot of everything the daily updater needs. | Survives deletion of the study, the trial and even the strategy. |

Everywhere in this documentation, "promoted portfolio" and the internal name *managed portfolio* refer to the same object. The registry label, the delete confirmation and the toasts all say promoted portfolio; the database table, the HTTP paths (`/portfolio_manager/managed*`) and the quota key (`managed_portfolios`) all say managed.

### What consumes a promoted portfolio

| Consumer | How it uses one |
|---|---|
| [Portfolio groups](/docs/portfolio-groups) | A group member *is* a promoted portfolio. The group wizard's member-selection step renders this registry's own table. |
| The daily updater | Extends each enrolled portfolio one bar at a time by reading the frozen snapshot, never the live strategy. |
| [Live trading](/docs/live-trading) | Runs on portfolio-group operations — one level above a promoted portfolio, never on a single one directly. |
| [Developer API](/docs/api-trials-portfolios) | `GET /v2/portfolios` and `GET /v2/portfolios/{id}` expose them read-only. |

### Where the registry lives

Promoted Portfolios is deliberately kept **out of the primary sidebar**. In the app drawer it sits inside the collapsible **More Options** flyout, third in the list, after Fitness and Risk Managers and before Data Explorer, Laboratory and Fintelligent. The sidebar entry reads **Promoted Portfolios**.

Hiding it from the nav does not unmount it. The route stays fully registered, so `/promoted-portfolios` deep-links, bookmarks and back/forward navigation all behave normally. See [navigation](/docs/navigation) for how the flyout works.

> [!NOTE]
> There is no command-palette entry for this registry, and no onboarding tour targets it. Reach it through More Options, or by URL.

### Routes

| Path | What it renders |
|---|---|
| `/promoted-portfolios` | The registry — card grid or table, depending on your saved view mode. |
| `/promoted-portfolios/view/:id` | **Not a screen.** Resolves the id to its source trial and replaces the history entry with the [Portfolio Analysis](/docs/portfolio-detail) page for that trial. Falls back to `/promoted-portfolios` when the id is unknown or its source trial is gone. |
| `/promoted-portfolios/edit/:id` | Identical redirect. There is no editor — the page treats any path containing `/view/` or `/edit/` as a deep link. |

The redirect target is `/analysis/portfolios/{trial id}/profile?studyId={study id}`. The `profile` segment comes from the `investorView` feature flag, which ships on; with the flag off the redirect lands on the bare Performance route instead. While a deep link is resolving the list renders nothing, so it never flashes behind the redirect.

### What this registry cannot do

There is no create, no edit, no duplicate, no rename, no unpromote and no archive. A promoted portfolio is a frozen snapshot, so there is nothing to edit; re-promoting the same trial is a no-op because promotion is idempotent. The only two operations are **View in Portfolio Analysis** and **Delete**.

## Registry table view

### Screen states

| State | What you see |
|---|---|
| Loading | A skeleton title bar and a card with six skeleton rows. |
| Error | A card with bold red text: **"Could not load the promoted portfolios."** |
| List | The registry itself. |

Empty state, in both card and table mode:

> No portfolios have been promoted yet. Promote one from the Portfolios dashboard and it will appear here.

### Toolbar

A sticky single row: the title on the left, every control pushed right.

| Control | Exact label or tooltip | Behaviour |
|---|---|---|
| Title | **Promoted Portfolios** | — |
| Filter | Tooltip and aria-label **Filter** | Opens the filter panel. Carries a badge with the number of active filters. |
| View mode | Segmented control, aria-label **View mode**, options **List view** and **Card view** | Switches the body between the card grid and the table. |
| Choose columns | Tooltip **Choose columns**, aria-label **Choose visible columns**, menu heading **Visible columns** | Toggles column visibility. **Disabled whenever you are in Card view.** |
| Refresh | Tooltip and aria-label **Refresh** | Re-fetches the registry and the portfolio-group name caches that reference it. |
| Primary button | **Promote portfolios**, with a `+` icon | Navigates to `/analysis/portfolios`. It creates nothing here — it takes you to the surface where promotion happens. |

> [!WARNING]
> The primary button is not "+ New". Nothing on this page creates a promoted portfolio.

Two toolbar affordances that other registries have are **absent** here: there is no **View documentation** button, and there is no registry-specific **Actions** dropdown.

There is also **no free-text search box**. The `?q=` parameter is inert on this route. Search by name through the **Name** text filter in the filter panel.

### Columns

Every column below is defined once and shared by the table, the card grid and the portfolio-group wizard's picker, so the three cannot disagree about a value. The order below is also the order of the Choose columns menu.

| # | Header | Align | Shown by default | Cell contents |
|---|---|---|---|---|
| 1 | **Name** | left | Yes | The frozen snapshot name, bold, truncated with the full name on hover. |
| 2 | **Strategy** | left | Yes | The strategy name **frozen at promotion**. In the table and the wizard picker it links to the strategy; on a card it is plain text. |
| 3 | **Author** | left | Yes | The username of the author of the originating strategy, frozen by value. **Not recorded** when unknown. |
| 4 | **Study** | left | Yes | Live lineage — the source study's display name, or **Not available** when the study is gone. |
| 5 | **CAGR** | right | Yes | Percent, one decimal. `—` when null. |
| 6 | **Sharpe** | right | Yes | Plain number, three decimals. `—` when null. |
| 7 | **Max drawdown** | right | Yes | Percent, one decimal. `—` when null. |
| 8 | **Status** | left | Yes | The profitability chip — see below. |
| 9 | **Total return** | right | No | Percent, one decimal. |
| 10 | **Portfolio Groups** | right | No | `—` when the portfolio is in none; otherwise a chip with the count, whose tooltip lists the group names. |
| 11 | **Daily updates** | left | No | **On** or **Off**. |
| 12 | **Data points** | right | No | The number of NAV observations behind the metrics. `—` when zero. |
| 13 | **Date promoted** | left | Yes | Short US date, for example `Aug 18, 2026`. `—` when absent. |

Numeric cells use tabular figures and sort on the **raw** number, so `-18.4%` sorts below `-2.1%` instead of lexically. The table opens sorted by **Date promoted**, newest first.

> [!NOTE]
> Four columns — Total return, Portfolio Groups, Daily updates and Data points — are hidden until you enable them in **Choose columns**, and that menu is disabled in Card view. Switch to List view first.

The table's per-column filter funnels are switched off on this registry. The toolbar funnel is the only filter surface, so what you see is always what the URL says.

### Status chip

The chip reads the portfolio's total return over its whole managed equity curve.

| Condition | Chip | Style |
|---|---|---|
| Total return is null | **No data** | Outlined, default colour, with a tooltip |
| Total return is zero or positive | **Profitable** | Outlined green |
| Total return is negative | **Unprofitable** | Outlined red |

The **No data** tooltip:

> This portfolio has no equity history yet, so its profitability cannot be determined. It will be filled in after the next daily update.

**No data** is a real third state, not a rendering fallback. Metrics are computed from the managed equity curve, and **fewer than two NAV points yields no metrics at all** — every one of CAGR, Sharpe, Max drawdown and Total return comes back null, Data points reads `—`, and the chip reads No data. A freshly promoted portfolio that has not been extended yet does not show `0%`; it shows dashes.

> [!CAUTION]
> The Sharpe ratio in this registry is computed with a **zero risk-free rate**. It is not risk-adjusted against any benchmark rate. See [metrics reference](/docs/metrics-reference) for how each metric is defined.

### Filters

The filter panel is backed by the URL: every active field becomes an `f_` query parameter named after the field, written as a history replacement. A filtered registry view is therefore shareable and bookmarkable, and tweaking a filter does not spam your back button.

| Field | Kind | URL parameter | Values |
|---|---|---|---|
| Name | Text, placeholder **Contains…** | `f_name` | Substring match on the portfolio name |
| Strategy | Multi-select | `f_strategy` | The distinct frozen strategy names, with **Unknown strategy** for rows that have none |
| Author | Multi-select | `f_author` | The distinct frozen author usernames, with **Not recorded** for rows that have none |
| Study | Multi-select | `f_study` | The distinct study names, with **Not available** for rows whose study is gone |
| Status | Multi-select | `f_status` | **Profitable**, **Unprofitable**, **No data** |
| CAGR | Number range | `f_cagr` | Raw fraction |
| Sharpe | Number range | `f_sharpe_ratio` | Raw number |
| Max drawdown | Number range | `f_max_drawdown` | Raw fraction |
| Portfolio Groups | Number range | `f_baskets` | The number of groups holding the portfolio |
| Date promoted | Date range | `f_created_at` | The promotion timestamp |

> [!WARNING]
> The percentage filters take **fractions, not percentages**. A cell rendering `5.2%` holds `0.052`, so a CAGR minimum of `0.05` is the filter you want — `5` matches nothing.

Panel chrome is shared with every registry: title **Filters**, **Clear all**, per-field **Clear**, **From** and **To** for dates, **Min** and **Max** for numbers, and an **{{count}} active** badge on the funnel.

### Card view

The view toggle switches between the table and a card grid, and your choice is remembered per registry in local storage under `fintela.registry.promotedPortfolios.viewMode`. **Cards is the product default**, so a first visit lands on the grid.

A card shows the name as its title, the strategy as its subtitle, and then Status, CAGR, Sharpe, Max drawdown and Date promoted as meta rows.

Cards render exactly the same filtered rows as the table — they are not a subset — but they ignore column visibility entirely, and the strategy name on a card is **plain text, not a link**. Clicking anywhere on a card opens its action menu.

### Row action menu

Clicking a row or a card opens an actions popover anchored to it — below the row in List view, beside the card in Card view, and as a bottom sheet on small screens. Its header shows the portfolio's name, with a **Close** button.

There are exactly two actions.

| Action | What it does | Disabled when |
|---|---|---|
| **View in Portfolio Analysis** | Opens the source trial on the [Portfolio Analysis](/docs/portfolio-detail) surface. It is a real link, so Cmd-click and middle-click open a new tab. | The source trial is gone. Tooltip: *"The source study was deleted, so there is no portfolio page to open."* |
| **Delete** | Opens the delete confirmation. | The portfolio belongs to at least one portfolio group. |

The blocked-delete tooltip is pluralised:

- One group: `Used by the portfolio group {{baskets}}. Remove it from that portfolio group before deleting it.`
- More than one: `Used by {{count}} portfolio groups ({{baskets}}). Remove it from them before deleting it.`

`{{baskets}}` is the comma-separated list of group names.

### Delete confirmation and what it removes

The confirmation dialog is titled **Confirm Action**, with **Cancel** and **Confirm** buttons; Confirm is disabled while the delete is in flight. Its body:

> Delete the promoted portfolio "{{name}}"? Its stored history is removed permanently. The source trial and study are not affected.

> [!NOTE]
> The dialog title and the two button labels are hardcoded English and are not translated, unlike every other string on this page.

On success a green toast reads **"Promoted portfolio deleted"**. Deleting cascades away that portfolio's managed equity, managed holdings, managed orders and refresh-status row. The source trial, its study and its strategy are untouched.

The server refuses a delete while any portfolio group still lists the portfolio, with **HTTP 409** and this message:

```text
this promoted portfolio is a member of {basket_count} basket(s) ({basket_names}); remove it from them before deleting it
```

The registry disables the action for those rows precisely so you read *why* instead of discovering the 409. Reaching it means a stale list or a direct API call. A delete against an id that does not exist in your organization is a **404 "Managed portfolio not found"** — never a silent success.

> [!CAUTION]
> Delete is a hard delete. There is no archive, no soft-delete column, and no undo. It does free a quota slot immediately.

### Why a cell is blank

Two columns can go empty, and they mean different things.

| Cell | Reason | Consequence |
|---|---|---|
| **Strategy** shows a name but no link | The strategy was deleted — including a soft delete, which drops the link before the row is purged. Tooltip: *"This portfolio's source strategy can't be opened — it was deleted. The name shown is the one frozen when it was promoted."* | None. The name you see is the frozen one and stays correct. |
| **Study** reads **Not available** | The source study was deleted or soft-deleted. Tooltip: *"The source study was deleted. The promoted portfolio is unaffected — it keeps its own frozen snapshot — but it can no longer be traced back to a study."* | **View in Portfolio Analysis** is disabled, because that surface is keyed by trial id. |

The strategy *name* and the *author* are frozen by value and survive a full purge. The strategy *link*, the *study* and the *trial* are live lineage and disappear with their rows. Renaming a strategy does not retitle a promoted portfolio and does not update the Strategy column.

### The same table inside the portfolio group wizard

The [portfolio group](/docs/portfolio-groups) creation wizard and the create-group dialog both embed this registry as a selection table, reading the same rows, the same columns and the same URL-backed filter state.

| Difference | In the picker |
|---|---|
| Visible columns | Name, Strategy, CAGR, Sharpe, Max drawdown, Status |
| Column widths | Fixed pixel widths with horizontal scrolling, in compact density |
| Filters | The wizard shows Name, Strategy, Study and Status inline, with the rest behind **More Filters**. The dialog shows only the funnel button. |
| Selection | A checkbox column, plus a **{{count}} selected** chip whose delete affordance clears the whole selection |
| Aria label | **select promoted portfolios** |
| Empty state | **Loading promoted portfolios…** while loading, otherwise **No promoted portfolios match the current search and filters.** |

The selected count is computed from the selection, never from the visible rows, so filtering a selected row off screen does not deselect it. Because the filter state is the shared URL store, a half-built group survives a page reload.

## Creation wizard and advanced options

### There is no creation wizard

This registry has no create flow at all. A promoted portfolio comes into existence exactly one way — by promoting a trial — and everything a wizard would normally ask you is derived instead: the name is minted, the snapshot is copied from the trial and its study, and daily-update enrollment is fixed. There is nothing to fill in and nothing to name.

What follows documents the promotion flow itself: where you trigger it, what it validates, what it names the result, and what it freezes.

### Where you trigger promotion

| Surface | Control | Exact copy |
|---|---|---|
| [Portfolios dashboard](/docs/portfolios-dashboard) card | Per-card button | **Promote**, tooltip **"Promote this trial into the Portfolio Groups"**. Once promoted it flips to **Promoted**, tooltip **"Already promoted to the Portfolio Groups"**. |
| Portfolios dashboard card menu | Action-menu item | Secondary text **"Add this trial to the Portfolio Groups as a managed portfolio"** |
| Portfolios dashboard bulk bar | Appears once two or more cards are checked | **Promote Selected** / **Promote Selected ({{count}})**, tooltip **"Promote every checked trial into the Portfolio Groups in one go"**. A chip reads **"{{count}} already promoted"**; when every checked trial is already promoted the button disables and the tooltip becomes **"Every checked trial is already promoted"**. |
| [Portfolio Analysis](/docs/portfolio-detail) header | Per-portfolio promote control | — |
| [Portfolio group](/docs/portfolio-groups) membership | **Implicit.** Putting a raw trial id into a group promotes it first. | — |

Already-promoted ids are filtered out of a bulk request rather than sent.

> [!WARNING]
> Implicit promotion is silent. Adding a trial to a portfolio group creates a promoted portfolio and consumes a quota slot without any promote confirmation, which is why rows can appear in this registry that you never promoted by hand. An id that is neither a promoted portfolio nor a promotable trial is rejected with `id {id} is neither a managed portfolio nor a promotable trial in this organization`.

Toasts, all from the shared bundle:

| Outcome | Toast |
|---|---|
| Single promotion | **Promoted to the Portfolio Groups** |
| Bulk, all succeeded | **{{count}} portfolio promoted** / **{{count}} portfolios promoted** |
| Bulk, partial | Warning **{{count}} trial could not be promoted** / **{{count}} trials could not be promoted**, with the individual failure reasons joined by ` · ` as the detail |

### Pre-flight validation

Promotion validates everything before it writes anything. These run in order.

| # | Check | Result when it fails |
|---|---|---|
| 1 | Permission `portfolios:read` | 403 |
| 2 | Quota `managed_portfolios` — charged for the whole batch up front | **402**, see below |
| 3 | The trial belongs to your organization | **404 "Portfolio not found"** for a single promote; a `failed` entry with the same message inside a batch |
| 4 | Idempotency — a promoted portfolio already exists for this trial in this organization | Not a failure. The existing id is returned and no second row is created. Checks 5 and 6 are re-run against the existing snapshot, so a repeat call can still be refused. |
| 5 | The strategy's execution type is `INTERNAL`, case-insensitively | **400** — see the Execution modes section below |
| 6 | If the parent study is a Mode-1 meta-strategy, no attached risk manager may be `sector_cap` or `country_cap` | **400**, message below |

The meta refusal from the promote endpoints, verbatim:

```text
trial portfolio {id} has a sector_cap/country_cap risk manager and its parent study is a Mode-1
meta-strategy (portfolio-of-baskets); those act on per-ticker sector/country metadata that baskets
do not have, so they are degenerate on a meta-portfolio. Remove the sector_cap/country_cap
attachment(s) before promoting. Other risk managers are fully supported on meta-portfolios.
```

Every other [risk manager](/docs/risk-managers) is fully supported on a meta-portfolio.

A trial whose study was soft-deleted, or that does not exist in your organization, never reaches those checks: a trial's readability is resolved through its parent study, which must belong to your organization and must not be soft-deleted, so the request is refused at check 3 with **404 "Portfolio not found"**.

> [!NOTE]
> Idempotency is enforced by a uniqueness constraint on the organization plus the source trial. One promoted copy per trial per organization — a repeat promote is a no-op that returns the existing id, never a duplicate row.

### Naming

The name is minted by the server as the study's display name, a space-slash-space, then `trial` and the trial number:

```text
Momentum v3 / trial 17
```

There is **no name field at promotion time and no rename anywhere** — not in this registry, not on the API. The name is part of the frozen snapshot, so renaming the study afterwards does not retitle the portfolio.

> [!NOTE]
> The name uses the study's *display name* — the label you set. Studies also carry an internal immutable key that is never rendered anywhere in the product.

### What the snapshot freezes

This is the promoted portfolio's equivalent of an advanced options panel: everything below is captured by value, in one transaction, so a partially-promoted portfolio cannot exist.

| Frozen item | What it captures |
|---|---|
| Strategy name | The strategy's name at promotion time |
| Author | The strategy's creator and username — the only fact that survives a full purge of the study, trial and strategy |
| Execution type, execution details, parameters | The strategy's runtime contract |
| Lookback mode and lookback function code | The strategy's lookback definition |
| Cluster type | Derived from the universe's exchanges, falling back to `generalized` |
| Pipeline graph | The study's launch snapshot of the strategy's data pipeline, minus its bindings; falls back to the strategy's live graph, then to an empty graph |
| Concrete parameters | The trial's own parameter values, each as a name, value and distribution |
| Strategy universe | The **study-gated runnable universe** — the asset group's tickers intersected with the study's launch universe, in asset-group order. Falls back to the whole asset group when the study froze no universe. |
| Fitness universe, fitness snapshot, fitness parameters | The [fitness function](/docs/fitness-functions)'s execution type, execution details and parameters, plus the study's fitness parameters |
| Risk manager configs and state | Copied from the trial |
| Risk manager pipelines | Each attached risk manager's frozen pipeline graph, keyed by attachment id, preferring the study's launch snapshot |
| Parameter ranges | From the study |
| Date windows | Train start and end, validation start and end, out-of-sample start and end |
| Seed | The trial's historical rebalancing signal |
| Meta flag and members | Whether the study was a portfolio-of-groups, and which groups |
| Benchmark | Preferred from the study's launch snapshot binding, falling back to the study's benchmark |

The time series are **copied, not re-simulated**: holdings, equity and orders are lifted from the trial as they stand, so the managed record is identical to the trial you picked.

> [!WARNING]
> Promotion does not run a backtest and does not re-optimize anything. If the numbers look wrong, the trial's numbers were wrong — see [analyzing results](/docs/analyzing-results).

### What stays live

Three references are deliberately kept live rather than frozen, because they are link targets rather than inputs:

| Reference | Behaviour |
|---|---|
| Strategy id | Powers the Strategy column's link. Goes null when the strategy is purged, and the link disappears while the strategy is merely soft-deleted. |
| Source trial id | Powers **View in Portfolio Analysis**. Set to null when the trial is deleted. |
| Study id and name | Powers the Study column. Reads **Not available** once the study is deleted or soft-deleted. |

### What becomes immutable

Because the daily updater reads the snapshot instead of the live entities, nothing you do to the source objects afterwards reaches a promoted portfolio.

| You change | Effect on the promoted portfolio |
|---|---|
| Edit or rename the strategy | None. The Strategy column keeps the frozen name; only the link may disappear. |
| Edit the risk managers | None. The frozen configs and pipelines keep running. |
| Edit the asset group | None. The frozen universe keeps running. |
| Delete the study | The row survives untouched. Study reads **Not available** and View in Portfolio Analysis is disabled. |
| Delete the strategy | The row survives. The frozen name and author remain; the link goes. |
| Delete the promoted portfolio | Permanent, and only possible when no portfolio group holds it. |

### Batch promotion and quota

Bulk promotion sends one request for the whole selection. Duplicates are collapsed and your order is preserved.

| Limit | Value | Refusal |
|---|---|---|
| Maximum trials per request | **50** | 400 `cannot promote more than 50 trials in one request (got N)` |
| Empty selection | Rejected | 400 `trial_portfolio_ids must not be empty` |

Batch promotion is **partial success by contract**: the response separates what was promoted from what failed, and one un-promotable trial never discards the rest. Organization scoping is checked per id for exactly that reason.

Promotion is quota-gated on `managed_portfolios`. The default free-tier cap is **5**, counted as a plain row count, so deleting a promoted portfolio frees a slot immediately. The whole batch is charged up front. Refusal is **HTTP 402** with:

> Your plan includes {limit} managed portfolios and you already have {used}. Existing ones keep working — buy tokens to create more, or delete one to make room.

The app intercepts that response globally and opens the token purchase dialog rather than showing a red toast. In that dialog the resource is named **promoted portfolios**, not the raw quota key. Organizations that have purchased tokens bypass the cap entirely. See [tokens and billing](/docs/tokens-and-billing).

> [!NOTE]
> The registry page itself is never entitlement-locked or blurred. Only the act of promoting is capped.

### After promotion: daily updates

A fresh promotion is enrolled in daily updates — the **Daily updates** column reads **On**. That flag exists so the portfolio can be extended one bar at a time by the updater.

There is **no per-portfolio toggle for it, in the UI or on any API**. The only writes to it come from the portfolio-group layer, when a group is created with daily updates on or when its membership is synced, and both of those only ever turn it **on**, never off. The developer API endpoint that once changed it was removed.

## Execution modes

The Internal/External split is a property of the [strategy](/docs/external-strategies) a trial came from, not something you choose here. For promoted portfolios it is a hard gate.

### Internal only

Only trials whose strategy has execution type `INTERNAL` — Python that runs inside Fintela against the platform's deterministic function signature — can be promoted. The check is case-insensitive, it runs before anything is written, and it is re-run on the idempotent path, so a copy promoted before the guard existed is still refused today.

The reason is the daily updater. Extending a portfolio one bar at a time means re-executing the strategy on the platform's own schedule, against the platform's own data; the updater supports Internal strategies only.

### External is refused

External strategies — the ones you host yourself, in any language, on your own infrastructure and against your own private data — **cannot be promoted, and therefore cannot exist in this registry at all.**

The refusal carries two different wordings depending on which path produced it, so quote the one you actually saw. From the promote endpoints — the single promote and the batch alike:

```text
trial portfolio {id} uses an EXTERNAL strategy ({execution_type}); managed daily-update mode
supports INTERNAL strategies only, so it cannot be promoted or tracked
```

From the portfolio-group path, when an id is resolved into a group member:

```text
portfolio {id} uses an EXTERNAL strategy ({execution_type}); it cannot daily-extend (managed
mode supports INTERNAL only), so it cannot be in a tracked basket. Remove it from the basket.
```

### What that rules out

| Capability | Available for an External strategy |
|---|---|
| Optimizing it in a study and inspecting the resulting trials | Yes — see [external strategies](/docs/external-strategies) |
| Promoting one of those trials | **No** |
| Putting one in a [portfolio group](/docs/portfolio-groups) | **No** — group membership requires a promoted portfolio, so the same refusal fires |
| Daily updates on it | **No** |
| [Live trading](/docs/live-trading) it through group operations | **No**, because it can never become a group member |

### Where the gate does not reach

The gate reads the **strategy's** execution type and nothing else.

- A study that used an **External fitness function** promotes normally. The fitness function's execution type is frozen into the snapshot but is never checked. See [external fitness](/docs/external-fitness).
- Risk managers are not gated by execution type at all; the only risk-manager refusal is the meta-strategy `sector_cap` / `country_cap` case described above.

For the full picture of how Internal and External differ across the platform, see [execution modes](/docs/execution-modes).
