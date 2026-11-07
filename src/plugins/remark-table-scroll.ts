import type { Parent, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * Wraps every markdown table in a horizontally scrollable region.
 *
 * Wide tables would otherwise push the whole article past the viewport on
 * phones. The wrapper is focusable and labelled so keyboard users can scroll
 * it too (WCAG 2.1.1).
 */
export const remarkTableScroll: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'table', (node, index, parent: Parent | undefined) => {
    if (!parent || index === undefined) return
    const wrapper = {
      type: 'tableScroll',
      data: {
        hName: 'div',
        hProperties: {
          className: ['table-scroll'],
          role: 'region',
          ariaLabel: 'Scrollable table',
          tabIndex: 0,
        },
      },
      children: [node],
    }
    parent.children.splice(index, 1, wrapper as unknown as typeof node)
    // Skip the wrapper's children so the same table isn't wrapped twice
    return index + 1
  })
}
