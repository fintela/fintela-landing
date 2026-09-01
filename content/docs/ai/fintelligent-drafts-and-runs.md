---
title: Drafts & Runs
section: Artificial Intelligence
sectionOrder: 6
order: 3
published: true
updated: 2026-09-01
summary: How Fintelligent proposes changes as an unsaved draft, and how you track, confirm or stop it while it's working.
keywords: draft, unsaved changes, run, in progress, approve, apply, review, confirmation, discard, notifications
---

Fintelligent never changes your workspace without giving you a chance to look first. When it puts
something together — a strategy, a fitness function, a risk manager, an asset group, or a study —
the work shows up in two places you can see and control: a **draft**, which is unsaved work sitting
in the relevant editor, ready for you to review, and a **run**, which is the live status of the
conversation turn that produced it — what Fintelligent is doing right now, what it stopped for, and
how it ended. A draft is *what* Fintelligent produced. A run is *what it's doing*. Neither one
changes anything in your account by itself — the final step is always yours.

## Drafts vs. runs, at a glance

| | A draft | A run |
|---|---|---|
| What it is | Unsaved content sitting inside an editor | The live status of one chat turn |
| Shows up when | Fintelligent proposes work, or you start typing in an editor | You send a message |
| Written by | Fintelligent, or you, as you type | Fintelligent, as it works |
| Lasts until | You save the resource or discard the draft | The turn ends, or you answer what it's waiting on |
| Where you see it | The Strategy, Fitness Function, Risk Manager and Asset Group editors | The run chip, the mobile nav badge, and the status line in the chat |
| Can you edit it | Yes — it's simply the editor's content | No — it's a read-only status |

## What a draft is

A draft is stored exactly as the editor holds it — whatever fields, code, parameters or settings
you'd normally fill in yourself. Fintelligent can fill in a strategy's code and parameters, a
fitness function's logic, a risk manager's rules, an asset group's ticker list, or a study's
configuration, and it lands as a draft inside that editor, just as if you'd typed it there.

A draft is **not a save**. Nothing about creating a draft changes any resource in your account —
only your own click on the editor's Confirm dialog does that, whether the draft came from
Fintelligent or from you.

Drafts exist because Fintelligent needs somewhere to put its work while you're not looking at the
editor — for example, while it's still explaining its reasoning to you in chat, or while you've
navigated to another page. Without a draft, that work would simply be lost the moment you looked
away.

### How reliably a draft is saved

Your draft is protected at three levels, and the most recent version always wins:

- **While you're typing**, changes are held instantly, so if Fintelligent writes a field you see it
  update right away, even before anything reaches Fintela's servers.
- **If you reload the page** in the same browser tab, your unsaved work is restored from a
  short-lived local copy — so an accidental refresh doesn't lose your last few minutes of work.
- **Fintela's servers keep a copy too**, updated within a couple of seconds of your last keystroke,
  so closing the tab, switching devices, or signing back in later brings your draft right back where
  you left it.

If you have unsaved local edits, they always take priority over anything the server remembers — your
latest work is never silently replaced by an older version. And if you ever paste in something
unusually large as a single field — a very long piece of code, for example — the draft may be
rejected as too large to store; that's a sign to split it up rather than a bug.

### One draft at a time, per resource

Fintelligent (and you) can only have one active draft per resource you're working on. Creating a
brand-new strategy and separately editing an existing one are treated as two different slots, so
they never overwrite each other, and you can't end up with two competing unsaved drafts for the same
thing.

| You're drafting a… | Learn more |
|---|---|
| Strategy | [Strategies](/docs/strategies) |
| Fitness function | [Fitness functions](/docs/fitness-functions) |
| Risk manager | [Risk managers](/docs/risk-managers) |
| Asset group | [Asset groups](/docs/asset-groups) |
| Study | [Studies](/docs/studies) |

Anything outside these five resource types can't be drafted — Fintelligent will tell you so rather
than trying anyway.

Drafts are private to you. A colleague's half-written strategy is invisible to you, and yours is
invisible to them, even within the same organization.

### Where you'll actually see a draft

