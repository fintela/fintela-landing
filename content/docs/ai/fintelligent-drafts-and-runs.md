---
title: Drafts & Runs
section: Artificial Intelligence
sectionOrder: 6
order: 3
published: true
updated: 2026-08-20
summary: How Fintelligent proposes work as a draft, and what happens when you approve it.
keywords: draft, agent draft, run, agent run, approve, apply, review, confirmation, safety, monitoring
---

Fintelligent does not edit your workspace behind your back. When it builds something, the work
lands in two places you can see: a **draft**, which is unsaved content parked in an editor and on
the server, and a **run**, which is the durable record of one chat turn — what the agent is doing
right now, what it stopped for, and how it ended. A draft is what the agent produced; a run is
what the agent is doing. Neither one is a saved resource, and the step between the two is always
yours.

## Drafts and runs at a glance

| | Agent draft | Agent run |
|---|---|---|
| Table | `developers.agent_drafts` | `developers.agent_runs` |
| One row per | `(user, entity, resource)` slot | chat turn — `(conversation_id, user_seq)` |
| Written by | Fintelligent (`save_agent_draft`) and by you, as you type | the backend's streaming proxy, never by a client |
| Lifetime | until you save the resource or discard the draft | until the turn ends, or until you answer it |
| Read by | the four registry editors | the run chip, the mobile nav badge, the floating panel's status line |
| You can edit it | yes — it *is* the editor's content | no, it is read-only |

## What an agent draft is

A draft is the editor's own field shape, stored verbatim. The backend never interprets it: whatever
the editor writes is what comes back. That means a draft can hold a half-written strategy, a set of
parameters, a lookback function, a data-source selection — anything the editor's form holds.

A draft is **not a save**. `save_agent_draft` states it in its own contract: *"It does NOT create
the resource: a draft is not a save, and only the user's click on the editor's Confirm dialog
persists anything."*

Drafts exist because the agent needs somewhere to write while you are not looking. A
`ui_editor_field` write with no editor mounted is parked in a short queue and then expires, so
before drafts the agent lost everything the moment you navigated away.

### Where a draft is stored

Three layers hold the same content, and they win in this order:

| Layer | Where | Survives | Notes |
|---|---|---|---|
| In-memory store | `draftStore`, outside the React tree | route changes, editor remounts | synchronously readable, which is what lets the agent write a field and validate it in the same tick |
| Session mirror | `sessionStorage`, key `fintela.registryDrafts:` plus your user id | a full page reload in the same tab | debounced 800 ms, capped at 512 KB, schema-versioned — a mirror written by an older bundle is discarded rather than restored |
| Server draft | `developers.agent_drafts` | closing the tab, switching device, signing back in | pushed 1.5 s after your last keystroke |

A **dirty local draft always wins** over the server copy. Your unsaved edit is the only thing here
that cannot be recovered from anywhere else, so the editor never asks the server for a draft while
one of yours is in play.

### One live draft per slot

A slot is `(user, entity, resource_id)`. A unique partial index enforces exactly one live draft per
slot, and `resource_id` being `NULL` is its own slot — so "the new strategy I'm creating" and "the
edits to strategy 12" never collide, and neither piles up.

| Entity value | What it drafts |
|---|---|
| `strategy` | a [strategy](/docs/strategies) |
| `fitness` | a [fitness function](/docs/fitness-functions) |
| `risk_manager` | a [risk manager](/docs/risk-managers) |
| `asset_group` | an [asset group](/docs/asset-groups) |
| `study` | a [study](/docs/studies) |

Anything else is refused with **406** — for example, `"portfolio" is not a draftable resource. Use
one of: strategy, fitness, risk_manager, asset_group, study.` A draft whose JSON exceeds **512 KB**
is refused with **406** and `This draft is too large to store.`

Drafts are scoped to `(organization_id, user_id)` on every single query. A colleague's half-written
strategy is invisible to you, and yours to them, even inside the same organization.

### Which editors read a server draft

