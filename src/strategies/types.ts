/**
 * The board's view model, built from the backend's public board by
 * `api.ts`. Returns, alpha and drawdown are percentages, Sharpe and beta are ratios. Everything is measured from
 * `publishedAt` forward, never from a backtest.
 */
/** `live`: trading with real money. `paper`: trading on a paper account. */
export type StrategyStage = 'live' | 'paper';

/** `funded`: a fund finances the portfolio. `review`: under evaluation. */
export type FundingStatus = 'funded' | 'review';

export const ASSET_CLASSES = ['us_equities', 'multi_asset', 'crypto'] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

export interface PublishedStrategy {
  id: string;
  name: string;
  /** The creator's display name as their share link shows it. Never an email or an organization name. */
  author: string;
  assetClass: AssetClass;
  stage: StrategyStage;
  /** `YYYY-MM-DD`, the day forward tracking began (the app's watch day). */
  publishedAt: string;
  /** `total_return` since publication, in %. */
  totalReturn: number;
  /** `sharpe_ratio` since publication. */
  sharpe: number;
  /** `alpha` against the asset class's default benchmark, annualized %. `null` when the class has none. */
  alpha: number | null;
  /** `beta` against the same benchmark. */
  beta: number | null;
  /** `max_drawdown` since publication, in % (zero or negative). */
  maxDrawdown: number;
  /** The overfitting check's verdict on the source trial was `well_trained`. */
  holdoutPassed: boolean;
  funding?: FundingStatus;
  /** Cumulative return in %, sampled evenly from publication to `asOf`. Starts at 0. */
  equity: number[];
}

export interface StrategiesSnapshot {
  /** `YYYY-MM-DD`, the close the metrics were computed at. */
  asOf: string;
  strategies: PublishedStrategy[];
}

export type StrategiesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: StrategiesSnapshot };
