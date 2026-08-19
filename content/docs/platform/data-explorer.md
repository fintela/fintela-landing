---
title: Data Explorer
section: Platform Overview
sectionOrder: 2
order: 4
published: true
updated: 2026-08-18
summary: Browse what every built-in data source contains before you wire it into a strategy.
keywords: data explorer, data sources, series, fields, coverage, inspect, data pipelines
---

The Data Explorer is Fintela's Data Library: one read-only browse surface over every dataset that
feeds the platform. Pick a dataset and you get its live row-count estimate, its coverage window, its
freshness, and — for ticker-scoped datasets — per-ticker coverage, a time-distribution chart, a
charted feature series and the raw stored records. Nothing here is editable and nothing here runs a
backtest; it exists so you know what a data source actually contains before you inject it into a
[strategy](/docs/strategies), a [fitness function](/docs/fitness-functions) or a
[risk manager](/docs/risk-managers).

## Where the Data Explorer lives

| Item | Value |
|---|---|
| Route | `/analysis/data-explorer` |
| Feature key | `data-explorer` |
| Nav label | `Data Explorer` |
| Sidebar placement | the **More Options** flyout, not the visible Analysis section |
| Page eyebrow / title | `Analysis` / `Data Explorer` |
| Page subtitle | `Browse every dataset powering the platform — live coverage, freshness and raw records.` |

The entry is registered both in the Analysis feature set (so the route resolves) and in the "More
Options" set (so the sidebar renders it inside the flyout). See [navigation](/docs/navigation) for
how that flyout works.

## Access and the data_explorer lock

Two independent gates apply.

| Gate | Mechanism | Failure |
|---|---|---|
| Role | permission `data_cluster:read`, checked as the first statement of every backend handler (`root:all` bypasses) | HTTP 403 `Missing permission 'data_cluster:read'` |
| Entitlement | lock key `data_explorer`, one router-level middleware layer over the whole `/data-explorer/*` router | HTTP 402 with `"error": "feature_locked"` |

`data_explorer` ships in the default `locked_features` array, so the feature is locked out of the
box for non-activated organizations. Locked does **not** mean hidden: the nav entry stays in the
flyout and stays clickable, carrying a lock glyph with the tooltip `Locked — buy tokens to unlock`.
Opening the page renders the real layout behind a blur, `inert` and `aria-hidden`, inside a frozen
query client so no request fires, with a centred panel:

| Element | Text |
|---|---|
| Title | `Feature locked` |
| Body | `Buy tokens to unlock this feature.` |
| CTA | `Buy tokens` → `/account?section=tokens` |
| Caption | `This is a preview — your real data appears once unlocked.` |

The 402 body is:

```json
{
  "message": "This feature is available on paid accounts. Buy tokens to unlock it.",
  "error": "feature_locked",
  "feature": "data_explorer",
  "upgrade": "purchase_tokens"
}
```

> [!NOTE] Locked is not the same as metered
> Browsing the Data Explorer deducts no tokens — none of its handlers touch the token ledger. The
> only barrier is the `data_explorer` entitlement. See
> [tokens and billing](/docs/tokens-and-billing).

One adjacent lock matters: the Technical Indicators indicator picker reads
`GET /market/indicators/metadata`, which sits behind the separate `markets` lock. With
`data_explorer` unlocked but `markets` still locked that request returns 402 and the indicator
selector renders with an empty option list.

## The Data Library sidebar

A 260px `nav` column, overline heading **`Data Library`**, sticky from the `md` breakpoint with its
own scroll. Datasets are bucketed into seven groups in a fixed order; empty groups are dropped.
Each row shows the group glyph, the dataset label, and a monospace freshness caption.

Freshness is computed from the dataset's `last_date`:

| Age | Rendered as |
|---|---|
| 0 days | `today` |
| 1–45 days | `3d ago` (`{{count}}d ago`) |
| over 45 days | the raw ISO date |
| unparsable / null | `—` |

Datasets whose coverage is limited carry a small coloured dot with the tooltip
`Coverage is limited to the S&P 500 tracked universe (current and historical constituents). Tickers outside it won't appear here.`

## Landing overview

With no dataset selected the content pane shows the Data Library landing:

- Intro: `Every dataset powering the platform, in one place. Pick a dataset to inspect its per-ticker coverage, time distribution and raw records — live row counts and freshness below.`
- Empty catalog: `The dataset catalog is empty.`
- One card per group, subtitled `{{count}} dataset` / `{{count}} datasets`, holding a grid of
  clickable dataset tiles (1 column on `xs`, 2 on `sm`, 3 on `xl`).

