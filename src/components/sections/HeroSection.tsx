import { Box, Container, Typography, Button, Chip, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { GradientText } from '../primitives/GradientText';
import { RotatingWord } from '../primitives/RotatingWord';
import { HeroProductMock } from './hero/HeroProductMock';
import { gradients } from '../../theme/tokens';

export const HeroSection = () => {
  const { t } = useTranslation('home');
  const actionWords = t('hero.actionWords', { returnObjects: true }) as string[];
  const marketWords = t('hero.marketWords', { returnObjects: true }) as string[];
  const audiencePills = t('hero.audiencePills', { returnObjects: true }) as string[];

  return (
    <Box
      sx={{
        position: 'relative',
        pt: { xs: 6, md: 10 },
        pb: { xs: 8, md: 12 },
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #ffffff 0%, #fafbff 60%, #ffffff 100%)',
      }}
    >
      {/* Ambient gradient blobs */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 520,
          height: 520,
          background:
            'radial-gradient(circle, rgba(102,126,234,0.14) 0%, transparent 65%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -160,
          left: -120,
          width: 520,
          height: 520,
          background:
            'radial-gradient(circle, rgba(240,147,251,0.12) 0%, transparent 65%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(11,16,32,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage:
            'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.5) 0%, transparent 65%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.5) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 920, mx: 'auto' }}>
          <AnimateOnScroll>
            <Chip
              label={t('hero.badge')}
              sx={{
                mb: 3,
                height: 28,
                px: 0.5,
                bgcolor: 'rgba(102,126,234,0.08)',
                color: '#4a5de8',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                border: '1px solid rgba(102,126,234,0.18)',
              }}
            />
          </AnimateOnScroll>

          <AnimateOnScroll delay={80}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.75rem' },
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: '-0.035em',
                color: 'text.primary',
                mb: 2.5,
              }}
            >
              {t('hero.titleLine1')}
              <br />
              <GradientText>{t('hero.titleAccent')}</GradientText>.
            </Typography>
          </AnimateOnScroll>

          <AnimateOnScroll delay={160}>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1.37rem', md: '1.56rem' },
                lineHeight: 1.6,
                maxWidth: 640,
                mx: 'auto',
                mt: 2,
                mb: 6,
              }}
            >
              <RotatingWord words={actionWords} align="right" gradient /> {t('hero.subtitlePrefix')}{' '}
              <RotatingWord words={marketWords} startDelay={1000} align="left" gradient />
              <br />
              {t('hero.subtitleSuffix')}
            </Typography>
          </AnimateOnScroll>

          <AnimateOnScroll delay={100}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mb: 3.5 }}
            >
              <Button
                href="https://app.fintela.io"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  background: gradients.brand,
                  color: '#fff',
                  px: 3.5,
                  fontSize: '1rem',
                }}
              >
                {t('hero.ctaPrimary')}
              </Button>
              <Button
                component={RouterLink}
                to="/documentation"
                variant="outlined"
                size="large"
                startIcon={<PlayCircleOutlineIcon />}
                sx={{ px: 3 }}
              >
                {t('hero.ctaSecondary')}
              </Button>
            </Stack>
          </AnimateOnScroll>

          <AnimateOnScroll delay={280}>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                justifyContent: 'center',
                mb: { xs: 5, md: 7 },
              }}
            >
              {audiencePills.map((pill) => (
                <Box
                  key={pill}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'text.disabled',
                    px: 1.5,
                    py: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '999px',
                    bgcolor: '#fff',
                  }}
                >
                  {pill}
                </Box>
              ))}
            </Box>
          </AnimateOnScroll>
        </Box>

        {/* Product mock */}
        <AnimateOnScroll delay={320}>
          <HeroProductMock />
        </AnimateOnScroll>
      </Container>
    </Box>
  );
};
