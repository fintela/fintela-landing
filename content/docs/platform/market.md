---
title: Market
section: Platform Overview
sectionOrder: 2
order: 3
published: true
updated: 2026-08-20
summary: Live market data — instruments, screener, fundamentals, news, and the coverage behind them.
keywords: market, markets, screener, tickers, fundamentals, news, quotes, coverage, asset classes, crypto, equities
---

Markets is Fintela's read-only window onto the market-data plane that the platform's background
workers keep fresh. It lives at `/analysis/markets`, it is one route with four tabs, and the only
thing it creates is an Asset Group — everything else is inspection: index levels and breadth, a
treemap of the whole exchange, one instrument in depth, sector and country performance across eight
horizons, and an indicator-ranked screen. Every number on the page is end-of-day. Fintela does not
display intraday prices.

## What Markets is

Four tabs, in this order:

| Tab key (`?tab=`) | Label | What it shows |
|---|---|---|
| `pulse` | `Market Pulse` | Indices strip, market-breadth bar, Treasury-yield strip, treemap heatmap with drill-down zoom, volatility watchlist, upcoming-earnings agenda |
| `ticker` | `Ticker` | One instrument: identity strip, seven period-return tiles, price chart, fundamentals card, coverage banner, and an eight-panel deep-dive strip |
| `groups` | `Sectors & Countries` | US-only sector/country performance matrix across eight horizons under three weighting lenses, plus a drill-down drawer |
| `screener` | `Screener` | Indicator-ranked screen with an asset-filter popover, quick-universe chips, results as chart or table, a metrics-comparison rail, and a full comparison modal |

Three rules run through the whole surface:

- **One exchange at a time.** There is no cross-exchange rollup anywhere in Markets. The default is
  `US`; Market Pulse and Ticker each own an exchange picker, and Sectors & Countries is US-only by
  construction. The picker component *can* render an "All exchanges" option, but every call site in
  Markets passes `includeAll={false}`.
- **End of day only.** Prices come from nightly cron workers. The Sectors & Countries caption says
  it verbatim: `refreshed daily at 06:00 UTC (~02:00 ET), after the US close — Fintela does not
  display intraday prices`.
- **No single page-level "Data as of" date.** Each card states its own as-of date, because
  Market Pulse's heatmap reads an 08:00 UTC snapshot and Sectors & Countries a 06:00 UTC one, and on
  a late run they can legitimately differ by a session.

> [!NOTE] Two different screeners
> The Markets **Screener** ranks tickers by *indicators* over a rolling date axis
> (`GET /market/indicators/top`). The Screener Workbench inside the
> [Asset Groups](/docs/asset-groups) editor filters *fundamentals* with no date axis
> (`POST /tickers/screener/browse`). They answer different questions.

## Access and the markets entitlement

The entire route sits behind the **`markets`** entitlement lock. This is the only real gate on the
surface.

| Layer | Behaviour when locked |
|---|---|
| Route | The router wraps the page in the locked-overlay component, keyed on `markets` |
| Page | Renders behind a blurred, `inert aria-hidden` layer — no pointer events, no focus, no accessibility tree |
| Requests | The subtree runs against a frozen query client, so **zero requests fire** |
| Panel copy | `Feature locked` / `Buy tokens to unlock this feature.` / button `Buy tokens` → `/account?section=tokens` / note `This is a preview — your real data appears once unlocked.` |
| Sidebar | The entry still navigates; it carries a lock glyph and the tooltip `Locked — buy tokens to unlock` |
| Backend | `gate_market_data` runs on every `/market/*` route except `/market/last_date`, and on both `/news` routes. Failure is HTTP 402 `{ "error": "feature_locked", "feature": "markets", "upgrade": "purchase_tokens" }` |

Locked is not hidden — see [navigation](/docs/navigation) for how locked features behave in the
shell, and [tokens and billing](/docs/tokens-and-billing) for how an organisation unlocks them.

Authentication applies regardless of tier: `/market/*`, `/tickers/*`, `/benchmarks/*` and `/news*`
all require a valid Keycloak JWT. The news routes additionally require the Keycloak permission
`portfolios:read` — the only real permission string anywhere in the Markets data path.

> [!WARNING] `markets:read` is not access control
> The feature manifest declares `permission: 'markets:read'`, and nothing reads it. Routes are
> mounted unconditionally and the sidebar never consults it. Do not treat it as a role.

## Route, tabs and URL state

Markets is a single path with all state in query parameters, so any view is linkable.

| Parameter | Values | Default |
|---|---|---|
| `tab` | `pulse` \| `ticker` \| `groups` \| `screener` | `pulse` — an unknown value also falls back to `pulse` |
| `exch` | an exchange **code** (`US`, `CC`, `FOREX`, …) | `US`; read by Market Pulse only |
| `tickerId` | integer `ticker_id` | none — the Ticker tab navigates itself to the platform default benchmark |
| `compare` | `1` opens the **`Evaluate & compare`** modal | absent |
| `sector` | a sector name; seeds the Screener's sector filter once, then is deleted from the URL | absent |

Tabs are real anchors, so Cmd/Ctrl-click and open-in-new-tab work, and switching tabs preserves
every other parameter.

Other Markets surfaces deep-link into the tabs:

- `?tab=ticker&tickerId={id}` — heatmap tile clicks, volatility-watchlist rows, upcoming-earnings
  rows, group-drilldown ticker lists, and screener result rows and bars.
- `?tab=screener&sector={name}` — the group drilldown's `Open in Screener →` link.

Each tab also publishes a context layer to [Fintelligent](/docs/fintelligent): `markets`,
`markets.pulse`, `markets.ticker`, `markets.groups`, `markets.screener`.

### Retired tab keys

Three tab keys shipped before the consolidation and are now rewritten to their current key on
arrival, with `replace: true`. They are not live tabs.

| Old `?tab=` | Redirects to | Why |
|---|---|---|
| `rotation` | `?tab=groups` | Renamed **Sectors & Countries** |
| `indicators` | `?tab=screener` | The indicator screener absorbed the old ticker screener |
| `metrics` | `?tab=screener&compare=1` | Metrics Comparison became a modal, not a tab |

## Market Pulse

`?tab=pulse`. Scoped by the exchange picker in the heatmap toolbar, which also drives the volatility
rail.

### Indices strip and market breadth

The **indices strip** is a horizontal scroller of up to ten cards, one per index, each showing the
index code, its value, and a signed daily-return chip. It renders nothing when the list is empty.
Its data comes from `MarketOverview.indices`, not from `GET /market/indices`.

The **breadth bar** beside it:

