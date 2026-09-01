---
title: Portfolio Manager
section: Analysis & Portfolios
sectionOrder: 4
order: 4
published: true
updated: 2026-09-01
summary: Compare your whole book of portfolio groups side by side — performance, metrics, holdings and trades — then drill into any one group for a full analysis.
keywords: portfolio manager, portfolio groups, comparative analysis, equity curve, metrics, holdings, trades, benchmark, rebalancing
---

Portfolio Manager is where you look at your whole book of [portfolio groups](/docs/portfolio-groups) side by side — how each one has performed, how their numbers stack up against each other, what they're holding right now, and how they trade. Four views — Equity, Metrics, Holdings and Trades — all look at the same set of groups at the same time, controlled by one shared set of filters, so a chart and a table can never tell two different stories about the same comparison. Click into any single group and those same four views refocus on that group and the managed portfolios inside it, with several extra views that only make sense once you're looking at one group.

Portfolio Manager is the analysis side of portfolio groups — you come here to read results. Building groups, choosing which portfolios belong in each one, setting allocation weights, deciding how often a group rebalances, and connecting it to a broker is done on the [Portfolio Groups](/docs/portfolio-groups) page instead.

> [!NOTE] Two related pages, two purposes
> Portfolio Manager is where you analyze your groups. Portfolio Groups is where you build and manage them. If an old bookmark seems to have the two the wrong way round, you'll be taken to the right page automatically.

## What the section compares

Every view in this section compares **portfolio groups** — collections of promoted portfolios you assembled on the [Portfolio Groups](/docs/portfolio-groups) page. There's nothing to compare until you've promoted at least one ranked trial from the [Portfolios dashboard](/docs/portfolios-dashboard) and added it to a group; until then, every tab shows the same simple message:

> No portfolio groups yet. Promote ranked trials from the Portfolios dashboard to build your first one.

Portfolio Manager sits in the Analysis section of the sidebar, right after Portfolios. Unlike some parts of the platform, it isn't held behind a paid plan or a token balance — if you have portfolio groups, you can compare them here. You'll only ever see your own organization's groups; nobody else's book is visible to you, and yours isn't visible to them.

## The section tab bar

At the very top of the section sits a small tab bar with two tabs — not the four you might expect:

| Tab | When it appears | Contains |
|---|---|---|
| **Portfolio Manager** | Always | Equity, Metrics, Holdings, Trades |
| **Portfolio Group Analysis** | Only after you open a group | That group's own set of views |

Each tab is a dropdown, so you can jump straight to any view inside it — including opening one in a new browser tab. The Portfolio Group Analysis tab appears the moment you drill into a group, and closing it takes you back to whichever book-level view and filters you came from.

## Views in this section

Portfolio Manager has four book-level views, plus nine additional views once you open a single group:

**Book-level (comparing your whole book):**
- **Equity** — the view you land on; performance curves for every group
- **Metrics** — a side-by-side table of key numbers
- **Holdings** — what each group currently owns
- **Trades** — how each group has been trading

**Group-level (once you open one group):**
- Profile, Equity, Metrics, Holdings, Trades, Robustness, Ideas, News, Operations

Each view has its own address, so you can bookmark it, share it with a colleague, or come back later to exactly the comparison you were looking at.

## One toolbar, four windows

There is exactly one filter bar for the whole section, sitting above the four book-level views. That's a deliberate design choice: Equity, Metrics, Holdings and Trades are four different windows onto the same filtered comparison, so no single view has its own private filters, and switching between them never resets what you were looking at.

```text
┌─────────────────────────────────────────────────────────┐
│  Portfolio Manager ▾        Portfolio Group Analysis ▾ x │  ← section tabs
├─────────────────────────────────────────────────────────┤
│  Timeframe · Top N · Rank by · Benchmark · Add group     │  ← one shared toolbar
│                              "8 of 23"        [Reset]    │
├─────────────────────────────────────────────────────────┤
│   Equity  |  Metrics  |  Holdings  |  Trades             │  ← whichever view is open
└─────────────────────────────────────────────────────────┘
```

If the toolbar doesn't fit on one line, it wraps onto a second row rather than making you scroll sideways.

### Toolbar controls

