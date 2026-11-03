// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { initAnalytics, GTAG_SRC } from '../.vitepress/analytics.mjs'
import { measurementId } from './analytics-config.mjs'

/** A fake browser: `location`, `navigator`, a head that records appended scripts, and a window. */
function browser({ href = 'https://warpcad.com/privacy#/help/x?q=1', nav = {}, readyState = 'complete' } = {}) {
  const url = new URL(href)
  const scripts = []
  const listeners = {}
  const win = {
    location: { protocol: url.protocol, hostname: url.hostname, origin: url.origin, pathname: url.pathname },
    navigator: { ...nav },
    addEventListener(type, fn) { listeners[type] = fn },
  }
  const doc = {
    readyState,
    head: { append: (el) => scripts.push(el) },
    createElement: () => ({}),
  }
  return { win, doc, scripts, fire: () => listeners.load?.() }
}

/** The queued gtag calls as plain arrays (`Arguments` objects are not deep-equal to arrays). */
const calls = (win) => (win.dataLayer ?? []).map((args) => Array.from(args))
const GOOD = 'G-TEST000000'

describe('measurementId (build time)', () => {
  it('accepts a well-formed G- id, trimmed', () => {
    assert.equal(measurementId({ GA_MEASUREMENT_ID: ` ${GOOD} ` }), GOOD)
    assert.equal(measurementId({ VITE_GA_MEASUREMENT_ID: GOOD }), GOOD)
  })
  it('ignores unset, blank, legacy UA- and malformed values', () => {
    assert.equal(measurementId({}), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: '   ' }), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: 'UA-12345-1' }), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: 'G-abc' }), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: 'G-TEST000000; alert(1)' }), '')
  })
})

describe('initAnalytics (run time)', () => {
  it('is inert without an id: no script, no dataLayer, no gtag', () => {
    const b = browser()
    assert.equal(initAnalytics({ id: '', prod: true, win: b.win, doc: b.doc }), false)
    assert.equal(b.scripts.length, 0)
    assert.equal(b.win.dataLayer, undefined)
    assert.equal(b.win.gtag, undefined)
  })
  it('is inert in a development build', () => {
    const b = browser()
    assert.equal(initAnalytics({ id: GOOD, prod: false, win: b.win, doc: b.doc }), false)
    assert.equal(b.scripts.length, 0)
  })
  it('is inert on localhost and on plain http', () => {
    for (const href of ['http://warpcad.com/', 'https://localhost:4173/', 'https://app.localhost/', 'https://127.0.0.1/']) {
      const b = browser({ href })
      assert.equal(initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc }), false, href)
      assert.equal(b.scripts.length, 0, href)
    }
  })
  it('is inert for an automated browser and for Do Not Track or GPC', () => {
    for (const nav of [{ webdriver: true }, { doNotTrack: '1' }, { globalPrivacyControl: true }]) {
      const b = browser({ nav })
      assert.equal(initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc }), false, JSON.stringify(nav))
      assert.equal(b.scripts.length, 0)
    }
  })
  it('in production on warpcad.com adds exactly one gtag.js script for the id', () => {
    const b = browser()
    assert.equal(initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc }), true)
    assert.equal(b.scripts.length, 1)
    assert.equal(b.scripts[0].src, `${GTAG_SRC}?id=${GOOD}`)
    assert.equal(b.scripts[0].async, true)
  })
  it('sends one page_view with origin and path only, never the hash or query', () => {
    const b = browser()
    initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc })
    const sent = calls(b.win)
    const config = sent.find((c) => c[0] === 'config')
    const views = sent.filter((c) => c[0] === 'event' && c[1] === 'page_view')
    assert.equal(views.length, 1)
    assert.deepEqual(views[0][2], { page_location: 'https://warpcad.com/privacy', page_path: '/privacy' })
    assert.equal(config[1], GOOD)
    assert.equal(config[2].send_page_view, false)
    assert.equal(config[2].allow_google_signals, false)
    assert.equal(config[2].allow_ad_personalization_signals, false)
    assert.equal(JSON.stringify(sent).includes('#'), false)
    assert.equal(JSON.stringify(sent).includes('?q='), false)
  })
  it('waits for the load event when the document is still loading', () => {
    const b = browser({ readyState: 'loading' })
    initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc })
    assert.equal(b.scripts.length, 0)
    b.fire()
    assert.equal(b.scripts.length, 1)
  })
  it('queues gtag calls as Arguments objects, the form gtag.js requires', () => {
    const b = browser()
    initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc })
    assert.equal(Object.prototype.toString.call(b.win.dataLayer[0]), '[object Arguments]')
  })
  it('never throws, even if the page breaks analytics', () => {
    const b = browser()
    b.doc.head.append = () => { throw new Error('boom') }
    assert.doesNotThrow(() => initAnalytics({ id: GOOD, prod: true, win: b.win, doc: b.doc }))
  })
})