| Element | Exact copy | Meaning |
|---|---|---|
| Progress label | `Market Breadth` | Share of advancing names |
| Caption | `{{up}} up / {{down}} down` | `gainers_count` / `losers_count` |
| Warning | `⚠ Market is top-heavy — index gains may be narrow` | Shown when advancers are under 40% of scored names |
| Chip | `Total Mkt Cap` | `market_stats.total_market_cap` |
| Chip | `Avg Daily Vol` | `market_stats.avg_daily_volume` |

This is the only polling query in the whole view: the overview refetches every 60 seconds. The
snapshot behind it still only changes once a day.

### Treasury Yields

A full-width strip that hides itself entirely while loading, when there is no data, or when the
curve is empty. Title `Treasury Yields`, subtitle `as of {{date}}`.

- A line chart with two series: `1w ago` (dashed, dimmed) and `Current` (solid). Tenor labels are
  derived from the vendor series code, so `UST_3M` renders as `3M`.
- A tile row for the headline tenors `UST_3M`, `UST_2Y`, `UST_10Y`, `UST_30Y`; a tenor absent from
  the curve is skipped. Sub-caption `{{value}} bp vs 1w`.
- An extra tile when the spread exists: label `2s10s Spread`, value `{{value}} bp`, and the
  sub-caption `Curve inverted` when it is negative.

Treasury yields are stored in percent (`4.25` = 4.25%).

### Heatmap toolbar

A full-width control row above the grid. It scopes the whole tab.

| Control | Options | Notes |
|---|---|---|
| Exchange picker | Options from `GET /tickers/exchanges`, rendered `{CODE} — {Name}` | Label `Exchange`, placeholder `Pick an exchange`, no "all" option |
| `Group by` | `No grouping`, `Sector`, `Industry`, `Theme`, `Sub-theme` | A dimension is **disabled** when fewer than 20% of valid rows carry it; the tooltip then reads `Only {{have}} of {{total}} assets carry this data — grouping unavailable.` |
| `Size by` | `Market cap`, `$ volume` | Tile-area basis |
| `Filters` | Opens a 380px popover; the badge counts non-default filters | — |
| `Reset` | Appears only when at least one filter is active | Restores every default below |

### Heatmap filters

Popover heading `Heatmap filters`.

| Field | Type | Default |
|---|---|---|
| `Sector` | Multi-select over `/tickers/facets` sectors | empty |
| `Industry` | Multi-select over `/tickers/facets` industries | empty |
| `Theme` | Multi-select over the theme catalog (`kind = 'theme'`) — label shown, **slug** sent | empty |
| `Sub-theme` | Multi-select over the theme catalog (`kind = 'subtheme'`) | empty |
| `Market cap` | Segmented: `Any`, `Mega`, `Large`, `Mid`, `Small`, `Micro` | `Any` |
| `Min price` | Number | `1` |
| `Min avg volume` | Number | `50000` |
| `Max \|change\| %` | Number, helper `Guards against bad bars` | `50` |
| `Tiles` | Select: `60`, `120`, `200`, `350`, `500` | `120` |

Cap-tier bands, in USD: mega ≥ 200B; large 10B–200B; mid 2B–10B; small 300M–2B; micro ≤ 300M.

The UI defaults deliberately equal the server defaults, so an unparameterised request and a
freshly-opened toolbar describe the same universe.

### Market Heatmap

A treemap, card title `Market Heatmap`. Tile labels are `{code}` over the signed return; tile area
is the chosen size metric.

- **Header actions**: breadcrumb chips (`All` plus one chip per zoom level, the deepest filled and
  deletable), then a continuous colour legend running from `-x.xx%` to `+x.xx%`.
- **Subtitle** appears only while zoomed: `Zoomed in · by {{dimension}}` or `Zoomed in · all members`.
- **Caption** is a `·`-joined list of: `{{shown}} of {{universe}} {{exchange}} assets`,
  `as of {{date}}`, `{{count}} excluded (stale, illiquid or implausible move)`, and
  `{{count}} hidden (no size metric)`.
- **Colour** is a diverging scale whose saturation point is the panel's own 95th-percentile absolute
  return, floored at 3% and capped at 10%.
- **Group bands** are labelled with the group name and its size-weighted return. The catch-all
  bucket is labelled `Unclassified` and is deliberately **not** zoomable.
- **Tooltips**: a leaf shows the code and name, `Return: {{value}}`, `Mkt Cap: {{value}}`, its
  sector, and `Also in: {{value}}` when the ticker carries more than one theme. A zoomable band
  shows `Click to zoom in and split by {{dimension}}` or `Click to zoom in and see every member`; a
  non-zoomable one shows `This group cannot be zoomed into`.
- **Empty state**: `No ticker data` / `Loosen the filters, or pick another exchange.`
  **Error**: `Failed to load market heatmap.`

Clicking a leaf opens that ticker; clicking a band pushes a zoom level.

> [!TIP] The heatmap is not a "top gainers" list
> Rows are selected and sized by market cap or dollar volume and capped by the `Tiles` limit —
> never ordered by return. Selecting by maximum return guaranteed that every data defect won a tile.

### Zooming the heatmap

Zooming **re-queries** the endpoint with the group pushed into the filters. It is not client-side
re-bucketing, and that distinction matters: the row limit applies globally, ordered by size, before
grouping — so re-sectioning on the client would show "the members of Technology that survived the
global top-N" while presenting it as Technology.

The dimension chain is `sector → industry → theme → subtheme`, and sub-theme bottoms out into a flat
view. Theme and sub-theme buckets carry catalog **labels** while the filters take **slugs**; a
bucket whose slug cannot be resolved is inert. Changing the base grouping, the exchange or any
filter clears the zoom path.

### Volatility Watch

Title `Volatility Watch`, subtitle `90-day coefficient of variation, most volatile first`. Bounded
scroll with a sticky header.

| Header | Width | Content |
|---|---|---|
| `Ticker` | 28% | Mono code, links to the Ticker tab |
| `Trend` | 18% | 30-day sparkline; hidden below the `md` breakpoint |
| `Vol` | 27% | 90-day volatility, one decimal, amber |
| `Price` | 27% | Two decimals |

Every column except `Trend` is sortable; the default sort is volatility descending. Empty state
`No volatility data for this exchange.`, error `Failed to load volatility watchlist.`

### Upcoming Earnings

Title `Upcoming Earnings`, with a header control `Window` offering `7d`, `14d`, `30d` (default
`7d`) and a fixed limit of 25 rows.

| Header | Width | Content |
|---|---|---|
| `Date` | 24% | Short date in the active UI language |
| `Ticker` | 46% | Mono code link, a session chip (`BMO` / `AMC`, or the raw vendor string), and the company name |
| `Est.` | 30% | EPS estimate, or `—` |

