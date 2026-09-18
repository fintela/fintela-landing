import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import { truncate } from '../content/format';
import { radii, shadows, soft } from '../theme/tokens';
import { eyebrowSx, focusRingSx, neuFieldSx } from '../theme/neu';
import { useSiteSearchIndex } from './useSiteSearchIndex';
import { searchSite } from './searchSite';

/** How many inline results show below the field. */
const MAX_HITS = 6;

/**
 * A plain search field with an inline results list underneath — no modal,
 * no backdrop, no `esc`-to-close. For the 404 page: someone who lands there
 * wants a second chance at finding the page, not a command palette.
 * Shares the index and scorer with `SiteSearchModal`.
 */
export const SiteSearchBar = () => {
  const { t } = useTranslation('pages');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { entries } = useSiteSearchIndex();

  const hits = useMemo(() => {
    if (!query.trim()) return [];
    return searchSite(entries, query)
      .slice(0, MAX_HITS)
      .map((hit) => hit.entry);
  }, [entries, query]);

  return (
    <Box sx={{ textAlign: 'left' }}>
      <Box
        sx={{
          ...neuFieldSx,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.1,
          borderRadius: `${radii.pill}px`,
        }}
      >
        <SearchIcon sx={{ color: soft.textSecondary, fontSize: 18 }} />
        <Box
          component="input"
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.ariaLabel')}
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
        />
      </Box>

      {hits.length > 0 && (
        <Box
          sx={{
            mt: 1.5,
            borderRadius: `${radii.neuInner}px`,
            bgcolor: soft.ground,
            boxShadow: shadows.neuInsetSm,
            p: 1,
          }}
        >
          {hits.map((entry) => (
            <Box
              key={entry.id}
              component="button"
              type="button"
              onClick={() => navigate(entry.url)}
              sx={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: `${radii.neuWell}px`,
                px: 1.5,
                py: 1,
                '@media (hover: hover)': { '&:hover': { bgcolor: soft.groundSunken } },
                ...focusRingSx,
              }}
            >
              <Typography sx={{ ...eyebrowSx, fontSize: '0.6rem', letterSpacing: '0.08em', mb: 0.25 }}>
                {entry.section}
              </Typography>
              <Typography sx={{ fontWeight: 600, color: soft.text, fontSize: '0.9rem' }}>
                {entry.title}
              </Typography>
              <Typography
                sx={{
                  color: soft.textSecondary,
                  fontSize: '0.8rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {truncate(entry.excerpt, 100)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {query.trim().length > 0 && hits.length === 0 && (
        <Typography sx={{ mt: 1.5, color: soft.textSecondary, fontSize: '0.85rem', textAlign: 'center' }}>
          {t('search.noResults', { query })}
        </Typography>
      )}
    </Box>
  );
};
