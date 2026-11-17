import { flatSelector } from '../isoKit/flat';

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [flatSelector.spinTime, 0.3, 0.7, 1.2];

/** The phase each beat starts, as `usePlayOnce` counts them. */
export const BEAT = { spin: 1, land: 2, morph: 3, chart: 4 } as const;
