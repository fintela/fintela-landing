---
title: Fitness
section: API Reference
sectionOrder: 10
order: 7
published: true
updated: 2026-09-01
summary: Pull your fitness functions, their configuration, and their full edit history into your own systems through Fintela's read only integration.
keywords: fitness function, scoring, read-only access, version history, access key, built-in objectives
---

A fitness function is the scoring logic behind every trial in a study: it decides what "good"
means for a strategy, whether that's risk adjusted return, drawdown control, or a custom blend you
define yourself. Because a fitness function can change over time, it's often the one piece of a
study you need to look back at months later to understand exactly what was being optimized for.

You create and edit fitness functions inside Fintela itself: see
[Fitness functions](/docs/fitness-functions) for that workflow. This page covers the separate,
read only way to pull your fitness functions, their configuration, and their full edit history
into your own tools, dashboards, or audit records. Nothing here lets you create, edit, or delete a
fitness function: that only happens in the app.

## What you can retrieve

Through this read only integration you can pull three things about your fitness functions:

- **A quick list** of every fitness function in your organization, by id and name: a cheap way to
  see what exists before asking for anything heavier.
- **Full details** for one function or several at once: its description, how it's implemented,
  its parameters, and which studies use it.
- **Complete edit history** for a single function: every meaningful change ever made to it, in
  order, so you can reconstruct exactly what a study was optimizing for at any point in time.

## Getting access

Access works the same way across all of Fintela's read only integrations: generate a personal
access key from your account settings and use it to authenticate every request. See
[Authentication & limits](/docs/api-authentication) for how to create and use a key.

A few things worth knowing specifically for fitness data:

- Access keys are all or nothing: there's no way to grant a key access to only some fitness
  functions. Anything your organization can see, the key can see.
- This surface is strictly read only. There's no way to create, edit, or delete a fitness function
  through it: that protects you from ever accidentally changing scoring logic that a live study
  depends on.

> [!WARNING] Double check how you're passing your access key
> If a request comes back unauthorized even though you're sure the key is valid, check that you're
> sending it the way [Authentication & limits](/docs/api-authentication) describes rather than, say,
> tacking it onto the web address: a misplaced key fails silently with a generic "unauthorized"
> response rather than telling you what went wrong.

## Request limits

Most of Fintela's read only integrations are paced to keep the platform responsive for every
customer: see [Authentication & limits](/docs/api-authentication) for the general guidelines.
Fitness lookups happen to be lightweight, and today they aren't capped the way most other
integrations are.

> [!CAUTION] Don't build around that
> Treat fitness reads as if the standard pace limits applied, even though nothing currently
> enforces one here. This isn't a guarantee: pull requests at a reasonable, steady pace rather
> than in a tight loop, since limits can be added or tightened at any time.

## Browse your fitness functions

The quick list returns every fitness function that belongs to your organization and hasn't been
deleted, as a simple id to name lookup. It has no filters: you always get everything you're
allowed to see.

Use it to discover what exists, then request full details only for the functions you actually
need. It's the cheapest call in this integration, so it's the right first step when you don't
already know the id you're after.

> [!NOTE] Don't rely on the order
> Functions come back in no particular order. Sort them yourself if you need a stable, predictable
> list.

## Fitness function details

This is where you get the full picture: everything about a fitness function's configuration, not
just its name.

### What you'll see

| Field | What it tells you |
|---|---|
| Name | Unique within your organization: no two of your fitness functions share a name. |
| Description | The free text note attached when it was created or last edited, if any. |
| Implementation type | Whether the scoring logic runs inside Fintela, or on your own external service (see below). |
| Implementation details | The actual code, or the connection details for your external service, depending on the type. |
| Parameters | The inputs the function accepts, each with a name, a type, and an optional description. |
| Studies using it | Which of your studies reference this function, so you can see its real world usage at a glance. An empty list just means it's never been used yet. |
| Created / last updated | When the function was first created, and when it was last saved: any edit in the fitness editor moves this, including a simple rename. |

> [!NOTE] A garbled parameter list shows up as empty, not as an error
> If a function's stored parameter declarations can't be read back cleanly, you'll see an empty
> parameter list rather than a failed request. Treat an empty list as "no parameters, or something
> not readable" rather than a hard guarantee there are none.

