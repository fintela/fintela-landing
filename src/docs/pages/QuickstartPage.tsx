import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { Callout } from '../components/Callout';
import { Steps, Step } from '../components/Steps';
import { NavPath } from '../components/NavPath';
import { Box, Typography } from '@mui/material';

const toc = [
  { id: 'overview', title: 'Overview', level: 2 as const },
  { id: 'create-strategy', title: '1. Create a strategy', level: 2 as const },
  { id: 'create-study', title: '2. Run an optimization', level: 2 as const },
  { id: 'inspect-results', title: '3. Inspect results', level: 2 as const },
  { id: 'promote-live', title: '4. Go live (optional)', level: 2 as const },
  { id: 'via-api', title: 'Reading results from the API', level: 2 as const },
  { id: 'whats-next', title: "What's next", level: 2 as const },
];

const PROGRESS_CALL = `curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/studies/progress?study_ids=42"`;

const PROGRESS_RESPONSE = `{
  "data": {
    "42": 0.64
  }
}`;

const TRIALS_CALL = `curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v2/trials?study_name=roc_top_n_q1"`;

export const QuickstartPage = () => (
  <DocsLayout
    pageId="quickstart"
    breadcrumbs={[{ label: 'Getting Started' }, { label: 'Quickstart' }]}
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
    <Heading id="quickstart" level={1}>
      Quickstart
    </Heading>
    <Lead>
      From a blank account to your first optimization results in under ten minutes.
      This guide walks through the app — strategy creation, running a study, and
      reviewing the output. Pulling those results back out over the read-only API
      is at the bottom.
    </Lead>

    <Heading id="overview" level={2}>
      Overview
    </Heading>

    <P>
      Four steps, two of which are optional for going live:
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
{`1. Create a strategy          (Registry → Strategies)
2. Run an optimization study  (Registry → Studies → + New Study)
3. Inspect the results        (Analytics → Portfolios)
4. Go live — optional         (Portfolio Manager → Operations)`}
    </Box>

    <Callout variant="info" title="Already have a asset group?">
      Studies run on a universe. You can build a asset group — a saved set of tickers and date
      range (<strong>Data → Markets → + New Cluster</strong>) — or, in the study builder, just pick a{' '}
      <strong>pre-built grouping</strong> (the Sector ETFs, an index like the S&amp;P 500, a sector or
      country) and skip cluster creation entirely. The rest of this guide assumes a universe is ready.
    </Callout>

    <Heading id="create-strategy" level={2}>
      1. Create a strategy
    </Heading>

    <NavPath steps={['Registry', 'Strategies', '+ New Strategy', 'Internal']} />

    <P>
      A strategy is a Python function that receives market data and returns a signal
      map — which tickers to hold, in what direction, and at what allocation.
    </P>

    <Steps>
      <Step number={1} title="Open Registry → Strategies">
        Click <strong>Registry</strong> in the left sidebar, then <strong>Strategies</strong>.
        Click <strong>+ New Strategy</strong> in the top right and choose <strong>Internal</strong>.
      </Step>
      <Step number={2} title="Name it and add parameters">
        Give it a name like <C>roc_top_n</C> (lowercase, underscores only). Add the
        parameters the optimizer will sweep — for example:
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
            mt: 1.5,
          }}
        >
          {[
            { name: 'n_top', type: 'Integer', desc: 'Number of top tickers to hold.' },
            { name: 'roc_window_size', type: 'Integer (window)', desc: 'Look-back window for rate-of-change. Mark "Window size" so the optimizer constrains it to available data.' },
            { name: 'freq', type: 'Integer', desc: 'Rebalancing frequency in trading days.' },
          ].map((row, idx, arr) => (
            <Box
              key={row.name}
              sx={{
                display: 'grid',
                gridTemplateColumns: '160px 120px 1fr',
                gap: 2,
                px: 1.5,
                py: 1,
                borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: '"JetBrains Mono", monospace', color: '#667eea' }}>{row.name}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{row.type}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{row.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Step>
      <Step number={3} title="Write the Python code">
        The editor is pre-filled with a template that matches your parameters.
        A minimal implementation:
        <CodeBlock
          language="python"
          code={`def roc_top_n(data, start_date, end_date, n_top, roc_window_size, freq):
    import pandas as pd
    roc = data.pct_change(periods=roc_window_size)
    dates = [d for d in roc.index.astype(str) if start_date <= d <= end_date]
    signal = {}
    for date in dates[::freq]:
        top = roc.loc[date].nlargest(n_top).index.tolist()
        alloc = 1.0 / len(top)
        signal[date] = {t: {"position": "L", "allocation": alloc} for t in top}
    return signal`}
          filename="roc_top_n.py"
        />
      </Step>
      <Step number={4} title="Validate and save">
        Click <strong>Validate + Save</strong> (or press <C>Cmd+S</C>). Fintela
        runs your code against a small real data slice using your test parameter values.
        If it passes, the strategy is saved and ready to link to a study.
      </Step>
    </Steps>

    <Callout variant="tip">
      Use the <strong>Sandbox</strong> tab on the strategy detail page to run a
      full backtest with fixed parameter values before launching a study.
      It's a fast sanity check.
    </Callout>

    <Heading id="create-study" level={2}>
      2. Run an optimization study
    </Heading>

    <NavPath steps={['Registry', 'Studies', '+ New Study']} />

    <P>
      A study is a parameter sweep — it runs your strategy many times with different
      parameter combinations to find the best-performing configuration.
    </P>

    <Steps>
      <Step number={1} title="Open Registry → Studies → + New Study">
        The study creation wizard opens. It has 5 steps you can navigate freely
        before creating.
      </Step>
      <Step number={2} title="Step 1 — Strategy &amp; fitness">
        Select your <C>roc_top_n</C> strategy. For fitness, choose any internal
        fitness function — <C>sharpe_like</C> is a good default.
      </Step>
      <Step number={3} title="Step 2 — Data &amp; dates">
        Select your universe — your asset group, or a pre-built grouping like the
        Sector ETFs or the S&amp;P 500. Set a start date and end date. Leave the train
        split at 70% for now — this gives you a validation window automatically.
      </Step>
      <Step number={4} title="Step 3 — Sampler">
        Leave the sampler as <strong>TPE</strong> (default). Set <C>n_trials</C> to{' '}
        <strong>50</strong> for a quick first run.
      </Step>
      <Step number={5} title="Step 4 — Parameter search space">
        Set the min/max range for each parameter (all three are integers here —
        categorical parameters would show their declared choices instead, and any
        parameter can be fixed to a single value):
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1.5,
            overflow: 'hidden',
            mt: 1.5,
          }}
        >
          {[
            { param: 'n_top', min: '1', max: '10' },
            { param: 'roc_window_size', min: '5', max: '60' },
            { param: 'freq', min: '1', max: '5' },
          ].map((row, idx, arr) => (
            <Box
              key={row.param}
              sx={{
                display: 'grid',
                gridTemplateColumns: '160px 60px 60px',
                gap: 2,
                px: 1.5,
                py: 1,
                borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: '"JetBrains Mono", monospace', color: '#667eea' }}>{row.param}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>min: {row.min}</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>max: {row.max}</Typography>
            </Box>
          ))}
        </Box>
      </Step>
      <Step number={6} title="Step 5 — Review &amp; create">
        Review the summary card, then click <strong>Create study</strong>. The study
        is queued immediately and starts as soon as a worker is available — usually
        within seconds.
      </Step>
    </Steps>

    <P>
      Watch the progress bar on the study detail page. With 50 trials and a small
      dataset, expect it to complete in a few minutes.
    </P>

    <Heading id="inspect-results" level={2}>
      3. Inspect results
    </Heading>

    <NavPath steps={['Analytics', 'Portfolios']} />

    <P>
      Once the study reaches <strong>COMPLETED</strong>, every trial appears as a
      portfolio in the Analytics section.
    </P>

    <Steps>
      <Step number={1} title="Open Analytics → Portfolios">
        Select your study from the filter dropdown at the top.
      </Step>
      <Step number={2} title="Sort by Sharpe or CAGR">
        Click a column header to sort. Find the trial with the best balance of
        return and risk — not just the highest raw return.
      </Step>
      <Step number={3} title="Open the portfolio detail">
        Click any row. Review the equity curve, drawdown chart, trade log, and
        the exact parameter values used.
      </Step>
      <Step number={4} title="Overlay multiple portfolios">
        Check the checkbox column on multiple rows to overlay their equity curves
        in the chart below — useful for comparing parameter sensitivity.
      </Step>
    </Steps>

    <Callout variant="tip">
      Switch to <strong>Pivot view</strong> to see which parameter ranges produced
      the best results across all 50 trials. This guides the bounds for your next,
      more focused study.
    </Callout>

    <Heading id="promote-live" level={2}>
      4. Go live (optional)
    </Heading>

    <P>
      When you've found a parameter set you're confident in, you can promote it
      to a live portfolio and trade it through your connected brokerage.
    </P>

    <Steps>
      <Step number={1} title="Promote the portfolio">
        In the portfolio detail view, open the action menu and click <strong>Promote</strong>.
        This marks the trial as your chosen production configuration.
      </Step>
      <Step number={2} title="Connect your brokerage">
        Go to <strong>Account settings → Broker connections → Connect your brokerage</strong>.
        Link your account with <strong>Connect with your brokerage</strong>, and pick the{' '}
        <strong>Paper</strong> environment — every operation on that connection
        inherits it.
      </Step>
      <Step number={3} title="Start an operation">
        Open <strong>Portfolio Manager → your basket → Operations → Trade with
        your brokerage</strong>. Pick the connection and the capital to commit, then click{' '}
        <strong>Launch</strong>.
      </Step>
    </Steps>

    <P>
      See <Box component="a" href="/documentation/workflows/live-trading" sx={{ color: '#667eea' }}>Live trading</Box> for
      the full walkthrough including monitoring, stopping, and risk considerations.
    </P>

    <Heading id="via-api" level={2}>
      Reading results from the API
    </Heading>

    <P>
      Strategies, studies and portfolios are created and controlled in the app —
      that's where the work you're billed for is metered. The developer API is{' '}
      <strong>read-only</strong>: every endpoint is a <C>GET</C>, and it exists so
      you can feed finished results into your own notebooks, dashboards and
      pipelines.
    </P>

    <P>
      Poll a study's completion fraction while it runs:
    </P>
    <CodeBlock language="bash" code={PROGRESS_CALL} filename="GET /studies/progress" />
    <CodeBlock language="json" code={PROGRESS_RESPONSE} filename="200 OK" />

    <P>
      Then list the trials it produced:
    </P>
    <CodeBlock language="bash" code={TRIALS_CALL} filename="GET /v2/trials" />

    <Callout variant="info">
      See the <Box component="a" href="/documentation/api" sx={{ color: '#667eea' }}>API reference</Box> for
      authentication, every available endpoint, and error codes.
    </Callout>

    <Heading id="whats-next" level={2}>
      What's next
    </Heading>

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
        { label: 'Managing strategies', href: '/documentation/workflows/strategies', desc: 'Strategy types, parameters, validation, and the sandbox.' },
        { label: 'Running optimizations', href: '/documentation/workflows/studies', desc: 'Full study wizard walkthrough — all 5 steps explained.' },
        { label: 'Analyzing results', href: '/documentation/workflows/results', desc: 'Portfolio dashboard, pivot table, equity charts, custom date windows.' },
        { label: 'External strategies', href: '/documentation/modes/external-strategies', desc: 'Host your signal logic on your own server.' },
        { label: 'Sampler selection', href: '/documentation/optimizer/samplers', desc: 'TPE, CMA-ES, Random — which to use and when.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.href}
          component="a"
          href={row.href}
          sx={{
            display: 'flex',
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background 0.18s',
            '&:hover': { bgcolor: 'rgba(102,126,234,0.03)' },
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#667eea', mb: 0.25 }}>{row.label}</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{row.desc}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  </DocsLayout>
);
