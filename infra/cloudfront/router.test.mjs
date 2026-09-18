// Tests for infra/cloudfront/router.js — run with `node --test infra/cloudfront/router.test.mjs`.
//
// The function is loaded into a bare `vm` context (no Node globals) so anything
// it uses outside ES5 + the CloudFront runtime surfaces here rather than at the
// edge. The last block asserts its redirect maps equal the ones in src/App.tsx,
// which is the source of truth: a rename there without a matching edit here
// fails CI instead of silently 404ing at the edge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = await readFile(path.join(here, 'router.js'), 'utf8');

// Same shape the console's test event uses. Bare context: a ReferenceError for
// `process`, `require` or `URL` here means the code would fail in production.
const sandbox = vm.createContext({});
vm.runInContext(`${source}\nthis.__router = { handler, LEGACY_DOC_PATHS, DOC_SLUG_REDIRECTS };`, sandbox);
const { handler } = sandbox.__router;
// Copied into this realm: strict deep equality also compares prototypes, and the
// sandbox has its own Object.
const LEGACY_DOC_PATHS = { ...sandbox.__router.LEGACY_DOC_PATHS };
const DOC_SLUG_REDIRECTS = { ...sandbox.__router.DOC_SLUG_REDIRECTS };

const event = (uri, { host = 'fintela.io', querystring = {} } = {}) => ({
  version: '1.0',
  context: { eventType: 'viewer-request' },
  viewer: { ip: '203.0.113.7' },
  request: { method: 'GET', uri, querystring, headers: { host: { value: host } }, cookies: {} },
});

const run = (uri, opts) => handler(event(uri, opts));

/** Asserts a 301 to `location`. */
function expectRedirect(uri, location, opts) {
  const out = run(uri, opts);
  assert.equal(out.statusCode, 301, `${uri}: expected a 301, got ${JSON.stringify(out)}`);
  assert.equal(out.headers.location.value, location, `${uri}: wrong Location`);
  assert.match(out.headers['cache-control'].value, /max-age=/);
  return out;
}

/** Asserts a pass-through/rewrite to the given object key, no redirect. */
function expectRewrite(uri, key, opts) {
  const out = run(uri, opts);
  assert.equal(out.statusCode, undefined, `${uri}: expected a request, got a ${out.statusCode}`);
  assert.equal(out.uri, key, `${uri}: wrong object key`);
  return out;
}

// ── 1. www → apex ──────────────────────────────────────────────────────────

test('www.fintela.io redirects to the apex, path kept', () => {
  expectRedirect('/pricing', 'https://fintela.io/pricing', { host: 'www.fintela.io' });
  expectRedirect('/', 'https://fintela.io/', { host: 'www.fintela.io' });
});

test('www redirect is one hop even when the path also needs fixing', () => {
  expectRedirect('/Docs/Platform-Tour/', 'https://fintela.io/docs/navigation', { host: 'www.fintela.io' });
});

// ── 2. /index.html forms ───────────────────────────────────────────────────

test('/index.html redirects to /', () => {
  expectRedirect('/index.html', '/');
});

test('/<route>/index.html redirects to the route', () => {
  expectRedirect('/pricing/index.html', '/pricing');
  expectRedirect('/blog/deflated-sharpe/index.html', '/blog/deflated-sharpe');
});

test('/docs/index.html lands on the overview in one hop', () => {
  expectRedirect('/docs/index.html', '/docs/overview');
});

// ── 3. Case ────────────────────────────────────────────────────────────────

test('uppercase in a route redirects to lowercase', () => {
  expectRedirect('/Pricing', '/pricing');
  expectRedirect('/Blog/Deflated-Sharpe', '/blog/deflated-sharpe');
  expectRedirect('/SOLUTIONS/Hedge-Funds', '/solutions/hedge-funds');
});

test('uppercase under the asset and media prefixes is left alone', () => {
  expectRewrite('/assets/index-DQlxbFHC.js', '/assets/index-DQlxbFHC.js');
  expectRewrite('/media/Hero-Backdrop.mp4', '/media/Hero-Backdrop.mp4');
  expectRewrite('/blog/covers/Climate-Analysis.JPG', '/blog/covers/Climate-Analysis.JPG');
  expectRewrite('/og/Default.png', '/og/Default.png');
  expectRewrite('/brand/Fintela-Mark-512.png', '/brand/Fintela-Mark-512.png');
  expectRewrite('/blog-assets/Diagram.png', '/blog-assets/Diagram.png');
  expectRewrite('/docs-assets/Diagram.png', '/docs-assets/Diagram.png');
});

