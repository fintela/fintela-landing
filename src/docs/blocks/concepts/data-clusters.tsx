// The summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias) so this block and its app-tree
// twin cannot drift again. This tree keeps its own DocBlock wrapper,
// meta.id / meta.docPath, full-default render(), <Heading id> anchors, NavPath,
// and inline <strong> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { dataClusters } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P } from '../../components/Prose';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const dataClustersBlock: DocBlock = {
  meta: {
    id: 'data-clusters',
    title: 'Asset groups',
    summary: dataClusters.summary,
    category: 'concepts',
    tags: ['data', 'cluster', 'market data', 'tickers', 'reproducibility', 'backtest'],
    appContexts: ['data-clusters', 'studies', 'onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['strategies', 'studies'],
    apiRelevance: false,
    onboardingRelevance: true,
    keywords: ['asset group', 'tickers', 'date range', 'snapshot', 'reproducible', 'regime', 'asset class'],
    docPath: 'concepts#data-clusters',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="data-clusters" level={2}>
              Asset groups
            </Heading>
            <NavPath steps={['Data', 'Markets', '+ New Cluster']} />
            <P>
              A <strong>asset group</strong> is a named, reusable snapshot of market data
              — a set of tickers (stocks, ETFs, crypto, indices, forex) and a date range.
              Every backtest references a cluster by id, which makes results perfectly
              reproducible across studies.
            </P>
            <P>
              You can keep a library of clusters representing different regimes
              (S&P 500 pre-2020, post-2020), sectors, or asset classes — and run the
              same strategy against multiple clusters in a single bulk study.
            </P>
            <P>
              Beyond clusters you build, the platform exposes <strong>pre-built groupings</strong>
              {' '}— the Sector ETFs, country ETFs, indices like the S&P 500, sectors, and
              industries — that you can pick directly as a study's universe. Selecting one
              materializes a derived cluster automatically (kept out of your cluster library, but
              referenced by id like any other).
            </P>
            <P>
              A cluster's assets aren't limited to individual tickers — it can also feed on your
              own <strong>baskets</strong> (graduated portfolios). Each basket contributes its
              equity curve as an input series that the strategy scores exactly like a ticker
              price, so you can build <strong>meta-strategies</strong> — portfolios of portfolios
              that allocate capital across your own strategies.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              A <strong>asset group</strong> is a named, reusable snapshot of market data
              — a set of tickers and a date range. Every backtest references a cluster by
              id, ensuring results are perfectly reproducible.
            </P>
            <P>
              Build a library of clusters for different regimes, sectors, or asset classes
              and run the same strategy across all of them in one bulk study.
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {dataClusters.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {dataClusters.inline}
          </Typography>
        );
    }
  },
};
