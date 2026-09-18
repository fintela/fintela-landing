# Demo media

Files go in `public/media/` (this folder documents them; it is not deployed).

Videos the marketing pages read from the `media/` prefix. Nothing here is
bundled: the pages reference these files by URL (see `src/media/registry.ts`),
and a plate whose file is missing simply shows its poster.

The recordings are silent screen captures of the app (H.264, no audio track),
with the app's sidebar and the recorder's status bar cropped off. Their posters
and the product stills on the solution pages are frames of the same recordings,
so a poster and its video line up.

Nothing in `public/media/` is edited by hand: the masters live in
`media-masters/` (repo root, never deployed) and `scripts/encode-media.sh`
writes the served files from them. `node scripts/check-media.mjs` fails when
the registry names a file `public/media/` does not hold (a missing file is
not a broken page, it is a request the CDN answers with HTML on every visit)
and warns about files that are deployed but never played.

| File | Where it plays | Encode (from `media-masters/`) |
|---|---|---|
| `hero-backdrop-1280.mp4` | Home hero backdrop on viewports ≥ 1024 px — the promo loop cropped to 1920×880 (36 s), scaled to 1280 | `hero-backdrop-1920.mp4` → H.264 crf 28, preset slow, 2.1 MB |
| `hero-backdrop-960.mp4` | Home hero backdrop from 600 to 1023 px | same master → 960 wide, crf 30, 1.1 MB |
| *(no file)* | Below 600 px, under reduced motion or on a 2g/3g/Save-Data connection the hero shows only its poster; the 1920 master (5.0 MB, once served to every visitor) is no longer deployed — a blurred backdrop behind copy never needed it | — |
| `platform-home-loop.mp4` | Home platform band — the platform home scrolled once, top to bottom and back (1280×800, padded to 16/10 in the app's page colour, 7 s) | `platform-home-loop.mp4` (from `home.mp4`) → crf 26, 473 KB (was 1.3 MB) |
| `platform-home.mp4` | Solutions "Platform tour" chapters — the portfolios dashboard, risk charts, the promote menu and the analysis report (1600×868, 36 s). **No chapter uses it today** (check-media warns); kept, untouched, for when one does | `portfolios.mp4`, as recorded (13 MB) |
| `feature-walkthrough.mp4` | Home "Capabilities" bento — markets: pulse, ticker, groups, screener (1600×870, 21 s) | `feature-walkthrough.mp4` (from `markets.mp4`) → crf 27, 710 KB (was 3.4 MB) |
| `agents-conversation.mp4` | Home "Fintelligent" band and the last chapter of each solution page — the multi-agent conversation (16:9). **Not recorded yet**: the registry lists no `src` for `agents`, so the band shows its stand-in poster (see Photographs) and makes no request. The comment on that entry says how to enable it | — |
| `captions/<name>.<en\|es\|pt>.vtt` | WebVTT captions, one per locale, for a video with speech (none of the current recordings) | — |

The encode script also tries an SVT-AV1 variant (`<name>.av1.mp4`, listed
first in the `<source>` order through `VideoSource.av1`) and keeps it only
when it beats the H.264 file by more than 30 %. On the current captures it
does not — x264 at crf 26–27 already skips the static regions of a screen
recording — so no AV1 file ships; the machinery stays for the next recording.

Chapter timestamps live in code (`media/registry.ts`'s `TOUR_CHAPTERS`,
`CapabilitiesBento.tsx`, `FintelligentSection.tsx`) and must match the cuts.

To serve these from another origin, set `VITE_MEDIA_BASE_URL`, the same way
`VITE_BLOG_BASE_URL` repoints the blog.

## Stills: formats and rungs

Every still in `src/assets/media/` is imported through vite-imagetools'
picture directive (`vite.config.ts` wires the plugin), for example

```ts
import funds from '../assets/media/solutions/funds-hero.jpg?w=800;1600&format=avif;webp;jpeg&as=picture';
```

which resolves at build time to a `Picture` (`src/media/picture.ts`): an
AVIF, a WebP and a JPEG `srcset` at those widths, plus the largest JPEG as the
fallback `<img>` with its intrinsic width and height. `MediaWell` renders it as
`<picture>` — AVIF first, WebP, then the JPEG — so the browser takes the
smallest format it decodes at the width the slot needs (the `sizes` the call
site passes), and the box is sized before a byte arrives. Registry entries
stay plain URL strings (the JPEG fallback) so nothing typed against a string
had to change; `MediaWell` looks the picture up from that string. `as=picture`
must be the last parameter of the directive (that is how `src/vite-env.d.ts`
types it); `format=jpeg`, not `jpg` — the plugin names the output file after
the format it is told, and a warm cache reports `jpeg`, so `jpg` would give
the client and the SSR build different file names.

Rungs are "the slot at 1x; the slot at 2x", from the media audit; the plugin
never upscales, so a rung wider than the file is clamped to it:

| Still | Widths | Slot |
|---|---|---|
| `hero/backdrop-poster.jpg` | 828 · 1280 · 1920 | Home hero, 100vw — the LCP image, preloaded (AVIF) from `HeroVideoBackdrop` |
| `hero/platform-home-poster.jpg` | 768 · 1280 | Platform band plate, 16/10 |
| `capabilities/walkthrough-poster.jpg` | 560 · 1120 | Capabilities bento player, 16/10 |
| `capabilities/live-ops.jpg` | 260 · 520 | Capabilities bento tile, 3/2 |
| `fintelligent/agents-poster.jpg` | 640 · 1280 | Fintelligent band and solution chapter, 16/9 |
| `audiences/*.jpg` | 560 · 1120 (→ 800) | Home audience dossier; 800×1000 portraits in a 16/9 well, framed with `objectPosition` |
| `solutions/*-hero.jpg` | 800 · 1600 | Solution page hero, 16/10 — that page's LCP (`priority`) |
| `solutions/chapters/*.jpg` | 660 · 1280 | Solution chapters, 16/9 |
| `tour/platform-home-poster.jpg` | 800 · 1600 | Poster of the unused platform tour |

Encodes are cached in `node_modules/.cache/imagetools`; a cold build encodes
all 48 outputs in a few seconds. Blog covers are not part of this pipeline
(they are copied by `vite-plugin-content.ts` and rendered as plain `<img>`).

## Photographs

The stills that are not product frames, cropped from the originals under
`finte_media_v2` to their slot's ratio (`src/media/registry.ts` says where each
one is placed; a file is placed exactly once). The prominent slots — the home
audience dossier and the three solution heroes — carry the black-and-white
"featured" set; colour is reserved for the elements that had no photograph
of their own (the Fintelligent poster, blog covers).

