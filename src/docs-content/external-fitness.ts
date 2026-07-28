// Shared content for the "external fitness" mode doc block.
//
// Ground truth (Fintela's external-fitness validator and
// Fintela's fitness evaluators):
//   * Fintela POSTs the full simulation result to {endpoint}/evaluate.
//   * The trial's fitness parameters travel in the QUERY STRING; the simulation
//     travels in the BODY (the inverse of external strategies).
//   * The response MUST be a JSON object with a top-level "fitness" NUMBER —
//     NOT "score". The app copy had drifted to "score"; corrected here.
//   * equity_curve is a DICT keyed by date, not an array.

import type { ExternalModeContent } from './types';

export const externalFitness: ExternalModeContent = {
  summary:
    'Score trials with a fitness function you own and host. Fintela sends the full simulation result to your evaluate endpoint; you return a single fitness scalar.',

  full: [
    'An external fitness function is an HTTPS endpoint you own that scores each trial result. Fintela sends the full simulation output — trades, equity curve, and period metrics — and your endpoint returns a single scalar to maximize.',
    'Fintela calls POST /evaluate on your base URL with the full simulation result in the request body; the trial fitness parameters travel in the query string. Your endpoint returns a JSON object with a single fitness number.',
  ],

  whenToUse: [
    'Your scoring logic depends on proprietary data or private benchmarks',
    'You need multi-step composite scores with custom risk models',
    'You want to version-control your objective function independently',
  ],

  endpoint: 'POST {your-endpoint}/evaluate',
  endpointDescription: 'Score a completed simulation result and return a fitness scalar.',

  requestExample: `{
  "trades": [
    { "ticker_code": "AAPL", "position_side": "L", "entry_date": "2024-01-02", "exit_date": "2024-01-30", "avg_entry_price": 180.50, "avg_exit_price": 192.30 }
  ],
  "equity_curve": {
    "2024-01-02": 100420.50,
    "2024-01-03": 100612.10
  },
  "metrics": {
    "sharpe": 1.42,
    "max_drawdown": -0.08,
    "total_return": 0.12
  }
}`,

  responseExample: `{
  "fitness": 1.42
}`,

  contractNote:
    'For external fitness, the simulation result travels in the request body and the trial parameters travel in the query string — the inverse of external strategies. Keep this contract distinction in mind.',

  tip:
    'Use external fitness when your scoring depends on proprietary benchmarks, risk models, or data that must stay on your infrastructure.',

  compact:
    'Your fitness function runs on your own HTTPS endpoint. Fintela calls POST /evaluate with the full simulation result (trades, equity, metrics) and your endpoint returns a single fitness scalar.',

  inline:
    'An HTTPS endpoint you host. Fintela sends the simulation result; you return a single fitness score to maximize.',
};
