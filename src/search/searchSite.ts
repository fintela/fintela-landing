import type { SearchEntry } from './types';

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

/**
 * Where a match landed, most specific first — the same weights and the same
 * contiguous-phrase bonus `src/docs/search.ts` scores the in-docs palette
 * with. Reimplemented rather than shared: this feature is additive, and
 * nothing here should be able to regress that one.
 */
const WEIGHTS = {
  title: 100,
  section: 45,
  keyword: 40,
  excerpt: 30,
  body: 15,
} as const;

/**
 * Every query term must match somewhere on the entry — typing "external
 * fitness" should not return every result mentioning "external". Each term
 * scores at its best field and the entry takes the sum, so a title match on
 * both terms outranks one matching each in passing. Call only with a
 * non-empty query; an empty one has no meaningful ranking (the caller shows
 * a curated list instead — see `SiteSearchModal`).
 */
export function searchSite(entries: readonly SearchEntry[], query: string): SearchHit[] {
  const phrase = query.toLowerCase().trim();
  const terms = phrase.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const entry of entries) {
    const fields: [number, string][] = [
      [WEIGHTS.title, entry.title.toLowerCase()],
      [WEIGHTS.section, entry.section.toLowerCase()],
      [WEIGHTS.keyword, entry.keywords.join(' ').toLowerCase()],
      [WEIGHTS.excerpt, entry.excerpt.toLowerCase()],
      [WEIGHTS.body, (entry.body ?? '').toLowerCase()],
    ];

    let total = 0;
    let matchedEveryTerm = true;

    for (const term of terms) {
      let best = 0;
      for (const [weight, haystack] of fields) {
        const at = haystack.indexOf(term);
        if (at === -1) continue;
        const bonus = at === 0 ? 8 : /\W/.test(haystack[at - 1] ?? '') ? 4 : 0;
        best = Math.max(best, weight + bonus);
      }
      if (best === 0) {
        matchedEveryTerm = false;
        break;
      }
      total += best;
    }

    // Contiguous beats scattered — "rate limit" should outrank a page that
    // separately says "rate of change" and "limit".
    if (matchedEveryTerm && terms.length > 1) {
      for (const [weight, haystack] of fields) {
        if (haystack.includes(phrase)) {
          total += weight;
          break;
        }
      }
    }

    if (matchedEveryTerm) hits.push({ entry, score: total });
  }

  return hits.sort((a, b) => b.score - a.score);
}
