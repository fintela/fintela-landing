---
title: Home
section: Platform Overview
sectionOrder: 2
order: 2
published: true
updated: 2026-09-01
summary: What the Home dashboard shows you, how to arrange and customize it, and how to read every card's numbers.
keywords: home, dashboard, overview, cards, metrics, layout
---

Home is the page Fintela opens to right after you sign in. It's a dashboard you shape yourself:
on a desktop screen, every card sits in a drag and drop grid you can resize and rearrange; on a
phone or a narrow window, the same cards stack in a single column instead. Fintela ships 24 cards
in total. Nine are shown by default, and the other fifteen are available whenever you want them,
tucked behind a "Show more cards" menu. However you arrange things is remembered in your own
browser: it isn't synced anywhere, and nobody else on your team sees your personal layout.

## What this page is called

You'll mostly see this page called **Home**: that's the label in the sidebar and in the mobile
navigation bar, and it's what this guide calls it too. A couple of other spots in the product use
slightly different names for the same page: the command palette quick open (⌘K) lists it as
"Dashboard," and global search lists it as "Overview." All three open the exact same page. See
[navigation](/docs/navigation) for the full map of where things live.

Home is open to every user on every plan: there's no premium lock or upgrade prompt on this
page, unlike some other areas of the product.

## Customizing your dashboard

There's no page title or welcome banner at the top of Home: just a control row with two buttons,
and your grid of cards below it.

### Reset layout

**Reset layout** undoes any customizing you've done. It stays disabled until you've actually
changed something (moved a card, resized one, or revealed a hidden one) so you can't reset a
layout that's already the default.

Clicking it asks you to confirm: *"Your saved card positions and sizes are discarded, every card
you added is hidden again, and the default Home arrangement is restored."* This only affects the
browser you're using: it won't touch a layout you've set up on another device.

### Show more cards

Nine cards are visible from the start; the other fifteen live behind **Show more cards**. Once
you've revealed a few, the button updates to show your progress, e.g. *"Show more cards (3/15)."*

Opening the menu gives you a checklist of every hidden card, named after its own title, plus two
shortcuts: **Show all** and **Hide all**. The menu stays open while you tick boxes, so you can
switch on several cards in one pass: each appears on your dashboard immediately.

The fifteen opt in cards are:

| Card | What it shows |
|---|---|
| AUM Change | Change in assets under management |
| YTD Return | Year to date return |
| Active Portfolio Groups | Count of groups currently trading, and how many are profitable |
| Win Rate | Your win rate across closed trades |
| Monthly Turnover | Notional traded this month, as a share of AUM |
| Catalog | A quick inventory of your asset groups, strategies, fitness functions, studies, risk managers and portfolio groups |
| Portfolios (small card) | Your total number of portfolios |
| Live Portfolios | Broker connections currently trading |
| Best OOS Sharpe | Your best out of sample Sharpe ratio among healthy studies |
| Healthy Portfolios | Portfolios belonging to studies that pass the overfitting check |
| Compute Hours | Compute used over the last 30 days |
| Storage Used | Your current storage usage |
| Avg Sharpe Ratio | Average Sharpe ratio across your groups |
| Monthly revenue breakdown | Month to date revenue, broken down by strategy type |
| Active portfolio group results | A full results table for every actively trading group |

> [!NOTE] Two cards share the name "Portfolios"
> A small summary donut and a KPI tile are both titled "Portfolios." The Show more cards
> checklist tells them apart by labeling the tile "Portfolios (small card)."

### Arranging and saving your layout

Drag any card by its header to move it; grab the bottom right corner to resize it. A card you've
just revealed fades gently into place.

> [!WARNING] Dragging and resizing need a mouse or touchscreen
> Moving and resizing cards isn't available from the keyboard today. Showing and hiding cards,
> though, works entirely from the keyboard through the "Show more cards" menu.

A few things worth knowing about how your layout is remembered:

- It's saved to the browser you're using, tied to your account: nothing is synced across
  browsers, devices, or team members. Two people signed into different accounts on the same
  browser each keep their own arrangement.
