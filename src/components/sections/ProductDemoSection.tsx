import { Box, Typography } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients, palette, shadows, motion } from '../../theme/tokens';

/**
 * Placeholder for the upcoming product walkthrough video. Swap the ambient
 * panel below for a <video>/<iframe> embed once the asset ships; the
 * surrounding Section/SectionHeader and i18n copy can stay as-is.
 */
export const ProductDemoSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="demo" tone="default" size="md">
      <SectionHeader
        eyebrow={t('productDemo.eyebrow')}
        title={t('productDemo.title')}
        titleAccent={t('productDemo.titleAccent')}
        description={t('productDemo.description')}
      />

      <AnimateOnScroll delay={120}>
        <Box
          role="img"
          aria-label={t('productDemo.comingSoon')}
          sx={{
            position: 'relative',
            maxWidth: 960,
            mx: 'auto',
            aspectRatio: '16 / 9',
            borderRadius: 4,
            overflow: 'hidden',
            background: gradients.ink,
            boxShadow: shadows.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 28% 30%, rgba(239,192,60,0.18) 0%, transparent 55%), radial-gradient(circle at 76% 72%, rgba(47,99,149,0.24) 0%, transparent 55%)',
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: { xs: 64, md: 84 },
                height: { xs: 64, md: 84 },
                borderRadius: 999,
                background: gradients.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.brandStrong,
                transition: `transform ${motion.base}`,
                '&:hover': { transform: 'scale(1.06)' },
              }}
            >
              <PlayArrowRoundedIcon sx={{ fontSize: { xs: 32, md: 42 }, color: '#fff' }} />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.5,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: palette.gold }} />
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {t('productDemo.comingSoon')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </AnimateOnScroll>
    </Section>
  );
};