| Control | What it's for |
|---|---|
| **Timeframe** | Choose the comparison window: ten quick presets, or a custom date range. A custom range can't extend past your book's most recent data. |
| **Metric** (Metrics tab only) | Replaces Timeframe when you switch the Metrics table to compare across timeframes instead of across metrics. |
| **Top N** | Limit how many groups are compared at once — Top 5 / 10 / 25 / 50, a custom number up to 50, or show everything in scope. |
| **Rank by** | Pick which metric decides the order groups are ranked in — searchable across [Fintela's full metrics list](/docs/metrics-reference). |
| **Benchmark** | Choose a ticker to compare against, with an exchange filter and a toggle to show or hide it on the chart. |
| **Add group** | Pin a specific group into the comparison even if it would otherwise be cut off by Top N. Not shown once you're inside a single group. |
| Counter | Shows how many groups are currently shown out of your total. |
| **Reset** | Appears only once you've changed something, and restores every control to its default. |

The ten Timeframe presets are: 1 week, 2 weeks, 1 month, 3 months, 6 months, year-to-date, month-to-date, 1 year, since inception, or a custom range.

> [!NOTE] Quarter-to-date and 3-year views live inside Metrics
> They're not on the toolbar's quick-pick list, but you can still see them as columns when you switch the Metrics table to compare across timeframes instead of across metrics.

### Which controls each view enables

A control a view doesn't use is greyed out rather than hidden, so the toolbar always looks the same. Hover over a greyed control to see why it's off.

| View | Active controls |
|---|---|
| Equity | Timeframe, Top N, Rank by, Benchmark |
| Metrics (comparing metrics) | Timeframe, Top N, Rank by, Benchmark |
| Metrics (comparing timeframes) | Metric (in the Timeframe slot), Top N, Rank by, Benchmark |
| Holdings | Timeframe, Top N, Rank by |
| Trades | Timeframe, Top N, Rank by, Benchmark |

Two examples of what you'll see on hover:
- On Holdings, Benchmark is disabled: *"A benchmark has no holdings to compare against."*
- On Metrics' across-timeframes mode, Timeframe is disabled: *"Every timeframe is a column in this mode — there is no single one to pick."*

### Sharing and returning to a view

Every choice that changes *which* groups you're comparing, or *what order* they're ranked in — timeframe, Top N, ranking metric, benchmark, pinned groups, hidden groups — is captured in the page's own link. Copy the address from your browser and send it to a colleague, or bookmark it, and it reopens showing exactly the comparison you had on screen.

Choices that only change *how* the same groups are drawn — which line the Equity chart is plotting, how the Metrics table is oriented, how Holdings groups things, which lens Trades is showing — aren't part of the link, and reset to their defaults each time you open the view.

By default, the section opens on a two-week window, ranked by Total Return, with no benchmark filter and every group shown.

> [!TIP] Why the default ranking is Total Return, not Sharpe
> The section opens on a two-week window, which usually isn't enough trading days for a statistic like the Sharpe ratio to be considered reliable — some metrics simply need more history than others before Fintela will show a computed value for them. Opening on Sharpe by default would leave most rows unranked before you'd even started. Total Return only needs a couple of data points, so it's usable right away; switch Rank by to any other metric once you've picked a longer window.

### Top N, pins and unchecking

Three different controls decide what you see, and they aren't interchangeable.

| Control | Effect on the table | Effect on charts and calculations |
|---|---|---|
| **Top N** | Groups below the cutoff are removed from the table entirely | Removed from every chart and figure |
| **Add group** (pin) | Adds a specific group back into view, at its normal rank position | Included everywhere |
| **Unchecking a group** | The row stays, dimmed to half opacity | Left out of every chart, table and calculation |

Unchecking is separate from Top N and applies across all four views — uncheck a group on Equity and it stays unchecked on Metrics, Holdings and Trades too. Whenever anything is unchecked, a small strip appears letting you show everything again; it only affects groups you personally unchecked, not ones removed by Top N.

> [!WARNING] "Show all" still has a ceiling
> Top N's "Show all" option compares at most 50 groups at once, and says so on screen. That's a different control from the hidden-groups strip's "show all," which only brings back groups you unchecked. On the whole-book Holdings view, the practical limit is lower still — at most 12 groups can be compared side by side at once, regardless of your Top N setting.

Choosing "Custom…" opens a small field where you can type any number from 1 to 50 to set your own cutoff.

## Equity tab

The view you land on by default. It answers a simple question: how has each group done, on its own and against the market, over the period you've selected?

**Comparative chart.** One line per checked group, each in its own color. Above the chart, a Y-axis picker lets you choose what's plotted:

- **Equity** — each group's value over time, rebased so every line starts at the same point for a fair comparison
- **Drawdown** — how far below its own peak each group currently sits, day by day
- Any other metric from [Fintela's full metrics list](/docs/metrics-reference), grouped into Performance, Risk, Risk-adjusted, Recovery, Distribution and Benchmark categories (trade-only figures like win rate aren't offered here, since they don't have a meaningful day-by-day line to draw)

Metrics other than Equity and Drawdown are shown as a rolling figure over a window you can adjust — for example, a 10-day rolling Sharpe ratio. Each metric has a practical minimum window before Fintela treats it as reliable enough to show; picking something narrower triggers a small warning. If a group's own history is too short to cover the window you picked, the chart says so rather than guessing at a number.

Underneath the chart, a lifecycle legend marks which part of each line came from training, validation, out-of-sample testing, or live trading since promotion — so at a glance you can see how much of a group's track record actually happened after it went live. For more on reading charts across Fintela, see [Visualizations & Plots](/docs/visualizations).

**Sidebar** (visible on wider screens, only when comparing your whole book): two cards sit alongside the chart —

- **Needs attention** lists groups with data drift, stale prices, or a failed update, with a one-click "Update all" action for the ones a refresh can actually fix
- **Rebalances** shows upcoming and recent rebalancing dates across your groups, so you know what's about to trade

**Subject table**, sitting below the chart:

| Column | What it shows |
|---|---|
| # | Rank, by your current sort |
| Name | Group name, with a color swatch matching its line on the chart |
| Status | Live or Backtest (whole-book comparisons only) |
| Health | Healthy, Stale, Drift or Failed (whole-book comparisons only) |
| Value | The current value of whatever metric is on the Y-axis |
| vs Benchmark | How the group compares to your chosen benchmark, when one is shown |
| Members | How many portfolios make up the group (whole-book comparisons only) |
| Next | The group's next scheduled rebalance, or "Static" if it doesn't rebalance |

Values are colored by whether they're good or bad for that particular metric, not just by plus or minus — so, for example, a deepening drawdown is never shown in green just because the number itself is negative. Checkboxes on each row (and "select all" in the header) control what's included everywhere else in the section.

## Metrics tab

One table, in two different orientations, switched with the Compare control:

| Mode | Each column is | Grouped into |
|---|---|---|
| Across metrics | One metric, over your selected timeframe | Return, Risk, Risk-adjusted, Recovery, Distribution, Benchmark |
| Across timeframes | One timeframe, for whichever single metric you're ranking by | Trailing, Calendar, Custom |

Each row is a portfolio group; in across-metrics mode there's also a small trend sparkline column.

Clicking a column header both sorts the table and changes your Rank by (or Timeframe) selection in the toolbar — so the sort order you see, the ranking, and the Top N cutoff always describe the same ordering, never three different ones. A line above the chart at the bottom of the page states the current leader in plain language, for example: *"Alpha Growth" leads on Sharpe Ratio over 3 months, among 12 comparable portfolio groups.*

### Cell states

| What you see | What it means |
|---|---|
| A plain number, shaded by value | Enough history exists, and it's ranked normally |
| A dimmed, italic number | A value could be calculated, but there wasn't enough history for Fintela to treat it as reliable — shown for reference, but left out of the ranking |
| A number with a "partial" badge | Reliable, but the group's history doesn't fully cover your selected window |
| **n/d** | The metric couldn't be calculated for this group at all |
| A blank cell | No data at all for this group in this window |

Ranking, the leader, and the color scale only ever use the first kind of cell — a value can be visible on screen without counting toward the ranking.

**Choosing which metrics show.** In across-metrics mode, a "Metrics shown" picker lets you choose exactly which metrics appear as columns, with Select all / Clear all buttons and a search box. Every metric is shown by default, and the table scrolls sideways rather than hiding anything you haven't explicitly chosen to hide — at least one column always stays visible.

**Below the table.** A bar chart visualizes whichever metric you're currently ranked by. When comparing your whole book, a correlation card also shows how closely your groups' returns move together — useful for spotting when a "diversified" book is really just one bet wearing different wrappers. It needs at least two groups to show anything, and a blank cell there means two groups don't share enough overlapping days of data, not that they're uncorrelated.

## Holdings tab

Where your exposure actually sits — what your compared groups agree on, and where they diverge. Once the data loads, everything you do here — changing how positions are grouped, scrubbing through dates, switching between net and gross weighting, drilling into a category, or unchecking a group — updates instantly with no extra loading time.

| Control | Options |
|---|---|
| Group by | Ticker, Sector, Industry, Theme, Sub-theme, or Sub-portfolios (Sub-portfolios only when comparing your whole book) |
| Weight | Net or Gross (not available when grouped by Sub-portfolios) |
| Compare | Toggle individual groups on or off — shared with the rest of the section |
| View | Concentration, Composition over time, or Composition on a specific date |

**Consensus book.** The main table lists every holding category, the book's combined net or gross weight in it, how many of your compared groups hold it, and then a column per group showing its individual weight, plus a column showing how much that weighting varies across groups. Rows are flagged when a position is hedged, or held by only one group. Click any row to drill down — from sector into industry into individual ticker, or from theme into sub-theme into ticker.

**Concentration view.** For each group: the combined weight of its top 5 positions, its effective number of positions (a measure of how spread out the book really is, not just a count of names), total names held, and gross/net exposure.

**Date control.** A timeline lets you step to the previous or next snapshot, jump to a specific date, or jump to the latest. Holdings are captured periodically, so picking a date shows you the most recent snapshot at or before that date, not a live intraday picture.

A summary line gives you the total groups compared, categories shown, combined gross exposure, your long/short split, and a crowding score.

> [!CAUTION] Holdings compares at most 12 groups at once
> Because Holdings shows a full daily position history for every group, comparing more than 12 at once would be too heavy to load responsively. When your Top N or pinned selection includes more than 12 groups, Holdings automatically shows the top 12 by your current ranking and tells you how many more are in scope but not shown.

## Trades tab

Which of your groups has traded best, and how each one trades differently. Six summary tiles across the top — P&L, Closed/Open trade counts, Win rate, Profit Factor, Payoff ratio, and Open P&L — recalculate instantly whenever you check or uncheck a group, with no reload. These combined figures are worked out freshly from the checked groups together, not by averaging each group's own row, because ratios like win rate don't average that way.

Below the tiles, one card with five lenses:

| Lens | What it shows |
|---|---|
| Trade metrics | A scorecard split into realized results for your selected window and open, mark-to-market positions — count, P&L, win rate, payoff, profit factor, expectancy, average hold time and size, plus alpha and "beat benchmark" when a benchmark is selected |
| Timing | Monthly realized P&L as bars, with a cumulative line on top |
| Distribution | A histogram of trade returns |
| Contribution | Which tickers contributed most to each group's results |
| Ledger | The actual list of trades |

The Ledger lets you rank trades by P&L or Return, and filter to Top winners, Top losers, or Open positions — this changes which trades are brought up, not just how the same list is sorted. Each row shows the group, ticker, side, entry and exit, hold time, size, return, P&L, and alpha when a benchmark is set.

> [!WARNING] These figures are percentages of your portfolio, not dollar amounts
> P&L and returns throughout this tab are shown as a fraction of the portfolio's total value, never as raw currency. A figure marked with `*` is computed from too few closed trades to be fully reliable.

## Per-group sub-views

Opening a single group swaps the toolbar area for that group's own header and reveals the Portfolio Group Analysis tab. The header shows the group's name, a short description, which strategies and authors contributed to it, and four actions:

| Action | What it does |
|---|---|
| Back to Portfolio Manager | Returns you to the book-level view and filters you came from |
| Manage structure | Opens the group's settings page, where you edit membership and configuration |
| Trading Lab | Test changes to this group — disabled if the group has no members yet |
| Update portfolios | Refreshes the group's member portfolios, with a progress indicator while it runs |

A group with no members yet points you to add managed portfolios on its structure page before it can show any performance here. If a group no longer exists or you don't have access to it, you'll see a simple "not found" message with a button back to Portfolio Manager.

### The four comparative sub-views

Equity, Metrics, Holdings and Trades reappear inside a single group too, using the exact same views as the book-level tabs — just pointed at a different set of subjects: the group itself, plus each managed portfolio inside it. The shared toolbar reappears here as well, though the other five group views (Profile, Robustness, Ideas, News, Operations) aren't tied to a timeframe, so no toolbar shows on those.

| | Comparing your whole book | Comparing inside one group |
|---|---|---|
| What's compared | Every portfolio group you have | The group plus its individual member portfolios |
| Clicking a row | Opens that group's Profile | Does nothing — a member portfolio has no page of its own |
| Extra columns | Status, Health, Members, Next rebalance | Not shown |
| Add group control | Available | Hidden |
| Correlation card | Shown | Not available |
| Group-by Sub-portfolios | Available on Holdings | Not offered |
| Holdings history | Any group in scope | Just this one group |
| Groups comparable on Holdings | Up to 12 | No practical limit — you're only looking at one group's own members |

The group you opened is always included in the comparison, so a tight Top N setting can never accidentally hide the very group you're looking at.

> [!NOTE] Two things are missing on purpose inside a group
> There's no correlation card here because correlation compares whole portfolio groups against each other, and a group's members aren't groups themselves. And grouping Holdings by "Sub-portfolios" would be redundant inside a single group — the whole view is already organized around its members.

### Profile

Profile is the view you land on when you open a group, and it reads the group the way an investor would. On the left, a summary card shows headline performance numbers computed from the group's own blended track record, alongside a "Growth of an investment" chart showing the group's performance against its benchmark, rebased so you can see what a fixed initial investment would be worth over time. On the right, a Members card lists every promoted portfolio the group is built from — which strategy and author produced it, which study it came from, its total return and Sharpe ratio — followed by calendar-year returns and the assets it has traded.

> [!NOTE] A group doesn't have its own training history
> Out-of-sample return, out-of-sample Sharpe, and beta are intentionally left blank on a group's Profile. Each member portfolio went through its own training and validation before being promoted, but the group itself is just an assembly of already-promoted portfolios — it never went through that process as a unit. To see how a group has actually performed since it went live, check Robustness instead.

### Robustness

Robustness opens with an overall verdict on the group — **Well trained**, **Borderline**, **Overfitting risk**, or **Not enough evidence** — each with a short explanation of what it means. Below that, three sections:

| Section | What it covers |
|---|---|
| What the members say | Each member portfolio's weight in the group, which study it came from, its own overfitting verdict, and how much live/out-of-sample history backs it up |
| What the blended curve says | Statistical measures of the group's combined track record, including how likely its results are to be a statistical fluke rather than genuine skill |
| How this group was built | How many times it's been rebalanced or reconfigured, how many members are actively contributing, and how live results compare to what backtests predicted |

If some members never received a formal overfitting verdict, Robustness calls that out explicitly by count and by how much of the group's weight they represent — their risk is unknown, not confirmed safe.

### Ideas, News and Operations

| Sub-view | What it is |
|---|---|
| Ideas | AI-suggested changes to the group that you can test in Trading Lab before adopting. Generating these narrated ideas requires a paid plan or available tokens — on the free tier the page still opens, it just won't generate new ideas. |
| News | Headlines and sentiment for whatever the group currently holds |
| Operations | The group's live trading activity through its connected broker, including which members are stale and when they last updated |

### Returning to where you were

Whenever you drill from a book-level table into a single group, Fintela remembers the view and filters you came from, so "Back to Portfolio Manager" and the round trip from "Manage structure" bring you back to the exact comparison you were looking at, not just the section's starting page.

## Old bookmarks and links

Portfolio Manager used to be called "Deployed Portfolios," and its layout has changed a few times as the product evolved. If you have an old bookmark, a saved link, or a shared URL from before these changes, Fintela automatically brings you to the current equivalent page and preserves whatever filters were in the link — so nothing you've saved stops working.

> [!CAUTION] One old link type can't be redirected
> A very old style of saved link that pointed directly at a saved view by its short id can no longer be told apart from a link to a portfolio group, so it isn't redirected automatically. If a bookmark like this stops working, just open Portfolio Manager and reopen the view manually.

### What changed

- The old split between "live" and "backtest" portfolios as separate tabs is gone — everything lives in one book, with Status shown as a column instead.
- The old Overview tab has been folded into Equity: its "Needs attention" and "Rebalances" panels now live in Equity's sidebar when you're comparing your whole book.
- An older three-way switch between a scorecard, a detailed matrix and a top-trades list has been simplified into the single Metrics table (in two orientations) plus its own dedicated Trades tab.
- You can no longer choose between comparing groups over "a common window" versus "each group's own history" — comparisons are always shown over the same shared window now, so results stay apples-to-apples.
