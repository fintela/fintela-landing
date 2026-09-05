---
title: Account setup
section: Getting Started
sectionOrder: 1
order: 4
published: true
updated: 2026-09-01
summary: Sign in, set up your organization, understand team roles and plan limits, and find your API key.
keywords: account, signup, login, organization, workspace, roles, team, entitlements, plan, api key, two step authentication, consent
---

Everything between having no Fintela account and being ready to work in the platform. Fintela
handles your sign in and identity for you (you never need to worry about how your password is
stored) and adds two simple checks the first time you arrive: you need to belong to an
**organization**, and you need to accept Fintela's legal terms. This page walks through both,
explains the four team roles and what each one can actually do, how to manage your team, where
your plan's limits come from, and where to find your API key.

## Getting from no account to a working session

Four things happen, in order, the first time you use Fintela:

1. You sign in, or create a new account.
2. You set up a brand new organization for your team, or wait to be added to one that already exists.
3. You accept Fintela's Terms and Conditions and Privacy Notice.
4. You land on your [Home](/docs/home) dashboard, ready to work.

These steps only happen once. After your account is set up, signing in takes you straight back
into the app: you won't see the organization setup screen or the terms dialog again, unless your
account genuinely still needs one of them, or Fintela updates its legal terms (which prompts
everyone again). Neither step can be skipped, and any in app product walkthroughs stay off screen until
both are done, see [Navigation](/docs/navigation).

## Signing up and signing in

### Getting to the sign in screen

From Fintela's site you can either sign in to an existing account or create a new one; both take
you to the same secure sign in screen. If you try to open a page inside the app while signed out,
Fintela remembers where you were headed and takes you straight there once you're signed in.

If the sign in service is briefly unavailable, you'll see a short message explaining that
something went wrong, with a **Retry** button: this is rare and usually resolves itself within a
few seconds.

### Creating your password and setting up two step authentication

The sign in screen asks for your email (or username) and password, with a **Show password**
toggle so you can check what you typed. If you get either one wrong, Fintela shows the same
generic error either way: it deliberately doesn't tell you whether the email or the password was
the problem, so nobody can use the sign in screen to check which email addresses have Fintela
accounts. You can also sign in with **Google**, when your organization has that turned on.

How your account starts depends on how you joined:

- **Invited by a teammate:** you'll set your password, verify your email, and set up two step
  authentication (an authenticator app code) the first time you open your invitation link.
- **Signed up yourself:** you choose your password on the sign up form, then verify your email and
  set up two step authentication the first time you sign in.

Either way, every Fintela account ends up with two step authentication turned on: you'll be asked
for a code any time you sign in from a new device or browser.

> [!IMPORTANT]
> You must verify your email before you can create an organization. If you skip it, you can still
> sign in, but you'll be stuck on the organization setup screen until you go verify your address.

### Staying signed in

Fintela keeps your session alive automatically while you're actively using the app, so you won't
be asked to sign in again every few minutes. A single hiccup in that background check won't sign
you out: only a longer stretch of connection trouble, or a genuinely expired session, will send
you back to the sign in screen.

### Signing out

**Sign out** isn't in the avatar menu: you'll find it on the **Account** page, in the
**Actions** card, as a single button. Next to it, a note explains: signing out ends your Fintela
session, but if you signed in with Google, your Google session on that device stays open:
Fintela has no way to close that for you.

If you haven't joined an organization yet, the setup screen has its own **Sign out** link, so
you're never stuck without a way out.

## Organizations and workspaces

Your **organization** is your team's shared space in Fintela. Every asset group, strategy, study,
portfolio, and both your token balances belong to the organization, not to any one person: anything
a teammate creates, everyone else in the organization can see and use. See
[Registries](/docs/registries) for how that shared data is organized.

Every account belongs to exactly one organization, and to one role within it, more on roles
below.

### Setting up your organization

If you sign in and don't belong to an organization yet, you'll see a full screen setup page asking
you to choose a name for it. As you type, Fintela checks whether the name is available and lets
you know: **"Checking availability…"**, then either **"Name is available"** or **"This name is
already taken."** Once the name is confirmed free, **Create organization** becomes clickable (or
just press Enter).

Creating the organization sets you up as its **Owner**, and automatically creates the other three
team roles: Admin, Manager, and Analyst, ready for you to invite people into. If something goes
wrong, you'll see either a specific explanation or a generic "please try again" message. A few
things can stop you from creating an organization:

- You already belong to one: one account can't create or belong to two organizations.
- The name you chose was just taken by someone else.
- Your email isn't verified yet (see above).
- Too many organizations were just created from your network; if this happens, wait a bit and
  try again.

> [!NOTE] Your free trial follows you, not your organization
> Your one time trial token grant belongs to you personally, and is issued the first time you
> actually start using Fintela after setup. If you ever create a second organization, it won't
> come with its own trial: the grant is one per person, not one per organization. See
> [Tokens & Billing](/docs/tokens-and-billing).

