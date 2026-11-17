# Solution pages: audit and plan

Covers `/solutions/hedge-funds`, `/solutions/quant-teams`, `/solutions/independent-quants` and `/solutions/financial-advisors`. Companion to `AUDIT.md` and `PLAN.md` (homepage). Phase 0 is implemented (see Status below); the later phases are planned.

Method:
- The live pages were captured on 2026-11-17 at 1440 px and 390 px.
- Every chapter image was compared with the text beside it.
- Every claim was checked against the app source (`~/projects/fintela/fintela`) and `content/docs`.
- The private screenshot library (`~/projects/fintela/app-screenshots`, 94 screens, 2026-09-11) was used only as a map of what the app can show.
- Each audience plan was reviewed twice: once for grounding in the app, once from the buyer's point of view.

Conventions: the same as `PLAN.md`. Effort S is up to half a day, M is 1-2 days and L is 3-5 days. Acceptance checks are yes/no. Shot ids S1-S19 refer to the capture list in section 5.3.


## Status (2026-11-17)

Phase 0 is implemented in the working tree, uncommitted. It ships from this repo alone.

**Done**

- **Template.**
  - The H1 is the promise (`title` + `titleAccent`), with the audience as its eyebrow.
  - The hero is text-only, on the light ground.
  - "What changes" has per-audience rows that link to the chapters, and the seat panel is deleted.
  - Chapters follow the new anatomy (H3, sentence, mono proof line, docs link), with 3-4 per page.
  - The FAQ renders (5 per page) with FAQPage JSON-LD, followed by one research link and a per-audience closing.
- **Claims.**
  - `solutions.json` is rewritten to the ledger and to the 2026-11-17 decisions (real money open, broker never named, no certifications) and the trade/1, sleeve and deflated-Sharpe findings (section 1.4).
  - The five "any broker" strings in `pages.json` are reworded.
- **Media.**
  - The 11 real-org chapter stills, the 4 black-and-white hero photos and the Unsplash agents poster are deleted from HEAD and from `src/media/registry.ts`.
  - Visuals are now only coded pieces, each badged:
    - advisors: Confirm card, `ValidationCompare` without deflated Sharpe, risk-policy diagram;
    - teams: versions diagram.
- **Checks.**
  - `scripts/check-solution-claims.mjs` runs in CI. It covers the denylist, chapter completeness and raw-key alt text in `dist/`, and fails on 91 problems in the old copy.
  - `scripts/i18n-keysync.mjs` now compares only the languages in `SUPPORTED_LNGS`.
- **Share card.** The independent quants OG card is re-rendered with the new headline.

**Departures from the plan text**

- **No StationSurface interims.** They show an account-level one-click Pause, "@ market" buys and an Export PDF button the app does not have. The hedge funds and independent quants chapters are text-only until captures exist.
- **Light hero.** The hero sits on the light ground rather than ink, so the primary button reads as primary without restyling it.
- **OG photos kept.** The solution OG cards keep their photo backgrounds; they are share previews, not page content.
- **Advisors reporting chapter** uses the export copy, because share links are not in the docs yet (A5).
- **Free-tier line** quotes the documented token grant (250 Fintela Tokens and 200 AI Tokens) rather than study counts.

**Not done here**

- CDN invalidation of the deleted stills.
- The git-history decision (Q9).
- The blog post footer (Q8).
- Docs alignment (A5, A8b).
- Phases 1-5, which need the app repo, the demo organisation and trading days.
---

## 1. Verdict on your findings

### 1.1 Images do not match the text: confirmed, and worse than reported

The four pages carry 19 chapter visuals:

| Verdict | Count | Where |
|---|---|---|
| Matches its text | **1** | Quant Teams, "Committee-ready reports" |
| Right area, wrong moment or crop | 9 | e.g. Hedge Funds "Research at scale" shows a 25-axis metrics radar; Advisors "Validated" shows the bottom half of a heat-mapped table with its headers cut off |
| Unrelated | 5 | Hedge Funds "Execution & risk managers" shows backtest drawdown charts; Hedge Funds "Team workspace & permissions" shows an equity curve; Independents "No environment to build" shows the home greeting "Hi Myrna"; Teams "Provenance" shows a Promote menu; Advisors "Every client's mandate" shows a trial legend |
| Decorative stock | 4 | The same Unsplash string-art poster closes all four pages, standing in for an "agents" video that was never recorded. Its alt text is the raw key `fintelligent.posterAlt`. |

Why the images fail, not only what they show:

- **Unreadable.** Every app still is a full 1280 px frame shrunk to about 0.48x, so labels render at 5-6 px on desktop and about 3 px on phones. Even the right screen cannot prove anything at that size.
- **Real data in a public repo.**
  - A colleague's first name ("Hi Myrna").
  - Personal handles (`ivan_buda_momento`, `myrnadinorah`).
  - A client's branding ("Prepared by Momento Capital").
  - Joke strategy names.
  - Cursors, a notification badge, the floating Fintelligent pill.
  - Self-contradicting numbers: a $111,149 headline over a chart ending at $266K. This is an app bug, see item A3.
- **Reuse across pages.** Advisors borrows four frames from other pages under new captions, and Hedge Funds illustrates four different claims with a single study.
- **Heroes are black-and-white stock photos.** The Independents photo shows a multi-monitor desktop install, the opposite of "nothing to install". No product appears until the third screen on any page.

### 1.2 Too much text: confirmed, but the cause is repetition, not length

| Page | Visible words | Distinct claims | List bullets |
|---|---|---|---|
| Hedge funds | 472 | 25 | 24 |
| Quant teams | 444 | 24 | 24 |
| Independent quants | 402 | 21 | 27 |
| Financial advisors | 531 | 29 | 24 |

400-530 words is not long. The pages feel heavy for four reasons:

- **The same claims recur 4-8 times.** "No infrastructure" appears 6-7 times per page, concurrent studies 6 times, the shared library 8 times on Teams.
- **The bullets repeat the paragraphs.** 11-12 of each page's 12-15 outcome bullets restate the paragraph beside them, and the seat panel repeats the comparison table.
- **Five identical chapter blocks with 18 checkmarks.** The page reads as a wall.
- **The images cannot carry meaning**, so the text has to carry all of it.

### 1.3 Problems your brief did not name (higher risk than the two above)

