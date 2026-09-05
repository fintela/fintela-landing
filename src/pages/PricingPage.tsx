import { useState } from 'react';
import { Box, Button, Chip, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { SectionHeader } from '../components/primitives/SectionHeader';
import { GradientText } from '../components/primitives/GradientText';
import { AnimateOnScroll } from '../components/common/AnimateOnScroll';
import { gradients, palette, shadows } from '../theme/tokens';

const APP_URL = 'https://app.fintela.io';

/** The three individual-account tiers, in display order. */
const PLAN_TIERS = [
  { key: 'basic', icon: <RocketLaunchOutlinedIcon />, accent: palette.blue, featured: false, hasCta: false },
  { key: 'pro', icon: <BoltOutlinedIcon />, accent: palette.crimson, featured: true, hasCta: false },
  { key: 'proPlus', icon: <AutoAwesomeOutlinedIcon />, accent: palette.gold, featured: false, hasCta: true },
] as const;

interface PlanCardProps {
  icon: React.ReactNode;
  accent: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  features: string[];
  cta?: string;
  featured?: boolean;
}

const PlanCard = ({
  icon,
  accent,
  name,
  badge,
  tagline,
  description,
  features,
  cta,
  featured = false,
}: PlanCardProps) => (
  <Box
    sx={{
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 3, md: 3.5 },
      bgcolor: '#fff',
      border: '1px solid',
      borderColor: featured ? `${accent}59` : 'divider',
      borderRadius: 3,
      boxShadow: featured ? shadows.lg : 'none',
      overflow: 'hidden',
      transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(120% 80% at 100% 0%, ${accent}0d 0%, transparent 60%)`,
        opacity: featured ? 1 : 0,
        transition: 'opacity 0.22s ease',
        pointerEvents: 'none',
      },
      '&:hover': {
        borderColor: `${accent}66`,
        boxShadow: `0 4px 14px ${accent}1a`,
        transform: 'translateY(-2px)',
        '&::before': { opacity: 1 },
      },
    }}
  >
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* The badge row is reserved on every card so headers line up, even though
          only the featured card gets the brand-gradient treatment. */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', minHeight: 22, mb: 1.5 }}>
        <Chip
          size="small"
          label={badge}
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 600,
            ...(featured
              ? { background: gradients.brand, color: '#fff' }
              : { bgcolor: `${accent}14`, color: accent }),
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${accent}14`,
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.3rem',
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: accent,
            }}
          >
            {tagline}
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.65 }}>
        {description}
      </Typography>

      <Box
        sx={{
          mt: 2.5,
          pt: 2.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.1,
        }}
      >
        {features.map((feature) => (
          <Box key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <CheckRoundedIcon sx={{ fontSize: 18, color: accent, mt: '0.15rem', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.6 }}>
              {feature}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 16 }} />

      {cta && (
        <Button
          href={APP_URL}
          fullWidth
          variant={featured ? 'contained' : 'outlined'}
          sx={{ mt: 3, ...(featured ? { background: gradients.brand, color: '#fff' } : {}) }}
        >
          {cta}
        </Button>
      )}
    </Box>
  </Box>
);

/**
 * Public pricing for Fintela: free-to-start individual plans with itemized
 * allowances, and a business/partner track that is handled directly rather
 * than through a listed plan.
 */
export const PricingPage = () => {
  const { t } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState('pricing');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 7, md: 11 },
          pb: { xs: 7, md: 10 },
          background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 60%, #ffffff 100%)',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -140,
            right: -120,
            width: 480,
            height: 480,
            background: 'radial-gradient(circle, rgba(47,99,149,0.13) 0%, transparent 65%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: -180,
            left: -140,
            width: 480,
            height: 480,
            background: 'radial-gradient(circle, rgba(239,192,60,0.13) 0%, transparent 65%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
            <AnimateOnScroll delay={90}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.25rem', sm: '3rem', md: '3.9rem' },
                  color: 'text.primary',
                  mb: 2.5,
                }}
              >
                {t('pricing.hero.title')}{' '}
                <GradientText>{t('pricing.hero.titleAccent')}</GradientText>
              </Typography>
            </AnimateOnScroll>
          </Box>
        </Container>

      </Box>

      {/* Individual accounts */}
      <Section id="individual" tone="muted" size="lg">
        <SectionHeader
          title={t('pricing.individual.title')}
          titleAccent={t('pricing.individual.titleAccent')}
          description={t('pricing.individual.description')}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {PLAN_TIERS.map((tier, idx) => (
            <AnimateOnScroll key={tier.key} delay={idx * 80}>
              <PlanCard
                icon={tier.icon}
                accent={tier.accent}
                featured={tier.featured}
                name={t(`pricing.individual.plans.${tier.key}.name`)}
                badge={t(`pricing.individual.plans.${tier.key}.badge`)}
                tagline={t(`pricing.individual.plans.${tier.key}.tagline`)}
                description={t(`pricing.individual.plans.${tier.key}.description`)}
                features={
                  t(`pricing.individual.plans.${tier.key}.features`, {
                    returnObjects: true,
                  }) as string[]
                }
                cta={tier.hasCta ? t(`pricing.individual.plans.${tier.key}.cta`) : undefined}
              />
            </AnimateOnScroll>
          ))}
        </Box>
      </Section>

      {/* Business & partners */}
      <Section id="business" tone="ink" size="md" maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <AnimateOnScroll delay={40}>
            <Typography
              variant="h3"
              sx={{ color: '#fff', fontSize: { xs: '1.75rem', md: '2.4rem' }, mb: 2 }}
            >
              {t('pricing.business.title')}{' '}
              <GradientText>{t('pricing.business.titleAccent')}</GradientText>
            </Typography>
          </AnimateOnScroll>
          <AnimateOnScroll delay={100}>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.72)',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.65,
                maxWidth: 620,
                mx: 'auto',
                mb: 4,
              }}
            >
              {t('pricing.business.description')}
            </Typography>
          </AnimateOnScroll>
          <AnimateOnScroll delay={150}>
            <Button
              component={RouterLink}
              to="/contact"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ background: gradients.brand, color: '#fff', px: 3 }}
            >
              {t('pricing.business.cta')}
            </Button>
          </AnimateOnScroll>
        </Box>
      </Section>

      <Footer />
    </Box>
  );
};
