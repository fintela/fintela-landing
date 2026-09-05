---
title: Quickstart
section: Getting Started
sectionOrder: 1
order: 5
published: true
updated: 2026-09-01
summary: From a blank account to your first optimization results, step by step.
keywords: quickstart, tutorial, first study, getting started, first strategy, first results, first run
---

This is the fastest way to see Fintela do real work for you: build a universe of tickers, write one
small trading strategy, pair both with a built in scoring function, run a twenty trial optimization,
and read what came out the other side. Every step below tells you exactly which screen to open, which
control to use and what to type, and the strategy code is complete and ready to paste in as is.

## What you will build

You will create three building blocks, in this order, and pair them with a fourth you simply pick from
a list: `sharpe_ratio` is a built in scoring function that's already there for you to choose. All four
live as reusable entries in your [registry](/docs/registries), so once you've built them here, they're
available for every future study too.

```text
  Asset Group            Strategy              Fitness (built-in)
  12 US tickers        momentum_top_n              sharpe_ratio
  the universe        the signal rule            the objective
       └────────────────────┴──────────────────────────┘
                            ▼
                          Study
          20 trials · finite grid · 5-year window split
                  train / validation / OOS
                            ▼
                   up to 20 portfolios
              ranked on the Portfolios Dashboard
```

## Before you start

| Requirement | Where it is covered |
|---|---|
| A signed in account inside an organization | [Account setup](/docs/account-setup) |
| A role that can create a study: Owner, Admin or Manager. An **Analyst** may create asset groups and strategies but sees **New Study** and **Launch** disabled | [Studies](/docs/studies) |
| A nonzero Fintela Token balance. Launching a study is prepaid; creating a draft is not | [Tokens & billing](/docs/tokens-and-billing) |
| Free plan room: this tutorial uses one of your asset group slots, one strategy slot and one study slot | [Tokens & billing](/docs/tokens-and-billing) |

Terms you will meet along the way are defined in [core concepts](/docs/core-concepts). You do not
need to read it first, but come back to it before your second study.

> [!NOTE]
> Nothing here needs a market data feed, a risk manager or a connection to strategy code running
> outside Fintela. Those are all optional layers you can add later: a study built on the bare
> signal is the right first experiment.

## Step 1: Create an asset group

An [asset group](/docs/asset-groups) is a frozen list of instruments. It carries **no dates**: the
date window belongs to the study.

### Open the builder

In the sidebar, under **Registry**, click **Asset Groups**, then **New Asset Group**. The header
reads **Create Asset Group** / *Define a new asset group by selecting tickers and filters*.

### Pick the instruments

Leave the exchange selector on **US**, its default. Ignore the three filter strips
(**Classification**, **Size & Value**, **Performance**) for now; you are going to name the
instruments directly.

In the search box (placeholder **Ticker or name…**), type each code below and click the matching
row, or its checkbox, to add it to the selection rail on the right. The rail header counts up as
**{{count}} selected**.

```text
AAPL  MSFT  NVDA  AMZN  GOOGL  META
JPM   JNJ   XOM   PG    KO     WMT
```

Twelve large, liquid US names keep the run fast and the price history deep. Any dozen tickers will
do. The tutorial does not depend on these.

> [!WARNING]
> As soon as anything is selected, a chip under the screener states the rule: **An Asset Group saves
> a fixed ticker list; filters are not reevaluated later.** The screener is a selection tool.
> Nothing about the exchange, the filters or the sort is stored, and a selected ticker is never
> pruned by a later filter change.

### Name and save the group

Click **Create asset group**. It stays disabled until at least one instrument is selected, with the
caption **Select at least one ticker or portfolio group**.

A dialog titled **Confirm Action** opens (it is the only place an asset group is named), carrying
the line *Name your asset group to create it.*

| Field | Value to type |
|---|---|
| **Name** | `Quickstart US large caps` |
| **Description** | `Twelve large cap US names for the quickstart.` |

