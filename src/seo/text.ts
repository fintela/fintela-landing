/**
 * String helpers for `<Seo>` callers: the title format and the description
 * cut. Kept apart from the component so `Seo.tsx` exports only a component
 * (which is what keeps it hot-reloadable).
 */

/** `{Page} | Fintela` — or `{Page} | Fintela Docs`, `{Page} | Research Blog`. */
export const pageTitle = (name: string, suffix = 'Fintela'): string => `${name} | ${suffix}`;

/**
 * A meta description from longer copy: whitespace collapsed, cut at a word
 * boundary and finished with an ellipsis only when something was cut. Google
 * shows about 155 characters; a sentence sliced mid-word reads as broken.
 */
export function truncateDescription(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const limit = max - 1; // room for the ellipsis
  const cut = clean.slice(0, limit + 1);
  const boundary = cut.lastIndexOf(' ');
  // No usable boundary (one enormous token) → a hard cut beats an empty string.
  const head = (boundary > limit / 2 ? cut.slice(0, boundary) : clean.slice(0, limit)).replace(
    /[\s,;:.!?-]+$/,
    ''
  );
  return `${head}…`;
}
