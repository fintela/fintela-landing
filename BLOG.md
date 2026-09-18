# Fintela Blog — authoring guide

Blog posts are Markdown files in [`content/blog/`](content/blog/). There is
no CMS, no database, no API and no credential of any kind. A post is a file in the
repo, and merging it to `main` publishes it: the deploy builds the site, renders
the post to its own HTML page, regenerates the sitemaps and the RSS feed, and
syncs the bucket — about three minutes, no step of it manual.

The documentation under `content/docs/` works exactly the same way and shares this
machinery — see [DOCS.md](DOCS.md).

## Publish a post

```bash
cp content/blog/_template.md content/blog/my-post.md
# write it, set `published: true`
cd landing && npm run dev          # preview at localhost:5173/blog
```

Commit and merge to `main`. That's it. Every push to `main` runs
[`deploy.yml`](.github/workflows/deploy.yml): build, prerender, sync, one
CloudFront invalidation. The post is live in about three minutes, at
`/blog/<slug>` as a real HTML page with its own `<title>`, description, Open
Graph image and `BlogPosting` structured data — what a crawler or a link preview
sees without running any JavaScript. The blog index, the home page's Insights
band, `sitemap-blog.xml` and `feed.xml` are regenerated in the same build.

The filename becomes the URL: `my-post.md` → `/blog/my-post`.

**Renaming a file changes its URL** and breaks existing links. Add a `slug:` field
to pin the URL independently of the filename.

## Frontmatter

Every post must start with a `---` fenced block:

```markdown
---
title: Building Robust Backtesting Frameworks
author: Ivan Buda
date: 2026-07-28
updated: 2026-08-15
excerpt: The pitfalls that quietly invalidate strategy results.
tags: Research, Engineering
published: true
---

Body starts here.
```

| Field | Required | Notes |
|---|---|---|
| `title` | **yes** | Shown on the card and as the page's `h1`. |
| `author` | **yes** | Free text. |
| `date` | **yes** | `YYYY-MM-DD`. Drives newest-first ordering, and is the post's `datePublished`. Calendar-invalid dates are rejected. |
| `updated` | no | `YYYY-MM-DD`, the last substantive edit. Feeds the sitemap's `<lastmod>` and the `dateModified` in the post's structured data. **Bump it whenever you change a published post** — Google compares it with what it crawls and learns to ignore a site whose dates lie. Omitted, `date` is used. |
| `published` | **yes** | `true` publishes. Anything else — including a missing or misspelled value — is treated as a draft and stays off the site. |
| `excerpt` | no | Card summary, and the page's meta description (what appears under the title in a search result). Defaults to the first real paragraph. Cards truncate at ~150 characters; a search snippet at about 155. |
| `tags` | no | `tags: A, B` or `tags: [A, B]` or a `- item` list on following lines. The first tag becomes the card's accent chip. |
| `slug` | no | Overrides the URL. Defaults to the filename without `.md`, slugified. |
| `cover` | no | Card image, as a path under `content/blog/` — e.g. `cover: covers/my-post.jpg`. JPEG, PNG, WebP, AVIF or SVG. Published beside the post's JSON. Shown on the `/blog` card, in the home page's Insights band for the newest (or `featured`) post, and as the post's Open Graph image (the picture a shared link shows), so give it one. |
| `coverAlt` | no | Alt text for the cover. Set it whenever you set `cover`; the build warns when it is missing. |
| `featured` | no | `true` pins the post to the home page's featured slot regardless of date. One post at a time. |

