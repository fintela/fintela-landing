---
title: Page title goes here
section: Getting Started
order: 99
published: false
updated: 2026-01-01
summary: One or two sentences describing the page. Optional. If you omit it, the first paragraph of the body is used. Index cards truncate at ~150 characters.
keywords: extra, search, terms
---

<!--
  COPY THIS FILE to start a documentation page. `published: false` keeps it off the
  site, so this template never appears on /docs and is not even emitted into the
  deployed artifact.

  The FILENAME becomes the URL, not the folder: copying this to
  `content/docs/api/rate-limits.md` publishes it at /docs/rate-limits. Folders are
  for humans reading the repo; `section:` is what groups the page on the site.
  Renaming a file changes its URL and breaks existing links, so add a `slug:` field
  to pin the URL independently of the filename.

  Because the filename alone decides the URL, two files anywhere in the tree cannot
  share a basename. The build reports the clash and skips the second one.

  Raw HTML (including this comment) is stripped, never rendered.
-->

Open with a paragraph that stands on its own: it becomes the index card excerpt
and the page's lead paragraph when `summary:` is omitted.

## A section heading

Every `##` and `###` becomes an entry in the "On this page" rail and gets a
permanent anchor derived from its text, so `## A section heading` is linkable as
`#a-section-heading`. Keep the headings on a page distinct: two that slugify the
same share one anchor, and the build warns about it.

Body text with **bold**, _italic_, `inline code`, ~~strikethrough~~ and
[a link](https://fintela.io). Markdown headings start at `h2` in the rendered
page, because the page title is already the `h1`.

### A subsection

Link to another documentation page by its slug:
[core concepts](/docs/core-concepts), or by the file path if that reads better
while editing on GitHub: [core concepts](../getting-started/core-concepts.md).
Both resolve to the same URL. A link to a page that is **not published** renders as
plain text rather than a dead link.

> Blockquotes are styled with a brand accent rule.

Callouts use GitHub's alert syntax, with an optional title after the marker:

> [!NOTE]
> `NOTE` and `IMPORTANT` render blue, `TIP` indigo, `WARNING` amber, `CAUTION` red
> and `SUCCESS` green.

> [!WARNING] Endpoints are called on every trial
> A titled callout puts the title in the coloured label row.

- Bulleted lists
- With a second item

1. Numbered lists
2. Also work

- [x] Task lists render as checkboxes
- [ ] Unchecked items too

Fenced code blocks get syntax highlighting for `python`, `ts`/`tsx`, `js`/`jsx`,
`json`, `bash`/`sh` and `http`/`curl`, and a Copy button. Anything else renders
with minimal highlighting.

```python
returns = prices.pct_change().dropna()
signal = returns.rolling(20).mean().shift(1)  # shift(1) == no look-ahead
```

Document an endpoint as an `http` fence:

```http
GET /v2/trials?study_name=roc_top_n_q1
```

Tables use GitHub syntax and scroll horizontally on narrow screens:

| Parameter | Type | Description |
|---|---|---|
| `n_trials` | integer | How many parameter sets the optimizer evaluates. |
| `sampler` | string | `TPESampler`, `CmaEsSampler`, `RandomSampler`, … |
