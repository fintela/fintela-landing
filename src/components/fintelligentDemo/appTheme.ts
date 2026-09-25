/**
 * The product app's own light theme (app.fintela.io), for the Fintelligent
 * demo — NOT the landing's brand tokens. The landing retired blue; the app
 * still wears its navy primary and its gold → crimson → steel mark gradient,
 * and a demo that claims to show the product has to wear the product's
 * colours. Values mirror, by hand, the app repo's
 * frontend/src/theme/{soft,palette,brand,createFintelaTheme}.ts.
 */
import { fonts } from '../../theme/tokens';

export const APP = {
  ground: '#edf0f5',
  well: '#e1e6ee',
  paper: '#ffffff',
  text: '#0B1A33',
  textSecondary: '#4a5b78',
  textDisabled: '#64738e',
  navy: '#16325C',
  navyLight: '#5575A8',
  error: '#B74444',
  warning: '#8B6B01',
  success: '#288357',
  info: '#265E92',
  steel: '#2F6395',
  hover: 'rgba(22,50,92,0.05)',
  selected: 'rgba(22,50,92,0.10)',
  divider: 'rgba(11,26,51,0.10)',
  /** The mark gradient: the chat's ring, "quant", the working bar. */
  brand: 'linear-gradient(135deg, #EFC03C 0%, #E53540 45%, #2F6395 100%)',
  dots: ['#EFC03C', '#E53540', '#2F6395'] as const,
  shadow: {
    raisedXs: '2px 2px 5px rgba(11,26,51,0.14), -2px -2px 4px rgba(255,255,255,0.95)',
    raisedSm: '4px 4px 10px rgba(11,26,51,0.12), -4px -4px 9px rgba(255,255,255,0.95)',
    float: '0 12px 36px rgba(11,26,51,0.22)',
    well: 'inset 3px 3px 6px rgba(11,26,51,0.14), inset -3px -3px 6px rgba(255,255,255,0.96)',
  },
  /** The app's Monaco light theme. */
  code: { keyword: '#265E92', string: '#166B44', number: '#715702', fn: '#8B6B01', comment: '#4a5b78' },
  /** System UI first, as the app does; Inter (self-hosted here) where there is no SF. */
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Inter Fallback', system-ui, sans-serif",
  mono: fonts.mono,
} as const;

/** A 1.5px ring in the mark gradient, painted on the padding box only. */
export const gradientRingSx = (radius: number | string) =>
  ({
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: radius,
    padding: '1.5px',
    background: APP.brand,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  }) as const;
