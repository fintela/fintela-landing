import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients } from '../../theme/tokens';
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
    <Section id="fintelagent" tone="gradient" size="lg">
      <SectionHeader
        eyebrowTone="gradient"
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

        <AnimateOnScroll delay={200}>
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
  <Box
    sx={{
      display: 'flex',
      gap: 2,
      alignItems: 'flex-start',
      p: { xs: 2.25, md: 2.5 },
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: '#fff',
      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
      '&:hover': {
        borderColor: 'rgba(102,126,234,0.4)',
        transform: 'translateX(4px)',
        boxShadow: '0 12px 28px rgba(102,126,234,0.12)',
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
        boxShadow: '0 6px 14px rgba(102,126,234,0.32)',
        '& svg': { fontSize: 20 },
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: '0.98rem' }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.6 }}>
        {desc}
      </Typography>
    </Box>
  </Box>
);

const ChatPreview = () => {
  const { t } = useTranslation('home');
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(11,16,32,0.08)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 460,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: '#fafbfc',
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 2,
            background: gradients.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 14 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
            {t('fintelAgent.chat.assistantName')}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', letterSpacing: '0.04em' }}>
            {t('fintelAgent.chat.statusLine')}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
          <Typography sx={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
            {t('fintelAgent.chat.online')}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.75,
          bgcolor: '#fdfdff',
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
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'rgba(102,126,234,0.4)',
              bgcolor: 'rgba(102,126,234,0.04)',
              fontSize: '0.75rem',
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
            }}
          >
            <CheckRoundedIcon sx={{ fontSize: 14, color: '#10b981' }} />
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
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 1.25,
          bgcolor: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            px: 1.5,
            py: 0.9,
            borderRadius: 999,
            border: '1px solid',
            borderColor: 'divider',
            color: 'text.disabled',
            fontSize: '0.82rem',
          }}
        >
          {t('fintelAgent.chat.inputPlaceholder')}
        </Box>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: gradients.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ↑
        </Box>
      </Box>
    </Box>
  );
};

const UserBubble = ({ text }: { text: string }) => (
  <Box sx={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
    <Box
      sx={{
        p: 1.5,
        background: gradients.brand,
        color: '#fff',
        borderRadius: '14px 14px 4px 14px',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        boxShadow: '0 8px 18px rgba(102,126,234,0.22)',
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
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: 2,
        background: gradients.brand,
        flexShrink: 0,
        mt: 0.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}
    >
      <AutoAwesomeIcon sx={{ fontSize: 14 }} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 999,
          mb: 0.75,
          border: '1px solid',
          borderColor: tone === 'success' ? 'rgba(16,185,129,0.3)' : 'divider',
          bgcolor: tone === 'success' ? 'rgba(16,185,129,0.08)' : '#fafbfc',
          fontSize: '0.65rem',
          fontWeight: 600,
          color: tone === 'success' ? '#10b981' : 'text.secondary',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {tone === 'success' && <CheckRoundedIcon sx={{ fontSize: 11 }} />}
        {tool}
      </Box>
      <Box
        sx={{
          p: 1.5,
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '4px 14px 14px 14px',
          fontSize: '0.85rem',
          color: 'text.primary',
          lineHeight: 1.55,
        }}
      >
        <Box sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.82rem' }}>{title}</Box>
        <Box sx={{ color: 'text.secondary' }}>{body}</Box>
      </Box>
    </Box>
  </Box>
);
