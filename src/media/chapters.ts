import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';

/** One chapter of a demo video. `start` is seconds; the same in every locale. */
export interface VideoChapter {
  id: string;
  label: string;
  sub?: string;
  start: number;
}

/** What a VideoPlate exposes through its ref. */
export interface VideoPlateHandle {
  /** Seek to a chapter id or a time in seconds; plays unless `autoplay` is false. */
  seekTo(target: string | number, autoplay?: boolean): void;
  play(): void;
  pause(): void;
  /** Scroll the plate into view (a section's "Watch" button lands here). */
  reveal(): void;
}

/** The last chapter whose start is at or before `time`. */
export function chapterAt(chapters: readonly VideoChapter[], time: number): VideoChapter | undefined {
  let active: VideoChapter | undefined;
  for (const c of chapters) {
    if (c.start <= time) active = c;
    else break;
  }
  return active ?? chapters[0];
}

/**
 * State shared by a VideoPlate and whatever drives it — a chapter rail, a pill
 * strip, the hex nodes: the active chapter (written by the player's timeupdate)
 * and `seekTo` (called by the controls).
 */
export function useVideoChapters(chapters: readonly VideoChapter[]): {
  activeId: string | undefined;
  setActiveId: (id: string) => void;
  playerRef: RefObject<VideoPlateHandle | null>;
  seekTo: (id: string) => void;
} {
  const playerRef = useRef<VideoPlateHandle | null>(null);
  const [activeId, setActiveId] = useState<string | undefined>(chapters[0]?.id);
  const seekTo = useCallback((id: string) => {
    setActiveId(id);
    playerRef.current?.seekTo(id);
  }, []);
  return { activeId, setActiveId, playerRef, seekTo };
}

/** `m:ss` for timestamps and the player clock. */
export const formatTime = (seconds: number): string => {
  // A stream without duration metadata reports Infinity; show a zero clock, not "Infinity:NaN".
  const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};
