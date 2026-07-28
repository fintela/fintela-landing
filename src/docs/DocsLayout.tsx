import { useState, useEffect, type ReactNode } from 'react';
import { Box, IconButton, Drawer, Typography, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer';
import { DocsSidebar } from './DocsSidebar';
import { DocsTOC, type TocItem } from './DocsTOC';
import { DocsSearch } from './DocsSearch';
import { adjacentPages, fullPath } from './nav';
import { KbdKey } from './components/KbdKey';

interface DocsLayoutProps {
  pageId: string;
  /** Breadcrumb chain (excluding "Docs" root). */
  breadcrumbs: { label: string; href?: string }[];
  /** Right-rail table of contents items. */
  toc?: TocItem[];
  children: ReactNode;
}

const SIDEBAR_WIDTH = 268;
const TOC_WIDTH = 240;

export const DocsLayout = ({ pageId, breadcrumbs, toc = [], children }: DocsLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { prev, next } = adjacentPages(pageId);

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

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <Header activeSection="documentation" onNavigate={() => undefined} />

      {/* Docs sub-header — search trigger + breadcrumbs */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 60, md: 72 },
          zIndex: 30,
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
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
              aria-label="Open documentation menu"
              onClick={() => setMobileNavOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.secondary' }}
            >
              <MenuIcon />
            </IconButton>
            <Breadcrumbs items={breadcrumbs} />
          </Box>

          {/* Search button */}
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSearchOpen(true);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.85,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fff',
              cursor: 'pointer',
              minWidth: { xs: 44, sm: 220 },
              transition: 'border-color 0.18s, box-shadow 0.18s',
              '&:hover': {
                borderColor: 'rgba(102,126,234,0.4)',
                boxShadow: '0 0 0 3px rgba(102,126,234,0.08)',
              },
            }}
          >
            <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Box
              component="span"
              sx={{
                flex: 1,
                color: 'text.disabled',
                fontSize: '0.82rem',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Search docs
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.25 }}>
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
            borderRight: '1px solid',
            borderColor: 'divider',
            // hide scroll till hover
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
            transition: 'scrollbar-color 0.2s',
            '&:hover': {
              scrollbarColor: 'rgba(11,16,32,0.18) transparent',
            },
          }}
        >
          <DocsSidebar />
        </Box>

        {/* Main */}
        <Box
          component="main"
          sx={{
            minWidth: 0,
            px: { xs: 2.5, md: 0 },
            py: { xs: 3, md: 5 },
          }}
        >
          <Box sx={{ maxWidth: 780, mx: { xs: 'auto', md: 0 } }}>
            {children}

            {/* Prev / Next nav */}
            {(prev || next) && (
              <Box
                sx={{
                  mt: 8,
                  pt: 4,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {prev ? (
                  <PrevNextCard direction="prev" title={prev.title} href={fullPath(prev)} />
                ) : (
                  <Box />
                )}
                {next && (
                  <PrevNextCard direction="next" title={next.title} href={fullPath(next)} />
                )}
              </Box>
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
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 300,
            bgcolor: '#fff',
            backgroundImage: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700 }}>Documentation</Typography>
          <IconButton aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DocsSidebar onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>

      <DocsSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Footer />
    </Box>
  );
};

const Breadcrumbs = ({ items }: { items: { label: string; href?: string }[] }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.25,
      fontSize: '0.85rem',
      color: 'text.secondary',
      overflow: 'hidden',
    }}
  >
    <RouterLink
      to="/documentation"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box component="span" sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
        Docs
      </Box>
    </RouterLink>
    {items.map((item, idx) => (
      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        {item.href ? (
          <RouterLink to={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box component="span" sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}>
              {item.label}
            </Box>
          </RouterLink>
        ) : (
          <Box
            component="span"
            sx={{
              color: 'text.primary',
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
  title,
  href,
}: {
  direction: 'prev' | 'next';
  title: string;
  href: string;
}) => (
  <Box
    component={RouterLink}
    to={href}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      p: 2,
      borderRadius: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      textDecoration: 'none',
      bgcolor: '#fff',
      transition: 'border-color 0.18s, transform 0.18s',
      gridColumn: direction === 'next' ? { xs: 'auto', sm: 2 } : undefined,
      flexDirection: direction === 'next' ? 'row-reverse' : 'row',
      textAlign: direction === 'next' ? 'right' : 'left',
      '&:hover': {
        borderColor: 'rgba(102,126,234,0.4)',
        transform: 'translateY(-1px)',
      },
    }}
  >
    {direction === 'next' ? (
      <ArrowForwardIcon sx={{ color: 'text.disabled' }} />
    ) : (
      <ArrowBackIcon sx={{ color: 'text.disabled' }} />
    )}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'text.disabled',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {direction === 'next' ? 'Next' : 'Previous'}
      </Typography>
      <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.95rem' }}>
        {title}
      </Typography>
    </Box>
  </Box>
);
