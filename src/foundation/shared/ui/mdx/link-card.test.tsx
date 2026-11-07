import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { getLinkCard } from "@/shared/lib/mdx/link-card/link-cards";

import { LinkCard } from "./link-card";

vi.mock(import("@/shared/lib/mdx/link-card/link-cards"), () => ({
  getLinkCard: vi.fn<typeof getLinkCard>(),
}));

const URL_WITH_DATA = "https://example.com/post";

async function render(props: Parameters<typeof LinkCard>[0]) {
  return renderToStaticMarkup(await LinkCard(props));
}

describe("LinkCard", () => {
  beforeEach(() => {
    vi.mocked(getLinkCard).mockReset();
  });

  it("登録済みの題と要約をホスト名とともに表示し、別タブで開く", async () => {
    vi.mocked(getLinkCard).mockResolvedValue({
      title: "記事の題",
      description: "記事の要約",
    });

    const html = await render({ url: URL_WITH_DATA });

    expect(html).toContain(`href="${URL_WITH_DATA}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(">記事の題<");
    expect(html).toContain(">記事の要約<");
    expect(html).toContain(">example.com<");
  });

  it("未登録の URL はホスト名だけで表示し、要約は出さない", async () => {
    vi.mocked(getLinkCard).mockResolvedValue(undefined);

    const html = await render({ url: URL_WITH_DATA });

    expect(html).toContain('<span class="link-card-title">example.com</span>');
    expect(html).not.toContain("link-card-description");
  });

  it("title と description を渡すと登録済みの値より優先する", async () => {
    vi.mocked(getLinkCard).mockResolvedValue({
      title: "登録済みの題",
      description: "登録済みの要約",
    });

    const html = await render({
      url: URL_WITH_DATA,
      title: "指定した題",
      description: "指定した要約",
    });

    expect(html).toContain(">指定した題<");
    expect(html).toContain(">指定した要約<");
    expect(html).not.toContain("登録済み");
  });

  it("http(s) 以外の url は例外にする", async () => {
    await expect(LinkCard({ url: "javascript:alert(1)" })).rejects.toThrow(
      "http(s)"
    );
    await expect(LinkCard({ url: "not a url" })).rejects.toThrow("http(s)");
  });
});
