---
title: Strategies
section: Registries
sectionOrder: 3
order: 3
published: true
updated: 2026-09-01
summary: How to define the trading logic a study optimizes — write it directly in Fintela's Python editor, or connect a service you run yourself.
keywords: strategy, signal, parameters, python editor, internal, external, backtest, lookback, versions, execution mode
---

A strategy is where you define the trading logic that a study will test and tune. Write it once — as Python code in Fintela's editor, or as a connection to logic running on your own systems — and everything downstream builds on it: backtests, optimization studies, and live trading all execute the same decision logic you defined here.

Every strategy answers one question, for every date it runs: **which instruments do I hold, on which side, and at what weight?** That answer is called a **signal**, and producing one, correctly and consistently, is the one thing every strategy has to do — however you choose to build it.

## Overview and purpose

A strategy decides which instruments to hold, whether to go long or short, and how much weight to give each position. That's its entire job.

A strategy does **not** decide:

- Whether a result is good — that's the job of a [fitness function](/docs/fitness-functions), which scores what your strategy produces.
- Which instruments are even eligible to trade — that's defined by an [asset group](/docs/asset-groups).
- Which parameter values to try — that's driven by a [study](/docs/studies), which sweeps your strategy's parameters across many trials.

Keeping these responsibilities separate is what lets you reuse the same strategy across different universes, and test the same universe with different strategies, without rewriting anything.

### Where a strategy fits in

```text
Asset Group (the universe)     Strategy (your logic)     Fitness Function (the score)
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                       ▼
                                    Study
                    (assigns each parameter a range, a
                     set of choices, or a fixed value,
                     then runs many trials)
                                       │
                                       ▼
                    trial → signal → simulated portfolio → results
```

### Where you'll use a strategy

| Where | What happens | Good for |
|---|---|---|
| A study | Runs your strategy once per trial, using that trial's sampled parameter values | Systematically optimizing your parameters |
| Run a Backtest | Runs your strategy once, at values and over a date range you choose | Quickly sanity-checking an idea before committing it to a full study. Costs **1 token** per run |
| Saving your strategy | Your code (or your endpoint) is checked automatically before Fintela accepts the save | Catching mistakes before they cost you a study |
| Live trading | Runs your saved strategy on a promoted portfolio's schedule | Turning a validated idea into a running strategy |

A study always stays pinned to the exact version of the strategy it started with, so editing a strategy later never changes results you've already produced — see [Version history](#version-history).

For how all the pieces fit together end to end, see [core concepts](/docs/core-concepts), the [end-to-end workflow](/docs/end-to-end-workflow), and the other [registries](/docs/registries).

> [!NOTE]
> Sharing and forking strategies happens in the [Laboratory](/docs/laboratory), not on this page. Open a strategy from the community catalog there to copy it into your own organization and make it yours. Available on paid plans.

> [!TIP]
> You can also read your strategies from your own tools and dashboards with a personal access key from your account settings. That access is read-only, so it can never change anything by accident, and it's rate-limited to keep the platform fast for everyone. See the [strategies API](/docs/api-strategies) reference for details.

## The strategies list

Open **Strategies** from the Registries menu to see every strategy in your organization — yours and your teammates'. Switch between a table view and a tile view; Fintela remembers your choice. If you haven't created a strategy yet, you'll see a prompt to create your first one.

An insights panel above the list summarizes your strategies by execution type and by how many studies use each one, so you can spot at a glance which strategies are proven and which are still experimental.

### Columns and information shown

| Column | Shown by default | What it tells you |
|---|---|---|
| Name | Yes | The strategy's name |
| Description | Yes | An automatic summary — type, logic, parameters, and version. Hover to see any notes you wrote yourself |
| Execution Type | Yes | Whether it runs inside Fintela (Internal) or on your own systems (External) |
| Author | Yes | Who created it |
| Created At | Yes | When it was created |
| Associated Studies | Hidden — add it from the column chooser | How many studies currently use this strategy |

### Filtering and search

Narrow the list by:

- Name and Description (text search)
- Execution Type (Internal, External, or both)
- Author
- Associated Studies (a number range)
- Created At (a date range)

The search box matches your typed text against the name, your stored description, the automatic summary, and the author together — so you can find a strategy by a parameter name buried in its summary, not only by its title.

