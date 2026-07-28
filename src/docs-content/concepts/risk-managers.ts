// Shared content for the "risk managers" concept block.
//
// LANDING-ONLY today: there is no the Fintela app's own documentation tree twin. Kept here as a single
// copy so it can be shared the moment the app tree adds a risk-managers block.
import type { ConceptContent } from '../types';

export const riskManagers: ConceptContent = {
  summary:
    'A governance layer that runs before the strategy on every step of a backtest, acting on the portfolio from the previous step — close positions, halt rebalancing, cap exposure.',

  full: [
    "A risk manager is a governance layer that runs on every step of a backtest, before the strategy rebalances, and applies protective actions on the portfolio as it stood after the previous step — closing positions, pausing rebalancing, or trimming holdings that breach a limit. It runs alongside the strategy, not inside it: halts can suppress the strategy's rebalance on the same step, and reactive protections (stop loss, trailing stop, take profit) close existing positions before the strategy acts. Allocation caps (position, sector, country, gross-exposure, cash floor) trim holdings that already exceed the limit; they do not pre-screen new orders, so a fresh rebalance that breaches a cap is corrected on the next step.",
    'Risk managers come in four flavors so you can match the effort to the need: built-in rules from the catalog (stop loss, trailing stop, take profit, max drawdown, exposure and position caps, time-window halts), rule-based risk managers you compose visually with no code, custom risk managers you write in Python, and external risk managers you host behind your own endpoint. Each one is versioned, can be shared, and can be tested in a sandbox.',
  ],

  compact:
    'A governance layer that runs before the strategy each step and acts on the portfolio from the previous step — stop loss, drawdown halts, exposure caps. Built-in, rule-based (no code), custom Python, or external.',

  inline:
    'A governance layer that runs before the strategy each step and acts on the portfolio from the previous step.',
};
