import { describe, it, expect } from "vitest";
import { resolveThumbnail, type ResolvedThumbnail } from "./thumbnail";

describe("resolveThumbnail", () => {
  const slug = "test-article";

  describe("サムネイル未指定の場合", () => {
    it("デフォルトのフォールバック画像を返す", () => {
      const result = resolveThumbnail(slug);
      expect(result).toEqual({
        type: "image",
        src: "/icon.svg",
        isFallback: true,
      });
    });

    it("undefined を渡した場合もフォールバック画像を返す", () => {
      const result = resolveThumbnail(slug, undefined);
      expect(result).toEqual({
        type: "image",
        src: "/icon.svg",
        isFallback: true,
      });
    });
  });

  describe("アイコンプレフィックスの処理", () => {
    it("icon: プレフィックスでアイコンタイプを返す", () => {
      const result = resolveThumbnail(slug, "icon:lucide:star");
      expect(result).toEqual({
        type: "icon",
        icon: "lucide:star",
      });
    });

    it("iconify: プレフィックスでアイコンタイプを返す", () => {
      const result = resolveThumbnail(slug, "iconify:mdi:home");
      expect(result).toEqual({
        type: "icon",
        icon: "mdi:home",
      });
    });

    it("アイコン名が空の場合はデフォルトアイコンを返す", () => {
      const result = resolveThumbnail(slug, "icon:");
      expect(result).toEqual({
        type: "icon",
        icon: "lucide:image",
      });
    });

    it("プレフィックス前後の空白を処理する", () => {
      const result = resolveThumbnail(slug, "  icon:lucide:check  ");
      expect(result).toEqual({
        type: "icon",
        icon: "lucide:check",
      });
    });
  });

  describe("相対パスの解決", () => {
    it("相対パスをスラッグベースのパスに解決する", () => {
      const result = resolveThumbnail(slug, "thumbnail.png");
      expect(result).toEqual({
        type: "image",
        src: "/contents/blog/test-article/thumbnail.webp",
        isFallback: false,
      });
    });

    it("カスタムベースパスを使用できる", () => {
      const result = resolveThumbnail(slug, "cover.jpg", { basePath: "/custom/path" });
      expect(result).toEqual({
        type: "image",
        src: "/custom/path/cover.webp",
        isFallback: false,
      });
    });
  });

  describe("絶対パス・外部URLの処理", () => {
    it("絶対パスはそのまま使用する", () => {
      const result = resolveThumbnail(slug, "/images/hero.png");
      expect(result).toEqual({
        type: "image",
        src: "/images/hero.webp",
        isFallback: false,
      });
    });

    it("http:// URLはそのまま使用する", () => {
      const result = resolveThumbnail(slug, "http://example.com/image.png");
      expect(result).toEqual({
        type: "image",
        src: "http://example.com/image.webp",
        isFallback: false,
      });
    });

    it("https:// URLはそのまま使用する", () => {
      const result = resolveThumbnail(slug, "https://example.com/image.jpg");
      expect(result).toEqual({
        type: "image",
        src: "https://example.com/image.webp",
        isFallback: false,
      });
    });
  });

  describe("画像拡張子のWebP変換", () => {
    it("png を webp に変換する", () => {
      const result = resolveThumbnail(slug, "image.png");
      expect(result.type).toBe("image");
      expect((result as Extract<ResolvedThumbnail, { type: "image" }>).src).toContain(".webp");
    });

    it("jpg を webp に変換する", () => {
      const result = resolveThumbnail(slug, "image.jpg");
      expect(result.type).toBe("image");
      expect((result as Extract<ResolvedThumbnail, { type: "image" }>).src).toContain(".webp");
    });

    it("jpeg を webp に変換する", () => {
      const result = resolveThumbnail(slug, "image.jpeg");
      expect(result.type).toBe("image");
      expect((result as Extract<ResolvedThumbnail, { type: "image" }>).src).toContain(".webp");
    });

    it("webp はそのまま維持する", () => {
      const result = resolveThumbnail(slug, "image.webp");
      expect(result.type).toBe("image");
      expect((result as Extract<ResolvedThumbnail, { type: "image" }>).src).toContain(".webp");
    });

    it("svg は変換しない", () => {
      const result = resolveThumbnail(slug, "icon.svg");
      expect(result.type).toBe("image");
      expect((result as Extract<ResolvedThumbnail, { type: "image" }>).src).toContain(".svg");
    });
  });
});
