import { flatSelector } from '../isoKit/flat';
import { beatStarts } from '../isoKit/timeline';
import { time } from '../isoKit/tokens';

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [flatSelector.spinTime, 0.3, 0.7, 1.2];

/** The phase each beat starts, counted from 1. */
export const BEAT = { spin: 1, land: 2, morph: 3, chart: 4, settled: 5 } as const;

/** Seconds on the playhead when each beat starts, indexed by `BEAT`. */
export const AT = beatStarts(BEATS);

/** Seconds until the piece has settled: the live dot fades in at the end of the line. */
export const TOTAL = AT[BEAT.settled] + time.cardOut;
