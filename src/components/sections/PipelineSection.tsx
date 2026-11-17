import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { HERO_MEASURE, SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients, motion, soft } from '../../theme/tokens';
import { quietLinkSx } from '../../theme/neu';
import { CheckWell } from '../primitives/CheckWell';
import { AssemblyLine } from '../assemblyLine/AssemblyLine';

/** The three capabilities under the pipeline: copy under `features.items.<key>`, each with the page that tells the rest. */
const CAPABILITIES = [
  { key: 'ai', to: '/product/agentic-ai', label: 'agenticAi' },
  { key: 'dataAnalysis', to: '/docs/data-explorer', label: 'dataExplorer' },
  { key: 'bayesian', to: '/product/samplers', label: 'samplers' },
] as const;

/**
 * The link under each capability. Only the arrow moves on hover, so the
 * label's baseline stays put; the reduce block pins it, since index.css only
 * shortens transitions to 0.01ms rather than removing them.
 */
const exitLinkSx = {
  fontSize: '0.86rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  color: soft.linkAccent,
  '& svg': { transition: `transform ${motion.fast}` },
  '@media (hover: hover)': { '&:hover svg': { transform: 'translateX(3px)' } },
  '@media (prefers-reduced-motion: reduce)': { '& svg': { transform: 'none !important' } },
} as const;

/**
 * The full pipeline, from idea to production, as the body of the Platform
 * page (it was the home page's second band until the home page was cut down
 * to outcomes):
 *
 * 1. the page's heading and the four things the pipeline lets you do;
 * 2. the pipeline as an assembly line walked by scrolling: the band pins under
 *    the header while five stations, from asset groups to a live broker, go by
 *    one per stretch of scroll (see AssemblyLine);
 * 3. the three capabilities behind it in a plain row, each with the page that
 *    tells the rest (`#capabilities`, which old links to the home page's
 *    retired Capabilities band are sent to).
 *
 * The pipeline is not wrapped in AnimateOnScroll: it is several screens tall
 * while pinned, and the wrapper would keep its top hidden until a share of it
 * was on screen.
 */
export const PipelineSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="platform" size="lg">
      <Box sx={{ maxWidth: HERO_MEASURE, mb: { xs: 4, md: 5 } }}>
        <SectionHeader
          level="h1"
          align="left"
          eyebrow={t('workflow.eyebrow')}
          title={t('workflow.title')}
          titleAccent={t('workflow.titleAccent')}
          description={t('workflow.description')}
        />
      </Box>

      <AnimateOnScroll delay={190}>
        <Box
          component="ul"
          role="list"
          sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', columnGap: 3.5, rowGap: 1.5, mb: { xs: 4, md: 2 } }}
        >
          {(t('workflow.pipelineHighlights', { returnObjects: true }) as string[]).map((step) => (
            <Box component="li" key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckWell size={18} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: soft.text }}>{step}</Typography>
            </Box>
          ))}
        </Box>
      </AnimateOnScroll>

      <AssemblyLine />

      <Box
        id="capabilities"
        component="ul"
        role="list"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          mt: { xs: 6, md: 9 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 4, md: 5 },
        }}
      >
        {CAPABILITIES.map(({ key, to, label }, i) => (
          <Box component="li" key={key}>
            <AnimateOnScroll delay={i * 70}>
              <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, mb: 2 }} />
              <Typography component="h2" sx={{ fontWeight: 600, fontSize: '1.05rem', color: soft.text, mb: 0.75, letterSpacing: '-0.01em' }}>
                {t(`features.items.${key}.title`)}
              </Typography>
              <Typography sx={{ color: soft.textSecondary, fontSize: '0.92rem', lineHeight: 1.6, mb: 1.5 }}>
                {t(`features.items.${key}.description`)}
              </Typography>
              {/* Named for its destination: three identical "Learn more" anchors
                  would tell neither a link list nor a crawler apart. */}
              <Box component={RouterLink} to={to} sx={[quietLinkSx, exitLinkSx]}>
                {t(`capabilities.docsLabels.${label}`)}
                <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </Box>
            </AnimateOnScroll>
          </Box>
        ))}
      </Box>
    </Section>
  );
};
