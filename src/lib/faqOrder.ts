import type { Audience } from './audience';

export const FAQ_KEYS = [
  'assetClasses',
  'vsBacktesting',
  'python',
  'optimization',
  'seedExport',
  'liveTrading',
  'security',
  'poweredBy',
  'speed',
  'overfitting',
] as const;

export type FaqKey = (typeof FAQ_KEYS)[number];

/** What each seat asks first; the rest follow in the catalogue's order. */
const LEAD_BY_AUDIENCE: Record<Audience, FaqKey[]> = {
  funds: ['security', 'poweredBy', 'liveTrading', 'seedExport'],
  independents: ['python', 'optimization', 'speed', 'liveTrading'],
  teams: ['security', 'seedExport', 'vsBacktesting', 'poweredBy'],
  advisors: ['python', 'poweredBy', 'security', 'liveTrading'],
};

export const orderFaq = (audience: Audience): FaqKey[] => {
  const lead = LEAD_BY_AUDIENCE[audience];
  return [...lead, ...FAQ_KEYS.filter((k) => !lead.includes(k))];
};

/**
 * The five questions the home page asks, in order. A fixed list, not a
 * reordering of the catalogue: the rest (asset classes, signal export, live
 * trading, speed) are answered on the solution pages, which pick their own
 * from `FAQ_KEYS`.
 */
export const HOME_FAQ_KEYS: readonly FaqKey[] = ['python', 'vsBacktesting', 'overfitting', 'security', 'poweredBy'];
