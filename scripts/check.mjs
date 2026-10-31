// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * `npm run check`: the built page's guards, run after `npm run build` in CI and locally.
 * Fails if the CNAME is missing or wrong, or if the Open WarpCad link does not point at the app.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const failures = []
const cname = join('dist', 'CNAME')
if (!existsSync(cname)) failures.push('dist/CNAME is missing')
else if (readFileSync(cname, 'utf8').trim() !== 'warpcad.com') failures.push('dist/CNAME is not warpcad.com')

const index = join('dist', 'index.html')
if (!existsSync(index)) failures.push('dist/index.html is missing')
else {
  const html = readFileSync(index, 'utf8')
  if (!html.includes('href="https://app.warpcad.com/"')) failures.push('the Open WarpCad link does not point at https://app.warpcad.com/')
  if (!html.includes('data-testid="open-app"')) failures.push('the Open WarpCad link is missing its data-testid')
}

if (failures.length > 0) {
  console.error(`check failed:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log('check passed: CNAME is warpcad.com, the Open WarpCad link points at the app')
