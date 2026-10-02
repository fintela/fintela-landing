/**
 * The demos' timing helpers, outside stage.tsx so that file exports only
 * components (fast refresh).
 */
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { ease, lerp, span } from './script';
import type { ToolStep } from './script';

export interface Chapter {
  key: string;
  start: number;
  /** Where a paused, reduced-motion seek lands. */
  still: number;
}

/** The app's panel entrance: a spring that overshoots, then settles. */
export const easeOutBack = (x: number) => {
  const c = 1.7;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** The settled answer's tool chips: the app collapses repeats into "×n". */
export const chipsFor = (steps: readonly ToolStep[], label: (key: string) => string) => {
  const out: Array<[string, number]> = [];
  for (const s of steps) {
    const name = s.labelKey ? label(s.labelKey) : (s.label ?? s.tool);
    const hit = out.find(([l]) => l === name);
    if (hit) hit[1] += 1;
    else out.push([name, 1]);
  }
  return out;
};

export const chapterEnd = (chapters: readonly Chapter[], loop: number, i: number) =>
  i + 1 < chapters.length ? chapters[i + 1].start : loop;

/**
 * Per frame, outside React: the pointer, eased between the elements the
 * script points at (measured live, through any transform on the stage), and
 * the chapter fills.
 */
export function usePointerFrame({
  now,
  stageRef,
  cursorRef,
  rippleRef,
  fillRefs,
  chapters,
  loop,
  path,
  clicks,
}: {
  now: number;
  stageRef: RefObject<HTMLDivElement | null>;
  cursorRef: RefObject<HTMLDivElement | null>;
  rippleRef: RefObject<HTMLDivElement | null>;
  fillRefs: RefObject<Array<HTMLDivElement | null>>;
  chapters: readonly Chapter[];
  loop: number;
  path: ReadonlyArray<readonly [number, string]>;
  clicks: readonly number[];
}) {
  const lastCursorRef = useRef<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    chapters.forEach((c, i) => {
      const fill = fillRefs.current[i];
      if (fill) fill.style.width = `${(span(now, c.start, chapterEnd(chapters, loop, i)) * 100).toFixed(1)}%`;
    });
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    const ripple = rippleRef.current;
    if (!stage || !cursor || !ripple) return;
    const box = stage.getBoundingClientRect();
    const at = (id: string): [number, number] | null => {
      if (id === 'enter') return [box.width + 40, box.height * 0.8];
      if (id === 'exit') return [box.width + 40, box.height * 0.92];
      const el = stage.querySelector(`[data-demo="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [r.left - box.left + Math.min(r.width / 2, 60), r.top - box.top + r.height / 2];
    };
    let i = path.findIndex(([time]) => time > now);
    if (i === -1) i = path.length - 1;
    const [ta, ida] = path[Math.max(0, i - 1)];
    const [tb, idb] = path[i];
    const a = at(ida) ?? lastCursorRef.current;
    const b = at(idb) ?? a;
    const kk = ta === tb ? 1 : ease(span(now, ta, tb));
    const x = lerp(a[0], b[0], kk);
    const y = lerp(a[1], b[1], kk);
    lastCursorRef.current = [x, y];
    const visible = now >= path[0][0] && now <= path[path.length - 1][0];
    const click = clicks.find((c) => now >= c && now < c + 0.4);
    const press = click === undefined ? 0 : 1 - span(now, click, click + 0.4);
    cursor.style.opacity = visible ? '1' : '0';
    cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(1 - press * 0.12).toFixed(3)})`;
    ripple.style.opacity = click === undefined ? '0' : (0.5 * press).toFixed(3);
    ripple.style.transform = `translate(-50%, -50%) scale(${(0.4 + (1 - press) * 1.2).toFixed(3)})`;
  });
}
