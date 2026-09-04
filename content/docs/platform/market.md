---
title: Market
section: Platform Overview
sectionOrder: 2
order: 3
published: true
updated: 2026-09-01
summary: Live market data: indices, sector and country performance, an indicator based screener, and a deep dive on every ticker.
keywords: market, markets, screener, tickers, fundamentals, news, quotes, sectors, countries, coverage, asset classes, crypto, equities
---

Markets is your window onto market wide data, organized into four tabs. Almost everything here is
for looking and comparing: index levels and breadth, a heat mapped view of a whole exchange, one
instrument in depth, sector and country performance, and an indicator based screen you can rank the
market with. The one thing Markets actually *creates* is an Asset Group, when you turn a Screener
ranking into a saved list of tickers you can build studies around. Every number on the page is set
at the end of the trading day: Markets does not show intraday, real time prices.

## What Markets is

| Tab | What it shows |
|---|---|
| **Market Pulse** | Indices and market breadth, Treasury yields, a heat mapped view of the whole exchange, a volatility watchlist, and an upcoming earnings agenda |
| **Ticker** | One instrument in depth: identity and returns, a price chart, fundamentals, and detail panels for financials, analyst estimates, insider activity, news and more |
| **Sectors & Countries** | How US sectors and countries have performed across eight time horizons |
| **Screener** | Rank tickers by an indicator you choose, then compare or save the results |

Three things hold true across the whole page:

- **One exchange at a time.** There's no combined, "everything at once" view anywhere in Markets.
  The default is the US market; Market Pulse and Ticker each have their own exchange picker, and
  Sectors & Countries always shows the US market.
- **End of day only.** Prices refresh once a day, in the early hours after the US market closes:
  Markets does not display intraday prices.
- **Each card shows its own "as of" date**, rather than one date for the whole page. Different parts
  of Markets refresh at slightly different points overnight, so on an unusual day two cards can
  legitimately be a trading session apart: the page tells you when that happens rather than hiding
  it.

> [!NOTE] Two different screeners
> The Screener on this page ranks tickers by *indicators* (like alpha or volatility) over a
> window of time you choose. The Screener Workbench inside the [Asset Groups](/docs/asset-groups)
> editor is a different tool: it filters by *fundamentals*, like sector or market cap, with no time
> dimension. Use whichever matches the question you're asking.

## Access and the Markets entitlement

Markets sits behind the same token based entitlement as other premium areas of the platform. If
your organization hasn't unlocked it yet:

- The **Markets** entry still appears in the sidebar, marked with a lock icon and a tooltip
  telling you it needs to be unlocked.
- Opening the page shows a blurred preview of the interface with a "Feature locked" message and a
  button to buy tokens: a reminder that what you're seeing is a preview, not your real data.

See [Navigation](/docs/navigation) for how locked features generally behave in the app, and
[Tokens and billing](/docs/tokens-and-billing) for how your organization unlocks a feature like
this one. As with the rest of Fintela, you also need to be signed in: Markets has no public,
logged out view.

## Tabs, links and sharing a view

Every view in Markets lives in its own link: which tab you're on, which exchange you picked,
which ticker you're looking at, whether the comparison dialog is open. That means you can bookmark
a specific view, or send a colleague a link, and they'll land on exactly what you were looking at.

Tabs behave like ordinary links: Cmd/Ctrl click opens one in a new browser tab, and switching tabs
keeps whatever else you had selected. If you have an old bookmark from an earlier version of
Markets, it still works: the page quietly forwards you to today's equivalent tab.

Other places in the product deep link straight into a tab:

- Clicking a heatmap tile, a row in the volatility watchlist, or a row on the earnings agenda
  jumps you to that instrument's **Ticker** tab.
- The **"Open in Screener →"** link on Sectors & Countries jumps into the **Screener**,
  pre filtered to that sector.

Each tab also tells [Fintelligent](/docs/fintelligent) what you're looking at, so if you ask it a
question while you're on Markets, it has that context.

