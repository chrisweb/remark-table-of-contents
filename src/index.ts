import type { Plugin, Transformer } from 'unified'
import type { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { isElement, Element } from 'hast-util-is-element'
import { htmlEscape } from 'escape-goat'
import { visit } from 'unist-util-visit'
import Slugger from 'github-slugger'
import type { Root, Content, List, ListItem, Paragraph, Link, PhrasingContent, StaticPhrasingContent, ThematicBreak } from 'mdast'
import { toString } from 'mdast-util-to-string'
import extend from 'extend'

export type IHtmlAttributes = Record<string, string | number | boolean | readonly string[]>

export interface IMdxTocOptions {
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
    maxDepth?: number
    isListOrdered?: boolean
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

        if (node.depth <= options.maxDepth) {

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

        baseList = {
            type: 'list',
            ordered: options.isListOrdered,
            spread: false,
            children: [],
            parent: null,
        }

        const currentList = baseList
        const currentDepth = 1

        headings.forEach((heading) => {
            buildToc(heading, currentList, currentDepth, options)
        })

    }

    return {
        map: baseList
    }

}

const buildToc = (heading: IHeadingResult, currentList: IListWithParentList, currentDepth: number, options: IMdxTocOptions) => {

    console.log('heading: ', heading)
    console.log('currentList: ', currentList)
    console.log('currentDepth: ', currentDepth)
    

    if (heading.depth > currentDepth) {

        

        // find the last listItem of the current list
        const lastListItem = currentList.children[currentList.children.length - 1]

        if (lastListItem.children.length === 0) {

            console.log('> add a list to item')

            // add a list to that last listItem
            currentList = addList(currentList, lastListItem, options)
            // increase the currentDepth by one
            currentDepth++
            // enter the function again
            buildToc(heading, currentList, currentDepth, options)
        } else if (lastListItem.children.length > 0 && lastListItem.children[lastListItem.children.length - 1].type === 'list') {

            console.log('> found previous list, moving up currentDepth')

            // add a list to that last listItem
            currentList = lastListItem.children[lastListItem.children.length - 1] as IListWithParentList
            // increase the currentDepth by one
            currentDepth++
            // enter the function again
            buildToc(heading, currentList, currentDepth, options)
        }
    } else if (heading.depth === currentDepth) {

        console.log('> add an item to list')

        // add a list item to the current list
        addItem(heading, currentList)
    } else if (heading.depth < currentDepth && currentList.parent !== null) {

        console.log('> go to parent list')

        // make the parent of the currentList the new currentList
        currentList = currentList.parent
        // decrease the currentDepth by one
        currentDepth--
        // enter the function again
        buildToc(heading, currentList, currentDepth, options)
    }

    console.log('----------------------')

}

const addItem = (heading: IHeadingResult, currentList: IListWithParentList) => {

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

    const listItem: ListItem = {
        type: 'listItem',
        spread: false,
        children: [paragraph]
    }

    currentList.children.push(listItem)

}

const addList = (currentList: IListWithParentList, item: ListItem, options: IMdxTocOptions): IListWithParentList => {

    const list: IListWithParentList = {
        type: 'list',
        ordered: options.isListOrdered,
        spread: false,
        children: [],
        parent: currentList,
    }

    item.children.push(list)

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

const remarkTableOfContents: Plugin = function plugin(options: IRemarkTableOfContentsOptions = {}): Transformer {

    return async (ast) => {

        const mdast = ast as Root

        const { mdx, placeholder, hasContainer, containerTagName, containerAttributes, hasNav, navAttributes, maxDepth, isListOrdered } = options

        // default values
        const mdxOption = mdx !== undefined ? mdx : true
        const placeholderOption = placeholder !== undefined ? placeholder : '%toc%'
        const hasContainerOption = hasContainer !== undefined ? hasContainer : true
        const containerTagNameOption = containerTagName !== undefined ? containerTagName : 'aside'
        const containerAttributesOption = containerAttributes !== undefined ? containerAttributes : {}
        const hasNavOption = hasNav !== undefined ? hasNav : true
        const navAttributesOption = navAttributes !== undefined ? navAttributes : {}
        const maxDepthOption = maxDepth !== undefined ? maxDepth : 6
        const isListOrderedOption = isListOrdered !== undefined ? isListOrdered : false

        const mdxTocOptions: IMdxTocOptions = {
            maxDepth: maxDepthOption,
            isListOrdered: isListOrderedOption,
        }

        //const result = toc(mdast, remarkTocOptions)
        const result = mdxToc(mdast, mdxTocOptions)

        console.log(result)

        const list = result.map

        if (list === null) {
            return
        }

        // find the placeholder
        const index = mdast.children.findIndex(
            (node) => node.type === 'paragraph' && node.children[0].type === 'text' && node.children[0].value === placeholderOption
        )

        if (index === -1) {
            return
        }

        if (!isValidElement(containerTagNameOption)) {
            return
        }

        const containerAttributesSanitized = sanitizeAttributes(containerAttributesOption)
        const navAttributesSanitized = sanitizeAttributes(navAttributesOption)

        const children: Content[] = []

        children.push(...mdast.children.slice(0, index))

        if (mdxOption) {

            let navElement: MdxJsxFlowElement | undefined

            if (hasNavOption) {
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

            if (hasContainerOption) {

                let containerAttributesMdx: MdxJsxAttribute[] = []

                containerAttributesMdx = containerAttributesSanitized.map((attribute) => {
                    return {
                        type: 'mdxJsxAttribute',
                        name: attribute.name,
                        value: attribute.value,
                    }
                })

                const containerElement: MdxJsxFlowElement = {
                    type: 'mdxJsxFlowElement',
                    name: containerTagNameOption,
                    children: [navElement !== undefined ? navElement : list],
                    attributes: containerAttributesMdx
                }

                children.push(containerElement)
            } else {
                children.push(navElement !== undefined ? navElement : list)
            }
        } else {
            if (hasContainerOption) {

                const containerAttributesHtml = stringifyAttributes(containerAttributesSanitized)

                children.push({
                    type: 'html',
                    value: `<${containerTagNameOption}${containerAttributesHtml}>`,
                })
            }
            if (hasNavOption) {

                const navAttributesHtml = stringifyAttributes(navAttributesSanitized)

                children.push({
                    type: 'html',
                    value: `<nav${navAttributesHtml}>`,
                })
            }
            children.push(list)
            if (hasNavOption) {
                children.push({
                    type: 'html',
                    value: '</nav>',
                })
            }
            if (hasContainerOption) {
                children.push({
                    type: 'html',
                    value: `</${containerTagNameOption}>`,
                })
            }
        }

        children.push(...mdast.children.slice(index + 1))

        mdast.children = Array.prototype.concat(children)

    }

}

export { remarkTableOfContents }