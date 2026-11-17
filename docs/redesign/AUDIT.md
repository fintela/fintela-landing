# Homepage redesign audit

Audited on 2026-11-15 against `main` at commit `0a749d7` (clean working tree). Read-only: no source, config, asset, content or lockfile was changed, and nothing was installed, committed or deployed.

## How to read this

- Every statement was checked in the repo and carries a `path:line` reference.
- `[unverified]` marks anything that could not be confirmed from the repo alone (rendered contrast, Lighthouse scores, external inbound links, third-party dashboard settings).
- Size figures come from the existing `dist/` build. No file under `src/`, `content/`, `public/`, `scripts/`, `index.html`, `vite.config.ts` or `package.json` is newer than `dist/index.html`, so the build matches HEAD and was not re-run.
- Contrast ratios marked "computed" were calculated with the WCAG 2 formula from the token hex values, not measured in a browser.

## Headline findings

- All nine problems in the brief are confirmed in code. Two need correcting: the page is 8 bands holding 11 content blocks (not ten), and the site has seven CTA labels, not four.
- The curve-fitting problem is larger than one number. The pipeline card shows "Best Sharpe 1.84" beside "1,000 / 1,000" trials with no overfitting verdict (`src/components/assemblyLine/Surfaces.tsx:132-134`), and three different train/validation/out-of-sample splits appear across the page, unused copy and the docs.
- One of the two "Teams building with Fintela" logos is Momento Capital, which is also the legal entity that operates Fintela (`src/components/sections/TrustBar.tsx:11`, `src/seo/site.ts:56`). Presenting it as customer proof is a decision for you.
- Two security claims on the page have no backing in `content/docs/`: "cryptographically hashed and time stamped" (`src/i18n/locales/en/home.json:555`, `src/i18n/locales/en/home.json:603-606`) and "every result reproducible" (`src/i18n/locales/en/home.json:43`). The docs state the opposite for reproducibility of the default sampler (`content/docs/configuration/sampler-selection.md:303-312`).
- There is no baseline to compare against. The only analytics is consent-gated Microsoft Clarity with one custom event, on a different page (`src/contact/BookWalkthrough.tsx:39`). No CTA or scroll event exists.
- The header logo is a 526,527-byte PNG displayed 17 to 22 px tall and preloaded on every page (`src/components/Header/Header.tsx:28`, `src/components/Header/Header.tsx:358-364`).
- No `/security`, `/methodology` or pipeline product page exists. The three trust anchors and the "full five-stage pipeline" link have nowhere to land yet (`src/seo/routes.ts:12-29`).

## 1. Stack and build

### Framework and router

- React 19.2 single-page app built with Vite 7 and TypeScript 5.9 (`package.json:21`, `package.json:56`, `package.json:54`).
- Routing is `react-router-dom` 7 with one shared route table, `AppRoutes` (`package.json:26`, `src/App.tsx:335-390`). The homepage is the only eagerly imported page; every other route is `React.lazy` (`src/App.tsx:15`, `src/App.tsx:28-101`).
- Every route is prerendered to static HTML at build time. The build script is `tsc -b && vite build && node scripts/prerender.mjs` (`package.json:8`); the renderer is `src/entry-server.tsx:40-58`.
- The client hydrates only when the document matches the URL and the visitor's language is English; otherwise it clears the root and client-renders (`src/main.tsx:118-133`).

### Styling system

- MUI 7 with Emotion, styled almost entirely through the `sx` prop (`package.json:14-17`, `src/theme/theme.ts:5-11`).
- Tokens live in `src/theme/tokens.ts:1-309`; reusable style recipes in `src/theme/neu.ts:150` onward; a small global stylesheet in `src/index.css:1-291`.
- The visual language is neumorphic ("soft UI"): paired light and dark shadows on a grey ground (`src/theme/tokens.ts:91-108`, `src/index.css:172-177`).
- Emotion critical CSS is extracted per route during prerender (`src/entry-server.tsx:52-55`).

### Animation libraries

- None. There is no GSAP, Framer Motion, Lottie or similar in `package.json:13-29`.
- All motion is hand-written: CSS keyframes, `requestAnimationFrame`, `IntersectionObserver` and `position: sticky`.
- `three` is a declared dependency (`package.json:28`) but ships zero bytes: its only consumer, `PlatformStackSection`, is not rendered by any page (`src/pages/HomePage.tsx:126`), and no chunk in `dist/assets/` contains a WebGL renderer.

### Content source

- No CMS. All content is in the repo, so the stop condition "content comes from a CMS you cannot read" does not apply.
- UI copy: JSON catalogs under `src/i18n/locales/{en,es,pt}/` in seven namespaces (`src/i18n/index.ts:5-11`).
- Blog, research and docs: Markdown in `content/blog/` and `content/docs/`, compiled to JSON by a Vite plugin (`vite.config.ts:239-253`).
- Legal: Markdown in `content/legal/`, shared with the app (`vite.config.ts:258-263`).

### i18n

- `i18next` with `react-i18next`; languages `en`, `es`, `pt`; fallback `en` (`src/i18n/config.ts:5-8`).
- English is bundled into the entry chunk; Spanish and Portuguese load lazily per namespace (`src/i18n/index.ts:20-33`, `src/i18n/resources.ts:10`).
- Language is detected from `localStorage` then the browser, and there are no per-language URLs (`src/i18n/index.ts:50-54`). All three languages share one URL.
- Only English is prerendered (`src/main.tsx:12`). A Spanish or Portuguese visitor has the prerendered root hidden until the client re-renders (`index.html:25-46`). Crawlers therefore index English only, and `og:locale` is fixed to `en_US` (`src/seo/Seo.tsx:132`).
- Key parity across the three languages is a CI gate (`.github/workflows/ci.yml:46-47`, `scripts/i18n-keysync.mjs:1-6`). Any new key must be added to all three catalogs or the build fails.

### Deployment

- GitHub Actions deploys every push to `main` to S3 behind CloudFront, with a full `/*` invalidation (`.github/workflows/deploy.yml:37-40`, `.github/workflows/deploy.yml:117-118`).
- A CloudFront viewer-request function owns redirects and maps routes to prerendered documents (`infra/cloudfront/router.js:1-24`). It holds verbatim copies of the redirect maps in `src/App.tsx:110-202`, and a test fails if they drift (`infra/cloudfront/router.js:30-32`).
- Pull requests are gated by typecheck, lint, build, i18n parity, docs links, content hygiene, media existence, SEO output and the router test (`.github/workflows/ci.yml:34-83`).

### Analytics

- Microsoft Clarity only, loaded only on host `fintela.io` and only after cookie consent (`index.html:68-107`, `src/components/common/CookieConsentBanner.tsx:70`).
- No Google Analytics, Tag Manager, Plausible, PostHog or data layer exists anywhere in `src/`, `index.html` or `scripts/`.

## 2. Homepage map

Render order is set in `src/pages/HomePage.tsx:118-135`. Global chrome mounted for every route sits in `src/App.tsx:338-342`.

### 0. Header

- Component: `src/components/Header/Header.tsx:181`.
- Copy: `src/i18n/locales/en/header.json:1-32`.
- Contents: logo, "Solutions" menu (four product routes, `src/components/Header/Header.tsx:66-71`), "The Desk" menu (four solution routes), Pricing, Docs, Blog, Research (`src/components/Header/Header.tsx:73-78`), search, language switcher, "Get started" button (`src/components/Header/Header.tsx:543-545`).
- Label mismatch: the menu whose code name is Product is labelled "Solutions" (`src/i18n/locales/en/header.json:3`), while the menu that links to `/solutions/*` is labelled "The Desk" (`src/i18n/locales/en/header.json:12`).
- Assets: `src/assets/logos/fintela_logo_2.png` (`src/components/Header/Header.tsx:28`).

### 1. Hero, `#hero`

