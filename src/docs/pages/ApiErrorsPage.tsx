import { Box, Typography } from '@mui/material';
import { DocsLayout } from '../DocsLayout';
import { Heading } from '../components/Heading';
import { P, Lead, C } from '../components/Prose';
import { CodeBlock } from '../components/CodeBlock';
import { Callout } from '../components/Callout';
import { DataTable } from '../components/DataTable';

const toc = [
  { id: 'errors', title: 'Errors', level: 2 as const },
  { id: 'http-codes', title: 'HTTP status codes', level: 2 as const },
  { id: 'common-errors', title: 'Common request errors', level: 2 as const },
  { id: 'trial-failures', title: 'Trial-level failures', level: 2 as const },
  { id: 'studies-errors', title: 'Reading trial errors', level: 2 as const },
];

export const ApiErrorsPage = () => (
  <DocsLayout
    pageId="api-errors"
    breadcrumbs={[{ label: 'API Reference' }, { label: 'Errors' }]}
    toc={toc}
  >
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#667eea', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        API Reference
      </Typography>
    </Box>
    <Heading id="errors" level={1}>
      Errors & status codes
    </Heading>
    <Lead>
      Errors come from two layers — HTTP-level errors from the API (auth,
      malformed query parameters, rate limiting) and trial-level failures from
      inside the optimizer. Both are designed to be readable by humans and
      machines.
    </Lead>

    <Heading id="http-codes" level={2}>
      HTTP status codes
    </Heading>
    <DataTable
      headers={['Code', 'Meaning']}
      cols="0.6fr 2fr"
      rows={[
        ['200', 'OK — the read succeeded'],
        ['400', 'Bad request — a malformed or missing query parameter'],
        ['401', 'Unauthorized — missing, invalid, or revoked API key'],
        ['404', 'Not found — no such id, or it is not visible to your key'],
        ['405', 'Method not allowed — the API is read-only; only GET is served'],
        ['429', 'Too many requests — per-organization rate limit; honour Retry-After'],
        ['500', 'Internal error — generic by design, and retryable'],
      ]}
    />
    <Callout variant="info" title="404 and 405 overlap on write verbs">
      The API serves <C>GET</C> only. A <C>POST</C>, <C>PUT</C>, <C>PATCH</C> or{' '}
      <C>DELETE</C> to any path returns <C>405 Method Not Allowed</C> or{' '}
      <C>404 Not Found</C> — a router-level fallback makes the exact code
      version-dependent, so treat both as "this verb does not exist here".
      Resources are created and controlled in the Fintela app.
    </Callout>

    <Heading id="common-errors" level={2}>
      Common request errors
    </Heading>
    <P>
      All error bodies share the same shape — a single <C>message</C> field, and
      nothing else:
    </P>
    <CodeBlock
      language="json"
      filename="Error response"
      code={`{
  "message": "Invalid or revoked API key"
}`}
    />
    <DataTable
      headers={['Cause', 'Status', 'message']}
      cols="1.4fr 0.6fr 1.5fr"
      rows={[
        ['No Authorization header', '401', 'Missing API key. Provide it via the `Authorization: Bearer <key>` header.'],
        ['Revoked or unknown key', '401', 'Invalid or revoked API key'],
        [<>Malformed id in a CSV filter (<C>?study_ids=1,x</C>)</>, '400', "Invalid id: 'x'"],
        [<>Required filter omitted (<C>study_ids</C>)</>, '400', 'study_ids required'],
        ['Unknown id, or one your key cannot see', '404', 'Basket … not found / Trial … not found'],
        ['Write verb on any path', '405 / 404', '—'],
        ['Organization rate limit exceeded', '429', 'Rate limit exceeded for your organization on the developer API; please slow down.'],
        ['Anything unexpected server-side', '500', "Something went wrong on Fintela's side. Please try again in a moment."],
      ]}
    />
    <Callout variant="warning" title="A hidden resource returns 404, not 403">
      A key applies its owner's own visibility. A resource in another
      organization — or one shared with you only as <C>results_only</C> —
      behaves as if it does not exist rather than reporting that you lack
      access, so <C>404</C> means "not visible to this key" as often as it means
      "no such id".
    </Callout>
    <Callout variant="tip" title="Back off on 429">
      Rate limiting is <strong>per organization</strong> — a token bucket
      refilling at 20 requests per second with a burst of 40, shared by every key
      in the org. A <C>429</C> carries a <C>Retry-After: 1</C> header; the bucket
      refills in well under a second, so honouring it is enough to recover, while
      retrying immediately just re-feeds the limiter.
    </Callout>

    <Heading id="trial-failures" level={2}>
      Trial-level failures
    </Heading>
    <P>
      Inside the optimizer, every failure mode collapses into a failed trial
      record. The reason is stored as a <C>failure_reason</C> attribute on the
      trial and surfaced by <C>GET /studies/errors</C>.
    </P>
    <DataTable
      headers={['Cause', 'Trial state', 'failure_reason']}
      cols="1.4fr 0.7fr 1.4fr"
      rows={[
        ['Connection refused / DNS failure', 'PRUNED', 'Error details'],
        ['Request timeout', 'PRUNED', '"timed out" (or similar)'],
        ['HTTP 4xx / 5xx from your endpoint', 'PRUNED', 'Exception message'],
        [<>Missing <C>signal</C> / <C>fitness</C> key</>, 'PRUNED', "KeyError('signal')"],
        ['Strategy returned empty {}', 'PRUNED', 'Strategy returned an empty signal — …'],
        ['Exception in your endpoint handler', 'PRUNED', 'Error details'],
        ['NaN fitness (train / val / overall)', 'PRUNED', 'nan_fitness'],
        ['Batched simulation failure', 'PRUNED (whole batch)', 'Error details'],
        ['Portfolio batch write failure', 'PRUNED (whole batch)', 'Error details'],
      ]}
    />

    <Callout variant="warning" title="No automatic retries">
      A failed trial is not retried — the parameter sample is lost. If your
      external endpoint flakes, that trial is gone. Either harden your
      endpoint, raise <C>timeout</C>, or set <C>autostop_min_health</C> so the
      study halts when failure rate climbs too high.
    </Callout>

    <Heading id="studies-errors" level={2}>
      Reading trial errors
    </Heading>
    <P>
      Get a per-study error dashboard via:
    </P>
    <CodeBlock
      language="bash"
      filename="GET /studies/errors"
      code={`curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     "https://developer.fintela.io/studies/errors?study_ids=42"`}
    />
    <CodeBlock
      language="json"
      filename="200 OK"
      code={`{
  "data": {
    "42": {
      "error_summary": [
        { "failure_reason": "nan_fitness", "count": 12 },
        { "failure_reason": "Timeout",     "count": 3 }
      ],
      "failed_trials": [
        {
          "trial": 18,
          "failure_reason": "nan_fitness",
          "params": { "lookback": 7, "n_top": 1 }
        }
      ]
    }
  }
}`}
    />
    <P>
      The summary groups failures by reason for quick triage; the failed_trials
      list gives you concrete parameter combinations to reproduce locally.
    </P>
  </DocsLayout>
);
