import { describe, it, expect, assert } from "vite-plus/test";
import { resolveThumbnail } from "./thumbnail";

describe("resolveThumbnail", () => {
  const slug = "test-article";

  describe("サムネイル未指定の場合", () => {
    it("デフォルトのフォールバック画像を返す", () => {
      const result = resolveThumbnail(slug);
      expect(result).toStrictEqual({
        type: "image",
        src: "/icon.svg",
        isFallback: true,
      });
    });

    it("undefined を渡した場合もフォールバック画像を返す", () => {
      const result = resolveThumbnail(slug);
      expect(result).toStrictEqual({
        type: "image",
        src: "/icon.svg",
        isFallback: true,
      });
    });
  });

  describe("アイコンプレフィックスの処理", () => {
    it("icon: プレフィックスでアイコンタイプを返す", () => {
      const result = resolveThumbnail(slug, "icon:lucide:star");
      expect(result).toStrictEqual({
        type: "icon",
        icon: "lucide:star",
      });
    });

    it("iconify: プレフィックスでアイコンタイプを返す", () => {
      const result = resolveThumbnail(slug, "iconify:mdi:home");
      expect(result).toStrictEqual({
        type: "icon",
        icon: "mdi:home",
      });
    });

    it("アイコン名が空の場合はデフォルトアイコンを返す", () => {
      const result = resolveThumbnail(slug, "icon:");
      expect(result).toStrictEqual({
        type: "icon",
        icon: "lucide:image",
      });
    });

    it("プレフィックス前後の空白を処理する", () => {
      const result = resolveThumbnail(slug, "  icon:lucide:check  ");
      expect(result).toStrictEqual({
        type: "icon",
        icon: "lucide:check",
      });
    });
  });

  describe("相対パスの解決", () => {
    it("相対パスをスラッグベースのパスに解決する", () => {
      const result = resolveThumbnail(slug, "thumbnail.png");
      expect(result).toStrictEqual({
        type: "image",
        src: "/contents/blog/test-article/thumbnail.webp",
        isFallback: false,
      });
    });

    it("カスタムベースパスを使用できる", () => {
      const result = resolveThumbnail(slug, "cover.jpg", { basePath: "/custom/path" });
      expect(result).toStrictEqual({
        type: "image",
        src: "/custom/path/cover.webp",
        isFallback: false,
      });
    });
  });

  describe("絶対パス・外部URLの処理", () => {
    it("絶対パスはそのまま使用する", () => {
      const result = resolveThumbnail(slug, "/images/hero.png");
      expect(result).toStrictEqual({
        type: "image",
        src: "/images/hero.webp",
        isFallback: false,
      });
    });

    it("http:// URLはそのまま使用する", () => {
      const result = resolveThumbnail(slug, "http://example.com/image.png");
      expect(result).toStrictEqual({
        type: "image",
        src: "http://example.com/image.webp",
        isFallback: false,
      });
    });

    it("https:// URLはそのまま使用する", () => {
      const result = resolveThumbnail(slug, "https://example.com/image.jpg");
      expect(result).toStrictEqual({
        type: "image",
        src: "https://example.com/image.webp",
        isFallback: false,
      });
    });
  });

  describe("画像拡張子のWebP変換", () => {
    it("png を webp に変換する", () => {
      const result = resolveThumbnail(slug, "image.png");
      assert(result.type === "image");
      expect(result.src).toContain(".webp");
    });

    it("jpg を webp に変換する", () => {
      const result = resolveThumbnail(slug, "image.jpg");
      assert(result.type === "image");
      expect(result.src).toContain(".webp");
    });

    it("jpeg を webp に変換する", () => {
      const result = resolveThumbnail(slug, "image.jpeg");
      assert(result.type === "image");
      expect(result.src).toContain(".webp");
    });

    it("webp はそのまま維持する", () => {
      const result = resolveThumbnail(slug, "image.webp");
      assert(result.type === "image");
      expect(result.src).toContain(".webp");
    });

    it("svg は変換しない", () => {
      const result = resolveThumbnail(slug, "icon.svg");
      assert(result.type === "image");
      expect(result.src).toContain(".svg");
    });
  });
});
