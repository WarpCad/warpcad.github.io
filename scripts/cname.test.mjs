// SPDX-License-Identifier: AGPL-3.0-or-later
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOMAIN = 'warpcad.com'

describe('custom domain CNAME', () => {
  it('public/CNAME holds the canonical host, with at most one trailing newline', () => {
    assert.equal(readFileSync(join(ROOT, 'public', 'CNAME'), 'utf8').replace(/\n$/, ''), DOMAIN)
  })
  it('the built dist/CNAME matches, when dist/ exists', () => {
    if (!existsSync(join(ROOT, 'dist'))) return
    const built = join(ROOT, 'dist', 'CNAME')
    assert.ok(existsSync(built), 'dist/CNAME is missing')
    assert.equal(readFileSync(built, 'utf8'), readFileSync(join(ROOT, 'public', 'CNAME'), 'utf8'))
  })
  it('the app domain is never the site CNAME, which would take it over on deploy', () => {
    assert.ok(!readFileSync(join(ROOT, 'public', 'CNAME'), 'utf8').includes('app.warpcad.com'))
  })
})
