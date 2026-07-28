// The full-mode field table, the summary and the compact / inline copy are
// single-sourced from src/docs-content (the `@docs-content` alias) so this
// block and its app-tree twin cannot drift again. This tree keeps its own
// DocBlock wrapper, meta.id / meta.docPath, full-default render(), <Heading id>
// anchors, NavPath, its bespoke prose / embedded markup (incl. doc links), and
// inline <C> emphasis — which it re-applies over the shared field names (the
// shared data is plain).
import { Box, Typography } from '@mui/material';
import { studies } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C } from '../../components/Prose';
import { DataTable } from '../../components/DataTable';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const studiesBlock: DocBlock = {
  meta: {
    id: 'studies',
    title: 'Studies',
    summary: studies.summary,
    category: 'concepts',
    tags: ['study', 'optimization', 'sampler', 'tpe', 'cmaes', 'nsga', 'bayesian', 'search space', 'grid', 'categorical', 'fixed'],
    appContexts: ['studies', 'optimizer-config', 'onboarding', 'global'],
    complexity: 'intermediate',
    relatedBlocks: ['strategies', 'fitness-functions', 'data-clusters', 'optimizer-lifecycle'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: ['study', 'n_trials', 'sampler', 'params', 'train', 'validation', 'oos', 'autostop', 'search space', 'fixed', 'choices', 'categorical', 'grid', 'grid_decimals', 'exhausted'],
    docPath: 'concepts#studies',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="studies" level={2}>
              Studies
            </Heading>
            <NavPath steps={['Registry', 'Studies', '+ New Study']} />
            <P>
              A <strong>study</strong> is one optimization run. It binds a strategy, a
              fitness function, a asset group, and a parameter search space, then
              explores that space using a Bayesian sampler (TPE, CMA-ES, NSGA-II, …).
              Created via a 5-step wizard — see{' '}
              <Box component="a" href="/documentation/workflows/studies" sx={{ color: '#667eea' }}>
                Running optimizations
              </Box>.
            </P>
            <P>
              The <strong>universe</strong> a study runs on is either a saved{' '}
              <Box component="a" href="/documentation/concepts/data-clusters" sx={{ color: '#667eea' }}>
                asset group
              </Box>{' '}
              or a pre-built grouping picked straight from the builder — the Sector ETFs, an
              index like the S&amp;P 500, or a single sector, industry, or country. Picking a
              grouping materializes a derived cluster behind the scenes; the study still binds a{' '}
              <C>cluster_strategy_id</C> like any other.
            </P>
            <DataTable
              headers={['Field', 'Description']}
              cols="1fr 2fr"
              rows={studies.fields.map((f) => [
                <C key={f.name}>{f.name}</C>,
                f.desc,
              ])}
            />
            <P>
              The search space is declared <strong>per parameter</strong>. A numeric
              parameter takes a <C>{`{minimum, maximum}`}</C> range; a categorical
              parameter takes a <C>{`{choices: [...]}`}</C> subset of the choices the
              strategy declares. Any parameter can instead be <strong>fixed</strong> —{' '}
              <C>{`{value: 20}`}</C> or <C>{`{value: "ema"}`}</C> — pinning it for every
              trial and excluding it from the search.
            </P>
            <P>
              When every non-fixed parameter is finite — integer ranges, categorical
              choices, or float ranges with <C>grid_decimals</C> set — the search space
              has a countable number of combinations. The wizard shows that count,{' '}
              <C>n_trials</C> is capped to it at launch, and the optimizer enumerates the
              full grid without repeating configurations, so the study{' '}
              <strong>completes early</strong> once every combination has been evaluated.
            </P>
            <P>
              Every study chooses an <strong>optimization direction</strong> — whether the
              optimizer <strong>maximizes</strong> or <strong>minimizes</strong> the fitness.
              It defaults to the metric’s natural direction (Sharpe → maximize, max-drawdown →
              minimize), so you rarely touch it; flip it when you deliberately want the other
              side — e.g. minimize a return metric to surface the worst configurations, or
              minimize volatility/drawdown with a custom fitness. It is set at creation and
              frozen once the study launches.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              A <strong>study</strong> binds a strategy, a fitness function, a asset group,
              and a parameter search space, then explores that space over{' '}
              <C>n_trials</C> iterations using a Bayesian sampler.
            </P>
            <DataTable
              headers={['Key field', 'Description']}
              cols="1fr 2fr"
              rows={[
                [<><C>sampler</C></>, 'TPE, CMA-ES, RANDOM, QMC, or NSGA-II'],
                [<><C>n_trials</C></>, 'How many parameter combinations to evaluate'],
                [<><C>train / val / oos</C></>, 'Three evaluation windows for robust selection'],
              ]}
            />
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {studies.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {studies.inline}
          </Typography>
        );
    }
  },
};
