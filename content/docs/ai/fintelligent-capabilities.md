---
title: Fintelligent Capabilities
section: Artificial Intelligence
sectionOrder: 6
order: 2
published: true
updated: 2026-09-01
summary: Everything Fintelligent can do for you inside Fintela, and exactly where it needs your confirmation before anything changes.
keywords: capabilities, permissions, confirmations, creating strategies, launching studies, editing risk managers, reading portfolios, limits
---

Fintelligent can take around 190 distinct actions across the platform, organized into the categories
covered on this page. It can never invent an action outside this fixed list: everything it does is
one of the capabilities described below. Most of what it can do (164 actions) is pure lookup: reading
your studies, portfolios, market data, and more. A much smaller set (30 actions) can actually create,
change, or delete something in your account. This page walks through every category, says what each
one touches, and (most importantly) tells you exactly where Fintelligent needs your click before
anything is saved, and where it does not.

> [!CAUTION]
> Not every change Fintelligent makes shows you a confirmation dialog first. When it fills in one of
> Fintela's own editors (for a strategy, study, fitness function, risk manager, or asset group) it
> always ends by asking you to click Confirm before anything is saved. But a faster, direct path
> (creating a strategy, creating or launching a study, deleting something, or changing a portfolio
> group) saves immediately, with no dialog. Fintelligent is instructed to tell you in chat what it's
> about to do before it takes that kind of action, but nothing forces it to wait for your reply first,
> so always read that message before assuming it's asking permission. See
> [Which actions need your confirmation](#which-actions-need-your-confirmation) below for exactly
> which is which.

## How Fintelligent's actions work

### What it can touch

Every action Fintelligent can take falls into one of a few categories:

- **Actions on your account data.** The vast majority of what Fintelligent does (reading your
  studies, strategies, portfolios, and market data, and making the small set of changes described
  below) uses exactly your own permissions. It can never see or touch anything in Fintela that you
  personally couldn't see or touch yourself.
- **General reference lookups.** A handful of actions look up platform reference material
  (available metrics, samplers, worked examples) that isn't tied to your account and never touches
  your data.
- **Actions on your screen.** Some actions play out visibly in your browser, the same way your own
  clicks would: opening an editor, filling in a field, navigating to a different page. Because these
  happen in your browser rather than landing straight in the database, Fintelligent doesn't get
  instant proof they worked: it only knows for sure once you complete a save.
- **Behind-the-scenes organizing.** For more complex requests, Fintelligent may organize its own
  work internally: for example, loading a checklist for a particular kind of task, or handing part
  of the request to a specialist. None of this touches your data on its own.
- **Reading exactly what's on your screen.** One action re-runs the same query that's already
  producing what you're looking at, so anything Fintelligent tells you about that screen can't drift
  from what's actually shown.

### Focused specialists for complex requests

For simple questions, Fintelligent answers directly using its everyday set of lookup actions. One
change (deriving a new asset group from an existing grouping) is available to it immediately too,
without any extra setup, since it's low-risk and easy to reverse.

For anything more involved (writing a new strategy, launching a study, editing a risk manager, and
so on), Fintelligent first loads the matching checklist for that kind of work: one for strategies,
one for studies, one for risk managers, one for fitness functions, one for asset groups, plus
checklists for troubleshooting and for building reports. Loading the right checklist is what unlocks
the ability to open editors, fill them in, and request a save. Once loaded, a checklist stays active
for the rest of that conversation: it also loads automatically if you already have the matching
editor open, or if a previous attempt to save just failed validation.

For research-heavy questions, Fintelligent may hand part of the work to a focused specialist: one
for studies, one for strategies, one for fitness functions and risk managers, one for asset groups,
one for portfolio groups and broader portfolio analysis, one for general research across the
platform, and one specifically for your live-traded portfolios. The two focused on general research
and on live trading are read-only by design, no matter how the request is phrased: they can never
create, change, or delete anything. A specialist also never sees your whole conversation; it only
sees the specific piece of work handed to it, so it stays scoped and returns a focused answer.

A few rules always hold, no matter how a request is phrased:

- Fintelligent can never navigate your screen, open an editor, or ask you a question through anything
  other than its direct connection to your browser: a specialist working in the background can't do
  any of that.
- Handing work off to a specialist is read-only by default. It has to be specifically marked as
  allowed to write before that piece of work can change anything.
- Fintelligent can never create, update, or delete a strategy, study, fitness function, risk manager,
  or asset group on its own initiative: that always goes through either the on-screen editor (with
  your Confirm click) or a specialist explicitly allowed to write.

### Every action is logged

Every change Fintelligent makes to your account (creating, editing, or deleting a strategy, study,
fitness function, risk manager, asset group, or portfolio group) is permanently recorded: who
requested it, when, and exactly what changed. That record can never be edited or deleted afterward,
so it stays a reliable history of what the assistant did on your behalf. Plain lookups aren't logged
this way, since they don't change anything.

If you press Stop or close the tab while Fintelligent is in the middle of saving something, the save
is not cancelled: it keeps running in the background for a short grace period. If Fintelligent can't
confirm the outcome before it has to answer, it tells you plainly that the change may or may not have
gone through, rather than staying silent, so you always know to go check.

When a single request involves more than one change, those changes are applied one at a time, in
order, so an earlier failure can't be skipped over. Ordinary lookups within the same request can run
in parallel, since there's no risk of one interfering with another.

## Everything Fintelligent can do, at a glance

| Area | Actions | Can create or change something | What it covers |
|---|---:|---:|---|
| Portfolio analysis & portfolio groups | 46 | 4 | Trial-portfolio metrics, equity, holdings, lineage, overfitting, what-if previews, cross-study rankings, portfolio groups, and managed portfolios |
| Market | 24 | 0 | Market overview, indices, sectors, countries, per-ticker prices, financials, sentiment, insider activity, analyst ratings, corporate actions, rates, news |
| Studies | 19 | 5 | Listing, metadata, progress, errors, clustering, parameter importance, overfitting, comparisons, cost previews, plus creating, launching, stopping, resuming, and duplicating |
| Data Explorer | 17 | 0 | Data catalog, dataset summaries and coverage, feature series, raw rows, rates, macro series, calendars, symbol changes, metadata fields |
| Asset groups | 15 | 5 | Universes, date coverage, metadata quality, compatibility checks, groupings, plus creating, updating, deleting, and duplicating |
| Risk managers | 12 | 5 | Your own and the public library, quotas, versions, previews, plus creating, updating, deleting, duplicating, and forking |
| Reference and knowledge | 11 | 0 | Data sources, built-in risk managers, reference building blocks, worked examples, resource requirements, metrics, samplers, benchmarks, a workspace snapshot |
| Strategies | 9 | 4 | Listing, metadata, declared parameters, versions, previews, plus creating, updating, deleting, and duplicating |
| Tickers | 9 | 0 | Symbol lookup, search, snapshots, indices, constituents, time series, exchanges, filter values |
| On-screen actions | 8 | 2 | Navigation, editor writes, opening editors, save requests, question cards, PDF reports, on-screen command batches |
| Fitness functions | 8 | 4 | Listing, metadata, versions, previews, plus creating, updating, deleting, and duplicating |
| Checking your code | 7 | 0 | The checks run on your own code, external connections, and built-in resources before anything can be saved |
| Screener | 3 | 0 | Filter options, match counts, match results |
| Saved drafts | 2 | 1 | Reading and saving your in-progress authoring work |
| Behind-the-scenes organizing | 2 | 0 | Loading a checklist for a task, handing work to a specialist |
| Long-running checks | 1 | 0 | Waiting on a check that takes a moment to finish |
| Re-reading your screen | 1 | 0 | Re-running the query behind whatever you're currently looking at |
| Live brokerage | 0 | 0 | Intentionally empty: no live-brokerage action exists yet |
| **Total** | **194** | **30** | |

## Actions that change your data

### What Fintelligent can create, edit, or delete

| What you're working with | What Fintelligent can do to it |
|---|---|
| Strategy | Create, fully update, delete, or duplicate |
| Fitness function | Create, fully update, delete, or duplicate |
| Risk manager | Create, update, delete, duplicate, or fork a public one into your own library |
| Asset group | Derive one from a study's universe or from a grouping, fully replace its ticker universe, delete, or duplicate |
| Study | Save, launch (this is the one that spends Fintela tokens and starts the optimization), stop, resume with more trials, or make a config-only duplicate |
| Portfolio group | Create from a set of portfolios, partially update, delete, or refresh its member data |
| Your in-progress draft | Save your work-in-progress on a strategy, study, fitness function, risk manager, or asset group, so it survives you navigating away or closing the tab |

Every one of these persists immediately when Fintelligent acts on it directly: there is no separate
confirmation dialog on this path. The next section explains when that direct path is used instead of
the editor, and how to tell which one you're getting.

Creating a portfolio group with a paid allocation method also charges to unlock that method at the
moment of creation; if your balance can't cover it, the creation is declined rather than partially
applied.

> [!WARNING]
> Launching a study (whether by saving one with "launch now" turned on, or launching an existing
> saved study) spends **Fintela tokens**, the platform's compute currency, and starts the
> optimization running. You can always see the cost ahead of time: ask Fintelligent to preview the
> cost of a new configuration or of a saved study before you commit (previewing never creates
> anything or spends any tokens) but Fintelligent isn't required to show you that number before it
> launches something, so ask for it yourself if you want to see it first.

### Which actions need your confirmation

There are two ways an object gets created, edited, or deleted, and only one of them ends in a dialog.

| | Through the editor | Fintelligent acting directly |
|---|---|---|
| What happens | Fintelligent opens the real editor for that object and fills it in, exactly as if you had | Fintelligent creates, updates, or deletes the object without opening anything on screen |
| What you see | The actual editor, filled in, followed by the same Save confirmation dialog you'd see doing it by hand | Nothing on screen until it's already done |
| Who actually saves it | **You**, by clicking Confirm | Fintelligent, on its own |
| While you wait | A clear "waiting for you to confirm" status | No waiting step at all |
| When it's used | The default, safer path | Meant for when you've explicitly asked to skip the editor |

Requesting a save through the editor path always runs the same checks your own Save button would,
then stops there: it never persists anything by itself. For a study specifically, this step never
saves anything on its own: it opens the review dialog showing you the token cost, so you're the one
who decides to confirm or cancel the launch.

Running a batch of on-screen commands works the same way: its save step opens the same confirmation
dialog and waits for you, and its launch step doesn't launch anything directly: it takes you to the
study's page so you can confirm there yourself.

There's one more safeguard that applies no matter which path is used. Before a strategy, fitness
function, or risk manager written in your own code can be saved, that exact code has to have already
passed a validation check: and that check has to be recent (within about an hour) and match the
exact parameter values and code being saved. If the code changed, the parameters changed, or the
validation used a different date window than the save, the save is refused and Fintelligent has to
re-validate first.

## Working directly on your screen

Eight actions play out visibly in your browser, the same way your own clicks would. These are the
only actions that can navigate you somewhere, open an editor, ask you a question, or hand you a
generated PDF: no specialist working in the background can do any of these. Three of them pause the
conversation and wait for something from you (either your click or your answer) before Fintelligent
continues.

| Action | Waits for you? | Can change something? | What it does |
|---|---|---|---|
| Go to a page | no | no | Moves you to a different section of the app |
| Fill in an editor | no | no | Writes one field, or several at once, into whatever editor is currently open on your screen |
| Open an editor or trigger a row action | no | **yes** | Opens a create/edit editor, or triggers an action tied to a row in a list |
| Request a save | **yes** | no | Runs the same checks a real Save would, then opens the Confirm dialog for you |
| Ask you a question | **yes** | no | Shows a question card with a few choices and waits for your answer |
| Generate a PDF report (study) | no | no | Puts together a PDF report about a study, right in your browser |
| Generate a PDF report (portfolio) | no | no | Puts together a PDF report about one of your trial portfolios, right in your browser |
| Run a batch of on-screen commands | **yes** | **yes** | Runs a short sequence of the actions above in order, stopping the moment one of them fails |

### Moving you around the app

Fintelligent can take you straight to any of the app's main sections: your studies list, your
portfolios, the portfolio manager, markets, the Data Explorer, portfolio groups, the Fintelligent
chat itself, strategies, fitness functions, asset groups, risk managers, the laboratory, or your
account page.

**Limit.** It can only send you to one of these top-level pages: it can't yet deep-link you straight
to one specific record within a page, like one particular study. If a feature on a page is locked for
your plan, you still land there and see the locked preview rather than being blocked from navigating.

### Filling in an editor for you

Once an editor is open on your screen (for a strategy, a fitness function, a risk manager, an asset
group, or a study), Fintelligent can type values into its fields for you, one at a time or several at
once, exactly as if you'd typed them yourself. Nothing it writes this way touches your account until
you actually confirm the save; it's all still sitting in the open, unsaved editor.

**Limits.** It can only fill in fields that editor actually has, so it won't invent or attempt to set
something outside the form. If no editor happens to be open yet, or it's ambiguous which of two open
editors to write into, the write is held for about 15 seconds waiting for the right editor to open: past that it's dropped, and if you then ask Fintelligent to save, it tells you plainly that some of
what it meant to write never arrived, rather than saving incomplete data silently.

### Opening an editor or triggering a row action

This is the one on-screen action that's tracked in your account's action history, because it's the
one that can ask your screen to open something for creating or editing, or to trigger an action tied
to an existing row in a list.

Opening the create or edit editor works for strategies, fitness functions, risk managers, asset
groups, and studies. Duplicating works the same way for everything except risk managers.

Deleting, stopping, and resuming, though, are deliberately left to you: even if Fintelligent tries to
trigger one of those directly, nothing happens: those stay as buttons on the list pages themselves,
each with its own confirmation dialog, so an irreversible action always requires your own click on
your own screen.

### Requesting a save

Before anything gets saved through the editor path, Fintelligent can request a save on your behalf: which runs exactly the same checks your own Save button would, and then stops to show you the Confirm
dialog. It never persists anything by itself.

If something's not right, Fintelligent tells you plainly what's wrong rather than reporting a generic
error: for example, that the editor wasn't open to begin with, that it was still loading its
reference data, that some of the fields it tried to write never actually landed, that the editor
changed under it, that there's an existing unreviewed draft you need to keep or discard first, or that
the code itself failed validation.

For an asset group, there's no code to check: the request just validates the universe you've
selected and opens the Confirm dialog. For a study, this step never saves anything at all: it opens
the review dialog showing you the token cost of launching, and you decide whether to confirm or
cancel.

### Asking you a question

When Fintelligent needs you to make a choice or clarify something before it can continue, it can show
you a question card right in the chat: between one and six questions at a time, each with two to six
options, presented as a single choice, multiple choices, or a dropdown. There's almost always a
free-text "Other…" option too, in case none of the listed choices fit. When the question is about
choosing a fitness function or a risk manager, the card can also let you search your own library and
the shared public library directly, rather than typing a name.

This step waits for you specifically: it has no time limit, so take the time you need. It only reads
your answer; it never writes anything to your account.

### PDF reports

Fintelligent can put together a PDF report (one for a study, or one for a single trial portfolio), gathering the relevant numbers and writing up a set of titled sections, with tables and formatted
text where useful. The whole thing is composed and downloaded right in your browser.

**Limits.** This never uploads or stores anything on a server, and it never uses data beyond what
you're already allowed to see. At least one section is required for a report to be generated. Because
the whole thing happens in your browser, there's no separate copy sitting anywhere else to retrieve: if a download doesn't land the way you expect, ask Fintelligent to generate it again.

### Running a batch of on-screen commands

For a request that needs several on-screen steps in a row (say, search for a strategy, open it, and
fill in a couple of fields), Fintelligent can run them as one ordered batch, using the same command
system behind the app's own command palette (Cmd+K). If any step in the batch fails, the whole batch
stops right there rather than plowing ahead with the rest.

The steps available cover navigating, searching for entities by name, opening a create editor,
viewing something read-only, opening an edit editor, filling in fields, reading back what's currently
in an editor, validating, requesting a save, and running (launching, stopping, relaunching, or
backtesting).

> [!NOTE]
> **There's no delete step in this batch system, on purpose.** Whether it's you or Fintelligent
> driving it, deleting something always goes through the dedicated page button and its own
> confirmation dialog: never through a command batch.

Saving and requesting-a-save through a batch behave exactly like the standalone save action above:
they open the Confirm dialog and wait for you rather than persisting on their own. Launching works
the same way: it takes you to the relevant page rather than starting anything on the spot.

This applies to studies, strategies, asset groups, fitness functions, and risk managers; portfolio
groups and the portfolio-groups overview page can be searched and viewed this way but don't yet
support create, launch, or duplicate through this particular batch system.

## Managing your strategies, studies, and risk models

### Studies

19 actions, five of which can change something.

**What Fintelligent can tell you:**

- Your most recent studies, with status and progress (newest first)
- One study's full setup: name, strategy, fitness function, parameters, date windows, grid size,
  status, and snapshots
- How many trials are done against the total you set
- A study's current status, including a clear explanation of why it failed, if it did
- The optimization history for a chosen metric and stage, trial by trial
- The error dashboard, grouped by what went wrong
- A behavioral clustering summary of a study's trials
- Which parameters mattered most, with confidence ranges
- Overfitting diagnostics and an overall verdict
- Every completed trial's parameter values, ready to export
- A weighted comparison of optimization history across several studies
- A cost preview: for a study you've already saved, or one that doesn't exist yet. Either way,
  previewing creates nothing and charges nothing
- Turning a rough breadth choice into a ready-to-launch search space

**What Fintelligent can do:**

- Create a study directly
- Launch a saved study: this is the one that spends tokens and starts the run
- Stop one or more running studies
- Resume a completed or stopped study with more trials
- Make a config-only duplicate

**Limits.** Optimization history is capped at roughly 200 evenly spaced trials so a chart stays
readable; comparing studies is capped at about 60 trials per study across roughly four studies at a
time; clustering and overfitting results come back as a summary rather than every underlying data
point, since the full detail is too large to hand back in one go. Asking for your recent studies list
shouldn't be pushed much past about 20 at a time: a longer list gets cut off partway through.
Creating a study needs a name, a strategy, an asset group, a fitness function, a trial count, all
four date-window boundaries, and the parameter search space. A newly created study doesn't spend
anything or start running unless it's explicitly launched.

See [Studies](/docs/studies) and [Study lifecycle](/docs/study-lifecycle).

### Strategies

9 actions, four of which can change something.

Fintelligent can list your organization's strategies (without exposing the underlying code), pull
metadata for specific ones, list their declared parameters, show their version history, and preview
the positions a strategy would take over a date range against a chosen asset group. It can also
create, fully update, delete, or duplicate a strategy.

**Limits.** Fintelligent can only act on strategies it already knows the id of from something earlier
in the conversation: if it names one that doesn't exist or isn't accessible, the whole request fails
rather than partially succeeding. Before your own code can be saved as an internal strategy, it has
to pass validation first, and that validation has to be recent (no more than about an hour old) and
match the code and parameters you're actually saving.

See [Strategies](/docs/strategies) and [Execution modes](/docs/execution-modes).

### Fitness functions

8 actions, four of which can change something.

Fintelligent can list the built-in objectives plus your organization's own (again, without exposing
the code), pull metadata and version history, and preview the score a fitness function would produce
over a date range. It can also create, fully update, delete, or duplicate a fitness function.

