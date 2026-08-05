import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  accent?: string;
}

export const FeatureCard = ({
  icon,
  title,
  description,
  accent = '#2f6395',
}: FeatureCardProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        p: { xs: 3, md: 3.5 },
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 80% at 100% 0%, ${accent}0d 0%, transparent 60%)`,
          opacity: 0,
          transition: 'opacity 0.22s ease',
          pointerEvents: 'none',
        },
        '&:hover': {
          borderColor: `${accent}66`,
          boxShadow: `0 14px 32px ${accent}22`,
          transform: 'translateY(-3px)',
          '&::before': { opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${accent}1f 0%, ${accent}0d 100%)`,
          color: accent,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.25,
          border: `1px solid ${accent}24`,
          '& svg': { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '1.02rem',
          color: 'text.primary',
          mb: 0.75,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.92rem',
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};
