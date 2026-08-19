---
title: Studies
section: Registries
sectionOrder: 3
order: 4
published: true
updated: 2026-08-18
summary: An optimization campaign over a strategy, asset group, fitness function and risk manager — and the trials it produces.
keywords: study, optimization, trials, sampler, n_trials, backtest, walk-forward, progress, health, status, autostop, seed
---

A study is one optimization campaign. It binds exactly one strategy, one fitness function, one asset group and an optional stack of risk managers to a date window and a trial budget, then searches the strategy's parameter space for the configuration that scores best on the objective. Every trial it runs materializes as a portfolio you can inspect, rank and promote. Creating a study does **not** start it — a new study lands as a draft and is launched as a separate, billed action.

## Overview and purpose

### What a study binds

| Component | Cardinality | Registry |
|---|---|---|
| Strategy | exactly one | [Strategies](/docs/strategies) |
| Asset group | exactly one | [Asset Groups](/docs/asset-groups) |
| Fitness function | exactly one | [Fitness Functions](/docs/fitness-functions) |
| Fitness asset group | zero or one (custom fitness only) | [Asset Groups](/docs/asset-groups) |
| Risk managers | zero or more, ordered | [Risk Managers](/docs/risk-managers) |
| Benchmark instrument | auto, none, or one pinned instrument | platform catalog |

On top of those it carries a parameter search space, a train / validation / out-of-sample date window, a sampler, a trial budget (`n_trials`), an eligibility policy for the universe, and an optimization direction.

### Two names, one study

A study has two identities and they are not interchangeable.

| Identity | Column | Behaviour |
|---|---|---|
| Display name | `display_name` | What you typed. Unique per organization among live rows; a collision is auto-suffixed `" (2)"`, `" (3)"`. Renameable while the study is a draft. Capped at 200 characters. |
| Study key | `study_name` | The machine handle: a slug plus an 8-character hex discriminator. Minted server-side, globally unique, immutable, and never rendered as the study's name. |

> [!NOTE]
> `developers.studies` **is** the optimizer's own Optuna `studies` table — the optimizer connects with `?options=-csearch_path=developers`. That is why the key column is called `study_name` while the human-readable label lives in `display_name`. Anything showing a slug-with-hex as "the name" is reading the wrong column.

The old browser-minted `_YYYYMMDD_HHMMSS` name suffix is gone; uniqueness is the database's job. The server strips any trailing legacy stamp from a name you send.

### What a study produces

Running a study produces **trials**. Each trial is one parameter combination, backtested over the window, scored by the fitness function, and persisted as a portfolio row. Trial states are `WAITING` → `RUNNING` → `COMPLETE`, or `PRUNED` / `FAIL`.

A completed study also produces three secondary artifacts — robustness (including the PBO estimate), behavioural trial families, and parameter importances. These are computed in trailing pipeline stages and can arrive **after** the study already reads Completed.

### What consumes a study

| Consumer | How it uses the study |
|---|---|
| [Portfolios dashboard](/docs/portfolios-dashboard) | The row action **View** opens `/analysis/portfolios?studyId=<id>` — the ranked trials, the charts, the exports and the Stop button |
| [Optimization dashboard](/docs/optimization-dashboard) | Cross-study monitoring of runs in flight |
| [Portfolio groups](/docs/portfolio-groups) and [Promoted portfolios](/docs/promoted-portfolios) | Trials graduate out of a study into these |
| [Fintelligent](/docs/fintelligent) | Can open, fill and hand back the builder; it cannot save, launch, stop or delete a study on its own |
| The developer API | Read-only study endpoints — see [API: Studies](/docs/api-studies) |

### Where studies come from

| Origin | Result |
|---|---|
| **New Study** in the registry, or `?mode=create` | A draft (`SAVED`), or `QUEUED` if you chose Save & Launch |
| **Duplicate** on a row, or `?duplicate=<id>` | The builder opens pre-seeded from that study, in create mode, with a fresh name. No API call happens until you save |
| **Derive / Optimize RMs** on a portfolio or portfolio-group member | A batch of risk-manager-optimization studies that go **straight to `QUEUED`** — they never sit as drafts |
| Fintelligent `ui_crud_action(entity='study')` | Opens the builder for create, edit or duplicate; you still confirm and save |

## Registry table view

The registry lives at `/studies` and uses the shared registry workbench: a command bar, a permanent insights band, the table (or tiles), and a status bar. Search, sort and filters all live in the URL, so a filtered view is shareable.

### Routes and entry points

| Path or parameter | Effect |
|---|---|
| `/studies` | The registry index |
| `/studies/edit/<id>` | Opens the builder in edit mode. Only never-launched studies are editable |
| `?mode=create` | Opens the builder in create mode |
| `?duplicate=<id>` | Opens the builder pre-seeded from that study |
| `?q=<text>` | Free-text search |
| `?sort=<columnKey>:<asc\|desc>` | Sort. The default is omitted from the URL |
| `?f_<columnKey>=<criteria>` | One active filter per parameter |

> [!NOTE]
> `/studies/view/<id>` is mounted by the shared registry route map but the Studies page does not render an inspect screen — that URL shows the plain list. Use **View** to reach a study's results.

### Command bar

| Element | Exact string |
|---|---|
| Title | **Studies** |
| Search box | **Search studies…** |
| Create button | **New Study** — disabled without create permission |
| Filter button | **Filter** |
| Refresh | **Refresh** |
| Help | **View documentation** — opens a 420 px right drawer with the `studies` and `optimizer-lifecycle` doc blocks |
| View toggle | **List view** / **Card view** |
| Table aria-label | `study table` |

A quota meter sits in the command bar for organizations on a limited plan: a `used/limit` counter and a bar, amber past 80 % and red at the cap, with the tooltip *{{used}} of {{limit}} studies used — buy tokens to create more*. An organization with no studies limit sees nothing there.

