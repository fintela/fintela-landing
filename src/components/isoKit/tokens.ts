import { palette } from '../../theme/tokens';

/**
 * The isometric line's tokens, extracted from the landing's AssemblyLine. They
 * add to the landing's theme/tokens.ts and never replace it: type, text colours,
 * panels and wells still come from there. STYLE.md explains what each one is for.
 */

/** The fixed camera: the floor turns about Z, then tips about X. No perspective. */
export const camera = { tiltDeg: 55, turnDeg: 35 } as const;
export const CAMERA = `rotateX(${camera.tiltDeg}deg) rotateZ(-${camera.turnDeg}deg)`;

/** Floor units, before the camera. A plate draws about 208 x 120 px on screen. */
export const size = {
  plate: 150,
  plateRadius: 18,
  trayInset: 18,
  traySide: 114,
  trayRadius: 12,
  /** Screen px from one station down to the next. */
  drop: 124,
  /** Screen px the line swings either side of its axis. */
  swing: 52,
  /** Room above the first plate for the pieces that lift off it. */
  head: 130,
  /** Room under the last plate for its shadow. */
  foot: 40,
  labelsWidth: 190,
  labelsGap: 20,
  /** A short window shrinks the line, down to this, rather than cropping it. */
  minScale: 0.4,
} as const;

/** Height above the floor is how the line shows state. */
export const elevation = { waiting: 0, done: 8, active: 30, badge: 2, resting: 1 } as const;

/** The machine wears brand neutrals; only the marks of state carry a hue. */
export const isoColor = {
  plate: '#ffffff',
  plateDark: palette.navy,
  tray: '#f5f7f9',
  trayDark: '#232323',
  socket: '#d3d8de',
  artBlock: '#e9ecf0',
  artLine: '#dfe3e8',
  artRule: '#e2e5e9',
  artFaint: '#d9dde2',
  artMuted: '#c9ced5',
  trackBase: '#cfcfcf',
  /** The work done so far. */
  trackFill: palette.navy,
  /** The work moving: the track's dashes, the active ring, the packet's dot. */
  active: palette.yellow,
  /** A finished station's check, and anything that is live and healthy. */
  done: palette.success,
} as const;

/** Categorical hues for data pieces, the app's own for the eleven sector funds. */
export const dataHues = [
  '#4a8cc9',
  '#d8a72e',
  '#b8323f',
  '#1f9e8f',
  '#6a5fb0',
  '#5d9131',
  '#a85c9e',
  '#9a5a1a',
  '#2F6395',
  '#e8b923',
  '#f1353c',
] as const;

/** The mark's three hues, for many small things in motion. */
export const markHues = [palette.yellow, palette.red, palette.markBlue] as const;

/**
 * Written in floor units, at about 3:5 (-x, +y). Through the camera that ratio
 * lands straight down the screen, so every shadow agrees on one light above.
 */
export const isoShadow = {
  plate: '-3px 5px 0 #dedede, -6px 10px 0 #cfcfcf, -18px 32px 40px rgba(0,0,0,0.20)',
  plateDark: '-3px 5px 0 #3a3a3a, -6px 10px 0 #2a2a2a, -18px 32px 40px rgba(0,0,0,0.26)',
  piece: '-4px 8px 14px rgba(0,0,0,0.18)',
  tile: '-3px 6px 8px rgba(0,0,0,0.22)',
  /** Screen-space, for HTML outside the floor. */
  packet: '0 10px 22px rgba(0,0,0,0.22)',
} as const;

export const ease = {
  /** Things that move and stop: plates, cards. */
  settle: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  /** Things that rise: lifted pieces overshoot a little. */
  spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
  /** Things that appear: the packet overshoots more. */
  pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** A spin losing speed: fast at once, then a long coast to a stop. */
  spin: 'cubic-bezier(0.12, 0.72, 0.16, 1)',
  /**
   * The camera, and anything that rides with it: eases out of rest, then settles long.
   * Settle starts at full speed, which is right for a card but jolts the whole frame.
   */
  glide: 'cubic-bezier(0.45, 0, 0.2, 1)',
} as const;

/** The same curves as `ease`, as the control points Framer Motion takes. */
export const curve = {
  settle: [0.2, 0.8, 0.2, 1],
  spring: [0.34, 1.4, 0.64, 1],
  pop: [0.34, 1.56, 0.64, 1],
  glide: [0.45, 0, 0.2, 1],
} as const;

/** Seconds, except the staggers. */
export const time = {
  plate: 0.45,
  lift: 0.55,
  packet: 0.4,
  cardIn: 0.4,
  cardInDelay: 0.08,
  cardOut: 0.2,
  /** ms between small pieces rising together. */
  staggerTile: 45,
  /** ms between large pieces rising together. */
  staggerCard: 70,
} as const;

/** Scroll per station while pinned, in viewport heights. */
export const STEP_VH = 55;
/** A station's progress finishes this far through its slice, so it rests before the next. */
export const PROGRESS_SPAN = 0.8;
/** Progress moves in this many steps, so scrolling re-renders React sparingly. */
export const PROGRESS_STEPS = 64;

/**
 * Pinning needs the line and both cards on one screen, under the header. Cards
 * run about 530 px tall from 1100 px wide and up to 610 px at 900 px (Portuguese,
 * the longest copy). Narrower or shorter windows get the cards in the page's flow.
 */
export const PIN_QUERY =
  '(min-width: 1100px) and (min-height: 640px), (min-width: 900px) and (min-height: 720px)';
export const PIN = `@media ${PIN_QUERY}`;
/** Wide enough for two cards side by side but too short to pin. */
export const WIDE_FLOW =
  '@media (min-width: 1100px) and (max-height: 639.95px), (min-width: 900px) and (max-width: 1099.95px) and (max-height: 719.95px)';
export const REDUCED = '(prefers-reduced-motion: reduce)';