Both fields are required; **Confirm** stays disabled until both are filled. Press **Confirm**.

## Step 2: Create the strategy

A [strategy](/docs/strategies) is one top level Python function that returns a signal: date →
ticker → `{position, allocation}`.

### Open the editor

Sidebar → **Registry** → **Strategies** → **New Strategy**. The header reads **Create Strategy** /
*Define a new strategy implementation*. Leave the header's segmented control on **Internal**, its
default. **Internal** and **External** can only be chosen when you first create a strategy (you can
never switch an existing strategy between them later), and the third option, **Rule based**, is
permanently disabled (*Rule based strategies are coming soon.*).

### Replace the template code

The Python editor is prefilled with a scaffold. Select all of it and paste this in its place:

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

Why this passes validation, line by line:

| Rule | How the code satisfies it |
|---|---|
| The entry point is found **by signature**: the first function whose parameters are a superset of `data`, `start_date`, `end_date` | Those three come first, then the two declared parameters |
| Date keys must be `YYYY-MM-DD` strings | `ts.strftime("%Y-%m-%d")`: a `pd.Timestamp` key is rejected |
| `position` is `"L"` or `"S"`; `allocation` is finite and in `(0, 1]` | `w = 1.0 / n` over a nonempty list |
| Allocations on one date sum to at most `1.0` | `n` equal weights sum to exactly 1.0; the residual would be held as cash |
| No look ahead: the strategy is run over a short window and a long one, and the save is rejected if a past signal changes | Every date reads `data.loc[:ts]` only |

### Set the test values

Pasting the code populates the **Parameters** panel automatically: editing the Python signature
adds, removes and renames parameter rows for you. You get two rows, both typed **Integer**, both
with an empty **Test value**. Fill them in:

| Parameter name | Type | Test value |
|---|---|---|
| `lookback` | **Integer** | `60` |
| `top_n` | **Integer** | `10` |

> [!CAUTION]
> **A test value is not a default.** It is the single concrete value your code is executed with
> during validation. The optimizer never reads it. Pick something from the middle of the range you
> intend to sweep, or validation proves the wrong thing.

### Watch the validation chip

Until both test values exist, the chip beside the editor toolbar reads **Set test values to
validate**. Once they are set, live validation fires on a short debounce against a reduced ticker
sample: the chip moves to **Validating…** and then to **Valid**. If it lands on **Validation error**
or **Error on line N**, click it to jump to the offending line.

Leave the rail's **Advanced options → Lookback** section alone. It is **Auto synced**, meaning
Fintela generated a `required_lookback` function from your parameters:

```python
def required_lookback(lookback, top_n):
    return max(lookback, top_n)
```

That is how much price history is loaded *before* the study's start date so your indicators are warm
on day one. The study reevaluates it at each parameter's **maximum** to confirm the asset group has
enough history.

### Name and save the strategy

Click **Create strategy**. The **Confirm Action** dialog opens with *Name your strategy to create
it.* It is the only place a strategy is named.

| Field | Value |
|---|---|
| **Name** | already `momentum_top_n`, pasting the code parsed the `def` and filled it in |
| **Description** | type `Hold the strongest N names by trailing return.` |

The Name helper reads *Lowercase identifier, also the Python function name.* Editing the name
lowercases it, replaces spaces with `_` and **renames the Python entry point in your code** to
match: Fintela won't save a strategy whose function name doesn't match its registry name. Leave it
as it arrived and nothing is rewritten. Description is required too; **Confirm** stays disabled
until both fields are filled. Press **Confirm**.

## Step 3: Configure the study

Sidebar → **Registry** → **Studies** → **New Study**. The header reads **New Study** / *Select asset
groups, a strategy, and a fitness function, then configure and launch.*

This is **not a step by step wizard**. It is one screen with four blocks, an action bar and a final
confirmation dialog that both saves and launches the study.

