/**
 * The contact form's one call: `POST /contact` on the Fintela backend.
 *
 * Where it goes is decided at build time and never by the visitor:
 *
 *   - `VITE_FINTELA_API`, when set — `setup_worktree.sh` writes a product
 *     worktree's backend into `.env.development.local` (development mode only,
 *     so a localhost URL cannot reach a production bundle; see
 *     docs/LOCAL_WORKTREES.md).
 *   - otherwise the real backend in a production build,
 *   - otherwise NOTHING in development: the call throws before any request is
 *     made. Deliberate — the alternative is every local test of the form filing
 *     a real request with production and emailing real staff.
 *
 * The backend answers 200 `{ data: { id } }`, 400 with a message for a body it
 * refuses, and 429 when one network submits more than a handful in ten minutes.
 * The rest of what happens — the row, the staff notification — is the
 * backend's, and the page only needs "received" or "not received, and why".
 */

export type ContactKind = 'walkthrough' | 'support';

export interface ContactRequest {
  kind: ContactKind;
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  /** The visitor's UI language, so whoever answers writes back in it. */
  locale: string;
  /** Where the form was on — always `/contact`, the page's only address now. */
  page_url: string;
  /**
   * The honeypot. A field no human sees and therefore never fills; a bot that
   * fills every input trips it and gets a convincing "received" for its trouble.
   * Always sent, always empty from a person.
   */
  website: string;
}

export type ContactFailure = 'unconfigured' | 'rate_limited' | 'rejected' | 'unavailable';

export class ContactApiError extends Error {
  readonly reason: ContactFailure;
  readonly status: number | undefined;

  constructor(reason: ContactFailure, message: string, status?: number) {
    super(message);
    this.name = 'ContactApiError';
    this.reason = reason;
    this.status = status;
  }
}

const configured = (import.meta.env.VITE_FINTELA_API ?? '').trim().replace(/\/+$/, '');
const PRODUCTION_API = 'https://backend.fintela.io';

/** The origin the form posts to, or `undefined` when a dev build has none. */
export function contactApiBase(): string | undefined {
  if (configured) return configured;
  if (import.meta.env.PROD) return PRODUCTION_API;
  return undefined;
}

let warnedOnce = false;

export async function submitContactRequest(body: ContactRequest): Promise<{ id: string }> {
  const base = contactApiBase();
  if (!base) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        '[contact] VITE_FINTELA_API is unset, so the form has nowhere to post. ' +
          'Run ./setup_worktree.sh --reconfigure --product <name> (see docs/LOCAL_WORKTREES.md).',
      );
    }
    throw new ContactApiError('unconfigured', 'VITE_FINTELA_API is unset');
  }

  let res: Response;
  try {
    res = await fetch(`${base}/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new ContactApiError('unavailable', err instanceof Error ? err.message : String(err));
  }

  if (res.status === 429) {
    throw new ContactApiError('rate_limited', 'too many requests', res.status);
  }
  if (!res.ok) {
    // 400 carries a sentence about the body; anything else is the backend's
    // problem and the sentence is not for the visitor.
    const reason: ContactFailure = res.status === 400 ? 'rejected' : 'unavailable';
    throw new ContactApiError(reason, `POST ${base}/contact failed with ${res.status}`, res.status);
  }

  const payload = (await res.json()) as { data?: { id?: string } };
  const id = payload?.data?.id;
  if (typeof id !== 'string') {
    throw new ContactApiError('unavailable', 'the backend answered without an id', res.status);
  }
  return { id };
}
