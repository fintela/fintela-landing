---
title: Asset groups
section: API Reference
sectionOrder: 10
order: 8
published: true
updated: 2026-09-01
summary: Pull the asset group definitions you've built in Fintela (their names, descriptions, and universe size) into your own tools and dashboards.
keywords: asset groups, universe, tickers, portfolio groups, api integration, read-only, personal access key, dashboards
---

An asset group is a named, saved universe (a list of tickers, portfolio groups, or both) that
your studies and strategies run against. This part of the Fintela API lets you pull back the asset
groups already saved in your organization: their names, descriptions, and how big each universe is.
It's a narrow slice of the reference on purpose: the only thing you can do here is list every asset
group you've saved. Everything else about building and managing one happens inside the app itself,
covered in [Asset groups](/docs/asset-groups).

You'll need your personal Fintela API key: see [Authentication & limits](/docs/api-authentication)
for where to find it and what else applies. As with the rest of this API, this is read only: you can
look up what you've already built, but you can't create, edit, or delete an asset group through this
channel.

## Asset groups, by another name

If you come across older integration notes or support material calling this feature "Data
Clusters," that's the same thing under a previous name: the product renamed them to Asset Groups,
but you may still see the older term used here and there. Nothing to migrate; it's the same saved
universes either way.

The id you get back for each asset group here is the same id shown against a study's strategy
universe and fitness universe over in [Studies](/docs/api-studies): so you can match a study back
to the asset group, or groups, it actually ran against.

## Listing your asset groups

This one call returns every asset group your organization has saved: a short index with each
group's name, description, and how many tickers it holds. There's no way to narrow it down to a
specific group or filter it by name; you always get the complete list back in one response, so if
you only need one asset group, ask for all of them and pick out the one you want.

> [!NOTE] You'll never get the actual ticker list back this way
> This endpoint tells you a group exists and roughly how big it is: it does not return the tickers
> themselves. If you need the actual instrument list for a group, that's available inside the app,
> in the group's own editor: see [Asset groups](/docs/asset-groups).

### What you'll see for each asset group

| Field | What it tells you |
|---|---|
| Name | The name you (or a teammate) gave it when it was created |
| Description | The free form description written for it, if any |
| Ticker count | How many individual tickers are in the group |
| Created | When the group was first saved |

> [!NOTE] Description and creation date always show up, even when empty
> Unlike some other parts of this reference, where a field that doesn't apply is simply left out of
> the response, an asset group's description and creation date are always present: they just come
> back blank when there's nothing to show. Check for an empty value here rather than assuming the
> field itself might be missing.

> [!WARNING] A ticker count of zero doesn't mean an empty group
> An asset group's universe can be made of tickers, portfolio groups, or a mix of both. A group
> built entirely from portfolio groups: a "portfolio of portfolios," where you're trading based on
> the performance of portfolios you've already validated rather than individual names: has no
> tickers at all, so its ticker count comes back as zero even though it's a perfectly valid,
> fully populated universe. This endpoint doesn't currently show portfolio group membership, so a
> ticker count of zero is the one case where the count alone can't tell you whether a group is
> actually empty or just built a different way. Don't treat zero as a sign of a broken or empty
> group: check inside the app if you need to confirm what's really in it. See
> [Portfolio groups](/docs/portfolio-groups) for more on building a universe this way.

### Example

Say your organization has two saved asset groups. The list you'd get back might read like this:

| Name | Description | Ticker count | Created |
|---|---|---|---|
| S&P 500 Top 100 | Top 100 companies by market cap in the S&P 500 index | 100 | Oct 15, 2023 |
| Tech Sector | *(none)* | 45 | Dec 1, 2023 |

## Ordering and what's included

- **Newest first.** Your asset groups come back sorted by creation date, most recent first: there's
  no way to change the sort order. In the rare case a group has no recorded creation date, it's
  placed at the very top rather than the bottom, since there's nothing to sort it against.
- **Your organization only.** You'll only ever see asset groups your own organization created:
  never another organization's, and never a platform provided template group. If you can see it in
  the app's Asset Groups section, it'll be in this list.
- **Deleting is permanent.** There's no "trash" or recovery for a deleted asset group: once it's
  gone, it simply stops appearing here, with no way to bring it back through this channel or the
  app.
- **No privacy within your organization.** Just like everywhere else in Fintela, every asset group
  anyone on your team has created is visible to every access key your organization has issued:
  yours and your teammates' alike. See [Authentication & limits](/docs/api-authentication) for how
  that applies across the whole API.

## What you won't find here

This is a small corner of the reference, so it's worth being explicit about the gaps:

- **The tickers themselves.** You get a count, not the list: see the note above.
- **Portfolio group membership.** Whether a group includes any portfolio groups, and which ones,
  isn't exposed here at all: not as a list, not even as a count.
- **When it was last edited.** You'll see when a group was created, but not when it was last
  changed.
- **A single group lookup.** There's no way to ask for just one asset group by id: you always get
  the full list and pick out the one you need.
- **Any way to create, edit, or delete.** This part of the API is look up only, the same as every
  other part of it: building and managing your asset groups happens in the app. See
  [Asset groups](/docs/asset-groups).

## If something goes wrong

An organization with no saved asset groups yet simply gets back an empty list: that's not an
error, just a sign you haven't created one. Beyond that, the failures you'll see here are the same
ones you'd run into anywhere else on this API: a missing or invalid access key gets turned away as
unauthorized, and going over your organization's usage limit gets a "too many requests" response.
See [Authentication & limits](/docs/api-authentication) for what to do about either, and
[Errors & status codes](/docs/api-errors) for the complete reference.

Because this call takes no filters or ids, most of the odder failure cases that show up elsewhere in
this reference (an unreadable id, a malformed filter) simply don't apply here. There's very little
for it to reject.

## Usage limits

This part of the API counts against your organization's shared request limit, the same as a handful
of other frequently used lookups. See [Authentication & limits](/docs/api-authentication) for the
exact numbers and how the limit is shared across every key your organization has issued.

## Checking for changes

There's no live notification when an asset group is added, renamed, or edited: this part of the
API has no push feed, same as the rest of Fintela's integrations. If you want to notice when
something changes, check back on a schedule of your own choosing.

Because the list is small and always comes back in full, a straightforward re fetch is really the
whole strategy: compare the set of groups against what you saw last time to spot new ones or ones
that have disappeared, and compare names, descriptions, and ticker counts to catch edits. Since the
list is newest first, a genuinely new group will show up right at the top.

> [!TIP] Poll on a schedule, not in a loop
> There isn't a strict limit specific to this one lookup, but treat it like the rest of the API:
> checking every few minutes is plenty for almost any integration. Polling in a tight loop wastes
> your organization's shared request budget for no benefit, since asset groups don't tend to change
> often.

## Related pages

- [Asset groups](/docs/asset-groups): building and editing your asset groups in the app, and what
  actually goes into a universe.
- [API overview](/docs/api-overview): how this API works in general, and the read only rationale
  behind it.
- [Authentication & limits](/docs/api-authentication): where to find your key, and the request
  limits that apply to it.
- [Studies](/docs/api-studies): a study's strategy and fitness universes, and how their ids match
  back to the asset groups listed here.
- [Portfolio groups](/docs/portfolio-groups): the objects that can make up an asset group's
  universe instead of, or alongside, tickers; [Baskets](/docs/api-baskets) covers reading them
  through the API.
- [Errors & status codes](/docs/api-errors): the complete reference for what a failed request looks
  like.
