---
title: Home
section: Platform Overview
sectionOrder: 2
order: 2
published: true
updated: 2026-08-20
summary: The Home dashboard — what each card and metric shows, and where each number comes from.
keywords: home, overview, dashboard, cards, widgets, metrics, analysis
---

Home is what Fintela opens on after login. It lives at `/analysis`, and it is a dashboard you
arrange yourself: on desktop every card sits in a drag-and-drop, resizable grid; on narrow
viewports the same cards stack in one column. It ships **24 cards**, of which **9 are visible by
default** and **15 wait behind a "Show more cards" checklist**. Your arrangement is stored in
your browser, never on the server.

## Route and names

| Where | Path or label |
|---|---|
| Route | `/analysis` |
| Index route `/` | redirects to `/analysis` |
| Sidebar entry (Analysis section) | **Home** |
| Command palette (⌘K) | **Dashboard** — description *Analysis overview* |
| Global search | **Overview** — description *Analysis dashboard* |

Four names, one page. This documentation calls it **Home**, which is what the sidebar and the
mobile bottom bar say. See [navigation](/docs/navigation) for the full route map.

> [!NOTE] `/analysis/overview` is not a route
> That string exists only as an unreachable fallback in the login and register redirects.
> The page is at `/analysis`, with no trailing segment.

Home is **not** entitlement-gated. It carries no `lock`, so it never renders the blurred
"Buy tokens" overlay, and the `overview:read` permission declared on its feature entry is never
checked by the router or by any backend route. Any authenticated user can open it.

## Page chrome and layout controls

The page has **no title, no welcome banner and no hero heading**. It is a right-aligned control
row with exactly two buttons, and then the grid.

### Reset layout

| Element | Exact string |
|---|---|
| Button | `Reset layout` |
| Tooltip when enabled | `Restore the default Home cards and their arrangement` |
| Tooltip when disabled | `Home is already showing the default cards` |
| Dialog title | `Reset dashboard layout?` |
| Dialog body | `Your saved card positions and sizes are discarded, every card you added is hidden again, and the default Home arrangement is restored. This only affects this browser.` |
| Cancel button | `Cancel` |
| Confirm button (red) | `Reset layout` |

The button is disabled until you have actually customised something. Confirming clears the
stored layout, hides every card you revealed, and restores the shipped arrangement.

### Show more cards

| Element | Exact string |
|---|---|
| Button, nothing revealed | `Show more cards` |
| Button, n revealed | `Show more cards ({{shown}}/{{total}})` — e.g. `Show more cards (3/15)` |
| Button tooltip | `Add cards that are hidden by default` |
| Menu caption | `Cards hidden by default` |
| Bulk action | `Show all` (disabled when everything is already on) |
| Bulk action | `Hide all` (disabled when nothing is on) |

The menu **stays open** while you tick boxes, and each change applies immediately behind it.
Every row is named after the card's own title, in this order:

| # | Checklist label | Card |
|---|---|---|
| 1 | `AUM Change` | financial headline tile |
| 2 | `YTD Return` | financial headline tile |
| 3 | `Active Portfolio Groups` | financial headline tile |
| 4 | `Win Rate` | financial headline tile |
| 5 | `Monthly Turnover` | financial headline tile |
| 6 | `Catalog` | registry inventory list |
| 7 | `Portfolios (small card)` | hero KPI tile |
| 8 | `Live Portfolios` | hero KPI tile |
| 9 | `Best OOS Sharpe` | hero KPI tile |
| 10 | `Healthy Portfolios` | hero KPI tile |
| 11 | `Compute Hours` | usage tile |
| 12 | `Storage Used` | usage tile |
| 13 | `Avg Sharpe Ratio` | financial headline tile |
| 14 | `Monthly revenue breakdown` | full-width bar list |
| 15 | `Active portfolio group results` | full-width table |

Two cards are titled `Portfolios` — the summary donut and the small KPI tile. Only the
checklist disambiguates them, by appending `(small card)` to the tile.

### Drag, resize and persistence

The grid is 20 columns wide with a 30 px row height and a 16 px gutter. Each card carries its own
minimum and maximum width and height, and resizing snaps to the grid tracks.

- **Drag** by the invisible strip across the card's header band. Its tooltip reads
  `Drag to move {{card}}`.
- **Resize** from the bottom-right corner only. The handle appears on hover or focus.
- A newly revealed card fades and scales in over 360 ms, suppressed under
  `prefers-reduced-motion`.

