---
title: Risk Managers
section: Registries
sectionOrder: 3
order: 6
published: true
updated: 2026-08-20
summary: The governance layer that acts during a simulation — stops, caps, and halts, and when each one fires.
keywords: risk manager, stop loss, trailing stop, drawdown, exposure cap, position cap, halt, rules, precedence, execution log
---

A risk manager is the governance layer of a backtest. On every simulated bar it inspects the portfolio as it stood after the previous bar and, before the strategy is allowed to rebalance, it can close positions, trim them, or suppress the rebalance entirely. It never replaces the strategy's book — it only overrides it. Ten built-in rules cover stops, caps, cash floors, circuit breakers and trading calendars; on top of those you can register your own in the Risk Managers registry, either as a composed rule tree, as Python, or as an HTTP endpoint you host.

## Overview and purpose

### What a risk manager does

A risk manager is a per-bar hook the engine calls with three things: the current date, a snapshot of the portfolio, and a read-only market-data view. It returns a list of operations. It has three levers, and only three:

| Lever | Mechanism | Effect |
|---|---|---|
| Emit operations | `close_position`, `close_all_sides`, `sell`, `buy` | Changes the book before the strategy rebalances |
| Suppress the rebalance | `is_strategy_suppressed_today(today)` | The strategy's `SetTargets` is skipped for that bar only; other risk managers still fire |
| Go terminal | `is_terminal()` | The engine stops calling every risk manager **and** the strategy for the rest of the run |

A risk manager can never issue `set_targets`. Both the Python and HTTP boundaries reject that op outright, so no risk manager can rewrite the target book — it can only close, trim, add, or block.

### The four kinds

| Kind | Registry label | What it is | Where it runs |
|---|---|---|---|
| `builtin` | `Built-in` | One of the ten catalog rules | Natively in the Rust engine |
| `declarative` | `Rule-based` | A rule tree you compose from primitives, no code | Compiled to built-ins when the study is built |
| `internal` | `Custom code` | Your Python, run in-process | Rust engine calling Python per tick |
| `external` | `External HTTP` | Your endpoint, one `POST` per tick | Rust engine calling your server |

> [!IMPORTANT]
> **Built-ins never appear in the registry table.** `/risk-managers` filters to `kind !== 'builtin'`. You pick a built-in when you **attach** a risk manager to a study, not when you register one. The registry page is where you author the three custom kinds.

The segmented control in the editor calls the Python kind **`Internal`**; the Kind column chip and the reference dialog tab call the same thing **`Custom code`**; the Execution Type column shows the raw value `internal`. Three labels, one kind.

### The per-bar sequence

```text
Day 0
  initial book inserted
  → one risk-manager pass (stops record entry prices, caps trim opening breaches)

Every later bar
  1. mark to market, drop tickers with no return
  2. age any re-entry blocks by one bar
  3. if ANY risk manager went terminal on an earlier bar → skip 4-7 entirely
  4. run every attached risk manager's on_tick, in list order, collecting ops
  5. apply the collected ops, sorted by priority then execution_order
  6. record which names were closed, for re-entry blocking
  7. terminal check; then, unless some risk manager suppresses today,
     apply the strategy's SetTargets (blocked names dropped from the targets)
```

Step 5 is where precedence is decided. Step 7 is why a risk manager's close sticks: a name held out by a re-entry block is dropped from the strategy's target book and its weight stays in cash, leaving a zero-quantity `Skipped` order naming the manager responsible.

### Operation precedence

Operations collected in one bar are sorted by a priority bucket, lowest first:

| Operation | Source | Priority |
|---|---|---|
| `ClosePosition`, `CloseAllSides` | risk manager | 10 |
| `Sell` | risk manager | 20 |
| `Buy` | risk manager | 50 |
| other granular operations | — | 90 |
| `SetTargets` | strategy or manual | 100 |
| `NoOp` | — | 200 |

Ties inside a bucket break on the emitting risk manager's `execution_order` (lower first), then on the source tag alphabetically. Risk-manager operations and the strategy's `SetTargets` are applied in two separate batches, so the two are never sorted against each other — closes always land before the rebalance because the rebalance runs later in the bar, not because 10 sorts before 100.

The attachment editor states the same thing as a legend: `Halts / closes` → `Sells` → `Buys` → `Strategy rebalance`.

### The rule catalogue

Ten built-in rules. The compiler publishes them alphabetically by name; `params_schema` is closed (`additionalProperties: false`) and the engine configs reject unknown fields, so a misspelled parameter is an error, never a silent default.

| Rule | Label | Scope | Trigger | Action | Priority | Can hold a name out |
|---|---|---|---|---|---|---|
| `stop_loss` | Stop Loss | per position, both sides | loss from entry ≥ threshold | close that position | 10 | yes |
| `trailing_stop` | Trailing Stop | per position, both sides | reversal from the favourable extreme ≥ trail | close that position | 10 | yes |
| `take_profit` | Take Profit | per position, both sides | gain from entry ≥ target | close that position | 10 | yes |
| `max_drawdown` | Max Drawdown Circuit Breaker | portfolio | drawdown from peak ≥ limit | close everything, halt the strategy | 10 | no |
| `sector_cap` | Sector Cap | long allocations by sector | any sector over cap | proportional sells in that sector | 20 | no |
| `country_cap` | Country Cap | long allocations by country | any country over cap | proportional sells in that country | 20 | no |
| `position_cap` | Position Cap | each long holding | holding over cap | trim that holding | 20 | no |
| `cash_floor` | Cash Floor | portfolio | invested > 1 − min_pct | proportional sells across all holdings | 20 | no |
| `gross_exposure_cap` | Gross Exposure Cap | portfolio | Σ absolute allocation over cap | proportional sells across all holdings | 20 | no |
| `time_window_halt` | Time-Window Halt | calendar | today matches the calendar | none — suppresses the rebalance only | — | no |

> [!NOTE]
> Every threshold is stored **positive**; the engine applies the sign. A 5 % stop is `threshold: 0.05`, never `-0.05`.

#### Stop Loss

