import type { Plugin } from 'unified';
import { Options } from 'mdast-util-toc';
export type IHtmlAttributes = Record<string, string | number | boolean | readonly string[]>;
export interface IRemarkTableOfContentsOptions extends Options {
    mdx?: boolean;
    containerTagName?: string;
    hasContainer?: boolean;
    containerAttributes?: IHtmlAttributes;
    hasNav?: boolean;
    navAttributes?: IHtmlAttributes;
    placeholder?: string;
}
declare const remarkTableOfContents: Plugin;
export { remarkTableOfContents };
