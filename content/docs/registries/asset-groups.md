---
title: Asset Groups
section: Registries
sectionOrder: 3
order: 2
published: true
updated: 2026-08-18
summary: Define the tradeable universe a study runs on — tickers, index membership, and date coverage.
keywords: asset group, data cluster, universe, tickers, index members, groupings, coverage, registry
---

An asset group is a named, saved, **frozen** list of instruments owned by your organization. It is the universe half of a quant experiment: a [study](/docs/studies) binds one asset group as its strategy universe and optionally a second one as its fitness universe, and the simulation stack loads exactly those price series. You build one in a screener that lets you filter the whole market — but only the resulting selection is saved. The filters are never stored and never re-evaluated.

## Overview and purpose

### What an asset group holds

A group carries two kinds of membership, and they coexist in one row:

| Membership kind | What it is | Stored as |
|---|---|---|
| Tickers | Real instruments from the platform ticker table, across the `US`, `CC` (crypto) and `FOREX` exchanges | `tickers_id` — a JSONB array of integer ticker ids |
| Portfolio-group members | A whole graduated [portfolio group](/docs/portfolio-groups) whose stitched equity curve is injected into the price panel as a `BASKET:<uuid>` pseudo-ticker and scored exactly like a ticker price series | `basket_members` — a JSONB array of `{"basket_id": <uuid>, "injection_mode": "curve"}` |

A group is valid when it has **at least one ticker or at least one portfolio-group member**. The database constraint is `jsonb_array_length(tickers_id) > 0 OR jsonb_array_length(basket_members) > 0`, so a members-only group with no tickers at all is legal — that is the portfolio-of-portfolios case.

> [!WARNING]
> An asset group has **no date range, no timeframe, and no data provider**. There are no date columns on the table; date windows belong to the study (`train_start_date` and friends). Daily bars are the only price resolution the platform stores, and the market-data vendor is a global platform choice, never a per-group setting. Any older documentation showing `start`, `end`, `timeframe` or `source` fields on an asset group is describing fields that do not exist.

### Static membership, and the one exception

Whenever you have anything selected in the builder, the screen states the rule outright:

> An Asset Group saves a fixed ticker list; filters are not re-evaluated later.

That is the most important semantic fact about the object. The screener is a *selection tool*. Nothing about the exchange, the filters, the sort or the "Include no-data" switch is persisted, and the saved membership is never recomputed.

The single exception is a **grouping-derived** group, created by the [study builder](/docs/studies) when you pick a platform grouping (a sector-ETF collection, an index, a sector) as a study's universe. Those rows are deduplicated per organization and grouping, and re-picking the same grouping refreshes their membership. They are also **hidden from this registry** — you will never see or manage one here.

### Where the old name "data cluster" still appears

Asset Groups were renamed from **Data Clusters**, and the rename landed in the UI layer only. Every other layer still says *data cluster*, which matters the moment you read an API path, a permission string or a database column.

| Layer | Name in use |
|---|---|
| UI label, nav entry and route | **Asset Groups**, `/asset-groups` |
| Legacy UI route | `/dataCluster/*` — redirects to `/asset-groups/*` |
| Backend HTTP paths | `/data_clusters`, `/data_clusters/metadata`, … |
| Developer API | `GET /v1/data_clusters` |
| Database table | `developers.data_clusters` |
| Study foreign keys | `strategy_data_cluster_id`, `fitness_data_cluster_id` |
| Backend permission strings | `data_cluster:read`, `data_cluster:create`, `data_cluster:update` |
| Entitlement quota key | `data_clusters` |

The word *cluster* also survives in a handful of user-visible strings inside the builder — "Pick assets from the table to build the cluster.", "multi-market cluster", "Add them if you want a strategy to trade those tickers directly." Those are quoted verbatim throughout this page; the product term is Asset Group.

The legacy route is a redirect, not a second surface:

| Legacy path | Redirects to | Preserves |
|---|---|---|
| `/dataCluster` | `/asset-groups` | query string |
| `/dataCluster/view/:id` | `/asset-groups/view/:id` | sub-path and query string |
| `/dataCluster/edit/:id` | `/asset-groups/edit/:id` | sub-path and query string |

Live routes are:

| Path | Screen |
|---|---|
| `/asset-groups` | Registry list (table or card view) |
| `/asset-groups/view/:id` | Read-only detail |
| `/asset-groups/edit/:id` | Editor |
| `/asset-groups?mode=create` | Create flow |

`:id` is the integer group id. A non-numeric id falls back to the list. There is no `/asset-groups/create` path.

### What consumes an asset group

```text
  Screener selection ──► Asset Group (frozen ticker list + basket curves)
                              │
                              ├─► Study: strategy universe   (required)
                              ├─► Study: fitness universe    (optional)
                              ├─► Strategy / fitness sandbox universe picker
                              ├─► Study builder date presets (via /date_coverage)
                              └─► Developer API: GET /v1/data_clusters
```

- **Studies** are the primary consumer. `strategy_data_cluster_id` is required on a study; `fitness_data_cluster_id` is optional. A study that references a group makes it read-only and undeletable, as described under the row action menu below.
- **The strategy and fitness sandboxes** pick an asset group as the universe they explore against.
- **The study builder** reads the group's date coverage to offer date presets and to bound the date pickers.
- **Markets** can create a group straight from a ranking result through the **"Create Asset Group from Ranking"** dialog.
- **A launched study** can hand its frozen runnable universe back as a new group — the **"Save as asset group"** button on the study's "Runnable universe (frozen at launch)" panel.
- **The Developer API** exposes a read-only list; see [Asset Groups API](/docs/api-asset-groups).

