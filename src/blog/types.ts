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
  /**
   * `YYYY-MM-DD` of the last substantive edit, when the author recorded one
   * (`updated:` in frontmatter). Feeds `dateModified` and the sitemap; absent,
   * `date` stands in for both.
   */
  updated?: string;
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  /**
   * Cover image, as a path under the blog prefix (`covers/<file>`), published
   * beside the JSON by the generator. Resolve it with `blogAssetUrl`.
   */
  cover?: string;
  coverAlt?: string;
  /**
   * Intrinsic pixel size of the cover, when the generator could read the file.
   * Lets a card reserve the image's space before it loads.
   */
  coverWidth?: number;
  coverHeight?: number;
  /**
   * The 1200×630 social crop of the cover (`covers/og/<slug>.jpg`), when the
   * generator produced one. Same prefix rules as `cover`.
   */
  ogImage?: string;
  /** Repo-relative path of the source file, e.g. `content/blog/my-post.md`. */
  sourcePath?: string;
  /** Pins the post to the home page's featured slot regardless of date. */
  featured?: boolean;
}

/** A full post — `blog/<slug>.json`. */
export interface BlogPost extends BlogPostSummary {
  markdown: string;
  /**
   * Sizes of the body's local images, keyed by the `src` exactly as written in
   * the Markdown (`covers/<file>`), so the article can reserve their space
   * before they load. Only present when at least one image could be measured.
   */
  images?: Record<string, { width: number; height: number }>;
}

/** `blog/index.json` — the whole published set, newest first. */
export interface BlogIndex {
  generatedAt: string;
  posts: BlogPostSummary[];
}
