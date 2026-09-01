---
title: End-to-end workflow
section: Workflows
sectionOrder: 5
order: 1
published: true
updated: 2026-09-01
summary: The full workflow in order — build a universe, write a strategy, optimize it, pick a winner, and put it live.
keywords: workflow, lifecycle, end to end, asset group, strategy, study, optimize, promote, deploy, paper trading, live trading
---

Fintela takes you through one path, start to finish: pick the universe of instruments you want to trade, write the logic that decides what to buy and sell, choose the number that defines "better," optionally add guard rails, sweep across many parameter combinations, review what comes out, keep the configurations worth keeping, group them into a book, and connect that book to a broker. This page walks that path in the order you actually follow it — naming the screen, the button and the decision at each step — then points you to the page that covers that step in full. Treat it as a map, not a replacement for the [registries](/docs/registries) overview.

## The lifecycle at a glance

```text
  REGISTRY — build once, reuse forever
  1  Asset Group        the universe you're allowed to trade
  2  Strategy           the logic that decides what to hold
  3  Fitness Function    the number that defines "better"
  4  Risk Managers        guard rails (optional)
          │
          ▼
  5  Study              one search → many candidate portfolios

  ANALYSIS
  6  Candidates         rank and compare the results
  7  Promote            turn a winner into a permanent portfolio

  TRADING
  8  Portfolio Group    combine portfolios into one book
  9  Operation          connect that book to a broker — paper or live

     Not happy with what came out of stage 6? Duplicate the study
     with narrower ranges and go back to stage 5.
```

Every stage but one leaves you with something you can reuse later — stage 6 is pure review and doesn't create anything new. You build the library once and recombine it as often as you like.

| # | Stage | Where in the app | What it creates | Full reference |
|---|---|---|---|---|
| 1 | Define your universe | Registry → **Asset Groups** | An asset group | [Asset groups](/docs/asset-groups) |
| 2 | Write your signal | Registry → **Strategies** | A strategy (with versions) | [Strategies](/docs/strategies) |
| 3 | Choose your objective | More Options → **Fitness Functions** | A fitness function | [Fitness functions](/docs/fitness-functions) |
| 4 | Add guard rails | More Options → **Risk Managers** | A risk manager | [Risk managers](/docs/risk-managers) |
| 5 | Search for the best parameters | Registry → **Studies** | A study, with many candidate portfolios | [Studies](/docs/studies) |
| 6 | Review the results | Analysis → **Portfolios** | Nothing saved — this is where you review | [Optimization dashboard](/docs/optimization-dashboard) |
| 7 | Keep a winner | Analysis → **Portfolios** | A promoted portfolio | [Promoted portfolios](/docs/promoted-portfolios) |
| 8 | Build a book | Registry → **Portfolio Groups** | A portfolio group | [Portfolio groups](/docs/portfolio-groups) |
| 9 | Trade it | Portfolio Groups or Portfolio Manager | An operation | [Live trading](/docs/live-trading) |

> [!NOTE] Where to find these in the sidebar
> Asset Groups, Strategies, Studies and Portfolio Groups live in the sidebar's **Registry** section. Fitness Functions, Risk Managers and Promoted Portfolios sit behind the **More Options** flyout underneath it. Portfolios and Portfolio Manager are in the **Analysis** section. See [navigation](/docs/navigation) for the full map of the sidebar.

## Before you begin

Nothing has to be set up before stage 1. Three things become relevant later, and it's worth knowing about them now rather than running into them at stage 9.

| Thing | When it matters | Notes |
|---|---|---|
| Token balance | Stage 5 — launching a study spends tokens | Launching a study reserves tokens up front for the number of trials it might run, and refunds whatever it doesn't use once it finishes. See [tokens and billing](/docs/tokens-and-billing) |
| Free-tier creation limits | Stages 1–5, 7 and 8 | Every registry limits how many *new* items you can create — viewing, editing, deleting or stopping something you already have is never limited. Strategies, Studies, Fitness Functions and Asset Groups show a used/limit counter right on screen; Risk Managers shows a headroom bar; Portfolio Groups and Promoted Portfolios enforce the same kind of limit even though they don't display a counter. See [registries](/docs/registries) |
| A broker connection | Stage 9 only | Add one under **Account settings → Broker connections** whenever you're ready to trade — nothing before stage 9 needs it. See [account setup](/docs/account-setup) |

