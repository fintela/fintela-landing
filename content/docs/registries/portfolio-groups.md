---
title: Portfolio Groups
section: Registries
sectionOrder: 3
order: 7
published: true
updated: 2026-08-18
summary: Group promoted portfolios into a book you can analyze, allocate across, and trade.
keywords: portfolio group, basket, allocation, weights, members, operation, orders, trading, paper, live, deploy, eod report
---

A Portfolio Group is a named, organization-scoped container that holds a set of [promoted portfolios](/docs/promoted-portfolios) plus one shared trading configuration. It answers three questions about a book of strategies: how is it weighted, how often is it re-weighted, and how do its orders reach a broker. The registry at `/analysis/portfolio-groups` is the administrative half — which groups exist, what they hold, and how they are configured. Performance and monitoring live in the [Portfolio Manager](/docs/portfolio-manager) hub, one click away from every row.

## Overview and purpose

### Portfolio Group and "basket" are one object

**"Portfolio Group" is the product noun. "basket" is the persistence and API noun.** They are the same row in the same table. Nothing translates between them at runtime — the frontend simply labels a `basket` as a Portfolio Group. This matters the moment you read a URL, an API path or a database column, so the full mapping is below.

| Layer | Identifier in use |
|---|---|
| UI label, nav entry, registry route | **Portfolio Groups**, `/analysis/portfolio-groups` |
| SPA structure page | `/analysis/portfolio-groups/baskets/:basketId` |
| Feature key | `portfolio-groups-analysis` |
| Backend HTTP paths | `/portfolio_manager/baskets`, `/portfolio_manager/baskets/:id`, … |
| Developer API | `GET /v2/baskets` |
| Database table | `developers.portfolio_manager_baskets` |
| Membership table | `developers.basket_members` |
| Deployment table | `developers.basket_operations` |
| Entitlement quota key | `baskets` |
| Activity-feed events | `basket.created`, `basket.updated`, `basket.deleted` |

The word `baskets` in the SPA path is deliberate and load-bearing: bookmarks, notification deep links and the activity feed all point at `/analysis/portfolio-groups/baskets/:basketId`.

> [!NOTE]
> A Portfolio Group does not *contain* baskets. There is no such nesting. The only hierarchy is Portfolio Group (= basket) → **members** → **operations**.

### Group, members, operations

```text
  Promoted Portfolios (managed portfolios)
            │  selected in the creation form
            ▼
  ┌───────────────────────────────────────────────┐
  │  PORTFOLIO GROUP  (= basket, one UUID)        │
  │    members         → basket_members           │
  │    allocation recipe + rebalance cadence      │
  │    execution + protective policy              │
  │    staged backtest track record               │
  └───────────────────────────────────────────────┘
            │  one deployment per broker connection
            ▼
  OPERATION  (basket_operations)
     ├─ allocations   weight snapshots per rebalance
     ├─ orders        what was sent to the broker
     ├─ state log     who did what, and when
     └─ EOD reports   end-of-day reconciliation
```

- **Members** are managed portfolios, referenced by `managed_portfolio_id`. They are independent, frozen copies of a study trial that keep updating on the group's cadence even if you delete the study. The structure page states this outright: *"Portfolio Group members are managed portfolios (MP) — independent, frozen copies of a study trial that keep updating on the portfolio group's cadence even if you delete the study."*
- **Operations** are deployments. One operation is one group running against one broker connection, with its own capital, its own status and its own rebalance clock. `UNIQUE (basket_id, connection_id)` means a group can have at most one operation per connection — and therefore can run paper and live at the same time, on two different connections.

### What a group carries

| Facet | Stored as | Set where |
|---|---|---|
| Membership | `portfolio_ids` (JSONB array of ints), mirrored into `basket_members` | Creation form, structure page, Rank & Build |
| Allocation recipe | `allocation_method` + `allocation_method_params` | Creation form, Trading Lab |
| Manual weights / risk budgets | `basket_members.weight`, `allocation_method_params.risk_budget` | Trading Lab only |
| Rebalance cadence | `rebalance_enabled` + `rebalance_frequency_days` (data-days) | Creation form, Trading Lab |
| Rebalance grid phase | `rebalance_anchor_date` (NULL reads as the creation date) | Trading Lab only |
| Daily member extension | `daily_update_enabled` | Locked on — see below |
| Order policy | `execution_config`, plus per-member overrides | Trading Lab, per-operation override at deploy |
| Protective exit | `protective_config`, plus per-member overrides | Trading Lab only |
| Stop re-entry policy | `reenter_after_stop`, `reentry_cooldown_days` | Trading Lab only |
| Benchmark | `benchmark_ticker_id` (NULL = platform default) | Trading Lab only |
| Track record | `basket_backtest_stages` (configuration epochs) | Written by the platform |
| Free text | `description` | Naming dialog; presentation only |

Two columns on the table are dead and are never documented as settings: `frequency` (a legacy every-N-days cadence, superseded by `daily_update_enabled`) and `membership_rule` (reserved, always NULL).

### Visibility and quota

A Portfolio Group is **permanently visible to the whole organization**. The access spec for `portfolio_manager_basket` scopes on `organization_id`, uses `deleted_at` for soft deletes, and sets `allow_platform_shared: false`. The reasoning is in the handler: the configuration — the allocation recipe and the member weights — is org-visible; member strategy *code* is protected at its own layer. A group outside your organization is a **404, never a 403**.

Creating a group consumes the `baskets` quota (`Quota::Baskets`), counted as the number of rows in `developers.portfolio_manager_baskets` for your organization with `deleted_at IS NULL`. The **free-tier default is `max_baskets = 1`** — a second create returns a structured HTTP 402 and the naming dialog hands off to the insufficient-tokens dialog rather than toasting an error.

### Screens and routes

| Path | Screen |
|---|---|
| `/analysis/portfolio-groups` | The registry — table or card view |
| `/analysis/portfolio-groups/rank` | Rank & Build workspace (rank trials, saved Views, promote) |
| `/analysis/portfolio-groups/rank/:viewId` | Rank & Build with a saved View applied |
| `/analysis/portfolio-groups/baskets/:basketId` | Structure page — members, freshness, trading configuration |
| `/analysis/portfolio-groups/groups/create` | Creation form |
| `/analysis/portfolio-groups/groups/:groupId/edit` | The same form in edit mode |
| `/analysis/portfolio-groups/:viewId` | Back-compat only — a legacy saved-View deep link, resolves to Rank & Build |

The screen is resolved from the path: anything containing `/rank` opens Rank & Build; a bare `:viewId` also opens Rank & Build for back-compatibility; everything else is the list.

Four query parameters are read by these screens:

| Parameter | Effect |
|---|---|
| `?returnTo=basket&basketId=<uuid>` | Rank & Build runs in "append to an existing group" mode. Emitted by the structure page's **"Browse & filter"** button |
| `?origin=…` | Sets the structure page's Back target. An origin under `/analysis/portfolio-manager` changes the button from **"Back"** to **"Back to portfolio"** |
| `?panel=schedule` / `?panel=allocation` | Force-expands and scrolls to that section of the creation form's right rail |
| `?ff_registryGeneratedDescriptions=0` | Turns off the generated Description column, falling back to stored free text |

### Legacy paths that redirect

The administrative pages used to live under `/analysis/portfolio-manager`, and that section itself used to be called "Deployed Portfolios". Both renames are covered by redirects.

| Legacy path | Redirects to |
|---|---|
| `/analysis/deployed-portfolios/*` | `/analysis/portfolio-manager/*` (base segment rewritten, query preserved) |
| `/analysis/portfolio-manager/rank` | `/analysis/portfolio-groups/rank` |
| `/analysis/portfolio-manager/rank/:viewId` | `/analysis/portfolio-groups/rank/:viewId` |
| `/analysis/portfolio-manager/baskets/:basketId` | `/analysis/portfolio-groups/baskets/:basketId` |
| `/analysis/portfolio-manager/groups/create` | `/analysis/portfolio-groups/groups/create` |
| `/analysis/portfolio-manager/groups/:groupId/edit` | `/analysis/portfolio-groups/groups/:groupId/edit` |

