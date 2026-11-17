import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_OFFSET } from '../../lib/scrollToSection';
import { useMediaMatch } from '../../lib/useMediaMatch';
import { PIN_QUERY, PROGRESS_SPAN, PROGRESS_STEPS, REDUCED } from './tokens';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Scroll walks the stations. Plain `position: sticky` over the page's own scroll,
 * so the wheel, keys, scrollbar and touch all drive it and nothing is hijacked.
 * The track's fill follows the scroll continuously, written straight to the DOM;
 * React only hears about the active station and its stepped progress.
 */
export function useScrollStations(count: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGPolylineElement>(null);
  const pinned = useMediaMatch(PIN_QUERY);
  const reduced = useMediaMatch(REDUCED);
  const [active, setActive] = useState(0);
  const [slice, setSlice] = useState(0);

  useEffect(() => {
    if (!pinned) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const track = trackRef.current;
      const frame = frameRef.current;
      if (!track || !frame) return;
      const span = track.offsetHeight - frame.offsetHeight;
      // Stations walked so far, 0 to count: each station is one slice of the span.
      const at =
        span > 0 ? clamp01((HEADER_OFFSET - track.getBoundingClientRect().top) / span) * count : 0;
      const i = Math.min(count - 1, Math.floor(at));
      setActive(i);
      setSlice(Math.round(clamp01((at - i) / PROGRESS_SPAN) * PROGRESS_STEPS) / PROGRESS_STEPS);
      // The track reaches each plate as its station becomes active.
      const filled = count > 1 ? clamp01(at / (count - 1)) : 1;
      fillRef.current?.setAttribute('stroke-dashoffset', (1 - filled).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned, count]);

  /** Scrolls to the middle of a station's slice. */
  const pick = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const frame = frameRef.current;
      if (!track || !frame) return;
      const span = track.offsetHeight - frame.offsetHeight;
      const top =
        track.getBoundingClientRect().top +
        window.scrollY -
        HEADER_OFFSET +
        ((i + 0.5) / count) * span;
      window.scrollTo({ top, behavior: window.matchMedia(REDUCED).matches ? 'auto' : 'smooth' });
    },
    [count]
  );

  /** In the flow, and under reduced motion, every station shows finished. */
  const progressOf = (i: number) => {
    if (!pinned || reduced || i < active) return 1;
    return i > active ? 0 : slice;
  };

  return { trackRef, frameRef, fillRef, active, pick, progressOf };
}
