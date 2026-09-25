import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vite-plus/test";
import { parseAwesomeItems } from "./awesome-item";
import {
  AWESOME_CATEGORIES,
  resolveAwesomeSelection,
} from "./awesome-categories";
import {
  getAwesomeCatalog,
  getAwesomeStaticParams,
  selectAwesomeItems,
} from "./awesome-catalog";

describe("Awesome Something のカテゴリ導線", () => {
  it("全掲載項目が有効なサブカテゴリのURLから一度ずつ見つかり、カードの件数が一致する", async () => {
    const items = parseAwesomeItems(
      await readFile("content/awesome-something.yaml", "utf-8")
    );
    const catalog = getAwesomeCatalog(items);
    expect(catalog.reduce((count, category) => count + category.count, 0)).toBe(
      items.length
    );
    const routes = getAwesomeStaticParams(items);
    expect(new Set(routes.map(({ category }) => category.join("/"))).size).toBe(
      routes.length
    );
    const reachedIds: string[] = [];
    const leafCounts: { path: string; count: number }[] = [];
    for (const { category: segments } of routes) {
      const selection = resolveAwesomeSelection(segments);
      expect(selection).toBeDefined();
      if (!selection) {
        throw new Error(`Invalid generated route: ${segments.join("/")}`);
      }
      const selected = selectAwesomeItems(items, selection);
      expect(selected.length).toBeGreaterThan(0);
      if (selection.subcategory) {
        reachedIds.push(...selected.map((item) => item.id));
        leafCounts.push({ path: segments.join("/"), count: selected.length });
      }
    }
    expect(reachedIds.toSorted()).toStrictEqual(
      items.map((item) => item.id).toSorted()
    );
    expect(leafCounts).toStrictEqual(
      catalog.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          path: `${category.id}/${subcategory.id}`,
          count: subcategory.count,
        }))
      )
    );
  });

  it.each([
    [],
    ["missing"],
    ["all", "extra"],
    ["development", "chat"],
    ["design", "components", "extra"],
  ])("存在しない階層を別の一覧として扱わない: %j", (...segments) => {
    expect(resolveAwesomeSelection(segments)).toBeUndefined();
  });

  it("空のカテゴリにリンクしない", () => {
    expect(getAwesomeCatalog([])).toStrictEqual([]);
    expect(getAwesomeStaticParams([])).toStrictEqual([{ category: ["all"] }]);
  });

  it("全件へのリンクと親カテゴリへのリンクを解決する", () => {
    expect(resolveAwesomeSelection(["all"])).toStrictEqual({});
    expect(resolveAwesomeSelection(["development"])?.category?.id).toBe(
      "development"
    );
    expect(
      new Set(AWESOME_CATEGORIES.map((category) => category.id)).size
    ).toBe(AWESOME_CATEGORIES.length);
  });
});
