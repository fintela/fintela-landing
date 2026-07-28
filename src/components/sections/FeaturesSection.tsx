import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { FeatureCard } from '../primitives/FeatureCard';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import LayersIcon from '@mui/icons-material/Layers';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import HubIcon from '@mui/icons-material/Hub';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudIcon from '@mui/icons-material/Cloud';
import InsightsIcon from '@mui/icons-material/Insights';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TerminalIcon from '@mui/icons-material/Terminal';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BalanceIcon from '@mui/icons-material/Balance';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

const features = [
  { key: 'crossMarket', icon: <LayersIcon />, accent: '#667eea' },
  { key: 'screener', icon: <FilterAltOutlinedIcon />, accent: '#4f46e5' },
  { key: 'laboratory', icon: <ScienceOutlinedIcon />, accent: '#7c3aed' },
  { key: 'dataPipelines', icon: <AccountTreeOutlinedIcon />, accent: '#14b8a6' },
  { key: 'dataLab', icon: <BiotechOutlinedIcon />, accent: '#818cf8' },
  { key: 'metaStrategies', icon: <AccountTreeIcon />, accent: '#a855f7' },
  { key: 'allocation', icon: <BalanceIcon />, accent: '#ec4899' },
  { key: 'attribution', icon: <TroubleshootIcon />, accent: '#d946ef' },
  { key: 'pipeline', icon: <HubIcon />, accent: '#f093fb' },
  { key: 'ai', icon: <AutoAwesomeIcon />, accent: '#fbbf24' },
  { key: 'bayesian', icon: <RocketLaunchIcon />, accent: '#10b981' },
  { key: 'strategyClustering', icon: <ScatterPlotIcon />, accent: '#22d3ee' },
  { key: 'paramImportances', icon: <LeaderboardOutlinedIcon />, accent: '#38bdf8' },
  { key: 'metrics', icon: <InsightsIcon />, accent: '#06b6d4' },
  { key: 'python', icon: <TerminalIcon />, accent: '#8b5cf6' },
  { key: 'liveTrading', icon: <CompareArrowsIcon />, accent: '#ef4444' },
  { key: 'protectiveExecution', icon: <GppGoodOutlinedIcon />, accent: '#f97316' },
  { key: 'cloud', icon: <CloudIcon />, accent: '#0ea5e9' },
  { key: 'provenance', icon: <LockOutlinedIcon />, accent: '#64748b' },
  { key: 'privacy', icon: <ShieldOutlinedIcon />, accent: '#0891b2' },
] as const;

export const FeaturesSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="features" tone="default" size="lg">
      <SectionHeader
        eyebrow={t('features.eyebrow')}
        title={t('features.title')}
        titleAccent={t('features.titleAccent')}
        description={t('features.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, md: 3 },
        }}
      >
        {features.map((f, idx) => (
          <AnimateOnScroll key={f.key} delay={(idx % 3) * 80}>
            <FeatureCard
              icon={f.icon}
              accent={f.accent}
              title={t(`features.items.${f.key}.title`)}
              description={t(`features.items.${f.key}.description`)}
            />
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};