Each tile shows the group glyph, the label, an `S&P 500 universe` chip when the dataset is scoped,
the description clamped to two lines, and three stats:

| Micro-label | Value |
|---|---|
| `Rows` | `≈` plus a compact magnitude of the row estimate, e.g. `≈1.2M` |
| `Window` | `first_date → last_date`, or `—` |
| `Updated` | the freshness label |

Compact magnitudes use `T` at ≥1e12, `B` at ≥1e9, `M` at ≥1e6, `K` at ≥1e3, one decimal each;
smaller values print in full.

Once a dataset is selected, a header band replaces the tile above the panel: the label as an `h2`,
the scope chip, the description, and four KPI tiles from the summary endpoint — `Rows (est.)`,
`First date`, `Last date`, `Freshness` (with the raw `last_date` as its sub-label).

> [!NOTE] Row counts are estimates
> They come from `pg_class.reltuples`, summed across partitions for partitioned tables. For
> recently backfilled tables the service falls back to a bounded exact count that saturates at
> **1 000 001** until the database is analysed. That is why the label says `Rows (est.)` and the
> tiles prefix `≈`.

## Dataset catalog

The catalog is server-owned. The frontend hard-codes no dataset list — labels, descriptions,
grouping, panel choice, feature lists, cluster-filterability, chart mark and scope notes all arrive
from `GET /data-explorer/catalog`. Only the group ordering, icons and colours are client-side.

### The seven groups

| Group id | Sidebar label |
|---|---|
| `market_data` | `Market data` |
| `fundamentals` | `Fundamentals` |
| `corporate_actions` | `Corporate actions` |
| `events_calendar` | `Events calendar` |
| `alternative` | `Alternative data` |
| `macro_rates` | `Macro & rates` |
| `reference` | `Reference` |

### Every dataset and the panel it opens

Twenty datasets are advertised. Eight of them do not use the generic ticker drill-in at all — they
open a bespoke panel and are served by their own endpoints.

| Dataset | `id` | Group | Panel | Per-ticker drill-in | Chartable features |
|---|---|---|---|---|---|
| Price Data | `price_data` | Market data | Ticker time series | yes | `open`, `high`, `low`, `close`, `adjusted_close`, `volume`, `market_cap` |
| Technical Indicators | `technical_indicators` | Market data | Ticker time series | yes | indicator names from the live metadata |
| Market Cap History | `market_cap_history` | Market data | Ticker time series | yes | `market_cap` |
| US Equity Fundamentals | `us_equity_fundamentals` | Fundamentals | Ticker time series | yes | 15 metrics, see below |
| Crypto Fundamentals | `crypto_fundamentals` | Fundamentals | Ticker time series | yes | `market_cap`, `circulating_supply`, `total_supply`, `market_cap_dominance`, `ath_price`, `atl_price` |
| Analyst Trends | `analyst_trends` | Fundamentals | Ticker time series | yes | none — table only |
| Fund Fundamentals | `fund_fundamentals` | Fundamentals | Ticker time series | yes | `net_assets`, `expense_ratio`, `fund_yield`, `holdings_count` |
| Dividends | `dividends` | Corporate actions | Ticker time series | yes | `value`, `unadjusted_value` (bar mark) |
| Splits | `splits` | Corporate actions | Ticker time series | yes | none — table only |
| News Sentiment | `news_sentiment` | Alternative data | Ticker time series | yes | `sentiment_score`, `article_count` |
| Insider Transactions | `insider_transactions` | Alternative data | Ticker time series | yes | none — table only |
| Index Constituents | `index_membership` | Reference | Ticker time series | yes | `constituent_count` |
| Earnings Calendar | `earnings_calendar` | Events calendar | Events calendar | no | — |
| IPO Calendar | `ipo_calendar` | Events calendar | Events calendar | no | — |
| Interest Rates | `interest_rates` | Macro & rates | Rates | no | — |
| Macro Indicators | `macro_indicators` | Macro & rates | Macro | no | — |
| Symbol Changes | `symbol_changes` | Reference | Symbol changes | no | — |
| Ticker Metadata | `ticker_meta` | Reference | Fields / Records | no | — |
| Hierarchical Groupings | `groupings` | Reference | Groupings explorer | no | — |
| Data Sources | `ingredients` | Reference | Data Sources catalog | no | — |

`us_equity_fundamentals` charts `pe_ratio`, `market_cap`, `ebitda`, `beta`, `roe`, `roa`,
`dividend_yield`, `profit_margin`, `operating_margin`, `revenue_ttm`, `price_book`, `peg_ratio`,
`price_sales_ttm`, `week_52_high`, `week_52_low` — fifteen features, while its raw table shows
thirteen columns. `price_sales_ttm`, `week_52_high` and `week_52_low` are chartable only, and the
last two have no localized label so they appear as raw snake_case in the Feature selector.

