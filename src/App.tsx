import { Suspense, lazy, useEffect } from 'react';
import type { ComponentType } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useParams,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { gradients } from './theme/tokens';
import { HomePage } from './pages/HomePage';
import { SOLUTION_PATHS } from './solutions/registry';
import { ScrollProgressBar } from './components/common/ScrollProgressBar';
import { FloatingContactButton } from './components/common/FloatingContactButton';
import { CookieConsentBanner } from './components/common/CookieConsentBanner';
import { IconGradientDefs } from './components/primitives/IconGradientDefs';
import { SearchProvider } from './search/SearchProvider';

// Contact is a cold path like every route below: its form pulls in TextField,
// ToggleButton, Alert and their Popover/Modal chain, none of which the home
// page needs. Eagerly imported once, it was the single largest avoidable slice
// of the main chunk.
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);

// Both blog routes are code-split. Post bodies are fetched from the CDN at runtime
// (see BLOG.md), and the post page also pulls in the markdown renderer + syntax
// highlighter — none of which belongs on the home page's critical path. Lazy
// loading keeps all of it in a chunk only /blog visitors fetch.
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() =>
  import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })),
);

// Catch-all for unmatched paths. Cold by definition, so it is code-split too.
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

// Legal pages — footer-only cold paths, code-split off the main bundle.
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const RiskDisclosuresPage = lazy(() =>
  import('./pages/RiskDisclosuresPage').then((m) => ({ default: m.RiskDisclosuresPage })),
);

// Pricing — a cold, self-contained page reached from the header, so it is split
// off the home page's bundle like every other route below the fold.
const PricingPage = lazy(() =>
  import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })),
);

// Solutions — one template for the three seats (`src/solutions/registry.ts`),
// so all three share a chunk. `/solutions/hedge-funds` is where the home page's
// institutional CTA lands.
const SolutionPage = lazy(() =>
  import('./pages/SolutionPage').then((m) => ({ default: m.SolutionPage })),
);

// Product menu's "Agentic AI" item — the Fintelligent band, split off the
// home page's bundle now that it lives on its own route.
const AgenticAiPage = lazy(() =>
  import('./pages/AgenticAiPage').then((m) => ({ default: m.AgenticAiPage })),
);

// Product menu's "Samplers" item — the optimization algorithms reference.
const SamplersPage = lazy(() =>
  import('./pages/SamplersPage').then((m) => ({ default: m.SamplersPage })),
);

// Product menu's "In-Depth Analysis" item — the Data Explorer catalog plus a
// worked strategy robustness/clustering/optimization report.
const InDepthAnalysisPage = lazy(() =>
  import('./pages/InDepthAnalysisPage').then((m) => ({ default: m.InDepthAnalysisPage })),
);

// Product menu's "Fintela API" item — a marketing overview of the read-only
// developer API, linking through to the full reference under /docs.
const FintelaApiPage = lazy(() =>
  import('./pages/FintelaApiPage').then((m) => ({ default: m.FintelaApiPage })),
);

// Documentation. Twenty-five hand-written page components used to be listed here,
// one lazy import each; the pages are Markdown files in `content/docs/` now, so
// there is exactly one route and adding a page touches neither this file nor any
// other (see DOCS.md).
const DocPage = lazy(() => import('./pages/DocPage').then((m) => ({ default: m.DocPage })));

/**
 * Where `/documentation/*` went.
 *
 * These URLs were public, are linked from the app and from outside it, and are
 * indexed — so every one of them keeps working. Nested paths flatten to a slug
 * because a doc's URL is now its filename, wherever the file is filed.
 */
