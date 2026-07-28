import { Box, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients } from '../../theme/tokens';

const rowKeys = [
  'ideaToLive',
  'firstProfitable',
  'infraCost',
  'onboarding',
  'experiments',
  'successRate',
] as const;

const statKeys = ['strategiesPerYear', 'infraCost', 'edge'] as const;

export const AdvantageSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="advantage" tone="muted" size="lg">
      <SectionHeader
        eyebrow={t('advantage.eyebrow')}
        title={t('advantage.title')}
        titleAccent={t('advantage.titleAccent')}
        description={t('advantage.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
          gap: { xs: 3, md: 4 },
          alignItems: 'stretch',
        }}
      >
        <AnimateOnScroll>
          <Paper
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                bgcolor: '#fafbfc',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'text.disabled',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                <CloseIcon sx={{ fontSize: 14 }} /> {t('advantage.legacyHeader')}
              </Box>
              <Box
                sx={{
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: gradients.brand,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  position: 'relative',
                }}
              >
                <CheckCircleOutlineIcon
                  sx={{
                    fontSize: 14,
                    color: '#667eea',
                    background: 'none',
                    WebkitTextFillColor: '#667eea',
                  }}
                />{' '}
                {t('advantage.withFintelaHeader')}
              </Box>
            </Box>

            {rowKeys.map((rowKey, idx) => (
              <Box
                key={rowKey}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderBottom: idx < rowKeys.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background 0.18s',
                  '&:hover': { bgcolor: 'rgba(102,126,234,0.025)' },
                }}
              >
                <Typography
                  sx={{
                    p: { xs: 1.75, md: 2.25 },
                    color: 'text.secondary',
                    fontSize: { xs: '0.85rem', md: '0.92rem' },
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    lineHeight: 1.55,
                  }}
                >
                  {t(`advantage.rows.${rowKey}.without`)}
                </Typography>
                <Box
                  sx={{
                    p: { xs: 1.75, md: 2.25 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.92rem', md: '1.02rem' },
                      background: gradients.brand,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t(`advantage.rows.${rowKey}.with`)}
                  </Typography>
                  {t(`advantage.rows.${rowKey}.badge`) && (
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: 'text.disabled',
                        fontWeight: 600,
                        bgcolor: 'rgba(102,126,234,0.08)',
                        px: 1,
                        py: 0.25,
                        borderRadius: '999px',
                      }}
                    >
                      {t(`advantage.rows.${rowKey}.badge`)}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Paper>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <Box
            sx={{
              borderRadius: 4,
              p: { xs: 3, md: 4 },
              background:
                'linear-gradient(160deg, #0b1020 0%, #131835 60%, #1c1f4a 100%)',
              color: '#fff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 320,
                height: 320,
                background:
                  'radial-gradient(circle, rgba(102,126,234,0.32) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
              }}
            />
            <Box sx={{ position: 'relative' }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)',
                  mb: 1,
                }}
              >
                {t('advantage.impactEyebrow')}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1.5rem', md: '1.85rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}
              >
                {t('advantage.impactBefore')}{' '}
                <Box
                  component="span"
                  sx={{
                    background: gradients.brand,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {t('advantage.impactHighlight')}
                </Box>{' '}
                {t('advantage.impactAfter')}
              </Typography>
            </Box>

            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2, mt: 'auto' }}>
              {statKeys.map((key) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.6rem', md: '2rem' },
                      fontWeight: 800,
                      minWidth: 90,
                      background: gradients.brand,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {t(`advantage.stats.${key}.value`)}
                  </Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {t(`advantage.stats.${key}.label`)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
                      {t(`advantage.stats.${key}.sub`)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};
