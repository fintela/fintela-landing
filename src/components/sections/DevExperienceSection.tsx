import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { inkGrooveSx, inkSurfaceSx } from '../../theme/neu';
import { motion, soft } from '../../theme/tokens';

const codeLines: { tokens: { text: string; color: string }[] }[] = [
  { tokens: [
    { text: 'GET', color: '#94d2ff' },
    { text: ' /v2/trials/1482?include=metrics,equity', color: '#a7e3a3' },
  ]},
  { tokens: [
    { text: 'Authorization', color: '#94d2ff' },
    { text: ': Bearer sk_live_••••', color: '#cdd6f4' },
  ]},
  { tokens: [{ text: ' ', color: '#e6e8f0' }] },
  { tokens: [{ text: '200 OK', color: '#f7b777' }] },
  { tokens: [{ text: '{', color: '#cdd6f4' }] },
  { tokens: [
    { text: '  "data"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '{', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '    "trial_id"', color: '#94d2ff' },
    { text: ':             ', color: '#cdd6f4' },
    { text: '1482', color: '#f7b777' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '    "study_name"', color: '#94d2ff' },
    { text: ':           ', color: '#cdd6f4' },
    { text: '"sp500_momentum"', color: '#a7e3a3' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '    "trial_number"', color: '#94d2ff' },
    { text: ':         ', color: '#cdd6f4' },
    { text: '37', color: '#f7b777' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '    "managed_portfolio_id"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '12', color: '#f7b777' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '    "metrics"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '{ ', color: '#cdd6f4' },
    { text: '"validation"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '{ ', color: '#cdd6f4' },
    { text: '"sharpe_ratio"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '1.84', color: '#f7b777' },
    { text: ' } }', color: '#cdd6f4' },
  ]},
  { tokens: [{ text: '  }', color: '#cdd6f4' }] },
  { tokens: [{ text: '}', color: '#cdd6f4' }] },
];

const docLinks = [
  { key: 'quickstart', icon: <BoltOutlinedIcon />, href: '/docs/quickstart' },
  { key: 'api', icon: <TerminalOutlinedIcon />, href: '/docs/api-overview' },
  { key: 'guides', icon: <IntegrationInstructionsOutlinedIcon />, href: '/docs/python-fastapi' },
  { key: 'optimizer', icon: <MenuBookOutlinedIcon />, href: '/docs/optimizer-architecture' },
] as const;

export const DevExperienceSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="developers" size="lg">
      <SectionHeader
        eyebrow={t('devExperience.eyebrow')}
        title={t('devExperience.title')}
        titleAccent={t('devExperience.titleAccent')}
        description={t('devExperience.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
          gap: { xs: 4, md: 5 },
          alignItems: 'stretch',
        }}
      >
        {/* Code mock */}
        <AnimateOnScroll>
          <Box sx={{ ...inkSurfaceSx, height: '100%', overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                ...inkGrooveSx,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: soft.white, opacity: 0.22 }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: soft.white, opacity: 0.22 }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: soft.white, opacity: 0.22 }} />
              </Box>
              <Typography
                sx={{
                  ml: 1.5,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.72rem',
                  color: soft.onInk,
                  letterSpacing: '0.04em',
                  '@media print': { color: soft.text },
                }}
              >
                {t('devExperience.codeFilename')}
              </Typography>
            </Box>
            <Box
              component="pre"
              sx={{
                m: 0,
                px: 2.5,
                py: 2,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: { xs: '0.78rem', md: '0.84rem' },
                lineHeight: 1.75,
                color: soft.white,
                overflowX: 'auto',
              }}
            >
              {codeLines.map((line, idx) => (
                <Box key={idx} component="span" sx={{ display: 'block', whiteSpace: 'pre' }}>
                  {line.tokens.length === 0 ? (
                    <span>&nbsp;</span>
                  ) : (
                    line.tokens.map((t, ti) => (
                      <span key={ti} style={{ color: t.color }}>
                        {t.text}
                      </span>
                    ))
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </AnimateOnScroll>

        {/* Docs link cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {docLinks.map((link, idx) => (
            <AnimateOnScroll key={link.key} delay={idx * 70}>
              <NeuPanel
                variant="tile"
                to={link.href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2.25,
                  '@media (hover: hover)': {
                    '&:hover .dev-arrow': { color: soft.accent, transform: 'translateX(3px)' },
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    '&:hover .dev-arrow': { transform: 'none' },
                  },
                }}
              >
                <IconWell size={40}>{link.icon}</IconWell>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: soft.text, fontSize: '0.98rem' }}>
                    {t(`devExperience.docLinks.${link.key}.title`)}
                  </Typography>
                  <Typography sx={{ color: soft.textSecondary, fontSize: '0.86rem', lineHeight: 1.5 }}>
                    {t(`devExperience.docLinks.${link.key}.description`)}
                  </Typography>
                </Box>
                <ArrowForwardIcon
                  className="dev-arrow"
                  sx={{
                    fontSize: 18,
                    color: soft.textSecondary,
                    transition: `color ${motion.fast}, transform ${motion.fast}`,
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  }}
                />
              </NeuPanel>
            </AnimateOnScroll>
          ))}
        </Box>
      </Box>
    </Section>
  );
};
