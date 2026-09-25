import { expect, it } from "vite-plus/test";
import { getKeywordCategories } from "./catalog";
import { demoPresets } from "./demo-presets";

it("provides an explicit interactive comparison for every catalog keyword", async () => {
  const keywords = (await getKeywordCategories()).flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.keywords)
  );
  expect([...demoPresets.keys()].toSorted()).toStrictEqual(
    keywords.map((keyword) => keyword.slug).toSorted()
  );
  for (const keyword of keywords) {
    expect(demoPresets.get(keyword.slug), keyword.slug).toMatchObject({
      family: keyword.subcategoryId,
    });
    expect(
      demoPresets.get(keyword.slug)?.reference.length,
      keyword.slug
    ).toBeGreaterThan(3);
  }
});
