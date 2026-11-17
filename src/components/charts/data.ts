/**
 * The illustrative data behind the home page's visuals: a fan of trial
 * equity curves and the two candidates the story is about. Nothing here is a
 * track record; every visual that draws it says "Illustrative data".
 *
 * Generated once, at module scope, from a fixed seed with integer and basic
 * arithmetic only (no Math.sin/exp/log, whose last bit can differ between
 * JavaScript engines), and rounded to one decimal. The prerenderer and every
 * browser therefore produce the same strings, which hydration requires.
 */

/** The chart's own coordinate space; the SVG scales it to its box. */
export const CHART = { w: 400, h: 200 } as const;
const PAD = { x: 6, top: 14, bottom: 12 } as const;

/** Points per curve. */
const POINTS = 40;

/**
 * Where the three periods meet, as a share of the window: the search sees
 * train, validation is reported but never steers it, and out-of-sample is
 * held back until the end.
 */
export const PERIODS = { validation: 0.6, oos: 0.8 } as const;

/** The trial budget the visuals describe. */
export const TRIALS = 1000;

/** mulberry32: a small deterministic PRNG built on integer operations. */
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rand = mulberry32(20261115);
/** Roughly normal, from three uniforms: mean 0, standard deviation 0.5. */
const noise = () => rand() + rand() + rand() - 1.5;

/** A random walk over the window: `drift(x)` per unit of x, plus noise. */
const walk = (drift: (x: number) => number, vol: number): number[] => {
  const out = [0];
  let v = 0;
  for (let i = 1; i < POINTS; i++) {
    v += drift(i / (POINTS - 1)) / (POINTS - 1) + noise() * vol;
    out.push(v);
  }
  return out;
};

const FAN_COUNT = 26;
const fanRaw = Array.from({ length: FAN_COUNT }, () => {
  const d = -0.3 + 1.2 * rand();
  return walk(() => d, 0.03);
});
/** The best trial in sample: steep through train, flat in validation, falling once out of sample. */
const bestRaw = walk((x) => (x < PERIODS.validation ? 1.95 : x < PERIODS.oos ? 0.45 : -2.3), 0.016);
/** The robust candidate: a steadier climb that keeps going out of sample. */
const robustRaw = walk(() => 0.86, 0.013);

const all = [...fanRaw, bestRaw, robustRaw].flat();
const lo = Math.min(...all);
const hi = Math.max(...all);

const round = (n: number) => Math.round(n * 10) / 10;
const toPoints = (values: number[]): [number, number][] =>
  values.map((v, i) => [
    round(PAD.x + (i / (POINTS - 1)) * (CHART.w - 2 * PAD.x)),
    round(CHART.h - PAD.bottom - ((v - lo) / (hi - lo)) * (CHART.h - PAD.top - PAD.bottom)),
  ]);

export type Points = readonly (readonly [number, number])[];

/** An SVG path through `points`. */
export const pathOf = (points: Points): string => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');

export const FAN: readonly string[] = fanRaw.map((v) => pathOf(toPoints(v)));
export const BEST_POINTS: Points = toPoints(bestRaw);
export const ROBUST_POINTS: Points = toPoints(robustRaw);
export const BEST_PATH = pathOf(BEST_POINTS);
export const ROBUST_PATH = pathOf(ROBUST_POINTS);

/** x of a period boundary in chart units. */
export const periodX = (share: number) => round(PAD.x + share * (CHART.w - 2 * PAD.x));

/**
 * The two candidates' figures, as the app would report them. In-sample and
 * held-out Sharpe are always shown together and beside the trial count; the
 * verdict follows the documented cutoffs (deflated Sharpe below 0.90 is
 * Overfit Risk, 0.95 and above is Well Trained).
 */
export const CANDIDATES = {
  best: { trial: 412, inSample: '1.84', heldOut: '0.41', deflated: '0.62', verdict: 'overfitRisk' },
  robust: { trial: 287, inSample: '1.31', heldOut: '1.12', deflated: '0.96', verdict: 'wellTrained' },
} as const;

export type CandidateKey = keyof typeof CANDIDATES;
export type VerdictKey = (typeof CANDIDATES)[CandidateKey]['verdict'];
