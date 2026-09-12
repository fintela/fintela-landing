import { Box } from '@mui/material';
import type { BoxProps, SxProps, Theme } from '@mui/material';
import { neuGrid } from '../../theme/neu';

type Responsive<T> = T | { xs?: T; sm?: T; md?: T; lg?: T };

export type BentoGridProps = BoxProps & {
  /** Column count per breakpoint; each becomes `repeat(n, minmax(0, 1fr))`. */
  columns: Responsive<number>;
  /** `grid-auto-rows` per breakpoint; a minimum keeps 1×1 tiles from collapsing beside a 2×2. */
  autoRows?: Responsive<string>;
};

const columnTemplate = (columns: Responsive<number>) =>
  typeof columns === 'number'
    ? neuGrid.columns(columns)
    : Object.fromEntries(
        Object.entries(columns).map(([bp, n]) => [bp, neuGrid.columns(n as number)]),
      );

/**
 * The asymmetric card grid. Gap is neuGrid.gap (32px from md, which neuRaised
 * needs) and columns are minmax(0, 1fr) so one long Spanish token never widens
 * a column. Auto-placement is never `dense`: DOM order stays reading order.
 */
export const BentoGrid = ({ columns, autoRows, sx, children, ...rest }: BentoGridProps) => (
  <Box
    sx={
      [
        {
          display: 'grid',
          gridTemplateColumns: columnTemplate(columns),
          gridAutoRows: autoRows,
          gap: neuGrid.gap,
          alignItems: 'stretch',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {children}
  </Box>
);

export type BentoTileProps = BoxProps & {
  /** `grid-column` per breakpoint, e.g. `{ md: 'span 2', lg: '3 / 5' }`. */
  col?: Responsive<string>;
  /** `grid-row` per breakpoint. */
  row?: Responsive<string>;
};

/**
 * A grid cell. Flex column so a wrapped card (AnimateOnScroll → NeuPanel) still
 * fills the cell's height; minWidth 0 so long words wrap instead of overflowing.
 */
export const BentoTile = ({ col, row, sx, children, ...rest }: BentoTileProps) => (
  <Box
    sx={
      [
        {
          gridColumn: col,
          gridRow: row,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          '& > *': { flex: 1, minHeight: 0 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
    {...rest}
  >
    {children}
  </Box>
);
