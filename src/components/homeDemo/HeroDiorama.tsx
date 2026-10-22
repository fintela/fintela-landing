import { lazy, Suspense } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { RotatingWord } from '../primitives/RotatingWord';
import { Section } from '../primitives/Section';
import { NeuButton } from '../primitives/NeuButton';
import { bandClipSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { SOLUTION_PATHS } from '../../solutions/registry';
import hedgeweekWinnerBadge from '../../assets/awards/hedgeweek-2026-winner.png';

/** The post that tells the award's story; the badge links to it. */
const AWARD_POST = '/blog/fintela-wins-hedgeweek-us-awards-2026';

/**
 * The mini chat is all client-side motion on the product demo's parts, so it is
 * its own chunk, fetched after hydration; the server renders the placeholder,
 * which holds the window's size.
 */
const HeroChat = lazy(() => import('./HeroChat').then((m) => ({ default: m.HeroChat })));

const CHAT_HEIGHT = { xs: 600, md: 640 } as const;

const ChatPlaceholder = () => (
  <Box aria-hidden sx={{ height: CHAT_HEIGHT, borderRadius: '20px', bgcolor: 'rgba(255, 255, 255, 0.06)' }} />
);

/** The brand's yellow → red, without the black leg that would vanish on the ink band. */
const HEADLINE_ACCENT = 'linear-gradient(100deg, #f2c230 0%, #f1353c 100%)';

/** A warm wash behind the chat, so the light window lifts off the black. */
const HeroGlow = () => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background:
        'radial-gradient(60% 55% at 78% 42%, rgba(242, 194, 48, 0.16) 0%, transparent 70%),' +
        'radial-gradient(45% 45% at 96% 90%, rgba(241, 53, 60, 0.14) 0%, transparent 70%)',
      '@media print': { display: 'none' },
    }}
  />
);

/**
 * Band 1 (the [Home Demo] version). Copy on the left, a mini Fintelligent on the
 * right where a visitor picks a question and watches it play out, on the ink
 * band; the video loop this band used to sit on is gone.
 */
export const HeroDiorama = () => {
  const { t } = useTranslation('home');
  const marketWords = t('hero.marketWords', { returnObjects: true }) as string[];

  return (
    <Section
      id="hero"
      tone="ink"
      size="lg"
      background={<HeroGlow />}
      sx={[
        bandClipSx,
        {
          display: 'flex',
          alignItems: 'center',
          minHeight: { xs: 'min(88svh, 760px)', md: 'min(90svh, 900px)' },
          pt: { xs: 6, md: 8 },
          pb: { xs: 8, md: 12 },
          '& > .MuiContainer-root': { width: '100%' },
        },
      ]}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          alignItems: 'center',
          gap: { xs: 6, lg: 6 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 540px)' },
        }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <AnimateOnScroll delay={80}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.6rem', sm: '3.5rem', lg: '3.6rem' },
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: '-0.035em',
                color: soft.white,
                textWrap: 'balance',
                mb: 3,
              }}
            >
              {t('hero.headline')} <GradientText gradient={HEADLINE_ACCENT}>{t('hero.headlineAccent')}</GradientText>
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

        <AnimateOnScroll delay={200}>
          <Suspense fallback={<ChatPlaceholder />}>
            <HeroChat />
          </Suspense>
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};
