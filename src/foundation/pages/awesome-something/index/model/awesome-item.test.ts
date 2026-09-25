import type { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vite-plus/test";
import { stringify } from "yaml";
import { parseAwesomeItems } from "./awesome-item";
import { getAwesomeItems } from "./awesome-items";

const files = vi.hoisted(() => ({ readFile: vi.fn<typeof readFile>() }));
// oxlint-disable-next-line vitest/prefer-import-in-mock -- UTF-8 読み込みのみのモックは fs の全オーバーロードを実装しない。
vi.mock("node:fs/promises", () => files);
vi.mock(import("@/shared/lib/content-file"), () => ({
  resolveContentDeps: async () => {
    const { default: path } = await import("node:path");
    const fs = await import("node:fs/promises");
    return { fs, path, root: "/mock/content" };
  },
}));

const item = {
  id: "example-tool",
  name: "Example Tool",
  category: "development",
  subcategory: "coding-agents",
  description: "作業を便利にするツール。",
};

describe("Awesome Something の YAML", () => {
  it("複数行の説明・URL・タイトル付き記事を読み込み、記載順を保つ", () => {
    const items = parseAwesomeItems(`
items:
  - id: example-tool
    name: Example Tool
    category: development
    subcategory: coding-agents
    tags: [TypeScript, 自動化]
    description: |-
      作業を便利にするツール。
      気になった点のメモ。
    websiteUrl: https://example.com/
    githubUrl: https://github.com/example/tool
    articles:
      - https://example.com/intro
      - title: 活用例
        url: https://example.com/guide
    relatedPosts:
      - /blog/post/example-tool/
      - title: 英語の記事
        url: /en/blog/post/example-tool/#usage
      - https://suzumiyaaoba.com/notes/example-tool/
  - id: another-tool
    name: Another Tool
    category: ai-agents
    subcategory: chat
    description: 次に見つけたツール。
`);
    expect(items.map((entry) => entry.id)).toStrictEqual([
      "example-tool",
      "another-tool",
    ]);
    expect(items[0]).toMatchObject({
      tags: ["TypeScript", "自動化"],
      description: "作業を便利にするツール。\n気になった点のメモ。",
      websiteUrl: "https://example.com/",
      githubUrl: "https://github.com/example/tool",
      articles: [
        { url: "https://example.com/intro" },
        { title: "活用例", url: "https://example.com/guide" },
      ],
      relatedPosts: [
        { url: "/blog/post/example-tool/" },
        { title: "英語の記事", url: "/en/blog/post/example-tool/#usage" },
        { url: "https://suzumiyaaoba.com/notes/example-tool/" },
      ],
    });
  });

  it.each([
    {},
    {
      tags: null,
      websiteUrl: null,
      githubUrl: "  ",
      articles: null,
      relatedPosts: [],
    },
    { tags: [] },
  ])("省略・空欄の任意項目を扱える: %j", (optional) => {
    const [entry] = parseAwesomeItems(
      stringify({ items: [{ ...item, ...optional }] })
    );
    expect(entry).toMatchObject({
      ...item,
      tags: [],
      articles: [],
      relatedPosts: [],
    });
    expect(entry?.websiteUrl).toBeUndefined();
    expect(entry?.githubUrl).toBeUndefined();
  });

  it("タグの前後の空白と重複を除き、記載順を保つ", () => {
    const [entry] = parseAwesomeItems(
      stringify({
        items: [{ ...item, tags: [" TypeScript ", "自動化", "TypeScript"] }],
      })
    );
    expect(entry?.tags).toStrictEqual(["TypeScript", "自動化"]);
  });

  it.each(["TypeScript", [""], ["  "], [null], [123]])(
    "文字列リストでないタグや空のタグを拒否する: %j",
    (tags) => {
      expect(() =>
        parseAwesomeItems(stringify({ items: [{ ...item, tags }] }))
      ).toThrow("items.0.tags");
    }
  );

  it("記録がない場合は明示的な空リストを使える", () => {
    expect(parseAwesomeItems("items: []")).toStrictEqual([]);
  });

  it("重複する ID の位置がわかるエラーを返す", () => {
    expect(() => parseAwesomeItems(stringify({ items: [item, item] }))).toThrow(
      "items.1.id: ID が重複しています: example-tool"
    );
  });

  it.each([
    { websiteUrl: "not-a-url" },
    { githubUrl: "javascript:alert(1)" },
    { articles: ["/blog/post/example/"] },
    { articles: [{ url: "ftp://example.com/file" }] },
    { relatedPosts: ["//example.com/post"] },
    { relatedPosts: [String.raw`/\example.com/post`] },
    { relatedPosts: ["blog/post/example/"] },
    { relatedPosts: ["javascript:alert(1)"] },
  ])("不正な URL を含む記録を拒否する: %j", (invalid) => {
    expect(() =>
      parseAwesomeItems(stringify({ items: [{ ...item, ...invalid }] }))
    ).toThrow("awesome-something.yaml");
  });

  it.each([
    { id: "Invalid ID" },
    { name: " " },
    { category: "" },
    { category: "unknown" },
    { subcategory: "" },
    { subcategory: undefined },
    { subcategory: "chat" },
    { description: null },
    { website: "https://example.com/" },
  ])("必須項目やフィールド名の誤りを検出する: %j", (invalid) => {
    expect(() =>
      parseAwesomeItems(stringify({ items: [{ ...item, ...invalid }] }))
    ).toThrow("awesome-something.yaml");
  });

  it.each(["", "items:", "entries: []", "items: [", "items: []\nitems: []"])(
    "壊れた YAML を空リストとして扱わない: %s",
    (source) => {
      expect(() => parseAwesomeItems(source)).toThrow("awesome-something.yaml");
    }
  );

  it("管理ファイルの更新を次の読み込みに反映する", async () => {
    files.readFile.mockResolvedValueOnce(stringify({ items: [item] }));
    await expect(getAwesomeItems()).resolves.toHaveLength(1);
    expect(files.readFile).toHaveBeenLastCalledWith(
      "/mock/content/awesome-something.yaml",
      "utf-8"
    );

    files.readFile.mockResolvedValueOnce("items: []");
    await expect(getAwesomeItems()).resolves.toStrictEqual([]);
  });

  it("読み込みに失敗したときはエラーを隠さない", async () => {
    files.readFile.mockRejectedValueOnce(
      new Error("ENOENT: awesome-something.yaml")
    );
    await expect(getAwesomeItems()).rejects.toThrow("ENOENT");
  });
});
