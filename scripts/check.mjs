// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * `npm run check`: the built page's guards (`TODO/docs-027`). Run after `npm run build`.
 *
 * - `dist/CNAME` is `warpcad.com`, and the Open WarpCad link points at the app.
 * - Every `#/help/<slug>` on the page is a slug in the app's help index.
 * - Every `<img>` has non-empty alt text.
 * - Every `https://` link returns 2xx or 3xx on HEAD (a GET if the server refuses HEAD).
 *   `--offline` skips this part, for the offline e2e build.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const offline = process.argv.includes('--offline')
const failures = []

const cname = join('dist', 'CNAME')
if (!existsSync(cname)) failures.push('dist/CNAME is missing')
else if (readFileSync(cname, 'utf8').trim() !== 'warpcad.com') failures.push('dist/CNAME is not warpcad.com')

const indexFile = join('dist', 'index.html')
if (!existsSync(indexFile)) failures.push('dist/index.html is missing')
else {
  const html = readFileSync(indexFile, 'utf8')
  const site = JSON.parse(readFileSync('site.json', 'utf8'))
  if (!html.includes(`href="${site.appUrl}"`)) failures.push(`the Open WarpCad link does not point at ${site.appUrl}`)
  if (!html.includes('data-testid="open-app"')) failures.push('the Open WarpCad link is missing its data-testid')

  const known = new Set(JSON.parse(readFileSync(join('.vitepress', 'cache', 'help-index.json'), 'utf8')).pages.map((p) => p.slug))
  for (const [, slug] of html.matchAll(/#\/help\/([\w-]+)/g)) {
    if (!known.has(slug)) failures.push(`#/help/${slug} is not a page in the help index`)
  }
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    const alt = /\salt="([^"]*)"/.exec(tag)?.[1] ?? ''
    if (alt.trim() === '') failures.push(`an image has no alt text: ${tag.slice(0, 80)}`)
  }

  if (!offline) {
    const urls = [...new Set([...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map((m) => m[1]))]
    for (const url of urls) {
      const status = await linkStatus(url)
      if (status < 200 || status >= 400) failures.push(`${url} returned ${status}`)
    }
  }
}

/** @param {string} url */
async function linkStatus(url) {
  const head = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15_000) })
  if (head.status !== 405) return head.status
  return (await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(15_000) })).status
}

if (failures.length > 0) {
  console.error(`check failed:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log(`check passed${offline ? ' (offline)' : ''}: CNAME, the app link, help slugs, alt text${offline ? '' : ' and external links'}`)
