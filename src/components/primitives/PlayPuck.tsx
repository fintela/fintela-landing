import { IconButton } from '@mui/material';
import type { IconButtonProps, SxProps, Theme } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import { playPuckSx } from '../../theme/neu';

export type PlayPuckProps = Omit<IconButtonProps, 'size' | 'color'> & {
  playing: boolean;
  size?: 64 | 44;
  /** Centre the puck over its positioned parent (the viewport). */
  overlay?: boolean;
};

/** The play control that floats over a viewport; press sinks it like any control. */
export const PlayPuck = ({ playing, size = 64, overlay = false, sx, ...rest }: PlayPuckProps) => (
  <IconButton
    sx={
      [
        playPuckSx(size),
        overlay
          ? {
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              // Above the well's ::after overlay, so the wash never tints the puck.
              zIndex: 2,
              '@media (hover: hover)': {
                '&:hover': { transform: 'translate(-50%, calc(-50% - 1px))' },
              },
              '&:active': { transform: 'translate(-50%, -50%)' },
              '@media (prefers-reduced-motion: reduce)': {
                transform: 'translate(-50%, -50%) !important',
              },
            }
          : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {playing ? <PauseRoundedIcon /> : <PlayArrowRoundedIcon />}
  </IconButton>
);
