---
title: Fintelligent
section: Artificial Intelligence
sectionOrder: 6
order: 1
published: true
updated: 2026-08-18
summary: The AI assistant built into Fintela — what it is, how to talk to it, and what it can reach.
keywords: fintelligent, ai, assistant, chat, conversation, agent, prompts, streaming, fintela-ai
---

Fintelligent is the AI assistant built into Fintela. It reads your workspace — studies, portfolios,
strategies, fitness functions, risk managers, asset groups, market data — and it can act on it:
fill an open editor, draft a study, navigate the app, ask you a structured question, and produce a
PDF report. It is a conversation, not a registry: there is no list of "Fintelligent" objects to
create and manage, only conversations, the drafts it leaves in editors, and the runs it starts.

## What Fintelligent is

| Aspect | Detail |
|---|---|
| **Interface** | A chat. One session, rendered on two surfaces: the full page at `/ai/fintelai` and the floating panel available on every other page. |
| **Model** | DeepSeek. `deepseek-v4-pro` is the default; the conversation's own `preferred_model` / `last_model` override it when set. There is no model picker in the UI. |
| **Billing** | Fintela **AI Tokens** — a currency separate from the compute Fintela Tokens. A chat turn costs 0 compute tokens. See [Tokens and billing](/docs/tokens-and-billing). |
| **Authority** | Every backend call the agent makes replays your own JWT, so it sees exactly what you see and nothing more. Conversations, drafts and runs are scoped per user within your organization. |
| **Status** | Beta. The floating panel carries a **"Beta"** chip and the line *"Fintelligent is in active development — you may occasionally see bugs or incomplete answers."* |

Two things Fintelligent is **not**:

- **Not a registry.** It has no table view, no create wizard, no execution modes. Its own persisted
  artifacts are conversations (this page), drafts and runs
  ([Drafts and runs](/docs/fintelligent-drafts-and-runs)).
- **Not an adviser.** A disclaimer sits permanently under the composer on both surfaces:
  *"Fintela is a research tool, not an investment adviser. Output is informational only and not
  investment advice."*

> [!NOTE]
> This page documents the surface — where the chat lives and how it behaves. For the catalogue of
> what Fintelligent can actually do, see [Fintelligent capabilities](/docs/fintelligent-capabilities).
> For how its edits get reviewed and saved, see
> [Drafts and runs](/docs/fintelligent-drafts-and-runs).

## Where Fintelligent lives

The dedicated **AI section was removed from the sidebar.** Fintelligent now sits inside the
sidebar's **"More Options"** flyout, as its sixth and last entry. Everything else about it is
global chrome.

| Entry point | Where | Behaviour |
|---|---|---|
| Sidebar → **More Options** → **Fintelligent** | Desktop sidebar flyout | Navigates to `/ai/fintelai` |
| Launcher pill | Bottom centre, desktop only (`md` and up) | Tooltip **"Ask Fintelligent"**; hovering or clicking it opens the floating panel |
| Mobile bottom nav | Item labelled `Fintelligent` | Toggles the floating panel; carries a dot badge while a run is live |
| Run chip | Fixed pill above the launcher, every page and every screen size | **"Fintelligent is working"** / **"Fintelligent needs you"**; opens the floating panel on that conversation |
| Notification bell | `agent_*` notifications | Deep-link to `/ai/fintelai/c/:conversationId`, falling back to `/ai/fintelai` |

Both floating surfaces — the launcher pill and the panel — are suppressed on `/ai/fintelai` and
anything below it. That page *is* the chat, so the bubble would overlay its own composer.

The panel has no header chrome and no close button: it is the transcript, the composer bar and the
beta notice, nothing else. It collapses on a deliberate click outside it or on Escape, which brings
the launcher pill back. Collapsing never aborts a running turn.

### Routes

| Route | What renders |
|---|---|
| `/ai/fintelai` | Conversation list |
| `/ai/fintelai/new` | A fresh, not-yet-created conversation |
| `/ai/fintelai/c/:conversationId` | An existing conversation |

