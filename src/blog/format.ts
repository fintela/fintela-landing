/**
 * Blog-specific card formatting. The date formatter and the excerpt truncator
 * moved to `src/content/format.ts` when the docs collection started needing the
 * same two functions; what is left here is the one thing only the blog has.
 */

/**
 * Deterministic brand accent per post, so a card keeps its colour across renders
 * and between the grid and the post header. Tags are author-supplied and
 * open-ended, so the accent is derived from the slug rather than a fixed map.
 */
const ACCENTS = ['#667eea', '#9333ea', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'] as const;

export function accentFor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) % 100000;
  return ACCENTS[hash % ACCENTS.length];
}
