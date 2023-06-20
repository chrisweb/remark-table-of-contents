type Root = import('mdast').Root;
type Content = import('mdast').Content;
type Node = Root | Content;
export declare const remarkTocMdx: () => (ast: Node) => Promise<Node>;
export {};
