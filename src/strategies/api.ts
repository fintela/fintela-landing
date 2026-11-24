import { contactApiBase } from '../contact/api';
import type { AssetClass, PublishedStrategy, StrategiesSnapshot, StrategyStage } from './types';

/**
 * The wire contract of the backend's `GET /public/strategy-board`
 * (`services/backend/src/routes/portfolio_shares/board.rs` in the app repo).
 *
 * The board lists only managed portfolios whose owner explicitly listed their
 * public ("Anyone with the link") share link on the board, and only while they
 * trade with real money (`live`) or paper money (`paper`). Returns, drawdown and
 * alpha arrive as fractions (0.12 = 12%); everything is measured on the model
 * curve from `deployed_on` forward. The payload carries no link, token, ticker
 * or holding — the board cannot open a strategy's Profile.
 */
export interface BoardStrategyWire {
  id: string;
  name: string;
  author: string;
  /** `us_equity` | `crypto` | `generalized`. */
  asset_class: string;
  /** `live` (real money) | `paper` (paper trading). */
  stage: string;
  /** `YYYY-MM-DD`: day 0 of the figures below. */
  deployed_on: string;
  shared_at: string;
  data_through: string;
  forward_days: number;
  total_return: number;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  /** `null` when the asset class has no benchmark. */
  alpha: number | null;
  beta: number | null;
  /** `well_trained` | `borderline` | `overfit_risk` | `uncertain`. */
  overfit_verdict: string | null;
  /** Cumulative return since `deployed_on`, as fractions; starts at 0. */
  curve: number[];
}

export interface BoardWire {
  as_of: string | null;
  strategies: BoardStrategyWire[];
}

/** The backend wraps every success in `{ data }`. */
export interface BoardEnvelope {
  data: BoardWire;
}

export const BOARD_PATH = 'public/strategy-board';

/** Dev-only same-origin prefix that vite.config.ts proxies to the production board. */
const DEV_PROXY = '/__fintela_api';

/**
 * `<api>/`, the base `loadJson` joins `BOARD_PATH` to. `VITE_FINTELA_API` when
 * set, the production backend in a production build, and in development the
 * dev server's proxy to the production board: the backend's CORS admits only
 * the site's own origin, and the board is a public read.
 */
export const boardBase = (): string => {
  const base = contactApiBase();
  if (base) return `${base}/`;
  return `${DEV_PROXY}/`;
};

const ASSET_CLASS: Record<string, AssetClass> = {
  us_equity: 'us_equities',
  crypto: 'crypto',
  generalized: 'multi_asset',
};

/**
 * `paper` = a paper-trading operation. The older `watching` value is NOT read:
 * it also covered portfolios watched with no money behind them, which the board
 * must never show.
 */
const STAGE: Record<string, StrategyStage> = { live: 'live', paper: 'paper' };

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isDay = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const percent = (fraction: number) => Number((fraction * 100).toFixed(2));

/**
 * One wire row as the board renders it, or `null` when the row cannot be shown
 * honestly: an unknown stage, or no Sharpe ratio or drawdown yet. Alpha and
 * beta may be missing; the board prints a dash for them.
 */
export const toStrategy = (row: BoardStrategyWire): PublishedStrategy | null => {
  const stage = STAGE[row.stage];
  if (!stage || !row.id || !row.name || !isDay(row.deployed_on)) return null;
  if (!isNumber(row.total_return) || !isNumber(row.sharpe_ratio) || !isNumber(row.max_drawdown)) return null;
  return {
    id: row.id,
    name: row.name,
    author: row.author,
    assetClass: ASSET_CLASS[row.asset_class] ?? 'multi_asset',
    stage,
    publishedAt: row.deployed_on,
    totalReturn: percent(row.total_return),
    sharpe: Number(row.sharpe_ratio.toFixed(2)),
    alpha: isNumber(row.alpha) ? percent(row.alpha) : null,
    beta: isNumber(row.beta) ? Number(row.beta.toFixed(2)) : null,
    maxDrawdown: percent(-Math.abs(row.max_drawdown)),
    holdoutPassed: row.overfit_verdict === 'well_trained',
    equity: Array.isArray(row.curve) ? row.curve.filter(isNumber).map(percent) : [],
  };
};

/** `today` stands in for `as_of` on an empty board, which has no bar to date it by. */
export const toSnapshot = (envelope: BoardEnvelope, today: string): StrategiesSnapshot => {
  const board = envelope?.data;
  if (!board || !Array.isArray(board.strategies)) throw new Error('strategy board: unexpected payload');
  return {
    asOf: isDay(board.as_of) ? board.as_of : today,
    strategies: board.strategies.map(toStrategy).filter((s): s is PublishedStrategy => s !== null),
  };
};
