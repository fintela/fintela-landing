import { Box } from '@mui/material';
import type { ReactNode, Ref } from 'react';
import { radii, shadows, soft } from '../../theme/tokens';

interface FlatStageProps {
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}

/**
 * The sunken well every flat piece plays in. Its 4:3 box holds the layout before
 * anything paints, and it is the container `u()` measures against. Decorative: the
 * section's own copy carries the meaning, so it is hidden from assistive tech,
 * forced colours and print.
 */
export const FlatStage = ({ ref, children }: FlatStageProps) => (
  <Box
    ref={ref}
    aria-hidden
    sx={{
      position: 'relative',
      width: '100%',
      aspectRatio: '4 / 3',
      containerType: 'inline-size',
      overflow: 'hidden',
      borderRadius: `${radii.neuCard}px`,
      background: soft.ground,
      // Shadows are in px, so the art's shrink would otherwise leave the well looking heavy.
      boxShadow: { xs: shadows.neuInsetSm, sm: shadows.neuInset },
      pointerEvents: 'none',
      userSelect: 'none',
      '@media print, (forced-colors: active)': { display: 'none' },
    }}
  >
    {children}
  </Box>
);
