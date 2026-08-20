---
title: Laboratory
section: Features
sectionOrder: 7
order: 1
published: true
updated: 2026-08-18
summary: A notebook workspace for authoring and testing strategies, fitness functions and risk managers.
keywords: laboratory, notebook, kernel, session, workspace, editor, sdk, files, catalog, lab
---

The Laboratory is Fintela's authoring workbench: one page that puts a private file tree, a live
Python kernel and the editors for [strategies](/docs/strategies),
[fitness functions](/docs/fitness-functions) and [risk managers](/docs/risk-managers) side by side.
You open a notebook, run cells against a real kernel that keeps its variables between runs, pull
curated market data through the built-in `lab` SDK, and — when the code works — promote it straight
into a registry resource without leaving the page. It is additive: every standalone registry page
still works, and the Lab embeds those same editors rather than forking them.

## Where the Laboratory lives

| Item | Value |
|---|---|
| Route | `/laboratory` |
| Feature key | `laboratory` |
| Nav label | `Laboratory` |
| Sidebar placement | the **More Options** flyout, not the visible Registry section |
| Entitlement lock | `laboratory` |
| Onboarding tour | id `laboratory`, two steps, skipped on mobile, suppressed while the feature is locked |

The route also mounts `/laboratory/view/:id` and `/laboratory/edit/:id`, because every registry
feature gets those paths from the shared routing machinery. The Laboratory **ignores both params** —
it manages open resources as in-memory tabs, so all three paths render the identical shell.

> [!WARNING]
> `/laboratory/edit/:id` is not a deep link. Opening it gives you the Lab with no tab open, exactly
> like `/laboratory`. To open a specific resource, click it in the Explorer.

The Laboratory entry is registered in the Registry feature set (so its route resolves) and in the
"More Options" set (so the sidebar renders it inside the flyout instead). See
[navigation](/docs/navigation) for how that flyout behaves. There is no Laboratory entry in the
mobile bottom navigation, which is hand-maintained and lists only Portfolios, Markets, Asset Groups,
Fitness Functions, Strategies and Studies.

## Access and the laboratory lock

`laboratory` ships inside the default `locked_features` array, so on a non-activated organization
the feature is locked out of the box. Locked is not hidden: the nav entry stays in the flyout and
stays clickable, dimmed with a lock glyph, tooltip `Locked — buy tokens to unlock` and badge
`Locked`. Opening the page renders the real workbench blurred, `inert` and `aria-hidden` behind a
frozen query client, with a centred panel:

| Element | Text |
|---|---|
| Title | `Feature locked` |
| Body | `Buy tokens to unlock this feature.` |
| CTA | `Buy tokens` → `/account?section=tokens` |
| Caption | `This is a preview — your real data appears once unlocked.` |

Only **starting a compute session** is gated at the API level. `POST /lab-sessions` is the single
Laboratory endpoint that calls the entitlement guard, and it answers HTTP 402:

```json
{
  "message": "This feature is available on paid accounts. Buy tokens to unlock it.",
  "error": "feature_locked",
  "feature": "laboratory",
  "upgrade": "purchase_tokens"
}
```

Stopping, polling and heartbeating a session are deliberately left open on every tier. A live
session is metered per minute, so locking someone out of ending one would make them burn their own
tokens. The resource tree, the public catalog, share, fork and every `/lab-files/*` route carry no
entitlement check either.

### Permissions

Role checks are per endpoint, not per page. There is no single role that "opens the Lab".

| Endpoint | Permission required |
|---|---|
| `GET /laboratory/tree` | none — resolves your organization and user from the token |
| `GET /laboratory/public` | returns only the slices you hold `strategy:read` / `fitness:read` / `risk_manager:read` on |
| `PATCH /laboratory/:resource_type/:id/share` | `{type}:update` **and** full organization scope on the row |
| `POST /laboratory/:resource_type/:id/fork` | `{type}:create`, plus the matching creation quota |
| `/lab-files/*` | none — every query is filtered by your organization **and** your user id |

