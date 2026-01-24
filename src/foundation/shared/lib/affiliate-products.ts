import { z } from "zod";

import { resolveContentRoot } from "@/shared/lib/content-root";

/**
 * アフィリエイト商品情報の Zod スキーマ
 */
export const AffiliateProductSchema = z.object({
  /** ユニークID */
  id: z.string().min(1),
  /** 商品名/タイトル */
  title: z.string().min(1),
  /** 商品画像のURL */
  imageUrl: z.string().url(),
  /** 商品詳細ページ（Amazon等）のURL */
  productUrl: z.string().url(),
  /** Yahoo!ショッピング用のURL（オプション） */
  yahooShoppingUrl: z.string().url().optional(),
  /** 関連するタグのリスト */
  tags: z.array(z.string()).optional(),
});

/**
 * アフィリエイト商品情報の型定義
 */
export type AffiliateProduct = z.infer<typeof AffiliateProductSchema>;

/**
 * ソースファイル（JSON）の構造の Zod スキーマ
 */
const AffiliateProductSourceSchema = z.object({
  products: z.array(AffiliateProductSchema).optional(),
});

/**
 * 読み込まれた商品データのインデックス情報
 */
type AffiliateProductIndex = {
  products: AffiliateProduct[];
  /** ID をキーとした商品マップ */
  byId: Map<string, AffiliateProduct>;
  /** タグをキーとした商品配列マップ */
  byTag: Map<string, AffiliateProduct[]>;
  /** ファイルの最終更新日時(ms) */
  mtimeMs?: number;
};

/**
 * 商品データのキャッシュ
 */
let cachedIndex: AffiliateProductIndex | null = null;

/**
 * アフィリエイト商品データをファイルから読み込み、インデックスを作成する
 * 開発環境では変更を検知してリロードする
 * @returns 商品データのインデックス情報
 */
async function loadAffiliateProducts(): Promise<AffiliateProductIndex> {
  const path = await import("node:path");
  const fs = await import("node:fs/promises");

  const root = await resolveContentRoot();
  const filePath = path.join(root, "affiliate-products.json");
  const isDev = process.env["NODE_ENV"] === "development";

  if (cachedIndex && !isDev) {
    return cachedIndex;
  }

  try {
    let mtimeMs: number | undefined = undefined;
    if (isDev) {
      try {
        const stat = await fs.stat(filePath);
        mtimeMs = stat.mtimeMs;
        if (cachedIndex && cachedIndex.mtimeMs === mtimeMs) {
          return cachedIndex;
        }
      } catch {
        // fall through to read/parse
      }
    }

    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    const parsed = AffiliateProductSourceSchema.safeParse(data);

    if (!parsed.success || !parsed.data.products) {
      const emptyIndex: AffiliateProductIndex = {
        products: [],
        byId: new Map(),
        byTag: new Map(),
      };
      if (typeof mtimeMs === "number") {
        emptyIndex.mtimeMs = mtimeMs;
      }
      cachedIndex = emptyIndex;
      return emptyIndex;
    }

    const products = parsed.data.products;
    const byId = new Map<string, AffiliateProduct>();
    const byTag = new Map<string, AffiliateProduct[]>();
    for (const product of products) {
      byId.set(product.id, product);
      const tags = product.tags ?? [];
      for (const tag of tags) {
        const key = tag.trim();
        if (!key) {
          continue;
        }
        const existing = byTag.get(key);
        if (existing) {
          existing.push(product);
        } else {
          byTag.set(key, [product]);
        }
      }
    }

    const index: AffiliateProductIndex = { products, byId, byTag };
    if (typeof mtimeMs === "number") {
      index.mtimeMs = mtimeMs;
    }
    cachedIndex = index;
    return index;
  } catch {
    const emptyIndex: AffiliateProductIndex = {
      products: [],
      byId: new Map(),
      byTag: new Map(),
    };
    cachedIndex = emptyIndex;
    return emptyIndex;
  }
}

/**
 * 指定された ID リストに合致する商品を一括取得する
 * @param ids 商品 ID の配列
 * @returns 商品データの配列。存在しない ID は除外される
 */
export async function getAffiliateProductsByIds(ids: string[]): Promise<AffiliateProduct[]> {
  const index = await loadAffiliateProducts();
  return ids
    .map((id) => index.byId.get(id))
    .filter((item): item is AffiliateProduct => Boolean(item));
}

/**
 * タグ検索時のオプション
 */
type AffiliateProductTagOptions = {
  /** 結果から除外する ID のリスト（現在表示中の商品など） */
  excludeIds?: string[];
  /** 最大取得件数 */
  limit?: number;
};

/**
 * いずれかのタグに合致する商品を一括取得する
 * 重複して合致した商品はユニーク化される
 * @param tags タグ名の配列
 * @param options 除外設定や件数制限
 * @returns 商品データの配列
 */
export async function getAffiliateProductsByTags(
  tags: string[],
  options?: AffiliateProductTagOptions,
): Promise<AffiliateProduct[]> {
  if (tags.length === 0) {
    return [];
  }

  const index = await loadAffiliateProducts();
  const normalizedTags = new Set(tags.map((tag) => tag.trim()).filter(Boolean));
  const excluded = new Set(options?.excludeIds ?? []);
  const matches: AffiliateProduct[] = [];
  const seen = new Set<string>();
  for (const tag of normalizedTags) {
    const tagged = index.byTag.get(tag);
    if (!tagged) {
      continue;
    }
    for (const product of tagged) {
      if (excluded.has(product.id) || seen.has(product.id)) {
        continue;
      }
      seen.add(product.id);
      matches.push(product);
    }
  }

  const limit = options?.limit;
  if (typeof limit === "number") {
    return matches.slice(0, Math.max(0, limit));
  }

  return matches;
}
