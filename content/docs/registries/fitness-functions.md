---
title: Fitness Functions
section: Registries
sectionOrder: 3
order: 5
published: true
updated: 2026-08-20
summary: How a trial is scored — the objective the optimizer maximizes, built-in or your own.
keywords: fitness, objective, score, sharpe, sortino, calmar, multi-objective, direction, evaluate, nan_fitness, external
---

A fitness function is the objective a [study](/docs/studies) optimizes. It turns one simulated period — the equity curve, the metrics already computed for that window, the holdings, orders and trades — into exactly one finite float, and Optuna searches the parameter space to move that number in one direction. Nothing else on the platform decides what "better" means. Two objectives over the same strategy will pick different parameters, which makes this the most consequential choice on a study canvas.

## Overview and purpose

### What one trial is scored with

Every trial produces a full simulation. The optimizer slices that simulation into windows and calls your objective once per window, handing it a `simulation` dict and a `data` price panel. Your objective returns a number. That number — the **train**-window one — is what Optuna is told, and what the sampler uses to choose the next trial's parameters.

The validation, overall and out-of-sample scores are computed and stored per stage as the `fitness` metric, but they never feed the search.

### One objective, one direction

There is no multi-objective or Pareto mode anywhere in the product. A study writes exactly one Optuna objective (index `0`) and one direction, resolved at study creation and immutable afterwards:

| Precedence | Source | Result |
|---|---|---|
| 1 | `developers.studies.optimization_direction` = `MINIMIZE` or `MAXIMIZE` | Wins for every execution type. This is the study builder's `Optimization objective` control (`Maximize` / `Minimize`). |
| 2 | `NOT_SET` (the default) with a `builtin` objective | Inferred from `execution_details.direction`: `lower_is_better` ⇒ minimize, otherwise maximize. |
| 3 | `NOT_SET` with an `internal` or `external` objective | Maximize. |

The builder states the rule as `Whether the search maximizes or minimizes the objective. It follows the objective’s own natural direction until you change it, and it is frozen once the study launches.`

> [!WARNING]
> Do not assume the optimizer always maximizes. A custom objective maximizes **by default**, a `lower_is_better` built-in minimizes at the default setting, and any study can be pinned to `MINIMIZE`. Inside your own code, the safe framing is "return a bigger number for a better outcome, then set the study's direction to match."

### The four execution modalities

| Wire value | Stored value | User-editable | What runs |
|---|---|---|---|
| `internal` | `INTERNAL` | Yes | Python you write, executed by Fintela |
| `external` | `EXTERNAL` | Yes | An HTTP endpoint you host, called by Fintela |
| `builtin` | `BUILTIN` | No | A platform-seeded objective reading a catalogue metric |
| `declarative` | `DECLARATIVE` | No | Scaffold only — persistence is rejected |

Execution type is chosen once and **frozen after creation**. Changing it is impossible from the editor and refused on the agent path with `An existing resource's execution type cannot be changed.`

### Where a fitness function is bound to a study

A study carries three fitness-related fields:

| Field | Type | Meaning |
|---|---|---|
| `fitness_id` | integer | Which registry row scores the study |
| `fitness_params` | object of numbers | One constant value per declared parameter — **not** a search range |
| `cluster_fitness_id` | integer or null | The [asset group](/docs/asset-groups) whose adjusted-close panel becomes the `data` argument. Null ⇒ `data` is `None`. |

At launch the study also pins `fitness_version_id` to the newest version in the function's history. Editing the function afterwards appends a new version and never changes a launched study's results.

> [!NOTE]
> Fitness parameters are constants, not a search space. The study builder says so directly: `Objective parameters are constants: the same value is used in every trial, and the search never explores them.` For an internal objective, if the declared parameter names and the study's `fitness_params` keys disagree, the study fails once at startup with `Fitness function parameters do not match study fitness parameters`.

## Registry table view

The registry lives at `/fitness`. It is registered under the sidebar's **More Options** flyout, not in the Registry section, and the sidebar label is `Fitness` while the page title is `Fitness Functions`. The feature carries no entitlement lock — the registry is not paywalled.

### Toolbar and page chrome

| Element | Exact string |
|---|---|
| Page title | `Fitness Functions` |
| Table aria-label | `fitness table` |
| Search placeholder | `Search fitness functions…` |
| Create button | `New Fitness` |
| Refresh tooltip | `Refresh` |
| Docs tooltip | `View documentation` |
| View toggle tooltips | `List view` / `Card view` |
| Filter button | `Filter` |
| Empty state title | `No fitness functions yet` |
| Empty state body | `Create your first fitness function to define what a study optimizes.` |
| Loading skeleton headers | `Name`, `Description`, `Created` |
| Load error | `Error loading fitness definitions` |

`View documentation` opens a right-hand drawer 420px wide carrying the `fitness-functions` and `external-fitness` documentation blocks.

### Columns

The table opens sorted by `Created At`, descending.

