import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { ApiEndpoint } from '../components/ApiEndpoint';
import { ParamTable } from '../components/ParamTable';
import { Callout } from '../components/Callout';

const toc = [
  { id: 'api-fitness-data', title: 'Fitness & asset groups', level: 2 as const },
  { id: 'endpoints', title: 'Endpoints', level: 2 as const },
  { id: 'list-fitness', title: 'List fitness functions', level: 2 as const },
  { id: 'fitness-metadata', title: 'Full metadata', level: 2 as const },
  { id: 'fitness-versions', title: 'Version history', level: 2 as const },
  { id: 'data-clusters', title: 'Asset groups', level: 2 as const },
];

const FITNESS_METADATA_RESPONSE = `{
  "data": {
    "4": {
      "name": "sharpe_with_drawdown_penalty",
      "description": "Sharpe, penalized for deep drawdowns.",
      "execution_type": "internal",
      "execution_details": {
        "code": "def fitness(equity, trades, penalty_weight):\\n    ..."
      },
      "parameters": [
        { "parameter_name": "penalty_weight", "dtype": "float",
          "description": "How hard to punish drawdown." }
      ],
      "studies": [31, 44],
      "created_at": "2025-11-04 09:12:41.882374+00",
      "updated_at": "2026-02-18 17:03:55.104219+00"
    }
  }
}`;

const FITNESS_VERSIONS_RESPONSE = `{
  "data": [
    {
      "version_id": 512,
      "version_number": 3,
      "snapshot_name": "sharpe_with_drawdown_penalty",
      "snapshot_execution_type": "INTERNAL",
      "snapshot_execution_details": { "code": "def fitness(...):\\n    ..." },
      "snapshot_parameters": [
        { "parameter_name": "penalty_weight", "dtype": "float" }
      ],
      "snapshot_extra_data_config": null,
      "note": "raised the penalty after the Q3 review",
      "created_at": "2026-02-18T17:03:55Z"
    }
  ]
}`;

const DATA_CLUSTERS_RESPONSE = `{
  "data": [
    {
      "id": 42,
      "name": "S&P 500 liquid names",
      "description": "Large caps filtered for average daily volume.",
      "ticker_count": 418,
      "created_at": "2026-01-09T13:44:02Z"
    },
    {
      "id": 17,
      "name": "Crypto majors",
      "description": null,
      "ticker_count": 12,
      "created_at": "2025-08-22T10:05:39Z"
    }
  ]
}`;

