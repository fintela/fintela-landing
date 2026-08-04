/**
 * Shapes emitted by `vite-plugin-content.ts` into `docs/` and read back by
 * `src/docs/api.ts`.
 *
 * A contract between the generator and the app rather than a live API: the plugin
 * and these types must change together. Deliberately parallel to
 * `src/blog/types.ts` — same generator, same fetch layer, same renderer, so the
 * two collections stay one system with two schemas.
 */

/** One card in the `/docs` index — metadata only, no body. */
export interface DocSummary {
  slug: string;
  title: string;
  /** Parent section, e.g. "Getting Started". Groups the index and the sidebar. */
  section: string;
  /** Position within the section, ascending. */
  order: number;
  /** `YYYY-MM-DD`, already validated by the generator. */
  updated: string;
  excerpt: string;
  readingMinutes: number;
  /**
   * Repo-relative path of the source file, e.g. `content/docs/api/errors.md`.
   * Drives the "Edit this page" link, so it survives a file moving between
   * folders without the URL changing.
   */
  sourcePath: string;
  /** Author-supplied search terms, on top of the title and body text. */
  keywords: string[];
  /**
   * Plain-text body, capped by the generator. This is the whole static search
   * index: it makes "filter by content" a substring test over `index.json`
   * instead of 25 extra fetches or a search service.
   */
  searchText: string;
}

/** A full documentation page — `docs/<slug>.json`. */
export interface DocDetail extends DocSummary {
  markdown: string;
}

/** `docs/index.json` — the whole published set, section order then page order. */
export interface DocsIndex {
  generatedAt: string;
  /** Section titles in display order — empty sections are already omitted. */
  sections: string[];
  pages: DocSummary[];
}
