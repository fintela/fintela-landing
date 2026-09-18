# CloudFront — the edge configuration for fintela.io

The site is static files on S3 behind one CloudFront distribution. S3's REST
endpoint cannot redirect, has no directory index and adds no headers, so
everything a crawler or a browser expects from a web server has to happen at
the edge. This directory holds that configuration as code, and `apply.sh`
puts it on the distribution. Nothing here runs from CI: applying it needs a
logged-in `fintela` profile and a person reading the plan.

| File | What it is |
|---|---|
| `router.js` | A CloudFront Function (viewer-request, runtime `cloudfront-js-2.0`): the 301s and the rewrite that serves prerendered pages. |
| `router.test.mjs` | Its tests (`node --test infra/cloudfront/router.test.mjs`), including the assertion that its redirect maps equal `src/App.tsx`. CI runs it. |
| `security-headers-policy.json` | A response headers policy: HSTS and the baseline security headers. |
| `cache-policy.json` | A cache policy that takes TTLs from the `Cache-Control` each object is uploaded with. |
| `apply.sh` | Idempotent apply: function → policies → distribution. Plans by default, writes only with `--yes`. |

## What each piece does, and why

### The router function

Attached to the default cache behaviour on `viewer-request`, so it runs on
every request before the cache lookup. In order:

1. `www.fintela.io` → `301 https://fintela.io<path>` (see *www* below).
2. `/index.html` and `/<route>/index.html` → `301` the route. The storage
   layout (prerendered pages live at `<route>/index.html`) is never a URL.
3. Uppercase in a route → `301` lowercase. react-router matched paths
   case-insensitively, so `/Pricing` was a 200 duplicate of `/pricing`. Paths
   under `/assets/`, `/media/`, `/blog/covers/`, `/og/`, `/brand/`,
   `/blog-assets/`, `/docs-assets/` and `*.json` are object keys with
   legitimate uppercase and are left alone.
4. Trailing or doubled slashes → `301` the clean form (`/` excepted). The
   canonical form has no trailing slash because every internal link and both
   redirect maps already use it.
5. The two redirect maps copied verbatim from `src/App.tsx`
   (`LEGACY_DOC_PATHS` for the pre-Markdown `/documentation/*` tree,
   `DOC_SLUG_REDIRECTS` for renamed `/docs/*` slugs) and the two index routes
   the SPA used to bounce client-side (`/docs` → `/docs/overview`,
   `/solutions` → `/solutions/hedge-funds`). These were JS `<Navigate>`s on a
   200 response, which transfers no ranking signal and leaves the old URL in
   the index; a 301 does both.
6. Any URI without a file extension is **rewritten** (not redirected) to
   `<uri>/index.html`, the prerendered page. A route with no prerendered object
   falls through to S3's 403/404, which the custom error response turns into
   `/404.html` with a real 404 status.

Steps 2–5 are folded into one canonical target, so `/Docs/Platform-Tour/`
becomes `/docs/navigation` in a single hop. The query string survives every
redirect. `src/App.tsx` remains the source of truth for the maps: change it
there, copy the change here, and the test fails until you do.

The function is written in ES5 on purpose. The runtime supports some ES6+, but
a syntax error only shows up at `create-function` time; the test's last case
greps for arrow functions, template literals, `let`/`const` and Node globals.

### The security headers policy

Applied to every behaviour, so every response carries:

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS was enforced only by the redirect; the first request of every session still went over HTTP. |
| `X-Content-Type-Options` | `nosniff` | Never let a browser guess a type — the sync script sets every type explicitly. |
| `X-Frame-Options` | `DENY` | Nothing embeds the site. If the app ever wants to iframe the docs, `SAMEORIGIN` will not do (app.fintela.io is a different origin); that is a CSP `frame-ancestors` job. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URL to us, origin only to third parties, nothing on downgrade. |
| `Permissions-Policy` | camera, microphone, geolocation, payment, usb, sensors all `()` | The site uses none of them. |

Two things to know before applying HSTS with those directives:

- `includeSubDomains` covers **every** subdomain — `app.fintela.io` and the
  backend included. They are HTTPS-only today; this makes that permanent for
  two years in every browser that has visited fintela.io.
- `preload` is inert until the domain is submitted at
  <https://hstspreload.org>. Submission is effectively irreversible. Submit
  only once the above is a decision, not an observation.

**No `Content-Security-Policy` yet.** A strict CSP needs nonces or hashes for
the inline Clarity loader in `index.html`, `style-src` allowances for Emotion's
runtime `<style>` tags and Google Fonts, and `connect-src` for Clarity's
collectors and the backend. That is its own project, to be done with
`Content-Security-Policy-Report-Only` first. The headers above are the
uncontroversial baseline.

### The cache policy

Today the default behaviour caches nothing: the audit saw `x-cache: Miss from
cloudfront` three requests in a row for `/`, the blog JSON, covers and the
hero videos, at the same POP. Every visitor's document, data and media is an
origin round-trip, and the `s-maxage` values the sync sets are ignored.

`cache-policy.json` is origin-driven: min TTL 0, default TTL 0, max TTL one
year, so the TTL is exactly what `scripts/sync-site.sh` puts in each object's
`Cache-Control` (HTML `s-maxage=300`, JSON 900, images and media a week,
hashed assets a year). Nothing else is in the cache key — no headers, no
cookies, no query strings — and gzip/brotli variants are cached.

Why not the managed `UseOriginCacheControlHeaders` policy, which the audit
suggested? Its cache key includes the `Host` header and **all cookies**.
Clarity sets `_clck`/`_clsk` per visitor on this domain, so with that policy
every visitor after their first page view would have a private cache key —
a miss for every JSON, cover and video, which is the problem this is meant to
fix. The custom policy is the managed one minus the cookies and the header.
The `assets/*` behaviour keeps whatever policy it has (it already caches, and
the objects are immutable).

### The 404 document

Both custom error responses point at `/404.html` with `ResponseCode: 404`
and a 60 s error-caching TTL. Both codes, because S3 answers **403** for a
missing key unless the distribution's OAC may `ListBucket` (it may not, per
`src/content/json.ts`). Today they point at `/index.html` with **200**: that is
what makes every unknown URL — and `/robots.txt`, `/sitemap.xml`, a stale
asset hash — a soft 404 that Google indexes as the home page.

`dist/404.html` is produced by the prerender, carries `noindex`, still boots
the SPA (so the visitor gets the designed not-found page), and is
robots-disallowed. `robots.txt` also disallows `/executive-overview.html`, a
standalone page that is not part of the site's navigation.

### HTTP/3 and IPv6

Free wins: `HttpVersion: http2and3` (QUIC shaves handshake time on lossy
mobile links) and `IsIPV6Enabled: true`. The latter only matters once the
apex has an AAAA record (below).

## Order

Nothing here breaks the site if applied in this order; two of the steps
depend on a deploy having happened first.

1. **Merge and deploy the site changes.** `scripts/sync-site.sh` uploads every
   object with the right `Cache-Control` and type; `robots.txt`, the sitemaps,
   the feed, `404.html` and every `<route>/index.html` land in the bucket.
   Verify: `curl -sI https://fintela.io/pricing/index.html` returns
   `content-type: text/html; charset=utf-8` and a `cache-control`.
   (It is served as the SPA either way until step 2.)

2. **Phase 1 of the edge** — everything except the error responses:

   ```bash
   aws login --profile fintela
   infra/cloudfront/apply.sh                          # read the plan
   infra/cloudfront/apply.sh --yes --no-error-responses
   aws cloudfront wait distribution-deployed --id "$CLOUDFRONT_DISTRIBUTION" --profile fintela
   ```

   The function goes live first: the 301s start working, and extensionless
   routes are rewritten to `<route>/index.html`. If a prerendered page is
   missing for some route, S3 answers 403, and the **existing** error response
   still serves `index.html` with 200 — the SPA — so nothing regresses. The
   headers policy, the cache policy, HTTP/3 and IPv6 are safe at any time.