const LEGACY_DOC_PATHS: Record<string, string> = {
  '': 'overview',
  platform: 'navigation',
  quickstart: 'quickstart',
  concepts: 'core-concepts',

  'workflows/strategies': 'strategies',
  'workflows/risk-managers': 'risk-managers',
  'workflows/studies': 'studies',
  'workflows/results': 'analyzing-results',
  'workflows/live-trading': 'live-trading',

  modes: 'execution-modes',
  'optimizer/samplers': 'sampler-selection',
  'configuration/additional-data': 'data-explorer',
  'optimizer/lifecycle': 'study-lifecycle',

  'modes/external-strategies': 'external-strategies',
  'modes/external-fitness': 'external-fitness',
  'optimizer/architecture': 'optimizer-architecture',

  'guides/python': 'python-fastapi',
  'guides/node': 'node-express',

  api: 'api-overview',
  'api/strategies': 'api-strategies',
  'api/studies': 'api-studies',
  'api/trials-portfolios': 'api-trials-portfolios',
  'api/baskets': 'api-baskets',
  'api/fitness-data': 'api-fitness',
  'api/errors': 'api-errors',

  // Routes that were already redirects before the migration, kept pointing at the
  // page that replaced them rather than chaining through a second hop.
  datacluster: 'core-concepts',
  engine: 'optimizer-architecture',
  roles: 'api-overview',
};

/**
 * `/documentation/...` → `/docs/...`, or the docs index for anything unrecognised.
 *
 * A reader who mistypes a doc URL wants the docs, not a 404 — the same reason the
 * old `/documentation/*` catch-all redirected to the docs home.
 */
function LegacyDocsRedirect() {
  const { pathname, hash } = useLocation();
  const tail = pathname.replace(/^\/documentation\/?/, '').replace(/\/+$/, '');
  const slug = LEGACY_DOC_PATHS[tail];
  return <Navigate to={`/docs/${slug ?? 'overview'}${hash}`} replace />;
}

/**
 * Where a RENAMED doc page went.
 *
 * A page's URL is its filename, so regrouping the tree into its current sections
 * moved six URLs. These are different from `LEGACY_DOC_PATHS` above: those serve
 * the pre-Markdown `/documentation/*` tree, while every key here was a live,
 * indexed `/docs/*` URL under the current system. Without this map, renaming a
 * file is a silent 404 for anyone holding the old link.
 *
 * Keep an entry forever once added — the cost is one map lookup, and the whole
 * point is that the old URL never stops resolving.
 */
const DOC_SLUG_REDIRECTS: Record<string, string> = {
  'platform-tour': 'navigation',

  // The three workflow guides became the registry pages that own their topic.
  'managing-strategies': 'strategies',
  'managing-risk-managers': 'risk-managers',
  'running-optimizations': 'studies',

  // Data Pipelines was retired in the app — `/data-pipelines/*` there redirects to
  // the Data Explorer, which is now where you browse what a data source contains.
  'data-pipelines': 'data-explorer',

  // Split in two. Fitness keeps the inbound traffic; asset groups got its own page.
  'api-fitness-and-asset-groups': 'api-fitness',
};

/**
 * One `/docs/:slug` route that redirects a renamed page and renders everything else.
 *
 * The redirect is decided here rather than inside `DocPage` so a renamed slug never
 * mounts the page, fetches its JSON, and 404s before bouncing.
 */
function DocPageOrRedirect({ page: Page }: { page: ComponentType }) {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const renamed = slug ? DOC_SLUG_REDIRECTS[slug] : undefined;
  return renamed ? <Navigate to={`/docs/${renamed}${hash}`} replace /> : <Page />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // anchor links handle their own scroll
    // `instant`, not the html's `scroll-behavior: smooth`: a route change is
    // a new page, and a new page must not slide in from where the last one
    // was scrolled to. In-page navigation (src/lib/scrollToSection.ts) is
    // the one place that animates.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

/**
 * What a lazy route shows while its chunk is on the way: a thin progress bar
 * pinned to the top edge over a full-height empty ground. Nothing sits in the
 * middle of the viewport, so the header does not jump around a spinner and
 * the incoming page replaces blank ground rather than a centred widget. Full
 * height keeps the scrollbar (and so the layout width) stable through the
 * transition. It is never part of a prerendered document — the server renders
 * every page eagerly — so it only ever appears on a client-side transition.
 */
const RouteFallback = () => (
  <Box aria-hidden="true" sx={{ minHeight: '100dvh' }}>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (t) => t.zIndex.appBar + 1,
        overflow: 'hidden',
        pointerEvents: 'none',
        '& > span': {
          display: 'block',
          height: '100%',
          width: '40%',
          background: gradients.brandHorizontal,
          animation: 'fintela-route-progress 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        },
        '@keyframes fintela-route-progress': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(250%)' },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& > span': { animation: 'none', width: '100%' },
        },
      }}
    >
      <span />
    </Box>
  </Box>
);

