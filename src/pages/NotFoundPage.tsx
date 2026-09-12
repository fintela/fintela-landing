import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowForward, TravelExplore } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { Section } from '../components/primitives/Section';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { NeuButton } from '../components/primitives/NeuButton';
import { IconWell } from '../components/primitives/IconWell';
import { TierBadge } from '../components/primitives/TierBadge';
import { ctaRowSx } from '../theme/neu';
import { soft } from '../theme/tokens';

/**
 * Catch-all for unmatched paths.
 *
 * CloudFront rewrites S3's 404 to `/index.html` with a 200 so the SPA can route
 * client-side. Without a `*` route that rewrite produced a structurally valid but
 * completely EMPTY page — every typo'd URL, every dead inbound link and every
 * removed static file rendered blank markup with no header, no footer and no way
 * back. This page is what that rewrite lands on instead.
 *
 * Note `/docs/*` and the legacy `/documentation/*` are handled separately in
 * App.tsx: an unknown doc path redirects to the docs index rather than reaching
 * here, because a reader who mistypes a doc URL wants the docs, not a dead end.
 */
export const NotFoundPage = () => {
  const { t } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState('');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      <Section size="lg" maxWidth="sm" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 14 } }}>
        <NeuPanel
          sx={{
            maxWidth: 560,
            mx: 'auto',
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 7 },
            textAlign: 'center',
          }}
        >
          <IconWell size={84} round sx={{ mx: 'auto', mb: 3.5 }}>
            <TravelExplore />
          </IconWell>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <TierBadge>{t('notFound.code')}</TierBadge>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2.5,
              color: soft.text,
              textWrap: 'balance',
              fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' },
            }}
          >
            {t('notFound.title')}
          </Typography>

          <Typography
            sx={{
              color: soft.textSecondary,
              mb: 5,
              lineHeight: 1.75,
              fontSize: { xs: '1rem', md: '1.075rem' },
            }}
          >
            {t('notFound.body')}
          </Typography>

          <Box sx={ctaRowSx}>
            <NeuButton tone="accent" to="/" endIcon={<ArrowForward />}>
              {t('notFound.home')}
            </NeuButton>
            <NeuButton tone="raised" to="/docs">
              {t('notFound.docs')}
            </NeuButton>
          </Box>
        </NeuPanel>
      </Section>

      <Footer />
    </Box>
  );
};
