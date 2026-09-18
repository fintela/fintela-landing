#!/usr/bin/env bash
# Encodes the marketing videos public/media serves from their masters.
#
#   media-masters/<name>.mp4  --ffmpeg-->  public/media/<name>[.<rung>|.av1].mp4
#
# The masters are the best copies we hold (the 1920×880 hero crop, the two
# screen recordings as they were captured); nothing in public/media is a
# master, so re-running this script never re-encodes an encode. Outputs are
# only written when the master (or this script) is newer than them — run
# with FORCE=1 to redo everything. Outputs are committed: CI never runs this.
#
# What it produces, and why (audit IMG-01, IMG-12, CWV-14):
#   hero-backdrop-1280.mp4   H.264 crf 28, preset slow — desktops ≥ 1024 px
#   hero-backdrop-960.mp4    H.264 crf 30, preset slow — 600–1023 px
#     The loop is a blurred backdrop behind the hero copy, so the 1920 master
#     is never served (it was 5.0 MB on every visit, phones included); below
#     600 px the poster stands in for it (HeroVideoBackdrop.tsx). Full length,
#     no re-cut: the loop point is a creative decision, not an encoding one.
#   platform-home-loop.mp4   H.264 crf 26, preset slow — the ambient loop
#   feature-walkthrough.mp4  H.264 crf 27, preset slow — the capabilities player
#   <name>.av1.mp4           SVT-AV1 crf 38, preset 6, for the two plates — kept
#     only when it is >30 % smaller than the H.264 file (an AV1 that barely
#     wins is not worth a second file to cache and sync). When one is kept,
#     list it as `av1:` in src/media/registry.ts; VideoPlate offers it first
#     with codecs="av01.0.08M.08" and a browser that cannot decode it falls
#     through to the H.264 <source>. On the current masters neither clears the
#     bar (x264 crf 26–27 already skips the static regions of a screen capture:
#     the loop's AV1 was 29 % smaller, the walkthrough's 22 % larger), so no
#     AV1 file ships today.
#   All: -an (silent captures), yuv420p (the one pixel format every decoder
#   plays), +faststart (moov atom first, so playback and seeks start at once).
#
# Requires ffmpeg with libx264 (and libsvtav1 for the AV1 variants; skipped
# with a notice when absent). Idempotent; safe to re-run at any time.
#
# Usage: scripts/encode-media.sh            (from anywhere)
#        FORCE=1 scripts/encode-media.sh    re-encode everything
#        MEDIA_MASTERS=/path scripts/encode-media.sh   masters elsewhere

set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
MASTERS=${MEDIA_MASTERS:-"$ROOT/media-masters"}
OUT="$ROOT/public/media"
SELF="$ROOT/scripts/encode-media.sh"
AV1_MIN_WIN=30 # percent smaller than H.264 an AV1 file must be to be kept

command -v ffmpeg >/dev/null || { echo "encode-media: ffmpeg not found" >&2; exit 1; }
[ -d "$MASTERS" ] || { echo "encode-media: no masters directory at $MASTERS" >&2; exit 1; }
mkdir -p "$OUT"

have_svtav1() { ffmpeg -hide_banner -encoders 2>/dev/null | grep -q '^ V[^ ]* *libsvtav1 '; }
size_of() { stat -f %z "$1" 2>/dev/null || stat -c %s "$1"; }

# up_to_date OUTPUT MASTER — true when OUTPUT exists and is newer than both
# the master and this script (a settings change must re-encode).
up_to_date() {
  [ -z "${FORCE:-}" ] && [ -f "$1" ] && [ "$1" -nt "$2" ] && [ "$1" -nt "$SELF" ]
}

# h264 MASTER OUTPUT CRF PROFILE [extra ffmpeg args…]
h264() {
  local master=$1 output=$2 crf=$3 profile=$4
  shift 4
  if up_to_date "$output" "$master"; then
    echo "  = $(basename "$output") up to date"
    return
  fi
  local tmp="$output.tmp.mp4"
  ffmpeg -hide_banner -loglevel error -y -i "$master" "$@" \
    -c:v libx264 -crf "$crf" -preset slow -profile:v "$profile" -pix_fmt yuv420p \
    -an -movflags +faststart "$tmp"
  mv "$tmp" "$output"
  printf '  > %s  %d KB\n' "$(basename "$output")" $(( $(size_of "$output") / 1024 ))
}

# av1 MASTER OUTPUT H264_OUTPUT GOP — kept only when it clears AV1_MIN_WIN.
av1() {
  local master=$1 output=$2 h264_output=$3 gop=$4
  if ! have_svtav1; then
    echo "  ! $(basename "$output") skipped: this ffmpeg has no libsvtav1"
    return
  fi
  if up_to_date "$output" "$master"; then
    echo "  = $(basename "$output") up to date"
    return
  fi
  local tmp="$output.tmp.mp4"
  # SVT-AV1 logs its banner straight to stderr, past -loglevel; keep only real errors.
  ffmpeg -hide_banner -loglevel error -y -i "$master" \
    -c:v libsvtav1 -crf 38 -preset 6 -g "$gop" -pix_fmt yuv420p \
    -an -movflags +faststart "$tmp" 2> >(grep -v '^Svt\[info\]' >&2)
  local h264_size av1_size win
  h264_size=$(size_of "$h264_output")
  av1_size=$(size_of "$tmp")
  win=$(( (h264_size - av1_size) * 100 / h264_size ))
  if [ "$win" -ge "$AV1_MIN_WIN" ]; then
    mv "$tmp" "$output"
    printf '  > %s  %d KB (%d%% smaller than H.264)\n' "$(basename "$output")" $(( av1_size / 1024 )) "$win"
  else
    rm -f "$tmp" "$output"
    printf '  - %s dropped: only %d%% smaller than H.264 (needs %d%%); remove it from src/media/registry.ts if listed\n' \
      "$(basename "$output")" "$win" "$AV1_MIN_WIN"
  fi
}

echo "encode-media: masters in $MASTERS → $OUT"

echo "hero backdrop (H.264 rungs; the 1920 master is not served)"
h264 "$MASTERS/hero-backdrop-1920.mp4" "$OUT/hero-backdrop-1280.mp4" 28 high -vf scale=1280:-2
h264 "$MASTERS/hero-backdrop-1920.mp4" "$OUT/hero-backdrop-960.mp4" 30 main -vf scale=960:-2

echo "platform home loop (ambient plate)"
h264 "$MASTERS/platform-home-loop.mp4" "$OUT/platform-home-loop.mp4" 26 high
av1 "$MASTERS/platform-home-loop.mp4" "$OUT/platform-home-loop.av1.mp4" "$OUT/platform-home-loop.mp4" 240

echo "feature walkthrough (capabilities player)"
h264 "$MASTERS/feature-walkthrough.mp4" "$OUT/feature-walkthrough.mp4" 27 high
av1 "$MASTERS/feature-walkthrough.mp4" "$OUT/feature-walkthrough.av1.mp4" "$OUT/feature-walkthrough.mp4" 120

echo "done; run node scripts/check-media.mjs to confirm the registry matches"