| Key | Header | Visible by default | Sortable | Renders |
|---|---|---|---|---|
| `name` | `Name` | Yes | Yes | The function name, bold |
| `description` | `Description` | Yes | Yes | One line, ellipsized, with the full text in a hover tooltip; an em dash when empty |
| `execution_type` | `Execution Type` | Yes | Yes | An outlined chip carrying the **raw wire value** — `internal`, `external`, `builtin`, `declarative` |
| `author` | `Author` | Yes | Yes (by `created_by_username`) | The creator's username; `platform` for built-ins |
| `created_at` | `Created At` | Yes | Yes | Formatted date; no per-column filter menu |
| `parameters` | `Parameters` | No (column chooser) | No | Comma-joined parameter names, or an em dash |
| `studies` | `Associated Studies` | No (column chooser) | Yes | Count of studies referencing the row |

The card view shows `name` as the title, `description` as the subtitle, and `execution_type`, `author`, `created_at` as facts.

> [!NOTE]
> The `Execution Type` chip is not translated and not title-cased — it prints the lowercase wire value verbatim.

### Filters, search and card view

| Field | Control |
|---|---|
| `name` | Text |
| `description` | Text |
| `execution_type` | Multiselect |
| `author` | Multiselect |
| `studies` | Number range |
| `created_at` | Date range |

