import { memo } from 'react';
import { Box } from '@mui/material';
import { preview } from '../../theme/tokens';
import { BEST_PATH, CHART, FAN, PERIODS, ROBUST_PATH, periodX } from './data';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface TrialChartProps {
  /** 0–1: how much of the fan of trials is drawn. The curves start one after another. */
  drawn?: number;
  /** Fade the fan back so the lit candidates stand out. */
  dimmed?: boolean;
  /** Mark where validation and out-of-sample begin, and shade what was held out. */
  periods?: boolean;
  /** Light the best in-sample trial (the one that falls apart). */
  best?: boolean;
  /** Light the robust candidate. */
  robust?: boolean;
  /** Draw one candidate along a path of its own instead (the comparison's in-between frames). */
  single?: { d: string; tone: 'good' | 'bad' };
  /** Names of the three periods, under the chart. */
  periodLabels?: { train: string; validation: string; oos: string };
}

const STAGGER = 0.5;

/**
 * Trial equity curves on the dark preview ground: a faint fan of every trial,
 * and up to two candidates lit in the colour of their verdict. Purely a
 * picture; whoever uses it names it for assistive tech and prints the figures
 * (trial count, in-sample and held-out results) beside it.
 */
export const TrialChart = memo(({ drawn = 1, dimmed = false, periods = false, best = false, robust = false, single, periodLabels }: TrialChartProps) => {
  const validationX = periodX(PERIODS.validation);
  const oosX = periodX(PERIODS.oos);
  const lit = { fill: 'none', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const fade = { transition: 'opacity 0.3s ease' } as const;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box component="svg" viewBox={`0 0 ${CHART.w} ${CHART.h}`} aria-hidden focusable="false" sx={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
        <g style={{ ...fade, opacity: periods ? 1 : 0 }}>
          <rect x={oosX} y={0} width={CHART.w - oosX} height={CHART.h} fill="rgba(255,255,255,0.045)" />
          <line x1={validationX} x2={validationX} y1={0} y2={CHART.h} stroke={preview.faint} strokeWidth={1} strokeDasharray="3 4" />
          <line x1={oosX} x2={oosX} y1={0} y2={CHART.h} stroke={preview.textMuted} strokeWidth={1} strokeDasharray="3 4" />
        </g>
        <g style={{ ...fade, opacity: dimmed ? 0.45 : 1 }}>
          {FAN.map((d, i) => {
            const p = clamp01((drawn * (1 + STAGGER) - (i / FAN.length) * STAGGER) / 1);
            return <path key={i} d={d} pathLength={1} fill="none" stroke={preview.faint} strokeWidth={1.2} strokeDasharray={1} strokeDashoffset={(1 - p).toFixed(3)} />;
          })}
        </g>
        {single ? (
          <path d={single.d} stroke={single.tone === 'good' ? preview.good : preview.bad} {...lit} />
        ) : (
          <>
            <path d={BEST_PATH} stroke={preview.bad} {...lit} style={{ ...fade, opacity: best ? 1 : 0 }} />
            <path d={ROBUST_PATH} stroke={preview.good} {...lit} style={{ ...fade, opacity: robust ? 1 : 0 }} />
          </>
        )}
      </Box>
      {periodLabels && (
        <Box
          aria-hidden
          sx={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, ${PERIODS.validation}fr) minmax(0, ${PERIODS.oos - PERIODS.validation}fr) minmax(0, ${1 - PERIODS.oos}fr)`,
            mt: 0.75,
            fontSize: '0.68rem',
            lineHeight: 1.25,
            color: preview.textMuted,
            textAlign: 'center',
            transition: 'opacity 0.3s ease',
            opacity: periods ? 1 : 0,
            '& > span': { px: 0.25, borderTop: `1px solid ${preview.line}`, pt: 0.5 },
            '& > span:last-of-type': { color: preview.text, borderTopColor: preview.textMuted },
          }}
        >
          <span>{periodLabels.train}</span>
          <span>{periodLabels.validation}</span>
          <span>{periodLabels.oos}</span>
        </Box>
      )}
    </Box>
  );
});
TrialChart.displayName = 'TrialChart';
