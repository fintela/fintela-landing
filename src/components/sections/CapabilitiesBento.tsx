import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { Section } from '../primitives/Section';
import { BandHeader } from '../primitives/BandHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { NeuButton } from '../primitives/NeuButton';
import { TierBadge } from '../primitives/TierBadge';
import { MediaWell } from '../primitives/MediaWell';
import { VideoPlate } from '../primitives/VideoPlate';
import { ChapterRail } from '../primitives/ChapterRail';
import { BentoGrid, BentoTile } from '../primitives/BentoGrid';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { clippedGradientSx, quietLinkSx, wellSx } from '../../theme/neu';
import { gradients, palette, radii, soft } from '../../theme/tokens';
import { useVideoChapters } from '../../media/chapters';
import { STILLS, VIDEOS, captionTracks } from '../../media/registry';

/**
 * Chapters of the markets recording (`feature-walkthrough.mp4`, 21 s); labels
 * under `capabilities.chapters.*`, starts cut to the recording's tab changes.
 */
const WALKTHROUGH_CHAPTERS = [
  { id: 'pulse', start: 0 },
  { id: 'ticker', start: 1 },
  { id: 'groups', start: 11.5 },
  { id: 'screener', start: 14 },
] as const;

/**
 * Best-so-far fitness over 40 samples of a 500-trial study: the shape a TPE
 * search draws — fast early gains, then a long tail of small improvements.
 */
const SPARK = [
  0.42, 0.51, 0.58, 0.61, 0.7, 0.74, 0.79, 0.84, 0.9, 0.96, 1.02, 1.05, 1.11, 1.16, 1.2, 1.24, 1.29, 1.33,
  1.37, 1.4, 1.44, 1.47, 1.5, 1.54, 1.57, 1.6, 1.63, 1.66, 1.68, 1.7, 1.72, 1.74, 1.76, 1.78, 1.79, 1.8,
  1.81, 1.82, 1.83, 1.84,
];

const FitnessSparkline = ({ from, to }: { from: string; to: string }) => {
  const w = 300;
  const h = 56;
  const min = SPARK[0] - 0.1;
  const max = SPARK[SPARK.length - 1] + 0.1;
  const points = SPARK.map((v, i) => {
    const x = (i / (SPARK.length - 1)) * w;
    const y = h - 8 - ((v - min) / (max - min)) * (h - 14);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lx, ly] = points[points.length - 1].split(',');
  return (
    <Box component="svg" viewBox={`0 0 ${w} ${h + 12}`} aria-hidden sx={{ width: '100%', height: 'auto', display: 'block', mt: 1 }}>
      <polyline points={points.join(' ')} fill="none" stroke={palette.navy} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" fill={palette.gold} stroke={soft.white} strokeWidth="1.5" />
      <text x="0" y={h + 10} fontSize="8" fill={palette.textSubtle} fontFamily="JetBrains Mono, monospace">
        {from}
      </text>
      <text x={w} y={h + 10} fontSize="8" fill={palette.textSubtle} textAnchor="end" fontFamily="JetBrains Mono, monospace">
        {to}
      </text>
    </Box>
  );
};

const Rule = () => (
  <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, mb: 2, flexShrink: 0 }} />
);

