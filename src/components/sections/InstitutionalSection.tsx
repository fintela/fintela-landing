import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { RefObject, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Section } from '../primitives/Section';
import { NeuPanel } from '../primitives/NeuPanel';
import { IconWell } from '../primitives/IconWell';
import { MediaWell } from '../primitives/MediaWell';
import { AnimateOnScroll } from '../common/AnimateOnScroll';
import { clippedGradientSx, neuGrid, quietLinkSx } from '../../theme/neu';
import { gradients, motion, soft } from '../../theme/tokens';
import type { Audience } from '../../lib/audience';
import { STILLS } from '../../media/registry';
import { USE_CASE_KEY } from '../../solutions/registry';

/** Left to right: independent quants leads, then the fund and research seats. */
const CARD_ORDER: readonly Audience[] = ['independents', 'funds', 'teams'];

const CARD_PAD = { xs: 3, md: 3.5 } as const;

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

/** Autoplay tick and how long a manual pick holds the carousel before it resumes. */
const AUTOPLAY_MS = 5200;
const RESUME_DELAY_MS = 9000;

/**
 * The band's centered header on the soft ground. Mirrors `SectionHeader`'s
 * centered layout (a gold rule flanking the eyebrow on both sides).
 */
const AudiencesHeaderBand = ({
  eyebrow,
  title,
  titleAccent,
  description,
}: {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
}) => {
  const rule = (
    <Box aria-hidden sx={{ width: 28, height: 3, borderRadius: '2px', background: gradients.gold, flexShrink: 0 }} />
  );
  return (
    <Box sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: { xs: 5, md: 8 } }}>
      <AnimateOnScroll delay={40}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 2.5 }}>
          {rule}
          <Typography
            component="span"
            sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: soft.textSecondary }}
          >
            {eyebrow}
          </Typography>
          {rule}
        </Box>
      </AnimateOnScroll>
      <AnimateOnScroll delay={90}>
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: soft.text,
            mb: 2.5,
            textWrap: 'balance',
          }}
        >
          {title}{' '}
          <Box component="span" sx={clippedGradientSx(gradients.goldText)}>
            {titleAccent}
          </Box>
        </Typography>
      </AnimateOnScroll>
      <AnimateOnScroll delay={150}>
        <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.65, color: soft.textSecondary, maxWidth: 640, mx: 'auto' }}>
          {description}
        </Typography>
      </AnimateOnScroll>
    </Box>
  );
};

/**
 * The band's content column. The band sits on the page's own soft ground:
 * neumorphic panels pair a white highlight with the ground's hue, so they
 * never go on an ink surface.
 */
const AudiencesBand = ({ children }: { children: ReactNode }) => <Box>{children}</Box>;

/**
 * Whether the carousel may tick: the panel is on screen, the tab is visible
 * and the visitor has not asked for reduced motion.
 */
function useAutoplayAllowed(target: RefObject<HTMLElement | null>): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    const update = () =>
      setAllowed(inView && document.visibilityState === 'visible' && !reduced.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update);
    };
  }, [target]);

  return allowed;
}

/**
 * Band 2. All three seats stay visible as a row of dossier cards; a
 * spotlight cycles between them (autoplay or a click) — the active card
 * stays sharp while the other two dim and blur — with the platform
 * advantages beneath. Same copy and images as before, just a more dynamic
 * presentation.
 */
