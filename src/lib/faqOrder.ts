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
] as const;

export type FaqKey = (typeof FAQ_KEYS)[number];

/** What each seat asks first; the rest follow in the catalogue's order. */
const LEAD_BY_AUDIENCE: Record<Audience, FaqKey[]> = {
  funds: ['security', 'poweredBy', 'liveTrading', 'seedExport'],
  independents: ['python', 'optimization', 'speed', 'liveTrading'],
  teams: ['security', 'seedExport', 'vsBacktesting', 'poweredBy'],
};

export const orderFaq = (audience: Audience): FaqKey[] => {
  const lead = LEAD_BY_AUDIENCE[audience];
  return [...lead, ...FAQ_KEYS.filter((k) => !lead.includes(k))];
};
