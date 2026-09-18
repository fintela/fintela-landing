import {
  deriveSlug,
  firstParagraph,
  parseBool,
  parseDate,
  parseFrontmatter,
  parseInteger,
  parseList,
  readingMinutes,
  toPlainText,
} from '../content/frontmatter';
import type { DocDetail, DocSearchEntry } from './types';

/**
 * Turns a `.md` file from `content/docs/` into a documentation page.
 *
 * Same shape as `src/blog/parsePost.ts` on purpose — both call the shared
 * frontmatter primitives and differ only in which fields they require. What a doc
 * needs beyond a post: a `section` to group under, an `order` to sort by, and an
 * `updated` date instead of a publication `date`.
 */

/**
 * How much plain text goes into `search.json` for client-side content search.
 *
 * Capped because the whole file is fetched the first time the ⌘K palette opens:
 * the full bodies of every page would be hundreds of KB for a substring test.
 * A few thousand characters covers the summary, the headings and the opening of
 * each section, which is what a reader actually searches for.
 */
const SEARCH_TEXT_LIMIT = 2400;

/**
 * What `buildDoc` produces: the page as published (`DocDetail`) plus the search
 * text the generator files separately. The two travel together out of the
 * parser so the search index can never describe a page other than the one that
 * was emitted.
 */
export type ParsedDoc = DocDetail & Pick<DocSearchEntry, 'searchText'>;

/** Sections sort by the smallest `sectionOrder` any of their pages declares. */
export const DEFAULT_SECTION_ORDER = 999;

/** Why a file was skipped, or `null` if it is publishable. */
export function describeDocSkip(filename: string, source: string): string | null {
  const parsed = parseFrontmatter(source);
  if (!parsed) return "no frontmatter block (expected a leading '---' fence)";

  const { data, body } = parsed;
  const missing = ['title', 'section', 'updated'].filter(
    (k) => !String(data[k] ?? '').trim(),
  );
  if (missing.length) return `frontmatter missing ${missing.join(', ')}`;
  if (!parseDate(data.updated)) {
    return `updated "${String(data.updated)}" is not YYYY-MM-DD`;
  }

  const published = parseBool(data.published);
  if (published === undefined) return "'published' is missing or unparseable";
  if (!published) return 'published: false (draft)';
  if (!body.trim()) return 'body is empty';

  const slug = deriveSlug(filename, data);
  if (!slug) return 'could not derive a URL-safe slug from its name or title';
  return null;
}

/**
 * `sectionOrder` is read separately from `buildDoc` because it never reaches the
 * client: the generator uses it to order the sections and then throws it away, so
 * the app has one ordered `sections` array instead of a rule to reimplement.
 */
export function docSectionOrder(source: string): number {
  const parsed = parseFrontmatter(source);
  if (!parsed) return DEFAULT_SECTION_ORDER;
  return parseInteger(parsed.data.sectionOrder) ?? DEFAULT_SECTION_ORDER;
}

/** A publishable doc page, or `null` when the file is a draft or malformed. */
export function buildDoc(filename: string, source: string): ParsedDoc | null {
  if (describeDocSkip(filename, source)) return null;

  // describeDocSkip has already validated everything below.
  const { data, body } = parseFrontmatter(source)!;
  const markdown = body.trim();

  return {
    slug: deriveSlug(filename, data),
    title: String(data.title).trim(),
    section: String(data.section).trim(),
    // An unordered page sinks to the bottom of its section rather than jumping to
    // the top, which is what `0` would do.
    order: parseInteger(data.order) ?? DEFAULT_SECTION_ORDER,
    updated: parseDate(data.updated)!,
    excerpt:
      String(data.summary ?? data.excerpt ?? '').trim() || firstParagraph(markdown),
    readingMinutes: readingMinutes(markdown),
    sourcePath: filename,
    keywords: parseList(data.keywords),
    searchText: toPlainText(markdown).slice(0, SEARCH_TEXT_LIMIT),
    markdown,
  };
}
