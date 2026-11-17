/**
 * Fintela design tokens — single source of truth for color, gradient,
 * radius, shadow and motion. Import from here, not from raw hex values.
 *
 * The look is minimalist and content-first: a cool near-white canvas, a cool
 * near-black ink, one type family in two weights and flat surfaces with
 * hairline edges. Colour comes from the mark and nowhere else: its red is the
 * one solid accent, and its red-to-blue ramp (`gradients`, below) is used in
 * small doses — rules, accent words, one halo. Nothing on the page is warm:
 * no cream ground, no orange, no terracotta.
 */

/**
 * Font stacks. The web fonts are self-hosted (src/index.css declares them from
 * the @fontsource-variable packages); right behind each sits a metric-matched
 * local fallback (`Inter Fallback`, `JetBrains Mono Fallback`, also declared
 * there) so the text laid out before the woff2 arrives has the same advance
 * widths and line boxes, and the swap moves nothing. Every `fontFamily` in
 * `sx` should reach for `fonts.sans` / `fonts.mono` rather than spelling the
 * family out: a hand-written `'JetBrains Mono', monospace` skips the fallback.
 */
export const fonts = {
  sans: "'Inter', 'Inter Fallback', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'JetBrains Mono Fallback', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export const palette = {
  // Ink: a cool near-black that carries every control, heading and body line.
  // The names are the ones every call site already imports (`navy` dates from
  // the first palette); none of them is blue any more.
  navy: '#12141a',
  navyDeep: '#000000',
  navyMid: '#1a1c23',

  // The mark's hues. The red is the site's one solid accent. Yellow is only
  // ever a small solid (it never blends into the red: that blend is orange,
  // and the mark keeps the two apart with a hard edge). Blue and the plum the
  // mark passes through on its way from red to blue appear only inside
  // `gradients` and the category cycle.
  yellow: '#e8b923',
  yellowDeep: '#8a6607',
  yellowSoft: 'rgba(232, 185, 35, 0.14)',
  red: '#f1353c',
  redDeep: '#c62828',
  redSoft: 'rgba(241, 53, 60, 0.10)',
  blue: '#373a42',
  blueDeep: '#12141a',
  blueSoft: 'rgba(18, 20, 26, 0.08)',
  markBlue: '#1f6fb0',
  // Where the mark's lower stroke turns from red to blue.
  markPlum: '#8a4a86',
  // Text-safe steps of the same ramp: 4.9:1, 7.1:1 and 6.2:1 on the canvas.
  markRedDeep: '#d02a38',
  markPlumDeep: '#7a3b80',
  markBlueDeep: '#1a5f9c',

  // The accent, for marks only: rules, dots, large display. 3.75:1 on the
  // canvas, so never body-size text — that is `redDeep` (5.3:1).
  gold: '#f1353c',
  // Text-size accents read as ink, not a hue. Aliases the ink.
  goldDeep: '#12141a',
  // Chip and tile wash behind accent-marked labels: the ramp's midpoint.
  goldSoft: 'rgba(138, 74, 134, 0.09)',

  // Cool neutrals. `textMuted` is about 7.5:1 on the canvas; `textSubtle`
  // (about 5:1) is for disabled and placeholder text only.
  ink: '#12141a',
  text: '#12141a',
  textMuted: '#4d515b',
  textSubtle: '#676b76',

  surface: '#ffffff',
  surfaceMuted: '#f2f3f6',
  border: '#e3e5ea',
  borderStrong: '#c9ccd3',

  // Semantic — meaning, not brand. These are their own hex values (not the
  // brand red above) so a status color never drifts if the brand accent
  // changes, and P&L red/green stay unambiguous even though brand red is
  // in circulation elsewhere on the page.
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
} as const;

// The accent cycle for category badges/icons (feature cards, blog tags): ink
// and the three text-safe steps of the mark's ramp. Every step clears 4.5:1
// on white and on the canvas, since these are painted as small chip text.
export const accents = [
  palette.navy,
  palette.redDeep,
  palette.markBlueDeep,
  palette.navy,
  palette.markPlumDeep,
  palette.markBlueDeep,
] as const;

