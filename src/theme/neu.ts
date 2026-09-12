/**
 * Soft-UI (neumorphic) recipes — the single source of every shadow-only
 * surface on the site. Lifted from src/pages/PricingPage.tsx; the blocks marked
 * "verbatim" are byte-identical to the reference and must stay that way.
 *
 * Typing convention: recipes meant to be SPREAD (`{ ...raisedPanelSx, p: 3 }`)
 * are plain `as const` objects; recipes meant to be MERGED are typed
 * `SxProps<Theme>` and combined with `sx={[a, b]}` arrays. Never spread an
 * `SxProps<Theme>` value — it may be an array or a function.
 *
 * Object spread does not deep-merge: two spreads carrying the same media-query
 * key ('@media (forced-colors: active)', '@media print', '&:hover') overwrite
 * each other. A consumer that adds its own block must re-declare what the
 * recipe's block carried (see PlanCard in PricingPage.tsx for the pattern).
 *
 * No JSX in this file: react-refresh's only-export-components rule fires on a
 * .tsx module that exports both components and objects.
 */
import type { SxProps, Theme } from '@mui/material';
import { gradients, motion, radii, shadows, soft } from './tokens';

export const APP_URL = 'https://app.fintela.io';

export type NeuTone = 'accent' | 'raised';
export type NeuSize = 'sm' | 'md' | 'lg';
export type WellTier = 'xs' | 'sm' | 'md';

/* -------------------------------------------------------------------------- */
/* Media-query helpers — verbatim from PricingPage.tsx                         */
/* -------------------------------------------------------------------------- */

/**
 * Every structural cue in this style is a box-shadow, and forced-colors mode
 * drops box-shadows at the UA level — without these fallbacks the cards, wells
 * and buttons all flatten into shapeless blocks on one ground.
 */
export const forcedColorsSurface = {
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    border: '1px solid CanvasText',
    background: 'Canvas',
  },
} as const;

/** Merged into each control's own forced-colors block, never spread beside
 *  it — two spreads carrying the same media-query key would overwrite, not merge. */
export const forcedColorsFocus = {
  '&:focus-visible': { outline: '3px solid Highlight', outlineOffset: 3 },
} as const;

/** A 0.01ms transition still performs a translate, it just performs it instantly. */
export const noMotionPress = {
  '@media (prefers-reduced-motion: reduce)': {
    transform: 'none !important',
    '&:hover': { transform: 'none' },
    '&:active': { transform: 'none' },
  },
} as const;

/** Visually hidden but read by assistive tech (the MUI `visuallyHidden` recipe). */
export const srOnly = {
  position: 'absolute',
  // px strings: in sx a bare `width: 1` is 100% and `margin: -1` is -8px, which
  // stretched every hidden span to its containing block and scrolled the page.
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/** The site focus ring. Spread it; do not put it inside a forced-colors block. */
export const focusRingSx = {
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 3 },
} as const;

/** For links and rows inside overflow:auto containers (sidebar, TOC, search
 *  list, drawer list): a 3px offset would spawn a scrollbar. */
export const focusRingTight = {
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 },
} as const;

/* -------------------------------------------------------------------------- */
/* Buttons — PricingPage lines 86-155 plus `size` and `&.Mui-disabled`         */
/* -------------------------------------------------------------------------- */

// py is explicit because the theme's MuiButton root pads 10px top/bottom
// (md keeps that value, so the reference's 48px buttons do not move).
const BUTTON_SIZE = {
  sm: { minHeight: 40, px: 2.25, py: 0.75, fontSize: '0.875rem' },
  md: { minHeight: 48, px: 3, py: 1.25, fontSize: '0.9375rem' },
  lg: { minHeight: 56, px: 4, py: 1.5, fontSize: '1.0625rem' },
} as const;

/**
 * The two soft-UI button surfaces. `accent` is the single saturated element a
 * page in this style is allowed; `raised` is a pillow in the ground's own hue.
 * Geometry is shared so the two can sit side by side on one baseline.
 */