> [!WARNING]
> A bare `/analysis/portfolio-manager/:viewId` link — the old saved-View deep link — is **not recoverable**. That URL shape is now a basket id in the Portfolio Manager hub. Old saved-View links of that form will open the wrong screen or fail to resolve.

### What consumes a Portfolio Group

```text
  Portfolio Group ──┬─► Portfolio Manager       performance, metrics, holdings, trades
                    ├─► Operations              broker deployments (paper / live)
                    ├─► Asset Groups            injected as a BASKET:<uuid> curve
                    ├─► Trading Lab             re-simulate, reconfigure, re-weight
                    └─► Developer API           GET /v2/baskets (read-only)
```

- **[Portfolio Manager](/docs/portfolio-manager)** is the monitoring half. Every analytic a group has — equity, metrics, holdings, trades, robustness, ideas, news — lives there, at `/analysis/portfolio-manager/:basketId/<tab>`. The registry deliberately shows no returns, no P&L, no sparklines.
- **[Asset Groups](/docs/asset-groups)** can hold a Portfolio Group as a member: `developers.data_clusters.basket_members` stores `{"basket_id": <uuid>, "injection_mode": "curve"}`, and the group's stitched equity curve is injected into the price panel as a pseudo-ticker. That is the portfolio-of-portfolios case.
- **The [Developer API](/docs/api-baskets)** exposes a read-only projection at `/v2/baskets`.

## Registry table view

### Command bar

| Control | Exact text | Behaviour |
|---|---|---|
| Title | **Portfolio Groups** | — |
| Filter button | **Filter** | Opens the filter panel, titled **Filters**, with **Clear all**, **Any**, **Contains…**, **Min**/**Max**, **From**/**To** controls and an "{{count}} active" badge |
| View toggle | **List view** / **Card view** | Aria label **View mode**. The choice is remembered per registry |
| Column chooser | tooltip **Choose columns** | Disabled while Card view is active |
| Refresh | tooltip and aria **Refresh** | Invalidates the `portfolio_manager_baskets` query |
| Primary CTA | **Create Portfolio Group** | Navigates to `/analysis/portfolio-groups/groups/create` |

> [!NOTE]
> **There is no search box on this registry.** The shared toolbar renders no search field here. Text search happens through the filter panel's `name` and `description` fields.

### Columns

Rows are keyed by the basket `id`. The default sort is the shared registry default resolved against `created_at`.

| Column key | Header | Render | Sorts on | Default |
|---|---|---|---|---|
| `name` | **Group name** | Bold, no wrap; the full name is the hover title | `name` | Visible |
| `description` | **Description** | Secondary text, no wrap; generated sentence with the stored text in the tooltip | Generated text | Visible |
| `portfolios` | **Portfolios** | Right-aligned chip with the member count | `portfolio_ids.length` | Visible |
| `aum` | **Total AUM** | Right-aligned monospace currency; dimmed `—` when zero | Raw `deployed_capital` | Visible |
| `created_at` | **Created** | Shared created-at cell | Date | Visible |
| `allocation_method` | **Allocation** | The method's display label | Raw method id | Chooser |
| `cadence` | **Rebalance** | The cadence label | `rebalance_frequency_days`, or `-1` when static | Chooser |
| `daily_update` | **Daily update** | Centered chip, always reading **Daily update ON** | Not sortable | Chooser |
| `stage` | **Stage** | Outlined chip with the raw `stage` string | `stage` | Chooser |
| `strategies` | **Strategies involved** | Comma-joined distinct member strategy names | Count of distinct strategies | Chooser |
| `authors` | **Authors involved** | Comma-joined distinct author usernames | Count of distinct authors | Chooser |

**Total AUM** is a server-side aggregate, not an analytic. It is `COALESCE(SUM(target_capital), 0)` over that group's operations whose `last_status` is `ACTIVE` or `PAUSED`. Its tooltip says so:

- With capital committed: *"Capital committed in {{count}} active operation."* (plural: *"…{{count}} active operations."*)
- With none: *"No capital committed — this group has no active operations."*

`Strategies involved` and `Authors involved` are resolved against the Promoted Portfolios list. If that list has not loaded, both cells render an em dash rather than a wrong attribution.

> [!CAUTION]
> **Stage is not a lifecycle.** It is a ranking time-window label stored as a free `VARCHAR(50)` with no CHECK constraint. The server default is `'ytd'`; the creation form sends `'overall'`. There is no Status column and no draft/active/deployed badge anywhere in this registry — those strings exist in the translation bundle and in exported selectors, but no shipped surface renders them.

### The Description column

The cell is generated from the group's own configuration rather than from the free text you typed. The template is:

```text
Portfolio group configured with allocation methodology {method},
{n} member portfolios, rebalancing frequency {cadence}
```

The member clause is dropped entirely when the group has zero members — an empty group is a legal state, and "0 member portfolios" inside a configuration sentence is noise. The stored free text is not lost: it moves into the hover tooltip, prefixed with **Author's note**.

There is **no maximum-size field on a Portfolio Group** at any layer — no cap column, no create or update input, no wizard control. The sentence substitutes the observed member count and says "member portfolios", never "max".

Cadence labels resolve to **Every {{count}} data-day** / **Every {{count}} data-days**, or **Static** when rebalancing is off or the frequency is null. Allocation labels come from one shared mapping, so a method reads identically in the column, the description and the picker:

| Method id | Label |
|---|---|
| `equal_weight` | Equal weight |
| `manual` | Manual |
| `metric_proportional` | Metric-proportional |
| `metric_responsive` | Metric-responsive (momentum / contrarian) |
| `risk_parity` | Risk parity |
| `volatility_target` | Volatility target |
| `mean_reversion` | Mean reversion |

### Filters

The filter panel is URL-backed, so a filtered view survives a reload and can be shared as a link.

| Field | Kind |
|---|---|
| `name` | text |
| `description` | text |
| `portfolios` | numberRange |
| `aum` | numberRange |
| `allocation_method` | multiselect |
| `cadence` | multiselect |
| `stage` | multiselect |
| `created_at` | dateRange |

`strategies` and `authors` have **no filter spec on purpose**. Both are sets, and the panel matches a row on one exact string — a two-author group would only ever match the literal `"ana, luis"`, never `"ana"`, which looks like a working filter while quietly hiding rows.

Per-column funnel icons are switched off on this table. The header's Filter button is the single filter surface.

### Card view

A card renders the group's `name` as its title, the Description as its subtitle, and `portfolios`, `aum` and `created_at` as meta. Interactive columns — the Daily update chip and the actions button — are excluded, because a card is a single click target and a nested control would be invalid ARIA. Card actions are reached the same way as row actions: by clicking the card.

### Row action menu

Clicking a row (list) or a card (cards) opens a pop-up titled with the group's name. The actions, in order:

| Action | Exact label | What it does |
|---|---|---|
| 1 | **Edit structure** | Opens `/analysis/portfolio-groups/baskets/:id` — the structure page |
| 2 | **Deploy Portfolio Group** | Opens the deploy dialog for this one group. **Disabled** when the group has zero members, with the tooltip *"This group has no portfolios to allocate."* |
| 3 | **View** | A real `href` to `/analysis/portfolio-manager/:id/profile`, so open-in-new-tab works |
| 4 | **Duplicate** | Client-side copy — see below |
| 5 | **Delete** | Opens a confirmation dialog |

The delete confirmation reads: *Delete the portfolio group "{{name}}"?*

Success toasts:

| Action | Toast |
|---|---|
| Delete | **Portfolio Group deleted.** |
| Duplicate | **Duplicated as "{{name}}".** |
| Create (generic path) | **Portfolio Group created** |
| Update | **Portfolio Group updated** |

