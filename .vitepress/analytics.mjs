// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Google Analytics 4 page views for warpcad.com (`docs/decisions/home-page.md`, `TODO/docs-027`).
 *
 * A port of the app's loader (`src/analytics/analytics.js` in `WarpCad/warpcad`, `TODO/build-007`),
 * kept the same on purpose so both sites follow one set of privacy rules. This repository cannot
 * import the app's code, so the rules are copied, and `scripts/analytics.test.mjs` pins them.
 *
 * Page views only, one per load. The measurement ID comes from the build (`__GA_MEASUREMENT_ID__`,
 * set in `.vitepress/config.mjs`); with none, nothing here runs and the page makes no request. It is
 * also inert in a development build, on localhost or any non-https page, in an automated browser,
 * and when the visitor sends Do Not Track or Global Privacy Control.
 *
 * What is sent is the origin and path only. The URL hash, the query and the document are never
 * given to `gtag`.
 *
 * @module .vitepress/analytics
 */

/** Where Google serves `gtag.js`. */
export const GTAG_SRC = 'https://www.googletagmanager.com/gtag/js'

const ID_PATTERN = /^G-[A-Z0-9]{4,20}$/

/**
 * @param {string} hostname
 * @returns {boolean} Whether the host is this machine, not a visitor.
 */
function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost')
}

/**
 * Starts page-view measurement. Sends one `page_view` and nothing else.
 *
 * @param {object} options
 * @param {string} [options.id] A GA4 measurement ID, `''` for none.
 * @param {boolean} [options.prod] Whether this is a production build.
 * @param {any} [options.win] `window`; injected in tests.
 * @param {any} [options.doc] `document`; injected in tests.
 * @returns {boolean} Whether measurement was started (or scheduled for the load event).
 */
export function initAnalytics({ id = '', prod = false, win = globalThis.window, doc = globalThis.document } = {}) {
  const measurementId = typeof id === 'string' ? id.trim() : ''
  if (!ID_PATTERN.test(measurementId) || !prod || !win || !doc) return false
  const { protocol, hostname, origin, pathname } = win.location
  if (protocol !== 'https:' || isLocalHost(hostname)) return false
  const nav = win.navigator ?? {}
  if (nav.webdriver === true || nav.doNotTrack === '1' || nav.globalPrivacyControl === true) return false

  // Origin and path only. Taken once, here, so a later hash change cannot leak into the hit.
  const page = { page_location: `${origin}${pathname}`, page_path: pathname }

  const start = () => {
    try {
      win.dataLayer = win.dataLayer || []
      // gtag.js reads `Arguments` objects off the data layer; an array would be ignored.
      win.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        win.dataLayer.push(arguments)
      }
      win.gtag('js', new Date())
      win.gtag('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        ...page,
      })
      win.gtag('event', 'page_view', page)
      const script = doc.createElement('script')
      script.async = true
      script.src = `${GTAG_SRC}?id=${encodeURIComponent(measurementId)}`
      doc.head.append(script)
    } catch {
      // Analytics must never be the reason the page fails to render.
    }
  }
  // After load, so the tag never competes with first paint.
  if (doc.readyState === 'complete') start()
  else win.addEventListener('load', start, { once: true })
  return true
}
