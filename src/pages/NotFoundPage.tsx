import { useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ArrowForward, TravelExplore } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';

/**
 * Catch-all for unmatched paths.
 *
 * CloudFront rewrites S3's 404 to `/index.html` with a 200 so the SPA can route
 * client-side. Without a `*` route that rewrite produced a structurally valid but
 * completely EMPTY page — every typo'd URL, every dead inbound link and every
 * removed static file rendered blank markup with no header, no footer and no way
 * back. This page is what that rewrite lands on instead.
 *
 * Note `/documentation/*` is handled separately in App.tsx: unknown doc paths
 * redirect to the docs home rather than reaching here, because a reader who
 * mistypes a doc URL wants the docs, not a dead end.
 */
export const NotFoundPage = () => {
  const { t } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState('');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      <Box
        sx={{
          pt: { xs: 12, md: 16 },
          pb: { xs: 8, md: 14 },
          background:
            'linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, rgba(240, 147, 251, 0.03) 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 84,
                height: 84,
                mx: 'auto',
                mb: 3.5,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(102, 126, 234, 0.08)',
                color: 'primary.main',
                '& svg': { fontSize: '2.25rem' },
              }}
            >
              <TravelExplore />
            </Box>

            <Typography
              variant="h6"
              sx={{
                mb: 1,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
              }}
            >
              {t('notFound.code')}
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2.5,
                color: 'text.primary',
                fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' },
              }}
            >
              {t('notFound.title')}
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                mb: 5,
                lineHeight: 1.75,
                fontSize: { xs: '1rem', md: '1.075rem' },
              }}
            >
              {t('notFound.body')}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                component={RouterLink}
                to="/"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{ px: 3.5, py: 1.4, fontWeight: 600 }}
              >
                {t('notFound.home')}
              </Button>
              <Button
                component={RouterLink}
                to="/documentation"
                variant="outlined"
                size="large"
                sx={{ px: 3.5, py: 1.4, fontWeight: 600 }}
              >
                {t('notFound.docs')}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};
