import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { RotatingWord } from '../primitives/RotatingWord';
import { Section } from '../primitives/Section';
import { NeuButton } from '../primitives/NeuButton';
import { bandClipSx } from '../../theme/neu';
import { gradients, soft } from '../../theme/tokens';
import { fallbackSrcSet, pictureSources } from '../../media/picture';
import laptopDashboard from '../../assets/media/hero/laptop-dashboard.png?w=480;760;1150;1715&format=avif;webp;png&as=picture';

interface HeroDioramaProps {
  /** "Watch the platform": lands on the platform band and its ambient loop. */
  onWatch: () => void;
}


/**
 * Band 1. The laptop mock and the copy side by side on the plain page ground;
 * stacked, image first, on a phone.
 */
export const HeroDiorama = ({ onWatch }: HeroDioramaProps) => {
  const { t } = useTranslation('home');
  const marketWords = t('hero.marketWords', { returnObjects: true }) as string[];

  return (
    <Section
      id="hero"
      tone="soft"
      size="lg"
      maxWidth="xl"
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
          maxWidth: 1680,
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 5, md: 2 },
        }}
      >
        {/* The laptop mock sits left of the copy from md up, pinned to the
            column's own left edge rather than centered in it; above the copy,
            centered, on a phone — the same order the copy reads in either
            layout. */}
        <Box sx={{ flex: { md: '0 1 64%' }, display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, ml: { md: -4 } }}>
          {/* Sized to the image itself (not the wider flex column) so the
              glow stays pinned to the laptop's corner instead of drifting
              into open space and reading as a second, detached gradient. */}
          <Box sx={{ position: 'relative', width: 'fit-content', maxWidth: '100%' }}>
            {/* Brand-color glow anchored to the laptop's top-left corner. */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: { xs: -120, md: -180 },
                left: { xs: -140, md: -220 },
                width: { xs: 420, md: 620 },
                height: { xs: 420, md: 620 },
                background:
                  'radial-gradient(circle, rgba(232,185,35,0.32) 0%, rgba(241,53,60,0.20) 45%, rgba(26,26,26,0) 72%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <AnimateOnScroll delay={40}>
              <Box
                component="picture"
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'block',
                  width: '100%',
                  maxWidth: { xs: 460, sm: 640, md: 1000 },
                }}
              >
                {pictureSources(laptopDashboard).map(({ type, srcSet }) => (
                  <source
                    key={type}
                    type={type}
                    srcSet={srcSet}
                    sizes="(min-width: 900px) 1180px, (min-width: 600px) 640px, 460px"
                  />
                ))}
                <Box
                  component="img"
                  src={laptopDashboard.img.src}
                  srcSet={fallbackSrcSet(laptopDashboard)}
                  sizes="(min-width: 900px) 1180px, (min-width: 600px) 640px, 460px"
                  width={laptopDashboard.img.w}
                  height={laptopDashboard.img.h}
                  alt={t('hero.deviceAlt')}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  sx={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            </AnimateOnScroll>
          </Box>
        </Box>

        <Box sx={{ flex: { md: '0 1 28%' }, textAlign: { xs: 'center', md: 'left' } }}>
          <AnimateOnScroll delay={120}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.6rem', sm: '3.5rem', lg: '2.9rem' },
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: '-0.035em',
                color: soft.text,
                textWrap: 'balance',
                textAlign: { xs: 'center', md: 'left' },
                mb: 3,
              }}
            >
              {t('hero.headline')}{' '}
              <GradientText gradient={gradients.goldText}>{t('hero.headlineAccent')}</GradientText>
            </Typography>
          </AnimateOnScroll>

          <AnimateOnScroll delay={200}>
            <Typography
              sx={{
                color: soft.textSecondary,
                fontSize: { xs: '1.15rem', md: '1.35rem' },
                lineHeight: 1.6,
                maxWidth: 520,
                mx: { xs: 'auto', md: 0 },
                mb: 4.5,
              }}
            >
              {t('hero.subtitlePrefix')}
              {/* Its own line: the slot reserves the widest market's width, which
                  reads as a gap when a shorter word sits mid-sentence. */}
              <Box
                component="span"
                sx={{ display: 'block', fontWeight: 600, color: soft.text }}
              >
                <RotatingWord
                  words={marketWords}
                  startDelay={1000}
                  align={{ xs: 'center', md: 'left' }}
                />
              </Box>
              {t('hero.subtitleSuffix')}
            </Typography>
          </AnimateOnScroll>

          <AnimateOnScroll delay={280}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', md: 'flex-start' },
                gap: 1.75,
                '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } },
              }}
            >
              <NeuButton
                tone="accent"
                onClick={onWatch}
                startIcon={<PlayArrowRoundedIcon />}
                sx={{
                  backgroundColor: '#000',
                  '@media (hover: hover)': {
                    '&:hover': { backgroundColor: '#000' },
                  },
                  '&:active': { backgroundColor: '#000' },
                  '&.Mui-disabled': { backgroundColor: '#000' },
                }}
              >
                {t('hero.ctaWatch')}
              </NeuButton>
            </Box>
          </AnimateOnScroll>
        </Box>
      </Box>
    </Section>
  );
};
