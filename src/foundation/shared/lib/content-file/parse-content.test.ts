import { describe, expect, it } from "vite-plus/test";
import { asStringArray, asStringWithDefault } from "./frontmatter";
import { parseContent } from "./parse-content";

const normalize = (data: Record<string, unknown>) => ({
  title: asStringWithDefault(data["title"], "Untitled"),
  tags: asStringArray(data["tags"]) ?? [],
});

describe("parseContent", () => {
  it("不正なfrontmatterは何度読み込んでもエラーになる", () => {
    const raw = "---\ntitle: [invalid\n---\n本文\n";
    expect(() => parseContent(raw, normalize)).toThrow("unexpected end of the stream");
    expect(() => parseContent(raw, normalize)).toThrow("unexpected end of the stream");
  });

  it("正規化処理でデータを変更しても後の解析に影響しない", () => {
    const raw = "---\ntitle: Original\ntags: [TypeScript]\n---\n本文\n";
    parseContent(raw, (data) => {
      data["title"] = "Changed";
    });
    expect(parseContent(raw, normalize)).toStrictEqual({
      content: "本文\n",
      frontmatter: { title: "Original", tags: ["TypeScript"] },
    });
  });

  it("frontmatterのないMDXも本文を保って正規化する", () => {
    expect(parseContent("<Example />\n", normalize)).toStrictEqual({
      content: "<Example />\n",
      frontmatter: { title: "Untitled", tags: [] },
    });
  });
});