Four datasets carry the `S&P 500 universe` scope chip because their source tables are only populated
for the tracked universe: `market_cap_history`, `news_sentiment`, `insider_transactions` and
`analyst_trends`.

Three datasets have no date probe at all, so their `First date`, `Last date` and `Freshness` tiles
are permanently `—` by design: `technical_indicators`, `ticker_meta` and `groupings`. `ingredients`
is excluded from the summary endpoint entirely, so its header band shows no KPI tiles.

Only five datasets accept the asset-group filter: `price_data`, `us_equity_fundamentals`,
`crypto_fundamentals`, `technical_indicators` and `ticker_meta`. Of those,
`us_equity_fundamentals` restricts the picker to groups whose `cluster_type` is `us_equity`, and
`crypto_fundamentals` to `crypto`; groups with no metadata resolved yet are kept in the list either
way.

> [!CAUTION] `ticker_code` is not always a ticker
> For `index_membership` the coverage table's `Ticker` and `Name` columns hold the **index** code
> and name, and its `Nulls` column is a hard-coded `0` — not a measurement.

## Ticker-scoped datasets

Twelve datasets open the standard ticker view. Its toolbar carries a segmented control labelled
`View` with two options — `Coverage` and `Time Distribution` — plus, for cluster-filterable
datasets, an [asset group](/docs/asset-groups) selector pushed to the right.

The selector is a small `Select` with `All tickers` as its first (empty) option, then one option per
asset group you own. The filter is organization-scoped: a group belonging to another organization
silently returns zero rows rather than an error.

### Coverage table

| Control | Behaviour |
|---|---|
| Search | placeholder `Search ticker…`, 300 ms debounce, matched case-insensitively against the ticker code only, resets to page 1 |
| `From` | `type="date"`, its `max` bound to the `To` value |
| `To` | `type="date"`, its `min` bound to the `From` value |
| `CSV` | tooltip `Export the current page to CSV`, disabled at zero rows |

Columns:

| Column | Sortable | Cell |
|---|---|---|
| `Ticker` | yes (`ticker_code`) | monospace |
| `Name` | no | secondary text, truncated |
| `First Date` | yes (`first_date`) | ISO date or `—` |
| `Last Date` | yes (`last_date`) | ISO date or `—` |
| `Records` | yes (`record_count`) | right-aligned count |
| `Nulls` | no | `0` in success green, otherwise a warning-coloured count with tooltip `{{count}} null values` |

Clicking a header toggles ascending/descending; clicking a different header resets to ascending.
The default state sends no sort parameter at all, and the backend then orders by `ticker_code`
ascending. Pagination offers 25 / 50 / 100 rows, defaults to 50, and counts server-side. Clicking a
row opens the inspection drawer.

Empty state title is `No coverage rows`. The description depends on scope: a tracked-universe
dataset shows `This dataset covers the S&P 500 tracked universe — tickers outside it won't appear here. Try clearing the search or the cluster filter.`,
everything else shows `No tickers match the current filters.`

Changing the dataset or the asset-group filter resets the page, the search, both date bounds, the
sort column and the direction.

> [!WARNING] The date window does not apply to two datasets
> `From` and `To` are still rendered for `technical_indicators` and `index_membership`, but the
> backend does not bind them for those two — their coverage queries have no window placeholder.

### Time Distribution chart

An outlined panel of fixed height 520 with the caption `Data presence over time` and a segmented
control offering `Monthly` (default) and `Yearly`.

The chart is a combo: a bar series named `Tickers` on the left axis and a line series named
`Records` on the right, over a hierarchical category time axis, with a bottom zoom slider, inside
zoom, and a crosshair axis pointer. Loading shows a spinner; no data shows `No data available`.

> [!NOTE]
> Time Distribution always charts the whole table. It ignores both the asset-group filter and the
> `From`/`To` window, and it is not paginated.

### Inspection drawer

Clicking a coverage row sets `?ticker` and opens a right-anchored drawer (full width on `xs`,
`min(720px, 90vw)` from `sm`, `min(720px, 44vw)` on `xl`). Clicking the same ticker again closes it.
The header shows the monospace ticker code with the dataset label beneath, the feature selector, and
a close button labelled `Close inspection`.

The feature selector appears only when the dataset has chartable features:

