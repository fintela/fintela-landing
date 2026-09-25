/**
 * The stack's three layers, top to bottom. Shared by the React shell (which
 * names them) and the lazily-loaded WebGL scene (which draws them), so this
 * file must stay free of three.js imports.
 */
export const STACK_LAYERS = ['interface', 'engine', 'intelligence'] as const;

export type StackLayer = (typeof STACK_LAYERS)[number];

/**
 * Which side of the stack each layer's callout hangs on: alternating, so the
 * three labels balance the column instead of stacking up on one edge.
 */
export const CALLOUT_SIDE: Readonly<Record<StackLayer, 'left' | 'right'>> = {
  interface: 'right',
  engine: 'left',
  intelligence: 'right',
};

/** Screen-space position of a layer's callout anchor, in CSS px from the canvas's top-left. */
export interface StackAnchor {
  x: number;
  y: number;
  /** False until the layer has dropped into place (the entrance runs bottom-up). */
  visible: boolean;
}
