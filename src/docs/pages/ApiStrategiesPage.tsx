import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C, Ul } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { ApiEndpoint } from '../components/ApiEndpoint';
import { ParamTable } from '../components/ParamTable';
import { Callout } from '../components/Callout';

const toc = [
  { id: 'api-strategies', title: 'Strategies API', level: 2 as const },
  { id: 'endpoints', title: 'Endpoints', level: 2 as const },
  { id: 'list', title: 'List strategies', level: 2 as const },
  { id: 'metadata', title: 'Full metadata', level: 2 as const },
  { id: 'params', title: 'Parameter definitions', level: 2 as const },
  { id: 'versions', title: 'Version history', level: 2 as const },
  { id: 'authoring', title: 'Authoring happens in the app', level: 2 as const },
];

const METADATA_RESPONSE = `{
  "data": {
    "7": {
      "name": "roc_top_n",
      "description": "Pick the top N by rate of change.",
      "execution_type": "internal",
      "execution_details": {
        "code": "def roc_top_n(data, start_date, end_date, n_top, roc_window_size, ma_kind):\\n    ..."
      },
      "parameters": [
        { "parameter_name": "n_top", "description": "How many names to hold.",
          "dtype": "integer", "is_window": false },
        { "parameter_name": "roc_window_size", "description": null,
          "dtype": "integer", "is_window": true },
        { "parameter_name": "ma_kind", "description": null,
          "dtype": "categorical", "is_window": false,
          "choices": ["ema", "sma", "wma"] }
      ],
      "studies": [31, 44],
      "created_at": "2025-11-04 09:12:41.882374+00",
      "updated_at": "2026-02-18 17:03:55.104219+00"
    }
  }
}`;

const PARAMS_RESPONSE = `{
  "data": {
    "7": [
      { "name": "n_top",           "dtype": "integer",     "is_window": false },
      { "name": "roc_window_size", "dtype": "integer",     "is_window": true  },
      { "name": "ma_kind",         "dtype": "categorical", "is_window": false,
        "choices": ["ema", "sma", "wma"] }
    ]
  }
}`;

const VERSIONS_RESPONSE = `{
  "data": [
    {
      "version_id": 918,
      "version_number": 3,
      "snapshot_name": "roc_top_n",
      "snapshot_execution_type": "INTERNAL",
      "snapshot_execution_details": { "code": "def roc_top_n(...):\\n    ..." },
      "snapshot_parameters": [
        { "parameter_name": "n_top", "dtype": "integer", "is_window": false }
      ],
      "snapshot_extra_data_config": null,
      "snapshot_strategy_type": null,
      "note": "tightened the ROC window after the Q3 review",
      "created_at": "2026-02-18T17:03:55Z"
    }
  ]
}`;

