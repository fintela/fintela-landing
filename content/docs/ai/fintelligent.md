---
title: Fintelligent
section: Artificial Intelligence
sectionOrder: 6
order: 1
published: true
updated: 2026-09-01
summary: Fintelligent is Fintela's built in AI assistant, what it can do for you, where to find it, and how to chat with it.
keywords: fintelligent, ai assistant, chat, conversations, trading strategies, portfolios, ai tokens, prompts
---

Fintelligent is the AI assistant built into Fintela. Ask it about your studies, portfolios,
strategies, fitness functions, risk managers, asset groups, or market data, and it can act on your
behalf: fill in an open editor for you, draft a new study, walk you to the right page in the app,
ask you a clarifying question when it needs a decision, and put together a PDF report. It's a
conversation, not a catalog: there's no list of "Fintelligent" items to create and manage. What
sticks around is your conversations, the drafts it leaves behind in editors for you to review, and
the runs it starts.

## What Fintelligent is

| Aspect | Detail |
|---|---|
| **Interface** | A chat you can open two ways: as a dedicated full page conversation, or as a floating panel available from anywhere else in the app. |
| **AI model** | Fintelligent runs on a general purpose AI model chosen by Fintela. There's no model picker: the same assistant is used throughout. |
| **Cost** | Chatting with Fintelligent is billed in Fintela **AI Tokens** (a balance separate from the compute tokens you spend running studies and optimizations). See [Tokens and billing](/docs/tokens-and-billing). |
| **What it can see** | Fintelligent only sees what you can see. It works within your own account and organization, so it never surfaces another user's or another organization's data. |
| **Status** | Beta. Expect the occasional rough edge: the floating panel carries a **"Beta"** chip and a note that you may see bugs or incomplete answers. |

Two things Fintelligent is **not**:

- **Not a catalog.** There's no table view or "create new" wizard for Fintelligent itself, what it
  leaves behind is conversations (this page), drafts, and runs
  ([Drafts and runs](/docs/fintelligent-drafts-and-runs)).
- **Not an adviser.** A disclaimer sits permanently under the message box wherever you chat:
  *"Fintela is a research tool, not an investment adviser. Output is informational only and not
  investment advice."*

> [!NOTE]
> This page covers where the chat lives and how to use it day to day. For the full catalog of what
> Fintelligent can actually do (reading your data and taking action), see
> [Fintelligent capabilities](/docs/fintelligent-capabilities). For how its suggested edits get
> reviewed and saved, see [Drafts and runs](/docs/fintelligent-drafts-and-runs).

## Where Fintelligent lives

Fintelligent doesn't have its own section in the sidebar. You'll find it tucked under **More
Options**, as the last entry there. Beyond that, it's reachable from anywhere in the app through a
few consistent entry points:

| Entry point | Where | What happens |
|---|---|---|
| Sidebar → **More Options** → **Fintelligent** | Desktop sidebar | Opens the full page chat |
| Launcher button | Bottom center of the screen, desktop only | Hover or click to pop open the floating chat over whatever page you're on |
| Mobile navigation | **Fintelligent** tab in the bottom bar | Opens the floating panel; shows a dot badge while a reply is still in progress |
| Run indicator | A small pill that follows you around the app | Reads **"Fintelligent is working"** or **"Fintelligent needs you"**, tap it to jump back into that conversation |
| Notifications | Notification bell | Takes you straight to the conversation that triggered the notification |

The floating launcher and panel don't appear while you're already on the full page chat, since
that page *is* the conversation: you don't need a shortcut to something you're already looking
at.

The floating panel itself is deliberately minimal: just the conversation, the message box, and the
beta notice, with no extra header. Click outside it or press Escape to collapse it back down to
the launcher button. Collapsing it never interrupts a reply that's still coming in.

### Moving between conversations

Your chat has three views: your list of past conversations, a blank slate for starting a new one,
and an existing conversation you're continuing. Starting a new conversation and continuing an
existing one feel like the same screen: the moment you send your first message from a blank
conversation, it seamlessly becomes a saved conversation, without interrupting the reply that's
already streaming in or reloading the page.

## Who can use it

Fintelligent is available to **Manager** and **Owner** level accounts. **Analyst** level accounts
don't currently have access to it.

Unlike [Laboratory](/docs/laboratory), Fintelligent doesn't sit behind a locked, blurred preview
when your organization hasn't purchased tokens: instead, everyone gets to use it right away, with
a daily message cap until your organization activates full usage:

