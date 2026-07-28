// The request / response contract examples, the "when to use" list, the endpoint
// description, the summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias) so this block and its app-tree
// twin cannot drift again — the response key had drifted to "score" and the
// request shape was stale until corrected to the real "fitness" contract. This
// tree keeps its own DocBlock wrapper, meta.id / meta.docPath, full-default
// render(), <Heading id> anchors, ApiEndpoint / Callout markup, and inline
// <C> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { externalFitness } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C, Ul } from '../../components/Prose';
import { CodeBlock } from '../../components/CodeBlock';
import { ApiEndpoint } from '../../components/ApiEndpoint';
import { Callout } from '../../components/Callout';
import type { DocBlock } from '../../registry/types';

export const externalFitnessBlock: DocBlock = {
  meta: {
    id: 'external-fitness',
    title: 'External fitness',
    summary: externalFitness.summary,
    category: 'modes',
    tags: ['external', 'fitness', 'evaluate', 'endpoint', 'http', 'score', 'objective'],
    appContexts: ['fitness-page', 'api-config', 'integrations', 'optimizer-config'],
    complexity: 'intermediate',
    relatedBlocks: ['fitness-functions', 'external-strategies', 'studies'],
    apiRelevance: true,
    onboardingRelevance: false,
    keywords: ['external fitness', 'evaluate endpoint', 'scoring', 'score', 'fitness', 'http', 'custom'],
    docPath: 'modes/external-fitness',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="external-fitness" level={2}>
              External fitness
            </Heading>
            <P>
              An external fitness function is an HTTPS endpoint you own that scores each
              trial result. Fintela sends the full simulation output — trades, equity curve,
              and period metrics — and your endpoint returns a single scalar to maximize.
            </P>

            <Heading id="when-to-use-ext-fitness" level={3}>
              When to use
            </Heading>
            <Ul>
              {externalFitness.whenToUse.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </Ul>

            <Heading id="ext-fitness-contract" level={3}>
              Endpoint contract
            </Heading>
            <P>
              Fintela calls <C>POST /evaluate</C> on your base URL with the full simulation
              result in the request body:
            </P>
            <ApiEndpoint
              method="POST"
              path="{your-endpoint}/evaluate"
              description={externalFitness.endpointDescription}
            />
            <CodeBlock language="json" code={externalFitness.requestExample} filename="Request body" />
            <CodeBlock language="json" code={externalFitness.responseExample} filename="200 OK" />

            <Callout variant="warning" title="Inverse asymmetry from external strategies">
              {externalFitness.contractNote}
            </Callout>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              An external fitness endpoint scores each trial result. Fintela calls{' '}
              <C>POST /evaluate</C> with trades, equity curve, and metrics in the body.
              Your endpoint returns a single number — the optimizer maximizes it.
            </P>
            <CodeBlock language="json" code={externalFitness.responseExample} filename="Expected response" />
            <Callout variant="tip" title="Custom scoring logic">
              {externalFitness.tip}
            </Callout>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {externalFitness.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {externalFitness.inline}
          </Typography>
        );
    }
  },
};
