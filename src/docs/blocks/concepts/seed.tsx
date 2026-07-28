// The seed-shape code snippets, the summary and the compact / inline copy are
// single-sourced from src/docs-content (the `@docs-content` alias). This block
// is landing-only today (no app-tree twin), but its content lives in one place
// so a future twin stays in sync. This tree keeps its own DocBlock wrapper,
// meta.id / meta.docPath, full-default render(), <Heading id> anchors, NavPath,
// and inline <strong> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { seed } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P } from '../../components/Prose';
import { CodeBlock } from '../../components/CodeBlock';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const seedBlock: DocBlock = {
  meta: {
    id: 'seed',
    title: 'Seed',
    summary: seed.summary,
    category: 'concepts',
    tags: ['seed', 'signal', 'position', 'allocation', 'export', 'reproducibility', 'backtest'],
    appContexts: ['analytics', 'studies', 'global'],
    complexity: 'intermediate',
    relatedBlocks: ['strategies', 'portfolios', 'studies'],
    apiRelevance: true,
    onboardingRelevance: false,
    keywords: ['seed', 'signal', 'rebalancing', 'position', 'allocation', 'export', 'download', 'csv', 'json'],
    docPath: 'concepts#seed',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="seed" level={2}>
              Seed
            </Heading>
            <NavPath steps={['Analysis', 'Trial / Basket', 'Seed']} />
            <P>
              A <strong>seed</strong> is the daily rebalancing signal the engine consumed to
              build a backtest — the exact positions and weights a strategy produced on each
              date. It is the same shape a strategy emits:
            </P>
            <CodeBlock language="python" code={seed.seedExample} filename="seed shape" />
            <P>
              Every optimization <strong>trial</strong> stores its seed (so does each managed
              portfolio, extended daily). A <strong>basket</strong> has no seed of its own — it
              exposes each member's seed plus a <strong>blended</strong> combined signal
              (members weighted by the basket's allocation on the rebalance grid).
            </P>
            <P>
              You can inspect and download the seed — as <strong>JSON</strong> (the exact engine
              input) or <strong>CSV</strong> (one row per date/ticker) — from the trial detail,
              the basket detail, and a sandbox run's results. It is the reproducible artifact for
              auditing a backtest or replaying it downstream.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              A <strong>seed</strong> is the daily rebalancing signal a backtest consumed —{' '}
              <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.85em', px: 0.5, bgcolor: 'rgba(11,16,32,0.06)', borderRadius: 0.75 }}>
                date → ticker → {'{ position, allocation }'}
              </Box>
              . It records exactly what a trial held on each date.
            </P>
            <CodeBlock language="python" code={seed.seedCompact} filename="seed shape" />
            <P>
              Viewable and downloadable (JSON/CSV) per trial, basket (per-member or blended), and
              sandbox run.
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {seed.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {seed.inline}
          </Typography>
        );
    }
  },
};
