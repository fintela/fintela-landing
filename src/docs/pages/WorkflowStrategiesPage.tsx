import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { Callout } from '../components/Callout';
import { Steps, Step } from '../components/Steps';
import { NavPath } from '../components/NavPath';
import { CodeBlock } from '../components/CodeBlock';

const toc = [
  { id: 'overview', title: 'Overview', level: 2 as const },
  { id: 'create-internal', title: 'Create an internal strategy', level: 2 as const },
  { id: 'create-external', title: 'Create an external strategy', level: 2 as const },
  { id: 'parameters', title: 'Defining parameters', level: 2 as const },
  { id: 'python-libraries', title: 'Python libraries', level: 2 as const },
  { id: 'additional-data', title: 'Declaring additional data', level: 2 as const },
  { id: 'validate-save', title: 'Validate and save', level: 2 as const },
  { id: 'sandbox', title: 'Test in the sandbox', level: 2 as const },
  { id: 'edit-existing', title: 'Editing existing strategies', level: 2 as const },
];

const TEMPLATE_CODE = `def roc_top_n(data, start_date, end_date, n_top, roc_window_size, freq):
    """
    data: DataFrame with tickers as columns and dates as index (adjusted close)
    """
    import pandas as pd

    roc_df = data.pct_change(periods=roc_window_size)
    dates  = [d for d in roc_df.index.astype(str) if start_date <= d <= end_date]

    signal = {}
    for date in dates[::freq]:
        top = roc_df.loc[date].nlargest(n_top).index.tolist()
        alloc = 1.0 / len(top)
        signal[date] = {t: {"position": "L", "allocation": alloc} for t in top}

    return signal`;

// Mirror of the platform's pinned user runtime + curated_libraries.py
// (the same set the in-app editor's "Available libraries" panel renders). Keep
// the versions in lock-step when that SSOT is bumped.
const CURATED_LIBS = [
  { mod: 'numpy', pkg: 'numpy', ver: '2.2.3', desc: 'Arrays & vectorised math. Pre-injected as np — usable without an import.' },
  { mod: 'pandas', pkg: 'pandas', ver: '2.2.3', desc: 'DataFrames & time series. Pre-injected as pd — usable without an import.' },
  { mod: 'scipy', pkg: 'scipy', ver: '1.16.1', desc: 'Scientific computing: stats, optimize, signal, interpolate.' },
  { mod: 'sklearn', pkg: 'scikit-learn', ver: '1.6.1', desc: 'Classical ML: regression, classification, clustering, preprocessing.' },
  { mod: 'statsmodels', pkg: 'statsmodels', ver: '0.14.6', desc: 'Econometrics & time series: OLS/GLS, ARIMA, cointegration tests.' },
  { mod: 'ta', pkg: 'ta', ver: '0.11.0', desc: 'Technical-analysis indicators — RSI, MACD, Bollinger, and more.' },
  { mod: 'cvxpy', pkg: 'cvxpy', ver: '1.9.2', desc: 'Convex optimization for portfolio construction (mean-variance, …).' },
];

const CVXPY_EXAMPLE = `def mean_variance(data, start_date, end_date, lookback, risk_aversion):
    import numpy as np
    import cvxpy as cp

    rets  = data.pct_change().dropna().tail(lookback)
    mu    = rets.mean().values
    Sigma = rets.cov().values

    w = cp.Variable(len(mu))
    problem = cp.Problem(
        cp.Maximize(mu @ w - risk_aversion * cp.quad_form(w, Sigma)),
        [cp.sum(w) == 1, w >= 0],
    )
    problem.solve(solver=cp.CLARABEL)   # deterministic solver — see note below

    weights = dict(zip(data.columns, np.asarray(w.value).round(4)))
    # ... fold weights into a signal dict keyed by date ...`;

