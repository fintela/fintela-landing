import { flatSelector } from '../isoKit/flat';

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [flatSelector.spinTime, 0.3, 0.4, 2.4, 0.65, 0.75];

/** The phase each beat starts, as `usePlayOnce` counts them. */
export const BEAT = { spin: 1, land: 2, open: 3, write: 4, convert: 5, morph: 6 } as const;
