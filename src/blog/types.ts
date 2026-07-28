/**
 * Shapes emitted by `vite-plugin-blog.ts` into `blog/` and read back by
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
