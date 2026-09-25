import type { CSSProperties, ReactNode } from 'react';
import { PLATE, SECTOR_ETFS } from './stations';
import type { StationKey } from './stations';

/**
 * What each plate carries. Two layers per station, both lying in the floor
 * plane: the art printed on the plate (flat), and the pieces that lift off
 * it when its station is active — the ticker tiles rise, the code card
 * floats, the trials swarm, the ranked portfolios fan out, the order ticket
 * pops. Lifted pieces are plain elements translated along Z, so the
 * isometric camera draws them as layers above their plate, the way the
 * platform stack draws the interface cards above its top plate.
 */

const lift = (on: boolean, z: number, delayMs = 0): CSSProperties => ({
  position: 'absolute',
  transform: `translateZ(${on ? z : 1}px)`,
  transition: `transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) ${delayMs}ms`,
  transformStyle: 'preserve-3d',
});

const Tray = ({ children, dark = false }: { children?: ReactNode; dark?: boolean }) => (
  <svg width={PLATE} height={PLATE} viewBox="0 0 150 150" aria-hidden style={{ display: 'block' }}>
    <rect x="18" y="18" width="114" height="114" rx="12" fill={dark ? '#232323' : '#f5f7f9'} />
    {children}
  </svg>
);

/** The flat art printed on each plate. */
export const PlateArt = ({ station }: { station: StationKey }) => {
  switch (station) {
    case 'dataClusters':
      // An empty tray of sockets; the tiles themselves are lifted pieces.
      return (
        <Tray>
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={26 + (i % 4) * 26}
              y={28 + Math.floor(i / 4) * 28}
              width="22"
              height="22"
              rx="5"
              fill="none"
              stroke="#d3d8de"
              strokeWidth="2"
              strokeDasharray={i === 11 ? '4 3' : undefined}
            />
          ))}
          <rect x="26" y="116" width="64" height="6" rx="3" fill="#d9dde2" />
        </Tray>
      );
    case 'strategies':
      return (
        <Tray>
          <rect x="18" y="18" width="16" height="114" rx="6" fill="#e9ecf0" />
          {[30, 45, 60, 75, 90, 105, 118].map((y, i) => (
            <rect key={y} x={i === 0 || i === 6 ? 42 : 52} y={y} width={[58, 70, 62, 44, 64, 34, 50][i]} height="7" rx="3.5" fill="#dfe3e8" />
          ))}
        </Tray>
      );
    case 'studies': {
      // The search surface: a heat map peaking where the trials converge.
      const cells = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const d = Math.hypot(c - 3.4, r - 2.3);
          cells.push(
            <rect key={`${r}-${c}`} x={26 + c * 20} y={26 + r * 20} width="18" height="18" rx="3" fill="#16325C" opacity={Math.max(0.06, 0.95 - d * 0.26)} />,
          );
        }
      }
      return <Tray>{cells}</Tray>;
    }
    case 'portfolios':
      return (
        <Tray>
          <line x1="28" y1="50" x2="122" y2="50" stroke="#e2e5e9" strokeWidth="2" />
          <line x1="28" y1="76" x2="122" y2="76" stroke="#e2e5e9" strokeWidth="2" />
          <line x1="28" y1="102" x2="122" y2="102" stroke="#e2e5e9" strokeWidth="2" />
          <polygon points="28,104 44,96 58,99 72,82 86,86 100,64 114,56 122,40 122,110 28,110" fill="#10b981" opacity="0.14" />
          <polyline points="28,104 44,96 58,99 72,82 86,86 100,64 114,56 122,40" fill="none" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        </Tray>
      );
    case 'connectBroker':
      return (
        <Tray dark>
          <circle cx="75" cy="75" r="11" fill="#10b981" className="alPulse" />
          <circle cx="75" cy="75" r="13" fill="none" stroke="#10b981" strokeWidth="3" className="alRing" />
          <path d="M 50 53 A 32 32 0 0 0 50 97" fill="none" stroke="#fff" opacity="0.55" strokeWidth="5" strokeLinecap="round" />
          <path d="M 100 53 A 32 32 0 0 1 100 97" fill="none" stroke="#fff" opacity="0.55" strokeWidth="5" strokeLinecap="round" />
          <path d="M 37 41 A 50 50 0 0 0 37 109" fill="none" stroke="#fff" opacity="0.28" strokeWidth="5" strokeLinecap="round" />
          <path d="M 113 41 A 50 50 0 0 1 113 109" fill="none" stroke="#fff" opacity="0.28" strokeWidth="5" strokeLinecap="round" />
        </Tray>
      );
  }
};

