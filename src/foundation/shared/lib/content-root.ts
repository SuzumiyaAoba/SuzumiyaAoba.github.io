import fs from "node:fs/promises";
import path from "node:path";

/**
 * コンテンツのルートディレクトリが見つからない場合のフォールバックパス
 */
const fallbackContentRoot = path.join(
  process.cwd(),
  "..",
  "SuzumiyaAoba.github.io",
  "src",
  "contents",
);
/**
 * デフォルトのコンテンツルートディレクトリ
 */
const contentRoot = path.join(process.cwd(), "content");

/**
 * 実際に存在するコンテンツのルートディレクトリを解決する
 * @returns 解決されたルートディレクトリの絶対パス
 */
export async function resolveContentRoot(): Promise<string> {
  try {
    await fs.access(contentRoot);
    return contentRoot;
  } catch {
    return fallbackContentRoot;
  }
}