1. **The pages claim things the app contradicts.** Fix these first.

   | Claim on the pages | What the app actually does |
   |---|---|
   | "Cryptographically hashed history" (16 places, including the hedge-funds SEO description) | No hash exists. The history is dated versions only. |
   | "Private by default" | Everything is org-wide since 2026-08-12. |
   | Cross-organisation publishing | No user can reach it. |
   | The Laboratory | It is off in production. |
   | "Real-time P&L" | P&L is end-of-day. |
   | "Thousands of trials in parallel" | Trials run in parallel batches. |
   | Answers "with sources" | No citations, only in-app links. |
   | "One click to stop" | Stop asks for confirmation. Pause is one click. |
   | "Same figures in backtest and live" | The app shows model and broker figures separately on purpose. |
   | The "0 minutes" queue stat | Studies can wait when shared capacity is full. |

2. **Hierarchy is inverted.** The H1 is the audience label ("For hedge funds & institutional traders"). The value headline is already written in `solutions.json` and already on the OG card, but it never renders. The FAQ answers, stat and research link are written but never shown either, so security, broker, data, cost and compliance objections go unanswered.
3. **The four pages are near-identical.** The "Why they switch / Stop building infrastructure" header, eyebrows, closing eyebrow, layout and final poster are the same everywhere, and 4 of the 5 Teams chapters have a near-twin on Hedge Funds.
4. **The app is not ready to be photographed.**
   - There is no clean demo organisation and no capture mode.
   - The library is 1x, about 1,050 app commits stale, and full of real data.
   - The best proof surfaces were never captured: share links, the Export menu, version history, the order log, and the Fintelligent step ledger and Confirm card.

### 1.4 The app changed after the screenshot library was taken (verified 2026-11-17 on the app's `origin/main`)

The library (2026-09-11) and parts of the first audit pre-date three changes. The plan below is grounded on the current app.

- **trade/1 is the only way new organisations write strategies (since 2026-11-11).**
  - Strategies are Declarative and use the `fintela_trade` SDK.
  - Imports are limited to `fintela_trade`, `math`, `datetime`, `typing` and `functools` (`trade_strategy.py:73`). There is **no pandas or NumPy** in strategies.
  - Stops and exits live in the strategy. Each study has a **risk policy**.
  - Legacy risk managers and Derive do not run on trade/1 (`studies.json` `trade1.deriveUnavailable`).
- **New broker connections run on the sleeve engine.**
  - The operation card shows Value, Return, Add, Reduce, Pause, Stop and Force stop.
  - There is **no Rebalance button and no Orders tab**; orders show in the portfolio's Transactions.
- **Deflated and probabilistic Sharpe are hidden in the UI since 2026-10-10** (`featureFlags.ts` `sharpeProbabilityMetrics: false`). No crop or proof line may show them.
- **Smaller corrections:**
  - On the Skill vs luck card, the trial count sits in a tooltip; it is printed only in the interpretation line.
  - The Excel export carries parameters and trades.
  - Signed-in share recipients can open other tabs.

Every shot in section 5.3 is re-scouted on the current production build before the demo organisation is seeded (Phase 2).

**Consequence:** better images need app-side work first. Copy, claim and structure fixes can ship this week from the landing repo alone.

---

## 2. Strategy in one paragraph

Each page becomes **one promise, three or four proofs, and the objections answered**:

- The H1 becomes the outcome the buyer pays for; the audience label moves to an eyebrow.
- A per-audience "What changes" block of 3-4 pain-to-outcome rows replaces the shared table and the seat panel. Each row links to the chapter that proves it.
- Each chapter holds one idea: H3, one sentence, a mono proof line, and **one visual that shows the noun in the sentence**. Where no screen can show the idea, the chapter is text-only rather than decorative.
- The written FAQ finally renders, rewritten to the claims ledger.

Images come from a **fictional demo organisation**, captured **element by element at 2x** in a new **capture mode**, so every visual is legible, clean and safe for a public repo.

---

## 3. Communication strategy

### 3.1 Rules for all four pages

1. **Promise first, audience second.** H1 = `title` + `titleAccent` (already in `solutions.json`); the badge becomes the eyebrow.
2. **One idea per section.** A capability is stated at most twice per page: once in its "What changes" row, once in its chapter. Delete the seat panel, the chapter checklists, the shared "Stop building infrastructure" header and the stat blocks.
3. **Proof beside the claim.** Every chapter sentence names something its visual shows, and the mono proof line quotes a label that is readable in that visual ("Restore v3", "Pause · Stop", "Train · Validation · Out of sample").
4. **Pains in the buyer's words, outcomes in product nouns.** Keep the strongest legacy-column lines ("Results reconciled across machines before every meeting", "Studies queued behind a shared optimizer box").
5. **Numbers with context.** No performance figure without its trial count and held-out result. "Simulated" stays visible on report figures. Speed claims come only from real captures.
6. **State limits where the buyer meets them:**
   - trading claims name the controls (Pause, Stop all trading, trading limits), never the broker
   - "model choice on selected plans"
   - the free-tier limits next to "Start free trial"
7. **Define each product noun once**, e.g. "Fintelligent, the built-in assistant" and "risk policy, the limits a study sets for the whole portfolio". Advisors get no Python or library names outside the FAQ.
8. **The pages differ on purpose.** Each has its own pains, chapters, images, FAQ and closing. No image appears on two pages.
9. **Skimmable by construction.** H3 of 6 words or fewer; one sentence of 25 words or fewer; no chapter checklists; **about 340 visible words per page at most** (FAQ collapsed). The H1 plus the rows alone should tell the story.

### 3.2 New page template (shared)

| # | Section | Content | Replaces |
|---|---|---|---|
| 1 | Hero (ink) | Eyebrow (audience) · H1 promise · lead of 25 words or fewer · primary + secondary CTA · optional one-line third-party proof · Phase 3: a captioned real crop in a 5fr column | Badge-as-H1, stock photo |
| 2 | What changes (light) | Per-audience header + 3-4 rows, *pain → outcome*; each outcome links to `#chapter-<key>` and doubles as the page's table of contents | Shared "Why they switch" header, 6-row table, seat panel |
| 3 | Chapters (light, 3-4, never 5) | H3 · sentence · mono proof line · one captioned, badged visual · docs link; on mobile, text comes before the visual | 5 chapters with paragraph + 3-bullet checklist |
| 4 | FAQ | 4-5 objections for this audience, collapsed, `FAQList` + `faqPage` JSON-LD | Unrendered FAQ copy |
| 5 | From the research blog | One link (`registry.research`) | Not rendered |
| 6 | Closing | Per-audience eyebrow, title, body; the hero's CTA labels | Shared closing eyebrow |

