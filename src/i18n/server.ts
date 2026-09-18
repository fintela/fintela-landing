import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_NS, FALLBACK_LNG, SUPPORTED_LNGS } from './config';
import type { SupportedLng } from './config';

/**
 * The i18next singleton as the prerender needs it: every catalog bundled and
 * initialised synchronously, so `renderToString` (which cannot wait for a
 * namespace to load) sees translated strings on its one pass.
 *
 * The browser counterpart is `./index.ts`: same namespaces, same defaults, but
 * lazy per-namespace chunks behind Suspense and a language detector. The two
 * must agree on `defaultNS`/`fallbackNS`/`load`, or a key that resolves in one
 * would miss in the other and the prerendered markup would not match the
 * hydrated tree. `useSuspense` is off here because nothing can suspend on the
 * server; on the client the boundary in `AppRoutes` catches it.
 */

type JsonModule = { default: Record<string, unknown> };
const modules = import.meta.glob<JsonModule>('./locales/*/*.json', { eager: true });

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [file, mod] of Object.entries(modules)) {
  const match = /locales\/([a-z]+)\/([a-z]+)\.json$/.exec(file);
  if (!match) continue;
  (resources[match[1]] ??= {})[match[2]] = mod.default;
}

const namespaces = [...new Set(Object.values(resources).flatMap((byNs) => Object.keys(byNs)))];

/** Initialise (once) and switch to `lng`. Resolves when the catalogs are active. */
export async function initServerI18n(lng: SupportedLng): Promise<typeof i18n> {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      lng,
      supportedLngs: [...SUPPORTED_LNGS],
      fallbackLng: FALLBACK_LNG,
      defaultNS: DEFAULT_NS,
      fallbackNS: DEFAULT_NS,
      ns: namespaces,
      resources,
      load: 'languageOnly',
      interpolation: { escapeValue: false }, // React already escapes
      react: { useSuspense: false },
      returnNull: false,
      // Synchronous init (i18next 26 renamed `initImmediate: false`): the
      // resources are already here, and the renderer needs `t()` answering on
      // the very first call.
      initAsync: false,
    });
  } else if (i18n.resolvedLanguage !== lng) {
    await i18n.changeLanguage(lng);
  }
  return i18n;
}
