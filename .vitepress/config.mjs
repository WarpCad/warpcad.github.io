// SPDX-License-Identifier: AGPL-3.0-or-later
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

import { measurementId } from '../scripts/analytics-config.mjs'

/**
 * The warpcad.com home page (`TODO/build-021`). VitePress is the generator
 * (`docs/decisions/home-page.md`). The app's docs are read from the app's own `help/` contract
 * (`TODO/docs-027`), not from this repository.
 *
 * The GA4 measurement ID (`GA_MEASUREMENT_ID`, a repository variable) is baked in only when it is
 * well formed; with none, `__GA_MEASUREMENT_ID__` is `''` and the loader does nothing (`.vitepress/analytics.mjs`).
 */
export default defineConfig({
  title: 'WarpCad',
  description: 'Parametric CAD in your browser: drag-to-place solids, booleans, sketches, and an AI partner.',
  outDir: fileURLToPath(new URL('../dist', import.meta.url)),
  srcExclude: ['README.md', 'CLAUDE.md', 'LICENSING.md', 'LICENSE', 'LICENSE-DOCS', 'scripts/**', 'e2e/**'],
  vite: {
    define: {
      __GA_MEASUREMENT_ID__: JSON.stringify(measurementId(process.env)),
    },
  },
  head: [
    ['meta', { name: 'color-scheme', content: 'dark light' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'canonical', href: 'https://warpcad.com/' }],
    // An explicit background on html, so a transparent root never paints the browser default (`TODO/build-021`).
    ['style', {}, 'html { background-color: var(--vp-c-bg); }'],
  ],
})
