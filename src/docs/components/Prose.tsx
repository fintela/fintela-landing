import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { radii, shadows, soft } from '../../theme/tokens';

/** Inline code style — reusable. Plain object so it can be nested into `sx`. */
export const inlineCode = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '0.84em',
  px: 0.6,
  py: 0.2,
  borderRadius: `${radii.xs}px`,
  bgcolor: soft.groundSunken,
  boxShadow: shadows.neuInsetXs,
  color: soft.accent,
  whiteSpace: 'nowrap',
  '@media (forced-colors: active)': { boxShadow: 'none', border: '1px solid CanvasText' },
  '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
} as const;

/** Plain paragraph for docs body text. */
export const P = ({ children }: { children: ReactNode }) => (
  <Typography
    sx={{
      my: 2,
      color: soft.textSecondary,
      fontSize: { xs: '0.95rem', md: '1rem' },
      lineHeight: 1.75,
      '& code': inlineCode,
      '& strong': { color: soft.text, fontWeight: 600 },
      '& a': {
        color: soft.accent,
        textDecoration: 'underline',
        textDecorationColor: soft.ring,
        textUnderlineOffset: '3px',
        '@media (hover: hover)': { '&:hover': { textDecorationColor: soft.accent } },
      },
    }}
  >
    {children}
  </Typography>
);

/** Inline code shorthand. */
export const C = ({ children }: { children: ReactNode }) => (
  <Box component="code" sx={inlineCode}>
    {children}
  </Box>
);

export const Ul = ({ children }: { children: ReactNode }) => (
  <Box
    component="ul"
    sx={{
      my: 2,
      pl: 3,
      color: soft.textSecondary,
      fontSize: { xs: '0.95rem', md: '1rem' },
      lineHeight: 1.75,
      '& li': { my: 0.75 },
      '& li::marker': { color: soft.accent },
      '& code': inlineCode,
      '& strong': { color: soft.text, fontWeight: 600 },
    }}
  >
    {children}
  </Box>
);

export const Lead = ({ children }: { children: ReactNode }) => (
  <Typography
    sx={{
      mt: 1,
      mb: 4,
      fontSize: { xs: '1.05rem', md: '1.2rem' },
      color: soft.textSecondary,
      lineHeight: 1.6,
      maxWidth: 720,
    }}
  >
    {children}
  </Typography>
);
