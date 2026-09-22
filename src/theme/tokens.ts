/**
 * Fintela design tokens — single source of truth for color, gradient,
 * radius, shadow and motion. Import from here, not from raw hex values.
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
  // Brand: black carries every control, link and accent word. Was navy; the
  // whole blue family (navy included) has been retired in favor of a
  // black/graphite scale.
  navy: '#1a1a1a',
  navyDeep: '#000000',
  navyMid: '#141414',

  // The mark's yellow/red stay; the former "blue" leg of the tri-color
  // accent is now a graphite/black step instead. `gold`/`goldDeep`/`goldSoft`
  // are kept as the names every call site already imports, but `goldDeep`
  // now points at black rather than blue.
  yellow: '#e8b923',
  yellowDeep: '#8a6607',
  yellowSoft: 'rgba(232, 185, 35, 0.14)',
  red: '#f1353c',
  redDeep: '#c62828',
  redSoft: 'rgba(241, 53, 60, 0.12)',
  blue: '#3a3a3a',
  blueDeep: '#1a1a1a',
  blueSoft: 'rgba(26, 26, 26, 0.10)',
  // The mark's actual blue leg (bottom of the "A"), used only for the page
  // background wash below — not the retired `blue`/`blueDeep` graphite
  // aliases every other call site already imports.
  markBlue: '#1f6fb0',

  // 3.95:1 on white — display spans, SVG fills, dots; never small body text.
  // Aliases the mark's red.
  gold: '#f1353c',
  // 17.4:1 on white: eyebrows, small accents, category marks. Aliases black
  // so accessible text-sized accents read as ink, not a hue.
  goldDeep: '#1a1a1a',
  // Chip and tile wash behind accent-marked labels. Aliases the mark's yellow.
  goldSoft: 'rgba(232, 185, 35, 0.14)',

  // Neutral grays (no blue tint), so nothing on the page reads as blue.
  // `textMuted` is 7.8:1 on white; `textSubtle` (5.3:1) is for disabled and
  // placeholder text only.
  ink: '#000000',
  text: '#000000',
  textMuted: '#525252',
  textSubtle: '#6b6b6b',

  surface: '#ffffff',
  surfaceMuted: '#f7f7f7',
  border: '#e5e5e5',
  borderStrong: '#cccccc',

  // Semantic — meaning, not brand. These are their own hex values (not the
  // brand red above) so a status color never drifts if the brand accent
  // changes, and P&L red/green stay unambiguous even though brand red is now
  // in circulation elsewhere on the page.
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
} as const;

// Shared six-way accent cycle for category badges/icons (feature cards, blog
// tags) — navy plus all three mark hues, so a category mark can draw on the
// full brand trio without ever repeating the same color twice in a row.
// These are painted as small chip text, so every step clears 4.5:1 on white.
export const accents = [
  palette.navy,
  palette.redDeep,
  palette.yellowDeep,
  palette.navyMid,
  palette.blueDeep,
  palette.navyDeep,
] as const;

/**
 * Soft-UI (neumorphic) surfaces — the pricing page. Text and controls are the
 * brand palette above; only the ground, wells and highlights are specific to
 * the style. The effect is a paired shadow in the ground's own hue, so the
 * ground is a pale neutral tint rather than #ffffff: on pure white the
 * top-left highlight is invisible and a card collapses into an ordinary drop
 * shadow. Raised surfaces are white, so the page still reads as white.
 *
 * Measured contrast (WCAG): textSecondary ~7:1 on ground/groundSunken, 7.8:1
 * on white; goldDeep (now black) 17.4:1 on white; textSubtle ~5:1; accent
 * (black) ~18:1; white on accent ~18:1; onHighlight on the yellow chip 9.4:1;
 * goldText's lightest (yellow) stop 2.2:1 on white. So on ground and
 * groundSunken the ONLY text colours are text and textSecondary;
 * goldDeep/textSubtle survive only inside a white raised panel; gold is never
 * small text; goldText is display-only (≥32px hero/section accents on the
 * ground, ≥19px-bold numerals on white) and NEVER on ink, where display
 * accents are solid gold.
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

  ground: '#eeeeee',
  groundSunken: '#e2e2e2',
  surfaceRaised: '#ffffff',

  // Controls. White on black is ~18:1; deep black is the pressed state.
  accent: palette.navy,
  accentActive: palette.navyDeep,
  // The featured tier is where the accent lands: its chip, its ring and its
  // column wash. Uses the mark's yellow — black text on the chip is 9.4:1.
  highlight: palette.yellow,
  onHighlight: palette.navyDeep,
  wash: 'rgba(232, 185, 35, 0.09)',
  ring: 'rgba(232, 185, 35, 0.6)',
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
  scrim: 'rgba(0,0,0,0.55)',
  scrollbar: 'rgba(0,0,0,0.18)',
} as const;

/** Semantic washes the docs Callout layers over a well (never text). */
export const calloutTints = {
  info: 'rgba(0,0,0,0.06)',
  warning: 'rgba(245,158,11,0.08)',
  tip: 'rgba(232,185,35,0.10)',
  danger: 'rgba(239,68,68,0.08)',
  success: 'rgba(16,185,129,0.08)',
} as const;