### Date coverage and metadata quality

An asset group does not store dates, but the platform will tell you what calendar its members actually have. Three read endpoints report this, and none of them is rendered by this registry — there is **no coverage panel on the asset-group detail page**. `date_coverage` is the only one with a screen: the [study builder](/docs/studies) reads it for its date presets and pickers, and so do the strategy and fitness sandboxes. `last_date` and `meta-quality` have no UI consumer at all — they are reachable through the API and as [Fintelligent](/docs/fintelligent) tools.

| Endpoint | Returns | Meaning |
|---|---|---|
| `GET /data_clusters/{id}/date_coverage` | `first_any`, `first_all`, `last_all`, `last_any`, `ticker_max_dates` | Per-series first/last dates, aggregated. `*_any` spans the union of the series; `*_all` is the window in which **every** series has data |
| `GET /data_clusters/{id}/last_date` | a single `YYYY-MM-DD` or `null` | The latest date on which every ticker has a priced bar |
| `GET /data_clusters/{id}/meta-quality` | `total_tickers`, `null_sector`, `null_industry`, `null_country`, `null_type` | How much classification metadata the group's tickers are missing |

Two details matter when you read these numbers:

- Coverage is computed **per series — tickers and portfolio-group curves alike** — so a members-only group still gets a full calendar, taken from its baskets' backtest equity series.
- Each ticker's last day is capped at the group's complete-data ceiling, so a partially updated current day is never offered as a selectable end date.

> [!NOTE]
> `meta-quality` is the one hyphenated path in an otherwise snake_case API. Copy it exactly.

## Registry table view

The registry lives at `/asset-groups`, in the sidebar's **Registry** section (see [navigation](/docs/navigation)). It renders through the shared registry workbench, so it behaves like the other [registries](/docs/registries).

### Command bar

| Control | Exact text | Behaviour |
|---|---|---|
| Page heading | **Asset groups** | the page `h1` |
| Search box | placeholder **Search groups or symbols…** | writes to `?q=`; the clear button is labelled **Clear** |
| Filter | **Filter** | opens the filter panel |
| Column chooser | icon button | disabled in card view |
| View toggle | **List view** / **Card view**, group label **View mode** | icon-only segmented control |
| Help | **View documentation** | opens the contextual docs drawer, anchored right |
| Refresh | **Refresh** | refetches the group list and metadata |
| Quota meter | — | free-tier usage against the `data_clusters` cap |
| Create | **New Asset Group** | opens the create flow |

The create button is two-layered. It is disabled when your role cannot create asset groups. When the **entitlement quota is full** it stays enabled and primary-coloured, and clicking it opens the purchase dialog instead of the create flow — the cap is answered with a storefront, not a wall. See [tokens and billing](/docs/tokens-and-billing).

### Columns

Columns are produced for this registry specifically. Only five exist, and only four are visible by default; the fifth is available in the column chooser.

| Column | Header | Default visible | Sorts on | Rendering |
|---|---|---|---|---|
| `name` | **Name** | yes | the name | bold, single line |
| `description` | **Description** | yes | the resolved description text | secondary text, single line, `—` when empty |
| `author` | **Author** | yes | the creating user's username | secondary text |
| `tickers` | **Tickers** | no — chooser only | the ticker count | a chip carrying the formatted count |
| `created_at` | **Created At** | yes | the creation timestamp, `0` when null | `Mar 3, 2026` style; `—` when null; not filterable by the column filter |

**Default sort is `created_at` descending** — newest first. Rows with no creation timestamp sort last.

> [!TIP]
> The Description column does not show what you typed. By default it shows a **generated sentence** derived from the row itself, and your hand-typed text moves into the hover tooltip labelled **Author's note**. Nothing is written to the database. Append `?ff_registryGeneratedDescriptions=0` to the URL to restore the stored text.

The generated sentence is assembled from these fragments:

| Fragment | Text |
|---|---|
| Headline | **Asset group holding {{contents}}**, or **Asset group** when the group is empty |
| Ticker clause | **{{count}} ticker** / **{{count}} tickers** |
| Member clause | **{{count}} portfolio group member** / **{{count}} portfolio group members** |
| Symbols | **First symbols: {{symbols}}** — the first 5, then **+{{count}} more** |
| Exchanges | **Exchanges: {{exchanges}}** — up to 4, then `+N more`; or **No exchange data** when the group holds tickers but their exchange metadata is missing |

A full example: `Asset group holding 42 tickers, 2 portfolio group members. First symbols: AAPL, MSFT, NVDA, AMZN, GOOGL +37 more. Exchanges: US.`

Asset class is deliberately **not** part of the sentence and not a column. The class chip, the class column, the class filter and the "By type" insights breakdown were all removed from this registry.

### Search, filters and sort

Free-text search indexes the name, the resolved description, the stored note and the author's username. Because the resolved description carries symbols, counts and exchanges, a group is findable by typing `AAPL`, `FOREX`, `42 tickers`, an author name, or the note you wrote at creation time.

The filter panel exposes exactly five controls:

| Column | Control kind |
|---|---|
| `name` | text |
| `description` | text |
| `author` | multi-select |
| `tickers` | number range |
| `created_at` | date range |

Search, filters and sort live in the **URL**, so a filtered and sorted view is shareable. View mode and column visibility live in **local storage** on your machine.

When the Workspaces filter is set to "My" and the result is empty, a banner explains why rather than implying the org has nothing: title **"You haven't created any asset groups yet."**, body **"Workspace filter is on — it is showing only yours. Your teammates' asset groups are still there."**, and a **Show all asset groups** button that switches the workspace to company mode.

### Insights band

