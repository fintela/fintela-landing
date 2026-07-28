#!/usr/bin/env node
/**
 * Gate the legal documents this site serves at /terms and /privacy.
 *
 * Publishing a placeholder as a binding legal document is not a cosmetic bug — the
 * page an Alpaca marketplace reviewer (or a user) reads IS the contract. This check
 * exists so that cannot happen by accident. It runs in CI and is safe to run locally:
 *
 *     node scripts/check-legal-final.mjs
 *
 * Two independent gates:
 *   1. The served markdown must carry no draft banners and no `[BRACKETED]` blanks,
 *      and must name the contracting entity.
 *   2. `docs/legal/STATUS.json` must mark each document `counsel_final`. That flag is
 *      set by a human, only once counsel has delivered the complete text — it is a
 *      record of a legal fact, not a feature toggle.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const legalDir = join(repoRoot, 'content', 'legal');

/** The contracting entity. A served document that never names it is not the real one. */
const REQUIRED_ENTITY = 'Momento Capital';

/** Markers that betray an unfinished document. */
const FORBIDDEN = [
  { pattern: /DRAFT/i, why: 'draft banner' },
  { pattern: /PENDING COUNSEL/i, why: 'pending-counsel banner' },
  { pattern: /\bTBD\b|\bTODO\b|\bXXX\b/, why: 'unfinished marker' },
  { pattern: /\bLorem ipsum\b/i, why: 'lorem ipsum' },
  // `[LEGAL ENTITY NAME]`, `[JURISDICTION]`, `[VENUE]`, `[CURRENCY]`, `[USD $100]` …
  // Two or more SHOUTING words in brackets. Narrow on purpose: it must not fire on
  // ordinary markdown links like `[Privacy Notice](/privacy)`.
  { pattern: /\[[A-Z][A-Z0-9 ,./$—-]{3,}\]/, why: 'bracketed placeholder' },
];

const failures = [];

/**
 * Vet one served markdown file: no draft/placeholder markers, and it must name the
 * contracting entity. A file that cannot be read is a failure, not a skip.
 */
function vetDocument(file) {
  const abs = join(legalDir, file);
  const rel = relative(repoRoot, abs);
  let text;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    failures.push(`${rel}: listed in STATUS.json but missing from disk`);
    return;
  }

  for (const { pattern, why } of FORBIDDEN) {
    const line = text.split('\n').findIndex((l) => pattern.test(l));
    if (line !== -1) {
      failures.push(`${rel}:${line + 1}: ${why} — "${text.split('\n')[line].trim().slice(0, 72)}"`);
    }
  }

  if (!text.includes(REQUIRED_ENTITY)) {
    failures.push(`${rel}: never names the contracting entity ("${REQUIRED_ENTITY}")`);
  }
}

/* ── Gate 1: the documents themselves ─────────────────────────────────────── */
const status = JSON.parse(readFileSync(join(legalDir, 'STATUS.json'), 'utf8'));

for (const [key, doc] of Object.entries(status.documents)) {
  vetDocument(doc.file);

  // The Spanish original is the version that legally prevails, so it is held to the
  // same bar: a placeholder there is worse than one in the English translation.
  if (doc.spanish_file) {
    vetDocument(doc.spanish_file);
  }

  /* ── Gate 2: a human has confirmed counsel signed off ───────────────────── */
  if (doc.counsel_final !== true) {
    const rel = relative(repoRoot, join(legalDir, doc.file));
    failures.push(
      `${rel}: STATUS.json marks it counsel_final=false — ${doc.blocked_on ?? 'not cleared for publication'}`,
    );
  }
  void key;
}

if (failures.length > 0) {
  console.error('\n✗ Legal documents are not fit to publish:\n');
  for (const f of failures) console.error(`  • ${f}`);
  console.error(
    '\n  These files are served publicly at /terms and /privacy on both fintela.io and\n' +
      '  app.fintela.io. Do not deploy them until counsel delivers the final text and\n' +
      '  docs/legal/STATUS.json is updated to match.\n',
  );
  process.exit(1);
}

console.log('✓ Legal documents are counsel-final and free of placeholders.');
