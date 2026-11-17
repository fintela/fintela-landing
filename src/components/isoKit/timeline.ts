/**
 * The flat pieces' timeline, without the motion library, so a thin component can
 * know a piece's length and hold its playhead before the scene has loaded.
 *
 * A piece is a pure function of one number: seconds into its choreography. Who moves
 * that number is up to the page. A clock plays it once on screen; a pinned section
 * scrubs it with the scroll, forwards and back.
 */

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * When each beat starts, in seconds, indexed by phase as the pieces count them:
 * beat 1 starts at 0, beat k at the sum of the beats before it, and index
 * `beats.length + 1` is when the last one ends.
 */
export const beatStarts = (beats: readonly number[]) =>
  beats.reduce<number[]>((at, beat) => [...at, at[at.length - 1] + beat], [0, 0]);

/** A piece's playhead: seconds into its timeline, shared between whoever moves it and the scene. */
export interface SceneTime {
  get(): number;
  set(seconds: number): void;
  subscribe(listener: (seconds: number) => void): () => void;
}

export const createSceneTime = (initial = 0): SceneTime => {
  let value = initial;
  const listeners = new Set<(seconds: number) => void>();
  return {
    get: () => value,
    set: (seconds) => {
      if (seconds === value) return;
      value = seconds;
      listeners.forEach((listener) => listener(seconds));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
