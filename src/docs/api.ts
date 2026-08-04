import { ContentFetchError, collectionBase, isSafeSlug, loadJson } from '../content/json';
import type { DocDetail, DocsIndex } from './types';

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

/**
 * The published pages, grouped-and-sorted by the generator.
 *
 * A missing `index.json` is not an error: it is what an empty content directory
 * produces, and the page renders its empty state. Genuine failures — network down,
 * corrupt payload — propagate.
 */
export async function fetchDocsIndex(): Promise<DocsIndex> {
  try {
    const index = await loadJson<DocsIndex>(BASE, 'index.json');
    if (!index || !Array.isArray(index.pages)) return EMPTY_INDEX;
    return {
      generatedAt: index.generatedAt ?? '',
      sections: Array.isArray(index.sections) ? index.sections : [],
      pages: index.pages,
    };
  } catch (err) {
    if (err instanceof ContentFetchError && err.missing) return EMPTY_INDEX;
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

  if (!doc || typeof doc.markdown !== 'string' || typeof doc.title !== 'string') {
    throw new DocNotFoundError(slug);
  }
  return doc;
}
