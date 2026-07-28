import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C, Ul } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { ApiEndpoint } from '../components/ApiEndpoint';
import { ParamTable } from '../components/ParamTable';
import { Callout } from '../components/Callout';

const toc = [
  { id: 'api-trials-portfolios', title: 'Trials & portfolios', level: 2 as const },
  { id: 'taxonomy', title: 'Trials vs. managed portfolios', level: 2 as const },
  { id: 'trial-endpoints', title: 'Trial endpoints', level: 2 as const },
  { id: 'list-trials', title: 'List trials', level: 2 as const },
  { id: 'trial-detail', title: 'Fetch a trial', level: 2 as const },
  { id: 'trial-by-study', title: 'Address a trial by study and number', level: 2 as const },
  { id: 'portfolio-endpoints', title: 'Managed portfolio endpoints', level: 2 as const },
  { id: 'list-portfolios', title: 'List managed portfolios', level: 2 as const },
  { id: 'portfolio-detail', title: 'Fetch a managed portfolio', level: 2 as const },
];

const TRIAL_LIST_RESPONSE = `{
  "data": [
    {
      "trial_id": 8412,
      "study_name": "roc_top_n_q1",
      "trial_number": 37,
      "created_at": "2026-03-14T09:21:05",
      "managed_portfolio_id": 61
    },
    {
      "trial_id": 8411,
      "study_name": "roc_top_n_q1",
      "trial_number": 36,
      "created_at": "2026-03-14T09:20:44"
    }
  ]
}`;

const TRIAL_DETAIL_RESPONSE = `{
  "data": {
    "trial_id": 8412,
    "study_name": "roc_top_n_q1",
    "trial_number": 37,
    "created_at": "2026-03-14T09:21:05",
    "managed_portfolio_id": 61,
    "equity": {
      "2025-01-02": 100000.0,
      "2025-01-03": 100482.31
    },
    "holdings": {
      "2025-01-02": { "AAPL": 0.25, "MSFT": 0.25, "NVDA": 0.5 }
    },
    "metrics": {
      "is":  { "sharpe": 1.83, "cagr": 0.241, "max_drawdown": -0.118 },
      "oos": { "sharpe": 1.12, "cagr": 0.147, "max_drawdown": -0.163 }
    },
    "params": {
      "n_top": 3,
      "roc_window_size": 20,
      "ma_kind": "ema"
    }
  }
}`;

const PORTFOLIO_LIST_RESPONSE = `{
  "data": [
    {
      "managed_portfolio_id": 61,
      "name": "ROC Top 3 — live",
      "source_trial_portfolio_id": 8412,
      "daily_updates_enabled": true,
      "promoted_at": "2026-03-15T16:04:22Z"
    }
  ]
}`;

const PORTFOLIO_DETAIL_RESPONSE = `{
  "data": {
    "managed_portfolio_id": 61,
    "name": "ROC Top 3 — live",
    "source_trial_portfolio_id": 8412,
    "daily_updates_enabled": true,
    "promoted_at": "2026-03-15T16:04:22Z",
    "holdings": {
      "2026-03-16": {
        "AAPL": { "allocation": 0.5, "position": "L" },
        "TSLA": { "allocation": 0.5, "position": "S" }
      }
    },
    "orders": [
      {
        "order_date": "2026-03-16",
        "code": "AAPL",
        "action": "BUY",
        "position_side": "L",
        "quantity": 12.0,
        "resulting_quantity": 12.0,
        "source": "daily_update",
        "created_at": "2026-03-16T21:05:11Z"
      }
    ]
  }
}`;

