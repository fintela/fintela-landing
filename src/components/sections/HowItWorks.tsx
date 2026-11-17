import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../primitives/Section';
import { MEASURE, SectionHeader } from '../primitives/SectionHeader';
import { fonts, soft } from '../../theme/tokens';
import { quietLinkSx } from '../../theme/neu';
import { HEADER_OFFSET } from '../../lib/scrollToSection';
import { useMediaMatch } from '../../lib/useMediaMatch';
import type { SceneTime } from '../isoKit/timeline';
import { CreateInvestingStrategy } from '../createInvestingStrategy/CreateInvestingStrategy';
import { TOTAL as BUILD_TOTAL } from '../createInvestingStrategy/beats';
import { OptimizeStudy } from '../optimizeStudy/OptimizeStudy';
import { TOTAL as OPTIMIZE_TOTAL } from '../optimizeStudy/beats';
import { ValidateStudy } from '../validateStudy/ValidateStudy';
import { TOTAL as VALIDATE_TOTAL } from '../validateStudy/beats';
import { LaunchToLive } from '../launchToLive/LaunchToLive';
import { TOTAL as DEPLOY_TOTAL } from '../launchToLive/beats';
import { pinLength, useStepScrub } from './useStepScrub';

const STEPS = ['build', 'optimize', 'validate', 'deploy'] as const;

/** Each step's piece, in seconds of choreography, and so how long its frame stays pinned. */
const TOTALS = [BUILD_TOTAL, OPTIMIZE_TOTAL, VALIDATE_TOTAL, DEPLOY_TOTAL] as const;

/**
 * Where the steps pin: wide and tall enough for the text and a visual side by side
 * under the header, on a screen, and only for visitors who have not asked for less
 * motion. Everywhere else — phones, short windows, print, reduced motion — the steps
 * simply follow each other, each with its visual under it, and each visual plays once
 * as it comes into view.
 */
const PIN_QUERY = 'screen and (min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)';
const PIN = `@media ${PIN_QUERY}`;
/** A pinned frame fills the screen under the header, so its visual sits in the middle of it. */
const FRAME_H = `calc(100vh - ${HEADER_OFFSET}px)`;
/** The connector, as wide as the pen that draws it. */
const LINE = { width: 2, tip: 8 };

const H = 'how';

const MODELS = ['Claude', 'ChatGPT', 'Gemini', 'DeepSeek'];
const BROKERS = ['Alpaca', 'Northgate', 'Meridian', 'Kestrel'];

/** Build: the strategy being written, by whichever model is plugged in. */
const BuildVisual = ({ time }: { time?: SceneTime }) => {
  const { t } = useTranslation('home');
  return <CreateInvestingStrategy names={MODELS} landOn={0} label={t(`${H}.anim.strategy`)} time={time} />;
};

/** Optimize: the trials searching a heat map, closing on the best zone. */
const OptimizeVisual = ({ time }: { time?: SceneTime }) => {
  const { t } = useTranslation('home');
  return <OptimizeStudy label={t(`${H}.anim.study`)} detail={t(`${H}.anim.detail`)} time={time} />;
};

/** Validate: the held-out report, with its statistics and verdict. */
const ValidateVisual = ({ time }: { time?: SceneTime }) => {
  const { t } = useTranslation('home');
  const k = (n: string) => t(`${H}.anim.validateStudy.${n}`);
  return (
    <ValidateStudy
      time={time}
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
const DeployVisual = ({ time }: { time?: SceneTime }) => {
  const { t, i18n } = useTranslation('home');
  return (
    <LaunchToLive
      time={time}
      brokers={BROKERS}
      landOn={0}
      liveLabel={t(`${H}.anim.live`)}
      returnLabel={t(`${H}.anim.ret`)}
      sharpeLabel={t(`${H}.anim.sharpe`)}
      locale={i18n.language}
    />
  );
};

const VISUALS = { build: BuildVisual, optimize: OptimizeVisual, validate: ValidateVisual, deploy: DeployVisual };

/**
 * Half the line from one step's visual to the next: the tail runs from under a visual
 * to the bottom of its frame, the head from the top of the next frame to its visual.
 * Pinned frames are centred, so the two halves are the same length and meet where one
 * track ends and the next begins. `useStepScrub` draws them; only pinned layouts have them.
 */
const Connector = ({ part, segmentRef }: { part: 'head' | 'tail'; segmentRef: (el: HTMLElement | null) => void }) => (
  <Box
    ref={segmentRef}
    aria-hidden
    sx={{
      display: 'none',
      [PIN]: {
        display: 'block',
        position: 'absolute',
        left: '50%',
        width: 0,
        // The gap between the visual and its frame's edge: the visual's own height is `100%`.
        height: `calc((${FRAME_H} - 100%) / 2)`,
        ...(part === 'head' ? { bottom: '100%' } : { top: '100%' }),
      },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: -LINE.width / 2,
        width: LINE.width,
        height: '100%',
        background: soft.text,
        transformOrigin: 'top',
        transform: 'scaleY(0)',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: -LINE.tip / 2,
        width: LINE.tip,
        height: LINE.tip,
        borderRadius: '50%',
        background: soft.text,
        transform: 'translateY(-50%)',
        opacity: 0,
      }}
    />
  </Box>
);

/**
 * Section 3, how it works: Build, Optimize, Validate, Deploy. Each step is one
 * sentence, one technical proof line and one visual; the full pipeline is one click
 * away on the Platform page.
 *
 * Where there is room (PIN_QUERY) each step pins as a frame filling the screen, text
 * beside its visual, and the scroll plays that visual: forwards on the way down, back
 * on the way up, holding the page until it has finished. As the frame lets go, a line
 * draws down from its visual and lands on the next one just as that frame pins, so the
 * steps read as one chain. It is plain `position: sticky` over the page's own scroll;
 * nothing is hijacked. The layout is CSS over one DOM (text, visual, text, visual…), so
 * the prerendered page carries every step and its visual in reading order whatever the
 * screen.
 */
export const HowItWorks = () => {
  const { t } = useTranslation('home');
  const pinned = useMediaMatch(PIN_QUERY);
  const { times, trackRef, tailRef, headRef } = useStepScrub(TOTALS, pinned);

  return (
    <Section id="how-it-works" size="lg">
      <SectionHeader align="left" eyebrow={t(`${H}.eyebrow`)} title={t(`${H}.title`)} />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 6, md: 8 },
          // The header above already ends with its own gutter, and a pinned frame centres its content.
          [PIN]: { gap: 0, mt: -6 },
        }}
      >
        {STEPS.map((key, i) => {
          const Visual = VISUALS[key];
          return (
            <Box key={key} ref={trackRef(i)} sx={{ [PIN]: { height: `calc(${FRAME_H} + ${pinLength(TOTALS[i])}px)` } }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 3, md: 4 },
                  [PIN]: {
                    position: 'sticky',
                    top: HEADER_OFFSET,
                    height: FRAME_H,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)',
                    columnGap: 8,
                    alignContent: 'center',
                    alignItems: 'center',
                  },
                }}
              >
                <Box>
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
                </Box>

                {/* In the flow a visual keeps a readable width instead of stretching across the page. */}
                <Box sx={{ position: 'relative', maxWidth: 680, [PIN]: { maxWidth: 'none' } }}>
                  {i > 0 && <Connector part="head" segmentRef={headRef(i)} />}
                  <Visual time={pinned ? times[i] : undefined} />
                  {i < STEPS.length - 1 && <Connector part="tail" segmentRef={tailRef(i)} />}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: { xs: 4, md: 5 }, [PIN]: { mt: -6 } }}>
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
