# Demo media

Files go in `public/media/` (this folder documents them; it is not deployed).

Videos the marketing pages read from the `media/` prefix. Nothing here is
bundled: the pages reference these files by URL (see `src/media/registry.ts`),
and a plate whose file is missing simply shows its poster.

The three recordings are silent screen captures of the app (H.264, no audio
track), re-encoded from the originals with the app's sidebar and the recorder's
status bar cropped off. Their posters and the product stills on the solution
pages are frames of the same recordings, so a poster and its video line up.

| File | Where it plays | Source |
|---|---|---|
| `platform-home-loop.mp4` | Home hero — the platform home scrolled once, top to bottom and back (1280×800, padded to 16/10 in the app's page colour, 7 s) | `home.mp4` |
| `platform-home.mp4` | Solutions "Platform tour" chapters — the portfolios dashboard, risk charts, the promote menu and the analysis report (1600×868, 36 s) | `portfolios.mp4` |
| `feature-walkthrough.mp4` | Home "Capabilities" bento — markets: pulse, ticker, groups, screener (1600×870, 21 s) | `markets.mp4` |
| `agents-conversation.mp4` / `.webm` | Home "Fintelligent" band — the multi-agent conversation (16:9). **Not recorded yet**; the band shows its stand-in poster (see Photographs) | — |
| `captions/<name>.<en\|es\|pt>.vtt` | WebVTT captions, one per locale, for a video with speech (none of the current recordings) | — |

Chapter timestamps live in code (`media/registry.ts`'s `TOUR_CHAPTERS`,
`CapabilitiesBento.tsx`, `FintelligentSection.tsx`) and must match the cuts.

To serve these from another origin, set `VITE_MEDIA_BASE_URL`, the same way
`VITE_BLOG_BASE_URL` repoints the blog.

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
| `audiences/funds.jpg` | Home audience dossier, funds seat, 4/5 | Unsplash, Sebastian Schuster (`pfnB1BMq_rY`) |
| `audiences/teams.jpg` | Home audience dossier, teams seat, 4/5 | Unsplash, trianglemz (`iKi_u-febwU`) |
| `audiences/independents.jpg` | Home audience dossier, independents seat, 4/5 | Unsplash, Tai Bui (`dw4WegQZEYc`) |
| `capabilities/live-ops.jpg` | Home capabilities bento, live-trading tile, 3/2 | Pixabay, harryloya (`3033135`) |
| `fintelligent/agents-poster.jpg` | Fintelligent player poster until the recording exists, 16/9 | Unsplash, Alina Grubnyak (`ZiQkhI7417A`) |
| `content/blog/covers/welcome-to-the-fintela-blog.jpg` | Blog cover | Unsplash, Lukas Blazek (`mcSDtbWXUZU`) |
| `content/blog/covers/climate-analysis.jpg` | Blog cover and lead image | Unsplash, Markus Winkler (`IrRbSND5EUc`) |
| `content/blog/covers/quants-moving-away-from-legacy-tools.jpg` | Blog cover and lead image | Unsplash, Chris Liverani (`dBI_My696Rk`) |
