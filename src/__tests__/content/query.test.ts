import { describe, expect, it } from "vitest";
import { getPaths } from "@/libs/contents/query";

describe("query", () => {
  describe("getPaths", () => {
    it("should return paths for blog content", async () => {
      const paths = await getPaths("blog");

      expect(Array.isArray(paths)).toBe(true);
      // 少なくとも1つのブログポストが存在することを確認
      expect(paths.length).toBeGreaterThan(0);
    });

    it("should exclude language-specific files", async () => {
      const paths = await getPaths("blog");

      // パスに .en や .ja のような言語コードが含まれていないことを確認
      for (const filePath of paths) {
        expect(filePath).not.toMatch(/\.en$/);
        expect(filePath).not.toMatch(/\.ja$/);
      }
    });

    it("should return empty array for non-existent content type", async () => {
      const paths = await getPaths("non-existent-type");

      expect(paths).toEqual([]);
    });
  });
});
