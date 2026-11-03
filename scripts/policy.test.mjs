// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { applyPolicy, buildPolicy, GA_HOSTS, inlineScriptHashes, measurementId } from './policy.mjs'

const sha = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`

describe('measurementId', () => {
  it('takes a well-formed G- ID from GA_MEASUREMENT_ID, trimmed', () => {
    assert.equal(measurementId({ GA_MEASUREMENT_ID: ' G-JQS0CFWW6C\n' }), 'G-JQS0CFWW6C')
  })
  it('is empty when unset, blank, or malformed (a UA- ID is ignored)', () => {
    assert.equal(measurementId({}), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: '   ' }), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: 'UA-12345-1' }), '')
    assert.equal(measurementId({ GA_MEASUREMENT_ID: 'G-x' }), '')
  })
})

describe('inlineScriptHashes', () => {
  it('hashes each inline script exactly, and skips scripts with a src', () => {
    const html = '<head><script src="/a.js"></script><script id="x">console.log(1)</script></head>'
    assert.deepEqual(inlineScriptHashes(html), [sha('console.log(1)')])
  })
  it('lists a repeated script once', () => {
    const html = '<script>x()</script><script>x()</script>'
    assert.equal(inlineScriptHashes(html).length, 1)
  })
  it('returns nothing for a page with no inline script', () => {
    assert.deepEqual(inlineScriptHashes('<script type="module" src="/app.js"></script>'), [])
  })
})

describe('buildPolicy', () => {
  const hashes = [sha('x')]
  it('never allows unsafe-inline for scripts', () => {
    for (const id of ['', 'G-JQS0CFWW6C']) {
      const scriptSrc = buildPolicy({ scriptHashes: hashes, measurementId: id }).split('; ').find((d) => d.startsWith('script-src'))
      assert.ok(!scriptSrc.includes("'unsafe-inline'"))
    }
  })
  it('adds no Google host without an ID', () => {
    const policy = buildPolicy({ scriptHashes: hashes, measurementId: '' })
    assert.ok(!policy.includes('google'))
    assert.ok(!policy.includes('analytics'))
  })
  it('adds exactly the app\'s GA hosts with an ID, and no ad hosts', () => {
    const policy = buildPolicy({ scriptHashes: hashes, measurementId: 'G-JQS0CFWW6C' })
    const directive = (name) => policy.split('; ').find((d) => d.startsWith(`${name} `))
    assert.equal(directive('script-src'), `script-src 'self' ${sha('x')} ${GA_HOSTS.script.join(' ')}`)
    assert.equal(directive('connect-src'), `connect-src 'self' ${GA_HOSTS.connect.join(' ')}`)
    assert.equal(directive('img-src'), `img-src 'self' data: ${GA_HOSTS.img.join(' ')}`)
    assert.ok(!policy.includes('doubleclick'))
    assert.ok(!policy.includes('https://www.google.com'))
    assert.ok(!policy.includes('googlesyndication'))
  })
  it('keeps the page locked down: no objects, no foreign base or form targets', () => {
    const policy = buildPolicy({ scriptHashes: [], measurementId: '' })
    assert.ok(policy.includes("object-src 'none'"))
    assert.ok(policy.includes("base-uri 'self'"))
    assert.ok(policy.includes("form-action 'none'"))
  })
})

describe('applyPolicy', () => {
  const page = '<!DOCTYPE html><html><head><title>t</title></head><body>b</body></html>'
  it('puts the policy first in the head and adds no analytics without an ID', () => {
    const out = applyPolicy(page, { policy: "default-src 'self'", measurementId: '' })
    assert.ok(out.includes('<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\'"><title>'))
    assert.ok(!out.includes('ga-measurement-id'))
    assert.ok(!out.includes('analytics.js'))
  })
  it('adds the ID tag and the loader with an ID', () => {
    const out = applyPolicy(page, { policy: 'p', measurementId: 'G-JQS0CFWW6C' })
    assert.ok(out.includes('<meta name="ga-measurement-id" content="G-JQS0CFWW6C">'))
    assert.ok(out.includes('<script src="/analytics.js" defer></script>'))
  })
  it('keeps a $ in the policy literal', () => {
    const out = applyPolicy(page, { policy: "script-src 'self' $&", measurementId: '' })
    assert.ok(out.includes("content=\"script-src 'self' $&\""))
  })
  it('refuses a page that already has a policy, so a second run cannot double it', () => {
    const once = applyPolicy(page, { policy: 'p', measurementId: '' })
    assert.throws(() => applyPolicy(once, { policy: 'p', measurementId: '' }), /already has a Content-Security-Policy/)
  })
  it('refuses a page with no head', () => {
    assert.throws(() => applyPolicy('<body>x</body>', { policy: 'p', measurementId: '' }), /no <head>/)
  })
})