export const neuButtonSx = (tone: NeuTone, size: NeuSize = 'md'): SxProps<Theme> => ({
  minHeight: BUTTON_SIZE[size].minHeight,
  px: BUTTON_SIZE[size].px,
  py: BUTTON_SIZE[size].py,
  borderRadius: `${radii.neuInner}px`,
  fontSize: BUTTON_SIZE[size].fontSize,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  transition: `box-shadow ${motion.fast}, transform ${motion.fast}, background-color ${motion.fast}`,
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 3 },
  ...(tone === 'accent'
    ? {
        backgroundColor: soft.accent,
        color: soft.white,
        boxShadow: shadows.neuAccent,
        '@media (hover: hover)': {
          '&:hover': {
            backgroundColor: soft.accent,
            boxShadow: shadows.neuAccentHover,
            transform: 'translateY(-1px)',
          },
        },
        '&:active': {
          backgroundColor: soft.accentActive,
          boxShadow: shadows.neuAccentPressed,
          transform: 'translateY(0)',
          transition: `box-shadow ${motion.press}`,
        },
        // variant="text" resets the disabled colour to action.disabled — restate the fill.
        '&.Mui-disabled': {
          backgroundColor: soft.accent,
          color: soft.white,
          opacity: 0.55,
          boxShadow: shadows.neuAccent,
        },
        // Highlight only as a stroke, never as a text background: Chrome paints
        // a Canvas-colored backplate behind text in a flex container, so dark
        // HighlightText on a Highlight fill renders as an unreadable block.
        '@media (forced-colors: active)': {
          boxShadow: 'none',
          background: 'ButtonFace',
          color: 'ButtonText',
          border: '3px solid Highlight',
          ...forcedColorsFocus,
        },
      }
    : {
        backgroundColor: soft.surfaceRaised,
        color: soft.text,
        boxShadow: shadows.neuRaisedSm,
        '@media (hover: hover)': {
          '&:hover': {
            backgroundColor: soft.surfaceRaised,
            boxShadow: shadows.neuRaisedMd,
            transform: 'translateY(-1px)',
          },
        },
        '&:active': {
          backgroundColor: soft.groundSunken,
          boxShadow: shadows.neuPressed,
          transform: 'translateY(0)',
          transition: `box-shadow ${motion.press}, background-color ${motion.press}`,
        },
        '&.Mui-disabled': {
          backgroundColor: soft.surfaceRaised,
          color: soft.textSecondary,
          opacity: 0.6,
          boxShadow: shadows.neuRaisedSm,
        },
        '@media (forced-colors: active)': {
          boxShadow: 'none',
          background: 'ButtonFace',
          color: 'ButtonText',
          border: '2px solid ButtonBorder',
          ...forcedColorsFocus,
        },
      }),
  ...noMotionPress,
  '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
});

/** Button rows: full width on phones, natural width from sm (PricingPage closing CTA). */
export const ctaRowSx = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 2,
  '& > *': { flex: { xs: '1 1 100%', sm: '0 1 auto' } },
} as const;

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

/** The raised panel every non-card block sits in — verbatim from PricingPage. */
export const raisedPanelSx = {
  bgcolor: soft.surfaceRaised,
  // Invisible at rest; it is the hook forced-colors and print repaint,
  // so the geometry does not shift when they do.
  border: '1px solid transparent',
  borderRadius: { xs: `${radii.neuCardSm}px`, md: `${radii.neuCard}px` },
  boxShadow: { xs: shadows.neuRaisedMd, md: shadows.neuRaised },
  '@media (forced-colors: active)': { boxShadow: 'none', borderColor: 'CanvasText' },
  '@media print': { boxShadow: 'none', borderColor: soft.deep },
} as const;

/**
 * Featured panel (PricingPage PlanCard `featured`, UseCases highlighted card):
 * same white, a deeper shadow, the gold ring, and zIndex 1 so neighbours'
 * spreads do not paint over it.
 */
export const raisedPanelFeaturedSx = {
  ...raisedPanelSx,
  position: 'relative',
  zIndex: 1,
  borderColor: soft.ring,
  boxShadow: { xs: shadows.neuRaisedMd, md: shadows.neuRaisedLg },
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    borderColor: 'CanvasText',
    borderWidth: 3,
  },
} as const;

