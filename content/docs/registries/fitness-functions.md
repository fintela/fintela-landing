---
title: Fitness Functions
section: Registries
sectionOrder: 3
order: 5
published: true
updated: 2026-09-01
summary: Define what "better" means for your studies — score simulated trades with a built-in performance metric, your own logic written inside Fintela, or your own external service.
keywords: fitness, objective, score, sharpe, sortino, calmar, direction, maximize, minimize, custom scoring, external scoring, built-in metrics, portfolio metric
---

A fitness function defines what "better" means for a [study](/docs/studies). Every trial in a study runs a full simulated backtest, and your fitness function reduces that simulation — the equity curve, the performance metrics already calculated for it, the positions held, and the orders and trades that happened — into a single score. The optimizer uses that score to decide which parameter combinations to try next, always moving in the direction you've chosen. Nothing else on the platform decides what counts as a good result: swap the fitness function and the very same strategy can end up with completely different optimized parameters. It's one of the most consequential choices you make when setting up a study.

## Overview and purpose

### What one trial is scored with

Every trial runs a full simulation. The optimizer slices that simulation into windows — a training period, a validation period, an overall view, and sometimes an out-of-sample period — and scores each one with your fitness function. Only the **training** score is fed back to the search; that's the number the optimizer actually chases when deciding what to try next.

The validation, overall, and out-of-sample scores are still calculated and stored so you can review them later, but they're for your evaluation only — they never steer the search itself.

### One objective, one direction

Fintela does not support scoring on several objectives at once (no "multi-objective" or trade-off mode). Every study optimizes exactly one fitness function, in exactly one direction — higher is better, or lower is better — decided when the study is created and locked in once it launches:

- If you explicitly set **Maximize** or **Minimize** in the study builder's optimization objective control, that choice wins, regardless of which kind of fitness function you're using.
- If you leave it on its default and you picked a **built-in** objective, the platform follows that metric's natural direction — for example, it minimizes a risk metric like volatility and maximizes a return metric like the Sharpe ratio.
- If you leave it on its default with a function **you wrote yourself** (internal or external), the platform maximizes it.

> [!WARNING]
> Don't assume a study always maximizes your score. A custom fitness function maximizes by default, a "lower is better" built-in objective minimizes unless you override it, and any study can be explicitly pinned to minimize. The safe habit when writing your own scoring logic: always return a bigger number for a better outcome, and make sure the study's direction is set to match.

### The four ways to score a trial

| Mode | Can you edit it? | What runs |
|---|---|---|
| Internal | Yes | Python you write, executed securely by Fintela |
| External | Yes | Your own service, hosted and run by you |
| Built-in | No | A ready-made objective based on a standard performance metric |
| Rule-based | No | Not available yet — coming soon |

Once you choose a mode for a fitness function, it's locked in for that function's lifetime. There's no switching an internal function to external or back — if you want a different approach, create a new fitness function.

### How a fitness function connects to a study

A study links to a fitness function through three settings:

| Setting | What it controls |
|---|---|
| Fitness function | Which registry entry scores this study |
| Fitness parameters | Fixed values for any parameters the function declares — **not** a search range. Every trial uses the same values. |
| Reference asset group (optional) | An [asset group](/docs/asset-groups) whose price history is handed to your function for context — for comparisons, a benchmark, or anything else your logic needs. Leave it empty and your function simply receives no price data. |

When a study launches, it locks to the current version of the fitness function. If you edit the function afterward, the study keeps using the version it started with — its results never shift under you after the fact.

> [!NOTE]
> Fitness parameters are constants, not something the search explores. The study builder is explicit about this: the same value is used on every single trial. If you're scoring with an internal function, the parameter names you declared on the function and the values you set on the study have to match — a mismatch stops the study before it starts, with a clear error telling you what to fix.

## The Fitness Functions registry

### Finding and opening the registry

