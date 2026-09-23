import { DOCS_HOME } from '../seo/routes';
import { SOLUTION_PATHS } from '../solutions/registry';

/**
 * The marketing pages, as search results. There is no JSON for these — a
 * static route has no generator — so this is the whole of that content:
 * a title key, and an excerpt key that reuses each page's own `<Seo>`
 * description (`pages:seo.*.description` / `solutions:<audience>.seo.description`)
 * rather than duplicating new copy.
 */
export interface StaticPageEntry {
  id: string;
  titleKey: string;
  excerptKey: string;
  keywords: string[];
  url: string;
}

export const STATIC_PAGE_ENTRIES: StaticPageEntry[] = [
  {
    id: 'home',
    titleKey: 'pages:search.pages.home',
    excerptKey: 'pages:seo.home.description',
    keywords: ['platform', 'overview', 'agentic'],
    url: '/',
  },
  {
    id: 'pricing',
    titleKey: 'pages:search.pages.pricing',
    excerptKey: 'pages:seo.pricing.description',
    keywords: ['plans', 'cost', 'trader', 'quant', 'institutional'],
    url: '/pricing',
  },
  {
    id: 'solutions-funds',
    titleKey: 'pages:search.pages.solutionsFunds',
    excerptKey: 'solutions:funds.seo.description',
    keywords: ['hedge funds', 'institutional'],
    url: SOLUTION_PATHS.funds,
  },
  {
    id: 'solutions-teams',
    titleKey: 'pages:search.pages.solutionsTeams',
    excerptKey: 'solutions:teams.seo.description',
    keywords: ['quant teams', 'research desks'],
    url: SOLUTION_PATHS.teams,
  },
  {
    id: 'solutions-independents',
    titleKey: 'pages:search.pages.solutionsIndependents',
    excerptKey: 'solutions:independents.seo.description',
    keywords: ['independent', 'individual traders'],
    url: SOLUTION_PATHS.independents,
  },
  {
    id: 'solutions-advisors',
    titleKey: 'pages:search.pages.solutionsAdvisors',
    excerptKey: 'solutions:advisors.seo.description',
    keywords: ['financial advisors', 'wealth managers', 'RIA'],
    url: SOLUTION_PATHS.advisors,
  },
  {
    id: 'contact',
    titleKey: 'pages:search.pages.contact',
    // `/contact` is the walkthrough-booking page now (the generic "Get in
    // Touch" default was retired); its own SEO description is the excerpt.
    excerptKey: 'pages:seo.contactWalkthrough.description',
    keywords: ['support', 'demo', 'sales', 'walkthrough'],
    url: '/contact',
  },
  {
    id: 'blog',
    titleKey: 'pages:search.pages.blog',
    excerptKey: 'pages:seo.blog.description',
    keywords: ['articles', 'research', 'insights'],
    url: '/blog',
  },
  {
    id: 'docs',
    titleKey: 'pages:search.pages.docs',
    excerptKey: 'pages:seo.docs.description',
    keywords: ['documentation', 'guides', 'api'],
    url: DOCS_HOME,
  },
];
