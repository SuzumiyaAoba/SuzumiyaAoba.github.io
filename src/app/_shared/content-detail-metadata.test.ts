import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { getBlogPost } from "@/entities/blog";
import { getNote } from "@/entities/note";
import { buildBlogPostMetadata } from "./blog-post-metadata";
import { buildNotesPageMetadata } from "./notes-page-metadata";
import { buildBooksPageMetadata } from "./books-page-metadata";
import { buildSeriesPageMetadata } from "./series-page-metadata";

let contentRoot = "";
vi.mock(import("@/shared/lib/content-file/content-root"), () => ({
  resolveContentRoot: async () => contentRoot,
}));
vi.mock(import("@/shared/lib/site/site-url"), () => ({
  getSiteUrl: () => "https://example.com",
}));

beforeAll(async () => {
  contentRoot = await mkdtemp(path.join(tmpdir(), "content-metadata-test-"));
  const articles = {
    "translated/index.md":
      "---\ntitle: 日本語タイトル\ndescription: 日本語の説明\ndate: 2026-01-02\ncategory: Testing\n---\n日本語の本文\n",
    "translated/index.en.mdx":
      "---\ntitle: English title\ndescription: English description\ndate: 2026-02-03\ncategory: Testing\n---\nEnglish body\n",
    "fallback/index.md":
      "---\ntitle: 翻訳なし\ncategory: Testing\nlayout: article\n---\n本文\n",
    "english-only/index.en.md":
      "---\ntitle: English only\ndescription: English description\n---\nBody\n",
    "empty/index.md":
      '---\ntitle: ""\ndate: ""\ncategory: ""\ndescription: ""\n---\n本文\n',
    "typed/index.md":
      '---\ntitle: 42\ncategory: 42\ndescription: false\ndate: 2026-01-02\ndraft: false\namazonAssociate: false\ntags: [one, 2, null]\namazonProductIds: []\nthumbnail: ""\nmodel: ""\nlayout: ""\n---\n本文\n',
  };
  const files: Record<string, string> = {
    "books/handbook/index.md":
      "---\ntitle: ハンドブック\n---\n## 概要\n\n[リンク](https://example.com) と**強調**。\n",
    "series/example.json": JSON.stringify({
      slug: "example",
      name: "連載",
      nameEn: "Series title",
      posts: ["one", "two"],
    }),
  };
  for (const collection of ["blog", "notes"]) {
    for (const [filename, content] of Object.entries(articles)) {
      files[`${collection}/${filename}`] = content;
    }
  }
  await Promise.all(
    Object.entries(files).map(async ([filename, content]) => {
      const target = path.join(contentRoot, filename);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    })
  );
});

afterAll(async () => {
  await rm(contentRoot, { recursive: true, force: true });
});

