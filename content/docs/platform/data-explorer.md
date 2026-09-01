---
title: Data Explorer
section: Platform Overview
sectionOrder: 2
order: 4
published: true
updated: 2026-09-01
summary: Browse what every built-in dataset actually contains before you build it into a strategy, fitness function or risk manager.
keywords: data explorer, data library, market data, fundamentals, coverage, freshness, data sources, asset groups
---

The Data Explorer is Fintela's Data Library — a read-only view into every dataset that feeds the
platform. Pick a dataset and you'll see how many rows it holds, the date range it covers, how
fresh it is, and — for datasets built around individual tickers — per-ticker coverage, a chart of
how data is distributed over time, a chartable data series and the raw records themselves. You
can't edit anything here and you can't run a backtest from this page; it exists so you know
exactly what a data source contains before you build it into a [strategy](/docs/strategies), a
[fitness function](/docs/fitness-functions) or a [risk manager](/docs/risk-managers).

## Finding the Data Explorer

Data Explorer lives under **More Options** in the sidebar, not in the main Analysis list — see
[Navigation](/docs/navigation) for how that menu works. Once you're on the page, the top reads
**Analysis / Data Explorer**, with the subtitle **"Browse every dataset powering the platform —
live coverage, freshness and raw records."**

## Access and unlocking

Data Explorer is a paid feature. Whether it's unlocked depends on your organization's plan, not
on your individual role — everyone in your organization sees it the same way, unlocked or locked.

If it's locked for your organization, the sidebar entry is still there — you'll just see a small
lock icon with the tooltip **"Locked — buy tokens to unlock."** Clicking it still opens the page,
but what you'll see is a blurred preview of the real layout with no live data behind it, and a
panel reading:

- **Feature locked**
- **Buy tokens to unlock this feature.**
- a **Buy tokens** button that takes you to your token settings
- **This is a preview — your real data appears once unlocked.**

> [!NOTE] Browsing doesn't cost tokens
> Once Data Explorer is unlocked, looking around costs you nothing — no compute tokens are
> deducted for browsing datasets, no matter how much you click through. The only thing standing
> between you and the data is the one-time unlock. See
> [Tokens and billing](/docs/tokens-and-billing).

One thing worth knowing if you use the **Technical Indicators** dataset: its indicator picker
pulls its list from Markets, which is a separate feature with its own unlock. If Data Explorer is
unlocked but Markets isn't, that indicator dropdown will simply show no options.

## The Data Library sidebar

A column on the left, headed **Data Library**, lists every dataset you can browse, grouped into
seven categories (empty categories are simply left out). Each row shows an icon for its group,
the dataset's name, and how fresh it is — for example `today`, `3d ago`, or, once a dataset is
more than 45 days stale, the actual date it was last updated. A dataset with no recorded update
at all shows a dash.

Datasets that only cover the S&P 500 tracked universe — current and historical constituents —
carry a small coloured dot; hovering it explains that tickers outside that universe simply won't
show up.

## Landing overview

Before you pick a dataset, the main panel shows an overview of everything available: one card per
group, each listing how many datasets it holds, with a grid of clickable tiles underneath.

Each tile shows the dataset's name, an **S&P 500 universe** chip when the dataset is scoped that
way, a short description, and three quick stats:

| Stat | What it tells you |
|---|---|
| Rows | An approximate size of the dataset, e.g. `≈1.2M` |
| Window | The date range the dataset spans, from first date to last |
| Updated | How fresh the dataset is |

Once you select a dataset, those tiles are replaced by a header with the dataset's name, its
scope, its description, and four larger stat tiles: **Rows (est.)**, **First date**, **Last
date** and **Freshness**.

> [!NOTE] Row counts are estimates, not exact totals
> The **Rows (est.)** figure is always an approximation, which is why it's shown with a `≈`. For a
> dataset that was very recently loaded, the estimate can briefly look like a suspiciously round
> number until the platform finishes indexing it properly — that's expected, not a data problem.

## Dataset catalog

Every dataset you can browse — its name, description, which group it belongs to, and what kind of
view it opens — is maintained centrally and kept current automatically, so you'll always see the
full, up-to-date catalog without doing anything yourself.

### The seven groups