- Component: `src/components/sections/HeroDiorama.tsx:21-148`.
- Copy: `hero.headline`, `hero.headlineAccent`, `hero.subtitlePrefix`, `hero.marketWords`, `hero.subtitleSuffix`, `hero.ctaPrimary`, `hero.ctaContact`, `hero.awardAlt` (`src/i18n/locales/en/home.json:5-13`).
- Assets: full-bleed poster image plus a 36-second muted video loop behind the copy (`src/components/primitives/HeroVideoBackdrop.tsx:60-223`, `src/media/registry.ts:181-187`); Hedgeweek winner badge PNG (`src/components/sections/HeroDiorama.tsx:13`).
- Animation: background video; rotating market word (`src/components/sections/HeroDiorama.tsx:91-93`); four staggered fade-up entrances (`src/components/sections/HeroDiorama.tsx:49`, `src/components/sections/HeroDiorama.tsx:78`, `src/components/sections/HeroDiorama.tsx:98`, `src/components/sections/HeroDiorama.tsx:117`).
- There is no product visual in the hero. The component comment says so on purpose (`src/components/sections/HeroDiorama.tsx:15-20`).

### 2. Platform band, `#platform`

- Component: `src/components/sections/WorkflowSection.tsx:53-125`. It contains four separate blocks:
  - Header and four checkmark highlights (`src/components/sections/WorkflowSection.tsx:58-79`, copy `src/i18n/locales/en/home.json:40-49`).
  - The five-station pipeline, `AssemblyLine` (`src/components/assemblyLine/AssemblyLine.tsx:455`, stations `src/components/assemblyLine/stations.ts:6`, copy `src/i18n/locales/en/home.json:52-127`).
  - The 40-second Fintelligent demo, lazy-loaded (`src/components/sections/WorkflowSection.tsx:83-87`, `src/components/fintelligentDemo/agenticScript.ts:20`, copy `src/i18n/locales/en/home.json:954-1045` and `src/i18n/locales/en/home.json:698-855`).
  - Three capability items with links, carrying the `#capabilities` id (`src/components/sections/WorkflowSection.tsx:15-19`, `src/components/sections/WorkflowSection.tsx:89-122`, copy `src/i18n/locales/en/home.json:170-185`).
- Animation: scroll-pinned pipeline (5 stations at 55vh of scroll each, `src/components/assemblyLine/AssemblyLine.tsx:18`, `src/components/assemblyLine/AssemblyLine.tsx:510-518`); the demo's own play loop; fade-ups.

### 3. Audiences band, `#for-funds`

- Component: `src/components/sections/InstitutionalSection.tsx:136-195`, dark ("ink") tone.
- Contents: four audience cards, each a link to a `/solutions/*` page with a stock photo (`src/components/sections/InstitutionalSection.tsx:26`, `src/components/sections/InstitutionalSection.tsx:203-336`), then four "advantage" tiles (`src/components/sections/InstitutionalSection.tsx:57-62`).
- Copy: `audiences.*` (`src/i18n/locales/en/home.json:574-612`) and `useCases.audiences.*` titles and descriptions (`src/i18n/locales/en/home.json:482-520`).
- Assets: four photographs (`src/media/registry.ts:206-211`).

### 4. MCP band, `#your-agent`

- Component: `src/components/sections/YourAgentSection.tsx:27-63`.
- Contents: header, "Explore Fintela MCP" button to `/product/mcp`, three tiles (`src/components/sections/YourAgentSection.tsx:15-19`).
- Copy: `yourAgent.*` (`src/i18n/locales/en/home.json:1160-1180`).

### 5. Award band, `#award`

- Component: `src/components/sections/AwardSection.tsx:31-94`.
- Contents: section header, ceremony photo with caption, winner badge, two paragraphs, "Read the announcement" button.
- Copy: `award.*` (`src/i18n/locales/en/home.json:25-35`).
- Assets: ceremony photo (`src/media/registry.ts:197`), white-ground badge (`src/components/sections/AwardSection.tsx:13`).

### 6. Research and news band, `#insights`

- Component: `src/components/sections/InsightsSection.tsx:31-104`, ink tone.
- Contents: a featured post, up to four compact posts and a post counter, drawn from both blog and research. Selection is automatic: the pinned post first, then newest (`src/components/sections/InsightsSection.tsx:16-20`, `src/components/sections/InsightsSection.tsx:34-37`).
- Copy: `insights.*` (`src/i18n/locales/en/home.json:1047-1059`) plus post frontmatter in `content/blog/`.

### 7. Logo marquee, no id

- Component: `src/components/sections/TrustBar.tsx:38-168`.
- Contents: "Teams building with Fintela" over a looping belt of two logos (`src/components/sections/TrustBar.tsx:10-13`).
- Copy: `trustBar.title` (`src/i18n/locales/en/home.json:37`).

### 8. FAQ band, `#faq`

- Component: `src/components/sections/FAQSection.tsx:23-84` with `src/components/sections/FAQList.tsx:20-110`.
- Contents: sticky left column (header, "Still have questions?" tile with a "Talk to us" button, links to docs and pricing) and a nine-item accordion (`src/lib/faqOrder.ts:3-13`).
- Copy: `faq.*` (`src/i18n/locales/en/home.json:523-573`).

### 9. Footer and floating controls

- Footer: `src/components/Footer/Footer.tsx:55-162`, copy `src/i18n/locales/en/footer.json:1-46`.
- Scroll-to-top button: `src/components/common/ScrollTop.tsx:6-40`.
- Floating contact button, scroll progress bar and cookie banner on every route (`src/App.tsx:340-342`).

### What does not exist on the page

- No closing CTA band. `ClosingSection` exists and is used by the solution pages (`src/components/sections/ClosingSection.tsx:40`, `src/pages/SolutionPage.tsx:154-160`) but the homepage ends on the FAQ.
- No customer quote. No testimonial component or quote string exists in `src/i18n/locales/en/` or `src/components/`.

## 3. Findings check

### 3.1 Hero does not say what the product does: confirmed

- Headline is "Find Your" plus accent "Edge." (`src/i18n/locales/en/home.json:10-11`, rendered at `src/components/sections/HeroDiorama.tsx:64-75`).
- Correction: "AI native quantitative ecosystem" is the end of the subhead, not a second line. The full subhead reads "Discover your edge across [rotating word] in a single AI native quantitative ecosystem." (`src/i18n/locales/en/home.json:6-7`).
- The meta title uses a third positioning, "AI-Native Quant Platform for Trading Strategies" (`src/i18n/locales/en/pages.json:1268`), and the social card a fourth, "The AI-native quant platform" (`scripts/og/render.mjs:93`).
- Spanish and Portuguese subheads are broken sentences: the prefix is a lowercase noun phrase with no verb, "estrategias de inversión en" (`src/i18n/locales/es/home.json:6`, `src/i18n/locales/pt/home.json:6`).

### 3.2 Rotating market name inside the subhead: confirmed

- `RotatingWord` cycles "US Stocks", "Forex", "Global Markets" every 2 seconds (`src/components/sections/HeroDiorama.tsx:91-93`, `src/components/primitives/RotatingWord.tsx:42`, `src/i18n/locales/en/home.json:5`).
- It stops under reduced motion and off screen (`src/components/primitives/RotatingWord.tsx:97-100`). It has no pause control.

### 3.3 Internal nouns: confirmed

- "Asset Groups" (`src/i18n/locales/en/home.json:54`), "Studies" (`src/i18n/locales/en/home.json:69`), "Sampler" (`src/i18n/locales/en/home.json:113`), "Seven samplers, TPE by default" (`src/i18n/locales/en/home.json:184`), "seed" (`src/i18n/locales/en/home.json:547`).
- "TPE" is also hard-coded in the pipeline card (`src/components/assemblyLine/Surfaces.tsx:132`) and repeated in the demo (`src/i18n/locales/en/home.json:984`, `src/i18n/locales/en/home.json:1016`, `src/i18n/locales/en/home.json:1027`).
- Additional ones the review did not list: "cluster" in the first FAQ answer (`src/i18n/locales/en/home.json:531`), "primitives" in the audience description (`src/i18n/locales/en/home.json:578`), "PBO" and "deflated Sharpe" unexplained in the demo (`src/i18n/locales/en/home.json:1039`), and "IC-ready" (`src/i18n/locales/en/home.json:608`).

### 3.4 Roughly ten sections: confirmed, with a corrected count