- A private/incognito window, or a browser with storage disabled, won't remember your
  arrangement: Home still works fine, it just resets to default the next time you open it.
- When Fintela updates the default set or arrangement of cards, everyone's saved custom layout
  resets to the new defaults. Whatever cards you'd already chosen to reveal, though, stay
  revealed for you.

On a phone or narrow window, cards stack in a single column instead of a grid, in the same
reading order. The **Strategy Creation Workflow** card is left out of that mobile view. Both
**Reset layout** and **Show more cards** are still available on mobile.

## Default cards

These nine cards are visible the first time you open Home:

| Order | Card | What it answers |
|---|---|---|
| 1 | Strategy Creation Workflow | Quick links through the whole build chain |
| 2 | Asset Exposure | What your deployed book actually holds |
| 3 | Studies | How many studies you have, by strategy |
| 4 | Portfolios | How many portfolios you have, by strategy |
| 5 | Strategies | How many strategies you have, and how many are actually used |
| 6 | Asset Groups | How many asset groups you have, and how many are actually used |
| 7 | Deployed Portfolios per Strategy | Which strategies have money working |
| 8 | Active Portfolio Group Performance | How your deployed groups are performing |
| 9 | Most Traded Assets | What your book is actually trading |

### Strategy Creation Workflow

Five linked tiles that walk you through building and deploying a strategy from scratch, each with
a shortcut into that step:

| Step | Tile | Shortcut takes you to |
|---|---|---|
| 1 | Pick Assets | Create a new [asset group](/docs/asset-groups) |
| 2 | Design Strategy | Create a new [strategy](/docs/strategies) |
| 3 | Optimize Strategy | Create a new [study](/docs/studies) |
| 4 | Select Portfolios | The [portfolios dashboard](/docs/portfolios-dashboard) |
| 5 | Deploy to Live | [Portfolio Manager](/docs/portfolio-manager) |

Risk managers aren't part of this chain, and neither are fitness functions: you create those
from within the pages where you actually use them rather than from a dedicated step here. This
card is also where Fintela's guided tour starts for new users.

### Asset Exposure

A donut chart of what your **deployed** book actually holds, weighted by capital: a fast answer
to "what am I actually exposed to right now?"

A **Book** toggle switches the view between **All**, **Live**, and **Paper** trading. The center
of the ring shows your asset count; the legend below lists each asset's logo, code, name and
weight, folding anything past the top rows into "N other assets." Uninvested cash shows as its
own row whenever there's a meaningful amount sitting uninvested.

Weights combine each group's share of your deployed capital with that asset's weight inside the
group, and they're shown gross: a short position counts by its size, not its direction.
Hovering a slice or legend row shows the asset's weight, and: when a position is net short in
part of your book: the net figure alongside the gross one.

> [!IMPORTANT] The ring covers your 12 largest deployed groups
> If you have more than 12 deployed portfolio groups, the ring only reflects the 12 largest by
> capital, and the caption below it tells you what share of your deployed capital that covers. A
> group trading in both Live and Paper is counted in full under each view.

The Live/Paper/All toggle resets to All every time you reload: it isn't saved with your layout.

### Registries at a glance

Fintela groups your asset groups, strategies, studies and portfolios together as **registries**
see [registries](/docs/registries) if that term is new to you. Four small cards summarize them
here: each is a donut plus a shortcut into that part of the product.

| Card | Shows | Opens |
|---|---|---|
| Asset Groups | Used vs. unused asset groups | [Asset groups](/docs/asset-groups) |
| Strategies | Used vs. unused strategies | [Strategies](/docs/strategies) |
| Studies | Studies broken down by strategy, and how many are deployed | [Studies](/docs/studies) |
| Portfolios | Portfolios broken down by strategy | [Portfolios dashboard](/docs/portfolios-dashboard) |

"Used" means an asset group or strategy that actually appears in at least one of your studies:
not just something you created and set aside. Each card gives you a clear call to action if
you haven't created anything yet (for example, "No asset groups yet: an asset group defines the
universe a strategy trades").

