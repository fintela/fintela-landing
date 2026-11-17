import { radii } from '../../theme/tokens';
import { curve, time } from './tokens';

/**
 * Shared values for the flat pieces: self-contained, head-on animations that play
 * once on a clock (STYLE.md, "Flat pieces"). The isometric tokens still apply
 * where they mean the same thing, so these only add what a flat piece needs.
 */

/**
 * One unit of the stage's 400 x 300 design space, as a share of the stage's width.
 * Sizes, offsets and type all use it, so a piece scales as one image from 288 px
 * up, its layout never reflows, and it needs no measuring.
 */
export const u = (units: number) => `${units / 4}cqw`;

/** The middle of the stage, in design units. */
export const stageCentre = { x: 200, y: 150 } as const;

/** The kit's motion tokens, as Framer Motion transitions. */
export const flatTransition = {
  settle: { duration: time.plate, ease: curve.settle },
  lift: { duration: time.lift, ease: curve.spring },
  pop: { duration: time.packet, ease: curve.pop },
  fade: { duration: time.cardOut, ease: 'linear' },
} as const;

/** The selector, in design units. A piece grows its next surface out of `window`. */
export const flatSelector = {
  width: 170,
  height: 180,
  row: 60,
  window: { width: 154, height: 52, radius: radii.neuWell },
  /** How many times the names go past before it stops. */
  cycles: 3,
  /** Seconds, and the length of a piece's first beat. */
  spinTime: 1.3,
  /** Rough width of a character at the selector's size, to centre a name before it can be measured. */
  charWidth: 10.4,
} as const;
