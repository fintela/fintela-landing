import { Box } from '@mui/material';
import { radii, shadows, soft } from '../../theme/tokens';
import { forcedColorsSurface } from '../../theme/neu';

interface KbdKeyProps {
  children: React.ReactNode;
}

export const KbdKey = ({ children }: KbdKeyProps) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 22,
      height: 22,
      px: 0.75,
      mx: 0.25,
      fontSize: '0.7rem',
      fontWeight: 600,
      fontFamily: '"JetBrains Mono", monospace',
      letterSpacing: 0,
      color: soft.text,
      bgcolor: soft.surfaceRaised,
      borderRadius: `${radii.sm}px`,
      boxShadow: shadows.neuRaisedXs,
      ...forcedColorsSurface,
      '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
    }}
  >
    {children}
  </Box>
);
