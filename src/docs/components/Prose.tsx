import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { palette } from '../../theme/tokens';

/** Inline code style — reusable. Plain object so it can be nested into `sx`. */
export const inlineCode = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: '0.84em',
  px: 0.6,
  py: 0.2,
  borderRadius: 0.75,
  bgcolor: 'rgba(11,16,32,0.05)',
  border: '1px solid rgba(11,16,32,0.06)',
  color: palette.blue,
  whiteSpace: 'nowrap',
} as const;

/** Plain paragraph for docs body text. */
export const P = ({ children }: { children: ReactNode }) => (
  <Typography
    sx={{
      my: 2,
      color: 'text.secondary',
      fontSize: { xs: '0.95rem', md: '1rem' },
      lineHeight: 1.75,
      '& code': inlineCode,
      '& strong': { color: 'text.primary', fontWeight: 600 },
      '& a': {
        color: palette.blue,
        textDecoration: 'none',
        borderBottom: '1px solid transparent',
        transition: 'border-color 0.18s',
        '&:hover': { borderBottomColor: palette.blue },
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
      color: 'text.secondary',
      fontSize: { xs: '0.95rem', md: '1rem' },
      lineHeight: 1.75,
      '& li': { my: 0.75 },
      '& li::marker': { color: palette.blue },
      '& code': inlineCode,
      '& strong': { color: 'text.primary', fontWeight: 600 },
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
      color: 'text.secondary',
      lineHeight: 1.6,
      maxWidth: 720,
    }}
  >
    {children}
  </Typography>
);
