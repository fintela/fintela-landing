# Fintela Docs — authoring guide

Documentation pages are Markdown files in [`content/docs/`](content/docs/). There is
no CMS, no database, no API and no credential of any kind. A page is a file in the
repo, and merging it to `main` publishes it — **without deploying the site**.

This is the same system the blog uses; [BLOG.md](BLOG.md) is its counterpart. Both
collections share one parser, one fetch layer, one renderer and one generator.

## Publish a page

```bash
cp content/docs/_template.md content/docs/getting-started/my-page.md
# write it, set `published: true`
npm run dev                        # preview at localhost:5173/docs
```

Commit and merge to `main`. That's it — **no site deploy is needed.** Pushing a
change under `content/docs/` triggers
[`deploy.yml`](.github/workflows/deploy.yml), which regenerates the docs JSON and
syncs only the `docs/` prefix of the bucket. The page is live in about a minute.

**The filename becomes the URL, not the folder.** `content/docs/api/rate-limits.md`
publishes at `/docs/rate-limits`. Folders exist so the tree is readable in the repo;
`section:` is what groups the page on the site, and the two do not have to agree.

Because the filename alone decides the URL, **two files anywhere in the tree cannot
share a basename**. The build reports the clash and skips the second one.

**Renaming a file changes its URL** and breaks existing links. Add a `slug:` field
to pin the URL independently of the filename.

## Frontmatter

Every page must start with a `---` fenced block:

```markdown
---
title: Sampler selection
section: Configuration
sectionOrder: 3
order: 2
published: true
updated: 2026-08-04
summary: TPE, CMA-ES, Random, QMC, NSGA-II — which to choose and when.
keywords: sampler, tpe, cmaes, bayesian
---

Body starts here.
```

| Field | Required | Notes |
|---|---|---|
| `title` | **yes** | Shown on the index card, in the sidebar, and as the page's `h1`. |
| `section` | **yes** | Parent section, e.g. `Configuration`. Free text — a new value creates a new section. |
| `updated` | **yes** | `YYYY-MM-DD`. Shown on the card and the page. Calendar-invalid dates are rejected. |
| `published` | **yes** | `true` publishes. Anything else — including a missing or misspelled value — is treated as a draft and stays off the site. |
| `order` | no | Position within the section, ascending. Defaults to `999`, which sinks the page to the bottom of its section. |
| `sectionOrder` | no | Where the whole *section* sits. A section takes the **lowest** `sectionOrder` any of its pages declares; sections that declare none fall to the bottom, alphabetically. Set it on every page of a section so the ordering survives a page being unpublished. |
| `summary` | no | Card summary and the page's lead paragraph. Defaults to the first real paragraph. Cards truncate at ~150 characters. |
| `keywords` | no | `keywords: A, B` or `[A, B]` or a `- item` list. Extra search terms on top of the title and body. |
| `slug` | no | Overrides the URL. Defaults to the filename without `.md`, slugified. |

## What the renderer supports

Headings, paragraphs, bold, italic, links, images, fenced code blocks with syntax
highlighting and a Copy button, blockquotes, callouts, tables, ordered/unordered
lists, task lists, strikethrough and horizontal rules. Code fences highlight
`python`, `ts`/`tsx`, `js`/`jsx`, `json`, `bash`/`sh` and `http`/`curl`; other
languages render with minimal highlighting.

Markdown headings render as `h2`–`h4`, because the page title is already the page's
only `h1`.

`_template.md` in the content directory exercises every one of these — copy it
rather than starting from scratch.

### Headings become anchors

Every `##` and `###` gets an `id` slugified from its text, and appears in the
right-rail "On this page" list. `## The simulate contract` is linkable as
`#the-simulate-contract`, from the same page or another one.

**Keep the headings on a page distinct.** Two that slugify the same share a single
anchor: the rail links only to the first, and the build warns so the file gets
fixed.

### Callouts

Callouts use GitHub's alert syntax, with an optional title after the marker:

```markdown
> [!WARNING] Endpoints are called on every trial
> Keep the handler under two seconds.
```

| Marker | Renders as |
|---|---|
| `[!NOTE]`, `[!IMPORTANT]` | blue "Note" |
| `[!TIP]` | indigo "Tip" |
| `[!WARNING]` | amber "Warning" |
| `[!CAUTION]` | red "Caution" |
| `[!SUCCESS]` | green "Success" |

The marker must be literal text at the very start of the blockquote. An unrecognised
marker is left alone — the block renders as an ordinary blockquote with the marker
visible as text, which is also how any page looks when read on GitHub.

### Linking between pages

Link by slug, which is what the site serves:

```markdown
See [core concepts](/docs/core-concepts) and [when they act](/docs/managing-risk-managers#when-they-act).
```

A repo-relative `.md` path works too, and is often nicer while editing a file on
GitHub — both resolve to the same URL:

```markdown
See [core concepts](../getting-started/core-concepts.md).
```

**A link to a page that isn't published renders as plain text**, not a dead link.
That is deliberate: a cross-reference to a renamed or unpublished page degrades to
prose instead of sending readers to a 404. It also means a typo'd link silently
loses its underline rather than shouting — check new links in `npm run dev`.

Links to `/docs/...` and other in-app paths route through the SPA rather than
reloading the page.

### Images

Put the file in `public/docs-assets/` and reference it with an absolute path so it
resolves identically on every route:

```markdown
![Alt text](/docs-assets/my-diagram.png)
```

Small base64 `data:` URIs also work, but every visitor downloads them inline, so
prefer a file. `data:image/svg+xml` is rejected — SVG can carry script.

For diagrams, a plain-text `text` fence is often better than an image: it stays
readable in the repo, in a diff, and on GitHub, and it never goes stale in a way
nobody can edit. Several pages use one.

