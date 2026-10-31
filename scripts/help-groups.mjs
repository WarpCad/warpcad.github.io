// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The home page's docs list (`TODO/docs-027`): the app's published help index, grouped by
 * `docs-groups.json`. A grouped slug the index lacks fails the build. An index page no group lists
 * goes under **More**, so a new docs page appears on the next daily rebuild, even before anyone
 * files it into a group.
 *
 * @param {{ pages: { slug: string, title: string }[] }} index the app's `help/index.json`
 * @param {{ title: string, slugs: string[] }[]} groups the groups, in display order
 * @param {string} appUrl the app's origin with a trailing slash, from `site.json`
 * @returns {{ groups: { title: string, items: { slug: string, title: string, href: string }[] }[] }}
 */
export function groupPages(index, groups, appUrl) {
  const titles = new Map(index.pages.map((p) => [p.slug, p.title]))
  const grouped = new Set()
  for (const group of groups) {
    for (const slug of group.slugs) {
      if (!titles.has(slug)) throw new Error(`grouped slug "${slug}" is not in the help index`)
      grouped.add(slug)
    }
  }
  const item = (slug) => ({ slug, title: titles.get(slug), href: `${appUrl}#/help/${slug}` })
  const out = groups
    .map((group) => ({ title: group.title, items: group.slugs.map(item) }))
    .filter((group) => group.items.length > 0)
  const more = index.pages.map((p) => p.slug).filter((slug) => !grouped.has(slug))
  if (more.length > 0) out.push({ title: 'More', items: more.map(item) })
  return { groups: out }
}
