import { flatSelector } from '../isoKit/flat';
import { beatStarts } from '../isoKit/timeline';

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [flatSelector.spinTime, 0.3, 0.4, 2.4, 0.65, 0.75];

/** The phase each beat starts, counted from 1. */
export const BEAT = { spin: 1, land: 2, open: 3, write: 4, convert: 5, morph: 6, settled: 7 } as const;

/** Seconds on the playhead when each beat starts, indexed by `BEAT`. */
export const AT = beatStarts(BEATS);

/** Seconds until the piece has settled: the card's name lands as the last beat ends. */
export const TOTAL = AT[BEAT.settled];
