import sizeOf from "image-size";
import path from "path";
import { visit } from "unist-util-visit";

// see: https://blog.yuu383.net/articles/started-with-unified-plugin
export default function rehypeImageSize(...paths: string[]) {
  // @ts-ignore
  return () => (tree, _file) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img") {
        const src = path.join(...paths, node.properties.src);
        node.properties.src = "/" + src;

        const { width, height } = sizeOf(path.resolve("public", src));
        node.properties.width = width;
        node.properties.height = height;
      }
    });
  };
}