`/new` and `/c/:conversationId` resolve to the same component, so sending the first message from
`/new` swaps the URL to `/c/<id>` without remounting the view or interrupting the stream.

## Who can use it

**Permission.** The single Fintelligent permission is the JWT client role `fintela-ai:read`
(Keycloak description: *"Can read and use the Fintelligent features"*). It is carried by the
composite roles **`manager`** and **`owner`**. **`analyst` does not carry it.** The SPA also
accepts `root:all`, which `owner` and `admin` carry.

> [!WARNING]
> The permission gate is **navigational**. Without `fintela-ai:read` (or `root:all`) the
> **Fintelligent** entry is filtered out of the More Options flyout — but the routes mount with no
> role guard, the floating launcher and panel are not role-gated at all, and the conversation API
> authorizes on ownership rather than on role. Treat the role as controlling *discoverability*,
> not access.

**Entitlement lock: none.** Fintelligent declares no entitlement `lock`, so unlike Laboratory it
never renders behind a blurred, data-free preview.

**Free-tier daily cap.** For an organization that has not activated (no purchase, and enforcement
switched on), the entitlements API reports an `agent_messages` cap — **10 messages per day** in the
default policy, counted from billed chat turns in the last 24 hours. The **floating panel** is the
surface that renders it: at three messages or fewer remaining it shows
**"{{remaining}} of {{limit}} messages left today"**, and at the cap it disables the composer with
the placeholder **"You've used all of today's messages"**, the send-button tooltip **"Daily limit
reached. It resets tomorrow."** and a **"Buy tokens"** button linking to the account page's Tokens
section. Activated organizations get `limit: null` and see none of this.

## Starting and resuming a conversation

A conversation is created by your **first message**, not by opening the page. Until then `/new`
holds a draft with no server-side row.

```text
  New chat                    First send                    Thereafter
  ────────                    ──────────                    ──────────
  /ai/fintelai/new    ──▶     POST …/conversations/_/…   ──▶  /ai/fintelai/c/<id>
  (no row yet)                backend creates the row         (URL replaced, stream
                              and streams the reply           never interrupted)
```

| Action | How |
|---|---|
| Start fresh | **"New chat"** in the list header (desktop), the floating **New conversation** button on the mobile list, or the `+` control in the composer |
| Resume | Click a row in the list, follow an `agent_*` notification, or click the run chip |
| Hand off to the panel | **"Continue on floating chat"** in the full-page composer — targets the conversation, opens the panel and navigates you to `/`. Disabled until a conversation exists, and while a turn is streaming |

Resuming an existing conversation with prior messages shows a one-shot info banner reading
**"Resuming conversation"**. It auto-dismisses after 3 seconds, or immediately on click, and never
appears on `/new`.

Your unsent draft text is kept per conversation in `sessionStorage` under the key
`fintelai-draft-<conversationId>` (or `fintelai-draft-new`), so navigating away and back does not
lose what you were typing. Switching conversations swaps the draft and clears any attached code
snippets.

## The conversation list

`/ai/fintelai` lists your own conversations within your organization — never anyone else's.

### Header and search

| Control | Detail |
|---|---|
| Title | `Fintelligent` |
| Subtitle | **"Your past conversations"** |
| Primary action (desktop) | **"New chat"** button with a `+` icon |
| Primary action (mobile) | Floating action button, aria-label **"New conversation"**, above the bottom nav |
| Search field | Placeholder **"Search conversations…"**, leading search icon, a spinner while the query catches up, and a clear button labelled **"Clear search"** |

Search is **server-side only** — there is no client-side filtering. Input is debounced 250 ms and
matched against a Postgres full-text index over the conversation title and its last-message
preview.

### Time grouping

Rows are grouped under sticky overline headers, in this order:

| Header | Bucket |
|---|---|
| **Today** | Same calendar day |
| **Yesterday** | Previous calendar day |
| **Earlier this week** | 2–6 days ago, same calendar month |
| **Earlier this month** | Same calendar month, older than that |
| **Older** | Everything else |