/** Small raised tile for tight stacks (rows, prev/next, alerts, logo tiles):
 *  neuRaisedSm at rest so 16-24px gaps are safe. */
export const raisedTileSx = {
  bgcolor: soft.surfaceRaised,
  border: '1px solid transparent',
  borderRadius: `${radii.neuInner}px`,
  boxShadow: shadows.neuRaisedSm,
  '@media (forced-colors: active)': { boxShadow: 'none', borderColor: 'CanvasText' },
  '@media print': { boxShadow: 'none', borderColor: soft.deep },
} as const;

/**
 * Sunken well. 'md' = 48px+ wells and panes, 'sm' = 20-44px wells, badges,
 * inputs, blockquotes; 'xs' = inline code and 16-18px wells.
 */
export const wellSx = (tier: WellTier = 'sm') =>
  ({
    bgcolor: soft.groundSunken,
    boxShadow:
      tier === 'md' ? shadows.neuInset : tier === 'sm' ? shadows.neuInsetSm : shadows.neuInsetXs,
    ...forcedColorsSurface,
    '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
  }) as const;

/**
 * The one dark surface: code. Saturated like the accent button, so it drops
 * the white pairing and casts a single navy shadow. colorScheme dark keeps
 * native scrollbars inside the <pre> dark.
 */
export const inkSurfaceSx = {
  background: gradients.ink,
  color: soft.white,
  border: '1px solid transparent',
  borderRadius: `${radii.neuInner}px`,
  boxShadow: shadows.neuInk,
  colorScheme: 'dark',
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    background: 'Canvas',
    color: 'CanvasText',
    borderColor: 'CanvasText',
    '& span': { color: 'inherit' },
  },
  '@media print': {
    boxShadow: 'none',
    background: 'none',
    color: soft.text,
    borderColor: soft.deep,
    '& span': { color: `${soft.text} !important` },
  },
} as const;

/** Popover paper over a scrim or unknown ground: white, unpaired shadow. */
export const floatPaperSx = {
  bgcolor: soft.surfaceRaised,
  colorScheme: 'light',
  border: '1px solid transparent',
  borderRadius: `${radii.neuInner}px`,
  boxShadow: shadows.neuFloat,
  '@media (forced-colors: active)': { boxShadow: 'none', borderColor: 'CanvasText' },
} as const;

/* -------------------------------------------------------------------------- */
/* Rules                                                                       */
/* -------------------------------------------------------------------------- */

/** Standalone 2px groove in place of a 1px rule (PricingPage PlanCard groove + print). */
export const grooveSx = {
  height: 2,
  borderRadius: '1px',
  boxShadow: shadows.neuDivider,
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    height: 0,
    borderTop: '1px solid CanvasText',
  },
  '@media print': { boxShadow: 'none', height: 0, borderTop: `1px solid ${soft.deep}` },
} as const;

/** Blur-free groove for abutting cells/rows (was PricingPage.ComparisonTable `groove`). */
export const cellGrooveSx = {
  boxShadow: shadows.neuGroove,
  '@media (forced-colors: active)': { boxShadow: 'none', borderTop: '1px solid CanvasText' },
} as const;

/** Bottom edge of a strip on the ink surface (CodeBlock tab strip). */
export const inkGrooveSx = {
  boxShadow: shadows.neuGrooveInk,
  '@media (forced-colors: active)': { boxShadow: 'none', borderBottom: '1px solid CanvasText' },
} as const;

/* -------------------------------------------------------------------------- */
/* Interactive surfaces                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Small raised control that is a link or button (icon buttons, logo tiles,
 * prev/next cards, doc-link rows): Sm -> Md on hover -> pressed.
 * Geometry (size, radius, padding) is the caller's.
 */
