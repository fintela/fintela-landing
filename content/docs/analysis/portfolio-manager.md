---
title: Portfolio Manager
section: Analysis & Portfolios
sectionOrder: 4
order: 4
published: true
updated: 2026-08-18
summary: Comparative analysis across your whole book of portfolio groups — equity, metrics, holdings and trades.
keywords: portfolio manager, book, comparative, equity, metrics, holdings, trades, groups, toolbar, filters
---

Portfolio Manager at `/analysis/portfolio-manager` is where you read your whole book of [portfolio groups](/docs/portfolio-groups) side by side: how they performed, how their numbers compare, what they hold and how they trade. It is one filtered set of groups seen through four tabs, driven by a single toolbar that sits above all of them — so the Equity chart and the Metrics matrix can never disagree about which groups they describe. Drilling into one group re-points those same four views at that group and its members, and adds five surfaces only a group has.

Portfolio Manager is the **analysis** half of portfolio groups. The administrative half — creating groups, editing membership, allocation weights, rebalance cadence and broker configuration — lives at `/analysis/portfolio-groups` and is documented in [Portfolio Groups](/docs/portfolio-groups).

> [!NOTE] The names invert the old URLs
> `/analysis/portfolio-manager` is the analysis hub. `/analysis/portfolio-groups` is the administrative registry. Old links that used `portfolio-manager` for administration are redirected — see [Retired routes and redirects](#retired-routes-and-redirects).

## What the section compares

The subject of every book-level view is a **portfolio group**. A group is built from promoted portfolios, so the section has nothing to show until you have promoted at least one trial and put it in a group. Until then every tab renders:

> No portfolio groups yet. Promote ranked trials from the Portfolios dashboard to build your first one.

Portfolio Manager appears in the **Analysis** section of the sidebar, directly after Portfolios. It carries no entitlement lock — there is no blurred preview or "Buy tokens" gate on any of its routes. Every backend handler behind it requires the `portfolios:read` realm permission and scopes results to your organization.

## The section tab bar

The bar above the toolbar holds **two** tabs, not four, and both are dropdowns of real links (so open-in-new-tab works on every item). Its `nav` element is labelled **Portfolio Manager sections**.

| Tab | When it appears | Contains |
|---|---|---|
| **Portfolio Manager** | Always | **Equity**, **Metrics**, **Holdings**, **Trades** |
| **Portfolio Group Analysis** | Only once you open a group | That group's nine sub-views |

The second tab slides in last when you drill into a group and carries a dismiss control labelled **Close Portfolio Group Analysis**. Closing it returns you to whichever book-level tab and filter state you opened the group from, falling back to the section root when there is no recorded origin. Neither tab carries a count badge.

Book-level tab links carry the current query string **minus** the `from` return address; group sub-tab links carry the whole query string including `from`.

## Routes

| Path | View |
|---|---|
| `/analysis/portfolio-manager` | **Equity** — the landing tab, on the bare route |
| `/analysis/portfolio-manager/metrics` | **Metrics** |
| `/analysis/portfolio-manager/holdings` | **Holdings** |
| `/analysis/portfolio-manager/trades` | **Trades** |
| `/analysis/portfolio-manager/:basketId/profile` | One group — **Profile** (the landing sub-view) |
| `/analysis/portfolio-manager/:basketId/equity` | One group — **Equity** |
| `/analysis/portfolio-manager/:basketId/metrics` | One group — **Metrics** |
| `/analysis/portfolio-manager/:basketId/holdings` | One group — **Holdings** |
| `/analysis/portfolio-manager/:basketId/trades` | One group — **Trades** |
| `/analysis/portfolio-manager/:basketId/robustness` | One group — **Robustness** |
| `/analysis/portfolio-manager/:basketId/ideas` | One group — **Ideas** |
| `/analysis/portfolio-manager/:basketId/news` | One group — **News** |
| `/analysis/portfolio-manager/:basketId/operations` | One group — **Operations** |

> [!WARNING] Equity has no `/equity` URL
> Equity is the bare route. `/analysis/portfolio-manager/equity` exists only as a redirect back to it. The `:basketId` route sits at the same depth, so every retired section segment has to be claimed by a redirect or it would be read as a group whose id is that word.

## One toolbar, four windows

There is exactly one filter bar in the section, rendered by the layout **above** the router outlet, with the accessible label **Portfolio Manager filters**. That placement is the design: the four tabs are four windows onto the same filtered set, so no tab owns a filter of its own and switching tabs never resets anything.

```text
  ┌─────────────────────────────────────────────────────────┐
  │  Portfolio Manager ▾        Portfolio Group Analysis ▾ x │   section tabs
  ├─────────────────────────────────────────────────────────┤
  │  Timeframe · Top N · Rank by · Benchmark · Add group     │   ONE toolbar
  │                              "8 of 23"   [Reset]        │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │   Equity  |  Metrics  |  Holdings  |  Trades            │   the outlet
  │   (whichever route is mounted)                          │
  └─────────────────────────────────────────────────────────┘
```

The toolbar wraps onto extra rows when it does not fit; it is not a horizontal scroller.

### Toolbar controls

| Control | Label | Behaviour |
|---|---|---|
| Timeframe | **Timeframe** | Ten presets plus a custom range. Custom dates are capped by the book's `as_of` date. |
| Metric (Metrics tab only) | **Metric** | Replaces Timeframe in the same slot when Metrics is in across-timeframes mode. |
| Top N | **Top N** | Presets **Top 5 / Top 10 / Top 25 / Top 50**, then **Custom…** (secondary line **Any number up to 50**) and **Show all ({shown})**. When no cap is set the field reads **All ({shown})**. |
| Ranking metric | **Rank by** | Searchable list from the server's metric catalog; search placeholder **Search metrics**. |
| Benchmark | — | Ticker picker with an exchange filter and an eye toggle. |
| Add group | **Add group** | Placeholder **Add a group…**, search **Search groups**, chip **{count} added**. Pins a group into scope past the Top N cut. **Hidden at group scope.** |
| Counter | — | **{shown} of {total}** at book scope; **{shown} of {total} subjects** at group scope. |
| Reset | **Reset** | Appears only when something differs from the defaults; restores every toolbar control. |

The ten Timeframe presets, in menu order, are **1W · 2W · 1M · 3M · 6M · YTD · MTD · 1Y · Since inception · Custom…**. "Custom…" opens a popover with **From** and **To** fields.

> [!NOTE] `QTD` and `3Y` are not toolbar presets
> Both are real matrix columns and remain reachable through the Metrics tab's across-timeframes mode, but the toolbar deliberately offers ten presets and no more.

### Which controls each tab enables

A control a tab does not use is greyed with a tooltip, never removed, so the bar's geometry is identical on every tab.

| Tab | Enabled controls |
|---|---|
| Equity | Timeframe, Top N, Rank by, Benchmark |
| Metrics (across metrics) | Timeframe, Top N, Rank by, Benchmark |
| Metrics (across timeframes) | **Metric** (in the Timeframe slot), Top N, Rank by, Benchmark |
| Holdings | Timeframe, Top N, Rank by |
| Trades | Timeframe, Top N, Rank by, Benchmark |

The two disabled tooltips, verbatim:

- Holdings → Benchmark: **"A benchmark has no holdings to compare against."**
- Metrics (across timeframes) → Timeframe: **"Every timeframe is a column in this mode — there is no single one to pick."**

### Toolbar state in the URL

Everything that changes *which* groups you see or *in what order* lives in the query string, so a link reproduces exactly what you were looking at. Defaults are omitted from the URL.

| Parameter | Meaning | Default and parsing |
|---|---|---|
| `tf` | Timeframe | `2w`. A range is `tf=custom:YYYY-MM-DD:YYYY-MM-DD`; anything malformed falls back to `2w`. |
| `top` | Top N cut | Absent means "show all". A value below 1, or one that is not a number, degrades to "all"; anything above `50` is clamped to `50`. |
| `rank` | Ranking metric | `total_return`. |
| `bm` | Benchmark | A positive ticker id, or the literal `none` for an explicit clear. Absent means the platform default benchmark resolves. |
| `pin` | CSV of group ids pinned into scope past the Top N cut | Empty. Pinned groups appear in rank order, not appended. |
| `off` | CSV of unchecked ids | Empty. |

Everything that changes only *how* the same groups are drawn is **local** state and is not in the URL: the Equity Y-axis metric and its rolling window, the Metrics orientation, the Holdings dimension, weight mode, date scrub, drill and lens, and the Trades lens and ledger list.

> [!TIP] The default Rank by metric is `total_return`, not Sharpe
> The section opens on a two-week window — roughly ten observations — and the backend's sufficiency gate asks for at least 20 observations for most metrics: `total_return` needs 2, the drawdown family 3, `sharpe_ratio` 20, and skew and excess kurtosis 30. Ranking by Sharpe on the first paint would make every row unrankable and the Top N cut arbitrary.

### Top N, pins and unchecking

Three different mechanisms decide what you see, and they are not interchangeable.

| Mechanism | Effect on the table | Effect on charts and derived numbers |
|---|---|---|
| **Top N** | Rows below the cut are removed from the table | Removed |
| **Add group** (`pin`) | Adds a group back in, at its rank position | Included |
| **Unchecking a row** (`off`) | Row stays, greyed at half opacity | Excluded from every derivation |

Unchecking is subtractive and uncapped — everything in scope is compared unless you uncheck it — and it is shared across all four tabs. A **{count} groups hidden · Show all** strip appears whenever anything in scope is unchecked; it counts only unchecked rows, never rows the Top N cut removed.

> [!WARNING] The Top N control's "Show all" is not unbounded
> Top N's **Show all ({shown})** option resolves to at most 50 subjects and says so: its secondary line reads **Max 50 compared at once**, or **First 50 of {total} — max 50 compared at once** when the book is larger. It is a different control from the hidden-groups strip's **Show all**, which only re-checks unchecked rows. At book scope the Holdings tab compares at most 12 regardless of the cut.

**Custom…** opens a small popover whose field is labelled **Top N**, under the helper text **1–50**. The field accepts digits only, at most three of them; Enter commits and Escape cancels. The 50 ceiling is enforced again on the URL write and once more when the cut is applied, so a hand-edited `?top=800` cannot outrun it.

## Equity tab

The section's landing view, on the bare route. It answers "how did they do" — against each other and against the market — over the toolbar's window.

**Comparative chart.** One curve per checked subject, in the subject's own colour. Its header carries a **Y axis** picker grouped as:

- **Curve** — **Equity** (*"The portfolio's value over time, rebased so every curve starts together."*) and **Drawdown** (*"How far below its own peak the portfolio is, day by day."*)
- then every metric in the server's catalog, grouped by **Performance / Risk / Risk-adjusted / Recovery / Distribution / Benchmark**, excluding the four trade aggregates (`trade_win_rate`, `trade_profit_factor`, `avg_trade_duration`, `expectancy`), which have no curve to roll.

Every axis except Equity and Drawdown takes a rolling **Window** input. It defaults to 10, and its minimum is the metric's `min_window` reported by the server — the same sufficiency gate the Metrics matrix uses, so a rolling statistic here can never contradict the matrix cell for the same window. A **min {min} for this metric** warning sits beside the field whenever the value is below that floor. Chart notes include **thinned to fit** when the series was downsampled and **{names} has no value over this window** for subjects that fall short of it; with nothing checked the card reads **Every group is unchecked — check one to draw it.**

A **Lifecycle:** legend under the chart marks **Train**, **Validation**, **Out-of-sample** and **Promoted** on each curve.

**Operational rail** (book scope only, hidden on narrow viewports): a **Needs attention** card and a **Rebalances** card. Needs attention lists groups with drift, stale data or a failed refresh; its **Update all ({count})** action acts only on `stale` and `refresh_failed` items, because a refresh does not clear drift. The empty state is **All clear — nothing needs attention.** Rebalances shows **Next: {date}** with **Upcoming** and **Recent** sections, empty state **No rebalances scheduled.**

**Subject table** (`aria-label` **Portfolio groups**), capped at 42% of the pane:

| Column | Header | Shown |
|---|---|---|
| Rank | **#** | Always |
| Name | **Name** | Always — with a swatch in the curve's colour |
| Status | **Status** | Book scope only — chip **LIVE** or **BACKTEST** |
| Health | **Health** | Book scope only — badge **Healthy**, **Stale**, **Drift** or **Failed** |
| Value | **Value** | Always — the current Y axis's latest value |
| Benchmark delta | **vs Benchmark** | When a benchmark is drawn and present |
| Members | **Members** | Book scope only |
| Next rebalance | **Next** | Book scope only — falls back to **Static (no rebalance)** |

Rows arrive pre-sorted; the value's colour follows the metric's declared direction, never its sign, so a deepening drawdown is never painted green. Row checkboxes and the header select-all write the whole selection in one URL update. The caption above the table reads **{shown} shown** or **{shown} shown · {hidden} beyond Top N**.

## Metrics tab

One matrix in two orientations, chosen with the **Compare** control:

| Option | Columns are | Column bands |
|---|---|---|
| **Across metrics** | one per visible metric, at the toolbar's window | **Return / Risk / Risk-adjusted / Recovery / Distribution / Benchmark** |
| **Across timeframes** | one per server window, for the ranking metric | **Trailing / Calendar / Custom** |

The row identity column is **Portfolio Group**; across-metrics mode adds a **Trend** sparkline column. An **as of {date}** stamp sits at the right of the control strip.

**Header clicks are coupled to the toolbar.** Clicking a metric header sets the table's sort *and* the toolbar's **Rank by**. Clicking a window header (across-timeframes mode) sets the sort *and* the toolbar's **Timeframe**. There is therefore exactly one ordering in play, and the `#` column, the Top N cut and the leader can never describe different orderings.

The sort column also drives a verdict sentence, printed above the analysis band's bar chart: **"{name}" leads on {metric} over {window}, among {count} comparable portfolio groups.**

### Cell states

Five states, and they make three different claims. Do not read them as one "no data".

| State | Rendering | Ranked? | Meaning |
|---|---|---|---|
| `ok` | Plain, heat-shaded | Yes | Sufficient observations **and** the history covers the whole window |
| `low` | Dimmed, italic, `*` | No | A value exists but failed the sufficiency gate |
| `partial` | Shown with a **partial** badge | No | Sufficient, but the group's history does not span the window |
| `nd` | **n/d** | No | The metric was not computable here |
| `empty` | Blank | No | No data at all inside the window |

Ranking, the leader and the heat scale use only `ok` cells. A value can be displayed and still not rank.

**Column chooser.** In across-metrics mode a **Metrics shown** chooser lists every metric with **Select all** and **Clear all**; the search placeholder is **Search metrics**. Every metric is visible by default and the matrix scrolls horizontally rather than curating for you. `Clear all` leaves one metric column standing, not zero.

**Analysis band.** A bar chart of the selected metric — captioned **Each portfolio's {window} value for the metric selected above.** in across-metrics mode and **The metric selected above, across every timeframe.** in across-timeframes mode — and, at book scope only, a **Cross-group correlation** card. Its subtitle is **average pairwise ρ {rho}**; with fewer than two groups it reads **Two groups are needed for a correlation.** A blank cell means the pair shares fewer than the required number of days, not that they are uncorrelated.

## Holdings tab

Where the exposure actually sits, where the compared subjects agree, and where they diverge. Everything below the fetch is a pure derivation over one cached response, so changing dimension, scrubbing the date, flipping Net/Gross, drilling into a bucket and unchecking a subject all cost zero requests.

| Control | Label | Options |
|---|---|---|
| Dimension | **Group by** | **Ticker · Sector · Industry · Theme · Sub-theme · Sub-portfolios** (Sub-portfolios is book scope only) |
| Weight mode | **Weight** | **Net** / **Gross** — disabled when the dimension is Sub-portfolios |
| Subject chips | **Compare** | One chip per in-scope subject, in its rank colour; writes the same unchecked state as the other tabs |
| Lens | **View** | **Concentration** / **Composition over time** / **Composition on date** |

**Consensus book** (left card). Columns in order: **Bucket**, **Book net** or **Book gross**, **Held by**, a chips lane, one column per compared subject in rank order and colour, then **σ**. The subject columns sit under a band reading **Groups · net weight** or **Groups · gross weight**. Row chips flag **hedged** and **only-in** buckets. Empty state: **No holdings on this day.** Clicking a row drills down the ladder sector → industry → ticker and theme → sub-theme → ticker, with a breadcrumb. Header chips report **{shown} of {raw} days shown** and **{count} tickers classified from a frozen snapshot**.

**Concentration** (right card lens). Columns **Name**, **Top 5**, **Eff. N**, **Names**, **Gross**, **Net** — where Eff. N is the inverse-Herfindahl effective number of positions.

**Date axis.** A timeline below the cards with **As of**, **Previous snapshot** / **Next snapshot**, **Pick a date** and **Latest**. Any date you pick resolves to the last snapshot on or before it — composition is a step function.

**Summary line.** `{groups} groups · {buckets} buckets · gross {gross} · L{long}/S{short} · crowding {crowding}`, optionally suffixed `consensus: {bucket}`.

> [!CAUTION] Holdings compares at most 12 subjects
> The holdings endpoint refuses with **HTTP 400** past 12 basket ids rather than truncating, because its per-day position map is by far the heaviest response in the section. The tab therefore sends the top 12 in the toolbar's rank order and says so with a chip: **Top {shown} compared · {omitted} more in scope**.

## Trades tab

Which subject traded best, and how each one trades differently. Six tiles run across the top — **P&L**, **Closed / Open**, **Win%**, **PF**, **Payoff**, **Open P&L** — recomputed client-side from the server's additive counters whenever you uncheck a subject, with no refetch. The cohort tooltip states why: *"Derived from the checked groups' counters — not the average of the rows above, because ratios do not combine that way."*

One card, five lenses, selected with **View**:

| Lens | What it shows |
|---|---|
| **Trade metrics** | Scorecard banded **Realized (window)** and **Open · mark-to-market**. Columns **N · P&L · Win% · Payoff · PF · Expect. · Hold · Size**, then **α** and **Beat BM** when a benchmark is drawn, then **Open** and **Unreal.** |
| **Timing** | Monthly realized P&L bars with a cumulative line; y axis **% of NAV** |
| **Distribution** | Shared-bin return histogram; y axis **trades** |
| **Contribution** | Per-ticker contribution across the compared subjects |
| **Ledger** | The trade list, with its own two controls inside the card body |

The Ledger's controls are **Rank trades by** (**P&L** / **Return**) and **List** (**Top winners** / **Top losers** / **Open positions**). "Rank trades by" is part of the request — it changes which 25 trades the server returns, not just the client sort. Ledger columns: **Portfolio Group · Ticker · Side · Entry → Exit · Hold · Size · Return · P&L**, plus **α** when a benchmark is present. Empty: **No trades in this window.**

> [!WARNING] These figures are NAV fractions, never money
> The tab's permanent footnote reads: **"P&L and returns are fractions of NAV, never money. * marks a figure computed from too few closed trades."** The wire format carries a unit field precisely so a client cannot render them as currency.

## Per-group sub-views

Opening a group replaces the toolbar area with that group's header and reveals the **Portfolio Group Analysis** tab. The header carries the eyebrow **Portfolio**, the group's name, the subtitle *"Performance, metrics, ideas, news and live operations for this portfolio group."*, a **Strategies involved** / **Authors involved** provenance strip, and four actions:

| Action | Behaviour |
|---|---|
| **Back to Portfolio Manager** | Returns to the tab and filters you came from |
| **Manage structure** | Opens `/analysis/portfolio-groups/baskets/:id` with a return address |
| **Trading Lab** | Disabled when the group has no members |
| **Update portfolios** | Refreshes members; the label cycles through **Queuing…**, **Queued…** and **Updating {n} of {total}…** |

A group with no members shows **"This portfolio group has no members yet — add managed portfolios on its structure page to see performance here."** An unresolvable group shows **Portfolio Group not found.** with a **Back to Portfolio Manager** button.

### The four comparative sub-views

`:basketId/equity`, `:basketId/metrics`, `:basketId/holdings` and `:basketId/trades` render **the exact same view components** as the book-level tabs, pointed at a different subject set: the group itself plus its member managed portfolios. The toolbar reappears above them — and only above them; the other five sub-views are not window-scoped, so no timeframe control is shown there.

| | Book scope | Group scope |
|---|---|---|
| Subjects | Every portfolio group in your workspace | The group itself plus its member managed portfolios |
| Row is a link | Yes, to that group's Profile | No — a member has no page of its own |
| Operational columns | Status, Health, Members, Next | Dropped |
| Table caption | **{shown} shown · {hidden} beyond Top N** | **Showing {shown} · {hidden} hidden by Top N** |
| Toolbar counter | **{shown} of {total}** | **{shown} of {total} subjects** |
| **Add group** control | Shown | Hidden |
| Cross-group correlation card | Shown | **Absent** |
| Holdings dimensions | Includes **Sub-portfolios** | Excludes it |
| Holdings composition history | Any in-scope group | Only the parent group |
| Holdings subject cap | 12 | None — the endpoint takes one group id |

The parent group is always pinned into scope, so a Top N of 3 can never hide the very group whose page you are on. Rows are still ordered by the ranking metric, so the parent sits wherever its own number puts it.

> [!NOTE] Two absences at group scope are deliberate
> The correlation endpoint takes basket ids and members are not baskets, so a group's Metrics tab has no correlation card. Inside a group the Holdings columns already *are* the members, so a Sub-portfolios dimension would put the same axis in both directions. Neither is a bug.

### Profile

`:basketId/profile` is the landing sub-view and reads the group as an investor would. Left column: a summary card of headline metrics computed from the group's own stitched curve, then a **Growth of an investment** card subtitled *"The group's blended track record against its benchmark, rebased to a common starting amount."* Right column: a **Members** card subtitled *"The promoted portfolios this group is built from, and where each came from."* with columns **Member · Strategy · Author · Study · Total return · Sharpe**, followed by calendar returns and traded assets.

> [!NOTE] A group has no train/validation/OOS split
> Out-of-sample return, out-of-sample Sharpe and beta are deliberately blank on a group's Profile. A group is assembled from members that each had their own split; the group itself never did. The honest out-of-sample question is answered on **Robustness**, against the live period.

### Robustness

`:basketId/robustness` opens with a **Group verdict** eyebrow and one of four verdicts, each with its own blurb: **Well trained**, **Borderline**, **Overfitting risk**, **Not enough evidence**. Three sections follow:

| Section | Contents |
|---|---|
| **What the members say** | Per-member table: **Member · Weight · Study · Verdict · DSR · Study PBO · OOS days**, plus a disclosure of how the weights were sourced |
| **What the blended curve says** | **PSR · Sharpe (ann.) · Observations · Skew · Excess kurtosis · Autocorrelation** |
| **How this group was built** | **Epochs · Config changes · Effective members · Live vs backtest (z)** |

Members with no stored overfitting verdict are called out by count and by share of the group's weight: *"Their risk is unknown, not absent."*

### Ideas, News and Operations

| Sub-view | What it is |
|---|---|
| `:basketId/ideas` | AI-suggested changes to the group, each testable in Trading Lab. Generating narrated ideas is entitlement-gated and returns **HTTP 402** on the free tier; the tab itself still routes and renders. |
| `:basketId/news` | Headlines and sentiment for what the group currently holds |
| `:basketId/operations` | The group's live actionings against its broker connections, with its stale-member and daily-update state |

### The `from` return address

Every drill-down out of a book-level table carries `?from=` recording the tab and filters you left. It is what makes **Back to Portfolio Manager** and the Manage-structure round trip return to where you actually were instead of to the section's bare path. The trail is one hop deep — an existing `from` is replaced, never stacked — and the value is sanitised before use, so a hand-edited external URL cannot become an open redirect.

## Endpoints behind the views

All of these are `GET` and all require `portfolios:read`.

| Surface | Book scope | Group scope |
|---|---|---|
| Ranking (decides which rows are in scope) | `/portfolio_manager/dashboard/compare/matrix` with only the active window and `sparklines=0` | `/portfolio_manager/baskets/{id}/subjects/matrix` |
| Inventory | `/portfolio_manager/dashboard` | `/portfolio_manager/baskets/{id}` + `/subjects` |
| Equity | `/portfolio_manager/dashboard/compare/series` + `/compare/lifecycle` | `/portfolio_manager/baskets/{id}/subjects/series` + `/subjects/lifecycle` |
| Metrics | `/portfolio_manager/dashboard/compare/matrix` with `sparklines=1&benchmark_row=1` + `/compare/correlation` | `/portfolio_manager/baskets/{id}/subjects/matrix` — **no correlation call** |
| Holdings | `/portfolio_manager/dashboard/holdings` | `/portfolio_manager/baskets/{id}/subjects/holdings` |
| Trades | `/portfolio_manager/dashboard/compare/trade-metrics` with `sort` and `limit=25` | `/portfolio_manager/baskets/{id}/subjects/trade-metrics` |
| Robustness | — | `/portfolio_manager/baskets/{id}/robustness` |

The matrix endpoint is called twice on purpose. The whole-book ranking call asks for one window and no sparklines and decides which rows are in scope; the Metrics tab's display call asks for every window plus sparklines and the benchmark row, for just those rows. The options are part of the cache key, so one call can never serve the other's payload — and changing Top N, the ranking metric or the timeframe costs no request at all.

### Per-endpoint id caps

These are **refusals, not truncations**. Exceeding one returns **HTTP 400** with `too many basket_ids: {n} (max {cap} for this endpoint)`.

| Endpoints | Cap |
|---|---|
| `compare/matrix`, `compare/series`, `compare/lifecycle`, `compare/correlation` | 200 |
| `compare/trade-metrics` | 60 |
| `dashboard/holdings` | 12 |

A malformed id returns **HTTP 400** with `invalid basket id: '{bad}'`.

## Retired routes and redirects

Every path below is a **redirect**, not a live surface. All of them preserve the query string and replace the current history entry, so the toolbar state on a shared link survives the hop and Back does not bounce through the old URL.

| Retired path | Redirects to | Why |
|---|---|---|
| `/analysis/deployed-portfolios/*` | `/analysis/portfolio-manager/*` | The section was renamed; the sub-path is preserved |
| `/analysis/portfolio-manager/equity` | `/analysis/portfolio-manager` | Equity is the bare route |
| `/analysis/portfolio-manager/overview` | `/analysis/portfolio-manager` | The pre-refactor landing tab |
| `/analysis/portfolio-manager/live` | `/analysis/portfolio-manager` | The live/backtest inventory split is gone — there is one book |
| `/analysis/portfolio-manager/backtest` | `/analysis/portfolio-manager` | As above |
| `/analysis/portfolio-manager/exposure` | `/analysis/portfolio-manager/holdings` | Absorbed into Holdings |
| `/analysis/portfolio-manager/rank` | `/analysis/portfolio-groups/rank` | Administrative half moved |
| `/analysis/portfolio-manager/rank/:viewId` | `/analysis/portfolio-groups/rank/:viewId` | Administrative half moved |
| `/analysis/portfolio-manager/baskets/:basketId` | `/analysis/portfolio-groups/baskets/:basketId` | Structure editing lives in the registry |
| `/analysis/portfolio-manager/groups/create` | `/analysis/portfolio-groups/groups/create` | Administrative half moved |
| `/analysis/portfolio-manager/groups/:groupId/edit` | `/analysis/portfolio-groups/groups/:groupId/edit` | Administrative half moved |
| `/analysis/portfolio-manager/:basketId` | `/analysis/portfolio-manager/:basketId/profile` | Profile is the landing sub-view |
| `/analysis/portfolio-manager/:basketId/performance` | `.../:basketId/equity` | Drew its own curves and could contradict the Metrics matrix |
| `/analysis/portfolio-manager/:basketId/risk` | `.../:basketId/equity` | The risk question is now a Y-axis choice |
| `/analysis/portfolio-manager/:basketId/transactions` | `.../:basketId/trades` | An order log says what was *sent*, not whether it worked |

The bare `/:basketId` route also translates legacy `?tab=` values and then drops the parameter, so the address bar ends up naming the view the way the app now does:

| Legacy `?tab=` | Lands on |
|---|---|
| `results` | Equity |
| `performance` | Equity |
| `risk` | Equity |
| `transactions` | Trades |

> [!CAUTION] One legacy shape is not recoverable
> A bare saved-view link of the form `/analysis/portfolio-manager/:viewId` cannot be redirected: that URL shape is now a portfolio group id. Only the longer `/analysis/portfolio-manager/rank/:viewId` form redirects, to `/analysis/portfolio-groups/rank/:viewId`.

### Retired concepts

- The **live/backtest inventory split** is gone. There is one book, and Status is a column rather than a filter tab.
- The retired **Overview** tab's two surviving surfaces are the **Needs attention** feed and the **Rebalances** timeline, now the Equity tab's right-hand rail at book scope only.
- The three-way Compare toggle (Scorecard / Detailed matrix / Top trades) is retired. Metrics is one matrix in two orientations, and trades moved to their own tab.
- The **Common window** / **Own history** comparison modes are no longer user-selectable; the toolbar always requests book mode.
