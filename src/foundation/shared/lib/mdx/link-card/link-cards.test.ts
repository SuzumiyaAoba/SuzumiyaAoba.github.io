import type { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const files = vi.hoisted(() => ({
  readFile: vi.fn<typeof readFile>(),
}));
// oxlint-disable-next-line vitest/prefer-import-in-mock -- UTF-8 読み込みのみのモックは fs の全オーバーロードを実装しない。
vi.mock("node:fs/promises", () => files);

vi.mock(import("@/shared/lib/content-file"), () => ({
  resolveContentDeps: async () => ({
    fs: await import("node:fs/promises"),
    path,
    root: "/mock/content",
  }),
}));

async function importGetLinkCard() {
  vi.resetModules();
  const { getLinkCard } = await import("./link-cards");
  return getLinkCard;
}

describe("getLinkCard", () => {
  beforeEach(() => {
    files.readFile.mockReset();
  });

  it("content/link-cards.json から URL に対応する題と要約を返す", async () => {
    files.readFile.mockResolvedValue(
      JSON.stringify({
        "https://example.com/a": { title: "A", description: "A の要約" },
        "https://example.com/b": { title: "B" },
      })
    );
    const getLinkCard = await importGetLinkCard();

    await expect(getLinkCard("https://example.com/a")).resolves.toStrictEqual({
      title: "A",
      description: "A の要約",
    });
    await expect(getLinkCard("https://example.com/b")).resolves.toStrictEqual({
      title: "B",
    });
    expect(files.readFile).toHaveBeenCalledWith(
      "/mock/content/link-cards.json",
      "utf-8"
    );
  });

  it("未登録の URL は undefined を返す", async () => {
    files.readFile.mockResolvedValue("{}");
    const getLinkCard = await importGetLinkCard();

    await expect(
      getLinkCard("https://example.com/none")
    ).resolves.toBeUndefined();
  });

  it("題が空など構造が壊れたデータは例外にする", async () => {
    files.readFile.mockResolvedValue(
      JSON.stringify({ "https://example.com/a": { title: "" } })
    );
    const getLinkCard = await importGetLinkCard();

    await expect(getLinkCard("https://example.com/a")).rejects.toThrow(
      /title/u
    );
  });
});
