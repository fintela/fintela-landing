import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { APP } from '../../components/fintelligentDemo/appTheme';

/**
 * The small, faithful piece of the product each station hands the visitor. It wears
 * the app's own colours (APP), not the landing's: a surface that claims to show the
 * product has to look like the product. Figures may be illustrative; product names,
 * tickers, parameters and code stay as the app writes them.
 */

export const SurfaceFrame = ({ children }: { children: ReactNode }) => (
  <Box sx={{ color: APP.text, fontFamily: APP.font }}>{children}</Box>
);

export const SurfaceHead = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25, mb: 1.75 }}>
    {children}
  </Box>
);

export const SurfaceTitle = ({
  mono = false,
  children,
}: {
  mono?: boolean;
  children: ReactNode;
}) => (
  <Box
    component="span"
    sx={{ fontSize: 16, fontWeight: 700, fontFamily: mono ? APP.mono : undefined }}
  >
    {children}
  </Box>
);

/** Sunken: a fact about the thing. */
export const Chip = ({ children }: { children: ReactNode }) => (
  <Box
    component="span"
    sx={{
      height: 22,
      px: 1,
      borderRadius: '8px',
      background: APP.well,
      fontSize: 11,
      fontWeight: 600,
      color: APP.textSecondary,
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </Box>
);

/** Raised: something you could press in the app. */
export const RaisedChip = ({
  color = APP.navy,
  children,
}: {
  color?: string;
  children: ReactNode;
}) => (
  <Box
    component="span"
    sx={{
      height: 28,
      px: 1.5,
      borderRadius: '10px',
      background: APP.paper,
      boxShadow: APP.shadow.raisedXs,
      fontSize: 12,
      fontWeight: 700,
      color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </Box>
);

/** A process under way: a tinted chip with a pulsing dot. */
export const StatusChip = ({ children }: { children: ReactNode }) => (
  <Box
    component="span"
    sx={{
      height: 22,
      px: 1,
      borderRadius: '6px',
      background: `${APP.warning}1f`,
      color: APP.warning,
      fontSize: 12,
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
    }}
  >
    <Box
      component="span"
      className="isoPulse"
      sx={{ width: 6, height: 6, borderRadius: '50%', background: APP.warning }}
    />
    {children}
  </Box>
);

/** A figure. Tabular, so a value counting up with scroll does not jitter. */
export const StatTile = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ p: '10px 12px', borderRadius: '12px', background: '#f5f7f9', minWidth: 0 }}>
    <Box sx={{ fontSize: 11, color: APP.textSecondary, fontWeight: 600 }}>{label}</Box>
    <Box
      sx={{
        fontSize: 18,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </Box>
  </Box>
);