> [!WARNING] There is no keyboard equivalent for drag or resize
> The drag strip is deliberately `aria-hidden` because the underlying grid offers no keyboard
> interaction. Card *visibility* is fully keyboard-operable through the "Show more cards" menu.

Layout and visibility are written to `localStorage` under the key
`fintela.dashboard.overview.layout.` followed by your Keycloak subject id, debounced by 500 ms
and flushed when the tab is hidden or the page unmounts. Two accounts sharing one browser profile
keep separate arrangements. Consequences worth knowing:

- Nothing is synced across browsers, devices or profiles.
- Private-browsing or disabled storage silently loses the arrangement; the dashboard still works.
- The stored payload carries a version (**currently 5**). When Fintela reworks the default
  arrangement it bumps that version, and every saved layout is discarded in favour of the new
  defaults.
- Only the ids you *switched on* are persisted, so a card that ships hidden in a later release
  stays hidden for you.

On narrow viewports the grid is replaced by a single-column stack in grid reading order
(top to bottom, then left to right). The **Strategy Creation Workflow card is filtered out of
the mobile stack entirely**. Both toolbar controls are still offered on mobile.

## Default cards

Nine cards ship visible. In default reading order:

| Order | Card title | What it answers |
|---|---|---|
| 1 | `Strategy Creation Workflow` | the build chain, as five links |
| 2 | `Asset Exposure` | what the deployed book holds |
| 3 | `Studies` | how many studies, split per strategy |
| 4 | `Portfolios` | how many portfolios, split per strategy |
| 5 | `Strategies` | how many strategies, how many are used |
| 6 | `Asset Groups` | how many asset groups, how many are used |
| 7 | `Deployed Portfolios per Strategy` | which strategies put money to work |
| 8 | `Active Portfolio Group Performance` | how the deployed groups are doing |
| 9 | `Most Traded Assets` | what the book actually trades |

### Strategy Creation Workflow

Heading `Strategy Creation Workflow`. Five gradient tiles, each one entirely a link. This card
has no data dependency and no loading state.

| Step | Title | Corner action | Destination |
|---|---|---|---|
| 1 | `Pick Assets` | `Create Asset Group` | `/asset-groups?mode=create` |
| 2 | `Design Strategy` | `Create Strategy` | `/strategy?mode=create` |
| 3 | `Optimize Strategy` | `Create Study` | `/studies?mode=create` |
| 4 | `Select Portfolios` | `View Portfolios` | `/analysis/portfolios` |
| 5 | `Deploy to Live` | `Open Portfolio Manager` | `/analysis/portfolio-manager` |

Risk Managers is not a workflow step, and neither Fitness Functions nor asset pipelines have a
tile — those objects are created in context from their own pages. See
[asset groups](/docs/asset-groups), [strategies](/docs/strategies), [studies](/docs/studies) and
[portfolio manager](/docs/portfolio-manager).

This card is also where the welcome tour anchors its first steps.

### Asset Exposure

Title `Asset Exposure`. A capital-weighted donut of what the **deployed** book holds, plus a
legend.

| Slot | Content |
|---|---|
| Subtitle | `{{assets}} assets across {{groups}} deployed portfolio groups, weighted by each group's share of deployed capital` |
| Control | segmented control labelled `Book` with `All` / `Live` / `Paper` |
| Ring centre | asset count over the caption `assets` |
| Legend row | swatch, asset logo, code, full name (hidden below `sm`), weight to 1 decimal |
| Folded tail | `1 other asset` / `{{count}} other assets`, in neutral grey |
| Cash row | `Cash`, rendered only when the uninvested remainder is above zero |

The weight formula is `Σ over groups of (group's share of deployed capital × the asset's gross
weight in that group)`. Arcs are **gross** exposure — a short counts by its size, not its sign —
and the uninvested remainder is drawn as cash rather than normalised away.

Row and arc tooltips carry, in order: `CODE · Name`; `{{weight}} of deployed capital` to
2 decimals; `Net {{net}} — held short in part of the book` when gross and net disagree; and
`Held by {{groups}} groups`.

The caption line below the ring is assembled from these, in priority order and joined with ` · `:

| Condition | Caption |
|---|---|
| Request failed | `Exposure could not be loaded.` |
| Nothing deployed, `All` | `No portfolio group has been deployed yet.` |
| Nothing deployed, `Live` | `No portfolio group is trading live money yet.` |
| Nothing deployed, `Paper` | `No portfolio group is paper trading.` |
| Deployed but no composition reported | `Your deployed portfolio groups have not reported a composition yet.` |
| Coverage below ~100 % | `Covering {{coverage}} of deployed capital` |
| No capital recorded anywhere | `No capital recorded — groups weighted equally` |
| Mixed groups, in `Live` or `Paper` | `{{groups}} groups trade both books and are counted in full here` |
| Always, when known | `As of {{date}}` |

