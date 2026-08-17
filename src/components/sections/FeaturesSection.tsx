import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { FeatureCard } from '../primitives/FeatureCard';
import { AnimateOnScroll } from '../common/AnimateOnScroll';

const features = [
  { key: 'ai', accent: '#efc03c' },
  { key: 'laboratory', accent: '#7c3aed' },
  { key: 'bayesian', accent: '#10b981' },
  { key: 'allocation', accent: '#ec4899' },
  { key: 'crossMarket', accent: '#2f6395' },
  { key: 'liveTrading', accent: '#ef4444' },
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