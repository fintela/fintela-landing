/**
 * Fintela design tokens — single source of truth for color, gradient,
 * radius, shadow and motion. Import from here, not from raw hex values.
 */

export const palette = {
  // Brand: institutional navy with a restrained gold highlight. Navy carries
  // every control, link and accent word; gold is a highlight surface — chips,
  // rings, rules, washes — and, as `goldDeep`, the only gold allowed on text.
  // The Fintela mark keeps its own gold/crimson/blue; the page repeats only
  // the gold.
  navy: '#16325c',
  navyDeep: '#0b1a33',
  navyMid: '#10264d',
  // 2.4:1 on white — never text, never an icon that has to be read.
  gold: '#c9a227',
  // 4.9:1 on white: eyebrows, small accents, category marks.
  goldDeep: '#a16207',
  // Chip and tile wash behind gold-marked labels.
  goldSoft: 'rgba(201, 162, 39, 0.14)',

  // Navy-tinted neutrals, so grays never drift warm against the brand.
  // `textMuted` is 6.9:1 on white; `textSubtle` (4.8:1) is for disabled and
  // placeholder text only.
  ink: '#0b1a33',
  text: '#0b1a33',
  textMuted: '#4a5b78',
  textSubtle: '#64738e',

  surface: '#ffffff',
  surfaceMuted: '#f7f9fc',
  border: '#e1e6ee',
  borderStrong: '#c7d0de',

  // Semantic — meaning, not brand. Red and green stay reserved for state and
  // P&L, which is why neither appears in the brand set above.
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
} as const;

// Shared six-way accent cycle for category badges/icons (feature cards, blog
// tags). Navy, gold and slate only, so a category mark is never mistaken for
// a status. These are painted as small chip text, so every step clears 4.5:1
// on white.
export const accents = [
  palette.navy,
  palette.goldDeep,
  palette.textMuted,
  palette.navyMid,
  palette.goldDeep,
  palette.navyDeep,
] as const;

/**
 * Soft-UI (neumorphic) surfaces — the pricing page. Text and controls are the
 * brand palette above; only the ground, wells and highlights are specific to
 * the style. The effect is a paired shadow in the ground's own hue, so the
 * ground is a pale navy tint rather than #ffffff: on pure white the top-left
 * highlight is invisible and a card collapses into an ordinary drop shadow.
 * Raised surfaces are white, so the page still reads as white.
 *
 * Measured contrast (WCAG): textSecondary 6.0:1 on ground / 5.5:1 on
 * groundSunken / 6.9:1 on white; goldDeep 4.3 / 3.9 / 4.9; textSubtle 4.2 /
 * 3.8 / 4.8; accent 11.2 / 10.2 / 12.8; white on accent 12.8; onHighlight on
 * gold 7.2; gold on navyDeep 7.2 / navyMid 6.4; goldText's light stop 3.3 on
 * white / 2.85 on ground, its dark stop 2.8 on navyDeep. So on ground and
 * groundSunken the ONLY text colours are text and textSecondary;
 * goldDeep/textSubtle survive only inside a white raised panel; gold is never
 * small text; goldText is display-only (the reference's ≥32px hero/section
 * accents on the ground, ≥19px-bold numerals on white) and NEVER on ink, where
 * display accents are solid gold.
 */
export const soft = {
  white: '#ffffff',
  text: palette.text,
  textSecondary: palette.textMuted,

  ground: '#edf0f5',
  groundSunken: '#e1e6ee',
  surfaceRaised: '#ffffff',

  // Controls. White on navy is 12.8:1; deep navy is the pressed state.
  accent: palette.navy,
  accentActive: palette.navyDeep,
  // The featured tier is where the gold lands: its chip, its ring and its
  // column wash. Navy text on the chip is 7.2:1.
  highlight: palette.gold,
  onHighlight: palette.navyDeep,
  wash: 'rgba(201, 162, 39, 0.09)',
  ring: 'rgba(201, 162, 39, 0.6)',
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
  scrim: 'rgba(11,26,51,0.55)',
  scrollbar: 'rgba(11,26,51,0.18)',
} as const;

/** Semantic washes the docs Callout layers over a well (never text). */
export const calloutTints = {
  info: 'rgba(22,50,92,0.06)',
  warning: 'rgba(245,158,11,0.08)',
  tip: 'rgba(201,162,39,0.10)',
  danger: 'rgba(239,68,68,0.08)',
  success: 'rgba(16,185,129,0.08)',
} as const;