The Studies and Portfolios rings break results down by strategy, with a legend so you can tell
one slice from another; strategies beyond the top six fold into an "other strategies" slice, and
any studies or portfolios that no longer trace back to a strategy show as "No strategy." A given
strategy keeps the same color in both rings, so you can cross reference them at a glance.

### Deployed Portfolios per Strategy

A horizontal bar for every strategy that currently has at least one deployed portfolio, showing
how many portfolios each strategy has working. Strategies with nothing deployed simply don't
appear on the chart: this card is about where your money actually is, not your whole catalog.

### Active Portfolio Group Performance

An equity/return line for every one of your actively trading portfolio groups, over a timeframe
you choose (4, 8, 12, or 26 weeks: 12 by default). This is the same view of book equity you'd
see on the Book Equity tab in [Portfolio Manager](/docs/portfolio-manager), so the two will
always tell the same story.

Your eight highest revenue groups each get their own color, matching their row in the results
table further down the page; everything past that renders as a faint background so the chart
stays readable even with dozens of groups. There's no benchmark line and no "created" markers
here: just your groups' own performance.

If every group is unchecked in the legend, the chart tells you so rather than showing a blank
pane. Your chosen timeframe resets to 12 weeks each time you reload.

### Most Traded Assets

A bar for every asset your deployed groups have traded, ranked by trade count rather than by
size or profitability: this card answers "what's actually keeping busy in my book," not "what's
my biggest position." Each bar also shows that asset's realized P&L as a share of your NAV, from
closed trades only; that figure is informational and doesn't affect the ranking.

> [!CAUTION] Only the top 50 assets are shown
> If you trade more than 50 distinct assets, the caption tells you how many exist in total.
> Don't read this list as your complete book. A dash in the P&L column means nothing has closed
> on that asset yet: not that it broke even.

## Opt in cards

The fifteen cards below are switched off by default; turn them on from **Show more cards**.

### Financial headline tiles

Six single number tiles, each with a label and one figure:

| Tile | Shows |
|---|---|
| AUM Change | How your assets under management have moved against a prior period |
| YTD Return | Year to date return as a share of AUM |
| Active Portfolio Groups | How many groups are actively trading, and how many are profitable |
| Win Rate | Your win rate across closed trades |
| Avg Sharpe Ratio | Average Sharpe ratio across groups with enough trading history to measure it |
| Monthly Turnover | Notional traded this month, as a share of AUM |

Where a tile shows a change, it's compared against last month, last quarter, or the prior year,
and it's labeled accordingly ("from last month," "vs last quarter," "YoY"). Watch the unit on
each change figure: a percent change ("+4.8%") is a relative move, while Win Rate moves in
**percentage points** ("+2.1pp"): a win rate going from 66.3% to 68.4% has risen 2.1 points,
which is a smaller move than "+2.1%" would imply. The arrow tells you the direction; don't rely
on color alone.

> [!WARNING] AUM Change currently always shows a dash
> There's no historical baseline to compare against yet, so this tile can't calculate a change
> today. Read the dash as "not measurable yet," not as zero movement.

### Catalog

A six row inventory of everything you've built, each row a shortcut into that part of the
product:

| Row | Shows | Opens |
|---|---|---|
| Asset Groups | Used / total asset groups | [Asset groups](/docs/asset-groups) |
| Strategies | Used / total strategies | [Strategies](/docs/strategies) |
| Fitness Functions | Used / total fitness functions | [Fitness functions](/docs/fitness-functions) |
| Studies | Total studies | [Studies](/docs/studies) |
| Risk Managers | Total risk managers | [Risk managers](/docs/risk-managers) |
| Portfolio Groups | Total portfolio groups | [Portfolio groups](/docs/portfolio-groups) |

### Hero KPI tiles

Four larger tiles:

| Tile | Shows |
|---|---|
| Portfolios | Your total number of portfolios |
| Live Portfolios | How many broker connections are currently trading, split between live and paper |
| Best OOS Sharpe | Your best out of sample Sharpe ratio among studies that pass the overfitting check, plus which study it belongs to |
| Healthy Portfolios | How many portfolios belong to a study that passes the overfitting check |

