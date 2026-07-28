import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StepsProps {
  children: ReactNode;
}

/** Wraps a list of <Step> with a vertical connector line on the left. */
export const Steps = ({ children }: StepsProps) => (
  <Box
    sx={{
      my: 3,
      pl: 0,
      borderLeft: '1px dashed',
      borderColor: 'divider',
      ml: 1.25,
    }}
  >
    {children}
  </Box>
);

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export const Step = ({ number, title, children }: StepProps) => (
  <Box sx={{ position: 'relative', pl: 3.5, pb: 3, '&:last-child': { pb: 0 } }}>
    <Box
      sx={{
        position: 'absolute',
        left: -14,
        top: 0,
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #f093fb 100%)',
        color: '#fff',
        fontSize: '0.78rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(102,126,234,0.3)',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        fontSize: { xs: '1rem', md: '1.08rem' },
        fontWeight: 700,
        color: 'text.primary',
        mb: 1,
        letterSpacing: '-0.01em',
        mt: '-2px',
      }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        fontSize: { xs: '0.92rem', md: '0.95rem' },
        color: 'text.secondary',
        lineHeight: 1.65,
      }}
    >
      {children}
    </Box>
  </Box>
);
