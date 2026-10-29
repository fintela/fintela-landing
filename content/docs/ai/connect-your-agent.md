---
title: Connect your agent
section: Artificial Intelligence
sectionOrder: 6
order: 4
published: true
updated: 2026-10-28
summary: Connect Claude Code or claude.ai to Fintela over MCP. Your agent reads study verdicts, validates an external strategy server and proposes. A person confirms each proposal in the app.
keywords: mcp, model context protocol, claude, claude code, claude.ai, connector, agent, oauth, proposals, external strategy, credential, bearer
---

Fintela runs an MCP server at `https://mcp.fintela.io/mcp`. Connect your own agent (Claude Code or
claude.ai) and it can read your organization's studies and their overfitting verdicts, check a strategy
server you run against Fintela's external strategy contract, and propose a new external strategy or a
study. **The agent never creates anything and never spends tokens.** Each proposal waits in your inbox
in the Fintela app, and nothing happens until the person who connected the agent confirms it there.

> [!IMPORTANT] Enabled per organization
> The MCP is in pilot. It has to be switched on for your organization before any tool works. If it is
> off, your agent can still connect and list the tools, but every call returns an error saying the MCP
> is not enabled for your organization. Ask your Fintela contact to enable it.

## What your agent can and cannot do

The usual loop looks like this. Your agent writes or changes a strategy server in your repository, checks
it with Fintela, proposes it, and after you confirm, proposes a study of it. When the study finishes, it
reads the verdict and brings the result back to your repository with links to the app.

```text
your agent ── read ──────────▶ studies, verdicts, trials, your library
           ── validate ──────▶ Fintela calls your server's POST /simulate, returns a verdict
           ── propose ───────▶ a proposal in your inbox (nothing created, nothing charged)
you        ── Confirm ───────▶ app.fintela.io/proposals/<id> → the strategy or study is created
```

What the agent **cannot** do, by design:

