import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react';
import {
  AppBar,
  Box,
  Button,
  ClickAwayListener,
  Drawer,
  Grow,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Toolbar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import fintelaLargeLogo from '../../assets/logos/fintela_logo_2.png';
import { motion, radii, shadows, soft } from '../../theme/tokens';
import { eyebrowSx, focusRingSx, navPillMobileSx, navPillSx, neuIconButtonSx, srOnly } from '../../theme/neu';
import { NeuButton } from '../primitives/NeuButton';
import { Groove } from '../primitives/Groove';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AUDIENCES } from '../../lib/audience';
import { SOLUTION_PATHS } from '../../solutions/registry';
import { DOCS_HOME } from '../../seo/routes';
import { useSearchPalette } from '../../search/searchContext';

interface HeaderProps {
  /** The home page's scroll-spy; pages without in-page bands leave both unset. */
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

type NavItem = {
  id: string;
  /** i18n key (within the `header` namespace) for the nav label. */
  labelKey: string;
  /** Where the anchor points: a home band (`/#platform`) or a route. */
  href: string;
  /**
   * 'route' and 'home' both render a plain router Link and share `isActive`'s
   * exact-path check; 'home' additionally forces the scroll-to-top a same-page
   * click needs (see `handleNavClick`) — the router replaces the history entry
   * in place when the path does not change, so nothing else would scroll it.
   */
  type: 'scroll' | 'route' | 'home';
  /**
   * Marks the item current for every path under this prefix when that differs
   * from the link target (the docs link lands on the overview, but every
   * `/docs/*` page is "in the docs").
   */
  activePrefix?: string;
};

/**
 * The Product menu: Agentic AI and Samplers, each its own route. A
 * menu rather than top-level items keeps the bar from growing every
 * time a product area gets its own page.
 */
const PRODUCT_ITEMS: NavItem[] = [
  { id: 'fintelligent', labelKey: 'nav.fintelagent', href: '/product/agentic-ai', type: 'route' },
  { id: 'samplers', labelKey: 'nav.samplers', href: '/product/samplers', type: 'route' },
  { id: 'inDepthAnalysis', labelKey: 'nav.inDepthAnalysis', href: '/product/in-depth-analysis', type: 'route' },
  { id: 'fintelaApi', labelKey: 'nav.fintelaApi', href: '/product/fintela-api', type: 'route' },
];

/**
 * The very first control in the bar — ahead of the Product/Solutions menu
 * buttons, which are hardcoded JSX rather than entries in `navItems` and so
 * need this pulled out separately to render before them.
 */
const HOME_ITEM: NavItem = { id: 'home', labelKey: 'nav.home', href: '/', type: 'home' };

const navItems: NavItem[] = [
  { id: 'pricing', labelKey: 'nav.pricing', href: '/pricing', type: 'route' },
  { id: 'documentation', labelKey: 'nav.documentation', href: DOCS_HOME, type: 'route', activePrefix: '/docs' },
  { id: 'blog', labelKey: 'nav.blog', href: '/blog', type: 'route' },
];

/**
 * Warms a route's chunk when its nav item is hovered or focused, so the click
 * lands on code that is already in the cache. The specifiers are the ones
 * `App.tsx` lazy-loads, so Vite resolves each to that route's chunk rather
 * than a second copy.
 */
const PREFETCH: Record<string, () => Promise<unknown>> = {
  pricing: () => import('../../pages/PricingPage'),
  documentation: () => import('../../pages/DocPage'),
  blog: () => import('../../pages/BlogPage'),
  solutions: () => import('../../pages/SolutionPage'),
  fintelligent: () => import('../../pages/AgenticAiPage'),
  samplers: () => import('../../pages/SamplersPage'),
  inDepthAnalysis: () => import('../../pages/InDepthAnalysisPage'),
  fintelaApi: () => import('../../pages/FintelaApiPage'),
  product: () =>
    Promise.all([
      import('../../pages/AgenticAiPage'),
      import('../../pages/SamplersPage'),
      import('../../pages/InDepthAnalysisPage'),
      import('../../pages/FintelaApiPage'),
    ]),
};

const prefetch = (id: string) => {
  // A failed prefetch is not an error the user needs to hear about; the click
  // will load the chunk the normal way.
  void PREFETCH[id]?.().catch(() => undefined);
};

/** The section id a band link scrolls to: `/#platform` → `platform`. */
const bandId = (item: NavItem) => item.href.replace(/^\/#/, '');

const navPillButtonSx = {
  px: 1.75,
  py: 0.75,
  minHeight: 36,
  fontSize: '0.92rem',
  borderRadius: `${radii.pill}px`,
  textTransform: 'none',
} as const;

/**
 * Product and The Desk open a dropdown rather than landing on a single page,
 * so navPillSx's gradient underline (meant to mark the current page) has
 * nothing correct to point at here — it stays visible via aria-current
 * whenever a menu item is active, which reads as a stray line under the
 * trigger. Drop the rule for these two; the accent color/weight still marks
 * them active.
 */
const navMenuTriggerSx = {
  '&::after': { display: 'none' },
} as const;

/** The theme's MuiMenu paper, for the Popper the Solutions menu renders into. */
const menuPaperSx = {
  bgcolor: soft.surfaceRaised,
  backgroundImage: 'none',
  border: '1px solid transparent',
  borderRadius: `${radii.neuInner}px`,
  boxShadow: shadows.neuFloat,
  mt: 1,
  minWidth: 160,
  p: 0.75,
  '@media (forced-colors: active)': { boxShadow: 'none', borderColor: 'CanvasText' },
} as const;

/**
 * Visually hidden until it takes focus, then a raised pill over the bar: the
 * first tab stop on every page, pointing at the page's `<main id="content">`.
 */
const skipLinkSx = {
  ...srOnly,
  '&:focus, &:focus-visible': {
    position: 'fixed',
    top: 12,
    left: 12,
    // Above the sticky AppBar (theme.zIndex.appBar is 1100).
    zIndex: 1200,
    width: 'auto',
    height: 'auto',
    margin: 0,
    padding: '10px 16px',
    clip: 'auto',
    overflow: 'visible',
    bgcolor: soft.surfaceRaised,
    color: soft.accent,
    fontWeight: 700,
    fontSize: '0.9rem',
    textDecoration: 'none',
    borderRadius: `${radii.neuWell}px`,
    boxShadow: shadows.neuFloat,
    outline: `2px solid ${soft.accent}`,
    outlineOffset: 2,
  },
} as const;

export const Header = ({ activeSection, onNavigate }: HeaderProps) => {
  const { t } = useTranslation('header');
  const { openSearch } = useSearchPalette();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  // The trigger element, held in state (a callback ref) rather than a ref so
  // it can be read during render as the Popper's anchor.
  const [solutionsButton, setSolutionsButton] = useState<HTMLButtonElement | null>(null);
  const [productButton, setProductButton] = useState<HTMLButtonElement | null>(null);
  const onSolutions = location.pathname.startsWith('/solutions');

  const isActive = (item: NavItem) => {
    if (item.type === 'route' || item.type === 'home') {
      const prefix = item.activePrefix ?? item.href;
      return location.pathname === prefix || location.pathname.startsWith(prefix + '/');
    }
    return location.pathname === '/' && activeSection === bandId(item);
  };
  const onProduct = PRODUCT_ITEMS.some((item) => isActive(item));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Focus goes back to the trigger when the menu closes from the keyboard
  // (Escape, Tab), so the tab sequence resumes where it left the bar.
  const wasSolutionsOpen = useRef(solutionsOpen);
  useEffect(() => {
    if (wasSolutionsOpen.current && !solutionsOpen) solutionsButton?.focus();
    wasSolutionsOpen.current = solutionsOpen;
  }, [solutionsOpen, solutionsButton]);

  const wasProductOpen = useRef(productOpen);
  useEffect(() => {
    if (wasProductOpen.current && !productOpen) productButton?.focus();
    wasProductOpen.current = productOpen;
  }, [productOpen, productButton]);

  /**
   * Every item is a real anchor, so crawlers, middle-clicks and "open in new
   * tab" all work. A plain click on a band item is intercepted: on the home
   * page it scrolls in place (the router would only change the hash), from
   * anywhere else it navigates home and hands the target over in state, the
   * way the footer does. Route items are left to the router.
   */
  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    setMobileOpen(false);
    if (item.type === 'home') {
      // Same-page click: the router replaces the entry in place and nothing
      // else scrolls, so this does — the logo's own home link carries the
      // identical fix, for the identical reason.
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    if (item.type !== 'scroll') return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    if (location.pathname === '/' && onNavigate) {
      onNavigate(bandId(item));
    } else {
      navigate('/', { state: { scrollTo: bandId(item) } });
    }
  };

  const closeSolutions = (event?: Event | SyntheticEvent) => {
    // The trigger toggles on its own click; a click-away that also closed
    // would reopen it on the same press.
    if (event && solutionsButton?.contains(event.target as Node)) return;
    setSolutionsOpen(false);
  };

  const onSolutionsKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setSolutionsOpen(false);
    } else if (e.key === 'Escape') {
      setSolutionsOpen(false);
    }
  };