export const neuControlSx = {
  bgcolor: soft.surfaceRaised,
  color: soft.text,
  border: '1px solid transparent',
  boxShadow: shadows.neuRaisedSm,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: `box-shadow ${motion.fast}, transform ${motion.fast}, background-color ${motion.fast}`,
  '@media (hover: hover)': {
    '&:hover': {
      backgroundColor: soft.surfaceRaised,
      boxShadow: shadows.neuRaisedMd,
      transform: 'translateY(-1px)',
    },
  },
  '&:active': {
    backgroundColor: soft.groundSunken,
    boxShadow: shadows.neuPressed,
    transform: 'translateY(0)',
    transition: `box-shadow ${motion.press}, background-color ${motion.press}`,
  },
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 3 },
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    background: 'ButtonFace',
    color: 'ButtonText',
    borderColor: 'ButtonBorder',
    borderWidth: 2,
    ...forcedColorsFocus,
  },
  '@media print': { boxShadow: 'none', borderColor: soft.deep },
  ...noMotionPress,
} as const;

/** 40px round icon button (hamburger, close, language, docs menu). Navy glyph. */
export const neuIconButtonSx = {
  ...neuControlSx,
  width: 40,
  height: 40,
  p: 0,
  borderRadius: `${radii.pill}px`,
  color: soft.accent,
  '& svg': { fontSize: 20 },
} as const;

/**
 * Fixed 48px puck (ScrollTop). Floats over arbitrary content, so it takes an
 * unpaired shadow; a utility, not a call to action, so it is white.
 */
export const neuFabSx = {
  ...neuControlSx,
  width: 48,
  height: 48,
  p: 0,
  borderRadius: `${radii.pill}px`,
  color: soft.accent,
  boxShadow: shadows.neuFloat,
  '& svg': { fontSize: 22 },
  '@media (hover: hover)': {
    '&:hover': {
      backgroundColor: soft.surfaceRaised,
      boxShadow: shadows.neuFloat,
      transform: 'translateY(-1px)',
    },
  },
} as const;

/**
 * Large card that IS a link (BlogCard). Rest Md/Raised, hover Lg and -2px,
 * press settles back to Sm, keyboard focus Xl. Geometry is the caller's.
 */
export const neuLinkCardSx = {
  ...raisedPanelSx,
  position: 'relative',
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
  transition: `box-shadow ${motion.base}, transform ${motion.base}`,
  '@media (hover: hover)': {
    '&:hover': { boxShadow: shadows.neuRaisedLg, transform: 'translateY(-2px)', zIndex: 1 },
  },
  '&:active': {
    boxShadow: shadows.neuRaisedSm,
    transform: 'translateY(0)',
    transition: `box-shadow ${motion.press}`,
  },
  '&:focus-visible': {
    outline: `2px solid ${soft.accent}`,
    outlineOffset: 4,
    boxShadow: shadows.neuRaisedXl,
  },
  // Re-declared: the raisedPanelSx spread carries the same key.
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    borderColor: 'CanvasText',
    ...forcedColorsFocus,
  },
  ...noMotionPress,
} as const;

/**
 * Nav row / pill: flat at rest, colour on hover, PRESSED WELL when current.
 * Mark the current item with aria-current="page", MUI's .Mui-selected, or
 * className="is-active". Geometry (padding, font size) is the caller's.
 */
export const navPillSx = {
  borderRadius: `${radii.neuWell}px`,
  color: soft.textSecondary,
  fontWeight: 500,
  textDecoration: 'none',
  transition: `box-shadow ${motion.fast}, background-color ${motion.fast}, color ${motion.fast}`,
  '@media (hover: hover)': {
    '&:hover': { color: soft.text, backgroundColor: 'transparent' },
  },
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 },
  // MUI's MenuItem/ListItemButton paint a gray action.focus fill under the
  // ring; the ring alone marks focus here.
  '&.Mui-focusVisible': { backgroundColor: 'transparent' },
  '&[aria-current="page"], &[aria-current="page"]:hover, &.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible, &.is-active, &.is-active:hover':
    {
      backgroundColor: soft.groundSunken,
      boxShadow: shadows.neuInsetSm,
      color: soft.accent,
      fontWeight: 600,
    },
  '@media (forced-colors: active)': {
    '&[aria-current="page"], &.Mui-selected, &.is-active': {
      boxShadow: 'none',
      border: '2px solid Highlight',
    },
    '&:focus-visible': { outline: '3px solid Highlight', outlineOffset: 2 },
  },
} as const;

