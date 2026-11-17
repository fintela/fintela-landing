import type { CSSProperties } from 'react';
import { camera, ease, elevation, size, time } from './tokens';

const C = Math.cos((camera.turnDeg * Math.PI) / 180);
const S = Math.sin((camera.turnDeg * Math.PI) / 180);
const K = Math.cos((camera.tiltDeg * Math.PI) / 180);

/** Half a plate's drawn width and height once turned (about 104 x 60 px). */
const PLATE_HALF_W = ((C + S) * size.plate) / 2;
const PLATE_HALF_H = (K * (C + S) * size.plate) / 2;

/** The floor point the camera draws at a screen offset (dx, dy) from the floor's origin. */
export const floorAt = (dx: number, dy: number) => ({
  x: C * dx - S * (dy / K),
  y: S * dx + C * (dy / K),
});

/** Where a floor point lands on screen, relative to the floor's origin. */
export const screenFrom = (x: number, y: number) => ({
  x: C * x + S * y,
  y: K * (C * y - S * x),
});

export interface IsoLineGeometry {
  /** The line's natural box in px, before scaling. */
  w: number;
  h: number;
  /** Where the floor's origin lands on screen. */
  origin: { x: number; y: number };
  /** Station i's plate centre on screen. */
  screenAt: (i: number) => { x: number; y: number };
  /** Each plate's centre on the floor. */
  plates: ReadonlyArray<{ x: number; y: number }>;
  /** The track's polyline points, and the box its SVG needs. */
  points: string;
  box: { x: number; y: number; w: number; h: number };
}

/** The stations run down the screen in a gentle zigzag, so scrolling walks them in order. */
export const createLine = (count: number): IsoLineGeometry => {
  const origin = { x: size.swing + PLATE_HALF_W, y: size.head };
  const screenAt = (i: number) => ({
    x: origin.x + (i % 2 ? size.swing : -size.swing),
    y: size.head + i * size.drop,
  });
  const plates = Array.from({ length: count }, (_, i) => {
    const at = screenAt(i);
    return floorAt(at.x - origin.x, at.y - origin.y);
  });
  const xs = plates.map((p) => p.x);
  const ys = plates.map((p) => p.y);
  const x = Math.min(...xs) - 20;
  const y = Math.min(...ys) - 20;
  return {
    w: 2 * (size.swing + PLATE_HALF_W),
    h: size.head + (count - 1) * size.drop + PLATE_HALF_H + size.foot,
    origin,
    screenAt,
    plates,
    points: plates.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    box: { x, y, w: Math.max(...xs) + 20 - x, h: Math.max(...ys) + 20 - y },
  };
};

/** A piece of a plate: lying on it while its station waits, risen `z` while active. */
export const liftStyle = (on: boolean, z: number, delayMs = 0): CSSProperties => ({
  position: 'absolute',
  transform: `translateZ(${on ? z : elevation.resting}px)`,
  transition: `transform ${time.lift}s ${ease.spring} ${delayMs}ms`,
  transformStyle: 'preserve-3d',
});
