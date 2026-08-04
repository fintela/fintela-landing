import { ContentFetchError, collectionBase, isSafeSlug, loadJson } from '../content/json';
import type { BlogIndex, BlogPost, BlogPostSummary } from './types';

/**
 * Reads the static blog payload generated from `content/blog/*.md` — served from
 * `dist/blog/` in a build, and straight from disk by the dev server (see
 * vite-plugin-content.ts).
 *
 * The fetch, memo and error-classification machinery is in `src/content/json.ts`,
 * shared with the docs collection. This module is just the blog's shape of it.
 *
 * `VITE_BLOG_BASE_URL` can repoint this at another origin (e.g. a preview
 * bucket); by default it resolves against the app's own base path, so syncing the
 * `blog/` prefix is all that is needed to publish a post.
 */
const BASE = collectionBase('blog', import.meta.env.VITE_BLOG_BASE_URL);

/** A post that isn't in the published set — unpublished, renamed, or a bad URL. */
export class BlogPostNotFoundError extends Error {
  // Fields are declared and assigned explicitly: `erasableSyntaxOnly` (see
  // tsconfig.app.json) rules out constructor parameter properties.
  readonly slug: string;

  constructor(slug: string) {
    super(`No published blog post for slug "${slug}"`);
    this.name = 'BlogPostNotFoundError';
    this.slug = slug;
  }
}

/**
 * The published posts, newest first.
 *
 * A missing `index.json` is not an error: it is what an empty content directory
 * produces, and the page renders its empty state. Genuine failures — network down,
 * corrupt payload — propagate.
 */
export async function fetchBlogIndex(): Promise<BlogPostSummary[]> {
  try {
    const index = await loadJson<BlogIndex>(BASE, 'index.json');
    return Array.isArray(index?.posts) ? index.posts : [];
  } catch (err) {
    if (err instanceof ContentFetchError && err.missing) return [];
    throw err;
  }
}

/** One post by slug. Unknown or unpublished slugs raise `BlogPostNotFoundError`. */
export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  // Also keeps a hand-typed slug from becoming a path traversal against the CDN.
  if (!isSafeSlug(slug)) throw new BlogPostNotFoundError(slug);

  let post: BlogPost;
  try {
    post = await loadJson<BlogPost>(BASE, `${slug}.json`);
  } catch (err) {
    if (err instanceof ContentFetchError && err.missing) {
      throw new BlogPostNotFoundError(slug);
    }
    throw err;
  }

  if (!post || typeof post.markdown !== 'string' || typeof post.title !== 'string') {
    throw new BlogPostNotFoundError(slug);
  }
  return post;
}
