---
title: System architecture
section: Getting Started
sectionOrder: 1
order: 2
published: true
updated: 2026-08-20
summary: How the SPA, API, compute engines and data workers fit together.
keywords: architecture, system, spa, api, backend, simulation engine, optimizer, workers, data, keycloak, postgres
---

Fintela is not one program. The page you click is a static React app; the API it calls is a Rust
service; the Python you write runs in separate containers, some of them launched for one job and
never spoken to again; and the market data underneath is assembled overnight by a fleet of
scheduled jobs. Nothing is joined by a message bus — one PostgreSQL database carries every piece of
shared state between them. This page is the orientation: what runs where, what finishes inside your
request and what carries on after it returns, and which parts of the system your own code actually
touches.

## The shape of the system

```text
  ┌──────────────────────────────────────────────────────────────────────┐
  │ EDGE      app.fintela.io — the React SPA, static files on CloudFront │
  └───────────────────────────────┬──────────────────────────────────────┘
                                  │ Keycloak JWT on every call
  ┌───────────────────────────────┴──────────────────────────────────────┐
  │ APPLICATION                                                          │
  │   keycloak.fintela.io   sign-in, refresh, signing keys               │
  │   backend.fintela.io    the Rust API — every read and every write    │
  │   stripe.fintela.io     token packages and checkout                  │
  │   developer.fintela.io  read-only API for integrations (API keys)    │
  └───────────────────────────────┬──────────────────────────────────────┘
                                  │ internal hop — never from a browser
  ┌───────────────────────────────┴──────────────────────────────────────┐
  │ COMPUTE                                                              │
  │   python-compiler      validates your code                           │
  │   strategy-sandbox ──▶ simulation-engine    one-off backtest         │
  │   ai-agent             Fintelligent turns                            │
  │   optimizer            on-demand task, one per slice of a study      │
  │   portfolio-updater    on-demand task, daily extension of a book     │
  │   lab-kernel           on-demand task, one per Laboratory session    │
  └───────────────────────────────┬──────────────────────────────────────┘
                                  │ every service reads and writes it
  ┌───────────────────────────────┴──────────────────────────────────────┐
  │ DATA      Aurora PostgreSQL — registries, trials, portfolios,        │
  │           market data, the token ledger, and the work queue itself   │
  │           5 long-running workers · 28 scheduled jobs fill it         │
  └──────────────────────────────────────────────────────────────────────┘
```

Every service in the application and compute planes runs as a container on AWS Fargate in one ECS
cluster; the database underneath is a managed Aurora PostgreSQL cluster. The deployment manifest
declares four kinds of unit, and the kind decides how you experience it:

| Kind | Count | What it is | How you meet it |
|---|---|---|---|
| HTTP service | 8 | Always on, behind a load balancer and a hostname | Answers your request |
| Long-running worker | 5 | Always on, no inbound port; polls the database | Picks up work you queued |
| Scheduled job | 28 | Fires on a clock, does its batch, exits | Fills the tables you read |
| On-demand task family | 3 | Launched per unit of work, exits when done | Runs your study, your daily update, your notebook |

> [!NOTE] Every count on this page comes from the deployment manifest
> The topology is versioned in one file, so these numbers move when the platform changes. Treat
> them as the current shape, not as a contract.

## What your browser talks to

Four hostnames carry the application. Everything else in the diagram above is reached on your
behalf.

| Host | What it serves | What authenticates you |
|---|---|---|
| `app.fintela.io` | The SPA itself — static JavaScript, CSS and HTML from S3 behind CloudFront | Nothing; the bundle is public |
| `keycloak.fintela.io` | Sign-in, registration, token refresh and the public signing keys | The login flow itself |
| `backend.fintela.io` | Every application read and write | `Authorization: Bearer …` — a Keycloak access token |
| `stripe.fintela.io` | Token packages and the checkout session | The same access token |

There is no server-side rendering and no application logic at the edge. The SPA is a plain bundle
of files; every byte of data on screen arrived from `backend.fintela.io` after you were
authenticated.

A fifth host exists for integrations and is never called by the app:

| Host | What it serves | What authenticates you |
|---|---|---|
| `developer.fintela.io` | The read-only Developer API — every route is a `GET` | `Authorization: Bearer sk_live_…` |

The key is issued inside the app and validated by a separate Rust service that reads the same
database. See [API overview](/docs/api-overview) and
[API authentication](/docs/api-authentication).