A missing role returns HTTP 403 `Missing {permission}:update permission` or
`Missing {permission}:create permission`. An unrecognised `:resource_type` returns HTTP 404
`Unknown resource type '{x}'`.

## The workbench layout

```text
┌─────────────┬──────────────────────────────────────────┬────────────┐
│  EXPLORER   │  tab bar          [session chip]  [New ▾] │  DOCK      │
│  (288 px)   ├──────────────────────────────────────────┤ (260–560,  │
│             │                                          │  def. 340) │
│ My Workspace│   notebook  ·  text file  ·  or an        │ Variables  │
│  folders    │   embedded registry editor               │ Data &     │
│  notebooks  │                                          │  Resources │
│  files      │                                          │ SDK        │
│             │                                          │            │
│ Resources   │                                          │            │
│  Strategies │                                          │            │
│  Fitness    │                                          │            │
│  Risk Mgrs  │                                          │            │
└─────────────┴──────────────────────────────────────────┴────────────┘
```

With no tab open the centre shows a welcome pane: `Welcome to the Laboratory`, subtitle
`Build, edit, and compile your strategies, fitness functions and risk managers — all in one place.`,
a primary `New notebook` button, secondary `Strategies` / `Fitness Functions` / `Risk Managers`
buttons, and the hint `Pick a resource from the explorer, or create a new one to get started.`

Notebook and text-file tabs stay mounted when you switch away — cells, Monaco view state and an
in-flight cell stream all survive. Resource-editor tabs are remounted on switch.

Tab badges are the first two characters of the group label (`ST`, `FI`, `RI`) for resource tabs,
`NB` for notebooks and `TXT` for text files. A create tab is titled `New`; the close icon is
tooltipped `Close`. The `New ▾` menu at the right of the tab bar offers `New notebook`, then a
divider, then `Strategies`, `Fitness Functions`, `Risk Managers`.

## The Explorer

The 288 px left rail is headed `Explorer` and carries a globe button (`Public catalog`), a refresh
button (`Refresh`) and a search box placeholdered `Search resources…`. One query filters both
sections: the resource groups drop non-matching rows, and the workspace tree prunes to matches plus
the ancestor folders needed to reach them, forcing those folders open. A failed load shows
`Couldn't load your resources.`

### My Workspace

Your private folder / notebook / file tree, headed `My Workspace`. It is scoped to **you**, not to
your organization: every query filters on your organization *and* your user id, so a node id alone
never reaches another member's file. Empty state: `No files yet. Create a notebook or folder to get
started.` A load failure shows `Couldn't load your workspace.`

The `+` button (`New…`) and each folder's row menu offer `New folder`, `New notebook`, `New file`.
Every node's menu adds `Rename`, `Move`, `Delete`.

| Create action | Dialog title | Prefilled name |
|---|---|---|
| Folder | `New folder` | `New folder` |
| Notebook | `New notebook` | `Untitled.ipynb` |
| File | `New file` | `script.py` |

The dialog has a `Name` field, a `Folder` picker whose root option reads `/ (root)`, and
`Cancel` / `Create` buttons. Nodes sort folders first, then case-insensitively by name.

| Dialog | Copy |
|---|---|
| Move | title `Move "{{name}}"`, select `Destination folder`, buttons `Cancel` / `Move` |
| Delete a leaf | title `Delete?`, body `Delete "{{name}}"? This can't be undone.` |
| Delete a folder | title `Delete?`, body `Delete folder "{{name}}" and everything inside it? This can't be undone.` |

The move destination list excludes the node itself and its entire subtree, so a folder can never be
moved inside itself. Deleting a folder soft-deletes the whole subtree and the response reports how
many nodes went with it.

Success toasts: `Folder created`, `File created`, `File renamed`, `File moved`, `File deleted`.

> [!CAUTION]
> Deleting a folder deletes everything inside it. There is no undo and no trash view in the Lab.

### Resources

Below the workspace, headed `Resources`, sits a read-only aggregation of everything **your
organization** can author, in this fixed order:

| Group | Resource type | Registry route for the same rows |
|---|---|---|
| `Strategies` | `strategy` | `/strategy` |
| `Fitness Functions` | `fitness` | `/fitness` |
| `Risk Managers` | `risk_manager` | `/risk-managers` |

There are three authoring types, not four. Several code comments still say "all four" — the fourth
was Data Pipelines, which has been retired along with its database tables.

Each group header carries a count chip and a `+` button tooltipped `New`. An empty group reads
`Nothing here yet`; a row with no name renders `Untitled`. Rows you created carry a person glyph
tooltipped `Created by you` and a globe glyph that toggles public sharing (`Share publicly` /
`Stop sharing`).

Built-in risk managers are filtered out server-side — they have no editable body. If one does reach
an editor tab you get `This risk manager can't be edited here.`

The tree is organization-scoped, ordered by `updated_at` descending, and capped at 2000 rows per
type; a slice that hits the cap is silently truncated to the most recently updated rows.

## Compute sessions and the kernel

Opening `/laboratory` requests a session immediately. A session is one dedicated AWS Fargate task
running a persistent `ipykernel`, reachable only from inside the VPC and proxied by the backend.

While the session warms up the page is replaced by a boot screen:

| Element | Copy |
|---|---|
| Title | `Preparing your Laboratory…` |
| Subtitle while `requested` / `creating` | `Starting your compute session. This takes a few seconds.` |
| Subtitle while `provisioning` | `Provisioning your kernel…` |
| Escape button | `Continue without waiting` |

The escape button appears after 6 seconds, or immediately if the session errors (the error text is
shown verbatim in a warning alert). The Explorer, the file workspace and the registry editors all
work without a live kernel — only running code needs one.

### Session states

| Status | Chip label | Chip colour |
|---|---|---|
| `creating` | `Starting…` | info |
| `requested` | `Starting…` | info |
| `provisioning` | `Provisioning…` | info |
| `ready` | `Lab ready` | success |
| `idle` | `Idle` | default |
| `stopping` | `Stopping…` | warning |
| `stopped` | `Stopped` | error |
| `failed` | `Failed` | error |

`creating` is a client-side pseudo-status shown before the create call returns an id; the database
stores the other seven. An open notebook adds its own kernel chip **only while the session is not
`ready`** — `Kernel starting…` (for `creating`, `requested` and `provisioning`), `Kernel idle`,
`Kernel stopping…`, `Kernel stopped`, `Kernel failed`. Once the kernel is up the chip disappears
rather than saying so; the `Lab ready` chip in the tab bar is the positive signal.

The page polls every 2 seconds while starting and every 30 seconds once `ready` or `idle`, and stops
polling on `stopped` or `failed`. A realtime event on the `lab_sessions` topic wakes the poll early
on any transition; the event carries no payload of its own.

### One session per user, and how it ends

A unique index on `(organization_id, user_id)` over the live statuses means **one live session per
user, per organization**. Requesting another returns the existing one — remounting the page or
opening a second tab never spawns a duplicate kernel. Creation answers HTTP 202 Accepted while the
task warms up.

| Trigger | Behaviour |
|---|---|
| Idle timeout | `idle_deadline_at` is set to 15 minutes ahead on create, and pushed 15 minutes forward again on every heartbeat and every kernel call. Once it passes on a `ready` or `idle` session the manager tears the task down. |
| Heartbeat | The page sends one every 60 seconds while the session is not `stopped` or `failed`. |
| `End session` | The stop icon next to the chip records intent only; the manager owns the `ready → stopping → stopped` transitions. The chip latches on `Stopping…` for up to 15 seconds so it does not flicker back to `Lab ready`. |
| Never became ready | A session still `requested` or `provisioning` an hour after creation is failed outright with `last_error` set to `timed out before ready`. |
| Out of tokens | The meter flags the session for teardown and sets `last_error` to `stopped: insufficient tokens`. |

Closing the browser tab does **not** stop the session — teardown is left to the idle timeout.

