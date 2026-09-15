/// <reference types="vite/client" />

/**
 * Every `VITE_*` variable the app reads. All optional: the site builds and runs
 * with none of them set (README.md "Getting started"), and `.env.example`
 * documents the one that matters.
 */
interface ImportMetaEnv {
  /** Where the contact form posts. See src/contact/api.ts and .env.example. */
  readonly VITE_FINTELA_API?: string;
  /** Repoint a content collection at another origin (a preview bucket, say). */
  readonly VITE_BLOG_BASE_URL?: string;
  readonly VITE_BLOG_ASSET_BASE_URL?: string;
  readonly VITE_DOCS_BASE_URL?: string;
  readonly VITE_MEDIA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
