# Fintela Blog — authoring guide

Blog posts are Markdown files in [`content/blog/`](content/blog/). There is
no CMS, no database, no API and no credential of any kind. A post is a file in the
repo, and merging it to `main` publishes it — **without deploying the site**.

The documentation under `content/docs/` works exactly the same way and shares this
machinery — see [DOCS.md](DOCS.md).

## Publish a post

```bash
cp content/blog/_template.md content/blog/my-post.md
# write it, set `published: true`
cd landing && npm run dev          # preview at localhost:5173/blog
```

Commit and merge to `main`. That's it — **no site deploy is needed.** Pushing a
change under `content/blog/` triggers
[`deploy.yml`](.github/workflows/deploy.yml), which regenerates the
blog JSON and syncs only the `blog/` prefix of the bucket. The post is live in about
a minute.

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
| `date` | **yes** | `YYYY-MM-DD`. Drives newest-first ordering. Calendar-invalid dates are rejected. |
| `published` | **yes** | `true` publishes. Anything else — including a missing or misspelled value — is treated as a draft and stays off the site. |
| `excerpt` | no | Card summary. Defaults to the first real paragraph. Cards truncate at ~150 characters. |
| `tags` | no | `tags: A, B` or `tags: [A, B]` or a `- item` list on following lines. The first tag becomes the card's accent chip. |
| `slug` | no | Overrides the URL. Defaults to the filename without `.md`, slugified. |

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
build (and shown in the `blog-publish` run log). A post is skipped when:

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
deploy.yml  (push to main touching content/blog/**)
   │   aws s3 sync dist/blog/ s3://$S3_BUCKET/blog/ --delete
   │   cloudfront create-invalidation --paths /blog/*
   ▼
src/blog/api.ts fetches /blog/index.json → BlogPage / BlogPostPage
```

### Why the posts are fetched rather than bundled

So that publishing does not require a site deploy. The blog JSON is the *only*
thing that changes when a post is added — verified: adding one `.md` changes
`blog/index.json` and `blog/<slug>.json` and **nothing else** in `dist/`, not
index.html and not a single hashed asset. That is what makes syncing one prefix a
complete publish.

The alternative (inlining posts into the bundle with `import.meta.glob`) would put
post content behind a content-hashed chunk, so every post would need a full deploy
and a cache bust of the whole app.

Both blog routes are still lazily imported in `App.tsx`, keeping the markdown
renderer and syntax highlighter off the home page's critical path.

### Drafts never leave the repo

`published: false` and malformed files emit no JSON at all, so unpublished content
is absent from `dist/` entirely — it cannot be read out of a public artifact. This
is enforced in one place (`describeSkip` in `src/blog/parsePost.ts`) and used by
both the generator and the dev middleware.

### Who owns the `blog/` prefix

`deploy.yml` and `deploy.sh` both emit it from the same generator, so their
output is byte-identical and neither can clobber the other. `deploy.sh` syncs the
blog prefix as a second step purely to apply the short cache TTLs those
non-hashed URLs need.

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
| `.github/workflows/deploy.yml` | builds and publishes on every push to main |
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
