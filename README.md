[![npm version](https://img.shields.io/npm/v/remark-table-of-contents.svg?style=flat)](https://www.npmjs.com/package/remark-table-of-contents)
[![GitHub license](https://img.shields.io/github/license/chrisweb/remark-table-of-contents?style=flat)](https://github.com/chrisweb/remark-table-of-contents/blob/master/LICENSE)

# remark-table-of-contents

remark plugin that generates a table of contents (toc) based on the headlines in your document, the toc then gets inserted in your markdown or mdx documents via a placeholder

should work with markdown as well as MDX, so far it has been tested in next.js 13.x (see [examples folder](./examples/next-js-example/README.md) for a demo)

by default the table of contents (toc) headings list is surrounded by an `<aside id="tocContainer"></aside>` html element and inside of it is a `<nav></nav>`, you can use the options to add attributes to both and disable their use if that's what you require

Note: if you use this plugin, it is highly recommended that you also use [rehype-slug](https://www.npmjs.com/package/rehype-slug) to add unique IDs to all headings which don't already have one (it uses [github-slugger](https://www.npmjs.com/package/github-slugger) under the hood) and also [rehype-autolink-headings](https://www.npmjs.com/package/rehype-autolink-headings) which is another rehype plugin that will automatically add links to your headings back to themselves (to create the feature you often see on blogs or in documentations, that allows you click on a heading which turns the browser URL into the a URL containing the heading ID and then you can copy the URL from the browser to share with someone)

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

Note: I have customized the (aside) container element by adding some attributes, for a full list of options check out the [options section](#options) below

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

## TODOs

* right now the toc placeholder can not be inside of something, for example if you put it into an HTML element then the plugin won't find the placeholder, maybe replacing my simple search with [unist-util-visit](https://www.npmjs.com/package/unist-util-visit) could allow devs to put the toc inside whatever they want!?

## contributing

PRs are welcome 😉

To get started, please check out the [CONTRIBUTING.md](CONTRIBUTING.md) guide of this project
