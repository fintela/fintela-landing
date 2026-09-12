import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { ReactNode } from 'react';
import { calloutTints, palette, radii, soft } from '../../theme/tokens';
import { wellSx } from '../../theme/neu';
import { inlineCode } from './Prose';

type Variant = 'info' | 'warning' | 'tip' | 'danger' | 'success';

interface CalloutProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}

const styles: Record<Variant, { color: string; bg: string; icon: ReactNode; label: string }> = {
  info: {
    color: palette.navy,
    bg: calloutTints.info,
    icon: <InfoOutlinedIcon sx={{ fontSize: 18 }} />,
    label: 'Note',
  },
  warning: {
    color: palette.warning,
    bg: calloutTints.warning,
    icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />,
    label: 'Warning',
  },
  tip: {
    color: palette.goldDeep,
    bg: calloutTints.tip,
    icon: <LightbulbOutlinedIcon sx={{ fontSize: 18 }} />,
    label: 'Tip',
  },
  danger: {
    color: palette.danger,
    bg: calloutTints.danger,
    icon: <ErrorOutlineIcon sx={{ fontSize: 18 }} />,
    label: 'Caution',
  },
  success: {
    color: palette.success,
    bg: calloutTints.success,
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />,
    label: 'Success',
  },
};

export const Callout = ({ variant = 'info', title, children }: CalloutProps) => {
  const s = styles[variant];
  return (
    <Box
      role="note"
      sx={{
        ...wellSx('sm'),
        my: 3,
        display: 'flex',
        gap: 1.5,
        p: 2,
        borderRadius: `${radii.neuInner}px`,
        backgroundImage: `linear-gradient(${s.bg}, ${s.bg})`,
        // Re-declared: the wellSx spread carries the same key.
        '@media (forced-colors: active)': {
          boxShadow: 'none',
          border: '1px solid CanvasText',
          background: 'Canvas',
          backgroundImage: 'none',
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: `${radii.pill}px`,
          bgcolor: soft.surfaceRaised,
          color: s.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': { fontSize: 18 },
        }}
      >
        {s.icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: soft.text,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          {title ?? s.label}
        </Typography>
        <Box
          sx={{
            color: soft.text,
            fontSize: '0.92rem',
            lineHeight: 1.65,
            '& p': { my: 0.75 },
            '& code': { ...inlineCode, boxShadow: 'none' },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
