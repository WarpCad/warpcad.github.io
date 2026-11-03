// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * `npm run postbuild` (runs after `vitepress build`): writes the Content-Security-Policy into every
 * built page in `dist/`, and the Google Analytics tags when `GA_MEASUREMENT_ID` names a valid ID.
 * See `scripts/policy.mjs` for what goes in and why.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { applyPolicy, buildPolicy, inlineScriptHashes, measurementId } from './policy.mjs'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

/**
 * @param {string} dir
 * @returns {string[]} Every `.html` file under the directory, recursively.
 */
function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return htmlFiles(path)
    return name.endsWith('.html') ? [path] : []
  })
}

const id = measurementId(process.env)
const files = htmlFiles(DIST)
if (files.length === 0) {
  console.error(`postbuild: no .html pages in ${DIST}; run the build first`)
  process.exit(1)
}

for (const file of files) {
  const html = readFileSync(file, 'utf8')
  const policy = buildPolicy({ scriptHashes: inlineScriptHashes(html), measurementId: id })
  writeFileSync(file, applyPolicy(html, { policy, measurementId: id }))
}
console.log(`postbuild: policy on ${files.length} page(s)${id === '' ? ', analytics off (no GA_MEASUREMENT_ID)' : `, analytics on (${id})`}`)
