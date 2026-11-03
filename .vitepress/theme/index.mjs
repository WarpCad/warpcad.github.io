// SPDX-License-Identifier: AGPL-3.0-or-later
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'

import { initAnalytics } from '../analytics.mjs'

/**
 * The default VitePress theme, plus one page-view measurement after the page mounts in the browser
 * (`docs/decisions/home-page.md`). Nothing else on the page is client-side JavaScript.
 */
export default {
  extends: DefaultTheme,
  setup() {
    onMounted(() => {
      initAnalytics({ id: __GA_MEASUREMENT_ID__, prod: import.meta.env.PROD })
    })
  },
}