/**
 * Page surfaces. The canvas is a cool near-white, raised surfaces are white
 * with a hairline edge, and wells are one step darker than the canvas. There
 * are no paired shadows: depth is a hairline or, for things that float, one
 * soft drop.
 *
 * Contrast (WCAG, computed): text about 17:1 on the canvas; textSecondary
 * about 7.5:1 on the canvas and 7.9:1 on white; textSubtle about 5:1; white on
 * the accent control about 18:1; the red accent 3.7:1 (marks and display
 * only); redDeep 5.3:1 (accent-coloured text and links).
 */
export const soft = {
  white: '#ffffff',
  // CSS custom properties, not raw hex: a `Section tone="ink"` band (see
  // Section.tsx) overrides these three on itself to the onInk values below,
  // so every consumer that imports `text`/`textSecondary`/`textSubtle` from
  // here — not a hardcoded hex — repaints automatically inside it. Their
  // light-mode values live in src/index.css (`:root`); their dark-mode
  // values are declared again just below, next to `onInk`, so the two never
  // drift apart. An "own background" surface (a white NeuPanel, a raised
  // button — anything opaque, not painted straight on the section's ground)
  // resets the same three properties back to their light values on itself;
  // see `lightTextResetSx` in theme/neu.ts, spread into every such recipe.
  text: 'var(--fi-text)',
  textSecondary: 'var(--fi-text-secondary)',
  textSubtle: 'var(--fi-text-subtle)',
  // A fourth CSS custom property, same mechanism: an accent-coloured LINK
  // painted straight on a section's ground (`quietLinkSx`'s hover, and the
  // handful of "docs link" call sites that set this as their rest colour
  // outright). `soft.accent` itself stays a plain hex — it is what an
  // opaque well or icon paints itself with, never text sitting bare on ink —
  // this is the one accent role that needs to react to `tone="ink"` too.
  linkAccent: 'var(--fi-link-accent)',

  ground: '#f7f8fa',
  groundSunken: '#eef0f3',
  surfaceRaised: '#ffffff',

  // Controls. White on black is ~18:1; deep black is the pressed state.
  accent: palette.navy,
  accentActive: palette.navyDeep,
  // The featured tier: an ink chip with white text, a ring and a faint wash
  // down its column, both in the ramp's midpoint.
  highlight: palette.navy,
  onHighlight: '#ffffff',
  wash: 'rgba(138, 74, 134, 0.045)',
  ring: 'rgba(138, 74, 134, 0.6)',
  // Shadow hue and print borders.
  deep: palette.navyDeep,
  // Text on the ink surface (code blocks, dormant ink panels). Never on light
  // grounds. onInk (~9:1) is the secondary TEXT colour there; onInkMuted
  // (~4.4:1) is for line numbers, icons at rest and dots only, never a label.
  onInk: 'rgba(255,255,255,0.72)',
  onInkMuted: 'rgba(255,255,255,0.45)',
  // Hover fill for a control that sits on ink.
  onInkWash: 'rgba(255,255,255,0.08)',
  // The modal scrim (DocsSearch) and the docs sidebar's hover scrollbar thumb.
  scrim: 'rgba(18,20,26,0.55)',
  scrollbar: 'rgba(18,20,26,0.18)',
} as const;

/**
 * The dark product preview: the frame the home page's schematic visuals
 * (code, trial curves, verdicts) are drawn in. Light marketing canvas, dark
 * previews. These are diagrams of what the product does, not screenshots of
 * it, so they have their own small palette rather than the app's.
 *
 * Contrast on `ground` (computed): text about 15:1, textMuted about 7:1,
 * good about 9:1, bad about 6:1, warn about 10:1.
 */
export const preview = {
  ground: '#101216',
  surface: '#181b21',
  line: 'rgba(255,255,255,0.1)',
  text: '#eceef2',
  textMuted: 'rgba(236,238,242,0.64)',
  faint: 'rgba(236,238,242,0.2)',
  /** Held up on data the search never saw. */
  good: '#3ecf8e',
  /** Overfit risk. The brand red, lifted for a dark ground. */
  bad: '#ff5a61',
  // The mark's yellow, not an amber: nothing here leans orange.
  warn: '#e8b923',
} as const;