Closes a position when its unrealised return falls below `-threshold`. Entry price is recorded on first observation and reset when the position is closed and later re-opened.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `threshold` | number, required | `> 0` and `≤ 1`, a fraction of entry (`0.05` = 5 %) | none | float `0.01 – 0.30` |

**Evaluates** every tick, per held position, long and short. State is pruned to the currently-held `ticker:side` keys each tick, so a name that leaves and re-enters gets a fresh entry price. Ticks where the ticker has no price are skipped. Return is `price/entry − 1` for a long, `1 − price/entry` for a short.

**Acts** by emitting `ClosePosition` for that ticker and side when the return is at or below `-threshold`.

#### Trailing Stop

Tracks the most favourable price observed since entry — peak for longs, trough for shorts — and closes when the market reverses past `trail_pct` against that high-water mark.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `trail_pct` | number, required | `> 0` and `≤ 1` (`0.10` = 10 %) | none | float `0.02 – 0.40` |

**Evaluates** every tick, per held position, maintaining one extreme per `ticker:side`, pruned to held keys. Drawdown is `1 − price/extreme` for a long, `price/extreme − 1` for a short.

**Acts** by emitting `ClosePosition` when the drawdown reaches `trail_pct`.

#### Take Profit

Closes a position once its unrealised return reaches `target`. Same entry-price bookkeeping as Stop Loss.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `target` | number, required | `> 0`, **no upper bound** | none | float `0.05 – 1.00` |

`target` is a fraction of entry: `0.15` is +15 %. Because there is no ceiling, `2.5` (+250 %) is a legal value — the optimizable range only bounds the search, not the parameter.

**Evaluates** every tick per position. **Acts** by emitting `ClosePosition` when the return reaches `target`.

#### Max Drawdown Circuit Breaker

When `(peak − value) / peak` exceeds `limit`, every held position is closed and the strategy stops rebalancing. Recovery is governed by `recovery_mode`.

| Parameter | Type | Domain | Default | Optimizable range | Optimized by default |
|---|---|---|---|---|---|
| `limit` | number, required | `> 0` and `≤ 1` | none | float `0.05 – 0.50` | yes |
| `recovery_mode` | string enum | `threshold`, `cooldown`, `none` | `"threshold"` | not optimizable | — |
| `recovery_threshold` | number | `> 0` and `≤ 1` | `0.05` | float `0.01 – 0.30` | **no** |
| `recovery_days` | integer | `1 – 2520` | `21` | integer `5 – 63` | **no** |

The enum renders in the UI as `threshold — resume on a recovery off the lows`, `cooldown — resume after a fixed wait`, `none — halt permanently`.

**Evaluates** every tick at portfolio level. It seeds its peak once from the engine's own `portfolio_peak`, then tracks its own high-water mark.

**Acts on trip** by emitting `CloseAllSides` for every held ticker, snapshotting a "shadow book", and writing a `halted` event carrying `limit`, `drawdown`, `peak`, `value`, `recovery_mode`, `recovery_threshold`, `recovery_days`, `permanent` and `shadow_measurable`. While halted it suppresses the strategy every bar and re-flattens the book as a guard.

**Recovery** depends on the mode. `threshold` resumes once the liquidated book, marked to market, has bounced `recovery_threshold` off its lowest point since the halt; when that bounce cannot be measured it falls back to the `recovery_days` bar count. `cooldown` resumes after `recovery_days` bars regardless of the market. `none` never resumes and makes the manager terminal, which stops the engine's risk-manager and strategy loop for the rest of the run. On resume the peak is rebased to the current value and a `reactivated` event records `rule`, `bars_halted`, `bounce_off_trough`, `recovery_threshold`, `recovery_days`, `previous_peak` and `rebased_peak`.

> [!CAUTION]
> The study-results notice tells you to "set `recovery_days` to 0 if you want the halt to be permanent instead". **That value is invalid.** `recovery_days` has a minimum of 1 in both the compiler and the engine bounds table, and a 0-bar cooldown would only ever mean "resume next bar". A permanent halt is `recovery_mode: "none"`.

#### Sector Cap

Caps the gross long allocation in any single sector. Sums long allocations grouped by `sectors[ticker]`; for any sector over `max_pct`, emits proportional sells to trim it back.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `max_pct` | number, required | `> 0` and `≤ 1` | none | float `0.10 – 0.80` |
| `default_sector` | string | any | `"_unknown"` | not optimizable |
| `sectors` | object, ticker → sector | injected at runtime | — | not optimizable |

`sectors` is in `required_runtime_metadata`, not in `params_schema`. You never set it: the optimizer injects it from the universe's grouping metadata, and pinning it in `static_params` is rejected.

**Evaluates** every tick over long allocations only; shorts are untouched. **Acts** with one `Sell` per member of an over-cap sector at `fraction = excess / sector total`. An empty `sectors` map puts every ticker in one `default_sector` bucket, so the cap applies globally rather than becoming a silent no-op.

#### Country Cap

Mirrors Sector Cap, grouping by `ticker → country`.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `max_pct` | number, required | `> 0` and `≤ 1` | none | float `0.20 – 0.90` |
| `default_country` | string | any | `"_unknown"` | not optimizable |
| `countries` | object, ticker → country | injected at runtime | — | not optimizable |

`countries` is in `required_runtime_metadata` and behaves exactly as `sectors` does above. Same tick semantics, same `Sell` action.

#### Position Cap

Caps any single long position at `max_pct` of total equity. Shorts are untouched.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `max_pct` | number, required | `> 0` and `≤ 1` (`0.10` = 10 %) | none | float `0.02 – 0.50` |

**Evaluates** every tick per long holding. **Acts** with `Sell` at `fraction = (allocation − max_pct) / allocation`.

#### Cash Floor

Ensures the portfolio holds at least `min_pct` in cash. When invested exposure exceeds `1 − min_pct`, every holding is trimmed proportionally to release the shortfall.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `min_pct` | number, required | `≥ 0` and `< 1` | none | float `0.00 – 0.30` |

Note the domain: inclusive at 0, exclusive at 1 — the opposite shape from the caps, which are `> 0` and `≤ 1`.

