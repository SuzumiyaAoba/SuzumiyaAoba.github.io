/**
 * MDX ファイル内でインポートされている JSON ファイルを読み込み、MDX の scope として提供する
 * @param source MDX のソースコード
 * @param baseDir JSON の相対パスを解決する基準ディレクトリ(コンテンツファイルが置かれているディレクトリ)
 * @returns 解決された JSON データのマップ
 */
export async function loadMdxScope(
  source: string,
  baseDir: string,
): Promise<Record<string, unknown>> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const importRegex = /^import\s+(\w+)\s+from\s+["'](.+\.json)["'];/gm;
  const matches = [...source.matchAll(importRegex)];
  if (matches.length === 0) {
    return {};
  }

  const scope: Record<string, unknown> = {};

  for (const match of matches) {
    const [, name, relPath] = match;
    if (!name || !relPath) {
      continue;
    }
    const filePath = path.join(baseDir, relPath);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      scope[name] = JSON.parse(raw) as unknown;
    } catch {
      continue;
    }
  }

  return scope;
}