Free-text search matches against the name, the stored description, the author's username, and — when the `registryGeneratedDescriptions` flag is on, which is the shipped default — a machine-generated sentence describing the row's configuration. That generated sentence also replaces the Description cell, moving the author's stored text into the hover tooltip under the label `Author's description`. Append `?ff_registryGeneratedDescriptions=0` to the URL to fall back to the stored descriptions.

### Insights band

The band above the table is the shared registry insights panel, carrying the labels `Insights`, `Overview`, `Graduated portfolios`, `Quality`, `Dependent studies` and `By type`, and `No insights for this view.` when nothing applies. It groups by `execution_type` and counts usage by dependent studies — the same accessor the `Associated Studies` column uses, so the two can never disagree.

### Row action menu

Clicking a row opens the action popover; right-clicking opens the same list as a context menu. The order is fixed.

| Action | Label | Goes to / does | Disabled when |
|---|---|---|---|
| `sandbox` | `Run a backtest` | `/fitness/sandbox/{id}` | Never |
| `view` | `View` | `/fitness/view/{id}` — read-only, whole form in a disabled fieldset | Never |
| `edit` | `Edit` | `/fitness/edit/{id}` | Row is `builtin`, or used by a study, or the role lacks edit |
| `duplicate` | `Duplicate` | Copies the row into your organization | Role lacks create |
| `promote-metric` | `Promote to metric`, or `Edit metric` when already promoted | Opens the promotion dialog | Row is `builtin`, or the role lacks edit |
| `demote-metric` | `Remove metric` — rendered only when already promoted | Removes the promotion and its computed values | Role lacks edit |
| `delete` | `Delete` | Soft-deletes the row | Row is `builtin`, or used by a study, or the role lacks delete |

Disabled-state tooltips:

| Cause | Tooltip |
|---|---|
| Built-in row, Edit or Delete | `Built-in objectives are provided by the platform and cannot be edited or deleted.` |
| Built-in row, Promote | `Built-in objectives are already metrics and cannot be promoted.` |
| Used by a study | `This item is currently used in a study and cannot be edited.` |

> [!NOTE]
> `Duplicate` is not gated on `builtin` in the UI, but the API refuses it with `Built-in fitness objectives cannot be duplicated.` To start from a platform objective, write your own internal function that reads the same key out of `simulation["metrics"]`.

### Run a backtest

`Run a backtest` opens `/fitness/sandbox/{id}`, a dedicated page titled `Run a backtest` with the subtitle `Sandbox a fitness function against a strategy before running a study.` It scores one function against one [strategy](/docs/strategies) without creating a study.

| Control | Label | Notes |
|---|---|---|
| Fitness picker | `Fitness`, placeholder `Select a fitness function…` | Pre-selected when you arrive from a row |
| Strategy picker | `Strategy`, placeholder `Select a strategy to simulate…` | Required |
| Universe | `Universe & Date Range` | Asset group, extra tickers, start and end date |
| Fitness parameters | `Fitness Parameters` | Empty state: `This fitness has no parameters.` |
| Strategy parameters | `Strategy Parameters` | Shown only when the strategy declares any |
| Risk manager | `Risk Manager (optional)` | Hint: `Inject a risk manager to score the fitness function against the RM-shaped backtest, or leave it empty.` See [risk managers](/docs/risk-managers). |
| Side inversion | `Invert side (Long ↔ Short)` | `Flips every generated position to its opposite side before simulating, so fitness scores the contrarian version. Preview only, nothing is saved.` |
| Run | `Run Sandbox`, then `Running…` | |

The Run button unlocks only when a fitness, a strategy and an asset group are chosen, both dates are set, and neither parameter form reports an error. Parameter errors read `{{parameter}} must be a whole number — received {{received}}` and `{{parameter}} must be a number — received {{received}}`.

Results open with a `Fitness Score` card showing the score to six decimal places as a plain number — never a percent — followed by the full simulation output: equity chart, holdings, trades, orders and period metrics.

`POST /fitness/sandbox` charges tokens as `sandbox_run` before spawning the job and returns **202** `{ job_id, status: "pending" }`, which the client polls. A failed job creation refunds the charge. Built-in objectives are rejected here.

### Confirmation dialogs

| Trigger | Message |
|---|---|
| Delete (single row or bulk) | `Are you sure you want to delete the selected fitness? If any, associated data will also be deleted.` |
| Remove metric | `Remove this metric? The values already computed for it will be discarded. To stop computing it without losing history, edit the metric and turn it off instead.` |

> [!CAUTION]
> Deleting a fitness function also soft-deletes **every study that references it**, in the same transaction. That is what "associated data will also be deleted" means. There is no undo in the UI.

### Bulk actions and toasts

Selecting rows exposes exactly one bulk action: `Delete`, styled destructive, which raises the same confirmation message and then deletes each selected id.

| Event | Toast |
|---|---|
| Created | `Fitness function created` |
| Duplicated | `Fitness function duplicated` |
| Updated | `Fitness updated successfully` |
| Deleted | `Fitness deleted successfully` |

### Roles, permissions and quota

The frontend role matrix for the `fitness-functions` feature:

| Role | View | Edit | Create | Delete |
|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | No |
| Analyst | Yes | No | Yes | No |

These are UX affordances only. The backend is the real gate, and it does not match the table above:

| Endpoint | Required claim |
|---|---|
| `GET /fitness`, `GET /fitness/metadata`, `GET /fitness/metrics`, `GET /fitness/:id/versions`, `POST /fitness/sandbox` | `fitness:read` |
| `POST /fitness`, `POST /fitness/:id/duplicate` | `fitness:create` |
| `PUT /fitness`, `POST /fitness/:id/metric`, `DELETE /fitness/:id/metric` | `fitness:update` |
| `DELETE /fitness` | `root:all` |

> [!WARNING]
> `DELETE /fitness` requires `root:all`, not a `fitness:delete` claim. A user whose UI shows an enabled Delete action can still be refused by the API. Update, versions, duplicate, promote and demote additionally require **full scope** on the source row — readable is not enough, which is what stops a private function being duplicated to read its code and history.

Creation is quota-limited. `fitness` is a quota resource with a free-tier default of **2**, enforced on both `POST /fitness` and `POST /fitness/:id/duplicate`. Built-in rows have no organization and do not count against the cap. Quotas are create-only: an organization already over a cap keeps everything it has, it just cannot add more. See [tokens and billing](/docs/tokens-and-billing).

## Creation wizard and advanced options

### The creation flow is a single editor screen

There is no multi-step wizard. `New Fitness` swaps the list for one editor screen in place — `/fitness?mode=create` is the equivalent deep link — with a center zone for the implementation, a right rail of collapsible sections, and an actions row. Pressing `Create fitness` opens a naming confirm dialog, and **that dialog is the only path that persists anything**.

| Mode | Header title | Header subtitle |
|---|---|---|
| Create | `Create Fitness` | `Define a new fitness implementation` |
| View | `View Fitness` | `Read-only view. Click Back to return to the list.` |
| Edit | `Edit Fitness` | `Update definition and implementation details for this fitness` |

A `Back` button appears only in view mode.

### Modality selector

A segmented control at the top right of the editor:

| Value | Label | Enabled |
|---|---|---|
| `internal` | `Internal` | Create mode only |
| `external` | `External` | Create mode only |
| `declarative` | `Rule-based` | Never — permanently disabled, tooltip `Rule-based fitness functions are coming soon.` |

### Center zone — Internal

The center zone is a Monaco Python editor, 320px tall, word-wrap on, minimap off, with `Ctrl`/`Cmd`+`S` bound to Save. Above it sits the code toolbar: reset-to-template, a live-validation chip, go-to-error, import, export, fullscreen, format, plus two fitness-specific controls — a `Reference` button opening the `Fitness Reference` dialog, and a gear button labelled `Validation universe` opening the universe picker.

| Field | Type | Default | Validation | Message |
|---|---|---|---|---|
| Python source | Code editor | A generated template named after the function | Must not be blank | `Python implementation cannot be empty` |
| — | — | — | Compiler run must pass | `Fitness validation failed. Please check your logic/endpoint.` |

While the code is still the untouched scaffold, an info alert reads: `Using template code. Changes to name or description will update the template. Edit the code to switch to custom mode.` The fullscreen dialog is titled `Edit Code - {{name}}`, falling back to `Fitness` when unnamed.

The `Validation universe` picker retargets the synthetic validation fixture at real ticker codes and a real window — the modes are `Default (SPY)`, `Tickers` and `Asset group`.

### Center zone — External

There is no code editor in external mode, and no `Reference` dialog. The center zone shows the embedded `external-fitness` documentation block and three fields.

| Label | Type | Default | Validation | Message |
|---|---|---|---|---|
| `Endpoint` | Text, placeholder `https://api.example.com/fitness` | empty | Must not be blank | `Endpoint is required` |
| `Max Concurrency` | Number, `min` 1, `step` 1 | `4` | Numeric and ≥ 1 | `Must be ≥ 1` |
| `Timeout (seconds)` | Number, `min` 1, `step` 1 | `30` | Numeric and ≥ 1 | `Must be ≥ 1` |