test('*.json is never lowercased', () => {
  expectRewrite('/blog/Deflated-Sharpe.json', '/blog/Deflated-Sharpe.json');
});

// ── 4. Slashes ─────────────────────────────────────────────────────────────

test('trailing slash redirects to the clean form', () => {
  expectRedirect('/pricing/', '/pricing');
  expectRedirect('/blog/deflated-sharpe/', '/blog/deflated-sharpe');
  expectRedirect('/docs/overview/', '/docs/overview');
});

test('the root keeps its slash', () => {
  expectRewrite('/', '/index.html');
});

test('doubled slashes collapse', () => {
  expectRedirect('//pricing', '/pricing');
  expectRedirect('/blog//deflated-sharpe/', '/blog/deflated-sharpe');
});

// ── 5. Redirect maps ───────────────────────────────────────────────────────

test('every LEGACY_DOC_PATHS entry redirects /documentation/<key> → /docs/<slug>', () => {
  for (const [key, slug] of Object.entries(LEGACY_DOC_PATHS)) {
    const from = key === '' ? '/documentation' : `/documentation/${key}`;
    expectRedirect(from, `/docs/${slug}`);
    expectRedirect(`${from}/`, `/docs/${slug}`);
  }
});

test('an unknown /documentation path lands on the overview', () => {
  expectRedirect('/documentation/no-such-page', '/docs/overview');
  expectRedirect('/documentation/', '/docs/overview');
});

test('every DOC_SLUG_REDIRECTS entry redirects /docs/<old> → /docs/<new>', () => {
  for (const [from, to] of Object.entries(DOC_SLUG_REDIRECTS)) {
    expectRedirect(`/docs/${from}`, `/docs/${to}`);
  }
});

test('a renamed slug with a trailing slash and mixed case is one hop', () => {
  expectRedirect('/docs/Managing-Strategies/', '/docs/strategies');
});

test('map lookups ignore Object.prototype', () => {
  expectRewrite('/docs/constructor', '/docs/constructor/index.html');
  expectRewrite('/docs/tostring', '/docs/tostring/index.html');
  expectRedirect('/documentation/constructor', '/docs/overview');
  expectRedirect('/documentation/__proto__', '/docs/overview');
  expectRewrite('/hasownproperty', '/hasownproperty/index.html');
});

test('/docs and /solutions redirect to their landing pages', () => {
  expectRedirect('/docs', '/docs/overview');
  expectRedirect('/docs/', '/docs/overview');
  expectRedirect('/solutions', '/solutions/hedge-funds');
  expectRedirect('/solutions/', '/solutions/hedge-funds');
});

// ── 6. Rewrites ────────────────────────────────────────────────────────────

test('extensionless routes rewrite to their prerendered index.html', () => {
  expectRewrite('/pricing', '/pricing/index.html');
  expectRewrite('/contact', '/contact/index.html');
  expectRewrite('/blog', '/blog/index.html');
  expectRewrite('/blog/deflated-sharpe', '/blog/deflated-sharpe/index.html');
  expectRewrite('/docs/overview', '/docs/overview/index.html');
  expectRewrite('/solutions/hedge-funds', '/solutions/hedge-funds/index.html');
  expectRewrite('/risk-disclosures', '/risk-disclosures/index.html');
});

test('an unknown route is rewritten too, so S3 answers 403/404 and the error document serves', () => {
  expectRewrite('/this-does-not-exist', '/this-does-not-exist/index.html');
  expectRewrite('/docs/no-such-doc', '/docs/no-such-doc/index.html');
});

test('files pass through untouched', () => {
  for (const file of [
    '/404.html',
    '/executive-overview.html',
    '/robots.txt',
    '/sitemap.xml',
    '/sitemap-blog.xml',
    '/feed.xml',
    '/site.webmanifest',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/blog/index.json',
    '/docs/overview.json',
    '/docs/search.json',
    '/blog/covers/og/deflated-sharpe.jpg',
    '/media/captions/platform-home.en.vtt',
  ]) {
    expectRewrite(file, file);
  }
});

