---
title: Fintelligent Capabilities
section: Artificial Intelligence
sectionOrder: 6
order: 2
published: true
updated: 2026-08-18
summary: Every action Fintelligent can take against the platform, and the limits on each.
keywords: capabilities, tools, actions, agent tools, create strategy, launch study, read results, permissions, limits
---

Fintelligent acts through a fixed registry of **194 tools** grouped into 18 families. Every one of
them is declared in code with an exact name, an argument schema, a target plane and a `mutating`
flag — the assistant cannot invent an action outside this list. **164 tools are read-only. 30 can
change your data.** This page enumerates all of them, says which platform objects each one touches,
and states where your click is required and where it is not.

> [!CAUTION]
> Not every write goes through a dialog. The editor path (`ui_crud_action` → `ui_editor_field` →
> `ui_request_save`) always ends with **you** clicking Confirm. The direct API path
> (`create_strategy`, `create_study`, `launch_study`, `delete_*`, the basket writes) **persists
> immediately with no dialog**. The tool descriptions call the direct path *secondary* and tell the
> agent to confirm in chat first, but nothing in the platform enforces that. The two paths are set
> side by side under **Which path needs your click**, below.

## How a capability reaches the platform

### Planes

Each tool binds to exactly one of five planes. The plane decides where the call lands and what
authority it carries.

| Plane | Tools | Where it executes | Authority |
|---|---|---|---|
| `backend` | 177 | The Rust API (`services/backend`) | **Replays your own JWT.** The agent inherits your RBAC and organization scope exactly — it can never read or write anything you could not |
| `compiler` | 6 | The stateless compiler catalogs | Service token, no database, no billing. Contracts, primitives, examples, fixtures |
| `ui` | 8 | Your browser | Emitted as a `tool_call` over the stream; the SPA applies it. Nothing runs server-side |
| `control` | 2 | Inside the agent | `load_playbook`, `delegate_to_spoke`. Never leave the process |
| `context` | 1 | The backend, via the screen you are on | `replay_view_query`. Arguments come from the published view context, not from the model |

```text
  model picks a tool
        │
        ├─ backend ──► services/backend  ── your JWT ──► Postgres        (billable, org-scoped)
        ├─ compiler ─► compiler catalogs ── service token                (no DB, no billing)
        ├─ ui ───────► SSE tool_call ──► your browser ──► the page bus   ("dispatched", not "applied")
        ├─ control ──► handled inside the agent loop                     (never leaves the process)
        └─ context ──► the query your current screen published ──► backend read
```

A UI-plane call is answered to the model with `{"dispatched": true, "verified": false}` — the
transport is one-way, so the agent is told the action was *emitted*, never that it was applied. The
only proof a write landed is the editor snapshot that comes back on the next `ui_request_save`.

### Who holds which tools

The agent is a Hub with seven specialist spokes. The roster is not flat: a tool is reachable only if
some roster carries it.

| Actor | Tools it can call | Can it write? |
|---|---|---|
| **Hub** (base roster) | 44 | One mutating tool only: `derive_cluster_from_grouping`. Everything else is a read or an escalation |
| **Hub** + a loaded playbook | up to 66 | Adds `ui_editor_field`, `ui_crud_action`, `ui_request_save`, `platform_command`, `read_agent_draft`, `save_agent_draft` |
| `study` spoke | 30 | `create_study`, `launch_study`, `stop_study`, `resume_study`, `duplicate_study`, `derive_cluster_from_grouping` |
| `analytics` spoke | 45 | `create_basket`, `update_basket`, `delete_basket`, `update_basket_portfolios` |
| `knowledge` spoke | 37 | The fitness and risk-manager writes (9 tools) |
| `data` spoke | 44 | The asset-group writes (5 tools) |
| `strategy` spoke | 22 | `create_strategy`, `update_strategy`, `delete_strategy`, `duplicate_strategy` |
| `research` spoke | 37 | **Read-only** |
| `live` spoke | 7 | **Read-only** |

Three rules constrain who can write. The first is asserted at import, so a roster that breaks it
fails the boot rather than degrading at runtime:

- **No spoke may hold a UI, control or context tool.** Your screen belongs to the Hub. A spoke that
  tries to navigate, open an editor or ask you a question is refused in-band.
- **A delegation is read-only by default.** `delegate_to_spoke` takes a `mutating` boolean that
  defaults to false; a read-only brief has every mutating tool stripped from the spoke's roster
  before it starts.
- **The Hub cannot reach a registry write directly.** `create_strategy`, `create_fitness`,
  `create_risk_manager`, `create_study`, `launch_study` and the rest are spoke-owned. The Hub must
  either delegate with `mutating: true` or take the editor path.

**Playbooks** are the seven authoring contracts (`strategy`, `study`, `risk_manager`, `fitness`,
`asset_group`, `remediation`, `reports`). The Hub loads one with `load_playbook` when it is about to
write, or the turn pre-loads it when you already have that editor open, when the last message was a
failed validation, or when the previous turn loaded it. Loading is one-way within a turn — a
playbook is never unloaded.

### The audit trail

Every tool flagged `mutating` emits `mutating: true` on its `tool_call` event, and the backend writes
an append-only row to `developers.agent_action_log` carrying the organization, the user, the
conversation, the sequence number of the user message that started the turn, the tool name and a
SHA-256 digest of the arguments. The table's trigger rejects `UPDATE` and `DELETE`. Read-only calls
are not audited.

Mutating calls are also **shielded against cancellation**: if you press Stop or close the tab while a
write is in flight, the request is not torn off — it keeps running, and the turn waits a short grace
period for its real outcome before giving up. If it still has not answered, the tool result says
explicitly that the action *may or may not* have been applied, rather than leaving a `tool_call` with
no result at all. A batch containing any mutation runs serially; read batches run concurrently.

## Capability map