The Fitness registry lives under **More Options** in the sidebar, labeled **Fitness**. It isn't gated behind a paid plan — every organization has access. From here you can search, filter, switch between list and card view, and start a new fitness function with **New Fitness**. A documentation panel is one click away if you want a refresher while you work.

### Columns

| Column | What it shows |
|---|---|
| Name | The function's name |
| Description | Your own notes on what it does, or an automatically generated summary of its setup |
| Execution Type | Internal, External, Built-in, or Rule-based |
| Author | Who created it — shown as "platform" for built-in objectives |
| Created At | When it was added — the table opens sorted newest first |
| Parameters *(optional)* | The names of any parameters it declares |
| Associated Studies *(optional)* | How many studies currently use it |

Turn on the optional columns from the column chooser if you want to see a function's parameters or usage count without opening it.

### Filters, search, and card view

Free-text search matches a function's name, its description, its author, and — when auto-generated descriptions are turned on, which is the default — a short summary the platform writes describing the function's configuration. If you'd rather see your own written description in the table instead of the generated one, that's still available in a tooltip on hover.

You can filter by name, description, execution type, author, number of associated studies, or creation date, and switch to card view for a more visual way to browse the same information.

### Insights summary

A summary panel above the table gives you an at-a-glance read before you make changes: how many fitness functions you have by execution type, and how many studies depend on each one — the same count shown in the Associated Studies column, so the two never disagree. It's a quick way to check whether it's safe to edit or delete something before you commit to it.

### Actions menu

Open a row's action menu (click it, or right-click for the same options as a context menu) to work with a single fitness function:

| Action | What it does | Unavailable when |
|---|---|---|
| Run a backtest | Opens the sandbox to test this function against a strategy | — |
| View | Opens a read-only view of the full configuration | — |
| Edit | Opens the function for editing | It's a built-in objective, it's already used by a study, or your role doesn't allow editing |
| Duplicate | Copies the function into your organization as a starting point for your own version | Your role doesn't allow creating |
| Promote to metric / Edit metric | Turns this function into a portfolio metric usable anywhere a built-in one is | It's a built-in objective, or your role doesn't allow editing |
| Remove metric | Removes the metric promotion and its computed values | Your role doesn't allow editing |
| Delete | Removes the function | It's a built-in objective, it's already used by a study, or your role doesn't allow deleting |

Built-in objectives can't be edited, deleted, duplicated, or promoted — they're already finished, published metrics maintained by Fintela. A function that's already in use by a study is locked from editing or deleting until nothing references it, so a study's results can't shift out from under you. Duplicate isn't available for built-in objectives either; if you want to build on one, write your own internal function that reads the same underlying metric.

### Run a backtest

Before committing a fitness function to a full study — which can run many trials and take real time — you can sandbox it against a single strategy to confirm it behaves the way you expect. **Run a backtest** opens a dedicated sandbox page where you choose:

| Setting | Notes |
|---|---|
| Fitness function | Pre-selected when you arrive from a row |
| Strategy | Required — the [strategy](/docs/strategies) to simulate |
| Universe & date range | Asset group, any extra tickers, and a start and end date |
| Fitness parameters | Left empty if the function declares none |
| Strategy parameters | Shown only if the strategy declares any |
| Risk manager *(optional)* | Score the fitness function against a risk-managed version of the backtest instead of the raw one — see [risk managers](/docs/risk-managers) |
| Invert side | Flips every position to its opposite side for this run only, as a preview — nothing is saved |

The **Run Sandbox** button unlocks once a fitness function, a strategy, and an asset group are chosen, both dates are set, and any parameter values you've entered are valid.

Results open with your fitness score front and center, followed by the full simulation output — equity chart, holdings, trades, orders, and period metrics — so you can see exactly what produced that number. Running a sandbox test draws on your account's token balance; see [tokens and billing](/docs/tokens-and-billing). Built-in objectives can't be sandboxed, since there's no custom logic to test.