At the cap, **New Study** is not disabled — clicking it opens a dialog titled **You've reached your plan limit**, reading *Your plan includes {{limit}} studies and you already have {{used}}.*, *Your existing studies keep working normally.* and *You can also delete one to make room.*

### Columns

Default visible set: `name`, `strategy`, `health`, `progress`, `status`, `author`. Default sort is `created_at` descending. The rest are one click away in the column chooser.

| Key | Header | Sortable | In the filter panel | Content |
|---|---|---|---|---|
| `name` | **Name** | yes | text | The display name, bold, no wrap |
| `strategy` | **Strategy** | yes | multiselect | A link to the strategy. For a viewer without full access the id is redacted, so the name shows without a link. Unknown value renders **Unknown strategy** |
| `health` | **Health** | **no** | — | A meter. Tooltip: **Share of trials that produced a usable result.** |
| `progress` | **Progress** | **no** | — | A meter, always informational-toned. Tooltip: **Completed trials over the total requested.** followed by ` · <completed>/<n_trials>` |
| `status` | **Status** | yes | multiselect | The live status badge |
| `author` | **Author** | yes | multiselect | The creating user's username |
| `total_trials` | **Total Trials** | yes | number range | Pill reading `<completed>/<n_trials>` |
| `train_period` | **Train Period** | yes | — | `train_start_date – train_end_date` |
| `validation_period` | **Validation Period** | yes | — | `validation_start_date – validation_end_date` |
| `daily_update` | **Daily Update** | yes | boolean | A switch that writes immediately |
| `created_at` | **Created At** | yes | date range | `MMM D, YYYY`. Hidden by default |

> [!NOTE]
> **Health** and **Progress** are deliberately not sortable. Both refetch every 5 seconds while anything is active, and a sortable live column would reorder rows under the cursor you are aiming at.

The **Daily Update** switch owns its own mutation and is an interactive island inside a clickable row — toggling it does not open the row menu. Its tooltip reads **Enable daily updates** when off and **Disable daily updates** when on.

Card view shows the study name plus **Status**, **Total Trials**, **Created At** and **Author**. The daily-update switch is intentionally absent from a card.

### Status values

The badge reads `study_runtime_status.last_status` from the live status query only — never the 60-second-stale metadata snapshot.

| Value | Rendered label | Icon |
|---|---|---|
| `SAVED` | **Draft** | edit note, neutral |
| `QUEUED` (legacy alias `PENDING`) | **Queued** | clock, neutral |
| `RUNNING` | **Running** | rocket, info |
| `COMPLETED` (legacy aliases `COMPLETE`, `FINISHED`) | **Completed** | check circle, positive |
| `FAILED` | **Failed** | error, negative |
| `STOPPED` | **Stopped** | stop circle, neutral |
| anything else | the raw value | clock, neutral |
| no live row yet | **—** | — |

### Lifecycle statuses and transitions

There are exactly six persisted statuses. The lifecycle payload adds one **display-only** value, `STOPPING`, shown while a stop request is pending.

| From | Event | To |
|---|---|---|
| — | `POST /studies` with `launch_now: false` | `SAVED` |
| — | `POST /studies` with `launch_now: true` | `QUEUED` |
| — | `POST /studies/risk-manager-optimization` | `QUEUED` (never `SAVED`) |
| `SAVED` | `POST /studies/:id/launch` | `QUEUED`; clears the previous run's finish/stop/failure fields and opens the `queued` stage |
| `QUEUED` | the dispatcher launches the first task | `RUNNING` |
| `RUNNING` | every trial finished | `COMPLETED` |
| `RUNNING` | a finite grid was exhausted before `n_trials` | `COMPLETED`, with `completed_trials < n_trials` |
| `RUNNING` | a core-stage failure, or the autostop threshold was breached | `FAILED` |
| `RUNNING` | `POST /studies/stop` | `STOPPED` (via `STOPPING`) |
| `COMPLETED` or `STOPPED` | `POST /studies/resume` | `QUEUED`, with `n_trials` increased and the run sequence bumped |
| any | `DELETE /studies` | soft-deleted and removed from every list |

> [!WARNING]
> `FAILED` is **not** resumable. Only `COMPLETED` and `STOPPED` can be resumed; anything else returns 406 **Only studies that finished or were stopped can be resumed.** There is no `PAUSED` state and no pause action anywhere in the product.

The run itself moves through a ten-stage pipeline: `queued` → `provisioning` → `data_loading` → `strategy` → `fitness` → `preflight` → `optimize` → `robustness` → `families` → `importances`. The last three are **secondary** — a failure there produces a *completed with warnings* verdict, not a failed study, and the results stay usable. See [Study lifecycle](/docs/study-lifecycle) for the stage contract, heartbeats, ETA and failure diagnostics.

### Progress and health

Both figures come from their own endpoints and mean specific things.

| Figure | Definition | Null when |
|---|---|---|
| Progress | `min(terminal trials / n_trials, 1)` | `n_trials` is 0, or the study has no row yet |
| Health | `1 − failed trials / total trials` | the study has no trials yet |

Health bands: `≥ 0.9` good, `≥ 0.7` caution, below that poor. Trials pruned as `grid_duplicate` or `engine_artifact` are excluded from **both** sides of the health ratio.

> [!CAUTION]
> Progress counts trials in a **terminal** state, not rows. The optimizer writes a whole batch of trial rows up front, so row existence means "requested", not "finished". The `completed_trials/n_trials` figure on the metadata snapshot is a *different* number and the two disagree mid-batch by design. A completed study can legitimately sit below 100 % — that is what an exhausted finite grid looks like. Completion is signalled by status, never by progress reaching 1.0.

Polling: status, progress and health refetch every **5 seconds** while any study is `QUEUED` or `RUNNING`, widen to **30 seconds** while the realtime stream is connected, and stop entirely once everything is terminal.

### Insights band

A permanent full-width band above the table, computed over the currently visible rows.

