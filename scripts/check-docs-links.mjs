#!/usr/bin/env node
/**
 * Fails when a documentation page links to a page or an anchor that does not exist.
 *
 * At run time a dead cross-reference degrades to plain text (see DOCS.md), which is
 * the right behaviour for a reader — but it is silent, so a typo'd link just loses
 * its underline and nobody notices. This check is the author-time half of that
 * bargain, and it matters more now that the docs are Markdown anyone can send a pull
 * request against: a PR touching only `content/` is otherwise gated by nothing but
 * the build.
 *
 * Reads `dist/docs/` rather than `content/docs/`, so it validates exactly what was
 * published — drafts are absent by then, which is the point: a link into an
 * unpublished page must fail here.
 *
 * Run after `npm run build`.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist/docs';

/** Mirrors `slugify` in src/content/frontmatter.ts. */
const slugify = (value) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Mirrors `stripInline` in src/docs/toc.ts — inline markup out, its content kept. */
const stripInline = (text) =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`+/g, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

/** Walk a body's lines, skipping fenced code blocks. */
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

const headingAnchors = (markdown) => {
  const ids = new Set();
  for (const line of codeFreeLines(markdown)) {
    const match = /^(#{2,4})[ \t]+(.+?)[ \t]*#*$/.exec(line);
    if (match) ids.add(slugify(stripInline(match[2])));
  }
  return ids;
};

const LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

async function main() {
  let index;
  try {
    index = JSON.parse(await readFile(path.join(DIST, 'index.json'), 'utf8'));
  } catch {
    console.error(
      `check-docs-links: ${DIST}/index.json not found — run \`npm run build\` first.`,
    );
    process.exit(1);
  }

  const pages = new Map();
  for (const summary of index.pages) {
    const doc = JSON.parse(
      await readFile(path.join(DIST, `${summary.slug}.json`), 'utf8'),
    );
    pages.set(summary.slug, {
      sourcePath: summary.sourcePath,
      markdown: doc.markdown,
      anchors: headingAnchors(doc.markdown),
    });
  }

  const problems = [];
  let checked = 0;

  for (const [slug, page] of pages) {
    for (const line of codeFreeLines(page.markdown)) {
      for (const [, href] of line.matchAll(LINK)) {
        if (EXTERNAL.test(href)) continue;
        checked++;

        const [target, anchor] = href.startsWith('#')
          ? [slug, href.slice(1)]
          : parseDocHref(href);

        if (target === null) continue; // some other in-app path — not ours to check

        if (!pages.has(target)) {
          problems.push(`${page.sourcePath}: → ${href} — no published page "${target}"`);
        } else if (anchor && !pages.get(target).anchors.has(anchor)) {
          problems.push(`${page.sourcePath}: → ${href} — no heading anchor "#${anchor}"`);
        }
      }
    }
  }

  if (problems.length) {
    console.error(`check-docs-links: ${problems.length} broken link(s):\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    console.error(
      '\nA link to an unpublished page renders as plain text at run time, so this ' +
        'is a silent failure in the browser. Fix the target, or publish it.',
    );
    process.exit(1);
  }

  console.log(
    `check-docs-links: ${checked} internal link(s) across ${pages.size} page(s) all resolve.`,
  );
}

/**
 * `[slug, anchor]` for a link that points at a doc page, or `[null]` when it points
 * somewhere else in the app (`/blog`, `/contact`) and is none of this check's
 * business. Accepts both forms DOCS.md documents: `/docs/<slug>` and a `.md` path.
 */
function parseDocHref(href) {
  const [pathPart, anchor] = href.split('#');

  const route = /^\/docs\/([^/]+)\/?$/.exec(pathPart);
  if (route) return [route[1].replace(/\.md$/i, ''), anchor];

  if (/\.md$/i.test(pathPart)) {
    return [pathPart.replace(/\.md$/i, '').replace(/^.*\//, ''), anchor];
  }

  return [null];
}

await main();
