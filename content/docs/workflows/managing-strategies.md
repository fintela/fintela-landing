---
title: Managing strategies
section: Workflows
sectionOrder: 2
order: 1
published: true
updated: 2026-08-04
summary: Create, edit, and test internal and external strategies in the Registry.
keywords: create strategy, edit strategy, python editor, parameters, sandbox, validate, python libraries, numpy, cvxpy
---

Strategies define the trading logic — what to buy, when to buy it, and how much to
allocate. This page walks through creating, editing, and testing strategies in the
Fintela UI.

## Overview

Strategies live in the **Registry** section of the app. You can have as many strategies
as you like — each is an independent, versioned rule that can be linked to multiple
studies.

Every strategy has:

| Field | Description |
|---|---|
| Name | A unique, lowercase identifier (e.g. `roc_top_n`). Used as the Python function name. |
| Description | Optional free-text description shown in the strategy list. |
| Execution type | Internal (Python stored in Fintela) or External (your HTTPS endpoint). |
| Parameters | The optimizable variables — integers or floats that the optimizer sweeps. |

## Create an internal strategy

`Registry → Strategies → + New Strategy → Internal`

### 1. Open the Strategies list

Click **Registry** in the left sidebar, then **Strategies**. You'll see the list of all
strategies in your organization with their name, type (Internal / External), and how many
studies are linked to them.

### 2. Click '+ New Strategy'

The create button is in the top-right corner of the strategies list. A dialog appears
asking you to choose **Internal** or **External**. Choose **Internal** for a Python-based
strategy.

### 3. Fill in name and description

Enter a **name** (lowercase, underscores only — this becomes your Python function name)
and an optional **description**. The name must be unique within your organization.

### 4. Define parameters

