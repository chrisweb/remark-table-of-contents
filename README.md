[![npm version](https://img.shields.io/npm/v/remark-table-of-contents.svg?style=flat)](https://www.npmjs.com/package/remark-table-of-contents)
[![GitHub license](https://img.shields.io/github/license/chrisweb/remark-table-of-contents?style=flat)](https://github.com/chrisweb/remark-table-of-contents/blob/master/LICENSE)

# remark-table-of-contents

remark plugin that generates a table of contents (toc) based on the headlines in your document, the toc then gets inserted in your markdown or mdx documents via a placeholder

should work with markdown as well as MDX (need to do more testing, get more feedback), so far it has been tested in next.js (13)

for now the table of contents (toc) headings list will be surrounded by an `<aside></aside>` html element, in the future it should be possible to customize if and what is around the toc

## installation

```shell
npm i remark-table-of-contents --save-exact
```

## examples

### with next.js

after [installing](#installation) **remark-table-of-contents**, edit your `next.config.mjs` file, import the plugin and finally add it to the remark plugins configuration:

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

```md
# Hello World!

## foo

## bar

### baz

%toc%
```

the output will look like this:

```md
# Hello World!

## foo

## bar

### baz

<aside>
* [Hello World!](hello-world)
    * [foo](#foo)
    * [bar](#bar)
        * [baz](#baz)
</aside>
```

## options

`options` (optional)

`options.mdx` (boolean, default: true)

let's the plugin know if you are using mdx (mdx:true) or markdown (mdx: false)

`options.*`

this plugin uses [mdast-util-toc](https://github.com/syntax-tree/mdast-util-toc) to generate the toc, which means all **mdast-util-toc** options are supported:

* `heading` (`string`, optional) heading to look for, wrapped in `new RegExp('^(' + value + ')$', 'i')`
* `maxDepth` (`number`, default: `6`) maximum heading depth to include in the table of contents. This is inclusive: when set to `3`, level three headings are included (those with three hashes, `###`)
* `skip` (`string`, optional) headings to skip, wrapped in `new RegExp('^(' + value + ')$', 'i')`. Any heading matching this expression will not be present in the table of contents
* `parents` ([`Test`](https://github.com/syntax-tree/unist-util-is#test), default: `tree`) allow headings to be children of certain node types. Can by any [`unist-util-is`](https://github.com/syntax-tree/unist-util-is#isnode-test-index-parent-context) compatible test
* `tight` (`boolean`, default: `false`) whether to compile list items tightly
* `ordered` (`boolean`, default: `false`) whether to compile list items as an ordered list, otherwise they are unordered
* `prefix` (`string`, optional) add a prefix to links to headings in the table of contents. Useful for example when later going from mdast to hast and sanitizing with `hast-util-sanitize`.
