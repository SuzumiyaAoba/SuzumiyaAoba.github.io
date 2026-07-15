/**
 * 実際に存在するコンテンツのルートディレクトリを解決する
 * @returns 解決されたルートディレクトリの絶対パス
 */
export async function resolveContentRoot(): Promise<string> {
  // Use dynamic imports to prevent Storybook from trying to polyfill these in the browser
  const path = await import("node:path");
  const fs = await import("node:fs/promises");

  /**
   * デフォルトのコンテンツルートディレクトリ
   */
  const contentRoot = path.join(process.cwd(), "content");

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

  try {
    await fs.access(contentRoot);
    return contentRoot;
  } catch {
    return fallbackContentRoot;
  }
}
