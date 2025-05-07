import type { Element, Root } from "hast";
import sizeOf from "image-size";
import path from "path";
import { visit } from "unist-util-visit";
import fs from "fs";
import type { Plugin } from "unified";

interface ImageDimensions {
  width?: number;
  height?: number;
}

/**
 * 相対パスの画像に対してサイズを自動設定するRehypeプラグイン
 */
export default function rehypeImageSize(
  ...basePaths: string[]
): Plugin<[], Root> {
  return () => (tree, _file) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") {
        processImageNode(node, basePaths);
      }
    });
  };
}

/**
 * 画像ノードを処理する
 */
function processImageNode(node: Element, basePaths: string[]): void {
  const src = node.properties?.src;

  if (!isRelativePath(src)) {
    return;
  }

  const originalSrc = src as string;
  const newPath = convertToRootRelativePath(originalSrc, basePaths);
  node.properties.src = newPath;

  const dimensions = getImageDimensions(originalSrc, basePaths);
  if (dimensions.width && dimensions.height) {
    node.properties.width = dimensions.width;
    node.properties.height = dimensions.height;
  }
}

/**
 * パスが相対パスかどうかを判定
 */
function isRelativePath(src: unknown): src is string {
  return (
    typeof src === "string" && !src.startsWith("http") && !src.startsWith("/")
  );
}

/**
 * 相対パスをルート相対パスに変換
 */
function convertToRootRelativePath(
  originalSrc: string,
  basePaths: string[]
): string {
  return path.join("/", ...basePaths, originalSrc).replace(/\\/g, "/");
}

/**
 * 画像のサイズを取得
 */
function getImageDimensions(
  originalSrc: string,
  basePaths: string[]
): ImageDimensions {
  try {
    const publicPath = path.resolve("public", ...basePaths, originalSrc);
    if (!fs.existsSync(publicPath)) {
      console.warn(`画像ファイルが見つかりません: ${publicPath}`);
      return {};
    }

    const fileBuffer = fs.readFileSync(publicPath);
    return sizeOf(fileBuffer) || {};
  } catch (error) {
    console.warn(`画像サイズの取得に失敗しました (${originalSrc}):`, error);
    return {};
  }
}
