#!/usr/bin/env node
/**
 * Fails when the solution pages say something the app contradicts, or when a
 * chapter or an image is missing what the page template needs.
 *
 * The rules come from the claims policy in docs/redesign/SOLUTIONS-PLAN.md
 * (section 6). Each pattern below is a claim the app does not support, a name
 * the public site must not use, or a figure the app hides; the comment beside
 * it says why. Remove a pattern only together with the policy row that put it
 * there.
 *
 * What it asserts:
 *   - no string in src/i18n/locales/en/solutions.json (all four pages' copy,
 *     SEO descriptions and FAQ answers included) matches a pattern in DENY;
 *   - the pricing strings in pages.json do not promise "any broker";
 *   - every chapter has a title, a sentence, a proof line and a docs label,
 *     and every FAQ entry a question and an answer;
 *   - when dist/ exists (after `npm run build`), no rendered alt or aria-label
 *     is a raw i18n key (the solution pages once shipped
 *     alt="fintelligent.posterAlt"), and the four prerendered solution pages
 *     contain no DENY match either.
 *
 * Runs on the source without a build; run it again after the build to cover
 * the rendered pages. CI runs it after the build, next to check-media.mjs.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOLUTIONS = 'src/i18n/locales/en/solutions.json';
const PAGES = 'src/i18n/locales/en/pages.json';

/** [pattern, why]. Case-insensitive. */
const DENY = [
  [/cryptograph|hashed/i, 'no hash exists on strategy versions; history is dated versions only'],
  [/private by default/i, 'everything is shared organisation-wide'],
  [/cross[- ]organi[sz]ation/i, 'no user can publish across organisations'],
  [/laboratory/i, 'the Laboratory is off in production'],
  [/real[- ]time (order logs?, )?p&l|real[- ]time p&l/i, 'P&L arrives daily, end of day'],
  [/with sources/i, 'Fintelligent links to the app, it does not cite sources'],
  [/thousands of trials in parallel/i, 'trials run in parallel batches'],
  [/not (in )?a (serial )?queue|0 minutes|queue wait/i, 'a study can wait when shared capacity is full'],
  [/one[- ]click to (pause or )?stop|stop in one click/i, 'Stop asks for one confirmation; Pause is one click'],
  [/same figures/i, 'model and broker figures are shown separately on purpose'],
  [/full audit trail/i, 'overstated; say a dated record of strategy changes and orders'],
  [/client'?s mandate|every client'?s/i, 'there is no client or mandate object in the app'],
  [/\balpaca\b/i, 'the broker is never named on a public page'],
  [/paper trading today|paper only/i, 'real-money trading is open to every customer'],
  [/\bsoc ?2\b|iso ?27001|certif/i, 'security certifications are never mentioned, not even their absence'],
  [/deflated sharpe|probabilistic sharpe/i, 'hidden in the app since 2026-10-10 (sharpeProbabilityMetrics)'],
  [/\bpandas\b|\bnumpy\b|scikit|scipy|statsmodels/i, 'trade/1 strategies import only fintela_trade, math, datetime, typing, functools'],
  [/derive (a |the )?risk manager|optimize rms/i, 'Derive does not run on trade/1 studies'],
  [/any broker/i, 'one broker trades today; say "your brokerage account"'],
];

/** A rendered attribute that is still an i18n key: `ns.key`, `a.b.c`. */
const RAW_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_]+)+$/;

const problems = [];

const walk = (value, at, visit) => {
  if (typeof value === 'string') visit(value, at);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${at}[${i}]`, visit));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, at ? `${at}.${k}` : k, visit);
};

const denyCheck = (text, where) => {
  for (const [pattern, why] of DENY) {
    const m = text.match(pattern);
    if (m) problems.push(`${where}: "${m[0]}" (${why})`);
  }
};

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

// ---- source -------------------------------------------------------------------

const solutions = JSON.parse(await readFile(path.join(ROOT, SOLUTIONS), 'utf8'));
walk(solutions, '', (text, at) => denyCheck(text, `${SOLUTIONS} ${at}`));

const pages = JSON.parse(await readFile(path.join(ROOT, PAGES), 'utf8'));
walk(pages, '', (text, at) => {
  if (/any broker/i.test(text)) problems.push(`${PAGES} ${at}: "any broker" (one broker trades today; say "your brokerage account")`);
});

for (const [audience, page] of Object.entries(solutions)) {
  if (audience === 'common') continue;
  for (const key of ['title', 'titleAccent', 'lead', 'badge']) {
    if (!page[key]) problems.push(`${SOLUTIONS} ${audience}.${key}: missing`);
  }
  const chapters = Object.entries(page.chapters ?? {});
  if (chapters.length < 3 || chapters.length > 4) problems.push(`${SOLUTIONS} ${audience}.chapters: ${chapters.length} chapters (3 or 4)`);
  for (const [key, chapter] of chapters) {
    const needs = chapter.points ? ['title', 'sentence', 'docsLabel'] : ['title', 'sentence', 'proof', 'docsLabel'];
    for (const field of needs) {
      if (!chapter[field]) problems.push(`${SOLUTIONS} ${audience}.chapters.${key}.${field}: missing`);
    }
  }
  for (const [key, item] of Object.entries(page.faq ?? {})) {
    if (!item.q || !item.a) problems.push(`${SOLUTIONS} ${audience}.faq.${key}: needs q and a`);
  }
}

// ---- dist (after a build) -----------------------------------------------------

const DIST = path.join(ROOT, 'dist');
if (await exists(DIST)) {
  const htmlFiles = [];
  const collect = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) await collect(p);
      else if (entry.name.endsWith('.html')) htmlFiles.push(p);
    }
  };
  await collect(DIST);
  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const [, attr, value] of html.matchAll(/\s(alt|aria-label)="([^"]*)"/g)) {
      if (RAW_KEY.test(value.trim())) problems.push(`${path.relative(ROOT, file)}: ${attr}="${value}" is an i18n key, not text`);
    }
  }
  for (const slug of ['hedge-funds', 'quant-teams', 'independent-quants', 'financial-advisors']) {
    const file = path.join(DIST, 'solutions', slug, 'index.html');
    if (!(await exists(file))) continue;
    const html = await readFile(file, 'utf8');
    const text = html
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&');
    denyCheck(text, path.relative(ROOT, file));
  }
}

if (problems.length) {
  console.error(`Solution pages: ${problems.length} problem${problems.length === 1 ? '' : 's'}`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Solution pages: claims and chapter copy are clean.');