> [!IMPORTANT] The ring covers at most 12 groups
> The holdings endpoint refuses more than 12 group ids rather than truncating, so the card picks
> the 12 largest by capital. Whenever the ring describes less than the mode's full capital, the
> `Covering …` caption states how much it does cover. A group trading both books is counted in
> full under **both** `Live` and `Paper`.

The `Book` selector is card-local state. It resets to `All` on reload and is not saved with your
layout.

### Registry summary donuts

Four cards share one shape: an uppercase title, a donut, and the whole card as a link. In the
empty state the card stops being a link and renders a call-to-action button instead.

| Card | Ring | Centre | Links to | Empty state |
|---|---|---|---|---|
| `Asset Groups` | `Used` / `Unused` | `used / total` over the caption `used / total` | `/asset-groups` | `No asset groups yet` · `An asset group defines the universe a strategy trades.` · `Create asset group` |
| `Strategies` | `Used` / `Unused` | `used / total` over the caption `used / total` | `/strategy` | `No strategies yet` · `A strategy turns market data into positions.` · `Create your first strategy` |
| `Studies` | one arc per strategy | total studies over `{{count}} deployed` | `/studies` | `No studies yet` · `A study optimizes a strategy's parameters over history.` · `Create your first study` |
| `Portfolios` | one arc per strategy | total portfolios | `/analysis/portfolios` | `No portfolios yet` · `Portfolios are produced by running a study.` · `Go to portfolios` |

What "used" means in each case:

| Card | Numerator |
|---|---|
| Asset Groups | distinct asset groups referenced by any study, as either the strategy's or the fitness function's data source |
| Strategies | distinct strategy names across your studies' metadata |
| Studies | studies with at least one managed portfolio currently deployed to paper or live trading |

Only the two categorical rings — Studies and Portfolios — draw a legend, since colour alone
cannot say which arc is which. Their arcs are capped at 6 segments: the tail folds into
`1 other strategy` / `{{count}} other strategies`, and any shortfall between the headline total
and the attributed sum becomes a `No strategy` arc. Arc tooltips read
`{{label}} · {{count}} ({{share}})`. A strategy keeps the same colour in both rings.

> [!NOTE] The donuts show no breakdown list
> Earlier versions listed categories under each ring (assets per type, internal vs external,
> studies per optimizer, PBO bands). Those figures are still computed but the card does not
> render them today.

### Deployed Portfolios per Strategy

Title `Deployed Portfolios per Strategy`. A horizontal bar list, one bar per strategy, all in one
hue. The list is uncapped and the card body scrolls.

| Slot | Exact string |
|---|---|
| Subtitle | `{{total}} portfolios across {{groups}} deployed portfolio groups` |
| Info tooltip | `Portfolios held by a portfolio group that has capital at a broker (an active or paused operation), counted against each portfolio's strategy. A portfolio in two groups counts once; strategies with nothing deployed are left off the chart.` |
| Empty — no strategies exist | `No strategies yet.` |
| Empty — strategies exist, nothing deployed | `No portfolio group has been deployed yet.` |
| Caption when lineage is missing | `{{total}} deployed portfolios have no strategy lineage left and are in no bar.` |

Only strategies with at least one deployed portfolio are plotted. Bar tooltips read
`label: value`, and every bar is floored at 3 % of the track width so a single deployment is
still visible.

### Active Portfolio Group Performance

Title `Active Portfolio Group Performance`. One equity/return line per active portfolio group.

| Control | Values |
|---|---|
| `Timeframe` | `4 weeks`, `8 weeks`, `12 weeks`, `26 weeks` — default **12 weeks** |
| Link | `View in Portfolio Manager` → `/analysis/portfolio-manager` |

The window is an inclusive `[today − weeks × 7, today]` range computed from **local** date parts,
so it never lands on the wrong calendar day. The chart is the same component and the same request
Portfolio Manager's Book Equity tab uses, so the two can never disagree.

Every ranked group gets a line; the first eight in revenue-rank order get a palette colour, and
the rest render as a faint neutral swarm — which means a line's colour matches its row in the
results table. Home draws **no benchmark** and **no "created" markers**.

Card and chart states:

| State | What renders |
|---|---|
| No active groups (and not loading) | caption `No active portfolio groups yet.` |
| Loading | a filled pane with a rounded skeleton |
| Request failed | error alert: `Couldn't load the overview.` |
| Nothing selected | info alert: `Every group is unchecked — check one to draw it.` |
| Some series too short | note `{{names}} has no value over this window` |
| Series thinned | note `thinned to fit` |

The timeframe is card-local state and is not saved with your layout.

### Most Traded Assets

Title `Most Traded Assets`. One bar per asset, ranked by how many trades touched it.

| Slot | Exact string |
|---|---|
| Subtitle | `{{trades}} trades in the {{tickers}} assets listed, across {{groups}} deployed portfolio groups` |
| Info tooltip | `Assets traded by your deployed portfolio groups — those with capital at a broker (an active or paused operation) — over each group's full tracked history. The bar is the number of trades that touched the asset, closed and still open, so the ranking is by activity rather than by size or by profit. The figure beside each bar is that asset's realized P&L as a fraction of NAV — closed trades only, never money, and it does not affect the order. Counts come from each group's tracked strategy history, not from broker fills.` |
| Empty — nothing deployed | `No portfolio group has been deployed yet.` |
| Empty — deployed, nothing traded | `Your deployed portfolio groups have not traded anything yet.` |
| Truncation caption | `Showing the {{shown}} most traded of {{total}} assets.` |

Each row carries a fixed right-hand realized-P&L column with four tones:

| Condition | Glyph | Text |
|---|---|---|
| Nothing closed, or the figure is not finite | none | `—` |
| Rounds to zero at one decimal | horizontal arrow | signed percent, neutral tint |
| Above zero | up arrow | signed percent, positive tint |
| Below zero | down arrow | signed percent, negative tint |

Row tooltips read: `CODE · Name`; `{{total}} trades ({{closed}} closed, {{open}} open)`;
`Traded by {{groups}} groups`; then either `Realized P&L: {{pnl}} of NAV` at two decimals or
`Realized P&L: none yet — nothing closed`.

> [!CAUTION] The list is capped at 50 assets by the server
> The truncation caption is the only place the true asset count appears. Do not read this list
> as the whole book. And do not read a `—` in the P&L column as "broke even" — it means nothing
> has been closed on that asset yet.

## Opt-in cards

### Financial headline tiles

Six single-figure tiles, all fed by one request. Each has an accent chip, an uppercase label, a
large tabular figure, and optionally a change chip or a subtitle line.

| Label | Value | Change chip or subtitle |
|---|---|---|
| `AUM Change` | the change itself; `—` when there is no baseline | subtitle is the baseline phrase |
| `YTD Return` | year-to-date revenue as a fraction of total AUM, signed, 1 decimal | change chip from the YTD revenue move |
| `Active Portfolio Groups` | count of active groups | subtitle `{{profitable}} profitable ({{share}})` |
| `Win Rate` | win rate as a percent, 1 decimal | change chip from the win-rate move |
| `Avg Sharpe Ratio` | mean Sharpe to 2 decimals, or `—` | subtitle `Across groups with enough history` |
| `Monthly Turnover` | notional traded as a fraction of total AUM, 1 decimal | change chip captioned `notional traded vs last month` |

Baseline captions under a change chip:

| Baseline | Caption |
|---|---|
| Previous month | `from last month` |
| Previous quarter | `vs last quarter` |
| Previous year | `YoY` |

Change magnitudes carry a unit. A `percent` change renders as a signed percent (`+4.8%`). A
`points` change renders as `{{sign}}{{value}}pp` (`+2.1pp`) — a win rate moving 66.3 % to 68.4 %
has risen 2.1 points, and calling that "+2.1%" would claim a relative gain about a third the
size. The arrow, not the colour, is what carries direction.

> [!WARNING] `AUM Change` shows the change, not the size of the book
> The server does not keep a history of target capital, so the AUM change field is currently
> always absent and the tile renders `—`. Read it as "we cannot measure this yet", not as zero.

### Catalog

Title `Catalog`, with the legend `used / total` beside it. Six rows, each an icon chip plus a
label on the left and the figure on the right, where the big coloured number is the **total**.
Every row is a link.

| Row | Value | Shows a `used /` prefix | Links to |
|---|---|---|---|
| `Asset Groups` | total asset groups | yes | `/asset-groups` |
| `Strategies` | total strategies | yes | `/strategy` |
| `Fitness Functions` | total fitness functions | yes | `/fitness` |
| `Studies` | total studies | no | `/studies` |
| `Risk Managers` | total risk managers | no | `/risk-managers` |
| `Portfolio Groups` | total portfolio groups | no | `/analysis/portfolio-groups` |