Four editors show you a draft when one is waiting: **Strategy**, **Fitness Function**, **Risk
Manager** and **Asset Group**. Open any of these to create or edit one, and if Fintelligent (or you,
in an earlier session) left unsaved work behind, you'll see it there.

The **study builder does not currently support this.** Fintelligent can still save its progress on a
study behind the scenes, but the study builder won't offer it back to you when you open it — for a
study, treat Fintelligent's chat replies and the confirmation dialog (covered below) as the source
of truth instead.

> [!NOTE]
> There's no single screen listing every draft Fintelligent has ever left for you. To find one, open
> the editor for the resource it belongs to — the draft banner will be waiting there if something is
> unsaved.

## The draft review flow

```text
Fintelligent proposes work            you open the editor
        │                                      │
        └──────────────►  banner: "Fintelligent left an unsaved draft here"
                                                │
                        ┌───────────────────────┴───────────────────────┐
                  "Keep the draft"                              "Discard and restore"
                        │                                                 │
          the draft becomes yours,                       the editor reverts to what's
          saving is unblocked                              saved, and the draft is gone
                        │
              Save → review → Confirm
                        │
                you click Confirm
                        │
        the resource is saved, and the draft is cleared
```

### Draft states

A dirty draft isn't one state but two, and the difference is who produced the content.

| State | Badge | Banner | Can you save from it? |
|---|---|---|---|
| Clean — matches the saved resource | none | none | yes, nothing to save |
| **Your** unsaved edits, made in this session | `Unsaved changes`, outlined, tooltip *"This is not what's saved. Save to commit it."* | none | yes |
| Content restored, written by **Fintelligent** | `Unsaved draft`, filled warning, tooltip *"Fintelligent prepared this and it has not been saved. Keep it or discard it."* | *"Fintelligent left an unsaved draft here"* | no, not until you decide |
| Content restored, written by **you earlier** | `Unsaved draft`, tooltip *"Restored unsaved work. Keep it or discard it before saving."* | *"You left unsaved changes here"* | no |
| Content restored after a reload | `Unsaved draft`, same tooltip | *"Restored from your previous session"* | no |

The pattern to remember: anything that didn't come from your current typing session is shown to you
as an **offer** — never applied as if it were already the saved resource.

> [!WARNING]
> Typing on top of an unreviewed draft does not approve it. The editor deliberately keeps the review
> flag set while you edit, because fixing a typo on top of somebody else's draft isn't the same as
> accepting the rest of it. You still have to click Keep or Discard.

### The banner and the badge

The banner is a warning-coloured alert at the top of the editor. Under the title it reads *"This is
not the saved version. Review it before saving, or discard it to go back to what's saved."*

Below that, a `Changes` row lists one chip per top-level field that differs from the saved
resource — things like `name`, `description`, `code`, `parameters`, `data sources`, `lookback
function`, `lookback mode`, `endpoint`, `timeout`, `max concurrency`, `instruments`, `member
portfolios`, `rules`, or `type`, depending on what you're editing. Fields are always compared by
their actual content, not by whether the underlying object happened to get rebuilt — so an
unrelated internal refresh never falsely shows up as a change.

### Keep the draft or discard it

Two buttons, and they do different things to the copy saved on Fintela's servers.

| Button | Effect on the editor | Effect on the server copy |
|---|---|---|
| **Keep the draft** | the draft becomes yours, still unsaved, saving unblocked | left in place until you save the resource or discard it |
| **Discard and restore** | the editor reverts to the saved resource and goes clean; any pending validation is dropped | removed, and the slot is freed for the next draft |

Saving the resource has the same effect on the draft as discarding it: the draft has served its
purpose, and the slot is released.

### Saving is blocked until you decide

Every save path in the four editors checks for this first, and an unreviewed draft is stopped before
anything is checked or saved.

What you see: the banner scrolls into view and pulses, and a warning toast appears —
**"Review the draft before saving"** / *"This editor is showing an unsaved draft you haven't
reviewed. Keep it or discard it, then save."*

If Fintelligent itself tries to save while an unreviewed draft is sitting in the editor — for
instance, if it tries to finish a save it started before you'd looked at the result — it's told
clearly why the save didn't go through, and that nothing was changed. It understands this is
something only your click can resolve, so it asks you to keep or discard the draft rather than
trying the save again on its own.