The insights band summarises the rows currently visible. It renders an **Overview** section with these stat tiles:

| Tile | Value |
|---|---|
| **Insights** | count of visible rows |
| **Dependent studies** | sum of the per-row study reference count |
| **Graduated portfolios** | from a batched analytics fetch across all group ids |
| **Quality** | average well-trained percentage, toned positive at 0.6 and above, warning at 0.4 and above, negative below |

Below that come **Graduated portfolios** and **Dependent studies** rank bars (top 3 each), plus a **Selected** section when a row is focused. With nothing to report it shows **"No insights for this view."**

The "By type" breakdown that sibling registries render is **absent here**, because it was fed by the asset-class taxonomy this registry no longer carries.

### Row action menu

**No cell is a link.** Left-clicking a row opens the action popover below it; right-clicking opens the same actions at the cursor. The popover header is the row's name, and **View** inside it is the only navigation into a group.

| Action | Label | What it does | Disabled when | Tooltip when disabled |
|---|---|---|---|---|
| view | **View** | opens `/asset-groups/view/{id}` | never | — |
| edit | **Edit** | opens `/asset-groups/edit/{id}` | the group is used in a study, or your role cannot edit | **This item is currently used in a study and cannot be edited.** (only for the in-use case) |
| duplicate | **Duplicate** | server-side copy, `POST /data_clusters/{id}/duplicate` | your role cannot create | — |
| copyTickers | **Copy ticker codes** | resolves the group's ticker ids to symbols and writes them to the clipboard | the group has no tickers | **This asset group has no tickers to copy.** |
| delete | **Delete** | opens the delete confirmation | the group is used in a study, or your role cannot delete | **This item is currently used in a study and cannot be edited.** |

There is **no Share action**. Asset groups are permanently organization-visible — a database trigger forces `organization` visibility on every insert and update, so a private or per-user-shared asset group is unreachable even via direct SQL. Everyone in your organization sees every non-derived asset group.

**Duplicate** allocates a free name through the shared registry naming allocator: `"<name> (copy)"`, then `" (2)"`, `" (3)"` on collision. Duplicating `SP500` when `SP500 (copy)` already exists yields `SP500 (copy) (2)`. Description, tickers and portfolio-group members are copied verbatim; you become the new row's author. It responds `201 Created`.

**Copy ticker codes** writes the codes in the group's own order, formatted `['AAPL','TSLA']` — single quotes, no spaces, valid in both Python and JavaScript. A snackbar reports the outcome:

| Case | Severity | Text |
|---|---|---|
| Nothing selected | info | **No tickers to copy.** |
| All resolved | success | **{{count}} ticker codes copied to clipboard.** |
| Some unresolved | warning | **{{count}} ticker codes copied to clipboard — {{missing}} could not be resolved.** |
| None resolved | error | **None of the {{count}} tickers could be resolved to a code.** |
| Clipboard failure | error | **Could not copy the ticker codes: {{error}}.** |

### Bulk selection and delete confirmation

Selecting rows turns the status bar into an action bar showing **{{count}} selected**, one bulk action — **Delete**, styled destructive — and **Clear selection**.

Single and bulk delete open the **same** dialog:

| Element | Exact text |
|---|---|
| Title | **Confirm Action** |
| Message | **Are you sure you want to delete the selected asset group? Associated studies may be affected.** |
| Buttons | **Cancel** / **Confirm** |

> [!CAUTION]
> The message is singular even when you are deleting many rows, and the delete is **hard** — there is no soft-delete column and no restore. Confirming a bulk delete issues one delete request per selected id. Because deletion is a hard delete, it also frees a quota slot immediately.

Deletion fails with **409 Conflict** when a study still references the group: **"Cannot delete: this asset group is used by one or more studies. Delete those studies first."**

> [!WARNING]
> The dependent-study count shown in the insights band only counts **live** studies, but the database constraint fires for soft-deleted studies too. A group can therefore report zero dependent studies, offer an enabled Delete, and still fail with a 409.

### Relations expander

Each row carries a chevron that reveals a semantic map of what the group is wired to across the other registries. Controls read **Show details** / **Hide details**; the empty state is **"No linked resources yet."** and the failure state **"Couldn't load related resources."** The legend distinguishes **Direct link** from **Linked through a study**, and the lanes are **Studies**, **Strategies**, **Fitness**, **Asset Groups** and **Risk Managers**. The data is fetched once for the whole registry, on the first expansion.

### Empty, loading and error states

| State | Text |
|---|---|
| Empty registry | title **No asset groups yet**, body **Create your first asset group to define a universe to trade.** |
| Loading | a skeleton table with header cells **Name**, **Assets**, **Created** |
| Load failure | **Error loading asset groups definitions** |

> [!NOTE]
> The loading skeleton's headers (**Name**, **Assets**, **Created**) do not match the real table's (**Name**, **Description**, **Author**, **Created At**). That is cosmetic, but worth knowing if you are matching a screenshot.

### Toasts

| Event | Text |
|---|---|
| Created | **Asset group created** |
| Created from a study | **Asset group created from the study** |
| Duplicated | **Asset group duplicated** |
| Updated | **Asset group updated successfully** |
| Deleted | **Asset group deleted successfully** |

### Roles and quotas

Role permissions are resolved from your Keycloak group path and gate the row actions and the create button:

| Role | Asset-group actions |
|---|---|
| Owner | view, edit, create, delete |
| Admin | view, edit, create, delete |
| Manager | view, edit, create |
| Analyst | view, create |
| Unresolved role | view, create |

The backend enforces its own permission strings, and they do not line up one-for-one with the role table:

| Operation | Backend permission |
|---|---|
| list, metadata, coverage, last date, meta-quality, basket holdings | `data_cluster:read` |
| create, from-study, from-grouping, duplicate | `data_cluster:create` |
| update | `data_cluster:update` |
| **delete** | **`root:all`** |

> [!WARNING]
> There is no `data_cluster:delete` permission. Deletion requires `root:all`, which is stricter than the frontend role matrix implies — an Admin whose token lacks `root:all` will see an enabled Delete and get a permission failure from the server.

Creation is metered by the `data_clusters` entitlement quota, enforced on create, from-study, from-grouping and duplicate. The free-tier default is **2 asset groups per organization**, counted as a live row count.

Asset Groups is **not** an entitlement-locked feature — the route is never blurred behind a locked overlay, on any tier.

## Creation wizard and advanced options

> [!NOTE]
> Despite the "wizard" name used internally, the create flow is **one screen**, not a sequence of steps. The only modals are the optional Portfolio Groups dialog and the mandatory naming and confirm dialog. There is no asset-class step — it was removed.

### Entry points

| Entry | How |
|---|---|
| **New Asset Group** button | from the registry command bar |
| `?mode=create` | `/asset-groups?mode=create` |
| Fintelligent | `ui_crud_action` with entity `asset_group` and action `create`, `edit` or `duplicate` — see [Fintelligent capabilities](/docs/fintelligent-capabilities) |
| Markets | the **Create Asset Group** action on a ranking result |
| Studies | **Save as asset group** on a launched study's frozen universe panel |

### Page header and layout

| Mode | Title | Subtitle |
|---|---|---|
| create | **Create Asset Group** | **Define a new asset group by selecting tickers and filters** |
| edit | **Edit Asset Group** | **Update definition and ticker selection for this asset group** |
| view | the group's name, falling back to **View Asset Group** | the group's description, falling back to **Inspect definition and ticker selection for this asset group** |

View mode adds a **Back** button before the title that returns to `/asset-groups`. It is the same component as the editor, wrapped in a disabled fieldset — every input is read-only, and no draft is hydrated or offered. The copy-codes icon button in the selection rail is the deliberate exception and keeps working.

Editing an existing group seeds the selection from its saved tickers. **Name and description are not on the working surface at all** — they are collected by the confirm dialog when you save.

The working surface is a four-band layout with exactly two scroll regions (the results grid body and the selection list):

```text
[A] command bar        44px   exchange · search · funnel · include-no-data · portfolio groups
[B] filter matrix     138px   three strips, always visible, never collapses
[C] criteria bar       30px   MATCH ALL · one chip per active dimension · live match count
[D] work area        flexes   results grid (virtualised)  |  selection rail (300px)
```

### Command bar fields

| Field | Label / values | Type | Default | Validation and behaviour |
|---|---|---|---|---|
| Exchange | **US**, **Crypto**, **Forex** | select | **US** | Never empty, and there is no "All" option. The underlying codes are `US`, `CC` and `FOREX`. Changing it re-seeds the sort and un-dismisses the paused banner but **does not touch your selection** — the exchange scopes discovery, not the group being built |
| Search | placeholder **Ticker or name…** | text | empty | debounced 300 ms |
| Funnel readout | **{{universe}} listed · {{priced}} with data · {{matches}} match** | read-only | — | makes the default price gate legible instead of a silent filter |
| Include no-data | **Include no-data** | switch | **off** | when on, instruments with no recent price data are included in the results |
| Coverage warning | tooltip **Coverage data unavailable; filter availability may be inaccurate until the daily snapshot runs.** | icon | hidden | shown only when the per-exchange coverage snapshot is missing |
| Portfolio groups | **Portfolio Groups**, plus ` (N)` when members are selected | button | — | opens the Portfolio Groups dialog |

### Contextual banners

Two 26px banners can appear between the command bar and the filter matrix.

**Survivorship notice** (info) — shown when a historical index mode is active, "Include no-data" is off, and the price gate is hiding past members:

> {{count}} past members are hidden: they have no recent price data. A historical universe usually wants them.

with an **Include them** button that flips the switch. It is never flipped automatically, because doing so would widen what you are about to save.

**Paused criteria** (warning) — shown when filters are set that the current market cannot support:

> {{count}} criteria paused: not available on this market

with one deletable chip per paused filter and a **Dismiss** button. Switching markets **pauses** unsupported filters rather than deleting them, and paused filters are withheld from the query so the chips and the match count can never disagree.

### Filter matrix and coverage tiers

The matrix is three strips, always visible:

| Strip | Gutter label |
|---|---|
| classification | **Classification** |
| sizeValue | **Size & Value** |
| performance | **Performance** |

Under the gutter label, a strip with active filters shows **{{count}} active**. Each strip shows six filter cells and an expansion button on the right that reads `+N` when there is overflow and the literal **all** when there is none. It opens a portalled popover whose header carries the strip name and a live **{{count}} matches**. Setting a value inside the popover **pins** that filter into the strip for that exchange, remembered in local storage per exchange.

When a strip has nothing to offer on the current market it explains itself instead of rendering blank cells:

| Strip | Empty text |
|---|---|
| Classification | **No sector or industry classification is collected for {{exchange}}. Its {{total}} instruments are filterable by price, volume and technicals.** |
| Size & Value | **No fundamentals are collected for {{exchange}}. Its {{total}} instruments are filterable by price, volume and technicals.** |
| Performance | **No market data available for {{exchange}}.** |

Which filters appear where is decided by **measured per-exchange coverage** returned by the screener schema, merged with a curated layout — there is no hardcoded per-market branch anywhere in the UI. Each filter resolves to a tier:

