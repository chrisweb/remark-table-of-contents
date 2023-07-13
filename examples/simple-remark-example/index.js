import { read } from 'to-vfile'
import { remark } from 'remark'
import { remarkTableOfContents } from '../../dist/index.js'

const start = async () => {
    const file = await remark()
        .use(remarkTableOfContents, { mdx: false })
        .process(await read('content.md'))

    console.log(String(file))
}

start()