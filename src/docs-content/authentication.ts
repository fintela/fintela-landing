// Shared content for the API authentication doc block.
//
// SINGLE SOURCE OF TRUTH. The landing (`src/docs/blocks/api/
// authentication.tsx`) and app (`the Fintela app's doc blocks
// authentication.tsx`) copies had drifted — they documented different, partly
// wrong things — until they were corrected to the read-only reality. That
// corrected, read-only content lives here now so it cannot drift again.
//
// Ground truth: the developer API is read-only (every endpoint is a GET),
// authenticated by API key sent as a Bearer token in the Authorization header;
// the real host is developer.fintela.io (never the dead placeholder host); a key
// carries no scopes and reads exactly what its owner can see.

import type { AuthContent } from './types';

export const authentication: AuthContent = {
  summary:
    "The developer API is read-only and authenticated by API key. Send it as a Bearer token in the Authorization header; a key applies its owner's own visibility, so there are no scopes to configure.",

  // Byte-identical across both trees — keep verbatim.
  authExample: `curl -H "Authorization: Bearer $FINTELA_API_KEY" \\
     https://developer.fintela.io/strategies`,

  full: [
    "The developer API is read-only — every endpoint is a GET. Authentication is by API key: create one in the Fintela app under your organization's developer settings, then send it as a Bearer token on every request. The key is shown once at creation — store it in your secret manager, and revoke it in the app if it leaks.",
    "There are no scopes to configure. A key resolves to two things — the organization it was issued in and the user who created it — and every read applies that owner's own visibility.",
    "A key is not an organization-wide master key: a colleague's private strategy stays private even though you share an org. And a results_only grant is intentionally app-only — requesting such a resource by id behaves as if it does not exist.",
  ],

  // The five-row "what a key can see" table.
  visibility: [
    { resource: 'Owned by the key owner', visible: 'Yes' },
    { resource: 'Shared with the whole organization', visible: 'Yes' },
    { resource: 'Shared with the owner as full', visible: 'Yes' },
    { resource: 'Shared with the owner as results_only', visible: 'No — use the web app' },
    { resource: 'Belonging to another organization', visible: 'No' },
  ],

  tip:
    'Header only — never the query string. The key is read from the Authorization header and nowhere else. Passing it as ?api_key=… does not authenticate you. A request without the header returns 401 Unauthorized, as does a revoked key.',

  compact:
    'API key as a Bearer token. Set Authorization: Bearer $FINTELA_API_KEY on every request. No scopes — a key reads exactly what its owner can see.',

  inline:
    'API key as a Bearer token — set Authorization: Bearer $FINTELA_API_KEY on every request.',
};
