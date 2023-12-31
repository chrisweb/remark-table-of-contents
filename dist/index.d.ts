import type { Plugin } from 'unified';
export type IHtmlAttributes = Record<string, string | number | boolean | readonly string[]>;
export interface IMdxTocOptions {
    minDepth: number;
    maxDepth: number;
    isListOrdered: boolean;
}
export interface IRemarkTableOfContentsOptions {
    mdx?: boolean;
    containerTagName?: string;
    hasContainer?: boolean;
    containerAttributes?: IHtmlAttributes;
    hasNav?: boolean;
    navAttributes?: IHtmlAttributes;
    placeholder?: string;
    minDepth?: number;
    maxDepth?: number;
    isListOrdered?: boolean;
}
declare const remarkTableOfContents: Plugin;
export { remarkTableOfContents };