> [!CAUTION] The internal service hostnames are not an API
> The compiler, the sandbox and the simulation engine each resolve to a public hostname, but each
> is gated on an internal service token that fails closed — a browser has no such token and never
> should, so a direct call answers with an auth failure. The agent host is a retired path: chat now
> flows through the backend, which is what persists the transcript. Build against
> `backend.fintela.io` and `developer.fintela.io` only.

## The services behind it

### Application services

| Service | Language | Role |
|---|---|---|
| `backend` | Rust (Axum) | The API. Owns every registry route, the study lifecycle, the token ledger, entitlement checks, and the proxies to every compute service |
| `developer-api` | Rust | The read-only public API. Same database, API-key auth, no token ledger — which is why it cannot trigger compute |
| `stripe` | Node | Token package listing and checkout sessions |
| `keycloak` | Keycloak | Identity. Its own dedicated database, not the application one |

The backend is where all the business logic lives. It resolves your organization from the token,
enforces quotas and entitlement locks, charges tokens before dispatching billed work, and is the
only writer the SPA ever reaches.

### Compute services

| Service | Language | Called by | What it does |
|---|---|---|---|
| `python-compiler` | Python | The backend, on your behalf | Executes and checks your strategy, fitness and risk-manager code at validation time. Holds no database of its own |
| `strategy-sandbox` | Python | The backend, on your behalf | Runs the one-off backtest behind "Run a backtest", and the data-source preview |
| `simulation-engine` | Rust | `strategy-sandbox` | The backtest itself — `POST /simulate`, `POST /simulate/periods`, `POST /curve/*` |
| `ai-agent` | Python | The backend, on your behalf | [Fintelligent](/docs/fintelligent) turns. Holds no database access; it reads your workspace back through the backend, replaying your own token |

Three more compute units are not services at all. They are **task families**: an image plus a size,
launched one container per unit of work and stopped when that work is done.

| Task family | Launched by | One task is |
|---|---|---|
| `optimizer` | `optimization-dispatcher` | One slice of a study's trial budget |
| `portfolio-updater` | `portfolio-dispatcher` | One study re-run, or one batch of promoted portfolios extended by a day |
| `lab-kernel` | `lab-session-manager` | One [Laboratory](/docs/laboratory) session's Python kernel |

> [!NOTE] The optimizer does not call the simulation engine over HTTP
> The Rust engine is compiled as a Python extension module and linked **inside** the optimizer and
> updater tasks, so a backtest during optimization is an in-process call, not a network hop. The
> `simulation-engine` HTTP service exists for the sandbox path only. See
> [optimizer architecture](/docs/optimizer-architecture).

### Background workers

Five workers run continuously, each as a single instance. A second copy would double-launch work
or double-trade, so the four that launch containers or place orders also hold a database advisory
lock for their whole life and exit rather than run without it.

| Worker | What it watches | What it does |
|---|---|---|
| `optimization-dispatcher` | Studies that reached `QUEUED` | Decides the task layout and launches optimizer tasks |
| `status-updater` | Running optimizer tasks | Reconciles what the containers did back onto the study, autostops, escalates out-of-memory kills, refunds unspent tokens |
| `portfolio-dispatcher` | Portfolio groups and studies due for a refresh | Charges the update, enqueues the members, launches updater tasks |
| `lab-session-manager` | Laboratory session requests | Launches and tears down kernel tasks |
| `alpaca-orchestrator` | Live operations | Reconciles positions and places broker orders on a 30-second loop |

Twenty-eight scheduled jobs sit behind them, all writing into the same database: end-of-day prices,
fundamentals, corporate actions, index membership, indicators, news sentiment, screener and market
snapshots, portfolio metrics, ticker logos. Some fire on their own clock; a group of vendor
collectors is instead serialized behind one nightly orchestrator that runs them in order. You never
trigger any of them — you read the tables they leave behind. [Market](/docs/market) lists the
schedule and which surface each job feeds.

## How a request flows

Four different things can happen when you click something, and knowing which one tells you whether
to wait, to poll, or to come back tomorrow.

