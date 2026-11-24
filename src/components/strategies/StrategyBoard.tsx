import { useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { eyebrowSx } from '../../theme/neu';
import { fonts, motion, palette, radii, shadows, soft } from '../../theme/tokens';
import { formatDate, formatPlain, formatSigned } from '../../strategies/format';
import { sortStrategies } from '../../strategies/ranking';
import type { RankedStrategy } from '../../strategies/ranking';
import { Sparkline } from './Sparkline';

/** The two figures a card shows, which are also the two ways to order the grid. */
const SORT_KEYS = ['totalReturn', 'sharpe'] as const;
type CardSortKey = (typeof SORT_KEYS)[number];

const focusSx = { '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 } } as const;

const figureSx = {
  fontFamily: fonts.mono,
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 500,
  fontSize: '1.375rem',
  letterSpacing: '-0.02em',
  lineHeight: 1.2,
} as const;

/** A row of mutually exclusive buttons in a sunken track. */
const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) => {
  const labelId = useId();
  return (
    <Box sx={{ display: 'grid', gap: 0.75, minWidth: 0, justifyItems: 'start' }}>
      <Typography component="span" id={labelId} sx={eyebrowSx}>
        {label}
      </Typography>
      <Box
        role="group"
        aria-labelledby={labelId}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px',
          p: '3px',
          bgcolor: soft.groundSunken,
          borderRadius: `${radii.neuInner}px`,
          boxShadow: shadows.neuInsetSm,
        }}
      >
        {options.map((option) => {
          const pressed = option.value === value;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              aria-pressed={pressed}
              onClick={() => onChange(option.value)}
              sx={{
                font: 'inherit',
                fontSize: '0.84rem',
                fontWeight: 600,
                border: 0,
                px: 1.5,
                minHeight: 34,
                borderRadius: `${radii.neuWell}px`,
                cursor: 'pointer',
                color: pressed ? soft.text : soft.textSecondary,
                bgcolor: pressed ? soft.surfaceRaised : 'transparent',
                boxShadow: pressed ? shadows.neuRaisedSm : 'none',
                transition: `color ${motion.fast}, background-color ${motion.fast}`,
                '@media (hover: hover)': { '&:hover': { color: soft.text } },
                ...focusSx,
              }}
            >
              {option.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const Figure = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
    <Typography component="dt" sx={eyebrowSx}>
      {label}
    </Typography>
    <Typography component="dd" sx={{ ...figureSx, m: 0, color: soft.text }}>
      {children}
    </Typography>
  </Box>
);

const Negative = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ color: palette.redDeep }}>
    {children}
  </Box>
);

/**
 * One strategy: its equity curve, return, Sharpe and author. Nothing else, by
 * design: the card is the record, and the record is these four.
 */
const StrategyCard = ({ strategy }: { strategy: RankedStrategy }) => {
  const { t } = useTranslation('pages');
  const totalReturn = formatSigned(strategy.totalReturn);
  const sharpe = formatPlain(strategy.sharpe);
  return (
    <Box
      component="li"
      aria-label={t('strategies.board.cardLabel', { author: strategy.author })}
      sx={{
        display: 'grid',
        gap: 2,
        alignContent: 'start',
        minWidth: 0,
        p: { xs: 2.25, md: 2.5 },
        bgcolor: soft.surfaceRaised,
        border: `1px solid ${palette.border}`,
        borderRadius: `${radii.neuCardSm}px`,
      }}
    >
      <Sparkline
        values={strategy.equity}
        label={t('strategies.board.curveLabel', { value: totalReturn })}
        width={280}
        height={72}
        fluid
      />
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
        <Figure label={t('strategies.board.columns.totalReturn')}>
          {strategy.totalReturn < 0 ? <Negative>{totalReturn}</Negative> : totalReturn}
        </Figure>
        <Figure label={t('strategies.board.columns.sharpe')}>{strategy.sharpe < 0 ? <Negative>{sharpe}</Negative> : sharpe}</Figure>
      </Box>
      <Typography
        sx={{ pt: 1.5, borderTop: `1px solid ${palette.border}`, fontSize: '0.85rem', color: soft.textSecondary, overflowWrap: 'anywhere' }}
      >
        {t('strategies.board.by', { author: strategy.author })}
      </Typography>
    </Box>
  );
};

/**
 * The Community board: a grid of strategy cards, ordered by return or Sharpe.
 * It receives ranked rows and owns only the sort, so it renders whatever
 * snapshot it is given.
 */
export const StrategyBoard = ({ strategies, asOf }: { strategies: RankedStrategy[]; asOf: string }) => {
  const { t } = useTranslation('pages');
  const [sortKey, setSortKey] = useState<CardSortKey>('totalReturn');
  const cards = useMemo(() => sortStrategies(strategies, sortKey, 'desc'), [strategies, sortKey]);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Segmented
        label={t('strategies.board.sortLabel')}
        options={SORT_KEYS.map((key) => ({ value: key, label: t(`strategies.board.columns.${key}`) }))}
        value={sortKey}
        onChange={setSortKey}
      />

      <Box
        component="ul"
        role="list"
        aria-label={t('strategies.board.caption')}
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: { xs: 2, md: 2.5 },
        }}
      >
        {cards.map((strategy) => (
          <StrategyCard key={strategy.id} strategy={strategy} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography sx={{ fontSize: '0.82rem', color: soft.textSecondary }}>
          {t('strategies.board.count', { total: strategies.length, date: formatDate(asOf) })}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.6, color: soft.textSecondary, maxWidth: '96ch' }}>
          {t('strategies.board.footnote')}
        </Typography>
      </Box>
    </Box>
  );
};
