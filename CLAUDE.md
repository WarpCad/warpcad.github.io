# warpcad.github.io — project instructions

This repository is the warpcad.com home page. The app's rules live in the app repository's
`CLAUDE.md` (`~/src/@WarpCad/warpcad/CLAUDE.md`): read it for the Responsive Layout, Browser
Support, theming and licensing rules. This file lists only what is specific here.

- **No client-side JavaScript.** The page is static. VitePress's own runtime is the only script.
- **Every link into the app uses `#/help/<slug>`**, never a path, so a link never needs a
  server-side rewrite. The docs-list work in `TODO/docs-027` adds these links.
- **Nothing is hand-captured.** Any picture comes from the app's own generated docs (`app-overview.png`).
- **The canonical host is `warpcad.com`.** `public/CNAME` must say so, and `scripts/cname.test.mjs`
  fails the build if it does not. Never set it to `app.warpcad.com`: that is the app's domain.
- **Generator: VitePress 1.6.x**, pinned exactly (`docs/decisions/home-page.md` in the app repository).

<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