Only four. The Strategy, Fitness, Risk Manager and Asset Group editors keep their form in
`draftStore` and mirror it to `agent_drafts`. The **study builder does not** — it keeps its state in
a reducer, and nothing in the app reads a `study` draft back. Fintelligent can write one, but the
builder will not offer it to you when you open it.

> [!NOTE]
> There is no "here is everything Fintelligent has been working on" screen. `GET /agent/drafts/all`
> exists and returns every live draft for the caller, newest first, but no shipped surface renders
> it. You find a draft by opening the editor it belongs to.

## The draft review flow

```text
Fintelligent writes                      you open the editor
save_agent_draft ──►  agent_drafts row  ──►  banner: "Fintelligent left an unsaved draft here"
                                                            │
                            ┌───────────────────────────────┴───────────────────────────┐
                    "Keep the draft"                                          "Discard and restore"
                            │                                                           │
                the draft becomes yours;                                 the editor reverts to the saved
                saving is unblocked                                      version and the server copy is
                            │                                            deleted
                    Save → validation → Confirm dialog
                            │
                    you click Confirm
                            │
            the resource is written, and the draft slot is released
```

### Draft states

A dirty draft is not one state but two, and the difference is who produced the content.

| State | Badge | Banner | Can you save from it? |
|---|---|---|---|
| Clean — matches the saved resource | none | none | yes, nothing to save |
| **Your** unsaved edits, made in this session | `Unsaved changes`, outlined, tooltip *"This is not what's saved. Save to commit it."* | none | yes |
| Content restored from the **server**, written by Fintelligent | `Unsaved draft`, filled warning, tooltip *"Fintelligent prepared this and it has not been saved. Keep it or discard it."* | *"Fintelligent left an unsaved draft here"* | no, not until you decide |
| Content restored from the **server**, written by you earlier | `Unsaved draft`, tooltip *"Restored unsaved work. Keep it or discard it before saving."* | *"You left unsaved changes here"* | no |
| Content restored from the **session mirror** after a reload | `Unsaved draft`, same tooltip | *"Restored from your previous session"* | no |

The rule that ties them together: content that came from outside your current editing session is
shown as an **offer**, never as the resource.

> [!WARNING]
> Typing on top of an unreviewed draft does not approve it. The editor deliberately keeps the
> review flag set when you edit, because fixing a typo on top of somebody else's draft is not the
> same as accepting the rest of it. You still have to click Keep or Discard.

### The banner and the badge

The banner is a warning-coloured alert at the top of the editor. Under the title it reads *"This is
not the saved version. Review it before saving, or discard it to go back to what's saved."*

Below that, a `Changes` row lists one chip per top-level field that differs from the saved
resource — `name`, `description`, `code`, `parameters`, `data sources`, `lookback function`,
`lookback mode`, `endpoint`, `timeout`, `max concurrency`, `instruments`, `member portfolios`,
`rules`, `type`. A field the label table does not know renders under its raw name rather than
breaking the banner. Fields are
compared by canonical JSON, not by object identity, so rebuilt-but-identical objects are not
reported as changed.

### Keep the draft or discard it

Two buttons, and they do different things to the server copy.

| Button | Effect on the editor | Effect on the server draft |
|---|---|---|
| **Keep the draft** | the draft becomes yours, still unsaved, saving unblocked | left in place until the resource is saved or the draft is discarded |
| **Discard and restore** | the editor reverts to the saved resource and goes clean; any pinned validation is dropped | soft-deleted, and the slot is freed for the next draft |

Saving the resource has the same effect on the draft as discarding it: the draft has served its
purpose and the slot is released.

### Saving is blocked until you decide

Every save path in the four editors runs through one check, and an unreviewed draft fails it before
anything is validated or persisted.

What you see: the banner scrolls into view and pulses, and a warning toast appears —
**"Review the draft before saving"** / *"This editor is showing an unsaved draft you haven't
reviewed. Keep it or discard it, then save."*

