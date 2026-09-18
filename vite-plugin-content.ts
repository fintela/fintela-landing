import { access, readdir, readFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { Plugin } from 'vite'
import { buildPost, describeSkip, isValidCover } from './src/blog/parsePost'
import type { BlogPost, BlogPostSummary } from './src/blog/types'
import { extractImages } from './src/content/frontmatter'
import { buildDoc, describeDocSkip, docSectionOrder, DEFAULT_SECTION_ORDER } from './src/docs/parseDoc'
import type { ParsedDoc } from './src/docs/parseDoc'
import { duplicateHeadingIds } from './src/docs/toc'
import type { DocDetail, DocSearchEntry, DocSummary, ImageSize } from './src/docs/types'

/**
 * Publishes the Markdown in `content/` as the static JSON the SPA reads off the CDN,
 * plus the image files that travel with it.
 *
 *   blog/index.json            metadata for every published post, newest first
 *   blog/<slug>.json           metadata + markdown body + `images` (intrinsic sizes)
 *   blog/covers/<file>         every cover a post names in frontmatter or its body
 *   blog/covers/og/<slug>.jpg  a 1200×630 social crop of each post's cover
 *   docs/index.json            ordered sections + metadata for every published page
 *                              (no body text — small enough to embed in every page)
 *   docs/search.json           the ⌘K palette's index: slug, title, section,
 *                              keywords and capped plain-text body per page
 *   docs/<slug>.json           metadata + markdown body + `images`
 *
 * Why JSON at a URL rather than content bundled into the app: the hashed bundle
 * never has to change to publish, and the same files feed both the browser and
 * `scripts/prerender.mjs`, which renders every post and doc page into static HTML
 * from them (with the JSON embedded, so the browser hydrates without a fetch).
 * Content ships through the one deploy path — `deploy.yml` builds the whole site
 * and `scripts/sync-site.sh` uploads it — so an edit to a page changes its HTML,
 * its JSON, the sitemaps and the feed together.
 *
 * Drafts and malformed files are never emitted, so unpublished content cannot leak
 * into a public artifact the way it would if bodies were bundled.
 *
 * Both collections go through one plugin because they are one system: the same
 * frontmatter parser (`src/content/frontmatter.ts`), the same fetch layer
 * (`src/content/json.ts`) and the same renderer (`src/blog/MarkdownContent.tsx`).
 * The only per-collection differences are which fields are required and how the
 * index is ordered.
 *
 * Images: the size of every local image a body references (and of the cover) is
 * read with sharp and published beside the text, so the renderer can set
 * `width`/`height` and the page does not shift when they load. JSON is written
 * minified; `generatedAt` is kept for diagnostics but is not a change signal —
 * lastmod comes from the content's own dates (see scripts/prerender.mjs).
 */

const BLOG_DIR = 'content/blog'
const DOCS_DIR = 'content/docs'
const PUBLIC_DIR = 'public'

/** The social crop every post with a local cover gets (Open Graph's 1.91:1). */
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const OG_JPEG_QUALITY = 82
const ogCropPath = (slug: string) => `covers/og/${slug}.jpg`

/** Produce the crop: cover-fit so nothing letterboxes, centred on the image. */
const ogCrop = (file: string): Promise<Buffer> =>
  sharp(file)
    .rotate() // honour EXIF orientation before cropping
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .flatten({ background: '#edf0f5' }) // PNG alpha onto the site's ground colour
    .jpeg({ quality: OG_JPEG_QUALITY, mozjpeg: true })
    .toBuffer()

/**
 * Width and height as the browser will lay the image out — i.e. after the EXIF
 * orientation is applied — or `null` when sharp cannot read the file (an SVG's
 * size is a viewBox, not pixels, and is left to the browser).
 */
async function imageSize(file: string): Promise<ImageSize | null> {
  try {
    const { width, height, orientation } = await sharp(file).metadata()
    if (!width || !height) return null
    const rotated = (orientation ?? 1) >= 5
    return rotated ? { width: height, height: width } : { width, height }
  } catch {
    return null
  }
}

/**
 * Where an image `src` written in a body lives on disk, or `null` when it is not
 * ours to measure: an `http(s)` or `data:` URL. A root-relative path is served
 * from `public/`; a relative one from the collection's own content folder,
 * where the renderer resolves it (`covers/x.jpg` on `/blog/<slug>` →
 * `/blog/covers/x.jpg`). The same safety rule as covers applies to the relative
 * form: nothing that climbs out of the folder, nothing that is not an image.
 */
function localImage(
  root: string,
  contentDir: string,
  src: string,
): { file: string; published: string | null } | null {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src)) return null
  if (src.startsWith('/')) {
    const rel = src.slice(1).split(/[?#]/)[0]
    if (!isValidCover(rel)) return null
    return { file: path.resolve(root, PUBLIC_DIR, rel), published: null }
  }
  const rel = src.replace(/^\.\//, '').split(/[?#]/)[0]
  if (!isValidCover(rel)) return null
  return { file: path.resolve(root, contentDir, rel), published: `${path.basename(contentDir)}/${rel}` }
}

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
  ...(post.updated ? { updated: post.updated } : {}),
  excerpt: post.excerpt,
  tags: post.tags,
  readingMinutes: post.readingMinutes,
  ...(post.sourcePath ? { sourcePath: post.sourcePath } : {}),
  ...(post.cover ? { cover: post.cover } : {}),
  ...(post.coverAlt ? { coverAlt: post.coverAlt } : {}),
  ...(post.coverWidth && post.coverHeight
    ? { coverWidth: post.coverWidth, coverHeight: post.coverHeight }
    : {}),
  ...(post.ogImage ? { ogImage: post.ogImage } : {}),
  ...(post.featured ? { featured: true } : {}),
})

