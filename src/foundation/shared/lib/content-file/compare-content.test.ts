import { describe, expect, it } from "vite-plus/test";
import { compareContentByDate, compareLocalizedContentByDate } from "./compare-content";

function entry(slug: string, date?: string) {
  return { slug, frontmatter: date === undefined ? {} : { date } };
}

describe("compareContentByDate", () => {
  it("日付の降順に並べ、日付がない記事は末尾に置く", () => {
    const entries = [entry("undated"), entry("old", "2025-01-01"), entry("new", "2026-01-01")];
    expect(entries.toSorted(compareContentByDate).map(({ slug }) => slug)).toStrictEqual([
      "new",
      "old",
      "undated",
    ]);
  });

  it.each(["2026-01-01", "", undefined])("日付が同じ場合はスラッグの昇順になる (%s)", (date) => {
    const entries = [entry("b", date), entry("a", date)];
    expect(entries.toSorted(compareContentByDate).map(({ slug }) => slug)).toStrictEqual([
      "a",
      "b",
    ]);
  });

  it("同じ記事は同値として扱い、比較の向きを反転すると符号も反転する", () => {
    const a = entry("a", "2026-01-01");
    const b = entry("b", "2026-01-01");
    expect(compareContentByDate(a, a)).toBe(0);
    expect(Math.sign(compareContentByDate(a, b))).toBe(-Math.sign(compareContentByDate(b, a)));
  });
});

describe("compareLocalizedContentByDate", () => {
  it("日本語版を優先し、日本語版がなければ英語版の日付を使う", () => {
    const entries = [
      { slug: "both", ja: entry("both", "2025-01-01"), en: entry("both", "2027-01-01") },
      { slug: "en-only", ja: null, en: entry("en-only", "2026-01-01") },
      { slug: "missing", ja: null, en: null },
    ];
    expect(entries.toSorted(compareLocalizedContentByDate).map(({ slug }) => slug)).toStrictEqual([
      "en-only",
      "both",
      "missing",
    ]);
  });

  it("同日付の多言語記事もスラッグで安定して並ぶ", () => {
    const a = { slug: "a", ja: entry("a", "2026-01-01"), en: null };
    const b = { slug: "b", ja: null, en: entry("b", "2026-01-01") };
    expect([b, a].toSorted(compareLocalizedContentByDate)).toStrictEqual([a, b]);
    expect(compareLocalizedContentByDate(a, a)).toBe(0);
  });
});