What Fintelligent sees, if the block was triggered by its own `ui_request_save`: a `CompileResult`
with `failure_kind: "EDITOR_DRAFT_UNREVIEWED"` and `retryable: true`, plus the explanation *"The
editor is showing an unsaved draft the user has not reviewed. They must keep it or discard it
before anything can be saved."* One click resolves it, which is why the agent is told to retry
rather than rewrite.

### Leaving an editor with unsaved work

The leave guard arms only for work **you own** — dirty and already reviewed. An unreviewed draft
does not prompt, because leaving it loses nothing: it is on the server and the banner will be there
next time.

| Button | What happens |
|---|---|
| **Keep editing** | stay on the page |
| **Leave, keep the draft** | navigate away; the draft stays on the server |
| **Discard and leave** | discard the draft, then navigate away |

The dialog reads **"Leave without saving?"** / *"Your changes stay as a draft and will be here when
you come back — but they are not saved."*

It covers reloads, tab closes, navigation to another origin, every in-app link, and the editor's own
Cancel. The browser **Back button is deliberately not guarded** — vetoing it cleanly is not possible
in the current router, and a guard that races its own exit is worse than none. Your work is not lost
when Back falls through: the draft is on the server, and the banner offers it back.

### When two writers collide

Every write to a draft carries `expected_updated_at`, the `updated_at` value the last read returned.
A stale token is refused with **409** — never an overwrite — carrying *"This draft changed since you
last read it — re-read it, merge your change on top, and write again."* Omitting the token is only
valid for the very first write of a brand-new draft; sending no token to a slot that already holds
a draft is also a 409.

When your own browser loses that race, a warning toast appears: **"This draft changed somewhere
else"** / *"Fintelligent or another tab wrote to it. Your changes are still here — reopen the editor
to merge them."*

> [!TIP]
> Your local edit is not discarded by a conflict. The push loop pauses so it does not 409 in a
> loop, and it resumes on your next keystroke.

## What an agent run is

A run is one chat turn, made durable. The turn itself already survives you walking away — the
streaming proxy is a detached task that keeps draining even after your browser disconnects — but
before runs, nothing outside that one process knew a turn existed. The row is what lets any page in
the app say "Fintelligent is working on your strategy".

The row is opened before the first frame arrives and is keyed on `(conversation_id, user_seq)`,
which is the turn's identity. A client that reconnects and resends lands on the same row rather than
opening a second one.

| Field | What it holds |
|---|---|
| `status` | the run's lifecycle state, from the list below |
| `phase` | the agent's own account of what it is doing — `analyzing`, `exploring_data`, `writing_code`, `configuring`, `validating`, `running` |
| `detail` | free text the agent attaches to a phase |
| `awaiting` | what it stopped for: `editor_confirm`, `answer` or `input` |
| `last_tool` | the last tool it called |
| `entity` / `resource_id` | what it is building, when the tool named one of the five draft entities |
| `error` | why it stopped, on a failure |
| `started_at`, `last_activity_at`, `finished_at` | timing; `finished_at` being `NULL` is what "live" means |

Runs are scoped to `(organization_id, user_id)`. A run is one person's work in progress and is never
visible org-wide.

### Run statuses

```text
you send a message
      │
      ▼
   running ──► running ──► running        (phase moves; the row is updated, not replaced)
      │
      ├─► awaiting_user   still LIVE — finished_at stays NULL until you answer
      ├─► completed       finished; no chip, no notification
      ├─► incomplete      finished; resumable; notification
      ├─► failed          finished; notification
      └─► cancelled       finished; set only by conversation delete or the 24-hour sweep
```

| Status | Live? | What it means | What you see |
|---|---|---|---|
| `queued` | yes | allowed by the schema; nothing writes it today | — |
| `running` | yes | the turn is in flight | the run chip, spinning |
| `awaiting_user` | **yes** | the turn is over but the run is not — it handed a decision back | the run chip, warning-coloured |
| `completed` | no | the turn finished on its own terms | nothing; no lingering "done" chip |
| `incomplete` | no | it ran out of time, steps or tokens with work outstanding | *"Paused — didn't finish"* and a notification |
| `failed` | no | the turn broke, or its replica died | the failure reason and a notification |
| `cancelled` | no | you deleted the conversation it was waiting in, or it waited 24 hours | nothing |

