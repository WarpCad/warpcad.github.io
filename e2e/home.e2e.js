// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFileSync } from 'node:fs'

import { test, expect } from '@playwright/test'

/**
 * The home page, driven against `/` of the built `dist/` (`TODO/build-021`). Runs at all three
 * viewports on all three engines (the nine projects in `playwright.config.js`).
 */

/** Relative luminance of an `rgb(...)` or `rgba(...)` string, 0 (black) to 1 (white). */
function luminance(css) {
  const [r, g, b] = css.match(/\d+(\.\d+)?/g).slice(0, 3).map((c) => {
    const v = Number(c) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

test('the Open WarpCad link points at the app', async ({ page }) => {
  await page.goto('/')
  const open = page.getByTestId('open-app')
  await expect(open).toHaveText('Open WarpCad')
  await expect(open).toHaveAttribute('href', 'https://app.warpcad.com/')
})

test('the Open WarpCad link is at least 44 px tall (a touch target)', async ({ page }) => {
  await page.goto('/')
  const box = await page.getByTestId('open-app').boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)
})

test('no horizontal scroll at this viewport', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the page is picture-stable at this viewport', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('home.png', { maxDiffPixelRatio: 0.02 })
})

test.describe('dark colour scheme', () => {
  test.use({ colorScheme: 'dark' })
  test('the background is dark', async ({ page }) => {
    await page.goto('/')
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
    expect(luminance(bg)).toBeLessThan(0.1)
  })
})

test.describe('light colour scheme', () => {
  test.use({ colorScheme: 'light' })
  test('the background is light', async ({ page }) => {
    await page.goto('/')
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
    expect(luminance(bg)).toBeGreaterThan(0.8)
  })
})

test.describe('the hero picture follows the theme', () => {
  for (const scheme of ['dark', 'light']) {
    test.describe(`${scheme} colour scheme`, () => {
      test.use({ colorScheme: scheme })
      test(`shows only the ${scheme} twin`, async ({ page }) => {
        await page.goto('/')
        await expect(page.locator(`img.shot-${scheme}`)).toBeVisible()
        await expect(page.locator(`img.shot-${scheme === 'dark' ? 'light' : 'dark'}`)).toBeHidden()
      })
    })
  }

  test('swaps when the VitePress `dark` class on <html> is toggled', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await expect(page.locator('img.shot-dark')).toBeVisible()
    await expect(page.locator('img.shot-light')).toBeHidden()
    await page.evaluate(() => document.documentElement.classList.remove('dark'))
    await expect(page.locator('img.shot-light')).toBeVisible()
  })
})

/** The fixture index: the same shape the app publishes (`e2e/fixtures/index.json`). */
const INDEX = JSON.parse(readFileSync('e2e/fixtures/index.json', 'utf8'))

test('every page of the help index is linked once, with its title, into the app', async ({ page }) => {
  await page.goto('/')
  for (const entry of INDEX.pages) {
    const links = page.getByTestId(`doc-${entry.slug}`)
    await expect(links).toHaveCount(1)
    await expect(links).toHaveText(entry.title)
    await expect(links).toHaveAttribute('href', `https://app.warpcad.com/#/help/${entry.slug}`)
  }
})

// Focus is not moved here: the page has no client-side script (CLAUDE.md), and VitePress's router
// scrolls to an in-page anchor without moving focus. The scroll and the address are the contract.
test('Read the docs scrolls to Documentation and sets the #docs address', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('read-docs').click()
  await expect(page.locator('#docs')).toBeInViewport()
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe('#docs')
})

test('the docs links are at least 44 px tall (a touch target)', async ({ page }) => {
  await page.goto('/')
  for (const entry of INDEX.pages.slice(0, 5)) {
    const box = await page.getByTestId(`doc-${entry.slug}`).boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
})
