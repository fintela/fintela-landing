import { memo } from 'react';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { fonts, preview } from '../../theme/tokens';

/** How many lines the sketch has, for whoever reveals it line by line. */
export const CODE_LINES = 5;

const KEYWORD = '#c4a7ff';
const FUNCTION = '#8ec7ff';

/** A parameter the search will vary: outlined once the code has been "read". */
const Param = ({ lit, children }: { lit: boolean; children: ReactNode }) => (
  <Box
    component="span"
    sx={{
      borderRadius: '4px',
      px: '3px',
      mx: '-3px',
      transition: 'box-shadow 0.3s ease, color 0.3s ease',
      color: lit ? preview.warn : 'inherit',
      boxShadow: lit ? `inset 0 0 0 1px ${preview.warn}` : 'inset 0 0 0 1px transparent',
    }}
  >
    {children}
  </Box>
);

/**
 * The strategy the visuals are about, as code: a plain Python function with
 * the app's own signature and two parameters to search. Code is the
 * product's, so it stays English in every language.
 *
 * `lines` reveals it line by line (the hero's Code step); `paramsLit` marks
 * the two searchable parameters.
 */
export const CodeSketch = memo(({ lines = CODE_LINES, paramsLit = true }: { lines?: number; paramsLit?: boolean }) => {
  const rows: ReactNode[] = [
    <>
      <Box component="span" sx={{ color: KEYWORD }}>def</Box> <Box component="span" sx={{ color: FUNCTION }}>sector_momentum</Box>(data, start_date, end_date,
    </>,
    <>
      {'                    '}
      <Param lit={paramsLit}>lookback</Param>, <Param lit={paramsLit}>top_n</Param>):
    </>,
    <>{'    '}window = data.close.iloc[-lookback:]</>,
    <>{'    '}gain = window.iloc[-1] / window.iloc[0] - 1</>,
    <>
      {'    '}
      <Box component="span" sx={{ color: KEYWORD }}>return</Box> gain.nlargest(top_n)
    </>,
  ];
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: { xs: 1.5, sm: 2 },
        borderRadius: '10px',
        background: preview.surface,
        boxShadow: `inset 0 0 0 1px ${preview.line}`,
        fontFamily: fonts.mono,
        fontSize: { xs: '0.68rem', sm: '0.78rem' },
        lineHeight: 1.75,
        color: preview.text,
        overflowX: 'auto',
        whiteSpace: 'pre',
      }}
    >
      {rows.map((row, i) => (
        <Box key={i} component="span" sx={{ display: 'block', transition: 'opacity 0.25s ease', opacity: i < lines ? 1 : 0 }}>
          {row}
        </Box>
      ))}
    </Box>
  );
});
CodeSketch.displayName = 'CodeSketch';
