export type PuzzleShape = 'tall' | 'standard' | 'wide';

export interface PuzzleTile {
  shape: PuzzleShape;
  col: string;
  row: string;
}

export interface PuzzleLayout {
  heroCol: string;
  heroRow: string;
  /** The slot beside the hero — only present when a second post exists. */
  companion?: PuzzleTile;
  /** One entry per post in `posts.slice(2)`, same order. */
  bandTiles: PuzzleTile[];
}

const BAND_SIZE = 4;

/**
 * Grid placement for the desktop `/blog` puzzle: a 3-column grid where the hero
 * takes the top-left 2x2, a vertical card fills the column beside it, and
 * everything after flows through a repeating 4-post band (tall + 2 standards +
 * wide) that mirrors left/right each time for variety.
 *
 * A band is only emitted when enough posts remain to fill it completely.
 * `BentoGrid` never uses `grid-auto-flow: dense` (DOM order must stay reading
 * order), so a half-filled multi-row band would leave a visible hole; any
 * remainder instead flows as plain 1x1 tiles.
 */
export function layoutPuzzle(total: number): PuzzleLayout {
  const heroCol = total <= 1 ? '1 / 4' : '1 / 3';
  const companion: PuzzleTile | undefined =
    total >= 2 ? { shape: 'tall', col: '3 / 4', row: '1 / 3' } : undefined;

  const bandCount = Math.max(0, total - 2);
  const fullBands = Math.floor(bandCount / BAND_SIZE);
  const bandTiles: PuzzleTile[] = [];
  let row = 3;

  for (let b = 0; b < fullBands; b++) {
    const mirrored = b % 2 === 1;
    if (!mirrored) {
      bandTiles.push(
        { shape: 'tall', col: '1 / 2', row: `${row} / ${row + 2}` },
        { shape: 'standard', col: '2 / 3', row: `${row} / ${row + 1}` },
        { shape: 'standard', col: '3 / 4', row: `${row} / ${row + 1}` },
        { shape: 'wide', col: '2 / 4', row: `${row + 1} / ${row + 2}` },
      );
    } else {
      bandTiles.push(
        { shape: 'standard', col: '1 / 2', row: `${row} / ${row + 1}` },
        { shape: 'standard', col: '2 / 3', row: `${row} / ${row + 1}` },
        { shape: 'tall', col: '3 / 4', row: `${row} / ${row + 2}` },
        { shape: 'wide', col: '1 / 3', row: `${row + 1} / ${row + 2}` },
      );
    }
    row += 2;
  }

  // Remainder too small for another full band: plain 1x1 tiles, 3 per row.
  const tailCount = bandCount - fullBands * BAND_SIZE;
  for (let k = 0; k < tailCount; k++) {
    const col = k % 3;
    if (col === 0 && k > 0) row += 1;
    bandTiles.push({ shape: 'standard', col: `${col + 1} / ${col + 2}`, row: `${row} / ${row + 1}` });
  }

  return { heroCol, heroRow: '1 / 3', companion, bandTiles };
}
