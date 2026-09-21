import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CandlestickChartOutlinedIcon from '@mui/icons-material/CandlestickChartOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ScatterPlotOutlinedIcon from '@mui/icons-material/ScatterPlotOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { CapabilityExplorer } from '../components/primitives/CapabilityExplorer';
import { BlockHeading } from '../components/primitives/BlockHeading';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { quietLinkSx, wellSx } from '../theme/neu';
import { radii, soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';

/** "Explora cada dataset": the Data Explorer's seven dataset groups. */
const DATASET_ITEMS = [
  { key: 'marketData', icon: <CandlestickChartOutlinedIcon /> },
  { key: 'fundamentals', icon: <ReceiptLongOutlinedIcon /> },
  { key: 'corporateActions', icon: <SwapHorizOutlinedIcon /> },
  { key: 'eventsCalendar', icon: <EventOutlinedIcon /> },
  { key: 'alternativeData', icon: <ForumOutlinedIcon /> },
  { key: 'macroRates', icon: <PublicOutlinedIcon /> },
  { key: 'reference', icon: <CategoryOutlinedIcon /> },
] as const;

/** "Del ranking a la decisión": the Optimization Dashboard workflow beyond the worked example above. */
const ANALYSIS_ITEMS = [
  { key: 'rankingComparison', icon: <FormatListNumberedOutlinedIcon /> },
  { key: 'robustnessVerdict', icon: <GppGoodOutlinedIcon /> },
  { key: 'behavioralFamilies', icon: <HubOutlinedIcon /> },
  { key: 'parameterImportance', icon: <TuneOutlinedIcon /> },
  { key: 'parameterExploration', icon: <ScatterPlotOutlinedIcon /> },
  { key: 'promotion', icon: <RocketLaunchOutlinedIcon /> },
] as const;

const METRICS_FACT_KEYS = ['portfolioMetrics', 'benchmarkMetrics', 'everywhere', 'customMetrics', 'objectives'] as const;

const FactStrip = ({ baseKey, keys }: { baseKey: string; keys: readonly string[] }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuPanel
      variant="tile"
      sx={{
        p: { xs: 2.5, md: 3 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${keys.length}, minmax(0, 1fr))` },
        gap: { xs: 2.5, md: 3 },
      }}
    >
      {keys.map((key) => (
        <Box key={key}>
          <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: soft.text, mb: 0.6 }}>
            {t(`${baseKey}.${key}.label`)}
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.55, color: soft.textSecondary }}>
            {t(`${baseKey}.${key}.value`)}
          </Typography>
        </Box>
      ))}
    </NeuPanel>
  );
};

/**
 * Product menu's "In-Depth Analysis" item: the Data Explorer's catalog of
 * everything Fintela reads from before it ever touches a strategy, and the
 * Optimization Dashboard workflow from ranking to promotion.
 */
export const InDepthAnalysisPage = () => {
  const { t } = useTranslation('pages');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={t('inDepthAnalysis.seo.title')} description={t('inDepthAnalysis.seo.description')} />
      <Header />

      <Box component="main" id="content">
        <Section size="lg" tone="hero">
          <Box
            sx={{
              ...wellSx('sm'),
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.6,
              borderRadius: `${radii.pill}px`,
              mb: 2.5,
            }}
          >
            <Box aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: soft.accent }} />
            <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: soft.text }}>
              {t('inDepthAnalysis.hero.moduleTag')}
            </Typography>
          </Box>

          <SectionHeader
            level="h1"
            eyebrow={t('inDepthAnalysis.hero.eyebrow')}
            title={t('inDepthAnalysis.hero.title')}
            titleAccent={t('inDepthAnalysis.hero.titleAccent')}
            description={t('inDepthAnalysis.hero.description')}
            align="left"
          />

          {/* Explora cada dataset */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading
              eyebrow={t('inDepthAnalysis.datasets.eyebrow')}
              title={t('inDepthAnalysis.datasets.title')}
              description={t('inDepthAnalysis.datasets.description')}
            />
            <CapabilityExplorer ns="pages" baseKey="inDepthAnalysis.datasets.items" items={DATASET_ITEMS} />
          </Box>
        </Section>

        <Section size="lg">
          {/* Del ranking a la decisión */}
          <BlockHeading
            eyebrow={t('inDepthAnalysis.workflow.eyebrow')}
            title={t('inDepthAnalysis.workflow.title')}
            description={t('inDepthAnalysis.workflow.description')}
          />
          <CapabilityExplorer ns="pages" baseKey="inDepthAnalysis.workflow.items" items={ANALYSIS_ITEMS} />

          {/* 35 métricas, un solo catálogo */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('inDepthAnalysis.metrics.eyebrow')} title={t('inDepthAnalysis.metrics.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="inDepthAnalysis.metrics.facts" keys={METRICS_FACT_KEYS} />
            </AnimateOnScroll>
          </Box>

          <Typography sx={{ mt: { xs: 5, md: 6 }, fontSize: '0.95rem', color: soft.text, fontWeight: 600, fontStyle: 'italic', maxWidth: 760 }}>
            {t('inDepthAnalysis.closingLine')}
          </Typography>

          <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, md: 3 } }}>
            {(['optimizationDashboard', 'metricsReference'] as const).map((key) => (
              <Box
                key={key}
                component={RouterLink}
                to={t(`inDepthAnalysis.docsLinks.${key}.href`)}
                sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.accent }]}
              >
                {t(`inDepthAnalysis.docsLinks.${key}.label`)}
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Box>
            ))}
          </Box>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};
