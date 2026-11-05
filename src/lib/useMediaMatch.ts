import { useCallback, useSyncExternalStore } from 'react';

/**
 * A media query as render state. False on the server and through hydration
 * (the prerendered page is the narrow layout), then the real value on the
 * client's first render after it, with no hydration mismatch.
 */
export const useMediaMatch = (query: string): boolean =>
  useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        const list = window.matchMedia(query);
        list.addEventListener('change', onChange);
        return () => list.removeEventListener('change', onChange);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  );
