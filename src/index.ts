import type { Plugin, Transformer } from 'unified'
import type { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { isElement, Element } from 'hast-util-is-element'
import { htmlEscape } from 'escape-goat'
import { visit } from 'unist-util-visit'
import { visitParents } from 'unist-util-visit-parents'
import Slugger from 'github-slugger'
import type { Root, Content, List, ListItem, Paragraph, Link, PhrasingContent, StaticPhrasingContent } from 'mdast'
import { toString } from 'mdast-util-to-string'
import extend from 'extend'

export type IHtmlAttributes = Record<string, string | number | boolean | readonly string[]>

export interface IMdxTocOptions {
    minDepth: number
    maxDepth: number
    isListOrdered: boolean
}

interface IHeadingResult {
    depth: number
    children: PhrasingContent[]
    id: string
}

type Result = {
    map: List | null
}

interface IListWithParentList extends List {
    parent: IListWithParentList | null
}

export interface IRemarkTableOfContentsOptions {
    mdx?: boolean
    containerTagName?: string
    hasContainer?: boolean
    containerAttributes?: IHtmlAttributes
    hasNav?: boolean
    navAttributes?: IHtmlAttributes
    placeholder?: string
    minDepth?: number
    maxDepth?: number
    isListOrdered?: boolean
}

interface IRemarkTableOfContentsInternalOptions {
    mdx: boolean
    containerTagName: string
    hasContainer: boolean
    containerAttributes: IHtmlAttributes
    hasNav: boolean
    navAttributes: IHtmlAttributes
    placeholder: string
    minDepth: number
    maxDepth: number
    isListOrdered: boolean
}

interface ISanitizeAttributes {
    name: string
    value: string
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

const sanitizeAttributes = (attributes: IHtmlAttributes): ISanitizeAttributes[] => {

    const sanitizedAttributes: ISanitizeAttributes[] = []

    for (const [name, value] of Object.entries(attributes)) {

        const sanitizedName = htmlEscape(name)

        if (value === false || value === undefined || value === null) {
            continue
        }

        let sanitizedValue = ''

        if (Array.isArray(value)) {
            sanitizedValue = value.join(' ')
        } else if (value === true) {
            sanitizedValue = String(value)
        } else if (typeof value === 'string') {
            sanitizedValue = htmlEscape(value)
        }

        sanitizedAttributes.push({ name: sanitizedName, value: sanitizedValue })

    }

    return sanitizedAttributes
}

const stringifyAttributes = (attributes: ISanitizeAttributes[]): string => {

    let attributesString = ''

    attributes.forEach((attribute) => {
        attributesString += ` ${attribute.name}="${attribute.value}"`
    })

    return attributesString

}

const findHeadings = (tree: Root, options: IMdxTocOptions): IHeadingResult[] => {

    const headings: IHeadingResult[] = []
    const slugger = new Slugger()

    visit(tree, 'heading', node => {

        if (node.depth >= options.minDepth && node.depth <= options.maxDepth) {

            const nodeAsString = toString(node)
            const headingId = slugger.slug(nodeAsString)

            headings.push({
                depth: node.depth,
                children: node.children,
                id: headingId
            })
        }
    })

    return headings
}

const mdxToc = (tree: Root, options: IMdxTocOptions): Result => {

    const headings = findHeadings(tree, options)

    let baseList: IListWithParentList | null = null

    if (headings.length > 0) {

        const lowestDepth = Math.min(...headings.map(heading => heading.depth))

        if (lowestDepth !== 1) {
            // change the depth of each heading, make the lowest 1...
            headings.forEach((heading) => {
                const depthToSubstract = lowestDepth - 1
                heading.depth = heading.depth - depthToSubstract
            })
        }

        baseList = createList(null, options)

        let currentList = baseList
        let currentDepth = 1

        headings.forEach((heading) => {

            if (heading.depth > currentDepth) {

                // create a list inside of a list items until we reach the
                // required depth
                while (heading.depth > currentDepth) {

                    let currentItem: ListItem

                    // if there is no current list item
                    if (currentList.children.length === 0) {
                        // create a new empty list item
                        currentItem = createItem(null)
                        // add new list item to current list
                        currentList.children.push(currentItem)
                    } else {
                        // get the last list item from the current list
                        currentItem = currentList.children[currentList.children.length - 1]
                    }

                    // create a new list
                    currentList = createList(currentList, options)
                    // add list to current list item
                    currentItem.children.push(currentList)
                    // increase the current depth by 1
                    currentDepth++

                }

            } else if (heading.depth < currentDepth && currentList.parent !== null) {

                // go back to a parent list until we reach the 
                // required depth
                while (heading.depth < currentDepth) {

                    if (currentList.parent !== null) {
                        // make the parent of the current list the new currentList
                        currentList = currentList.parent
                        // decrease the current depth by one
                        currentDepth--
                    }

                }

            }

            // create a list item
            const listItem = createItem(heading)

            // add list item to list
            currentList.children.push(listItem)

        })

    }

    return {
        map: baseList
    }

}

const createItem = (heading: IHeadingResult | null): ListItem => {

    let listItem: ListItem

    if (heading === null) {

        listItem = {
            type: 'listItem',
            spread: false,
            children: []
        }

    } else {

        const link: Link = {
            type: 'link',
            title: null,
            url: '#' + heading.id,
            children: all(heading.children),
        }

        const paragraph: Paragraph = {
            type: 'paragraph',
            children: [link],
        }

        listItem = {
            type: 'listItem',
            spread: false,
            children: [paragraph]
        }

    }

    return listItem

}

const createList = (currentList: IListWithParentList | null, options: IMdxTocOptions): IListWithParentList => {

    const list: IListWithParentList = {
        type: 'list',
        ordered: options.isListOrdered,
        spread: false,
        children: [],
        parent: currentList,
    }

    return list

}

/* followingt code is a copy from mdast-util-toc */
const all = (nodes: PhrasingContent[]): StaticPhrasingContent[] => {

    let result: StaticPhrasingContent[] = []
    let index = -1

    if (nodes) {
        while (++index < nodes.length) {
            result = result.concat(one(nodes[index]))
        }
    }

    return result
}


const one = (node: PhrasingContent): StaticPhrasingContent | StaticPhrasingContent[] => {
    if (node.type === 'footnoteReference') {
        return []
    }

    if (
        node.type === 'link' ||
        node.type === 'linkReference' ||
        node.type === 'footnote'
    ) {
        return all(node.children)
    }

    if ('children' in node) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { children, position, ...copy } = node
        return Object.assign(extend(true, {}, copy), { children: all(node.children) })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { position, ...copy } = node

    return extend(true, {}, copy)

}

const findPlaceholderParent = (root: Root, internalOptions: IRemarkTableOfContentsInternalOptions): Root | MdxJsxFlowElement => {

    let placeholderParent: Root | MdxJsxFlowElement = root

    visitParents(root, 'paragraph', function (node, ancestors) {
        if (node.children[0].type === 'text' && node.children[0].value === internalOptions.placeholder) {
            const ancestor = ancestors[ancestors.length - 1]
            if (ancestor.type === 'mdxJsxFlowElement') {
                placeholderParent = ancestor
            }
            
        }
    })

    return placeholderParent

}

const remarkTableOfContents: Plugin = function plugin(options: IRemarkTableOfContentsOptions = {}): Transformer {

    return async (ast) => {

        const root = ast as Root

        const defaultOptions: IRemarkTableOfContentsInternalOptions = {
            mdx: true,
            containerTagName: 'aside',
            hasContainer: true,
            containerAttributes: {},
            hasNav: true,
            navAttributes: {},
            placeholder: '%toc%',
            minDepth: 1,
            maxDepth: 6,
            isListOrdered: false,
        }

        const internalOptions = Object.assign({}, defaultOptions, options)

        const mdxTocOptions: IMdxTocOptions = {
            minDepth: internalOptions.minDepth,
            maxDepth: internalOptions.maxDepth,
            isListOrdered: internalOptions.isListOrdered,
        }

        const result = mdxToc(root, mdxTocOptions)

        const list = result.map

        if (list === null) {
            return
        }

        const placeholderParent = findPlaceholderParent(root, internalOptions)

        // find the placeholder index
        const index = placeholderParent.children.findIndex(
            (node) => node.type === 'paragraph' && node.children[0].type === 'text' && node.children[0].value === internalOptions.placeholder
        )

        if (index === -1) {
            return
        }

        if (!isValidElement(internalOptions.containerTagName)) {
            return
        }

        const containerAttributesSanitized = sanitizeAttributes(internalOptions.containerAttributes)
        const navAttributesSanitized = sanitizeAttributes(internalOptions.navAttributes)

        const children: Content[] = []

        children.push(...placeholderParent.children.slice(0, index))

        if (internalOptions.mdx) {

            let navElement: MdxJsxFlowElement | undefined

            if (internalOptions.hasNav) {
                let navAttributesMdx: MdxJsxAttribute[] = []

                navAttributesMdx = navAttributesSanitized.map((attribute) => {
                    return {
                        type: 'mdxJsxAttribute',
                        name: attribute.name === 'class' ? 'className' : attribute.name,
                        value: attribute.value,
                    }
                })

                navElement = {
                    type: 'mdxJsxFlowElement',
                    name: 'nav',
                    children: [list],
                    attributes: navAttributesMdx
                }
            }

            if (internalOptions.hasContainer) {

                let containerAttributesMdx: MdxJsxAttribute[] = []

                containerAttributesMdx = containerAttributesSanitized.map((attribute) => {
                    return {
                        type: 'mdxJsxAttribute',
                        name: attribute.name === 'class' ? 'className' : attribute.name,
                        value: attribute.value,
                    }
                })

                const containerElement: MdxJsxFlowElement = {
                    type: 'mdxJsxFlowElement',
                    name: internalOptions.containerTagName,
                    children: [navElement !== undefined ? navElement : list],
                    attributes: containerAttributesMdx
                }

                children.push(containerElement)
            } else {
                children.push(navElement !== undefined ? navElement : list)
            }
        } else {
            if (internalOptions.hasContainer) {

                const containerAttributesHtml = stringifyAttributes(containerAttributesSanitized)

                children.push({
                    type: 'html',
                    value: `<${internalOptions.containerTagName}${containerAttributesHtml}>`,
                })
            }
            if (internalOptions.hasNav) {

                const navAttributesHtml = stringifyAttributes(navAttributesSanitized)

                children.push({
                    type: 'html',
                    value: `<nav${navAttributesHtml}>`,
                })
            }
            children.push(list)
            if (internalOptions.hasNav) {
                children.push({
                    type: 'html',
                    value: '</nav>',
                })
            }
            if (internalOptions.hasContainer) {
                children.push({
                    type: 'html',
                    value: `</${internalOptions.containerTagName}>`,
                })
            }
        }

        children.push(...placeholderParent.children.slice(index + 1))

        placeholderParent.children = Array.prototype.concat(children)

    }

}

export { remarkTableOfContents }