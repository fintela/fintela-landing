/**
 * The Assembly Line's stations, in pipeline order. Keys are the
 * `workflow.nodes.*` entries of the home namespace, so the line and the
 * copy never disagree about what a step is called.
 */
export const STATIONS = ['dataClusters', 'strategies', 'studies', 'portfolios', 'connectBroker'] as const;

export type StationKey = (typeof STATIONS)[number];

/** A plate's side on the floor, before the isometric turn. */
export const PLATE = 150;

/**
 * The camera: the floor turns −35° about Z, then tips 55° about X, with no
 * perspective — the `rotateX(55deg) rotateZ(-35deg)` the line is drawn with.
 * A floor point (x, y) lands on screen at (C·x + S·y, K·(C·y − S·x)).
 */
const C = Math.cos((35 * Math.PI) / 180);
const S = Math.sin((35 * Math.PI) / 180);
const K = Math.cos((55 * Math.PI) / 180);

/** Half a plate's drawn width and height once turned (≈ 104 × 60 px). */
const PLATE_HALF_W = ((C + S) * PLATE) / 2;
const PLATE_HALF_H = (K * (C + S) * PLATE) / 2;

/** Screen px from one station down to the next, and how far the line swings either side of its axis. */
const DROP = 124;
const SWING = 52;
/** Room above the first plate for the pieces that lift off it, and under the last for its shadow. */
const HEAD = 130;
const FOOT = PLATE_HALF_H + 40;

/**
 * The line's natural box (px, before scaling): the stations run down the
 * screen in a gentle zigzag, idea at the top and live at the bottom, so
 * scrolling down walks the pipeline in order.
 */
export const LINE = { w: 2 * (SWING + PLATE_HALF_W), h: HEAD + (STATIONS.length - 1) * DROP + FOOT } as const;

/** Where the floor's origin lands on screen: the line's axis, level with the first plate. */
export const ORIGIN = { x: SWING + PLATE_HALF_W, y: HEAD } as const;

/** Station i's plate centre on screen, in the line's natural box. */
export const screenAt = (i: number) => ({ x: ORIGIN.x + (i % 2 ? SWING : -SWING), y: HEAD + i * DROP });

/**
 * The floor point the camera draws at a screen offset (dx, dy) from the
 * floor's origin: the camera undone (un-tip, then turn back).
 */
export const floorAt = (dx: number, dy: number) => ({ x: C * dx - S * (dy / K), y: S * dx + C * (dy / K) });

/** The eleven SPDR sector funds of the "Sector ETFs (US)" collection, as the app seeds them. */
export const SECTOR_ETFS = [
  { t: 'XLK', s: 'Technology', c: '#4a8cc9' },
  { t: 'XLV', s: 'Health Care', c: '#d8a72e' },
  { t: 'XLF', s: 'Financial', c: '#b8323f' },
  { t: 'XLY', s: 'Cons. Discretionary', c: '#1f9e8f' },
  { t: 'XLP', s: 'Cons. Staples', c: '#6a5fb0' },
  { t: 'XLE', s: 'Energy', c: '#5d9131' },
  { t: 'XLI', s: 'Industrial', c: '#a85c9e' },
  { t: 'XLB', s: 'Materials', c: '#9a5a1a' },
  { t: 'XLU', s: 'Utilities', c: '#2F6395' },
  { t: 'XLRE', s: 'Real Estate', c: '#e8b923' },
  { t: 'XLC', s: 'Communication', c: '#f1353c' },
] as const;
