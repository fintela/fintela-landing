---
title: Node.js · Express
section: Integration Guides
sectionOrder: 5
order: 2
published: true
updated: 2026-08-04
summary: Same pattern, JavaScript ecosystem.
keywords: express, node, javascript, guide, body limit, production checklist
---

For teams whose stack is already JavaScript or TypeScript, an Express server can host both
endpoints with the same pattern as the Python guide.

## 1. Install

```bash
npm init -y
npm install express
```

## 2. Combined server

A single Express app can serve both endpoints. Register two Fintela records — one for the
strategy, one for the fitness — pointing at the same base URL. `server.js`:

```js
import express from "express";

const app = express();
app.use(express.json({ limit: "20mb" }));

// ───── Strategy ─────
app.post("/simulate", (req, res) => {
  const { start_date, end_date } = req.query;
  const params = req.body;

  // Your logic — build positions by date.
  const signal = {
    "2024-01-02": {
      AAPL: { position: "L", allocation: 0.5 },
      MSFT: { position: "L", allocation: 0.5 },
    },
  };

  res.json({ signal });
});

// ───── Fitness ─────
app.post("/evaluate", (req, res) => {
  const { risk_free = 0.02 } = req.query;
  const simulation_period = req.body;

  // Your scoring logic.
  const fitness = computeScore(simulation_period, Number(risk_free));

  res.json({ fitness });
});

app.get("/healthz", (_, res) => res.json({ ok: true }));

function computeScore(period, riskFree) {
  // ... placeholder
  return 1.32;
}

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`listening on ${port}`));
```

> [!WARNING] Body size limit
> The default Express body limit is 100kb — too small for some simulation periods. Bump it to
> `20mb` (as shown) or even higher for studies with long windows and many tickers.

## 3. Production checklist

Four things to wire up before letting a real study point at your endpoint:

```bash
# 1. Validate the payload
npm install zod
# Define schemas for params + simulation_period; reject malformed bodies early.

# 2. Bound concurrency
# Express does not bound by default — use a reverse proxy or set the
# Fintela strategy record's max_concurrency to match your container CPU.

# 3. Log every trial
# Log the trial's params + duration. You'll need this when debugging PRUNED
# trials surfaced by GET /studies/errors.

# 4. Handle slow downstream services
# If your code calls a database or upstream API, ensure timeouts
# are *shorter* than the strategy's `timeout` setting — otherwise
# Fintela kills the request and your work is wasted.
```

> [!TIP] See also
> Pair this with the [errors page](/docs/api-errors) to understand how endpoint failures surface
> inside Fintela, and the [external strategies](/docs/external-strategies) reference for the
> full contract.
