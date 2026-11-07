import { resolveContentDeps } from "@/shared/lib/content-file";

import { LinkCardSourceSchema } from "./link-card-schema";
import type { LinkCardEntry } from "./link-card-schema";

let cachedEntries: Map<string, LinkCardEntry> | null = null;

/**
 * リンクカードのデータをファイルから読み込む。
 * 開発環境では編集を反映するため、毎回読み直す。
 */
async function loadLinkCards(): Promise<Map<string, LinkCardEntry>> {
  const isDev = process.env["NODE_ENV"] === "development";
  if (cachedEntries && !isDev) {
    return cachedEntries;
  }

  const { fs, path, root } = await resolveContentDeps();
  const raw = await fs.readFile(path.join(root, "link-cards.json"), "utf-8");
  cachedEntries = new Map(
    Object.entries(LinkCardSourceSchema.parse(JSON.parse(raw)))
  );
  return cachedEntries;
}

/**
 * URL に対応するリンクカードのデータを返す。
 * 未登録の URL は undefined。
 */
export async function getLinkCard(
  url: string
): Promise<LinkCardEntry | undefined> {
  const entries = await loadLinkCards();
  return entries.get(url);
}
