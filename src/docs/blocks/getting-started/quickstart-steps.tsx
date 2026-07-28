// The intro, the step list, the summary and the compact / inline copy are
// single-sourced from src/docs-content (the `@docs-content` alias) so this
// block and its app-tree twin
// (the Fintela app's matching doc block) cannot drift
// again — they previously disagreed on step ordering and the final step. The
// canonical steps are read-only-aware: everything is built in the app, then the
// read-only developer API pulls the results back out. This tree keeps its own
// DocBlock wrapper, meta.id / meta.docPath, full-default render(), <Heading id>
// anchors, and — uniquely — renders each step's navPath as a <NavPath> (the app
// tree ignores it). The shared prose is plain data, so this tree's inline
// <C>/<strong> emphasis is confined to its own bespoke embedded/tip markup.
import { Box, Typography } from '@mui/material';
import { quickstart } from '@docs-content';
import { Heading } from '../../components/Heading';
import { P, C } from '../../components/Prose';
import { Steps, Step } from '../../components/Steps';
import { Callout } from '../../components/Callout';
import { NavPath } from '../../components/NavPath';
import type { DocBlock } from '../../registry/types';

export const quickstartStepsBlock: DocBlock = {
  meta: {
    id: 'quickstart-steps',
    title: 'Quickstart guide',
    summary: quickstart.summary,
    category: 'getting-started',
    tags: ['quickstart', 'tutorial', 'getting started', 'first study', 'hello world'],
    appContexts: ['onboarding', 'global'],
    complexity: 'beginner',
    relatedBlocks: ['data-clusters', 'strategies', 'fitness-functions', 'studies'],
    apiRelevance: false,
    onboardingRelevance: true,
    keywords: ['quickstart', 'first study', 'tutorial', 'getting started', 'create strategy', 'asset group', 'hello world'],
    docPath: 'quickstart',
  },

  render(mode = 'full') {
    switch (mode) {
      case 'full':
        return (
          <>
            <Heading id="quickstart" level={2}>
              Quickstart
            </Heading>
            <P>{quickstart.intro}</P>
            <Steps>
              {quickstart.steps.map((step) => (
                <Step key={step.num} number={step.num} title={step.title}>
                  {step.body}
                  {step.navPath && (
                    <Box sx={{ mt: 1.5 }}>
                      <NavPath steps={step.navPath} />
                    </Box>
                  )}
                </Step>
              ))}
            </Steps>
            <Callout variant="tip" title="Start small">
              Set <C>n_trials</C> to <C>20</C> for your first study so you get results in
              minutes. Scale up once you've validated the setup.
            </Callout>
          </>
        );

      case 'embedded':
        return (
          <Box>
            <P>Four steps in the app, then read the results:</P>
            <Steps>
              <Step number={1} title="Create a asset group">
                Tickers + date range, under <strong>Data → Markets</strong>. Reusable
                across all studies.
              </Step>
              <Step number={2} title="Create a strategy">
                Internal Python function or external <C>/simulate</C> endpoint, under{' '}
                <strong>Registry → Strategies</strong>.
              </Step>
              <Step number={3} title="Create a fitness function">
                How to score each simulation. Start with <C>sharpe_like</C>.
              </Step>
              <Step number={4} title="Launch a study">
                <strong>Registry → Studies → + New Study</strong> — bind strategy, fitness,
                cluster and search space.
              </Step>
              <Step number={5} title="Monitor progress">
                Watch the dashboard, or poll{' '}
                <C>GET /studies/progress?study_ids=42</C>.
              </Step>
            </Steps>
          </Box>
        );

      case 'compact':
        return (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.6 }}>
            {quickstart.compact}
          </Typography>
        );

      case 'inline':
        return (
          <Typography component="span" sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {quickstart.inline}
          </Typography>
        );
    }
  },
};
