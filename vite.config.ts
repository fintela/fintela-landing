import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { blogJson } from './vite-plugin-blog'

// https://vite.dev/config/
export default defineConfig({
  // `blogJson` turns content/blog/*.md into the blog/*.json the SPA fetches, in both
  // dev (served from disk per request) and build (emitted into dist/blog/). See
  // vite-plugin-blog.ts and BLOG.md.
  plugins: [react(), blogJson()],
  resolve: {
    // The legal documents are counsel's, and the SPA (app.fintela.io) serves the
    // very same files. Import them from `docs/legal/` rather than keeping a copy,
    // so the two public hosts cannot drift. `scripts/check-legal-final.mjs` gates
    // what may be published.
    //
    // `@docs-content` follows the exact same pattern: the documentation prose,
    // code snippets and tables shared with the Fintela app live once under
    // `src/docs-content/` (plain data, no React), so the two forked doc trees
    // cannot drift apart the way the auth/quickstart blocks did.
    alias: {
      '@legal': path.resolve(__dirname, 'content/legal'),
      '@docs-content': path.resolve(__dirname, 'src/docs-content'),
    },
  },
})
