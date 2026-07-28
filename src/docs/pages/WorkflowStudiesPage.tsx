import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { Callout } from '../components/Callout';
import { Steps, Step } from '../components/Steps';
import { NavPath } from '../components/NavPath';

const toc = [
  { id: 'overview', title: 'Overview', level: 2 as const },
  { id: 'prerequisites', title: 'Prerequisites', level: 2 as const },
  { id: 'step1-strategy-fitness', title: 'Step 1 — Strategy & fitness', level: 2 as const },
  { id: 'step2-data', title: 'Step 2 — Data & dates', level: 2 as const },
  { id: 'step3-sampler', title: 'Step 3 — Sampler', level: 2 as const },
  { id: 'step4-params', title: 'Step 4 — Parameter search space', level: 2 as const },
  { id: 'step5-review', title: 'Step 5 — Review & create', level: 2 as const },
  { id: 'risk-managers', title: 'Attaching risk managers', level: 2 as const },
  { id: 'rm-optimization', title: 'Risk-manager optimization studies', level: 2 as const },
  { id: 'monitoring', title: 'Monitoring a running study', level: 2 as const },
  { id: 'pause-stop', title: 'Pausing and stopping', level: 2 as const },
  { id: 'after-completion', title: 'After completion', level: 2 as const },
];