A plain `http://` URL raises a warning-coloured helper that never blocks Save:

`Unencrypted (http://) — the request and your endpoint's reply travel in cleartext. Fine for testing; use https:// in production.`

The Save button is enabled once there is something to validate: non-empty code for internal, non-empty endpoint for external. Naming is collected later, by the confirm dialog.

### Parameters panel

The `Parameters` rail section is expanded by default and badges the declared count.

| Field | Type | Default | Notes |
|---|---|---|---|
| `Parameter name` | Text | empty | Must match the kwarg in your signature |
| `Type` | Select — `Integer` (`integer`) or `Float` (`float`) | `Float` | No strings, booleans or categoricals |
| `Test value` | Number | empty | Helper while empty: `Any value in your planned range.` |
| `Description (optional)` | Text | empty | Free text |

The panel's info hint reads `Parameters are injected after simulation and data in your fitness function signature. Only integer and float types are supported.` and its caption reads `Supported types: integer & float — strings and booleans are not allowed.` The add button is `+ Add`; the empty state is `No parameters. Add them manually or edit the function signature in the code editor.`

The panel and the code stay in sync both ways: editing the Python `def` signature re-derives the parameter set, minus `simulation`, `data`, and every data-source runtime kwarg. Parameters discovered that way default to `float` with no test value.

> [!NOTE]
> A fitness parameter has **no bounds, min, max, step or choices**. It carries only `parameter_name`, `dtype`, an optional `description`, and a `test_value`. `test_value` is editor metadata used by the compiler and the sandbox — the optimizer never reads it, and it is not a default.

### Advanced options panel

The right rail holds the following sections. `Advanced options` is collapsed by default; a validation error force-opens it.

| Section | Position | Default state | Badge | Contents |
|---|---|---|---|---|
| `Parameters` | Top level | Expanded | Declared parameter count | The parameters editor above |
| `Data sources` | Top level | Expanded | Count when above zero | The data-source picker; flags a source with missing configuration as an error |
| `Advanced options` | Top level | Collapsed | Derived from its children | Container only |
| `Variables` | Inside Advanced options | Collapsed, lazy | Data sources plus parameters | Live inspector of the real shape and sample contents of everything your function receives |
| `Validation` | Inside Advanced options | Expanded once its parent is open | — | The validation result, plus `Output sample` for internal functions |
| `Version History` | Top level, **edit mode only** | Collapsed, lazy | Number of versions | Diff any version against the editor; `Restore` is offered for internal functions only |

The `Data sources` section is where extra data is wired. Its explainer reads `Price is always attached. Anything else — fundamentals, sentiment, your own clusters — has to be declared here so the platform knows to load it and hand it to you.`

> [!NOTE]
> There is no "Extra data" button in the editor toolbar. Data wiring lives entirely in the `Data sources` rail section. The legacy `extra_data_config` convention was retired in the pipelines cutover; only graph-resolved extras flow now.

The `Output sample` panel inside `Validation` runs your function once and reports what it received:

| Element | String |
|---|---|
| Title | `Output sample` |
| Subtitle | `The score and the pipeline data injected into your fitness on a sample run.` |
| Button | `Preview output`, then `Refresh` |
| Score label | `Score` |
| Table | `Injected inputs`, with columns `Input` and `Resolved value` |
| No inputs | `No pipeline data injected — connect a pipeline to receive its outputs.` |
| Error | `Could not load the output sample.` |

### Naming confirm dialog

Nothing is saved until this dialog is confirmed.

| Element | String |
|---|---|
| Dialog title | `Confirm Action` |
| Message on create | `Name your fitness function to create it.` |
| Message on edit | `Review the name and description before saving.` |
| Name field | `Name`, helper `Lowercase identifier — also the Python function name.` |
| Description field | `Description` |
| Collision helper | `Already in use — it will be saved as “{{name}}”` |
| Client-side name collision | `A fitness with this name already exists` |
| Server name conflict | `A fitness function named "<name>" already exists in your organization.` |

The typed name is lowercased and spaces become underscores, because **the name is the Python entrypoint name** — the compiler rejects a function whose `__name__` does not match. For internal functions the entrypoint is renamed to match, or the whole template regenerated while you are still on the untouched scaffold. Renaming changes the bytes, so the dialog drops the validation pin and re-validates before saving.

Names are allocated rather than rejected: the server takes the next free ordinal — `my_fitness (2)` — inside the transaction. A 409 only happens on a lost race.

