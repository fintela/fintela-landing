// Shared content for the "studies" concept block.
import type { StudiesContent } from '../types';

export const studies: StudiesContent = {
  summary:
    'One optimization run. Binds a strategy, fitness function, asset group, and parameter search space, then explores it with a Bayesian sampler (TPE, CMA-ES, NSGA-II, …).',

  full: [
    'A study is one optimization run. It binds a strategy, a fitness function, a asset group, and a parameter search space, then explores that space using a Bayesian sampler (TPE, CMA-ES, NSGA-II, …). Created via a 5-step wizard.',
    'The universe a study runs on is either a saved asset group or a pre-built grouping picked straight from the builder — the Sector ETFs, an index like the S&P 500, or a single sector, industry, or country. Picking a grouping materializes a derived cluster behind the scenes; the study still binds a cluster_strategy_id like any other.',
    'The search space is declared per parameter. A numeric parameter takes a {minimum, maximum} range; a categorical parameter takes a {choices: [...]} subset of the choices the strategy declares. Any parameter can instead be fixed — {value: 20} or {value: "ema"} — pinning it for every trial and excluding it from the search.',
    'When every non-fixed parameter is finite — integer ranges, categorical choices, or float ranges with grid_decimals set — the search space has a countable number of combinations. The wizard shows that count, n_trials is capped to it at launch, and the optimizer enumerates the full grid without repeating configurations, so the study completes early once every combination has been evaluated.',
    "Every study chooses an optimization direction — whether the optimizer maximizes or minimizes the fitness. It defaults to the metric's natural direction (Sharpe → maximize, max-drawdown → minimize), so you rarely touch it; flip it when you deliberately want the other side. It is set at creation and frozen once the study launches.",
  ],

  // The authoritative (fuller) study-field set.
  fields: [
    { name: 'n_trials', desc: 'Total parameter combinations to evaluate' },
    { name: 'sampler', desc: 'Search algorithm (TPE / CMAES / RANDOM / QMC / NSGA2)' },
    { name: 'params', desc: 'Per-parameter search spec: a {minimum, maximum} range, a fixed {value}, or {choices: […]} for categorical parameters' },
    { name: 'grid_decimals', desc: 'Optional decimals for the float search grid (step = 10⁻ᵈ) — makes float ranges finite' },
    { name: 'train/val/oos dates', desc: 'The three evaluation windows' },
    { name: 'optimization_direction', desc: "Maximize or minimize the fitness (defaults to the metric's natural direction)" },
    { name: 'autostop_min_health', desc: 'Halt early if failure rate climbs above this' },
  ],

  compact:
    'One optimization run that binds strategy + fitness + asset group + search space. Explores n_trials parameter combinations using Bayesian samplers (TPE, CMA-ES, NSGA-II…).',

  inline:
    'One optimization run — binds strategy, fitness, asset group, and a parameter search space, then samples it with Bayesian methods.',
};
