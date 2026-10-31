// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { groupPages } from '../scripts/help-groups.mjs'

/**
 * The docs list for `index.md`, built from the cached help index (`scripts/fetch-help.mjs`) and
 * `docs-groups.json`. Runs once per build.
 */
export default {
  load() {
    const site = JSON.parse(readFileSync('site.json', 'utf8'))
    const groups = JSON.parse(readFileSync('docs-groups.json', 'utf8')).groups
    const index = JSON.parse(readFileSync(join('.vitepress', 'cache', 'help-index.json'), 'utf8'))
    return { site, ...groupPages(index, groups, site.appUrl) }
  },
}
