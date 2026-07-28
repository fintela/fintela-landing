// The summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias) so this block and its app-tree
// twin cannot drift again. This tree keeps its own DocBlock wrapper,
// meta.id / meta.docPath, full-default render(), <Heading id> anchors, NavPath,
// and inline <strong> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { portfolios } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P } from '../../components/Prose';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const portfoliosBlock: DocBlock = {
  meta: {
    id: 'portfolios',
    title: 'Portfolios',
    summary: portfolios.summary,
    category: 'concepts',
    tags: ['portfolio', 'backtest', 'equity curve', 'trades', 'metrics', 'performance'],
    appContexts: ['studies', 'analytics', 'onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['studies', 'optimizer-lifecycle', 'live-agents', 'risk-managers'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: ['portfolio', 'backtest', 'equity', 'trades', 'holdings', 'metrics', 'sharpe', 'drawdown', 'lineage', 'derived portfolio'],
    docPath: 'concepts#portfolios',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="portfolios" level={2}>
              Portfolios
            </Heading>
            <NavPath steps={['Analytics', 'Portfolios']} />
            <P>
              Every successful trial produces a <strong>portfolio</strong> — a complete
              backtest result for one parameter combination, including the equity curve,
              every trade, holdings at any point in time, and 20+ performance metrics
              across all stages.
            </P>
            <P>
              The portfolio is the artifact you compare against, share with stakeholders,
              and ultimately promote to live trading. It also records the configuration
              it was produced with — including any risk managers that were attached — and
              its <strong>lineage</strong>: if a portfolio was derived from another one,
              it keeps a link back to its source, so you can trace and compare a family of
              related portfolios. See{' '}
              <Box component="a" href="/documentation/workflows/results" sx={{ color: '#667eea' }}>
                Analyzing results
              </Box>{' '}
              for a full walkthrough of the portfolio dashboard.
            </P>
            <P>
              From the dashboard you can also run an <strong>invert what-if</strong>: flip
              every position Long↔Short and instantly re-simulate the portfolio to see its{' '}
              <strong>contrarian</strong> equity curve and metrics overlaid on the original.
              It is a transient preview — nothing is saved and live trading is untouched — so
              you can answer “what if this had gone the other way?” without creating a new study.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              Each successful trial produces a <strong>portfolio</strong> — a complete
              backtest record including the equity curve, every individual trade,
              holdings snapshots, and 20+ performance metrics (Sharpe, drawdown,
              Calmar, etc.) across the train, validation, and OOS windows.
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {portfolios.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {portfolios.inline}
          </Typography>
        );
    }
  },
};