> [!WARNING] Choose Internal at stage 2 if you plan to trade this strategy
> A strategy you host and run yourself (an **External** strategy) can be studied and analyzed like any other, but it can never be promoted — which means it can never join a portfolio group and can never reach a broker. If you want a strategy you can eventually trade live through Fintela, write it as an **Internal** strategy. External strategies are for research and comparison. See [execution modes](/docs/execution-modes).

## 1. Freeze the universe — Asset Group

**Registry → Asset Groups → New Asset Group**

An asset group is the fixed list of instruments a study is allowed to trade. You build it using a screener that filters the whole market by classification, size, value and performance — but only the resulting list of tickers is saved, not the filters themselves. Once you save, that list is frozen: the market can keep moving, but your asset group won't silently change under you. You name and describe the group when you save it.

| Decision | What it affects |
|---|---|
| **Exchange** — US, Crypto or Forex | Scopes what you can search for, not what you've already picked. Switching exchanges never removes tickers you've already added, so a universe spanning multiple markets is built by switching exchanges and adding to the same list |
| **Include instruments with no recent price data** (off by default) | Leave it off for an active trading universe. Turn it on when you're building a historical or index-style universe and want delisted or dormant names included too |
| Tickers, portfolio groups, or both | An asset group can also hold entire [portfolio groups](/docs/portfolio-groups) as if they were single instruments — their combined performance is treated like a price series. This is how you build a portfolio of portfolios |
| Whether to build one at all | The [study](/docs/studies) builder lets you pick a ready-made universe — a curated collection, an index, a sector, a sector ETF set, a country or an industry — without visiting this screen first |

> [!WARNING] An asset group has no date range
> An asset group is just a list of instruments — it doesn't carry a start date, an end date or a chosen data source. The date range you backtest over is set later, on the study. What the asset group does provide is each instrument's own history, which the study screen uses to keep your date pickers realistic.

Full reference: [Asset groups](/docs/asset-groups).

## 2. Write the signal — Strategy

**Registry → Strategies → New Strategy**

A strategy answers one question on every rebalancing date: which instruments should I hold, long or short, and at what weight. Everything downstream — the study, the results, the portfolio — is built from that one answer. You write it in a code editor, with a panel of settings beside it, and give it a name when you save.

| Decision | What it affects |
|---|---|
| **Internal** vs **External** | Chosen once and locked in — you can't switch a strategy from one to the other later. Internal means Fintela runs your Python code for you; External means the logic lives on your own systems and Fintela calls out to it whenever it needs a decision. (Rule-based, no-code strategies aren't available yet.) |
| Which **parameters** you declare | Only the parameters you declare here become tunable later — this is the search space the optimizer explores at stage 5. Each one is a number (whole or decimal) or a choice from a fixed list, and each needs a sensible **Test value** before it will save |
| The **lookback** you declare | The longest lookback your strategy needs decides how much history a study has to load before its start date — and any instrument without enough history behind it is automatically excluded |
| Whether to test it first | **Run a backtest** from the row menu tries your strategy once, at fixed values, over a universe and window you choose. It costs a single token, making it the cheapest way to confirm the logic works before committing to a full parameter sweep |

Saving is more than storing text: Fintela runs your code against a real slice of data first, so a strategy with a bug never makes it into the registry. The name you choose becomes this strategy's identity everywhere else in the product, so pick something you'll still recognize later.

> [!NOTE] Editing a strategy never changes a result you already have
> Every save creates a new version, and a study always keeps running against the exact version you launched it with — so refining a strategy afterward never quietly rewrites results you've already reviewed.

Full reference: [Strategies](/docs/strategies), plus [external strategies](/docs/external-strategies) if you want to trade logic that lives on your own systems.

## 3. Choose the objective — Fitness Function

**More Options → Fitness Functions → New Fitness**

A fitness function takes one simulated run — the equity curve, the metrics, the trades, everything that happened — and reduces it to a single number. The optimizer's whole job at stage 5 is to push that number in the direction you want. It's the most consequential choice on the study screen: the same strategy, optimized against two different objectives, can end up with two very different sets of parameters.

