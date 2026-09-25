/**
 * Canvas-drawn surfaces for the platform stack (scene.ts): the Fintela app
 * layout on the top layer, the engine floor and server racks in the middle,
 * the circuit board and die at the bottom. Drawn at runtime rather than
 * shipped as images: a few hundred lines of 2D calls weigh less than one
 * 2048px PNG, and the layout stays in step with the brand tokens.
 *
 * Every function returns a bare canvas; scene.ts wraps it in a texture. The
 * app strings below are the product's own UI labels (app.fintela.io is
 * English-only), not page copy, so they are not translated.
 */
import { fonts, palette } from '../../theme/tokens';

/** The app's chart hues (app.fintela.io), so the top layer reads as the product. */
const CHART = ['#4a8cc9', '#d8a72e', '#b8323f', '#1f9e8f', '#6a5fb0', '#5d9131', '#a85c9e', '#9a5a1a'] as const;

/** The mark's tri-colour, shared with the scene's pulses and data cubes. */
export const MARK = [palette.yellow, palette.red, palette.markBlue] as const;

const APP_GROUND = '#f5f7f9';
const APP_BORDER = '#e2e5e9';
const APP_TEXT = '#1c1f24';
const APP_MUTED = '#8b919a';
const SKELETON = '#e6e9ed';

type Ctx = CanvasRenderingContext2D;

const makeCanvas = (w: number, h: number): [HTMLCanvasElement, Ctx] => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [canvas, ctx];
};

const font = (weight: number, px: number, family: string = fonts.sans) => `${weight} ${Math.round(px)}px ${family}`;

/** `ctx.roundRect` is missing from older Safari; arcTo is everywhere. */
const roundRect = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const panel = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill = '#ffffff') => {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = APP_BORDER;
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.stroke();
};

/** An empty dashed slot — where a card lifted off the layout used to sit. */
const slot = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = '#eceff2';
  ctx.fill();
  ctx.setLineDash([h * 0.09 + 10, h * 0.07 + 8]);
  ctx.strokeStyle = '#c3c9d0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);
};

const bar = (ctx: Ctx, x: number, y: number, w: number, h: number, fill = SKELETON) => {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
};

const markGradient = (ctx: Ctx, x0: number, y0: number, x1: number, y1: number) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, palette.yellow);
  g.addColorStop(0.55, palette.red);
  g.addColorStop(1, palette.markBlue);
  return g;
};

/** The logo's caret "A": two strokes meeting at the apex, no crossbar. */
const caret = (ctx: Ctx, x: number, baseline: number, h: number, fill: string | CanvasGradient) => {
  const w = h * 0.92;
  const lw = h * 0.2;
  ctx.save();
  ctx.strokeStyle = fill;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x + lw * 0.35, baseline);
  ctx.lineTo(x + w / 2, baseline - h + lw * 0.45);
  ctx.lineTo(x + w - lw * 0.35, baseline);
  ctx.stroke();
  ctx.restore();
  return w;
};

/** FINTELA with the caret for the final A, letter-spaced like the app's sidebar. */
const wordmark = (ctx: Ctx, x: number, baseline: number, size: number) => {
  ctx.font = font(700, size);
  ctx.fillStyle = '#121212';
  ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (const ch of 'FINTEL') {
    ctx.fillText(ch, cx, baseline);
    cx += ctx.measureText(ch).width + size * 0.07;
  }
  const capH = size * 0.73;
  caret(ctx, cx, baseline, capH, markGradient(ctx, cx, baseline - capH, cx + capH, baseline));
};

const donut = (
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  thickness: number,
  values: readonly number[],
  colors: readonly string[],
  gap = 0.025,
) => {
  const total = values.reduce((a, b) => a + b, 0);
  let a = -Math.PI / 2;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'butt';
  values.forEach((v, i) => {
    const sweep = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a + gap / 2, a + sweep - gap / 2);
    ctx.strokeStyle = colors[i % colors.length];
    ctx.stroke();
    a += sweep;
  });
};

/** A deterministic wander for the chart lines — the same picture every load. */
const series = (n: number, seed: number, drift: number, vol: number) => {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: number[] = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += drift + (rand() - 0.5) * vol;
    out.push(v);
  }
  return out;
};

