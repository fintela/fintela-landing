import { Box, Container } from '@mui/material';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';
import { gradients, soft } from '../../theme/tokens';

interface SectionProps {
  id?: string;
  children: ReactNode;
  /**
   * 'soft' (default) is the one continuous ground. 'hero' is gradients.groundFade
   * for the FIRST band of a page only, and never behind a shadowed surface — a
   * paired shadow on a graded ground desynchronizes from its background.
   */
  tone?: 'soft' | 'hero';
  /** Top/bottom padding density. */
  size?: 'sm' | 'md' | 'lg';
  /** Constrain content width — passed to <Container maxWidth>. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  /**
   * Full-bleed decoration painted behind the content: an absolutely
   * positioned, inert element such as <HeroWaveField />. It spans the whole
   * band, not just the Container.
   */
  background?: ReactNode;
  sx?: SxProps<Theme>;
}

const paddingY = {
  sm: { xs: 6, md: 9 },
  md: { xs: 8, md: 12 },
  lg: { xs: 10, md: 16 },
} as const;

const backgrounds = {
  soft: soft.ground,
  hero: gradients.groundFade,
} as const;

export const Section = ({
  id,
  children,
  tone = 'soft',
  size = 'md',
  maxWidth = 'lg',
  background,
  sx,
}: SectionProps) => {
  return (
    <Box
      component="section"
      id={id}
      // Merged as an array (never `...sx`): the prop is SxProps<Theme>, which
      // may be an array or a function. Callers' keys still win, in order.
      sx={
        [
          {
            py: paddingY[size],
            background: backgrounds[tone],
            position: 'relative',
            '@media print': { background: soft.white },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
    >
      {background}
      <Container maxWidth={maxWidth} sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Container>
    </Box>
  );
};