### Leaving an editor with unsaved work

The leave warning only appears for work **you own** — dirty and already reviewed. An unreviewed
draft doesn't prompt you, because leaving it loses nothing: it's already saved on Fintela's servers,
and the banner will be there the next time you open the editor.

| Button | What happens |
|---|---|
| **Keep editing** | stay on the page |
| **Leave, keep the draft** | navigate away; the draft stays saved |
| **Discard and leave** | discard the draft, then navigate away |

The dialog reads **"Leave without saving?"** / *"Your changes stay as a draft and will be here when
you come back — but they are not saved."*

This covers page reloads, closing the tab, navigating to a link outside Fintela, following any
in-app link, and clicking Cancel in the editor itself. The browser's own **Back button is not
covered** by this warning — using Back can take you away without asking first. Your work isn't lost
either way, though: the draft is safely stored on Fintela's servers, and the banner will offer it
back to you the next time you open that editor.

### When two writers collide

Fintela checks, on every save of a draft, that you're building on its latest version. If your
browser tries to save a draft that's since changed somewhere else — because Fintelligent updated it,
or because the same editor is open in another tab — that save is refused rather than allowed to
quietly overwrite the newer version.

When your own browser loses that race, a warning toast appears: **"This draft changed somewhere
else"** / *"Fintelligent or another tab wrote to it. Your changes are still here — reopen the editor
to merge them."*

> [!TIP]
> Losing that race doesn't throw away your work. Fintela simply pauses trying to save your local
> edits in the background so it doesn't keep bumping into the conflict, and picks back up the moment
> you type again.

## What a run is

A run is the live status of one chat turn — from the moment you send a message to the moment
Fintelligent finishes, pauses, or needs something from you. It's what lets any page in Fintela tell
you "Fintelligent is working on your strategy," even if you've navigated away from the conversation
itself.

A turn keeps working even if you close the chat panel or navigate elsewhere — Fintelligent doesn't
stop just because you stopped watching. The run is simply the record that lets the rest of the app
show you what's happening.

If you send a message and then reload the page, or come back to Fintela later, you land back on the
same run rather than losing track of it.

While a run is live, Fintela tracks enough about it to show you:

| What you can see | Example |
|---|---|
| What stage it's in | Analyzing your request, exploring your data, writing code, configuring, validating, or running |
| What it's waiting on, if anything | Your confirmation on a Save dialog, your answer to a question, or just your next message |
| Which resource it's working on | A strategy, fitness function, risk manager, asset group or study, when one is involved |
| Why it stopped, if it failed | A plain-language reason |
| When it started and when it last did something | Used to tell a genuinely stuck run from one that's just taking a while |

Runs are private to you — a run is one person's work in progress and is never visible to the rest of
your organization.

### Run statuses

```text
you send a message
      │
      ▼
   working ──► working ──► working        (the stage updates as it goes)
      │
      ├─► needs you    still live — stays open until you answer
      ├─► finished     done; nothing lingers
      ├─► paused       didn't finish; can be resumed; you're notified
      ├─► failed       something went wrong; you're notified
      └─► cancelled    the conversation was deleted, or it waited too long unanswered
```

| Status | Still live? | What it means | What you see |
|---|---|---|---|
| Working | yes | Fintelligent is actively doing something | the run chip, spinning |
| Needs you | **yes** | it finished this part but is waiting on a decision from you | the run chip, in a warning colour |
| Finished | no | it wrapped up on its own | nothing lingers — no "done" chip to dismiss |
| Paused | no | it ran out of time or budget with work still outstanding | **"Paused — didn't finish"**, plus a notification |
| Failed | no | something went wrong | the reason, plus a notification |
| Cancelled | no | you deleted the conversation it was waiting in, or it waited too long for an answer | nothing |

> [!NOTE]
> "Needs you" is the status worth understanding, because it stays live on purpose — the thing you
> come back to *is* the open question. Answering it starts a fresh turn, which quietly retires the
> one that was waiting, so the chip never keeps asking for an answer you already gave.

### The status line in the chat

Directly above the composer, exactly one line renders at a time, announced clearly for screen
readers too. Which one wins is decided by a fixed order, so it's never ambiguous whose turn it is.