**Evaluates** every tick on the sum of allocations across **all** holdings, long and short. **Acts** with one `Sell` per holding at `fraction = excess / invested`, on both sides.

#### Gross Exposure Cap

Caps `|long| + |short|` gross exposure. Built for long/short books that want to bound leverage rather than the uninvested-cash bucket.

| Parameter | Type | Domain | Default | Optimizable range |
|---|---|---|---|---|
| `max_pct` | number, required | `> 0` and `≤ 5.0` | none | float `0.50 – 2.00` |

> [!WARNING]
> `max_pct` here is a **leverage multiple**, not a percentage of equity. `1.0` is fully invested and `2.0` is 2×. Every other cap parameter in the catalogue is a fraction of equity.

**Evaluates** every tick on the sum of absolute allocations. **Acts** with a proportional `Sell` on every holding when over cap.

#### Time-Window Halt

Suppresses strategy rebalancing on configured weekdays, dates, or date ranges. Other risk managers still fire — only the strategy's `SetTargets` is skipped. Use it to bake a trading calendar into a strategy that does not honour one natively.

| Parameter | Type | Domain |
|---|---|---|
| `weekdays` | array of string | `Mon`/`Tue`/`Wed`/`Thu`/`Fri`/`Sat`/`Sun`, case-insensitive, abbreviations or full names |
| `dates` | array of string | individual `YYYY-MM-DD` days |
| `date_ranges` | array of `{start, end}` | inclusive at both ends; `start <= end` enforced |

No parameter is individually required, but at least one of the three must be non-empty. Validation messages:

- `time_window_halt needs at least one of: weekdays, dates, date_ranges.`
- `Unknown weekday '{w}'. Use Mon/Tue/Wed/Thu/Fri/Sat/Sun (case-insensitive, abbreviations or full names accepted).`
- `Parameter 'dates[]' must be a valid YYYY-MM-DD date, got '{value}': {error}`
- `date_ranges[] requires start <= end, got start={start} end={end}.`

**Evaluates** every tick and **returns no operations, ever.** Its only effect is the suppression flag the engine consults before emitting the strategy's targets. It exposes **no optimizable parameters** by design, so its attachment card shows `No optimizable params — the engine will use the risk manager's static params.` and all three arrays are edited in the **Fixed parameters** block as JSON lists.

### Rule composition and precedence

There are two ways to compose. They stack.

**Several attachments on one study.** Each attachment is one risk manager with its own `execution_order`. Array position in the attachment editor *is* the execution order — reordering renumbers every attachment to its index. Two attachments that resolve to the same built-in at the same order are rejected: `Two risk-manager attachments of the same built-in type '{builtin_name}' share execution_order {n} — precedence between them would be ambiguous. Give them distinct execution_order values.` Two stops at *different* orders — a tight one and a loose one — is a legitimate layered setup.

**Several rules inside one rule-based risk manager.** The declarative builder offers two composition modes:

| Mode | Short label | Wire version | Behaviour |
|---|---|---|---|
| `Sequential (all run)` | `v1 sequential` | `"1"` | Every rule runs every tick; the resulting operations are combined by the engine's coalescing rules. Default. |
| `First-match (any_of)` | `v2 short-circuit` | `"2"` | Only the first rule whose primitive emits operations applies that tick; the rest are skipped. |

`First-match` wraps the whole list in one `any_of` group. Children run in order, the first to produce a non-empty operation list wins, and `is_terminal` / suppression are OR-ed across children. Child state is persisted under a key combining the child's ordinal position with its name, so reordering the group cannot mis-restore state. Use it for alternative fallbacks — a tight `stop_loss` with a wider `trailing_stop` backup.

When a study is built, a rule-based attachment is expanded into one built-in per leaf, and the leaves are renumbered as `attachment.execution_order × 1000 + rule.execution_order + 1`. Leaves therefore interleave *inside* their parent's slot and can never escape into a sibling attachment's.

### Attaching a risk manager to a study

Attachment is where composition, ordering and optimization actually live. A registry row is one model; a stack of ordered attachments is a policy.

| Surface | How you get there |
|---|---|
| Study builder → Risk Managers section | Building or editing a study |
| `Attach` row action on this registry | Opens the attach dialog, which mounts the same editor |
| Portfolios → Derive/optimize risk managers | Derives one risk-manager-optimization study per portfolio |

The picker offers two groups: `Built-in` (from the compiler catalog, every rule, unfiltered) and `Registered (rule-based / custom code / external)` (your org's non-built-in registry rows). Each attachment card carries:

- an ordinal, `Move up` / `Move down` (only when more than one is attached), and `Remove`;
- a kind chip — `built-in · {{name}}`, `rule-based`, `custom code`, `external endpoint`, or `registered`;
- a **Parameters** block, one row per optimizable parameter, each with a `Fixed` / `Optimized` toggle and a `value` box or `min` / `max` boxes;
- an **After an exit** block, for the three per-symbol stops and for any registered risk manager;
- a **Fixed parameters** block for every `params_schema` key that is not an optimizable parameter, rendered as a number, enum select, free string, JSON array or checkbox. Runtime-metadata keys are not `params_schema` keys, so they never appear here at all.

Seeding on add: each of a built-in's `optimizable_params` becomes an `Optimized` range at the catalog's `[min, max]`, unless the catalog marks `optimize_by_default: false` (Max Drawdown's `recovery_threshold` and `recovery_days`), in which case it is seeded `Fixed` at the schema default. Static parameters are seeded from every schema default. A registered risk manager carries no bounds in the catalog, so each declared parameter is seeded `Optimized` at `min: 0, max: 0` for you to fill in.

**After an exit** controls re-entry blocking:

| Control | Range | Meaning |
|---|---|---|
| `Hold the name out after this closes it` | switch | Off, the strategy can buy the name back on the same bar and the exit is undone |
| `Trading days out` | `0 – 5000`, step 1 | Counting the day it exited. **`0` keeps it out for the rest of the run** |

Only `stop_loss`, `take_profit` and `trailing_stop` close one name at a time, so only those three (and registered risk managers, whose code cannot be read) offer the control. When the client says nothing, the server defaults blocking **on** for those three and **off** for everything else. Explicitly asking a non-per-symbol built-in to block is refused: `'{builtin_name}' cannot hold a symbol out after it exits. A re-entry block only applies to a manager whose exit is a judgement about ONE name (stop_loss, take_profit, trailing_stop); the caps only trim, and max_drawdown flattens the whole book for a portfolio-level reason — blocking every symbol it touched would defeat its own recovery mode. Leave reenter_after_stop unset for this attachment.`

> [!WARNING]
> **Attachments are replace-all.** Saving the attachment set writes the whole list; anything you left out is detached. The editor always loads the study's current full set before you edit it, which is why the attach dialog shows attachments you did not add.

> [!CAUTION]
> Risk managers can only be changed while a study is in `SAVED` status. After launch: `This study has already been launched, so its risk managers can't be changed. Duplicate it to attach different ones. (study {id})` The attach dialog shows the same rule as a warning — `This study has already been launched — risk-manager attachments can only be edited while a study is in SAVED status.` — and disables its `Attach` button.