| Section | Contents |
|---|---|
| **Overview** | Stat tiles: **Studies** (visible row count), **PBO** with the sub-label **median**, **Progress** with **avg**, **Health** with **median**, and **Graduated portfolios** |
| **PBO** | Subtitle **PBO distribution**, info **Probability of backtest overfitting. Higher is worse.**, threshold markers **caution ≥ 0.4** and **overfit ≥ 0.6** |
| **Verdict** | A segment bar over **Robust** / **Fragile** / **Overfit** / **Unknown** |
| **Graduated portfolios** | Top-three rank bars |
| **Selected** | Tiles for the focused row — **PBO**, **Verdict**, **Progress**, **Health** and **Graduated portfolios** — under the study's own name, plus the caption `<strategy> → <fitness>` |

When there is nothing to show it reads **No insights for this view.**

### Expanding a row

Every row carries a chevron labelled **Show details** / **Hide details**. Expanding renders the semantic relations map for that study, fetched lazily on first expansion. Lanes: **Studies**, **Strategies**, **Fitness**, **Asset Groups**, **Risk Managers**. Legend: **Direct link** / **Linked through a study**. Empty state: **No linked resources yet.** Error: **Couldn't load related resources.**

### Search, filter and sort

- `?q=` matches on the study name, strategy name, fitness name and author username, concatenated.
- The filter panel exposes seven fields: `name` (text), `strategy` (multiselect), `status` (multiselect), `author` (multiselect), `daily_update` (boolean), `total_trials` (number range) and `created_at` (date range). Each writes an `f_<key>` parameter.
- Filtering is entirely client-side over the already-loaded rows, so the table and the card grid stay in sync.

### Row actions

Clicking a row (or pressing Enter or Space) opens the actions popover; right-clicking opens the same items as a context menu. **No cell is a link** — that is an invariant of the registry workbench.

| Action | What it does | Disabled when | Tooltip when disabled |
|---|---|---|---|
| **Launch** | Runs a compatibility pre-check, then the token confirmation, then `POST /studies/:id/launch` | live status is not `SAVED`, a launch is in flight, or you lack create permission | **Study has already been launched.** |
| **View** | Navigates to `/analysis/portfolios?studyId=<id>` | never | — |
| **Edit** | Navigates to `/studies/edit/<id>` | live status is not `SAVED`, or you lack edit permission | **Study has already been launched and is immutable.** |
| **Duplicate** | Opens the builder pre-seeded from this study. No API call | you lack create permission | — |
| **Delete** | Opens the delete confirmation, then soft-deletes | you lack delete permission | — |

> [!NOTE]
> There is **no Stop, Pause or Resume row action in this registry.** Stop lives on the study results page reached through **View**. Resume exists as an API endpoint but has no button anywhere in this build.

Gating reads the **live** status, never the metadata snapshot — otherwise Launch would stay enabled on a study that started running a minute ago.

### Bulk actions

Selecting rows reveals the status bar: **{{count}} selected**, a **Clear selection** control, and exactly one bulk action — **Delete**, destructive-toned.

> [!CAUTION]
> Bulk delete fires **without a confirmation dialog**. The single-row Delete confirms; the bulk one does not.

### Confirmation dialogs

| Dialog | When | Copy |
|---|---|---|
| Delete confirm | Single-row **Delete** | **Are you sure you want to delete the selected study? If any, associated data will also be deleted.** Confirm is disabled while the delete is pending |
| Token cost confirm | **Launch**, when the token gate is on | Priced from `GET /studies/:id/preview-cost` rather than the generic per-trial estimate, so a memory surcharge is included. Action button: **Launch** |
| Relaunch drift guard | **Launch**, when the fresh compatibility report is partial | Title **Some tickers will be excluded**; body **This study will run on {{runnable}} of {{total}} tickers; {{excluded}} will be excluded from the universe. Continue?**; buttons **Go back** / **Launch anyway** |
| Insufficient tokens | A 402 on launch | Offers buying tokens |

Confirming the drift-guard dialog sends the accepted exclusions and window with the launch, which arms the server-side guard: the launch returns 409 if coverage worsened between the preview and the launch.

> [!WARNING]
> Three billing rejections share the launch path and mean different things. **Insufficient tokens** opens the purchase dialog. A **payment dispute** and an **exceeded spend cap** render a red toast only — buying more tokens does not lift either hold. See [Tokens and billing](/docs/tokens-and-billing).

### Feedback messages

| Message | When |
|---|---|
| **Study launched** | Launch succeeded |
| **{{count}} study created** | Save succeeded and the server kept your name |
| **Study created as "{{name}}"** | Save succeeded but the server renamed it to avoid a collision |
| **Study updated successfully** | An edit was saved from the builder |
| **Study deleted successfully** | Delete succeeded |

### Empty states

- No studies at all: **No studies yet** / **Create your first study to start backtesting strategies**.
- Empty because the workspace filter is on: an inline banner reading **You haven't created any studies yet.** / *Workspace filter is on — it is showing only yours. Your teammates' studies are still there.* with a **Show all studies** button.

### Permissions

Role is resolved from the user's group path. The backend is authoritative; the SPA gating below only decides what renders as enabled.

| Role | View | Edit | Create / launch | Delete |
|---|---|---|---|---|
| Owner | yes | yes | yes | yes |
| Admin | yes | yes | yes | yes |
| Manager | yes | yes | yes | no |
| Analyst | yes | no | no | no |

An Analyst therefore sees **New Study**, **Launch**, **Edit**, **Duplicate** and **Delete** all disabled.

> [!WARNING]
> The backend permission for `DELETE /studies` is `root:all`, not a studies-specific permission, while every other studies route checks `study:read` or `study:create`. An Owner or Admin whose token does not carry `root:all` will see an enabled Delete button and receive a 403 from the API.

## Creation wizard and advanced options

### Anatomy

The creation surface is **not a stepper**. It is one screen: a header, a canvas of four blocks, an action bar, and a final confirmation dialog that owns both writes.