export const gradients = {
  // The brand ramp: black into deep black. One hue, so it reads as depth
  // rather than as a rainbow, and clipped display text never passes through
  // mud.
  brand: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
  // Accent marks: rules, dots, underlines, the featured chip. Runs yellow →
  // red → black, so small filled surfaces read as the Fintela gradient in
  // miniature (the blue leg retired in favor of black). Small filled
  // surfaces only — never a fill that has to carry text.
  gold: 'linear-gradient(135deg, #e8b923 0%, #f1353c 55%, #1a1a1a 100%)',
  // Accent display text: headline accents and large numerals. The lightest
  // (yellow) stop is 2.2:1 on white, so this is for text ≥24px (or ≥19px
  // bold) only — small accent text uses solid `palette.goldDeep`.
  goldText: 'linear-gradient(135deg, #c9970c 0%, #e0323a 50%, #1a1a1a 100%)',
  brandSoft:
    'linear-gradient(135deg, rgba(0,0,0,0.07) 0%, rgba(232,185,35,0.07) 100%)',
  brandFaint:
    'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(232,185,35,0.04) 100%)',
  // The full mark palette, for the scroll-progress bar and the App shell's
  // divider — the most visible single spot for the tri-color gradient.
  brandHorizontal:
    'linear-gradient(90deg, transparent, #e8b923 20%, #f1353c 50%, #1a1a1a 80%, transparent)',
  ink: 'linear-gradient(180deg, #000000 0%, #141414 100%)',
  surfaceFade:
    'linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(232,185,35,0.02) 50%, rgba(255,255,255,0) 100%)',
  // Soft-UI hero band. Ends on `soft.ground` so the seam into the section
  // below it is invisible. Never put it behind neumorphic cards: a paired
  // shadow on a graded ground desynchronizes from its background.
  groundFade: 'linear-gradient(180deg, #f7f7f7 0%, #eeeeee 100%)',
  // The top-of-page brand wash: gold → red → the mark's blue, top to bottom,
  // fading out to fully transparent by the last stop. Painted at a fixed
  // height (not `background-attachment: fixed`), so it scrolls away with the
  // page — vivid over the hero, diffusing to nothing as the visitor scrolls
  // down onto the plain `soft.ground` fill beneath it. Used only as the
  // `body` background-image layer in theme.ts, over a `soft.ground`
  // background-color.
  pageGround:
    'linear-gradient(180deg, ' +
    'rgba(232,185,35,0.80) 0%, ' +
    'rgba(241,53,60,0.75) 30%, ' +
    'rgba(31,111,176,0.70) 60%, ' +
    'rgba(31,111,176,0) 100%)',
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 6,
  lg: 10,
  xl: 14,
  pill: 999,
  // Soft-UI radii, named by role. Soft shadows need a generous arc to read as
  // a pillow rather than a drop shadow, so these sit above the scale above.
  // In `sx` these are px numbers, not spacing units — write `${radii.neuCard}px`.
  neuCard: 24,
  neuCardSm: 20,
  neuInner: 14,
  neuWell: 10,
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(0,0,0, 0.04)',
  sm: '0 1px 3px rgba(0,0,0, 0.05)',
  md: '0 2px 8px rgba(0,0,0, 0.06)',
  lg: '0 4px 16px rgba(0,0,0, 0.07)',
  brand: '0 6px 16px rgba(0,0,0, 0.18)',
  brandStrong: '0 8px 20px rgba(0,0,0, 0.26)',

  // Soft-UI pairs: a near-black shadow bottom-right and a highlight top-left,
  // so the light source stays top-left at every nesting depth. CSS custom
  // properties, not raw strings: their light-mode pairing (a white highlight)
  // only reads as a highlight against `soft.ground`; against a `Section
  // tone="ink"` band that same white would show up as a stray glow, so the
  // ink override (src/index.css) recolours the highlight to a mid-gray lifted
  // off the ink gradient instead. A card with its own opaque background (a
  // white NeuPanel, a raised button, `MuiAlert`) resets these back to their
  // light values for its descendants — `darkSurfaceResetSx` in this file,
  // spread into every such recipe — so a control nested inside one (e.g. the
  // ToggleButtonGroup inside ContactPage's form panel) keeps the light pair
  // regardless of the section it is ultimately sitting in.
  // tier <-> min sibling gap: Xs 8px, Sm 16px (24px if it lifts to Md on hover),
  // Md 24px, Raised/Lg 32px, Xl focus-only.
  neuRaisedXs: 'var(--fi-shadow-raised-xs)',
  neuRaisedSm: 'var(--fi-shadow-raised-sm)',
  neuRaisedMd: 'var(--fi-shadow-raised-md)',
  neuRaised: 'var(--fi-shadow-raised)',
  neuRaisedLg: 'var(--fi-shadow-raised-lg)',
  neuRaisedXl: 'var(--fi-shadow-raised-xl)',
  // Inverted pairs: a permanently sunken well, and a raised control being
  // pressed. Kept apart so the two can diverge later.
  neuInset:
    'inset 6px 6px 12px rgba(0,0,0,0.14), inset -6px -6px 12px rgba(255,255,255,0.95)',
  neuInsetSm:
    'inset 3px 3px 6px rgba(0,0,0,0.14), inset -3px -3px 6px rgba(255,255,255,0.96)',
  neuPressed:
    'inset 5px 5px 10px rgba(0,0,0,0.17), inset -5px -5px 10px rgba(255,255,255,0.95)',
  // The accent surface is the one thing not tinted like the ground, so it
  // drops the pairing: a white highlight on black reads as an artifact.
  neuAccent: '6px 6px 16px rgba(0,0,0,0.30)',
  neuAccentHover: '8px 10px 22px rgba(0,0,0,0.38)',
  neuAccentPressed: 'inset 4px 4px 10px rgba(0,0,0,0.30)',
  // A groove instead of a 1px rule — soft UI has no hard borders.
  neuDivider:
    'inset 0 1px 1px rgba(0,0,0,0.22), inset 0 -1px 0 rgba(255,255,255,0.95)',
  // Blur-free groove for abutting cells and rows (a blurred inset bleeds at
  // the cell's side edges and draws a seam between columns).
  neuGroove: 'inset 0 1px 0 rgba(0,0,0,0.22), inset 0 2px 0 rgba(255,255,255,0.95)',
  // The same groove on the ink surface: dark line, then a faint light line.
  neuGrooveInk: 'inset 0 -1px 0 rgba(255,255,255,0.07), inset 0 -2px 0 rgba(0,0,0,0.45)',
  // Inline code and 16-18px wells: the Sm pair swallows a glyph box.
  neuInsetXs:
    'inset 1px 1px 2px rgba(0,0,0,0.12), inset -1px -1px 2px rgba(255,255,255,0.9)',
  // Chrome that floats over arbitrary content has no ground to pair a white
  // highlight against, so these are unpaired black drops.
  // Sticky bars once content scrolls under them (bottom-only).
  neuBar: '0 6px 16px rgba(0,0,0,0.10)',
  // Menus, dialogs, the FAB.
  neuFloat: '0 12px 36px rgba(0,0,0,0.22)',
  // Drawers: the shadow falls away from the scrim edge.
  neuFloatLeft: '-10px 0 28px rgba(0,0,0,0.22)',
  neuFloatRight: '10px 0 28px rgba(0,0,0,0.22)',
  // Footer step-down: the ground drops one level; only the top edge shows it.
  neuFloor: 'inset 0 12px 20px -12px rgba(0,0,0,0.18)',
  // The ink surface (code) is saturated like the accent button, so it drops
  // the pairing too; lighter than neuAccent because the surface is large.
  neuInk: '8px 8px 22px rgba(0,0,0,0.22)',
  neuPressedInk: 'inset 2px 2px 4px rgba(0,0,0,0.45)',
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
  sectionPaddingY: { xs: 8, md: 14 },
  containerPaddingX: { xs: 3, md: 4 },
} as const;