| Decision | What it affects |
|---|---|
| **Built-in** vs **Internal** vs **External** | Built-ins are ready-made, standard metrics — Sharpe ratio, CAGR and the like — with nothing to configure and nothing to edit. Internal and External work like strategies do: you write the scoring logic yourself, or point to logic hosted on your own systems, and that choice is locked in once made |
| Which stage of the data the score comes from | Only your **training-period** score steers the search. Validation, the full window and out-of-sample scores are all still calculated and shown to you, but none of them influence which parameters the optimizer tries next |
| Direction | Set on the study, not here, and it defaults to the objective's natural direction — a metric like drawdown, where lower is better, is minimized by default rather than maximized |
| Whether you need to build one at all | If a standard metric already captures what you're optimizing for, skip this step and pick a built-in when you set up your study |

> [!WARNING] One objective, one direction per study
> A study optimizes toward exactly one number, in exactly one direction — there's no multi-objective or trade-off mode. Rule-based, no-code fitness functions aren't available yet either, so plan on writing one in code if a built-in doesn't cover what you need.

Full reference: [Fitness functions](/docs/fitness-functions), plus [external fitness](/docs/external-fitness) for scoring logic that runs on your own systems.

## 4. Add guard rails — Risk Managers

**More Options → Risk Managers → New Risk Manager** — optional

A risk manager watches the portfolio on every simulated day and can step in before the strategy rebalances — trimming a position, closing it outright, or blocking that day's rebalance entirely. It never decides what to buy; it can only restrain what the strategy already decided.

| Decision | What it affects |
|---|---|
| Whether to attach one on your first pass | It's usually worth running your first study with no risk manager attached — that tells you whether the underlying signal works on its own. Adding a stop-loss from the start can hide a weak signal behind a guard rail that's really doing the heavy lifting |
| Which kind | **Built-in** (a catalog of ready-made rules), **rule-based** (built visually, no code), **custom code**, or an **external** service you host yourself. This is the only registry where you can build a rule visually without writing code |
| Where you pick a built-in | Built-ins don't show up in this registry's list — you choose one directly while setting up a study at stage 5 |
| Which parameters the optimizer tunes | Each risk manager you attach can have its own settings marked **Fixed** or **Optimized**. Optimized ones get swept alongside your strategy's own parameters |

You attach risk managers inside the study itself, under Advanced options, where you also choose the order they run in: halts and closes first, then sells, then buys, then finally the strategy's own rebalance.

> [!CAUTION] Changing your attached risk managers replaces the whole list, and each attachment is a snapshot
> Saving your risk-manager selection replaces the entire list for that study — anything you leave unchecked gets detached. Each one is captured as a snapshot at the moment you attach it, so editing or deleting the risk manager in the registry afterward never changes a study that already has it. You can only change what's attached while the study is still a draft, before it launches.

Full reference: [Risk managers](/docs/risk-managers).

## 5. Sweep the space — Study

**Registry → Studies → New Study**

A study ties together exactly one strategy, one fitness function and one asset group — plus, optionally, an ordered set of risk managers — and runs it across a date range, a parameter search space, a chosen search method and a trial budget. You configure everything on one screen, then confirm.

```text
  ┌─────────────┬─────────────┬─────────────┬──────────────┐
  │ Asset Group │  Strategy   │   Fitness   │ Optimization │
  │  universe   │   signal    │  objective  │  budget +    │
  │  + window   │  + params   │  + params   │  advanced    │
  └─────────────┴─────────────┴─────────────┴──────────────┘
             ↓ Name your study · Cancel · Continue
                 ┌────────────────────────────┐
                 │    Confirm your study      │
                 │  summary · cost · warnings │
                 │ Save Draft │ Save & Launch │
                 └────────────────────────────┘
```

| Block | Decisions that matter |
|---|---|
| **Asset Group** | Start date and end date, limited to what your universe actually has history for. Under Advanced options: how much of that window is used for training versus validation (70% training by default), and whether a slice is held back entirely as out-of-sample data (on by default, 10%). There's no walk-forward or rolling re-optimization here — one continuous window, split once |
| **Strategy** | For each parameter, mark it **Fixed** or let the optimizer search it, with a range or a set of choices. Changing which strategy you're using clears any parameter settings and any attached risk managers, so pick your strategy before you start tuning |
| **Fitness** | Your objective, plus (for a custom objective) the universe it's scored against. Fitness settings are always fixed constants — the optimizer never searches them |
| **Optimization** | Number of trials (1000 by default), search method (TPE by default), whether you're maximizing or minimizing (defaults to the metric's natural direction, locked once you launch), which benchmark to compare against (automatic — one per asset group — by default), whether to auto-stop on a high failure rate (on by default, 30% threshold), which instruments are eligible, and your risk-manager stack |

