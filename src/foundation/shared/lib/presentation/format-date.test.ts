import { describe, it, expect } from "vite-plus/test";
import {
  formatDate,
  formatDatePlain,
  formatMonthDay,
  yearOf,
} from "./format-date";

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
        })
      );
    });

    it("en ロケールで英語形式にフォーマットする", () => {
      expect(formatDate("2024-01-15", "en-US")).toBe(
        new Date("2024-01-15").toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    });
  });
});

describe("formatDatePlain", () => {
  it("オプション無しでロケール既定の形式にフォーマットする", () => {
    const date = new Date("2024-01-15");
    expect(formatDatePlain(date, "ja-JP")).toBe(
      date.toLocaleDateString("ja-JP")
    );
    expect(formatDatePlain(date, "en-US")).toBe(
      date.toLocaleDateString("en-US")
    );
  });
});

describe("formatMonthDay", () => {
  it("ja ロケールで月日だけを返す", () => {
    expect(formatMonthDay("2026-05-28", "ja-JP")).toBe("5月28日");
  });

  it("en ロケールで月日だけを返す", () => {
    expect(formatMonthDay("2026-05-28", "en-US")).toBe("May 28");
  });

  it("月初でもタイムゾーンによって前日にずれない", () => {
    expect(formatMonthDay("2026-03-01", "en-US")).toBe("Mar 1");
  });

  it("解釈できない文字列はそのまま返す", () => {
    expect(formatMonthDay("someday", "ja-JP")).toBe("someday");
  });
});

describe("yearOf", () => {
  it("年を 4 桁の文字列で返す", () => {
    expect(yearOf("2026-01-01")).toBe("2026");
  });

  it("解釈できない文字列は空文字を返す", () => {
    expect(yearOf("")).toBe("");
  });
});