/**
 * The page component behind each route. The browser build passes the lazy
 * wrappers above; the prerenderer (`src/entry-server.tsx`) passes the pages
 * imported eagerly, since `React.lazy` cannot resolve inside `renderToString`.
 */
export interface Pages {
  HomePage: ComponentType;
  BlogPage: ComponentType;
  BlogPostPage: ComponentType;
  ContactPage: ComponentType;
  PricingPage: ComponentType;
  SolutionPage: ComponentType;
  AgenticAiPage: ComponentType;
  SamplersPage: ComponentType;
  InDepthAnalysisPage: ComponentType;
  FintelaApiPage: ComponentType;
  TermsPage: ComponentType;
  PrivacyPage: ComponentType;
  RiskDisclosuresPage: ComponentType;
  DocPage: ComponentType;
  NotFoundPage: ComponentType;
}

const lazyPages: Pages = {
  HomePage,
  BlogPage,
  BlogPostPage,
  ContactPage,
  PricingPage,
  SolutionPage,
  AgenticAiPage,
  SamplersPage,
  InDepthAnalysisPage,
  FintelaApiPage,
  TermsPage,
  PrivacyPage,
  RiskDisclosuresPage,
  DocPage,
  NotFoundPage,
};

/**
 * The route table, shared by the browser app and the build-time prerender so
 * the two can never disagree about what a URL renders.
 *
 * The Suspense boundary lives here rather than in `App` on purpose: the server
 * markup must carry the same boundary the client renders, or a lazy page that
 * suspends while hydrating has no dehydrated boundary to wait in. Its fallback
 * never shows on a prerendered route — the server HTML stays on screen until
 * the chunk arrives.
 */
export function AppRoutes({ pages }: { pages: Pages }) {
  return (
    <SearchProvider>
      <IconGradientDefs />
      <ScrollToTop />
      <ScrollProgressBar />
      <FloatingContactButton />
      <CookieConsentBanner />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<pages.HomePage />} />
          <Route path="/blog" element={<pages.BlogPage />} />
          <Route path="/blog/:slug" element={<pages.BlogPostPage />} />
          <Route path="/contact" element={<pages.ContactPage />} />
          <Route path="/pricing" element={<pages.PricingPage />} />

          {/* Solutions — `/solutions` has no index of its own; it lands on the
              fund page, the way `/docs` lands on the overview. */}
          <Route path="/solutions" element={<Navigate to={SOLUTION_PATHS.funds} replace />} />
          <Route path="/solutions/:slug" element={<pages.SolutionPage />} />

          <Route path="/product/agentic-ai" element={<pages.AgenticAiPage />} />
          <Route path="/product/samplers" element={<pages.SamplersPage />} />
          <Route path="/product/in-depth-analysis" element={<pages.InDepthAnalysisPage />} />
          <Route path="/product/fintela-api" element={<pages.FintelaApiPage />} />

          {/* Legal */}
          <Route path="/terms" element={<pages.TermsPage />} />
          <Route path="/privacy" element={<pages.PrivacyPage />} />
          <Route path="/risk-disclosures" element={<pages.RiskDisclosuresPage />} />

          {/* Documentation — `/docs` has no page of its own; it lands readers on
              the overview doc, with the full sidebar/search chrome, instead of
              an intermediate index of cards. */}
          <Route path="/docs" element={<Navigate to="/docs/overview" replace />} />
          <Route path="/docs/:slug" element={<DocPageOrRedirect page={pages.DocPage} />} />

          {/* Every pre-migration doc URL still resolves. */}
          <Route path="/documentation" element={<LegacyDocsRedirect />} />
          <Route path="/documentation/*" element={<LegacyDocsRedirect />} />

          {/* Everything else. CloudFront rewrites S3 404s to /index.html with a
              200 so the SPA can route; without this route that rewrite rendered
              a blank page for every typo'd URL and every removed static file.
              The prerender writes this page to dist/404.html so the edge can
              serve a real 404 once it is configured to. */}
          <Route path="*" element={<pages.NotFoundPage />} />
        </Routes>
      </Suspense>
    </SearchProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Router>
        <AppRoutes pages={lazyPages} />
      </Router>
    </ThemeProvider>
  );
}

export default App;
