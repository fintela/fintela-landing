import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { MEASURE, SectionHeader } from '../primitives/SectionHeader';
import { fonts, motion, soft } from '../../theme/tokens';
import { quietLinkSx } from '../../theme/neu';
import { HEADER_OFFSET } from '../../lib/scrollToSection';
import { useMediaMatch } from '../../lib/useMediaMatch';
import { CreateInvestingStrategy } from '../createInvestingStrategy/CreateInvestingStrategy';
import { OptimizeStudy } from '../optimizeStudy/OptimizeStudy';
import { ValidateStudy } from '../validateStudy/ValidateStudy';
import { LaunchToLive } from '../launchToLive/LaunchToLive';

const STEPS = ['build', 'optimize', 'validate', 'deploy'] as const;

/**
 * Where the canvas pins: wide and tall enough for the text and a visual side
 * by side under the header, on a screen, and only for visitors who have not
 * asked for less motion. Everywhere else — phones, short windows, print,
 * reduced motion — the three steps simply follow each other, each with its
 * visual under it.
 */
const PIN_QUERY = 'screen and (min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)';
const PIN = `@media ${PIN_QUERY}`;
/**
 * How tall each step's stretch of scroll is while the canvas is pinned, and so
 * how tall the canvas is: the two are the same height, so the canvas lines up
 * with the first step's text when it sticks and with the last step's text when
 * it lets go, and the last visual leaves the screen together with its text
 * instead of being cut off mid-step. Never shorter than the tallest visual.
 */
const STEP_H = 'max(64vh, 580px)';

const H = 'how';

const MODELS = ['Claude', 'ChatGPT', 'Gemini', 'DeepSeek'];
const BROKERS = ['Alpaca', 'Northgate', 'Meridian', 'Kestrel'];

/** Build: the strategy being written, by whichever model is plugged in. */
const BuildVisual = ({ pinned, on }: { pinned: boolean; on: boolean }) => {
  const { t } = useTranslation('home');
  if (pinned && !on) return null;
  return <CreateInvestingStrategy names={MODELS} landOn={0} label={t(`${H}.anim.strategy`)} />;
};

/** Optimize: the trials searching a heat map, closing on the best zone. */
const OptimizeVisual = ({ pinned, on }: { pinned: boolean; on: boolean }) => {
  const { t } = useTranslation('home');
  if (pinned && !on) return null;
  return <OptimizeStudy label={t(`${H}.anim.study`)} detail={t(`${H}.anim.detail`)} />;
};

/** Validate: the held-out report, with its statistics and verdict. */
const ValidateVisual = ({ pinned, on }: { pinned: boolean; on: boolean }) => {
  const { t } = useTranslation('home');
  if (pinned && !on) return null;
  const k = (n: string) => t(`${H}.anim.validateStudy.${n}`);
  return (
    <ValidateStudy
      title={k('title')}
      train={k('train')}
      validation={k('validation')}
      oos={k('oos')}
      best={k('best')}
      robust={k('robust')}
      interval={k('interval')}
      stats={[
        { label: k('s1'), value: k('v1') },
        { label: k('s2'), value: k('v2') },
        { label: k('s3'), value: k('v3') },
      ]}
      verdict={k('verdict')}
    />
  );
};

/** Deploy: launched to a broker, live. */
const DeployVisual = ({ pinned, on }: { pinned: boolean; on: boolean }) => {
  const { t, i18n } = useTranslation('home');
  if (pinned && !on) return null;
  return (
    <LaunchToLive
      brokers={BROKERS}
      landOn={0}
      liveLabel={t(`${H}.anim.live`)}
      returnLabel={t(`${H}.anim.ret`)}
      sharpeLabel={t(`${H}.anim.sharpe`)}
      locale={i18n.language}
    />
  );
};

/**
 * Section 3, how it works: Build, Optimize, Validate. Each step is one
 * sentence, one technical proof line and one visual; the full five-stage
 * pipeline is one click away on the Platform page.
 *
 * Where there is room (PIN_QUERY) the visuals share one canvas pinned beside
 * the text: the three steps scroll past on the left and the canvas shows the
 * visual of whichever step is at the middle of the screen. It is plain
 * `position: sticky` over the page's own scroll — the wheel, keys, scrollbar
 * and touch all drive it and nothing is hijacked. The layout is CSS over one
 * DOM (text, visual, text, visual…), so the prerendered page carries all
 * three steps and their visuals in reading order whatever the screen.
 */
