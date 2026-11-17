import { ICON_GRADIENT_ID } from '../../theme/neu';

/**
 * The mark's ramp (its text-safe steps, as `gradients.goldText`) as an SVG
 * paint server, mounted once at the app root. `gradientIconSx` (theme/neu.ts) points icon fills at
 * `url(#${ICON_GRADIENT_ID})` — CSS `background-clip: text` only works on
 * text nodes, so a gradient-filled glyph needs the gradient defined in SVG
 * and referenced by every icon's `fill`, wherever it renders in the tree.
 */
export const IconGradientDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
    <defs>
      <linearGradient id={ICON_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8f6d18" />
        <stop offset="55%" stopColor="#c42d3a" />
        <stop offset="100%" stopColor="#1a1c23" />
      </linearGradient>
    </defs>
  </svg>
);