- The page has 8 `<Section>` bands (`src/pages/HomePage.tsx:120-132`) holding 11 content blocks: hero, pipeline, agentic demo, three capability items, four audience cards, four advantage tiles, MCP, award, blog grid, logo marquee, FAQ.
- Five-step pipeline: confirmed (`src/components/assemblyLine/stations.ts:6`).
- Three feature cards: confirmed (`src/components/sections/WorkflowSection.tsx:15-19`).
- Four persona cards: confirmed (`src/components/sections/InstitutionalSection.tsx:26`).
- Four capability cards: confirmed; in code they are "advantages" (`src/components/sections/InstitutionalSection.tsx:57-62`).
- Nine FAQs: confirmed (`src/lib/faqOrder.ts:3-13`).
- Missed by the review: the 40-second agentic demo and the four highlight chips both sit inside the pipeline band (`src/components/sections/WorkflowSection.tsx:66-87`).
- The prerendered page carries 1 `h1`, 6 `h2` and 30 `h3` headings and 77 links.

### 3.5 "Best Sharpe 1.84" from 1,000 trials: confirmed, and wider than one number

- The Studies station computes Best Sharpe as `0.9 + p * 0.94`, which lands on 1.84 when the trial counter reaches "1,000 / 1,000" (`src/components/assemblyLine/Surfaces.tsx:132-134`). The label is `workflow.line.surface.bestSharpe` (`src/i18n/locales/en/home.json:115`).
- The next station ranks four portfolios by Sharpe with 1.84 highlighted as #1 (`src/components/assemblyLine/Surfaces.tsx:177-182`).
- No overfitting verdict, deflated Sharpe or luck threshold appears anywhere in the pipeline. The only qualifier is the handoff line "1,000 trials, each validated out of sample" (`src/i18n/locales/en/home.json:102`).
- The figures are labelled illustrative only in a code comment (`src/components/assemblyLine/Surfaces.tsx:10-16`), never on the page.
- The contradiction with Fintela's own research is direct. The post's excerpt says that keeping the best Sharpe from a thousand combinations "is closer to p-hacking" (`content/blog/deflated_sharpe.md:5`), puts pure-noise Sharpe at about 3.7 standard deviations at 1,000 trials (`content/blog/deflated_sharpe.md:25`), and says the trial count "has to be tracked and disclosed as part of the result" (`content/blog/deflated_sharpe.md:45`). That post is linked from the same homepage.
- Three different data splits are shown or documented: the pipeline bar is 6:2:2 (`src/components/assemblyLine/Surfaces.tsx:162-164`), unused hero copy says 70 / 15 / 15 (`src/i18n/locales/en/home.json:22`), and the product default is 70% train of the non-held-out window plus 10% out of sample (`content/docs/registries/studies.md:303-304`).
- The second demo is closer to the target but stops short. It pre-registers pass criteria including PBO and deflated Sharpe (`src/i18n/locales/en/home.json:985`, `src/i18n/locales/en/home.json:1039`) and promises to read out-of-sample once (`src/i18n/locales/en/home.json:1043`), but its final frame is a "Best trial" card showing Sharpe 1.62 (`src/components/fintelligentDemo/agenticScript.ts:89-92`, `src/components/fintelligentDemo/agenticParts.tsx:631-647`). The verdict is never shown.

### 3.6 Two AI stories with no explanation of where each runs: confirmed

- Fintelligent appears as the demo (`src/components/sections/WorkflowSection.tsx:85`) and as "AI that operates the platform" (`src/i18n/locales/en/home.json:171-172`).
- Fintela MCP appears three bands later as "Bring your own agent. Keep your edge." (`src/i18n/locales/en/home.json:1162-1164`).
- Nothing on the page compares the two or says where either runs.
- Caution on the target wording "runs in Fintela's cloud": the docs say Fintelligent's AI capability is "fully managed by Fintela" (`content/docs/ai/fintelligent.md:25`, `content/docs/ai/fintelligent.md:445`), and the privacy notice says Fintela relies on third-party AI providers such as DeepSeek and Anthropic (`content/legal/privacy-notice.md:29`). The FAQ already tells visitors they can choose the provider (`src/i18n/locales/en/home.json:559`). "Runs in Fintela's cloud" would hide that; see Plan open decisions.
- The MCP half of the target is verified. The agent proposes only external strategies or studies, never creates anything and never spends tokens (`content/docs/ai/connect-your-agent.md:12-16`); the strategy code runs on the customer's server and is not uploaded (`src/i18n/locales/en/pages.json:1471-1472`); a person confirms each proposal in the app (`content/docs/ai/connect-your-agent.md:40-43`).

### 3.7 Four CTA labels for two actions: confirmed, and the site has seven

On the homepage:

- "Get started" in the header (`src/i18n/locales/en/header.json:16`, `src/components/Header/Header.tsx:543-545`, `src/components/Header/Header.tsx:664-666`).
- "Start Free Trial" in the hero (`src/i18n/locales/en/home.json:12`, `src/components/sections/HeroDiorama.tsx:108-110`).
- "Book a Walkthrough" in the hero (`src/i18n/locales/en/home.json:9`, `src/components/sections/HeroDiorama.tsx:111-113`).
- "Talk to us" in the FAQ aside (`src/i18n/locales/en/home.json:569`, `src/components/sections/FAQSection.tsx:53-55`).
- Plus a floating "Contact us" button (`src/i18n/locales/en/common.json:9`, `src/components/common/FloatingContactButton.tsx:103-107`).

Destinations:

- "Get started" and "Start Free Trial" both open the app's sign-up page. Any `NeuButton` without a target links there (`src/components/primitives/NeuButton.tsx:26-32`, `src/theme/neu.ts:22-28`).
- "Book a Walkthrough" and "Talk to us" both go to `/contact`.

Elsewhere on the site:

- "Book a walkthrough" in sentence case (`src/i18n/locales/en/solutions.json:37`, `src/i18n/locales/en/solutions.json:174`, `src/i18n/locales/en/solutions.json:437`).
- "Start free" (`src/i18n/locales/en/solutions.json:311`).
- "Book the walkthrough" on the contact form (`src/i18n/locales/en/pages.json:33`).
- "Get started" on pricing plans and the MCP page (`src/i18n/locales/en/pages.json:79`, `src/i18n/locales/en/pages.json:1321`).

Related findings:

- The solution pages already swap priority by audience, which the target asks for: desks get the walkthrough first, individuals the app (`src/solutions/registry.ts:61-62`, `src/pages/SolutionPage.tsx:48`, `src/pages/SolutionPage.tsx:113-116`).
- Spanish and Portuguese translate "walkthrough" as "demonstration" ("Reserve una demostración", `src/i18n/locales/es/home.json:9`; "Agende uma demonstração", `src/i18n/locales/pt/home.json:9`).
- A free trial does exist: the docs describe a per-person free trial allowance (`content/docs/features/tokens-and-billing.md:40`, `content/docs/getting-started/account-setup.md:120`). Marketing copy also calls it "the free tier" (`src/i18n/locales/en/solutions.json:424`). The label needs one name.

### 3.8 Logo marquee loops two logos: confirmed

- Two partners (`src/components/sections/TrustBar.tsx:10-13`), repeated 6 times and then doubled, so 24 tiles scroll on a 34-second infinite loop (`src/components/sections/TrustBar.tsx:21-26`, `src/components/sections/TrustBar.tsx:77`).
- Momento Capital is also the legal name of the entity behind Fintela, "Momento Capital, S.A.P.I. de C.V." (`src/seo/site.ts:56`). The relationship between that entity and the logo shown as a client is not stated in the repo.
- Both logo files are opaque rasters blended with `mix-blend-mode: multiply` to hide their white backgrounds (`src/components/sections/TrustBar.tsx:143-151`). They will need transparent or re-cut versions on a new canvas colour.

### 3.9 Hedgeweek award appears three ways: confirmed