describe.each([
  {
    collection: "blog",
    build: buildBlogPostMetadata,
    read: getBlogPost,
    basePath: "/blog/post",
    fallbackTitle: "Blog",
    categoryDescription: "Testing article.",
    emptyDateMetadata: { publishedTime: "" },
    missingDateFields: { date: "", layout: "article" },
    emptyLayoutFields: { layout: "" },
  },
  {
    collection: "notes",
    build: buildNotesPageMetadata,
    read: getNote,
    basePath: "/notes",
    fallbackTitle: "Notes",
    categoryDescription: "Testing note.",
    emptyDateMetadata: {},
    missingDateFields: {},
    emptyLayoutFields: {},
  },
])(
  "$collection の読み込みと詳細メタデータ",
  ({
    build,
    read,
    basePath,
    fallbackTitle,
    categoryDescription,
    emptyDateMetadata,
    missingDateFields,
    emptyLayoutFields,
  }) => {
    it.each([
      {
        locale: "ja",
        title: "日本語タイトル",
        description: "日本語の説明",
        date: "2026-01-02",
        prefix: "",
        format: "md",
        content: "日本語の本文\n",
      },
      {
        locale: "en",
        title: "English title",
        description: "English description",
        date: "2026-02-03",
        prefix: "/en",
        format: "mdx",
        content: "English body\n",
      },
    ] as const)(
      "$locale版の本文・日付・説明と自己参照canonicalを使用する",
      async ({ locale, title, description, date, prefix, format, content }) => {
        const pagePath = `${basePath}/translated/`;
        await expect(build("translated", locale)).resolves.toStrictEqual({
          title,
          description,
          alternates: {
            canonical: `${prefix}${pagePath}`,
            languages: {
              ja: `https://example.com${pagePath}`,
              en: `https://example.com/en${pagePath}`,
              "x-default": `https://example.com${pagePath}`,
            },
          },
          openGraph: {
            title,
            description,
            type: "article",
            publishedTime: date,
          },
        });
        await expect(read("translated", { locale })).resolves.toMatchObject({
          format,
          content,
        });
      }
    );

    it("翻訳がなくてもcanonicalは閲覧言語を指し、存在しないhreflangを作らない", async () => {
      await expect(build("fallback", "en")).resolves.toMatchObject({
        title: "翻訳なし",
        description: categoryDescription,
        alternates: { canonical: `/en${basePath}/fallback/` },
      });
      expect((await build("fallback", "en")).alternates).not.toHaveProperty(
        "languages"
      );
      expect((await build("english-only", "ja")).alternates).toStrictEqual({
        canonical: `${basePath}/english-only/`,
      });
    });

    it("タイトルと説明が空ならslugを使い、日付の必須・任意の違いを保つ", async () => {
      await expect(build("empty", "ja")).resolves.toStrictEqual({
        title: "empty",
        description: "empty",
        alternates: { canonical: `${basePath}/empty/` },
        openGraph: {
          title: "empty",
          description: "empty",
          type: "article",
          ...emptyDateMetadata,
        },
      });
      expect((await read("fallback"))?.frontmatter).toStrictEqual({
        title: "翻訳なし",
        category: "Testing",
        ...missingDateFields,
      });
    });

    it("型の異なる項目を除外し、false・空配列・空文字を維持する", async () => {
      expect((await read("typed"))?.frontmatter).toStrictEqual({
        title: "",
        date: "2026-01-02",
        draft: false,
        amazonAssociate: false,
        tags: ["one"],
        amazonProductIds: [],
        thumbnail: "",
        model: "",
        ...emptyLayoutFields,
      });
    });

    it.each([undefined, "missing"])(
      "記事が解決できない場合は一覧名だけを返す (%s)",
      async (slug) => {
        await expect(build(slug, "ja")).resolves.toStrictEqual({
          title: fallbackTitle,
        });
      }
    );
  }
);

describe("書籍とシリーズの詳細メタデータ", () => {
  it("書籍は概要のMarkdownを取り除き、日本語のcanonicalだけを設定する", async () => {
    await expect(buildBooksPageMetadata("handbook")).resolves.toStrictEqual({
      title: "ハンドブック",
      description: "概要 リンク と強調。",
      alternates: { canonical: "/books/handbook/" },
      openGraph: {
        type: "book",
        title: "ハンドブック",
        description: "概要 リンク と強調。",
      },
    });
    await expect(buildBooksPageMetadata("missing")).resolves.toStrictEqual({
      title: "Books",
    });
  });

  it("シリーズは言語別タイトルと記事数、両言語への参照を設定する", async () => {
    await expect(
      buildSeriesPageMetadata("example", "en")
    ).resolves.toStrictEqual({
      title: "Series title",
      description: "Series title — a series of 2 posts.",
      alternates: {
        canonical: "/en/series/example/",
        languages: {
          ja: "https://example.com/series/example/",
          en: "https://example.com/en/series/example/",
          "x-default": "https://example.com/series/example/",
        },
      },
      openGraph: {
        type: "website",
        title: "Series title",
        description: "Series title — a series of 2 posts.",
      },
    });
    expect((await buildSeriesPageMetadata("example", "ja")).description).toBe(
      "「連載」シリーズの記事一覧（全2件）。"
    );
    await expect(
      buildSeriesPageMetadata("missing", "ja")
    ).resolves.toStrictEqual({
      title: "Series",
    });
  });
});
