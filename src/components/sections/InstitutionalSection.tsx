import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
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
import { AudienceSwitch } from '../primitives/AudienceSwitch';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { neuGrid } from '../../theme/neu';
import { soft } from '../../theme/tokens';
import { AUDIENCES, useAudience } from '../../lib/audience';
import type { Audience } from '../../lib/audience';
import { STILLS } from '../../media/registry';
import { SOLUTION_PATHS, USE_CASE_KEY } from '../../solutions/registry';

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
 * Band 2. The selected seat gets the featured dossier plate (this band's one
 * gold ring) with a portrait set into it; the platform advantages run as a
 * staggered stack beside it; the other two seats become door cards. The
 * switch re-casts the band and writes `?for=` so the arrangement is shareable.
 */
export const InstitutionalSection = () => {
  const { t } = useTranslation('home');
  const { audience, setAudience } = useAudience();
  const others = AUDIENCES.filter((a) => a !== audience);
  const useCase = USE_CASE_KEY[audience];
  const outcomes = t(`useCases.audiences.${useCase}.outcomes`, { returnObjects: true }) as string[];

  return (
    <Section id="for-funds" size="lg">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          gap: { xs: 3, md: 4 },
          alignItems: 'end',
          mb: { xs: 5, md: 7 },
        }}
      >
        <SectionHeader
          align="left"
          gutter={false}
          eyebrow={t('audiences.eyebrow')}
          title={t('audiences.title')}
          titleAccent={t('audiences.titleAccent')}
          description={t('audiences.description')}
        />
        <AnimateOnScroll delay={120}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, pb: 0.5 }}>
            <AudienceSwitch
              label={t('audiences.switchLabel')}
              value={audience}
              onChange={setAudience}
              options={AUDIENCES.map((a) => ({ value: a, label: t(`audiences.switch.${a}`) }))}
            />
          </Box>
        </AnimateOnScroll>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: neuGrid.gap,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          gridTemplateAreas: {
            xs: '"dossier" "stack" "doors"',
            md: '"dossier stack" "doors stack"',
          },
          alignItems: 'start',
        }}
      >
        {/* The dossier: featured, and re-keyed on the seat so the reveal replays. */}
        <Box sx={{ gridArea: 'dossier', minWidth: 0 }}>
        <AnimateOnScroll key={audience} direction="left">
          <NeuPanel
            featured
            component="article"
            sx={{
              p: { xs: 3, md: 4, lg: 4.5 },
              display: 'grid',
              // Text column wider than the image's from sm, so the portrait sits
              // further right instead of splitting the panel down the middle.
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 6fr) minmax(0, 5fr)' },
              gap: { xs: 3, md: 3.5 },
              alignItems: 'stretch',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box>
                <TierBadge featured>{t(`useCases.audiences.${useCase}.badge`)}</TierBadge>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2.5, mb: 1.5 }}>
                <IconWell size={40}>{AUDIENCE_ICON[audience]}</IconWell>
                <Typography
                  component="h3"
                  sx={{ fontSize: { xs: '1.3rem', md: '1.45rem' }, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', color: soft.text }}
                >
                  {t(`useCases.audiences.${useCase}.title`)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.65, color: soft.textSecondary }}>
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
              <Box sx={{ mt: 'auto', pt: 3.5 }}>
                <NeuButton tone="accent" to={SOLUTION_PATHS[audience]} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {t(`audiences.items.${audience}.cta`)}
                </NeuButton>
              </Box>
            </Box>
            {/* 4/5 on its own row; beside the text it takes the column's width and
                the row's height instead (a grid item with an aspect-ratio does not
                stretch its width, so a ratio here would run past the plate).
                Flush bleeds to whichever panel edges it's actually touching, which
                flips with the layout: below the text at xs (left/right/bottom),
                beside it from sm (top/right/bottom) — so both the negative margins
                and which corners round have to track that same swap. */}
            <MediaWell
              ratio="4/5"
              flush
              src={STILLS.audiences[audience]}
              alt={t(`audiences.items.${audience}.imageAlt`)}
              sizes="(min-width: 1200px) 300px, (min-width: 900px) 30vw, 45vw"
              sx={{
                width: '100%',
                aspectRatio: { xs: '4 / 5', sm: 'auto' },
                alignSelf: 'stretch',
                minHeight: { sm: 340 },
                ml: { xs: -3, sm: 0 },
                mr: { xs: -3, sm: -3, md: -4, lg: -4.5 },
                mt: { xs: 0, sm: -3, md: -4, lg: -4.5 },
                mb: { xs: -3, sm: -3, md: -4, lg: -4.5 },
                borderTopLeftRadius: 0,
                borderTopRightRadius: { xs: 0, sm: '20px', md: '24px' },
                borderBottomLeftRadius: { xs: '20px', md: '24px' },
                borderBottomRightRadius: { xs: '20px', md: '24px' },
              }}
            />
          </NeuPanel>
        </AnimateOnScroll>
        </Box>

        <Box
          sx={{
            gridArea: 'stack',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: '1fr' },
            gap: 3,
            alignContent: 'start',
          }}
        >
          {ADVANTAGES.map((a, idx) => (
            <AnimateOnScroll key={a.key} delay={idx * 70} direction="right">
              <NeuPanel
                variant="tile"
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  p: { xs: 2.25, md: 2.5 },
                  // The diagonal: even tiles step in by one gap unit from lg.
                  ml: { lg: idx % 2 === 1 ? 3 : 0 },
                }}
              >
                <IconWell size={40}>{a.icon}</IconWell>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: soft.text, mb: 0.5, fontSize: '0.98rem' }}>
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

        <Box sx={{ gridArea: 'doors', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: neuGrid.gap }}>
          {others.map((a, idx) => (
            <AnimateOnScroll key={a} delay={160 + idx * 90} stretch>
              <NeuPanel
                to={SOLUTION_PATHS[a]}
                aria-label={t(`useCases.audiences.${USE_CASE_KEY[a]}.title`)}
                sx={{ p: { xs: 3, md: 3.25 }, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                  <IconWell>{AUDIENCE_ICON[a]}</IconWell>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: soft.text }}>
                    {t(`useCases.audiences.${USE_CASE_KEY[a]}.title`)}
                  </Typography>
                </Box>
                <Typography sx={{ mt: 1.75, mb: 2, fontSize: '0.88rem', lineHeight: 1.6, color: soft.textSecondary }}>
                  {t(`audiences.items.${a}.doorBlurb`)}
                </Typography>
                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.75, color: soft.accent, fontWeight: 600, fontSize: '0.88rem' }}>
                  {t('audiences.explore')}
                  <ArrowForwardIcon sx={{ fontSize: 16 }} />
                </Box>
              </NeuPanel>
            </AnimateOnScroll>
          ))}
        </Box>
      </Box>
    </Section>
  );
};
