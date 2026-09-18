import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // Initialise the i18next singleton (en/es/pt)
import { seedJson } from './content/json';
import { FALLBACK_LNG, LNG_STORAGE_KEY, SUPPORTED_LNGS } from './i18n/config';
import type { SupportedLng } from './i18n/config';
import { canonicalPath } from './seo/site';

/** The language every prerendered document is written in. */
const PRERENDERED_LANG: SupportedLng = 'en';

/**
 * The query parameters that change what a page renders (`/contact?intent=`,
 * `/?for=`). A document prerendered without them cannot be hydrated with them.
 * Add to this list when a page starts reading a new one.
 */
const RENDER_AFFECTING_PARAMS = ['intent', 'for'];

/**
 * The JSON the prerender rendered this route from, embedded at the end of
 * <body> (`scripts/prerender.mjs`). Seeding it before the first render is what
 * lets the blog and docs hooks start `ready`, so the hydrated tree matches the
 * markup instead of flashing a spinner over an article that is already there.
 */
function seedEmbeddedData(): void {
  const el = document.getElementById('__fintela_data');
  if (!el?.textContent) return;
  try {
    const { json, partial } = JSON.parse(el.textContent) as {
      json?: Record<string, unknown>;
      partial?: Record<string, unknown>;
    };
    for (const [url, value] of Object.entries(json ?? {})) seedJson(url, value);
    for (const [url, value] of Object.entries(partial ?? {}))
      seedJson(url, value, { partial: true });
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[prerender] embedded data is not readable', err);
  }
}

/**
 * The language i18next is about to resolve, computed the way its detector
 * does (localStorage, then the browser's languages, first supported wins,
 * else the fallback) — before i18next has finished doing so, because the
 * decision to hydrate cannot wait for it. The inline script in index.html
 * runs the same logic to hide the prerendered English from non-English
 * visitors; keep the three in step.
 */
function preferredLanguage(): SupportedLng {
  const candidates: string[] = [];
  try {
    const stored = localStorage.getItem(LNG_STORAGE_KEY);
    if (stored) candidates.push(stored);
  } catch {
    // Storage may be blocked; the browser's own languages still decide.
  }
  candidates.push(...(navigator.languages ?? [navigator.language ?? '']));
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split('-')[0];
    if ((SUPPORTED_LNGS as readonly string[]).includes(base)) return base as SupportedLng;
  }
  return FALLBACK_LNG;
}

/**
 * Drop the prerendered head tags before a client-only render: React would add
 * its own beside them, and the browser shows the FIRST <title>, which would be
 * the English one. `<Seo>` owns these tags (index.html carries none), and the
 * hero's image preload is React-rendered too (HeroVideoBackdrop); the font
 * preloads come from the prerender script and stay.
 */
function stripPrerenderedHead(): void {
  const owned =
    'title, meta[name="description"], meta[name="robots"], link[rel="canonical"], ' +
    'meta[property^="og:"], meta[property^="article:"], meta[name^="twitter:"], ' +
    'link[rel="alternate"][hreflang], link[rel="preload"][as="image"]';
  document.head.querySelectorAll(owned).forEach((el) => el.remove());
}

/**
 * The route this document was prerendered for, read off its canonical — or
 * null for a document without one (the 404 page, the dev server). Until the
 * edge maps every path to its own document, a deep URL can arrive carrying the
 * home page's HTML; hydrating that against the pricing page would only produce
 * a mismatch and two titles.
 */
function prerenderedPath(): string | null {
  const href = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!href) return null;
  try {
    return canonicalPath(new URL(href, window.location.href).pathname);
  } catch {
    return null;
  }
}

function documentMatchesLocation(): boolean {
  if (prerenderedPath() !== canonicalPath(window.location.pathname)) return false;
  const params = new URLSearchParams(window.location.search);
  return !RENDER_AFFECTING_PARAMS.some((key) => params.has(key));
}

seedEmbeddedData();

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Hydrate only what will render the same: the document prerendered for this
// very URL, for a visitor whose language is the one it was rendered in. Anyone
// else (the dev server's empty #root, a Spanish or Portuguese preference, a
// fallback document served for another path) gets a plain client render from a
// cleared root — a hydration mismatch would cost more than it saves.
if (
  container.children.length > 0 &&
  documentMatchesLocation() &&
  preferredLanguage() === PRERENDERED_LANG
) {
  hydrateRoot(container, app, {
    onRecoverableError: (error, errorInfo) => {
      if (import.meta.env.DEV) console.error('[hydration]', error, errorInfo.componentStack);
    },
  });
} else {
  stripPrerenderedHead();
  container.replaceChildren();
  document.documentElement.removeAttribute('data-hide-prerender');
  createRoot(container).render(app);
}
