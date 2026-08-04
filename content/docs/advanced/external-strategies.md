---
title: External strategies
section: Advanced
sectionOrder: 4
order: 1
published: true
updated: 2026-08-04
summary: Host your signal generator behind your own HTTPS endpoint.
keywords: external strategy, simulate endpoint, http, signal, self-hosted, max_concurrency, timeout
---

An external strategy is an HTTPS endpoint that you own. Fintela stores only the URL and
HTTP-client settings — your code never leaves your infrastructure.

## When to use

- Your alpha is in the strategy code and must stay on your servers
- You already have a research stack in another language or runtime
- You need direct access to private data, internal models, or licensed feeds
- You want to A/B test signal-generation versions independently of Fintela deploys

## Endpoint contract

The optimizer calls your endpoint once per trial. Your service must accept a `POST` to
`/simulate` with parameters in the body and dates in the query string, and return a JSON
signal.

```http
POST {your-endpoint}/simulate
```

Generate position signals for a date range using a parameter sample.

### Request

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `start_date` | string · YYYY-MM-DD | yes | Inclusive start of the simulation window. |
| `end_date` | string · YYYY-MM-DD | yes | Inclusive end of the simulation window. |

**Body**

Flat map of declared parameter names to values for this trial — numbers for integer/float
parameters, the chosen string for categorical ones. Example:
`{"lookback": 20, "z_thresh": 1.5, "regime": "trending"}`.

### Response

Return a JSON body with a top-level `signal` key. The value is a nested map:
`date → ticker → { position, allocation }`.

```json
{
  "signal": {
    "2024-01-02": {
      "AAPL": { "position": "L", "allocation": 0.5 },
      "MSFT": { "position": "L", "allocation": 0.5 }
    },
    "2024-02-01": {
      "AAPL": { "position": "S", "allocation": 0.3 }
    }
  }
}
```

| Field | Type | Notes |
|---|---|---|
| date | string · YYYY-MM-DD | Trade date — must fall within the requested window |
| ticker | string | Must be present in the asset group |
| `position` | `"L"` \| `"S"` | Long or short |
| `allocation` | number ∈ [0, 1] | Portfolio weight |

> [!WARNING] Asymmetry: body vs query string
> Parameters travel in the JSON body; dates travel in the query string. This is the current
> contract and is mirrored in the validation endpoint. External fitness uses the inverse
> pattern (params in query, simulation period in body) — keep this in mind if you maintain
> both endpoints.

## Registering the strategy

Once your endpoint is live, create a Fintela strategy record pointing at its base URL.

```json
POST /strategies

{
  "name": "proprietary_v2",
  "description": "Mean-reversion using internal regime model.",
  "execution_type": "external",
  "execution_details": {
    "endpoint":         "https://my-strategy.example.com",
    "timeout":          30.0,
    "max_concurrency":  8
  },
  "parameters": {
    "lookback": { "datatype": "integer", "is_window": true },
    "z_thresh": { "datatype": "float",   "is_window": false },
    "regime":   { "datatype": "categorical", "is_window": false,
                  "choices": ["trending", "mean_reverting"] }
  }
}
```

**`execution_details`**

| Name | Type | Default | Description |
|---|---|---|---|
| `endpoint` | string · URL | — (required) | Base URL — the optimizer appends `/simulate`. |
| `timeout` | number · seconds | `30.0` | Per-request timeout passed to the HTTP client. |
| `max_concurrency` | integer | `4` | Maximum simultaneous connections to your endpoint per optimizer worker. |

## HTTP client configuration

The optimizer maintains a persistent connection pool to your endpoint, sized to
`max_concurrency`. Connections are reused across trials within the same worker to minimise
TLS handshake overhead.

| Setting | Value |
|---|---|
| Target URL | `execution_details.endpoint` |
| Max simultaneous connections | `max_concurrency` |
| Keep-alive pool size | `max_concurrency` |
| Per-request timeout | `timeout` seconds |

## Failure handling

Every failure mode is collapsed into a pruned trial. Connection refused, DNS error, timeout,
HTTP 4xx/5xx, malformed JSON, missing `signal` key — all mark the trial as failed. The failure
message is stored on the trial and visible under `GET /studies/errors`.

> [!CAUTION] No retries today
> A failed trial is not automatically retried. If your endpoint flakes, that trial is gone —
> increase `timeout`, provision more headroom, or harden your service before launching large
> studies.

## Reference examples

Minimal reference implementations in three flavours — drop these into a container, expose port
8000, and you're ready to register the strategy.

**Python · FastAPI**

```python
from fastapi import FastAPI, Query
from pydantic import BaseModel

app = FastAPI()

class SignalResponse(BaseModel):
    signal: dict

@app.post("/simulate", response_model=SignalResponse)
def simulate(
    params: dict,
    start_date: str = Query(...),
    end_date:   str = Query(...),
):
    # Build positions per date.
    # Each entry: {"position": "L" | "S", "allocation": float}
    return SignalResponse(signal={
        "2024-01-02": {
            "AAPL": {"position": "L", "allocation": 0.5},
            "MSFT": {"position": "L", "allocation": 0.5},
        },
    })
```

**Node.js · Express**

```js
import express from "express";

const app = express();
app.use(express.json());

app.post("/simulate", (req, res) => {
  const { start_date, end_date } = req.query;
  const params = req.body;

  // Your logic — build positions per date.
  res.json({
    signal: {
      "2024-01-02": {
        AAPL: { position: "L", allocation: 0.5 },
        MSFT: { position: "L", allocation: 0.5 },
      },
    },
  });
});

app.listen(8000);
```

**cURL · test call**

```bash
curl -X POST "https://my-strategy.example.com/simulate?start_date=2024-01-01&end_date=2024-12-31" \
     -H "Content-Type: application/json" \
     -d '{"lookback_window": 20, "n_top": 5}'
```

For a full walkthrough of either stack, see [Python · FastAPI](/docs/python-fastapi) and
[Node.js · Express](/docs/node-express).