Word budgets:

| Section | Budget (visible words) |
|---|---|
| Hero | 45 or fewer |
| What changes | 60 or fewer |
| Each chapter | 55 or fewer |
| Closing | 30 or fewer |
| FAQ | 4-5 items, answers of 50 words or fewer |

### 3.3 Per audience

| | Hedge funds | Quant teams | Independent quants | Financial advisors |
|---|---|---|---|---|
| **Buyer / gatekeeper** | PM or head of research; the CTO/infosec, compliance and the investment committee can veto | Head of research; 3-20 researchers use it; the investment committee sees only results | Solo quant who writes Python; self-serve, cost-sensitive | Non-coding principal; the chief compliance officer approves every figure a client sees |
| **H1** | Research at fund scale, *without the infrastructure.* | One library, one workspace, *one source of truth.* | Your Python strategy, *tested on data the search never saw.* (replaces "From notebook to live": "notebook" suggests hosted notebooks, and the Laboratory is off) | Systematic strategies, *without a research desk.* |
| **Lead** | Your desk runs studies side by side on cloud workers, and every result is tested on data the search never saw. | Every researcher builds in the same place, so the desk stops reconciling notebooks and starts comparing results on held-out data. | Write it in Python in the browser with Fintela's strategy SDK, then trade what holds up through your connected broker. Nothing to install. | Turn an investment idea into a tested strategy without writing code, then hand clients a report clearly marked Simulated. |
| **Primary CTA** | Book a walkthrough | Book a walkthrough | Start free trial (+ mono line: "Free: 2 studies of 250 trials. Trading on paid plans.") | Book a walkthrough |
| **Proof under CTAs** | Hedgeweek US Awards 2026 · New Solution Product of the Year | none | Free-tier limits | Hedgeweek (open question Q7) |
| **What changes rows** | Studies queued behind a shared optimizer box → studies side by side · A best backtest nobody can tell from luck → overfitting flagged before trading · Provenance rebuilt from notebooks → studies locked at launch · Ad-hoc scripts to trade → a live operation with Pause | Strategies scattered across notebooks → one shared library · Results reconciled before every meeting → one ranking across every study · Authorship and versions reconstructed by hand → dated versions, locked results · Committee decks assembled by hand → a report in one click | A local Python environment to maintain → Python in your browser · Optimization loops and validation set up by hand → built-in search, held-out windows · A great backtest you can't tell from luck → a luck check · Scripts to trade → trading through your broker | An idea that needs a developer → drafted for you to confirm · A backtest you can't defend → tested against luck first · One risk approach for every client → one strategy, several risk profiles · Summaries rebuilt by hand → reports in one click |
| **Chapters (3-4)** | 1. Overfitting flagged before it trades · 2. Every result traces back · 3. Risk rules carry into trading · 4. Controls your due diligence checks (text-only) | 1. Build on each other's work · 2. One ranking across every study · 3. Versions kept, results locked · 4. A committee report in one click | 1. Held out by default · 2. Skill, or the luckiest trial? · 3. Trade it through your broker | 1. Describe it. Review it. Confirm it. · 2. Skill or luck, checked first · 3. One strategy, different risk profiles · 4. You decide who sees it |
| **FAQ (4-5)** | Where our code runs and security · brokers and real money · data and bringing your own · what Fintelligent can and can't do · how to start | Who on the desk sees what (org-wide, isolated from other orgs) · code and data on our own servers · export · Fintelligent · seats | What the free trial includes · where code runs and which libraries · do I own my code · brokers and real money · what Fintelligent does | Can I show clients backtested results (facts, not legal advice) · do I need to code · which brokerage accounts · who is accountable for what the AI does · cost |
| **Research link** | Why quant teams are moving away from legacy tools | Why momentum works (or move the legacy-tools post here, Q8) | The backtest you didn't run is still costing you (deflated Sharpe) | Climate risk against agricultural stocks |
| **Closing** | "See it on your own strategies." | "See it with your team's strategies." | "Bring a strategy, leave with a study." | "See it with your own clients in mind." |
| **Vocabulary** | OOS, PBO, luck threshold (SR₀) are fine; no deflated Sharpe while the app hides it | Same | Same; show the real math | "Data it never saw", "luck", "risk profile"; no code terms |
| **Words** | 472 → about 350 | 444 → about 308 | 402 → about 331 | 531 → about 352 |

Why Fintelligent differs per page:
- **Advisors and independents:** it earns a chapter, because "you don't need to code" is their core objection.
- **Hedge funds and teams:** it moves to the FAQ, where the guardrails are stated as facts. Those buyers want control, not a demo.

---

## 4. Visual format strategy

### 4.1 Decision rules: pick the first that fits

