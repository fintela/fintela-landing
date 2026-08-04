import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import { buildPost, describeSkip } from './src/blog/parsePost'
import type { BlogPost, BlogPostSummary } from './src/blog/types'
import { buildDoc, describeDocSkip, docSectionOrder, DEFAULT_SECTION_ORDER } from './src/docs/parseDoc'
import { duplicateHeadingIds } from './src/docs/toc'
import type { DocDetail, DocSummary } from './src/docs/types'

/**
 * Publishes the Markdown in `content/` as the static JSON the SPA reads off the CDN.
 *
 *   blog/index.json    metadata for every published post, newest first
 *   blog/<slug>.json   metadata + markdown body
 *   docs/index.json    ordered sections + metadata for every published doc page
 *   docs/<slug>.json   metadata + markdown body
 *
 * Why JSON at a URL rather than content bundled into the app: these files are the
 * ONLY thing that has to change to publish. `deploy.yml` regenerates them on every
 * push and syncs just the `blog/` and `docs/` prefixes of the bucket — the hashed
 * bundle and index.html are never touched, so new content carries no site deploy
 * and no cache-busting of the app itself.
 *
 * Drafts and malformed files are never emitted, so unpublished content cannot leak
 * into a public artifact the way it would if bodies were bundled.
 *
 * Both collections go through one plugin because they are one system: the same
 * frontmatter parser (`src/content/frontmatter.ts`), the same fetch layer
 * (`src/content/json.ts`) and the same renderer (`src/blog/MarkdownContent.tsx`).
 * The only per-collection differences are which fields are required and how the
 * index is ordered.
 */

const BLOG_DIR = 'content/blog'
const DOCS_DIR = 'content/docs'

interface Skipped {
  file: string
  reason: string
}

/**
 * Every `.md` under `dir`, recursively, as repo-relative paths.
 *
 * Docs are filed in folders that mirror their sections, which is what makes the
 * tree readable in the repo — but the slug comes from the basename alone, so a
 * page can be refiled without changing its URL. Blog posts are flat; the walk
 * costs nothing there.
 */
async function markdownFiles(root: string, dir: string): Promise<string[]> {
  const absolute = path.resolve(root, dir)

  let entries
  try {
    entries = await readdir(absolute, { withFileTypes: true })
  } catch {
    // No content directory yet → an empty collection, not a build failure.
    return []
  }

  const found: string[] = []
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (entry.name.startsWith('.')) continue
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) found.push(...(await markdownFiles(root, rel)))
    else if (entry.name.toLowerCase().endsWith('.md')) found.push(rel)
  }
  return found
}

/**
 * Parse every file in a collection, dropping the ones that cannot be published and
 * recording why. Slug collisions are a skip rather than a silent overwrite: two
 * files claiming one URL would otherwise make the winner depend on read order.
 */
async function collect<T extends { slug: string }>(
  root: string,
  dir: string,
  describe: (file: string, source: string) => string | null,
  build: (file: string, source: string) => T | null,
  inspect?: (item: T, source: string, warn: (reason: string) => void) => void,
): Promise<{ items: T[]; skipped: Skipped[]; warnings: Skipped[] }> {
  const items: T[] = []
  const skipped: Skipped[] = []
  const warnings: Skipped[] = []
  const claimed = new Map<string, string>()

  for (const file of await markdownFiles(root, dir)) {
    const source = await readFile(path.resolve(root, file), 'utf8')

    const reason = describe(file, source)
    if (reason) {
      skipped.push({ file, reason })
      continue
    }

    const item = build(file, source)!
    const clash = claimed.get(item.slug)
    if (clash) {
      skipped.push({
        file,
        reason: `slug "${item.slug}" already taken by "${clash}" — rename the file or set an explicit \`slug:\``,
      })
      continue
    }
    claimed.set(item.slug, file)
    inspect?.(item, source, (r) => warnings.push({ file, reason: r }))
    items.push(item)
  }

  return { items, skipped, warnings }
}

const toPostSummary = (post: BlogPost): BlogPostSummary => ({
  slug: post.slug,
  title: post.title,
  author: post.author,
  date: post.date,
  excerpt: post.excerpt,
  tags: post.tags,
  readingMinutes: post.readingMinutes,
})

const toDocSummary = (doc: DocDetail): DocSummary => ({
  slug: doc.slug,
  title: doc.title,
  section: doc.section,
  order: doc.order,
  updated: doc.updated,
  excerpt: doc.excerpt,
  readingMinutes: doc.readingMinutes,
  sourcePath: doc.sourcePath,
  keywords: doc.keywords,
  searchText: doc.searchText,
})

