#!/usr/bin/env bash
# Applies infra/cloudfront/ to the live distribution. Idempotent: run it as
# often as you like; it only writes what differs, and it never writes without
# --yes. Read README.md first — the order matters once, and it explains why.
#
#   infra/cloudfront/apply.sh                         # plan: show what would change
#   infra/cloudfront/apply.sh --yes                   # apply everything
#   infra/cloudfront/apply.sh --yes --no-error-responses
#       # phase 1: router function, headers, cache policy, HTTP/3, IPv6 — but
#       # leave the custom error responses as they are. Run again without the
#       # flag once prerendered pages are in the bucket (README, "Order").
#
# What it does, in order:
#   1. create-or-update + publish the CloudFront Function in router.js
#      (skipped when the LIVE code already equals the file);
#   2. create-or-update the response headers policy (security-headers-policy.json)
#      and the cache policy (cache-policy.json), matched by name;
#   3. get-distribution-config → jq → update-distribution (with the ETag):
#      the function on the default behaviour's viewer-request, the headers
#      policy on every behaviour, the cache policy + Compress on the default
#      behaviour (legacy ForwardedValues/TTLs removed, the API forbids both),
#      HttpVersion http2and3, IsIPV6Enabled, and 403/404 → /404.html as 404.
#
# Needs: aws (v2), jq, a logged-in profile (`aws login --profile fintela`).
# CLOUDFRONT_DISTRIBUTION comes from the environment or ../../.env.local
# (the same line deploy.sh reads). No identifier is hardcoded here.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)

APPLY=0
ERROR_RESPONSES=1
for arg in "$@"; do
  case $arg in
    --yes) APPLY=1 ;;
    --no-error-responses) ERROR_RESPONSES=0 ;;
    -h|--help) sed -n '2,25p' "$0"; exit 0 ;;
    *) echo "apply.sh: unknown argument $arg (see --help)" >&2; exit 2 ;;
  esac
done

# `fintela` unless the caller chose a profile; an empty AWS_PROFILE means
# "ambient credentials", so unset it rather than hand the CLI an empty name.
export AWS_PROFILE=${AWS_PROFILE-fintela}
[[ -n $AWS_PROFILE ]] || unset AWS_PROFILE

