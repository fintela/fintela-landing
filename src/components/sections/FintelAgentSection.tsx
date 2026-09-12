import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { Groove } from '../primitives/Groove';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { forcedColorsSurface, neuFieldSx, wellSx } from '../../theme/neu';
import { palette, radii, shadows, soft } from '../../theme/tokens';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CodeIcon from '@mui/icons-material/Code';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import type { ReactNode } from 'react';

const capabilities = [
  { key: 'readsData', icon: <QueryStatsIcon /> },
  { key: 'generatesStrategies', icon: <CodeIcon /> },
  { key: 'operatesUi', icon: <ExploreOutlinedIcon /> },
  { key: 'transparent', icon: <VerifiedUserOutlinedIcon /> },
] as const;

export const FintelAgentSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="fintelagent" size="lg">
      <SectionHeader
        eyebrow={t('fintelAgent.eyebrow')}
        title={t('fintelAgent.title')}
        titleAccent={t('fintelAgent.titleAccent')}
        description={t('fintelAgent.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.05fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {capabilities.map((c, idx) => (
            <AnimateOnScroll key={c.key} delay={idx * 70}>
              <CapabilityRow
                icon={c.icon}
                title={t(`fintelAgent.capabilities.${c.key}.title`)}
                desc={t(`fintelAgent.capabilities.${c.key}.desc`)}
              />
            </AnimateOnScroll>
          ))}
        </Box>

        <AnimateOnScroll delay={200} stretch>
          <ChatPreview />
        </AnimateOnScroll>
      </Box>
    </Section>
  );
};

const CapabilityRow = ({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) => (
  <NeuPanel
    variant="tile"
    sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: { xs: 2.25, md: 2.5 } }}
  >
    <IconWell size={40}>{icon}</IconWell>
    <Box>
      <Typography sx={{ fontWeight: 700, color: soft.text, mb: 0.5, fontSize: '0.98rem' }}>
        {title}
      </Typography>
      <Typography sx={{ color: soft.textSecondary, fontSize: '0.88rem', lineHeight: 1.6 }}>
        {desc}
      </Typography>
    </Box>
  </NeuPanel>
);

/** Flat 28px coin for the assistant avatars. */
const AgentCoin = ({ sx }: { sx?: SxProps<Theme> }) => (
  <Box
    aria-hidden
    sx={
      [
        {
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: `${radii.pill}px`,
          bgcolor: soft.groundSunken,
          color: soft.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& svg': { fontSize: 14 },
          ...forcedColorsSurface,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ] as SxProps<Theme>
    }
  >
    <AutoAwesomeIcon />
  </Box>
);

const ChatPreview = () => {
  const { t } = useTranslation('home');
  return (
    <NeuPanel sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', minHeight: 460 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1, py: 1 }}>
        <AgentCoin />
        <Box>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: soft.text }}>
            {t('fintelAgent.chat.assistantName')}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: soft.textSecondary, letterSpacing: '0.04em' }}>
            {t('fintelAgent.chat.statusLine')}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: palette.success }} />
          <Typography sx={{ fontSize: '0.7rem', color: soft.textSecondary, fontWeight: 600 }}>
            {t('fintelAgent.chat.online')}
          </Typography>
        </Box>
      </Box>
      <Groove sx={{ my: 1 }} />

      {/* Messages */}
      <Box
        sx={{
          ...wellSx('md'),
          borderRadius: `${radii.neuInner}px`,
          flex: 1,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
        }}
      >
        <UserBubble text={t('fintelAgent.chat.userMessage1')} />

        <AgentMessage
          title={t('fintelAgent.chat.planTitle')}
          body={t('fintelAgent.chat.planBody')}
          tool="create_study"
        />

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            ml: 5,
          }}
        >
          <Box
            sx={{
              flex: 1,
              p: 1,
              borderRadius: `${radii.neuWell}px`,
              bgcolor: soft.surfaceRaised,
              fontSize: '0.75rem',
              color: soft.textSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              ...forcedColorsSurface,
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 14, color: palette.success }} />
            {t('fintelAgent.chat.awaitingConfirmation')}
          </Box>
        </Box>

        <UserBubble text={t('fintelAgent.chat.userMessage2')} />

        <AgentMessage
          title={t('fintelAgent.chat.launchedTitle')}
          body={t('fintelAgent.chat.launchedBody')}
          tool="study.status"
          tone="success"
        />
      </Box>

      {/* Input */}
      <Groove sx={{ my: 1 }} />
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            ...neuFieldSx,
            flex: 1,
            px: 1.5,
            py: 0.9,
            borderRadius: `${radii.pill}px`,
            color: soft.textSecondary,
            fontSize: '0.82rem',
          }}
        >
          {t('fintelAgent.chat.inputPlaceholder')}
        </Box>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${radii.pill}px`,
            bgcolor: soft.surfaceRaised,
            boxShadow: shadows.neuRaisedXs,
            color: soft.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 700,
            ...forcedColorsSurface,
          }}
        >
          ↑
        </Box>
      </Box>
    </NeuPanel>
  );
};

const UserBubble = ({ text }: { text: string }) => (
  <Box sx={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
    <Box
      sx={{
        p: 1.5,
        bgcolor: soft.accent,
        color: soft.white,
        boxShadow: shadows.neuAccent,
        borderRadius: '14px 14px 4px 14px',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        '@media (forced-colors: active)': { boxShadow: 'none', border: '2px solid Highlight' },
      }}
    >
      {text}
    </Box>
  </Box>
);

const AgentMessage = ({
  title,
  body,
  tool,
  tone,
}: {
  title: string;
  body: string;
  tool: string;
  tone?: 'success';
}) => (
  <Box sx={{ display: 'flex', gap: 1.25, maxWidth: '94%' }}>
    <AgentCoin sx={{ mt: 0.25 }} />
    <Box sx={{ flex: 1 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          mb: 0.75,
          borderRadius: `${radii.pill}px`,
          bgcolor: soft.surfaceRaised,
          color: soft.textSecondary,
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: '"JetBrains Mono", monospace',
          '& svg': { color: tone === 'success' ? palette.success : soft.accent },
          ...forcedColorsSurface,
        }}
      >
        {tone === 'success' && <CheckRoundedIcon sx={{ fontSize: 11 }} />}
        {tool}
      </Box>
      <NeuPanel
        variant="tile"
        sx={{
          p: 1.5,
          borderRadius: '4px 14px 14px 14px',
          fontSize: '0.85rem',
          color: soft.text,
          lineHeight: 1.55,
        }}
      >
        <Box sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.82rem' }}>{title}</Box>
        <Box sx={{ color: soft.textSecondary }}>{body}</Box>
      </NeuPanel>
    </Box>
  </Box>
);
