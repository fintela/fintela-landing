---
title: Quickstart
section: Getting Started
sectionOrder: 1
order: 3
published: true
updated: 2026-08-04
summary: From a blank account to your first optimization results in under ten minutes — strategy creation, running a study, and reviewing the output.
keywords: first study, getting started, tutorial, hello world, quickstart
---

From a blank account to your first optimization results in under ten minutes. This
guide walks through the app — strategy creation, running a study, and reviewing the
output. Pulling those results back out over the read-only API is at the bottom.

## Overview

Four steps, two of which are optional for going live:

```text
1. Create a strategy          (Registry → Strategies)
2. Run an optimization study  (Registry → Studies → + New Study)
3. Inspect the results        (Analytics → Portfolios)
4. Go live — optional         (Portfolio Manager → Operations)
```

> [!NOTE] Already have an asset group?
> Studies run on a universe. You can build an asset group — a saved set of tickers
> and date range (**Data → Markets → + New Cluster**) — or, in the study builder,
> just pick a **pre-built grouping** (the Sector ETFs, an index like the S&P 500, a
> sector or country) and skip cluster creation entirely. The rest of this guide
> assumes a universe is ready.

## 1. Create a strategy

`Registry → Strategies → + New Strategy → Internal`

A strategy is a Python function that receives market data and returns a signal map —
which tickers to hold, in what direction, and at what allocation.

### Open Registry → Strategies

Click **Registry** in the left sidebar, then **Strategies**. Click
**+ New Strategy** in the top right and choose **Internal**.

### Name it and add parameters

Give it a name like `roc_top_n` (lowercase, underscores only). Add the parameters
the optimizer will sweep — for example:

| Parameter | Type | Description |
|---|---|---|
| `n_top` | Integer | Number of top tickers to hold. |
| `roc_window_size` | Integer (window) | Look-back window for rate-of-change. Mark "Window size" so the optimizer constrains it to available data. |
| `freq` | Integer | Rebalancing frequency in trading days. |

### Write the Python code

The editor is pre-filled with a template that matches your parameters. A minimal
implementation — `roc_top_n.py`:

```python
def roc_top_n(data, start_date, end_date, n_top, roc_window_size, freq):
    import pandas as pd
    roc = data.pct_change(periods=roc_window_size)
    dates = [d for d in roc.index.astype(str) if start_date <= d <= end_date]
    signal = {}
    for date in dates[::freq]:
        top = roc.loc[date].nlargest(n_top).index.tolist()
        alloc = 1.0 / len(top)
        signal[date] = {t: {"position": "L", "allocation": alloc} for t in top}
    return signal
```

### Validate and save

Click **Validate + Save** (or press `Cmd+S`). Fintela runs your code against a small
real data slice using your test parameter values. If it passes, the strategy is saved
and ready to link to a study.

> [!TIP]
> Use the **Sandbox** tab on the strategy detail page to run a full backtest with
> fixed parameter values before launching a study. It's a fast sanity check.

## 2. Run an optimization study

`Registry → Studies → + New Study`

A study is a parameter sweep — it runs your strategy many times with different
parameter combinations to find the best-performing configuration.

### Open Registry → Studies → + New Study

The study creation wizard opens. It has 5 steps you can navigate freely before
creating.

### Step 1 — Strategy & fitness

Select your `roc_top_n` strategy. For fitness, choose any internal fitness
function — `sharpe_like` is a good default.

### Step 2 — Data & dates

Select your universe — your asset group, or a pre-built grouping like the Sector ETFs
or the S&P 500. Set a start date and end date. Leave the train split at 70% for now —
this gives you a validation window automatically.

### Step 3 — Sampler

Leave the sampler as **TPE** (default). Set `n_trials` to **50** for a quick first
run.

### Step 4 — Parameter search space

Set the min/max range for each parameter (all three are integers here — categorical
parameters would show their declared choices instead, and any parameter can be fixed
to a single value):

| Parameter | Min | Max |
|---|---|---|
| `n_top` | 1 | 10 |
| `roc_window_size` | 5 | 60 |
| `freq` | 1 | 5 |

### Step 5 — Review & create

Review the summary card, then click **Create study**. The study is queued immediately
and starts as soon as a worker is available — usually within seconds.

Watch the progress bar on the study detail page. With 50 trials and a small dataset,
expect it to complete in a few minutes.

## 3. Inspect results

`Analytics → Portfolios`

Once the study reaches **COMPLETED**, every trial appears as a portfolio in the
Analytics section.

### Open Analytics → Portfolios

Select your study from the filter dropdown at the top.

### Sort by Sharpe or CAGR

Click a column header to sort. Find the trial with the best balance of return and
risk — not just the highest raw return.

### Open the portfolio detail

Click any row. Review the equity curve, drawdown chart, trade log, and the exact
parameter values used.

### Overlay multiple portfolios

Check the checkbox column on multiple rows to overlay their equity curves in the
chart below — useful for comparing parameter sensitivity.

> [!TIP]
> Switch to **Pivot view** to see which parameter ranges produced the best results
> across all 50 trials. This guides the bounds for your next, more focused study.

## 4. Go live (optional)

When you've found a parameter set you're confident in, you can promote it to a live
portfolio and trade it through your connected brokerage.

### Promote the portfolio

In the portfolio detail view, open the action menu and click **Promote**. This marks
the trial as your chosen production configuration.

### Connect your brokerage

Go to **Account settings → Broker connections → Connect your brokerage**. Link your
account with **Connect with your brokerage**, and pick the **Paper** environment —
every operation on that connection inherits it.

### Start an operation

Open **Portfolio Manager → your basket → Operations → Trade with your brokerage**.
Pick the connection and the capital to commit, then click **Launch**.

See [Live trading](/docs/live-trading) for the full walkthrough including monitoring,
stopping, and risk considerations.

## Reading results from the API

Strategies, studies and portfolios are created and controlled in the app — that's
where the work you're billed for is metered. The developer API is **read-only**:
every endpoint is a `GET`, and it exists so you can feed finished results into your
own notebooks, dashboards and pipelines.

Poll a study's completion fraction while it runs:

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/studies/progress?study_ids=42"
```

```json
{
  "data": {
    "42": 0.64
  }
}
```

Then list the trials it produced:

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/v2/trials?study_name=roc_top_n_q1"
```

> [!NOTE]
> See the [API reference](/docs/api-overview) for authentication, every available
> endpoint, and error codes.

## What's next

| Page | What it covers |
|---|---|
| [Managing strategies](/docs/managing-strategies) | Strategy types, parameters, validation, and the sandbox. |
| [Running optimizations](/docs/running-optimizations) | Full study wizard walkthrough — all 5 steps explained. |
| [Analyzing results](/docs/analyzing-results) | Portfolio dashboard, pivot table, equity charts, custom date windows. |
| [External strategies](/docs/external-strategies) | Host your signal logic on your own server. |
| [Sampler selection](/docs/sampler-selection) | TPE, CMA-ES, Random — which to use and when. |
