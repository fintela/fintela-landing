import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBlogIndex } from '../blog/api';
import { fetchDocsIndex, fetchDocsSearch } from '../docs/api';
import { STATIC_PAGE_ENTRIES } from './siteIndex';
import type { SearchEntry } from './types';

export interface SiteSearchIndexState {
  /** `loading` only while the docs/blog fetch is in flight — the static
   * pages are already in `entries` by the first render. */
  status: 'loading' | 'ready';
  entries: SearchEntry[];
}

const staticEntries = (t: (key: string) => string): SearchEntry[] =>
  STATIC_PAGE_ENTRIES.map((page) => ({
    id: `page:${page.id}`,
    kind: 'page',
    title: t(page.titleKey),
    section: t('pages:search.sectionPages'),
    excerpt: t(page.excerptKey),
    keywords: page.keywords,
    url: page.url,
  }));

/**
 * Everything the site-wide palette can search: the marketing pages (always
 * available, no fetch), plus docs and blog posts once their published JSON
 * lands. Mirrors `useBlogIndex`/`useDocsIndex` — fetch-on-mount over the
 * memoized `api` layer, nothing fancier.
 */
export function useSiteSearchIndex(): SiteSearchIndexState {
  const { t, i18n } = useTranslation(['pages', 'solutions']);
  const [state, setState] = useState<SiteSearchIndexState>(() => ({
    status: 'loading',
    entries: staticEntries(t),
  }));

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', entries: staticEntries(t) });

    Promise.all([
      fetchDocsIndex().catch((err) => {
        console.warn('[search] could not load the docs index', err);
        return { generatedAt: '', sections: [], pages: [] };
      }),
      fetchBlogIndex().catch((err) => {
        console.warn('[search] could not load the blog index', err);
        return [];
      }),
      fetchDocsSearch().catch(() => []),
    ]).then(([docsIndex, posts, docBodies]) => {
      if (!active) return;
      const bodyBySlug = new Map(docBodies.map((entry) => [entry.slug, entry.searchText]));

      const docEntries: SearchEntry[] = docsIndex.pages.map((page) => ({
        id: `doc:${page.slug}`,
        kind: 'doc',
        title: page.title,
        section: page.section,
        excerpt: page.excerpt,
        keywords: page.keywords,
        body: bodyBySlug.get(page.slug),
        url: `/docs/${page.slug}`,
      }));

      const blogEntries: SearchEntry[] = posts.map((post) => ({
        id: `blog:${post.slug}`,
        kind: 'blog',
        title: post.title,
        section: t('pages:search.sectionBlog'),
        excerpt: post.excerpt,
        keywords: post.tags,
        url: `/blog/${post.slug}`,
      }));

      setState({ status: 'ready', entries: [...staticEntries(t), ...docEntries, ...blogEntries] });
    });

    return () => {
      active = false;
    };
    // `t` itself is excluded: it changes identity often, but only ever
    // translates differently when the language does, which this re-runs on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  return state;
}
