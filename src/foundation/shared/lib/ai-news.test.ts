import { describe, it, expect, vi } from "vitest";

// Mock the content-root module (transitive dependency)
vi.mock("@/shared/lib/content-root", () => ({
  resolveContentRoot: () => Promise.resolve("/mock/content"),
}));

import { AiNewsEntrySchema } from "./ai-news";

describe("AiNewsEntrySchema", () => {
  describe("有効なデータのパース", () => {
    it("必須フィールドのみでパースできる", () => {
      const data = {
        year: 2024,
        title_ja: "GPT-4 リリース",
        summary_ja: "OpenAIがGPT-4をリリースしました。",
      };

      const result = AiNewsEntrySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2024);
        expect(result.data.title_ja).toBe("GPT-4 リリース");
        expect(result.data.summary_ja).toBe("OpenAIがGPT-4をリリースしました。");
        expect(result.data.date).toBeUndefined();
        expect(result.data.title_en).toBeUndefined();
        expect(result.data.summary_en).toBeUndefined();
        expect(result.data.tags).toBeUndefined();
      }
    });

    it("すべてのフィールドでパースできる", () => {
      const data = {
        year: 2024,
        date: "2024-03-14",
        title_ja: "GPT-4 リリース",
        title_en: "GPT-4 Release",
        summary_ja: "OpenAIがGPT-4をリリースしました。",
        summary_en: "OpenAI released GPT-4.",
        tags: ["openai", "gpt", "llm"],
      };

      const result = AiNewsEntrySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe("2024-03-14");
        expect(result.data.title_en).toBe("GPT-4 Release");
        expect(result.data.summary_en).toBe("OpenAI released GPT-4.");
        expect(result.data.tags).toEqual(["openai", "gpt", "llm"]);
      }
    });
  });

  describe("年の変換処理", () => {
    it("文字列の年を数値に変換する", () => {
      const data = {
        year: "2024",
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2024);
        expect(typeof result.data.year).toBe("number");
      }
    });

    it("数値の年をそのまま保持する", () => {
      const data = {
        year: 2023,
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.year).toBe(2023);
      }
    });
  });

  describe("必須フィールドの検証", () => {
    it("year がない場合は失敗する", () => {
      const data = {
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("title_ja がない場合は失敗する", () => {
      const data = {
        year: 2024,
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("summary_ja がない場合は失敗する", () => {
      const data = {
        year: 2024,
        title_ja: "テストイベント",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("title_ja が空の場合は失敗する", () => {
      const data = {
        year: 2024,
        title_ja: "",
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("summary_ja が空の場合は失敗する", () => {
      const data = {
        year: 2024,
        title_ja: "テストイベント",
        summary_ja: "",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("tags フィールド", () => {
    it("空の配列を許可する", () => {
      const data = {
        year: 2024,
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
        tags: [],
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    it("複数のタグを許可する", () => {
      const data = {
        year: 2024,
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
        tags: ["ai", "machine-learning", "deep-learning"],
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toHaveLength(3);
      }
    });
  });

  describe("date フィールド", () => {
    it("日付文字列を許可する", () => {
      const data = {
        year: 2024,
        date: "2024-01-15",
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe("2024-01-15");
      }
    });

    it("任意形式の日付文字列を許可する", () => {
      const data = {
        year: 2024,
        date: "January 2024",
        title_ja: "テストイベント",
        summary_ja: "テスト要約",
      };

      const result = AiNewsEntrySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBe("January 2024");
      }
    });
  });
});
