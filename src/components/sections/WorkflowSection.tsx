import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { soft } from '../../theme/tokens';
import { CheckWell } from '../primitives/CheckWell';
import { AssemblyLine } from '../assemblyLine/AssemblyLine';

/**
 * Band 3. The pipeline as an assembly line: five stations from asset groups
 * to a live broker, one packet carried through them, and under the line the
 * piece of the product each station produces (see AssemblyLine). It replaced
 * the six-node hexagon and its carousel, which drew the pipeline as a loop
 * and never showed one step's output becoming the next one's input.
 */
export const WorkflowSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="platform" size="lg">
      <SectionHeader
        align="left"
        eyebrow={t('workflow.eyebrow')}
        title={t('workflow.title')}
        titleAccent={t('workflow.titleAccent')}
        description={t('workflow.description')}
      />

      <AnimateOnScroll delay={190}>
        <Box
          component="ul"
          role="list"
          sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 1.5, mb: { xs: 4, md: 2 } }}
        >
          {(t('workflow.pipelineHighlights', { returnObjects: true }) as string[]).map((step) => (
            <Box component="li" key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckWell size={18} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: soft.text }}>{step}</Typography>
            </Box>
          ))}
        </Box>
      </AnimateOnScroll>

      <AnimateOnScroll delay={150}>
        <AssemblyLine />
      </AnimateOnScroll>
    </Section>
  );
};
