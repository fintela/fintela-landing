---
title: Errors & status codes
section: API Reference
sectionOrder: 10
order: 9
published: true
updated: 2026-08-18
summary: The error envelope, every status code the API actually emits, and what each means.
keywords: errors, status codes, message, kind, 400, 401, 404, 406, 429, 500, retry-after, deprecation
---

Every error the Developer API returns is a JSON object with exactly two fields — `message` and
`kind`. The service emits eight status codes in total, seven of them errors. This page lists each
one, what triggers it, the exact message strings, and the cases where a response does not use the
envelope at all. `403` is not among them: the constructor exists in Fintela's shared error type but
is never called on this service, so a resource you cannot reach comes back as `404`.

## The error envelope

```json
{
  "message": "Invalid or revoked API key",
  "kind": "unauthorized"
}
```

`message` is human-readable prose intended for a log line or an operator. `kind` is a coarse machine
label. There are no other fields — no `code`, no `errors` array, no `request_id`, no `details`
object.

> [!NOTE] The OpenAPI document is out of date on this one point
> The `info.description` in `GET /openapi.json` still describes the error body as
> `{"message": "..."}` alone. The `kind` field is on the wire on every error response; it is the
> description that has not caught up. The addition was backwards-compatible, so a client that reads
> only `message` still works.

### The kind field

`kind` is set by the error constructor and is never overridden anywhere in this service, so the
mapping from status to `kind` is one-to-one and total:

| `kind` | Status | Meaning |
|---|---|---|
| `bad_request` | `400` | A query parameter, path parameter or id list is malformed or missing |
| `unauthorized` | `401` | Missing, unknown or revoked API key |
| `not_found` | `404` | No such resource, or it belongs to another organization |
| `not_acceptable` | `406` | An id in a `?strategy_ids=` or `?fitness_ids=` filter names something you cannot read |
| `rate_limited` | `429` | Your organization's token bucket is empty |
| `internal` | `500` | Server-side failure, message redacted |

Note that the `406` kind is the string `not_acceptable`, not `not_valid`.

> [!TIP] Branch on `kind` and the status, never on `message`
> Message strings interpolate ids (`Trial 91 not found in study 'roc_top_n_q1'`) and are curated
> prose, not a contract — they are free to change wording. Two of them already differ only by a
> word: `study_ids required` on four routes versus `study_ids is required` on a fifth. `kind` and
> the status code are the stable pair.

### Errors that skip the envelope

Some failures are produced before the handler runs or outside it entirely, and none of those carry
`message` / `kind`:

| Failure | Status | Body |
|---|---|---|
| A query string that cannot be deserialized into the route's parameters | `400` | Plain text, `Failed to deserialize query string: <detail>` |
| A path segment that cannot be parsed into its type | `400` | Plain text, `Invalid URL: <detail>` |
| No route matches the path at all | `404` | Empty |
| A write verb on any path | `405` or `404` | Empty |

> [!WARNING] Extractor rejections happen before authentication
> Path and query parameters are parsed before the handler body runs, and authentication lives in the
> handler body. A malformed basket UUID or an unparseable `limit` therefore returns `400` **even
> with no API key at all** — the `400` pre-empts the `401`. Do not read a `400` as proof that your
> credentials were accepted.

`GET /health` is the only route that also breaks the *success* envelope: it returns its status
object directly rather than under `data`. See [API overview](/docs/api-overview).

## Status codes actually emitted

| Status | Envelope | What triggers it |
|---|---|---|
| `200` | `{"data": …}` | Every success on every route except `GET /health`, which returns its object unwrapped |
| `400` | `{"message", "kind"}` or plain text | Malformed id in a CSV filter, missing required `study_ids`, `train + validation` weights that do not sum to `1.0`, negative `trial_number`, unparseable path or query parameter |
| `401` | `{"message", "kind"}` | Missing or blank `Authorization` header, unknown or revoked key, key row with no organization or no user |
| `404` | `{"message", "kind"}`, or empty | A study, trial, portfolio, basket or operation that does not exist or is outside your organization; also an unmatched path, and possibly a write verb |
| `405` | empty | A write verb on a path that exists |
| `406` | `{"message", "kind"}` | `?strategy_ids=` or `?fitness_ids=` naming an id you cannot read |
| `429` | `{"message", "kind"}` | Organization rate limit exceeded, on the routes the limiter covers |
| `500` | `{"message", "kind"}` | Any database or serialization failure, redacted |