### Actions you can take on a strategy

Click a row (or right-click for a context menu) to see what's available:

| Action | What it does | When it's unavailable |
|---|---|---|
| Run a Backtest | Opens the sandbox with this strategy preloaded, so you can test it at values and over a date range you choose | Always available |
| View | Opens a read-only copy of the strategy | Always available |
| Edit | Opens the strategy in the editor | Once a study uses this strategy, or if your role can't edit |
| Duplicate | Creates your own editable copy | If your role can't create strategies |
| Delete | Removes the strategy, after you confirm | Once a study uses this strategy, or if your role can't delete |

> [!TIP]
> Edit and Delete lock as soon as a study starts using a strategy — this protects that study's results from changing under you. Duplicate the strategy instead if you want to keep building on it.

### Deleting strategies

Delete strategies one at a time, or select several and delete them together. Either way, you'll be asked to confirm — deleting a strategy also removes any data tied to it that isn't otherwise in use.

> [!CAUTION]
> A bulk delete removes each selected strategy individually rather than as one all-or-nothing action. If something goes wrong partway through, some strategies may be deleted and others not — check the list afterward to confirm the result.

### Who can do what

| Role | View | Edit | Create | Delete |
|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | No |
| Analyst | Yes | No | Yes | No |

Free-tier organizations can have up to **2 strategies** at a time. The limit only applies when you try to add a new one — everything you already have keeps working. Delete a strategy you no longer need to free up a slot, or upgrade your plan for more room.

## Creating and editing a strategy

There's no multi-step wizard — the strategy editor is one screen: your code (or your endpoint's address) in the center, and a panel of settings alongside it. You name your strategy at the very end, when you save it, not at the start.

### Internal vs. external strategies

When you create a strategy, you choose how it runs, and this choice is permanent:

| Option | What it means |
|---|---|
| **Internal** | You write Python code directly in Fintela's editor. It runs inside Fintela's sandbox |
| **External** | You point Fintela at a service you run and control — your logic, your infrastructure, your language of choice |
| **Rule-based** | A preview of what's coming — building a strategy visually, without code. Not available yet |

> [!WARNING]
> Choose carefully: once a strategy is created, you can't switch it between Internal and External. If you need the other mode, duplicate it as a new strategy of that type instead.

Reasons to choose external: keep proprietary models, code, or data entirely on your own systems; use a language other than Python; reuse logic you've already built elsewhere. See [external strategies](/docs/external-strategies) for a full walkthrough of connecting your own service.

### Writing your strategy in the code editor (internal)

The code editor supports the conveniences you'd expect: a save shortcut, code formatting, import/export of your file, and a fullscreen mode. Starting from a blank strategy gives you working template code to build from — a banner reminds you that you're still using it until you make a change.

A status chip above the editor tells you where your code stands: unvalidated changes, validating, valid (with or without warnings), or an error with the line number to jump to. As you type, Fintela checks your code in the background against a sample of tickers, so you catch mistakes before you try to save. If you've set a large custom validation universe (more than 250 tickers), automatic checking pauses and you trigger a check manually instead, to keep the editor responsive.

