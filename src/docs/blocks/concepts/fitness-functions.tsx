// The summary and the compact / inline copy are single-sourced from
// src/docs-content (the `@docs-content` alias) so this block and its app-tree
// twin cannot drift again. This tree keeps its own DocBlock wrapper,
// meta.id / meta.docPath, full-default render(), <Heading id> anchors, NavPath,
// Callout, and inline <strong>/<C> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { fitnessFunctions } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C } from '../../components/Prose';
import { Callout } from '../../components/Callout';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const fitnessFunctionsBlock: DocBlock = {
  meta: {
    id: 'fitness-functions',
    title: 'Fitness functions',
    summary: fitnessFunctions.summary,
    category: 'concepts',
    tags: ['fitness', 'objective', 'sharpe', 'sortino', 'calmar', 'score', 'optimization'],
    appContexts: ['fitness-page', 'optimizer-config', 'studies', 'onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['strategies', 'studies', 'external-fitness'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: ['fitness function', 'sharpe', 'sortino', 'calmar', 'score', 'maximize', 'internal', 'external', 'composite'],
    docPath: 'concepts#fitness-functions',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="fitness-functions" level={2}>
              Fitness functions
            </Heading>
            <NavPath steps={['Registry', 'Fitness']} />
            <P>
              A <strong>fitness function</strong> turns a simulated period — the trades,
              the equity curve, the period metrics — into a single number to maximize.
              Sharpe, Sortino, Calmar, custom composite scores. Like strategies, fitness
              functions can be internal or external.
            </P>
            <Callout variant="tip" title="Reuse over rebuild">
              A single fitness function can power dozens of strategies. Build a small
              library of canonical scorers (e.g., <C>sharpe_strict</C>,{' '}
              <C>cvar_penalized</C>) and your team will optimize for the same things.
            </Callout>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              A <strong>fitness function</strong> converts a completed simulation — trades,
              equity curve, and period metrics — into a single scalar the optimizer maximizes.
              Common choices: Sharpe, Sortino, Calmar, or any custom composite.
            </P>
            <P>
              Like strategies, fitness functions can run <strong>internal</strong> (Fintela-hosted)
              or <strong>external</strong> (your endpoint). Build a small shared library of canonical
              scorers so every study optimizes consistently.
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {fitnessFunctions.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {fitnessFunctions.inline}
          </Typography>
        );
    }
  },
};
