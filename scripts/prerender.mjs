#!/usr/bin/env node
// Static-site generation for fintela-landing.
//
// Runs after `vite build` (see the `build` script in package.json) and turns
// the single-page `dist/index.html` into one HTML document per route, each
// carrying its own <title>/<meta>/canonical, its JSON-LD, the critical CSS for
// its markup, the JSON it rendered from (for the browser to seed before
// hydrating) and a modulepreload hint for its route chunk. It also writes the
// sitemaps and the blog's RSS feed, because they are built from the same
// route list and the same content.
//
// The rendering itself lives in src/entry-server.tsx, which this script builds
// with Vite (into .prerender/) and imports. Nothing here knows what a page
// looks like; it only knows the contract: render(url, { lang, data }) →
// { head, html, styles, status, data }, and routesFor(data) → the routes.
//
// Usage: node scripts/prerender.mjs
//   PRERENDER_DIST=<dir>          the client build to prerender (default dist)
//   PRERENDER_MODE=development    a React development build, for hydration
//                                 checks — never for a deploy
//
// Exits non-zero when any route renders empty, lacks a <title>, or reports a
// status other than the one expected, so a broken prerender cannot deploy.

import { build } from 'vite'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MODE = process.env.PRERENDER_MODE === 'development' ? 'development' : 'production'
// MUI labels its Emotion class names outside production, and the label is part
// of the hash — so the server must run the same NODE_ENV as the bundle it has
// to hydrate against, or every className would differ.
process.env.NODE_ENV = MODE
const DIST = path.resolve(ROOT, process.env.PRERENDER_DIST || 'dist')
const SSR_OUT = path.resolve(ROOT, '.prerender')
const LANG = 'en'
const DATA_SCRIPT_ID = '__fintela_data'

