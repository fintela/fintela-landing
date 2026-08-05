import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { FeatureCard } from '../primitives/FeatureCard';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import BalanceIcon from '@mui/icons-material/Balance';
import LayersIcon from '@mui/icons-material/Layers';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

const features = [
  { key: 'ai', icon: <AutoAwesomeIcon />, accent: '#efc03c' },
  { key: 'laboratory', icon: <ScienceOutlinedIcon />, accent: '#7c3aed' },
  { key: 'bayesian', icon: <RocketLaunchIcon />, accent: '#10b981' },
  { key: 'allocation', icon: <BalanceIcon />, accent: '#ec4899' },
  { key: 'crossMarket', icon: <LayersIcon />, accent: '#2f6395' },
  { key: 'liveTrading', icon: <CompareArrowsIcon />, accent: '#ef4444' },
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