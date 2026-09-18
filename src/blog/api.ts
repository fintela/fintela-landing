import { ContentFetchError, collectionBase, isSafeSlug, loadJson, peekJson } from '../content/json';
import { absoluteUrl } from '../seo/site';
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

/**
 * The URL a file under the blog prefix is fetched from — `index.json`,
 * `<slug>.json`. It is also the key the prerender seeds data under and the key
 * the embedded `#__fintela_data` payload uses, so anything that seeds must build
 * the URL here and nowhere else.
 */
export const blogJsonUrl = (file: string): string => `${BASE}${file}`;

/**
 * A cover (or any file the generator published beside the JSON) as a URL.
 *
 * Most covers are a bare filename under `content/blog/covers/`, published
 * beside the post JSON, so they need the collection prefix. A cover
 * auto-derived from a post's own body (see `parsePost.ts`) is already a full
 * URL — `http(s)`, an absolute `/public` path, or a `data:` URI — and passing
 * it through the prefix unchanged avoids doubling it up.
 */
export const blogAssetUrl = (path: string): string =>
  /^(https?:|data:)/i.test(path) || path.startsWith('/') ? path : `${BASE}${path}`;

/**
 * The image a post is shared with, as an absolute URL, or `undefined` when it
 * has none. Prefers the 1200×630 crop the generator emits (`ogImage`) over the
 * full cover, which is what the card and the article body show.
 */
export const blogPostImageUrl = (
  post: Pick<BlogPostSummary, 'cover' | 'ogImage'>,
): string | undefined => {
  const image = post.ogImage ?? post.cover;
  return image ? absoluteUrl(blogAssetUrl(image)) : undefined;
};

/** Well-formed enough to render: the generator's contract, checked at the edge. */
const isPost = (post: unknown): post is BlogPost =>
  !!post &&
  typeof (post as BlogPost).markdown === 'string' &&
  typeof (post as BlogPost).title === 'string';

/**
 * The index if it is already in hand (seeded or fetched earlier), else
 * `undefined`. Synchronous, so a hook can start in the `ready` state.
 */
export function peekBlogIndex(): BlogPostSummary[] | undefined {
  const index = peekJson<BlogIndex>(blogJsonUrl('index.json'));
  if (index === undefined) return undefined;
  return Array.isArray(index?.posts) ? index.posts : [];
}

/** One post if it is already in hand. Same validation as `fetchBlogPost`. */
export function peekBlogPost(slug: string): BlogPost | undefined {
  if (!isSafeSlug(slug)) return undefined;
  const post = peekJson<BlogPost>(blogJsonUrl(`${slug}.json`));
  return isPost(post) ? post : undefined;
}

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

  if (!isPost(post)) throw new BlogPostNotFoundError(slug);
  return post;
}
