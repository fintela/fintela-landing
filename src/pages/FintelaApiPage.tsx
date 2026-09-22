import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import CodeIcon from '@mui/icons-material/Code';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { IconWell } from '../components/primitives/IconWell';
import { CapabilityExplorer } from '../components/primitives/CapabilityExplorer';
import { BlockHeading } from '../components/primitives/BlockHeading';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { quietLinkSx } from '../theme/neu';
import { soft } from '../theme/tokens';
import { Seo } from '../seo/Seo';

/** "Qué puedes leer": one card per resource family, same grouping as the docs table. */
const RESOURCE_ITEMS = [
  { key: 'studies', icon: <QueryStatsIcon /> },
  { key: 'trialsPortfolios', icon: <TimelineOutlinedIcon /> },
  { key: 'portfolioGroups', icon: <AccountTreeOutlinedIcon /> },
  { key: 'buildingBlocks', icon: <CodeIcon /> },
] as const;

/** "Para qué la usan nuestros clientes": a quick punchy tile grid. */
const USE_CASE_ITEMS = [
  { key: 'dashboards', icon: <BarChartOutlinedIcon /> },
  { key: 'reporting', icon: <DescriptionOutlinedIcon /> },
  { key: 'monitoring', icon: <NotificationsActiveOutlinedIcon /> },
  { key: 'liveTracking', icon: <TimelineOutlinedIcon /> },
  { key: 'versionControl', icon: <HistoryOutlinedIcon /> },
  { key: 'backup', icon: <CloudDownloadOutlinedIcon /> },
] as const;

const CONNECT_FACT_KEYS = ['key', 'bearer', 'openapi', 'responses', 'health'] as const;
const SECURITY_FACT_KEYS = ['readOnly', 'scoped', 'rateLimit', 'noPush', 'plan'] as const;

/** "El motor detrás de cada número": the simulation engine that produces everything the API reads. */
const ENGINE_ITEMS = [
  { key: 'oneEngine', icon: <HubOutlinedIcon /> },
  { key: 'howItSimulates', icon: <TuneOutlinedIcon /> },
  { key: 'transactionCosts', icon: <PaidOutlinedIcon /> },
  { key: 'antiOverfitting', icon: <ShieldOutlinedIcon /> },
  { key: 'backtestOutput', icon: <InsightsOutlinedIcon /> },
  { key: 'askAgain', icon: <ReplayOutlinedIcon /> },
  { key: 'scale', icon: <SpeedOutlinedIcon /> },
  { key: 'yourCode', icon: <TerminalOutlinedIcon /> },
  { key: 'toLive', icon: <RocketLaunchOutlinedIcon /> },
] as const;

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

const UseCaseTile = ({ itemKey, icon }: { itemKey: (typeof USE_CASE_ITEMS)[number]['key']; icon: React.ReactNode }) => {
  const { t } = useTranslation('pages');
  return (
    <NeuPanel variant="tile" sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: { xs: 2, md: 2.25 } }}>
      <IconWell size={36}>{icon}</IconWell>
      <Box>
        <Typography sx={{ fontWeight: 700, color: soft.text, mb: 0.4, fontSize: '0.92rem' }}>
          {t(`fintelaApi.useCases.items.${itemKey}.title`)}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, fontSize: '0.84rem', lineHeight: 1.55 }}>
          {t(`fintelaApi.useCases.items.${itemKey}.desc`)}
        </Typography>
      </Box>
    </NeuPanel>
  );
};

/**
 * Product menu's "Fintela API" item. Two halves: what the read-only
 * Developer API surfaces (resources, use cases, how it connects, security),
 * and the simulation engine that computes every number it hands back — the
 * same engine behind the sandbox, every study trial, and live portfolios.
 */
export const FintelaApiPage = () => {
  const { t } = useTranslation('pages');

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Seo title={t('fintelaApi.seo.title')} description={t('fintelaApi.seo.description')} />
      <Header />

      <Box component="main" id="content">
        <Section size="lg">
          <SectionHeader
            level="h1"
            eyebrow={t('fintelaApi.eyebrow')}
            title={t('fintelaApi.title')}
            titleAccent={t('fintelaApi.titleAccent')}
            description={t('fintelaApi.description')}
          />

          {/* Qué puedes leer */}
          <BlockHeading eyebrow={t('fintelaApi.resources.eyebrow')} title={t('fintelaApi.resources.title')} />
          <CapabilityExplorer ns="pages" baseKey="fintelaApi.resources.items" items={RESOURCE_ITEMS} />

          {/* Para qué la usan */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('fintelaApi.useCases.eyebrow')} title={t('fintelaApi.useCases.title')} />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 2, md: 2.5 },
              }}
            >
              {USE_CASE_ITEMS.map((c, idx) => (
                <AnimateOnScroll key={c.key} delay={idx * 60} stretch>
                  <UseCaseTile itemKey={c.key} icon={c.icon} />
                </AnimateOnScroll>
              ))}
            </Box>
          </Box>

          {/* Cómo se conecta */}
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <BlockHeading eyebrow={t('fintelaApi.connect.eyebrow')} title={t('fintelaApi.connect.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="fintelaApi.connect.facts" keys={CONNECT_FACT_KEYS} />
            </AnimateOnScroll>
          </Box>

          {/* Seguridad y límites */}
          <Box sx={{ mt: { xs: 3, md: 4 } }}>
            <BlockHeading eyebrow={t('fintelaApi.security.eyebrow')} title={t('fintelaApi.security.title')} />
            <AnimateOnScroll stretch>
              <FactStrip baseKey="fintelaApi.security.facts" keys={SECURITY_FACT_KEYS} />
            </AnimateOnScroll>
          </Box>

          {/* El motor detrás de cada número */}
          <Box sx={{ mt: { xs: 7, md: 9 } }}>
            <BlockHeading
              eyebrow={t('fintelaApi.engine.eyebrow')}
              title={t('fintelaApi.engine.title')}
              description={t('fintelaApi.engine.description')}
            />
            <CapabilityExplorer ns="pages" baseKey="fintelaApi.engine.items" items={ENGINE_ITEMS} />
          </Box>

          <Typography sx={{ mt: { xs: 5, md: 6 }, fontSize: '0.95rem', color: soft.text, fontWeight: 600, fontStyle: 'italic', maxWidth: 760 }}>
            {t('fintelaApi.closingLine')}
          </Typography>

          <Typography sx={{ mt: 2, fontSize: '0.85rem', color: soft.textSecondary, maxWidth: 760 }}>
            {t('fintelaApi.note')}
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Box
              component={RouterLink}
              to="/docs/api-overview"
              sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.linkAccent }]}
            >
              {t('fintelaApi.docsLink')}
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Box>
          </Box>
        </Section>
      </Box>

      <Footer />
    </Box>
  );
};