// ── 7. Query strings ───────────────────────────────────────────────────────

test('a rewrite keeps the query string object intact', () => {
  const qs = { for: { value: 'teams' } };
  const out = expectRewrite('/', '/index.html', { querystring: qs });
  assert.deepEqual(out.querystring, qs);
  const out2 = expectRewrite('/contact', '/contact/index.html', { querystring: { intent: { value: 'walkthrough' } } });
  assert.equal(out2.querystring.intent.value, 'walkthrough');
});

test('a redirect preserves the query string', () => {
  expectRedirect('/Pricing', '/pricing?utm_source=newsletter&utm_medium=email', {
    querystring: { utm_source: { value: 'newsletter' }, utm_medium: { value: 'email' } },
  });
  expectRedirect('/docs/', '/docs/overview?ref=app', { querystring: { ref: { value: 'app' } } });
});

test('a redirect preserves repeated keys, empty values and encodes what needs it', () => {
  expectRedirect('/blog/', '/blog?tag=a&tag=b&flag&q=hello%20world', {
    querystring: {
      tag: { value: 'a', multiValue: [{ value: 'a' }, { value: 'b' }] },
      flag: { value: '' },
      q: { value: 'hello world' },
    },
  });
});

test('a value that arrives percent-encoded is not encoded twice', () => {
  expectRedirect('/pricing/', '/pricing?q=hello%20world', { querystring: { q: { value: 'hello%20world' } } });
});

test('www redirect keeps the query string too', () => {
  expectRedirect('/pricing', 'https://fintela.io/pricing?a=1', {
    host: 'www.fintela.io',
    querystring: { a: { value: '1' } },
  });
});

// ── 8. The maps equal src/App.tsx ──────────────────────────────────────────

/** The object literal assigned to `const <name>: Record<string, string> = {…};` in App.tsx. */
function mapFromAppTsx(tsx, name) {
  const re = new RegExp(`const ${name}: Record<string, string> = \\{([\\s\\S]*?)\\n\\};`);
  const match = re.exec(tsx);
  assert.ok(match, `src/App.tsx no longer declares ${name}`);
  const map = {};
  for (const line of match[1].split('\n')) {
    const entry = /^\s*(?:'([^']*)'|([A-Za-z_][\w-]*)):\s*'([^']*)',?\s*(?:\/\/.*)?$/.exec(line);
    if (entry) map[entry[1] ?? entry[2]] = entry[3];
  }
  return map;
}

test('LEGACY_DOC_PATHS and DOC_SLUG_REDIRECTS are verbatim copies of src/App.tsx', async () => {
  const tsx = await readFile(path.join(here, '..', '..', 'src', 'App.tsx'), 'utf8');
  assert.deepEqual(LEGACY_DOC_PATHS, mapFromAppTsx(tsx, 'LEGACY_DOC_PATHS'));
  assert.deepEqual(DOC_SLUG_REDIRECTS, mapFromAppTsx(tsx, 'DOC_SLUG_REDIRECTS'));
  assert.ok(Object.keys(LEGACY_DOC_PATHS).length >= 28, 'the legacy map lost entries');
  assert.ok(Object.keys(DOC_SLUG_REDIRECTS).length >= 6, 'the renamed-slug map lost entries');
});

test('the two maps never chain: no legacy target is a renamed slug', () => {
  for (const target of Object.values(LEGACY_DOC_PATHS)) {
    assert.ok(!(target in DOC_SLUG_REDIRECTS), `/documentation → /docs/${target} would need a second hop`);
  }
});

// ── 9. Deployability ───────────────────────────────────────────────────────

test('stays under the 10 KB CloudFront Functions limit and uses no ES6+ syntax', () => {
  assert.ok(Buffer.byteLength(source, 'utf8') < 10 * 1024, 'router.js is 10 KB or more');
  const code = source.replace(/\/\/.*$/gm, ''); // comments may say what code may not
  assert.doesNotMatch(code, /=>|`|\?\.|\.\.\.|\b(?:let|const|class|async|await)\b/, 'ES6+ syntax found');
  assert.doesNotMatch(code, /\b(?:require|process|module|exports|URL|fetch)\b/, 'Node-only global used');
});
