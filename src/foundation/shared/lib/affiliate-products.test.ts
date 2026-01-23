import { describe, it, expect, vi } from "vitest";

// Mock the content-root module (transitive dependency)
vi.mock("@/shared/lib/content-root", () => ({
  resolveContentRoot: () => Promise.resolve("/mock/content"),
}));

import { AffiliateProductSchema } from "./affiliate-products";

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
