// Shared content for the quickstart / getting-started doc block.
//
// SINGLE SOURCE OF TRUTH. Like authentication, the two forked copies of this
// block had drifted (different step orderings, and a step 5 that told different
// stories) until corrected. The canonical version below is the read-only-aware
// one: every resource is built in the app, and the developer API is read-only —
// it exists to pull the results back out (poll /studies/progress, etc.).

import type { QuickstartContent } from './types';

export const quickstart: QuickstartContent = {
  summary:
    'Launch your first optimization study end-to-end in under 10 minutes. Four steps in the app, then pull the results from the read-only API.',

  intro:
    'Get from zero to a running optimization study in under 10 minutes. Studies, strategies and clusters are built in the Fintela app; the developer API is read-only and exists to pull the results back out.',

  steps: [
    {
      num: 1,
      title: 'Create a asset group',
      body: 'Define your universe of tickers and the historical date range to backtest against. A cluster is reusable — create it once and reference it in every future study. Or skip cluster-building entirely: in the study builder, pick a pre-built grouping (the Sector ETFs, an index, a sector or a country) and the universe is ready as-is.',
      navPath: ['Data', 'Markets', '+ New Cluster'],
    },
    {
      num: 2,
      title: 'Create a strategy',
      body: 'Register your signal generator. For an internal strategy, write the Python function that emits the signal map. For external, provide your /simulate endpoint URL.',
      navPath: ['Registry', 'Strategies', '+ New Strategy'],
    },
    {
      num: 3,
      title: 'Create a fitness function',
      body: 'Define how to score each simulation result. Start with a built-in scorer like sharpe_like or provide your own.',
      navPath: ['Registry', 'Fitness', '+ New Fitness'],
    },
    {
      num: 4,
      title: 'Launch a study',
      body: 'The study wizard binds the three components above and takes your parameter search space, sampler and trial budget. Click Create study and the optimizer picks it up immediately.',
      navPath: ['Registry', 'Studies', '+ New Study'],
    },
    {
      num: 5,
      title: 'Monitor progress from the API',
      body: 'Watch trials complete on the study detail page, or poll the read-only developer API. Progress is a single GET that takes a comma-separated list of study ids and returns a completion fraction per study: GET /studies/progress?study_ids=42 → { "data": { "42": 0.64 } }. Related reads: /studies/status, /studies/health and /studies/errors. Finished trials are listed by GET /v2/studies/{study_name}/trials/{trial_number}.',
    },
  ],

  tip:
    "Start small: set n_trials to 20 for your first study so you get results in minutes. Scale up once you've validated the setup.",

  compact:
    '5 steps: (1) create a asset group, (2) create a strategy, (3) create a fitness function, (4) launch a study binding all three in the app, (5) poll /studies/progress for results. First results in under 10 minutes.',

  inline:
    '5 steps — asset group → strategy → fitness function → study → monitor. First results in under 10 minutes.',
};
