import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { gradientIconSx } from '../../theme/neu';

export type CheckWellProps = Omit<BoxProps, 'children'> & {
  size?: number;
  /** Replaces the check (UseCases arrow, Advantage cross). Sized at 0.65 * size. */
  icon?: React.ReactNode;
};

/** A bare check glyph, painted with the brand gradient — no pill, no shadow. */
export const CheckWell = ({ size = 20, icon, sx, ...rest }: CheckWellProps) => (
  <Box
    aria-hidden
    sx={
      [
        {
          width: size,
          height: size,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': { fontSize: Math.round(size * 0.65) },
        },
        // A separate array entry — see IconWell for why this must not be
        // spread into the object above.
        gradientIconSx,
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {icon ?? <CheckRoundedIcon />}
  </Box>
);
