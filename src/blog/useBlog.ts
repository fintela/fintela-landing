import { useEffect, useState } from 'react';
import {
  BlogPostNotFoundError,
  fetchBlogIndex,
  fetchBlogPost,
  peekBlogIndex,
  peekBlogPost,
} from './api';
import type { BlogPost, BlogPostSummary } from './types';

/**
 * The landing app has no TanStack Query (that's the SPA's stack) — these are
 * plain fetch-on-mount hooks over the memoized `api` layer, which is all a
 * static CDN payload needs.
 *
 * Each hook starts from whatever is already in hand (`peek*`): the prerender
 * seeds a route's JSON before rendering it, and the browser seeds the copy
 * embedded in that route's HTML before hydrating, so on both sides the FIRST
 * render is `ready` and the markup matches. The effect still runs — it resolves
 * from the memo without a request — and bails out of the state update when it
 * lands on the very object the hook started with.
 */

export type BlogStatus = 'loading' | 'ready' | 'error';

interface IndexState {
  status: BlogStatus;
  posts: BlogPostSummary[];
}

export function useBlogIndex(): IndexState {
  const [state, setState] = useState<IndexState>(() => {
    const posts = peekBlogIndex();
    return posts ? { status: 'ready', posts } : { status: 'loading', posts: [] };
  });

  useEffect(() => {
    let active = true;
    fetchBlogIndex()
      .then((posts) => {
        if (active) {
          setState((prev) =>
            prev.status === 'ready' && prev.posts === posts ? prev : { status: 'ready', posts },
          );
        }
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
  const [result, setResult] = useState<PostResult | null>(() => {
    if (!slug) return null;
    const post = peekBlogPost(slug);
    return post ? { slug, status: 'ready', post } : null;
  });

  useEffect(() => {
    if (!slug) return;

    let active = true;
    fetchBlogPost(slug)
      .then((post) => {
        if (active) {
          setResult((prev) =>
            prev?.slug === slug && prev.status === 'ready' && prev.post === post
              ? prev
              : { slug, status: 'ready', post },
          );
        }
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
