import { z } from "zod";

import { resolveContentRoot } from "@/shared/lib/content-file";

/** 本文だけで使う、画像を必要としないアフィリエイトリンク。 */
const AffiliateLinkSchema = z.object({
  /** ユニークID */
  id: z.string().min(1),
  /** 商品名/タイトル */
  title: z.string().min(1),
  /** 商品詳細ページ（Amazon等）のURL */
  productUrl: z.url(),
});

/**
 * アフィリエイト商品情報の Zod スキーマ
 */
export const AffiliateProductSchema = AffiliateLinkSchema.extend({
  /** 商品画像のURL */
  imageUrl: z.url(),
  /** Yahoo!ショッピング用のURL（オプション） */
  yahooShoppingUrl: z.url().optional(),
  /** 関連するタグのリスト */
  tags: z
    .union([z.array(z.string()), z.string()])
    .transform((value) => (typeof value === "string" ? [value] : value))
    .optional(),
});

/**
 * アフィリエイト商品情報の型定義
 */
export type AffiliateProduct = z.infer<typeof AffiliateProductSchema>;

/**
 * ソースファイル（JSON）の構造の Zod スキーマ
 */
const AffiliateProductSourceSchema = z
  .object({
    products: z.array(AffiliateProductSchema).default([]),
    links: z.array(AffiliateLinkSchema).default([]),
  })
  .superRefine((source, context) => {
    const ids = new Set<string>();
    for (const collection of ["products", "links"] as const) {
      for (const [index, { id }] of source[collection].entries()) {
        if (ids.has(id)) {
          context.addIssue({
            code: "custom",
            message: `アフィリエイトリンクの ID が重複しています: ${id}`,
            path: [collection, index, "id"],
          });
        }
        ids.add(id);
      }
    }
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
  /** 本文用リンクと商品カードで共用する ID → URL マップ */
  urlById: Map<string, string>;
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
  const { default: path } = await import("node:path");
  const fs = await import("node:fs/promises");

  const root = await resolveContentRoot();
  const filePath = path.join(root, "affiliate-products.json");
  const isDev = process.env.NODE_ENV === "development";

  if (cachedIndex && !isDev) {
    return cachedIndex;
  }

  const mtimeMs = isDev ? (await fs.stat(filePath)).mtimeMs : undefined;
  if (cachedIndex && isDev && cachedIndex.mtimeMs === mtimeMs) {
    return cachedIndex;
  }

  // 定義の破損や ID の重複は、リンク切れを公開する前にエラーにする。
  const raw = await fs.readFile(filePath, "utf-8");
  const { products, links } = AffiliateProductSourceSchema.parse(
    JSON.parse(raw)
  );
  const byId = new Map<string, AffiliateProduct>();
  const byTag = new Map<string, AffiliateProduct[]>();
  const urlById = new Map<string, string>();
  for (const link of [...products, ...links]) {
    urlById.set(link.id, link.productUrl);
  }
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

  const index: AffiliateProductIndex = { products, byId, byTag, urlById };
  if (typeof mtimeMs === "number") {
    index.mtimeMs = mtimeMs;
  }
  cachedIndex = index;
  return index;
}

/**
 * 商品カードと本文用リンクの ID → productUrl のマップを返す
 * @returns ID をキー、productUrl を値とした Map
 */
export async function getAffiliateProductUrlById(): Promise<
  Map<string, string>
> {
  const index = await loadAffiliateProducts();
  return new Map(index.urlById);
}

/**
 * 指定された ID リストに合致する商品を一括取得する
 * @param ids 商品 ID の配列
 * @returns 商品データの配列。存在しない ID は除外される
 */
export async function getAffiliateProductsByIds(
  ids: string[]
): Promise<AffiliateProduct[]> {
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
  options?: AffiliateProductTagOptions
): Promise<AffiliateProduct[]> {
  if (tags.length === 0) {
    return [];
  }

  const index = await loadAffiliateProducts();
  const normalizedTags = new Set(tags.map((tag) => tag.trim()).filter(Boolean));
  const excluded = new Set(options?.excludeIds);
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
