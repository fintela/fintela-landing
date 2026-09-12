import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { clippedGradientSx, eyebrowSx, floatPaperSx, raisedTileSx, trackWellSx } from '../../theme/neu';
import { gradients, soft } from '../../theme/tokens';

export interface StatTileProps {
  eyebrow: string;
  /** The figure, in the gold display ramp (≥19px bold on white, per tokens.ts). */
  value: string;
  /** Text after the figure at body size, e.g. "/ 500 trials". */
  unit?: string;
  sub?: string;
  /** 0–1 fills a hairline track under the figure. */
  progress?: number;
  /**
   * 'float' crosses an edge (the hero tile over the plate): unpaired drop,
   * positioned by the caller. 'tile' sits in flow with the paired Sm shadow.
   */
  variant?: 'tile' | 'float';
  sx?: SxProps<Theme>;
}

export const StatTile = ({ eyebrow, value, unit, sub, progress, variant = 'tile', sx }: StatTileProps) => (
  <Box
    sx={
      [
        variant === 'float' ? floatPaperSx : raisedTileSx,
        { p: { xs: 2, md: 2.25 }, display: 'flex', flexDirection: 'column', gap: 0.75 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
  >
    <Typography component="span" sx={{ ...eyebrowSx, fontSize: '0.64rem' }}>
      {eyebrow}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
      <Typography
        component="span"
        sx={{
          fontSize: { xs: '1.5rem', md: '1.75rem' },
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          ...clippedGradientSx(gradients.goldText),
        }}
      >
        {value}
      </Typography>
      {unit && (
        <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 600, color: soft.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
          {unit}
        </Typography>
      )}
    </Box>
    {typeof progress === 'number' && (
      <Box
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={eyebrow}
        sx={{ ...trackWellSx, position: 'relative', overflow: 'hidden', mt: 0.5 }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
            borderRadius: '6px',
            bgcolor: soft.accent,
            '@media (forced-colors: active)': { background: 'Highlight' },
          }}
        />
      </Box>
    )}
    {sub && (
      <Typography component="span" sx={{ fontSize: '0.76rem', color: soft.textSecondary, lineHeight: 1.45 }}>
        {sub}
      </Typography>
    )}
  </Box>
);