/**
 * Sunken field for the three non-MUI inputs (DocsSearch input row, docs search
 * trigger, chat mockup input). MUI TextFields get the same look from the theme.
 */
export const neuFieldSx = {
  bgcolor: soft.groundSunken,
  color: soft.text,
  border: '1px solid transparent',
  borderRadius: `${radii.neuInner}px`,
  boxShadow: shadows.neuInsetSm,
  transition: `box-shadow ${motion.fast}`,
  '@media (hover: hover)': { '&:hover': { boxShadow: shadows.neuInset } },
  '&:focus-within': {
    boxShadow: shadows.neuInset,
    outline: `2px solid ${soft.accent}`,
    outlineOffset: 2,
  },
  '& input::placeholder, & ::placeholder': { color: soft.textSecondary, opacity: 1 },
  '& svg': { color: soft.textSecondary },
  '@media (forced-colors: active)': {
    boxShadow: 'none',
    borderColor: 'CanvasText',
    '&:focus-within': { outline: '3px solid Highlight' },
  },
  '@media print': { boxShadow: 'none', borderColor: soft.deep },
} as const;

/* -------------------------------------------------------------------------- */
/* Text                                                                        */
/* -------------------------------------------------------------------------- */

/** Clipped gradient text with the forced-colors/print fallback (PricingPage SoftHeading). */
export const clippedGradientSx = (gradient: string) =>
  ({
    background: gradient,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    // Clipped gradients vanish under forced-colors; fall back to ink.
    '@media (forced-colors: active)': { WebkitTextFillColor: 'CanvasText', background: 'none' },
    '@media print': { WebkitTextFillColor: soft.text, background: 'none' },
  }) as const;

/** Eyebrow / tagline (PricingPage PlanCard tagline). */
export const eyebrowSx = {
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  color: soft.textSecondary,
} as const;

/** Prose link: a real underline instead of a border-bottom, accent hover, focus ring. */
export const proseLinkSx = {
  color: soft.accent,
  textDecoration: 'underline',
  textDecorationColor: soft.ring,
  textDecorationThickness: '1px',
  textUnderlineOffset: '3px',
  borderRadius: `${radii.xs}px`,
  transition: `color ${motion.fast}, text-decoration-color ${motion.fast}`,
  '@media (hover: hover)': { '&:hover': { textDecorationColor: soft.accent } },
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 },
} as const;

/** Quiet nav link (back links, breadcrumbs, footer links, edit-this-page). */
export const quietLinkSx = {
  color: soft.textSecondary,
  textDecoration: 'none',
  borderRadius: `${radii.xs}px`,
  transition: `color ${motion.fast}`,
  '@media (hover: hover)': { '&:hover': { color: soft.accent } },
  '&:focus-visible': { outline: `2px solid ${soft.accent}`, outlineOffset: 2 },
} as const;

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Card-grid geometry. 32px at md is load-bearing: neuRaised spreads ~34px and
 * at a tighter gutter adjacent cards' shadows collide into a gray seam.
 * minmax(0, 1fr), not 1fr: a bare 1fr is minmax(auto, 1fr), so one long token
 * in an es/pt string would widen its column silently.
 */
export const neuGrid = {
  gap: { xs: 3, md: 4 },
  columns: (n: number) => `repeat(${n}, minmax(0, 1fr))`,
} as const;

/* -------------------------------------------------------------------------- */
/* Imagery and video                                                           */
/* -------------------------------------------------------------------------- */