### Validation receipt gate

For **internal** functions, both `POST /fitness` and `PUT /fitness` require a validation receipt: a completed validate job created within the last hour whose payload hash matches this exact code plus data-source graph. Without one the save fails with HTTP 406, `kind: "validation_receipt_missing"`, and the message:

`This code has not been validated as a fitness function. Validate it (POST /validate/internal/…) before saving.`

| Endpoint | Job kind | Returns |
|---|---|---|
| `POST /validate/internal/fitness` | `validate_internal_fitness` | 202 `{job_id, status:"pending"}` |
| `POST /validate/external/fitness` | `validate_external_fitness` | 202 `{job_id, status:"pending"}` |
| `POST /compiler/validate/internal/fitness` | — | Synchronous live validation, internal only |

Unlike the strategy path, fitness validation does not measure memory and does not run a causality gate — a fitness has no memory profile and no warmup to prove. The import allow-list is advisory for fitness (a warning, not a hard error).

The compiler's `error_type` taxonomy for fitness: `syntax_error`, `compilation_error`, `no_fitness_function`, `name_mismatch`, `unconnected_data_source`, `invalid_validation_universe`, `backend_resolver_error`, `pipeline_error`, `execution_error`, `invalid_output`.

An unreviewed editor draft blocks both validation and save, with `Review the draft before saving` / `This editor is showing an unsaved draft you haven't reviewed. Keep it or discard it, then save.`

### Breaking-change dialog and version history

Saving an **internal** function that is already used by at least one study, when either the code or the parameter names changed, raises a confirmation:

`Saving creates a new version of "{{name}}". Studies that have already launched stay pinned to the version they ran with, so their results won't change.`

Versions are appended by a database trigger, and only when the execution type, execution details, parameters, extra data config or deletion state actually change — a no-op save appends nothing. `PUT /fitness` also carries `expected_updated_at` as an optimistic-concurrency cursor; a mismatch is a **409**, not a silent overwrite.

> [!NOTE]
> `data_sources` on `PUT /fitness` distinguishes absent from empty. `null` or an omitted key means "leave the wiring alone"; `[]` means "clear it".

### Promote to a portfolio metric

Any non-built-in fitness function can be promoted to a first-class portfolio metric, computed in batch and usable anywhere a built-in metric is — see [metrics reference](/docs/metrics-reference).

| Field | Label | Default | Rule |
|---|---|---|---|
| Display label | `Display label` | The function name | Required, non-empty after trim. Helper: `What column headers and metric pickers will show.` |
| Slug | `Metric slug` | Slugified function name | Lowercase letters, digits and underscores; max 110 characters; stored as `custom:` plus the slug |
| Direction | `Direction` | `↑ Higher is better` | One of `↑ Higher is better`, `↓ Lower is better`, `— Informational` |
| Unit | `Unit`, placeholder `ratio` | empty | Free text |
| Category | `Category` | `custom` | Free text |
| Frozen parameters | `Frozen parameters` | Each parameter's `test_value` when it has one | Every declared parameter must be pinned to a finite number |
| Compute toggle | `Compute this metric` | On | Off registers the metric without computing it |

Dialog title is `Promote to portfolio metric`, or `Edit portfolio metric` when one already exists. Subtitle: `Makes this function selectable and sortable like a built-in metric. Values are computed on the next metrics run.` Buttons are `Cancel` and `Promote`, or `Save changes` when editing.

Client-side errors: `A slug is required.`, `Leave out the 'custom:' prefix — it is added automatically.`, `Only lowercase letters, digits and underscores.`, `Too long (max 110 characters).`, `Pin this parameter to a number.`

Server rejections include `display_label must not be empty`, `direction must be one of higher_is_better, lower_is_better, informational (got '<x>')`, `parameters must pin every declared hyperparameter; missing: a, b`, and `Metric "<name>" is already in use by another fitness function in your organization.` (409).

Semantics worth knowing before you promote:

- One promotion per function — re-posting edits it in place, and both create and update answer **201**.
- Values are computed for the `train`, `validation` and `out_of_sample` stages only. `real_life_performance` is excluded on purpose, because its end date moves on every run.
- Renaming the slug **deletes** the values already written under the old name.
- Removing the metric deletes both the promotion and every computed value. To stop computing while keeping history, re-promote with the compute toggle off.
- A cell that failed to compute is absent rather than a sentinel: it renders as an em dash and is excluded from ranking.

## Execution modes

### Internal — the Python signature

Internal is Python you write, stored on the platform and executed by Fintela — inside the optimizer for a study, and inside a credential-scrubbed subprocess for a sandbox run. The contract is fixed:

```python
def my_fitness(simulation, data, **params) -> float:
    """Score one simulated period. Bigger is better by default."""
    ...
```

