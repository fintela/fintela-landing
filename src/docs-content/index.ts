// Barrel for the shared documentation content modules.
//
// Import shared content in either doc tree via the `@docs-content` alias, e.g.
//   import { authentication, quickstart } from '@docs-content';
//   import { studies } from '@docs-content/concepts/studies';
//
// Only the block .tsx files should import from here; keep id / docPath / the
// default render-mode local to each tree.

export type {
  VisibilityRow,
  QuickStep,
  FieldRow,
  MetricRow,
  StateRow,
  ConceptContent,
  AuthContent,
  QuickstartContent,
  ExternalModeContent,
  DataClustersContent,
  StudiesContent,
  PortfoliosContent,
  LifecycleContent,
  StrategiesContent,
  SeedContent,
} from './types';

export { authentication } from './authentication';
export { quickstart } from './quickstart-steps';
export { externalFitness } from './external-fitness';
export { externalStrategies } from './external-strategies';

export { dataClusters } from './concepts/data-clusters';
export { fitnessFunctions } from './concepts/fitness-functions';
export { liveAgents } from './concepts/live-agents';
export { optimizerLifecycle } from './concepts/optimizer-lifecycle';
export { portfolios } from './concepts/portfolios';
export { strategies } from './concepts/strategies';
export { studies } from './concepts/studies';
export { additionalData } from './concepts/additional-data';
export { riskManagers } from './concepts/risk-managers';
export { seed } from './concepts/seed';