**Limits.** Previewing a fitness function needs a fitness id, a strategy id, an asset group, both
sets of parameters, and a date range. Your own code is validated the same way strategy code is, with
the same one-hour freshness rule.

See [Fitness functions](/docs/fitness-functions) and [External fitness](/docs/external-fitness).

### Risk managers

12 actions, five of which can change something: the largest set of write actions of any single area.

Fintelligent can list your own risk managers and the shared public library, check quotas and usage,
show version history, and preview one risk manager on its own or an ordered stack of several
together. It can also create a risk manager (built-in, your own code, an external connection, or a
rules-based one), update it, delete it, duplicate it, or fork a public one into your own library so
you can customize it.

**Limits.** A built-in risk manager needs you to name which one; anything else needs its own
execution details filled in. Previewing a single risk manager needs either an existing one or a
built-in name to test against; previewing a stack needs at least one risk manager in it.

See [Risk managers](/docs/risk-managers).

### Asset groups

15 actions, five of which can change something. (You may also see these called "data clusters"
elsewhere in the product: it's the same thing.)

Fintelligent can show your universes and what they contain, how well a set of existing groups covers
a requested list of instruments, metadata, date coverage, a data-quality report, the most recent
available date, whether a group can feed a given strategy's data needs, every available
sector/industry taxonomy, and detail on one grouping. It can also derive a new asset group from a
study's universe or from an existing grouping, replace a group's entire ticker universe, delete a
group, or duplicate one.

> [!WARNING]
> Updating an asset group's ticker list **replaces the whole universe**: it doesn't add to it. If
> you ask Fintelligent to add a few tickers to an existing group, make sure the full intended list is
> what actually gets sent; anything left out is removed.

Deriving a new asset group from an existing grouping is the one change Fintelligent can make
immediately, without first loading a checklist or asking a specialist, because it's low-risk and
easy to reverse.

See [Asset groups](/docs/asset-groups).

### Checking your code before it's saved

11 actions altogether (7 dedicated checks, plus the 4 preview actions already mentioned above for
strategies, fitness functions, and risk managers): every one of them read-only. They compile and run
your code, or test your connection, but they never save anything.

The seven checks cover your own strategy code (against test parameter values), your own fitness
code, your own risk-manager code, a chosen built-in risk manager, and, for strategies, fitness
functions, and risk managers you host yourself, a live check against your own connection.

**Limits.** These checks run in the background and can take a moment to finish; the result is
retrieved separately rather than waited for live. A passing result is what's called a validation
receipt, and it's what a save is checked against for the following hour: after that, or if the code
changes, it needs to be validated again.

See [External strategies](/docs/external-strategies) and [Laboratory](/docs/laboratory).

### Saved drafts of in-progress work

2 actions, one of which can change something.

Fintelligent can read back a saved draft of work you (or it) were authoring (including the code) and it can save one. A draft is simply Fintelligent's work-in-progress, kept on your account, so
authoring a strategy, study, fitness function, risk manager, or asset group survives you navigating
away, reloading the page, or closing the tab. There's exactly one live draft per person, per type of
object, per specific record (or "new" record) being worked on.

**Limits.** Saving a draft replaces the whole thing: it's not layered on top of what was there
before. If you've made your own edits to the same draft while Fintelligent was mid-task, its next
save is refused rather than overwriting what you just changed; Fintelligent re-reads the draft and
retries instead. And remember: a draft is never itself a save. Nothing about the underlying strategy,
study, fitness function, risk manager, or asset group actually exists until you keep the draft and
confirm the real Save in the editor.

See [Fintelligent drafts and runs](/docs/fintelligent-drafts-and-runs).

## Analyzing portfolios and results

### Trial portfolios

24 read-only actions covering the individual portfolios a study produces. None of them change
anything.

Fintelligent can pull up a study's top portfolios by whichever metric and stage you care about; every
trial portfolio one or more studies produced; metadata, stored backtest metrics, stage-weighted
averages, metrics over a custom date window, per-holding windowed metrics, hyperparameter values,
holdings and positions, equity curves, per-portfolio overfitting diagnostics, the reproducible seed
and configuration behind a result, trial-level parameters and objective scores, the study/strategy/
fitness lineage behind a portfolio, a rolling rate-of-change curve, and a log of when a risk manager
fired or halted trading.

It can also resolve a study and trial number into a specific portfolio, re-simulate a trial with an
override (say, inverted trade sides, or a shorter window) as a pure what-if preview, and rank
portfolios across multiple studies: by a single metric, by a weighted combination of metrics, by one
metric averaged across weighted stages, over a custom date window, or across several weighted date
windows at once.

**Limits.** Weighted rankings need the weights you supply to add up to 1.0. A ranking across named
stages only includes portfolios that actually have every stage you asked for. What-if re-simulation
is a preview only: the numbers are computed fresh each time and nothing about it is ever saved.

See [Portfolios dashboard](/docs/portfolios-dashboard), [Portfolio detail](/docs/portfolio-detail)
and [Metrics reference](/docs/metrics-reference).

### Portfolio groups

18 actions, four of which can change something. (These are sometimes called "baskets" elsewhere in
the product.)

Fintelligent can show your organization's portfolio groups, one group's full detail and
configuration, a dashboard of summary numbers and per-group cards flagging anything that needs
attention, aggregate sector/ticker concentration across groups, a comparison between groups over a
period, blended equity and stats, the underlying seed data, how current each member's daily update
is, sentiment across a group's holdings with headlines, rolling ranking windows, a read-only preview
of how the group would trade live (without placing any actual order), and the status of live and
drafted group operations. It can also create a group from a set of portfolios (any trial portfolios
you include are automatically promoted to managed portfolios), partially update a group, delete a
group, or refresh a group's member data.

**Limits.** Creating a group with a paid allocation method also charges to unlock that method: if
your balance can't cover it, the creation is declined. Turning on scheduled rebalancing requires you
to also set how often it rebalances. Switching a group to equal-weight or manual allocation needs its
old allocation parameters explicitly cleared, or they'll linger. Recomputing a group's backtest from
inception is only available for a group that has never actually been operated live.

See [Portfolio groups](/docs/portfolio-groups) and [Portfolio manager](/docs/portfolio-manager).

### Managed (live-traded) portfolios

Two things Fintelligent can tell you here, deliberately: the list of your managed portfolios
(identity and configuration only) and one managed portfolio's detail.

What it deliberately **cannot** tell you is a managed portfolio's actual live positions or its equity
curve: those are kept off-limits to Fintelligent entirely, so that no account-level live position
data ever reaches the AI. Fintelligent can point you toward a managed portfolio and take you to it,
but it can never read what it's actually holding.

See [Live trading](/docs/live-trading).

## Market and data lookups

Every action in this section is read-only. None of them writes anything.

### Market

24 actions. Fintelligent can pull up a market overview with breadth and movers, the latest available
data date, a ticker's profile, fundamental and technical metrics for many tickers at once, OHLC price
history, financial statements, news-sentiment history, insider transactions, analyst ratings and
targets, corporate actions (dividends and splits), crypto fundamentals, fund/ETF fundamentals,
available technical indicators and their settings, rankings of tickers by an indicator (as a full
list or a quick summary), sector and country breakdowns, market indices, upcoming earnings within a
chosen number of days, top tickers by volume, the most volatile tickers, an interest-rates snapshot,
and ranked, summarized news for a set of tickers over a window.

**Limit.** News and headline sentiment come from third parties, so before any of that text reaches
Fintelligent it's scrubbed of anything that reads like an embedded instruction: since anyone who can
publish a headline could otherwise try to slip one in.

See [Market](/docs/market).

### Tickers

9 actions. Fintelligent can resolve up to 500 symbols into full ticker details in one go (name, type,
country, sector, industry), search tickers by name or code with optional fundamental filters, pull
metadata for a batch of tickers, screen by fundamental ranges (P/E, margins, ROE, moving averages,
yield, and more), list indices that actually have membership data along with their coverage window,
pull an index's constituents (as of today, ever a member, always in an interval, or as of a specific
date), pull a single price or volume series, list exchange codes, and list the valid filter values (types, countries, sectors, industries) for building your own filters.

