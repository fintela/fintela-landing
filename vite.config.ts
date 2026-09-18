import { defineConfig, loadEnv } from 'vite'
import type { Plugin, Rollup } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { existsSync, readFileSync } from 'node:fs'
import path from 'path'
import { contentJson } from './vite-plugin-content'

/**
 * `vite preview` the way the edge serves the site. Vite's preview answers
 * every extensionless path with the root index.html (the SPA convention),
 * which after prerendering is the HOME document; CloudFront's viewer-request
 * function instead maps `/pricing` to `pricing/index.html` and an unknown
 * path to `404.html` with a real 404 (infra/cloudfront/). Doing the same
 * here is what makes `npm run preview` show the prerendered pages and lets
 * the hydration checks run locally.
 */
const prerenderedPreview = (): Plugin => ({
  name: 'fintela:prerendered-preview',
  configurePreviewServer(server) {
    const outDir = path.resolve(server.config.root, server.config.build.outDir)
    server.middlewares.use((req, res, next) => {
      const [pathname, query = ''] = (req.url ?? '/').split('?')
      // Files and the root are sirv's business as they are.
      if (pathname === '/' || path.extname(pathname)) return next()
      const clean = pathname.replace(/\/+$/, '')
      if (existsSync(path.join(outDir, clean, 'index.html'))) {
        req.url = `${clean}/index.html${query ? `?${query}` : ''}`
        return next()
      }
      const notFound = path.join(outDir, '404.html')
      if (!existsSync(notFound)) return next()
      // Served here rather than rewritten: sirv would answer 200.
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(readFileSync(notFound))
    })
  },
})

/**
 * `<meta name="google-site-verification">` in the document head, only when
 * `VITE_GOOGLE_SITE_VERIFICATION` is set for the build. Search Console's HTML
 * tag method needs the tag on the live home page and nowhere in the repo, so
 * it is injected from the environment rather than written into index.html.
 */
const siteVerification = (token: string | undefined): Plugin => ({
  name: 'fintela:site-verification',
  transformIndexHtml(html) {
    if (!token) return html
    return {
      html,
      tags: [{ tag: 'meta', attrs: { name: 'google-site-verification', content: token }, injectTo: 'head' }],
    }
  },
})

/**
 * Vendor chunks for the code every page runs.
 *
 * One monolithic entry chunk re-hashes 200 KB of React, MUI and i18next on
 * every copy change, so returning visitors download the libraries again each
 * deploy. Splitting them into three chunks keyed by package gives each a hash
 * that only moves when the dependency does.
 *
 * The split is limited to modules the ENTRY reaches through static imports.
 * A package-wide rule would drag every MUI component used anywhere (the
 * contact form's TextField/Select/Menu chain, the docs' Prose parts) onto the
 * eager path and undo the lazy routes. Reachability is computed binding by
 * binding from the modules' ASTs rather than from `importers`, because the
 * app imports MUI through its barrel (`import { Box } from '@mui/material'`):
 * the barrel statically imports all 100+ components, and following every
 * importer edge would call each of them eager. Only the re-exports whose
 * names are actually imported are followed; a module with code of its own is
 * followed through all of its imports, since all of it executes.
 *
 * Icons (@mui/icons-material) stay with the app: which icons a page uses is
 * app code, and each is a few hundred bytes.
 */
const VENDOR_GROUPS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)\//, 'vendor-react'],
  [
    /^(i18next|react-i18next|i18next-browser-languagedetector|i18next-resources-to-backend|html-parse-stringify|void-elements|use-sync-external-store)\//,
    'vendor-i18n',
  ],
  [
    /^(@mui\/(?!icons-material)[^/]+|@emotion\/[^/]+|stylis|@babel\/runtime|clsx|prop-types|react-is|hoist-non-react-statics|react-transition-group|dom-helpers|@popperjs\/core)\//,
    'vendor-mui',
  ],
]

/** The commonjs plugin's shared helpers: needed by React itself, so they live in the base chunk. */
const COMMONJS_HELPERS = '\0commonjsHelpers.js'