> [!NOTE]
> `awaiting_user` is the status worth understanding. It is deliberately left live, because the state
> you come back to *is* the question. Answering it opens a new turn with a new sequence number, and
> that new turn retires the waiting row — so the chip cannot keep asking for an answer you already
> gave.

### The status line in the chat

Directly above the composer, exactly one line renders at a time, announced politely to screen
readers. Which one wins is decided by a fixed branch order, so the surface is never ambiguous about
whose turn it is.

| State | Copy | Affordance |
|---|---|---|
| busy, `analyzing` | **Analyzing your request…** | spinner |
| busy, `exploring_data` | **Exploring your data…** | spinner |
| busy, `writing_code` | **Writing the code…** | spinner |
| busy, `configuring` | **Configuring…** | spinner |
| busy, `validating` | **Validating…** | spinner |
| busy, `running` | **Running…** | spinner |
| awaiting `editor_confirm` | **Waiting for you to confirm — the Save dialog is open** | **Reopen it**, when the control can be rebuilt |
| awaiting `answer` | **Waiting for your answer** | the question card is on screen |
| awaiting `input` | **Waiting for you** | — |
| incomplete | **Paused — didn't finish** | **Continue**, on the second stop in a row |
| failed | the failure reason, or **Couldn't finish — something went wrong** | **Retry**, only when the agent said the failure is retryable |
| finished | **Finished** | none, muted |

An elapsed clock appears on busy states only after **5 seconds** — a timer on a three-second answer
is noise.

While a local validation round-trip is in flight the line reads **Validating…** regardless of what
the stream last said, because the stream has ended but the compiler has not answered yet.

After a reload, an `awaiting` claim the browser cannot honour degrades to **Paused — didn't
finish** rather than pointing at a dialog that no longer exists. When the control *can* be rebuilt
from the transcript — a question card, a `ui_request_save`, a `platform_command` — the **Reopen it**
button re-dispatches the original call so the agent receives the same postback it was waiting for.

### The run chip on every page

A pill fixed above the Fintelligent launcher, on every page and every breakpoint. It renders only
while a run is live.

| Condition | Headline |
|---|---|
| working, no entity | **Fintelligent is working** |
| working, with entity | **Fintelligent is working on your {{entity}}** |
| waiting, no entity | **Fintelligent needs you** |
| waiting, with entity | **Fintelligent needs you for your {{entity}}** |

Entity labels are `strategy`, `fitness function`, `risk manager`, `asset group`, `study`. The second
line reuses the same phase and awaiting copy as the in-chat status bar, so the two surfaces never
describe the same turn differently. The accessible name appends **Open to see the progress**.

Which run gets the chip, when several are live:

1. Within one conversation, only the **latest turn** may speak.
2. A run **waiting on you** outranks one that is merely working — in the first case you are the
   blocker, in the second you are a spectator.
3. Otherwise, the most recently active.

The chip suppresses itself for exactly one run: the one whose conversation is already on screen.
A question waiting in a different conversation still shows. Clicking it opens the panel **on that
conversation**, not on whatever was last active.

On mobile, the Fintelligent item in the bottom navigation also carries a dot badge from the same
run — warning-coloured when it is waiting, primary when it is working, hidden while the chat panel
is open.

**How the chip stays fresh.** Progress arrives by push, on the `agent_runs` topic of the server
event bus, which refreshes the run list, the notification bell and the open transcript together. A
20-second poll runs as a safety net **only while something is live**, and stops entirely when
nothing is.

### Notifications for the endings that need you

Three endings file a notification; two deliberately do not.

| Run status | Notification title | Deep link |
|---|---|---|
| `failed` | **Fintelligent could not finish** | the conversation |
| `incomplete` | **Fintelligent paused — it can continue** | the conversation |
| `awaiting_user` | **Fintelligent needs you** | the conversation |
| `completed` | none | — |
| `cancelled` | none | — |

