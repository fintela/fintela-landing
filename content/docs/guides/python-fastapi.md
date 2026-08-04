---
title: Python · FastAPI
section: Integration Guides
sectionOrder: 5
order: 1
published: true
updated: 2026-08-04
summary: Host strategy and fitness endpoints with FastAPI in 50 lines.
keywords: fastapi, python, uvicorn, guide, docker, deploy
---

Host a strategy and fitness function behind a FastAPI service in about fifty lines of code.
Production-ready Dockerfile included.

## 1. Install

```bash
pip install fastapi uvicorn[standard] pandas
```

## 2. Strategy endpoint

The endpoint accepts the trial's parameters in the JSON body and the simulation window as query
parameters. Return a signal map of dates to ticker positions — `strategy.py`:

```python
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import Literal
import pandas as pd

app = FastAPI()


class Position(BaseModel):
    position: Literal["L", "S"]
    allocation: float


@app.post("/simulate")
def simulate(
    params: dict,
    start_date: str = Query(...),
    end_date:   str = Query(...),
):
    """
    Generate a signal for the given window using `params`.
    Returns: { signal: { "YYYY-MM-DD": { "TICKER": {position, allocation} } } }
    """
    lookback = int(params.get("lookback", 20))
    n_top    = int(params.get("n_top", 5))

    # ... fetch your data, build your signal ...
    dates = pd.date_range(start_date, end_date, freq="MS").strftime("%Y-%m-%d")
    signal = {
        d: {"AAPL": {"position": "L", "allocation": 1.0}}
        for d in dates
    }
    return {"signal": signal}


@app.get("/healthz")
def health():
    return {"ok": True}
```

## 3. Fitness endpoint

The fitness endpoint receives the simulation period in the body and any configured fitness
parameters in the query string. Return a single `fitness` float — `fitness.py`:

```python
from fastapi import FastAPI, Query

app = FastAPI()


@app.post("/evaluate")
def evaluate(
    simulation_period: dict,
    risk_free: float = Query(0.02),
    drawdown_weight: float = Query(1.0),
):
    """
    Score one simulated stage. Return a float wrapped in { "fitness": ... }.
    """
    trades = simulation_period.get("trades", [])
    equity = simulation_period.get("equity", {})

    # ... compute your custom score ...
    score = 1.4
    return {"fitness": score}
```

> [!TIP] Combine into one service
> Nothing stops you from serving both endpoints from the same FastAPI app — mount `/simulate`
> and `/evaluate` alongside each other. Just register the strategy and fitness records pointing
> at the same base URL.

## 4. Deploy

### Container

`Dockerfile`:

```bash
# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & push

```bash
docker build -t my-strategy:latest .
docker push registry.example.com/my-strategy:latest
```

### Expose via HTTPS

Behind an ALB, Cloud Run, Fly.io — anywhere reachable from Fintela's VPC over a public HTTPS
hostname. The optimizer uses keep-alive, so terminating proxies at the edge is fine.

## 5. Register on Fintela

`Registry → Strategies → + New Strategy → External`

Once your endpoint is reachable, create the strategy record in the Fintela app. Choose
**External**, paste your HTTPS base URL, and declare the parameters the optimizer will sweep —
`lookback` as a window, `n_top` as a plain integer. The timeout and max-concurrency Fintela
will apply to your service are set on the same form.

Then create a fitness record the same way (pointing at your `/evaluate` endpoint), and you're
ready to launch a study — see the [quickstart](/docs/quickstart) for the walkthrough.

To confirm the record exists from your own tooling, read it back over the read-only developer
API:

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/strategies
```

> [!SUCCESS] That's it
> You now own the strategy logic, Fintela owns orchestration, sampling, and portfolio
> analytics. Same productivity, different trust boundary.
