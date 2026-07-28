// The auth example (curl), the visibility table, the summary and the compact /
// inline copy are single-sourced from src/docs-content (the `@docs-content`
// alias) so this block and its app-tree twin
// (the Fintela app's matching doc block) cannot drift again — they
// previously documented different, partly-wrong things until corrected to the
// read-only reality. This tree keeps its own DocBlock wrapper, meta.id /
// meta.docPath, full-default render(), <Heading id> anchors, and inline
// <strong>/<C> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { authentication } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C } from '../../components/Prose';
import { CodeBlock } from '../../components/CodeBlock';
import { Callout } from '../../components/Callout';
import { DataTable } from '../../components/DataTable';
import type { DocBlock } from '../../registry/types';

export const apiAuthBlock: DocBlock = {
  meta: {
    id: 'api-auth',
    title: 'API authentication',
    summary: authentication.summary,
    category: 'api',
    tags: ['api', 'auth', 'api key', 'bearer', 'authorization', 'visibility'],
    appContexts: ['api-config', 'integrations', 'onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['external-strategies', 'external-fitness'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: ['api key', 'bearer', 'auth', 'authorization header', 'organization', 'visibility', 'read-only'],
    docPath: 'api#auth',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="api-auth" level={2}>
              Authentication
            </Heading>
            <P>
              Authentication is by <strong>API key</strong>. Create one in the Fintela app
              under your organization's developer settings, then send it as a Bearer token
              on every request. The key is shown once at creation — store it in your secret
              manager, and revoke it in the app if it leaks.
            </P>
            <CodeBlock language="bash" filename="Authenticated request" code={authentication.authExample} />
            <Callout variant="warning" title="Header only — never the query string">
              The key is read from the <C>Authorization</C> header and nowhere else.
              Passing it as <C>?api_key=…</C> does not authenticate you. A request without
              the header returns <C>401 Unauthorized</C>, as does a revoked key.
            </Callout>
            <P>
              There are no scopes to configure. A key resolves to two things — the{' '}
              <strong>organization</strong> it was issued in and the <strong>user</strong>{' '}
              who created it — and every read applies that owner's own visibility:
            </P>
            <DataTable
              headers={['Resource', 'Visible through the API?']}
              cols="1.2fr 2fr"
              rows={authentication.visibility.map(({ resource, visible }) => [
                // Re-apply this tree's inline <C> emphasis on the code-token grants;
                // the shared resource strings are plain data.
                resource === 'Shared with the owner as full' ? (
                  <>Shared with the owner as <C>full</C></>
                ) : resource === 'Shared with the owner as results_only' ? (
                  <>Shared with the owner as <C>results_only</C></>
                ) : (
                  resource
                ),
                visible,
              ])}
            />
            <P>
              A key is not an organization-wide master key: a colleague's private strategy
              stays private even though you share an org. And a <C>results_only</C> grant
              is intentionally app-only — requesting such a resource by id behaves as if it
              does not exist.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              Every endpoint requires an API key sent as a Bearer token in the{' '}
              <C>Authorization</C> header. Create a key in the Fintela app under your
              organization's developer settings.
            </P>
            <CodeBlock language="bash" filename="Authorization header" code={authentication.authExample} />
            <Callout variant="info" title="No scopes — the owner's visibility applies">
              A key resolves to the organization it was issued in and the user who created
              it, and reads exactly what that user can see. Resources shared as{' '}
              <C>results_only</C> are not exposed programmatically — use the web app.
            </Callout>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {authentication.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {authentication.inline}
          </Typography>
        );
    }
  },
};
