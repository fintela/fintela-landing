import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuPanel } from '../primitives/NeuPanel';
import { NeuButton } from '../primitives/NeuButton';
import { IconWell } from '../primitives/IconWell';
import { CheckWell } from '../primitives/CheckWell';
import { TierBadge } from '../primitives/TierBadge';
import { Groove } from '../primitives/Groove';
import { MediaWell } from '../primitives/MediaWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { neuGrid, quietLinkSx } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import type { Audience } from '../../lib/audience';
import { STILLS } from '../../media/registry';
import { SOLUTION_PATHS, USE_CASE_KEY } from '../../solutions/registry';

/** Left to right: independent quants leads, then the fund and research seats. */
const CARD_ORDER: readonly Audience[] = ['independents', 'funds', 'teams'];

const CARD_PAD = { xs: 3, md: 3.5 } as const;
const CARD_BLEED = { xs: -3, md: -3.5 } as const;

const AUDIENCE_ICON: Record<Audience, ReactNode> = {
  funds: <BusinessIcon />,
  independents: <PersonOutlineIcon />,
  teams: <GroupsIcon />,
};

const ADVANTAGES = [
  { key: 'infra', icon: <CloudOffOutlinedIcon /> },
  { key: 'concurrent', icon: <LayersOutlinedIcon /> },
  { key: 'provenance', icon: <VerifiedUserOutlinedIcon /> },
  { key: 'reports', icon: <DescriptionOutlinedIcon /> },
] as const;

/**
 * Band 2. All three seats stand as full dossier cards in one row, independent
 * quants carrying the featured ring, with the platform advantages beneath.
 */
export const InstitutionalSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="for-funds" size="lg">
      <SectionHeader
        eyebrow={t('audiences.eyebrow')}
        title={t('audiences.title')}
        titleAccent={t('audiences.titleAccent')}
        description={t('audiences.description')}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: neuGrid.columns(3) },
          gap: neuGrid.gap,
          alignItems: 'stretch',
          mb: { xs: 3, md: 4 },
        }}
      >
        {CARD_ORDER.map((audience, idx) => (
          <AnimateOnScroll key={audience} delay={idx * 90} stretch>
            <AudienceCard audience={audience} featured={idx === 0} />
          </AnimateOnScroll>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: neuGrid.columns(2), md: neuGrid.columns(4) },
          gap: neuGrid.gap,
        }}
      >
        {ADVANTAGES.map((a, idx) => (
          <AnimateOnScroll key={a.key} delay={idx * 70}>
            <NeuPanel variant="tile" sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: { xs: 2.25, md: 2.5 }, height: '100%' }}>
              <IconWell size={40}>{a.icon}</IconWell>
              <Box>
                {/* A sub-topic of the band, so a heading — the size is the tile's own. */}
                <Typography component="h3" sx={{ fontWeight: 700, color: soft.text, mb: 0.5, fontSize: '0.98rem' }}>
                  {t(`audiences.advantages.${a.key}.title`)}
                </Typography>
                <Typography sx={{ color: soft.textSecondary, fontSize: '0.86rem', lineHeight: 1.55 }}>
                  {t(`audiences.advantages.${a.key}.desc`)}
                </Typography>
              </Box>
            </NeuPanel>
          </AnimateOnScroll>
        ))}
      </Box>
    </Section>
  );
};

const AudienceCard = ({ audience, featured }: { audience: Audience; featured: boolean }) => {
  const { t } = useTranslation('home');
  const useCase = USE_CASE_KEY[audience];
  const outcomes = t(`useCases.audiences.${useCase}.outcomes`, { returnObjects: true }) as string[];

  return (
    <NeuPanel
      featured={featured}
      component="article"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: CARD_PAD,
        maxWidth: { xs: 560, md: 'none' },
        mx: { xs: 'auto', md: 0 },
        width: '100%',
        height: '100%',
      }}
    >
      <MediaWell
        ratio="16/9"
        flush
        src={STILLS.audiences[audience]}
        alt={t(`audiences.items.${audience}.imageAlt`)}
        sizes="(min-width: 900px) 30vw, (min-width: 600px) 560px, 100vw"
        sx={{ mx: CARD_BLEED, mt: CARD_BLEED, mb: 3 }}
      />
      <Box>
        <TierBadge featured={featured}>{t(`useCases.audiences.${useCase}.badge`)}</TierBadge>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, mb: 1.5 }}>
        <IconWell size={40}>{AUDIENCE_ICON[audience]}</IconWell>
        <Typography
          component="h3"
          sx={{ fontSize: { xs: '1.15rem', md: '1.25rem' }, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', color: soft.text }}
        >
          {t(`useCases.audiences.${useCase}.title`)}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.65, color: soft.textSecondary }}>
        {t(`useCases.audiences.${useCase}.description`)}
      </Typography>
      <Groove sx={{ my: 2.5 }} />
      <Box component="ul" role="list" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {outcomes.map((o) => (
          <Box component="li" key={o} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
            <Box sx={{ mt: '2px', display: 'inline-flex' }}>
              <CheckWell size={20} icon={<ArrowForwardIcon />} />
            </Box>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.6, color: soft.text, overflowWrap: 'anywhere' }}>{o}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 'auto', pt: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
        <NeuButton tone={featured ? 'accent' : 'raised'} to={SOLUTION_PATHS[audience]} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {t(`audiences.items.${audience}.cta`)}
        </NeuButton>
        {/* The fund seat is the one bought on a custom plan, so its card is
            where the pricing page earns a contextual link. */}
        {audience === 'funds' && (
          <Box
            component={RouterLink}
            to="/pricing"
            sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.88rem', fontWeight: 600, color: soft.accent }]}
          >
            {t('audiences.items.funds.pricingLink')}
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>
    </NeuPanel>
  );
};
