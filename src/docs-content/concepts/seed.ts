// Shared content for the "seed" concept block.
//
// LANDING-ONLY today: there is no the Fintela app's own documentation tree twin. Kept here as a single
// copy so it can be shared the moment the app tree adds a seed block.
import type { SeedContent } from '../types';

export const seed: SeedContent = {
  summary:
    'The daily rebalancing signal the engine consumes to build a backtest — date → ticker → {position, allocation}. The reproducible record of exactly what each trial held. Viewable and downloadable (JSON/CSV) per trial, basket, and sandbox run.',

  full: [
    'A seed is the daily rebalancing signal the engine consumed to build a backtest — the exact positions and weights a strategy produced on each date. It is the same shape a strategy emits.',
    "Every optimization trial stores its seed (so does each managed portfolio, extended daily). A basket has no seed of its own — it exposes each member's seed plus a blended combined signal (members weighted by the basket's allocation on the rebalance grid).",
    'You can inspect and download the seed — as JSON (the exact engine input) or CSV (one row per date/ticker) — from the trial detail, the basket detail, and a sandbox run\'s results. It is the reproducible artifact for auditing a backtest or replaying it downstream.',
  ],

  // Full seed-shape example (multiple dates), verbatim.
  seedExample: `seed = {
  "2024-01-02": {
    "AAPL": {"position": "L", "allocation": 0.5},
    "MSFT": {"position": "L", "allocation": 0.5}
  },
  "2024-02-01": {
    "AAPL": {"position": "S", "allocation": 0.3}
  }
}`,

  // Compact seed-shape example (single date), verbatim.
  seedCompact: `# date → ticker → {position, allocation}
seed = {
  "2024-01-02": {
    "AAPL": {"position": "L", "allocation": 0.5}
  }
}`,

  compact:
    'The daily rebalancing signal a backtest consumed — date → ticker → { position, allocation }. Downloadable as JSON/CSV per trial, basket, and sandbox.',

  inline:
    'the daily rebalancing signal a backtest consumed (date → ticker → position/allocation), downloadable as JSON/CSV',
};
