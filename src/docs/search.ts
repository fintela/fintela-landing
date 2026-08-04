import type { DocSummary } from './types';

/**
 * Client-side documentation search, over the `docs/index.json` the page already
 * fetched. No search service, no build-time index beyond the capped `searchText`
 * the generator puts in each summary — which is the whole point of docs being
 * static files.
 *
 * Used by both entry points so they can never disagree about what matches: the
 * search bar on `/docs`, and the ⌘K palette inside a page.
 */

export interface DocHit {
  page: DocSummary;
  score: number;
}

/** Where a match landed, most specific first. Ties break on earlier position. */
const WEIGHTS = {
  title: 100,
  section: 45,
  keyword: 40,
  excerpt: 30,
  body: 15,
} as const;

/**
 * Every query term must match somewhere on the page — typing "external fitness"
 * should not return every page mentioning "external". Each term scores at its
 * best field and the page takes the sum, so a page matching both terms in its
 * title outranks one matching each in passing.
 */
export function searchDocs(pages: DocSummary[], query: string): DocHit[] {
  const phrase = query.toLowerCase().trim();
  const terms = phrase.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return pages.map((page) => ({ page, score: 0 }));

  const hits: DocHit[] = [];

  for (const page of pages) {
    const fields: [number, string][] = [
      [WEIGHTS.title, page.title.toLowerCase()],
      [WEIGHTS.section, page.section.toLowerCase()],
      [WEIGHTS.keyword, page.keywords.join(' ').toLowerCase()],
      [WEIGHTS.excerpt, page.excerpt.toLowerCase()],
      [WEIGHTS.body, page.searchText.toLowerCase()],
    ];

    let total = 0;
    let matchedEveryTerm = true;

    for (const term of terms) {
      let best = 0;
      for (const [weight, haystack] of fields) {
        const at = haystack.indexOf(term);
        if (at === -1) continue;
        // Earlier and word-initial matches score a little higher, which is what
        // separates "Studies" from "Managing studies data" for the query "stud".
        const bonus = at === 0 ? 8 : /\W/.test(haystack[at - 1] ?? '') ? 4 : 0;
        best = Math.max(best, weight + bonus);
      }
      if (best === 0) {
        matchedEveryTerm = false;
        break;
      }
      total += best;
    }

    // Contiguous beats scattered. Without this, "rate limit" ranks a page that
    // happens to say "rate of change" and "limit" separately above the page whose
    // subject is rate limiting — each term matched, so each scored.
    if (matchedEveryTerm && terms.length > 1) {
      for (const [weight, haystack] of fields) {
        if (haystack.includes(phrase)) {
          total += weight;
          break;
        }
      }
    }

    if (matchedEveryTerm) hits.push({ page, score: total });
  }

  return hits.sort((a, b) => b.score - a.score);
}
