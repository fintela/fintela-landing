import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resourcesBackend } from './resources';
import {
  SUPPORTED_LNGS,
  FALLBACK_LNG,
  DEFAULT_NS,
  PRELOAD_NS,
  LNG_STORAGE_KEY,
} from './config';

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

export default i18n;
