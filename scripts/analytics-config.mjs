// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The build-time GA4 measurement ID for warpcad.com (`docs/decisions/home-page.md`). Kept out of
 * `.vitepress/config.mjs` so it is unit-testable in plain Node. The ID is public (it is in every
 * visitor's page), but it still comes only from build configuration, never from source.
 *
 * @module scripts/analytics-config
 */

/** A GA4 web-stream measurement ID: `G-` and 4-20 capitals or digits. Anything else is ignored. */
const ID_PATTERN = /^G-[A-Z0-9]{4,20}$/

/**
 * The measurement ID this build was given: `GA_MEASUREMENT_ID` (the Actions variable's name), else
 * `VITE_GA_MEASUREMENT_ID`.
 *
 * @param {Record<string, string | undefined>} env `process.env`
 * @returns {string} A well-formed GA4 ID, or `''` (unset, blank or malformed: analytics is off).
 */
export function measurementId(env) {
  const raw = env.GA_MEASUREMENT_ID || env.VITE_GA_MEASUREMENT_ID || ''
  const id = typeof raw === 'string' ? raw.trim() : ''
  return ID_PATTERN.test(id) ? id : ''
}