| Dataset | Control | Label | Options |
|---|---|---|---|
| `technical_indicators` | autocomplete | `Indicator` | de-duplicated, sorted indicator names from `GET /market/indicators/metadata`, filtered to ticker-applicable ones |
| every other charting dataset | select | `Feature` | one entry per catalog feature, showing the localized column label where one exists, otherwise the raw key |

Below the header, when the dataset charts a series, sits a four-tile stat strip — `Min`, `Max`,
`Mean`, `Last` — computed client-side over the loaded points, and a segmented control labelled
`Inspection view` with `Chart` and `Table`. The default tab is `Chart`; for `splits`,
`insider_transactions` and `analyst_trends` there is no series, so the drawer opens straight on
`Table` and the toggle is not rendered at all.

- **Chart** — titled `TICKER — feature label`. `dividends` renders as bars; everything else renders
  as a line with a soft area fill and a dashed zero marker. Tooltip values print to four decimals.
  Bottom zoom slider plus inside zoom. Empty shows `No data`. For `technical_indicators` with no
  indicator picked yet, an empty state reads `Select an indicator to chart` /
  `Pick a technical indicator from the selector above to load its series.`
- **Table** — the raw stored records for that ticker, page size fixed at 50 with no size selector.
  Columns come from the API response. Nulls render as a dimmed `—`; integers print with separators;
  values under 10 print to four decimals; values at or above 1e9 collapse to `B`, at or above 1e6 to
  `M`; everything else prints to two decimals. A `constituents` array shows the first six codes and
  ` +{{count}} more`, with the full list in a tooltip.

The series request loads at most **500** points, taken as the most recent rows and returned in
ascending date order, with null values excluded.

Column headers in the raw table are localized where a label exists — `Date`, `Start Date`,
`End Date`, `Open`, `High`, `Low`, `Close`, `Adj. Close`, `Volume`, `Market Cap`, `P/E Ratio`,
`EBITDA`, `Beta`, `ROE`, `ROA`, `Div. Yield`, `Profit Margin`, `Op. Margin`, `Revenue TTM`, `P/B`,
`PEG`, `P/S TTM`, `Circ. Supply`, `Total Supply`, `Dominance`, `ATH`, `ATL`, `Indicator`, `Window`,
`Z-Window`, `Value`, `Count`, `Constituents`. Everything else — `ex_date`, `declaration_date`,
`owner_name`, `transaction_code`, `net_assets`, `week_52_high` and so on — renders as the raw
snake_case key.

Changing the dataset or the ticker resets the tab and the raw page.

## Events calendars

`Earnings Calendar` and `IPO Calendar` share one agenda panel, remounted per dataset so switching
between them resets local state.

| Control | Detail |
|---|---|
| Window | segmented control labelled `Calendar window`, options `Upcoming` (default) and `Past` |
| Range caption | `{{from}} → {{to}}` in monospace |
| Search | placeholder `Search company or code…`, 300 ms debounce |

Windows are computed in the browser, not taken from the API defaults:

| Window | Earnings | IPOs |
|---|---|---|
| `Upcoming` | today → today + 30 days | today → today + 60 days |
| `Past` | today − 30 days → today | today − 30 days → today |

Page size is fixed at 50. Rows are grouped into day blocks headed by a locale-aware
`weekday, MMM d, yyyy` date and a right-aligned `{{count}} event` / `{{count}} events`.

**Earnings rows** show a ticker chip, the company name (or `—`), a timing chip — `BMO` for
`BeforeMarket`, `AMC` for `AfterMarket`, otherwise `—` — and `Est.` with the estimate to two
decimals. In the `Past` window only, they also show `Actual` and a surprise chip formatted to one
decimal, coloured positive at or above zero. When the row resolves to a tracked ticker its chip
links into Markets at `/analysis/markets?tab=ticker&tickerId=…` with the tooltip `Open in Markets` — see
[Market](/docs/market). Market-wide rows with no resolved ticker are still listed; their chip is
inert and the name is `—`.

**IPO rows** show the company name, a code chip, an optional exchange chip, `Range` as
`$from–$to`, `Offer` (only when an offer price exists), `Shares` as a compact magnitude, and an
optional deal-type chip.

Empty states: `No earnings scheduled in this window`, `No earnings reported in this window`,
`No IPOs scheduled in this window`, `No IPOs priced in this window`, each with the hint
`Try the other view or clear the search.`

## Interest rates panel

Up to five KPI tiles: four tenor tiles labelled `{{tenor}} yield` for `3M`, `2Y`, `10Y` and `30Y`,
plus a `2s10s spread` tile in basis points, shown only when both the 2Y and 10Y points exist. A
tenor with no observation renders `—`.

