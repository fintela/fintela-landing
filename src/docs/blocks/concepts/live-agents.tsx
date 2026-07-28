// The summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias) so this block and its app-tree
// twin cannot drift again. This tree keeps its own DocBlock wrapper,
// meta.id / meta.docPath, full-default render(), <Heading id> anchors, NavPath,
// Callout, and inline <strong> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { liveAgents } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P } from '../../components/Prose';
import { Callout } from '../../components/Callout';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const liveAgentsBlock: DocBlock = {
  meta: {
    id: 'live-agents',
    title: 'Operations',
    summary: liveAgents.summary,
    category: 'concepts',
    tags: ['operation', 'live agent', 'broker', 'live trading', 'execution', 'real-time'],
    appContexts: ['analytics', 'onboarding', 'global'],
    complexity: 'advanced',
    relatedBlocks: ['portfolios', 'studies'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: ['operation', 'live agent', 'live trading', 'execution', 'pause', 'stop', 'positions', 'orders', 'pnl'],
    docPath: 'concepts#agents',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="agents" level={2}>
              Operations
            </Heading>
            <NavPath steps={['Portfolio Manager', 'Open a basket', 'Operations']} />
            <P>
              An <strong>operation</strong> invests a basket of validated portfolios
              through your brokerage account and executes the strategy in real time.
              From this point on, Fintela watches positions, logs orders, and surfaces P&L —
              and you can pause or stop the operation with one click.
            </P>
            <Callout variant="info">
              Before starting an operation, promote a portfolio into a basket and connect
              your brokerage under{' '}
              <strong>Account settings → Broker connections</strong>. See{' '}
              <Box component="a" href="/documentation/workflows/live-trading" sx={{ color: '#667eea' }}>
                Live trading
              </Box>{' '}
              for the full workflow.
            </Callout>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              An <strong>operation</strong> takes a basket of validated portfolios to
              real-time execution via your connected brokerage. Fintela monitors positions, logs every
              order, and surfaces live P&L — pause or stop the operation at any time.
            </P>
            <Callout variant="warning" title="Explicit confirmation required">
              Launching an operation requires explicit confirmation in the UI. This is
              intentional — operations move real capital.
            </Callout>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {liveAgents.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {liveAgents.inline}
          </Typography>
        );
    }
  },
};
