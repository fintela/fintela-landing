import { Box, Typography } from '@mui/material';

interface FeatureCardProps {
  title: string;
  description: string;
  accent?: string;
}

export const FeatureCard = ({
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
          boxShadow: `0 4px 14px ${accent}1a`,
          transform: 'translateY(-2px)',
          '&::before': { opacity: 1 },
        },
      }}
    >
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