const polyline = (
  ctx: Ctx,
  pts: readonly number[],
  x: number,
  y: number,
  w: number,
  h: number,
  lo: number,
  hi: number,
) => {
  ctx.beginPath();
  pts.forEach((v, i) => {
    const px = x + (i / (pts.length - 1)) * w;
    const py = y + h - ((v - lo) / (hi - lo)) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
};

/** Tiny nav glyphs — about seven screen pixels once the plate is on screen. */
const navIcon = (ctx: Ctx, x: number, y: number, s: number, kind: number) => {
  ctx.save();
  ctx.strokeStyle = '#4b525c';
  ctx.lineWidth = s * 0.22;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  switch (kind) {
    case 0: // home
      ctx.moveTo(x - s, y);
      ctx.lineTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.moveTo(x - s * 0.7, y - s * 0.2);
      ctx.lineTo(x - s * 0.7, y + s);
      ctx.lineTo(x + s * 0.7, y + s);
      ctx.lineTo(x + s * 0.7, y - s * 0.2);
      break;
    case 1: // layers
      ctx.moveTo(x - s, y - s * 0.3);
      ctx.lineTo(x, y - s);
      ctx.lineTo(x + s, y - s * 0.3);
      ctx.lineTo(x, y + s * 0.4);
      ctx.closePath();
      ctx.moveTo(x - s, y + s * 0.3);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x + s, y + s * 0.3);
      break;
    case 2: // bars
      ctx.moveTo(x - s * 0.7, y + s);
      ctx.lineTo(x - s * 0.7, y);
      ctx.moveTo(x, y + s);
      ctx.lineTo(x, y - s);
      ctx.moveTo(x + s * 0.7, y + s);
      ctx.lineTo(x + s * 0.7, y - s * 0.4);
      break;
    case 4: // line chart
      ctx.moveTo(x - s, y + s);
      ctx.lineTo(x - s * 0.3, y);
      ctx.lineTo(x + s * 0.2, y + s * 0.4);
      ctx.lineTo(x + s, y - s * 0.7);
      break;
    default:
      ctx.rect(x - s * 0.9, y - s * 0.8, s * 1.8, s * 1.6);
      ctx.moveTo(x - s * 0.9, y - s * 0.2);
      ctx.lineTo(x + s * 0.9, y - s * 0.2);
  }
  ctx.stroke();
  ctx.restore();
};

const NAV = ['Home', 'Creations', 'Analysis', 'Portfolios', 'Markets', 'Data Explorer', 'Portfolio Groups'] as const;

/**
 * The top plate: the app's home screen, 10 × 7 plate units at 204.8 px each.
 * The three rects in `INTERFACE_SLOTS` are drawn empty — their cards float
 * above the plate as separate meshes.
 */
export const INTERFACE_TEX = { width: 2048, height: 1434, unitsX: 10, unitsY: 7 } as const;

/** Card slots in plate texture units (x, y from the top-left corner). */
export const INTERFACE_SLOTS = {
  hero: { x: 2.55, y: 0.98, w: 7.2, h: 1.8 },
  exposure: { x: 2.55, y: 3.0, w: 2.75, h: 1.72 },
  equity: { x: 2.55, y: 4.88, w: 4.1, h: 1.9 },
} as const;

export const drawInterfaceTop = (): HTMLCanvasElement => {
  const { width, height, unitsX } = INTERFACE_TEX;
  const S = width / unitsX;
  const u = (v: number) => v * S;
  const [canvas, ctx] = makeCanvas(width, height);

  ctx.fillStyle = APP_GROUND;
  ctx.fillRect(0, 0, width, height);

  // Sidebar.
  panel(ctx, u(0.22), u(0.22), u(1.95), u(6.56), u(0.12));
  wordmark(ctx, u(0.52), u(0.74), u(0.24));
  ctx.fillStyle = APP_BORDER;
  ctx.fillRect(u(0.3), u(1.0), u(1.79), 3);
  ctx.textBaseline = 'middle';
  NAV.forEach((label, i) => {
    const y = u(1.32 + i * 0.4);
    if (i === 0) {
      roundRect(ctx, u(0.32), y - u(0.17), u(1.75), u(0.34), u(0.07));
      ctx.fillStyle = '#e8eef5';
      ctx.fill();
      ctx.fillStyle = palette.markBlue;
      ctx.fillRect(u(0.32), y - u(0.15), u(0.028), u(0.3));
    }
    navIcon(ctx, u(0.56), y, u(0.075), i);
    ctx.fillStyle = APP_TEXT;
    ctx.font = font(i === 0 ? 650 : 500, u(0.14));
    ctx.fillText(label, u(0.78), y + 2);
  });
  ctx.fillStyle = APP_BORDER;
  ctx.fillRect(u(0.3), u(6.08), u(1.79), 3);
  ctx.beginPath();
  ctx.arc(u(0.58), u(6.42), u(0.13), 0, Math.PI * 2);
  ctx.fillStyle = palette.markBlue;
  ctx.fill();
  ctx.fillStyle = APP_TEXT;
  ctx.font = font(600, u(0.14));
  ctx.fillText('Settings', u(0.82), u(6.43));

  // Top bar: the Fintelligent entry and the three round actions.
  caret(ctx, u(2.52), u(0.64), u(0.15), palette.markBlue);
  ctx.fillStyle = APP_TEXT;
  ctx.font = font(600, u(0.15));
  ctx.fillText('Fintelligent', u(2.75), u(0.57));
  [8.95, 9.35, 9.75].forEach((x, i) => {
    ctx.beginPath();
    ctx.arc(u(x), u(0.52), u(0.15), 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = APP_BORDER;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(u(x), u(0.52), u(0.05), 0, Math.PI * 2);
    ctx.strokeStyle = '#5b626c';
    ctx.lineWidth = 4;
    ctx.stroke();
    if (i === 2) {
      ctx.beginPath();
      ctx.arc(u(x + 0.11), u(0.4), u(0.07), 0, Math.PI * 2);
      ctx.fillStyle = palette.red;
      ctx.fill();
    }
  });

  const { hero, exposure, equity } = INTERFACE_SLOTS;
  slot(ctx, u(hero.x), u(hero.y), u(hero.w), u(hero.h), u(0.12));
  slot(ctx, u(exposure.x), u(exposure.y), u(exposure.w), u(exposure.h), u(0.1));
  slot(ctx, u(equity.x), u(equity.y), u(equity.w), u(equity.h), u(0.1));

  // Two ring cards, as on the app's home.
  const ringCard = (x: number, title: string, value: string, sub: string, values: number[], colors: string[]) => {
    panel(ctx, u(x), u(3.0), u(2.08), u(1.72), u(0.1));
    ctx.fillStyle = '#5b626c';
    ctx.font = font(600, u(0.11), fonts.mono);
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(title, u(x + 0.16), u(3.26));
    const cx = u(x + 0.62);
    const cy = u(3.98);
    donut(ctx, cx, cy, u(0.36), u(0.08), values, colors, 0.03);
    ctx.textAlign = 'center';
    ctx.fillStyle = APP_TEXT;
    ctx.font = font(700, u(0.2));
    ctx.fillText(value, cx, cy + u(sub ? 0.03 : 0.07));
    if (sub) {
      ctx.font = font(600, u(0.065), fonts.mono);
      ctx.fillStyle = APP_MUTED;
      ctx.fillText(sub, cx, cy + u(0.15));
    }
    ctx.textAlign = 'left';
    for (let i = 0; i < 5; i++) {
      const ly = u(3.56 + i * 0.2);
      ctx.beginPath();
      ctx.arc(u(x + 1.14), ly, u(0.035), 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      bar(ctx, u(x + 1.22), ly - u(0.025), u(0.5 - (i % 3) * 0.08), u(0.05), '#d9dde2');
      bar(ctx, u(x + 1.84), ly - u(0.025), u(0.1), u(0.05), '#c7ccd3');
    }
  };
  ringCard(5.45, 'STUDIES', '69', '2 DEPLOYED', [8, 5, 4, 4, 4, 46], [CHART[5], CHART[6], CHART[0], CHART[2], CHART[7], '#7d838b']);
  ringCard(7.67, 'PORTFOLIOS', '157K', '', [15, 13, 11, 11, 10, 97], [CHART[3], CHART[6], CHART[7], CHART[2], CHART[0], '#7d838b']);

  // Most traded assets: ticker, name, and a purple volume bar per row.
  panel(ctx, u(6.8), u(4.88), u(2.95), u(1.9), u(0.1));
  ctx.fillStyle = APP_TEXT;
  ctx.font = font(650, u(0.13));
  ctx.fillText('Most Traded Assets', u(6.97), u(5.15));
  bar(ctx, u(6.97), u(5.24), u(2.0), u(0.045));
  const tickers = ['TPL', 'TSLA', 'GNRC', 'HUM', 'MRNA'] as const;
  tickers.forEach((tk, i) => {
    const y = u(5.52 + i * 0.25);
    ctx.fillStyle = APP_TEXT;
    ctx.font = font(700, u(0.1), fonts.mono);
    ctx.fillText(tk, u(6.97), y);
    bar(ctx, u(7.42), y - u(0.07), u(1.1 - i * 0.1), u(0.05), '#d9dde2');
    bar(ctx, u(6.97), y + u(0.04), u(2.5 - i * 0.12), u(0.045), '#a85c9e');
  });

  return canvas;
};

/**
 * The home screen's hero, 7.2 × 1.8 units: the greeting with the app's
 * gradient "quant", the Fintelligent prompt bar in its mark-gradient border,
 * and the disclaimer line under it. It floats highest, as one card, so the
 * greeting never sits hidden under a lifted prompt bar.
 */
export const drawHeroCard = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(2048, 512);
  const w = canvas.width;
  const h = canvas.height;
  const S = w / INTERFACE_SLOTS.hero.w;
  // Edge to edge: the rounded face samples right up to its rim, and a
  // transparent corner would filter in as a dark fringe.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.textBaseline = 'alphabetic';
  ctx.font = font(700, S * 0.34);
  const parts = ['Hi, ready to ', 'quant', '?'] as const;
  const widths = parts.map((p) => ctx.measureText(p).width);
  let gx = w / 2 - widths.reduce((a, b) => a + b, 0) / 2;
  const gy = S * 0.66;
  parts.forEach((p, i) => {
    if (i === 1) {
      const g = ctx.createLinearGradient(gx, 0, gx + widths[i], 0);
      g.addColorStop(0, '#f26a2e');
      g.addColorStop(0.6, palette.red);
      g.addColorStop(1, '#9d2c6b');
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = APP_TEXT;
    }
    ctx.fillText(p, gx, gy);
    gx += widths[i];
  });

  // The prompt bar.
  const px = S * 0.3;
  const py = S * 0.9;
  const pw = w - px * 2;
  const ph = S * 0.5;
  const mid = py + ph / 2;
  roundRect(ctx, px, py, pw, ph, ph / 2);
  const g = ctx.createLinearGradient(px, 0, px + pw, 0);
  g.addColorStop(0, palette.yellow);
  g.addColorStop(0.5, palette.red);
  g.addColorStop(1, palette.markBlue);
  ctx.strokeStyle = g;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = '#5b626c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const icon = ph * 0.13;
  [0.55, 0.95, 1.35].forEach((k, i) => {
    const x = px + ph * k;
    ctx.beginPath();
    if (i === 0) {
      ctx.moveTo(x - icon, mid);
      ctx.lineTo(x + icon, mid);
      ctx.moveTo(x, mid - icon);
      ctx.lineTo(x, mid + icon);
    } else if (i === 1) {
      ctx.arc(x, mid, icon, 0, Math.PI * 2);
      ctx.moveTo(x, mid - icon * 0.5);
      ctx.lineTo(x, mid);
      ctx.lineTo(x + icon * 0.45, mid + icon * 0.3);
    } else {
      ctx.moveTo(x - icon, mid - icon * 0.6);
      ctx.lineTo(x + icon, mid - icon * 0.6);
      ctx.moveTo(x - icon, mid + icon * 0.6);
      ctx.lineTo(x + icon, mid + icon * 0.6);
    }
    ctx.stroke();
  });
  const fieldX = px + ph * 1.7;
  roundRect(ctx, fieldX, py + ph * 0.18, pw - ph * 2.55, ph * 0.64, ph * 0.32);
  ctx.fillStyle = '#f3f5f7';
  ctx.fill();
  ctx.fillStyle = '#8b919a';
  ctx.font = font(500, ph * 0.3);
  ctx.textBaseline = 'middle';
  ctx.fillText("I'm Fintelligent, how can I help you?", fieldX + ph * 0.28, mid + 2);
  const sx = px + pw - ph * 0.55;
  ctx.beginPath();
  ctx.arc(sx, mid, ph * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = palette.navy;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(sx - ph * 0.14, mid - ph * 0.02);
  ctx.lineTo(sx + ph * 0.15, mid - ph * 0.13);
  ctx.lineTo(sx + ph * 0.05, mid + ph * 0.14);
  ctx.closePath();
  ctx.fill();

  bar(ctx, w / 2 - S * 1.7, S * 1.56, S * 3.4, S * 0.045);
  return canvas;
};

/** The Asset Exposure card, 2.75 × 1.72 units. */
export const drawExposureCard = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(1024, 640);
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  roundRect(ctx, 0, 0, w, h, 34);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = APP_TEXT;
  ctx.font = font(700, 50);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Asset Exposure', 52, 96);
  bar(ctx, 52, 124, 560, 16);
  ['All', 'Live', 'Paper'].forEach((label, i) => {
    const x = 640 + i * 118;
    roundRect(ctx, x, 44, 106, 62, 12);
    ctx.fillStyle = i === 0 ? '#e8eef5' : '#ffffff';
    ctx.fill();
    ctx.strokeStyle = APP_BORDER;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = i === 0 ? palette.markBlue : '#5b626c';
    ctx.font = font(600, 30);
    ctx.textAlign = 'center';
    ctx.fillText(label, x + 53, 85);
    ctx.textAlign = 'left';
  });
  const values = [10.8, 10.1, 9.4, 8.8, 8.7, 8.7, 8.5, 7.3, 27.6];
  donut(ctx, 250, 400, 150, 76, values, [...CHART, '#b1b7bf'], 0.02);
  ctx.textAlign = 'center';
  ctx.fillStyle = APP_TEXT;
  ctx.font = font(700, 70);
  ctx.fillText('25', 250, 410);
  ctx.font = font(600, 24, fonts.mono);
  ctx.fillStyle = APP_MUTED;
  ctx.fillText('ASSETS', 250, 448);
  ctx.textAlign = 'left';
  const rows = ['GD', 'PRU', 'VZ', 'MPC', 'CRM', 'MRNA'] as const;
  rows.forEach((tk, i) => {
    const y = 214 + i * 64;
    ctx.beginPath();
    ctx.arc(482, y - 10, 11, 0, Math.PI * 2);
    ctx.fillStyle = CHART[i];
    ctx.fill();
    ctx.fillStyle = APP_TEXT;
    ctx.font = font(700, 32, fonts.mono);
    ctx.fillText(tk, 510, y);
    bar(ctx, 620, y - 22, 220 - i * 16, 22, '#dde1e6');
    ctx.font = font(600, 30, fonts.mono);
    ctx.textAlign = 'right';
    ctx.fillText(`${values[i].toFixed(1)}%`, 985, y);
    ctx.textAlign = 'left';
  });
  return canvas;
};

/** The Active Portfolio Group Performance card, 4.1 × 1.9 units. */
export const drawEquityCard = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(1024, 475);
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  roundRect(ctx, 0, 0, w, h, 26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = APP_TEXT;
  ctx.font = font(700, 36);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Active Portfolio Group Performance', 40, 66);
  roundRect(ctx, w - 214, 30, 174, 54, 10);
  ctx.fillStyle = '#f3f5f7';
  ctx.fill();
  ctx.fillStyle = '#3b4149';
  ctx.font = font(600, 28);
  ctx.fillText('12 weeks', w - 192, 67);
  const x0 = 96;
  const y0 = 126;
  const cw = w - x0 - 40;
  const ch = h - y0 - 56;
  ctx.font = font(500, 22, fonts.mono);
  ctx.fillStyle = APP_MUTED;
  ctx.textAlign = 'right';
  ['+10%', '+5%', '0%', '−5%'].forEach((label, i) => {
    const y = y0 + (i / 3) * ch;
    ctx.fillText(label, x0 - 14, y + 7);
    ctx.fillStyle = i === 2 ? '#cfd4da' : '#eceff2';
    ctx.fillRect(x0, y, cw, i === 2 ? 3 : 2);
    ctx.fillStyle = APP_MUTED;
  });
  ctx.textAlign = 'left';
  const a = series(64, 7, 0.16, 1.5);
  const b = series(64, 19, 0.05, 1.9);
  const all = [...a, ...b];
  const lo = Math.min(...all) - 0.6;
  const hi = Math.max(...all) + 0.6;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  polyline(ctx, b, x0, y0, cw, ch, lo, hi);
  ctx.strokeStyle = CHART[0];
  ctx.stroke();
  polyline(ctx, a, x0, y0, cw, ch, lo, hi);
  ctx.strokeStyle = CHART[1];
  ctx.stroke();
  bar(ctx, x0, h - 34, cw, 12, '#e3e8f0');
  return canvas;
};

export interface EngineFloorLayout {
  robot: readonly [number, number];
  hub: readonly [number, number];
  conveyor: { x0: number; x1: number; z: number };
  racks: { x0: number; x1: number; z: number };
}

/**
 * The engine plate's floor, 10 × 7 units: a dark grid, a hazard-striped
 * border and the painted zones the machines stand on. `layout` is in plate
 * coordinates (x across, z down), so the markings line up with the meshes.
 */
export const drawEngineFloor = (layout: EngineFloorLayout): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(2048, 1434);
  const S = canvas.width / 10;
  const px = (x: number) => (x + 5) * S;
  const pz = (z: number) => (z + 3.5) * S;

  ctx.fillStyle = '#242424';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i <= 20; i++) {
    ctx.fillStyle = i % 4 === 0 ? '#323232' : '#2b2b2b';
    ctx.fillRect(i * S * 0.5 - 1, 0, i % 4 === 0 ? 3 : 2, canvas.height);
  }
  for (let i = 0; i <= 14; i++) {
    ctx.fillStyle = i % 4 === 0 ? '#323232' : '#2b2b2b';
    ctx.fillRect(0, i * S * 0.5 - 1, canvas.width, i % 4 === 0 ? 3 : 2);
  }

  // Hazard border: diagonal yellow/black stripes clipped to a band.
  const inset = S * 0.16;
  const band = S * 0.12;
  ctx.save();
  ctx.beginPath();
  ctx.rect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
  ctx.rect(inset + band, inset + band, canvas.width - (inset + band) * 2, canvas.height - (inset + band) * 2);
  ctx.clip('evenodd');
  ctx.fillStyle = '#161616';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = palette.yellow;
  ctx.lineWidth = band * 0.5;
  for (let d = -canvas.height; d < canvas.width + canvas.height; d += band * 1.4) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + canvas.height, canvas.height);
    ctx.stroke();
  }
  ctx.restore();

  // Robot cell: dashed ring.
  ctx.setLineDash([S * 0.12, S * 0.08]);
  ctx.strokeStyle = 'rgba(232,185,35,0.75)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(px(layout.robot[0]), pz(layout.robot[1]), S * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hub: corner brackets.
  const hx = px(layout.hub[0]);
  const hz = pz(layout.hub[1]);
  const hs = S * 0.68;
  const arm = S * 0.2;
  ctx.strokeStyle = palette.yellow;
  ctx.lineWidth = 6;
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(hx + sx * hs, hz + sz * (hs - arm));
    ctx.lineTo(hx + sx * hs, hz + sz * hs);
    ctx.lineTo(hx + sx * (hs - arm), hz + sz * hs);
    ctx.stroke();
  }

  // Conveyor lane: chevrons pointing downstream.
  ctx.strokeStyle = '#3d3d3d';
  ctx.lineWidth = 6;
  const cz = pz(layout.conveyor.z);
  for (let x = layout.conveyor.x0 + 0.1; x < layout.conveyor.x1; x += 0.45) {
    ctx.beginPath();
    ctx.moveTo(px(x), cz - S * 0.52);
    ctx.lineTo(px(x + 0.12), cz - S * 0.44);
    ctx.lineTo(px(x), cz - S * 0.36);
    ctx.stroke();
  }

  // Rack bay outline.
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 4;
  ctx.strokeRect(px(layout.racks.x0) - S * 0.12, pz(layout.racks.z) - S * 0.58, px(layout.racks.x1) - px(layout.racks.x0) + S * 0.24, S * 1.16);

  ctx.fillStyle = '#5c5c5c';
  ctx.font = font(600, S * 0.13, fonts.mono);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('COMPUTE', px(layout.racks.x0) - S * 0.08, pz(layout.racks.z) + S * 0.78);
  ctx.fillText('QUEUE', px(layout.conveyor.x0), cz + S * 0.62);
  ctx.fillText('EXEC', hx - hs, hz + hs + S * 0.2);
  ctx.fillStyle = '#4a4a4a';
  ctx.fillText('ENGINE · 02', px(-4.55), pz(-2.95));
  return canvas;
};

