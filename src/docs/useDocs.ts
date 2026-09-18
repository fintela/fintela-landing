import { useEffect, useState } from 'react';
import { DocNotFoundError, fetchDoc, fetchDocsIndex, peekDoc, peekDocsIndex } from './api';
import type { DocDetail, DocsIndex } from './types';

/**
 * Fetch-on-mount hooks over the memoized `api` layer — the same pattern as
 * `src/blog/useBlog.ts`, which is all a static CDN payload needs. As there,
 * each hook starts `ready` when its JSON was seeded (by the prerender, or from
 * the payload embedded in the prerendered HTML), so server and client render
 * the same first frame.
 */

export type DocsStatus = 'loading' | 'ready' | 'error';

interface IndexState {
  status: DocsStatus;
  index: DocsIndex;
}

const EMPTY_INDEX: DocsIndex = { generatedAt: '', sections: [], pages: [] };

/**
 * The docs index. Both `/docs` and `/docs/:slug` use it — the index page to build
 * the grid, the page view for its sidebar, and both to resolve internal doc links,
 * which is why it is memoized in `api` rather than passed down.
 */
export function useDocsIndex(): IndexState {
  const [state, setState] = useState<IndexState>(() => {
    const index = peekDocsIndex();
    return index ? { status: 'ready', index } : { status: 'loading', index: EMPTY_INDEX };
  });

  useEffect(() => {
    let active = true;
    fetchDocsIndex()
      .then((index) => {
        if (active) {
          setState((prev) =>
            prev.status === 'ready' && prev.index.pages === index.pages
              ? prev
              : { status: 'ready', index },
          );
        }
      })
      .catch((err) => {
        console.warn('[docs] could not load the documentation index', err);
        if (active) setState({ status: 'error', index: EMPTY_INDEX });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

interface DocState {
  /** `notFound` is distinct from `error`: it's a 404, not a broken fetch. */
  status: DocsStatus | 'notFound';
  doc: DocDetail | null;
}

/** A settled fetch, tagged with the slug it belongs to. */
interface DocResult {
  slug: string;
  status: 'ready' | 'error' | 'notFound';
  doc: DocDetail | null;
}

export function useDoc(slug: string | undefined): DocState {
  const [result, setResult] = useState<DocResult | null>(() => {
    if (!slug) return null;
    const doc = peekDoc(slug);
    return doc ? { slug, status: 'ready', doc } : null;
  });

  useEffect(() => {
    if (!slug) return;

    let active = true;
    fetchDoc(slug)
      .then((doc) => {
        if (active) {
          setResult((prev) =>
            prev?.slug === slug && prev.status === 'ready' && prev.doc === doc
              ? prev
              : { slug, status: 'ready', doc },
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof DocNotFoundError) {
          setResult({ slug, status: 'notFound', doc: null });
          return;
        }
        console.warn(`[docs] could not load page "${slug}"`, err);
        setResult({ slug, status: 'error', doc: null });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // Derived rather than stored, so nothing calls setState from the effect body.
  // Comparing `result.slug` to the current slug also means navigating between
  // pages shows the loader instead of the previous page's body for a frame.
  if (!slug) return { status: 'notFound', doc: null };
  if (!result || result.slug !== slug) return { status: 'loading', doc: null };
  return { status: result.status, doc: result.doc };
}
