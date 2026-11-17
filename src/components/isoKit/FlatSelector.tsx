import { m, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { fonts, palette, radii, shadows, soft } from '../../theme/tokens';
import { flatSelector, stageCentre, u } from './flat';
import { ease, span } from './scrub';
import { time as kitTime } from './tokens';

const MASK = 'linear-gradient(transparent, black 30%, black 70%, transparent)';
/** Seconds the selector takes to fade out of the way. */
const GONE_TIME = 0.3;

interface FlatSelectorProps {
  /** Brand and product names aren't translated. Anything else is, on the landing. */
  names: readonly string[];
  /** Index into `names` of the one it stops on. */
  landOn: number;
  /** The scene's playhead, in seconds. */
  time: MotionValue<number>;
  /**
   * Seconds on the playhead when the names start to run and coast to a stop, when the
   * window turns black around the chosen name, and when it fades out, leaving the next
   * surface to grow from its window.
   */
  at: { spin: number; land: number; gone: number };
}

/**
 * The flat pieces' way of choosing one thing from a few: names on a strip that spins,
 * slows and stops behind a fixed window, in the middle of the stage. Every part of it
 * follows the playhead, so it can be scrubbed both ways.
 */
export const FlatSelector = ({ names, landOn, time, at }: FlatSelectorProps) => {
  const { width, height, row, window: slot, cycles, spinTime } = flatSelector;
  const landingRow = cycles * names.length + landOn;
  const rows = Array.from({ length: landingRow + 2 }, (_, i) => names[i % names.length]);
  const travel = (-(landingRow - 1) / rows.length) * 100;
  const fade = kitTime.cardOut;

  const strip = useTransform(time, (s) => `${travel * span(s, at.spin, spinTime, ease.spin)}%`);
  const ink = useTransform(time, (s) => span(s, at.land, fade));
  const chosen = useTransform(time, [at.land, at.land + fade], [palette.navy, palette.surface]);
  const shown = useTransform(time, (s) => 1 - span(s, at.gone, GONE_TIME, ease.settle));
  const scale = useTransform(shown, (v) => 0.9 + 0.1 * v);

  return (
    <m.div
      style={{
        position: 'absolute',
        left: u(stageCentre.x - width / 2),
        top: u(stageCentre.y - height / 2),
        width: u(width),
        height: u(height),
        borderRadius: u(radii.neuInner),
        background: palette.surface,
        boxShadow: shadows.neuRaisedMd,
        opacity: shown,
        scale,
      }}
    >
      {[false, true].map((landed) => (
        <m.div
          key={String(landed)}
          style={{
            position: 'absolute',
            left: u((width - slot.width) / 2),
            top: u((height - slot.height) / 2),
            width: u(slot.width),
            height: u(slot.height),
            borderRadius: u(slot.radius),
            background: landed ? palette.navy : soft.ground,
            // A sunken well's white highlight would read as a pale rim on black.
            boxShadow: landed ? shadows.neuAccent : shadows.neuInsetSm,
            opacity: landed ? ink : 1,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: u(radii.neuInner),
          maskImage: MASK,
          WebkitMaskImage: MASK,
        }}
      >
        <m.div style={{ y: strip }}>
          {rows.map((name, i) => (
            <m.div
              key={i}
              style={{
                height: u(row),
                display: 'grid',
                placeItems: 'center',
                color: i === landingRow ? chosen : palette.textMuted,
                fontFamily: fonts.sans,
                fontSize: u(20),
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </m.div>
          ))}
        </m.div>
      </div>
    </m.div>
  );
};
