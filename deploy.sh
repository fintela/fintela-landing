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

# The app: content-hashed assets + index.html. The blog prefix is excluded because
# its objects need different cache headers, applied in the second sync.
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete --exclude 'blog/*'

# Blog JSON URLs are not content-hashed, hence the short TTLs.
aws s3 sync dist/blog/ "s3://${S3_BUCKET}/blog/" --delete \
  --content-type application/json \
  --cache-control "public, max-age=60, s-maxage=900"

# The bundle is hashed but index.html is not, so skipping this leaves CloudFront
# serving HTML that points at deleted asset hashes.
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION}" \
  --paths '/*'
