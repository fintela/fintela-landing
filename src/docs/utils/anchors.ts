/**
 * Deep-link and anchor utilities for the Fintela documentation system.
 *
 * All doc blocks carry a stable `meta.docPath` (e.g. 'concepts#strategies').
 * Use these helpers to generate navigable URLs without hard-coding paths.
 */

export const DOCS_BASE = '/documentation';

/**
 * Build the full URL for a docs path or block's docPath.
 *
 * Examples:
 *   docUrl('concepts#strategies')        → '/documentation/concepts#strategies'
 *   docUrl('modes/external-strategies')  → '/documentation/modes/external-strategies'
 *   docUrl('')                           → '/documentation'
 */
export const docUrl = (docPath: string): string => {
  if (!docPath) return DOCS_BASE;
  if (docPath.startsWith('/')) return docPath;
  return `${DOCS_BASE}/${docPath}`;
};

/**
 * Build a URL for a specific section anchor on a docs page.
 *
 *   sectionUrl('concepts', 'strategies')  → '/documentation/concepts#strategies'
 */
export const sectionUrl = (pagePath: string, sectionId: string): string =>
  `${docUrl(pagePath)}#${sectionId}`;

/**
 * Split a docPath like 'concepts#strategies' into { path, anchor }.
 */
export const parseDocPath = (
  docPath: string,
): { path: string; anchor: string | undefined } => {
  const [path, anchor] = docPath.split('#');
  return { path, anchor };
};

/**
 * Generate an HTML element ID from a block ID that is safe for use as a DOM id and
 * stable as an anchor target.
 *
 * Block IDs are already kebab-case, so this is mostly a passthrough with a prefix.
 */
export const blockAnchorId = (blockId: string): string => `block-${blockId}`;

/**
 * Create a URL that scrolls to the anchor for a specific block on its native doc page.
 * Requires that the doc page renders the block's `full` mode with matching heading ids.
 */
export const blockDeepLink = (blockId: string, docPath: string): string => {
  const { path, anchor } = parseDocPath(docPath);
  return sectionUrl(path, anchor ?? blockId);
};
