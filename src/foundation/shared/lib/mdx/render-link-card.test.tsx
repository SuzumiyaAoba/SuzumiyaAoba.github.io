import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { getLinkCard } from "@/shared/lib/mdx/link-card/link-cards";
import { renderHtml } from "@/shared/lib/presentation/islands/server";

import { renderMdx } from "./render-mdx";

vi.mock(import("@/shared/lib/mdx/link-card/link-cards"), () => ({
  getLinkCard: vi.fn<typeof getLinkCard>(),
}));

/** MDX は block 要素の間に改行のテキストを入れるので、空白を許す。 */
const PARAGRAPH_THEN_CARD = /<\/p>\s*<a class="link-card"/u;
const CARD_THEN_PARAGRAPH = /<\/a>\s*<p>後の段落<\/p>/u;
const CARD_INSIDE_PARAGRAPH = /<p>\s*<a class="link-card"/u;

// 本番のページと同じく、MDX の変換結果を renderHtml で描画する。
// 実際の mdxComponents を使うので、登録漏れや async コンポーネントの扱いも確かめられる。
async function renderToHtml(source: string) {
  return await renderHtml(await renderMdx(source));
}

describe("MDX の LinkCard", () => {
  beforeEach(() => {
    vi.mocked(getLinkCard).mockReset();
  });

  it("単独行の LinkCard を段落に包まず、登録した題と要約で描画する", async () => {
    vi.mocked(getLinkCard).mockResolvedValue({
      title: "記事の題",
      description: "記事の要約",
    });

    const html = await renderToHtml(
      '前の段落\n\n<LinkCard url="https://example.com/post" />\n\n後の段落'
    );

    // 前後の段落とは兄弟になり、<p> の中に <a> が入らない。
    expect(html).toMatch(PARAGRAPH_THEN_CARD);
    expect(html).toMatch(CARD_THEN_PARAGRAPH);
    expect(html).not.toMatch(CARD_INSIDE_PARAGRAPH);
    expect(html).toContain('href="https://example.com/post"');
    expect(html).toContain(">記事の題<");
    expect(html).toContain(">記事の要約<");
    expect(getLinkCard).toHaveBeenCalledWith("https://example.com/post");
  });

  it("未登録の URL はホスト名だけで描画し、ビルドを止めない", async () => {
    vi.mocked(getLinkCard).mockResolvedValue(undefined);

    const html = await renderToHtml(
      '<LinkCard url="https://example.com/none" />'
    );

    expect(html).toContain('<span class="link-card-title">example.com</span>');
    expect(html).not.toContain("link-card-description");
  });
});
