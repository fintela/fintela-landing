import { createContext, useContext } from 'react';

/**
 * How the prerenderer learns that a route resolved to the 404 page.
 *
 * `react-dom/server` returns markup, not a status. `entry-server` provides a
 * callback through this context and `NotFoundPage` calls it while it renders,
 * so `render()` can report 404 for `dist/404.html` and for an unknown
 * `/solutions/*` slug without parsing its own output. In the browser there is
 * no provider and the hook is a no-op.
 */
export type MarkNotFound = () => void;

export const RenderStatusContext = createContext<MarkNotFound | null>(null);

/** Called during render by the not-found page. Idempotent, so StrictMode's double render is fine. */
export function useMarkNotFound(): void {
  const markNotFound = useContext(RenderStatusContext);
  if (markNotFound) markNotFound();
}