Unlike a strategy's parameters, a fitness function's parameters never carry a rolling window
setting: a fitness function scores a simulation after the fact, so there's no window to define.
See [Strategies](/docs/api-strategies) for that contrast.

Fitness functions don't carry a separate optimization direction (maximize vs. minimize) in this
detail view: that only shows up for Fintela's built in objectives, covered below.

### Internal vs. external logic

A fitness function is implemented one of two ways:

- **Internal**: Python code that runs inside Fintela. You'll see that code exactly as saved.
- **External**: logic that runs on your own service, which Fintela calls to score each trial.
  You'll see the connection details you configured: which endpoint Fintela calls, how long it
  should wait for a response, and how many trials it can score at the same time. Running your
  scoring logic externally keeps your models and data on your own systems while still letting
  Fintela drive the optimization: see [External fitness](/docs/external-fitness) and
  [Execution modes](/docs/execution-modes) for when and how to use it.

### Requesting specific functions

You can ask for one or several functions by id instead of pulling everything. The request is
all or nothing: if any one of the ids you name isn't something your key can read, the whole
request fails rather than quietly returning the rest. Leave the filter off if you'd rather get
everything you can see and sort out what you need on your end.

## Version history

Every meaningful change to a fitness function is recorded, so you can answer "what did this
scoring function actually look like when that study ran?" long after the fact: useful for audits,
for reproducing a past result, or for understanding why a study behaved the way it did after a
change. Entries come back newest first.

Each entry shows the function's name, implementation, and parameters exactly as they stood at that
point, along with any note recorded with the edit and when it was made.

> [!NOTE] Which data source a version used isn't included here
> If you need to know which data source a specific past version was connected to, check it
> directly in the app: that detail isn't part of what this integration returns.

### When a new version is recorded

Not every save creates a new history entry: only changes that affect scoring behavior do:

| Change | Creates a new version |
|---|---|
| Switching between internal and external logic | Yes |
| Editing the code, or the external connection details | Yes |
| Changing the parameters | Yes |
| Changing the data source it's wired to | Yes |
| Deleting or restoring the function | Yes |
| Renaming it | No |
| Editing the description only | No |

So renaming a function on its own leaves no separate history entry: the new name simply appears
the next time a version is recorded for another reason. And if you change several things in one
save, that's recorded as a single version, not several.

> [!NOTE] An empty history can mean two different things
> You'll see an empty history both when a function genuinely has no edits yet, and when your key
> isn't allowed to see it at all: Fintela doesn't distinguish the two, so it never confirms or
> denies the existence of something you can't access. Treat an empty result as "nothing available
> to you," not as proof the function was never touched.

## Built in objectives aren't included

Fintela ships a set of ready made objectives: Sharpe ratio, Sortino ratio, Calmar ratio, max
drawdown, volatility, total return, compound annual growth rate, and others: that let a study
optimize for a well known metric without you writing any scoring logic at all.

These built in objectives belong to Fintela, not to your organization, so they're left out of both
the quick list and the full details view: those only ever show functions you created yourself. If
you already know a built in objective's id, though, you can still pull its version history, which
will show its metric name, optimization direction, unit, and category instead of code or
connection details.

> [!TIP] Don't assume every id you ask for comes back
> If you request details for a mix of your own functions and a built in objective's id in the same
> call, the built in one will simply be missing from what comes back rather than causing an error.
> Always check what you actually got rather than assuming every id you asked for was returned.

## Good to know

- This integration is entirely read only. Attempting to create, edit, or delete a fitness function
  through it fails outright: those actions only work in the app.
- You'll never see a plain "forbidden" error here. A fitness function you can't read is either
  left out of a list or causes the whole request to fail, never a message that confirms something
  exists but you can't touch it.
- Full error handling details, including what to expect when a request fails, are covered in
  [Errors & status codes](/docs/api-errors).

## Checking for changes

There's no live push notifications for fitness functions: nothing alerts you the moment something
changes. If you want to stay in sync, you check periodically:

| What you're watching | Tells you when it moves | Good for |
|---|---|---|
| Last updated time in the full details | Any save at all, including a rename or a description only edit | "Has anything at all changed about this function?" |
| Version history | Only changes that affect scoring behavior | "Has the actual scoring logic changed?" |

A practical pattern: pull the quick list regularly to catch functions being added or removed, pull
full details for the ones you track and compare the last updated time, and only pull version
history when that time has moved and you need to know exactly what changed.