Two more gates apply at attach or launch time:

- **Universe coverage.** Attaching `sector_cap` or `country_cap` to a universe where no ticker carries that grouping blocks the launch: `Risk manager '{rm}' requires {sectors|countries} data, but none of the {N} ticker(s) in the selected universe have {…} coverage. Pick a universe with {…} metadata or remove this risk manager.`
- **Attachment count.** At most `max_rm_attachments_per_study` attachments per study, default 20: `A study can have at most {limit} risk-manager attachments; this request has {count}.`

**Preview stack** runs one representative backtest of the strategy with the whole ordered stack applied — midpoint parameter values, nothing saved. It appears in the study builder and the derive wizard, but **not** in the attach dialog, which has no strategy or universe context to run against. The sandbox does not resolve runtime metadata and does not expand rule trees, so `sector_cap`, `country_cap` and every rule-based attachment are dropped from the preview and named in a notice: `Not previewable in the sandbox and excluded from this run: {{names}}. They still apply in the real study.` Preview runs spend tokens.

> [!IMPORTANT]
> An attachment stores a **snapshot** of the risk manager. Editing or deleting the registry row never changes a study that already has it attached. If you fixed a risk manager and the results did not change, you need a new study, not a new save.

### Optimizing risk-manager parameters

Any parameter set to `Optimized` on an attachment is sampled by Optuna alongside the strategy's own parameters, namespaced with an `rm_` prefix, the attachment id and the parameter name — `rm_12_threshold` for `threshold` on attachment 12. Rule-based leaves get synthetic attachment ids so two leaves never collide.

- Only `float`/`double` and `int`/`integer` dtypes can be optimized. Anything else raises `Unsupported risk-manager param dtype for {name}.{param}: {dtype}`.
- The study's `grid_decimals` becomes the float step.
- `Fixed` entries never reach Optuna. They are merged into the trial spec verbatim and never appear in trial parameters.
- Merge precedence when a trial spec is built: runtime metadata beats sampled values, which beat fixed values, which beat static params.
- `recovery_mode` and every array parameter are closed choices, so they are always static.

### The execution log

Every risk-manager event the engine emits during a trial is recorded per portfolio and surfaced on **Portfolio → Risk Analytics**, under `Risk-manager execution log` with the subtitle `Exceptions, timeouts, invalid outputs, and terminal transitions emitted by the risk managers attached to this portfolio during its trial. Empty is the happy path.`

Each row shows an event-type chip, the risk-manager name, an outlined kind chip, the trial (`Trial {{number}}`) and tick (`tick {{date}}`) where applicable, a timestamp, and the raw payload JSON.

| Event type | Chip tone | What it means | Payload |
|---|---|---|---|
| `exception` | error | Your code raised, or the endpoint call failed | `{message}`, plus `endpoint` for external |
| `timeout` | warning | The tick budget was exceeded | `{message, timeout_ms, base_timeout_ms, holdings}` |
| `invalid_output` | warning | The returned operations failed the contract | `{message}`, plus `offending_op` for external |
| `terminal` | error | The manager was switched off for the rest of the trial | `{reason, consecutive_failures, total_failures}` |
| `halted` | info | A circuit breaker tripped — protection working, not a fault | `{limit, drawdown, peak, value, recovery_mode, recovery_threshold, recovery_days, permanent, shadow_measurable}` |
| `reactivated` | success | Trading resumed after a halt | `{rule, bars_halted, bounce_off_trough, recovery_threshold, recovery_days, previous_peak, rebased_peak}` |

The log is bounded twice over: the engine caps each risk manager at **50 events per run**, and the read endpoint returns at most **200 rows**, newest first. Empty state reads `No risk-manager events recorded for this portfolio.`

### Study-level health notice

A study's Overview tab renders nothing when every risk manager behaved. Otherwise it raises up to two alerts, aggregated across trials:

| Alert | Severity | Title | Chips |
|---|---|---|---|
| Some risk manager was switched off | warning | `A risk manager was switched off during this study` | `switched off in {{count}} trials`, `errors in {{count}} trials` |
| Errors but no shutdown | info | `A risk manager hit errors during this study` | `errors in {{count}} trials` |
| A breaker tripped | info | `A circuit breaker stopped trading during this study` | `tripped in {{count}} trials`, `resumed {{count}} times` |

The first one matters most: `It failed too many times in a row, so the engine stopped running it partway through. The portfolios below were simulated WITHOUT it from that point on. Fix the risk manager and relaunch to get protected results.` A study that reports this produced unprotected results after the shutdown point.

### Quotas and limits

Two independent limits apply.

**Free-tier creation cap.** `max_risk_managers` defaults to **2** on the free tier and is checked on create, duplicate and fork only — never on read, update or delete. An org already above the cap keeps everything it has and simply cannot add more; deleting brings it back under and creation resumes. Refusal is a 402-class response. See [tokens and billing](/docs/tokens-and-billing).

**Per-organization engineering quotas.** One row per org in the risk-manager quota table, enforced on create, update and duplicate:

| Quota | Default | What it bounds |
|---|---|---|
| `max_risk_managers` | 50 | Total live risk managers in the org |
| `max_internal_rms` | 20 | Custom-code rows |
| `max_declarative_rms` | 50 | Rule-based rows |
| `max_external_rms` | 10 | External HTTP rows |
| `max_code_size_bytes` | 65536 | Python source size (64 KB) |
| `max_per_tick_timeout_ms` | 100 | Compared against an external risk manager's `timeout × 1000` |
| `max_rules_per_dsl` | 32 | Leaf rules in a rule tree, counted through `any_of`/`all_of` groups |
| `max_rm_attachments_per_study` | 20 | Attachments on one study |

Breaching one returns `Quota exceeded: {scope} (current={current}, limit={limit}). Contact support to raise the cap or soft-delete unused risk managers.` There is **no admin UI and no write endpoint** for these values — they are adjusted directly by operators. The registry's quota meter reads them but cannot change them.

## Registry table view

`/risk-managers` lists every custom risk manager in your organization. Built-ins are filtered out, so every row is one you authored. The page lives under **More Options** in the sidebar, not directly under Registry — see [navigation](/docs/navigation).

Three URLs mount the same page: `/risk-managers` (the list), `/risk-managers/view/:id` (read-only editor) and `/risk-managers/edit/:id` (editor). Creating has no URL of its own; it is in-page state.

### Columns

Five columns are visible by default; the rest are available through the column chooser.

| Column | Header | Renders | Sortable | Visible by default |
|---|---|---|---|---|
| `name` | `Name` | Bold text | yes | yes |
| `description` | `Description` | Generated sentence, `—` when empty; the author's stored note moves to the hover tooltip labelled `Author's note` | yes | yes |
| `execution_type` | `Execution Type` | Outlined chip: `internal`, `external`, or `—` | yes | yes |
| `author` | `Author` | The creating user's username | yes | yes |
| `created_at` | `Created At` | Shared created-at renderer | yes | yes |
| `kind` | `Kind` | Chip: `Built-in`, `Custom code`, `Rule-based`, `External HTTP` | yes | no |
| `params` | `Params` | Monospaced `k=v` for the first three params then `…`, `—` when empty | **no** | no |

`Execution Type` is `null` — and therefore `—` — for rule-based rows: a rule tree compiles to built-ins and never reaches the user-code execution path. Read the `Kind` column when you need to tell rule-based from built-in.

The generated description follows a fixed shape: `Risk model of type {{type}} enforcing {{clauses}}. Advanced: {{items}}.` Clauses name up to four risk models in plain words — `stop-loss`, `trailing stop`, `take-profit`, `max-drawdown circuit breaker`, `exposure cap`, `sector cap`, `country cap`, `position cap`, `cash floor`, `gross exposure cap`, `time-window halt` — then `+{{count}} more`. Magnitudes render as percentages except `gross_exposure_cap.max_pct`, which renders as `{{value}}×`. Optimizable leaves render as `Range {{bounds}}` with both endpoints, never a midpoint.

> [!NOTE]
> Custom-code and external rows produce **no "enforcing" clause at all**. Nothing in their payload says which risk model the code implements, so their generated sentence carries only the type and the advanced bucket. Write a real description for those.

### Search, filters and view modes

| Control | String | Behaviour |
|---|---|---|
| Search | `Search risk managers…` | Indexes name, the generated description, the stored description, and the author |
| Filter | `Filter`, panel `Filters`, `Clear all`, `Any`, `Contains…` | Text on `Name` and `Description`; multi-select on `Execution Type`, `Kind` and `Author`; date range on `Created At` |
| View mode | `List view` / `Card view` | The card layout shows name as title, description as subtitle, and `Execution Type`, `Kind`, `Author`, `Created At` as facts |
| Refresh | `Refresh` | Refetches the list and metadata |
| Documentation | `View documentation` | Opens the contextual docs panel |
| Create | `New Risk Manager` | Opens the create screen |

Empty state: title `No custom risk managers yet`, body `No custom risk managers yet. Custom (internal / external) risk managers will appear here.` The body copy is narrower than the filter — rule-based rows appear in this table too. Load failure shows `Failed to load risk managers. ` followed by the raw error.

The footer carries a quota meter with the tooltip `Your organization's risk-manager headroom.` and four buckets — `Total`, `Internal`, `Declarative`, `External` — each shown as `used/cap` over a hairline bar. A bucket turns amber above 80 % of its cap and red at or over it. The meter renders nothing at all until the quota response resolves.

### Row actions

Left-click a row for a popover anchored below it; right-click for a context menu at the pointer. No cell is a link. Six actions, in this order:

| Action | Label | What it does | Disabled when |
|---|---|---|---|
| View | `View` | Opens `/risk-managers/view/:id`, read-only | never |
| Edit | `Edit` | Opens `/risk-managers/edit/:id` | The row is used in a study, **or** its kind is not custom code or external |
| Duplicate | `Duplicate` | Server-side copy into your org, name auto-allocated | never |
| Attach | `Attach` | Opens the attach-to-study dialog | never |
| Version history | `Version history` | Opens the View screen, whose History section holds the versions | never |
| Delete | `Delete` | Confirms, then soft-deletes | The row is used in a study |

Disabled tooltips are `This item is currently used in a study and cannot be edited.` and `Only internal and external risk managers can be edited here.`

> [!WARNING]
> **A rule-based risk manager cannot be edited.** Edit is enabled only for custom-code and external kinds, and the editor does not rehydrate a stored rule tree — reaching the edit URL directly would show an empty rule list. In practice a rule-based risk manager is create-once: duplicate it and build a new one, or edit its `execution_details` through the API.

Delete opens a confirmation reading `Are you sure you want to delete the selected risk manager(s)?` The delete is a soft delete; the row disappears from the registry and stops counting against quota, and studies that already snapshotted it are untouched. The one bulk action is `Delete`, which opens the same confirmation for the whole selection. The selection bar shows `{{count}} selected` and `Clear selection`.

Toasts: `Risk manager created`, `Risk manager saved`, `Risk manager duplicated`, `Risk manager deleted`, `Risk managers attached to the study`.

Above the table, an insights band summarizes the visible rows by name, kind and study usage. There is no cross-organization catalog and no sharing control on this page — `Duplicate` copies within your own organization only.