### Screener

3 actions, meant to be used in order: first check the filter catalog for a given exchange (coverage
differs a lot by market, so this always needs to be checked per exchange), then preview how many
tickers a filter set matches before committing to anything, then browse a page of the actual matching
symbols.

**Limit.** Match results come back as symbols, not internal ids: pair this with the ticker-resolution
action above if you need ids for something else.

### Data Explorer

17 actions covering the platform's broader data catalog: what datasets and fields are available to
explore, dataset summaries and coverage, per-ticker coverage (paginated and sortable), how record
counts change over time, one feature's series for a ticker (optionally windowed or z-scored), raw
data rows for a ticker, a preview of what a data-source selection actually resolves to, available
ticker-metadata fields and records, interest-rate series and the yield curve as of a date, macro
indicators by country, an earnings calendar, an IPO calendar, and a log of ticker renames and
mergers.

See [Data Explorer](/docs/data-explorer).

## Reference knowledge and how complex requests are handled

### Reference catalogs

11 read-only actions covering general reference material rather than anything specific to your
account: none of it counts against your data. Fintelligent can look up the exact requirements for a
given resource type (what a valid strategy, fitness function, or risk manager needs to declare), the
data sources strategies can draw on, the building blocks available to rules-based risk managers, the
built-in risk managers and their settings, worked examples of strategies, fitness functions, and risk
managers, a preview of exactly what data a chosen data-source selection would hand to a strategy
(without writing any code), the platform's injectable data sources, the curated benchmark list, every
performance metric the platform computes, the available optimization samplers, and a compact snapshot
of your whole workspace in a single call.