The first three rows also carry a hover tooltip: `{{total}} in the catalog · {{used}} used by
your studies`. Counts are grouped below a thousand and compacted above it (`1.5K`).

See [fitness functions](/docs/fitness-functions), [risk managers](/docs/risk-managers) and
[portfolio groups](/docs/portfolio-groups).

### Hero KPI tiles

Four larger tiles with a coloured top border, an uppercase label, a big accent figure and a
secondary line.

| Label | Value | Secondary line | Links to |
|---|---|---|---|
| `Portfolios` | total trial portfolios | — | — |
| `Live Portfolios` | broker trackings currently operating | `live / paper` with the split | — |
| `Best OOS Sharpe` | best out-of-sample Sharpe among healthy studies, 2 decimals | `study` and `{{name}} · PBO {{pbo}}` | — |
| `Healthy Portfolios` | scored portfolios belonging to healthy studies | `PBO` and `< 0.20` | `/studies` |

"Healthy" means a study whose PBO — the probability of backtest overfitting — is **strictly
below 0.20**. That is a stricter bar than the platform-wide overfit boundary of 0.5: healthy
means a study actively trusted, not merely one that is not flagged. PBO is a study-level metric
that every portfolio of that study inherits, and a study whose PBO was never measured counts as
**not** healthy. The threshold is configurable per deployment.

`Best OOS Sharpe` reads a 500-deep global out-of-sample Sharpe ranking, so a healthy study whose
best portfolio ranks below 500th globally reports nothing. When no study qualifies, the secondary
line reads `No healthy studies`. Study names longer than 18 characters are truncated to 16
characters plus an ellipsis.

> [!NOTE] `Live Portfolios` counts broker trackings, not operations
> The tile counts broker trackings whose last status is `ACTIVE`, split by the environment of
> the connection behind each one. Trackings are the platform's earlier deploy path; the current
> model is portfolio-group operations. See [live trading](/docs/live-trading).

### Usage tiles

| Label | Value | Secondary | Trend chip |
|---|---|---|---|
| `Compute Hours` | compute hours over the trailing 30 days, 1 decimal, suffixed `h` | `period` and the month, e.g. `Jul 2026` | yes |
| `Storage Used` | estimated storage, 2 decimals, suffixed ` GB` | `as of` and the period end date | no |

The trend chip is tinted with the card's own accent, never green or red — consumption is neither
good nor bad. Its tooltip reads `vs previous 30 days`. The chip is **omitted entirely** when
there is no comparable prior figure: a first-ever period is an infinite increase, not `+100%`.
Both tiles fall back to `—` when the usage payload has not arrived.

> [!NOTE] The `Compute Hours` month label is always English
> The month-and-year secondary value is formatted with a hardcoded `en-US` locale, so it reads
> `Jul 2026` even in Spanish or Portuguese.

See [tokens and billing](/docs/tokens-and-billing) for what consumes compute.

### Monthly Revenue Breakdown

| Slot | Exact string |
|---|---|
| Title | `Monthly Revenue Breakdown ({{year}})`, or `Monthly Revenue Breakdown` when the year is unknown |
| Headline label | `Month-to-date return` |
| Headline value | month-to-date revenue as a fraction of total AUM, signed, 2 decimals |
| Bar-list heading | `Revenue by Strategy Type` |
| Bar-list caption | `Share of month-to-date revenue` |
| Bar tooltip | `{{strategy}} — {{share}} of month-to-date revenue` |
| Empty | `No revenue recorded this month.` |

Shares are computed against the sum of **positive** revenue only, so a losing strategy
contributes nothing to the denominator. All bars use one hue.

### All Active Portfolio Groups — Financial Results

Title `All Active Portfolio Groups — Financial Results`, subtitle `Top 3 performers highlighted`,
empty state `No active portfolio groups.` A small table with a sticky header; the table container
is the only scroller.

| Column | Align | Cell |
|---|---|---|
| `Rank` | right | rank number; the top 3 in the positive hue at weight 700 |
| `Portfolio Group` | left | the group name, linking to `/analysis/portfolio-manager/{group_id}/equity` |
| `Strategies` | left | first strategy plus `+N`; tooltip lists them all; `—` when empty |
| `Allocation` | right | percent of the book's capital, 1 decimal |
| `Revenue Share` | right | signed percent of gross profit, 1 decimal, green or red by sign |
| `Return %` | right | signed percent, 1 decimal, green or red by sign |
| `Sharpe` | right | 2 decimals, or `—` |
| `Win Rate` | right | percent, 1 decimal |
| `Max Drawdown` | right | percent, 1 decimal, red only when negative, or `—` |
| `Status` | left | dot plus trading-status label |

