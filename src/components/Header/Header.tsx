import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import fintelaLargeLogo from '../../assets/logos/fintela_large_logo.png';
import { motion, radii, shadows, soft } from '../../theme/tokens';
import { eyebrowSx, focusRingSx, navPillSx, neuIconButtonSx } from '../../theme/neu';
import { NeuButton } from '../primitives/NeuButton';
import { Groove } from '../primitives/Groove';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { AUDIENCES } from '../../lib/audience';
import { SOLUTION_PATHS } from '../../solutions/registry';

interface HeaderProps {
  /** The home page's scroll-spy; pages without in-page bands leave both unset. */
  activeSection?: string;
  onNavigate?: (section: string) => void;
}

type NavItem = {
  id: string;
  /** i18n key (within the `header` namespace) for the nav label. */
  labelKey: string;
  /** scroll target on home, or absolute route path. */
  href: string;
  type: 'scroll' | 'route';
};

/**
 * The Solutions menu sits between Platform and Fintelligent: three seats, each
 * a route under /solutions. It is a menu rather than three items so the bar
 * stays six items wide in every locale.
 */
const SOLUTIONS_POSITION = 1;

const navItems: NavItem[] = [
  { id: 'platform', labelKey: 'nav.platform', href: 'platform', type: 'scroll' },
  { id: 'fintelligent', labelKey: 'nav.fintelagent', href: 'fintelligent', type: 'scroll' },
  { id: 'pricing', labelKey: 'nav.pricing', href: '/pricing', type: 'route' },
  { id: 'documentation', labelKey: 'nav.documentation', href: '/docs', type: 'route' },
  { id: 'blog', labelKey: 'nav.blog', href: '/blog', type: 'route' },
];

const navPillButtonSx = {
  px: 1.75,
  py: 0.75,
  minHeight: 36,
  fontSize: '0.92rem',
  borderRadius: `${radii.pill}px`,
  textTransform: 'none',
} as const;

export const Header = ({ activeSection, onNavigate }: HeaderProps) => {
  const { t } = useTranslation('header');
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [solutionsAnchor, setSolutionsAnchor] = useState<HTMLElement | null>(null);
  const solutionsOpen = Boolean(solutionsAnchor);
  const onSolutions = location.pathname.startsWith('/solutions');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavigation = (item: NavItem) => {
    if (item.type === 'route') {
      navigate(item.href);
    } else if (location.pathname !== '/' || !onNavigate) {
      navigate('/', { state: { scrollTo: item.id } });
    } else {
      onNavigate(item.id);
    }
    setMobileOpen(false);
  };

  const openSolutions = (e: MouseEvent<HTMLElement>) => setSolutionsAnchor(e.currentTarget);
  const closeSolutions = () => setSolutionsAnchor(null);

  const isActive = (item: NavItem) => {
    if (item.type === 'route') {
      return (
        location.pathname === item.href ||
        location.pathname.startsWith(item.href + '/')
      );
    }
    return location.pathname === '/' && activeSection === item.id;
  };

  return (
    <>
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
            justifyContent: 'space-between',
            py: { xs: 1, md: 1.25 },
            px: { xs: 2, md: 4 },
            minHeight: { xs: 60, md: 72 },
            maxWidth: 1280,
            mx: 'auto',
            width: '100%',
          }}
        >
          {/* Logo */}
          <Box
            role="link"
            tabIndex={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              height: { xs: 30, md: 40 },
              borderRadius: `${radii.neuWell}px`,
              ...focusRingSx,
            }}
            onClick={() => {
              navigate('/');
              window.scrollTo(0, 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate('/');
                window.scrollTo(0, 0);
              }
            }}
            aria-label={t('aria.home')}
          >
            <img
              src={fintelaLargeLogo}
              alt="Fintela"
              style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 0.5,
              alignItems: 'center',
            }}
          >
            {navItems.map((item, idx) => (
              <Box key={item.id} sx={{ display: 'contents' }}>
                {idx === SOLUTIONS_POSITION && (
                  <Button
                    id="solutions-menu-button"
                    onClick={openSolutions}
                    disableRipple
                    aria-haspopup="menu"
                    aria-controls={solutionsOpen ? 'solutions-menu' : undefined}
                    aria-expanded={solutionsOpen || undefined}
                    aria-current={onSolutions ? 'page' : undefined}
                    className={solutionsOpen ? 'is-active' : undefined}
                    endIcon={<ExpandMoreIcon sx={{ fontSize: '18px !important', ml: -0.5 }} />}
                    sx={[navPillSx, navPillButtonSx, { pr: 1.25 }]}
                  >
                    {t('nav.solutions')}
                  </Button>
                )}
                <Button
                  onClick={() => handleNavigation(item)}
                  disableRipple
                  aria-current={isActive(item) ? 'page' : undefined}
                  sx={[navPillSx, navPillButtonSx]}
                >
                  {t(item.labelKey)}
                </Button>
              </Box>
            ))}
            <Menu
              id="solutions-menu"
              anchorEl={solutionsAnchor}
              open={solutionsOpen}
              onClose={closeSolutions}
              slotProps={{ list: { 'aria-labelledby': 'solutions-menu-button', sx: { display: 'flex', flexDirection: 'column', gap: 0.25 } } }}
            >
              {AUDIENCES.map((a) => (
                <MenuItem
                  key={a}
                  component={RouterLink}
                  to={SOLUTION_PATHS[a]}
                  onClick={closeSolutions}
                  selected={location.pathname === SOLUTION_PATHS[a]}
                  aria-current={location.pathname === SOLUTION_PATHS[a] ? 'page' : undefined}
                  sx={[navPillSx, { px: 1.75, py: 1, fontSize: '0.92rem', minWidth: 200 }]}
                >
                  {t(`solutions.${a}`)}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, alignItems: 'center' }}>
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

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { elevation: 0, sx: { width: 300 } } }}
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
          <Box sx={{ height: 28 }}>
            <img
              src={fintelaLargeLogo}
              alt="Fintela"
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

        <List disablePadding sx={{ pt: 1 }}>
          {navItems.map((item, idx) => (
            <Box key={item.id} sx={{ display: 'contents' }}>
              {idx === SOLUTIONS_POSITION && (
                <>
                  <ListSubheader disableSticky sx={{ ...eyebrowSx, bgcolor: 'transparent', lineHeight: 1, px: 3.5, pt: 2, pb: 1 }}>
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
                        sx={[navPillSx, { mx: 1.5, my: 0.25, px: 2, py: 1 }]}
                      >
                        <ListItemText
                          primary={t(`solutions.${a}`)}
                          slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '0.95rem' } } }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  <Groove sx={{ my: 1, mx: 3 }} />
                </>
              )}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item)}
                  selected={isActive(item)}
                  aria-current={isActive(item) ? 'page' : undefined}
                  sx={[navPillSx, { mx: 1.5, my: 0.25, px: 2, py: 1.25 }]}
                >
                  <ListItemText
                    primary={t(item.labelKey)}
                    slotProps={{ primary: { sx: { fontWeight: 'inherit', fontSize: '1rem' } } }}
                  />
                </ListItemButton>
              </ListItem>
            </Box>
          ))}
        </List>

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
