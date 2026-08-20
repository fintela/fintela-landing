---
title: Node.js · Express
section: Integration Guides
sectionOrder: 9
order: 2
published: true
updated: 2026-08-20
summary: The same external endpoints in the JavaScript ecosystem.
keywords: express, node, javascript, guide, external, simulate, evaluate, body limit, production checklist
---

Fintela reaches an external strategy at `POST {your-base-url}/simulate` and an external fitness
function at `POST {your-base-url}/evaluate`. This page builds one Express server that answers
both, with the body limits, socket timeouts and concurrency bounds a real study will actually
exercise. The contracts are identical to the ones the [Python · FastAPI](/docs/python-fastapi)
guide implements — you are choosing a language, not a different contract.

## The two contracts are mirror images

The single most expensive mistake on this page is assuming the two endpoints read their inputs
from the same place. They do not.

| | External strategy | External fitness |
|---|---|---|
| Path appended to your base URL | `/simulate` | `/evaluate` |
| Query string | `start_date`, `end_date` (both `YYYY-MM-DD`) | one key per declared parameter |
| JSON body | one key per declared parameter, plus `tickers` when a universe is configured | the simulation period: `equity`, `holdings`, `orders`, `trades`, `metrics` |
| Response key Fintela reads | `signal` | `fitness` |
| Calls per trial in a study | 1 | 3, or 4 with an out-of-sample window |
| Calls per validation | 2 | 1 |
| Health probe | `GET /health`, live portfolios only, 5 s timeout | none |

> [!WARNING] Do not copy one handler into the other
> The strategy takes dates from the query string and parameters from the body. The fitness
> function takes parameters from the query string and its payload from the body. Reading
> `req.body.risk_free` on `/evaluate` yields `undefined` in every environment, including the one
> where your tests pass.

Every query-string value arrives as a **string** — the HTTP client serializes it, and nothing
coerces it back. `req.query.risk_free` is `"0.02"`, never `0.02`, so coerce with `Number(...)` and
check the result, as `queryNumber` below does. In a study, a fitness parameter declared `integer`
is coerced to a real integer before the request goes out, so a stored `15.0` arrives as `"15"` —
and a stored value with a genuine fractional part fails the study rather than being truncated.

In a study the strategy is called once over the whole window: `train_start_date` through the
out-of-sample end date, or through the validation end date when the study has no out-of-sample
segment. You return the entire signal for that window in one response.

## Project setup

```json
{
  "name": "fintela-endpoints",
  "private": true,
  "type": "module",
  "engines": { "node": ">=18" },
  "scripts": { "start": "node server.js" },
  "dependencies": { "express": "^5.1.0" }
}
```

```bash
npm install
npm start
```

`"type": "module"` is load-bearing: without it Node parses `server.js` as CommonJS and the first
`import` throws `SyntaxError: Cannot use import statement outside a module`. Node 18 is the floor
because the test script below uses the global `fetch`.

The server works on Express 4 and 5 alike. Express 5 forwards a rejected promise from a handler
to the error middleware on its own; Express 4 does not, so the `guarded` wrapper below catches
handler errors itself rather than relying on either.

## The server

One file, both endpoints, nothing elided. `server.js`:

```js
import express from "express";

const PORT = Number(process.env.PORT ?? 8000);
const MAX_IN_FLIGHT = Number(process.env.MAX_IN_FLIGHT ?? 4);

const app = express();
app.disable("x-powered-by");

// ── Concurrency guard ───────────────────────────────────────────────────────
// Node runs your handlers on one thread. Bound in-flight work and shed the
// excess with 503 — one of the four statuses Fintela retries with backoff.
let inFlight = 0;

const guarded = (handler) => (req, res) => {
  if (inFlight >= MAX_IN_FLIGHT) {
    res.status(503).json({ error: "at capacity" });
    return;
  }
  inFlight += 1;
  Promise.resolve()
    .then(() => handler(req, res))
    .catch((err) => {
      console.error(`${req.method} ${req.originalUrl} failed`, err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    })
    .finally(() => {
      inFlight -= 1;
    });
};

// ── Strategy: POST /simulate ────────────────────────────────────────────────
// Dates arrive in the query string. Parameters, plus an optional `tickers`
// array, arrive in the JSON body.

const FALLBACK_UNIVERSE = ["AAPL", "MSFT", "NVDA"];

function rebalanceDates(startDate, endDate) {
  // Illustrative cadence: the first weekday of each month in the window. A real
  // endpoint aligns these to the exchange calendar it trades.
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error(`unparseable window ${startDate}..${endDate}`);
  }
  const dates = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor <= end) {
    const day = new Date(cursor);
    while (day.getUTCDay() === 0 || day.getUTCDay() === 6) {
      day.setUTCDate(day.getUTCDate() + 1);
    }
    if (day >= start && day <= end) dates.push(day.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return dates;
}

function equalWeight(book) {
  // Truncate each weight to six decimals so the per-date sum can only ever land
  // at or below 1: the validator rejects a date whose allocations sum above
  // 1.0 + 1e-6, and rounding up is how you get there.
  const allocation = Math.floor((1 / book.length) * 1e6) / 1e6;
  return Object.fromEntries(book.map((t) => [t, { position: "L", allocation }]));
}

app.post(
  "/simulate",
  express.json({ limit: "1mb" }),
  guarded((req, res) => {
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    if (typeof startDate !== "string" || typeof endDate !== "string") {
      res.status(400).json({ error: "start_date and end_date are required" });
      return;
    }

    // `tickers` is the universe, added by Fintela alongside your parameters:
    // the study's asset group during a run, and the validation universe (when
    // you set one) at validation. Absent otherwise.
    const { tickers, ...params } = req.body ?? {};
    const universe =
      Array.isArray(tickers) && tickers.length > 0 ? tickers : FALLBACK_UNIVERSE;

    // `lookback_window` is declared on the record and returned by
    // required_lookback(...) so Fintela warms enough price history; this
    // placeholder holds no prices of its own, so only book_size is used.
    const bookSize = Math.max(
      1,
      Math.min(universe.length, Math.trunc(Number(params.book_size ?? 3)) || 1),
    );
    const book = universe.slice(0, bookSize);

    const signal = {};
    for (const date of rebalanceDates(startDate, endDate)) {
      signal[date] = equalWeight(book);
    }

    if (Object.keys(signal).length === 0) {
      // An empty signal is not a legal answer: validation rejects it with
      // "Output dict is empty — strategy must return at least one date entry".
      res.status(422).json({ error: "no rebalance date inside the window" });
      return;
    }
    res.json({ signal });
  }),
);

// ── Fitness: POST /evaluate ─────────────────────────────────────────────────
// Parameters arrive in the query string. The simulation period arrives in the
// JSON body.

const NOT_SCOREABLE = '{"fitness": NaN}';

function queryNumber(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

app.post(
  "/evaluate",
  express.json({ limit: "64mb" }),
  guarded((req, res) => {
    const riskFree = queryNumber(req.query.risk_free, 0);
    const drawdownWeight = queryNumber(req.query.drawdown_weight, 1);

    const { metrics = {}, trades = [] } = req.body ?? {};
    const sharpe = metrics.sharpe_ratio;
    const drawdown = metrics.max_drawdown;

    // Degenerate windows are real: no trades at all, or a `metrics` object that
    // simply does not carry the key for this window. NaN prunes the trial
    // cleanly; `Number.isFinite` rejects `undefined` and `null` alike.
    if (!Number.isFinite(sharpe) || !Number.isFinite(drawdown) || trades.length === 0) {
      res.type("application/json").send(NOT_SCOREABLE);
      return;
    }

    // Illustrative arithmetic — Fintela reads the number, never the formula.
    const fitness = sharpe - riskFree - drawdownWeight * Math.abs(drawdown);
    if (!Number.isFinite(fitness)) {
      res.type("application/json").send(NOT_SCOREABLE);
      return;
    }
    res.json({ fitness });
  }),
);

// ── Health probe ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Fallbacks ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `no route for ${req.method} ${req.path}` });
});

app.use((err, req, res, _next) => {
  // Body-parser rejects an oversized body here with status 413. Log it: in the
  // study errors panel every 4xx collapses into one classification.
  console.error(`${req.method} ${req.originalUrl} rejected`, err);
  const status = Number(err.status ?? err.statusCode ?? 500);
  if (!res.headersSent) res.status(status).json({ error: err.message });
});

// ── Listen ──────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`listening on :${PORT}, max ${MAX_IN_FLIGHT} in flight`);
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

process.on("SIGTERM", () => server.close(() => process.exit(0)));
```

The signal shape is `date → ticker → { position, allocation }`, with `position` exactly `"L"` or
`"S"`. Four allocation rules are enforced by the validator and worth internalising before you
write a real allocator:

| Rule | Consequence of breaking it |
|---|---|
| `allocation` is a finite number | Rejected — allocations must be finite |
| `allocation` is strictly greater than zero | Rejected — filter out names you do not intend to trade instead of emitting a zero weight |
| `allocation` is at most `1` | Rejected — normalise before returning |
| The allocations on one date sum to at most `1.0 + 1e-6` | Rejected — the excess is reported in the message |

The full rule table, with the exact message for each, is in
[External strategies](/docs/external-strategies).

## Body size limits

Express's JSON parser defaults to a **`100kb`** limit. That is comfortable for `/simulate`, whose
body is a handful of parameters plus a ticker list, and far too small for `/evaluate`, whose body
is the simulation sliced to the scored window: one equity point per trading day, a holdings array
per date, and every order and trade in that window. It grows with the window length and the size
of the book.

Mount the parser per route rather than globally, so a 60 MB body cannot reach the strategy
handler:

```js
app.post("/simulate", express.json({ limit: "1mb" }), handler);
app.post("/evaluate", express.json({ limit: "64mb" }), handler);
```

> [!CAUTION] A 413 is a dead trial, not a retry
> When the body exceeds the limit the parser raises a `413` before your handler runs, and the
> error middleware above turns it into `{"error":"request entity too large"}`. Fintela classifies
> **any** 4xx as
> `ENDPOINT_REJECTED_REQUEST` and does not retry it — the trial is pruned and the user is told to
> check the endpoint's address, authentication and expected body. Nothing in that message points
> at a body limit, which is why the error handler above logs the failure on your side.

## Timeouts and keep-alive

Node's HTTP server defaults are the wrong shape for Fintela's pooled clients.

| Setting | Node default | Set it to | Why |
|---|---|---|---|
| `server.keepAliveTimeout` | `5000` (5 s) | `65000` | The optimizer, the sandbox and the portfolio updater hold idle pooled connections for **30 s**. A 5 s server-side idle timeout closes sockets Fintela is about to reuse, and the reuse fails as `ENDPOINT_DROPPED_CONNECTION`. |
| `server.headersTimeout` | `60000` | `66000` | Keep it above `keepAliveTimeout` so the headers timer never expires on a socket that is only being held open for reuse. |
| `server.requestTimeout` | `300000` (5 min) | leave alone | Already far above any timeout Fintela uses; the client always gives up first. |

Your own upstream calls — a database, a data vendor — must time out **sooner** than the timeout
registered on the Fintela record (**Timeout (seconds)**, default `30`). If Fintela's read timeout
fires first the trial is pruned as `ENDPOINT_TOO_SLOW`, and a read timeout is deliberately **not**
retried by the optimizer, the sandbox or the updater: the request was accepted, so retrying only
doubles the load on an already-slow service.

> [!NOTE] Validation ignores the timeout you registered
> The compiler's validation client uses a fixed **30 seconds** regardless of the stored `timeout`,
> and it calls `/simulate` twice. Raising **Timeout (seconds)** does not buy validation more time;
> shrinking the validation window does.

## Concurrency and load shedding

**Max Concurrency** on the record is not a connection limit — every Fintela client pool is fixed
at 2 connections. It is the worker budget the dispatcher gives a study with an external component,
and each worker holds one in-flight request, so the practical ceiling of simultaneous requests
against your server is that number. Size `MAX_IN_FLIGHT` at or above it, and serve the endpoint
with at least two workers.

Shedding matters because Fintela retries a specific set of statuses and nothing else.

| What you return | Optimizer, sandbox, portfolio updater | Compiler validation |
|---|---|---|
| `429`, `502`, `503`, `504` | Retried — 1 attempt plus 3 retries, full-jitter exponential backoff, base 1 s, ceiling 8 s | **Not retried**; validation fails with `Endpoint returned HTTP {status}: {first 500 characters of the body}` |
| Any other `4xx` | Not retried — pruned as `ENDPOINT_REJECTED_REQUEST` | Fails the same way |
| Any other `5xx` | Not retried — pruned as `ENDPOINT_SERVER_ERROR` | Fails the same way |

The backoff is drawn uniformly from zero to the ceiling, and `Retry-After` is ignored. The three
sleeps cap out at 1 s, 2 s and 4 s, so the whole retry budget buys at most about seven seconds of
relief; a `503` that outlives it still prunes the trial. Shedding is a safety valve, not a
scheduler.