## Market Pulse

Scoped by the exchange picker in the heatmap toolbar, which also drives the volatility watchlist
beside it.

### Indices strip and market breadth

Across the top, a horizontal row of up to ten cards shows major indices for the selected exchange:
each card gives the index level and how much it moved that day, colored green or red.

Next to it, the **Market Breadth** bar tells you how broad that move really is:

- How many names advanced versus declined, and the average daily return
- A warning (*"Market is top heavy: index gains may be narrow"*) when fewer than 40% of stocks
  are actually up, so a strong index doesn't get mistaken for a strong market
- Total market cap and average daily volume for the exchange

This strip is the one part of the page that refreshes automatically, about once a minute while
you have it open: though the underlying numbers themselves still only change once a day.

### Treasury Yields

A yield curve strip shows current US Treasury yields alongside where they stood a week ago, so you
can see at a glance whether rates are rising or falling across maturities. It hides itself entirely
when there's no data to show.

- A line chart plots the current curve against the curve from a week ago.
- Key maturities (3-month, 2-year, 10-year, 30-year) appear as tiles, each with its move in basis
  points over the past week.
- When available, a **2s10s Spread** tile shows the gap between the 10-year and 2-year yields, and
  flags **"Curve inverted"** when it's negative: a widely watched signal.

Yields are shown in percent (4.25 means 4.25%).

### Heatmap toolbar

A control row above the map lets you shape what it shows:

| Control | What it does |
|---|---|
| Exchange | Pick which market to view: no "all exchanges" option; you always view one exchange at a time |
| Group by | Cluster tiles by Sector, Industry, Theme, or Subtheme. A grouping is greyed out when too little of the market carries that classification, so you don't end up with a mostly blank map |
| Size by | Size each tile by market cap or by dollar trading volume |
| Filters | Open a panel of finer filters (below); the button shows a badge when any are active |
| Reset | Appears once you've changed something, to restore the defaults in one click |

### Heatmap filters

- **Sector / Industry / Theme / Subtheme**: multi select, to focus on the slices of the market
  you care about
- **Market cap tier**: Any, Mega (≥$200B), Large ($10B to $200B), Mid ($2B to $10B), Small
  ($300M to $2B), or Micro (≤$300M)
- **Minimum price** and **minimum average volume**: screen out illiquid or penny names so a
  handful of noisy tickers can't distort the picture
- **Maximum daily move**: guards against a bad or erroneous price print skewing the map
- **Tiles shown**: how many tickers appear at once, from 60 up to 500

### Market Heatmap

The heatmap is a treemap: each tile is one ticker, sized by whichever metric you chose and colored
by how much it moved that day: green for gains, red for losses, with the intensity of the color
scaled to that day's actual range of moves.

- **Click a tile** to open that ticker on the Ticker tab.
- **Click a labeled group** (a sector, industry, etc.) to zoom in and see it broken into its next
  level of detail; a breadcrumb trail at the top lets you zoom back out, one level at a time.
- **Hovering a tile** shows its return, market cap, and sector; **hovering a group** shows its
  combined, size weighted return.
- A caption below the map tells you how many tickers are shown out of the full universe, and how
  many were left out: either excluded (stale, illiquid, or an implausible price move) or hidden
  (no size metric available): so nothing goes missing without explanation.
- Tickers that don't fit any classification land in an **Unclassified** bucket, which can't be
  zoomed into further.

> [!TIP] The heatmap is not a "top gainers" list
> Tiles are chosen and sized by market cap or trading volume, capped at however many tiles you
> asked for: never ordered by how much a ticker moved. That's deliberate: ranking purely by
> biggest move would fill the map with data glitches and thinly traded outliers instead of the
> stocks that actually matter to the market.

### Zooming into a group

Zooming into a group always shows you the true picture for that group: not just whichever names
from it happened to already be on screen. That distinction matters: if zooming simply reused the
tiles already loaded, drilling into "Technology" might really only show you the handful of tech
names that made the market wide cut, mislabeled as the whole sector.