A finished turn needs nothing from you, and announcing it would make the bell mostly noise. Each
notification deep-links to `/ai/fintelai/c/:conversationId`, falling back to the conversation list
when the payload has no id.

## The confirmation model

### What always waits for your click

The **editor path** is Fintelligent's default way to build any of the five drafted resources, and
nothing in it persists anything on its own:

```text
ui_navigate      →  takes you to the registry page
ui_crud_action   →  opens the create or edit editor
ui_editor_field  →  fills fields (one, or many at once)
ui_request_save  →  runs the same validation a human Save runs, then opens the dialog
   ↓
YOU click Confirm  →  the resource is written
```

`ui_request_save` **ends the agent's turn**. It validates and stops. For a strategy, fitness
function, risk manager or asset group it opens the naming-and-confirm dialog — the only place a new
resource is named. For a study it opens the review dialog **Confirm your study**, showing the study
name, asset group, strategy, fitness, trial count, data range and out-of-sample flag, plus the full
token cost breakdown, with three buttons: **Cancel**, **Save Draft** and **Save & Launch**.

If validation fails, **the dialog never opens**. The failure itself is the answer the agent reads,
and no save was attempted.

The exact payload the compiler accepted is pinned and persisted verbatim. Anything that changes the
draft afterwards — including typing a name into the Confirm dialog, which rewrites the entrypoint —
invalidates the pin and forces a fresh validation rather than shipping bytes the compiler never
saw.

Two other things always wait for you: an unreviewed draft, which blocks every save path until you
Keep or Discard it, and a question card, which the agent's `ui_ask_user` puts on screen and which is
never raced against a timeout — it waits on a person, for as long as the person takes. See
[Fintelligent capabilities](/docs/fintelligent-capabilities) for the card itself.

### What Fintelligent can do without a dialog

Be clear-eyed about this: the editor path is the default, **not the only path**. Fintelligent also
has direct API tools that write immediately, with no dialog. `create_strategy` says so in its own
description: *"Create a strategy DIRECTLY (persists immediately — no Confirm dialog)."* Its
instructions tell it to use that path only when you explicitly ask to skip the wizard, and to
confirm in chat first — but that is an instruction to the model, not a lock.

| Family | Tools that write without a dialog |
|---|---|
| Strategies | `create_strategy`, `update_strategy`, `delete_strategy`, `duplicate_strategy` |
| Fitness functions | `create_fitness`, `update_fitness`, `delete_fitness`, `duplicate_fitness` |
| Risk managers | `create_risk_manager`, `update_risk_manager`, `delete_risk_manager`, `duplicate_risk_manager`, `fork_risk_manager` |
| Asset groups | `create_cluster_from_study`, `derive_cluster_from_grouping`, `update_data_cluster`, `delete_data_cluster`, `duplicate_data_cluster` |
| Studies | `create_study`, `duplicate_study`, `launch_study`, `stop_study`, `resume_study` |
| Portfolio groups | `create_basket`, `update_basket`, `delete_basket`, `update_basket_portfolios` |
| Drafts and the UI bus | `save_agent_draft`, `ui_crud_action`, `platform_command` |

What actually constrains them:

- **Your own permissions.** Every backend tool call replays your JWT, so the agent inherits exactly
  your roles and your organization scope. It cannot reach anything you could not reach yourself.
- **An append-only audit.** Every mutating tool call is written to `developers.agent_action_log`
  with the tool name, its input and the user message that triggered the turn. A database trigger
  rejects UPDATE and DELETE on that table.
- **The validation receipt gate.** Saving code for a strategy, fitness function or risk manager is
  rejected server-side unless a completed validate job exists whose hash matches the code, its
  lookback function and its resolved data-source graph. That applies to a direct API call as much
  as to the editor.
