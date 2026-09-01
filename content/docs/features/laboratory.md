---
title: Laboratory
section: Features
sectionOrder: 7
order: 1
published: true
updated: 2026-09-01
summary: An interactive Python notebook workspace for exploring data and testing strategies, fitness functions and risk managers before you save them for real.
keywords: laboratory, notebook, python, session, workspace, editor, sdk, files, catalog, lab
---

The Laboratory is Fintela's interactive workbench for building trading logic. It brings together
your own private files, a live Python notebook, and the editors for
[strategies](/docs/strategies), [fitness functions](/docs/fitness-functions) and
[risk managers](/docs/risk-managers) — all on one screen. Open a notebook, run cells against a live
Python session that remembers your variables between runs, pull in curated market data with a
couple of lines of code, and once your logic works, turn it straight into a strategy or fitness
function without leaving the page. Nothing about this replaces the standalone Strategies, Fitness
Functions and Risk Managers pages — the Lab simply gives you the same editors alongside a
scratchpad to experiment in first.

## Where the Laboratory lives

You'll find the Laboratory under the **More Options** flyout in the sidebar, alongside the other
Registry pages, rather than in the main Registry list itself. See [navigation](/docs/navigation)
for how that flyout works. The Laboratory isn't part of the mobile navigation bar — on a phone
you'll find Portfolios, Markets, Asset Groups, Fitness Functions, Strategies and Studies there, but
not the Lab.

> [!WARNING]
> Bookmarking or sharing a link to a specific notebook or resource inside the Lab won't take you
> back to that exact tab — it opens the Lab with nothing open, same as the plain Laboratory link.
> To get back to something you were working on, open the Lab and click it again in the Explorer.

## Access and the Laboratory lock

The Laboratory is a paid feature. On an account that hasn't unlocked it, the Lab still shows up in
the sidebar — dimmed, with a lock icon and a tooltip reading `Locked — buy tokens to unlock` — so
you always know it exists and how to get it, rather than having it disappear entirely. Opening the
page shows you the real workbench, blurred out behind an overlay:

| Element | What you see |
|---|---|
| Title | `Feature locked` |
| Message | `Buy tokens to unlock this feature.` |
| Button | `Buy tokens` — takes you to your account's token page |
| Caption | `This is a preview — your real data appears once unlocked.` |

Only **running code** is behind that lock. You can browse your files, the Explorer, and the public
catalog, and you can share or fork resources, whether or not the Laboratory is unlocked — the
paywall only stops you from starting a live compute session, since that's the part that costs
tokens to run. If you try to start a session on a locked account, you're told plainly:
`This feature is available on paid accounts. Buy tokens to unlock it.`

Ending, checking on, or keeping alive a session you already started is never blocked, even on a
locked account — a running session bills you per minute, so you should always be able to stop it.

### Permissions

Inside your organization, a handful of plain rules govern who can do what in the Lab:

- Anyone in your organization can see everything in the shared **Resources** list and the public
  catalog they have read access to.
- Sharing a resource publicly, or turning sharing off, requires the same edit permission and
  organization-wide scope you'd need to edit that resource anywhere else in Fintela.
- Forking a public resource into your organization requires create permission for that resource
  type, and counts against your normal creation limits for strategies, fitness functions, or risk
  managers.
- Your private **My Workspace** files (folders, notebooks, and scripts) are visible only to you —
  not even to other members of your own organization.

## The workbench layout

The Laboratory screen is split into three panels:

```text
┌─────────────┬──────────────────────────────────────────┬────────────┐
│  EXPLORER   │  open tabs      [session status]  [New ▾] │  DOCK      │
│             ├──────────────────────────────────────────┤            │
│ My Workspace│   notebook · text file · or a strategy,   │ Variables  │
│  folders    │   fitness function or risk manager editor │ Data &     │
│  notebooks  │                                            │  Resources │
│  files      │                                            │ SDK        │
│ Resources   │                                            │            │
│  Strategies │                                            │            │
│  Fitness    │                                            │            │
│  Risk Mgrs  │                                            │            │
└─────────────┴──────────────────────────────────────────┴────────────┘
```