- Hero badge linking to the award post (`src/components/sections/HeroDiorama.tsx:117-144`).
- A full band with photo, second badge, two paragraphs and a button (`src/components/sections/AwardSection.tsx:35-92`).
- Two of the five blog cards: the win announcement, which is pinned with `featured: true` (`content/blog/fintela-wins-hedgeweek-us-awards-2026.md:2`, `content/blog/fintela-wins-hedgeweek-us-awards-2026.md:9`), and the shortlisting post (`content/blog/Fintela_Hedgeweek_Announcement.md:2`).
- The homepage links to the award post three times, and the award band is a scroll-spy target (`src/pages/HomePage.tsx:23`).
- The band's first sentence already contains the fact the target eyebrow needs: winners "are decided by a vote of Hedgeweek's readers" (`src/i18n/locales/en/home.json:29`).

## 4. Design tokens

### Colour today

- Ground `#eeeeee`, sunken `#e2e2e2`, raised surface `#ffffff` (`src/theme/tokens.ts:132-134`).
- Text `#000000`, secondary `#525252`, subtle `#6b6b6b` (`src/theme/tokens.ts:58-61`, `src/index.css:164-166`).
- Controls and links are near-black `#1a1a1a` (`src/theme/tokens.ts:24`, `src/theme/tokens.ts:137`).
- Brand hues from the logo mark: yellow `#e8b923`, red `#f1353c`, blue `#1f6fb0` (`src/theme/tokens.ts:32`, `src/theme/tokens.ts:35`, `src/theme/tokens.ts:44`). The blue is retired everywhere except an unused page wash (`src/theme/tokens.ts:41-44`, `src/theme/theme.ts:112-114`).
- The accent is a three-stop gradient, yellow to red to black, used for rules, dots and headline accents (`src/theme/tokens.ts:177`, `src/theme/tokens.ts:181`).
- Dark bands use a black gradient `#000000` to `#141414` (`src/theme/tokens.ts:190`).
- Product mock-ups use a separate light app palette (`src/components/fintelligentDemo/appTheme.ts:1-57`), so previews are light today, not dark.

### Colour drift already in the repo

- `src/index.css:234-235` still paints the body `#edf0f5` with text `#0b1a33` before Emotion loads, while the token is `#eeeeee` (`src/theme/tokens.ts:132`).
- The global focus outline is navy `#16325c` (`src/index.css:263`) while the token accent is `#1a1a1a` (`src/theme/tokens.ts:137`).
- `index.html:7` sets `theme-color` to `#edf0f5`.
- The text selection colour is a gold that no token defines (`src/index.css:251`).

### Type today

- Two families: Inter variable for everything, JetBrains Mono for code and mono strips (`src/theme/tokens.ts:15-18`, `src/index.css:13-58`).
- Five weights in use across homepage components: 500, 600, 700, 800 and 900, with 800 for all display headings (`src/theme/theme.ts:51-65`).
- Hero `h1`: 2.6 / 3.5 / 4.6 rem, weight 800, line height 1.04 (`src/components/sections/HeroDiorama.tsx:53-56`).
- Section `h2`: 2 / 2.5 / 3.25 rem (`src/components/primitives/SectionHeader.tsx:107-110`).
- Body: 1 rem at 1.65 line height (`src/theme/theme.ts:85-88`); section descriptions 1 to 1.125 rem (`src/components/primitives/SectionHeader.tsx:133-134`).
- Eyebrows: 0.72 rem, weight 700, uppercase, 0.14 em tracking (`src/components/primitives/SectionHeader.tsx:83-86`).
- Line length is uncontrolled for left-aligned headers: the description takes the container's full width (`src/components/primitives/SectionHeader.tsx:136`), which the code itself measures at about 150 characters per line (`src/components/primitives/SectionHeader.tsx:26-31`). The pipeline band's description is left-aligned (`src/components/sections/WorkflowSection.tsx:58-64`).

### Spacing and breakpoints today

