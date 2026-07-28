// The response contract example, the FastAPI implementation snippet, the "when
// to use" list, the endpoint description, the summary and the compact / inline
// copy are single-sourced from src/docs-content (the `@docs-content` alias) so
// this block and its app-tree twin cannot drift again. This tree keeps its own
// DocBlock wrapper, meta.id / meta.docPath, full-default render(), <Heading id>
// anchors, ApiEndpoint / Callout markup, and inline <C> emphasis (the shared
// prose is plain data).
import { Box, Typography } from '@mui/material';
import { externalStrategies } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C, Ul } from '../../components/Prose';
import { CodeBlock } from '../../components/CodeBlock';
import { ApiEndpoint } from '../../components/ApiEndpoint';
import { Callout } from '../../components/Callout';
import type { DocBlock } from '../../registry/types';

export const externalStrategiesBlock: DocBlock = {
  meta: {
    id: 'external-strategies',
    title: 'External strategies',
    summary: externalStrategies.summary,
    category: 'modes',
    tags: ['external', 'strategy', 'endpoint', 'http', 'signal', 'simulate'],
    appContexts: ['strategy-page', 'api-config', 'integrations', 'onboarding'],
    complexity: 'intermediate',
    relatedBlocks: ['strategies', 'external-fitness', 'api-auth'],
    apiRelevance: true,
    onboardingRelevance: false,
    keywords: ['external strategy', 'simulate endpoint', 'http', 'signal', 'position', 'allocation', 'fastapi', 'express'],
    docPath: 'modes/external-strategies',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="external-strategies" level={2}>
              External strategies
            </Heading>
            <P>
              An external strategy is an HTTPS endpoint that you own. Fintela stores
              only the URL and HTTP-client settings — your code never leaves your
              infrastructure. The optimizer calls your endpoint once per trial.
            </P>

            <Heading id="when-to-use-external" level={3}>
              When to use
            </Heading>
            <Ul>
              {externalStrategies.whenToUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </Ul>

            <Heading id="endpoint-contract-ext" level={3}>
              Endpoint contract
            </Heading>
            <P>
              Your service must accept a <C>POST</C> to <C>/simulate</C> with parameters
              in the request body and dates in the query string:
            </P>
            <ApiEndpoint
              method="POST"
              path="{your-endpoint}/simulate"
              description={externalStrategies.endpointDescription}
            />
            <CodeBlock language="json" code={externalStrategies.responseExample} filename="200 OK" />

            <Callout variant="warning" title="Asymmetry: body vs query string">
              {externalStrategies.contractNote}
            </Callout>

            <Callout variant="tip" title="Optional: validation universe">
              When you attach a validation universe (a asset group or explicit
              tickers), the JSON body also carries an additive <C>tickers</C> array
              with the chosen ticker codes. A universe-parametric endpoint can use it
              to scope its output; endpoints that ignore unknown keys are unaffected.
              It's optional and absent when no universe is set.
            </Callout>

            <Heading id="ext-strat-example" level={3}>
              Minimal implementation
            </Heading>
            <CodeBlock language="python" code={externalStrategies.implementationExample} filename="Python · FastAPI" />
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              An external strategy is a <C>POST /simulate</C> endpoint you host. The
              optimizer calls it once per trial, passing trial parameters (and, when a
              validation universe is set, an optional <C>tickers</C> list) in the request
              body and the date range as query params. Your code returns a signal map.
            </P>
            <CodeBlock language="json" code={externalStrategies.responseExample} filename="Expected response" />
            <Callout variant="tip" title="Your infrastructure, your code">
              Fintela stores only the endpoint URL. Your strategy logic stays on your
              servers and never leaves your infrastructure.
            </Callout>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {externalStrategies.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {externalStrategies.inline}
          </Typography>
        );
    }
  },
};
