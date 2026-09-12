import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { forcedColorsSurface } from '../../theme/neu';
import { accents, radii, soft } from '../../theme/tokens';

export interface AgentCoinProps {
  /** Index into the six-way accent cycle, so three speakers stay apart without a status colour. */
  tone?: number;
  /** A letter or glyph; defaults to the sparkle. */
  children?: React.ReactNode;
  size?: number;
  sx?: SxProps<Theme>;
}

/** Flat coin for an assistant avatar (lifted from FintelAgentSection). */
export const AgentCoin = ({ tone = 0, children, size = 28, sx }: AgentCoinProps) => (
  <Box
    aria-hidden
    sx={
      [
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: `${radii.pill}px`,
          bgcolor: soft.groundSunken,
          color: accents[tone % accents.length],
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.4),
          fontWeight: 800,
          '& svg': { fontSize: Math.round(size * 0.5) },
          ...forcedColorsSurface,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
  >
    {children ?? <AutoAwesomeIcon />}
  </Box>
);
