import { useEffect } from 'react';
import { cubicBezier, easeInOut, easeOut, useMotionValue } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { clamp01 } from './timeline';
import type { SceneTime } from './timeline';
import { curve } from './tokens';

/**
 * Scrubbing for the flat pieces' scenes: every value is a function of the playhead,
 * so the scene looks the same whether a clock or the scroll put the playhead there,
 * and runs backwards as readily as forwards. Only scenes import this, so the motion
 * library still loads with them and not with the page.
 */

export type Ease = (progress: number) => number;

const bezier = (points: readonly number[]) => cubicBezier(points[0], points[1], points[2], points[3]);

/** The kit's curves (tokens.ts), and the two motion defaults the scenes relied on. */
export const ease = {
  linear: (progress: number) => progress,
  settle: bezier(curve.settle),
  pop: bezier(curve.pop),
  spin: cubicBezier(0.12, 0.72, 0.16, 1),
  inOut: easeInOut,
  out: easeOut,
} satisfies Record<string, Ease>;

/** How far through `[at, at + duration]` the playhead is, eased. */
export const span = (seconds: number, at: number, duration: number, curveFn: Ease = ease.linear) =>
  duration <= 0 ? (seconds >= at ? 1 : 0) : curveFn(clamp01((seconds - at) / duration));

/** One move: from wherever the value is at `at`, to `to`, over `duration` seconds. */
export interface Move {
  at: number;
  to: number;
  duration: number;
  ease?: Ease;
}

const play = (move: Move, from: number, seconds: number) =>
  from + (move.to - from) * span(seconds, move.at, move.duration, move.ease);

/**
 * A value's whole story as moves in time order, each starting from wherever the
 * previous one had got to when it began, so a move that cuts in early never jumps.
 */
export const track = (initial: number, moves: readonly Move[]) => (seconds: number) => {
  let from = initial;
  for (let i = 0; i < moves.length; i += 1) {
    const next = moves[i + 1];
    if (!next || seconds < next.at) return seconds < moves[i].at ? from : play(moves[i], from, seconds);
    from = play(moves[i], from, next.at);
  }
  return from;
};

/** Keyframes over `[at, at + duration]` at `times` (0 to 1), each stretch eased on its own. */
export const keyframes =
  (at: number, duration: number, values: readonly number[], times: readonly number[], curveFn: Ease) =>
  (seconds: number) => {
    const progress = clamp01((seconds - at) / duration);
    let i = 1;
    while (i < times.length - 1 && progress > times[i]) i += 1;
    const width = times[i] - times[i - 1];
    const local = width > 0 ? clamp01((progress - times[i - 1]) / width) : 1;
    return values[i - 1] + (values[i] - values[i - 1]) * curveFn(local);
  };

/** The playhead as a motion value, so the scene follows it without React rendering. */
export const useSceneTime = (source: SceneTime): MotionValue<number> => {
  const time = useMotionValue(source.get());
  useEffect(() => {
    time.set(source.get());
    return source.subscribe((seconds) => time.set(seconds));
  }, [source, time]);
  return time;
};