/** Bays per server front; the scene puts three LEDs on each. */
export const RACK_BAYS = 7;

/** A server's front: bays, vents and a label strip. LEDs are meshes on top. */
export const drawRackFront = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(256, 448);
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2c2c2c';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  const top = 30;
  const bayH = (h - top - 22) / RACK_BAYS;
  for (let i = 0; i < RACK_BAYS; i++) {
    const y = top + i * bayH;
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(16, y + 3, w - 32, bayH - 6);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(16, y + 3, w - 32, 3);
    ctx.fillStyle = '#2f2f2f';
    for (let vx = 92; vx < w - 30; vx += 11) {
      for (let vy = y + 13; vy < y + bayH - 10; vy += 10) ctx.fillRect(vx, vy, 5, 4);
    }
  }
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(16, 12, 70, 10);
  return canvas;
};


export const drawRackSide = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(224, 448);
  ctx.fillStyle = '#191919';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#222222';
  for (let x = 24; x < canvas.width - 20; x += 22) {
    for (let y = 40; y < canvas.height - 40; y += 64) ctx.fillRect(x, y, 8, 44);
  }
  ctx.strokeStyle = '#262626';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  return canvas;
};

/** Belt surface, repeated along the conveyor and scrolled as it runs. */
export const drawBelt = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(64, 64);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#262626';
  ctx.fillRect(0, 0, 10, 64);
  return canvas;
};

