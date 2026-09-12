import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { FeatureCard } from '../primitives/FeatureCard';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { neuGrid } from '../../theme/neu';

const features = [
  { key: 'ai' },
  { key: 'laboratory' },
  { key: 'bayesian' },
  { key: 'allocation' },
  { key: 'crossMarket' },
  { key: 'liveTrading' },
] as const;

export const FeaturesSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="features" size="lg">
      <SectionHeader
        eyebrow={t('features.eyebrow')}
        title={t('features.title')}
        titleAccent={t('features.titleAccent')}
        description={t('features.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: neuGrid.columns(2), md: neuGrid.columns(3) },
          gap: neuGrid.gap,
          alignItems: 'stretch',
        }}
      >
        {features.map((f, idx) => (
          <AnimateOnScroll key={f.key} delay={(idx % 3) * 80} stretch>
            <FeatureCard
              title={t(`features.items.${f.key}.title`)}
              description={t(`features.items.${f.key}.description`)}
            />
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};