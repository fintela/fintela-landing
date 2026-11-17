import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { Section } from '../primitives/Section';
import { CtaButton } from '../primitives/CtaButton';
import { MEASURE } from '../primitives/SectionHeader';
import { VideoPlate } from '../primitives/VideoPlate';
import { clippedGradientSx, quietLinkSx } from '../../theme/neu';
import { gradients, radii, shadows, soft } from '../../theme/tokens';
import { AWARD_POST } from '../../lib/award';
import { VIDEOS } from '../../media/registry';
import winnerBadge from '../../assets/awards/hedgeweek-2026-winner.png';

/**
 * Section 1. Centred on top: the headline. Below it, clear of the headline,
 * the "From thesis to edge" film looping muted (the focal point), with a
 * column beside it on the left: the award as a small line (tertiary), the
 * subhead and the site's two calls to action. On a phone the film comes
 * first, straight under the headline, then that column.
 *
 * This is where the brand gradient is most visible, and it is still two
 * small things: the last words of the headline and a blurred halo behind
 * the film.
 *
 * Not wrapped in AnimateOnScroll: this is the first thing on the page and it
 * is all there in the prerendered HTML, so nothing should wait to appear.
 */
export const HomeHero = () => {
  const { t } = useTranslation('home');

  // The headline is one sentence in the catalogue; `titleMark` names the words
  // at its end that carry the gradient. If a translation drops or rewords
  // them, the headline simply renders plain.
  const title = t('hero.title');
  const mark = t('hero.titleMark');
  const cut = mark ? title.lastIndexOf(mark) : -1;

  return (
    <Section id="hero" size="lg" sx={{ pt: { xs: 5, md: 8 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        {/* Secondary: the headline, centred above the film. */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.25rem', lg: '3.75rem' },
            color: soft.text,
            textWrap: 'balance',
            maxWidth: 920,
            mb: { xs: 4, md: 7 },
          }}
        >
          {cut < 0 ? (
            title
          ) : (
            <>
              {title.slice(0, cut)}
              <Box component="span" sx={clippedGradientSx(gradients.goldText)}>
                {title.slice(cut)}
              </Box>
            </>
          )}
        </Typography>

        {/* The film (primary) on the right, the subhead and buttons beside it. */}
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 4fr) minmax(0, 9fr)' },
            columnGap: { md: 5, lg: 7 },
            rowGap: { xs: 4, md: 0 },
            alignItems: 'center',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Box sx={{ order: { xs: 1, md: 0 }, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
            {/* Tertiary: the award, small and quiet, heading the description. */}
            <Box
              component={RouterLink}
              to={AWARD_POST}
              sx={[
                quietLinkSx,
                {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.25,
                  mb: 3,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  lineHeight: 1.45,
                  color: soft.textSecondary,
                  textAlign: 'left',
                  maxWidth: { xs: 420, md: 'none' },
                },
              ]}
            >
              <Box
                component="img"
                src={winnerBadge}
                alt=""
                width={640}
                height={243}
                decoding="async"
                sx={{ display: 'block', width: { xs: 64, md: 76 }, height: 'auto', flexShrink: 0, borderRadius: '4px' }}
              />
              {t('hero.eyebrow')}
            </Box>

            <Typography
              sx={{
                color: soft.textSecondary,
                fontSize: { xs: '1.0625rem', md: '1.125rem' },
                lineHeight: 1.6,
                maxWidth: MEASURE,
                mb: 4,
                textWrap: 'pretty',
              }}
            >
              {t('hero.subtitle')}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 1.5,
                width: '100%',
                '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } },
                // Beside the film the column is too narrow for both in a row:
                // stack them, equal width, instead of letting one wrap ragged.
                '@media (min-width: 900px)': {
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  maxWidth: 260,
                  '& > *': { flex: 'none' },
                },
              }}
            >
              <CtaButton kind="trial" placement="hero" />
              <CtaButton kind="walkthrough" placement="hero" />
            </Box>
          </Box>

          {/* Primary: the film, as a figure with its disclaimer underneath. */}
          <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
            {/* The halo is the mark's ramp, blurred and faint, behind the film;
                it stays inside this box, so it adds no scroll width. */}
            <Box
              sx={{
                position: 'relative',
                minWidth: 0,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: { xs: '10% 3% -3%', md: '12% 2% -5%' },
                  borderRadius: '32px',
                  background: gradients.mark,
                  filter: 'blur(56px)',
                  opacity: 0.26,
                  pointerEvents: 'none',
                },
                '& > *': { position: 'relative' },
                '@media (forced-colors: active), print': { '&::before': { display: 'none' } },
              }}
            >
              {/* A non-interactive loop: plays only while on screen, no controls.
                  Always plays, even under reduced motion or data-saver. */}
              <VideoPlate
                mode="ambient"
                priority
                alwaysPlay
                src={VIDEOS.thesisToEdge.src}
                poster={VIDEOS.thesisToEdge.poster}
                posterAlt={t(VIDEOS.thesisToEdge.posterAltKey)}
                label={t(VIDEOS.thesisToEdge.posterAltKey)}
                silent
                ratio="16/9"
                sizes="(min-width: 1200px) 840px, (min-width: 900px) 66vw, 100vw"
                sx={{
                  '& > div:first-of-type': {
                    bgcolor: soft.white,
                    borderRadius: { xs: `${radii.neuCardSm}px`, md: `${radii.neuCard}px` },
                    boxShadow: shadows.neuRaised,
                    '&::after': { boxShadow: shadows.neuRaised },
                  },
                }}
              />
            </Box>
            <Typography
              component="figcaption"
              sx={{ mt: 2, fontSize: '0.75rem', lineHeight: 1.5, color: soft.textSecondary, textWrap: 'pretty' }}
            >
              {t('hero.filmNote')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Section>
  );
};