> [!TIP]
> Click `End session` when you finish. A live kernel bills per minute whether or not you are running
> cells, and the idle timeout only fires 15 minutes after your last activity.

### What a session costs

A live session is metered per minute against reason `lab_session`, priced from the task's real
Fargate cost:

```text
fargate_$/min = ((cpu_units / 1024) · $ per vCPU-hour
               + (memory_mib / 1024) · $ per GB-hour) / 60

tokens/min    = (fargate_$/min ÷ (1 − margin_gross)) ÷ token_usd
```

The rates live in the database and are tunable with a single `UPDATE`, no deploy. If a config row is
missing the documented defaults apply: `$0.040480` per vCPU-hour, `$0.004445` per GB-hour, a gross
margin of `0.80` and `$0.05` per token. The meter ceils the *cumulative* total rather than each
minute, so a sub-1-token-per-minute rate is never over-charged, and it charges only the delta,
committing the charge and the billing cursor in one transaction.

Once the session is `ready` and the task's size is known, the status chip shows a caption
`~{{n}} tok/h`, tooltipped
`Estimated token cost per hour, derived from this kernel's Fargate size`. Read your rate there
rather than computing it — the numbers above are recalibratable at runtime. See
[tokens and billing](/docs/tokens-and-billing) for how the ledger works.

## Notebooks

A notebook is a list of Monaco cells, each either `code` (Python) or `markdown`. Cells run against
the session's persistent kernel, so variables defined in one cell are available in the next.

A brand-new notebook opens seeded with:

```python
# Fintela Laboratory — variables persist across cells.
# Pull curated internal data (no credentials needed):
px = lab.data.prices(["AAPL", "MSFT"], start="2024-01-01", end="2024-06-30")
px.tail()
```

### Toolbar

| Control | Disabled when |
|---|---|
| `Run all` | a cell is running, or the session is not `ready` |
| `Interrupt` | no cell is running |
| `Add cell` | never |
| `Clear outputs` | never |

`Run all` walks the cells top to bottom, skipping markdown cells, and stops early if you interrupt.
`Interrupt` aborts the in-flight stream and asks the kernel to interrupt; the backend gives that
call 10 seconds and answers `{"status":"noop"}` when the kernel is not up.

The right side of the toolbar shows a `Save to Workspace` button for a scratch notebook, or a save
chip for a file-backed one — `Loading notebook…`, `Saving…`, `Saved`, or a clickable
`Couldn’t load — retry` on a failed content load.

### Per-cell controls

The 40 px gutter carries, top to bottom:

| Control | Tooltip | Notes |
|---|---|---|
| Run | `Run cell` | code cells only; needs a ready session, no cell already running, and loaded content |
| Edit / Render | `Edit` when rendered, `Render` while editing | markdown cells only |
| Index | the raw cell status: `idle`, `running`, `done`, `error` | shows `M` on markdown cells, otherwise the 1-based index, colour-coded by status |
| Move up | `Move up` | disabled on the first cell |
| Move down | `Move down` | disabled on the last cell |
| Type toggle | `Convert to code` or `Convert to Markdown` | glyph `{}` or `M↓` |
| Compile | `Compile to a resource` | code cells only, disabled on an empty cell |
| Delete | `Delete cell` | disabled when one cell remains |

An empty rendered markdown cell reads `Empty Markdown cell — double-click to edit.` The footer hint
reads `Variables persist across cells while your session is live. Shift+Enter runs and advances.`

| Shortcut | Action |
|---|---|
| `Shift+Enter` | Run the cell and move on, appending a new cell if it was the last |
| `Ctrl/Cmd+Enter` | Run the cell without advancing |

### Cell output

Output streams back over SSE as typed frames while the cell runs.

| Frame | Rendered as |
|---|---|
| `stdout` | monospace preformatted text (both `stdout` and `stderr` streams) |
| `result` | monospace preformatted text, from the value's `text/plain` representation |
| `error` | an outlined error alert, ANSI escapes stripped, preferring the traceback |
| `done` | terminal; the backend guarantees one even if the kernel never sends it |