export const ApiFitnessDataPage = () => (
  <DocsLayout
    pageId="api-fitness-data"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Fitness & asset groups' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="api-fitness-data" level={1}>
      Fitness &amp; asset groups
    </Heading>
    <Lead>
      The two inputs that shape an optimization study: the{' '}
      <strong>fitness function</strong> that scores each trial, and the{' '}
      <strong>asset group</strong> that defines the ticker universe it runs
      over. Both are authored in the Fintela app — these endpoints read what
      exists, so you can reproduce, audit or document a study from outside the
      platform. Every endpoint here is a <C>GET</C>.
    </Lead>

    <Heading id="endpoints" level={2}>
      Endpoints
    </Heading>
    <ApiEndpoint method="GET" path="/fitness" description="List fitness functions as an { id: name } map." />
    <ApiEndpoint method="GET" path="/fitness/metadata" description="Full record — code, parameters, linked studies. Filter with ?fitness_ids=1,2,3." />
    <ApiEndpoint method="GET" path="/v2/fitness/:id/versions" description="Append-only edit history for one fitness function, newest first." />
    <ApiEndpoint method="GET" path="/v1/data_clusters" description="List the organization's asset groups with their ticker counts." />
    <P>
      Every response is wrapped in a <C>data</C> envelope, and every read
      applies the visibility of the user who created the key. A colleague's
      private fitness function is simply absent from the list rather than
      returning an error.
    </P>

    <Heading id="list-fitness" level={2}>
      List fitness functions
    </Heading>
    <P>
      The list endpoint returns the smallest useful payload — a map of fitness
      id to name, ordered by id — so it is the cheapest way to discover what
      exists before fetching detail. Keys are JSON object keys, so ids arrive
      as strings.
    </P>
    <CodeBlock
      language="bash"
      filename="List names"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/fitness

# → { "data": { "4": "sharpe_with_drawdown_penalty", "9": "calmar" } }`}
    />

    <Heading id="fitness-metadata" level={2}>
      Full metadata
    </Heading>
    <P>
      <C>/fitness/metadata</C> returns the complete record for each visible
      fitness function, keyed by id. Pass <C>?fitness_ids=</C> with a
      comma-separated list to narrow it; omit the filter to get everything the
      key can see.
    </P>
    <CodeBlock
      language="bash"
      filename="Full metadata"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/fitness/metadata?fitness_ids=4,9"`}
    />
    <CodeBlock language="json" filename="Response" code={FITNESS_METADATA_RESPONSE} />
    <ParamTable
      caption="Fields per fitness function"
      rows={[
        { name: 'name', type: 'string', description: 'Fitness name, unique within the organization.' },
        { name: 'description', type: 'string | null', description: 'Free-form description shown in the app.' },
        { name: 'execution_type', type: '"internal" | "external"', description: <>Whether the function runs as Python code on Fintela, or as a call out to an HTTPS endpoint you host.</> },
        { name: 'execution_details', type: 'object', description: <>For <C>internal</C>: <C>{`{ code }`}</C>. For <C>external</C>: <C>{`{ endpoint, timeout, max_concurrency }`}</C>.</> },
        { name: 'parameters', type: 'array', description: <>Declarations as <C>{`{ parameter_name, dtype, description? }`}</C>. Unlike strategy parameters, fitness parameters have no <C>is_window</C> flag — a fitness function scores a finished simulation, so there is no rolling window to declare.</> },
        { name: 'studies', type: 'number[]', description: 'Ids of the studies that reference this fitness function. Empty if it has never been used.' },
        { name: 'created_at', type: 'string | null', description: 'Postgres timestamp text, e.g. "2025-11-04 09:12:41.882374+00".' },
        { name: 'updated_at', type: 'string | null', description: 'Same format; moves on every material edit.' },
      ]}
    />
    <Callout variant="warning" title="Explicit ids are checked one by one">
      With <C>?fitness_ids=</C>, each id is verified against the key owner's
      visibility before anything is returned. A malformed id returns{' '}
      <C>400 Bad Request</C>; an id that exists but is not visible to the key
      owner — or does not exist at all — returns <C>406 Not Acceptable</C> with{' '}
      <C>{`{"message": "Fitness 4 not found"}`}</C>, and the whole request
      fails rather than returning a partial map. Omit the filter if you would
      rather receive whatever is visible.
    </Callout>

    <Heading id="fitness-versions" level={2}>
      Version history
    </Heading>
    <P>
      Every material edit to a fitness function appends a row to an
      append-only history. This is what lets you answer "what did this scoring
      function actually look like when that study ran?" months later — the
      code, the parameters and the data configuration are all snapshotted.
    </P>
    <CodeBlock
      language="bash"
      filename="Version history"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v2/fitness/4/versions`}
    />
    <CodeBlock language="json" filename="Response" code={FITNESS_VERSIONS_RESPONSE} />
    <ParamTable
      caption="Fields per version"
      rows={[
        { name: 'version_id', type: 'integer', description: 'Monotonic row id of the history entry.' },
        { name: 'version_number', type: 'integer', description: <>Per-fitness version counter. Rows come back <strong>newest first</strong>, ordered by this descending.</> },
        { name: 'snapshot_name', type: 'string', description: 'The name the function had at that version — renames are captured too.' },
        { name: 'snapshot_execution_type', type: 'string', description: <>Uppercase in the snapshot — <C>"INTERNAL"</C> or <C>"EXTERNAL"</C> — where the metadata endpoint reports lowercase. Compare case-insensitively.</> },
        { name: 'snapshot_execution_details', type: 'object | null', description: 'The code or endpoint configuration as it stood.' },
        { name: 'snapshot_parameters', type: 'array | null', description: 'Parameter declarations as they stood.' },
        { name: 'snapshot_extra_data_config', type: 'object | null', description: 'Any additional data configuration attached at that version.' },
        { name: 'note', type: 'string | null', description: 'Optional note recorded with the edit.' },
        { name: 'created_at', type: 'string', description: 'ISO-8601 UTC, e.g. "2026-02-18T17:03:55Z".' },
      ]}
    />
    <Callout variant="info" title="An empty array is the not-visible answer">
      This endpoint returns <C>{`{"data": []}`}</C> — not a <C>404</C> — for a
      fitness id the key owner cannot read at full fidelity, and the same empty
      array for one that genuinely has no history yet. Version snapshots carry
      historical source code, so they are withheld without confirming whether
      the id exists. Treat an empty array as "nothing available to you" rather
      than proof that the function was never edited.
    </Callout>

    <Heading id="data-clusters" level={2}>
      Asset groups
    </Heading>
    <P>
      A asset group is a named ticker universe that studies and strategies run
      over. The listing is a lightweight index — id, name, description and how
      many tickers are in it — ordered by creation time descending.
    </P>
    <CodeBlock
      language="bash"
      filename="List asset groups"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v1/data_clusters`}
    />
    <CodeBlock language="json" filename="Response" code={DATA_CLUSTERS_RESPONSE} />
    <ParamTable
      caption="Fields per cluster"
      rows={[
        { name: 'id', type: 'integer', description: 'Cluster id, as referenced by studies and strategies.' },
        { name: 'name', type: 'string', description: 'Display name given in the app.' },
        { name: 'description', type: 'string | null', description: 'Free-form description.' },
        { name: 'ticker_count', type: 'integer', description: 'How many tickers the cluster contains.' },
        { name: 'created_at', type: 'timestamp | null', description: 'Creation time, UTC. The list is ordered by this, descending.' },
      ]}
    />
    <P>
      The endpoint returns counts rather than the ticker list itself. When you
      need the constituents, open the cluster in the app — and note that this
      route has no detail sibling and takes no query parameters, so there is
      nothing to filter on. Clusters the key owner cannot read at full fidelity
      are omitted from the list entirely.
    </P>
  </DocsLayout>
);
