import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import { grooveSx } from '../../theme/neu';

/** A 2px groove in place of a 1px rule. Decorative (aria-hidden). Spacing is the caller's. */
export const Groove = ({ sx, ...rest }: BoxProps) => (
  <Box aria-hidden sx={[grooveSx, ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>} {...rest} />
);
