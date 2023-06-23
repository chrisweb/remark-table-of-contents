import type { Plugin } from 'unified';
import { Options } from 'mdast-util-toc';
export interface IRemarkTableOfContentsOptions extends Options {
    mdx?: boolean;
}
declare const remarkTableOfContents: Plugin;
export { remarkTableOfContents };
