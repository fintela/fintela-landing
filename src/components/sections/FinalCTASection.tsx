import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { gradients } from '../../theme/tokens';

export const FinalCTASection = () => {
  const { t } = useTranslation('home');
  return (
    <Box
      component="section"
      id="cta"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#fff',
      }}
    >
      <Container maxWidth="lg">
        <AnimateOnScroll>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 5,
              overflow: 'hidden',
              p: { xs: 4, md: 8 },
              background:
                'linear-gradient(160deg, #0b1020 0%, #131835 55%, #1c1f4a 100%)',
              color: '#fff',
              textAlign: 'center',
              isolation: 'isolate',
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(80% 100% at 50% 0%, rgba(102,126,234,0.32) 0%, transparent 65%)',
                pointerEvents: 'none',
                zIndex: -1,
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(60% 60% at 90% 90%, rgba(240,147,251,0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: -1,
              }}
            />
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                maskImage:
                  'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.5) 0%, transparent 70%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.5) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: -1,
              }}
            />

            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                mb: 2,
              }}
            >
              {t('finalCta.eyebrow')}
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                fontWeight: 800,
                maxWidth: 720,
                mx: 'auto',
                mb: 2.5,
              }}
            >
              {t('finalCta.titleLine1')}{' '}
              <GradientText>{t('finalCta.titleAccent')}</GradientText>
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.15rem' },
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 580,
                mx: 'auto',
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              {t('finalCta.description')}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mb: 2 }}
            >
              <Button
                href="https://app.fintela.io"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  background: gradients.brand,
                  color: '#fff',
                  px: 4,
                  fontSize: '1rem',
                }}
              >
                {t('finalCta.ctaPrimary')}
              </Button>
              <Button
                component={RouterLink}
                to="/contact"
                variant="outlined"
                size="large"
                sx={{
                  px: 3,
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.25)',
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: '#fff',
                  },
                }}
              >
                {t('finalCta.ctaSecondary')}
              </Button>
            </Stack>

            <Typography
              sx={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.04em',
              }}
            >
              {t('finalCta.footnote')}
            </Typography>
          </Box>
        </AnimateOnScroll>
      </Container>
    </Box>
  );
};
