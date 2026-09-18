#!/usr/bin/env bash
# Manual deploy. CI (.github/workflows/deploy.yml) does this automatically on
# every push to main — this script is the local escape hatch, and it does
# exactly what CI does: build, then scripts/sync-site.sh.
#
# No AWS identifier is hardcoded: this is a public repository. Export these,
# or put them in a gitignored .env.local (auto-loaded below if present).
#
#   S3_BUCKET                target bucket
#   CLOUDFRONT_DISTRIBUTION  distribution to invalidate
#
# Credentials: `aws login --profile fintela` first, then AWS_PROFILE=fintela.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [[ -f .env.local ]]; then
  set -a
  . ./.env.local
  set +a
fi

: "${S3_BUCKET:?set S3_BUCKET (e.g. export S3_BUCKET=my-site-bucket)}"
: "${CLOUDFRONT_DISTRIBUTION:?set CLOUDFRONT_DISTRIBUTION}"

npm run build

# Per-class Content-Type/Cache-Control passes, stale objects deleted, one `/*`
# invalidation. The filter table lives in the script's header.
bash scripts/sync-site.sh "$S3_BUCKET" "$CLOUDFRONT_DISTRIBUTION"
