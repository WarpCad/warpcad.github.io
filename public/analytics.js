// SPDX-License-Identifier: AGPL-3.0-or-later
/*
 * Google Analytics 4, page views only (docs/decisions/home-page.md and docs/decisions/analytics.md in
 * the app repository). A file, not an inline script, so the page's CSP needs no 'unsafe-inline'.
 *
 * It runs only on a build that named a measurement ID: `scripts/postbuild.mjs` writes the
 * `ga-measurement-id` tag and this script's own tag, and without the ID neither is written. It also
 * stays off on a non-https page, on localhost, in an automated browser, and for a visitor who sends
 * Do Not Track or Global Privacy Control. The hit carries origin and path only, never the hash or query.
 */
(function () {
  var doc = document
  var win = window

  var meta = doc.querySelector('meta[name="ga-measurement-id"]')
  var id = meta ? (meta.getAttribute('content') || '').trim() : ''
  if (!/^G-[A-Z0-9]{4,20}$/.test(id)) return

  var loc = win.location
  var host = loc.hostname
  var local = host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || /\.localhost$/.test(host)
  if (loc.protocol !== 'https:' || local) return

  var nav = win.navigator || {}
  if (nav.webdriver === true || nav.doNotTrack === '1' || nav.globalPrivacyControl === true) return

  var page = { page_location: loc.origin + loc.pathname, page_path: loc.pathname }

  function start() {
    try {
      win.dataLayer = win.dataLayer || []
      win.gtag = function gtag() {
        // gtag.js reads Arguments objects off the data layer; an array would be ignored.
        win.dataLayer.push(arguments)
      }
      win.gtag('js', new Date())
      win.gtag('config', id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: page.page_location,
        page_path: page.page_path,
      })
      win.gtag('event', 'page_view', page)
      var script = doc.createElement('script')
      script.async = true
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id)
      doc.head.appendChild(script)
    } catch (error) {
      // Analytics must never be the reason the page misbehaves.
    }
  }

  // After load, so the tag never competes with first paint.
  if (doc.readyState === 'complete') start()
  else win.addEventListener('load', start, { once: true })
})()
