import { resolveContentRoot } from "./content-root";

/**
 * `content/<collectionDir>` 直下のディレクトリ名一覧を昇順で返す。
 * ディレクトリが存在しない場合は空配列を返す。
 */
export async function listContentSlugs(collectionDir: string): Promise<string[]> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const dir = path.join(root, collectionDir);

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}