The server returns pinned conversations first, then `updated_at` descending. Pinned rows therefore
float to the top of whichever bucket their timestamp belongs to — not to the top of the whole list.

### Conversation row

| Element | Detail |
|---|---|
| Pin glyph | Rendered in an 8px gutter when the conversation is pinned |
| Title | Bold link to `/ai/fintelai/c/:id` |
| Timestamp | `14:22` today · **"Yesterday"** · a weekday name (`Mon`) within a week · `May 12` beyond that. Hovering shows the full date and time |
| Preview | The last message, clamped to two lines |
| Footnote | **"{{count}} message"** / **"{{count}} messages"**, plus **" · used {{count}} tool"** / **" · used {{count}} tools"** when the conversation used any |
| Overflow button | aria-label **"Conversation actions"** |

### Row actions

The same four-item menu appears on the list row and in the chat header.

| Item | What it does |
|---|---|
| **Rename** | Turns the title into an inline text field. Enter saves, Escape cancels, blur saves. |
| **Pin** / **Unpin** | Toggles the pin. Capped at **20** pinned conversations. |
| **Export** | **Permanently disabled**, tooltip **"Export will be available soon"**. There is no export endpoint. |
| **Delete** | Red. Opens a confirmation reading `Delete "{{title}}"? You can't undo this.` |

> [!WARNING]
> Delete is a soft delete server-side, but there is no UI to restore a deleted conversation. Treat
> it as permanent.

Deleting from the list shows the snackbar **"Conversation deleted"**; deleting from inside a
conversation returns you to the list.

### List states

| State | What you see |
|---|---|
| Loading | Six row skeletons |
| Load error | A red alert with the server's message, or **"Couldn't load your conversations."**, and a **Retry** action |
| Empty | The Fintelligent mark, **"No conversations yet"**, **"Ask Fintelligent anything about your studies, portfolios, or strategies."**, and a **"Start a conversation"** button |
| No search results | A search icon and **"No conversations match"** followed by your query in italics |
| End of list | **"End of conversations"** |

The list pages 30 conversations at a time and fetches the next page automatically when you scroll
within 120px of the bottom.

## The chat view

```text
┌───────────────────────────────────────────────┐
│ ← │ Conversation title            ·  ⋮        │  ChatHeader
├───────────────────────────────────────────────┤
│  Resuming conversation                        │  ResumeBanner (one-shot, 3 s)
├───────────────────────────────────────────────┤
│  [ Load older messages ]                      │
│                                               │
│   ◈  assistant turn (tool chips, markdown)    │  scroll region
│   ●  your turn                                │
│   ◈  streaming turn …                         │
│                            [ Jump to latest ] │
├───────────────────────────────────────────────┤
│  Fintelligent needs 2 decisions from you      │  AgentQuestionCard (only when asked)
├───────────────────────────────────────────────┤
│  ⟳ Analyzing your request…            0:07    │  AgentStatusBar (exactly one line)
├───────────────────────────────────────────────┤
│  ＋  📎  ⚙  [ Continue the conversation… ]  ▶ │  ChatComposer
│  Fintela is a research tool, not an adviser…  │  disclaimer (always visible)
└───────────────────────────────────────────────┘
```

### Chat header

| Element | Detail |
|---|---|
| Back | Tooltip **"Back to conversations"**, aria-label **"Back"** → `/ai/fintelai` |
| Title | The conversation title, or **"New conversation"** before one exists. A pin glyph precedes it when pinned. |
| Subtitle | The message count, or **"Send a message to start"** |
| Overflow | The same Rename / Pin / Export / Delete menu as the list row. Disabled until the conversation exists. |

There is no model selector. The model resolves from the conversation's preferred or last model,
falling back to `deepseek-v4-pro`.

### Transcript and history

Messages load 50 at a time, newest-first on the wire and reversed for reading. The transcript is
**not** virtualized and does **not** auto-fetch older pages: when more history exists, a
**"Load older messages"** button appears at the top, reading **"Loading…"** while it fetches.