| Tier | Meaning | How it renders |
|---|---|---|
| `ok` | well covered | normal |
| `thin` | real, but under 10% coverage | enabled, annotated **only {{n}} of {{total}} have this data** |
| `notHere` | works on another market, zero rows here | disabled, in the popover tail, tooltip **{{n}} of {{total}} — not available on {{exchange}}**, plus a ratio chip whose tooltip reads **This market has no data for this filter, so it cannot narrow the universe.** |
| `soon` | modelled, but nothing populated anywhere yet | disabled, tooltip **Coming soon** |
| `hidden` | never obtainable | not rendered at all |

Tier resolution **fails open**: with no schema at all, every filter resolves to `ok` rather than rendering the whole builder disabled.

Cell precedence inside a strip is: every **active** filter first (a set filter can never be hidden), then every **pinned** filter, then the remaining slots by curated rank with ties broken by real coverage.

### Filter catalog

**Classification** — multi-select except `index`, which is the membership picker described below.

| Rank | Key | Label |
|---|---|---|
| 1 | `sector` | **Sector** |
| 2 | `index` | **Index** |
| 3 | `industry` | **Industry** |
| 4 | `theme` | **Theme** |
| 5 | `subtheme` | **Sub-theme** |
| 6 | `country` | **Country** |
| 7 | `type` | **Type** |

Categorical filters map to their own plural query keys: `sector` → `sectors`, `industry` → `industries`, `country` → `countries`, `type` → `ticker_types`, `theme` → `themes`, `subtheme` → `subthemes`. Choosing themes narrows the sub-theme option list to their children, and dropping a theme prunes its orphaned sub-themes — otherwise the two would intersect to a silently empty set.

**Size & Value** — all range filters, all with a Custom option. Ranks 10 to 14 are the crypto entries: they never displace the equity set on US, and they are promoted automatically on Crypto where the equity fundamentals resolve to `notHere`.

| Rank | Key | Label | Unit |
|---|---|---|---|
| 1 | `market_cap` | **Mkt Cap** | currency |
| 2 | `pe_ratio` | **P/E** | ratio |
| 3 | `dividend_yield` | **Div Yield** | percent |
| 4 | `price_book` | **P/B** | ratio |
| 5 | `profit_margin` | **Net Margin** | percent |
| 6 | `roe` | **ROE** | percent |
| 7 | `price_sales_ttm` | **P/S** | ratio |
| 8 | `forward_pe` | **Fwd P/E** | ratio |
| 9 | `peg_ratio` | **PEG** | ratio |
| 10 | `market_cap_diluted` | **Diluted Cap** | currency |
| 11 | `market_cap_dominance` | **Dominance** | percent |
| 12 | `circulating_supply` | **Circ. Supply** | number |
| 13 | `total_supply` | **Total Supply** | number |
| 14 | `max_supply` | **Max Supply** | number |
| 20 | `ebitda` | **EBITDA** | currency |
| 21 | `revenue_ttm` | **Revenue** | currency |
| 22 | `revenue_per_share` | **Rev/Share** | ratio |
| 23 | `operating_margin` | **Op Margin** | percent |
| 24 | `gross_margin` | **Gross Margin** | percent |
| 25 | `roa` | **ROA** | percent |
| 26 | `roic` | **ROIC** | percent |
| 27 | `ev_ebitda` | **EV/EBITDA** | multiple |
| 28 | `ev_sales` | **EV/Sales** | multiple |
| 29 | `price_cash` | **P/C** | ratio |
| 30 | `price_fcf` | **P/FCF** | ratio |
| 31 | `debt_equity` | **Debt/Eq** | ratio |
| 32 | `lt_debt_equity` | **LT Debt/Eq** | ratio |
| 33 | `current_ratio` | **Current Ratio** | ratio |
| 34 | `quick_ratio` | **Quick Ratio** | ratio |
| 35 | `payout_ratio` | **Payout** | percent |
| 36 | `eps_growth_ttm` | **EPS Growth** | percent |
| 37 | `sales_growth_ttm` | **Sales Growth** | percent |
| 38 | `eps_surprise` | **EPS Surprise** | percent |
| 39 | `insider_ownership` | **Insider Own** | percent |
| 40 | `institutional_ownership` | **Inst. Own** | percent |
| 41 | `shares_outstanding` | **Shares Out** | number |
| 42 | `float` | **Float** | number |

**Performance** — all range filters, all with a Custom option. Built deliberately from end-of-day-backed columns only, so the strip survives on every exchange.

| Rank | Key | Label | Unit |
|---|---|---|---|
| 1 | `price` | **Price** | price |
| 2 | `avg_volume` | **Avg Volume** | number |
| 3 | `change` | **Change** | percent |
| 4 | `rsi14` | **RSI 14** | number |
| 5 | `sma50` | **vs SMA50** | percent |
| 6 | `high_low_52w` | **52w Range** | percent |
| 10 | `current_volume` | **Volume** | number |
| 11 | `rel_volume` | **Rel Volume** | number |
| 12 | `volatility` | **Volat 90d** | percent |
| 13 | `atr` | **ATR 14** | number |
| 14 | `beta` | **Beta** | number |
| 15 | `sma20` | **vs SMA20** | percent |
| 16 | `sma200` | **vs SMA200** | percent |
| 17 | `gap` | **Gap** | percent |
| 18 | `short_float` | **Short Float** | percent |
| 19 | `short_ratio` | **Short Ratio** | number |
| 20 | `analyst_recom` | **Analyst Rec** | number |
| 21 | `target_price` | **Target Price** | price |
| 22 | `ath_price` | **ATH** | price |
| 23 | `atl_price` | **ATL** | price |

### Range presets and unit conventions