- Section vertical padding: `sm` 48/72 px, `md` 64/96 px, `lg` 80/128 px for phone/desktop (`src/components/primitives/Section.tsx:37-41`, at MUI's 8 px unit).
- Six of the eight bands use `lg`, so two adjacent bands put 256 px between their content on desktop.
- Container max width 1200 px (`src/components/primitives/Section.tsx:54`, `src/theme/tokens.ts:306`).
- Breakpoints are MUI defaults (0, 600, 900, 1200, 1536 px); `src/theme/theme.ts:12-103` defines no `breakpoints` key.
- Radii run 4 to 24 px (`src/theme/tokens.ts:212-226`).

### Gap to the target aesthetic

- Canvas: `#eeeeee` cool grey today; target a warm neutral near `#FAF9F6`. The neumorphic shadows depend on a grey ground: the token file states that on a near-white ground the highlight disappears (`src/theme/tokens.ts:91-98`). Moving to a warm near-white canvas therefore means retiring the paired-shadow look on marketing surfaces, not recolouring it.
- Text: pure `#000000` today; target near `#141413`. Computed contrast of `#141413` on `#FAF9F6` is about 17.5:1.
- Dark previews: target near `#0F1115`. Today's dark is pure black to `#141414` and the product mock-ups are light, so "dark product previews" is new work, not a token swap.
- Accent: three hues in a gradient today; target one. Computed contrast on `#FAF9F6`: brand red `#f1353c` about 3.75:1 (graphics and large text only), deep red `#c62828` about 5.3:1 (passes for body-size text). `#c62828` already exists as `palette.redDeep` (`src/theme/tokens.ts:36`).
- Type: two families and five weights today; target one family in two weights. JetBrains Mono would remain only inside product previews and code.
- Measure: uncontrolled today; target about 60 characters.
- Section rhythm: 256 px between band contents today; target about 120 px.

## 5. Copy inventory

### Where strings live

- All homepage UI strings are in `src/i18n/locales/<lng>/home.json`, with header, footer and shared strings in `header.json`, `footer.json` and `common.json`. Each file has the same keys in `en`, `es` and `pt` (CI-enforced, `.github/workflows/ci.yml:46-47`).
- `home.json` holds 678 strings. Roughly 290 belong to blocks the homepage no longer renders: `stack`, `quantum`, `fintelAgent`, `devExperience`, `advantage`, `tour`, `homeChat`, most of `capabilities` and unused `hero` and `workflow` keys (`src/i18n/locales/en/home.json:144-163`, `src/i18n/locales/en/home.json:216-476`, `src/i18n/locales/en/home.json:613-683`, `src/i18n/locales/en/home.json:1060-1159`). Some are still used by `/product/agentic-ai` and the `/home-demo` sandbox, so they cannot be deleted blindly.
- Hard-coded strings that bypass i18n: product tickers, strategy names and "TPE" in the mock-ups (`src/components/assemblyLine/Surfaces.tsx:132`, `src/components/assemblyLine/Surfaces.tsx:177-182`), the logo alt "Fintela" (`src/components/Header/Header.tsx:360`), partner names (`src/components/sections/TrustBar.tsx:11-12`) and the scroll-top label (`src/components/common/ScrollTop.tsx:32`).

### Meta, Open Graph and structured data

- Title: "Fintela | AI-Native Quant Platform for Trading Strategies" (`src/i18n/locales/en/pages.json:1268`; Spanish `src/i18n/locales/es/pages.json:1268`; Portuguese `src/i18n/locales/pt/pages.json:1268`).
- Description: "Build, backtest, optimize and deploy quantitative trading strategies in one cloud platform. Intelligent optimization and broker-connected execution." (`src/i18n/locales/en/pages.json:1269`).
- `og:title`, `og:description`, `twitter:*` reuse the title and description (`src/seo/Seo.tsx:150-162`). `og:type` is `website`, `og:locale` `en_US`.
- `og:image` is `/og/default.png` (`src/seo/site.ts:78`), a generated card whose text is "The AI-native quant platform" and "Build, backtest, optimize and live-trade quantitative portfolios in one workspace." (`scripts/og/render.mjs:91-94`). The card is a committed PNG and must be regenerated when positioning changes.
- Canonical is `https://fintela.io/` (`src/seo/site.ts:14-29`). There are no `hreflang` alternates.
- JSON-LD on the homepage: Organization, WebSite, SoftwareApplication (using the meta description) and FAQPage built from the visible FAQ (`src/pages/HomePage.tsx:54-59`, `src/pages/HomePage.tsx:111-116`).

### Hero strings

- `hero.headline` "Find Your", `hero.headlineAccent` "Edge." (`src/i18n/locales/en/home.json:10-11`); Spanish "Encuentre su ventaja." (`src/i18n/locales/es/home.json:10-11`); Portuguese "Encontre sua vantagem." (`src/i18n/locales/pt/home.json:10-11`).
- `hero.subtitlePrefix`, `hero.marketWords`, `hero.subtitleSuffix` (`src/i18n/locales/en/home.json:5-7`).
- `hero.ctaPrimary` "Start Free Trial" (`src/i18n/locales/en/home.json:12`); "Comience su prueba gratuita" (`src/i18n/locales/es/home.json:12`); "Comece seu teste grátis" (`src/i18n/locales/pt/home.json:12`).
- `hero.ctaContact` "Book a Walkthrough" (`src/i18n/locales/en/home.json:9`).
- `hero.awardAlt` (`src/i18n/locales/en/home.json:13`).
- Unused hero keys: `titleLine1`, `titleAccent`, `ctaSecondary`, `plateCaption`, `liveBadge`, `posterAlt`, `deviceAlt`, `stat.*` (`src/i18n/locales/en/home.json:3-4`, `src/i18n/locales/en/home.json:8`, `src/i18n/locales/en/home.json:14-23`).

### Platform band strings

- Header: `workflow.eyebrow`, `title`, `titleAccent`, `description` (`src/i18n/locales/en/home.json:40-43`).
- Highlights: `workflow.pipelineHighlights` (`src/i18n/locales/en/home.json:44-49`).
- Stations: `workflow.nodes.{dataClusters,strategies,studies,portfolios,connectBroker}.{label,sub,desc}` (`src/i18n/locales/en/home.json:53-87`). `fitness` and `riskManagers` nodes exist in copy but are not stations (`src/i18n/locales/en/home.json:63-67`, `src/i18n/locales/en/home.json:78-82`).
- Line labels, tokens, handoffs and card labels: `workflow.line.*` (`src/i18n/locales/en/home.json:89-128`).
- Demo: `agenticDemo.*` (`src/i18n/locales/en/home.json:954-1045`) and the app chrome it borrows from `fintelligentDemo.app.*` (`src/i18n/locales/en/home.json:698-855`).
- Capability items: `features.items.ai`, `features.items.dataAnalysis`, `features.items.bayesian` (`src/i18n/locales/en/home.json:170-185`) and link labels `capabilities.docsLabels.{agenticAi,dataExplorer,samplers}` (`src/i18n/locales/en/home.json:661-663`).

### Audiences band strings

- Header: `audiences.eyebrow`, `title`, `titleAccent`, `description` (`src/i18n/locales/en/home.json:575-578`).
- Cards: `useCases.audiences.{institutions,independents,researchDesks,advisors}.{title,description}` (`src/i18n/locales/en/home.json:483-520`), image alts and the pricing link under `audiences.items.*` (`src/i18n/locales/en/home.json:579-593`).
- Advantage tiles: `audiences.advantages.{infra,concurrent,provenance,reports}` (`src/i18n/locales/en/home.json:594-611`).

### MCP, award, insights, marquee and FAQ strings

- MCP: `yourAgent.*` (`src/i18n/locales/en/home.json:1160-1180`).
- Award: `award.*` (`src/i18n/locales/en/home.json:25-35`). Spanish and Portuguese leave the category name in English by design (`src/i18n/locales/es/home.json:27-28`).
- Insights: `insights.*` (`src/i18n/locales/en/home.json:1047-1059`).
- Marquee: `trustBar.title` (`src/i18n/locales/en/home.json:37`).
- FAQ: `faq.eyebrow` through `faq.aside.pricing` (`src/i18n/locales/en/home.json:524-572`); nine question and answer pairs at `src/i18n/locales/en/home.json:529-564`.

### Header, footer and shared strings

- Header: `src/i18n/locales/en/header.json:2-31`.
- Footer tagline "Create investment strategies across global markets, in a single, AI native, cloud, quant finance ecosystem." and columns (`src/i18n/locales/en/footer.json:2-36`).
- Cookie banner and contact widget: `src/i18n/locales/en/common.json:11-27`.

### Copy that the claims-language rules would reject

- "every result reproducible" (`src/i18n/locales/en/home.json:43`); also "with every backtest reproducible" (`src/i18n/locales/en/home.json:56`).
- "Is my strategy code secure?" answered "Yes." (`src/i18n/locales/en/home.json:554-555`).
- "is it safe?" (`src/i18n/locales/en/home.json:558`).
- "Keep your edge." and "your strategy stays on your servers" without the external-strategy qualifier (`src/i18n/locales/en/home.json:1163-1164`).
- "promote any validated portfolio to live execution" (`src/i18n/locales/en/home.json:86`): "validated" reads as approved.
- "Real or overfit, straight into your agent." (`src/i18n/locales/en/home.json:1169`): states a certainty the docs express as a four-level verdict (`content/docs/workflows/analyzing-results.md:208-219`).
- "Deploy to live trading" as a headline highlight (`src/i18n/locales/en/home.json:47`).
- Mixed register in Spanish: formal in the hero ("Encuentre su", `src/i18n/locales/es/home.json:10`) and informal in the MCP band ("Trae tu propio agente", `src/i18n/locales/es/home.json:1162`).

## 6. Reuse map

### Target section 1: Hero

- Reuse: `Section` (`src/components/primitives/Section.tsx:49`), `NeuButton` behaviour and link defaults (`src/components/primitives/NeuButton.tsx:21-36`), `useLoopClock` for a play-while-visible loop with a reduced-motion still frame (`src/lib/useLoopClock.ts:40-138`), the player bar and chapter controls from the demo stage (`src/components/fintelligentDemo/AgenticDemo.tsx:618`).
- Modify: `HeroDiorama` becomes a two-column hero with an award eyebrow in place of the badge image and a product loop in place of the video backdrop (`src/components/sections/HeroDiorama.tsx:21-148`).
- Remove: `RotatingWord` from the hero (`src/components/sections/HeroDiorama.tsx:91-93`); `HeroVideoBackdrop` and its two video rungs (`src/components/primitives/HeroVideoBackdrop.tsx:60`, `src/media/registry.ts:181-187`).
- New: the hero loop (hypothesis to code to trial fan to verdict).

### Target section 2: Proof and trust

- Reuse: partner logo data (`src/components/sections/TrustBar.tsx:10-13`), ceremony photo and white badge (`src/media/registry.ts:197`, `src/components/sections/AwardSection.tsx:13`), `MediaWell` (`src/components/primitives/MediaWell.tsx:1`).
- Modify: `TrustBar` becomes two static logos; `AwardSection` shrinks to one compact band with one sentence and one link.
- Remove: the marquee belt and keyframes (`src/components/sections/TrustBar.tsx:21-26`, `src/components/sections/TrustBar.tsx:77-94`); the award `SectionHeader`, second paragraph and caption (`src/components/sections/AwardSection.tsx:36`, `src/components/sections/AwardSection.tsx:82-83`).
- New: three trust anchors, and the pages they link to (none exist; see section 8).

### Target section 3: How it works

- Reuse: the sticky-scroll mechanics of `AssemblyLine` (`src/components/assemblyLine/AssemblyLine.tsx:465-518`) and its three layout modes for pinned, wide-flow and stacked (`src/components/assemblyLine/AssemblyLine.tsx:19-30`); the app-surface primitives in `src/components/assemblyLine/Surfaces.tsx:19` onward and `src/components/fintelligentDemo/appTheme.ts:1`.
- Modify: three steps instead of five stations; the Studies and Portfolios surfaces must stop headlining best Sharpe (`src/components/assemblyLine/Surfaces.tsx:128-182`).
- Move: the five-station pipeline, intact, to a product page. Its copy moves with it (`src/i18n/locales/en/home.json:52-127`).
- New: the validation comparison toggle.

### Target section 4: Two ways to work with AI

- Reuse: `NeuPanel` tiles and `BandHeader` (`src/components/primitives/NeuPanel.tsx:1`, `src/components/primitives/BandHeader.tsx:19`); existing destinations `/product/agentic-ai` and `/product/mcp` (`src/App.tsx:360-363`).
- Modify: `YourAgentSection` becomes a two-column comparison (`src/components/sections/YourAgentSection.tsx:27-63`).
- Move: the 40-second agentic demo off the homepage. It is already the hero of `/product/agentic-ai` (`src/pages/AgenticAiPage.tsx:22`, `src/components/fintelligentDemo/AgenticDemoLazy.tsx:16-21`), so nothing is lost.
- Move: the three MCP tiles are already covered in more depth on `/product/mcp` (`src/pages/McpPage.tsx:168-178`).

### Target section 5: Who it's for

- Reuse: audience order, paths and copy keys (`src/components/sections/InstitutionalSection.tsx:26`, `src/solutions/registry.ts:18-34`).
- Modify: `InstitutionalSection` becomes one compact row of four text links, one sentence each, on the light canvas.
- Remove from the homepage: four photographs (`src/media/registry.ts:206-211`) and the four advantage tiles (`src/components/sections/InstitutionalSection.tsx:165-191`).
- Move: the advantage tiles to the solution pages, where three of the four ideas already appear (`src/i18n/locales/en/solutions.json:30-36`).

### Target section 6: Research, FAQ and final CTA

- Reuse: `FAQList` unchanged (`src/components/sections/FAQList.tsx:20`); `ClosingSection` for the final CTA (`src/components/sections/ClosingSection.tsx:40-71`); blog card components (`src/components/sections/InsightsSection.tsx:12`).
- Modify: `InsightsSection` must select research posts explicitly instead of taking the pinned and newest posts (`src/components/sections/InsightsSection.tsx:16-20`); `FAQSection` loses the sticky aside and drops to five items (`src/components/sections/FAQSection.tsx:38-78`, `src/lib/faqOrder.ts:3-13`).
- Constraint: `FAQ_KEYS` and `orderFaq` are shared with the four solution pages (`src/solutions/registry.ts:57-58`, `src/solutions/registry.ts:82`). The four questions cut from the homepage must stay in the catalog.
- Move: the four cut questions to the solution pages (already there) and to `/pricing` or docs.

### Where moved content should live

- Five-stage pipeline: a new product page (suggested `/product/platform`). `content/docs/workflows/end-to-end-workflow.md:1-12` is the docs-level version and the natural "implementation" link from that page.
- Sampler detail ("Seven samplers, TPE by default"): already on `/product/samplers` (`src/pages/SamplersPage.tsx:31-39`).
- Data library item: `/docs/data-explorer` (already its link target, `src/components/sections/WorkflowSection.tsx:17`).
- Signal export ("seed") FAQ: stays on the solution pages (`src/solutions/registry.ts:82`, `src/solutions/registry.ts:97`).
- Award story: the award blog post (`src/lib/award.ts:5`).

### Removed from the homepage and not needed elsewhere

- `RotatingWord` has no other consumer once the hero drops it; its own comment names only the retired `HeroSection` (`src/components/primitives/RotatingWord.tsx:38`).
- `HeroVideoBackdrop` and the two hero video files, 2.1 MB and 1.1 MB.
- The `useAudience` plumbing on the homepage: `setAudience` has no caller anywhere, so FAQ ordering only ever responds to a `?for=` URL parameter (`src/lib/audience.ts:13-17`, `src/components/sections/FAQSection.tsx:25`).

### Dead code found along the way (not part of the redesign, listed so it is not mistaken for live)

- Nine section components under `src/components/sections/` are imported by no other file: `AdvantageSection`, `DataLibrarySection`, `DevExperienceSection`, `FeaturesSection`, `FintelAgentSection`, `HeroSection`, `PlatformStackSection`, `QuantumSamplersSection` and `UseCasesSection`.
- A parallel copy of the homepage at `/home-demo`, marked temporary and excluded from prerender and sitemap (`src/App.tsx:71-74`, `src/App.tsx:346-347`). It has its own nine component files under `src/components/homeDemo/`, imported at `src/pages/HomeDemoPage.tsx:5-11`.
- `three` and `@types/three` (`package.json:28`).

## 7. Motion and performance

### Animations on the homepage today

- Hero background video, 36 s loop, attached after `load` and idle, skipped below 600 px, under reduced motion and on constrained connections (`src/components/primitives/HeroVideoBackdrop.tsx:37-43`, `src/components/primitives/HeroVideoBackdrop.tsx:74-98`).
- Rotating word, 2 s interval, 0.65 s crossfade (`src/components/primitives/RotatingWord.tsx:42`, `src/components/primitives/RotatingWord.tsx:186`).
- Scroll-pinned pipeline with a scroll-driven track fill and trial counter, plus four infinite CSS loops for dashes, pulses and rings (`src/components/assemblyLine/AssemblyLine.tsx:38-55`, `src/components/assemblyLine/AssemblyLine.tsx:465-494`).
- Agentic demo: a 40 s scripted loop on `requestAnimationFrame` with a simulated cursor, play/pause and chapter seek (`src/components/fintelligentDemo/agenticScript.ts:20`, `src/components/fintelligentDemo/AgenticDemo.tsx:259`, `src/lib/useLoopClock.ts:81-89`).
- Logo marquee, 34 s infinite (`src/components/sections/TrustBar.tsx:77`).
- Fade-and-rise entrance on nearly every block, 0.6 s, via `AnimateOnScroll` (`src/components/common/AnimateOnScroll.tsx:81-89`).
- Scroll progress bar and scroll-to-top button (`src/components/common/ScrollProgressBar.tsx:17`, `src/components/common/ScrollTop.tsx:6`).
- Card hover effects in the audiences band (`src/components/sections/InstitutionalSection.tsx:224-229`).

That is seven distinct motion systems against a target of three moments.

### Bundle weight (from `dist/`, gzip in brackets)

- Eager JavaScript for the homepage: 844,754 B (266,334 B). It is four chunks: app entry 270,080 B (84,437 B), MUI 280,528 B (87,027 B), React and router 228,789 B (72,961 B), i18n 65,357 B (21,909 B). The split is defined in `vite.config.ts:79-89`.
- The app entry chunk contains every homepage section including the pipeline, plus all seven English catalogs (`src/i18n/index.ts:20-33`).
- Agentic demo, lazy: 67,806 B (23,155 B) across six chunks.
- Global CSS: 5,419 B (1,487 B). Most styling is Emotion CSS inlined in the HTML.
- Homepage HTML document: 298,638 B (43,043 B).
- Animation code cannot be isolated inside the entry chunk without a bundle analyzer, which is not installed. As a proxy, the pipeline is about 1,126 source lines (`src/components/assemblyLine/`) and the demo family about 3,500 (`src/components/fintelligentDemo/`).
- No animation library is shipped. The target animations can be built the same way and should not need one.

### Media weight

- Hero video rungs: 2,112,258 B (1280 wide) and 1,116,260 B (960 wide).
- Hero poster: AVIF rungs of 12,269, 20,980 and 34,944 B.
- Header logo: 526,527 B PNG, preloaded on every route, displayed at 17 to 22 px tall (`src/components/Header/Header.tsx:352`, `src/components/Header/Header.tsx:358-364`). This is the largest single avoidable request on the page.
- Hero award badge: 44,418 B PNG, preloaded.
- Both partner logos are preloaded although they sit near the bottom of the page.
- Inter (Latin) variable font: 48,256 B, preloaded.

### Likely LCP element

- The hero poster image is designed to be the LCP element: it is in the prerendered HTML with `fetchpriority="high"` and a matching preload (`src/components/primitives/HeroVideoBackdrop.tsx:50-58`, `src/components/primitives/HeroVideoBackdrop.tsx:163-171`).
- On narrow viewports the `h1` text may be the LCP instead. [unverified] No Lighthouse or field data was collected in this session.
- In the target design the hero has no full-bleed image, so LCP becomes the `h1` text or the first frame of the product loop. The loop must therefore render a static first frame in the prerendered HTML.

### Reduced-motion handling today

- Global: all animation and transition durations collapse to 0.01 ms (`src/index.css:282-291`).
- Rotating word stops (`src/components/primitives/RotatingWord.tsx:97-100`).
- Hero video is never attached (`src/components/primitives/HeroVideoBackdrop.tsx:75`).
- Entrances are skipped (`src/components/common/AnimateOnScroll.tsx:61`).
- Pipeline: the study shows finished and station jumps do not smooth-scroll (`src/components/assemblyLine/AssemblyLine.tsx:503`, `src/components/assemblyLine/AssemblyLine.tsx:507`). The band still pins.
- Demo: starts paused on a defined still frame and plays only if the visitor presses play (`src/lib/useLoopClock.ts:29-39`, `src/components/fintelligentDemo/agenticScript.ts:22-23`).
- Marquee collapses to a static wrapped row of the two real logos (`src/components/sections/TrustBar.tsx:89-94`, `src/components/sections/TrustBar.tsx:127`).

The existing patterns are sound and the still-frame pattern in `useLoopClock` is exactly what the target requires.

## 8. Links and SEO risk

### Anchors on the homepage today

- `#hero` (`src/components/sections/HeroDiorama.tsx:27`), `#platform` (`src/components/sections/WorkflowSection.tsx:57`), `#capabilities` (`src/components/sections/WorkflowSection.tsx:90`), `#for-funds` (`src/components/sections/InstitutionalSection.tsx:140`), `#your-agent` (`src/components/sections/YourAgentSection.tsx:31`), `#award` (`src/components/sections/AwardSection.tsx:35`), `#insights` (`src/components/sections/InsightsSection.tsx:45`), `#faq` (`src/components/sections/FAQSection.tsx:29`), `#content` (`src/pages/HomePage.tsx:119`).

### Who links to them

- Footer "Platform" to `/#hero`, "Capabilities" to `/#capabilities`, "FAQ" to `/#faq` (`src/components/Footer/Footer.tsx:63`, `src/components/Footer/Footer.tsx:75`, `src/components/Footer/Footer.tsx:159`).
- The header has no in-page links today; all its items are routes (`src/components/Header/Header.tsx:66-78`).
- Legacy hashes are remapped: `use-cases`, `features`, `developers`, `quantum`, `advantage` (`src/pages/HomePage.tsx:30-36`), and `fintelligent`, `fintelagent` redirect to `/product/agentic-ai` (`src/pages/HomePage.tsx:39-42`).
- A code comment says these hashes are in the app, in mail and in search results (`src/pages/HomePage.tsx:25-29`). [unverified] The repo cannot confirm external inbound links.
- A sales-link pattern `/?for=teams#for-funds` is documented (`src/lib/audience.ts:10`).

### Risk if ids change

- `#platform`, `#capabilities`, `#for-funds`, `#award`, `#insights`, `#your-agent` would all disappear or change meaning in a six-section page.
- Mitigation already exists in the codebase: add each retired id to `HASH_ALIASES` or `PAGE_REDIRECTS` (`src/pages/HomePage.tsx:30-42`) and update `SCROLL_SECTIONS` (`src/pages/HomePage.tsx:23`). Hashes never reach the server, so the CloudFront router needs no change for anchors.
- `#capabilities` should redirect to the new product page that receives the pipeline, the same way `fintelligent` already redirects to a route.

### Routes

- Existing routes are unaffected by the redesign: `src/App.tsx:345-385`.
- New pages (pipeline product page, methodology, security) each need five coordinated edits or the build fails: a route in `src/App.tsx:344-386`, an entry in the `Pages` interface (`src/App.tsx:285-304`), an eager import for the prerenderer (`src/entry-server.tsx:40-58`), a line in `STATIC_ROUTES` so the page is prerendered and in the sitemap (`src/seo/routes.ts:12-29`), and the lazy-module map used for modulepreload (`scripts/prerender.mjs:43`).
- Each new page must render exactly one `h1`, a title, a description, a canonical and an OG image, or `scripts/check-seo-output.mjs:184-191` fails the build.
- Any new redirect must be mirrored in `infra/cloudfront/router.js:30-32`, which is applied to CloudFront by hand and is outside the automatic deploy (`.github/workflows/deploy.yml:34-36`).

### Structured data

- FAQPage must mirror the visible questions (`src/pages/HomePage.tsx:54-59`). Reducing to five FAQs changes it automatically, because it is built from the same list.
- SoftwareApplication's description is the homepage meta description (`src/pages/HomePage.tsx:114`); it changes when the meta description does.
- No Offer, rating or review markup exists, by design (`src/seo/jsonld.ts:18-21`). Do not add any with the redesign.

### Sitemap and indexing

- The sitemap is generated from `STATIC_ROUTES` plus content (`scripts/prerender.mjs:353-391`). The homepage URL does not change.
- The title and description will change. Expect a period of ranking fluctuation for the current title's terms ("AI-Native Quant Platform for Trading Strategies"). [unverified] No Search Console data is available in the repo.
- Heavy text moves off the homepage: the prerendered page currently carries the full pipeline, demo script and nine FAQ answers as indexable text. Moving it one click deeper keeps it indexable only if the destination pages are prerendered and internally linked.
- `robots.txt` needs no change (`public/robots.txt:5-10`).

## 9. Conversion tracking

### What exists

- Microsoft Clarity session recording and heatmaps, production host only, after consent (`index.html:68-107`).
- One custom event, `calendly_event_scheduled`, fired when a Calendly booking completes on `/contact` (`src/contact/BookWalkthrough.tsx:36-40`). The booking widget only renders when `VITE_CALENDLY_URL` is set (`src/pages/ContactPage.tsx:125`, `.github/workflows/deploy.yml:84-86`).

### What does not exist

- No click event on any CTA. "Get started", "Start Free Trial", "Book a Walkthrough" and "Talk to us" are plain links (`src/components/primitives/NeuButton.tsx:21-36`).
- No scroll-depth or section-view event.
- No event on contact form submission (`src/contact/api.ts:76-91`).
- No UTM or source parameter on the sign-up link, which goes to a different origin, `app.fintela.io` (`src/theme/neu.ts:22-28`). A sign-up cannot be attributed to a homepage button from this repo.
- No event for the demo's play, pause or chapter controls.

### Consequences for a before-and-after comparison

- Clarity's automatic click and scroll heatmaps may provide a rough baseline. [unverified] That depends on the Clarity project's configuration and retention, which are outside the repo.
- Only consenting visitors are measured, so every number is a sample.
- If the redesign ships before named events exist, there is no clean "before". The plan therefore proposes adding a small set of named events before any visible change (see Plan, Phase A, task A0).

## 10. Accessibility

### Heading order

- Verified from the prerendered page: one `h1` ("Find Your Edge."), six `h2` and thirty `h3`, with no skipped levels.
- FAQ questions are `h3` inside buttons (MUI accordion, `src/components/sections/FAQList.tsx:26-38`).
- The `h1` is not descriptive, which is the same problem as finding 3.1.
- CI enforces exactly one `h1` per page (`scripts/check-seo-output.mjs:186`).

### Contrast

- Body secondary text `#525252` on ground `#eeeeee`: about 6.7:1 (computed).
- The token file documents its own limits: the red accent is 3.95:1 on white and "never small body text"; the gradient's yellow stop is 2.2:1 (`src/theme/tokens.ts:46-48`, `src/theme/tokens.ts:99-107`).
- Hero: a white headline and a yellow-red-black gradient accent sit over the same moving video, with text shadows added because the video pans over light frames (`src/components/sections/HeroDiorama.tsx:57-61`, `src/components/sections/HeroDiorama.tsx:66-71`). A backdrop dark enough for white text is too dark for the gradient's black stop, and the reverse. Measured contrast is [unverified]; the design cannot pass at every frame.
- Hero subhead is white at 88% opacity over video (`src/components/sections/HeroDiorama.tsx:81`). [unverified]
- Links on dark bands are red `#f1353c` on black: about 5.3:1 (computed) (`src/index.css:196`).

### Keyboard access

- Skip link to `#content` (`src/components/Header/Header.tsx:299`).
- Focus rings are defined globally and per component (`src/index.css:262-265`, `src/theme/theme.ts:126-129`), in two different colours (see section 4).
- Audience cards are whole-card links with a visible focus ring (`src/components/sections/InstitutionalSection.tsx:230-234`).
- Marquee: only the first two logos are focusable; the 22 repeats are `aria-hidden` with `tabIndex={-1}` (`src/components/sections/TrustBar.tsx:107-108`).
- Pipeline stations and demo chapters are reachable by keyboard and labelled (`src/components/assemblyLine/AssemblyLine.tsx:225`, `src/i18n/locales/en/home.json:956-958`).

### Moving content without a pause control

- The hero video loops indefinitely with no control; it is `aria-hidden` and has no `controls` (`src/components/primitives/HeroVideoBackdrop.tsx:147`, `src/components/primitives/HeroVideoBackdrop.tsx:190-196`).
- The rotating word has no control (`src/components/primitives/RotatingWord.tsx:75-116`).
- The marquee pauses on hover and focus only, which leaves touch users without a way to stop it (`src/components/sections/TrustBar.tsx:84-85`).
- These three are WCAG 2.2.2 (Pause, Stop, Hide) concerns. All three are removed by the target design.
- The demo has play and pause, which is the pattern to keep (`src/i18n/locales/en/home.json:956-957`).

### Alt text

- The prerendered homepage has 32 images; none lacks an `alt` attribute; 10 have empty alt, including the decorative hero poster (`src/components/primitives/HeroVideoBackdrop.tsx:183`).
- Audience photos have descriptive, translated alts (`src/i18n/locales/en/home.json:582-591`).
- The award photo alt names a real person (`src/i18n/locales/en/home.json:32`); keep it accurate if the photo is re-cropped.
- Partner logo alts are the company names (`src/components/sections/TrustBar.tsx:135`).

### Other

- `<html lang>` follows the active language (`src/i18n/index.ts:68-75`).
- The scroll-to-top button's label is hard-coded English (`src/components/common/ScrollTop.tsx:32`).
- The site forces a light colour scheme (`src/index.css:223`, `src/theme/theme.ts:110`). The target's dark product previews will need their own explicit colours rather than relying on system dark mode.
- Forced-colours support is already written into the button, panel and accordion recipes (`src/theme/neu.ts:150`, `src/components/sections/FAQList.tsx:76-79`). New components should keep it.

## Claims verification

These are the claims the brief said must be confirmed before they appear in planned copy.

### Confirmed in the repo

- Seven samplers and the exact list: TPE, CMA-ES, Random, QMC, NSGA-II, QAOA, Q-Kernel (`content/docs/configuration/sampler-selection.md:13-16`, `content/docs/configuration/sampler-selection.md:63-75`). Five are classical; QAOA and Q-Kernel are experimental and run on a simulator (`content/docs/configuration/sampler-selection.md:131`, `content/docs/configuration/sampler-selection.md:149-153`).
- CMA-ES: confirmed, recommended for continuous parameters and 1,000 to 10,000 trials (`content/docs/configuration/sampler-selection.md:68`, `content/docs/configuration/sampler-selection.md:93`).
- Caveat on "Bayesian search with seven samplers": only TPE and Q-Kernel are Bayesian. CMA-ES is evolutionary, NSGA-II genetic, QMC and Random are not model-based (`content/docs/configuration/sampler-selection.md:67-72`, `content/docs/configuration/sampler-selection.md:151`). The default proof line is inaccurate as written.
- Train, validation and out-of-sample splits: confirmed. Out of sample is on by default, held back and never optimized on (`content/docs/registries/studies.md:302-304`). The optimizer only sees train (`src/i18n/locales/en/pages.json:1120`). There is no walk-forward option (`content/docs/registries/studies.md:311`).
- Strategies are plain Python functions: confirmed (`src/i18n/locales/en/home.json:61`, `content/docs/registries/registries.md:239`).
- Transaction-cost modeling: confirmed in page copy with specific rates, 10 bps US equities, 30 bps crypto, 5 bps FX, and a frictionless option (`src/i18n/locales/en/pages.json:1096-1107`), and in the API docs (`content/docs/api/api-baskets.md:205-213`). Slippage in the backtest engine is not documented beyond a one-line table entry (`content/docs/registries/studies.md:532`).
- Configurable risk limits: confirmed. Ten built-in rules including stop loss, max drawdown circuit breaker, sector, country and position caps, plus rule-based, custom-code and external kinds (`content/docs/registries/risk-managers.md:30-35`, `content/docs/registries/risk-managers.md:73`). These apply to backtests and studies.
- What the overfitting report contains: confirmed. A per-candidate verdict of Well Trained, Borderline, Overfit Risk or Insufficient Data, built from deflated Sharpe, the study's probability of backtest overfitting (PBO) and train-to-out-of-sample degradation (`content/docs/workflows/analyzing-results.md:208-219`); a study-level verdict from PBO (`content/docs/workflows/analyzing-results.md:221-235`); a luck threshold, Sharpe distribution versus luck and rank stability (`content/docs/workflows/analyzing-results.md:247-252`).
- Named AI clients for MCP: confirmed for exactly two, Claude Code and claude.ai (`content/docs/ai/connect-your-agent.md:12-13`, `content/docs/ai/connect-your-agent.md:54`, `content/docs/ai/connect-your-agent.md:68`). The product page says "Claude comes first. Support for more agents is on the way." (`src/i18n/locales/en/pages.json:1508-1511`). No other client may be named.
- A person approves every MCP run: confirmed (`content/docs/ai/connect-your-agent.md:14-16`, `content/docs/ai/connect-your-agent.md:40-43`).

### Partly confirmed: wording must be narrowed

- Point-in-time data: confirmed only for index membership when building a universe ("Index membership: point in time universes", `content/docs/registries/asset-groups.md:303-316`). A saved group is a frozen snapshot that does not track the index afterwards (`content/docs/registries/asset-groups.md:320`). The strategy validation sample is explicitly not point in time (`content/docs/registries/strategies.md:413`). No doc claims point-in-time fundamentals or prices. "Point-in-time data snapshots" as a general claim is not supported.
- Tenant isolation: the docs say data is scoped to the organization (`content/docs/getting-started/architecture.md:176-179`), that user code runs in an isolated space with no access to Fintela's systems (`content/docs/getting-started/architecture.md:147-150`), and that the API treats another organization's resources as non-existent (`content/docs/getting-started/architecture.md:188-190`). The words "tenant", "SOC 2", "ISO 27001" and "penetration test" do not appear anywhere in `content/`. "Organization-scoped access" is supportable; "tenant isolation" as an infrastructure or certification claim is not.
- IP architecture: verified for external mode, where code and data stay on the customer's infrastructure (`content/docs/getting-started/architecture.md:152-158`). For strategies written in the app, the code is stored and run by Fintela (`content/docs/registries/registries.md:239`). Any "your strategy stays on your servers" line must say it applies to external strategies.
- Regime analysis: not a feature. The only references are a date preset called "After COVID" (`content/docs/registries/studies.md:301`), rolling windows described as usable for "regime checks" (`content/docs/workflows/analyzing-results.md:79`) and "regime" used to mean cost versus cost-free (`src/i18n/locales/en/pages.json:1110`). Do not claim regime analysis.

### Not confirmed: keep out of copy until you supply evidence

- Reproducible research: contradicted for the default path. There is no seed setting, and TPE, CMA-ES, Random, QMC and NSGA-II explore a different sequence on every run (`content/docs/configuration/sampler-selection.md:303-312`, `src/i18n/locales/en/pages.json:693-695`). What is documented is that every trial is saved (`content/docs/getting-started/architecture.md:194-195`), a study freezes a snapshot at launch (`content/docs/registries/studies.md:566`) and a promoted portfolio is an immutable snapshot (`content/docs/registries/promoted-portfolios.md:12`). "Recorded and auditable" is supportable; "reproducible" is not.
- Cryptographic hashing and timestamps: asserted in homepage and solutions copy (`src/i18n/locales/en/home.json:555`, `src/i18n/locales/en/solutions.json:103`) but absent from every file in `content/docs/`.
- Monte Carlo: not referenced, per the brief. Note that the sampler "QMC (Quasi Monte Carlo)" is a search method, not a Monte Carlo simulation feature (`content/docs/configuration/sampler-selection.md:70`); avoid expanding the acronym on marketing pages.
- Customer quotes: none exist in the repo.
- Independent customer status of the two logos: not stated in the repo (see 3.8).