| Situation | What renders |
|---|---|
| Empty conversation | **"Ask Fintelligent anything to get started."** |
| All history loaded and a new turn streaming | The divider **"── End of previous conversation ──"** |
| Transcript fetch failed | **"The transcript could not be loaded."** with a **"Try again"** button |
| Scrolled up more than 80px while streaming | A floating **"Jump to latest"** pill |
| Conversation returns 404 | Snackbar **"This conversation is no longer available."** and a redirect to the list |

Only a genuine 404 evicts you. An expired token or a transport failure leaves you where you are —
the conversation still exists, and it may still have a turn running in it.

### Message anatomy

Only two message roles are ever written: **user** and **assistant**. The transcript renders your
turns with your organization's branded avatar — a person icon when none is set — and
Fintelligent's with its own brand mark, regardless of branding.

| Part | Detail |
|---|---|
| **Tool-step chips** | Outlined chips at the top of an assistant bubble, one per tool the turn ran. A spinner while `calling`, a green check when `done`, a red icon on `error` with the tool's error (or **"Tool failed"**) as the tooltip. Repeats of the same label collapse into one chip with `×N`. |
| **Body** | Markdown with GitHub tables, headings, code blocks and KaTeX maths. Tables and display maths scroll horizontally inside the bubble. |
| **Streaming placeholder** | A spinner and **"Thinking…"** until the first text arrives. |
| **Token caption** | **"{{formatted}} raw-tokens"** when the turn used any, plus ` · {{formatted}} AI tokens` while the turn is live. |
| **Error caption** | The turn's own failure sentence, in red, under the bubble. |
| **Interrupted caption** | Italic amber **"Connection lost mid-reply."** |
| **Hover actions** | **Copy** (confirms with a green check and the tooltip **"Copied"**) and **Regenerate**. Hidden until hover on desktop, always visible on touch. |

**Regenerate** re-asks the nearest preceding human prompt as a fresh turn — it walks past machine
postbacks so it never replays a stale tool result. It is offered on settled assistant turns that
have text, and on turns that errored or were interrupted.

> [!NOTE]
> The two token numbers mean different things. **Raw-tokens** is the model's own count for the turn
> (`input + output + cache_write`; `cache_read` is excluded because it is already inside `input`).
> **AI tokens** is what you were billed. The billed figure is not persisted, so it disappears when
> you reload the conversation and only the raw total remains.

### Machine turns

Some user-role messages are postbacks from the browser rather than something you typed. They render
as compact chips instead of raw JSON.

| Tag | Rendered as |
|---|---|
| `⟦answer⟧` | **"Answered: {{choice}}"**, or **"Skipped the question"** |
| `⟦save-result⟧` | **"Saved"**, **"Saved — {{name}}"**, **"Save cancelled"**, or `Could not save: {{detail}}` |
| `⟦compile-result⟧` | **"Validation passed"**, or `Validation failed: {{detail}}` — where the detail may be **"timed out"**, **"failed"** or **"Unparseable validation result"** |
| `⟦continue⟧` | A hairline divider captioned **"Picking up where it left off"** |

### The status line

Directly above the composer, **exactly one** line renders at a time, announced politely to
assistive technology. It is the answer to "is it working, is it waiting for me, or is it done?"

| State | Copy | Affordance |
|---|---|---|
| Busy · analyzing | **"Analyzing your request…"** | spinner |
| Busy · exploring data | **"Exploring your data…"** | spinner |
| Busy · writing code | **"Writing the code…"** | spinner |
| Busy · configuring | **"Configuring…"** | spinner |
| Busy · validating | **"Validating…"** | spinner |
| Busy · running | **"Running…"** | spinner |
| Waiting · editor confirm | **"Waiting for you to confirm — the Save dialog is open"** | warning colour, optional **"Reopen it"** |
| Waiting · answer | **"Waiting for your answer"** | warning colour |
| Waiting · input | **"Waiting for you"** | warning colour |
| Stopped short | **"Paused — didn't finish"** | warning colour, **"Continue"** button |
| Failed | The failure's own sentence, or **"Couldn't finish — something went wrong"** | red, **"Retry"** when the failure is retryable |
| Finished | **"Finished"** | muted check |

