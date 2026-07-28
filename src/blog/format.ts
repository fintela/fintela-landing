/** Card + post-header formatting shared by the two blog pages. */

/**
 * `YYYY-MM-DD` in the reader's locale. Parsed as UTC noon so a negative timezone
 * offset cannot roll the displayed date back a day.
 */
export function formatPostDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Trim to `max` characters on a word boundary, per the brief's ~150-char cards.
 * The generator already derives excerpts, but an author-written one has no length
 * cap, so the card enforces its own.
 */
export function truncate(text: string, max = 150): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.!?-]+$/, '')}…`;
}

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
