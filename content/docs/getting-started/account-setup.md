---
title: Account setup
section: Getting Started
sectionOrder: 1
order: 4
published: true
updated: 2026-08-20
summary: Sign in, organizations and workspaces, roles, plan entitlements and API keys.
keywords: account, signup, login, keycloak, organization, workspace, roles, team, entitlements, plan, api key, consent
---

Everything between having no Fintela account and being able to work. Identity is Keycloak's job —
Fintela never sees a password — and the app itself adds exactly two first-run gates on top of it:
you must belong to an **organization**, and you must accept the legal documents. This page covers
both gates, the four roles an organization has and what each one can actually do, how team
management works, where your plan's locks come from, and where to find your API key.

## The path in

```text
  ┌ Keycloak ──────────────────────────────────────────────────┐
  │  /signup → register     /login → sign in     Google         │
  │  verify email · choose a password · set up two-step (TOTP)  │
  └────────────────────────────┬───────────────────────────────┘
                               ▼
              does the token carry a group like "/Org/Role"?
                    │                              │
                 no │                              │ yes
                    ▼                              ▼
        "Set up your organization"            the app shell
        (or wait for an invitation)                │
                    └───────────────┬──────────────┘
                                    ▼
                       "Before you continue"  ← consent gate
                                    ▼
                            /analysis  (Home)
```

The two gates are ordered, not simultaneous: organization setup replaces the entire shell, and the
consent dialog only mounts once you are inside it. Neither one can be skipped, and product tours
refuse to arm while either is on screen — see [Navigation](/docs/navigation).

## Signing up and signing in

### The two public entry points

Four routes render without authentication. Two of them are doors that hand straight over to
Keycloak; the branded login and registration screens are a Keycloak theme, not pages in the SPA.

| Route | What it does |
|---|---|
| `/login` | Calls `keycloak.login()` immediately. Paints nothing for the first **400 ms** — a normal redirect lands well inside that — then shows a Fintela logo and **"Taking you to sign in…"** if something is slow |
| `/signup` | Calls `keycloak.register()` immediately, returning to `/` afterwards. No interstitial |
| `/terms` | Terms and Conditions |
| `/privacy` | Privacy Notice |

Opening any protected route while signed out redirects to `/login?returnTo=` plus the encoded path,
and you land back on that path afterwards. `returnTo` is sanitised to an internal path before it is
used, so it cannot be pointed at another site. If you are already signed in, `/login` resolves the
deep link client-side with no Keycloak round trip.

When Keycloak itself cannot be reached, `/login` renders an error card titled **"We couldn't
connect to the login service"** with the body **"Something went wrong while starting your session.
Check your connection and try again."** and a **Retry** button.

### What Keycloak asks for

The sign-in screen takes a username or email plus a password, with a **Show password** reveal
toggle. Wrong credentials and unknown accounts return the same generic message on purpose —
distinguishing them would leak which addresses have accounts. Below the form, when the realm has an
identity provider configured, a divider and a provider button appear; the realm ships with
**Google** enabled, filtered on Google's own `email_verified` claim.

An **invited** account is created with three required actions stamped on it — **update password**,
**verify email** and **configure TOTP** — and the invitation link executes exactly those three. A
**self-registered** account picks its password on the registration form, so it is left with
**verify email** (the realm has `verifyEmail` on) and **configure TOTP**. TOTP is a realm-level
*default* action, which is why every account — self-signed up or invited — is asked to set up
two-step authentication on first use.

> [!IMPORTANT]
> Email verification is not cosmetic. `POST /register/org` refuses a token whose `email_verified`
> claim is not exactly `true`, with HTTP `403` and the message
> `Verify your email address before creating an organization.` An unverified account can sign in
> and get no further than the setup screen.

### Staying signed in

Once authenticated the SPA runs a refresh loop every **20 seconds**, calling `updateToken(30)` —
which only touches the network in the last ~30 seconds before the access token expires. A single
failure does **not** sign you out. The session ends only when Keycloak answers `invalid_grant` (the
refresh token is definitively gone) or after **5 consecutive failures**, roughly 100 seconds of
continuous failure.

### Signing out

Sign out is **not** in the avatar menu. It lives on the Account page in the **Actions** card, as a
single **Sign out** button, with this caption underneath:

> Signing out ends your Fintela session. If you signed in with Google, that Google session stays
> open on this device — Google provides no way for us to close it.

The organization setup screen carries its own **Sign out** link, so a user who has not yet joined
an organization is not trapped.

## Organizations and workspaces

An **organization** is the only tenancy boundary in Fintela. Every registry row, every portfolio,
both token ledgers and every entitlement decision are scoped to it. There is no privacy *within* an
organization: everything any member creates is readable by every other member. See
[Registries](/docs/registries).

Membership is expressed as a Keycloak group path of the form `/Organization/Role`. The organization
is the first segment; the role is the second. A token with no group at all is what triggers the
setup screen.

### Setting up an organization

A signed-in user with no groups gets a full-screen page titled **"Set up your organization"**,
described as *"Choose a unique name for your organization. Admin, Manager, Owner, and Analyst
workspaces will be created automatically."*

| Element | Behaviour |
|---|---|
| **Organization name** | Single text field, autofocused. Availability is checked against `GET /register/org/check` after a **500 ms** debounce, and only once the trimmed name is at least **2** characters |
| Helper text | **"Checking availability…"**, then **"Name is available"** or **"This name is already taken"** |
| **Create organization** | Enabled only while the name is confirmed available. Pressing `Enter` in the field submits |
| After submit | **"Setting up your organization…"** while the app forces a fresh Keycloak token and reloads the page |
| Failure | The backend's own message, or **"Something went wrong. Please try again."** |
| Footer | *"Were you invited to an existing organization? Ask your administrator to add your account — you will gain access automatically once assigned."* plus **Sign out** |

`POST /register/org` creates the top-level Keycloak group, creates four subgroups — **Admin**,
**Manager**, **Owner**, **Analyst** — maps the matching `fintela-api` client role onto each, and
puts you in **Owner**. The token refresh afterwards is what makes the new group visible; without it
the app would still see a group-less user.

| Refusal | Status | Message |
|---|---|---|
| You already belong to a group | `409` | `User already belongs to an organization` |
| The name is taken | `409` | `Organization name 'NAME' is already taken` |
| Your email is not verified | `403` | `Verify your email address before creating an organization.` |
| Too many creations from one address | `429` | `Too many organizations created from this network. Try again later.` |

The rate limit is **10 organizations per hour**, keyed on the first `X-Forwarded-For` hop and
falling back to your account when no address is available.

> [!NOTE] The organization row and the trial grant are created lazily
> The Keycloak group is created by the setup screen; the matching `developers.organizations` row is
> written on your **first authenticated API request**, and that is also when the one-time trial
> grant fires. The trial is one per human, not one per organization — a second organization created
> by the same person claims nothing. See [Tokens & Billing](/docs/tokens-and-billing).

### Joining an existing organization

There is no self-service join, no invite code and no domain-based auto-join. Someone who already
holds `users:manage` (or `root:all`) in the organization adds you from the Account page; you
receive an email with a one-time link and set your own password and two-step authentication from
it. Until then the setup screen is all you can reach, which is exactly what its footer note says.

### The workspace switcher

"Workspace" in the sidebar footer is a **view filter, not a tenancy boundary**. Two entries:
**{organization}'s Workspace** (mode `company`, the default) and **My Workspace** (mode `my`, only
rows you created). It narrows five registries — Asset Groups, Strategies, Studies, Fitness
Functions and Risk Managers — by sending `created_by=me`, and leaves Portfolio Groups and Promoted
Portfolios showing the whole organization. The choice is stored in `localStorage` under
`fintela.workspace.mode`. Full detail in [Navigation](/docs/navigation) and
[Registries](/docs/registries).

## Roles

### The four roles

Every organization is created with exactly four role subgroups. They are the only roles the invite
and change-role dialogs offer, and the Members table shows each member's subgroup name as their
role — or **Unassigned** for someone attached to the parent group with no role subgroup.

| Role | Keycloak description |
|---|---|
| **Owner** | Executive. View-only across all sections. |
| **Admin** | Full control. One role covers everything. |
| **Manager** | Ops control. Creates and runs studies, manages all assets. |
| **Analyst** | Research. Drafts data clusters, strategies and fitness. Read-only on studies and results. |

### What the client roles carry

