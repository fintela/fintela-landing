import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Box, Modal, Typography, Fade, Backdrop } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { KbdKey } from './components/KbdKey';
import { searchDocs } from './search';
import { truncate } from '../content/format';
import { palette } from '../theme/tokens';
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
        backdrop: { sx: { bgcolor: 'rgba(11,16,32,0.55)', backdropFilter: 'blur(6px)' } },
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
            position: 'relative',
            zIndex: 1,
            width: { xs: 'calc(100vw - 32px)', md: 640 },
            maxWidth: '100%',
            bgcolor: '#fff',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 30px 80px rgba(11,16,32,0.32)',
            overflow: 'hidden',
            outline: 'none',
          }}
          onKeyDown={handleKey}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
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
                color: 'text.primary',
                bgcolor: 'transparent',
                '::placeholder': { color: 'text.disabled' },
              }}
              aria-label="Search docs"
            />
            <Box
              onClick={onClose}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'text.disabled',
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace',
                '&:hover': { color: 'text.secondary' },
              }}
            >
              ESC
            </Box>
          </Box>

          <Box sx={{ maxHeight: 420, overflowY: 'auto', py: 0.5 }}>
            {hits.length === 0 ? (
              <Box
                sx={{
                  px: 2,
                  py: 4,
                  textAlign: 'center',
                  color: 'text.disabled',
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
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: selected === idx ? 'rgba(47,99,149,0.08)' : 'transparent',
                    borderLeft: '3px solid',
                    borderLeftColor: selected === idx ? palette.blue : 'transparent',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: 'text.disabled',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        mb: 0.25,
                      }}
                    >
                      {page.section}
                    </Typography>
                    <Typography
                      sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.92rem' }}
                    >
                      {page.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
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
                      color: selected === idx ? palette.blue : 'text.disabled',
                      opacity: selected === idx ? 1 : 0.5,
                    }}
                  />
                </Box>
              ))
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 2,
              py: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fafbfc',
              fontSize: '0.72rem',
              color: 'text.disabled',
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
