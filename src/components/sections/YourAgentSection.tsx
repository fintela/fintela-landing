import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { Section } from '../primitives/Section';
import { BandHeader } from '../primitives/BandHeader';
import { NeuButton } from '../primitives/NeuButton';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { soft } from '../../theme/tokens';

const TILES = [
  { key: 'verdict', icon: <VerifiedOutlinedIcon /> },
  { key: 'validate', icon: <FactCheckOutlinedIcon /> },
  { key: 'confirm', icon: <TaskAltOutlinedIcon /> },
] as const;

/**
 * Fintela MCP on the home page: a fund brings its own AI agent and keeps its
 * edge. Three tiles and the way through to /product/mcp, where the whole
 * pitch lives. Sits between the platform band and the ink "for funds" band,
 * on the hero tone so neither neighbour shares its ground.
 */
export const YourAgentSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="your-agent" size="lg" tone="hero">
      <BandHeader
        eyebrow={t('yourAgent.eyebrow')}
        title={t('yourAgent.title')}
        titleAccent={t('yourAgent.titleAccent')}
        description={t('yourAgent.description')}
        exit={
          <NeuButton tone="accent" to="/product/mcp" endIcon={<ArrowForwardIcon />}>
            {t('yourAgent.exit')}
          </NeuButton>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 2.5 } }}>
        {TILES.map((tile, idx) => (
          <AnimateOnScroll key={tile.key} delay={idx * 80} stretch>
            <NeuPanel variant="tile" sx={{ height: '100%', display: 'flex', gap: 1.5, alignItems: 'flex-start', p: { xs: 2.25, md: 2.75 } }}>
              <IconWell size={40}>{tile.icon}</IconWell>
              <Box>
                <Typography sx={{ fontWeight: 700, color: soft.text, mb: 0.5, fontSize: '1rem' }}>
                  {t(`yourAgent.tiles.${tile.key}.title`)}
                </Typography>
                <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.55 }}>
                  {t(`yourAgent.tiles.${tile.key}.desc`)}
                </Typography>
              </Box>
            </NeuPanel>
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};
