/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [0.5, 1.9, 0.7, 0.55, 0.75];

/** The phase each beat starts, as `usePlayOnce` counts them. */
export const BEAT = { scatter: 1, search: 2, found: 3, frame: 4, morph: 5 } as const;