A **Reference** button opens a quick guide to the function shape and rules covered in [The signal your strategy returns](#the-signal-your-strategy-returns) below.

### Connecting your own service (external)

| Setting | What it controls | Default |
|---|---|---|
| Endpoint address | The address of your service that Fintela calls | — |
| Max Concurrency | How many requests Fintela can send your service at once | 4 |
| Timeout (seconds) | How long Fintela waits for a response before giving up | 30 |

If you enter a plain `http://` address, Fintela warns you that the connection isn't encrypted — fine for testing, but switch to `https://` before you go live.

You can also set an optional list of tickers to send along with each request, so your service can scope its logic to the exact instruments involved. If your own logic doesn't need this, it's safe to leave unset.

### Parameters — the values a study can tune

Parameters are the knobs a study experiments with — a lookback window, a threshold, a weighting scheme, anything you want Fintela to search over on your behalf.

| Field | What it's for |
|---|---|
| Parameter name | For internal strategies, matches an argument in your Python function — Fintela keeps this list in sync automatically as you edit your code |
| Type | Integer, Float, or Categorical (a named choice, like `"ema"` vs `"sma"`) |
| Test value | One concrete value used whenever you preview or validate your strategy in the editor — see the warning below |
| Choices | For Categorical parameters only: the list of values a study is allowed to pick from |

For internal strategies, you don't manage this list by hand — editing your function's arguments automatically adds, removes, and renames parameter rows to match. Only genuine tunable inputs show up here; any built-in data your strategy pulls in (see Advanced settings, below) is never treated as a parameter.

#### Rules for parameters

Fintela checks your parameters before letting you save:

- Each parameter needs a recognized type — Integer, Float, or Categorical.
- A Categorical parameter needs at least one choice (up to 100), with no blanks or duplicates.
- Only Categorical parameters take a Choices list — Integer and Float parameters don't.
- Every parameter needs a test value, matching its type: a whole number for Integer, any real number for Float, one of the declared choices for Categorical.

### How parameters become a study's search space

A strategy only declares what *kind* of value each parameter accepts — not the range a study should try. That's set separately, when you build a [study](/docs/studies):

| Study setting | What it means |
|---|---|
| Range | Try every value between a minimum and a maximum |
| Choices | Try a subset of the values you declared for a Categorical parameter |
| Fixed | Always use one specific value — no searching |

If a study sets more than one of these for the same parameter, a fixed value wins first, then a chosen subset, then a range.

> [!CAUTION]
> Your parameter's **test value** is not a default. It's simply the number your code runs against whenever you preview or validate it in the editor — a study never uses it while searching. Pick something from the middle of the range you plan to explore, so what you're validating reflects realistic conditions.

### Advanced settings

A few more settings live in the collapsible panel alongside your code:

- **Data sources** (internal only) — built-in data you can pull into your strategy alongside price history, such as sector and industry classifications, fundamentals, or index membership. Turn on only what you actually use.
- **Variables** — a live preview of exactly what your function receives at run time: your enabled data sources plus your declared parameters.
- **Lookback** — how much price history your strategy needs warmed up before its first real signal. Covered next.
- **Validation** — the results of Fintela's automatic check of your code: any errors, warnings, and a sample of the positions it produced.
- **Version History** (while editing) — every past version of this strategy.

#### Warm-up period (lookback)

Most strategies need some history before their first signal means anything — a 50-day moving average, for instance, needs 50 days of prices behind it before it's meaningful. The **lookback** tells Fintela how many extra trading days of history to load before your simulation's start date, so your indicators are already warmed up on day one.

You declare it as a small function of your own parameters:

```python
def required_lookback(slow_ma, fast_ma, signal_window):
    return max(slow_ma, fast_ma) + signal_window
```

Fintela can generate this for you automatically and keep it in sync as you add or rename parameters, or you can customize it yourself — useful when your warm-up need isn't a simple function of your parameters.

What it affects:

- Fintela loads that many extra days of price history before your start date. Instruments without enough history are left out of that run.
- It's recalculated for every trial in a study, using that trial's own parameter values.
- When a study launches, Fintela also checks it at each parameter's maximum possible value, to confirm your chosen universe has enough history to support the widest case you might try.

If your strategy uses a built-in data source beyond plain prices, you'll need a separate lookback declaration for that source too — the editor prompts you to add one if it's missing. Skipping this means that data arrives without enough history behind it, which can quietly distort your strategy's early results.

> [!WARNING]
> If your strategy chains several calculations that each need their own warm-up, add the days together for calculations that happen one after another, and use the largest for calculations that happen side by side.

#### Validation settings

| Setting | What it controls |
|---|---|
| Ticker sample size | How many tickers Fintela checks your strategy against while you type — fewer is faster, more is more thorough. The maximum setting runs a full check instead of a sample. Unavailable once you've set a custom validation universe, since that already defines the exact list |
| Validation universe | What Fintela tests your code against: the default sample universe, a specific asset group, or a list of tickers you name yourself — optionally limited to a date range |

Choosing an **asset group** as your universe is just a note for your own reference: Fintela remembers it and suggests it first when you build a study, but it doesn't restrict which universe a study can actually use.

Naming specific **tickers** is different — it declares that this strategy is written for those instruments. If a study later runs it over a universe missing some of them, you'll see a warning; missing all of them blocks the study as incompatible. Leave both empty and your strategy is treated as universe-agnostic, with no such check at all.

A custom list of tickers is capped at 2,000.

### Saving a strategy

Before your strategy is saved, Fintela works through a series of checks and tells you exactly what to fix if something's wrong:

1. Any unreviewed draft in the editor needs to be reviewed first.
2. Your code (internal) or endpoint address (external) can't be empty.
3. External settings like timeout and concurrency must be positive whole numbers.
4. Every parameter needs a test value.
5. Every Categorical parameter needs at least one choice, and its test value must be one of them.
6. Any built-in data source that needs its own warm-up has one.
7. Your code passes Fintela's automatic validation run.

Once everything checks out, you're asked to name your strategy and add a description — the only point where you set the name. Typing a name automatically formats it into a valid identifier (lowercase, spaces become underscores) and, for internal strategies, renames the entry point in your code to match. If the name is already taken, Fintela appends a number to keep it unique.

If you're editing a strategy that studies already depend on, and your change genuinely affects its behavior, Fintela warns you first: any study that already launched keeps running against the version it started with, so your edit won't retroactively change results you already have.

A few things can stop a save:

- The name is already in use in your organization — rare, since Fintela normally resolves this for you automatically.
- Someone else changed this strategy while you were editing it — reload it to see their version before saving yours.
- Your code hasn't passed validation yet, or was validated at different parameter values or a different date window than what you're about to save. Run validation again with your final code and values, then save.

### Version history

Every meaningful save creates a new version, and past versions are never overwritten — you can always see what changed and when.

| Change | Creates a new version? |
|---|---|
| Execution type, code or endpoint settings, parameters, lookback, data sources, or deleting the strategy | Yes |
| Name or description only | No |
| Memory settings, or which asset group/tickers it's validated against | No |

For internal strategies, you can **restore** any past version — it loads that version's code back into the editor as a draft for you to review and save, rather than reverting instantly. Restoring an old version therefore creates a new version too.

A launched study always keeps running against the version of the strategy it started with, so editing a strategy here never changes a result you've already produced. See [study lifecycle](/docs/study-lifecycle) for more on how studies pin to a version.

## Execution modes

Every strategy runs in one of two ways today. A third option — Rule-based — is visible in the editor as a preview of what's coming, but isn't available yet. See [execution modes](/docs/execution-modes) for how this choice compares across the platform.

| | Internal | External |
|---|---|---|
| Where your logic runs | Inside Fintela's sandbox | On your own systems |
| Language | Python only | Any language — Fintela just needs a web address to call |
| Your private data | Only what you explicitly turn on as a data source | Fully private — Fintela never sees it |
| Data sources panel | Available | Not available |
| Checked automatically before saving | Yes | Only the address itself is checked |
| Code visible in version history, with Restore | Yes | No — only the connection settings |
| Curated Python library list | Applies | Doesn't apply — it's your own environment |
| Warm-up (lookback) function | Required | Required |

### Internal strategies — how your code is called

Write one function. Fintela recognizes it by its arguments, not by its name or position in the file — the first function whose parameters include `data`, `start_date`, and `end_date` is the one that runs.

```python
def your_strategy(
    data,            # required — price history for your universe
    start_date,      # required — the simulation's start date
    end_date,        # required — the simulation's end date

    # Any data sources you've turned on, matched by name
    meta,            # sector / industry / instrument type
    fundamentals,    # PE, beta, market cap, and similar figures
    groupings,       # membership in named groups, by date

    # Your own declared parameters
    lookback,
    top_n,
):
    ...                                # build and return your signal
```

| Argument | What it gives you |
|---|---|
| `data` | Price history for every instrument in your universe, already extended back to cover your lookback window. An instrument that didn't exist yet on a given date simply has no value there |
| `start_date` / `end_date` | The window your signal should cover |
| your declared parameters | One concrete value per trial — a Categorical parameter arrives as the text you chose for it |
| your enabled data sources | Whatever extra data you turned on, matched to the argument with the same name |

> [!CAUTION]
> A few things to keep in mind:
> - Argument **names** matter, not their order — write them however makes sense to you.
> - Any data source you don't name as an argument simply isn't passed to your function.
> - Every value your function needs must be a named argument — there's no catch-all for extra data.
> - Your function's name has to match your strategy's name; Fintela keeps these in sync automatically when you name your strategy at save time.

### The signal your strategy returns

Whether your strategy runs inside Fintela or on your own service, it must produce the same shape of answer — a dictionary keyed by date, then by ticker:

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

A simple example, similar to one of the built-in template strategies:

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

Fintela checks whatever you return against the same rules, no matter how it was produced:

- The top level must be a dictionary keyed by date, in `YYYY-MM-DD` format, with at least one date.
- Each date must map to a dictionary of tickers.
- Each ticker must map to a trade with a `position` (`"L"` for long, `"S"` for short) and an `allocation` — a weight greater than 0 and no more than 1 (100%).
- Allocations for a single date can't add up to more than 1; Fintela allows only tiny rounding differences.
- A date you don't return at all isn't a rebalance — the portfolio simply stays as it was.

Anything you don't allocate on a given date is held as cash.

### Python libraries available in the editor

Internal strategies can use a set of pre-installed, curated Python packages — the same versions everywhere your code runs, so a strategy behaves identically whether you're validating it, previewing it, running a study, or trading live.

| Package | Import as | Version | What it's for |
|---|---|---|---|
| NumPy | `numpy` (also pre-loaded as `np`) | 2.2.3 | Arrays and vectorized math |
| pandas | `pandas` (also pre-loaded as `pd`) | 2.2.3 | DataFrames and time series |
| SciPy | `scipy` | 1.16.1 | Statistics, optimization, signal processing |
| scikit-learn | `sklearn` | 1.6.1 | Regression, classification, clustering |
| statsmodels | `statsmodels` | 0.14.6 | Econometrics and time-series modeling |
| ta | `ta` | 0.11.0 | Technical-analysis indicators (RSI, MACD, Bollinger Bands, …) |
| cvxpy | `cvxpy` | 1.9.2 | Convex optimization for portfolio construction |

A handful of standard Python building blocks are available too: `math`, `datetime`, `collections`, `statistics`, `itertools`, `functools`, `operator`, `calendar`, and `json`.

Two things to avoid:

- **`random`** — it makes your strategy behave differently from run to run. Use a seeded generator instead (`numpy.random.default_rng(seed)`), with the seed as one of your declared parameters, so results stay reproducible.
- **Anything that reaches out to the network** — fetching data live during a run means the same trial could score differently on a re-run, and your study's speed would depend on a site you don't control. Bring outside data in as a data source instead, and ask the Fintela team about adding it if it isn't available yet.

> [!TIP]
> For strategies and fitness functions, using a package outside this list shows up as a warning, not a hard stop — you can still save. Treat the list as a guide to what's supported and fast, not a strict boundary. If you need something that isn't listed, ask the Fintela team to add it.

### How your code is checked before it's used

Before Fintela accepts your code — and every time you ask for a fresh check — it actually runs your strategy, not just reads it:

- It runs your code against a realistic sample of instruments (by default, an S&P 500-style universe) over several years of history.
- It runs the check **twice** — once over a shorter window, once over a longer one — and rejects the strategy if adding more recent data changes a signal on a date that's already happened. This protects you from unknowingly writing a strategy that only looks good because it's peeking at the future.
- A check has a generous but limited amount of time to finish; if your code is unusually slow, simplify it or check with less history.
- If a lot of validations are happening across the platform at once, yours may need to wait briefly and retry.

The **Output sample** panel in the Validation section shows the actual positions your code produced on a recent check — date, ticker, side, and allocation — so you can sanity-check your logic without leaving the editor.

**Run a Backtest** is a separate, on-demand check: you choose the values, the universe, and the date range, and it costs **1 token** per run. It's the fastest way to sanity-check an idea before committing it to a full study. See [tokens and billing](/docs/tokens-and-billing).

### External strategies — connecting your own system

An external strategy is just an address Fintela calls: your language, your infrastructure, your private data, entirely under your control. See [external strategies](/docs/external-strategies) for a full walkthrough, and the [Python/FastAPI](/docs/python-fastapi) and [Node/Express](/docs/node-express) guides for working examples you can adapt.

#### What Fintela sends and expects back

For every simulation, Fintela calls your saved address with the start and end dates, along with your strategy's parameters for that run. If you've configured a validation universe, Fintela also includes the resolved list of tickers, so a universe-aware service can scope its output — a service that ignores it is unaffected. (If one of your own parameters happens to share that same name, your parameter takes priority, and you'll see a warning.)

Your service is expected to respond with the same signal structure described in [The signal your strategy returns](#the-signal-your-strategy-returns) above — Fintela checks it against the exact same rules, whether the code that produced it lives inside Fintela or on your own servers.

#### If something goes wrong

Fintela tells you clearly what happened when your service doesn't behave as expected:

- Your service returned an error, or a response Fintela didn't expect.
- The response wasn't valid JSON, or was missing the signal it should have returned.
- The signal itself broke one of the output rules above.
- A signal changed for a past date after the window was extended — a sign your service is using information it shouldn't have access to yet.
- Fintela couldn't reach your service at all — connection refused, timed out, or a DNS/TLS problem.

While a study is running, a malformed response from your service just prunes that one trial rather than failing the whole study, so a temporary hiccup on your end doesn't waste your entire run.

**Look-ahead check.** During validation, Fintela calls your service twice — once over the window you asked for, and once with the end date pushed further out — and rejects the strategy if a signal on a past date changes between the two calls. Your service should always return the same answer for the same inputs, and never let future data leak into a past decision.

**Universe checks.** If your service returns a ticker outside the universe you configured, you'll see a warning — add the ticker to your universe, or stop returning it, before relying on it in a study.

#### Keeping your endpoint secure

> [!WARNING]
> Fintela does not send any credentials, API key, or authentication header to your service — only the request itself. If your service needs to verify a request genuinely came from Fintela, the only place to embed a secret is inside the address you save. Fintela never follows redirects, so make sure your saved address points directly at the right place.

#### Timeouts and concurrency

Your **Timeout** setting controls how long Fintela waits for your service to respond before giving up. Fintela automatically retries a request that fails for a transient reason (a dropped connection, a brief outage) a couple of times before giving up for good — but a request that times out after your service already started working isn't retried during a backtest or a study, to avoid piling more load onto an already-slow response.

Your **Max Concurrency** setting is the number of requests Fintela may have in flight against your service at once during a study — raise it if your service can comfortably handle more parallel load, lower it to protect your own infrastructure. If your strategy and your fitness function are both external and point at the same service, Fintela automatically shares that budget between them so you don't get more load than you expected.

> [!TIP]
> Make sure your service can actually sustain the concurrency you set — a higher `Max Concurrency` only helps if your infrastructure can genuinely serve that many requests at once.

#### Requirements for your endpoint address

Fintela checks your address both when you save it and before every call:

- It must be a well-formed web address using `http://` or `https://`.
- It must include a host — no blank or malformed addresses.
- It can't point at `localhost` or a loopback address.
- It has to resolve to a publicly reachable address — Fintela can't call something on your private network.

> [!NOTE]
> HTTPS isn't required — a plain `http://` address works, and Fintela just shows a warning that the connection isn't encrypted. There's no restriction on which port you use, as long as the address itself is public.

### What's different about external strategies

| Feature | Available for external strategies? |
|---|---|
| Data sources panel | No — your service only receives dates, parameters, and (optionally) the resolved ticker list. Prices are still applied when your signal is simulated, so you don't need to fetch them yourself |
| Ticker sample size for validation | No — there's no built-in sample to choose from |
| Python code editor, formatting, code help | No — Fintela never sees your code |
| Curated Python library list | Doesn't apply — you control your own environment |
| Live as-you-type validation | No — validation happens on demand, and each check makes real calls to your service |
| Required check before saving | No — external strategies save without a passing check first, though you should still test with Run a Backtest |
| Code view and Restore in version history | No — versions record your connection settings, not code |
| Rule-based mode | Not available for strategies at all, internal or external — that's a [risk manager](/docs/risk-managers) feature |

Everything else works the same either way: your warm-up (lookback) function, an optional validation universe, parameters and the search space a study builds from them, Run a Backtest, the strategies list, duplication, and version history of your settings.
