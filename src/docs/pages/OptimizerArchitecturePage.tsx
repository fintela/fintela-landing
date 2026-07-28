import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { DataTable } from '../components/DataTable';
import { Callout } from '../components/Callout';

const toc = [
  { id: 'architecture', title: 'Architecture', level: 2 as const },
  { id: 'components', title: 'Component overview', level: 2 as const },
  { id: 'pipeline', title: 'The optimization pipeline', level: 2 as const },
  { id: 'performance', title: 'Performance', level: 2 as const },
  { id: 'parallelism', title: 'Parallelism model', level: 2 as const },
  { id: 'persistence', title: 'Results persistence', level: 2 as const },
];

export const OptimizerArchitecturePage = () => (
  <DocsLayout
    pageId="architecture"
    breadcrumbs={[{ label: 'Optimizer Engine' }, { label: 'Architecture' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Optimizer Engine
      </Typography>
    </Box>
    <Heading id="architecture" level={1}>
      Architecture
    </Heading>
    <Lead>
      Fintela's optimization platform is a multi-layer system: a React
      frontend, a REST API layer, a validation service, and a distributed
      optimization engine that runs parallel workers against a shared
      persistent store.
    </Lead>

    <Heading id="components" level={2}>
      Component overview
    </Heading>

    <ArchitectureDiagram />

    <DataTable
      headers={['Layer', 'Role']}
      cols="1fr 2fr"
      rows={[
        ['React frontend', 'Strategy / fitness / study management + analytics dashboard'],
        ['API layer', 'JSON over HTTPS, authentication, request validation'],
        ['Validation service', 'Validates internal and external strategies before study launch'],
        ['Execution service', 'One-off sandbox runs and strategy dry-runs'],
        ['Optimization engine', 'Schedules and orchestrates distributed optimizer workers'],
        ['Optimizer workers', 'Run the search algorithm + simulation engine in parallel'],
        ['Persistent store', 'All study, trial, portfolio, and sampler state'],
      ]}
    />

    <Heading id="pipeline" level={2}>
      The optimization pipeline
    </Heading>
    <P>
      Once a study is <C>QUEUED</C>, the optimization engine takes over. Each
      cycle of the worker produces a batch of trials sized to the available
      compute.
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
        fontSize: { xs: '0.72rem', md: '0.82rem' },
        lineHeight: 1.7,
        overflow: 'auto',
        border: '1px solid rgba(102,126,234,0.18)',
      }}
    >{`while completed < n_trials:
    params     = propose_next_batch(batch_size)      # search algorithm picks candidates

    signals    = generate_signals(params)            # parallel
    portfolios = run_simulations(signals)            # high-performance batch
    fitnesses  = evaluate_fitness(portfolios.stages) # parallel

    validate(fitnesses)                              # prune on NaN
    persist(portfolios)                              # single transaction
    record_results(params, fitnesses.train)          # update the search model`}</Box>

    <P>
      The simulation engine is the performance core of the platform. It
      processes an entire batch of trials concurrently, which is why
      larger batch sizes amortize the scheduling overhead well.
    </P>

    <Heading id="performance" level={2}>
      Performance
    </Heading>
    <P>
      The simulation and search engines at the heart of the platform are{' '}
      <strong>compiled to native machine code</strong>. That gives the throughput of a
      systems-grade execution path — tight memory layouts, no interpreter overhead,
      aggressive vectorization where the math permits — while the parts of the
      platform you touch directly stay high-level and approachable.
    </P>
    <P>
      Work runs in parallel at <strong>four levels at once</strong>:
    </P>
    <DataTable
      headers={['Level', 'What happens in parallel']}
      cols="1fr 2fr"
      rows={[
        ['Across studies', 'Many independent studies can run concurrently across the available compute pool.'],
        ['Within a study', 'Each study can dispatch multiple parallel workers that share its search state.'],
        ['Within a batch', 'A single worker evaluates a full batch of trials in lockstep, instead of one at a time.'],
        ['Within a trial', 'Per-trial work — advancing the calendar, computing signals, evaluating risk managers — is vectorized across instruments.'],
      ]}
    />
    <Callout variant="tip" title="Where the time actually goes">
      Pure orchestration overhead per trial is negligible. Almost all wall-clock time
      is spent on the actual backtest math, which is what should be expensive — so
      throwing more compute at a study translates almost linearly into more trials per
      minute. When external endpoints are involved, their latency and concurrency
      limits become the practical bottleneck long before Fintela's internals do.
    </Callout>

    <Heading id="parallelism" level={2}>
      Parallelism model
    </Heading>
    <DataTable
      headers={['Level', 'Mechanism', 'Tunable']}
      cols="1fr 1.5fr 1fr"
      rows={[
        ['Per study (workers)', 'Engine launches multiple parallel workers per study', 'Per-study setting'],
        ['Per worker (batches)', 'Each worker runs a batch sized to available CPU cores', 'Implicit'],
        ['Per batch (rows)', 'Simulation engine processes all parameter samples concurrently', 'Implicit'],
        ['External HTTP', 'Connection pool per worker to your endpoint', <><C>max_concurrency</C></>],
        ['Search coordination', 'Shared state store visible across all workers', '—'],
      ]}
    />
    <Callout variant="info" title="Distributed-safe sampling">
      When more than one worker runs against the same study, the TPE sampler
      automatically enables a distributed-safe mode. This prevents workers from
      suggesting identical parameter combinations while they wait for each
      other's results.
    </Callout>

    <Heading id="persistence" level={2}>
      Results persistence
    </Heading>
    <P>
      Every surviving trial writes to five tables in a single transaction at the
      end of its batch:
    </P>
    <DataTable
      headers={['Record', 'What is stored']}
      cols="1fr 2fr"
      rows={[
        ['Trial', 'Study reference, trial number, state, start and completion timestamps'],
        ['Trial parameters', 'One entry per parameter: name, sampled value, distribution'],
        ['Trial objective', 'The train fitness value used to update the search model'],
        ['Portfolio', 'Realized backtest data per trial — equity curve, trades, period metrics'],
        ['Trial failure', 'Failure reason for PRUNED trials only'],
      ]}
    />
    <P>
      Period metrics (Sharpe, Sortino, drawdown, etc.) for every stage are
      attached to each portfolio so the analytics endpoints can answer arbitrary
      stage-filtered queries without recomputation.
    </P>
  </DocsLayout>
);

const ArchitectureDiagram = () => (
  <Box
    sx={{
      my: 3,
      p: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fafbfc',
      overflowX: 'auto',
    }}
  >
    <Box
      component="svg"
      viewBox="0 0 720 360"
      sx={{ width: '100%', maxWidth: 720, mx: 'auto', display: 'block' }}
      aria-label="Architecture diagram showing the frontend, API layer, validation and execution services, optimization engine, optimizer workers, and persistent store"
    >
      <defs>
        <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#f093fb" />
        </linearGradient>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Browser */}
      <ArchBox x={20} y={20} w={140} h={56} label="React Frontend" sub="Dashboard + CRUD" />

      {/* API Layer */}
      <ArchBox x={210} y={20} w={140} h={56} label="API Layer" sub="auth + validation" accent />

      {/* Validation */}
      <ArchBox x={210} y={108} w={140} h={56} label="Validation Service" sub="strategies + fitness" />

      {/* Engine */}
      <ArchBox x={210} y={196} w={140} h={56} label="Optimization Engine" sub="schedules workers" />

      {/* Persistent store */}
      <ArchBox x={400} y={108} w={140} h={56} label="Persistent Store" sub="all study state" />

      {/* Optimizer worker */}
      <ArchBox x={400} y={196} w={140} h={56} label="Optimizer Workers" sub="search + simulation" accent />

      {/* External user infra */}
      <ArchBox x={580} y={108} w={120} h={56} label="Your endpoint" sub="/simulate · /evaluate" dashed />
      <ArchBox x={580} y={196} w={120} h={56} label="Your endpoint" sub="HTTPS" dashed />

      {/* Arrows */}
      <ArchArrow x1={160} y1={48} x2={210} y2={48} />
      <ArchArrow x1={350} y1={48} x2={400} y2={130} />
      <ArchArrow x1={350} y1={136} x2={400} y2={136} />
      <ArchArrow x1={350} y1={220} x2={400} y2={220} />
      <ArchArrow x1={540} y1={224} x2={580} y2={224} />
      <ArchArrow x1={540} y1={130} x2={580} y2={130} />
      <ArchArrow x1={470} y1={196} x2={470} y2={164} />

      <text x="360" y="320" textAnchor="middle" fontSize="11" fill="#5b6478" fontFamily="Inter, sans-serif">
        Synchronous flow · all state lives in the persistent store
      </text>
    </Box>
  </Box>
);

const ArchBox = ({
  x,
  y,
  w,
  h,
  label,
  sub,
  accent,
  dashed,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  accent?: boolean;
  dashed?: boolean;
}) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={8}
      fill={accent ? 'url(#archGrad)' : '#fff'}
      stroke={accent ? 'transparent' : dashed ? '#cbd5e1' : '#cbd5e1'}
      strokeWidth={1.5}
      strokeDasharray={dashed ? '4,4' : undefined}
    />
    <text
      x={x + w / 2}
      y={y + 22}
      textAnchor="middle"
      fontSize="12"
      fontWeight="700"
      fill={accent ? '#fff' : '#1a1a1f'}
      fontFamily="Inter, sans-serif"
    >
      {label}
    </text>
    <text
      x={x + w / 2}
      y={y + 40}
      textAnchor="middle"
      fontSize="10"
      fill={accent ? 'rgba(255,255,255,0.8)' : '#8a93a6'}
      fontFamily="JetBrains Mono, monospace"
    >
      {sub}
    </text>
  </g>
);

const ArchArrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
);
