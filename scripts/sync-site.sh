#!/usr/bin/env bash
# Uploads dist/ to the site bucket and invalidates CloudFront. The ONE sync
# path: .github/workflows/deploy.yml and deploy.sh both call this, so the
# per-object headers below are defined exactly once.
#
#   scripts/sync-site.sh <bucket> [distribution-id]
#
# Credentials come from the environment (OIDC in CI, `aws login` locally);
# AWS_PROFILE is honoured if set. Without a distribution id (second argument
# or CLOUDFRONT_DISTRIBUTION in the environment) the invalidation is skipped.
# DRY_RUN=1 passes --dryrun to every sync and skips the invalidation.
#
# Why disjoint passes
# -------------------
# `aws s3 sync` applies one Content-Type and one Cache-Control to everything a
# single call uploads, so each class of object needs its own call. The
# --exclude/--include filters of a call apply to BOTH sides of the sync — the
# local listing and the bucket listing — which is what makes `--delete` safe:
# a pass can only delete bucket objects that match its own filters and are
# missing from dist/, i.e. objects of its own class that the build stopped
# producing (a removed post's HTML and JSON, an old asset hash, a dropped
# child sitemap). Because the classes are disjoint, no pass ever sees another
# pass's objects, and every object is uploaded exactly once with the headers
# of the class it belongs to. The final pass takes whatever matched no class,
# with a short TTL, so an unclassified file is served correctly rather than
# not at all — check the upload log for it and give it a class.
#
# Filters are matched against the path relative to dist/ and `*` crosses `/`,
# so `*.html` matches `pricing/index.html` and `sitemap*.xml` matches only
# root-level files starting with "sitemap".
#
# Filter table (source → class, Content-Type, Cache-Control)
# ------------------------------------------------------------
#   assets/**                     Vite content-hashed bundle: js, css, images, fonts
#     (all but *.avif, *.woff2)   inferred            public, max-age=31536000, immutable
#     *.avif                      image/avif          same
#     *.woff2                     font/woff2          same
#   *.html                        index.html, 404.html, executive-overview.html,
#     (not assets/, media/)       every prerendered <route>/index.html
#                                 text/html; charset=utf-8
#                                 public, max-age=0, must-revalidate, s-maxage=300
#   blog/*.json, docs/*.json      content and search data the pages fetch
#                                 application/json; charset=utf-8
#                                 public, max-age=60, s-maxage=900
#   sitemap*.xml                  application/xml; charset=utf-8      public, max-age=300, s-maxage=900
#   feed.xml                      application/rss+xml; charset=utf-8  same
#   robots.txt                    text/plain; charset=utf-8           same
#   site.webmanifest              application/manifest+json           same
#   blog/covers/**, og/**, brand/**, blog-assets/**, docs-assets/**,
#   favicon*, apple-touch-icon*   images that are not content-hashed
#     (all but *.avif)            inferred            public, max-age=86400, s-maxage=604800
#     *.avif (outside assets/ and media/)
#                                 image/avif          same
#   media/**                      demo videos and captions (src/media/README.md)
#     (all but *.vtt)             inferred            public, max-age=86400, s-maxage=604800
#     *.vtt                       text/vtt; charset=utf-8
#                                 public, max-age=3600, s-maxage=86400
#   everything else               inferred            public, max-age=300, s-maxage=900
#
# Content types: the CLI infers from the extension via the runner's MIME table.
# js/css/png/jpg/svg/webp/mp4/webm are universal; avif and woff2 are missing
# from older tables, hence the explicit passes. This cannot be checked offline
# (--dryrun prints no headers); after a deploy, `curl -sI` the objects — the
# "verify" section of infra/cloudfront/README.md lists the commands.
set -euo pipefail

BUCKET=${1:?usage: scripts/sync-site.sh <bucket> [distribution-id]}
DISTRIBUTION=${2:-${CLOUDFRONT_DISTRIBUTION:-}}

# Paths below are relative to the repository root, wherever this is run from.
cd "$(dirname "${BASH_SOURCE[0]}")/.."
[[ -f dist/index.html ]] || { echo "sync-site: dist/index.html is missing — run \`npm run build\` first." >&2; exit 1; }

DRYRUN=()
if [[ ${DRY_RUN:-} == 1 ]]; then
  DRYRUN=(--dryrun)
  echo "sync-site: DRY_RUN=1 — nothing will be uploaded, deleted or invalidated."
fi

IMMUTABLE='public, max-age=31536000, immutable'
HTML='public, max-age=0, must-revalidate, s-maxage=300'
CONTENT='public, max-age=60, s-maxage=900'
SITE_META='public, max-age=300, s-maxage=900'
IMAGES='public, max-age=86400, s-maxage=604800'
MEDIA='public, max-age=86400, s-maxage=604800'
CAPTIONS='public, max-age=3600, s-maxage=86400'
FALLBACK='public, max-age=300, s-maxage=900'

