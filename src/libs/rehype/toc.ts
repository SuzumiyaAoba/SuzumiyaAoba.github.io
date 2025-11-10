import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";

export interface TocHeading {
  depth: number;
  text: string;
  id: string;
}

export interface TocEntry {
  heading: TocHeading;
  children: TocEntry[];
}

function buildHierarchy(headings: TocHeading[]): TocEntry[] {
  const root: TocEntry = {
    heading: { depth: 0, text: "root", id: "root" },
    children: [],
  };
  const stack: TocEntry[] = [root];

  for (const heading of headings) {
    const entry: TocEntry = { heading, children: [] };

    while (
      stack.length > 1 &&
      stack[stack.length - 1].heading.depth >= heading.depth
    ) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    parent.children.push(entry);
    stack.push(entry);
  }

  return root.children;
}

export function extractTocFromTree(tree: Root): TocEntry[] {
  const headings: TocHeading[] = [];

  visit(tree, "element", (node: Element) => {
    if (
      (node.tagName === "h2" ||
        node.tagName === "h3" ||
        node.tagName === "h4") &&
      node.properties?.id
    ) {
      headings.push({
        depth: parseInt(node.tagName.charAt(1), 10),
        text: toString(node),
        id: node.properties.id as string,
      });
    }
  });

  if (headings.length === 0) {
    return [];
  }
  return buildHierarchy(headings);
}
