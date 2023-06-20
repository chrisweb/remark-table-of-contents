type Root = import('mdast').Root
type Content = import('mdast').Content
type Node = Root | Content

//import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import { toc } from 'mdast-util-toc'

/*type TOCItem = {
    readonly value: string
    readonly id: string
    readonly level: number
  }*/

export const remarkTocMdx = () => {

    const findNodeToReplace = (ast: Node) => {
        


    }

    return async (ast: Node) => {

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
        const list = result.map

        if (list === null) {
            return
        }

        console.log(list)

    }

}