```text
SYNCHRONOUS   browser ──▶ backend ──▶ Postgres ──▶ 200, one round trip
              hard ceiling: 55 s

QUEUED        browser ──▶ backend ──▶ 202 { "job_id": …, "status": "pending" }
                             └──▶ compiler / sandbox   (off the request path)
              browser ──▶ GET /jobs/:id every 2 s until completed | failed

DISPATCHED    browser ──▶ backend ──▶ row written, answered at once (204 | 200 | 202)
                             └──▶ NOTIFY ──▶ dispatcher ──▶ ECS RunTask
                                                  └──▶ task writes results
              browser polls the progress endpoints; results appear as they land

SCHEDULED     clock ──▶ batch task ──▶ Postgres
              nothing to trigger and nothing to poll — you read the result
```

### Synchronous — answered inside your request

Most of the app. The backend reads or writes PostgreSQL and answers in one round trip. Two
compute-heavy actions are synchronous too, because they run in-process in Rust rather than in a
container:

| Action | Where the work happens |
|---|---|
| Every registry table, chart, dashboard and detail page | Backend + Postgres |
| Simulating a [portfolio group](/docs/portfolio-groups) | Backend, in-process Rust engine |
| The invert what-if on a trial | Backend, in-process Rust engine |

Three limits apply to every synchronous call:

| Limit | Default | What you get |
|---|---|---|
| Request timeout | 55 seconds | `504 Gateway Timeout` |
| In-flight ceiling per API task | 512 concurrent requests | `503` with `Server at capacity; please retry shortly.` and `Retry-After: 1` |
| Per-organization rate | 100 requests/second sustained, burst 300 | `429` with `Your organization is sending requests too quickly; please retry shortly.` and `Retry-After: 1` |

The rate limiter is in-process, one bucket per organization per API task, and the API runs more
than one task — so the ceiling you actually hit can be a multiple of the number above. Design
against 100 rps, not against headroom.

The three Rust services — the backend, the Developer API and the simulation engine — share one
error type, so a failure looks the same wherever it comes from:

```json
{ "message": "…", "kind": "not_acceptable" }
```

`kind` is the machine label; branch on it rather than on `message`. Two habits are worth forming
early. A `500` always has its real cause replaced with
`Something went wrong on Fintela's side. Please try again in a moment.` before it leaves the
server, so there is nothing to parse out of one. And the platform's catch-all rejection is **406,
not 400** — a missing validation receipt, a rejected external endpoint URL and an out-of-range
external timeout all arrive as `406`. The full status-code table for the public API is on
[errors](/docs/api-errors).

### Queued — an async job

Anything that runs your code, or anyone else's, is decoupled from the request. The backend writes
a job row, answers `202 Accepted` with `{"job_id": …, "status": "pending"}`, and does the real call
in the background. You then poll `GET /jobs/:id` until the status is terminal.

| Action | Route | Runs on |
|---|---|---|
| Validate a strategy, fitness function or risk manager | `POST /validate/{internal,external,builtin}/…` | `python-compiler` |
| Run a strategy backtest in the sandbox | `POST /strategies/sandbox` | `strategy-sandbox` |
| Run a fitness function in the sandbox | `POST /fitness/sandbox` | `strategy-sandbox` |
| Run a risk manager, or a stack of them | `POST /risk-managers/sandbox`, `POST /risk-managers/sandbox-stack` | `strategy-sandbox` |
| Preview a data source | `POST /data-sources/preview` | `strategy-sandbox` |

A job is `pending`, `running`, `completed` or `failed`. The app polls every **2 seconds** and gives
up after **10 minutes** with `Still running — this is taking longer than expected. The job
continues on the server; check back shortly.` — the wording is literal: giving up is a client-side
decision and the work carries on.

> [!TIP] This is why a slow backtest never breaks
> A synchronous call is cut off at 55 seconds, and the sandbox's own work budget is 240 seconds.
> Holding one HTTP request open across that gap is impossible; the job pattern is what makes the
> gap invisible.

### Dispatched — an on-demand task

The heaviest work does not run on any always-on service. The backend writes one row and answers
immediately. A dispatcher claims that row and launches containers.

| Action | What the API does | What happens next |
|---|---|---|
| Launch a [study](/docs/studies) | Moves it to `QUEUED`, charges the optimization, notifies the dispatcher, answers `204 No Content` | `optimization-dispatcher` launches one or more `optimizer` tasks; trials appear in the database as each batch settles |
| **Update portfolios** on a portfolio group | Enqueues the members and answers `{ basket_id, portfolio_count, studies_enqueued }` | `portfolio-dispatcher` launches `portfolio-updater` tasks |
| Open the [Laboratory](/docs/laboratory) | Answers `202 Accepted` with a session in `requested` | `lab-session-manager` launches a `lab-kernel` task; the session polls to `ready` |

