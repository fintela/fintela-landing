/**
 * Block registry initializer — import this file once at app startup to register
 * all documentation blocks into the singleton docRegistry.
 *
 * In the landing page: imported by DocsSearch and embed components.
 * In the Fintela app: import once at root level, then use embed components freely.
 */

import { docRegistry } from '../registry';

import { dataClustersBlock } from './concepts/data-clusters';
import { strategiesBlock } from './concepts/strategies';
import { fitnessFunctionsBlock } from './concepts/fitness-functions';
import { studiesBlock } from './concepts/studies';
import { optimizerLifecycleBlock } from './concepts/optimizer-lifecycle';
import { portfoliosBlock } from './concepts/portfolios';
import { seedBlock } from './concepts/seed';
import { liveAgentsBlock } from './concepts/live-agents';
import { riskManagersBlock } from './concepts/risk-managers';
import { additionalDataBlock } from './concepts/additional-data';

import { externalStrategiesBlock } from './modes/external-strategies';
import { externalFitnessBlock } from './modes/external-fitness';

import { apiAuthBlock } from './api/authentication';

import { quickstartStepsBlock } from './getting-started/quickstart-steps';

docRegistry
  .register(dataClustersBlock)
  .register(strategiesBlock)
  .register(fitnessFunctionsBlock)
  .register(studiesBlock)
  .register(optimizerLifecycleBlock)
  .register(portfoliosBlock)
  .register(seedBlock)
  .register(liveAgentsBlock)
  .register(riskManagersBlock)
  .register(additionalDataBlock)
  .register(externalStrategiesBlock)
  .register(externalFitnessBlock)
  .register(apiAuthBlock)
  .register(quickstartStepsBlock);

// Re-export all blocks for direct access when needed
export {
  dataClustersBlock,
  strategiesBlock,
  fitnessFunctionsBlock,
  studiesBlock,
  optimizerLifecycleBlock,
  portfoliosBlock,
  seedBlock,
  liveAgentsBlock,
  riskManagersBlock,
  additionalDataBlock,
  externalStrategiesBlock,
  externalFitnessBlock,
  apiAuthBlock,
  quickstartStepsBlock,
};