export const ApiTrialsPortfoliosPage = () => (
  <DocsLayout
    pageId="api-trials-portfolios"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Trials & portfolios' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="api-trials-portfolios" level={1}>
      Trials &amp; portfolios
    </Heading>
    <Lead>
      Read the output of your optimization runs. Every endpoint here is a{' '}
      <C>GET</C> over results that already exist: studies are launched and
      trials are promoted in the Fintela app, and this API returns what those
      actions produced — equity curves, holdings, metrics, parameters and live
      orders.
    </Lead>

    <Heading id="taxonomy" level={2}>
      Trials vs. managed portfolios
    </Heading>
    <P>
      The two resources on this page look similar and are not
      interchangeable. A <strong>trial</strong> is one parameter sample
      evaluated by an optimization study — there are as many trials as the
      study ran, and they are frozen historical artifacts. A{' '}
      <strong>managed portfolio</strong> is a durable copy that a trial was{' '}
      <em>promoted</em> into: it has a name, it extends day by day, and it is
      what baskets trade.
    </P>
    <Ul>
      <li>Trials live at <C>/v2/trials</C> and are keyed by <C>trial_id</C> (a positive integer)</li>
      <li>Managed portfolios live at <C>/v2/portfolios</C> and are keyed by <C>managed_portfolio_id</C></li>
      <li>Lineage runs in both directions: a trial carries <C>managed_portfolio_id</C> once promoted, and a managed portfolio carries <C>source_trial_portfolio_id</C></li>
    </Ul>
    <P>
      That lineage is nullable on purpose. <C>managed_portfolio_id</C> is
      absent from a trial that was never promoted, and{' '}
      <C>source_trial_portfolio_id</C> is <C>null</C> when the source study was
      deleted — the managed copy keeps running on its own snapshot rather than
      disappearing with its origin.
    </P>
    <Callout variant="info" title="Promotion happens in the app">
      Promoting a trial copies data and signs the result up for daily updates,
      which is recurring billable compute. Like every other action that spends
      compute, it stays in the Fintela app — this API reports the outcome.
    </Callout>

    <Heading id="trial-endpoints" level={2}>
      Trial endpoints
    </Heading>
    <ApiEndpoint method="GET" path="/v2/trials" description="List every trial the key owner can read, newest first. Filter with ?study_name=." />
    <ApiEndpoint method="GET" path="/v2/trials/:trial_id" description="One trial by its numeric id, with optional equity, holdings, metrics and params blocks." />
    <ApiEndpoint method="GET" path="/v2/studies/:study_name/trials/:trial_number" description="The same trial addressed by the (study name, trial number) pair instead of the opaque id." />

    <Heading id="list-trials" level={2}>
      List trials
    </Heading>
    <P>
      The list is a summary view — one small row per trial, ordered by creation
      time descending. Use it to discover ids, then fetch the detail of the
      ones you care about.
    </P>
    <CodeBlock
      language="bash"
      filename="List trials in one study"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v2/trials?study_name=roc_top_n_q1"`}
    />
    <ParamTable
      caption="Query parameters"
      rows={[
        { name: 'study_name', type: 'string', description: <>Return only trials belonging to this study. Omit it to list every trial in scope. An unknown name is not an error — it simply matches nothing.</> },
      ]}
    />
    <CodeBlock language="json" filename="Response" code={TRIAL_LIST_RESPONSE} />
    <P>
      <C>managed_portfolio_id</C> is omitted entirely — not sent as{' '}
      <C>null</C> — for trials that were never promoted, so test for the key's
      presence rather than its value.
    </P>

    <Heading id="trial-detail" level={2}>
      Fetch a trial
    </Heading>
    <P>
      The detail endpoint returns the summary fields always, plus whichever
      heavy blocks you ask for with <C>include</C>. Nothing else is fetched, so
      keep the list to what you actually consume — an equity curve and a full
      holdings history are far larger than the metrics block.
    </P>
    <ParamTable
      caption="?include= — comma-separated, default metrics"
      rows={[
        { name: 'equity', type: 'date → number', description: <>Daily portfolio value over the simulated period, keyed by <C>YYYY-MM-DD</C>.</> },
        { name: 'holdings', type: 'date → ticker → number', description: <>Allocation per ticker per day, as a fraction of the portfolio.</> },
        { name: 'metrics', type: 'stage → metric → number', description: <>Performance metrics nested by stage — in-sample, out-of-sample and any other stage the study defined. <strong>Included by default</strong> when <C>include</C> is omitted.</> },
        { name: 'params', type: 'name → value', description: <>The parameter sample this trial evaluated. Numeric parameters come back as numbers; categorical ones as the decoded label string, not the internal index.</> },
      ]}
    />
    <CodeBlock
      language="bash"
      filename="Trial with everything"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v2/trials/8412?include=equity,holdings,metrics,params"`}
    />
    <CodeBlock language="json" filename="Response" code={TRIAL_DETAIL_RESPONSE} />
    <Callout variant="warning" title="Passing include replaces the default">
      Omitting <C>include</C> gives you <C>metrics</C>. Passing it gives you
      exactly what you named — so <C>?include=equity</C> returns the equity
      curve and <strong>no</strong> metrics. List <C>metrics</C> explicitly
      whenever you also want it.
    </Callout>

    <Heading id="trial-by-study" level={2}>
      Address a trial by study and number
    </Heading>
    <P>
      <C>trial_id</C> is an opaque internal id you can only learn from the list
      endpoint. When you already know which study and which trial number you
      want — from a report, a dashboard, or the study's own optimization
      history — address it directly instead:
    </P>
    <CodeBlock
      language="bash"
      filename="Composite key"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v2/studies/roc_top_n_q1/trials/37?include=metrics,params"`}
    />
    <P>
      The response is byte-for-byte the same shape as{' '}
      <C>/v2/trials/:trial_id</C>, and <C>include</C> behaves identically.
      Remember to URL-encode study names containing spaces or slashes.
    </P>
    <ParamTable
      caption="Failure modes"
      rows={[
        { name: '400 Bad Request', type: 'negative trial_number', description: <>Trial numbers are non-negative. A negative value is rejected up front rather than reported as a missing trial.</> },
        { name: '404 Not Found', type: 'unknown study', description: <>No study by that name is visible to the key owner. The message names the study.</> },
        { name: '404 Not Found', type: 'unknown trial', description: <>The study exists but has no such trial number. The two 404s carry different messages, so you can tell which half of the pair was wrong.</> },
      ]}
    />

    <Heading id="portfolio-endpoints" level={2}>
      Managed portfolio endpoints
    </Heading>
    <ApiEndpoint method="GET" path="/v2/portfolios" description="List the organization's managed portfolios, most recently promoted first." />
    <ApiEndpoint method="GET" path="/v2/portfolios/:id" description="One managed portfolio, with optional equity, holdings and orders blocks." />

    <Heading id="list-portfolios" level={2}>
      List managed portfolios
    </Heading>
    <CodeBlock
      language="bash"
      filename="List managed portfolios"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/v2/portfolios`}
    />
    <CodeBlock language="json" filename="Response" code={PORTFOLIO_LIST_RESPONSE} />
    <ParamTable
      caption="Summary fields"
      rows={[
        { name: 'managed_portfolio_id', type: 'integer', description: 'The id to use on the detail endpoint and the id baskets reference in their membership lists.' },
        { name: 'name', type: 'string', description: 'The name given at promotion time in the app.' },
        { name: 'source_trial_portfolio_id', type: 'integer | null', description: <>The trial this was promoted from — feed it straight to <C>/v2/trials/:trial_id</C>. <C>null</C> once the source study has been deleted.</> },
        { name: 'daily_updates_enabled', type: 'boolean', description: <>Whether the portfolio extends day by day. A portfolio with this off stops advancing and will go stale — see the basket freshness endpoint.</> },
        { name: 'promoted_at', type: 'timestamp', description: 'When the trial was promoted, UTC. The list is ordered by this, descending.' },
      ]}
    />

    <Heading id="portfolio-detail" level={2}>
      Fetch a managed portfolio
    </Heading>
    <P>
      Unlike trials, the detail endpoint defaults to the{' '}
      <strong>summary only</strong> — omit <C>include</C> and you get the five
      fields above and nothing else. Ask for the blocks you need:
    </P>
    <ParamTable
      caption="?include= — comma-separated, default none"
      rows={[
        { name: 'equity', type: 'date → number', description: 'Daily portfolio value since promotion.' },
        { name: 'holdings', type: 'date → ticker → object', description: <>Per-day, per-ticker <C>{`{ allocation, position }`}</C>. Richer than the trial equivalent: <C>position</C> is <C>"L"</C> or <C>"S"</C>, because managed portfolios trade live and shorts have to be distinguishable.</> },
        { name: 'orders', type: 'array', description: <>The order log, oldest first — one row per order with <C>order_date</C>, <C>code</C>, <C>action</C>, <C>position_side</C>, <C>quantity</C>, <C>resulting_quantity</C>, <C>source</C> and <C>created_at</C>.</> },
      ]}
    />
    <CodeBlock
      language="bash"
      filename="Holdings and orders"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/v2/portfolios/61?include=holdings,orders"`}
    />
    <CodeBlock language="json" filename="Response" code={PORTFOLIO_DETAIL_RESPONSE} />
    <Callout variant="info" title="No metrics block here">
      Managed portfolios deliberately do not materialize a <C>metrics</C>{' '}
      block — asking for one has no effect. For performance figures, read the
      metrics of the trial named by <C>source_trial_portfolio_id</C>, or
      compute your own from the <C>equity</C> series.
    </Callout>
    <P>
      Both endpoints apply the key owner's visibility. A managed portfolio the
      owner cannot read at full fidelity is absent from the list and returns{' '}
      <C>404 Not Found</C> by id, exactly as if it did not exist.
    </P>
  </DocsLayout>
);