Add your optimizable parameters in the **Parameters** panel below the description. Each
parameter needs a name, a data type (integer, float, or categorical), and a test value
used during validation. See [Defining parameters](#defining-parameters) for details.

### 5. Write the Python code

The code editor is pre-filled with a template that matches your parameters. Replace the
body with your logic. The function signature must be:

```python
def your_strategy(data, start_date, end_date, param1, param2, ...):
    # return signal dict
```

A complete example — `roc_top_n.py`:

```python
def roc_top_n(data, start_date, end_date, n_top, roc_window_size, freq):
    """
    data: DataFrame with tickers as columns and dates as index (adjusted close)
    """
    import pandas as pd

    roc_df = data.pct_change(periods=roc_window_size)
    dates  = [d for d in roc_df.index.astype(str) if start_date <= d <= end_date]

    signal = {}
    for date in dates[::freq]:
        top = roc_df.loc[date].nlargest(n_top).index.tolist()
        alloc = 1.0 / len(top)
        signal[date] = {t: {"position": "L", "allocation": alloc} for t in top}

    return signal
```

You're not limited to `pandas` — see [Python libraries](#python-libraries) for the
curated scientific stack (NumPy, SciPy, scikit-learn, statsmodels, ta, CVXPY) you can
import.

### 6. Validate and save

Click **Validate + Save**. Fintela runs your code against a small slice of real data
using the test parameter values you provided. If the code runs cleanly and returns a
valid signal shape, it saves. If there's an error, the traceback appears inline — fix it
and retry.

> [!TIP]
> The code editor supports **Ctrl+S / Cmd+S** to trigger Validate + Save directly from
> the keyboard.

## Create an external strategy

`Registry → Strategies → + New Strategy → External`

External strategies let you host the signal generation logic on your own server. Fintela
calls your endpoint once per trial with the sampled parameters and expects back a signal
map.

### 1. Choose External in the create dialog

After clicking **+ New Strategy**, select **External**. The Python editor is replaced by
an endpoint configuration form.

### 2. Enter your endpoint URL

Provide the full HTTPS URL where your strategy server is running (e.g.
`https://api.yourcompany.com/strategy`). HTTP is not accepted — the endpoint must use
TLS.

### 3. Configure concurrency and timeout

Set **Max Concurrency** (how many parallel requests Fintela sends to your endpoint per
study) and **Timeout** (seconds to wait for each response before treating the trial as
failed). Good defaults: 4 concurrent, 30 second timeout.

### 4. Define external parameters

Same as internal strategies — add the parameters that your endpoint expects to receive in
each request body.

### 5. Validate the endpoint

Fintela sends a test request to your endpoint to confirm it's reachable and returns the
correct response shape. The test uses your parameter test values.

> [!NOTE]
> See [External strategies](/docs/external-strategies) for the full request/response
> contract your server must implement.

## Defining parameters

Parameters are the variables the optimizer will sweep. Each parameter you define shows up
in the study creation wizard where you set the search bounds.

| Field | Description |
|---|---|
| Name | Must match exactly what your Python function or endpoint expects as an argument name. |
| Type | Integer (whole numbers), Float (decimals), or Categorical (a declared set of string choices — your function receives the chosen string). Booleans and free-form strings are still not supported: model an on/off switch as a two-choice categorical or an integer. |
| Choices | Categorical only — the string labels the parameter can take (unique, non-empty). Studies explore a subset of these choices or pin one. |
| Window size | Flag integers that represent look-back window lengths. The optimizer constrains them to be ≥ 2 and ≤ available data length. Categorical parameters cannot be windows. |
| Test value | Used only during validation — the value passed when Fintela runs a smoke test of your code before saving. For categorical parameters it must be one of the declared choices. |

> [!WARNING]
> Parameter names in the UI **must exactly match** the argument names in your Python
> function signature (or the keys your external endpoint reads from the request body). A
> mismatch causes validation failures.

## Python libraries

Internal strategies aren't limited to `pandas`. Fintela ships a curated, version-pinned
scientific Python stack you can `import` directly in your strategy, fitness, and
risk-manager code — no requirements file, no environment to manage. The same versions are
also visible in the code editor under **Available libraries**.

| Import | Version | What it's for |
|---|---|---|
| `numpy` | 2.2.3 | Arrays & vectorised math. Pre-injected as `np` — usable without an import. |
| `pandas` | 2.2.3 | DataFrames & time series. Pre-injected as `pd` — usable without an import. |
| `scipy` | 1.16.1 | Scientific computing: stats, optimize, signal, interpolate. |
| `sklearn` | scikit-learn 1.6.1 | Classical ML: regression, classification, clustering, preprocessing. |
| `statsmodels` | 0.14.6 | Econometrics & time series: OLS/GLS, ARIMA, cointegration tests. |
| `ta` | 0.11.0 | Technical-analysis indicators — RSI, MACD, Bollinger, and more. |
| `cvxpy` | 1.9.2 | Convex optimization for portfolio construction (mean-variance, …). |

The Python standard library is available too — `math`, `datetime`, `collections`,
`statistics`, `itertools`, `functools`, and `operator`. Import what you need at the top of
your function or module — `mean_variance.py`:

```python
def mean_variance(data, start_date, end_date, lookback, risk_aversion):
    import numpy as np
    import cvxpy as cp

    rets  = data.pct_change().dropna().tail(lookback)
    mu    = rets.mean().values
    Sigma = rets.cov().values

    w = cp.Variable(len(mu))
    problem = cp.Problem(
        cp.Maximize(mu @ w - risk_aversion * cp.quad_form(w, Sigma)),
        [cp.sum(w) == 1, w >= 0],
    )
    problem.solve(solver=cp.CLARABEL)   # deterministic solver — see note below

    weights = dict(zip(data.columns, np.asarray(w.value).round(4)))
    # ... fold weights into a signal dict keyed by date ...
```

> [!NOTE] Same versions everywhere your code runs
> Each library is installed at the same pinned version in every place Fintela executes
> your code — validation, the sandbox, optimization, and live trading — so an `import`
> behaves identically in all of them. The set is curated rather than open-ended (there's
> no `requirements.txt`): need a library that isn't listed? Ask the Fintela team to add
> it.

> [!WARNING] Keep reruns reproducible
> Fintela re-executes and compares your code across stages, so avoid nondeterministic
> defaults. In `cvxpy`, pass `solver=cvxpy.CLARABEL` — the default `SCS` is stochastic and
> can make reruns diverge. In `scikit-learn`, pass `n_jobs=1` (the optimizer already runs
> trials in parallel) and set any `random_state` you rely on.

## Declaring additional data

`Registry → Strategies → Strategy name → Data`

Beyond raw market prices, a strategy can incorporate **additional data** — sector,
country and index groupings, and platform-curated instrument collections. You opt in to
exactly the context you intend to use in the **Data** settings of the strategy; the
platform then resolves it and supplies it automatically whenever the strategy runs, in a
study or in the sandbox.

> [!NOTE]
> Additional data is a platform-wide capability — fitness functions and risk managers can
> declare it too. See [Data pipelines](/docs/data-pipelines) for the full reference and
> the list of components that support it.

## Validate and save

Every save triggers a live validation run:

### Validation runs

For internal strategies, Fintela executes your Python code against a real slice of market
data using your test parameter values. For external strategies, it sends a real HTTP
request to your endpoint.

### Validation passes

The strategy is saved and appears in the list. Any warnings (e.g. date filtering returned
an empty signal) are shown inline — they don't block saving.

### Validation fails

The error message and full Python traceback appear below the editor. Fix the issue and
click Validate + Save again. The previous saved version (if any) is unchanged.

> [!NOTE] Ticker sample size
> Internal validation runs against a sample of tickers from your org's default data
> cluster. You can shrink this sample via the gear icon in the editor toolbar to speed up
> iteration — use the full dataset for final validation before linking to a study.

## Test in the sandbox

`Registry → Strategies → Strategy name → Sandbox`

The **Sandbox** tab lets you run a full backtest for a specific parameter set before
launching a study. It's useful for confirming your logic produces reasonable results on a
real date range.

1. **Open the Sandbox tab.** Click on a strategy in the list to open its detail view,
   then select the **Sandbox** tab.
2. **Select an asset group and date range.** Choose the market data to run against and
   set start/end dates.
3. **Set parameter values.** Enter concrete values for each parameter — these are fixed,
   not ranges.
4. **Attach a risk manager (optional).** Optionally attach a risk manager to the run —
   pick a built-in rule by name or one from your Registry — to see how the strategy and
   the protection interact before committing to a full study.
5. **Run.** Click **Run simulation**. Results appear as equity curve, trade list, metrics
   summary, and holdings breakdown.

## Editing existing strategies

When you edit a strategy that is already linked to one or more studies, Fintela detects a
**breaking change** if you modify the code or parameters. You'll be presented with three
options:

| Option | What it does |
|---|---|
| Simple save | Save changes to this strategy. Existing studies that haven't run yet will use the new version. |
| Fork as new | Create a new strategy with your changes. Existing studies remain linked to the original, unmodified version. |
| Overwrite and delete | Save changes and delete all existing studies that reference this strategy. Use this when you're confident the old results are no longer relevant. |
