import { SIGNUP_URL } from '../theme/neu';

/**
 * CONNECTION POINT 2 of 3 (see docs/strategies/HANDOFF.md): where the calls to
 * action lead. `href` is an external URL, `to` an internal route.
 *
 * Create and import both open sign-up until the app has deep links into the
 * create and import flows. Funding has no application step in the app yet, so
 * it opens the contact page.
 */
export type CtaTarget = { href: string } | { to: string };

export const STRATEGY_LINKS = {
  create: { href: SIGNUP_URL },
  import: { href: SIGNUP_URL },
  applyForFunding: { to: '/contact' },
} as const satisfies Record<string, CtaTarget>;

/** The funding band's anchor, the target of the header's "Get it funded" link. */
export const FUNDING_ANCHOR = 'funding';
