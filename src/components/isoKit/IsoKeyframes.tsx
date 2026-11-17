import { memo } from 'react';
import { GlobalStyles } from '@mui/material';

/**
 * The ambient loops, the only motion not driven by scroll. Each says something is
 * alive: `isoFlow` work moving, `isoHone` a search converging, `isoPulse` and
 * `isoRing` a live signal. The landing's index.css runs them once under reduced
 * motion, which leaves everything at rest.
 */
export const IsoKeyframes = memo(() => (
  <GlobalStyles
    styles={{
      '@keyframes isoFlow': { to: { strokeDashoffset: -28 } },
      '@keyframes isoHone': {
        from: { transform: 'translate(var(--dx), var(--dy))', opacity: 0.35 },
        to: { transform: 'translate(0, 0)', opacity: 1 },
      },
      '@keyframes isoPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      '@keyframes isoPop': {
        from: { transform: 'scale(0.6)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
      },
      '@keyframes isoRing': {
        from: { transform: 'scale(0.6)', opacity: 0.8 },
        to: { transform: 'scale(1.9)', opacity: 0 },
      },
      '.isoFlow': { strokeDasharray: '2 12', animation: 'isoFlow 1.1s linear infinite' },
      '.isoHone': { animation: 'isoHone 2.2s cubic-bezier(.2,.8,.2,1) infinite alternate' },
      '.isoPulse': { animation: 'isoPulse 1.4s ease-in-out infinite' },
      '.isoRing': {
        transformBox: 'fill-box',
        transformOrigin: 'center',
        animation: 'isoRing 1.8s ease-out infinite',
      },
    }}
  />
));
IsoKeyframes.displayName = 'IsoKeyframes';
