// The summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias). This block is landing-only
// today (no app-tree twin), but its content lives in one place so a future twin
// stays in sync. This tree keeps its own DocBlock wrapper, meta.id / meta.docPath,
// full-default render(), <Heading id> anchors, NavPath, and inline <strong>
// emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { additionalData } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P } from '../../components/Prose';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const additionalDataBlock: DocBlock = {
  meta: {
    id: 'additional-data',
    title: 'Data pipelines',
    summary: additionalData.summary,
    category: 'concepts',
    tags: ['data pipeline', 'pipeline', 'transform', 'data source', 'additional data', 'groupings', 'external data', 'external data source', 'bring your own data', 'database'],
    appContexts: ['strategy-page', 'fitness-page', 'studies', 'data-clusters', 'optimizer-config', 'global'],
    complexity: 'intermediate',
    relatedBlocks: ['data-clusters', 'strategies', 'fitness-functions', 'risk-managers'],
    apiRelevance: true,
    onboardingRelevance: false,
    keywords: [
      'data pipeline',
      'pipeline',
      'transform',
      'data source',
      'graph-aware',
      'additional data',
      'extra data',
      'injectable data',
      'context data',
      'groupings',
      'sector',
      'country',
      'index members',
      'basket holdings',
      'meta-strategy',
      'external data',
      'external data source',
      'bring your own data',
      'mysql',
      'database',
      'volume',
      'news sentiment',
      'sentiment',
      'market cap',
      'dividends',
      'splits',
      'alternative data',
      'coverage',
    ],
    docPath: 'configuration/additional-data',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="additional-data" level={2}>
              Data pipelines
            </Heading>
            <NavPath steps={['Registry', 'Data pipelines']} />
            <P>
              Beyond raw market prices, strategies, fitness functions and risk managers
              pull custom data through <strong>data pipelines</strong> — reusable,
              versioned graphs that wire <strong>data sources</strong> (built-in feeds like
              trading volume, fundamentals, news sentiment, market cap, dividends &amp;
              splits, sector / country / index groupings and basket holdings, or
              your own external APIs) through <strong>transforms</strong> (returns,
              rolling, z-score, rank, lag, combine) into named <strong>outputs</strong>.
            </P>
            <P>
              Sources can be built-in feeds or your own{' '}
              <strong>external data sources</strong> — a public HTTPS endpoint you host, in
              front of your own database or API, that returns JSON for the tickers Fintela
              requests. Fintela pulls and caches it out of band and injects it as a kwarg;
              it never connects to your database directly and never runs your code.
            </P>
            <P>
              Each output node becomes a named input in your code's signature, and
              validation is <strong>graph-aware</strong>: before you save, the platform
              walks the exact pipeline the runtime will, so an input only resolves if a
              connected pipeline actually produces it. Pipelines are built once and
              connected to any strategy, fitness function or risk manager — no glue code,
              no per-component data plumbing. See{' '}
              <Box
                component="a"
                href="/documentation/configuration/additional-data"
                sx={{ color: '#667eea' }}
              >
                Data pipelines
              </Box>{' '}
              for the full reference.
            </P>
            <P>
              Not sure what a source actually looks like? The{' '}
              <strong>Data Explorer → Ingredients</strong> catalog documents every injectable
              source's exact shape — a table, a dictionary, a membership set of tickers, or a
              record — with a code-indexing example and a live sample. Non-price objects like
              hierarchical groupings, default clusters and basket holdings are configured and
              previewed right there, so you know each ingredient before you wire it in.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              Custom data reaches strategies, fitness functions and risk managers through{' '}
              <strong>data pipelines</strong> — reusable, versioned graphs that wire data
              sources (built-in feeds, your own external APIs, or your own database behind an
              HTTPS endpoint you host) through transforms into named outputs. Each output
              becomes an input in your code, and the platform validates the wired graph
              before you save and resolves it automatically at run time.
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {additionalData.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {additionalData.inline}
          </Typography>
        );
    }
  },
};
