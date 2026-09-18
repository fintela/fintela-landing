/** What kind of result a hit is, for the section eyebrow and the icon. */
export type SearchEntryKind = 'page' | 'doc' | 'blog';

/**
 * One thing the site-wide palette can match and jump to — a marketing page,
 * a documentation page, or a blog post, normalized to the same shape so one
 * scorer and one result row can handle all three. See `siteIndex.ts` for how
 * each kind is built.
 */
export interface SearchEntry {
  /** `<kind>:<slug>` — unique across the whole index. */
  id: string;
  kind: SearchEntryKind;
  title: string;
  /** Eyebrow shown above the title — a doc's section, "Blog", or "Pages". */
  section: string;
  excerpt: string;
  keywords: string[];
  /** Body text, when there is one to search (docs only, from `docs/search.json`). */
  body?: string;
  url: string;
}