- **`Yield curve`** — subtitle `U.S. Treasury constant-maturity · as of {{date}}`, a line over a
  category axis of tenor labels with circular markers, axis and tooltip values as percentages to two
  decimals. Empty text is `No rate observations yet.`
- **`History`** — subtitle `Daily observations for the selected tenor`, with a segmented control
  labelled `Tenor` over every available series. It defaults to `UST_10Y` when present, otherwise the
  shortest series, and loads 500 observations.

> [!NOTE] How the curve is assembled
> Each tenor contributes its most recent observation at or before the requested date, so different
> tenors on one curve can carry different observation dates, and the "as of" subtitle uses only the
> last point's date. Series codes are parsed with `^UST_(\d+)(M|Y)$`; codes that do not match are
> dropped from the curve chart and sort last in the tenor selector. Values are stored as percent per
> annum — the API returns e.g. `4.28` and the UI divides by 100 before formatting.

## Macro indicators panel

Two selects drive the panel: `Country` (minimum width 220, defaulting to `USA` when present,
otherwise the first country) and `Indicator` (minimum width 260, defaulting to the first indicator).
Both option lists come from the macro catalog endpoint.

The left pane charts the selected country/indicator series over `period_date` as a line with an
area fill and inside zoom, dropping points whose value is null. The right pane,
`Latest values — {{country}}`, is a sticky-header table with the columns `Indicator`, `Period` and
`Value`. The `Period` cell shows the ISO `period_date`, not the vendor period string. Both panes
fall back to `No macro observations for this selection.`

## Symbol changes panel

A single card titled `Symbol changes`, subtitled `Ticker renames across exchanges`, with a search
field in the action slot (`Search old or new symbol…`, 300 ms debounce). Search matches the old
symbol, the new symbol or the company name.

| Column | Cell |
|---|---|
| `Date` | monospace change date |
| `Change` | `OLD → NEW`, old in secondary text, new in bold |
| `Company` | secondary text, `—` when null |
| `Exchange` | outlined chip, `—` when null |

Page size is fixed at 50. Empty state: `No symbol changes match the search`.

## Ticker Metadata panel

`ticker_meta` opens a two-tab panel — `Fields` (default) and `Records` — with the asset-group filter
injected into the same row. Clicking a row in `Fields` switches to `Records` and pre-applies that
field as a "require populated" filter.

### Fields tab

Toolbar: a search box (`Search field…`, client-side, matching key, label and description), a switch
captioned `Only fields injected into strategies`, and a right-aligned summary
`{{tickers}} tickers · {{fields}} fields · {{injected}} injected into strategies`.

| Column | Content |
|---|---|
| `Field` | the monospace key over its display label |
| `Description` | the field description |
| `Type` | an outlined chip with the raw type, `string` or `integer` |
| `Used in strategies` | a success chip labelled `strategies` when exposed, otherwise a dimmed `—` |
| `Availability` | a coverage bar with a percentage to one decimal, over `non-null / total` |
| `Distinct` | the distinct-value count |
| `Sample values` | up to 5 chips, values over 36 characters truncated |

The eighteen fields, in fixed order: `code` (`Ticker Code`), `name` (`Name`), `type` (`Type`),
`sector` (`Sector`), `industry` (`Industry`), `country` (`Country`), `country_iso` (`Country ISO`),
`currency` (`Currency`), `currency_code` (`Currency Code`), `currency_name` (`Currency Name`),
`currency_symbol` (`Currency Symbol`), `isin` (`ISIN`), `cusip` (`CUSIP`), `lei` (`LEI`),
`openfigi` (`OpenFIGI`), `primary_ticker` (`Primary Ticker`), `description` (`Description`),
`full_time_employees` (`Full-Time Employees`). Only the last is `integer`.

"Used in strategies" is resolved at request time from the live injectable-source registry, not from
a hard-coded list. `code` is always exposed because it is the index of the `meta` DataFrame rather
than a column of it. The exposed tooltip reads
``This field is exposed as a column of the `meta` DataFrame injected into strategies.``; the other reads
`Not injected into user strategies — for reference only.`

Availability counts a value as present only when it is non-null **and** not an empty string.
No matches renders `No fields match the current filters.`; a failed load renders
`Failed to load meta field catalog.`

### Records tab

Toolbar: a search box (`Search ticker or name…`, 300 ms debounce, matching code or name), a
multi-select autocomplete labelled `Require fields populated` with the placeholder `any field`, a
`{{count}} tickers` caption, a `CSV` button (tooltip
`Export the current page (visible columns) to CSV`), and a column chooser covering every column the
API returns — it refuses to hide the last visible column.