- create, edit, launch or delete anything directly. Writes only happen when you confirm a proposal.
- spend tokens. A study's cost is quoted on its proposal and charged only when you confirm it.
- touch brokers, live trading, the portfolio manager or managed portfolios.
- read market data, tickers, the data explorer, holdings, equity curves or exports.
- see your strategy server's credential. You type it into the app yourself (see
  [Protecting your strategy server](#protecting-your-strategy-server)).

Your agent sees your organization's resources as a read-only member would. Results carry links to
`https://app.fintela.io` for you to open, and never include internal ids or email addresses. Text that
a person, another agent or a server wrote (a strategy description, an error your server returned)
comes back marked as untrusted data, not instructions.

## Connect Claude Code

```bash
claude mcp add --transport http --client-id fintela-mcp-code fintela https://mcp.fintela.io/mcp
```

Then, in Claude Code, run `/mcp`, pick **fintela** and choose **Authenticate**. Your browser opens
Fintela's sign-in page. Sign in with your Fintela account and approve the consent screen (see
[Signing in and consent](#signing-in-and-consent)).

`--client-id fintela-mcp-code` is required. Fintela doesn't allow anonymous client registration, so
Claude Code has to say which client it is. You don't need a `--callback-port`, because the sign-in
accepts whichever local port Claude Code picks.

## Connect claude.ai

Add a custom connector in claude.ai's connector settings:

| Field | Value |
|---|---|
| URL | `https://mcp.fintela.io/mcp` |
| OAuth Client ID (advanced settings) | `fintela-mcp-claude` |
| OAuth Client Secret | leave empty |

Then choose **Connect**. You go through the same Fintela sign-in and consent screen.

## Signing in and consent

You sign in with your own Fintela account, and the agent acts as you, inside the organization you
belong to. The consent screen asks you to let the client read your Fintela data and file proposals for
you to confirm. The access that results is read-only: the token Claude gets can't be used against the
rest of Fintela's API, and every request goes through the MCP server's own allow-list.

- **How long it lasts:** Claude refreshes its access on its own. A connection stays signed in for up to
  7 days without use and 30 days in total. After that, authenticate again.
- **Logging out of the Fintela app doesn't disconnect Claude.** To disconnect, remove the connection in
  Claude, or open your Fintela account console (`https://keycloak.fintela.io/realms/fintela/account`) →
  **Applications** → **Remove access**.

## The tools

Sixteen tools. Thirteen only read, and three act: one validates and two propose.
Your agent reads the full descriptions and argument schemas when it connects. This is the map.

**Studies and their results**

| Tool | What it returns |
|---|---|
| `list_studies` | Your organization's studies, newest first: status, strategy, fitness function, asset group, trial counts, progress and health, and the train, validation and out-of-sample periods. |
| `get_study` | One study's configuration and where its run stands, stage by stage. |
| `get_study_verdict` | Whether a study's results are likely real or overfit: the probability of backtest overfitting (PBO), per-trial verdicts, the deflated Sharpe ratio out of sample, the best trial on each stage, and a method block that says which stage selected it and what the endpoint saw. |
| `get_top_trials` | A study's trials ranked by a metric at a stage. |
| `get_trials` | Up to 10 trials in full: metrics per stage, parameter values and overfitting diagnostics. |
| `get_param_importances` | Which parameters drive the objective and which look overfit. |
| `get_study_errors` | Why trials failed, grouped by kind, with a diagnostic for the first ones. |

**Your library**

| Tool | What it returns |
|---|---|
| `list_strategies` | Your strategies: name, type, declared parameters and how many studies use each. For an external strategy, its endpoint (origin and path), timeout and concurrency. Code is never returned. |
| `list_asset_groups` | Your asset groups: asset class, exchanges, a ticker count and a sample. |
| `list_fitness_functions` | Your fitness functions and Fintela's built-in ones, with the metric each optimizes. |
| `list_metrics` | The metrics Fintela computes for every trial, with units and direction. These are the names the trial tools take. |
| `get_resource_contract` | `kind=external_strategy`: the contract your server must meet. It covers the request `POST <endpoint>/simulate` receives and the answer it must give, the checks validation runs, the endpoint rules, and what a study's daily update sends. Have your agent read it before it writes a strategy server. |

**Your proposals**

| Tool | What it returns |
|---|---|
| `get_proposals` | Your proposals and where each one stands: `pending` (waiting on you), `executing` (being created after your confirmation), `executed`, `failed`, `cancelled`, `skipped` (not run because an earlier step of the same confirmation failed) or `expired`. |

**Acting**

| Tool | What it does |
|---|---|
| `validate_resource` | Checks your strategy server against the contract. Fintela calls its `POST /simulate` two to four times (your window, the window extended, and shorter prefixes of it, which catch look-ahead) and returns a verdict: passed, failed with the reason and the fix, or not evaluated. It's free, and capped per organization and per server host. It waits about 25 seconds, and if the verdict is still `running`, the agent calls again to keep waiting. |
| `propose_resource` | Proposes a new external strategy for your library. The strategy's code stays on your server. |
| `propose_study` | Proposes an optimization study of a strategy that is already in your library, with its quoted cost. With `launch_now` (the default), confirming saves and launches it and charges the quoted tokens. Without it, the study is saved as a draft and nothing is charged. |

A brand-new strategy and its first study take **two approvals**. `propose_study` needs a strategy that
already exists, so you confirm the strategy first.

## The proposal inbox

Proposals land at **`https://app.fintela.io/proposals`**, and you get a notification for each one. A
proposal's page shows what will be created, the endpoint's host, the cost of a study against your live
balance, and which client sent it. **Confirm** creates it. **Cancel** drops it.

- Only the person whose agent made the proposal can confirm it, and only within their current
  organization.
- A proposal expires 24 hours after it was made. An expired proposal can't be confirmed, so the agent
  proposes again.
- Confirming twice doesn't create or charge twice. The second click shows the result already recorded.
- Proposing the same thing twice while the first is pending returns the same pending proposal.
- If your organization's MCP is switched off, pending proposals can still be read and cancelled, but
  not confirmed.

## Protecting your strategy server

Fintela calls your server from the internet, so protect it with a credential. Fintela sends it as
`Authorization: Bearer <token>`, or under one header you choose from `x-api-key`, `api-key`,
`x-auth-token` and `x-fintela-token`.

**You enter the credential in the app, never through the agent.** Do it on the proposal's page before
you confirm (it's attached to the strategy when the strategy is created) or later in the strategy's
editor. An agent that tries to set it is refused. Fintela stores it encrypted and never shows it again,
not even to you. Changing the endpoint deletes it, and you enter it again.

- **The value:** 1 to 4096 bytes of printable ASCII (`0x20`–`0x7E`), with no space at the start or
  the end. No line breaks, tabs or non-ASCII characters. Fintela refuses anything else when you save,
  and sends the value exactly as saved.
- **Only to your origin:** the credential is sent only to the endpoint's exact scheme, host and port,
  and never through a redirect. An endpoint with a credential must be `https://`.
- **On every call, `/health` included:** studies and their daily updates call `POST /simulate`, and
  the daily update first calls `GET /health`, which must answer with a 2xx status within 5 seconds.
  Both carry the same header, so check it on both.
- **Before anything is charged:** when you confirm a study, or launch or resume one, Fintela first makes
  one authenticated call to your server. If it answers 401 or 403, nothing is created or charged.
- **Validating before the credential exists:** a server that answers 401 or 403 to an agent's
  validation gets the verdict `needs_credential`. That isn't a failure. Propose the strategy, enter the
  credential on the proposal page and confirm. Fintela checks again with the credential before it
  charges anything.

> [!WARNING] The source IP is not authentication
> Fintela calls your server from `3.150.82.255`. Every Fintela customer's strategies call from that same
> address, so allowlisting it only narrows who can reach you. Check the credential on every request,
> and never echo it back in an error body.

[External strategies](/docs/external-strategies) covers the `/simulate` contract itself.

## Limits

| Limit | Default |
|---|---|
| Proposals waiting on you at once | 10 |
| Proposals you receive per 24 hours | 100 |
| A proposal's lifetime | 24 hours |
| Validations running at once, per organization | 2 |
| Validations per hour, per organization | 30 |
| Validations running at once against one server host (all organizations) | 1 |
| Validations per hour against one server host (all organizations) | 60 |
| How long `validate_resource` waits before answering `running` | about 25 seconds |
| Size of one tool result | about 16 KB. A larger result is trimmed and marked `truncated: true` |

Your agent's requests draw on a rate limit of their own, separate from the people in your
organization, so a busy agent never slows the app down for your team. A refused call says why and,
when it's worth retrying, after how long. Fintela can raise the proposal and validation limits for
your organization.