The default sort is `report_date` ascending — an agenda's natural order — even though the backend
ranks by market cap to decide *which* names appear. Empty state
`No earnings scheduled in the next {{days}} days.`, error `Failed to load the earnings calendar`.

## Ticker

`?tab=ticker&tickerId=N`. With no `tickerId`, the tab navigates itself to the platform default
benchmark from the curated benchmark catalog.

### Identity strip and period returns

- **Exchange picker** (label `Exchange`). It is *local* state, not the shared `?exch` parameter, so
  changing it here does not re-scope Market Pulse. It auto-syncs from the resolved ticker's
  `exchange_code`.
- **Ticker search box**. Options come from `GET /tickers/metadata?search=…`; each option shows the
  code, the exchange and the company name.
- **Company name** with a caption line of `exchange · sector · country`, blank parts dropped.
- **Earnings chip**, shown only when the next scheduled report date is today or later:
  `Earnings · {Mon D}`, plus ` · BMO` or ` · AMC` when the vendor says so.
- **Seven period-return tiles**: `1D`, `1W`, `1M`, `6M`, `YTD`, `1Y`, `5Y`, computed from the full
  ten-year close series. Green for a leading `+`, red for `-`. Anchoring is data-relative, not
  wall-clock: the last trading day at or before `lastDate − N days`; `YTD` anchors on the last
  trading day of the prior year.

> [!NOTE] The search box is labelled `Benchmark`
> The Ticker tab reuses the portfolios feature's benchmark picker, whose field label comes from that
> namespace. It is an instrument search, not a benchmark setting.

### Partial data coverage

A self-hiding info banner. It renders **only** when the ticker has no bars, is delisted, or its last
bar lags the exchange watermark by more than five days. Title `Partial data coverage`; the body is a
row of chips:

| Chip | When |
|---|---|
| `No price history` or `{{count}} bars · {{from}} → {{to}}` | Always, once the banner shows |
| `Delisted` | The ticker is delisted |
| `{{days}} days behind the exchange` | The last bar lags the watermark and the ticker is not delisted |
| `{{available}} of {{total}} data sources available` | Counted over seven flags |

The seven counted flags are `has_fundamentals`, `has_financials`, `has_analyst`, `has_insider`,
`has_sentiment`, `has_corporate_actions`, `has_crypto_fundamentals`. `has_fund` is deliberately
excluded from that count.

The banner is `info`, not `error`, on purpose: a delisted name genuinely stops having prices, and a
small international listing genuinely has no analyst coverage.

### Price chart

Info tooltip `Adjusted close · MA 50 · MA 200`.

| Control | Options | Default |
|---|---|---|
| Mode toggle | `Line` / `Candlesticks` | `Line` |
| Range | `30d`, `90d`, `1Y`, `5Y`, `All` → 30 / 90 / 365 / 1825 / 3650 days | `1Y` |

Line mode draws the close area line plus `MA 50` and `MA 200`. Candle mode draws a candlestick pane
with the same MA overlays plus a volume pane on a linked axis pointer. OHLC is fetched lazily — the
request only fires after the first switch to candles.

Empty state: `No price data available` /
`This ticker has no bars in the selected window. Try a longer range.`

### Fundamentals

Heading `Fundamentals`, in three columns.

| Column | Rows |
|---|---|
| `Valuation` | `Market Cap`, `P/E Ratio`, `Exchange`, `Sector`, `Industry` |
| `52-Week Range` | `Low: {{value}}` / `High: {{value}}` with a progress bar and a `Current: {{value}}` chip, then `Volume` |
| `Risk / Yield` | `Beta` (red above 1.5, green below 0.5), `Dividend Yield` (green when positive), `Today`, `Country`, `Currency` |

Below the columns sits the company description, clamped to three lines. States:
`This data source is temporarily unavailable.` on error,
`No fundamentals available for this ticker.` when there is no detail row.

### Detail panels

One segmented control labelled `Detail`, with a fixed-height body and internal scroll. **Only the
active panel is mounted**, so only its query runs — the two exceptions are the financials and
crypto-fundamentals queries, which the strip itself issues because they also decide whether their
tabs are offered at all.

| Panel | Availability flag | Applies to |
|---|---|---|
| `News` | Never coverage-gated | Everything |
| `Financials & Earnings` | `has_financials` | Not crypto |
| `Analyst Expectations` | `has_analyst` | Not crypto |
| `Insider Activity` | `has_insider` | Not crypto |
| `News Sentiment` | `has_sentiment` | Everything |
| `Corporate Actions` | `has_corporate_actions` | Not crypto |
| `Fund Profile` | `has_fund` | Only fund-like tickers (`etf`, `fund`, `etc`, `etn` in the type), not crypto |
| `Crypto Fundamentals` | `has_crypto_fundamentals` | Only crypto |

A **not-applicable** panel is removed. A **merely empty** panel stays and is disabled with the
tooltip `No data of this kind for this ticker.` While coverage is still loading, everything is
offered. A failed request in any panel renders `This data source is temporarily unavailable.`

Panel contents:

- **News** — window control `Window` with `7 days`, `30 days`, `90 days`, `180 days`, `365 days`,
  `730 days`; default 90. Items show the date, a polarity chip (`Positive` / `Negative` /
  `Neutral`), a chip listing co-mentioned tickers, a linked headline and a snippet. Three distinct
  empty states: `No news for this ticker in the selected window.`,
  `News could not be fetched right now. That is not the same as there being none.`, and a footer
  `The window filled up: there is older news that did not fit. Widen the range to see it.`
- **Financials & Earnings** — subtitle `Latest reported figures`. An `Earnings (EPS)` strip of up to
  eight quarter cards with the fiscal date, actual EPS, `est.` and a surprise chip; then three
  statement columns. `Income Statement`: `Revenue`, `Gross Profit`, `Operating Income`, `Net Income`.
  `Balance Sheet`: `Total Assets`, `Total Liabilities`, `Total Equity`, `Cash`, `Long-term Debt`.
  `Cash Flow`: `Operating CF`, `Free Cash Flow`, `CapEx`, `Dividends Paid`. Empty:
  `No financial data available for this ticker.`
- **Analyst Expectations** — subtitle `Consensus estimates by horizon`, caption
  `Coverage: S&P 500 tracked universe (current and historical constituents).` One column per
  horizon: `Current qtr`, `Next qtr`, `Current yr`, `Next yr`. Each carries the average EPS
  estimate, `{{low}} – {{high}} EPS range`, a revenue estimate under `Revenue est.`, an analyst
  count, and revision chips `↑{{n}} 30d` / `↓{{n}} 30d`. Empty:
  `No analyst coverage for this ticker.`
