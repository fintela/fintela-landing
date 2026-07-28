import type { BlogPost } from './types';

/**
 * Turns a `.md` file from `landing/content/blog/` into a post.
 *
 * A malformed file is skipped with a console warning rather than throwing — one
 * bad post must never take the blog page down. `describeSkip` is exported so a
 * build-time check can report the same reasons.
 */

/** Words per minute behind the "N min read" badge. */
const READING_WPM = 200;

interface Frontmatter {
  data: Record<string, string | string[]>;
  body: string;
}

/**
 * The subset of YAML the blog spec uses: `key: scalar`, `key: [a, b]`, and block
 * sequences (`key:` followed by `- item` lines). Nesting, anchors and multi-line
 * scalars are deliberately unsupported — a post needing them is malformed rather
 * than half-parsed.
 */
export function parseFrontmatter(source: string): Frontmatter | null {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
  if (!match) return null;

  const data: Record<string, string | string[]> = {};
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

function parseValue(raw: string): string | string[] {
  const s = raw.trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    return s.slice(1, -1).split(',').map(unquote).filter(Boolean);
  }
  return unquote(s);
}

const TRUTHY = new Set(['true', 'yes', 'y', '1', 'on']);
const FALSY = new Set(['false', 'no', 'n', '0', 'off', '']);

/** Tri-state, so a *missing* flag is distinguishable from an explicit `false`. */
function parseBool(value: string | string[] | undefined): boolean | undefined {
  if (value === undefined || Array.isArray(value)) return undefined;
  const s = String(value).trim().toLowerCase();
  if (TRUTHY.has(s)) return true;
  if (FALSY.has(s)) return false;
  return undefined;
}

function parseTags(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.map((t) => t.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map(unquote).filter(Boolean);
}

/** Accepts `YYYY-MM-DD` or a full ISO timestamp; returns the date part. */
export function parseDate(value: string | string[] | undefined): string | null {
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

/** Body text minus markup — for the excerpt fallback and the reading estimate. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(markdown: string): string {
  for (const block of markdown.split(/\n\s*\n/)) {
    const text = toPlainText(block);
    // Skips headings, images and other short non-prose leading blocks.
    if (text.length > 40) return text;
  }
  return toPlainText(markdown).slice(0, 300);
}

const readingMinutes = (markdown: string): number =>
  Math.max(
    1,
    Math.ceil(toPlainText(markdown).split(/\s+/).filter(Boolean).length / READING_WPM),
  );

/** Why a file was skipped, or `null` if it is publishable. */
export function describeSkip(filename: string, source: string): string | null {
  const parsed = parseFrontmatter(source);
  if (!parsed) return "no frontmatter block (expected a leading '---' fence)";

  const { data, body } = parsed;
  const missing = ['title', 'author', 'date'].filter(
    (k) => !String(data[k] ?? '').trim(),
  );
  if (missing.length) return `frontmatter missing ${missing.join(', ')}`;
  if (!parseDate(data.date)) return `date "${String(data.date)}" is not YYYY-MM-DD`;

  const published = parseBool(data.published);
  if (published === undefined) return "'published' is missing or unparseable";
  if (!published) return 'published: false (draft)';
  if (!body.trim()) return 'body is empty';

  const slug = deriveSlug(filename, data);
  if (!slug) return 'could not derive a URL-safe slug from its name or title';
  return null;
}

function deriveSlug(filename: string, data: Record<string, string | string[]>): string {
  const name = filename.replace(/^.*\//, '').replace(/\.md$/i, '');
  // First candidate that survives slugification wins. The title is a real
  // fallback: a filename in a non-Latin script slugifies to nothing, and that
  // must not disqualify an otherwise-valid post.
  return (
    [data.slug, name, data.title]
      .map((candidate) => slugify(Array.isArray(candidate) ? '' : String(candidate ?? '')))
      .find(Boolean) ?? ''
  );
}

/** A publishable post, or `null` when the file is a draft or malformed. */
export function buildPost(filename: string, source: string): BlogPost | null {
  if (describeSkip(filename, source)) return null;

  // describeSkip has already validated everything below.
  const { data, body } = parseFrontmatter(source)!;
  const markdown = body.trim();

  return {
    slug: deriveSlug(filename, data),
    title: String(data.title).trim(),
    author: String(data.author).trim(),
    date: parseDate(data.date)!,
    excerpt: String(data.excerpt ?? '').trim() || firstParagraph(markdown),
    tags: parseTags(data.tags),
    readingMinutes: readingMinutes(markdown),
    markdown,
  };
}
