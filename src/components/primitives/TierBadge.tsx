import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import { forcedColorsSurface } from '../../theme/neu';
import { radii, shadows, soft } from '../../theme/tokens';

export type TierBadgeProps = Omit<BoxProps, 'children'> & {
  children: React.ReactNode;
  /** Gold accent chip (the featured tier). Default is an embossed well. */
  featured?: boolean;
};

/** Label chip: accent-filled for the featured tier, embossed otherwise. */
export const TierBadge = ({ children, featured = false, sx, ...rest }: TierBadgeProps) => (
  <Box
    component="span"
    sx={
      [
        {
          height: 24,
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.25,
          borderRadius: `${radii.pill}px`,
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          ...(featured
            ? {
                bgcolor: soft.highlight,
                color: soft.onHighlight,
                boxShadow: shadows.neuAccent,
                '@media (forced-colors: active)': {
                  boxShadow: 'none',
                  background: 'Canvas',
                  color: 'CanvasText',
                  border: '2px solid Highlight',
                },
              }
            : {
                bgcolor: soft.groundSunken,
                color: soft.text,
                boxShadow: shadows.neuInsetSm,
                ...forcedColorsSurface,
              }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {children}
  </Box>
);
