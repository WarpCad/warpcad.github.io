// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

/** The reference viewports (`CLAUDE.md`'s Responsive Layout, in the app repository). */
const VIEWPORTS = [
  { name: 'phone', viewport: { width: 390, height: 844 }, hasTouch: true },
  { name: 'tablet', viewport: { width: 820, height: 1180 }, hasTouch: true },
  { name: 'laptop', viewport: { width: 1440, height: 900 }, hasTouch: false },
]

/** The three engines (Chromium, Firefox, WebKit as iPhone Safari's stand-in). */
const ENGINES = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
]

export default defineConfig({
  testDir: 'e2e',
  testMatch: /.*\.e2e\.js$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: ENGINES.flatMap((engine) =>
    VIEWPORTS.map((v) => ({
      name: `${engine.name}-${v.name}`,
      use: { ...engine.device, viewport: v.viewport, hasTouch: v.hasTouch },
    })),
  ),
  webServer: {
    command: `npm run build && npm run serve`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
