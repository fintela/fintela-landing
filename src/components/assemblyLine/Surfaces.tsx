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

/** The running study; its trial count and best score advance with the station's progress. */
const Study = ({ progress }: { progress: number }) => {
  const { t, i18n } = useTranslation('home');
  const p = 1 - (1 - progress) ** 2;
  const tiles = [
    [t(`${S}.sampler`), 'TPE'],
    [t(`${S}.trials`), `${groupDigits(p * 1000, i18n.language)} / ${groupDigits(1000, i18n.language)}`],
    [t(`${S}.bestSharpe`), (0.9 + p * 0.94).toFixed(2)],
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
      <Box sx={{ display: 'flex', height: 26, borderRadius: '8px', overflow: 'hidden', fontSize: 11, fontWeight: 700, color: '#fff' }}>
        {[
          [6, APP.navy, t(`${S}.train`)],
          [2, APP.navyLight, t(`${S}.validation`)],
          [2, APP.warning, t(`${S}.oos`)],
        ].map(([grow, bg, label]) => (
          <Box key={String(label)} sx={{ flexGrow: Number(grow), flexBasis: 0, background: String(bg), display: 'flex', alignItems: 'center', px: { xs: 0.75, sm: 1.25 }, minWidth: 0, fontSize: { xs: 10, sm: 11 } }}>
            <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {label}
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};

const RANKED = [
  ['#1', 'lookback 126 · top_n 3', '0,18 20,15 40,16 60,10 80,9 100,5 120,2', '1.84'],
  ['#2', 'lookback 147 · top_n 3', '0,18 20,16 40,14 60,12 80,11 100,8 120,6', '1.77'],
  ['#3', 'lookback 105 · top_n 4', '0,17 20,17 40,13 60,13 80,10 100,9 120,7', '1.71'],
  ['#4', 'lookback 189 · top_n 2', '0,19 20,16 40,17 60,13 80,12 100,11 120,8', '1.66'],
] as const;

const Portfolios = () => {
  const { t } = useTranslation('home');
  return (
    <>
      <Head>
        <Title>{t(`${S}.ranked`)}</Title>
        <Box sx={{ ml: 'auto' }}>
          <Raised>{t(`${S}.exportPdf`)}</Raised>
        </Box>
      </Head>
      {RANKED.map(([rank, params, curve, sharpe], i) => (
        <Box
          key={rank}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '28px minmax(0, 1fr) 52px', sm: '28px minmax(0, 1fr) 120px 52px' },
            gap: 1.5,
            alignItems: 'center',
            height: 36,
            px: 1,
            borderRadius: '8px',
            background: i === 0 ? 'rgba(232,185,35,0.14)' : 'transparent',
            fontSize: 13,
          }}
        >
          <Box component="span" sx={{ fontFamily: APP.mono, color: APP.textDisabled }}>
            {rank}
          </Box>
          <Box component="span" sx={{ fontFamily: APP.mono, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params}
          </Box>
          <Box component="svg" viewBox="0 0 120 22" aria-hidden sx={{ width: 120, height: 22, display: { xs: 'none', sm: 'block' } }}>
            <polyline points={curve} fill="none" stroke="#10b981" strokeWidth="2" />
          </Box>
          <Box component="span" sx={{ fontWeight: 800, textAlign: 'right' }}>
            {sharpe}
          </Box>
        </Box>
      ))}
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