/**
 * Image files a collection publishes beside its JSON — every cover a post names
 * in frontmatter or in its body, and any local image a doc body references —
 * keyed by the path they are published at. Read from `content/<collection>/`
 * and emitted into `dist/<collection>/`, so a page and its images ship together.
 */
const IMAGE_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false,
  )

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
})

/** The page JSON: everything but the search text, which has its own file. */
const toDocDetail = (parsed: ParsedDoc): DocDetail => {
  const doc: DocDetail & { searchText?: string } = { ...parsed }
  delete doc.searchText
  return doc
}

const toSearchEntry = (doc: ParsedDoc): DocSearchEntry => ({
  slug: doc.slug,
  title: doc.title,
  section: doc.section,
  keywords: doc.keywords,
  searchText: doc.searchText,
})

/** Minified: these files are fetched by browsers, not read by people. */
const json = (value: unknown) => JSON.stringify(value) + '\n'

/**
 * Measure the local images a body references, queue the ones under the
 * collection's folder for publishing, and warn about the ones that are not
 * there. Returns the size map the renderer reads, or `undefined` when nothing
 * could be measured (so the JSON carries no empty object).
 */
async function collectBodyImages(
  root: string,
  contentDir: string,
  markdown: string,
  assets: Map<string, string>,
  warn: (reason: string) => void,
): Promise<Record<string, ImageSize> | undefined> {
  const sizes: Record<string, ImageSize> = {}
  for (const { src } of extractImages(markdown)) {
    if (src in sizes) continue
    const local = localImage(root, contentDir, src)
    if (!local) continue
    if (!(await exists(local.file))) {
      warn(`image "${src}" not found under ${local.published ? contentDir : PUBLIC_DIR}/`)
      continue
    }
    if (local.published) assets.set(local.published, local.file)
    const size = await imageSize(local.file)
    if (size) sizes[src] = size
  }
  return Object.keys(sizes).length ? sizes : undefined
}

