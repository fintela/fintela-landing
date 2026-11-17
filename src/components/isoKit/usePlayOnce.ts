import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ComponentType } from 'react';
import { REDUCED } from './tokens';

/** How much of a piece must be showing before it starts. */
const START_RATIO = 0.35;
/** How far ahead of the screen its scene starts loading, so it is there on arrival. */
const LOAD_AHEAD = '50% 0px';

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

interface PlayOnceOptions<SceneProps> {
  /** Seconds each beat lasts. Beat 1 starts on the clock's first tick, and the last ends in the settled phase. */
  beats: readonly number[];
  /** False shows the settled state and never plays. */
  autoplay?: boolean;
  /** True forces the settled state. The visitor's own setting always applies as well. */
  reducedMotion?: boolean;
  /** Imports the scene. If that fails, the well simply stays empty: the piece is decorative. */
  load: () => Promise<{ default: ComponentType<SceneProps> }>;
}

/**
 * The flat pieces' clock. It loads the scene as the piece nears the screen, then
 * counts beats only while the piece is on screen and the tab is visible, so scrolling
 * away pauses it at the next beat and a transition already under way simply finishes.
 *
 * `Scene` is null until loaded. Render it directly, not through `lazy()`: Suspense would
 * delay its first render until after the clock has started, so it would mount past
 * phase 0 and skip the first beat, because scenes don't animate on mount.
 *
 * `phase` is 0 at rest, then the beat number, then `beats.length + 1` once settled.
 * `still` says the scene must show its settled state without animating, and `live`
 * gates ambient loops. Nothing here reads the browser during render.
 */
export function usePlayOnce<SceneProps>({
  beats,
  autoplay = true,
  reducedMotion = false,
  load,
}: PlayOnceOptions<SceneProps>) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useSyncExternalStore(subscribeReduced, readReduced, onServer);
  const tabVisible = useSyncExternalStore(subscribeVisibility, readTabVisible, onServer);

  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [phase, setPhase] = useState(0);
  /** Milliseconds left of the current beat after a pause. Null means all of it. */
  const remaining = useRef<number | null>(null);

  const settled = beats.length + 1;
  const still = !autoplay || reducedMotion || prefersReduced;

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

  const running =
    !still && Scene !== null && triggered && onScreen && tabVisible && phase < settled;

  useEffect(() => {
    if (!running) return undefined;
    // Two frames at rest first, so phase 0 has really painted and CSS transitions have
    // a state to start from. Without one, they jump straight to their end.
    if (phase === 0) {
      let frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setPhase(1));
      });
      return () => cancelAnimationFrame(frame);
    }
    const wait = remaining.current ?? beats[phase - 1] * 1000;
    const startedAt = performance.now();
    let finished = false;
    const timer = window.setTimeout(() => {
      finished = true;
      remaining.current = null;
      setPhase(phase + 1);
    }, wait);
    return () => {
      if (finished) return;
      window.clearTimeout(timer);
      remaining.current = Math.max(0, wait - (performance.now() - startedAt));
    };
  }, [running, phase, beats]);

  return {
    ref,
    phase: still ? settled : phase,
    still,
    Scene,
    live: !still && onScreen && tabVisible,
  };
}
