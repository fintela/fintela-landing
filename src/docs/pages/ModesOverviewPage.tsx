import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C, Ul } from '../components/Prose';
import { DataTable } from '../components/DataTable';
import { Callout } from '../components/Callout';
import { gradients } from '../../theme/tokens';

const toc = [
  { id: 'modes', title: 'Modes overview', level: 2 as const },
  { id: 'matrix', title: 'The 2×2 matrix', level: 2 as const },
  { id: 'when-to-use', title: 'When to use each mode', level: 2 as const },
  { id: 'mixing', title: 'Mixing modes', level: 2 as const },
];

export const ModesOverviewPage = () => (
  <DocsLayout
    pageId="modes-overview"
    breadcrumbs={[{ label: 'Optimization Modes' }, { label: 'Overview' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Optimization Modes
      </Typography>
    </Box>
    <Heading id="modes" level={1}>
      Modes overview
    </Heading>
    <Lead>
      Strategies and fitness functions each run in one of two execution modes —
      <strong>internal</strong> (Python hosted by Fintela) or <strong>external</strong>{' '}
      (HTTPS endpoint hosted by you). They can be combined freely, giving four
      ways to wire up an optimization study.
    </Lead>

    <Heading id="matrix" level={2}>
      The 2×2 matrix
    </Heading>

    <Box
      sx={{
        my: 3,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
        gap: 2,
      }}
    >
      <ModeCard
        title="Internal × Internal"
        complexity="Low"
        complexityColor="#10b981"
        description="Both strategy and fitness are Python stored in Fintela. Fastest to ship, no infra to run."
        useCase="Quick prototyping, classic technical signals, standard scoring."
      />
      <ModeCard
        title="Internal × External"
        complexity="Medium"
        complexityColor="#f59e0b"
        description="Strategy lives in Fintela; fitness scoring lives behind your endpoint."
        useCase="Custom or regulator-aware scoring that must stay on your infra."
      />
      <ModeCard
        title="External × Internal"
        complexity="Medium"
        complexityColor="#f59e0b"
        description="Proprietary signal logic stays on your servers; Fintela handles scoring."
        useCase="When your alpha is the strategy and you don't want to share the code."
      />
      <ModeCard
        title="External × External"
        complexity="High"
        complexityColor="#ef4444"
        description="Fully self-hosted strategy + fitness. Fintela is pure orchestration."
        useCase="Fully air-gapped research stacks. Maximum control."
      />
    </Box>

    <Heading id="when-to-use" level={2}>
      When to use each mode
    </Heading>
    <DataTable
      headers={['Mode', 'Strategy execution', 'Fitness execution', 'Hosting required']}
      cols="1.2fr 1.4fr 1.4fr 1fr"
      rows={[
        [<><C>internal × internal</C></>, 'In-process Python', 'In-process Python', 'None'],
        [<><C>internal × external</C></>, 'In-process Python', <>HTTPS <C>POST /evaluate</C></>, 'Fitness endpoint'],
        [<><C>external × internal</C></>, <>HTTPS <C>POST /simulate</C></>, 'In-process Python', 'Strategy endpoint'],
        [<><C>external × external</C></>, <>HTTPS <C>POST /simulate</C></>, <>HTTPS <C>POST /evaluate</C></>, 'Both endpoints'],
      ]}
    />

    <Callout variant="tip" title="Start internal, graduate external">
      The fastest learning loop is to start with internal × internal — there's no
      infrastructure to deploy. Once you've validated the workflow, externalize
      whichever piece you want to keep proprietary.
    </Callout>

    <Heading id="mixing" level={2}>
      Mixing modes
    </Heading>
    <P>
      Mode is set per <strong>strategy record</strong> and per{' '}
      <strong>fitness record</strong>, not per study. A study just references
      ids — the optimizer reads each record's <C>execution_type</C> at runtime
      and dispatches accordingly.
    </P>
    <P>
      That means you can:
    </P>
    <Ul>
      <li>Build a library of internal strategies and one external fitness — combine freely</li>
      <li>Swap an internal fitness for an external one without touching the study config</li>
      <li>Run the same external strategy against different fitness functions to test scoring sensitivity</li>
    </Ul>

    <Callout variant="warning" title="Mode is immutable">
      Once a strategy or fitness is created with <C>execution_type: "internal"</C>,
      you cannot flip it to external (or vice versa) — create a new record
      instead. This is enforced both in the UI and at the API layer.
    </Callout>

    <Callout variant="info" title="Risk managers follow the same pattern">
      The internal / external split is not unique to strategies and fitness functions.
      Risk managers can also run inside Fintela — as built-in rules, no-code rule-based
      combinations, or custom Python — or externally behind your own endpoint. See{' '}
      <Box component="a" href="/documentation/workflows/risk-managers" sx={{ color: '#667eea' }}>
        Managing risk managers
      </Box>{' '}
      for the details.
    </Callout>
  </DocsLayout>
);

const ModeCard = ({
  title,
  complexity,
  complexityColor,
  description,
  useCase,
}: {
  title: string;
  complexity: string;
  complexityColor: string;
  description: string;
  useCase: string;
}) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: gradients.brand,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, mt: 0.5 }}>
      <Typography
        sx={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'text.primary',
          letterSpacing: '-0.005em',
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          px: 0.75,
          py: 0.2,
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: complexityColor,
          bgcolor: `${complexityColor}15`,
          borderRadius: 1,
        }}
      >
        {complexity}
      </Box>
    </Box>
    <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.55, mb: 1.5 }}>
      {description}
    </Typography>
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box
        sx={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: 'text.disabled',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          mt: '2px',
        }}
      >
        Use
      </Box>
      <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.5 }}>
        {useCase}
      </Typography>
    </Box>
  </Box>
);