/** `{ path -> json }`, keyed the same way in dev and in the build output. */
async function render(root: string, now: string) {
  const files = new Map<string, string>()
  const skipped: Skipped[] = []
  const warnings: Skipped[] = []
  // Image files to publish verbatim: published path -> absolute source file.
  const assets = new Map<string, string>()
  // Social crops to derive: published path -> absolute cover file.
  const ogCrops = new Map<string, string>()

  // ---- blog ----------------------------------------------------------------
  const blog = await collect(root, BLOG_DIR, describeSkip, buildPost, (post, _source, warn) => {
    // A cover auto-derived from the post's own body (see parsePost.ts) is
    // already a resolvable URL — an http(s) link, an absolute /public path, or
    // a data: URI — not a filename under content/blog/, so there is nothing to
    // copy and no frontmatter field to point the coverAlt warning at.
    if (!post.cover || !isValidCover(post.cover)) return
    if (!post.coverAlt) warn(`cover "${post.cover}" has no coverAlt — add one for the card image`)
  })
  for (const post of blog.items) {
    const warn = (reason: string) => blog.warnings.push({ file: post.sourcePath ?? post.slug, reason })

    // The cover: published, measured, and cropped for social cards. A cover
    // that is not on disk is dropped from the post rather than published as a
    // broken URL — the card falls back to text and og:image to the blog's default.
    if (post.cover && isValidCover(post.cover)) {
      const file = path.resolve(root, BLOG_DIR, post.cover)
      if (await exists(file)) {
        assets.set(`blog/${post.cover}`, file)
        const size = await imageSize(file)
        if (size) {
          post.coverWidth = size.width
          post.coverHeight = size.height
          if (size.width < OG_WIDTH || size.height < OG_HEIGHT) {
            warn(
              `cover "${post.cover}" is ${size.width}×${size.height}; the ${OG_WIDTH}×${OG_HEIGHT} ` +
                'social crop will be upscaled — export it at least that large',
            )
          }
        }
        if (path.extname(file).toLowerCase() !== '.svg') {
          post.ogImage = ogCropPath(post.slug)
          ogCrops.set(`blog/${post.ogImage}`, file)
        }
      } else {
        warn(`cover "${post.cover}" not found under ${BLOG_DIR}/ — the post is published without it`)
        delete post.cover
        delete post.coverAlt
      }
    }

    // Body images: every `covers/<file>` a post shows inline ships too, not
    // only the one named in frontmatter.
    const images = await collectBodyImages(root, BLOG_DIR, post.markdown, assets, warn)
    if (images) post.images = images
  }
  // Newest first; the card grid renders this order as-is.
  const posts = blog.items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  files.set('blog/index.json', json({ generatedAt: now, posts: posts.map(toPostSummary) }))
  for (const post of posts) {
    files.set(`blog/${post.slug}.json`, json(post))
  }
  skipped.push(...blog.skipped.map((s) => ({ ...s, file: `blog: ${s.file}` })))
  warnings.push(...blog.warnings.map((w) => ({ ...w, file: `blog: ${w.file}` })))

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
  for (const doc of pages) {
    const images = await collectBodyImages(root, DOCS_DIR, doc.markdown, assets, (reason) =>
      docs.warnings.push({ file: doc.sourcePath, reason }),
    )
    if (images) doc.images = images
  }

  // The index carries no body text: it is embedded in every prerendered page
  // for the sidebar, and the palette fetches search.json the first time it opens.
  files.set('docs/index.json', json({ generatedAt: now, sections, pages: pages.map(toDocSummary) }))
  files.set('docs/search.json', json(pages.map(toSearchEntry)))
  for (const doc of pages) {
    files.set(`docs/${doc.slug}.json`, json(toDocDetail(doc)))
  }
  skipped.push(...docs.skipped.map((s) => ({ ...s, file: `docs: ${s.file}` })))
  warnings.push(...docs.warnings.map((w) => ({ ...w, file: `docs: ${w.file}` })))

  return { files, assets, ogCrops, posts, pages, sections, skipped, warnings }
}

export function contentJson(): Plugin {
  let root = process.cwd()
  let ssr = false

  return {
    name: 'fintela:content-json',

    configResolved(config) {
      root = config.root
      ssr = !!config.build.ssr
    },

    /**
     * Emitted as build assets so they land in `dist/blog/` and `dist/docs/`
     * alongside the bundle, where `scripts/prerender.mjs` reads the JSON back to
     * render each page and `scripts/sync-site.sh` uploads everything.
     */
    async generateBundle() {
      // The prerender's SSR bundle (`.prerender/`, see scripts/prerender.mjs) is
      // built with this same config but reads the content from `dist/`; emitting
      // it again there would only redo the image work into a folder nobody reads.
      if (ssr) return

      const { files, assets, ogCrops, posts, pages, sections, skipped, warnings } = await render(
        root,
        new Date().toISOString(),
      )

      for (const [fileName, source] of files) {
        this.emitFile({ type: 'asset', fileName, source })
      }
      for (const [fileName, file] of assets) {
        this.emitFile({ type: 'asset', fileName, source: await readFile(file) })
      }
      for (const [fileName, file] of ogCrops) {
        this.emitFile({ type: 'asset', fileName, source: await ogCrop(file) })
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

      this.info(
        `blog: emitted ${posts.length} published post(s), ${ogCrops.size} social crop(s)`,
      )
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
        if (!isContent) return next()

        // Images: streamed from content/ exactly as the build emits them; the
        // social crops are derived on demand, the same way the build derives them.
        const type = url ? IMAGE_TYPES[path.extname(url).toLowerCase()] : undefined
        if (url && type) {
          const { assets, ogCrops } = await render(root, new Date().toISOString())
          const key = url.slice(1)
          const cover = ogCrops.get(key)
          if (cover) {
            res.setHeader('content-type', 'image/jpeg')
            res.setHeader('cache-control', 'no-store')
            res.end(await ogCrop(cover))
            return
          }
          const file = assets.get(key)
          if (!file) {
            res.statusCode = 404
            res.end()
            return
          }
          res.setHeader('content-type', type)
          res.setHeader('cache-control', 'no-store')
          createReadStream(file).pipe(res)
          return
        }

        if (!url?.endsWith('.json')) return next()

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
