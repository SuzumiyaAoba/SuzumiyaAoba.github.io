/* eslint-disable @next/next/no-img-element -- MDX の img 出力と基準パスを検証するためのモック。 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MdxImgProps } from "@/shared/ui/mdx/img";

import { renderMdx, renderMdxWithToc } from "./render-mdx";
import { getAffiliateProductUrlById } from "@/shared/lib/affiliate-products";

vi.mock(import("@/shared/lib/mdx/components"), () => ({ mdxComponents: {} }));
vi.mock(import("@/shared/lib/affiliate-products"), () => ({
  getAffiliateProductUrlById: vi.fn<typeof getAffiliateProductUrlById>(),
}));
vi.mock(import("@/shared/ui/mdx/img"), () => ({
  Img: ({ src, alt, basePath }: MdxImgProps) => (
    <img src={basePath && typeof src === "string" ? `${basePath}/${src}` : src} alt={alt ?? ""} />
  ),
}));

beforeEach(() => {
  vi.mocked(getAffiliateProductUrlById).mockResolvedValue(
    new Map([["book", "https://example.com/book"]]),
  );
});
afterEach(() => vi.unstubAllEnvs());

describe("MDX rendering", () => {
  it("本文と目次付き本文で同じHTMLを生成する", async () => {
    const source = "## Hello\n\nA **bold** paragraph.\n\n### Details";
    const plain = await renderMdx(source);
    const withToc = await renderMdxWithToc(source);
    expect(renderToStaticMarkup(withToc.content)).toBe(renderToStaticMarkup(plain));
    expect(withToc.headings).toStrictEqual([
      { id: "hello", text: "Hello", level: 2 },
      { id: "details", text: "Details", level: 3 },
    ]);
  });

  it("目次・見出し・自己リンクに同じIDプレフィックスを付ける", async () => {
    const { content, headings } = await renderMdxWithToc("## Intro\n\n## Intro", {
      idPrefix: "chapter-",
    });
    const html = renderToStaticMarkup(content);
    expect(headings.map((heading) => heading.id)).toStrictEqual([
      "chapter-intro",
      "chapter-intro-1",
    ]);
    for (const { id } of headings) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`href="#${id}"`);
    }
  });

  it("画像だけの段落を展開し、画像の基準パスとリンク変換を維持する", async () => {
    const content = await renderMdx("![Photo](photo.png)\n\n[Book](affiliate://book)", {
      basePath: "/contents/blog/example",
    });
    const html = renderToStaticMarkup(content);
    expect(html).toContain('src="/contents/blog/example/photo.png"');
    expect(html).not.toContain("<p><img");
    expect(html).toContain('href="https://example.com/book"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("開発時に同じ本文へ渡した別の追加コンポーネントがキャッシュに隠れない", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const source = "<Greeting />";
    const first = await renderMdx(source, {
      extraComponents: { Greeting: () => <span>First</span> },
    });
    const second = await renderMdx(source, {
      extraComponents: { Greeting: () => <span>Second</span> },
    });
    expect(renderToStaticMarkup(first)).toBe("<span>First</span>");
    expect(renderToStaticMarkup(second)).toBe("<span>Second</span>");
  });

  it("日本語・空白を含む商品 ID と参照形式のリンクを解決する", async () => {
    vi.mocked(getAffiliateProductUrlById).mockResolvedValue(
      new Map([["書籍 入門", "https://example.com/japanese-book"]]),
    );
    const content = await renderMdx(
      "[書籍](<affiliate://書籍 入門>)\n\n[Reference][book]\n\n[book]: affiliate://%E6%9B%B8%E7%B1%8D%20%E5%85%A5%E9%96%80",
    );
    const html = renderToStaticMarkup(content);
    expect(html.match(/href="https:\/\/example.com\/japanese-book"/gu)).toHaveLength(2);
    expect(html).not.toContain("affiliate://");
  });

  it("未登録の ID はリンク切れを出力せずエラーにする", async () => {
    await expect(renderMdx("[Missing](affiliate://missing)")).rejects.toThrow(
      "未登録のアフィリエイトリンク ID: missing",
    );
  });

  it("開発時にリンク先を差し替えると同じ本文と目次付き本文にも反映する", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const source = "## Book\n\n[Book](affiliate://book)";
    const before = await renderMdx(source);
    const beforeWithToc = await renderMdxWithToc(source);

    vi.mocked(getAffiliateProductUrlById).mockResolvedValue(
      new Map([["book", "https://example.com/replacement"]]),
    );
    const after = await renderMdx(source);
    const afterWithToc = await renderMdxWithToc(source);

    expect(renderToStaticMarkup(before)).toContain('href="https://example.com/book"');
    expect(renderToStaticMarkup(beforeWithToc.content)).toBe(renderToStaticMarkup(before));
    expect(renderToStaticMarkup(after)).toContain('href="https://example.com/replacement"');
    expect(renderToStaticMarkup(afterWithToc.content)).toBe(renderToStaticMarkup(after));
    expect(afterWithToc.headings).toStrictEqual(beforeWithToc.headings);
  });
});
