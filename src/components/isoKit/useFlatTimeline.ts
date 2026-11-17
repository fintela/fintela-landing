import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ComponentType } from 'react';
import { createSceneTime } from './timeline';
import type { SceneTime } from './timeline';
import { REDUCED } from './tokens';

/** How much of a piece must be showing before its own clock starts. */
const START_RATIO = 0.35;
/** How far ahead of the screen its scene starts loading, so it is there on arrival. */
const LOAD_AHEAD = '50% 0px';
/** The longest frame the clock will step, so a stall never skips a beat. */
const MAX_STEP = 0.1;

const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const readReduced = () => window.matchMedia(REDUCED).matches;

const subscribeVisibility = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
};
const readTabVisible = () => !document.hidden;

/** The server knows neither preference nor tab, so it renders the rest state. */
const onServer = () => false;

interface FlatTimelineOptions<SceneProps> {
  /** Seconds from the first beat until the piece has settled. */
  total: number;
  /**
   * A playhead the page moves, such as a pinned section's scroll. Without one the
   * piece keeps its own clock and plays once when scrolled into view.
   */
  time?: SceneTime;
  /** False shows the settled state and never plays. */
  autoplay?: boolean;
  /** True forces the settled state. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
  /** Imports the scene. If that fails, the well simply stays empty: the piece is decorative. */
  load: () => Promise<{ default: ComponentType<SceneProps> }>;
}

/**
 * The flat pieces' playhead. It loads the scene as the piece nears the screen and
 * hands it a `SceneTime`: the page's own when one is given, else a clock that runs
 * only while the piece is on screen and the tab is visible, so scrolling away pauses
 * it mid-move and coming back resumes it there.
 *
 * `Scene` is null until loaded. `still` says the piece shows its settled state and
 * nothing more, and `live` gates ambient loops. Nothing here reads the browser
 * during render.
 */
export function useFlatTimeline<SceneProps>({
  total,
  time,
  autoplay = true,
  reducedMotion = false,
  load,
}: FlatTimelineOptions<SceneProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useSyncExternalStore(subscribeReduced, readReduced, onServer);
  const tabVisible = useSyncExternalStore(subscribeVisibility, readTabVisible, onServer);

  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [own] = useState(() => createSceneTime(0));

  const still = !autoplay || reducedMotion || prefersReduced;
  const driven = Boolean(time) && !still;

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let alive = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        load().then(
          (module) => {
            if (alive) setScene(() => module.default);
          },
          () => undefined
        );
      },
      { rootMargin: LOAD_AHEAD }
    );
    observer.observe(element);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [load]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setOnScreen(entry.isIntersecting);
        if (entry.intersectionRatio >= START_RATIO) setTriggered(true);
      },
      { threshold: [0, START_RATIO] }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (still) own.set(total);
  }, [still, own, total]);

  const running = !still && !driven && Scene !== null && triggered && onScreen && tabVisible;

  useEffect(() => {
    if (!running || own.get() >= total) return undefined;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const next = Math.min(total, own.get() + Math.min(MAX_STEP, (now - last) / 1000));
      last = now;
      own.set(next);
      if (next < total) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [running, own, total]);

  return {
    ref,
    Scene,
    time: driven && time ? time : own,
    still,
    live: !still && onScreen && tabVisible,
  };
}