An elapsed clock (`m:ss`) appears on busy states only after 5 seconds — short turns do not get a
timer.

A "waiting" claim is only made when the app can actually put the awaited control back on screen. If
you reload and the card or dialog cannot be rebuilt, the line degrades to **"Paused — didn't
finish"** rather than pointing at something that no longer exists.

### Question cards

When Fintelligent needs a decision it renders a blocking card above the status line, carrying one
to six questions.

| Element | Detail |
|---|---|
| Title | The question itself when there is one; **"Fintelligent needs {{count}} decisions from you"** when there are several, with one tab per question |
| Tabs | Labelled by the question's short label; a green check marks answered, a hollow circle unanswered. Tab list aria-label **"Questions in this card"** |
| Controls | `single` → radio buttons · `multi` → checkboxes · `dropdown` → a select with the placeholder **"Choose an option"** |
| Escape hatch | **"Other…"** unless the question forbids it, revealing a field with the placeholder **"Describe what you'd prefer"** |
| Registry picker | Only on questions that declare a catalog: an autocomplete labelled **"Or pick any other"**, placeholder **"Search the full list…"**, empty text **"Nothing else available"**. Catalogs exist for **fitness functions** and **risk managers** only |
| Footer | **"{{answered}} of {{total}} answered"**, **"Skip"**, and **"Answer"** — disabled until every question is answered |
| Dismiss | The X, aria-label **"Dismiss question"** |

Answering posts an `⟦answer⟧` turn back into the transcript, which is why the card can be rebuilt
after a reload.

### The composer

Controls run left to right: **New conversation** (`+`), **Attach**, **Tools**, the text field, an
optional **"Continue on floating chat"** button, and **Send** / **Stop**.

| Behaviour | Detail |
|---|---|
| Placeholder | **"Continue the conversation…"** (the floating panel uses **"I'm Fintelligent, how can I help you?"**) |
| Keys | Enter sends, Shift+Enter inserts a newline. The field grows to 8 rows on the page, 6 in the panel |
| Streaming | Send becomes Stop (tooltip **"Stop"**, aria-label **"Stop generation"**) |
| Disclaimer | Always visible underneath, on both surfaces |

The Send button's disabled tooltip resolves in this order, first match wins:

| Order | Tooltip | Meaning |
|---|---|---|
| 1 | **"You're offline"** | The browser reports no connection |
| 2 | The lock reason | See the table below |
| 3 | **"Streaming a reply…"** | A turn is in flight on this surface |
| 4 | **"Type a message"** | Nothing to send |

Three lock reasons exist on the full page, resolved in this order, first match wins:

| Lock | Copy |
|---|---|
| Another browser tab owns the conversation | **"Active in another tab — close it to interact here"** |
| A stream belonging to a different conversation is running in the shared session | **"Active in the floating panel — close it to interact here"** |
| A validation round-trip is in flight | **"Waiting for the editor to finish validating"** |

The panel's own chain is the mirror image: the daily-cap tooltip first, then **"Active in the
full-page chat — close it to interact here"**, then **"Active in another tab — close it to interact
here"**, then **"Fintelligent is still working on this conversation"**.

### Tools menu prompts

The **Tools** menu (tooltip **"Tools"**) is the only suggested-prompt surface in the product. Each
entry sends a fixed English prompt — the agent reasons in English regardless of your UI language.

| Menu item | Prompt sent |
|---|---|
| **Design a Strategy** | `I want to design a new trading strategy. Guide me step by step.` |
| **Generate a Fitness Function** | `Help me generate a new fitness function. What should I optimize for?` |
| **Create a Asset Group** | `I want to create a new asset group. Guide me through ticker selection and date configuration.` |
| **Send a Study** | `I want to set up and send a new study. Guide me through the configuration.` |
| **Design a Risk Manager** | `Help me design a risk manager to control drawdown and protect my portfolio.` |
| **Manage Portfolios** | `Help me manage my portfolios — review, compare, and take action on them.` |