Visible by default: `code`, `name`, `type`, `sector`, `industry`, `country`, `currency`, `isin`.
Pagination offers 25 / 50 / 100, defaulting to 50.

> [!NOTE]
> Unlike the raw-records table, the `Records` header row prints the raw column keys, not localized
> labels. That is the actual behaviour, not a rendering bug.

Empty and error states: `No tickers match the current filters.` and
`Failed to load ticker metadata.`

## Hierarchical Groupings panel

A two-pane explorer, mounted unfiltered by cluster type.

The left pane holds a `Namespace` select defaulting to the first namespace, then a list of that
namespace's groupings — the code as the primary line (with a `synthetic` chip where applicable) and
the name beneath. Empty renders `No groupings available for this namespace.`

The right pane starts on
`Select a grouping from the list to inspect its descriptor and constituent timeline.` Selecting a
grouping shows its name, `namespace:code`, its description, and chips for `kind: {{value}}`,
`provenance: {{value}}` and `cluster_type: {{value}}`.

> [!CAUTION] Survivorship bias on attribute-derived groupings
> When a grouping's provenance is `ticker_attribute`, the panel adds a `no temporal versioning` chip
> and a warning alert: the grouping derives membership from a ticker attribute at query time, and
> that current snapshot is used for every historical date. Historical backtests over such a grouping
> carry survivorship bias.

A `Hierarchy` block lists `Parents` and `Children` as chips reading `full_code — name`, or `none`.
The timeline block is headed `Constituent timeline ({{start}} → {{end}})` with a timeframe selector
offering `1Y`, `3Y`, `5Y`, `10Y` (default) and `Max`; `Max` anchors the start at `1990-01-01`. Four
summary cards follow — `Days covered`, `Min / mean / max`, `First date`, `Last date` — then a chart
card `Constituents over time`, subtitled `Daily constituent count within the selected window`,
drawing a step line named `Constituents`. With nothing resolved it reads
`No constituents resolved in this date range.`

## Data Sources catalog

The `Data Sources` dataset is the reference for what a strategy can actually inject. Its intro
reads `Every data source you can inject into a strategy — with its exact shape, how to index it in code, and a live sample.`
and its catalog description is:

> Every data source a strategy, fitness function or risk manager can inject — prices, fundamentals,
> groupings, default clusters, basket holdings and more — with its exact shape (dict / table / set /
> record), how to index it in code, and a live sample. Your reference for what each source looks
> like and how to use it.

This panel is the only one that calls no `/data-explorer/*` endpoint. It reads the compiler catalog
proxy `GET /compiler/catalog/data-sources`, enriches each row with the usage snippet from
`GET /strategies/injectable-data-catalog`, and previews samples through `POST /data-sources/preview`.

### Built-in data sources

One accordion per registered source, ordered by the registry's display order. The summary row shows
the label, a type badge, a `needs config` chip when the source requires configuration, and a
monospace chip with the keyword argument the source is injected as.

| Source key | Injected as | Label | Needs config |
|---|---|---|---|
| `meta` | `meta` | Ticker metadata | no |
| `volume` | `volume` | Trading volume | no |
| `news_sentiment` | `sentiment` | News sentiment | no |
| `market_cap` | `market_cap` | Market cap | no |
| `dividends` | `dividends` | Dividends | no |
| `splits` | `splits` | Splits | no |
| `insider_transactions` | `insider_flow` | Insider transactions | no |
| `analyst_trends` | `analyst_revisions` | Analyst estimate revisions | no |
| `fundamentals_crypto` | `fundamentals` | Fundamentals (crypto) | no |
| `fundamentals_equity` | `fundamentals` | Fundamentals (US equity) | no |
| `fund_fundamentals` | `expense_ratio` | Fund expense ratio | no |
| `earnings_calendar` | `next_earnings_days` | Days to next earnings | no |
| `ipo_calendar` | `ipo_activity` | IPO activity | no |
| `interest_rates` | `rates` | Interest rates | yes |
| `macro_indicators` | `macro` | Macro indicators | yes |
| `symbol_changes` | `symbol_changes` | Symbol changes | no |
| `benchmark` | `benchmarks` | Benchmarks & reference series | yes |
| `groupings` | `groupings` | Hierarchical groupings | yes |
| `default_clusters` | `default_clusters` | Platform default clusters | yes |
| `basket_holdings` | `basket_holdings` | Basket holdings | yes |

> [!NOTE] The price panel is not in this list
> `adjusted_close` (injected as `prices`) is deliberately excluded from the catalog endpoint — it is
> the always-present price substrate rather than an opt-in source. The legacy `fundamentals` key is
> marked deprecated and filtered out in favour of the two typed keys above.

