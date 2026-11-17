import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { preview } from '../../theme/tokens';
import { track } from '../../lib/track';
import { PreviewFrame, IllustrativeNote } from './PreviewFrame';
import { TrialChart } from './TrialChart';
import { CandidateRow } from './CandidateRow';
import { BEST_POINTS, ROBUST_POINTS, pathOf } from './data';
import type { CandidateKey, Points } from './data';

const OPTIONS: readonly CandidateKey[] = ['best', 'robust'];
const POINTS: Record<CandidateKey, Points> = { best: BEST_POINTS, robust: ROBUST_POINTS };
const MORPH_MS = 400;
const REDUCED = '(prefers-reduced-motion: reduce)';

const mix = (from: Points, to: Points, k: number): Points =>
  from.map(([x, y], i) => [x, Math.round((y + (to[i][1] - y) * k) * 10) / 10] as const);

const C = 'how.compare';
const V = 'visuals';

/**
 * The validation comparison: the same search, two candidates. The best
 * in-sample trial climbs steeply and then falls once it reaches data the
 * search never saw; the robust candidate climbs less and holds. The visitor
 * switches between them; nothing plays on its own.
 *
 * Both states show the same things beside the curve — which trial of how
 * many, in-sample and held-out Sharpe, deflated Sharpe, the verdict — so a
 * score never appears alone. It opens on the best in-sample trial, because
 * the failure is the point.
 */
export const ValidationCompare = ({
  deflated = true,
  illustrativeNote = true,
}: {
  /** Show the deflated Sharpe beside the in-sample and held-out figures. */
  deflated?: boolean;
  /** The "Illustrative data" note under the frame; off where a plate badge already says it. */
  illustrativeNote?: boolean;
} = {}) => {
  const { t } = useTranslation('home');
  const [selected, setSelected] = useState<CandidateKey>('best');
  /** The in-between curve while one candidate turns into the other; null at rest. */
  const [morph, setMorph] = useState<Points | null>(null);
  const raf = useRef(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const select = useCallback(
    (next: CandidateKey) => {
      if (next === selected) return;
      cancelAnimationFrame(raf.current);
      setSelected(next);
      track('validation_toggle', { validation_candidate: next });
      if (window.matchMedia(REDUCED).matches) {
        setMorph(null);
        return;
      }
      const from = morph ?? POINTS[selected];
      const to = POINTS[next];
      const startedAt = performance.now();
      const frame = (nowMs: number) => {
        const k = Math.min(1, (nowMs - startedAt) / MORPH_MS);
        // Ease in and out.
        const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        if (k < 1) {
          setMorph(mix(from, to, eased));
          raf.current = requestAnimationFrame(frame);
        } else {
          setMorph(null);
        }
      };
      raf.current = requestAnimationFrame(frame);
    },
    [morph, selected],
  );

  // A radio group: arrow keys move the choice and the focus together.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = (OPTIONS.indexOf(selected) + step + OPTIONS.length) % OPTIONS.length;
    select(OPTIONS[i]);
    buttons.current[i]?.focus();
  };

  const tone = selected === 'robust' ? 'good' : 'bad';

  return (
    <PreviewFrame label={t(`${C}.frame`)} footer={illustrativeNote ? <IllustrativeNote>{t(`${V}.illustrative`)}</IllustrativeNote> : undefined}>
      <Box
        role="radiogroup"
        aria-label={t(`${C}.label`)}
        onKeyDown={onKeyDown}
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.5, p: 0.5, borderRadius: '10px', background: preview.surface, boxShadow: `inset 0 0 0 1px ${preview.line}` }}
      >
        {OPTIONS.map((key, i) => {
          const on = key === selected;
          return (
            <Box
              key={key}
              component="button"
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              ref={(el: HTMLButtonElement | null) => {
                buttons.current[i] = el;
              }}
              onClick={() => select(key)}
              sx={{
                appearance: 'none',
                border: 0,
                m: 0,
                font: 'inherit',
                cursor: 'pointer',
                minHeight: 40,
                px: 1,
                borderRadius: '7px',
                fontSize: { xs: '0.78rem', sm: '0.85rem' },
                fontWeight: 600,
                lineHeight: 1.25,
                color: on ? preview.ground : preview.textMuted,
                background: on ? preview.text : 'transparent',
                transition: 'color 0.18s ease, background-color 0.18s ease',
                '@media (hover: hover)': { '&:hover': { color: on ? preview.ground : preview.text } },
                '&:focus-visible': { outline: `2px solid ${preview.text}`, outlineOffset: 2 },
                '@media (forced-colors: active)': { border: on ? '2px solid Highlight' : '1px solid ButtonBorder' },
              }}
            >
              {t(`${C}.${key}`)}
            </Box>
          );
        })}
      </Box>

      <Box role="img" aria-label={t(`${C}.chart.${selected}`)}>
        <TrialChart
          dimmed
          periods
          best={selected === 'best'}
          robust={selected === 'robust'}
          single={morph ? { d: pathOf(morph), tone } : undefined}
          periodLabels={{ train: t(`${V}.periods.train`), validation: t(`${V}.periods.validation`), oos: t(`${V}.periods.oos`) }}
        />
      </Box>

      {/* Announced when the choice changes, so the result is not only a colour and a curve. */}
      <Box aria-live="polite">
        <CandidateRow candidate={selected} deflated={deflated} note={selected === 'robust'} />
      </Box>
    </PreviewFrame>
  );
};
