import { createContext, useContext } from 'react';

export interface SearchContextValue {
  openSearch: () => void;
}

/** Split from `SearchProvider.tsx`: that file must export only the component for Fast Refresh. */
export const SearchContext = createContext<SearchContextValue | null>(null);

export const useSearchPalette = (): SearchContextValue => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchPalette must be used within SearchProvider');
  return ctx;
};