## Creation wizard and advanced options

> [!NOTE]
> **There is no wizard.** `New Risk Manager` opens a single-screen editor with a kind picker pinned to the top, a working surface below it that changes with the kind, and one confirmation dialog at the end. The risk manager is named at commit, not at the start.

Header, by mode:

| Mode | Title | Subtitle |
|---|---|---|
| Create | `Create Risk Manager` | `Define a new declarative, internal, or external risk manager.` |
| Edit | `Edit Risk Manager` | `Update definition and implementation details for this risk manager.` |
| View | `View Risk Manager` | `Read-only view. Click Back to return to the list.` |

`Back` appears only in view mode. In view mode the whole form is wrapped in a disabled fieldset and the code editor is explicitly read-only.

### The kind picker

| Field | Type | Default | Behaviour |
|---|---|---|---|
| `Kind` | Segmented control: `Internal`, `External`, `Rule-based` | `Internal` | Locked outside create mode |

Helper text in create mode: `Choose how this risk manager is implemented. This cannot be changed after it is created.` Outside create mode: `The kind is fixed once the risk manager exists — changing it means creating a new one.`

Create mode also shows an information alert: `Built-in risk managers (stop-loss, trailing stop, take-profit, max-drawdown, sector cap) are invoked inline from the study wizard and do not need to be registered here. Use this view to register a rule-based (declarative) or custom-code RM.` That list names five of the ten built-ins; the full catalogue is above.

A `Reference` button opens the reference dialog, `Risk manager reference`, deep-linked to the tab matching the current kind: `Custom code`, `External HTTP`, `Rule-based`.

> [!CAUTION]
> The reference dialog's **Rule-based** tab shows an `IF … THEN …` example with conditions such as `drawdown_from_peak`, `days_in_position` and a `sell fraction` action. **No such DSL exists.** The real rule format is a list of primitives with parameters, described below. Ignore that example.

### Custom code (internal) fields

| Field | Type | Default | Validation |
|---|---|---|---|
| `Python code` | Monaco editor, language `python`, 320 px | A generated template — see below | Runs in the compiler sandbox on save; live-validates per keystroke once every parameter has a test value |
| `Warmup declaration (optional)` | Monaco editor, 110 px | empty | Validated with the code; sent as an explicit `null` when cleared |
| Parameters | One row per detected parameter — name, type, test value | Detected from the signature as `integer`, no test value | `Every parameter needs a test value before validation.` |

The template is a `def` line naming the risk manager, followed by the fixed three arguments, your declared parameters, `**params`, and a `return ops`. The helper under the editor states the contract verbatim:

```text
Function signature: (today, portfolio_state, market_data, <your params>, **params) → list[dict].
The function name is kept in sync with the risk manager name, and params you declare in the
signature are detected automatically below. Validation runs on save via the compiler sandbox.
```

Parameters are extracted from your `def` line by pattern match, so adding an argument to the signature adds a parameter row and vice versa. Helper: `Params are detected from your function signature — set each one's type and test value here. Editing this list updates the signature while you're on the template.`

The warmup box exists only if your code reads a trailing window: `Only if your code reads a trailing window. market_data.sma(t, n) needs n bars before the first simulated day, and the panel is warmed for the strategy — not for you. Undeclared, those calls return None for the first n days and your guard silently does not run. Example: def required_lookback(ma_win): return ma_win`

### External HTTP fields

| Field | Type | Seeded value | Server validation |
|---|---|---|---|
| `Endpoint` | text, required | empty, placeholder `https://my-service.example.com/risk-manager` | Parses as a URL, scheme `http` or `https`, host present, literal loopback and non-publicly-routable addresses refused. Missing → `Endpoint is required.` |
| `Timeout (s)` | number, parsed as a whole number | `30` | Must satisfy `0.001 ≤ timeout ≤ 0.5` **seconds**, and `timeout × 1000` must not exceed the org's `max_per_tick_timeout_ms` (default 100) |
| `Max concurrency` | number, parsed as a whole number | `4` | `1 ≤ max_concurrency ≤ 32` |

Endpoint helper: `Validated on save: the compiler fires a dummy per-tick POST and checks the response contract. http:// and https:// are both accepted; the host must be publicly reachable.` A plain `http://` URL adds an advisory warning above it — `Unencrypted (http://) — the request and your endpoint's reply travel in cleartext. Fine for testing; use https:// in production.` — which never blocks the save.

> [!CAUTION]
> **The seeded timeout cannot be saved, and the field will not accept a valid one.** The form seeds `Timeout (s) = 30`, but the server accepts only `0.001`–`0.5` seconds (`EXTERNAL risk manager timeout must be between 0.001 and 0.5 seconds, got 30`), and the org quota lowers the practical ceiling to `0.1` s. The field parses its input as a whole number, so a fractional second typed into it is read as `0`, which is also out of range. Until this is fixed, an external risk manager has to be created or updated through the API with an explicit fractional `timeout` — for example `0.1`.

Parameters work as they do for custom code but are forwarded rather than injected: `Declared params are forwarded verbatim in the per-tick POST body to your endpoint. Each needs a test value so the sandbox can run it.`

### Rule-based (declarative) builder

`Add rule:` is followed by one outlined button per primitive, labelled with the primitive's name and tooltipped with its description. The full catalogue is offered — there is no strategy-type filtering. Nine primitives:

| Primitive | Label | Compiles to | Description |
|---|---|---|---|
| `stop_loss` | Stop Loss | `stop_loss` | `Closes a position when its drawdown from entry exceeds a threshold.` |
| `trailing_stop` | Trailing Stop | `trailing_stop` | `Closes a position when it pulls back from its peak by a configured percent.` |
| `take_profit` | Take Profit | `take_profit` | `Closes a position once it rallies past a target gain from entry.` |
| `max_drawdown` | Max Drawdown | `max_drawdown` | `Closes everything and pauses trading when the portfolio drawdown exceeds a limit. By default it resumes once the market bounces off its lows; a fixed wait or a permanent halt are also available via recovery_mode.` |
| `exposure_cap` | Exposure Cap | `sector_cap` **or** `country_cap` | `Caps gross long exposure along a chosen dimension (sector or country).` |
| `position_cap` | Position Cap | `position_cap` | `Caps any single long position to a maximum allocation.` |
| `cash_floor` | Cash Floor | `cash_floor` | `Keeps a minimum cash bucket by proportionally trimming positions when invested exposure exceeds 1 - min_pct.` |
| `gross_exposure_cap` | Gross Exposure Cap | `gross_exposure_cap` | `Caps \|long\| + \|short\| gross exposure. Useful for long/short books.` |
| `time_window_halt` | Time-Window Halt | `time_window_halt` | `Suppresses strategy rebalancing on configured weekdays, dates, or date ranges. Other rules still fire — only SetTargets is skipped.` |

Each primitive takes the parameters of the built-in it compiles to, minus the runtime-metadata keys — you never write `sectors` or `countries` in a rule.

`exposure_cap` adds a required discriminator:

| Field | Type | Values | Effect |
|---|---|---|---|
| `dimension` | enum, required | `sector`, `country` | Chooses which built-in the rule resolves to |

Changing `dimension` re-seeds the rule's parameters from the newly-resolved built-in's schema, because the two do not accept the same keys. A leftover key is rejected, not dropped: `DSL primitive 'exposure_cap' resolved to 'country_cap', which does not accept: default_sector. Accepted params: default_country, max_pct.` A bad value gives `exposure_cap.dimension must be one of: 'sector', 'country'. Got: {dim}.`

Per rule the builder renders:

| Field | Type | Default | Notes |
|---|---|---|---|
| `Rule id` | text | `stop_loss`, `stop_loss_1`, `stop_loss_2`, … | Helper `Used to namespace Optuna parameters; must be unique within this DSL.` A duplicate is rejected on save |
| Numeric parameter | Segmented `fixed` / `optimized`, then one value box or `min` / `max` | `fixed` at the midpoint of the catalog range | Ranges are validated at both endpoints and at the midpoint; `min > max` is rejected |
| Enum parameter | Select | first allowed value | Discriminators re-seed the rule when changed |
| Array parameter | JSON text field | `[]` | Helper `JSON list, e.g. ["Sat","Sun"]` |
| String parameter | free text | schema default | — |

Rule cards carry the primitive label plus `#N`, with `move up`, `move down` and `remove rule` controls. Array position becomes `execution_order`. Empty state: `No rules yet — add one above to start composing a risk policy.` Saving with no rules is refused with `Add at least one rule before saving.` Catalog states: `Loading primitives…`, `Could not load primitive catalog from compiler service.`, `No rule primitives are available.`

> [!NOTE]
> The `First-match (any_of)` toggle has two deliberate limits: it supports **one group level only** (no `any_of` inside `any_of`), and the group always wraps **all** rules. Partial grouping and deeper trees are accepted by the validator and the optimizer but have to be written into `execution_details` directly. DSL versions are `"1"` (flat) and `"2"` (with `all_of`/`any_of`); anything else gives `Unsupported DSL version {v}; supported: '1' (flat rules), '2' (with all_of/any_of nesting).`

### Advanced options panel

The editor's collapsible sections, in order:

| Section | Title | Shown for | Notes |
|---|---|---|---|
| Parameters | `Parameters` | custom code, external | Summary is the parameter count |
| Data sources | `Data sources` | custom code only | Open by default; flagged as an error while a selected source still needs configuring |
| Advanced options | `Advanced options` | always | Collapsed; force-opens on a validation error or a deep link |
| → Variables | `Variables` | custom code only | Lazy; a live look at what your function receives at runtime |
| → Validation | `Validation` | always | Holds the validation error, and the output-sample panel for custom code |
| Version History | `Version History` | edit and view of a saved row | Lazy; summary is the version count |

A risk manager **never pins a price source.** It is handed the strategy's already-resolved price panel, so the Data sources section only declares additional injected data.

The Validation section hosts `Output sample` — subtitle `The operations your risk manager emits on a sample run.`, buttons `Preview output` and `Refresh`, error `Could not load the output sample.` A gear icon next to the code editor opens a `Validation` popover with a universe override, for custom code only.

**Version History** lists snapshots newest-first: `Version {{number}}`, `Captured {{date}}`, and chips for `kind: {{kind}}`, `builtin: {{name}}`, `strategy: {{strategyType}}`. Versions are written automatically by the database whenever the kind, built-in name, execution details, params, parameters or deletion state change — you never create one by hand. Only custom-code snapshots carry code for the diff, and `Restore` is enabled only for that kind and never in view mode; it loads the historical code back into the editor as an unsaved change, so you review it and save normally. Empty state: `No versions recorded.` The `Note` row is part of the panel but nothing in the product writes a note.

### Saving and naming

Save runs validation first, then names the risk manager.

1. **Save** — labelled `Create risk manager` in create mode, `Save changes` in edit mode. `Cancel` runs a leave guard.
2. **Validation** runs against the compiler for the current kind: rule-based validates the DSL, custom code compiles and executes your function in the sandbox with the test values, external fires a dummy per-tick `POST` and checks the response contract. Failures land in the Validation section, and a custom-code failure marks the offending line in the editor.
3. **The validated payload is pinned.** Only those exact bytes are persisted — the confirm dialog can rename the entrypoint, and the renamed text is what gets validated and stored.
4. **Confirm and name.** `Create this risk manager? Give it a name and a short description.` (or `Save your changes to this risk manager?`) with `Name` and `Description` fields.

Naming rules:

- For custom code the name **is** a Python identifier: typing a name lowercases it and replaces spaces with underscores, and the function in your code is renamed in step. Helper: `Kept in sync with the function name in your code.`
- A name collision is a hint, not a block. The dialog previews the allocated name as `Already in use — it will be saved as "{{name}}"`, and the server appends ` (2)`, ` (3)`, … Names are unique per organization among live rows.

Updates carry an optimistic-concurrency cursor, so a save against a row someone else changed is rejected rather than silently overwriting. Custom-code saves additionally require a fresh validation receipt covering the exact code, warmup declaration and data-source wiring — edit the code and it has to pass again.