if [[ -z ${CLOUDFRONT_DISTRIBUTION:-} && -f $ROOT/.env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env.local"
  set +a
fi
DIST=${CLOUDFRONT_DISTRIBUTION:?set CLOUDFRONT_DISTRIBUTION (or put it in .env.local)}

for tool in aws jq; do
  command -v "$tool" >/dev/null || { echo "apply.sh: $tool is required" >&2; exit 1; }
done

FUNCTION_NAME=fintela-landing-router
FUNCTION_CONFIG=$(jq -nc '{
  Comment: "fintela.io viewer-request router: 301s + prerendered page rewrite (fintela-landing infra/cloudfront/router.js)",
  Runtime: "cloudfront-js-2.0"
}')
HEADERS_POLICY_NAME=$(jq -r .Name "$HERE/security-headers-policy.json")
CACHE_POLICY_NAME=$(jq -r .Name "$HERE/cache-policy.json")

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
plan() { printf '   → %s\n' "$*"; }
would() { if (( APPLY )); then plan "$*"; else plan "would $*  (pass --yes)"; fi; }

# ── 1. The router function ─────────────────────────────────────────────────
step "CloudFront Function $FUNCTION_NAME"

# A smoke test run against the DEVELOPMENT stage before publishing: the full
# suite is router.test.mjs, this only proves the uploaded code executes.
cat > "$WORK/event.json" <<'EOF'
{"version":"1.0","context":{"eventType":"viewer-request"},"viewer":{"ip":"203.0.113.7"},
 "request":{"method":"GET","uri":"/docs/","querystring":{},"headers":{"host":{"value":"fintela.io"}},"cookies":{}}}
EOF

publish_function() {
  local etag=$1
  local output
  output=$(aws cloudfront test-function --name "$FUNCTION_NAME" --if-match "$etag" \
    --stage DEVELOPMENT --event-object "fileb://$WORK/event.json" \
    --query 'TestResult.[FunctionErrorMessage, FunctionOutput]' --output json)
  if [[ $(jq -r '.[0] // empty' <<<"$output") != '' ]]; then
    echo "apply.sh: the uploaded function threw: $(jq -r '.[0]' <<<"$output")" >&2
    exit 1
  fi
  local location
  location=$(jq -r '.[1] | fromjson | .response.headers.location.value // empty' <<<"$output")
  if [[ $location != '/docs/overview' ]]; then
    echo "apply.sh: smoke test failed — /docs/ should 301 to /docs/overview, got: $(jq -r '.[1]' <<<"$output")" >&2
    exit 1
  fi
  plan "smoke test passed (/docs/ → 301 /docs/overview); publishing"
  aws cloudfront publish-function --name "$FUNCTION_NAME" --if-match "$etag" > /dev/null
}

if aws cloudfront describe-function --name "$FUNCTION_NAME" > "$WORK/fn.json" 2>/dev/null; then
  if aws cloudfront get-function --name "$FUNCTION_NAME" --stage LIVE "$WORK/live.js" > /dev/null 2>&1 \
     && cmp -s "$WORK/live.js" "$HERE/router.js"; then
    plan "LIVE code is identical to router.js — nothing to do"
  else
    would "update the function from router.js and publish it"
    if (( APPLY )); then
      etag=$(jq -r .ETag "$WORK/fn.json")
      etag=$(aws cloudfront update-function --name "$FUNCTION_NAME" --if-match "$etag" \
        --function-config "$FUNCTION_CONFIG" \
        --function-code "fileb://$HERE/router.js" --query ETag --output text)
      publish_function "$etag"
    fi
  fi
else
  would "create the function from router.js (runtime cloudfront-js-2.0) and publish it"
  if (( APPLY )); then
    etag=$(aws cloudfront create-function --name "$FUNCTION_NAME" \
      --function-config "$FUNCTION_CONFIG" \
      --function-code "fileb://$HERE/router.js" --query ETag --output text)
    publish_function "$etag"
  fi
fi

FUNCTION_ARN=$(aws cloudfront describe-function --name "$FUNCTION_NAME" \
  --query FunctionSummary.FunctionMetadata.FunctionARN --output text 2>/dev/null || true)
[[ -n $FUNCTION_ARN && $FUNCTION_ARN != None ]] || FUNCTION_ARN="arn:aws:cloudfront::<account>:function/$FUNCTION_NAME (after --yes)"

# ── 2. Policies, by name ───────────────────────────────────────────────────

# upsert_policy <kind> <name> <config-file> → prints the policy id
#   kind: response-headers | cache
upsert_policy() {
  local kind=$1 name=$2 file=$3
  local list_key get_key id etag
  case $kind in
    response-headers) list_key=ResponseHeadersPolicyList; get_key=ResponseHeadersPolicy ;;
    cache)            list_key=CachePolicyList;           get_key=CachePolicy ;;
  esac

  id=$(aws cloudfront "list-$kind-policies" --type custom \
    --query "$list_key.Items[?$get_key.${get_key}Config.Name=='$name'].$get_key.Id | [0]" --output text)

  if [[ -z $id || $id == None ]]; then
    would "create the $kind policy '$name'" >&2
    if (( APPLY )); then
      id=$(aws cloudfront "create-$kind-policy" "--$kind-policy-config" "file://$file" \
        --query "$get_key.Id" --output text)
    else
      id="<$kind-policy-id after --yes>"
    fi
  else
    aws cloudfront "get-$kind-policy" --id "$id" > "$WORK/$kind.json"
    etag=$(jq -r .ETag "$WORK/$kind.json")
    if diff -u <(jq -S ".$get_key.${get_key}Config" "$WORK/$kind.json") <(jq -S . "$file") > "$WORK/$kind.diff"; then
      plan "$kind policy '$name' ($id) is up to date" >&2
    else
      would "update the $kind policy '$name' ($id):" >&2
      sed 's/^/     /' "$WORK/$kind.diff" >&2
      if (( APPLY )); then
        aws cloudfront "update-$kind-policy" --id "$id" --if-match "$etag" \
          "--$kind-policy-config" "file://$file" > /dev/null
      fi
    fi
  fi
  echo "$id"
}

step "Response headers policy"
HEADERS_POLICY_ID=$(upsert_policy response-headers "$HEADERS_POLICY_NAME" "$HERE/security-headers-policy.json")

step "Cache policy"
CACHE_POLICY_ID=$(upsert_policy cache "$CACHE_POLICY_NAME" "$HERE/cache-policy.json")

