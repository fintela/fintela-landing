import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/** The three seats the site is written for. `funds` is the default and the featured one. */
export const AUDIENCES = ['funds', 'independents', 'teams'] as const;
export type Audience = (typeof AUDIENCES)[number];

export const isAudience = (value: unknown): value is Audience =>
  typeof value === 'string' && (AUDIENCES as readonly string[]).includes(value);

/** `?for=` — a sales link can pre-select a seat: fintela.io/?for=teams#for-funds */
const PARAM = 'for';

const readFromUrl = (): Audience => {
  if (typeof window === 'undefined') return 'funds';
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  return isAudience(raw) ? raw : 'funds';
};

export interface AudienceState {
  audience: Audience;
  setAudience: (next: Audience) => void;
}

/**
 * Selected audience, mirrored into the URL with replaceState rather than a
 * router navigation: a navigation would re-run HomePage's hash-scroll effect
 * and jump the page back to #for-funds on every switch.
 */
export function useAudienceState(): AudienceState {
  const [audience, set] = useState<Audience>(readFromUrl);
  const setAudience = useCallback((next: Audience) => {
    set(next);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (next === 'funds') url.searchParams.delete(PARAM);
    else url.searchParams.set(PARAM, next);
    window.history.replaceState(window.history.state, '', url);
  }, []);
  return useMemo(() => ({ audience, setAudience }), [audience, setAudience]);
}

export const AudienceContext = createContext<AudienceState>({
  audience: 'funds',
  setAudience: () => {},
});

/** Read by the dossier band (writes it) and the FAQ band (sorts by it). */
export const useAudience = () => useContext(AudienceContext);
