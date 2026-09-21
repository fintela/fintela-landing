#!/usr/bin/env node
/**
 * Renders the site's Open Graph / social cards (1200x630) into `public/og/`.
 *
 * LOCAL TOOL — run it by hand, commit the outputs. It is deliberately not part
 * of `npm run build`: the outputs are static brand assets that change only when
 * the copy or the brand does, and CI must never need a browser to ship the site.
 *
 *   node scripts/og/render.mjs            # writes public/og/*.png (or .jpg, see below)
 *   node scripts/og/render.mjs --only blog,docs
 *
 * Text cards are PNG. A card with a photo background is written as JPEG instead
 * whenever its PNG would exceed PNG_BUDGET — today the three solution cards — so
 * whatever links `public/og/` (src/seo) must use the extension that exists.
 *
 * Each card is an inline HTML document styled with the design tokens read from
 * `src/theme/tokens.ts` (so a palette change re-renders consistently), typeset in
 * Inter (Google Fonts when online, the system stack otherwise), and screenshotted
 * with Playwright. The wordmark and the solution hero stills are embedded as
 * data URIs so the page needs no server.
 *
 * Playwright is imported from a sibling project's node_modules rather than added
 * to this repo's dependencies: it is ~300 MB of browser binaries for a script
 * that runs a few times a year. Point PLAYWRIGHT_MODULE at any installed copy
 * (`.../node_modules/playwright/index.mjs`) if the default path is not present
 * on your machine.
 */
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PLAYWRIGHT_MODULE =
  process.env.PLAYWRIGHT_MODULE ||
  '/Users/ivan-buda/projects/montania/auto-facturacion/node_modules/playwright/index.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = path.join(ROOT, 'public/og');
const WIDTH = 1200;
const HEIGHT = 630;
/** Above this a card is re-encoded as JPEG (photo backgrounds), see `main()`. */
const PNG_BUDGET = 250 * 1024;

// ---- tokens -------------------------------------------------------------------

/**
 * Pulls `key: '#hex'` values out of src/theme/tokens.ts with a regex. The file is
 * TypeScript, which Node can't import without a build step; the tokens are plain
 * string literals, so a literal match is enough and keeps this script dependency-free.
 */
async function loadTokens() {
  const source = await readFile(path.join(ROOT, 'src/theme/tokens.ts'), 'utf8');
  const read = (name) => {
    const match = new RegExp(`\\b${name}:\\s*'([^']+)'`).exec(source);
    if (!match) throw new Error(`token "${name}" not found in src/theme/tokens.ts`);
    return match[1];
  };
  return {
    navyDeep: read('navyDeep'),
    gold: read('gold'),
    goldDeep: read('goldDeep'),
    text: read('text'),
    textMuted: read('textMuted'),
    ground: read('ground'),
  };
}

const dataUri = async (file, type) =>
  `data:${type};base64,${(await readFile(path.join(ROOT, file))).toString('base64')}`;

// ---- cards --------------------------------------------------------------------

/**
 * Card copy. Light cards reuse the page hero strings from the en catalogs; the
 * solution cards use `badge` + `title` + `titleAccent` from solutions.json and the
 * same hero still the page renders, so a share preview matches the page it opens.
 */
