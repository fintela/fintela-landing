import { Box, Container } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';

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
  default: '#ffffff',
  muted: '#fafbfc',
  gradient:
    'linear-gradient(180deg, rgba(239,192,60,0.03) 0%, rgba(229,53,64,0.03) 50%, rgba(47,99,149,0.04) 100%)',
  ink: 'linear-gradient(180deg, #0b1020 0%, #131835 100%)',
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