Each subgroup maps to one composite client role on the `fintela-api` client. Those composites are
what actually appear in your access token under `resource_access['fintela-api'].roles`, and they
are the only role list anything in Fintela reads.

| Role | Composite | Granular roles it carries |
|---|---|---|
| **Owner** | `owner` | `root:all`, `fintela-ai:read`, `portfolios:read`, `study:read`, `strategy:read`, `fitness:read`, `data_cluster:read`, `risk_manager:read`, `risk_manager:create`, `risk_manager:update` |
| **Admin** | `admin` | `root:all`, `users:manage`, `users:view`, `users:query`, `broker_connection:manage`, `broker_tracking:read`, `broker_tracking:create`, `broker_tracking:update`, `broker_tracking:delete` |
| **Manager** | `manager` | `fintela-ai:read`, `portfolios:read`, `study:read`, `study:create`, `strategy:read`, `strategy:create`, `strategy:update`, `fitness:read`, `fitness:create`, `fitness:update`, `data_cluster:read`, `data_cluster:create`, `data_cluster:update`, `risk_manager:read`, `risk_manager:create`, `risk_manager:update` |
| **Analyst** | `analyst` | `portfolios:read`, `study:read`, `strategy:read`, `strategy:create`, `fitness:read`, `fitness:create`, `data_cluster:read`, `data_cluster:create`, `risk_manager:read`, `risk_manager:create`, `risk_manager:update` |

The Admin composite additionally carries four `ibkr_tracking:*` roles left over from an Interactive
Brokers integration that does not exist in the product — no route and no screen reads them. Alpaca
is the only broker; see [Live trading](/docs/live-trading).

Three consequences follow from that table and are worth stating outright:

- **`root:all` is a total bypass.** The backend's permission check returns success immediately for
  any token carrying it, so Owner and Admin pass every guard regardless of which granular roles
  their composite lists. That is why the Owner composite works despite reading, on paper, like a
  view-only role.
- **Every delete requires `root:all`.** Deleting an asset group, strategy, study, fitness function,
  risk manager or portfolio is guarded on `root:all`, not on a resource-specific role. Only Owner
  and Admin have it — a Manager can create and edit everything and delete nothing.
- **Analyst has no `fintela-ai:read`.** The **Fintelligent** entry is filtered out of the More
  Options flyout for Analysts. The gate is navigational only; see
  [Fintelligent](/docs/fintelligent).

### What the roles gate in the app

Two separate things read your role. The **granular client roles** above are what the API enforces.
Separately, the SPA parses `Owner` / `Admin` / `Manager` / `Analyst` out of your Keycloak group path
and uses it to decide which controls render enabled.

| Role | View | Edit | Create | Delete |
|---|---|---|---|---|
| Owner | yes | yes | yes | yes |
| Admin | yes | yes | yes | yes |
| Manager | yes | yes | yes | no |
| Analyst | yes | no | yes, except studies | no |
| Unresolved | yes | no | yes | no |

That matrix drives the row-action menus and the create buttons on four registries —
[asset groups](/docs/asset-groups), [strategies](/docs/strategies),
[fitness functions](/docs/fitness-functions) and [studies](/docs/studies). Studies are the
exception in the Analyst row: Analyst holds `view` only there, so **New Study**, **Launch**,
**Edit**, **Duplicate** and **Delete** are all disabled. When the group path does not resolve to a
known role, view and create are allowed and edit and delete are not.

Three shell surfaces are gated on the client roles directly rather than on the matrix:

| Surface | Roles accepted |
|---|---|
| **Fintelligent** entry in More Options | `fintela-ai:read` or `root:all` |
| **Organization** button in the mobile bottom bar | `users:manage` or `root:all` |
| Notifications **Team** scope toggle | `users:manage`, `root:all`, `Owner` or `Admin` |

### Three role derivations that can disagree

This is the single most confusing thing about Fintela's permissions, so it is worth spelling out.
The same person's role is computed three different ways, from three different places.

| Consumer | Source | Rule |
|---|---|---|
| API permission checks | JWT `resource_access['fintela-api'].roles` | Exact role string, with `root:all` bypassing everything |
| Account page, top bar, usage dashboard, registry row actions | Keycloak group paths in the profile | The **deepest** group path. The Account page and top bar print every segment after the first; the registry permission matrix reads only the **last** segment |
| Owner/admin checks inside the backend (branding, token analytics, usage dashboard, notifications **Team** scope) | `developers.users.role` | Second segment of your **first** group path, defaulting to `analyst`. Written on first sight of you and re-written whenever your organization, role or username changes |

