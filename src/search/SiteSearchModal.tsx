import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Modal, Typography, Fade, Backdrop } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { KbdKey } from '../docs/components/KbdKey';
import { truncate } from '../content/format';
import { radii, shadows, soft } from '../theme/tokens';
import { eyebrowSx, floatPaperSx, neuFieldSx } from '../theme/neu';
import { Groove } from '../components/primitives/Groove';
import { useSiteSearchIndex } from './useSiteSearchIndex';
import { searchSite } from './searchSite';

interface SiteSearchModalProps {
  open: boolean;
  onClose: () => void;
}

/** How many results show before the list stops being a list. */
const MAX_HITS = 8;

/**
 * The site-wide ⌘K palette — every marketing page, doc and blog post in one
 * ranked list. Opened from `Header`'s search button or the shortcut
 * (`SearchProvider`); styled to match `DocsSearch`, the in-docs palette this
 * sits alongside rather than replaces.
 */
export const SiteSearchModal = ({ open, onClose }: SiteSearchModalProps) => {
  const { t } = useTranslation('pages');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { entries } = useSiteSearchIndex();

  // Reset on every open, during render rather than in an effect: the palette
  // must not show the previous query for a frame before clearing it.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery('');
      setSelected(0);
    }
  }

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const hits = useMemo(() => {
    if (!query.trim()) return entries.filter((entry) => entry.kind === 'page');
    return searchSite(entries, query)
      .slice(0, MAX_HITS)
      .map((hit) => hit.entry);
  }, [entries, query]);

  const go = useCallback(
    (url: string) => {
      navigate(url);
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
      go(hits[selected].url);
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
              placeholder={t('search.placeholder')}
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
              aria-label={t('search.ariaLabel')}
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
                {t('search.noResults', { query })}
              </Box>
            ) : (
              hits.map((entry, idx) => (
                <Box
                  key={entry.id}
                  onMouseEnter={() => setSelected(idx)}
                  onClick={() => go(entry.url)}
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
                      {entry.section}
                    </Typography>
                    <Typography sx={{ fontWeight: 600, color: soft.text, fontSize: '0.92rem' }}>
                      {entry.title}
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
                      {truncate(entry.excerpt, 110)}
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
              <Box component="span">{t('docs.searchHints.navigate')}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <KbdKey>↵</KbdKey>
              <Box component="span">{t('docs.searchHints.open')}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <KbdKey>esc</KbdKey>
              <Box component="span">{t('docs.searchHints.close')}</Box>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};
