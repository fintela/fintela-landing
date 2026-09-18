#!/usr/bin/env node
/**
 * Fails when the built site is not what a crawler needs to see.
 *
 * The site is prerendered: `npm run build` writes `dist/index.html`, one
 * `dist/<route>/index.html` per route, `dist/404.html`, the sitemaps and the RSS
 * feed (scripts/prerender.mjs). CloudFront serves those files directly, so a
 * route that is missing here is a route Google sees as the 404 document, and a
 * page with two <h1>s or no canonical is indexed that way. None of it is visible
 * in the browser — the SPA hydrates and looks fine either way — hence this check.
 *
 * What it asserts, on dist/ (so it validates what actually ships):
 *   - the fixed files exist: index.html, 404.html, robots.txt, feed.xml, the
 *     sitemap index and its three children, and one page from each collection;
 *   - every <loc> in every sitemap maps to an existing prerendered file, is on
 *     the site origin, has no query/hash/trailing slash, and is not one of the
 *     paths the router redirects (/docs, /solutions, /documentation/*);
 *   - every prerendered page has exactly one <title>, one canonical, one meta
 *     description, an og:image, exactly one <h1>, and JSON-LD that parses;
 *   - 404.html carries a robots noindex.
 *
 * The <h1> rule is the heading-hierarchy gate. It is a hard failure on purpose:
 * one <h1> per page is the contract every page component signed up to, and a
 * page that breaks it is a page whose outline regressed.
 *
 * Run after `npm run build`.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const SITE_URL = (process.env.VITE_SITE_URL || 'https://fintela.io').replace(/\/+$/, '');

/** Paths the CloudFront router 301s; a sitemap must never list them. */
const REDIRECT_PATHS = [/^\/docs$/, /^\/solutions$/, /^\/documentation(\/.*)?$/];

const problems = [];
const fail = (what) => problems.push(what);

const exists = async (file) => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

const count = (html, re) => (html.match(re) || []).length;

/** `<meta name="robots" content="…noindex…">` in either attribute order. */
const hasNoindex = (html) =>
  [...html.matchAll(/<meta\s[^>]*>/gi)].some(
    ([tag]) => /name=["']robots["']/i.test(tag) && /content=["'][^"']*noindex/i.test(tag),
  );

// ── 1. Fixed files ─────────────────────────────────────────────────────────

const FIXED = [
  'index.html',
  '404.html',
  'robots.txt',
  'feed.xml',
  'sitemap.xml',
  'sitemap-pages.xml',
  'sitemap-blog.xml',
  'sitemap-docs.xml',
  'pricing/index.html',
  'docs/overview/index.html',
];

// One blog page, whichever post is newest — the index is the source of truth
// for what published, so the check follows it rather than guessing a slug.
try {
  const index = JSON.parse(await readFile(path.join(DIST, 'blog/index.json'), 'utf8'));
  const first = index.posts?.[0]?.slug;
  if (first) FIXED.push(`blog/${first}/index.html`);
  else fail('blog/index.json lists no posts, so no blog page could be checked');
} catch (error) {
  fail(`blog/index.json unreadable: ${error.message}`);
}

for (const file of FIXED) {
  if (!(await exists(path.join(DIST, file)))) fail(`missing ${DIST}/${file}`);
}

// ── 2. Sitemaps ────────────────────────────────────────────────────────────

const locs = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);

/** dist file that serves a site URL, or null when the URL is not a page. */
function fileForUrl(url) {
  if (!url.startsWith(`${SITE_URL}/`) && url !== SITE_URL) return null;
  const pathname = url.slice(SITE_URL.length) || '/';
  if (pathname === '/') return 'index.html';
  return `${pathname.replace(/^\//, '')}/index.html`;
}

const sitemapRows = [];

