---
title: Navigation
section: Platform Overview
sectionOrder: 2
order: 1
published: true
updated: 2026-09-01
summary: A map of the Fintela workspace — the sidebar, top bar, search, notifications, keyboard shortcuts, and how locked features and permissions work.
keywords: navigation, sidebar, top bar, search, keyboard shortcuts, notifications, help menu, account menu, locked features, permissions, mobile navigation, product tours
---

Every part of Fintela you use day to day — Home, your portfolios, Markets, the registries,
Fintelligent — lives inside one consistent workspace. This page is your map of it: what's in the
sidebar and where each entry takes you, how to search and use shortcuts to get around faster,
what the top bar controls do, a directory of every page you can reach, and how Fintela shows you
when a feature isn't included in your plan yet.

## Workspace layout

Once you learn the layout, it applies everywhere in the product:

- **Sidebar** (left) — jump between sections of the platform. On a desktop screen it starts out
  narrow, showing only icons, and expands to show labels when you move your pointer over it. Pin
  it open if you'd rather it stay expanded; either way, Fintela remembers your preference the
  next time you open the app on that device.
- **Top bar** (top) — always visible, holding your token balances, search, notifications, help
  and your account menu.
- **Main area** (centre) — whatever page you're currently on. It scrolls on its own, so the
  sidebar and top bar stay put while you read a long report or scroll through a table.

The pin control sits at the very bottom of the sidebar (desktop only). Its tooltip reads
**"Pin sidebar"** when the sidebar is set to auto-collapse, and **"Collapse sidebar"** once
you've pinned it open.