| Family | Tools | Mutating | Plane | What it covers |
|---|---:|---:|---|---|
| Trial portfolios and baskets | 46 | 4 | backend | Trial portfolio metrics, equity, holdings, lineage, overfitting, what-if, global rankers, portfolio groups, managed portfolios |
| Market | 24 | 0 | backend | Overview, indices, sectors, countries, per-ticker OHLC, financials, sentiment, insider, analyst, corporate actions, rates, news |
| Studies | 19 | 5 | backend | Listing, metadata, progress, errors, clustering, importances, overfitting, comparison, cost previews, create, launch, stop, resume, duplicate |
| Data Explorer | 17 | 0 | backend | Catalog, dataset summary and coverage, feature series, raw rows, rates, macro series, calendars, symbol changes, metadata fields |
| Asset groups | 15 | 5 | backend | Universes, date coverage, metadata quality, compatibility matrix, groupings, create, update, delete, duplicate |
| Risk managers | 12 | 5 | backend | Own and public library, quotas, versions, sandboxes, create, update, delete, duplicate, fork |
| Knowledge and catalogs | 11 | 0 | compiler (6), backend (5) | Data sources, built-in risk managers, declarative primitives, worked examples, resource contracts, metrics, samplers, benchmarks, workspace snapshot |
| Strategies | 9 | 4 | backend | Listing, metadata, declared parameters, versions, sandbox, create, update, delete, duplicate |
| Tickers | 9 | 0 | backend | Symbol resolution, search, snapshots, indices, constituents, time series, exchanges, facets |
| Interface | 8 | 2 | ui | Navigation, editor writes, editor opening, save requests, question cards, PDF reports, command batches |
| Fitness functions | 8 | 4 | backend | Listing, metadata, versions, sandbox, create, update, delete, duplicate |
| Validation | 7 | 0 | backend | The seven compile checks for internal, external and built-in resources |
| Screener | 3 | 0 | backend | Filter schema, match count, match page |
| Drafts | 2 | 1 | backend | Read and write the server-side authoring draft |
| Control | 2 | 0 | control | Load a playbook, delegate to a spoke |
| Jobs | 1 | 0 | backend | Wait for an async job |
| View context | 1 | 0 | context | Re-run the query behind your current screen |
| Broker | 0 | 0 | — | **Intentionally empty.** No live-brokerage tool exists |
| **Total** | **194** | **30** | | |

## Capabilities that change your data

### The mutating tools

These 30 tools are the complete set that can alter platform state. Everything else in this document
is a read.

| Tool | Object written | Effect | Dialog? |
|---|---|---|---|
| `create_strategy` | Strategy | Creates and **persists immediately** | No |
| `update_strategy` | Strategy | Full replace of the fields sent | No |
| `delete_strategy` | Strategy | Deletes one or more by id | No |
| `duplicate_strategy` | Strategy | Copies one | No |
| `create_fitness` | Fitness function | Creates and **persists immediately** | No |
| `update_fitness` | Fitness function | Full replace of the fields sent | No |
| `delete_fitness` | Fitness function | Deletes one or more by id | No |
| `duplicate_fitness` | Fitness function | Copies one | No |
| `create_risk_manager` | Risk manager | Creates one of kind `builtin`, `internal`, `external` or `declarative` | No |
| `update_risk_manager` | Risk manager | Updates one | No |
| `delete_risk_manager` | Risk manager | Deletes one or more by id | No |
| `duplicate_risk_manager` | Risk manager | Copies one | No |
| `fork_risk_manager` | Risk manager | Forks a public one into your library | No |
| `create_cluster_from_study` | Asset group | Derives one from a study's universe | No |
| `derive_cluster_from_grouping` | Asset group | Derives one from a grouping namespace and code | No |
| `update_data_cluster` | Asset group | `tickers_id` is a **full replacement** of the universe | No |
| `delete_data_cluster` | Asset group | Deletes one or more by id | No |
| `duplicate_data_cluster` | Asset group | Copies one | No |
| `create_study` | Study | Saves a study. Starts nothing unless `launch_now: true` | No |
| `launch_study` | Study | **Charges Fintela tokens and starts the optimization** | No |
| `stop_study` | Study | Cancels one or more running studies | No |
| `resume_study` | Study | Restarts a completed or stopped study with more trials | No |
| `duplicate_study` | Study | Config-only copy | No |
| `create_basket` | Portfolio group | Creates one from portfolio ids; trial ids are auto-promoted to managed. A paid `allocation_method` charges its unlock (402 if unaffordable) | No |
| `update_basket` | Portfolio group | Partial update; `rewrite_backtest` recomputes from inception, allowed only on a never-operated basket | No |
| `delete_basket` | Portfolio group | Deletes it | No |
| `update_basket_portfolios` | Portfolio group | Triggers a data refresh of the member portfolios | No |
| `save_agent_draft` | Agent draft | Writes the draft row. **Creates no resource** | No |
| `ui_crud_action` | — | Opens an editor or triggers a row action in your browser | Depends on the page |
| `platform_command` | — | Runs a batch of command intents in your browser | Depends on the intent |

> [!WARNING]
> `launch_study` and `create_study` with `launch_now: true` commit **Fintela tokens** (the compute
> currency). The cost is knowable in advance — `preview_new_study_cost` quotes an uncreated
> configuration and `preview_study_cost` quotes a saved study, both read-only — but neither is
> mandatory before a launch.

### Which path needs your click

There are two ways to author a registry object, and only one of them ends in a dialog.

| | Editor path | Direct API path |
|---|---|---|
| Tools | `ui_crud_action` → `ui_editor_field` → `ui_request_save` | `create_*` / `update_*` / `delete_*` |
| Where it runs | Your browser | The backend |
| What you see | The real editor, filled in, then the Save Confirm dialog | Nothing until it is done |
| Who persists it | **You**, by clicking Confirm | The agent |
| Status while waiting | `Waiting for you to confirm — the Save dialog is open` | none |
| Declared as | The default | "SECONDARY path… use this only when the user explicitly asks to skip the wizard" |

`ui_request_save` runs exactly the validation a human Save runs and then stops. It never persists.
For a **study** it saves nothing at all: it opens the review dialog with the token cost for you to
confirm or cancel — the tool step renders as **"Opening the study for your review"**.

