// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from '@playwright/test'

/**
 * Analytics on the home page (`docs/decisions/home-page.md`). The e2e build is served from localhost,
 * which the loader treats as "not a visitor" and never measures, so these specs prove the inert side:
 * no Google request, no gtag, and the privacy page is reachable from the footer. The loader's rules
 * are unit-tested in `scripts/analytics.test.mjs`.
 */

test('the page makes no request to Google on localhost', async ({ page }) => {
  const google = []
  page.on('request', (req) => {
    if (/googletagmanager|google-analytics|analytics\.google/.test(req.url())) google.push(req.url())
  })
  await page.goto('/')
  await page.waitForLoadState('load')
  expect(google).toEqual([])
  expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined')
})

test('the privacy page is linked from the footer and says what is measured', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('privacy').click()
  await expect(page).toHaveURL(/\/privacy(\.html)?$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy: what this site measures')
  await expect(page.getByText('Do Not Track')).toBeVisible()
})
