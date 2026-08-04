import { useMemo, useState, type ReactNode } from 'react';
import { Box, CircularProgress, Container, IconButton, Typography } from '@mui/material';
import { Close, MenuBook, Search, WifiOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { DocCard } from '../docs/DocCard';
import { useDocsIndex } from '../docs/useDocs';
import { bySection, sectionAccent } from '../docs/format';
import { searchDocs } from '../docs/search';

/**
 * `/docs` — the documentation index.
 *
 * Structurally the same page as `/blog`: hero, then a grid of preview cards read
 * at runtime from a static JSON payload the build generates out of `content/`. The
 * differences are the ones documentation needs — cards are grouped under section
 * headings in reading order instead of a flat newest-first grid, and a search bar
 * filters them.
 *
 * Search is client-side over the index that is already loaded (see
 * `src/docs/search.ts`), so filtering costs no request and works offline once the
 * page is open.
 */
export const DocsIndexPage = () => {
  const { t } = useTranslation('pages');
  const [activeSection, setActiveSection] = useState('documentation');
  const [query, setQuery] = useState('');
  const { status, index } = useDocsIndex();

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    if (section === 'home') window.location.href = '/';
  };

  const groups = useMemo(() => {
    const matching = query.trim()
      ? searchDocs(index.pages, query).map((hit) => hit.page)
      : index.pages;
    return bySection(index.sections, matching);
  }, [index, query]);

  const matchCount = groups.reduce((n, group) => n + group.pages.length, 0);
  const searching = query.trim().length > 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header activeSection={activeSection} onNavigate={scrollToSection} />

      {/* Hero */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 4, md: 6 },
          background:
            'linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, rgba(99, 102, 241, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                color: 'text.primary',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              }}
            >
              {t('docs.hero.title')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}
            >
              {t('docs.hero.subtitle')}
            </Typography>
          </Box>

          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              maxWidth: 560,
              mx: 'auto',
              px: 2,
              py: 1.25,
              borderRadius: 999,
              bgcolor: '#fff',
              border: '2px solid rgba(102, 126, 234, 0.14)',
              transition: 'border-color 0.18s, box-shadow 0.18s',
              '&:focus-within': {
                borderColor: '#0ea5e9',
                boxShadow: '0 0 0 4px rgba(14, 165, 233, 0.1)',
              },
            }}
          >
            <Search sx={{ color: 'text.disabled', fontSize: 20 }} />
            <Box
              component="input"
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder={t('docs.search.placeholder')}
              aria-label={t('docs.search.label')}
              sx={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                font: 'inherit',
                fontSize: '0.98rem',
                color: 'text.primary',
                bgcolor: 'transparent',
                // The native clear affordance would sit next to our own.
                '&::-webkit-search-cancel-button': { display: 'none' },
                '::placeholder': { color: 'text.disabled' },
              }}
            />
            {searching && (
              <IconButton
                size="small"
                aria-label={t('docs.search.clear')}
                onClick={() => setQuery('')}
                sx={{ color: 'text.disabled' }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </Box>

          {searching && status === 'ready' && (
            <Typography
              aria-live="polite"
              sx={{
                mt: 1.75,
                textAlign: 'center',
                color: 'text.secondary',
                fontSize: '0.85rem',
              }}
            >
              {t('docs.search.results', { count: matchCount })}
            </Typography>
          )}
        </Container>
      </Box>

      {/* Grid */}
      <Box sx={{ py: { xs: 4, md: 8 }, minHeight: '40vh' }}>
        <Container maxWidth="lg">
          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress size={28} sx={{ color: '#667eea' }} />
            </Box>
          )}

          {status !== 'loading' && groups.length === 0 && (
            <EmptyState
              // An unreachable CDN payload and genuinely empty docs look the same to
              // a visitor, but the copy should not pretend a failure is "no pages".
              icon={status === 'error' ? <WifiOff /> : <MenuBook />}
              title={
                status === 'error'
                  ? t('docs.error.title')
                  : searching
                    ? t('docs.search.empty.title')
                    : t('docs.empty.title')
              }
              body={
                status === 'error'
                  ? t('docs.error.body')
                  : searching
                    ? t('docs.search.empty.body', { query: query.trim() })
                    : t('docs.empty.body')
              }
            />
          )}

          {groups.map((group) => (
            <Box key={group.section} sx={{ mb: { xs: 5, md: 7 }, '&:last-of-type': { mb: 0 } }}>
              <SectionHeading section={group.section} count={group.pages.length} />
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 4,
                }}
              >
                {/* The generator already sorts pages by `order` within a section. */}
                {group.pages.map((page) => (
                  <DocCard key={page.slug} page={page} />
                ))}
              </Box>
            </Box>
          ))}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

const SectionHeading = ({ section, count }: { section: string; count: number }) => {
  const accent = sectionAccent(section);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
      <Box sx={{ width: 4, height: 26, borderRadius: 2, bgcolor: accent, flexShrink: 0 }} />
      <Typography
        variant="h5"
        component="h2"
        sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.3rem', md: '1.5rem' } }}
      >
        {section}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'text.disabled',
          letterSpacing: '0.06em',
        }}
      >
        {count}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', minWidth: 16 }} />
    </Box>
  );
};

const EmptyState = ({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) => (
  <Box sx={{ textAlign: 'center', py: { xs: 6, md: 10 }, px: 2 }}>
    <Box
      sx={{
        width: 72,
        height: 72,
        mx: 'auto',
        mb: 3,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(102, 126, 234, 0.08)',
        color: 'primary.main',
        '& svg': { fontSize: '2rem' },
      }}
    >
      {icon}
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
      {title}
    </Typography>
    <Typography sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', lineHeight: 1.7 }}>
      {body}
    </Typography>
  </Box>
);