The same is true through `platform_command`: its `save` intent calls `ui_request_save` underneath and
reports `awaiting_user_confirmation`, never `done`. Its `run` intent with `action: 'launch'` has no
bus verb at all — it navigates you to the section page so you can confirm there.

Internal code carries one more gate that applies to **both** paths. Saving a strategy, fitness
function or risk manager requires a completed validation receipt matching a SHA-256 digest of the
code, the lookback snippet and the resolved data-source graph. Receipts expire after **one hour**.
Without one the save is rejected:

| HTTP | `kind` | Meaning |
|---|---|---|
| `406` | `validation_receipt_missing` | *"This code has not been validated as a strategy. Validate it (POST /validate/internal/…) before saving."* |
| `406` | `validation_receipt_params_mismatch` | Validated, but not at the parameter values being saved |
| `406` | `validation_receipt_window_override` | Validated over a custom date window, which cannot authorize a save |

## Interface capabilities

Eight tools that run in your browser rather than on the server. They are the Hub's alone — no spoke
can call them. Three of them are **terminal**: they end the agent's turn, and their result comes back
as your next message.

| Tool | Terminal | Mutating | What it does |
|---|---|---|---|
| `ui_navigate` | no | no | Moves the app to a page |
| `ui_editor_field` | no | no | Writes one field, or many, into an open editor |
| `ui_crud_action` | no | **yes** | Opens a create/edit editor or triggers a row action |
| `ui_request_save` | **yes** | no | Runs the human Save validation and opens the Confirm dialog |
| `ui_ask_user` | **yes** | no | Renders the question card |
| `generate_pdf_report` | no | no | Composes a study PDF in your browser |
| `generate_portfolio_pdf_report` | no | no | Composes a trial-portfolio PDF in your browser |
| `platform_command` | **yes** | **yes** | Runs a batch of command-core intents |

### Navigation (`ui_navigate`)

Read-only; writes nothing. Takes a `page` from a closed enum of 14 route keys — an unlisted value is
a no-op.

| Key | Route | Key | Route |
|---|---|---|---|
| `overview` | `/analysis` | `studies` | `/studies` |
| `portfolios` | `/analysis/portfolios` | `strategies` | `/strategy` |
| `portfolio_manager` | `/analysis/portfolio-manager` | `fitness` | `/fitness` |
| `markets` | `/analysis/markets` | `data_clusters` | `/asset-groups` |
| `data_explorer` | `/analysis/data-explorer` | `risk_managers` | `/risk-managers` |
| `portfolio_groups` | `/analysis/portfolio-groups` | `laboratory` | `/laboratory` |
| `fintelligent` | `/ai/fintelai` | `account` | `/account` |

**Limit:** the tool declares an optional `params` object, but the handler reads only `page`. Deep
links to a specific record are not reachable this way. Navigation is never refused for a
locked feature — you land on the blurred preview.

### Editor writes (`ui_editor_field`)

Writes into the editor already open on your screen. It never touches the database; nothing it writes
is saved until you confirm.

| Argument | Values |
|---|---|
| `entity` | `strategy`, `fitness`, `risk_manager`, `asset_group`, `cluster` (legacy alias), `study` |
| `field` | `name`, `description`, `code`, `params`, `data_sources`, `validation_universe`, `universe_binding`, `lookback_function_code`, `execution_type`, `endpoint`, `timeout`, `max_concurrency`, `kind`, `rules`, `spec`, `tickers`, `basket_members`, `asset_group`, `strategy_id`, `fitness_id`, `fitness_params`, `dates`, `n_trials`, `sampler`, `grid_decimals`, `autostop`, `daily_updates`, `optimization_direction`, `eligibility`, `risk_managers`, `benchmark`, `fields`, `save` |
| `value` | Required for every field except `save`, which takes none |

`fields` takes an object of several fields at once, applied in order — one call fills a whole form.

**Limits.** A field outside that enum is rejected in-process. If no editor is mounted, or if two are
mounted and no `entity` was given, the write is **parked in a queue for 15 seconds** (64 entries max,
oldest evicted first) and replayed when the right editor mounts; past the TTL it is dropped and
reported on the next save as `EDITOR_WRITE_LOST`. `params` means different things in different
editors: on a strategy it declares parameters, on a study it is the search space over them.

### Opening editors and row actions (`ui_crud_action`)

**Mutating and audited** — it is the one interface tool that can ask the page to destroy or halt
something.

| Declared action | Strategy | Fitness | Risk manager | Asset group | Study |
|---|---|---|---|---|---|
| `create` | yes | yes | yes | yes | yes |
| `edit` | yes | yes | yes | yes | yes |
| `duplicate` | yes | yes | **no listener** | yes | yes |
| `delete` | **no listener** | **no listener** | **no listener** | **no listener** | **no listener** |
| `stop` | **no listener** | **no listener** | **no listener** | **no listener** | **no listener** |
| `resume` | **no listener** | **no listener** | **no listener** | **no listener** | **no listener** |

`delete`, `stop` and `resume` are in the tool's argument enum, but no page subscribes to them.
Stopping and deleting are left deliberately to the list view's own buttons and their confirmation
dialogs. A dispatched action with no listener does nothing.

The legacy token `cluster` is **not** routable here — an asset group is `asset_group`. Ids arriving
as strings are coerced; a non-numeric id is dropped.

### Requesting a save (`ui_request_save`)

Terminal. Runs the same validation a human Save runs, then hands you the dialog. Accepts `entity` in
`strategy`, `fitness`, `risk_manager`, `asset_group`, `cluster`, `study`.

Three guards run before the compiler is ever called, so a lost write is never reported as a code
error:

