import type { PublishedStrategy, StrategiesSnapshot } from './types';

/** A strategy enters the ranking after this many days; before that it is listed as New. */
export const MIN_RANK_DAYS = 30;
/** CAGR and the score are hidden before this many days: annualizing a few weeks misleads. */
export const MIN_ANNUAL_DAYS = 90;

/**
 * Fintela Score weights, each applied to the input's percentile among scored
 * strategies. Public by design: the page prints them.
 */
export const SCORE_WEIGHTS = { cagr: 0.4, sharpe: 0.25, maxDrawdown: 0.2, alpha: 0.15 } as const;
/** Track-record points added to the score, by days published. */
const TRACK_BONUS: ReadonlyArray<readonly [minDays: number, points: number]> = [
  [548, 3],
  [365, 2],
  [183, 1],
];

export interface RankedStrategy extends PublishedStrategy {
  daysLive: number;
  /** Annualized return in %, or null before `MIN_ANNUAL_DAYS`. */
  cagr: number | null;
  /** 0 to 100, or null before `MIN_ANNUAL_DAYS`. */
  score: number | null;
  /** Published for under `MIN_RANK_DAYS`: listed last, without a rank. */
  isNew: boolean;
}

export type SortKey = 'totalReturn' | 'cagr' | 'sharpe' | 'alpha' | 'beta' | 'maxDrawdown' | 'daysLive' | 'score';
export type SortDir = 'asc' | 'desc';

const DAY_MS = 86_400_000;
const daysBetween = (from: string, to: string) =>
  Math.max(0, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS));

/** Share of `values` below `value`, with ties counted half. 0 to 100. */
export const percentile = (value: number, values: number[]): number => {
  let below = 0;
  let equal = 0;
  for (const v of values) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  return ((below + 0.5 * equal) / values.length) * 100;
};

/** Adds days live, CAGR and the score to every strategy in the snapshot. */
export const rankStrategies = (snapshot: StrategiesSnapshot): RankedStrategy[] => {
  const base = snapshot.strategies.map((s) => {
    const daysLive = daysBetween(s.publishedAt, snapshot.asOf);
    const cagr = daysLive >= MIN_ANNUAL_DAYS ? (Math.pow(1 + s.totalReturn / 100, 365 / daysLive) - 1) * 100 : null;
    return { ...s, daysLive, cagr, isNew: daysLive < MIN_RANK_DAYS };
  });
  const scored = base.filter((s) => s.cagr !== null);
  const cagrs = scored.map((s) => s.cagr as number);
  const sharpes = scored.map((s) => s.sharpe);
  const drawdowns = scored.map((s) => s.maxDrawdown);
  const alphas = scored.flatMap((s) => (s.alpha === null ? [] : [s.alpha]));
  return base.map((s) => {
    if (s.cagr === null) return { ...s, score: null };
    const parts: Array<[weight: number, percentile: number]> = [
      [SCORE_WEIGHTS.cagr, percentile(s.cagr, cagrs)],
      [SCORE_WEIGHTS.sharpe, percentile(s.sharpe, sharpes)],
      [SCORE_WEIGHTS.maxDrawdown, percentile(s.maxDrawdown, drawdowns)],
    ];
    // No benchmark, no alpha: the other three weights are rescaled to fill its share.
    if (s.alpha !== null) parts.push([SCORE_WEIGHTS.alpha, percentile(s.alpha, alphas)]);
    const weight = parts.reduce((sum, [w]) => sum + w, 0);
    const weighted = parts.reduce((sum, [w, p]) => sum + w * p, 0) / weight;
    const bonus = TRACK_BONUS.find(([minDays]) => s.daysLive >= minDays)?.[1] ?? 0;
    return { ...s, score: Math.min(100, Math.round(weighted + bonus)) };
  });
};

/** New strategies always sort last; a missing value sorts after every present one. */
export const sortStrategies = (rows: RankedStrategy[], key: SortKey, dir: SortDir): RankedStrategy[] => {
  const sign = dir === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? 1 : -1;
    const av = a[key];
    const bv = b[key];
    if (av === null || bv === null) {
      if (av === bv) return b.totalReturn - a.totalReturn;
      return av === null ? 1 : -1;
    }
    return (av - bv) * sign || b.totalReturn - a.totalReturn;
  });
};

export interface Activity {
  published: number;
  publishedThisYear: number;
  year: string;
  live: number;
  funded: number;
  inReview: number;
}

export const summarizeActivity = (snapshot: StrategiesSnapshot): Activity => {
  const year = snapshot.asOf.slice(0, 4);
  const count = (test: (s: PublishedStrategy) => boolean) => snapshot.strategies.filter(test).length;
  return {
    published: snapshot.strategies.length,
    publishedThisYear: count((s) => s.publishedAt.startsWith(year)),
    year,
    live: count((s) => s.stage === 'live'),
    funded: count((s) => s.funding === 'funded'),
    inReview: count((s) => s.funding === 'review'),
  };
};