A study counts as **healthy** when its probability of backtest overfitting (PBO) is below 0.20:
a stricter bar than the platform's general overfitting threshold of 0.5, meant to surface studies
you can actively trust rather than merely ones that haven't been flagged as overfit. A study
whose PBO hasn't been measured yet doesn't count as healthy, and your organization's
administrators can adjust this threshold.

Best OOS Sharpe only looks within your top 500 globally ranked out of sample results, so if a
healthy study's best portfolio falls outside that range, this tile won't report anything for it
check [Studies](/docs/studies) directly in that case.

> [!NOTE] Live Portfolios counts broker connections, not portfolio group operations
> This tile is based on individual broker connections rather than the portfolio group operations
> you manage elsewhere on the platform, so the number here can occasionally read a little
> differently than what you see in [Portfolio Manager](/docs/portfolio-manager) or
> [Live Trading](/docs/live-trading).

### Usage tiles

| Tile | Shows |
|---|---|
| Compute Hours | Compute used over the trailing 30 days |
| Storage Used | Your current storage usage |

Compute Hours also shows how that compares with the previous 30-day period: that comparison is
shown in a neutral color, since using more or less compute isn't inherently good or bad. It's
simply left off the first time there's nothing to compare against yet.

> [!NOTE] The Compute Hours month label is always in English
> Even if you're using Fintela in Spanish or Portuguese, this label reads something like
> "Jul 2026."

See [tokens and billing](/docs/tokens-and-billing) for what actually consumes compute.

### Monthly Revenue Breakdown

Your month to date return, plus a bar list showing how that revenue splits across your strategy
types. Shares are calculated against your profitable strategies only, so a losing strategy
doesn't drag the chart's percentages down: it simply contributes nothing to the total.

### Active portfolio group results (results table)

A full results table, one row per actively trading portfolio group, sorted by rank with your top
three performers highlighted:

| Column | Shows |
|---|---|
| Portfolio Group | The group's name: click through to its detail view in [Portfolio Manager](/docs/portfolio-manager) |
| Strategies | Which strategies make up the group |
| Allocation | Share of your total deployed capital |
| Revenue Share | Share of total gross profit this group contributes |
| Return % | Return, signed |
| Sharpe | Risk adjusted return |
| Win Rate | Win rate on closed trades |
| Max Drawdown | Deepest peak to trough decline |
| Status | Where the group is trading |

Status reads **Paused**, **Paper Trading**, **Live Trading**, or **Paper + Live**: Paused takes
priority over the trading environment, and anything marked Live or Paper + Live means real money
is on the line. Every column is sortable; Max Drawdown sorts by depth, so ascending order puts
your worst drawdown first.

> [!IMPORTANT] A dash under Sharpe or Max Drawdown isn't zero
> Both figures need at least 20 separate days of trading history before Fintela can calculate
> them reliably. Until then, you'll see a dash rather than a number.

## Reading the financial figures

Every financial card on Home: the headline tiles, the results table, the performance chart, and
the exposure ring: is drawn from the same underlying numbers, so they can never disagree with
each other or describe a different slice of your book.

Three rules are worth keeping in mind whenever you're reading them:

**Everything is a rate, not a dollar amount.** YTD Return, month to date return, Monthly
Turnover, Allocation, Revenue Share and Return % are all expressed as a share of capital or of
profit: no dollar figure appears anywhere on Home.

**Every row is a portfolio group, not an individual portfolio.** Rankings, allocations and
status all group your results at the portfolio group level. A group counts as active as soon as
it has at least one operation that's actively or paused trading; draft and stopped operations
don't count.

**Paper trading is always disclosed.** Wherever you see a financial figure on Home, a small
"Paper trading" note appears unless every group contributing to that figure is trading on fully
live, funded accounts: even one simulated leg in the mix means the whole total is flagged as
simulated.

How the key figures are actually calculated:

| Figure | How it's calculated |
|---|---|
| Group AUM | Target capital across the group's active and paused trading operations |
| YTD Return | Year to date realized profit and loss divided by AUM (excluding trades affected by corporate actions) |
| Win Rate | Winning closed trades over all closed trades, year to date |
| Sharpe | Annualized from daily returns on the group's equity curve; not shown with fewer than 20 trading days of history, or with no variation in returns |
| Max Drawdown | The deepest peak to trough decline, shown as a negative number; not shown with fewer than 20 trading days of history |
| Monthly Turnover | Notional traded so far this calendar month, as a share of AUM |
| Allocation | A row's capital as a share of total deployed capital: the column always adds up to 100% |
| Revenue Share | A row's year to date revenue as a share of total positive revenue across all groups: losing groups can show a negative share |

> [!CAUTION] Your live trading and brokerage figures never reach Fintelligent
> These numbers come straight from your connected brokerage accounts: fills, positions,
> realized P&L. Fintela's policy keeps this data out of every AI assisted feature, so
> [Fintelligent](/docs/fintelligent) never sees it.

See [metrics reference](/docs/metrics-reference) for full definitions of every metric, and
[analyzing results](/docs/analyzing-results) for how to act on what you see here.

## What you'll see while data loads

Home has no single page wide error message: every card handles its own loading and empty state
independently, so even if something goes wrong, you'll see a dashboard of clearly empty cards
rather than a broken page.

A couple of things worth knowing:

- The Asset Exposure card hides its caption entirely while loading, so you won't briefly see a
  misleading "covering 0% of capital" message before the real data arrives.
- A book you've fully liquidated isn't treated as "empty." It correctly shows 0 assets and 100%
  cash, with the ring still drawing normally.

Each card that has nothing to show yet gives you a plain language reason: for example,
distinguishing "you haven't created any strategies yet" from "you have strategies, but none are
deployed."

## Keeping the data current

There's no manual refresh button on Home: every card updates itself automatically, each on a
schedule suited to how quickly that data actually changes:

| Data | Roughly how often it refreshes |
|---|---|
| Financial figures (headline tiles, results table, performance chart, exposure ring) | Every 5 minutes |
| Study progress | Every few seconds while a study is actively running, slowing down once everything has finished |
| Compute and storage usage | About once a minute |
| Live broker connection status | Every 5 to 10 seconds |
| Catalog counts, portfolios, and portfolio group data | About once a minute |
| Asset names | About once an hour |

Reloading the page always pulls everything fresh, regardless of these schedules. If you've just
made a change elsewhere and want to see it reflected on Home right away instead of waiting,
reloading is the fastest way.

## My workspace vs. Company workspace

Home respects the **My / Company** workspace toggle for some of its data, but not all of it:
worth understanding, since it's the most common source of confusion about the numbers you see
here.

| Data | Follows your My / Company toggle? |
|---|---|
| Studies, and everything built from them: study counts, deployment counts, overfitting health, Best OOS Sharpe, Healthy Portfolios | Yes |
| Asset groups, strategies, fitness functions, risk managers | No: always shown organization wide |
| Portfolio groups and every financial or broker figure | No: always shown organization wide |

The toggle defaults to **Company**.

> [!WARNING] In My mode, the Catalog card mixes two scopes
> The Catalog card always shows organization wide totals next to "used" counts that come from
> your studies only. A low used/total ratio while in My mode doesn't mean the rest of your
> organization isn't using those asset groups or strategies: it just means you personally
> haven't yet.

If your account doesn't have access to a particular area of the product, the related card simply
shows no data rather than an error message: that's expected behavior, not a sign that something
is broken.

## Guided tour

Home is where Fintela's welcome tour runs for new users. It's six steps and never leaves this
page: it opens centered on the page itself, walks through the Strategy Creation Workflow card,
and then points out the Registry and Analysis sections in the sidebar along with the help
control. The tour doesn't run on mobile, where the navigation is laid out differently: see
[navigation](/docs/navigation) for how the mobile experience works.