3. **Verify** (next section) that prerendered pages are being served from
   their own objects: `x-cache: Hit from cloudfront` or `Miss from cloudfront`
   for `/pricing`, **not** `Error from cloudfront`.

4. **Phase 2 — the 404 document.** Only once step 3 holds for every route
   class (a page, a post, a doc), because after this an unknown route is a
   real 404 and a missing prerendered page would be too:

   ```bash
   infra/cloudfront/apply.sh --yes
   aws cloudfront wait distribution-deployed --id "$CLOUDFRONT_DISTRIBUTION" --profile fintela
   ```

5. **DNS and Search Console** (below): the AAAA record, optionally `www`, and
   the sitemap submission.

`apply.sh` is idempotent; running it again with nothing to change prints
"up to date" for every step and exits 0. Every step prints its diff and
nothing is written without `--yes`.

## Verify

```bash
# Prerendered pages served from their own objects (not "Error from cloudfront"),
# with the HTML class headers.
curl -sI https://fintela.io/ | grep -iE '^(HTTP|content-type|cache-control|x-cache)'
curl -sI https://fintela.io/pricing | grep -iE '^(HTTP|content-type|cache-control|x-cache)'
curl -sI https://fintela.io/blog/deflated-sharpe | grep -iE '^(HTTP|x-cache)'
curl -sI https://fintela.io/docs/overview | grep -iE '^(HTTP|x-cache)'

# Redirects: one hop each, query string kept.
for p in /index.html /pricing/ /Pricing /docs /solutions /documentation/api/errors \
         /docs/platform-tour '/docs/Managing-Strategies/?ref=x'; do
  printf '%-45s ' "$p"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://fintela.io$p"
done

# A real 404 (after phase 2), with noindex; the 404 document itself is 200.
curl -sI https://fintela.io/this-does-not-exist | grep -iE '^(HTTP|x-cache)'
curl -s https://fintela.io/this-does-not-exist | grep -o '<meta name="robots"[^>]*>'

# Crawler files with their types.
for f in robots.txt sitemap.xml sitemap-blog.xml feed.xml site.webmanifest; do
  printf '%-20s ' "$f"; curl -sI "https://fintela.io/$f" | grep -i '^content-type'
done

# Security headers on every class of response.
curl -sI https://fintela.io/ | grep -iE '^(strict-transport|x-content-type|x-frame|referrer-policy|permissions-policy)'
curl -sI https://fintela.io/blog/index.json | grep -i '^strict-transport'

# The edge caches: the second request is a Hit.
for i in 1 2; do curl -sI https://fintela.io/blog/index.json | grep -i '^x-cache'; done

# Asset types the CLI had to be told about (only relevant if such files exist).
curl -sI "https://fintela.io/$(curl -s https://fintela.io/ | grep -o 'assets/[^"]*\.js' | head -1)" | grep -iE '^(content-type|cache-control)'

# HTTP/3 advertised, IPv6 answered.
curl -sI https://fintela.io/ | grep -i '^alt-svc'
dig +short AAAA fintela.io
```

Then the tools: Google's Rich Results Test on a post and a doc page,
`https://fintela.io/sitemap.xml` submitted in Search Console, and a Lighthouse
run on `/` and `/docs/overview` (the best-practices audit now sees HSTS).

## Roll back

Each piece is independent; undo whichever misbehaves.

- **A wrong redirect rule.** Fix `router.js`, run the tests, `apply.sh --yes`.
  Browsers cache 301s for a day (`cache-control` on the redirect), so a wrong
  rule that shipped is wrong for up to a day for people who hit it.
- **The function altogether.** Remove the `viewer-request` association from
  the default behaviour (console: distribution → Behaviors → Default →
  Function associations), or with the CLI: get-distribution-config, set
  `DefaultCacheBehavior.FunctionAssociations` to `{"Quantity": 0}`,
  update-distribution with the ETag. Unknown routes go back to being served
  through the error path.