/**
 * `<package path>` of a module id inside node_modules, with Rollup's
 * virtual-module prefix and `?commonjs-*` proxy suffix stripped (a proxy
 * belongs with the module it proxies, or the chunks import each other in a
 * circle); null for app code and virtual helpers.
 */
const moduleKey = (id: string): string => id.replace(/^\0/, '').replace(/\?commonjs-.*$/, '')
const packagePath = (id: string): string | null => {
  const clean = moduleKey(id)
  const at = clean.lastIndexOf('/node_modules/')
  return at === -1 ? null : clean.slice(at + '/node_modules/'.length)
}

type Program = NonNullable<Rollup.ModuleInfo['ast']>
type Names = Set<string> | 'all'
const specifierName = (node: { name?: string; value?: unknown } | null | undefined): string =>
  node?.name ?? String(node?.value ?? 'default')

/**
 * A module with no code of its own — only imports, re-exports and directives
 * (`import * as colors …; export { colors }; export * from …`): a barrel.
 */
const isBarrel = (ast: Program): boolean =>
  ast.body.length > 0 &&
  ast.body.every(
    (node) =>
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportAllDeclaration' ||
      (node.type === 'ExportNamedDeclaration' && !node.declaration) ||
      (node.type === 'ExpressionStatement' && 'directive' in node),
  )

/**
 * Rollup plugin computing, once the graph is complete, the modules the entry
 * reaches statically — minus barrels. Rollup puts every static dependency of
 * an assigned module into its chunk, so assigning the `@mui/material` barrel
 * would drag all 100+ components in, used or not; left out, the components
 * it re-exports are decided one by one. (Decided here because the AST is
 * gone by the time `manualChunks` runs.)
 */
const eagerModules = (into: Set<string>): Rollup.Plugin => ({
  name: 'fintela:eager-modules',
  async buildEnd() {
    const requested = new Map<string, Names>()
    const barrels = new Set<string>()
    const queue: string[] = []
    const request = (id: string, names: Names) => {
      const prev = requested.get(id)
      if (prev === 'all') return
      if (names === 'all' || !prev) {
        requested.set(id, names === 'all' ? 'all' : new Set(names))
        queue.push(id)
        return
      }
      let grew = false
      for (const name of names) {
        if (prev.has(name)) continue
        prev.add(name)
        grew = true
      }
      if (grew) queue.push(id)
    }
    for (const id of this.getModuleIds()) if (this.getModuleInfo(id)?.isEntry) request(id, 'all')

    while (queue.length) {
      const id = queue.shift()!
      const info = this.getModuleInfo(id)
      if (!info || info.isExternal) continue
      const names = requested.get(id)!
      const ast = info.ast as Program | null
      if (!ast) {
        for (const dep of info.importedIds) request(dep, 'all')
        continue
      }
      if (isBarrel(ast)) barrels.add(id)
      const follow = async (source: string, wanted: Names, onlyIfExported = false) => {
        const resolved = await this.resolve(source, id, { skipSelf: true })
        if (!resolved || resolved.external) return
        if (onlyIfExported && wanted !== 'all') {
          // Across `export *` the names asked for are whatever the importer
          // wanted from the barrel; a module that exports none of them (the
          // `fooClasses.js` beside each MUI component) is not needed for them.
          const provided = new Set(this.getModuleInfo(resolved.id)?.exports ?? [])
          wanted = new Set([...wanted].filter((name) => provided.has(name)))
          if (!wanted.size) return
        }
        request(resolved.id, wanted)
      }
      for (const node of ast.body) {
        if (node.type === 'ImportDeclaration') {
          // The module's own code runs whole, so its imports are all needed —
          // but only the bindings it names, not the whole of each target.
          const wanted = new Set<string>()
          let all = false
          for (const s of node.specifiers) {
            if (s.type === 'ImportNamespaceSpecifier') all = true
            else if (s.type === 'ImportDefaultSpecifier') wanted.add('default')
            else wanted.add(specifierName(s.imported))
          }
          await follow(String(node.source.value), all ? 'all' : wanted)
        } else if (node.type === 'ExportNamedDeclaration' && node.source) {
          // `export { default as Box } from './Box'`: follow only what was asked for.
          const wanted = new Set<string>()
          for (const s of node.specifiers) {
            const exported = specifierName(s.exported)
            if (names === 'all' || names.has(exported)) wanted.add(specifierName(s.local))
          }
          if (wanted.size) await follow(String(node.source.value), wanted)
        } else if (node.type === 'ExportAllDeclaration') {
          // `export * from`: pass the request through, kept to the names the
          // target really exports (`export * as ns` counts as one name).
          if (node.exported) {
            if (names === 'all' || names.has(specifierName(node.exported)))
              await follow(String(node.source.value), 'all')
          } else await follow(String(node.source.value), names, true)
        }
      }
    }
    into.clear()
    for (const id of requested.keys()) if (!barrels.has(id)) into.add(moduleKey(id))
  },
})

