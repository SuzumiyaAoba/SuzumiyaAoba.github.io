import { describe, it, expect } from "vitest";
import { toLocalePath, type Locale } from "./locale-path";

describe("toLocalePath", () => {
  describe("日本語ロケール (ja)", () => {
    const locale: Locale = "ja";

    it("通常のパスをそのまま返す", () => {
      expect(toLocalePath("/blog", locale)).toBe("/blog");
      expect(toLocalePath("/about", locale)).toBe("/about");
      expect(toLocalePath("/tags/programming", locale)).toBe("/tags/programming");
    });

    it("ルートパスをそのまま返す", () => {
      expect(toLocalePath("/", locale)).toBe("/");
    });

    it("/en パスからプレフィックスを削除する", () => {
      expect(toLocalePath("/en", locale)).toBe("/");
      expect(toLocalePath("/en/blog", locale)).toBe("/blog");
      expect(toLocalePath("/en/about", locale)).toBe("/about");
    });

    it("/contents パスはそのまま返す", () => {
      expect(toLocalePath("/contents/blog/test", locale)).toBe("/contents/blog/test");
      expect(toLocalePath("/contents/images/photo.jpg", locale)).toBe("/contents/images/photo.jpg");
    });

    it("相対パスはそのまま返す", () => {
      expect(toLocalePath("blog", locale)).toBe("blog");
      expect(toLocalePath("./page", locale)).toBe("./page");
    });
  });

  describe("英語ロケール (en)", () => {
    const locale: Locale = "en";

    it("通常のパスに /en プレフィックスを追加する", () => {
      expect(toLocalePath("/blog", locale)).toBe("/en/blog");
      expect(toLocalePath("/about", locale)).toBe("/en/about");
      expect(toLocalePath("/tags/programming", locale)).toBe("/en/tags/programming");
    });

    it("ルートパスを /en に変換する", () => {
      expect(toLocalePath("/", locale)).toBe("/en");
    });

    it("既に /en で始まるパスはそのまま返す", () => {
      expect(toLocalePath("/en", locale)).toBe("/en");
      expect(toLocalePath("/en/blog", locale)).toBe("/en/blog");
      expect(toLocalePath("/en/about", locale)).toBe("/en/about");
    });

    it("/contents パスはそのまま返す", () => {
      expect(toLocalePath("/contents/blog/test", locale)).toBe("/contents/blog/test");
    });

    it("相対パスはそのまま返す", () => {
      expect(toLocalePath("blog", locale)).toBe("blog");
      expect(toLocalePath("./page", locale)).toBe("./page");
    });
  });
});