```text
  ┌─────────────┬─────────────┬─────────────┬──────────────┐
  │ Asset Group │  Strategy   │   Fitness   │ Optimization │
  │  universe   │   signal    │  objective  │  budget +    │
  │  + window   │  + params   │  + params   │  advanced    │
  └─────────────┴─────────────┴─────────────┴──────────────┘
             ↓ Study name  ·  Cancel  ·  Continue
                 ┌────────────────────────────┐
                 │    Confirm your study      │
                 │ recap · cost · warnings    │
                 │ Save Draft │ Save & Launch │
                 └────────────────────────────┘
```

Each block carries a *why* popover explaining what it decides. Blocks turn from empty to populated as you fill them, and show their own validation errors inline.

| Mode | Header title | Header subtitle |
|---|---|---|
| Create or duplicate | **New Study** | **Select asset groups, a strategy, and a fitness function, then configure and launch.** |
| Edit | **Edit Study** | **Modify configuration and re-save. Only saved (never-launched) studies can be edited.** |

### Block 1 — Asset Group

*Why*: **The universe and the period.**

| Control | Label | Type | Default | Rule |
|---|---|---|---|---|
| Group picker | **Select asset group** | searchable select, placeholder **Search clusters…** | none | Required. Error: `Select at least one asset group.` |

The picker groups its options in this order:

1. **Written for this universe** — only the asset group the selected strategy declares as its own universe binding.
2. **Asset Groups** — your organization's saved groups, each with an asset-class badge.
3. **Platform sets (indices, sectors, ETFs)** — curated collections, indices, sectors, sector ETFs, countries and industries. Picking one materializes a derived group behind the scenes.

> [!WARNING]
> **Exactly one asset group per study.** Picking a different group *replaces* the current one — it never appends. The old multi-group fan-out (one study per group, with `_1` / `_2` name suffixes) is retired.

Once a group is chosen its name becomes the block title with an ✕ to swap it, and the subtitle reads **{{count}} selected**.

#### Dates

The date editor is always visible under the selected group.

| Field | Label | Type | Default | Validation |
|---|---|---|---|---|
| Window start | **Start date** | native date; min/max clamped to the group's own data coverage | trailing 5 years, clamped to the earliest covered day | Must be before the end date. Error: **Start date must be before end date.** |
| Window end | **End date** | native date, same clamps | the group's coverage anchor (latest fully-covered day) | — |

Hint on the pair: *The whole period the study runs on, split below into train, validation and out-of-sample. The bounds are this asset group's own data coverage, so a date it has no data for cannot be picked.*

Beneath the fields, a coverage bar reads **Ticker coverage through end date** with **{{pct}}% — {{covered}} of {{total}}**, coloured green at 95 % and above, amber at 75 % and above, red below.

#### Date advanced options

An **Advanced options** accordion inside the Asset Group block.

| Control | Label | Type | Default | Notes |
|---|---|---|---|---|
| Quick fill | **Quick fill** | preset chips | — | **Last 1Y / Last 2Y / Last 5Y / Last 10Y** (*Through latest data*), **After COVID** (*Post-crash regime*, starting 2020-04-01), **Earliest · any** and **Latest · any** (*≥1 ticker*), **Earliest · full** and **Latest · full** (*All tickers*). Duplicate windows are dropped; each chip's tooltip shows `<start> → <end>` |
| Out-of-sample | **Include out-of-sample period** | switch | **on** for a new group; a seeded group keeps what the study persisted | Hint: *Holds back the last slice of the window and never optimizes on it, so there is one period the search has not seen. Judge it once, at the end.* |
| Split | **Train / validation split** | slider, min 5, max 95 | 70 % train | Tooltip: **Adjust the proportion of train vs. validation within the non-OOS window** |
| OOS share | **OOS size** | slider, min 1, max 90 | **10 %** | Tooltip: **Grows OOS from the end; Train and Validation shrink proportionally** |

Below the sliders a **Period breakdown** bar shows **Train** / **Validation** / **OOS** as integer percentages, and a distribution table lists **Train**, **Validation**, **OOS** and **Total** as `from → to ({{count}} days)`.

Boundaries are derived and auto-saved on every change:

```text
train_start_date      = start
train_end_date        = the date at train% between start and end
validation_start_date = train_end_date            (contiguous, no gap)
validation_end_date   = start..end at (100 − oos%)   when OOS is on
                      = end                          when OOS is off
oos_end_date          = end                          when OOS is on, otherwise absent
```

> [!WARNING]
> There is **no walk-forward or rolling-window option.** A study uses a single train / validation / out-of-sample partition of one contiguous window. Anchored or rolling re-optimization is not a study setting.

#### Data compatibility

A read-only panel under the dates, headed **Data compatibility**. It evaluates the strategy, the risk managers, the parameter ranges and the eligibility policy against the chosen group and window.

| Element | Values |
|---|---|
| Tier chip | **Total** · **Partial** · **Partial (window)** · **Partial (mixed)** · **Incompatible** |
| Coverage line | **{{covered}} of {{total}} tickers runnable** |
| Window line | **Common data window {{start}} → {{end}}** |
| Exclusions | **Excluded tickers**, up to 12 chips then **+{{count}} more** |
| Exclusion reasons | **no data** · **zero volume** · **shorter common window** · **no window covers every ticker at once** · **lists too late for warmup** · **lists after start** · **delisted in window** · **below min coverage** |
| Extra sections | **Risk-manager data requirements** · **Fitness data needs** · **Risk-manager data needs** · **Instruments this strategy names** |

### Block 2 — Strategy

*Why*: **What generates the positions.**

| Control | Label | Type | Default | Rule |
|---|---|---|---|---|
| Strategy picker | **Select strategy** | searchable select, placeholder **Search strategies…** | none | Required. Error: `Select a strategy.` |

