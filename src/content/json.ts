/**
 * The fetch layer every Markdown collection shares.
 *
 * `content/blog/*.md` and `content/docs/*.md` are both published by
 * `vite-plugin-content.ts` as static JSON under their own CDN prefix — served
 * from `dist/<prefix>/` in a build, and straight from disk by the dev server.
 * Nothing here knows what a post or a doc is; it only knows how to read one of
 * those prefixes safely, memoize it, and tell "not published" apart from "the
 * fetch broke".
 */

/**
 * `missing` separates "this object isn't published" — an ordinary state that maps
 * to an empty index or a 404 page — from "the fetch genuinely broke", which is
 * the only case worth showing an error state for.
 */
export class ContentFetchError extends Error {
  readonly missing: boolean;

  constructor(message: string, missing: boolean) {
    super(message);
    this.name = 'ContentFetchError';
    this.missing = missing;
  }
}

/**
 * In-memory memo, keyed by URL. Navigating index → page → back must not refetch,
 * and CloudFront already handles caching across sessions.
 */
const inFlight = new Map<string, Promise<unknown>>();

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } });

  // S3 answers 403 for a key that does not exist when listing is denied, so it
  // means the same thing as 404 here.
  if (!res.ok) {
    throw new ContentFetchError(
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
    throw new ContentFetchError(`GET ${url} did not return JSON`, looksLikeSpaFallback);
  }
}

/**
 * Resolve a collection's CDN prefix.
 *
 * `override` (a `VITE_*_BASE_URL`) can repoint a collection at another origin —
 * e.g. a preview bucket. By default it resolves against the app's own base path,
 * so syncing one prefix is all that is needed to publish.
 */
export const collectionBase = (prefix: string, override?: string): string =>
  (override || `${import.meta.env.BASE_URL}${prefix}/`).replace(/\/?$/, '/');

/** Fetch `<base><path>`, memoizing successes for the life of the page. */
export function loadJson<T>(base: string, path: string): Promise<T> {
  const url = `${base}${path}`;
  const cached = inFlight.get(url) as Promise<T> | undefined;
  if (cached) return cached;

  // Failures are never memoized: an empty folder now may be published content
  // after the next sync, and a transient network error must stay retryable.
  const pending = request<T>(url).catch((err) => {
    inFlight.delete(url);
    throw err;
  });

  inFlight.set(url, pending);
  return pending;
}

/**
 * Guards a hand-typed slug before it becomes a CDN path — without this a slug
 * like `../../secrets` would be a path traversal against the bucket.
 */
export const isSafeSlug = (slug: string): boolean => /^[a-z0-9][a-z0-9-]*$/.test(slug);
