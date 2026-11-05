import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuButton } from '../primitives/NeuButton';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { AgenticDemoLazy } from '../fintelligentDemo/AgenticDemoLazy';

/**
 * Band: the Agentic AI hero. The "Agentic AI" pitch and its CTAs head the
 * band; under them, at the band's full measure so the app's text stays
 * legible, Fintelligent builds an asset group, a strategy and a study from
 * one message and streams the run (AgenticDemo).
 */
export const AlgoAgentBuilder = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="algo-agent-builder" size="lg" sx={{ pb: { xs: 4, md: 6 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          columnGap: { xs: 0, md: 6 },
          rowGap: 3,
          alignItems: 'end',
          mb: { xs: 4, md: 6 },
        }}
      >
        <AnimateOnScroll direction="left">
          <SectionHeader
            level="h1"
            align="left"
            gutter={false}
            eyebrow={t('fintelAgent.eyebrow')}
            title={t('fintelAgent.title')}
            titleAccent={t('fintelAgent.titleAccent')}
            description={t('fintelAgent.description')}
          />
        </AnimateOnScroll>
        <AnimateOnScroll delay={80} direction="right">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <NeuButton tone="raised" to="/docs/fintelligent" endIcon={<ArrowForwardIcon />}>
              {t('fintelligent.exit')}
            </NeuButton>
            <NeuButton tone="accent" endIcon={<ArrowForwardIcon />}>
              {t('algoAgentBuilder.tryIt')}
            </NeuButton>
          </Box>
        </AnimateOnScroll>
      </Box>

      <AnimateOnScroll delay={120}>
        <AgenticDemoLazy />
      </AnimateOnScroll>
    </Section>
  );
};
