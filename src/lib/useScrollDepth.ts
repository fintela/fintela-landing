import { useEffect } from 'react';
import { track } from './track';

const MARKS = [
  [0.5, 'scroll_50'],
  [0.9, 'scroll_90'],
] as const;

/**
 * Fires `scroll_50` and `scroll_90` once each per visit to a page, the first
 * time the reader gets that far down it. Read on the page's own scroll,
 * throttled to animation frames, and detached once both have fired.
 */
export function useScrollDepth(page: string): void {
  useEffect(() => {
    const fired = new Set<string>();
    let raf = 0;
    const check = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const depth = window.scrollY / scrollable;
      for (const [mark, name] of MARKS) {
        if (depth >= mark && !fired.has(name)) {
          fired.add(name);
          track(name, { page });
        }
      }
      if (fired.size === MARKS.length) window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [page]);
}