### Joining an existing organization

There's no self service way to join an organization, and no invite code to enter. Someone who
already has team management permissions in that organization (an Owner or Admin) needs to add
you from their Account page. You'll then get an email with a one time link, valid for 7 days,
where you set your own password and two step authentication. Until you're added, the setup screen
described above is all you'll see when you sign in.

### Switching between "my work" and the whole team

The sidebar has a workspace switcher with two options: **{Organization}'s Workspace**, showing
everything the whole team has created, and **My Workspace**, narrowed to just what you personally
created. It's a view filter, not a privacy setting: it only changes what's shown to you, not what
anyone else can see.

The filter applies to five registries: [Asset Groups](/docs/asset-groups),
[Strategies](/docs/strategies), Studies, [Fitness Functions](/docs/fitness-functions), and Risk
Managers. Portfolio Groups and Promoted Portfolios always show the whole organization's work,
regardless of which workspace you're in. See [Navigation](/docs/navigation) and
[Registries](/docs/registries) for more.

## Roles

### The four roles

Every organization comes with exactly four roles. They're the only options offered when you
invite someone or change a teammate's role, and the Members table shows each person's role, or
**Unassigned** for someone who hasn't been placed in one.

| Role | Best for |
|---|---|
| **Owner** | The person accountable for the organization overall, usually whoever created it, or a senior lead. |
| **Admin** | Whoever runs the platform day to day for the team, including managing who's on it. |
| **Manager** | The trader or PM running research and trading operations: creating and launching studies, managing assets. |
| **Analyst** | Researchers building and proposing ideas, asset groups, strategies, and fitness functions, for others to review and run. |

### What each role can actually do

| Role | View | Create | Edit | Delete |
|---|:---:|:---:|:---:|:---:|
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | No |
| Analyst | Yes | Yes, except studies | No | No |

That table covers [asset groups](/docs/asset-groups), [strategies](/docs/strategies),
[fitness functions](/docs/fitness-functions), and [studies](/docs/studies). Studies are where
Analyst is most restricted: an Analyst can see studies and their results, but can't launch, edit,
duplicate, or delete one.

A few things worth knowing:

- **Only Owner and Admin can delete anything**, in any registry. A Manager can create and edit
  freely but can't delete an asset group, strategy, study, fitness function, [risk
  manager](/docs/risk-managers), or portfolio: that always needs an Owner or Admin.
- **Only Owner and Admin can manage the team**: inviting people, changing roles, and removing
  members.
- **Only Owner can purchase tokens or change organization branding**: Admin has full operational
  control everywhere else, but those two things are Owner only.
- **Analysts don't have access to [Fintelligent](/docs/fintelligent)**, Fintela's AI assistant:
  it's hidden from their navigation entirely.

> [!TIP] Not sure what you're allowed to do?
> The role shown next to your name should always match what you can actually click on. If a
> control looks like it should be there but isn't (or the reverse), it's worth asking your
> organization's Owner or Admin to double check how you're set up, since role assignment is
> entirely in their hands.

## Accepting the terms

The first time you enter the app, a dialog blocks everything else until you accept Fintela's
current legal terms. You can't close it with Escape and there's no way to dismiss it without
responding.

| What you'll see | |
|---|---|
| Title | **Before you continue** |
| What it asks | To review and accept the documents that govern your use of Fintela |
| Links | **Terms and Conditions** and **Privacy Notice**, both opening in a new tab so you don't lose your place |
| Confirmation | A checkbox confirming you've read and accept both |
| Button | **Accept and continue**: stays disabled until you check the box |

Your acceptance is recorded against your account, along with which version of the documents you
agreed to. If Fintela updates its Terms or Privacy Notice later, everyone is prompted to accept
the new version the next time they sign in.

> [!NOTE]
> If Fintela can't confirm whether you've accepted the current terms (for example, because of a
> temporary connection issue), you won't be locked out. The dialog only appears once it's actually
> confirmed you haven't accepted yet.

## The Account page

Open your **Account** page from the avatar menu in the top right, under **Account settings**. It's
organized into cards, and not everyone sees every card:

| Card | Who sees it | What's there |
|---|---|---|
| **Profile** | Everyone | Your name, email, and role; your organization's logo and name (Owners can edit the logo) |
| **Organization Members** | Owner, Admin | A preview of your team, a **Manage members** button, and (for Owners) a link to the organization's usage dashboard |
| **Developer access** | Everyone | Your personal API key |
| **Broker connections** | Everyone | Your connected brokerage account, trading limits, and the kill switch, see [Live trading](/docs/live-trading) |
| **Tokens** | Owner, Admin | Your Fintela Tokens and Fintela AI Tokens balances; only Owners can purchase more, see [Tokens & Billing](/docs/tokens-and-billing) |
| **Product tours** | Everyone | Turn off automatic tours, or reset them to see them again, see [Navigation](/docs/navigation) |
| **Actions** | Everyone | Sign out |

