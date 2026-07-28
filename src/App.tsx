import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { HomePage } from './pages/HomePage';
import { ContactPage } from './pages/ContactPage';

// Both blog routes are code-split. Post bodies are inlined into the bundle at
// build time (see src/blog/posts.ts), and the post page also pulls in the markdown
// renderer + syntax highlighter — none of which belongs on the home page's
// critical path. Lazy loading keeps all of it in a chunk only /blog visitors fetch.
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() =>
  import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })),
);

// Legal pages — footer-only cold paths, code-split off the main bundle.
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);

// Docs is heavy — code-split it off the main bundle.
const DocsHomePage = lazy(() =>
  import('./docs/pages/DocsHomePage').then((m) => ({ default: m.DocsHomePage })),
);
const QuickstartPage = lazy(() =>
  import('./docs/pages/QuickstartPage').then((m) => ({ default: m.QuickstartPage })),
);
const ConceptsPage = lazy(() =>
  import('./docs/pages/ConceptsPage').then((m) => ({ default: m.ConceptsPage })),
);
const ModesOverviewPage = lazy(() =>
  import('./docs/pages/ModesOverviewPage').then((m) => ({ default: m.ModesOverviewPage })),
);
const ExternalStrategiesPage = lazy(() =>
  import('./docs/pages/ExternalStrategiesPage').then((m) => ({ default: m.ExternalStrategiesPage })),
);
const ExternalFitnessPage = lazy(() =>
  import('./docs/pages/ExternalFitnessPage').then((m) => ({ default: m.ExternalFitnessPage })),
);
const OptimizerArchitecturePage = lazy(() =>
  import('./docs/pages/OptimizerArchitecturePage').then((m) => ({
    default: m.OptimizerArchitecturePage,
  })),
);
const SamplersPage = lazy(() =>
  import('./docs/pages/SamplersPage').then((m) => ({ default: m.SamplersPage })),
);
const LifecyclePage = lazy(() =>
  import('./docs/pages/LifecyclePage').then((m) => ({ default: m.LifecyclePage })),
);
const ApiOverviewPage = lazy(() =>
  import('./docs/pages/ApiOverviewPage').then((m) => ({ default: m.ApiOverviewPage })),
);
const ApiStrategiesPage = lazy(() =>
  import('./docs/pages/ApiStrategiesPage').then((m) => ({ default: m.ApiStrategiesPage })),
);
const ApiStudiesPage = lazy(() =>
  import('./docs/pages/ApiStudiesPage').then((m) => ({ default: m.ApiStudiesPage })),
);
const ApiTrialsPortfoliosPage = lazy(() =>
  import('./docs/pages/ApiTrialsPortfoliosPage').then((m) => ({
    default: m.ApiTrialsPortfoliosPage,
  })),
);
const ApiBasketsPage = lazy(() =>
  import('./docs/pages/ApiBasketsPage').then((m) => ({ default: m.ApiBasketsPage })),
);
const ApiFitnessDataPage = lazy(() =>
  import('./docs/pages/ApiFitnessDataPage').then((m) => ({ default: m.ApiFitnessDataPage })),
);
const ApiErrorsPage = lazy(() =>
  import('./docs/pages/ApiErrorsPage').then((m) => ({ default: m.ApiErrorsPage })),
);
const PythonGuidePage = lazy(() =>
  import('./docs/pages/PythonGuidePage').then((m) => ({ default: m.PythonGuidePage })),
);
const NodeGuidePage = lazy(() =>
  import('./docs/pages/NodeGuidePage').then((m) => ({ default: m.NodeGuidePage })),
);
const PlatformTourPage = lazy(() =>
  import('./docs/pages/PlatformTourPage').then((m) => ({ default: m.PlatformTourPage })),
);
const WorkflowStrategiesPage = lazy(() =>
  import('./docs/pages/WorkflowStrategiesPage').then((m) => ({ default: m.WorkflowStrategiesPage })),
);
const WorkflowRiskManagersPage = lazy(() =>
  import('./docs/pages/WorkflowRiskManagersPage').then((m) => ({
    default: m.WorkflowRiskManagersPage,
  })),
);
const AdditionalDataPage = lazy(() =>
  import('./docs/pages/AdditionalDataPage').then((m) => ({ default: m.AdditionalDataPage })),
);
const WorkflowStudiesPage = lazy(() =>
  import('./docs/pages/WorkflowStudiesPage').then((m) => ({ default: m.WorkflowStudiesPage })),
);
const WorkflowResultsPage = lazy(() =>
  import('./docs/pages/WorkflowResultsPage').then((m) => ({ default: m.WorkflowResultsPage })),
);
const WorkflowLiveTradingPage = lazy(() =>
  import('./docs/pages/WorkflowLiveTradingPage').then((m) => ({ default: m.WorkflowLiveTradingPage })),
);

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
            <Route path="/documentation" element={<DocsHomePage />} />
            <Route path="/documentation/quickstart" element={<QuickstartPage />} />
            <Route path="/documentation/concepts" element={<ConceptsPage />} />

            <Route path="/documentation/modes" element={<ModesOverviewPage />} />
            <Route path="/documentation/modes/external-strategies" element={<ExternalStrategiesPage />} />
            <Route path="/documentation/modes/external-fitness" element={<ExternalFitnessPage />} />

            <Route path="/documentation/optimizer/architecture" element={<OptimizerArchitecturePage />} />
            <Route path="/documentation/optimizer/samplers" element={<SamplersPage />} />
            <Route path="/documentation/configuration/additional-data" element={<AdditionalDataPage />} />
            <Route path="/documentation/optimizer/lifecycle" element={<LifecyclePage />} />

            <Route path="/documentation/api" element={<ApiOverviewPage />} />
            <Route path="/documentation/api/strategies" element={<ApiStrategiesPage />} />
            <Route path="/documentation/api/studies" element={<ApiStudiesPage />} />
            <Route path="/documentation/api/trials-portfolios" element={<ApiTrialsPortfoliosPage />} />
            <Route path="/documentation/api/baskets" element={<ApiBasketsPage />} />
            <Route path="/documentation/api/fitness-data" element={<ApiFitnessDataPage />} />
            <Route path="/documentation/api/errors" element={<ApiErrorsPage />} />

            <Route path="/documentation/platform" element={<PlatformTourPage />} />

            <Route path="/documentation/workflows/strategies" element={<WorkflowStrategiesPage />} />
            <Route path="/documentation/workflows/risk-managers" element={<WorkflowRiskManagersPage />} />
            <Route path="/documentation/workflows/studies" element={<WorkflowStudiesPage />} />
            <Route path="/documentation/workflows/results" element={<WorkflowResultsPage />} />
            <Route path="/documentation/workflows/live-trading" element={<WorkflowLiveTradingPage />} />

            <Route path="/documentation/guides/python" element={<PythonGuidePage />} />
            <Route path="/documentation/guides/node" element={<NodeGuidePage />} />

            {/* Legacy doc routes — redirect into the new system */}
            <Route path="/documentation/datacluster" element={<Navigate to="/documentation/concepts" replace />} />
            <Route path="/documentation/engine" element={<Navigate to="/documentation/optimizer/architecture" replace />} />
            <Route path="/documentation/roles" element={<Navigate to="/documentation/api" replace />} />

            {/* Unknown docs paths → docs home */}
            <Route path="/documentation/*" element={<Navigate to="/documentation" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
