import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { palette } from '../../theme/tokens';

export interface GroundTextureProps {
  /** Which side of the band the texture sits behind; it fades out towards the other. */
  side?: 'left' | 'right';
  sx?: SxProps<Theme>;
}

/**
 * The one image-like thing allowed on the ground: contour lines at 5% navy,
 * masked to fade out well before any shadowed surface, so a paired shadow
 * never has to read against it. Hero band only.
 */
export const GroundTexture = ({ side = 'left', sx }: GroundTextureProps) => {
  const mask =
    side === 'left'
      ? 'radial-gradient(58% 80% at 22% 45%, #000 28%, transparent 76%)'
      : 'radial-gradient(58% 80% at 78% 45%, #000 28%, transparent 76%)';
  return (
    <Box
      aria-hidden
      sx={
        [
          {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.055,
            maskImage: mask,
            WebkitMaskImage: mask,
            '@media (forced-colors: active)': { display: 'none' },
            '@media print': { display: 'none' },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
    >
      <svg width="100%" height="100%" viewBox="0 0 600 420" preserveAspectRatio="none">
        <g fill="none" stroke={palette.navy} strokeWidth="1.1" vectorEffect="non-scaling-stroke">
          <ellipse cx="190" cy="210" rx="80" ry="50" />
          <ellipse cx="190" cy="210" rx="140" ry="90" />
          <ellipse cx="190" cy="210" rx="205" ry="135" />
          <ellipse cx="190" cy="210" rx="275" ry="182" />
          <ellipse cx="190" cy="210" rx="350" ry="234" />
          <ellipse cx="190" cy="210" rx="430" ry="290" />
          <ellipse cx="190" cy="210" rx="515" ry="350" />
        </g>
      </svg>
    </Box>
  );
};