The output area scrolls at 320 px. A cell keeps its last 400 output frames; once it overflows, the
older ones are dropped and the remainder is prefixed with `… (output truncated) …`.

If the session is not ready, execute and inspect answer HTTP 409:

```json
{ "error": "session_not_ready", "status": "provisioning" }
```

### Compiling a cell into a resource

The rocket button on a code cell opens a two-item menu: `Compile to a Strategy` and
`Compile to a Fitness function`. Either opens a **new create-mode editor tab** seeded with that
cell's code, with `execution_type` set to `internal`, no data sources selected and — for a strategy
— `lookback_mode` set to `is_window`. Nothing is saved until you save it in that editor.

> [!NOTE]
> There is no "compile to a risk manager". The menu offers exactly two targets.

## Text files

Any non-notebook node opens in a Monaco text editor with a language chip, the same save chip set,
and — for `.py` files only — a `Run in kernel` button and an interrupt icon. Running executes the
**whole file as one cell** on the same persistent kernel; results appear under an `Output` header
with a `Clear outputs` button.

| Extension | Language |
|---|---|
| `.py` | `python` |
| `.md`, `.markdown` | `markdown` |
| `.json` | `json` |
| `.csv` | `plaintext` |
| `.sql` | `sql` |
| anything else | `plaintext` |

Only `python` gets the run button. A `.sql` file is highlighted, not executed — the kernel has no
database reach.

## Saving, autosave and limits

A notebook or file is either **scratch** (unsaved, held only in the browser) or **file-backed**
(bound to a workspace node). `Save to Workspace` turns a scratch notebook into a file-backed one:
it opens the name dialog seeded with `Untitled.ipynb`, creates the node, and rebinds the open tab
to it.

Once a document is file-backed it autosaves. Edits debounce for **1.5 seconds**, then a single
in-flight `PUT /lab-files/:id/content` carries the last known server timestamp as an optimistic
concurrency token. If the row moved on elsewhere the save gets a 409, the client refreshes its token
from the server and retries, so your own edits win; if the refresh fails, saving pauses until your
next edit.

Working state also mirrors to `sessionStorage` on a 600 ms debounce so a full reload does not lose
an unsaved draft. Only code and text are mirrored — cell outputs and run status never are — and the
mirror is capped at roughly 1.5 MB, evicting server-recoverable documents before scratch drafts.

| Limit | Value |
|---|---|
| Notebook / file payload | 2 MB, measured on the serialized notebook JSON or the raw text |
| Names | case-insensitive unique per folder, per user, including the root |
| Resource tree | 2000 rows per type |
| Public catalog | 2000 rows per type |
| Per-cell wall clock | 300 seconds by default; the kernel interrupts the cell and emits `cell exceeded the 300s budget` |
| Backend stream deadline | 3600 seconds, a safety net for a wedged connection, not a per-cell limit |
| Concurrency | one cell at a time per kernel; one live session per user per organization |

> [!WARNING]
> A file-backed document stays read-only until its content has loaded. That is deliberate: typing
> into a placeholder would mark it dirty and let autosave push the empty placeholder over your real
> file.

## The right-hand dock

Three icon tabs, collapsible to a 44 px rail via `Collapse panel`. The dock is drag-resizable
between 260 px and 560 px and defaults to 340 px. Its open state, tab and width ride the same
`sessionStorage` mirror as your open documents, so they survive a reload but not a new browser
tab. It auto-opens once, to Variables, the first time you open a notebook, and never reopens
itself after you close it.

### Variables

A live view of the kernel namespace, refreshed automatically after every cell run and on demand via
`Refresh`. Each row is the variable name in monospace, a type chip, and a one-line summary.

| State | Copy |
|---|---|
| Kernel ready, nothing run yet | `Run a cell — your variables will appear here.` |
| Kernel not ready | `Start the kernel to inspect variables.` |

