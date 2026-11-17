import type { CSSProperties, ReactNode } from 'react';
import { palette } from '../../theme/tokens';
import { APP } from '../../components/fintelligentDemo/appTheme';
import { liftStyle } from './geometry';
import { dataHues, ease, isoColor, isoShadow, markHues, size, time } from './tokens';

/**
 * What plates carry, in two layers lying in the floor plane: flat art printed on
 * the plate (`*Tray`), and pieces that lift off it while its station is active
 * (`Lifted*`). All positions are in the plate's own 150 x 150 frame. To draw a new
 * station, combine `Tray` with your own SVG and `Lift` or `PieceCard`.
 */

/** The inset surface every plate's art sits in. */
export const Tray = ({ dark = false, children }: { dark?: boolean; children?: ReactNode }) => (
  <svg
    width={size.plate}
    height={size.plate}
    viewBox="0 0 150 150"
    aria-hidden
    style={{ display: 'block' }}
  >
    <rect
      x={size.trayInset}
      y={size.trayInset}
      width={size.traySide}
      height={size.traySide}
      rx={size.trayRadius}
      fill={dark ? isoColor.trayDark : isoColor.tray}
    />
    {children}
  </svg>
);

/** Any piece that rises off the plate. Position it with `style`. */
export const Lift = ({
  on,
  z,
  delay = 0,
  style,
  children,
}: {
  on: boolean;
  z: number;
  delay?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) => <div style={{ ...liftStyle(on, z, delay), ...style }}>{children}</div>;

/** A white card that rises off the plate. */
export const PieceCard = ({
  on,
  z,
  delay = 0,
  style,
  children,
}: {
  on: boolean;
  z: number;
  delay?: number;
  style?: CSSProperties;
  children?: ReactNode;
}) => (
  <Lift
    on={on}
    z={z}
    delay={delay}
    style={{
      borderRadius: 8,
      background: '#ffffff',
      boxShadow: isoShadow.piece,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </Lift>
);

/* A collection: an empty grid of sockets, and the tiles that rise out of it. */

const tileX = (i: number) => 26 + (i % 4) * 26;
const tileY = (i: number) => 28 + Math.floor(i / 4) * 28;

export const SocketTray = () => (
  <Tray>
    {Array.from({ length: 12 }, (_, i) => (
      <rect
        key={i}
        x={tileX(i)}
        y={tileY(i)}
        width="22"
        height="22"
        rx="5"
        fill="none"
        stroke={isoColor.socket}
        strokeWidth="2"
        strokeDasharray={i === 11 ? '4 3' : undefined}
      />
    ))}
    <rect x="26" y="116" width="64" height="6" rx="3" fill={isoColor.artFaint} />
  </Tray>
);

export const LiftedTiles = ({ on, hues = dataHues }: { on: boolean; hues?: readonly string[] }) => (
  <>
    {hues.slice(0, 11).map((hue, i) => (
      <Lift
        key={i}
        on={on}
        z={22 + (i % 4) * 7 + Math.floor(i / 4) * 5}
        delay={i * time.staggerTile}
        style={{
          left: tileX(i),
          top: tileY(i),
          width: 22,
          height: 22,
          borderRadius: 5,
          background: hue,
          boxShadow: on ? isoShadow.tile : 'none',
        }}
      />
    ))}
  </>
);

/* Logic: lines of text on the plate, and a code card floating above them. */

export const CodeTray = () => (
  <Tray>
    <rect x="18" y="18" width="16" height="114" rx="6" fill={isoColor.artBlock} />
    {[30, 45, 60, 75, 90, 105, 118].map((y, i) => (
      <rect
        key={y}
        x={i === 0 || i === 6 ? 42 : 52}
        y={y}
        width={[58, 70, 62, 44, 64, 34, 50][i]}
        height="7"
        rx="3.5"
        fill={isoColor.artLine}
      />
    ))}
  </Tray>
);

const CODE_LINES = [
  [APP.code.keyword, 56, 0],
  [APP.text, 70, 10],
  [APP.code.fn, 60, 10],
  [APP.text, 44, 10],
  [APP.code.string, 62, 18],
  [APP.code.keyword, 32, 10],
] as const;

export const LiftedCode = ({ on }: { on: boolean }) => (
  <PieceCard
    on={on}
    z={40}
    style={{ left: 32, top: 26, width: 96, height: 98, padding: '10px 10px' }}
  >
    {CODE_LINES.map(([color, width, indent], i) => (
      <div
        key={i}
        style={{
          height: 6,
          width: width - 12,
          marginLeft: indent,
          marginBottom: 8,
          borderRadius: 3,
          background: color,
        }}
      />
    ))}
  </PieceCard>
);

/* A search: a heat map peaking where the trials converge, and the trials homing in. */

export const HeatmapTray = () => {
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const d = Math.hypot(c - 3.4, r - 2.3);
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={26 + c * 20}
          y={26 + r * 20}
          width="18"
          height="18"
          rx="3"
          fill={APP.navy}
          opacity={Math.max(0.06, 0.95 - d * 0.26)}
        />
      );
    }
  }
  return <Tray>{cells}</Tray>;
};