| State | Copy | Affordance |
|---|---|---|
| busy, analyzing | **Analyzing your request…** | spinner |
| busy, exploring data | **Exploring your data…** | spinner |
| busy, writing code | **Writing the code…** | spinner |
| busy, configuring | **Configuring…** | spinner |
| busy, validating | **Validating…** | spinner |
| busy, running | **Running…** | spinner |
| waiting on confirm | **Waiting for you to confirm — the Save dialog is open** | **Reopen it**, when the dialog can be rebuilt |
| waiting on an answer | **Waiting for your answer** | the question card is on screen |
| waiting on input | **Waiting for you** | — |
| paused | **Paused — didn't finish** | **Continue**, on the second stop in a row |
| failed | the failure reason, or **Couldn't finish — something went wrong** | **Retry**, only when Fintelligent says the failure is worth retrying |
| finished | **Finished** | none, muted |

An elapsed clock appears on busy states only after **5 seconds** — a timer on a three-second answer
would just be noise.

While Fintelligent is checking your code or configuration against Fintela's own rules, the line
reads **Validating…**, even for a moment after the rest of its reply has already arrived — that
check runs as its own step and can take a beat longer to settle.

After a reload, a "waiting" claim degrades to **Paused — didn't finish** rather than pointing at a
dialog or card that can no longer be shown. When the control *can* be rebuilt from the
conversation — a question card, a save dialog, a batch of quick actions — the **Reopen it** button
puts it right back on screen.

### The run chip on every page

A pill fixed above the Fintelligent launcher, on every page and every screen size. It only appears
while a run is live.

| Condition | Headline |
|---|---|
| working, no resource named | **Fintelligent is working** |
| working, with a resource | **Fintelligent is working on your {{resource}}** |
| waiting, no resource named | **Fintelligent needs you** |
| waiting, with a resource | **Fintelligent needs you for your {{resource}}** |

Resource labels are `strategy`, `fitness function`, `risk manager`, `asset group`, `study`. The
second line reuses the same status copy as the in-chat status bar, so the two surfaces never
describe the same turn differently. Its accessible name appends **Open to see the progress**.

Which run gets the chip, when several are live:

1. Within one conversation, only the **latest turn** may speak.
2. A run **waiting on you** outranks one that's merely working — in the first case you're the
   blocker, in the second you're just a spectator.
3. Otherwise, whichever was most recently active.

The chip suppresses itself for exactly one run: the one whose conversation is already on screen. A
question waiting in a *different* conversation still shows. Clicking it opens the panel on that
conversation, not on whatever was last active.

On mobile, the Fintelligent item in the bottom navigation also carries a dot badge from the same
run — warning-coloured while it's waiting, primary while it's working, hidden while the chat panel
is open.

Updates reach the chip automatically, without you refreshing the page. As a backup, Fintela also
checks in periodically while something is genuinely in progress, so the chip can't get stuck showing
stale information — and that checking stops entirely the moment nothing is live.

### Notifications for the endings that need you

Three endings send you a notification; two deliberately don't.

| Run status | Notification title | Where it takes you |
|---|---|---|
| Failed | **Fintelligent could not finish** | back to the conversation |
| Paused | **Fintelligent paused — it can continue** | back to the conversation |
| Needs you | **Fintelligent needs you** | back to the conversation |
| Finished | none | — |
| Cancelled | none | — |

A finished turn needs nothing from you, and announcing it would make the bell mostly noise. Each
notification takes you straight back to the conversation it came from.

## The confirmation model

### What always waits for your click

```text
Fintelligent takes you to the right page
        │
opens the create or edit editor
        │
fills in the fields (one at a time, or all at once)
        │
runs the same checks a manual Save would, then opens the confirmation dialog
        │
   YOU click Confirm
        │
   the resource is saved
```

This **editor path** is Fintelligent's default way to build any of the five draftable resources, and
nothing in it changes your account on its own — it only reaches the confirmation dialog and stops.

For a strategy, fitness function, risk manager or asset group, that's the naming-and-confirm
dialog — the only place a brand-new resource actually gets its name. For a study, it's the
**Confirm your study** review dialog, showing the study's name, asset group, strategy, fitness
function, trial count, date range, whether it holds out a validation period, and the full token cost
breakdown, with **Cancel**, **Save Draft** and **Save & Launch** as your options.