> [!WARNING] A synchronous scorer defeats the guard
> `inFlight` only rises above 1 if your handler yields. A CPU-bound scoring loop blocks the event
> loop, so requests pile up in the kernel accept queue instead of being shed, and they all time
> out together as `ENDPOINT_UNREACHABLE` or `ENDPOINT_TOO_SLOW`. Move heavy work to
> `node:worker_threads`, or run more processes and let each one carry a small `MAX_IN_FLIGHT`.

## Returning a non-scoreable trial

NaN is the supported way to tell Fintela that a configuration cannot be scored: the trial is
pruned with the reason `nan_fitness` and shown in the errors panel as **Fitness wasn't a number**.
Returning a large negative number instead makes an unscoreable trial comparable to real ones and
skews the search.

JavaScript makes this awkward. `JSON.stringify(NaN)` produces `null`, so `res.json({ fitness: NaN })`
puts `{"fitness":null}` on the wire — and a null score is not NaN. It fails later, in a different
place, with an error that names neither your endpoint nor the reason.

```js
// Wrong — becomes {"fitness":null}
res.json({ fitness: NaN });

// Right — Fintela parses the reply with Python's json module, which accepts a
// bare NaN literal.
res.type("application/json").send('{"fitness": NaN}');
```

Only the top-level `fitness` key is read; anything else in the object is ignored. Validation
requires the same key, and rejects a non-numeric value with
`'fitness' must be a number, got {type}` — which is exactly how the `null` that
`res.json({ fitness: NaN })` produces fails, by name, before you ever launch a study.

## Mounting under a base path

Fintela appends `/simulate`, `/evaluate` and `/health` to the base URL you register, after
stripping a trailing slash. Registering `https://api.example.com/quant` means serving
`/quant/simulate`. Lift the two handler bodies above into named functions and mount them on an
`express.Router` once, rather than rewriting every path:

```js
function simulate(req, res) { /* the /simulate body from above */ }
function evaluate(req, res) { /* the /evaluate body from above */ }

const api = express.Router();

api.post("/simulate", express.json({ limit: "1mb" }), guarded(simulate));
api.post("/evaluate", express.json({ limit: "64mb" }), guarded(evaluate));
api.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/quant", api);
```

This is worth doing deliberately, because the path is the only secret in the contract.
**Fintela sends no credentials** — no API key field, no header configuration, no bearer token, no
request signing. An endpoint that answers unauthenticated calls with `401` or `403` prunes every
trial as `ENDPOINT_REJECTED_REQUEST`. A hard-to-guess path segment survives into every call and is
the one lever the contract leaves you.

## Registering the two records

Both records store the same three keys and nothing else:

```json
{
  "endpoint": "https://api.example.com/quant",
  "timeout": 30,
  "max_concurrency": 4
}
```

The endpoint must be publicly routable. `localhost`, `*.localhost` and any literal private,
loopback, link-local or reserved IP are rejected at save time with **HTTP 406** and
`kind: "not_acceptable"`; a public hostname that resolves to a private address is refused again at
call time. Plain `http://` is accepted — the editor warns about cleartext but never blocks it.

The two `parameters` shapes differ, and the difference is not cosmetic.

| | `POST /strategies` | `POST /fitness` |
|---|---|---|
| `parameters` | an object keyed by parameter name | an array of declarations |
| Key naming the parameter | the object key | `parameter_name` |
| Type field | `datatype` — `integer`, `float` or `categorical`, case-insensitive | `dtype` — `integer` or `float`, defaulting to `float` when omitted |
| Other required fields | `is_window` (boolean) | none |
| Lookback | a non-empty `lookback_function_code`; `lookback_mode` defaults to `function`, the only accepted value | not applicable |

The strategy:

```json
{
  "name": "monthly_equal_weight",
  "description": "Equal-weight the first N names of the universe, monthly.",
  "execution_type": "external",
  "execution_details": {
    "endpoint": "https://api.example.com/quant",
    "timeout": 30,
    "max_concurrency": 4
  },
  "parameters": {
    "book_size": { "datatype": "integer", "is_window": false, "test_value": 3 },
    "lookback_window": { "datatype": "integer", "is_window": false, "test_value": 60 }
  },
  "lookback_mode": "function",
  "lookback_function_code": "def required_lookback(book_size, lookback_window):\n    return lookback_window",
  "data_sources": []
}
```