Introspection skips modules, callables and names starting with an underscore, so the list is data
only. Clicking a row inserts the name into the focused notebook cell (toast
`Inserted into the cell`); with no notebook focused it copies instead (`Copied to clipboard`). The
copy icon is tooltipped `Copy name`.

### Data & Resources

Headed `Data & Resources`, with two sections. `Curated data` lists the datasets the `lab` SDK can
load, each with an `Insert` button that drops a ready-to-run snippet into the focused cell. Today
that is a single entry:

| Title | Description |
|---|---|
| `Adjusted prices` | `Split/dividend-adjusted daily close panel (rows = dates, columns = tickers) as a pandas DataFrame. Dates are required; ≤ 500 tickers.` |

`Your resources` lists your organization's building blocks grouped by type, capped at the first 20
rows per group; clicking one opens it as an editor tab.

### SDK

Headed `SDK`, subtitle ``The `lab` object is available in every notebook.`` Each entry shows the
signature, a summary, its parameters, its return type and an `Insert` button. This reference is
static and works with or without a live kernel.

## The lab SDK and curated data

Every kernel starts with the SDK preloaded as `lab`. The kernel itself runs with database
credentials scrubbed out of its environment: `lab.data` calls a loopback broker in the trusted
parent process, authorised by a per-process capability token, which runs the query and streams the
result back. User code can never issue raw SQL.

| Call | Returns |
|---|---|
| `lab.data.prices(tickers, start, end)` | `pandas.DataFrame — dates × tickers, forward-filled adjusted close.` |
| `lab.data.datasets()` | `list[str] — currently ["prices"].` |

| Parameter | Type | Meaning |
|---|---|---|
| `tickers` | `list[str]` | `Ticker codes, e.g. ["AAPL", "MSFT"]. Up to 500.` |
| `start` | `str` | `Inclusive start date, "YYYY-MM-DD". Required.` |
| `end` | `str` | `Inclusive end date, "YYYY-MM-DD". Required.` |

```python
px = lab.data.prices(["AAPL", "MSFT"], start="2024-01-01", end="2024-06-30")
px.tail()
```

The `prices` panel reuses the platform's canonical adjusted-close path, so what you see in a
notebook matches what a strategy receives at run time byte for byte. Zeros become `NaN`, and each
column is forward-filled only up to its own last observed value — leading and trailing gaps stay
`NaN`.

### Hard bounds

Every load is bounded. There is no unbounded read: a full backtest belongs in a
[study](/docs/studies), not in a notebook.

| Bound | Value | Message on violation |
|---|---|---|
| Dataset allow-list | `("prices",)` | `unknown dataset '{d}'; available: ['prices']` |
| At least one ticker | — | `at least one ticker is required` |
| Ticker cap | 500 | `too many tickers ({n}); the max is 500` |
| Dates mandatory | — | `start and end dates are required — unbounded loads are not allowed` |
| Date ordering | — | `end must be on or after start` |
| Requested window | tickers × days ≤ 2 000 000 | `requested window (~{n} cells) exceeds the 2000000 cap; narrow the date range or ticker set` |
| Rows returned | 2 000 000 | `query would return more than 2000000 rows; narrow the date range or ticker set` |

A bound violation surfaces as an HTTP 400 from the broker, which the SDK re-raises as
`lab.data load failed (400): …`. Any other failure is flattened to `data load failed`, with the
traceback kept server-side.

### What is installed

The kernel image installs the same curated user runtime as validation, optimization and live
execution, so a notebook and a deployed strategy run against an identical stack.

| Library | Version |
|---|---|
| `numpy` | 2.2.3 |
| `pandas` | 2.2.3 |
| `scipy` | 1.16.1 |
| `scikit-learn` | 1.6.1 |
| `statsmodels` | 0.14.6 |
| `ta` | 0.11.0 |
| `cvxpy` | 1.9.2 |

Fintela's own compute packages — the universe resolver, the strategy primitives, the lookback DSL
and the extra-data loader — are installed alongside them. The numerical libraries are pinned to a
single thread inside the kernel.

## Publishing and forking through the public catalog