For a user in exactly one group, `/Org/Role`, all three agree. For a user in nested or multiple
groups they can legitimately diverge — which is why the notifications **Team** scope silently
downgrades to `mine` rather than returning an error when the server disagrees with the client.

> [!CAUTION] `feature.permission` is not a permission
> Every feature in the SPA's manifest carries a `permission` string such as `markets:read` or
> `studies:read`. **Nothing reads it.** The router mounts every route unconditionally, and several
> of those strings are not real Keycloak roles at all. Two guard components, `RoleGuard` and
> `PermissionGuard`, are exported and imported by nothing. Do not infer access from any of it.

## Accepting the terms

The first time you enter the shell, a non-dismissible dialog blocks everything until you accept the
current legal documents. `Esc` does not close it and there is no cancel.

| Element | Copy |
|---|---|
| Title | **Before you continue** |
| Body | Please review and accept the documents that govern your use of Fintela to continue. |
| Links | **Terms and Conditions** → `/terms`, **Privacy Notice** → `/privacy` — both open in a new tab |
| Checkbox | I have read and accept the Terms and Conditions and the Privacy Notice. |
| Button | **Accept and continue** — disabled until the box is checked |
| Error | We couldn't record your acceptance. Please try again. |

Acceptance is recorded server-side against your account with the document version, a SHA-256 hash
of each document in the language you were actually shown, the timestamp, your IP and your user
agent. The version is the documents' own "Last updated" marker; bumping it re-prompts every user.
Recording is idempotent per (user, version), so a double click cannot write two records.

> [!NOTE] The gate fails open
> It opens only when the backend has **confirmed** that acceptance is missing. A failed or pending
> status check leaves the app usable rather than locking you out.

## The Account page

`/account` — reached from the avatar menu's **Account settings**, from either token chip, and from
the retired `/organization` path, which redirects here. `?section=tokens` and `?section=ai-tokens`
scroll straight to the matching card.

### Card layout

| Card | Who sees it | What it holds |
|---|---|---|
| **Profile** | everyone | Avatar with your initials, the organization logo and name (with an edit pencil for the Owner), then **Name**, **Email** and **Role** rows |
| **Organization Members** | Owner or Admin | Up to 5 members, **Manage members**, **+{{count}} more**, and — Owner only — a **Fintela Usage Dashboard** button |
| **Developer access** | everyone (in the Members slot for non-admins, on its own row for Owner and Admin) | Your API key, masked, with show and copy |
| **Broker connections** | everyone | Broker connections, trading limits and the kill switch. See [Live trading](/docs/live-trading) |
| **Tokens** | Owner or Admin | The **Fintela Tokens** and **Fintela AI Tokens** cards side by side; the purchase grid inside is Owner-only. See [Tokens & Billing](/docs/tokens-and-billing) |
| **Product tours** | everyone | A **Don't show tours automatically** switch and a **Reset all tours** button. See [Navigation](/docs/navigation) |
| **Actions** | everyone | **Sign out** and the Google-session caveat |

The **Role** row prints the role segments of your deepest group path, capitalised and joined with
` · `, or `—` when there are none. The avatar menu in the top bar prints the same path as
`{Organization} — {Role}`, but joins multiple role segments with ` - ` and falls back to
**Unassigned** when the path yields no organization.

> [!NOTE] There is no subscription anywhere on this page
> No plan picker, no seat count, no invoices, no billing portal. Tokens are the only billing
> method in the product, and the tier is derived from the ledgers rather than chosen.

### Managing members

**Manage members** opens a dialog titled **Organization Members** holding the full team table. The
card itself appears for the group-path roles Owner and Admin; the table inside renders only for a
token carrying `users:manage` or `root:all`, and the backend independently refuses every membership
route without one, with `403 Missing permission 'users:manage'`. Owner passes on `root:all` — the
`owner` composite does not carry `users:manage` itself.

The table has two columns, **Member** (name over email) and **Role** (a coloured chip), plus a
per-row action pair. Above it sit a **Refresh** icon and an **Add member** button; below it, a
`{{count}} members` caption.