> [!NOTE]
> There is no multi-select and no bulk action bar on this registry. The deploy dialog is written to accept many groups, but the only shipped call site passes exactly one.

### Duplicate: what is and is not copied

Duplicate has **no backend endpoint**. It is a client-side composite: a `POST` that creates a copy named `<name> (copy)`, followed by a `PUT` that carries the trading configuration the create payload cannot express.

| Copied | Not copied |
|---|---|
| Name, as `<name> (copy)` | `description` |
| `portfolio_ids` | `execution_config` |
| `daily_update_enabled` | `protective_config` |
| `stage` | `benchmark_ticker_id` |
| `allocation_method` and `allocation_method_params` | `reenter_after_stop`, `reentry_cooldown_days` |
| `rebalance_enabled`, `rebalance_frequency_days` | Per-member execution and protective overrides |
| `member_weights`, when present | Unlocked premium allocation methods |

> [!WARNING]
> Premium allocation unlocks are keyed on `(basket_id, method)` and cascade away with the basket UUID. A duplicated group is a new UUID, so **a premium method is charged again** on the duplicate's first save.

### Delete: when it is refused

Delete is a **soft delete** — it stamps `deleted_at` and the row disappears from every listing. A background cleanup worker later purges baskets, operations and holdings in chunks.

The delete is **refused outright while any operation is `ACTIVE` or `PAUSED`**, with this message:

```text
This basket has live operations (ACTIVE or PAUSED). Stop them first — deleting it
would orphan open broker positions.
```

`STOPPED` and `DRAFT` operations do not block a delete. The reason for the guard is the schema: `basket_operations.basket_id` is `ON DELETE CASCADE`, so a hard delete would silently drop the record of positions still open at a broker.

On the structure page the same delete is offered through a dialog titled **Delete "{{name}}"?** with the body **This cannot be undone.** That dialog deliberately **stays open on failure**, because a failure is almost always this refusal and the message is the instruction.

### Empty states

| Situation | Copy |
|---|---|
| No groups at all | **No portfolio groups yet. Create one from your promoted portfolios.** plus a **Create Portfolio Group** button |
| List empty because the workspace filter is on "My" | Title **You haven't created any portfolio groups yet.**, body **Workspace filter is on — it is showing only yours. Your teammates' portfolio groups are still there.**, button **Show all portfolio groups** |

The table and the card grid both carry the aria-label **Portfolio groups**.

## Creation wizard and advanced options

### It is one screen, not a sequence of steps

The route is `/analysis/portfolio-groups/groups/create` and the component is named `CreatePortfolioGroupWizard`, but the shipped UI is **a single screen with a right-hand rail** — a centre working pane holding the portfolio picker, a rail of collapsible sections, and a pinned action row. There is no Next, no Back, no step indicator, no progress bar, and no review step.

| Element | Exact text |
|---|---|
| Page title | **Create Portfolio Group** (edit mode: **Edit Portfolio Group**) |
| Subtitle | **Assemble promoted portfolios into a group for consistent management.** |
| Top-right button | **Cancel** — returns to `/analysis/portfolio-groups` |
| Action row | **Cancel** and **Save** (**Saving…** while pending) |

One blocking alert can appear above the picker, rendered at `severity=warning`. Two conditions raise it — the first takes precedence — and either disables **Save**:

| Condition | Message |
|---|---|
| Zero members selected | **Select at least one promoted portfolio to continue.** |
| A premium allocation method is chosen and its unlock has not been confirmed | **Confirm the allocation method unlock to continue.** |

### Member selection

The centre pane is the **Promoted Portfolios picker**, mounted with inline filters. It reads `GET /portfolio_manager/managed/registry` — **exactly the [Promoted Portfolios](/docs/promoted-portfolios) registry**, using the same columns and the same filter specs, so a metric cannot render one way there and another here. Selection emits `managed_portfolio_id`s.

| Aspect | Detail |
|---|---|
| Columns shown | **Name**, **Strategy**, **CAGR**, **Sharpe**, **Max drawdown**, **Status** |
| Columns in the chooser | **Study**, **Author**, **Total return**, **Portfolio Groups**, **Daily updates**, **Data points**, **Date promoted** |
| Inline filter fields, in order | name, strategy, study, status |
| Everything else | Collapses behind **More Filters** |
| Filter state | URL-backed — a half-built group survives a reload |

The picker's table is wider than its slot and scrolls horizontally.

### Field reference

Everything the form collects, with its real default and its real validation:

| Field | Where | Type | Default | Validation / message |
|---|---|---|---|---|
| Members | Centre pane | Checkbox selection over promoted portfolios | Empty, or the ids passed in from Rank & Build | At least one required — **Select at least one promoted portfolio to continue.** |
| **Daily update** | Advanced → Schedule | Static chip reading **Daily update ON** | `true`, hardcoded | Not editable in this form |
| **Periodic rebalance** | Advanced → Schedule | Switch | Off | Turning it on seeds the days field with `30`; turning it off clears it |
| **Rebalance every (data-days)** | Advanced → Schedule | Number, shown only while the switch is on | `30` | `min=1`; the submitted value is clamped with `max(1, …)` |
| **Allocation method** | Advanced → Allocation | Select, grouped **Free** / **Premium (tokens)** | Equal weight | A premium method opens the unlock dialog and blocks Save until confirmed |
| Per-method parameters | Advanced → Allocation | Varies by method | Seeded per method — see the table below | Numeric minimums per control |
| **Name** | Naming dialog | Text, pre-filled with a suggested codename | A generated three-word codename | Required — **Give the group a name to continue.** |
| **Description** | Naming dialog | Text | Empty | Not required. Trimmed; all-whitespace is stored as NULL |

The **Daily update** helper text explains why it is locked on: *"When on, each portfolio in the group extends daily. Required before the group can be deployed."*

The **Periodic rebalance** helper switches on state:

| Switch | Helper |
|---|---|
| On | **Weights are recomputed on this data-day cadence once the group is deployed.** |
| Off | **Static: the group allocates once and holds until you change it.** |

> [!IMPORTANT]
> The cadence is in **data-days on the valuation calendar**, not calendar days. The field label says so literally. The grid's phase is the `rebalance_anchor_date`, which is frozen and defaults to the group's creation date; it is editable only in the Trading Lab.

### Advanced options panel

The right rail's first section is **Advanced options**, and it is **collapsed by default** — both of its subsections carry a working default, so neither is on the path you must walk to create a group. It is deliberately *not* lazily mounted: the allocation control is what reports the unlock blocker, and unmounting it while collapsed would silently clear the guard on Save.

| Subsection | Title | Contents |
|---|---|---|
| `schedule` | **Schedule** | The Daily update chip, the Periodic rebalance switch, the data-day field |
| `allocation` | **Allocation** | The method select and its parameter panel |

Both are addressable with `?panel=schedule` and `?panel=allocation`, which force-expand the parent group on the way in.

### Allocation methods

Seven methods exist, split into two option groups in the select. The database enforces the same seven in a CHECK constraint on `allocation_method`.

| Group label | Methods |
|---|---|
| **Free** | Equal weight, Manual |
| **Premium (tokens)** | Metric-proportional, Metric-responsive (momentum / contrarian), Risk parity, Volatility target, Mean reversion |

Each premium entry carries a padlock icon, or an **Unlocked** chip when that method has already been unlocked for that specific group.

### Per-method parameters