# ── 3. The distribution ────────────────────────────────────────────────────
step "Distribution $DIST"

aws cloudfront get-distribution-config --id "$DIST" > "$WORK/dist.json"
DIST_ETAG=$(jq -r .ETag "$WORK/dist.json")
jq .DistributionConfig "$WORK/dist.json" > "$WORK/current.json"

jq --arg fn "$FUNCTION_ARN" --arg rhp "$HEADERS_POLICY_ID" --arg cp "$CACHE_POLICY_ID" \
   --argjson errors "$ERROR_RESPONSES" '
  # The router on viewer-request of the default behaviour; any other
  # association (a viewer-response function, say) is kept.
  .DefaultCacheBehavior.FunctionAssociations = (
    ((.DefaultCacheBehavior.FunctionAssociations.Items // []) | map(select(.EventType != "viewer-request")))
    + [{FunctionARN: $fn, EventType: "viewer-request"}]
    | {Quantity: length, Items: .})

  # Security headers on every response, whichever behaviour served it.
  | .DefaultCacheBehavior.ResponseHeadersPolicyId = $rhp
  | (if (.CacheBehaviors.Quantity // 0) > 0
     then .CacheBehaviors.Items |= map(.ResponseHeadersPolicyId = $rhp) else . end)

  # Origin-driven TTLs on the default behaviour. A cache policy and the legacy
  # ForwardedValues/TTL fields are mutually exclusive in the API.
  | .DefaultCacheBehavior.CachePolicyId = $cp
  | .DefaultCacheBehavior.Compress = true
  | del(.DefaultCacheBehavior.ForwardedValues,
        .DefaultCacheBehavior.MinTTL, .DefaultCacheBehavior.DefaultTTL, .DefaultCacheBehavior.MaxTTL)

  | .HttpVersion = "http2and3"
  | .IsIPV6Enabled = true

  # S3 answers 403 (not 404) for a missing key unless the OAC may ListBucket,
  # so both codes map to the 404 document, served WITH a 404 status.
  | (if $errors == 1 then .CustomErrorResponses = {
        Quantity: 2,
        Items: [
          {ErrorCode: 403, ResponsePagePath: "/404.html", ResponseCode: "404", ErrorCachingMinTTL: 60},
          {ErrorCode: 404, ResponsePagePath: "/404.html", ResponseCode: "404", ErrorCachingMinTTL: 60}
        ]} else . end)
' "$WORK/current.json" > "$WORK/desired.json"

summary='{
  httpVersion: .HttpVersion, ipv6: .IsIPV6Enabled,
  default: (.DefaultCacheBehavior | {
    cachePolicy: .CachePolicyId, legacyForwardedValues: (.ForwardedValues != null),
    compress: .Compress, responseHeadersPolicy: .ResponseHeadersPolicyId,
    functions: [(.FunctionAssociations.Items // [])[] | "\(.EventType): \(.FunctionARN)"]}),
  behaviours: [(.CacheBehaviors.Items // [])[] | {path: .PathPattern, responseHeadersPolicy: .ResponseHeadersPolicyId}],
  errors: [(.CustomErrorResponses.Items // [])[] | "\(.ErrorCode) → \(.ResponsePagePath) as \(.ResponseCode) (\(.ErrorCachingMinTTL)s)"]
}'
echo "   current:"; jq "$summary" "$WORK/current.json" | sed 's/^/     /'
echo "   desired:"; jq "$summary" "$WORK/desired.json" | sed 's/^/     /'

if diff -u <(jq -S . "$WORK/current.json") <(jq -S . "$WORK/desired.json") > "$WORK/dist.diff"; then
  plan "distribution is up to date"
elif (( APPLY )); then
  plan "updating the distribution (ETag $DIST_ETAG):"
  sed 's/^/     /' "$WORK/dist.diff"
  aws cloudfront update-distribution --id "$DIST" --if-match "$DIST_ETAG" \
    --distribution-config "file://$WORK/desired.json" > /dev/null
  plan "submitted — propagation takes a few minutes: aws cloudfront wait distribution-deployed --id $DIST"
else
  plan "would update the distribution with this diff  (pass --yes):"
  sed 's/^/     /' "$WORK/dist.diff"
fi

if (( ! APPLY )); then
  printf '\nPlan only. Nothing was changed. Re-run with --yes to apply.\n'
fi