- **The error responses.** Point both back at `/index.html` with
  `ResponseCode: 200`; every route is served as the SPA again. This is the
  only change that can take pages down, and only if prerendered objects are
  missing — which step 3 above exists to rule out.
- **The headers policy.** Detach it (set `ResponseHeadersPolicyId` to null on
  each behaviour). HSTS already sent stays in browsers until it expires;
  that is the nature of it and why the directives are worth a decision.
- **The cache policy.** Attach the managed `CachingDisabled` policy
  (`4135ea2d-6df8-44a3-9df3-4b5a84be39ad`) to the default behaviour to get
  today's no-cache behaviour back, and invalidate `/*`.

## DNS: IPv6, www, and the verification token

The zone is in Route 53 (`aws route53 list-hosted-zones-by-name --dns-name
fintela.io. --profile fintela`). CloudFront's alias hosted-zone id is the
constant `Z2FDTNDATAQYW2`; `DIST_DOMAIN` below is the distribution's
`d…cloudfront.net` name.

**IPv6.** The apex has no AAAA record, so the site is IPv4-only even after
`IsIPV6Enabled`. Add the alias:

```bash
ZONE=$(aws route53 list-hosted-zones-by-name --dns-name fintela.io. --profile fintela \
        --query 'HostedZones[0].Id' --output text)
aws route53 change-resource-record-sets --hosted-zone-id "$ZONE" --profile fintela --change-batch '{
  "Changes": [{"Action": "UPSERT", "ResourceRecordSet": {
    "Name": "fintela.io.", "Type": "AAAA",
    "AliasTarget": {"HostedZoneId": "Z2FDTNDATAQYW2", "DNSName": "'"$DIST_DOMAIN"'", "EvaluateTargetHealth": false}}}]}'
```

**www.** `www.fintela.io` does not resolve at all (NXDOMAIN): a typed or
linked `www.` URL is a DNS error, and Google cannot consolidate the two
forms. The router already 301s `www` → apex; it needs traffic to reach the
distribution first, which takes three things, in this order:

1. A certificate that covers both names, in **us-east-1** (CloudFront's
   region for certificates):
   `aws acm request-certificate --region us-east-1 --profile fintela --domain-name fintela.io --subject-alternative-names www.fintela.io --validation-method DNS`,
   then add the CNAME validation records it prints to Route 53 and wait for
   `ISSUED`.
2. On the distribution (a `get-distribution-config` → jq → `update-distribution`
   like `apply.sh` does): `Aliases` = `["fintela.io", "www.fintela.io"]`,
   `ViewerCertificate.ACMCertificateArn` = the new certificate,
   `SSLSupportMethod: sni-only`, `MinimumProtocolVersion: TLSv1.2_2021`.
3. A and AAAA alias records for `www.fintela.io.` with the same change-batch
   shape as the AAAA above.

This is optional. Without it `www` stays a DNS error, which is a worse
failure than a redirect but not an SEO one — nothing links to it.

**Search Console.** A Google verification TXT is **already published** on the
apex (`dig +short TXT fintela.io` shows a `google-site-verification=…` value
next to the SPF record). Two ways to verify, use either or both:

- *Domain property (recommended):* Search Console → Add property → **Domain**
  → `fintela.io`. If the Google account that issued the existing token is
  used, it verifies immediately. Otherwise Google issues a new token — add it
  as an **additional** TXT string; Route 53 replaces the whole record set, so
  re-list every existing value (the SPF one included) in the change-batch.
  A Domain property covers http/https/www/subdomains and survives every
  deploy.
- *Meta tag:* set the repository variable `VITE_GOOGLE_SITE_VERIFICATION` in
  GitHub (Settings → Secrets and variables → Actions → Variables) to the
  token; the prerender emits `<meta name="google-site-verification">` on every
  page when it is set. This verifies the `https://fintela.io/` URL-prefix
  property only and ties ownership to whoever holds the token — fine as a
  second owner, not as the only one.

Then submit `https://fintela.io/sitemap.xml` under the property. Bing
Webmaster Tools can import the verified property from Search Console.
