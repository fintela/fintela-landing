import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchContext } from './searchContext';

// Cold path: nothing before the first open needs the modal's chunk or the
// `pages`/`solutions` namespaces it pulls in through `useSiteSearchIndex`.
const SiteSearchModal = lazy(() =>
  import('./SiteSearchModal').then((m) => ({ default: m.SiteSearchModal })),
);

/**
 * Mounts the site-wide ⌘K palette once for the whole app (see `App.tsx`) and
 * hands every page a way to open it (`Header`'s search button).
 *
 * Docs pages keep their own scoped ⌘K (`DocsLayout` + `DocsSearch`, over just
 * `docs/index.json`) untouched — this listener steps aside on `/docs/*` so a
 * single keypress there does not toggle two modals at once. The header's
 * search button still opens this one from a docs page like anywhere else.
 */
export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const location = useLocation();

  const openSearch = useCallback(() => {
    setEverOpened(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (location.pathname.startsWith('/docs')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setEverOpened(true);
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.pathname]);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      {everOpened && (
        <Suspense fallback={null}>
          <SiteSearchModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </SearchContext.Provider>
  );
};
