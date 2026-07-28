// Central i18n constants for the landing site. Mirrors the frontend app's
// config but with landing-appropriate preloaded namespaces. Kept free of
// i18next imports so it can be consumed from anywhere.

export const SUPPORTED_LNGS = ['en', 'es', 'pt'] as const;
export type SupportedLng = (typeof SUPPORTED_LNGS)[number];

export const FALLBACK_LNG: SupportedLng = 'en';

/** Default namespace used when a key carries no `ns:` prefix. */
export const DEFAULT_NS = 'common';

/**
 * Namespaces preloaded on init. Header/Footer copy (`header`, `footer`) is
 * added here once those buckets are extracted, since they render on every page.
 */
export const PRELOAD_NS = ['common', 'glossary', 'header', 'footer'] as const;

/** localStorage key the language detector reads/writes. */
export const LNG_STORAGE_KEY = 'fintela-lng';

/** Human-readable language names (endonyms) for the switcher — not translated. */
export const LNG_LABELS: Record<SupportedLng, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
};