The globe button in the Explorer header opens the cross-organization catalog.

| Element | Copy |
|---|---|
| Title | `Public catalog` |
| Subtitle | `Resources other organizations have shared. Fork one to copy it into your org.` |
| Loading | `Loading the catalog…` |
| Empty | `No public resources yet.` |
| Fork button | `Fork` |
| Fork count chip | `{{count}} fork` / `{{count}} forks` |
| Your own row | `Published by you`, with no Fork button |

Rows are grouped by the same three types, in the same order as the Explorer, and you only see the
groups you hold read permission on.

### Publishing

The globe glyph on a row you created toggles `shared_publicly`. Publishing needs `{type}:update`
**and** full organization scope on the row — being a member of the organization is not enough. If
the row is not found in your organization the call returns HTTP 406
`{resource_type} {id} not found for this organization`.

### Forking

`Fork` copies the resource into your organization by value and returns HTTP 201. The copy is
independent: later edits by the author never propagate. Forking counts against your creation quota
for that type, so it can be refused with the same plan-limit response as creating one from scratch
(`You've reached your plan limit`).

| Type | What travels | What does not |
|---|---|---|
| `strategy` | description, execution type and details (the code), parameters, lookback mode and lookback code, named tickers, and the data-source selection | the validation asset group — it names a row owned by the source organization |
| `fitness` | description, execution type and details, parameters, and the data-source selection | — |
| `risk_manager` | description, kind, execution details, params, parameters, the lookback warmup code, and the data-source selection | — |

The copied data-source selection is filtered first: [portfolio group](/docs/portfolio-groups)
references the target organization does not own are stripped out rather than smuggled across as
dangling ids. The new row records which resource it was forked from.

The copy is named `Fork of {name}`, then `Fork of {name} (2)` and upward if that is taken. The
success toast reads `Copy created in your Lab`.

> [!NOTE]
> Two people forking the same resource into the same organization at the same instant can race the
> unique name index; the loser gets a 500 and succeeds on retry.

## Authoring registry resources here

Opening a strategy, fitness function or risk manager from the Explorer mounts the **same editor as
its standalone registry page**, with the page chrome hidden. There is no Lab-specific fork of those
editors, so everything documented for each registry — the code editor, the data-source picker,
parameters, validation — applies unchanged inside the Lab. Saving in the Lab saves the real row.

That means the Laboratory is a workflow convenience, not a separate authoring model. Use it when you
want a scratchpad next to the editor; use the standalone pages at `/strategy`, `/fitness` and
`/risk-managers` when you want the full registry table, filters and row actions. See
[registries](/docs/registries) for those, and [execution modes](/docs/execution-modes) for how
Internal and External resources differ.

> [!NOTE]
> External-mode resources can be *edited* here like any other row, but the Lab's kernel is not
> involved in running them — an External strategy runs on your own infrastructure. See
> [external strategies](/docs/external-strategies) and [external fitness](/docs/external-fitness).

## API surface

All paths are relative to the API base. Every route requires a bearer token.

> [!NOTE]
> Every successful JSON body is wrapped in a `data` envelope — the shapes below are what sits
> *inside* `{"data": …}`. Error bodies are not wrapped: they are `{"message": …, "kind": …}`, and
> the two hand-written rejections (`402 feature_locked`, `409 session_not_ready`) are their own
> flat objects. The SSE `execute` stream is neither — it emits raw frame objects.

### Sessions

```http
POST   /lab-sessions                      202 Accepted — create or reuse your live session
GET    /lab-sessions/:id                  200 — poll status; the only route that carries
                                                estimated_tokens_per_hour
POST   /lab-sessions/:id/stop             200 — record teardown intent
POST   /lab-sessions/:id/heartbeat        200 — push the idle deadline 15 minutes out
POST   /lab-sessions/:id/interrupt        200 — best effort; {"status":"noop"} if the kernel is down
POST   /lab-sessions/:id/inspect          200 — {"variables":[{name,type,summary}]}
POST   /lab-sessions/:id/execute          body {cell_id, code} → SSE stream of cell frames
```