| Method | Controls | Seeded defaults |
|---|---|---|
| Equal weight | none | `{}` |
| Manual | none in this form — per-member weights are set in the Trading Lab | `{}` (params must be NULL server-side) |
| Metric-proportional | **Metric**, **Lookback (days)**, **Weights as-of** | `metric: sharpe_ratio`, `lookback_days: 90`, `risk_free_rate: 0`, `weight_as_of: grid` |
| Metric-responsive | **Metric**, **Lookback (days)**, **Direction**, **Transform**, **Tau (softmax temperature)** (softmax only), **Blend toward equal weight**, **Weights as-of** | `metric: total_return`, `lookback_days: 21`, `direction: momentum`, `transform: linear_clip`, `blend: 0.5`, `weight_as_of: grid` |
| Risk parity | **Covariance window (days)**, **Weights as-of** | `lookback_days: 90`, `weight_as_of: grid` |
| Volatility target | **Target volatility (annualized)**, **Lookback (days)**, **Base method**, **Max leverage**, **Weights as-of** | `target_volatility: 0.15`, `lookback_days: 63`, `base_method: inverse_vol`, `max_leverage: 1.0`, `weight_as_of: grid` |
| Mean reversion | none | `{}` — the caption reads *"Preset: overweights recent underperformers (contrarian, rank-based) — no parameters."* |

Enumerated option values:

| Control | Options |
|---|---|
| **Direction** | **Momentum (overweight winners)** (`momentum`) · **Mean reversion (overweight losers)** (`contrarian`) |
| **Transform** | **Linear clip** (`linear_clip`) · **Softmax** (`softmax`) · **Rank** (`rank`) |
| **Base method** | **Inverse volatility** (`inverse_vol`) · **Equal weight** (`equal_weight`) |
| **Weights as-of** | **Grid date (matches backtest)** (`grid`) · **Latest data** (`latest`) |

**Blend toward equal weight** is a slider from 0 to 1 in steps of 0.05. **Target volatility (annualized)** carries the helper **e.g. 0.15 = 15%**.

The **Metric** picker offers the canonical metric catalog, grouped by category: Return, Risk, Risk-Adjusted, Recovery, Distribution, Benchmark (vs SPY), Trade. The `optimizer` category is excluded — a fitness objective is not a per-asset metric. If the catalog request fails the picker falls back to a static 32-metric list, so it is never empty. Three legacy stored metric ids are normalized for display only (`sharpe` → `sharpe_ratio`, `sortino` → `sortino_ratio`, `cagr` → `compound_annual_growth_rate`); the engine accepts both spellings.

### Unlocking a premium method

Picking a premium method that is not already unlocked for this group opens a confirmation dialog before Save can proceed.

| Element | Text |
|---|---|
| Title | **Unlock {{method}}** |
| Body | **Unlocking this advanced method for this portfolio group is a one-time token charge. Once unlocked it stays free for this portfolio group. Tip: a very short lookback with daily rebalancing trades a lot — mind the costs.** |
| Figures | **Cost**: the token price · **Your balance**: your current balance |
| Insufficient balance | **Not enough tokens — buy more from your account to unlock.** |
| Buttons | **Cancel** (reverts the select to the previous method) · **Unlock on save** |

The price comes from `GET /portfolio_manager/baskets/:id/allocation-unlock/estimate?method=<m>`, which returns `{ method, paid, cost, already_unlocked, balance }`. Free methods report `paid: false, cost: 0`; an already-unlocked method reports `cost: 0, already_unlocked: true`.

The charge itself is applied **inside the same database transaction as the create or update**, with the ledger reason `advanced_allocation` and the group's id as the reference. Re-saving a method that is already unlocked is free, and re-saving a pre-existing premium configuration never retro-charges — only a genuine change *to* a premium method is billed. See [tokens and billing](/docs/tokens-and-billing).

### Selection preview

The rail's second section is **Selection preview**, and it is **expanded by default** — a summary that has to be opened is not a summary. Its collapsed summary line reads **Selected: {{n}}**.

| Element | Detail |
|---|---|
| Config read-back | Three rows labelled with the registry's own column names: **Allocation**, **Rebalance**, **Daily update** (value **On** / **Off**) |
| Member list | Headed **Selected portfolios** with a count chip and a **Clear all** chip |
| Empty state | **Portfolios you tick in the table land here, with the settings above applied to them.** |
| Each row | Member name (falling back to `#<id>` if it has left the promoted list), its strategy name or **Unknown strategy**, and a remove button with the tooltip **Remove from selection** |

The list caps at a fixed height and then scrolls, in selection order, newest at the bottom.

### Saving: the naming confirmation

**Save** does not write directly. It opens the shared naming dialog, which is the real commit step.

| Element | Text |
|---|---|
| Dialog title | **Confirm Action** |
| Message | **Name this portfolio group before saving it.** |
| Name field | **Name**, with an icon-button **Suggest another name** |
| Description field | **Description** — not required |
| Blank-name error | **Give the group a name to continue.** |
| Buttons | **Cancel** · **Confirm** |

Portfolio Groups are the only registry that offers name suggestions, because a group has nothing to derive a name from the way a strategy or a fitness function does. Suggestions are three-word mission codenames drawn from a generator that avoids names already in use — group names are **not unique** in the database, so this is a courtesy, not a constraint.

On confirmation the form sends `POST /portfolio_manager/baskets`:

```json
{
  "name": "Onyx Dubhe Compass",
  "description": null,
  "portfolio_ids": [4412, 4418, 4470],
  "daily_update_enabled": true,
  "stage": "overall",
  "allocation_method": "risk_parity",
  "allocation_method_params": { "lookback_days": 90, "weight_as_of": "grid" },
  "rebalance_enabled": true,
  "rebalance_frequency_days": 30
}
```

Notes on that payload, all of them verifiable in the request:

- `allocation_method` is omitted entirely when the method is `equal_weight`.
- `allocation_method_params` is sent as `null` for both `manual` and `equal_weight` — the database has a CHECK that refuses params on `manual`.
- `stage` is `'overall'`. The server's own default is `'ytd'`; this form overrides it.
- With rebalance off, the form sends `rebalance_enabled: false` and `rebalance_frequency_days: null` explicitly.

A successful save navigates to the new group's **structure page**, never to a deploy screen.

### Server-side validation

These messages come back verbatim as HTTP 400 (or 402 for the token case) and are surfaced in the dialog or as a toast.

| Condition | Message |
|---|---|
| Rebalance enabled without a cadence | `rebalance_frequency_days is required when rebalance_enabled is true` |
| `portfolio_ids` is not an array | `portfolio_ids must be a JSON array` |
| Non-integer member id | `portfolio_ids must contain integers, got {v}` |
| Member id out of range | `portfolio id {n} out of range` |
| Unknown id | `id {id} is neither a managed portfolio nor a promotable trial in this organization` |
| An EXTERNAL-strategy member | `portfolio {id} uses an EXTERNAL strategy ({execution_type}); it cannot daily-extend (managed mode supports INTERNAL only), so it cannot be in a tracked basket. Remove it from the basket.` |
| A meta-portfolio carrying a sector/country cap risk manager | `portfolio {id} has a sector_cap/country_cap risk manager and its parent study is a Mode-1 meta-strategy (portfolio-of-baskets); … Remove the sector_cap/country_cap attachment(s) before adding it. Other risk managers are fully supported on meta-portfolios.` |
| Manual weight out of range | `member weight {w} for portfolio {id} is out of range; each manual weight must be in (0, 1]` |
| Manual weights over 100% | `manual member weights sum to {sum}, which exceeds 1.0; reduce them so together they are at most 1.0 (100% of target capital)` |
| Params sent with `manual` | `allocation_method 'manual' does not take allocation_method_params (per-member weights are set separately); omit the params` |
| Invalid execution config | `invalid execution config: {reason}` |
| Not enough tokens for a premium method | `Insufficient tokens: this allocation method costs {required} but only {available} are available.` (structured 402) |

### Members can be submitted as trial ids

The ids you submit may **mix already-managed portfolio ids and raw trial ids**. The server resolves them: an id that is already a managed portfolio of your organization passes through after its snapshotted execution type is re-checked; anything else is treated as a trial id and **idempotently promoted** into a managed portfolio; anything that is neither is rejected. The result is sorted and deduplicated. This is exactly what the structure page's helper text means by *"A trial id is promoted to a managed portfolio on save."*