| Argument | Python type | What it is |
|---|---|---|
| `simulation` | `dict` | The period-sliced simulation result. Keys: `equity`, `metrics`, `holdings`, `orders`, `trades`. |
| `data` | `pandas.DataFrame` or `None` | The study's fitness asset group adjusted-close panel — **full history, un-windowed**. `None` when the study has no fitness asset group. |
| `**params` | `int` / `float` | Your declared parameters, plus any data-source output whose kwarg name you declared. |

Both fixed arguments are bound **by name** at every call site — the optimizer wrapper, the compiler validator and the sandbox runner all call `fn(simulation=…, data=…, **kwargs)` — so `def score(data, simulation)` is legal and receives the correct payloads.

The compiler finds your entrypoint by picking **the first callable in definition order whose parameter names are a superset of `{"simulation", "data"}`**, and then requires that its `__name__` equal the saved fitness name.

> [!WARNING]
> A helper defined **above** the entrypoint that declares the same two arguments is picked instead, and the save fails with `error_type: name_mismatch`. Define helpers below the entrypoint.

Only kwargs your function actually declares are injected; a `**kwargs` parameter receives everything. Declaring a `required_lookback` is dead code — a fitness gets its panel full-history, so the contract publishes `"declarable": false`, and the agent bridge refuses the field with `Fitness functions declare no lookback window.`

Your code runs with these already imported:

```python
import pandas as pd
import numpy as np
import math
from datetime import datetime
import fintela_strategy_lib as fsl
from fintela_strategy_lib import (apply_boolean_filter, groups_to_eligible_tickers,
    restrict_universe, compose_hierarchical, to_date_str, as_datetime_index, align_to)
```

### What `simulation` contains

```text
simulation = {
  "equity":   { "YYYY-MM-DD": float, ... },        # date-keyed, sliced to the period
  "metrics":  { "<metric name>": float | None },   # already computed for exactly this window
  "holdings": { "YYYY-MM-DD": [ {"ticker": str, "side": "L" or "S",
                                 "allocation": float}, ... ] },
  "orders":   [ {"ticker_code", "order_date", "action",
                 "position_side", "quantity", "resulting_quantity"} ],
  "trades":   [ {...} ],
}
```

Windowing rules, verbatim from the slicer:

| Key | Rule |
|---|---|
| `equity`, `holdings` | Kept when the date key falls inside `[start_date, end_date]` |
| `orders` | Kept when `order_date` falls inside the window |
| `trades` | Kept when `start_date <= entry_date` **and** (`exit_date` is `None` **or** `exit_date <= end_date`) |
| `metrics` | The pre-computed bucket for `"<start>/<end>"`, or `{}` if that bucket is absent |

> [!CAUTION]
> A trade straddling a window boundary is **excluded, not clipped**. A position opened before the window starts does not appear in `simulation["trades"]` for that window at all.

`simulation["metrics"]` is already populated — read `max_drawdown` from there rather than re-deriving it from the equity curve. When the study has a baseline, the benchmark-relative metrics are merged in before your function runs: `beta`, `alpha`, `information_ratio`, `treynor_ratio`, `up_capture`, `down_capture`, `correlation`, `tracking_error`, `r_squared`.

> [!WARNING]
> The validation fixture guarantees only **five** equity metrics — `cagr`, `sharpe_ratio`, `max_drawdown`, `volatility`, `total_return` — plus the nine benchmark ones. Every other catalogue metric is present at runtime but absent from the fixture, so `simulation["metrics"]["sortino_ratio"]` raises `KeyError` during validation and works fine in a real study. Always read with `.get(name, default)`. The same applies in reverse to prices: the fixture is a synthetic frame of `AAPL`, `TSLA`, `MSFT`, `GOOGL`, `AMZN` over `2025-01-01` to `2025-06-30`, so `data["SPY"]` raises during validation. Use the merged benchmark metrics, or the `benchmark` data source.

### Return value and NaN semantics

The published output contract is:

```json
{ "type": "float", "finite": true, "bool_rejected": true }
```

At validation time, two rejections are possible:

| Condition | Message (`error_type: invalid_output`) |
|---|---|
| Not `int` or `float`, or a `bool` | `Fitness must return a number, got <type>. The optimizer maximizes this value, so it has to be a plain float — booleans, strings, lists and dicts are not scores.` |
| `NaN` or `±inf` | ``Fitness returned <v>, which is not a finite number. The optimizer maximizes this value: a NaN makes every trial incomparable and an infinity makes one trial unbeatable, so the study reports a winner that means nothing. Guard the degenerate cases explicitly — an empty `simulation['trades']`, a zero-volatility denominator — and return a large negative number instead.`` |

`bool` is rejected explicitly because it subclasses `int`.

At **run** time the objective is called four times per trial — `train`, `validation`, `overall`, and `out_of_sample` when the study defines that window — and the handling differs:

| Situation | Outcome |
|---|---|
| `NaN` from `train`, `validation` or `overall` | The trial is **pruned** with the reason `nan_fitness` |
| `NaN` from `out_of_sample` | Not fatal — the score becomes `None` and the metric is simply absent |
| An exception during the `out_of_sample` call | Swallowed; the score becomes `None` |
| `optuna.TrialPruned` raised by the evaluator | Pruned with the exception's message, or `pruned_during_fitness` when it is empty |
| Any other exception | Classified and the trial pruned |
| A `train`, `validation` or `overall` period-metrics bucket is `None` | Pruned with `period_metrics_out_of_bounds: [...]` |

