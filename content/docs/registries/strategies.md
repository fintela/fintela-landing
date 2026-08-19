---
title: Strategies
section: Registries
sectionOrder: 3
order: 3
published: true
updated: 2026-08-18
summary: The Python signal logic a study optimizes — its deterministic function signature, parameters, and internal vs external execution.
keywords: strategy, python, signal, parameters, editor, sandbox, internal, external, simulate, execution type, versions
---

A strategy is the registry object that produces a **signal**: a mapping of rebalancing date → ticker → `{position, allocation}`. Everything downstream — the simulation engine, the optimizer, the live portfolio updater — consumes that one dictionary. It is the only registry resource that is *executed code* rather than configuration, so it carries a fixed function contract, a declared parameter schema, a warmup declaration and a server-side validation gate that a save cannot bypass.

## Overview and purpose

A strategy answers one question: **on this date, which instruments do I hold, on which side, and at what weight?** It does not decide whether the result is good (that is a [fitness function](/docs/fitness-functions)), it does not decide which instruments exist (that is an [asset group](/docs/asset-groups)), and it does not sweep its own parameters (that is a [study](/docs/studies)).

### Where a strategy sits

```text
  Asset Group          Strategy            Fitness Function
  (the universe)   (declares params)      (scores a trial)
        │                  │                      │
        └──────────────────┼──────────────────────┘
                           ▼
                        Study
        (assigns each parameter a range, a
         choice subset, or a fixed value —
         then runs N trials)
                           │
                           ▼
        trial → signal → simulation → portfolio
```

### What consumes a strategy

