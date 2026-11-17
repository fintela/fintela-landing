import { PICKS } from './tickers';

/** The cursor, in seconds: one move in from the edge, then a press on each pick and a hop on. */
export const CLICK = { enter: 0.4, press: 0.1, hop: 0.18 } as const;

/** When the cursor arrives on each pick. */
export const ARRIVALS = PICKS.map((_, i) => CLICK.enter + i * (CLICK.press + CLICK.hop));

/** The cursor's whole path, ending as the last press lifts. */
export const CURSOR_TIME = ARRIVALS[ARRIVALS.length - 1] + CLICK.press;

/** Seconds each beat lasts. Kept apart so the thin component needn't load the scene to know them. */
export const BEATS = [CURSOR_TIME + 0.1, 0.5, 0.6, 0.4, 0.8];

/** The phase each beat starts, as `usePlayOnce` counts them. */
export const BEAT = { pick: 1, gather: 2, drop: 3, close: 4, preview: 5 } as const;
