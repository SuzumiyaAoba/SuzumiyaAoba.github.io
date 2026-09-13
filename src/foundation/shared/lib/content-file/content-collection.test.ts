import { describe, expect, it } from "vite-plus/test";
import { resolveLocalizedValue, type LocalizedValue } from "@/shared/lib/routing";
import { createContentCollection } from "./content-collection";

type Entry = {
  slug: string;
  content: string;
  frontmatter: { title: string; date?: string; draft?: boolean };
};

const entry = (slug: string, frontmatter: Partial<Entry["frontmatter"]> = {}): Entry => ({
  slug,
  content: `Body of ${slug}`,
  frontmatter: { title: slug, ...frontmatter },
});

const entries: Record<string, LocalizedValue<Entry>> = {
  older: { ja: entry("older", { date: "2025-01-01" }), en: null },
  translated: {
    ja: entry("translated", { date: "2026-01-01" }),
    en: entry("translated", { title: "Translation", date: "2026-02-01" }),
  },
  "english-only": { ja: null, en: entry("english-only", { date: "2026-01-01" }) },
  draft: { ja: entry("draft", { draft: true }), en: entry("draft") },
  "english-draft": { ja: null, en: entry("english-draft", { draft: true }) },
  undated: { ja: entry("undated"), en: null },
  missing: { ja: null, en: null },
};

const collection = createContentCollection({
  getSlugs: async () => Object.keys(entries),
  getContent: async (slug, { locale = "ja", fallback = true } = {}) => {
    const variants = entries[slug] ?? { ja: null, en: null };
    return fallback ? resolveLocalizedValue(variants, locale) : variants[locale];
  },
});

describe("createContentCollection", () => {
  it("公開一覧は下書き・欠落を除き、日付降順・同日はスラッグ昇順に並ぶ", async () => {
    expect((await collection.getAll()).map((item) => item.slug)).toEqual([
      "english-only",
      "translated",
      "older",
      "undated",
    ]);
  });

  it("翻訳一覧の公開状態と日付は日本語を優先し、英語だけの記事も含む", async () => {
    expect((await collection.getAllVariants()).map((item) => item.slug)).toEqual([
      "english-only",
      "translated",
      "older",
      "undated",
    ]);
  });

  it("バリアント取得では欠落した言語を補完しない", async () => {
    expect(await collection.getVariants("english-only")).toEqual({
      slug: "english-only",
      ja: null,
      en: entries["english-only"]!.en,
    });
    expect(await collection.getSummaryVariants("older")).toEqual({
      slug: "older",
      ja: { slug: "older", frontmatter: entries["older"]!.ja!.frontmatter },
      en: null,
    });
  });

  it("サマリーは本文を含まず、言語とフォールバックの指定を尊重する", async () => {
    expect(await collection.getSummary("older", { locale: "en", fallback: false })).toBeNull();
    expect(await collection.getSummary("older", { locale: "en" })).toEqual({
      slug: "older",
      frontmatter: entries["older"]!.ja!.frontmatter,
    });
    expect(await collection.getSummary("translated", { locale: "en" })).toMatchObject({
      frontmatter: { title: "Translation" },
    });
  });

  it("本文とサマリーの一覧で公開記事・順序が一致し、元データは変更されない", async () => {
    const before = structuredClone(entries);
    const full = await collection.getAllVariants();
    const summaries = await collection.getAllSummaryVariants();
    expect(summaries.map((item) => item.slug)).toEqual(full.map((item) => item.slug));
    for (const item of summaries) {
      if (item.ja) expect(item.ja).not.toHaveProperty("content");
      if (item.en) expect(item.en).not.toHaveProperty("content");
    }
    expect(entries).toEqual(before);
  });
});
