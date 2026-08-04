/**
 * Frontmatter parsing shared by every Markdown collection in `content/`.
 *
 * Extracted from the blog parser when `content/docs/` became the second
 * collection: both go through the exact same YAML subset, slug derivation,
 * excerpt fallback and reading estimate, so there is one implementation of each
 * and the two collections cannot drift.
 *
 * A malformed file is *described* rather than thrown on — each collection's
 * `describeSkip` reports a reason the build logs, so one bad file never takes a
 * page down.
 */

/** Words per minute behind every "N min read" badge. */
const READING_WPM = 200;

export type FrontmatterValue = string | string[];

export interface Frontmatter {
  data: Record<string, FrontmatterValue>;
  body: string;
}

/**
 * The subset of YAML the content spec uses: `key: scalar`, `key: [a, b]`, and
 * block sequences (`key:` followed by `- item` lines). Nesting, anchors and
 * multi-line scalars are deliberately unsupported — a file needing them is
 * malformed rather than half-parsed.
 */
export function parseFrontmatter(source: string): Frontmatter | null {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
  if (!match) return null;

  const data: Record<string, FrontmatterValue> = {};
  const lines = match[1].split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const kv = /^([A-Za-z0-9_-]+)[ \t]*:[ \t]*(.*)$/.exec(line);
    if (!kv) continue;

    const key = kv[1];
    const inline = kv[2].trim();

    if (inline) {
      data[key] = parseValue(inline);
      continue;
    }

    // Bare `key:` → collect following `- item` lines as a sequence.
    const items: string[] = [];
    while (i + 1 < lines.length && /^[ \t]*-[ \t]+/.test(lines[i + 1])) {
      items.push(unquote(lines[++i].replace(/^[ \t]*-[ \t]+/, '').trim()));
    }
    data[key] = items.length ? items : '';
  }

  return { data, body: text.slice(match[0].length) };
}

const unquote = (value: string): string => {
  const s = value.trim();
  const quoted =
    (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"));
  return quoted && s.length >= 2 ? s.slice(1, -1) : s;
};

function parseValue(raw: string): FrontmatterValue {
  const s = raw.trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    return s.slice(1, -1).split(',').map(unquote).filter(Boolean);
  }
  return unquote(s);
}

const TRUTHY = new Set(['true', 'yes', 'y', '1', 'on']);
const FALSY = new Set(['false', 'no', 'n', '0', 'off', '']);

/** Tri-state, so a *missing* flag is distinguishable from an explicit `false`. */
export function parseBool(value: FrontmatterValue | undefined): boolean | undefined {
  if (value === undefined || Array.isArray(value)) return undefined;
  const s = String(value).trim().toLowerCase();
  if (TRUTHY.has(s)) return true;
  if (FALSY.has(s)) return false;
  return undefined;
}

/** `key: A, B`, `key: [A, B]`, or a `- item` block — all become `['A', 'B']`. */
export function parseList(value: FrontmatterValue | undefined): string[] {
  if (Array.isArray(value)) return value.map((t) => t.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map(unquote).filter(Boolean);
}

/** A non-negative integer, or `undefined` when the field is absent or junk. */
export function parseInteger(value: FrontmatterValue | undefined): number | undefined {
  if (value === undefined || Array.isArray(value)) return undefined;
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return undefined;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : undefined;
}

/** Accepts `YYYY-MM-DD` or a full ISO timestamp; returns the date part. */
export function parseDate(value: FrontmatterValue | undefined): string | null {
  const s = Array.isArray(value) ? '' : String(value ?? '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Rejects calendar-invalid dates (2026-02-31 would roll into March).
  return parsed.toISOString().slice(0, 10) === iso ? iso : null;
}

export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents so "Análisis" → "analisis"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/**
 * First candidate that survives slugification wins. The title is a real
 * fallback: a filename in a non-Latin script slugifies to nothing, and that must
 * not disqualify an otherwise-valid file.
 *
 * `filename` may carry directories (`api/errors.md`); only the basename counts,
 * so moving a file between folders never changes its URL.
 */
export function deriveSlug(
  filename: string,
  data: Record<string, FrontmatterValue>,
): string {
  const name = filename.replace(/^.*\//, '').replace(/\.md$/i, '');
  return (
    [data.slug, name, data.title]
      .map((candidate) =>
        slugify(Array.isArray(candidate) ? '' : String(candidate ?? '')),
      )
      .find(Boolean) ?? ''
  );
}

/** Body text minus markup — for excerpt fallbacks, search text and read time. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}\[!\w+\]\s*/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The first block long enough to read as prose — skips headings and images. */
export function firstParagraph(markdown: string): string {
  for (const block of markdown.split(/\n\s*\n/)) {
    const text = toPlainText(block);
    if (text.length > 40) return text;
  }
  return toPlainText(markdown).slice(0, 300);
}

export const readingMinutes = (markdown: string): number =>
  Math.max(
    1,
    Math.ceil(toPlainText(markdown).split(/\s+/).filter(Boolean).length / READING_WPM),
  );