| Consumer | How it runs the strategy | Notes |
|---|---|---|
| Study / optimizer | Once per trial, with the sampled parameter values | A launched study stays pinned to the strategy version it started with |
| Sandbox — "Run a backtest" | One-off, at values you type, over an asset group and date range | Costs **1 token** per run (`sandbox_run`) |
| Compiler validation | Executes your code against a fixture panel before any save | See [Save flow and confirmation dialogs](#save-flow-and-confirmation-dialogs) |
| Live trading / portfolio updater | Runs the saved code on the promoted portfolio's schedule | See [live trading](/docs/live-trading) |

For how the pieces combine end to end, see [core concepts](/docs/core-concepts), the [end-to-end workflow](/docs/end-to-end-workflow) and the other [registries](/docs/registries). Strategies are read-only over the public API — creating and editing happens in the app; see [strategies API](/docs/api-strategies).

### Screens

| Path | Screen |
|---|---|
| `/strategy` | Registry list — table or tile view |
| `/strategy?mode=create` | Opens the create editor directly |
| `/strategy/view/:id` | Read-only detail; the whole form is a disabled fieldset |
| `/strategy/edit/:id` | Editor |
| `/strategy/sandbox` | Sandbox with no strategy preselected |
| `/strategy/sandbox/:id` | Sandbox with strategy `:id` preselected |

> [!NOTE]
> Public sharing and forking of strategies are **not** on `/strategy`. They live in the Laboratory (`/laboratory/public`), which is entitlement-locked on the free tier. See [Laboratory](/docs/laboratory).

## Registry table view

The list is the shared registry workbench: an insights band above the table, a search box, a filter panel, a column chooser, and a grid/tile toggle persisted in local storage.

### Columns

| Column | Header | Shown by default | Contents |
|---|---|---|---|
| `name` | **Name** | Yes | The strategy name — also the Python entry-point function name |
| `description` | **Description** | Yes | A generated sentence describing the row — type, execution logic, declared parameters, advanced settings, version. Your stored text moves to the cell's hover tooltip, labelled **Author's note** |
| `execution_type` | **Execution Type** | Yes | An outlined chip showing the raw value: `internal` or `external`, lowercase |
| `author` | **Author** | Yes | `created_by_username` |
| `created_at` | **Created At** | Yes | Creation timestamp |
| `studies` | **Associated Studies** | No — column chooser | Count of studies referencing this strategy |

> [!WARNING]
> There is no **Version** column and no **Data sources** column on this table, despite those labels existing in the locale file. The latest version number is on the wire (`latest_version`) but is not rendered as a column. There is also no visibility or share toggle — the grid has no sharing control at all.

### Filters and search

| Control | Type |
|---|---|
| Name | Text |
| Description | Text |
| Execution Type | Multiselect |
| Author | Multiselect |
| Associated Studies | Number range |
| Created At | Date range |

The search box (placeholder **"Search strategies…"**) matches on name, stored description, the resolved description text and the author name, together — so a strategy is findable by its endpoint host, a parameter name or an injected data source, not only by what you typed into the Description field.

Two views share the same data: a grid and a tile mosaic, toggled and remembered per registry in local storage. The tile shows the name as its title, the description as its subtitle, and execution type, author and creation date as facts. An always-visible insights band sits above the table, grouping rows by execution type and by study usage.

### Chrome

| Element | Exact string |
|---|---|
| Page title | Strategies |
| Table aria-label | `strategy table` |
| Create button | **New Strategy** — disabled without create permission |
| Empty state title | No strategies yet |
| Empty state body | Create your first strategy to start building portfolios. |
| Loading skeleton columns | Name / Parameters / Created |
| Error screen | Error loading strategy definitions |
| Update toast | Strategy updated successfully |
| Delete toast | Strategy deleted successfully |

The `?` button opens the contextual docs panel with the `strategies` and `external-strategies` blocks.

### Row action menu

Left-click a row for the actions popover; right-click for the same list as a context menu at the pointer.

| Action | What it does | Disabled when |
|---|---|---|
| **Run a backtest** | Navigates to `/strategy/sandbox/{id}` | Never |
| **View** | Navigates to `/strategy/view/{id}` | Never |
| **Edit** | Navigates to `/strategy/edit/{id}` | The strategy is used by at least one study, or your role cannot edit |
| **Duplicate** | `POST /strategies/{id}/duplicate` — creates a copy you own | Your role cannot create |
| **Delete** | Opens the confirmation dialog | The strategy is used by at least one study, or your role cannot delete |

A disabled **Edit** or **Delete** carries the tooltip: *"This item is currently used in a study and cannot be edited."*

### Bulk delete and confirmation

There is exactly one bulk action, **Delete**, marked destructive. Single and bulk delete share the same confirmation copy:

> Are you sure you want to delete the selected strategy? If any, associated data will also be deleted.

> [!CAUTION]
> Bulk delete issues **one `DELETE /strategies` request per selected row**, not one batched call. A partial failure is possible: some rows delete and others do not.

### Permissions

| Role | View | Edit | Create | Delete |
|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | No |
| Analyst | Yes | No | Yes | No |

The free-tier quota is **2 strategies** (`max_strategies`), counted as non-deleted rows in your organization. It is enforced on **create only** — on `POST /strategies` and on duplicate. An organization already above the cap keeps everything working and simply cannot add more; deleting one frees a slot. A role failure (403) is returned before a quota failure (402).

## Creation wizard and advanced options

> [!IMPORTANT]
> There is no multi-step wizard. The strategy editor is a single two-zone screen: a **center zone** (the Python editor for internal, the endpoint form for external, with the `required_lookback` snippet editor beneath it) and a **rail of collapsible sections** to its right. Name and description are not fields in the form — they are collected by a confirmation dialog at save time.

### Editor header and modality selector

| Mode | Title | Subtitle |
|---|---|---|
| create | Create Strategy | Define a new strategy implementation |
| edit | Edit Strategy | Update definition and implementation details for this strategy |
| view | View Strategy | Read-only view. Click Back to return to the list. |

A segmented control in the header offers three options:

| Option | Value | State |
|---|---|---|
| **Internal** | `internal` | Selectable in create mode only |
| **External** | `external` | Selectable in create mode only |
| **Rule-based** | `declarative` | **Permanently disabled** — tooltip *"Rule-based strategies are coming soon."* |

> [!WARNING]
> An existing strategy can never change execution type. The control is disabled outside create mode, and the agent path refuses with *"An existing resource's execution type cannot be changed."* The server rejects any declarative strategy outright: *"Rule-based (declarative) strategies are not supported yet."*

### Center zone — Internal

A Monaco Python editor, 320px tall, word wrap on, minimap off. `Ctrl`/`Cmd`+`S` saves. While the code is still the untouched scaffold a banner reads *"Using template code. Edit the code below to switch to custom mode."*

Toolbar controls: reset to template, a live validation chip with **Go to error** and **Validate now**, import/export code, fullscreen (dialog **"Edit Code - {{name}}"**), **Format** (`POST /compiler/format`), **Reference** (opens the Strategy Reference dialog), and a gear icon (aria-label `validation settings`).

The editor also fetches `GET /compiler/contracts/strategy` and uses it to drive Monaco completion, hover help, and inline import-lint markers against the allowed-import list.

**Live validation** fires on a 2000 ms debounce straight to `POST /compiler/validate/internal/strategy` — internal strategies only, and only once an entry-point name has been parsed. It uses a 25-ticker sample for latency. If you set a custom validation universe with more than **250** tickers, auto-firing is suppressed and you press **Validate now** instead.

### Center zone — External

| Field | Label | Type | Default |
|---|---|---|---|
| `endpoint` | **Endpoint** | Text, placeholder `https://api.example.com/strategy` | empty |
| `max_concurrency` | **Max Concurrency** | Number, `min=1`, `step=1` | **4** |
| `timeout` | **Timeout (seconds)** | Number, `min=1`, `step=1` | **30** |

A plain `http://` endpoint shows an advisory helper — *"Unencrypted (http://) — the request and your endpoint's reply travel in cleartext. Fine for testing; use https:// in production."* — that never blocks the save.

Below the fields sits an optional validation-universe picker, prefaced by: *"Optional: tickers sent to your endpoint's /simulate (as a `tickers` body key) at validation and in production — a universe-parametric endpoint can use them to scope its output. Endpoints that ignore it are unaffected."*

### Parameters panel

Parameters are the knobs a study optimizes. The panel header is **Parameters**, with the tooltip *"Parameters are injected into your strategy function after start_date and end_date. Integer, float and categorical (named string choices) types are supported."* **+ Add** appends a row; a new row defaults to type `Integer`.

| Control | Label | Notes |
|---|---|---|
| Name | **Parameter name** | Free text. Empty-named rows are dropped on save |
| Type | **Type** | **Integer** / **Float** / **Categorical** |
| Test value | **Test value** | Numeric field (`step` = `1` for integer, `any` for float); a select of the declared choices for categorical. Helper while empty: *"Any value in your planned range."* |
| Choices | **Choices** | Categorical only. Free-form chips, placeholder *"Type a choice and press Enter"*, helper *"Declared labels the parameter can take. Studies explore a subset or pin one."*. Trimmed, de-duplicated, order preserved |

Parameters are also **derived from your code**: editing the Python signature adds, removes and renames parameter rows automatically. Argument names that match an injected data source's runtime kwarg are filtered out, so a data source never becomes an optimizable parameter.

> [!NOTE]
> The sub-caption under the header reads *"Supported types: integer, float — free-form strings and booleans are not allowed; use a categorical parameter for named options."* It hard-codes only two names while the dropdown offers three. **Categorical is fully supported.** The Parameters tab of the in-app Strategy Reference dialog is also out of date: it claims strings are unsupported and tells you to encode choices as integers, and it describes a "Window Size" flag the parameter form no longer has. Ignore both.

#### Parameter validation rules

The backend normalizes `int`/`integer` → `integer` and `float`/`double` → `float`. These are the exact rejection messages:

| Rule | Message |
|---|---|
| Known dtype | `Parameter <n>: unsupported datatype "<x>" (expected integer, float, or categorical).` |
| Categorical needs choices | `Categorical parameter <n> must declare a non-empty choices list.` |
| At most 100 choices | `Categorical parameter <n> declares <k> choices (maximum is 100).` |
| No blank choice | `Categorical parameter <n> has a blank choice.` |
| No duplicate choice | `Categorical parameter <n> has duplicate choice "<c>".` |
| Categorical test value is a declared choice | `Test value for categorical parameter <n> must be a string, got <v>.` / `Test value "<s>" for parameter <n> is not one of the declared choices [...].` |
| Numeric params carry no choices | `choices is only valid for categorical parameters; <n> has datatype "<x>".` |
| Numeric test value is a finite number | `Test value for parameter <n> must be a number, got <v>.` / `Test value for parameter <n> must be a finite number.` |
| Integer test value is integral | `Test value <v> for integer parameter <n> must be integral.` |

### How parameters become the optimizer search space

A strategy declares only the **dtype** and, for categorical, the **choice set**. It declares no bounds, no step and no default — those fields do not exist on a strategy anywhere in the schema.

The search space is assigned by the [study](/docs/studies), which stores one spec per parameter:

| Study spec | Shape | Meaning |
|---|---|---|
| Range | `{minimum, maximum}` | Numeric parameter swept between the bounds |
| Choices | `{choices: [...]}` | A subset of the strategy's declared categorical choices |
| Fixed | `{value}` | Pinned to one number, or one declared choice string |

Precedence when more than one key is present is `value` > `choices` > `minimum`/`maximum`.

> [!CAUTION]
> **`test_value` is not a default.** It is editor metadata — the single concrete value your code is executed with during validation and live-validation. The optimizer never reads it. Pick a value from the middle of the range you plan to sweep; unrepresentative values prove the wrong thing.

### Advanced options panel

The rail sections, in order:

| Section | Default | Summary badge | Contents |
|---|---|---|---|
| **Parameters** | Expanded | Count of declared parameters | The parameter editor above |
| **Data sources** | Expanded — **internal only** | Count of selected sources; error state when a source is missing required config | The built-in data injected as kwargs on top of the price panel |
| **Advanced options** | Collapsed | Derived from its children | Container for the three below |
| ↳ **Variables** | Collapsed, lazy | Sources + parameters count | Live inspector of the exact runtime surface your function receives |
| ↳ **Lookback** | Collapsed | **Custom function** or **Auto-synced** | The `required_lookback` declaration |
| ↳ **Validation** | Force-opened on a validation error | — | Classified error, traceback, warnings, and the internal-only Output sample panel |
| **Version History** | Collapsed, lazy — **edit mode only** | Number of versions | The append-only version list |

Every section carries a "why" popover. The Validation one is worth reading in full: *"Saving needs a passing run — we execute your code in the compiler sandbox, not just parse it."* … *"The backend won't accept a save without a recent passing run for this exact code. Edit it and it has to pass again."* … *"It also proves there's no look-ahead bias: we run a short window and a long one and reject the save if appending future data changes a past signal."*

#### Lookback declaration

Lookback is **always a Python function**, for internal and external strategies alike. The rail hint reads: *"Define a required_lookback(...) function in the editor. It takes your parameters as kwargs — a subset is fine — and returns an int between 1 and 5000."*

```python
def required_lookback(slow_ma, fast_ma, signal_window):
    return max(slow_ma, fast_ma) + signal_window
```

The snippet editor renders in the center zone under the main editor (Monaco, Python, 220px). Its header carries either **Reset to auto-sync** (when the snippet is custom) or an **Auto-synced** chip: *"This lookback is generated from your parameters and stays in sync as you edit them. Edit it to customize — your code is kept and only the signature is realigned."*

What the value does:

- The price panel is sliced starting `max_window - 1` trading days before your start date, so your indicators are warm on day one. Tickers with fewer than `max_window + 1` non-null values are dropped from that run.
- It is evaluated on **every optimizer trial**, with that trial's sampled values.
- At study-create time it is evaluated at **each parameter's maximum** to confirm the asset group has enough history.
- After a successful validation the panel reports: *"Validated. With your test values, `required_lookback` returns **{{days}}** trading days — a study evaluates it again at each parameter's maximum."*

The snippet is compiled in a **narrower sandbox than your strategy body**: builtins `__import__, abs, bool, float, int, isinstance, len, max, min, pow, range, round, sum, Exception, TypeError, ValueError`, plus the globals `pd`, `np`, `math`, `datetime`. Do not assume the strategy sandbox's namespace here.

**Per-source warmups.** `required_lookback` warms only the asset-group price panel (`data=`). A strategy that rolls a calculation over an injected source declares `required_lookback_<source_kwarg>`, and the editor scaffolds a per-reference variant with **Add default-cluster warmups**:

```python
def required_lookback(fast_ma):
    return fast_ma                # asset group price panel (shallow)

def required_lookback_default_clusters__etf_sleeve(etfs_roc, etfs_z):
    return etfs_roc + etfs_z      # that default cluster (deep)
```

> [!WARNING]
> Every injected `default_clusters` reference **must** have its own warmup or the save is blocked: *"Every injected default cluster needs its own warmup. Add `required_lookback_default_clusters__<ref>` for: {{refs}}. Without it the cluster is loaded clipped to the simulation window, so anything rolled over it starts on NaN-starved values while the price panel looks fine."*
>
> Windows applied in sequence **add**; windows applied in parallel take the **max**. Edit each returned window to match its calculation.

#### Validation settings

Behind the gear icon (internal only), titled **Validation settings**:

| Control | Behaviour |
|---|---|
| **Ticker sample size** | Slider `1…496` with marks `1 / 100 / 250 / All`, plus a numeric box clamped to the same range. **496 means "All"** and sends no sample size at all. Hint: *"Fewer tickers = faster validation. Use 496 for a thorough check before saving."* Disabled whenever a custom universe is set — *"Only available with the default universe (SPY holdings). A custom universe already defines the exact ticker list."* |
| **Validation universe** | Three modes — **Default (SPY)** (*"Validate against the standard SPY fixture."*), **Asset group** (picker *"Select asset group"*), and **Tickers** (search field *"Search and add ticker"*), each with an optional **Date range (optional)** of **Start Date** / **End Date** |

The two universe modes bind differently:

| Mode | Stored as | Effect |
|---|---|---|
| **Asset group** | Provenance | *"Remembered as where this strategy was validated, and shown first when you pick a universe for a study. It does not restrict which group a study may use."* |
| **Tickers** | Requirement | *"Saved as this strategy's universe: it will be marked as written for these instruments, and studies on a group that lacks them will warn."* |

Named tickers are the **only** half the study compatibility gate reads. Compared case-insensitively against the study's runnable tickers: if **all** are missing the study is blocked as incompatible; if **some** are missing you get a warning listing them. Leave both empty and the strategy is universe-agnostic — no universe gate runs anywhere.

A custom validation universe is capped at **2000 tickers**. Beyond that the compiler returns 422 and never silently truncates.

### Save flow and confirmation dialogs

The footer has **Cancel** (routed through the unsaved-changes guard) and a primary button labelled **Create strategy** in create mode or **Save changes** in edit mode, showing **Validating...** while a validation runs. The primary button is enabled once the code is non-empty (internal) or the endpoint is non-empty (external).

Pressing save runs these checks in order:

| # | Check | Message on failure |
|---|---|---|
| 1 | No unreviewed editor draft | *"Review the draft before saving"* — keep it or discard it, then save |
| 2 | Code / endpoint present | `Python implementation cannot be empty` / `Endpoint is required` |
| 3 | External numbers are integers ≥ 1 | `Must be a positive integer` |
| 4 | Every parameter has a test value | `All parameters must have test values for validation` |
| 5 | Categorical parameters are complete | `Parameter "{{name}}" needs at least one choice` / `The test value of "{{name}}" must be one of its choices` |
| 6 | Every injected default cluster has a warmup | The `defaultClusterWarmupRequired` message above |
| 7 | The async validation job passes | `Validation failed. See details below.` — plus an inline Monaco marker at the failing line |

Then the naming dialog opens — **the only place a strategy is named**. Title **Confirm Action**; message *"Name your strategy to create it."* on create, *"Review the name and description before saving."* on edit. Fields **Name** and **Description**.

> [!IMPORTANT]
> The name helper reads *"Lowercase identifier — also the Python function name."* Typing a name lowercases it, replaces spaces with `_`, and **renames the Python entry point in your code** — the compiler rejects a function whose `__name__` does not match the registry name. This drops the validation pin, so the save re-validates the exact bytes it is about to write. If the name is taken, the field shows *"Already in use — it will be saved as "{{name}}""*.

Editing an internal strategy that studies already reference, when the code or the normalized parameter set actually changed, first shows the breaking-change dialog:

> Saving creates a new version of "{{name}}". Studies that have already launched stay pinned to the version they ran with, so their results won't change.

#### Save errors

| Status | Meaning | Where it shows |
|---|---|---|
| **409** | `A strategy named "foo" already exists in your organization.` | On the Name field |
| **409** | Optimistic-concurrency conflict — the row moved since the editor loaded it | Inline in the dialog |
| **406** | `This code has not been validated as a strategy. Validate it (POST /validate/internal/…) before saving.` | Inline; the pin is cleared |
| **406** | `This code was validated, but not at the parameter values being saved (...). Causality and warmup are proven at the values the validation ran with, so validate again with these ones before saving.` | Inline |
| **406** | `This code was validated over a custom date window. The causality checks only cover the period they ran on, so a receipt minted that way cannot authorize a save. Validate over the default window (a custom ticker list is fine) and save again.` | Inline |

The 406s come from the **validation receipt gate**. Saving internal code requires a completed validation job from your organization, **less than one hour old**, whose digest matches `code + lookback_function_code + graph` and whose test-parameter point matches what you are saving. A receipt minted over a custom *date window* is refused; a custom *ticker list* is fine.

### Version history

Versions are produced by a database trigger, append-only, newest first, and read via `GET /strategies/:id/versions`. A new strategy gets **v1** on insert — including on duplicate.

| Change | Mints a version? |
|---|---|
| Execution type, execution details (code or endpoint config), parameters, lookback mode, lookback function code, soft delete | Yes |
| Name only, description only | **No** |
| Data-source graph, memory profile, universe binding (asset group or named tickers) | **No** |

**Restore** is available for internal strategies only. It loads the snapshot into the editor as an unsaved change — *"it never writes to the server, so you review it and save normally, which appends yet another version."*

A launched study keeps running against the version it started with, so editing here never rewrites a result you already have. See [study lifecycle](/docs/study-lifecycle).

## Execution modes

There are exactly **two live execution modes**. A third — Rule-based / `declarative` — exists as a disabled scaffold in the UI and is rejected by the server. See also [execution modes](/docs/execution-modes) for the platform-wide comparison.

| | Internal | External |
|---|---|---|
| Where the code runs | Fintela's sandbox container | Your infrastructure |
| Language | Python only | Any — Fintela only speaks HTTP |
| Your private data | Not available; only declared data sources | Fully available; Fintela never sees it |
| Stored as | `execution_details = {code}` | `execution_details = {endpoint, timeout, max_concurrency}` |
| Data sources section | Yes | **No** |
| Validation receipt required to save | **Yes** | No — the only server-side check is the endpoint screen |
| Version history shows code / Restore | Yes | No |
| Curated library list applies | Yes | No |
| `required_lookback` function | Required | Required |

### Internal — the deterministic function signature

An internal strategy is **one top-level Python function**. The compiler finds it **by signature, not by name or position**: the first callable in your module whose parameters are a superset of `{data, start_date, end_date}`.

```python
def your_strategy(
    data,            # required — adjusted-close price DataFrame
    start_date,      # required — str (YYYY-MM-DD)
    end_date,        # required — str (YYYY-MM-DD)

    # Injected data sources — bound by exact parameter name, and passed
    # only for sources you selected in the Data sources section
    meta,            # pd.DataFrame                    sector / industry / type
    fundamentals,    # dict[str, pd.DataFrame]         PE, beta, market cap …
    groupings,       # dict[str, dict[str, set[str]]]  membership by date

    # Your declared optimizable parameters
    lookback,
    top_n,
):
    ...                                # returns the signal dict
```

At runtime the function is invoked **entirely by keyword**:

```python
signal = fn(data=processed_data, start_date=start_date, end_date=end_date,
            **params, **extra_kwargs)
```

| Argument | Type | Meaning |
|---|---|---|
| `data` | `pandas.DataFrame` | Adjusted-close price matrix. Index = trading dates (`DatetimeIndex`), columns = ticker codes. Pre-sliced to include the lookback window before `start_date`. Unlisted tickers are `NaN` on dates before they existed |
| `start_date` | `str` `YYYY-MM-DD` | Simulation start. Use it as the lower bound in your signal loop |
| `end_date` | `str` `YYYY-MM-DD` | Simulation end. Use it as the upper bound |
| *declared parameters* | `int`, `float` or `str` | One concrete value per trial. A categorical parameter arrives as the chosen **string** |
| *declared data sources* | Varies by source | Bound by **exact parameter name** |

> [!CAUTION]
> Consequences of keyword invocation, in order of how often they bite:
> - **Argument order is irrelevant; names are the contract.**
> - **A source you do not name in the signature is simply not passed.**
> - **A `**kwargs`-only strategy binds nothing.** Strategies have no var-keyword branch — every injected source must be an explicit named parameter.
> - **The function name must equal the registry name.** The naming dialog rewrites it for you.
> - `data` has a real `DatetimeIndex`, while `default_clusters[ref]` is indexed by **ISO date strings**. Mixing them raises a `KeyError` whose entire message is a timestamp. The compiler emits a line-numbered cross-dtype warning about this.

### The signal you return

Both modes must produce the same structure, and both are checked by the same validator.

```json
{
  "2024-01-02": {
    "AAPL": { "position": "L", "allocation": 0.5 },
    "MSFT": { "position": "S", "allocation": 0.25 }
  },
  "2024-02-01": {
    "AAPL": { "position": "L", "allocation": 1.0 }
  }
}
```

A CI-validated example from the built-in catalog:

```python
def momentum_top_n(data, start_date, end_date, lookback=60, top_n=10):
    out = {}
    for ts in data.index:
        window = data.loc[:ts].tail(lookback + 1)
        if len(window) < lookback + 1:
            continue
        mom = (window.iloc[-1] / window.iloc[0]) - 1.0
        mom = mom.dropna()
        mom = mom[mom > 0]
        if mom.empty:
            continue
        chosen = mom.sort_values(ascending=False).head(top_n)
        names = list(chosen.index)
        n = len(names)
        w = 1.0 / n
        out[ts.strftime("%Y-%m-%d")] = {c: {"position": "L", "allocation": w} for c in names}
    return out
```

Every enforced rule, with its exact rejection message:

| Rule | Message |
|---|---|
| Top level is a dict | `Output must be a dict, got <type>` |
| At least one date | `Output dict is empty — strategy must return at least one date entry` |
| Date key parses as `%Y-%m-%d` | `Date key '<d>' is not in YYYY-MM-DD format` |
| Date value is a dict | `Value for date '<d>' must be a dict, got <type>` |
| Ticker key is not None | `Ticker key is None on date '<d>' — check that your DataFrame has no columns with null names` |
| Ticker key is a string | `Ticker key must be a string, got <type>` |
| Trade is a dict | `Trade for ticker '<t>' on '<d>' must be a dict, got <type>` |
| `position` present | `Trade for '<t>' on '<d>' missing key 'position'` |
| `position` is `"L"` or `"S"` | `'position' for '<t>' on '<d>' must be 'L' or 'S', got '<v>'` |
| `allocation` present | `Trade for '<t>' on '<d>' missing key 'allocation'` |
| `allocation` is numeric | `'allocation' for '<t>' on '<d>' must be a number, got <type>` |
| `allocation` is finite | `On date '<d>', an allocation resolved to <v> — allocations must be finite numbers. Check for division by zero or unbounded values in your position sizing logic.` |
| `allocation` > 0 | `…allocations must be greater than zero. Ensure your position sizing logic never assigns a zero or negative weight…` |
| `allocation` ≤ 1 | `…allocations must be at most 1 (100%). Check that your weights are normalized before returning the signal.` |
| Allocations per date sum ≤ 1 | `On date '<d>', allocations sum to <x> (> 1.0, excess: <e>). Strategies must emit weights that fit in the unit budget. If you are dividing 1.0 across N tickers, prefer split_number_into_parts or [1.0/n]*n over manual per-ticker allocation.` |

The per-date sum tolerance is `1e-6`. The residual (`1 − Σ`) is held as **cash**. A date you omit from the signal is not a rebalance — the portfolio stays where it is.

### Allowed Python libraries — Internal only

Seven curated packages, pinned to the same versions in all four images that ever run your code: validation, sandbox preview, optimizer training and live updates.

| Package | Import root | Version | Summary | Caveat |
|---|---|---|---|---|
| `numpy` | `numpy` | 2.2.3 | Arrays & vectorised math (also pre-injected as `np`). | |
| `pandas` | `pandas` | 2.2.3 | DataFrames & time series (also pre-injected as `pd`). | |
| `scipy` | `scipy` | 1.16.1 | Scientific computing: stats, optimize, signal, interpolate. | |
| `scikit-learn` | `sklearn` | 1.6.1 | Classical ML: regression, classification, clustering, preprocessing. | Pass `n_jobs=1` — the optimizer already runs trials in parallel. |
| `statsmodels` | `statsmodels` | 0.14.6 | Econometrics & time series: OLS/GLS, ARIMA, cointegration tests. | |
| `ta` | `ta` | 0.11.0 | Technical-analysis indicators (RSI, MACD, Bollinger, …), pure Python. | |
| `cvxpy` | `cvxpy` | 1.9.2 | Convex optimization for portfolio construction (mean-variance, …). | Use a deterministic solver (e.g. `solver=cvxpy.CLARABEL`); the default SCS is stochastic and can make reruns diverge. |

Nine stdlib roots are also importable: `math`, `datetime`, `collections`, `statistics`, `itertools`, `functools`, `operator`, `calendar`, `json`.

Two categories carry dedicated rejection messages:

- **`random`** — non-deterministic across trials. Use `numpy.random.default_rng(seed)` with the seed supplied as a parameter.
- **Network roots** — `urllib`, `urllib3`, `http`, `socket`, `ssl`, `ftplib`, `smtplib`, `requests`, `httpx`, `aiohttp`, `telnetlib`, `xmlrpc`, `webbrowser`. *"Every Optuna trial would re-fetch, so the same trial can score differently on a re-run, and the study's runtime depends on a third party's uptime. Bring the data in as a SELECTED DATA SOURCE instead."*

> [!IMPORTANT]
> For **strategies and fitness functions the import list is advisory, not enforced** — findings are surfaced as warnings and the save goes through. It is enforced as a hard error only for risk managers. And per the source itself: the allow-list *"is a convenience guard: it surfaces an unavailable import at save time instead of as an opaque mid-run ImportError. It is NOT a security boundary."* Treat it as a compatibility list, never as a sandbox.

Need something else? Ask the Fintela team to add it — the editor's "Python libraries you can import" panel says so directly.

### The validation and preview sandbox

Internal code is executed twice over before it is ever accepted:

| Property | Value |
|---|---|
| Default fixture | ~500 S&P 500 holdings, 2017–2023 |
| Validation window | `2019-01-01` → `2022-06-30` (short) and → `2023-12-31` (long) |
| Look-ahead check | The strategy is run **twice**, short window and long; the save is rejected if appending future data changes a past signal |
| Compiler work budget | **90 s**, then a 504 with `Compiler validation exceeded the 90s time budget` |
| Concurrent validations | **4** — load shed, not queued: `Compiler at capacity (4 concurrent validations); …` |
| Max request body | **5 MiB** |
| Output sample cap | 50 dates |
| Pre-injected globals | `pd`, `np`, `math`, `datetime`, plus the `fintela_strategy_lib` helpers |

The **Output sample** panel in the Validation section runs the full validation job on demand (never as-you-type) and shows the columns **Date / Ticker / Side / Allocation**. Its subtitle: *"The daily positions your strategy produces on a sample run."*

The **Run a backtest** sandbox is a separate service: user code runs in a subprocess with a credential-scrubbed environment, a **240 s** per-request work budget, and no database access to the strategy tables at all. Each run costs **1 token**. See [tokens and billing](/docs/tokens-and-billing).

### External — your own endpoint

An external strategy is a URL. Fintela stores the base URL, a timeout and a concurrency budget, and calls one path on it. Your language, your infrastructure, your private data. See [external strategies](/docs/external-strategies) for the hosting walkthrough, and the [Python/FastAPI](/docs/python-fastapi) and [Node/Express](/docs/node-express) integration guides for working servers.

#### The wire contract

`/simulate` is appended to the base URL you saved. Dates are **query parameters**; parameters are the **JSON body**.

```http
POST /simulate?start_date=2024-01-01&end_date=2024-06-30 HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "lookback": 60,
  "top_n": 10,
  "mode": "ema",
  "tickers": ["AAPL", "MSFT", "NVDA"]
}
```

`tickers` is an **additive** body key carrying the resolved universe. It is present only when a universe is configured; otherwise the body is exactly your sampled parameters. If one of your strategy parameters is literally named `tickers`, your parameter wins and the universe is not forwarded, with a warning.

The response must be a JSON object with a top-level `signal` key:

```json
{
  "signal": {
    "2024-01-02": {
      "AAPL": { "position": "L", "allocation": 0.5 },
      "MSFT": { "position": "L", "allocation": 0.5 }
    }
  }
}
```

The value of `signal` goes through the **same output validator** as internal code — every rule in [The signal you return](#the-signal-you-return) applies unchanged.

#### Failure semantics

| Condition | `error_type` | Message |
|---|---|---|
| Non-2xx response | `endpoint_error` | `Endpoint returned HTTP {status}: {body[:500]}` (body truncated to 500 chars) |
| Body is not JSON | `invalid_response` | `Endpoint response is not valid JSON` |
| No top-level `signal` key | `invalid_response` | `Endpoint response must be a JSON object with a 'signal' key` |
| `signal` fails the output rules | `invalid_output` | The matching validator message |
| A past signal changed when the window was extended | `data_leakage` | The leakage report |
| Connection refused, TLS failure, DNS failure, timeout | `endpoint_error` | A diagnosis-specific transport message |

At **training** time a malformed response prunes the trial rather than failing the study: *"Your external strategy endpoint returned a response that is not the expected shape: it must be JSON with a top-level "signal" object mapping date -> ticker -> {"position": "L"\|"S", "allocation": number}."*

**Look-ahead check.** Validation calls `/simulate` **twice** — once over the requested window, once with the end date extended by **730 days** — and rejects the strategy if a signal on a past date changed. Your endpoint must be deterministic for a given `(start_date, end_date, params)` triple, and must not let data after a date influence the signal on that date.

**Universe membership.** Any ticker your endpoint returns that is not in the forwarded universe raises a warning naming up to 20 codes: *"Those trials will fail with a missing-tickers error unless you add them to the cluster or stop emitting them — an external strategy's signal universe must be a subset of the cluster."*

#### Authentication

> [!WARNING]
> Fintela sends **no** `Authorization` header, API key or service token to your endpoint. The request carries only `Content-Type: application/json`, the two date query parameters and your JSON body. If your endpoint needs a secret, the only place to put it is inside the base URL path you save — a query string on the stored endpoint is not preserved, because `/simulate` is appended to the path. Redirects are never followed, on any call path.

#### Timeouts, retries and concurrency

The stored `timeout` is in **seconds**. Three call sites use it differently — do not conflate them:

| Call site | Timeout | Attempts | Retried on | Backoff |
|---|---|---|---|---|
| Compiler validation | **30 s fixed** — ignores your stored `timeout` | 1 + 2 retries | Connect error, connect timeout, read timeout, pool timeout, remote protocol error | Linear: 1 s, 2 s |
| Sandbox backtest | Your stored `timeout` (falls back to 60 s only if none is stored) | 1 + 3 retries | The same transport errors **except read timeout**, plus HTTP 429 / 502 / 503 / 504 | Full-jitter exponential, base 1 s, ceiling 8 s |
| Optimizer training | Your stored `timeout` | 1 + 3 retries | Same as the sandbox | Full-jitter exponential, base 1 s, ceiling 8 s |

A read timeout is deliberately **not** retried in the sandbox or the optimizer: the request was accepted, so retrying would double the load on an already-slow backtest. Every client pool holds at most **2 connections** with a 30-second keep-alive — pair that with `timeout_keep_alive >= 30` on your server.

> [!CAUTION]
> **`max_concurrency` is not a connection limit.** Each HTTP client pool is fixed at 2 connections regardless of what you set. `max_concurrency` is the **worker budget the dispatcher grants your study**:
> - For an external study the optimizer runs one task with a pool of `max_concurrency` workers.
> - If your strategy **and** your fitness function are both external, the budget is `min(strategy, fitness)`.
> - If both point at the **same normalized endpoint**, that budget is **halved** (floor, minimum 1) — they share your server's capacity.
> - The optimizer caps the effective batch at **32** regardless.
> - It also sizes the study's compute: budget ≤ 8 → 4 GiB, ≤ 32 → 8 GiB, above that → 16 GiB.

#### Endpoint restrictions

The endpoint is screened at save time (no network call — your server may not be up yet) and again, by DNS resolution, before every request.

| Rule | Message |
|---|---|
| No whitespace or control characters | `EXTERNAL endpoint must not contain whitespace or control characters` |
| Must parse as a URL | `EXTERNAL endpoint is not a valid URL ({e}): '{endpoint}'` |
| Scheme is `http` or `https` | `EXTERNAL endpoint must use http:// or https:// (got 'ftp').` |
| Host is present | `EXTERNAL endpoint must include a host` |
| Not `localhost` or `*.localhost` | `EXTERNAL endpoint host must not be loopback/localhost` |
| A literal IP must be publicly routable | `EXTERNAL endpoint host {ip} must be a publicly routable address, not a private, loopback, link-local or reserved one` |
| Every resolved address must be public | Prefixed `Your endpoint address is not allowed: ` — e.g. *"the host '10.0.0.5' is a private, loopback or otherwise internal address. Fintela only calls publicly routable addresses."* |

> [!NOTE]
> **HTTPS is not required.** A plain `http://` endpoint saves and runs; the editor shows an advisory warning only. TLS was never the control here — what is enforced is that the host resolves to a publicly routable address. There is **no port allowlist**.

### Where External does not apply

State this plainly, because the editor hides rather than disables these:

| Capability | External strategies |
|---|---|
| **Data sources section** | **Not available.** Your endpoint receives only parameters, dates and the optional `tickers` list — injected kwargs could never reach it. Price is still attached server-side, because the simulation prices the universe either way |
| **Ticker sample size slider** | **Not available.** There is no synthetic fixture to sample from |
| **Python editor, Format, Reference dialog, code intelligence, import lint** | **Not available.** Fintela never sees your code |
| **Curated library list** | **Does not apply.** Your runtime is yours |
| **Live as-you-type validation** | **Not available.** Validation is on demand, and each run makes two real calls to your server |
| **Validation receipt gate** | **Does not apply.** External strategies save with no receipt requirement |
| **Version history code view and Restore** | **Not available.** Versions record the endpoint configuration, not code |
| **Rule-based / declarative mode** | **Does not exist for strategies at all**, internal or external. Declarative rule trees are a [risk manager](/docs/risk-managers) feature |

What External *does* get, identically to Internal: the `required_lookback` function (sandboxed standalone, it never touches your endpoint), the optional validation universe, parameters and their study search space, the sandbox backtest, the registry table, duplication, and version history of its configuration.
