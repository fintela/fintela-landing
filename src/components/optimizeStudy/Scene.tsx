import { memo } from 'react';
import type { ComponentProps, CSSProperties } from 'react';
import { domAnimation, LazyMotion, m } from 'motion/react';
import type { TargetAndTransition, Transition } from 'motion/react';
import { APP } from '../../components/fintelligentDemo/appTheme';
import { fonts, palette, radii, shadows } from '../../theme/tokens';
import { flatTransition, stageCentre, u } from '../isoKit/flat';
import { curve, isoColor, markHues, size } from '../isoKit/tokens';
import { BEAT, BEATS } from './beats';

type Point = { x: number; y: number };

/**
 * Design units. The heat map is the assembly line's Studies plate seen head-on: a white
 * plate, a tray inset in it, and a five by five grid of cells in the app's navy.
 */
const CELL = { side: 34, gap: 4, radius: 5, count: 5 };
const PITCH = CELL.side + CELL.gap;
const GRID_SIDE = CELL.count * CELL.side + (CELL.count - 1) * CELL.gap;
const TRAY = { pad: 7, radius: size.trayRadius };
const TRAY_SIDE = GRID_SIDE + 2 * TRAY.pad;
const PLATE = { inset: 10, radius: size.plateRadius };
const PLATE_SIDE = TRAY_SIDE + 2 * PLATE.inset;
/** The black frame that closes around the plate once the zone is found. */
const FRAME = { thickness: 10 };
const FRAME_SIDE = PLATE_SIDE + 2 * FRAME.thickness;
const FRAME_RADIUS = PLATE.radius + FRAME.thickness;

/** The finished study: the framed grid as a badge on the left of a card, the name on the right. */
const FINAL = { width: 320, height: 128 };
const BADGE = { side: 72, inset: 20 };
const BADGE_SCALE = BADGE.side / FRAME_SIDE;
const BADGE_SHIFT = BADGE.inset + BADGE.side / 2 - FINAL.width / 2;
const CONTENT_LEFT = BADGE.inset + BADGE.side + 16;

/** The middle of a cell, in grid units. Takes fractions, for points between cells. */
const cellCentre = (index: number) => index * PITCH + CELL.side / 2;

/** The surface peaks between cells, where it does on the line's plate. */
const PEAK_CELL = { column: 3.4, row: 2.3 };
const PEAK: Point = { x: cellCentre(PEAK_CELL.column), y: cellCentre(PEAK_CELL.row) };
/** The ring that marks the optimal zone, and the best trial at its middle. */
const ZONE = { radius: 26, ring: 3, best: 12 };

/** The line's own falloff, so the two maps match cell for cell. */
const HEAT = Array.from({ length: CELL.count ** 2 }, (_, i) => {
  const column = i % CELL.count;
  const row = Math.floor(i / CELL.count);
  const distance = Math.hypot(column - PEAK_CELL.column, row - PEAK_CELL.row);
  return Math.max(0.06, 0.95 - distance * 0.26);
});

const TRIAL = { side: 11, border: 2 };
const HOPS = 3;

/**
 * Grid units. Each trial starts somewhere on the map and makes three hops toward its end
 * near the peak, bowing off the straight line by the two bends so the search wanders. A
 * pruned trial makes fewer hops, then fades where it landed while the others move on.
 *
 * start x, start y, hue, end x and y from the peak, first bend, second bend, hops made.
 */
const SEEDS = [
  [16, 18, 0, -10, -7, 16, -10, 1],
  [94, 12, 1, 8, -11, -18, 10, 3],
  [172, 16, 2, 12, 4, 20, -8, 3],
  [12, 96, 2, -12, 5, -16, 26, 2],
  [60, 56, 0, -10, -7, 18, -12, 3],
  [124, 40, 1, 2, -2, -14, 8, 3],
  [176, 160, 0, 7, 10, 16, -10, 3],
  [22, 170, 1, -4, 11, -12, 0, 1],
  [92, 174, 2, -4, 11, -20, 12, 3],
  [150, 176, 0, 7, 10, 14, -10, 2],
  [52, 128, 1, -12, 5, 18, -14, 2],
  [108, 112, 2, -3, -13, -16, 10, 3],
] as const;

/** Trials keep a cell's width clear of the tray's edge. */
const clamp = (n: number) => Math.min(GRID_SIDE - 8, Math.max(8, n));

/** The point `t` of the way from `a` to `b`, pushed `bend` units off the line between them. */
const along = (a: Point, b: Point, t: number, bend: number): Point => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: clamp(a.x + dx * t - (dy / length) * bend),
    y: clamp(a.y + dy * t + (dx / length) * bend),
  };
};

const TRIALS = SEEDS.map(([x, y, hue, endX, endY, bend1, bend2, hops]) => {
  const start: Point = { x, y };
  const end: Point = { x: PEAK.x + endX, y: PEAK.y + endY };
  return {
    start,
    hue,
    hops,
    stops: [start, along(start, end, 0.4, bend1), along(start, end, 0.75, bend2), end],
  };
});

