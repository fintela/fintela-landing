import { memo } from 'react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { APP } from '../fintelligentDemo/appTheme';
import { groupDigits } from '../../lib/groupDigits';
import { SECTOR_ETFS } from './stations';
import type { StationKey } from './stations';

/**
 * The app surface each station hands the visitor: a small, faithful piece of
 * the product (app.fintela.io's own light theme, as in the Fintelligent
 * demo), showing what the step produces — the asset group, the strategy
 * code, the running study, the ranked portfolios, the live order log.
 * Tickers, parameter names, sampler names and code are the product's own
 * and stay English; the figures are illustrative.
 */

const S = 'workflow.line.surface';

const Chip = ({ children }: { children: ReactNode }) => (
  <Box
    component="span"
    sx={{ height: 22, px: 1, borderRadius: '8px', background: APP.well, fontSize: 11, fontWeight: 600, color: APP.textSecondary, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}
  >
    {children}
  </Box>
);

const Raised = ({ children, color = APP.navy }: { children: ReactNode; color?: string }) => (
  <Box
    component="span"
    sx={{ height: 28, px: 1.5, borderRadius: '10px', background: APP.paper, boxShadow: APP.shadow.raisedXs, fontSize: 12, fontWeight: 700, color, display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}
  >
    {children}
  </Box>
);

const Head = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25, mb: 1.75 }}>{children}</Box>
);

const Title = ({ children, mono = false }: { children: ReactNode; mono?: boolean }) => (
  <Box component="span" sx={{ fontSize: 16, fontWeight: 700, fontFamily: mono ? APP.mono : undefined }}>
    {children}
  </Box>
);

const AssetGroup = () => {
  const { t } = useTranslation('home');
  return (
    <>
      <Head>
        <Title>Sector ETFs (US)</Title>
        <Chip>{t(`${S}.tickers`, { n: SECTOR_ETFS.length })}</Chip>
        <Box component="span" sx={{ ml: 'auto', fontSize: 12, color: APP.textDisabled }}>
          {t(`${S}.snapshot`)}
        </Box>
      </Head>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 1 }}>
        {SECTOR_ETFS.map((etf) => (
          <Box key={etf.t} sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 34, px: 1.25, borderRadius: '10px', background: '#f5f7f9', fontSize: 12, minWidth: 0 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', background: etf.c, flexShrink: 0 }} />
            <Box component="span" sx={{ fontFamily: APP.mono, fontWeight: 700 }}>
              {etf.t}
            </Box>
            <Box component="span" sx={{ color: APP.textDisabled, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {etf.s}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};

const Kw = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ color: APP.code.keyword }}>
    {children}
  </Box>
);
const Num = ({ children }: { children: ReactNode }) => (
  <Box component="span" sx={{ color: APP.code.number }}>
    {children}
  </Box>
);

const Strategy = () => {
  const { t } = useTranslation('home');
  return (
    <>
      <Head>
        <Title mono>sector_momentum</Title>
        <Chip>{t(`${S}.validated`)}</Chip>
      </Head>
      <Box
        component="pre"
        sx={{ m: 0, borderRadius: '12px', background: '#fafbfc', border: '1px solid #e2e5e9', p: '12px 14px', fontFamily: APP.mono, fontSize: 12.5, lineHeight: 1.7, overflowX: 'auto', color: APP.text }}
      >
        <Kw>def</Kw> <Box component="span" sx={{ color: APP.code.fn }}>sector_momentum</Box>(data, start_date, end_date, lookback, top_n):{'\n'}
        {'    '}window = data.close.iloc[-lookback:]{'\n'}
        {'    '}leaders = (window.iloc[-<Num>1</Num>] / window.iloc[<Num>0</Num>] - <Num>1</Num>).nlargest(top_n){'\n'}
        {'    '}
        <Box component="span" sx={{ color: APP.code.comment, fontStyle: 'italic' }}>
          # {t(`${S}.codeComment`)}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
        {[
          ['lookback', '21–378'],
          ['top_n', '1–6'],
        ].map(([name, range]) => (
          <Raised key={name}>
            <Box component="span" sx={{ fontFamily: APP.mono }}>
              {name}
            </Box>
            <Box component="span" sx={{ color: APP.textDisabled, fontWeight: 600 }}>
              {`${t(`${S}.integer`)} · ${range}`}
            </Box>
          </Raised>
        ))}
      </Box>
    </>
  );
};

/** The note every surface with a result carries: these numbers are an example, not a track record. */
const Illustrative = () => {
  const { t } = useTranslation('home');
  return <Box sx={{ mt: 1.5, fontSize: 11, color: APP.textDisabled }}>{t(`${S}.illustrative`)}</Box>;
};

/** Train / validation / out-of-sample as the app splits a window by default: 70% of what is not held out, then 10% held out. */
const SPLIT = [
  [63, APP.navy, 'train'],
  [27, APP.navyLight, 'validation'],
  [10, APP.warning, 'oos'],
] as const;

/**
 * The running study; its trial count advances with the station's progress.
 * It never shows a "best" score: while trials run there is nothing to judge,
 * and once they finish the judgement is the overfitting check, not the top
 * number.
 */
const Study = ({ progress }: { progress: number }) => {
  const { t, i18n } = useTranslation('home');
  const p = 1 - (1 - progress) ** 2;
  const tiles = [
    [t(`${S}.sampler`), 'TPE'],
    [t(`${S}.trials`), `${groupDigits(p * 1000, i18n.language)} / ${groupDigits(1000, i18n.language)}`],
    [t(`${S}.overfitCheck`), t(p < 1 ? `${S}.pending` : `${S}.ready`)],
  ];
  return (
    <>
      <Head>
        <Title>Momentum · Sector ETFs (US)</Title>
        <Box
          component="span"
          sx={{ height: 22, px: 1, borderRadius: '6px', background: `${APP.warning}1f`, color: APP.warning, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
        >
          <Box component="span" className="alPulse" sx={{ width: 6, height: 6, borderRadius: '50%', background: APP.warning }} />
          {t(`${S}.running`)}
        </Box>
      </Head>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mb: 1.75 }}>
        {tiles.map(([label, value], i) => (
          <Box
            key={label}
            // On a phone the trials count takes a row of its own rather than truncating.
            sx={{ p: '10px 12px', borderRadius: '12px', background: '#f5f7f9', minWidth: 0, gridColumn: i === 1 ? { xs: '1 / -1', sm: 'auto' } : 'auto', order: i === 1 ? { xs: 3, sm: 0 } : 0 }}
          >
            <Box sx={{ fontSize: 11, color: APP.textSecondary, fontWeight: 600 }}>{label}</Box>
            <Box sx={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Box>
          </Box>
        ))}
      </Box>
      <Box aria-hidden sx={{ display: 'flex', height: 10, borderRadius: '5px', overflow: 'hidden' }}>
        {SPLIT.map(([share, bg, key]) => (
          <Box key={key} sx={{ flexGrow: share, flexBasis: 0, background: bg }} />
        ))}
      </Box>
      <Box component="ul" role="list" sx={{ listStyle: 'none', m: 0, mt: 1, p: 0, display: 'flex', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, fontSize: 11, fontWeight: 600, color: APP.textSecondary }}>
        {SPLIT.map(([share, bg, key]) => (
          <Box component="li" key={key} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
            <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: '2px', background: bg }} />
            {`${t(`${S}.${key}`)} ${share}%`}
          </Box>
        ))}
      </Box>
    </>
  );
};

