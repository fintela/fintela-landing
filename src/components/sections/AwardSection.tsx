import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { SectionHeader } from '../primitives/SectionHeader';
import { NeuButton } from '../primitives/NeuButton';
import { NeuPanel } from '../primitives/NeuPanel';
import { MediaWell } from '../primitives/MediaWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { soft } from '../../theme/tokens';
import { STILLS } from '../../media/registry';
import { AWARD_POST } from '../../lib/award';
import winnerBadge from '../../assets/awards/hedgeweek-2026-winner-white.png';

const bodySx = { fontSize: { xs: '1rem', md: '1.0625rem' }, lineHeight: 1.65, color: soft.textSecondary } as const;

/**
 * Band 4, after the pipeline (WorkflowSection) and who it is for
 * (InstitutionalSection), as proof of the product the visitor has just
 * walked through: Fintela won New Solution Product of the
 * Year at the Hedgeweek US Awards 2026. The ceremony photo sits in a white card on the left (imagery
 * is always set into a surface, never on the ground); on the right are the
 * organiser's winner badge, what the awards are and what the win recognizes,
 * and the announcement post as the exit. On the light ground, so it breaks
 * up the ink bands either side of it (Who it's for, Research & News).
 *
 * The badge is Hedgeweek's own artwork, shown unaltered: never recoloured or
 * cropped. This is the variant on a white ground; the hero shows the
 * orange one, so the two never read as the same picture twice.
 */
export const AwardSection = () => {
  const { t } = useTranslation('home');

  return (
    <Section id="award" size="md">
      <SectionHeader align="left" eyebrow={t('award.eyebrow')} title={t('award.title')} titleAccent={t('award.titleAccent')} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 7fr) minmax(0, 5fr)' },
          columnGap: { md: 6 },
          rowGap: { xs: 5, md: 0 },
          alignItems: 'center',
        }}
      >
        <AnimateOnScroll direction="left">
          <NeuPanel sx={{ overflow: 'hidden' }}>
            <Box component="figure" sx={{ m: 0 }}>
              <MediaWell
                ratio="4/3"
                tone="plain"
                flush
                src={STILLS.awardCeremony}
                alt={t('award.photoAlt')}
                sizes="(min-width: 1200px) 640px, (min-width: 900px) 55vw, calc(100vw - 32px)"
              />
              <Typography
                component="figcaption"
                sx={{ px: { xs: 2.5, md: 3 }, py: 2, fontSize: '0.85rem', lineHeight: 1.5, color: soft.textSecondary }}
              >
                {t('award.photoCaption')}
              </Typography>
            </Box>
          </NeuPanel>
        </AnimateOnScroll>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 3.5 } }}>
          <AnimateOnScroll delay={120} direction="right">
            <Box
              component="img"
              src={winnerBadge}
              alt={t('award.badgeAlt')}
              width={960}
              height={365}
              loading="lazy"
              decoding="async"
              sx={{ display: 'block', width: '100%', maxWidth: 420, height: 'auto', borderRadius: '10px' }}
            />
          </AnimateOnScroll>
          <AnimateOnScroll delay={180}>
            <Typography sx={bodySx}>{t('award.about')}</Typography>
            <Typography sx={{ ...bodySx, mt: 2 }}>{t('award.recognizes')}</Typography>
          </AnimateOnScroll>
          <AnimateOnScroll delay={240}>
            <NeuButton tone="raised" to={AWARD_POST} endIcon={<ArrowForwardIcon />}>
              {t('award.exit')}
            </NeuButton>
          </AnimateOnScroll>
        </Box>
      </Box>
    </Section>
  );
};