You can drill down from Sector → Industry → Theme → Subtheme, one level at a time. Changing the
base grouping, the exchange, or any filter resets you back out to the top level.

### Volatility Watch

A ranked list of the most volatile names on the selected exchange over the last 90 days (using
coefficient of variation, a measure of how much a price swings relative to its average). For each
ticker you get a 30-day trend sparkline, its 90-day volatility, and its current price. Click any
column header to re sort; by default, the most volatile names come first. Click a ticker to jump to
its Ticker tab.

### Upcoming Earnings

A forward looking agenda of scheduled earnings reports over the next 7, 14, or 30 days (your
choice), showing up to 25 companies. Each row shows the report date, the ticker and company name,
whether it reports before the opening bell or after the closing bell, and the consensus EPS
estimate where one is available. The list favors larger companies when deciding what to include,
but is sorted by date so it reads like a calendar.

## Ticker

Search for or click through to any instrument to see it in depth. If you open the tab without
picking one, it starts you on the platform's default benchmark instrument.

### Identity strip and period returns

At the top: an exchange picker (this only affects the Ticker tab, not the rest of Markets), a
search box to jump to any ticker by code or company name, and the instrument's name with its
exchange, sector and country underneath. A small badge appears when the company has an earnings
report coming up.

Below that, seven tiles show the return over **1 day, 1 week, 1 month, 6 months, year to date,
1 year, and 5 years** (green for gains, red for losses) computed from up to ten years of price
history.

> [!NOTE] The search box is labelled "Benchmark"
> You may notice the search field says "Benchmark": it's shared with the portfolios feature's
> instrument picker. Here it simply searches for any ticker, not just recognized benchmarks.

### Partial data coverage

If an instrument has thin data: no price history at all, it's been delisted, or its last price is
more than five days out of date: a **"Partial data coverage"** banner appears so you know what
you're looking at. It shows:

- How much price history is available, or that there's none
- Whether the instrument is delisted
- How many days behind the exchange its last price is
- How many of the available data sources: fundamentals, financials, analyst estimates, insider
  activity, sentiment, corporate actions, crypto fundamentals: actually have data for this ticker

This is an informational note, not an error: a delisted stock is genuinely never going to get a new
price again, and a small international listing genuinely may have no analyst coverage. Both are
normal, not broken.

### Price chart

Toggle between a **line chart** (with 50-day and 200-day moving averages) and **candlesticks**,
which also add a trading volume pane. Choose a range from 30 days up to 5 years, or the full
history. Prices are adjusted for stock splits, so a split never shows up as a fake price crash.

### Fundamentals

A snapshot of the company across three groups:

| Group | What's in it |
|---|---|
| Valuation | Market cap, P/E ratio, exchange, sector, industry |
| 52-Week Range | The past year's low and high, with a bar showing where the current price sits, plus trading volume |
| Risk / Yield | Beta (highlighted when unusually high or low), dividend yield, today's price, country, currency |

Below the three groups sits a short company description.

### Detail panels

A set of tabs lets you dig into one instrument from every angle. A panel disappears entirely when
it simply doesn't apply to this kind of instrument (crypto fundamentals on a stock, for example);
it stays visible but greyed out when it could apply but there's genuinely no data on file for this
name.

- **News**: headlines and coverage for the ticker; always available, whatever your coverage tier
- **Financials & Earnings**: quarterly EPS history against estimates, plus income statement,
  balance sheet, and cash flow highlights
- **Analyst Expectations**: consensus estimates by horizon (current/next quarter, current/next
  year), with estimate ranges, analyst counts, and recent revisions
- **Insider Activity**: Form 4 insider buy/sell activity, with a link out to the underlying SEC
  filing
- **News Sentiment**: a daily sentiment score trend alongside article volume
- **Corporate Actions**: dividend history and stock splits
- **Fund Profile**: for ETFs and funds: assets under management, expense ratio, yield, sector
  weights, and top holdings