| `failure_kind` | Meaning |
|---|---|
| `EDITOR_NOT_OPEN` | Nothing to save — the editor must be opened first |
| `EDITOR_NOT_READY` | The editor is still loading its catalogs; nothing was validated |
| `EDITOR_WRITE_LOST` | Field writes never reached the editor; the code was **not** validated |
| `EDITOR_STATE_CHANGED` | The editor moved under the agent |
| `EDITOR_DRAFT_UNREVIEWED` | An unreviewed draft is showing; keep or discard it first |
| `VALIDATION_FAILED` | The code itself is wrong |
| `COMPILER_UNAVAILABLE`, `COMPILER_TIMEOUT` | The validator did not answer; retry unchanged |
| `VALIDATION_RECEIPT_MISSING` | No receipt for this code |
| `PERSIST_CONFLICT`, `PERSIST_NO_ROWS`, `PERSIST_FAILED` | The save reached the server and failed |
| `SYNC_FAILED`, `DEPENDENCY_FAILED` | A downstream step failed |

The result also carries an editor snapshot — entity, resource id, mode, fields, a code **hash**, a
short excerpt and a line count. The snapshot itself never carries the code body.

**Limits.** For `asset_group` there is no compile step: it validates the universe and opens the
Confirm dialog. For `study` it saves nothing and opens the review dialog with the token cost. The
client watchdog gives a validation **270 seconds** before reporting a timeout, sized to outlive the
backend's own 240-second patient-retry budget.

### Asking you a question (`ui_ask_user`)

Terminal and read-only. Renders the question card and waits for a person — it is exempt from the
watchdog and is never timed out.

| Constraint | Value |
|---|---|
| Questions per card | 1 to 6 |
| Options per question | 2 to 6 |
| Question kinds | `single` (radio), `multi` (checkbox), `dropdown` (select) |
| Free-text escape | An **"Other…"** option, present unless `allow_other: false` |
| Registry picker | Only for `catalog: "fitness"` and `catalog: "risk_manager"` |

Answers return as a machine message tagged `⟦answer⟧`. Nothing is written by this tool.

### PDF reports

`generate_pdf_report` (one study) and `generate_portfolio_pdf_report` (one trial portfolio). The
agent gathers the numbers with the read tools and authors the title plus an ordered list of
`{heading, body}` sections; your browser composes the PDF with jsPDF and downloads it. Markdown and
LaTeX in a body are typeset.

**Limits.** Read-only, non-terminal, and entirely client-side — no file is stored on any server and
no data leaves the browser during composition. At least one section is required. There is **no
server-side file delivery**: the message `downloads` channel has a renderer but no producer.

### Platform commands (`platform_command`)

Terminal and **mutating**. Runs an ordered batch of intents through the same dispatcher the human
Cmd+K palette uses, and posts a `CommandResult[]` back. Execution stops at the first failing intent,
so a failed `validate` never reaches `save`.

| Intent | What it does | Persists? |
|---|---|---|
| `navigate` | Goes to a page, or to an entity in `view` or `edit` mode | no |
| `search` | Fuzzy-resolves entities by name or id | no |
| `create` | Publishes the entity's create action; returns `draft_open` | no |
| `view` | Opens an entity read-only | no |
| `edit` | Opens an entity's editor | no |
| `set_fields` | Writes an object of fields into the open editor | no |
| `read_editor` | Returns the editor snapshot | no |
| `validate` | Runs `ui_request_save` | no |
| `save` | Runs `ui_request_save`; reports `awaiting_user_confirmation` | **no** |
| `run` | `launch`, `stop`, `relaunch` or `backtest` on an entity | no |

> [!NOTE]
> **There is no `delete` intent.** The command interface deliberately exposes no destructive action
> to humans or to the agent; deletion stays on the page buttons with their confirmation dialogs.

Addressable entity types are `study`, `strategy`, `data_cluster`, `fitness`, `risk_manager`,
`basket`, `portfolio_groups_view`. Only the first five have a create/stop/relaunch path; `basket` and
`portfolio_groups_view` return `port_unavailable` for those. `platform_command` is always handled,
regardless of whether the human command palette is enabled.

## Registry capabilities

### Studies

19 tools. Reads and writes `studies` and their trial portfolios. Five mutate.

| Tool | What it does | Writes |
|---|---|---|
| `list_studies` | The most recent studies with status and progress. Default `limit` 20, newest first | — |
| `get_study_metadata` | Name, strategy, fitness, params, windows, grid size, status, snapshots | — |
| `get_study_progress` | Completed trials against `n_trials` | — |
| `get_study_status` | Last and desired status, timestamps, and a structured `failure_diagnostic` when the run failed | — |
| `get_study_opt_history` | Per-trial optimization history for a metric and stage | — |
| `get_study_errors` | The error dashboard, grouped by `failure_kind` | — |
| `get_study_clustering` | Behavioural trial clustering, summary form | — |
| `get_study_param_importances` | fANOVA plus MDI importances with bootstrap confidence intervals | — |
| `get_study_overfitting` | PBO (CSCV), deflated-Sharpe inputs, verdict aggregate | — |
| `get_study_export_params` | Every completed trial's hyperparameters | — |
| `compare_studies` | Cross-study weighted-average optimization history | — |
| `preview_study_cost` | Quotes a **saved** study's launch cost and machine. Creates nothing, charges nothing | — |
| `preview_new_study_cost` | Quotes a study that does not exist yet. Creates nothing, charges nothing | — |
| `suggest_study_search_space` | Turns one breadth choice into a launchable search space. Read-only | — |
| `create_study` | Creates a study directly | **Study** |
| `launch_study` | Launches a saved study | **Study; charges tokens** |
| `stop_study` | Cancels running studies | **Study** |
| `resume_study` | Adds trials to a completed or stopped study | **Study** |
| `duplicate_study` | Config-only copy | **Study** |

**Limits.** `get_study_opt_history` is downsampled to at most 200 evenly spaced trials;
`compare_studies` to 60 per study across roughly four studies; `get_study_clustering` and
`get_study_overfitting` are pinned to summary mode because their full payloads cannot fit the tool
result cap. `list_studies` should not be raised past about 20 — a larger listing is truncated
mid-entry. `create_study` requires `display_name`, `strategy_id`, `cluster_strategy_id`,
`fitness_id`, `n_trials`, the four window dates and `params`; unknown keys are rejected in-process.
`launch_now` defaults to false, so a created study costs nothing until it is launched.

