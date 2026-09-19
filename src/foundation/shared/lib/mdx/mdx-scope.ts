/**
 * MDX ファイル内でインポートされている JSON ファイルを読み込み、MDX の scope として提供する
 * @param source MDX のソースコード
 * @param baseDir JSON の相対パスを解決する基準ディレクトリ(コンテンツファイルが置かれているディレクトリ)
 * @returns 解決された JSON データのマップ
 */
export async function loadMdxScope(
  source: string,
  baseDir: string
): Promise<Record<string, unknown>> {
  const fsPromise = import("node:fs/promises");
  const { default: path } = await import("node:path");
  const fs = await fsPromise;

  const importRegex = /^import\s+(\w+)\s+from\s+["'](.+\.json)["'];/gmu;
  const matches = [...source.matchAll(importRegex)];
  if (matches.length === 0) {
    return {};
  }

  // Promise.all の結果順は文書順に一致するため、同じ識別子の再定義も文書順で適用される。
  const entries = await Promise.all(
    matches.map(async (match) => {
      const [, name, relPath] = match;
      if (!name || !relPath) {
        return null;
      }
      try {
        const raw = await fs.readFile(path.join(baseDir, relPath), "utf-8");
        return [name, JSON.parse(raw) as unknown] as const;
      } catch {
        return null;
      }
    })
  );

  const scope: Record<string, unknown> = {};
  for (const entry of entries) {
    if (entry) {
      const [name, value] = entry;
      scope[name] = value;
    }
  }

  return scope;
}
