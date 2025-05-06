import sizeOf from "image-size";
import path from "path";
import { visit } from "unist-util-visit";
import fs from "fs";

// see: https://blog.yuu383.net/articles/started-with-unified-plugin
export default function rehypeImageSize(...paths: string[]) {
  // @ts-ignore
  return () => (tree, _file) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img") {
        // 相対パスで始まる場合のみ処理する
        if (
          typeof node.properties.src === "string" &&
          !node.properties.src.startsWith("http")
        ) {
          const originalSrc = node.properties.src;
          const src = path.join(...paths, originalSrc);
          // 画像パスを修正せず、publicディレクトリ内の実際のパスを使用して画像サイズを取得
          try {
            const publicPath = path.resolve("public", src);
            if (fs.existsSync(publicPath)) {
              const dimensions = sizeOf(publicPath);
              // サイズが取得できた場合のみwidth/heightを設定
              if (dimensions.width && dimensions.height) {
                node.properties.width = dimensions.width;
                node.properties.height = dimensions.height;
              }
            }
          } catch (error) {
            console.warn(`Failed to get image size for ${src}:`, error);
          }
        }
      }
    });
  };
}
