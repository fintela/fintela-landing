import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { eyebrowSx } from '../../theme/neu';
import { fonts, radii, soft } from '../../theme/tokens';
import { formatPlain, formatSigned } from '../../strategies/format';
import type { Activity, Leaders, RankedStrategy } from '../../strategies/ranking';
import { useAge } from './useAge';

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

/**
 * Top return, best Sharpe, best newcomer and longest live: a way for newer and
 * steadier strategies to be seen without changing the ranking.
 */
export const LeadersStrip = ({ leaders }: { leaders: Leaders }) => {
  const { t } = useTranslation('pages');
  const age = useAge();
  const cards: Array<{ key: keyof Leaders; value: (s: RankedStrategy) => string; sub: (s: RankedStrategy) => string }> = [
    { key: 'topReturn', value: (s) => formatSigned(s.totalReturn), sub: (s) => t('strategies.leaders.topReturn.sub', { age: age(s.daysLive) }) },
    {
      key: 'bestSharpe',
      value: (s) => formatPlain(s.sharpe),
      sub: (s) => t('strategies.leaders.bestSharpe.sub', { value: formatPlain(s.maxDrawdown, 1, '%') }),
    },
    {
      key: 'bestNewcomer',
      value: (s) => formatSigned(s.totalReturn),
      sub: (s) => t('strategies.leaders.bestNewcomer.sub', { age: age(s.daysLive) }),
    },
    {
      key: 'longestLive',
      value: (s) => age(s.daysLive),
      sub: (s) => t('strategies.leaders.longestLive.sub', { value: formatSigned(s.totalReturn) }),
    },
  ];
  const shown = cards.filter((card) => leaders[card.key]);
  if (!shown.length) return null;
  return (
    <Box
      component="ul"
      role="list"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${shown.length}, minmax(0, 1fr))` },
        columnGap: { sm: 4, lg: 5 },
        rowGap: 3,
      }}
    >
      {shown.map((card) => {
        const strategy = leaders[card.key] as RankedStrategy;
        return (
          <Box component="li" key={card.key} sx={{ borderTop: `1px solid ${soft.text}`, pt: 1.75, display: 'grid', gap: 0.5, minWidth: 0 }}>
            <Typography component="span" sx={eyebrowSx}>
              {t(`strategies.leaders.${card.key}.label`)}
            </Typography>
            <Typography component="span" sx={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em', color: soft.text, overflowWrap: 'anywhere' }}>
              {strategy.name}
            </Typography>
            <Typography component="span" sx={{ ...figureSx, fontSize: '1.375rem', color: soft.text }}>
              {card.value(strategy)}
            </Typography>
            <Typography component="span" sx={{ fontSize: '0.82rem', color: soft.textSecondary }}>
              {card.sub(strategy)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};
