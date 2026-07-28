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
  { id: 'external-strategies', title: 'External strategies', level: 2 as const },
  { id: 'when-to-use', title: 'When to use', level: 2 as const },
  { id: 'endpoint-contract', title: 'Endpoint contract', level: 2 as const },
  { id: 'request-response', title: 'Request & response', level: 2 as const },
  { id: 'registering', title: 'Registering the strategy', level: 2 as const },
  { id: 'http-config', title: 'HTTP client configuration', level: 2 as const },
  { id: 'failure-handling', title: 'Failure handling', level: 2 as const },
  { id: 'examples', title: 'Reference examples', level: 2 as const },
];

const FASTAPI_EXAMPLE = `from fastapi import FastAPI, Query
from pydantic import BaseModel

app = FastAPI()

class SignalResponse(BaseModel):
    signal: dict

@app.post("/simulate", response_model=SignalResponse)
def simulate(
    params: dict,
    start_date: str = Query(...),
    end_date:   str = Query(...),
):
    # Build positions per date.
    # Each entry: {"position": "L" | "S", "allocation": float}
    return SignalResponse(signal={
        "2024-01-02": {
            "AAPL": {"position": "L", "allocation": 0.5},
            "MSFT": {"position": "L", "allocation": 0.5},
        },
    })`;

const EXPRESS_EXAMPLE = `import express from "express";

const app = express();
app.use(express.json());

app.post("/simulate", (req, res) => {
  const { start_date, end_date } = req.query;
  const params = req.body;

  // Your logic — build positions per date.
  res.json({
    signal: {
      "2024-01-02": {
        AAPL: { position: "L", allocation: 0.5 },
        MSFT: { position: "L", allocation: 0.5 },
      },
    },
  });
});

app.listen(8000);`;

const CURL_EXAMPLE = `curl -X POST "https://my-strategy.example.com/simulate?start_date=2024-01-01&end_date=2024-12-31" \\
     -H "Content-Type: application/json" \\
     -d '{"lookback_window": 20, "n_top": 5}'`;

const REGISTER_PAYLOAD = `POST /strategies

{
  "name": "proprietary_v2",
  "description": "Mean-reversion using internal regime model.",
  "execution_type": "external",
  "execution_details": {
    "endpoint":         "https://my-strategy.example.com",
    "timeout":          30.0,
    "max_concurrency":  8
  },
  "parameters": {
    "lookback": { "datatype": "integer", "is_window": true },
    "z_thresh": { "datatype": "float",   "is_window": false },
    "regime":   { "datatype": "categorical", "is_window": false,
                  "choices": ["trending", "mean_reverting"] }
  }
}`;

const RESPONSE_EXAMPLE = `{
  "signal": {
    "2024-01-02": {
      "AAPL": { "position": "L", "allocation": 0.5 },
      "MSFT": { "position": "L", "allocation": 0.5 }
    },
    "2024-02-01": {
      "AAPL": { "position": "S", "allocation": 0.3 }
    }
  }
}`;

