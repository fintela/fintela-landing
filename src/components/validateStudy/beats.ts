import { beatStarts } from '../isoKit/timeline';

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [0.5, 1.5, 1.1, 0.7];

/** The phase each beat starts, counted from 1. */
export const BEAT = { frame: 1, curves: 2, stats: 3, verdict: 4, settled: 5 } as const;

/** Seconds on the playhead when each beat starts, indexed by `BEAT`. */
export const AT = beatStarts(BEATS);

/** Seconds until the piece has settled: the verdict has stamped as the last beat ends. */
export const TOTAL = AT[BEAT.settled];
