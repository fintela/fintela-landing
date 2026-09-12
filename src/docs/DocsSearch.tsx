import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Box, Modal, Typography, Fade, Backdrop } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { KbdKey } from './components/KbdKey';
import { searchDocs } from './search';
import { truncate } from '../content/format';
import { radii, shadows, soft } from '../theme/tokens';
import { eyebrowSx, floatPaperSx, neuFieldSx } from '../theme/neu';
import { Groove } from '../components/primitives/Groove';
import type { DocsIndex } from './types';

interface DocsSearchProps {
  open: boolean;
  onClose: () => void;
  /** The published set — the palette searches nothing else. */
  index: DocsIndex;
}

/** How many results the palette shows before it stops being a list. */
const MAX_HITS = 10;

/**
 * ⌘K search inside a documentation page.
 *
 * Scores through the same `searchDocs` the `/docs` search bar uses, so a query
 * that finds a page in one place finds it in the other. With no query it shows the
 * first pages in reading order, which makes the palette usable as a jump list.
 */
export const DocsSearch = ({ open, onClose, index }: DocsSearchProps) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const hits = useMemo(() => {
    if (!query.trim()) return index.pages.slice(0, 8);
    return searchDocs(index.pages, query)
      .slice(0, MAX_HITS)
      .map((hit) => hit.page);
  }, [index.pages, query]);

  const go = useCallback(
    (slug: string) => {
      navigate(`/docs/${slug}`);
      onClose();
    },
    [navigate, onClose],
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && hits[selected]) {
      e.preventDefault();
      go(hits[selected].slug);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { sx: { bgcolor: soft.scrim } },
      }}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 6, md: 12 },
      }}
    >
      <Fade in={open} timeout={160}>
        <Box
          tabIndex={-1}
          sx={{
            ...floatPaperSx,
            bgcolor: soft.ground,
            borderRadius: `${radii.neuCard}px`,
            position: 'relative',
            zIndex: 1,
            width: { xs: 'calc(100vw - 32px)', md: 640 },
            maxWidth: '100%',
            overflow: 'hidden',
            outline: 'none',
          }}
          onKeyDown={handleKey}
        >
          <Box
            sx={{
              ...neuFieldSx,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              mx: 2,
              mt: 2,
              px: 2,
              py: 1.25,
            }}
          >
            <SearchIcon sx={{ color: soft.textSecondary, fontSize: 20 }} />
            <Box
              component="input"
              ref={inputRef}
              type="text"
              placeholder="Search docs — strategies, fitness, errors, endpoints…"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value);
                setSelected(0);
              }}
              sx={{
                flex: 1,
                border: 'none',
                outline: 'none',
                font: 'inherit',
                fontSize: '0.95rem',
                color: soft.text,
                caretColor: soft.accent,
                bgcolor: 'transparent',
              }}
              aria-label="Search docs"
            />
            <Box onClick={onClose} sx={{ cursor: 'pointer', display: 'inline-flex' }}>
              <KbdKey>esc</KbdKey>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 420, overflowY: 'auto', py: 1, px: 1.5 }}>
            {hits.length === 0 ? (
              <Box
                sx={{
                  px: 2,
                  py: 4,
                  textAlign: 'center',
                  color: soft.textSecondary,
                  fontSize: '0.9rem',
                }}
              >
                No results for "{query}". Try "study", "fitness", or "endpoint".
              </Box>
            ) : (
              hits.map((page, idx) => (
                <Box
                  key={page.slug}
                  onMouseEnter={() => setSelected(idx)}
                  onClick={() => go(page.slug)}
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    my: 0.25,
                    borderRadius: `${radii.neuWell}px`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    ...(selected === idx && {
                      bgcolor: soft.groundSunken,
                      boxShadow: shadows.neuInsetSm,
                    }),
                    '@media (forced-colors: active)':
                      selected === idx ? { boxShadow: 'none', border: '2px solid Highlight' } : {},
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{ ...eyebrowSx, fontSize: '0.62rem', letterSpacing: '0.08em', mb: 0.25 }}
                    >
                      {page.section}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: soft.text, fontSize: '0.92rem' }}>
                      {page.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: soft.textSecondary,
                        fontSize: '0.82rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mt: 0.25,
                      }}
                    >
                      {truncate(page.excerpt, 110)}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon
                    sx={{
                      fontSize: 16,
                      color: selected === idx ? soft.accent : soft.textSecondary,
                      opacity: selected === idx ? 1 : 0.5,
                    }}
                  />
                </Box>
              ))
            )}
          </Box>

          <Groove sx={{ mx: 2 }} />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 2,
              py: 1,
              fontSize: '0.72rem',
              color: soft.textSecondary,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <KbdKey>↑</KbdKey>
              <KbdKey>↓</KbdKey>
              <Box component="span">navigate</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <KbdKey>↵</KbdKey>
              <Box component="span">open</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <KbdKey>esc</KbdKey>
              <Box component="span">close</Box>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};
