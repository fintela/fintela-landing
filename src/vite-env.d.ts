/// <reference types="vite/client" />

/**
 * A still imported with vite-imagetools' picture directive, e.g.
 * `import still from './x.jpg?w=800;1600&format=avif;webp;jpg&as=picture'`
 * (vite.config.ts wires the plugin). `as=picture` has to be the last
 * parameter: this wildcard is how TypeScript tells such an import apart from
 * a plain `*.jpg` one (a URL string).
 */
declare module '*&as=picture' {
  import type { Picture } from './media/picture';
  const picture: Picture;
  export default picture;
}

/**
 * Every `VITE_*` variable the app reads. All optional: the site builds and runs
 * with none of them set (README.md "Getting started"), and `.env.example`
 * documents the one that matters.
 */
interface ImportMetaEnv {
  /** Where the contact form posts. See src/contact/api.ts and .env.example. */
  readonly VITE_FINTELA_API?: string;
  /**
   * The site's public origin, no trailing slash (default https://fintela.io).
   * Canonicals, og:url, JSON-LD ids, sitemaps and the feed derive from it —
   * see src/seo/site.ts.
   */
  readonly VITE_SITE_URL?: string;
  /** Search Console HTML-tag token; vite.config.ts injects the meta when set. */
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string;
  /** Repoint a content collection at another origin (a preview bucket, say). */
  readonly VITE_BLOG_BASE_URL?: string;
  readonly VITE_BLOG_ASSET_BASE_URL?: string;
  readonly VITE_DOCS_BASE_URL?: string;
  readonly VITE_MEDIA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
