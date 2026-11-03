---
layout: page
title: WarpCad
---

<script setup>
import { data } from './.vitepress/help.data.mjs'
</script>

<div class="home">

<section class="hero">
  <h1>WarpCad</h1>
  <p class="tagline">Parametric CAD in your browser: drag-to-place solids, booleans, sketches, and an AI partner.</p>
  <p class="actions">
    <a data-testid="open-app" class="button primary" :href="data.site.appUrl">Open WarpCad</a>
    <a data-testid="read-docs" class="button" href="#docs">Read the docs</a>
  </p>
  <img class="shot" src="/help/app-overview.png" alt="The WarpCad window with no model yet: the Library on the left, the 3D view with its grid, navigation pad and orientation triad, and the Operations toolbar.">
</section>

<section class="does">
  <h2>What it does</h2>
  <ul class="features">
    <li><strong>Place shapes.</strong> Drag a cube, cylinder or sphere from the Library into the 3D view. <a data-testid="feature-placement" href="https://app.warpcad.com/#/help/primitive-placement">Placing a shape</a></li>
    <li><strong>Combine them.</strong> Union, subtract and intersect solids into one part. <a data-testid="feature-booleans" href="https://app.warpcad.com/#/help/booleans">Combining shapes</a></li>
    <li><strong>Real parts.</strong> Hardware such as bolts and nuts, kit parts and Raspberry Pi boards, placed like any shape. <a data-testid="feature-hardware" href="https://app.warpcad.com/#/help/hardware-library">Hardware and kit parts</a></li>
    <li><strong>Work on a phone.</strong> The same tools on a phone or tablet, with a finger. <a data-testid="feature-mobile" href="https://app.warpcad.com/#/help/mobile">Using WarpCad on a phone or tablet</a></li>
    <li><strong>An AI partner.</strong> Talk to the Assistant about your model, with your own key, or drive WarpCad from Claude Code over MCP. <a data-testid="feature-ai" href="https://app.warpcad.com/#/help/ai-partner">The Assistant</a> · <a data-testid="feature-mcp" href="https://app.warpcad.com/#/help/mcp">MCP</a></li>
    <li><strong>Export for printing.</strong> STL, OBJ and glTF, and split a part that is bigger than your printer. <a data-testid="feature-export" href="https://app.warpcad.com/#/help/export">Exporting</a> · <a data-testid="feature-print" href="https://app.warpcad.com/#/help/print-prep">Print preparation</a></li>
  </ul>
</section>

<section class="docs">
  <h2 id="docs" tabindex="-1">Documentation</h2>
  <p>Every page of the in-app Help. Each link opens WarpCad with that page in the Help sheet.</p>
  <div v-for="group in data.groups" :key="group.title" class="group">
    <h3>{{ group.title }}</h3>
    <ul>
      <li v-for="item in group.items" :key="item.slug">
        <a :data-testid="'doc-' + item.slug" :href="item.href" :class="{ emphasis: item.slug === 'getting-started' }">{{ item.title }}</a>
      </li>
    </ul>
  </div>
</section>

<section class="free">
  <h2>Free and open source</h2>
  <p>WarpCad's source is at <a data-testid="source" :href="data.site.repoUrl" target="_blank" rel="noopener">github.com/WarpCad/warpcad</a>. Code is AGPL-3.0-or-later; the documentation is CC BY-SA 4.0. See the <a href="https://github.com/WarpCad/warpcad/blob/main/LICENSING.md" target="_blank" rel="noopener">licensing notes</a>.</p>
</section>

<section class="support">
  <h2>Support</h2>
  <p>Report a problem or ask a question on <a data-testid="support" :href="data.site.issuesUrl" target="_blank" rel="noopener">GitHub Issues</a>.</p>
</section>

</div>

<footer class="site-footer">
  <a data-testid="privacy" href="/privacy">Privacy</a>
  · <a :href="data.site.repoUrl" target="_blank" rel="noopener">Source</a>
  · © WarpCad contributors. Code AGPL-3.0-or-later; documentation CC BY-SA 4.0.
  <span v-if="data.site.appStoreUrl"> · <a :href="data.site.appStoreUrl" target="_blank" rel="noopener">Download on the App Store</a></span>
</footer>

<style>
.home { max-width: 52rem; margin: 0 auto; padding: 2rem 1rem; }
.home section { margin: 0 0 2.5rem; }
.home h1 { font-size: 2.25rem; font-weight: 700; line-height: 1.2; margin: 0 0 0.5rem; }
.home h2 { font-size: 1.5rem; margin: 0 0 0.75rem; }
.home h3 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; }
.home p { line-height: 1.5; margin: 0 0 1rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.button {
  display: inline-block; min-height: 44px; line-height: 44px; padding: 0 1.25rem;
  border-radius: 8px; border: 1px solid var(--vp-c-divider); color: var(--vp-c-text-1);
  font-weight: 600; text-decoration: none;
}
.button.primary { background: var(--vp-c-brand-1); border-color: transparent; color: var(--vp-c-white); }
.shot { width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--vp-c-divider); }
.features li { margin: 0 0 0.6rem; line-height: 1.5; }
.docs ul { display: grid; grid-template-columns: 1fr; gap: 0 1rem; list-style: none; padding: 0; margin: 0; }
.docs li { display: block; }
.docs a { display: flex; align-items: center; min-height: 44px; }
.docs a.emphasis { font-weight: 700; }
@media (min-width: 640px) { .docs ul { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1024px) { .docs ul { grid-template-columns: 1fr 1fr 1fr; } }
.site-footer { max-width: 52rem; margin: 0 auto; padding: 1.5rem 1rem 2.5rem; border-top: 1px solid var(--vp-c-divider); font-size: 0.9rem; }
</style>

<!-- SPDX-License-Identifier: CC-BY-SA-4.0 -->