If the checks fail, the confirmation dialog simply never opens. The failure itself is what
Fintelligent sees and responds to — nothing gets saved in that case, so there's nothing to undo.

Whatever passed those checks is exactly what gets saved. If you change anything afterward —
including typing a name into the confirm dialog itself — Fintelligent re-runs the checks on the new
version rather than saving something that was never actually verified.

Two more things always wait for you, no matter what: an unreviewed draft, which blocks every save
until you Keep or Discard it, and a question card, which Fintelligent puts on screen when it needs a
decision from you and which is never on a clock — it waits as long as you need. See
[Fintelligent capabilities](/docs/fintelligent-capabilities) for more on the question card.

### What Fintelligent can do without a dialog

Be clear-eyed about this: the editor-and-confirm path above is the default, **not the only path**.
Fintelligent also has a set of direct actions that save immediately, with no confirmation dialog at
all. One of the direct strategy actions is explicitly built this way — it's meant to be used only
when you've clearly asked to skip the usual step-by-step flow, and Fintelligent is instructed to
check with you in chat first — but that instruction is guidance for the assistant, not a hard lock in
the product.

| Area | What Fintelligent can do immediately, without your confirmation |
|---|---|
| Strategies | Create, update, delete, or duplicate one |
| Fitness functions | Create, update, delete, or duplicate one |
| Risk managers | Create, update, delete, duplicate, or fork a public one into your library |
| Asset groups | Create one from a study or a grouping, update, delete, or duplicate one |
| Studies | Create, duplicate, launch, stop, or resume one |
| Portfolio groups | Create, update, delete one, or refresh a member portfolio's data |
| Drafts and quick actions | Save a draft, open an editor, or run a short batch of interface actions |

What actually constrains them:

- **Your own permissions.** Fintelligent can only do what you yourself are allowed to do inside
  Fintela — it never has more reach than your own account, and it stays scoped to your organization
  exactly as you are.
- **An audit trail you can trust.** Every action Fintelligent takes that changes your data — which
  action it was, and the message from you that triggered it — is recorded in a log that can't later
  be edited or deleted, not even by Fintela's own systems. It's a permanent record of what the
  assistant did on your behalf.
- **The same validation as a manual save.** Saving code for a strategy, fitness function or risk
  manager — whether through the editor or through one of Fintelligent's direct actions — requires
  that the exact version being saved has already passed Fintela's checks, recently. There's no way to
  skip validation through either path.
- **A saved study doesn't start running by itself.** Creating a study this way saves it — it doesn't
  spend any compute budget or begin optimizing unless launching immediately was explicitly requested.
  A saved-but-not-launched study costs you nothing. See [Tokens & billing](/docs/tokens-and-billing).
- **Fintelligent's quick-action shortcuts can't delete, stop or resume anything.** They can open a
  create, edit or duplicate form for you, or fill it in — but deleting a resource, stopping a study,
  or resuming one always has to go through the button and confirmation dialog on the page itself. The
  same is true of Fintelligent's batch-action shortcut: there's no delete step available through it
  at all, for anyone, and if one step in a batch fails, none of the steps after it run either.
- **Live trading is completely off-limits to Fintelligent.** Connecting a broker, launching or
  rebalancing live trading, force-stopping a live portfolio group, and promoting something to managed
  status are all deliberately kept out of reach until a manual confirmation step exists for each of
  them. Anything Fintelligent tells you about live trading is read-only. See
  [Live trading](/docs/live-trading).

### How the conversation shows what just happened

When a step that runs in your browser finishes — a validation check, a save, your answer to a
question, or picking a paused turn back up — the result is added to the conversation as a small
status chip rather than as raw text, so the transcript stays readable.

