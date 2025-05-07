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
          !node.properties.src.startsWith("http") &&
          !node.properties.src.startsWith("/")
        ) {
          const originalSrc = node.properties.src;

          // パスを修正してルート相対パスに変換
          // 注意: pathsには既に"assets"が含まれていることを前提とする
          const newPath = path
            .join("/", ...paths, originalSrc)
            .replace(/\\/g, "/");
          node.properties.src = newPath;

          // 画像サイズを取得して設定
          try {
            const publicPath = path.resolve("public", ...paths, originalSrc);
            if (fs.existsSync(publicPath)) {
              // v2.0.0以降のimage-sizeはファイルパスの代わりにバッファまたはファイルのバイナリデータを引数に取る
              const fileBuffer = fs.readFileSync(publicPath);
              const dimensions = sizeOf(fileBuffer);
              // サイズが取得できた場合のみwidth/heightを設定
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
}
