# next-js-example

## introduction

this is a demo using the [next.js framework](https://github.com/vercel/next.js/)

in the `/app` directory there is `page.mdx` file with some content to test the **remark table of contents** plugin

the MDX configuration, as well as the configuration for the plugin can be found in the `mdx-components.tsx` in the root folder of the example

## install the dependencies

use the following command to install the dependencies (node_modules):

`npm i`

## dev (local) server

to start the dev server, use your terminal and then go into the root of this example, then run the following command:

`npm run dev`

## linting

use the following command if you want to lint the code files:

`npm run lint`

## examples

* <http://localhost:3000/> is the homepage, it is an MDX page with an `<article>` element around the content, the toc placeholder is also inside of the `<article>` element
* <http://localhost:3000/example-min-depth-not-1> is the second example, this example has headings that don't start at a depth of 1
