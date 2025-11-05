import { describe, expect, it } from "vitest";
import {
  encodeSeriesName,
  decodeSeriesName,
  generateSlugFromSeriesName,
} from "@/libs/contents/series-utils";

describe("series-utils", () => {
  describe("encodeSeriesName and decodeSeriesName", () => {
    it("should encode and decode Japanese series names", () => {
      const testCases = [
        "Scala Cats 型クラス",
        "ローカル AI エージェントは電気羊の夢を見るのか",
        "読書メモ",
      ];

      for (const seriesName of testCases) {
        const encoded = encodeSeriesName(seriesName);
        const decoded = decodeSeriesName(encoded);
        expect(decoded).toBe(seriesName);
      }
    });

    it("should produce URL-safe strings", () => {
      const seriesName = "Scala Cats 型クラス";
      const encoded = encodeSeriesName(seriesName);

      // URL-safe characters only
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("generateSlugFromSeriesName", () => {
    it("should convert English series names to kebab-case", () => {
      expect(generateSlugFromSeriesName("Reading Notes")).toBe("reading-notes");
      expect(generateSlugFromSeriesName("My Programming Journey")).toBe(
        "my-programming-journey"
      );
      expect(generateSlugFromSeriesName("Web Development 101")).toBe(
        "web-development-101"
      );
    });

    it("should use base64url encoding for Japanese series names", () => {
      const seriesName = "Scala Cats 型クラス";
      const slug = generateSlugFromSeriesName(seriesName);

      // Should be base64url encoded (no spaces, only alphanumeric and - _)
      expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);

      // Should be decodable
      const decoded = decodeSeriesName(slug);
      expect(decoded).toBe(seriesName);
    });

    it("should handle mixed alphanumeric with special characters", () => {
      expect(generateSlugFromSeriesName("Next.js Tutorial")).toBe("nextjs-tutorial");
      expect(generateSlugFromSeriesName("TypeScript 101")).toBe("typescript-101");
    });
  });
});
