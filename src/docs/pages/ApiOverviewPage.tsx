import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C, Ul } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { Callout } from '../components/Callout';
import { DataTable } from '../components/DataTable';

const toc = [
  { id: 'api-overview', title: 'API overview', level: 2 as const },
  { id: 'read-only', title: 'Read-only by design', level: 2 as const },
  { id: 'base-url', title: 'Base URL', level: 2 as const },
  { id: 'auth', title: 'Authentication', level: 2 as const },
  { id: 'visibility', title: 'What a key can see', level: 2 as const },
  { id: 'conventions', title: 'Request conventions', level: 2 as const },
  { id: 'response-shape', title: 'Response shape', level: 2 as const },
  { id: 'rate-limits', title: 'Rate limits', level: 2 as const },
];

export const ApiOverviewPage = () => (
  <DocsLayout
    pageId="api-overview"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Overview' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="api-overview" level={1}>
      API overview
    </Heading>
    <Lead>
      The Fintela developer API is a <strong>read-only</strong> JSON over HTTPS
      API for pulling your results out of the platform. Every endpoint is a{' '}
      <C>GET</C>. Strategies, fitness functions, studies, portfolios and baskets
      are created and controlled in the Fintela app;{' '}
      <C>POST</C>, <C>PUT</C>, <C>PATCH</C> and <C>DELETE</C> are rejected. There
      are no SDKs to install — every endpoint is one <C>curl</C> away.
    </Lead>

    <Heading id="read-only" level={2}>
      Read-only by design
    </Heading>
    <P>
      The split is deliberate. Anything that <em>creates</em> work — launching a
      study, validating code against the compiler, refreshing or simulating a
      basket, promoting a trial — consumes compute that is metered against your
      organization's token balance, so it lives in the app where that metering
      applies. Results are already paid for, so reading them is what this API
      does.
    </P>
    <P>
      In practice that means the API answers questions about resources that
      already exist. Build them once in the app, then poll, export, or feed them
      into your own notebooks and dashboards from here.
    </P>
    <Callout variant="info" title="Write verbs are rejected">
      There is no mutating surface at all. A <C>POST</C>, <C>PUT</C>,{' '}
      <C>PATCH</C> or <C>DELETE</C> to any path returns{' '}
      <C>405 Method Not Allowed</C> or <C>404 Not Found</C> — never a partial
      write. CORS preflight advertises <C>GET</C> only.
    </Callout>

    <Heading id="base-url" level={2}>
      Base URL
    </Heading>
    <CodeBlock
      language="http"
      filename="Base URL"
      code={`https://developer.fintela.io`}
    />
    <P>
      Every path in this reference is relative to that base URL. Responses are
      always JSON. Requests carry no body, so there is no <C>Content-Type</C> to
      set — filters and options travel in the query string.
    </P>

    <Heading id="auth" level={2}>
      Authentication
    </Heading>
    <P>
      Authentication is by <strong>API key</strong>. Create one in the Fintela
      app under your organization's developer settings, then send it as a Bearer
      token on every request. The key is shown once at creation — store it in
      your secret manager, and revoke it in the app if it leaks.
    </P>
    <CodeBlock
      language="bash"
      filename="Authenticated request"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/strategies`}
    />
    <Callout variant="warning" title="Header only — never the query string">
      The key is read from the <C>Authorization</C> header and nowhere else.
      Passing it as <C>?api_key=…</C> does not authenticate you: query strings
      leak into access logs, proxy logs, browser history and <C>Referer</C>{' '}
      headers, so a secret must never ride in one. A request without the header
      returns <C>401 Unauthorized</C>, as does a revoked key.
    </Callout>

    <Heading id="visibility" level={2}>
      What a key can see
    </Heading>
    <P>
      There are no scopes to configure. A key resolves to two things — the{' '}
      <strong>organization</strong> it was issued in and the <strong>user</strong>{' '}
      who created it — and every read applies that owner's own visibility. A key
      therefore sees exactly what its owner sees in the app, no more:
    </P>
    <DataTable
      headers={['Resource', 'Visible through the API?']}
      cols="1.2fr 2fr"
      rows={[
        ['Owned by the key owner', 'Yes'],
        ['Shared with the whole organization', 'Yes'],
        [<>Shared with the owner as <C>full</C></>, 'Yes'],
        [<>Shared with the owner as <C>results_only</C></>, 'No — use the web app'],
        ['Belonging to another organization', 'No'],
      ]}
    />
    <P>
      Two consequences worth designing around. First, a key is not an
      organization-wide master key: a colleague's private strategy stays private
      even though you share an org. If an integration needs broader coverage,
      share the resources with the org in the app rather than looking for a
      wider key. Second, <C>results_only</C> grants are intentionally
      app-only — that sharing mode exists to show someone results without
      handing over the underlying definition, and a programmatic export would
      defeat it. Requesting such a resource by id behaves as if it does not
      exist.
    </P>

    <Heading id="conventions" level={2}>
      Request conventions
    </Heading>
    <Ul>
      <li>Every endpoint is a <C>GET</C>; all filters and options are query parameters</li>
      <li>Dates use ISO format: <C>YYYY-MM-DD</C></li>
      <li>Collections are filtered by a comma-separated id list named after the resource — <C>?study_ids=1,2,3</C>, <C>?strategy_ids=1,2,3</C>. A malformed id returns <C>400 Bad Request</C></li>
      <li>Detail endpoints expand optional blocks with <C>?include=</C>, also comma-separated — for example <C>?include=equity,holdings,metrics</C>. Omit it to get the summary</li>
      <li>Money and percentages are expressed as decimals, not strings</li>
      <li>Ids are positive integers for studies, strategies, fitness functions, trials and portfolios; baskets and their operations are identified by UUID</li>
    </Ul>

    <Heading id="response-shape" level={2}>
      Response shape
    </Heading>
    <P>
      Successful responses are wrapped in a <C>data</C> envelope; error
      responses carry a single <C>message</C> field:
    </P>
    <CodeBlock
      language="json"
      filename="Success"
      code={`{
  "data": 42
}`}
    />
    <CodeBlock
      language="json"
      filename="Error"
      code={`{
  "message": "Invalid or revoked API key"
}`}
    />
    <P>
      Client errors carry a specific, actionable <C>message</C>. Server errors
      (<C>500</C>) are deliberately generic — internal detail is logged on
      Fintela's side and never returned — so treat a <C>500</C> as retryable
      rather than parsing it.
    </P>

    <Heading id="rate-limits" level={2}>
      Rate limits
    </Heading>
    <P>
      Requests are rate-limited <strong>per organization</strong>, not per key
      or per user, by a token bucket that refills at{' '}
      <strong>20 requests per second</strong> with a{' '}
      <strong>burst capacity of 40</strong>. Short spikes above 20 rps are
      absorbed by the burst; sustained traffic settles at the refill rate.
    </P>
    <P>
      Exceeding the bucket returns <C>429 Too Many Requests</C> with a{' '}
      <C>Retry-After: 1</C> header. The bucket refills in well under a second,
      so honouring that header is enough to recover — retrying immediately just
      re-feeds the limiter.
    </P>
    <Callout variant="tip" title="The budget is shared">
      Every key in an organization draws on the same bucket, so parallel workers
      and scheduled jobs compete with each other. Poll on a fixed interval,
      batch reads with the comma-separated id filters instead of one request per
      id, and back off on <C>429</C>.
    </Callout>
  </DocsLayout>
);