```text
  ┌─────────────┬─────────────┬─────────────┬──────────────┐
  │ Asset Group │  Strategy   │   Fitness   │ Optimization │
  └─────────────┴─────────────┴─────────────┴──────────────┘
             ↓ Study name  ·  Cancel  ·  Continue
```

### Block 1: Asset Group

Open **Select asset group** and pick **Quickstart US large caps** from the **Asset Groups** option
group. (The list also offers **Platform sets (indices, sectors, ETFs)**, picking one builds a
ready made group for you on the spot, which is how you can skip Step 1 entirely on a later study.)

Leave **Start date** and **End date** as they arrive: the builder preselects the trailing **5
years**, clamped to the group's own data coverage. Leave the **Advanced options** accordion closed
too. Its defaults are what you want for a first run:

| Setting | Default | Result |
|---|---|---|
| **Include out of sample period** | on | The last slice is held back and never optimized on |
| **Train / validation split** | 70 % train of the non OOS window | N/A |
| **OOS size** | 10 % | N/A |
| **Period breakdown** | N/A | **Train 63 %** · **Validation 27 %** · **OOS 10 %** of the whole window |

Under the dates sits a read only **Data compatibility** panel: a tier chip (**Total** · **Partial** ·
**Partial (window)** · **Partial (mixed)** · **Incompatible**) and a line reading **{{covered}} of
{{total}} tickers runnable**. For a study like this one (no data sources, no risk managers, strict
mode off), anything short of **Incompatible** launches. A **Partial** tier only means some tickers
are dropped from the universe, and the confirm dialog lists them under **Excluded**.

> [!WARNING]
> **Exactly one asset group per study.** Picking a different group replaces the current one; it
> never appends. There is also **no walk forward or rolling window option**: a study is a single
> train / validation / out of sample partition of one contiguous window.

### Block 2: Strategy

Open **Select strategy** and pick `momentum_top_n`. The **Parameters** section appears with one row
per declared parameter, integers first. Each row has a **Fixed** / **Optimized** segmented control;
both rows start on **Optimized** with empty **min** and **max** fields.

| Parameter | Control | min | max |
|---|---|---|---|
| `lookback` | **Optimized** | `20` | `120` |
| `top_n` | **Optimized** | `5` | `15` |

Flip a row to **Fixed** if you want to pin a parameter instead of searching it: the field becomes a
single **value** box and that dimension drops out of the search.

> [!WARNING]
> Changing the strategy **wipes** the parameter configuration and any attached risk managers. Pick
> the strategy before you tune anything.

### Block 3: Fitness

Open **Select fitness function** and pick **`sharpe_ratio`**, a platform seeded built in whose
author shows as `platform`. It scores each simulated window by excess return per unit of total risk,
and its natural direction is higher is better.

A built in objective shows **no** parameter section and needs **no** fitness asset group; trying to
add either is rejected outright. Nothing else to do in this block.

### Block 4: Optimization

Under **Run Configuration**, set the one visible field:

| Field | Default | Value to type |
|---|---|---|
| **Number of trials** | `1000` | `20` |

As soon as both parameter ranges are set, the block adds derived feedback. Because both parameters
are integers, the search space is **finite**, and 101 × 11 gives:

- **Search space: 1,111 combinations**
- **Finite grid (1,111 combinations): configurations are enumerated as a grid search, each tried at
  most once, no repeats, so the sampler below isn't applied.**

That second line is the important one. On a finite grid at or below one million combinations the
optimizer enumerates the grid without replacement instead of running the sampler, so your 20 trials
are 20 *distinct* configurations drawn from the shuffled grid. The **Sampler** setting still reads
**TPE** and is still stored, it simply does not drive this particular run. See
[sampler selection](/docs/sampler-selection) for when it does.

Leave the **Advanced options** accordion closed. For the record, this is what you are accepting:

