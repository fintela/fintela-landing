/**
 * The four `/solutions/*` pages, as data. One template (`SolutionPage`)
 * renders all four; what differs — which chapters run, what each one shows,
 * which FAQ questions lead, the research link — is declared here, and the
 * copy lives in the `solutions` i18n namespace under the same keys.
 *
 * The rules the pages follow (docs/redesign/SOLUTIONS-PLAN.md):
 * - one idea per chapter: an H3, one sentence, a mono proof line, at most one
 *   visual, and a docs link;
 * - a visual shows the noun in its sentence, or the chapter is text-only;
 * - no image appears on two pages, and every visual carries a badge saying
 *   what it is (an app capture, an illustration, or a diagram).
 */
import type { Audience } from '../lib/audience';

export const SOLUTION_SLUGS: Record<Audience, string> = {
  funds: 'hedge-funds',
  teams: 'quant-teams',
  independents: 'independent-quants',
  advisors: 'financial-advisors',
};

export const SOLUTION_PATHS: Record<Audience, string> = {
  funds: `/solutions/${SOLUTION_SLUGS.funds}`,
  teams: `/solutions/${SOLUTION_SLUGS.teams}`,
  independents: `/solutions/${SOLUTION_SLUGS.independents}`,
  advisors: `/solutions/${SOLUTION_SLUGS.advisors}`,
};

export const audienceFromSlug = (slug: string | undefined): Audience | undefined =>
  (Object.keys(SOLUTION_SLUGS) as Audience[]).find((a) => SOLUTION_SLUGS[a] === slug);

/** The `home:useCases.audiences.*` key each seat's copy was written under. */
export const USE_CASE_KEY: Record<Audience, 'institutions' | 'independents' | 'researchDesks' | 'advisors'> = {
  funds: 'institutions',
  independents: 'independents',
  teams: 'researchDesks',
  advisors: 'advisors',
};

/** What a badge under a visual says it is. */
export type MediaBadge = 'app' | 'illustrative' | 'diagram';

/** Coded pieces a chapter can mount (see components/solutions/ChapterVisuals.tsx). */
export type ChapterComponentId = 'confirmCard' | 'validationCompare' | 'riskProfilesDiagram' | 'versionsDiagram';

export type ChapterMedia =
  /** Text-only: the H3, the sentence and the proof line carry the chapter. */
  | { kind: 'none' }
  /**
   * An app-faithful coded piece. Its caption and alt text live under
   * `solutions.<audience>.chapters.<key>.caption|mediaAlt`.
   */
  | { kind: 'component'; id: ChapterComponentId; badge: MediaBadge };

export interface SolutionChapter {
  /** Key under `solutions.<audience>.chapters.*`; the anchor is `#chapter-<key>`. */
  key: string;
  media: ChapterMedia;
  /** Where the chapter's docs link lands. */
  docs: string;
}

export interface SolutionConfig {
  slug: string;
  /** Three or four chapters; never five. */
  chapters: SolutionChapter[];
  /** Keys under `solutions.<audience>.faq.*`, in the order this seat asks them. */
  faq: string[];
  /** Primary CTA: a walkthrough for desks, the trial for individuals. */
  lead: 'walkthrough' | 'trial';
  /**
   * The post that backs this seat's pitch, as a path (`/blog/…` or
   * `/research/…`), with its label under `solutions.<audience>.research.label`.
   * One research link per page, so the blog's authority flows into the
   * landing pages and back.
   */
  research: string;
}

const none: ChapterMedia = { kind: 'none' };

export const SOLUTIONS: Record<Audience, SolutionConfig> = {
  funds: {
    slug: SOLUTION_SLUGS.funds,
    chapters: [
      { key: 'luck', media: none, docs: '/docs/optimization-dashboard#robustness' },
      { key: 'provenance', media: none, docs: '/docs/registries#version-history' },
      { key: 'trading', media: none, docs: '/docs/live-trading' },
      { key: 'safeguards', media: none, docs: '/docs/live-trading#safety-limits' },
    ],
    faq: ['code', 'trading', 'data', 'assistant', 'cost'],
    lead: 'walkthrough',
    research: '/blog/quants-moving-away-from-legacy-tools',
  },
  teams: {
    slug: SOLUTION_SLUGS.teams,
    chapters: [
      { key: 'library', media: none, docs: '/docs/registries' },
      { key: 'ranking', media: none, docs: '/docs/portfolios-dashboard' },
      { key: 'versions', media: { kind: 'component', id: 'versionsDiagram', badge: 'diagram' }, docs: '/docs/registries#version-history' },
      { key: 'report', media: none, docs: '/docs/portfolio-detail#profile' },
    ],
    faq: ['access', 'ownCode', 'data', 'assistant', 'pricing'],
    lead: 'walkthrough',
    research: '/blog/momentum-research',
  },
  independents: {
    slug: SOLUTION_SLUGS.independents,
    chapters: [
      { key: 'heldOut', media: none, docs: '/docs/analyzing-results' },
      { key: 'luck', media: none, docs: '/docs/optimization-dashboard#robustness' },
      { key: 'trading', media: none, docs: '/docs/live-trading#safety-limits' },
    ],
    faq: ['cost', 'code', 'data', 'ownership', 'trading'],
    lead: 'trial',
    research: '/blog/deflated-sharpe',
  },
  advisors: {
    slug: SOLUTION_SLUGS.advisors,
    chapters: [
      { key: 'draft', media: { kind: 'component', id: 'confirmCard', badge: 'illustrative' }, docs: '/docs/fintelligent-drafts-and-runs' },
      { key: 'validation', media: { kind: 'component', id: 'validationCompare', badge: 'illustrative' }, docs: '/docs/portfolio-detail#robustness-overfitting' },
      { key: 'riskProfiles', media: { kind: 'component', id: 'riskProfilesDiagram', badge: 'diagram' }, docs: '/docs/risk-managers' },
      { key: 'reporting', media: none, docs: '/docs/portfolio-detail#profile' },
    ],
    faq: ['backtests', 'coding', 'accountable', 'clientAccounts', 'record'],
    lead: 'walkthrough',
    research: '/research/climate-analysis',
  },
};