async function loadCards() {
  const pages = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/locales/en/pages.json'), 'utf8'));
  const solutions = JSON.parse(
    await readFile(path.join(ROOT, 'src/i18n/locales/en/solutions.json'), 'utf8'),
  );
  const solution = (key, slug, still) => ({
    name: `solutions-${slug}`,
    kind: 'photo',
    eyebrow: solutions[key].badge,
    title: `${solutions[key].title} ${solutions[key].titleAccent}`,
    still,
  });
  return [
    {
      name: 'default',
      kind: 'light',
      title: 'The AI-native quant platform',
      subtitle: 'Build, backtest, optimize and live-trade quantitative portfolios in one workspace.',
    },
    { name: 'blog', kind: 'light', title: 'Blog', subtitle: pages.blog.hero.subtitle },
    {
      name: 'docs',
      kind: 'light',
      title: 'Documentation',
      subtitle: 'Guides and reference for building, optimizing and trading portfolios on Fintela.',
    },
    {
      name: 'pricing',
      kind: 'light',
      title: 'Pricing',
      subtitle: 'Every plan includes the full platform. Start free, scale to Institutional.',
    },
    {
      name: 'contact',
      kind: 'light',
      title: 'Contact',
      subtitle: pages.contact.hero.subtitle,
    },
    solution('funds', 'hedge-funds', 'src/assets/media/solutions/funds-hero.jpg'),
    solution('teams', 'quant-teams', 'src/assets/media/solutions/teams-hero.jpg'),
    solution('independents', 'independent-quants', 'src/assets/media/solutions/independents-hero.jpg'),
  ];
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * One HTML document per card. Both variants share the frame: wordmark or mark
 * top-left, a gold rule, the title, the domain bottom-left. Light cards sit on the
 * soft-UI ground so they read like the site; photo cards put a navy gradient over
 * the hero still so white type stays legible on any crop.
 */
function cardHtml(card, t, assets) {
  const light = card.kind === 'light';
  const titleSize = card.title.length > 40 ? 60 : card.title.length > 24 ? 72 : 96;
  const body = light
    ? `
      <img class="wordmark" src="${assets.wordmark}" alt="" />
      <div class="stack">
        ${card.eyebrow ? `<div class="eyebrow">${escapeHtml(card.eyebrow)}</div>` : ''}
        <h1 style="font-size:${titleSize}px">${escapeHtml(card.title)}</h1>
        <div class="rule"></div>
        ${card.subtitle ? `<p class="sub">${escapeHtml(card.subtitle)}</p>` : ''}
      </div>
      <img class="mark-faint" src="${assets.mark}" alt="" />
      <div class="domain">fintela.io</div>`
    : `
      <img class="still" src="${assets.stills[card.name]}" alt="" />
      <div class="scrim"></div>
      <div class="brand"><img class="mark" src="${assets.mark}" alt="" /><span>Fintela</span></div>
      <div class="stack">
        ${card.eyebrow ? `<div class="eyebrow">${escapeHtml(card.eyebrow)}</div>` : ''}
        <h1 style="font-size:${titleSize}px">${escapeHtml(card.title)}</h1>
        <div class="rule"></div>
      </div>
      <div class="domain">fintela.io</div>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    position: relative;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: ${light ? t.text : '#ffffff'};
    background: ${light ? `linear-gradient(180deg, #f6f8fb 0%, ${t.ground} 100%)` : t.navyDeep};
    -webkit-font-smoothing: antialiased;
  }
  .still { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .scrim {
    position: absolute; inset: 0;
    background:
      linear-gradient(90deg, rgba(11,26,51,0.94) 0%, rgba(11,26,51,0.82) 55%, rgba(11,26,51,0.45) 100%),
      linear-gradient(180deg, rgba(11,26,51,0.2) 0%, rgba(11,26,51,0.6) 100%);
  }
  .wordmark { position: absolute; top: 64px; left: 80px; height: 56px; width: auto; }
  .brand { position: absolute; top: 64px; left: 80px; display: flex; align-items: center; gap: 14px;
    font-weight: 700; font-size: 30px; letter-spacing: 0.02em; text-transform: uppercase; }
  .brand .mark { height: 44px; width: 44px; }
  .stack { position: absolute; left: 80px; right: 80px; top: 50%; transform: translateY(-50%); padding-top: 28px; }
  .eyebrow { font-weight: 600; font-size: 24px; letter-spacing: 0.08em; text-transform: uppercase;
    color: ${light ? t.goldDeep : t.gold}; margin-bottom: 18px; }
  h1 { font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; max-width: 1000px; }
  .rule { width: 96px; height: 6px; border-radius: 3px; margin: 28px 0;
    background: linear-gradient(135deg, ${t.gold} 0%, ${t.goldDeep} 100%); }
  .sub { font-weight: 500; font-size: 30px; line-height: 1.35; max-width: 900px; color: ${t.textMuted}; }
  .domain { position: absolute; left: 80px; bottom: 56px; font-weight: 600; font-size: 26px;
    letter-spacing: 0.02em; color: ${light ? t.textMuted : 'rgba(255,255,255,0.72)'}; }
  .mark-faint { position: absolute; right: -40px; bottom: -60px; width: 420px; height: 420px; opacity: 0.08; }
</style></head><body>${body}</body></html>`;
}

// ---- render -------------------------------------------------------------------

async function main() {
  const only = (() => {
    const i = process.argv.indexOf('--only');
    return i === -1 ? null : new Set(process.argv[i + 1].split(','));
  })();

  const { chromium } = await import(pathToFileURL(PLAYWRIGHT_MODULE).href);
  const [tokens, cards] = await Promise.all([loadTokens(), loadCards()]);
  const assets = {
    wordmark: await dataUri('src/assets/logos/fintela_logo_2.png', 'image/png'),
    mark: await dataUri('src/assets/logos/fintela_logo.png', 'image/png'),
    stills: {},
  };
  for (const card of cards) {
    if (card.still) assets.stills[card.name] = await dataUri(card.still, 'image/jpeg');
  }

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

  for (const card of cards) {
    if (only && !only.has(card.name)) continue;
    // networkidle waits for the Google Fonts stylesheet; offline it fails fast and
    // the system stack renders instead, which is acceptable for a local preview.
    await page.setContent(cardHtml(card, tokens, assets), { waitUntil: 'networkidle' }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);

    const pngPath = path.join(OUT_DIR, `${card.name}.png`);
    const jpgPath = path.join(OUT_DIR, `${card.name}.jpg`);
    await page.screenshot({ path: pngPath, type: 'png' });
    const { size } = await stat(pngPath);
    if (size <= PNG_BUDGET) {
      await unlink(jpgPath).catch(() => {});
      console.log(`${path.relative(ROOT, pngPath)}  ${(size / 1024).toFixed(0)} KB`);
      continue;
    }
    // A photo background never compresses well as PNG; JPEG at q82 is visually
    // identical in a share preview and lands well under the budget. The .png is
    // removed so only one file per card is committed — link the .jpg.
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 82 });
    await writeFile(jpgPath, jpeg);
    await unlink(pngPath);
    console.log(
      `${path.relative(ROOT, jpgPath)}  ${(jpeg.length / 1024).toFixed(0)} KB  (png was ${(size / 1024).toFixed(0)} KB, over budget)`,
    );
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