### Run-time pruning contract strings

`nan_fitness`, `pruned_during_fitness` and `period_metrics_out_of_bounds` are documented verbatim contract strings — they are persisted as a trial's failure reason and matched by prefix downstream. See [API errors](/docs/api-errors) and [analyzing results](/docs/analyzing-results).

Built-in objectives contribute three more:

- `Built-in metric '<name>' missing for this period`
- `Built-in metric '<name>' not numeric: <repr>`
- `Built-in metric '<name>' is non-finite: <v>`

### External — the evaluate endpoint contract

External means you host the scorer yourself, in any language, on your own infrastructure, against your own private data. Fintela stores only the URL, a timeout and a concurrency ceiling — never your code. For the full walkthrough see [external fitness](/docs/external-fitness) and the [Python/FastAPI](/docs/python-fastapi) and [Node/Express](/docs/node-express) guides.

Fintela calls one path, `POST {your endpoint}/evaluate`. The **body is the period-sliced simulation dict** and the **fitness parameters travel in the query string**:

```http
POST /evaluate?window=20&threshold=1.5 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "equity":   { "2025-01-02": 100000.0, "2025-01-03": 100420.5 },
  "metrics":  { "sharpe_ratio": 1.42, "max_drawdown": -0.081 },
  "holdings": { "2025-01-02": [ { "ticker": "AAPL", "side": "L", "allocation": 0.25 } ] },
  "orders":   [],
  "trades":   []
}
```

The reply must be a JSON object with a top-level **`fitness`** number:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{ "fitness": 1.9427 }
```

> [!WARNING]
> The response key is `fitness`, not `score`. And parameters arrive as **query-string** values, which is the inverse of external strategies — read them from the query, not the body.

Transport behaviour:

| Aspect | Value |
|---|---|
| Timeout | `execution_details.timeout`, in **seconds**, applied as a whole-request `httpx.Timeout`. Editor default `30`. |
| Concurrency | `execution_details.max_concurrency`, editor default `4` |
| Connection pool | 2 connections per worker, 2 keep-alive, 30s keep-alive expiry |
| Retries | 4 attempts total (1 plus 3 retries), full-jitter exponential backoff, base 1.0s, ceiling 8.0s |
| Retried statuses | `429`, `502`, `503`, `504` |
| Retried exceptions | `ConnectError`, `ConnectTimeout`, `PoolTimeout`, `RemoteProtocolError` |
| Authentication | **None.** Fintela sends no credential to your endpoint. |
| Redirects | Never followed |
| SSRF screen | The endpoint is screened before the first connection, once per worker process |

> [!TIP]
> Set `timeout_keep_alive` to at least 30 seconds on your server. Fintela holds pooled connections warm for 30s across the batch gap; a server that closes at the default 5s leaves a half-open socket that costs a retry on every batch.

Failure surfaces:

| Condition | Result |
|---|---|
| HTTP 200 with a body that is not JSON, or with no `fitness` key | The trial is pruned with `Your external fitness endpoint returned a response that is not the expected shape: it must be JSON with a top-level "fitness" number. (<Type>: <msg>)` |
| Any other error after retries | The trial is pruned with `<ExceptionType>: <message>`; the study continues |

At validation time the compiler posts the synthetic simulation to `{endpoint}/evaluate` with your test parameters and rejects with `endpoint_error`, `invalid_response` or `invalid_output`. Its exact strings are `Endpoint response is not valid JSON`, `Endpoint response must be a JSON object with a 'fitness' key`, `Endpoint returned HTTP <code>: <first 500 chars>`, and `'fitness' must be a number, got <type>`.

The sandbox path differs from the optimizer path in two ways: the timeout falls back to **60** seconds when `execution_details.timeout` is missing, and parameters are stringified before they are sent.

### External endpoint URL rules

Endpoint URLs are screened at save time and rejected with HTTP 406 carrying the message verbatim:

| Rule | Rejection message |
|---|---|
| No whitespace or control characters | `EXTERNAL endpoint must not contain whitespace or control characters` |
| Must parse as a URL | `EXTERNAL endpoint is not a valid URL (<reason>): '<endpoint>'` |
| Scheme must be `http` or `https` | `EXTERNAL endpoint must use http:// or https:// (got '<scheme>').` |
| A host must be present | `EXTERNAL endpoint must include a host` |
| Host must not be loopback | `EXTERNAL endpoint host must not be loopback/localhost` |
| A literal IP must be publicly routable | Rejected by the SSRF guard |

There is deliberately no port allowlist — the port carries no SSRF signal, the host does.

> [!NOTE]
> `http://` is **accepted**. TLS is not the SSRF control here. The editor shows a cleartext advisory that never blocks the save.

