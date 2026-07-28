// Shared content for the "strategies" concept block.
import type { StrategiesContent } from '../types';

export const strategies: StrategiesContent = {
  summary:
    'The rule that decides what to buy, sell, and when. Emits a signal map of date → ticker → {position, allocation}. Runs internal (in-process) or external (your HTTPS endpoint).',

  full: [
    'A strategy is the rule that decides what to buy, sell, and when. Fintela strategies are Python functions that emit a signal map of date → ticker → { position, allocation }.',
    'Strategies can run internal (Python stored in Fintela and executed in-process by the optimizer task) or external (an HTTPS endpoint you host — your code never leaves your infrastructure). The optimizer calls your endpoint once per trial.',
    'Internal code runs against a curated, version-pinned scientific Python stack — NumPy, pandas, SciPy, scikit-learn, statsmodels, ta, and CVXPY — that you can import with no setup.',
    'Strategies declare typed parameters — the knobs a study optimizes. Three dtypes are supported: integer, float, and categorical. A categorical parameter declares a set of string choices (e.g. ["ema", "sma", "wma"]); your code receives the chosen string as the argument value. In a study, each parameter is given a numeric range, a subset of its declared choices, or a single fixed value.',
    'Strategies can also inject basket holdings — which tickers each of your baskets holds over time, with side and allocation — as read-only feature data, so aggregate exposure across your portfolios can drive the signal.',
  ],

  // Full signal-shape example (multiple dates), verbatim.
  signalExample: `signal = {
  "2024-01-02": {
    "AAPL": {"position": "L", "allocation": 0.5},
    "MSFT": {"position": "L", "allocation": 0.5},
  },
  "2024-02-01": {
    "AAPL": {"position": "S", "allocation": 0.3}
  }
}`,

  // Compact signal-shape example (single date), verbatim.
  signalCompact: `# date → ticker → {position, allocation}
signal = {
  "2024-01-02": {
    "AAPL": {"position": "L", "allocation": 0.5}
  }
}`,

  compact:
    'A rule that emits date → ticker → { position, allocation } signals. Runs in-process (internal) or via your own HTTPS endpoint (external).',

  inline:
    'A rule that emits date-indexed position signals — runs internal (in-process) or external (your HTTPS endpoint).',
};
