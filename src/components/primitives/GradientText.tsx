import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { gradients } from '../../theme/tokens';

interface GradientTextProps {
  children: ReactNode;
  gradient?: string;
  component?: React.ElementType;
  sx?: SxProps<Theme>;
}

export const GradientText = ({
  children,
  gradient = gradients.brand,
  component = 'span',
  sx,
}: GradientTextProps) => (
  <Box
    component={component}
    sx={{
      background: gradient,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      display: 'inline',
      ...sx,
    }}
  >
    {children}
  </Box>
);
