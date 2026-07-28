import { Box, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import IntegrationInstructionsOutlinedIcon from '@mui/icons-material/IntegrationInstructionsOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients } from '../../theme/tokens';

const codeLines: { tokens: { text: string; color: string }[] }[] = [
  { tokens: [{ text: 'POST', color: '#94d2ff' }, { text: ' /studies', color: '#a7e3a3' }] },
  { tokens: [{ text: ' ', color: '#e6e8f0' }] },
  { tokens: [{ text: '{', color: '#cdd6f4' }] },
  { tokens: [
    { text: '  "study_name"', color: '#94d2ff' },
    { text: ':       ', color: '#cdd6f4' },
    { text: '"sp500_momentum"', color: '#a7e3a3' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '  "strategy_id"', color: '#94d2ff' },
    { text: ':      ', color: '#cdd6f4' },
    { text: '7', color: '#f7b777' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '  "fitness_id"', color: '#94d2ff' },
    { text: ':       ', color: '#cdd6f4' },
    { text: '3', color: '#f7b777' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '  "n_trials"', color: '#94d2ff' },
    { text: ':         ', color: '#cdd6f4' },
    { text: '500', color: '#f7b777' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '  "sampler"', color: '#94d2ff' },
    { text: ':          ', color: '#cdd6f4' },
    { text: '"TPE"', color: '#a7e3a3' },
    { text: ',', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '  "params"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '{', color: '#cdd6f4' },
  ]},
  { tokens: [
    { text: '    "lookback"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '{ ', color: '#cdd6f4' },
    { text: '"minimum"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '5', color: '#f7b777' },
    { text: ', ', color: '#cdd6f4' },
    { text: '"maximum"', color: '#94d2ff' },
    { text: ': ', color: '#cdd6f4' },
    { text: '60', color: '#f7b777' },
    { text: ' }', color: '#cdd6f4' },
  ]},
  { tokens: [{ text: '  }', color: '#cdd6f4' }] },
  { tokens: [{ text: '}', color: '#cdd6f4' }] },
];

const docLinks = [
  { key: 'quickstart', icon: <BoltOutlinedIcon />, href: '/documentation/quickstart' },
  { key: 'api', icon: <TerminalOutlinedIcon />, href: '/documentation/api' },
  { key: 'guides', icon: <IntegrationInstructionsOutlinedIcon />, href: '/documentation/guides/python' },
  { key: 'optimizer', icon: <MenuBookOutlinedIcon />, href: '/documentation/optimizer/architecture' },
] as const;

export const DevExperienceSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="developers" tone="default" size="lg">
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
          <Box
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(102,126,234,0.2)',
              background: 'linear-gradient(180deg, #14182b 0%, #0f1325 100%)',
              boxShadow: '0 20px 50px rgba(11,16,32,0.12)',
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff6058' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbf2f' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28cb40' }} />
              </Box>
              <Typography
                sx={{
                  ml: 1.5,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.04em',
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
                color: '#e6e8f0',
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {docLinks.map((link, idx) => (
            <AnimateOnScroll key={link.key} delay={idx * 70}>
              <Box
                component={RouterLink}
                to={link.href}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2.25,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#fff',
                  textDecoration: 'none',
                  transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(102,126,234,0.4)',
                    transform: 'translateX(4px)',
                    boxShadow: '0 12px 28px rgba(102,126,234,0.1)',
                    '& .dev-arrow': { color: '#667eea', transform: 'translateX(3px)' },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    background: gradients.brand,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 6px 14px rgba(102,126,234,0.28)',
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {link.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.98rem' }}>
                    {t(`devExperience.docLinks.${link.key}.title`)}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem', lineHeight: 1.5 }}>
                    {t(`devExperience.docLinks.${link.key}.description`)}
                  </Typography>
                </Box>
                <ArrowForwardIcon
                  className="dev-arrow"
                  sx={{
                    fontSize: 18,
                    color: 'text.disabled',
                    transition: 'color 0.18s, transform 0.18s',
                  }}
                />
              </Box>
            </AnimateOnScroll>
          ))}
        </Box>
      </Box>
    </Section>
  );
};