- **Explorer** (left) — your personal files and folders, plus every strategy, fitness function and
  risk manager your organization can author.
- **Workbench** (centre) — one tab per open notebook, text file, or resource editor, with a status
  chip showing whether your compute session is ready and a `New ▾` menu for starting something new.
- **Dock** (right) — the Variables view, curated data and your resources, and a reference for the
  built-in `lab` toolkit; you can resize it or collapse it out of the way.

With nothing open, the centre pane shows a welcome screen with a `New notebook` button and
shortcuts into Strategies, Fitness Functions and Risk Managers, plus a hint to pick something from
the Explorer or start fresh.

Notebooks and text files keep your place when you switch away and back — your cells, scroll
position, and any code still running stay put. Switching away from a strategy, fitness function or
risk manager editor and back reloads it fresh.

## The Explorer

The Explorer is headed by a globe icon (opens the public catalog — see below), a refresh button,
and a search box. Typing in the search box filters both your workspace and the shared Resources
list at once — matching folders are opened automatically so you can see where the result lives.

### My Workspace

This is your own private area — folders, notebooks and scripts that belong to you and nobody else
in your organization, not even an admin. Use the `+` button or a folder's menu to create a new
folder, notebook, or plain file; every item's menu also lets you rename, move, or delete it.

| Create | What you get |
|---|---|
| Folder | An empty folder you can organize things into |
| Notebook | A new notebook named `Untitled.ipynb`, ready for its first cell |
| File | A plain script named `script.py` |

Moving an item lets you pick any folder except the one you're moving, or one of its own
subfolders — you can't nest a folder inside itself.

> [!CAUTION]
> Deleting a folder deletes everything inside it — every notebook and file it contains. There's no
> undo and no trash to recover from, so double check before you confirm.

### Resources

Below your workspace, the **Resources** section lists everything your whole organization can
author — [strategies](/docs/strategies), [fitness functions](/docs/fitness-functions) and
[risk managers](/docs/risk-managers) — grouped exactly like the standalone registry pages. Items
you created carry a small "created by you" marker, and each one can be toggled to share it with
other organizations through the public catalog.

Built-in risk managers that ship with Fintela can't be opened for editing here, since there's no
code behind them to edit.

> [!NOTE]
> To keep the Lab responsive, each list shows your most recently updated items first and stops at
> 2,000 rows per type — if your organization has more than that, the oldest ones simply won't
> appear in the Explorer (they're still available from the full [registries](/docs/registries)
> pages).

## Compute sessions

Opening the Laboratory starts a personal compute session automatically — a private, live Python
environment reserved for you, separate from everyone else's. While it's warming up, you'll see a
short loading screen (`Preparing your Laboratory…`) that tells you whether it's still starting up
or provisioning your session. You don't have to wait for it: `Continue without waiting` lets you
browse the Explorer and your files right away, since only running code actually needs the live
session.

### Session status

The status chip in the tab bar tells you where things stand:

| Status | What it means |
|---|---|
| Starting… | Your session is being requested and set up |
| Provisioning… | Almost ready — your Python environment is coming online |
| Lab ready | You can run cells |
| Idle | Your session is alive but has been quiet for a while |
| Stopping… | Shutting down after you (or the idle timer) ended it |
| Stopped | No live session — running a cell will request one again |
| Failed | Something went wrong; check the message and try again |

The chip updates on its own, so you don't need to refresh the page to see when your session
becomes ready.

### One session at a time, and how it ends

You only ever have one live session per organization at a time. Reopening the Lab in another tab,
or refreshing the page, reconnects you to that same session rather than starting a second one and
doubling your bill.

| This happens | Here's what you should know |
|---|---|
| You stop touching it | After about 15 minutes with no activity — no cell run and no open Lab tab checking in — your session shuts down on its own. |
| You click `End session` | Your session begins shutting down right away rather than waiting for the idle timer. |
| You close the browser tab | This does **not** stop your session by itself — it keeps running (and billing) until the idle timeout catches it, so it's worth ending it explicitly. |
| It never comes up | If a session gets stuck starting for about an hour, it's marked as failed automatically so it doesn't run up a bill doing nothing. |
| You run out of tokens | Your session is shut down and you'll see a message that it stopped for insufficient tokens. |