Two things the screen works out for you rather than leaving you to calculate:

- **Search space size**, shown whenever every parameter you're searching has a finite range. If your trial budget is larger than the whole search space, the study simply stops early once it has tried every combination.
- **Cost**, priced from your trial budget plus a surcharge for larger universes, shown against your current balance before you confirm. You're only charged when the study launches, and whatever it doesn't use is refunded automatically when it finishes.

> [!NOTE] Saving a study doesn't start it
> **Save Draft** saves the study with nothing charged and nothing running — you can launch it later. **Save & Launch** queues it immediately and starts the charge. A draft can also be launched later from its row in the registry. Once a study has launched, its setup is locked — you can no longer edit it, only duplicate it into a fresh draft.

Once launched, a study moves from queued, to running, to completed, and its registry row keeps its progress and health up to date every few seconds while it's active. There's no pause button on a running study — stopping happens from the results screen, not from the registry.

Full reference: [Studies](/docs/studies) for every setting, [study lifecycle](/docs/study-lifecycle) for what each stage means and why a study might fail, [sampler selection](/docs/sampler-selection) for which search method to pick.

## 6. Read the output — candidate portfolios

**Analysis → Portfolios** (or click **View** on a study's row to jump straight to its results)

Every trial your study completes becomes a candidate portfolio — a full backtest for one specific combination of parameters, complete with its own equity curve, trades, holdings and metrics. This is where you rank candidates against each other, compare them side by side, and judge whether your best result reflects a real edge or just the luckiest run out of many. Every view you build here has its own shareable link.

| Screen | What it's for |
|---|---|
| **Portfolios Dashboard** | Ranking every candidate on a metric you choose, over a stage you choose, and comparing them side by side |
| **Optimization Dashboard** | Digging into one study's results in depth — an overview, a robustness check, family groupings and parameter importance |
| **Portfolio Analysis** | Digging into one candidate in detail — performance, holdings, transactions, risk analytics, robustness and profile |

The decisions here are all about how you read the results, not about configuring anything new:

- **Rank by which metric, on which stage.** The filter bar's **Metric**, **Study**, **Top N** and **Rank by** controls decide what every chart and table on the screen means. Ranking purely on the training stage only confirms what you already optimized for — it tells you nothing new.
- **Is this a real edge or a fluke?** The Optimization Dashboard's **Robustness** view gives you an overfitting estimate and a plain verdict — **well trained**, **borderline**, **overfit risk** or **uncertain** — and its **Families** view shows whether your top results are genuinely different strategies or just variations on the same behavior.
- **Which parameters actually mattered.** **Parameter importance** and the parameter-versus-metric charts show which settings moved the needle, so you know where to narrow your search on the next pass.

> [!NOTE] A finished study doesn't always show 100% progress
> Progress reflects how many trials have finished out of your budget. If your search space is smaller than your trial budget, the study can complete early — once every combination has been tried, there's nothing left to run. Check the status, not the progress bar, to know a study is actually done.

Full reference: [Portfolios dashboard](/docs/portfolios-dashboard), [optimization dashboard](/docs/optimization-dashboard), [portfolio detail](/docs/portfolio-detail), [analyzing results](/docs/analyzing-results), [metrics reference](/docs/metrics-reference).

## 7. Keep a winner — promote

**Analysis → Portfolios** → the card's **Promote** control, or **Promote Selected** for several at once

A trial only exists as long as its study does — delete the study and its trials go with it. Promoting a trial turns it into a **promoted portfolio**: a permanent, independent copy with its own identity that survives even if you later change or delete the study that produced it. Promoting captures a full snapshot — the strategy and its exact parameters, the universe it traded, the fitness and risk-manager setup, the date range, and everything it earned or held during the backtest.

| Where to promote | How |
|---|---|
| A card on the dashboard | Click **Promote** — it becomes **Promoted** once done |
| A batch of results | Select two or more, then click **Promote Selected** to promote them all in one action |
| An individual candidate's detail page | Use the promote control in the header |
| Building a portfolio group | Adding a raw trial straight into a portfolio group promotes it automatically along the way |

| Decision | What it affects |
|---|---|
| How many to promote at once | Promoting counts against your promoted-portfolio limit, charged for the whole batch at once, up to **50** trials in a single action |
| Whether a trial can be promoted at all | Only trials built on **Internal** strategies can be promoted — trials on External strategies, and certain meta-strategy configurations, can't be |
| Naming | Fintela names it for you from the study and trial number — there's currently no way to rename a promoted portfolio afterward |

> [!WARNING] Promoting locks in a snapshot — it doesn't re-run anything
> A promoted portfolio's history is copied exactly as it stood at the moment you promoted it — nothing is re-simulated or re-optimized. From then on, changing the original strategy, risk managers or asset group never touches the promoted copy, and deleting the source study leaves it untouched. Promoting the same trial twice just returns the same portfolio — it won't create a duplicate.

Full reference: [Promoted portfolios](/docs/promoted-portfolios).

## 8. Assemble a book — Portfolio Group

**Registry → Portfolio Groups → Create Portfolio Group**

A portfolio group is a named collection of promoted portfolios that share one trading setup. It answers three questions for the whole book: how is capital weighted across members, how often does it re-weight, and how do its orders reach a broker. It's also the only thing you actually deploy to trade — you never send a single promoted portfolio to a broker on its own.

Like the other setup screens, you pick members on one side, adjust advanced settings and preview the result beside it, then name and save.

| Decision | What it affects |
|---|---|
| **Members** | Chosen from your [Promoted Portfolios](/docs/promoted-portfolios). You need at least one before you can save |
| **Allocation method** | Equal weight and manual weighting are included free. Metric-proportional, metric-responsive, risk parity, volatility target and mean reversion are premium methods, billed with tokens the first time you use one |
| **Periodic rebalancing** | Off by default, meaning the group allocates once and holds until you change it. Turn it on to have the group re-weight automatically on a set schedule — every 30 trading days to start, adjustable from there |
| **Daily update** | Always on for a portfolio group — each member's performance is extended day by day automatically. This is required before a group can be deployed to trade |

There's a second way to reach this same screen: from the Portfolios dashboard, select several candidates and use the bulk action **Create portfolio group** — it promotes whatever isn't promoted yet and takes you straight to the new group.

> [!NOTE] Portfolio Groups and Portfolio Manager are two different screens
> **Portfolio Groups** (in the Registry section) is where you manage membership, allocation, rebalancing cadence and trading setup. **Portfolio Manager** (in the Analysis section) is where you monitor the group — its equity curve, metrics, holdings, trades, robustness and its live trading activity.

Full reference: [Portfolio groups](/docs/portfolio-groups), [portfolio manager](/docs/portfolio-manager).

## 9. Send it to a broker — Operation

**Registry → Portfolio Groups →** row action **Deploy Portfolio Group**, or **Analysis → Portfolio Manager → open a group → Operations → Trade with your brokerage**

An operation is one deployment of one portfolio group against one connected broker account. The portfolio group defines the trading rules; the operation holds the capital you're committing, its current status and its own rebalancing schedule. A group can have at most one operation per broker connection — which means the same group can run in paper trading and live trading at the same time, as long as they're on two separate connections.

| Decision | What it affects |
|---|---|
| **Brokerage account** | Choose from your active broker connections — each one is labeled paper or live |
| Paper or live | There's no separate paper/live switch when you deploy — it's determined entirely by which connection you pick. Paper trading is always available; live trading is enabled per account through your broker connection settings |
| **Capital to trade** | The dollar amount you're committing to this operation. If it's above what your connection allows per trade, the deployment is refused rather than silently adjusted |
| Execution override | Optional — set a specific order type, time-in-force, or limit offset for this operation only. Leave it off to use the portfolio group's own trading setup |

Creating an operation and launching it are two separate steps, and creating one doesn't place any trades. **Deploy Portfolio Group** does both at once — it creates the operation and launches it immediately. **Trade with your brokerage** creates it as a draft first, so you can review it before launching from its own row.

```text
  Draft ──launch──► Active ⇄ Paused
                      │        │
                      └────────┴──stop──► Stopped ──restart──► Draft
```

| Status | Meaning |
|---|---|
| **Draft** | Created, not yet launched — no capital committed yet |
| **Active** | Trading |
| **Paused** | Positions are held, but rebalancing has stopped |
| **Stopped** | Positions liquidated and closed out; history is kept |

Before creating or launching an operation, Fintela checks your setup and tells you exactly what to fix if something's wrong. The most common reasons a launch is blocked all trace back to earlier decisions: an empty portfolio group, members that aren't up to date, members that aren't on daily updates, members built on External strategies (which can't extend daily), portfolio-of-portfolios members that haven't been flattened, and short positions your broker won't allow.

