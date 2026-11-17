import type { ReactNode, RefObject } from 'react';
import { Box } from '@mui/material';
import { focusRingSx, forcedColorsFocus } from '../../theme/neu';
import { fonts, motion, palette, soft } from '../../theme/tokens';
import type { IsoLineGeometry } from './geometry';
import { CAMERA, ease, elevation, isoColor, isoShadow, size, time } from './tokens';

export type PlateState = 'waiting' | 'done' | 'active';

/** The camera. Everything inside is laid out in floor units. */
export const Floor = ({
  x,
  y,
  scale = 1,
  children,
}: {
  x: number;
  y: number;
  scale?: number;
  children: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x * scale,
      top: y * scale,
      width: 0,
      height: 0,
      transformOrigin: '0 0',
      transformStyle: 'preserve-3d',
      transform: `scale(${scale}) ${CAMERA}`,
    }}
  >
    {children}
  </div>
);

/** Three layers: the base, the fill that follows the scroll, the dashes that never stop. */
export const Track = ({
  line,
  fillRef,
}: {
  line: Pick<IsoLineGeometry, 'points' | 'box'>;
  fillRef?: RefObject<SVGPolylineElement | null>;
}) => {
  const { box, points } = line;
  return (
    <svg
      width={box.w}
      height={box.h}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      aria-hidden
      // maxWidth: the landing's index.css caps every svg at its container's width, and the floor is 0 wide.
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        overflow: 'visible',
        maxWidth: 'none',
      }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={isoColor.trackBase}
        strokeWidth="10"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        ref={fillRef}
        points={points}
        pathLength={1}
        fill="none"
        stroke={isoColor.trackFill}
        strokeWidth="10"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="1 1"
        strokeDashoffset={1}
      />
      <polyline
        points={points}
        fill="none"
        stroke={isoColor.active}
        strokeWidth="4"
        strokeLinecap="round"
        className="isoFlow"
      />
    </svg>
  );
};

/** A finished station's mark. */
export const CheckBadge = () => (
  <Box
    sx={{
      position: 'absolute',
      right: 8,
      top: 8,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: isoColor.done,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `translateZ(${elevation.badge}px)`,
    }}
  >
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M2.5 6.2 L5 8.6 L9.6 3.4"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Box>
);

/**
 * One station's plate, centred on floor point (x, y). Height says its state. It is
 * a pointer shortcut only, hidden from assistive tech: the station's label is the
 * accessible control.
 */
export const Plate = ({
  x,
  y,
  state,
  dark = false,
  onPick,
  children,
}: {
  x: number;
  y: number;
  state: PlateState;
  dark?: boolean;
  onPick?: () => void;
  children?: ReactNode;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - size.plate / 2,
      top: y - size.plate / 2,
      width: size.plate,
      height: size.plate,
      transformStyle: 'preserve-3d',
      transform: `translateZ(${elevation[state]}px)`,
      transition: `transform ${time.plate}s ${ease.settle}`,
    }}
  >
    <Box
      component="button"
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onPick}
      sx={{
        all: 'unset',
        position: 'absolute',
        inset: 0,
        cursor: onPick ? 'pointer' : 'default',
        borderRadius: `${size.plateRadius}px`,
        background: dark ? isoColor.plateDark : isoColor.plate,
        boxShadow: dark ? isoShadow.plateDark : isoShadow.plate,
        outline: state === 'active' ? `3px solid ${isoColor.active}` : '0 solid transparent',
        outlineOffset: '6px',
        transformStyle: 'preserve-3d',
        transition: `outline-color ${motion.fast}`,
      }}
    >
      {children}
      {state === 'done' && <CheckBadge />}
    </Box>
  </div>
);

/** A station's name, the accessible way through the line. The index is always two digits. */
export const StepLabel = ({
  index,
  name,
  on,
  ariaLabel,
  onClick,
}: {
  index: number;
  name: string;
  on: boolean;
  ariaLabel: string;
  onClick?: () => void;
}) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    aria-current={on ? 'step' : undefined}
    sx={{
      all: 'unset',
      cursor: 'pointer',
      boxSizing: 'border-box',
      maxWidth: '100%',
      minHeight: 44,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      fontSize: 15,
      fontWeight: on ? 800 : 600,
      color: on ? soft.text : soft.textSecondary,
      transition: `color ${motion.base}`,
      '@media (hover: hover)': { '&:hover': { color: soft.text } },
      ...focusRingSx,
      '@media (forced-colors: active)': { ...forcedColorsFocus },
    }}
  >
    <Box
      component="span"
      sx={{ fontFamily: fonts.mono, fontSize: 12, fontWeight: 500, color: soft.textSecondary }}
    >
      {String(index + 1).padStart(2, '0')}
    </Box>
    {name}
  </Box>
);

/** The one thing travelling the line, named for what the work has become at this step. */
export const Packet = ({ mono = false, children }: { mono?: boolean; children: ReactNode }) => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      left: 0,
      top: '100%',
      height: 28,
      px: 1.25,
      borderRadius: 999,
      background: palette.navy,
      color: '#ffffff',
      fontSize: 12.5,
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      whiteSpace: 'nowrap',
      boxShadow: isoShadow.packet,
      fontFamily: mono ? fonts.mono : undefined,
      transformOrigin: 'left center',
      animation: `isoPop ${time.packet}s ${ease.pop} both`,
    }}
  >
    <Box
      component="span"
      sx={{ width: 7, height: 7, borderRadius: '50%', background: isoColor.active }}
    />
    {children}
  </Box>
);