> [!WARNING]
> Changing the strategy **wipes** the parameter configuration and every attached risk manager. Pick the strategy before you tune anything.

#### Parameter bounds

The **Parameters** section renders one row per declared strategy parameter, ordered integers first, then floats, then categoricals. Empty states are **No configurable parameters.** and **Select a strategy to configure parameters.**

Each row shows the parameter name in monospace, an info hint, a dtype chip (`integer`, `float` or `categorical`) and a segmented control with two positions, **Fixed** and **Optimized**.

| Row kind | Controls | Default for the dtype | Persisted as |
|---|---|---|---|
| Optimized numeric | **min** and **max** number fields; step 1 for integers, free for floats | the default for numeric parameters | `{ "minimum": n, "maximum": n }` |
| Fixed numeric | one **value** field | — | `{ "value": n }` |
| Optimized categorical | a multi-select **Choices** over the strategy's declared choices | the default for categorical parameters | `{ "choices": ["a","b"] }` |
| Fixed categorical | one **value** select | — | `{ "value": "label" }` |

Flipping between Fixed and Optimized restores whatever you previously typed on the other side.

The info hint is composed from the author's own description plus a dtype sentence (**A whole number.** / **A decimal number.** / **One of a fixed set of choices.**), the declared choices, the current state (**Searched from {{min}} to {{max}}.**, **Held fixed at {{value}} — the search will not vary it.**, **Searching {{selected}} of the {{declared}} declared choices.**, or **No range set yet, so the study cannot be submitted.**), and **Contributes {{points}} points to the search grid.** when that count is finite and greater than one. For a lookback-window parameter it adds: **Used as a lookback window, so its MAXIMUM decides how much history the study needs before the start date.**

### Block 3 — Fitness

*Why*: **What the search is trying to improve.**

| Control | Label | Type | Default | Rule |
|---|---|---|---|---|
| Fitness picker | **Select fitness function** | searchable select, placeholder **Search fitness functions…** | none | Required. Error: `Select a fitness function.` |
| Fitness parameters | **value** per declared parameter | number | empty — the field is blank until you type, and is only pre-filled from the study you are editing or duplicating | Rendered only for a non-built-in fitness |

Fitness parameters are constants, not search dimensions: **Objective parameters are constants: the same value is used in every trial, and the search never explores them.** When the function declares none, the section reads **This fitness function has no parameters.**

> [!NOTE]
> A **built-in** fitness renders no parameter section and takes no fitness asset group. The server rejects both outright: **Built-in fitness objectives do not accept fitness_params** and **Built-in fitness objectives do not use a fitness asset group**.

If a custom fitness has no asset group of its own the builder warns: `No asset group selected. The strategy cluster will be used for fitness evaluation.`

### Block 4 — Optimization

*Why*: **How the search runs, and what it costs.**

#### Run configuration

One field is always visible, under the heading **Run Configuration**.

| Field | Label | Type | Default | Validation |
|---|---|---|---|---|
| Trial budget | **Number of trials** | number, min 1, step 10 | **1000** | Clamped client-side to at least 1. Error: `Number of trials must be greater than 0.` No upper cap in the UI |

Hint: *How many parameter combinations to try. More trials search more of the space and cost proportionally more tokens. When the space is finite and smaller than this number, the study stops once every combination has run.*

When the strategy's parameter grid is finite the block adds derived feedback:

- **Search space: {{size}} combinations**
- At or below 1,000,000 combinations: **Finite grid ({{size}} combinations): configurations are enumerated as a grid search — each tried at most once, no repeats — so the sampler below isn't applied.**
- When the budget exceeds the grid: **The search space has only {{combos}} combinations — fewer than the {{nTrials}} trials requested. The study stops early once every combination has been explored.**

The grid cardinality is computed identically in the browser, the backend and the optimizer:

| Parameter shape | Contributes |
|---|---|
| Fixed numeric or fixed choice | 1 |
| Choices | the number of selected choices |
| Integer range | `trunc(max) − trunc(min) + 1` |
| Float range with grid precision `d` | `floor((max − min) / 10^-d) + 1` |
| Float range without grid precision | infinite (float with `min == max` counts as 1) |

> [!TIP]
> The builder's preview counts the **strategy** dimensions only. The authoritative `grid_size` the server reports also multiplies in the risk-manager attachment dimensions.

#### Optimization advanced options

An **Advanced options** accordion holds everything else, in five sections. It auto-expands when the study already carries risk-manager attachments.

**1 — Optimization objective**

| Field | Label | Type | Default | Notes |
|---|---|---|---|---|
| Direction | **Optimization objective** | segmented control: **Maximize** / **Minimize** | `NOT_SET` | Displayed as the fitness's own natural direction until you change it |

Caption: **Whether the optimizer maximizes or minimizes the fitness. Defaults to the metric's natural direction; set at creation and frozen after launch.**

> [!WARNING]
> `NOT_SET` is not "maximize". It means *inherit the objective's natural direction*, so a lower-is-better built-in metric minimizes under the default. The direction is frozen once the study launches — the optimizer's own study direction is immutable.

**2 — Benchmark**

| Field | Label | Type | Default | Notes |
|---|---|---|---|---|
| Benchmark | **Benchmark** | select | **Auto — one per asset group** | Other options: **No benchmark**, then every selectable catalog entry rendered as `<label> · <exchange_code>` |

Caption: **Alpha, beta, information ratio and capture are measured against this. Auto picks the right one for each asset group you selected.** Choosing **No benchmark** switches the caption to **No benchmark-relative metrics (alpha, beta, information ratio) will be computed for this study.**

The value is tri-state on the wire: `auto` omits the field so the server resolves a baseline for the group's asset class; **No benchmark** sends `null`; a pick sends that instrument's numeric id. A study saved with no benchmark must not be re-read as "auto".

> [!NOTE]
> This is what benchmark-relative [metrics](/docs/metrics-reference) are computed from — it is not a series your strategy code can read. To read a benchmark inside the code, add the *Benchmarks & reference series* data source to the strategy instead.

