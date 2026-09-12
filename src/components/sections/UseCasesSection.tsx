import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { CheckWell } from '../primitives/CheckWell';
import { TierBadge } from '../primitives/TierBadge';
import { Groove } from '../primitives/Groove';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { neuGrid } from '../../theme/neu';
import { soft } from '../../theme/tokens';
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
    <Section id="use-cases" size="lg">
      <SectionHeader
        eyebrow={t('useCases.eyebrow')}
        title={t('useCases.title')}
        titleAccent={t('useCases.titleAccent')}
        description={t('useCases.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: neuGrid.columns(3) },
          gap: neuGrid.gap,
          alignItems: 'stretch',
        }}
      >
        {audienceMeta.map((a, idx) => (
          <AnimateOnScroll key={a.key} delay={idx * 90} stretch>
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
  <NeuPanel
    featured={highlighted}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      p: { xs: 3, md: 4 },
      maxWidth: { xs: 560, md: 'none' },
      mx: { xs: 'auto', md: 0 },
      width: '100%',
      height: '100%',
    }}
  >
    <Box sx={{ height: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
      <TierBadge featured={highlighted}>{badge}</TierBadge>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minHeight: 48, mb: 2.5 }}>
      <IconWell>{icon}</IconWell>
      <Typography
        sx={{
          fontSize: { xs: '1.25rem', md: '1.375rem' },
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          color: soft.text,
        }}
      >
        {title}
      </Typography>
    </Box>
    <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.65, color: soft.textSecondary, mb: 2.5 }}>
      {description}
    </Typography>
    <Groove sx={{ mb: 2.5 }} />
    <Box
      component="ul"
      role="list"
      sx={{
        m: 0,
        p: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        mt: 'auto',
      }}
    >
      {outcomes.map((o) => (
        <Box component="li" key={o} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
          <Box sx={{ mt: '2px', display: 'inline-flex' }}>
            <CheckWell size={20} icon={<ArrowForwardIcon />} />
          </Box>
          <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6, color: soft.text, overflowWrap: 'anywhere' }}>
            {o}
          </Typography>
        </Box>
      ))}
    </Box>
  </NeuPanel>
);