const SEARCH_TIME = BEATS[BEAT.search - 1];
/**
 * Seconds into the search. Every trial hops at the same three moments, each a little
 * later than the one before it, so they search together without moving in lockstep.
 */
const HOP = { starts: [0.04, 0.64, 1.24], time: 0.42, lag: 0.05, maxLag: 0.16 };

/** One trial's whole search as keyframes: hop, hold, hop, hold, hop, or fade where pruned. */
const searchFrames = ({ start, stops, hops }: (typeof TRIALS)[number], index: number) => {
  const lag = (index * HOP.lag) % HOP.maxLag;
  const frames = { x: [0], y: [0], opacity: [1], scale: [1], times: [0] };
  const push = (point: Point, shown: boolean, seconds: number) => {
    frames.x.push(+(point.x - start.x).toFixed(2));
    frames.y.push(+(point.y - start.y).toFixed(2));
    frames.opacity.push(shown ? 1 : 0);
    frames.scale.push(shown ? 1 : 0.4);
    frames.times.push(+(seconds / SEARCH_TIME).toFixed(4));
  };
  let at = start;
  let shown = true;
  HOP.starts.forEach((begin, hop) => {
    push(at, shown, begin + lag);
    if (hop < hops) at = stops[hop + 1];
    else shown = false;
    push(at, shown, begin + lag + HOP.time);
  });
  push(at, shown, SEARCH_TIME);
  return frames;
};

const FRAMES = TRIALS.map(searchFrames);

const square = (side: number): CSSProperties => ({
  position: 'absolute',
  left: u(-side / 2),
  top: u(-side / 2),
  width: u(side),
  height: u(side),
});

/** A trial on the map. Survivors close in on the peak and merge into the best trial. */
const Trial = ({ index, phase }: { index: number; phase: number }) => {
  const { start, hue, hops } = TRIALS[index];
  const frames = FRAMES[index];
  const survivor = hops === HOPS;
  const delay = index * 0.03;

  let animate: TargetAndTransition;
  let transition: Transition = { duration: 0 };
  if (phase >= BEAT.found) {
    const end = survivor
      ? { x: PEAK.x - start.x, y: PEAK.y - start.y }
      : { x: frames.x[frames.x.length - 1], y: frames.y[frames.y.length - 1] };
    animate = { x: u(end.x), y: u(end.y), opacity: 0, scale: 0.4 };
    if (survivor) {
      const close = index * 0.015;
      transition = {
        ...flatTransition.settle,
        duration: 0.4,
        delay: close,
        opacity: { duration: 0.18, delay: close + 0.2 },
      };
    }
  } else if (phase === BEAT.search) {
    animate = {
      x: frames.x.map(u),
      y: frames.y.map(u),
      opacity: frames.opacity,
      scale: frames.scale,
    };
    transition = { duration: SEARCH_TIME, times: frames.times, ease: curve.settle };
  } else if (phase === BEAT.scatter) {
    animate = { x: u(0), y: u(0), opacity: 1, scale: 1 };
    transition = { ...flatTransition.pop, delay, opacity: { ...flatTransition.fade, delay } };
  } else {
    animate = { x: u(0), y: u(0), opacity: 0, scale: 0.4 };
  }

  return (
    <m.div
      initial={false}
      animate={animate}
      transition={transition}
      style={{
        position: 'absolute',
        left: u(start.x - TRIAL.side / 2),
        top: u(start.y - TRIAL.side / 2),
        width: u(TRIAL.side),
        height: u(TRIAL.side),
        boxSizing: 'border-box',
        borderRadius: '50%',
        background: markHues[hue],
        // White edge, so every hue reads on the darkest cells too.
        border: `${u(TRIAL.border)} solid ${palette.surface}`,
      }}
    />
  );
};

