import { useEffect, useState } from 'react';
import { BlogPostNotFoundError, fetchBlogIndex, fetchBlogPost } from './api';
import type { BlogPost, BlogPostSummary } from './types';

/**
 * The landing app has no TanStack Query (that's the SPA's stack) — these are
 * plain fetch-on-mount hooks over the memoized `api` layer, which is all a
 * static CDN payload needs.
 */

export type BlogStatus = 'loading' | 'ready' | 'error';

interface IndexState {
  status: BlogStatus;
  posts: BlogPostSummary[];
}

export function useBlogIndex(): IndexState {
  const [state, setState] = useState<IndexState>({ status: 'loading', posts: [] });

  useEffect(() => {
    let active = true;
    fetchBlogIndex()
      .then((posts) => {
        if (active) setState({ status: 'ready', posts });
      })
      .catch((err) => {
        console.warn('[blog] could not load the post index', err);
        if (active) setState({ status: 'error', posts: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

interface PostState {
  /** `notFound` is distinct from `error`: it's a 404, not a broken fetch. */
  status: BlogStatus | 'notFound';
  post: BlogPost | null;
}

/** A settled fetch, tagged with the slug it belongs to. */
interface PostResult {
  slug: string;
  status: 'ready' | 'error' | 'notFound';
  post: BlogPost | null;
}

export function useBlogPost(slug: string | undefined): PostState {
  const [result, setResult] = useState<PostResult | null>(null);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    fetchBlogPost(slug)
      .then((post) => {
        if (active) setResult({ slug, status: 'ready', post });
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof BlogPostNotFoundError) {
          setResult({ slug, status: 'notFound', post: null });
          return;
        }
        console.warn(`[blog] could not load post "${slug}"`, err);
        setResult({ slug, status: 'error', post: null });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  // Derived rather than stored, so nothing calls setState from the effect body.
  // Comparing `result.slug` to the current slug also means navigating between
  // posts shows the loader instead of the previous post's body for a frame.
  if (!slug) return { status: 'notFound', post: null };
  if (!result || result.slug !== slug) return { status: 'loading', post: null };
  return { status: result.status, post: result.post };
}