- **Insider Activity** — subtitle `Form 4 filings`, same tracked-universe caption. Three tiles:
  `Buys (90d)`, `Sells (90d)`, `Net shares (90d)`. Table columns: `Date`, `Insider`, `Code`, `Side`
  (`Buy` / `Sell`), `Shares`, `Price`, `Value`, plus a link with the label `Open SEC filing`.
  Empty: `No insider transactions on record.`
- **News Sentiment** — subtitle `Daily average score · last {{days}} days`, same tracked-universe
  caption. A `Latest score` tile and a combo chart with a `Score` line on a fixed `[-1, 1]` axis and
  an `Articles` bar series. Empty: `No sentiment data for this ticker.`
- **Corporate Actions** — subtitle `Dividends & splits`. A dividend bar chart, a `Recent dividends`
  list with ex-date, amount and `pays {{date}}`, and `Splits` chips. Empty:
  `No dividends or splits on record.`
- **Fund Profile** — four tiles `AUM`, `Expense Ratio`, `Yield`, `Holdings`; a `Sector weights`
  donut; a `Top 10 holdings` table with headers `Code`, `Name`, `Weight`. Empty:
  `No fund data — this ticker is not a fund or ETF.`
- **Crypto Fundamentals** — `Market Cap`, `Diluted Mkt Cap`, `Dominance`, `Circulating Supply`,
  `Total Supply`, `Max Supply`, `All-Time High`, `All-Time Low`. The panel returns nothing at all
  for a non-crypto ticker.

> [!CAUTION] Coverage language is load-bearing
> The product distinguishes *not applicable* (panel removed), *no data* (panel disabled,
> `No data of this kind for this ticker.`), *request failed*
> (`This data source is temporarily unavailable.`) and, for news only, *we did not look*
> (`News could not be fetched right now. That is not the same as there being none.`). They are not
> synonyms.

## Sectors & Countries

`?tab=groups`. The exchange is hardcoded to `US` — there is no exchange control, only a `US` chip
whose tooltip reads
`US listings only. The representative ETFs (XLK, EWJ, …) are US-listed instruments.`

Two client-side filters run before render, and both are reported rather than hidden: labels in
`''`, `other`, `unknown`, `n/a`, `na` are dropped, and under the ETF lens rows with no `proxy_code`
are dropped too. The count lands in the card caption.

### KPI bar

Five tiles, shown once the data has loaded and is non-empty.

| Label | Value |
|---|---|
| `Groups` | Row count after filtering |
| `Adv / Dec` | Advancers / decliners by the 1-day return; green unless decliners outnumber advancers |
| `Avg Today` | Mean 1-day return over rows that have one |
| `Leader` | Best group name, with its return underneath |
| `Laggard` | Worst group name, with its return underneath |

### Performance matrix

Card title `Sector & country performance`, subtitle `Returns across horizons, US listings`.
Header controls: `View` (`Sectors` / `Countries`), `Weighting` (sectors only), and `Emphasis`
(`None`, `Row best/worst`, `Column leader`).

All columns are sortable; the default sort is the 1-day return, descending.

| Header | Field |
|---|---|
| `Sector` or `Country` | The group label, plus a mono chip carrying `proxy_code` under the ETF lens |
| the as-of **date** (falls back to `Today`) | `return_today` |
| `1W` | `return_1w` |
| `1M` | `return_1m` |
| `6M` | `return_6m` |
| `YTD` | `return_ytd` |
| `1Y` | `return_1y` |
| `5Y` | `return_5y` |
| `10Y` | `return_10y` |
| `Best horizon` | Derived — the row's winning horizon and its value |
| `# Tickers` | `ticker_count` |

The 1-day header shows the **date it reflects**, not the word "Today", because the snapshot is built
at 06:00 UTC from the previous completed session.

Cell colour uses one diverging scale with a **per-column** saturation point: the greater of that
column's 95th-percentile magnitude and a per-horizon floor. The floors, in percent, are `today 2`,
`1w 4`, `1m 8`, `6m 20`, `ytd 20`, `1y 25`, `5y 60`, `10y 100`. A `null` return renders `—`, never a
fabricated `0.0%`.

The card caption joins `The 1-day column reflects the session of {{date}}`, the daily-refresh
sentence, and `{{count}} groups hidden (unclassified, or no representative ETF)`. When the
snapshot's `updated_at` date precedes the exchange watermark, a warning chip appears below the
table: `Snapshot is behind the latest session`.

Empty states are `No sector data available` and `No country data available`; the error is
`Failed to load sector/country performance data.`

### Weighting lenses

