import { describe, expect, it } from "vitest";
import { getAvailableLanguages, hasEnglishVersion } from "@/libs/contents/file-loader";

describe("file-loader", () => {
  describe("getAvailableLanguages", () => {
    it("should return available languages for a blog post", async () => {
      // 実際のブログポストのパスを使用する必要があります
      // このテストは実際のコンテンツが存在する場合にのみ機能します
      const languages = await getAvailableLanguages("blog", "2024-09-29-build-blog");
      expect(Array.isArray(languages)).toBe(true);
      expect(languages).toContain("ja");
    });

    it("should return empty array for non-existent content", async () => {
      const languages = await getAvailableLanguages("blog", "non-existent-post");
      expect(languages).toEqual([]);
    });
  });

  describe("hasEnglishVersion", () => {
    it("should return false for content without English version", async () => {
      const hasEn = await hasEnglishVersion("blog", "non-existent-post");
      expect(hasEn).toBe(false);
    });
  });
});