> [!TIP]
> Click `End session` when you're done for the day. A live session bills per minute whether or not
> you're actively running cells, and the automatic idle shutdown only kicks in 15 minutes after
> your last activity.

### What a session costs

A live session is billed per minute in tokens, at a rate based on how much compute power it uses.
Once your session is ready, the status chip shows an estimated rate — something like `~40 tok/h` —
treat that number as your live rate, since it's recalculated automatically rather than fixed. See
[tokens and billing](/docs/tokens-and-billing) for how token spending is tracked across the
platform.

## Notebooks

A notebook is a sequence of cells you run one at a time (or all together), each either **code**
(Python) or **markdown** (notes and formatting). Cells share the same running session, so a
variable you create in one cell is still there in the next — you don't need to redefine anything as
you build up an analysis.

A brand-new notebook starts you off with a working example:

```python
# Fintela Laboratory — variables persist across cells.
# Pull curated internal data (no credentials needed):
px = lab.data.prices(["AAPL", "MSFT"], start="2024-01-01", end="2024-06-30")
px.tail()
```

### Toolbar

| Button | What it does |
|---|---|
| `Run all` | Runs every code cell top to bottom (skipping markdown cells); disabled while a cell is already running or your session isn't ready yet |
| `Interrupt` | Stops whatever cell is currently running |
| `Add cell` | Adds a new empty cell |
| `Clear outputs` | Wipes the results shown under every cell, without touching your code |

The right side of the toolbar shows a save indicator — `Saving…`, `Saved`, or a
`Couldn't load — retry` link if your notebook failed to load.

### Working with cells

Each cell has its own small toolbar:

| Control | What it does |
|---|---|
| Run | Runs just this cell (code cells only) |
| Edit / Render | Switches a markdown cell between editing and its formatted view |
| Status indicator | Shows the cell's number and whether it's idle, running, finished, or errored |
| Move up / down | Reorders cells |
| Convert | Switches a cell between code and markdown |
| Compile | Turns this cell's code into a new strategy or fitness function (code cells only) |
| Delete | Removes the cell (you always need at least one) |

| Shortcut | Action |
|---|---|
| `Shift+Enter` | Run the cell and move to the next one, adding a new cell if you're at the end |
| `Ctrl/Cmd+Enter` | Run the cell without moving on |

### Cell output

Results appear beneath a cell as soon as they're available, rather than waiting for the whole cell
to finish — printed output and computed values stream in live while the code runs. If your code
raises an error, you'll see a clean traceback instead of raw output. Very long output is trimmed
automatically after a few hundred lines so a runaway print loop doesn't flood the page, with a note
that older output was truncated.

If you try to run a cell before your session is ready, you're told the session isn't ready yet
rather than the cell silently failing.

### Turning a cell into a strategy or fitness function

Every code cell has a **Compile** button that opens a menu with two options:
`Compile to a Strategy` and `Compile to a Fitness function`. Either one opens a brand-new editor
tab, pre-filled with that cell's code, ready for you to fill in the rest (name, data sources,
parameters) and save. Nothing is created or saved until you save it yourself in that editor —
compiling just gets you started.

> [!NOTE]
> There's no compile option for risk managers — only strategies and fitness functions can be
> created this way from a notebook cell.

## Text files

Opening anything other than a notebook — a plain script, notes, or a data file — gives you a text
editor with syntax highlighting matched to its file type. Python files (`.py`) also get a
`Run in kernel` button that runs the entire file as one block against your live session, with the
results shown underneath.

| File type | Highlighting |
|---|---|
| `.py` | Python |
| `.md` / `.markdown` | Markdown |
| `.json` | JSON |
| `.csv` | Plain text |
| `.sql` | SQL |
| anything else | Plain text |

Only Python files can actually be run — a `.sql` file is highlighted for readability, but the Lab's
session has no database connection to run a query against.

## Saving, autosave, and limits

A new notebook or file starts out as a **scratch** document — it exists only in your browser until
you save it. Click `Save to Workspace` to give it a name and turn it into a real file in
My Workspace.

