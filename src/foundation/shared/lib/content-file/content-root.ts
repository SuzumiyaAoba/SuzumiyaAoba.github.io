/**
 * 実際に存在するコンテンツのルートディレクトリを解決する
 * @returns 解決されたルートディレクトリの絶対パス
 */
export async function resolveContentRoot(): Promise<string> {
  // Use dynamic imports to prevent Storybook from trying to polyfill these in the browser
  const fsPromise = import("node:fs/promises");
  const { default: path } = await import("node:path");
  const fs = await fsPromise;

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
    "contents"
  );

  try {
    await fs.access(contentRoot);
    return contentRoot;
  } catch {
    return fallbackContentRoot;
  }
}

/**
 * コンテンツのファイル操作に必要な node:fs・node:path・ルートディレクトリを並列で解決する。
 * node:path の dynamic import は lint 上 `await` + default 分割代入の形が必須なため、
 * 呼び出し側で `Promise.all` に混ぜられず、この関数に集約する。
 * @returns fs・path・コンテンツルート
 */
export async function resolveContentDeps() {
  const fsPromise = import("node:fs/promises");
  const rootPromise = resolveContentRoot();
  const { default: path } = await import("node:path");
  const fs = await fsPromise;
  const root = await rootPromise;
  return { fs, path, root };
}