**Limit.** The data-source catalog and the worked-examples list are both large enough that asking for
either without narrowing it down comes back cut off: they work best narrowed to what you actually
need.

### Getting oriented, and re-checking what's on your screen

The workspace-snapshot action loads counts plus your most recent studies, strategies, fitness
functions, asset groups, and portfolio groups in one call: it's how Fintelligent gets its bearings
before answering a broad, open-ended question about your account.

Separately, Fintelligent can re-run the exact query behind whatever screen you're currently looking
at and pull back its rows, using no filters of its own: the filters come from the screen you already
have open, so what it tells you can never drift from what you actually see. It only accepts a page
size and an offset for paging through more of the same result.

**Limits.** This only works when the screen you're on actually published a query for Fintelligent to
replay: not every page does. And whatever result your screen already sent along as context is capped
(40 rows, 8 columns, and a modest character limit per cell and overall), which is exactly why this
re-run action exists: to get the fuller picture beyond that initial sample.

### Breaking down complex requests

For anything that needs specialized handling, Fintelligent can load the matching checklist for the
kind of work at hand: for a strategy, a study, a risk manager, a fitness function, an asset group,
troubleshooting, or building a report: and, separately, it can hand a scoped piece of a request off
to a focused specialist for studies, portfolio analysis, fitness functions and risk managers, asset
groups, strategies, general research, or your live-traded portfolios.