Once a document is saved, it **autosaves** automatically a couple of seconds after you stop
typing — you never need to remember to hit save. If the same file was changed somewhere else in the
meantime (say, from another browser tab), the Lab reloads the latest version and retries your save
on top of it, so your edits aren't silently lost.

Your unsaved work also survives a page reload or a browser crash: whatever you were typing is kept
locally in your browser until it's properly saved, though this only covers your code and text —
cell output and run status are not preserved this way.

| Limit | What it means for you |
|---|---|
| Notebook or file size | Up to 2 MB per document |
| Names | Must be unique within a folder (case doesn't matter) |
| Items in a list | Explorer and public catalog each show up to 2,000 items per resource type |
| Time per cell | A cell that runs longer than 5 minutes is stopped automatically |
| Running code at once | One cell runs at a time per session; you have one session at a time |

> [!WARNING]
> A file stays read-only for a moment right after you open it, while its content is still loading.
> That's intentional — it stops autosave from overwriting your real file with a blank placeholder
> before the content arrives.

## The right-hand dock

The dock on the right holds three views — Variables, Data & Resources, and the SDK reference — and
can be collapsed or resized to suit how much room you want for your code. It remembers which tab
and width you last used. The first time you open a notebook, it opens automatically to Variables so
you know it's there; after that, it stays out of the way until you open it yourself.

### Variables

A live list of everything currently defined in your session, refreshed automatically after every
cell run (or on demand with `Refresh`). Each row shows a variable's name, its type, and a short
summary of its value — handy for keeping track of what you've computed without scrolling back
through old cells.

Clicking a variable inserts its name into whichever notebook cell you're editing; with no cell
selected, it copies the name to your clipboard instead.

### Data & Resources

This tab has two parts. **Curated data** lists the datasets you can pull into a notebook — click
`Insert` next to one and a ready-to-run snippet drops into your current cell. Today that's:

| Dataset | What you get |
|---|---|
| Adjusted prices | A daily closing-price table (dates as rows, tickers as columns), already adjusted for splits and dividends, for up to 500 tickers |

**Your resources** lists your organization's strategies, fitness functions and risk managers so you
can jump straight into editing one without going back to the Explorer.

### SDK

A quick reference for everything the built-in `lab` toolkit can do — each entry shows how to call
it, what it returns, and an `Insert` button to drop a working example into your cell. This
reference works even before your session is ready, so you can browse it while you wait.

## The lab toolkit and curated data

Every notebook starts with a small toolkit called `lab` already loaded, so you can pull real market
data into a cell without setting up any connection or credentials yourself.

| Call | What it gives you |
|---|---|
| `lab.data.prices(tickers, start, end)` | A pandas DataFrame of daily adjusted close prices, dates as rows and tickers as columns |
| `lab.data.datasets()` | The list of datasets currently available (today, just `prices`) |

| Parameter | What to pass |
|---|---|
| `tickers` | A list of ticker codes, e.g. `["AAPL", "MSFT"]` — up to 500 |
| `start` | The first date you want, as `YYYY-MM-DD` |
| `end` | The last date you want, as `YYYY-MM-DD` |

```python
px = lab.data.prices(["AAPL", "MSFT"], start="2024-01-01", end="2024-06-30")
px.tail()
```

This is the same price data your strategies and fitness functions see when they actually run — what
you explore in a notebook matches production exactly, so a signal that works here will behave the
same way live. A couple of details worth knowing: a price of zero is treated as missing rather than
real, and gaps in the middle of a ticker's history are filled forward from its last known price —
but gaps at the very start or end of your date range are left as missing, since there's nothing to
fill them from.

### Limits on what you can pull

To keep the Lab fast and responsive for everyone, every data request has to stay within a few
bounds — this is meant for exploring an idea, not for running a full historical backtest (that's
what a [study](/docs/studies) is for):

| Limit | Rule |
|---|---|
| Dataset | Only `prices` is available today |
| Tickers | At least one, and no more than 500 |
| Dates | Both a start and end date are required — you can't request an unbounded history |
| Date order | The end date must be on or after the start date |
| Total size | Tickers × days can't exceed 2,000,000 data points |

If a request goes over one of these limits, you'll get a clear message telling you which limit was
hit and how to narrow your request — for example, shortening the date range or trimming your ticker
list.

### What's available inside a notebook

Your notebook's Python environment ships with the same well-known data and numerical libraries used
everywhere else in Fintela — pandas, NumPy, SciPy, scikit-learn, statsmodels, technical-analysis
helpers, and an optimization library — plus Fintela's own building blocks for working with asset
universes and lookback windows. That means code you write and test in the Lab runs against the
exact same stack your strategies and fitness functions use once deployed, so there are no surprises
when you move from exploring to production.

## Publishing and forking through the public catalog

Click the globe icon in the Explorer to open the **Public catalog** — resources other
organizations have chosen to share, that you can copy into your own organization to use as a
starting point. You'll only see the resource types you already have access to.

### Sharing your own work

On any strategy, fitness function or risk manager you created, toggle the globe icon to publish it
to the catalog (or take it back down again). Publishing something makes its logic visible to other
Fintela customers, so only share what you're comfortable putting in front of others.

### Forking someone else's

Click `Fork` on a catalog item to copy it into your own organization. It becomes fully
independent — later changes the original author makes never affect your copy, and changes you make
never affect theirs. Forking counts toward your organization's usual creation limits for that
resource type, so it can be blocked if you've already hit your plan's limit.

| Resource | What comes across when you fork it |
|---|---|
| Strategy | Its description, logic, parameters, lookback settings, named tickers, and data-source selections |
| Fitness function | Its description, logic, parameters, and data-source selections |
| Risk manager | Its description, kind, logic, parameters, and data-source selections |

If a forked resource pointed at a [portfolio group](/docs/portfolio-groups) that belongs to the
original author's organization, that reference is dropped rather than copied across — you'll need
to point it at one of your own.

Your copy is automatically named "Fork of" followed by the original name (with a number appended if
you already have one by that name).

> [!NOTE]
> In the rare case two people fork the same resource into the same organization at the exact same
> moment, one of them may need to just try again.

## Authoring registry resources here

Opening a strategy, fitness function or risk manager from the Explorer gives you the exact same
editor you'd get from its standalone page — just without the surrounding page chrome. Everything
documented for that editor (the code editor, data-source picker, parameters, validation) works
exactly the same way inside the Lab, and saving here saves the real thing, not a draft copy.

In other words, the Laboratory is a convenient way to work, not a separate way of building things.
Use it when you want a scratchpad open next to your editor; use the standalone
[Strategies](/docs/strategies), [Fitness Functions](/docs/fitness-functions) and
[Risk Managers](/docs/risk-managers) pages when you want the full list, filters, and row actions.
See [registries](/docs/registries) for those pages, and [execution modes](/docs/execution-modes)
for how resources that run inside Fintela differ from ones that run on your own systems.

> [!NOTE]
> A resource that runs on your own infrastructure can still be *edited* here like any other row —
> but the Lab's compute session never actually runs it. See
> [external strategies](/docs/external-strategies) and
> [external fitness](/docs/external-fitness) for how that works.

## What the Laboratory does not do

- **It doesn't remember where you were.** Links to a specific notebook or resource always open the
  Lab fresh, with nothing selected — reopen what you need from the Explorer.
- **It doesn't share your private files.** My Workspace belongs to you alone; only the Resources
  section is visible to your whole organization.
- **It doesn't give notebooks unrestricted data access.** You can only pull the curated, bounded
  datasets described above — not arbitrary queries against Fintela's data.
- **It doesn't compile cells into risk managers.** Only strategies and fitness functions can be
  created this way.
- **It doesn't include Data Pipelines anymore.** That feature has been retired — a strategy,
  fitness function or risk manager now picks its data sources directly inside its own editor. An
  old bookmark to Data Pipelines redirects you to the [Data Explorer](/docs/data-explorer) instead,
  which is itself a separately unlockable feature.
- **It isn't where you run a full backtest.** A notebook is for quick exploration under the data
  limits above; batch testing across history belongs in a [study](/docs/studies) — see the
  [end-to-end workflow](/docs/end-to-end-workflow) for how the pieces fit together.
