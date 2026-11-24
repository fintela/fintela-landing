# Strategies page: what is built and what is left to connect

`/strategies` shows the public strategies board and the Fintela Funding
invitation, on live data from the backend. The proposal and research behind
it are in the artifact https://claude.ai/artifact/VRYaWBq9ne7sPc89KEwncU.

## State today

- The route exists and works in the browser build (`src/App.tsx`).
- It always reads the backend's public board (see connection 1); there is no
  sample data and no switch. The backend route is deployed.
- It is public: indexable, in `STATIC_ROUTES` (prerendered, in the sitemap) and
  linked from the header ("Strategies", before Pricing) and the footer. The
  prerendered page carries the shell and the loading line; the rows arrive in
  the browser.

## Where things live

| Path | Holds |
| --- | --- |
| `src/strategies/types.ts` | The board's view model: `PublishedStrategy`, `StrategiesSnapshot`, `StrategiesState`. |
| `src/strategies/api.ts` | The backend's wire contract and the adapter from it to the view model. |
| `src/strategies/source.ts` | `usePublishedStrategies()`, the only place data enters. |
| `src/strategies/ranking.ts` | Days live, CAGR, Fintela Score, sort, filter, leaders, activity. Pure functions. |
| `src/strategies/links.ts` | Call-to-action destinations and the funding anchor. |
| `src/components/sections/StrategiesSection.tsx` | Header, activity strip, leaders strip, board. |
| `src/components/sections/FundingSection.tsx` | Fintela Funding band. |
| `src/components/strategies/` | Board, sparkline, highlights, CTA components. |
| `src/pages/StrategiesPage.tsx` | The page. |
| `src/i18n/locales/en/pages.json` | All copy, under `strategies`. |

## Connections to make

### 1. Data: connected

**What is listed.** A portfolio appears on the board when both are true:

- it has a share link whose access is "Anyone with the link"
  (`portfolio_share_links.visibility = 'public'`, not revoked);
- it is tracked forward: the app's Watching or Live stage. A Candidate (a
  backtest trial nobody watched) and a Retired portfolio are not listed.

Making the link restricted, or revoking it, removes the row. Nothing else is
needed from the owner: there is no separate "publish to the board" switch.

**The route.** `GET <api>/public/strategy-board`, unauthenticated, in
`services/backend/src/routes/portfolio_shares/board.rs` of the app repo
(worktree `fintela-worktrees/public-strategies-board`). It returns
`{ data: { as_of, strategies: [...] } }`; `src/strategies/api.ts` mirrors the
row shape field by field.

- Every figure is computed on the server, on the portfolio's model curve
  (`managed_equity`) from the watch day forward, with the functions behind the
  app's own window metrics. Never the backtest, never broker P&L.
- Alpha and beta use the platform default benchmark for the asset class and are
  `null` where the class has none (a generalized universe).
- A row needs at least 5 forward bars to be listed.
- The row carries no token, link, ticker, holding, trade, capital or internal
  id. A test pins its key set (`the_board_row_cannot_grow`). The board
  therefore cannot open a strategy's shared Profile.
- The board is assembled at most every 5 minutes per backend task, and a
  browser may cache it for 60 seconds. A revoke clears the copy of the task
  that handled it at once; other tasks catch up within 5 minutes.

**How it is wired.** `source.ts` fetches the route from `VITE_FINTELA_API`,
which a production build defaults to the real backend. A failed read shows the
error line; an empty board says how to get listed. A dev build needs
`VITE_FINTELA_API` set, and the backend's `CORS_ALLOWED_ORIGINS` must include
the page's origin.

**Verified.** The production route returns real rows, and the page rendered
them in a browser.

**Not provided by the backend.** A funding status: nothing in the app records
one, so the Funded and Funding review badges and the funding count never show
on live data. CAGR and the Fintela Score are still computed in the page
(`rankStrategies`).

### 2. Calls to action (`src/strategies/links.ts`)

"Create a strategy" and "Import your strategy" both open sign-up. Point them at
the app's create and import flows when deep links exist. "Apply for funding"
opens `/contact` because the app has no funding application step.

### 3. Still optional

- To put the rows in the prerendered HTML, fetch the board in
  `scripts/prerender.mjs` and seed it under the URL `source.ts` reads.
- To embed the board on the homepage, render `<StrategiesSection state={…} />`
  and `<FundingSection />` in `HomePage.tsx`; both are self-contained.

## Decisions still open

- **Listing existing links.** The share-link design (D7 in the app repo's
  `plans/public-share-links`) promised owners that a public link is unlisted.
  The board lists it. Every link that is public today would appear the day the
  route ships, without its owner having been told. Options: tell owners first,
  list only links made after a date, or add a consent step to the share dialog.
- **Author names.** The row shows the author's display name from their account,
  as the shared Profile does, and the study's name. Both become readable by
  anyone, not only by people holding the link.
- **Day 0.** Figures run from the day the portfolio was watched, not the day it
  was shared, so an owner can watch several portfolios and share only the one
  that did well. Measuring from the share date would prevent that, at the cost
  of every record starting at zero.

- **Score methodology.** With the 90-day minimum, short track records can top
  the Fintela Score: in the earlier sample data a 152-day and a 97-day strategy ranked
  first and second, because a short good run annualizes to a high CAGR. Options:
  raise the minimum to 180 days, or weight total return instead of CAGR.
- **Paper beside live.** Both are ranked together and badged.
- **Funding eligibility.** Who qualifies, and who runs the evaluation.
- **Funded status.** Whether the badge is public, and with whose consent.
- **Legal review.** Ranking disclaimers, and whether inviting creators to seek
  third-party financing is regulated activity. The funding copy has not been
  reviewed by counsel.
- **Two-button rule.** The site allows two calls to action per view ("Start
  free trial", "Book a walkthrough"). This page uses its own labels.