Choosing one sends immediately and leaves whatever you had typed untouched.

### Attachments and pasted code

The **Attach** menu (tooltip **"Attach"**) offers two items.

| Item | Status |
|---|---|
| **Upload File** | **Not wired.** The picker opens and accepts `.pdf,.txt,.html,.htm,.xlsx,.csv`, and the chosen files appear as deletable chips — but nothing is uploaded and nothing reaches the agent. |
| **Paste Code** | **Fully wired.** The snippet is fenced as a markdown code block and appended to your message on send. |

> [!CAUTION]
> Do not rely on file attachment. Selected files are shown and then discarded on send. To give
> Fintelligent a file's contents today, paste them as code or as text in the message body.

The **Paste code** dialog carries a language selector (Python, TypeScript, JavaScript, Rust, SQL,
JSON, YAML, Plain text) with an **"Auto-detect ({{language}})"** option, a live
**"{{used}} / {{max}} characters"** counter, the hint **"Ctrl/Cmd+Enter to attach · Esc to close"**,
and **"Done"** / **"Cancel"**. The limit is **50,000 characters**; beyond it the dialog refuses with
**"Code is too long — the limit is {{max}} characters."** An attached snippet shows as a chip
labelled **"Code snippet ({{language}})"**.

## Streaming behaviour

A turn is a server-sent-event stream. The backend proxies the agent's frames verbatim, persists the
assistant turn as it goes, and keeps draining even if you disconnect.

| Frame | Effect in the UI |
|---|---|
| `conversation` | Injected by the backend, never by the agent. Carries the resolved conversation id and sequence numbers |
| `text` | Feeds the visible narration |
| `text_reset` | Clears the in-progress narration — the model retracted it |
| `tool_call` | Pushes a tool chip in the `calling` state |
| `tool_result` | Marks that chip `done` or `error` |
| `status` | Drives the status line; the last one is persisted with the message |
| `title_suggestion` | Renames the conversation |
| `usage` | Updates the live token caption (cumulative for the whole turn) |
| `done` / `error` | Terminal |

Behaviour worth knowing:

- **The session outlives the surface.** The stream is owned above both chat surfaces, so closing the
  floating panel, or navigating while the agent navigates for you, does not abort the turn. Within
  one tab the only lock is a stream running for a *different* conversation; a second browser tab
  locks the conversation outright.
- **Only one narration line at a time.** After a tool boundary the next narration *replaces* the
  previous one rather than appending, so the bubble shows the current thought, not a transcript of
  every thought.
- **Stop is a client abort.** Pressing Stop cancels the request; the backend still persists what it
  received, flagged `interrupted`, and the bubble shows **"Connection lost mid-reply."**
- **A turn that runs out of budget is resumed once, automatically.** The client posts a `⟦continue⟧`
  turn on the first `incomplete` ending. If the very next turn also ends incomplete, it stops
  offering and shows the **"Continue"** button instead — a turn that ran out twice is not making
  progress.
- **Tool results never cross the wire.** The `tool_result` frame carries the tool name and, on
  failure, its error — never the payload. Only the model sees results.
- **Titles.** The agent may propose one; otherwise the first turn falls back to the first 60
  characters of your message.

> [!NOTE]
> Fintelligent does not render citations or source links. The provenance you get is the tool-step
> chips, which name *which* tools ran, and the agent's own prose. When a number matters, ask it
> which study, portfolio or ticker the number came from.

## Errors and limits

### Send failures

When a send never becomes a stream, the chat renders a red alert with the reason and — only when
retrying could change the answer — a **"Retry"** action that re-sends your last real prompt. Retry
is withheld on 402, 501 and 503, which return the same answer every time.

In every row below, **the server's own sentence wins when it sent one**; the strings quoted are the
client-side floor for when it did not.

