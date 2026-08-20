---
title: Authentication & limits
section: API Reference
sectionOrder: 10
order: 2
published: true
updated: 2026-08-18
summary: How to get a key, how to send it, and the rate limits that actually apply.
keywords: authentication, api key, bearer, sk_live, rate limit, 429, retry-after, 401, scopes, entitlement, developer_api
---

Every request to `https://developer.fintela.io` is authenticated with a single API key sent as an
HTTP Bearer token. There are no scopes, no OAuth flow, no refresh tokens and no session — one
long-lived key, one header, and a per-organization rate limit that today applies to some route
families but not others. This page covers where the key comes from, exactly how to send it, what
each failure means, and what the limiter really does.

## How a key is issued

Keys are minted by the Fintela app, not by this API. The app calls `GET /configuration` on the
Fintela backend (authenticated with your Keycloak session, not with an API key) and that endpoint
does two things in one code path:

1. If your `(user, organization)` pair already has a key that has not been revoked, it is returned.
2. If there is none, and your organization holds the `developer_api` entitlement, a key is minted
   and returned.

There is no explicit "create key" step. A key comes into existence the first time the app asks for
one on your behalf and finds none.

Keys are scoped to a `(user, organization)` pair, not to an organization as a whole. Two members of
the same organization hold two different keys — but because there is no privacy within an
organization, both keys read the same data.

At rest a key is stored three ways: `hex(SHA-256(key))` for lookup, a KMS-envelope ciphertext for
re-display, and a 16-character prefix for identification. Request validation is a hash lookup
against a unique index, so the plaintext is never needed to verify a call.

## Where the key appears in the app

The key is shown in two places, both read-only:

| Surface | How to reach it | What it shows |
|---|---|---|
| API Documentation page | `/developer` — no sidebar entry, open the URL directly | Card labelled **Your Fintela API Key**, masked as the first 10 characters + `••••••••` + the last 4 |
| Account page | **Developer access** card ("Programmatic access to the Fintela API.") | Field labelled **API Key**, masked as the first 8 characters + 20 `•` |

Both carry a reveal toggle (**Reveal full key** / **Hide key** on the docs page, **Show** / **Hide**
on the Account page) and a copy button (**Copy to clipboard** / **Copy**, flipping to **Copied!**).
That is the entire key-management surface.

> [!NOTE] The key is not shown once
> `GET /configuration` decrypts the stored envelope and returns the plaintext on **every** call, so
> the app re-reveals your existing key on every page load. You do not lose access to a key by
> closing a dialog. Treat it as a long-lived credential you can always read back, not as a
> one-time secret.

### What the app cannot do

- **No create control.** A key is minted implicitly, as described above.
- **No revoke control.** Nothing in the app marks a key revoked.
- **No rotate or regenerate control.** The backend does serve `POST /configuration/api-key/rotate`,
  which stamps `revoked_at = now()` on every active key for the `(user, organization)` pair and then
  mints a fresh one — but no screen in the app calls it. The endpoint is implemented and unreachable
  from the product.

> [!WARNING] The in-app security guidance overstates what exists
> The **Security** tab of the API Documentation page tells you to "periodically regenerate your API
> key via the Account page" and, on suspected compromise, to "navigate to your Account page
> immediately and regenerate it". There is no such control on the Account page or anywhere else in
> the app today. Plan your key handling around a credential you cannot currently self-service
> rotate: keep it in a secret manager, never in source control, and never in a URL.

## Key format

```text
sk_live_<43 URL-safe base64 characters>
```

A key is the literal prefix `sk_live_` followed by 32 random bytes encoded as unpadded URL-safe
base64 — 43 characters, for a total length of 51. The character set after the prefix is
`A-Z`, `a-z`, `0-9`, `-` and `_`. There is no `sk_test_` variant and no sandbox environment.

## Sending the key

Authentication is **header-only**:

```http
GET /v2/trials HTTP/1.1
Host: developer.fintela.io
Authorization: Bearer YOUR_API_KEY
```

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/trials
```

The parsing rule is strict and worth knowing exactly:

| Rule | Behaviour |
|---|---|
| Header name | Case-insensitive — `Authorization` and `authorization` both work |
| Scheme token | Matched as the exact literal `Bearer ` with one trailing space. **Case-sensitive** — `bearer sk_live_…` is rejected |
| Surrounding whitespace | The key is trimmed after the prefix is stripped |
| Empty key | `Authorization: Bearer ` with nothing after it is rejected |
| Any other scheme | `Basic`, `Token`, a bare key with no scheme — all rejected |

Requests carry no body, so there is no `Content-Type` to set. CORS on this service advertises `GET`
only and leaves the origin open, because API keys — not cookies — are the credential, so a
cross-origin caller with a valid key is a legitimate one. That also means you must never put a key
in browser-side code.

### The ignored api_key query parameter

Passing the key as `?api_key=…` does not authenticate you. Query strings leak into access logs,
proxy logs, browser history and `Referer` headers, so the query fallback was removed.

The trap is that it was removed **silently**. The query parameter is still declared and still
deserialized by the handlers — the value is simply discarded. Nothing validates it, nothing warns
about it, and it does not appear in the OpenAPI document. A request that sends only
`?api_key=sk_live_…` is indistinguishable from a request with no credential at all, so you get a
bare `401` whose message says the header is missing.

```bash
# Rejected — the key is discarded, the response is a plain 401
curl "https://developer.fintela.io/v2/trials?api_key=$FINTELA_API_KEY"
```

> [!CAUTION] Examples inside the app still teach this pattern
> The Quick Start, Security tab and v1 endpoint samples on the in-app `/developer` page, and the
> Markdown they export, still show `?api_key=` query auth, and the "Try it" buttons still build
> their requests that way. Every one of those returns `401`. Follow this page, not those samples.

## Authentication failures

All authentication failures are `401 Unauthorized` with `"kind": "unauthorized"` in the body:

```json
{
  "message": "Invalid or revoked API key",
  "kind": "unauthorized"
}
```

| Condition | Exact `message` |
|---|---|
| No `Authorization` header, wrong scheme, or empty key after `Bearer ` | ``Missing API key. Provide it via the `Authorization: Bearer <key>` header.`` |
| The key hashes to no row, or its row has `revoked_at` set | `Invalid or revoked API key` |
| The key's row has a null organization | `API key is not associated with an organization` |
| The key's row has no associated user | `API key has no associated user` |

There is no lockout and no attempt counter, and a well-formed-but-unknown key is indistinguishable
from a revoked one — both answer `Invalid or revoked API key`.

> [!NOTE] 403 is never returned
> A resource that belongs to another organization returns `404 Not Found`, not `403 Forbidden`, so
> the API never confirms that an id you cannot see exists. `403` is unreachable on this service; if
> you see one it came from a proxy in front of it, not from Fintela. Full status-code reference in
> [API errors](/docs/api-errors).

## There are no scopes

A key carries no permissions of its own. The OpenAPI document declares a single security scheme,
`api_key_bearer`, applied as a global requirement with an **empty scope list** — "Bearer API keys
are not scoped" is the comment in the source.

What a key can reach is decided entirely by the organization it was issued in:

- Every read predicate is *organization matches* AND *not soft-deleted*, with an opt-in
  *organization is null* branch for platform-shared rows (enabled only for fitness).
- There is no privacy within an organization. Everything any member creates is readable by every
  member. Per-row visibility, share grants and results-only snapshots were dropped by migration
  `20260812000001_remove_intra_org_privacy` and no longer exist.
- The key's owning user is carried through the request but is not part of any read predicate.

So you cannot mint a narrower key, and you cannot mint a broader one. If an integration should only
see a subset of your data, that boundary has to be a separate organization.

## The developer_api entitlement

Access to the API is gated by the `developer_api` entitlement — but only in the app, and only at
mint time. The distinction matters:

| Action | Entitlement checked? | Where |
|---|---|---|
| Reading an existing key (`GET /configuration`) | No — never gated | Fintela backend |
| Minting a first key (`GET /configuration`, no key found) | Yes | Fintela backend |
| Rotating a key (`POST /configuration/api-key/rotate`) | Yes, unconditionally | Fintela backend |
| Any request to `developer.fintela.io` | **No** | Developer API |

Reading an existing key is deliberately ungated so that a packaging change cannot cut an
organization off from a credential it is already using in production.

`developer_api` **ships locked**. The entitlement policy seeds its locked-features list with all
nine feature keys, `developer_api` among them, so a fresh deployment has the API closed. Unlocking
it is a policy change on Fintela's side, not a deploy, and takes effect fleet-wide within the
policy's 60-second cache TTL. See [Tokens and billing](/docs/tokens-and-billing) for how
entitlements relate to your account.

When the app-side gate blocks you, the Fintela backend answers `402 Payment Required`:

```json
{
  "message": "This feature is available on paid accounts. Buy tokens to unlock it.",
  "error": "feature_locked",
  "feature": "developer_api",
  "upgrade": "purchase_tokens"
}
```

That body comes from the app backend. `developer.fintela.io` never emits `402`.

> [!CAUTION] The API service performs no entitlement check
> `developer.fintela.io` validates three things and nothing else: the key's hash, that
> `revoked_at IS NULL`, and (on some routes) the rate bucket. There is no entitlement lookup
> anywhere in the service. A key issued while `developer_api` was open keeps working against the
> API indefinitely, even after the entitlement is removed. Do not use the entitlement as an access
> control on the API surface — the only thing that stops a key is revocation.

## Rate limits

Rate limiting is a token bucket keyed on the **validated organization** from your key — not on the
key, not on the user, not on the IP. Every key in an organization draws on the same bucket, so
parallel workers and scheduled jobs compete with one another.

| Knob | Environment variable | Default |
|---|---|---|
| Refill rate | `DEV_API_RATE_LIMIT_RPS` | `20.0` requests per second |
| Burst capacity | `DEV_API_RATE_LIMIT_BURST` | `40.0` requests |

Neither variable is set anywhere in Fintela's infrastructure configuration, so production runs the
defaults: **20 rps sustained, 40 burst**.

Mechanically: the bucket refills continuously at the refill rate up to the burst capacity, and each
admitted request consumes one token. A new organization's bucket starts full, so your first 40
requests can arrive as fast as you can send them; after that you settle at 20 rps. Setting the
refill rate to zero or below disables limiting entirely, and the burst capacity is floored at 1.

### Which routes are limited

> [!WARNING] The limiter does not cover the whole API
> The bucket lives inside the shared `authenticate()` helper, but the **studies**, **strategies**
> and **fitness** route families authenticate through a lower-level path that never touches it.
> Those 20 routes are currently unlimited. This is inconsistent behaviour in the service, not a
> documented tier — treat the limit as applying everywhere and design your client to respect
> 20 rps regardless of which family you are calling, because the gap can close without notice.

| Route family | Paths | Routes | Rate limited |
|---|---|---|---|
| [Studies](/docs/api-studies) | `/studies/*`, `/v1/studies`, `/v1/studies/{study_name}` | 12 | No |
| [Strategies](/docs/api-strategies) | `/strategies`, `/strategies/metadata`, `/strategies/params`, `/v1/strategies`, `/v2/strategies/{id}/versions` | 5 | No |
| [Fitness](/docs/api-fitness) | `/fitness`, `/fitness/metadata`, `/v2/fitness/{id}/versions` | 3 | No |
| [Trials](/docs/api-trials-portfolios) | `/v2/trials`, `/v2/trials/{trial_id}`, `/v2/studies/{study_name}/trials/{trial_number}` | 3 | Yes |
| Managed portfolios | `/v2/portfolios`, `/v2/portfolios/{id}` | 2 | Yes |
| Portfolios (v1, deprecated) | `/v1/portfolios`, `/v1/portfolios/{portfolio_id}` | 2 | Yes |
| [Baskets](/docs/api-baskets) | `/v2/baskets`, `/v2/baskets/{id}`, `/v2/baskets/{id}/freshness` | 3 | Yes |
| Basket operations | `/v2/baskets/{id}/operations`, `/v2/baskets/{id}/operations/{op_id}` and its four history sub-resources | 6 | Yes |
| [Asset groups](/docs/api-asset-groups) | `/v1/data_clusters` | 1 | Yes |

That is 17 limited routes and 20 unlimited ones, out of the 37 that require a key.

### Handling a 429

Exhausting the bucket returns `429 Too Many Requests`:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1
Content-Type: application/json
```

```json
{
  "message": "Rate limit exceeded for your organization on the developer API; please slow down.",
  "kind": "rate_limited"
}
```

`Retry-After` is always the literal `1`. The bucket refills in well under a second, so sleeping for
one second is enough to recover — retrying immediately just re-feeds the limiter and keeps you
rejected.

Practical guidance:

- Batch reads with the comma-separated id filters (`?study_ids=1,2,3`, `?strategy_ids=1,2,3`)
  instead of issuing one request per id.
- Poll on a fixed interval rather than in a tight loop. There are no webhooks and no push channel of
  any kind on this API — no SSE, no long-polling, no callbacks — so polling is the only integration
  pattern, and the interval is yours to choose.
- Back off on `429`, honouring `Retry-After`.

### There are no rate-limit headers

Successful responses carry no `X-RateLimit-Limit`, `X-RateLimit-Remaining` or `X-RateLimit-Reset`.
No header on any response exposes your budget. You cannot observe how close you are to the limit —
you find out by being refused. Count your own requests client-side if you need a margin.

There is also no usage or quota display anywhere in the Fintela app: no request counts, no remaining
budget, no rate-limit information on the `/developer` page.

### The ceiling is per task, not per fleet

The bucket is a process-local map inside each running instance of the service, and the service
autoscales between 1 and 6 tasks with no sticky routing. Under load your organization's requests
spread across tasks, each holding its own independent bucket, so the *effective* ceiling can reach
6 × 20 rps.

Do not design against that number. It is incidental, it collapses back to a single bucket the moment
the service scales in, and it is exactly the kind of behaviour that disappears when the limiter moves
to shared state. **20 rps is the number to build against.**

## Routes that need no key

Two routes on `developer.fintela.io` are public. Both are useful for separating "the service is
down" from "my key is wrong".

### GET /health

```http
GET /health
```

No path parameters, no query parameters, no `Authorization` header. Its response is **not** wrapped
in the `{"data": <T>}` envelope — the status object is returned directly. Every one of the 37
authenticated routes is enveloped; the two public routes, `/health` and `/openapi.json`, are not.

```json
{
  "status": "ok",
  "db": "ok"
}
```

When the connection pool cannot answer `SELECT 1`, a third field appears carrying the raw driver
error text:

```json
{
  "status": "ok",
  "db": "error",
  "db_error": "<database error text>"
}
```

| Field | Type | Always present | Values |
|---|---|---|---|
| `status` | string | Yes | `"ok"` — it does **not** change when the database probe fails |
| `db` | string | Yes | `"ok"` or `"error"` |
| `db_error` | string | Only when `db` is `"error"` | Raw driver error text |

Monitor `db`, not `status`.

### GET /openapi.json

```http
GET /openapi.json
```

No path parameters, no query parameters, no authentication. Returns the machine-readable OpenAPI 3.x
description of the whole surface, generated from the service's own handler annotations, not
hand-written. It is not enveloped.

This is the most trustworthy artifact in the system: a test asserts set equality in both directions
between the router's registered paths and the document's paths, and pins the exact total at **38
documented paths** (37 authenticated routes plus `/health`). A route cannot be served without being
documented, and a documented path cannot be stale, or that test fails. `/openapi.json` itself is
deliberately excluded from that set — it is served by a closure rather than an annotated handler, so
it does not self-document.

Point a client generator at it rather than transcribing paths by hand.

```json
{
  "info": {
    "title": "Fintela Developer API",
    "version": "1.0.0"
  },
  "components": {
    "securitySchemes": {
      "api_key_bearer": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "API key",
        "description": "Fintela API key sent as `Authorization: Bearer <api-key>`."
      }
    }
  },
  "security": [
    { "api_key_bearer": [] }
  ]
}
```

That excerpt shows the two things worth checking by hand: the empty scope array on the global
security requirement, and the fact that the scheme is plain HTTP Bearer. `info.version` is the
**document's** version and has nothing to do with the `/v1` and `/v2` path prefixes — see
[API overview](/docs/api-overview) for what those actually mean.

## Checklist before you ship an integration

- Read the key from an environment variable or secret manager; never commit it, never put it in a
  URL, never ship it to a browser.
- Send it as `Authorization: Bearer <key>` — exact capitalisation of `Bearer`, one space.
- Handle `401` as a credential problem, `404` as "not visible or not there", `406` as a bad id in a
  filter, `429` as backpressure, and `500` as retryable. See [API errors](/docs/api-errors).
- Read `kind` on error bodies rather than string-matching `message`.
- Sleep the `Retry-After` seconds on `429`; do not retry immediately.
- Poll on an interval — there is no push channel.
- Assume 20 rps per organization even on route families that are not limited today.