| File | Slot | Source |
|---|---|---|
| `solutions/funds-hero.jpg` | `/solutions/hedge-funds` hero, 16/10 | Unsplash, Xingchen Yan (`rGFNwdyCwHM`) |
| `solutions/teams-hero.jpg` | `/solutions/quant-teams` hero, 16/10 | Unsplash, Hassan Pasha (`nEbMedmVwgw`) |
| `solutions/independents-hero.jpg` | `/solutions/independent-quants` hero, 16/10 | Unsplash, Piotr Makowski (`27LH_0jXKYI`) |
| `audiences/funds.jpg` | Home audience dossier, funds seat — file is 4/5, slot is now 16/9 (see Stills) | Unsplash, Sebastian Schuster (`pfnB1BMq_rY`) |
| `audiences/teams.jpg` | Home audience dossier, teams seat — file is 4/5, slot is now 16/9 (see Stills) | Unsplash, trianglemz (`iKi_u-febwU`) |
| `audiences/independents.jpg` | Home audience dossier, independents seat — file is 4/5, slot is now 16/9 (see Stills) | Unsplash, Tai Bui (`dw4WegQZEYc`) |
| `capabilities/live-ops.jpg` | Home capabilities bento, live-trading tile, 3/2 | Pixabay, harryloya (`3033135`) |
| `fintelligent/agents-poster.jpg` | Fintelligent player poster until the recording exists, 16/9 | Unsplash, Alina Grubnyak (`ZiQkhI7417A`) |
| `content/blog/covers/welcome-to-the-fintela-blog.jpg` | Blog cover | Unsplash, Lukas Blazek (`mcSDtbWXUZU`) |
| `content/blog/covers/climate-analysis.jpg` | Blog cover and lead image | Unsplash, Markus Winkler (`IrRbSND5EUc`) |
| `content/blog/covers/quants-moving-away-from-legacy-tools.jpg` | Blog cover and lead image | Unsplash, Chris Liverani (`dBI_My696Rk`) |
| `content/blog/covers/fintela-hedgeweek-announcement.png` | Blog cover and closing image | Hedgeweek US Awards 2026 shortlist crowd card (800×420) |
| `content/blog/covers/deflated-sharpe.jpg` | Blog cover and lead image | Exhibit 1 of Bailey & López de Prado (2014), *The Deflated Sharpe Ratio*, re-hosted from the imgbb copy the post originally hot-linked, caption band cropped |
| `content/blog/covers/momentum-research.jpg` | Blog cover and lead image | "Cumulated alpha of the Momentum portfolio" chart, re-hosted from the imgbb copy the post originally hot-linked (transparent PNG flattened on white); original author unknown |

A blog cover is the one image the build copies for a post (`cover:` in the
frontmatter, see `content/blog/_template.md`): it is the card image on `/` and
`/blog`, the lead image inside the post, and the post's social preview. Keep it
under `content/blog/covers/<slug>.jpg`, never on a third-party host, with a
`coverAlt` that describes the picture.

## Social cards and brand assets

`public/og/*` are the 1200×630 Open Graph cards (`default`, `blog`, `docs`,
`pricing`, `contact` as PNG; the three `solutions-*` cards as JPEG because their
photo background does not fit the 250 KB PNG budget). They are rendered locally
by `scripts/og/render.mjs` from the design tokens, the wordmark and the solution
hero stills above, and committed; CI never renders them. `public/brand/` holds
the mark (512×512) and the wordmark for JSON-LD, the executive overview and
anything else that needs a stable logo URL, and `public/favicon-*.png`,
`apple-touch-icon.png` and `site.webmanifest` are cut from the same mark.