**3 — Optimization engine**

| Field | Label | Type | Default | Validation and behaviour |
|---|---|---|---|---|
| Sampler | **Sampler** | select, options fetched live | **TPE** | Each option carries its description in a tooltip. While the list loads: **Loading samplers…**. Error: `Select a sampler.` |
| Grid precision | **Grid precision (decimals)** | number, min 0, max 12, step 1, placeholder **Default** | empty (continuous) | Helper: **Decimals the search grid uses for float parameters. Leave empty for the default (continuous).** Error: `Grid precision must be a whole number of decimals between 0 and 12.` |
| Autostop | **Stop early if health drops below threshold** | switch | **on** | When on, shows **Failure threshold: {{pct}}%** and a slider from 1 to 99 |
| Failure threshold | (the slider under the switch) | slider, step 1 | **30 %** | Persisted as `autostop_min_health = 1 − pct/100`, so the default stores `0.7` |
| Daily updates | **Recalculate daily after market data arrives** | switch | **off** | Reaches the daily-updates endpoint, which is entitlement-gated |

The sampler catalog is served from the backend and has exactly seven entries:

| Key | Label | Runs distributed | Recommended budget |
|---|---|---|---|
| `TPE` | TPE (Tree-structured Parzen Estimator) | yes | 100 – 1000 |
| `CMAES` | CMA-ES (Covariance Matrix Adaptation) | yes | 1000 – 10000 |
| `RANDOM` | Random | yes | not specified |
| `QMC` | QMC (Quasi-Monte Carlo) | yes | not specified |
| `NSGA2` | NSGA-II (Genetic Algorithm) | yes | 100 – 10000 |
| `QAOA` | QAOA — Quantum Optimization (emulated) | **no** | 50 – 500 |
| `QKERNEL` | Quantum-Kernel Bayesian Optimization (emulated) | **no** | 30 – 300 |

Read [Sampler selection](/docs/sampler-selection) for which to pick and why, including the speed-versus-quality trade-off and the grid auto-switch that makes the sampler a no-op on a small finite grid.

Autostop hint: *Ends the study early when too many trials are failing, instead of paying for a run that cannot produce results. It only starts watching after the first ten trials have finished.*

**4 — Eligibility rules**

Headed **Eligibility rules**, with preset chips derived from the flags rather than stored: **Runnable subset**, **Full cluster**, **Strict**, and a read-only **Custom** chip when the flags match no preset.

| Rule | Title | Default | Caption |
|---|---|---|---|
| Hard requirement | **No price data in window** | always on, locked | **Hard requirement · strategy needs data** |
| `insufficient_warmup` | **Insufficient warm-up history** | **on** | When off: **Off keeps late-listing tickers — they contribute signal only once warm.** |
| `listed_after_start` | **Listed after the study start** | off | — |
| `delisted_in_window` | **Delisted / data ends before the window end** | off | **Keeping delisted tickers avoids survivorship bias.** |
| `below_min_coverage` | **Below minimum coverage** | off | **Drops tickers present for less than the minimum share of the window's trading days.** Turning it on reveals **Min coverage**, a 1–100 % field defaulting to **90** |

Each row prints its live impact on the right: **removes none**, **removes {{count}}**, **would remove {{count}}**, **enable to preview** (min-coverage while off), or **—** while the compatibility report loads. When hard requirements bite, a red line reads **{{count}} ticker(s) excluded because the strategy needs data they lack**.

One launch-behaviour switch sits below the rules: **Require every ticker eligible**, default off, hint **Blocks the launch if any active rule would exclude a ticker.**

The policy persists as:

```json
{
  "exclude_insufficient_warmup": true,
  "exclude_listed_after_start": false,
  "exclude_delisted_in_window": false,
  "min_coverage_ratio": null,
  "require_full_universe": false
}
```

`min_coverage_ratio` must be between 0 and 1 or the server answers 406 **`min_coverage_ratio must be between 0 and 1 (got {r})`**.

**5 — Risk Managers**

Headed **Risk Managers**, or **Risk Managers ({{count}})** once anything is attached.

Intro: **Optional. Attach risk managers to this study so the optimizer tunes their thresholds alongside the strategy. The same selection will be applied to every study created from this wizard.**

Under the intro sits an execution-order legend — **Halts / closes** → **Sells** → **Buys** → **Strategy rebalance** — whose tooltip reads *Each backtest step runs in this order: attached risk managers halt/close/sell/buy first, then the strategy's own rebalance runs last. Within the same zone, ties break by each risk manager's execution order (the ↑/↓ control on its card).*

| Control | Behaviour |
|---|---|
| **Add risk manager** | Opens a picker grouped as **Built-in** and **Registered (rule-based / custom code / external)**. Empty built-ins read **No built-ins available for this strategy. Strategy-type compatible RMs that need extra data declarations are listed below.** |
| **Preview stack** | Runs one representative backtest with midpoint parameter values and the full stack applied in order (halts → sells → buys → strategy rebalance). Nothing is saved. States: **Running the stack backtest…**, **The stack preview failed.**, **Not previewable in the sandbox and excluded from this run: {{names}}. They still apply in the real study.** |
| Attachment card | Chips **built-in · {{name}}**, **rule-based**, **custom code**, **external endpoint**, **registered**; controls **Move up**, **Move down**, **Remove**; sections **Parameters** and **Fixed parameters**; empty **No optimizable params — the engine will use the risk manager's static params.** |
| Re-entry policy | Section **After an exit** with the switch **Hold the name out after this closes it** and the field **Trading days out** (*Counting the day it exited. 0 keeps it out for the rest of the run.*) |

Some static parameters are marked **auto-resolved at runtime** — *This value is auto-injected from ticker metadata when the study runs — you don't set it here.* List-valued parameters show the hint **JSON list, e.g. ["Sat","Sun"]** and reject anything else with **Must be a valid JSON list.**

