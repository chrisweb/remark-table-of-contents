[![npm version](https://img.shields.io/npm/v/remark-table-of-contents.svg?style=flat)](https://www.npmjs.com/package/remark-table-of-contents)
[![GitHub license](https://img.shields.io/github/license/chrisweb/remark-table-of-contents?style=flat)](https://github.com/chrisweb/remark-table-of-contents/blob/master/LICENSE)

# remark-table-of-contents

remark plugin that generates a **table of contents** (toc) based on the headlines in your document, the toc then gets inserted in your markdown or mdx documents via a placeholder

Note: works with pure markdown as well as MDX, so far it has been tested in next.js 13.x (see [examples folder](./examples/next-js-app-dir-mdx/README.md) for a demo)

this is a zero configuration package as all [options](#options) have defaults, but you can use them if you wish to modify default behavior, like for example by default the table of contents (toc) headings list is surrounded by an `<aside id="tocContainer"></aside>` html element and inside of it there is a `<nav></nav>` html element which you can disable via the options if that's what you prefer, you can also use the options to rename the container and you can use them to add attributes to the container and the nav element, check out the [options section](#options) below for a full list of available options

Note: if you use this plugin, it is highly recommended that you also use [rehype-slug](https://www.npmjs.com/package/rehype-slug) to add unique IDs to all headings which don't already have one (it uses [github-slugger](https://www.npmjs.com/package/github-slugger) under the hood) and also [rehype-autolink-headings](https://www.npmjs.com/package/rehype-autolink-headings) which is another rehype plugin that will automatically add links to your headings back to themselves (to create the feature you often see on blogs or in documentations, that allows you click on a heading which turns the browser URL into the a URL containing the heading ID and then you can copy the URL from the browser to share with someone)

## installation

```shell
npm i remark-table-of-contents --save-exact
```

## examples

### remark example

pure markdown example

Note: when using the remark-table-of-contents plugin and your content is **markdown** (so when it is NOT MDX), you need to set the option **mdx** to **false** which is what this example does, for a full list of options check out the [options section](#options) below

check out the [readme of the remark example](./examples/simple-remark-example/README.md) for more details about this example, all the source code is located in `examples/simple-remark-example/`

### example using next.js with @next/mdx

Note: you will find a README with more details as well as all the source code I mention below, in the [examples/next-js-app-dir-mdx/](./examples/next-js-app-dir-mdx/README.md) directory

in this [next.js MDX](https://nextjs.org/docs/app/building-your-application/configuring/mdx) example I will use the next.js >= 13 **App Router** with [@next/mdx](https://www.npmjs.com/package/@next/mdx)

after [installing](#installation) **remark-table-of-contents**, edit your `next.config.mjs` file, import the plugin and finally add it to the remark plugins configuration:

```js
import WithMDX from '@next/mdx'
import { remarkTableOfContents } from '../../dist/index.js'

const nextConfig = (/*phase*/) => {

    const withMDX = WithMDX({
        extension: /\.mdx?$/,
        options: {
            remarkPlugins: [[remarkTableOfContents, { 
                containerAttributes: { 
                    id: 'myCustomId',
                    class: ['myFirstCssClass', 'mySecondCssClass'],
                },
                navAttributes: {
                    'aria-label': 'table of contents'
                }
            }]],
            rehypePlugins: [],
        },
    })

    /** @type {import('next').NextConfig} */
    const nextConfig = {
        experimental: {
            appDir: true,
            mdxRs: false,
        },
        pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    }

    return withMDX(nextConfig)

}

export default nextConfig
```

Note: I have customized the (aside) container element by adding some attributes, for a full list of options check out the [options section](#options) below

As you can see we added an ID as well as classes to the **aside** container, you can then use those to apply your own custom css rules to table of contents, for example you might want to position it on the right and make it "sticky" so it won't move even when the user scrolls down, then you could add some css like this:

```css
#myCustomId {
    position: absolute;
    top: 20px;
    right: 20px;
}
```

or maybe you want to remove the default list styling, using custom css like so:

```css
#myCustomId ul {
    list-style: none;
}
```

then create an mdx document, for example `app/articles/page.mdx` and add some content with headings and the **table of contents placeholder** (put the placeholder in the document, where you want the toc to be displayed, can be anywhere you want):

```md
<article>

# Hello World!

## foo

## bar

### baz

%toc%

<article>
```

Note: you can put the toc wherever you want and you can change the placeholder via the plugin options if you prefer some other string instead of the default one

the result will look like this:

```md
<article>

# Hello World!

## foo

## bar

### baz

<aside id="myCustomId" class="myFirstCssClass mySecondCssClass">

<nav aria-label="table of contents">

*   [Hello World!](#hello-world)
    *   [foo](#foo)
    *   [bar](#bar)
        *   [baz](#baz)

</nav>

</aside>

<article>
```

## options

`options` (optional)

all options have default values which for most use cases should be enough, meaning there is zero configuration to do, unless you want to customize something

* `mdx` (`boolean`, default: true) if you use mdx-js leave it to true, if you use markdown set it to false
* `containerTagName` (`string`, default: 'aside') chose an element for the container that is around the toc, can by any html element you want, a `div`, a `section` ...
* `hasContainer` (`boolean`, default: true) by default the toc is in a container (by default it is an `<aside>` element, see next option), set to false to not use a container
* `containerAttributes` (`object`, default {}) an object, where the keys are the attribute names and the values are the attribute values, allows you for example to add an `id` html attribute or a `class` attribute where the value is an array of class names
* `hasNav` (`boolean`, default: true) by default the toc is inside a `<nav>` element, set to false to not use the nav element
* `navAttributes` (`object`, default {}) an object, where the keys are the attribute names and the values are the attribute values, allows you for example to add an `id` html attribute or a `class` attribute where the value is an array of class names
* `placeholder` (`string`, default '%toc%') the placeholder that you insert into your markdown / MDX and that will get replaced by the toc
* `minDepth` (`number`, default 1) the minimum depth to include in the table of contents, set it for example to 2, if you want to exclude the heading with a depth of 1 (`<h1>`)
* `maxDepth` (`number`, default 6) the maximum depth to include in the table of contents, set it for example to 4, then all headings that have a depth of 5 or 6 will get excluded from the table of contents list
* `isListOrdered` (`boolean`, default false) use an ordered list `<ol>` or an unordered list `<ul>`

## TODOs

* also search for h1-h6 (jsx) if the mode is mdx
* would it be possible to autodetect if content is pure markdown or MDX instead of having an option the user needs to set manually if it is not mdx
* should we add an option to disable the internal use of github slugger for users that don't want it

## bugs

if you find a bug, please open an issue in the [remark-table-of-contents issues page on github](https://github.com/chrisweb/remark-table-of-contents/issues), try to describe the bug you encountered as best as you can and if possible add some examples of the markdown / mdx content or code that you used when you found the bug, I or a contributor will try to look into it asap

## feedback

If you have an idea to improve this project please use the ["NEW Feature Request"](https://github.com/chrisweb/rehype-github-alerts/issues/new/choose) issue template or if you have any feedback about this package you may want to use the [discussions tool of this repository](https://github.com/chrisweb/rehype-github-alerts/discussions)

## contributing

PRs are welcome 😉

To get started, please check out the [CONTRIBUTING.md](CONTRIBUTING.md) guide of this project
