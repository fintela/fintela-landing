import { APP } from '../../components/fintelligentDemo/appTheme';

/** Code, so never translated. The landing's `sector_momentum`, as a complete strategy. */
export const STRATEGY_FILE = 'sector_momentum.py';

const { keyword, fn, string, number } = APP.code;

/**
 * Each line is a list of `[text, colour]` runs, with no colour meaning plain text.
 * This is valid under the rules in the docs' Python quickstart: it takes `data`,
 * `start_date` and `end_date`, and returns date -> ticker -> {position, allocation}.
 * Keep lines to 44 characters, which is what the editor shows.
 */
export const STRATEGY_CODE: readonly (readonly (readonly [string, string?])[])[] = [
  [['def', keyword], [' '], ['sector_momentum', fn], ['(']],
  [['    data, start_date, end_date,']],
  [['    lookback, top_n):']],
  [['    mom = data / data.shift(lookback) - '], ['1', number]],
  [['    out = {}']],
  [['    '], ['for', keyword], [' ts '], ['in', keyword], [' mom.index[lookback:]:']],
  [['        top = mom.loc[ts].nlargest(top_n)']],
  [['        w = {'], ['"position"', string], [': '], ['"L"', string], [',']],
  [['             '], ['"allocation"', string], [': '], ['1', number], [' / top_n}']],
  [['        day = ts.strftime('], ['"%Y-%m-%d"', string], [')']],
  [['        out[day] = {t: w '], ['for', keyword], [' t '], ['in', keyword], [' top.index}']],
  [['    '], ['return', keyword], [' out']],
];
