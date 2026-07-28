import { Box, Typography } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import type { ReactNode } from 'react';

interface HeadingProps {
  id: string;
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
}

const styles = {
  1: { fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 800, mt: 0, mb: 2, letterSpacing: '-0.025em' },
  2: { fontSize: { xs: '1.5rem', md: '1.85rem' }, fontWeight: 700, mt: 6, mb: 2, letterSpacing: '-0.02em' },
  3: { fontSize: { xs: '1.2rem', md: '1.35rem' }, fontWeight: 700, mt: 4, mb: 1.5, letterSpacing: '-0.015em' },
  4: { fontSize: { xs: '1.05rem', md: '1.1rem' }, fontWeight: 700, mt: 3, mb: 1, letterSpacing: '-0.01em' },
} as const;

export const Heading = ({ id, level = 2, children }: HeadingProps) => {
  const tag = (`h${level}` as const);
  return (
    <Box
      id={id}
      component={tag}
      sx={{
        ...styles[level],
        color: 'text.primary',
        scrollMarginTop: 96,
        position: 'relative',
        display: 'flex',
        alignItems: 'baseline',
        gap: 1,
        '& .heading-anchor': {
          opacity: 0,
          transition: 'opacity 0.2s',
        },
        '&:hover .heading-anchor': {
          opacity: 1,
        },
      }}
    >
      <Typography
        component="span"
        sx={{ font: 'inherit', color: 'inherit', letterSpacing: 'inherit', lineHeight: 1.3 }}
      >
        {children}
      </Typography>
      <Box
        component="a"
        href={`#${id}`}
        className="heading-anchor"
        aria-label="Link to this section"
        sx={{
          color: 'text.disabled',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          '&:hover': { color: '#667eea' },
        }}
      >
        <LinkIcon sx={{ fontSize: '0.8em' }} />
      </Box>
    </Box>
  );
};