> [!NOTE] The sidebar doesn't appear on a phone
> On a phone or small tablet, Fintela replaces the sidebar entirely with a bottom navigation bar
> built for smaller screens, with its own set of shortcuts. See
> [Mobile navigation](#mobile-navigation).

## Sidebar

The sidebar has two visible sections — **Analysis** and **Registry** — plus a **More Options**
menu that holds a handful of further destinations you won't need every day. There's no separate
"AI" section: Fintelligent, your AI assistant, lives inside More Options.

Every entry is a real link, so you can open one in a new tab (middle-click, or Cmd/Ctrl-click)
just like any other link on the web. When the sidebar is collapsed to icons only, hovering an
icon shows its full label.

### Analysis section

| Entry | What it's for | Documentation |
|---|---|---|
| **Home** | Your starting point and daily overview | [Home](/docs/home) |
| **Portfolios** | Browse and open the portfolios and studies you're tracking | [Portfolios dashboard](/docs/portfolios-dashboard) |
| **Portfolio Manager** | Compare equity, metrics, holdings and trades across your whole book | [Portfolio Manager](/docs/portfolio-manager) |
| **Markets** | Market data, prices and research tools | [Market](/docs/market) |

> [!NOTE] Opening Fintela always takes you to Home
> If you bookmark Fintela's main address, or open the app fresh, you'll land on Home — treat it
> as your default starting point every session.

### Registry section

| Entry | What it's for | Documentation |
|---|---|---|
| **Asset Groups** | Define which tickers make up a group you can build strategies and portfolios from | [Asset groups](/docs/asset-groups) |
| **Strategies** | Where your trading strategies live — create, browse and edit them | [Strategies](/docs/strategies) |
| **Studies** | Every backtest you've run, ready to review or rerun | [Studies](/docs/studies) |
| **Portfolio Groups** | Assemble strategies into a portfolio group, rank them, and build the group you'll go on to monitor | [Portfolio groups](/docs/portfolio-groups) |

> [!CAUTION] Portfolio Manager and Portfolio Groups aren't the same thing
> **Portfolio Manager**, in the Analysis section, is where you monitor and compare portfolio
> groups you've already built — equity, metrics, holdings and trades across your whole book.
> **Portfolio Groups**, in the Registry section, is where you create and administer those groups
> in the first place. If an old link or saved page called "Portfolio Manager" now takes you
> somewhere unexpected, it's most likely pointing at the monitoring view described here.

### More Options menu

Below the Registry list sits a **"More Options"** row. Opening it shows a menu with a few more
destinations:

| Entry | What it's for | Documentation |
|---|---|---|
| **Fitness Functions** | Define how a strategy is scored during a backtest | [Fitness functions](/docs/fitness-functions) |
| **Risk Managers** | Rules that manage exposure and risk on a strategy or portfolio | [Risk managers](/docs/risk-managers) |
| **Promoted Portfolios** | Portfolios your organization has highlighted for wider visibility | [Promoted portfolios](/docs/promoted-portfolios) |
| **Data Explorer** | Browse the market data and datasets available to you (included with some plans) | [Data Explorer](/docs/data-explorer) |
| **Laboratory** | An interactive coding workspace for advanced research (included with some plans) | [Laboratory](/docs/laboratory) |
| **Fintelligent** | Your AI assistant — only appears here if your account has AI access | [Fintelligent](/docs/fintelligent) |

Fintelligent is the one entry that can disappear from the menu entirely: without AI access it
simply isn't shown. Every other entry is always listed, whether it's unlocked for you or not —
see [Locked features and permissions](#locked-features-and-permissions).

One more page isn't listed in this menu at all: the API overview, for connecting your own tools
and dashboards to your Fintela data. See [API overview](/docs/api-overview) if that's something
your plan includes.

### How the sidebar shows where you are

The sidebar highlights the section you're currently in. Home highlights only when you're exactly
on the Home page; every other entry stays highlighted as you move through its own sub-pages — so
opening one specific portfolio still keeps **Portfolios** highlighted, and reviewing a group's
trade history still keeps **Portfolio Manager** highlighted.

### Workspace switcher

Near the bottom of the sidebar, above the pin control, sits the workspace switcher. It controls
what your list pages — Asset Groups, Strategies, Studies and the rest — show you:

| Option | Shows |
|---|---|
| **{Your organization}'s Workspace** (default) | Everything your organization owns |
| **My Workspace** | Only the items you personally created |

Your choice is remembered on this device and won't reset on its own. Not every account has this
switcher — if you don't see it, your list pages always show everything your organization owns.

## Top bar

Always visible at the top of the screen, left to right:

| Element | What it does |
|---|---|
| Fintela Tokens | Your compute token balance — click to manage it. Turns red once you're at zero. |
| Fintela AI Tokens | Your AI token balance, used for Fintelligent — click to manage it. |
| Search | Opens quick search — see [Search and keyboard shortcuts](#search-and-keyboard-shortcuts). |
| Feedback | Opens a box to send feedback directly from wherever you are. |
| Notifications | See below. |
| Help | See below. |
| Your name and avatar | Opens the account menu. |

On a narrower screen, some of these condense down to icons only, but every control is still
reachable.

Right below the top bar, above the page itself, Fintela shows a banner when your token balance
needs attention. At zero compute tokens, a full-width alert reads **"Tokens depleted — compute is
paused (backtests, optimizations and daily updates). Daily updates resume automatically after a
purchase."** At a low balance, a dismissible message reads **"Token balance is running low."**
Both include a **"Buy tokens"** button. See [Tokens and billing](/docs/tokens-and-billing).

### Notifications

The bell shows how many notifications you have unread, up to 99 — beyond that it just reads
**99+**.

> [!NOTE] The unread count is always your own
> Even if you switch the panel to show your team's notifications, the number on the bell always
> reflects your own unread count, never your team's.

Opening the bell shows a scrolling panel:

| Panel element | What it shows |
|---|---|
| Scope toggle (Owner/Admin only) | **Mine** and **Team** |
| Empty state | **No new notifications** |
| Pagination | **Load more** |
| Footer action | **Mark all as read** |

The **Team** toggle only appears if your role gives you team-management permissions; everyone
else always sees just their own notifications.

Clicking a notification takes you straight to what it's about — a completed study opens its
results, a P&L alert opens that group's performance view in Portfolio Manager, a message from
Fintelligent opens that conversation. A few notification types don't have a specific destination;
clicking one of those just marks it read without navigating anywhere.

### Help menu

| Item | Opens |
|---|---|
| **Product tours** | The Tour Center, with every guided tour available at any time |
| **What's new** | A dialog listing recently introduced features, with a count badge |
| **Documentation** | This documentation site, in a new tab |

A small dot appears on the Help button whenever there's a feature introduction you haven't seen
yet.

### Account menu

Opening your avatar shows your identity plus a few actions, in this order:

| Section | Contents |
|---|---|
| Identity | Your name, your email, and your organization with your role in it |
| **Fintela API Key** | Your personal key for connecting your own tools and dashboards to Fintela — copy it from here. See [API overview](/docs/api-overview). |
| **Language** | English, Español, Português |
| Actions | Light mode / Dark mode toggle, then **Account settings** |

Only light and dark themes exist today — there's no "match my system" option.

> [!NOTE] Sign out isn't in this menu
> To sign out, go to Account settings — it lives there as its own action. See
> [Account setup](/docs/account-setup).

## Search and keyboard shortcuts

### Quick search

**Cmd/Ctrl + K** opens quick search from anywhere in Fintela. Results are grouped into five
categories, always in this order: **Pages**, **Studies**, **Strategies**, **Fitness**, **Asset
Groups**. The footer legend reads **↑ ↓ navigate**, **↵ open**, **Esc close**.

The built-in Pages results are:

| Page | Description |
|---|---|
| Overview | Analysis dashboard |
| Portfolios | Portfolio analysis |
| Portfolio Manager | Compare equity, metrics, holdings and trades across your portfolio groups |
| Markets | Market data and prices |
| Studies | Backtest study registry |
| Strategies | Strategy registry |
| Fitness | Fitness functions registry |
| Asset Groups | Ticker asset groups |

Searching "deployed," "live," "portfolio groups dashboard" or "baskets" also finds Portfolio
Manager — leftover muscle memory from its previous names still works.

With an empty search box, you'll see all the pages above plus your 5 most recent studies and your
3 most recent strategies, fitness functions and asset groups each — so your common destinations
are usually one click away without typing anything.

> [!NOTE] Not every result opens straight to the item
> Recent studies open directly to that study's results. Strategy, fitness function and asset
> group results currently open to their registry list rather than the specific item — from there
> it's one more click to what you're looking for.

Fintela is also testing an alternative, natural-language search bar with a small group of users.
If you don't see it, the search described above is what you'll use.

### Keyboard shortcuts

| Keys | Where | Effect |
|---|---|---|
| **Cmd/Ctrl + K** | anywhere | Open search |
| `↑` / `↓` | search results | Move the selection |
| `Enter` | search results | Open the highlighted result |
| `Esc` | search results | Close search |
| `Enter` or `Space` | a focused row in a list | Open that row |

If focus is on a control inside a row — a switch or a checkbox — pressing Enter or Space
activates that control instead of opening the row, same as anywhere else on the web.

> [!NOTE] That's the full list
> Fintela doesn't currently offer a shortcuts cheat sheet, additional navigation shortcuts, or
> the ability to customize your own key bindings.

## Page directory

Every page in Fintela has its own address, so you can bookmark a specific portfolio, study or
conversation and come straight back to it, or share it with a teammate.

### Before you sign in

| Page | What it does |
|---|---|
| Sign in | Takes you to Fintela's secure sign-in screen |
| Sign up | Takes you to registration |
| Terms and Conditions | Viewable without signing in |
| Privacy Notice | Viewable without signing in |

Once you're signed in, you're returned to whatever page you were headed to — or Home, by
default.

### Account and general pages

- Fintela's main address always takes you straight to Home.
- **Account settings** has direct links to jump straight to your Tokens or AI Tokens tab — the
  "Buy tokens" buttons elsewhere in the app use these.
- **Usage Dashboard** shows your organization's usage; it's scoped to your organization
  automatically, so there's nothing to select.
- Any address that doesn't match a real page shows a friendly **"Page not found"** screen with a
  **"Back to dashboard"** button — your sidebar and top bar stay right where they are.

### Registries

Asset Groups, Strategies, Studies, Fitness Functions, Risk Managers, Promoted Portfolios and
Laboratory all follow the same simple pattern: a list of everything you have, a page to view one
item, and a page to edit it — so once you know how one registry works, you know how they all
work. Laboratory is only available if it's included in your plan.

Strategies and Fitness Functions each also have a full-page sandbox, reached with the
**"Run a backtest"** action on a registry row — a workspace where you test a strategy or fitness
function, either starting fresh from a portfolio or with that registry item preselected.

Portfolio Groups has its own set of pages: the list of your groups, a **"Rank and Build"**
workspace for ranking and assembling a group (you can save and reopen this later as a saved
view), a structure page for reviewing one group's makeup, and pages for creating or editing a
group.

### Analysis area

Home, the Portfolios dashboard, a study's results, and each portfolio's own page — with tabs for
Performance (the default), Holdings, Transactions, Risk Analytics, Overfitting and Profile.
Markets and Data Explorer live here too, when your plan includes them.

Portfolio Manager has four book-level tabs — Equity (the default), Metrics, Holdings and Trades —
plus a matching set of tabs for each individual portfolio group: Profile, Equity, Metrics,
Holdings, Trades, Robustness, Ideas, News and Operations, so you can drill from your whole book
down into one group's detail.

### Fintelligent

A conversation list, a page for starting a new conversation, and a page for each past
conversation. There are two ways to reach Fintelligent: a floating chat launcher at the bottom of
most pages (desktop only), or its own full page under More Options → Fintelligent, where the
floating launcher is hidden because the whole page is the conversation. See
[Fintelligent capabilities](/docs/fintelligent-capabilities).

## Product tours

Ten guided tours ship with Fintela. All of them are reachable at any time from
**Help → Product tours**, which opens the Tour Center: **"Short guided walkthroughs. Take them
whenever you like — nothing here expires."** Each one offers **Start**, **Resume** or **Replay**,
with a status of **Not taken**, **In progress**, **Completed**, **Skipped** or **Closed**.

| Tour | Where it starts | Requires |
|---|---|---|
| **Getting around Fintela** | Home | — |
| **Studies** | Studies registry | — |
| **Strategies** | Strategies registry | — |
| **Asset Groups** | Asset Groups registry | — |
| **Markets** | Markets, Markets Pulse | Markets included in your plan |
| **Screener** | Markets Screener | Markets included in your plan |
| **News** | Markets ticker view | Markets included in your plan |
| **Portfolios** | Portfolios dashboard and detail | — |
| **Portfolio Manager** | Portfolio Manager section and group views | — |
| **Laboratory** | Laboratory | Laboratory included in your plan |

Tours are available on desktop only — the mobile layout is different enough that a desktop tour's
steps wouldn't line up with what's on screen there.

A tour waits a moment after you land on a page before offering itself, and never appears while
another dialog is open — so it stays out of the way of things like a welcome screen. Step
controls are **Next**, **Back**, **Skip tour**, **Done**, **Close** and **Learn more**.

**Help → What's new** lists features introduced since you last checked, each with a **Show me**
button; when there's nothing new, it reads **"You're up to date."**

Your preferences for tours live on the Account page, in a **Product tours** card: a
**"Don't show tours automatically"** switch, and a **"Reset all tours"** button. Resetting your
progress doesn't turn automatic tours back on if you've muted them — that's a separate switch.

## Mobile navigation

On a phone or small tablet, the sidebar is replaced by a bottom navigation bar built specifically
for mobile — a task-oriented Analyze/Create grouping that's deliberately different from the
sidebar, exposing only the destinations most people need on the go.

| Button | Takes you to |
|---|---|
| **Home** | Home |
| **Analyze** | Opens the Analyze menu |
| **Create** | Opens the Create menu |
| **Organization** | Account settings — shown only if you have user-management permissions |
| **Fintelligent** | Toggles the chat panel |

The **Analyze** menu:

| Item | Requires |
|---|---|
| Portfolios | — |
| Markets | Included in your plan |

The **Create** menu:

- Asset Groups
- Fitness Functions
- Strategies
- Studies

A locked item still shows a small lock icon and still opens — you'll land on the same locked
preview described in [Locked features and permissions](#locked-features-and-permissions). The
Fintelligent button carries a dot badge while one of your AI conversations has a run in progress
— amber if it's waiting on you, otherwise your theme's accent colour.

Risk Managers, Portfolio Groups, Promoted Portfolios, Data Explorer and Laboratory don't have a
dedicated button on mobile. You can still reach them from a shared link or a notification — there
just isn't a shortcut to them in the bottom bar.

## Locked features and permissions

Two separate things decide what you can do in Fintela: which features are included in your plan,
and what your role allows within your organization.

### Locked features

Locking is about your plan, not about who you are on your team — everyone in your organization
sees the same features unlocked or locked. Nine areas can be locked:

| Feature | What it covers |
|---|---|
| Markets | Market data and pricing in the Markets tab |
| Data Explorer | Browsing the datasets available to you |
| Laboratory | Interactive coding sessions, billed by the minute |
| Developer API | Generating and rotating your personal API key |
| Live trading | Connecting a broker, and creating and launching live trading operations |
| Seed export | Exporting portfolio and basket holdings and order intents |
| AI ideas | AI-generated context and portfolio idea suggestions |
| Daily updates | Automatic daily recalculation of your portfolios |
| Bulk studies | Running many studies at once, and bulk risk-manager optimization |

Four of these lock an entire page — Markets, Data Explorer, Laboratory and the API overview. The
rest only lock specific actions inside pages you can otherwise still open. See
[Live trading](/docs/live-trading) for more on connecting a broker.

Your organization's plan can change at any time, and a newly unlocked feature is typically
available within about a minute — no need to sign out or refresh.

> [!IMPORTANT] Locked doesn't mean hidden
> A locked feature still shows up in your sidebar, and clicking it still opens the page. What
> you'll see is a preview: the layout is there, blurred, with no real data loaded, and a panel
> reading **"Feature locked"** / **"Buy tokens to unlock this feature."**, with a **"Buy tokens"**
> button and a note that **"This is a preview — your real data appears once unlocked."**

Locked entries in the sidebar carry a small lock icon and a **"Locked — buy tokens to unlock"**
tooltip. Search results and Fintelligent will still take you to a locked feature if you ask for
it by name — you'll just land on the same preview.

This protection isn't only visual — Fintela checks on its side too, so a locked feature can't
actually be used even if you get past the preview screen. You'll only see an interruption when
you actively try to do something the feature requires, like saving or running something; quietly
browsing a locked page doesn't pop up a message.

### Plan limits (quotas)

Separate from locked features, some things are capped by how many you're allowed to have at once
— for example, the number of strategies your plan permits. Trying to create one more than your
limit shows **"You've reached your plan limit,"** along with the reassurance that **"Your
existing {resource} keep working normally,"** and a reminder that **"You can also delete one to
make room."**

> [!NOTE] Limits only apply when you create something new
> Reading, editing, stopping or deleting something you already have is never blocked by a limit —
> a limit can never trap you inside a position you're already holding, and moving to a smaller
> plan never deletes anything you already own. See
> [Tokens and billing](/docs/tokens-and-billing) for current plan tiers and numbers.

### Team roles and permissions

Separate from plan-based locks, your role within your organization controls a small number of
things:

| Your role | What it opens |
|---|---|
| AI access granted | The **Fintelligent** entry in More Options |
| Owner, Admin, or user-management permission | The **Organization** button in the mobile bottom bar |
| Owner, Admin, Manager, Analyst, or user-management permission | The notifications **Team** scope toggle |

Your role is also shown on the Account page and the usage dashboard as Owner, Admin, Manager or
Analyst, based on your position in your organization's structure. That display can occasionally
differ slightly from the permissions used for navigation — when it does, Fintela always falls
back to the more restrictive option rather than granting extra access, which is why the
notifications Team toggle quietly shows you your own notifications instead of erroring if you
don't have access.

## Renamed features and old links

If you have an old bookmark, saved link, or notification from before a feature was renamed or
moved, don't worry — Fintela takes you to the current version automatically.

| You might know it as | It's now called |
|---|---|
| Deployed Portfolios, Portfolio Groups Dashboard | **Portfolio Manager** |
| Data Clusters | **Asset Groups** |
| Data Pipelines | Retired — see below |
| FintelAI | **Fintelligent** |

> [!CAUTION] Data Pipelines is retired, not renamed
> An old Data Pipelines link now opens Data Explorer, but the feature itself no longer exists as
> a separate destination — a strategy now selects its own data sources directly inside its
> editor. Data Explorer is where you go to browse what each data source actually contains.

A handful of old tab names on Portfolio Manager and portfolio pages — like "Overview," "Exposure"
or "Transactions" — have also been renamed; any old link using one of them opens its current
equivalent automatically.

> [!WARNING] One old link shape doesn't redirect correctly
> A very old style of saved-view link, from before the Portfolio Groups redesign, may not resolve
> correctly and can land you on an unrelated group's page instead. If an old bookmark like that
> stops making sense, open [Portfolio groups](/docs/portfolio-groups) fresh and re-open your
> saved view from there.
