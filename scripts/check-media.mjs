#!/usr/bin/env node
/**
 * Fails when src/media/registry.ts names a video file that public/media does
 * not hold.
 *
 * A missing file never breaks a page — VideoPlate falls back to the poster —
 * which is exactly why nobody notices: every visit still makes the request,
 * and the SPA fallback answers it with index.html (200, text/html) that the
 * browser downloads, fails to decode, and cannot cache (audit IMG-05, CWV-08).
 * The registry is the one place a URL is written, so the check reads it.
 *
 * What it asserts:
 *   - every `mediaUrl('…')` in src/media/registry.ts (comments stripped, so a
 *     "to re-enable, add mediaUrl(…)" note does not count) is a file under
 *     public/media;
 *   - and warns, without failing, about files under public/media that no
 *     `mediaUrl()` names, and about registered files no mounted component
 *     plays (`UNMOUNTED` below; today platform-home.mp4, 13 MB, waiting for a
 *     tour chapter): both are synced and invalidated on every deploy for nothing.
 *
 * Runs on the source, not on dist/, so it needs no build; run it before or
 * after `npm run build`, and in CI next to scripts/check-seo-output.mjs.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const REGISTRY = 'src/media/registry.ts';
const MEDIA_DIR = 'public/media';
/** Files that live in public/media for reasons other than a registry entry. */
const IGNORE = new Set(['.gitkeep', '.DS_Store']);
/**
 * Registry entries no mounted component reaches: deployed, invalidated and
 * synced on every release, never fetched by a visitor (audit IMG-04). Warned,
 * not failed — the file is kept for the slot it is meant for. Remove an entry
 * here the day a component uses it (a `{ kind: 'video', video: 'platformHome' }`
 * chapter in src/solutions/registry.ts, for platform-home.mp4).
 */
const UNMOUNTED = {
  'platform-home.mp4':
    'VIDEOS.platformHome.src; PlatformShowcase plays the `ambient` loop and no solution chapter uses the tour',
};

const source = await readFile(REGISTRY, 'utf8');
// Block comments, then line comments (a URL never contains `//` after the
// scheme-less `mediaUrl('…')` form, so this is safe on this file).
const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const referenced = [...code.matchAll(/mediaUrl\(\s*(['"`])([^'"`]+)\1\s*\)/g)].map((m) => m[2]);

if (referenced.length === 0) {
  console.error(`check-media: no mediaUrl() calls found in ${REGISTRY}; is the regex stale?`);
  process.exit(1);
}

const exists = async (file) => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

const missing = [];
for (const file of referenced) {
  if (!(await exists(path.join(MEDIA_DIR, file)))) missing.push(file);
}

const onDisk = [];
async function walk(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel);
    else onDisk.push(rel);
  }
}
await walk(MEDIA_DIR);

const wanted = new Set(referenced);
const unreferenced = onDisk.filter((file) => !wanted.has(file));

const mb = async (file) => ((await stat(path.join(MEDIA_DIR, file))).size / 1048576).toFixed(1);

for (const file of unreferenced) {
  console.warn(
    `check-media: warning: ${MEDIA_DIR}/${file} (${await mb(file)} MB) is deployed but nothing in ${REGISTRY} references it`
  );
}
let unmounted = 0;
for (const [file, why] of Object.entries(UNMOUNTED)) {
  if (!wanted.has(file) || !(await exists(path.join(MEDIA_DIR, file)))) continue;
  unmounted++;
  console.warn(
    `check-media: warning: ${MEDIA_DIR}/${file} (${await mb(file)} MB) is registered but no mounted component plays it (${why})`
  );
}

if (missing.length) {
  console.error(
    `check-media: ${missing.length} file(s) named in ${REGISTRY} are missing from ${MEDIA_DIR}:\n` +
      missing.map((f) => `  - ${f}`).join('\n') +
      `\n  Run scripts/encode-media.sh, or drop the entry (see the \`agents\` note in the registry).`
  );
  process.exit(1);
}

console.log(
  `check-media: ${referenced.length} referenced file(s) present` +
    (unreferenced.length ? `, ${unreferenced.length} unreferenced (warned)` : '') +
    (unmounted ? `, ${unmounted} registered but unmounted (warned)` : '')
);
