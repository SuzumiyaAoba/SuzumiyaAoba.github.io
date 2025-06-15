import path from "path";
import { visit } from "unist-util-visit";

const rehypeResolveImageUrls = () => {
  return (tree, file) => {
    if (!file || !file.path) {
      return;
    }

    const markdownPath = file.path;

    visit(tree, "element", (node) => {
      if (node.tagName === "img" && node.properties?.src) {
        const src = node.properties.src;

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