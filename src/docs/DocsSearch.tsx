import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Box, Modal, Typography, Fade, Backdrop, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { allDocPages, fullPath } from './nav';
import { KbdKey } from './components/KbdKey';
import { docRegistry } from './registry';
import { docUrl } from './utils/anchors';
import './blocks'; // ensure block registry is populated

interface DocsSearchProps {
  open: boolean;
  onClose: () => void;
}

interface PageHit {
  kind: 'page';
  id: string;
  title: string;
  groupTitle: string;
  summary: string;
  href: string;
  score: number;
}

interface BlockHit {
  kind: 'block';
  id: string;
  title: string;
  groupTitle: string;
  summary: string;
  href: string;
  score: number;
}

type SearchHit = PageHit | BlockHit;

const scorePage = (
  query: string,
  page: (typeof allDocPages)[number],
): PageHit | null => {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  const fields = [
    page.title.toLowerCase(),
    page.summary.toLowerCase(),
    ...(page.keywords ?? []).map((k) => k.toLowerCase()),
    page.groupTitle.toLowerCase(),
  ];
  let best = -1;
  fields.forEach((h, idx) => {
    const i = h.indexOf(q);
    if (i === -1) return;
    const s = (idx === 0 ? 100 : idx === 1 ? 50 : 30) - i + (h.startsWith(q) ? 10 : 0);
    if (s > best) best = s;
  });
  if (best < 0) return null;
  return {
    kind: 'page',
    id: page.id,
    title: page.title,
    groupTitle: page.groupTitle,
    summary: page.summary,
    href: fullPath(page),
    score: best,
  };
};

const scoreBlock = (
  query: string,
  block: ReturnType<typeof docRegistry.getBlock>,
): BlockHit | null => {
  if (!block) return null;
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const titleMatch = block.meta.title.toLowerCase().includes(q);
  const summaryMatch = block.meta.summary.toLowerCase().includes(q);
  const keywordMatch = [...block.meta.tags, ...block.meta.keywords].some((k) =>
    k.toLowerCase().includes(q),
  );

  const s = (titleMatch ? 80 : 0) + (summaryMatch ? 40 : 0) + (keywordMatch ? 20 : 0);
  if (s === 0) return null;

  return {
    kind: 'block',
    id: block.meta.id,
    title: block.meta.title,
    groupTitle: block.meta.category.replace(/-/g, ' '),
    summary: block.meta.summary,
    href: docUrl(block.meta.docPath),
    score: s,
  };
};

export const DocsSearch = ({ open, onClose }: DocsSearchProps) => {
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

  const hits = useMemo<SearchHit[]>(() => {
    if (!query.trim()) {
      return allDocPages.slice(0, 8).map((page) => ({
        kind: 'page' as const,
        id: page.id,
        title: page.title,
        groupTitle: page.groupTitle,
        summary: page.summary,
        href: fullPath(page),
        score: 0,
      }));
    }

    const pageHits = allDocPages
      .map((p) => scorePage(query, p))
      .filter((h): h is PageHit => h !== null);

    const blockHits = docRegistry
      .getAll()
      .map((b) => scoreBlock(query, b))
      .filter((h): h is BlockHit => h !== null);

    // Merge, deduplicate by href, sort by score
    const seen = new Set<string>();
    return [...pageHits, ...blockHits]
      .sort((a, b) => b.score - a.score)
      .filter((h) => {
        if (seen.has(h.href)) return false;
        seen.add(h.href);
        return true;
      })
      .slice(0, 10);
  }, [query]);

  const go = useCallback(
    (hit: SearchHit) => {
      navigate(hit.href);
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
      go(hits[selected]);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(11,16,32,0.55)', backdropFilter: 'blur(6px)' },
        },
      }}
      sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: { xs: 6, md: 12 } }}
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
          {/* Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
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

          {/* Results */}
          <Box sx={{ maxHeight: 420, overflowY: 'auto', py: 0.5 }}>
            {hits.length === 0 ? (
              <Box sx={{ px: 2, py: 4, textAlign: 'center', color: 'text.disabled', fontSize: '0.9rem' }}>
                No results for "{query}". Try "study", "fitness", or "endpoint".
              </Box>
            ) : (
              hits.map((hit, idx) => (
                <Box
                  key={`${hit.kind}-${hit.id}`}
                  onMouseEnter={() => setSelected(idx)}
                  onClick={() => go(hit)}
                  sx={{
                    px: 2,
                    py: 1.25,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: selected === idx ? 'rgba(102,126,234,0.08)' : 'transparent',
                    borderLeft: '3px solid',
                    borderLeftColor: selected === idx ? '#667eea' : 'transparent',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: 'text.disabled',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {hit.groupTitle}
                      </Typography>
                      {hit.kind === 'block' && (
                        <Chip
                          label="section"
                          size="small"
                          sx={{
                            height: 14,
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(102,126,234,0.08)',
                            color: '#667eea',
                            border: 'none',
                          }}
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.92rem' }}>
                      {hit.title}
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
                      {hit.summary}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon
                    sx={{
                      fontSize: 16,
                      color: selected === idx ? '#667eea' : 'text.disabled',
                      opacity: selected === idx ? 1 : 0.5,
                    }}
                  />
                </Box>
              ))
            )}
          </Box>

          {/* Footer hints */}
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
