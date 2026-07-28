import { useState, useEffect } from 'react';
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
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import fintelaLargeLogo from '../../assets/logos/fintela_large_logo.png';
import { gradients } from '../../theme/tokens';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

type NavItem = {
  id: string;
  /** i18n key (within the `header` namespace) for the nav label. */
  labelKey: string;
  /** scroll target on home, or absolute route path. */
  href: string;
  type: 'scroll' | 'route';
};

const navItems: NavItem[] = [
  { id: 'platform', labelKey: 'nav.platform', href: 'platform', type: 'scroll' },
  { id: 'fintelagent', labelKey: 'nav.fintelagent', href: 'fintelagent', type: 'scroll' },
  { id: 'use-cases', labelKey: 'nav.useCases', href: 'use-cases', type: 'scroll' },
  { id: 'documentation', labelKey: 'nav.documentation', href: '/documentation', type: 'route' },
  { id: 'blog', labelKey: 'nav.blog', href: '/blog', type: 'route' },
];

export const Header = ({ activeSection, onNavigate }: HeaderProps) => {
  const { t } = useTranslation('header');
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavigation = (item: NavItem) => {
    if (item.type === 'route') {
      navigate(item.href);
    } else if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: item.id } });
    } else {
      onNavigate(item.id);
    }
    setMobileOpen(false);
  };

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
          bgcolor: scrolled
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid',
          borderColor: scrolled ? 'rgba(11,16,32,0.08)' : 'transparent',
          transition: 'background 0.25s ease, border-color 0.25s ease',
          color: 'text.primary',
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
              outline: 'none',
              borderRadius: 1,
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
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleNavigation(item)}
                disableRipple
                sx={{
                  px: 1.75,
                  py: 0.75,
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: isActive(item) ? 'text.primary' : 'text.secondary',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    bottom: 4,
                    transform: 'translateX(-50%)',
                    width: isActive(item) ? 18 : 0,
                    height: 2,
                    borderRadius: 2,
                    background: gradients.brand,
                    transition: 'width 0.22s ease',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: 'text.primary',
                    '&::after': { width: 18 },
                  },
                }}
              >
                {t(item.labelKey)}
              </Button>
            ))}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: { xs: 1, md: 1.5 }, alignItems: 'center' }}>
            <LanguageSwitcher />
            <Button
              href="https://app.fintela.io"
              variant="text"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                color: 'text.primary',
                fontSize: '0.92rem',
                '&:hover': { bgcolor: 'rgba(102,126,234,0.06)' },
              }}
            >
              {t('actions.signIn')}
            </Button>
            <Button
              variant="contained"
              href="https://app.fintela.io"
              size="medium"
              sx={{
                background: gradients.brand,
                color: '#fff',
                px: { xs: 2, md: 2.5 },
                fontSize: { xs: '0.85rem', md: '0.92rem' },
              }}
            >
              {t('actions.getStarted')}
            </Button>

            <IconButton
              aria-label={t('aria.openMenu')}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                color: 'text.primary',
              }}
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
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 300,
            bgcolor: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(16px)',
            border: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ height: 28 }}>
            <img
              src={fintelaLargeLogo}
              alt="Fintela"
              style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </Box>
          <IconButton aria-label={t('aria.closeMenu')} onClick={() => setMobileOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <List disablePadding sx={{ pt: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item)}
                sx={{
                  py: 1.5,
                  px: 3,
                  color: isActive(item) ? '#667eea' : 'text.primary',
                  borderLeft: '3px solid',
                  borderLeftColor: isActive(item) ? '#667eea' : 'transparent',
                  bgcolor: isActive(item) ? 'rgba(102,126,234,0.04)' : 'transparent',
                }}
              >
                <ListItemText
                  primary={t(item.labelKey)}
                  primaryTypographyProps={{
                    fontWeight: isActive(item) ? 700 : 500,
                    fontSize: '1rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ px: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Button
            href="https://app.fintela.io"
            fullWidth
            variant="outlined"
            sx={{ py: 1.25 }}
          >
            {t('actions.signIn')}
          </Button>
          <Button
            href="https://app.fintela.io"
            fullWidth
            variant="contained"
            sx={{ py: 1.25, background: gradients.brand, color: '#fff' }}
          >
            {t('actions.getStarted')}
          </Button>
        </Box>
      </Drawer>
    </>
  );
};