Several of these carry coverage limits that decide whether a strategy can run over a given
[asset group](/docs/asset-groups). `sentiment` and `market_cap` are collected only for the tracked
S&P 500 universe; `dividends` and `splits` are equity corporate actions. In all four cases a crypto
or forex group is unavailable to a strategy that uses them. Within the equity universe a never-payer
is a legitimate all-zero `dividends` column (and a never-split ticker an all-1.0 `splits` column),
not missing data.

### What a shape card shows

Expanding an accordion renders a shape card with the source's description, a plain-language
narrative of its structure, a faithful indexing example, its column list or column hint, and a usage
snippet.

- Sources that require configuration show a chip that flips from `needs config` to
  `{{count}} selected` once configured, and a button reading `Configure` or `Edit selection`. Until
  something is picked, the card reads `Pick what to inject above to preview a live sample.`
- Sources that carry their own identity — `groupings`, `default_clusters`, `basket_holdings` —
  preview standalone. Ticker-scoped sources require you to pick an asset group before the preview
  runs.

## Data Pipelines is retired

There is no Data Pipelines page. `/data-pipelines/*` — including its old `/edit/:id` deep links —
redirects to `/analysis/data-explorer`, replacing the history entry.

| Old surface | Where the capability lives now |
|---|---|
| `/data-pipelines` (browse what a source contains) | the `Data Sources` dataset in the Data Explorer, plus the per-dataset panels above |
| `/data-pipelines/edit/:id` (wire sources to a resource) | the Data Sources section inside the strategy, fitness function and risk manager editors |

A strategy now selects its built-in data sources in its own editor: the editor's data-sources
section lists the same catalog rendered here, ticks the ones you want, keeps the function signature
in sync with the chosen keyword arguments, and holds the per-source configuration for the sources
that need it. See [strategies](/docs/strategies), [fitness functions](/docs/fitness-functions) and
[risk managers](/docs/risk-managers).

The Data Explorer is the browse half of that split — read-only, no wiring, no persistence.

## Deep links

Five parameters are written to the URL with `replace: true`, so a dataset view can be bookmarked or
shared. Everything else — table search, sort, paging, the coverage date window and the panel-local
selections (calendar window, tenor, country, timeframe) — is component state and is not in the URL.

| Parameter | Value | Meaning |
|---|---|---|
| `dataset` | a dataset id | The selected dataset. Absent, or unknown, falls back to the landing overview. |
| `cluster_id` | integer | Asset-group filter. Only meaningful on cluster-filterable datasets; an empty string clears it. |
| `tab` | `coverage` \| `heatmap` | Ticker-view sub-tab. Anything other than the literal `heatmap` resolves to `coverage`, and `coverage` is written by deleting the parameter. |
| `ticker` | ticker code | Opens the inspection drawer. Ignored unless the dataset is ticker-scoped. |
| `feature` | feature key | The series charted in the drawer. |

Selecting a new dataset sets `dataset` and deletes `cluster_id`, `tab`, `ticker` and `feature`.
Changing the inspected ticker clears `feature`.

## Exports

Three CSV buttons exist, all client-side. There is no server-side export endpoint anywhere in this
feature.

| Where | Button | Filename | Headers |
|---|---|---|---|
| Coverage table | `CSV` | `{dataset_id}_coverage.csv` | the six localized column headers |
| Inspection drawer, Chart tab | `Export CSV` | `{dataset_id}_{ticker}_{feature}.csv` | `date`, the feature key |
| Inspection drawer, Table tab | `Export CSV` | `{dataset_id}_{ticker}_raw.csv` | the API's raw column keys |
| Metadata Records tab | `CSV` | `ticker_meta.csv` | the currently visible columns, raw keys |

> [!WARNING] Exports cover what is loaded, never the full result set
> The coverage and metadata buttons write the current page — 25, 50 or 100 rows depending on the
> page size. In the drawer, the Table tab writes its fixed 50-row page and the Chart tab writes the
> loaded series, at most 500 points. Files are comma-separated with `\n` line endings, quoting cells
> that contain a comma, a quote or a newline; there is no byte-order mark.

## What the Data Explorer does not do

- **No transforms.** Values are shown exactly as stored. The only reshaping controls are the
  Monthly/Yearly granularity toggle, the rates tenor selector and the groupings timeframe selector.
  Derived series, resampling and joins belong in the data-sources graph of a strategy, not here.
- **No writes.** All seventeen backend routes are `GET`. Nothing on this page creates, edits or
  deletes anything.