### What creation deliberately does not collect

> [!IMPORTANT]
> **Capital, broker account, paper vs live, execution policy, protective exits, benchmark, rebalance anchor and per-member weights are not part of creating a group.** Saving creates the group and stops there. It never launches anything.

| Setting | Where it is actually set |
|---|---|
| Capital, broker connection, paper vs live | The deploy dialog, or the Initiate-Tracking dialog on the Operations tab |
| Per-operation execution override | The Initiate-Tracking dialog |
| Execution policy, protective exit, benchmark, re-entry policy, rebalance anchor | The Trading Lab modal |
| Manual weights, risk budgets, per-member overrides | The Trading Lab modal |
| Membership, after creation | The structure page, or Rank & Build in append mode |

### Edit mode

`/analysis/portfolio-groups/groups/:groupId/edit` renders the same form with the draft hydrated from `GET /portfolio_manager/baskets/:id` and submits through `PUT /portfolio_manager/baskets/:id`. Name suggestion is suppressed. Note that **the registry's row actions do not link here** — **Edit structure** goes to the structure page instead — so this route is reached by URL or by a bookmark.

### The structure page

`/analysis/portfolio-groups/baskets/:basketId` is where membership and re-weighting are managed after creation. Its header reads eyebrow **Portfolio structure**, the group's name, and the subtitle **Members, data freshness and trading configuration. Performance lives in Portfolio Manager.**

| Header action | Label | Notes |
|---|---|---|
| Back | **Back**, or **Back to portfolio** when `origin` points into Portfolio Manager | — |
| Performance | **View performance** | Hidden when you arrived from the Portfolio Manager dashboard |
| Trading Lab | **Trading Lab** | Primary button; disabled with zero members |
| Refresh members | **Update portfolios** | Disabled while pending, already armed, or empty. Label cycles **Queuing…** → **Updating {{count}} of {{total}}…** → **Queued…** |
| Kebab | **More** | See below |

The **More** menu holds **Rename portfolio group**, **Seed**, a permanently **disabled** item reading **Daily update ON**, a divider, and **Delete portfolio group** in the error colour.

> [!WARNING]
> **Daily update cannot be turned off from the UI.** The creation form shows a static chip; the structure page's menu item is disabled. The backend does accept `daily_update_enabled: false`, but refuses it once the group has any operation: *"This basket has operations; daily update can't be turned off while it is being tracked. Stop and remove its operations first."*

Membership editing controls:

| Control | Label | Behaviour |
|---|---|---|
| Id entry | **Portfolio ID** | Number field, `min=1`, Enter submits. Helper: **A trial id is promoted to a managed portfolio on save.** |
| Add | **Add** | Client-side only — deduplicates and requires `id > 0` |
| Browse | **Browse & filter** | Opens Rank & Build in append mode for this group |
| Commit | **Save changes** / **Saving…** | Appears **only** when the local list differs from the stored one (order-insensitive). Sends `PUT /portfolio_manager/baskets/:id` with `portfolio_ids` alone |

Member chips are colour-coded, in this precedence: EXTERNAL **or** frozen → error; stale → warning; otherwise primary. Their hover titles are exact:

| State | Chip title |
|---|---|
| EXTERNAL strategy | **EXTERNAL strategy — cannot daily-extend; remove it from the portfolio group** |
| Daily updates off | **frozen: daily updates disabled — cannot stay up to date** |
| Behind the market | **stale: behind the latest market bar — click "Update portfolios"** |
| Healthy | **up to date** |

An EXTERNAL member renders as **{{name}} · EXTERNAL**; an unresolvable one falls back to **Managed portfolio**. With no members at all the panel reads **No portfolios. Add some below.**

The page also offers **Optimize Risk Managers** — one row per member with an **Optimize RMs** button. Its body states the contract: *"Runs a risk-manager optimization for one portfolio group member at a time — creates a new study; the portfolio group itself is never modified until you add the winning trial back."* The button is disabled for a member that already has a risk manager, with the tooltip *"This member already has a risk manager — pick a member whose study never injected one."* See [risk managers](/docs/risk-managers).

**Seed** opens a dialog titled **Portfolio Group seed** with **Blended** and **By member** views, backed by `GET /portfolio_manager/baskets/:id/seed?view=bundle|blended|both` (default `both`). It is **entitlement-gated** behind `seed_export` — the seed is the raw rebalancing signal, so whoever holds it can trade the signal directly. It is not token-charged.

### Freshness

Every membership surface reads `GET /portfolio_manager/baskets/:id/freshness`, which returns:

```json
{
  "basket_id": "…",
  "fresh": [4412],
  "stale": [4418],
  "not_scheduled": [4470],
  "members": [
    {
      "managed_portfolio_id": 4418,
      "stale": true,
      "daily_updates_enabled": true,
      "execution_type": "INTERNAL",
      "refresh_status": "RUNNING",
      "protective_overlap_warning": null,
      "has_risk_manager": false,
      "source_study_resolvable": true
    }
  ],
  "daily_update_enabled": true,
  "rebalance_frequency_days": 30
}
```

A member can be in **both** `stale` and `not_scheduled`. `refresh_status` is one of `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` or null. The structure page renders three chips from this:

| Chip | Copy | Severity |
|---|---|---|
| Fresh | **{{count}} up to date** | success |
| Stale | **{{count}} stale** | warning |
| Not scheduled | **{{count}} not on daily updates** | error |

with hints **Stale portfolios haven't reached the latest market day — click "Update portfolios".** and **Some portfolios aren't scheduled for daily updates and can't be invested — enable daily updates first.**

**Update portfolios** posts to `POST /portfolio_manager/baskets/:id/update` and returns `{ basket_id, portfolio_count, studies_enqueued }`. It reuses the study-scoped updater pipeline, and studies already `PENDING` or `RUNNING` are intentionally not re-queued, so the call is idempotent. While a refresh is armed an info banner explains it runs in the background and that you may leave the page.

### Trading Lab

The Trading Lab modal is the post-creation configuration surface, opened from the structure page. Title **Trading Lab**, subtitle **Configure and re-simulate the portfolio group's trading strategy**. Its left column configures; its right column previews.

**Allocation and schedule**

