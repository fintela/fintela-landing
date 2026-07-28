// The full-mode state table, the summary and the compact / inline copy are
// single-sourced from src/docs-content (the `@docs-content` alias) so this
// block and its app-tree twin cannot drift again (the app tree also consumes
// each state's badge color from the shared data). This tree keeps its own
// DocBlock wrapper, meta.id / meta.docPath, full-default render(), <Heading id>
// anchors, its bespoke embedded/summary markup, and inline <C> emphasis — which
// it re-applies over the shared state tokens (the shared data is plain).
import { Box, Typography } from '@mui/material';
import { optimizerLifecycle } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C } from '../../components/Prose';
import { DataTable } from '../../components/DataTable';
import { Callout } from '../../components/Callout';
import type { DocBlock } from '../../registry/types';

export const optimizerLifecycleBlock: DocBlock = {
  meta: {
    id: 'optimizer-lifecycle',
    title: 'Trial & study lifecycle',
    summary: optimizerLifecycle.summary,
    category: 'optimizer',
    tags: ['lifecycle', 'state machine', 'queued', 'running', 'completed', 'failed', 'pruned', 'trial'],
    appContexts: ['studies', 'optimizer-config', 'analytics', 'global'],
    complexity: 'intermediate',
    relatedBlocks: ['studies', 'strategies', 'fitness-functions'],
    apiRelevance: true,
    onboardingRelevance: false,
    keywords: ['lifecycle', 'state', 'queued', 'running', 'completed', 'failed', 'pruned', 'resume', 'stop', 'pause', 'grid', 'exhausted', 'finite'],
    docPath: 'optimizer/lifecycle',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="optimizer-lifecycle" level={2}>
              Trial &amp; study lifecycle
            </Heading>
            <P>
              Both studies and individual trials follow a deterministic state machine.
              Understanding the state transitions helps you interpret the progress API and
              build reliable polling logic.
            </P>
            <DataTable
              headers={['State', 'Applies to', 'Meaning']}
              cols="1fr 1fr 2fr"
              rows={optimizerLifecycle.states.map((s) => [
                <C key={s.state}>{s.state}</C>,
                s.appliesTo,
                s.meaning,
              ])}
            />
            <P>
              A study reaches <C>COMPLETED</C> when it hits <C>n_trials</C> — or earlier,
              when its search space is finite (only integer, categorical, or fixed
              parameters, plus floats with a grid precision) and every distinct
              combination has been evaluated. A grid-exhausted study is COMPLETED with
              fewer completed trials than <C>n_trials</C>; polling logic should treat
              status, not progress reaching 1.0, as the completion signal.
            </P>
            <Callout variant="info" title="Train fitness drives the optimizer">
              The train-window fitness value is the one the search algorithm
              maximizes — it is what steers which parameter regions to explore next.
              Validation, overall, and OOS values are stored for post-hoc analysis only.
            </Callout>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>
              Studies and trials move through a deterministic state machine:{' '}
              <C>QUEUED</C> → <C>RUNNING</C> → <C>COMPLETED</C> / <C>FAILED</C> / <C>PRUNED</C>.
              Studies additionally support <C>PAUSED</C> (resumable) and <C>STOPPED</C> (terminal).
            </P>
            <DataTable
              headers={['State', 'Meaning']}
              cols="1fr 2fr"
              rows={[
                [<><C>QUEUED</C></>, 'Waiting for a worker'],
                [<><C>RUNNING</C></>, 'Actively evaluating strategy + fitness'],
                [<><C>COMPLETED</C></>, 'Results available'],
                [<><C>PRUNED</C></>, 'Early-terminated by sampler or autostop'],
                [<><C>PAUSED</C></>, 'Manually paused; resumable'],
              ]}
            />
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {optimizerLifecycle.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {optimizerLifecycle.inline}
          </Typography>
        );
    }
  },
};
