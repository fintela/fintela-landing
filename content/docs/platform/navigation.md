---
title: Navigation
section: Platform Overview
sectionOrder: 2
order: 1
published: true
updated: 2026-08-20
summary: The Fintela UI map — sidebar sections, every route, the command palette, notifications, and how access gating actually works.
keywords: navigation, sidebar, ui, routes, more options, command palette, shortcuts, notifications, entitlements, locked, mobile
---

Fintela is a single-page app behind one login. Everything except the login, signup and legal
pages lives inside one shell: a floating sidebar rail on the left, a fixed top bar across the
top, and the current page in the middle. This page is the map — every sidebar entry and where
it goes, every route the router mounts, the palette and shortcuts that reach them faster, and
the two mechanisms that decide what you can actually open.

## Shell layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│  ▸ tokens · AI tokens        [ Search…  ⌘K ]     💬  🔔  ?  You  ◉   │  AppHeader (fixed, 56px)
├────────┬─────────────────────────────────────────────────────────────┤
│ Fintela│  token banners (only when your balance is low or zero)      │
│ ───────│ ─────────────────────────────────────────────────────────── │
│ANALYSIS│                                                             │
│  Home  │                                                             │
│Portfoli│                  the routed page                            │
│Portf.Mg│                  (scrolls independently)                    │
│ Markets│                                                             │
│REGISTRY│                                                             │
│ Asset G│                                                             │
│ Strateg│                                                             │
│ Studies│                                                             │
│ Portf.G│                                                             │
│ ───────│                                                             │
│ ⋮ More │                                                             │
│        │                    ╭───────────────╮                        │
│ ───────│                    │  Fintelligent │  ← launcher (desktop)  │
│Workspac│                    ╰───────────────╯                        │
│    ⇥pin│                                                             │
└────────┴─────────────────────────────────────────────────────────────┘
```

The rail is a floating card, not an edge-glued panel: it is **64 px** collapsed, **220 px**
expanded, with a **12 px** gutter on every side. On desktop it expands when you move the
pointer over it and collapses when you leave, unless you pin it. The pin state persists in
`localStorage` under `fintela:drawer-pinned` (`'1'` or `'0'`).

The pin toggle sits at the very bottom of the rail, desktop only. Its tooltip reads
**"Pin sidebar"** when unpinned and **"Collapse sidebar"** when pinned.

> [!NOTE] The sidebar does not exist on mobile
> Below the `md` breakpoint the shell does not render the rail at all — not collapsed, not
> as a slide-over. Phones and small tablets get a completely separate bottom bar with its
> own information architecture. See [Mobile bottom navigation](#mobile-bottom-navigation).

## Sidebar

The sidebar has **two visible sections** — `Analysis` and `Registry` — plus a **More Options**
flyout that holds six more destinations. There is no AI section; Fintelligent moved into the
flyout.

Every entry renders as a real link with an `href`, so Cmd-click, middle-click and "open in new tab"
all work. When the rail is collapsed, each entry's label becomes a tooltip on hover.

### Analysis section

| Label | Route | Documentation |
|---|---|---|
| **Home** | `/analysis` | [Home](/docs/home) |
| **Portfolios** | `/analysis/portfolios` | [Portfolios dashboard](/docs/portfolios-dashboard) |
| **Portfolio Manager** | `/analysis/portfolio-manager` | [Portfolio Manager](/docs/portfolio-manager) |
| **Markets** | `/analysis/markets` | [Market](/docs/market) |

> [!WARNING] Home is `/analysis`, not `/`
> The root path is an immediate redirect to the first Analysis feature, which is Home. A
> bookmark on `/` lands on `/analysis`.

### Registry section

| Label | Route | Documentation |
|---|---|---|
| **Asset Groups** | `/asset-groups` | [Asset groups](/docs/asset-groups) |
| **Strategies** | `/strategy` | [Strategies](/docs/strategies) |
| **Studies** | `/studies` | [Studies](/docs/studies) |
| **Portfolio Groups** | `/analysis/portfolio-groups` | [Portfolio groups](/docs/portfolio-groups) |

> [!CAUTION] Two similarly named sections, two different jobs
> **Portfolio Manager** (`/analysis/portfolio-manager`, Analysis section, rocket icon) is
> comparative monitoring across your whole book. **Portfolio Groups**
> (`/analysis/portfolio-groups`, Registry section) is the administrative registry and creation
> wizard. Portfolio Manager took over the `/analysis/portfolio-manager` URL that the
> administrative pages used to own, so older material is likely to have them crossed.

### More Options flyout

The trigger row sits under the Registry list, labelled **"More Options"** with a right-pointing
chevron. It opens a menu to the right of the rail — not an inline expansion — and holds the
rail open while it is showing. The order below is the flyout's own render order, not the
sidebar `order` values.

| # | Label | Route | Gate | Documentation |
|---|---|---|---|---|
| 1 | **Fitness Functions** | `/fitness` | — | [Fitness functions](/docs/fitness-functions) |
| 2 | **Risk Managers** | `/risk-managers` | — | [Risk managers](/docs/risk-managers) |
| 3 | **Promoted Portfolios** | `/promoted-portfolios` | — | [Promoted portfolios](/docs/promoted-portfolios) |
| 4 | **Data Explorer** | `/analysis/data-explorer` | entitlement `data_explorer` | [Data Explorer](/docs/data-explorer) |
| 5 | **Laboratory** | `/laboratory` | entitlement `laboratory` | [Laboratory](/docs/laboratory) |
| 6 | **Fintelligent** | `/ai/fintelai` | JWT role `fintela-ai:read` or `root:all` | [Fintelligent](/docs/fintelligent) |

Fintelligent is the only entry in the whole sidebar that can disappear: without the AI role it
is filtered out of the flyout entirely. Everything else is always listed, locked or not.

One route is mounted but never listed anywhere in the sidebar: **API Docs** at `/developer`,
which is marked `hidden` in the feature manifest. Nothing in the shipped UI links to it, so it is
reachable by URL only. See [API overview](/docs/api-overview).

### Active-entry rule

The Home entry highlights only on an exact `/analysis` match. Every other entry highlights when
the current path *starts with* its route. So `/analysis/portfolios/abc` lights up Portfolios but
not Home, and `/analysis/portfolio-manager/:basketId/trades` lights up Portfolio Manager.

### Workspace switcher

Above the pin toggle, in the rail footer, sits the workspace switcher. It scopes what entity
list pages show. Two entries, in this order:

| Menu entry | Mode | What it shows |
|---|---|---|
| **{organization}'s Workspace** | `company` | everything the organization owns (the default) |
| **My Workspace** | `my` | only the items you created |

`{organization}` is your organization's name, derived from your Keycloak group path; it falls
back to **Unassigned** when there is none.

The choice persists in `localStorage` under `fintela.workspace.mode`, versioned by
`fintela.workspace.mode.version`. The current version is **2** and the default is `company`.
Users migrated from version 1 who had chosen `my` are reset to `company` once, and the shell
shows a one-off snackbar for eight seconds reading **"Default view switched to Company
Workspace. Change it anytime in the sidebar."**

The switcher is behind the `workspaces` feature flag, which defaults to on. With the flag off
the row renders nothing.

## Top bar

The header is fixed, 56 px tall, and slides its left edge to match the rail's width. Contents,
left to right:

| Element | Behaviour |
|---|---|
| Fintela Tokens chip | Tooltip **"Fintela Tokens — click to manage"**; links to `/account?section=tokens`. Turns red and filled at zero. Hidden below the `sm` breakpoint. |
| Fintela AI Tokens chip | Tooltip **"Fintela AI Tokens — click to manage"**; links to `/account?section=ai-tokens`. Also hidden below `sm`. |
| Search trigger | Desktop: a 400 px-wide bordered box reading **"Search..."** with a `⌘K` key badge. Mobile: a search icon with tooltip **"Search (Ctrl+K)"**. |
| Feedback bubble | Opens the comment box. Visible on every breakpoint — it is the only entry point. |
| Notifications bell | See below. |
| Help menu | See below. |
| Your name | From your profile; hidden below `sm`. |
| Avatar | Opens the account menu. Carries a small organization-logo badge when your org has one. |

The header also has a hamburger button in its markup, but it is rendered with `display: none`
and its handler does nothing. It is not a way to open anything.

Directly beneath the header, above the page, the shell renders token banners. At a zero compute
balance a full-width red alert reads **"Tokens depleted — compute is paused (backtests,
optimizations and daily updates). Daily updates resume automatically after a purchase."**; on a
low balance a dismissible bottom-centre snackbar reads **"Token balance is running low."** Both
carry a **"Buy tokens"** action pointing at `/account?section=tokens`. See
[Tokens and billing](/docs/tokens-and-billing).

### Notifications

The bell's tooltip is **"Notifications"** and its accessible label is
**"Notifications ({{count}} unread)"**. The count badge caps at **99**.

> [!NOTE] The badge only ever counts your own
> The unread badge is always computed for scope `mine`, never `team`, whatever scope the open
> panel is showing.

The panel is 380 px wide with a 380 px scrolling list.

| Panel element | Copy |
|---|---|
| Title | **Notifications** |
| Scope toggles (Owner/Admin only) | **Mine** and **Team** |
| Empty state | **No new notifications** |
| Pagination | **Load more** / **Loading…** |
| Footer action | **Mark all as read** |

The **Team** toggle appears only for users the workspace role guard accepts — any of the JWT
client roles `users:manage`, `root:all`, `Owner` or `Admin`. The selected scope is taken from what
the server actually applied, not what the client asked for: the backend decides from its own
stored role, and a request for `team` from someone not entitled to it is silently downgraded to
`mine` rather than refused, so the toggle corrects itself.

Rows deep-link where the event happened — a completed study to its analysis page, a P&L event to
that group's equity tab in Portfolio Manager, an agent event to its conversation. Rows whose
kind has no destination are still clickable to clear, but do not navigate.

### Help menu

| Item | Opens |
|---|---|
| **Product tours** | the Tour Center |
| **What's new** | the What's new dialog, with a count badge |
| **Documentation** | this documentation site, in a new tab |

A dot appears on the Help button itself whenever there is a feature introduction you have not
seen.

### Account menu

The avatar menu is identity plus four things, in this order:

| Section | Contents |
|---|---|
| Identity | Your name, your email, and your organization with its role path |
| **Fintela API Key** | Masked key with a copy button; the tooltip toggles **"Copy API key"** → **"Copied!"** |
| **Language** | **English**, **Español**, **Português** — endonyms, deliberately untranslated |
| Actions | **Light mode** / **Dark mode** toggle, then **Account settings** → `/account` |

Only two themes exist, dark and light. With nothing stored, the app honours a
`prefers-color-scheme: light` system setting and otherwise defaults to dark. There is no
"system" option in the menu.

> [!WARNING] Sign out is not in this menu
> Signing out lives on the Account page, in its own Actions card. See
> [Account setup](/docs/account-setup).

## Command palette and shortcuts

### The palette

**Cmd/Ctrl + K** opens the palette from anywhere in the shell. It is a filtered list over five
categories, in this fixed order: `Pages`, `Studies`, `Strategies`, `Fitness`, `Asset Groups`.
The input placeholder reads **"Search studies, strategies, fitness, asset groups..."** and the
footer legend reads **↑ ↓ navigate**, **↵ open**, **Esc close**.

The hardcoded Pages tier is:

| Entry | Description | Route |
|---|---|---|
| Overview | Analysis dashboard | `/analysis` |
| Portfolios | Portfolio analysis | `/analysis/portfolios` |
| Portfolio Manager | Compare equity, metrics, holdings and trades across your portfolio groups | `/analysis/portfolio-manager` |
| Markets | Market data and prices | `/analysis/markets` |
| Studies | Backtest study registry | `/studies` |
| Strategies | Strategy registry | `/strategy` |
| Fitness | Fitness functions registry | `/fitness` |
| Asset Groups | Ticker asset groups | `/asset-groups` |

The Portfolio Manager row also matches the retired names `deployed`, `portfolio groups
dashboard`, `baskets` and `live`, so old muscle memory still finds it.

With an empty query the palette shows all pages plus your last 5 studies and last 3 each of
strategies, fitness functions and asset groups. Study rows deep-link to
`/analysis/portfolios/study/:studyId`.

> [!NOTE] Strategy, fitness and asset-group hits open the registry, not the item
> Those three tiers link to their registry index — `/strategy`, `/fitness`, `/asset-groups` —
> not to a `view/:id`. Only study rows carry a per-item destination today.

The palette fetches nothing until you open it for the first time — its four registry queries stay
unmounted until then, so a session that never opens it costs no requests.

An alternative natural-language command bar exists behind the `commandSystem` feature flag,
which defaults to **off**. Unless you have explicitly enabled it with `?ff_commandSystem=1`,
the palette described above is what you get.

### Keyboard shortcuts

Only these bindings exist.

| Keys | Where | Effect |
|---|---|---|
| **Cmd/Ctrl + K** | anywhere in the shell | open the palette |
| `↑` / `↓` | palette | move the selection |
| `Enter` | palette | open the highlighted result |
| `Esc` | palette | close |
| `Enter` or `Space` | a focused registry row | open that row |

Registry rows are ordinary tab stops: `Enter` and `Space` fire only when focus is on the row
itself, so pressing either on an inner control (a switch, a checkbox) triggers that control
instead.

> [!NOTE] There is no vi-style grid navigation and no cheat sheet
> A `j`/`k`/`g g`/`x`/`/` grid keyboard layer exists in the codebase as an unused hook — no
> registry wires it up, and its hint string is never rendered. There are also no leader keys,
> no `?` cheat sheet and no per-user keybindings.

## Route reference

Four routes are public. Everything else is nested under one protected route that renders the
shell; opening any of them while logged out sends you through `/login?returnTo=` plus the encoded path, and back
afterwards.

### Public routes

| Route | Page |
|---|---|
| `/login` | Hands straight over to Keycloak, then returns you to `returnTo` |
| `/signup` | Hands over to Keycloak registration |
| `/terms` | Terms and Conditions — renders without auth |
| `/privacy` | Privacy Notice — renders without auth |

The branded login and registration screens themselves are a Keycloak theme, not pages in this
app.

### Shell and account routes

| Route | Page |
|---|---|
| `/` | Redirects to `/analysis` |
| `/account` | Account. Accepts `?section=tokens` and `?section=ai-tokens` deep links |
| `/account/usage-dashboard` | Fintela Usage Dashboard. Your organization comes from the token — there is no `:orgId` parameter |
| `*` | 404 rendered inside the shell, with the nav chrome intact |

The 404 page reads **"Page not found"** / **"The page you’re looking for doesn’t exist or may
have moved."** with a **"Back to dashboard"** button.

### Registry routes

Each simple registry feature mounts three paths — the index, `view/:id` and `edit/:id` — all
rendering the same page, which reads its mode from the URL.

| Base route | Also mounts | Sidebar entry |
|---|---|---|
| `/asset-groups` | `view/:id`, `edit/:id` | Asset Groups |
| `/strategy` | `view/:id`, `edit/:id` | Strategies |
| `/studies` | `view/:id`, `edit/:id` | Studies |
| `/fitness` | `view/:id`, `edit/:id` | Fitness Functions (More Options) |
| `/risk-managers` | `view/:id`, `edit/:id` | Risk Managers (More Options) |
| `/promoted-portfolios` | `view/:id`, `edit/:id` | Promoted Portfolios (More Options) |
| `/laboratory` | `view/:id`, `edit/:id` | Laboratory (More Options) — locked by `laboratory` |
| `/developer` | `view/:id`, `edit/:id` | none — hidden — locked by `developer_api` |

Two registries also have a full-page sandbox, reached from the **Run a backtest** action on a
registry row:

| Route | Page |
|---|---|
| `/strategy/sandbox` | Strategy sandbox, strategy derived from an origin portfolio |
| `/strategy/sandbox/:id` | Strategy sandbox with a registry strategy preselected |
| `/fitness/sandbox` | Fitness sandbox |
| `/fitness/sandbox/:id` | Fitness sandbox with a registry fitness function preselected |

Portfolio Groups is a nested feature and does not follow the `view`/`edit` convention:

| Route | Page |
|---|---|
| `/analysis/portfolio-groups` | Portfolio Groups |
| `/analysis/portfolio-groups/rank` | Rank and Build workspace |
| `/analysis/portfolio-groups/rank/:viewId` | Rank and Build with a saved View applied |
| `/analysis/portfolio-groups/baskets/:basketId` | Basket structure |
| `/analysis/portfolio-groups/groups/create` | Create a portfolio group |
| `/analysis/portfolio-groups/groups/:groupId/edit` | Edit a portfolio group |
| `/analysis/portfolio-groups/:viewId` | Saved-View deep link, kept for back-compatibility |

### Analysis routes

| Route | Page |
|---|---|
| `/analysis` | Home |
| `/analysis/portfolios` | Portfolios dashboard |
| `/analysis/portfolios/study/:studyId` | Study analysis |
| `/analysis/portfolios/:portfolioId` | Performance — the landing tab owns the bare route |
| `/analysis/portfolios/:portfolioId/holdings` | Holdings |
| `/analysis/portfolios/:portfolioId/transactions` | Transactions |
| `/analysis/portfolios/:portfolioId/risk` | Risk Analytics |
| `/analysis/portfolios/:portfolioId/overfitting` | Overfitting |
| `/analysis/portfolios/:portfolioId/profile` | Profile |
| `/analysis/markets` | Markets — locked by `markets` |
| `/analysis/data-explorer` | Data Explorer — locked by `data_explorer` |

Portfolio Manager has four book-level tabs and a set of per-group sub-views. Equity is the
landing tab and owns the bare route.

| Route | Page |
|---|---|
| `/analysis/portfolio-manager` | Equity |
| `/analysis/portfolio-manager/metrics` | Metrics |
| `/analysis/portfolio-manager/holdings` | Holdings |
| `/analysis/portfolio-manager/trades` | Trades |
| `/analysis/portfolio-manager/:basketId` | Redirects to that group's Profile |
| `/analysis/portfolio-manager/:basketId/profile` | Group profile |
| `/analysis/portfolio-manager/:basketId/equity` | Group equity |
| `/analysis/portfolio-manager/:basketId/metrics` | Group metrics |
| `/analysis/portfolio-manager/:basketId/holdings` | Group holdings |
| `/analysis/portfolio-manager/:basketId/trades` | Group trades |
| `/analysis/portfolio-manager/:basketId/robustness` | Group robustness |
| `/analysis/portfolio-manager/:basketId/ideas` | Group ideas |
| `/analysis/portfolio-manager/:basketId/news` | Group news |
| `/analysis/portfolio-manager/:basketId/operations` | Group operations |

### Fintelligent routes

| Route | Page |
|---|---|
| `/ai/fintelai` | Conversation list |
| `/ai/fintelai/new` | New conversation |
| `/ai/fintelai/c/:conversationId` | An existing conversation |

Fintelligent has two homes. On every other page it is a floating panel, opened from a
desktop-only pill at the bottom centre labelled **"Fintelligent"** (tooltip **"Ask
Fintelligent"**). On `/ai/fintelai` and anything beneath it, the pill and the panel are both
suppressed — the page *is* the chat. See
[Fintelligent capabilities](/docs/fintelligent-capabilities).

## Product tours

Ten guided tours ship with the app. All of them are reachable at any time from
**Help → Product tours**, which opens the Tour Center: **"Short guided walkthroughs. Take them
whenever you like — nothing here expires."** Each row offers **Start**, **Resume** or **Replay**
and carries a status chip of **Not taken**, **In progress**, **Completed**, **Skipped** or
**Closed**.

| Tour | Where it arms | Requires |
|---|---|---|
| **Getting around Fintela** | Home | — |
| **Studies** | Studies registry | — |
| **Strategies** | Strategies registry | — |
| **Asset Groups** | Asset Groups registry | — |
| **Markets** | Markets, Markets Pulse | entitlement `markets` |
| **Screener** | Markets Screener | entitlement `markets` |
| **News** | Markets ticker view | entitlement `markets` |
| **Portfolios** | Portfolios dashboard and detail | — |
| **Portfolio Manager** | Portfolio Manager section and group views | — |
| **Laboratory** | Laboratory | entitlement `laboratory` |

Every tour is marked `mobile: 'skip'` — none of them run on a phone, because the mobile
information architecture is different enough that the steps would point at controls that are
not there.

A tour waits **900 ms** after you land on a surface before offering itself, and refuses to arm
while any modal dialog is open — which is what keeps it behind the consent dialog and the
organization-setup screen. Step controls are **Next**, **Back**, **Skip tour**, **Done**,
**Close** and **Learn more**.

**Help → What's new** lists features introduced since your baseline, each with a **Show me**
button; when there is nothing, it reads **"You're up to date."**

Preferences live on the Account page, in a **Product tours** card shown to every user: a
**"Don't show tours automatically"** switch and a **"Reset all tours"** button. Resetting
progress deliberately does not clear the mute.

## Mobile bottom navigation

Below the `md` breakpoint the sidebar is gone and a fixed 58 px bottom bar takes over. It is
**hand-maintained and deliberately different** — a task-oriented Analyze/Create grouping that
does not exist in the sidebar — and it exposes only a subset of destinations.

| Button | Target |
|---|---|
| **Home** | `/analysis` |
| **Analyze** | opens the Analyze menu |
| **Create** | opens the Create menu |
| **Organization** | `/organization`, which redirects to `/account`. Shown only with role `users:manage` or `root:all` |
| **Fintelligent** | toggles the chat panel |

The **Analyze** menu:

| Item | Route | Gate |
|---|---|---|
| Portfolios | `/analysis/portfolios` | — |
| Markets | `/analysis/markets` | entitlement `markets` |

The **Create** menu:

| Item | Route |
|---|---|
| Asset Groups | `/asset-groups` |
| Fitness Functions | `/fitness` |
| Strategies | `/strategy` |
| Studies | `/studies` |

Locked items show a small lock glyph and still navigate. The Fintelligent button carries a dot
badge while an agent run is live — amber when the run is waiting on you, otherwise the primary
colour.

Registries not in these two menus — Risk Managers, Portfolio Groups, Promoted Portfolios — and
the rest of More Options — Data Explorer, Laboratory — are reachable on mobile only by URL.

## How access gating works

Two mechanisms decide what you can open, and only two: **entitlement locks** and **JWT client
roles**.

### Entitlement locks

Locks are a packaging control, not a permission system. Nine feature keys exist:

| Key | What it gates |
|---|---|
| `markets` | the Markets tab's precomputed data |
| `data_explorer` | the Data Explorer terminal |
| `laboratory` | live kernel sessions, metered per minute |
| `developer_api` | issuing and rotating the developer API key |
| `broker_paper_trading` | connecting a broker, creating and launching operations |
| `seed_export` | portfolio and basket seed and order-intent extraction |
| `ai_ideas` | AI context packs and basket idea generation |
| `daily_updates` | recurring scheduled recompute |
| `bulk_studies` | bulk studies and risk-manager optimization |

Four of them attach to a navigable surface: `markets` (Markets), `data_explorer` (Data
Explorer), `laboratory` (Laboratory) and `developer_api` (API Docs). The other five gate
actions inside pages rather than the pages themselves.

Which keys are locked for your organization is not fixed in the app. It is one global policy
row, tunable by a single `UPDATE` that every replica picks up within about a minute and with no
deploy — the product currently ships with all nine locked. The live set for your organization is
whatever `GET /entitlements/me` reports:

```http
GET /entitlements/me
```

> [!IMPORTANT] Locked is not hidden
> A locked feature stays in the sidebar, still navigates, and still renders its page. What you
> get is a **blurred, `inert`, data-free preview**: the page's structure is drawn behind a blur,
> the whole subtree is removed from focus order and the accessibility tree, and it runs against
> a frozen query client so **no data is fetched at all**. Over the top sits a panel reading
> **"Feature locked"** / **"Buy tokens to unlock this feature."** with a **"Buy tokens"** button
> pointing at `/account?section=tokens`, and a footnote: **"This is a preview — your real data
> appears once unlocked."**

In the sidebar a locked entry gains the tooltip **"Locked — buy tokens to unlock"** in both rail
states, plus a small lock glyph trailing the label when the rail is expanded. Neither the command palette nor
Fintelligent's navigation consults the lock state at all — both go straight to the page and let
the overlay take over.

The overlay is a preview, not a guard. The backend enforces the same locks independently and
answers **HTTP 402** with a machine-readable body:

```json
{
  "error": "feature_locked",
  "feature": "markets",
  "message": "...",
  "upgrade": "purchase_tokens"
}
```

The HTTP client answers these 402s centrally, so an action fails the same way at every call site,
whether or not that call site handles it. Only writes raise a dialog: a `GET` or `HEAD` that 402s
is a background read of a locked surface and is left silent. The dialog quotes the backend's
`message` verbatim.

Quota errors are a separate case, because they have a second, free remedy:

```json
{
  "error": "quota_reached",
  "quota": "strategies",
  "used": 2,
  "limit": 2,
  "requested": 1,
  "message": "...",
  "upgrade": "purchase_tokens"
}
```

That one raises **"You've reached your plan limit"**, with the reassurance **"Your existing
{resource} keep working normally."** and **"You can also delete one to make room."**

> [!NOTE] Limits are read at creation only
> Nothing consults a limit on read, update, delete or stop. A lock can never trap you inside a
> live position, and falling back to the free tier deletes nothing. See
> [Tokens and billing](/docs/tokens-and-billing) for the tiers, the current numbers and how
> activation works.

### JWT client roles

The second mechanism reads client roles straight out of your access token, from
`resource_access['fintela-api'].roles`. In the shell they gate exactly three things:

| Role | What it opens |
|---|---|
| `fintela-ai:read` or `root:all` | the **Fintelligent** entry inside More Options |
| `users:manage` or `root:all` | the **Organization** button in the mobile bottom bar |
| `users:manage`, `root:all`, `Owner` or `Admin` | the notifications **Team** scope toggle |

A second, separate derivation reads `Owner` / `Admin` / `Manager` / `Analyst` from the deepest
Keycloak group path (`/Org/Role/…`). That one drives the Account page and the usage dashboard,
not navigation. It can legitimately disagree with the role the backend stores — the backend keeps
only the first segment of your first group — which is why the notifications Team scope downgrades
instead of erroring.

### What does not gate anything

> [!CAUTION] `feature.permission` is dead metadata
> Every feature in the manifest carries a `permission` string — `markets:read`, `studies:read`,
> `overview:read` and so on. **Nothing reads it.** The router mounts every route
> unconditionally and the sidebar never consults it. Several of those strings are not real
> Keycloak roles at all. Do not treat them as access control, and do not infer permissions from
> them.

Two guard components, `RoleGuard` and `PermissionGuard`, are defined and exported in the auth
folder and imported by nothing. They gate no route in the shipped app.

## Legacy redirects

These paths are **redirects only**. None of them is a live destination — each one rewrites to a
current route so old bookmarks, shared links and notification deep links keep resolving.

| Legacy path | Redirects to |
|---|---|
| `/organization` | `/account` |
| `/dataCluster/*` | `/asset-groups/*` — path tail and query preserved |
| `/data-pipelines/*` | `/analysis/data-explorer` |
| `/analysis/deployed-portfolios/*` | `/analysis/portfolio-manager/*` |
| `/analysis/portfolio-manager/rank` | `/analysis/portfolio-groups/rank` |
| `/analysis/portfolio-manager/rank/:viewId` | `/analysis/portfolio-groups/rank/:viewId` |
| `/analysis/portfolio-manager/baskets/:basketId` | `/analysis/portfolio-groups/baskets/:basketId` |
| `/analysis/portfolio-manager/groups/create` | `/analysis/portfolio-groups/groups/create` |
| `/analysis/portfolio-manager/groups/:groupId/edit` | `/analysis/portfolio-groups/groups/:groupId/edit` |
| `/analysis/portfolio-manager/equity` | `/analysis/portfolio-manager` |
| `/analysis/portfolio-manager/overview` | `/analysis/portfolio-manager` |
| `/analysis/portfolio-manager/live` | `/analysis/portfolio-manager` |
| `/analysis/portfolio-manager/backtest` | `/analysis/portfolio-manager` |
| `/analysis/portfolio-manager/exposure` | `/analysis/portfolio-manager/holdings` |
| `/analysis/portfolio-manager/:basketId/performance` | `/analysis/portfolio-manager/:basketId/equity` |
| `/analysis/portfolio-manager/:basketId/risk` | `/analysis/portfolio-manager/:basketId/equity` |
| `/analysis/portfolio-manager/:basketId/transactions` | `/analysis/portfolio-manager/:basketId/trades` |
| `/analysis/portfolios/:portfolioId/metrics` | `/analysis/portfolios/:portfolioId` (Performance) |
| `/analysis/portfolios/:portfolioId/equity` | `/analysis/portfolios/:portfolioId/risk` |
| `/analysis/portfolios/:portfolioId/risk-managers` | `/analysis/portfolios/:portfolioId/risk` |
| `/analysis/portfolios/:portfolioId/trades` | `/analysis/portfolios/:portfolioId/transactions` |
| `/analysis/portfolios/:portfolioId/orders` | `/analysis/portfolios/:portfolioId/transactions` |
| `/analysis/portfolios/:portfolioId/investor` | `/analysis/portfolios/:portfolioId/profile` |

Retired `?tab=` values on a Portfolio Manager group are translated on arrival: `results`,
`performance` and `risk` all resolve to `equity`, and `transactions` resolves to `trades`.

> [!CAUTION] Data Pipelines is retired, not moved
> `/data-pipelines/*` is a redirect to Data Explorer. The feature no longer exists — a strategy
> now selects its built-in data sources in its own editor. Data Explorer is where you browse
> what each source contains.

> [!WARNING] One legacy shape cannot be recovered
> The bare saved-View link `/analysis/portfolio-manager/:viewId` is gone. That URL shape is now
> read as a basket id, so an old saved-View bookmark of that form lands on a group detail page
> that does not exist rather than redirecting.

### Renames still visible in the product

| Old name | Current name | Where the old name survives |
|---|---|---|
| Deployed Portfolios, Portfolio Groups Dashboard | **Portfolio Manager** | palette search keywords; the `/analysis/deployed-portfolios` redirect |
| Data Clusters | **Asset Groups** | the `data_clusters` quota key and the `/dataCluster` redirect |
| FintelAI | **Fintelligent** | an unused key in the sidebar's icon map |
