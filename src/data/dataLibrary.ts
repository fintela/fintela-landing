/**
 * The Data Library's catalog: figures and coverage windows for every dataset
 * on the In-Depth Analysis page. Language-agnostic (row counts, dates,
 * freshness) — names and descriptions are looked up from the `pages`
 * namespace at `inDepthAnalysis.library.datasets.<id>`.
 */

export type Freshness =
  | { kind: 'today' }
  | { kind: 'days'; days: number }
  | { kind: 'date'; date: string }
  | { kind: 'none' };

export interface DatasetEntry {
  id: string;
  rows: string | null;
  window: string | null;
  freshness: Freshness;
}

export interface DataCategory {
  id: string;
  datasets: DatasetEntry[];
}

// Categories pending research: market, fundamentals, corporateActions,
// eventsCalendar, alternativeData, macroRates, reference.
export const DATA_LIBRARY: DataCategory[] = [];
