import type { Plugin, Transformer } from 'unified'
import type { Root, Content } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import { toc, Options } from 'mdast-util-toc'
import { isElement, Element } from 'hast-util-is-element'

export interface IRemarkTableOfContentsOptions extends Options {
    mdx?: boolean
    containerTagName?: string
    hasContainer?: boolean
}

const isValidElement = (tagName: string) => {
    const element: Element = {
        type: 'element',
        tagName: tagName,
        children: []
    }

    // check if hast thinks the element is valid
    return isElement(element)
}

const remarkTableOfContents: Plugin = function plugin(options: IRemarkTableOfContentsOptions = {}): Transformer {

    return async (ast) => {

        const mdast = ast as Root

        let { mdx, containerTagName, hasContainer, ...tocOptions } = options

        // default values
        mdx = mdx !== undefined ? mdx : true
        containerTagName = containerTagName !== undefined ? containerTagName : 'aside'
        hasContainer = hasContainer !== undefined ? hasContainer : true
        tocOptions = tocOptions !== undefined ? tocOptions : {}

        const result = toc(mdast, tocOptions)

        const list = result.map

        if (list === null) {
            return
        }

        // find the placeholder
        const index = mdast.children.findIndex(
            (node) => node.type === 'paragraph' && node.children[0].type === 'text' && node.children[0].value === '%toc%'
        )

        if (index === -1) {
            return
        }

        if (!isValidElement(containerTagName)) {
            return
        }

        const children: Content[] = []

        children.push(...mdast.children.slice(0, index))

        if (mdx) {
            if (hasContainer) {
                const containerAndToc: MdxJsxFlowElement = {
                    type: 'mdxJsxFlowElement',
                    name: containerTagName,
                    children: [list],
                    attributes: []
                }
                children.push(containerAndToc)
            } else {
                children.push(list)
            }
        } else {
            if (hasContainer) {
                children.push({
                    type: 'html',
                    value: '<' + options.containerTagName + '>',
                })
            }
            children.push(list)
            if (hasContainer) {
                children.push({
                    type: 'html',
                    value: '</' + options.containerTagName + '>',
                })
            }
        }

        children.push(...mdast.children.slice(index + 1))

        mdast.children = Array.prototype.concat(children)

    }

}

export { remarkTableOfContents }