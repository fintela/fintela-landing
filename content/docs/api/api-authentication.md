---
title: Authentication & limits
section: API Reference
sectionOrder: 10
order: 2
published: true
updated: 2026-09-01
summary: How to find your personal API key, connect it to your own tools, and the request limits that apply to your organization.
keywords: authentication, api key, personal access key, bearer token, read-only access, rate limit, integrations, dashboards
---

If you want to pull your studies, portfolios, or results out of Fintela and into your own tools,
spreadsheets, or dashboards, you do it with a personal API key. It's a single long lived key you
send with every request: there's no login flow, no expiring session, and nothing else to
configure. Fintela also applies a request limit per organization so that one integration can't
slow the platform down for everyone else on your team. This page covers where your key comes
from, how to use it safely, what it means when something goes wrong, and how the request limits
work in practice.

## Getting your API key

You don't create your API key through a dedicated "create key" button: it becomes available
automatically the first time you (or a tool acting on your behalf) look for it, as long as your
organization has API access turned on. If a key already exists for you, that same key is simply
shown to you again; if one doesn't exist yet, Fintela issues you one on the spot.

Each team member who uses the API gets their own key, tied to both you personally and your
organization. If a colleague also connects to the API, they'll get a separate key of their own:
but because everyone in your organization already shares the same view of your data inside
Fintela, both keys read the same information. Your key doesn't expire on a timer and there's no
session to renew: it stays valid until it's revoked.

## Where to find your key in Fintela

Your key is available to view, read only, in two places:

| Location | How to get there | What you'll see |
|---|---|---|
| API Documentation page | Open the API Documentation page from your account | Your key, partially masked for safety, with the beginning and last few characters visible |
| Account page | Open the **Developer access** section of your Account page | The same key, masked the same way |

Both screens have a reveal toggle so you can see the full value, and a copy to clipboard button so
you can grab it without retyping it.

> [!NOTE] Your key is always there to look up again
> Reopening either screen shows you the same key every time: it isn't a one time secret you have
> to capture immediately or lose forever. Treat it instead as a standing credential you can always
> read back from your account, and keep it safe accordingly.

### What you can (and can't) do with your key today

- **No self serve "create a new key."** A key is issued automatically the first time it's needed,
  as described above.
- **No self serve "revoke."** If you believe your key has been exposed, contact Fintela support to
  have it revoked: there's no button in the app for this yet.
- **No self serve "rotate" (retire the old key and issue a new one).** Same situation: this isn't
  something you can trigger yourself today.

> [!WARNING] Some in app guidance is ahead of what's actually available
> You may currently see help text suggesting you can "regenerate" your key yourself from the
> Account page, including advice to do so if you suspect it's been compromised. That control isn't
> available yet. Until it is, plan your key handling around a credential you can't rotate
> yourself: keep it in a password manager or your team's secrets tooling, never paste it into code
> you share publicly or into a web address, and contact Fintela support if you ever need it
> revoked.

## What your key looks like

Your key is a long random string that always starts with `sk_live_`. There's no separate "test"
key or sandbox version: every key you're issued works against your live Fintela data, so treat
any key you receive as a real, production grade credential from the moment you get it.

## Connecting your key to your tools

Whatever you're connecting (a script, a notebook, a BI tool, an internal dashboard) it needs to
send your key using the standard "Bearer token" method in the request's Authorization header.
This is a widely supported convention that virtually every HTTP client, scripting language, and
no code integration tool already understands, so you shouldn't need any special library just to
authenticate.

A couple of practical details:

- The word "Bearer" needs to be capitalized exactly as shown, followed by a single space and then
  your key.
- Because this is a read only key, there's nothing else to send along with it: just the key
  itself.

> [!CAUTION] Never put your key in a public facing page
> Don't place your key in code that runs in a visitor's browser: a public web page or
> client side app: since anyone viewing the page's source could read it out. Your key belongs in
> server side scripts, internal tools, or dashboards you control, never in something the public
> loads directly.

### Don't paste your key into a web address

Older in app examples showed appending your key to the web address itself (something like
`...?api_key=your-key`). That method doesn't work anymore: a request built that way is now
treated as if no key were sent at all, and simply fails. It was never a safe way to send a key in
the first place, either: web addresses tend to get saved in browser history, bookmarks, and
server logs. If you come across an old example using this pattern, update it to use the
Authorization header method described above instead.

## If your key stops working

A request that isn't properly authenticated gets turned away as unauthorized, generally for one
of a few practical reasons:

- You didn't include a key, or it isn't formatted the way Fintela expects (see above).
- The key is wrong or has been revoked. A key that never existed looks identical to one that used
  to work but was revoked: either way you're simply turned away, so recheck the key in your
  account first before assuming it was revoked.
- The key is no longer properly linked to your account or organization: if you keep seeing this
  after re checking the key itself, reach out to support.

See [API errors](/docs/api-errors) for the complete picture of what failures look like and how to
handle them in your integration.

