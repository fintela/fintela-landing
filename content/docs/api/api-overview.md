---
title: API overview
section: API Reference
sectionOrder: 6
order: 1
published: true
updated: 2026-08-04
summary: Auth, base URL, request lifecycle, conventions.
keywords: api, rest, endpoints, authentication, bearer, read-only, rate limits, developer.fintela.io
---

The Fintela developer API is a **read-only** JSON over HTTPS API for pulling your results out
of the platform. Every endpoint is a `GET`. Strategies, fitness functions, studies, portfolios
and baskets are created and controlled in the Fintela app; `POST`, `PUT`, `PATCH` and `DELETE`
are rejected. There are no SDKs to install — every endpoint is one `curl` away.

## Read-only by design

The split is deliberate. Anything that _creates_ work — launching a study, validating code
against the compiler, refreshing or simulating a basket, promoting a trial — consumes compute
that is metered against your organization's token balance, so it lives in the app where that
metering applies. Results are already paid for, so reading them is what this API does.

In practice that means the API answers questions about resources that already exist. Build them
once in the app, then poll, export, or feed them into your own notebooks and dashboards from
here.

> [!NOTE] Write verbs are rejected
> There is no mutating surface at all. A `POST`, `PUT`, `PATCH` or `DELETE` to any path returns
> `405 Method Not Allowed` or `404 Not Found` — never a partial write. CORS preflight advertises
> `GET` only.

## Base URL

```http
https://developer.fintela.io
```

Every path in this reference is relative to that base URL. Responses are always JSON. Requests
carry no body, so there is no `Content-Type` to set — filters and options travel in the query
string.

## Authentication

Authentication is by **API key**. Create one in the Fintela app under your organization's
developer settings, then send it as a Bearer token on every request. The key is shown once at
creation — store it in your secret manager, and revoke it in the app if it leaks.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/strategies
```

> [!WARNING] Header only — never the query string
> The key is read from the `Authorization` header and nowhere else. Passing it as `?api_key=…`
> does not authenticate you: query strings leak into access logs, proxy logs, browser history
> and `Referer` headers, so a secret must never ride in one. A request without the header
> returns `401 Unauthorized`, as does a revoked key.

## What a key can see

There are no scopes to configure. A key resolves to two things — the **organization** it was
issued in and the **user** who created it — and every read applies that owner's own visibility.
A key therefore sees exactly what its owner sees in the app, no more:

| Resource | Visible through the API? |
|---|---|
| Owned by the key owner | Yes |
| Shared with the whole organization | Yes |
| Shared with the owner as `full` | Yes |
| Shared with the owner as `results_only` | No — use the web app |
| Belonging to another organization | No |

Two consequences worth designing around. First, a key is not an organization-wide master key: a
colleague's private strategy stays private even though you share an org. If an integration needs
broader coverage, share the resources with the org in the app rather than looking for a wider
key. Second, `results_only` grants are intentionally app-only — that sharing mode exists to
show someone results without handing over the underlying definition, and a programmatic export
would defeat it. Requesting such a resource by id behaves as if it does not exist.

## Request conventions

- Every endpoint is a `GET`; all filters and options are query parameters
- Dates use ISO format: `YYYY-MM-DD`
- Collections are filtered by a comma-separated id list named after the resource —
  `?study_ids=1,2,3`, `?strategy_ids=1,2,3`. A malformed id returns `400 Bad Request`
- Detail endpoints expand optional blocks with `?include=`, also comma-separated — for example
  `?include=equity,holdings,metrics`. Omit it to get the summary
- Money and percentages are expressed as decimals, not strings
- Ids are positive integers for studies, strategies, fitness functions, trials and portfolios;
  baskets and their operations are identified by UUID

## Response shape

Successful responses are wrapped in a `data` envelope; error responses carry a single `message`
field:

```json
{
  "data": 42
}
```

```json
{
  "message": "Invalid or revoked API key"
}
```

Client errors carry a specific, actionable `message`. Server errors (`500`) are deliberately
generic — internal detail is logged on Fintela's side and never returned — so treat a `500` as
retryable rather than parsing it.

## Rate limits

Requests are rate-limited **per organization**, not per key or per user, by a token bucket that
refills at **20 requests per second** with a **burst capacity of 40**. Short spikes above 20 rps
are absorbed by the burst; sustained traffic settles at the refill rate.

Exceeding the bucket returns `429 Too Many Requests` with a `Retry-After: 1` header. The bucket
refills in well under a second, so honouring that header is enough to recover — retrying
immediately just re-feeds the limiter.

> [!TIP] The budget is shared
> Every key in an organization draws on the same bucket, so parallel workers and scheduled jobs
> compete with each other. Poll on a fixed interval, batch reads with the comma-separated id
> filters instead of one request per id, and back off on `429`.
