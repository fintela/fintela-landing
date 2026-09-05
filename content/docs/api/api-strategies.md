---
title: Strategies
section: API Reference
sectionOrder: 10
order: 3
published: true
updated: 2026-09-01
summary: Pull the strategies you've built in Fintela (their details, parameters, and edit history) into your own tools and dashboards.
keywords: strategies, api integration, parameters, version history, read-only, personal access key, dashboards
---

This part of the Fintela API lets you pull the strategies already living in your organization
into your own tools, spreadsheets, or dashboards: their names, how they're set up (built in
Fintela's own editor, or running on your own server), their tunable parameters, which studies use
them, and their full edit history. Everything here is read only: you build, edit, and test run
strategies inside the Fintela app itself, as covered in the [Strategies registry](/docs/strategies)
guide: this reference is only for pulling the results out into your own systems.

You'll need your personal Fintela API key: see [Authentication & limits](/docs/api-authentication)
for where to find it in your account settings and what else applies. A key isn't scoped down to the
strategies you personally created: it can see everything your organization can see, so treat it as
an organization wide credential rather than a personal one.

## What you can pull

| Data | What it gives you |
|---|---|
| Your strategy list | A quick name lookup: every strategy in your organization, matched to its name |
| Full strategy details | The complete record for one or more strategies: description, whether it runs inside Fintela or on your own server, its parameters, the studies using it, and when it was created and last changed |
| Parameters only | Just the tunable parameters, without the underlying code: handy for building a form or mirroring the setup in your own tooling |
| Edit history | Every meaningful revision to a strategy, newest first, so you can see exactly what a study ran with even after you've kept improving the strategy since |

If you're following an older integration guide or support example that refers to a strategy list
under a different label, it's the same data: nothing to migrate. Likewise, "version" in the edit
history further down refers to a strategy's own revision history, not to a different generation of
this API.

## Your list of strategies

The quickest way to get oriented: this returns every strategy you can see, matched to its name.
Use it to look up which id you mean before asking for more detail on a specific strategy.

> [!NOTE] Order isn't guaranteed
> Don't assume the list comes back in the same order every time. Sort it on your end if your tool
> needs a stable, predictable order.

## Strategy details

This is the full record for each strategy: its description, whether it's set up to run inside
Fintela or on your own server, its declared parameters, the ids of the studies referencing it, and
when it was created and last updated.

You can ask for one or more specific strategies, or leave the filter off entirely to get everything
you're able to see.

> [!CAUTION] A single unreachable id fails the whole request
> If you ask for a specific list of strategies and even one of them isn't one you have access to:
> wrong id, deleted, or belonging to another organization: the entire request comes back
> empty handed instead of returning the ones that did work. If you just want "everything I can
> see," leave the id filter off rather than listing ids by hand.

### Internal vs. external strategies

What comes back here depends on how the strategy is set up:

- **Internal strategies** (built with Fintela's own Python editor) return the actual code you
  wrote, so you can keep a copy in your own version control or documentation.
- **External strategies** (running on your own server) return the endpoint address and the
  connection settings you configured for it (how long Fintela waits for a response, and how many
  requests can run at once), not any code, since Fintela never stores or sees it.

See [Execution modes](/docs/execution-modes) and [External strategies](/docs/external-strategies)
for more on the difference and when to choose each.

### Parameter details

Each strategy also lists its declared parameters: the knobs a study can tune, not the specific
values it will run with. For every parameter you'll see:

- its name, matching the name used in the strategy's code
- an optional description, when one was written for it
- its type: a whole number, a decimal, or a named category
- whether it's flagged as a lookback window
- a sample "test value" used to check the strategy while editing it: this is not a default a
  study will run with, just the value the editor validated against
- for category type parameters, the list of choices it can take

For example, a momentum strategy might declare a whole number parameter for how many names to
hold, a lookback window parameter for how far back to measure momentum, and a category parameter
for which moving average style to use, with choices such as exponential, simple, or weighted.

## Just the parameters

When you only need to know what a strategy takes: to build a form, validate a configuration, or
mirror its search space in your own tooling: this returns the parameter declarations without the
code or endpoint details behind them.

> [!NOTE] This one quietly skips ids you can't reach
> Unlike the full details call above, asking for parameters on an id you don't have access to
> doesn't fail the whole request: that strategy is simply left out of what comes back. Compare
> what you got against what you asked for if that distinction matters to your integration.

## Version history

Every meaningful edit to a strategy is saved to a permanent, append only history, newest first. A
study that has already launched stays pinned to the exact version it started with, so its results
never quietly change underneath it: this history is how you see what a strategy actually looked
like at that point, even after you've kept refining it since.

### What creates a new version

A new entry is added whenever you:

- switch a strategy between internal and external
- change its code (internal) or its endpoint settings (external)
- add, remove, or change a parameter
- change its lookback / warmup settings
- change which data feeds it's wired to
- delete or restore it

Renaming a strategy, or editing only its description, does **not** create a new version: those
are treated as cosmetic touch ups rather than a real change to how the strategy behaves.

> [!NOTE] An empty history isn't always what it looks like
> Asking for the history of a strategy that doesn't exist, was deleted, or belongs to another
> organization comes back as an empty list rather than an error. Don't read an empty result as
> "this strategy has never been edited" unless you're also sure it's one you can actually see:
> every real, visible strategy has at least one version, from the moment it was created.

## Checking for changes without a live feed

There's no notification or live feed on this API: nothing pushes an alert to your systems the
moment a strategy changes. If you need to know when one does, check back periodically: pull its
edit history and compare the newest entry against the last one you saw. That catches every
meaningful change listed above.

It won't catch a rename or a description edit on its own, since those don't create a new version:
compare the name and last updated timestamp from the strategy details call as well if those matter
to your integration.

> [!TIP] Poll at a sensible pace
> There isn't a strict limit specific to these particular calls today, but don't poll in a tight
> loop: checking every few minutes is plenty for most integrations. Other parts of the API do cap
> how many requests you can make per second to keep things responsive for everyone, and it's good
> practice to build your integration as if the same applied here. See
> [Authentication & limits](/docs/api-authentication) for the current numbers.

## Strategies are built and edited in the app

This page only reads what already exists: there's nothing here to create, edit, delete, or
test run a strategy. All of that happens inside the Fintela app itself: write and validate your
strategy's logic in the [Strategies registry](/docs/strategies), where saving is checked against a
validation run and test running a strategy draws on your organization's tokens (see
[Tokens and billing](/docs/tokens-and-billing)) so that usage is properly tracked. This
reference only view exists so you can pull the results of that work into your own systems, not to
replace it.

For what a failed request looks like and how to handle it, see
[Errors and status codes](/docs/api-errors).
