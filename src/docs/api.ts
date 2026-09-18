import { ContentFetchError, collectionBase, isSafeSlug, loadJson, peekJson } from '../content/json';
import type { DocDetail, DocSearchEntry, DocsIndex } from './types';

/**
 * Reads the static documentation payload generated from `content/docs/**.md` —
 * served from `dist/docs/` in a build, and straight from disk by the dev server
 * (see vite-plugin-content.ts).
 *
 * Identical in structure to `src/blog/api.ts` over the same shared fetch layer.
 * The `docs/` prefix holding JSON alongside the `/docs/:slug` routes is not a
 * clash: `docs/index.json` and `docs/<slug>.json` are real objects, and every
 * other `/docs/...` path falls through CloudFront's SPA rewrite to the router —
 * exactly how `/blog` has always worked.
 *
 * `VITE_DOCS_BASE_URL` can repoint this at another origin (e.g. a preview bucket).
 */
const BASE = collectionBase('docs', import.meta.env.VITE_DOCS_BASE_URL);

/**
 * The URL a file under the docs prefix is fetched from — `index.json`,
 * `<slug>.json`. Also the key data is seeded under (see `blogJsonUrl`).
 */
export const docJsonUrl = (file: string): string => `${BASE}${file}`;

/** A page that isn't in the published set — a draft, renamed, or a bad URL. */
export class DocNotFoundError extends Error {
  // Fields are declared and assigned explicitly: `erasableSyntaxOnly` (see
  // tsconfig.app.json) rules out constructor parameter properties.
  readonly slug: string;

  constructor(slug: string) {
    super(`No published documentation page for slug "${slug}"`);
    this.name = 'DocNotFoundError';
    this.slug = slug;
  }
}

const EMPTY_INDEX: DocsIndex = { generatedAt: '', sections: [], pages: [] };

/** The generator's contract, checked at the edge: what makes a payload an index. */
const normalizeIndex = (index: DocsIndex | undefined): DocsIndex => {
  if (!index || !Array.isArray(index.pages)) return EMPTY_INDEX;
  return {
    generatedAt: index.generatedAt ?? '',
    sections: Array.isArray(index.sections) ? index.sections : [],
    pages: index.pages,
  };
};

/** Well-formed enough to render. */
const isDoc = (doc: unknown): doc is DocDetail =>
  !!doc &&
  typeof (doc as DocDetail).markdown === 'string' &&
  typeof (doc as DocDetail).title === 'string';

/**
 * The index if it is already in hand (seeded or fetched earlier), else
 * `undefined`. Synchronous, so a hook can start in the `ready` state.
 */
export function peekDocsIndex(): DocsIndex | undefined {
  const index = peekJson<DocsIndex>(docJsonUrl('index.json'));
  return index === undefined ? undefined : normalizeIndex(index);
}

/** One page if it is already in hand. Same validation as `fetchDoc`. */
export function peekDoc(slug: string): DocDetail | undefined {
  if (!isSafeSlug(slug)) return undefined;
  const doc = peekJson<DocDetail>(docJsonUrl(`${slug}.json`));
  return isDoc(doc) ? doc : undefined;
}

/**
 * The published pages, grouped-and-sorted by the generator.
 *
 * A missing `index.json` is not an error: it is what an empty content directory
 * produces, and the page renders its empty state. Genuine failures — network down,
 * corrupt payload — propagate.
 */
export async function fetchDocsIndex(): Promise<DocsIndex> {
  try {
    return normalizeIndex(await loadJson<DocsIndex>(BASE, 'index.json'));
  } catch (err) {
    if (err instanceof ContentFetchError && err.missing) return EMPTY_INDEX;
    throw err;
  }
}

/**
 * The ⌘K palette's body-text index (`docs/search.json`), fetched only when the
 * palette first opens and memoized by `loadJson` for the life of the page. It
 * is the part of the old index that was too big to ship with every page: a
 * missing file simply means search matches titles and excerpts only.
 */
export async function fetchDocsSearch(): Promise<DocSearchEntry[]> {
  try {
    const entries = await loadJson<DocSearchEntry[]>(BASE, 'search.json');
    return Array.isArray(entries) ? entries : [];
  } catch (err) {
    if (err instanceof ContentFetchError && err.missing) return [];
    throw err;
  }
}

/**
 * One page by slug. Unknown or unpublished slugs raise `DocNotFoundError`.
 *
 * A `published: false` page emits no JSON at all, so a direct URL to a draft
 * lands here as a 404 — the draft is not merely hidden from the index, it is
 * absent from the deployed artifact.
 */
export async function fetchDoc(slug: string): Promise<DocDetail> {
  // Also keeps a hand-typed slug from becoming a path traversal against the CDN.
  if (!isSafeSlug(slug)) throw new DocNotFoundError(slug);

  let doc: DocDetail;
  try {
    doc = await loadJson<DocDetail>(BASE, `${slug}.json`);
  } catch (err) {
    if (err instanceof ContentFetchError && err.missing) throw new DocNotFoundError(slug);
    throw err;
  }

  if (!isDoc(doc)) throw new DocNotFoundError(slug);
  return doc;
}
