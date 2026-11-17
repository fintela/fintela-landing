import { palette } from '../../theme/tokens';

/**
 * The panel's tickers, row by row, five to a row. Codes only, never company names. Index
 * funds sit among large US stocks, so the panel reads as a real search across both.
 */
export const TICKERS = [
  'SPY',
  'AAPL',
  'QQQ',
  'MSFT',
  'TSLA',
  'IWM',
  'JPM',
  'NVDA',
  'DIA',
  'XOM',
  'V',
  'AMZN',
  'KO',
  'WMT',
  'NFLX',
  'UNH',
  'JNJ',
  'META',
  'GOOGL',
  'DIS',
] as const;

/**
 * The six the cursor clicks, in click order: all S&P 500 stocks, placed in the grid so
 * the cursor zigzags down the panel in short hops. Each wears its company's own colour
 * from the click on, which is why these are the one set of hex values not in the kit or
 * the theme. `ink` is whichever of black or white reads better on that colour. GOOGL
 * takes Google's red rather than its blue, which sat too close to Meta's and Microsoft's.
 */
export const PICKS = [
  { symbol: 'AAPL', color: '#555555', ink: palette.surface },
  { symbol: 'MSFT', color: '#00A4EF', ink: palette.navy },
  { symbol: 'NVDA', color: '#76B900', ink: palette.navy },
  { symbol: 'AMZN', color: '#FF9900', ink: palette.navy },
  { symbol: 'META', color: '#0866FF', ink: palette.surface },
  { symbol: 'GOOGL', color: '#EA4335', ink: palette.navy },
] as const;
