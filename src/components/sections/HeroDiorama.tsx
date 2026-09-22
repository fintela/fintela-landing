import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { RotatingWord } from '../primitives/RotatingWord';
import { Section } from '../primitives/Section';
import { NeuButton } from '../primitives/NeuButton';
import { HeroVideoBackdrop } from '../primitives/HeroVideoBackdrop';
import { bandClipSx } from '../../theme/neu';
import { gradients, soft } from '../../theme/tokens';
import { SOLUTION_PATHS } from '../../solutions/registry';

interface HeroDioramaProps {
  /** "Watch the platform": lands on the platform band and its ambient loop. */
  onWatch: () => void;
}

/**
 * Band 1. Copy only, left-aligned over a full-bleed video loop that fades into the
 * ground along its bottom edge. The product plate, the study tile and the
 * client logos live in the platform band (PlatformShowcase) so this one stays
 * quiet.
 */
export const HeroDiorama = ({ onWatch }: HeroDioramaProps) => {
  const { t } = useTranslation('home');
  const marketWords = t('hero.marketWords', { returnObjects: true }) as string[];

  return (
    <Section
      id="hero"
      tone="soft"
      size="lg"
      background={<HeroVideoBackdrop />}
      sx={[
        bandClipSx,
        {
          display: 'flex',
          alignItems: 'center',
          minHeight: { xs: 'min(88svh, 760px)', md: 'min(90svh, 900px)' },
          pt: { xs: 6, md: 8 },
          pb: { xs: 10, md: 14 },
          '& > .MuiContainer-root': { width: '100%' },
        },
      ]}
    >
      <Box
        sx={{
          position: 'relative',
          maxWidth: 760,
        }}
      >
        <AnimateOnScroll delay={80}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.6rem', sm: '3.5rem', lg: '4.6rem' },
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: '-0.035em',
              color: soft.white,
              textWrap: 'balance',
              mb: 3,
              // Keeps the white line legible when the backdrop video pans over light frames.
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.28), 0 10px 32px rgba(0, 0, 0, 0.22)',
            }}
          >
            {t('hero.headline')}{' '}
            <GradientText
              gradient={gradients.goldText}
              sx={{
                // text-shadow paints over a clipped-gradient fill, so shadow the rendered glyphs instead.
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.28)) drop-shadow(0 10px 32px rgba(0, 0, 0, 0.22))',
              }}
            >
              {t('hero.headlineAccent')}
            </GradientText>
          </Typography>
        </AnimateOnScroll>

        <AnimateOnScroll delay={160}>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.88)',
              fontSize: { xs: '1.15rem', md: '1.35rem' },
              lineHeight: 1.6,
              maxWidth: 520,
              mb: 4.5,
            }}
          >
            {t('hero.subtitlePrefix')}
            {/* Its own line: the slot reserves the widest market's width, which
                reads as a gap when a shorter word sits mid-sentence. */}
            <Box component="span" sx={{ display: 'block', fontWeight: 600, color: soft.white }}>
              <RotatingWord words={marketWords} startDelay={1000} align="left" />
            </Box>
            {t('hero.subtitleSuffix')}
          </Typography>
        </AnimateOnScroll>

        <AnimateOnScroll delay={240}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.75,
              '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } },
            }}
          >
            <NeuButton tone="accent" to={SOLUTION_PATHS.funds}>
              {t('hero.ctaPrimary')}
            </NeuButton>
            <NeuButton tone="raised" onClick={onWatch} startIcon={<PlayArrowRoundedIcon />}>
              {t('hero.ctaWatch')}
            </NeuButton>
          </Box>
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};
