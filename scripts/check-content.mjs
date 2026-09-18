#!/usr/bin/env node
/**
 * Content hygiene gate for the published blog and docs.
 *
 * `scripts/check-docs-links.mjs` answers one question — does every `/docs/…` link
 * resolve? This one covers the rest of what a published page can get wrong in a
 * way nobody notices in the browser:
 *
 *   - an image hot-linked from another host (it becomes og:image and the
 *     Article's image, on someone else's uptime and rate limits);
 *   - an image with no alt text, or the template's literal "Alt text";
 *   - a body image whose file the build did not publish (a typo'd `covers/…`
 *     path renders as a broken image, and the generator only warns);
 *   - a cover with no `coverAlt`;
 *   - an internal link into a redirect: bare `/docs` or `/solutions`, the retired
 *     `/documentation/*` paths, a trailing slash or upper-case letters (all 301 at
 *     the edge once the CloudFront router is applied — link straight to the page);
 *   - an internal link to a route that does not exist: not a static route in
 *     `src/seo/routes.ts`, not a published post, not a published doc page.
 *
 * Reads `dist/` rather than `content/`, so it validates exactly what was published
 * and never trips over a draft. Run after `npm run build`.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const ROUTES_SOURCE = 'src/seo/routes.ts';
const PLACEHOLDER_ALT = /^alt text$/i;

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const IMAGE = /!\[([^\]]*)\]\(\s*([^\s)]+)[^)]*\)/g;
const LINK = /(?<!!)\[[^\]]*\]\(\s*([^\s)]+)[^)]*\)/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const HTTP = /^https?:\/\//i;

/** Walk a body's lines, skipping fenced code blocks (where `![x](y)` is just text). */
function* codeFreeLines(markdown) {
  let fence = null;
  for (const line of markdown.split('\n')) {
    const match = FENCE.exec(line);
    if (match) {
      const ticks = match[1][0];
      if (!fence) fence = ticks;
      else if (ticks === fence) fence = null;
      continue;
    }
    if (!fence) yield line;
  }
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function readCollection(name) {
  const dir = path.join(DIST, name);
  const indexFile = path.join(dir, 'index.json');
  if (!existsSync(indexFile)) return { index: null, items: [] };
  const index = await readJson(indexFile);
  const summaries = index.posts ?? index.pages ?? [];
  const items = [];
  for (const summary of summaries) {
    items.push(await readJson(path.join(dir, `${summary.slug}.json`)));
  }
  return { index, items };
}

/** The static routes, read from the one list the prerender and sitemap use. */
async function staticRoutes() {
  const source = await readFile(ROUTES_SOURCE, 'utf8');
  const block = /STATIC_ROUTES\s*=\s*\[([\s\S]*?)\]/.exec(source);
  if (!block) throw new Error(`check-content: could not find STATIC_ROUTES in ${ROUTES_SOURCE}`);
  return new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

async function main() {
  const blog = await readCollection('blog');
  const docs = await readCollection('docs');
  if (!blog.index && !docs.index) {
    console.error('check-content: dist/blog/index.json and dist/docs/index.json not found — run `npm run build` first.');
    process.exit(1);
  }

  const routes = await staticRoutes();
  const postSlugs = new Set(blog.items.map((p) => p.slug));
  const docSlugs = new Set(docs.items.map((d) => d.slug));

  /** Whether an in-app path answers 200. */
  const routeExists = (pathname) => {
    if (routes.has(pathname)) return true;
    const post = /^\/blog\/([^/]+)$/.exec(pathname);
    if (post) return postSlugs.has(post[1]);
    const doc = /^\/docs\/([^/]+)$/.exec(pathname);
    if (doc) return docSlugs.has(doc[1]);
    return false;
  };

  const problems = [];
  let images = 0;
  let links = 0;

  /**
   * `collection` is where a relative image resolves: the generator publishes
   * `covers/x.jpg` from a post at `dist/blog/covers/x.jpg`, and the page's URL
   * (`/blog/<slug>`) makes the browser look in the same place.
   */
  const checkImage = (where, src, alt, collection, what) => {
    images++;
    if (HTTP.test(src)) {
      problems.push(`${where}: ${what} "${src}" is hot-linked — copy it into content/${collection}/covers/`);
    }
    if (alt !== undefined && (!alt.trim() || PLACEHOLDER_ALT.test(alt.trim()))) {
      problems.push(`${where}: ${what} "${src}" has ${alt.trim() ? 'placeholder' : 'no'} alt text`);
    }
    if (/^data:/i.test(src) || EXTERNAL.test(src)) return;
    const clean = src.split(/[?#]/)[0].replace(/^\.\//, '');
    const file = clean.startsWith('/')
      ? path.join(DIST, clean.slice(1))
      : path.join(DIST, collection, clean);
    if (!existsSync(file)) {
      problems.push(`${where}: ${what} "${src}" was not published (expected ${file})`);
    }
  };

  const checkLink = (where, href) => {
    if (EXTERNAL.test(href) || href.startsWith('#')) return;
    // Repo-relative `.md` paths are a docs convention check-docs-links owns.
    if (/\.md(#.*)?$/i.test(href)) return;
    if (!href.startsWith('/')) return; // a relative asset, not a route
    links++;

    const [pathname] = href.split(/[?#]/);
    if (pathname === '/docs' || pathname === '/docs/') {
      problems.push(`${where}: → ${href} — /docs only redirects; link to /docs/overview`);
    } else if (pathname === '/solutions' || pathname === '/solutions/') {
      problems.push(`${where}: → ${href} — /solutions only redirects; link to a solution page`);
    } else if (pathname.startsWith('/documentation/')) {
      problems.push(`${where}: → ${href} — retired URL; link to the /docs/<slug> page`);
    } else if (pathname.length > 1 && pathname.endsWith('/')) {
      problems.push(`${where}: → ${href} — trailing slash redirects at the edge; drop it`);
    } else if (pathname !== pathname.toLowerCase()) {
      problems.push(`${where}: → ${href} — upper-case path redirects at the edge; use lower case`);
    } else if (!routeExists(pathname)) {
      problems.push(`${where}: → ${href} — no such route (not static, not a published post or doc)`);
    }
  };

  const checkBody = (where, markdown, collection) => {
    for (const line of codeFreeLines(markdown)) {
      for (const [, alt, src] of line.matchAll(IMAGE)) {
        checkImage(where, src.trim(), alt, collection, 'image');
      }
      for (const [, href] of line.matchAll(LINK)) checkLink(where, href.trim());
    }
  };

  for (const post of blog.items) {
    const where = post.sourcePath ?? `blog/${post.slug}`;
    if (post.cover) {
      checkImage(where, post.cover, undefined, 'blog', 'cover');
      const coverAlt = post.coverAlt?.trim() ?? '';
      if (!coverAlt || PLACEHOLDER_ALT.test(coverAlt)) {
        problems.push(`${where}: cover "${post.cover}" has ${coverAlt ? 'placeholder' : 'no'} coverAlt`);
      }
    }
    checkBody(where, post.markdown, 'blog');
  }
  for (const doc of docs.items) {
    checkBody(doc.sourcePath ?? `docs/${doc.slug}`, doc.markdown, 'docs');
  }

  if (problems.length) {
    console.error(`check-content: ${problems.length} problem(s):\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  console.log(
    `check-content: ${images} image(s) and ${links} internal link(s) across ` +
      `${blog.items.length} post(s) and ${docs.items.length} doc page(s) are clean.`,
  );
}

await main();
