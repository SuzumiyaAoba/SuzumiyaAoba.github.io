/* eslint-disable @next/next/no-img-element -- MDX の img 出力と基準パスを検証するためのモック。 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/shared/lib/mdx/components", () => ({ mdxComponents: {} }));
vi.mock("@/shared/lib/affiliate-products", () => ({
  getAffiliateProductUrlById: async () => new Map([["book", "https://example.com/book"]]),
}));
vi.mock("@/shared/ui/mdx/img", () => ({
  Img: ({ src, alt, basePath }: { src: string; alt?: string; basePath?: string }) => (
    <img src={basePath ? `${basePath}/${src}` : src} alt={alt ?? ""} />
  ),
}));

import { renderMdx, renderMdxWithToc } from "./render-mdx";

afterEach(() => vi.unstubAllEnvs());

describe("MDX rendering", () => {
  it("本文と目次付き本文で同じHTMLを生成する", async () => {
    const source = "## Hello\n\nA **bold** paragraph.\n\n### Details";
    const plain = await renderMdx(source);
    const withToc = await renderMdxWithToc(source);
    expect(renderToStaticMarkup(withToc.content)).toBe(renderToStaticMarkup(plain));
    expect(withToc.headings).toEqual([
      { id: "hello", text: "Hello", level: 2 },
      { id: "details", text: "Details", level: 3 },
    ]);
  });

  it("目次・見出し・自己リンクに同じIDプレフィックスを付ける", async () => {
    const { content, headings } = await renderMdxWithToc("## Intro\n\n## Intro", {
      idPrefix: "chapter-",
    });
    const html = renderToStaticMarkup(content);
    expect(headings.map((heading) => heading.id)).toEqual(["chapter-intro", "chapter-intro-1"]);
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
});
