/**
 * Fintela embedded documentation components.
 *
 * Import these in any Fintela app page to render contextual documentation
 * without duplicating content. All components read from the shared DocRegistry.
 *
 * Quick reference:
 *
 *   EmbeddedDocsSection   — primary component; renders any block by ID
 *   ContextualDocsPanel   — slide-in Drawer; resolves blocks from appContext
 *   InlineExplanation     — "?" icon that opens a popover or expands inline
 *   MiniWorkflowGuide     — compact numbered-step guide
 *   FeatureHelpCard       — card with title, summary, complexity, related links
 *   ExpandableDocs        — accordion that collapses to compact and expands to full
 *   DocsReferenceCard     — reference table with name/type/description rows
 *   ContextualAPIHelp     — collapsible API endpoint reference panel
 *
 * Example (strategy page):
 *
 *   import { EmbeddedDocsSection } from '@fintela/docs/embed';
 *
 *   <EmbeddedDocsSection
 *     blockId="strategies"
 *     mode="embedded"
 *     variant="card"
 *   />
 *
 *   <EmbeddedDocsSection
 *     blockId="external-strategies"
 *     mode="compact"
 *     showViewFull
 *   />
 */

export { EmbeddedDocsSection } from './EmbeddedDocsSection';
export type { EmbeddedDocsSectionProps } from './EmbeddedDocsSection';

export { ContextualDocsPanel } from './ContextualDocsPanel';
export type { ContextualDocsPanelProps } from './ContextualDocsPanel';

export { InlineExplanation } from './InlineExplanation';
export type { InlineExplanationProps } from './InlineExplanation';

export { MiniWorkflowGuide } from './MiniWorkflowGuide';
export type { MiniWorkflowGuideProps, MiniWorkflowStep } from './MiniWorkflowGuide';

export { FeatureHelpCard } from './FeatureHelpCard';
export type { FeatureHelpCardProps } from './FeatureHelpCard';

export { ExpandableDocs } from './ExpandableDocs';
export type { ExpandableDocsProps } from './ExpandableDocs';

export { DocsReferenceCard } from './DocsReferenceCard';
export type { DocsReferenceCardProps, ReferenceRow } from './DocsReferenceCard';

export { ContextualAPIHelp } from './ContextualAPIHelp';
export type { ContextualAPIHelpProps, APIEndpointHint } from './ContextualAPIHelp';