- **`create_study` starts nothing.** A study created this way is saved, not launched, unless
  `launch_now` is set. A saved study costs nothing until it is launched — see
  [Tokens & billing](/docs/tokens-and-billing).
- **The UI bus does not carry the destructive actions.** `ui_crud_action` advertises `create`,
  `edit`, `duplicate`, `delete`, `stop` and `resume`, but the registry pages subscribe to only some
  of them: Strategies, Fitness and Asset Groups handle `create`, `edit` and `duplicate`; Risk
  Managers handle `create` and `edit`; Studies handle `create`, `edit` and `duplicate`. `delete`,
  `stop` and `resume` are deliberately unhandled everywhere — the list views' own confirmation
  dialogs are the gate — so nothing is deleted, stopped or resumed through the UI bus.
- **`platform_command` has no delete.** Its dispatcher accepts exactly ten intents — `navigate`,
  `search`, `create`, `view`, `edit`, `set_fields`, `read_editor`, `validate`, `save` and `run`
  (where `run` covers `launch`, `stop`, `relaunch`, `backtest`). Execution stops at the first
  failing intent.
- **Live trading is unwired entirely.** The broker tool group is empty by design. Broker connect,
  launch and rebalance, portfolio-group operation launch and force-stop, and managed promotion are
  all deliberately kept out of the agent's registry until a human-confirmation gate exists. The
  agent's live-trading specialist is strictly read-only. See [Live trading](/docs/live-trading).

### The postbacks that close the loop

When a client-side step finishes, the result is posted back into the conversation as a tagged
message. These render as compact chips in the transcript rather than as raw JSON, and "Regenerate"
skips past them.

| Tag | Carries | Rendered as |
|---|---|---|
| `⟦compile-result⟧` | a validation result, or a `platform_command` batch | **Validation passed**, or `Validation failed: {{detail}}` where detail may be **timed out**, **failed** or **Unparseable validation result** |
| `⟦save-result⟧` | what your click on the Confirm dialog did | **Saved**, **Saved — {{name}}**, **Save cancelled**, or `Could not save: {{detail}}` |
| `⟦answer⟧` | your answer to a question card | `Answered: {{choice}}` or **Skipped the question** |
| `⟦continue⟧` | a resume of a turn that stopped short | a divider captioned **Picking up where it left off** |

A save that errors leaves the dialog open with the error inline so you can fix the name and confirm
again — the agent is told, but the session stays live. A save you dismiss reports **cancelled**,
except while a save is actually in flight: that save owns the outcome and reports it when it
settles, even if the editor has already unmounted.

## Failure, stopping and cancellation

### Stopping a turn

While a turn streams, the Send button becomes **Stop**. Pressing it does two things:

1. Aborts the browser's stream. The backend still persists whatever it received, flagged
   `interrupted`, and the bubble carries the italic caption **"Connection lost mid-reply."**
2. Cancels the turn's **pending tool round-trips**. Anything queued — a save the agent staged, a
   command batch — is dropped rather than executed, and its result is never posted back. A user who
   hit Stop must not then watch the wizard run the save and restart the stream anyway.

> [!CAUTION]
> Stop is not a server-side cancel. The streaming proxy keeps draining the agent until it can
> persist the answer, so work already in flight upstream still completes and is still billed. Any
> tool call the agent had already issued has already happened.

### A turn that stops short

An `incomplete` turn ran out of time, steps or tokens with work outstanding and nothing for you to
answer. Continuing is not a decision you have the information to make — you cannot see the budget —
so the client makes it for you **once**, automatically, by sending a `⟦continue⟧` message.

Once, not twice. A turn that ran out of budget twice in a row is not making progress, so the second
time the offer becomes a **Continue** button in the status line. The guard is the transcript, not a
counter: an auto-continue leaves a durable `⟦continue⟧` message behind, so reloading the page does
not buy you another automatic turn. Clicking Continue yourself sends the same tag, and therefore
also disables the automatic one.

A question card outranks a resume. If the turn is waiting on you, nothing auto-continues.

### A turn that fails

