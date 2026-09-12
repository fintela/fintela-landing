import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { soft } from '../theme/tokens';
import { navPillSx } from '../theme/neu';
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
        pr: 0.5,
        pb: 0.5,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.66rem',
          fontWeight: 700,
          color: soft.textSecondary,
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
            className={active === it.id ? 'is-active' : undefined}
            sx={[
              navPillSx,
              {
                display: 'block',
                fontSize: '0.82rem',
                py: 0.4,
                px: 1,
                pl: it.level === 3 ? 2.25 : 1,
                lineHeight: 1.4,
                '&:focus-visible': { outlineOffset: 1 },
              },
            ]}
          >
            {it.title}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
