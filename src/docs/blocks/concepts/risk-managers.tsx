// The summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias). This block is landing-only
// today (no app-tree twin), but its content lives in one place so a future twin
// stays in sync. This tree keeps its own DocBlock wrapper, meta.id / meta.docPath,
// full-default render(), <Heading id> anchors, NavPath, and inline <strong>
// emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { riskManagers } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P } from '../../components/Prose';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const riskManagersBlock: DocBlock = {
  meta: {
    id: 'risk-managers',
    title: 'Risk managers',
    summary: riskManagers.summary,
    category: 'concepts',
    tags: ['risk manager', 'risk', 'drawdown', 'stop loss', 'exposure', 'governance'],
    appContexts: ['studies', 'optimizer-config', 'analytics', 'onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['strategies', 'studies', 'portfolios', 'additional-data'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: [
      'risk manager',
      'risk management',
      'drawdown',
      'stop loss',
      'trailing stop',
      'take profit',
      'exposure cap',
      'position cap',
      'halt',
      'guardrail',
    ],
    docPath: 'concepts#risk-managers',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="risk-managers" level={2}>
              Risk managers
            </Heading>
            <NavPath steps={['Registry', 'Risk Managers']} />
            <P>
              A <strong>risk manager</strong> is a governance layer that runs on every
              step of a backtest, before the strategy rebalances, and applies protective
              actions on the portfolio as it stood after the previous step — closing
              positions, pausing rebalancing, or trimming holdings that breach a limit.
              It runs alongside the strategy, not inside it: halts can suppress the
              strategy's rebalance on the same step, and reactive protections (stop loss,
              trailing stop, take profit) close existing positions before the strategy
              acts. Allocation caps (position, sector, country, gross-exposure, cash
              floor) trim holdings that already exceed the limit; they do not pre-screen
              new orders, so a fresh rebalance that breaches a cap is corrected on the
              next step.
            </P>
            <P>
              Risk managers come in four flavors so you can match the effort to the
              need: <strong>built-in</strong> rules from the catalog (stop loss,
              trailing stop, take profit, max drawdown, exposure and position caps,
              time-window halts), <strong>rule-based</strong> risk managers you compose
              visually with no code, <strong>custom</strong> risk managers you write in
              Python, and <strong>external</strong> risk managers you host behind your
              own endpoint. Each one is versioned, can be shared, and can be tested in a
              sandbox. See{' '}
              <Box
                component="a"
                href="/documentation/workflows/risk-managers"
                sx={{ color: '#667eea' }}
              >
                Managing risk managers
              </Box>{' '}
              for the full walkthrough.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              A <strong>risk manager</strong> runs on every step of a backtest, before
              the strategy rebalances, and applies protective actions on the portfolio
              from the previous step — closing positions, halting rebalancing, or
              trimming holdings that breach a limit. Choose a built-in rule, compose one
              visually with no code, write your own in Python, or host one behind your
              own endpoint.
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {riskManagers.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {riskManagers.inline}
          </Typography>
        );
    }
  },
};