> [!CAUTION] Live trading uses real capital — but you can always exit
> Only the actions that add exposure — creating an operation, launching it, or resuming it — require live/paper trading access on your plan. Pausing, stopping and returning to draft always stay available, on every plan, so you're never locked into a position you can't exit. Start on a paper connection until you trust the behavior.

Full reference: [Live trading](/docs/live-trading), and [portfolio groups](/docs/portfolio-groups) for operation details, orders, allocations and daily reconciliation.

## Iterating — the loop back to stage 5

Your first study almost never gives you the configuration you end up keeping. The usual loop is short:

1. Look at **Parameter importance** and the parameter-versus-metric charts on the Optimization Dashboard.
2. From the study's row in the registry, choose **Duplicate**. This opens the study builder pre-filled with the same setup, under a new name, ready to edit — nothing is created yet.
3. Narrow your ranges, or fix any parameter that turned out not to matter to a single value. A smaller, more focused search finishes faster and explores more of what's actually left to explore.
4. **Save & Launch**, then compare the two studies side by side on the dashboard.

A completed or stopped study can also be resumed with a larger trial budget through the [Developer API](/docs/api-studies), though there's currently no resume button in the app itself — and a failed study can never be resumed.

There's a second loop that starts from stage 6 instead of stage 2: **Derive / Optimize risk managers** on a candidate creates a new study — one per selected portfolio — that tunes guard rails around a signal you've already validated. These studies launch right away; they don't sit as drafts first.

