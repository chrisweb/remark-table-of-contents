import type { Plugin, Transformer } from 'unified'
import type { Root, Content } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx-jsx'
import { toc, Options } from 'mdast-util-toc'
import { isElement, Element } from 'hast-util-is-element'
import { htmlEscape } from 'escape-goat'

export type IHtmlAttributes = Record<string, string | number | boolean | readonly string[]>

export interface IRemarkTableOfContentsOptions extends Options {
    mdx?: boolean
    containerTagName?: string
    hasContainer?: boolean
    containerAttributes?: IHtmlAttributes
    hasNav?: boolean
    navAttributes?: IHtmlAttributes
    placeholder?: string
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

const remarkTableOfContents: Plugin = function plugin(options: IRemarkTableOfContentsOptions = {}): Transformer {

    return async (ast) => {

        const mdast = ast as Root

        const { mdx, placeholder, hasContainer, containerTagName, containerAttributes, hasNav, navAttributes, ...tocOptions } = options

        // default values
        const mdxOption = mdx !== undefined ? mdx : true
        const placeholderOption = placeholder !== undefined ? placeholder : '%toc%'
        const hasContainerOption = hasContainer !== undefined ? hasContainer : true
        const containerTagNameOption = containerTagName !== undefined ? containerTagName : 'aside'
        const containerAttributesOption = containerAttributes !== undefined ? containerAttributes : {}
        const hasNavOption = hasNav !== undefined ? hasNav : true
        const navAttributesOption = navAttributes !== undefined ? navAttributes : {}
        const remarkTocOptions = tocOptions !== undefined ? tocOptions : {}

        const result = toc(mdast, remarkTocOptions)

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