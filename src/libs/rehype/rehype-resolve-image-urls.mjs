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

        if (String(src).startsWith("./") || String(src).startsWith("../")) {
          // 'src/contents/' を含むパスの部分を探す
          const contentRoot = "src/contents/";
          const contentRootIndex = markdownPath.indexOf(contentRoot);

          if (contentRootIndex !== -1) {
            // 'src/contents/' 以降のパスを取得
            const relativeToContentRoot = markdownPath.substring(
              contentRootIndex + contentRoot.length,
            );

            // ファイル名を除いたディレクトリ部分を取得
            const contentDir = path.dirname(relativeToContentRoot);

            // 相対パスを絶対パスに解決
            const resolvedSrc = path.posix.resolve(
              "/" + contentDir,
              String(src).replace(/^\.\//, "")
            );

            // 新しい絶対パスを生成 (URLなので必ず / 区切りを使う)
            const newSrc = path.posix.join("/assets", resolvedSrc);
            node.properties.src = newSrc;
          }
        }
      }
    });
  };
};

export default rehypeResolveImageUrls; 