> [!NOTE] There is no `201`, `202` or `204`
> Success is always `200`. The API is read-only — nothing is created, accepted for later processing,
> or deleted — and the response builder is never given a non-`200` success code anywhere in the
> service.

## What triggers each status

### 400 Bad Request

Five handler-level checks produce an enveloped `400`:

| Trigger | Routes | `message` |
|---|---|---|
| A non-integer token in a comma-separated id filter | Any route taking `?study_ids=`, `?strategy_ids=`, `?fitness_ids=` | `Invalid id: '<token>'` |
| `study_ids` omitted | `/studies/progress`, `/studies/health`, `/studies/status`, `/studies/errors` | `study_ids required` |
| `study_ids` omitted | `/studies/param-importances` | `study_ids is required` |
| Stage weights do not sum to 1 | `/studies/avg_opt/history`, `/studies/avg_opt/params` | `train + validation weights must sum to 1.0` |
| A negative trial number | `/v2/studies/{study_name}/trials/{trial_number}` | `trial_number must be non-negative, got <n>` |

The weight check is a strict tolerance: `train + validation` must be within `1e-9` of `1.0`.

Whether an omitted `study_ids` gives you an enveloped `400` or a plain-text one depends on the
route, because the parameter is optional on some structs and mandatory on others:

| Route | `study_ids` omitted |
|---|---|
| `/studies/metadata` | `200` — an absent filter legitimately means "every study" |
| `/studies/progress`, `/studies/health`, `/studies/status`, `/studies/errors` | `400`, enveloped, `study_ids required` |
| `/studies/param-importances` | `400`, enveloped, `study_ids is required` |
| `/studies/opt/history`, `/studies/opt/params` | `400`, plain text — `study_ids`, `metric_name` and `stage` are all required by the parser |
| `/studies/avg_opt/history`, `/studies/avg_opt/params` | `400`, plain text — `study_ids` and `metric_name` are required by the parser |

Out-of-range pagination is **not** a `400`. On the four basket-operation history sub-resources,
`limit` is clamped to `[1, 1000]` and `offset` is floored at `0`; values outside those bounds are
silently corrected. Only a non-numeric `limit` or `offset` fails, and it fails as a plain-text
parser rejection.

### 401 Unauthorized

Every authentication failure is a `401` with `"kind": "unauthorized"`:

| Condition | `message` |
|---|---|
| No `Authorization` header, wrong scheme, or an empty key after `Bearer ` | ``Missing API key. Provide it via the `Authorization: Bearer <key>` header.`` |
| The key hashes to no row, or the row has `revoked_at` set | `Invalid or revoked API key` |
| The key's row has a null organization | `API key is not associated with an organization` |
| The key's row has no associated user | `API key has no associated user` |

> [!WARNING] `?api_key=` produces a bare 401 with no hint
> Authentication is header-only. The `api_key` query parameter is still deserialized by the request
> parser but its value is discarded — it is not rejected, not warned about, and not mentioned in the
> response. A caller using it gets `Missing API key…` and no indication that the credential was
> present and ignored. Details in [Authentication & limits](/docs/api-authentication).

### 404 Not Found

`404` covers both "no such id" and "exists, but not in your organization" — the two are
deliberately indistinguishable so the API is not an existence oracle for other tenants' data.