| Control | What happens |
|---|---|
| **Add member** | Opens **Invite to {{org}}** — *"They will join {{org}} and see the organization's shared resources."* Fields: **First name**, **Last name**, **Email**, **Role** (default `Analyst`). All four are required. Submit reads **Add member**, then **Adding…**; success toasts **Member added** |
| **Change role** (pencil) | Opens **Change role** — *"Updating role for {{name}}"* with a role select. **Save** is disabled until the role actually changes; success toasts **Role updated.** |
| **Remove member** (bin) | Opens **Remove member?** — *"{{name}} will be permanently deleted from Keycloak and lose all access. This cannot be undone."* Confirm reads **Remove**, then **Removing…**; success toasts **User removed.** |
| Empty state | **No team members yet.** with an **Add the first member** button |
| Load failure | **Failed to load members.** with **Retry** |

The invite dialog states the credential model plainly, because it changed: *"We'll email them an
invitation. They'll set their own password and two-step authentication from there. You don't need
to create or send a password."* The account is created in Keycloak with **no credential at all**,
joined to the chosen role subgroup, and then sent a signed one-time link valid for **7 days**.

> [!WARNING] An invitation that cannot be emailed is rolled back
> The email send is the last step and it is fatal: if it fails, the half-created account is deleted
> and the API returns an error naming the likely cause — the realm having no SMTP server
> configured. If the cleanup also fails, the message names the orphaned address so an administrator
> can remove it by hand. You never end up with an account nobody can sign into.

Changing a role removes the user from every role subgroup in the organization and adds them to the
new one, so roles are exclusive by construction. Removing a member deletes their Keycloak account
outright — there is no deactivate, no archive and no undo.

### Where your API key lives

One long-lived key per `(user, organization)` pair, shown in three places, all read-only:

| Surface | Masking |
|---|---|
| Avatar menu → **Fintela API Key** | First 10 characters, 8 bullets, last 4. Copy button whose tooltip flips **"Copy API key"** → **"Copied!"** |
| Account page → **Developer access** | First 8 characters plus 20 bullets, with **Show** / **Hide** and **Copy** / **Copied!** |
| `/developer` | The **Your Fintela API Key** card — same mask as the avatar menu, with **Reveal full key** / **Hide key** and **Copy to clipboard** / **Copied!**. No sidebar entry and no in-app link — open the URL directly |

There is no create button, no revoke button and no rotate button anywhere in the product. The key
is fetched on every page load and re-revealed in full, so you cannot lose it by closing a dialog.
Minting a *first* key is gated on the `developer_api` entitlement, which ships locked — so a
never-activated organization sees `—` here rather than a key. Reading a key you already hold is
never gated. Full contract, including the format and how to send it, in
[Authentication & limits](/docs/api-authentication).

## Plans, entitlements and locks

### Tiers

There are exactly two tiers, `free` and `activated`, and no plan picker anywhere. The whole policy
is a single global row — one `UPDATE`, no deploy, propagated fleet-wide within about a minute. Under
the shipped predicate an organization is **activated** when it has at least one purchase on either
token ledger **and** still holds a positive balance in either currency, which means spending down
to zero re-locks it. Nothing is deleted when that happens: limits are read at create time only.

### Creation quotas

Eight counted resources have a free-tier cap, checked only when you create. The one that matters on
this page is the **`members`** quota, whose current limit is **1** — and the person who created the
organization already occupies it. A free-tier organization therefore cannot invite anybody:
pressing **Add member** returns HTTP `402` with `error: "quota_reached"` and `quota: "members"`,
and raises the dialog **"You've reached your plan limit"**. There is no members meter on the
Account page, so the cap is only visible at the moment it refuses you.

The other seven caps and their numbers are in [Tokens & Billing](/docs/tokens-and-billing).

> [!CAUTION] The member count never goes down
> The `members` quota counts active rows in the backend's `developers.users` table, and a row is written the first time
> a member makes an authenticated request. Nothing in the product ever deletes or deactivates one.
> Removing someone from the Members table deletes their Keycloak account and revokes their access
> immediately, but it does **not** free the quota slot they occupied. An invited member who never
> signs in, conversely, has no row and never counted.

### What a locked feature looks like

