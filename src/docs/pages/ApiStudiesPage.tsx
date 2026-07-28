import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C, Ul } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { ApiEndpoint } from '../components/ApiEndpoint';
import { ParamTable } from '../components/ParamTable';
import { Callout } from '../components/Callout';
import { DataTable } from '../components/DataTable';

const toc = [
  { id: 'api-studies', title: 'Studies API', level: 2 as const },
  { id: 'endpoints', title: 'Endpoints', level: 2 as const },
  { id: 'monitoring', title: 'Monitoring a run', level: 2 as const },
  { id: 'metadata', title: 'Study metadata', level: 2 as const },
  { id: 'analytics', title: 'Optimization analytics', level: 2 as const },
  { id: 'importances', title: 'Parameter importances', level: 2 as const },
  { id: 'results', title: 'Studies and top trials', level: 2 as const },
  { id: 'visibility', title: 'Why a study can be missing', level: 2 as const },
];

const STATUS_RESPONSE = `{
  "data": {
    "17": {
      "last_status":       "RUNNING",
      "desired_status":    "RUNNING",
      "failure_message":   null,
      "started_at":        "2026-07-14T09:12:04Z",
      "finished_at":       null,
      "stop_requested_at": null
    }
  }
}`;

const ERRORS_RESPONSE = `{
  "data": {
    "17": {
      "error_summary": [
        { "failure_reason": "grid_duplicate", "count": 41 },
        { "failure_reason": "ShapeError",     "count": 3 }
      ],
      "failed_trials": [
        {
          "trial":          128,
          "failure_reason": "ShapeError",
          "failure_diagnostic": {
            "stage":   "simulation",
            "kind":    "ShapeError",
            "message": "…",
            "tickers": ["ZION"],
            "suggested_actions": ["…"]
          },
          "params": { "lookback": 34, "ma_kind": "ema" }
        }
      ]
    }
  }
}`;

const OPT_HISTORY_RESPONSE = `{
  "data": {
    "17": {
      "0": { "portfolio_id": 1843, "value": 1.21 },
      "1": { "portfolio_id": 1844, "value": 0.87 },
      "2": { "portfolio_id": 1845, "value": 1.44 }
    }
  }
}`;

const OPT_PARAMS_RESPONSE = `{
  "data": {
    "17": [
      {
        "trial":        0,
        "portfolio_id": 1843,
        "value":        1.21,
        "params": { "lookback": 12, "n_top": 5, "ma_kind": "ema" }
      }
    ]
  }
}`;

const STUDY_RESULTS_RESPONSE = `{
  "data": {
    "name":            "sp500_momentum_q1",
    "strategy":        "Cross-sectional momentum",
    "fitness":         "Sharpe minus drawdown",
    "sampler":         "TPE",
    "n_trials":        500,
    "completed_trials": 487,
    "train_start_date":      "2018-01-01",
    "train_end_date":        "2020-12-31",
    "validation_start_date": "2021-01-01",
    "validation_end_date":   "2022-12-31",
    "oos_start_date":        null,
    "oos_end_date":          null,
    "top_portfolios": [
      {
        "rank":         1,
        "portfolio_id": 1845,
        "trial":        2,
        "metrics": {
          "train":      { "sharpe": 1.71, "max_drawdown": -0.18 },
          "validation": { "sharpe": 1.44, "max_drawdown": -0.21 }
        }
      }
    ]
  }
}`;