| Resource | `message` | Route |
|---|---|---|
| Study | `Study '<study_name>' not found` | `/v1/studies/{study_name}`, `/v2/studies/{study_name}/trials/{trial_number}` |
| Trial by id | `Trial <trial_id> not found` | `/v2/trials/{trial_id}` |
| Trial by study and number | `Trial <n> not found in study '<study_name>'` | `/v2/studies/{study_name}/trials/{trial_number}` |
| Portfolio | `Portfolio <id> not found` | `/v1/portfolios/{portfolio_id}`, `/v2/portfolios/{id}` |
| Basket | `Basket <id> not found` | `/v2/baskets/{id}` and every sub-resource |
| Operation | `Operation <id> not found` | `/v2/baskets/{id}/operations/{op_id}` and its history routes |

The two trial lookups are deliberately distinguishable: a bad study name gives you
`Study '…' not found`, a good study name with a bad trial number gives you
`Trial <n> not found in study '…'`. Use that to tell a typo in the study name from a trial that was
never run.

> [!NOTE] `/v1/portfolios/42` and `/v2/portfolios/42` are unrelated objects
> They are different resources in separate id spaces — v1 portfolios are trials, v2 portfolios are
> managed portfolios — and both emit the identical message `Portfolio 42 not found`. A `404` from
> one tells you nothing about the other. See [Trials & portfolios](/docs/api-trials-portfolios).

An unmatched path is also a `404`, but with an **empty body** rather than the envelope, because it
comes from the router fallback and never reaches an error constructor.

### 405 or 404 on a write verb

The API is read-only. Every route is a `GET`, CORS advertises `GET` only, and three tests pin that
the write surface stays gone. A `POST`, `PUT`, `PATCH` or `DELETE` to any path returns either
`405 Method Not Allowed` or `404 Not Found`, with an empty body in both cases.

Which of the two you get is not a contract. The service installs a router-level fallback, and how
that interacts with the framework's built-in `405` is version-sensitive; the service's own test
asserts the disjunction `405 || 404` and explicitly refuses to tighten it. Treat both as "this verb
does not exist here".

> [!CAUTION] Do not build a retry or a fallback around a write
> Writes are absent by design, not by oversight. Every one that used to exist was a compute trigger
> that has to debit the organization's token ledger before it runs, and this service has no ledger
> integration. Five specific removed endpoints — two trial-promotion routes, daily-update
> enrolment, basket refresh and basket simulate — are pinned by a test that must never come back
> without billing.
> Create and control resources in the Fintela app.

### 406 Not Acceptable

This is the status most likely to surprise you, because its message says "not found" while the code
says something else entirely.

Two routes gate every explicitly named id before doing any work, and a failed gate returns `406`:

| Route | Trigger | `message` |
|---|---|---|
| `GET /strategies/metadata` | An id in `?strategy_ids=` that your organization cannot read | `Strategy <id> not found` |
| `GET /fitness/metadata` | An id in `?fitness_ids=` that your organization cannot read | `Fitness <id> not found` |

Both check every id in the list and reject on the first failure, so a request naming ten ids where
one is unreadable returns `406` and no data at all — it does not return the nine you can see.

`GET /strategies/params` takes the same `?strategy_ids=` filter but performs **no** such gate; an
unreadable id there is simply absent from the returned map. `/strategies` and `/fitness` take no id
filter and cannot emit `406`. No other route on the API returns `406`.

> [!WARNING] A `406` here is an authorization outcome, not a content negotiation one
> The status is normally about `Accept` headers. On this API it means "one of the ids you named is
> not yours". Handle it alongside `404`, not alongside `415`, and do not send an `Accept` header to
> try to fix it. See [Strategies](/docs/api-strategies) and
> [Fitness functions](/docs/api-fitness).

### 429 Too Many Requests

Exhausting your organization's token bucket returns:

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

`Retry-After` is always the literal `1`. The bucket refills at 20 tokens per second with a burst
capacity of 40, so one second of sleep always clears enough headroom to proceed; retrying
immediately just re-feeds the limiter and keeps you rejected.