| Lens | Tooltip | Available in |
|---|---|---|
| `Equal` | `Simple average of member returns — every ticker counts equally (measures breadth).` | Sectors |
| `Market cap` | `Members weighted by market capitalization — a synthetic, cap-weighted index of the group.` | Sectors (the tab's default) |
| `ETF` | `The return of a representative, tradable ETF proxy for the group.` | Sectors and Countries |

In Countries mode the control is replaced by a static `ETF` chip whose tooltip reads
`The country's representative US-listed ETF (EWJ, EWZ, …) — the default lens for countries.`
Countries have exactly one lens. Equal and market-cap weighting would technically return rows, but
with the universe scoped to US listings they group US-listed *companies* by domicile, which answers
a different question.

The ETF proxies are a curated table: **11 SPDR sector ETFs** (`XLK` Technology, `XLV` Healthcare,
`XLF` Financial Services, `XLY` Consumer Cyclical, `XLP` Consumer Defensive, `XLE` Energy,
`XLI` Industrials, `XLB` Basic Materials, `XLU` Utilities, `XLRE` Real Estate,
`XLC` Communication Services) and **33 US-listed single-country ETFs** (`EWJ` Japan, `EWY` South
Korea, `EWZ` Brazil, `EWA` Australia, `EWC` Canada, `EWD` Sweden, `EWG` Germany, `EWH` Hong Kong,
`EWI` Italy, `EWL` Switzerland, `EWM` Malaysia, `EWN` Netherlands, `EWO` Austria, `EWP` Spain,
`EWQ` France, `EWS` Singapore, `EWT` Taiwan, `EWU` United Kingdom, `EWW` Mexico, `EZA` South Africa,
`ECH` Chile, `EPU` Peru, `ENOR` Norway, `EDEN` Denmark, `EPOL` Poland, `TUR` Turkey, `THD` Thailand,
`IDX` Indonesia, `INDA` India, `MCHI` China, `ARGT` Argentina, `GREK` Greece, `ERUS` Russia).

### Drill-down drawer

A right-anchored drawer opened by clicking a row; clicking the same row closes it, and it
auto-closes when the mode or weighting changes.

- Header: the group name, plus chips for the weighting, the `proxy_code`, and `{{count}} tickers`.
- A grid restating the row's eight horizon returns as coloured tiles.
- In Countries mode only, the note
  `Country returns are measured through {{code}}; constituents below are US-listed names domiciled there, shown for reference.`
- Two lists, `Top gainers` and `Top losers`, five rows each, fetched from `GET /market/tickers` with
  `sort=gain` / `sort=loss`, `limit=5`, `exchange=US`, and either `sector=` or `country=`. Empty:
  `No constituents available.`
- Footer link `Open in Screener →`, which always passes `sector=`, in both modes.

## Screener

`?tab=screener`. This tab is the consolidation of the old Screener, Indicators and Metrics
Comparison tabs. The section header is an overline reading `Screener`.

Before any indicator is chosen, the tab shows
`Select an indicator above to start exploring top performers` /
`Choose an indicator, window size, and z-score mode from the filter bar`.

On a first load with no state, the tab pre-selects the `alpha` indicator and scopes to **current
S&P 500 members**. A `?sector=` deep link wins over that default. If the indicator list cannot load,
the bar reads `The indicator list could not be loaded. Try reloading the page.`; if it loads empty,
`Indicators are not available yet. Try again later.`

### Filter bar

| Control | Label | Options | Default |
|---|---|---|---|
| Indicator | `Indicator` | Distinct indicator names from `GET /market/indicators/metadata`, excluding any the backend flags as not ticker-applicable | `alpha` when present, else the first name |
| Window | `Window Size` | The window sizes stored for that indicator. Labels: `0` → `Full`, `11` → `2 weeks`, `22` → `4 weeks`, `33` → `6 weeks`, anything else the raw number | First available |
| Z-score | `Z-Score` | A toggle plus a select of stored z-windows excluding `-1`. Labels: `0` → `Z-Score (vs peers)`, `11`/`22`/`33` → `Z-Score (N weeks)`, else `Z-Score (W=n)`. Toggling off sends `z_score_window = -1`, the raw values | On, first non-`-1` window |
| Direction | — | `Top Performers` (`sort=desc`) / `Bottom Performers` (`sort=asc`) | `Top Performers` |
| Show top | `Show top` | `10`, `20`, `50`, `100`, `250` filtered to those strictly below the live match count, plus the match count itself rendered `All ({{count}})`. With zero matches, only `10` is offered | `20` |
| Date | `Date` | A date input whose `max` is the latest date with rows for these filters and whose `min` is the earliest. Helper `Latest available`, tooltip `Latest available: {{date}}` | Unset — the backend resolves the filter-aware latest date |
| Filters | `Filters` | Opens the Asset Filters popover; the badge counts active filters | — |

The z-score tooltip states the distinction verbatim:

```text
Z-Score (vs peers): cross-sectional — how many standard deviations each ticker sits
from the average of all tickers in the current filter, on the selected date.
Z-Score (N weeks): per-ticker — standardized over that ticker's own last N weeks.
```

Metrics the backend flags as not applicable to a plain price ticker never appear in the indicator
list: `omega_ratio`, `profit_factor`, `win_rate`, `payoff_ratio`, `trade_win_rate`,
`trade_profit_factor`, `avg_trade_duration`, `expectancy`.

> [!NOTE] Why the date picker has a floor
> Indicator history is pruned to a rolling window of roughly 60 trading days per entity. The earliest
> selectable date therefore moves forward every day and sits about three calendar months behind the
> latest one. "Pick an earlier date" is the one thing that cannot help an empty result.

### Quick universes

A `Quick:` row of chips, each mapping to a real backend parameter.

| Chip | Tooltip | Sends |
|---|---|---|
| `S&P 500` | `Current members of the S&P 500, from the latest constituent snapshot.` | `index_id` for the S&P 500 (matched by code `GSPC` / `^GSPC`, never by id) plus `index_mode=current` |
| `Country ETFs` | `The 33 US-listed country ETFs Fintela uses as regional proxies (EWJ, EWG, …).` | `proxy_group=country` |
| `Sector ETFs` | `The 11 US-listed SPDR sector ETFs Fintela uses as sector proxies (XLK, XLE, …).` | `proxy_group=sector` |
| `Operating companies` | `Excludes ETFs, mutual / closed-end / money-market funds, ETCs and ETNs. Preferred stock, units and warrants are still included.` | `operating_companies_only=true` |
| `Liquid only` | `Price ≥ 5 (listing currency) and 3-month average volume ≥ 500,000 shares/day.` | `min_price=5` and `min_avg_volume=500000` |

Two multi-select autocompletes sit alongside them, `Theme` and `Sub-theme`. Both show catalog labels
and send comma-separated **slugs**. A bucket label fed back as a filter value matches nothing.

### Asset Filters

Popover heading `Asset Filters`.

| Field | Behaviour |
|---|---|
| `Index membership` | The shared membership picker: `Evaluated at` → `Current`, `Ever`, `Period`, `On a date`; strictness `At any point` / `The whole period`; `From` / `To` / `On`; coverage caption `History covers {{from}} → {{to}}`; `No membership history is recorded for this index.` |
| `Exchange` | Autocomplete rendered `{CODE} — {Name}`. Selecting `CC` clears sector, country and type |
| `Sector`, `Country`, `Type` | Autocompletes from `GET /tickers/facets`; hidden when the exchange is `CC` |
| `Market Cap` | A `Min` / `Max` numeric pair |

Footer buttons are `Reset` — which resets only what the popover shows, leaving the quick chips
untouched — and `Apply`.

Applied filters appear as deletable chips: `Exchange: {{code}}`, `Sector: {{sector}}`,
`Country: {{country}}`, `Type: {{type}}`, `Market Cap: {{min}} → {{max}}`, plus the index-membership
summary (`Current member of {{index}}`, `Ever a member of {{index}}`,
`Member of {{index}} on {{date}}`, `Member of {{index}} at any point {{from}} → {{to}}`,
`Member of {{index}} throughout {{from}} → {{to}}`).

> [!WARNING] Crypto fundamental screening does not exist
> The filter component still carries state and chip templates for 14 crypto-fundamental fields
> (diluted market cap, dominance, circulating/total/max supply, ATH and ATL). The inputs were
> removed and the backend query struct rejects those parameters outright with a 400. Do not expect
> to screen on them.

### Summary tiles

Five tiles above the results.

| Label | Value | Sub-caption |
|---|---|---|
| `Ranked Tickers` | Number of returned rows | The configuration label |
| `Top Performer` | Code and value | `Rank #{{rank}}` |
| `Bottom of Range` | Code and value | `Rank #{{rank}}` |
| `Average` | Mean value | `Spread: {{value}}`, with a `Min` / `Median` / `Max` ruler strip underneath |
| `Data Date` | The rows' date | `Latest available` |

The configuration label is built in code and is **hardcoded English** — it does not translate. It
reads `{indicator} · {z-score label} · the last {window label}`, for example
`alpha · z-score (4 weeks) · the last 4 weeks`, and in its sorted form
`Top 20 Performers in alpha z-score (4 weeks) in the last 4 weeks`.

### Top Performers results

Card title `Top Performers`. When there are more than nine rows, the subtitle reads
`Scroll within the chart to see all {{total}} results`. Header actions: a `View` toggle
(`Chart` / `Table`, default `Chart`), an `Evaluate & compare` button, and a `Create Asset Group`
button. Both buttons are disabled with no rows.

Chart view is a horizontal bar chart with nine bars visible and an inside data-zoom for the rest,
green and red by sign. Clicking a bar opens that ticker.

Table view columns, all sortable, default `#` ascending:

| Header | Field | Format |
|---|---|---|
| `#` | `rank` | Centred |
| `Ticker` | `code` | Mono link to the Ticker tab |
| `Sector` | `sector` | `—` when null |
| `Value` | `value` | A bare number in the indicator's own units |
| `Price` | `price` | Two decimals |
| `Day %` | `change_pct` | Signed percent, green or red |
| `Market cap` | `market_cap` | Abbreviated currency |
| `Volume` | `volume` | Integer, `—` when null |

Empty: `No tickers match these filters` / `Loosen a filter, or pick an earlier date.`
Error: `Failed to load indicator data.`

### Metrics comparison rail

A narrow rail beside the results. Title `Metrics comparison`, subtitle `Top results · 1Y`, header
button `Expand`. It shows the top six result tickers as rows with the window fixed to the trailing
one-year metrics, and the columns `Ticker`, `Ret.`, `CAGR`, `DD`, `Sharpe`. Percent metrics get the
diverging fill; Sharpe is plain. Empty: `Run a screen to compare its top results.`
Error: `Failed to load comparison metrics.`

### Evaluate & compare

A dialog titled `Evaluate & compare`. It is also where the retired `?tab=metrics` deep link lands,
arriving as `?tab=screener&compare=1`.

- A picker block labelled `Compare tickers`: chips for the selected tickers plus an autocomplete
  with the placeholder `Add ticker…`. The cap is **8 tickers**, and the picker hides once it is
  reached. Hint when empty: `Search and add up to 8 tickers to compare`.
- Launched from the screener it opens already comparing the screener's rows, sliced to eight;
  opened standalone it seeds `AAPL`, `MSFT`, `GOOGL`, `AMZN`, `NVDA`, `META`, `TSLA`.
- Empty state: `Add tickers above to start comparing metrics` /
  `Metrics are pre-computed across MTD · QTD · YTD · 1M · 3M · 6M · 1Y · 3Y · 5Y windows`.
- A `View` toggle: `By Window` puts metrics down the rows and tickers across the columns, with a
  `Window` selector (`MTD`, `QTD`, `YTD`, `1M`, `3M`, `6M`, `1Y`, `3Y`, `5Y`; default `1Y`).
  `By Metric` puts tickers down the rows and the nine windows across the columns, with a `Metric`
  selector and an extra `Trend` column carrying a sparkline.

The eight metrics, in row order:

| Label | Stored metric | Direction | Unit |
|---|---|---|---|
| `Total Return` | `total_return` | `higher is better` | Percent |
| `CAGR` | `compound_annual_growth_rate` | `higher is better` | Percent |
| `Sharpe` | `sharpe_ratio` | `higher is better` | Ratio |
| `Sortino` | `sortino_ratio` | `higher is better` | Ratio |
| `Volatility` | `volatility` | `lower is better` | Percent |
| `Max Drawdown` | `max_drawdown` | `lower is better` | Percent |
| `Alpha` | `alpha` | `higher is better` | Percent |
| `Beta` | `beta` | `— Informational` | Ratio, never heat-coloured |

The heat legend reads `Best in row`, `Middle`, `Worst in row`, and the footer note is
`Values as of last market close · updated daily`. Definitions for each metric live in the
[metrics reference](/docs/metrics-reference).

### Create Asset Group

Dialog title `Create Asset Group from Ranking`.

| Element | Detail |
|---|---|
| Summary box | Overline `Ranking configuration`, the English configuration label, and `{{count}} tickers will be included` |
| `Cluster name` | Required, autofocused, pre-filled with the configuration label plus ` · {date}` when a date is pinned |
| `Description (optional)` | Two-row multiline, pre-filled with a generated English sentence such as `Top 20 performers of alpha z-score (4 weeks) in the last 4 weeks, as of 2026-08-15. Filters: exchange: US, sector: Technology.` |
| Actions | `Cancel`, and `Create Cluster` (`Creating…` while pending) |

Submitting posts `{ name, description, tickers_id: [...] }` and creates a normal
[asset group](/docs/asset-groups) you can use in a study.

> [!NOTE] Three names for one object
> This dialog calls the same thing "Asset Group" (title and button), "Cluster name" (field) and
> "Create Cluster" (submit). They all mean an Asset Group.

## Asset classes and coverage

The ticker universe is built by a weekly reference worker, and only these exchanges are admitted:

| Exchange code | Admitted | Ticker types kept |
|---|---|---|
| `US` | Wholesale | `Common Stock`, `ETF`, `INDEX`, `Preferred Stock`, and a NULL type |
| `CC` | Wholesale | Every type (crypto) |
| `FOREX` | Wholesale | Every type |
| `INDX` | One symbol at a time | Only symbols named in the curated benchmark catalog |

`INDX` is never opened wholesale: admitting it the way `US`, `CC` and `FOREX` are admitted would
re-import thousands of world indices. Which exchanges *may* be opened that way is compiled in, not
data-driven.

Coverage inside that universe is not uniform:

| Data | Universe |
|---|---|
| Daily bars, quotes, the heatmap, indicators, group performance | The full admitted universe for the selected exchange |
| Analyst expectations, insider activity, news **sentiment**, historical market cap | The **S&P 500 tracked universe** — current and historical constituents. Panels outside it are disabled with `No data of this kind for this ticker.` |
| News **headlines** | Fetched per symbol from the provider, so they are available beyond the tracked universe. This is why the News panel is never coverage-gated |
| Theme and sub-theme grouping | Whatever the weekly classifier has assigned; a grouping dimension is disabled below 20% coverage |

Sectors & Countries covers whatever resolves under the chosen lens: sector and country labels that
carry no analytical meaning are dropped, and under the ETF lens a group with no resolvable proxy is
reported as hidden rather than rendered as a row of dashes.

## Freshness and as-of dates

Everything is produced by scheduled workers. All times are UTC.

| Time | Worker | Feeds |
|---|---|---|
| 00:00 Sun | `crypto-fundamentals-updater` | Crypto Fundamentals panel |
| 01:00 Sun | `ticker-exchange` | The ticker and exchange reference universe |
| 04:00 | `eodhd-collector-orchestrator` | Serialises the vendor collectors: reference data (including the Treasury curve), corporate actions, forward calendar, news sentiment, market-cap history, insider filings, fund fundamentals |
| 04:00 Sun | `theme-classifier` | Theme and sub-theme grouping and filters |
| 05:00 | `single-day-updater` | Daily bars for the previous session — and it **advances the exchange watermark** |
| 05:00 | `fundamentals-enrichment-updater` | Short float, ownership, analyst ratings |
| 05:10 | `bulk-fundamentals-updater` | Fundamentals snapshots, the four statement tables, reported earnings |
| 05:20 | `index-components-updater` | Index constituents — this is what the `S&P 500` chip filters on |
| 06:00 | `markets-snapshot-updater` | Breadth and overview stats, **Sectors & Countries**, the volatility leaderboard |
| 07:00 | `indicators-updater` | The Screener's indicator values and metadata |
| 08:00 | `screener-snapshot-updater` | The **heatmap** and the screener's market-context columns |
| 11:00 | `supported-indices-with-details-updater` | Index details |
| 13:00 | `metrics-updater` | The metrics-comparison windows |
| 23:00 | `all-time-updater` | History and backfill |
| Monthly | `logos-updater` | Ticker logos |

What that means when you read a date on screen:

```text
05:00  single-day-updater      → exchange watermark advances
06:00  markets-snapshot        → Sectors & Countries "as of"
08:00  screener-snapshot       → Market Heatmap "as of"
13:00  metrics-updater         → Evaluate & compare values
```

- Sectors & Countries and the heatmap read **different snapshots**. On a late or failed run they can
  legitimately differ by one session, which is exactly what the
  `Snapshot is behind the latest session` chip reports.
- Metrics comparison refreshes hours after the price data.
- The authoritative "last complete data day" is the per-exchange watermark, advanced only when that
  exchange actually received rows — so it does not creep forward over weekends and holidays.

Unit conventions, because getting one wrong is a silent 100× error:

| Value | Unit on the wire |
|---|---|
| `change_pct`, `daily_return_pct`, `return_1w` … `return_10y` | Percent |
| Stored metric values (`total_return`, `volatility`, `alpha`, …) | Fraction |
| `sharpe_ratio`, `sortino_ratio`, `beta` | Unitless ratios, never scaled |
| Treasury yields | Percent |
| Fund expense ratio | Fraction (`0.0009` = 0.09%) |
| Fund yield | Percent (`1.26` = 1.26%) |

Returns are computed on the adjusted close series, so a split does not print as a return. The 1-day
anchor must be an adjacent trading day; a longer gap yields `null` rather than a multi-year move
labelled as a daily return. 90-day volatility is the coefficient of variation of adjusted closes.

## Backend endpoints

Every Markets endpoint is a `GET`, and every response is wrapped as `{ "data": … }`. All of them
require a JWT; in the `/market/*` family, all except `/market/last_date` additionally require the
`markets` entitlement — the supporting endpoints below are authenticated only. See
[API authentication](/docs/api-authentication) and the [API overview](/docs/api-overview).

### Market data endpoints

```http
GET /market/overview?exchange=US
GET /market/heatmap?exchange=US&group_by=sector&size_by=market_cap&limit=120
GET /market/tickers?sort=gain&limit=5&exchange=US&sector=Technology
GET /market/tickers/{ticker_id}
GET /market/tickers/{ticker_id}/coverage
GET /market/tickers/{ticker_id}/timeseries?metric=close&days=365
GET /market/tickers/{ticker_id}/ohlc?days=365
GET /market/tickers/{ticker_id}/financials
GET /market/tickers/{ticker_id}/analyst
GET /market/tickers/{ticker_id}/insider?limit=50
GET /market/tickers/{ticker_id}/sentiment?days=90
GET /market/tickers/{ticker_id}/corporate-actions?limit=100
GET /market/tickers/{ticker_id}/fund-fundamentals
GET /market/tickers/{ticker_id}/crypto-fundamentals
GET /market/tickers/sparklines?ticker_ids=1,2,3&days=30
GET /market/tickers/metrics?ticker_ids=1,2,3
GET /market/tickers/top/volatile?exchange=US&limit=20
GET /market/sectors?exchange=US&weighting=mcap
GET /market/countries?exchange=US&weighting=etf
GET /market/rates/summary
GET /market/calendar/earnings?days=7&limit=15
GET /market/indicators/metadata
GET /market/indicators/top
GET /market/indicators/top/summary
GET /market/last_date?exchange=US
```

| Endpoint | Parameters, defaults and clamps |
|---|---|
| `/market/overview` | `exchange` — an exchange code. Absent means the cross-exchange rollup row |
| `/market/heatmap` | See the parameter table below |
| `/market/tickers` | `sort` = `volume` (default) \| `volatility` \| `gain` \| `loss`; `limit` default 20, clamped 1–200; `exchange`, `sector`, `country`, `ticker_type` |
| `/market/tickers/{id}` | None. 404 when the ticker does not exist |
| `/market/tickers/{id}/coverage` | None. Returns the availability flags the Ticker tab reads |
| `/market/tickers/{id}/timeseries` | `metric` = `close` (default) \| `volume` \| `return` \| `ma50` \| `ma200`; `days` default 30. An empty result is not an error |
| `/market/tickers/{id}/ohlc` | `days` default 365, clamped 1–7300 |
| `/market/tickers/{id}/insider` | `limit` default 50, clamped 1–200 |
| `/market/tickers/{id}/sentiment` | `days` default 90, clamped 1–730 |
| `/market/tickers/{id}/corporate-actions` | `limit` default 100, clamped 1–500 — dividends only |
| `/market/tickers/sparklines` | `ticker_ids` **required**, comma-separated, max **250**; `days` default 30, clamped 2–365 |
| `/market/tickers/metrics` | `ticker_ids` **required**, comma-separated, max **500** |
| `/market/tickers/top/volatile` | `exchange`; `limit` default 20, clamped 1–200 |
| `/market/sectors`, `/market/countries` | `exchange`; `weighting` = `equal` \| `mcap` \| `etf` |
| `/market/calendar/earnings` | `days` default 7, clamped 1–30; `limit` default 15, clamped 1–50 |
| `/market/indicators/top` | See the ranking parameters below; `limit` default 20, clamped 1–500 |
| `/market/indicators/top/summary` | The same query struct; returns `match_count`, `resolved_date`, `max_date`, `min_date` |
| `/market/last_date` | `exchange` — the authoritative per-exchange watermark |

> [!CAUTION] `weighting` defaults differ between client and server
> Omitting `weighting` on `/market/sectors` or `/market/countries` resolves to `equal` server-side
> for backwards compatibility, while the SPA's hook resolves it to `mcap` before it builds the
> request. If you call the API directly, pass `weighting` explicitly.

> [!WARNING] `/market/last_date` without `exchange` overstates equity freshness
> The parameterless form is the legacy global maximum across all instruments with EOD data. Crypto
> and forex trade seven days a week, so that maximum is driven by them. Only the `?exchange=` form
> is authoritative for an equity surface.

### Heatmap parameters

| Parameter | Type | Default | Clamp and notes |
|---|---|---|---|
| `exchange` | Exchange code | `US` | No cross-exchange view exists |
| `group_by` | `none` \| `sector` \| `industry` \| `theme` \| `subtheme` | `none` | Any unknown value falls back to `none`. Theme and sub-theme resolve **one primary bucket** per ticker |
| `size_by` | `market_cap` \| `dollar_volume` | `market_cap` | Dollar volume is price × average volume |
| `limit` | integer | `120` | Clamped 20–500; ordered by size, never by return |
| `max_staleness_days` | integer | `5` | Clamped 0–30 |
| `min_price` | number | `1.0` | Floored at 0 |
| `min_avg_volume` | number | `50000.0` | Floored at 0 |
| `max_abs_change_pct` | number, **percent** | `50.0` | Clamped 1–1000 |
| `market_cap_min`, `market_cap_max` | number | none | — |
| `sector`, `industry` | Multi-select | none | Accepts a JSON array or legacy CSV; exact match. Use the JSON form — vendor industry names contain commas |
| `theme`, `subtheme` | Multi-select of **slugs** | none | Array overlap against the snapshot's slug arrays |

Six validity layers apply, and none of them is a whitelist: not delisted; fresh against the exchange
watermark; above the price floor; above the average-volume floor; absolute change within
`max_abs_change_pct`; and a positive size value.

The response envelope carries `rows`, `exchange`, `as_of_date`, `exchange_watermark`,
`universe_count`, `valid_count`, `returned_count`, `excluded_stale`, `excluded_no_size`,
`excluded_illiquid`, `excluded_outlier` and `group_availability`. Those counts are what the card
caption and the disabled grouping options are built from — nothing is dropped silently.

### Indicator ranking parameters

`GET /market/indicators/top` and its `/summary` sibling share one query struct, and that struct
**rejects unknown fields with a 400**. That is deliberate: it used to swallow parameters the UI was
sending, so the popover offered filters that had no effect.

| Parameter | Required | Notes |
|---|---|---|
| `indicator_name` | Yes | From `/market/indicators/metadata` |
| `window_size` | Yes | `0` means the full series |
| `z_score_window` | Yes | `-1` raw, `N > 0` rolling, `0` cross-sectional |
| `limit`, `sort` | No | `sort` = `desc` (default) \| `asc`; `limit` default 20, clamped 1–500 |
| `date` | No | `YYYY-MM-DD`. Absent means the filter-aware latest date |
| `index_id`, `index_mode`, `index_start_date`, `index_end_date`, `index_as_of_date` | No | Index-membership predicate |
| `exchange`, `sector`, `country`, `ticker_type` | No | Equality predicates |
| `market_cap_min`, `market_cap_max` | No | Filters the bar's market cap on the indicator's own date |
| `theme`, `subtheme` | No | Comma-separated **slugs** |
| `proxy_group` | No | `sector` \| `country` — restricts to the curated ETF proxy list |
| `min_price`, `min_avg_volume` | No | Both read the screener snapshot |
| `operating_companies_only` | No | Excludes ETFs, funds, money-market and closed-end funds, ETCs and ETNs; keeps a NULL type |

`z_score_window` is three-valued:

| Value | Stored? | Meaning |
|---|---|---|
| `-1` | Yes | The raw, unstandardized indicator value |
| `N > 0` | Yes | A rolling z-score precomputed over `N` periods |
| `0` | **Never stored** | A read-time mode: each ticker is standardized against its peers in the filtered universe on that date, computed from the `-1` rows |

`index_mode` accepts `current` (the default, meaning members on the latest constituent snapshot date
rather than today), `ever`, `interval_any`, `interval_all` and `as_of`. `range` is a deprecated alias
for `interval_any`. An unrecognised value is a 400, never a silent fallback. Intervals are half-open.

### Supporting endpoints

These are authenticated but **not** tier-gated, because the Asset Group screener and the study
wizard's benchmark pre-selection sit on a free user's activation path.

| Endpoint | Purpose here |
|---|---|
| `GET /tickers/exchanges` | Every exchange picker |
| `GET /tickers/facets` | The `Sector`, `Country`, `Type` and `Industry` option spaces |
| `GET /tickers/screener/themes` | The theme and sub-theme catalog — slug, label, kind, parent |
| `GET /tickers/metadata` | The ticker search box and the compare picker |
| `GET /tickers/indices` | The index list for the membership picker |
| `GET /benchmarks/catalog` | The instrument the Ticker tab lands on |

The news panel is gated like the rest of Markets, and additionally requires `portfolios:read`:

```http
GET /news/ticker/{ticker_id}?days=90
```

## Limits

- **No intraday data.** Nothing on this page updates within a session. The one polling query
  refreshes a snapshot that itself changes once a day.
- **No cross-exchange view.** Markets shows one exchange at a time, everywhere.
- **No crypto fundamental screening.** The parameters are rejected by the backend.
- **Sectors & Countries is US-only**, and countries have exactly one lens (ETF).
- **The Markets Screener does not filter fundamentals.** That is the Screener Workbench in the
  [Asset Groups](/docs/asset-groups) editor.
- **Indicators are ticker-only.** Portfolio-scoped indicator rows are retired.
- **Some strings do not translate.** The screener's configuration label, the Create Asset Group
  defaults and the generated description are built in code as English, in every locale.
- **The Markets view creates exactly one thing**: an Asset Group, from the Screener's ranking.
  For everything downstream — studies, optimization, portfolios — start from the
  [end-to-end workflow](/docs/end-to-end-workflow).