/** The source module behind each lazy route, for the modulepreload hint. */
const PAGE_MODULES = [
  [/^\/pricing$/, 'src/pages/PricingPage.tsx'],
  [/^\/contact$/, 'src/pages/ContactPage.tsx'],
  [/^\/blog$/, 'src/pages/BlogPage.tsx'],
  [/^\/blog\//, 'src/pages/BlogPostPage.tsx'],
  [/^\/product\/agentic-ai$/, 'src/pages/AgenticAiPage.tsx'],
  [/^\/product\/samplers$/, 'src/pages/SamplersPage.tsx'],
  [/^\/solutions\//, 'src/pages/SolutionPage.tsx'],
  [/^\/terms$/, 'src/pages/TermsPage.tsx'],
  [/^\/privacy$/, 'src/pages/PrivacyPage.tsx'],
  [/^\/risk-disclosures$/, 'src/pages/RiskDisclosuresPage.tsx'],
  [/^\/docs\//, 'src/pages/DocPage.tsx'],
]
const NOT_FOUND_MODULE = 'src/pages/NotFoundPage.tsx'

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const today = () => new Date().toISOString().slice(0, 10)

// ---------------------------------------------------------------------------
// (a) the SSR bundle
// ---------------------------------------------------------------------------
async function buildServerEntry() {
  await build({
    root: ROOT,
    mode: MODE,
    logLevel: 'warn',
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: SSR_OUT,
      emptyOutDir: true,
      copyPublicDir: false,
      manifest: false,
      rollupOptions: {
        onwarn(warning, warn) {
          // The pages are lazy in App.tsx and eager in entry-server.tsx on
          // purpose; Rollup's note about it is expected here.
          if (/dynamically imported by .* but also statically imported/.test(warning.message)) return
          warn(warning)
        },
      },
    },
  })
  return import(pathToFileURL(path.join(SSR_OUT, 'entry-server.js')).href)
}

// ---------------------------------------------------------------------------
// (c) inputs: the template and the content JSON
// ---------------------------------------------------------------------------
async function readJsonDir(dir) {
  const out = new Map()
  if (!existsSync(dir)) return out
  for (const name of await readdir(dir)) {
    if (!name.endsWith('.json')) continue
    out.set(name, JSON.parse(await readFile(path.join(dir, name), 'utf8')))
  }
  return out
}

async function readManifest() {
  const file = path.join(DIST, '.vite', 'manifest.json')
  return existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : null
}

/**
 * The chunks a lazy route needs that the entry has not already loaded, as
 * modulepreload links. Walks the chunk's static imports; skips the entry's own
 * closure, which the template already preloads.
 */
function modulePreloads(manifest, moduleId) {
  if (!manifest || !moduleId || !manifest[moduleId]) return ''
  const closure = (id, seen) => {
    const chunk = manifest[id]
    if (!chunk || seen.has(chunk.file)) return seen
    seen.add(chunk.file)
    for (const dep of chunk.imports ?? []) closure(dep, seen)
    return seen
  }
  const entryFiles = closure('index.html', new Set())
  const files = [...closure(moduleId, new Set())].filter((f) => !entryFiles.has(f))
  return files.map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`).join('\n')
}

/**
 * The web fonts as preload links. src/index.css declares them from the
 * @fontsource-variable packages and Vite hashes the files into assets/, so
 * the browser would otherwise discover them only after the stylesheet — a
 * round trip of fallback text on every cold visit. Inter (latin) is every
 * page's body face; JetBrains Mono is preloaded on documentation pages only,
 * where code blocks sit above the fold.
 */
async function fontPreloads() {
  const files = existsSync(path.join(DIST, 'assets')) ? await readdir(path.join(DIST, 'assets')) : []
  const link = (name) => {
    const file = files.find((f) => f.startsWith(`${name}-`) && f.endsWith('.woff2'))
    return file ? `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/${file}">` : ''
  }
  return { inter: link('inter-latin-wght-normal'), mono: link('jetbrains-mono-latin-wght-normal') }
}

// ---------------------------------------------------------------------------
// (d) documents
// ---------------------------------------------------------------------------
function assemble(template, rendered, { preloads, data, partial }) {
  const { head, html, styles } = rendered
  if (!html.trim()) throw new Error('empty markup')
  if (!/<title>[^<]+<\/title>/.test(head)) throw new Error('no <title> in the rendered head')

  // Indented like the template's own head lines, so the output reads as one document.
  const headBits = [head, styles, preloads]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
  let doc = template
  const htmlTag = /<html lang="[a-z-]+">/i
  if (!htmlTag.test(doc)) throw new Error('template has no <html lang> tag')
  doc = doc.replace(htmlTag, `<html lang="${LANG}">`)
  if (!doc.includes('</head>')) throw new Error('template has no </head>')
  doc = doc.replace('</head>', `${headBits}\n  </head>`)
  const root = '<div id="root"></div>'
  if (!doc.includes(root)) throw new Error('template has no empty #root')
  doc = doc.replace(root, `<div id="root">${html}</div>`)
  if ((data && Object.keys(data).length) || (partial && Object.keys(partial).length)) {
    // Every `<` becomes its \u003c escape: still valid JSON, and neither
    // `</script>` nor `<!--` can form inside the element whatever the content says.
    const payload = JSON.stringify({ json: data ?? {}, partial: partial ?? {} }).replace(/</g, '\\u003c')
    doc = doc.replace(
      '</body>',
      `<script id="${DATA_SCRIPT_ID}" type="application/json">${payload}</script>\n  </body>`,
    )
  }
  return doc
}

const outputPath = (route) =>
  route === '/' ? path.join(DIST, 'index.html') : path.join(DIST, route.replace(/^\//, ''), 'index.html')

// ---------------------------------------------------------------------------
// (f) sitemaps and feed
// ---------------------------------------------------------------------------
const shallowRepo = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--is-shallow-repository'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim() !== 'false'
  } catch {
    return true
  }
})()

/**
 * The last commit that touched `sourcePath`, as YYYY-MM-DD — or null when git
 * cannot say. A shallow clone cannot: its one commit "touched" every file, and
 * reporting that date would tell crawlers every page changed today.
 */
