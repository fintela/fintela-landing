# Fintela Landing Page

The public marketing site, documentation, and blog for [Fintela](https://fintela.io) —
a platform for building, simulating, optimizing, and live-trading quantitative
equity and crypto portfolios.

**Live:** <https://fintela.io>

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript, [Vite](https://vite.dev) 7 |
| UI | MUI 7 + Emotion, design tokens in `src/theme/tokens.ts` |
| Routing | React Router 7 (client-side SPA) |
| i18n | i18next — English, Spanish, Portuguese, lazily loaded per namespace |
| Markdown | react-markdown + remark-gfm, with an in-repo syntax highlighter |
| Hosting | Prerendered static build on S3 behind CloudFront — `scripts/sync-site.sh` uploads it, `infra/cloudfront/` is the edge config (router function, headers, 404) |

There is no server and no backend in this repository. The application behind
`app.fintela.io` is separate and closed-source.

## Getting started

Requires Node 20 or newer.

```bash
npm ci
npm run dev          # http://localhost:5173
```

No credentials or API keys are needed to run or build the site. The one
environment variable the app reads is `VITE_FINTELA_API`, where the contact form
posts; see [.env.example](.env.example).

**Working on more than one branch at once?** Each git worktree gets its own port
block and its own config, nothing is set by hand:

```bash
cd ~/fintela/landing/main && ./setup_worktree.sh <name>   # creates ../<name>
cd ../<name>
make dev             # the site on this worktree's port
make check           # what CI runs
make nuke            # before `git worktree remove`
```

Design notes in [docs/LOCAL_WORKTREES.md](docs/LOCAL_WORKTREES.md).

```bash
npm run build        # → dist/
npm run preview      # serve dist/ locally
npm run lint
npx tsc -b           # typecheck
```

## Layout

```
content/
  blog/            blog posts — Markdown, see BLOG.md
  docs/            documentation pages — Markdown, see DOCS.md
  legal/           the published Terms and Privacy Notice (see NOTICE)
src/
  pages/           top-level routes
  components/      sections, header, footer, shared UI (primitives/ is the soft-UI kit)
  solutions/       the /solutions/* pages as data — one template, three audiences
  media/           every image and video slot, typed; posters under assets/media/
  content/         the Markdown pipeline both collections share
  blog/            blog rendering + the sanitized Markdown renderer
  docs/            docs rendering — index, sidebar, search, table of contents
  theme/           design tokens, the soft-UI recipes (neu.ts) and the MUI theme
  i18n/locales/    en / es / pt catalogs
public/media/      demo videos (mp4/webm) and captions (vtt) — see src/media/registry.ts
public/robots.txt  crawler policy; the sitemaps and feed are generated at build time
infra/cloudfront/  the edge as code: viewer-request router (301s + prerendered-page
                   rewrite), security headers, 404 document, cache policy — README.md
                   there is the runbook; nothing in it runs from CI
scripts/
  i18n-keysync.mjs        enforces en/es/pt key parity
  check-seo-output.mjs    CI gate on the prerendered output: one <h1>/<title>/canonical
                          per page, sitemaps list only real pages
  sync-site.sh            the one upload path (deploy.yml and deploy.sh both call it):
                          per-class Content-Type/Cache-Control, one /* invalidation
vite-plugin-content.ts    turns content/{blog,docs}/**.md into the JSON the app fetches
```

## Writing a blog post or a documentation page

Both collections are Markdown in this repository, published the same way. Copy the
relevant `_template.md`, fill in the frontmatter, set `published: true`, and merge to
`main`. The deploy that follows every push prerenders the page, regenerates the
sitemaps and the feed, and has it live in about three minutes.

- Blog posts — `content/blog/`, guide in [BLOG.md](BLOG.md)
- Documentation — `content/docs/`, guide in [DOCS.md](DOCS.md)

Documentation is a genuine contribution path: every page carries an **Edit this page
on GitHub** link that opens its source file, and saving proposes a pull request.

## Prerendering & SEO

The site is a React SPA that ships as a static site: every route is rendered to
HTML at build time and the browser hydrates it. Crawlers and link scrapers (none
of which run the app) get a full document per URL — its own title, description,
canonical, Open Graph card, JSON-LD and body text — and visitors get a page that
is on screen before the bundle arrives.

**How the build works.** `npm run build` runs `tsc -b`, `vite build`, then
`node scripts/prerender.mjs`. The script builds `src/entry-server.tsx` as an SSR
bundle (into the gitignored `.prerender/`), reads `dist/index.html` as the
template and the `blog/` + `docs/` JSON the content plugin emitted, and writes
one document per route: `dist/index.html` for `/`, `dist/<route>/index.html` for
everything else, and `dist/404.html` (noindex) for unknown paths. Each document
carries the route's head tags, Emotion's critical CSS, a modulepreload for its
route chunk and, at the end of `<body>`, the JSON it rendered from in
`<script id="__fintela_data" type="application/json">`. The route list is
`src/seo/routes.ts` plus one route per published post and doc; the build fails
if any route renders empty or without a title. `npm run prerender` re-runs only
the last step.

**Sitemaps and feed.** The same script writes `dist/sitemap.xml` (an index of
`sitemap-pages.xml`, `sitemap-blog.xml`, `sitemap-docs.xml` — 200 URLs only,
never redirects or the 404) and `dist/feed.xml` (RSS 2.0 for the blog).
`lastmod` comes from the content's own dates (`updated:` in frontmatter, the
legal documents' `STATUS.json`), or the file's last git commit when that is
later and the checkout is not shallow.

**The `<Seo>` component** (`src/seo/Seo.tsx`) is the only place head tags are
written. Every page mounts it; React 19 hoists what it renders into `<head>`, on
the client and in the prerender alike, so `index.html` deliberately carries no
title or description of its own. Copy lives in the `seo.*` keys of
`pages.json`/`solutions.json`; the Schema.org builders are in `src/seo/jsonld.ts`
and the site constants (origin, organisation, default social image) in
`src/seo/site.ts`.

**`VITE_SITE_URL`** is the origin everything absolute is written against
(canonicals, `og:url`, JSON-LD ids, sitemaps, feed). It defaults to
`https://fintela.io`; set it for a preview build so a staging bucket never
claims to be production.

**Hydration and language.** Documents are prerendered in English. `src/main.tsx`
hydrates only when the document was prerendered for the current URL and the
visitor's language (localStorage `fintela-lng`, then the browser's) resolves to
English; anyone else — a Spanish or Portuguese preference, the dev server's empty
root, a fallback document served for another path — gets a plain client render
from a cleared root, so a hydration mismatch can never occur. An inline script in
`index.html` hides the English markup from non-English visitors until that render
lands. Per-language URLs (`/es`, `/pt`) with hreflang are a later phase; the
renderer already takes a language and `<Seo>` accepts alternates, so adding them
is additive.

`npm run preview` serves `dist/` the way the edge does (`/pricing` →
`pricing/index.html`, unknown paths → `404.html` with a 404), which is what lets
the prerendered pages and hydration be checked locally.

**Fonts, images and chunks.** Inter and JetBrains Mono are self-hosted from the
`@fontsource-variable` packages (declared in `src/index.css`, metric-matched
local fallbacks behind them so a late font never shifts layout; the prerender
preloads Inter everywhere and JetBrains Mono on `/docs/*`). Stills go through
`vite-imagetools` (`src/media/registry.ts` imports them with `?w=…&format=avif;webp;jpeg&as=picture`)
and `MediaWell` renders a `<picture>` with intrinsic dimensions; videos are
encoded by `scripts/encode-media.sh` from `media-masters/`. The browser bundle
is split into `vendor-react`, `vendor-mui` and `vendor-i18n` chunks plus the app
(`vite.config.ts`), so a copy change no longer re-downloads the framework.

**Hosting.** The S3 upload (`scripts/sync-site.sh`) sets Content-Type and
Cache-Control per object class; the CloudFront side — the viewer-request router
that serves each route's document and issues the 301s, the security headers, the
404 document — is code and a runbook under `infra/cloudfront/`.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Two areas are
gated and need a maintainer:

- **`content/legal/`** — contractual instruments under counsel review, not
  documentation. See [NOTICE](NOTICE).
- **Brand and customer logos** — not covered by the code license.

## License

Source code is [MIT](LICENSE).

The legal documents, Fintela and Momento Capital brand assets, and third-party
customer logos are **excluded** from that grant — [NOTICE](NOTICE) lists them
specifically and is binding. If you fork this repository, read it first.

© 2026 Momento Capital, S.A.P.I. de C.V.
