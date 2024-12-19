import sizeOf from "image-size";
import { resolve } from "path";
import { visit } from "unist-util-visit";

// see: https://blog.yuu383.net/articles/started-with-unified-plugin
export default function rehypeImageSize(assetsBasePath: string, slug: string) {
  // @ts-ignore
  return () => (tree, _file) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img") {
        const src = node.properties.src;

        const absolutePath = resolve(assetsBasePath, slug, src);
        node.properties.src = absolutePath;

        const { width, height } = sizeOf("public" + absolutePath);
        node.properties.width = width;
        node.properties.height = height;
      }
    });
  };
}
