// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The home page's Content-Security-Policy and its Google Analytics wiring (`docs/decisions/home-page.md`
 * and `docs/decisions/analytics.md` in the app repository). Applied to every built page by
 * `scripts/postbuild.mjs`. Pure functions, so they are unit-testable in plain Node.
 *
 * The policy is per page, because the hashes of a page's inline scripts are per page. It allows no
 * `'unsafe-inline'` for scripts: the only executable code besides VitePress's own is the GA loader,
 * which is a file (`public/analytics.js`), not an inline block.
 *
 * @module scripts/policy
 */
import { createHash } from 'node:crypto'

/** A GA4 web-stream measurement ID: `G-` and 4-20 capitals or digits. Anything else is ignored. */
const ID_PATTERN = /^G-[A-Z0-9]{4,20}$/

/**
 * The Google hosts a GA4 page view needs. The same list as the app's
 * (`scripts/analytics-build.mjs` in the app repository, read from the real `gtag.js` on 2026-10-17).
 * Ads hosts are deliberately absent: the loader turns those signals off.
 */
export const GA_HOSTS = Object.freeze({
  script: Object.freeze(['https://www.googletagmanager.com']),
  connect: Object.freeze(['https://*.google-analytics.com', 'https://*.analytics.google.com']),
  img: Object.freeze(['https://*.google-analytics.com']),
})

/**
 * The measurement ID this build was given, from `GA_MEASUREMENT_ID` (the Actions variable's name).
 *
 * @param {Record<string, string | undefined>} env `process.env`
 * @returns {string} A well-formed GA4 ID, or `''` (unset, blank or malformed: analytics is off).
 */
export function measurementId(env) {
  const raw = env.GA_MEASUREMENT_ID
  const id = typeof raw === 'string' ? raw.trim() : ''
  return ID_PATTERN.test(id) ? id : ''
}

/**
 * The `'sha256-…'` source for each inline `<script>` in a page (one with no `src`), so the browser
 * runs exactly those blocks and no others.
 *
 * @param {string} html
 * @returns {string[]} Unique CSP source expressions, in document order.
 */
export function inlineScriptHashes(html) {
  const sources = []
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\ssrc\s*=/.test(match[1])) continue
    const digest = createHash('sha256').update(match[2], 'utf8').digest('base64')
    sources.push(`'sha256-${digest}'`)
  }
  return [...new Set(sources)]
}

/**
 * The policy string for one page.
 *
 * @param {object} options
 * @param {readonly string[]} options.scriptHashes From {@link inlineScriptHashes}.
 * @param {string} options.measurementId From {@link measurementId}; `''` adds no Google host.
 * @returns {string}
 */
export function buildPolicy({ scriptHashes, measurementId: id }) {
  const ga = id === '' ? { script: [], connect: [], img: [] } : GA_HOSTS
  const directives = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", ...scriptHashes, ...ga.script]],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'", 'data:', ...ga.img]],
    ['font-src', ["'self'", 'data:']],
    ['connect-src', ["'self'", ...ga.connect]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'none'"]],
  ]
  return directives.map(([name, sources]) => `${name} ${sources.join(' ')}`).join('; ')
}

/**
 * Puts the policy into a page's `<head>`, first, so it governs everything after it. With an ID it
 * also adds the measurement-ID tag and the loader (`/analytics.js`, which reads that tag).
 *
 * @param {string} html
 * @param {object} options
 * @param {string} options.policy From {@link buildPolicy}.
 * @param {string} options.measurementId `''` leaves out the analytics tags.
 * @returns {string}
 */
export function applyPolicy(html, { policy, measurementId: id }) {
  if (html.includes('http-equiv="Content-Security-Policy"')) {
    throw new Error('the page already has a Content-Security-Policy; postbuild must run once per build')
  }
  if (!/<head[^>]*>/.test(html)) throw new Error('the page has no <head> to put the policy in')
  const tags = [`<meta http-equiv="Content-Security-Policy" content="${policy}">`]
  if (id !== '') {
    tags.push(`<meta name="ga-measurement-id" content="${id}">`, '<script src="/analytics.js" defer></script>')
  }
  // A replacer function, not a string: a `$` in the policy must not be read as a replacement pattern.
  return html.replace(/<head[^>]*>/, (open) => `${open}${tags.join('')}`)
}