export const WorkflowStrategiesPage = () => (
  <DocsLayout
    pageId="workflow-strategies"
    breadcrumbs={[{ label: 'Workflows' }, { label: 'Managing strategies' }]}
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

    <Heading id="strategies-workflow" level={1}>
      Managing strategies
    </Heading>

    <Lead>
      Strategies define the trading logic — what to buy, when to buy it, and how
      much to allocate. This page walks through creating, editing, and testing
      strategies in the Fintela UI.
    </Lead>

    <Heading id="overview" level={2}>
      Overview
    </Heading>
    <P>
      Strategies live in the <strong>Registry</strong> section of the app. You can
      have as many strategies as you like — each is an independent, versioned rule
      that can be linked to multiple studies.
    </P>
    <P>
      Every strategy has:
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
        { field: 'Name', desc: 'A unique, lowercase identifier (e.g. roc_top_n). Used as the Python function name.' },
        { field: 'Description', desc: 'Optional free-text description shown in the strategy list.' },
        { field: 'Execution type', desc: 'Internal (Python stored in Fintela) or External (your HTTPS endpoint).' },
        { field: 'Parameters', desc: 'The optimizable variables — integers or floats that the optimizer sweeps.' },
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

    <Heading id="create-internal" level={2}>
      Create an internal strategy
    </Heading>

    <NavPath steps={['Registry', 'Strategies', '+ New Strategy', 'Internal']} />

    <Steps>
      <Step number={1} title="Open the Strategies list">
        Click <strong>Registry</strong> in the left sidebar, then <strong>Strategies</strong>.
        You'll see the list of all strategies in your organization with their name,
        type (Internal / External), and how many studies are linked to them.
      </Step>

      <Step number={2} title="Click '+ New Strategy'">
        The create button is in the top-right corner of the strategies list. A dialog
        appears asking you to choose <strong>Internal</strong> or <strong>External</strong>.
        Choose <strong>Internal</strong> for a Python-based strategy.
      </Step>

      <Step number={3} title="Fill in name and description">
        Enter a <strong>name</strong> (lowercase, underscores only — this becomes your
        Python function name) and an optional <strong>description</strong>. The name
        must be unique within your organization.
      </Step>

      <Step number={4} title="Define parameters">
        Add your optimizable parameters in the <strong>Parameters</strong> panel below
        the description. Each parameter needs a name, a data type (integer, float, or
        categorical), and a test value used during validation. See{' '}
        <Box component="a" href="#parameters" sx={{ color: '#667eea' }}>Defining parameters</Box>{' '}
        for details.
      </Step>

      <Step number={5} title="Write the Python code">
        The code editor is pre-filled with a template that matches your parameters.
        Replace the body with your logic. The function signature must be:
        <CodeBlock
          language="python"
          code={`def your_strategy(data, start_date, end_date, param1, param2, ...):\n    # return signal dict`}
        />
        A complete example:
        <CodeBlock language="python" code={TEMPLATE_CODE} filename="roc_top_n.py" />
        You're not limited to <C>pandas</C> — see{' '}
        <Box component="a" href="#python-libraries" sx={{ color: '#667eea' }}>Python libraries</Box>{' '}
        for the curated scientific stack (NumPy, SciPy, scikit-learn, statsmodels, ta, CVXPY)
        you can import.
      </Step>

      <Step number={6} title="Validate and save">
        Click <strong>Validate + Save</strong>. Fintela runs your code against a small
        slice of real data using the test parameter values you provided. If the code
        runs cleanly and returns a valid signal shape, it saves. If there's an error,
        the traceback appears inline — fix it and retry.
      </Step>
    </Steps>

    <Callout variant="tip">
      The code editor supports <strong>Ctrl+S / Cmd+S</strong> to trigger Validate + Save
      directly from the keyboard.
    </Callout>

    <Heading id="create-external" level={2}>
      Create an external strategy
    </Heading>

    <NavPath steps={['Registry', 'Strategies', '+ New Strategy', 'External']} />

    <P>
      External strategies let you host the signal generation logic on your own server.
      Fintela calls your endpoint once per trial with the sampled parameters and expects
      back a signal map.
    </P>

    <Steps>
      <Step number={1} title="Choose External in the create dialog">
        After clicking <strong>+ New Strategy</strong>, select <strong>External</strong>.
        The Python editor is replaced by an endpoint configuration form.
      </Step>

      <Step number={2} title="Enter your endpoint URL">
        Provide the full HTTPS URL where your strategy server is running
        (e.g. <C>https://api.yourcompany.com/strategy</C>). HTTP is not accepted —
        the endpoint must use TLS.
      </Step>

      <Step number={3} title="Configure concurrency and timeout">
        Set <strong>Max Concurrency</strong> (how many parallel requests Fintela sends
        to your endpoint per study) and <strong>Timeout</strong> (seconds to wait for
        each response before treating the trial as failed). Good defaults: 4 concurrent,
        30 second timeout.
      </Step>

      <Step number={4} title="Define parameters">
        Same as internal strategies — add the parameters that your endpoint expects to
        receive in each request body.
      </Step>

      <Step number={5} title="Validate and save">
        Fintela sends a test request to your endpoint to confirm it's reachable and
        returns the correct response shape. The test uses your parameter test values.
      </Step>
    </Steps>

    <Callout variant="info">
      See{' '}
      <Box component="a" href="/documentation/modes/external-strategies" sx={{ color: '#667eea' }}>
        External strategies
      </Box>{' '}
      for the full request/response contract your server must implement.
    </Callout>

    <Heading id="parameters" level={2}>
      Defining parameters
    </Heading>

    <P>
      Parameters are the variables the optimizer will sweep. Each parameter you define
      shows up in the study creation wizard where you set the search bounds.
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
        { field: 'Name', desc: 'Must match exactly what your Python function or endpoint expects as an argument name.' },
        { field: 'Type', desc: 'Integer (whole numbers), Float (decimals), or Categorical (a declared set of string choices — your function receives the chosen string). Booleans and free-form strings are still not supported: model an on/off switch as a two-choice categorical or an integer.' },
        { field: 'Choices', desc: 'Categorical only — the string labels the parameter can take (unique, non-empty). Studies explore a subset of these choices or pin one.' },
        { field: 'Window size', desc: 'Flag integers that represent look-back window lengths. The optimizer constrains them to be ≥ 2 and ≤ available data length. Categorical parameters cannot be windows.' },
        { field: 'Test value', desc: 'Used only during validation — the value passed when Fintela runs a smoke test of your code before saving. For categorical parameters it must be one of the declared choices.' },
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

    <Callout variant="warning">
      Parameter names in the UI <strong>must exactly match</strong> the argument names in
      your Python function signature (or the keys your external endpoint reads from the
      request body). A mismatch causes validation failures.
    </Callout>

    <Heading id="python-libraries" level={2}>
      Python libraries
    </Heading>

    <P>
      Internal strategies aren't limited to <C>pandas</C>. Fintela ships a curated,
      version-pinned scientific Python stack you can <C>import</C> directly in your
      strategy, fitness, and risk-manager code — no requirements file, no environment to
      manage. The same versions are also visible in the code editor under{' '}
      <strong>Available libraries</strong>.
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '150px 120px 1fr',
          gap: 2,
          px: 2,
          py: 1,
          bgcolor: 'rgba(11,16,32,0.04)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Import</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Version</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>What it's for</Typography>
      </Box>
      {CURATED_LIBS.map((lib, idx, arr) => (
        <Box
          key={lib.mod}
          sx={{
            display: 'grid',
            gridTemplateColumns: '150px 120px 1fr',
            gap: 2,
            px: 2,
            py: 1.25,
            borderBottom: idx < arr.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.825rem', fontWeight: 600 }}>{lib.mod}</Typography>
          <Typography sx={{ fontSize: '0.825rem', color: 'text.secondary' }}>
            {lib.pkg !== lib.mod ? `${lib.pkg} ` : ''}{lib.ver}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{lib.desc}</Typography>
        </Box>
      ))}
    </Box>

    <P>
      The Python standard library is available too — <C>math</C>, <C>datetime</C>,{' '}
      <C>collections</C>, <C>statistics</C>, <C>itertools</C>, <C>functools</C>, and{' '}
      <C>operator</C>. Import what you need at the top of your function or module:
    </P>

    <CodeBlock language="python" code={CVXPY_EXAMPLE} filename="mean_variance.py" />

    <Callout variant="info" title="Same versions everywhere your code runs">
      Each library is installed at the same pinned version in every place Fintela executes
      your code — validation, the sandbox, optimization, and live trading — so an{' '}
      <C>import</C> behaves identically in all of them. The set is curated rather than
      open-ended (there's no <C>requirements.txt</C>): need a library that isn't listed?
      Ask the Fintela team to add it.
    </Callout>

    <Callout variant="warning" title="Keep reruns reproducible">
      Fintela re-executes and compares your code across stages, so avoid nondeterministic
      defaults. In <C>cvxpy</C>, pass <C>solver=cvxpy.CLARABEL</C> — the default{' '}
      <C>SCS</C> is stochastic and can make reruns diverge. In <C>scikit-learn</C>, pass{' '}
      <C>n_jobs=1</C> (the optimizer already runs trials in parallel) and set any{' '}
      <C>random_state</C> you rely on.
    </Callout>

    <Heading id="additional-data" level={2}>
      Declaring additional data
    </Heading>

    <NavPath steps={['Registry', 'Strategies', 'Strategy name', 'Data']} />

    <P>
      Beyond raw market prices, a strategy can incorporate <strong>additional
      data</strong> — sector, country and index groupings, and platform-curated
      instrument collections. You opt in to exactly the context you intend
      to use in the <strong>Data</strong> settings of the strategy; the platform then
      resolves it and supplies it automatically whenever the strategy runs, in a study
      or in the sandbox.
    </P>
    <Callout variant="info">
      Additional data is a platform-wide capability — fitness functions and risk
      managers can declare it too. See{' '}
      <Box component="a" href="/documentation/configuration/additional-data" sx={{ color: '#667eea' }}>
        Additional data
      </Box>{' '}
      for the full reference and the list of components that support it.
    </Callout>

    <Heading id="validate-save" level={2}>
      Validate and save
    </Heading>

    <P>
      Every save triggers a live validation run:
    </P>

    <Steps>
      <Step number={1} title="Validation runs">
        For internal strategies, Fintela executes your Python code against a real slice
        of market data using your test parameter values. For external strategies, it sends
        a real HTTP request to your endpoint.
      </Step>
      <Step number={2} title="Validation passes">
        The strategy is saved and appears in the list. Any warnings (e.g. date filtering
        returned an empty signal) are shown inline — they don't block saving.
      </Step>
      <Step number={3} title="Validation fails">
        The error message and full Python traceback appear below the editor. Fix the issue
        and click Validate + Save again. The previous saved version (if any) is unchanged.
      </Step>
    </Steps>

    <Callout variant="info" title="Ticker sample size">
      Internal validation runs against a sample of tickers from your org's default data
      cluster. You can shrink this sample via the gear icon in the editor toolbar to speed
      up iteration — use the full dataset for final validation before linking to a study.
    </Callout>

    <Heading id="sandbox" level={2}>
      Test in the sandbox
    </Heading>

    <NavPath steps={['Registry', 'Strategies', 'Strategy name', 'Sandbox']} />

    <P>
      The <strong>Sandbox</strong> tab lets you run a full backtest for a specific
      parameter set before launching a study. It's useful for confirming your logic
      produces reasonable results on a real date range.
    </P>

    <Steps>
      <Step number={1} title="Open the Sandbox tab">
        Click on a strategy in the list to open its detail view, then select the
        <strong> Sandbox</strong> tab.
      </Step>
      <Step number={2} title="Select a asset group and date range">
        Choose the market data to run against and set start/end dates.
      </Step>
      <Step number={3} title="Set parameter values">
        Enter concrete values for each parameter — these are fixed, not ranges.
      </Step>
      <Step number={4} title="Attach a risk manager (optional)">
        Optionally attach a risk manager to the run — pick a built-in rule by name or
        one from your Registry — to see how the strategy and the protection interact
        before committing to a full study.
      </Step>
      <Step number={5} title="Run">
        Click <strong>Run simulation</strong>. Results appear as equity curve, trade list,
        metrics summary, and holdings breakdown.
      </Step>
    </Steps>

    <Heading id="edit-existing" level={2}>
      Editing existing strategies
    </Heading>

    <P>
      When you edit a strategy that is already linked to one or more studies, Fintela
      detects a <strong>breaking change</strong> if you modify the code or parameters.
      You'll be presented with three options:
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
        { option: 'Simple save', desc: 'Save changes to this strategy. Existing studies that haven\'t run yet will use the new version.' },
        { option: 'Fork as new', desc: 'Create a new strategy with your changes. Existing studies remain linked to the original, unmodified version.' },
        { option: 'Overwrite and delete', desc: 'Save changes and delete all existing studies that reference this strategy. Use this when you\'re confident the old results are no longer relevant.' },
      ].map((row, idx, arr) => (
        <Box
          key={row.option}
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
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.option}</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{row.desc}</Typography>
        </Box>
      ))}
    </Box>
  </DocsLayout>
);
