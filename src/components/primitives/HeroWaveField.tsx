import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useEffect, useRef } from 'react';
import { palette as brand } from '../../theme/tokens';

export interface HeroWaveFieldPalette {
  /** Hue at both ends of every stream — curves, stipple and trails. */
  teal: string;
  /** Hue at the centre of every stream. */
  cyan: string;
  /** Floating metric labels and tick marks. */
  ink: string;
}

export interface HeroWaveFieldProps {
  /** `#rrggbb` colours. */
  palette?: Partial<HeroWaveFieldPalette>;
  /** Opacity multiplier for the whole field — 1 is the tuned default. */
  intensity?: number;
  /** Max pointer-parallax shift in px for the nearest layer; 0 disables it. */
  parallax?: number;
  /** Fixes the random layout — pass one for screenshot tests. */
  seed?: number;
  sx?: SxProps<Theme>;
}

const DEFAULT_PALETTE: HeroWaveFieldPalette = {
  teal: '#0d9488',
  cyan: brand.info,
  ink: brand.textMuted,
};

const WAVES = 6;
const MAX_DOTS = 72;
const MAX_COMETS = 14;
const MAX_METRICS = 14;
/** px between curve samples. */
const STEP = 4;
/** Stipple alpha is quantised so each wave fills one batched path per level. */
const BUCKETS = 6;
const MAX_DPR = 2;
// 60fps cap. The threshold sits below one 60Hz frame so rAF jitter never
// drops a real frame, while a 120Hz half-frame is always skipped.
const MIN_FRAME_MS = (1000 / 60) * 0.75;
/** s — clamps the catch-up step after a paused tab. */
const MAX_DT = 1 / 20;
/** s — the frame shown under prefers-reduced-motion. */
const STATIC_T = 20;
const TAU = Math.PI * 2;
const FONT = '500 11px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

