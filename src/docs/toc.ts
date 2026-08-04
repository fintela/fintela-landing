import { slugify } from '../content/frontmatter';

/** One entry in the right-rail "On this page" list. */
export interface TocItem {
  id: string;
  title: string;
  level?: 2 | 3;
}

/**
 * Heading anchors for a Markdown doc page — the right-rail "On this page" rail,
 * and the `#section` deep links other pages point at.
 *
 * The ids are derived here *and* in the renderer (`MarkdownContent` with
 * `headingAnchors`), from the same function over the same text, so the rail's
 * `href` always matches the `id` the heading gets. That is why `stripInline`
 * keeps the *content* of code spans and links rather than dropping it the way
 * `toPlainText` does: the renderer emits that text, so the id has to include it.
 */

/** Inline markup removed, inline content kept. */
const stripInline = (text: string): string =>
  text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`+/g, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** The anchor id for a heading's rendered text. */
export const headingId = (text: string): string => slugify(stripInline(text));

const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const HEADING = /^(#{2,3})[ \t]+(.+?)[ \t]*#*$/;

/**
 * `##` and `###` headings, in document order.
 *
 * Fenced blocks are tracked so a `# comment` line inside a shell snippet never
 * becomes a table-of-contents entry. Headings deeper than `###` are left out: a
 * rail listing four levels stops being a summary.
 */
export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Set<string>();
  let fence: string | null = null;

  for (const line of markdown.split('\n')) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      const ticks = fenceMatch[1];
      if (!fence) fence = ticks[0];
      else if (ticks[0] === fence) fence = null;
      continue;
    }
    if (fence) continue;

    const match = HEADING.exec(line);
    if (!match) continue;

    const title = stripInline(match[2]);
    const id = headingId(match[2]);
    // Two headings that slugify the same would give the rail two entries pointing
    // at one anchor. Keeping the first is the honest outcome, and the generator
    // warns about the duplicate so the file gets fixed.
    if (!id || seen.has(id)) continue;
    seen.add(id);

    items.push({ id, title, level: match[1].length === 2 ? 2 : 3 });
  }

  return items;
}

/** Heading ids that appear more than once — reported by the generator. */
export function duplicateHeadingIds(markdown: string): string[] {
  const counts = new Map<string, number>();
  let fence: string | null = null;

  for (const line of markdown.split('\n')) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      const ticks = fenceMatch[1];
      if (!fence) fence = ticks[0];
      else if (ticks[0] === fence) fence = null;
      continue;
    }
    if (fence) continue;

    const match = /^(#{2,4})[ \t]+(.+?)[ \t]*#*$/.exec(line);
    if (!match) continue;
    const id = headingId(match[2]);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}
