import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { motion, soft } from '../../theme/tokens';
import { AUDIENCES } from '../../lib/audience';
import { SOLUTION_PATHS } from '../../solutions/registry';

/**
 * Section 5, who it's for: one compact row of four links, one sentence each,
 * to the four /solutions pages. No photographs and no feature tiles; each
 * solution page makes its own case.
 */
export const WhoFor = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="who" size="lg">
      <SectionHeader align="left" title={t('who.title')} />
      <Box
        component="ul"
        role="list"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          columnGap: { sm: 4, lg: 5 },
          rowGap: { xs: 0, sm: 4 },
        }}
      >
        {AUDIENCES.map((audience, i) => (
          <Box component="li" key={audience}>
            <AnimateOnScroll delay={i * 60} stretch>
              <Box
                component={RouterLink}
                to={SOLUTION_PATHS[audience]}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: 48,
                  borderTop: `1px solid ${soft.text}`,
                  pt: 2.5,
                  pb: { xs: 3, sm: 0 },
                  color: soft.text,
                  textDecoration: 'none',
                  '& .who-arrow': { transition: `transform ${motion.fast}, color ${motion.fast}`, color: soft.textSecondary },
                  '@media (hover: hover)': { '&:hover .who-arrow': { transform: 'translateX(4px)', color: soft.linkAccent } },
                  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 4, borderRadius: '4px' },
                  '@media (prefers-reduced-motion: reduce)': { '& .who-arrow': { transform: 'none !important' } },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, mb: 1 }}>
                  <Typography component="h3" sx={{ fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {t(`who.items.${audience}.title`)}
                  </Typography>
                  <ArrowForwardIcon aria-hidden className="who-arrow" sx={{ fontSize: 18, flexShrink: 0 }} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.6, color: soft.textSecondary }}>{t(`who.items.${audience}.body`)}</Typography>
              </Box>
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>
    </Section>
  );
};
