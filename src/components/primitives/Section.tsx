import { Box, Container } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { palette, gradients } from '../../theme/tokens';

interface SectionProps {
  id?: string;
  children: ReactNode;
  /** Visual treatment for the section background. */
  tone?: 'default' | 'muted' | 'gradient' | 'ink';
  /** Top/bottom padding density. */
  size?: 'sm' | 'md' | 'lg';
  /** Constrain content width — passed to <Container maxWidth>. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  sx?: SxProps<Theme>;
}

const paddingY = {
  sm: { xs: 6, md: 9 },
  md: { xs: 8, md: 12 },
  lg: { xs: 10, md: 16 },
} as const;

const backgrounds = {
  default: palette.surface,
  muted: palette.surfaceMuted,
  gradient: gradients.brandFaint,
  ink: gradients.ink,
} as const;

export const Section = ({
  id,
  children,
  tone = 'default',
  size = 'md',
  maxWidth = 'lg',
  sx,
}: SectionProps) => {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        py: paddingY[size],
        background: backgrounds[tone],
        position: 'relative',
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth} sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Container>
    </Box>
  );
};