export const gradients = {
  // The brand ramp: navy into deep navy. One hue, so it reads as depth rather
  // than as a rainbow, and clipped display text never passes through mud.
  brand: 'linear-gradient(135deg, #16325c 0%, #0b1a33 100%)',
  // Gold marks: rules, dots, underlines, the featured chip. Small filled
  // surfaces only — never a fill that has to carry text.
  gold: 'linear-gradient(135deg, #c9a227 0%, #a16207 100%)',
  // Gold display text: headline accents and large numerals. The light end is
  // 3.3:1 on white, so this is for text ≥24px (or ≥19px bold) only — small
  // gold text uses solid `palette.goldDeep`.
  goldText: 'linear-gradient(135deg, #b8860b 0%, #a16207 55%, #8a5417 100%)',
  brandSoft:
    'linear-gradient(135deg, rgba(22,50,92,0.07) 0%, rgba(201,162,39,0.07) 100%)',
  brandFaint:
    'linear-gradient(135deg, rgba(22,50,92,0.04) 0%, rgba(201,162,39,0.04) 100%)',
  brandHorizontal:
    'linear-gradient(90deg, transparent, #16325c 25%, #c9a227 75%, transparent)',
  ink: 'linear-gradient(180deg, #0b1a33 0%, #10264d 100%)',
  surfaceFade:
    'linear-gradient(180deg, rgba(22,50,92,0.03) 0%, rgba(201,162,39,0.02) 50%, rgba(255,255,255,0) 100%)',
  // Soft-UI hero band. Ends on `soft.ground` so the seam into the section
  // below it is invisible. Never put it behind neumorphic cards: a paired
  // shadow on a graded ground desynchronizes from its background.
  groundFade: 'linear-gradient(180deg, #f6f8fb 0%, #edf0f5 100%)',
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
  xs: '0 1px 2px rgba(11, 26, 51, 0.04)',
  sm: '0 1px 3px rgba(11, 26, 51, 0.05)',
  md: '0 2px 8px rgba(11, 26, 51, 0.06)',
  lg: '0 4px 16px rgba(11, 26, 51, 0.07)',
  brand: '0 6px 16px rgba(22, 50, 92, 0.18)',
  brandStrong: '0 8px 20px rgba(22, 50, 92, 0.26)',

  // Soft-UI pairs: a deep-navy shadow bottom-right and a white highlight
  // top-left, so the light source stays top-left at every nesting depth. The
  // hue is near-black, so the alphas sit far below what a pale gray would need.
  // tier <-> min sibling gap: Xs 8px, Sm 16px (24px if it lifts to Md on hover),
  // Md 24px, Raised/Lg 32px, Xl focus-only.
  neuRaisedXs:
    '2px 2px 5px rgba(11,26,51,0.14), -2px -2px 4px rgba(255,255,255,0.95)',
  neuRaisedSm:
    '4px 4px 10px rgba(11,26,51,0.12), -4px -4px 9px rgba(255,255,255,0.95)',
  neuRaisedMd:
    '7px 7px 16px rgba(11,26,51,0.14), -7px -7px 14px rgba(255,255,255,0.96)',
  neuRaised:
    '10px 10px 24px rgba(11,26,51,0.12), -10px -10px 22px rgba(255,255,255,0.96)',
  neuRaisedLg:
    '14px 14px 32px rgba(11,26,51,0.16), -12px -12px 26px rgba(255,255,255,0.97)',
  neuRaisedXl:
    '18px 18px 40px rgba(11,26,51,0.18), -14px -14px 34px rgba(255,255,255,0.98)',
  // Inverted pairs: a permanently sunken well, and a raised control being
  // pressed. Kept apart so the two can diverge later.
  neuInset:
    'inset 6px 6px 12px rgba(11,26,51,0.14), inset -6px -6px 12px rgba(255,255,255,0.95)',
  neuInsetSm:
    'inset 3px 3px 6px rgba(11,26,51,0.14), inset -3px -3px 6px rgba(255,255,255,0.96)',
  neuPressed:
    'inset 5px 5px 10px rgba(11,26,51,0.17), inset -5px -5px 10px rgba(255,255,255,0.95)',
  // The accent surface is the one thing not tinted like the ground, so it
  // drops the pairing: a white highlight on navy reads as an artifact.
  neuAccent: '6px 6px 16px rgba(22,50,92,0.30)',
  neuAccentHover: '8px 10px 22px rgba(22,50,92,0.38)',
  neuAccentPressed: 'inset 4px 4px 10px rgba(0,0,0,0.30)',
  // A groove instead of a 1px rule — soft UI has no hard borders.
  neuDivider:
    'inset 0 1px 1px rgba(11,26,51,0.22), inset 0 -1px 0 rgba(255,255,255,0.95)',
  // Blur-free groove for abutting cells and rows (a blurred inset bleeds at
  // the cell's side edges and draws a seam between columns).
  neuGroove: 'inset 0 1px 0 rgba(11,26,51,0.22), inset 0 2px 0 rgba(255,255,255,0.95)',
  // The same groove on the ink surface: dark line, then a faint light line.
  neuGrooveInk: 'inset 0 -1px 0 rgba(255,255,255,0.07), inset 0 -2px 0 rgba(0,0,0,0.45)',
  // Inline code and 16-18px wells: the Sm pair swallows a glyph box.
  neuInsetXs:
    'inset 1px 1px 2px rgba(11,26,51,0.12), inset -1px -1px 2px rgba(255,255,255,0.9)',
  // Chrome that floats over arbitrary content has no ground to pair a white
  // highlight against, so these are unpaired navy drops.
  // Sticky bars once content scrolls under them (bottom-only).
  neuBar: '0 6px 16px rgba(11,26,51,0.10)',
  // Menus, dialogs, the FAB.
  neuFloat: '0 12px 36px rgba(11,26,51,0.22)',
  // Drawers: the shadow falls away from the scrim edge.
  neuFloatLeft: '-10px 0 28px rgba(11,26,51,0.22)',
  neuFloatRight: '10px 0 28px rgba(11,26,51,0.22)',
  // Footer step-down: the ground drops one level; only the top edge shows it.
  neuFloor: 'inset 0 12px 20px -12px rgba(11,26,51,0.18)',
  // The ink surface (code) is saturated like the accent button, so it drops
  // the pairing too; lighter than neuAccent because the surface is large.
  neuInk: '8px 8px 22px rgba(11,26,51,0.22)',
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
