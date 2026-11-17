import { useCallback, useEffect, useRef, useState } from 'react';
import { HEADER_OFFSET } from '../../lib/scrollToSection';
import { clamp01, createSceneTime } from '../isoKit/timeline';

/**
 * Where in its pinned stretch a step's piece starts, and where it has finished: a moment
 * pinned at rest first, so the line visibly lands before anything moves, and a moment
 * settled at the end, so the finished piece is seen before the page moves on.
 */
const LEAD = 0.05;
const END = 0.85;
/** Pixels of scroll per second of a piece's choreography, the same for every step. */
const PX_PER_SECOND = 160;
/**
 * Seconds the playhead takes to close about two thirds of its gap to the scroll. It turns a
 * wheel's notches into motion without letting the piece trail behind the page.
 */
const SMOOTHING = 0.12;
/** Close enough to the scroll to stop: a thousandth of a second of choreography. */
const REST = 0.001;
/** The longest frame the smoothing will step, so a stall never jumps it. */
const MAX_STEP = 0.1;

/** How much scroll a step stays pinned for, in px, for a piece `total` seconds long. */
export const pinLength = (total: number) => Math.round((total * PX_PER_SECOND) / (END - LEAD));

/** Draws `share` of a connector segment, the pen's tip showing only while it is under way. */
const draw = (segment: HTMLElement | null | undefined, share: number) => {
  if (!segment) return;
  const line = segment.firstElementChild as HTMLElement | null;
  const tip = segment.lastElementChild as HTMLElement | null;
  if (line) line.style.transform = `scaleY(${share.toFixed(4)})`;
  if (tip) {
    tip.style.top = `${(share * 100).toFixed(2)}%`;
    tip.style.opacity = share > 0 && share < 1 ? '1' : '0';
  }
};

/**
 * Scroll scrubs the steps. Each step's track is a frame's height of pinning plus its
 * piece's length in scroll; while the frame is pinned the scroll moves that piece's
 * playhead, forwards and back, and when it lets go the line to the next step draws on,
 * landing on the next piece just as that frame pins. Plain `position: sticky` over the
 * page's own scroll, so the wheel, keys, scrollbar and touch all drive it and nothing is
 * hijacked. The lines follow the scroll exactly; the playheads ease after it.
 */
export function useStepScrub(totals: readonly number[], enabled: boolean) {
  const [times] = useState(() => totals.map(() => createSceneTime(0)));
  const tracks = useRef<(HTMLElement | null)[]>([]);
  /** The first half of the line after each step, under its piece. */
  const tails = useRef<(HTMLElement | null)[]>([]);
  /** The second half, over the next step's piece. */
  const heads = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    let last = 0;
    const targets = totals.map(() => 0);

    const measure = () => {
      tracks.current.forEach((track, i) => {
        const pinned = track?.firstElementChild as HTMLElement | null | undefined;
        if (!track || !pinned) return;
        const rect = track.getBoundingClientRect();
        const height = pinned.offsetHeight;
        const span = rect.height - height;
        const progress = span > 0 ? clamp01((HEADER_OFFSET - rect.top) / span) : 0;
        targets[i] = totals[i] * clamp01((progress - LEAD) / (END - LEAD));
        // The line into this step runs from the moment the frame above lets go, with this
        // track's top at the bottom of the screen, to the moment this frame pins.
        if (i > 0) {
          const drawn = clamp01((HEADER_OFFSET + height - rect.top) / height);
          draw(tails.current[i - 1], clamp01(drawn * 2));
          draw(heads.current[i], clamp01(drawn * 2 - 1));
        }
      });
    };

    const tick = (now: number) => {
      frame = 0;
      measure();
      const step = last ? Math.min(MAX_STEP, (now - last) / 1000) : 1 / 60;
      const share = 1 - Math.exp(-step / SMOOTHING);
      let moving = false;
      times.forEach((time, i) => {
        const gap = targets[i] - time.get();
        if (Math.abs(gap) <= REST) {
          time.set(targets[i]);
          return;
        }
        time.set(time.get() + gap * share);
        moving = true;
      });
      last = moving ? now : 0;
      if (moving) frame = requestAnimationFrame(tick);
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // Arriving mid-section, from a reload or a link, shows each piece where the scroll is.
    measure();
    times.forEach((time, i) => time.set(targets[i]));

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      cancelAnimationFrame(frame);
    };
  }, [enabled, totals, times]);

  const trackRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      tracks.current[i] = el;
    },
    []
  );
  const tailRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      tails.current[i] = el;
    },
    []
  );
  const headRef = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      heads.current[i] = el;
    },
    []
  );

  return { times, trackRef, tailRef, headRef };
}
