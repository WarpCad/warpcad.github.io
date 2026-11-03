// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The GA loader (`public/analytics.js`) run in a stubbed browser: its gates and its one page view.
 * The real script is read and evaluated, so the test exercises the shipped file, not a copy.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'

const SOURCE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'analytics.js'), 'utf8')
const ID = 'G-JQS0CFWW6C'

/**
 * Runs the loader against a fake page.
 *
 * @param {object} [over] Overrides: `url`, `navigator`, `id` (`null` removes the tag), `readyState`, `createElement`.
 */
function run(over = {}) {
  const url = new URL(over.url ?? 'https://warpcad.com/help/getting-started#/help/x?q=1')
  const listeners = []
  const appended = []
  const meta = over.id === null ? null : { getAttribute: () => (over.id ?? ID) }
  const win = {
    location: { protocol: url.protocol, hostname: url.hostname, origin: url.origin, pathname: url.pathname },
    navigator: over.navigator ?? {},
    addEventListener: (type, fn) => listeners.push([type, fn]),
  }
  const doc = {
    readyState: over.readyState ?? 'complete',
    querySelector: (sel) => (sel === 'meta[name="ga-measurement-id"]' ? meta : null),
    createElement: over.createElement ?? (() => ({})),
    head: { appendChild: (el) => appended.push(el) },
  }
  vm.runInNewContext(SOURCE, { window: win, document: doc, Date })
  return { win, doc, listeners, appended }
}

describe('analytics loader gates', () => {
  it('does nothing without a measurement ID', () => {
    const { win } = run({ id: null })
    assert.equal(win.gtag, undefined)
  })
  it('does nothing with a malformed ID', () => {
    assert.equal(run({ id: 'UA-1-1' }).win.gtag, undefined)
  })
  it('does nothing on plain http', () => {
    assert.equal(run({ url: 'http://warpcad.com/' }).win.gtag, undefined)
  })
  it('does nothing on localhost, 127.0.0.1 and *.localhost', () => {
    for (const url of ['https://localhost:4173/', 'https://127.0.0.1/', 'https://pages.localhost/']) {
      assert.equal(run({ url }).win.gtag, undefined, url)
    }
  })
  it('does nothing for an automated browser', () => {
    assert.equal(run({ navigator: { webdriver: true } }).win.gtag, undefined)
  })
  it('does nothing for Do Not Track', () => {
    assert.equal(run({ navigator: { doNotTrack: '1' } }).win.gtag, undefined)
  })
  it('does nothing for Global Privacy Control', () => {
    assert.equal(run({ navigator: { globalPrivacyControl: true } }).win.gtag, undefined)
  })
})

describe('analytics loader page view', () => {
  it('configures GA4 with no automatic or ad signals, and sends one page view', () => {
    const { win, appended } = run()
    // Normalised through JSON: the loader's objects come from the vm context's own realm.
    const calls = JSON.parse(JSON.stringify(win.dataLayer.map((args) => Array.from(args))))
    assert.equal(calls[0][0], 'js')
    assert.deepEqual(calls[1], [
      'config',
      ID,
      {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: 'https://warpcad.com/help/getting-started',
        page_path: '/help/getting-started',
      },
    ])
    assert.deepEqual(calls[2], ['event', 'page_view', {
      page_location: 'https://warpcad.com/help/getting-started',
      page_path: '/help/getting-started',
    }])
    assert.equal(appended.length, 1)
    assert.equal(appended[0].src, `https://www.googletagmanager.com/gtag/js?id=${ID}`)
    assert.equal(appended[0].async, true)
  })
  it('never sends the hash or the query', () => {
    const { win } = run({ url: 'https://warpcad.com/a?secret=1#/gist/abc' })
    const text = JSON.stringify(win.dataLayer.map((args) => Array.from(args)))
    assert.ok(!text.includes('secret'))
    assert.ok(!text.includes('gist'))
  })
  it('waits for the load event when the page is still loading', () => {
    const { win, listeners, appended } = run({ readyState: 'loading' })
    assert.equal(win.gtag, undefined)
    assert.equal(listeners[0][0], 'load')
    listeners[0][1]()
    assert.equal(appended.length, 1)
  })
  it('never throws into the page when the tag cannot be created', () => {
    assert.doesNotThrow(() => run({ createElement: () => { throw new Error('boom') } }))
  })
})
