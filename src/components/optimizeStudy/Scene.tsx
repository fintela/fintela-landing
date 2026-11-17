import { memo } from 'react';
import type { CSSProperties } from 'react';
import { domAnimation, LazyMotion, m, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { APP } from '../../components/fintelligentDemo/appTheme';
import { fonts, palette, radii, shadows } from '../../theme/tokens';
import { stageCentre, u } from '../isoKit/flat';
import { ease, keyframes, span, useSceneTime } from '../isoKit/scrub';
import type { SceneTime } from '../isoKit/timeline';
import { isoColor, markHues, size, time as kitTime } from '../isoKit/tokens';
import { AT, BEAT, BEATS } from './beats';

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

const SEARCH = AT[BEAT.search];
const SEARCH_TIME = BEATS[BEAT.search - 1];
const FOUND = AT[BEAT.found];
const FRAMED = AT[BEAT.frame];
const MORPH = AT[BEAT.morph];
/** How long the badge and its card take to settle. */
const GROW = 0.65;
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

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

interface TrialState {
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

/**
 * A trial's place on the map at any moment: it pops in, searches, and then either
 * closes on the peak and merges into the best trial or stays faded where it was pruned.
 */
const trialAt = (index: number) => {
  const { start, hops } = TRIALS[index];
  const frames = searchFrames(TRIALS[index], index);
  const search = (values: number[]) => keyframes(SEARCH, SEARCH_TIME, values, frames.times, ease.settle);
  const searchX = search(frames.x);
  const searchY = search(frames.y);
  const searchOpacity = search(frames.opacity);
  const searchScale = search(frames.scale);
  const endX = frames.x[frames.x.length - 1];
  const endY = frames.y[frames.y.length - 1];
  const survivor = hops === HOPS;
  const delay = AT[BEAT.scatter] + index * 0.03;
  const close = FOUND + index * 0.015;

  return (s: number): TrialState => {
    if (s < SEARCH) {
      return {
        x: 0,
        y: 0,
        opacity: span(s, delay, kitTime.cardOut),
        scale: lerp(0.4, 1, span(s, delay, kitTime.packet, ease.pop)),
      };
    }
    if (s < FOUND) {
      return { x: searchX(s), y: searchY(s), opacity: searchOpacity(s), scale: searchScale(s) };
    }
    if (!survivor) return { x: endX, y: endY, opacity: 0, scale: 0.4 };
    const merge = span(s, close, 0.4, ease.settle);
    return {
      x: lerp(endX, PEAK.x - start.x, merge),
      y: lerp(endY, PEAK.y - start.y, merge),
      opacity: 1 - span(s, close + 0.2, 0.18, ease.out),
      scale: lerp(1, 0.4, merge),
    };
  };
};

const TRIAL_AT = TRIALS.map((_, index) => trialAt(index));

const square = (side: number): CSSProperties => ({
  position: 'absolute',
  left: u(-side / 2),
  top: u(-side / 2),
  width: u(side),
  height: u(side),
});

/** A trial on the map. Survivors close in on the peak and merge into the best trial. */
const Trial = ({ index, time }: { index: number; time: MotionValue<number> }) => {
  const { start, hue } = TRIALS[index];
  const at = TRIAL_AT[index];
  const x = useTransform(time, (s) => u(at(s).x));
  const y = useTransform(time, (s) => u(at(s).y));
  const opacity = useTransform(time, (s) => at(s).opacity);
  const scale = useTransform(time, (s) => at(s).scale);

  return (
    <m.div
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
        x,
        y,
        opacity,
        scale,
      }}
    />
  );
};

/** A mark on the found zone: it pops in `delay` seconds after the search ends. */
const useMark = (time: MotionValue<number>, delay: number, from: number) => ({
  opacity: useTransform(time, (s) => span(s, FOUND + delay, kitTime.cardOut)),
  scale: useTransform(time, (s) => lerp(from, 1, span(s, FOUND + delay, kitTime.packet, ease.pop))),
});

const Art = memo(({ time, label, detail }: { time: MotionValue<number>; label: string; detail: string }) => {
  const grow = useTransform(time, (s) => span(s, MORPH, GROW, ease.settle));
  const carded = useTransform(time, (s) => (s >= MORPH ? 1 : 0));
  const cardWidth = useTransform(grow, (p) => u(lerp(PLATE_SIDE, FINAL.width, p)));
  const cardHeight = useTransform(grow, (p) => u(lerp(PLATE_SIDE, FINAL.height, p)));
  const cardText = useTransform(time, (s) => span(s, MORPH + 0.3, kitTime.plate, ease.settle));
  const cardTextX = useTransform(cardText, (p) => u(lerp(-10, 0, p)));
  const badgeX = useTransform(grow, (p) => u(BADGE_SHIFT * p));
  const badgeScale = useTransform(grow, (p) => lerp(1, BADGE_SCALE, p));
  const plateShadow = useTransform(time, (s) => 1 - span(s, FRAMED, 0.3, ease.settle));
  const framed = useTransform(time, (s) => (s >= FRAMED ? 1 : 0));
  const frameScale = useTransform(time, (s) =>
    lerp(PLATE_SIDE / FRAME_SIDE, 1, span(s, FRAMED, kitTime.plate, ease.settle))
  );
  const zone = useMark(time, 0.18, 0.5);
  const best = useMark(time, 0.3, 0.3);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* The study's card opens out from behind the framed grid. */}
      <m.div
        style={{
          position: 'absolute',
          left: u(stageCentre.x),
          top: u(stageCentre.y),
          x: '-50%',
          y: '-50%',
          width: cardWidth,
          height: cardHeight,
          opacity: carded,
          borderRadius: u(radii.neuInner),
          background: palette.surface,
          boxShadow: shadows.neuRaisedMd,
        }}
      >
        <m.div
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
            opacity: cardText,
            x: cardTextX,
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
        style={{
          position: 'absolute',
          left: u(stageCentre.x),
          top: u(stageCentre.y),
          width: 0,
          height: 0,
          x: badgeX,
          scale: badgeScale,
        }}
      >
        {/* The plate's raised shadow. The frame takes over from it. */}
        <m.div
          style={{
            ...square(PLATE_SIDE),
            borderRadius: u(PLATE.radius),
            background: palette.surface,
            boxShadow: shadows.neuRaisedMd,
            opacity: plateShadow,
          }}
        />

        {/* Starts hidden exactly behind the plate, then grows out around it. */}
        <m.div
          style={{
            ...square(FRAME_SIDE),
            borderRadius: u(FRAME_RADIUS),
            background: palette.navy,
            boxShadow: shadows.neuAccent,
            opacity: framed,
            scale: frameScale,
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
                style={{
                  position: 'absolute',
                  left: u(PEAK.x - ZONE.radius),
                  top: u(PEAK.y - ZONE.radius),
                  width: u(2 * ZONE.radius),
                  height: u(2 * ZONE.radius),
                  boxSizing: 'border-box',
                  borderRadius: '50%',
                  border: `${u(ZONE.ring)} solid ${isoColor.done}`,
                  ...zone,
                }}
              />
              <m.div
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
                  ...best,
                }}
              />

              {TRIALS.map((_, index) => (
                <Trial key={index} index={index} time={time} />
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
const OptimizeStudyScene = ({ time, ...props }: { time: SceneTime; label: string; detail: string }) => {
  const playhead = useSceneTime(time);
  return (
    <LazyMotion features={domAnimation} strict>
      <Art time={playhead} {...props} />
    </LazyMotion>
  );
};

export default OptimizeStudyScene;