/**
 * A photograph or video set INTO the surface. The well's own inset shadow
 * paints beneath child content, so an <img> would hide it; the deboss is
 * repainted on a ::after overlay above the image. `duotone` adds a 6% navy
 * multiply wash and desaturates a touch so photography sits inside the
 * navy/gold world. Geometry (aspect-ratio) is the caller's.
 *
 * `flush`: for a well that bleeds to its parent panel's own top edge (a cover
 * or plate with nothing above it) instead of sitting inset by the panel's
 * padding — no deboss, and the top corners take the panel's own radius
 * (`neuCardSm`/`neuCard`, the radius every default/featured NeuPanel uses)
 * instead of the well's tighter one, so the curve is continuous into the
 * panel's edge. The caller still owns the bleed itself (a negative margin
 * matching whatever padding its specific panel uses) — that amount isn't
 * knowable here.
 */
export const mediaWellSx = (
  tier: 'md' | 'sm' = 'md',
  tone: 'plain' | 'duotone' = 'duotone',
  flush = false,
) =>
  ({
    position: 'relative',
    // Sunken, so there is no outer shadow to clip: this only rounds the image.
    overflow: 'hidden',
    bgcolor: soft.groundSunken,
    borderRadius: flush ? 0 : `${tier === 'md' ? radii.neuInner : radii.neuWell}px`,
    ...(flush && {
      borderTopLeftRadius: { xs: `${radii.neuCardSm}px`, md: `${radii.neuCard}px` },
      borderTopRightRadius: { xs: `${radii.neuCardSm}px`, md: `${radii.neuCard}px` },
    }),
    boxShadow: flush ? 'none' : tier === 'md' ? shadows.neuInset : shadows.neuInsetSm,
    '& > img, & > picture, & > picture > img, & > video': {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      ...(tone === 'duotone' ? { filter: 'saturate(0.8)' } : {}),
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      boxShadow: flush ? 'none' : tier === 'md' ? shadows.neuInset : shadows.neuInsetSm,
      ...(tone === 'duotone'
        ? { background: 'rgba(22,50,92,0.06)', mixBlendMode: 'multiply' }
        : {}),
    },
    '@media (forced-colors: active)': {
      boxShadow: 'none',
      border: '1px solid CanvasText',
      background: 'Canvas',
      '& > img, & > picture > img, & > video': { filter: 'none' },
      '&::after': { boxShadow: 'none', background: 'none' },
    },
    '@media print': {
      boxShadow: 'none',
      border: `1px solid ${soft.deep}`,
      '&::after': { boxShadow: 'none', background: 'none' },
    },
  }) as const;

/**
 * The play control that floats over a viewport. A raised puck like neuFabSx
 * (unpaired shadow: it sits on a photograph, not on the ground), sized for a
 * media plate rather than a corner utility.
 */
export const playPuckSx = (size: 64 | 44 = 64) =>
  ({
    ...neuControlSx,
    width: size,
    height: size,
    p: 0,
    borderRadius: `${radii.pill}px`,
    color: soft.accent,
    boxShadow: shadows.neuFloat,
    '& svg': { fontSize: Math.round(size * 0.5) },
    '@media (hover: hover)': {
      '&:hover': {
        backgroundColor: soft.surfaceRaised,
        boxShadow: shadows.neuFloat,
        transform: 'translateY(-1px)',
      },
    },
  }) as const;

/** The progress track under a player: a hairline well with an accent fill. */
export const trackWellSx = {
  height: 8,
  borderRadius: '6px',
  bgcolor: soft.groundSunken,
  boxShadow: shadows.neuInsetXs,
  ...forcedColorsSurface,
  '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
} as const;

/* -------------------------------------------------------------------------- */
/* Asymmetric layout                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Runs a plate off the right edge of the viewport from lg. The Container is
 * 1200px wide with 24px padding, so at ≥1200px the content's right edge sits
 * `50vw - 576px` from the viewport's; the plate is cut there (radius 0 on the
 * cut side) and the BAND must carry `overflowX: 'clip'` — clip, never hidden,
 * so the plate's other three shadow edges survive.
 */
export const bleedRightSx = {
  mr: { lg: 'calc(576px - 50vw)' },
  borderTopRightRadius: { lg: 0 },
  borderBottomRightRadius: { lg: 0 },
} as const;

/** Band-level companion of bleedRightSx. */
export const bandClipSx = { overflowX: 'clip' } as const;
