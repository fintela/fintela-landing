/**
 * Single source of truth for the docs navigation.
 *
 * - `path` is appended to `/documentation` (use empty string for the index)
 * - `keywords` and `summary` feed the search index
 *
 * Mark a page `comingSoon: true` to render it in the sidebar with a chip
 * but treat it as a non-routable placeholder.
 */

export interface DocPage {
  /** Stable id used for breadcrumbs, anchors, and the search index. */
  id: string;
  /** Title shown in the sidebar and search results. */
  title: string;
  /** URL path appended to /documentation (no leading slash; empty for index). */
  path: string;
  /** Short one-line summary used in search and on the docs home. */
  summary: string;
  /** Extra keywords that should match in search. */
  keywords?: string[];
  /** Mark as not yet routable. */
  comingSoon?: boolean;
}

export interface DocGroup {
  id: string;
  title: string;
  pages: DocPage[];
}

export const docNav: DocGroup[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    pages: [
      {
        id: 'overview',
        title: 'Overview',
        path: '',
        summary: 'What Fintela is, how the platform fits together, and where to go next.',
        keywords: ['intro', 'what is fintela', 'home'],
      },
      {
        id: 'platform',
        title: 'Platform tour',
        path: 'platform',
        summary: 'A visual map of the Fintela UI — sections, navigation, and where every feature lives.',
        keywords: ['ui', 'navigation', 'tour', 'interface', 'registry', 'analytics', 'agents'],
      },
      {
        id: 'quickstart',
        title: 'Quickstart',
        path: 'quickstart',
        summary: 'Run your first optimization study end-to-end — starting from the UI.',
        keywords: ['first study', 'getting started', 'tutorial', 'hello world'],
      },
      {
        id: 'concepts',
        title: 'Core concepts',
        path: 'concepts',
        summary: 'Strategies, fitness functions, studies, trials, portfolios — the vocabulary you need.',
        keywords: ['strategy', 'fitness', 'study', 'trial', 'portfolio', 'asset group'],
      },
    ],
  },
  {
    id: 'workflows',
    title: 'Workflows',
    pages: [
      {
        id: 'workflow-strategies',
        title: 'Managing strategies',
        path: 'workflows/strategies',
        summary: 'Create, edit, and test internal and external strategies in the Registry.',
        keywords: ['create strategy', 'edit strategy', 'python editor', 'parameters', 'sandbox', 'validate'],
      },
      {
        id: 'workflow-risk-managers',
        title: 'Managing risk managers',
        path: 'workflows/risk-managers',
        summary: 'Create, version, share, and test risk managers — the governance layer that protects a portfolio during a backtest.',
        keywords: [
          'risk manager',
          'risk management',
          'stop loss',
          'trailing stop',
          'drawdown',
          'exposure cap',
          'position cap',
          'time-window halt',
          'rule-based',
          'versioning',
          'public catalog',
          'execution log',
        ],
      },
      {
        id: 'workflow-studies',
        title: 'Running optimizations',
        path: 'workflows/studies',
        summary: 'Configure and launch a parameter optimization study from the UI step by step.',
        keywords: ['create study', 'optimization', 'study wizard', 'sampler', 'n_trials', 'parameter bounds'],
      },
      {
        id: 'workflow-results',
        title: 'Analyzing results',
        path: 'workflows/results',
        summary: 'Browse trial rankings, compare portfolios, inspect equity curves and trades.',
        keywords: ['results', 'portfolios', 'trials', 'equity curve', 'sharpe', 'analytics', 'compare'],
      },
      {
        id: 'workflow-live',
        title: 'Live trading',
        path: 'workflows/live-trading',
        summary: 'Connect your brokerage, promote a portfolio, and run an operation on a basket.',
        keywords: ['live trading', 'operation', 'broker', 'agent', 'live agent', 'alpaca', 'deploy'],
      },
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    pages: [
      {
        id: 'modes-overview',
        title: 'Execution modes',
        path: 'modes',
        summary: 'Internal vs external strategies and fitness — the 2×2 mode matrix.',
        keywords: ['internal', 'external', 'modes', 'matrix'],
      },
      {
        id: 'samplers',
        title: 'Sampler selection',
        path: 'optimizer/samplers',
        summary: 'TPE, CMA-ES, Random, QMC, NSGA-II — which to choose and when.',
        keywords: ['sampler', 'tpe', 'cmaes', 'bayesian', 'nsga'],
      },
      {
        id: 'additional-data',
        title: 'Data pipelines',
        path: 'configuration/additional-data',
        summary: 'Reusable, versioned graphs that wire data sources (built-in feeds or external APIs) through transforms into the named inputs strategies, fitness functions and risk managers consume.',
        keywords: [
          'data pipeline',
          'pipeline',
          'transform',
          'data source',
          'graph-aware',
          'external data',
          'additional data',
          'extra data',
          'injectable data',
          'groupings',
          'sector',
          'country',
          'index members',
          'context',
          'system collections',
          'volume',
          'trading volume',
          'liquidity',
          'external data source',
          'bring your own data',
          'mysql',
          'database',
          'byo data',
          'http endpoint',
        ],
      },
      {
        id: 'lifecycle',
        title: 'Study lifecycle',
        path: 'optimizer/lifecycle',
        summary: 'Status badges and state transitions for studies and trials.',
        keywords: ['state machine', 'queued', 'running', 'completed', 'failed', 'paused', 'stopped'],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    pages: [
      {
        id: 'external-strategies',
        title: 'External strategies',
        path: 'modes/external-strategies',
        summary: 'Host your signal generator behind your own HTTPS endpoint.',
        keywords: ['external strategy', 'simulate endpoint', 'http', 'signal', 'self-hosted'],
      },
      {
        id: 'external-fitness',
        title: 'External fitness',
        path: 'modes/external-fitness',
        summary: 'Score trials with a fitness function you own and host.',
        keywords: ['external fitness', 'evaluate endpoint', 'scoring', 'self-hosted'],
      },
      {
        id: 'architecture',
        title: 'Optimizer architecture',
        path: 'optimizer/architecture',
        summary: 'How the optimization engine, simulation engine, and storage fit together.',
        keywords: ['architecture', 'engine', 'pipeline', 'parallelism', 'internals'],
      },
    ],
  },
  {
    id: 'integration',
    title: 'Integration Guides',
    pages: [
      {
        id: 'guide-python',
        title: 'Python · FastAPI',
        path: 'guides/python',
        summary: 'Host strategy and fitness endpoints with FastAPI in 50 lines.',
        keywords: ['fastapi', 'python', 'uvicorn', 'guide'],
      },
      {
        id: 'guide-node',
        title: 'Node.js · Express',
        path: 'guides/node',
        summary: 'Same pattern, JavaScript ecosystem.',
        keywords: ['express', 'node', 'javascript', 'guide'],
      },
    ],
  },
  {
    id: 'api',
    title: 'API Reference',
    pages: [
      {
        id: 'api-overview',
        title: 'API overview',
        path: 'api',
        summary: 'Auth, base URL, request lifecycle, conventions.',
        keywords: ['api', 'rest', 'endpoints', 'authentication', 'bearer'],
      },
      {
        id: 'api-strategies',
        title: 'Strategies',
        path: 'api/strategies',
        summary: 'Read strategy definitions, metadata, parameters, and version history.',
        keywords: ['/strategies', 'GET', 'metadata', 'params', 'versions', 'execution type'],
      },
      {
        id: 'api-studies',
        title: 'Studies',
        path: 'api/studies',
        summary: 'Read study metadata, progress, health, and optimization history.',
        keywords: [
          '/studies',
          'GET',
          'progress',
          'health',
          'status',
          'errors',
          'optimization history',
          'param importances',
        ],
      },
      {
        id: 'api-trials-portfolios',
        title: 'Trials & portfolios',
        path: 'api/trials-portfolios',
        summary: 'Read individual trials and the managed portfolios promoted from them.',
        keywords: [
          '/v2/trials',
          '/v2/portfolios',
          'GET',
          'trial',
          'managed portfolio',
          'equity',
          'promotion',
        ],
      },
      {
        id: 'api-baskets',
        title: 'Baskets',
        path: 'api/baskets',
        summary: 'Read baskets, their freshness, operations, allocations, orders, and EOD reports.',
        keywords: [
          '/v2/baskets',
          'GET',
          'basket',
          'operation',
          'allocation',
          'order',
          'state log',
          'eod report',
          'freshness',
        ],
      },
      {
        id: 'api-fitness-data',
        title: 'Fitness & asset groups',
        path: 'api/fitness-data',
        summary: 'Read fitness functions, their metadata and versions, and asset group definitions.',
        keywords: [
          '/fitness',
          '/v1/data_clusters',
          'GET',
          'fitness function',
          'asset group',
          'versions',
          'universe',
        ],
      },
      {
        id: 'api-errors',
        title: 'Errors & status codes',
        path: 'api/errors',
        summary: 'How Fintela reports errors — HTTP codes, trial failure reasons.',
        keywords: ['errors', 'http codes', 'trial pruned', 'failure_reason'],
      },
    ],
  },
];

/** Flattened list — useful for search and routing. */
export const allDocPages: (DocPage & { groupId: string; groupTitle: string })[] =
  docNav.flatMap((g) =>
    g.pages.map((p) => ({ ...p, groupId: g.id, groupTitle: g.title })),
  );

export const fullPath = (page: { path: string }) =>
  page.path ? `/documentation/${page.path}` : '/documentation';

/** Find adjacent pages for the prev/next footer. */
export const adjacentPages = (pageId: string) => {
  const idx = allDocPages.findIndex((p) => p.id === pageId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? allDocPages[idx - 1] : null,
    next: idx < allDocPages.length - 1 ? allDocPages[idx + 1] : null,
  };
};
