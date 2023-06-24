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
            remarkPlugins: [[remarkTableOfContents, { tight: true, containerAttributes: { id: 'myCustomId', class: ['myFirstCssClass', 'mySecondCssClass'] } }]],
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

Note: I have passed an option from **mdast-util-toc** to make the table of contents more compact, I also customized the container element by adding some attributes, for a full list of options check out the [options section](#options) below

then create an mdx document, for example `app/articles/page.mdx` and add some content with headings and the **table of contents placeholder** (put the placeholder in the document, where you want the toc to be displayed, can be anywhere you want):

```md
# Hello World!

## foo

## bar

### baz

%toc%
```

Note: right now the toc placeholder `%toc%` can not be inside of something else, for example if you put it inside of an html element then the plugin will not be able to find it, this could an improvement (PRs are welcome by the way 😉), other than that you can put the toc wherever you want and you can change the placeholder via the plugin options if you prefer some other string instead of the default one

the output will look like this:

```md
# Hello World!

## foo

## bar

### baz

<aside id="myCustomId" class="myFirstCssClass mySecondCssClass">
    <nav>
        * [Hello World!](hello-world)
            * [foo](#foo)
            * [bar](#bar)
                * [baz](#baz)
    </nav>
</aside>
```

## options

`options` (optional)

all options have default values which for most use cases should be enough, meaning there is zero configuration to do, unless you want to customize something

* `mdx` (`boolean`, default: true) if you use mdx-js leave it to true, if you use markdown set it to false
* `placeholder` (`string`, default '%toc%') the placeholder that you insert into your markdown / MDX and that will get replaced by the toc
* `hasContainer` (`boolean`, default: true) by default the toc is in a container (by default it is an `<aside>` element, see next option), set to false to not use a container
* `containerTagName` (`string`, default: 'aside') chose an element for the container that is around the toc, can by any html element you want, a `div`, a `section` ...
* `containerAttributes` (`object`, default {}) an object, where the keys are the attribute names and the values are the attribute values, allows you for example to add an `id` html attribute or a `class` attribute where the value is an array of class names
* `hasNav` (`boolean`, default: true) by default the toc is inside a `<nav>` element, set to false to not use the nav element
* `navAttributes` (`object`, default {}) an object, where the keys are the attribute names and the values are the attribute values, allows you for example to add an `id` html attribute or a `class` attribute where the value is an array of class names

this plugin uses [mdast-util-toc](https://github.com/syntax-tree/mdast-util-toc) under the hood, to generate the toc, which means all **mdast-util-toc** options are supported as well:

* `heading` (`string`, optional) heading to look for, wrapped in `new RegExp('^(' + value + ')$', 'i')`
* `maxDepth` (`number`, default: `6`) maximum heading depth to include in the table of contents. This is inclusive: when set to `3`, level three headings are included (those with three hashes, `###`)
* `skip` (`string`, optional) headings to skip, wrapped in `new RegExp('^(' + value + ')$', 'i')`. Any heading matching this expression will not be present in the table of contents
* `parents` ([`Test`](https://github.com/syntax-tree/unist-util-is#test), default: `tree`) allow headings to be children of certain node types. Can by any [`unist-util-is`](https://github.com/syntax-tree/unist-util-is#isnode-test-index-parent-context) compatible test
* `tight` (`boolean`, default: `false`) whether to compile list items tightly
* `ordered` (`boolean`, default: `false`) whether to compile list items as an ordered list, otherwise they are unordered
* `prefix` (`string`, optional) add a prefix to links to headings in the table of contents. Useful for example when later going from mdast to hast and sanitizing with `hast-util-sanitize`.

## TODOs

* right now the toc placeholder can not be inside of something, for example if you put it into an html element then the plugin won't find the placeholder, maybe replacing my simple search with [unist-util-visit](https://www.npmjs.com/package/unist-util-visit) could allow devs to put the toc inside whatever they want!?

## contributing

PRs are welcome 😉

To get started, please check out the [CONTRIBUTING.md](CONTRIBUTING.md) guide of this project