1. **Static UI crop** (real app, demo organisation, one panel, 2x). This is the default. Use it when the noun in the sentence is a visible label in one panel. Avoid it when the panel needs more than about 700 CSS px of width, when the claim is about change over time, or when only real-org captures exist.
2. **Annotated crop** (crop + 1-2 HTML callouts). Use it when the proof is a small label in a necessarily busy panel. Never use more than two callouts, and never let a callout assert something the pixels don't show.
3. **Paired crops / two-state toggle.** Use it when the claim is a contrast the app itself renders (robust vs overfit). Never fake or retouch either state.
4. **Short loop recording** (real app, 6-10 s, muted, plays once at 35% visible, ends on a still, 1.5 MB or less). Use it **only** when the claim is about time and motion is the proof: three studies running at once, orders going Submitted → Filled. Never use it for static subjects (reports, lineage, settings).
5. **Coded static vignette** (app-faithful component, badged *Illustrative*). Phase 0 interim only. Never use a piece that shows invented options (LaunchToLive's fictional brokers) or a score without its trial count (ValidateStudy).
6. **Diagram** (schematic in the app's vocabulary, badged *Diagram*). Use it only for relationships with no screen: a study's risk policy as a separate layer, one strategy under two risk policies, a study locked to v3 while v4 is edited. Never draw a box the app lacks (no "client", "mandate" or "hash").
7. **Coded animation** (play-once FlatStage piece). Rare: only for a sequence no recording can show honestly, such as HeroLoop with "n of 1,000 trials" kept beside the verdict.
8. **Interactive** (visitor-driven, no autoplay, at most one per page). Use it only where a non-specialist must learn by comparing. Best fit: `ValidationCompare` on the Advisors validation chapter.
9. **Text-only** (H3 + sentence under an ink top rule). Use it for absences, policies and security facts: no API key, KMS-encrypted broker credentials, two-step login on money-moving actions, no broker access for the AI, free-tier limits, data coverage.

**Never on a solution page:**
- black-and-white stock hero photos
- the Unsplash agents poster
- full 1280 px frames at about 0.48x
- the 25-axis metrics radar and heat-map tables
- `platform-home.mp4` (real names, Momento branding)
- `Fintela Video Demo.mp4` as published footage (greeting "Hi Ivan", Spanish title, ends on an in-sample Sortino 5.83 with Overfit Risk)
- any frame from the real organisation

### 4.2 Section-by-section matrix

Legend: **Crop** = static UI crop · **Ann.** = annotated crop · **Pair** = paired crops / toggle · **Clip** = short loop · **Vign.** = coded vignette · **Diag.** = diagram · **Int.** = interactive · **Text** = text-only.

**Hedge funds**

| Section | Phase 0 (now, landing repo only) | Phase 3 (after demo-org capture) | Why |
|---|---|---|---|
| Hero | Text-only + Hedgeweek line | **Crop** S1: Studies list, 3 researchers' studies Running + 1 Completed (still; a clip would delay the largest paint) | Proves "fund scale" in the first screen |
| What changes | Text (rows as links) | Text | A contrast table needs no picture |
| Overfitting flagged | **Vign.** StationSurface "portfolios" (Illustrative) | **Ann.** S3: Parameter importance + overfitting divergence on overfit study B; callout on the top overfit driver; proof line "Trials scored N / N" | Fund quants know overfitting; they haven't seen a tool that names the parameter behind it |
| Every result traces back | Text, proof "Studies stay locked to the version they ran" | **Crop** FrozenUniversePanel (confirm it renders for a trade/1 study), "Runnable universe (frozen at launch) · N of M tickers runnable" | The app says "frozen at launch" in its own words; no hash implied |
| Risk rules carry into trading | Text-only, proof "Pause in one click · Stop all trading" (the StationSurface broker card is retired: it shows an account-level Pause and market buys, which the app does not have) | **Ann.** S15+S16: sleeve operation card (ACTIVE, Pause / Stop) + the portfolio's Transactions with Filled orders; environment and broker name cropped out | Control is the fund's question; the controls and the order record are both still |
| Controls your due diligence checks | **Text**: 3 items in TrustAnchors grammar (KMS-encrypted credentials · two-step login to move money, never to Pause or Stop · no broker access for the AI) | Text | Policies and absences have no honest screen |
| FAQ, research, closing | Text | Text | n/a |

**Quant teams**

| Section | Phase 0 | Phase 3 | Why |
|---|---|---|---|
| Hero | Text-only | **Ann.** S6: Library › Strategies with the tab row and the Author column, 3 authors | "One library" literally |
| Build on each other's work | Text | **Ann.** S6b: Strategy view, Summary tab with Author · Version · Created · Last edited | The app built this window as the "check before reusing" view |
| One ranking across every study | Text | **Ann.** S4a: Portfolios dashboard, Study = All studies, Rank by = OOS | The pain is comparing numbers from many machines |
| Versions kept, results locked | **Diag.** "Study launched on v3 · strategy now at v4" (badged Diagram) | **Ann.** S8: VersionHistoryPanel, diff + "Restore v3"; the diagram stays until the app shows the pinned version (A7) | The list, the diff and Restore are the claim; the pin has no screen yet |
| A committee report in one click | Text | **Ann.** S11e: report masthead with the Export menu open (PDF · Word · Excel) | The menu names the three formats verbatim |
| FAQ | Text | Text | "Who sees what" answered honestly: org-wide, isolated from other orgs |

**Independent quants**

| Section | Phase 0 | Phase 3 | Why |
|---|---|---|---|
| Hero | Text-only + free-tier line | **Ann.** S9a: the trade/1 strategy editor, `momentum_top_n` with a typed signature such as `lookback: Int[20, 252] = 126`; callout "Arguments become the search space" (alternative: HeroLoop badged Illustrative) | Literal proof of "your Python strategy"; code needs reading time, so it stays still |
| Held out by default | **Vign.** StationSurface "studies" (Illustrative) | **Ann.** S2: Study summary, Timeframe card Train / Validation / Out of sample + Trials N / N + TPE; callout "Search tunes on Train only" | The configuration is printed on one panel |
| Skill, or the luckiest trial? | **Vign.** StationSurface "portfolios" with the "1,000 trials" chip (Illustrative) | **Ann.** The study Robustness scorecard for overfit study B: PBO, "Luck threshold (SR₀)", "of N trials" printed on the tiles | This buyer wants the real math; the tiles print the trial count, while the Skill vs luck card hides it in a tooltip. A different surface from the advisors pair. |
| Trade it through your broker | Text-only, proof "Trading limits · Stop all trading" | **Ann.** S17: Integrations › Broker connections, cropped to trading limits and Stop all trading, with the provider name, logo and environment column left out | Answers limits and a way out in one panel without naming the broker |
| FAQ | Text | Text | Free tier, code location, ownership (terms of use: "User Code remains the exclusive property of the User") |

**Financial advisors**

| Section | Phase 0 | Phase 3 | Why |
|---|---|---|---|
| Hero | Text-only | **Ann.** S11a: report masthead "Prepared by Fintela Demo" + Simulated chip | One header proves "client-ready", "labelled Simulated" and "under your name" |
| Describe it. Review it. Confirm it. | **Vign.** `agenticParts` ConfirmCard, "Create strategy quality_momentum_monthly", strings matching the app's Confirm card (Illustrative) | **Ann.** S18: Fintelligent step ledger + ConfirmActionCard ("Nothing is saved until you confirm"). Clip optional. | A non-coder must see the input and the gate together |
| Skill or luck, checked first | **Int.** `ValidationCompare` (built, unmounted): Trial 412 of 1,000 overfit vs Trial 287 of 1,000 well trained (Illustrative; remove its deflated-Sharpe values) | **Pair** S5: Skill vs luck verdict and its interpretation line ("Across N strategies tried") for study A's Well Trained trial beside its Overfit Risk best in-sample trial | The page's core argument for a non-quant; a pass next to a fail |
| One strategy, different risk profiles | **Diag.** one strategy → two studies under different risk policies → two portfolio groups (badged Diagram). First verify that a trade/1 risk policy can differ per study and that both groups can trade; if not, this chapter becomes text-only or moves to the FAQ. | Diagram (until a risk-profile label exists in the app, A17) | No screen shows it, and there is no client object to photograph |
| You decide who sees it | Text | **Ann.** S13: ShareLinkDialog, restricted to one named client, "Opened 2 times · Revoke" (plus S14 exported PDF page 1) | Compliance asks who can open it and what is on it |
| FAQ | Text | Text | Backtested results, coding, accounts, AI accountability, cost |

Net change per page: 5 decorative or misleading visuals become 3-4 visuals, each proving its sentence. On every page:
- 1-2 chapters stay **intentionally text-only**.
- At most **one** clip (fund and team concurrency) or interactive (advisors).

---

## 5. Imagery strategy

### 5.1 Sourcing, in order

1. **New element-level captures from a demo organisation.** This is the only source allowed into the public repo.
2. **The private library is a scouting map only.** Use its coordinates to plan shots; never copy a file. Useful planning areas:
   - 07e importances + divergence
   - 03c lineage
   - 11i operation row
   - 16b broker row
   - 07k Skill vs luck
   - 07f report masthead
   - 02d split bar
3. **Existing landing assets:**
   - **Keep as labelled interims:** `agenticParts` ConfirmCard, `ValidationCompare`, the StationSurface cards, HeroLoop.
   - **Retire:** all 11 chapter stills, the 4 stock hero photos and the agents poster.
4. **`Fintela Video Demo.mp4` is a storyboard only**, for a new light-theme demo-org recording of the Fintelligent flow.
5. **No stock or AI-generated imagery for any product claim.** Diagrams only for claims with no screen.

### 5.2 Demo organisation (fictional, English only)

- **Organisation.**
  - "Fintela Demo", with a monogram, so reports read "Prepared by Fintela Demo".
  - Three members with display names and `@example.com` emails, in the roles Owner, Admin and Manager, each authoring some items.
- **Registries.**
  - Asset groups: `sp500_quality_40`, `sector_etfs_us`, `crypto_majors`.
  - Strategies: `momentum_top_n`, `quality_momentum_vt`, `sector_rotation`, `mean_reversion_rsi`, written as trade/1 (Declarative) strategies with English comments and typed parameter ranges, and each saved 3 or more times with version notes.
  - Objectives: `rolling_sharpe`, `sortino_dd_composite`.
  - Risk policies: a conservative one and a growth one; confirm their fields in the re-scout pass.
- **Studies.**
  - A, robust: TPE, 1,000 trials, PBO 50% or less, launched on v3 of `quality_momentum_vt`. It has a Well Trained chosen trial plus an Overfit Risk best in-sample trial, which gives advisors their pair.
  - B, overfit: a wide search whose best trial is Overfit Risk (hedge funds and independents).
  - C, D, E: launched by three members at the same moment.
  - P1, P2: the same strategy run as two studies under the conservative and growth risk policies (advisors diagram, if verified).
- **Trading.**
  - Two portfolio groups.
  - A paper-environment broker connection named "Demo account", with limits set and the kill switch armed. Demo data never trades real money, so every crop leaves out the provider name, logo and environment label.
  - One ACTIVE sleeve operation per group, run for 5-10 trading days so the portfolio's Transactions show 10+ Filled orders, including one exit, and a broker P&L "as of" date.
  - One DRAFT operation.
- **Reporting.**
  - Study A's trial report: consistent headline (after A3), Simulated chip, disclaimer.
  - The Export menu captured open, and page 1 of the exported PDF saved.
  - A restricted link to `committee@example.com` plus a public link, with the recipient page captured signed out.
- **Fintelligent.** A scripted English conversation: describe a monthly quality-momentum strategy, then the step ledger, the Confirm card, the study design, Confirm again, and the run tracker. One "Why is this trial flagged Overfit Risk?" answer with in-app links. Only models enabled in production.
- **Hygiene.**
  - No pending notifications.
  - No test, joke or hex names.
  - No CVaR above 100%.
  - Nothing retouched: every number is real app output, on fictional names.

### 5.3 Capture spec

- **Build and mode.** Production build (or staging pinned to the production commit) with production flags, capture mode on (`?ff_captureMode=1`) and the light theme. Never capture a feature that is off in production.
- **Tool.** The existing Playwright/CDP harness, `deviceScaleFactor: 2`, a 1440x900 viewport, network idle, no spinners, cursor hidden.
- **Element-level, not page-level.** Screenshot the panel's own locator, keeping its title and 16-24 px of app ground. No sidebar or top bar unless navigation is the point.
- **Sizes.**
  - Desktop: a source region 520-700 CSS px wide, so 13 px app text displays at 11 px or more; ratio 4:3 or 16:10.
  - Mobile: an art-directed crop of 400 CSS px or less on the same focal element; ratio 4:3 or 1:1.
  - Hero: 560 CSS px or less, 16:10.
- **Clips.** 6-10 s, real time, region of 700 CSS px or less, 1.5 MB or less via `scripts/encode-media.sh`. The poster is the final frame.
- **Shot list:**

| Shot | What to capture |
|---|---|
| S1 | Studies list with 3 Running rows (clip and still) |
| S2 | Study summary tiles + Timeframe card |
| S3 | Parameter importance + overfitting divergence |
| S4 | Portfolios dashboard comparison strip |
| S5 | Skill vs luck verdict + interpretation line, study A's two trials (no deflated Sharpe gauge: hidden in production) |
| S6 | Library › Strategies with the Author column |
| S7 | Lineage |
| S8 | VersionHistoryPanel with diff and Restore |
| S9 | trade/1 strategy editor with a typed signature |
| S10 | Study risk policy |
| S11 | Report masthead with the Export menu open |
| S12 | Growth vs benchmark with the train / validation / out-of-sample bands and the Simulated disclaimer |
| S13 | ShareLinkDialog (restricted) + recipient page |
| S14 | Exported PDF page 1 |
| S15 | Sleeve operation card (ACTIVE, Pause / Stop) |
| S16 | Portfolio Transactions with Filled orders (still and clip) |
| S17 | Broker connections with Stop all trading |
| S18 | Step ledger + ConfirmActionCard |
| S19 | A Fintelligent answer with in-app links |

- **Record per file:** route, selector, app commit SHA, capture date, demo ids, claim ids.

### 5.4 Selection checklist: a file ships only if every answer is yes

1. **Shows the claim.** The noun in the H3 or sentence is a visible label in the image.
2. **One panel, one idea.** The focal element fills at least half the frame.
3. **Legible.** The smallest meaningful text is at least 11 px at 1440 and at least 10 px at 390, or a callout carries it. Captured at 2x.
4. **Demo organisation only.** No real person, firm, email or handle; English; no test or hex names.
5. **Clean chrome.** No cursor, badge, Fintelligent pill, tooltip, spinner or half-cut row.
6. **Honest numbers.** Unretouched and consistent; every score shows its trial count and held-out result; "Simulated" visible on report figures.
7. **Shipped and reachable.** The feature is on in production for this audience's plan; a plan-gated feature says so in the caption.
8. **Matches the claims ledger.** The image implies nothing the ledger drops: no real money, no client object, no hash.
9. **Unique.** Not used on another page or in another chapter.
10. **Current.** Less than 90 days old, or no component in its manifest entry has changed since capture.
11. **Documented.** It has a manifest entry plus a caption, badge and alt text.
12. **Survives mobile.** An art-directed mobile crop exists, or the desktop crop reads at 342 px with its callout.

### 5.5 Integration in the template

- **Chapter order.** H3 → sentence → mono proof line (16 px accent dash, as in HowItWorks) → visual in `MediaPlate` **with caption and badge** → docs link. `SolutionChapters` never passes `caption` today.
- **Caption format.** `<Screen> · <what to look at>`, 12 words or fewer. Example: "Study summary · every trial scored on train, validation and out-of-sample".
- **Badges.** `App · demo data` / `Illustrative · fictional data` / `Diagram`.
- **Callouts.** A new `src/components/primitives/Callout.tsx`: a numbered dot plus a label of 5 words or fewer, positioned in %. At most 2, mirrored in visually hidden text.
- **Alt text.** What is visible plus why it matters, 25 words or fewer, never an i18n key.
- **Registry.** `ChapterMedia` becomes:
  - `still {src, srcMobile, ratio, badge, callouts}`
  - `clip {video}`
  - `component {id}`
  - `none`

  Add `claims: string[]` per chapter. Drop the unused `chapter` field. `MediaWell` gets `srcMobile` as a `<source media="(max-width: 599px)">`.
- **Rule.** One image, one claim, one page.

### 5.6 Governance

- **Public-repo rule.** Only demo-organisation files enter `src/assets/media/solutions/`, each listed in a manifest.
- **Clean-up now.** Delete the 11 real-org stills from HEAD and invalidate them on the CDN. Rewriting git history is your call (Q9).
- **CI checks:**
  - `check-solution-claims.mjs`: a denylist (`cryptograph|hashed|private by default|cross-organi[sz]ation|laboratory|real[- ]time p&l|with sources|thousands of trials in parallel|not in a queue|one click to (pause or )?stop|same figures|full audit trail|...`).
  - `check-solution-media.mjs`: every chapter has caption, alt, badge and claims; no file is used by two audiences; every still is in the manifest; a warning at 120 days.
  - An extension to `check-media.mjs` that resolves alt keys, and a `dist/` check that fails on alt text matching an i18n key pattern.
- **Refresh.**
  - Monthly: list app commits that touch each still's components.
  - Recapture on change, and at least quarterly.
  - Re-verify state-dependent claims (real money, model choice, Laboratory, share links) on every release that changes them.

---

## 6. Claims policy

The ledger lives in this folder. Every chapter's `claims[]` points to a verified entry. Remove a contradicted claim from every surface at once: page copy, SEO description, FAQ and OG card.

| Claim today | Decision | Safe wording |
|---|---|---|
| Cryptographically hashed history (16 places) | **Drop** | Every saved change to a strategy is kept as a dated version, and every study stays locked to the version it ran. |
| Private by default, share selectively | **Drop** | Everything your team builds is shared across your organisation and isolated from every other one. To show results outside the team, share a portfolio's report by link, open or limited to named people. |
| Cross-organisation publishing | **Drop** | n/a |
| Python in the Laboratory / NumPy, pandas, scikit-learn preinstalled | **Reword** | Write strategies in Python in the browser with Fintela's trade/1 SDK: one function declares entries, exits and sizing, and its signature sets each parameter's search range. Nothing to install. The FAQ answers "which libraries" exactly: `fintela_trade`, `math`, `datetime`, `typing` and `functools`. |
| "0 minutes" queue wait | **Drop** | n/a |
| Studies in parallel, not in a queue | **Reword** | Every quant can launch studies side by side; each runs on its own cloud workers instead of waiting behind a colleague's run on a shared optimizer box. |
| Thousands of trials in parallel | **Reword** | Thousands of trials per study, run in parallel batches across cloud workers. |
| Bayesian search | **Reword** | Bayesian search (TPE) by default… Caption only a TPE study as "Bayesian". |
| Real-time order log and P&L | **Split** | Order statuses update in near real time as your broker reports fills; P&L arrives daily from your broker's end-of-day records. |
| One click to pause or stop | **Reword** | Pause in one click; Stop asks for one confirmation. Re-check both on the sleeve card. |
| From study to live / your brokerage | **Keep, broker unnamed** | Deploy a validated portfolio group to your connected brokerage account and run it as a live operation with real money. Never name the broker on a public page. |
| Security certifications (SOC 2, ISO 27001, SSO) | **Never mention** | None. Do not say there are none either. Security copy states only facts that exist: KMS-encrypted broker credentials, two-step login on money-moving actions, no broker access for the AI. |
| Risk managers attach to any strategy | **Reword** | Stops and exits live in the strategy; a study's risk policy sets limits for the whole portfolio. |
| Same figures in backtest and live | **Drop** | If needed: backtest and live side by side, with live figures from your broker's own records. |
| A risk manager per client mandate | **Reword** | One strategy run as separate studies under different risk policies, each deployed as its own portfolio group, one per risk profile. No client accounts implied; verify before shipping. |
| Results-only dashboards | **Reword** | Share any portfolio's report by link, open to anyone or limited to the people you name, and revoke it at any time. Do not say parameters never appear: signed-in recipients can open other tabs. Ships once the docs cover share links (A5). |
| PDF reports with parameter importance and trade log | **Reword** | A one-click investment report: growth against a benchmark with the train, validation and out-of-sample periods marked, drawdowns, monthly returns, traded assets; PDF, Word or Excel. The Excel workbook also carries parameters and trades, so never say parameters stay hidden. |
| Deflated or probabilistic Sharpe in copy or crops | **Drop for now** | The app hides both since 2026-10-10. Use the luck threshold (SR₀), PBO and the verdicts; blog posts may still discuss them. |
| "Any broker" (pricing page, `pages.json` lines 47, 73, 146, 202 and 1275, the last being the meta description) | **Reword** | Your connected brokerage account. |
| Where Fintelligent sends data (missing) | **Add to the FAQ; verify against the privacy notice** | Fintelligent sends your prompts and the strategies it works on to the AI providers listed in our privacy notice; broker data never reaches the model. |
| Full audit trail | **Reword** | A dated record of every strategy change and every live order, kept with the portfolio. |
| Authorship survives staff changes | **Reword** | Strategies, versions and results stay in the organisation's registries when someone leaves. |
| Choose your AI provider | **Reword** | Fintelligent runs on AI access Fintela manages, so there's no API key to bring; model choice is available on selected plans. |
| Explanations "with sources" | **Reword** | Explains any study or result in plain language and links you to the study, trial or portfolio it is about. |
| Every irreversible action waits for confirmation | **Keep, made precise** | Nothing is saved, launched or resumed until you click Confirm, and Fintelligent cannot delete anything or touch your broker. |
| Global market data | **Reword** | Daily market data for US equities and ETFs, crypto and forex; external strategies run on your own servers. |
| Signal export | **Reword** | On a paid plan, download any trial's rebalancing signal as JSON or CSV. |
| Free tier description | **Reword** | Start free: a one-time token grant for up to two strategies, asset groups and studies (up to 250 trials each) with the TPE optimizer. Paid plans lift the limits and unlock trading through your broker. |

**Verified, use freely:**
- train/validation/out-of-sample windows on every study
- parameter importance with the overfitting contrast
- the Skill vs luck card, PBO and the verdicts (deflated Sharpe is hidden in the app)
- the investment report with PDF, Word and Excel export
- share links: restricted or public, revocable
- version history with diff and restore
- lineage and shared registries
- the Fintelligent step ledger and Confirm card
- Pause, Stop and Stop all trading (Rebalance exists only on legacy connections)

---

## 7. App improvements that unblock these pages

| # | Priority | Effort | Item | Unblocks |
|---|---|---|---|---|
| A1 | P0 | S | **Capture mode** flag `?ff_captureMode=1`: hides the Fintelligent pill, notification badge, greeting name and avatar, tooltips and skeletons | Every still on all four pages |
| A2 | P0 | L | **Seed and run the demo organisation** (section 5.2) | Every chapter; replaces all real-org frames |
| A3 | P0 | S | **Fix the report headline**: "Growth of $100,000" uses the out-of-sample return while the benchmark uses the full window. Compute both on one window and label it (`InvestorProfileView.tsx` HEADLINE_STAGES vs benchStats) | Teams report, advisors hero and report |
| A4 | P0 | S | **Fintelligent capture readiness**: token counters hidden, English titles, light theme, production models only | The Fintelligent chapter (advisors), the FAQ elsewhere |
| A5 | P0 | S | **Docs alignment**: document share links; mark the Laboratory unavailable; reconcile model-choice and in-app-link lines in `fintelligent.md` | Sharing, Laboratory and AI claims; docs links |
| A6 | P1 | S | Author **display names** (not emails or handles) in Author columns, drawers and ProvenanceStrip; "Former member" consistently | Teams library, funds provenance |
| A7 | P1 | M | **Show the pinned strategy version** on the study header, trial and report ("momentum_top_n v3") | Turns the "locked to the version it ran" diagram into a screen |
| A8 | P1 | M | **Sleeve operation card**: check that it names the group and connection, and add the last order status and daily P&L "as of" if forward orders only appear in Transactions | Funds trading chapter |
| A8b | P1 | M | **trade/1 surfaces**: show the study's risk policy in Lineage and the study header; add docs for Declarative authoring and risk policies | Funds provenance, advisors risk chapter, every Python claim |
| A9 | P1 | S | **Trial-count consistency** (5,020 vs 5,100); fix "Desired status STOPPED" on completed studies | Every overfitting visual (trial-count rule) |
| A10 | P1 | M | **Rendering polish** on cropped views: mid-word KPI breaks, unrounded floats, truncated parameter names, legend overprint | Research chapters |
| A11 | P1 | S | **Studies list crop preset**: Name, Author, Progress and Status fit in about 700 px | Hedge funds hero, concurrency clip |
| A12 | P1 | M | **Report summary consistent with its own risk flags** (no "holds up well" beside an elevated PBO) | Advisors and teams reports |
| A13 | P1 | S | **Real money is open to every customer (decided 2026-11-17).** Update the docs and the home FAQ `liveTrading` to say so, without naming the broker | Every trading line on all four pages |
| A14 | P2 | S | Broker connections: kill switch and buying-power check as labelled states (Armed / Off) | Independents trading chapter |
| A15 | P2 | S | Decide model choice (selected plans vs all paid plans) | AI copy, home FAQ |
| A16 | P2 | M | Optional: a per-version SHA-256 fingerprint in VersionHistoryPanel, the only way "hashed" could return | Funds governance |
| A17 | P2 | L | Advisor **risk-profile concept**: a label on portfolio groups, or per-client sub-accounts | Advisors risk chapter (diagram to screen) |
| A18 | P2 | M | A read-only "what each role can do" panel in members settings | Funds and teams permission FAQ |
| A19 | P2 | S | The Export menu on the portfolio-group Profile too | Funds committee reporting |
| A20 | P2 | M | **Metric sanity**: CVaR 95 at 128-136%, duplicated trials | Any future metrics crop |

---

## 8. Sequencing

| Phase | Scope | Depends on | Effort | Done when (yes/no) |
|---|---|---|---|---|
| **0. Honest quick wins** (landing repo only) | See below | Nothing | About 5 dev days + 2 copy days | Claims check passes · each H1 equals title + titleAccent · no stock, poster or real-org frame renders or remains in `src/assets/media/solutions/` · no alt text is an i18n key · 340 or fewer visible words per page, no claim more than twice · 4-5 FAQ items + JSON-LD per page · every chapter visual has a caption and badge |
| **1. App capture readiness** (app repo + docs) | P0 items A1, A3, A4, A5; P1 items A6-A12; docs update A13 | Nothing (parallel with phase 0) | 1.5-2 weeks for one front-end developer + 1 docs day + 1 product meeting | A capture-mode screenshot shows no pill, badge or first name · report headline and benchmark use one window · docs describe share links · the docs say real money is open, with no broker named |
| **2. Demo organisation** | One-day re-scout of the current production build in a throwaway org (which S-shots exist for trade/1 content and a sleeve connection), then section 5.2 | A1 in production | 3-4 days of setup + 5-10 trading days of calendar time | Study A Well Trained with 3+ families · study B Overfit Risk · 3 Running at once · 10+ Filled orders with 1 exit · restricted link opens signed out · PDF saved · English conversation ends at Confirm · OCR pass finds no PII |
| **3. Capture, select, integrate** | S1-S19 at 2x with desktop and mobile crops; checklist; manifest; template kinds (`still` / `clip` / `component` / `none`), Callout, `srcMobile`; swap interims for captures | Phases 0, 1, 2 | About 1.5 weeks | Every hero and chapter visual passes all 12 checklist items at 1440 and 390 px |
| **4. Governance automation** | Media check, manifest staleness job, OCR denylist | Phase 3 | About 2 dev days | CI fails on a duplicated or undocumented still |
| **5. Product decisions + P2 features** | A14-A20 | Phase 3 | Decisions: 1-2 meetings; features: scheduled by priority | Each decision recorded in the ledger and reflected in copy within one release |

Phase 0 scope, in order:
1. Claims sweep across copy, SEO description, OG inputs and FAQ.
2. H1 = promise, badge as eyebrow, stock heroes removed.
3. Per-audience "What changes" rows replace the table and seat panel.
4. New chapter anatomy, capped at 4 chapters, on the light ground.
5. Real-org stills deleted from HEAD and the CDN.
6. Badged interims: ConfirmCard instead of the poster, ValidationCompare on advisors, and StationSurface cards on the research chapters only. Trading chapters and everything else are text-only.
7. FAQ and research link rendered.
8. Unified CTA labels and a per-audience closing.
9. CI checks for the claims denylist and raw-key alt text.

Phase 0 alone answers both of your findings: no unrelated image remains, and each page drops by 18-34% in words, with no claim stated more than twice. Phases 1-3 then replace the interims with real, legible product proof.

Phase 0 files:
- `src/pages/SolutionPage.tsx`: hero, why section, FAQ, closing
- `src/components/solutions/SolutionChapters.tsx`: chapter anatomy
- `src/components/solutions/AdvantagePanels.tsx`: delete SeatPanel; rows become links; cool-neutral fill instead of `soft.wash`; remove `mt:'auto'` at line 159
- `src/solutions/registry.ts`: 4 chapters per audience; media kinds; docs links (advisors risk chapter → `/docs/risk-managers`); "three seats" comment
- `src/media/registry.ts`: delete `STILLS.chapters`, `STILLS.heroPlate` and the agents poster
- `src/media/README.md`: provenance
- `src/i18n/locales/en/solutions.json`: all copy
- `scripts/og/render.mjs` inputs: the Independents title changes
- New: `src/components/primitives/Callout.tsx`, `scripts/check-solution-claims.mjs`, `scripts/check-solution-media.mjs`

---

## 9. Open decisions

Q1-Q4 were answered on 2026-11-17, so Phase 0 can start. The rest have recommended defaults.

1. **Q1. Real money. Decided: open to every customer.** Trading lines say "live" with real money. There is no "paper trading today" caveat.
2. **Q2. Naming the broker. Decided: never on a public page.** Copy says "your connected brokerage account", and crops leave out the provider name and logo. This matches `live-trading.md:84`.
3. **Q3. Showing a failing study as proof. Decided: yes.** Hedge Funds and Independents use overfit demo study B; Advisors shows the pass/fail pair.
4. **Q4. Security certifications. Decided: never mention them**, not even their absence. The hedge-funds security chapter and FAQ state only facts: KMS-encrypted credentials, two-step login on money-moving actions, no broker access for the AI.
5. **Q5. Advisor client-sharing friction.** A restricted link requires the client to sign in with a verified account. *Default: lead the advisors reporting chapter with PDF export; add a no-account restricted view as a P2.*
6. **Q6. "Can I show clients backtested results?"** Who approves this answer (counsel, compliance, nobody)? *Default: ship it as facts with "Marketing rules remain yours to apply", after one compliance read.*
7. **Q7. Hedgeweek on the advisors page.** It is a hedge-fund trade award. *Default: hedge funds only.*
8. **Q8. Teams research link.** Move "Why quant teams are moving away from legacy tools" from hedge funds to teams? *Default: no. It stays on hedge funds, and its footer must first lose a staff email address and the unbacked "in active use at hedge funds" line.*
9. **Q9. Git history.** The real-org stills are already in public commits. *Default: delete them from HEAD, purge the CDN, and leave history alone unless legal asks.*
10. **Q10. Seats and billing.** The pricing page sells Institutional per seat with a 2-seat minimum; `tokens-and-billing.md` says there are no seats or monthly tiers; and `plan_tier_gate` ships "off". *Default: no prices on the solution pages; link to Pricing until the two sources agree.*
11. **Q11. Audience label.** Rename "independent quants & traders" to "independent quants & systematic traders"? *Default: yes. It filters out discretionary traders the page doesn't serve.*
12. **Q12. Advisor risk-profile concept (A17).** Schedule it, or keep the diagram indefinitely? *Default: keep the diagram; revisit after Phase 3.*
