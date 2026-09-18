/* eslint-disable react-refresh/only-export-components -- a build-time entry, never hot-reloaded */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { AppRoutes } from './App';
import type { Pages } from './App';
import { HomePage } from './pages/HomePage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ContactPage } from './pages/ContactPage';
import { PricingPage } from './pages/PricingPage';
import { SolutionPage } from './pages/SolutionPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RiskDisclosuresPage } from './pages/RiskDisclosuresPage';
import { DocPage } from './pages/DocPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { initServerI18n } from './i18n/server';
import type { SupportedLng } from './i18n/config';
import { resetJsonCache, seedJson } from './content/json';
import { blogJsonUrl } from './blog/api';
import { docJsonUrl } from './docs/api';
import type { BlogIndex } from './blog/types';
import type { DocsIndex } from './docs/types';
import { RenderStatusContext } from './seo/renderStatus';
import { STATIC_ROUTES } from './seo/routes';

/**
 * The build-time renderer behind `scripts/prerender.mjs`.
 *
 * `render(url)` produces what the browser would have produced for that URL:
 * the same route table (`AppRoutes`), the same theme, the same components,
 * with three substitutions that only matter off-screen — pages imported
 * eagerly instead of through `React.lazy`, i18next initialised synchronously
 * from the bundled catalogs, and the JSON a route fetches seeded up front so
 * every hook renders `ready` on its first pass. Nothing in `src/` branches on
 * "am I on the server"; the pages cannot tell the difference, which is what
 * keeps the prerendered markup hydratable.
 *
 * Emotion's styles are collected into `styles` (critical CSS for the route)
 * rather than left inline, and the `<title>`/`<meta>`/`<link>` tags React 19
 * hoists ahead of the markup are split off into `head` for the script to place
 * in the document head.
 *
 * Built with `vite build --ssr src/entry-server.tsx` into `.prerender/`; never
 * part of the browser bundle.
 */

// The pages the browser lazy-loads, imported eagerly: `React.lazy` cannot
// resolve inside `renderToString`.
const eagerPages: Pages = {
  HomePage,
  BlogPage,
  BlogPostPage,
  ContactPage,
  PricingPage,
  SolutionPage,
  TermsPage,
  PrivacyPage,
  RiskDisclosuresPage,
  DocPage,
  NotFoundPage,
};

export interface RenderOptions {
  lang: SupportedLng;
  /** JSON to seed before rendering, keyed by fetch URL (`blogJsonUrl`, `docJsonUrl`). */
  data: Record<string, unknown>;
  /**
   * Stand-ins seeded for the first render only (`seedJson(…, { partial })`):
   * the browser renders from them, then fetches the real object as it would
   * have anyway. Nothing uses it today — the docs index no longer carries the
   * search text (that is `docs/search.json`), so it is seeded whole — but the
   * mechanism stays for the next payload that is too big to embed.
   */
  partial?: Record<string, unknown>;
}

export interface RenderResult {
  /** The hoisted `<title>`/`<meta>`/`<link>` tags, for `<head>`. */
  head: string;
  /** The page markup, for `<div id="root">`. */
  html: string;
  /** Emotion's critical CSS as `<style data-emotion>` tags, for `<head>`. */
  styles: string;
  status: 200 | 404;
  /** What was seeded — the script embeds it for the client to seed in turn. */
  data: Record<string, unknown>;
  partial: Record<string, unknown>;
}

/**
 * React emits the hoistable tags first, then the markup. Peel the leading
 * `<title>`, `<meta>` and `<link>` elements off (they are the only tags React
 * hoists out of a page that renders none of the others) and what is left is
 * the tree that belongs inside `#root`.
 */
const HOISTED = /^(?:<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*>)/;

function splitHoisted(markup: string): { head: string; html: string } {
  let rest = markup;
  const head: string[] = [];
  for (let match = HOISTED.exec(rest); match; match = HOISTED.exec(rest)) {
    head.push(match[0]);
    rest = rest.slice(match[0].length);
  }
  return { head: head.join('\n'), html: rest };
}

