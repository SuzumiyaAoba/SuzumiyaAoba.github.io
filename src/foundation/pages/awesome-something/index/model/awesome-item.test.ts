import { describe, expect, it, vi } from "vite-plus/test";
import { stringify } from "yaml";
import { parseAwesomeItems } from "./awesome-item";
import { getAwesomeItems } from "./awesome-items";

const files = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock("node:fs/promises", () => files);
vi.mock("@/shared/lib/content-file", () => ({
  resolveContentRoot: () => Promise.resolve("/mock/content"),
}));

const item = {
  id: "example-tool",
  name: "Example Tool",
  category: "開発ツール",
  description: "作業を便利にするツール。",
};

describe("Awesome Something の YAML", () => {
  it("複数行の説明・URL・タイトル付き記事を読み込み、記載順を保つ", () => {
    const items = parseAwesomeItems(`
items:
  - id: example-tool
    name: Example Tool
    category: 開発ツール
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
    category: サービス
    description: 次に見つけたツール。
`);
    expect(items.map((entry) => entry.id)).toEqual(["example-tool", "another-tool"]);
    expect(items[0]).toMatchObject({
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

  it.each([{}, { websiteUrl: null, githubUrl: "  ", articles: null, relatedPosts: [] }])(
    "省略・空欄の任意項目を扱える: %j",
    (optional) => {
      const [entry] = parseAwesomeItems(stringify({ items: [{ ...item, ...optional }] }));
      expect(entry).toMatchObject({ ...item, articles: [], relatedPosts: [] });
      expect(entry?.websiteUrl).toBeUndefined();
      expect(entry?.githubUrl).toBeUndefined();
    },
  );

  it("記録がない場合は明示的な空リストを使える", () => {
    expect(parseAwesomeItems("items: []")).toEqual([]);
  });

  it("重複する ID の位置がわかるエラーを返す", () => {
    expect(() => parseAwesomeItems(stringify({ items: [item, item] }))).toThrow(
      "items.1.id: ID が重複しています: example-tool",
    );
  });

  it.each([
    { websiteUrl: "not-a-url" },
    { githubUrl: "javascript:alert(1)" },
    { articles: ["/blog/post/example/"] },
    { articles: [{ url: "ftp://example.com/file" }] },
    { relatedPosts: ["//example.com/post"] },
    { relatedPosts: ["/\\example.com/post"] },
    { relatedPosts: ["blog/post/example/"] },
    { relatedPosts: ["javascript:alert(1)"] },
  ])("不正な URL を含む記録を拒否する: %j", (invalid) => {
    expect(() => parseAwesomeItems(stringify({ items: [{ ...item, ...invalid }] }))).toThrow(
      "awesome-something.yaml",
    );
  });

  it.each([
    { id: "Invalid ID" },
    { name: " " },
    { category: "" },
    { description: null },
    { website: "https://example.com/" },
  ])("必須項目やフィールド名の誤りを検出する: %j", (invalid) => {
    expect(() => parseAwesomeItems(stringify({ items: [{ ...item, ...invalid }] }))).toThrow(
      "awesome-something.yaml",
    );
  });

  it.each(["", "items:", "entries: []", "items: [", "items: []\nitems: []"])(
    "壊れた YAML を空リストとして扱わない: %s",
    (source) => {
      expect(() => parseAwesomeItems(source)).toThrow("awesome-something.yaml");
    },
  );

  it("管理ファイルの更新を次の読み込みに反映する", async () => {
    files.readFile.mockResolvedValueOnce(stringify({ items: [item] }));
    expect(await getAwesomeItems()).toHaveLength(1);
    expect(files.readFile).toHaveBeenLastCalledWith("/mock/content/awesome-something.yaml", "utf8");

    files.readFile.mockResolvedValueOnce("items: []");
    expect(await getAwesomeItems()).toEqual([]);
  });

  it("読み込みに失敗したときはエラーを隠さない", async () => {
    files.readFile.mockRejectedValueOnce(new Error("ENOENT: awesome-something.yaml"));
    await expect(getAwesomeItems()).rejects.toThrow("ENOENT");
  });
});
