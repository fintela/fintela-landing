# Video masters

The best copies we hold of each marketing recording, and the only input of
`scripts/encode-media.sh`, which writes the files `public/media/` serves.
Nothing in this folder is deployed (only `dist/` is synced; see
`scripts/sync-site.sh`) and nothing in `public/media/` is a master, so a
re-encode never re-encodes an encode.

| Master | What it is | Serves |
|---|---|---|
| `hero-backdrop-1920.mp4` | The promo loop cropped to 1920×880 (the burnt-in captions in its bottom 200 px are cut off), 36 s, H.264, silent — 5.0 MB. Was `public/media/hero-backdrop.mp4` until the audit: a blurred backdrop behind copy never needed 1920 px on every device | `hero-backdrop-1280.mp4`, `hero-backdrop-960.mp4` |
| `platform-home-loop.mp4` | The platform home scrolled once, top to bottom and back; 1280×800 padded to 16/10, 7 s (from the `home.mp4` capture) | `platform-home-loop.mp4` |
| `feature-walkthrough.mp4` | Markets: pulse, ticker, groups, screener; 1600×870, 21 s (from the `markets.mp4` capture) | `feature-walkthrough.mp4` |

`public/media/platform-home.mp4` (the 36 s portfolios tour) has no master
here: no mounted component plays it yet, so it is deployed as recorded and
`scripts/check-media.mjs` warns about it. When a solution chapter uses it,
move it here and add an `h264` line to the encode script.

Settings, rungs and the AV1 rule are documented in `scripts/encode-media.sh`
and `src/media/README.md`.
