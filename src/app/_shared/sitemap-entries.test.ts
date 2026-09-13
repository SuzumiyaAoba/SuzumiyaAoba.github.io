import { describe, expect, it } from "vite-plus/test";
import { buildContentSitemapEntries, buildTranslatedSitemapEntries } from "./sitemap-entries";

const siteUrl = "https://example.com";
const buildTime = new Date("2026-01-01");

describe("sitemap entries", () => {
  it("URL・順序・明示された更新日時を保って両言語に展開する", () => {
    const updated = new Date("2025-12-01");
    expect(
      buildTranslatedSitemapEntries(
        [
          { path: "/", priority: 1, changeFrequency: "daily" },
          { path: "/tags/C%2B%2B/", lastModified: updated, priority: 0.6 },
        ],
        siteUrl,
        buildTime,
      ),
    ).toEqual([
      {
        url: "https://example.com/",
        lastModified: buildTime,
        priority: 1,
        changeFrequency: "daily",
      },
      { url: "https://example.com/tags/C%2B%2B/", lastModified: updated, priority: 0.6 },
      {
        url: "https://example.com/en/",
        lastModified: buildTime,
        priority: 1,
        changeFrequency: "daily",
      },
      { url: "https://example.com/en/tags/C%2B%2B/", lastModified: updated, priority: 0.6 },
    ]);
  });

  it("英語訳がないURLを除き、各言語の日付と日本語側のフォールバックを使う", () => {
    const ja = { frontmatter: { date: "2025-01-01" } };
    const en = { frontmatter: { date: "2025-02-01" } };
    const entries = buildContentSitemapEntries(
      [
        { slug: "both", ja, en },
        { slug: "ja-only", ja, en: null },
        { slug: "en-only", ja: null, en },
        { slug: "undated", ja: { frontmatter: {} }, en: null },
      ],
      { basePath: "/blog/post", siteUrl, priority: 0.7, buildTime },
    );
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://example.com/blog/post/both/",
      "https://example.com/blog/post/ja-only/",
      "https://example.com/blog/post/en-only/",
      "https://example.com/blog/post/undated/",
      "https://example.com/en/blog/post/both/",
      "https://example.com/en/blog/post/en-only/",
    ]);
    expect(entries.map((entry) => entry.lastModified)).toEqual([
      new Date("2025-01-01"),
      new Date("2025-01-01"),
      new Date("2025-02-01"),
      buildTime,
      new Date("2025-02-01"),
      new Date("2025-02-01"),
    ]);
  });
});