| Control | Label | Notes |
|---|---|---|
| Method + parameters | **Allocation method** | Same picker as the creation form, but with the group's real `unlocked_methods`, so an already-unlocked premium method shows the **Unlocked** chip and skips the charge |
| Rebalance | **Rebalance** switch, **Rebalance every (data-days)** | Seeds to `30` |
| Grid phase | **Rebalance anchor** | Date field. Helper is either *grid counts from here* or *defaults to {{date}}* (the group's creation date) |

**Execution settings** (the shared order policy every order inherits)

| Control | Label | Values |
|---|---|---|
| Order type | **Order type** | **Market**, **Limit**, **Stop**, **Stop limit**, **Trailing stop** — the stop family is tagged **— protective, coming soon** |
| Time in force | **Time in force** | **Day**, **Good till canceled**, **At the open**, **At the close**, **Immediate or cancel**, **Fill or kill** — some tagged **— not yet on the buy leg** |
| Limit offset | **Limit offset (bps)** | Helper: *"Marketable cushion above the reference price — higher fills more reliably, lower ties up less of the reserved cash."* |
| Preview | **Order intent preview** | **Buy leg** and **Sell leg** cards, each labelled **From portfolio group config** or **Engine default (market + day)** |

The section's own hint states the asymmetry: *"Funding sells are always market + DAY so they fill and release buying power; buys carry the configured type and time-in-force as a bounded marketable limit."* Only `market` and `limit` are honoured on the rebalance buy leg today, and only `day` and `gtc`; the rest are stored-and-valid but not yet wired into live execution. The server refuses the rest outright:

```text
stop, stop-limit and trailing-stop are protective order types and are not yet
configurable for rebalancing — use market or limit
```

**Protective exit**

| Control | Label |
|---|---|
| Arm | **Arm a protective exit** |
| Type | **Protective order type** — stop, stop limit or trailing stop only |
| Time in force | **Time in force** — day or gtc |
| Stop | **Stop offset (bps below)** |
| Limit | **Limit offset (bps below)** |
| Trail | **Trail (%)** |

Its hint: *"An optional resting exit armed per long position after a buy fills. It sits at the broker and triggers if price falls to your stop; a trailing stop tracks the high-water mark server-side and ratchets up as the position gains."* A non-stop type is refused with **a protective exit must be a stop, stop-limit or trailing stop**.

**Re-entry, benchmark, weights**

| Control | Label | Default | Notes |
|---|---|---|---|
| Re-entry | **Re-enter after a stop-out** | Off | *"When off (default), a symbol whose protective stop fires stays out until you change the config — a hard stop-loss. When on, the next rebalance can buy it back to target."* |
| Cooldown | **Days out after a stop** | `0` | Shown only while re-entry is off. *"Trading days the symbol stays out, counting the day it exited. 0 keeps it out for the whole stage."* |
| Benchmark | **Benchmark** | **Platform default** | *"Alpha, beta and information ratio are measured against this. If this group is allocated by one of those metrics, it also decides the weights."* |
| Manual weights | one % field per member | Even split | Only when the method is `manual`. Running total shown; guarded when \|total − 100\| > 0.5; normalized to sum 1.0 before sending |
| Risk budget | **Risk budget per portfolio** | `1` per member | Only when the method is `risk_parity`. *"Relative risk shares — renormalized automatically (equal = classic risk parity)."* |
| Per-strategy overrides | **Per-strategy overrides** | Inherit | One form per member, chipped **Override** or **Inherits portfolio group**. *"When two strategies hold the same symbol, the one contributing the most dollars to it wins."* |

**What-if hypothesis** is preview-only. It offers **Exclude names**, **Exclude sectors**, a **From**/**To** window and a **Reallocate the freed weight to the other names** switch, and states plainly: *"Reshapes the backtest preview on the right. Nothing here is saved to the portfolio group or sent to live trading."*

**Re-simulate** runs `POST /portfolio_manager/baskets/:id/simulate` — a synchronous fund-of-funds backtest that **is token-charged**. The preview badge reads **Committed track record**, **Unsaved preview** or **Inverted (what-if) — backtest only**, and the delta grid is headed **Impact vs. track record**.

**Save & apply** sends one `PUT /portfolio_manager/baskets/:id` carrying allocation, rebalance, anchor, manual weights, execution, protective, re-entry, benchmark and `rewrite_backtest`, then fires the per-member override PUTs **separately and non-atomically**. A partial failure toasts **Couldn't save {{count}} per-strategy overrides.** and leaves the modal open; a full success toasts **Configuration saved.** and closes.

**The rewrite prompt** appears only for a group that has never traded and already has a committed curve:

| Element | Text |
|---|---|
| Title | **Apply to the backtest?** |
| Body | **This portfolio group has not started trading, so its backtest can be recomputed with the configuration you just chose.** |
| Hint | **Rewrite recomputes the whole curve from inception. Apply forward only freezes the current curve and starts a new stage from today — use it if you want to keep the existing record.** |
| Buttons | **Rewrite backtest** · **Apply forward only** · **Cancel** |

> [!CAUTION]
> **A group that has ever traded can never have its backtest rewritten.** Server-side, "has traded" means any operation whose `last_status` is not `DRAFT`, **or** a `DRAFT` operation that shows evidence of a real cycle (`last_rebalanced_at` or `current_cycle_id` set) — and **a STOPPED operation still counts**. For such a group `rewrite_backtest` is ignored entirely and every grid-affecting change is applied forward-only, freezing the existing slice and opening a new epoch. Grid-affecting means a change to the anchor date, the allocation method, its parameters, or the effective cadence (toggling rebalance off counts, since NULL means static). Membership and manual-weight edits are explicitly **not** stage triggers.

### Deploying a group: capital, account, paper vs live

The row action **Deploy Portfolio Group** opens a dialog that collects the three things the group itself does not carry, then makes **two sequential API calls per group**: `POST …/operations` to create it, then `PATCH …/operations/:opId/launch` to start it.

| Input | Notes |
|---|---|
| Broker account | A select over your **active** broker connections only. Each option shows the connection's display name and an environment chip — orange for `live`, blue for paper |
| Capital | A number per group; the dialog shows the run's total when more than one group is eligible |
| Operation name | Optional label for the resulting operations, placeholder **e.g. Paper $10k** |

With no active connection at all the dialog shows a guided empty state: title **Connect your brokerage account**, body **You need to link your brokerage credentials before you can trade this portfolio group. Add a connection under Account settings → Broker connections, then come back here.**

Before the run, each group is tagged from its own freshness read. **Only an empty group is a hard client-side block**; stale members and members not on daily updates are warnings you may still attempt, since a member can refresh between the preflight and the launch.

Every run settles each group into one of four outcomes:

| Outcome | Meaning | What to do |
|---|---|---|
| `deployed` | Created **and** launched. Capital is at work | Nothing |
| `draft_only` | Created, but the launch failed. **A DRAFT operation is left behind** | Open the group's Operations tab and launch it. This is not a failure |
| `skipped` | The group already has an operation on this connection (`UNIQUE (basket_id, connection_id)`) | Nothing — re-running a deploy over the same selection is expected and harmless |
| `failed` | The operation was never created | Read the message; it is the server's own diagnosis |

The result summary reads **{{launched}} of {{total}} groups launched.**, and a draft-only result adds **Groups marked "Created, not launched" have a draft operation waiting. Open the group's Operations tab to launch it.**

> [!NOTE]
> `draft_only` is also the exact outcome for a user who holds `broker_tracking:create` but not `broker_tracking:update`: the operation is created and the launch is refused.

> [!WARNING]
> Several labels in this dialog are currently untranslated — their keys are missing from the English, Spanish and Portuguese bundles, so the running app renders the raw key text (for example `bulkDeploy.title`, `bulkDeploy.capitalPerGroup`, `bulkDeploy.confirm`). The dialog's behaviour is as described above; do not treat the on-screen strings as final copy.

> [!IMPORTANT]
> **There is no per-group live/paper switch.** The environment is a property of the broker connection you pick. Because one group can hold one operation per connection, the same group can run paper and live simultaneously on two connections. Live trading is additionally gated platform-wide behind the `ALLOW_LIVE_BROKER_TRADING` environment flag. See [live trading](/docs/live-trading).

The single-group equivalent, reached from the Operations tab, is the **Trade with your brokerage** dialog. It collects the same things plus an optional per-operation execution override:

| Field | Label | Validation |
|---|---|---|
| Connection | **Brokerage account** | Active connections only; defaults to the first |
| Capital | **Capital to trade ($)** | `min=1`, `step=100`; must be greater than 0. Helper: *"The total amount available to this trading session."* |
| Name | **Name (optional)** | Placeholder **e.g. Paper $10k** |
| Override | **Override execution policy for this operation** | Off by default. When on: **Order type** (market or limit), **Time in force** (day or gtc), **Limit offset (bps)** (0–1000, step 5) for a limit |

Warnings appear above the fields when members are stale or unscheduled, and the footer states: *Next: review it, then **Launch** to place the first orders.* The confirm button reads **Create operation** (**Creating…** while pending), and creation alone does not trade.

### What an operation is

An operation is one deployment of one group against one broker connection. The group holds the shared trading rules; the operation holds capital, status and its own rebalance clock. The panel says exactly that: *"Each trading session invests this portfolio group through one broker account. The portfolio group holds the shared trading rules; each session runs its own capital, status, and rebalances."*

Operations are **not** rendered inside the Portfolio Groups feature. The Operations tab is a Portfolio Manager route: `/analysis/portfolio-manager/:basketId/operations`. This registry only *starts* an operation and *counts* it in the Total AUM column.

The row for an operation shows its name (or the connection label), the connection and capital, **Last rebalanced:** with a date, and a **Next:** date when one is known. `next_due_date` stays null until the operation has actually rebalanced once, or if the group is static, or if the next grid date is not yet a known data-day.

Status chips:

| `last_status` | Colour | Meaning |
|---|---|---|
| `DRAFT` | default | Created, never launched. No capital at work |
| `ACTIVE` | success | Trading |
| `PAUSED` | warning | Positions held, rebalancing stopped |
| `STOPPED` | error | Liquidated and finished; history is kept |

A second outlined chip **→ {{status}}** appears whenever `desired_status` differs from `last_status` — the orchestrator has been told to move and has not finished. **rebalance pending** appears while a manual rebalance is queued, and **connection revoked** / **connection error** when the broker connection is unusable.

### Operation lifecycle

The only legal transitions are:

```text
  DRAFT ──launch──► ACTIVE ⇄ PAUSED
                      │        │
                      └────────┴──stop──► STOPPED ──re-initiate──► DRAFT
```

An illegal move is refused with `Invalid status transition: {from} → {to}`. `PENDING` exists elsewhere in the system but is reserved for the orchestrator; the API accepts only these four.

| Button | Shown when | Tooltip | Confirmation |
|---|---|---|---|
| **Launch** | `DRAFT`, connection healthy | **Place the initial buy and start trading this operation (DRAFT → ACTIVE).** | **Launch operation** — *"The orchestrator will place the initial buy on its next cycle."* |
| **Pause** | `ACTIVE`, connection healthy | **Stop rebalancing but keep current positions (ACTIVE → PAUSED).** | none |
| **Resume** | `PAUSED`, connection healthy | **Resume rebalancing and re-buy into the market (PAUSED → ACTIVE).** | **Resume operation** — *"The orchestrator will rebalance back into the market."* |
| **Stop** | `ACTIVE` or `PAUSED`, connection healthy | **Liquidate all positions and stop this operation.** | **Stop operation** — *"This liquidates all positions for this operation."* |
| **Force stop** | `ACTIVE` or `PAUSED` on a revoked/errored connection | **Connection revoked: liquidation is impossible. Mark this operation STOPPED locally so you can delete it. Positions are NOT sold — close them in your brokerage.** | **Force stop operation**, with the warning that broker positions are **NOT** sold |
| **Re-initiate** | `STOPPED` | **Reset a stopped operation back to DRAFT so it can be launched again (history is kept).** | none |
| **Rebalance** | `ACTIVE` or `PAUSED`, connection healthy | **Recompute the member weights now (the orchestrator rebalances on its next tick).** | see below |

> [!CAUTION]
> Only the direction that **adds** exposure is entitlement-gated. Creating an operation, launching one and resuming to `ACTIVE` require the `broker_paper_trading` feature. Pausing, stopping and returning to `DRAFT` stay open on every tier — the exit is never locked.

Force-stop on a still-healthy connection is refused with a 409: *"the broker connection is still active; use Stop to liquidate positions — force-stop is only for revoked/errored connections"*.

**Manual rebalance** opens a dialog titled **Rebalance**, body **Recomputes the member weights via the allocation method (the portfolio group's portfolios stay the same).**, and a warning **This places live buy/sell orders at your broker on the next cycle.** It offers a **Periodic counter** choice: **Keep — counter continues** or **Reset — restart from today**. Two throttles apply:

| Guard | Rule | Message |
|---|---|---|
| Debounce | 60 seconds between requests | `Rebalance recently requested; wait {n}s before retrying` (HTTP 429) |
| Backpressure | at most 50 unsettled orders | `Operation has {in_flight} in-flight orders (max {max}); try again shortly` (HTTP 429) |

**Position drift** blocks rebalancing. When the broker's reported positions diverge from Fintela's ledger and the divergence has not been acknowledged, a warning banner reads **Position drift detected — rebalancing is blocked until acknowledged.** with a per-symbol breakdown in columns **Symbol**, **Expected**, **Broker**, **Drift** and a disposition chip reading **Unexplained — check broker account** or **Possible corporate action ({{types}}) — review**. Quantities are carried as **full-precision strings**, not numbers. The **Acknowledge** action opens a confirmation titled **Acknowledge position drift**, whose body warns it is *"a real-money, irreversible action"*.

### Launch preflight refusals

The server runs the real preflight at both create and launch, and every refusal is a plain sentence that names the fix. These are the exact strings.

| Situation | Message |
|---|---|
| Empty group | `the basket has no portfolios; add at least one before initiating or launching` |
| Daily update off | `enable daily update on the basket before initiating tracking` |
| Stale members | `cannot launch: portfolios not up to date: {stale}; refresh them (update the basket) before investing` |
| Members not on daily updates | `cannot launch: portfolios are not scheduled for daily updates: {…}; enable daily updates on these portfolios before investing` |
| EXTERNAL members | `members use EXTERNAL strategies which cannot daily-extend: {…}; remove them from the basket before initiating or launching` |
| Meta-portfolios not flattened | `cannot launch: meta-portfolios (portfolio-of-baskets) have not been built yet: {…}; run "Update portfolios" and wait for it to finish so their holdings are flattened before investing` |
| Short crypto | `cannot launch: portfolios hold SHORT positions in crypto, which the broker cannot short: {…}; remove the crypto shorts before investing` |
| Shorts without margin | `cannot launch: portfolios hold SHORT positions but the broker account is not enabled for short selling (a margin account is required): {…}; enable margin/short selling on the broker account or remove the shorts` |
| Cleartext external risk manager | `cannot launch: this operation would be driven by an external risk manager reached over plain http, so its per-tick response — which shapes real orders — is unauthenticated and readable in transit: {hosts}. Move those endpoints to https, or confirm explicitly that you accept the risk` |
| Unsupported execution config | `execution config is not supported: {reason}` |
| Capital above the per-tick cap | `cannot launch: target_capital (${tc}) exceeds the per-tick notional cap (${cap}); the first rebalance batch would exceed the cap and abort every tick, deploying nothing — lower target_capital or raise this connection's per-tick limit` |
| Bad capital | `target_capital must be greater than 0` |
| Duplicate on this connection | `An operation already exists for this basket and connection` |
| Connection not usable | `Connection not active or not owned by user` |

Membership changes on a **live** group have their own guards, refused before anything reaches the broker:

```text
cannot change a live basket's membership: meta-portfolios are not yet flattened
  (empty holdings): {…}; wait for the nightly flatten or remove them
cannot change a live basket's membership: portfolios SHORT crypto, which the broker
  cannot short: {…}; remove the crypto shorts first
cannot change a live basket's membership: portfolios hold SHORT equity but a live
  broker account is not enabled for short selling: {…}; enable margin/short selling
  on the account or remove the shorts
```

The per-tick notional cap defaults to 250,000 dollars and can be raised per connection.

### Orders, allocations, state log and EOD reports

Expanding an operation reveals five read-only tabs. Each fetches only while it is the active tab.

| Tab | Contents | Empty state |
|---|---|---|
| **Allocations** | Columns **Portfolio**, **Weight**, **Triggered by**, **When** | **No weight snapshots yet — they appear after the first rebalance.** |
| **Orders** | Columns **When**, **Portfolio**, **Ticker**, **Class**, **Broker id**, **Action**, **Side**, **Qty**, **Type**, **Fill**, **Status** | **No orders yet — they appear after Launch places the initial buy.** |
| **Activity** | Columns **When**, **Actor**, **Event**, **Detail** | **No activity yet.** |
| **Reconciliation** | Columns **Day**, **Scope**, **Outcome**, **Fills matched**, **Discrepancies**, **Ran at** | **No reconciliation yet (runs end-of-day).** |
| **Positions** | Columns **Symbol**, **Side**, **Qty**, **Avg entry**, **Current**, **Market value**, **Unrealized P&L**, **Today**, over a **Long** / **Short** / **Gross** / **Net** / **Unrealized P&L** roll-up | **No open positions on this brokerage account.** |

What each history actually records:

- **Allocations** — one weight snapshot per member per rebalance: `{ id, operation_id, portfolio_id, allocation, triggered_by, recorded_at }`. `portfolio_id` is a managed portfolio id.
- **Orders** — one row per order sent, carrying the broker's own order id, the asset class, the action and position side, quantity, order type, limit price, status, fill price and timestamps, plus `error_message` when the broker rejected it.
- **Activity (state log)** — `{ log_id, operation_id, actor_kind, actor_id, event_type, payload, occurred_at }`, written to `developers.broker_tracking_state_log`. A launch writes `event_type = 'launched'` with the payload `{"note":"live trading enabled"}` **in the same transaction as the status flip**: if the platform cannot record who started an operation, it does not start it.
- **Reconciliation (EOD reports)** — `{ report_id, connection_id, operation_id, trading_day, outcome, fills_matched, fill_discrepancies, position_discrepancies, non_trade_activities, ran_at }`, produced end-of-day. The **Scope** column reads **operation** or **account**: a row with `operation_id = NULL` is the connection-level, account-wide summary for that day.
- **Positions** is account-level, not per group. Its caption says so: *"Live positions on the entire brokerage account behind this connection — the whole account, not segmented by portfolio group."* The tab is badged **Account-wide**.

Allocations, Orders, Activity and Reconciliation each have a matching read-only endpoint under `/portfolio_manager/baskets/:id/operations/:op_id/…` and a mirror in the [Developer API](/docs/api-baskets). Positions is the exception: it reads the broker connection directly at `/broker/connections/:id/positions` and has no Developer API mirror.

### Permissions

Basket configuration and operation control use **different permission families**, which is why a user can be able to edit a group but not deploy it.

| Surface | Permission |
|---|---|
| The `/analysis/portfolio-groups` route | `portfolios:read` |
| All basket CRUD, freshness, seed, backtest, order-intent, member-config endpoints | `portfolios:read` |
| Operation reads — list, get, allocations, orders, state log, EOD reports | `broker_tracking:read` |
| Creating an operation | `broker_tracking:create` |
| Launch, status change, execution override, force stop, rebalance, acknowledge drift | `broker_tracking:update` |

## Execution modes

Internal and External are properties of a **[strategy](/docs/strategies)**, not of a Portfolio Group. A group has no execution-mode selector, no code, and no endpoint of its own — it is a container plus a trading policy. What the two modes decide here is **which portfolios are allowed to be members**.

| Mode | What it is | Can it be a Portfolio Group member? |
|---|---|---|
| **Internal** | Python that runs inside Fintela against a deterministic function signature | **Yes.** This is the only supported case |
| **External** | A strategy you host yourself, in any language, on your own infrastructure and against your own private data | **No.** Rejected everywhere |

### Why External does not apply

Membership requires a **managed portfolio**, and a managed portfolio has to **daily-extend**: every day the platform advances its equity to the latest market bar so the group's weights and orders reflect current prices. Managed mode supports **INTERNAL only**. An externally hosted strategy cannot be extended by the platform, so it can never keep a group's book current — and a group whose members go stale cannot be launched.

The refusal is enforced at every entry point, with these exact messages:

| Where | What happens |
|---|---|
| Creating a group, or changing membership | `portfolio {id} uses an EXTERNAL strategy ({execution_type}); it cannot daily-extend (managed mode supports INTERNAL only), so it cannot be in a tracked basket. Remove it from the basket.` |
| Creating or launching an operation | `members use EXTERNAL strategies which cannot daily-extend: {…}; remove them from the basket before initiating or launching` |
| Promoting from Rank & Build | An alert reading **One or more selected trials use an EXTERNAL-execution strategy. These are rejected on promotion — remove them to continue.**, with the action **Remove EXTERNAL trials and continue** and an **EXTERNAL** badge on each offending row |
| The structure page | The member chip turns error-coloured, labelled **{{name}} · EXTERNAL**, with the title **EXTERNAL strategy — cannot daily-extend; remove it from the portfolio group** |

The freshness endpoint reports each member's snapshotted `execution_type` as `"INTERNAL"` or `"EXTERNAL"`, so an EXTERNAL member that slipped in through an older path is visible before you try to launch.

> [!NOTE]
> If your strategy is External, the path into a Portfolio Group is to reimplement it as an Internal strategy. There is no bridge, no proxy mode and no opt-in. See [external strategies](/docs/external-strategies) and [execution modes](/docs/execution-modes).

### The one External thing that does run inside a live group

**External risk managers are supported.** A member can carry a risk manager of kind `external_http` — your own endpoint, called by the engine on every tick — and it will drive real orders inside a live operation. That is a different surface from an External strategy, and it is not blocked.

It does carry one security gate. Before a launch or a resume, the platform collects the distinct endpoints of the active members' external risk managers whose URL begins with `http://` and refuses:

```text
cannot launch: this operation would be driven by an external risk manager reached
over plain http, so its per-tick response — which shapes real orders — is
unauthenticated and readable in transit: {hosts}. Move those endpoints to https,
or confirm explicitly that you accept the risk
```

The refusal itself is the prompt. The UI then shows a dialog titled **This endpoint is unencrypted**, explaining that *"Anyone on the network path could alter it."*, with the checkbox **I understand, and I accept the risk for this operation** and the action **Trade anyway**. Acceptance is **per attempt and never remembered** — closing the dialog drops it, and the payload flag `acknowledge_insecure_endpoints` defaults to `false`, so the gate fails closed.

### No external control over the API

The [Developer API](/docs/api-baskets) exposes Portfolio Groups **read-only**. Every route under `/v2/baskets` is a `GET`:

```http
GET /v2/baskets
GET /v2/baskets/{id}
GET /v2/baskets/{id}/freshness
GET /v2/baskets/{id}/operations
GET /v2/baskets/{id}/operations/{op_id}
GET /v2/baskets/{id}/operations/{op_id}/allocations
GET /v2/baskets/{id}/operations/{op_id}/orders
GET /v2/baskets/{id}/operations/{op_id}/state_log
GET /v2/baskets/{id}/operations/{op_id}/eod_reports
```

There is **no way to create, edit, delete, deploy, launch, pause, stop or rebalance a Portfolio Group with an API key**, and no way to trigger a member refresh or a simulation. This is policy, not an oversight: every write this service used to expose was a compute trigger, and this service has no token-ledger integration, so the compute would be billed to nobody. Every group-changing action goes through the SPA or the authenticated backend.

Two more facts worth carrying into an integration:

- **Auth is header-only**: `Authorization: Bearer <api-key>`. The old `?api_key=` query fallback was removed, because a query string leaks into access logs, proxy logs, browser history and `Referer` headers.
- **The projection is narrower than the app's.** `/v2/baskets` returns `id`, `name`, `portfolio_ids`, `daily_update_enabled`, `stage`, `allocation_method`, `allocation_method_params`, `rebalance_enabled`, `rebalance_frequency_days`, `rebalance_anchor_date`, `member_weights`, `created_at`, `updated_at` — and nothing else. There is no `description`, no `execution_config`, no `protective_config`, no `unlocked_methods`, no `benchmark_ticker_id`, and none of the `operations_count` / `live_operations_count` / `deployed_capital` aggregates the registry's Total AUM column is built from.

The four history endpoints paginate with `?limit=` (clamped to `[1, 1000]`) and `?offset=` (default 0). The default limit is 500 for allocations, orders and the state log, and **90 for EOD reports**. A basket outside the key owner's organization returns **404**.