Neither of these touches your data by itself. Handing off a piece of work includes a restated version
of what's needed, the format expected back, anything already looked up, and optional limits on how
much the specialist is allowed to do. It defaults to read-only and has to be explicitly told a piece
of work is allowed to write before it can change anything.

A specialist never sees your whole conversation (only the specific task it was handed) and its
answer comes back as a summary, kept short and focused rather than dumping everything it found.

### Long-running checks

For anything that takes a moment to finish (a code preview, a cost check, a validation), Fintelligent checks back for the result rather than waiting live, and can tell you whether it's still
pending, running, completed (with the full result), or failed (with a clear explanation, plus the
exact line and position in your code, when relevant).

**Limits.** Each check-back waits up to about 25 seconds for a final answer, so it's used once rather
than in a tight loop. If too much time passes before anyone checks back (about an hour for a
validation, about a day for everything else), the result expires and needs to be re-run. For a
validation specifically, a "failed" result usually just means your code didn't pass the check, not
that anything broke.

## Limits that apply to everything Fintelligent does

These practical limits apply across every capability described above, no matter which one is being
used:

- **A typical question or request is answered within about two minutes.** More involved authoring
  work (actually creating or substantially editing something) is allowed noticeably longer, since
  there's more real work to do. If it runs long, Fintelligent tells you plainly that it ran out of
  time rather than pretending it finished, and picks back up from where it left off if you ask it to
  continue.