const Art = memo(({ phase, label, detail }: { phase: number; label: string; detail: string }) => {
  const found = phase >= BEAT.found;
  const framed = phase >= BEAT.frame;
  const morphed = phase >= BEAT.morph;
  const marked = (delay: number) => ({
    ...flatTransition.pop,
    delay: found ? delay : 0,
    opacity: { ...flatTransition.fade, delay: found ? delay : 0 },
  });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* The study's card opens out from behind the framed grid. */}
      <m.div
        initial={false}
        animate={{
          opacity: morphed ? 1 : 0,
          width: u(morphed ? FINAL.width : PLATE_SIDE),
          height: u(morphed ? FINAL.height : PLATE_SIDE),
        }}
        transition={{ ...flatTransition.settle, duration: 0.65, opacity: { duration: 0 } }}
        style={{
          position: 'absolute',
          left: u(stageCentre.x),
          top: u(stageCentre.y),
          x: '-50%',
          y: '-50%',
          borderRadius: u(radii.neuInner),
          background: palette.surface,
          boxShadow: shadows.neuRaisedMd,
        }}
      >
        <m.div
          initial={false}
          animate={{ opacity: morphed ? 1 : 0, x: u(morphed ? 0 : -10) }}
          transition={{ ...flatTransition.settle, delay: morphed ? 0.3 : 0 }}
          style={{
            position: 'absolute',
            left: u(CONTENT_LEFT),
            top: 0,
            width: u(FINAL.width - CONTENT_LEFT - 14),
            height: u(FINAL.height),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: u(7),
            fontFamily: fonts.sans,
          }}
        >
          <div
            style={{
              fontSize: u(23),
              fontWeight: 700,
              lineHeight: 1.15,
              color: palette.text,
              textWrap: 'balance',
            }}
          >
            {label}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: u(6),
              fontSize: u(14),
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: palette.textMuted,
            }}
          >
            <span
              style={{
                width: u(7),
                height: u(7),
                borderRadius: '50%',
                background: isoColor.done,
                flexShrink: 0,
              }}
            />
            {detail}
          </div>
        </m.div>
      </m.div>

      {/* Everything that becomes the badge, scaled as one about the stage's middle. */}
      <m.div
        initial={false}
        animate={{ x: u(morphed ? BADGE_SHIFT : 0), scale: morphed ? BADGE_SCALE : 1 }}
        transition={{ ...flatTransition.settle, duration: 0.65 }}
        style={{
          position: 'absolute',
          left: u(stageCentre.x),
          top: u(stageCentre.y),
          width: 0,
          height: 0,
        }}
      >
        {/* The plate's raised shadow. The frame takes over from it. */}
        <m.div
          initial={false}
          animate={{ opacity: framed ? 0 : 1 }}
          transition={{ ...flatTransition.settle, duration: 0.3 }}
          style={{
            ...square(PLATE_SIDE),
            borderRadius: u(PLATE.radius),
            background: palette.surface,
            boxShadow: shadows.neuRaisedMd,
          }}
        />

        {/* Starts hidden exactly behind the plate, then grows out around it. */}
        <m.div
          initial={false}
          animate={{ opacity: framed ? 1 : 0, scale: framed ? 1 : PLATE_SIDE / FRAME_SIDE }}
          transition={{ ...flatTransition.settle, opacity: { duration: 0 } }}
          style={{
            ...square(FRAME_SIDE),
            borderRadius: u(FRAME_RADIUS),
            background: palette.navy,
            boxShadow: shadows.neuAccent,
          }}
        />

        <div
          style={{
            ...square(PLATE_SIDE),
            borderRadius: u(PLATE.radius),
            background: palette.surface,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: u(PLATE.inset),
              top: u(PLATE.inset),
              width: u(TRAY_SIDE),
              height: u(TRAY_SIDE),
              borderRadius: u(TRAY.radius),
              background: isoColor.tray,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: u(TRAY.pad),
                top: u(TRAY.pad),
                width: u(GRID_SIDE),
                height: u(GRID_SIDE),
              }}
            >
              {HEAT.map((opacity, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: u((i % CELL.count) * PITCH),
                    top: u(Math.floor(i / CELL.count) * PITCH),
                    width: u(CELL.side),
                    height: u(CELL.side),
                    borderRadius: u(CELL.radius),
                    background: APP.navy,
                    opacity,
                  }}
                />
              ))}

              {/* The optimal zone, ringed in green once the search has found it. */}
              <m.div
                initial={false}
                animate={{ opacity: found ? 1 : 0, scale: found ? 1 : 0.5 }}
                transition={marked(0.18)}
                style={{
                  position: 'absolute',
                  left: u(PEAK.x - ZONE.radius),
                  top: u(PEAK.y - ZONE.radius),
                  width: u(2 * ZONE.radius),
                  height: u(2 * ZONE.radius),
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  border: `${u(ZONE.ring)} solid ${isoColor.done}`,
                }}
              />
              <m.div
                initial={false}
                animate={{ opacity: found ? 1 : 0, scale: found ? 1 : 0.3 }}
                transition={marked(0.3)}
                style={{
                  position: 'absolute',
                  left: u(PEAK.x - ZONE.best / 2),
                  top: u(PEAK.y - ZONE.best / 2),
                  width: u(ZONE.best),
                  height: u(ZONE.best),
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  background: isoColor.done,
                  border: `${u(TRIAL.border)} solid ${palette.surface}`,
                }}
              />

              {TRIALS.map((_, index) => (
                <Trial key={index} index={index} phase={phase} />
              ))}
            </div>
          </div>
        </div>
      </m.div>
    </div>
  );
});
Art.displayName = 'OptimizeStudyArt';

/** Everything that needs the motion library, loaded only when the piece comes near the screen. */
const OptimizeStudyScene = (props: ComponentProps<typeof Art>) => (
  <LazyMotion features={domAnimation} strict>
    <Art {...props} />
  </LazyMotion>
);

export default OptimizeStudyScene;
