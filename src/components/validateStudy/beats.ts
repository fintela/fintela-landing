/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [0.5, 1.5, 1.1, 0.7];

/** The phase each beat starts, as `usePlayOnce` counts them. */
export const BEAT = { frame: 1, curves: 2, stats: 3, verdict: 4 } as const;
