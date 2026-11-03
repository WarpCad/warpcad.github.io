# warpcad.github.io — project instructions

This repository is the warpcad.com home page. The app's rules live in the app repository's
`CLAUDE.md` (`~/src/@WarpCad/warpcad/CLAUDE.md`): read it for the Responsive Layout, Browser
Support, theming and licensing rules. This file lists only what is specific here.

- **No client-side JavaScript, with one exception.** The page is static. VitePress's own runtime and
  `public/analytics.js` are the only scripts. The exception is the Google Analytics 4 page-view loader
  (`docs/decisions/home-page.md` in the app repository, owner decision 2026-10-31). It is a file, not an
  inline script, and it does nothing unless the build has `GA_MEASUREMENT_ID`. Add no other script
  without the same kind of decision.
- **The Content-Security-Policy is written by `scripts/postbuild.mjs`**, per page, with hashes of that page's
  inline scripts. `script-src` never gets `'unsafe-inline'`. Google hosts appear only with an ID.
- **Every link into the app uses `#/help/<slug>`**, never a path, so a link never needs a
  server-side rewrite. The docs-list work in `TODO/docs-027` adds these links.
- **Nothing is hand-captured.** Any picture comes from the app's own generated docs (`app-overview.png`).
- **The canonical host is `warpcad.com`.** `public/CNAME` must say so, and `scripts/cname.test.mjs`
  fails the build if it does not. Never set it to `app.warpcad.com`: that is the app's domain.
- **Generator: VitePress 1.6.x**, pinned exactly (`docs/decisions/home-page.md` in the app repository).

<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