type VerdictKey = 'overfitRisk' | 'wellTrained' | 'borderline';

const VERDICT_COLOR: Record<VerdictKey, string> = {
  overfitRisk: APP.error,
  wellTrained: APP.success,
  borderline: APP.warning,
};

/**
 * The candidates in the order the search ranks them (in sample), each with
 * what happened out of sample and the verdict that follows from it. The top
 * in-sample trial is the one that falls apart: ranking by the best backtest
 * alone is how a search fools its user.
 */
const CANDIDATES: ReadonlyArray<readonly [string, string, string, string, string, VerdictKey]> = [
  ['#1', 'lookback 126 · top_n 3', '0,18 20,12 40,6 60,3 80,8 100,13 120,17', '1.84', '0.41', 'overfitRisk'],
  ['#2', 'lookback 147 · top_n 3', '0,18 20,16 40,14 60,12 80,11 100,8 120,6', '1.77', '1.12', 'wellTrained'],
  ['#3', 'lookback 105 · top_n 4', '0,17 20,17 40,13 60,13 80,10 100,9 120,7', '1.71', '1.05', 'wellTrained'],
  ['#4', 'lookback 189 · top_n 2', '0,19 20,16 40,17 60,13 80,12 100,12 120,11', '1.66', '0.78', 'borderline'],
];

const CANDIDATE_COLUMNS = { xs: '24px minmax(0, 1fr) 58px 58px', sm: '24px minmax(0, 1fr) 72px 62px 62px 104px' } as const;