/** `{ path -> json }`, keyed the same way in dev and in the build output. */
async function render(root: string, now: string) {
  const files = new Map<string, string>()
  const skipped: Skipped[] = []
  const warnings: Skipped[] = []

  // ---- blog ----------------------------------------------------------------
  const blog = await collect(root, BLOG_DIR, describeSkip, buildPost)
  // Newest first; the card grid renders this order as-is.
  const posts = blog.items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  files.set(
    'blog/index.json',
    JSON.stringify({ generatedAt: now, posts: posts.map(toPostSummary) }, null, 2) + '\n',
  )
  for (const post of posts) {
    files.set(`blog/${post.slug}.json`, JSON.stringify(post, null, 2) + '\n')
  }
  skipped.push(...blog.skipped.map((s) => ({ ...s, file: `blog: ${s.file}` })))

  // ---- docs ----------------------------------------------------------------
  // Section order is read off the files and resolved here so the app receives one
  // ordered `sections` array instead of a rule it would have to reimplement.
  const sectionOrders = new Map<string, number>()
  const docs = await collect(
    root,
    DOCS_DIR,
    describeDocSkip,
    buildDoc,
    (doc, source, warn) => {
      const declared = docSectionOrder(source)
      const known = sectionOrders.get(doc.section)
      if (known === undefined || declared < known) sectionOrders.set(doc.section, declared)

      const duplicates = duplicateHeadingIds(doc.markdown)
      if (duplicates.length) {
        warn(
          `duplicate heading anchor(s) ${duplicates.join(', ')} — the table of ` +
            `contents will link only to the first, so make the headings distinct`,
        )
      }
    },
  )

  const sections = [...new Set(docs.items.map((d) => d.section))].sort((a, b) => {
    const byOrder =
      (sectionOrders.get(a) ?? DEFAULT_SECTION_ORDER) -
      (sectionOrders.get(b) ?? DEFAULT_SECTION_ORDER)
    // Alphabetical is the tiebreak so an un-numbered section is still stable
    // between builds rather than following filesystem order.
    return byOrder !== 0 ? byOrder : a.localeCompare(b)
  })

  const sectionRank = new Map(sections.map((s, i) => [s, i]))
  const pages = docs.items.sort((a, b) => {
    const bySection = (sectionRank.get(a.section) ?? 0) - (sectionRank.get(b.section) ?? 0)
    if (bySection !== 0) return bySection
    return a.order !== b.order ? a.order - b.order : a.title.localeCompare(b.title)
  })

  files.set(
    'docs/index.json',
    JSON.stringify({ generatedAt: now, sections, pages: pages.map(toDocSummary) }, null, 2) +
      '\n',
  )
  for (const doc of pages) {
    files.set(`docs/${doc.slug}.json`, JSON.stringify(doc, null, 2) + '\n')
  }
  skipped.push(...docs.skipped.map((s) => ({ ...s, file: `docs: ${s.file}` })))
  warnings.push(...docs.warnings.map((w) => ({ ...w, file: `docs: ${w.file}` })))

  return { files, posts, pages, sections, skipped, warnings }
}

export function contentJson(): Plugin {
  let root = process.cwd()

  return {
    name: 'fintela:content-json',

    configResolved(config) {
      root = config.root
    },

    /**
     * Emitted as build assets so they land in `dist/blog/` and `dist/docs/`
     * alongside the bundle. `deploy.sh` and `deploy.yml` both read them from there,
     * which keeps the two publish paths byte-identical.
     */
    async generateBundle() {
      const { files, posts, pages, sections, skipped, warnings } = await render(
        root,
        new Date().toISOString(),
      )

      for (const [fileName, source] of files) {
        this.emitFile({ type: 'asset', fileName, source })
      }

      for (const { file, reason } of skipped) {
        // Drafts are routine; anything else is a mistake worth seeing in CI logs.
        const message = `content: skipped "${file}" — ${reason}`
        if (reason.startsWith('published: false')) this.info(message)
        else this.warn(message)
      }
      for (const { file, reason } of warnings) {
        this.warn(`content: "${file}" — ${reason}`)
      }

      this.info(`blog: emitted ${posts.length} published post(s)`)
      this.info(
        `docs: emitted ${pages.length} published page(s) across ${sections.length} section(s)`,
      )
    },

    /**
     * Dev serves the same paths from disk on every request, so editing a file and
     * refreshing is enough — no restart, and no generated files in the working tree.
     */
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        const isContent = url?.startsWith('/blog/') || url?.startsWith('/docs/')
        if (!isContent || !url?.endsWith('.json')) return next()

        const { files } = await render(root, new Date().toISOString())
        const body = files.get(url.slice(1))
        if (body === undefined) {
          // Matches production: an unknown slug is a 404, which the SPA renders as
          // its not-found state.
          res.statusCode = 404
          res.end('{}')
          return
        }

        res.setHeader('content-type', 'application/json')
        res.setHeader('cache-control', 'no-store')
        res.end(body)
      })
    },
  }
}
