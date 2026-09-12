import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { CheckWell } from '../primitives/CheckWell';
import { TierBadge } from '../primitives/TierBadge';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { cellGrooveSx, eyebrowSx, inkSurfaceSx } from '../../theme/neu';
import { palette, radii, soft } from '../../theme/tokens';

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
    <Section id="advantage" size="lg">
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
          <NeuPanel sx={{ p: { xs: 1.5, md: 2 }, height: '100%' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: 1,
              }}
            >
              <Box
                sx={{
                  ...eyebrowSx,
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CheckWell size={20} icon={<CloseRoundedIcon />} sx={{ color: soft.textSecondary }} />{' '}
                {t('advantage.legacyHeader')}
              </Box>
              <Box
                sx={{
                  ...eyebrowSx,
                  p: { xs: 2, md: 2.5 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: soft.accent,
                }}
              >
                <CheckWell size={20} />{' '}
                {t('advantage.withFintelaHeader')}
              </Box>
            </Box>

            {rowKeys.map((rowKey, idx) => (
              <Box
                key={rowKey}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 1,
                }}
              >
                <Typography
                  sx={{
                    ...(idx > 0 && cellGrooveSx),
                    p: { xs: 1.75, md: 2.25 },
                    color: soft.textSecondary,
                    fontSize: { xs: '0.85rem', md: '0.92rem' },
                    lineHeight: 1.55,
                  }}
                >
                  {t(`advantage.rows.${rowKey}.without`)}
                </Typography>
                <Box
                  sx={{
                    ...(idx > 0 && cellGrooveSx),
                    p: { xs: 1.75, md: 2.25 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                    bgcolor: soft.wash,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.92rem', md: '1.02rem' },
                      color: soft.text,
                    }}
                  >
                    {t(`advantage.rows.${rowKey}.with`)}
                  </Typography>
                  {t(`advantage.rows.${rowKey}.badge`) && (
                    <TierBadge>{t(`advantage.rows.${rowKey}.badge`)}</TierBadge>
                  )}
                </Box>
              </Box>
            ))}
          </NeuPanel>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <Box
            sx={{
              ...inkSurfaceSx,
              borderRadius: `${radii.neuCard}px`,
              p: { xs: 3, md: 4 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              position: 'relative',
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: soft.onInk,
                  mb: 1,
                  '@media print': { color: soft.text },
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
                <Box component="span" sx={{ color: palette.gold }}>
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
                      color: palette.gold,
                      letterSpacing: '-0.02em',
                      '@media print': { color: soft.text },
                    }}
                  >
                    {t(`advantage.stats.${key}.value`)}
                  </Typography>
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: soft.white,
                        '@media print': { color: soft.text },
                      }}
                    >
                      {t(`advantage.stats.${key}.label`)}
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.78rem', color: soft.onInk, '@media print': { color: soft.text } }}
                    >
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
