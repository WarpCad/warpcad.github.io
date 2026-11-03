# warpcad.github.io

The home page at **https://warpcad.com**: what WarpCad is, a button into the app, and a list of
the documentation. The docs themselves are read from the app's own Help
(`https://app.warpcad.com/#/help/<slug>`), so this repository holds no docs.

## Build and test

```sh
npm install
npm run build      # VitePress builds dist/
npm run serve      # previews dist/ on http://localhost:4173/
npm run check      # dist/CNAME is warpcad.com; the Open WarpCad link points at the app
npm test           # CNAME guard, then the Playwright e2e at 3 viewports on 3 engines
npm run spdx       # every source and Markdown file carries its licence marker
```

Open `http://localhost:4173/` and press **Open WarpCad**: it opens `https://app.warpcad.com/`.

## Analytics

One page view per visit, in a GA4 property of its own (`docs/decisions/home-page.md`). It is on only when the
repository variable `GA_MEASUREMENT_ID` is set to a `G-…` ID; unset, the build carries no tag and the page makes no
request to Google. Localhost, `npm run dev`, previews and automated browsers never measure. See `/privacy`.

## Deploy

`.github/workflows/pages.yml` builds, checks and deploys `dist/` to GitHub Pages on a push to
`main`, on a daily schedule, and on a manual run. CI runs the Chromium projects only. Nothing is
pushed or deployed by the scaffold itself; the first deploy waits for the owner's DNS step.

## Licence

Code is AGPL-3.0-or-later (`LICENSE`). Prose and page copy are CC BY-SA 4.0 (`LICENSE-DOCS`).
See `LICENSING.md`.

<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