- **No drill-in for eight datasets.** Asking a per-dataset endpoint for one of them returns HTTP 406
  naming the correct alternative rather than pretending the dataset does not exist.
- **No `window_size` / `z_score_window` control.** Both are real API parameters for
  `technical_indicators`, but no UI control sets them and the drawer never sends them.
- **`feature=value` is not how you chart an indicator.** `technical_indicators` declares a single
  catalog feature (`value`) that the UI never uses; the drawer's `?feature` carries an indicator
  name, and the backend skips whitelist validation for that dataset alone.

## Backend endpoints

All seventeen routes are read-only `GET`s under one entitlement layer, and every response is wrapped
in the standard `{"data": …}` envelope.

```http
GET /data-explorer/catalog
GET /data-explorer/summary
GET /data-explorer/datasets/:dataset_id/ticker-coverage
GET /data-explorer/datasets/:dataset_id/time-coverage
GET /data-explorer/datasets/:dataset_id/tickers/:ticker_code/series
GET /data-explorer/datasets/:dataset_id/tickers/:ticker_code/raw
GET /data-explorer/meta/fields
GET /data-explorer/meta/records
GET /data-explorer/calendar/earnings
GET /data-explorer/calendar/ipos
GET /data-explorer/rates/series
GET /data-explorer/rates/curve
GET /data-explorer/rates/history
GET /data-explorer/macro/catalog
GET /data-explorer/macro/series
GET /data-explorer/macro/latest
GET /data-explorer/symbol-changes
```

Parameters, defaults and clamps:

| Endpoint | Parameters | Defaults and limits |
|---|---|---|
| `ticker-coverage` | `page`, `page_size`, `search`, `data_cluster_id`, `sort`, `dir`, `from`, `to` | page 1; page size 50, capped at 200; `sort` whitelisted to `ticker_code`, `first_date`, `last_date`, `record_count` with anything else falling back to `ticker_code`; only the literal `desc` reverses direction |
| `time-coverage` | `granularity` | `monthly` by default; only the literal `yearly` switches; no cluster filter, no window, no paging |
| `series` | `feature` (required), `limit`, `window_size`, `z_score_window` | limit 200, capped at 500; the window parameters apply to `technical_indicators` only |
| `raw` | `page`, `page_size` | page 1; page size 50, capped at 200 |
| `meta/records` | `page`, `page_size`, `search`, `data_cluster_id`, `require_fields` | page 1; page size 50, capped at 200; `require_fields` is a comma-separated list of known field keys |
| `calendar/earnings` | `from`, `to`, `search`, `page`, `page_size` | `from` today, `to` today + 14 days; page size 50, capped at 200 |
| `calendar/ipos` | `from`, `to`, `search`, `page`, `page_size` | `from` today, `to` today + 30 days; page size 50, capped at 200 |
| `rates/curve` | `date` | defaults to today; each tenor contributes its latest observation at or before the date |
| `rates/history` | `series_code` (required), `limit` | limit 500, capped at 2000 |
| `macro/series` | `country` (required), `indicator` (required) | unpaginated, ascending by period |
| `macro/latest` | `country` (required) | newest row per indicator |
| `symbol-changes` | `search`, `page`, `page_size` | page 1; page size 50, capped at 200 |

> [!NOTE] The UI's calendar windows differ from the API defaults
> The panel computes 30 days forward for earnings and 60 for IPOs; the API, called without `from`
> and `to`, defaults to 14 and 30 days respectively.

Error contract:

| Status | Condition |
|---|---|
| 402 | the `data_explorer` entitlement is locked and enforcement is on |
| 403 | the caller lacks `data_cluster:read` |
| 406 | unknown dataset, dataset not drillable (the message names the alternative), invalid feature for the dataset, dataset not ticker-scoped, or an unknown meta field |
| 500 | database error |

Datasets that are not drillable and the endpoint each one routes to instead:

| Dataset | Use instead |
|---|---|
| `groupings` | `GET /groupings/available` or `/groupings/{id}` |
| `ticker_meta` | `GET /data-explorer/meta/fields` and `/data-explorer/meta/records` |
| `ingredients` | `GET /injectable-data-sources/catalog` |
| `earnings_calendar` | `GET /data-explorer/calendar/earnings` |
| `ipo_calendar` | `GET /data-explorer/calendar/ipos` |
| `interest_rates` | `GET /data-explorer/rates/series`, `/rates/curve` or `/rates/history` |
| `macro_indicators` | `GET /data-explorer/macro/catalog` and `/macro/series` |
| `symbol_changes` | `GET /data-explorer/symbol-changes` |

These are internal application routes, not the public developer API. For the documented external
surface see the [API overview](/docs/api-overview).