type Rgb = readonly [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const signed = (v: number, digits: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(digits)}`;

const mulberry32 = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Smooth 1-D value noise on a 256-cell lattice, in [-1, 1]. */
const makeNoise = (rand: () => number) => {
  const lattice = Float32Array.from({ length: 256 }, () => rand() * 2 - 1);
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    const a = lattice[i & 255];
    const b = lattice[(i + 1) & 255];
    return a + (b - a) * s;
  };
};

const STATS: ReadonlyArray<readonly [string, (r: number) => string]> = [
  ['σ', (r) => (0.08 + r * 0.3).toFixed(3)],
  ['β', (r) => (0.3 + r * 0.9).toFixed(2)],
  ['α', (r) => signed(r * 0.6, 2)],
  ['Sharpe', (r) => (0.8 + r * 1.9).toFixed(2)],
  ['R²', (r) => (0.6 + r * 0.38).toFixed(2)],
  ['ρ', (r) => signed(r * 0.9 - 0.3, 2)],
  ['t', (r) => (1.2 + r * 2.4).toFixed(2)],
];

interface Dot {
  u: number;
  dy: number;
  size: number;
  speed: number;
  freq: number;
  phase: number;
}

interface Wave {
  base: number;
  amp: number;
  depth: number;
  slope: number;
  k: readonly [number, number, number];
  v: readonly [number, number, number];
  p: readonly [number, number, number];
  nAmp: number;
  nFreq: number;
  nSpeed: number;
  nOff: number;
  width: number;
  alpha: number;
  rgb: Rgb;
  rgbAlt: Rgb;
  fills: string[];
  trailTail: string;
  trailHead: string;
  halo: string;
  head: string;
  stroke: string | CanvasGradient;
  dots: Dot[];
  activeDots: number;
}

interface Comet {
  wave: number;
  u: number;
  speed: number;
  tail: number;
}

type MetricKind = 'pct' | 'coord' | 'stat' | 'tick';

interface Metric {
  kind: MetricKind;
  text: string;
  positive: boolean;
  nx: number;
  ny: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  depth: number;
}

interface SceneConfig {
  palette: HeroWaveFieldPalette;
  intensity: number;
  parallax: number;
  seed: number;
}

interface EdgeFade {
  fill: CanvasGradient;
  x: number;
  y: number;
  w: number;
  h: number;
}

const createScene = (ctx: CanvasRenderingContext2D, cfg: SceneConfig) => {
  const rand = mulberry32(cfg.seed);
  const noise = makeNoise(rand);
  const sign = () => (rand() < 0.5 ? -1 : 1);
  const teal = hexToRgb(cfg.palette.teal);
  const cyan = hexToRgb(cfg.palette.cyan);
  const inkCss = rgba(hexToRgb(cfg.palette.ink), 1);
  const tealCss = rgba(teal, 1);
  const { intensity } = cfg;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let pad = 0;
  let px = 0;
  let py = 0;
  let targetX = 0;
  let targetY = 0;
  let activeComets = 0;
  let activeMetrics = 0;
  let edgeFades: EdgeFade[] = [];

  // Evenly spaced baselines, shuffled so near and far streams interleave.
  const slots = Array.from({ length: WAVES }, (_, i) => 0.22 + (0.64 * i) / (WAVES - 1));
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }

  const waves: Wave[] = slots.map((slot, i) => {
    const depth = i / (WAVES - 1);
    const lambda = 520 + rand() * 460;
    const [a, b] = i % 2 === 0 ? [teal, cyan] : [cyan, teal];
    const rgb = mix(a, b, rand() * 0.3);
    const rgbAlt = mix(b, a, rand() * 0.3);
    const dotRgb = mix(rgb, rgbAlt, 0.5);
    return {
      base: slot + (rand() - 0.5) * 0.05,
      amp: 0.045 + rand() * 0.045,
      depth,
      slope: 0.012 + rand() * 0.03,
      k: [
        TAU / lambda,
        TAU / (lambda * (0.38 + rand() * 0.12)),
        TAU / (lambda * (0.19 + rand() * 0.06)),
      ],
      v: [
        (0.1 + rand() * 0.18) * sign(),
        (0.15 + rand() * 0.25) * sign(),
        (0.2 + rand() * 0.3) * sign(),
      ],
      p: [rand() * TAU, rand() * TAU, rand() * TAU],
      nAmp: 5 + rand() * 6,
      nFreq: 1 / (70 + rand() * 60),
      nSpeed: 18 + rand() * 22,
      nOff: rand() * 100,
      width: 1 + 0.9 * depth,
      alpha: 0.16 + 0.26 * depth,
      rgb,
      rgbAlt,
      fills: Array.from({ length: BUCKETS }, (_, level) =>
        rgba(dotRgb, ((level + 0.5) / BUCKETS) * 0.6)
      ),
      trailTail: rgba(rgbAlt, 0),
      trailHead: rgba(rgbAlt, 0.75),
      halo: rgba(rgbAlt, 0.12),
      head: rgba(rgbAlt, 0.95),
      stroke: 'transparent',
      dots: Array.from({ length: MAX_DOTS }, () => ({
        u: rand(),
        dy: (rand() + rand() + rand() - 1.5) * 22,
        size: 0.9 + rand() * 1.4,
        speed: 0.012 + rand() * 0.02,
        freq: 0.5 + rand() * 1.2,
        phase: rand() * TAU,
      })),
      activeDots: 0,
    };
  });

  const dotX = new Float32Array(MAX_DOTS);
  const dotY = new Float32Array(MAX_DOTS);
  const dotBucket = new Uint8Array(MAX_DOTS);

  const respawnComet = (c: Comet, u: number) => {
    c.wave = Math.floor(rand() * WAVES);
    c.u = u;
    c.speed = 0.035 + rand() * 0.04;
    c.tail = 70 + rand() * 90;
  };

  const comets: Comet[] = Array.from({ length: MAX_COMETS }, () => {
    const c = { wave: 0, u: 0, speed: 0, tail: 0 };
    respawnComet(c, rand() * 1.1 - 0.05);
    return c;
  });

  const spawnMetric = (m: Metric, initial: boolean) => {
    const r = rand();
    m.positive = false;
    if (r < 0.42) {
      m.kind = 'pct';
      m.positive = rand() < 0.68;
      m.text = `${m.positive ? '+' : '−'}${(0.05 + rand() * 4.6).toFixed(2)}%`;
    } else if (r < 0.62) {
      m.kind = 'coord';
      m.text = `${(rand() * 2).toFixed(3)}, ${(rand() * 2).toFixed(3)}`;
    } else if (r < 0.86) {
      m.kind = 'stat';
      const [label, format] = STATS[Math.floor(rand() * STATS.length)];
      m.text = `${label} ${format(rand())}`;
    } else {
      m.kind = 'tick';
      m.text = '';
    }
    m.nx = rand();
    m.ny = rand();
    m.vx = (rand() - 0.5) * 10;
    m.vy = -(3 + rand() * 6);
    m.life = 12 + rand() * 12;
    m.age = initial ? rand() * m.life : 0;
    m.depth = 0.7 + rand() * 0.5;
  };

  const metrics: Metric[] = Array.from({ length: MAX_METRICS }, () => {
    const m: Metric = {
      kind: 'tick',
      text: '',
      positive: false,
      nx: 0,
      ny: 0,
      vx: 0,
      vy: 0,
      life: 1,
      age: 0,
      depth: 1,
    };
    spawnMetric(m, true);
    return m;
  });

  const waveY = (w: Wave, x: number, t: number) =>
    w.base * H +
    w.amp *
      H *
      (0.55 * Math.sin(w.k[0] * x + w.v[0] * t + w.p[0]) +
        0.3 * Math.sin(w.k[1] * x + w.v[1] * t + w.p[1]) +
        0.15 * Math.sin(w.k[2] * x + w.v[2] * t + w.p[2])) +
    w.nAmp * noise((x - t * w.nSpeed) * w.nFreq + w.nOff) -
    w.slope * (x - W * 0.5);

  /** Parallax: the transform carries the layer offset, so drawing stays in CSS px. */
  const layer = (depth: number) =>
    ctx.setTransform(dpr, 0, 0, dpr, px * depth * dpr, py * depth * dpr);

  // globalAlpha silently ignores values outside [0, 1], which would leave a
  // stale alpha in place — so clamp instead of trusting intensity.
  const alpha = (v: number) => {
    ctx.globalAlpha = clamp(v, 0, 1);
  };

  // The field dissolves at the band's edges. Erasing four edge bands with
  // destination-out gradients touches under half the canvas; a full-canvas
  // mask composite was the single most expensive op when rasterised on CPU.
  const buildEdgeFades = () => {
    const top = H * 0.14;
    const bottom = H * 0.18;
    const side = W * 0.08;
    const ramp = (x0: number, y0: number, x1: number, y1: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      return g;
    };
    edgeFades = [
      { fill: ramp(0, 0, 0, top), x: 0, y: 0, w: W, h: top },
      { fill: ramp(0, H, 0, H - bottom), x: 0, y: H - bottom, w: W, h: bottom },
      { fill: ramp(0, 0, side, 0), x: 0, y: 0, w: side, h: H },
      { fill: ramp(W, 0, W - side, 0), x: W - side, y: 0, w: side, h: H },
    ];
  };

  const resize = (width: number, height: number, ratio: number) => {
    W = width;
    H = height;
    dpr = ratio;
    pad = cfg.parallax + STEP * 2;
    const widthScale = clamp(W / 1440, 0.45, 1.2);
    const areaScale = clamp((W * H) / (1440 * 640), 0.4, 1.25);
    for (const w of waves) {
      w.activeDots = Math.min(MAX_DOTS, Math.round(58 * widthScale * (0.55 + 0.45 * w.depth)));
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, rgba(w.rgb, 0));
      g.addColorStop(0.18, rgba(w.rgb, 1));
      g.addColorStop(0.55, rgba(w.rgbAlt, 1));
      g.addColorStop(0.85, rgba(w.rgb, 1));
      g.addColorStop(1, rgba(w.rgb, 0));
      w.stroke = g;
    }
    activeComets = Math.min(MAX_COMETS, Math.round(11 * widthScale));
    activeMetrics = Math.min(MAX_METRICS, Math.round(11 * areaScale));
    buildEdgeFades();
  };

  const setPointer = (x: number, y: number) => {
    targetX = x;
    targetY = y;
  };

  const update = (dt: number) => {
    const ease = 1 - Math.exp(-dt * 4);
    px += (targetX * cfg.parallax - px) * ease;
    py += (targetY * cfg.parallax * 0.6 - py) * ease;
    for (let i = 0; i < activeComets; i++) {
      const c = comets[i];
      c.u += c.speed * dt;
      if (c.u * W > W + c.tail + 8) respawnComet(c, -0.03);
    }
    for (let i = 0; i < activeMetrics; i++) {
      const m = metrics[i];
      m.age += dt;
      if (m.age >= m.life) {
        spawnMetric(m, false);
        continue;
      }
      m.nx += (m.vx * dt) / W;
      m.ny += (m.vy * dt) / H;
    }
  };

  const draw = (t: number) => {
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const w of waves) {
      layer(0.3 + 0.7 * w.depth);
      ctx.beginPath();
      ctx.moveTo(-pad, waveY(w, -pad, t));
      for (let x = -pad + STEP; x <= W + pad; x += STEP) ctx.lineTo(x, waveY(w, x, t));
      ctx.strokeStyle = w.stroke;
      // The soft halo: at far-wave alphas it is invisible, so only near waves pay for it.
      if (w.depth >= 0.5) {
        alpha(w.alpha * 0.25 * intensity);
        ctx.lineWidth = w.width * 6;
        ctx.stroke();
      }
      alpha(w.alpha * intensity);
      ctx.lineWidth = w.width;
      ctx.stroke();
    }

    alpha(1);
    for (const w of waves) {
      layer(0.4 + 0.7 * w.depth);
      const n = w.activeDots;
      for (let i = 0; i < n; i++) {
        const d = w.dots[i];
        const x = ((d.u + t * d.speed) % 1) * W;
        dotX[i] = x;
        dotY[i] = waveY(w, x, t) + d.dy;
        const near = 1 - Math.min(1, Math.abs(d.dy) / 34);
        const twinkle = 0.65 + 0.35 * Math.sin(t * d.freq + d.phase);
        const a = (0.1 + 0.55 * near) * twinkle * (0.55 + 0.45 * w.depth) * intensity;
        dotBucket[i] = Math.min(BUCKETS - 1, Math.floor((a / 0.6) * BUCKETS));
      }
      for (let level = 0; level < BUCKETS; level++) {
        let any = false;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          if (dotBucket[i] !== level) continue;
          const s = w.dots[i].size;
          ctx.rect(dotX[i] - s / 2, dotY[i] - s / 2, s, s);
          any = true;
        }
        if (any) {
          ctx.fillStyle = w.fills[level];
          ctx.fill();
        }
      }
    }

    ctx.lineWidth = 1.5;
    alpha(intensity);
    for (let i = 0; i < activeComets; i++) {
      const c = comets[i];
      const w = waves[c.wave];
      layer(0.4 + 0.7 * w.depth);
      const hx = c.u * W;
      const x0 = hx - c.tail;
      const g = ctx.createLinearGradient(x0, 0, hx, 0);
      g.addColorStop(0, w.trailTail);
      g.addColorStop(1, w.trailHead);
      ctx.beginPath();
      ctx.moveTo(x0, waveY(w, x0, t));
      for (let k = 1; k <= 10; k++) {
        const x = x0 + (c.tail * k) / 10;
        ctx.lineTo(x, waveY(w, x, t));
      }
      ctx.strokeStyle = g;
      ctx.stroke();
      const hy = waveY(w, hx, t);
      ctx.fillStyle = w.halo;
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = w.head;
      ctx.beginPath();
      ctx.arc(hx, hy, 1.8, 0, TAU);
      ctx.fill();
    }

    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineWidth = 1;
    ctx.strokeStyle = inkCss;
    for (let i = 0; i < activeMetrics; i++) {
      const m = metrics[i];
      const p = m.age / m.life;
      const env = smoothstep(0, 0.18, p) * (1 - smoothstep(0.72, 1, p));
      if (env < 0.02) continue;
      layer(m.depth);
      const x = m.nx * W;
      const y = m.ny * H;
      const positive = m.kind === 'pct' && m.positive;
      alpha(env * (positive ? 0.75 : 0.5) * intensity);
      ctx.fillStyle = positive ? tealCss : inkCss;
      if (m.kind === 'tick') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 28, y);
        for (let k = 0; k <= 3; k++) {
          ctx.moveTo(x + k * 9, y - 3);
          ctx.lineTo(x + k * 9, y);
        }
        ctx.stroke();
      } else if (m.kind === 'coord') {
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.stroke();
        ctx.fillText(m.text, x + 10, y);
      } else {
        ctx.fillText(m.text, x, y);
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    alpha(1);
    ctx.globalCompositeOperation = 'destination-out';
    for (const f of edgeFades) {
      ctx.fillStyle = f.fill;
      ctx.fillRect(f.x, f.y, f.w, f.h);
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawStatic = () => {
    px = 0;
    py = 0;
    targetX = 0;
    targetY = 0;
    draw(STATIC_T);
  };

  return { resize, setPointer, update, draw, drawStatic };
};

/**
 * Hero band ambience: layered teal/cyan streams drawn as composite sines with
 * a noise term, stippled with drifting points, ridden by short particle
 * trails, and overlaid with faint drifting quant metrics. Transparent canvas,
 * so it takes the band's own ground; the edges dissolve so nothing meets a
 * hard seam.
 *
 * Absolute and inert: pass it to `<Section background>` (or drop it into any
 * `position: relative` box) and the content above keeps every click. Runs
 * only while on-screen and the tab is visible; under
 * `prefers-reduced-motion` it paints one still frame and never animates.
 */
export const HeroWaveField = ({
  palette,
  intensity = 1,
  parallax = 14,
  seed,
  sx,
}: HeroWaveFieldProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const teal = palette?.teal ?? DEFAULT_PALETTE.teal;
  const cyan = palette?.cyan ?? DEFAULT_PALETTE.cyan;
  const ink = palette?.ink ?? DEFAULT_PALETTE.ink;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = createScene(ctx, {
      palette: { teal, cyan, ink },
      intensity,
      parallax,
      seed: seed ?? Math.floor(Math.random() * 2 ** 31),
    });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const noHover = window.matchMedia('(hover: none)');

    let raf = 0;
    let last = 0;
    let t = 0;
    let running = false;
    let sized = false;
    let inView = false;
    let pageVisible = !document.hidden;
    let disposed = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      const elapsed = now - last;
      if (elapsed < MIN_FRAME_MS) return;
      last = now;
      const dt = Math.min(elapsed / 1000, MAX_DT);
      t += dt;
      scene.update(dt);
      scene.draw(t);
    };

    const sync = () => {
      const shouldRun = sized && inView && pageVisible && !reducedMotion.matches;
      if (shouldRun && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    let width = 0;
    let height = 0;
    const fit = () => {
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      scene.resize(width, height, dpr);
      sized = true;
      // Setting the backing size blanks the canvas; repaint now rather than
      // composite an empty frame mid-drag.
      if (reducedMotion.matches) scene.drawStatic();
      else scene.draw(t);
      sync();
    };

    // ResizeObserver is silent when only the device pixel ratio changes (the
    // window dragged onto a monitor of another density), so watch that too.
    let dprQuery: MediaQueryList | null = null;
    const onDprChange = () => {
      watchDpr();
      fit();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    };

    const onVisibility = () => {
      pageVisible = !document.hidden;
      sync();
    };

    const onMotionPreference = () => {
      if (reducedMotion.matches) scene.drawStatic();
      sync();
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      scene.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    };
    const onPointerLeave = () => scene.setPointer(0, 0);

    const resizeObserver = new ResizeObserver((entries) => {
      ({ width, height } = entries[entries.length - 1].contentRect);
      fit();
    });
    resizeObserver.observe(host);
    watchDpr();
    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { rootMargin: '80px' }
    );
    intersection.observe(host);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionPreference);
    // The still frame is painted before the label font arrives; repaint once it has.
    document.fonts.ready.then(() => {
      if (!disposed && reducedMotion.matches) scene.drawStatic();
    });

    const parallaxOn = parallax > 0 && !noHover.matches;
    if (parallaxOn) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      window.addEventListener('blur', onPointerLeave);
      document.documentElement.addEventListener('mouseleave', onPointerLeave);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      dprQuery?.removeEventListener('change', onDprChange);
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionPreference);
      if (parallaxOn) {
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('blur', onPointerLeave);
        document.documentElement.removeEventListener('mouseleave', onPointerLeave);
      }
    };
  }, [teal, cyan, ink, intensity, parallax, seed]);

  return (
    <Box
      ref={hostRef}
      aria-hidden
      sx={
        [
          {
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0,
            '@media (forced-colors: active)': { display: 'none' },
            '@media print': { display: 'none' },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>
      }
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </Box>
  );
};