| Group | What it covers |
|---|---|
| Market data | Prices, technical indicators, market cap history |
| Fundamentals | Company and fund financials |
| Corporate actions | Dividends and stock splits |
| Events calendar | Earnings and IPO schedules |
| Alternative data | News sentiment, insider transactions |
| Macro & rates | Interest rates and macroeconomic indicators |
| Reference | Index membership, ticker metadata, groupings, and the data sources catalog |

### Every dataset and what it opens

Twenty datasets are available. Twelve of them open the standard ticker-by-ticker view described
below; the other eight — mostly reference and calendar data that isn't organized around
individual tickers — each open their own purpose-built view.

| Dataset | Group | What you can view | Look up individual tickers | Chartable data |
|---|---|---|---|---|
| Price Data | Market data | Ticker history | yes | Open, High, Low, Close, Adjusted Close, Volume, Market Cap |
| Technical Indicators | Market data | Ticker history | yes | whichever indicators Markets currently offers |
| Market Cap History | Market data | Ticker history | yes | Market Cap |
| US Equity Fundamentals | Fundamentals | Ticker history | yes | 15 financial metrics, see below |
| Crypto Fundamentals | Fundamentals | Ticker history | yes | Market Cap, Circulating Supply, Total Supply, Dominance, ATH, ATL |
| Analyst Trends | Fundamentals | Ticker history | yes | table only, no chart |
| Fund Fundamentals | Fundamentals | Ticker history | yes | Net Assets, Expense Ratio, Yield, Holdings Count |
| Dividends | Corporate actions | Ticker history | yes | Value, Unadjusted Value (shown as bars) |
| Splits | Corporate actions | Ticker history | yes | table only, no chart |
| News Sentiment | Alternative data | Ticker history | yes | Sentiment Score, Article Count |
| Insider Transactions | Alternative data | Ticker history | yes | table only, no chart |
| Index Constituents | Reference | Ticker history | yes | Constituent Count |
| Earnings Calendar | Events calendar | Events calendar | no | — |
| IPO Calendar | Events calendar | Events calendar | no | — |
| Interest Rates | Macro & rates | Rates | no | — |
| Macro Indicators | Macro & rates | Macro | no | — |
| Symbol Changes | Reference | Symbol changes | no | — |
| Ticker Metadata | Reference | Fields / Records | no | — |
| Hierarchical Groupings | Reference | Groupings explorer | no | — |
| Data Sources | Reference | Data Sources catalog | no | — |

US Equity Fundamentals can chart P/E Ratio, Market Cap, EBITDA, Beta, ROE, ROA, Dividend Yield,
Profit Margin, Operating Margin, Revenue TTM, Price/Book, PEG Ratio, Price/Sales TTM, 52-Week High
and 52-Week Low — fifteen metrics in total. A few of these are chart-only, and a couple show up in
the Feature picker under their internal field name rather than a friendly label.

Four datasets carry the **S&P 500 universe** chip because they're only collected for that tracked
universe: Market Cap History, News Sentiment, Insider Transactions and Analyst Trends.

For three datasets — Technical Indicators, Ticker Metadata and Hierarchical Groupings — the
coverage-date concept doesn't really apply, so their **First date**, **Last date** and
**Freshness** tiles always show a dash. Data Sources doesn't show these stat tiles at all, since
it's a reference catalog rather than a time series.

Five datasets can be narrowed down to a specific [asset group](/docs/asset-groups): Price Data,
US Equity Fundamentals, Crypto Fundamentals, Technical Indicators and Ticker Metadata. For US
Equity Fundamentals and Crypto Fundamentals, the asset-group picker only offers groups that
actually match that asset class.

> [!CAUTION] Index Constituents shows index codes, not ticker codes
> For the Index Constituents dataset, the **Ticker** and **Name** columns in the coverage table
> actually show the index's own code and name — not an individual stock. Its **Nulls** column is
> always shown as `0` rather than a real measurement.

## Ticker-scoped datasets

Twelve datasets open the standard ticker-by-ticker view. Its toolbar has a **View** toggle with
two options — **Coverage** and **Time Distribution** — plus, for datasets that support it, an
[asset group](/docs/asset-groups) filter on the right.

