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
 * Section 1. On the left: the award as one line of text, the headline that
 * says what Fintela is, one subhead and the site's two calls to action. On
 * the right: the "From thesis to edge" film, looping muted. Nothing else.
 *
 * This is where the brand gradient is most visible, and it is still three
 * small things: the rule beside the award line, the last words of the
 * headline, and a blurred halo behind the film.
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
    <Section id="hero" size="lg" sx={{ pt: { xs: 4, md: 8 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 7fr) minmax(0, 13fr)' },
          columnGap: { md: 4, lg: 5 },
          rowGap: 5,
          alignItems: 'center',
        }}
      >
        <Box>
          <Box
            component={RouterLink}
            to={AWARD_POST}
            sx={[
              quietLinkSx,
              {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 3,
                fontSize: '0.82rem',
                fontWeight: 600,
                lineHeight: 1.5,
                color: soft.textSecondary,
                textWrap: 'balance',
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
              sx={{ display: 'block', width: { xs: 96, md: 112 }, height: 'auto', flexShrink: 0, borderRadius: '6px' }}
            />
            {t('hero.eyebrow')}
          </Box>

          <Typography
            variant="h1"
            sx={{ fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3rem', lg: '3.5rem' }, color: soft.text, textWrap: 'balance', mb: 3 }}
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

          <Typography sx={{ color: soft.textSecondary, fontSize: { xs: '1.0625rem', md: '1.1875rem' }, lineHeight: 1.6, maxWidth: MEASURE, mb: 4.5 }}>
            {t('hero.subtitle')}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } } }}>
            <CtaButton kind="trial" placement="hero" />
            <CtaButton kind="walkthrough" placement="hero" />
          </Box>
        </Box>

        {/* The halo: the mark's ramp, blurred and faint, behind the film. It
            stays inside this box, so it adds no scroll width. */}
        <Box
          sx={{
            position: 'relative',
            minWidth: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: { xs: '10% 3% -3%', md: '12% 1% -5%' },
              borderRadius: '32px',
              background: gradients.mark,
              filter: 'blur(48px)',
              opacity: 0.3,
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
            sizes="(min-width: 1200px) 820px, (min-width: 900px) 65vw, 100vw"
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
      </Box>
    </Section>
  );
};
