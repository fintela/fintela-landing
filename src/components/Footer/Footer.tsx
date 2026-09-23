import type { MouseEvent } from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import fintelaLargeLogo from '../../assets/logos/fintela_logo_2.png';
import { gradients, shadows, soft } from '../../theme/tokens';
import { neuIconButtonSx, quietLinkSx } from '../../theme/neu';
import { Groove } from '../primitives/Groove';
import { scrollToSection } from '../../lib/scrollToSection';
import { SOLUTION_PATHS } from '../../solutions/registry';
import { DOCS_HOME } from '../../seo/routes';
import { ORG } from '../../seo/site';
import { useTranslation } from 'react-i18next';

// `site.ts` lists the profiles in this order; the same URLs go out as the
// Organization's `sameAs`, so the visible links and the structured data agree.
const [LINKEDIN_URL, GITHUB_URL] = ORG.sameAs;

const socialLinks = [
  { id: 'linkedin', labelKey: 'footer:social.linkedin', href: LINKEDIN_URL, Icon: LinkedInIcon },
  { id: 'github', labelKey: 'footer:social.github', href: GITHUB_URL, Icon: GitHubIcon },
] as const;

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
      {
        id: 'platform',
        labelKey: 'footer:columns.product.links.platform',
        href: '/#hero',
        type: 'scroll',
      },
      {
        id: 'fintelagent',
        labelKey: 'footer:columns.product.links.fintelagent',
        href: '/product/agentic-ai',
        type: 'route',
      },
      {
        id: 'capabilities',
        labelKey: 'footer:columns.product.links.capabilities',
        href: '/#capabilities',
        type: 'scroll',
      },
      {
        id: 'funds',
        labelKey: 'footer:columns.product.links.funds',
        href: SOLUTION_PATHS.funds,
        type: 'route',
      },
      {
        id: 'teams',
        labelKey: 'footer:columns.product.links.teams',
        href: SOLUTION_PATHS.teams,
        type: 'route',
      },
      {
        id: 'independents',
        labelKey: 'footer:columns.product.links.independents',
        href: SOLUTION_PATHS.independents,
        type: 'route',
      },
      {
        id: 'advisors',
        labelKey: 'footer:columns.product.links.advisors',
        href: SOLUTION_PATHS.advisors,
        type: 'route',
      },
      {
        id: 'pricing',
        labelKey: 'footer:columns.product.links.pricing',
        href: '/pricing',
        type: 'route',
      },
    ],
  },
  {
    id: 'resources',
    titleKey: 'footer:columns.resources.title',
    links: [
      {
        id: 'documentation',
        labelKey: 'footer:columns.resources.links.documentation',
        // `/docs` itself only redirects; link straight to where it lands.
        href: DOCS_HOME,
        type: 'route',
      },
      {
        id: 'quickstart',
        labelKey: 'footer:columns.resources.links.quickstart',
        href: '/docs/quickstart',
        type: 'route',
      },
      {
        id: 'api',
        labelKey: 'footer:columns.resources.links.api',
        href: '/docs/api-overview',
        type: 'route',
      },
      {
        id: 'engine',
        labelKey: 'footer:columns.resources.links.engine',
        href: '/docs/optimizer-architecture',
        type: 'route',
      },
      {
        id: 'datacluster',
        labelKey: 'footer:columns.resources.links.datacluster',
        href: '/docs/asset-groups',
        type: 'route',
      },
      { id: 'blog', labelKey: 'footer:columns.resources.links.blog', href: '/blog', type: 'route' },
    ],
  },
  {
    id: 'company',
    titleKey: 'footer:columns.company.title',
    links: [
      {
        id: 'contact',
        labelKey: 'footer:columns.company.links.contact',
        href: '/contact',
        type: 'route',
      },
      { id: 'faq', labelKey: 'footer:columns.company.links.faq', href: '/#faq', type: 'scroll' },
    ],
  },
];

const legalLinks = [
  { key: 'terms', to: '/terms' },
  { key: 'privacy', to: '/privacy' },
  { key: 'riskDisclosures', to: '/risk-disclosures' },
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
        bgcolor: soft.groundSunken,
        boxShadow: shadows.neuFloor,
        pt: { xs: 7, md: 10 },
        pb: { xs: 4, md: 5 },
        '@media (forced-colors: active)': { boxShadow: 'none', borderTop: '1px solid CanvasText' },
        '@media print': { boxShadow: 'none', bgcolor: soft.white, borderTop: `1px solid ${soft.deep}` },
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
            <Box sx={{ height: 22, mb: 2.5 }}>
              <img
                src={fintelaLargeLogo}
                alt="Fintela"
                width={442}
                height={154}
                style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
              />
            </Box>
            <Typography
              sx={{
                color: soft.textSecondary,
                fontSize: '0.92rem',
                lineHeight: 1.6,
                mb: 3,
                maxWidth: 320,
              }}
            >
              {t('footer:tagline')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {/* The role address, as the Organization schema names it — never
                  a person's mailbox, which gets scraped and goes stale. */}
              <Link
                href={`mailto:${ORG.email}`}
                sx={[
                  quietLinkSx,
                  { display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: '0.88rem' },
                ]}
              >
                <EmailOutlinedIcon sx={{ fontSize: 16 }} />
                {ORG.email}
              </Link>
            </Box>
            <Box
              component="nav"
              aria-label={t('footer:social.label')}
              sx={{ display: 'flex', gap: 1, mt: 2.5 }}
            >
              {/* rel="me": these are the company's own profiles, the ones the
                  Organization's sameAs points at. */}
              {socialLinks.map(({ id, labelKey, href, Icon }) => (
                <Link
                  key={id}
                  href={href}
                  target="_blank"
                  rel="me noopener"
                  aria-label={t(labelKey)}
                  sx={[
                    neuIconButtonSx,
                    { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
                  ]}
                >
                  <Icon />
                </Link>
              ))}
            </Box>
          </Box>

          {columns.map((col) => (
            <Box key={col.id}>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: soft.textSecondary,
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
                      ? {
                          onClick: (e: MouseEvent<HTMLAnchorElement>) =>
                            handleScrollLinkClick(e, l.href.replace(/^\/#/, '')),
                        }
                      : {})}
                    sx={[quietLinkSx, { color: soft.text, fontSize: '0.92rem', fontWeight: 500 }]}
                  >
                    {t(l.labelKey)}
                  </Link>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        <Groove sx={{ my: { xs: 4, md: 5 } }} />

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
                background: gradients.gold,
              }}
            />
            {/* The year is computed at build time by the prerender and again in
                the browser; across a New Year the two differ, which is not
                worth a hydration error. */}
            <Typography suppressHydrationWarning sx={{ fontSize: '0.82rem', color: soft.textSecondary }}>
              © {new Date().getFullYear()} Fintela. All rights reserved.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {legalLinks.map((l) => (
              <Link
                key={l.key}
                component={RouterLink}
                to={l.to}
                sx={[quietLinkSx, { fontSize: '0.82rem' }]}
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