export interface Trace {
  /** Plate coordinates (x, z), die outward. */
  points: ReadonlyArray<readonly [number, number]>;
  color: string;
}

/**
 * The circuit board under the chip. `traces` come from the scene, which also
 * sends current pulses along them, so the picture and the pulses agree.
 */
export const drawBoard = (traces: readonly Trace[], die: { x: number; z: number; size: number }): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(2048, 1434);
  const S = canvas.width / 10;
  const px = (x: number) => (x + 5) * S;
  const pz = (z: number) => (z + 3.5) * S;

  ctx.fillStyle = '#0b0c0c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#121414';
  for (let x = S * 0.125; x < canvas.width; x += S * 0.25) {
    for (let y = S * 0.125; y < canvas.height; y += S * 0.25) ctx.fillRect(x - 2, y - 2, 4, 4);
  }

  // Package footprint.
  const half = (die.size / 2 + 0.34) * S;
  ctx.fillStyle = '#151717';
  ctx.fillRect(px(die.x) - half, pz(die.z) - half, half * 2, half * 2);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const trace of traces) {
    ctx.beginPath();
    trace.points.forEach(([x, z], i) => (i === 0 ? ctx.moveTo(px(x), pz(z)) : ctx.lineTo(px(x), pz(z))));
    ctx.strokeStyle = '#3a3122';
    ctx.lineWidth = S * 0.04;
    ctx.stroke();
    const [ex, ez] = trace.points[trace.points.length - 1];
    ctx.beginPath();
    ctx.arc(px(ex), pz(ez), S * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#4a3f28';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px(ex), pz(ez), S * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = '#0b0c0c';
    ctx.fill();
  }

  // Edge connector along the front edge, and four mounting holes.
  ctx.fillStyle = '#7c6630';
  for (let x = -3.6; x <= 3.6; x += 0.22) ctx.fillRect(px(x), pz(3.12), S * 0.13, S * 0.24);
  for (const [x, z] of [
    [-4.55, -3.05],
    [4.55, -3.05],
    [-4.55, 3.05],
    [4.55, 3.05],
  ] as const) {
    ctx.beginPath();
    ctx.arc(px(x), pz(z), S * 0.13, 0, Math.PI * 2);
    ctx.strokeStyle = '#34302a';
    ctx.lineWidth = S * 0.05;
    ctx.stroke();
  }

  // Silkscreen.
  ctx.fillStyle = '#3b3d3e';
  ctx.font = font(600, S * 0.14, fonts.mono);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('FINTELA · NEURAL CORE', px(-4.55), pz(-2.62));
  ctx.font = font(500, S * 0.1, fonts.mono);
  ctx.fillText('REV 3.1  ·  INTELLIGENCE · 03', px(-4.55), pz(-2.4));
  return canvas;
};

