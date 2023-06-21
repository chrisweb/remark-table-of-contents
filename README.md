[![npm version](https://img.shields.io/npm/v/remark-table-of-contents.svg?style=flat)](https://www.npmjs.com/package/remark-table-of-contents)
[![GitHub license](https://img.shields.io/github/license/chrisweb/remark-table-of-contents?style=flat)](https://github.com/chrisweb/remark-table-of-contents/blob/master/LICENSE)

# remark-table-of-contents

remark plugin to generate a table of contents (toc) which can be inserted in markdown or mdx documents via a placeholder

should work with markdown as well as MDX (need to do more testing, get more feedback), so far it has been tested in next.js (13)

for now the table of contents (toc) headings list will be surrounded by an `<aside></aside>` html element, in the future it should be possible to customize if and what is around the toc

## installation

```shell
npm i remark-table-of-contents --save-exact
```

## usage

### with next.js

after installing it, edit your `next.config.mjs` file, import the plugin and finally add it to the remark plugins configuration:

```js
import WithMDX from '@next/mdx'
import { remarkTableOfContents } from 'remark-table-of-contents'

const nextConfig = (/*phase*/) => {

    const withMDX = WithMDX({
        extension: /\.mdx?$/,
        options: {
            remarkPlugins: [remarkTableOfContents],
            rehypePlugins: [],
        },
    })

    /** @type {import('next').NextConfig} */
    const nextConfig = {
        experimental: {
            // experimental support for next.js > 13 app directory
            appDir: true,
            // experimental use rust compiler for MDX
            mdxRs: false,
        },
        pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    }

    return withMDX(nextConfig)

}

export default nextConfig
```

then create an mdx document, for example `app/articles/page.mdx` and add some content with headings and the **table of contents placeholder** (put the placeholder in the document, where you want the toc to be displayed, can be anywhere you want):

```mdx
# Hello World!

## foo

## bar

### baz

%toc%
```