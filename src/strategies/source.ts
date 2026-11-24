import { useEffect, useState } from 'react';
import { loadJson, peekJson } from '../content/json';
import { BOARD_PATH, boardBase, toSnapshot, type BoardEnvelope } from './api';
import type { StrategiesState } from './types';

/**
 * Where the board's data comes from: always the backend's public board
 * (`GET <VITE_FINTELA_API>/public/strategy-board`, see `api.ts`), the
 * portfolios whose share link is "Anyone with the link" and that are tracked
 * forward. There is no sample fallback: a failed read is the `error` state and
 * an empty board is an empty board.
 */
const today = () => new Date().toISOString().slice(0, 10);

const ready = (envelope: BoardEnvelope): StrategiesState => {
  try {
    return { status: 'ready', snapshot: toSnapshot(envelope, today()) };
  } catch {
    return { status: 'error' };
  }
};

export function usePublishedStrategies(): StrategiesState {
  const base = boardBase();
  const [state, setState] = useState<StrategiesState>(() => {
    // Seeded by the prerender or an earlier visit: render ready on the first pass.
    const seeded = peekJson<BoardEnvelope>(`${base}${BOARD_PATH}`);
    return seeded ? ready(seeded) : { status: 'loading' };
  });

  useEffect(() => {
    let active = true;
    loadJson<BoardEnvelope>(base, BOARD_PATH)
      .then((envelope) => active && setState(ready(envelope)))
      .catch(() => active && setState({ status: 'error' }));
    return () => {
      active = false;
    };
  }, [base]);

  return state;
}