# pass <local-dir> <bucket-prefix> <cache-control> [sync flags...]
# Every pass deletes within its own filters — see "Why disjoint passes".
pass() {
  local src=$1 prefix=$2 cache=$3
  shift 3
  echo "── $src → s3://$BUCKET/$prefix  [$cache]"
  aws s3 sync "$src" "s3://$BUCKET/$prefix" --delete --no-progress \
    --cache-control "$cache" "$@" ${DRYRUN[@]+"${DRYRUN[@]}"}
}

# 1. The hashed bundle. Vite renames a file whenever its content changes, so a
#    URL under assets/ never changes meaning: cache forever.
pass dist/assets/ assets/ "$IMMUTABLE" \
  --exclude '*.avif' --exclude '*.woff2'
pass dist/assets/ assets/ "$IMMUTABLE" \
  --exclude '*' --include '*.avif' --content-type 'image/avif'
pass dist/assets/ assets/ "$IMMUTABLE" \
  --exclude '*' --include '*.woff2' --content-type 'font/woff2'

# 2. HTML: the home page, the 404 document, the standalone overview and every
#    prerendered route. Browsers must revalidate on every navigation (an ETag
#    304 is cheap; a stale index.html pointing at a deleted asset hash is a
#    blank page). The edge keeps a copy for five minutes and the invalidation
#    at the end clears that on deploy.
pass dist/ '' "$HTML" \
  --exclude '*' --include '*.html' --exclude 'assets/*' --exclude 'media/*' \
  --content-type 'text/html; charset=utf-8'

# 3. Blog and docs JSON. Not content-hashed, fetched by the pages at run time,
#    so short TTLs. --delete here is what removes a deleted post's JSON.
pass dist/ '' "$CONTENT" \
  --exclude '*' --include 'blog/*.json' --include 'docs/*.json' \
  --content-type 'application/json; charset=utf-8'

# 4. Crawler-facing files at the root, one type each.
pass dist/ '' "$SITE_META" \
  --exclude '*' --include 'sitemap*.xml' \
  --content-type 'application/xml; charset=utf-8'
pass dist/ '' "$SITE_META" \
  --exclude '*' --include 'feed.xml' \
  --content-type 'application/rss+xml; charset=utf-8'
pass dist/ '' "$SITE_META" \
  --exclude '*' --include 'robots.txt' \
  --content-type 'text/plain; charset=utf-8'
pass dist/ '' "$SITE_META" \
  --exclude '*' --include 'site.webmanifest' \
  --content-type 'application/manifest+json'

# 5. Images that are not content-hashed: blog covers (and their OG crops),
#    Open Graph cards, brand marks, favicons, Markdown image folders. A day in
#    the browser, a week at the edge; the invalidation covers a replaced file.
pass dist/ '' "$IMAGES" \
  --exclude '*' \
  --include 'blog/covers/*' --include 'og/*' --include 'brand/*' \
  --include 'blog-assets/*' --include 'docs-assets/*' \
  --include 'favicon*' --include 'apple-touch-icon*' \
  --exclude '*.avif'
pass dist/ '' "$IMAGES" \
  --exclude '*' --include '*.avif' --exclude 'assets/*' --exclude 'media/*' \
  --content-type 'image/avif'

# 6. Demo videos and captions (src/media/README.md): large, rarely re-cut.
#    Captions need their MIME type spelled out.
if [[ -d dist/media ]]; then
  pass dist/media/ media/ "$MEDIA" \
    --exclude '*.vtt'
  pass dist/media/ media/ "$CAPTIONS" \
    --exclude '*' --include '*.vtt' --content-type 'text/vtt; charset=utf-8'
fi

# 7. Whatever matched no class above. The exclude list mirrors every include
#    above so nothing is uploaded twice; a file that lands here is served with
#    a safe short TTL — add it to a class when you see it in the log.
pass dist/ '' "$FALLBACK" \
  --exclude 'assets/*' --exclude 'media/*' \
  --exclude '*.html' \
  --exclude 'blog/*.json' --exclude 'docs/*.json' \
  --exclude 'sitemap*.xml' --exclude 'feed.xml' --exclude 'robots.txt' --exclude 'site.webmanifest' \
  --exclude 'blog/covers/*' --exclude 'og/*' --exclude 'brand/*' \
  --exclude 'blog-assets/*' --exclude 'docs-assets/*' \
  --exclude 'favicon*' --exclude 'apple-touch-icon*' \
  --exclude '*.avif'

# One wildcard invalidation. CloudFront bills invalidations per PATH (first
# 1,000 a month free), and a wildcard is one path. A deploy now touches HTML
# under every prefix (a post changes its own page, the blog index, the home
# page's Insights band, both sitemaps and the feed), so enumerating changed
# paths would cost more paths than `/*`, and missing one leaves a stale page
# at the edge for up to s-maxage. Hashed assets are new names, so `/*` costs
# them nothing; everything else refills from S3 on the next request.
if [[ -z $DISTRIBUTION ]]; then
  echo "sync-site: no distribution id given — skipping the CloudFront invalidation."
elif [[ ${DRY_RUN:-} == 1 ]]; then
  echo "sync-site: DRY_RUN=1 — would invalidate /* on $DISTRIBUTION."
else
  echo "── invalidating /* on $DISTRIBUTION"
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION" \
    --paths '/*'
fi
