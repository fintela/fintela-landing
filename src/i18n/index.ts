import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resourcesBackend } from './resources';
import common from './locales/en/common.json';
import glossary from './locales/en/glossary.json';
import header from './locales/en/header.json';
import footer from './locales/en/footer.json';
import home from './locales/en/home.json';
import pages from './locales/en/pages.json';
import solutions from './locales/en/solutions.json';
import {
  SUPPORTED_LNGS,
  FALLBACK_LNG,
  DEFAULT_NS,
  PRELOAD_NS,
  LNG_STORAGE_KEY,
} from './config';

/**
 * English ships inside the main bundle (~10 KB gzipped for all seven
 * namespaces). Every document is prerendered in English, so for the majority
 * of visitors the page hydrates with the catalogs already in memory: no
 * request per namespace, no Suspense round trip after the JS lands, and the
 * fallback language is there for es/pt keys that are still untranslated.
 * Spanish and Portuguese keep loading lazily through `resourcesBackend`
 * (`partialBundledLanguages` lets the two mechanisms coexist). Keep this map
 * equal to the set of files in locales/en — a namespace missing here would
 * silently fall back to a network chunk.
 */
const bundled = {
  [FALLBACK_LNG]: { common, glossary, header, footer, home, pages, solutions },
};

// Side-effect module: importing it once (from main.tsx) initialises the shared
// i18next singleton. Components consume it via react-i18next's useTranslation.
void i18n
  .use(resourcesBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: [...SUPPORTED_LNGS],
    fallbackLng: FALLBACK_LNG,
    defaultNS: DEFAULT_NS,
    fallbackNS: DEFAULT_NS,
    ns: [...PRELOAD_NS],
    resources: bundled,
    partialBundledLanguages: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LNG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: true },
    returnNull: false,
  });

/**
 * `<html lang>` follows the UI language. The document ships with `lang="en"`
 * (the prerendered language); a Spanish or Portuguese render must say so, or
 * screen readers pick the wrong voice, browsers offer to translate a page
 * that already is, and search engines mis-detect the language of the DOM.
 * `resolvedLanguage` rather than `language`: `es-MX` resolves to the `es`
 * catalog, and that is the language on screen.
 */
const syncHtmlLang = () => {
  if (typeof document === 'undefined') return;
  const lng = i18n.resolvedLanguage ?? i18n.language;
  if (lng) document.documentElement.lang = lng;
};
i18n.on('initialized', syncHtmlLang);
i18n.on('languageChanged', syncHtmlLang);
if (i18n.isInitialized) syncHtmlLang();

export default i18n;
