# Homepage redesign plan

Companion to `docs/redesign/AUDIT.md`. Planning only: nothing here has been implemented. Implementation starts in a later session, after you approve this plan and answer the open decisions.

Conventions used below:

- Effort: S is up to half a day, M is one to two days, L is three to five days.
- "Acceptance" is a single yes-or-no check.
- `[unverified]` marks a claim or fact that the repo could not confirm.
- `[proposed]` marks copy that is not in your brief and that I wrote to fill a gap.
- Spanish and Portuguese strings are my translations and need a native review before they ship.

## 1. Summary

- The homepage goes from 8 bands and 11 content blocks to six sections. Nothing technical is deleted: the five-station pipeline moves to a new product page, the 40-second demo stays on `/product/agentic-ai`, and four FAQs stay on the solution pages.
- Phase A fixes credibility first and ships on the current design: one headline that says what the product does, two CTA labels, no rotating word, no marquee, no "Best Sharpe 1.84", five rewritten FAQs, and claims wording that matches the docs.
- Four claims in your brief cannot ship as written: "reproducible research" (the docs say the default search is not reproducible), "Bayesian search with seven samplers" (two of seven are Bayesian), "runs in Fintela's cloud" (third-party AI providers process the prompts) and unqualified "tenant isolation". Each has a recommended replacement below.
- There is no measurement baseline today. I recommend adding five named events before any visible change, otherwise the before-and-after comparison you asked for is not possible.
- Three new pages are needed for the target to be complete: a pipeline product page, a methodology page and a security page. The security page needs facts from you that are not in the repo.

## 2. Open decisions

Each has a recommended default. Phase A can start once Q1 to Q6 are answered.

### Q1. Headline

- Options: "Quant research infrastructure your AI can operate." / "The infrastructure behind systematic investing." / "Your AI builds the strategy. Fintela shows whether the backtest holds up."
- Recommended default: the first. It states the category and the differentiator, and every word is supported by the docs.
- Caution on the third: "your AI builds the strategy" leans toward the positioning you ruled out (an AI that generates strategies).

### Q2. Subhead length

- Your structure calls for a one-sentence subhead; your default copy is three sentences.
- Recommended default: keep the three-sentence default on desktop. It is 39 words and each sentence carries one idea.
- One-sentence alternate `[proposed]`: "Build a strategy, optimize it across thousands of trials and test it on data it has never seen, with the built-in assistant or your own agent."

### Q3. CTA labels

- Recommended default: "Start free trial" (primary) and "Book a walkthrough" (secondary), in sentence case, everywhere. Swap the order on `/solutions/hedge-funds` and `/solutions/quant-teams`; the code already supports this (`src/solutions/registry.ts:61-62`).
- "Start free trial" is supported: the docs describe a per-person free trial allowance (`content/docs/features/tokens-and-billing.md:40`). Marketing copy also says "free tier" (`src/i18n/locales/en/solutions.json:424`); pick one term. Recommended: "free trial" in buttons, "Free tier" only as the plan name.
- Alternates you listed: "Explore the platform" / "Book an institutional demo". Not recommended as defaults: "Explore the platform" is not an action with an outcome, and Spanish and Portuguese already translate "walkthrough" as "demonstration".
- Sub-decision: should the three plan buttons on `/pricing` ("Get started", `src/i18n/locales/en/pages.json:79`) also become "Start free trial"? Recommended: yes, if choosing a paid plan still starts with the trial. `[unverified]` The sign-up flow lives in the app, not this repo.

### Q4. Primary audience

- Evidence is mixed. The award copy and audience headline address hedge funds and quant teams (`src/i18n/locales/en/home.json:30`, `src/i18n/locales/en/home.json:576-577`), but the card row leads with independent quants (`src/components/sections/InstitutionalSection.tsx:25-26`) and the primary button is self-serve.
- Recommended default: write for professional quants at funds and research teams, keep the self-serve trial as the homepage primary action, and order the "Who it's for" row as hedge funds, quant teams, independent quants, financial advisors.

### Q5. Unverified claims

Recommended defaults, all detailed in the audit's "Claims verification":

- "Reproducible research": replace with "Every trial on record". Reproducibility is contradicted by `content/docs/configuration/sampler-selection.md:303-312`.
- "Bayesian search with seven samplers": replace with "Seven search algorithms, Bayesian by default." (`content/docs/configuration/sampler-selection.md:13-16`).
- "Runs in Fintela's cloud": replace with "Runs inside Fintela, managed for you, with the AI provider you choose." (`content/docs/ai/fintelligent.md:25`, `content/legal/privacy-notice.md:29`).
- "Strategy stays on your servers": keep, but only next to MCP and external mode, where it is true (`content/docs/getting-started/architecture.md:152-158`).
- "Tenant isolation": use "data scoped to your organization" (`content/docs/getting-started/architecture.md:176-179`). Do not name certifications.
- "Point-in-time data snapshots": use only as "point-in-time index membership" (`content/docs/registries/asset-groups.md:303-316`), and only on the methodology page.
- "Regime analysis": do not claim. It is not a feature.
- "Cryptographically hashed and time stamped": remove from the homepage until you confirm it. It is asserted in copy (`src/i18n/locales/en/home.json:555`) but absent from `content/docs/`. If true, it belongs on the security page with a sentence on what is hashed.
- CMA-ES, transaction costs, risk limits, MCP clients (Claude Code and claude.ai only), overfitting report contents: confirmed and usable.

### Q6. The two client logos

- Momento Capital is both a logo under "Teams building with Fintela" and the legal entity that operates Fintela (`src/components/sections/TrustBar.tsx:11`, `src/seo/site.ts:56`).
- Recommended default: show it only if it is an independent user you have permission to name. Otherwise show EdgeBridge Capital alone, or replace the logo row with the award band until you have two independent logos.
- Also needed from you: transparent or vector versions of the logos. The current files are opaque and rely on a blend mode tied to the grey canvas (`src/components/sections/TrustBar.tsx:143-151`).

### Q7. Customer quote

- None exists in the repo. Recommended default: ship without one. Do not write a placeholder. If you obtain one, it goes in section 2 under the award band.

### Q8. Measure before changing anything

