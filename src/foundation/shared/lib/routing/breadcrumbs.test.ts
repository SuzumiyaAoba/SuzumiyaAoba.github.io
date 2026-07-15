import { describe, it, expect, vi } from "vitest";
import { buildBreadcrumbList, buildDetailBreadcrumbItems, type BreadcrumbItem } from "./breadcrumbs";

// Mock the site-config module (transitive dependency)
vi.mock("@/shared/lib/site/site-config", () => ({
  getSiteConfig: () => ({
    siteUrl: "https://suzumiyaaoba.com",
  }),
}));

// Mock the site-url module
vi.mock("@/shared/lib/site/site-url", () => ({
  getSiteUrl: () => "https://suzumiyaaoba.com",
}));

describe("buildBreadcrumbList", () => {
  it("単一アイテムで正しいJSON-LD構造を生成する", () => {
    const items: BreadcrumbItem[] = [{ name: "ホーム", path: "/" }];

    const result = buildBreadcrumbList(items);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ホーム",
          item: "https://suzumiyaaoba.com/",
        },
      ],
    });
  });

  it("複数アイテムで正しい位置番号を設定する", () => {
    const items: BreadcrumbItem[] = [
      { name: "ホーム", path: "/" },
      { name: "ブログ", path: "/blog" },
      { name: "記事タイトル", path: "/blog/my-article" },
    ];

    const result = buildBreadcrumbList(items);

    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[0]!.position).toBe(1);
    expect(result.itemListElement[1]!.position).toBe(2);
    expect(result.itemListElement[2]!.position).toBe(3);
  });

  it("サイトURLとパスを正しく結合する", () => {
    const items: BreadcrumbItem[] = [
      { name: "タグ", path: "/tags" },
      { name: "プログラミング", path: "/tags/programming" },
    ];

    const result = buildBreadcrumbList(items);

    expect(result.itemListElement[0]!.item).toBe("https://suzumiyaaoba.com/tags");
    expect(result.itemListElement[1]!.item).toBe("https://suzumiyaaoba.com/tags/programming");
  });

  it("空の配列で空のitemListElementを返す", () => {
    const items: BreadcrumbItem[] = [];

    const result = buildBreadcrumbList(items);

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
  });

  it("日本語のパス名を正しく処理する", () => {
    const items: BreadcrumbItem[] = [{ name: "タグ一覧", path: "/tags/日本語" }];

    const result = buildBreadcrumbList(items);

    expect(result.itemListElement[0]!.name).toBe("タグ一覧");
    expect(result.itemListElement[0]!.item).toBe("https://suzumiyaaoba.com/tags/日本語");
  });
});

describe("buildDetailBreadcrumbItems", () => {
  it("Home > セクション > 詳細アイテムの3階層を組み立てる(ja)", () => {
    const result = buildDetailBreadcrumbItems(
      "ja",
      { name: "Books", path: "/books" },
      { name: "Java入門", path: "/books/java-abc" },
    );

    expect(result).toEqual([
      { name: "Home", path: "/" },
      { name: "Books", path: "/books/" },
      { name: "Java入門", path: "/books/java-abc" },
    ]);
  });

  it("enロケールではセクションパスにen接頭辞を付与する", () => {
    const result = buildDetailBreadcrumbItems(
      "en",
      { name: "Books", path: "/books" },
      { name: "Java Basics", path: "/en/books/java-abc" },
    );

    expect(result).toEqual([
      { name: "Home", path: "/en/" },
      { name: "Books", path: "/en/books/" },
      { name: "Java Basics", path: "/en/books/java-abc" },
    ]);
  });

  it("itemのpathはそのまま(呼び出し側で解決済み)使われる", () => {
    const result = buildDetailBreadcrumbItems(
      "ja",
      { name: "Tags", path: "/tags" },
      { name: "programming", path: "/tags/programming/" },
    );

    expect(result[2]).toEqual({ name: "programming", path: "/tags/programming/" });
  });
});
