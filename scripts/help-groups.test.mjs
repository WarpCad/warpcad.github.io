// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { groupPages } from './help-groups.mjs'

const APP = 'https://app.warpcad.com/'
const INDEX = {
  pages: [
    { slug: 'getting-started', title: 'Getting started' },
    { slug: 'booleans', title: 'Combining shapes' },
    { slug: 'brand-new', title: 'A page nobody has grouped yet' },
  ],
}

describe('groupPages (docs-027)', () => {
  it('lists each grouped page under its group, linked into the app by slug', () => {
    const { groups } = groupPages(INDEX, [{ title: 'Start here', slugs: ['getting-started'] }], APP)
    assert.equal(groups[0].title, 'Start here')
    assert.deepEqual(groups[0].items[0], { slug: 'getting-started', title: 'Getting started', href: `${APP}#/help/getting-started` })
  })

  it('puts a page no group lists under More, so a new docs page still appears', () => {
    const { groups } = groupPages(INDEX, [{ title: 'Start here', slugs: ['getting-started'] }], APP)
    const more = groups.at(-1)
    assert.equal(more.title, 'More')
    assert.deepEqual(more.items.map((i) => i.slug), ['booleans', 'brand-new'])
  })

  it('fails when a grouped slug is not in the index, and names it', () => {
    assert.throws(
      () => groupPages(INDEX, [{ title: 'Gone', slugs: ['removed-page'] }], APP),
      /grouped slug "removed-page" is not in the help index/,
    )
  })

  it('omits a group whose pages are all missing, and adds no More group when every page is grouped', () => {
    const all = [{ title: 'All', slugs: ['getting-started', 'booleans', 'brand-new'] }]
    const { groups } = groupPages(INDEX, all, APP)
    assert.deepEqual(groups.map((g) => g.title), ['All'])
  })
})
