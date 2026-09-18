import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { gradients } from '../../theme/tokens';

/**
 * How far down the current page the reader has scrolled, as a thin bar
 * pinned above the header. Mounted once for the whole app (see `App.tsx`);
 * it re-reads scroll position on every `scroll` event, so a route change
 * that resets `window.scrollTo` (see `ScrollToTop`) also resets the bar —
 * no route-aware logic needed here.
 *
 * The fill is written straight to the DOM through a ref rather than
 * `useState`, rAF-throttled: a progress bar re-renders on every scroll
 * tick, and React state for that would mean a component re-render per
 * frame for the life of the page.
 */
export const ScrollProgressBar = () => {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      fillRef.current?.style.setProperty('transform', `scaleX(${progress})`);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (t) => t.zIndex.appBar + 1,
        pointerEvents: 'none',
        overflow: 'hidden',
        '@media print': { display: 'none' },
      }}
    >
      <Box
        ref={fillRef}
        sx={{
          height: '100%',
          width: '100%',
          transformOrigin: '0 0',
          transform: 'scaleX(0)',
          background: gradients.brandHorizontal,
          transition: 'transform 0.12s linear',
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      />
    </Box>
  );
};