Risk-manager attachments travel inline with the create payload and are persisted in the same transaction as the study. On an **edit**, they are written through a separate replace call and only when the risk-manager section is actually dirty.

### External strategy reminder

When the selected strategy runs externally, the builder adds a reminder under the canvas:

> [!WARNING]
> **External strategy: every ticker your endpoint returns must also exist in the selected Asset Group. Any signal ticker missing from the cluster will fail those trials. Tip: use "Validate" in the strategy editor to check your endpoint's tickers against the cluster before launching.**

### Action bar

| Control | Label | Behaviour |
|---|---|---|
| Name | **Study name** | Required. Error **Give the study a name** once a strategy is picked and the field is blank. In create mode only, a collision warns **That name is taken — it will be saved as "{{name}}"** before you submit |
| Issue counter | **{{count}} issue to resolve** / **{{count}} issues to resolve** | Appears while the form is invalid; hovering lists every error |
| Launch-gate warning | **This strategy can't run on the selected data — resolve the compatibility issues below.** | Appears when the form is valid but the compatibility gate blocks a launch |
| Cancel | **Cancel** | Returns to the list |
| Continue | **Continue** | Opens the confirm dialog. Disabled while the form is invalid or a save is in flight. **Never** gated by the launch gate — only launching is |

The name defaults to `<strategy> · <asset group>` and keeps recomputing as you change either, until you type a name of your own.

Name hint: *How you will find this study later. It does not have to be unique — if the name is taken, a number is added.*

### Validation messages

The builder validates synchronously on every change. These strings are exact.

| Block | Messages |
|---|---|
| Asset Group | `Select at least one asset group.` · `Cluster <id>: date range is incomplete.` · `Cluster <id>: train start must be before train end.` · `Cluster <id>: validation start must be before validation end.` · `Cluster <id>: train and validation periods overlap.` |
| Strategy | `Select a strategy.` · `Parameter "<name>" is not configured.` · `Parameter "<name>" is missing min/max bounds.` · `Parameter "<name>" has invalid values.` · `Parameter "<name>": min must be less than max.` · `Parameter "<name>" needs a fixed value.` · `Parameter "<name>" has an invalid fixed value.` · `Parameter "<name>": the fixed value must be an integer.` · `Parameter "<name>": select at least one choice.` · `Parameter "<name>": choices not declared by the strategy: <list>.` · `Parameter "<name>" needs a fixed choice.` · `Parameter "<name>": "<value>" is not one of the strategy's choices.` |
| Fitness | `Select a fitness function.` — plus the warning `No asset group selected. The strategy cluster will be used for fitness evaluation.` |
| Optimization | `Select a sampler.` · `Number of trials must be greater than 0.` · `Grid precision must be a whole number of decimals between 0 and 12.` — plus the warning `The search space has only <n> combinations — the study will stop early once all are explored.` |
| Name | `Name your study.` |

### Confirm dialog

Titled **Confirm your study**, subtitled **Save it as a draft to launch later, or save and launch now.** This dialog owns both writes.

Recap rows: **Study name**, **Asset group**, **Strategy**, **Fitness**, **Trials**, **Data range** (`start → end`), and **Out-of-sample** reading **Included** or **Not included**.

A **Cost** block follows:

| Row | Content |
|---|---|
| **Optimization ({{trials}} trials)** | The base token cost |
| **Extra memory ({{gb}} GB machine)** | Only when a memory surcharge applies |
| **Total** | The charge |
| **Your balance** | Your current token balance |

Note: **Charged when the study launches. Whatever it doesn't use is refunded automatically when it finishes.** While the quote loads: **Calculating cost…**

| Alert | When |
|---|---|
| **This study needs {{gb}} GB of memory instead of the standard {{defaultGb}} GB, because of how many assets it loads, how long a date range it covers, and how memory-heavy the strategy is. The extra {{pct}}% covers exactly what the larger machine costs us — nothing more.** | A memory surcharge applies |
| **We've reserved {{gb}} GB for this study, but we haven't measured how much memory the strategy really needs — so you're charged the standard rate. Re-save the strategy to have it measured.** | The strategy's memory intensity has never been measured |
| **This study needs so much memory that it has to run with fewer parallel workers, so it will take about {{multiplier}}x longer than usual.** plus the checkbox **I understand this study will take longer** | The worker pool has to be clamped. **Save & Launch** stays disabled until the box is ticked |
| **This study may need more memory than our largest machine has. We'll still try it, but consider using fewer assets or a shorter date range.** | The estimate exceeds the largest available machine |
| **You don't have enough tokens for this study.** | The total exceeds your balance |
| **A data source starts after your study does** / **These sources have no data for the earliest part of your window, so trials over that period may produce no positions at all: {{sources}}. Move the study start to their range, or remove them from the strategy.** | A gating data source starts late |

Buttons: **Cancel** · **Save Draft** · **Save & Launch**.

> [!NOTE]
> **Save Draft is never gated** by the compatibility launch gate or by cost. **Save & Launch** is disabled while saving, while the launch gate blocks, when the study is unaffordable, or when a worker clamp has not been acknowledged.

The launch gate blocks — not just warns — when any compatibility report is incompatible, when a risk manager has unmet data requirements, when a gating data source has **no overlap at all** with the window, or when **Require every ticker eligible** is on and any ticker would be excluded. Its extra copy:

- **These sources have no data anywhere inside your study window, so no trial could produce a result: {{sources}}. Move the study window onto their range, or remove them from the strategy.**
- **The full Asset Group is required, but {{excluded}} ticker(s) would be excluded ({{breakdown}}). Widen the start date, edit the cluster, or turn off "Require every ticker eligible".**
- **This strategy is written for {{tickers}}, and this asset group does not contain it — there would be nothing to trade. Pick a group that has it, or add it to this one.**

### Server-side validation