export const WorkflowStudiesPage = () => (
  <DocsLayout
    pageId="workflow-studies"
    breadcrumbs={[{ label: 'Workflows' }, { label: 'Running optimizations' }]}
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
        Workflows
      </Typography>
    </Box>

    <Heading id="studies-workflow" level={1}>
      Running optimizations
    </Heading>

    <Lead>
      A study is a parameter sweep — it runs your strategy hundreds of times with
      different parameter combinations to find the best-performing configuration.
      This page walks through the full study creation wizard and explains every option.
    </Lead>

    <Heading id="overview" level={2}>
      Overview
    </Heading>
    <P>
      Creating a study takes about 2 minutes in the UI. The wizard has 5 steps,
      and you can go back and change any step before creating. Once created, the
      study is queued immediately and starts running when a worker becomes available.
    </P>

    <Box
      component="pre"
      sx={{
        my: 3,
        p: 2.5,
        borderRadius: 2,
        bgcolor: '#0f1325',
        color: '#e6e8f0',
        fontSize: '0.82rem',
        fontFamily: '"JetBrains Mono", monospace',
        lineHeight: 1.8,
        overflowX: 'auto',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
{`Study creation wizard
├── Step 1: Strategy + Fitness function
├── Step 2: Asset groups + Date ranges
├── Step 3: Sampler + n_trials
├── Step 4: Parameter search space
└── Step 5: Review + Create`}
    </Box>

    <Heading id="prerequisites" level={2}>
      Prerequisites
    </Heading>
    <P>
      Before creating a study you need at least one of each:
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { item: 'Strategy', href: '/documentation/workflows/strategies', desc: 'A strategy with at least one defined parameter.' },
        { item: 'Fitness function', href: '/documentation/concepts#fitness-functions', desc: 'A fitness function that scores simulated portfolios.' },
        { item: 'Asset group', href: '/documentation/concepts#data-clusters', desc: 'A market data snapshot with tickers and a date range.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.item}
          sx={{
            display: 'flex',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box
            component="a"
            href={row.href}
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#667eea',
              textDecoration: 'none',
              minWidth: 140,
              flexShrink: 0,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {row.item}
          </Box>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="step1-strategy-fitness" level={2}>
      Step 1 — Strategy &amp; fitness
    </Heading>

    <NavPath steps={['Registry', 'Studies', '+ New Study', 'Step 1']} />

    <P>
      Select the strategy and fitness function for this optimization run. Both
      selectors show a live preview of the selected item:
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { field: 'Strategy preview', desc: 'Shows execution type, the Python code (read-only), and the list of defined parameters.' },
        { field: 'Fitness preview', desc: 'Shows execution type and any configurable fitness parameters (e.g. risk-free rate for a Sharpe scorer).' },
      ].map((row, idx, arr) => (
        <Box
          key={row.field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.field}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Callout variant="tip">
      If you haven't set a fitness parameter value (e.g. risk-free rate), you can
      set it in this step. The value is fixed for the entire study — the optimizer
      does not sweep fitness parameters.
    </Callout>

    <Heading id="step2-data" level={2}>
      Step 2 — Data &amp; dates
    </Heading>

    <P>
      Choose which market asset groups to use and set the date ranges for
      training, validation, and out-of-sample evaluation. The universe picker also lists{' '}
      <strong>pre-built groupings</strong> — the Sector ETFs, an index like the S&amp;P 500, a
      sector, industry, or country — so you can run on a ready-made universe without building a
      cluster first (it's materialized into a derived cluster automatically).
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { field: 'Strategy clusters', desc: 'One or more asset groups the strategy runs on. Each cluster spawns a separate study (bulk creation).' },
        { field: 'Fitness cluster', desc: 'The asset group used for fitness evaluation. Can be the same as or different from the strategy cluster.' },
        { field: 'Start / end dates', desc: 'Set per-cluster. The date range is split into train, validation, and optional OOS windows based on the split percentage you set.' },
        { field: 'Train split %', desc: 'What fraction of the date range is used for training. The remainder is split between validation and OOS.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.field}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Callout variant="warning">
      If your strategy uses a look-back window parameter (e.g. a 60-day ROC window),
      the start date must be far enough from the cluster's first available date to
      provide sufficient warm-up data. The UI shows a warning if the start date is
      too early relative to available data, or too late for the window size.
    </Callout>

    <Heading id="step3-sampler" level={2}>
      Step 3 — Sampler &amp; trial count
    </Heading>

    <P>
      Choose the search algorithm and how many parameter combinations to evaluate.
    </P>

    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { field: 'n_trials', desc: 'Total number of parameter combinations to evaluate. Each trial runs a full backtest simulation. More trials = better coverage but longer runtime.' },
        { field: 'Sampler', desc: 'The algorithm used to pick the next parameter values. TPE is the default — it learns from past trials to focus on promising regions.' },
        { field: 'Grid precision', desc: 'Optional decimals for float parameters — the search samples on a step = 10⁻ᵈ grid instead of continuously. Also makes float ranges finite, so they count toward the search-space size.' },
        { field: 'Autostop', desc: 'Optional minimum trial health threshold. If too many trials fail (e.g. due to data/timeout issues), the study stops early rather than wasting compute.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: '"JetBrains Mono", monospace', color: '#667eea' }}>{row.field}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Callout variant="tip">
      Start with <C>n_trials: 20–50</C> for a quick smoke test, then increase to 200+
      for a thorough search. You can always resume a stopped study to add more trials.
      See{' '}
      <Box component="a" href="/documentation/optimizer/samplers" sx={{ color: '#667eea' }}>
        Sampler selection
      </Box>{' '}
      for a comparison of available algorithms.
    </Callout>

    <Callout variant="info" title="Finite search spaces">
      When every non-fixed parameter is finite — integer ranges, categorical choices,
      or float ranges with a grid precision — the wizard shows the exact number of
      combinations (<em>Search space: N combinations</em>). Asking for more trials
      than that only warns: <C>n_trials</C> is capped to the grid at launch, the
      optimizer enumerates every combination exactly once, and the study completes
      early as soon as the grid is exhausted.
    </Callout>

    <Heading id="step4-params" level={2}>
      Step 4 — Parameter search space
    </Heading>

    <P>
      For each parameter in your strategy, define what the optimizer is allowed to
      explore. What you configure depends on the parameter's type:
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { field: 'Numeric (integer / float)', desc: 'Set the minimum and maximum values. The sampler picks values within these bounds for each trial.' },
        { field: 'Categorical', desc: 'Pick which of the strategy’s declared choices to explore — the full set or any subset. Each trial receives one of the selected strings.' },
        { field: 'Fixed', desc: 'Any parameter can be switched to Fixed instead: pin it to a single value (a number, or one choice for categoricals). Fixed parameters are passed to every trial unchanged and are excluded from the search.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.field}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>
    <P>
      Fixing parameters shrinks the search space — often enough to make it finite, so
      the study can enumerate it completely (see the finite-search-space note in
      Step 3). The parameter list is pulled directly from the strategy definition. If
      your strategy has fitness parameters (e.g. a risk-free rate), those appear in a
      separate section with fixed values (not ranges).
    </P>

    <Callout variant="info">
      <strong>Window-size parameters</strong> automatically have their maximum
      clamped to the number of available business days before the training start
      date — the UI shows this constraint next to the slider.
    </Callout>

    <Heading id="step5-review" level={2}>
      Step 5 — Review &amp; create
    </Heading>

    <P>
      A summary card shows all selections before you commit:
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        ['Study name', 'Auto-generated from strategy name + timestamp, editable.'],
        ['Strategy', 'Name, type, parameter count.'],
        ['Fitness', 'Name, type.'],
        ['Data', 'Cluster(s), date range(s), split percentages.'],
        ['Sampler', 'Algorithm and n_trials.'],
        ['Parameters', 'The search spec per parameter — min/max range, selected choices, or fixed value.'],
      ].map(([field, desc], idx, arr) => (
        <Box
          key={field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 2,
            px: 2,
            py: 1,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{field}</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{desc}</Typography>
        </Box>
      ))}
    </Box>
    <P>
      Click <strong>Create study</strong>. If you selected multiple strategy clusters,
      one study is created per cluster and all are queued simultaneously.
    </P>

    <Heading id="risk-managers" level={2}>
      Attaching risk managers
    </Heading>
    <P>
      A study can include one or more <strong>risk managers</strong> — the governance
      layer that runs on every step of a backtest, before the strategy rebalances, and
      acts on the portfolio from the previous step (closing positions, halting
      rebalancing, or trimming holdings that breach a limit). When you attach risk
      managers to a study, every trial runs them first on each step and then the
      strategy's rebalance. See{' '}
      <Box
        component="a"
        href="/documentation/workflows/risk-managers#when-they-act"
        sx={{ color: '#667eea' }}
      >
        When they act
      </Box>{' '}
      for how this affects same-step strategy signals.
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { field: 'Selection', desc: 'Pick risk managers from your Registry, or attach a built-in rule from the catalog directly.' },
        { field: 'Parameter mode', desc: 'Set each risk manager parameter as fixed (a single value) or optimizable (a min/max range the optimizer searches alongside the strategy parameters).' },
        { field: 'Execution order', desc: 'When several risk managers are attached, define the order in which they run on each step. Used as a tie-breaker when more than one manager wants to act on the same position.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.field}
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.field}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>
    <Callout variant="info">
      The study captures the configuration of every risk manager attached to it, so its
      results stay reproducible even if you edit the risk manager later. See{' '}
      <Box component="a" href="/documentation/workflows/risk-managers" sx={{ color: '#667eea' }}>
        Managing risk managers
      </Box>{' '}
      for how to create and version them.
    </Callout>

    <Heading id="rm-optimization" level={2}>
      Risk-manager optimization studies
    </Heading>
    <P>
      Instead of optimizing a strategy, you can optimize the <strong>risk managers</strong>{' '}
      applied to an existing portfolio. Starting from a source portfolio, you choose which
      risk managers to attach and which of their parameters to optimize. Each trial reuses
      the source portfolio's strategy and signals unchanged, varying only the risk-manager
      configuration — so you can isolate the effect of risk management on the same
      underlying strategy.
    </P>
    <P>
      Every trial produces a <strong>derived portfolio</strong> linked back to its source.
      The result is a family of portfolios you can compare directly to see which
      risk-manager configuration best protects the original strategy. See{' '}
      <Box component="a" href="/documentation/workflows/results" sx={{ color: '#667eea' }}>
        Analyzing results
      </Box>{' '}
      for how to navigate portfolio lineage.
    </P>

    <Heading id="monitoring" level={2}>
      Monitoring a running study
    </Heading>

    <NavPath steps={['Registry', 'Studies', 'Study name']} />

    <P>
      Open a running study to see:
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { label: 'Progress bar', desc: 'Shows completed / total trials as a fraction. Updates in real time.' },
        { label: 'Health', desc: 'Fraction of non-failed trials (1 = all trials succeeded). Below a threshold, autostop kicks in.' },
        { label: 'Best score', desc: 'The highest fitness score seen so far, updated as trials complete.' },
        { label: 'Trial history', desc: 'A scatter plot of trial fitness scores over time — lets you see if the optimizer is converging.' },
        { label: 'Trial table', desc: 'Every completed trial with its parameter values and fitness score. Click a row to open the portfolio details.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.label}
          sx={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.label}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="pause-stop" level={2}>
      Pausing and stopping
    </Heading>

    <P>
      Studies support two interruption modes — accessible via the action menu in the
      study list or study detail page:
    </P>
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        my: 2,
      }}
    >
      {[
        { action: 'Pause', desc: 'No new trials are dispatched. Trials already running complete normally. The study can be resumed later — the sampler picks up exactly where it left off.' },
        { action: 'Stop', desc: 'Permanently halts the study. Trials in flight complete, but no new ones start. Cannot be resumed.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.action}
          sx={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{row.action}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>

    <Heading id="after-completion" level={2}>
      After completion
    </Heading>

    <P>
      When a study reaches <strong>COMPLETED</strong> status:
    </P>
    <Steps>
      <Step number={1} title="Go to Analytics → Portfolios">
        All portfolios from the completed study appear in the portfolio dashboard,
        ranked by fitness score. Select the study from the filter dropdown to isolate
        its results.
      </Step>
      <Step number={2} title="Compare and sort">
        Sort portfolios by any metric — Sharpe, Calmar, max drawdown, CAGR, win rate.
        The default sort is by training fitness score.
      </Step>
      <Step number={3} title="Inspect the best trial">
        Click any portfolio row to open the full detail view: equity curve, trade log,
        holdings breakdown, and per-window metrics.
      </Step>
      <Step number={4} title="Promote to live (optional)">
        When you've found the parameter set you want to deploy, promote it to a live
        portfolio and connect a broker agent. See{' '}
        <Box component="a" href="/documentation/workflows/live-trading" sx={{ color: '#667eea' }}>
          Live trading
        </Box>.
      </Step>
    </Steps>
  </DocsLayout>
);