### Raw HTML is ignored, by design

See [Security](#security). HTML in a page renders as inert text, not markup.

## Why a page doesn't appear

Bad files are skipped rather than breaking the build. The reason is logged by the
build. A page is skipped when:

- there's no leading `---` frontmatter fence;
- `title`, `section` or `updated` is missing;
- `updated` isn't `YYYY-MM-DD`;
- `published` is missing, misspelled, or not `true`;
- the body is empty;
- another file already claimed the same slug (rename it, or set `slug:`);
- no URL-safe slug can be derived from the filename or title.

A section with no published pages is omitted from the index and the sidebar
entirely — there are no empty section headings.

An empty content directory (or one where every page is a draft) renders the
"No documentation yet" state — that's expected, not a bug.

---

## How it works

```
content/docs/**.md         the only place documentation lives
   │
   ▼
vite-plugin-content.ts             parse frontmatter, drop drafts, order sections
   │   dev:   serves /docs/*.json from disk, per request
   │   build: emits dist/docs/index.json + dist/docs/<slug>.json
   ▼
deploy.yml  (push to main touching content/docs/**)
   │   aws s3 sync dist/docs/ s3://$S3_BUCKET/docs/ --delete
   │   cloudfront create-invalidation
   ▼
src/docs/api.ts fetches /docs/index.json → DocsIndexPage / DocPage
```

`docs/index.json` carries every published page's metadata plus a capped plain-text
excerpt of its body. That one file is the whole search index: filtering on `/docs`
and the ⌘K palette inside a page are substring matches over data the browser
already has, with no request and no search service.

### What the two routes are

| Route | What it renders |
|---|---|
| `/docs` | The index — preview cards grouped by section, ordered by `order`, with a search bar. |
| `/docs/:slug` | One page: sidebar, breadcrumbs, the rendered Markdown, an "On this page" rail, prev/next, and "Edit this page on GitHub". |

`/documentation/*` — every URL the previous hand-written docs tree served — redirects
to its `/docs/<slug>` equivalent, so no public link broke. The map is
`LEGACY_DOC_PATHS` in `src/App.tsx`.

### Why the pages are fetched rather than bundled

So that publishing does not require a site deploy, and so that the app's bundle does
not grow with the documentation. Adding one `.md` changes `docs/index.json` and
`docs/<slug>.json` and **nothing else** in `dist/` — not index.html and not a single
hashed asset. That is what makes syncing one prefix a complete publish.

It also means the routing table stopped growing. The previous system had one lazy
import and one `<Route>` per page — twenty-five of each — and adding a page meant
editing `App.tsx`, `nav.ts` and a new `.tsx` file. Now a page is one file, and the
sidebar, the search index, the prev/next order and the table of contents are all
derived from it.

### Drafts never leave the repo

`published: false` and malformed files emit no JSON at all, so unpublished content is
absent from `dist/` entirely — it cannot be read out of a public artifact, and a
direct URL to a draft is a genuine 404 rather than a hidden page. This is enforced in
one place (`describeDocSkip` in `src/docs/parseDoc.ts`) and used by both the generator
and the dev middleware.

### Security

Page bodies are Markdown rendered by `react-markdown` in
`src/blog/MarkdownContent.tsx`, and are treated as untrusted even though they come
from the repo:

- **Raw HTML never renders.** `rehype-raw` is deliberately not installed, so
  react-markdown drops embedded HTML instead of parsing it — `<script>`, `<iframe>`
  and `onerror=` are inert text. **Do not add `rehype-raw`**: that one change would
  turn every page into a script injection on `fintela.io`.
- **URLs are allow-listed** by `urlTransform`: `http(s)`, `mailto`, `tel`, anchors
  and relative paths for links; `https` and non-SVG base64 for image `src`.
  `javascript:`, `vbscript:` and `data:text/html` are dropped, including
  control-character evasions like `java&#9;script:`.
- **No `dangerouslySetInnerHTML`** anywhere in the docs or blog tree.
- `remarkCallouts` only rewrites text it already parsed and sets `class`/`title` from
  a fixed allow-list, so it adds no new path to the DOM.

## Files

| Path | Role |
|---|---|
| `content/docs/**.md` | the pages — the only place documentation content lives |
| `content/docs/_template.md` | copy-to-start template (a draft, never published) |
| `vite-plugin-content.ts` | emits `docs/*.json` and `blog/*.json`; serves the same paths in dev |
| `src/content/frontmatter.ts` | the YAML subset, slug/excerpt/read-time derivation — shared with the blog |
| `src/content/json.ts` | fetch, memo, and "missing vs. broken" classification — shared with the blog |
| `src/content/remarkCallouts.ts` | GitHub alert blockquotes → `<Callout>` |
| `src/docs/parseDoc.ts` | which frontmatter fields a *doc* requires |
| `src/docs/api.ts` | fetches the JSON; 404 / empty-state handling |
| `src/docs/useDocs.ts` | `useDocsIndex` / `useDoc` hooks |
| `src/docs/toc.ts` | heading ids and the "On this page" rail |
| `src/docs/search.ts` | the scoring behind both search entry points |
| `src/docs/format.ts` | section accents, the GitHub edit URL, section grouping |
| `src/docs/DocCard.tsx` | preview card |
| `src/docs/DocsLayout.tsx` | sidebar + breadcrumbs + rail + prev/next chrome |
| `src/docs/DocsSidebar.tsx` | index-driven navigation |
| `src/docs/DocsSearch.tsx` | ⌘K palette |
| `src/blog/MarkdownContent.tsx` | the sanitized Markdown renderer, shared with the blog |
| `src/pages/DocsIndexPage.tsx` | `/docs` grid + search |
| `src/pages/DocPage.tsx` | `/docs/:slug` |
