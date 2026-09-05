import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { palette } from '../theme/tokens';
import type { TocItem } from './toc';

interface DocsTOCProps {
  items: TocItem[];
}

export const DocsTOC = ({ items }: DocsTOCProps) => {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -65% 0px', threshold: [0, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 96,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        pt: 4,
        pl: 1,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.66rem',
          fontWeight: 700,
          color: 'text.disabled',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          mb: 1,
          pl: 1,
        }}
      >
        On this page
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((it) => (
          <Box
            component="a"
            key={it.id}
            href={`#${it.id}`}
            sx={{
              fontSize: '0.82rem',
              color: active === it.id ? palette.blue : 'text.secondary',
              fontWeight: active === it.id ? 600 : 400,
              py: 0.4,
              pl: it.level === 3 ? 2.25 : 1,
              borderLeft: '2px solid',
              borderLeftColor: active === it.id ? palette.blue : 'transparent',
              textDecoration: 'none',
              transition: 'color 0.18s, border-color 0.18s',
              lineHeight: 1.4,
              '&:hover': { color: 'text.primary' },
            }}
          >
            {it.title}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