| Setting | Default for this run |
|---|---|
| **Optimization objective** | `NOT_SET`, displayed as **Maximize**, because `sharpe_ratio` is higher is better |
| **Benchmark** | **Auto: one per asset group** |
| **Sampler** | **TPE** |
| **Grid precision (decimals)** | empty (continuous, irrelevant here, both parameters are integers) |
| **Stop early if health drops below threshold** | on, **Failure threshold: 30 %** |
| **Recalculate daily after market data arrives** | off |
| **Eligibility rules** | **Insufficient warmup history** on; the other three off; **Require every ticker eligible** off |
| **Risk Managers** | none attached |

> [!NOTE]
> `NOT_SET` is not a synonym for "maximize". It means *inherit the objective's own natural
> direction*, so a lower is better built in objective such as `max_drawdown` would minimize under the same
> default. The direction is frozen once the study launches.

### Name it and continue

The action bar carries a **Study name** field, prefilled with `momentum_top_n · Quickstart US large
caps` and recomputed as you change the strategy or the group until you type your own. Keep it or
replace it: names do not have to be unique; a collision is automatically suffixed and the toast tells you
what the study was actually saved as.

If the bar shows **{{count}} issues to resolve**, hover it for the full list. Otherwise click
**Continue**.

## Step 4: Launch it

The **Confirm your study** dialog opens: *Save it as a draft to launch later, or save and launch
now.* Check the recap rows: **Study name**, **Asset group**, **Strategy**, **Fitness**, **Trials**,
**Data range** and **Out of sample** (which should read **Included**).

Below the recap, a **Cost** block prices the run:

| Row | Meaning |
|---|---|
| **Optimization (20 trials)** | The base token charge |
| **Total** | What you will be charged |
| **Your balance** | Your organization's current balance |

with the note **Charged when the study launches. Whatever it doesn't use is refunded automatically
when it finishes.** While the quote resolves it reads **Calculating cost…**.

Click **Save & Launch**. Your study is saved and queued to run right away, and you are returned to
the registry with a **1 study created** toast, or **Study created as "…"** if Fintela had to rename
it.

> [!TIP]
> **Save Draft** writes the same study without launching it and without charging tokens. A draft
> shows as **Draft** in the registry and can still be edited; once launched, a study is immutable
> and the only way to change anything is **Duplicate**.

Watch the row you just created. Its **Status** badge moves **Queued** → **Running** → **Completed**,
and the **Progress** and **Health** meters refresh every five seconds while anything is active.

| Column | What it means |
|---|---|
| **Progress** | Trials in a *terminal* state over the trial budget. Tooltip: **Completed trials over the total requested.** |
| **Health** | Share of trials that produced a usable result. Bands: ≥ 0.9 good, ≥ 0.7 caution, below that poor |

> [!CAUTION]
> A completed study can legitimately sit below 100 % progress: that is what an exhausted finite
> grid looks like. **Completion is signalled by the status badge, never by progress reaching 100 %.**

There is no Stop, Pause or Resume action in this registry view, and no **Paused** state anywhere in
the product. The **Stop** button lives on the study's own
[Optimization Dashboard](/docs/optimization-dashboard). [Study lifecycle](/docs/study-lifecycle)
covers every state a study can be in, the stages a run moves through and what a failure diagnostic
tells you.

## Step 5: Read the results

Click the study row to open its actions popover, then **View**. That takes you to the
[Portfolios Dashboard](/docs/portfolios-dashboard) with your study already selected.

### Rank the trials

The filter bar arrives configured for a first look:

| Control | Value on arrival |
|---|---|
| **Metric** | `fitness`, the objective value each trial scored |
| **Study** | your study |
| **Top N** | `10` |
| **Rank by** | **Overall** |

The **Portfolio Ranking** carousel on the left lists one card per trial. Each is labelled with its
trial number and the study's name, and carries its rank, its ranked value, an equity sparkline and
headline **Sharpe**, **Alpha** and **Beta**. Every card starts checked, so all ten curves are
overlaid on the combined equity chart beside it. Uncheck cards to isolate a comparison.

