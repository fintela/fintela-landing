import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';
import { bleedRightSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { Groove } from './Groove';
import { NeuPanel } from './NeuPanel';

export interface MediaPlateProps {
  /** A MediaWell or VideoPlate. */
  children: ReactNode;
  /** Caption strip under the viewport: a groove, then text and an optional badge. */
  caption?: ReactNode;
  badge?: ReactNode;
  /** Run the plate off the right edge of the viewport from lg (see bleedRightSx). */
  bleed?: 'right' | false;
  sx?: SxProps<Theme>;
}

/**
 * The raised frame around a viewport: an embossed plate holding a debossed
 * image. Padding is tight (16/20px) so the frame reads as a bezel, not a card.
 */
export const MediaPlate = ({ children, caption, badge, bleed = false, sx }: MediaPlateProps) => (
  <NeuPanel
    sx={
      [
        { p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', position: 'relative' },
        ...(bleed === 'right' ? [bleedRightSx] : []),
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
  >
    {children}
    {(caption || badge) && (
      <>
        <Groove sx={{ mt: 2, mb: 1.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 0.5, pb: 0.25 }}>
          {caption && (
            <Typography sx={{ fontSize: '0.82rem', color: soft.textSecondary, lineHeight: 1.5, flex: 1, minWidth: 0 }}>
              {caption}
            </Typography>
          )}
          {badge && <Box sx={{ ml: 'auto', flexShrink: 0 }}>{badge}</Box>}
        </Box>
      </>
    )}
  </NeuPanel>
);