A missing cover is not an error. If the post has no `cover:` field, the build
falls back to the first image in the body — as long as its `src` is an
`http(s)` URL, an absolute `/public` path, or a small inline data URI (the
same sources the renderer allows; see [Images](#images)). Only when the post
also has no such image do the cards fall back to their text form. A `cover`
that points at a file which is not in `content/blog/` is dropped with a build
warning rather than published as a broken image.

## What the renderer supports

Headings, paragraphs, bold, italic, links, images, fenced code blocks with syntax
highlighting, blockquotes, tables, ordered/unordered lists, task lists,
strikethrough and horizontal rules. Code fences highlight `python`, `ts`/`tsx`,
`js`/`jsx`, `json`, `bash`/`sh` and `http`/`curl`; other languages render with
minimal highlighting.

Markdown headings render as `h2`–`h4`, because the post title is already the page's
only `h1`.

`_template.md` in the content directory exercises every one of these — copy it
rather than starting from scratch.

### Images

Put the file in `public/blog-assets/` and reference it with an absolute
path so it resolves identically on every route:

```markdown
![Alt text](/blog-assets/my-diagram.png)
```

Small base64 `data:` URIs also work, but every visitor downloads them inline, so
prefer a file. `data:image/svg+xml` is rejected — SVG can carry script.

### Raw HTML is ignored, by design

See [Security](#security). HTML in a post renders as inert text, not markup.

## Why a post doesn't appear

Bad files are skipped rather than breaking the build. The reason is logged by the
build, and surfaced in the `Deploy` run under "Files that did NOT publish". A
post is skipped when:

- there's no leading `---` frontmatter fence;
- `title`, `author` or `date` is missing;
- `date` isn't `YYYY-MM-DD`;
- `published` is missing, misspelled, or not `true`;
- the body is empty;
- another file already claimed the same slug (rename it, or set `slug:`);
- no URL-safe slug can be derived from the filename or title.

An empty content directory (or one where every post is a draft) renders the
"No posts yet" state — that's expected, not a bug.

---

## How it works

```
content/blog/*.md          the only place content lives
   │
   ▼
vite-plugin-content.ts             parse frontmatter, drop drafts, sort newest-first
   │   dev:   serves /blog/*.json from disk, per request
   │   build: emits dist/blog/index.json + dist/blog/<slug>.json
   ▼
scripts/prerender.mjs              renders every route with react-dom/server
   │   dist/blog/index.html, dist/blog/<slug>/index.html — each with its
   │   <title>, meta description, canonical, og:image, JSON-LD and the
   │   post's JSON embedded for hydration
   │   dist/sitemap-blog.xml, dist/sitemap.xml, dist/feed.xml
   ▼
deploy.yml  (every push to main)
   │   scripts/sync-site.sh: one `aws s3 sync` pass per object class,
   │   Content-Type and Cache-Control per class, stale objects deleted,
   │   then `cloudfront create-invalidation --paths '/*'`
   ▼
CloudFront serves /blog/<slug> from blog/<slug>/index.html (infra/cloudfront/);
the client hydrates, and in-app navigation fetches /blog/*.json as before
```

### Why the posts are both prerendered and fetched

Each post is rendered to static HTML at build time, so a crawler, a link
unfurler or a reader with JavaScript still loading gets the whole page — title,
description, cover, structured data, body — from the first response. The same
JSON the page was rendered from is embedded in that HTML, so hydration needs no
request; a reader who then navigates within the site fetches `/blog/<slug>.json`
as before, which keeps the post content out of the bundle and the markdown
renderer off the home page's critical path (both blog routes stay lazily
imported in `App.tsx`).

Publishing therefore is a deploy: a post changes its own page, the index, the
home page, the sitemaps and the feed, which is why the old content-only
workflow was retired (see the header of `deploy.yml`).

### Drafts never leave the repo

`published: false` and malformed files emit no JSON at all, so unpublished content
is absent from `dist/` entirely — it cannot be read out of a public artifact. This
is enforced in one place (`describeSkip` in `src/blog/parsePost.ts`) and used by
both the generator and the dev middleware.

### Who uploads what

`scripts/sync-site.sh`, and nothing else. `deploy.yml` calls it on every push to
`main`; `deploy.sh` is the local escape hatch and calls the same script. The
script uploads `dist/` in one pass per object class — a post's HTML gets
`text/html` and a must-revalidate TTL, its JSON `application/json` and a short
TTL, its cover an image type and a long one — and deletes what the build stopped
producing, so removing a `.md` removes its page, its JSON and its sitemap entry
on the next deploy.

### Security

Post bodies are Markdown rendered by `react-markdown` in
`src/blog/MarkdownContent.tsx`, and are treated as untrusted even though they now
come from the repo:

- **Raw HTML never renders.** `rehype-raw` is deliberately not installed, so
  react-markdown drops embedded HTML instead of parsing it — `<script>`,
  `<iframe>` and `onerror=` are inert text. **Do not add `rehype-raw`**: that one
  change would turn every post into a script injection on `fintela.io`.
- **URLs are allow-listed** by `urlTransform`: `http(s)`, `mailto`, `tel`, anchors
  and relative paths for links; `https` and non-SVG base64 for image `src`.
  `javascript:`, `vbscript:` and `data:text/html` are dropped, including
  control-character evasions like `java&#9;script:`.
- **No `dangerouslySetInnerHTML`** anywhere in the blog tree.

`MarkdownContent` also renders the documentation. Two behaviours are opt-in via
props — heading anchors and cross-page link resolution — and the blog passes
neither, so posts render exactly as they always have.

## Files

| Path | Role |
|---|---|
| `content/blog/*.md` | the posts — the only place content lives |
| `content/blog/_template.md` | copy-to-start template (a draft, never published) |
| `vite-plugin-content.ts` | emits `blog/*.json` (and `docs/*.json`); serves the same paths in dev |
| `scripts/prerender.mjs` | renders every route — each post's page, the index — to static HTML, plus the sitemaps and `feed.xml` |
| `scripts/sync-site.sh` | uploads `dist/` with per-class headers and invalidates CloudFront; called by both deploy paths |
| `scripts/check-seo-output.mjs` | CI: every prerendered page has one `<title>`, one `<h1>`, a canonical, a description and an OG image; sitemaps list only real pages |
| `.github/workflows/deploy.yml` | builds and deploys on every push to `main` — content included |
| `src/content/frontmatter.ts` | the YAML subset, slug/excerpt/read-time derivation — shared with docs |
| `src/content/json.ts` | fetch, memo, "missing vs. broken" classification — shared with docs |
| `src/content/format.ts` | date formatting and excerpt truncation — shared with docs |
| `src/blog/api.ts` | fetches the JSON; 404 / empty-state handling |
| `src/blog/useBlog.ts` | `useBlogIndex` / `useBlogPost` hooks |
| `src/blog/parsePost.ts` | which frontmatter fields a *post* requires |
| `src/blog/MarkdownContent.tsx` | sanitized Markdown renderer, shared with docs |
| `src/blog/BlogCard.tsx` | preview card |
| `src/blog/format.ts` | per-post accent colour |
| `src/pages/BlogPage.tsx` | `/blog` grid |
| `src/pages/BlogPostPage.tsx` | `/blog/:slug` |
