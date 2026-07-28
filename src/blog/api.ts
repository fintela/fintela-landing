import type { BlogIndex, BlogPost, BlogPostSummary } from './types';

/**
 * Reads the static blog payload generated from `landing/content/blog/*.md` — served
 * from `dist/blog/` in a build, and straight from disk by the dev server (see
 * vite-plugin-blog.ts).
 *
 * `VITE_BLOG_BASE_URL` can repoint this at another origin (e.g. a preview bucket);
 * by default it resolves against the app's own base path, so syncing the `blog/`
 * prefix is all that is needed to publish a post.
 */
const BASE = (
  import.meta.env.VITE_BLOG_BASE_URL || `${import.meta.env.BASE_URL}blog/`
).replace(/\/?$/, '/');

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
 * `missing` separates "this object isn't published" — an ordinary state that maps
 * to an empty grid or a 404 page — from "the fetch genuinely broke", which is the
 * only case worth showing an error state for.
 */
class BlogFetchError extends Error {
  readonly missing: boolean;

  constructor(message: string, missing: boolean) {
    super(message);
    this.name = 'BlogFetchError';
    this.missing = missing;
  }
}

/**
 * In-memory memo, keyed by URL. Navigating grid → post → back must not refetch,
 * and CloudFront already handles caching across sessions.
 */
const inFlight = new Map<string, Promise<unknown>>();

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });

  // S3 answers 403 for a key that does not exist when listing is denied, so it
  // means the same thing as 404 here.
  if (!res.ok) {
    throw new BlogFetchError(
      `GET ${url} failed with ${res.status}`,
      res.status === 403 || res.status === 404,
    );
  }

  const body = await res.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    // CloudFront rewrites unknown paths to `index.html` with a 200 so the SPA can
    // route them. For a JSON fetch that arrives as an HTML document, which means
    // the object isn't there — not that the payload is corrupt.
    const looksLikeSpaFallback = /^\s*<(!doctype|html)/i.test(body);
    throw new BlogFetchError(
      `GET ${url} did not return JSON`,
      looksLikeSpaFallback,
    );
  }
}

function loadJson<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const cached = inFlight.get(url) as Promise<T> | undefined;
  if (cached) return cached;

  // Failures are never memoized: an empty folder now may be a published post
  // after the next sync, and a transient network error must stay retryable.
  const pending = request<T>(url).catch((err) => {
    inFlight.delete(url);
    throw err;
  });

  inFlight.set(url, pending);
  return pending;
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
    const index = await loadJson<BlogIndex>('index.json');
    return Array.isArray(index?.posts) ? index.posts : [];
  } catch (err) {
    if (err instanceof BlogFetchError && err.missing) return [];
    throw err;
  }
}

/** One post by slug. Unknown or unpublished slugs raise `BlogPostNotFoundError`. */
export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  // Also keeps a hand-typed slug from becoming a path traversal against the CDN.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new BlogPostNotFoundError(slug);

  let post: BlogPost;
  try {
    post = await loadJson<BlogPost>(`${slug}.json`);
  } catch (err) {
    if (err instanceof BlogFetchError && err.missing) throw new BlogPostNotFoundError(slug);
    throw err;
  }

  if (!post || typeof post.markdown !== 'string' || typeof post.title !== 'string') {
    throw new BlogPostNotFoundError(slug);
  }
  return post;
}
