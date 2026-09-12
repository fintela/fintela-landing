import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { forcedColorsSurface } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';

/** The four steps every desk takes, in order; the numbering is the sequence. */
const STEPS = ['connect', 'bring', 'run', 'promote'] as const;

/**
 * Four numbered pucks on one groove — a real sequence, so the numbers carry
 * information. Below md the groove turns vertical and the steps stack.
 */
export const OnboardingTimeline = () => {
  const { t } = useTranslation('solutions');
  return (
    <Section id="onboarding" size="lg">
      <SectionHeader
        eyebrow={t('common.onboarding.eyebrow')}
        title={t('common.onboarding.title')}
        titleAccent={t('common.onboarding.titleAccent')}
        description={t('common.onboarding.description')}
      />
      <Box
        component="ol"
        sx={{
          m: 0,
          p: 0,
          listStyle: 'none',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 3, md: 4 },
          // The groove the pucks sit on: horizontal from md, vertical below.
          '&::before': {
            content: '""',
            position: 'absolute',
            left: { xs: 23, md: '12.5%' },
            right: { xs: 'auto', md: '12.5%' },
            top: { xs: 24, md: 23 },
            bottom: { xs: 24, md: 'auto' },
            width: { xs: 2, md: 'auto' },
            height: { xs: 'auto', md: 2 },
            borderRadius: '1px',
            boxShadow: shadows.neuDivider,
            '@media (forced-colors: active)': { boxShadow: 'none', border: '1px solid CanvasText' },
          },
        }}
      >
        {STEPS.map((step, idx) => (
          <Box component="li" key={step} sx={{ position: 'relative', display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 2, alignItems: { xs: 'flex-start', md: 'center' } }}>
            <AnimateOnScroll delay={idx * 90}>
              <Box
                aria-hidden
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: `${radii.pill}px`,
                  bgcolor: soft.surfaceRaised,
                  boxShadow: shadows.neuRaisedMd,
                  color: soft.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  fontVariantNumeric: 'tabular-nums',
                  position: 'relative',
                  zIndex: 1,
                  ...forcedColorsSurface,
                }}
              >
                {idx + 1}
              </Box>
            </AnimateOnScroll>
            <AnimateOnScroll delay={idx * 90 + 60} stretch>
              <NeuPanel variant="tile" sx={{ p: { xs: 2.25, md: 2.5 }, width: '100%', textAlign: { xs: 'left', md: 'center' } }}>
                <Typography sx={{ fontWeight: 700, color: soft.text, fontSize: '0.98rem', mb: 0.5 }}>
                  {t(`common.onboarding.steps.${step}.title`)}
                </Typography>
                <Typography sx={{ color: soft.textSecondary, fontSize: '0.86rem', lineHeight: 1.6 }}>
                  {t(`common.onboarding.steps.${step}.desc`)}
                </Typography>
              </NeuPanel>
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>
    </Section>
  );
};
