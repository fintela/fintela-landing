import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { eyebrowSx, quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';

/**
 * The two paths, side by side and built the same way so they compare line by
 * line: what it is, what it does, where it runs, and the page that tells the
 * rest. The "where it runs" line is the point of the section.
 */
const PATHS: readonly { key: 'fintelligent' | 'mcp'; to: string; icon: ReactNode }[] = [
  { key: 'fintelligent', to: '/product/agentic-ai', icon: <CloudOutlinedIcon /> },
  { key: 'mcp', to: '/product/mcp', icon: <DnsOutlinedIcon /> },
];

/**
 * Section 4, two ways to work with AI: Fintelligent (built in, runs inside
 * Fintela) and Fintela MCP (your own agent, your code on your servers, a
 * person approving every run).
 */
export const AiPaths = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="ai" size="lg">
      <SectionHeader align="left" title={t('ai.title')} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: { xs: 3, md: 4 }, alignItems: 'stretch' }}>
        {PATHS.map(({ key, to, icon }, i) => (
          <AnimateOnScroll key={key} delay={i * 90} stretch>
            <NeuPanel component="article" sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 3, md: 4 } }}>
              <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>{t(`ai.${key}.label`)}</Typography>
              <Typography component="h3" sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, color: soft.text, mb: 1.5 }}>
                {t(`ai.${key}.name`)}
              </Typography>
              <Typography sx={{ fontSize: '1rem', lineHeight: 1.65, color: soft.textSecondary, mb: 3 }}>{t(`ai.${key}.body`)}</Typography>
              <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'flex-start', gap: 1.25, borderTop: `1px solid ${soft.groundSunken}`, pt: 2.5, mb: 2.5 }}>
                <Box aria-hidden sx={{ display: 'flex', color: soft.text, '& svg': { fontSize: 20 }, mt: '1px' }}>
                  {icon}
                </Box>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5, color: soft.text }}>{t(`ai.${key}.where`)}</Typography>
              </Box>
              <Box
                component={RouterLink}
                to={to}
                sx={[quietLinkSx, { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.92rem', fontWeight: 600, color: soft.linkAccent }]}
              >
                {t(`ai.${key}.link`)}
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </Box>
            </NeuPanel>
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};
