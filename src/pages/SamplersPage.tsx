import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import BubbleChartOutlinedIcon from '@mui/icons-material/BubbleChartOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { CapabilityExplorer } from '../components/primitives/CapabilityExplorer';
import { BlockHeading } from '../components/primitives/BlockHeading';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { quietLinkSx } from '../theme/neu';
import { soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';

/** "Los siete samplers": one card per search algorithm, in the docs' comparison order. */
const SAMPLER_ITEMS = [
  { key: 'tpe', icon: <AutoGraphOutlinedIcon /> },
  { key: 'cmaEs', icon: <BubbleChartOutlinedIcon /> },
  { key: 'nsga2', icon: <Diversity3OutlinedIcon /> },
  { key: 'qmc', icon: <GridOnOutlinedIcon /> },
  { key: 'random', icon: <CasinoOutlinedIcon /> },
  { key: 'qaoa', icon: <ScienceOutlinedIcon /> },
  { key: 'qKernel', icon: <FunctionsOutlinedIcon /> },
] as const;

/** "El motor detrás de la búsqueda": what happens once a study launches, from optimizer-architecture.md. */
const ENGINE_ITEMS = [
  { key: 'automaticScaling', icon: <SettingsSuggestOutlinedIcon /> },
  { key: 'batchPipeline', icon: <ViewStreamOutlinedIcon /> },
  { key: 'finiteGrid', icon: <GridViewOutlinedIcon /> },
  { key: 'failureRecovery', icon: <HealthAndSafetyOutlinedIcon /> },
  { key: 'liveProgress', icon: <MonitorHeartOutlinedIcon /> },
  { key: 'sameEngine', icon: <SyncAltOutlinedIcon /> },
] as const;

const PICKING_FACT_KEYS = ['unsure', 'continuous', 'categorical', 'coverage', 'baseline', 'quantum'] as const;
const LIMIT_FACT_KEYS = ['noMultiObjective', 'noSeed', 'samplerLocked', 'noWorkerControl'] as const;

const FactStrip = ({ baseKey, keys, columns }: { baseKey: string; keys: readonly string[]; columns: number }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuPanel
      variant="tile"
      sx={{
        p: { xs: 2.5, md: 3 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${columns}, minmax(0, 1fr))` },
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
 * Product menu's "Optimization Engine" item (labeled "Samplers" internally):
 * the seven search algorithms behind a study, how to pick one, the scheduler
 * that runs them in parallel and recovers from failures automatically, and
 * the honest limits — no multi-objective search, no seed, no manual worker
 * control. Condensed from `/docs/sampler-selection` and
 * `/docs/optimizer-architecture`.
 */
export const SamplersPage = () => {
  const { t } = useTranslation('pages');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={t('samplers.seo.title')} description={t('samplers.seo.description')} />
      <Header />

      <Box component="main" id="content">
        <Section size="lg">
          <SectionHeader
            level="h1"
            eyebrow={t('samplers.eyebrow')}
            title={t('samplers.title')}
            titleAccent={t('samplers.titleAccent')}
            description={t('samplers.description')}
          />

          {/* Los siete samplers */}
          <BlockHeading eyebrow={t('samplers.algorithms.eyebrow')} title={t('samplers.algorithms.title')} />
          <CapabilityExplorer ns="pages" baseKey="samplers.items" items={SAMPLER_ITEMS} />

          {/* Cómo elegir */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('samplers.picking.eyebrow')} title={t('samplers.picking.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="samplers.picking.facts" keys={PICKING_FACT_KEYS} columns={3} />
            </AnimateOnScroll>
          </Box>

          {/* El motor detrás de la búsqueda */}
          <Box sx={{ mt: { xs: 7, md: 9 } }}>
            <BlockHeading
              eyebrow={t('samplers.engine.eyebrow')}
              title={t('samplers.engine.title')}
              description={t('samplers.engine.description')}
            />
            <CapabilityExplorer ns="pages" baseKey="samplers.engine.items" items={ENGINE_ITEMS} />
          </Box>

          {/* Lo que no hace */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('samplers.limits.eyebrow')} title={t('samplers.limits.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="samplers.limits.facts" keys={LIMIT_FACT_KEYS} columns={4} />
            </AnimateOnScroll>
          </Box>

          <Typography sx={{ mt: { xs: 5, md: 6 }, fontSize: '0.85rem', color: soft.textSecondary, maxWidth: 760 }}>
            {t('samplers.note')}
          </Typography>

          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, md: 3 } }}>
            {(['samplerSelection', 'optimizerArchitecture'] as const).map((key) => (
              <Box
                key={key}
                component={RouterLink}
                to={t(`samplers.docsLinks.${key}.href`)}
                sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.linkAccent }]}
              >
                {t(`samplers.docsLinks.${key}.label`)}
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