Every range filter is a dropdown of **named presets**, not a pair of free-text boxes. The first item is always **Any**, which clears the filter; the last is **Custom…**, which reveals two number inputs with placeholders **Min** and **Max**. A preset with no name is rendered from its bounds.

| Preset | Label | Used by |
|---|---|---|
| `mega` | **Mega ($200B+)** | market cap |
| `large` | **Large ($10-200B)** | market cap |
| `mid` | **Mid ($2-10B)** | market cap |
| `small` | **Small ($300M-2B)** | market cap |
| `micro` | **Micro ($50-300M)** | market cap |
| `nano` | **Nano (<$50M)** | market cap |
| `profitable` | **Profitable** | P/E, forward P/E |
| `positive` | **Positive** | margins, returns, change, EPS surprise, dividend yield, EBITDA |
| `negative` | **Negative** | margins, change, EPS surprise, beta |
| `none` | **None** | dividend yield, payout ratio |
| `priceAbove` | **Price above** | moving averages |
| `priceBelow` | **Price below** | moving averages |
| `newHigh` | **New high** | 52-week range |
| `oversold` | **Oversold** | RSI 14 |
| `overbought` | **Overbought** | RSI 14 |
| `strongBuy` | **Strong Buy** | analyst recommendation |
| `buyBetter` | **Buy or better** | analyst recommendation |
| `holdBetter` | **Hold or better** | analyst recommendation |

> [!WARNING]
> Units differ by filter and the control converts for you — which matters if you drive the screener through the API instead. `percent` filters are stored as a **fraction** (`0.05` means 5%), and the control shows a `%` adornment while converting a typed `5` to `0.05`. `currency` filters are stored in **raw dollars**, and the control shows `$M` while converting a typed `2000` to `2e9`. `price`, `ratio`, `multiple` and `number` are stored as typed.

Range filters write `{key}_min` and `{key}_max` into the query body.

### Index membership: point-in-time universes

The **Index** filter is the closest thing the builder has to dynamic membership, and it is the most easily misread control on the screen. It is a real AND predicate with a point-in-time dimension: it selects the instruments that were members of an index **according to a timing rule you choose** — and then that resolved list is what gets frozen into your group.

| Control | Label | Values |
|---|---|---|
| Index | **Index** | autocomplete; each option reads `name (count)`, where the count is evaluated for the current mode |
| Mode | **Evaluated at** | **Current**, **Ever**, **Period**, **On a date** |
| Strictness (Period only) | **Membership** | **At any point** or **The whole period** |
| Dates (Period only) | **From** / **To** | date inputs |
| Date (On a date only) | **On** | a single date input |

Timing rules map to the wire values `current`, `ever`, `interval_any`, `interval_all` and `as_of`. **Period defaults to "At any point"**, the survivorship-bias-free reading.

Modes that need history are **disabled** when the index has none, with the tooltip **"No membership history is recorded for this index."** When history does exist, a caption reads **History covers {{from}} → {{to}}**, and the date inputs are clamped to that window. Clearing the index also clears its companion timing keys.

> [!TIP]
> An index-based selection is still a snapshot. Once you save, the group holds the instruments the rule resolved to at that moment — it does not track the index afterwards. Pair a historical mode with **Include them** on the survivorship banner if you want delisted past members in the saved set.

**Platform groupings** — sector-ETF collections, indices as universes, sectors, industries — are **not** selectable here. You pick those in the [study builder](/docs/studies), which materialises a derived group instead. Those derived rows are hidden from this registry.

### Results grid

The grid is virtualised, with 26px rows, and both **sorting and paging are server-side**. Columns are derived from measured coverage: a column removes itself when the market has zero coverage for its field.

| Column | Header | Alignment |
|---|---|---|
| `ticker` | **Ticker**, or **Pair** on Forex | left |
| `name` | **Name** | left |
| `price` | **Price** | right |
| `change_pct` | **Chg %** | right |
| `volume` | **Volume** | right |
| `avg_volume` | **Avg Vol** | right |
| `market_cap` | **Mkt Cap** | right |
| `sector` | **Sector** | left |
| `industry` | **Industry** | left |
| `theme` | **Theme** | left |
| `subtheme` | **Sub-theme** | left |
| `rel_volume` | **Rel Vol** | right |
| `rsi14` | **RSI** | right |
| `atr14` | **ATR** | right |
| `volatility_90d` | **Volat** | right |
| `price_vs_sma50` | **vs SMA50** | right |
| `range52w` | **52w** | left |

Theme and Sub-theme cells are clickable tags — clicking one adds it to the corresponding filter. Every column except Theme and Sub-theme is sortable. The default sort is `market_cap` on US and `avg_volume` on Crypto and Forex, where market cap is null; direction defaults to descending, a new column sorts descending, and clicking the active column toggles.

The header checkbox means **"select all matches"**, not "the rows loaded so far". It is disabled at zero matches, indeterminate when only some loaded rows are selected, and checked only when a complete id set was resolved for exactly these criteria. Its accessible label is **Select all {{count}} matches**, and it becomes a spinner while resolving.

With no results the body reads **"No matches for these filters."**

The footer states three different counts, deliberately:

| Element | Text |
|---|---|
| Paging progress | **{{shown}} of {{total}}** |
| Beyond the paging reach | **{{count}} beyond reach — narrow your filters** |
| Labelled twin of the header checkbox | **Select all {{count}} matches** or **Clear these {{count}}** |
| Selection truncated by the cap | **selected the top {{kept}} of {{total}} — narrow your filters** |
| Snapshot marker | **snapshot {{date}}** |

