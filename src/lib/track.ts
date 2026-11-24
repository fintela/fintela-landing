declare global {
  interface Window {
    /** Microsoft Clarity's queue stub from `index.html`; calls queue until consent loads the tag. */
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * The site's named events. Keep the list closed: a before-and-after comparison
 * only works when a name means the same thing in both periods.
 */
export type TrackEvent =
  | 'cta_trial_click'
  | 'cta_walkthrough_click'
  | 'cta_login_click'
  | 'contact_submit'
  | 'calendly_event_scheduled'
  | 'scroll_50'
  | 'scroll_90'
  | 'section_view'
  | 'hero_loop_step'
  | 'validation_toggle'
  | 'strategies_cta_click';

/**
 * Sends a named event to the site's only analytics, Microsoft Clarity. The stub
 * exists only on fintela.io and delivers only once the visitor has consented
 * (see `index.html`), so everywhere else this is a no-op. Properties go out as
 * Clarity custom tags before the event, which is how Clarity filters by them.
 */
export function track(name: TrackEvent, props: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') return;
  for (const [key, value] of Object.entries(props)) window.clarity('set', key, String(value));
  window.clarity('event', name);
}