- **A single request can only take so many steps before Fintelligent has to summarize and stop.** For
  anything that needs more, it's usually more efficient to continue in a follow-up message.
- **Very long lookups are shortened automatically** so Fintelligent can actually work with what comes
  back, rather than being handed more than it can process.
- **What your current screen shares with Fintelligent is a bounded sample**: a limited number of
  rows, columns, and characters, not necessarily every row you could scroll to. When you need the
  fuller picture, Fintelligent can re-run the underlying query itself (see above) rather than relying
  only on that sample.
- **Repeating the exact same question in one conversation is answered from what Fintelligent already
  found**, rather than looking it up again from scratch: except where the answer could genuinely
  have changed in the meantime, like a study's progress, a data date, or a background job's status,
  which are always checked fresh.
- **Fintelligent only ever sees what you're allowed to see.** Every account lookup and every account
  change uses your own permissions exactly: if your role can't see a particular study, Fintelligent
  can't either.

Chat itself is metered separately, in Fintela **AI Tokens**: a different currency from the compute
tokens a study spends when it runs. If your AI Token balance runs out, your next message is blocked
before Fintelligent does anything, and you're told plainly why. See
[Tokens and billing](/docs/tokens-and-billing).

## What Fintelligent cannot do

| Can't do | Why |
|---|---|
| Read your connected brokerage account directly | This is intentionally left out entirely: none of your broker connection, live positions, order fills, allocations, or end-of-day reconciliation data ever reaches Fintelligent |
| Read a managed portfolio's live positions or equity curve | Kept off-limits on purpose, for the same reason: it can point you to a managed portfolio, but never read what it actually holds |
| Connect a broker, launch or rebalance live trading, execute or force-stop a portfolio-group operation, or promote something to managed | None of these are available yet: live-trading changes are deliberately withheld until there's a dedicated human-confirmation step for them. Everything Fintelligent can do around your live trading is read-only |
| Delete anything through a batch of on-screen commands | There's no delete step in that system, for you or for Fintelligent |
| Delete, stop, or resume something by asking it directly | Those specific actions are always left to the page's own buttons and their own confirmation dialogs |
| Receive a file you upload in chat | Attaching a file shows it in the composer, but it isn't actually sent anywhere: only pasted code text goes through |
| Hand you a file from its own side | Every PDF report is built and downloaded entirely inside your browser: there's no separate copy sitting on a server to fetch later |
| Take you straight to one specific record | It can send you to a page (your studies list, say) but not yet straight into one particular study on that page |
| Let you pick which underlying AI model it runs on, or use your own AI provider key | Both options have been removed: Fintelligent always runs on the platform's own configured model |

## Where to go next

- [Fintelligent](/docs/fintelligent): how the chat itself works: conversations, and what happens
  during a turn.
- [Fintelligent drafts and runs](/docs/fintelligent-drafts-and-runs): reviewing, keeping, and
  discarding what the assistant has written for you.
- [Registries](/docs/registries): the strategies, studies, fitness functions, risk managers, and
  asset groups these capabilities read and write.
- [Tokens and billing](/docs/tokens-and-billing): the two currencies involved, and what each one
  pays for.
