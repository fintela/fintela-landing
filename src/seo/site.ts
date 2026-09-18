/**
 * Site-wide SEO constants: the canonical origin, the organisation behind the
 * site and the default social image. Everything the `<Seo>` component and the
 * JSON-LD builders emit derives from here, so a rename or a domain move is one
 * edit. The values are the naming contracts of the SEO overhaul and are shared
 * with the prerender script (`scripts/prerender.mjs`) through `entry-server`.
 */

/**
 * The public origin, without a trailing slash. `VITE_SITE_URL` repoints a
 * preview build at its own host so canonicals, og:url and the sitemap never
 * claim to be production while pointing at a staging bucket.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || 'https://fintela.io').replace(
  /\/+$/,
  ''
);

/**
 * The clean route for a canonical URL: no query, no hash, and no trailing
 * slash — except the root, which is `/` (so the home canonical is
 * `https://fintela.io/`). Any query string or trailing slash on `/contact`
 * canonicalises to plain `/contact`.
 */
export const canonicalPath = (pathname: string): string => {
  const path = pathname.replace(/[?#].*$/, '');
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

/**
 * `path` as an absolute URL on this site. An absolute `http(s)` URL is returned
 * unchanged, so a blog cover that already points elsewhere passes through.
 */
export const absoluteUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

/** The organisation behind the site, as Schema.org and the legal documents name it. */
export const ORG = {
  name: 'Fintela',
  legalName: 'Momento Capital, S.A.P.I. de C.V.',
  url: SITE_URL,
  logo: `${SITE_URL}/brand/fintela-mark-512.png`,
  email: 'hello@fintela.io',
  sameAs: [
    'https://www.linkedin.com/company/fintela-financial-intelligence',
    'https://github.com/fintela',
  ],
  address: {
    streetAddress: 'Avenida José Vasconcelos 404, Interior 604, Colonia Centro',
    addressLocality: 'San Pedro Garza García',
    addressRegion: 'Nuevo León',
    postalCode: '66300',
    addressCountry: 'MX',
  },
} as const;

/** The product itself — what the marketing site sends people to. */
export const APP_URL = 'https://app.fintela.io';

/**
 * Social card images live in `public/og/` at unhashed URLs: LinkedIn, X and
 * Slack cache the URL they scraped, and a content-hashed asset would 404 after
 * the next deploy. All are 1200×630 PNG.
 */
export const DEFAULT_OG_IMAGE = '/og/default.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
