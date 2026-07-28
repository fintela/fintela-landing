// Shared content for the "portfolios" concept block.
//
// Canonical definition follows the ground-truth model (portfolios ARE trials —
// a completed backtest result for one parameter combination; promoting one
// copies it into a managed portfolio). The app copy had drifted toward
// describing a portfolio as a live/paper-traded instance; corrected here.
import type { PortfoliosContent } from '../types';

export const portfolios: PortfoliosContent = {
  summary:
    'A complete backtest result for one parameter combination — equity curve, every trade, holdings at any point, and 20+ performance metrics across all stages.',

  full: [
    'Every successful trial produces a portfolio — a complete backtest result for one parameter combination, including the equity curve, every trade, holdings at any point in time, and 20+ performance metrics across all stages.',
    'The portfolio is the artifact you compare against, share with stakeholders, and ultimately promote to live trading. It also records the configuration it was produced with — including any risk managers that were attached — and its lineage: if a portfolio was derived from another one, it keeps a link back to its source, so you can trace and compare a family of related portfolios.',
    'From the dashboard you can also run an invert what-if: flip every position Long↔Short and instantly re-simulate the portfolio to see its contrarian equity curve and metrics overlaid on the original. It is a transient preview — nothing is saved and live trading is untouched.',
  ],

  // Example performance metrics a portfolio carries. Rendered by the app tree.
  metrics: [
    { name: 'sharpe_ratio', desc: 'Risk-adjusted return (annualized)' },
    { name: 'max_drawdown', desc: 'Largest peak-to-trough decline' },
    { name: 'cagr', desc: 'Compound annual growth rate' },
    { name: 'calmar_ratio', desc: 'CAGR divided by max drawdown' },
    { name: 'win_rate', desc: 'Fraction of profitable trades' },
  ],

  tip:
    'Portfolios are promoted from the best trial of a completed study. The winning parameter set is frozen and used for all subsequent live signals.',

  compact:
    'The backtest result for one parameter set: equity curve, every trade, holdings history, and 20+ metrics across train / validation / OOS windows. The artifact you promote to live trading.',

  inline:
    'A complete backtest result (equity curve, trades, metrics) produced by each successful trial.',
};