> [!NOTE] You won't be told when something exists but isn't yours to see
> If your key is valid but you ask for something that belongs to a different organization,
> Fintela responds as though it simply doesn't exist, rather than telling you access was denied.
> That's intentional: it avoids confirming to anyone, including someone using a stolen key, that
> a specific record even exists elsewhere.

## Your key sees everything your organization can see

Your API key isn't scoped down to a subset of your data: it can read anything your organization
can see inside Fintela: every study, strategy, trial, portfolio, and result your teammates have
created, exactly as if you were looking at it in the app yourself.

- There's no way to issue a "read only for this one strategy" or "results only" key. A key is
  all or nothing across everything your organization holds.
- Everyone inside the same organization already sees each other's work in Fintela, and API keys
  inherit that same visibility: your key and a teammate's key return the same data.
- If you need an integration or an outside partner to see only part of your data, the only way to
  enforce that boundary today is to put that data under a separate organization with its own key.

## Turning on API access for your account

Pulling data out through the API is a feature tied to your Fintela plan, the same way other
premium capabilities are. See [Tokens and billing](/docs/tokens-and-billing) for how features get
unlocked on your account, or reach out to your account team to have it turned on.

- Looking up a key you already have is never blocked by this: so a change to your plan can't
  accidentally cut you off from a key you're already relying on in production.
- Getting a brand new key issued for the first time does require API access to be turned on for
  your organization.

> [!CAUTION] Turning the feature off doesn't stop an existing key
> Disabling API access for your organization does not, by itself, stop a key that's already been
> issued from working: an existing key keeps functioning until it's actually revoked. If you
> need to fully cut off access, for example after decommissioning an integration, ask Fintela
> support to revoke the key rather than relying on a plan or billing change alone.

## Rate limits

To keep Fintela responsive for every customer, each organization's API usage is capped at a
steady rate: roughly **20 requests per second** on average, with room to burst up to **40
requests** in a short stretch before you need to slow back down. This limit applies to your whole
organization, not to you individually: every teammate's key, and every script or scheduled job
you run, draws from the same shared budget, so parallel jobs can end up competing with each other
for the same allowance.

### Which data types have limits today

> [!WARNING] Coverage isn't even yet
> The request limit doesn't apply the same way across every part of the API today: some data
> types aren't currently capped at all. Design your integration as if the same limit applied
> everywhere regardless, because gaps like this can close without notice.

Currently rate limited: [Trials & portfolios](/docs/api-trials-portfolios),
[Baskets](/docs/api-baskets), [Asset groups](/docs/api-asset-groups).

Not rate limited today: [Studies](/docs/api-studies), [Strategies](/docs/api-strategies),
[Fitness](/docs/api-fitness).

### If you hit the limit

Going over the limit gets your request turned away with a "too many requests" style response.
The limit recovers quickly: waiting about a second before trying again is generally enough;
retrying immediately just gets rejected again.

A few practical habits that keep you well clear of the limit:

- **Batch your lookups.** Where a data type supports it, ask for a list of ids in a single request
  instead of making one request per item.
- **Poll on a schedule, not in a tight loop.** There's no live push feed today: nothing notifies
  you the moment something changes: so checking in on a regular interval is the right pattern,
  and how often you check is up to you.
- **Back off when you're told to**, rather than retrying immediately after being turned away.

### There's no usage dashboard yet

Fintela doesn't currently show you, in a response or anywhere in the app, how close you are to
your limit: you only find out by being turned away. If you need a safety margin, keep your own
count of requests on your side rather than relying on Fintela to warn you in advance.

Under very heavy simultaneous use from your organization, you might occasionally see a few more
requests go through than the stated limit. That isn't guaranteed behavior and shouldn't be relied
on: design your integration around the 20-requests per second figure above, not around what you
observe under load.

## Checking whether the service is available

Two checks don't require your API key at all, which makes them useful for telling "Fintela's API
is temporarily unavailable" apart from "my key is the problem."

### Quick status check

Fintela provides a simple status check you, or whoever manages your integration, can use to
confirm the service itself is reachable: separate from checking any particular piece of your
data. It's a good thing to point your own monitoring or an uptime check at, rather than inferring
an outage from a single failed data request.

### Full technical reference

For whoever builds or maintains your integration, Fintela also publishes a complete, always
up to date technical reference describing every request the API supports. It's useful for
generating client code automatically or double checking exact behavior, rather than working from
hand written notes that can drift out of date.

## Checklist before you connect an integration

- Keep your key in a password manager or your team's secrets tooling: never commit it to code
  you share, put it in a web address, or embed it in a public facing page.
- Send it using the Bearer method in the Authorization header, with the exact capitalization
  described above.
- Treat an unauthorized response as a credential problem, a "not found" as either genuinely
  missing or simply not visible to you, and a rate limit response as a sign to slow down: see
  [API errors](/docs/api-errors) for the complete reference.
- Wait about a second before retrying after a rate limit response; don't retry immediately.
- Poll on a schedule rather than in a tight loop, since there's no live push feed yet.
- Design your integration around the roughly 20-requests per second limit, even for the data types
  that aren't enforced today.
