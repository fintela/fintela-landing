import resourcesToBackend from 'i18next-resources-to-backend';

// Each locale namespace becomes its own lazily-imported chunk. Vite turns this
// glob into a map of dynamic importers, so only the active language + the
// namespaces a route actually touches are ever fetched. English is not in the
// glob: index.ts bundles it statically (and i18next never asks a backend for
// a bundle it already holds), so listing it here would only emit chunks that
// nothing requests. Add a language here when it joins SUPPORTED_LNGS.
type JsonModule = { default: Record<string, unknown> };
const loaders = import.meta.glob<JsonModule>('./locales/{es,pt}/*.json');

export const resourcesBackend = resourcesToBackend(
  (language: string, namespace: string) => {
    const loader = loaders[`./locales/${language}/${namespace}.json`];
    if (!loader) {
      return Promise.reject(
        new Error(`[i18n] Missing locale resource: ${language}/${namespace}`),
      );
    }
    return loader().then((mod) => mod.default);
  },
);
