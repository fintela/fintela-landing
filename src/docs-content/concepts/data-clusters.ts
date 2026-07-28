// Shared content for the "asset groups" concept block.
import type { DataClustersContent } from '../types';

export const dataClusters: DataClustersContent = {
  summary:
    'A named, reusable snapshot of market data — tickers and a date range — that every backtest references by id for perfect reproducibility.',

  full: [
    'A asset group is a named, reusable snapshot of market data — a set of tickers (stocks, ETFs, crypto, indices, forex) and a date range. Every backtest references a cluster by id, which makes results perfectly reproducible across studies.',
    'You can keep a library of clusters representing different regimes (S&P 500 pre-2020, post-2020), sectors, or asset classes — and run the same strategy against multiple clusters in a single bulk study.',
    "Beyond clusters you build, the platform exposes pre-built groupings — the Sector ETFs, country ETFs, indices like the S&P 500, sectors, and industries — that you can pick directly as a study's universe. Selecting one materializes a derived cluster automatically (kept out of your cluster library, but referenced by id like any other).",
    "A cluster's assets aren't limited to individual tickers — it can also feed on your own baskets (graduated portfolios). Each basket contributes its equity curve as an input series that the strategy scores exactly like a ticker price, so you can build meta-strategies — portfolios of portfolios that allocate capital across your own strategies.",
  ],

  // Fields that define a cluster. Rendered by the app tree today; centralized
  // here so a future landing table stays in sync.
  fields: [
    { name: 'tickers', desc: 'List of symbols to include (e.g. AAPL, MSFT)' },
    { name: 'start / end', desc: 'Date range for OHLCV data ingestion' },
    { name: 'timeframe', desc: 'Candle resolution: 1m, 5m, 1h, 1d, etc.' },
    { name: 'source', desc: 'Market data provider (Polygon, IEX, Yahoo, etc.)' },
  ],

  tip:
    'Create one cluster per asset universe and reuse it across multiple studies — changes to data (e.g. extending the date range) propagate to all linked studies automatically.',

  compact:
    'A named, reusable snapshot of market data (tickers + date range). Every backtest references a cluster by id for perfect reproducibility — build one library, reuse it across all studies.',

  inline:
    'A named, reusable snapshot of market data (tickers + date range) referenced by id so every backtest is perfectly reproducible.',
};
