# Contributing

Thanks for your interest. This repository is the public marketing site,
documentation, and blog for [Fintela](https://fintela.io).

## Setup

Requires Node 20+. No credentials are needed.

```bash
npm ci
npm run dev
```

## Before you open a pull request

```bash
npx tsc -b                        # must pass
npm run build                     # must pass
node scripts/check-legal-final.mjs
node scripts/i18n-keysync.mjs     # en/es/pt key parity
```

Any collaborator may open a pull request and merge it once the `check` job is
green. No approval is required.

CI runs all four. `npm run lint` is **not** gated yet — it is red with three
pre-existing errors (`AnimateOnScroll.tsx`, `DocsSearch.tsx`, `Prose.tsx`).
Fixing those and turning the gate on is a genuinely useful first contribution.

A pull request that only touches `content/` needs none of this — the build is the
only thing that reads those files, and it reports any page it had to skip.

## Adding user-facing copy

All visible strings go through i18next, and every key must exist in **all three**
locales under `src/i18n/locales/{en,es,pt}/`. `i18n-keysync.mjs` enforces both key
parity and `{{interpolation}}` parity, so a string added to `en` only will fail CI.

## Blog posts and documentation

Both are Markdown in this repository and neither needs a site deploy to publish.

- **Blog** — see [BLOG.md](BLOG.md). Copy `content/blog/_template.md`, set
  `published: true`, and merge.
- **Documentation** — see [DOCS.md](DOCS.md). Copy `content/docs/_template.md` into
  the folder for its section, set `published: true`, and merge. Every published page
  has an **Edit this page on GitHub** link at the bottom that opens its source file
  directly, which is the fastest way to fix a typo or clarify a paragraph.

Documentation pages need no code change: the section grouping, the sidebar, the
search index, the prev/next order and the table of contents are all derived from the
file's frontmatter and headings.

## Design

Colors, gradients, radii, shadows, and motion come from `src/theme/tokens.ts`.
Import from there rather than writing raw hex values.

## Areas that need care

No path is gated on a specific reviewer, so these are on you to respect:

- **`content/legal/`** — the operative Terms and Privacy Notice. These are
  contractual instruments drafted by counsel, not documentation, and they are
  excluded from the code license. Do not edit them; open an issue instead.
- **Brand and customer logos** under `src/assets/` — see [NOTICE](NOTICE).
- **`.github/workflows/`** — deploy credentials.

## Reporting a security issue

Please do **not** open a public issue. Email hello@fintela.io.

## License

By contributing you agree your contributions are licensed under the
[MIT License](LICENSE), with the exclusions listed in [NOTICE](NOTICE).