Every turn must end in one of four phases — `awaiting_user`, `finished`, `incomplete` or `failed` —
and an unclassified ending defaults to `incomplete`. If the upstream stream ends without a terminal
phase at all, the backend synthesises `failed` plus an error frame, so a truncated bubble never
leaves the status line silent.

A failure that never became a stream still returns HTTP 200 with a persisted failed turn, so Retry
has something to retry. The **Retry** action only appears when the agent classified the failure as
retryable — a rate limit is, a malformed request is not — because every press buys another billed
turn.

### Runs the reconciler closes

The turn runs in a detached task. If the process serving it dies, the run row is the only evidence
the turn existed and nobody is left to close it — which would render as a "Fintelligent is
working…" chip that never stops. A background reconciler, riding the jobs worker's tick (every
600 seconds by default), closes them.

| Condition | Idle for | New status | Announced |
|---|---|---|---|
| `queued` or `running` with no activity | 900 s (15 min) | `failed`, with `The run stopped without reporting back.` if it had no error of its own | yes — **Fintelligent could not finish** |
| `awaiting_user`, never answered | 86 400 s (24 h) | `cancelled` | no |

Deleting a conversation also closes any run still waiting on you inside it, as `cancelled`: an
archived conversation cannot be answered, and leaving the run live would keep "Fintelligent needs
you" on screen pointing at a thread you deliberately got rid of. A `running` row is left alone —
it may still be streaming and will close itself.

## Endpoints

All routes are JWT-scoped to `(organization_id, user_id)` and wrap their payload in a `data`
envelope. The run endpoints are read-only: the rows are written by the streaming proxy, never by a
client.

```http
GET    /agent/drafts?entity=strategy&resource_id=12
GET    /agent/drafts/all
PUT    /agent/drafts
DELETE /agent/drafts
GET    /agent/runs/live
GET    /agent/runs/conversation/{conversation_id}
```

| Call | Success | Notable failures |
|---|---|---|
| `GET /agent/drafts` | the draft for one slot | **404** `No draft for that resource.` — an ordinary answer, folded to `null` by the client |
| `GET /agent/drafts/all` | every live draft, newest first | — |
| `PUT /agent/drafts` | `{ "id": "…", "updated_at": "…" }` | **409** on a stale `expected_updated_at`, or on a missing one when the slot already holds a draft; **406** on an unknown entity or on content over 512 KB |
| `DELETE /agent/drafts` | `{ "deleted": true }` | none — soft and idempotent, never 404 |
| `GET /agent/runs/live` | up to 20 live runs, most recently active first | — |
| `GET /agent/runs/conversation/{id}` | the conversation's most recent run | **404** `No such agent run.` — folded to `null` by the client |

`PUT /agent/drafts` body:

```json
{
  "entity": "strategy",
  "resource_id": 12,
  "conversation_id": "0d3f…",
  "content": { "name": "…", "code": "…", "params": {} },
  "expected_updated_at": "2026-08-18T09:41:12.884Z"
}
```

`resource_id`, `conversation_id` and `expected_updated_at` are all optional. Omit `resource_id` for
the create-mode slot. Omit `expected_updated_at` **only** for the first write of a brand-new draft.

## Limits and gaps

- **`content` replaces the whole draft.** There is no patch. Fintelligent is instructed to read the
  draft, merge its change and write the complete field set back.
- **No study draft round-trip in the UI.** `study` is a valid draft entity server-side, and the
  agent can write one, but the study builder never reads it.
- **No draft inbox.** `GET /agent/drafts/all` has no UI consumer.
- **Deleting a conversation never takes the work with it.** Conversation delete is a soft delete,
  so drafts it authored are untouched; even a hard row delete would only null a draft's
  `conversation_id`, never remove the draft.
- **`queued` has no producer.** The schema permits it; the proxy opens every run as `running`.
- **Runs are never deleted by you.** There is no cancel-run control — the only ways a live run ends
  are the agent finishing, you answering, the conversation being deleted, or the reconciler.