These are the actions measured in minutes, not seconds. A study's wall-clock depends on its trial
budget, its universe and its execution mode; nothing in the UI blocks while it runs.
[Study lifecycle](/docs/study-lifecycle) documents every state, and
[optimizer architecture](/docs/optimizer-architecture) documents the dispatch, the layout decision
and the failure handling.

> [!WARNING] Dispatch is not instantaneous, and the three paths are billed differently
> A study's optimization is charged when you launch, before any container exists. A portfolio-group
> refresh is charged by `portfolio-dispatcher` when it picks the work up, and a Laboratory session
> is metered per minute for as long as the kernel is alive. A launch normally reaches a dispatcher
> within milliseconds, but a resumed study waits for the dispatcher's next periodic tick instead.
> See [tokens and billing](/docs/tokens-and-billing).

### Scheduled — nobody triggers it

The daily plane runs whether or not you are logged in.

| What runs | When | What you see |
|---|---|---|
| End-of-day prices, fundamentals, indicators, metrics, snapshots | Overnight, on the schedule in [Market](/docs/market) | Fresh numbers on Markets, the Screener and the metric comparisons |
| Daily extension of promoted portfolios and portfolio groups | After the day's prices land — the dispatcher waits for the price worker to advance the market-data watermark, so a refresh never runs on yesterday's prices | New bars on a [promoted portfolio](/docs/promoted-portfolios)'s curve |
| Broker reconciliation for a live operation | Continuously, on a 30-second loop | Orders, fills and P&L in the operation history — see [live trading](/docs/live-trading) |

## Where your code runs

Five container images execute user Python, and which one you land in depends only on what you are
doing:

| Moment | Internal mode | External mode |
|---|---|---|
| **Validate** — the Validate button in an editor | `python-compiler` executes your Python | The compiler calls your endpoint on a fixed 30-second budget |
| **Sandbox** — "Run a backtest" | `strategy-sandbox` executes it in an isolated subprocess, then hands the signal to `simulation-engine` | The sandbox calls your endpoint |
| **Optimize** — a launched study | The `optimizer` task executes it across a process pool | The optimizer task calls your endpoint, one task, fan-out capped at 32 |
| **Daily update** — a promoted portfolio | The `portfolio-updater` task executes it | Not supported — an external strategy cannot be promoted or tracked |
| **Notebook cell** — the Laboratory | The `lab-kernel` task executes it | Not applicable |

The four registry images install one pinned library manifest, so code that validates behaves
identically when it trains and when it updates; the Laboratory kernel installs the same stack.
[Strategies](/docs/strategies) lists the packages and versions.

> [!NOTE] Your code runs without the platform's credentials
> Every worker that executes user Python strips the data-plane credentials — database password,
> AWS keys, service tokens, secret ARNs — out of its environment before your first line runs. That
> holds in the sandbox, in the optimizer and in the daily updater alike. The workers never open a
> database connection of their own: the trusted parent process materializes the data and hands it
> over.

External mode moves the execution out of Fintela entirely. What Fintela stores is the endpoint URL,
its timeout and its concurrency budget — plus a `required_lookback(...)` snippet, which the
compiler runs on its own to size the warmup window and never posts to you. Your endpoint is
screened for a publicly routable host before the first connection, called over plain HTTP or HTTPS,
and **sent no credential** — there is no signing header, no API key and no mutual TLS on that path,
so your own server has to authorize the caller. The wire contracts, timeouts and retry policies are
on [execution modes](/docs/execution-modes), with worked servers in
[external strategies](/docs/external-strategies), [external fitness](/docs/external-fitness),
[Python · FastAPI](/docs/python-fastapi) and [Node.js · Express](/docs/node-express).

## Authentication and tenancy

One identity provider, one token, one scope.

| Step | What happens |
|---|---|
| Sign in | The SPA hands over to Keycloak. The branded login screen is a Keycloak theme, not a page in the app |
| Every call | The access token travels in `Authorization: Bearer …` |
| Verification | The API validates the RS256 signature against Keycloak's published keys, checks the issuer, and on the normal path requires the `fintela-api` audience. The key set is cached for an hour and refetched immediately when a token is signed by a key it has not seen |
| Scoping | Your organization is resolved from the token, and every query is filtered by it |

