import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { gradients } from '../../theme/tokens';
import BusinessIcon from '@mui/icons-material/Business';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { ReactNode } from 'react';

interface Audience {
  icon: ReactNode;
  badge: string;
  title: string;
  description: string;
  outcomes: string[];
}

const audienceMeta = [
  { key: 'institutions', icon: <BusinessIcon /> },
  { key: 'independents', icon: <PersonOutlineIcon /> },
  { key: 'researchDesks', icon: <GroupsIcon /> },
] as const;

export const UseCasesSection = () => {
  const { t } = useTranslation('home');
  return (
    <Section id="use-cases" tone="default" size="lg">
      <SectionHeader
        eyebrow={t('useCases.eyebrow')}
        title={t('useCases.title')}
        titleAccent={t('useCases.titleAccent')}
        description={t('useCases.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: { xs: 2.5, md: 3 },
        }}
      >
        {audienceMeta.map((a, idx) => (
          <AnimateOnScroll key={a.key} delay={idx * 90}>
            <AudienceCard
              icon={a.icon}
              badge={t(`useCases.audiences.${a.key}.badge`)}
              title={t(`useCases.audiences.${a.key}.title`)}
              description={t(`useCases.audiences.${a.key}.description`)}
              outcomes={t(`useCases.audiences.${a.key}.outcomes`, { returnObjects: true }) as string[]}
              highlighted={idx === 0}
            />
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};

const AudienceCard = ({
  icon,
  badge,
  title,
  description,
  outcomes,
  highlighted,
}: Audience & { highlighted?: boolean }) => (
  <Box
    sx={{
      position: 'relative',
      p: { xs: 3, md: 3.5 },
      borderRadius: 4,
      border: '1px solid',
      borderColor: highlighted ? 'rgba(102,126,234,0.3)' : 'divider',
      background: highlighted
        ? 'linear-gradient(180deg, #ffffff 0%, rgba(102,126,234,0.04) 100%)'
        : '#fff',
      boxShadow: highlighted
        ? '0 18px 40px rgba(102,126,234,0.12)'
        : '0 4px 14px rgba(11,16,32,0.04)',
      transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: 'rgba(102,126,234,0.4)',
        boxShadow: '0 24px 50px rgba(102,126,234,0.16)',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          background: gradients.brand,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 18px rgba(102,126,234,0.25)',
          '& svg': { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'text.disabled',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {badge}
      </Typography>
    </Box>
    <Typography
      sx={{
        fontSize: { xs: '1.05rem', md: '1.15rem' },
        fontWeight: 700,
        color: 'text.primary',
        letterSpacing: '-0.015em',
        mb: 1,
      }}
    >
      {title}
    </Typography>
    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6, mb: 2.5 }}>
      {description}
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto' }}>
      {outcomes.map((o) => (
        <Box key={o} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: gradients.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: '2px',
            }}
          >
            <ArrowForwardIcon sx={{ fontSize: 10, color: '#fff' }} />
          </Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.primary', fontWeight: 500 }}>
            {o}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
);