See [Studies](/docs/studies) and [Study lifecycle](/docs/study-lifecycle).

### Strategies

9 tools. Four mutate.

| Tool | What it does | Writes |
|---|---|---|
| `list_strategies` | The org's strategies with metadata; code bodies omitted | — |
| `get_strategies_metadata` | Metadata for specific ids | — |
| `get_strategies_parameters` | Declared parameters — name, type, default | — |
| `get_strategy_versions` | Version history | — |
| `run_strategy_sandbox` | Previews positions over a date range against an asset group. Async: 202 plus a job id | — |
| `create_strategy` | Creates and persists | **Strategy** |
| `update_strategy` | Full replace of the fields sent | **Strategy** |
| `delete_strategy` | Deletes by id | **Strategy** |
| `duplicate_strategy` | Copies one | **Strategy** |

**Limits.** Ids must come from an earlier result — the whole call fails with **406** if any id is
unknown, and `get_strategy_versions` returns **404** for an unknown or partly inaccessible id.
`lookback_mode` accepts only `function`; `is_window` was retired and is rejected. Internal code must
pass `validate_internal_strategy` first — the save is gated on a completed receipt no more than an
hour old.

See [Strategies](/docs/strategies) and [Execution modes](/docs/execution-modes).

### Fitness functions

8 tools. Four mutate.

| Tool | What it does | Writes |
|---|---|---|
| `list_fitness_functions` | Built-in objectives plus the org's own; code bodies omitted | — |
| `get_fitness_metadata` | Metadata for specific ids | — |
| `get_fitness_versions` | Version history | — |
| `run_fitness_sandbox` | Previews the score over a date range. Async: 202 plus a job id | — |
| `create_fitness` | Creates and persists | **Fitness function** |
| `update_fitness` | Full replace of the fields sent | **Fitness function** |
| `delete_fitness` | Deletes by id | **Fitness function** |
| `duplicate_fitness` | Copies one | **Fitness function** |

**Limits.** `run_fitness_sandbox` needs a fitness id, a strategy id, an asset group, both parameter
sets and a date range. Internal code is receipt-gated exactly as strategies are.

See [Fitness functions](/docs/fitness-functions) and [External fitness](/docs/external-fitness).

### Risk managers

12 tools. Five mutate — the largest write surface of any registry family.

| Tool | What it does | Writes |
|---|---|---|
| `list_risk_managers` | The org's risk managers | — |
| `list_public_risk_managers` | The public shared library | — |
| `get_risk_managers_metadata` | Metadata for specific ids | — |
| `get_risk_manager_quotas` | Quotas and usage | — |
| `get_risk_manager_versions` | Version history | — |
| `run_risk_manager_sandbox` | Previews one risk manager, built-in or saved. Async | — |
| `run_risk_manager_stack_sandbox` | Previews an ordered stack. Async | — |
| `create_risk_manager` | Creates one | **Risk manager** |
| `update_risk_manager` | Updates one | **Risk manager** |
| `delete_risk_manager` | Deletes by id | **Risk manager** |
| `duplicate_risk_manager` | Copies one | **Risk manager** |
| `fork_risk_manager` | Forks a public one into your library | **Risk manager** |

**Limits.** `kind` is one of `builtin`, `internal`, `external`, `declarative`. `builtin_name` is
required when `kind` is `builtin`; `execution_details` is required otherwise. `run_risk_manager_sandbox`
requires either `risk_manager_id` or `builtin_name` — the executor enforces the choice before the call
leaves the process. A stack sandbox needs a non-empty `risk_managers` list.

See [Risk managers](/docs/risk-managers).

### Asset groups

15 tools. Five mutate. The API still calls these *data clusters*, which is why most tool names say
`cluster`.

| Tool | What it does | Writes |
|---|---|---|
| `list_data_clusters` | The org's universes with a ticker count and sample symbols | — |
| `resolve_asset_group_universe` | Ranks existing groups by how much of a requested instrument set each holds | — |
| `get_data_clusters_metadata` | Metadata for specific ids | — |
| `get_date_coverage` | Start and end availability | — |
| `get_meta_quality` | The metadata-quality report | — |
| `get_cluster_last_date` | Last available data date | — |
| `cluster_compatibility_matrix` | Whether the group can feed a strategy's injected sources over a range | — |
| `list_groupings` | Every sector or industry taxonomy available, in one call | — |
| `get_grouping_detail` | One grouping's descriptor and hierarchy. Returns no members | — |
| `get_grouping_namespaces` | Grouping namespaces | — |
| `create_cluster_from_study` | Derives a group from a study's universe | **Asset group** |
| `derive_cluster_from_grouping` | Derives a group from a namespace and code | **Asset group** |
| `update_data_cluster` | `tickers_id` replaces the whole universe | **Asset group** |
| `delete_data_cluster` | Deletes by id | **Asset group** |
| `duplicate_data_cluster` | Copies one | **Asset group** |

> [!WARNING]
> `update_data_cluster` takes `tickers_id` as the **complete** replacement universe, not a delta.
> Anything omitted is removed.

`derive_cluster_from_grouping` is the single mutating tool on the Hub's base roster — it can be
called without loading a playbook or delegating.

See [Asset groups](/docs/asset-groups).

### Validation and sandboxes

7 validation tools plus the four sandbox tools listed above. All read-only: they compile and run
code, they never save it.

| Tool | Checks |
|---|---|
| `validate_internal_strategy` | Python strategy code, with test parameter values |
| `validate_internal_fitness` | Python fitness code |
| `validate_internal_risk_manager` | Python risk-manager code |
| `validate_builtin_risk_manager` | A built-in risk manager by name |
| `validate_external_strategy` | A user-hosted endpoint over a date range |
| `validate_external_fitness` | A user-hosted fitness endpoint |
| `validate_external_risk_manager` | A user-hosted risk-manager endpoint |

**Limits.** All are asynchronous — they return 202 with a job id, and the outcome is read with
`get_job`. A validation result is a **receipt**, and it is what the corresponding save is gated on
for one hour.