**Free tier daily cap.** If your organization hasn't purchased tokens yet, you get **10 free
messages per day** in Fintelligent, based on your usage over the last 24 hours. The floating panel
keeps you posted along the way: once you're down to three or fewer messages for the day, it shows
how many you have left, and once you hit the cap, the message box locks with a note that your
limit resets tomorrow, plus a **"Buy tokens"** button that takes you straight to the Tokens section
of your account. Once your organization has purchased tokens, this daily cap goes away entirely.

## Starting and resuming a conversation

A conversation isn't created until you actually send your first message; opening a blank chat
window doesn't create anything on its own. Type your message and hit send: Fintelligent saves the
conversation, starts replying, and the conversation quietly becomes a permanent one in your list:
nothing about the reply is interrupted while that happens.

| Action | How |
|---|---|
| Start fresh | **"New chat"** in the conversation list, the `+` in the message box, or the New conversation button on mobile |
| Resume | Click a conversation in your list, follow a notification, or tap the run indicator pill |
| Switch to the floating panel | **"Continue on floating chat"** in the full page message box, moves your current conversation into the panel. Not available until you've sent at least one message, or while a reply is still coming in |

Reopening a conversation with earlier messages briefly shows a **"Resuming conversation"** banner
at the top. It disappears on its own after a few seconds, or right away if you tap it, and never
shows up on a brand new conversation.

If you start typing and then navigate away, your unsent draft is kept for you locally in your
browser, so you can pick up exactly where you left off. Switching to a different conversation swaps
in that conversation's own draft, and clears any code snippet you had attached.

## The conversation list

Your conversation list shows only your own conversations, and only within your own organization:
never anyone else's.

### Header and search

| Control | Detail |
|---|---|
| Title | Fintelligent |
| Subtitle | **"Your past conversations"** |
| New conversation (desktop) | **"New chat"** button |
| New conversation (mobile) | A floating button above the bottom navigation |
| Search | A box with the placeholder **"Search conversations…"**, a small spinner while results catch up, and a **"Clear search"** button once you've typed something |

Search looks across both conversation titles and each conversation's most recent message, and
updates shortly after you stop typing.

### Time grouping

Your conversations are grouped under headers, in this order:

| Header | Bucket |
|---|---|
| **Today** | Same calendar day |
| **Yesterday** | Previous calendar day |
| **Earlier this week** | 2 to 6 days ago, same calendar month |
| **Earlier this month** | Same calendar month, older than that |
| **Older** | Everything else |

Pinned conversations always float to the top of whichever time group they fall into, not
necessarily to the very top of your whole list.

### Conversation row

| Element | Detail |
|---|---|
| Pin icon | Shown next to the title when a conversation is pinned |
| Title | The conversation's name, click to open it |
| Timestamp | The time for today's conversations, **"Yesterday"**, a weekday name within the past week, or the date beyond that. Hover to see the exact date and time |
| Preview | The most recent message, trimmed to two lines |
| Message count | How many messages are in the conversation, plus how many tools it used, if any |
| Actions | A **"⋮"** button opens the conversation's menu |

### Row actions

The same menu appears both on a list row and inside a conversation's header.

| Item | What it does |
|---|---|
| **Rename** | Turns the title into an editable field. Enter saves, Escape cancels, clicking away saves. |
| **Pin** / **Unpin** | Pins the conversation to the top of its time group. You can pin up to **20** conversations at once. |
| **Export** | Not available yet. |
| **Delete** | Opens a confirmation asking if you're sure: deleting can't be undone. |

> [!WARNING]
> Deleting a conversation is permanent. There's currently no way to restore one once it's gone, so
> treat Delete as final.

Deleting from the list shows a quick confirmation toast; deleting from inside a conversation takes
you back to your list.

### List states

| Situation | What you see |
|---|---|
| Loading | Placeholder rows while your conversations load |
| Something went wrong | An error message, with a **Retry** option |
| No conversations yet | The Fintelligent mark, **"No conversations yet"**, and a prompt to start one |
| No search matches | **"No conversations match"**, along with your search term |
| Reached the end | **"End of conversations"** once you've scrolled through everything |

Your list loads in batches and quietly fetches more as you scroll toward the bottom, so you rarely
need to click anything to see older conversations.

## The chat view

From top to bottom, a conversation is laid out as:

- A header with the conversation's title and a menu of actions
- The message history: your turns and Fintelligent's replies
- A question card, shown only when Fintelligent needs a decision from you
- A single status line telling you what's happening right now
- The message box, with the compliance disclaimer always visible underneath it