The filter is a dropdown starting with **All tickers**, followed by one option per asset group
you have access to. It's scoped to your organization — picking a group that isn't yours simply
returns no rows rather than an error.

### Coverage table

| Control | What it does |
|---|---|
| Search | Type a ticker code to filter the table; matching starts after a brief pause and ignores case |
| From / To | Narrow the table to a date range; each bound limits what you can pick for the other |
| CSV | Downloads the current page of results; greyed out when there's nothing to export |

Columns:

| Column | Sortable | Shows |
|---|---|---|
| Ticker | yes | The ticker code |
| Name | no | The company or instrument name |
| First Date | yes | Earliest date on record, or a dash |
| Last Date | yes | Most recent date on record, or a dash |
| Records | yes | How many rows exist for that ticker |
| Nulls | no | `0` in green when the data is complete, otherwise a highlighted count of missing values |

Click a column header to sort by it; click again to reverse the order. You can show 25, 50 or 100
rows per page (50 by default). Clicking a row opens the inspection panel described below.

Changing the dataset or the asset-group filter resets your search, date range, sort and page back
to their defaults.

> [!WARNING] The date filter doesn't apply to every dataset
> **From** and **To** are shown for every ticker-scoped dataset, but for Technical Indicators and
> Index Constituents they don't actually narrow the results — those two always show full history
> regardless of what you set.

### Time Distribution chart

A chart labelled **"Data presence over time,"** with a toggle for **Monthly** (default) or
**Yearly** grouping. It combines a bar showing how many tickers have data in each period with a
line showing how many total records were recorded, and you can zoom in on any stretch of time.

> [!NOTE]
> Time Distribution always reflects the whole dataset — it ignores the asset-group filter and the
> From/To date range, and it isn't paginated.

### Inspection drawer

Click any row in the coverage table to open a panel with a closer look at that ticker. It shows
the ticker code, the dataset name, and — where the dataset supports charting — a selector for
which data series (or, for Technical Indicators, which indicator) to inspect.

When a chartable series is available, you'll also see four quick stats — **Min**, **Max**,
**Mean**, **Last** — computed from the data currently loaded, and a toggle between **Chart** and
**Table** views. Chart is the default, except for Splits, Insider Transactions and Analyst
Trends, which don't have a chartable series and open straight on the raw records table.

- **Chart** — plots the selected series for that ticker. Dividends renders as bars; everything
  else renders as a line. If you're viewing Technical Indicators and haven't chosen an indicator
  yet, you'll see a prompt to pick one first.