function gitDate(sourcePath) {
  if (shallowRepo || !sourcePath) return null
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', sourcePath], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null
  } catch {
    return null
  }
}

/** The later of the content's own date and git's, both YYYY-MM-DD. */
const lastmod = (own, sourcePath) => {
  const fromGit = gitDate(sourcePath)
  return fromGit && (!own || fromGit > own) ? fromGit : own || null
}

const urlset = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries
    .map(({ loc, lastmod }) =>
      `  <url>\n    <loc>${esc(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`

const sitemapIndex = (files, siteUrl) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  files.map((f) => `  <sitemap>\n    <loc>${esc(`${siteUrl}/${f}`)}</loc>\n  </sitemap>`).join('\n') +
  `\n</sitemapindex>\n`

const rfc822 = (date) => new Date(`${date}T00:00:00Z`).toUTCString()

const IMAGE_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml' }

async function feed(posts, entry, copy) {
  const { SITE_URL, absoluteUrl, blogAssetUrl } = entry
  const items = []
  for (const post of posts) {
    const link = absoluteUrl(`/blog/${post.slug}`)
    let enclosure = ''
    // Only a cover the build published itself can be an enclosure: its size
    // is on disk, and a hot-linked image is not ours to promise.
    if (post.cover && !/^(https?:|data:|\/)/i.test(post.cover)) {
      const file = path.join(DIST, 'blog', post.cover)
      const type = IMAGE_TYPES[path.extname(post.cover).toLowerCase()]
      if (type && existsSync(file)) {
        const { size } = await stat(file)
        enclosure = `\n      <enclosure url="${esc(absoluteUrl(blogAssetUrl(post.cover)))}" type="${type}" length="${size}"/>`
      }
    }
    items.push(
      `    <item>\n` +
        `      <title>${esc(post.title)}</title>\n` +
        `      <link>${esc(link)}</link>\n` +
        `      <guid isPermaLink="true">${esc(link)}</guid>\n` +
        `      <pubDate>${rfc822(post.date)}</pubDate>\n` +
        `      <description>${esc(post.excerpt)}</description>\n` +
        `      <dc:creator>${esc(post.author)}</dc:creator>` +
        (post.tags ?? []).map((t) => `\n      <category>${esc(t)}</category>`).join('') +
        enclosure +
        `\n    </item>`,
    )
  }
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
    `  <channel>\n` +
    `    <title>${esc(copy.title)}</title>\n` +
    `    <link>${esc(absoluteUrl('/blog'))}</link>\n` +
    `    <description>${esc(copy.description)}</description>\n` +
    `    <language>${LANG}</language>\n` +
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
    `    <atom:link href="${esc(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml"/>\n` +
    items.join('\n') +
    `\n  </channel>\n</rss>\n`
  )
}