/** Semantic washes the docs Callout layers over a well (never text). */
export const calloutTints = {
  info: 'rgba(18,20,26,0.05)',
  warning: 'rgba(245,158,11,0.08)',
  tip: 'rgba(31,111,176,0.07)',
  danger: 'rgba(239,68,68,0.08)',
  success: 'rgba(16,185,129,0.08)',
} as const;

/**
 * The Fintela gradient, as the mark draws it: a solid yellow, then red running
 * through plum into blue. Two rules keep it quiet.
 *
 * 1. Yellow never blends into red. The midpoint of that blend is orange, which
 *    is not a Fintela colour; the mark separates the two with a hard edge and
 *    so does every gradient here.
 * 2. It is used small: a 3px rule, a few accent words, a ring on hover, one
 *    blurred halo. Never a band, a button or a card fill.
 *
 * The names are the ones every call site already imports (`gold*` dates from
 * the first palette).
 */
const RAMP = `${palette.red} 0%, ${palette.markPlum} 54%, ${palette.markBlue} 100%`;
const flat = (color: string) => `linear-gradient(0deg, ${color}, ${color})`;

export const gradients = {
  // Ink: depth, not colour.
  brand: 'linear-gradient(135deg, #12141a 0%, #000000 100%)',
  // The ramp alone, on the diagonal: rings, halos, anything larger than a rule.
  mark: `linear-gradient(135deg, ${RAMP})`,
  // The mark in miniature, for rules and progress bars: a short solid yellow
  // segment, a hard edge, then the ramp.
  gold: 'var(--fi-accent-gradient)',
  // Accent display text (headline accents, large numerals). A CSS custom
  // property, like `soft.text`: on the canvas and on white it is the ramp's
  // text-safe steps (`goldTextLight`, every part of a clipped word clears
  // 4.5:1); inside a `Section tone="ink"` band it is the same ramp lifted
  // (`goldTextInk`, every part clears 6:1 on ink). `src/index.css` declares
  // both, and `lightTextResetSx` (theme/neu.ts) pins the light one back inside
  // an opaque light surface. No yellow in either: it is 1.8:1 on the canvas.
  goldText: 'var(--fi-accent-gradient)',
  goldTextLight: 'linear-gradient(95deg, #8f6d18 0%, #c42d3a 55%, #1a1c23 100%)',
  goldTextInk: 'linear-gradient(95deg, #d9b45a 0%, #ff6b72 55%, #c9ccd6 100%)',
  // Faint tints of the ramp, for a featured column or row.
  brandSoft: 'linear-gradient(135deg, rgba(241,53,60,0.07) 0%, rgba(31,111,176,0.07) 100%)',
  brandFaint: 'linear-gradient(135deg, rgba(241,53,60,0.04) 0%, rgba(31,111,176,0.05) 100%)',
  // The scroll-progress bar and the route-loading bar.
  brandHorizontal: 'var(--fi-accent-gradient)',
  // Dark bands and product previews.
  ink: flat('#101216'),
  surfaceFade: 'linear-gradient(180deg, rgba(18,20,26,0.03) 0%, rgba(18,20,26,0) 100%)',
  // The first band of a page: the canvas, flat.
  groundFade: flat('#f7f8fa'),
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 6,
  lg: 10,
  xl: 14,
  pill: 999,
  // Surface radii, named by role (the `neu` prefix dates from the soft-UI
  // style and is what every call site imports).
  // In `sx` these are px numbers, not spacing units — write `${radii.neuCard}px`.
  neuCard: 16,
  neuCardSm: 14,
  neuInner: 10,
  neuWell: 8,
} as const;

/** The hairline every raised surface is drawn with, on light and on ink. */
const HAIRLINE = '0 0 0 1px rgba(18,20,26,0.11)';
const HAIRLINE_INK = '0 0 0 1px rgba(255,255,255,0.14)';

/**
 * The raised tiers on a light ground, as literal values. `src/index.css`
 * declares the same strings on `:root` (keep the two in sync), and
 * `lightShadowResetSx` (theme/neu.ts) re-declares them inside opaque surfaces
 * that sit in an ink band.
 */
