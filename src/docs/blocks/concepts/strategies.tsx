// The signal-shape code snippets, the summary and the compact / inline copy are
// single-sourced from src/docs-content (the `@docs-content` alias) so this
// block and its app-tree twin cannot drift again. This tree keeps its own
// DocBlock wrapper, meta.id / meta.docPath, full-default render(), <Heading id>
// anchors, NavPath, its bespoke prose markup (incl. doc links), and inline
// <strong>/<C> emphasis (the shared prose is plain data).
import { Box, Typography } from '@mui/material';
import { strategies } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C } from '../../components/Prose';
import { CodeBlock } from '../../components/CodeBlock';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const strategiesBlock: DocBlock = {
  meta: {
    id: 'strategies',
    title: 'Strategies',
    summary: strategies.summary,
    category: 'concepts',
    tags: ['strategy', 'signal', 'position', 'allocation', 'internal', 'external', 'alpha', 'parameters', 'categorical'],
    appContexts: ['strategy-page', 'optimizer-config', 'onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['fitness-functions', 'studies', 'external-strategies', 'data-clusters'],
    apiRelevance: true,
    onboardingRelevance: true,
    keywords: ['strategy', 'signal', 'position', 'allocation', 'internal', 'external', 'buy', 'sell', 'python', 'parameter', 'integer', 'float', 'categorical', 'choices'],
    docPath: 'concepts#strategies',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="strategies" level={2}>
              Strategies
            </Heading>
            <NavPath steps={['Registry', 'Strategies']} />
            <P>
              A <strong>strategy</strong> is the rule that decides what to buy, sell, and
              when. Fintela strategies are Python functions that emit a signal:
            </P>
            <CodeBlock language="python" code={strategies.signalExample} filename="signal shape" />
            <P>
              Strategies can run <strong>internal</strong> (Python stored in Fintela and
              executed in-process by the optimizer task) or <strong>external</strong>{' '}
              (an HTTPS endpoint you host — your code never leaves your infrastructure).
              See <Box component="a" href="/documentation/workflows/strategies" sx={{ color: '#667eea' }}>Managing strategies</Box> for
              a full UI walkthrough.
            </P>
            <P>
              Internal code runs against a curated, version-pinned scientific Python stack —
              NumPy, pandas, SciPy, scikit-learn, statsmodels, ta, and CVXPY — that you can{' '}
              import with no setup. See{' '}
              <Box component="a" href="/documentation/workflows/strategies#python-libraries" sx={{ color: '#667eea' }}>Python libraries</Box>.
            </P>
            <P>
              Strategies declare typed <strong>parameters</strong> — the knobs a study
              optimizes. Three dtypes are supported: <C>integer</C>, <C>float</C>, and{' '}
              <C>categorical</C>. A categorical parameter declares a set of string{' '}
              <C>choices</C> (e.g. <C>["ema", "sma", "wma"]</C>); your code receives the
              chosen string as the argument value. In a study, each parameter is given a
              numeric range, a subset of its declared choices, or a single fixed value.
            </P>
            <P>
              Strategies can also inject <strong>basket holdings</strong> — which tickers each of
              your baskets holds over time, with side and allocation — as read-only feature data,
              so aggregate exposure across your portfolios can drive the signal.
            </P>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              A <strong>strategy</strong> emits a signal map of{' '}
              <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.85em', px: 0.5, bgcolor: 'rgba(11,16,32,0.06)', borderRadius: 0.75 }}>
                date → ticker → {'{ position, allocation }'}
              </Box>{' '}
              that tells the optimizer how to position capital on each date.
            </P>
            <CodeBlock language="python" code={strategies.signalCompact} filename="signal shape" />
            <P>
              Strategies run <strong>internal</strong> (Python hosted by Fintela) or{' '}
              <strong>external</strong> (POST endpoint you own — ideal for proprietary alpha).
            </P>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {strategies.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {strategies.inline}
          </Typography>
        );
    }
  },
};
