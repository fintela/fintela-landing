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
   * 'ink' is the full-bleed black band used to alternate a page's sections:
   * `data-tone="ink"` (set below) flips `soft.text`/`textSecondary`/
   * `textSubtle` to their onInk values for everything painted straight on
   * this section's ground (see the CSS custom properties declared in
   * src/index.css); an "own background" surface — a white NeuPanel, a raised
   * button — resets those three back to light on itself
   * (`lightTextResetSx` in theme/neu.ts), so cards inside an ink band stay
   * normal white cards with normal dark text. Never behind a shadowed
   * surface, for the same reason 'hero' isn't.
   */
  tone?: 'soft' | 'hero' | 'ink';
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

/**
 * Half the gap between two sections, in 8px units. `lg` puts about 120px
 * between the content of two neighbours on desktop (60 + 60) and 80px on a
 * phone; `md` and `sm` are for bands that should sit closer to their
 * neighbours.
 */
const paddingY = {
  sm: { xs: 3.5, md: 5 },
  md: { xs: 4.5, md: 6.5 },
  lg: { xs: 5, md: 7.5 },
} as const;

const backgrounds = {
  soft: soft.ground,
  hero: gradients.groundFade,
  ink: gradients.ink,
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
  const ink = tone === 'ink';
  return (
    <Box
      component="section"
      id={id}
      data-tone={ink ? 'ink' : undefined}
      // Merged as an array (never `...sx`): the prop is SxProps<Theme>, which
      // may be an array or a function. Callers' keys still win, in order.
      sx={
        [
          {
            py: paddingY[size],
            background: backgrounds[tone],
            position: 'relative',
            ...(ink && { colorScheme: 'dark' }),
            '@media print': { background: soft.white, colorScheme: 'light' },
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
