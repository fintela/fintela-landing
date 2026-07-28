import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'
import { buildPost, describeSkip } from './src/blog/parsePost'
import type { BlogPost, BlogPostSummary } from './src/blog/types'

/**
 * Publishes `content/blog/*.md` as the static JSON the SPA reads off the CDN:
 *
 *   blog/index.json    metadata for every published post, newest first
 *   blog/<slug>.json   metadata + markdown body
 *
 * Why JSON at a URL rather than posts bundled into the app: these files are the
 * ONLY thing that has to change to publish a post. `blog-publish.yml` regenerates
 * them on every push that touches `content/blog/**` and syncs just the `blog/`
 * prefix of the bucket — the hashed bundle and index.html are never touched, so a
 * new post carries no site deploy and no cache-busting of the app itself.
 *
 * Drafts and malformed files are never emitted, so unpublished content cannot leak
 * into a public artifact the way it would if post bodies were bundled.
 */

const CONTENT_DIR = 'content/blog'

interface Collected {
  posts: BlogPost[]
  skipped: { file: string; reason: string }[]
}

async function collect(root: string): Promise<Collected> {
  const dir = path.resolve(root, CONTENT_DIR)

  let names: string[]
  try {
    names = (await readdir(dir)).filter((n) => n.toLowerCase().endsWith('.md')).sort()
  } catch {
    // No content directory yet → an empty blog, not a build failure.
    return { posts: [], skipped: [] }
  }

  const posts: BlogPost[] = []
  const skipped: Collected['skipped'] = []
  const claimed = new Map<string, string>()

  for (const file of names) {
    const source = await readFile(path.join(dir, file), 'utf8')

    const reason = describeSkip(file, source)
    if (reason) {
      skipped.push({ file, reason })
      continue
    }

    const post = buildPost(file, source)!
    const clash = claimed.get(post.slug)
    if (clash) {
      skipped.push({
        file,
        reason: `slug "${post.slug}" already taken by "${clash}" — rename the file or set an explicit \`slug:\``,
      })
      continue
    }
    claimed.set(post.slug, file)
    posts.push(post)
  }

  // Newest first; the card grid renders this order as-is.
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return { posts, skipped }
}

const toSummary = (post: BlogPost): BlogPostSummary => ({
  slug: post.slug,
  title: post.title,
  author: post.author,
  date: post.date,
  excerpt: post.excerpt,
  tags: post.tags,
  readingMinutes: post.readingMinutes,
})

/** `{ path -> json }`, keyed the same way in dev and in the build output. */
async function render(root: string, now: string) {
  const { posts, skipped } = await collect(root)

  const files = new Map<string, string>()
  files.set(
    'blog/index.json',
    JSON.stringify({ generatedAt: now, posts: posts.map(toSummary) }, null, 2) + '\n',
  )
  for (const post of posts) {
    files.set(`blog/${post.slug}.json`, JSON.stringify(post, null, 2) + '\n')
  }
  return { files, posts, skipped }
}

export function blogJson(): Plugin {
  let root = process.cwd()

  return {
    name: 'fintela:blog-json',

    configResolved(config) {
      root = config.root
    },

    /**
     * Emitted as build assets so they land in `dist/blog/` alongside the bundle.
     * `deploy.sh` and `blog-publish.yml` both read them from there, which keeps the
     * two publish paths byte-identical.
     */
    async generateBundle() {
      const { files, posts, skipped } = await render(root, new Date().toISOString())

      for (const [fileName, source] of files) {
        this.emitFile({ type: 'asset', fileName, source })
      }

      for (const { file, reason } of skipped) {
        // Drafts are routine; anything else is a mistake worth seeing in CI logs.
        const message = `blog: skipped "${file}" — ${reason}`
        if (reason.startsWith('published: false')) this.info(message)
        else this.warn(message)
      }
      this.info(`blog: emitted ${posts.length} published post(s)`)
    },

    /**
     * Dev serves the same paths from disk on every request, so editing a post and
     * refreshing is enough — no restart, and no generated files in the working tree.
     */
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (!url?.startsWith('/blog/') || !url.endsWith('.json')) return next()

        const { files } = await render(root, new Date().toISOString())
        const body = files.get(url.slice(1))
        if (body === undefined) {
          // Matches production: an unknown post is a 404, which the SPA renders as
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
