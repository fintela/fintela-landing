import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { forcedColorsSurface } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';

export type CheckWellProps = Omit<BoxProps, 'children'> & {
  size?: number;
  /** Replaces the check (UseCases arrow, Advantage cross). Sized at 0.65 * size. */
  icon?: React.ReactNode;
};

/** A debossed pill holding a check — the one "yes" glyph in this style. */
export const CheckWell = ({ size = 20, icon, sx, ...rest }: CheckWellProps) => (
  <Box
    aria-hidden
    sx={
      [
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: `${radii.pill}px`,
          bgcolor: soft.groundSunken,
          boxShadow: shadows.neuInsetSm,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: soft.accent,
          '& svg': { fontSize: Math.round(size * 0.65) },
          ...forcedColorsSurface,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {icon ?? <CheckRoundedIcon />}
  </Box>
);
