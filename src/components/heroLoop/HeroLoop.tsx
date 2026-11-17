import { memo, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import { useTranslation } from 'react-i18next';
import { fonts, preview } from '../../theme/tokens';
import { groupDigits } from '../../lib/groupDigits';
import { useLoopClock } from '../../lib/useLoopClock';
import { track } from '../../lib/track';
import { PreviewFrame, IllustrativeNote } from '../charts/PreviewFrame';
import { TrialChart } from '../charts/TrialChart';
import { CodeSketch, CODE_LINES } from '../charts/CodeSketch';
import { CandidateRow } from '../charts/CandidateRow';
import { TRIALS } from '../charts/data';

/**
 * The storyboard, in seconds on the playhead. Four steps, 14 seconds:
 *
 *   hypothesis  a sentence is typed
 *   code        it becomes a Python function; its two parameters are marked
 *   trials      the function fans into trial curves while the counter runs
 *   verdict     the periods are marked, the best in-sample trial is flagged
 *               as overfit risk, and a steadier one goes to a person
 *
 * `still` is the frame a step holds when the loop is paused, and the last one
 * is the frame the page is prerendered with and the one reduced motion shows.
 */
const LOOP = 14;
const STEPS = [
  { key: 'hypothesis', start: 0, still: 2.8 },
  { key: 'code', start: 3, still: 5.9 },
  { key: 'trials', start: 6.2, still: 9.9 },
  { key: 'verdict', start: 10, still: 13.5 },
] as const;
const STILL = STEPS[STEPS.length - 1].still;

const T = {
  typeFrom: 0.3,
  typeFor: 2.1,
  codeFrom: 3.1,
  codeEvery: 0.42,
  paramsLit: 5.2,
  chartIn: 6.2,
  drawFrom: 6.5,
  drawFor: 3,
  periods: 10,
  best: 10.5,
  bestVerdict: 11.1,
  robust: 11.8,
  robustVerdict: 12.4,
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Quantised so the memoised chart re-renders sixty times over the draw, not every frame. */
const quantise = (v: number, steps: number) => Math.round(v * steps) / steps;

const H = 'hero.loop';
const V = 'visuals';

/** The hypothesis as a typed line: a caret while it is being written. */
const Prompt = memo(({ text, chars }: { text: string; chars: number }) => (
  <Box sx={{ display: 'flex', gap: 1, fontSize: { xs: '0.85rem', sm: '0.95rem' }, lineHeight: 1.5, minHeight: '3em' }}>
    <Box component="span" sx={{ color: preview.textMuted, fontFamily: fonts.mono }}>
      ›
    </Box>
    <Box component="span">
      {text.slice(0, chars)}
      {chars < text.length && <Box component="span" sx={{ display: 'inline-block', width: '0.5em', height: '1em', ml: '1px', verticalAlign: 'text-bottom', background: preview.textMuted }} />}
    </Box>
  </Box>
));
Prompt.displayName = 'Prompt';

const controlSx = {
  appearance: 'none',
  border: 0,
  m: 0,
  font: 'inherit',
  cursor: 'pointer',
  color: preview.textMuted,
  background: 'transparent',
  borderRadius: '8px',
  minHeight: 32,
  transition: 'color 0.18s ease, background-color 0.18s ease',
  '@media (hover: hover)': { '&:hover': { color: preview.text, background: 'rgba(255,255,255,0.07)' } },
  '&:focus-visible': { outline: `2px solid ${preview.text}`, outlineOffset: 2 },
} as const;

/**
 * The hero's product loop: a hypothesis becomes code, the code fans into
 * trial curves, and the result is two candidates — the best in sample, flagged
 * as overfit risk, and a steadier one passed to a person. It never shows a
 * best score on its own: the trial count stays beside the results.
 *
 * It plays while on screen and the tab is visible, holds otherwise, and has
 * play/pause and one button per step. On the server, on the first client
 * render and under reduced motion it is the finished frame, so the page is
 * whole without motion or JavaScript.
 */
export const HeroLoop = () => {
  const { t, i18n } = useTranslation('home');
  const stageRef = useRef<HTMLDivElement>(null);
  const { t: now, playing, setPlaying, seek } = useLoopClock(stageRef, LOOP, STILL);

  const prompt = t(`${V}.prompt`);
  const chars = Math.round(clamp01((now - T.typeFrom) / T.typeFor) * prompt.length);
  const codeLines = now < T.codeFrom ? 0 : Math.min(CODE_LINES, Math.floor((now - T.codeFrom) / T.codeEvery) + 1);
  const chartIn = now >= T.chartIn;
  const drawn = quantise(clamp01((now - T.drawFrom) / T.drawFor), 60);
  // Ease out, so the counter slows as the last trials come in.
  const count = Math.round((1 - (1 - drawn) ** 2) * TRIALS);
  const active = STEPS.reduce((found, step, i) => (now >= step.start ? i : found), 0);

  const onStep = useCallback(
    (i: number) => {
      // Playing: start the step from its top. Paused: show the step finished.
      seek(playing ? STEPS[i].start : STEPS[i].still);
      track('hero_loop_step', { hero_loop_step: STEPS[i].key });
    },
    [playing, seek],
  );

  return (
    <PreviewFrame
      label={t(`${H}.frame`)}
      meta={
        <Box component="span" sx={{ transition: 'opacity 0.3s ease', opacity: chartIn ? 1 : 0 }}>
          {t(`${V}.trials`, { n: groupDigits(count, i18n.language) })}
        </Box>
      }
      footer={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 1.25, borderTop: `1px solid ${preview.line}` }}>
            <Box
              component="button"
              type="button"
              aria-label={playing ? t(`${H}.pause`) : t(`${H}.play`)}
              onClick={() => setPlaying(!playing)}
              sx={{ ...controlSx, width: 32, p: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: preview.text }}
            >
              {playing ? <PauseRoundedIcon sx={{ fontSize: 20 }} /> : <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />}
            </Box>
            <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 0.25, minWidth: 0 }}>
              {STEPS.map((step, i) => (
                <Box component="li" key={step.key}>
                  <Box
                    component="button"
                    type="button"
                    aria-current={i === active ? 'step' : undefined}
                    aria-label={t(`${H}.stepJump`, { step: t(`${H}.steps.${step.key}`) })}
                    onClick={() => onStep(i)}
                    sx={{
                      ...controlSx,
                      px: { xs: 0.75, sm: 1.25 },
                      fontSize: { xs: '0.72rem', sm: '0.78rem' },
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      ...(i === active && { color: preview.text, background: 'rgba(255,255,255,0.1)' }),
                    }}
                  >
                    {t(`${H}.steps.${step.key}`)}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          <IllustrativeNote>{t(`${V}.illustrative`)}</IllustrativeNote>
        </Box>
      }
    >
      {/* One picture for assistive tech, described once; the moving parts inside are presentation. */}
      <Box ref={stageRef} role="img" aria-label={t(`${H}.label`)} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
        <Prompt text={prompt} chars={chars} />
        {/* Both layers share one grid cell, so the box is always as tall as the taller one and nothing below it moves. */}
        <Box sx={{ display: 'grid', minWidth: 0, '& > *': { gridArea: '1 / 1', minWidth: 0, transition: 'opacity 0.35s ease' } }}>
          <Box aria-hidden sx={{ opacity: chartIn ? 0 : 1, visibility: chartIn ? 'hidden' : 'visible' }}>
            <CodeSketch lines={codeLines} paramsLit={now >= T.paramsLit} />
          </Box>
          <Box aria-hidden sx={{ opacity: chartIn ? 1 : 0 }}>
            <TrialChart
              drawn={drawn}
              dimmed={now >= T.periods}
              periods={now >= T.periods}
              best={now >= T.best}
              robust={now >= T.robust}
              periodLabels={{ train: t(`${V}.periods.train`), validation: t(`${V}.periods.validation`), oos: t(`${V}.periods.oos`) }}
            />
            <Box sx={{ mt: 1.25 }}>
              <CandidateRow candidate="best" shown={now >= T.bestVerdict} />
              <CandidateRow candidate="robust" note shown={now >= T.robustVerdict} />
            </Box>
          </Box>
        </Box>
      </Box>
    </PreviewFrame>
  );
};
