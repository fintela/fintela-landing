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
| `agents-conversation.mp4` / `.webm` | Home "Fintelligent" band — the multi-agent conversation (16:9). **Not recorded yet**; the band shows its placeholder poster | — |
| `captions/<name>.<en\|es\|pt>.vtt` | WebVTT captions, one per locale, for a video with speech (none of the current recordings) | — |

Chapter timestamps live in code (`media/registry.ts`'s `TOUR_CHAPTERS`,
`CapabilitiesBento.tsx`, `FintelligentSection.tsx`) and must match the cuts.

To serve these from another origin, set `VITE_MEDIA_BASE_URL`, the same way
`VITE_BLOG_BASE_URL` repoints the blog.
