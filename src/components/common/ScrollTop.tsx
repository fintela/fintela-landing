import { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { gradients } from '../../theme/tokens';

export const ScrollTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        right: { xs: 16, md: 24 },
        zIndex: 1000,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}
    >
      <IconButton
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        sx={{
          width: 44,
          height: 44,
          background: gradients.brand,
          color: '#fff',
          boxShadow: '0 14px 30px rgba(102,126,234,0.32)',
          '&:hover': {
            background: gradients.brand,
            transform: 'translateY(-2px)',
            boxShadow: '0 18px 40px rgba(102,126,234,0.42)',
          },
        }}
      >
        <ArrowUpwardIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
};