/** Emissive twin of `drawBoard`: only the traces, in their own hue. */
export const drawBoardGlow = (traces: readonly Trace[]): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(1024, 717);
  const S = canvas.width / 10;
  const px = (x: number) => (x + 5) * S;
  const pz = (z: number) => (z + 3.5) * S;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const trace of traces) {
    ctx.beginPath();
    trace.points.forEach(([x, z], i) => (i === 0 ? ctx.moveTo(px(x), pz(z)) : ctx.lineTo(px(x), pz(z))));
    ctx.strokeStyle = trace.color;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = S * 0.018;
    ctx.stroke();
    ctx.globalAlpha = 1;
    const [ex, ez] = trace.points[trace.points.length - 1];
    ctx.beginPath();
    ctx.arc(px(ex), pz(ez), S * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = trace.color;
    ctx.fill();
  }
  return canvas;
};

/** The die's top: a dim die-shot grid and the glowing caret mark. */
export const drawDieTop = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(512, 512);
  const n = 512;
  ctx.fillStyle = '#111213';
  ctx.fillRect(0, 0, n, n);
  let s = 11;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const cells = 8;
  const cell = (n - 60) / cells;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const shade = 17 + Math.floor(rand() * 9);
      ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 3})`;
      ctx.fillRect(30 + i * cell + 2, 30 + j * cell + 2, cell - 4, cell - 4);
    }
  }
  ctx.strokeStyle = '#2a2c2f';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, n - 24, n - 24);
  const cx = n / 2;
  ctx.shadowColor = 'rgba(241,53,60,0.8)';
  ctx.shadowBlur = 30;
  caret(ctx, cx - 88, cx + 72, 176, markGradient(ctx, cx - 88, cx - 100, cx + 88, cx + 72));
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#6a6d70';
  ctx.font = font(600, 26, fonts.mono);
  ctx.textAlign = 'center';
  ctx.fillText('FINTELA  NPU', cx, n - 44);
  return canvas;
};

/** Emissive map for the die: the caret alone, so only the mark glows. */
export const drawDieGlow = (): HTMLCanvasElement => {
  const [canvas, ctx] = makeCanvas(256, 256);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 256, 256);
  const cx = 128;
  caret(ctx, cx - 44, cx + 36, 88, markGradient(ctx, cx - 44, cx - 50, cx + 44, cx + 36));
  return canvas;
};

/**
 * A soft contact shadow: black, alpha falling off from a rounded core.
 * Drawn through `shadowBlur` with the shape itself pushed off-canvas, since
 * `ctx.filter` blur is missing from Safari.
 */
export const drawSoftShadow = (round: boolean): HTMLCanvasElement => {
  const n = 256;
  const [canvas, ctx] = makeCanvas(n, n);
  const off = n * 4;
  ctx.shadowColor = 'rgba(0,0,0,1)';
  ctx.shadowBlur = n * 0.14;
  ctx.shadowOffsetX = off;
  ctx.fillStyle = '#000000';
  const m = n * 0.2;
  if (round) {
    ctx.beginPath();
    ctx.arc(n / 2 - off, n / 2, n / 2 - m, 0, Math.PI * 2);
  } else {
    roundRect(ctx, m - off, m, n - m * 2, n - m * 2, n * 0.08);
  }
  ctx.fill();
  return canvas;
};
