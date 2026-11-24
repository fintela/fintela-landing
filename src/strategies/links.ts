import { SIGNUP_URL } from '../theme/neu';

/**
 * CONNECTION POINT 2 of 3 (see docs/strategies/HANDOFF.md): where the calls to
 * action lead. `href` is an external URL, `to` an internal route.
 *
 * Create and import both open sign-up until the app has deep links into the
 * create and import flows. Requesting funding opens the request form on the
 * Get Funding page (`FUNDING_PATH` + `FUNDING_REQUEST_ANCHOR` in
 * `src/funding/config.ts`, on the feat/get-funding branch); "Apply for
 * funding" in the funding band still opens the contact page.
 */
export type CtaTarget = { href: string } | { to: string };

export const STRATEGY_LINKS = {
  create: { href: SIGNUP_URL },
  import: { href: SIGNUP_URL },
  applyForFunding: { to: '/contact' },
  requestFunding: { to: '/get-funding#request' },
} as const satisfies Record<string, CtaTarget>;

/** The funding band's anchor. */
export const FUNDING_ANCHOR = 'funding';
