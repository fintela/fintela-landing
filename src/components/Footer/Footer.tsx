import type { MouseEvent } from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import fintelaLargeLogo from '../../assets/logos/fintela_large_logo.png';
import { gradients } from '../../theme/tokens';
import { scrollToSection } from '../../lib/scrollToSection';
import { useTranslation } from 'react-i18next';

type FooterLink = {
  id: string;
  labelKey: string;
  href: string;
  /** 'scroll' targets an in-page section id (href is "/#<id>"); 'route' is a normal
   * SPA route; 'external' leaves the app entirely. */
  type: 'scroll' | 'route' | 'external';
};

type FooterColumn = {
  id: string;
  /** i18n key (within the `footer` namespace) for the column title. */
  titleKey: string;
  links: FooterLink[];
};

const columns: FooterColumn[] = [
  {
    id: 'product',
    titleKey: 'footer:columns.product.title',
    links: [
      { id: 'platform', labelKey: 'footer:columns.product.links.platform', href: '/#platform', type: 'scroll' },
      { id: 'fintelagent', labelKey: 'footer:columns.product.links.fintelagent', href: '/#fintelagent', type: 'scroll' },
      { id: 'useCases', labelKey: 'footer:columns.product.links.useCases', href: '/#use-cases', type: 'scroll' },
    ],
  },
  {
    id: 'resources',
    titleKey: 'footer:columns.resources.title',
    links: [
      { id: 'documentation', labelKey: 'footer:columns.resources.links.documentation', href: '/docs', type: 'route' },
      { id: 'engine', labelKey: 'footer:columns.resources.links.engine', href: '/docs/optimizer-architecture', type: 'route' },
      { id: 'datacluster', labelKey: 'footer:columns.resources.links.datacluster', href: '/docs/core-concepts', type: 'route' },
      { id: 'blog', labelKey: 'footer:columns.resources.links.blog', href: '/blog', type: 'route' },
    ],
  },
  {
    id: 'company',
    titleKey: 'footer:columns.company.title',
    links: [
      { id: 'contact', labelKey: 'footer:columns.company.links.contact', href: '/contact', type: 'route' },
      { id: 'faq', labelKey: 'footer:columns.company.links.faq', href: '/#faq', type: 'scroll' },
    ],
  },
];

const legalLinks = [
  { key: 'terms', to: '/terms' },
  { key: 'privacy', to: '/privacy' },
] as const;

export const Footer = () => {
  const { t } = useTranslation(['common', 'footer']);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll-type links point at a section on the home page ("/#platform", etc).
  // A plain RouterLink only ever changes the URL — it never scrolls — so on the
  // home page we scroll in place, and from anywhere else we navigate home and
  // hand off the target id via location.state for HomePage to pick up.
  const handleScrollLinkClick = (e: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    if (location.pathname === '/') {
      scrollToSection(sectionId);
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#fafbfc',
        borderTop: '1px solid',
        borderColor: 'divider',
        pt: { xs: 7, md: 10 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1.5fr repeat(3, 1fr)' },
            gap: { xs: 5, md: 6 },
          }}
        >
          <Box>
            <Box sx={{ height: 36, mb: 2.5 }}>
              <img
                src={fintelaLargeLogo}
                alt="Fintela"
                style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.92rem',
                lineHeight: 1.6,
                mb: 3,
                maxWidth: 320,
              }}
            >
              {t('footer:tagline')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Link
                href="mailto:manuel.padron@fintela.io"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'text.secondary',
                  fontSize: '0.88rem',
                  '&:hover': { color: '#2f6395' },
                }}
              >
                <EmailOutlinedIcon sx={{ fontSize: 16 }} />
                manuel.padron@fintela.io
              </Link>
            </Box>
          </Box>

          {columns.map((col) => (
            <Box key={col.id}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'text.disabled',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  mb: 2,
                }}
              >
                {t(col.titleKey)}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {col.links.map((l) => (
                  <Link
                    key={l.id}
                    {...(l.type === 'external'
                      ? { href: l.href }
                      : { component: RouterLink, to: l.href })}
                    {...(l.type === 'scroll'
                      ? { onClick: (e: MouseEvent<HTMLAnchorElement>) => handleScrollLinkClick(e, l.href.replace(/^\/#/, '')) }
                      : {})}
                    sx={{
                      color: 'text.primary',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      '&:hover': { color: '#2f6395' },
                    }}
                  >
                    {t(l.labelKey)}
                  </Link>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: { xs: 4, md: 5 } }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: gradients.brand,
              }}
            />
            <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>
              © {new Date().getFullYear()} Fintela. All rights reserved.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {legalLinks.map((l) => (
              <Link
                key={l.key}
                component={RouterLink}
                to={l.to}
                sx={{
                  fontSize: '0.82rem',
                  color: 'text.disabled',
                  '&:hover': { color: '#2f6395' },
                }}
              >
                {t(`footer.legal.${l.key}`)}
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
