import type { Plugin, Transformer } from 'unified'
import type { Root } from 'mdast'
import { toc } from 'mdast-util-toc'

interface remarkTableOfContentsOptionsType {
    mdx?: boolean
}

const remarkTableOfContents: Plugin = function plugin(
    options: remarkTableOfContentsOptionsType = {
        mdx: true
    },
): Transformer {

    return async (ast) => {

        const mdast = ast as Root

        const result = toc(mdast)
        const list = result.map

        if (list === null) {
            return
        }

        const index = mdast.children.findIndex(
            (node) => node.type === 'paragraph' && node.children[0].type === 'text' && node.children[0].value === '%toc%'
        )

        if (index === -1) {
            return
        }

        mdast.children = Array.prototype.concat(
            mdast.children.slice(0, index),
            {
                type: options.mdx ? 'jsx' : 'html',
                value: '<aside>',
            },
            result.map,
            {
                type: options.mdx ? 'jsx' : 'html',
                value: '</aside>',
            },
            mdast.children.slice(index + 1)
        )

    }

}

export { remarkTableOfContents }