> [!WARNING] The limiter does not cover the whole API today
> The bucket lives inside the shared authentication helper, but the **studies**, **strategies** and
> **fitness** route families authenticate through a lower-level path that never touches it. Those 20
> routes cannot currently return `429`; the other 17 can. This is inconsistent behaviour in the
> service rather than a documented tier, so write your client to respect 20 rps everywhere and to
> handle `429` on every call — the gap can close without notice.

Rate limiting is keyed on the validated organization and shared by every key in it, so a colleague's
batch job can exhaust your budget. The full route-by-route breakdown, the per-task ceiling and the
absence of rate-limit headers are covered in [Authentication & limits](/docs/api-authentication).

### 500 Internal Server Error

Every `500` is redacted before it leaves the service. The body is always exactly this, on every
route and for every underlying cause:

```json
{
  "message": "Something went wrong on Fintela's side. Please try again in a moment.",
  "kind": "internal"
}
```

The real cause — a raw database error, a serialization failure, a statement timeout — is written to
Fintela's server logs and attached to the request's trace, and never reaches the client. There is
nothing to parse out of a `500` beyond the status itself. What you *can* quote in a support request
is the `traceparent` response header, which joins your failed call to the server-side span that
recorded the unredacted cause — see below.

One `500` cause is worth knowing because it is load-dependent rather than a bug: every connection
this service opens runs with a 30-second statement timeout, so a read heavy enough to exceed it is
cancelled by the database and surfaces as a redacted `500`. Narrowing the request — fewer ids in the
CSV filter, a smaller `limit`, fewer `include` blocks — is usually the fix.

### 403 is never emitted

`403 Forbidden` cannot come from this API. The constructor for it exists in Fintela's shared error
type and is used by other services, but there is not one call site anywhere in the Developer API.
Every authorization outcome is expressed as something else:

| Situation | What you actually get |
|---|---|
| Resource in another organization | `404` with `not_found` |
| Resource soft-deleted | `404` with `not_found` |
| An id named in `?strategy_ids=` / `?fitness_ids=` you cannot read | `406` with `not_acceptable` |
| A revoked key | `401` with `unauthorized` |
| Rate limit | `429` with `rate_limited` |

Do not write a `403` branch. If you see one, it came from a proxy, gateway or corporate egress
filter in front of Fintela — not from the API.

The same applies to `402`, `409` and `503`: constructors exist in the shared type, and none of them
is reachable on this service.

## Every message the API can return

Every enveloped error string this service can produce, in one place. Angle brackets mark
interpolated values.

| Status | `kind` | `message` |
|---|---|---|
| `400` | `bad_request` | `Invalid id: '<token>'` |
| `400` | `bad_request` | `study_ids required` |
| `400` | `bad_request` | `study_ids is required` |
| `400` | `bad_request` | `train + validation weights must sum to 1.0` |
| `400` | `bad_request` | `trial_number must be non-negative, got <n>` |
| `401` | `unauthorized` | ``Missing API key. Provide it via the `Authorization: Bearer <key>` header.`` |
| `401` | `unauthorized` | `Invalid or revoked API key` |
| `401` | `unauthorized` | `API key is not associated with an organization` |
| `401` | `unauthorized` | `API key has no associated user` |
| `404` | `not_found` | `Study '<study_name>' not found` |
| `404` | `not_found` | `Trial <trial_id> not found` |
| `404` | `not_found` | `Trial <n> not found in study '<study_name>'` |
| `404` | `not_found` | `Portfolio <id> not found` |
| `404` | `not_found` | `Basket <id> not found` |
| `404` | `not_found` | `Operation <id> not found` |
| `406` | `not_acceptable` | `Strategy <id> not found` |
| `406` | `not_acceptable` | `Fitness <id> not found` |
| `429` | `rate_limited` | `Rate limit exceeded for your organization on the developer API; please slow down.` |
| `500` | `internal` | `Something went wrong on Fintela's side. Please try again in a moment.` |

## Response headers

### Retry-After

`Retry-After: 1` is set on every `429`, and on nothing else on this API. It is a fixed literal, not
a computed backoff, and it is the only machine-readable retry hint the service produces.

### Deprecation and Link