### Built-in — the platform objective catalogue

Built-in objectives are platform-seeded rows that run no user code: the evaluator reads `simulation["metrics"][metric_name]` directly. They are visible to every organization, have `created_by_username` of `platform`, carry no version history, and cannot be created, edited, deleted, duplicated, sandboxed or promoted. In each case the row `name` equals the `metric_name`.

| Metric key | Direction | Unit | Category |
|---|---|---|---|
| `total_return` | higher_is_better | `%` | return |
| `compound_annual_growth_rate` | higher_is_better | `annualized %` | return |
| `volatility` | lower_is_better | `annualized` | risk |
| `max_drawdown` | lower_is_better | `ratio` | risk |
| `average_drawdown` | lower_is_better | `ratio` | risk |
| `max_drawdown_duration` | lower_is_better | `days` | risk |
| `ulcer_index` | lower_is_better | `ratio` | risk |
| `var_95` | lower_is_better | `daily ratio` | risk |
| `cvar_95` | lower_is_better | `daily ratio` | risk |
| `sharpe_ratio` | higher_is_better | `ratio` | risk_adjusted |
| `sortino_ratio` | higher_is_better | `ratio` | risk_adjusted |
| `calmar_ratio` | higher_is_better | `ratio` | risk_adjusted |
| `martin_ratio` | higher_is_better | `ratio` | risk_adjusted |
| `omega_ratio` | higher_is_better | `ratio` | risk_adjusted |
| `profit_factor` | higher_is_better | `ratio` | risk_adjusted |
| `recovery_factor` | higher_is_better | `ratio` | recovery |
| `skewness` | higher_is_better | `dimensionless` | distribution |
| `excess_kurtosis` | lower_is_better | `dimensionless` | distribution |
| `tail_ratio` | higher_is_better | `ratio` | distribution |
| `win_rate` | higher_is_better | `%` | distribution |
| `payoff_ratio` | higher_is_better | `ratio` | distribution |
| `alpha` | higher_is_better | `annualized %` | benchmark |
| `information_ratio` | higher_is_better | `ratio` | benchmark |
| `treynor_ratio` | higher_is_better | `ratio` | benchmark |
| `up_capture` | higher_is_better | `%` | benchmark |
| `down_capture` | lower_is_better | `%` | benchmark |

That is 26 objectives. The five benchmark ones require the study to have a baseline; a study that picks one without a benchmark is blocked at launch with a message naming the cause, rather than pruning every trial.

Some catalogue metrics are deliberately **not** available as objectives:

| Excluded | Why |
|---|---|
| `trade_win_rate`, `trade_profit_factor`, `avg_trade_duration`, `expectancy` | Not derivable from the equity-derived metrics dict |
| `beta`, `correlation` | Informational direction. Optuna requires a direction, and the platform will not claim one on your behalf — write a fitness function that states your target instead. |
| `tracking_error`, `r_squared` | Present in the benchmark catalogue but never seeded as objectives |
| `fitness` | A pseudo-metric: the objective's own output, injected after scoring |

Attempting any write against a built-in row returns the exact message for the operation: `Built-in fitness objectives are seeded by the platform and cannot be created via the API.`, `Built-in fitness objectives are read-only.`, `Cannot delete built-in fitness objectives: [ids]`, `Built-in fitness objectives cannot be duplicated.`, `Built-in fitness objectives are already metrics and cannot be promoted`, and `Built-in fitness objectives cannot be sandboxed — they are computed by the simulation engine.`

### Rule-based (declarative) — not available

The `Rule-based` modality is a scaffold. The segmented control option is permanently disabled, and the API rejects persistence with `Rule-based (declarative) fitness functions are not supported yet.` It exists only as an enum variant and a database constraint value. Do not build against it.

### Where each mode applies

| Capability | Internal | External | Built-in | Rule-based |
|---|---|---|---|---|
| Create / edit / delete | Yes | Yes | No | No — rejected at save |
| Runs your own code | Yes, on Fintela | Yes, on your infrastructure | No | — |
| Private data stays with you | No — code is stored on the platform | Yes | — | — |
| Declared parameters | Yes | Yes, sent as query-string values | No | — |
| Data sources injected as kwargs | Yes | No | No | — |
| Validation receipt required to save | Yes | No — but the endpoint URL is screened | — | — |
| Version history and `Restore` | Yes | History only, no `Restore` | No | — |
| `Run a backtest` sandbox | Yes | Yes | **No** | — |
| Promote to a portfolio metric | Yes | Yes | **No** | — |
| Live as-you-type validation | Yes | No | — | — |
| `Output sample` preview | Yes | No | — | — |

For how a fitness function fits into a full run, see [execution modes](/docs/execution-modes), [study lifecycle](/docs/study-lifecycle), [optimizer architecture](/docs/optimizer-architecture) and the [end-to-end workflow](/docs/end-to-end-workflow). The HTTP surface is documented at [API: fitness](/docs/api-fitness).
