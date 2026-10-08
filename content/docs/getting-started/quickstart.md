---
title: Quickstart
section: Getting Started
sectionOrder: 1
order: 5
published: true
updated: 2026-10-08
summary: Ask Fintelligent to build your first study, review each piece, launch it, and read the results, in about five minutes of your time.
keywords: quickstart, tutorial, first study, getting started, fintelligent, ai assistant, first strategy, first results, first run
---

This is the fastest way to see Fintela do real work for you. You ask
[Fintelligent](/docs/fintelligent), the assistant built into the app, to build a universe of
tickers, write a small trading strategy, and set up a twenty trial optimization. It fills in the
real editors for you; you review each one and click **Confirm**. Then you launch the study and ask
Fintelligent what came out of it.

Three messages build and launch the study, and one more reads the results. That fits inside the free
daily allowance, and nothing is saved or charged without your click.

## What you will build

The same three building blocks the [hands on quickstart](/docs/quickstart-python) builds by hand,
plus a built in scoring function you pick from a list. All four live as reusable entries in your
[registry](/docs/registries), so they're available for every future study too.

```text
  Asset Group            Strategy              Fitness (built-in)
  12 US tickers        momentum top N              sharpe_ratio
  the universe        the signal rule            the objective
       └────────────────────┴──────────────────────────┘
                            ▼
                          Study
          20 trials · 5-year window split
                  train / validation / OOS
                            ▼
                   up to 20 portfolios
              ranked on the Portfolios Dashboard
```

## Before you start

