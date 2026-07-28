import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { Callout } from '../components/Callout';

const toc = [
  { id: 'guide-node', title: 'Node.js · Express', level: 2 as const },
  { id: 'install', title: '1. Install', level: 2 as const },
  { id: 'server', title: '2. Combined server', level: 2 as const },
  { id: 'production', title: '3. Production checklist', level: 2 as const },
];

const SERVER_CODE = `import express from "express";

const app = express();
app.use(express.json({ limit: "20mb" }));

// ───── Strategy ─────
app.post("/simulate", (req, res) => {
  const { start_date, end_date } = req.query;
  const params = req.body;

  // Your logic — build positions by date.
  const signal = {
    "2024-01-02": {
      AAPL: { position: "L", allocation: 0.5 },
      MSFT: { position: "L", allocation: 0.5 },
    },
  };

  res.json({ signal });
});

// ───── Fitness ─────
app.post("/evaluate", (req, res) => {
  const { risk_free = 0.02 } = req.query;
  const simulation_period = req.body;

  // Your scoring logic.
  const fitness = computeScore(simulation_period, Number(risk_free));

  res.json({ fitness });
});

app.get("/healthz", (_, res) => res.json({ ok: true }));

function computeScore(period, riskFree) {
  // ... placeholder
  return 1.32;
}

const port = process.env.PORT || 8000;
app.listen(port, () => console.log(\`listening on \${port}\`));`;

const PRODUCTION_CHECK = `# 1. Validate the payload
npm install zod
# Define schemas for params + simulation_period; reject malformed bodies early.

# 2. Bound concurrency
# Express does not bound by default — use a reverse proxy or set the
# Fintela strategy record's max_concurrency to match your container CPU.

# 3. Log every trial
# Log the trial's params + duration. You'll need this when debugging PRUNED
# trials surfaced by GET /studies/errors.

# 4. Handle slow downstream services
# If your code calls a database or upstream API, ensure timeouts
# are *shorter* than the strategy's \`timeout\` setting — otherwise
# Fintela kills the request and your work is wasted.`;

export const NodeGuidePage = () => (
  <DocsLayout
    pageId="guide-node"
    breadcrumbs={[{ label: 'Integration Guides' }, { label: 'Node.js · Express' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Integration Guides
      </Typography>
    </Box>
    <Heading id="guide-node" level={1}>
      Node.js · Express
    </Heading>
    <Lead>
      For teams whose stack is already JavaScript or TypeScript, an Express
      server can host both endpoints with the same pattern as the Python guide.
    </Lead>

    <Heading id="install" level={2}>
      1. Install
    </Heading>
    <CodeBlock
      language="bash"
      filename="Terminal"
      code={`npm init -y
npm install express`}
    />

    <Heading id="server" level={2}>
      2. Combined server
    </Heading>
    <P>
      A single Express app can serve both endpoints. Register two Fintela
      records — one for the strategy, one for the fitness — pointing at the
      same base URL.
    </P>
    <CodeBlock language="js" filename="server.js" code={SERVER_CODE} />

    <Callout variant="warning" title="Body size limit">
      The default Express body limit is 100kb — too small for some simulation
      periods. Bump it to <C>20mb</C> (as shown) or even higher for studies
      with long windows and many tickers.
    </Callout>

    <Heading id="production" level={2}>
      3. Production checklist
    </Heading>
    <P>
      Four things to wire up before letting a real study point at your endpoint:
    </P>
    <CodeBlock language="bash" filename="Checklist" code={PRODUCTION_CHECK} />

    <Callout variant="tip" title="See also">
      Pair this with the <a href="/documentation/api/errors">errors page</a> to
      understand how endpoint failures surface inside Fintela, and the{' '}
      <a href="/documentation/modes/external-strategies">external strategies</a>{' '}
      reference for the full contract.
    </Callout>
  </DocsLayout>
);
