import { fonts, radii, shadows, soft } from '../../theme/tokens';

/**
 * Inline code style — reusable. Plain object so it can be nested into `sx`.
 *
 * Its own module (rather than an export of Prose.tsx) so the Prose file keeps
 * exporting only components, which is what React Fast Refresh needs to hot-swap
 * it without a full reload (react-refresh/only-export-components).
 */
export const inlineCode = {
  fontFamily: fonts.mono,
  fontSize: '0.84em',
  px: 0.6,
  py: 0.2,
  borderRadius: `${radii.xs}px`,
  bgcolor: soft.groundSunken,
  boxShadow: shadows.neuInsetXs,
  color: soft.accent,
  whiteSpace: 'nowrap',
  '@media (forced-colors: active)': { boxShadow: 'none', border: '1px solid CanvasText' },
  '@media print': { boxShadow: 'none', border: `1px solid ${soft.deep}` },
} as const;
