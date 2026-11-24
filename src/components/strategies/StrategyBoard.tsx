import { useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { eyebrowSx, neuFieldSx, srOnly } from '../../theme/neu';
import { fonts, motion, palette, radii, shadows, soft } from '../../theme/tokens';
import { formatDate, formatPlain, formatSigned } from '../../strategies/format';
import { filterStrategies, sortStrategies } from '../../strategies/ranking';
import type { BoardFilters, RankedStrategy, SortDir, SortKey } from '../../strategies/ranking';
import { ASSET_CLASSES } from '../../strategies/types';
import type { AssetClass, StrategyStage } from '../../strategies/types';
import { Sparkline } from './Sparkline';
import { useAge } from './useAge';

/** The sortable metric columns, in display order. */
const METRIC_COLUMNS: SortKey[] = ['totalReturn', 'cagr', 'sharpe', 'alpha', 'beta', 'maxDrawdown', 'daysLive', 'score'];
/** The "Rank by" shortcuts: each sorts its column best-first. */
const RANK_OPTIONS: SortKey[] = ['totalReturn', 'cagr', 'sharpe', 'alpha', 'daysLive', 'score'];
const STAGE_OPTIONS: Array<StrategyStage | 'all'> = ['all', 'live', 'paper'];
const AGE_OPTIONS = [
  { days: 0, key: 'anyLength' },
  { days: 90, key: 'months3' },
  { days: 180, key: 'months6' },
  { days: 365, key: 'year1' },
] as const;

const HAIRLINE = `1px solid ${palette.border}`;
const focusSx = { '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 } } as const;

const chipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.6,
  px: 0.9,
  py: 0.25,
  borderRadius: `${radii.pill}px`,
  fontFamily: fonts.sans,
  fontSize: '0.69rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
  color: soft.textSecondary,
  bgcolor: soft.surfaceRaised,
  boxShadow: `inset 0 0 0 1px ${palette.borderStrong}`,
} as const;

const Dot = ({ filled }: { filled: boolean }) => (
  <Box
    aria-hidden
    sx={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      ...(filled ? { bgcolor: palette.success } : { boxShadow: `inset 0 0 0 1.5px ${palette.textSubtle}` }),
    }}
  />
);

/** A row of mutually exclusive buttons in a sunken track. */
const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
}) => {
  const labelId = useId();
  return (
    <Box sx={{ display: 'grid', gap: 0.75, minWidth: 0 }}>
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

const fieldSx = {
  ...neuFieldSx,
  font: 'inherit',
  fontSize: '0.875rem',
  height: 40,
  px: 1.5,
  maxWidth: '100%',
} as const;

const Field = ({ label, id, children, grow }: { label: string; id: string; children: ReactNode; grow?: boolean }) => (
  <Box sx={{ display: 'grid', gap: 0.75, minWidth: 0, ...(grow && { ml: { md: 'auto' }, width: { xs: '100%', md: 'auto' } }) }}>
    <Typography component="label" htmlFor={id} sx={eyebrowSx}>
      {label}
    </Typography>
    {children}
  </Box>
);

const Missing = () => (
  <Box component="span" aria-hidden sx={{ color: palette.textSubtle }}>
    –
  </Box>
);

const Negative = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ color: palette.redDeep }}>
    {children}
  </Box>
);

/**
 * The public strategies board: a "Rank by" shortcut row, four filters and one
 * sortable table. It receives ranked rows and owns only view state (sort and
 * filters), so it renders whatever snapshot it is given.
 */