See [External strategies](/docs/external-strategies) and [Laboratory](/docs/laboratory).

### Agent drafts

2 tools. One mutates.

| Tool | What it does | Writes |
|---|---|---|
| `read_agent_draft` | Reads the saved draft for a resource being authored, including the code. A 404 means "no draft yet" and is an ordinary answer | — |
| `save_agent_draft` | Writes the draft | **Draft row only** |

A draft is the agent's work-in-progress on the server, so authoring survives you navigating away,
reloading, or closing the tab. `entity` is one of `strategy`, `fitness`, `risk_manager`,
`asset_group`, `study`; `resource_id` names the record being edited, and omitting it selects the
separate create-mode slot. There is exactly **one live draft per (user, entity, resource)**.

**Limits.** `content` **replaces** the whole draft — it is not a patch. Concurrency is controlled by
`expected_updated_at`, taken from the last read; a stale token is refused with **409**, which means
you edited the draft while the agent worked. Omit the token only for the very first write of a brand
new draft — sending no token onto an existing draft is also a 409. A draft is not a save: it creates
nothing until you keep it and confirm the editor's Save.

See [Fintelligent drafts and runs](/docs/fintelligent-drafts-and-runs).

## Analysis capabilities

### Trial portfolios

24 read-only tools over the portfolios a study produces. None writes.

| Tool | What it returns |
|---|---|
| `get_top_portfolios` | One study's top portfolios by metric and stage |
| `get_study_portfolios` | The trial portfolios one or more studies produced |
| `get_portfolio_metadata` | Metadata for one or more portfolios |
| `get_portfolio_metrics` | Stored per-portfolio backtest metrics |
| `get_portfolio_avg_metrics` | Train and validation stage-weighted averages; the weights must sum to 1.0 |
| `get_portfolio_window_metrics` | Metrics over an explicit date window |
| `get_portfolio_entity_windows_metrics` | Per-holding windowed metrics |
| `get_portfolio_params` | Hyperparameter values |
| `get_portfolio_holdings` | Holdings and positions |
| `get_portfolio_equity` | Equity curves |
| `get_portfolio_overfitting` | Per-portfolio overfitting diagnostics |
| `get_portfolio_seed` | The reproducible seed and config |
| `get_portfolio_trials` | Trial rows — params plus objective |
| `get_portfolio_lineage` | Study, strategy and fitness provenance |
| `get_portfolio_roc_curve` | Rolling rate-of-change curve |
| `get_portfolio_risk_manager_events` | Which risk manager fired or halted, and when |
| `resolve_portfolio` | Resolves a study id and trial number to a portfolio id |
| `simulate_trial_what_if` | Re-simulates with overrides such as inverted sides or a shorter window. Preview only |
| `get_global_top_portfolios` | Ranks across studies by metric and stage |
| `get_global_top_portfolios_weighted` | Ranks across studies by a weighted combination of metrics |
| `get_global_top_portfolios_named_stages_avg` | Ranks across studies by one metric averaged over weighted stages |
| `get_global_top_portfolios_custom_timeframe` | Ranks across studies over an explicit date window |
| `get_global_top_portfolios_custom_timeframes_avg` | Ranks across studies over several weighted windows |
| `get_study_top_portfolios_named_stages_avg` | The same weighted-stage ranking within one study |

**Limits.** Weighted rankers require their weights to sum to 1.0. The named-stages rankers rank only
portfolios that have every requested stage. `simulate_trial_what_if` is preview compute — the engine
produces the numbers and nothing is persisted.

See [Portfolios dashboard](/docs/portfolios-dashboard), [Portfolio detail](/docs/portfolio-detail)
and [Metrics reference](/docs/metrics-reference).

### Portfolio groups

18 tools. Four mutate. The API calls these *baskets*.

| Tool | What it does | Writes |
|---|---|---|
| `list_baskets` | The org's portfolio groups | — |
| `get_basket` | One group's full detail and config | — |
| `get_basket_dashboard` | Summary KPIs, per-group cards, needs-attention rollups, rebalance timeline | — |
| `get_basket_exposure` | Aggregate sector and ticker concentration across groups | — |
| `compare_baskets` | Compares groups over a period | — |
| `get_basket_backtest` | Blended equity plus stats | — |
| `get_basket_seed` | Seed data — `bundle`, `blended` or both | — |
| `get_basket_freshness` | How current each member's daily update is | — |
| `simulate_basket` | What-if re-simulation of allocation, rebalance or exclusions. **Never persisted** | — |
| `get_basket_news_sentiment` | Sentiment rollup across holdings, plus headlines | — |
| `get_ranking_windows` | Rolling ranking windows | — |
| `get_basket_order_intent` | **Read-only preview** of how the group would trade live. Places no orders | — |
| `list_basket_operations` | Live operations, drafts and running | — |
| `get_basket_operation_status` | One operation's status and detail | — |
| `create_basket` | Creates a group from portfolio ids | **Portfolio group** |
| `update_basket` | Partial update | **Portfolio group** |
| `delete_basket` | Deletes it | **Portfolio group** |
| `update_basket_portfolios` | Refreshes member data | **Portfolio group** |

**Limits.** `create_basket` auto-promotes trial ids to managed portfolios, and a paid
`allocation_method` charges its unlock at creation — a **402** if the balance is short.
`rebalance_enabled` requires `rebalance_frequency_days`. `update_basket` does not auto-clear
`allocation_method_params`: switching to `equal_weight` or `manual` requires sending
`allocation_method_params: null` as well. `rewrite_backtest` recomputes from inception and is
accepted only for a group that has never operated.

See [Portfolio groups](/docs/portfolio-groups) and [Portfolio manager](/docs/portfolio-manager).

### Managed portfolios and live operations

Four tools exist in the registry; **only two are reachable**.

| Tool | Reachable | Notes |
|---|---|---|
| `list_managed_portfolios` | yes — `live` spoke | Identity and config only |
| `get_managed_portfolio` | yes — `live` spoke | One managed portfolio's detail |
| `get_managed_equity` | **no** | Declared but on no roster |
| `get_managed_holdings` | **no** | Declared but on no roster |