The fitness function:

```json
{
  "name": "drawdown_penalised_sharpe",
  "description": "Sharpe with a configurable drawdown penalty.",
  "execution_type": "external",
  "execution_details": {
    "endpoint": "https://api.example.com/quant",
    "timeout": 30,
    "max_concurrency": 4
  },
  "parameters": [
    { "parameter_name": "risk_free", "dtype": "float", "test_value": 0.02 },
    { "parameter_name": "drawdown_weight", "dtype": "float", "test_value": 1.5 }
  ],
  "data_sources": []
}
```

Both answer **201 Created** with the new id inside a `data` envelope: `{"data": 42}`.
`lookback_function_code` is mandatory for external strategies too — omitting it fails with
`A required_lookback(...) function is required (lookback_function_code must be non-empty).`
In the editor the Internal/External selector is only enabled while you are creating a strategy, so
changing an existing record's modality is not something the UI offers.

> [!CAUTION] One base URL for both records halves your worker budget
> When a study's strategy and fitness resolve to the **same** endpoint — compared after trimming,
> dropping a trailing slash and lowercasing — the dispatcher gives the study
> `min(strategy, fitness) / 2` workers, floored, minimum 1, because each trial hits that one
> server on both paths. Two distinct base URLs keep the budget at `min(strategy, fitness)` —
> mount two Routers, register `https://api.example.com/quant/strategy` on the strategy and
> `https://api.example.com/quant/fitness` on the fitness function, and serve
> `/quant/strategy/simulate`, `/quant/strategy/health` and `/quant/fitness/evaluate`. Either way
> the optimizer caps per-batch fan-out at 32, so a budget above 32 buys nothing.

> [!CAUTION] Never declare a strategy parameter named `tickers`
> It collides with the universe key Fintela adds to the `/simulate` body. At validation your
> parameter wins, the universe is not forwarded, and the run carries the warning *"validation_universe
> tickers were not forwarded to the endpoint: a strategy parameter named 'tickers' already occupies
> that body key."* In a study there is no such guard — the universe overwrites your parameter.

## Testing before you register

Exercise both paths against the running server first — a failed save costs a round trip through
the async validation job.

```bash
curl -X POST "http://127.0.0.1:8000/simulate?start_date=2024-01-01&end_date=2024-06-30" \
     -H "Content-Type: application/json" \
     -d '{"book_size": 3, "lookback_window": 60, "tickers": ["AAPL", "MSFT", "NVDA"]}'

curl -X POST "http://127.0.0.1:8000/evaluate?risk_free=0.02&drawdown_weight=1.5" \
     -H "Content-Type: application/json" \
     -d '{"equity":{"2024-01-02":100000},"holdings":{},"orders":[],
          "trades":[{"ticker_code":"AAPL","position_side":"L","entry_date":"2024-01-02",
                     "exit_date":"2024-02-01","total_pnl":118.0}],
          "metrics":{"sharpe_ratio":1.2,"max_drawdown":-0.1}}'

curl http://127.0.0.1:8000/health
```

The `trades` array in that second call is not decoration: with it empty the handler takes its
degenerate branch and answers `{"fitness": NaN}`, so a payload without a trade tests the wrong
path. Fintela's own validation fixture carries one closed trade for the same reason.

Then reproduce the causality check that validation performs. It calls `/simulate` twice — once
over your window, once with `end_date` pushed out by **730 days** — and rejects the save if any
date present in the first response is missing from the second, or if a ticker set, `position` or
`allocation` changed for a past date. `causality-check.mjs`:

```js
const base = (process.argv[2] ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const params = { book_size: 3, lookback_window: 60 };
const start = "2024-01-01";
const end = "2024-06-30";

const extended = new Date(`${end}T00:00:00Z`);
extended.setUTCDate(extended.getUTCDate() + 730);

async function simulate(endDate) {
  const url = new URL(`${base}/simulate`);
  url.searchParams.set("start_date", start);
  url.searchParams.set("end_date", endDate);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 500)}`);
  const body = await r.json();
  if (!body || typeof body.signal !== "object") {
    throw new Error("response has no top-level `signal` object");
  }
  return body.signal;
}

const canon = (v) =>
  v && typeof v === "object" && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])]))
    : v;

const short = await simulate(end);
const long = await simulate(extended.toISOString().slice(0, 10));