### Confirmation dialogs

Deleting a function, or removing a promoted metric, both ask you to confirm first.

> [!CAUTION]
> Deleting a fitness function also deletes **every study that uses it**. There's no undo. Check the Associated Studies count before you delete anything you're not certain is unused.

Removing a metric promotion discards the values already computed for it. If you just want to pause it without losing history, edit the metric and turn its compute toggle off instead of removing it.

### Bulk actions

Select multiple rows to delete them together in one action — the same warning about associated studies applies to a bulk delete as it does to deleting a single row.

### Roles, permissions, and quota

| Role | View | Edit | Create | Delete |
|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | No |
| Analyst | Yes | No | Yes | No |

> [!WARNING]
> This table describes what the interface shows you. The platform enforces its own rules underneath, and in some cases they're stricter — deleting a fitness function, for instance, requires a higher level of access than editing does, even if the Delete option looks available to you. If an action is refused unexpectedly, check with your organization's owner or admin.

Creating fitness functions is quota-limited: free-tier organizations can create up to **2** custom functions (internal or external combined). Built-in objectives don't count against this limit. Quotas only block new creation — if you're already over the cap, everything you have keeps working, you just can't add more until you free up room or upgrade. See [tokens and billing](/docs/tokens-and-billing).

## Creating a fitness function

### One editor screen

Clicking **New Fitness** opens a single editor screen — there's no multi-step wizard. Your implementation sits in the center, additional settings live in a collapsible panel on the right, and naming happens as the very last step. Nothing is saved until you confirm that final step. The same screen handles creating, editing, and viewing — in view mode everything is shown read-only, and a **Back** button returns you to the list.

### Choosing a mode

A switch at the top of the editor lets you pick how the function runs: **Internal** (Python you write, run by Fintela) or **External** (your own service). A third option, **Rule-based**, is visible but permanently disabled for now — a no-code way to build scoring logic that's coming soon. You choose the mode once, at creation — it can't be changed afterward. If you decide you want a different approach later, create a new fitness function.

### Writing your code (Internal mode)

The center of the screen is a full code editor for Python: syntax highlighting, a starter template, live validation feedback as you type, jump-to-error, import and export, full-screen mode, and code formatting. Two tools are specific to fitness functions:

- **Reference** — opens a quick reference showing exactly what your function receives and how to use it, so you don't have to leave the editor to look it up.
- **Validation universe** — lets you choose what sample price data Fintela uses to test your code before you save: a single default ticker, a custom list of tickers, or one of your own asset groups. Pointing validation at data that resembles what your function will really see helps catch problems the generic default might miss.

Until you've made changes to the starter template, an info message reminds you that editing the name or description will still update the template automatically — the moment you touch the actual code, it becomes your own custom version.

### Connecting to your own service (External mode)

There's no code editor here. Instead, you set three things:

| Setting | Default | What it does |
|---|---|---|
| Endpoint | — | The web address of your service |
| Max Concurrency | 4 | How many scoring requests Fintela can send to your service at the same time |
| Timeout (seconds) | 30 | How long Fintela waits for a reply before giving up on that request |

Tune concurrency and timeout to match what your own service can actually handle — set them too aggressively and you'll see trials fail rather than score. If you enter a plain `http://` address, you'll see a reminder that traffic will travel unencrypted; that's fine while you're testing, but switch to `https://` before relying on it in production.

The Save button unlocks once there's something to validate — your code for internal mode, your endpoint address for external mode. Naming happens afterward, in the confirmation step.

### Declaring parameters

The **Parameters** panel lets you define named inputs your fitness function can use:

| Field | Notes |
|---|---|
| Parameter name | Must match the argument name in your function |
| Type | Integer or Float only — no text, true/false, or multiple-choice parameters |
| Test value | The value used while you're validating and previewing your code in the editor |
| Description *(optional)* | Free-text notes for yourself or teammates |