  const closeProduct = (event?: Event | SyntheticEvent) => {
    if (event && productButton?.contains(event.target as Node)) return;
    setProductOpen(false);
  };

  const onProductKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      setProductOpen(false);
    } else if (e.key === 'Escape') {
      setProductOpen(false);
    }
  };

  const handleProductItemClick = (e: MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    setProductOpen(false);
    handleNavClick(e, item);
  };

  /**
   * The skip link's target is the page's `<main id="content">`. It is focused
   * directly rather than through the hash, which keeps the URL clean and, on
   * the home page, keeps the hash-scroll effect out of it. Without a `<main>`
   * the browser follows the href as usual.
   */
  const skipToContent = (e: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById('content');
    if (!main) return;
    e.preventDefault();
    main.setAttribute('tabindex', '-1');
    main.style.outline = 'none';
    main.focus();
  };

  return (
    <>
      <Box component="a" href="#content" onClick={skipToContent} sx={skipLinkSx}>
        {t('aria.skipToContent')}
      </Box>

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: soft.ground,
          color: soft.text,
          // The theme's MuiPaper radius (10px) reaches the AppBar even though it is
          // `square`; without this the bar's corners curve up once it casts neuBar.
          borderRadius: 0,
          boxShadow: scrolled ? shadows.neuBar : 'none',
          transition: `box-shadow ${motion.base}`,
          '@media (forced-colors: active)': { boxShadow: 'none', borderBottom: scrolled ? '1px solid CanvasText' : 0 },
          '@media print': { boxShadow: 'none' },
        }}
      >
        <Toolbar
          sx={{
            // xs: just the logo and the actions cluster (nav is display:none
            // below md) — plain space-between, edge to edge, as before.
            // md+: a 3-column grid. The two outer tracks are equal 1fr's, so
            // the nav sits at the bar's true geometric center regardless of
            // the logo and actions cluster being different widths — a flex
            // `space-between` with 3 children only centers the middle one
            // when its neighbours happen to match width, which logo/actions
            // never do here.
            display: { xs: 'flex', md: 'grid' },
            justifyContent: { xs: 'space-between' },
            gridTemplateColumns: { md: '1fr auto 1fr' },
            alignItems: 'center',
            py: { xs: 1, md: 1.25 },
            px: { xs: 2, md: 4 },
            minHeight: { xs: 60, md: 72 },
            maxWidth: 1280,
            mx: 'auto',
            width: '100%',
          }}
        >
          {/* Logo: a real link home. The intrinsic size keeps the row from
              reflowing while the file arrives (CSS still sets the height). */}
          <Box
            component={RouterLink}
            to="/"
            aria-label={t('aria.home')}
            // Same-page click: the router replaces the entry in place and
            // nothing else scrolls, so this does.
            onClick={() => window.scrollTo(0, 0)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: { xs: 17, md: 22 },
              borderRadius: `${radii.neuWell}px`,
              justifySelf: 'start',
              ...focusRingSx,
            }}
          >
            <img
              src={fintelaLargeLogo}
              alt="Fintela"
              width={442}
              height={154}
              style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </Box>

          {/* Desktop navigation: a landmark of anchors. The Product and
              Solutions menus are Poppers kept mounted in place (no portal),
              so their links are in the prerendered HTML and the DOM whether
              or not they are open. */}
          <Box
            component="nav"
            aria-label={t('aria.primaryNav')}
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 0.5,
              alignItems: 'center',
              justifySelf: 'center',
            }}
          >
            <Button
              component={RouterLink}
              to={HOME_ITEM.href}
              onClick={(e: MouseEvent<HTMLAnchorElement>) => handleNavClick(e, HOME_ITEM)}
              disableRipple
              aria-current={isActive(HOME_ITEM) ? 'page' : undefined}
              sx={[navPillSx, navPillButtonSx]}
            >
              {t(HOME_ITEM.labelKey)}
            </Button>
            <Button
              id="product-menu-button"
              ref={setProductButton}
              onClick={() => setProductOpen((open) => !open)}
              onMouseEnter={() => prefetch('product')}
              onFocus={() => prefetch('product')}
              disableRipple
              aria-haspopup="menu"
              aria-controls={productOpen ? 'product-menu' : undefined}
              aria-expanded={productOpen || undefined}
              aria-current={onProduct ? 'page' : undefined}
              className={productOpen ? 'is-active' : undefined}
              endIcon={<ExpandMoreIcon sx={{ fontSize: '18px !important', ml: -0.5 }} />}
              sx={[navPillSx, navPillButtonSx, { pr: 1.25 }, navMenuTriggerSx]}
            >
              {t('nav.product')}
            </Button>
            <Button
              id="solutions-menu-button"
              ref={setSolutionsButton}
              onClick={() => setSolutionsOpen((open) => !open)}
              onMouseEnter={() => prefetch('solutions')}
              onFocus={() => prefetch('solutions')}
              disableRipple
              aria-haspopup="menu"
              aria-controls={solutionsOpen ? 'solutions-menu' : undefined}
              aria-expanded={solutionsOpen || undefined}
              aria-current={onSolutions ? 'page' : undefined}
              className={solutionsOpen ? 'is-active' : undefined}
              endIcon={<ExpandMoreIcon sx={{ fontSize: '18px !important', ml: -0.5 }} />}
              sx={[navPillSx, navPillButtonSx, { pr: 1.25 }, navMenuTriggerSx]}
            >
              {t('nav.solutions')}
            </Button>
            {navItems.map((item) => (
              <Button
                key={item.id}
                component={RouterLink}
                to={item.href}
                onClick={(e: MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item)}
                onMouseEnter={() => prefetch(item.id)}
                onFocus={() => prefetch(item.id)}
                disableRipple
                aria-current={isActive(item) ? 'page' : undefined}
                sx={[navPillSx, navPillButtonSx]}
              >
                {t(item.labelKey)}
              </Button>
            ))}
            <Popper
              open={productOpen}
              anchorEl={productButton}
              placement="bottom-start"
              role={undefined}
              transition
              keepMounted
              disablePortal
            >
              {({ TransitionProps }) => (
                <Grow {...TransitionProps} style={{ transformOrigin: 'left top' }}>
                  <Paper sx={menuPaperSx}>
                    <ClickAwayListener onClickAway={closeProduct}>
                      <MenuList
                        id="product-menu"
                        aria-labelledby="product-menu-button"
                        autoFocusItem={productOpen}
                        onKeyDown={onProductKeyDown}
                        sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}
                      >
                        {PRODUCT_ITEMS.map((item) => (
                          <MenuItem
                            key={item.id}
                            component={RouterLink}
                            to={item.href}
                            onClick={(e: MouseEvent<HTMLAnchorElement>) => handleProductItemClick(e, item)}
                            selected={isActive(item)}
                            aria-current={isActive(item) ? 'page' : undefined}
                            sx={[
                              navPillSx,
                              {
                                px: 1.75,
                                py: 1,
                                fontSize: '0.92rem',
                                minWidth: 200,
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                '&::after': { display: 'none' },
                              },
                            ]}
                          >
                            {t(item.labelKey)}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
            <Popper
              open={solutionsOpen}
              anchorEl={solutionsButton}
              placement="bottom-start"
              role={undefined}
              transition
              keepMounted
              disablePortal
            >
              {({ TransitionProps }) => (
                <Grow {...TransitionProps} style={{ transformOrigin: 'left top' }}>
                  <Paper sx={menuPaperSx}>
                    <ClickAwayListener onClickAway={closeSolutions}>
                      <MenuList
                        id="solutions-menu"
                        aria-labelledby="solutions-menu-button"
                        autoFocusItem={solutionsOpen}
                        onKeyDown={onSolutionsKeyDown}
                        sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}
                      >
                        {AUDIENCES.map((a) => (
                          <MenuItem
                            key={a}
                            component={RouterLink}
                            to={SOLUTION_PATHS[a]}
                            onClick={() => setSolutionsOpen(false)}
                            selected={location.pathname === SOLUTION_PATHS[a]}
                            aria-current={location.pathname === SOLUTION_PATHS[a] ? 'page' : undefined}
                            sx={[
                              navPillSx,
                              {
                                px: 1.75,
                                py: 1,
                                fontSize: '0.92rem',
                                minWidth: 200,
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                '&::after': { display: 'none' },
                              },
                            ]}
                          >
                            {t(`solutions.${a}`)}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, alignItems: 'center', justifySelf: 'end' }}>
            <IconButton
              aria-label={t('aria.search')}
              aria-keyshortcuts="Meta+K Control+K"
              onClick={openSearch}
              sx={neuIconButtonSx}
            >
              <SearchIcon />
            </IconButton>
            <LanguageSwitcher />
            <NeuButton tone="accent" size="sm" sx={{ px: { xs: 2, md: 2.5 } }}>
              {t('actions.getStarted')}
            </NeuButton>

            <IconButton
              aria-label={t('aria.openMenu')}
              sx={[neuIconButtonSx, { display: { xs: 'inline-flex', md: 'none' } }]}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Kept mounted so its anchors are in the DOM before it is ever opened;
          MUI hides it (visibility) while closed. */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ root: { keepMounted: true }, paper: { elevation: 0, sx: { width: 300 } } }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
          }}
        >
          <Box sx={{ height: 18 }}>
            <img
              src={fintelaLargeLogo}
              alt="Fintela"
              width={442}
              height={154}
              style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </Box>
          <IconButton
            aria-label={t('aria.closeMenu')}
            onClick={() => setMobileOpen(false)}
            sx={neuIconButtonSx}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Groove sx={{ mx: 3 }} />

        <Box component="nav" aria-label={t('aria.primaryNav')}>
          <List disablePadding sx={{ pt: 1 }}>
            <ListItem disablePadding>
              <ListItemButton
                component={RouterLink}
                to={HOME_ITEM.href}
                onClick={(e: MouseEvent<HTMLAnchorElement>) => handleNavClick(e, HOME_ITEM)}
                selected={isActive(HOME_ITEM)}
                aria-current={isActive(HOME_ITEM) ? 'page' : undefined}
                sx={[navPillSx, navPillMobileSx, { mx: 1.5, my: 0.25, px: 2, py: 1.25 }]}
              >
                <ListItemText
                  primary={t(HOME_ITEM.labelKey)}
                  slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '1rem' } } }}
                />
              </ListItemButton>
            </ListItem>
            <Groove sx={{ my: 1, mx: 3 }} />

            <ListSubheader disableSticky sx={{ ...eyebrowSx, bgcolor: 'transparent', lineHeight: 1, px: 3.5, pt: 1, pb: 1 }}>
              {t('nav.product')}
            </ListSubheader>
            {PRODUCT_ITEMS.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.href}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item)}
                  selected={isActive(item)}
                  aria-current={isActive(item) ? 'page' : undefined}
                  sx={[navPillSx, navPillMobileSx, { mx: 1.5, my: 0.25, px: 2, py: 1 }]}
                >
                  <ListItemText
                    primary={t(item.labelKey)}
                    slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '0.95rem' } } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <Groove sx={{ my: 1, mx: 3 }} />

            <ListSubheader disableSticky sx={{ ...eyebrowSx, bgcolor: 'transparent', lineHeight: 1, px: 3.5, pt: 1, pb: 1 }}>
              {t('nav.solutions')}
            </ListSubheader>
            {AUDIENCES.map((a) => (
              <ListItem key={a} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={SOLUTION_PATHS[a]}
                  onClick={() => setMobileOpen(false)}
                  selected={location.pathname === SOLUTION_PATHS[a]}
                  aria-current={location.pathname === SOLUTION_PATHS[a] ? 'page' : undefined}
                  sx={[navPillSx, navPillMobileSx, { mx: 1.5, my: 0.25, px: 2, py: 1 }]}
                >
                  <ListItemText
                    primary={t(`solutions.${a}`)}
                    slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '0.95rem' } } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            <Groove sx={{ my: 1, mx: 3 }} />

            {navItems.map((item) => (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={item.href}
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item)}
                  selected={isActive(item)}
                  aria-current={isActive(item) ? 'page' : undefined}
                  sx={[navPillSx, navPillMobileSx, { mx: 1.5, my: 0.25, px: 2, py: 1.25 }]}
                >
                  <ListItemText
                    primary={t(item.labelKey)}
                    slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '1rem' } } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Groove sx={{ my: 2, mx: 3 }} />

        <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <NeuButton tone="accent" fullWidth>
            {t('actions.getStarted')}
          </NeuButton>
        </Box>
      </Drawer>
    </>
  );
};
