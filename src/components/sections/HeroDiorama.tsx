import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { RotatingWord } from '../primitives/RotatingWord';
import { Section } from '../primitives/Section';
import { NeuButton } from '../primitives/NeuButton';
import { HeroVideoBackdrop } from '../primitives/HeroVideoBackdrop';
import { bandClipSx } from '../../theme/neu';
import { gradients, soft } from '../../theme/tokens';
import { SOLUTION_PATHS } from '../../solutions/registry';
import hedgeweekWinnerBadge from '../../assets/awards/hedgeweek-2026-winner.png';

/** The post that tells the award's story; the badge links to it. */
const AWARD_POST = '/blog/fintela-wins-hedgeweek-us-awards-2026';

/**
 * Band 1. Copy only, left-aligned over a full-bleed video loop that fades into the
 * ground along its bottom edge. The product plate, the study tile and the
 * client logos live in the platform band (PlatformShowcase) so this one stays
 * quiet.
 */
export const HeroDiorama = () => {
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
            <NeuButton tone="raised" to="/contact">
              {t('hero.ctaContact')}
            </NeuButton>
          </Box>
        </AnimateOnScroll>

        <AnimateOnScroll delay={320}>
          {/* Hedgeweek's own artwork, unaltered: the organiser's winner badge
              must not be recoloured or cropped. */}
          <Box
            component={RouterLink}
            to={AWARD_POST}
            sx={{
              display: 'inline-block',
              mt: { xs: 4, md: 5 },
              borderRadius: '10px',
              overflow: 'hidden',
              lineHeight: 0,
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.28)',
              transition: 'transform 200ms ease',
              '@media (hover: hover)': { '&:hover': { transform: 'translateY(-2px)' } },
              '&:focus-visible': { outline: `2px solid ${soft.white}`, outlineOffset: 3 },
            }}
          >
            <Box
              component="img"
              src={hedgeweekWinnerBadge}
              alt={t('hero.awardAlt')}
              width={640}
              height={243}
              sx={{ display: 'block', width: { xs: 200, md: 240 }, height: 'auto' }}
            />
          </Box>
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};