- **Table** — the raw stored records for that ticker, 50 rows at a time. Long lists (like an
  index's constituents) are truncated with a "+N more" note and the full list available on
  hover.

A chart shows up to the most recent 500 data points for that ticker.

Switching to a different ticker or dataset resets the view back to its defaults.

## Events calendars

Earnings Calendar and IPO Calendar share the same layout, with a toggle for **Upcoming**
(default) or **Past**, and a search box for company name or ticker.

| Window | Earnings shows | IPOs show |
|---|---|---|
| Upcoming | the next 30 days | the next 60 days |
| Past | the last 30 days | the last 30 days |

Events are grouped by day, with each day showing how many events fall on it.

**Earnings rows** show the ticker, the company name, whether the report is before or after market
open (**BMO** / **AMC**), and the estimated figure. In the Past view, you'll also see the actual
reported figure and how far it beat or missed the estimate. If the ticker is one Fintela tracks,
clicking it opens that ticker in [Market](/docs/market).

**IPO rows** show the company name, its ticker, its exchange where known, the expected price
range, the offer price once set, the number of shares, and the deal type where known.

## Interest rates panel

Up to five quick-read tiles at the top: yield for the 3-month, 2-year, 10-year and 30-year
Treasury tenors, plus a **2s10s spread** — the gap between the 2-year and 10-year yields in basis
points, a widely watched recession signal — shown whenever both of those tenors have data.

- **Yield curve** — plots the current yield for every available tenor side by side, so you can
  read the curve's overall shape at a glance.
- **History** — plots daily yields for one tenor at a time, defaulting to the 10-year (or the
  shortest available tenor if that's missing), over its most recent 500 observations.

> [!NOTE] Reading the curve
> Each point on the yield curve uses that tenor's most recent available reading as of the
> selected date — so if one tenor's data is a day or two behind another's, the curve mixes dates
> slightly rather than leaving a gap. Yields are shown as ordinary percentages.

## Macro indicators panel

Two dropdowns — **Country** (US by default) and **Indicator** — drive this view. The chart on the
left plots the selected indicator's history for that country; the table on the right, **Latest
values**, lists every indicator's most recent reading for that country side by side, so you can
scan a country's whole macro picture at once.

## Symbol changes panel

A single table titled **Symbol changes**, tracking ticker renames across exchanges, with a search
box matching the old symbol, the new symbol, or the company name.

| Column | Shows |
|---|---|
| Date | When the change took effect |
| Change | The old symbol and the new one |
| Company | The company name |
| Exchange | Which exchange, where known |

## Ticker Metadata panel

Ticker Metadata opens a two-tab view — **Fields** and **Records** — plus the asset-group filter.
Clicking a field in the Fields tab jumps you to Records already filtered to tickers that have
that field populated.

### Fields tab

A searchable list of every metadata field Fintela tracks about a ticker — things like sector,
industry, country, currency, ISIN and similar identifiers — 18 fields in total. A switch lets you
show only the fields that are actually available to inject into your own strategies.

| Column | Shows |
|---|---|
| Field | The field's name |
| Description | What the field represents |
| Type | Text or number |
| Used in strategies | Whether you can pull this field into a strategy you write |
| Availability | What share of tickers actually have a value for this field |
| Distinct | How many different values exist across all tickers |
| Sample values | A handful of example values |

**Availability** counts a value as present only when it's actually filled in — an empty string
doesn't count as data.

### Records tab

Browse the metadata for individual tickers, with a search box, a filter for "only tickers where
these fields are populated," a column chooser (you can hide columns, but at least one must stay
visible), and CSV export of whatever's currently on screen.

By default you'll see Code, Name, Type, Sector, Industry, Country, Currency and ISIN; you can add
more from the column chooser. Pagination offers 25, 50 or 100 rows per page.

## Hierarchical Groupings panel

A two-pane explorer for the platform's built-in groupings — sector-ETF collections, index-based
universes and similar structures you can use as a strategy's universe.

The left pane lets you pick a namespace, then browse its groupings by code and name. Selecting one
shows its full description on the right, along with its kind, its source, and its asset class.

> [!CAUTION] Some groupings carry survivorship bias
> A grouping whose membership is derived from a current ticker attribute (rather than tracked
> historically) uses today's snapshot for every date you look at — including past ones. If you
> backtest a strategy over a grouping like this, you're implicitly assuming its current members
> always belonged to it, which introduces survivorship bias into your results. The panel flags
> these with a **"no temporal versioning"** warning so you know before you build on one.

Below that, you'll see the grouping's parent and child groupings (if any), and a **Constituent
timeline** chart showing how many members the grouping held over time — choose 1, 3, 5 or 10 years
back, or the maximum available history.

## Data Sources catalog

The Data Sources dataset is your reference for exactly what you can build into a
[strategy](/docs/strategies), [fitness function](/docs/fitness-functions) or
[risk manager](/docs/risk-managers) — every data source available, what shape it comes in, how to
use it in your own code, and a live sample of real data.

### Built-in data sources

One entry per data source Fintela offers, each showing its label, its data type, whether it needs
any configuration before use, and the keyword you'd use to reference it in your own strategy code.

| Data source | Used in your code as |
|---|---|
| Ticker metadata | `meta` |
| Trading volume | `volume` |
| News sentiment | `sentiment` |
| Market cap | `market_cap` |
| Dividends | `dividends` |
| Splits | `splits` |
| Insider transactions | `insider_flow` |
| Analyst estimate revisions | `analyst_revisions` |
| Fundamentals (crypto) | `fundamentals` |
| Fundamentals (US equity) | `fundamentals` |
| Fund expense ratio | `expense_ratio` |
| Days to next earnings | `next_earnings_days` |
| IPO activity | `ipo_activity` |
| Interest rates | `rates` |
| Macro indicators | `macro` |
| Symbol changes | `symbol_changes` |
| Benchmarks & reference series | `benchmarks` |
| Hierarchical groupings | `groupings` |
| Platform default clusters | `default_clusters` |
| Basket holdings | `basket_holdings` |

Sources marked as needing configuration — interest rates, macro indicators, benchmarks,
groupings, default clusters, and basket holdings — need you to pick specifics, like which
country's macro data or which benchmark series, before Fintela can show you a preview or inject
them into your strategy.

> [!NOTE] Prices aren't in this list
> Adjusted close prices are always available to every strategy by default — they're not an
> opt-in source you need to add, which is why you won't find them in this catalog.

A few sources come with real coverage limits worth knowing before you rely on them: news
sentiment and market cap are only collected for the tracked S&P 500 universe, and dividends and
splits only exist for equities — none of the four are available to a strategy running over a
crypto or forex asset group. Within equities, a ticker that has simply never paid a dividend (or
never split) correctly shows as all zeros, not as missing data.

### What a shape card shows

Expanding any source shows a description of what it contains, a plain-language explanation of its
structure, an example of how to reference it in your own code, its available columns or fields,
and — once you've configured anything it needs — a live preview built from real data.

Sources that don't need a specific ticker — groupings, default clusters, basket holdings —
preview immediately. Sources tied to individual tickers ask you to pick an asset group first, so
the preview reflects real tickers you'd actually use.

## Looking for Data Pipelines?

If you used the old Data Pipelines page, that page is gone — any old link to it now opens Data
Explorer instead. The two things Data Pipelines used to do now live in two different places:

| What you wanted to do | Where it lives now |
|---|---|
| See what a data source actually contains | The Data Sources dataset here in Data Explorer, or any of the per-dataset panels above |
| Wire a data source into a strategy, fitness function or risk manager | The Data Sources section inside each one's own editor |

Each editor now lists the same catalog shown here, lets you tick the sources you want, keeps your
code's parameters in sync automatically, and holds the configuration for sources that need it.
See [Strategies](/docs/strategies), [Fitness functions](/docs/fitness-functions) and
[Risk managers](/docs/risk-managers).

Data Explorer is the browsing half of that split — look, don't touch. Wiring a source into
something you'll actually run happens in that resource's own editor.

## Bookmarking and sharing a view

The dataset you're viewing, an asset-group filter, whether you're on the Coverage or Time
Distribution tab, and an open ticker inspection are all saved into the page's address — so you
can bookmark a specific view or share the link with a teammate and they'll land on exactly what
you were looking at.

Search terms, sort order, page number, the coverage date range, and panel-specific choices like
the events calendar window or the rates tenor are not part of that link — those reset to their
defaults whenever the page loads fresh.

## Exporting data

Four places on this page let you download what's currently on screen as a CSV file:

| Where | Downloads |
|---|---|
| Coverage table | The current page of ticker coverage rows |
| Inspection drawer, Chart view | The plotted series for that ticker |
| Inspection drawer, Table view | The raw records for that ticker |
| Ticker Metadata, Records tab | The currently visible columns for the filtered tickers |

> [!WARNING] Exports cover what's on screen, not the full result set
> Every export downloads only what's currently loaded — the current page (up to 100 rows in the
> coverage and metadata tables), the drawer's fixed 50-row page, or up to 500 charted points. If
> you need more than that, narrow your filters first so the rows you want are the ones on screen.

## What the Data Explorer does not do

- **No transforms.** Everything you see is exactly as stored — the only reshaping controls
  anywhere on this page are the Monthly/Yearly toggle, the rates tenor selector, and the
  groupings timeframe selector. If you need derived or resampled series, or to join sources
  together, that happens when you wire data sources into a strategy, not here.
- **No writes.** Every view on this page is read-only. Nothing you do here creates, edits or
  deletes anything — for that, you'd go to the strategy, fitness function or asset-group editors
  themselves.
- **No ticker drill-in for eight datasets.** Earnings Calendar, IPO Calendar, Interest Rates,
  Macro Indicators, Symbol Changes, Ticker Metadata, Hierarchical Groupings and Data Sources each
  open their own dedicated view instead of the standard per-ticker coverage table — that's
  expected, not a bug.
- **No control over an indicator's calculation window.** Technical Indicators are calculated
  using platform defaults; there's no control here to adjust the window used behind an
  indicator's calculation.