The `Status` column says **where** the group trades, not how it is doing:

| Condition | Label | Dot |
|---|---|---|
| Every one of the group's operations is paused | `Paused` | neutral |
| Paper only | `Paper Trading` | neutral |
| Live only | `Live Trading` | amber |
| Both | `Paper + Live` | amber |

Paused wins over environment. Amber marks real money.

Sorting: every column has a sort control. The default is `Rank` ascending. Clicking a new column
starts ascending for `Portfolio Group`, `Strategies` and `Status`, and descending for every
numeric column. `Max Drawdown` sorts on the raw negative fraction, so ascending puts the deepest
drawdown first. Empty values always sort last.

Rows are clickable on a plain left click; modifier and middle clicks fall through to the name
cell's link so they open a new tab. A profitable row gets a very low-alpha positive wash, and the
top three get an inset accent rail on the first cell — a second, non-colour cue.

> [!IMPORTANT] `—` in `Sharpe` or `Max Drawdown` is not zero
> Both figures need **20 distinct marked trading days** of broker equity before the server will
> report them. Until then the cell is an em dash with the tooltip
> `Not measured yet — the broker equity series is still too short to support this figure.`

## Reading the financial figures

Every financial card on Home is fed by one request, `GET /financials/overview`, so the headline
tiles, the results table, the performance chart and the exposure ring can never describe
different books.

Three rules govern how to read them.

**Everything is a rate, not an amount.** `YTD Return`, `Month-to-date return`,
`Monthly Turnover`, `Allocation`, `Revenue Share` and `Return %` are all fractions of capital or
of gross profit. No monetary figure reaches any Home component.

**The grain is the portfolio group.** Rows, ranks, allocations and status are per portfolio
group — not per portfolio. A group is counted as active when it has at least one broker operation
whose status is `ACTIVE` or `PAUSED`; drafts and stopped operations are excluded.

**Paper trading is disclosed on every financial surface.** A small `Paper trading` note sits at
the bottom-right of every financial headline tile, the revenue breakdown and the results table.
It appears unless **every** contributing group runs entirely on funded live accounts — one paper
operation in the mix makes the whole total simulated. The client also assumes paper trading while
the payload is still loading.

Server-side definitions worth knowing:

| Figure | How it is computed |
|---|---|
| Group AUM | sum of target capital across the group's `ACTIVE` and `PAUSED` operations |
| `ytd_revenue` | sum of realized P&L on trades closed since 1 January UTC, excluding corporate-action-affected trades |
| `Return %` | year-to-date P&L divided by AUM; zero when AUM is zero or negative |
| `Win Rate` | winning closed round-trips over closed round-trips, year to date |
| `Sharpe` | annualised by √252 from daily returns off the group's equity curve; absent below 20 marks, below 19 consecutive-session steps, or with zero dispersion |
| `Max Drawdown` | deepest peak-to-trough as a negative fraction; `0` for a monotone curve; absent below 20 marks |
| Profitable / breakeven / underperforming | a ±0.5 % band around zero return |
| Monthly turnover numerator | notional filled in the current UTC calendar month |
| `Allocation` | the row's capital over the sum of all rows' capital, so the column always sums to 100 % |
| `Revenue Share` | the row's YTD revenue over the sum of positive YTD revenue — signed, so losers net against winners |

See [metrics reference](/docs/metrics-reference) for the full metric definitions and
[analyzing results](/docs/analyzing-results) for how to act on them.

## Empty and loading states

Home has **no page-level error banner**. Every card degrades on its own, so a total backend
outage renders a dashboard of empty states rather than an error page.

