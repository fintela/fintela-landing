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

/**
 * Values already in hand, keyed by the same URL. Two things fill it: a
 * successful fetch, and `seedJson` — the prerender seeds the JSON a route needs
 * before rendering it, and the browser seeds the copy embedded in that route's
 * HTML (`#__fintela_data`) before hydrating. Either way the hooks can read it
 * synchronously (`peekJson`) and render "ready" on their first pass, which is
 * what lets the server and the client produce the same markup.
 */
const resolved = new Map<string, unknown>();

/**
 * Seeds that are enough to render but not the whole object — the docs index
 * without its search text, which is most of its bytes and none of its layout.
 * `peekJson` hands them out so the first render is `ready`; `loadJson` ignores
 * them, so the effect behind the hook still fetches the real thing and the
 * page ends up with exactly what it would have had without prerendering.
 */
const partial = new Map<string, unknown>();

export interface SeedOptions {
  /** Store as a stand-in for the first render only; see `partial` above. */
  partial?: boolean;
}

/** Make `url` resolve to `value` without a request. Overwrites an earlier seed. */
export function seedJson(url: string, value: unknown, options: SeedOptions = {}): void {
  if (options.partial) partial.set(url, value);
  else resolved.set(url, value);
}

/** The value for `url` if it is already in hand, else `undefined`. Never fetches. */
export function peekJson<T>(url: string): T | undefined {
  return (resolved.has(url) ? resolved.get(url) : partial.get(url)) as T | undefined;
}

/**
 * Forget everything. For the prerenderer only, which renders many routes in one
 * process and must not let one route's data leak into the next route's markup.
 */
export function resetJsonCache(): void {
  resolved.clear();
  partial.clear();
  inFlight.clear();
}

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
  if (resolved.has(url)) return Promise.resolve(resolved.get(url) as T);

  const cached = inFlight.get(url) as Promise<T> | undefined;
  if (cached) return cached;

  // Failures are never memoized: an empty folder now may be published content
  // after the next sync, and a transient network error must stay retryable.
  const pending = request<T>(url)
    .then((value) => {
      resolved.set(url, value);
      return value;
    })
    .catch((err) => {
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