## Gates that stop the path

Each of these is documented in full on the page that owns it. They're collected here because each one is decided at an early stage and only bites at a later one.

| Gate | Decided at | Shows up at |
|---|---|---|
| An External strategy can never be promoted | Stage 2, and locked in from then on | Stage 7 — the promote action is blocked, and the path ends there |
| A launched study can't be edited | Stage 5 | Any later change — duplicate it instead |
| Attached risk managers can only be changed while a study is still a draft | Stage 4 / 5 | Any change you want to make after launch |
| A portfolio group needs daily update on and up-to-date members | Stage 8 | The launch check at stage 9 |
| Creation limits | Every registry | Only when creating something new — never when viewing, editing, deleting or stopping |
| Token balance | Launching a study (stage 5) and premium allocation methods (stage 8) | Saving a draft is always free; launching or upgrading is what's charged |

## Shortcuts through the path

The nine stages are the full route. Four screens let you skip parts of it.

| Shortcut | What it replaces |
|---|---|
| Ready-made universes in the study builder | Stage 1 entirely — pick a curated collection, an index, a sector, a sector ETF set, a country or an industry, and Fintela builds the universe for you |
| A built-in fitness function | Stage 3 — no writing, no settings, no extra universe to configure |
| The [Laboratory](/docs/laboratory) | Stages 2 through 4 — a notebook where you can experiment with live Python and promote working code straight into the registry once you're happy with it |
| [Fintelligent](/docs/fintelligent) | Stages 1 through 5, as drafts it prepares for you — it fills in the setup screens for asset groups, strategies, studies, fitness functions and risk managers, and always waits for you to confirm before anything is created. It can also act more directly on request — creating, launching, stopping, resuming or duplicating a study for you — so a launch it makes on your behalf does spend tokens; it currently can't delete a study for you. See [Fintelligent capabilities](/docs/fintelligent-capabilities) |

## Where to go next

| Page | What it covers |
|---|---|
| [Quickstart](/docs/quickstart) | The same path, compressed into one worked example |
| [Core concepts](/docs/core-concepts) | The vocabulary each stage assumes you already know |
| [Registries](/docs/registries) | The conventions shared by every registry, so the individual pages don't have to repeat them |
| [Analyzing results](/docs/analyzing-results) | Stage 6 as a workflow, not just a screen reference |
| [Live trading](/docs/live-trading) | Stage 9 in full, including monitoring, drift and stopping |
| [Study lifecycle](/docs/study-lifecycle) | What a study is doing between launch and completion |
| [Execution modes](/docs/execution-modes) | Internal versus External, and exactly where External doesn't apply |
| [Optimizer architecture](/docs/optimizer-architecture) | How a launched study turns into finished results |
| [Visualizations](/docs/visualizations) | Every chart the analysis screens show you |