> [!NOTE]
> Three numbers, three meanings. **Matches** is how many instruments pass your criteria. **Shown of total** is how far paging has reached — the browse endpoint reaches 5,000 rows, so anything past that is reported as "beyond reach". **Selected** is the set that will actually be saved, capped at **10,000 instruments**; the server reports the truncation and the UI mirrors it.

The criteria bar above the grid makes the intersection literal: a static **MATCH ALL** label (not a mode switch), one deletable chip per dimension joined by `∧`, and a live match count on the right. The exchange is deliberately not a chip — it cannot be removed. Empty, it reads **"No filters — the whole market is selectable."** Paused criteria are excluded from this bar on purpose: they are not narrowing anything, and the paused banner is where they are surfaced.

| Chip kind | Tooltip |
|---|---|
| Categorical | **{{field}} is one of: {{list}}** |
| Theme / sub-theme (array overlap) | **Carries any of these: {{list}}** |
| Range | **{{field}} {{bounds}}** |
| Index | the full membership summary; the chip itself reads `index name · timing label` |

### Selection rail

The 300px rail on the right is the group you are actually building.

- Header: **{{count}} selected**, plus **{{count}} outside filter** when some selected tickers fall outside the current criteria. **Selected tickers are never pruned by a filter change** — the filter is a discovery tool, not a constraint on the saved set.
- A copy button, labelled **Copy ticker codes as ['AAPL','TSLA',…]**.
- A **Clear** button that empties the whole selection.
- Empty state: **"Pick assets from the table to build the cluster."**
- Above 2,000 selected ids, names are not resolved and the list shows **{{count}} selected — names not listed.**
- A composition strip at the bottom with two lines, **Markets** and **Sectors**, each showing the top three `name count` pairs. When more than one exchange is present it flags **multi-market cluster**, with the tooltip **"This cluster spans more than one market. The exchange filter scopes discovery, not the saved set."**

### Advanced options: portfolio groups as instruments

The Portfolio Groups dialog is the advanced panel of this editor. It is opened from the command bar and titled **Portfolio Groups (as instruments)**.

| Element | Exact text |
|---|---|
| Help line | **Optional. Each portfolio group is injected as its equity curve and scored exactly like a ticker price series — enabling strategies that allocate capital across your own portfolios.** |
| Disclosure title | **Why add portfolio groups?** |
| Paragraph 1 | **Use it to build a strategy of strategies — one that rotates capital between portfolios you have already validated, instead of picking individual names.** |
| Paragraph 2 | **A portfolio group contributes only its curve. If you also want a strategy to trade the tickers a portfolio group holds, add those tickers to this cluster as well.** |
| Picker | multi-select autocomplete over your organization's portfolio groups, placeholder **Add portfolio groups…** |
| Missing-ticker caption | **These portfolio groups hold {{count}} ticker(s) not in this cluster: {{codes}}. Add them if you want a strategy to trade those tickers directly.** — the first 12 codes, then an ellipsis |
| Footer | **Close** |

Every member is written with `injection_mode: "curve"`, which is the only value the field takes today. Members are validated server-side: each must exist, belong to your organization and not be soft-deleted, or the save is rejected with **"Basket(s) not found or not owned by this organization: {ids}"**.

### Naming and confirm dialog

This dialog is the **only** place an asset group is named. It opens when you press the primary button.

| Element | Exact text |
|---|---|
| Title | **Confirm Action** |
| Context line, create | **Name your asset group to create it.** |
| Context line, edit | **Review the name and description before saving.** |
| Field 1 | **Name** — required, autofocused |
| Field 2 | **Description** — required, multiline |
| Buttons | **Cancel** / **Confirm** |

Validation across the whole flow:

| Rule | Where it is enforced | Message |
|---|---|---|
| At least one ticker or one portfolio-group member | the working surface; the primary button stays disabled until it holds | **Select at least one ticker or portfolio group** (red caption under the editor) |
| Name is non-empty | the dialog; Confirm stays disabled | — |
| Description is non-empty | the dialog; Confirm stays disabled | — |
| Name is not already taken | the dialog, **create mode only**, case-insensitive against the groups already loaded in your list | **This name already exists** |
| No ticker code on two exchanges within one group | the server, on create and update | **Ticker codes appear in multiple exchanges: {code} (EX1, EX2); …** — HTTP 406 |
| Group is not referenced by a live study | the server, on update | **This asset group is currently used in a study and cannot be edited.** — HTTP 409 |

> [!NOTE]
> Description is effectively **required**, even though the database column is nullable and the API accepts `null`. Confirm does not enable until both fields are filled.

> [!WARNING]
> Names are **not** guaranteed unique. The collision check runs only in create mode, only client-side, and only against the rows your browser has loaded; the server's create path performs no uniqueness check, and there is no unique index on the name column. Only **Duplicate** allocates a guaranteed-free name.

The primary button reads **Create asset group** in create mode and **Save changes** otherwise, and is disabled while saving or while the universe is empty. **Cancel** runs the shared leave guard: **"Leave without saving?"**, with **Keep editing**, **Leave, keep the draft** and **Discard and leave**.

Unsaved work is kept as a draft, badged **Unsaved draft** or **Unsaved changes**. When a draft is restored — or [Fintelligent](/docs/fintelligent) left one — a banner appears reading **"Fintelligent left an unsaved draft here"**, **"You left unsaved changes here"** or **"Restored from your previous session"**, with the body **"This is not the saved version. Review it before saving, or discard it to go back to what's saved."** and the actions **Keep the draft** / **Discard and restore**. Saving while a draft is unreviewed is refused with **"Review the draft before saving"**. Drafts are keyed per group; create mode has its own slot, and the view page has a separate read-only slot so opening "view" never surfaces someone's abandoned edit.

