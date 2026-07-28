import { Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { ReactNode } from 'react';

type Variant = 'info' | 'warning' | 'tip' | 'danger' | 'success';

interface CalloutProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}

const styles: Record<Variant, { color: string; bg: string; icon: ReactNode; label: string }> = {
  info: {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    icon: <InfoOutlinedIcon sx={{ fontSize: 18 }} />,
    label: 'Note',
  },
  warning: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18 }} />,
    label: 'Warning',
  },
  tip: {
    color: '#667eea',
    bg: 'rgba(102,126,234,0.07)',
    icon: <LightbulbOutlinedIcon sx={{ fontSize: 18 }} />,
    label: 'Tip',
  },
  danger: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    icon: <ErrorOutlineIcon sx={{ fontSize: 18 }} />,
    label: 'Caution',
  },
  success: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
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
        my: 3,
        display: 'flex',
        gap: 1.5,
        p: 2,
        pl: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: `${s.color}33`,
        bgcolor: s.bg,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: s.color,
          borderRadius: '2px 0 0 2px',
        },
      }}
    >
      <Box sx={{ color: s.color, mt: '2px', flexShrink: 0 }}>{s.icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color: s.color,
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
            color: 'text.primary',
            fontSize: '0.92rem',
            lineHeight: 1.65,
            '& p': { my: 0.75 },
            '& code': {
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.85em',
              px: 0.5,
              py: 0.15,
              borderRadius: 0.75,
              bgcolor: 'rgba(11,16,32,0.06)',
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