`get_managed_equity` and `get_managed_holdings` stream a live-traded portfolio's raw positions and
equity curve. They are deliberately granted to no actor, so that account-level position data never
reaches the model provider. The agent can identify a managed portfolio and route you to it; it
cannot read what it holds.

See [Live trading](/docs/live-trading).

## Market and data capabilities

Every tool in this section is read-only. None writes anything.

### Market

24 tools.

| Tool | Returns |
|---|---|
| `get_market_overview` | Breadth, movers, headline stats |
| `get_market_last_date` | Latest available market-data date |
| `get_ticker` | One ticker's profile |
| `get_ticker_metrics` | Fundamental and technical metrics for many tickers in one call |
| `get_ticker_ohlc` | OHLC price history |
| `get_ticker_financials` | Financial statements and fundamentals |
| `get_ticker_sentiment` | News-sentiment history |
| `get_ticker_insider` | Insider transactions |
| `get_ticker_analyst` | Analyst ratings and targets |
| `get_ticker_corporate_actions` | Dividends and splits |
| `get_ticker_crypto_fundamentals` | Crypto fundamentals |
| `get_ticker_fund_fundamentals` | Fund and ETF fundamentals |
| `get_indicator_metadata` | Available indicators and their parameters |
| `get_top_indicators` | Ranks tickers by an indicator, z-scored over a window |
| `get_top_indicators_summary` | The same filters answered as three numbers instead of rows |
| `get_sectors` | Sector breakdown and weights |
| `get_countries` | Country breakdown and weights |
| `get_indices` | Market indices |
| `get_index` | One index's detail |
| `get_upcoming_earnings` | Earnings within the next N days |
| `get_top_volume` | Top tickers by volume |
| `get_top_volatile` | Most volatile tickers |
| `get_rates_summary` | Interest-rates snapshot |
| `get_news` | Ranked, server-summarized news for a set of tickers over a window |

**Limit.** `get_news` and `get_basket_news_sentiment` return text written by third parties. Their
results are lexically scrubbed before reaching the model, because anyone who can publish a headline
can put instructions in one.

See [Market](/docs/market).

### Tickers

9 tools.

| Tool | Returns |
|---|---|
| `resolve_ticker_symbols` | Turns up to **500** symbols into ticker ids in one call, with name, type, country, sector and industry |
| `search_tickers` | Substring search on code and name, with optional fundamental filters |
| `get_tickers_metadata` | Metadata for a batch of ids |
| `get_ticker_snapshots` | Screens by fundamental ranges — P/E, margins, ROE, moving averages, yield |
| `list_indices` | Indices that actually have membership data, with member counts and coverage window |
| `get_index_constituents` | Constituents by mode — `current`, `ever`, `interval_any`, `interval_all` or `as_of` |
| `get_ticker_timeseries` | One price or volume series. The series name is exact PascalCase |
| `list_exchanges` | Exchange codes |
| `get_ticker_facets` | Valid filter values — types, countries, sectors, industries |

### Screener

3 tools, meant to be used in order.

| Tool | Returns |
|---|---|
| `get_screener_schema` | The filter catalog **for one exchange**, with per-field availability and the snapshot date |
| `preview_screener_matches` | How many tickers a filter set matches — a count, no rows |
| `browse_screener_matches` | One page of matches, with the symbol and the screened values |

**Limit.** Coverage differs sharply by market, so the schema is per-exchange and must be read first.
`browse_screener_matches` returns symbols, not ids — pair it with `resolve_ticker_symbols` when ids
are needed.

### Data Explorer

17 tools.

| Tool | Returns |
|---|---|
| `get_data_explorer_catalog` | Datasets and fields available to explore |
| `get_dataset_summary` | Available datasets plus coverage |
| `get_dataset_ticker_coverage` | Per-ticker coverage, paginated and sortable |
| `get_dataset_time_coverage` | Record counts over time |
| `get_dataset_feature_series` | One feature's series for a ticker, optionally windowed or z-scored |
| `get_dataset_raw_data` | Raw rows for one ticker, paginated |
| `preview_data_sources` | Samples the real data a data-source selection resolves to |
| `get_meta_fields` | Available ticker-metadata fields |
| `get_meta_records` | Ticker-metadata records, paginated |
| `get_rate_series` | An interest-rate series |
| `get_rate_curve` | The yield curve as of a date |
| `get_rate_history` | History of one rate series |
| `get_macro_catalog` | Macro indicators by country and code |
| `get_macro_series` | A macro indicator series for a country |
| `get_calendar_earnings` | Earnings calendar over a range, paginated |
| `get_calendar_ipos` | IPO calendar over a range, paginated |
| `get_symbol_changes` | Renames and mergers, paginated |

See [Data Explorer](/docs/data-explorer).

## Knowledge and control capabilities

### Catalogs and contracts

11 tools. Six run against the compiler catalogs, which hold no data and are never billed. All are
read-only.

| Tool | Plane | Returns |
|---|---|---|
| `get_resource_contract` | compiler | The authoritative signature, fields and allowed imports for a resource type |
| `get_data_source_catalog` | compiler | The injectable-data ingredients strategies can request |
| `get_declarative_primitives` | compiler | Primitives available to declarative risk managers |
| `get_builtin_risk_managers` | compiler | Built-in risk managers and their parameters |
| `get_examples` | compiler | Worked example strategies, fitness functions and risk managers |
| `preview_validation_fixture` | compiler | Exactly what the validator will hand a strategy for a data-source selection, without writing any code |
| `get_injectable_data_catalog` | backend | Injectable data sources |
| `get_benchmark_catalog` | backend | Curated benchmarks with ticker id, code, exchange and the cluster type each serves |
| `list_metrics` | backend | Every performance metric the platform computes |
| `list_samplers` | backend | Optimization samplers |
| `deep_research` | backend | A compact snapshot of the whole workspace in one call |