| What happened | Shows up as |
|---|---|
| A validation check finished | **Validation passed**, or a plain explanation of what went wrong (for example, it timed out, or the check itself couldn't be completed) |
| You clicked Confirm on a save | **Saved**, **Saved — {{name}}**, **Save cancelled**, or a plain explanation of what went wrong |
| You answered a question card | **Answered: {{your choice}}**, or **Skipped the question** |
| A paused turn picked back up | A divider captioned **Picking up where it left off** |

If a save fails, the dialog stays open with the error shown inline so you can fix it and confirm
again — Fintelligent is told what happened, but the conversation and the dialog both stay right
where you left them. If you dismiss a save instead, it's reported as cancelled — unless that save was
already being processed at the moment you dismissed it, in which case whatever it actually did is
what gets reported, even if you've since closed the editor.

## Failure, stopping and cancellation

### Stopping a turn

While Fintelligent is replying, the Send button becomes **Stop**. Pressing it does two things:

1. It cuts your connection to the reply. Whatever had already arrived is kept, marked as interrupted,
   and shown with the caption **"Connection lost mid-reply."**
2. It cancels anything Fintelligent had queued up but not yet carried out — a save it was about to
   make, a batch of actions it hadn't run yet. Those are dropped rather than executed, so hitting Stop
   actually stops the next thing from happening.

> [!CAUTION]
> Stop cuts your view of the reply — it doesn't undo anything Fintelligent had already done. If, by
> the moment you pressed Stop, it had already saved something or started a study, that action is
> already complete (and, where relevant, already billed). Stop prevents what comes *next*, not what
> already happened.

### A turn that stops short

Sometimes Fintelligent runs out of time or budget partway through, with work still outstanding and
nothing specific for you to answer. Since you can't see how much budget was left, deciding whether to
continue isn't really a choice you're equipped to make — so Fintela makes it for you, automatically,
**once**: it quietly picks the conversation back up on your behalf.

Only once, though. If a turn runs out of budget twice in a row, that's a sign it isn't making real
progress, so the second time you'll see a **Continue** button in the status line instead of an
automatic retry. Reloading the page doesn't reset this — the automatic retry only ever fires once per
stretch of stalled progress, whether or not you've reloaded in between. Clicking Continue yourself has
the same effect.

A question waiting for your answer always takes priority — if Fintelligent is waiting on you, nothing
resumes automatically.

### A turn that fails

Every turn ends in one of a small number of ways: it finishes, it's waiting on you, it pauses
partway through, or it fails outright. If something goes wrong in a way that doesn't fit neatly into
those, it's treated as paused rather than silently vanishing.

Even a failure that happens before any reply appears is recorded properly, so the **Retry** button
always has something concrete to try again. Retry is only offered when the failure looks like
something a retry could actually fix — a temporary rate limit, for instance — not when trying again
would just produce the same result. That's deliberate: every retry uses another turn's worth of your
AI Tokens.

### Runs that get cleaned up automatically

Occasionally, something on Fintela's side can interrupt a turn without giving it a clean, tidy
ending — which would otherwise leave you staring at a "Fintelligent is working…" chip that never
resolves. To prevent that, Fintela periodically checks for runs that have gone quiet for too long and
closes them out properly.

| If a run… | …and nothing happens for | It becomes | You're notified? |
|---|---|---|---|
| is still marked as working | about 15 minutes | Failed, with a note that it stopped without reporting back | yes |
| is waiting on your answer | about 24 hours | Cancelled | no |

Deleting a conversation also closes out any run still waiting on you inside it, marking it
cancelled — an archived conversation can't be answered, so there's no reason to leave "Fintelligent
needs you" pointing at a thread you've already gotten rid of. A run that's still actively working is
left alone when you delete its conversation; it will finish and close itself normally.

## Good to know

- **There's no single inbox for every draft.** To find one, open the editor for the resource it
  belongs to.
- **The study builder doesn't show drafts.** Fintelligent can still save its progress on a study
  behind the scenes, but you won't see a banner for it — treat the chat and the confirmation dialog
  as the source of truth for a study instead.
- **Deleting a conversation doesn't discard the work.** If Fintelligent left a draft in an editor
  while working from a conversation you later delete, that draft is untouched — it's still waiting
  for you in the editor.
- **You can't manually cancel a run yourself.** A live run only ends when Fintelligent finishes, when
  you answer what it's waiting on, when you delete the conversation it's in, or after Fintela's own
  housekeeping closes out something that's gone quiet for too long (see above).