Nine feature keys exist and the product ships with **all nine locked** on the free tier. A lock is a
packaging control, not a permission: a locked feature keeps whatever navigation entry it had, still
navigates, and still renders — behind a blurred, `inert`, data-free preview with a **Feature locked** panel,
**"Buy tokens to unlock this feature."** and a **Buy tokens** button. The backend enforces the same
lock independently with HTTP `402` and `error: "feature_locked"`.

Four of the nine gate a page you can navigate to: `markets` ([Market](/docs/market)),
`data_explorer` ([Data Explorer](/docs/data-explorer)), `laboratory`
([Laboratory](/docs/laboratory)) and `developer_api` (the `/developer` page). The other five —
`broker_paper_trading`, `seed_export`, `ai_ideas`, `daily_updates`, `bulk_studies` — have no
navigation entry and surface as a 402 at the moment you attempt the action. Every string, every
key and the full 402 contract live in [Tokens & Billing](/docs/tokens-and-billing).

## Endpoints

These are app-backend routes, called by the SPA with your Keycloak session. They are **not** part of
the read-only Developer API on `developer.fintela.io` — for that, see
[API overview](/docs/api-overview).

```http
GET    /register/org/check?name=NAME
POST   /register/org
GET    /org/users
POST   /org/users
PUT    /org/users/{id}/role
DELETE /org/users/{id}
GET    /legal/consent
POST   /legal/consent
GET    /configuration
GET    /organizations/me/branding
PUT    /organizations/me/branding
GET    /organizations/me/logo
GET    /entitlements/me
```

| Endpoint | Access | Notes |
|---|---|---|
| `GET /register/org/check` | any authenticated user | `{ available: true \| false }`. Exact, case-sensitive match against top-level Keycloak groups |
| `POST /register/org` | any authenticated user with no group and a verified email | Body `{ name }`. Never gated by billing — tokens are the only billing method |
| `GET /org/users` | `users:manage` or `root:all` | Members of every role subgroup, plus direct members of the parent group with a null role |
| `POST /org/users` | `users:manage` or `root:all` | Body `{ email, first_name, last_name, role }`. Also subject to the `members` quota |
| `PUT /org/users/{id}/role` | `users:manage` or `root:all` | Body `{ role }`. Moves the user between subgroups |
| `DELETE /org/users/{id}` | `users:manage` or `root:all` | Verifies the user is in your organization first, then deletes them in Keycloak |
| `GET /legal/consent` | any authenticated user | `{ accepted, version }` |
| `POST /legal/consent` | any authenticated user | Body `{ language }` — `"en"` or `"es"`, anything else normalises to `"en"`. Works even before you have an organization |
| `GET /configuration` | any authenticated user | Returns your API key. Mints one only if none exists and `developer_api` is unlocked |
| `GET`/`PUT /organizations/me/branding` | read: any member; write: Owner only | `403 Only the organization owner can update branding`. PNG, JPEG or SVG, max 2 MB |
| `GET /organizations/me/logo` | any authenticated user | The stored logo bytes, fetched through the authenticated client |
| `GET /entitlements/me` | any authenticated user | Your tier, locks, quotas and ceilings |

`POST /configuration/api-key/rotate` is implemented and revokes every active key for your
`(user, organization)` pair before minting a fresh one, but **no screen in the app calls it**. See
[Authentication & limits](/docs/api-authentication).

Refusals here are `403` for a missing role, `409` for a conflict during organization creation, `429`
for the signup rate limit, and `402` — carrying a machine-readable `error` field — for an
entitlement lock or a quota. The 402 bodies are specified in
[Tokens & Billing](/docs/tokens-and-billing).

## Where to go next

| Read | For |
|---|---|
| [Core concepts](/docs/core-concepts) | The ten objects everything in the product is built from |
| [Quickstart](/docs/quickstart) | The shortest real path — one strategy, one study, one set of results |
| [Navigation](/docs/navigation) | The shell: sidebar, palette, notifications, and every route |
| [Tokens & Billing](/docs/tokens-and-billing) | What compute costs, the full quota table and the 402 contract |
| [Authentication & limits](/docs/api-authentication) | Using your API key against the read-only Developer API |
| [Live trading](/docs/live-trading) | Broker connections, trading limits and the kill switch |