export const ApiStudiesPage = () => (
  <DocsLayout
    pageId="api-studies"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Studies' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="api-studies" level={1}>
      Studies API
    </Heading>
    <Lead>
      Studies are launched, stopped and resumed in the Fintela app. This API is
      the read side: watch a run while it optimizes, pull its per-trial
      optimization history once it finishes, and export the top trials into your
      own tooling. Twelve endpoints, all <C>GET</C> — the lightweight progress,
      health and status reads are built for polling.
    </Lead>

    <Heading id="endpoints" level={2}>
      Endpoints
    </Heading>
    <ApiEndpoint method="GET" path="/studies/metadata" description="Full configuration for one, several, or all studies." />
    <ApiEndpoint method="GET" path="/studies/progress" description="Fraction of the trial budget consumed, per study." />
    <ApiEndpoint method="GET" path="/studies/health" description="1 − failure rate. Surfaces flaky data or code quickly." />
    <ApiEndpoint method="GET" path="/studies/status" description="Runtime status, timestamps and failure message." />
    <ApiEndpoint method="GET" path="/studies/errors" description="Aggregated failure reasons plus per-trial diagnostics." />
    <ApiEndpoint method="GET" path="/studies/opt/history" description="Per-trial metric value for one stage — the optimization curve." />
    <ApiEndpoint method="GET" path="/studies/opt/params" description="Per-trial params paired with the metric. Scatter-plot input." />
    <ApiEndpoint method="GET" path="/studies/avg_opt/history" description="Optimization curve on a weighted train/validation blend." />
    <ApiEndpoint method="GET" path="/studies/avg_opt/params" description="Params against the weighted train/validation blend." />
    <ApiEndpoint method="GET" path="/studies/param-importances" description="Which hyperparameters actually moved the objective." />
    <ApiEndpoint method="GET" path="/v1/studies" description="List every study visible to the key." />
    <ApiEndpoint method="GET" path="/v1/studies/:study_name" description="One study by name, with its top trials ranked by a metric." />

    <Callout variant="tip" title="Batch with study_ids">
      Every endpoint except <C>/v1/studies</C> and <C>/v1/studies/:study_name</C>{' '}
      takes a comma-separated <C>?study_ids=1,2,3</C> and answers for the whole
      set in one round trip. Since the rate limit is shared across your
      organization, one batched request beats <em>n</em> single-id requests.
    </Callout>

    <Heading id="monitoring" level={2}>
      Monitoring a run
    </Heading>
    <P>
      Four endpoints answer "how is this study doing?". All four{' '}
      <strong>require</strong> <C>study_ids</C> — calling them without it returns{' '}
      <C>400 Bad Request</C>, as does a non-integer id. Each returns an object
      keyed by study id, so a study you cannot see is simply absent from the
      response rather than an error.
    </P>
    <CodeBlock
      language="bash"
      filename="Poll three studies at once"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/studies/progress?study_ids=17,18,19"`}
    />
    <DataTable
      headers={['Endpoint', 'Returns', 'Suggested interval']}
      cols="1.3fr 1.5fr 0.8fr"
      rows={[
        [<><C>/studies/progress</C></>, '{ "<id>": 0.0–1.0 | null }', '5 s'],
        [<><C>/studies/health</C></>, '{ "<id>": 0.0–1.0 | null }', '5 s'],
        [<><C>/studies/status</C></>, '{ "<id>": { last_status, … } }', '30 s'],
        [<><C>/studies/errors</C></>, '{ "<id>": { error_summary, failed_trials } }', 'on demand'],
      ]}
    />
    <P>
      <C>progress</C> is <em>trials recorded ÷ n_trials</em>, clamped to{' '}
      <C>[0, 1]</C>. It counts every trial the optimizer has written, failed ones
      included — it measures how much of the budget is spent, not how much
      succeeded. That is what <C>health</C> is for:{' '}
      <C>1 − failed ÷ total</C>, where a trial counts as failed when the
      optimizer tagged it with a failure reason. Both are <C>null</C> when the
      ratio is undefined — <C>progress</C> when the study declares zero trials,{' '}
      <C>health</C> before the first trial lands.
    </P>
    <Callout variant="info" title="Progress can stop short of 1.0">
      A study whose search space is finite stops once every combination has been
      evaluated, so it can reach a terminal status with{' '}
      <C>progress &lt; 1.0</C>. Treat <C>status</C>, not <C>progress</C>, as the
      signal that a run is over.
    </Callout>
    <P>
      <C>/studies/status</C> returns the runtime row written by the platform's
      status updater. Studies that have never been dispatched have no row and are
      omitted:
    </P>
    <CodeBlock language="json" code={STATUS_RESPONSE} filename="GET /studies/status?study_ids=17" />
    <ParamTable
      caption="status fields"
      rows={[
        { name: 'last_status', type: 'string', description: <>Where the run actually is: <C>QUEUED</C>, <C>RUNNING</C>, <C>COMPLETED</C>, <C>FAILED</C> or <C>STOPPED</C>. <C>COMPLETED</C> means every task finished cleanly; <C>STOPPED</C> means a stop was requested from the app.</> },
        { name: 'desired_status', type: 'string', description: <><C>RUNNING</C> or <C>STOPPED</C> — the state the platform is steering towards. Stopping is cooperative, so <C>desired_status=STOPPED</C> with <C>last_status=RUNNING</C> is the normal in-between state.</> },
        { name: 'failure_message', type: 'string | null', description: 'Set when the run itself failed, as opposed to individual trials failing.' },
        { name: 'started_at / finished_at', type: 'timestamp | null', description: <>UTC. <C>finished_at</C> is stamped on the first transition out of <C>RUNNING</C>.</> },
        { name: 'stop_requested_at', type: 'timestamp | null', description: 'When a stop was requested in the app.' },
      ]}
    />
    <P>
      When health drops, <C>/studies/errors</C> explains why. It returns the
      failure reasons aggregated with counts, plus the individual failed trials
      with the parameters that produced them:
    </P>
    <CodeBlock language="json" code={ERRORS_RESPONSE} filename="GET /studies/errors?study_ids=17" />
    <P>
      <C>failure_diagnostic</C> is the optimizer's structured diagnostic — stage,
      kind, message, offending tickers and suggested actions. Older runs predate
      it and return <C>null</C>, so fall back to <C>failure_reason</C>. Note that
      not every failure reason is a defect: a study exhausting a finite grid
      records duplicate-configuration prunes here, which are benign.
    </P>

    <Heading id="metadata" level={2}>
      Study metadata
    </Heading>
    <P>
      <C>/studies/metadata</C> is the only endpoint where <C>study_ids</C> is{' '}
      <strong>optional</strong>. Omit it to get every study in your organization
      that the key can see — a convenient first call for discovering ids:
    </P>
    <CodeBlock
      language="bash"
      filename="Every study, then one"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/studies/metadata

curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/studies/metadata?study_ids=17"`}
    />
    <ParamTable
      caption="metadata fields"
      rows={[
        { name: 'name', type: 'string', description: 'Study name — the identifier the /v1 endpoints address it by.' },
        { name: 'strategy_id / strategy_name', type: 'integer · string', description: 'The strategy being optimized.' },
        { name: 'fitness_id / fitness_name', type: 'integer · string', description: 'The fitness function used as the objective.' },
        { name: 'n_trials', type: 'integer', description: 'The trial budget the study was created with.' },
        { name: 'completed_trials', type: 'integer', description: 'Trials recorded without a failure reason.' },
        { name: 'sampler', type: 'string', description: 'Optuna sampler driving the search.' },
        { name: 'train_start_date / train_end_date', type: 'string · YYYY-MM-DD', description: 'In-sample search window.' },
        { name: 'validation_start_date / validation_end_date', type: 'string · YYYY-MM-DD', description: 'Held-out window used to pick the best trial.' },
        { name: 'oos_start_date / oos_end_date', type: 'string · YYYY-MM-DD | null', description: 'Out-of-sample window, when the study defines one.' },
        { name: 'strategy_data_cluster_id', type: 'integer', description: 'Asset group the strategy ran against.' },
        { name: 'fitness_data_cluster_id', type: 'integer | null', description: 'Separate cluster for the fitness function, when one is set.' },
        { name: 'parameter_ranges', type: 'object | null', description: <>The search space, one entry per strategy parameter. <C>null</C> when the key cannot fully read the strategy — see below.</> },
        { name: 'fitness_parameters', type: 'object | null', description: <>Constants passed to the fitness function. <C>null</C> when the key cannot fully read the fitness function.</> },
        { name: 'daily_updates_enabled', type: 'boolean', description: 'Whether the study’s portfolios are recomputed daily after market data refreshes.' },
        { name: 'grid_decimals', type: 'integer | null', description: <>Grid precision for float parameters (<C>step = 10⁻ᵈ</C>). <C>null</C> means continuous sampling.</> },
        { name: 'created_at', type: 'timestamp | null', description: 'UTC creation time.' },
      ]}
    />
    <Callout variant="warning" title="Two fields can come back null by design">
      A study is visible organization-wide, but the code it references is not.
      When the key's owner cannot fully read the underlying strategy,{' '}
      <C>parameter_ranges</C> is redacted to <C>null</C>; the same applies to{' '}
      <C>fitness_parameters</C> and the fitness function. The study still
      appears, with its ids intact — so <C>null</C> here means "not yours to
      read", not "not configured".
    </Callout>

    <Heading id="analytics" level={2}>
      Optimization analytics
    </Heading>
    <P>
      These four endpoints reconstruct the optimization run trial by trial. They
      read from the metrics stored against each trial's portfolio, so they are
      only meaningful once trials have completed.
    </P>
    <ApiEndpoint method="GET" path="/studies/opt/history" description="Per-trial metric value, keyed by trial number." />
    <ApiEndpoint method="GET" path="/studies/opt/params" description="Per-trial params alongside the same metric value." />
    <ParamTable
      caption="query parameters"
      rows={[
        { name: 'study_ids', type: 'string · CSV', required: true, description: 'Comma-separated study ids.' },
        { name: 'metric_name', type: 'string', required: true, description: <>The metric to read, e.g. <C>sharpe</C>. Metric names match the ones shown on the study in the app.</> },
        { name: 'stage', type: 'string', required: true, description: <>Which window the metric was measured on: <C>train</C>, <C>validation</C> or <C>oos</C>.</> },
      ]}
    />
    <CodeBlock
      language="bash"
      filename="The validation Sharpe curve"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/studies/opt/history?study_ids=17&metric_name=sharpe&stage=validation"`}
    />
    <CodeBlock language="json" code={OPT_HISTORY_RESPONSE} filename="Response" />
    <Callout variant="info" title="These are raw per-trial values">
      <C>opt/history</C> returns what each trial actually scored, keyed by trial
      number and ordered by it — not a running best. Compute the cumulative
      maximum yourself if you want the classic monotone optimization curve; the
      raw series is strictly more informative, since it also shows the spread the
      sampler is exploring.
    </Callout>
    <P>
      <C>opt/params</C> answers the same query with the trial's hyperparameters
      attached, which is what you want for a params-versus-metric scatter.
      Categorical parameters arrive as their <strong>label</strong>, not as the
      integer index the optimizer stores internally:
    </P>
    <CodeBlock language="json" code={OPT_PARAMS_RESPONSE} filename="GET /studies/opt/params" />
    <P>
      The <C>avg_opt</C> pair answers the same two questions against a{' '}
      <strong>weighted blend of train and validation</strong> instead of a single
      stage — useful for ranking trials that neither overfit the search window
      nor got lucky on the held-out one.
    </P>
    <ApiEndpoint method="GET" path="/studies/avg_opt/history" description="Weighted train/validation blend, keyed by trial number." />
    <ApiEndpoint method="GET" path="/studies/avg_opt/params" description="Weighted train/validation blend with per-trial params." />
    <ParamTable
      caption="query parameters"
      rows={[
        { name: 'study_ids', type: 'string · CSV', required: true, description: 'Comma-separated study ids.' },
        { name: 'metric_name', type: 'string', required: true, description: 'The metric to blend.' },
        { name: 'train', type: 'number', default: '0.5', description: 'Weight applied to the train-stage value.' },
        { name: 'validation', type: 'number', default: '0.5', description: 'Weight applied to the validation-stage value.' },
      ]}
    />
    <Callout variant="warning" title="The weights must sum to 1.0">
      <C>train + validation</C> is checked and anything else returns{' '}
      <C>400 Bad Request</C>. Omit both to get the even <C>0.5 / 0.5</C> split.
      Only the <C>train</C> and <C>validation</C> stages take part — there is no{' '}
      <C>stage</C> parameter here, and <C>oos</C> is never blended in. Response
      shapes are identical to their <C>opt/</C> counterparts, so the same parsing
      code works for both.
    </Callout>

    <Heading id="importances" level={2}>
      Parameter importances
    </Heading>
    <P>
      <C>/studies/param-importances</C> reports which hyperparameters actually
      drove the objective, and which ones look like overfitting.{' '}
      <C>study_ids</C> is required. Studies too sparse to score, or not yet
      scored, are absent from the response rather than returned empty.
    </P>
    <ParamTable
      caption="response fields, per study"
      rows={[
        { name: 'study_id', type: 'integer', description: 'The study the row describes.' },
        { name: 'n_effective_params', type: 'integer | null', description: 'Parameters that actually varied across the scored trials.' },
        { name: 'n_trials_used / n_trials_total', type: 'integer | null', description: 'Trials the scoring ran on, against the study’s total.' },
        { name: 'objective_metric', type: 'string | null', description: 'Metric the importances were computed against.' },
        { name: 'headline_evaluator', type: 'string | null', description: 'Which estimator produced the headline numbers.' },
        { name: 'most_influential_param', type: 'string | null', description: 'Parameter with the highest importance.' },
        { name: 'most_influential_importance', type: 'number | null', description: 'Its importance score.' },
        { name: 'most_influential_direction', type: 'string | null', description: 'Direction of the relationship between that parameter and the objective.' },
        { name: 'max_overfit_param', type: 'string | null', description: 'Parameter with the widest train-versus-validation gap.' },
        { name: 'max_overfit_gap', type: 'number | null', description: 'The size of that gap.' },
        { name: 'artifact', type: 'object | null', description: 'Full computed artifact, passed through verbatim — per-parameter scores and supporting detail behind the headline fields.' },
      ]}
    />

    <Heading id="results" level={2}>
      Studies and top trials
    </Heading>
    <P>
      The <C>/v1</C> pair predates the id-based endpoints above and addresses
      studies by <strong>name</strong>. They remain supported.
    </P>
    <ApiEndpoint method="GET" path="/v1/studies" description="Every study visible to the key, newest first. No query parameters." />
    <P>
      Each entry carries <C>name</C>, <C>last_status</C>, <C>n_trials</C>,{' '}
      <C>completed_trials</C>, the train and validation windows,{' '}
      <C>daily_updates_enabled</C> and <C>created_at</C>. Unlike{' '}
      <C>/studies/metadata</C>, <C>completed_trials</C> here counts only trials
      the optimizer finished and recorded as complete, so the two numbers can
      differ while a run is in flight.
    </P>
    <ApiEndpoint method="GET" path="/v1/studies/:study_name" description="One study with its top trials ranked by a metric on a stage." />
    <ParamTable
      caption="query parameters"
      rows={[
        { name: 'n_top', type: 'integer', default: '10', description: 'How many trials to return. Clamped to 1–100.' },
        { name: 'stage', type: 'string', default: 'validation', description: <>Stage the ranking metric is read from: <C>train</C>, <C>validation</C> or <C>oos</C>.</> },
        { name: 'metric', type: 'string', default: 'sharpe', description: 'Metric the ranking is done on.' },
        { name: 'order', type: '"asc" | "desc"', default: 'desc', description: <>Ranking direction. Use <C>asc</C> for metrics where lower is better, such as drawdown.</> },
      ]}
    />
    <CodeBlock
      language="bash"
      filename="Top 5 by validation Sharpe"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v1/studies/sp500_momentum_q1?n_top=5&metric=sharpe&stage=validation"`}
    />
    <CodeBlock language="json" code={STUDY_RESULTS_RESPONSE} filename="Response" />
    <P>
      Each entry in <C>top_portfolios</C> carries its <C>rank</C>, the{' '}
      <C>trial</C> number, the <C>portfolio_id</C> to follow into the portfolios
      endpoints, and a <C>metrics</C> map nested{' '}
      <C>stage → metric → value</C> — every stage on record, not only the one you
      ranked by, so you can check a trial's validation number against its train
      number in the same payload. An unknown or invisible study name returns{' '}
      <C>404 Not Found</C>.
    </P>

    <Heading id="visibility" level={2}>
      Why a study can be missing
    </Heading>
    <P>
      Beyond the visibility rules that apply to every endpoint, studies draw one
      extra distinction. A study has a <strong>dashboard</strong> facet — how far
      along it is, whether it failed, how its trials scored — and a{' '}
      <strong>code</strong> facet: the search space it explored and the tuned
      parameters each trial used. The code facet belongs to the strategy, and
      that strategy may be private to a colleague even when the study is visible
      to the whole organization. So the two facets are gated separately:
    </P>
    <Ul>
      <li><C>/v1/studies</C>, <C>/v1/studies/:study_name</C>, <C>/studies/progress</C>, <C>/studies/health</C>, <C>/studies/status</C> and <C>/studies/errors</C> follow the study's own visibility</li>
      <li><C>/studies/opt/*</C>, <C>/studies/avg_opt/*</C> and <C>/studies/param-importances</C> require full read access to the <em>underlying strategy</em>, and silently omit studies that fail that test</li>
      <li><C>/studies/metadata</C> keeps the study and redacts only the two code-bearing fields, as described above</li>
    </Ul>
    <Callout variant="info" title="Missing, not forbidden">
      A study you cannot read at full fidelity is left out of the response
      object; it never raises <C>403</C>. If a study shows up in{' '}
      <C>/studies/progress</C> but not in <C>/studies/opt/history</C>, that gap
      is this rule — ask the strategy's owner to share it with the organization
      in the app, and the analytics endpoints start answering.
    </Callout>
  </DocsLayout>
);
