import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead } from '../components/Prose';
import { docRegistry } from '../registry';
import '../blocks'; // register all blocks

// NavPath is used inside the individual blocks now — no local import needed

const toc = [
  { id: 'pipeline', title: 'The pipeline', level: 2 as const },
  { id: 'data-clusters', title: 'Asset groups', level: 2 as const },
  { id: 'additional-data', title: 'Additional data', level: 2 as const },
  { id: 'strategies', title: 'Strategies', level: 2 as const },
  { id: 'fitness-functions', title: 'Fitness functions', level: 2 as const },
  { id: 'risk-managers', title: 'Risk managers', level: 2 as const },
  { id: 'studies', title: 'Studies', level: 2 as const },
  { id: 'trials', title: 'Trials', level: 2 as const },
  { id: 'portfolios', title: 'Portfolios', level: 2 as const },
  { id: 'seed', title: 'Seed', level: 2 as const },
  { id: 'agents', title: 'Operations', level: 2 as const },
];

export const ConceptsPage = () => (
  <DocsLayout
    pageId="concepts"
    breadcrumbs={[{ label: 'Getting Started' }, { label: 'Core concepts' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#667eea',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Getting Started
      </Typography>
    </Box>
    <Heading id="concepts" level={1}>
      Core concepts
    </Heading>
    <Lead>
      A handful of building blocks carry you from market data to live capital. Each
      maps to a section in the UI — learn the concepts here, then follow the workflow
      guides to see them in action.
    </Lead>

    <Heading id="pipeline" level={2}>
      The pipeline
    </Heading>
    <P>
      Every trading idea on Fintela flows through the same sequence:
    </P>
    <Box
      component="pre"
      sx={{
        my: 3,
        p: 2.5,
        borderRadius: 2,
        bgcolor: '#0f1325',
        color: '#e6e8f0',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: { xs: '0.72rem', md: '0.85rem' },
        lineHeight: 1.7,
        overflow: 'auto',
        border: '1px solid rgba(102,126,234,0.18)',
      }}
    >{`Asset Group ──► Strategy ──► Fitness ──► Study ──► Portfolios ──► Operations
   market data    signals      score        search       results     Brokerage

               └────────── Risk Managers ──────────┘
                  governance layer · protect the portfolio
`}</Box>
    <P>
      Each step persists, can be reused, and is versioned — you build a library
      once and recombine pieces forever. For a visual map of the UI screens, see the{' '}
      <Box component="a" href="/documentation/platform" sx={{ color: '#667eea' }}>Platform tour</Box>.
    </P>

    {/* Concept sections — rendered from the shared block registry */}
    {docRegistry.render('data-clusters', 'full')}
    {docRegistry.render('additional-data', 'full')}
    {docRegistry.render('strategies', 'full')}
    {docRegistry.render('fitness-functions', 'full')}
    {docRegistry.render('risk-managers', 'full')}
    {docRegistry.render('studies', 'full')}

    <Heading id="trials" level={2}>
      Trials
    </Heading>
    <P>
      Each <strong>trial</strong> is one parameter sample. The optimizer picks a
      vector of parameter values, runs the strategy, evaluates fitness on each
      stage (train / validation / overall / OOS), and either succeeds or is
      pruned with a recorded failure reason.
    </P>
    <P>
      Train fitness is the value the search algorithm maximizes — it drives
      which parameter regions to explore next. Validation, overall, and OOS
      values are stored for analysis but do not influence the search.
    </P>

    {docRegistry.render('portfolios', 'full')}
    {docRegistry.render('seed', 'full')}
    {docRegistry.render('live-agents', 'full')}
  </DocsLayout>
);
