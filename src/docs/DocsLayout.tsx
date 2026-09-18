import { useState, useEffect, type ReactNode } from 'react';
import { Box, IconButton, Drawer, Typography, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { DocsSidebar } from './DocsSidebar';
import { DocsTOC } from './DocsTOC';
import type { TocItem } from './toc';
import { DocsSearch } from './DocsSearch';
import { KbdKey } from './components/KbdKey';
import { bySection } from './format';
import type { DocSummary, DocsIndex } from './types';
import { DOCS_HOME } from '../seo/routes';
import { radii, soft } from '../theme/tokens';
import {
  eyebrowSx,
  focusRingSx,
  grooveSx,
  neuFieldSx,
  neuIconButtonSx,
  quietLinkSx,
} from '../theme/neu';
import { NeuPanel } from '../components/primitives/NeuPanel';
import { Groove } from '../components/primitives/Groove';

interface DocsLayoutProps {
  /** The published set — sidebar, palette and prev/next all read from it. */
  index: DocsIndex;
  /** The page being read, once its summary is known. */
  current?: DocSummary | null;
  /** Right-rail table of contents, extracted from the page's Markdown. */
  toc?: TocItem[];
  children: ReactNode;
}

const SIDEBAR_WIDTH = 268;
const TOC_WIDTH = 240;

/**
 * Chrome around a single documentation page: sidebar, breadcrumbs, ⌘K search,
 * table-of-contents rail and prev/next footer.
 *
 * Everything it renders comes from `docs/index.json`. Before the migration this
 * component took a `pageId` and looked it up in a hand-written `nav.ts`; now the
 * ordering the sidebar shows, the breadcrumb section and the prev/next pair are
 * all consequences of the frontmatter in `content/docs/`.
 */
export const DocsLayout = ({ index, current, toc = [], children }: DocsLayoutProps) => {
  const { t } = useTranslation('pages');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { prev, next } = adjacent(index, current?.slug);

  // Cmd+K / Ctrl+K opens search globally inside docs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The section crumb is a real link — to the section's opening page — so a
  // reader (and a crawler) can step up a level without the sidebar. It goes
  // plain only when the current page *is* that opening page.
  const sectionHome = current ? sectionFirstPage(index, current.section) : null;
  const breadcrumbs = current
    ? [
        {
          label: current.section,
          href:
            sectionHome && sectionHome.slug !== current.slug
              ? `/docs/${sectionHome.slug}`
              : undefined,
        },
        { label: current.title },
      ]
    : [];

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header activeSection="documentation" onNavigate={() => undefined} />

      {/* Docs sub-header — search trigger + breadcrumbs */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 60, md: 72 },
          zIndex: 30,
          bgcolor: soft.ground,
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            ...grooveSx,
          },
          '@media (forced-colors: active)': { borderBottom: '1px solid CanvasText' },
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            maxWidth: 1440,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            py: 1.25,
            px: { xs: 2, md: 4 },
          }}
        >
          {/* Mobile sidebar toggle + breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
            <IconButton
              aria-label={t('docs.openMenu')}
              onClick={() => setMobileNavOpen(true)}
              sx={[neuIconButtonSx, { display: { xs: 'inline-flex', md: 'none' } }]}
            >
              <MenuIcon />
            </IconButton>
            <Breadcrumbs
              items={breadcrumbs}
              homeLabel={t('docs.crumb')}
              navLabel={t('docs.breadcrumb')}
            />
          </Box>

          {/* Search button. Its visible label is hidden on phones, so the
              accessible name is set explicitly. */}
          <Box
            role="button"
            tabIndex={0}
            aria-label={t('docs.searchDocs')}
            aria-keyshortcuts="Meta+K Control+K"
            onClick={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSearchOpen(true);
            }}
            sx={{
              ...neuFieldSx,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.85,
              borderRadius: `${radii.pill}px`,
              cursor: 'pointer',
              minWidth: { xs: 44, sm: 220 },
              ...focusRingSx,
            }}
          >
            <SearchIcon sx={{ fontSize: 16, color: soft.textSecondary }} />
            <Box
              component="span"
              sx={{
                flex: 1,
                color: soft.textSecondary,
                fontSize: '0.82rem',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {t('docs.searchDocs')}
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5 }}>
              <KbdKey>⌘</KbdKey>
              <KbdKey>K</KbdKey>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main 3-column layout */}
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1440,
          mx: 'auto',
          px: { xs: 0, md: 4 },
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: `${SIDEBAR_WIDTH}px 1fr`,
            lg: `${SIDEBAR_WIDTH}px 1fr ${TOC_WIDTH}px`,
          },
          gap: { md: 4 },
        }}
      >
        {/* Sidebar (desktop) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 124,
            alignSelf: 'start',
            height: 'calc(100vh - 124px)',
            overflowY: 'auto',
            // hide scroll till hover
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
            transition: 'scrollbar-color 0.2s',
            '&:hover': { scrollbarColor: `${soft.scrollbar} transparent` },
          }}
        >
          <DocsSidebar index={index} currentSlug={current?.slug} />
        </Box>

        {/* Main — `#content` is the Header's skip-link target on every page. */}
        <Box
          component="main"
          id="content"
          sx={{ minWidth: 0, px: { xs: 3, md: 0 }, py: { xs: 3, md: 5 } }}
        >
          <Box sx={{ maxWidth: 780, mx: { xs: 'auto', md: 0 } }}>
            <NeuPanel sx={{ p: { xs: 3, md: 5 } }}>{children}</NeuPanel>

            {/* Prev / Next nav */}
            {(prev || next) && (
              <>
                <Groove sx={{ mt: 8, mb: 4 }} />
                <Box
                  sx={{
                    mt: 0,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3,
                  }}
                >
                  {prev ? (
                    <PrevNextCard
                      direction="prev"
                      label={t('docs.previous')}
                      title={prev.title}
                      href={`/docs/${prev.slug}`}
                    />
                  ) : (
                    <Box />
                  )}
                  {next && (
                    <PrevNextCard
                      direction="next"
                      label={t('docs.next')}
                      title={next.title}
                      href={`/docs/${next.slug}`}
                    />
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* TOC (desktop wide) */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <DocsTOC items={toc} />
        </Box>
      </Container>

      {/* Mobile sidebar drawer */}
      <Drawer
        anchor="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { elevation: 0, sx: { width: 300 } } }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>{t('docs.menuTitle')}</Typography>
          <IconButton
            aria-label={t('docs.closeMenu')}
            onClick={() => setMobileNavOpen(false)}
            sx={neuIconButtonSx}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Groove sx={{ mx: 2 }} />
        <DocsSidebar
          index={index}
          currentSlug={current?.slug}
          onNavigate={() => setMobileNavOpen(false)}
        />
      </Drawer>

      <DocsSearch open={searchOpen} onClose={() => setSearchOpen(false)} index={index} />

      <Footer />
    </Box>
  );
};

/**
 * Neighbours in reading order — the order the sidebar shows, which is section
 * order then page order. Walking the grouped list rather than `index.pages`
 * keeps prev/next in step with the sidebar even if the generator's flat order
 * ever changes.
 */
function adjacent(index: DocsIndex, slug: string | undefined) {
  if (!slug) return { prev: null, next: null };
  const flat = bySection(index.sections, index.pages).flatMap((g) => g.pages);
  const at = flat.findIndex((p) => p.slug === slug);
  if (at === -1) return { prev: null, next: null };
  return {
    prev: at > 0 ? flat[at - 1] : null,
    next: at < flat.length - 1 ? flat[at + 1] : null,
  };
}

/** The page a section opens with — the first in the order the sidebar shows. */
function sectionFirstPage(index: DocsIndex, section: string): DocSummary | null {
  const group = bySection(index.sections, index.pages).find((g) => g.section === section);
  return group?.pages[0] ?? null;
}

const Breadcrumbs = ({
  items,
  homeLabel,
  navLabel,
}: {
  items: { label: string; href?: string }[];
  /** The first crumb's text — "Docs". */
  homeLabel: string;
  /** The landmark's accessible name — "Breadcrumb". */
  navLabel: string;
}) => (
  <Box
    component="nav"
    aria-label={navLabel}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.25,
      fontSize: '0.85rem',
      color: soft.textSecondary,
      minWidth: 0,
    }}
  >
    {/* `/docs` itself only redirects; link straight to the overview so the
        crumb is a 200 for readers and crawlers alike. */}
    <Box
      component={RouterLink}
      to={DOCS_HOME}
      sx={[quietLinkSx, { '@media (hover: hover)': { '&:hover': { color: soft.text } } }]}
    >
      {homeLabel}
    </Box>
    {items.map((item, idx) => (
      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <ChevronRightIcon sx={{ fontSize: 14, color: soft.textSecondary }} />
        {item.href ? (
          <Box
            component={RouterLink}
            to={item.href}
            sx={[quietLinkSx, { '@media (hover: hover)': { '&:hover': { color: soft.text } } }]}
          >
            {item.label}
          </Box>
        ) : (
          <Box
            component="span"
            sx={{
              color: soft.text,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </Box>
        )}
      </Box>
    ))}
  </Box>
);

const PrevNextCard = ({
  direction,
  label,
  title,
  href,
}: {
  direction: 'prev' | 'next';
  /** The translated eyebrow — "Previous" / "Next". */
  label: string;
  title: string;
  href: string;
}) => (
  <NeuPanel
    variant="tile"
    to={href}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      p: 2,
      gridColumn: direction === 'next' ? { xs: 'auto', sm: 2 } : undefined,
      flexDirection: direction === 'next' ? 'row-reverse' : 'row',
      textAlign: direction === 'next' ? 'right' : 'left',
      '@media (hover: hover)': { '&:hover svg': { color: soft.accent } },
    }}
  >
    {direction === 'next' ? (
      <ArrowForwardIcon sx={{ color: soft.textSecondary }} />
    ) : (
      <ArrowBackIcon sx={{ color: soft.textSecondary }} />
    )}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={eyebrowSx}>{label}</Typography>
      <Typography sx={{ fontWeight: 600, color: soft.text, fontSize: '0.95rem' }}>
        {title}
      </Typography>
    </Box>
  </NeuPanel>
);
