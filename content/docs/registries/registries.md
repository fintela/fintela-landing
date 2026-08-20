---
title: Registries
section: Registries
sectionOrder: 3
order: 1
published: true
updated: 2026-08-20
summary: The seven registries that hold every building block of a Fintela study, and the patterns they share.
keywords: registry, registries, building blocks, table view, wizard, versions, execution modes, internal, external
---

A registry is a named, org-scoped catalogue of one kind of building block. Everything you assemble in Fintela — the universe you trade, the code that produces a signal, the objective you optimize, the campaign that runs it, the guard rails around it, the portfolios you keep and the books you group them into — lives in one of seven registries. They are not seven bespoke screens: five of them render through a single shared frame, and all seven share the same row-click gesture, the same URL-backed filters, the same confirmation dialogs and the same delete-blocked-while-referenced rule. This page documents what they hold, where they sit in the sidebar, and every convention the individual pages therefore do not repeat.

## The seven registries

| Registry | Route | What it holds | What consumes it |
|---|---|---|---|
| [Asset Groups](/docs/asset-groups) | `/asset-groups` | A frozen list of instruments — ticker ids plus, optionally, whole portfolio groups injected as `BASKET:<uuid>` pseudo-tickers | A study binds one as its strategy universe and optionally a second as its fitness universe |
| [Strategies](/docs/strategies) | `/strategy` | The Python function or HTTP endpoint that produces a signal — rebalancing date → ticker → position and allocation | Studies bind exactly one; the strategy sandbox runs one ad hoc |
| [Studies](/docs/studies) | `/studies` | One optimization campaign: a strategy, a fitness function, an asset group, a parameter search space, a date window, a sampler and a trial budget | Running it produces trials, which materialize as portfolios you analyse in [Portfolios](/docs/portfolios-dashboard) |
| [Fitness Functions](/docs/fitness-functions) | `/fitness` | The objective a study optimizes — one simulated period reduced to a single finite number | Studies bind exactly one; a fitness function can also be promoted to a portfolio metric |
| [Risk Managers](/docs/risk-managers) | `/risk-managers` | Governance modules that run on every simulated bar before the strategy's rebalance | Attached to a study, where the optimizer can also tune their thresholds |
| [Portfolio Groups](/docs/portfolio-groups) | `/analysis/portfolio-groups` | A container of promoted portfolios plus one shared trading configuration — allocation recipe, rebalance cadence, execution policy | [Portfolio Manager](/docs/portfolio-manager) monitors them; broker operations deploy them; an asset group can inject one's equity curve |
| [Promoted Portfolios](/docs/promoted-portfolios) | `/promoted-portfolios` | A frozen, study-independent snapshot of one promoted trial | Portfolio Group membership is chosen entirely from this registry |

> [!NOTE] Two names for the same object
> Asset Groups are `data_clusters` everywhere below the UI — the API path, the DB table and the `data_clusters` quota key all still say it, and `/dataCluster/*` redirects here. Portfolio Groups are `baskets` in the same way: `/portfolio_manager/baskets` on the backend, `/v2/baskets` on the developer API, and the SPA URL itself keeps the segment in `/analysis/portfolio-groups/baskets/:basketId`.

## Where they sit in the sidebar

The sidebar has two visible sections — `Analysis` and `Registry` — plus a **More Options** flyout that opens to the right of the rail. Four registries sit in the Registry section; the other three live in the flyout. The route stays mounted either way, so a deep link works whether or not the entry is visible.

```text
Analysis
  Home                  /analysis
  Portfolios            /analysis/portfolios
  Portfolio Manager     /analysis/portfolio-manager
  Markets               /analysis/markets            (locked on the free tier)

Registry
  Asset Groups          /asset-groups
  Strategies            /strategy
  Studies               /studies
  Portfolio Groups      /analysis/portfolio-groups

More Options ▸
  Fitness Functions     /fitness
  Risk Managers         /risk-managers
  Promoted Portfolios   /promoted-portfolios
  Data Explorer         /analysis/data-explorer      (locked on the free tier)
  Laboratory            /laboratory                  (locked on the free tier)
  Fintelligent          /ai/fintelai                 (role-gated)
```

