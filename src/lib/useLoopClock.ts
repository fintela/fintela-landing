import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

/** 60fps cap, with the same jitter allowance as HeroWaveField. */
const MIN_FRAME_MS = (1000 / 60) * 0.75;
/** s — the catch-up step after a hitch never skips a whole beat. */
const MAX_DT = 1 / 15;
const REDUCED = '(prefers-reduced-motion: reduce)';
const serverHeld = () => false;

export interface LoopClockOptions {
  /**
   * A media query under which the clock also starts paused, as it does under
   * reduced motion — e.g. narrow screens where a changing panel would shift
   * the page the visitor is reading. Pressing play still plays.
   */
  holdWhen?: string;
}

export interface LoopClock {
  /** Seconds into the loop. */
  t: number;
  /** The visitor's play/pause choice (reduced motion starts paused). */
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  seek: (t: number) => void;
}

/**
 * The demo's playhead: seconds into a loop of `duration` s.
 *
 * It advances on requestAnimationFrame only while `target` is on screen, the
 * tab is visible and the visitor has not paused it. Off screen it holds, so
 * scrolling back resumes mid-sentence; the first time it comes into view it
 * starts from the top. Under `prefers-reduced-motion` it starts paused on
 * `still` — the one frame that shows the flow at a glance — and only moves
 * when the visitor seeks or presses play. On the server and the first client
 * render it is `still`, so the markup hydrates without a mismatch.
 */
export function useLoopClock(
  target: RefObject<HTMLElement | null>,
  duration: number,
  still: number,
  options: LoopClockOptions = {},
): LoopClock {
  const [t, setT] = useState(still);
  // The visitor's own play/pause; until they choose, reduced motion (or `holdWhen`) decides.
  const holdQuery = options.holdWhen ? `${REDUCED}, ${options.holdWhen}` : REDUCED;
  const subscribeHeld = useCallback(
    (onChange: () => void) => {
      const query = window.matchMedia(holdQuery);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    [holdQuery],
  );
  const readHeld = useCallback(() => window.matchMedia(holdQuery).matches, [holdQuery]);
  const held = useSyncExternalStore(subscribeHeld, readHeld, serverHeld);
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !held;
  const tRef = useRef(still);
  const playingRef = useRef(playing);
  /** Whether the film has begun: a first view rewinds to the top, unless a seek already chose a spot. */
  const startedRef = useRef(false);
  const syncRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    playingRef.current = playing;
    syncRef.current();
  }, [playing]);

  useEffect(() => {
    const el = target.current;
    if (!el) return undefined;
    let inView = false;
    // A held clock opens on the still frame rather than rewinding to the top.
    if (window.matchMedia(holdQuery).matches) startedRef.current = true;
    let raf = 0;
    let last = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      const elapsed = now - last;
      if (elapsed < MIN_FRAME_MS) return;
      last = now;
      tRef.current = (tRef.current + Math.min(elapsed / 1000, MAX_DT)) % duration;
      setT(tRef.current);
    };

    const sync = () => {
      const run = inView && document.visibilityState === 'visible' && playingRef.current;
      if (run && !raf) {
        if (!startedRef.current) {
          startedRef.current = true;
          tRef.current = 0;
          setT(0);
        }
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    syncRef.current = sync;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      syncRef.current = () => undefined;
    };
  }, [target, duration, holdQuery]);

  const setPlaying = useCallback((next: boolean) => setChoice(next), []);

  const seek = useCallback(
    (next: number) => {
      startedRef.current = true;
      tRef.current = ((next % duration) + duration) % duration;
      setT(tRef.current);
    },
    [duration],
  );

  return { t, playing, setPlaying, seek };
}
