import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import { gradientIconSx } from '../../theme/neu';

export type IconWellProps = Omit<BoxProps, 'children'> & {
  children: React.ReactNode;
  /** Slot size in px; the glyph itself is drawn at 0.46x that. */
  size?: number;
};

/** A bare icon slot — the glyph painted with the brand gradient, no well or shadow. */
export const IconWell = ({ children, size = 48, sx, ...rest }: IconWellProps) => (
  <Box
    aria-hidden
    sx={
      [
        {
          width: size,
          height: size,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': { fontSize: Math.round(size * 0.46) },
        },
        // A separate array entry, not spread into the object above: emotion
        // resolves an sx array through the CSS cascade (later rule for the
        // same selector wins per-property), not a JS object merge — spreading
        // it inline would have let its own `'& svg'` key silently replace the
        // fontSize set here instead of adding `fill` alongside it.
        gradientIconSx,
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {children}
  </Box>
);
