import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CodeIcon from '@mui/icons-material/Code';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { fonts, soft } from '../../theme/tokens';

/**
 * The ten things Fintelligent does, from `fintelAgent.fullCapabilities.items.*`
 * in i18n. Order matches the source doc: build → think → analyze → research →
 * report → operate → teach → persist → guard → suggest.
 */
const ITEMS = [
  { key: 'strategyBuilder', icon: <CodeIcon /> },
  { key: 'researchMindset', icon: <PsychologyAltOutlinedIcon /> },
  { key: 'evidenceAnalysis', icon: <QueryStatsIcon /> },
  { key: 'marketResearch', icon: <PublicOutlinedIcon /> },
  { key: 'pdfReports', icon: <DescriptionOutlinedIcon /> },
  { key: 'platformOperator', icon: <TouchAppOutlinedIcon /> },
  { key: 'teaches', icon: <SchoolOutlinedIcon /> },
  { key: 'backgroundWork', icon: <CloudSyncOutlinedIcon /> },
  { key: 'safety', icon: <VerifiedUserOutlinedIcon /> },
  { key: 'oneClickIdeas', icon: <TipsAndUpdatesOutlinedIcon /> },
] as const;

const FACT_KEYS = ['where', 'history', 'language', 'suggestions', 'cost', 'who'] as const;

/**
 * Index item: a numbered, iconed row that selects a capability. Reuses
 * NeuPanel's tile surface so the whole row is a single raised control.
 */
const IndexRow = ({
  index,
  active,
  icon,
  label,
  onSelect,
}: {
  index: number;
  active: boolean;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}) => (
  <NeuPanel
    component="li"
    variant="tile"
    interactive
    onClick={onSelect}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
      p: { xs: 1.25, md: 1.5 },
      cursor: 'pointer',
      ...(active && { outline: `2px solid ${soft.accent}`, outlineOffset: '-2px' }),
    }}
  >
    <Box
      aria-hidden
      sx={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '0.68rem',
        fontWeight: 700,
        fontFamily: fonts.mono,
        bgcolor: active ? soft.accent : soft.groundSunken,
        color: active ? soft.white : soft.textSecondary,
        transition: 'background-color 160ms ease, color 160ms ease',
      }}
    >
      {String(index + 1).padStart(2, '0')}
    </Box>
    <Typography
      sx={{
        fontSize: '0.86rem',
        fontWeight: active ? 700 : 600,
        color: active ? soft.text : soft.textSecondary,
        lineHeight: 1.35,
        flex: 1,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ color: active ? soft.accent : soft.textSecondary, display: 'flex', flexShrink: 0, '& svg': { fontSize: 20 } }}>
      {icon}
    </Box>
  </NeuPanel>
);

/**
 * The full capability surface for the Agentic AI page: a numbered index on
 * the left picks a capability, a detail panel on the right explains it, and
 * a fact strip underneath covers the practical "how it's used" questions.
 * Deliberately not a Section of its own — it lives inside FintelligentSection,
 * right below the agent-to-agent demo it backs up with the complete list.
 */
export const FintelligentCapabilityExplorer = () => {
  const { t } = useTranslation('home');
  const [active, setActive] = useState(0);
  const item = ITEMS[active];
  const bullets = t(`fintelAgent.fullCapabilities.items.${item.key}.bullets`, { returnObjects: true }) as string[];

  return (
    <Box sx={{ mt: { xs: 0, md: 0 } }}>
      <AnimateOnScroll>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.65rem' }, color: soft.text, mb: 1, letterSpacing: '-0.01em' }}>
          {t('fintelAgent.fullCapabilities.heading')}
        </Typography>
        <Typography sx={{ color: soft.textSecondary, fontSize: '0.98rem', lineHeight: 1.6, maxWidth: 640, mb: { xs: 3, md: 4 } }}>
          {t('fintelAgent.fullCapabilities.subheading')}
        </Typography>
      </AnimateOnScroll>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 320px) 1fr' },
          gap: { xs: 2, md: 3 },
          alignItems: 'stretch',
        }}
      >
        <AnimateOnScroll direction="left" stretch>
          <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ITEMS.map((c, idx) => (
              <IndexRow
                key={c.key}
                index={idx}
                active={idx === active}
                icon={c.icon}
                label={t(`fintelAgent.fullCapabilities.items.${c.key}.title`)}
                onSelect={() => setActive(idx)}
              />
            ))}
          </Box>
        </AnimateOnScroll>

        <AnimateOnScroll delay={80} direction="right" stretch>
          <NeuPanel sx={{ p: { xs: 2.5, md: 3.5 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <IconWell size={44}>{item.icon}</IconWell>
            <Typography component="h4" sx={{ fontWeight: 800, fontSize: '1.15rem', color: soft.text, mt: 2, mb: 1, letterSpacing: '-0.01em' }}>
              {t(`fintelAgent.fullCapabilities.items.${item.key}.title`)}
            </Typography>
            <Typography sx={{ color: soft.textSecondary, fontSize: '0.94rem', lineHeight: 1.65, mb: 2.5 }}>
              {t(`fintelAgent.fullCapabilities.items.${item.key}.desc`)}
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {bullets.map((b) => (
                <Box component="li" key={b} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <CheckRoundedIcon sx={{ fontSize: 16, color: soft.accent, mt: '3px', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6, color: soft.text }}>{b}</Typography>
                </Box>
              ))}
            </Box>
          </NeuPanel>
        </AnimateOnScroll>
      </Box>

      <AnimateOnScroll delay={140} stretch>
        <NeuPanel
          variant="tile"
          sx={{
            mt: { xs: 3, md: 4 },
            p: { xs: 2.5, md: 3 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
            gap: { xs: 2.5, md: 3 },
          }}
        >
          {FACT_KEYS.map((key) => (
            <Box key={key}>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: soft.textSecondary, mb: 0.6 }}>
                {t(`fintelAgent.fullCapabilities.usage.facts.${key}.label`)}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.55, color: soft.text }}>
                {t(`fintelAgent.fullCapabilities.usage.facts.${key}.value`)}
              </Typography>
            </Box>
          ))}
        </NeuPanel>
      </AnimateOnScroll>
    </Box>
  );
};
