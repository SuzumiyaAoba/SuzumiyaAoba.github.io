import { afterEach, beforeEach, describe, it, expect, vi } from "vite-plus/test";

const files = vi.hoisted(() => ({ readFile: vi.fn(), stat: vi.fn() }));
vi.mock("node:fs/promises", () => files);

// Mock the content-root module (transitive dependency)
vi.mock("@/shared/lib/content-file", () => ({
  resolveContentRoot: () => Promise.resolve("/mock/content"),
}));

import { AffiliateProductSchema } from "./affiliate-products";

afterEach(() => vi.unstubAllEnvs());

describe("アフィリエイトリンクの読み込み", () => {
  const product = {
    id: "card",
    title: "商品カード",
    imageUrl: "https://example.com/image.jpg",
    productUrl: "https://example.com/card",
    tags: ["book"],
  };
  const link = {
    id: "text",
    title: "本文用リンク",
    productUrl: "https://example.com/text",
  };

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    files.stat.mockReset().mockResolvedValue({ mtimeMs: 1 });
    files.readFile
      .mockReset()
      .mockResolvedValue(JSON.stringify({ products: [product], links: [link] }));
  });

  it("商品と画像のないリンクを本文で参照でき、商品カードには商品のみ返す", async () => {
    const { getAffiliateProductUrlById, getAffiliateProductsByIds, getAffiliateProductsByTags } =
      await import("./affiliate-products");

    expect(await getAffiliateProductUrlById()).toEqual(
      new Map([
        [product.id, product.productUrl],
        [link.id, link.productUrl],
      ]),
    );
    expect(await getAffiliateProductsByIds([product.id, link.id])).toEqual([product]);
    expect(await getAffiliateProductsByTags(["book"])).toEqual([product]);
  });

  it("本文用リンクだけの定義も読み込める", async () => {
    files.readFile.mockResolvedValue(JSON.stringify({ links: [link] }));
    const { getAffiliateProductUrlById } = await import("./affiliate-products");
    expect(await getAffiliateProductUrlById()).toEqual(new Map([[link.id, link.productUrl]]));
  });

  it.each([
    { products: [product, product] },
    { links: [link, link] },
    { products: [product], links: [{ ...link, id: product.id }] },
  ])("重複する ID を拒否する: %j", async (source) => {
    files.readFile.mockResolvedValue(JSON.stringify(source));
    const { getAffiliateProductUrlById } = await import("./affiliate-products");
    await expect(getAffiliateProductUrlById()).rejects.toThrow("ID が重複しています");
  });

  it("不正な URL を含む定義を黙って空のデータにしない", async () => {
    files.readFile.mockResolvedValue(
      JSON.stringify({ links: [{ ...link, productUrl: "invalid-url" }] }),
    );
    const { getAffiliateProductUrlById } = await import("./affiliate-products");
    await expect(getAffiliateProductUrlById()).rejects.toThrow();
  });

  it("開発時に管理ファイルを更新すると商品カードと本文用 URL を再読み込みする", async () => {
    const { getAffiliateProductUrlById, getAffiliateProductsByIds } =
      await import("./affiliate-products");
    await getAffiliateProductUrlById();

    const updatedProduct = { ...product, productUrl: "https://example.com/new-card" };
    files.stat.mockResolvedValue({ mtimeMs: 2 });
    files.readFile.mockResolvedValue(
      JSON.stringify({
        products: [updatedProduct],
        links: [{ ...link, productUrl: "https://example.com/new-text" }],
      }),
    );

    expect(await getAffiliateProductUrlById()).toEqual(
      new Map([
        [product.id, updatedProduct.productUrl],
        [link.id, "https://example.com/new-text"],
      ]),
    );
    expect(await getAffiliateProductsByIds([product.id])).toEqual([updatedProduct]);
  });
});

describe("AffiliateProductSchema", () => {
  describe("有効なデータのパース", () => {
    it("必須フィールドのみでパースできる", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
      };

      const result = AffiliateProductSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("product-1");
        expect(result.data.title).toBe("テスト商品");
        expect(result.data.tags).toBeUndefined();
        expect(result.data.yahooShoppingUrl).toBeUndefined();
      }
    });

    it("すべてのフィールドでパースできる", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
        yahooShoppingUrl: "https://shopping.yahoo.co.jp/product",
        tags: ["programming", "book"],
      };

      const result = AffiliateProductSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yahooShoppingUrl).toBe("https://shopping.yahoo.co.jp/product");
        expect(result.data.tags).toEqual(["programming", "book"]);
      }
    });
  });

  describe("必須フィールドの検証", () => {
    it("id が空の場合は失敗する", () => {
      const data = {
        id: "",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("title が空の場合は失敗する", () => {
      const data = {
        id: "product-1",
        title: "",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("id がない場合は失敗する", () => {
      const data = {
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("URL形式の検証", () => {
    it("imageUrl が無効なURLの場合は失敗する", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "not-a-url",
        productUrl: "https://example.com/product",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("productUrl が無効なURLの場合は失敗する", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "invalid-url",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("yahooShoppingUrl が無効なURLの場合は失敗する", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
        yahooShoppingUrl: "not-valid",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("tags フィールド", () => {
    it("文字列の tags を 1 要素の配列として扱う", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
        tags: "programming",
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(["programming"]);
      }
    });

    it("空の配列を許可する", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
        tags: [],
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    it("複数のタグを許可する", () => {
      const data = {
        id: "product-1",
        title: "テスト商品",
        imageUrl: "https://example.com/image.jpg",
        productUrl: "https://example.com/product",
        tags: ["tag1", "tag2", "tag3"],
      };

      const result = AffiliateProductSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toHaveLength(3);
      }
    });
  });
});
