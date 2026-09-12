/**
 * Shapes emitted by `vite-plugin-content.ts` into `blog/` and read back by
 * `src/blog/api.ts`.
 *
 * A contract between the generator and the app rather than a live API: the plugin
 * and these types must change together.
 */

/** One card in the `/blog` grid — metadata only, no body. */
export interface BlogPostSummary {
  slug: string;
  title: string;
  author: string;
  /** `YYYY-MM-DD`, already validated by the generator. */
  date: string;
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  /**
   * Cover image, as a path under the blog prefix (`covers/<file>`), published
   * beside the JSON by the generator. Resolve it with `blogAssetUrl`.
   */
  cover?: string;
  coverAlt?: string;
  /** Pins the post to the home page's featured slot regardless of date. */
  featured?: boolean;
}

/** A full post — `blog/<slug>.json`. */
export interface BlogPost extends BlogPostSummary {
  markdown: string;
}

/** `blog/index.json` — the whole published set, newest first. */
export interface BlogIndex {
  generatedAt: string;
  posts: BlogPostSummary[];
}