| Card | While loading | When empty |
|---|---|---|
| Strategy Creation Workflow | no loading state — it is pure navigation | never empty |
| Asset Exposure | circular skeleton ring plus 6 skeleton legend rows; **subtitle and caption are both suppressed** | dense empty state carrying the caption |
| Summary donuts | skeleton ring, no legend | title, description and a create button |
| Deployed Portfolios per Strategy | 6 skeleton rows | caption distinguishing "no strategies" from "nothing deployed" |
| Active Portfolio Group Performance | filled pane with a rounded skeleton | `No active portfolio groups yet.` |
| Most Traded Assets | 8 skeleton rows | caption distinguishing "nothing deployed" from "nothing traded" |
| Financial headline tiles | label renders, value becomes a skeleton, change chip and subtitle are not rendered | the value is `—` wherever the figure is unavailable (`AUM Change` with no baseline, `Avg Sharpe Ratio` with no measurable history) |
| Catalog | per-row skeleton values | rows read `0` |
| Hero KPI tiles | skeleton value, secondary reads `—` | `No healthy studies` where applicable |
| Usage tiles | skeleton value | `—` |
| Monthly Revenue Breakdown | 7 skeleton rows | `No revenue recorded this month.` |
| Group results table | 6 skeleton rows across 10 columns | `No active portfolio groups.` |

Two deliberate distinctions:

- The exposure card suppresses its subtitle and caption while loading, so an in-flight card never
  asserts "Covering 0% of deployed capital".
- A book that has liquidated everything is **not** empty. It reports 0 assets and 100 % cash, and
  the ring still draws.

## Refresh behaviour

**There is no manual refresh control on Home.** Cards refresh on their own schedules:

| Data | Cache lifetime | Polling |
|---|---|---|
| Financial overview | 5 minutes | none, and no refetch on window focus |
| Study status | 5 seconds | every 5 s while any study is running, queued or pending — widened to 30 s while the realtime stream is connected, and stopped once everything is terminal |
| Usage summary | 30 seconds | every 60 seconds |
| Broker trackings | none | every 5 seconds |
| Broker connections | none | every 10 seconds |
| Studies, portfolios, registries, portfolio-manager data | 60 seconds | none |
| Ticker names and asset counts | 1 hour | none |

Nothing else on the page polls. Reloading the page re-issues every request whose cache has gone
stale.

## Backend endpoints

Home fans out across roughly two dozen requests. Hooks called twice with identical arguments are
served from one cache entry and cost one request.

| Method and path | Query parameters | Feeds | Permission |
|---|---|---|---|
| `GET /financials/overview` | — | every financial tile, the results table, the performance chart's group set, the exposure ring's group set and capital weights | `portfolios:read` |
| `GET /studies` | `created_by=me` in **My** workspace mode only | study counts and every study-derived figure | `study:read` |
| `GET /studies/status` | `study_ids` | an `in progress` study count the Catalog list layout does not render | `study:read` |
| `GET /studies/metadata` | `study_ids` | strategy, fitness and asset-group "used" counts; the studies and portfolios rings | `study:read` |
| `GET /studies/deployed` | `study_ids` | the Studies donut's `{{count}} deployed` caption | `study:read` |
| `GET /studies/overfitting` | `study_ids`, `summary=true` | `Healthy Portfolios`, and the healthy filter behind `Best OOS Sharpe` | `study:read` |
| `GET /portfolios` | `study_ids` | portfolio counts, per-strategy portfolio ring | `portfolios:read` |
| `GET /portfolios/global/n_top` | `stage=out_of_sample`, `metric_name=sharpe_ratio`, `n_top=500`, `asc=false` | `Best OOS Sharpe` | `portfolios:read` |
| `GET /strategies` | — | Catalog `Strategies`, the Strategies donut, the deployment census | `strategy:read` |
| `GET /strategies/metadata` | `strategy_ids` | strategy execution types, for the donut breakdown that is no longer rendered | `strategy:read` |
| `GET /fitness` | — | Catalog `Fitness Functions` | `fitness:read` |
| `GET /data_clusters` | — | Catalog `Asset Groups`, the Asset Groups donut | `data_cluster:read` |
| `GET /risk-managers` | — | Catalog `Risk Managers` | `risk_manager:read` |
| `GET /usage/summary` | — | `Compute Hours`, `Storage Used` | authenticated only |
| `GET /portfolio_manager/baskets` | — | Catalog `Portfolio Groups`, the deployed-group set | `portfolios:read` |
| `GET /portfolio_manager/managed/registry` | — | strategy lineage for the deployment census | `portfolios:read` |
| `GET /portfolio_manager/dashboard/compare/series` | `basket_ids`, `metric=equity`, `window=custom`, `mode=book`, `custom_start`, `custom_end` | the performance chart | `portfolios:read` |
| `GET /portfolio_manager/dashboard/compare/trade-metrics` | `basket_ids`, `window=inception`, `mode=own`, `sort=pnl`, `blocks=traded` | `Most Traded Assets` | `portfolios:read` |
| `GET /portfolio_manager/dashboard/holdings` | `basket_ids`, `window=1w`, `mode=book`, `max_points=16` | `Asset Exposure` | `portfolios:read` |
| `GET /broker/trackings` | — | `Live Portfolios` total | `broker_tracking:read` |
| `GET /broker/connections` | — | the `live / paper` split on `Live Portfolios` | `broker_connection:manage` |
| `POST /tickers/metadata/by-codes` | body: `{ codes }` | asset names in the exposure legend and the traded list | authenticated only |
| `GET /tickers/asset_counts` | — | asset-type counts, for the donut breakdown that is no longer rendered | authenticated only |
| `GET /portfolios/tmp` | `portfolio_ids`, chunked at 200 | issued but not read by any card | `portfolios:read` |
| `GET /portfolios/strategies` | `portfolio_ids`, chunked at 200 | issued but not read by any card | `portfolios:read` |