const SWARM = [
  [-52, 30, 0, 0],
  [20, -44, 0, -0.4],
  [-60, -40, 1, -0.9],
  [24, 40, 1, -1.3],
  [-30, 48, 2, -0.2],
  [-64, 6, 2, -1.7],
  [36, -10, 0, -0.7],
  [-12, -54, 2, -1.1],
] as const;

export const LiftedSwarm = ({ on }: { on: boolean }) => (
  <Lift
    on={on}
    z={30}
    style={{
      left: 0,
      top: 0,
      width: size.plate,
      height: size.plate,
      opacity: on ? 1 : 0,
      transition: `transform ${time.lift}s ease, opacity 0.35s ease`,
    }}
  >
    <svg
      width={size.plate}
      height={size.plate}
      viewBox="0 0 150 150"
      aria-hidden
      style={{ display: 'block', overflow: 'visible' }}
    >
      {SWARM.map(([dx, dy, hue, delay], i) => (
        <circle
          key={i}
          cx="104"
          cy="72"
          r="4.5"
          fill={markHues[hue]}
          className="isoHone"
          style={{
            ['--dx' as string]: `${dx}px`,
            ['--dy' as string]: `${dy}px`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
      <circle
        cx="104"
        cy="72"
        r="12"
        fill="none"
        stroke={isoColor.active}
        strokeWidth="2"
        className="isoRing"
      />
    </svg>
  </Lift>
);

/* A result: an equity curve on the plate, and the ranked stack fanning out above it. */

const CURVE = '28,104 44,96 58,99 72,82 86,86 100,64 114,56 122,40';

export const CurveTray = () => (
  <Tray>
    {[50, 76, 102].map((y) => (
      <line key={y} x1="28" y1={y} x2="122" y2={y} stroke={isoColor.artRule} strokeWidth="2" />
    ))}
    <polygon points={`${CURVE} 122,110 28,110`} fill={isoColor.done} opacity="0.14" />
    <polyline
      points={CURVE}
      fill="none"
      stroke={isoColor.done}
      strokeWidth="4"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </Tray>
);

const RANKED_CURVES = [
  '0,24 12,20 24,21 36,14 48,15 60,8 74,3',
  '0,24 12,22 24,19 36,18 48,14 60,12 74,9',
  '0,23 12,23 24,18 36,19 48,15 60,15 74,12',
];

/** The leader, on top, wears the active ring. */
export const LiftedRanked = ({ on }: { on: boolean }) => (
  <>
    {[0, 1, 2].map((rank) => (
      <PieceCard
        key={rank}
        on={on}
        z={14 + (2 - rank) * 22}
        delay={(2 - rank) * time.staggerCard}
        style={{
          left: 30 + rank * 6,
          top: 30 + rank * 6,
          width: 90,
          height: 56,
          padding: 8,
          outline: rank === 0 ? `2px solid ${isoColor.active}` : 'none',
          opacity: on || rank === 0 ? 1 : 0,
        }}
      >
        <svg width="74" height="28" viewBox="0 0 74 28" aria-hidden style={{ display: 'block' }}>
          <polyline
            points={RANKED_CURVES[rank]}
            fill="none"
            stroke={isoColor.done}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            marginTop: 4,
            height: 5,
            width: 40 - rank * 8,
            borderRadius: 3,
            background: rank === 0 ? palette.navy : isoColor.artMuted,
          }}
        />
      </PieceCard>
    ))}
  </>
);

/* Live: a beacon on the dark plate, and an order ticket popping out of it. */

export const BeaconTray = () => (
  <Tray dark>
    <circle cx="75" cy="75" r="11" fill={isoColor.done} className="isoPulse" />
    <circle
      cx="75"
      cy="75"
      r="13"
      fill="none"
      stroke={isoColor.done}
      strokeWidth="3"
      className="isoRing"
    />
    {[
      ['M 50 53 A 32 32 0 0 0 50 97', 0.55],
      ['M 100 53 A 32 32 0 0 1 100 97', 0.55],
      ['M 37 41 A 50 50 0 0 0 37 109', 0.28],
      ['M 113 41 A 50 50 0 0 1 113 109', 0.28],
    ].map(([d, opacity]) => (
      <path
        key={d}
        d={String(d)}
        fill="none"
        stroke="#fff"
        opacity={Number(opacity)}
        strokeWidth="5"
        strokeLinecap="round"
      />
    ))}
  </Tray>
);

export const LiftedTicket = ({ on }: { on: boolean }) => (
  <PieceCard
    on={on}
    z={44}
    style={{
      left: 34,
      top: 36,
      width: 84,
      height: 70,
      padding: '9px 9px',
      opacity: on ? 1 : 0,
      transition: `transform ${time.lift}s ${ease.spring}, opacity 0.3s ease`,
    }}
  >
    {[APP.success, APP.success, APP.error].map((color, i) => (
      <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 7 }}>
        <div style={{ width: 16, height: 6, borderRadius: 3, background: color }} />
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: isoColor.artLine }} />
      </div>
    ))}
  </PieceCard>
);