const vendorChunk = (eager: ReadonlySet<string>) => (id: string): string | undefined => {
  if (id === COMMONJS_HELPERS) return 'vendor-react'
  const pkg = packagePath(id)
  if (!pkg || !eager.has(moduleKey(id))) return undefined
  return VENDOR_GROUPS.find(([re]) => re.test(pkg))?.[1]
}

// https://vite.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  // Dev-server ports. `setup_worktree.sh` writes WEB_PORT / WEB_PREVIEW_PORT into
  // .env.local so each worktree gets its own; 5173 / 4173 (Vite's defaults) remain
  // for an unconfigured checkout. loadEnv is called with an empty prefix, so
  // non-VITE_ variables are visible here — and only here: `envPrefix` still
  // defaults to VITE_, so neither port ever reaches the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.WEB_PORT || 5173)
  const previewPort = Number(env.WEB_PREVIEW_PORT || 4173)
  // Filled by `eagerModules` at the end of the build's analysis, read by
  // `vendorChunk` when Rollup assigns chunks (which happens after).
  const eager = new Set<string>()

  return {
    // `contentJson` turns content/blog/*.md and content/docs/**.md into the
    // blog/*.json and docs/*.json the SPA fetches, in both dev (served from disk per
    // request) and build (emitted into dist/blog/ and dist/docs/). See
    // vite-plugin-content.ts, BLOG.md and DOCS.md.
    plugins: [
      react(),
      // `import still from './x.jpg?w=800;1600&format=avif;webp;jpg&as=picture'`
      // → AVIF/WebP/JPEG rungs at those widths plus the fallback's intrinsic
      // size (src/media/picture.ts). Imports without a directive are left to
      // Vite's own asset handling; public/ is never touched. Encodes are
      // cached under node_modules/.cache/imagetools, and both the client and
      // the SSR build (scripts/prerender.mjs) read that same cache, which is
      // what keeps their hashed asset URLs identical for hydration.
      imagetools(),
      contentJson(),
      siteVerification(env.VITE_GOOGLE_SITE_VERIFICATION),
      prerenderedPreview(),
    ],
    resolve: {
      // The legal documents are counsel's, and the SPA (app.fintela.io) serves the
      // very same files. Import them from `content/legal/` rather than keeping a
      // copy, so the two public hosts cannot drift.
      alias: {
        '@legal': path.resolve(__dirname, 'content/legal'),
      },
    },
    build: {
      // `.vite/manifest.json` tells scripts/prerender.mjs which chunk each
      // lazy page lives in, so every prerendered document can modulepreload
      // its own route's code.
      manifest: true,
      // The SSR bundle (scripts/prerender.mjs) is one Node module with its
      // dependencies external; only the browser build is chunked.
      rollupOptions: isSsrBuild
        ? {}
        : {
            plugins: [eagerModules(eager)],
            output: { manualChunks: vendorChunk(eager) },
          },
    },
    server: {
      port: devPort,
      // FAIL rather than fall back to the next free port: a second dev server
      // that silently takes port+1 is how two worktrees end up sharing one, and
      // the collision only shows up as a page that is not the branch you think.
      strictPort: true,
    },
    preview: { port: previewPort, strictPort: true },
  }
})
