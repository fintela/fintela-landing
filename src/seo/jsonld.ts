import type { BlogPostSummary } from '../blog/types';
import type { DocSummary } from '../docs/types';
import { DOCS_HOME } from './routes';
import { APP_URL, ORG, SITE_URL, absoluteUrl } from './site';

/**
 * Schema.org node builders. Each page hands `<Seo jsonLd>` a list of these and
 * the component serialises them as one `@graph`.
 *
 * The three shared entities carry stable `@id`s — `#organization`, `#website`,
 * `#app` — and every other node points at them by reference instead of
 * repeating them. Include `organization()` and `webSite()` in every page's
 * graph so those references resolve inside the document, which is the only
 * place Google's parser looks.
 *
 * What is deliberately absent: `Offer`s (the commercial model on /pricing
 * contradicts the Terms until the business settles it), `aggregateRating`
 * (there are no reviews) and `SearchAction` (there is no search-results URL).
 * Markup that overstates the page is worse than none.
 */

/** Any Schema.org node. Typed loosely on purpose: the builders shape them. */
export type JsonLdNode = Record<string, unknown>;

const SCHEMA_CONTEXT = 'https://schema.org';

/**
 * JSON-LD as inline script text. `<` is escaped as its \u003c escape so a
 * `</script>` inside a string (an excerpt quoting HTML, say) cannot end the
 * element early; JSON parsers read it back as `<`.
 */
export function serializeJsonLd(jsonLd: JsonLdNode | JsonLdNode[]): string {
  const payload = Array.isArray(jsonLd)
    ? { '@context': SCHEMA_CONTEXT, '@graph': jsonLd }
    : { '@context': SCHEMA_CONTEXT, ...jsonLd };
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const APP_ID = `${SITE_URL}/#app`;
const LOGO_ID = `${SITE_URL}/#logo`;

const ref = (id: string): JsonLdNode => ({ '@id': id });

export function organization(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: ORG.name,
    legalName: ORG.legalName,
    url: ORG.url,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: ORG.logo,
      contentUrl: ORG.logo,
      width: 512,
      height: 512,
      caption: ORG.name,
    },
    image: ref(LOGO_ID),
    email: ORG.email,
    sameAs: [...ORG.sameAs],
    address: { '@type': 'PostalAddress', ...ORG.address },
  };
}

export function webSite(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: ORG.name,
    publisher: ref(ORGANIZATION_ID),
    inLanguage: ['en', 'es', 'pt'],
  };
}

export function softwareApplication(description?: string): JsonLdNode {
  return {
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: ORG.name,
    url: APP_URL,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    ...(description ? { description } : {}),
    publisher: ref(ORGANIZATION_ID),
  };
}

export interface WebPageOptions {
  name: string;
  description: string;
  /** Absolute URL — the page's canonical. */
  url: string;
  /** `YYYY-MM-DD`; only when the content carries a real date. */
  dateModified?: string;
  /** `WebPage` unless the page is a more specific type (`Blog`, `AboutPage`…). */
  type?: string;
  /** Absolute URL of the page's social image. */
  image?: string;
}

export function webPage({
  name,
  description,
  url,
  dateModified,
  type,
  image,
}: WebPageOptions): JsonLdNode {
  return {
    '@type': type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: ref(WEBSITE_ID),
    publisher: ref(ORGANIZATION_ID),
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    ...(dateModified ? { dateModified } : {}),
    inLanguage: 'en',
  };
}

export interface Breadcrumb {
  name: string;
  /** Absolute URL. Omitted only on the last crumb (the page itself). */
  url?: string;
}

/**
 * The crumbs every trail starts from. Only URLs that answer 200 belong here:
 * `/docs` and `/solutions` redirect, so the documentation crumb points at the
 * overview page and solution pages sit directly under Home.
 */
export const homeCrumb = (): Breadcrumb => ({ name: 'Home', url: `${SITE_URL}/` });
export const blogCrumb = (): Breadcrumb => ({ name: 'Blog', url: absoluteUrl('/blog') });
export const docsCrumb = (): Breadcrumb => ({ name: 'Documentation', url: absoluteUrl(DOCS_HOME) });

export function breadcrumbList(items: Breadcrumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(crumb.url ? { item: crumb.url } : {}),
    })),
  };
}

/**
 * `Fintela Team` is the house byline, so it is the Organization itself rather
 * than a Person named "Fintela Team" (which would mismatch the entity's name).
 * Anyone else is a Person by name; there are no author pages to link to yet.
 */
const author = (name: string): JsonLdNode =>
  name.trim().toLowerCase() === 'fintela team'
    ? ref(ORGANIZATION_ID)
    : { '@type': 'Person', name: name.trim(), worksFor: ref(ORGANIZATION_ID) };

/**
 * @param url    The post's canonical (absolute) URL.
 * @param image  Absolute URL(s) of the post's image; the 1200×630 card first.
 */
export function blogPosting(
  post: BlogPostSummary,
  url: string,
  image: string | string[]
): JsonLdNode {
  const tags = post.tags.filter(Boolean);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: post.title,
    description: post.excerpt,
    image,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: author(post.author),
    publisher: ref(ORGANIZATION_ID),
    ...(tags.length ? { keywords: tags.join(', '), articleSection: tags[0] } : {}),
    timeRequired: `PT${post.readingMinutes}M`,
    inLanguage: 'en',
  };
}

/** @param url The page's canonical (absolute) URL. */
export function techArticle(doc: DocSummary, url: string): JsonLdNode {
  return {
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: doc.title,
    description: doc.excerpt,
    articleSection: doc.section,
    ...(doc.keywords.length ? { keywords: doc.keywords.join(', ') } : {}),
    // No datePublished: the docs carry no creation date, and guessing one is
    // worse than omitting it.
    dateModified: doc.updated,
    author: ref(ORGANIZATION_ID),
    publisher: ref(ORGANIZATION_ID),
    about: ref(APP_ID),
    image: absoluteUrl('/og/docs.png'),
    timeRequired: `PT${doc.readingMinutes}M`,
    isAccessibleForFree: true,
    inLanguage: 'en',
  };
}

export interface FaqEntry {
  q: string;
  /** Plain text — exactly what the accordion shows. */
  a: string;
}

export function faqPage(items: FaqEntry[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function contactPage({
  url,
  name,
  description,
}: {
  url: string;
  name: string;
  description: string;
}): JsonLdNode {
  return {
    '@type': 'ContactPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: ref(WEBSITE_ID),
    mainEntity: ref(ORGANIZATION_ID),
    inLanguage: 'en',
  };
}
