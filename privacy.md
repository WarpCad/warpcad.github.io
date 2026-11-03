---
layout: page
title: Privacy
---

# Privacy: what this site measures

This site is the WarpCad home page. It has no accounts, no forms and no cookies of its own. It
counts visits with Google Analytics, in a property of its own that is separate from the app's, so
each site's reports show only its own visitors.

The app itself keeps your projects in your own browser. Its privacy page is at
[app.warpcad.com, Help → Privacy](https://app.warpcad.com/#/help/privacy).

## What is counted

| What is sent | What is never sent |
|---|---|
| One **page view** each time this page loads: the address and path (for example `https://warpcad.com/`), your browser and operating system, screen size and language, and a rough location Google derives from your IP address | The part of the address after `#`, the query, anything you click or type, or anything stored in your browser |

- **Cookies.** Google Analytics sets cookies (named `_ga` and `_ga_` followed by the property) to tell
  one visitor from another. There is no consent banner. If that is a problem where you live, use one
  of the ways to opt out below.
- **IP address.** Google Analytics 4 does not log or store IP addresses; it uses the address to work
  out a rough location and then discards it.
- **Google signals and ad personalisation are switched off** in the tag.
- **Nothing is sent from a local copy.** `npm run dev`, a local preview, `localhost`, a page served
  over plain `http`, and automated test browsers all skip it.

## Opting out

Any one of these stops the page view being sent:

1. Turn on **Do Not Track** or **Global Privacy Control** in your browser. This page checks both and
   sends nothing.
2. Install Google's [Google Analytics Opt-out Browser Add-on](https://tools.google.com/dlpage/gaoptout),
   or any content blocker that blocks `googletagmanager.com`.
3. Use a private window and clear site data when you close it.

<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
