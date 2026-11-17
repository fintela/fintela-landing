import { fonts, palette, radii, shadows, soft } from '../../theme/tokens';
import { flatSelector, stageCentre, u } from './flat';
import { ease, time } from './tokens';

const MASK = 'linear-gradient(transparent, black 30%, black 70%, transparent)';

interface FlatSelectorProps {
  /** Brand and product names aren't translated. Anything else is, on the landing. */
  names: readonly string[];
  /** Index into `names` of the one it stops on. */
  landOn: number;
  /** From false to true, the names run and coast to a stop. */
  spinning: boolean;
  /** The window turns black around the chosen name. */
  landed: boolean;
  /** It fades out, leaving the next surface to grow from its window. */
  gone: boolean;
}

/**
 * The flat pieces' way of choosing one thing from a few: names on a strip that spins,
 * slows and stops behind a fixed window, in the middle of the stage. It is plain CSS,
 * so it costs React no renders, and the kit stays free of the motion library.
 */
export const FlatSelector = ({ names, landOn, spinning, landed, gone }: FlatSelectorProps) => {
  const { width, height, row, window: slot, cycles, spinTime } = flatSelector;
  const landingRow = cycles * names.length + landOn;
  const rows = Array.from({ length: landingRow + 2 }, (_, i) => names[i % names.length]);
  const travel = (-(landingRow - 1) / rows.length) * 100;
  const fade = `${time.cardOut}s linear`;

  return (
    <div
      style={{
        position: 'absolute',
        left: u(stageCentre.x - width / 2),
        top: u(stageCentre.y - height / 2),
        width: u(width),
        height: u(height),
        borderRadius: u(radii.neuInner),
        background: palette.surface,
        boxShadow: shadows.neuRaisedMd,
        opacity: gone ? 0 : 1,
        transform: gone ? 'scale(0.9)' : 'none',
        transition: `opacity 0.3s ${ease.settle}, transform 0.3s ${ease.settle}`,
      }}
    >
      <div
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
          transition: `background ${fade}`,
        }}
      />
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
        <div
          style={{
            transform: `translateY(${spinning ? travel : 0}%)`,
            transition: `transform ${spinTime}s ${ease.spin}`,
          }}
        >
          {rows.map((name, i) => (
            <div
              key={i}
              style={{
                height: u(row),
                display: 'grid',
                placeItems: 'center',
                color:
                  i !== landingRow ? palette.textMuted : landed ? palette.surface : palette.navy,
                fontFamily: fonts.sans,
                fontSize: u(20),
                fontWeight: 700,
                whiteSpace: 'nowrap',
                transition: `color ${fade}`,
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
