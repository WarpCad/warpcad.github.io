// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * `prebuild` (`TODO/docs-027`): fetch the app's help index and the hero screenshot into a
 * git-ignored cache before VitePress builds. A fetch has a bounded timeout and one retry; if it
 * still fails, the build fails and the previous deploy stays up. With `WARPCAD_HELP_FIXTURE` set
 * (the offline e2e), the same files are read from that folder instead.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const site = JSON.parse(readFileSync('site.json', 'utf8'))
const CACHE = join('.vitepress', 'cache')
const PUBLIC_HELP = join('public', 'help')
const fixture = process.env.WARPCAD_HELP_FIXTURE

/** @param {string} url */
async function fetchOnce(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

/** @param {string} url */
async function fetchWithRetry(url) {
  try {
    return await fetchOnce(url)
  } catch {
    return fetchOnce(url)
  }
}

mkdirSync(CACHE, { recursive: true })
mkdirSync(PUBLIC_HELP, { recursive: true })

if (fixture) {
  copyFileSync(join(fixture, 'index.json'), join(CACHE, 'help-index.json'))
  copyFileSync(join(fixture, 'app-overview.png'), join(PUBLIC_HELP, 'app-overview.png'))
  console.log(`help: read the fixture from ${fixture}`)
} else {
  const index = await fetchWithRetry(site.helpIndexUrl)
  JSON.parse(index.toString('utf8'))
  writeFileSync(join(CACHE, 'help-index.json'), index)
  writeFileSync(join(PUBLIC_HELP, 'app-overview.png'), await fetchWithRetry(site.screenshotUrl))
  console.log('help: fetched the index and the screenshot from the app')
}