### What the save sends

Create issues `POST /data_clusters`:

```http
POST /data_clusters
Content-Type: application/json

{
  "name": "US Large Cap Momentum",
  "description": "Top 200 by market cap, RSI over 60",
  "tickers_id": [101, 204, 3391],
  "basket_members": [
    { "basket_id": "3f2b...", "injection_mode": "curve" }
  ]
}
```

Edit issues `PUT /data_clusters` with the same fields plus `data_cluster_id`. Both respond with the group id, wrapped in the standard `{"data": …}` envelope.

**Nothing about the screener state is persisted** — not the exchange, not the filters, not the sort, not the "Include no-data" switch. On success the draft is discarded and you are returned to `/asset-groups`.

### Derived creation paths

Three endpoints create a group without going through the builder.

| Path | Trigger | Behaviour |
|---|---|---|
| `POST /data_clusters/from_study` | **Save as asset group** on a study's frozen universe panel | Requires a launched study with a frozen runnable universe; otherwise **"Study {id} has no frozen runnable universe yet — launch it first, then save the universe it ran on."** (406). Default name is `<study name> · runnable universe`. Rows created this way **do** appear in the registry, with no lineage badge |
| `POST /data_clusters/from_grouping` | the study builder, when you pick a platform grouping as a universe | Resolves the grouping's **current** membership. Deduplicated per organization and grouping: an existing derived row has its membership refreshed but **never its name**. These rows are **hidden from this registry** |
| `POST /data_clusters/{id}/duplicate` | the **Duplicate** row action | Copies description, tickers and members; allocates `"<name> (copy)"` with numeric suffixes on collision; responds `201 Created` |

All three consume a quota slot.

## Execution modes

### Asset groups have no execution mode

Across the [registries](/docs/registries), an execution mode says **where the code runs**:

- **Internal** — you write Python inside Fintela against a deterministic function signature, and the platform compiles and runs it on its own infrastructure.
- **External** — you host the logic yourself, in any language, on your own infrastructure, so it can reach private data Fintela never sees.

**Neither applies to asset groups.** An asset group carries no code, so there is nothing to compile, nothing to pin as a validated snapshot, and no endpoint to call. The object has no `execution_type` field at any layer, the registry has no Internal/External filter or column, and the editor has no compile step — the save path described above is its whole lifecycle. There is no way to "bring your own" universe by pointing Fintela at a service you host: the membership is a list of platform instrument ids plus your own portfolio-group ids, and both must already exist in the platform.

For the same reason, per-resource visibility does not exist here. Visibility was rescoped to code resources only, and a trigger forces organization visibility on every asset-group write.

### Where Internal and External do apply

The execution-mode split belongs to the code registries. If you are looking for it, these are the pages:

| Registry | Where to read about its modes |
|---|---|
| Strategies | [Strategies](/docs/strategies), [External strategies](/docs/external-strategies) |
| Fitness functions | [Fitness functions](/docs/fitness-functions), [External fitness](/docs/external-fitness) |
| Risk managers | [Risk managers](/docs/risk-managers) |
| The concept itself | [Execution modes](/docs/execution-modes) |

An external strategy still needs an asset group for its universe. The universe is supplied by the platform either way — external execution changes where your *logic* runs, not where the instrument list comes from.

### The two axes that resemble a mode

Two choices in the builder can look like a mode and are not:

| Axis | Values | What it actually controls |
|---|---|---|
| Membership kind | tickers, portfolio-group curves, or both | what series the price panel contains. A members-only group is legal and is the portfolio-of-portfolios case |
| Discovery exchange | **US**, **Crypto**, **Forex** | which market the screener searches. It **scopes discovery, not the saved set** — changing it never touches your selection, and a single group can legitimately span several markets |

### Programmatic access

| Method | Path | Permission | Quota |
|---|---|---|---|
| `GET` | `/data_clusters` | `data_cluster:read` | — |
| `POST` | `/data_clusters` | `data_cluster:create` | +1 |
| `PUT` | `/data_clusters` | `data_cluster:update` | — |
| `DELETE` | `/data_clusters` | `root:all` | — |
| `GET` | `/data_clusters/metadata` | `data_cluster:read` | — |
| `GET` | `/data_clusters/basket_holdings_tickers` | `data_cluster:read` | — |
| `POST` | `/data_clusters/from_study` | `data_cluster:create` | +1 |
| `POST` | `/data_clusters/from_grouping` | `data_cluster:create` | +1 |
| `POST` | `/data_clusters/{id}/duplicate` | `data_cluster:create` | +1 |
| `GET` | `/data_clusters/{id}/last_date` | `data_cluster:read` | — |
| `GET` | `/data_clusters/{id}/date_coverage` | `data_cluster:read` | — |
| `GET` | `/data_clusters/{id}/meta-quality` | `data_cluster:read` | — |

`GET /data_clusters` accepts one query parameter, `created_by`, and **only the value `me`** (matched case-insensitively); anything else is rejected with 400 and the message `` `created_by` only accepts the value `me` ``. `GET /data_clusters/metadata` takes `data_cluster_ids` as a comma-separated list.

The public Developer API exposes exactly one read-only endpoint:

```http
GET /v1/data_clusters
Authorization: Bearer <api-key>
```

It returns `id`, `name`, `description`, `ticker_count` and `created_at` per group, newest first, scoped to your organization. Authentication is header-only — there is no `?api_key=` form. There is **no create, update or delete** for asset groups on the Developer API, and unlike the in-app list this one **does not hide grouping-derived rows**. See [Asset Groups API](/docs/api-asset-groups) and [API authentication](/docs/api-authentication).
