---
title: Studies
section: Registries
sectionOrder: 3
order: 4
published: true
updated: 2026-09-01
summary: Set up an optimization run that tests one strategy against a chosen universe and objective across many parameter combinations, then review, rank and promote the trials it produces.
keywords: study, optimization, trials, sampler, trial budget, backtesting, walk-forward, progress, health, status, autostop, risk managers
---

A study is a single optimization run. You pick one strategy, one universe (asset group), one objective (fitness function) and (optionally) a stack of risk managers, then set a date window and a trial budget. Fintela searches your strategy's parameter space for the configuration that scores best against your objective. Every parameter combination it tries becomes a trial, and every trial becomes a portfolio you can inspect, rank and promote. Saving a study does **not** start it running: a new study is created as a draft first, and launching it is a separate action that spends tokens from your account.

## Overview and purpose

### What a study is made of

| Component | How many | Where it comes from |
|---|---|---|
| Strategy | exactly one | [Strategies](/docs/strategies) |
| Asset group (your universe) | exactly one | [Asset Groups](/docs/asset-groups) |
| Fitness function (your objective) | exactly one | [Fitness Functions](/docs/fitness-functions) |
| Fitness asset group | optional: only for custom fitness functions that need their own data | [Asset Groups](/docs/asset-groups) |
| Risk managers | any number, applied in the order you set | [Risk Managers](/docs/risk-managers) |
| Benchmark | automatic, none, or one you pick | Fintela's instrument catalog |

Beyond these building blocks, a study also carries the parameter ranges you want to search, a train / validation / out of sample date split, which search method (sampler) to use, how many trials to run, rules for which tickers are eligible to trade, and whether the search is trying to maximize or minimize your objective.

### Two names, one study

Every study has a name you choose: the one you see everywhere in the product. It doesn't have to be unique: if you reuse a name that's already taken in your organization, Fintela automatically appends a number, like " (2)" or " (3)", when it saves. You can rename a study freely while it's still a draft; study names can run up to 200 characters.

Behind your chosen name, Fintela also keeps its own internal identifier for each study, used for links and for support requests. You'll rarely need to think about it: it's never shown to you as "the name," and it isn't something you can set.

### What a study produces

Running a study produces **trials**. Each trial is one parameter combination: it gets backtested over your date window, scored by your fitness function, and saved as its own portfolio you can inspect. A trial moves through its own short lifecycle: waiting to run, running, then finishing successfully, or ending as pruned (skipped as redundant or invalid) or failed.

Once a study finishes, Fintela also computes three further pieces of analysis: a robustness read (including an overfitting estimate), families that group similar trials by behavior, and a read on which parameters actually mattered to the result. These can take a little longer to appear than the study's own Completed status, so don't be surprised if a freshly completed study is still filling in these sections a short while after you first see it.

### What a study feeds into