### Chat header

| Element | Detail |
|---|---|
| Back | Returns you to your conversation list |
| Title | The conversation's name, or **"New conversation"** before you've sent anything. A pin icon shows if it's pinned |
| Subtitle | How many messages are in the conversation, or a prompt to send one to get started |
| Menu | The same Rename / Pin / Export / Delete actions as the list row. Disabled until the conversation actually exists |

There's no model selector here: Fintelligent uses the same assistant throughout a conversation.

### Transcript and history

Your conversation loads the most recent messages first. If there's more history than what's shown,
a **"Load older messages"** button appears at the top so you can pull in earlier turns on demand.

| Situation | What renders |
|---|---|
| Empty conversation | **"Ask Fintelligent anything to get started."** |
| All history loaded, new reply coming in | A divider marking where your earlier conversation ends and the new turn begins |
| Couldn't load the conversation | **"The transcript could not be loaded."** with a **Try again** button |
| Scrolled up while a reply is streaming | A floating **"Jump to latest"** button appears |
| Conversation no longer exists | A notice that it's no longer available, and you're returned to your list |

A conversation only disappears on you if it's genuinely gone (deleted, or not yours). A temporary
connection hiccup leaves you exactly where you are: the conversation is still there, and it may
still be working in the background.

### Message anatomy

Only your turns and Fintelligent's replies appear as regular messages. Your organization's own
branding shows on your avatar; Fintelligent always keeps its own brand mark.

| Part | Detail |
|---|---|
| **Tool steps** | Small chips at the top of a reply showing which actions Fintelligent took to answer you: a spinner while a step is running, a green check once it's done, or a red icon (with a tooltip explaining what went wrong) if a step failed. Repeated steps of the same kind collapse into one chip with a count. |
| **Reply text** | Formatted like a document: headings, tables, code blocks, and mathematical notation all render properly. Wide tables or equations scroll sideways within the reply rather than overflowing the page. |
| **While it's typing** | A **"Thinking…"** placeholder shows until the first words of the reply arrive. |
| **Token usage** | A small caption shows how many tokens the turn used, plus how many AI Tokens it has cost you so far while the reply is still in progress. |
| **If something goes wrong** | The specific reason appears in red beneath the reply. |
| **If the connection drops mid reply** | Italic amber text reads **"Connection lost mid reply."** |
| **On hover** | **Copy** (confirms with a checkmark) and **Regenerate** appear over each reply, always visible on touch devices. |

**Regenerate** asks your most recent question again as a brand new turn, so Fintelligent doesn't just
repeat a stale answer. It's offered on any finished reply that has text, and on any turn that
failed or got interrupted.

> [!NOTE]
> The two token numbers you see mean different things. The **raw** count is simply how much the
> underlying model processed for that turn. The **AI Tokens** figure is what was actually billed
> to your account, shown live while the reply is in progress, but not saved afterward, so once
> you reload the conversation only the raw count remains visible.

### System messages in the transcript

A few entries in your conversation aren't things you typed, they're the app logging an action you
took, shown as a short, readable line rather than as your own message:

| Situation | Shown as |
|---|---|
| You answered a question card | **"Answered: {{your choice}}"**, or **"Skipped the question"** if you dismissed it |
| You saved a change to an editor | **"Saved"**, **"Saved: {{name}}"**, **"Save cancelled"**, or a note explaining why the save failed |
| Your code was checked | **"Validation passed"**, or details on why it failed (for example, a timeout) |
| Fintelligent picked back up after being paused | A divider reading **"Picking up where it left off"** |

### The status line

Directly above the message box, a single line always tells you what's happening right now:

| State | Copy |
|---|---|
| Busy · analyzing | **"Analyzing your request…"** |
| Busy · exploring data | **"Exploring your data…"** |
| Busy · writing code | **"Writing the code…"** |
| Busy · configuring | **"Configuring…"** |
| Busy · validating | **"Validating…"** |
| Busy · running | **"Running…"** |
| Waiting on you · confirm a save | **"Waiting for you to confirm: the Save dialog is open"** |
| Waiting on you · answer a question | **"Waiting for your answer"** |
| Waiting on you · other input | **"Waiting for you"** |
| Stopped short | **"Paused, didn't finish"**, with a **Continue** button |
| Failed | The specific reason, or **"Couldn't finish, something went wrong"**, with **Retry** when trying again could help |
| Finished | **"Finished"** |

Once a busy state has run for more than five seconds, a small elapsed time clock appears next to
it: quick replies don't bother with a timer.