const FeatureTile = ({
  title,
  description,
  docs,
  docsLabel,
  lead,
  featured = false,
  badge,
}: {
  title: string;
  description: string;
  docs: string;
  docsLabel: string;
  /** What sits above the title: the gold rule, a badge, or a thumbnail. */
  lead?: ReactNode;
  featured?: boolean;
  badge?: string;
}) => (
  <NeuPanel
    featured={featured}
    sx={{ height: '100%', p: { xs: 3, md: 3 }, display: 'flex', flexDirection: 'column' }}
  >
    {lead ?? (badge ? <Box sx={{ mb: 2 }}><TierBadge featured>{badge}</TierBadge></Box> : <Rule />)}
    <Typography sx={{ fontWeight: 700, fontSize: '1.02rem', color: soft.text, mb: 0.75, letterSpacing: '-0.01em' }}>{title}</Typography>
    <Typography sx={{ color: soft.textSecondary, fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>{description}</Typography>
    <Box
      component={RouterLink}
      to={docs}
      sx={[quietLinkSx, { mt: 'auto', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start' }]}
    >
      {docsLabel}
      <ArrowForwardIcon sx={{ fontSize: 14 }} />
    </Box>
  </NeuPanel>
);

/**
 * Band 5. The six equal feature cards become a 4×3 bento: the walkthrough
 * video is the 2×2 anchor top-right with a pill strip that seeks to each
 * capability's chapter, the Bayesian tile runs wide with a real sparkline, the
 * quantum tile takes the band's one gold ring. DOM order is reading order.
 */
export const CapabilitiesBento = () => {
  const { t } = useTranslation('home');
  const chapters = WALKTHROUGH_CHAPTERS.map((c) => ({ ...c, label: t(`capabilities.chapters.${c.id}`) }));
  const { activeId, setActiveId, playerRef, seekTo } = useVideoChapters(chapters);
  const docsLabel = t('capabilities.docs');

  const watch = () => {
    playerRef.current?.reveal();
    seekTo(WALKTHROUGH_CHAPTERS[0].id);
  };

  return (
    <Section id="capabilities" size="lg">
      <BandHeader
        eyebrow={t('features.eyebrow')}
        title={t('features.title')}
        titleAccent={t('features.titleAccent')}
        exit={
          <NeuButton tone="raised" onClick={watch} startIcon={<PlayArrowRoundedIcon />}>
            {t('capabilities.exit')}
          </NeuButton>
        }
      />

      <BentoGrid columns={{ xs: 1, sm: 2, lg: 4 }} autoRows={{ lg: 'minmax(150px, auto)' }}>
        <BentoTile>
          <AnimateOnScroll delay={0} stretch>
            <FeatureTile
              title={t('features.items.ai.title')}
              description={t('features.items.ai.description')}
              docs="/docs/fintelligent"
              docsLabel={docsLabel}
            />
          </AnimateOnScroll>
        </BentoTile>
        <BentoTile>
          <AnimateOnScroll delay={60} stretch>
            <FeatureTile
              title={t('features.items.laboratory.title')}
              description={t('features.items.laboratory.description')}
              docs="/docs/laboratory"
              docsLabel={docsLabel}
            />
          </AnimateOnScroll>
        </BentoTile>

        {/* The anchor: explicit placement, top-right, two rows tall from lg. */}
        <BentoTile col={{ sm: 'span 2', lg: '3 / 5' }} row={{ lg: '1 / 3' }}>
          <AnimateOnScroll delay={120} direction="right" stretch>
            <NeuPanel sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <VideoPlate
                ref={playerRef}
                mode="player"
                src={VIDEOS.walkthrough.src}
                poster={VIDEOS.walkthrough.poster}
                posterAlt={t('capabilities.posterAlt')}
                captions={captionTracks(VIDEOS.walkthrough)}
                silent={VIDEOS.walkthrough.silent}
                ground={VIDEOS.walkthrough.ground}
                chapters={chapters}
                ratio="16/10"
                label={t('capabilities.playerLabel')}
                onChapterChange={setActiveId}
                grow
                flush
              />
              <ChapterRail
                orientation="pills"
                chapters={chapters}
                activeId={activeId}
                onSelect={seekTo}
                label={t('capabilities.chaptersLabel')}
                sx={{ mt: 1.75 }}
              />
            </NeuPanel>
          </AnimateOnScroll>
        </BentoTile>

        <BentoTile col={{ sm: 'span 2', lg: 'span 2' }}>
          <AnimateOnScroll delay={180} stretch>
            <NeuPanel
              sx={{
                height: '100%',
                p: 3,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) minmax(0, 1fr)' },
                gap: 3,
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Rule />
                <Typography sx={{ fontWeight: 700, fontSize: '1.02rem', color: soft.text, mb: 0.75, letterSpacing: '-0.01em' }}>
                  {t('features.items.bayesian.title')}
                </Typography>
                <Typography sx={{ color: soft.textSecondary, fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>
                  {t('features.items.bayesian.description')}
                </Typography>
                <Box
                  component={RouterLink}
                  to="/docs/optimization-dashboard"
                  sx={[quietLinkSx, { mt: 'auto', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start' }]}
                >
                  {docsLabel}
                  <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </Box>
              </Box>
              {/* Instrument glass: the chart lives in a well, not on the card. */}
              <Box sx={{ ...wellSx('sm'), borderRadius: `${radii.neuWell}px`, p: 1.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: soft.textSecondary }}>
                    {t('capabilities.spark.label')}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', ...clippedGradientSx(gradients.goldText) }}>
                    {t('capabilities.spark.value')}
                  </Typography>
                </Box>
                <FitnessSparkline from={t('capabilities.spark.from')} to={t('capabilities.spark.to')} />
              </Box>
            </NeuPanel>
          </AnimateOnScroll>
        </BentoTile>

        <BentoTile>
          <AnimateOnScroll delay={0} stretch>
            <FeatureTile
              featured
              badge={t('capabilities.quantum.badge')}
              title={t('capabilities.quantum.title')}
              description={t('capabilities.quantum.description')}
              docs="/docs/sampler-selection"
              docsLabel={docsLabel}
            />
          </AnimateOnScroll>
        </BentoTile>
        <BentoTile>
          <AnimateOnScroll delay={60} stretch>
            <FeatureTile
              title={t('features.items.allocation.title')}
              description={t('features.items.allocation.description')}
              docs="/docs/portfolio-groups"
              docsLabel={docsLabel}
            />
          </AnimateOnScroll>
        </BentoTile>
        <BentoTile>
          <AnimateOnScroll delay={120} stretch>
            <FeatureTile
              title={t('features.items.crossMarket.title')}
              description={t('features.items.crossMarket.description')}
              docs="/docs/market"
              docsLabel={docsLabel}
            />
          </AnimateOnScroll>
        </BentoTile>
        <BentoTile>
          <AnimateOnScroll delay={180} stretch>
            <FeatureTile
              lead={
                <MediaWell
                  ratio="3/2"
                  tier="sm"
                  flush
                  src={STILLS.liveOps}
                  alt={t('capabilities.liveThumbAlt')}
                  sizes="(min-width: 1200px) 260px, (min-width: 600px) 45vw, 90vw"
                  // FeatureTile's own panel padding is a flat 24px at every breakpoint.
                  sx={{ mt: -3, mx: -3, mb: 2 }}
                />
              }
              title={t('features.items.liveTrading.title')}
              description={t('features.items.liveTrading.description')}
              docs="/docs/live-trading"
              docsLabel={docsLabel}
            />
          </AnimateOnScroll>
        </BentoTile>
      </BentoGrid>
    </Section>
  );
};