export const lightRaised = {
  xs: HAIRLINE,
  sm: HAIRLINE,
  md: HAIRLINE,
  base: HAIRLINE,
  lg: '0 0 0 1px rgba(18,20,26,0.2), 0 6px 20px rgba(18,20,26,0.07)',
  xl: '0 0 0 1px rgba(18,20,26,0.24), 0 10px 28px rgba(18,20,26,0.1)',
} as const;

/** The same tiers on an ink band (`[data-tone='ink']` in src/index.css). */
export const inkRaised = {
  xs: HAIRLINE_INK,
  sm: HAIRLINE_INK,
  md: HAIRLINE_INK,
  base: HAIRLINE_INK,
  lg: '0 0 0 1px rgba(255,255,255,0.26)',
  xl: '0 0 0 1px rgba(255,255,255,0.32)',
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(18,20,26, 0.04)',
  sm: '0 1px 3px rgba(18,20,26, 0.05)',
  md: '0 2px 8px rgba(18,20,26, 0.06)',
  lg: '0 4px 16px rgba(18,20,26, 0.07)',
  brand: '0 6px 16px rgba(18,20,26, 0.16)',
  brandStrong: '0 8px 20px rgba(18,20,26, 0.22)',

  // Raised surfaces: a hairline at rest, a darker hairline and one soft drop
  // from `Lg` up (featured cards, hover). CSS custom properties, not raw
  // strings, so a `Section tone="ink"` band can swap the dark hairline for a
  // light one (src/index.css); an opaque surface inside such a band resets
  // them for its descendants (`lightShadowResetSx`, theme/neu.ts).
  neuRaisedXs: 'var(--fi-shadow-raised-xs)',
  neuRaisedSm: 'var(--fi-shadow-raised-sm)',
  neuRaisedMd: 'var(--fi-shadow-raised-md)',
  neuRaised: 'var(--fi-shadow-raised)',
  neuRaisedLg: 'var(--fi-shadow-raised-lg)',
  neuRaisedXl: 'var(--fi-shadow-raised-xl)',
  // Wells and pressed controls: an inner hairline on the sunken fill.
  neuInset: 'inset 0 0 0 1px rgba(18,20,26,0.07)',
  neuInsetSm: 'inset 0 0 0 1px rgba(18,20,26,0.07)',
  neuPressed: 'inset 0 0 0 1px rgba(18,20,26,0.16)',
  // The filled control casts nothing at rest and one soft drop on hover.
  neuAccent: 'none',
  neuAccentHover: '0 4px 14px rgba(18,20,26,0.2)',
  neuAccentPressed: 'none',
  // Rules between rows and cells: one hairline.
  neuDivider: 'inset 0 1px 0 rgba(18,20,26,0.1)',
  neuGroove: 'inset 0 1px 0 rgba(18,20,26,0.1)',
  neuGrooveInk: 'inset 0 -1px 0 rgba(255,255,255,0.1)',
  neuInsetXs: 'inset 0 0 0 1px rgba(18,20,26,0.06)',
  // Chrome that floats over arbitrary content.
  // Sticky bars once content scrolls under them (bottom-only).
  neuBar: '0 1px 0 rgba(18,20,26,0.09)',
  // Menus, dialogs, the FAB.
  neuFloat: '0 0 0 1px rgba(18,20,26,0.08), 0 12px 32px rgba(18,20,26,0.14)',
  // Drawers: the shadow falls away from the scrim edge.
  neuFloatLeft: '-8px 0 24px rgba(18,20,26,0.14)',
  neuFloatRight: '8px 0 24px rgba(18,20,26,0.14)',
  // Footer step-down: one hairline along the top edge.
  neuFloor: 'inset 0 1px 0 rgba(18,20,26,0.1)',
  // The ink surface (code).
  neuInk: 'none',
  neuPressedInk: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
} as const;

export const motion = {
  fast: '0.18s cubic-bezier(0.22, 1, 0.36, 1)',
  base: '0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  slow: '0.45s cubic-bezier(0.22, 1, 0.36, 1)',
  // Contact should feel immediate — ease-in, not the shared ease-out.
  press: '0.12s cubic-bezier(0.4, 0, 1, 1)',
} as const;

export const layout = {
  maxWidth: 1200,
  sectionPaddingY: { xs: 4.5, md: 7.5 },
  containerPaddingX: { xs: 3, md: 4 },
} as const;
