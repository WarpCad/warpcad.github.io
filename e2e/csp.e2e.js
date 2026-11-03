// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from '@playwright/test'

/**
 * The built home page under its Content-Security-Policy: the policy is present, forbids inline
 * scripts without a hash, and the page's own scripts (VitePress's and the dark-mode check) run
 * without a violation. The build in `playwright.config.js` has no `GA_MEASUREMENT_ID`, so no
 * Google host is allowed and none is contacted.
 */

test('the page carries a Content-Security-Policy that allows no unsafe inline script', async ({ page }) => {
  await page.goto('/')
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
  expect(policy).toContain("script-src 'self' 'sha256-")
  expect(policy.split('; ').find((d) => d.startsWith('script-src'))).not.toContain("'unsafe-inline'")
  expect(policy).not.toContain('google')
})

test('loading the page raises no Content-Security-Policy violation', async ({ page }) => {
  const violations = []
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to (execute|load|connect|apply)/i.test(msg.text())) violations.push(msg.text())
  })
  page.on('pageerror', (error) => violations.push(error.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(violations).toEqual([])
})

test('the page makes no request to Google when no measurement ID was given', async ({ page }) => {
  const googleRequests = []
  page.on('request', (req) => {
    if (/google(tagmanager|-analytics)|analytics\.google/.test(req.url())) googleRequests.push(req.url())
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(googleRequests).toEqual([])
})