**Limit.** `get_data_source_catalog` and `get_examples` exceed the tool-result cap, so an unqualified
call is truncated — they must be narrowed.

### Workspace snapshot and view replay

`deep_research` loads counts plus the most recent studies, strategies, fitness functions, asset
groups and portfolio groups in a single call. It is how the agent orients before answering a broad
question.

`replay_view_query` re-runs the query behind the screen you are looking at and returns its rows. It
takes **no filters** — the filters come from the context your screen published, so the result cannot
drift from what you see. It accepts only `limit` and `offset`, mapped onto whichever paging argument
the underlying tool declares.

**Limits.** It is available only when the screen published a query. The named tool is resolved
against the live registry and **refused unless it is a non-mutating backend read**, whatever the page
claims. The inline sample your screen sends the agent is capped at 40 rows, 8 columns, 48 characters
per cell and 4,000 characters overall — `replay_view_query` exists because that sample is bounded.

### Playbooks and delegation

| Tool | What it does |
|---|---|
| `load_playbook` | Loads one authoring contract and the tools it governs: `strategy`, `study`, `risk_manager`, `fitness`, `asset_group`, `remediation`, `reports` |
| `delegate_to_spoke` | Hands a scoped sub-task to `study`, `analytics`, `knowledge`, `research`, `strategy`, `data` or `live` |

Neither touches your data. A delegation carries a restated objective, an output format, any ids
already resolved, and optional caps on the spoke's iterations, token budget and tool subset —
`tool_constraints` can only narrow the spoke's roster, never widen it. **`mutating` defaults to
false**, and a read-only brief has every mutating tool removed before the spoke starts.

A spoke never sees your conversation. It is seeded from the delegation brief alone, and its answer
comes back as a summary capped at **2,400 characters**.

### Background jobs

`get_job` is the completion read for every tool that returned 202 with a job id — the sandboxes, the
previews, the validations.

| Field | Values |
|---|---|
| `status` | `pending`, `running`, `completed`, `failed` |
| On `completed` | `result` holds the full payload |
| On `failed` | `error` plus structured `error_details`, including compiler line and column |

**Limits.** The call blocks for up to **25 seconds** waiting for a terminal status, so it is used
once per job rather than in a polling loop. A **404** means the job is unknown or expired —
validation jobs expire after **1 hour**, everything else after **24 hours**. For a validation job,
`failed` usually means the code failed validation, not that the system broke.

## Limits on every capability

These bounds apply to all 194 tools regardless of family.

| Limit | Value |
|---|---|
| Tool result fed back to the model | 16,000 characters, truncated past that |
| Tool calls per iteration | 8 |
| Same-tool calls in one loop | Nudged at 4, refused at 8. Mutations, polls and the UI/control planes are exempt |
| Hub iterations per turn | 12 |
| Spoke iterations per delegation | 6 |
| Hub token budget | 80,000 |
| Spoke token budget | 25,000 |
| Model input | 120,000 tokens |
| Ordinary turn | 105 s soft deadline, 115 s hard budget |
| Authoring turn | 540 s soft, 570 s hard — **earned** by real authoring work, not granted up front |
| Backend call timeout | 50 s |
| Compiler call timeout | 90 s |
| Screen context sent with a message | 4,000 characters, 40 rows, 8 columns, 60 selected ids |

Beyond the mechanical caps:

- **The agent inherits your permissions, never more.** Every backend call replays your JWT. If your
  role cannot read a study, neither can Fintelligent.
- **Identical calls are answered from context** rather than re-executed, except for mutations,
  volatile polls and the UI and control planes.
- **Volatile tools are never deduplicated.** `get_study_progress`, `get_study_status`,
  `get_cluster_last_date`, `get_market_last_date`, `get_basket_freshness`, `list_basket_operations`,
  `get_basket_operation_status`, `read_agent_draft` and `get_job` change on their own, so repeating
  one is legitimate polling.
- **A turn that runs out of budget stops honestly.** It reports `incomplete`, not `finished`, and
  tells you it can pick up where it left off.

Chat itself is metered in Fintela **AI Tokens**, a separate currency from the compute tokens a study
consumes. A depleted balance blocks the turn before any tool runs, with a **402**. See
[Tokens and billing](/docs/tokens-and-billing).

## What Fintelligent cannot do

| Not available | Why |
|---|---|
| Read your connected brokerage account | The broker tool group is **intentionally empty**. Broker connections, live positions, order fills, allocations and end-of-day reconciliation were removed so no connected-account data reaches the model provider |
| Read a managed portfolio's positions or equity curve | `get_managed_holdings` and `get_managed_equity` are declared but granted to no actor, for the same reason |
| Any live-trading mutation | Broker connect, launch and rebalance; basket-operation launch, execution and force-stop; managed promote — all deliberately absent until a human-confirmation gate exists. The `live` spoke is strictly read-only |
| Delete anything through the command interface | There is no `delete` intent, for humans or for the agent |
| Delete, stop or resume through `ui_crud_action` | The actions are declared but no page subscribes to them; those buttons and their dialogs stay with you |
| Receive an uploaded file | The composer's attach picker shows your selection as chips, but nothing is uploaded or sent. Pasted **code** is genuinely sent, as a fenced block appended to your message |
| Send you a file from the server | PDFs are composed and downloaded entirely in your browser. There is no server-side delivery channel |
| Deep-link `ui_navigate` to one record | Only the page key is read; the `params` argument is ignored |
| Choose its own model | There is no model picker. The model resolves from the conversation, defaulting to `deepseek-v4-pro` |
| Use your own LLM key | Bring-your-own-key was removed. The header is no longer read or forwarded |

## Where to go next

- [Fintelligent](/docs/fintelligent) — the chat surface, conversations and how a turn behaves.
- [Fintelligent drafts and runs](/docs/fintelligent-drafts-and-runs) — reviewing, keeping and
  discarding what the agent wrote.
- [Registries](/docs/registries) — the objects these capabilities read and write.
- [Tokens and billing](/docs/tokens-and-billing) — the two currencies and what each one pays for.
