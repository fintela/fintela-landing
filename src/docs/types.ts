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
  /** Repo-relative path of the source file, e.g. `content/docs/api/errors.md`. */
  sourcePath: string;
  /** Author-supplied search terms, on top of the title and body text. */
  keywords: string[];
}

/** Intrinsic pixel size of an image the generator could read from disk. */
export interface ImageSize {
  width: number;
  height: number;
}

/** A full documentation page — `docs/<slug>.json`. */
export interface DocDetail extends DocSummary {
  markdown: string;
  /**
   * Sizes of the body's local images, keyed by the `src` exactly as written in
   * the Markdown, so the renderer can reserve their space before they load.
   * Only present when at least one image could be measured.
   */
  images?: Record<string, ImageSize>;
}

/**
 * One page's share of `docs/search.json` — the text the ⌘K palette searches,
 * kept out of `index.json` so the sidebar on every page does not pay for it.
 * `searchText` is the plain-text body, capped by the generator; the rest is
 * repeated from the summary so the file stands on its own.
 */
export interface DocSearchEntry {
  slug: string;
  title: string;
  section: string;
  keywords: string[];
  searchText: string;
}

/**
 * `docs/index.json` — the whole published set, section order then page order.
 * Small enough to embed in every prerendered documentation page: it carries no
 * body text (that is `docs/search.json`, see `DocSearchEntry`).
 */
export interface DocsIndex {
  generatedAt: string;
  /** Section titles in display order — empty sections are already omitted. */
  sections: string[];
  pages: DocSummary[];
}
