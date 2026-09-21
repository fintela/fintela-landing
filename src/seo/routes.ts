/**
 * The site's static routes — every URL that exists independently of content.
 * `/blog/<slug>` and `/docs/<slug>` come from `blog/index.json` and
 * `docs/index.json` at build time (see `routesFor` in `src/entry-server.tsx`).
 *
 * One list, shared by the prerenderer and the sitemap, so a page added to
 * `App.tsx` that is missing here is caught the first time someone looks for it
 * in `dist/`. Redirect-only paths (`/solutions`, `/docs`, `/documentation/*`)
 * are deliberately absent: they are never a 200 and never belong in a sitemap.
 * Kept as plain strings so it stays importable without the media registry.
 */
export const STATIC_ROUTES = [
  '/',
  '/pricing',
  '/contact',
  '/blog',
  '/product/agentic-ai',
  '/product/samplers',
  '/product/in-depth-analysis',
  '/product/fintela-api',
  '/solutions/hedge-funds',
  '/solutions/quant-teams',
  '/solutions/independent-quants',
  '/terms',
  '/privacy',
  '/risk-disclosures',
] as const;

export type StaticRoute = (typeof STATIC_ROUTES)[number];

/** `/docs` itself redirects, so the documentation's entry URL is the overview. */
export const DOCS_HOME = '/docs/overview';