The spine of the page:

```http
GET /financials/overview
```

It returns headline aggregates, a month-to-date revenue split by strategy, one row per active
portfolio group and one per portfolio, an `as_of` timestamp, a `paper_trading` flag and a
`coverage` block naming how many equity-series days exist and how many are required (20). Money
is a plain USD number, **every rate is a fraction** (`0.684` means 68.4 %), and `max_drawdown` is
negative. Nothing is pre-formatted.

> [!CAUTION] The financial overview is never exposed to Fintelligent
> This payload is derived from connected brokerage data — order fills, position marks, realized
> P&L. Fintela's cybersecurity policy commits that live brokerage account data is not transmitted
> to the AI provider, so no [Fintelligent](/docs/fintelligent) tool reads this route. Any change
> to that requires a compliance review.

Request caps that bound what Home can ask for:

| Endpoint | Cap | Behaviour past the cap |
|---|---|---|
| `dashboard/holdings` | 12 basket ids | refuses the request |
| `dashboard/compare/trade-metrics` | 60 basket ids | refuses the request |
| `dashboard/compare/series` | 200 basket ids | refuses the request |
| `trade-metrics` `traded` block | 50 rows | truncates, and reports the pre-cut total |

See [API overview](/docs/api-overview) for the public API surface, which is separate from these
internal routes.

## Scoping and permissions

Home mixes two scoping rules, and this is the single most common source of confusion about its
numbers.

| Data | Follows the My / Company workspace toggle? |
|---|---|
| Studies, and everything derived from them — study counts, deployed counts, PBO health, portfolios-by-study, the studies and portfolios rings, `Best OOS Sharpe`, `Healthy Portfolios` | **yes** |
| Asset groups, strategies, fitness functions, risk managers | no — always organization-wide |
| Portfolio groups, all financial figures, all broker figures | no — organization-wide by construction |

The workspace mode is stored in `localStorage` under `fintela.workspace.mode` and defaults to
**Company**.

> [!WARNING] In My mode the Catalog mixes two scopes
> The Catalog card shows organization-wide totals next to "used" counts derived from *your*
> studies only. A low `used / total` ratio in My mode does not mean the organization is not
> using those objects.

Home does not hide cards based on your permissions — it simply issues the requests. A role
lacking a permission gets a 403 for that request, and the affected card renders its loading or
empty path rather than an explicit access message.

| Card | Permission the backend actually requires |
|---|---|
| Financial tiles, results table, performance chart, exposure ring, traded assets, deployment census, Portfolios donut and tile | `portfolios:read` |
| Catalog `Asset Groups`, Asset Groups donut | `data_cluster:read` |
| Catalog `Strategies`, Strategies donut | `strategy:read` |
| Catalog `Fitness Functions` | `fitness:read` |
| Catalog `Studies`, Studies donut, `Best OOS Sharpe`, `Healthy Portfolios` | `study:read` |
| Catalog `Risk Managers` | `risk_manager:read` |
| `Live Portfolios` | `broker_tracking:read` **and** `broker_connection:manage` |
| `Compute Hours`, `Storage Used`, asset names and counts | authentication only |

> [!NOTE] `Live Portfolios` needs a manage permission for a read-only figure
> A member with read-only broker access sees the total, but the `live / paper` split reads
> `0 / 0` because the connections list never resolves.

## Onboarding tour

The **welcome** tour runs on this page and never navigates — all six steps live on `/analysis`.
Two of them anchor into the Strategy Creation Workflow card: the strip as a whole, then its
first tile. The opening step is unanchored and centred; the remaining three point at the
sidebar's Registry and Analysis sections and at the help control in the header. The tour is
skipped entirely on mobile, where the information architecture is different. See
[navigation](/docs/navigation) for the mobile bottom bar.