- Recommended default: yes. Ship task A0 (named events on today's page) and let it run for two weeks before the rest of Phase A. Without it there is no "before".
- If speed matters more than a clean comparison, ship A0 in the same release as Phase A and accept a weaker baseline from Clarity's heatmaps. `[unverified]` Heatmap retention depends on your Clarity settings.

### Q9. Re-skin scope

- The buttons, panels and section shell are shared by every page (`src/theme/neu.ts:150`, `src/components/primitives/Section.tsx:49`). The neumorphic look also cannot survive a near-white canvas (`src/theme/tokens.ts:91-98`).
- Option 1: change tokens site-wide in Phase B. Consistent everywhere, but all 16 static routes plus docs and blog need a visual check.
- Option 2: homepage-only variant first. Smaller release, but the homepage and every other page will look like two different sites until the rest follows.
- Recommended default: option 1, behind one pull request with screenshots of every static route.

### Q10. Dark product previews

- The current mock-ups copy the app's own light theme on purpose (`src/components/assemblyLine/Surfaces.tsx:10-16`). `[unverified]` Whether the app has a dark theme is not knowable from this repo.
- Recommended default: use a dark frame for schematic visuals (code, curves, verdicts) that are clearly diagrams, and do not recolour app screens to a theme the product may not have.

### Q11. Accent colour

- Recommended default: the mark's red. `#f1353c` for rules, dots and large display accents (about 3.75:1 on `#FAF9F6`, computed), and the existing `redDeep` `#c62828` wherever the accent carries body-size text (about 5.3:1, computed) (`src/theme/tokens.ts:35-36`).
- Alternative: the mark's yellow, which only works as a fill behind dark text.

### Q12. Route names

- Recommended defaults: `/product/platform` for the pipeline page, `/methodology` and `/security` for the trust pages.

### Q13. Spanish and Portuguese register

- Spanish mixes formal and informal address on one page (`src/i18n/locales/es/home.json:10`, `src/i18n/locales/es/home.json:1162`).
- Recommended default: informal ("tú") in Spanish and "você" in Portuguese, matching the majority of existing copy. The copy deck below follows that.

## 3. Target architecture

### Section map

1. Hero
   - Modify: `HeroDiorama` (`src/components/sections/HeroDiorama.tsx:21`), two columns from `md` up, copy left, product loop right.
   - Reuse: `Section`, `NeuButton`, `useLoopClock` (`src/lib/useLoopClock.ts:40`).
   - New: `HeroLoop` and shared chart primitives (Phase D). Until then a static still of the loop's final state.
   - Remove: `RotatingWord`, `HeroVideoBackdrop`, hero badge image.
2. Proof and trust
   - Modify: `TrustBar` to two static logos; `AwardSection` to a compact band.
   - New: `TrustAnchors` (three linked statements).
3. How it works
   - New: `HowItWorks` with three steps and one visual each; in Phase D, one pinned canvas.
   - Reuse: the sticky-scroll pattern and layout queries from `AssemblyLine` (`src/components/assemblyLine/AssemblyLine.tsx:19-30`, `src/components/assemblyLine/AssemblyLine.tsx:465-518`).
   - Move: `AssemblyLine` itself to the new product page.
4. Two ways to work with AI
   - Modify: `YourAgentSection` into `AiPaths`, two equal columns.
   - Move: `AgenticDemoLazy` off the homepage.
5. Who it's for
   - Modify: `InstitutionalSection` into a four-link row, light tone, no photos.
6. Research, FAQ and final CTA
   - Modify: `InsightsSection` (curated list, three cards); `FAQSection` (five items, no sticky aside).
   - Reuse: `FAQList` unchanged, `ClosingSection` (`src/components/sections/ClosingSection.tsx:40`).

### Where each removed block goes

- Five-station pipeline and its four highlight chips: new page `/product/platform`.
- Three capability items: the same new page. Their existing links stay (`src/components/sections/WorkflowSection.tsx:15-19`).
- 40-second agentic demo: already the hero of `/product/agentic-ai` (`src/pages/AgenticAiPage.tsx:22`). Removed from the homepage only.
- Four advantage tiles: the solution pages. The "cryptographic provenance" tile is held back until Q5 is answered.
- Three MCP tiles: already covered on `/product/mcp` (`src/pages/McpPage.tsx:168-178`).
- Award photo, long text and second badge: the photo and one sentence stay in section 2; the rest lives in the award post (`src/lib/award.ts:5`).
- Award blog cards: remain on `/blog`; excluded from the homepage selection.
- Four FAQs (asset classes, signal export, live trading, speed): remain in the catalog for the solution pages (`src/solutions/registry.ts:82`, `src/solutions/registry.ts:111`).
- FAQ aside ("Talk to us", docs and pricing links): replaced by the final CTA; docs and pricing stay in the header and footer.
- Rotating word, hero video, marquee: deleted. Nothing else uses them.

## 4. Phased work

Every phase is one or more pull requests that pass the existing CI gates (`.github/workflows/ci.yml:34-83`). Merging to `main` deploys (`.github/workflows/deploy.yml:37-40`), so each phase is live when merged.

### Phase A: copy, CTA unification, removals, FAQ rewrite, nav cleanup

Ships on the current visual design.

#### A0. Baseline events

- Files: new `src/lib/track.ts`; `src/components/primitives/NeuButton.tsx:21-36`; `src/components/sections/HeroDiorama.tsx:108-113`; `src/components/Header/Header.tsx:543-545`; `src/components/sections/FAQSection.tsx:53-55`; `src/pages/ContactPage.tsx:90-93`.
- Change: a `track(name, props)` helper that calls the existing Clarity queue (`index.html:70-75`), plus events `cta_trial_click`, `cta_walkthrough_click` (each with a `placement` value), `contact_submit`, `scroll_50` and `scroll_90`.
- Dependencies: Q8.
- Risk: low. Events only fire for consenting visitors on the production host (`index.html:69`, `index.html:90-96`).
- Effort: S.
- Acceptance: with `window.clarity` replaced by a recording stub, clicking each homepage CTA records exactly one event with the expected name and placement.

#### A1. Two CTA labels everywhere

- Files: `src/i18n/locales/{en,es,pt}/common.json:6-10`; `src/i18n/locales/{en,es,pt}/header.json:15-17`; `src/i18n/locales/{en,es,pt}/home.json:9`, `:12`, `:569`; `src/i18n/locales/{en,es,pt}/solutions.json:37`, `:174`, `:311`, `:437`; `src/i18n/locales/{en,es,pt}/pages.json:33`, `:79`, `:101`, `:122`, `:1321`; the components that read them (`src/components/Header/Header.tsx:544`, `:665`, `src/pages/SolutionPage.tsx:113-116`, `:159`).
- Change: add `common:cta.primary` and `common:cta.secondary`; point every button at them; delete the superseded keys.
- Dependencies: Q3.
- Risk: medium. Key deletions must be mirrored in all three languages or the parity gate fails (`.github/workflows/ci.yml:46-47`).
- Effort: M.
- Acceptance: a case-insensitive search of `src/i18n/locales/en/` for "Get started", "Talk to us", "Start free" followed by a quote mark, and "Book the walkthrough" returns no matches.

#### A2. Hero copy and award eyebrow

- Files: `src/components/sections/HeroDiorama.tsx:49-144`; `src/i18n/locales/{en,es,pt}/home.json:2-24`.
- Change: new headline as one `h1` with no gradient accent word; new subhead as plain text; remove `RotatingWord` and the `marketWords` keys; replace the badge image with a text eyebrow above the headline that links to the award post.
- Dependencies: Q1, Q2.
- Risk: medium. The headline is longer than "Find Your Edge." and sits over video until Phase C; check wrapping at 375 px and legibility over the poster.
- Effort: S.
- Acceptance: the prerendered homepage contains the approved headline inside its only `h1` and no element cycles text in the hero.

#### A3. Static logos

- Files: `src/components/sections/TrustBar.tsx:21-26`, `:48-164`.
- Change: remove the belt, laps and keyframes; render each partner once in a centred row.
- Dependencies: Q6.
- Risk: low.
- Effort: S.
- Acceptance: the prerendered homepage contains each partner link exactly once and no `trustBarBelt` animation.

#### A4. Research cards without award posts

- Files: `src/components/sections/InsightsSection.tsx:16-43`, `:73-101`.
- Change: replace pinned-then-newest selection with an explicit slug list (`deflated-sharpe`, `momentum-research`, `climate-analysis`); render three cards; drop the post counter.
- Dependencies: none.
- Risk: low. A slug that is unpublished later would leave a gap; fall back to the newest research post.
- Effort: S.
- Acceptance: the prerendered homepage links to neither `/blog/fintela-wins-hedgeweek-us-awards-2026` nor `/blog/fintela-hedgeweek-announcement` from the research section.

#### A5. Award once

- Files: `src/components/sections/AwardSection.tsx:36-90`; `src/i18n/locales/{en,es,pt}/home.json:25-35`; `src/pages/HomePage.tsx:23`.
- Change: one sentence, the photo, one badge, one link. Remove the section header, the second paragraph and the caption; remove `award` from the scroll-spy list.
- Dependencies: A2 (the eyebrow carries the award in the hero).
- Risk: low.
- Effort: S.
- Acceptance: the homepage contains one Hedgeweek badge image and at most two links to the award post.

#### A6. Five FAQs

- Files: `src/lib/faqOrder.ts:3-28`; `src/components/sections/FAQSection.tsx:25-26`; `src/pages/HomePage.tsx:54-59`; `src/i18n/locales/{en,es,pt}/home.json:528-565`.
- Change: add a `HOME_FAQ_KEYS` list of five; add one new item, `overfitting`; rewrite `python`, `vsBacktesting`, `security` and `poweredBy` per the copy deck. Keep all nine existing keys, because the solution pages read them (`src/solutions/registry.ts:57-58`).
- Dependencies: Q5.
- Risk: medium. The rewritten answers also change on the four solution pages; review them there.
- Effort: M.
- Acceptance: the homepage's FAQPage JSON-LD has exactly five questions and they match the five visible questions.

#### A7. Remove the best-Sharpe punchline

- Files: `src/components/assemblyLine/Surfaces.tsx:128-182`; `src/i18n/locales/{en,es,pt}/home.json:95`, `:102`, `:113-118`.
- Change: the Studies card shows search method, trials recorded and a verdict status instead of "Best Sharpe"; the ranked list shows each row's out-of-sample result and verdict beside the trial count, with the top in-sample row marked as overfit risk; add a visible "Illustrative data" caption; make the split bar match the product default.
- Dependencies: none.
- Risk: medium. The same component moves in C1; do this first so the fix ships early.
- Effort: M.
- Acceptance: the string "Best Sharpe" does not appear in the prerendered homepage, and every Sharpe figure on the page has a trial count in the same card.

#### A8. Claims-language pass and metadata

- Files: `src/i18n/locales/{en,es,pt}/home.json:43`, `:47`, `:56`, `:86`, `:603-606`, `:1163-1164`, `:1169`; `src/i18n/locales/{en,es,pt}/pages.json:1268-1269`; `src/i18n/locales/{en,es,pt}/footer.json:2`; `scripts/og/render.mjs:91-94` and the generated `public/og/default.png`.
- Change: remove "every result reproducible", unqualified "validated", "Real or overfit" and the hashing claim; new meta title and description; new footer tagline; regenerate the default social card.
- Dependencies: Q1, Q5.
- Risk: medium. The title change affects search snippets.
- Effort: M.
- Acceptance: a search of the three `home.json` files for the banned phrases in your brief, plus "reproducible" and "cryptograph", returns no matches inside keys the homepage renders.

#### A9. Navigation cleanup

- Files: `src/i18n/locales/{en,es,pt}/header.json:2-14`, `:26-31`; `src/components/Footer/Footer.tsx:61-76`, `:159`; `src/i18n/locales/{en,es,pt}/footer.json:6-16`.
- Change: label the product menu "Product" and the audience menu "Solutions"; spell out the product items ("Fintelligent", "Optimization engine", "API", "Fintela MCP"); retire the footer's `/#hero` link and point "Capabilities" at `/product/samplers` until C1 exists.
- Dependencies: none.
- Risk: low.
- Effort: S.
- Acceptance: no header menu label differs from the route group it opens, and the footer contains no link to `/#hero`.

### Phase B: layout, tokens and typography

#### B1. Token layer

- Files: `src/theme/tokens.ts:109-157`, `:168-210`; `src/index.css:163-178`, `:226-236`, `:250-265`; `index.html:7`; `src/theme/theme.ts:36-40`.
- Change: warm-neutral canvas, near-black ink, one accent, a dark preview surface; fix the three places that still hold retired colours.
- Dependencies: Q9, Q11.
- Risk: high. Tokens are global.
- Effort: M.
- Acceptance: `index.html:7`, `src/index.css:234` and `src/theme/tokens.ts:132` name the same canvas colour, and no gradient token has more than one hue.

#### B2. Typography

- Files: `src/theme/theme.ts:49-103`; `src/components/primitives/SectionHeader.tsx:80-141`; `src/components/sections/HeroDiorama.tsx:50-87`.
- Change: Inter in two weights (regular and semibold) on marketing pages; a three-step display scale; a `60ch` measure on every paragraph; JetBrains Mono only inside previews and code.
- Dependencies: B1.
- Risk: medium. The metric-matched fallback fonts are tuned per weight (`src/index.css:60-139`); dropping weights simplifies them but needs a layout-shift check.
- Effort: M.
- Acceptance: computed styles on the homepage show at most two distinct font weights outside product previews, and no paragraph is wider than 65 characters at 1440 px.

#### B3. Section rhythm

- Files: `src/components/primitives/Section.tsx:37-41`.
- Change: desktop padding that yields about 120 px between sections (60 px top and bottom), 72 px on phones.
- Dependencies: B1.
- Risk: low.
- Effort: S.
- Acceptance: at 1440 px the gap between the last element of one section and the first of the next is between 110 and 130 px for every pair.

#### B4. Flat surfaces

- Files: `src/theme/neu.ts:150-233`, `:249-296`; `src/components/primitives/NeuPanel.tsx:1`; `src/index.css:172-177`, `:198-203`.
- Change: replace paired shadows with flat surfaces and hairline borders; buttons become solid (primary) and outlined (secondary).
- Dependencies: B1, Q9.
- Risk: high. Affects pricing, contact, docs and blog.
- Effort: L.
- Acceptance: a screenshot of each of the 16 static routes (`src/seo/routes.ts:12-29`) at 375 and 1440 px has been reviewed and signed off.

#### B5. Header logo

- Files: `src/assets/logos/fintela_logo_2.png`; `src/components/Header/Header.tsx:28`, `:358-364`; `src/components/Footer/Footer.tsx:10`.
- Change: replace the 526 KB PNG with an SVG or a correctly sized raster.
- Dependencies: a vector logo from you.
- Risk: low.
- Effort: S.
- Acceptance: the logo request on the homepage is under 10 KB.

### Phase C: section restructure and content moves

#### C1. Pipeline product page

- Files: new `src/pages/PlatformPage.tsx`; `src/App.tsx:285-323`, `:360-363`; `src/entry-server.tsx:40-58`; `src/seo/routes.ts:12-29`; `scripts/prerender.mjs:43`; `src/components/Header/Header.tsx:66-71`; `src/i18n/locales/{en,es,pt}/pages.json:1266`; `src/components/assemblyLine/AssemblyLine.tsx:455`.
- Change: a page with one `h1`, the five-station pipeline, the four highlights and the three capability items, linking on to docs (`content/docs/workflows/end-to-end-workflow.md:1`).
- Dependencies: A7, Q12.
- Risk: medium. Five coordinated registrations; a missed one fails the SEO gate (`scripts/check-seo-output.mjs:184-191`).
- Effort: M.
- Acceptance: `dist/product/platform/index.html` exists after a build and the SEO output gate passes (`scripts/check-seo-output.mjs:184-191`).

#### C2. Hero layout

- Files: `src/components/sections/HeroDiorama.tsx:21-148`; `src/components/primitives/HeroVideoBackdrop.tsx:60`; `src/media/registry.ts:164-187`; `scripts/check-media.mjs:1`.
- Change: light canvas, copy left, a static frame of the product loop right; remove the video backdrop and its registry entry.
- Dependencies: B1 to B4.
- Risk: medium. LCP moves from the poster image to text or the still.
- Effort: M.
- Acceptance: the homepage requests no `.mp4` file.

#### C3. Proof and trust

- Files: `src/components/sections/TrustBar.tsx:38`; `src/components/sections/AwardSection.tsx:31`; new `src/components/sections/TrustAnchors.tsx`; `src/i18n/locales/{en,es,pt}/home.json:25-38`.
- Change: one section holding the logos, the compact award band and three trust anchors. Until Phase E the anchors link to `/docs/analyzing-results`, `/docs/studies` and `/docs/execution-modes`.
- Dependencies: A3, A5, Q5, Q6.
- Risk: low.
- Effort: M.
- Acceptance: each of the three anchors is a link that resolves to a prerendered page.

#### C4. How it works

- Files: new `src/components/sections/HowItWorks.tsx`; `src/components/sections/WorkflowSection.tsx:53-125`; `src/i18n/locales/{en,es,pt}/home.json:39-50`.
- Change: three steps (Build, Optimize, Validate), each with one sentence, one proof line and one static visual, plus a link to `/product/platform`.
- Dependencies: C1.
- Risk: low.
- Effort: M.
- Acceptance: the section has exactly three `h3` headings and one link to `/product/platform`.

#### C5. Two ways to work with AI

- Files: `src/components/sections/YourAgentSection.tsx:27-63`; `src/components/sections/WorkflowSection.tsx:83-87`; `src/i18n/locales/{en,es,pt}/home.json:1160-1180`.
- Change: two equal columns, Fintelligent and Fintela MCP, each stating where it runs and who approves; remove the agentic demo from the homepage.
- Dependencies: Q5.
- Risk: low.
- Effort: S.
- Acceptance: the homepage no longer loads the `AgenticDemo` chunk, and both columns contain a sentence about where the AI runs.

#### C6. Who it's for

- Files: `src/components/sections/InstitutionalSection.tsx:136-336`; `src/i18n/locales/{en,es,pt}/home.json:574-612`; `src/i18n/locales/{en,es,pt}/solutions.json:30-36`.
- Change: one row of four links with one sentence each; move the three verified advantage statements to the solution pages.
- Dependencies: Q4.
- Risk: low.
- Effort: S.
- Acceptance: the section contains four links, one to each `/solutions/*` route, and no image.

#### C7. Research, FAQ and final CTA

- Files: `src/components/sections/InsightsSection.tsx:31`; `src/components/sections/FAQSection.tsx:23-84`; `src/pages/HomePage.tsx:120-133`; `src/components/sections/ClosingSection.tsx:40`.
- Change: light-tone research row, single-column FAQ, then `ClosingSection` with the two hero buttons.
- Dependencies: A4, A6, A1.
- Risk: low.
- Effort: S.
- Acceptance: the last section's two buttons have the same labels and destinations as the hero's.

#### C8. Page scaffolding and cleanup

- Files: `src/pages/HomePage.tsx:23-42`, `:52-59`, `:106`; `src/lib/audience.ts:1-48`; `src/components/primitives/RotatingWord.tsx:1`; `src/components/primitives/HeroVideoBackdrop.tsx:1`; `src/i18n/locales/{en,es,pt}/home.json:1`.
- Change: new scroll-spy list; aliases so `#platform`, `#capabilities`, `#for-funds`, `#your-agent`, `#award` and `#insights` still land somewhere sensible; delete components and strings that nothing uses.
- Dependencies: C1 to C7.
- Risk: medium. `home.json` keys are shared with `/product/agentic-ai` and `/home-demo`; delete only keys with no remaining reader.
- Effort: M.
- Acceptance: opening the homepage with each of the six retired hashes scrolls or redirects to a defined target, with no console error.

### Phase D: the three animations

Specifications are in section 6.

#### D1. Shared chart primitives

- Files: new `src/components/charts/` (curve generator, SVG chart, verdict chip).
- Change: deterministic illustrative curves generated at module scope so server and client markup match.
- Dependencies: B1.
- Risk: medium. Any render-time randomness breaks hydration (`src/main.tsx:113-127`).
- Effort: M.
- Acceptance: two consecutive builds produce byte-identical chart markup in `dist/index.html`.

#### D2. Hero loop

- Files: new `src/components/heroLoop/`; `src/components/sections/HeroDiorama.tsx:21`.
- Dependencies: D1, C2.
- Risk: medium.
- Effort: L.
- Acceptance: with reduced motion enabled the loop shows its still frame and does not advance until a step control is used.

#### D3. Scroll-linked How it works

- Files: `src/components/sections/HowItWorks.tsx`.
- Dependencies: D1, C4.
- Risk: medium. Pinning has to degrade on short and narrow windows.
- Effort: L.
- Acceptance: at 1440 by 900 px the canvas shows three distinct states across the section's scroll, and at 375 px the three steps are stacked with no pinning.

#### D4. Validation comparison

- Files: new `src/components/charts/ValidationCompare.tsx`; used inside step three of `HowItWorks`.
- Dependencies: D1.
- Risk: low.
- Effort: M.
- Acceptance: the toggle is operable with arrow keys, and in both states the trial count and both in-sample and out-of-sample results are visible together.

### Phase E: trust pages, tracking and QA

#### E1. Methodology page

- Files: new `src/pages/MethodologyPage.tsx` and the same five registrations as C1.
- Change: how trials are recorded, how the three periods are isolated, what the verdict contains, transaction costs, and the stated limits (no seed, no walk-forward). All sourced from `content/docs/workflows/analyzing-results.md:199-252`, `content/docs/registries/studies.md:302-311` and `src/i18n/locales/en/pages.json:1096-1136`.
- Dependencies: Q5, Q12.
- Risk: low.
- Effort: M.
- Acceptance: every factual sentence on the page has a link to a docs page that states it.

#### E2. Security page

- Files: new `src/pages/SecurityPage.tsx` and the five registrations.
- Change: where code runs (in-app isolation and external mode), organization scoping, credential handling, MCP limits, AI providers.
- Dependencies: facts from you. Hosting region, encryption at rest, certifications and the hashing claim are not in the repo.
- Risk: high. This is the page most likely to make a claim that cannot be backed.
- Effort: M.
- Acceptance: you have confirmed each statement on the page in writing before merge.

#### E3. Point the trust anchors at the new pages

- Files: `src/components/sections/TrustAnchors.tsx`.
- Dependencies: E1, E2.
- Effort: S.
- Acceptance: the three anchors link to `/methodology` or `/security`.

#### E4. Tracking completion

- Files: `src/lib/track.ts`; the six section components; `src/theme/neu.ts:22-28`.
- Change: section-view events for the six sections, events for the hero step controls and the comparison toggle, and a source parameter on the sign-up URL so the app can attribute sign-ups. `[unverified]` Whether the app reads such a parameter is outside this repo.
- Dependencies: A0.
- Risk: low.
- Effort: S.
- Acceptance: scrolling the full homepage with the recording stub produces exactly six section-view events in order.

#### E5. QA and release check

- Files: none changed by default.
- Change: run the test plan in section 7.
- Effort: M.
- Acceptance: every item in section 7 is checked off.

## 5. Copy deck

Unless marked `[proposed]`, English strings are your defaults. Product names, the award category and code terms stay in English in every language, as they do today (`src/i18n/locales/es/home.json:27-28`).

### Metadata

- Title
  - en: Fintela | Quant research infrastructure your AI can operate
  - es: Fintela | Infraestructura quant que tu IA puede operar
  - pt: Fintela | Infraestrutura quant que a sua IA pode operar
- Description `[proposed]`
  - en: Build a strategy, optimize it across thousands of trials and test it on held-out data, in one cloud platform. Use the built-in assistant or your own agent.
  - es: Construye una estrategia, optimízala en miles de trials y pruébala con datos reservados, en una sola plataforma en la nube. Con el asistente integrado o tu propio agente.
  - pt: Construa uma estratégia, otimize-a em milhares de trials e teste-a com dados reservados, em uma única plataforma na nuvem. Com o assistente integrado ou seu próprio agente.
- Note: only English is prerendered, so only the English pair reaches crawlers and link previews (`src/main.tsx:12`).

### Buttons (used everywhere)

- Primary
  - en: Start free trial
  - es: Comenzar prueba gratuita
  - pt: Começar teste grátis
- Secondary
  - en: Book a walkthrough
  - es: Reservar una demostración
  - pt: Agendar uma demonstração

### Section 1: Hero

- Eyebrow
  - en: Winner, New Solution Product of the Year, Hedgeweek US Awards 2026, voted by Hedgeweek readers
  - es: Ganador, New Solution Product of the Year, Hedgeweek US Awards 2026, por votación de los lectores de Hedgeweek
  - pt: Vencedor, New Solution Product of the Year, Hedgeweek US Awards 2026, por votação dos leitores da Hedgeweek
- Headline (Q1)
  - en: Quant research infrastructure your AI can operate.
  - es: Infraestructura de investigación cuantitativa que tu IA puede operar.
  - pt: Infraestrutura de pesquisa quantitativa que a sua IA pode operar.
- Subhead (Q2)
  - en: Build a strategy, optimize it across thousands of trials, and test it on data it has never seen, all in one cloud platform. Use the built-in assistant or connect your own agent. You decide what goes live.
  - es: Construye una estrategia, optimízala en miles de trials y pruébala con datos que nunca ha visto, todo en una sola plataforma en la nube. Usa el asistente integrado o conecta tu propio agente. Tú decides qué pasa a operar en vivo.
  - pt: Construa uma estratégia, otimize-a em milhares de trials e teste-a com dados que ela nunca viu, tudo em uma única plataforma na nuvem. Use o assistente integrado ou conecte seu próprio agente. Você decide o que vai para operação ao vivo.
- Loop caption `[proposed]`
  - en: Illustrative data. Not investment advice.
  - es: Datos ilustrativos. No es asesoría de inversión.
  - pt: Dados ilustrativos. Não é recomendação de investimento.

### Section 2: Proof and trust

- Logo label (existing, pending Q6)
  - en: Teams building with Fintela
  - es: Equipos que construyen con Fintela
  - pt: Times construindo com a Fintela
- Award sentence `[proposed]`, from existing copy
  - en: Fintela won New Solution Product of the Year at the Hedgeweek US Awards 2026, decided by a vote of Hedgeweek's readers.
  - es: Fintela ganó New Solution Product of the Year en los Hedgeweek US Awards 2026, por votación de los lectores de Hedgeweek.
  - pt: A Fintela venceu o New Solution Product of the Year no Hedgeweek US Awards 2026, por votação dos leitores da Hedgeweek.
- Award link (existing)
  - en: Read the announcement
  - es: Leer el anuncio
  - pt: Ler o anúncio
- Trust heading `[proposed]`
  - en: Built so results can be checked.
  - es: Hecha para que los resultados se puedan comprobar.
  - pt: Feita para que os resultados possam ser verificados.
- Anchor 1, replaces "reproducible research" (Q5) `[proposed]`
  - en: Every trial on record. Each trial, its parameters and its results are saved, and a promoted portfolio is a frozen snapshot.
  - es: Cada trial queda registrado. Cada trial, sus parámetros y sus resultados se guardan, y un portafolio promovido es una copia congelada.
  - pt: Cada trial fica registrado. Cada trial, seus parâmetros e seus resultados são salvos, e um portfólio promovido é uma cópia congelada.
  - Link: How research is recorded / Cómo se registra la investigación / Como a pesquisa é registrada
- Anchor 2 `[proposed]`
  - en: Out-of-sample isolation. The search only sees training data. Validation never steers it, and the out-of-sample period is held back until the end.
  - es: Aislamiento fuera de muestra. La búsqueda solo ve los datos de entrenamiento. La validación nunca la dirige, y el periodo fuera de muestra se reserva hasta el final.
  - pt: Isolamento fora da amostra. A busca só vê os dados de treino. A validação nunca a orienta, e o período fora da amostra fica reservado até o fim.
  - Link: How validation works / Cómo funciona la validación / Como a validação funciona
- Anchor 3, "IP architecture" `[proposed]`
  - en: Keep your code on your servers. In external mode your strategy runs on your infrastructure. Fintela sends parameters and reads back positions.
  - es: Mantén tu código en tus servidores. En modo externo, tu estrategia corre en tu infraestructura. Fintela envía parámetros y lee las posiciones.
  - pt: Mantenha seu código nos seus servidores. No modo externo, sua estratégia roda na sua infraestrutura. A Fintela envia parâmetros e lê as posições.
  - Link: How external mode works / Cómo funciona el modo externo / Como o modo externo funciona

### Section 3: How it works

- Heading `[proposed]`
  - en: Build, optimize, validate.
  - es: Construye, optimiza, valida.
  - pt: Construa, otimize, valide.
- Build
  - en: Describe a hypothesis or write it yourself. AI drafts the code and parameters, and you review them.
  - es: Describe una hipótesis o escríbela tú mismo. La IA redacta el código y los parámetros, y tú los revisas.
  - pt: Descreva uma hipótese ou escreva você mesmo. A IA redige o código e os parâmetros, e você os revisa.
  - Proof: Strategies are plain Python functions. / Las estrategias son funciones de Python. / As estratégias são funções Python.
- Optimize
  - en: Fintela runs thousands of variations in parallel and records every trial.
  - es: Fintela ejecuta miles de variaciones en paralelo y registra cada trial.
  - pt: A Fintela executa milhares de variações em paralelo e registra cada trial.
  - Proof, your default: Bayesian search with seven samplers. `[unverified]` Only two of the seven are Bayesian.
  - Proof, recommended: Seven search algorithms, Bayesian by default. / Siete algoritmos de búsqueda, bayesiano por defecto. / Sete algoritmos de busca, bayesiano por padrão.
- Validate
  - en: The selected strategy is tested on data held out from optimization, with a report on how much of the result may be overfitting.
  - es: La estrategia seleccionada se prueba con datos reservados de la optimización, con un informe de cuánto del resultado puede deberse a sobreajuste.
  - pt: A estratégia selecionada é testada com dados reservados da otimização, com um relatório de quanto do resultado pode ser sobreajuste.
  - Proof: Train, validation and out-of-sample splits. / Divisiones de entrenamiento, validación y fuera de muestra. / Divisões de treino, validação e fora da amostra.
- Link
  - en: See the full five-stage pipeline
  - es: Ver el pipeline completo de cinco etapas
  - pt: Ver o pipeline completo de cinco etapas
- Comparison toggle `[proposed]`
  - en: Best in-sample trial / Robust candidate / Out-of-sample starts
  - es: Mejor trial en muestra / Candidato robusto / Empieza fuera de muestra
  - pt: Melhor trial na amostra / Candidato robusto / Início fora da amostra
  - Verdict labels use the product's names, "Overfit Risk" and "Well Trained" (`content/docs/workflows/analyzing-results.md:212-217`). `[unverified]` Their Spanish and Portuguese forms should be copied from the app, which is not in this repo.

### Section 4: Two ways to work with AI

- Heading
  - en: Two ways to work with AI
  - es: Dos formas de trabajar con IA
  - pt: Duas formas de trabalhar com IA
- Fintelligent `[proposed]`
  - Label: Built in / Integrado / Integrado
  - en: The assistant inside Fintela. It drafts strategies, sets up studies and explains results. Nothing is saved or launched until you confirm.
  - es: El asistente dentro de Fintela. Redacta estrategias, configura estudios y explica resultados. Nada se guarda ni se lanza hasta que confirmas.
  - pt: O assistente dentro da Fintela. Redige estratégias, configura estudos e explica resultados. Nada é salvo nem lançado até você confirmar.
  - Where it runs, your default: Runs in Fintela's cloud. `[unverified]` See Q5.
  - Where it runs, recommended: Runs inside Fintela, managed for you, with the AI provider you choose. / Funciona dentro de Fintela, gestionado por nosotros, con el proveedor de IA que elijas. / Funciona dentro da Fintela, gerenciado por nós, com o provedor de IA que você escolher.
  - Link (existing): Meet Fintelligent / Conoce Fintelligent / Conheça o Fintelligent
- Fintela MCP `[proposed]`
  - Label: Bring your own agent / Trae tu propio agente / Traga seu próprio agente
  - en: Connect Claude Code or claude.ai. Your agent reads overfitting verdicts, checks your strategy server and proposes studies. A person approves every run.
  - es: Conecta Claude Code o claude.ai. Tu agente lee veredictos de sobreajuste, comprueba el servidor de tu estrategia y propone estudios. Una persona aprueba cada ejecución.
  - pt: Conecte o Claude Code ou o claude.ai. Seu agente lê vereditos de sobreajuste, verifica o servidor da sua estratégia e propõe estudos. Uma pessoa aprova cada execução.
  - Where it runs: Your strategy code stays on your servers. / El código de tu estrategia se queda en tus servidores. / O código da sua estratégia fica nos seus servidores.
  - Link (existing): Explore Fintela MCP / Conoce Fintela MCP / Conheça o Fintela MCP

### Section 5: Who it's for

- Heading (existing): Who it's for / Para quién es / Para quem é
- Hedge funds `[proposed]`
  - en: Research at fund scale without building the infrastructure.
  - es: Investigación a escala de fondo sin construir la infraestructura.
  - pt: Pesquisa em escala de fundo sem construir a infraestrutura.
- Quant teams `[proposed]`
  - en: One shared library of strategies, universes and results for the whole desk.
  - es: Una biblioteca compartida de estrategias, universos y resultados para toda la mesa.
  - pt: Uma biblioteca compartilhada de estratégias, universos e resultados para toda a mesa.
- Independent quants `[proposed]`
  - en: Optimize and backtest without maintaining any infrastructure.
  - es: Optimiza y haz backtesting sin mantener infraestructura.
  - pt: Otimize e faça backtests sem manter infraestrutura.
- Financial advisors `[proposed]`
  - en: Turn a client mandate into a backtested strategy with a report you can share.
  - es: Convierte el mandato de un cliente en una estrategia con backtest y un informe que puedes compartir.
  - pt: Transforme o mandato de um cliente em uma estratégia com backtest e um relatório que você pode compartilhar.

### Section 6: Research, FAQ and final CTA

- Research heading `[proposed]`: From our research / De nuestra investigación / Da nossa pesquisa
- Research pieces (titles come from the posts, which exist in English only):
  - "The backtest you didn't run is still costing you" (`content/blog/deflated_sharpe.md:2`)
  - "Why momentum works, and why it sometimes stops working" (`content/blog/momentum_research.md:2`)
  - "Climate Risk against Agricultural Stocks" (`content/blog/climate_analysis.md:2`)
- FAQ heading `[proposed]`: Questions / Preguntas / Perguntas

FAQ 1, Python (your default answer)

- en: Do I need to know Python? Not to get started. Strategies are Python functions, and the assistant writes them from a plain-English description for you to review.
- es: ¿Necesito saber Python? No para empezar. Las estrategias son funciones de Python, y el asistente las escribe a partir de una descripción en lenguaje natural para que las revises.
- pt: Preciso saber Python? Não para começar. As estratégias são funções Python, e o assistente as escreve a partir de uma descrição em linguagem natural para você revisar.

FAQ 2, versus a backtesting library `[proposed]`

- en: How is Fintela different from a backtesting library? A library runs one backtest. Fintela runs the whole research loop in one place: the universe, the strategy, a search across thousands of parameter combinations, evaluation on held-out data and an overfitting report. Nothing is exported or stitched together between steps.
- es: ¿En qué se diferencia Fintela de una librería de backtesting? Una librería ejecuta un backtest. Fintela ejecuta todo el ciclo de investigación en un solo lugar: el universo, la estrategia, una búsqueda entre miles de combinaciones de parámetros, la evaluación con datos reservados y un informe de sobreajuste. Nada se exporta ni se une a mano entre pasos.
- pt: Como a Fintela se diferencia de uma biblioteca de backtesting? Uma biblioteca executa um backtest. A Fintela executa todo o ciclo de pesquisa em um só lugar: o universo, a estratégia, uma busca entre milhares de combinações de parâmetros, a avaliação com dados reservados e um relatório de sobreajuste. Nada é exportado nem costurado à mão entre as etapas.

FAQ 3, overfitting (new item) `[proposed]`

- en: How does Fintela help with overfitting? Every study splits its data into train, validation and out-of-sample periods. The search only sees the training period, and the out-of-sample period is held back until the end. When a study finishes, each candidate gets a verdict based on deflated Sharpe, the probability of backtest overfitting and how much performance drops out of sample. This helps identify potential overfitting. It does not predict live results.
- es: ¿Cómo ayuda Fintela con el sobreajuste? Cada estudio divide sus datos en periodos de entrenamiento, validación y fuera de muestra. La búsqueda solo ve el periodo de entrenamiento, y el periodo fuera de muestra se reserva hasta el final. Cuando un estudio termina, cada candidato recibe un veredicto basado en el Sharpe deflactado, la probabilidad de sobreajuste del backtest y cuánto cae el rendimiento fuera de muestra. Esto ayuda a identificar un posible sobreajuste. No predice resultados en vivo.
- pt: Como a Fintela ajuda com o sobreajuste? Cada estudo divide seus dados em períodos de treino, validação e fora da amostra. A busca só vê o período de treino, e o período fora da amostra fica reservado até o fim. Quando um estudo termina, cada candidato recebe um veredito baseado no Sharpe deflacionado, na probabilidade de sobreajuste do backtest e em quanto o desempenho cai fora da amostra. Isso ajuda a identificar um possível sobreajuste. Não prevê resultados ao vivo.

FAQ 4, where code runs (replaces "Is my strategy code secure?") `[proposed]`

- en: Where does my strategy code run? You choose. Strategies written in Fintela run in an isolated environment with no access to Fintela's internal systems, and your data is scoped to your organization. In external mode, your code and data stay on your own servers: Fintela sends parameters and reads back positions.
- es: ¿Dónde se ejecuta el código de mi estrategia? Tú eliges. Las estrategias escritas en Fintela se ejecutan en un entorno aislado, sin acceso a los sistemas internos de Fintela, y tus datos están limitados a tu organización. En modo externo, tu código y tus datos se quedan en tus propios servidores: Fintela envía parámetros y lee las posiciones.
- pt: Onde o código da minha estratégia é executado? Você escolhe. As estratégias escritas na Fintela rodam em um ambiente isolado, sem acesso aos sistemas internos da Fintela, e seus dados ficam restritos à sua organização. No modo externo, seu código e seus dados ficam nos seus próprios servidores: a Fintela envia parâmetros e lê as posições.

FAQ 5, the AI (replaces "is it safe?") `[proposed]`

- en: Which AI powers Fintelligent, and what can it do on its own? You choose the AI provider from the options Fintela supports, such as DeepSeek and Anthropic, with no API key to bring. Fintelligent sees only what you can see in your organization. Every tool call is visible, and nothing is saved, launched or spent until you confirm.
- es: ¿Qué IA impulsa a Fintelligent y qué puede hacer por su cuenta? Tú eliges el proveedor de IA entre las opciones que Fintela ofrece, como DeepSeek y Anthropic, sin aportar claves de API. Fintelligent solo ve lo que tú puedes ver en tu organización. Cada llamada a herramienta es visible, y nada se guarda, se lanza ni se gasta hasta que confirmas.
- pt: Qual IA alimenta o Fintelligent e o que ele pode fazer sozinho? Você escolhe o provedor de IA entre as opções que a Fintela oferece, como DeepSeek e Anthropic, sem precisar de chave de API. O Fintelligent só vê o que você pode ver na sua organização. Cada chamada de ferramenta é visível, e nada é salvo, lançado ou gasto até você confirmar.

Final CTA `[proposed]`

- en: Start with one strategy. Build it, optimize it and see how it performs on data it has never seen. You decide what goes live.
- es: Empieza con una estrategia. Constrúyela, optimízala y mira cómo se comporta con datos que nunca ha visto. Tú decides qué pasa a operar en vivo.
- pt: Comece com uma estratégia. Construa, otimize e veja como ela se comporta com dados que nunca viu. Você decide o que vai para operação ao vivo.

### Navigation

- Product menu label: Product / Producto / Produto
- Audience menu label: Solutions / Soluciones / Soluções
- Product items: Platform, Fintelligent, Optimization engine, API, Fintela MCP (names stay in English; "Optimization engine" becomes "Motor de optimización" / "Motor de otimização")

## 6. Animation specs

Rules that apply to all three:

- No animation library. Inline SVG, CSS transforms and opacity, and `requestAnimationFrame`, as the existing demos do.
- All data is illustrative, generated deterministically, and labelled "Illustrative data" on the page.
- Never headline best Sharpe alone. Any result is shown beside its trial count.
- Never show a strategy changed and retested on the same held-out period.
- Server-rendered still frame first, motion added after hydration, so the page is complete without JavaScript.
- Combined budget for all three: at most 25 KB gzip of lazily loaded JavaScript, and the eager homepage JavaScript must not exceed today's 266 KB gzip.

### Animation 1: hero loop

- States, 14 seconds total:
  - 0 to 3 s, Hypothesis: one plain-English line is typed.
  - 3 to 6 s, Code: the line becomes a short Python function with two parameters highlighted.
  - 6 to 10 s, Trials: the function fans into about 40 faint equity curves while a counter runs to "1,000 trials".
  - 10 to 14 s, Verdict: two curves stay lit. The one with the highest in-sample result is marked "Overfit Risk". A steadier one is marked "Well Trained" and tagged "Sent for your review". The counter stays visible.
- Triggers: plays when at least a quarter of it is on screen and the tab is visible; pauses otherwise (existing behaviour of `src/lib/useLoopClock.ts:91-114`).
- Controls: play and pause, and four step buttons named Hypothesis, Code, Trials, Verdict. Reuse the player bar pattern (`src/components/fintelligentDemo/AgenticDemo.tsx:618`).
- Technique: one SVG in a fixed aspect-ratio box; the playhead from `useLoopClock`; curves drawn with `stroke-dashoffset`.
- Assets: none. No video, no raster.
- Reduced motion: opens paused on the Verdict frame; step buttons still work; no autoplay.
- Performance budget: at most 12 KB gzip; zero layout shift; only opacity, transform and stroke properties animate; no work while off screen.

### Animation 2: scroll-linked How it works

- States: Build (prompt and code card), Optimize (curves fan out, trial counter), Validate (the time axis splits into train, validation and out-of-sample, and a verdict chip appears).
- Trigger: scroll position through a track about 100vh plus 3 times 60vh tall, with the canvas pinned by `position: sticky`. The wheel, keyboard, scrollbar and touch all drive it; nothing is hijacked. Same approach as `src/components/assemblyLine/AssemblyLine.tsx:465-518`.
- Duration: scroll-linked, so none. State cross-fades take 300 ms.
- Technique: one scroll listener throttled to animation frames, writing a single progress value. Do not depend on CSS scroll-driven animations. `[unverified]` Their browser support was not checked in this session.
- Assets: shares the chart primitives from D1.
- Fallbacks: on narrow or short windows, in print and under reduced motion, there is no pinning; the three steps render as three stacked figures. The pin thresholds follow the existing queries (`src/components/assemblyLine/AssemblyLine.tsx:19-30`).
- Performance budget: at most 8 KB gzip beyond the shared primitives; at most one React state update per frame; no layout properties animated.

### Animation 3: validation comparison

- States: "Best in-sample trial" and "Robust candidate". The first rises steeply and then degrades after a vertical line labelled "Out-of-sample starts". The second rises less and holds after the line.
- Always visible beside the chart in both states: which trial of how many, the in-sample result, the out-of-sample result and the verdict.
- Trigger: a two-option control operated by click, tap or arrow keys. No autoplay. Default state is the best in-sample trial, so the failure is seen first.
- Duration: 400 ms transition between curves.
- Technique: interpolate between two fixed point arrays on one SVG path.
- Assets: none.
- Reduced motion: the swap is instant.
- Performance budget: at most 4 KB gzip; no animation unless the visitor acts.
- Placement: the visual for step three of How it works.

## 7. Test plan

### 375 px

- Headline wraps to at most four lines with no single-word last line.
- Both hero buttons are full width, at least 44 px tall, and visible without scrolling on a 667 px tall screen.
- No horizontal scroll on any section.
- How it works shows three stacked steps with no pinning.
- The comparison toggle is reachable and usable by touch.
- The four audience links stack and each is at least 44 px tall.
- FAQ items open and close and stay collapsed on load.

### 1440 px

- Paragraphs are at most 65 characters wide.
- Gaps between sections are 110 to 130 px.
- The hero loop sits beside the copy and does not push the buttons below the fold at 900 px height.
- The pinned canvas shows each of its three states and releases cleanly into the next section.
- No more than two font weights outside product previews.

### Lighthouse targets (mobile emulation, production build)

- Performance at least 90; Accessibility at least 95; Best Practices at least 95; SEO 100.
- Largest Contentful Paint at most 2.5 s; Cumulative Layout Shift at most 0.05; Total Blocking Time at most 200 ms.
- Record today's scores before Phase A as the baseline. `[unverified]` None were measured in the audit.

### Links

- `npm run build`, then the four output checks CI runs, all pass: docs links, content hygiene, media existence and SEO output (`.github/workflows/ci.yml:53-77`).
- Each retired hash (`#platform`, `#capabilities`, `#for-funds`, `#your-agent`, `#award`, `#insights`) and each legacy alias (`src/pages/HomePage.tsx:30-42`) lands on a defined target.
- `/?for=teams` still loads without a hydration error.
- `sitemap-pages.xml` lists every new page and no redirect path.
- The CloudFront router test passes (`.github/workflows/ci.yml:82-83`).

### Locales

- The key-parity gate passes (`scripts/i18n-keysync.mjs:1-6`).
- Each of the six sections is reviewed in Spanish and Portuguese at 375 and 1440 px for overflow. Portuguese is the longest (`src/components/assemblyLine/AssemblyLine.tsx:19-24`).
- A native speaker has reviewed the Spanish and Portuguese copy deck.
- `<html lang>` matches the selected language.

### Accessibility

- Exactly one `h1`; no skipped heading levels.
- Every interactive element is reachable and operable by keyboard with a visible focus ring.
- With reduced motion on, nothing moves until the visitor acts.
- Text contrast is at least 4.5:1 on the new canvas, measured in the browser.

### Tracking

- With a recording stub in place of `window.clarity`, each CTA, each section view and each animation control produces one event with the documented name.
- With consent declined, no request is made to the Clarity host.
- After release, the events appear in Clarity for a consenting test session on production.

## 8. Out of scope for this repo

- A resource-bounded guided sandbox in the app would support the self-serve CTA: a visitor who clicks "Start free trial" would land in a pre-built example study with a capped trial budget and see a real verdict in minutes, instead of an empty workspace. That is work in the app repository, not here.
- Reading a source parameter on the app's sign-up page so that sign-ups can be attributed to a homepage button.
- Recording the multi-agent conversation video that the solution pages still show as a poster (`src/media/registry.ts:133-144`).
- Per-language URLs and `hreflang`. Today Spanish and Portuguese are not indexable (`src/seo/Seo.tsx:86`).
- Removing the temporary `/home-demo` page and the nine unused section components listed in the audit.
- Applying the CloudFront function by hand if any new redirect is added (`infra/cloudfront/router.js:1-3`).