## Execution modes

Risk managers support both execution modes, and unlike some registries the choice is permanent: the `Kind` control is locked the moment the row exists, because changing it is a delete-and-recreate.

### Internal

Internal (`Custom code`) risk managers run Python inside Fintela against a fixed signature:

```python
def my_rm(today, portfolio_state, market_data, threshold, **params) -> list[dict]:
    ops = []
    return ops
```

The function name **must equal** the risk manager's name; the validator rejects a mismatch and the runtime resolves the callable by that name. It is called once per simulation tick.

`portfolio_state` is a dict:

```python
{
    "today": "2024-01-15",
    "value": 100000.0,          # current portfolio equity
    "cash_allocation": 0.05,    # uninvested fraction (0.0–1.0)
    "portfolio_peak": 102000.0, # highest equity seen so far
    "holdings": [
        {"ticker": "AAPL", "side": "L", "allocation": 0.35},
        {"ticker": "TSLA", "side": "S", "allocation": 0.10},
    ],
    "equity_history": {"2024-01-12": 99000.0, "2024-01-15": 100000.0},
}
```

`market_data` exposes:

| Call | Returns | Notes |
|---|---|---|
| `price(date, ticker)` | `float \| None` | Close on an exact date; `None` when unknown or not yet listed |
| `history(ticker, n)` | `list[float]` | Last `n` closes up to and including today, oldest first; calendar gaps already skipped |
| `sma(ticker, n)` | `float \| None` | Mean of that window, O(1) from the engine's rolling cache |
| `stdev(ticker, n)` | `float \| None` | **Sample** standard deviation of the same window |
| `sma_many(tickers, n)`, `stdev_many(tickers, n)` | `dict[str, float]` | A ticker with no value is **absent**, never a zero |
| `today` | property | The current tick date |

Return a list of operation dicts — an empty list means "do nothing this tick":

```python
{"op": "close_position", "ticker": "AAPL", "side": "L"}
{"op": "close_all_sides", "ticker": "AAPL"}
{"op": "sell",  "ticker": "AAPL", "side": "L", "fraction": 0.5}
{"op": "buy",   "ticker": "AAPL", "side": "L", "allocation": 0.25}
{"op": "no_op"}
```

`side` is always `"L"` or `"S"`. Fractions and allocations are floats in `(0, 1]`, not percentages — `0` is rejected, so "no position" is `close_position`, never an allocation of zero. `set_targets` is reserved for strategies and is rejected. One malformed op rejects the whole tick.

To keep state between ticks, set `my_rm.__rm_state__` to any JSON-serialisable value. Use `numpy.random.default_rng(seed)` for randomness; a top-level `import random` is rejected.

Runtime budget:

| Limit | Value |
|---|---|
| Base per-tick budget | 100 ms |
| Extra per holding | 2 ms |
| Hard cap | 2000 ms |
| Consecutive failures before the manager goes terminal | 10 |
| Total failures before the manager goes terminal | 25 |
| Events recorded per run | 50 |

If your code reads a trailing window, declare it in the warmup box. The price panel is warmed for the strategy, not for you — an undeclared `sma(t, n)` returns `None` for the first `n` simulated days and your guard silently does not run.

### External

External risk managers are hosted by you, in any language, on your own infrastructure and against your own private data. The engine sends one `POST` per tick:

```json
{
  "today": "2024-01-15",
  "portfolio_state": {
    "value": 100000.0,
    "cash_allocation": 0.05,
    "portfolio_peak": 102000.0,
    "holdings": [ { "ticker": "AAPL", "side": "L", "allocation": 0.35 } ]
  },
  "params": { "threshold": 0.05 }
}
```

Respond `2xx` with a JSON array of the same operation objects; `[]` does nothing this tick.

> [!IMPORTANT]
> **The engine sends no market data to an external risk manager.** It also omits `equity_history`, which internal risk managers do receive. An external risk manager owns its own data side — fetch whatever prices or signals you need from your own source.

Limits and failure handling:

| Limit | Value |
|---|---|
| Declared timeout | `0.001 – 0.5` s, further capped by the org's `max_per_tick_timeout_ms` (default 100 ms) |
| Engine hard cap | 500 ms |
| Max concurrency | `1 – 32` |
| Consecutive failures before the manager goes terminal | 10 |
| Total failures before the manager goes terminal | 25 |
| Events recorded per run | 50 |

A non-2xx status, a non-JSON body, or one malformed op rejects the whole tick. Keep the endpoint geographically close to the optimizer so round-trip latency does not dominate the simulation budget.

Endpoint screening happens twice. At save time the URL is parsed, the scheme must be `http` or `https`, a host must be present, and a literal loopback or non-publicly-routable address is refused — this check is DNS-blind. At fetch time the compiler sandbox and the engine's per-run screen catch a public hostname that resolves to a private address.

The same two-mode split applies across the platform; see [execution modes](/docs/execution-modes) for the general contract and [external strategies](/docs/external-strategies) for the strategy-side equivalent.

### Where neither mode applies

| Kind | Execution Type | Why |
|---|---|---|
| `Rule-based` | `—` | Compiles to built-ins at study-build time. There is no user code and no endpoint, so neither mode applies. It is validated against the compiler on every save, but nothing of yours ever executes. |
| `Built-in` | `—` | Runs natively in the Rust engine. Not registrable, not listed, and not authored — you attach it and set its parameters. |

Two consequences worth stating plainly:

- **Live validation** runs per keystroke for custom code (once every parameter has a test value) and for rule-based. **External does not live-validate** — there is nothing meaningful to check without calling your server, so validation happens only on save.
- **The sandbox does not cover every kind.** Rule-based risk managers and the two runtime-metadata caps (`sector_cap`, `country_cap`) are excluded from both the single-manager and the stack preview. They still apply in the real study — the preview simply cannot run them.

Related reading: [studies](/docs/studies) for where attachments live, [study lifecycle](/docs/study-lifecycle) for the `SAVED` rule, [portfolio detail](/docs/portfolio-detail) for the Risk Analytics tab, and [registries](/docs/registries) for the shared registry conventions.
