import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { preview } from '../../theme/tokens';

const TONE = { good: preview.good, bad: preview.bad, warn: preview.warn } as const;

/**
 * A verdict, as a coloured dot and its name. The name carries the meaning;
 * the colour only repeats it, so the chip still reads without colour.
 */
export const VerdictChip = ({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      height: 24,
      px: 1.25,
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      color: TONE[tone],
      boxShadow: 'inset 0 0 0 1px currentColor',
      '@media (forced-colors: active)': { boxShadow: 'none', border: '1px solid CanvasText', color: 'CanvasText' },
    }}
  >
    <Box component="span" aria-hidden sx={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
    {children}
  </Box>
);