export const HowItWorks = () => {
  const { t } = useTranslation('home');
  const pinned = useMediaMatch(PIN_QUERY);
  const [active, setActive] = useState(0);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);

  // The step whose text crosses the middle of the screen is the one on the canvas.
  useEffect(() => {
    if (!pinned) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(textRefs.current.indexOf(entry.target as HTMLDivElement));
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    textRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pinned]);

  return (
    <Section id="how-it-works" size="lg">
      <SectionHeader align="left" eyebrow={t(`${H}.eyebrow`)} title={t(`${H}.title`)} />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 },
          [PIN]: {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
            gridTemplateRows: `repeat(${STEPS.length}, auto)`,
            columnGap: 8,
            rowGap: 0,
            // The header above already ends with its own gutter; the first step is centred in its stretch of scroll.
            mt: -6,
          },
        }}
      >
        {STEPS.map((key, i) => {
          const on = i === active;
          return [
            <Box
              key={`${key}-text`}
              ref={(el: HTMLDivElement | null) => {
                textRefs.current[i] = el;
              }}
              sx={{
                mt: { xs: i ? 3 : 0, md: i ? 4 : 0 },
                [PIN]: {
                  mt: 0,
                  gridColumn: 1,
                  gridRow: i + 1,
                  minHeight: STEP_H,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: `opacity ${motion.base}`,
                  opacity: on ? 1 : 0.4,
                },
              }}
            >
              <Typography aria-hidden sx={{ fontFamily: fonts.mono, fontSize: '0.78rem', color: soft.textSecondary, mb: 1 }}>
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Typography component="h3" sx={{ fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, color: soft.text, mb: 1.5 }}>
                {t(`${H}.steps.${key}.name`)}
              </Typography>
              <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.6, color: soft.textSecondary, maxWidth: MEASURE, mb: 2 }}>
                {t(`${H}.steps.${key}.body`)}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'baseline', gap: 1, fontFamily: fonts.mono, fontSize: '0.82rem', lineHeight: 1.5, color: soft.text }}>
                <Box component="span" aria-hidden sx={{ width: 16, height: 2, flexShrink: 0, borderRadius: '1px', background: soft.linkAccent, transform: 'translateY(-4px)' }} />
                {t(`${H}.steps.${key}.proof`)}
              </Typography>
            </Box>,
            <Box
              key={`${key}-visual`}
              // On the pinned canvas only the active visual is there to be used; the others are out of reach, not just invisible.
              inert={pinned && !on}
              sx={{
                // In the flow a visual keeps a readable width instead of stretching across the page.
                maxWidth: 680,
                [PIN]: {
                  maxWidth: 'none',
                  gridColumn: 2,
                  gridRow: '1 / -1',
                  position: 'sticky',
                  // Centred in what is left of the screen under the header.
                  top: `calc(${HEADER_OFFSET}px + (100vh - ${HEADER_OFFSET}px - ${STEP_H}) / 2)`,
                  height: STEP_H,
                  alignSelf: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  transition: `opacity ${motion.base}`,
                  opacity: on ? 1 : 0,
                  pointerEvents: on ? 'auto' : 'none',
                },
              }}
            >
              {key === 'build' ? <BuildVisual pinned={pinned} on={on} /> : key === 'optimize' ? <OptimizeVisual pinned={pinned} on={on} /> : key === 'validate' ? <ValidateVisual pinned={pinned} on={on} /> : <DeployVisual pinned={pinned} on={on} />}
            </Box>,
          ];
        })}
      </Box>

      <Box sx={{ mt: { xs: 4, md: 5 }, [PIN]: { mt: 0 } }}>
        <Box
          component={RouterLink}
          to="/product/platform"
          sx={[quietLinkSx, { display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: '0.95rem', fontWeight: 600, color: soft.linkAccent }]}
        >
          {t(`${H}.link`)}
          <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    </Section>
  );
};
