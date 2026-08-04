---
title: Errors & status codes
section: API Reference
sectionOrder: 6
order: 7
published: true
updated: 2026-08-04
summary: How Fintela reports errors — HTTP codes, trial failure reasons.
keywords: errors, http codes, trial pruned, failure_reason, 429, retry-after, nan_fitness
---

Errors come from two layers — HTTP-level errors from the API (auth, malformed query parameters,
rate limiting) and trial-level failures from inside the optimizer. Both are designed to be readable
by humans and machines.

## HTTP status codes

| Code | Meaning |
|---|---|
| 200 | OK — the read succeeded |
| 400 | Bad request — a malformed or missing query parameter |
| 401 | Unauthorized — missing, invalid, or revoked API key |
| 404 | Not found — no such id, or it is not visible to your key |
| 405 | Method not allowed — the API is read-only; only GET is served |
| 429 | Too many requests — per-organization rate limit; honour Retry-After |
| 500 | Internal error — generic by design, and retryable |

> [!NOTE] 404 and 405 overlap on write verbs
> The API serves `GET` only. A `POST`, `PUT`, `PATCH` or `DELETE` to any path returns
> `405 Method Not Allowed` or `404 Not Found` — a router-level fallback makes the exact code
> version-dependent, so treat both as "this verb does not exist here". Resources are created and
> controlled in the Fintela app.

## Common request errors

All error bodies share the same shape — a single `message` field, and nothing else:

```json
{
  "message": "Invalid or revoked API key"
}
```

| Cause | Status | `message` |
|---|---|---|
| No Authorization header | 401 | Missing API key. Provide it via the `Authorization: Bearer <key>` header. |
| Revoked or unknown key | 401 | Invalid or revoked API key |
| Malformed id in a CSV filter (`?study_ids=1,x`) | 400 | `Invalid id: 'x'` |
| Required filter omitted (`study_ids`) | 400 | `study_ids required` |
| Unknown id, or one your key cannot see | 404 | Basket … not found / Trial … not found |
| Write verb on any path | 405 / 404 | — |
| Organization rate limit exceeded | 429 | Rate limit exceeded for your organization on the developer API; please slow down. |
| Anything unexpected server-side | 500 | Something went wrong on Fintela's side. Please try again in a moment. |

> [!WARNING] A hidden resource returns 404, not 403
> A key applies its owner's own visibility. A resource in another organization — or one shared with
> you only as `results_only` — behaves as if it does not exist rather than reporting that you lack
> access, so `404` means "not visible to this key" as often as it means "no such id".

> [!TIP] Back off on 429
> Rate limiting is **per organization** — a token bucket refilling at 20 requests per second with a
> burst of 40, shared by every key in the org. A `429` carries a `Retry-After: 1` header; the bucket
> refills in well under a second, so honouring it is enough to recover, while retrying immediately
> just re-feeds the limiter.

## Trial-level failures

Inside the optimizer, every failure mode collapses into a failed trial record. The reason is stored
as a `failure_reason` attribute on the trial and surfaced by `GET /studies/errors`.

| Cause | Trial state | `failure_reason` |
|---|---|---|
| Connection refused / DNS failure | PRUNED | Error details |
| Request timeout | PRUNED | `"timed out"` (or similar) |
| HTTP 4xx / 5xx from your endpoint | PRUNED | Exception message |
| Missing `signal` / `fitness` key | PRUNED | `KeyError('signal')` |
| Strategy returned empty `{}` | PRUNED | Strategy returned an empty signal — … |
| Exception in your endpoint handler | PRUNED | Error details |
| NaN fitness (train / val / overall) | PRUNED | `nan_fitness` |
| Batched simulation failure | PRUNED (whole batch) | Error details |
| Portfolio batch write failure | PRUNED (whole batch) | Error details |

> [!WARNING] No automatic retries
> A failed trial is not retried — the parameter sample is lost. If your external endpoint flakes,
> that trial is gone. Either harden your endpoint, raise `timeout`, or set `autostop_min_health` so
> the study halts when failure rate climbs too high.

## Reading trial errors

Get a per-study error dashboard via:

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/studies/errors?study_ids=42"
```

```json
{
  "data": {
    "42": {
      "error_summary": [
        { "failure_reason": "nan_fitness", "count": 12 },
        { "failure_reason": "Timeout",     "count": 3 }
      ],
      "failed_trials": [
        {
          "trial": 18,
          "failure_reason": "nan_fitness",
          "params": { "lookback": 7, "n_top": 1 }
        }
      ]
    }
  }
}
```

The summary groups failures by reason for quick triage; the `failed_trials` list gives you concrete
parameter combinations to reproduce locally.
