import path from "path";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import type { Plugin } from "unified";

const rehypeResolveImageUrls: Plugin<[string], Root> = (
  markdownPath: string,
) => {
  return (tree) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img" && node.properties?.src) {
        const src = node.properties.src as string;

        if (src.startsWith("./") || src.startsWith("../")) {
          const contentDir = markdownPath
            .replace(/^src\/contents\//, "")
            .split("/")
            .slice(0, -1)
            .join("/");

          const newSrc = path.join("/assets", contentDir, src);

          node.properties.src = newSrc;
        }
      }
    });
  };
};

export default rehypeResolveImageUrls; 