let leaks = 0;
for (const [date, positions] of Object.entries(short)) {
  if (JSON.stringify(canon(long[date])) !== JSON.stringify(canon(positions))) {
    console.error(`leak on ${date}`);
    leaks += 1;
  }
}
console.log(leaks === 0 ? `causal — ${Object.keys(short).length} dates unchanged` : `${leaks} date(s) changed`);
process.exit(leaks === 0 ? 0 : 1);
```

```bash
node causality-check.mjs http://127.0.0.1:8000
```

Two consequences of that probe: your endpoint must tolerate an `end_date` two years past the end
of your data without erroring, and it must not revise a past decision when more data arrives.

## What a failure looks like in a study

A study never retries a trial. Once the bounded HTTP retries are exhausted, whatever went wrong
prunes that trial and the study continues with the rest. Each pruned trial carries a classified
failure in the study's errors panel — see [Studies](/docs/studies).

| Kind | What your Express server did |
|---|---|
| `ENDPOINT_REJECTED_REQUEST` | Returned any 4xx — including the `413` from an exceeded body limit and the `404` from a path that does not match your routes |
| `ENDPOINT_SERVER_ERROR` | Returned a 5xx: `500` immediately, `502`/`503`/`504` after the retries |
| `ENDPOINT_TOO_SLOW` | Accepted the request and did not answer within the registered timeout. Never retried. |
| `ENDPOINT_UNREACHABLE` | Left the connect or pool attempt to time out — a saturated accept queue |
| `ENDPOINT_REFUSED` | Was not listening at that moment |
| `ENDPOINT_DROPPED_CONNECTION` | Closed a pooled keep-alive socket mid-reuse — `keepAliveTimeout` under 30 s |
| `EXTERNAL_BAD_RESPONSE` | Answered 200 with the wrong shape — `res.json(signal)` instead of `res.json({ signal })` |
| `FITNESS_NOT_A_NUMBER` | Returned a NaN score |
| `SIGNAL_TICKERS_NOT_IN_CLUSTER` | Emitted tickers outside the study's [asset group](/docs/asset-groups) |
| `ENDPOINT_BLOCKED` | Published on a host that does not resolve, or resolves to a private address |

`ENDPOINT_BLOCKED` is the only one caught before the first trial: the optimizer screens both
external endpoints at preflight, so a bad address fails the study once instead of producing N
identical prunes.

## Production checklist

| Check | Why it is on the list |
|---|---|
| `"type": "module"` in `package.json` | Otherwise the first `import` throws at startup |
| `express.json({ limit })` mounted per route | The `100kb` default turns `/evaluate` into a stream of `413`s |
| `server.keepAliveTimeout = 65_000` | Fintela reuses idle sockets for 30 s; Node's 5 s default closes them first |
| `server.headersTimeout` above `keepAliveTimeout` | Keeps the headers timer off sockets that are only being held open for reuse |
| Upstream timeouts shorter than the registered **Timeout (seconds)** | A read timeout is never retried |
| Answer the validation window within 30 s | Validation ignores the stored timeout |
| `MAX_IN_FLIGHT` at or above the registered **Max Concurrency** | The budget is what the dispatcher will actually send |
| At least two workers, and heavy work off the event loop | One blocked thread turns every queued request into a prune |
| Shed with `503`, never `400` | Only `429`, `502`, `503` and `504` are retried |
| No authentication that can reject Fintela | No credentials are sent; a `401` prunes every trial |
| `GET /health` returning 2xx | Required before every daily extend of a [live portfolio](/docs/live-trading) backed by an external strategy, on a 5 s timeout |
| `{"fitness": NaN}` sent as a raw string | `res.json({ fitness: NaN })` serializes to `null` |
| Allocations above 0, at most 1, summing to at most `1.0 + 1e-6` per date | Each is a hard validator rule |
| Only tickers from the study's asset group | Anything else fails the trial |
| No strategy parameter named `tickers` | It collides with the universe key |
| A publicly routable address | Private and loopback hosts are refused at save time and at call time |
| Structured logs of the query string and body of every call | The errors panel gives you a class, not your request |

The contracts themselves, in full, are in [External strategies](/docs/external-strategies) and
[External fitness](/docs/external-fitness); the trade-offs against running Python inside Fintela
are in [Execution modes](/docs/execution-modes). The endpoint tables for the registration payloads
above are in [Strategies API](/docs/api-strategies) and [Fitness API](/docs/api-fitness), and the
status codes in [Error reference](/docs/api-errors).
