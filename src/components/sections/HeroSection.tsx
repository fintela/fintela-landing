import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { gradients, soft } from '../../theme/tokens';
import { RotatingWord } from '../primitives/RotatingWord';
import { Section } from '../primitives/Section';
import { NeuButton } from '../primitives/NeuButton';
import { ctaRowSx } from '../../theme/neu';

export const HeroSection = () => {
  const { t } = useTranslation('home');
  const marketWords = t('hero.marketWords', { returnObjects: true }) as string[];

  return (
    <Section tone="hero" size="sm" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 } }}>
      <Box sx={{ textAlign: 'center', maxWidth: 920, mx: 'auto' }}>
        <AnimateOnScroll delay={80}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.75rem' },
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              color: soft.text,
              mb: 2.5,
            }}
          >
            {t('hero.titleLine1')}
            <br />
            <GradientText gradient={gradients.goldText}>{t('hero.titleAccent')}</GradientText>.
          </Typography>
        </AnimateOnScroll>

        <AnimateOnScroll delay={160}>
          <Typography
            sx={{
              color: soft.textSecondary,
              fontSize: { xs: '1.37rem', md: '1.56rem' },
              lineHeight: 1.6,
              maxWidth: 640,
              mx: 'auto',
              mt: 2,
              mb: 6,
            }}
          >
            {t('hero.subtitlePrefix')}{' '}
            <RotatingWord words={marketWords} startDelay={1000} align="left" gradient />
            <br />
            {t('hero.subtitleSuffix')}
          </Typography>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <Box sx={[ctaRowSx, { mb: 3.5 }]}>
            <NeuButton tone="raised" to="/docs" startIcon={<PlayCircleOutlineIcon />}>
              {t('hero.ctaSecondary')}
            </NeuButton>
          </Box>
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};
