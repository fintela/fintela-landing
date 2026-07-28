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

CI runs all four. `npm run lint` is **not** gated yet — it is red with three
pre-existing errors (`AnimateOnScroll.tsx`, `DocsSearch.tsx`, `Prose.tsx`).
Fixing those and turning the gate on is a genuinely useful first contribution.

## Adding user-facing copy

All visible strings go through i18next, and every key must exist in **all three**
locales under `src/i18n/locales/{en,es,pt}/`. `i18n-keysync.mjs` enforces both key
parity and `{{interpolation}}` parity, so a string added to `en` only will fail CI.

## Blog posts

See [BLOG.md](BLOG.md). Copy `content/blog/_template.md`, set `published: true`,
and merge — no site deploy required.

## Design

Colors, gradients, radii, shadows, and motion come from `src/theme/tokens.ts`.
Import from there rather than writing raw hex values.

## Areas that need a maintainer

Some paths are owned (see [CODEOWNERS](CODEOWNERS)) and cannot merge on an
ordinary review:

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
