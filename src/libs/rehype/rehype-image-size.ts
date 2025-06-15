import sizeOf from "image-size";
import path from "path";
import { visit } from "unist-util-visit";
import fs from "fs";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

const rehypeImageSize: Plugin<string[], Root> = (...paths: string[]) => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (
        node.tagName === "img" &&
        node.properties &&
        typeof node.properties.src === "string"
      ) {
        if (
          !node.properties.src.startsWith("http") &&
          !node.properties.src.startsWith("/")
        ) {
          const originalSrc = node.properties.src;

          const newPath = path
            .join("/", ...paths, originalSrc)
            .replace(/\\/g, "/");
          node.properties.src = newPath;

          try {
            const publicPath = path.resolve("public", ...paths, originalSrc);
            if (fs.existsSync(publicPath)) {
              const fileBuffer = fs.readFileSync(publicPath);
              const dimensions = sizeOf(fileBuffer);
              if (dimensions.width && dimensions.height) {
                node.properties.width = dimensions.width;
                node.properties.height = dimensions.height;
              }
            } else {
              console.warn(`Image file not found at: ${publicPath}`);
            }
          } catch (error) {
            console.warn(`Failed to get image size for ${originalSrc}:`, error);
          }
        }
      }
    });
  };
};

export default rehypeImageSize;
