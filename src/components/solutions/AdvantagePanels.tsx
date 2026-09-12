import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import type { Audience } from '../../lib/audience';
import { NeuPanel } from '../primitives/NeuPanel';
import { CheckWell } from '../primitives/CheckWell';
import { cellGrooveSx, eyebrowSx, inkSurfaceSx } from '../../theme/neu';
import { palette, radii, soft } from '../../theme/tokens';

/**
 * The "why they switch" band on every solution page: the legacy-vs-Fintela
 * table and the seat's summary panel beside it, from `solutions:<audience>.why`.
 *
 * Both describe what the workspace does for that seat, never how much it
 * changes an outcome: no durations, counts, rates or comparatives. A trading
 * platform's marketing page cannot substantiate "days instead of weeks" for
 * every desk, so the copy stays at the level of the capability itself.
 */

interface ComparisonRow {
  without: string;
  with: string;
}

interface SeatProps {
  audience: Audience;
}

export const ComparisonPanel = ({ audience }: SeatProps) => {
  const { t } = useTranslation('solutions');
  const rows = t(`${audience}.why.rows`, { returnObjects: true }) as ComparisonRow[];
  return (
    <NeuPanel sx={{ p: { xs: 1.5, md: 2 }, height: '100%' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1 }}>
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
          {t('common.why.legacyHeader')}
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
          <CheckWell size={20} /> {t('common.why.withFintelaHeader')}
        </Box>
      </Box>
      {rows.map((row, idx) => (
        <Box
          key={row.without}
          sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1 }}
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
            {row.without}
          </Typography>
          <Box
            sx={{
              ...(idx > 0 && cellGrooveSx),
              p: { xs: 1.75, md: 2.25 },
              display: 'flex',
              alignItems: 'center',
              bgcolor: soft.wash,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.9rem', md: '0.98rem' },
                lineHeight: 1.45,
                color: soft.text,
              }}
            >
              {row.with}
            </Typography>
          </Box>
        </Box>
      ))}
    </NeuPanel>
  );
};

export const SeatPanel = ({ audience }: SeatProps) => {
  const { t } = useTranslation('solutions');
  const points = t(`${audience}.why.panel.points`, { returnObjects: true }) as string[];
  return (
    <Box
      sx={{
        ...inkSurfaceSx,
        borderRadius: `${radii.neuCard}px`,
        p: { xs: 3, md: 4 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
      }}
    >
      <Box>
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
          {t(`${audience}.why.panel.eyebrow`)}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1.5rem', md: '1.85rem' },
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          {t(`${audience}.why.panel.before`)}{' '}
          <Box component="span" sx={{ color: palette.gold }}>
            {t(`${audience}.why.panel.highlight`)}
          </Box>{' '}
          {t(`${audience}.why.panel.after`)}
        </Typography>
      </Box>
      <Box
        component="ul"
        role="list"
        sx={{
          m: 0,
          p: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.25,
          mt: 'auto',
        }}
      >
        {points.map((point) => (
          <Box
            component="li"
            key={point}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
          >
            {/* On ink the check drops the paired neumorphic shadow: a plain wash pill, gold glyph. */}
            <Box
              aria-hidden
              sx={{
                width: 26,
                height: 26,
                flexShrink: 0,
                borderRadius: `${radii.pill}px`,
                bgcolor: soft.onInkWash,
                color: palette.gold,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& svg': { fontSize: 17 },
                '@media print': { color: soft.text },
              }}
            >
              <CheckRoundedIcon />
            </Box>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                color: soft.white,
                '@media print': { color: soft.text },
              }}
            >
              {point}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