export async function render(
  url: string,
  { lang, data, partial = {} }: RenderOptions
): Promise<RenderResult> {
  await initServerI18n(lang);

  // A fresh data cache per route: the memo is module-global, and one route's
  // JSON must not bleed into the next route's markup.
  resetJsonCache();
  for (const [key, value] of Object.entries(data)) seedJson(key, value);
  for (const [key, value] of Object.entries(partial)) seedJson(key, value, { partial: true });

  let notFound = false;
  const markNotFound = () => {
    notFound = true;
  };
  const cache = createCache({ key: 'css' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

  const markup = renderToString(
    <StrictMode>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />
          <RenderStatusContext.Provider value={markNotFound}>
            <StaticRouter location={url}>
              <AppRoutes pages={eagerPages} />
            </StaticRouter>
          </RenderStatusContext.Provider>
        </ThemeProvider>
      </CacheProvider>
    </StrictMode>
  );

  const styles = constructStyleTagsFromChunks(extractCriticalToChunks(markup));
  const { head, html } = splitHoisted(markup);
  return { head, html, styles, status: notFound ? 404 : 200, data, partial };
}

export interface PrerenderRoute {
  path: string;
  /** The JSON this route renders from, keyed by fetch URL. */
  data: Record<string, unknown>;
  /** Stand-ins for the first render; see `RenderOptions.partial`. */
  partial: Record<string, unknown>;
}

/**
 * Every URL the build writes an HTML document for, with the JSON each one
 * needs seeded: the static routes, one per published post, one per published
 * doc. `data` is the whole `blog/` + `docs/` output of the content plugin,
 * keyed the way the app fetches it.
 */
export function routesFor(data: Record<string, unknown>): PrerenderRoute[] {
  const blogIndexKey = blogJsonUrl('index.json');
  const docsIndexKey = docJsonUrl('index.json');
  const blogIndex = data[blogIndexKey] as BlogIndex | undefined;
  const docsIndex = data[docsIndexKey] as DocsIndex | undefined;

  const pick = (path: string, keys: string[]): Record<string, unknown> => {
    const picked: Record<string, unknown> = {};
    for (const key of keys) {
      if (!(key in data))
        throw new Error(`prerender: ${path} needs ${key}, which the build did not produce`);
      picked[key] = data[key];
    }
    return picked;
  };

  const routes: PrerenderRoute[] = STATIC_ROUTES.map((path) => ({
    path,
    // The home page's Insights band and /blog both render the post index.
    data: path === '/' || path === '/blog' ? pick(path, blogIndex ? [blogIndexKey] : []) : {},
    partial: {},
  }));
  // A post page also renders the index: its related posts and prev/next pair.
  for (const post of blogIndex?.posts ?? []) {
    const path = `/blog/${post.slug}`;
    routes.push({ path, data: pick(path, [blogJsonUrl(`${post.slug}.json`), blogIndexKey]), partial: {} });
  }
  // The index (sidebar, breadcrumb, prev/next) is seeded whole: without the
  // search text it is ~25 KB, and embedding it means a documentation page
  // hydrates without fetching anything.
  for (const page of docsIndex?.pages ?? []) {
    const path = `/docs/${page.slug}`;
    routes.push({
      path,
      data: pick(path, [docJsonUrl(`${page.slug}.json`), docsIndexKey]),
      partial: {},
    });
  }
  return routes;
}

// What the prerender script needs besides `render` — re-exported so it reads
// one module and never duplicates a constant.
export { STATIC_ROUTES } from './seo/routes';
export { SITE_URL, absoluteUrl } from './seo/site';
export { blogAssetUrl, blogJsonUrl, blogPostImageUrl } from './blog/api';
export { docJsonUrl } from './docs/api';