Entries in the Registry section are ordered by the feature's declared `navigation.order`; entries inside **More Options** render in a fixed array order, which is why Fitness Functions comes first there rather than by number. Fintelligent is the only flyout entry that can be missing entirely — it requires the `fintela-ai:read` or `root:all` client role. See [Navigation](/docs/navigation) for the rest of the shell.

None of the seven registry routes carries a free-tier lock, so no registry is ever blurred out. What the free tier limits is how many rows you may create — see [Free-tier quotas](#free-tier-quotas).

> [!NOTE]
> The Asset Groups sidebar entry reads **Asset Groups**, but the page's own `h1` is **Asset groups**. Both strings ship; neither is a typo you need to work around.

## What every registry page shares

### Two frames, one contract

Asset Groups, Strategies, Studies, Fitness Functions and Risk Managers render through one shared component, `RegistryWorkbench`. It is a fixed-height flex column with `overflow: hidden`, so **the page itself never scrolls** — the table's own container is the only scroll region on the route, and a registry with three rows renders a three-row box rather than a tall empty one.

Portfolio Groups and Promoted Portfolios use the older `RegistryToolbarHeader` frame: a sticky header over a normally-scrolling page. They share the row-actions pop-up, the filter panel, the column chooser and the view toggle, but not the search field, the URL-backed sort, the selection checkboxes, the Insights band or the relations expander. Every such gap is listed under [Where the registries differ](#where-the-registries-differ).

### The command bar

The workbench's single control row, left to right:

| Control | Exact string | What it does |
|---|---|---|
| Title | the registry name, as the page `h1` | — |
| Search field | placeholder varies per registry | Free-text match, written straight through to `?q=` |
| Clear search | `Clear` (aria-label) | Appears only while the field has text |
| Filter | `Filter`, with a badge counting active filters | Opens the shared filter panel |
| Column chooser | `Choose columns` (tooltip), `Choose visible columns` (aria-label) | Disabled unless the list view is showing |
| View toggle | `List view` / `Card view`, group label `View mode` | Icon-only segmented control |
| Documentation | `View documentation` | Opens a contextual docs drawer on the right |
| Refresh | `Refresh` | Refetches the registry |
| Quota meter | `used/limit` plus a bar | Free tier only; hidden for an activated organization |
| Create | see below | Primary contained button |

Search placeholders and create labels, verbatim:

| Registry | Search placeholder | Create button |
|---|---|---|
| Asset Groups | `Search groups or symbols…` | `New Asset Group` |
| Strategies | `Search strategies…` | `New Strategy` |
| Studies | `Search studies…` | `New Study` |
| Fitness Functions | `Search fitness functions…` | `New Fitness` |
| Risk Managers | `Search risk managers…` | `New Risk Manager` |
| Portfolio Groups | no search field | `Create Portfolio Group` |
| Promoted Portfolios | no search field | `Promote portfolios` |

`Promote portfolios` is not a create action — promotion happens on the Portfolios dashboard, so the button navigates to `/analysis/portfolios`. Promoted Portfolios has no create, no edit and no duplicate at all.

When a free-tier quota is full the create button stays **enabled and primary-coloured**. Clicking it opens the purchase dialog instead of the create flow, so you find out before filling in a form rather than after.

`View documentation` appears on Asset Groups, Strategies, Studies and Fitness Functions. Risk Managers has no help button on the registry — its reference dialog lives inside the editor. Portfolio Groups and Promoted Portfolios ship the slot but pass nothing into it, so no help button renders.

### Search, filters and sort

The rule the registries follow is: **what changes which rows you see, or their order, goes in the URL; what changes how they look stays local.**

| State | Where it lives | Notes |
|---|---|---|
| Free-text search | `?q=<text>` | Case-insensitive substring over a per-registry text blob (typically name, description and author). Written on every keystroke with `replace`, so it never floods history |
| Filters | one `f_<column key>` param per active field | Six field kinds: text, select, multiselect, dateRange, boolean, numberRange |
| Sort | `?sort=<column key>:<asc\|desc>` | Dropped from the URL when it equals the default |
| Column visibility | in-memory, per visit | Deliberately not in the URL — a link reproduces the same rows in the same order, and the recipient keeps their own columns. It is not persisted either, so it resets when you leave the route |
| List / card view | `localStorage` | Per registry, so a preference on one never bleeds into another |

Filtering and searching run entirely client-side over the already-loaded rows, so both views are fed the same filtered set and cannot disagree. Only `f_*`, `q` and `sort` are ever touched, so unrelated params on the same route (`?mode=create`, `?studyId=…`) survive.

The filter panel is the **only** filter surface. Every registry turns off the table's own per-column header funnels, because two controls with the same icon and disagreeing counts — one of them invisible to the URL — is what made the old surface confusing. Filter panel strings: `Filters`, `Clear all`, `Clear`, `Any`, `Yes`, `No`, `From`, `To`, `Min`, `Max`, `Contains…`, `{{count}} active`, `No filters available`.

Every registry opens sorted by **Created At, descending**. That column is present on all seven. It carries no header funnel of its own — a timestamp yields one distinct value per row — but the filter panel does expose it, as a date range.

### Columns, list view and card view

The list view is a fixed-layout table with sortable headers; the card view is a mosaic of the same rows built from the same column definitions, so the two can never render different data. The toggle is icon-only, labelled `List view` and `Card view`.

Default visible columns, with everything else reachable through the chooser:

| Registry | Columns shown on first load |
|---|---|
| Asset Groups | Name, Description, Author, Created At |
| Strategies | Name, Description, Execution Type, Author, Created At |
| Fitness Functions | Name, Description, Execution Type, Author, Created At |
| Risk Managers | Name, Description, Execution Type, Author, Created At |
| Studies | Name, Strategy, Health, Progress, Status, Author |
| Portfolio Groups | Group name, Description, Portfolios, Total AUM, Created |
| Promoted Portfolios | Name, Strategy, Author, Study, CAGR, Sharpe, Max drawdown, Status, Date promoted |

When filters hide every row the table says `No rows match the active filters.` with a `Clear all filters` button. When there is genuinely nothing there, each registry supplies its own empty state — for example `No strategies yet` / `Create your first strategy to start building portfolios.`

Under the `registryGeneratedDescriptions` flag (on by default) the Description cell shows a sentence generated from the row's own fields and moves any stored text into the tooltip. It applies to Strategies, Fitness Functions, Asset Groups, Risk Managers and Portfolio Groups. `?ff_registryGeneratedDescriptions=0` restores the stored text; nothing is written to the database either way.

### Opening a row

**No cell in a registry is a link.** Clicking a row — or pressing Enter or Space with the row focused — opens a small actions pop-up anchored to it, and the `View` item inside is what navigates. The capability to make a name cell a link is deliberately not wired, so a registry cannot reintroduce one by accident.

The pop-up carries the row's name as its header, renders navigation items as real anchors (so Cmd-click and middle-click still open a new tab), cycles with Arrow Up / Arrow Down, and closes on Escape or a click away. Below the `md` breakpoint it becomes a bottom sheet instead. A disabled item keeps a tooltip explaining why.

Right-clicking a row opens the same action list as a context menu — on the five workbench registries only.

| Registry | Row actions, in order |
|---|---|
| Asset Groups | `View` · `Edit` · `Duplicate` · `Copy ticker codes` · `Delete` |
| Strategies | `Run a backtest` · `View` · `Edit` · `Duplicate` · `Delete` |
| Studies | `Launch` · `View` · `Edit` · `Duplicate` · `Delete` |
| Fitness Functions | `Run a backtest` · `View` · `Edit` · `Duplicate` · `Promote to metric` · `Delete` |
| Risk Managers | `View` · `Edit` · `Duplicate` · `Attach` · `Version history` · `Delete` |
| Portfolio Groups | `Edit structure` · `Deploy Portfolio Group` · `View` · `Duplicate` · `Delete` |
| Promoted Portfolios | `View in Portfolio Analysis` · `Delete` |

Where `View` and `Edit` go:

- Asset Groups, Strategies, Fitness Functions and Risk Managers open `/<registry>/view/:id` and `/<registry>/edit/:id`.
- Studies `View` opens `/analysis/portfolios?studyId=<id>` — the study's ranked portfolios, which is what anyone wants after a launch. `Edit` opens `/studies/edit/:id`.
- Portfolio Groups `View` opens the group's page in Portfolio Manager; `Edit structure` opens its structure page.
- Promoted Portfolios `View in Portfolio Analysis` opens the source trial. If the source study was deleted the item is disabled with the tooltip `The source study was deleted, so there is no portfolio page to open.`
- On Fitness Functions, `Promote to metric` becomes `Edit metric` once promoted, and a `Remove metric` item appears beside it.

**Edit and Delete are blocked while a resource is referenced.** On Strategies, Fitness Functions, Asset Groups and Risk Managers the tooltip is `This item is currently used in a study and cannot be edited.` On Promoted Portfolios, Delete is blocked while any portfolio group holds the portfolio, naming the groups in the tooltip. On Studies the block is different: only a never-launched study is editable or launchable, with `Study has already been launched and is immutable.` and `Study has already been launched.`

Deleting always goes through the same confirmation dialog — title `Confirm Action`, buttons `Cancel` and `Confirm` — carrying the registry's own message. For example:

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
> There is no undelete and no archive anywhere in the registries. Delete is also the only lifecycle write Promoted Portfolios supports — there is no unpromote.

### Selecting rows and bulk actions

The five workbench registries carry a checkbox column and a footer strip. With nothing selected the strip shows registry aggregates; the moment anything is checked it becomes an action bar reading `{{count}} selected` with a `Clear selection` button. **The only bulk action any registry ships is `Delete`**, and it opens the same confirmation dialog as the single-row delete.

The selection survives a filter change (it is tracked against the full row set, not the visible one) and drops ids whose rows no longer exist, so the count stays honest after a bulk delete.

Portfolio Groups and Promoted Portfolios have no row selection and no bulk actions.

### Insights and linked resources

The five workbench registries render a permanent full-width **Insights** band above the table. It summarises the rows currently visible — distributions, rankings, dependent-study counts — and repositions that summary around whichever row you last clicked. It cannot be collapsed or hidden. Section labels come from a shared set: `Overview`, `By type`, `Dependent studies`, `Quality`, `Graduated portfolios`, with `Selected` marking the focused row.

Those same five registries put a chevron to the left of each row's checkbox. Expanding it draws a **semantic map** of what that resource is wired to across the other registries, with lanes for `Studies`, `Strategies`, `Fitness`, `Asset Groups` and `Risk Managers` and a legend distinguishing `Direct link` from `Linked through a study`. The panel's data is one batched read for the whole registry, deferred until the first expansion, so a user who never expands pays nothing. Controls read `Show details` / `Hide details`; failures read `Couldn't load related resources.` and an unconnected resource reads `No linked resources yet.`

Expansion state is deliberately **not** in the URL — unlike search, filters and sort it changes nothing about which rows you see. The card view has no row to expand under, so the map is list-view only.

### Creating from a registry

Every registry's create flow starts from its own page, and — apart from Portfolio Groups — it is an in-page screen rather than a separate URL. Strategies, Fitness Functions, Asset Groups and Studies also accept `?mode=create` on the registry route as a deep link straight into the empty editor; Risk Managers does not.

Portfolio Groups is the exception in the other direction: its wizard has real routes, `/analysis/portfolio-groups/groups/create` and `/analysis/portfolio-groups/groups/:groupId/edit`.

Four of the editors end in the same commit dialog — title `Confirm Action`, fields `Name` and `Description`, and, on a name collision, `Already in use — it will be saved as “{name}”` plus a `Suggest another name` action. Strategies, Fitness Functions, Risk Managers and Asset Groups all name at commit, not at the start; the Portfolio Groups wizard reuses the same dialog. Studies is the odd one out: its builder ends in a `Confirm your study` dialog that summarises the pipeline and its token cost, and owns both writes — `Save Draft` and `Save & Launch`.

> [!TIP]
> Calling these flows "wizards" is only accurate for Portfolio Groups. Strategies, Fitness Functions, Risk Managers and Asset Groups use a single-screen editor with collapsible sections, and Studies uses a single-screen pipeline canvas, not a stepper.

### Workspace scope

The workspace switcher in the sidebar footer narrows five registries — Asset Groups, Strategies, Studies, Fitness Functions and Risk Managers — to rows you created, by sending `created_by=me` server-side. Portfolio Groups and Promoted Portfolios are not filtered by it and always show the whole organization.

### Fintelligent can drive them

The same five registries subscribe to the agent's CRUD actions, so [Fintelligent](/docs/fintelligent) can open a create form, an editor or a duplicate on Asset Groups, Strategies, Studies, Fitness Functions and Risk Managers. Portfolio Groups and Promoted Portfolios do not subscribe. Note that **there is no delete action in the command interface**, for the agent or for the keyboard palette — it was excluded by design.

## Version history

Three registries keep an append-only version log: **Strategies, Fitness Functions and Risk Managers**. Every save appends `v(N+1)` capturing the post-write state — name, execution type, execution details, parameters, data-source config and, where it exists, the code and lookback function. The newest version always mirrors the live row.

The log surfaces as a collapsed **Version History** section in the editor (edit mode only), listing versions newest-first with the current one chipped `Current`. Selecting a code-bearing version shows a read-only diff against what is currently in the editor, plus a `Restore v<N>` action (disabled on the current version). On Risk Managers it is also reachable directly from the row action `Version history`.

> [!IMPORTANT]
> `Restore` never writes to the server. It loads the historical code back into the editor as an unsaved change, which you review and save normally — appending yet another version. A launched study keeps running against the version it started with, because launching pins the exact `strategy_version_id` and `fitness_version_id`. Editing a strategy therefore cannot rewrite a result you already have.

Restore is offered only where the version carries code, so an external or built-in resource lists its versions but cannot restore one. Asset Groups, Studies, Portfolio Groups and Promoted Portfolios have no version history at all — the empty state a code registry shows before its first save reads `No version history yet. Saving an edit records a new version.`

## Visibility and sharing

**There is no share action and no public catalogue in any registry today.** Every row you can see, everyone in your organization can see.

There is no per-resource visibility setting to look for, in the UI or beneath it. An earlier model gave every registry row a visibility of private, organization or shared, with per-user grants beside it; it was removed wholesale — the column, its triggers, its indexes and the grant tables were all dropped. The organization is the only boundary left. Authorship survives as an attribution column, and as what the workspace switcher narrows on, but it is no longer a read permission.

> [!WARNING]
> A cross-organization risk-manager catalogue with a `Fork` action exists in the source tree and is imported by nothing — it is not reachable from any screen. The only public catalogue that ships is the [Laboratory](/docs/laboratory)'s, which is a different surface.

## Execution modes

An execution mode is a property of the *code-bearing* registries. It answers one question: does Fintela run your logic, or does Fintela call yours?

- **Internal** — you write Python against a fixed, deterministic function signature. The platform imports it, executes it in a sandboxed runtime with a pinned library set, and validates it before it will accept the save.
- **External** — you host an HTTP endpoint in any language on your own infrastructure. Fintela POSTs to it per trial or per bar. Your code, your data and your dependencies never leave your servers; only the request and the response cross the boundary.

### Where External applies

| Registry | Execution modes it actually supports |
|---|---|
| [Strategies](/docs/strategies) | `Internal` and `External`. Both are live |
| [Fitness Functions](/docs/fitness-functions) | `Internal`, `External`, and `Built-in` — platform-seeded objectives that are read-only and cannot be created, edited, duplicated, deleted or sandboxed |
| [Risk Managers](/docs/risk-managers) | `Built-in`, `Rule-based`, `Internal` and `External` — all four persist |
| [Studies](/docs/studies) | No mode of its own. It inherits whatever the strategy and fitness function it binds are, and pairing an internal one with an external one is normal |
| [Asset Groups](/docs/asset-groups) | **None.** An asset group has no execution type, no code and no compile step |
| [Portfolio Groups](/docs/portfolio-groups) | **None.** It is configuration — allocation, cadence, execution policy — not executed user code |
| [Promoted Portfolios](/docs/promoted-portfolios) | **None.** A promoted portfolio is a frozen snapshot, not a program |

Two further limits worth stating plainly:

- **Rule-based (declarative) is live only for Risk Managers.** Strategies and Fitness Functions accept the value on the wire so the editor can show the modality, but the server refuses to persist it: `Rule-based (declarative) strategies are not supported yet.` and `Rule-based (declarative) fitness functions are not supported yet.` Do not plan around it.
- **Built-in risk managers never appear in the Risk Managers registry.** The list drops every row whose kind is `builtin`. You pick a built-in when you *attach* a risk manager to a study — that step offers the whole built-in catalogue next to your registered ones; `/risk-managers` is where you author the custom kinds.

For the full contracts see [Execution modes](/docs/execution-modes), [External strategies](/docs/external-strategies) and [External fitness](/docs/external-fitness).

### Rules every external endpoint must satisfy

Strategies, Fitness Functions and Risk Managers all screen a saved endpoint through the same validator, and a rejection surfaces as HTTP 406 with the message verbatim:

| Rule | Rejection message |
|---|---|
| No whitespace or control characters | `EXTERNAL endpoint must not contain whitespace or control characters` |
| Must parse as a URL | `EXTERNAL endpoint is not a valid URL (<reason>): '<value>'` |
| Scheme must be `http` or `https` | `EXTERNAL endpoint must use http:// or https:// (got '<scheme>').` |
| A host must be present | `EXTERNAL endpoint must include a host` |
| The host must not be loopback | `EXTERNAL endpoint host must not be loopback/localhost` |
| A literal IP must be publicly routable | rejected by the SSRF screen |

`http://` is accepted — TLS is not the control here, the host screen is. There is no port allowlist. **Fintela sends no credential to your endpoint** and never follows a redirect, so anything your endpoint needs to authenticate must be carried in the URL you register.

## Free-tier quotas

Registry limits are creation-only. Nothing consults a limit on read, update, delete or stop, so a lock can never trap you inside a live position or take away what you already built.

| Registry | Quota key | Label in dialogs | Current default cap |
|---|---|---|---|
| Strategies | `strategies` | `strategies` | 2 |
| Studies | `studies` | `studies` | 2 |
| Fitness Functions | `fitness` | `fitness functions` | 2 |
| Asset Groups | `data_clusters` | `asset groups` | 2 |
| Risk Managers | `risk_managers` | `risk managers` | 2 |
| Portfolio Groups | `baskets` | `portfolio groups` | 1 |
| Promoted Portfolios | `managed_portfolios` | `promoted portfolios` | 5 |

> [!WARNING] These numbers are a live setting, not a constant
> The caps are one global database row, recalibrated by an update with a 60-second fleet-wide cache and no deploy. Read the meter in your own command bar rather than this table. An activated organization sees no meter at all, because its limits are unlimited.

Only Strategies, Studies, Fitness Functions and Asset Groups render the `used/limit` meter in the command bar. Risk Managers shows an organization headroom bar in the footer strip instead, split `Total` / `Internal` / `Declarative` / `External`. Portfolio Groups and Promoted Portfolios show neither, though their quotas are enforced server-side.

Hitting a cap raises the same dialog everywhere: title `You've reached your plan limit`, then `Your plan includes {{limit}} {{resource}} and you already have {{used}}.`, `Your existing {{resource}} keep working normally.` and `You can also delete one to make room.` See [Tokens and billing](/docs/tokens-and-billing).

## Where the registries differ

Everything above is true of every registry unless this table says otherwise.

| Capability | Asset Groups · Strategies · Studies · Fitness · Risk Managers | Portfolio Groups | Promoted Portfolios |
|---|---|---|---|
| Free-text `?q=` search field | yes | no | no |
| Filter panel with `f_*` params | yes | yes | yes |
| Sort shareable via `?sort=` | yes | no — sort is local to the table | no — sort is local to the table |
| Row checkboxes and bulk delete | yes | no | no |
| Insights band | yes | no | no |
| Expandable relations map | yes | no | no |
| Right-click context menu | yes | no | no |
| Page never scrolls | yes | no — sticky header, scrolling page | no — sticky header, scrolling page |
| Default view on first visit | list | list | cards |
| `?mode=create` deep link | all but Risk Managers | no — the wizard has its own routes | not applicable, no create |
| Narrowed by the workspace switcher | yes | no | no |
| Driveable by Fintelligent | yes | no | no |
| Version history | Strategies, Fitness, Risk Managers only | no | no |
| Execution modes | Strategies, Fitness, Risk Managers only | none | none |

Three more single-registry facts that catch people out:

- **Studies rows become immutable on launch.** `Edit` and `Launch` are both gated on the live status being `SAVED`, checked against the polling status feed rather than the cached metadata, so a study that started a minute ago is already locked.
- **Risk Managers hides the built-in catalogue.** The ten built-in rules exist and are attachable, but the registry lists only the custom kinds you authored.
- **Promoted Portfolios has no detail page.** `/promoted-portfolios/view/:id` is a resolver, not a screen: it looks up the source trial and redirects to Portfolio Analysis, falling back to the list if the lineage is gone.

Start with [Asset Groups](/docs/asset-groups), which every study needs first, or read [Core concepts](/docs/core-concepts) for how the seven objects fit together.