export const StrategyBoard = ({ strategies, asOf }: { strategies: RankedStrategy[]; asOf: string }) => {
  const { t } = useTranslation('pages');
  const age = useAge();
  const ids = { age: useId(), asset: useId(), search: useId() };
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'totalReturn', dir: 'desc' });
  const [filters, setFilters] = useState<BoardFilters>({ stage: 'all', minDays: 0, assetClass: 'all', query: '' });

  const rows = useMemo(
    () => sortStrategies(filterStrategies(strategies, filters), sort.key, sort.dir),
    [strategies, filters, sort],
  );

  const toggleSort = (key: SortKey) =>
    setSort((current) => (current.key === key ? { key, dir: current.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));

  const metric = (strategy: RankedStrategy, key: SortKey): ReactNode => {
    const signed = (value: number) => (value < 0 ? <Negative>{formatSigned(value)}</Negative> : formatSigned(value));
    switch (key) {
      case 'totalReturn':
        return signed(strategy.totalReturn);
      case 'cagr':
        return strategy.cagr === null ? <Missing /> : signed(strategy.cagr);
      case 'alpha':
        return strategy.alpha === null ? <Missing /> : signed(strategy.alpha);
      case 'sharpe':
        return strategy.sharpe < 0 ? <Negative>{formatPlain(strategy.sharpe)}</Negative> : formatPlain(strategy.sharpe);
      case 'beta':
        // Beta describes exposure, not quality, so it is never coloured.
        return strategy.beta === null ? (
          <Missing />
        ) : (
          <Box component="span" sx={{ color: soft.textSecondary }}>
            {formatPlain(strategy.beta)}
          </Box>
        );
      case 'maxDrawdown':
        return strategy.maxDrawdown < 0 ? <Negative>{formatPlain(strategy.maxDrawdown, 1, '%')}</Negative> : formatPlain(strategy.maxDrawdown, 1, '%');
      case 'daysLive':
        return age(strategy.daysLive);
      case 'score':
        return strategy.score === null ? (
          <Missing />
        ) : (
          <>
            <Box
              aria-hidden
              sx={{
                display: 'inline-block',
                verticalAlign: 'middle',
                width: 44,
                height: 4,
                mr: 1,
                borderRadius: '2px',
                bgcolor: soft.groundSunken,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ width: `${strategy.score}%`, height: '100%', bgcolor: soft.text, borderRadius: '2px' }} />
            </Box>
            {strategy.score}
          </>
        );
    }
  };

  const headSx = {
    py: 1.25,
    px: 1.25,
    borderBottom: `1px solid ${soft.text}`,
    fontFamily: fonts.sans,
    fontSize: '0.69rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    color: soft.textSecondary,
    textAlign: 'right',
  } as const;
  const cellSx = {
    py: 1.6,
    px: 1.25,
    borderBottom: HAIRLINE,
    fontFamily: fonts.mono,
    fontVariantNumeric: 'tabular-nums',
    fontSize: '0.9rem',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    color: soft.text,
  } as const;

  let rank = 0;

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 2.5, rowGap: 1.75 }}>
        <Segmented
          label={t('strategies.board.rankBy')}
          options={RANK_OPTIONS.map((key) => ({ value: key, label: t(`strategies.board.rankOptions.${key}`) }))}
          value={sort.dir === 'desc' && RANK_OPTIONS.includes(sort.key) ? sort.key : null}
          onChange={(key) => setSort({ key, dir: 'desc' })}
        />
        <Segmented
          label={t('strategies.board.filters.trackRecord')}
          options={STAGE_OPTIONS.map((stage) => ({ value: stage, label: t(`strategies.board.filters.${stage}`) }))}
          value={filters.stage}
          onChange={(stage) => setFilters((current) => ({ ...current, stage }))}
        />
        <Field label={t('strategies.board.filters.publishedFor')} id={ids.age}>
          <Box
            component="select"
            id={ids.age}
            value={filters.minDays}
            onChange={(event) => setFilters((current) => ({ ...current, minDays: Number(event.target.value) }))}
            sx={fieldSx}
          >
            {AGE_OPTIONS.map((option) => (
              <option key={option.days} value={option.days}>
                {t(`strategies.board.filters.${option.key}`)}
              </option>
            ))}
          </Box>
        </Field>
        <Field label={t('strategies.board.filters.assetClass')} id={ids.asset}>
          <Box
            component="select"
            id={ids.asset}
            value={filters.assetClass}
            onChange={(event) => setFilters((current) => ({ ...current, assetClass: event.target.value as AssetClass | 'all' }))}
            sx={fieldSx}
          >
            <option value="all">{t('strategies.board.filters.all')}</option>
            {ASSET_CLASSES.map((asset) => (
              <option key={asset} value={asset}>
                {t(`strategies.board.assets.${asset}`)}
              </option>
            ))}
          </Box>
        </Field>
        <Field label={t('strategies.board.filters.search')} id={ids.search} grow>
          <Box
            component="input"
            type="search"
            id={ids.search}
            autoComplete="off"
            placeholder={t('strategies.board.filters.searchPlaceholder')}
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            sx={{ ...fieldSx, width: { xs: '100%', md: 210 } }}
          />
        </Field>
      </Box>

      {/* The table is the one element allowed to be wider than a phone: it scrolls inside its own container. */}
      <Box sx={{ overflowX: 'auto', ...focusSx }} tabIndex={0} role="region" aria-label={t('strategies.board.caption')}>
        <Box component="table" sx={{ width: '100%', minWidth: 1010, borderCollapse: 'collapse' }}>
          <Box component="caption" sx={srOnly}>
            {t('strategies.board.caption')}
          </Box>
          <thead>
            <tr>
              <Box component="th" scope="col" sx={{ ...headSx, textAlign: 'left', width: 52 }}>
                {t('strategies.board.columns.rank')}
              </Box>
              <Box component="th" scope="col" sx={{ ...headSx, textAlign: 'left' }}>
                {t('strategies.board.columns.strategy')}
              </Box>
              <Box component="th" scope="col" sx={{ ...headSx, textAlign: 'left' }}>
                {t('strategies.board.columns.curve')}
              </Box>
              {METRIC_COLUMNS.map((key) => {
                const active = sort.key === key;
                const column = t(`strategies.board.columns.${key}`);
                return (
                  <Box
                    component="th"
                    scope="col"
                    key={key}
                    aria-sort={active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : undefined}
                    sx={{ ...headSx, p: 0 }}
                  >
                    <Box
                      component="button"
                      type="button"
                      onClick={() => toggleSort(key)}
                      title={t('strategies.board.sortBy', { column })}
                      sx={{
                        font: 'inherit',
                        letterSpacing: 'inherit',
                        textTransform: 'inherit',
                        color: active ? soft.text : 'inherit',
                        background: 'none',
                        border: 0,
                        cursor: 'pointer',
                        py: 1.25,
                        px: 1.25,
                        width: '100%',
                        textAlign: 'right',
                        transition: `color ${motion.fast}`,
                        '@media (hover: hover)': { '&:hover': { color: soft.text } },
                        '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: -2 },
                      }}
                    >
                      {column}
                      <Box component="span" aria-hidden sx={{ display: 'inline-block', width: 12, fontFamily: fonts.mono, letterSpacing: 0 }}>
                        {active ? (sort.dir === 'desc' ? '↓' : '↑') : ''}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <Box component="td" colSpan={3 + METRIC_COLUMNS.length} sx={{ py: 5, px: 1.25, textAlign: 'center', color: soft.textSecondary }}>
                  {t('strategies.board.empty')}
                </Box>
              </tr>
            )}
            {rows.map((strategy) => {
              if (!strategy.isNew) rank++;
              return (
                <Box component="tr" key={strategy.id} sx={{ '@media (hover: hover)': { '&:hover td': { bgcolor: 'rgba(18,20,26,0.02)' } } }}>
                  <Box
                    component="td"
                    sx={{ ...cellSx, textAlign: 'left', color: !strategy.isNew && rank <= 3 ? soft.text : soft.textSecondary, fontWeight: !strategy.isNew && rank <= 3 ? 500 : 400 }}
                  >
                    {strategy.isNew ? (
                      <Box component="span" sx={{ ...chipSx, color: palette.markPlumDeep }}>
                        {t('strategies.board.chips.new')}
                      </Box>
                    ) : (
                      rank
                    )}
                  </Box>
                  <Box component="th" scope="row" sx={{ ...cellSx, fontFamily: fonts.sans, fontWeight: 400, textAlign: 'left', whiteSpace: 'normal', minWidth: 240 }}>
                    <Box component="span" sx={{ display: 'block', fontWeight: 600, letterSpacing: '-0.01em' }}>
                      {strategy.name}
                    </Box>
                    <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1, rowGap: 0.5, mt: 0.5 }}>
                      <Box component="span" sx={{ ...chipSx, ...(strategy.stage === 'live' && { color: soft.text }) }}>
                        <Dot filled={strategy.stage === 'live'} />
                        {t(`strategies.board.chips.${strategy.stage}`)}
                      </Box>
                      {strategy.holdoutPassed && (
                        <Box component="span" sx={{ ...chipSx, color: palette.markBlueDeep }}>
                          {t('strategies.board.chips.holdout')}
                        </Box>
                      )}
                      {strategy.funding && (
                        <Box
                          component="span"
                          sx={{ ...chipSx, ...(strategy.funding === 'funded' && { bgcolor: soft.accent, color: soft.white, boxShadow: 'none' }) }}
                        >
                          {t(`strategies.board.chips.${strategy.funding}`)}
                        </Box>
                      )}
                      <Box component="span" sx={{ fontSize: '0.78rem', color: soft.textSecondary }}>
                        {strategy.author} · {t(`strategies.board.assets.${strategy.assetClass}`)}
                      </Box>
                    </Box>
                  </Box>
                  <Box component="td" sx={{ ...cellSx, textAlign: 'left' }}>
                    <Sparkline values={strategy.equity} label={t('strategies.board.curveLabel', { value: formatSigned(strategy.totalReturn) })} />
                  </Box>
                  {METRIC_COLUMNS.map((key) => (
                    <Box
                      component="td"
                      key={key}
                      sx={{ ...cellSx, ...(sort.key === key && { fontWeight: 500, '&&': { bgcolor: 'rgba(18,20,26,0.04)' } }) }}
                    >
                      {metric(strategy, key)}
                    </Box>
                  ))}
                </Box>
              );
            })}
          </tbody>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 1 }}>
        <Typography aria-live="polite" sx={{ fontSize: '0.82rem', color: soft.textSecondary }}>
          {t('strategies.board.count', { shown: rows.length, total: strategies.length, date: formatDate(asOf) })}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.6, color: soft.textSecondary, maxWidth: '96ch' }}>
          {t('strategies.board.footnote')}
        </Typography>
      </Box>
    </Box>
  );
};