`POST /studies` runs these checks in order. Each returns 406 Not Acceptable unless noted — the platform's validation-rejection code, not 400.

| # | Check | Message |
|---|---|---|
| 1 | Create permission | 403 |
| 2 | `grid_decimals` in 0–12 | **`grid_decimals must be between 0 and 12 (got {d})`** |
| 3 | `optimization_direction` is one of three values | **`optimization_direction must be one of NOT_SET, MINIMIZE, MAXIMIZE (got {bad})`** |
| 4 | `min_coverage_ratio` in 0–1 | **`min_coverage_ratio must be between 0 and 1 (got {r})`** |
| 5 | Studies quota | 402 / paywall |
| 6 | Fitness exists | **We couldn't find that fitness function. It may have been deleted, or you don't have access to it.** |
| 7 | Strategy exists | **We couldn't find that strategy. It may have been deleted, or you don't have access to it.** |
| 8 | Parameters align with the strategy's declarations | per-parameter message |
| 9 | Built-in fitness invariants | **Built-in fitness objectives do not accept fitness_params** / **Built-in fitness objectives do not use a fitness asset group** |
| 10 | Strategy asset group exists | **We couldn't find that Asset Group for the strategy. Pick one from the list.** |
| 11 | Warm-up window fits (compiled from each range's **maximum**) | 503 **Fintela's strategy compiler is momentarily unavailable, so the study's warmup window can't be computed right now. Try again in a few seconds.** when the compiler is down |
| 12 | Asset group date coverage | coverage message |
| 13 | Fitness asset group exists, if given | **We couldn't find that Asset Group for the fitness function. Pick one from the list.** |
| 14 | Plan trial ceiling | **clamped silently**, not rejected |
| 15 | Grid clamp, only when launching now | `n_trials` capped at the finite search space |

> [!CAUTION]
> Step 14 is a silent clamp. If your plan caps trials per study, a larger `n_trials` is reduced server-side without a message in the response and without any cap shown in the builder.

Editing is gated to drafts only. A `PATCH` on a launched study returns 409 **`This study has already been launched, so it can't be edited. Duplicate it to change anything. (study {id})`**, and a second launch returns 409 **`This study has already been launched, so it can't be launched again. Duplicate it to run a new one. (study {id})`**.

Creation is idempotent through a client request id minted per attempt and resent on retry, so a network retry cannot create two studies.

### Fields the study form does not have

Documented explicitly, because they are commonly assumed.

| Assumed field | Reality |
|---|---|
| Walk-forward / rolling re-optimization | Does not exist. One train / validation / OOS partition of one window |
| Pruner | Does not exist. There is no pruner setting in the UI or the payload |
| Random seed | Does not exist. You cannot pin a study's seed |
| Parallelism / worker count | Not a user setting. Task and worker layout is derived server-side — see the execution modes section below |
| Multi-objective configuration | Does not exist. A study has exactly one objective and one direction. NSGA-II is offered as a single-objective sampler |
| Initial capital | Belongs to the strategy and the backtest engine, not to the study |
| Commissions, slippage, fees | Belong to the engine, not to the study |
| Rebalance frequency | Belongs to the strategy, not to the study |
| Trial cap in the builder | The builder shows no ceiling. Any plan cap is applied silently server-side |

## Execution modes

A study does not have an execution mode of its own. Its mode is inherited from its components: a study runs **externally** if the strategy is external, **or** the fitness function is external, **or** both. Everything else is internal. Mixed studies — an internal strategy with an external fitness, or the reverse — are supported and common.

### Internal

Both the strategy and the fitness run as Python inside Fintela against a deterministic function signature. The study is dispatched as the platform's default number of tasks, each sizing its process pool from the machine it lands on. Task memory is sized from the strategy's measured memory profile, which is what drives the surcharge and worker-clamp alerts in the confirm dialog.

### External

Any external component makes the run I/O-bound — your server does the compute — so the study is dispatched as **exactly one task**, whose worker pool is sized to your declared `max_concurrency`.

| Situation | Worker budget |
|---|---|
| External strategy only | the strategy's `max_concurrency` |
| External fitness only | the fitness's `max_concurrency` |
| Both external, different endpoints | the **smaller** of the two |
| Both external, same normalized endpoint | the smaller of the two, **halved** (floored, minimum 1) |
| `max_concurrency` missing or non-positive on an external row | treated as unbounded; falls back to the internal default and logs a warning |

The single-task layout is not an accident: it guarantees your server sees exactly `max_concurrency` in-flight requests, and it keeps the sampler coordinated inside one process. External runs also get a lower CPU and memory ladder than the internal training baseline, since they are waiting on HTTP rather than computing.

See [External strategies](/docs/external-strategies), [External fitness](/docs/external-fitness) and [Execution modes](/docs/execution-modes) for the endpoint contracts.

> [!WARNING]
> Every ticker your external strategy's endpoint returns must also exist in the study's asset group. A signal for a ticker outside the group fails that trial.

### Where External does not apply

- **The study itself has no External option.** There is no execution-type field in the builder, no execution-type column in the registry and no execution type on the study payload. You cannot host a study.
- **Asset groups are always internal.** The universe is Fintela data; there is no external asset group to point a study at.
- **Risk managers may be external**, but that does not change the study's task layout — only the strategy's and the fitness's `execution_type` are read when computing it.
- **The eligibility policy, the compatibility report and the frozen launch snapshot are computed internally** in every mode, including for an external strategy.

### Sampler-driven task layout

Two samplers are non-distributed and force a single task regardless of everything above:

| Sampler | Tasks |
|---|---|
| `QAOA` | 1 |
| `QKERNEL` | 1 |
| all others | the platform default, subject to the external rule above |

Both keep their own in-process surrogate, and both bypass the finite-grid auto-switch that would otherwise replace the sampler with an exhaustive grid enumeration.

For the dispatcher's full decision path, memory sizing and the in-task memory guard, see [Optimizer architecture](/docs/optimizer-architecture).
