import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { LocalizedBlogPostSummary } from "@/entities/blog";
import sitemap from "../sitemap";
import {
  buildTagPageMetadata,
  buildTagPageStaticParams,
} from "./tag-page-metadata";

const { readPosts } = vi.hoisted(() => ({
  readPosts: vi.fn<() => Promise<LocalizedBlogPostSummary[]>>(),
}));
vi.mock(import("@/entities/blog/model/blog"), () => ({
  getBlogPostSummariesVariants: readPosts,
}));
vi.mock(import("@/entities/blog"), async () => ({
  ...(await import("@/entities/blog/model/blog-tags")),
  getBlogPostSummariesVariants: readPosts,
}));
vi.mock(import("@/entities/note"), () => ({
  getNoteSummariesVariants: async () => [],
}));
vi.mock(import("@/entities/series-item"), () => ({
  getSeriesList: async () => [],
}));
vi.mock(import("@/entities/book"), () => ({
  getBookSlugs: async () => [],
  getBookToc: async () => [],
  getBookMeta: async () => null,
}));
vi.mock(import("@/shared/lib/site/site-url"), () => ({
  getSiteUrl: () => "https://example.com",
}));

const posts: LocalizedBlogPostSummary[] = [
  {
    slug: "translated",
    ja: {
      slug: "translated",
      frontmatter: {
        title: "日本語記事",
        date: "2026-01-01",
        tags: ["日本語", "shared"],
      },
    },
    en: {
      slug: "translated",
      frontmatter: {
        title: "English article",
        date: "2026-02-01",
        tags: ["EnglishOnly", "shared"],
      },
    },
  },
  {
    slug: "ja-only",
    ja: {
      slug: "ja-only",
      frontmatter: {
        title: "翻訳なし",
        date: "2026-01-15",
        tags: ["shared", "shared"],
      },
    },
    en: null,
  },
];

beforeEach(() => readPosts.mockReset().mockResolvedValue(posts));

describe("タグの静的ルート・メタデータ・サイトマップ", () => {
  it("英語版だけのタグも両言語のサイトマップに含め、翻訳の最新日付を使う", async () => {
    const params = await buildTagPageStaticParams();
    expect(params).toContainEqual({ tag: "EnglishOnly" });
    expect(params).toContainEqual({ tag: "日本語" });
    expect(params).toContainEqual({ tag: encodeURIComponent("日本語") });
    const tagPages = (await sitemap()).filter((page) =>
      page.url.includes("/tags/")
    );
    for (const prefix of ["", "/en"]) {
      expect(tagPages).toContainEqual(
        expect.objectContaining({
          url: `https://example.com${prefix}/tags/EnglishOnly/`,
          lastModified: new Date("2026-02-01"),
        })
      );
      expect(tagPages).toContainEqual(
        expect.objectContaining({
          url: `https://example.com${prefix}/tags/shared/`,
          lastModified: new Date("2026-02-01"),
        })
      );
    }
  });

  it("記事内の重複を数えず、フォールバックを含めた件数をメタデータに反映する", async () => {
    const props = { params: Promise.resolve({ tag: "shared" }) };
    expect((await buildTagPageMetadata(props, "ja")).description).toBe(
      "「shared」タグの記事一覧（2件）。"
    );
    expect((await buildTagPageMetadata(props, "en")).description).toBe(
      'Posts tagged "shared" (2).'
    );
    const translatedProps = { params: Promise.resolve({ tag: "EnglishOnly" }) };
    expect(
      (await buildTagPageMetadata(translatedProps, "ja")).description
    ).toContain("0件");
    expect(
      (await buildTagPageMetadata(translatedProps, "en")).description
    ).toContain("(1)");
  });
});