export const InstitutionalSection = () => {
  const { t } = useTranslation('home');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplay = useAutoplayAllowed(carouselRef);
  const count = CARD_ORDER.length;

  useEffect(() => {
    if (paused || !autoplay) return undefined;
    const id = setInterval(() => setActive((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, autoplay, count]);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const goTo = (idx: number) => {
    setActive((idx + count) % count);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  };

  return (
    <Section id="for-funds" size="lg" tone="ink">
      <AudiencesBand>
        <AudiencesHeaderBand
          eyebrow={t('audiences.eyebrow')}
          title={t('audiences.title')}
          titleAccent={t('audiences.titleAccent')}
          description={t('audiences.description')}
        />

        <Box
          ref={carouselRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          sx={{ mb: { xs: 3, md: 4 } }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: neuGrid.columns(3) },
              gap: neuGrid.gap,
              alignItems: 'stretch',
            }}
          >
            {CARD_ORDER.map((audience, idx) => (
              <AnimateOnScroll key={audience} delay={idx * 90} stretch>
                <Box
                  role="button"
                  tabIndex={0}
                  aria-pressed={active === idx}
                  onClick={() => goTo(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      goTo(idx);
                    }
                  }}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transformOrigin: 'center',
                    transition: `transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease, filter 0.5s ease, background-image ${motion.fast}`,
                    transform: { md: active === idx ? 'scale(1.02)' : 'scale(0.98)' },
                    opacity: active === idx ? 1 : { xs: 1, md: 0.45 },
                    // The active/inactive blur-and-fade treatment is unchanged —
                    // the gold ring below is an independent hover/focus cue that
                    // layers on top of it (a blurred card can still be hovered
                    // to preview it before a click swaps it in).
                    filter: active === idx ? 'none' : { xs: 'none', md: 'blur(1.5px) saturate(0.7)' },
                    '@media (prefers-reduced-motion: reduce)': { transition: 'opacity 0.3s ease', transform: 'none', filter: 'none' },
                    // Same two-layer background as PricingPage's plan cards: an
                    // opaque white padding-box layer over the brand gradient
                    // painted to the border-box, so only the 1.5px ring (set on
                    // AudienceCard's NeuPanel, which this targets as its direct
                    // child) reads the gradient. Card, not wrapper, so it never
                    // squares off the rounded corners.
                    '@media (hover: hover)': {
                      '&:hover > article': {
                        backgroundImage: `linear-gradient(${soft.surfaceRaised}, ${soft.surfaceRaised}), ${gradients.gold}`,
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box',
                      },
                    },
                    '&:focus-within > article': {
                      backgroundImage: `linear-gradient(${soft.surfaceRaised}, ${soft.surfaceRaised}), ${gradients.gold}`,
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                    },
                  }}
                >
                  <AudienceCard audience={audience} />
                </Box>
              </AnimateOnScroll>
            ))}
          </Box>

          <Box
            role="tablist"
            aria-label={t('audiences.title')}
            sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: { xs: 2.5, md: 3 } }}
          >
            {CARD_ORDER.map((audience, idx) => (
              <Box
                key={audience}
                component="button"
                type="button"
                role="tab"
                aria-selected={active === idx}
                aria-label={t(`useCases.audiences.${USE_CASE_KEY[audience]}.title`)}
                onClick={() => goTo(idx)}
                sx={{
                  width: active === idx ? 22 : 8,
                  height: 8,
                  p: 0,
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  // This band is permanently ink (tone="ink" above), not a
                  // light ground, so the inactive dot is the onInk-muted
                  // white rather than palette.borderStrong.
                  background: active === idx ? gradients.gold : soft.onInkMuted,
                  transition: 'width 0.25s ease, background 0.25s ease',
                }}
              />
            ))}
          </Box>
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
              <NeuPanel
                variant="tile"
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1, p: { xs: 2.25, md: 2.5 }, height: '100%' }}
              >
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
      </AudiencesBand>
    </Section>
  );
};

const AudienceCard = ({ audience }: { audience: Audience }) => {
  const { t } = useTranslation('home');
  const useCase = USE_CASE_KEY[audience];

  return (
    <NeuPanel
      component="article"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 0,
        overflow: 'hidden',
        maxWidth: { xs: 560, md: 'none' },
        mx: { xs: 'auto', md: 0 },
        width: '100%',
        height: '100%',
        // 1.5px transparent at rest (NeuPanel's own raisedPanelSx is 1px), so
        // the hover/focus gold ring painted by the wrapping Box above never
        // shifts the card's size when it appears.
        border: '1.5px solid transparent',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', p: CARD_PAD, pb: 0, flex: '0 0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
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
        {/* The fund seat is the one bought on a custom plan, so its card is
            where the pricing page earns a contextual link. */}
        {audience === 'funds' && (
          <Box
            component={RouterLink}
            to="/pricing"
            sx={[quietLinkSx, { mt: 2, display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.88rem', fontWeight: 600, color: soft.accent, alignSelf: 'flex-start' }]}
          >
            {t('audiences.items.funds.pricingLink')}
            <ArrowForwardIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          position: 'relative',
          flex: '1 1 auto',
          minHeight: { xs: 260, md: 320 },
          mt: 3,
          overflow: 'hidden',
        }}
      >
        <MediaWell
          tone="plain"
          flush
          src={STILLS.audiences[audience]}
          alt={t(`audiences.items.${audience}.imageAlt`)}
          sizes="(min-width: 900px) 30vw, (min-width: 600px) 560px, 100vw"
          sx={{
            position: 'static',
            aspectRatio: 'auto',
            width: '100%',
            height: '100%',
            borderRadius: 0,
            boxShadow: 'none',
            '&::after': { display: 'none' },
            '& > img, & > picture, & > picture > img': {
              position: 'static',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          }}
        />
      </Box>
    </NeuPanel>
  );
};