- **Crypto Fundamentals**: for crypto assets: market cap, circulating/total/max supply,
  dominance, all time high and low

Analyst Expectations, Insider Activity, and News Sentiment are only available for companies in
Fintela's actively tracked coverage universe: roughly the S&P 500, current and historical members
(more on this under [Asset classes and coverage](#asset-classes-and-coverage)). Outside that set,
those panels appear disabled rather than empty.

> [!CAUTION] "No data" and "not available" are different things
> Fintela is careful to distinguish a panel that doesn't apply to this kind of instrument, one that
> applies but has nothing on record, one where a data source is temporarily unavailable, and: for
> news specifically: one where Fintela simply hasn't been able to check yet. Don't read "nothing
> showed up" as "there is nothing to find."

## Sectors & Countries

Always scoped to US listed instruments: there's no exchange picker here, since the sector and
country groupings are built from a US benchmark universe. A small "US listings only" chip is a
reminder that even the country rows are measured through US listed ETFs.

### KPI bar

Five headline numbers above the table: how many groups are shown, how many are up versus down
today, the average return across all groups, and which group is leading and which is lagging.

### Performance matrix

The core table: one row per sector or country, with returns across eight time horizons: today,
1 week, 1 month, 6 months, year to date, 1 year, 5 years, and 10 years: plus which of those
horizons was that group's best, and how many tickers make it up.

Toggle between **Sectors** and **Countries**, choose a weighting method (below), and optionally
highlight the best/worst return in each row or the leading group in each column. Click any column
to sort by it; the default is today's return.

Cells are color coded from red to green, scaled separately per horizon, so a 1-day move and a
10-year move are each judged against a sensible range for their own timeframe. A dash means no
return is available for that cell: Fintela never fills in a fake zero.

Because today's figures are built early the next morning from the prior session's close, that
column's header shows the actual date it reflects rather than just the word "Today." If the
sector/country snapshot happens to be a session behind the rest of the market's data, a warning
chip says so rather than letting the mismatch pass unnoticed.

### Weighting lenses

Three ways to calculate a sector's (or country's) return:

| Lens | What it measures | Available for |
|---|---|---|
| Equal weight | A simple average across every member: measures how broad a move is, not how big the biggest names are | Sectors |
| Market cap weight | A synthetic index of the group weighted by company size (the default for sectors) | Sectors |
| ETF proxy | The actual return of a real, tradable ETF that represents the group | Sectors and Countries |

Countries only use the ETF proxy lens: equal- or cap weighting would really be grouping US listed
companies by where they're headquartered, rather than measuring the foreign market itself: a
different question.

Fintela uses 11 SPDR sector ETFs as sector proxies: Technology (`XLK`), Healthcare (`XLV`),
Financial Services (`XLF`), Consumer Cyclical (`XLY`), Consumer Defensive (`XLP`), Energy (`XLE`),
Industrials (`XLI`), Basic Materials (`XLB`), Utilities (`XLU`), Real Estate (`XLRE`), and
Communication Services (`XLC`): and 33 US listed single country ETFs as country proxies, including
Japan (`EWJ`), South Korea (`EWY`), Brazil (`EWZ`), Australia (`EWA`), Canada (`EWC`), Germany
(`EWG`), United Kingdom (`EWU`), Mexico (`EWW`), China (`MCHI`), India (`INDA`), and two dozen more
across Europe, Asia and Latin America.

### Drill down drawer

Click any row to open a side panel with more detail: the group's return across all eight horizons
as a grid of colored tiles, and two short lists (**Top gainers** and **Top losers**) among the
tickers that make up that group. A footer link jumps straight into the Screener, pre filtered to
that sector.

In Countries view, a note clarifies that the country's return is measured through its
representative ETF, and the constituent list underneath shows US listed companies domiciled there,
included for reference rather than as the actual basis of the calculation.

## Screener

This is where you rank the entire market (or a slice of it) by a single indicator, such as alpha
or volatility, over a time window you choose. It's also where a ranking becomes something you can
act on: save it as an Asset Group, or open a side by side comparison of the top names.

Until you pick an indicator, the tab prompts you to choose one, a window size, and a z score mode
from the filter bar above. On first load it defaults to ranking current S&P 500 members by alpha.

### Filter bar

- **Indicator**: which metric to rank by; only indicators that make sense for a plain ticker are
  offered (a handful of trade based metrics, like win rate, only apply to a strategy's trade
  history and aren't shown here)
- **Window size**: how much history the indicator is computed over (2, 4, or 6 weeks, or the full
  series)
- **Z Score**: standardize the raw values so they're comparable across different tickers. Compare
  each ticker against its peers on the same day ("vs peers"), or against its own history over N
  weeks; turn this off to see the raw, unstandardized value instead
- **Direction**: Top Performers or Bottom Performers
- **Show top**: how many results to display, from 10 up to 250, or all matches
- **Date**: pick a specific date to rank as of; defaults to the latest date available for your
  current filters
- **Filters**: open the Asset Filters panel for more precise targeting (below)

> [!NOTE] Why you can't pick an arbitrarily old date
> Indicator history is kept for roughly the trailing 60 trading days (about three months) and
> that window rolls forward every day. If a search comes back empty, picking an even earlier date
> won't help; try loosening a filter instead.

### Quick universes

Quick select chips jump straight to a common starting universe:

- **S&P 500**: current index members
- **Country ETFs** / **Sector ETFs**: the same curated ETF proxies used in Sectors & Countries
- **Operating companies**: excludes ETFs, funds and similar wrapper instruments (preferred stock,
  units and warrants are still included)
- **Liquid only**: price at least $5 and at least 500,000 shares/day average volume, to screen out
  illiquid or penny names

You can also filter by **Theme** or **Subtheme** alongside these.

### Asset Filters

- **Index membership**: current members, ever a member, members throughout a period, or members
  as of a specific date
- **Exchange, Sector, Country, Type**: standard classification filters (sector/country/type are
  hidden when you're screening crypto, since they don't apply there)
- **Market Cap**: a min/max range

Applied filters appear as removable chips, so you can see your exact criteria at a glance. **Reset**
clears just this panel, leaving your quick universe chip untouched.

> [!WARNING] You can't screen crypto by fundamentals here
> The Screener ranks by market indicators, not fundamentals: for crypto assets, fields like
> circulating supply or dominance aren't offered as screening criteria.

### Summary tiles

Above the results, five tiles summarize the run at a glance: how many tickers matched, the top
performer and its rank, the name at the bottom of the range, the average value with the spread
between minimum, median, and maximum, and the date the data reflects.

### Top Performers results

Results display as a horizontal bar chart (green or red by direction) or a sortable table with
rank, ticker, sector, the indicator value, price, day's change, market cap, and volume. Click a bar
or a ticker to open it on the Ticker tab. From here you can open **Evaluate & compare** on the
results, or turn the ranking straight into an **Asset Group**.

### Metrics comparison rail

A compact side panel automatically compares the top six results on trailing one year performance:
return, CAGR, max drawdown, and Sharpe ratio: a quick sanity check before you dig further. Expand
it for the full comparison dialog.

### Evaluate & compare

A side by side comparison of up to **8 tickers**, across nine time windows (from month to date out
to 5 years) and eight metrics:

| Metric | Better direction | Unit |
|---|---|---|
| Total Return | Higher is better | Percent |
| CAGR | Higher is better | Percent |
| Sharpe | Higher is better | Ratio |
| Sortino | Higher is better | Ratio |
| Volatility | Lower is better | Percent |
| Max Drawdown | Lower is better | Percent |
| Alpha | Higher is better | Percent |
| Beta | Informational: not scored | Ratio |

Full definitions for each metric are in the [metrics reference](/docs/metrics-reference).

Launched from the Screener, the dialog starts pre loaded with your top results, sliced to eight;
opened on its own, it starts with a default set of well known large caps (`AAPL`, `MSFT`, `GOOGL`,
`AMZN`, `NVDA`, `META`, `TSLA`) so you have something to compare right away. Toggle between viewing
every ticker at one window, or one metric across every window with a trend sparkline.

### Create Asset Group

Once you have a ranking you like, turn it into a group you can build studies around: give it a
name (prefilled from your ranking) and an optional description, and Fintela creates an
[Asset Group](/docs/asset-groups) containing every ticker in the current results: ready to use in
a study.

> [!NOTE] "Asset Group" and "Cluster": same thing
> This dialog uses both names in different places: the title says "Asset Group," the field says
> "Cluster name." They mean the same object.

## Asset classes and coverage

Fintela's market data spans four exchanges:

| Exchange | Covers |
|---|---|
| US | Common stock, ETFs, indices, preferred stock |
| CC | Cryptocurrency: every listed type |
| FOREX | Currency pairs |
| World indices | A curated set of major indices beyond the US, available one at a time rather than as a browsable exchange |

Not every kind of data is available for every ticker in that universe:

| Data | Coverage |
|---|---|
| Prices, the heatmap, indicators, sector/country performance | The full universe for whichever exchange you're viewing |
| Analyst expectations, insider activity, news sentiment, historical market cap | Fintela's actively tracked coverage universe: roughly the S&P 500, current and historical members. Outside it, those panels show as unavailable |
| News headlines | Available for any ticker Fintela's news provider covers: broader than the tracked universe above |
| Theme / subtheme grouping | Depends on how much of the market has been classified; a grouping option is hidden when too little of the market carries it |

In Sectors & Countries, a sector or country label with no real analytical meaning is dropped from
the table, and under the ETF proxy lens a group with no matching ETF is left out entirely rather
than shown as an empty row.

## Freshness and as of dates

Everything in Markets is built from data that refreshes overnight: nothing here is real time. In
broad strokes: price and market wide data (daily bars, the heatmap, breadth, sector and country
performance) land first, in the early hours after the US close; deeper fundamentals, financials,
and analyst or insider data follow through the morning; and derived views, like the Screener's
indicators and the Evaluate & compare metrics, land a bit later still, once the data beneath them
is ready.

Because these pieces refresh on their own overnight schedule, the Market Heatmap and Sectors &
Countries (which draw from different overnight snapshots) can occasionally be a session apart on
an unusual day, such as after a holiday or a delayed data run. When that happens, a
**"Snapshot is behind the latest session"** warning tells you so rather than letting it pass
unnoticed. Evaluate & compare's metrics typically finish updating a few hours after price data.

The authoritative answer to "what is the most recent day with real data" is the exchange's
watermark date, shown on individual cards: it only advances on a day the exchange actually
received new data, so it correctly skips forward over weekends and market holidays rather than
drifting.

## Limits

- **No intraday data.** Nothing on this page updates within a trading session: even the
  auto refreshing breadth bar is refreshing the same once a day snapshot.
- **No combined, cross exchange view.** Markets always shows one exchange at a time.
- **No crypto screening by fundamentals.** The Screener ranks by market indicators, not
  fundamentals, for crypto assets.
- **Sectors & Countries is US only**, and countries are always shown through their ETF proxy.
- **The Markets Screener doesn't filter by fundamentals.** For that, use the Screener Workbench in
  the [Asset Groups](/docs/asset-groups) editor.
- **Indicators are ticker only here.** Portfolio level indicator views have been retired.
- **A few generated labels always display in English**, regardless of your language setting: the
  Screener's configuration label, and the default name and description when you create an Asset
  Group.
- **Markets creates exactly one thing you build on: an Asset Group**, from a Screener ranking. For
  everything downstream (studies, optimization, portfolios) start from the
  [end to end workflow](/docs/end-to-end-workflow).
