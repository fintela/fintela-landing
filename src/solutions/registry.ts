/**
 * The three `/solutions/*` pages, as data. One template (`SolutionPage`)
 * renders all three; what differs — the still, the stat, which chapters run,
 * which FAQ questions lead — is declared here, and the copy lives in the
 * `solutions` i18n namespace under the same keys.
 */
import type { Audience } from '../lib/audience';
import { STILLS } from '../media/registry';
import type { VideoId } from '../media/registry';

export const SOLUTION_SLUGS: Record<Audience, string> = {
  funds: 'hedge-funds',
  teams: 'quant-teams',
  independents: 'independent-quants',
};

export const SOLUTION_PATHS: Record<Audience, string> = {
  funds: `/solutions/${SOLUTION_SLUGS.funds}`,
  teams: `/solutions/${SOLUTION_SLUGS.teams}`,
  independents: `/solutions/${SOLUTION_SLUGS.independents}`,
};

export const audienceFromSlug = (slug: string | undefined): Audience | undefined =>
  (Object.keys(SOLUTION_SLUGS) as Audience[]).find((a) => SOLUTION_SLUGS[a] === slug);

/** The `home:useCases.audiences.*` key each seat's copy was written under. */
export const USE_CASE_KEY: Record<Audience, 'institutions' | 'independents' | 'researchDesks'> = {
  funds: 'institutions',
  independents: 'independents',
  teams: 'researchDesks',
};

export type ChapterMedia =
  // Chapter media sits in a 7-column cell, so stills are landscape. Product
  // frames are 'plain' (no duotone wash) at 16/9, the recordings' own shape.
  | { kind: 'image'; src: string; ratio: '16/10' | '16/9' | '3/2'; tone?: 'plain' | 'duotone' }
  | { kind: 'video'; video: VideoId; chapter?: string };

/** A frame of the product, set in plain. */
const frame = (src: string): ChapterMedia => ({ kind: 'image', src, ratio: '16/9', tone: 'plain' });

export interface SolutionChapter {
  /** Key under `solutions.<audience>.chapters.*`. */
  key: string;
  media: ChapterMedia;
  /** Where "Read the docs" lands. */
  docs: string;
}

export interface SolutionConfig {
  slug: string;
  hero: { still: string };
  chapters: SolutionChapter[];
  /** `home:faq.items.*` keys, in the order this seat asks them. */
  faq: string[];
  /** Extra questions under `solutions.<audience>.faq.*`. */
  extraFaq: string[];
  /** Primary CTA: a walkthrough for desks, the app for individuals. */
  primaryCta: 'walkthrough' | 'app';
}

export const SOLUTIONS: Record<Audience, SolutionConfig> = {
  funds: {
    slug: SOLUTION_SLUGS.funds,
    hero: { still: STILLS.solutions.funds },
    chapters: [
      { key: 'research', media: frame(STILLS.chapters.funds.research), docs: '/docs/studies' },
      { key: 'governance', media: frame(STILLS.chapters.funds.governance), docs: '/docs/strategies' },
      { key: 'execution', media: frame(STILLS.chapters.funds.execution), docs: '/docs/live-trading' },
      { key: 'workspace', media: frame(STILLS.chapters.funds.workspace), docs: '/docs/registries' },
      { key: 'security', media: { kind: 'video', video: 'agents' }, docs: '/docs/fintelligent-drafts-and-runs' },
    ],
    faq: ['security', 'poweredBy', 'liveTrading', 'seedExport'],
    extraFaq: ['onboarding', 'data'],
    primaryCta: 'walkthrough',
  },
  teams: {
    slug: SOLUTION_SLUGS.teams,
    hero: { still: STILLS.solutions.teams },
    chapters: [
      { key: 'workspace', media: frame(STILLS.chapters.teams.workspace), docs: '/docs/registries' },
      { key: 'research', media: frame(STILLS.chapters.teams.research), docs: '/docs/studies' },
      { key: 'provenance', media: frame(STILLS.chapters.teams.provenance), docs: '/docs/strategies' },
      { key: 'reports', media: frame(STILLS.chapters.teams.reports), docs: '/docs/portfolio-detail' },
      { key: 'agents', media: { kind: 'video', video: 'agents' }, docs: '/docs/fintelligent' },
    ],
    faq: ['security', 'seedExport', 'vsBacktesting', 'poweredBy'],
    extraFaq: ['sharing', 'committee'],
    primaryCta: 'walkthrough',
  },
  independents: {
    slug: SOLUTION_SLUGS.independents,
    hero: { still: STILLS.solutions.independents },
    chapters: [
      { key: 'noDevops', media: frame(STILLS.chapters.independents.noDevops), docs: '/docs/quickstart' },
      { key: 'optimization', media: frame(STILLS.chapters.independents.optimization), docs: '/docs/sampler-selection' },
      { key: 'live', media: frame(STILLS.chapters.independents.live), docs: '/docs/live-trading' },
      { key: 'agent', media: { kind: 'video', video: 'agents' }, docs: '/docs/fintelligent' },
    ],
    faq: ['python', 'optimization', 'speed', 'liveTrading'],
    extraFaq: ['cost', 'ownership'],
    primaryCta: 'app',
  },
};