export const ApiStrategiesPage = () => (
  <DocsLayout
    pageId="api-strategies"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Strategies' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="api-strategies" level={1}>
      Strategies API
    </Heading>
    <Lead>
      Read the strategies that already exist in your organization — their names,
      code, parameter definitions, the studies that use them, and their full
      edit history. Strategies are authored in the Fintela app; every endpoint
      here is a <C>GET</C>.
    </Lead>

    <Heading id="endpoints" level={2}>
      Endpoints
    </Heading>
    <ApiEndpoint method="GET" path="/strategies" description="List strategies as an { id: name } map." />
    <ApiEndpoint method="GET" path="/strategies/metadata" description="Full record — code, parameters, linked studies. Filter with ?strategy_ids=1,2,3." />
    <ApiEndpoint method="GET" path="/strategies/params" description="Parameter definitions only. Filter with ?strategy_ids=1,2,3." />
    <ApiEndpoint method="GET" path="/v2/strategies/:id/versions" description="Append-only edit history for one strategy, newest first." />
    <ApiEndpoint method="GET" path="/v1/strategies" description="Legacy alias of /strategies — identical response." />

    <P>
      Every response is wrapped in a <C>data</C> envelope, and every read applies
      the visibility of the user who created the key. A colleague's private
      strategy is simply absent from the list rather than returning an error.
    </P>

    <Heading id="list" level={2}>
      List strategies
    </Heading>
    <P>
      The list endpoint returns the smallest useful payload — a map of strategy
      id to name — so it is the cheapest way to discover what ids exist before
      fetching detail. Keys are JSON object keys, so ids arrive as strings.
    </P>
    <CodeBlock
      language="bash"
      filename="List names"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/strategies

# → { "data": { "7": "roc_top_n", "12": "mean_reversion" } }`}
    />
    <P>
      <C>/v1/strategies</C> is a legacy alias kept for backward compatibility. It
      is bound to the same handler and returns byte-identical output — prefer the
      unversioned path in new code.
    </P>

    <Heading id="metadata" level={2}>
      Full metadata
    </Heading>
    <P>
      <C>/strategies/metadata</C> returns the complete record for each visible
      strategy, keyed by id. Pass <C>?strategy_ids=</C> with a comma-separated
      list to narrow it; omit the filter to get every strategy the key can see.
    </P>
    <CodeBlock
      language="bash"
      filename="Full metadata"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/strategies/metadata?strategy_ids=7,12"`}
    />
    <CodeBlock language="json" filename="Response" code={METADATA_RESPONSE} />

    <ParamTable
      caption="Fields per strategy"
      rows={[
        { name: 'name', type: 'string', description: 'Strategy name, unique within the organization.' },
        { name: 'description', type: 'string | null', description: 'Free-form description shown in the app.' },
        { name: 'execution_type', type: '"internal" | "external"', description: <>Whether the strategy runs as Python code on Fintela, or as a call out to an HTTPS endpoint you host.</> },
        { name: 'execution_details', type: 'object', description: <>For <C>internal</C>: <C>{`{ code }`}</C>. For <C>external</C>: <C>{`{ endpoint, timeout, max_concurrency }`}</C>.</> },
        { name: 'parameters', type: 'array', description: <>Hyperparameter declarations — see <C>/strategies/params</C> below for the field-by-field breakdown.</> },
        { name: 'studies', type: 'number[]', description: 'Ids of the studies that reference this strategy. Empty if it has never been optimized.' },
        { name: 'created_at', type: 'string | null', description: 'Postgres timestamp text, e.g. "2025-11-04 09:12:41.882374+00".' },
        { name: 'updated_at', type: 'string | null', description: 'Same format; moves on every material edit.' },
      ]}
    />

    <Callout variant="warning" title="Explicit ids are checked one by one">
      With <C>?strategy_ids=</C>, each id is verified against the key owner's
      visibility before anything is returned. A malformed id returns{' '}
      <C>400 Bad Request</C>; an id that exists but is not visible to the key
      owner — or does not exist at all — returns{' '}
      <C>406 Not Acceptable</C> with <C>{`{"message": "Strategy 7 not found"}`}</C>,
      and the whole request fails rather than returning a partial map. Omitting
      the filter never fails this way: it just returns what is visible.
    </Callout>

    <Heading id="params" level={2}>
      Parameter definitions
    </Heading>
    <P>
      When you only need to know what a strategy takes — to build a UI, validate
      a config, or mirror the search space in your own tooling —{' '}
      <C>/strategies/params</C> returns just the hyperparameter declarations,
      keyed by strategy id, with the code left out.
    </P>
    <CodeBlock language="json" filename="GET /strategies/params?strategy_ids=7" code={PARAMS_RESPONSE} />
    <ParamTable
      caption="Fields per parameter"
      rows={[
        { name: 'name', type: 'string', description: 'The argument name your strategy function receives.' },
        { name: 'dtype', type: 'string', description: <>One of <C>integer</C>, <C>float</C> or <C>categorical</C>.</> },
        { name: 'is_window', type: 'boolean', description: 'True when the parameter is a lookback window, which is what drives warm-up requirements before the simulation start date.' },
        { name: 'choices', type: 'string[]', description: <>Present only for <C>categorical</C> parameters — the declared value set a study may explore or pin. Omitted otherwise.</> },
      ]}
    />
    <P>
      Unlike <C>/strategies/metadata</C>, this endpoint does not fail on an
      unknown or invisible id: unreadable strategies are dropped from the result,
      so ask for three ids and you may get back two. Compare the returned keys
      against the ids you requested rather than assuming a one-to-one mapping.
    </P>

    <Heading id="versions" level={2}>
      Version history
    </Heading>
    <P>
      Every material edit to a strategy — its code, its execution details, its
      parameters — appends a row to an immutable version log. A study pins the
      version it launched with, so history is how you reproduce what a past run
      actually executed even after the strategy kept evolving.
    </P>
    <CodeBlock
      language="bash"
      filename="Version history"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v2/strategies/7/versions`}
    />
    <CodeBlock language="json" filename="Response (newest first)" code={VERSIONS_RESPONSE} />
    <Ul>
      <li>Rows are ordered by <C>version_number</C> descending, so <C>data[0]</C> is the current live definition</li>
      <li><C>version_number</C> starts at <C>1</C> when the strategy is created and increments on each captured edit; <C>version_id</C> is a global, monotonic row id</li>
      <li><C>note</C> carries the change note the author typed in the app, or <C>null</C></li>
      <li><C>created_at</C> is ISO-8601 UTC — <C>YYYY-MM-DDTHH:MM:SSZ</C> — unlike the Postgres-style timestamps on <C>/strategies/metadata</C></li>
      <li><C>snapshot_extra_data_config</C> and <C>snapshot_strategy_type</C> are frozen historical columns. They are <C>null</C> on anything recorded since data pipelines replaced them, and are kept only so old versions stay readable</li>
    </Ul>
    <Callout variant="info" title="An invisible strategy returns an empty list">
      Asking for the versions of a strategy that does not exist, belongs to
      another organization, or is not visible to the key owner returns{' '}
      <C>200 OK</C> with <C>{`{"data": []}`}</C> — not a <C>404</C>. Treat an
      empty array as "nothing to show", not as "the strategy exists but has no
      history": a real strategy always has at least version <C>1</C>.
    </Callout>

    <Heading id="authoring" level={2}>
      Authoring happens in the app
    </Heading>
    <P>
      There is no endpoint here to create, edit, delete or sandbox-run a
      strategy. Writing a strategy means compiling and validating code, and
      sandbox-running one means executing a simulation — both consume metered
      compute, so both live in the app where that metering applies. Use this API
      to read the result of that work.
    </P>

    <Callout variant="info" title="Custom data is wired through data pipelines">
      Strategies take no inline data field. Custom inputs — built-in feeds or
      your own external sources — reach strategies, fitness functions, and risk
      managers through <strong>data pipelines</strong> wired in the platform
      (Registry → Data pipelines), not as a property of the strategy itself. See{' '}
      <Box component="a" href="/documentation/configuration/additional-data" sx={{ color: '#667eea' }}>
        Data pipelines
      </Box>{' '}
      for the full reference.
    </Callout>
  </DocsLayout>
);
