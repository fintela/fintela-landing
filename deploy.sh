#!/usr/bin/env bash
# Manual deploy. CI (.github/workflows/deploy.yml) does this automatically on
# every push to main — this script is the local escape hatch.
#
# No AWS identifier is hardcoded: this is a public repository. Export these,
# or put them in a gitignored .env.local (auto-loaded below if present).
#
#   S3_BUCKET                target bucket
#   CLOUDFRONT_DISTRIBUTION  distribution to invalidate
set -euo pipefail

if [[ -f .env.local ]]; then
  set -a
  . ./.env.local
  set +a
fi

: "${S3_BUCKET:?set S3_BUCKET (e.g. export S3_BUCKET=my-site-bucket)}"
: "${CLOUDFRONT_DISTRIBUTION:?set CLOUDFRONT_DISTRIBUTION}"

npm run build

# The app: content-hashed assets + index.html. The content and media prefixes
# are excluded because their objects need different cache headers, applied below.
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete \
  --exclude 'blog/*' --exclude 'docs/*' --exclude 'media/*'

# Blog and docs JSON URLs are not content-hashed, hence the short TTLs. Blog
# covers live under the same prefix but are images: synced apart, so they keep
# their own content type.
for prefix in blog docs; do
  aws s3 sync "dist/${prefix}/" "s3://${S3_BUCKET}/${prefix}/" --delete \
    --exclude 'covers/*' \
    --content-type application/json \
    --cache-control "public, max-age=60, s-maxage=900"
done
if [[ -d dist/blog/covers ]]; then
  aws s3 sync dist/blog/covers/ "s3://${S3_BUCKET}/blog/covers/" --delete \
    --cache-control "public, max-age=3600, s-maxage=86400"
fi

# Demo videos and captions (see src/media/README.md). Not content-hashed either,
# but large and rarely re-cut, so they cache for a day at the edge; the
# invalidation below covers a re-cut. Captions need their MIME type spelled out.
if [[ -d dist/media ]]; then
  aws s3 sync dist/media/ "s3://${S3_BUCKET}/media/" --delete \
    --exclude '*.vtt' \
    --cache-control "public, max-age=86400, s-maxage=604800"
  aws s3 sync dist/media/ "s3://${S3_BUCKET}/media/" \
    --exclude '*' --include '*.vtt' \
    --content-type 'text/vtt; charset=utf-8' \
    --cache-control "public, max-age=3600, s-maxage=86400"
fi

# The bundle is hashed but index.html is not, so skipping this leaves CloudFront
# serving HTML that points at deleted asset hashes.
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION}" \
  --paths '/*'
