import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { RotatingWord } from '../primitives/RotatingWord';
import { Section } from '../primitives/Section';
import { NeuButton } from '../primitives/NeuButton';
import { NeuPanel } from '../primitives/NeuPanel';
import { MediaPlate } from '../primitives/MediaPlate';
import { VideoPlate } from '../primitives/VideoPlate';
import { StatTile } from '../primitives/StatTile';
import { TierBadge } from '../primitives/TierBadge';
import { GroundTexture } from '../primitives/GroundTexture';
import { HeroWaveField } from '../primitives/HeroWaveField';
import { bandClipSx, eyebrowSx } from '../../theme/neu';
import { gradients, radii, shadows, soft } from '../../theme/tokens';
import { HERO_POSTER, VIDEOS } from '../../media/registry';
import { SOLUTION_PATHS } from '../../solutions/registry';
import momentoCapitalLogo from '../../assets/clients/momento_capital_logo.png';
import edgebridgeCapitalLogo from '../../assets/clients/edgebridge_capital_logo.jpeg';

const partners = [
  { name: 'Momento Capital', logo: momentoCapitalLogo, url: 'https://momentocapital.com/' },
  { name: 'EdgeBridge Capital', logo: edgebridgeCapitalLogo, url: 'https://www.edgebridgecapital.com/' },
];

interface HeroDioramaProps {
  /** "Watch the platform": lands on the tour band and starts chapter one. */
  onWatch: () => void;
}

/**
 * Band 1. Headline on the ground, the product on a plate that runs off the
 * right edge of the viewport, a study tile floating across the plate's edge.
 * Flat ground (not groundFade): a paired shadow on a graded ground
 * desynchronizes from its background, and this band has a plate in it.
 */
export const HeroDiorama = ({ onWatch }: HeroDioramaProps) => {
  const { t } = useTranslation('home');
  const marketWords = t('hero.marketWords', { returnObjects: true }) as string[];

  return (
    <Section
      tone="soft"
      size="lg"
      background={<HeroWaveField />}
      sx={[bandClipSx, { pt: { xs: 5, md: 8 }, pb: { xs: 8, md: 12 } }]}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 6fr) minmax(0, 6fr)', lg: 'minmax(0, 5fr) minmax(0, 7fr)' },
          gap: { xs: 5, md: 4 },
          alignItems: 'center',
        }}
      >
        <GroundTexture side="left" sx={{ display: { xs: 'none', md: 'block' } }} />

        <Box sx={{ position: 'relative' }}>
          <AnimateOnScroll delay={40}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, flexShrink: 0 }} />
              <Typography component="span" sx={{ ...eyebrowSx, fontSize: '0.72rem', letterSpacing: '0.14em' }}>
                {t('hero.eyebrow')}
              </Typography>
            </Box>
          </AnimateOnScroll>

          <AnimateOnScroll delay={80}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.25rem', lg: '4.25rem' },
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: '-0.035em',
                color: soft.text,
                textWrap: 'balance',
                mb: 2.5,
              }}
            >
              {t('hero.headline')}{' '}
              <GradientText gradient={gradients.goldText}>{t('hero.headlineAccent')}</GradientText>
            </Typography>
          </AnimateOnScroll>

          <AnimateOnScroll delay={160}>
            <Typography
              sx={{
                color: soft.textSecondary,
                fontSize: { xs: '1.15rem', md: '1.3rem' },
                lineHeight: 1.6,
                maxWidth: 460,
                mb: 4,
              }}
            >
              {t('hero.subtitlePrefix')}
              {/* Its own line: the slot reserves the widest market's width, which
                  reads as a gap when a shorter word sits mid-sentence. */}
              <Box component="span" sx={{ display: 'block', fontWeight: 600 }}>
                <RotatingWord words={marketWords} startDelay={1000} align="left" gradient />
              </Box>
              {t('hero.subtitleSuffix')}
            </Typography>
          </AnimateOnScroll>

          <AnimateOnScroll delay={240}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } } }}>
              <NeuButton tone="accent" to={SOLUTION_PATHS.funds}>
                {t('hero.ctaPrimary')}
              </NeuButton>
              <NeuButton tone="raised" onClick={onWatch} startIcon={<PlayArrowRoundedIcon />}>
                {t('hero.ctaWatch')}
              </NeuButton>
            </Box>
          </AnimateOnScroll>

          <AnimateOnScroll delay={320}>
            <Box sx={{ mt: { xs: 5, md: 6 } }}>
              <Typography sx={{ ...eyebrowSx, fontSize: '0.68rem', mb: 1.5 }}>{t('trustBar.title')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {partners.map((p) => (
                  <NeuPanel
                    key={p.name}
                    variant="tile"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={p.name}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: { xs: 52, md: 60 },
                      px: 2.25,
                      py: 1.25,
                      borderRadius: `${radii.neuWell}px`,
                    }}
                  >
                    <img
                      src={p.logo}
                      alt={p.name}
                      style={{ maxHeight: '100%', maxWidth: 150, objectFit: 'contain', opacity: 0.8, filter: 'grayscale(0.4)' }}
                    />
                  </NeuPanel>
                ))}
              </Box>
            </Box>
          </AnimateOnScroll>
        </Box>

        <AnimateOnScroll delay={200} direction="right">
          <Box sx={{ position: 'relative' }}>
            <MediaPlate
              bleed="right"
              caption={t('hero.plateCaption')}
              badge={<TierBadge featured>{t('hero.liveBadge')}</TierBadge>}
            >
              <VideoPlate
                mode="ambient"
                src={VIDEOS.platformHome.ambient ?? VIDEOS.platformHome.src}
                poster={HERO_POSTER}
                posterAlt={t('hero.posterAlt')}
                ratio="16/10"
                label={t('hero.plateCaption')}
              />
            </MediaPlate>
            {/* Crosses the plate's edge onto the ground from md; in flow, paired, at xs. */}
            <StatTile
              variant="float"
              eyebrow={t('hero.stat.eyebrow')}
              value={t('hero.stat.value')}
              unit={t('hero.stat.unit')}
              sub={t('hero.stat.sub')}
              progress={0.62}
              sx={{
                position: { xs: 'static', md: 'absolute' },
                left: { md: -24, lg: -48 },
                bottom: { md: 44 },
                width: { xs: '100%', sm: 260, md: 236 },
                mt: { xs: 3, md: 0 },
                boxShadow: { xs: shadows.neuRaisedSm, md: shadows.neuFloat },
                zIndex: 2,
              }}
            />
          </Box>
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};
