import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/ContactPage';

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

// Documentation. Twenty-five hand-written page components used to be listed here,
// one lazy import each; the pages are Markdown files in `content/docs/` now, so
// there are exactly two routes and adding a page touches neither this file nor any
// other (see DOCS.md).
const DocsIndexPage = lazy(() =>
  import('./pages/DocsIndexPage').then((m) => ({ default: m.DocsIndexPage })),
);
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
  platform: 'platform-tour',
  quickstart: 'quickstart',
  concepts: 'core-concepts',

  'workflows/strategies': 'managing-strategies',
  'workflows/risk-managers': 'managing-risk-managers',
  'workflows/studies': 'running-optimizations',
  'workflows/results': 'analyzing-results',
  'workflows/live-trading': 'live-trading',

  modes: 'execution-modes',
  'optimizer/samplers': 'sampler-selection',
  'configuration/additional-data': 'data-pipelines',
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
  'api/fitness-data': 'api-fitness-and-asset-groups',
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
  return <Navigate to={slug ? `/docs/${slug}${hash}` : '/docs'} replace />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return; // anchor links handle their own scroll
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const DocsLoader = () => (
  <Box
    sx={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <CircularProgress size={28} sx={{ color: '#667eea' }} />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Suspense fallback={<DocsLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Legal */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Documentation */}
            <Route path="/docs" element={<DocsIndexPage />} />
            <Route path="/docs/:slug" element={<DocPage />} />

            {/* Every pre-migration doc URL still resolves. */}
            <Route path="/documentation" element={<LegacyDocsRedirect />} />
            <Route path="/documentation/*" element={<LegacyDocsRedirect />} />

            {/* Everything else. CloudFront rewrites S3 404s to /index.html with a
                200 so the SPA can route; without this route that rewrite rendered
                a blank page for every typo'd URL and every removed static file. */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