const card = {
  position: 'absolute',
  borderRadius: 8,
  background: '#ffffff',
  boxShadow: '-4px 8px 14px rgba(0,0,0,0.18)',
} as const;

/**
 * The pieces that lift off the active plate, positioned in the plate's own
 * 150 × 150 frame. Inactive, they lie on the plate (z = 1) as part of its art.
 */
export const Lifted = ({ station, on }: { station: StationKey; on: boolean }) => {
  switch (station) {
    case 'dataClusters':
      return (
        <>
          {SECTOR_ETFS.map((etf, i) => (
            <div
              key={etf.t}
              style={{
                ...lift(on, 22 + (i % 4) * 7 + Math.floor(i / 4) * 5, i * 45),
                left: 26 + (i % 4) * 26,
                top: 28 + Math.floor(i / 4) * 28,
                width: 22,
                height: 22,
                borderRadius: 5,
                background: etf.c,
                boxShadow: on ? '-3px 6px 8px rgba(0,0,0,0.22)' : 'none',
              }}
            />
          ))}
        </>
      );
    case 'strategies':
      return (
        <div style={{ ...lift(on, 40), ...card, left: 32, top: 26, width: 96, height: 98, padding: '10px 10px', boxSizing: 'border-box' }}>
          {[
            ['#265E92', 56, 0],
            ['#0B1A33', 70, 10],
            ['#8B6B01', 60, 10],
            ['#0B1A33', 44, 10],
            ['#166B44', 62, 18],
            ['#265E92', 32, 10],
          ].map(([color, w, indent], i) => (
            <div key={i} style={{ height: 6, width: Number(w) - 12, marginLeft: Number(indent), marginBottom: 8, borderRadius: 3, background: String(color) }} />
          ))}
        </div>
      );
    case 'studies':
      // Trials swarm above the surface and home in on its peak.
      return (
        <div style={{ ...lift(on, 30), left: 0, top: 0, width: PLATE, height: PLATE, opacity: on ? 1 : 0, transition: 'transform 0.55s ease, opacity 0.35s ease' }}>
          <svg width={PLATE} height={PLATE} viewBox="0 0 150 150" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
            {[
              [-52, 30, '#e8b923', 0],
              [20, -44, '#e8b923', -0.4],
              [-60, -40, '#f1353c', -0.9],
              [24, 40, '#f1353c', -1.3],
              [-30, 48, '#1f6fb0', -0.2],
              [-64, 6, '#1f6fb0', -1.7],
              [36, -10, '#e8b923', -0.7],
              [-12, -54, '#1f6fb0', -1.1],
            ].map(([dx, dy, fill, delay], i) => (
              <circle
                key={i}
                cx="104"
                cy="72"
                r="4.5"
                fill={String(fill)}
                className="alHone"
                style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, animationDelay: `${delay}s` }}
              />
            ))}
            <circle cx="104" cy="72" r="12" fill="none" stroke="#e8b923" strokeWidth="2" className="alRing" />
          </svg>
        </div>
      );
    case 'portfolios':
      // The ranked stack fans out; the leader, on top, wears the gold rule.
      return (
        <>
          {[0, 1, 2].map((rank) => (
            <div
              key={rank}
              style={{
                ...lift(on, 14 + (2 - rank) * 22, (2 - rank) * 70),
                ...card,
                left: 30 + rank * 6,
                top: 30 + rank * 6,
                width: 90,
                height: 56,
                padding: 8,
                boxSizing: 'border-box',
                outline: rank === 0 ? '2px solid #e8b923' : 'none',
                opacity: on || rank === 0 ? 1 : 0,
              }}
            >
              <svg width="74" height="28" viewBox="0 0 74 28" aria-hidden style={{ display: 'block' }}>
                <polyline
                  points={['0,24 12,20 24,21 36,14 48,15 60,8 74,3', '0,24 12,22 24,19 36,18 48,14 60,12 74,9', '0,23 12,23 24,18 36,19 48,15 60,15 74,12'][rank]}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div style={{ marginTop: 4, height: 5, width: 40 - rank * 8, borderRadius: 3, background: rank === 0 ? '#1a1a1a' : '#c9ced5' }} />
            </div>
          ))}
        </>
      );
    case 'connectBroker':
      return (
        <div
          style={{
            ...lift(on, 44),
            ...card,
            left: 34,
            top: 36,
            width: 84,
            height: 70,
            padding: '9px 9px',
            boxSizing: 'border-box',
            opacity: on ? 1 : 0,
            transition: 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.3s ease',
          }}
        >
          {['#288357', '#288357', '#B44444'].map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 7 }}>
              <div style={{ width: 16, height: 6, borderRadius: 3, background: c }} />
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#dfe3e8' }} />
            </div>
          ))}
        </div>
      );
  }
};