const Portfolios = () => {
  const { t, i18n } = useTranslation('home');
  const numeric = { fontVariantNumeric: 'tabular-nums', textAlign: 'right' } as const;
  return (
    <>
      <Head>
        <Title>{t(`${S}.ranked`)}</Title>
        <Chip>{t(`${S}.ofTrials`, { n: groupDigits(1000, i18n.language) })}</Chip>
        <Box sx={{ ml: 'auto' }}>
          <Raised>{t(`${S}.exportPdf`)}</Raised>
        </Box>
      </Head>
      <Box sx={{ display: 'grid', gridTemplateColumns: CANDIDATE_COLUMNS, gap: 1.25, px: 1, mb: 0.5, fontSize: 10.5, fontWeight: 700, color: APP.textDisabled, whiteSpace: 'nowrap' }}>
        <span />
        <span />
        <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Box component="span" sx={numeric}>{t(`${S}.inSample`)}</Box>
        <Box component="span" sx={numeric}>{t(`${S}.outOfSample`)}</Box>
        <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>{t(`${S}.verdict`)}</Box>
      </Box>
      {CANDIDATES.map(([rank, params, curve, inSample, outOfSample, verdict]) => (
        <Box
          key={rank}
          sx={{
            display: 'grid',
            gridTemplateColumns: CANDIDATE_COLUMNS,
            gap: 1.25,
            alignItems: 'center',
            height: 36,
            px: 1,
            borderRadius: '8px',
            fontSize: 13,
          }}
        >
          <Box component="span" sx={{ fontFamily: APP.mono, color: APP.textDisabled }}>
            {rank}
          </Box>
          <Box component="span" sx={{ fontFamily: APP.mono, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params}
          </Box>
          <Box component="svg" viewBox="0 0 120 22" aria-hidden sx={{ width: 72, height: 22, display: { xs: 'none', sm: 'block' } }}>
            <polyline points={curve} fill="none" stroke={VERDICT_COLOR[verdict]} strokeWidth="2" />
          </Box>
          <Box component="span" sx={{ ...numeric, color: APP.textSecondary }}>
            {inSample}
          </Box>
          <Box component="span" sx={{ ...numeric, fontWeight: 800 }}>
            {outOfSample}
          </Box>
          <Box
            component="span"
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, alignItems: 'center', gap: 0.75, fontSize: 11.5, fontWeight: 700, color: VERDICT_COLOR[verdict], whiteSpace: 'nowrap' }}
          >
            <Box component="span" aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            {t(`${S}.verdicts.${verdict}`)}
          </Box>
        </Box>
      ))}
      <Illustrative />
    </>
  );
};

const ORDERS = [
  ['09:31:02', 'buy', 'XLK', '120'],
  ['09:31:02', 'buy', 'XLE', '310'],
  ['09:31:03', 'sell', 'XLU', '275'],
] as const;

const Broker = () => {
  const { t } = useTranslation('home');
  return (
    <>
      <Head>
        <Box component="span" className="alPulse" sx={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
        <Title>{t(`${S}.connected`)}</Title>
        <Box sx={{ ml: 'auto' }}>
          <Raised color={APP.error}>{t(`${S}.pause`)}</Raised>
        </Box>
      </Head>
      {ORDERS.map(([time, side, ticker, qty], i) => (
        <Box
          key={i}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '62px 44px 48px minmax(0, 1fr)', sm: '72px 56px 64px minmax(0, 1fr) 90px' },
            gap: 1.25,
            alignItems: 'center',
            height: 34,
            px: 1.25,
            borderBottom: '1px solid #eef0f3',
            fontSize: 12.5,
            fontFamily: APP.mono,
          }}
        >
          <Box component="span" sx={{ color: APP.textDisabled }}>
            {time}
          </Box>
          <Box component="span" sx={{ fontWeight: 700, color: side === 'buy' ? APP.success : APP.error }}>
            {t(`${S}.${side}`)}
          </Box>
          <Box component="span" sx={{ fontWeight: 700 }}>
            {ticker}
          </Box>
          <Box component="span" sx={{ color: APP.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {t(`${S}.atMarket`, { qty })}
          </Box>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', color: APP.success, fontWeight: 600 }}>
            {t(`${S}.filled`)}
          </Box>
        </Box>
      ))}
    </>
  );
};

export const StationSurface = memo(({ station, progress }: { station: StationKey; progress: number }) => (
  <Box sx={{ color: APP.text, fontFamily: APP.font }}>
    {station === 'dataClusters' && <AssetGroup />}
    {station === 'strategies' && <Strategy />}
    {station === 'studies' && <Study progress={progress} />}
    {station === 'portfolios' && <Portfolios />}
    {station === 'connectBroker' && <Broker />}
  </Box>
));
StationSurface.displayName = 'StationSurface';
