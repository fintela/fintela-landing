import { useLocation } from 'react-router-dom';
import { serializeJsonLd } from './jsonld';
import type { JsonLdNode } from './jsonld';
import {
  DEFAULT_OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  absoluteUrl,
  canonicalPath,
} from './site';

/**
 * Per-route `<head>` metadata, rendered from inside the page. The title format
 * and the description cut live in `./text.ts`; the Schema.org builders in
 * `./jsonld.ts`.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>` natively, so
 * there is no head-manager library: a page renders `<Seo …>` next to its
 * content and the tags follow the route. On the client React moves them into
 * the document head; `react-dom/server` emits them ahead of the page markup and
 * `scripts/prerender.mjs` writes them into each route's HTML, which is what
 * crawlers and link scrapers (none of which run the app) read.
 *
 * The output is a pure function of the props and the pathname, so the server
 * and the client agree byte for byte — a requirement for hydration, where React
 * adopts the prerendered head tags only when every attribute matches. Keep it
 * free of dates computed at render time, random ids and anything else that
 * differs between a build and a browser.
 *
 * `index.html` carries none of these tags (a static `<title>` would sit beside
 * the hoisted one), so a page without `<Seo>` has no title at all — every route
 * must mount it.
 */

export interface SeoImage {
  /** Site-relative path (`/og/blog.png`) or an absolute URL. */
  url: string;
  width?: number;
  height?: number;
  /** MIME type, e.g. `image/png`. Inferred from the extension when omitted. */
  type?: string;
  alt?: string;
}

export interface SeoArticle {
  /** `YYYY-MM-DD`. */
  publishedTime?: string;
  modifiedTime?: string;
  /** Free-form name; the Open Graph `article:author` string. */
  author?: string;
  section?: string;
  tags?: string[];
}

/** A translated copy of this page at its own URL — Phase B (`/es`, `/pt`). */
export interface SeoAlternate {
  hrefLang: string;
  href: string;
}

export interface SeoProps {
  title: string;
  description: string;
  /**
   * The route the canonical and og:url point at. Defaults to the current
   * pathname; query strings and hashes are never part of it, so a URL with
   * either still canonicalises to its plain path.
   */
  path?: string;
  type?: 'website' | 'article';
  /** Social card. A bare string is a path or URL; defaults to `/og/default.png`. */
  image?: string | SeoImage;
  /**
   * Keeps the page out of the index (404 states, unknown slugs). A noindex page
   * also omits its canonical and og:url: there is nothing to consolidate to.
   */
  noindex?: boolean;
  /** `article:*` tags; only emitted when `type` is `article`. */
  article?: SeoArticle;
  alternates?: SeoAlternate[];
  /**
   * Schema.org node(s). An array becomes one `@graph`; a single node is emitted
   * as-is (with `@context` added when missing).
   */
  jsonLd?: JsonLdNode | JsonLdNode[];
  /** Open Graph locale. English-only until per-language URLs exist. */
  locale?: string;
}

const IMAGE_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

const imageType = (url: string): string | undefined => {
  const ext = /\.[a-z0-9]+$/i.exec(url.replace(/[?#].*$/, ''))?.[0]?.toLowerCase();
  return ext ? IMAGE_TYPES[ext] : undefined;
};

/**
 * Every image under `/og/` is a generated 1200×630 card (see `site.ts`), so its
 * dimensions are known without being repeated at each call site. Anything else
 * only carries the dimensions the caller passed.
 */
function resolveImage(image: string | SeoImage | undefined, alt: string): Required<SeoImage> {
  const raw: SeoImage =
    typeof image === 'string' ? { url: image } : (image ?? { url: DEFAULT_OG_IMAGE });
  const generatedCard = raw.url.startsWith('/og/');
  return {
    url: absoluteUrl(raw.url),
    width: raw.width ?? (generatedCard ? OG_IMAGE_WIDTH : 0),
    height: raw.height ?? (generatedCard ? OG_IMAGE_HEIGHT : 0),
    type: raw.type ?? imageType(raw.url) ?? '',
    alt: raw.alt ?? alt,
  };
}

export const Seo = ({
  title,
  description,
  path,
  type = 'website',
  image,
  noindex = false,
  article,
  alternates,
  jsonLd,
  locale = 'en_US',
}: SeoProps) => {
  const { pathname } = useLocation();
  const url = absoluteUrl(canonicalPath(path ?? pathname));
  const img = resolveImage(image, title);
  const tags = article?.tags ? [...new Set(article.tags.filter(Boolean))] : [];

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      {!noindex && <link rel="canonical" href={url} />}

      <meta property="og:site_name" content="Fintela" />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={type} />
      {!noindex && <meta property="og:url" content={url} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img.url} />
      {img.width > 0 && <meta property="og:image:width" content={String(img.width)} />}
      {img.height > 0 && <meta property="og:image:height" content={String(img.height)} />}
      {img.type && <meta property="og:image:type" content={img.type} />}
      <meta property="og:image:alt" content={img.alt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img.url} />
      <meta name="twitter:image:alt" content={img.alt} />

      {type === 'article' && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {type === 'article' && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {type === 'article' && article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {type === 'article' && article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {type === 'article' &&
        tags.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {alternates?.map((alt) => (
        <link key={alt.hrefLang} rel="alternate" hrefLang={alt.hrefLang} href={alt.href} />
      ))}

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
    </>
  );
};