The panel and your code stay in sync automatically: edit your function's argument list and the parameter list updates to match, defaulting new ones to Float with no test value.

> [!NOTE]
> A fitness parameter has no minimum, maximum, step, or list of choices — unlike a strategy parameter, it's never something the optimizer searches over. It's just a name, a type, an optional description, and a test value used for previewing your code. The value actually used for scoring comes from the fixed value you (or whoever launches the study) set on the study itself.

### Advanced options: data sources, variables, validation, and version history

The right-hand panel holds a few more sections, most collapsed by default:

- **Data sources** — price history is always available to your function automatically. Anything else — fundamentals, sentiment data, or one of your own asset groups — needs to be added here so it's loaded and handed to your function when it runs.
- **Variables** — a live inspector showing the real shape and sample contents of everything your function is about to receive, so you can double-check your logic matches reality before you save.
- **Validation** — the result of testing your code, plus (for internal functions) an **Output sample**: run your function once against sample data and see both the score it produced and every piece of data it was actually handed. It's the fastest way to sanity-check your logic before committing to it.
- **Version History** *(editing an existing function only)* — compare any past version against what's currently in the editor, and restore an earlier version if it was an internal function.

### Naming your function

Nothing is saved until you confirm a name in the final dialog. You'll set a name and, optionally, a description. If the name you type is already taken, the platform automatically appends a number rather than blocking you — you'll see a note showing the name it actually saved as.

For internal functions, the name you choose also becomes the entry-point name the platform looks for in your code, so keep it a valid identifier — lowercase words separated by underscores work best. Because renaming can change what the platform expects your code to be called, changing the name re-runs validation before saving.

### Validating before you save

An internal fitness function has to pass validation before it can be saved — Fintela runs your code against sample data to confirm it produces a usable score. The editor validates live as you type, and validates once more right before saving to make sure nothing has drifted. Common things validation catches:

- A syntax error or something else that stops your code from running at all
- No function matching the name you gave it, or a mismatched entry point
- A parameter or data source you referenced that isn't actually declared or connected
- An invalid validation universe (a ticker or asset group that doesn't resolve)
- An error thrown while your code actually runs against the sample data
- A return value that isn't a valid score (see [Returning a valid score](#returning-a-valid-score) below)

Unlike strategies, a fitness function isn't checked for memory usage and doesn't need a warm-up period — it always receives the full price history, so there's no lookback window to prove out. And if your code imports something outside the recommended set of libraries, you'll see a warning rather than a hard block.

If you have unsaved changes sitting in the editor that you haven't reviewed yet, you'll be asked to review them before you can validate or save — this protects you from accidentally saving a draft you didn't mean to keep.

### New versions and studies already running

If you edit an internal function's code or its parameter list after it's already being used by at least one study, saving creates a **new version** rather than overwriting the old one:

> Saving creates a new version. Studies that have already launched stay pinned to the version they ran with, so their results won't change.

This is what keeps a study's results stable and reproducible even as you keep improving the function afterward. A version is only created when something that actually affects scoring changes — description-only edits don't add a new version. If someone else has edited the function since you opened it, you'll be asked to refresh before saving, so you don't accidentally overwrite their changes.

### Promoting a fitness function to a portfolio metric

Any custom fitness function — internal or external, never a built-in — can be promoted into a first-class portfolio metric: something you can select, sort by, and compare anywhere a built-in metric like Sharpe or Sortino appears. See [metrics reference](/docs/metrics-reference).

| Field | Default | Notes |
|---|---|---|
| Display label | The function's name | What shows up in column headers and metric pickers |
| Metric slug | Auto-generated from the name | A short identifier for the metric, lowercase letters/digits/underscores only |
| Direction | Higher is better | Or Lower is better, or Informational (no direction — for context only) |
| Unit | *(empty)* | Free text, e.g. "ratio" |
| Category | custom | Free text, for grouping in metric pickers |
| Frozen parameters | Each parameter's test value | If your function declares parameters, every one has to be pinned to a fixed number before it can become a metric — a metric can't have a value that changes per study |
| Compute this metric | On | Turn it off to register the metric without actually computing values yet |

A few things worth knowing before you promote a function:

- A function can only be promoted once — promoting it again just edits the existing metric in place.
- Values are computed for the training, validation, and out-of-sample stages only. The live/real-life performance stage is skipped, because its end date keeps moving as time passes, which would make the computed value unstable.
- Renaming the metric's slug **deletes** the values already computed under the old name — treat renaming like starting over.
- Removing the metric deletes both the promotion and every value already computed for it. If you just want to stop computing it while keeping history, turn off "Compute this metric" and save instead.
- If a value fails to compute for some portfolio, it simply shows as blank rather than zero, and that portfolio is excluded from any ranking by that metric.

## Execution modes

### Internal: your code, run by Fintela

Internal fitness functions are Python you write, stored in the registry and executed by Fintela — inside the optimizer while a study runs, and in an isolated sandbox when you test with **Run a backtest**. The shape of the function is always the same:

```python
def my_fitness(simulation, data, **params) -> float:
    # Score one simulated period — a bigger number means a better outcome, by default.
    ...
```

Common Python libraries — pandas, NumPy, `math`, and `datetime` — are already available to you, along with a set of Fintela helper functions for working with tickers and universes (things like filtering, restricting, or combining a group of assets). You don't need to import any of it yourself.

The platform finds your scoring function by matching its name to the fitness function's own name, so name it that way, and define any helper functions **after** your main scoring function rather than before it — a helper defined earlier that happens to share the same argument names can get mistaken for the entry point.

### What your function receives

| Argument | What it is |
|---|---|
| `simulation` | Everything about this one simulated period |
| `data` | Historical price data for your linked asset group, if you set one on the study — the full history, not limited to the current window. If the study has no reference asset group, this is simply empty. |
| Your declared parameters | The fixed values set on the study, plus any extra data source outputs you wired in |

`simulation` itself breaks down into:

| Part | What you get |
|---|---|
| Equity curve | Account value over time within this period |
| Metrics | Performance metrics already calculated for exactly this period — Sharpe ratio, drawdown, and more — so you don't need to recompute them yourself |
| Holdings | What was held each day: which ticker, long or short, and how much was allocated to it |
| Orders | Every order placed during the period |
| Trades | Every completed trade that falls within the period |

Equity and holdings are limited to dates inside the window; orders are limited to those placed inside it. Additional benchmark-comparison metrics (alpha, information ratio, up/down capture, and others) are automatically included when your study has a benchmark attached.

> [!CAUTION]
> A trade that started before this window began is left out of this window's trade list entirely — even if it was still open partway through the window. It isn't clipped to fit; it simply doesn't appear until the window it actually opened in.

> [!WARNING]
> While you're validating your code (as opposed to running it in a real study), only a handful of metrics are guaranteed to be present in the sample data, and the sample prices cover only a small set of unrelated test tickers over a fixed sample period — not your real universe, and not a benchmark like SPY. Always read a metric defensively with a fallback default, and rely on the benchmark comparison metrics built into `simulation` rather than hard-coding a ticker symbol — that will work fine in a real study but fail during validation.

### Returning a valid score

Your function has to return a plain number — not `True`/`False`, not text, not a list or a dictionary — and it has to be finite: never `NaN`, never positive or negative infinity.

This matters because the optimizer needs a real number to compare trials against each other. A boolean, a missing value, or an infinite score breaks that comparison — either every trial becomes impossible to rank, or one trial looks artificially "unbeatable" even though it isn't really the best outcome. Guard the edge cases explicitly in your own code — a period with no trades, a ratio that would divide by zero — and return a clearly bad (very low) number in those cases instead, so the optimizer treats them as bad outcomes rather than breaking the run.

What happens depends on which stage the problem shows up in:

| Situation | What happens |
|---|---|
| An invalid score during the training, validation, or overall stage | That trial is skipped, and the optimizer moves on to try different parameters |
| An invalid score during the out-of-sample stage only | Not fatal — that trial still counts, it just has no out-of-sample score to show |
| An error while your code runs during the out-of-sample stage | Also not fatal — same as above, no out-of-sample score |
| Any other error while your code runs during training, validation, or overall | That trial is skipped and the study continues with the next one |

### Understanding why a trial was skipped

When you review a study's results, a trial that didn't get a usable score is marked as skipped rather than shown with a misleading number. The reason is recorded alongside it — an invalid score, an error while your code ran, or a period that fell outside the study's expected bounds — so you can trace it back to what went wrong in your logic. For a built-in objective, a skip usually means the underlying metric simply couldn't be computed for that period, or came back with an unexpected value. See [API errors](/docs/api-errors) and [analyzing results](/docs/analyzing-results) for how skipped trials show up when you're reviewing a study.

### External: scoring with your own service

External mode means you host the scoring logic yourself, in any language, on your own infrastructure, against your own private data — Fintela only ever stores the address, a timeout, and a concurrency limit, never your code. Your models, your proprietary logic, and any data you don't want to move into Fintela can all stay exactly where they are; only the resulting score comes back. For the full walkthrough, see [external fitness](/docs/external-fitness), with framework-specific guides for [Python/FastAPI](/docs/python-fastapi) and [Node/Express](/docs/node-express).

Fintela sends your service the same simulation data — equity curve, metrics, holdings, orders, and trades — that an internal function would receive, and expects a single numeric score back.

> [!WARNING]
> How your fitness parameters are delivered to your service is different from how they're delivered for an external strategy — check the [external fitness](/docs/external-fitness) guide for the details that apply to your language and framework.

A few things worth knowing about how the connection behaves:

- If your service briefly errors out or times out, Fintela automatically retries a handful of times before giving up — a short blip on your end shouldn't necessarily fail every trial.
- Fintela sends no credentials to your service. If you need to restrict who can call it, that's on you to secure — an allowlist, a shared secret you check for, or similar.
- If your service returns something Fintela can't use — not JSON, or missing the score — the affected trial is skipped with a clear message explaining why, and the rest of the study continues.

When you save an external function, Fintela sends a small test request to your endpoint using your test parameter values, to confirm it responds the way it's expected to before you can save. If it doesn't, you'll see a clear error telling you what came back instead.

> [!TIP]
> When you test with **Run a backtest**, Fintela waits a bit longer by default for a reply than it does during a real study — handy if your service is slower in a test environment than in production.

### Requirements for your endpoint's address

Your service's address is checked when you save, and has to meet a few basic rules:

- No whitespace or unusual characters in the address
- Must be a properly formed web address
- Must use `http://` or `https://`
- Must include a host — no bare IP-less addresses
- Can't point at `localhost` or a loopback address
- If you use a literal IP address, it has to be a publicly routable one

There's no restriction on which port you use — only the address itself matters. The platform screens the address to make sure it can't accidentally point at internal or private infrastructure instead of a real external service.

> [!NOTE]
> A plain `http://` address is technically accepted; encryption isn't what this check is for. The editor still shows a cleartext warning as a reminder — use `https://` once you're relying on this in production.

### Built-in objectives

Built-in objectives are ready-made scoring options provided by Fintela out of the box, built on standard performance metrics — no code required. They're visible to every organization, maintained centrally, and can't be created, edited, deleted, duplicated, sandboxed, or promoted, since they're already finished, published metrics.

| Objective | Direction | Unit | Category |
|---|---|---|---|
| `total_return` | Higher is better | % | Return |
| `compound_annual_growth_rate` | Higher is better | Annualized % | Return |
| `volatility` | Lower is better | Annualized | Risk |
| `max_drawdown` | Lower is better | Ratio | Risk |
| `average_drawdown` | Lower is better | Ratio | Risk |
| `max_drawdown_duration` | Lower is better | Days | Risk |
| `ulcer_index` | Lower is better | Ratio | Risk |
| `var_95` | Lower is better | Daily ratio | Risk |
| `cvar_95` | Lower is better | Daily ratio | Risk |
| `sharpe_ratio` | Higher is better | Ratio | Risk-adjusted |
| `sortino_ratio` | Higher is better | Ratio | Risk-adjusted |
| `calmar_ratio` | Higher is better | Ratio | Risk-adjusted |
| `martin_ratio` | Higher is better | Ratio | Risk-adjusted |
| `omega_ratio` | Higher is better | Ratio | Risk-adjusted |
| `profit_factor` | Higher is better | Ratio | Risk-adjusted |
| `recovery_factor` | Higher is better | Ratio | Recovery |
| `skewness` | Higher is better | Dimensionless | Distribution |
| `excess_kurtosis` | Lower is better | Dimensionless | Distribution |
| `tail_ratio` | Higher is better | Ratio | Distribution |
| `win_rate` | Higher is better | % | Distribution |
| `payoff_ratio` | Higher is better | Ratio | Distribution |
| `alpha` | Higher is better | Annualized % | Benchmark |
| `information_ratio` | Higher is better | Ratio | Benchmark |
| `treynor_ratio` | Higher is better | Ratio | Benchmark |
| `up_capture` | Higher is better | % | Benchmark |
| `down_capture` | Lower is better | % | Benchmark |

That's 26 ready-to-use objectives. The five benchmark-based ones require your study to have a benchmark attached — pick one without a benchmark set and the study is blocked at launch with a clear message, rather than wasting trials before failing.

A few catalogue metrics are deliberately **not** offered as objectives:

| Not available as an objective | Why |
|---|---|
| Trade-level stats (trade win rate, trade profit factor, average trade duration, expectancy) | Not derived from the same per-period data every other objective uses |
| `beta`, `correlation` | These don't have a clear "better" direction, so Fintela won't guess one on your behalf — if you want to optimize toward a target correlation or beta, write your own fitness function that states it explicitly |
| `tracking_error`, `r_squared` | Available for reference in the benchmark comparison, but not offered as scoring objectives |
| `fitness` | This is the name of the score your own objective produces — not a separate metric to optimize toward |

### Rule-based scoring — not available yet

Rule-based fitness is a no-code way to define scoring logic that's planned but not available yet. The option is visible in the mode switch but permanently disabled, with a "coming soon" note — don't build a workflow around it yet.

### Comparing the modes

| | Internal | External | Built-in | Rule-based |
|---|---|---|---|---|
| Create / edit / delete | Yes | Yes | No | No — not available yet |
| Runs | Your code, on Fintela | Your code, on your own infrastructure | A ready-made objective | — |
| Keeps your logic private | No — your code is stored on the platform | Yes — only the score comes back to Fintela | — | — |
| Declared parameters | Yes | Yes | No | — |
| Extra data sources | Yes | No | No | — |
| Needs validation before saving | Yes, full code validation | Address is checked, no code to validate | — | — |
| Version history | Yes, with restore | Yes, without restore | No | — |
| Can be sandbox-tested | Yes | Yes | No | — |
| Can be promoted to a metric | Yes | Yes | No | — |
| Live feedback as you type | Yes | No | — | — |

For how a fitness function fits into a full study, see [execution modes](/docs/execution-modes), [study lifecycle](/docs/study-lifecycle), [optimizer architecture](/docs/optimizer-architecture), and the [end-to-end workflow](/docs/end-to-end-workflow). If you want to pull your fitness results into your own tools or dashboards, see the read-only [API: fitness](/docs/api-fitness) reference.
