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
  { id: 'external-fitness', title: 'External fitness', level: 2 as const },
  { id: 'when-to-use', title: 'When to use', level: 2 as const },
  { id: 'endpoint-contract', title: 'Endpoint contract', level: 2 as const },
  { id: 'simulation-period', title: 'The simulation period payload', level: 2 as const },
  { id: 'multi-parameter', title: 'Multi-parameter fitness', level: 2 as const },
  { id: 'registering', title: 'Registering the fitness', level: 2 as const },
  { id: 'failure-handling', title: 'Failure handling', level: 2 as const },
];

const FASTAPI_EXAMPLE = `from fastapi import FastAPI, Query

app = FastAPI()

@app.post("/evaluate")
def evaluate(
    simulation_period: dict,
    risk_free: float = Query(0.02),
):
    trades = simulation_period.get("trades", [])
    equity = simulation_period.get("equity", {})

    # Your scoring logic.
    score = compute_my_score(trades, equity, risk_free)

    return {"fitness": score}`;

const MULTI_PARAM = `# Per-fitness declaration
[
  { "parameter_name": "alpha",           "dtype": "float", "is_window": false },
  { "parameter_name": "downside_weight", "dtype": "float", "is_window": false }
]

# Per-study fitness_params
{
  "alpha":            0.5,
  "downside_weight":  1.2
}

# Per-trial query string assembled by the optimizer
?alpha=0.5&downside_weight=1.2`;

const REGISTER_PAYLOAD = `POST /fitness

{
  "name": "regulator_aware_sharpe",
  "description": "Custom sharpe variant with regulator-defined penalties.",
  "execution_type": "external",
  "execution_details": {
    "endpoint":        "https://my-fitness.example.com",
    "timeout":         15.0,
    "max_concurrency": 4
  },
  "parameters": {
    "risk_free":       { "datatype": "float", "is_window": false },
    "drawdown_weight": { "datatype": "float", "is_window": false }
  }
}`;

export const ExternalFitnessPage = () => (
  <DocsLayout
    pageId="external-fitness"
    breadcrumbs={[{ label: 'Optimization Modes' }, { label: 'External fitness' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Optimization Modes
      </Typography>
    </Box>
    <Heading id="external-fitness" level={1}>
      External fitness functions
    </Heading>
    <Lead>
      Host the scoring logic on your own infrastructure. Fintela's optimizer
      sends every simulated period to your endpoint and receives back a single
      number — the fitness — that drives the search.
    </Lead>

    <Heading id="when-to-use" level={2}>
      When to use
    </Heading>
    <Ul>
      <li>Regulator-aware or compliance-controlled scoring rules</li>
      <li>Custom risk-adjusted metrics that combine market data the user owns</li>
      <li>Composite scores that aggregate across portfolio universes</li>
      <li>Scoring logic in a language other than Python</li>
    </Ul>

    <Heading id="endpoint-contract" level={2}>
      Endpoint contract
    </Heading>
    <P>
      Your endpoint accepts a <C>POST</C> to <C>/evaluate</C>. The body is the
      <em> simulation period</em> — a dict of trades, equity, and per-period metrics.
      Fitness parameters travel in the query string. The response is a single
      float wrapped in a JSON object.
    </P>

    <ApiEndpoint
      method="POST"
      path="{your-endpoint}/evaluate"
      description="Score one simulated period for the current trial."
    />

    <ParamTable
      caption="Query parameters"
      rows={[
        {
          name: '<fitness_param_name>',
          type: 'string · scalar',
          required: false,
          description: <>One entry per parameter declared on the fitness record. Values come from <C>study.fitness_params</C>.</>,
        },
      ]}
    />

    <ParamTable
      caption="Body"
      rows={[
        { name: 'trades', type: 'array', description: 'Each executed trade with entry/exit prices and timestamps.' },
        { name: 'equity', type: 'object', description: 'Cumulative equity curve as { date: value }.' },
        { name: 'period_metrics', type: 'object', description: 'Precomputed period-level metrics — Sharpe, Sortino, drawdown, etc.' },
      ]}
    />

    <Heading id="response" level={3}>
      Response
    </Heading>
    <CodeBlock language="json" code={`{
  "fitness": 0.85
}`} filename="200 OK" />

    <Callout variant="warning" title="Asymmetry with /simulate">
      Strategy endpoints take params in the <strong>body</strong> and dates in
      the <strong>query string</strong>. Fitness endpoints flip the pattern —
      params in the <strong>query string</strong>, simulation period in the
      <strong> body</strong>. Read params from <C>request.query_params</C>{' '}
      (or FastAPI's <C>Query(...)</C>), not from the JSON body.
    </Callout>

    <Heading id="simulation-period" level={2}>
      The simulation period payload
    </Heading>
    <P>
      The optimizer evaluates your endpoint up to four times per trial — once
      per stage. Each call carries the slice of the backtest for that window.
    </P>
    <DataTable
      headers={['Stage', 'Window', 'Stored under']}
      cols="1fr 1.5fr 1.5fr"
      rows={[
        ['Train', 'train_start_date → train_end_date', 'period_metrics["{train_start}/{train_end}"]'],
        ['Validation', 'validation_start_date → validation_end_date', 'period_metrics["{val_start}/{val_end}"]'],
        ['Overall', 'Full span across stages', 'period_metrics["overall"]'],
        ['OOS', 'oos_start_date → oos_end_date', 'period_metrics["{oos_start}/{oos_end}"] (when configured)'],
      ]}
    />
    <P>
      Train fitness drives the optimization search; the other stages are stored
      for analysis and display on the study results pages.
    </P>

    <Heading id="multi-parameter" level={2}>
      Multi-parameter fitness
    </Heading>
    <P>
      External fitness can accept any number of parameters. Declare them on the
      fitness record, set values per study, and the optimizer forwards them as
      query-string params on every call.
    </P>
    <CodeBlock language="json" code={MULTI_PARAM} filename="Fitness parameter lifecycle" />

    <Heading id="registering" level={2}>
      Registering the fitness
    </Heading>
    <CodeBlock language="json" code={REGISTER_PAYLOAD} filename="POST /fitness" />

    <Heading id="failure-handling" level={2}>
      Failure handling
    </Heading>
    <P>
      Identical to external strategies — every exception (network, status,
      malformed JSON, missing <C>fitness</C> key) marks the trial as failed,
      with the message recorded for diagnosis. No retries.
    </P>

    <Callout variant="tip" title="NaN is a guarantee, not a hint">
      Return <C>NaN</C> when you want the trial pruned — the optimizer detects
      it and records <C>failure_reason: "nan_fitness"</C> automatically.
      Returning an extreme number to mean "bad" can fool the search.
    </Callout>

    <Heading id="example" level={2}>
      Reference example
    </Heading>
    <CodeBlock
      tabs={[
        { label: 'Python · FastAPI', language: 'python', code: FASTAPI_EXAMPLE },
      ]}
    />
  </DocsLayout>
);
