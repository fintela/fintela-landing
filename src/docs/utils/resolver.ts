/**
 * Contextual documentation resolver.
 *
 * Given an app context or feature area, returns the most relevant documentation
 * blocks from the registry. Used by ContextualDocsPanel and ContextualAPIHelp
 * to populate help content without hard-coded block lists.
 */

import { docRegistry } from '../registry';
import type { AppContext, DocBlock, ComplexityLevel } from '../registry/types';

export interface ResolvedDocs {
  primary: DocBlock[];
  related: DocBlock[];
  apiBlocks: DocBlock[];
  onboardingBlocks: DocBlock[];
}

/**
 * Resolve all relevant blocks for a given app context.
 * Returns tiered results: primary (direct match), related, api-relevant, onboarding-relevant.
 */
export const resolveContextualDocs = (appContext: AppContext): ResolvedDocs => {
  const primary = docRegistry.getByAppContext(appContext);

  const relatedIds = new Set<string>();
  primary.forEach((b) => b.meta.relatedBlocks.forEach((id) => relatedIds.add(id)));

  const primaryIds = new Set(primary.map((b) => b.meta.id));
  const related = Array.from(relatedIds)
    .filter((id) => !primaryIds.has(id))
    .map((id) => docRegistry.getBlock(id))
    .filter((b): b is DocBlock => b !== undefined);

  const apiBlocks = primary.filter((b) => b.meta.apiRelevance);
  const onboardingBlocks = primary.filter((b) => b.meta.onboardingRelevance);

  return { primary, related, apiBlocks, onboardingBlocks };
};

/**
 * Get the most contextually relevant blocks filtered by complexity.
 * Useful for progressive disclosure in onboarding flows.
 */
export const resolveByComplexity = (
  appContext: AppContext,
  maxComplexity: ComplexityLevel = 'intermediate',
): DocBlock[] => {
  const order: ComplexityLevel[] = ['beginner', 'intermediate', 'advanced'];
  const maxIdx = order.indexOf(maxComplexity);
  return docRegistry
    .getByAppContext(appContext)
    .filter((b) => order.indexOf(b.meta.complexity) <= maxIdx);
};

/**
 * Search documentation blocks and return results ranked by relevance.
 * Wraps DocRegistry.search with optional context filtering.
 */
export const searchDocs = (
  query: string,
  appContext?: AppContext,
): DocBlock[] => {
  const results = docRegistry.search(query);
  if (!appContext) return results;

  // Boost results that match the current app context
  const contextIds = new Set(
    docRegistry.getByAppContext(appContext).map((b) => b.meta.id),
  );
  return [
    ...results.filter((b) => contextIds.has(b.meta.id)),
    ...results.filter((b) => !contextIds.has(b.meta.id)),
  ];
};

/**
 * Get the "suggested next" block after the current one, respecting context.
 * Used for progressive onboarding ("After reading X, read Y").
 */
export const suggestNext = (
  currentBlockId: string,
  appContext?: AppContext,
): DocBlock | undefined => {
  const block = docRegistry.getBlock(currentBlockId);
  if (!block) return undefined;

  const candidates = block.meta.relatedBlocks
    .map((id) => docRegistry.getBlock(id))
    .filter((b): b is DocBlock => b !== undefined);

  if (!appContext) return candidates[0];

  // Prefer candidates that match the current app context
  const contextMatch = candidates.find((b) =>
    b.meta.appContexts.includes(appContext),
  );
  return contextMatch ?? candidates[0];
};
