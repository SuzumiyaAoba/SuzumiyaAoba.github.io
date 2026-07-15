import { describe, it, expect } from "vitest";
import { formatDate } from "./format-date";

describe("formatDate", () => {
  describe("空の日付", () => {
    it("ja ロケールで「不明な日付」を返す", () => {
      expect(formatDate("", "ja-JP")).toBe("不明な日付");
    });

    it("en ロケールで「Unknown date」を返す", () => {
      expect(formatDate("", "en-US")).toBe("Unknown date");
    });
  });

  describe("不正な日付", () => {
    it("パース不能な文字列はそのまま返す", () => {
      expect(formatDate("not-a-date", "ja-JP")).toBe("not-a-date");
    });
  });

  describe("正常な日付", () => {
    it("ja ロケールで日本語形式にフォーマットする", () => {
      expect(formatDate("2024-01-15", "ja-JP")).toBe(
        new Date("2024-01-15").toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );
    });

    it("en ロケールで英語形式にフォーマットする", () => {
      expect(formatDate("2024-01-15", "en-US")).toBe(
        new Date("2024-01-15").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      );
    });
  });
});
