import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { eyebrowSx, wellSx } from '../../theme/neu';
import { fonts, palette, radii, soft } from '../../theme/tokens';
import { DATA_LIBRARY } from '../../data/dataLibrary';
import type { Freshness } from '../../data/dataLibrary';

const FRESHNESS_TONE: Record<Freshness['kind'], string> = {
  today: palette.success,
  days: palette.warning,
  date: palette.warning,
  none: soft.textSecondary,
};

const FreshnessTag = ({ freshness }: { freshness: Freshness }) => {
  const { t } = useTranslation('pages');
  const label =
    freshness.kind === 'today'
      ? t('inDepthAnalysis.library.freshness.today')
      : freshness.kind === 'days'
        ? t('inDepthAnalysis.library.freshness.daysAgo', { count: freshness.days })
        : freshness.kind === 'date'
          ? freshness.date
          : t('inDepthAnalysis.library.freshness.none');

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        aria-hidden
        sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: FRESHNESS_TONE[freshness.kind], flexShrink: 0 }}
      />
      <Typography
        component="span"
        sx={{ fontFamily: fonts.mono, fontSize: '0.7rem', fontWeight: 700, color: soft.text }}
      >
        {label}
      </Typography>
    </Box>
  );
};

const DatasetCard = ({ categoryId, id, rows, window: win }: {
  categoryId: string;
  id: string;
  rows: string | null;
  window: string | null;
}) => {
  const { t } = useTranslation('pages');
  const base = `inDepthAnalysis.library.datasets.${id}`;
  const tag = t(`${base}.tag`, { defaultValue: '' });
  const freshness = DATA_LIBRARY.find((c) => c.id === categoryId)!.datasets.find((d) => d.id === id)!.freshness;

  return (
    <NeuPanel
      variant="tile"
      sx={{ p: { xs: 2.25, md: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25, height: '100%' }}
    >
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: soft.text, letterSpacing: '-0.005em' }}>
          {t(`${base}.name`)}
          {tag && (
            <Typography component="span" sx={{ ml: 0.75, fontSize: '0.7rem', fontWeight: 500, color: soft.textSecondary }}>
              ({tag})
            </Typography>
          )}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.83rem', color: soft.textSecondary, lineHeight: 1.55, flexGrow: 1 }}>
        {t(`${base}.desc`)}
      </Typography>

      <Box sx={{ pt: 1.25, borderTop: `1px solid ${palette.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <Box>
          <Typography sx={{ ...eyebrowSx, fontSize: '0.6rem', mb: 0.25 }}>
            {t('inDepthAnalysis.library.meta.rows')}
          </Typography>
          <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.78rem', fontWeight: 600, color: soft.text }}>
            {rows ?? '—'}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ ...eyebrowSx, fontSize: '0.6rem', mb: 0.25 }}>
            {t('inDepthAnalysis.library.meta.updated')}
          </Typography>
          <FreshnessTag freshness={freshness} />
        </Box>
        {win && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography sx={{ ...eyebrowSx, fontSize: '0.6rem', mb: 0.25 }}>
              {t('inDepthAnalysis.library.meta.window')}
            </Typography>
            <Typography sx={{ fontFamily: fonts.mono, fontSize: '0.76rem', fontWeight: 600, color: soft.text }}>
              {win}
            </Typography>
          </Box>
        )}
      </Box>
    </NeuPanel>
  );
};

/**
 * The Data Library: every dataset the platform reads from, grouped into the
 * same categories a study's injectable configuration uses.
 */
export const DataLibrarySection = () => {
  const { t } = useTranslation('pages');

  return (
    <Section size="lg" tone="soft">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 5, md: 6 } }}>
        {DATA_LIBRARY.map((category, catIndex) => (
          <Box key={category.id}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2.5 }}>
              <Box
                aria-hidden
                sx={{
                  ...wellSx('sm'),
                  width: 26,
                  height: 26,
                  borderRadius: `${radii.neuWell}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.mono,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: soft.textSecondary,
                  flexShrink: 0,
                }}
              >
                {catIndex + 1}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.01em', color: soft.text }}>
                {t(`inDepthAnalysis.library.categories.${category.id}.title`)}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: soft.textSecondary }}>
                {category.datasets.length}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 2, md: 2.5 },
              }}
            >
              {category.datasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  categoryId={category.id}
                  id={dataset.id}
                  rows={dataset.rows}
                  window={dataset.window}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
};