Now change **Rank by** from **Overall** to **Train**, then to **Val**, then to **OOS**. A parameter
set that leads on Train and collapses on OOS is the whole reason the window is split three ways.

### Open one candidate

Click a card. The **Portfolio Analysis** tab reveals itself, carrying that trial's own six detail
views: Performance, Holdings, Transactions, Risk Analytics, Robustness and Profile, documented in
[portfolio detail](/docs/portfolio-detail). Every number on those screens is defined in the
[metrics reference](/docs/metrics-reference), and every chart in
[visualizations](/docs/visualizations).

### Ask whether the winner is real

Switch the section tab to **Optimization Dashboard**. Four subviews sit under it: **Overview**,
**Robustness**, **Families** and **Parameters**. **Overview**
carries the run configuration, a **Best trial** card, a **Robustness & Overfitting** verdict and a
**Hyperparameter Importances** panel telling you which knob actually moved the objective. With only
twenty trials over a 1,111-point grid, treat every verdict as provisional: that is the honest
reading, and it is exactly why the next study should have a bigger budget.

## If something goes wrong

| Symptom | What it is |
|---|---|
| **Save & Launch** is disabled | The compatibility gate blocks the launch, or the cost exceeds your balance (**You don't have enough tokens for this study.**), or a very large study is waiting on your explicit confirmation via the **I understand this study will take longer** checkbox. **Save Draft** is never gated by any of them |
| The action bar shows **This strategy can't run on the selected data: resolve the compatibility issues below.** | The compatibility report came back incompatible for this group and window. Hover for the reasons; widening the start date or picking a different group usually clears it |
| Pressing **New Study** opens **You've reached your plan limit** | You are at the studies quota. Delete one to make room. See [tokens & billing](/docs/tokens-and-billing) |
| The study ran fewer trials than you asked for | Your plan may silently cap the number of trials actually run to a per study ceiling; there's no warning in the builder and no onscreen notice when it happens. Twenty trials is comfortably below that ceiling on every plan |
| The status badge reads **Failed** | Open the study's [Optimization Dashboard](/docs/optimization-dashboard) and read the failure notice. **Failed** is **not** resumable: duplicate the study and relaunch |
| A completed study carries a warning about secondary analysis | Robustness, families and importances are *secondary* stages. A failure there leaves the results usable; it is not a failed study |

## What you just built

| Object | Reusable as |
|---|---|
| `Quickstart US large caps` | The universe for any future study, or a second study's fitness universe |
| `momentum_top_n` | A strategy any number of studies can optimize, pinned per launch to the version it ran with |
| The study | A launched, immutable run. **Duplicate** it to start the next experiment with everything preseeded |
| Up to 20 portfolios | One per successful trial, candidates you can promote into [promoted portfolios](/docs/promoted-portfolios) and collect into a [portfolio group](/docs/portfolio-groups) |

## Where to go next

| Page | Why |
|---|---|
| [End to end workflow](/docs/end-to-end-workflow) | The same path taken all the way to a deployed portfolio group |
| [Studies](/docs/studies) | Every field on the study canvas, the row actions and how a study is validated before it launches |
| [Strategies](/docs/strategies) | The full function contract, the data available to your code, the curated library list and how your code runs safely inside Fintela |
| [Fitness functions](/docs/fitness-functions) | The 26 built in objectives and how to write your own |
| [Risk managers](/docs/risk-managers) | Stops, caps and halts the optimizer can tune alongside your parameters |
| [Sampler selection](/docs/sampler-selection) | When the sampler matters, and which one to pick |
| [Analyzing results](/docs/analyzing-results) | Reading a study's output properly, including overfitting |
| [Execution modes](/docs/execution-modes) | Running your own strategy or fitness code on your own systems instead |
| [API overview](/docs/api-overview) | Pulling your studies, portfolios and results into your own tools over the read only Developer API |
