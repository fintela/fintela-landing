import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import { forcedColorsSurface } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';

export type IconWellProps = Omit<BoxProps, 'children'> & {
  children: React.ReactNode;
  /** 48 default; >= 48 gets neuInset + neuInner radius, below gets neuInsetSm + neuWell. */
  size?: number;
  /** Pill radius (72/84px empty-state discs, 28px avatars). */
  round?: boolean;
};

/** An inset well on a raised surface — the tier icon, embossed rather than branded. */
export const IconWell = ({ children, size = 48, round = false, sx, ...rest }: IconWellProps) => (
  <Box
    aria-hidden
    sx={
      [
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: round ? `${radii.pill}px` : `${size >= 48 ? radii.neuInner : radii.neuWell}px`,
          bgcolor: soft.groundSunken,
          boxShadow: size >= 48 ? shadows.neuInset : shadows.neuInsetSm,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: soft.accent,
          '& svg': { fontSize: Math.round(size * 0.46) },
          ...forcedColorsSurface,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {children}
  </Box>
);