If you reload the page while Fintelligent is "waiting" on something that can no longer be shown to
you (a dialog that's since closed, say), the status line falls back to **"Paused, didn't
finish"** instead of pointing you at a control that isn't there anymore.

### Question cards

Sometimes Fintelligent needs you to make a decision before it can continue, choosing between
candidate risk managers, say, or confirming a setting. When that happens, a card appears above the
status line with one to six questions.

| Element | Detail |
|---|---|
| Title | The question itself, or **"Fintelligent needs {{count}} decisions from you"** with a tab per question when there's more than one |
| Tabs | Labeled with a short version of each question; a green check marks the ones you've answered |
| Answer controls | Single choice (radio buttons), multiple choice (checkboxes), or a dropdown, depending on the question |
| **"Other…"** | Lets you type a free text answer instead, when the question allows it |
| Search a full list | On questions about fitness functions or risk managers, you can search your entire library instead of picking from the suggested options |
| Footer | Shows how many questions you've answered, plus **Skip** and **Answer**: Answer stays disabled until every question has a response |
| Dismiss | An X to close the card |

Once you answer, your choice is logged into the conversation just like a message, which is why the
card comes back correctly if you reload the page.

### The composer

Left to right, the message box gives you: New conversation, Attach, Tools, the text field itself,
an optional **"Continue on floating chat"** button, and Send.

| Behaviour | Detail |
|---|---|
| Placeholder text | **"Continue the conversation…"** on the full page, **"I'm Fintelligent, how can I help you?"** in the floating panel |
| Keyboard | Enter sends your message, Shift+Enter adds a new line. The box grows as you type, up to eight lines on the full page and six in the panel |
| While replying | Send turns into a **Stop** button so you can cancel |
| Disclaimer | The "not investment advice" notice stays visible underneath at all times |

If Send is greyed out, hover it to see why: you're offline, you've hit a usage limit, a reply is
already streaming, or there's simply nothing typed yet.

Fintelligent only runs one active conversation at a time per account. If you already have a reply
in progress in another browser tab or in the floating panel, the message box will tell you where
it's busy rather than let you start a second one at once.

### Tools menu prompts

The **Tools** menu is the only built in shortcut list in Fintelligent. Each entry sends a ready made
prompt for you, so you can jump straight into a common workflow:

| Menu item | What it asks Fintelligent to do |
|---|---|
| **Design a Strategy** | Guide you step by step through designing a new trading strategy |
| **Generate a Fitness Function** | Help you build a new fitness function and decide what to optimize for |
| **Create an Asset Group** | Walk you through ticker selection and date configuration for a new asset group |
| **Send a Study** | Walk you through configuring and launching a new study |
| **Design a Risk Manager** | Help you design a risk manager to control drawdown and protect your portfolio |
| **Manage Portfolios** | Help you review, compare, and take action on your portfolios |

Choosing one sends immediately, without touching anything you'd already started typing. Note that
these prompts are always sent in English, even if you're using Fintela in another language.

### Attachments and pasted code

The **Attach** menu currently offers two options.

| Item | Status |
|---|---|
| **Upload File** | You can pick a file (PDF, text, HTML, spreadsheet, or CSV) and it appears as a chip, but it doesn't actually reach Fintelligent yet. |
| **Paste Code** | Fully working. Your snippet is added to your message as a formatted code block when you send. |

> [!CAUTION]
> Don't rely on file attachments yet, files you select are shown but not actually sent. To share a
> file's contents with Fintelligent today, paste the text directly into your message using **Paste
> Code**.

The Paste Code dialog lets you choose a language (Python, TypeScript, JavaScript, SQL, JSON,
YAML, or plain text) or autodetect it, shows a running character count, and accepts up to
**50,000 characters**, past that, it asks you to trim the snippet before you can attach it.

## While Fintelligent is responding

Replies from Fintelligent appear progressively, word by word, rather than all at once, so you can
start reading before it's finished. A few things worth knowing about what you'll see while that's
happening:

- **A reply keeps going even if you navigate away.** Closing the floating panel, or letting
  Fintelligent take you to another page, does not interrupt what it's doing, you can always come
  back to check on it. The only thing that locks you out is trying to run a second conversation at
  the same time.
- **Only the current thought is shown.** When Fintelligent moves from one step to the next (say,
  from analyzing your request to writing code), the visible text updates to reflect that step,
  rather than stacking every intermediate thought on top of each other.
- **Stop ends your side of the connection.** If Fintelligent had already made progress before you
  hit Stop, that progress is kept and marked as interrupted, and you'll see **"Connection lost
  mid reply."**
- **A reply cut short by length limits picks back up automatically, once.** If it runs out of room
  again on the very next turn, Fintelligent stops continuing automatically and shows you a **Continue**
  button instead: a sign it may need more direction from you rather than just more room.
- **You see the outcome of each action, not its raw output.** The tool chips tell you which action
  ran and whether it succeeded, but the underlying data isn't dumped into the transcript: you see
  it reflected in Fintelligent's own written answer.
- **Conversation titles.** Fintelligent will often suggest a title for a new conversation; if it
  doesn't, your first message is used instead.

> [!NOTE]
> Fintelligent doesn't show citations or source links. What you get instead is the tool step chips
> (which name the actions it took) plus its own written explanation. When a number matters to
> you, just ask Fintelligent which study, portfolio, or ticker it came from.

## Errors and limits

### When a message doesn't go through

If your message fails to send at all, you'll see an error explaining why, and, when trying again
could actually help, a **Retry** button that resends your last message for you. Retry isn't offered
when trying again wouldn't change the outcome, such as when your AI Token balance is the problem.

Whenever possible, Fintelligent shows its own specific explanation for what went wrong; here's what
you'll see when it doesn't have anything more specific to add:

| Condition | What you see |
|---|---|
| Your session expired | **"Your session expired, sign in again to keep going."** |
| Too many requests too quickly | **"Too many requests right now. Give it a moment and try again."** |
| Fintelligent isn't available right now | A note that the assistant is unavailable |
| You're out of AI Tokens | An alert plus a prompt to buy more tokens, showing your current balance |
| Your account is on hold over a payment dispute | A note that the hold needs to be resolved with support, buying more tokens won't lift it on its own |
| Too much page context attached | The message is rejected outright rather than silently cut down, so you know to trim it and try again |
| Anything else | A generic "couldn't reach the assistant" message |
| Never left your device | **"Connection error"** |

None of these count against you: a message that's rejected outright before Fintelligent starts
responding is never saved to your conversation.

A couple of failures happen after your message is already sent, for example, if your conversation
history can't be loaded, or Fintelligent's reply never starts. In those cases your message stays
visible, and a failed reply is added next to it so you have something concrete to retry, rather
than losing your place. You may also occasionally see a note that a reply cut off without properly
finishing, or that a finished reply couldn't be saved, in that last case, it won't be there
anymore if you reload.

### Limits and caps

| Limit | Value |
|---|---|
| Pinned conversations | Up to **20** at a time |
| History Fintelligent considers | Your most recent **200** messages |
| Pasted code snippet | Up to **50,000** characters |
| Free tier chat messages | **10** per day until your organization activates full usage; uncapped after that |

> [!TIP]
> If a conversation seems to have vanished, Fintela never confirms whether it exists to someone who
> shouldn't see it, so a "missing" conversation almost always just belongs to a different user or
> a different organization, not something you accidentally deleted.

## What Fintelligent will not do here

Documented so you don't go looking for them:

| Not available | Detail |
|---|---|
| **Conversation export** | Coming soon, the option is visible in the menu but not active yet. |
| **File upload** | The picker works, but attached files aren't actually sent to Fintelligent yet. |
| **Choosing a specific model** | Not available, Fintelligent always uses the same assistant. |
| **Using your own AI provider or key** | Not supported. The AI capability is fully managed by Fintela. |
| **Downloadable files from Fintelligent** | PDF reports are put together right in your browser rather than delivered as a file from Fintelligent itself. |
| **Citations** | No source link feature exists in the transcript today. |
| **Extra suggested prompt shortcuts** | The Tools menu is the only built in shortcut list. |
| **Broker access and live trading** | Fintelligent deliberately has no access to your connected brokerage accounts or live trading tools: it can't read your live positions or place trades, by design. |
| **Jumping from the panel to the full page** | The floating panel has no direct link to the full page chat; use the sidebar entry or a notification instead. |

## Where to go next

- [Fintelligent capabilities](/docs/fintelligent-capabilities): what it can read, what it can
  change, and the tools behind each.
- [Drafts and runs](/docs/fintelligent-drafts-and-runs): how an agent edit becomes a saved object,
  and how to track a turn that is still working.
- [Tokens and billing](/docs/tokens-and-billing): Fintela AI Tokens, the trial grant, and the
  purchase flow.
- [Navigation](/docs/navigation): the sidebar, More Options, and every route in the app.
