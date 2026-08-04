import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { contentJson } from './vite-plugin-content'

// https://vite.dev/config/
export default defineConfig({
  // `contentJson` turns content/blog/*.md and content/docs/**.md into the
  // blog/*.json and docs/*.json the SPA fetches, in both dev (served from disk per
  // request) and build (emitted into dist/blog/ and dist/docs/). See
  // vite-plugin-content.ts, BLOG.md and DOCS.md.
  plugins: [react(), contentJson()],
  resolve: {
    // The legal documents are counsel's, and the SPA (app.fintela.io) serves the
    // very same files. Import them from `docs/legal/` rather than keeping a copy,
    // so the two public hosts cannot drift. `scripts/check-legal-final.mjs` gates
    // what may be published.
    alias: {
      '@legal': path.resolve(__dirname, 'content/legal'),
    },
  },
})
