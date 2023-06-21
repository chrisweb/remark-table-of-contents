type Root = import('mdast').Root
//type Content = import('mdast').Content
//type Node = Root | Content

import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { toc } from 'mdast-util-toc'

export const remarkTocMdx = () => {

    return async (ast: Root) => {

        //const headings: TOCItem[] = []

        /*visit(ast, 'heading', (child) => {

            const value = toString(child)

            // depth:1 headings are titles and not included in the TOC
            if (!value || child.depth < 2) {
                return
            }

            console.log(child)

        })

        return ast*/

        const result = toc(ast)

        //console.log('result: ', result)

        const list = result.map

        if (list === null) {
            return
        }

        //console.log('list: ', list)
        //console.log('typeof list: ', typeof list)

        const index = ast.children.findIndex(
            (node) => node.type === 'code' && node.value === '%toc%'
        )

        if (index === -1) {
            return
        }

        ast.children = Array.prototype.concat(
            ast.children.slice(0, index),
            {
                type: 'html',
                value: '<aside>',
            },
            result.map,
            {
                type: 'html',
                value: '</aside>',
            },
            ast.children.slice(index + 1)
        );

        console.log('new ast: ', ast)

        return ast

    }

    

}