| Where | What you'll find |
|---|---|
| [Portfolios dashboard](/docs/portfolios-dashboard) | Click **View** on any study to open its ranked trials, charts, exports, and (while it's still running) the Stop control. |
| [Optimization dashboard](/docs/optimization-dashboard) | See every study currently in flight across your organization in one place. |
| [Portfolio groups](/docs/portfolio-groups) and [Promoted portfolios](/docs/promoted-portfolios) | The trials your studies produce graduate into these once you decide to keep and track them. |
| [Fintelligent](/docs/fintelligent) | Fintela's AI assistant can open the study builder and fill it out based on what you ask for, then hand it back: but it always leaves the actual saving or launching to you. |
| Your own tools and dashboards | Prefer to pull your studies and their results into systems you already use? A personal access key from your account settings gives you secure, read only access, so nothing outside Fintela can ever change your data by accident. See [API: Studies](/docs/api-studies). |

### Where studies come from

| How you started it | What you get |
|---|---|
| **New Study** in the registry | A blank builder. Saving creates a draft, unless you choose Save & Launch, which queues it immediately. |
| **Duplicate** on an existing study | The builder opens prefilled from that study's setup, under a fresh name: nothing is saved until you do. |
| **Derive / Optimize risk managers** from a portfolio or a portfolio group member | Fintela creates a batch of risk manager optimization studies for you and queues them immediately: these never sit around as drafts. |
| Fintelligent | Opens the builder prefilled for you to review: you still confirm and save it yourself. |

## Registry table view

Your studies live in one list at Studies, using the same layout as Fintela's other registries: a toolbar at the top, an always visible insights strip, the table (or a card layout, your choice), and a status bar that appears once you select rows. Your search terms, sort order and filters are reflected in the page's link, so you can bookmark or share exactly the view you're looking at.

### Entry points

- The main Studies list is where you land by default.
- **Edit** on a row opens the builder prefilled with that study's setup: only available for studies that haven't been launched yet.
- **New Study** opens a blank builder.
- **Duplicate** opens the builder prefilled from an existing study.
- Searching, sorting or filtering all update instantly and are reflected in the link, so refreshing the page (or sharing it) keeps your exact view.

> [!NOTE]
> There isn't a separate details page for a study. Use **View** on a row to reach its results: a bookmarked or typed in link to a single study still shows you the full list.

### Command bar

| Element | What it does |
|---|---|
| Search box | Type to search across your studies (placeholder **Search studies…**). |
| **New Study** | Opens a blank builder. Disabled if you don't have permission to create studies. |
| **Filter** | Opens the filter panel. |
| **Refresh** | Reloads the list. |
| **View documentation** | Opens this documentation in a side panel without leaving the page. |
| List / Card view | Switches between the table and a tile layout. |

If your plan limits how many studies you can have, a small meter in the toolbar shows how many you've used against your limit: amber past 80% used, red once you've hit the cap, with a tooltip reminding you that buying tokens raises the limit. Organizations without a studies limit don't see this meter at all.

Hitting the cap doesn't disable **New Study**: clicking it still opens a dialog explaining you've reached your plan's limit, that your existing studies keep working normally, and that deleting one is one way to make room.

### Columns

| Column | Sortable? | Filterable? | What it shows |
|---|---|---|---|
| Name | yes | text search | The study's name, in bold. |
| Strategy | yes | pick from a list | Links to the strategy. If you don't have full access to it, the name shows without a link; an unknown strategy shows as **Unknown strategy**. |
| Health | no | N/A | A meter showing the share of trials that produced a usable result. |
| Progress | no | N/A | A meter showing completed trials against the total you requested. |
| Status | yes | pick from a list | The current status badge. |
| Author | yes | pick from a list | Who created the study. |
| Total Trials | yes | number range | Completed trials over your requested total, e.g. "340/1000". |
| Train Period | yes | N/A | The training window's start and end dates. |
| Validation Period | yes | N/A | The validation window's start and end dates. |
| Daily Update | yes | on/off | A toggle you can flip right from the list. |
| Created At | yes | date range | When the study was created. Hidden by default: add it from the column chooser. |

Name, Strategy, Health, Progress, Status and Author show by default; the rest are one click away in the column chooser. Studies sort by creation date, newest first, unless you change it.

> [!NOTE]
> Health and Progress can't be sorted, by design. Both refresh every few seconds while a study is active, and a sortable live column would keep reshuffling rows out from under the row you're aiming at.

Daily Update toggles the moment you click it, without opening the row's menu: its tooltip tells you whether clicking will turn daily updates on or off.

Card view shows the study name along with Status, Total Trials, Created At and Author; the Daily Update toggle isn't available on a card.

### Status values

| Status | What it means |
|---|---|
| Draft | Saved, not launched yet: you can still edit or delete it. |
| Queued | Launched and waiting for Fintela to start running it. |
| Running | Actively running trials right now. |
| Completed | Every trial finished, or (for a small, fully countable search space) every possible combination was tried. |
| Failed | The run hit a problem it couldn't recover from, or too many trials kept failing. |
| Stopped | You stopped it before it finished. |

Statuses update in real time, so the badge always reflects what's actually happening, never a stale snapshot.

### How a study's status changes

- Save it without launching → **Draft**.
- **Save & Launch**, or click **Launch** on a draft → **Queued**. (Launching also clears out anything left over from a previous run, which matters if you're relaunching a duplicate.)
- Studies created through **Derive / Optimize risk managers** go straight to **Queued**: they never sit as drafts.
- Fintela starts running it → **Running**.
- Every trial finishes, or a small search space runs out of combinations before reaching your requested trial count → **Completed**. A completed study can legitimately show fewer completed trials than you asked for: that's expected when the space is smaller than your budget, not a problem.
- Something goes wrong that can't be recovered from, or too many trials keep failing → **Failed**.
- You click **Stop** while it's Running → **Stopped** (briefly shown as **Stopping** while the request is processed).
- You click **Resume** on a Completed or Stopped study → back to **Queued**, with more trials added to its budget.
- You click **Delete** → removed from every list you see it in.

> [!WARNING]
> A Failed study can't be resumed: only Completed or Stopped studies can. There's no Paused state and no pause button anywhere in the product; while a study is Running, Stop is your only mid flight control.

Behind a Running study, Fintela works through a sequence of stages: queuing, loading your data, preparing your strategy and your objective, a final compatibility check, the optimization run itself, then robustness, trial family and parameter importance analysis. The last three run after the main search and are secondary: if one of them runs into trouble, your study still finishes and is marked accordingly, and the results you already have remain fully usable. See [Study lifecycle](/docs/study-lifecycle) for how to read progress through these stages, including estimated time to completion and how failures are explained.

### Progress and health

| Figure | What it tells you | Blank when |
|---|---|---|
| Progress | The share of your requested trials that have actually finished, whether they succeeded or not. | You haven't set a trial budget yet, or the study has no results yet. |
| Health | The share of finished trials that produced a usable result, rather than failing outright. | The study has no trials yet. |

Health reads as good at 90% and above, caution between 70% and 90%, and poor below that. Trials skipped for being duplicates or for producing unusable technical artifacts don't count on either side of this ratio: they're excluded outright, not treated as failures.

> [!CAUTION]
> Progress only counts trials that have actually finished (succeeded, failed, or been skipped) not the trials Fintela has already created placeholders for. Because Fintela writes out a whole batch of trials upfront, you may see the raw trial count elsewhere on the page climb faster than Progress does; that's expected. And a Completed study can legitimately sit below 100% progress: that's simply what a finished, exhausted search space looks like. Always trust the Status badge to know whether a study is done, never this figure alone.

Both figures refresh automatically every few seconds while a study is queued or running, and stop updating once it's finished.

### Insights band

A strip above the table summarizes whatever rows are currently visible, so it updates as you search or filter.

| Section | What's in it |
|---|---|
| Overview | Quick tiles: how many studies are visible, the median overfitting estimate (PBO), average progress, median health, and how many portfolios have graduated out of these studies. |
| PBO | A distribution of the overfitting estimate across your visible studies (higher is worse) with markers at **caution** (0.4) and **overfit** (0.6). |
| Verdict | A bar showing how your visible studies split across Robust, Fragile, Overfit and Unknown. |
| Graduated portfolios | Your top three studies by portfolios graduated. |
| Selected | Click a row to see its own tiles for PBO, verdict, progress, health and graduated portfolios, labeled with the study's name and its strategy → fitness pairing. |

When there's nothing to summarize, it simply reads **No insights for this view.**

### Expanding a row

Every row has a **Show details** / **Hide details** toggle. Expanding it draws a map of everything that study touches (the strategy, the fitness function, the asset groups, and any risk managers) organized into lanes so you can see at a glance what's directly attached versus linked indirectly through the study. If there's nothing to show yet, or the map fails to load, the row tells you so.

### Search, filter and sort

- Typing in the search box matches against the study's name, its strategy's name, its fitness function's name, and the username of whoever created it.
- The filter panel lets you narrow by name, strategy, status, author, whether daily updates are on, a range of total trials, or a date range for when the study was created.
- Filtering happens instantly against whatever's already loaded, so switching between List and Card view never leaves you with two different views out of sync.

### Row actions

Click a row (or press Enter or Space) to open its actions menu; right click for the same options as a context menu.

| Action | What it does | When it's unavailable |
|---|---|---|
| **Launch** | Runs a quick compatibility check, shows you the token cost, and starts the study once you confirm. | The study isn't a Draft, a launch is already in progress, or you don't have permission to create or launch studies. |
| **View** | Opens the study's results: ranked trials, charts and exports. | Always available. |
| **Edit** | Opens the builder prefilled with the study's setup. | The study isn't a Draft, or you don't have edit permission. |
| **Duplicate** | Opens the builder prefilled from this study, under a new name: nothing is saved until you do. | You don't have permission to create studies. |
| **Delete** | Confirms, then removes the study. | You don't have delete permission. |

> [!NOTE]
> There's no Stop, Pause or Resume action here in the list. Stop lives on a study's results page, reached through **View**. Resume exists as a capability for Completed or Stopped studies, but there's no button for it anywhere in the product today.

These actions always reflect a study's true, current status: so Launch, for instance, won't stay clickable on a study that actually started running moments ago.

### Bulk actions

Select more than one row and a status bar appears showing how many you've selected, a way to clear the selection, and exactly one bulk action: **Delete**.

> [!CAUTION]
> Deleting multiple studies at once happens immediately, with **no confirmation dialog**: unlike deleting a single study, which does ask you to confirm first. Double check your selection before clicking.

### Confirmation dialogs

| Dialog | When it appears | What it says |
|---|---|---|
| Delete confirmation | Deleting a single study | Asks you to confirm, and warns that any associated data will be deleted too. |
| Token cost | Launching, on a plan with token billing | Shows the full cost, including any memory surcharge: not just a generic per trial estimate. |
| Coverage changed since preview | Launching, when the compatibility check has changed since you last looked | Warns that some tickers will now be excluded, tells you how many tickers will still run, and lets you go back or launch anyway. |
| Not enough tokens | Launching without enough balance | Offers to buy more tokens. |

Confirming the coverage changed dialog locks in the tickers you accepted. If coverage gets worse again between then and the moment your study actually launches, Fintela stops the launch and asks you to review it once more, rather than starting on data you didn't agree to.

> [!WARNING]
> Not having enough tokens is only one of three billing holds that can block a launch, and they aren't the same thing. Insufficient tokens opens the purchase flow. A payment dispute or an exceeded spend cap show as a plain error instead: buying more tokens won't lift either of those; you'll need to resolve them directly. See [Tokens and billing](/docs/tokens-and-billing).

### Feedback messages

| Message | When you'll see it |
|---|---|
| **Study launched** | Your launch succeeded. |
| **Study created** | Your draft saved under the name you typed. |
| **Study created as "[new name]"** | Your draft saved, but under a slightly different name because yours was already taken. |
| **Study updated successfully** | An edit to a draft saved. |
| **Study deleted successfully** | A delete succeeded. |

### Empty states

- No studies at all: **No studies yet**: create your first study to start backtesting strategies.
- Nothing showing because your workspace filter is on: a banner explains you haven't created any studies yourself, that your teammates' studies are still there, and gives you a one click way to show everyone's.

### Permissions

| Role | View | Edit | Create / launch | Delete |
|---|---|---|---|---|
| Owner | yes | yes | yes | yes |
| Admin | yes | yes | yes | yes |
| Manager | yes | yes | yes | no |
| Analyst | yes | no | no | no |

Your role in your organization determines what you can do here: an Analyst, for instance, sees New Study, Launch, Edit, Duplicate and Delete all disabled, and can only look and view results.

## Creation wizard and advanced options

### Anatomy

The builder isn't a multi step wizard: everything lives on one screen, laid out as four blocks side by side, followed by a name field and action buttons:

1. **Asset Group**: the universe of instruments and the date window
2. **Strategy**: the trading logic and its parameters
3. **Fitness**: the objective the search is trying to improve
4. **Optimization**: the trial budget and advanced settings

Below the blocks: a study name field, **Cancel**, and **Continue**. Each block carries a short "why" explanation of what it decides, turns from empty to filled in as you complete it, and shows its own validation errors inline. **Continue** opens a final confirmation dialog (titled **Confirm your study**) which is where **Save Draft** and **Save & Launch** actually happen.

| Mode | Header title | Header subtitle |
|---|---|---|
| Create or duplicate | **New Study** | Select asset groups, a strategy, and a fitness function, then configure and launch. |
| Edit | **Edit Study** | Modify configuration and re save. Only saved (never launched) studies can be edited. |

### Block 1: Asset Group

*Why*: the universe and the period your study will trade and be tested over.

You pick your universe from a searchable list. Its options are grouped in this order:

1. **Written for this universe**: the asset group your selected strategy declares as its own, if it has one.
2. **Asset Groups**: your organization's saved groups, each tagged with its asset class.
3. **Platform sets**: curated collections such as indices, sectors, sector ETFs, countries and industries.

An asset group is required before you can continue.

> [!WARNING]
> A study can only use **one** asset group at a time. Picking a different group replaces the current one: it never adds to it.

Once a group is chosen its name becomes the block's title, with a way to swap it, and the subtitle shows how many instruments were selected.

#### Dates

The date range editor sits under your chosen group.

| Field | Default | What limits it |
|---|---|---|
| Start date | The trailing five years, clamped to the earliest day the group has data for | Must be before the end date. |
| End date | The group's most recent fully covered day | Clamped the same way as the start date. |

This is the whole period the study runs on: split further below into training, validation and out of sample stretches. Because the bounds come from your asset group's own data coverage, you can't pick a date it has no data for.

Under the date fields, a coverage bar shows what share of the group's tickers actually have data through your chosen end date: green at 95% and above, amber at 75% and above, red below that.

#### Date advanced options

An **Advanced options** section inside the Asset Group block lets you fine tune the split.

| Control | What it does |
|---|---|
| Quick fill | Preset date range chips: **Last 1Y / 2Y / 5Y / 10Y** (through the latest data), **After COVID** (starting April 2020, for a post crash regime), and shortcuts to the earliest or latest date any ticker (or every ticker) has data for. |
| Include out of sample period | On by default for a new study. Holds back the last slice of your window and never optimizes on it, so there's one stretch the search hasn't seen: you judge it once, at the end. |
| Train / validation split | A slider (default 70% train) setting how the non out of sample window divides between training and validation. |
| Out of sample size | A slider (default 10%) controlling how much of the window at the end is held back; training and validation shrink proportionally as you grow it. |

A breakdown bar and a small table show exactly what dates each of Train, Validation and (if included) Out of sample cover, and how many days each spans.

As you move these sliders, Fintela works out the exact start and end date for each period automatically and saves them as you go: training runs first, validation follows immediately after with no gap, and (if out of sample is switched on) the final slice at the end is held back entirely from the search.

> [!WARNING]
> There's no walk forward or rolling window option. A study uses a single train / validation / out of sample split of one contiguous window: it doesn't re optimize on a moving basis as time passes.

#### Data compatibility

A read only panel under the date fields checks your strategy, any risk managers, your parameter ranges, and your eligibility rules against the asset group and window you've chosen.

| Element | What it tells you |
|---|---|
| Compatibility level | **Total** (everything works), **Partial**, **Partial (window)**, **Partial (mixed)**, or **Incompatible**. |
| Coverage | How many of your group's tickers are actually runnable. |
| Common window | The date range every included ticker actually has data for. |
| Excluded tickers | Which tickers are being left out, and why: reasons include no data, zero trading volume, a shorter data window than the rest, a listing too late to build up the strategy's required history, or being delisted inside your window. |
| Additional needs | Any extra data requirements your risk managers or fitness function have, and which instruments your strategy explicitly names. |

### Block 2: Strategy

*Why*: what generates the trading positions.

Pick a strategy from a searchable list; this is required before you can continue.

> [!WARNING]
> Changing the strategy **wipes** your parameter configuration and every risk manager you've attached. Pick the strategy before you start tuning anything.

#### Parameter bounds

Every parameter your strategy declares shows up as its own row, integers first, then decimals, then multiple choice settings. Each one has two positions:

| Setting | What it means | What you configure |
|---|---|---|
| **Fixed** | The same value is used on every trial: it isn't searched. | One value (or one choice). |
| **Optimized** | The search varies this parameter across trials. | A minimum and maximum (numeric), or a set of choices for it to try (multiple choice). |

Flipping a parameter between Fixed and Optimized keeps whatever you last typed on the other side, so you can switch back and forth without losing your work.

Each row explains what the parameter does, its type (whole number, decimal, or one of a fixed set of choices), and its current search setting in plain language: for example, "Searched from 10 to 50," "Held fixed at 20: the search will not vary it," or "No range set yet, so the study cannot be submitted." When the number of possible values is countable, it also shows how many points that parameter contributes to the overall search grid.

If a parameter is used as a lookback window, Fintela adds a specific note: its **maximum** value decides how much history the study needs before the start date, so a wide range there can push your effective start date back further than you'd expect.

### Block 3: Fitness

*Why*: what the search is trying to improve.

Pick a fitness function from a searchable list: this is required. If it's a custom function with its own parameters, you'll fill those in here too.

Fitness parameters are constants, not search dimensions: the same value is used on every trial, and the search never varies them. If the function you picked has none, the section simply says so.

> [!NOTE]
> A built in fitness function takes no parameters and no separate asset group of its own: those sections don't appear for it.

If a custom fitness function has no asset group of its own, the builder warns you that your strategy's asset group will be used to evaluate it instead.

### Block 4: Optimization

*Why*: how the search runs, and what it costs.

#### Run configuration

| Field | Default | Notes |
|---|---|---|
| Number of trials | **1000** | How many parameter combinations to try. More trials search more of the space and cost proportionally more tokens. There's no upper limit in the builder. |

If your strategy's parameter grid is small enough to count exactly, the block shows you the exact size of that search space, and (if it's fully enumerable) tells you it will be run as an exhaustive grid search (every combination tried once, no repeats, so the sampler you pick below doesn't apply). If your requested trial budget is larger than the space actually has, you're told the study will simply stop early once every combination has been explored.

Fintela works out how many combinations exist by combining each parameter's own contribution: a fixed value or a single choice contributes one option; a set of choices contributes however many you selected; an integer range contributes one option per whole number in the range; and a decimal range contributes one option per step if you've set a decimal precision for it: otherwise it's treated as effectively continuous, unless its minimum and maximum are the same value.

> [!TIP]
> The count shown here in the builder only reflects your strategy's own parameters. The true search space Fintela uses also multiplies in any risk manager parameters you've attached, so the real total can be larger than what's previewed.

#### Optimization advanced options

An **Advanced options** section holds everything else, grouped into five parts. It opens automatically if the study already has risk managers attached.

**1: Optimization objective**

A **Maximize** / **Minimize** choice, defaulting to whichever direction your fitness function's own metric naturally improves in.

> [!WARNING]
> Leaving this unset doesn't mean "maximize": it means Fintela uses the fitness function's own natural direction. Many built in metrics are naturally "higher is better," but some (like drawdown) are naturally "lower is better." Once you launch, the direction is locked in for that study; duplicate it if you want to try the other direction.

**2: Benchmark**

Choose **Auto** (Fintela picks one appropriate benchmark per asset group you selected), **No benchmark**, or pick a specific instrument from the catalog. This is what benchmark relative [metrics](/docs/metrics-reference) (alpha, beta, information ratio, capture) are measured against. Choosing **No benchmark** turns those metrics off for the study; it isn't silently treated as Auto later.

> [!NOTE]
> A benchmark chosen here is only used to compute these metrics: it isn't a data series your strategy's own logic can read. To read a benchmark's price series inside your strategy, add it as a data source in the strategy editor instead.

**3: Optimization engine**

| Field | Default | What it does |
|---|---|---|
| Sampler | **TPE** | The search method the optimizer uses to pick the next parameter combination to try. |
| Grid precision | Continuous | How many decimal places the search grid uses for decimal parameters. Leave it empty for a continuous (unrestricted) search. |
| Stop early if health drops below threshold | On, at a 30% failure threshold | Ends the study early once too many trials are failing, rather than paying for a run that can't produce useful results. It only starts watching after the first ten trials have finished. |
| Recalculate daily after market data arrives | Off | Keeps the study's results current as new market data comes in each day. Availability depends on your plan. |

Fintela offers seven samplers:

| Sampler | Runs in parallel? | Typical trial budget |
|---|---|---|
| TPE (Tree structured Parzen Estimator) | yes | 100 to 1,000 |
| CMA-ES (Covariance Matrix Adaptation) | yes | 1,000 to 10,000 |
| Random | yes | N/A |
| QMC (Quasi Monte Carlo) | yes | N/A |
| NSGA-II (Genetic Algorithm) | yes | 100 to 10,000 |
| Quantum Optimization (emulated) | no | 50 to 500 |
| Quantum Kernel Bayesian Optimization (emulated) | no | 30 to 300 |

See [Sampler selection](/docs/sampler-selection) for guidance on which to pick and why, including the speed versus quality tradeoff and why the sampler becomes a no op once your search space is small enough to enumerate outright.

**4: Eligibility rules**

These rules decide which tickers are allowed to trade in your study, shown as preset options (**Runnable subset**, **Full cluster**, **Strict**, or **Custom** if your own combination matches none of those) plus individual toggles:

| Rule | Default | What it does |
|---|---|---|
| No price data in window | Always on | A hard requirement: the strategy needs price data to run at all. |
| Insufficient warmup history | On | Excludes tickers that don't have enough history before your start date. Turning it off keeps late listing tickers in, but they only contribute once they've built up enough history. |
| Listed after the study start | Off | Excludes tickers that started trading after your study's start date. |
| Delisted, or data ends before the window end | Off | Excludes tickers that stopped trading during your window. Keeping them in avoids survivorship bias. |
| Below minimum coverage | Off | Excludes tickers present for less than a minimum share of the window's trading days: turning this on reveals a minimum coverage percentage field, defaulting to 90%. |

Each rule shows you its live impact: how many tickers it removes, or would remove if you turned it on. One more switch, **Require every ticker eligible**, blocks the launch entirely if any active rule would exclude even one ticker.

**5: Risk Managers**

Attaching risk managers here is optional: it lets the optimizer tune their thresholds alongside your strategy's own parameters, and the same selection applies to every study you create from this setup.

Each backtest step runs in a fixed order: any attached risk managers halt or close positions first, then sell, then buy, and only then does the strategy's own rebalance run. Within the same step, ties between risk managers break by the order you've arranged them in.

| Control | What it does |
|---|---|
| **Add risk manager** | Opens a picker grouped into built in options and your own registered ones (rule based, custom code, or connected externally). |
| **Preview stack** | Runs one representative backtest using mid range parameter values with your full risk manager stack applied in order, without saving anything: useful for a quick sanity check before you commit. |
| Attachment card | Shows how each risk manager is set up, lets you reorder or remove it, and shows which of its parameters are being optimized versus held fixed. |
| Re entry policy | Lets you hold a ticker out of trading for a set number of days after a risk manager closes it, so the strategy doesn't immediately re enter the same name. |

Some risk manager parameters are automatically filled in from a ticker's own metadata at run time, so you won't see a field for them here.

### External strategy reminder

If your chosen strategy runs on your own systems rather than inside Fintela, the builder adds a reminder:

> [!WARNING]
> Every ticker your strategy's endpoint returns must also exist in the selected asset group. A signal for a ticker outside that group will fail those trials. Tip: use **Validate** in the strategy editor to check your endpoint's tickers against the asset group before you launch.

### Action bar

| Element | What it does |
|---|---|
| Study name | Required before you can save. If it's blank, you'll be asked to name it; if it's already taken, you'll be warned it will be saved under a slightly different name. |
| Issue counter | Shows while the form has unresolved problems; hovering lists every one of them. |
| Launch gate warning | Appears when your setup is otherwise valid but the compatibility check would block a launch. |
| **Cancel** | Returns to the list without saving. |
| **Continue** | Opens the confirmation dialog. Disabled while the form is invalid or a save is already in progress: but never blocked by the compatibility check itself, since saving as a draft is always allowed. |

The name field defaults to a combination of your strategy and asset group names, and keeps updating as you change either: until you type a name of your own. It doesn't need to be unique; if it's already taken, a number is added automatically.

### Validation messages

The builder checks your setup continuously as you fill it in, block by block:

| Block | What it checks for |
|---|---|
| Asset Group | That you've picked a group, and that its date range and train/validation split are complete, in order, and don't overlap. |
| Strategy | That you've picked a strategy, and that every parameter is fully configured: bounds set for anything you're optimizing, a valid value for anything fixed, and valid choices for multiple choice parameters. |
| Fitness | That you've picked a fitness function (with a reminder if you haven't given a custom one its own asset group). |
| Optimization | That you've picked a sampler, that your trial count is greater than zero, and that grid precision (if set) is a whole number of decimals between 0 and 12: plus a heads up if your search space is smaller than the trials you've requested. |
| Name | That you've given the study a name. |

### Confirm dialog

Titled **Confirm your study**: save it as a draft to launch later, or save and launch right away. This is where both actions actually happen.

It recaps your setup (name, asset group, strategy, fitness function, trial count, date range, and whether out of sample is included) followed by a cost breakdown: the base cost for your requested trials, any extra charge for a larger machine if your study needs more memory, the total, and your current token balance. You're only charged when the study actually launches, and whatever it doesn't use is refunded automatically once it finishes.

Depending on your setup, you may also see:

- A note that your study needs more memory than the standard machine, because of how many assets it loads, how long a date range it covers, or how memory heavy the strategy is: with the extra charge covering exactly what the larger machine costs, nothing more.
- A note that your strategy's memory needs have never been measured, so you're being charged the standard rate for now: re saving the strategy lets Fintela measure it properly.
- A warning that your study needs so much memory it has to run with fewer things happening in parallel, so it will take noticeably longer than usual: you'll need to acknowledge this before you can launch.
- A warning that your study may need more memory than Fintela's largest available machine: it will still try, but a smaller asset group or a shorter date range would help.
- A message that you don't have enough tokens for this study.
- A warning if one of your data sources has no data at all for part of your window (either at the very start, or anywhere inside it) which would mean some trials produce no positions.

> [!NOTE]
> **Save Draft** is never blocked by the compatibility check or by cost. **Save & Launch** is disabled while saving is in progress, while the compatibility check is blocking, when you can't afford the study, or when a longer runtime warning hasn't been acknowledged.

The compatibility check actually blocks a launch (not just warns) when your setup is genuinely incompatible with your data: a data source with no overlap at all with your window, a risk manager with data needs that can't be met, or **Require every ticker eligible** being on while some ticker would still be excluded.

### Why saving or launching might be rejected

Even after the builder's own checks pass, Fintela runs a final check when you actually save or launch. The most common reasons a study gets rejected at that point:

- You don't have permission to create studies in your organization.
- A numeric setting (like grid precision or the minimum coverage percentage) falls outside its valid range (grid precision must be a whole number of decimals from 0 to 12; minimum coverage must be between 0% and 100%).
- Your plan's studies limit has been reached, and you'll see the plan limit dialog before you can save another.
- The fitness function or strategy you picked was deleted, or your access to it changed, since you opened the builder: you'll see a clear message and be asked to pick again.
- A parameter you configured doesn't actually match what the strategy declares (the builder validates this as you go, so this should rarely surface only at save time).
- You started customizing a fitness function's parameters or asset group, then switched to a built in objective: those settings are cleared, since built in objectives don't accept them.
- The asset group behind your strategy, or behind your custom fitness function, no longer exists.
- Fintela needs a moment to work out how much history your study needs before its start date; if that check can't complete right away, you'll be asked to try again shortly.
- If your plan caps the number of trials per study, a larger number you typed is quietly reduced to that limit: the builder doesn't show this cap upfront, so don't be surprised if a launched study ran fewer trials than you requested.
- When you launch a study whose parameter search space is smaller than your requested trial budget, the trial count is automatically capped to fit that space.

Once a study has been launched, its setup is locked: you can't edit it (only duplicate it and adjust the copy), and you can't launch it a second time.

If your connection drops for a moment while you're saving or launching, retrying is safe: Fintela won't create a duplicate study from the same attempt.

### Fields the study form does not have

Worth calling out explicitly, since they're commonly assumed to exist:

| You might expect… | Reality |
|---|---|
| Walk forward or rolling re optimization | Doesn't exist. A study uses one train / validation / out of sample split of one window. |
| A pruner setting | Doesn't exist anywhere in the builder. |
| A random seed | Doesn't exist. You can't pin a study to a fixed random seed for reproducibility. |
| Parallelism / worker count | Not something you configure: Fintela sizes this automatically based on what your study needs. See Execution modes below for how internal and external studies differ here. |
| Multi objective configuration | Doesn't exist. A study has exactly one objective and one direction; NSGA-II is offered as a single objective sampler here, not a multiobjective one. |
| Initial capital | Belongs to the strategy and the backtest engine, not to the study. |
| Commissions, slippage, fees | Belong to the backtest engine, not to the study. |
| Rebalance frequency | Belongs to the strategy, not to the study. |
| A visible trial cap | The builder shows no ceiling; any plan cap is applied automatically and silently when you launch. |

## Execution modes

A study doesn't have its own execution mode setting: it simply inherits one from the strategy and fitness function you picked. If either one is set up to run on your own external server, the study is considered **external** for that piece; if both are Fintela's own built in Python logic, it's **internal**. Mixing an internal strategy with an external fitness function (or the reverse) is fully supported and common.

### Internal

Both your strategy's logic and your fitness function's scoring run inside Fintela. Fintela automatically spreads the work across multiple parallel runs depending on your plan and the size of the job, and sizes the machine used to how much memory your strategy actually needs: which is exactly what drives the memory surcharge and "this will take longer" warnings you might see in the launch confirmation dialog.

### External

As soon as any part of a study (the strategy, the fitness function, or both) runs on your own server instead of inside Fintela, the whole study becomes external. Because Fintela then has to wait on your server's responses rather than computing anything itself, an external study runs as a single continuous process rather than being split into parallel runs, and how many requests it sends your server at once is governed entirely by the concurrency limit you've declared for your strategy or fitness function.

- If only your strategy is external, Fintela paces itself to your strategy's own concurrency limit.
- If only your fitness function is external, it paces itself to the fitness function's limit instead.
- If both are external but point at different endpoints, Fintela uses whichever of the two limits is lower.
- If both are external and point at the very same endpoint, Fintela is even more conservative, to avoid overwhelming a single server handling both jobs at once.
- If you didn't set a concurrency limit (or set an invalid one) on an external strategy or fitness function, Fintela falls back to a safe default and lets you know.

This single process design is deliberate: it guarantees your server never sees more in flight requests than the limit you configured, and it keeps the search coordinated. External studies also run on a lighter machine tier than internal ones, since they spend most of their time waiting on your server rather than computing.

See [External strategies](/docs/external-strategies), [External fitness](/docs/external-fitness) and [Execution modes](/docs/execution-modes) for more on how to connect your own logic.

> [!WARNING]
> Every ticker your external strategy's endpoint returns must also exist in the study's asset group. A signal for a ticker outside the group fails that trial.

### Where External does not apply

- **The study itself has no External setting.** There's no such field anywhere in the builder or the registry: you can't host a study externally, only the strategy or fitness function feeding into it.
- **Asset groups are always Fintela's own data.** There's no such thing as an external asset group.
- **Risk managers can be external too**, but that doesn't change how the study itself runs: only your strategy's and your fitness function's setup matter for that.
- **Eligibility rules, the compatibility check, and the frozen snapshot taken at launch** are always computed inside Fintela, no matter which mode the study runs in.

### Two samplers that don't run in parallel

The two quantum inspired samplers (Quantum Optimization and Quantum Kernel Bayesian Optimization) always run as a single continuous process rather than in parallel, regardless of everything above. Both also skip the automatic switch to an exhaustive grid search that other samplers get once a search space is small enough to fully enumerate.