| Condition | HTTP | What you see |
|---|---|---|
| Session expired / forbidden | 401, 403 | **"Your session expired — sign in again to keep going."** |
| Rate limited | 429 | **"Too many requests right now. Give it a moment and try again."** |
| AI agent not configured on the deployment | 503 | *"The AI agent is not configured on this deployment (AI_AGENT_BASE_URL is unset), so chat is unavailable."* — the server's own message, in place of the floor **"The assistant is unavailable on this deployment."** |
| AI-token balance depleted | 402 | The server's sentence in a red alert, **and** the purchase dialog opens, carrying `insufficient_ai_tokens` and your available balance |
| Open payment dispute | 402 | *"This organization is on hold while a payment dispute is resolved. Contact support — purchasing more tokens will not lift the hold."* No purchase dialog — buying more tokens does not clear it |
| Oversized page context | 406 | The request is rejected rather than truncated (limit 32 KB of serialized JSON) |
| Anything else | any | **"The assistant could not be reached (error {{status}})."** |
| Request never left the browser | — | **"Connection error"** |

Those rejections land *before* your message is stored, so nothing is written to the transcript.

Two later failures are handled differently: if the conversation history cannot be read, or the
upstream stream never opens, your message **stays** and the backend persists a failed assistant
turn beside it, so there is something concrete to retry. Those turns carry one of these sentences:

| Sentence | Retryable |
|---|---|
| *the assistant is not available on this deployment* | no |
| *the assistant refused this turn (upstream {status})* | only for 5xx |
| *the assistant could not be reached* | yes |
| *your conversation history could not be read* | yes |

Two more sentences come from a stream that had already opened: *"the assistant stopped responding
mid-answer"* when it ended without a terminal status, and *"the answer could not be saved — it will
not be here if you reload"* when persisting the turn failed.

### Limits and caps

| Limit | Value |
|---|---|
| Pinned conversations | **20** — exceeding it returns HTTP **406** with *"Cannot pin more than 20 conversations at once"* |
| Conversations per list page | 30 (server max 100) |
| Messages per transcript page | 50 (server max 200) |
| History sent to the model | the 200 most recent messages |
| Last-message preview | 240 characters |
| Pasted code snippet | 50,000 characters |
| Page context payload | 32 KB serialized JSON |
| Free-tier chat messages | 10 per day when enforcement applies; uncapped once activated |

> [!TIP]
> A cross-tenant conversation id returns **404**, never 403 — existence is never leaked. If a
> conversation "disappears", it belongs to another user or another organization.

## What Fintelligent will not do here

Documented so you do not go looking for them:

| Not available | Detail |
|---|---|
| **Conversation export** | The menu item exists in both menus and is permanently disabled. There is no export endpoint. |
| **File upload** | The picker and chips render; nothing is sent. |
| **Model picker** | Removed from the UI. The model is resolved from the conversation. |
| **Bring-your-own LLM key** | Removed. The key is platform-managed; no per-request key is read or forwarded. |
| **Agent-generated file downloads** | PDF reports are composed and downloaded entirely in your browser. No server-delivered file channel is in use. |
| **Citations** | No source-link affordance exists in the transcript. |
| **Contextual prompt chips** | The Tools menu is the only shortcut surface. |
| **Broker and live-trading tools** | The agent's broker tool group is empty by design — live-account reads as well as mutations are withheld, so no connected-brokerage data reaches the model provider. |
| **Panel-to-page hand-off** | The floating panel has no header controls. To reach the full page, use the sidebar entry or a notification deep link. |

## Where to go next

- [Fintelligent capabilities](/docs/fintelligent-capabilities) — what it can read, what it can
  change, and the tools behind each.
- [Drafts and runs](/docs/fintelligent-drafts-and-runs) — how an agent edit becomes a saved object,
  and how to track a turn that is still working.
- [Tokens and billing](/docs/tokens-and-billing) — Fintela AI Tokens, the trial grant, and the
  purchase flow.
- [Navigation](/docs/navigation) — the sidebar, More Options, and every route in the app.