export const ExternalStrategiesPage = () => (
  <DocsLayout
    pageId="external-strategies"
    breadcrumbs={[{ label: 'Optimization Modes' }, { label: 'External strategies' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Optimization Modes
      </Typography>
    </Box>
    <Heading id="external-strategies" level={1}>
      External strategies
    </Heading>
    <Lead>
      An external strategy is an HTTPS endpoint that you own. Fintela stores
      only the URL and HTTP-client settings — your code never leaves your
      infrastructure.
    </Lead>

    <Heading id="when-to-use" level={2}>
      When to use
    </Heading>
    <Ul>
      <li>Your alpha is in the strategy code and must stay on your servers</li>
      <li>You already have a research stack in another language or runtime</li>
      <li>You need direct access to private data, internal models, or licensed feeds</li>
      <li>You want to A/B test signal-generation versions independently of Fintela deploys</li>
    </Ul>

    <Heading id="endpoint-contract" level={2}>
      Endpoint contract
    </Heading>
    <P>
      The optimizer calls your endpoint once per trial. Your service must accept
      a <C>POST</C> to <C>/simulate</C> with parameters in the body and dates in
      the query string, and return a JSON signal.
    </P>

    <ApiEndpoint
      method="POST"
      path="{your-endpoint}/simulate"
      description="Generate position signals for a date range using a parameter sample."
    />

    <Heading id="request-response" level={3}>
      Request
    </Heading>
    <ParamTable
      caption="Query parameters"
      rows={[
        { name: 'start_date', type: 'string · YYYY-MM-DD', required: true, description: 'Inclusive start of the simulation window.' },
        { name: 'end_date', type: 'string · YYYY-MM-DD', required: true, description: 'Inclusive end of the simulation window.' },
      ]}
    />
    <ParamTable
      caption="Body"
      rows={[
        {
          name: '*',
          type: 'object',
          required: true,
          description: <>Flat map of declared parameter names to values for this trial — numbers for integer/float parameters, the chosen string for categorical ones. Example: <C>{`{"lookback": 20, "z_thresh": 1.5, "regime": "trending"}`}</C>.</>,
        },
      ]}
    />

    <Heading id="response" level={3}>
      Response
    </Heading>
    <P>
      Return a JSON body with a top-level <C>signal</C> key. The value is a
      nested map: <C>date → ticker → {`{ position, allocation }`}</C>.
    </P>
    <CodeBlock language="json" code={RESPONSE_EXAMPLE} filename="200 OK" />

    <DataTable
      headers={['Field', 'Type', 'Notes']}
      cols="1fr 1fr 2fr"
      rows={[
        ['date', 'string · YYYY-MM-DD', 'Trade date — must fall within the requested window'],
        ['ticker', 'string', 'Must be present in the asset group'],
        [<><C>position</C></>, '"L" | "S"', 'Long or short'],
        [<><C>allocation</C></>, 'number ∈ [0, 1]', 'Portfolio weight'],
      ]}
    />

    <Callout variant="warning" title="Asymmetry: body vs query string">
      Parameters travel in the JSON body; dates travel in the query string. This
      is the current contract and is mirrored in the validation endpoint.
      External fitness uses the inverse pattern (params in query, simulation
      period in body) — keep this in mind if you maintain both endpoints.
    </Callout>

    <Heading id="registering" level={2}>
      Registering the strategy
    </Heading>
    <P>
      Once your endpoint is live, create a Fintela strategy record pointing at
      its base URL.
    </P>
    <CodeBlock language="json" code={REGISTER_PAYLOAD} filename="POST /strategies" />

    <ParamTable
      caption="execution_details"
      rows={[
        { name: 'endpoint', type: 'string · URL', required: true, description: <>Base URL — the optimizer appends <C>/simulate</C>.</> },
        { name: 'timeout', type: 'number · seconds', default: '30.0', description: 'Per-request timeout passed to the HTTP client.', },
        { name: 'max_concurrency', type: 'integer', default: '4', description: 'Maximum simultaneous connections to your endpoint per optimizer worker.' },
      ]}
    />

    <Heading id="http-config" level={2}>
      HTTP client configuration
    </Heading>
    <P>
      The optimizer maintains a persistent connection pool to your endpoint,
      sized to <C>max_concurrency</C>. Connections are reused across trials
      within the same worker to minimise TLS handshake overhead.
    </P>
    <DataTable
      headers={['Setting', 'Value']}
      cols="1fr 1fr"
      rows={[
        ['Target URL', <><C>execution_details.endpoint</C></>],
        ['Max simultaneous connections', <><C>max_concurrency</C></>],
        ['Keep-alive pool size', <><C>max_concurrency</C></>],
        ['Per-request timeout', <><C>timeout</C> seconds</>],
      ]}
    />

    <Heading id="failure-handling" level={2}>
      Failure handling
    </Heading>
    <P>
      Every failure mode is collapsed into a pruned trial. Connection refused,
      DNS error, timeout, HTTP 4xx/5xx, malformed JSON, missing <C>signal</C>{' '}
      key — all mark the trial as failed. The failure message is
      stored on the trial and visible under <C>GET /studies/errors</C>.
    </P>
    <Callout variant="danger" title="No retries today">
      A failed trial is not automatically retried. If your endpoint flakes, that
      trial is gone — increase <C>timeout</C>, provision more headroom, or harden
      your service before launching large studies.
    </Callout>

    <Heading id="examples" level={2}>
      Reference examples
    </Heading>
    <P>
      Minimal reference implementations in three flavours — drop these into a
      container, expose port 8000, and you're ready to register the strategy.
    </P>
    <CodeBlock
      tabs={[
        { label: 'Python · FastAPI', language: 'python', code: FASTAPI_EXAMPLE },
        { label: 'Node.js · Express', language: 'js', code: EXPRESS_EXAMPLE },
        { label: 'cURL · test call', language: 'bash', code: CURL_EXAMPLE },
      ]}
    />
  </DocsLayout>
);
