import { isElement } from "hast-util-is-element";
import { htmlEscape } from "escape-goat";
import { visit } from "unist-util-visit";
import { visitParents } from "unist-util-visit-parents";
import Slugger from "github-slugger";
import { toString } from "mdast-util-to-string";
const isValidElement = (tagName) => {
  const element = {
    type: "element",
    tagName,
    children: [],
    properties: {}
  };
  return isElement(element);
};
const sanitizeAttributes = (attributes) => {
  const sanitizedAttributes = [];
  for (const [name, value] of Object.entries(attributes)) {
    const sanitizedName = htmlEscape(name);
    if (value === false || value === void 0 || value === null) {
      continue;
    }
    let sanitizedValue = "";
    if (Array.isArray(value)) {
      sanitizedValue = value.join(" ");
    } else if (value === true) {
      sanitizedValue = String(value);
    } else if (typeof value === "string") {
      sanitizedValue = htmlEscape(value);
    }
    sanitizedAttributes.push({ name: sanitizedName, value: sanitizedValue });
  }
  return sanitizedAttributes;
};
const stringifyAttributes = (attributes) => {
  let attributesString = "";
  attributes.forEach((attribute) => {
    attributesString += ` ${attribute.name}="${attribute.value}"`;
  });
  return attributesString;
};
const findHeadings = (tree, options) => {
  const headings = [];
  const slugger = new Slugger();
  visit(tree, "heading", (node) => {
    if (node.depth >= options.minDepth && node.depth <= options.maxDepth) {
      const nodeAsString = toString(node);
      const headingId = slugger.slug(nodeAsString);
      headings.push({
        depth: node.depth,
        children: node.children,
        id: headingId
      });
    }
  });
  return headings;
};
const mdxToc = (tree, options) => {
  const headings = findHeadings(tree, options);
  let baseList = null;
  if (headings.length > 0) {
    const lowestDepth = Math.min(...headings.map((heading) => heading.depth));
    if (lowestDepth !== 1) {
      headings.forEach((heading) => {
        const depthToSubstract = lowestDepth - 1;
        heading.depth = heading.depth - depthToSubstract;
      });
    }
    baseList = createList(null, options);
    let currentList = baseList;
    let currentDepth = 1;
    headings.forEach((heading) => {
      if (heading.depth > currentDepth) {
        while (heading.depth > currentDepth) {
          let currentItem;
          if (currentList.children.length === 0) {
            currentItem = createItem(null);
            currentList.children.push(currentItem);
          } else {
            currentItem = currentList.children[currentList.children.length - 1];
          }
          currentList = createList(currentList, options);
          currentItem.children.push(currentList);
          currentDepth++;
        }
      } else if (heading.depth < currentDepth && currentList.parent !== null) {
        while (heading.depth < currentDepth) {
          if (currentList.parent !== null) {
            currentList = currentList.parent;
            currentDepth--;
          }
        }
      }
      const listItem = createItem(heading);
      currentList.children.push(listItem);
    });
  }
  return {
    map: baseList
  };
};
const createItem = (heading) => {
  let listItem;
  if (heading === null) {
    listItem = {
      type: "listItem",
      spread: false,
      children: []
    };
  } else {
    const link = {
      type: "link",
      title: null,
      url: "#" + heading.id,
      children: all(heading.children)
    };
    const paragraph = {
      type: "paragraph",
      children: [link]
    };
    listItem = {
      type: "listItem",
      spread: false,
      children: [paragraph]
    };
  }
  return listItem;
};
const createList = (currentList, options) => {
  const list = {
    type: "list",
    ordered: options.isListOrdered,
    spread: false,
    children: [],
    parent: currentList
  };
  return list;
};
const findPlaceholderParent = (root, internalOptions) => {
  let placeholderParent = root;
  visitParents(root, "paragraph", function(node, ancestors) {
    if (node.children[0].type === "text" && node.children[0].value === internalOptions.placeholder) {
      const ancestor = ancestors[ancestors.length - 1];
      if (ancestor.type === "mdxJsxFlowElement") {
        placeholderParent = ancestor;
      }
    }
  });
  return placeholderParent;
};
const remarkTableOfContents = function plugin(options = {}) {
  return async (ast) => {
    const root = ast;
    const defaultOptions = {
      mdx: true,
      containerTagName: "aside",
      hasContainer: true,
      containerAttributes: {},
      hasNav: true,
      navAttributes: {},
      placeholder: "%toc%",
      minDepth: 1,
      maxDepth: 6,
      isListOrdered: false
    };
    const internalOptions = Object.assign({}, defaultOptions, options);
    const mdxTocOptions = {
      minDepth: internalOptions.minDepth,
      maxDepth: internalOptions.maxDepth,
      isListOrdered: internalOptions.isListOrdered
    };
    const result = mdxToc(root, mdxTocOptions);
    const list = result.map;
    if (list === null) {
      return;
    }
    const placeholderParent = findPlaceholderParent(root, internalOptions);
    const index = placeholderParent.children.findIndex(
      (node) => node.type === "paragraph" && node.children[0].type === "text" && node.children[0].value === internalOptions.placeholder
    );
    if (index === -1) {
      return;
    }
    if (!isValidElement(internalOptions.containerTagName)) {
      return;
    }
    const containerAttributesSanitized = sanitizeAttributes(internalOptions.containerAttributes);
    const navAttributesSanitized = sanitizeAttributes(internalOptions.navAttributes);
    const children = [];
    children.push(...placeholderParent.children.slice(0, index));
    if (internalOptions.mdx) {
      let navElement;
      if (internalOptions.hasNav) {
        let navAttributesMdx = [];
        navAttributesMdx = navAttributesSanitized.map((attribute) => {
          return {
            type: "mdxJsxAttribute",
            name: attribute.name === "class" ? "className" : attribute.name,
            value: attribute.value
          };
        });
        navElement = {
          type: "mdxJsxFlowElement",
          name: "nav",
          children: [list],
          attributes: navAttributesMdx
        };
      }
      if (internalOptions.hasContainer) {
        let containerAttributesMdx = [];
        containerAttributesMdx = containerAttributesSanitized.map((attribute) => {
          return {
            type: "mdxJsxAttribute",
            name: attribute.name === "class" ? "className" : attribute.name,
            value: attribute.value
          };
        });
        const containerElement = {
          type: "mdxJsxFlowElement",
          name: internalOptions.containerTagName,
          children: [navElement !== void 0 ? navElement : list],
          attributes: containerAttributesMdx
        };
        children.push(containerElement);
      } else {
        children.push(navElement !== void 0 ? navElement : list);
      }
    } else {
      if (internalOptions.hasContainer) {
        const containerAttributesHtml = stringifyAttributes(containerAttributesSanitized);
        children.push({
          type: "html",
          value: `<${internalOptions.containerTagName}${containerAttributesHtml}>`
        });
      }
      if (internalOptions.hasNav) {
        const navAttributesHtml = stringifyAttributes(navAttributesSanitized);
        children.push({
          type: "html",
          value: `<nav${navAttributesHtml}>`
        });
      }
      children.push(list);
      if (internalOptions.hasNav) {
        children.push({
          type: "html",
          value: "</nav>"
        });
      }
      if (internalOptions.hasContainer) {
        children.push({
          type: "html",
          value: `</${internalOptions.containerTagName}>`
        });
      }
    }
    children.push(...placeholderParent.children.slice(index + 1));
    placeholderParent.children = Array.prototype.concat(children);
  };
};
function all(nodes) {
  const results = [];
  let index = -1;
  while (++index < nodes.length) {
    const result = one(nodes[index]);
    if (Array.isArray(result)) {
      results.push(...result);
    } else {
      results.push(result);
    }
  }
  return results;
}
function one(node) {
  if (node.type === "footnoteReference") {
    return [];
  }
  if (node.type === "link" || node.type === "linkReference") {
    return all(node.children);
  }
  if ("children" in node) {
    const { children, position: position2, ...copy2 } = node;
    return Object.assign(structuredClone(copy2), {
      children: all(node.children)
    });
  }
  const { position, ...copy } = node;
  return structuredClone(copy);
}
export {
  remarkTableOfContents
};
