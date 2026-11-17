import { beatStarts } from '../isoKit/timeline';

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [0.5, 1.9, 0.7, 0.55, 0.75];

/** The phase each beat starts, counted from 1. */
export const BEAT = { scatter: 1, search: 2, found: 3, frame: 4, morph: 5, settled: 6 } as const;

/** Seconds on the playhead when each beat starts, indexed by `BEAT`. */
export const AT = beatStarts(BEATS);

/** Seconds until the piece has settled: the card's name lands as the last beat ends. */
export const TOTAL = AT[BEAT.settled];