| Requirement | Where it is covered |
|---|---|
| A signed in account inside an organization | [Account setup](/docs/account-setup) |
| An **Owner** or **Manager** role. Fintelligent isn't available to **Analyst** accounts | [Fintelligent](/docs/fintelligent#who-can-use-it) |
| Fintelligent messages. Without purchased tokens you get **10 free messages per day**; this page uses four | [Fintelligent](/docs/fintelligent#who-can-use-it) |
| A nonzero Fintela Token balance to launch the study. Saving a draft costs nothing | [Tokens & billing](/docs/tokens-and-billing) |
| Free plan room: one asset group slot, one strategy slot and one study slot | [Tokens & billing](/docs/tokens-and-billing) |

> [!NOTE]
> Fintelligent works through the same screens you would use yourself. When it builds something, it
> opens the real editor, fills it in, runs the same checks the Save button runs, and stops at the
> confirmation dialog. **You** click Confirm. See
> [the confirmation model](/docs/fintelligent-drafts-and-runs#the-confirmation-model).

## Step 1: Open Fintelligent

In the sidebar, open **More Options** and click **Fintelligent**, the last entry. The full page
chat opens with a blank conversation. On desktop you can also use the launcher button at the bottom
center of any page, which opens the same chat as a floating panel.

Keep this page open beside the app: each step below gives you a message to paste into the chat.

## Step 2: Build the asset group

An [asset group](/docs/asset-groups) is a frozen list of instruments. Send:

```text
Create an asset group called "Quickstart US large caps" with these twelve tickers:
AAPL, MSFT, NVDA, AMZN, GOOGL, META, JPM, JNJ, XOM, PG, KO, WMT.
Description: "Twelve large cap US names for the quickstart."
```

Fintelligent takes you to the asset group builder, selects the twelve tickers, and opens the
**Confirm Action** dialog with the name and description filled in. Check the selection rail reads
**12 selected**, then click **Confirm**.

The status line above the message box reads **"Waiting for you to confirm: the Save dialog is
open"** until you do. Nothing is saved before that click.

## Step 3: Write the strategy

A [strategy](/docs/strategies) is one Python function that returns a signal. You describe the
rule; Fintelligent writes and validates the code. Send:

```text
Write an internal strategy called momentum_top_n. On each date, rank the asset group
by its return over the last `lookback` trading days, keep only names with positive
momentum, and hold the `top_n` best, equally weighted, long only.
Make lookback and top_n integer parameters with test values 60 and 10.
Validate it, then open it for me to save.
```

You'll see the status line move through **"Writing the code…"** and **"Validating…"**. Then the
strategy editor opens with the code and both parameters filled in, followed by the naming dialog.
Read the code before you confirm: it is yours from here on, and every study that uses it runs
exactly this version.

> [!TIP]
> If validation fails, the dialog never opens. Fintelligent sees the failure, fixes the code and
> validates again. A save only goes through for code that passed validation within the last hour
> with the same parameters.

## Step 4: Set up and launch the study

A [study](/docs/studies) pairs the strategy with the asset group and a scoring function, then
searches the parameters. Send:

```text
Set up a study called "Quickstart momentum" using momentum_top_n on Quickstart US
large caps, with sharpe_ratio as the fitness function and 20 trials.
Optimize lookback from 20 to 120 and top_n from 5 to 15.
Use the default five year window with an out of sample period.
Show me the token cost before anything launches.
```

Fintelligent fills in the study builder and opens the **Confirm your study** dialog. Check the
recap: **Study name**, **Asset group**, **Strategy**, **Fitness**, **Trials** (20), **Data range**
and **Out of sample** (**Included**). The **Cost** block shows the total and your balance.

| Button | What it does |
|---|---|
| **Save & Launch** | Saves the study and starts the run. Tokens are charged now; whatever the run doesn't use is refunded when it finishes |
| **Save Draft** | Saves the study without launching or charging anything. Launch it later from the registry |
| **Cancel** | Saves nothing |

Click **Save & Launch**. A small run chip follows you around the app while the study is queued and
running, and the study's **Status** in the registry moves **Queued** → **Running** → **Completed**.

> [!WARNING]
> Launching is the one step in this guide that spends Fintela Tokens. Asking for the cost first,
> as the message above does, means you always see the number before you decide.

## Step 5: Ask what came out of it

Once the status reads **Completed**, go back to the conversation and send:

```text
Summarize the results of Quickstart momentum: the best trial and its parameters,
how it did on train versus out of sample, which parameter mattered most,
and whether it looks overfit.
```

Fintelligent reads the study's optimization history, parameter importances and overfitting
diagnostics, and answers in the chat. The tool chips at the top of its reply name each thing it
looked at. It doesn't show citations, so if a number matters, ask which trial it came from.

To see the same results on screen, click the study in the registry, then **View**. The
[Portfolios Dashboard](/docs/portfolios-dashboard) opens with your study selected and its top ten
trials ranked. Switch **Rank by** between **Train**, **Val** and **OOS**: a parameter set that leads
on Train and falls apart on OOS is exactly what the split is there to catch. With only twenty trials,
treat every verdict as provisional and give the next study a bigger budget.

## If something goes wrong

| Symptom | What it is |
|---|---|
| **Fintelligent** isn't under **More Options** | Your role is **Analyst**. Ask an Owner to change it, or follow the [hands on quickstart](/docs/quickstart-python), which works for every role that can create a study |
| The message box is locked with a note that your limit resets tomorrow | You've used the 10 free daily messages. Buy tokens from the **"Buy tokens"** button, or pick up tomorrow; everything you saved so far stays |
| The status line reads **"Paused, didn't finish"** | The turn stopped short. Click **Continue** |
| A confirmation dialog never opens | The editor's checks failed. Fintelligent tells you why in the chat and tries again; nothing was saved |
| **Save & Launch** is disabled | Your balance doesn't cover the cost, or the strategy can't run on the selected data. **Save Draft** still works. See the [hands on quickstart](/docs/quickstart-python#if-something-goes-wrong) for every reason |
| The status badge reads **Failed** | Ask Fintelligent why the study failed. **Failed** is not resumable: duplicate the study and launch again |

## Prefer to write the code yourself?

The [hands on quickstart](/docs/quickstart-python) builds the same study screen by screen, with
the strategy code ready to paste. It is the better path if you want to learn every field in the
builders, or if your role doesn't include Fintelligent.

## Where to go next

| Page | Why |
|---|---|
| [Fintelligent capabilities](/docs/fintelligent-capabilities) | Everything Fintelligent can read, build and change for you |
| [Drafts and runs](/docs/fintelligent-drafts-and-runs) | How its edits get reviewed and saved, and how to follow a run |
| [End to end workflow](/docs/end-to-end-workflow) | The same path taken all the way to a deployed portfolio group |
| [Studies](/docs/studies) | Every field on the study canvas and how a study is validated before it launches |
| [Analyzing results](/docs/analyzing-results) | Reading a study's output properly, including overfitting |

> [!TIP] Need a walkthrough?
> Thirty minutes on your own strategies with the team that built the platform:
> [book a walkthrough](/contact).
