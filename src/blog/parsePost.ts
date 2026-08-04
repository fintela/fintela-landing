import {
  deriveSlug,
  firstParagraph,
  parseBool,
  parseDate,
  parseFrontmatter,
  parseList,
  readingMinutes,
} from '../content/frontmatter';
import type { BlogPost } from './types';

/**
 * Turns a `.md` file from `content/blog/` into a post.
 *
 * The YAML subset, slug derivation, excerpt fallback and reading estimate all
 * live in `src/content/frontmatter.ts`, shared with the docs collection. What
 * stays here is only what makes a *post* a post: which fields are required, and
 * what the card needs.
 *
 * A malformed file is skipped with a build warning rather than throwing — one bad
 * post must never take the blog page down. `describeSkip` is exported so the
 * generator can report the same reasons.
 */

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
    tags: parseList(data.tags),
    readingMinutes: readingMinutes(markdown),
    markdown,
  };
}