Registries are scoped to the **organization**, not to the user: everything you can see, everyone in
your organization can see. Two mechanisms narrow that further — entitlement locks, which the
backend enforces with `402`, and JWT client roles read from `resource_access['fintela-api'].roles`.
[Navigation](/docs/navigation) documents both, including what a locked feature looks like.

Fintelligent is not an exception to any of this: the agent service holds no database access and
replays your own token for every read, so it sees exactly what you see.

The Developer API is a separate authentication world — API keys, no Keycloak, no token ledger, and
`404` rather than `403` for anything outside your organization so the API cannot be used as an
existence oracle. See [API authentication](/docs/api-authentication).

## Persistence and shared state

One Aurora PostgreSQL cluster holds everything the application knows: the seven registries, every
trial and its parameters, equity curves, holdings and transactions, portfolio metrics, market
data, the token ledger, and the run-status tables that act as the work queue.

There is no message broker. Services coordinate by writing rows and reading them back:

- A dispatcher **claims** work with a database query, not by receiving a message.
- `NOTIFY` is only a wake-up hint. Every dispatcher also runs a timed poll, so a lost notification
  costs one poll interval and never a lost job.
- The optimizer's own search state lives in the same database, which is why a trial that reached a
  terminal state is durable the moment it is written.

Two stores sit beside it. Keycloak keeps identity in its own separate database. A cache backplane
carries change notifications between API tasks and is deliberately optional — with none
configured, nothing is published and polling alone stays correct.

> [!SUCCESS] A crashed component loses work, never state
> Because Postgres is the only channel, a container that dies mid-run leaves everything it already
> committed. A relaunch subtracts the trials that already finished rather than starting over, and
> a run that is stopped keeps every portfolio, curve and metric it had persisted.

## Staying up to date

Nothing is pushed to your browser from a compute task. Results become visible because they are
already in the database and the app refetches.

Two channels, and only one of them is real-time:

| Channel | What it carries |
|---|---|
| Polling | The floor. Every live indicator — study progress, health, lifecycle, session status, job status — is a polled read on an interval that adapts to what is running |
| `GET /events` | Server-Sent Events, scoped to your organization, and **data-free**. An envelope names a topic that changed; the client then refetches through its own authenticated endpoints |

The stream publishes nine topics — `agent_runs`, `baskets`, `entitlements`, `fitness`, `jobs`,
`lab_sessions`, `risk_managers`, `strategies`, `studies` — and sends a `ping` keep-alive every 15
seconds. It is a hint, not a transport: when it is connected the app widens its polling intervals,
and when it is not, the polling alone is still correct.

For integrations the picture is simpler still: there are **no webhooks anywhere on Fintela**, no
callback registration and no push channel on `developer.fintela.io`. Poll, and cache what has not
changed. [API overview](/docs/api-overview) has the recommended polling shapes.

## Limits of this architecture

Stated plainly so you do not design around something that is not there.

| Limit | Consequence |
|---|---|
| **No webhooks, anywhere** | Every integration polls. Nothing on Fintela will call your infrastructure except an external strategy, fitness or risk-manager endpoint during a run |
| **The Developer API cannot start work** | Every route is a `GET`. It has no token-ledger integration, so a write there would be compute billed to nobody. Everything that costs tokens is triggered inside the app |
| **Synchronous means 55 seconds** | Anything longer is an async job or a dispatched task. There is no way to ask the API to hold a connection open |
| **Internal service hosts are closed** | The compiler, the sandbox and the simulation engine reject anything without an internal service token |
| **You cannot size a study's fleet** | Task count comes from the dispatcher's configuration, the execution type, the sampler and the trial budget. There is no worker knob in the UI or the API |
| **An external component collapses a study to one task** | Distributed execution and external endpoints are mutually exclusive — see [execution modes](/docs/execution-modes) |
| **External strategies cannot be tracked** | Daily updates re-execute the strategy on Fintela's schedule against Fintela's data, which only works for internal code |
| **Market data is end-of-day** | Every figure comes from a scheduled worker, and Fintela does not display intraday prices — see [Market](/docs/market) |
| **Data Pipelines is retired** | `/data-pipelines/*` redirects to the [Data Explorer](/docs/data-explorer); a strategy selects its data sources in its own editor |

Where to go from here: [Core concepts](/docs/core-concepts) for the vocabulary,
[Quickstart](/docs/quickstart) to put three of the objects on screen, and
[optimizer architecture](/docs/optimizer-architecture) when you want the compute path in full
detail.
