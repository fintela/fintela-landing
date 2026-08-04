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
| Hosting | Static build on S3 behind CloudFront |

There is no server and no backend in this repository. The application behind
`app.fintela.io` is separate and closed-source.

## Getting started

Requires Node 20 or newer.

```bash
npm ci
npm run dev          # http://localhost:5173
```

No environment variables, credentials, or API keys are needed to run or build the
site. `.env.local` is supported but optional.

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
  components/      sections, header, footer, shared UI
  content/         the Markdown pipeline both collections share
  blog/            blog rendering + the sanitized Markdown renderer
  docs/            docs rendering — index, sidebar, search, table of contents
  theme/           design tokens and the MUI theme
  i18n/locales/    en / es / pt catalogs
scripts/
  check-legal-final.mjs   refuses to ship placeholder legal documents
  i18n-keysync.mjs        enforces en/es/pt key parity
vite-plugin-content.ts    turns content/{blog,docs}/**.md into the JSON the app fetches
```

## Writing a blog post or a documentation page

Both collections are Markdown in this repository, published the same way. Copy the
relevant `_template.md`, fill in the frontmatter, set `published: true`, and merge to
`main`. It goes live in about a minute **without a site deploy**.

- Blog posts — `content/blog/`, guide in [BLOG.md](BLOG.md)
- Documentation — `content/docs/`, guide in [DOCS.md](DOCS.md)

Documentation is a genuine contribution path: every page carries an **Edit this page
on GitHub** link that opens its source file, and saving proposes a pull request.

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
