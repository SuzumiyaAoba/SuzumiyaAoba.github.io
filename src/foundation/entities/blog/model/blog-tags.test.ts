import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { getBlogPostSummariesVariants, type BlogPostSummary } from "./blog";
import { getAllBlogTags, getBlogTagIndex, groupBlogPostsByTag } from "./blog-tags";

vi.mock("./blog", () => ({ getBlogPostSummariesVariants: vi.fn() }));

function post(slug: string, tags: string[], date = "2026-01-01"): BlogPostSummary {
  return { slug, frontmatter: { title: slug, date, tags } };
}

beforeEach(() => vi.mocked(getBlogPostSummariesVariants).mockReset());

describe("ブログのタグ集計", () => {
  it("空タグを除外し、記事内の重複を数えず、記事の順番を維持する", () => {
    const newest = post("new", ["TypeScript", "TypeScript", ""]);
    const oldest = post("old", ["React", "TypeScript"]);
    const index = groupBlogPostsByTag([newest, oldest]);
    expect([...index.keys()]).toEqual(["TypeScript", "React"]);
    expect(index.get("TypeScript")).toEqual([newest, oldest]);
    expect(index.get("React")).toEqual([oldest]);
  });

  it("各言語のタグを選び、翻訳がない場合だけフォールバックする", async () => {
    const ja = post("translated", ["日本語"]);
    const en = post("translated", ["English"]);
    const jaOnly = post("ja-only", ["日本語"]);
    vi.mocked(getBlogPostSummariesVariants).mockResolvedValue([
      { slug: "translated", ja, en },
      { slug: "ja-only", ja: jaOnly, en: null },
      { slug: "empty", ja: post("empty", ["日本語"]), en: post("empty", []) },
      { slug: "missing", ja: null, en: null },
    ]);
    const jaIndex = await getBlogTagIndex("ja");
    const enIndex = await getBlogTagIndex("en");
    expect(jaIndex.get("日本語")?.map((entry) => entry.slug)).toEqual([
      "translated",
      "ja-only",
      "empty",
    ]);
    expect(enIndex.get("English")).toEqual([en]);
    expect(enIndex.get("日本語")).toEqual([jaOnly]);
  });

  it("全言語のタグを集め、翻訳も含めた最新の有効日付を採用する", async () => {
    vi.mocked(getBlogPostSummariesVariants).mockResolvedValue([
      {
        slug: "translated",
        ja: post("translated", ["共通", "日本語"], "2026-01-01"),
        en: post("translated", ["共通", "English"], "2026-03-01"),
      },
      { slug: "invalid", ja: post("invalid", ["共通", "日付なし"], "invalid"), en: null },
      { slug: "older", ja: post("older", ["共通"], "2025-01-01"), en: null },
    ]);
    expect(await getAllBlogTags()).toEqual([
      { name: "共通", lastModified: new Date("2026-03-01") },
      { name: "日本語", lastModified: new Date("2026-01-01") },
      { name: "English", lastModified: new Date("2026-03-01") },
      { name: "日付なし", lastModified: undefined },
    ]);
  });

  it("記事がなければ空の索引とタグ一覧を返す", async () => {
    vi.mocked(getBlogPostSummariesVariants).mockResolvedValue([]);
    expect((await getBlogTagIndex("ja")).size).toBe(0);
    expect(await getAllBlogTags()).toEqual([]);
  });
});