async function checkSitemap(name, { isIndex }) {
  const file = path.join(DIST, name);
  if (!(await exists(file))) return; // already reported as missing
  const xml = await readFile(file, 'utf8');
  const urls = locs(xml);
  if (urls.length === 0) fail(`${name}: no <loc> entries`);

  const expectedRoot = isIndex ? '<sitemapindex' : '<urlset';
  if (!xml.includes(expectedRoot)) fail(`${name}: root element is not ${expectedRoot}>`);

  for (const url of urls) {
    if (!url.startsWith(`${SITE_URL}/`) && url !== SITE_URL) {
      fail(`${name}: ${url} is not on ${SITE_URL}`);
      continue;
    }
    if (/[?#]/.test(url)) fail(`${name}: ${url} has a query string or fragment`);

    if (isIndex) {
      const child = url.slice(SITE_URL.length + 1);
      if (!(await exists(path.join(DIST, child)))) fail(`${name}: child ${child} does not exist`);
      continue;
    }

    const pathname = url.slice(SITE_URL.length) || '/';
    if (pathname !== '/' && pathname.endsWith('/')) fail(`${name}: ${url} has a trailing slash`);
    if (REDIRECT_PATHS.some((re) => re.test(pathname.replace(/\/$/, '')))) {
      fail(`${name}: ${url} is a redirect path, not a page`);
    }
    const target = fileForUrl(url);
    if (!target || !(await exists(path.join(DIST, target)))) {
      fail(`${name}: ${url} → ${DIST}/${target ?? '?'} does not exist`);
    }
  }
  sitemapRows.push([name, String(urls.length)]);
}

await checkSitemap('sitemap.xml', { isIndex: true });
for (const child of ['sitemap-pages.xml', 'sitemap-blog.xml', 'sitemap-docs.xml']) {
  await checkSitemap(child, { isIndex: false });
}

// ── 3. Every prerendered page ──────────────────────────────────────────────

const SKIP_DIRS = new Set(['assets', 'media']);

// Prerendered pages are index.html at any depth, plus the 404 document. The
// standalone public/executive-overview.html is not a prerendered route (it is
// robots-disallowed) and is left alone.
const entries = await readdir(DIST, { recursive: true });
const pages = entries
  .filter((rel) => {
    const top = rel.split(path.sep)[0];
    if (SKIP_DIRS.has(top)) return false;
    return rel === '404.html' || path.basename(rel) === 'index.html';
  })
  .sort();

const pageRows = [];

for (const rel of pages) {
  const html = await readFile(path.join(DIST, rel), 'utf8');
  const route = rel === '404.html' ? '/404.html' : '/' + rel.replace(/(^|\/)index\.html$/, '');

  const titles = count(html, /<title[\s>]/gi);
  const canonicals = count(html, /<link\s[^>]*rel=["']canonical["']/gi);
  const descriptions = count(html, /<meta\s[^>]*name=["']description["']/gi);
  const ogImages = count(html, /<meta\s[^>]*property=["']og:image["']/gi);
  const h1s = count(html, /<h1[\s>]/gi);

  let jsonLd = 0;
  let jsonLdOk = true;
  for (const [, body] of html.matchAll(
    /<script\s[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    jsonLd++;
    try {
      JSON.parse(body);
    } catch (error) {
      jsonLdOk = false;
      fail(`${route}: JSON-LD does not parse (${error.message})`);
    }
  }

  const is404 = rel === '404.html';
  if (titles !== 1) fail(`${route}: ${titles} <title> (want 1)`);
  if (descriptions !== 1) fail(`${route}: ${descriptions} meta description (want 1)`);
  if (h1s !== 1) fail(`${route}: ${h1s} <h1> (want exactly 1)`);
  if (is404) {
    if (!hasNoindex(html)) fail(`${route}: no <meta name="robots" content="noindex">`);
  } else {
    if (canonicals !== 1) fail(`${route}: ${canonicals} <link rel="canonical"> (want 1)`);
    if (ogImages < 1) fail(`${route}: no og:image`);
  }

  pageRows.push([
    route,
    String(titles),
    String(canonicals),
    String(descriptions),
    String(ogImages),
    String(h1s),
    jsonLdOk ? String(jsonLd) : `${jsonLd}!`,
  ]);
}

if (pages.length === 0) fail(`no prerendered pages found under ${DIST}/`);

// ── Report ─────────────────────────────────────────────────────────────────

function table(header, rows) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ');
  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}

console.log('check-seo-output: sitemaps');
console.log(table(['file', 'urls'], sitemapRows.length ? sitemapRows : [['(none)', '0']]));
console.log('');
console.log(`check-seo-output: ${pages.length} prerendered page(s)`);
console.log(table(['route', 'title', 'canon', 'desc', 'og:img', 'h1', 'ld+json'], pageRows));

if (problems.length) {
  console.error(`\ncheck-seo-output: ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    '\nThese are invisible in the browser (the SPA renders regardless) and visible to ' +
      'every crawler. Fix the page or the prerender, not the check.',
  );
  process.exit(1);
}

console.log('\ncheck-seo-output: all prerendered pages and sitemaps are in order.');
