import type { ReactNode } from 'react';

/**
 * Rendering contexts for documentation blocks.
 *
 * full     — complete section with H2 anchor heading; used inside DocsLayout pages
 * embedded — body content only (no heading); rendered inside EmbeddedDocsSection
 * compact  — 2-3 sentence summary; for cards, sidebar widgets, onboarding
 * inline   — single sentence; for tooltips and inline help icons
 */
export type RenderMode = 'full' | 'embedded' | 'compact' | 'inline';

/**
 * Fintela app pages that can host embedded documentation.
 * Drives contextual block retrieval via DocRegistry.getByAppContext().
 */
export type AppContext =
  | 'strategy-page'
  | 'fitness-page'
  | 'optimizer-config'
  | 'studies'
  | 'data-clusters'
  | 'analytics'
  | 'integrations'
  | 'api-config'
  | 'onboarding'
  | 'modal'
  | 'tooltip'
  | 'global';

export type DocCategory =
  | 'getting-started'
  | 'concepts'
  | 'modes'
  | 'optimizer'
  | 'api'
  | 'guides';

export type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DocBlockMeta {
  /** Stable kebab-case ID. Used for embedding, deep-linking, and search. Never rename. */
  id: string;
  title: string;
  summary: string;
  category: DocCategory;
  /** Feature tags for filtering and contextual retrieval. */
  tags: string[];
  /** Which app pages/contexts this block is relevant for contextual embedding. */
  appContexts: AppContext[];
  complexity: ComplexityLevel;
  /** IDs of logically related blocks (for "See also" links). */
  relatedBlocks: string[];
  apiRelevance: boolean;
  onboardingRelevance: boolean;
  keywords: string[];
  /**
   * Path relative to /documentation for deep linking.
   * Format: 'page-path' or 'page-path#section-id'.
   * Examples: 'concepts#strategies', 'modes/external-strategies'
   */
  docPath: string;
}

export interface DocBlock {
  meta: DocBlockMeta;
  /**
   * Render the block in the given mode.
   *
   * full     → includes H2 heading with anchor; for use inside DocsLayout
   * embedded → body only (no heading); EmbeddedDocsSection provides the title bar
   * compact  → short summary node; for cards and sidebar widgets
   * inline   → single sentence; for tooltip and inline help contexts
   */
  render: (mode?: RenderMode) => ReactNode;
}
