import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { contentJson } from './vite-plugin-content'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev-server ports. `setup_worktree.sh` writes WEB_PORT / WEB_PREVIEW_PORT into
  // .env.local so each worktree gets its own; 5173 / 4173 (Vite's defaults) remain
  // for an unconfigured checkout. loadEnv is called with an empty prefix, so
  // non-VITE_ variables are visible here — and only here: `envPrefix` still
  // defaults to VITE_, so neither port ever reaches the browser bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.WEB_PORT || 5173)
  const previewPort = Number(env.WEB_PREVIEW_PORT || 4173)

  return {
    // `contentJson` turns content/blog/*.md and content/docs/**.md into the
    // blog/*.json and docs/*.json the SPA fetches, in both dev (served from disk per
    // request) and build (emitted into dist/blog/ and dist/docs/). See
    // vite-plugin-content.ts, BLOG.md and DOCS.md.
    plugins: [react(), contentJson()],
    resolve: {
      // The legal documents are counsel's, and the SPA (app.fintela.io) serves the
      // very same files. Import them from `content/legal/` rather than keeping a
      // copy, so the two public hosts cannot drift.
      alias: {
        '@legal': path.resolve(__dirname, 'content/legal'),
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
