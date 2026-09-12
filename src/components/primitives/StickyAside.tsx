import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';

export type StickyAsideProps = BoxProps & {
  /** Offset under the sticky header (72px) plus breathing room. */
  top?: number;
};

/** A column that stays put from lg while the one beside it scrolls; static below. */
export const StickyAside = ({ top = 96, sx, children, ...rest }: StickyAsideProps) => (
  <Box
    sx={
      [
        { position: { lg: 'sticky' }, top: { lg: top }, alignSelf: 'start' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {children}
  </Box>
);
