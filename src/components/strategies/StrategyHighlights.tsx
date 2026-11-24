import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { eyebrowSx } from '../../theme/neu';
import { fonts, radii, soft } from '../../theme/tokens';
import type { Activity } from '../../strategies/ranking';

const figureSx = { fontFamily: fonts.mono, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', fontWeight: 500 } as const;

/** The counts that show movement on the platform at a glance. */
export const ActivityStrip = ({ activity }: { activity: Activity }) => {
  const { t } = useTranslation('pages');
  const items: Array<[number, string]> = [
    [activity.published, t('strategies.activity.published')],
    [activity.publishedThisYear, t('strategies.activity.thisYear', { year: activity.year })],
    [activity.live, t('strategies.activity.live')],
  ];
  // The backend's board carries no funding status yet: the count appears only when there is one to show.
  if (activity.funded + activity.inReview > 0) {
    items.push([activity.funded, t('strategies.activity.funded', { review: activity.inReview })]);
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 4.5,
        rowGap: 1.25,
        px: 2.25,
        py: 1.75,
        bgcolor: soft.groundSunken,
        borderRadius: `${radii.neuInner}px`,
      }}
    >
      <Typography component="span" sx={eyebrowSx}>
        {t('strategies.activity.label')}
      </Typography>
      <Box component="ul" role="list" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', columnGap: 4.5, rowGap: 1 }}>
        {items.map(([count, label]) => (
          <Box component="li" key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography component="span" sx={{ ...figureSx, fontSize: '1.25rem', color: soft.text }}>
              {count}
            </Typography>
            <Typography component="span" sx={{ fontSize: '0.85rem', color: soft.textSecondary }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

