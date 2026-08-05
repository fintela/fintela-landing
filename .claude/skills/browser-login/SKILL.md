---
name: browser-login
description: >-
  Open the local Fintela frontend in a Playwright browser so the user can log in
  manually via Keycloak, then hand control back to Claude for browser-driven
  verification. Use when the user says "open playwright", "abre el navegador",
  "open the local app", "let me log in", or before any in-browser E2E /
  Playwright verification of the local stack. Keycloak login is INTERACTIVE — the
  user enters their own credentials; Claude must never type or request them.
---

# Open the local app for manual login (Fintela + Playwright)

The local SPA authenticates against the **real** Keycloak (`keycloak.fintela.io`), so login
cannot be automated — the user signs in by hand. The division of labor is fixed:

1. **Claude** opens the Playwright browser and navigates to the local frontend.
2. **The user** completes the Keycloak login with their own credentials.
3. **The user** returns ("ya entré" / "I'm in") and gives the next instruction.
4. **Claude** resumes, driving the now-authenticated session (snapshots, clicks, preview, etc.).

Claude **never** types, reads, stores, or asks for the user's password — step 2 is always manual.

## Procedure

1. **Confirm the local stack is up** and find the Vite dev-server port (usually `5173`):
   ```bash
   ss -ltnp 2>/dev/null | grep -E ':(5173|3000|8081)\b'
   ```
   Expected: frontend on `5173`, backend on `3000`, developer-api on `8081`. If `5173` is
   absent, start it: `cd frontend && npm run dev` (and `make local` for the backend deps).

2. **Open the browser** at the dev server (load the Playwright MCP tools first via ToolSearch
   if they aren't already available — `mcp__playwright__browser_navigate`, `_snapshot`,
   `_take_screenshot`):
   ```js
   await page.goto('http://localhost:5173');
   ```
   The app redirects to Keycloak. Take a screenshot to confirm the login screen rendered, then
   **stop and tell the user to log in manually.** Do not proceed past the login wall.

3. **Wait for the user.** Do NOT poll, click, or take further actions until the user says they
   are logged in. When they return, take a fresh `browser_snapshot` to re-orient on the
   authenticated page, then follow their next instruction.

## Notes & troubleshooting

- **Empty snapshot right after navigate** = page still mid-load/redirect; take a
  `browser_take_screenshot` instead, or re-snapshot after the user logs in.
- **Session expired / closed** = just re-run the procedure; the browser state is not persisted
  across MCP sessions, so a manual re-login is expected each time.
- **Wrong port:** Vite picks the next free port (`5174`, …) if `5173` is taken — read the actual
  port from step 1, don't assume.
- Playwright artifacts (console logs, screenshots) land in `.playwright-mcp/` at the repo root;
  it's scratch output, not something to commit.

## Done when

The browser is at the Keycloak login screen and the user has been handed control to sign in. The
skill's job ends at the login wall — everything after authentication is the task at hand.