A session object is `{session_id, status, kernel_ready, created_at}` plus the optional
`ready_at`, `idle_deadline_at`, `last_error` and `estimated_tokens_per_hour`. `kernel_ready` is
true exactly when `status` is `ready`.

`execute` is the only Laboratory route on the streaming router, exempt from the 55-second request
timeout. Execute, inspect and interrupt all resolve the kernel by `(session, organization, user)`,
so you cannot run code in another member's kernel even inside the same organization.

### Workspace files

```http
GET    /lab-files/tree                    200 — your nodes, no payloads
POST   /lab-files/folders                 body { parent_id, name }                        → 201
POST   /lab-files/nodes                   body { parent_id, name, kind,
                                                 content?, text_content? }                → 201
GET    /lab-files/:id                     200 — node plus its content or text
PUT    /lab-files/:id/content             body { content?, text_content?,
                                                 expected_updated_at? }  → 200 { id, updated_at }
PATCH  /lab-files/:id/rename              body { name }                                   → 200
PATCH  /lab-files/:id/move                body { parent_id }  (null moves to the root)    → 200
DELETE /lab-files/:id                     200 — { deleted: n }
```

`kind` on `POST /lab-files/nodes` must be `notebook` or `file`; folders use their own endpoint.
Notebook `content` is opaque JSON to the backend — the cell shape is a client contract.

| Failure | Status | Message |
|---|---|---|
| Node not found or not yours | 404 | `Lab file not found` |
| Name already used in that folder | 409 | `A file with that name already exists here` |
| Stale `expected_updated_at` | 409 | `The file changed since you last loaded it. Reload and retry.` |
| Payload on a folder, or a bad parent | 406 | `Invalid parent folder for this operation` |
| Move into own subtree | 406 | `Cannot move a folder into its own subtree` |
| Unknown `kind` | 406 | `Invalid node kind '{kind}': expected 'notebook' or 'file'` |
| Over 2 MB | 400 | `Content exceeds the 2 MB limit` |

### Resources, sharing and forking

```http
GET    /laboratory/tree                     200 — { items[], counts_by_type }, org-scoped
GET    /laboratory/public                   200 — { items[], counts_by_type }, cross-org
PATCH  /laboratory/:resource_type/:id/share body { shared_publicly: bool }
                                            → 200 { resource_type, id, shared_publicly }
POST   /laboratory/:resource_type/:id/fork  201 — { resource_type, id, forked_from_id }
```

A tree item is `{resource_type, id, name, created_at, updated_at, created_by, owned_by_me,
shared_publicly}`; `id` is stringified on the wire even though the underlying keys are integers.
A catalog item swaps `created_by` / `shared_publicly` for `description` and `fork_count`.

`:resource_type` is one of `strategy`, `fitness`, `risk_manager`. Anything else returns 404.

## What the Laboratory does not do

- **It does not deep-link.** `/laboratory/view/:id` and `/laboratory/edit/:id` render the plain
  shell; open tabs are in-memory only.
- **It does not share your workspace.** `My Workspace` is per-user. Only the `Resources` section is
  organization-wide.
- **It does not reach the database.** The kernel has no credentials and no SQL surface — only the
  bounded `lab.data` broker.
- **It does not compile to a risk manager.** Only Strategy and Fitness are compile targets.
- **It does not host Data Pipelines.** That surface is retired and its tables are dropped. A
  strategy, fitness function or risk manager now selects its built-in data sources directly in its
  own editor. `/data-pipelines` and every sub-path under it redirect flatly to
  `/analysis/data-explorer` — the sub-path and query string are not preserved — and the
  [Data Explorer](/docs/data-explorer) is itself locked behind `data_explorer`, so an old bookmark
  can land a free-tier account on a paywall rather than on a working page.
- **It does not run studies.** A notebook is for exploration under hard data caps; batch work goes
  through [studies](/docs/studies) and the [end-to-end workflow](/docs/end-to-end-workflow).
