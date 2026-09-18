// fintela.io viewer-request router — CloudFront Functions, runtime cloudfront-js-2.0.
// Attached to the DEFAULT cache behaviour, event type viewer-request. Applied by
// infra/cloudfront/apply.sh; tested by infra/cloudfront/router.test.mjs.
//
// The origin is an S3 REST endpoint: it cannot redirect and has no notion of a
// directory index, so every URL rule the site needs lives here, in this order:
//
//   1. www.fintela.io          → 301 https://fintela.io<same path>
//   2. /index.html forms       → 301 the route (never expose the storage layout)
//   3. uppercase in a route    → 301 lowercase (react-router matched case-insensitively,
//                                so /Pricing was a 200 duplicate of /pricing)
//   4. trailing or doubled /   → 301 the clean form ('/' excepted)
//   5. /documentation/*        → 301 /docs/<slug>   (LEGACY_DOC_PATHS)
//      /docs/<renamed>         → 301 /docs/<new>    (DOC_SLUG_REDIRECTS)
//      /docs, /solutions       → 301 their landing page (the SPA did this client-side)
//   6. any URI with no file extension → REWRITE to <uri>/index.html, the prerendered
//      page. A route with no prerendered object falls through to S3's 403/404, which
//      the distribution's custom error response turns into /404.html with status 404.
//
// Steps 2–5 are folded into one target so a URL that breaks several rules
// (/Docs/Platform-Tour/) is fixed in a single 301. The query string survives
// every redirect. Files (anything with an extension) are passed through untouched,
// except that /index.html forms are canonicalised.
//
// The runtime is ES 5.1 plus a subset of ES6+; this file deliberately sticks to
// ES5 (var, function, string concatenation) and stays well under the 10 KB limit.
// CloudFront Functions cannot read files or env vars, so the maps are copied here.

// Copied VERBATIM from src/App.tsx — that file is the source of truth, and
// router.test.mjs fails when the two drift. Keep every entry forever: the
// whole point is that an old URL never stops resolving.
var LEGACY_DOC_PATHS = {
  '': 'overview',
  'platform': 'navigation',
  'quickstart': 'quickstart',
  'concepts': 'core-concepts',
  'workflows/strategies': 'strategies',
  'workflows/risk-managers': 'risk-managers',
  'workflows/studies': 'studies',
  'workflows/results': 'analyzing-results',
  'workflows/live-trading': 'live-trading',
  'modes': 'execution-modes',
  'optimizer/samplers': 'sampler-selection',
  'configuration/additional-data': 'data-explorer',
  'optimizer/lifecycle': 'study-lifecycle',
  'modes/external-strategies': 'external-strategies',
  'modes/external-fitness': 'external-fitness',
  'optimizer/architecture': 'optimizer-architecture',
  'guides/python': 'python-fastapi',
  'guides/node': 'node-express',
  'api': 'api-overview',
  'api/strategies': 'api-strategies',
  'api/studies': 'api-studies',
  'api/trials-portfolios': 'api-trials-portfolios',
  'api/baskets': 'api-baskets',
  'api/fitness-data': 'api-fitness',
  'api/errors': 'api-errors',
  'datacluster': 'core-concepts',
  'engine': 'optimizer-architecture',
  'roles': 'api-overview'
};

var DOC_SLUG_REDIRECTS = {
  'platform-tour': 'navigation',
  'managing-strategies': 'strategies',
  'managing-risk-managers': 'risk-managers',
  'running-optimizations': 'studies',
  'data-pipelines': 'data-explorer',
  'api-fitness-and-asset-groups': 'api-fitness'
};

// src/App.tsx: <Route path="/docs"> and <Route path="/solutions"> are <Navigate replace>.
var INDEX_REDIRECTS = {
  '/docs': '/docs/overview',
  '/solutions': '/solutions/hedge-funds'
};

var APEX = 'https://fintela.io';

// Prefixes whose object keys legitimately contain uppercase (Vite hashes, media
// and image file names). Everything else is a route, and routes are lowercase.
var CASE_SENSITIVE_PREFIXES = [
  '/assets/', '/media/', '/blog/covers/', '/og/', '/brand/', '/blog-assets/', '/docs-assets/'
];

// Own properties only: '/docs/constructor' must not find Object.prototype.
function lookup(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

function startsWithAny(uri, prefixes) {
  for (var i = 0; i < prefixes.length; i++) {
    if (uri.indexOf(prefixes[i]) === 0) return true;
  }
  return false;
}

// True when the last path segment has a file extension.
function isFile(uri) {
  var last = uri.slice(uri.lastIndexOf('/') + 1);
  return last.indexOf('.') !== -1;
}

// Encode a query component. The event object hands values over already parsed;
// percent-encode them for the Location header, but leave an existing %XX
// escape alone so a value that arrived encoded is not encoded twice.
function encode(value) {
  return encodeURIComponent(value).replace(/%25([0-9A-Fa-f]{2})/g, '%$1');
}

function queryString(request) {
  var qs = request.querystring;
  var keys = Object.keys(qs);
  if (keys.length === 0) return '';
  var parts = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var entry = qs[key];
    var values = entry.multiValue ? entry.multiValue : [entry];
    for (var j = 0; j < values.length; j++) {
      var value = values[j].value;
      parts.push(encode(key) + (value === '' ? '' : '=' + encode(value)));
    }
  }
  return '?' + parts.join('&');
}

function redirect(location, request) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      'location': { value: location + queryString(request) },
      // Browsers cache 301s; a day bounds the blast radius of a wrong rule.
      'cache-control': { value: 'public, max-age=86400' }
    }
  };
}

// The canonical path for a URI, or the URI itself when it is already canonical.
function canonicalPath(uri) {
  var path = uri.replace(/\/{2,}/g, '/');

  // /index.html and /<route>/index.html → the route.
  if (path === '/index.html') path = '/';
  else if (path.length > 11 && path.slice(-11) === '/index.html') path = path.slice(0, -11);

  // Trailing slash, root excepted.
  if (path.length > 1) path = path.replace(/\/+$/, '');

  // Routes are lowercase; object keys under the media prefixes are not ours to touch.
  if (!startsWithAny(path, CASE_SENSITIVE_PREFIXES) && path.slice(-5) !== '.json') {
    path = path.toLowerCase();
  }

  // Legacy /documentation tree: unknown tail → overview, one hop (App.tsx LegacyDocsRedirect).
  if (path === '/documentation' || path.indexOf('/documentation/') === 0) {
    var tail = path.replace(/^\/documentation\/?/, '');
    return '/docs/' + (lookup(LEGACY_DOC_PATHS, tail) || 'overview');
  }

  // Renamed doc slugs (App.tsx DocPageOrRedirect).
  if (path.indexOf('/docs/') === 0) {
    var renamed = lookup(DOC_SLUG_REDIRECTS, path.slice(6));
    if (renamed) return '/docs/' + renamed;
  }

  // Index routes the SPA bounced client-side.
  var index = lookup(INDEX_REDIRECTS, path);
  if (index) return index;

  return path;
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : '';
  var uri = request.uri;
  var target = canonicalPath(uri);

  // www → apex, with the path already canonical so it is one hop. Effective once
  // www.fintela.io is an alternate domain name on the distribution (README);
  // harmless before that.
  if (host === 'www.fintela.io') return redirect(APEX + target, request);

  if (target !== uri) return redirect(target, request);

  // Serve the prerendered page. A file (anything with an extension) is what it is.
  if (target === '/') {
    request.uri = '/index.html';
  } else if (!isFile(target)) {
    request.uri = target + '/index.html';
  }
  return request;
}
