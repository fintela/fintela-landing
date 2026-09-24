import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { VideoPlate } from '../primitives/VideoPlate';
import { BentoGrid, BentoTile } from '../primitives/BentoGrid';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { clippedGradientSx, quietLinkSx, wellSx } from '../../theme/neu';
import { gradients, motion, palette, radii, soft } from '../../theme/tokens';
import { VIDEOS } from '../../media/registry';

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

/**
 * A tile's exit link, merged after `quietLinkSx`. The arrow nudges 3px toward
 * its destination on hover; only the icon moves, so the label's baseline stays
 * put and the tile's own geometry never shifts. The reduce block is not
 * redundant: index.css clamps the transition to 0.01ms, which makes the slide
 * instant rather than absent, and a transform can only be cancelled by pinning
 * it (the same reason `noMotionPress` exists).
 */
const docsLinkSx = {
  mt: 'auto',
  fontSize: '0.82rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  alignSelf: 'flex-start',
  '& svg': { transition: `transform ${motion.fast}` },
  '@media (hover: hover)': { '&:hover svg': { transform: 'translateX(3px)' } },
  '@media (prefers-reduced-motion: reduce)': { '& svg': { transform: 'none !important' } },
} as const;

const Rule = () => (
  <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, mb: 2, flexShrink: 0 }} />
);

/**
 * The band's header, right-aligned from md up, on the page's soft ground.
 */
const CapabilitiesHeaderBand = ({
  eyebrow,
  title,
  titleAccent,
  description,
}: {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
}) => (
  <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
    <AnimateOnScroll delay={40}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5, mb: 2.5 }}>
        <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, flexShrink: 0, display: { xs: 'block', md: 'none' } }} />
        <Typography
          component="span"
          sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: soft.textSecondary }}
        >
          {eyebrow}
        </Typography>
        <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, flexShrink: 0, display: { xs: 'none', md: 'block' } }} />
      </Box>
    </AnimateOnScroll>
    <AnimateOnScroll delay={90}>
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: soft.text,
          mb: 2.5,
          textWrap: 'balance',
        }}
      >
        {title}{' '}
        <Box component="span" sx={clippedGradientSx(gradients.goldText)}>
          {titleAccent}
        </Box>
      </Typography>
    </AnimateOnScroll>
    <AnimateOnScroll delay={150}>
      <Typography
        sx={{
          fontSize: { xs: '1rem', md: '1.125rem' },
          lineHeight: 1.65,
          color: soft.textSecondary,
          maxWidth: 640,
          ml: { xs: 0, md: 'auto' },
          mb: { xs: 5, md: 7 },
        }}
      >
        {description}
      </Typography>
    </AnimateOnScroll>
  </Box>
);

/**
 * The band's content column. The band sits on the page's own soft ground:
 * neumorphic panels pair a white highlight with the ground's hue, so they
 * never go on an ink surface.
 */
const CapabilitiesBand = ({ children }: { children: ReactNode }) => <Box>{children}</Box>;

const FeatureTile = ({
  title,
  description,
  docs,
  docsLabel,
}: {
  title: string;
  description: string;
  docs: string;
  docsLabel: string;
}) => (
  <NeuPanel sx={{ height: '100%', p: { xs: 3, md: 3 }, display: 'flex', flexDirection: 'column' }}>
    <Rule />
    {/* A sub-topic of the band, so a heading — the size is the tile's own. */}
    <Typography component="h3" sx={{ fontWeight: 700, fontSize: '1.02rem', color: soft.text, mb: 0.75, letterSpacing: '-0.01em' }}>{title}</Typography>
    <Typography sx={{ color: soft.textSecondary, fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>{description}</Typography>
    <Box component={RouterLink} to={docs} sx={[quietLinkSx, docsLinkSx]}>
      {docsLabel}
      <ArrowForwardIcon sx={{ fontSize: 14 }} />
    </Box>
  </NeuPanel>
);

/**
 * Band 5. Four tiles in a 4×2 bento: two equal feature cards top-left, the
 * walkthrough video as the 2×2 anchor top-right — an always-on ambient loop,
 * no controls — and the Bayesian tile running wide underneath with a real
 * sparkline. DOM order is reading order.
 */
export const CapabilitiesBento = () => {
  const { t } = useTranslation('home');
  // Each docs link is named for its destination: identical "Docs" anchors to
  // different pages would tell neither a link list nor a crawler apart.
  const docsLabel = (key: string) => t(`capabilities.docsLabels.${key}`);

  return (
    <Section id="capabilities" size="lg">
      <CapabilitiesBand>
        <CapabilitiesHeaderBand
          eyebrow={t('features.eyebrow')}
          title={t('features.title')}
          titleAccent={t('features.titleAccent')}
          description={t('features.description')}
        />

        <BentoGrid columns={{ xs: 1, sm: 2, lg: 4 }} autoRows={{ lg: 'minmax(150px, auto)' }}>
        <BentoTile>
          <AnimateOnScroll delay={0} stretch>
            <FeatureTile
              title={t('features.items.ai.title')}
              description={t('features.items.ai.description')}
              docs="/product/agentic-ai"
              docsLabel={docsLabel('agenticAi')}
            />
          </AnimateOnScroll>
        </BentoTile>
        <BentoTile>
          <AnimateOnScroll delay={60} stretch>
            <FeatureTile
              title={t('features.items.dataAnalysis.title')}
              description={t('features.items.dataAnalysis.description')}
              docs="/product/in-depth-analysis"
              docsLabel={docsLabel('inDepthAnalysis')}
            />
          </AnimateOnScroll>
        </BentoTile>

        {/* The anchor: explicit placement, top-right, up to two rows tall from
            lg. No `grow`/`ground` and no forced panel height: now that the
            chapter rail is gone the panel holds nothing but the video, so it
            is sized to the clip itself (`feature-walkthrough.mp4`, a native
            1600×870) instead of being stretched to match the stacked tiles
            beside it and letterboxed to avoid cropping. */}
        <BentoTile col={{ sm: 'span 2', lg: '3 / 5' }} row={{ lg: '1 / 3' }}>
          <AnimateOnScroll delay={120} direction="right">
            <NeuPanel sx={{ p: { xs: 1.5, md: 2 } }}>
              <VideoPlate
                mode="ambient"
                src={VIDEOS.walkthrough.src}
                poster={VIDEOS.walkthrough.poster}
                posterAlt={t('capabilities.posterAlt')}
                ratio="1600/870"
                label={t('capabilities.playerLabel')}
                flush
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
                <Typography component="h3" sx={{ fontWeight: 700, fontSize: '1.02rem', color: soft.text, mb: 0.75, letterSpacing: '-0.01em' }}>
                  {t('features.items.bayesian.title')}
                </Typography>
                <Typography sx={{ color: soft.textSecondary, fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>
                  {t('features.items.bayesian.description')}
                </Typography>
                <Box component={RouterLink} to="/product/samplers" sx={[quietLinkSx, docsLinkSx]}>
                  {docsLabel('samplers')}
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

        </BentoGrid>
      </CapabilitiesBand>
    </Section>
  );
};