> [!NOTE] There's no subscription page
> You won't find a plan picker, seat count, invoices, or a billing portal anywhere in Fintela.
> Tokens are the only thing you pay for, and your plan tier is simply based on whether you're
> currently holding a token balance, not something you choose from a menu.

### Managing your team

If you're an Owner or Admin, **Manage members** opens your full team list: everyone's name,
email, and role, with the ability to change or remove each person.

| Action | What happens |
|---|---|
| **Add member** | Enter their first name, last name, email, and pick a role (Analyst by default). They'll get an invitation email: no password to set up on your end. |
| **Change role** (pencil icon) | Pick a new role and save. This replaces their old role entirely: someone can only hold one role at a time. |
| **Remove member** (bin icon) | Confirms first, since it's permanent: the person's access is revoked and their account is deleted. There's no undo. |

When you invite someone, they get an email with a secure one time link. They set their own
password and two step authentication from it: you never need to create or share a password on
their behalf.

> [!WARNING]
> If Fintela can't send the invitation email for some reason, the invite is automatically rolled
> back rather than leaving a half created, unusable account behind. If this keeps happening,
> contact Fintela support.

### Where your API key lives

Your API key lets you (or your engineering team) securely pull your studies, portfolios, and
results into your own tools and dashboards, outside of Fintela. It's **read only**: it can view
your data, but it can never create, change, or delete anything in your account, even by accident.
See [Authentication & limits](/docs/api-authentication) for how to use it.

You'll find it, partially masked with a button to reveal and copy it, in three places: the avatar
menu, the **Developer access** card on this page, and a dedicated key page reachable by direct
link (it isn't in the sidebar, so ask your admin if you need the link).

There's currently no self service way to create a second key or rotate your existing one from
within the app; if you need your key regenerated, contact Fintela support. Your key doesn't
expire on its own, and viewing a key you already have is never restricted.

> [!NOTE]
> Generating your very first key requires the Developer API to be unlocked on your plan (see
> below). Until then, this section shows a placeholder instead of a key. Once you have a key,
> viewing it is always available, regardless of your plan.

## Plans, entitlements and limits

### Free vs. Activated

Fintela has two tiers: **Free** and **Activated**. There's no plan picker to choose between them.
Your organization becomes Activated automatically once it has bought and is still holding a
positive balance of either Fintela Tokens or Fintela AI Tokens. If your balance ever drops back to
zero, your organization returns to the Free tier automatically. Nothing you've already built gets
deleted when that happens: the limits below only apply to things you try to create *after*
dropping back to Free.

### Limits on what you can create

Several resources have a cap on the Free tier, checked whenever you try to create a new one. The
one to know about here: on the Free tier, your organization can have **only one member**: the
person who created the organization already fills that slot. That means a Free tier organization
can't invite any teammates at all; trying to shows a message that you've reached your plan's
limit. There's no running counter shown anywhere on the Account page, so this only becomes visible
the moment it actually stops you.

The other creation limits, and their current numbers, are in
[Tokens & Billing](/docs/tokens-and-billing).

> [!CAUTION] Removing someone doesn't free up a seat
> The member limit only ever grows: it doesn't shrink when someone leaves. Removing a teammate
> revokes their access immediately, but the seat they used still counts against your limit; it
> never comes back. (The one exception: someone you invited who never actually signed in was never
> counted in the first place.)

### Locked features

On the Free tier, several features are locked until you activate your plan. A locked feature still
shows up where you'd expect it: it just appears blurred and noninteractive, with a
**Feature locked** message and a **Buy tokens** button. Trying to use it any other way shows the
same "buy tokens to unlock this" message.

Four locked features have their own page you can still visit (just not use): [Market](/docs/market),
[Data Explorer](/docs/data-explorer), [Laboratory](/docs/laboratory), and the Developer API key
page. Five more don't have a dedicated page and instead prompt you the moment you try to use them:
paper trading through your broker, exporting seed data, AI generated ideas, daily automatic
updates, and running studies in bulk.

## Where to go next

| Read | For |
|---|---|
| [Core concepts](/docs/core-concepts) | The building blocks everything in Fintela is made from |
| [Quickstart](/docs/quickstart) | The shortest real path: one strategy, one study, one set of results |
| [Navigation](/docs/navigation) | The app shell: sidebar, search, notifications, and where everything lives |
| [Tokens & Billing](/docs/tokens-and-billing) | What usage costs, the full list of plan limits, and how token pricing works |
| [Authentication & limits](/docs/api-authentication) | Using your API key with the read only Developer API |
| [Live trading](/docs/live-trading) | Connecting a broker, trading limits, and the kill switch |