// ---------------------------------------------------------------------------
async function main() {
  const template = await readFile(path.join(DIST, 'index.html'), 'utf8')
  if (template.includes(`id="${DATA_SCRIPT_ID}"`) || !template.includes('<div id="root"></div>')) {
    throw new Error(`${path.relative(ROOT, DIST)}/index.html is already prerendered; run \`vite build\` first`)
  }

  const entry = await buildServerEntry()
  const { render, routesFor, STATIC_ROUTES, SITE_URL, absoluteUrl, blogJsonUrl, docJsonUrl } = entry

  const blogFiles = await readJsonDir(path.join(DIST, 'blog'))
  const docFiles = await readJsonDir(path.join(DIST, 'docs'))
  const data = {}
  for (const [file, json] of blogFiles) data[blogJsonUrl(file)] = json
  for (const [file, json] of docFiles) data[docJsonUrl(file)] = json

  const manifest = await readManifest()
  const fonts = await fontPreloads()
  const routes = routesFor(data)
  const failures = []

  for (const route of routes) {
    const rendered = await render(route.path, { lang: LANG, data: route.data, partial: route.partial })
    try {
      if (rendered.status !== 200) throw new Error(`rendered as ${rendered.status}`)
      const moduleId = PAGE_MODULES.find(([re]) => re.test(route.path))?.[1]
      const doc = assemble(template, rendered, {
        preloads: [
          fonts.inter,
          route.path.startsWith('/docs/') ? fonts.mono : '',
          modulePreloads(manifest, moduleId),
        ]
          .filter(Boolean)
          .join('\n'),
        data: rendered.data,
        partial: rendered.partial,
      })
      const file = outputPath(route.path)
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, doc)
    } catch (err) {
      failures.push(`${route.path}: ${err.message}`)
    }
  }

  // (e) the 404 document: an unknown path, no data, noindex from the page itself.
  try {
    const rendered = await render('/__prerender_404__', { lang: LANG, data: {} })
    if (rendered.status !== 404) throw new Error(`unknown path rendered as ${rendered.status}`)
    if (!/name="robots" content="noindex/.test(rendered.head)) throw new Error('404 page is not noindex')
    const doc = assemble(template, rendered, {
      preloads: [fonts.inter, modulePreloads(manifest, NOT_FOUND_MODULE)].filter(Boolean).join('\n'),
      data: null,
      partial: null,
    })
    await writeFile(path.join(DIST, '404.html'), doc)
  } catch (err) {
    failures.push(`404.html: ${err.message}`)
  }

  if (failures.length) {
    console.error(`prerender: ${failures.length} route(s) failed\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }

  // (f) sitemaps: only URLs that answer 200 — never redirects, drafts or the 404.
  const blogIndex = data[blogJsonUrl('index.json')]
  const docsIndex = data[docJsonUrl('index.json')]
  const posts = blogIndex?.posts ?? []
  const docs = docsIndex?.pages ?? []

  let legal = {}
  try {
    const status = JSON.parse(await readFile(path.join(ROOT, 'content/legal/STATUS.json'), 'utf8'))
    for (const doc of Object.values(status.documents ?? {})) {
      const route = doc.public_url && new URL(doc.public_url).pathname
      if (route) legal[route] = lastmod(doc.last_updated, doc.file && `content/legal/${doc.file}`)
    }
  } catch {
    legal = {}
  }

  const pages = STATIC_ROUTES.map((route) => ({
    loc: absoluteUrl(route),
    // The home page changes with every content publish (its Insights band);
    // the rest only when its copy does, which nothing records.
    lastmod: route === '/' ? today() : (legal[route] ?? null),
  }))
  const blog = posts.map((p) => ({
    loc: absoluteUrl(`/blog/${p.slug}`),
    lastmod: lastmod(p.updated ?? p.date, p.sourcePath),
  }))
  const docsUrls = docs.map((d) => ({
    loc: absoluteUrl(`/docs/${d.slug}`),
    lastmod: lastmod(d.updated, d.sourcePath),
  }))

  await writeFile(path.join(DIST, 'sitemap-pages.xml'), urlset(pages))
  await writeFile(path.join(DIST, 'sitemap-blog.xml'), urlset(blog))
  await writeFile(path.join(DIST, 'sitemap-docs.xml'), urlset(docsUrls))
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    sitemapIndex(['sitemap-pages.xml', 'sitemap-blog.xml', 'sitemap-docs.xml'], SITE_URL),
  )

  const copy = JSON.parse(await readFile(path.join(ROOT, 'src/i18n/locales/en/pages.json'), 'utf8'))
  await writeFile(
    path.join(DIST, 'feed.xml'),
    await feed(posts, entry, { title: copy.blog.hero.title, description: copy.seo.blog.description }),
  )

  const total = pages.length + blog.length + docsUrls.length
  console.log(`prerender: ${routes.length} routes, ${total} sitemap URLs`)
  if (shallowRepo) console.log('prerender: shallow checkout, sitemap lastmod from frontmatter only')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
