// Shared content for the "fitness functions" concept block.
import type { ConceptContent } from '../types';

export const fitnessFunctions: ConceptContent = {
  summary:
    'Turns a simulated period (trades, equity curve, period metrics) into a single number to maximize. Sharpe, Sortino, Calmar, or any custom composite score.',

  full: [
    'A fitness function turns a completed simulation — the trades, the equity curve, and the period metrics — into a single scalar the optimizer maximizes. Common choices: Sharpe, Sortino, Calmar, or any custom composite score.',
    'Like strategies, fitness functions can run internal (Fintela-hosted Python) or external (your endpoint scores each trial).',
  ],

  tip:
    'Build a small shared library of canonical scorers (e.g. sharpe_strict, cvar_penalized) so every study optimizes for the same objectives.',

  compact:
    'Converts a simulated period (equity curve, trades, metrics) into one number to maximize — Sharpe, Sortino, Calmar, or custom. Build a canonical library and reuse across all studies.',

  inline:
    'Converts a simulated portfolio period into a single score (e.g. Sharpe) that the optimizer maximizes.',
};
