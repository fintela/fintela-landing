/**
 * The Assembly Line's stations, in pipeline order. Keys are the
 * `workflow.nodes.*` entries of the home namespace, so the line and the
 * copy never disagree about what a step is called.
 */
export const STATIONS = ['dataClusters', 'strategies', 'studies', 'portfolios', 'connectBroker'] as const;

export type StationKey = (typeof STATIONS)[number];

/** Seconds each station holds the line before the packet moves on. */
export const STEP = 4.2;
export const LOOP = STEP * STATIONS.length;

/**
 * The floor the plates stand on, before the isometric turn: 1150 × 330 px,
 * plate centres zigzagging along it so the line climbs to the right once
 * turned — idea at the bottom left, live at the top right.
 */
export const FLOOR = { w: 1150, h: 330 } as const;
export const PLATE = 150;
export const CX = [75, 325, 575, 825, 1075] as const;
export const CY = [215, 125, 215, 125, 215] as const;

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
