import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { NeuPanel } from '../primitives/NeuPanel';
import { MediaPlate } from '../primitives/MediaPlate';
import { VideoPlate } from '../primitives/VideoPlate';
import { StatTile } from '../primitives/StatTile';
import { TierBadge } from '../primitives/TierBadge';
import { eyebrowSx } from '../../theme/neu';
import { radii, shadows } from '../../theme/tokens';
import { HERO_POSTER, VIDEOS } from '../../media/registry';
import momentoCapitalLogo from '../../assets/clients/momento_capital_logo.png';
import edgebridgeCapitalLogo from '../../assets/clients/edgebridge_capital_logo.jpeg';

// Intrinsic sizes ride along so each tile has its final width before the
// file arrives (CSS still bounds the height); the files are the source of
// truth for the numbers.
const partners = [
  { name: 'Momento Capital', logo: momentoCapitalLogo, url: 'https://momentocapital.com/', width: 605, height: 138 },
  { name: 'EdgeBridge Capital', logo: edgebridgeCapitalLogo, url: 'https://www.edgebridgecapital.com/', width: 200, height: 65 },
];

/**
 * The product on a plate at the top of the platform band, a study tile
 * floating across the plate's right edge, and the client logos beside it.
 * "Watch the platform" in the hero lands here.
 */
export const PlatformShowcase = () => {
  const { t } = useTranslation('home');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 8fr) minmax(0, 4fr)' },
        gap: { xs: 3, md: 5 },
        alignItems: 'center',
        mb: { xs: 6, md: 8 },
      }}
    >
      <AnimateOnScroll delay={80}>
        <Box sx={{ position: 'relative' }}>
          <MediaPlate caption={t('hero.plateCaption')} badge={<TierBadge featured>{t('hero.liveBadge')}</TierBadge>}>
            <VideoPlate
              mode="ambient"
              src={VIDEOS.platformHome.ambient ?? VIDEOS.platformHome.src}
              poster={HERO_POSTER}
              posterAlt={t('hero.posterAlt')}
              ratio="16/10"
              label={t('hero.plateCaption')}
            />
          </MediaPlate>
          {/* Crosses the plate's right edge into the gutter from md; in flow, paired, at xs. */}
          <StatTile
            variant="float"
            eyebrow={t('hero.stat.eyebrow')}
            value={t('hero.stat.value')}
            unit={t('hero.stat.unit')}
            sub={t('hero.stat.sub')}
            progress={0.62}
            sx={{
              position: { xs: 'static', md: 'absolute' },
              right: { md: -28, lg: -40 },
              bottom: { md: 72 },
              width: { xs: '100%', sm: 260, md: 236 },
              mt: { xs: 3, md: 0 },
              boxShadow: { xs: shadows.neuRaisedSm, md: shadows.neuFloat },
              zIndex: 2,
            }}
          />
        </Box>
      </AnimateOnScroll>

      <AnimateOnScroll delay={200} direction="right">
        <Box sx={{ pl: { md: 2, lg: 3 } }}>
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
                  width={p.width}
                  height={p.height}
                  loading="lazy"
                  // width/height auto with the max bounds: the attributes give the
                  // ratio, the bounds give the size, and nothing is letterboxed.
                  style={{ width: 'auto', height: 'auto', maxHeight: '100%', maxWidth: 150, objectFit: 'contain', opacity: 0.8, filter: 'grayscale(0.4)' }}
                />
              </NeuPanel>
            ))}
          </Box>
        </Box>
      </AnimateOnScroll>
    </Box>
  );
};