The two v1 portfolio routes are the only ones that emit response headers beyond the framework
defaults:

```http
Deprecation: true
Link: </v2/trials>; rel="successor-version"
```

The headers are injected by a layer wrapped around that router, so they appear on **every** response
from those two routes — including their `401`, `404` and `429` errors, not only their `200`s. That
makes them a reliable signal to alert on: if your client sees `Deprecation: true` on any response, it
is calling `/v1/portfolios` or `/v1/portfolios/{portfolio_id}` and should move to `/v2/trials`.

No other route on the API is marked deprecated, and no other route emits either header.

### traceparent

Every response — success, error, and the empty-bodied `404` and `405` — carries a W3C Trace Context
header naming the server-side span that handled it. The one exception is a CORS preflight, which
the CORS layer answers before the tracing middleware ever runs:

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

The format is `00-<32 hex trace-id>-<16 hex parent-id>-<2 hex flags>`. Fintela deliberately speaks
`traceparent` rather than a bespoke `X-Request-Id`. If you send your own `traceparent` on the
request it is used as the parent, so a call from your system through this API stays on one trace; a
malformed one is ignored and a fresh trace is started rather than failing the request.

Log the trace id alongside every non-`2xx` you record. It is the only handle that connects a
redacted `500` to the unredacted cause, which is why it is worth capturing before you need it.

> [!NOTE] Browsers cannot read this header
> The CORS layer on this API does not list `traceparent` in `Access-Control-Expose-Headers`, so
> cross-origin JavaScript cannot see it even though it is on the wire. Server-side clients — curl,
> a Python or Node backend, anything not subject to the same-origin policy — read it normally.

### There are no rate-limit headers

Responses carry no `X-RateLimit-Limit`, `X-RateLimit-Remaining` or `X-RateLimit-Reset`, on success
or on failure. You cannot observe how much budget you have left; you find out by being refused.
Count requests client-side if you need a margin.

## Handling errors in a client

A branch order that matches how the service actually behaves:

| Status | Retryable | What to do |
|---|---|---|
| `429` | Yes | Sleep for `Retry-After` seconds, then retry the same request |
| `500` | Once, with backoff | Retry once; if it repeats, narrow the request or open a support ticket |
| `400` | No | Fix the request — it will fail identically forever |
| `401` | No | Fix the `Authorization` header; if the key is revoked you need a new one |
| `404` | No | The id does not exist for this organization |
| `406` | No | Remove the offending id from the filter |
| `405` | No | The verb does not exist; the API is read-only |

Practical rules:

- Read the status first, then `kind`. Only fall through to `message` for logging.
- Record the `traceparent` header on every non-`2xx`. It is the one piece of a `500` that carries
  any diagnostic value.
- Do not assume a body is JSON. Extractor rejections are plain text, and unmatched paths and write
  verbs return nothing at all — parse defensively on non-`2xx`.
- Treat `404` and `406` together as "you cannot see this", since which one you get depends on
  whether you named the id in a filter or in a path.
- Batch with the CSV id filters instead of one request per id, both to stay under the rate limit and
  because `406` short-circuits a whole batch — a request that names ten ids returns nothing if one is
  unreadable.
- There are no webhooks and no push channel of any kind on this API — no SSE, no long-polling, no
  callbacks. Every integration polls, so error handling sits on the hot path of a loop, and a retry
  storm on `429` is the failure mode most likely to bite you.

## Trial failures are not HTTP errors

A trial that fails inside the optimizer is data, not an error response. The study finishes, the
request returns `200`, and the failures are reported in the payload of `GET /studies/errors` as
`error_summary` buckets (grouped by `failure_kind`, with a representative `failure_reason`) and a
`failed_trials` list carrying each trial's parameters and structured `failure_diagnostic`. Study
runtime failures surface the same way through the `failure_diagnostic` field on
`GET /studies/status`.

Nothing about a failed trial, a failed study, or a stopped run changes the HTTP status of the read.
The full field reference is in [Studies](/docs/api-studies).
